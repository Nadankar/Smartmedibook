from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from agent import process_message, SESSIONS
from session_state import clear_session
import os

app = FastAPI()

# Get the frontend URL from environment variable or use default
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://smartmedibook.onrender.com")

# CORS configuration for Render
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        FRONTEND_URL,
        "https://smartmedibook.onrender.com",
        "http://localhost:5173",  # For local testing
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=[
        "Content-Type",
        "Authorization",
        "Accept",
        "Origin",
        "X-Requested-With",
    ],
    expose_headers=["Content-Length"],
    max_age=86400,  # 24 hours
)

class ChatRequest(BaseModel):
    message: str
    session_id: str | None = None 
    user_id: str | None = None
    patient_id: str | None = None
    role: str | None = None
    token: str | None = None

class ChatResponse(BaseModel):
    reply: str
    session_id: str | None = None

@app.get("/")
@app.get("/health")
async def health():
    return {"status": "ok", "service": "smartmedibook-ai"}

@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    reply, actual_session_id = await process_message(
        message=req.message,
        user_id=req.user_id,
        session_id=req.session_id,
        patient_id=req.patient_id,
        role=req.role,
        token=req.token,
    )
    return ChatResponse(reply=reply, session_id=actual_session_id)

@app.post("/reset")
async def reset(session_id: str):
    if session_id in SESSIONS:
        del SESSIONS[session_id]
    clear_session(session_id)
    return {"status": "reset", "session_id": session_id}  # Fixed: removed comma

# Optional: Add explicit OPTIONS handler
@app.options("/{rest_of_path:path}")
async def preflight_handler(rest_of_path: str):
    return {}