from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os

from agent import process_message, SESSIONS

app = FastAPI(
    title="SmartMediBook AI Assistant",
    description="AI-powered hospital booking system",
    version="1.0.0"
)

# CORS - Configure based on environment
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    user_id: Optional[str] = None
    patient_id: Optional[str] = None
    role: Optional[str] = None
    token: Optional[str] = None


class ChatResponse(BaseModel):
    reply: str
    session_id: Optional[str] = None


@app.get("/")
async def health():
    return {
        "status": "ok",
        "service": "smartmedibook-ai",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    """Detailed health check for monitoring"""
    return {
        "status": "healthy",
        "service": "smartmedibook-ai",
        "sessions_active": len(SESSIONS),
        "version": "1.0.0"
    }


@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    try:
        # Validate message
        if not req.message or not req.message.strip():
            return ChatResponse(
                reply="Please enter a message.",
                session_id=req.session_id
            )
        
        # Process message
        reply, actual_session_id = await process_message(
            message=req.message,
            user_id=req.user_id,
            session_id=req.session_id,
            patient_id=req.patient_id,
            role=req.role,
            token=req.token,
        )
        
        return ChatResponse(reply=reply, session_id=actual_session_id)
        
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        return ChatResponse(
            reply="I'm sorry, I encountered an error. Please try again.",
            session_id=req.session_id or ""
        )


@app.post("/reset")
async def reset(session_id: str):
    """Reset a conversation session"""
    if session_id in SESSIONS:
        del SESSIONS[session_id]
        return {"status": "reset", "session_id": session_id, "message": "Session reset successfully"}
    else:
        return {"status": "not_found", "session_id": session_id, "message": "Session not found"}


@app.get("/sessions")
async def get_sessions():
    """Debug endpoint - Get all active sessions (for monitoring)"""
    return {
        "total": len(SESSIONS),
        "sessions": list(SESSIONS.keys())
    }