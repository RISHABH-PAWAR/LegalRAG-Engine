/**
 * Landing.jsx
 * ===========
 * Introduction page. Explains what the system does, shows real
 * strategy names (matching rag_service.py), and links to /chat.
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Matches exactly the three strategies from rag_service.py / decide_query_complexity.py
const PIPELINE_STEPS = [
  {
    mono:   "COMPLEXITY",
    label:  "Query Classification",
    detail: "Cohere LLM decides: simple_conversation → CONV, factual → MQ+RRF, chained → M-HOP",
    color:  "#a78bfa",
  },
  {
    mono:   "RETRIEVAL",
    label:  "BM25 + FAISS",
    detail: "Sparse keyword search (rank-bm25) fused with dense semantic search (all-MiniLM-L6-v2 + FAISS)",
    color:  "#fb923c",
  },
  {
    mono:   "FUSION",
    label:  "Reciprocal Rank Fusion",
    detail: "Results from multiple queries/hops merged by RRF score: 1 / (60 + rank)",
    color:  "#4ade80",
  },
  {
    mono:   "GENERATE",
    label:  "Grounded Response",
    detail: "Cohere command-r generates answer from retrieved context + conversation summary",
    color:  "#60a5fa",
  },
];

const EXAMPLE_QUERIES = [
  "What are the grounds for terminating a contract under Indian law?",
  "Explain Section 8 inquiry when bigamy is alleged under the Special Marriage Act",
  "What constitutes a cognizable offence under BNSS 2023?",
  "Which age requirements apply under the Special Marriage Act and are there exceptions?",
];

export default function Landing() {
  const navigate  = useNavigate();
  const [in_, setIn] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setIn(true), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      style={{
        minHeight:      "100vh",
        background:     "#09090b",
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        padding:        "60px 24px 80px",
        position:       "relative",
        overflow:       "hidden",
      }}
    >
      {/* Radial glow behind headline */}
      <div
        style={{
          position:       "absolute",
          top:            0,
          left:           "50%",
          transform:      "translateX(-50%)",
          width:          600,
          height:         300,
          borderRadius:   "50%",
          background:     "radial-gradient(ellipse, rgba(167,139,250,0.08) 0%, transparent 70%)",
          pointerEvents:  "none",
        }}
      />

      {/* Fine grid */}
      <div
        style={{
          position:      "absolute",
          inset:         0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.013) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.013) 1px, transparent 1px)
          `,
          backgroundSize: "52px 52px",
          pointerEvents: "none",
        }}
      />

      {/* Content */}
      <div
        style={{
          position:    "relative",
          maxWidth:    660,
          width:       "100%",
          textAlign:   "center",
          opacity:     in_ ? 1 : 0,
          transform:   in_ ? "translateY(0)" : "translateY(14px)",
          transition:  "opacity 0.5s ease, transform 0.5s ease",
        }}
      >
        {/* Eyebrow badge */}
        <div
          style={{
            display:        "inline-flex",
            alignItems:     "center",
            gap:            7,
            padding:        "4px 14px",
            borderRadius:   20,
            border:         "1px solid rgba(167,139,250,0.2)",
            background:     "rgba(167,139,250,0.06)",
            marginBottom:   30,
          }}
        >
          <span
            style={{
              width:        6,
              height:       6,
              borderRadius: "50%",
              background:   "#a78bfa",
              boxShadow:    "0 0 8px rgba(167,139,250,0.8)",
            }}
          />
          <span
            style={{
              fontFamily:    "'JetBrains Mono', monospace",
              fontSize:      10,
              color:         "#a78bfa",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            RAG-Powered Legal Research
          </span>
        </div>

        {/* Headline */}
        <h1
          style={{
            fontFamily:    "'Syne', sans-serif",
            fontSize:      "clamp(38px, 6.5vw, 60px)",
            fontWeight:    800,
            lineHeight:    1.08,
            letterSpacing: "-0.025em",
            color:         "#fafafa",
            marginBottom:  18,
          }}
        >
          Legal research,<br />
          <span
            style={{
              background:            "linear-gradient(135deg, #a78bfa 0%, #c084fc 60%)",
              WebkitBackgroundClip:  "text",
              WebkitTextFillColor:   "transparent",
            }}
          >
            grounded in statutes.
          </span>
        </h1>

        {/* Sub */}
        <p
          style={{
            fontFamily:   "'Crimson Pro', serif",
            fontSize:     20,
            color:        "#52525b",
            lineHeight:   1.65,
            marginBottom: 38,
            maxWidth:     480,
            margin:       "0 auto 38px",
          }}
        >
          Ask complex questions in plain language — get precise answers with
          traceable citations from Indian legal statutes.
        </p>

        {/* CTA */}
        <button
          onClick={() => navigate("/chat")}
          style={{
            padding:       "13px 38px",
            borderRadius:  11,
            border:        "1px solid rgba(167,139,250,0.28)",
            background:    "rgba(167,139,250,0.12)",
            color:         "#c4b5fd",
            fontFamily:    "'Syne', sans-serif",
            fontSize:      15,
            fontWeight:    600,
            cursor:        "pointer",
            letterSpacing: "0.03em",
            transition:    "all 0.18s",
            marginBottom:  64,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background  = "rgba(167,139,250,0.22)";
            e.currentTarget.style.transform   = "translateY(-2px)";
            e.currentTarget.style.boxShadow   = "0 8px 30px rgba(167,139,250,0.15)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background  = "rgba(167,139,250,0.12)";
            e.currentTarget.style.transform   = "translateY(0)";
            e.currentTarget.style.boxShadow   = "none";
          }}
        >
          Start Researching →
        </button>

        {/* Pipeline steps */}
        <div
          style={{
            display:             "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap:                 10,
            marginBottom:        52,
            textAlign:           "left",
          }}
        >
          {PIPELINE_STEPS.map((step, i) => (
            <div
              key={i}
              style={{
                padding:      "14px 16px",
                background:   "rgba(255,255,255,0.02)",
                border:       "1px solid rgba(255,255,255,0.06)",
                borderRadius: 10,
                animation:    `fadeUp 0.4s ease ${0.05 + i * 0.06}s both`,
              }}
            >
              <div
                style={{
                  fontFamily:    "'JetBrains Mono', monospace",
                  fontSize:      9,
                  letterSpacing: "0.1em",
                  color:         step.color,
                  marginBottom:  5,
                  textTransform: "uppercase",
                }}
              >
                {step.mono}
              </div>
              <div
                style={{
                  fontFamily:   "'Syne', sans-serif",
                  fontSize:     13,
                  fontWeight:   600,
                  color:        "#a1a1aa",
                  marginBottom: 5,
                }}
              >
                {step.label}
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize:   10,
                  color:      "#3f3f46",
                  lineHeight: 1.6,
                }}
              >
                {step.detail}
              </div>
            </div>
          ))}
        </div>

        {/* Example queries */}
        <div style={{ textAlign: "left" }}>
          <div
            style={{
              fontFamily:    "'JetBrains Mono', monospace",
              fontSize:      9,
              letterSpacing: "0.1em",
              color:         "#27272a",
              textTransform: "uppercase",
              marginBottom:  12,
              textAlign:     "center",
            }}
          >
            Try asking
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {EXAMPLE_QUERIES.map((q, i) => (
              <div
                key={i}
                onClick={() => navigate("/chat")}
                style={{
                  padding:      "10px 16px",
                  background:   "rgba(255,255,255,0.02)",
                  border:       "1px solid rgba(255,255,255,0.055)",
                  borderRadius: 8,
                  cursor:       "pointer",
                  fontFamily:   "'Crimson Pro', serif",
                  fontSize:     16,
                  color:        "#52525b",
                  lineHeight:   1.4,
                  transition:   "all 0.14s",
                  animation:    `fadeUp 0.4s ease ${0.28 + i * 0.06}s both`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background   = "rgba(167,139,250,0.05)";
                  e.currentTarget.style.borderColor  = "rgba(167,139,250,0.15)";
                  e.currentTarget.style.color        = "#a1a1aa";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background  = "rgba(255,255,255,0.02)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.055)";
                  e.currentTarget.style.color       = "#52525b";
                }}
              >
                {q}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}