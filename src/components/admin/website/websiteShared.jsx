// src/components/admin/website/websiteShared.jsx
// Gemeinsame Komponenten und Hooks für HUI Website Admin

import { useState, useEffect, useCallback } from "react";

// ── Farb-System (identisch mit Admin.jsx) ──
export const C = {
  bg:"#0A0F1E", card:"#111827", card2:"#1A2235", border:"#1E2D45",
  text:"#F1F5F9", sub:"#94A3B8", muted:"#475569",
  orange:"#F97316", green:"#10B981", red:"#EF4444",
  teal:"#2ABFAC", coral:"#FF6B5B", gold:"#F5A623",
  yellow:"#FBBF24", purple:"#A78BFA", blue:"#3B82F6",
};

export const card = { background:C.card, borderRadius:16, padding:20, border:`1px solid ${C.border}`, marginBottom:16 };

// ── Status-Indikatoren ──
export const STATUS = {
  ok:      { icon: "🟢", color: C.green,  label: "Alles in Ordnung" },
  warn:    { icon: "🟡", color: C.yellow, label: "Aufmerksamkeit" },
  error:   { icon: "🔴", color: C.red,    label: "Problem erkannt" },
  unknown: { icon: "⚪", color: C.sub,    label: "Nicht geprueft" },
};

export function StatusDot({ status }) {
  const s = STATUS[status] || STATUS.unknown;
  return <span style={{ fontSize: 14 }}>{s.icon}</span>;
}

export function StatusBadge({ status, label }) {
  const s = STATUS[status] || STATUS.unknown;
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:6,
      padding:"3px 10px", borderRadius:99,
      background: s.color + "15", color: s.color,
      fontSize:11, fontWeight:600,
    }}>
      {s.icon} {label || s.label}
    </span>
  );
}

// ── Status-Karte ──
export function StatusCard({ title, items }) {
  return (
    <div style={card}>
      <div style={{ fontWeight:600, fontSize:14, marginBottom:12, color:C.teal }}>{title}</div>
      {items.map((item, i) => (
        <div key={i} style={{
          display:"flex", alignItems:"center", gap:10,
          padding:"10px 0", borderBottom: i < items.length-1 ? `1px solid ${C.border}` : "none",
        }}>
          <StatusDot status={item.status} />
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, color:C.text, fontWeight:500 }}>{item.label}</div>
            {item.detail && <div style={{ fontSize:12, color:C.sub, marginTop:2 }}>{item.detail}</div>}
          </div>
          {item.badge && <StatusBadge status={item.status} label={item.badge} />}
        </div>
      ))}
    </div>
  );
}

// ── Hook: URL pruefen ──
export function useUrlCheck(url) {
  const [result, setResult] = useState({ status: "loading", httpStatus: null, time: null });

  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const start = performance.now();
        const res = await fetch(url, { method: "HEAD", redirect: "follow", cache: "no-store" });
        const elapsed = Math.round(performance.now() - start);
        if (cancelled) return;
        setResult({
          status: res.ok ? "ok" : "error",
          httpStatus: res.status,
          time: elapsed,
        });
      } catch (e) {
        if (!cancelled) setResult({ status: "error", httpStatus: null, time: null });
      }
    }
    check();
    return () => { cancelled = true; };
  }, [url]);

  return result;
}

// ── Hook: Content pruefen (GET, spezifischen Content pruefen) ──
export function useContentCheck(url, checkFn) {
  const [result, setResult] = useState({ status: "loading", data: null });

  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const res = await fetch(url, { redirect: "follow", cache: "no-store" });
        const text = await res.text();
        if (cancelled) return;
        const checkResult = checkFn ? checkFn(text, res) : { status: res.ok ? "ok" : "error" };
        setResult(checkResult);
      } catch (e) {
        if (!cancelled) setResult({ status: "error", data: null });
      }
    }
    check();
    return () => { cancelled = true; };
  }, [url]); // eslint-disable-line

  return result;
}

// ── Activity Log Item ──
export function ActivityItem({ icon, title, subtitle, time }) {
  return (
    <div style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"10px 0", borderBottom:`1px solid ${C.border}` }}>
      <span style={{ fontSize:14, flexShrink:0 }}>{icon}</span>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:13, color:C.text, fontWeight:500 }}>{title}</div>
        {subtitle && <div style={{ fontSize:12, color:C.sub, marginTop:2 }}>{subtitle}</div>}
      </div>
      {time && <span style={{ fontSize:11, color:C.muted, whiteSpace:"nowrap" }}>{time}</span>}
    </div>
  );
}

// ── Section Header ──
export function PageHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom:24 }}>
      <h1 style={{ margin:0, fontSize:22, fontWeight:600, color:C.text }}>{title}</h1>
      {subtitle && <div style={{ color:C.sub, fontSize:13, marginTop:4 }}>{subtitle}</div>}
    </div>
  );
}

// ── Link Button ──
export function LinkButton({ href, label, external }) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      style={{
        display:"inline-flex", alignItems:"center", gap:4,
        padding:"8px 16px", borderRadius:20,
        background:C.card2, color:C.teal,
        fontSize:12, fontWeight:600,
        border:`1px solid ${C.border}`,
        textDecoration:"none", cursor:"pointer",
        transition:"background .15s",
      }}
      onMouseEnter={e => e.currentTarget.style.background = C.card}
      onMouseLeave={e => e.currentTarget.style.background = C.card2}
    >
      {label}
    </a>
  );
}

// ── Action Button ──
export function ActionButton({ onClick, label, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display:"inline-flex", alignItems:"center", gap:4,
        padding:"8px 16px", borderRadius:20, border:"none",
        background: disabled ? C.card2 : C.teal,
        color: disabled ? C.muted : "#fff",
        fontSize:12, fontWeight:600, cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {label}
    </button>
  );
}
