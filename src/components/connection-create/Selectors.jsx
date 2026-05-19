// connection-create/Selectors.jsx
// MoodSelector, VisibilitySelector, CostSelector, OpennessPicker
// Alle screenshot-exact

import React from "react";

const C = {
  violet:"#8B5CF6", violet2:"#7C3AED",
  ink:"#1A1A1A", muted:"rgba(80,80,80,0.55)",
  cream:"#F9F7F4",
};

const CSS = `
  @keyframes sel-pulse {
    0%,100%{box-shadow:0 4px 18px rgba(139,92,246,0.20);}
    50%{box-shadow:0 6px 24px rgba(139,92,246,0.32);}
  }
`;

/* ── Generic Pill Selector ── */
function PillSelector({ options, value, onChange, multi=false }) {
  function toggle(key) {
    if (!multi) { onChange(key); return; }
    if (Array.isArray(value)) {
      onChange(value.includes(key)
        ? value.filter(v => v !== key)
        : [...value, key]);
    } else {
      onChange([key]);
    }
  }
  function isOn(key) {
    return multi ? (Array.isArray(value) && value.includes(key)) : value === key;
  }
  return (
    <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
      <style>{CSS}</style>
      {options.map(o => {
        const on = isOn(o.key);
        return (
          <button key={o.key} onClick={() => toggle(o.key)} style={{
            padding:"8px 16px", borderRadius:99,
            background: on
              ? "linear-gradient(135deg,#8B5CF6,#7C3AED)"
              : "rgba(255,255,255,0.80)",
            border: on
              ? "none"
              : "1.5px solid rgba(0,0,0,0.08)",
            color: on ? "white" : C.muted,
            fontSize:13.5, fontWeight: on ? 700 : 500,
            cursor:"pointer",
            animation: on ? "sel-pulse 3s ease-in-out infinite" : "none",
            boxShadow: on
              ? "0 4px 18px rgba(139,92,246,0.28)"
              : "0 1px 4px rgba(0,0,0,0.04)",
            transition:"all 0.16s ease",
            WebkitTapHighlightColor:"transparent",
          }}>{o.label}</button>
        );
      })}
    </div>
  );
}

/* ── Mood Selector — Icon + Label Kacheln ── */
const MOODS = [
  { key:"ruhig",         label:"Ruhig",         icon:"🌿" },
  { key:"kreativ",       label:"Kreativ",        icon:"🎨" },
  { key:"tief",          label:"Tief",           icon:"💧" },
  { key:"gesellig",      label:"Gesellig",       icon:"🧡" },
  { key:"abenteuerlich", label:"Abenteuerlich",  icon:"🔥" },
];

