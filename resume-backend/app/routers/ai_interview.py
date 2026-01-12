# app/routers/ai_interview.py
"""
AI Conversational Interview Router

Real-time conversational interview where AI acts as the interviewer.
The AI bot:
- Asks initial questions
- Listens to answers
- Asks intelligent follow-up questions
- Provides real-time feedback
- Conducts a natural conversation like a real interviewer
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

router = APIRouter(prefix="/ai-interview", tags=["ai-interview"])

# Initialize Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)


# Pydantic Models
class StartConversationalInterview(BaseModel):
    interview_type: str  # technical, behavioral, hr, case_study
    job_role: str
    difficulty: str = "medium"


class SendMessage(BaseModel):
    session_id: str
    message: str


class InterviewMessage(BaseModel):
    role: str  # interviewer or candidate
    content: str
    timestamp: datetime


# System prompts for different interview types
INTERVIEWER_PROMPTS = {
    "technical": """You are an experienced technical interviewer conducting a {difficulty} level interview for a {job_role} position.

Your role:
- Ask 1 question at a time about coding, algorithms, system design, or technical concepts
- Listen carefully to the candidate's answer
- Ask intelligent follow-up questions to dive deeper
- Probe for understanding, not just memorization
- Be professional but friendly
- After 5-7 questions, conclude the interview

Guidelines:
- Start with a warm greeting and an opening question
- Ask follow-ups based on their answers
- If they struggle, give hints
- If they do well, ask harder follow-ups
- Keep questions relevant to {job_role}
- Make it feel like a real conversation

Current question count: {question_count}/7
""",
    
    "behavioral": """You are an experienced HR interviewer conducting a {difficulty} level behavioral interview for a {job_role} position.

Your role:
- Ask behavioral questions using the STAR method (Situation, Task, Action, Result)
- Listen to their stories and experiences
- Ask follow-up questions to understand their thought process
- Probe for specific examples
- Be empathetic and encouraging
- After 5-7 questions, conclude the interview

Guidelines:
- Start with a warm greeting
- Ask about past experiences and how they handled situations
- Follow up with "Can you tell me more about..." or "How did you feel when..."
- Look for leadership, teamwork, problem-solving, and conflict resolution
- Make them comfortable sharing stories

Current question count: {question_count}/7
""",
    
    "hr": """You are an HR manager conducting a {difficulty} level general HR interview for a {job_role} position.

Your role:
- Ask questions about career goals, company fit, and motivation
- Understand their expectations and aspirations
- Discuss compensation, work culture, and logistics
- Be professional and welcoming
- After 5-7 questions, conclude the interview

Guidelines:
- Start with "Tell me about yourself"
- Ask about their interest in the company and role
- Discuss work preferences (remote, team size, etc.)
- Ask about salary expectations tactfully
- Understand their long-term goals

Current question count: {question_count}/7
""",
    
    "case_study": """You are a senior consultant conducting a {difficulty} level case study interview for a {job_role} position.

Your role:
- Present a business problem or case
- Guide them through their analysis
- Ask probing questions about their approach
- Challenge their assumptions
- Help them structure their thinking
- After discussing the case thoroughly, conclude

Guidelines:
- Present a clear business scenario
- Let them ask clarifying questions
- Guide them through framework (e.g., profitability, market entry)
- Ask "Why?" and "How?" frequently
- Test their quantitative and qualitative reasoning

