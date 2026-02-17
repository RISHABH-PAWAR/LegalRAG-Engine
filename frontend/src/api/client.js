/**
 * api/client.js
 * =============
 * Every function in this file maps to a real backend route in main.py.
 *
 * Backend routes (from main.py):
 *   GET    /health           → { status: "ok", sessions_active: number }
 *   POST   /sessions/new     → { id: string, title: string, turns: number }
 *   GET    /sessions         → Array<{ id, title, turns }>
 *   DELETE /sessions/:id     → 204 No Content
 *   POST   /chat             → NDJSON stream
 *
 * NDJSON stream events (from rag_service.py lines 140–254):
 *   { type: "strategy",  strategy: "complex" | "multi_hop" | "simple_conversation" }
 *   { type: "reasoning", subqueries: Array<string> }  ← optional, for complex/multi_hop
 *   { type: "token",     content: "word " }
 *   { type: "sources",   sources: Array<{ title: string, page: number|"—", snippet: string }> }
 *   { type: "done" }
 *   { type: "error",     message: string }
 *
 * Dev:  Vite proxy rewrites /api/* → http://localhost:8000/*
 * Prod: set VITE_API_URL=https://your-app.onrender.com in Vercel env vars
 */

// Base URL: empty string in dev (Vite proxy handles it), full URL in prod
const BASE = import.meta.env.VITE_API_URL ?? "/api";

// ─── Low-level fetch helpers ──────────────────────────────────────────────────

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`GET ${path} → ${res.status}: ${msg}`);
  }
  return res.json();
}

async function post(path, body = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`POST ${path} → ${res.status}: ${msg}`);
  }
  // 204 No Content has no body
  if (res.status === 204) return null;
  return res.json();
}

async function del(path) {
  const res = await fetch(`${BASE}${path}`, { method: "DELETE" });
  // 204 is success, 404 is an error
  if (!res.ok && res.status !== 204) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`DELETE ${path} → ${res.status}: ${msg}`);
  }
  return null;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * GET /health
 * Returns: { status: "ok", sessions_active: number }
 */
export const getHealth = () => get("/health");

/**
 * POST /sessions/new
 * Returns: { id: string, title: string, turns: number }
 */
export const createSession = () => post("/sessions/new");

/**
 * GET /sessions
 * Returns: Array<{ id: string, title: string, turns: number }>
 */
export const listSessions = () => get("/sessions");

/**
 * DELETE /sessions/:id
 * Returns: null (204)
 */
export const deleteSession = (id) => del(`/sessions/${id}`);

/**
 * streamChat — POST /chat with NDJSON streaming
 *
 * Reads the response body as a stream, splits on newlines,
 * parses each line as JSON, and dispatches to the right callback.
 *
 * @param {object} opts
 * @param {string}   opts.sessionId   - session UUID from createSession()
 * @param {string}   opts.query       - user's query string
 * @param {function} opts.onStrategy  - called once: (strategy: string) => void
 * @param {function} opts.onReasoning - called once: (subqueries: Array<string>) => void
 * @param {function} opts.onToken     - called per word: (content: string) => void
 * @param {function} opts.onSources   - called once at end: (sources: array) => void
 * @param {function} opts.onDone      - called when stream ends cleanly: () => void
 * @param {function} opts.onError     - called on any error: (message: string) => void
 */
export async function streamChat({
  sessionId,
  query,
  onStrategy  = () => {},
  onReasoning = () => {},
  onToken     = () => {},
  onSources   = () => {},
  onDone      = () => {},
  onError     = () => {},
}) {
  // ── 1. Open the stream ──────────────────────────────────────────────────────
  let res;
  try {
    res = await fetch(`${BASE}/chat`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      // Matches ChatRequest in main.py: { session_id: str, query: str }
      body: JSON.stringify({ session_id: sessionId, query }),
    });
  } catch {
    onError("Cannot reach backend. Is it running on port 8000?");
    return;
  }

  if (!res.ok) {
    // FastAPI returns { detail: "..." } for HTTP errors
    let detail = res.statusText;
    try {
      const json = await res.json();
      detail = json.detail ?? detail;
    } catch { /* ignore parse failure */ }
    onError(`Backend error ${res.status}: ${detail}`);
    return;
  }

  // ── 2. Read NDJSON line by line ─────────────────────────────────────────────
  const reader  = res.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let   buffer  = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    // Accumulate decoded bytes into buffer
    buffer += decoder.decode(value, { stream: true });

    // Split buffer on newlines; keep any incomplete last line in buffer
    const lines = buffer.split("\n");
    buffer = lines.pop(); // last element may be incomplete

    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue; // skip blank lines

      let event;
      try {
        event = JSON.parse(line);
      } catch {
        continue; // malformed line — skip silently
      }

      // Dispatch to the correct callback based on event.type
      // These match the yield statements in rag_service.stream_response()
      switch (event.type) {
        case "strategy":  onStrategy(event.strategy);    break;
        case "reasoning": onReasoning(event.subqueries); break;
        case "token":     onToken(event.content);        break;
        case "sources":   onSources(event.sources);      break;
        case "done":      onDone();                      return; // stream complete
        case "error":     onError(event.message);        return;
        default: break;
      }
    }
  }
}