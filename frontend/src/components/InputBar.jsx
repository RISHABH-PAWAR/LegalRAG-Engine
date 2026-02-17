/**
 * InputBar.jsx
 * ============
 * Auto-resizing textarea with send button.
 *
 * Props:
 *   value:    string           — controlled value
 *   onChange: (val) => void    — update parent state
 *   onSend:   () => void       — called when user submits
 *   disabled: boolean          — true while streaming (prevents double-send)
 */

import React, { useRef, useEffect } from "react";

// Send arrow SVG
function SendIcon({ color }) {
  return (
    <svg
      width="15" height="15" viewBox="0 0 24 24"
      fill="none" stroke={color} strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
    >
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

export default function InputBar({ value, onChange, onSend, disabled }) {
  const textareaRef = useRef(null);

  // Auto-resize: grow up to 160px then scroll
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [value]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // don't insert newline
      if (canSend) onSend();
    }
  };

  const canSend = !disabled && value.trim().length > 0;

  return (
    <div
      style={{
        borderTop:       "1px solid rgba(255,255,255,0.055)",
        background:      "rgba(9,9,11,0.92)",
        backdropFilter:  "blur(14px)",
        padding:         "14px 24px 18px",
        flexShrink:      0,
      }}
    >
      <div
        style={{
          maxWidth: 780,
          margin:   "0 auto",
        }}
      >
        {/* Input row */}
        <div
          style={{
            display:    "flex",
            alignItems: "flex-end",
            gap:        10,
            background: "rgba(255,255,255,0.025)",
            border:     "1px solid rgba(255,255,255,0.09)",
            borderRadius: 13,
            padding:    "11px 11px 11px 17px",
            transition: "border-color 0.18s",
          }}
          onFocusCapture={(e) => {
            e.currentTarget.style.borderColor = "rgba(167,139,250,0.32)";
          }}
          onBlurCapture={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)";
          }}
        >
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={
              disabled
                ? "Researching…"
                : "Ask a legal question… (Shift+Enter for new line)"
            }
            rows={1}
            style={{
              flex:       1,
              background: "none",
              border:     "none",
              outline:    "none",
              resize:     "none",
              color:      "#e4e4e7",
              fontFamily: "'Crimson Pro', serif",
              fontSize:   17,
              lineHeight: 1.5,
              maxHeight:  160,
              overflowY:  "auto",
              opacity:    disabled ? 0.45 : 1,
              cursor:     disabled ? "not-allowed" : "text",
            }}
          />

          {/* Send button */}
          <button
            onClick={() => canSend && onSend()}
            disabled={!canSend}
            title="Send  (Enter)"
            style={{
              width:          36,
              height:         36,
              borderRadius:   9,
              border:         "none",
              flexShrink:     0,
              cursor:         canSend ? "pointer" : "not-allowed",
              background:     canSend
                ? "rgba(167,139,250,0.14)"
                : "rgba(255,255,255,0.04)",
              transition:     "background 0.15s, transform 0.1s",
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
            }}
            onMouseDown={(e) => { if (canSend) e.currentTarget.style.transform = "scale(0.92)"; }}
            onMouseUp={(e)   => { e.currentTarget.style.transform = "scale(1)"; }}
            onMouseEnter={(e) => { if (canSend) e.currentTarget.style.background = "rgba(167,139,250,0.24)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = canSend ? "rgba(167,139,250,0.14)" : "rgba(255,255,255,0.04)"; }}
          >
            <SendIcon color={canSend ? "#a78bfa" : "#3f3f46"} />
          </button>
        </div>

        {/* Disclaimer */}
        <p
          style={{
            marginTop:     7,
            textAlign:     "center",
            fontFamily:    "'JetBrains Mono', monospace",
            fontSize:      9,
            letterSpacing: "0.07em",
            color:         "#27272a",
            textTransform: "uppercase",
          }}
        >
          Not legal advice — for research purposes only
        </p>
      </div>
    </div>
  );
}