Current question count: {question_count}/7
"""
}


@router.post("/start")
async def start_conversational_interview(
    request: StartConversationalInterview,
    current_user: dict = Depends(get_current_user)
):
    """
    Start a new AI conversational interview session.
    The AI will act as the interviewer and conduct a natural conversation.
    """
    try:
        user_id = current_user.get("user_id")
        
        # Validate interview type
        if request.interview_type not in INTERVIEWER_PROMPTS:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid interview type. Must be one of: {', '.join(INTERVIEWER_PROMPTS.keys())}"
            )
        
        # Create system prompt
        system_prompt = INTERVIEWER_PROMPTS[request.interview_type].format(
            difficulty=request.difficulty,
            job_role=request.job_role,
            question_count=0
        )
        
        # Get initial greeting from AI
        try:
            model = genai.GenerativeModel(
                settings.GEMINI_MODEL,
                system_instruction=system_prompt
            )
            response = model.generate_content("Hello, I'm ready for the interview.")
            ai_greeting = response.text
        except Exception:
            # Fallback if system_instruction not supported or error
            model = genai.GenerativeModel(settings.GEMINI_MODEL)
            response = model.generate_content(f"{system_prompt}\n\nUser: Hello, I'm ready for the interview.")
            ai_greeting = response.text
        
        # Create conversation history
        conversation = [
            {
                "role": "interviewer",
                "content": ai_greeting,
                "timestamp": datetime.utcnow()
            }
        ]
        
        # Create interview session
        session_doc = {
            "user_id": user_id,
            "interview_type": request.interview_type,
            "job_role": request.job_role,
            "difficulty": request.difficulty,
            "system_prompt": system_prompt,
            "conversation": conversation,
            "question_count": 1,
            "status": "in_progress",
            "started_at": datetime.utcnow(),
            "completed_at": None,
            "final_feedback": None
        }
        
        result = await db.ai_interviews.insert_one(session_doc)
        session_id = str(result.inserted_id)
        
        print(f"✅ Started AI conversational interview for user {user_id}")
        
        return {
            "session_id": session_id,
            "interview_type": request.interview_type,
            "job_role": request.job_role,
            "interviewer_message": ai_greeting,
            "status": "in_progress"
        }
        
    except Exception as e:
        print(f"❌ Error starting AI interview: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/message")
async def send_message(
    request: SendMessage,
    current_user: dict = Depends(get_current_user)
):
    """
    Send a message (answer) to the AI interviewer and get a response.
    The AI will respond naturally with follow-ups or next questions.
    """
    try:
        from bson import ObjectId
        user_id = current_user.get("user_id")
        
        # Get interview session
        session = await db.ai_interviews.find_one({
            "_id": ObjectId(request.session_id),
            "user_id": user_id
        })
        
        if not session:
            raise HTTPException(status_code=404, detail="Interview session not found")
        
        if session["status"] == "completed":
            raise HTTPException(status_code=400, detail="Interview already completed")
        
        # Add candidate's message to conversation
        candidate_message = {
            "role": "candidate",
            "content": request.message,
            "timestamp": datetime.utcnow()
        }
        session["conversation"].append(candidate_message)
        
        # Build conversation history for Gemini
        history = []
        for msg in session["conversation"][:-1]: # Exclude the current new message
            role = "model" if msg["role"] == "interviewer" else "user"
            history.append({"role": role, "parts": [msg["content"]]})
        
        # Get AI response
        try:
            model = genai.GenerativeModel(
                settings.GEMINI_MODEL,
                system_instruction=session["system_prompt"]
            )
            chat = model.start_chat(history=history)
            response = chat.send_message(request.message)
            ai_response = response.text
        except Exception as e:
            print(f"Gemini Chat Error: {e}")
            ai_response = "I apologize, but I'm having trouble connecting. Let's continue. Could you elaborate on that?"
        
        # Check if AI is concluding the interview
        is_concluding = any(phrase in ai_response.lower() for phrase in [
            "that concludes", "thank you for your time", "we've covered",
            "this wraps up", "interview is complete", "final question"
        ])
        
        # Increment question count
        session["question_count"] += 1
        
        # Add AI response to conversation
        interviewer_message = {
            "role": "interviewer",
            "content": ai_response,
            "timestamp": datetime.utcnow()
        }
        session["conversation"].append(interviewer_message)
        
        # Check if interview should end (7+ questions or AI concluded)
        should_end = session["question_count"] >= 7 or is_concluding
        
        if should_end:
            # Generate final feedback
            final_feedback = await generate_final_feedback(
                session["conversation"],
                session["interview_type"],
                session["job_role"]
            )
            
            # Update session as completed
            await db.ai_interviews.update_one(
                {"_id": ObjectId(request.session_id)},
                {
                    "$set": {
                        "conversation": session["conversation"],
                        "question_count": session["question_count"],
                        "status": "completed",
                        "completed_at": datetime.utcnow(),
                        "final_feedback": final_feedback
                    }
                }
            )
            
            print(f"✅ Completed AI interview {request.session_id}")
            
            return {
                "interviewer_message": ai_response,
                "status": "completed",
                "final_feedback": final_feedback
            }
        else:
            # Update session
            await db.ai_interviews.update_one(
                {"_id": ObjectId(request.session_id)},
                {
                    "$set": {
                        "conversation": session["conversation"],
                        "question_count": session["question_count"]
                    }
                }
            )
            
            return {
                "interviewer_message": ai_response,
                "status": "in_progress",
                "question_count": session["question_count"]
            }
        
    except Exception as e:
        print(f"❌ Error sending message: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/end/{session_id}")
async def end_interview(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Manually end the interview and get final feedback.
    """
    try:
        from bson import ObjectId
        user_id = current_user.get("user_id")
        
        # Get interview session
        session = await db.ai_interviews.find_one({
            "_id": ObjectId(session_id),
            "user_id": user_id
        })
        
        if not session:
            raise HTTPException(status_code=404, detail="Interview session not found")
        
        if session["status"] == "completed":
            return {"message": "Interview already completed", "final_feedback": session["final_feedback"]}
        
        # Generate final feedback
        final_feedback = await generate_final_feedback(
            session["conversation"],
            session["interview_type"],
            session["job_role"]
        )
        
        # Update session
        await db.ai_interviews.update_one(
            {"_id": ObjectId(session_id)},
            {
                "$set": {
                    "status": "completed",
                    "completed_at": datetime.utcnow(),
                    "final_feedback": final_feedback
                }
            }
        )
        
        return {
            "message": "Interview ended",
            "final_feedback": final_feedback
        }
        
    except Exception as e:
        print(f"❌ Error ending interview: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/session/{session_id}")
