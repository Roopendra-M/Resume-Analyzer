"""
Chatbot Router - Migrated to Google Gemini API
Career assistant chatbot with conversation history
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime
from typing import List, Dict, Optional
from app.security import get_current_user
from app.db import db
from app.config import settings
import google.generativeai as genai

router = APIRouter(prefix="/chatbot", tags=["Chatbot"])

# Configure Gemini API
genai.configure(api_key=settings.GEMINI_API_KEY)


class ChatQuery(BaseModel):
    query: str
    conversation_id: Optional[str] = None


class ChatMessage(BaseModel):
    role: str  # user or assistant
    content: str
    timestamp: datetime


# System prompt for the career chatbot
CAREER_CHATBOT_PROMPT = """You are JobCopilot AI, an expert career advisor and job search assistant. You help users with:

1. **Resume & CV Advice** - Tips on writing, formatting, and optimizing resumes
2. **Job Search Strategy** - How to find jobs, apply effectively, and stand out
3. **Interview Preparation** - Common questions, STAR method, technical interviews
4. **Career Guidance** - Career paths, skill development, salary negotiation
5. **Platform Help** - How to use JobCopilot Pro features

**Your Capabilities:**
- Analyze user's job search progress
- Provide personalized career advice
- Explain match scores and recommendations
- Guide through platform features
- Answer career-related questions

**Tone:** Professional, friendly, encouraging, and actionable
**Style:** Concise but comprehensive, use emojis sparingly for emphasis
**Format:** Use bullet points and numbered lists when helpful

**Context about the user:**
- Resumes uploaded: {resume_count}
- Applications submitted: {application_count}
- Available jobs: {job_count}
- User role: {user_role}

Always provide specific, actionable advice. If asked about platform features, explain clearly and guide them to the right page."""


@router.post("/query")
async def chat_query(q: ChatQuery, current_user: dict = Depends(get_current_user)):
    """
    Process chatbot query with Groq AI (with Gemini fallback).
    Maintains conversation history for context-aware responses.
    """
    try:
        query = q.query.strip()
        
        if not query:
            raise HTTPException(status_code=400, detail="Query cannot be empty")
        
        user_id = current_user.get("user_id")
        role = current_user.get("role", "user")
        
        # Get user statistics for context
        resume_count = await db.resumes.count_documents({"user_id": user_id})
        application_count = await db.applications.count_documents({"user_id": user_id})
        job_count = await db.jobs.count_documents({})
        
        # Get or create conversation
        conversation_id = q.conversation_id
        if conversation_id:
            # Load existing conversation
            from bson import ObjectId
            conversation = await db.chat_conversations.find_one({
                "_id": ObjectId(conversation_id),
                "user_id": user_id
            })
            if not conversation:
                raise HTTPException(status_code=404, detail="Conversation not found")
            
            messages = conversation.get("messages", [])
        else:
            # Create new conversation
            conversation = {
                "user_id": user_id,
                "started_at": datetime.utcnow(),
                "last_message_at": datetime.utcnow(),
                "messages": []
            }
            result = await db.chat_conversations.insert_one(conversation)
            conversation_id = str(result.inserted_id)
            messages = []
        
        # Add user message to conversation list (but don't save yet, wait for success)
        # Actually, for chat history we need the prev messages + current one
        # Current message is NOT in messages yet.
        
        current_message_obj = {
            "role": "user",
            "content": query,
            "timestamp": datetime.utcnow()
        }
        
        # Build context for system prompt
        system_prompt = CAREER_CHATBOT_PROMPT.format(
            resume_count=resume_count,
            application_count=application_count,
            job_count=job_count,
            user_role=role
        )
        
        # Prepare messages for AI Service (Limit context window)
        # We need to construct the list of messages for the API
        api_messages = []
        
        # Add previous messages (last 10)
        # Filter strictly for role: user/assistant
        for msg in messages[-10:]:
             role = "assistant" if msg["role"] == "assistant" else "user"
             api_messages.append({"role": role, "content": msg["content"]})
        
        # Add current message
        api_messages.append({"role": "user", "content": query})
        
        from app.services.ai_service import ai_service
        
        # Get AI response
        ai_response_text = await ai_service.chat_with_history(
            messages=api_messages,
            system_instruction=system_prompt
        )
        
        # Success! Now update DB
        messages.append(current_message_obj)
        assistant_message = {
            "role": "assistant",
            "content": ai_response_text,
            "timestamp": datetime.utcnow()
        }
        messages.append(assistant_message)
        
        # Update conversation in database
        from bson import ObjectId
        await db.chat_conversations.update_one(
            {"_id": ObjectId(conversation_id)},
            {
                "$set": {
                    "messages": messages,
                    "last_message_at": datetime.utcnow()
                }
            }
        )
        
        return {
            "response": ai_response_text,
            "conversation_id": conversation_id,
            "type": "text",
            "context": {
                "resumes": resume_count,
                "applications": application_count,
                "available_jobs": job_count
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Chatbot error: {e}")
        import traceback
        traceback.print_exc()
        return {
            "response": "I apologize, but I encountered an error. Please try again later or contact support if the issue persists.",
            "type": "error"
        }


@router.get("/conversations")
async def get_conversations(
    current_user: dict = Depends(get_current_user),
    limit: int = 10
):
    """Get user's chat conversation history"""
    try:
        user_id = current_user.get("user_id")
        
        conversations = await db.chat_conversations.find(
            {"user_id": user_id}
        ).sort("last_message_at", -1).limit(limit).to_list(limit)
        
        # Convert ObjectId to string and format
        result = []
        for conv in conversations:
            conv["_id"] = str(conv["_id"])
            # Get last message preview
            if conv.get("messages"):
                last_msg = conv["messages"][-1]
                conv["preview"] = last_msg["content"][:100]
                conv["message_count"] = len(conv["messages"])
            result.append(conv)
        
        return {
            "conversations": result,
            "total": len(result)
        }
        
    except Exception as e:
        print(f"❌ Error fetching conversations: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/suggestions")
async def get_suggestions(current_user: dict = Depends(get_current_user)):
    """Get quick help suggestions based on user's current state"""
    try:
        user_id = current_user.get("user_id")
        
        # Get user statistics
        resume_count = await db.resumes.count_documents({"user_id": user_id})
        application_count = await db.applications.count_documents({"user_id": user_id})
        
        suggestions = []
        
        if resume_count == 0:
            suggestions.append("How do I create an ATS-friendly resume?")
            suggestions.append("What skills should I highlight on my resume?")
        else:
            suggestions.append("How can I improve my resume match score?")
            suggestions.append("What are the latest job market trends?")
        
        if application_count == 0:
            suggestions.append("How do I find jobs that match my skills?")
            suggestions.append("What's the best way to apply for jobs?")
        else:
            suggestions.append("How should I follow up on my applications?")
            suggestions.append("Tips for interview preparation")
        
        suggestions.append("How can I negotiate my salary?")
        
        return {
            "suggestions": suggestions[:5]
        }
        
    except Exception as e:
        print(f"❌ Error generating suggestions: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/conversation/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a conversation"""
    try:
        from bson import ObjectId
        user_id = current_user.get("user_id")
        
        result = await db.chat_conversations.delete_one({
            "_id": ObjectId(conversation_id),
            "user_id": user_id
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        return {"message": "Conversation deleted successfully"}
        
    except Exception as e:
        print(f"❌ Error deleting conversation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Export router
__all__ = ["router"]
