// src/lib/useToast.jsx — Phase 4B
// ══════════════════════════════════════════════════════════════
// Lightweight global toast system. No dependencies.
// Usage:
//   import { toast } from "../lib/useToast.jsx";
//   toast.success("Gespeichert");
//   toast.error("Fehler beim Laden");
//   toast.info("Wird hochgeladen…");
// Mount <ToastContainer/> once in App.jsx.
// ══════════════════════════════════════════════════════════════
import React, { useState, useEffect, useCallback } from "react";

const TEAL  = "#16D7C5";
const CORAL = "#FF8A6B";
const INK   = "#1A1A2E";

// ── Global event bus ──────────────────────────────────────────
const listeners = new Set();
let _id = 0;

function emit(toast) {
  listeners.forEach(fn => fn({ ...toast, id: ++_id, ts: Date.now() }));
}

export const toast = {
  success: (msg, opts = {}) => emit({ type:"success", msg, ...opts }),
  error:   (msg, opts = {}) => emit({ type:"error",   msg, ...opts }),
  info:    (msg, opts = {}) => emit({ type:"info",     msg, ...opts }),
  warn:    (msg, opts = {}) => emit({ type:"warn",     msg, ...opts }),
};

// ── Config ────────────────────────────────────────────────────
const CONFIG = {
  success: { bg:"#16D7C5", icon:"✓", textColor:"#fff" },
  error:   { bg:"#EF4444", icon:"✕", textColor:"#fff" },
  info:    { bg:INK,       icon:"ℹ", textColor:"#fff" },
  warn:    { bg:"#F59E0B", icon:"⚠", textColor:"#fff" },
};

const CSS = `
@keyframes toastIn {
  from { opacity:0; transform:translateY(20px) scale(0.94); }
  to   { opacity:1; transform:translateY(0) scale(1); }
}
@keyframes toastOut {
  from { opacity:1; transform:translateY(0) scale(1); }
  to   { opacity:0; transform:translateY(12px) scale(0.93); }
}
`;
let _css = false;
function injectCSS() {
  if (_css || typeof document === "undefined") return;
  _css = true;
  const s = document.createElement("style"); s.textContent = CSS;
  document.head.appendChild(s);
}

// ── Single Toast ──────────────────────────────────────────────
function Toast({ t, onDismiss }) {
  const [exiting, setExiting] = useState(false);
  const cfg = CONFIG[t.type] || CONFIG.info;

  function dismiss() {
    setExiting(true);
    setTimeout(() => onDismiss(t.id), 220);
  }

  useEffect(() => {
    const dur = t.duration || (t.type === "error" ? 5000 : 3000);
    const timer = setTimeout(dismiss, dur);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      onClick={dismiss}
      style={{
        display:"flex", alignItems:"center", gap:10,
        padding:"11px 16px 11px 14px",
        background: cfg.bg,
        borderRadius:16,
        boxShadow:"0 4px 24px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.10)",
        cursor:"pointer",
        maxWidth:"calc(100vw - 32px)",
        animation: exiting
          ? "toastOut 0.22s ease both"
          : "toastIn 0.25s cubic-bezier(.22,1,.36,1) both",
        userSelect:"none",
        touchAction:"manipulation",
        pointerEvents:"auto",
      }}
    >
      <span style={{
        width:22, height:22, borderRadius:8,
        background:"rgba(255,255,255,0.22)",
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:12, fontWeight:800, color:"#fff", flexShrink:0,
      }}>{cfg.icon}</span>
      <span style={{
        fontSize:14, fontWeight:600,
        color: cfg.textColor,
        lineHeight:1.4,
      }}>{t.msg}</span>
    </div>
  );
}

// ── ToastContainer — mount once in App.jsx ────────────────────
export function ToastContainer() {
  injectCSS();
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    function add(t) { setToasts(prev => [...prev.slice(-4), t]); } // max 5
    listeners.add(add);
    return () => listeners.delete(add);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  if (!toasts.length) return null;

  return (
    <div style={{
      position:"fixed",
      bottom:`calc(env(safe-area-inset-bottom, 0px) + 84px)`,
      left:"50%", transform:"translateX(-50%)",
      zIndex:29000,
      display:"flex", flexDirection:"column-reverse", gap:8,
      alignItems:"center",
      pointerEvents:"none",
    }}>
      {toasts.map(t => (
        <Toast key={t.id} t={t} onDismiss={dismiss} />
      ))}
    </div>
  );
}
