"""
rag_service.py
--------------
Wraps the existing RAG pipeline (mirroring app.py logic) for use by the FastAPI backend.

Key design decisions (from reading the actual source code):
  - ConversationSummaryMemory needs the LLM and is STATEFUL, so we keep one
    memory object per session in RAM (sessions dict).
  - MultiQueryRetriever and MultiHopRetriever must be re-instantiated every turn
    because they accumulate state (subqueries, all_documents) — same as app.py.
  - chatbot_response.invoke() is SYNCHRONOUS (chain.invoke), so we run it in a
    thread via asyncio.to_thread and then stream the result string token-by-token.
  - Retrieved documents carry .page_content and .metadata (source, page, etc).
"""

import sys, os, asyncio, uuid, json
from typing import AsyncGenerator

# ── Make sure the project root (where modules/ lives) is on the path ──────────
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from dotenv import load_dotenv
load_dotenv(os.path.join(ROOT, ".env"))

# ── Validate required env vars before importing heavy deps ────────────────────
cohere_key = os.getenv("COHERE_API_KEY")
assert cohere_key, "[RAGService] COHERE_API_KEY missing from .env"
os.environ["COHERE_API_KEY"] = cohere_key

# ── Import your existing modules ──────────────────────────────────────────────
from langchain_cohere import ChatCohere
from langchain_huggingface.embeddings import HuggingFaceEmbeddings
from langchain_core.messages import AIMessage, HumanMessage

from modules.conversation_history import ConversationSummaryMemory
from modules.preprocess_documents import load_chunk_store
from modules.decide_query_complexity import QueryComplexity
from modules.chatbot_response import ChatbotResponse
from modules.bm25_retriever import instantiate_bm25retriever
from modules.semantic_retriever import SemanticRetriever
from modules.multi_query_retriever import MultiQueryRetriever
from modules.multi_hop_retriever import MultiHopRetriever

# ── Config from env ───────────────────────────────────────────────────────────
INPUT_DATA_PATH  = os.getenv("INPUT_DATA_PATH",  os.path.join(ROOT, "data", "raw"))
OUTPUT_DATA_PATH = os.getenv("OUTPUT_DATA_PATH", os.path.join(ROOT, "data", "vectors"))
CONV_WINDOW_K    = int(os.getenv("CONVERSATION_WINDOW_K",    "3"))
MULTIHOP_MAX     = int(os.getenv("MULTIHOP_MAX_ITERATIONS",  "5"))
MULTIQUERY_TOPK  = int(os.getenv("MULTIQUERY_TOP_K",         "3"))

# ── Read prompt template ──────────────────────────────────────────────────────
with open(os.path.join(ROOT, "prompts", "mainRAG-prompt.md"), encoding="utf-8") as f:
    RAG_PROMPT = f.read()

WELCOME = "Welcome to LexRAG. I'm your legal research assistant. How can I help you today?"

# ── Suppress noisy LangChain beta warnings ────────────────────────────────────
import warnings
from langchain_core._api import LangChainBetaWarning
warnings.filterwarnings("ignore", category=LangChainBetaWarning)


