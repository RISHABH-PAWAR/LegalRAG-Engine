/**
 * Sidebar.jsx
 * ===========
 * Left panel: brand, new-session button, session list, delete.
 *
 * Session object shape (from main.py → rag_service._session_meta):
 *   { id: string, title: string, turns: number }
 *
 * Props:
 *   sessions:  Array<Session>
 *   activeId:  string | null
 *   onNew:     () => void
 *   onSelect:  (id: string) => void
 *   onDelete:  (id: string) => void
 *   streaming: boolean         — disables new/delete while response is in flight
 */

import React from "react";

// ── Tiny inline SVG icons ────────────────────────────────────────────────────
function ScaleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="3" x2="12" y2="21" />
      <path d="M5 7l7-4 7 4" />
      <path d="M5 7l-3 7h6L5 7z" />
      <path d="M19 7l-3 7h6l-3-7z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}

// ── Session row ──────────────────────────────────────────────────────────────
function SessionRow({ session, isActive, onSelect, onDelete, disabled }) {
  return (
    <div
      onClick={() => !disabled && onSelect(session.id)}
      style={{
        display:    "flex",
        alignItems: "center",
        gap:        8,
        padding:    "8px 10px",
        borderRadius: 8,
        marginBottom: 2,
        cursor:     disabled ? "not-allowed" : "pointer",
        background: isActive ? "rgba(167,139,250,0.08)" : "transparent",
        border:     `1px solid ${isActive ? "rgba(167,139,250,0.16)" : "transparent"}`,
        transition: "background 0.14s",
        opacity:    disabled && !isActive ? 0.5 : 1,
      }}
      onMouseEnter={(e) => {
        if (!isActive && !disabled)
          e.currentTarget.style.background = "rgba(255,255,255,0.03)";
      }}
      onMouseLeave={(e) => {
        if (!isActive)
          e.currentTarget.style.background = "transparent";
      }}
    >
      {/* Session info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily:  "'Syne', sans-serif",
            fontSize:    12,
            fontWeight:  500,
            color:       isActive ? "#c4b5fd" : "#71717a",
            whiteSpace:  "nowrap",
            overflow:    "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {session.title}
        </div>
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize:   9,
            color:      "#3f3f46",
            marginTop:  2,
          }}
        >
          {session.turns} turn{session.turns !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Delete button — visible on hover or when active */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) onDelete(session.id);
        }}
        title="Delete session"
        style={{
          background:  "none",
          border:      "none",
          cursor:      disabled ? "not-allowed" : "pointer",
          color:       "#3f3f46",
          padding:     "3px 4px",
          borderRadius: 4,
          display:     "flex",
          alignItems:  "center",
          flexShrink:  0,
          opacity:     isActive ? 0.7 : 0,
          transition:  "color 0.15s, opacity 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color   = "#ef4444";
          e.currentTarget.style.opacity = "1";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color   = "#3f3f46";
          e.currentTarget.style.opacity = isActive ? "0.7" : "0";
        }}
        // Always show when parent row is hovered
        ref={(el) => {
          if (!el) return;
          const parent = el.closest("div[data-row]");
          // handled via CSS above
        }}
      >
        <TrashIcon />
      </button>
    </div>
  );
}

// ── Main Sidebar ─────────────────────────────────────────────────────────────
export default function Sidebar({ sessions, activeId, onNew, onSelect, onDelete, streaming }) {
  return (
    <div
      style={{
        width:       252,
        flexShrink:  0,
        height:      "100vh",
        background:  "#09090b",
        borderRight: "1px solid rgba(255,255,255,0.05)",
        display:     "flex",
        flexDirection: "column",
        overflow:    "hidden",
      }}
    >
      {/* ── Brand ─────────────────────────────────────────────────────────── */}
      <div
        style={{
          padding:      "20px 16px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        {/* Logo + name */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div
            style={{
              width:          32,
              height:         32,
              borderRadius:   9,
              background:     "rgba(167,139,250,0.1)",
              border:         "1px solid rgba(167,139,250,0.2)",
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              color:          "#a78bfa",
              flexShrink:     0,
            }}
          >
            <ScaleIcon />
          </div>
          <div>
            <div
              style={{
                fontFamily:    "'Syne', sans-serif",
                fontSize:      15,
                fontWeight:    700,
                color:         "#e4e4e7",
                letterSpacing: "0.03em",
              }}
            >
              LexRAG
            </div>
            <div
              style={{
                fontFamily:    "'JetBrains Mono', monospace",
                fontSize:      9,
                color:         "#3f3f46",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              Legal Intelligence
            </div>
          </div>
        </div>

        {/* New session button */}
        <button
          onClick={onNew}
          disabled={streaming}
          style={{
            width:       "100%",
            padding:     "8px 12px",
            borderRadius: 8,
            border:      "1px dashed rgba(167,139,250,0.28)",
            background:  "rgba(167,139,250,0.05)",
            color:       streaming ? "#3f3f46" : "#a78bfa",
            cursor:      streaming ? "not-allowed" : "pointer",
            display:     "flex",
            alignItems:  "center",
            gap:         7,
            fontFamily:  "'Syne', sans-serif",
            fontSize:    12,
            fontWeight:  500,
            transition:  "all 0.15s",
          }}
          onMouseEnter={(e) => {
            if (!streaming) {
              e.currentTarget.style.background   = "rgba(167,139,250,0.11)";
              e.currentTarget.style.borderStyle  = "solid";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background  = "rgba(167,139,250,0.05)";
            e.currentTarget.style.borderStyle = "dashed";
          }}
        >
          <PlusIcon />
          New Research Session
        </button>
      </div>

      {/* ── Session list ───────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 8px" }}>
        {sessions.length === 0 ? (
          <div
            style={{
              padding:       "24px 8px",
              textAlign:     "center",
              fontFamily:    "'JetBrains Mono', monospace",
              fontSize:      9,
              letterSpacing: "0.08em",
              color:         "#27272a",
              textTransform: "uppercase",
              lineHeight:    1.8,
            }}
          >
            No sessions yet.<br />Create one to start.
          </div>
        ) : (
          <>
            <div
              style={{
                fontFamily:    "'JetBrains Mono', monospace",
                fontSize:      9,
                letterSpacing: "0.1em",
                color:         "#27272a",
                textTransform: "uppercase",
                padding:       "4px 10px 8px",
              }}
            >
              Sessions
            </div>
            {sessions.map((s) => (
              <SessionRow
                key={s.id}
                session={s}
                isActive={s.id === activeId}
                onSelect={onSelect}
                onDelete={onDelete}
                disabled={streaming}
              />
            ))}
          </>
        )}
      </div>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <div
        style={{
          padding:       "12px 16px",
          borderTop:     "1px solid rgba(255,255,255,0.04)",
          fontFamily:    "'JetBrains Mono', monospace",
          fontSize:      9,
          letterSpacing: "0.06em",
          color:         "#27272a",
          textAlign:     "center",
          textTransform: "uppercase",
        }}
      >
        BM25 · FAISS · RRF · Cohere
      </div>
    </div>
  );
}