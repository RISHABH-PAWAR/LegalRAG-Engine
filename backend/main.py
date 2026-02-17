"""
main.py
-------
Minimal FastAPI backend for the RAG Legal Assistant.
No auth. No middleware. Just 5 routes and CORS.

Routes:
  GET  /health                    → ping
  POST /sessions/new              → create session  → { id, title, turns }
  GET  /sessions                  → list sessions   → [{ id, title, turns }]
  DELETE /sessions/{id}           → delete session  → 204
  POST /chat                      → stream response → NDJSON stream

Run locally:
  cd backend
  uvicorn main:app --reload --port 8000
"""

import os
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from backend.rag_service import rag_service

# ── App ────────────────────────────────────────────────────────────────────────
app = FastAPI(title="LexRAG API", version="1.0.0")

# ── CORS ───────────────────────────────────────────────────────────────────────
# Reads ALLOWED_ORIGINS from .env, falls back to localhost dev ports
raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000")
origins = [o.strip() for o in raw_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["*"],
)


# ── Schemas ────────────────────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    session_id: str
    query: str


# ── Routes ─────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "sessions_active": len(rag_service.sessions)}


@app.post("/sessions/new", status_code=201)
def new_session():
    """Creates a new session with a fresh ConversationSummaryMemory."""
    return rag_service.create_session()


@app.get("/sessions")
def list_sessions():
    """Returns metadata for all active sessions (no message content)."""
    return rag_service.list_sessions()


@app.delete("/sessions/{session_id}", status_code=204)
def delete_session(session_id: str):
    """Removes a session and its memory from RAM."""
    if not rag_service.delete_session(session_id):
        raise HTTPException(status_code=404, detail="Session not found")


@app.post("/chat")
async def chat(req: ChatRequest):
    """
    Streams the RAG response as NDJSON (one JSON object per line).

    Line types:
      {"type": "strategy",  "strategy": "complex|multi_hop|simple_conversation"}
      {"type": "token",     "content": "word "}
      {"type": "sources",   "sources": [{"title":..., "page":..., "snippet":...}]}
      {"type": "done"}
      {"type": "error",     "message": "..."}
    """
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    if req.session_id not in rag_service.sessions:
        raise HTTPException(status_code=404, detail="Session not found. Create one first.")

    return StreamingResponse(
        rag_service.stream_response(req.session_id, req.query.strip()),
        media_type="application/x-ndjson",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",   # disable nginx response buffering
        },
    )