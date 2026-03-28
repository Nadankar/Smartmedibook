from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from agent import process_message, SESSIONS
from session_state import clear_session

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
    return {"status": "reset", "session_id": session_id}