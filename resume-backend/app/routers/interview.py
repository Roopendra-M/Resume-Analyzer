# app/routers/interview.py
"""
Mock Interview Router

Provides AI-powered mock interview practice with 4 types:
1. Technical - Coding and system design questions
2. Behavioral - STAR method questions
3. HR - General HR and culture fit questions
4. Case Study - Business case analysis

Uses Groq AI for generating questions and evaluating answers.
"""

from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from app.db import db
from app.security import get_current_user
from app.config import settings
import google.generativeai as genai
import json
import re

router = APIRouter(prefix="/interview", tags=["interview"])

# Initialize Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)


# Pydantic Models
class InterviewStartRequest(BaseModel):
    interview_type: str  # technical, behavioral, hr, case_study
    job_role: Optional[str] = "Software Engineer"
    difficulty: Optional[str] = "medium"  # easy, medium, hard


class InterviewQuestion(BaseModel):
    question_number: int
    question: str
    category: str
    difficulty: str


class AnswerSubmitRequest(BaseModel):
    interview_id: str
    question_number: int
    answer: str


class InterviewFeedback(BaseModel):
    score: int  # 0-100
    strengths: List[str]
    improvements: List[str]
    detailed_feedback: str


# ... (Interview templates remain unchanged) ...
INTERVIEW_TEMPLATES = {
    "technical": {
        "easy": [
            "Explain the difference between var, let, and const in JavaScript.",
            "What is the time complexity of binary search?",
            "Explain what REST API is and its key principles.",
            "What is the difference between SQL and NoSQL databases?",
            "Explain the concept of Object-Oriented Programming."
        ],
        "medium": [
            "Design a URL shortening service like bit.ly. What are the key components?",
            "Explain how you would implement a rate limiter for an API.",
            "What is the difference between authentication and authorization? How would you implement both?",
            "Describe the CAP theorem and give real-world examples.",
            "How would you optimize a slow database query?"
        ],
        "hard": [
            "Design a distributed cache system like Redis. How would you handle consistency?",
            "Explain how you would design a real-time chat application that scales to millions of users.",
            "Design a recommendation system for an e-commerce platform.",
            "How would you implement a distributed transaction across multiple microservices?",
            "Design a search engine indexing system."
        ]
    },
    "behavioral": {
        "easy": [
            "Tell me about yourself and your career journey.",
            "Why are you interested in this role?",
            "What are your greatest strengths?",
            "Where do you see yourself in 5 years?",
            "What motivates you at work?"
        ],
        "medium": [
            "Tell me about a time when you had to work with a difficult team member.",
            "Describe a situation where you had to meet a tight deadline.",
            "Give an example of when you showed leadership.",
            "Tell me about a time you failed and what you learned from it.",
            "Describe a situation where you had to learn a new technology quickly."
        ],
        "hard": [
            "Tell me about a time when you had to make a difficult decision with incomplete information.",
            "Describe a situation where you had to influence others without authority.",
            "Give an example of when you had to handle a major conflict in your team.",
            "Tell me about a time when you had to pivot on a project mid-way.",
            "Describe how you handled a situation where your idea was rejected."
        ]
    },
    "hr": {
        "easy": [
            "What interests you about our company?",
            "What are your salary expectations?",
            "What is your notice period?",
            "Are you willing to relocate?",
            "What is your preferred work environment?"
        ],
        "medium": [
            "Why are you leaving your current job?",
            "What do you know about our company culture?",
            "How do you handle work-life balance?",
            "What are your long-term career goals?",
            "How do you stay updated with industry trends?"
        ],
        "hard": [
            "We have concerns about your job-hopping. Can you explain?",
            "You seem overqualified for this position. Why are you interested?",
            "How would you handle a situation where you disagree with company policy?",
            "What would you do if you were asked to work on something unethical?",
            "Why should we hire you over other candidates?"
        ]
    },
    "case_study": {
        "easy": [
            "A startup wants to increase user engagement. What metrics would you track?",
            "How would you price a new SaaS product?",
            "A company's website traffic dropped 20%. What would you investigate?",
            "How would you evaluate the success of a new feature launch?",
            "What factors would you consider when entering a new market?"
        ],
        "medium": [
            "A food delivery app is losing customers to competitors. How would you analyze and solve this?",
            "How would you decide whether to build, buy, or partner for a new capability?",
            "A B2B company wants to expand to B2C. What's your approach?",
            "Revenue is growing but profits are declining. What could be the reasons?",
            "How would you prioritize features for the next product release?"
        ],
        "hard": [
            "Your company's market share dropped from 40% to 25% in 2 years. Diagnose and solve.",
            "Should a traditional retailer invest $100M in e-commerce or physical expansion?",
            "A tech company is considering acquiring a competitor for $500M. Evaluate the decision.",
            "How would you turn around a failing product that's losing $10M annually?",
            "Design a go-to-market strategy for launching in a highly competitive market."
        ]
    }
}


