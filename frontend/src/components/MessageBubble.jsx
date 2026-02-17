/**
 * MessageBubble.jsx
 * =================
 * Renders a single chat message.
 *
 * Message shape (managed in Chat.jsx state):
 *   {
 *     id:        string,                    // local uuid
 *     role:      "user" | "assistant",
 *     content:   string,                    // accumulates as tokens arrive
 *     loading:   boolean,                   // true before strategy arrives
 *     streaming: boolean,                   // true between strategy→done
 *     strategy:  string | null,             // set on "strategy" event
 *     sources:   Array<{title,page,snippet}>// set on "sources" event
 *   }
 *
 * Rendering lifecycle for an AI message:
 *   1. loading=true  → shimmer skeleton (waiting for strategy event)
 *   2. streaming=true → content accumulates word by word + blinking cursor
 *   3. loading=false, streaming=false → final state: badge + sources shown
 */

import React from "react";
import StrategyBadge     from "./StrategyBadge.jsx";
import SourceCard        from "./SourceCard.jsx";
import ReasoningSection  from "./ReasoningSection.jsx";

// Blinking cursor shown while streaming
function Cursor() {
  return (
    <span
      style={{
        display:        "inline-block",
        width:          2,
        height:         "0.85em",
        background:     "#71717a",
        marginLeft:     2,
        verticalAlign:  "text-bottom",
        borderRadius:   1,
        animation:      "blink 1s step-end infinite",
      }}
    />
  );
}

// Skeleton shimmer shown in loading state
function Skeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      {[88, 96, 72].map((w, i) => (
        <div
          key={i}
          style={{
            height:          13,
            width:           `${w}%`,
            borderRadius:    3,
            backgroundImage: "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.04) 75%)",
            backgroundSize:  "400% 100%",
            animation:       "shimmer 1.6s infinite linear",
          }}
        />
      ))}
    </div>
  );
}

export default function MessageBubble({ message, onAskAboutSource }) {
  const isUser = message.role === "user";

  return (
    <div
      style={{
        display:        "flex",
        flexDirection:  "column",
        alignItems:     isUser ? "flex-end" : "flex-start",
        marginBottom:   28,
        animation:      "fadeUp 0.22s ease-out",
      }}
    >
      {/* Role label */}
      <div
        style={{
          fontFamily:    "'JetBrains Mono', monospace",
          fontSize:      9,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color:         "#3f3f46",
          marginBottom:  6,
          paddingLeft:   isUser ? 0 : 2,
          paddingRight:  isUser ? 2 : 0,
        }}
      >
        {isUser ? "you" : "lexrag"}
      </div>

      {/* Bubble */}
      <div
        style={{
          maxWidth:  isUser ? "72%" : "88%",
          padding:   "13px 17px",
          borderRadius: isUser
            ? "14px 3px 14px 14px"
            : "3px 14px 14px 14px",
          background: isUser
            ? "rgba(167,139,250,0.09)"
            : "rgba(255,255,255,0.03)",
          border: isUser
            ? "1px solid rgba(167,139,250,0.18)"
            : "1px solid rgba(255,255,255,0.065)",
        }}
      >
        {message.loading ? (
          <Skeleton />
        ) : (
          <div
            style={{
              fontFamily: "'Crimson Pro', serif",
              fontSize:   17.5,
              lineHeight: 1.75,
              color:      isUser ? "#d4d4d8" : "#e4e4e7",
              whiteSpace: "pre-wrap",
              wordBreak:  "break-word",
            }}
          >
            {message.content}
            {message.streaming && <Cursor />}
          </div>
        )}
      </div>

      {/* Strategy + sources — shown only on AI messages after streaming completes */}
      {!isUser && !message.loading && !message.streaming && message.strategy && (
        <div style={{ marginTop: 10, paddingLeft: 2, width: "min(720px, 88vw)" }}>
          {/* Strategy badge */}
          <div style={{ marginBottom: 10 }}>
            <StrategyBadge strategy={message.strategy} />
          </div>

          {/* Reasoning section — show subqueries if available */}
          {message.reasoning && message.reasoning.length > 0 && (
            <ReasoningSection subqueries={message.reasoning} strategy={message.strategy} onAskAbout={onAskAboutSource} />
          )}

          {/* Source cards */}
          {message.sources && message.sources.length > 0 && (
            <>
              <div
                style={{
                  fontFamily:    "'JetBrains Mono', monospace",
                  fontSize:      9,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color:         "#3f3f46",
                  marginBottom:  7,
                  marginTop:     message.reasoning ? 10 : 0,
                }}
              >
                {message.sources.length} source{message.sources.length !== 1 ? "s" : ""} retrieved
              </div>
              {message.sources.map((src, i) => (
                <SourceCard key={i} source={src} index={i} onAskAbout={onAskAboutSource} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}