export function MoodSelector({ value, onChange }) {
  return (
    <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
      <style>{CSS}</style>
      {MOODS.map(m => {
        const on = value === m.key;
        return (
          <button key={m.key} onClick={() => onChange(m.key)} style={{
            display:"flex", flexDirection:"column",
            alignItems:"center", gap:6,
            padding:"12px 16px",
            borderRadius:16,
            background: on
              ? "linear-gradient(135deg,rgba(139,92,246,0.10),rgba(124,58,237,0.06))"
              : "rgba(255,255,255,0.80)",
            border: on
              ? "1.5px solid rgba(139,92,246,0.30)"
              : "1.5px solid rgba(0,0,0,0.07)",
            cursor:"pointer",
            minWidth:72,
            animation: on ? "sel-pulse 3s ease-in-out infinite" : "none",
            boxShadow: on ? "0 4px 16px rgba(139,92,246,0.18)" : "0 1px 6px rgba(0,0,0,0.04)",
            transition:"all 0.16s",
            WebkitTapHighlightColor:"transparent",
          }}>
            <span style={{ fontSize:22 }}>{m.icon}</span>
            <span style={{
              fontSize:12, fontWeight: on ? 700 : 500,
              color: on ? C.violet : C.muted,
            }}>{m.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ── Visibility Selector — Icon + Label + Subtitle ── */
const VISIBILITY = [
  { key:"public",  label:"\u00d6ffentlich", sub:"Im Feed & Entdecken", icon:"🌐" },
  { key:"local",   label:"Lokal",           sub:"Nur in deiner N\u00e4he", icon:"📍" },
  { key:"friends", label:"Freunde",         sub:"Nur f\u00fcr Freunde", icon:"👥" },
  { key:"private", label:"Privat",          sub:"Nur mit Einladung", icon:"🔒" },
];

export function VisibilitySelector({ value, onChange }) {
  return (
    <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
      <style>{CSS}</style>
      {VISIBILITY.map(v => {
        const on = value === v.key;
        return (
          <button key={v.key} onClick={() => onChange(v.key)} style={{
            display:"flex", flexDirection:"column",
            alignItems:"center", gap:5, padding:"12px 14px",
            borderRadius:16, minWidth:80,
            background: on
              ? "linear-gradient(135deg,rgba(139,92,246,0.10),rgba(124,58,237,0.06))"
              : "rgba(255,255,255,0.80)",
            border: on
              ? "1.5px solid rgba(139,92,246,0.30)"
              : "1.5px solid rgba(0,0,0,0.07)",
            cursor:"pointer",
            animation: on ? "sel-pulse 3s ease-in-out infinite" : "none",
            boxShadow: on ? "0 4px 16px rgba(139,92,246,0.18)" : "0 1px 6px rgba(0,0,0,0.04)",
            transition:"all 0.16s",
            WebkitTapHighlightColor:"transparent",
          }}>
            <span style={{ fontSize:20 }}>{v.icon}</span>
            <span style={{ fontSize:12.5, fontWeight: on ? 700 : 600, color: on ? C.violet : C.ink }}>
              {v.label}
            </span>
            <span style={{ fontSize:10.5, color:C.muted, textAlign:"center", lineHeight:1.3 }}>
              {v.sub}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ── Cost Selector ── */
const COSTS = [
  { key:"free",     label:"Kostenlos" },
  { key:"donation", label:"Spende"    },
  { key:"fixed",    label:"Festpreis" },
  { key:"request",  label:"Auf Anfrage" },
];
export function CostSelector({ value, onChange }) {
  return <PillSelector options={COSTS} value={value} onChange={onChange}/>;
}

/* ── Openness Picker ── */
export function OpennessPicker({ value, onChange }) {
  const opts = [
    {
      key:"open",
      label:"Offen f\u00fcr neue Menschen",
      sub:"\"Jeder\" kann teilnehmen und ist willkommen.",
      icon:"👥",
    },
    {
      key:"trusted",
      label:"Eher vertraute Runde",
      sub:"Nur f\u00fcr Menschen, die sich kennen oder empfohlen sind.",
      icon:"🔒",
    },
  ];
  return (
    <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
      <style>{CSS}</style>
      {opts.map(o => {
        const on = value === o.key;
        return (
          <button key={o.key} onClick={() => onChange(o.key)} style={{
            flex:1, minWidth:160, textAlign:"left",
            padding:"14px 16px", borderRadius:16,
            background: on
              ? "linear-gradient(135deg,rgba(139,92,246,0.08),rgba(124,58,237,0.04))"
              : "rgba(255,255,255,0.80)",
            border: on
              ? "1.5px solid rgba(139,92,246,0.30)"
              : "1.5px solid rgba(0,0,0,0.07)",
            cursor:"pointer",
            animation: on ? "sel-pulse 3s ease-in-out infinite" : "none",
            boxShadow: on ? "0 4px 16px rgba(139,92,246,0.15)" : "0 1px 6px rgba(0,0,0,0.04)",
            transition:"all 0.16s",
            WebkitTapHighlightColor:"transparent",
            display:"flex", alignItems:"flex-start", gap:10,
          }}>
            <span style={{ fontSize:18, flexShrink:0 }}>{o.icon}</span>
            <div>
              <div style={{ fontSize:13.5, fontWeight: on ? 800 : 700, color: on ? C.violet : C.ink, marginBottom:4 }}>
                {o.label}
              </div>
              <div style={{ fontSize:12, color:C.muted, lineHeight:1.5 }}>{o.sub}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
