from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
import os

from agent import process_message, SESSIONS

app = FastAPI()

# Get allowed origins from environment variable
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "https://smartmedbook.onrender.com,https://smartmedbook-backend.onrender.com,http://localhost:5173,http://localhost:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
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
async def root():
    return {
        "status": "ok",
        "service": "smartmedbook-ai",
        "message": "AI server is running"
    }


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "sessions_active": len(SESSIONS)
    }


@app.options("/chat")
async def options_chat():
    """Handle CORS preflight requests"""
    return JSONResponse(
        content={"message": "OK"},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        }
    )


@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    try:
        print(f"📨 Received message: {req.message[:50]}...")
        print(f"📨 Session ID: {req.session_id}")
        print(f"📨 Role: {req.role}")
        
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
        
        print(f"📨 Response sent: {reply[:50]}...")
        
        return ChatResponse(reply=reply, session_id=actual_session_id)
        
    except Exception as e:
        print(f"❌ Error in chat: {e}")
        import traceback
        traceback.print_exc()
        return ChatResponse(
            reply=f"Sorry, I encountered an error: {str(e)[:100]}",
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