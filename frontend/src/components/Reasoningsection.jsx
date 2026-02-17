/**
 * ReasoningSection.jsx
 * ====================
 * Displays the reasoning process (generated subqueries) for complex and multi_hop strategies.
 * Shows an expandable/collapsible section with the subqueries that were generated during retrieval.
 */

import React, { useState } from "react";

export default function ReasoningSection({ subqueries, strategy, onAskAbout }) {
  const [expanded, setExpanded] = useState(false);

  if (!subqueries || subqueries.length === 0) {
    return null;
  }

  const title = strategy === "complex" ? "Query Expansion" : "Multi-Hop Reasoning";
  const description = strategy === "complex" 
    ? "Generated query variations for broader retrieval coverage"
    : "Sequential sub-queries used to build context across multiple hops";

  const handleHeaderClick = () => {
    setExpanded(!expanded);
  };

  const handleQueryClick = (query) => {
    if (onAskAbout) {
      onAskAbout(query);
    }
  };

  return (
    <div
      style={{
        marginTop:    12,
        marginBottom: 8,
        borderRadius: 8,
        background:   "rgba(255,255,255,0.02)",
        border:       "1px solid rgba(255,255,255,0.06)",
        overflow:     "hidden",
      }}
    >
      {/* Header — clickable to expand/collapse */}
      <div
        onClick={handleHeaderClick}
        title="Click to expand/collapse"
        style={{
          padding:       "10px 14px",
          display:       "flex",
          alignItems:    "center",
          justifyContent: "space-between",
          cursor:        "pointer",
          userSelect:    "none",
          transition:    "background 0.15s",
          background:    expanded ? "rgba(255,255,255,0.03)" : "transparent",
        }}
        onMouseEnter={(e) => {
          if (!expanded) e.currentTarget.style.background = "rgba(255,255,255,0.025)";
        }}
        onMouseLeave={(e) => {
          if (!expanded) e.currentTarget.style.background = "transparent";
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <div
            style={{
              fontFamily:    "'Syne', sans-serif",
              fontSize:      12,
              fontWeight:    600,
              color:         "#d4d4d8",
              letterSpacing: "0.02em",
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize:   9,
              color:      "#52525b",
              letterSpacing: "0.05em",
            }}
          >
            {subqueries.length} {subqueries.length === 1 ? "query" : "queries"} generated
          </div>
        </div>

        {/* Expand/collapse icon */}
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          style={{
            transition: "transform 0.2s ease",
            transform:  expanded ? "rotate(180deg)" : "rotate(0deg)",
            opacity:    0.5,
          }}
        >
          <path
            d="M3 5L7 9L11 5"
            stroke="#a1a1aa"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Expandable content */}
      {expanded && (
        <div
          style={{
            padding:     "6px 14px 12px 14px",
            borderTop:   "1px solid rgba(255,255,255,0.05)",
            background:  "rgba(0,0,0,0.15)",
          }}
        >
          {/* Description */}
          <div
            style={{
              fontFamily:  "'JetBrains Mono', monospace",
              fontSize:    9,
              color:       "#71717a",
              marginBottom: 10,
              lineHeight:  1.5,
            }}
          >
            {description}
          </div>

          {/* Subquery list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {subqueries.map((query, i) => (
              <div
                key={i}
                style={{
                  display:      "flex",
                  gap:          10,
                  padding:      "8px 11px",
                  background:   "rgba(255,255,255,0.03)",
                  border:       "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 6,
                }}
              >
                {/* Query number badge */}
                <div
                  style={{
                    flexShrink:   0,
                    width:        20,
                    height:       20,
                    borderRadius: 4,
                    background:   "rgba(167,139,250,0.12)",
                    border:       "1px solid rgba(167,139,250,0.25)",
                    display:      "flex",
                    alignItems:   "center",
                    justifyContent: "center",
                    fontFamily:   "'JetBrains Mono', monospace",
                    fontSize:     9,
                    fontWeight:   600,
                    color:        "#a78bfa",
                  }}
                >
                  {i + 1}
                </div>

                {/* Query text */}
                <div
                  onClick={() => handleQueryClick(query)}
                  title="Click to ask about this query"
                  style={{
                    flex:        1,
                    fontFamily:  "'Crimson Pro', serif",
                    fontSize:    14,
                    lineHeight:  1.5,
                    color:       "#d4d4d8",
                    paddingTop:  1,
                    cursor:      "pointer",
                  }}
                >
                  {query}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}