@router.post("/start")
async def start_interview(
    request: InterviewStartRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Start a new mock interview session.
    
    Generates 5 questions based on interview type and difficulty.
    """
    try:
        user_id = current_user.get("user_id")
        
        # Validate interview type
        if request.interview_type not in INTERVIEW_TEMPLATES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid interview type. Must be one of: {', '.join(INTERVIEW_TEMPLATES.keys())}"
            )
        
        # Validate difficulty
        if request.difficulty not in ["easy", "medium", "hard"]:
            raise HTTPException(status_code=400, detail="Difficulty must be easy, medium, or hard")
        
        # Get questions from template
        questions_pool = INTERVIEW_TEMPLATES[request.interview_type][request.difficulty]
        
        # Select 5 questions
        import random
        selected_questions = random.sample(questions_pool, min(5, len(questions_pool)))
        
        # Create interview session
        interview_doc = {
            "user_id": user_id,
            "interview_type": request.interview_type,
            "job_role": request.job_role,
            "difficulty": request.difficulty,
            "questions": [
                {
                    "question_number": i + 1,
                    "question": q,
                    "category": request.interview_type,
                    "difficulty": request.difficulty,
                    "answer": None,
                    "feedback": None
                }
                for i, q in enumerate(selected_questions)
            ],
            "status": "in_progress",
            "current_question": 1,
            "total_questions": len(selected_questions),
            "started_at": datetime.utcnow(),
            "completed_at": None,
            "overall_score": None,
            "overall_feedback": None
        }
        
        result = await db.interviews.insert_one(interview_doc)
        interview_id = str(result.inserted_id)
        
        print(f"✅ Started {request.interview_type} interview for user {user_id}")
        
        return {
            "interview_id": interview_id,
            "interview_type": request.interview_type,
            "job_role": request.job_role,
            "difficulty": request.difficulty,
            "total_questions": len(selected_questions),
            "first_question": {
                "question_number": 1,
                "question": selected_questions[0],
                "category": request.interview_type,
                "difficulty": request.difficulty
            }
        }
        
    except Exception as e:
        print(f"❌ Error starting interview: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/answer")
async def submit_answer(
    request: AnswerSubmitRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Submit an answer to an interview question and get AI feedback.
    """
    try:
        from bson import ObjectId
        user_id = current_user.get("user_id")
        
        # Get interview session
        interview = await db.interviews.find_one({
            "_id": ObjectId(request.interview_id),
            "user_id": user_id
        })
        
        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found")
        
        if interview["status"] == "completed":
            raise HTTPException(status_code=400, detail="Interview already completed")
        
        # Get the question
        question_idx = request.question_number - 1
        if question_idx >= len(interview["questions"]):
            raise HTTPException(status_code=400, detail="Invalid question number")
        
        question_data = interview["questions"][question_idx]
        
        # Generate AI feedback using Gemini
        feedback = await generate_answer_feedback(
            question=question_data["question"],
            answer=request.answer,
            interview_type=interview["interview_type"],
            job_role=interview["job_role"]
        )
        
        # Update interview with answer and feedback
        interview["questions"][question_idx]["answer"] = request.answer
        interview["questions"][question_idx]["feedback"] = feedback
        
        # Check if this was the last question
        is_last_question = request.question_number >= interview["total_questions"]
        
        if is_last_question:
            # Calculate overall score
            total_score = sum(q.get("feedback", {}).get("score", 0) for q in interview["questions"])
            overall_score = total_score / interview["total_questions"]
            
            # Generate overall feedback
            overall_feedback = await generate_overall_feedback(interview["questions"], interview["interview_type"])
            
            # Update interview as completed
            await db.interviews.update_one(
                {"_id": ObjectId(request.interview_id)},
                {
                    "$set": {
                        "questions": interview["questions"],
                        "status": "completed",
                        "completed_at": datetime.utcnow(),
                        "overall_score": round(overall_score, 1),
                        "overall_feedback": overall_feedback
                    }
                }
            )
            
            print(f"✅ Completed interview {request.interview_id} with score {overall_score}")
            
            return {
                "feedback": feedback,
                "is_last_question": True,
                "overall_score": round(overall_score, 1),
                "overall_feedback": overall_feedback
            }
        else:
            # Update interview with current answer
            next_question_idx = request.question_number
            next_question = interview["questions"][next_question_idx]
            
            await db.interviews.update_one(
                {"_id": ObjectId(request.interview_id)},
                {
                    "$set": {
                        f"questions.{question_idx}": interview["questions"][question_idx],
                        "current_question": request.question_number + 1
                    }
                }
            )
            
            return {
                "feedback": feedback,
                "is_last_question": False,
                "next_question": {
                    "question_number": request.question_number + 1,
                    "question": next_question["question"],
                    "category": next_question["category"],
                    "difficulty": next_question["difficulty"]
                }
            }
        
    except Exception as e:
        print(f"❌ Error submitting answer: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history")
async def get_interview_history(
    current_user: dict = Depends(get_current_user),
    limit: int = 10
):
    """Get user's interview history"""
    try:
        user_id = current_user.get("user_id")
        
        interviews = await db.interviews.find(
            {"user_id": user_id}
        ).sort("started_at", -1).limit(limit).to_list(limit)
        
        # Convert ObjectId to string
        for interview in interviews:
            interview["_id"] = str(interview["_id"])
        
        return {
            "interviews": interviews,
            "total": len(interviews)
        }
        
    except Exception as e:
        print(f"❌ Error fetching interview history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{interview_id}")
async def get_interview_details(
    interview_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get details of a specific interview"""
    try:
        from bson import ObjectId
        user_id = current_user.get("user_id")
        
        interview = await db.interviews.find_one({
            "_id": ObjectId(interview_id),
            "user_id": user_id
        })
        
        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found")
        
        interview["_id"] = str(interview["_id"])
        
        return interview
        
    except Exception as e:
        print(f"❌ Error fetching interview: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Helper Functions
async def generate_answer_feedback(
    question: str,
    answer: str,
    interview_type: str,
    job_role: str
) -> Dict[str, Any]:
    """Generate AI feedback for an interview answer using Gemini"""
    
    try:
        prompt = f"""You are an expert interviewer evaluating a candidate's answer for a {job_role} position.

Interview Type: {interview_type}
Question: {question}
Candidate's Answer: {answer}

Evaluate the answer and provide:
1. A score from 0-100
2. 2-3 key strengths
3. 2-3 areas for improvement
4. Detailed feedback (2-3 sentences)

Respond in JSON format:
{{
    "score": <number 0-100>,
    "strengths": ["strength1", "strength2"],
    "improvements": ["improvement1", "improvement2"],
    "detailed_feedback": "detailed feedback text"
}}"""

        model = genai.GenerativeModel(settings.GEMINI_MODEL)
        response = model.generate_content(prompt)
        feedback_text = response.text.replace("```json", "").replace("```", "").strip()
        
        # Try to parse JSON
        try:
            # Extract JSON from potential partial text (find first { and last })
            json_match = re.search(r'\{[\s\S]*\}', feedback_text)
            if json_match:
                feedback = json.loads(json_match.group(0))
            else:
                feedback = json.loads(feedback_text)
        except:
            # Fallback if JSON parsing fails
            print(f"⚠️ JSON parsing failed for feedback: {feedback_text}")
            feedback = {
                "score": 70,
                "strengths": ["Good attempt", "Shows understanding"],
                "improvements": ["Could be more specific", "Add more details"],
                "detailed_feedback": feedback_text[:200] or "Feedback unavailable."
            }
        
        return feedback
        
    except Exception as e:
        print(f"⚠️ Error generating feedback: {e}")
        # Return default feedback
        return {
            "score": 70,
            "strengths": ["Good attempt", "Shows understanding"],
            "improvements": ["Could be more specific", "Add more examples"],
            "detailed_feedback": "Your answer demonstrates understanding of the topic. Consider providing more specific examples and details to strengthen your response."
        }


async def generate_overall_feedback(questions: List[Dict], interview_type: str) -> str:
    """Generate overall interview feedback"""
    
    avg_score = sum(q.get("feedback", {}).get("score", 0) for q in questions) / len(questions)
    
    if avg_score >= 80:
        performance = "excellent"
        message = "You demonstrated strong knowledge and communication skills throughout the interview."
    elif avg_score >= 60:
        performance = "good"
        message = "You showed solid understanding with room for improvement in some areas."
    else:
        performance = "needs improvement"
        message = "Consider practicing more and deepening your knowledge in key areas."
    
    return f"Overall Performance: {performance.title()} ({avg_score:.1f}/100). {message}"


# Export router
__all__ = ["router"]
