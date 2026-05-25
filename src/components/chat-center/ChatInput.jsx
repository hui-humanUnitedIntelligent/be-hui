// chat-center/ChatInput.jsx v3
// Phase 3A: Echter Composer — ruhig, warm, editorial
// Props: onSend(text), sending (bool), placeholder

import React, { useRef } from "react";
import { HUI } from "../../design/hui.design.js";

const C = {
  teal:  HUI.COLOR.teal,
  teal2: HUI.COLOR.tealDeep || HUI.COLOR.teal,
  muted: "rgba(80,80,80,0.45)",
};

const CSS = `
  @keyframes ci-spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
`;

export default function ChatInput({
  onSend,
  sending    = false,
  placeholder = "Schreib etwas Echtes\u2026",
}) {
  const [text,    setText]    = React.useState("");
  const [focused, setFocused] = React.useState(false);
  const textRef = useRef(null);

  async function send() {
    if (!text.trim() || sending) return;
    try {
      const result = await onSend?.(text.trim());
      if (result?.error) return;
      setText("");
      // Kurz warten, dann Fokus zurück — Safari-safe
      requestAnimationFrame(() => textRef.current?.focus());
    } catch {
      // Text bleibt stehen, damit auf iPad/iPhone direkt Retry möglich ist.
    }
  }

  function onKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  const canSend = !!text.trim() && !sending;

  return (
    <div style={{
      // Safe-area aware padding-bottom für iOS
      padding: "10px 14px max(20px, env(safe-area-inset-bottom, 20px))",
      background: "rgba(242,244,248,0.90)",
      backdropFilter: "blur(24px)",
      WebkitBackdropFilter: "blur(24px)",
      borderTop: "1px solid rgba(22,215,197,0.10)",
      flexShrink: 0,
      position: "relative",
      zIndex: 10,
      width: "100%",
      // DEBUG: temporär — zum Beweis dass Composer existiert
      outline: "3px solid rgba(22,215,197,0.40)",
    }}>
      <style>{CSS}</style>

      <div style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 10,
      }}>

        {/* Textarea Wrapper */}
        <div style={{
          flex: 1,
          background: focused
            ? "rgba(255,255,255,0.88)"
            : "rgba(255,255,255,0.72)",
          border: focused
            ? `1.5px solid rgba(22,215,197,0.38)`
            : "1.5px solid rgba(0,0,0,0.07)",
          borderRadius: 22,
          padding: "10px 16px",
          display: "flex",
          alignItems: "flex-end",
          gap: 8,
          boxShadow: focused
            ? "0 0 0 3px rgba(22,215,197,0.10), 0 4px 14px rgba(0,0,0,0.06)"
            : "0 2px 8px rgba(0,0,0,0.05)",
          transition: "border 0.28s ease, box-shadow 0.28s ease, background 0.24s ease",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}>
          <textarea
            ref={textRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={onKey}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={placeholder}
            rows={1}
            style={{
              flex: 1,
              border: "none",
              background: "none",
              outline: "none",
              fontSize: 14.5,
              lineHeight: 1.55,
              color: HUI.COLOR.ink,
              fontFamily: "inherit",
              resize: "none",
              maxHeight: 120,
              overflowY: "auto",
              WebkitOverflowScrolling: "touch",
              // auto-grow via rows trick
            }}
          />
        </div>

        {/* Send Button */}
        <button
          onClick={send}
          disabled={!canSend}
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            flexShrink: 0,
            background: canSend
              ? `linear-gradient(135deg, ${C.teal} 0%, ${C.teal2} 100%)`
              : "rgba(255,255,255,0.75)",
            border: canSend ? "none" : "1px solid rgba(0,0,0,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: canSend ? "pointer" : "default",
            opacity: sending ? 0.65 : 1,
            boxShadow: canSend
              ? "0 4px 16px rgba(22,215,197,0.28), 0 2px 6px rgba(0,0,0,0.04)"
              : "0 2px 8px rgba(0,0,0,0.06)",
            transition: "background 0.22s, box-shadow 0.22s, opacity 0.18s",
            WebkitTapHighlightColor: "transparent",
            touchAction: "manipulation",
          }}
        >
          {sending ? (
            /* Spinner */
            <svg
              width="17" height="17" viewBox="0 0 24 24" fill="none"
              style={{ animation: "ci-spin 0.75s linear infinite" }}
            >
              <circle cx="12" cy="12" r="9"
                stroke="rgba(22,215,197,0.35)" strokeWidth="2.5"/>
              <path d="M12 3a9 9 0 0 1 9 9"
                stroke={C.teal} strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          ) : canSend ? (
            /* Send Arrow */
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13"
                stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 2L15 22L11 13L2 9L22 2Z"
                stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            /* Mikrofon (leer) */
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"
                stroke={C.teal} strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"
                stroke={C.teal} strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="12" y1="19" x2="12" y2="23"
                stroke={C.teal} strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="8" y1="23" x2="16" y2="23"
                stroke={C.teal} strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