async def get_session(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get interview session details including full conversation"""
    try:
        from bson import ObjectId
        user_id = current_user.get("user_id")
        
        session = await db.ai_interviews.find_one({
            "_id": ObjectId(session_id),
            "user_id": user_id
        })
        
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        session["_id"] = str(session["_id"])
        
        return session
        
    except Exception as e:
        print(f"❌ Error fetching session: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history")
async def get_interview_history(
    current_user: dict = Depends(get_current_user),
    limit: int = 10
):
    """Get user's AI interview history"""
    try:
        user_id = current_user.get("user_id")
        
        sessions = await db.ai_interviews.find(
            {"user_id": user_id}
        ).sort("started_at", -1).limit(limit).to_list(limit)
        
        # Convert ObjectId to string and remove conversation for list view
        for session in sessions:
            session["_id"] = str(session["_id"])
            session.pop("conversation", None)  # Remove full conversation from list
            session.pop("system_prompt", None)
        
        return {
            "sessions": sessions,
            "total": len(sessions)
        }
        
    except Exception as e:
        print(f"❌ Error fetching history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Helper Functions
async def generate_final_feedback(
    conversation: List[Dict],
    interview_type: str,
    job_role: str
) -> Dict[str, Any]:
    """Generate comprehensive final feedback based on the entire conversation"""
    
    try:
        # Build conversation summary
        conv_text = "\n".join([
            f"{'Interviewer' if msg['role'] == 'interviewer' else 'Candidate'}: {msg['content']}"
            for msg in conversation
        ])
        
        prompt = f"""You are an expert interviewer evaluating a candidate's performance in a {interview_type} interview for a {job_role} position.

Here is the full conversation:

{conv_text}

Provide comprehensive feedback in JSON format:
{{
    "overall_score": <number 0-100>,
    "communication_score": <number 0-100>,
    "technical_knowledge_score": <number 0-100>,
    "problem_solving_score": <number 0-100>,
    "strengths": ["strength1", "strength2", "strength3"],
    "areas_for_improvement": ["area1", "area2", "area3"],
    "detailed_feedback": "2-3 sentences of detailed feedback",
    "recommendation": "hire/maybe/no" 
}}"""

        model = genai.GenerativeModel(settings.GEMINI_MODEL)
        response = model.generate_content(prompt)
        feedback_text = response.text.replace("```json", "").replace("```", "").strip()
        
        # Try to parse JSON
        try:
            feedback = json.loads(feedback_text)
        except:
            # Fallback feedback
            feedback = {
                "overall_score": 75,
                "communication_score": 75,
                "technical_knowledge_score": 70,
                "problem_solving_score": 75,
                "strengths": ["Good communication", "Thoughtful responses", "Professional demeanor"],
                "areas_for_improvement": ["More specific examples", "Deeper technical knowledge", "Structured thinking"],
                "detailed_feedback": "The candidate demonstrated solid understanding and communication skills. With more practice and deeper technical knowledge, they would be a strong candidate.",
                "recommendation": "maybe"
            }
        
        return feedback
        
    except Exception as e:
        print(f"⚠️ Error generating final feedback: {e}")
        # Return default feedback
        return {
            "overall_score": 70,
            "communication_score": 70,
            "technical_knowledge_score": 70,
            "problem_solving_score": 70,
            "strengths": ["Professional approach", "Clear communication"],
            "areas_for_improvement": ["More practice needed", "Deepen knowledge"],
            "detailed_feedback": "Good effort overall. Continue practicing to improve your interview skills.",
            "recommendation": "maybe"
        }


# Export router
__all__ = ["router"]