class RAGService:
    """
    Singleton service that:
      1. Loads and indexes documents once on startup.
      2. Maintains per-session ConversationSummaryMemory in RAM.
      3. Exposes stream_response() which yields NDJSON lines.
    """

    def __init__(self):
        print("[RAGService] Initializing — loading models and documents...")

        # LLM + embeddings (shared across all sessions)
        self.llm    = ChatCohere(temperature=0.0)
        self.embed  = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

        # Shared response generator and complexity decider
        self.response_gen      = ChatbotResponse(model=self.llm, rag_prompt_template=RAG_PROMPT)
        self.complexity_decider = QueryComplexity(model=self.llm)

        # Load and index documents (done once)
        print("[RAGService] Loading and chunking documents...")
        self.docs = load_chunk_store(data_path=INPUT_DATA_PATH)

        print("[RAGService] Building BM25 index...")
        self.sparse_retriever = instantiate_bm25retriever(documents=self.docs)

        print("[RAGService] Building FAISS index...")
        self.dense_retriever = SemanticRetriever(
            embedding_function=self.embed,
            prepped_docs=self.docs,
            vectordb_output_path=OUTPUT_DATA_PATH
        ).retriever

        # In-memory session store: { session_id -> { memory, title, turns } }
        self.sessions: dict = {}

        print("[RAGService] Ready")

    # ── Session management ────────────────────────────────────────────────────

    def create_session(self) -> dict:
        sid = str(uuid.uuid4())
        memory = ConversationSummaryMemory(model=self.llm, k=CONV_WINDOW_K)
        memory.append(AIMessage(content=WELCOME))
        self.sessions[sid] = {
            "id":     sid,
            "title":  "New Session",
            "turns":  0,
            "memory": memory,
        }
        return self._session_meta(sid)

    def list_sessions(self) -> list:
        return [self._session_meta(sid) for sid in self.sessions]

    def get_session(self, sid: str) -> dict | None:
        return self.sessions.get(sid)

    def delete_session(self, sid: str) -> bool:
        if sid in self.sessions:
            del self.sessions[sid]
            return True
        return False

    def _session_meta(self, sid: str) -> dict:
        s = self.sessions[sid]
        return {"id": s["id"], "title": s["title"], "turns": s["turns"]}

    # ── Core: stream a RAG response ───────────────────────────────────────────

    async def stream_response(
        self, session_id: str, query: str
    ) -> AsyncGenerator[str, None]:
        """
        Yields NDJSON strings (one per line):
          {"type": "strategy",  "strategy": "complex|multi_hop|simple_conversation"}
          {"type": "reasoning", "subqueries": ["query1", "query2", ...]}  ← optional
          {"type": "token",     "content":  "word "}   ← streamed word by word
          {"type": "sources",   "sources":  [...]}
          {"type": "done"}
        """

        session = self.sessions.get(session_id)
        if not session:
            yield json.dumps({"type": "error", "message": "Session not found"}) + "\n"
            return

        memory: ConversationSummaryMemory = session["memory"]

        # ── 1. Complexity classification (sync → thread) ──────────────────────
        complexity = await asyncio.to_thread(
            self.complexity_decider.invoke,
            query,
            memory,
        )

        yield json.dumps({"type": "strategy", "strategy": complexity}) + "\n"

        # ── 2. Handle simple conversation (no retrieval needed) ───────────────
        if complexity == "simple_conversation":
            ai_resp = (
                "I'm here to assist you with legal research questions. "
                "Please ask me anything about Indian law, statutes, or legal procedures."
            )
            memory.append(HumanMessage(content=query))
            memory.append(AIMessage(content=ai_resp))
            session["turns"] += 1
            for word in ai_resp.split(" "):
                yield json.dumps({"type": "token", "content": word + " "}) + "\n"
                await asyncio.sleep(0.03)
            yield json.dumps({"type": "sources", "sources": []}) + "\n"
            yield json.dumps({"type": "done"}) + "\n"
            return

        # ── 3. Retrieval (sync, runs in thread pool) ──────────────────────────
        retrieved_docs   = []
        subquery_context = ""
        sources          = []
        reasoning        = []

        if complexity == "complex":
            # Re-instantiate every turn (MultiQueryRetriever is stateful)
            mqr = MultiQueryRetriever(
                model=self.llm,
                bm25_retriever=self.sparse_retriever,
                semantic_retriever=self.dense_retriever,
                top_k=MULTIQUERY_TOPK,
            )
            retrieved_docs = await asyncio.to_thread(mqr.invoke, query, memory)

            # Capture reasoning (generated subqueries)
            reasoning = mqr.sub_queries if hasattr(mqr, 'sub_queries') else []

            sources = [
                {
                    "title":    doc.metadata.get("source", "Legal Document"),
                    "page":     doc.metadata.get("page", "—"),
                    "snippet":  doc.page_content[:180].strip(),
                }
                for doc in retrieved_docs
            ]

        elif complexity == "multi_hop":
            # Re-instantiate every turn (MultiHopRetriever is stateful)
            mhr = MultiHopRetriever(
                model=self.llm,
                bm25_retriever=self.sparse_retriever,
                semantic_retriever=self.dense_retriever,
            )
            subquery_context = await asyncio.to_thread(
                mhr.invoke, query, memory, MULTIHOP_MAX
            )

            # Capture reasoning (generated subqueries)
            reasoning = mhr.subqueries if hasattr(mhr, 'subqueries') else []

            # Flatten all retrieved docs across all hops for source display
            all_hop_docs = [
                doc
                for hop_docs in mhr.retrieved_respective_documents
                for doc in hop_docs
            ]
            sources = [
                {
                    "title":   doc.metadata.get("source", "Legal Document"),
                    "page":    doc.metadata.get("page", "—"),
                    "snippet": doc.page_content[:180].strip(),
                }
                for doc in all_hop_docs[:5]   # cap at 5 sources shown
            ]
        
        # ── 3.5. Stream reasoning data (subqueries) ───────────────────────────
        if reasoning:
            yield json.dumps({"type": "reasoning", "subqueries": reasoning}) + "\n"

        # ── 4. Append human turn to memory ────────────────────────────────────
        memory.append(HumanMessage(content=query))

        # ── 5. Generate response (sync chain.invoke → thread) ─────────────────
        ai_resp: str = await asyncio.to_thread(
            self.response_gen.invoke,
            memory,
            retrieved_docs,
            subquery_context,
        )

        # ── 6. Append AI response to memory + update session ──────────────────
        memory.append(AIMessage(content=ai_resp))
        session["turns"] += 1
        if session["turns"] == 1:
            # Set session title from the first user query (truncated)
            session["title"] = query[:50] + ("…" if len(query) > 50 else "")

        # ── 7. Stream response token-by-token ─────────────────────────────────
        words = ai_resp.split(" ")
        for word in words:
            yield json.dumps({"type": "token", "content": word + " "}) + "\n"
            await asyncio.sleep(0.025)   # ~40 wpm pacing

        # ── 8. Send sources, then done ────────────────────────────────────────
        yield json.dumps({"type": "sources", "sources": sources}) + "\n"
        yield json.dumps({"type": "done"}) + "\n"


# ── Singleton instance (created once when backend starts) ─────────────────────
rag_service = RAGService()