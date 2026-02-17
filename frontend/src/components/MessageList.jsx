/**
 * MessageList.jsx
 * ===============
 * Scrollable message history.
 * Auto-scrolls to the bottom whenever messages change
 * (new message added, or content accumulates during streaming).
 */

import React, { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble.jsx";

export default function MessageList({ messages, onAskAboutSource }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div
      style={{
        flex:      1,
        overflowY: "auto",
        padding:   "28px 0 12px",
      }}
    >
      <div
        style={{
          maxWidth: 780,
          margin:   "0 auto",
          padding:  "0 24px",
        }}
      >
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} onAskAboutSource={onAskAboutSource} />
        ))}
        {/* Invisible anchor to scroll to */}
        <div ref={bottomRef} style={{ height: 1 }} />
      </div>
    </div>
  );
}