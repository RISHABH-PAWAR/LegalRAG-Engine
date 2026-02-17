/**
 * SourceCard.jsx
 * ==============
 * Renders one retrieved source document.
 *
 * Source object shape (from rag_service.py lines 193–226):
 *   {
 *     title:   string,  // doc.metadata.get("source", "Legal Document") — full file path
 *     page:    number | "—",  // doc.metadata.get("page", "—") — 0-indexed from PyPDFLoader
 *     snippet: string,  // doc.page_content[:180].strip()
 *   }
 *
 * "title" is often a full file path like "./data/raw/special_marriage_act.pdf"
 * so we extract just the filename and strip the extension for display.
 */

import React, { useState } from "react";

function cleanTitle(raw) {
  if (!raw || raw === "Legal Document") return "Legal Document";
  // Strip directory path
  const filename = raw.replace(/\\/g, "/").split("/").pop();
  // Strip extension
  return filename.replace(/\.(pdf|txt|md|docx)$/i, "").replace(/_/g, " ");
}

export default function SourceCard({ source, index, onAskAbout }) {
  const [expanded, setExpanded] = useState(false);

  const title = cleanTitle(source.title);
  // page from PyPDFLoader is 0-indexed, display as 1-indexed
  const page  = source.page !== undefined && source.page !== "—"
    ? `p. ${Number(source.page) + 1}`
    : null;

  const handleClick = (e) => {
    if (e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) {
      setExpanded((prev) => !prev);
    } else {
      if (onAskAbout) {
        onAskAbout(`Can you explain more about "${title}"${page ? ` (${page})` : ""}?`);
      } else {
        setExpanded((prev) => !prev);
      }
    }
  };

  return (
    <button
      onClick={handleClick}
      title="Click to ask about this source"
      style={{
        display:    "block",
        width:      "100%",
        textAlign:  "left",
        background: expanded ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
        border:     `1px solid ${expanded ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.055)"}`,
        borderRadius: 7,
        padding:    "9px 12px",
        cursor:     "pointer",
        marginBottom: 5,
        transition: "background 0.15s, border-color 0.15s",
      }}
      onMouseEnter={(e) => {
        if (!expanded) e.currentTarget.style.background = "rgba(255,255,255,0.035)";
      }}
      onMouseLeave={(e) => {
        if (!expanded) e.currentTarget.style.background = "rgba(255,255,255,0.02)";
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        {/* Index number */}
        <span
          style={{
            width:       18,
            height:      18,
            borderRadius: 4,
            background:  "rgba(161,161,170,0.08)",
            border:      "1px solid rgba(161,161,170,0.12)",
            display:     "flex",
            alignItems:  "center",
            justifyContent: "center",
            flexShrink:  0,
            fontFamily:  "'JetBrains Mono', monospace",
            fontSize:    10,
            color:       "#52525b",
            lineHeight:  1,
          }}
        >
          {index + 1}
        </span>

        {/* Title */}
        <span
          style={{
            flex:       1,
            fontFamily: "'Syne', sans-serif",
            fontSize:   12,
            fontWeight: 500,
            color:      "#a1a1aa",
            whiteSpace: "nowrap",
            overflow:   "hidden",
            textOverflow: "ellipsis",
            textTransform: "capitalize",
          }}
        >
          {title}
        </span>

        {/* Page number */}
        {page && (
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize:   10,
              color:      "#3f3f46",
              flexShrink: 0,
            }}
          >
            {page}
          </span>
        )}

        {/* Chevron */}
        <span
          style={{
            color:      "#3f3f46",
            fontSize:   10,
            flexShrink: 0,
            transform:  expanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
            lineHeight: 1,
          }}
        >
          ▾
        </span>
      </div>

      {/* Expanded snippet */}
      {expanded && source.snippet && (
        <div
          style={{
            marginTop:  10,
            paddingTop: 10,
            borderTop:  "1px solid rgba(255,255,255,0.05)",
            fontFamily: "'Crimson Pro', serif",
            fontSize:   14,
            fontStyle:  "italic",
            color:      "#52525b",
            lineHeight: 1.65,
          }}
        >
          "{source.snippet}…"
        </div>
      )}
    </button>
  );
}