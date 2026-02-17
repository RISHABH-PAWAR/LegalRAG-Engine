/**
 * Chat.jsx
 * ========
 * Main chat interface. Owns all state, calls backend, wires components together.
 *
 * State shapes:
 *
 *   sessions: Array<{ id: string, title: string, turns: number }>
 *     — from GET /sessions and POST /sessions/new
 *
 *   messages: Array<Message>
 *     Message = {
 *       id:        string,                     // local uid()
 *       role:      "user" | "assistant",
 *       content:   string,                     // accumulates via onToken
 *       loading:   boolean,                    // true until first "strategy" event
 *       streaming: boolean,                    // true between strategy→done
 *       strategy:  string | null,              // set on "strategy" event
 *       reasoning: Array<string> | null,       // set on "reasoning" event (subqueries)
 *       sources:   Array<{title,page,snippet}> // set on "sources" event
 *     }
 *
 * Backend calls made here (all from api/client.js):
 *   getHealth()                   → on mount, for status indicator
 *   listSessions()                → on mount
 *   createSession()               → on "New Session" or first send
 *   deleteSession(id)             → on delete button
 *   streamChat({ sessionId, query, on* }) → on send
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  getHealth,
  listSessions,
  createSession,
  deleteSession,
  streamChat,
} from "../api/client.js";

import Sidebar     from "../components/Sidebar.jsx";
import MessageList from "../components/MessageList.jsx";
import InputBar    from "../components/InputBar.jsx";

// ── Helpers ───────────────────────────────────────────────────────────────────

// Small unique ID for local message objects (not server IDs)
const uid = () => Math.random().toString(36).slice(2, 10);

// The static welcome message shown when a session is first opened or created
const makeWelcome = () => ({
  id:        "welcome",
  role:      "assistant",
  content:   "Welcome to LexRAG. I'm your legal research assistant.\n\nAsk me anything about Indian law, statutes, or legal procedures — I'll retrieve the most relevant provisions and explain them clearly.",
  loading:   false,
  streaming: false,
  strategy:  null,
  reasoning: null,
  sources:   [],
});

// ── Component ─────────────────────────────────────────────────────────────────
export default function Chat() {
  const [sessions,   setSessions]   = useState([]);
  const [activeId,   setActiveId]   = useState(null);
  const [messages,   setMessages]   = useState([makeWelcome()]);
  const [input,      setInput]      = useState("");
  const [streaming,  setStreaming]  = useState(false);
  const [backendStatus, setBackendStatus] = useState("checking"); // "checking"|"ok"|"down"

  // Ref to track the streaming AI message ID inside callbacks without stale closure
  const streamingMsgIdRef = useRef(null);

  // ── On mount: check backend health + load sessions ────────────────────────
  useEffect(() => {
    getHealth()
      .then(() => setBackendStatus("ok"))
      .catch(() => setBackendStatus("down"));

    listSessions()
      .then(setSessions)
      .catch(() => {}); // backend might still be starting
  }, []);

  // ── Create a new session ──────────────────────────────────────────────────
  const handleNewSession = useCallback(async () => {
    if (streaming) return;
    try {
      const session = await createSession();
      // createSession returns { id, title: "New Session", turns: 0 }
      setSessions((prev) => [session, ...prev]);
      setActiveId(session.id);
      setMessages([makeWelcome()]);
      setInput("");
    } catch (err) {
      console.error("createSession failed:", err.message);
    }
  }, [streaming]);

  // ── Switch to a different session ─────────────────────────────────────────
  const handleSelectSession = useCallback(
    (id) => {
      if (streaming || id === activeId) return;
      setActiveId(id);
      // We don't persist message history server-side (in-memory only for MVP),
      // so just reset to the welcome message
      setMessages([makeWelcome()]);
      setInput("");
    },
    [streaming, activeId]
  );

  // ── Delete a session ──────────────────────────────────────────────────────
  const handleDeleteSession = useCallback(
    async (id) => {
      if (streaming) return;
      try {
        await deleteSession(id); // DELETE /sessions/:id → 204
        setSessions((prev) => prev.filter((s) => s.id !== id));
        if (activeId === id) {
          setActiveId(null);
          setMessages([makeWelcome()]);
        }
      } catch (err) {
        console.error("deleteSession failed:", err.message);
      }
    },
    [streaming, activeId]
  );

  // ── Send a message ────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const query = input.trim();
    if (!query || streaming) return;

    setInput("");
    setStreaming(true);

    // If no session exists yet, create one before sending
    let sid = activeId;
    if (!sid) {
      try {
        const session = await createSession();
        setSessions((prev) => [session, ...prev]);
        setActiveId(session.id);
        sid = session.id;
      } catch {
        // Show error inline as an assistant message
        setMessages((prev) => [
          ...prev,
          {
            id:        uid(),
            role:      "assistant",
            content:   "⚠️ Could not connect to backend. Make sure it's running:\n\ncd backend\nuvicorn main:app --reload --port 8000",
            loading:   false,
            streaming: false,
            strategy:  null,
            reasoning: null,
            sources:   [],
          },
        ]);
        setStreaming(false);
        return;
      }
    }

    // ── Add user message immediately (optimistic) ─────────────────────────
    const userMsgId = uid();
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: "user", content: query, loading: false, streaming: false, strategy: null, reasoning: null, sources: [] },
    ]);

    // ── Add placeholder AI message in loading state ───────────────────────
    const aiMsgId = uid();
    streamingMsgIdRef.current = aiMsgId;
    setMessages((prev) => [
      ...prev,
      { id: aiMsgId, role: "assistant", content: "", loading: true, streaming: false, strategy: null, reasoning: null, sources: [] },
    ]);

    // ── Open the NDJSON stream (POST /chat) ───────────────────────────────
    await streamChat({
      sessionId: sid,
      query,

      // "strategy" event: first event from backend, ends loading skeleton
      onStrategy: (strategy) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId
              ? { ...m, loading: false, streaming: true, strategy }
              : m
          )
        );
      },

      // "reasoning" event: attach subqueries (for complex/multi_hop strategies)
      onReasoning: (subqueries) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId ? { ...m, reasoning: subqueries } : m
          )
        );
      },

      // "token" event: append each word to content
      onToken: (content) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId
              ? { ...m, content: m.content + content }
              : m
          )
        );
      },

      // "sources" event: attach retrieved docs to the message
      onSources: (sources) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId ? { ...m, sources } : m
          )
        );
      },

      // "done" event: mark streaming complete, refresh session list
      onDone: () => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId
              ? { ...m, streaming: false, loading: false }
              : m
          )
        );
        setStreaming(false);
        streamingMsgIdRef.current = null;

        // Refresh sessions so sidebar shows updated title + turn count
        listSessions().then(setSessions).catch(() => {});
      },

      // "error" event: show error in the AI message bubble
      onError: (message) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId
              ? { ...m, content: `⚠️ ${message}`, loading: false, streaming: false }
              : m
          )
        );
        setStreaming(false);
        streamingMsgIdRef.current = null;
      },
    });
  }, [input, streaming, activeId]);

  // ── Status indicator colors ───────────────────────────────────────────────
  const statusColor =
    backendStatus === "ok"       ? "#4ade80" :
    backendStatus === "down"     ? "#ef4444" :
    "#71717a";
  const statusGlow =
    backendStatus === "ok"       ? "0 0 7px rgba(74,222,128,0.6)" :
    backendStatus === "down"     ? "0 0 7px rgba(239,68,68,0.6)"  :
    "none";
  const statusLabel =
    backendStatus === "ok"       ? "BACKEND LIVE" :
    backendStatus === "down"     ? "BACKEND DOWN" :
    "CONNECTING";

  // ── Empty state — no session selected ────────────────────────────────────
  function EmptyState() {
    return (
      <div
        style={{
          flex:           1,
          display:        "flex",
          flexDirection:  "column",
          alignItems:     "center",
          justifyContent: "center",
          gap:            16,
        }}
      >
        <div
          style={{
            width:          48,
            height:         48,
            borderRadius:   14,
            background:     "rgba(167,139,250,0.07)",
            border:         "1px solid rgba(167,139,250,0.14)",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            color:          "#6d6580",
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
        </div>
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize:   14,
            fontWeight: 500,
            color:      "#3f3f46",
          }}
        >
          No session selected
        </div>
        <button
          onClick={handleNewSession}
          style={{
            padding:      "8px 20px",
            borderRadius: 8,
            border:       "1px solid rgba(167,139,250,0.2)",
            background:   "rgba(167,139,250,0.07)",
            color:        "#a78bfa",
            fontFamily:   "'Syne', sans-serif",
            fontSize:     12,
            fontWeight:   500,
            cursor:       "pointer",
            transition:   "all 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(167,139,250,0.14)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(167,139,250,0.07)"; }}
        >
          + New Session
        </button>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        display:  "flex",
        height:   "100vh",
        overflow: "hidden",
        background: "#09090b",
      }}
    >
      {/* Left sidebar */}
      <Sidebar
        sessions={sessions}
        activeId={activeId}
        onNew={handleNewSession}
        onSelect={handleSelectSession}
        onDelete={handleDeleteSession}
        streaming={streaming}
      />

      {/* Right: topbar + chat + input */}
      <div
        style={{
          flex:          1,
          display:       "flex",
          flexDirection: "column",
          overflow:      "hidden",
          minWidth:      0,
        }}
      >
        {/* ── Top bar ────────────────────────────────────────────────────── */}
        <div
          style={{
            height:         46,
            borderBottom:   "1px solid rgba(255,255,255,0.05)",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "space-between",
            padding:        "0 20px",
            background:     "rgba(9,9,11,0.85)",
            backdropFilter: "blur(12px)",
            flexShrink:     0,
          }}
        >
          {/* Current session title */}
          <span
            style={{
              fontFamily:    "'JetBrains Mono', monospace",
              fontSize:      10,
              color:         "#3f3f46",
              letterSpacing: "0.04em",
              overflow:      "hidden",
              textOverflow:  "ellipsis",
              whiteSpace:    "nowrap",
              maxWidth:      "60%",
            }}
          >
            {activeId
              ? (sessions.find((s) => s.id === activeId)?.title ?? "Session")
              : "no session selected"}
          </span>

          {/* Backend status indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <span
              style={{
                width:        6,
                height:       6,
                borderRadius: "50%",
                background:   statusColor,
                boxShadow:    statusGlow,
                transition:   "all 0.4s",
              }}
            />
            <span
              style={{
                fontFamily:    "'JetBrains Mono', monospace",
                fontSize:      9,
                color:         "#3f3f46",
                letterSpacing: "0.07em",
                textTransform: "uppercase",
              }}
            >
              {statusLabel}
            </span>
          </div>
        </div>

        {/* ── Message area or empty state ───────────────────────────────── */}
        {activeId ? (
          <MessageList messages={messages} onAskAboutSource={(query) => setInput(query)} />
        ) : (
          <EmptyState />
        )}

        {/* ── Input ─────────────────────────────────────────────────────── */}
        <InputBar
          value={input}
          onChange={setInput}
          onSend={handleSend}
          disabled={streaming || !activeId}
        />
      </div>
    </div>
  );
}