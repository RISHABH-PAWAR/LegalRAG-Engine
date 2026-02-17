/**
 * StrategyBadge.jsx
 * =================
 * Displays the retrieval strategy chosen by decide_query_complexity.
 *
 * The three possible strategy strings come from rag_service.py line 160
 * and match QueryComplexitySchema in decide_query_complexity.py:
 *   "complex"             → MultiQueryRetriever + RRF
 *   "multi_hop"           → MultiHopRetriever
 *   "simple_conversation" → no retrieval
 */

import React, { useState } from "react";

// Exact string values emitted by rag_service.py → strategy event
const STRATEGIES = {
  complex: {
    label:  "Multi-Query · RRF",
    mono:   "MQ+RRF",
    color:  "#a78bfa",
    glow:   "rgba(167,139,250,0.35)",
    bg:     "rgba(167,139,250,0.07)",
    border: "rgba(167,139,250,0.22)",
    tip:    "Query expanded into 3–5 variants → BM25 + FAISS retrieval per variant → Reciprocal Rank Fusion to re-rank results",
  },
  multi_hop: {
    label:  "Multi-Hop",
    mono:   "M-HOP",
    color:  "#fb923c",
    glow:   "rgba(251,146,60,0.35)",
    bg:     "rgba(251,146,60,0.07)",
    border: "rgba(251,146,60,0.22)",
    tip:    "Query decomposed into sequential sub-queries → each hop retrieves docs using BM25+FAISS+RRF → context chains across hops",
  },
  simple_conversation: {
    label:  "Conversational",
    mono:   "CONV",
    color:  "#4ade80",
    glow:   "rgba(74,222,128,0.35)",
    bg:     "rgba(74,222,128,0.07)",
    border: "rgba(74,222,128,0.22)",
    tip:    "No retrieval needed — query classified as conversational, handled directly without document lookup",
  },
};

// Fallback for any unexpected value
const UNKNOWN = {
  label: "Unknown", mono: "—", color: "#71717a",
  glow: "transparent", bg: "rgba(113,113,122,0.07)", border: "rgba(113,113,122,0.2)",
  tip: "Strategy could not be determined",
};

export default function StrategyBadge({ strategy }) {
  const [open, setOpen] = useState(false);
  const s = STRATEGIES[strategy] ?? UNKNOWN;

  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
      {/* Badge */}
      <div
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        style={{
          display:    "inline-flex",
          alignItems: "center",
          gap:        6,
          padding:    "3px 10px 3px 8px",
          borderRadius: 5,
          background: s.bg,
          border:     `1px solid ${s.border}`,
          cursor:     "default",
          userSelect: "none",
        }}
      >
        {/* Pulse dot */}
        <span
          style={{
            width:       6,
            height:      6,
            borderRadius: "50%",
            background:  s.color,
            boxShadow:   `0 0 6px ${s.glow}`,
            flexShrink:  0,
          }}
        />
        <span
          style={{
            fontFamily:    "'JetBrains Mono', monospace",
            fontSize:      10,
            letterSpacing: "0.07em",
            color:         s.color,
            lineHeight:    1,
          }}
        >
          {s.mono}
        </span>
        <span
          style={{
            fontFamily:    "'Syne', sans-serif",
            fontSize:      11,
            color:         s.color,
            opacity:       0.7,
            marginLeft:    2,
          }}
        >
          {s.label}
        </span>
      </div>

      {/* Tooltip — appears above the badge */}
      {open && (
        <div
          style={{
            position:   "absolute",
            bottom:     "calc(100% + 8px)",
            left:       0,
            width:      280,
            background: "#111113",
            border:     "1px solid rgba(255,255,255,0.08)",
            borderRadius: 8,
            padding:    "10px 14px",
            zIndex:     100,
            pointerEvents: "none",
            boxShadow:  "0 16px 48px rgba(0,0,0,0.55)",
          }}
        >
          <div
            style={{
              fontFamily:    "'Syne', sans-serif",
              fontSize:      11,
              fontWeight:    600,
              color:         s.color,
              marginBottom:  5,
              letterSpacing: "0.04em",
            }}
          >
            {s.label}
          </div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize:   10,
              color:      "#52525b",
              lineHeight: 1.6,
            }}
          >
            {s.tip}
          </div>
        </div>
      )}
    </div>
  );
}