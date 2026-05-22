// src/system/flows/work/WorkDetailsStep.jsx
// Step 2 — Werk Informationen: Preis, Versand, Details

import React from "react";
import { WT } from "./WorkTokens.js";

const CATEGORIES = [
  "Fotografie","Digitale Kunst","Illustration","Design","Malerei",
  "Skulptur","Keramik","Schmuck","Textil","Mode","Musik","Video",
  "Architektur","Handwerk","Sonstiges",
];
const FORMATS   = ["JPG, PNG","PDF","MP3, WAV","PSD, AI","Figma","ZIP","Sonstiges"];
const SHIP_TIMES = ["1–2 Werktage","3–5 Werktage","5–10 Werktage","2–3 Wochen","Auf Anfrage"];
const CONDITIONS = ["Neu","Wie neu","Gut","Akzeptabel"];

/* ── Shared Styles ──────────────────────────────────────────── */
const input = {
  width:"100%", padding:"11px 13px", borderRadius:12,
  border:"1.5px solid rgba(26,26,46,0.09)",
  background:"rgba(248,247,255,0.70)", fontSize:14, color:"#1A1A2E",
  outline:"none", fontFamily:"inherit", boxSizing:"border-box",
};

const select = {
  ...input,
  appearance:"none", WebkitAppearance:"none",
  backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%231A1A2E' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat:"no-repeat", backgroundPosition:"right 12px center",
  paddingRight:34, cursor:"pointer",
};

/* ── Section Label ──────────────────────────────────────────── */
function SectionLabel({ number, title, optional }) {
  return (
    <div style={{ display:"flex", alignItems:"baseline", gap:6, marginBottom:12 }}>
      <div style={{ fontSize:14, fontWeight:900, color:WT.ink }}>
        {number}. {title}
      </div>
      {optional && (
        <div style={{ fontSize:11, color:WT.ink4, fontWeight:500 }}>(optional)</div>
      )}
    </div>
  );
}

/* ── Preis Pills ─────────────────────────────────────────────── */
function PricePills({ value, onChange }) {
  const opts = [
    { key:"free",    icon:"🎁", label:"Kostenlos" },
    { key:"fixed",   icon:"🛡", label:"Festpreis" },
    { key:"inquiry", icon:"💬", label:"Auf Anfrage" },
  ];
  return (
    <div style={{ display:"flex", gap:8 }}>
      {opts.map(o => {
        const active = value === o.key;
        return (
          <button key={o.key} onClick={() => onChange(o.key)} style={{
            flex:1, padding:"10px 6px",
            borderRadius:13, border:"none",
            background: active ? WT.teal : "rgba(26,26,46,0.05)",
            color:       active ? "#fff"   : WT.ink2,
            fontSize:12.5, fontWeight:700,
            cursor:"pointer",
            display:"flex", flexDirection:"column",
            alignItems:"center", gap:4,
            transition:"all 0.18s ease",
            boxShadow: active ? `0 4px 14px rgba(10,191,184,0.28)` : "none",
          }}>
            <span style={{ fontSize:16 }}>{o.icon}</span>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ── Toggle ──────────────────────────────────────────────────── */
function Toggle({ value, onChange }) {
  return (
    <div
      onClick={() => onChange(!value)}
      style={{
        width:48, height:26, borderRadius:13,
        background: value ? WT.teal : "rgba(26,26,46,0.14)",
        position:"relative", cursor:"pointer",
        transition:"background 0.22s ease", flexShrink:0,
      }}
    >
      <div style={{
        position:"absolute",
        left: value ? 24 : 2, top:2,
        width:22, height:22, borderRadius:"50%",
        background:"#fff",
        boxShadow:"0 2px 6px rgba(0,0,0,0.18)",
        transition:"left 0.22s cubic-bezier(0.34,1.4,0.64,1)",
      }}/>
    </div>
  );
}

/* ── Step 2 ──────────────────────────────────────────────────── */
export function WorkDetailsStep({ form, onFormChange, onNext }) {
  const isDigital = !form.shipping;

  return (
    <div style={{ padding:"24px 20px 20px",
      animation:"wfFadeStep 0.30s ease both" }}>

      {/* ── Überschrift ── */}
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:22, fontWeight:900, color:WT.ink,
          letterSpacing:-0.5, margin:0 }}>
          Werk Informationen<span style={{ color:WT.teal, marginLeft:3 }}>·</span>
        </h1>
      </div>

      {/* ══ 1. PREIS ══ */}
      <div style={{ marginBottom:24 }}>
        <SectionLabel number="1" title="Preis" />
        <p style={{ fontSize:13, color:WT.ink3, margin:"0 0 12px" }}>
          Wie möchtest du dein Werk anbieten?
        </p>
        <PricePills
          value={form.priceMode}
          onChange={v => onFormChange({ priceMode: v })}
        />

        {/* Preisfeld — nur bei Festpreis */}
        {form.priceMode === "fixed" && (
          <div style={{ marginTop:12, position:"relative" }}>
            <input
              style={{ ...input, paddingRight:32 }}
              placeholder="250,00"
              value={form.price}
              type="number"
              min="0"
              step="0.01"
              onChange={e => onFormChange({ price: e.target.value })}
            />
            <div style={{
              position:"absolute", right:12, top:"50%",
              transform:"translateY(-50%)",
              fontSize:15, color:WT.ink3, fontWeight:600,
            }}>€</div>
          </div>
        )}
      </div>

      {/* ── Separator ── */}
      <div style={{ height:1, background:"rgba(26,26,46,0.06)", marginBottom:22 }}/>

      {/* ══ 2. VERSAND ══ */}
      <div style={{ marginBottom:24 }}>
        <SectionLabel number="2" title="Versand" />
        <div style={{ display:"flex", alignItems:"center",
          justifyContent:"space-between", marginBottom:12 }}>
          <span style={{ fontSize:13.5, color:WT.ink2 }}>
            Ist ein Versand möglich?
          </span>
          <Toggle
            value={form.shipping}
            onChange={v => onFormChange({ shipping: v })}
          />
        </div>

        {form.shipping && (
          <div style={{ display:"flex", flexDirection:"column", gap:10,
            animation:"wfFadeStep 0.25s ease both" }}>
            {/* Kosten + Zeit */}
            <div style={{ display:"flex", gap:10 }}>
              <div style={{ flex:1 }}>
                <label style={{ fontSize:11, color:WT.ink3, fontWeight:600,
                  display:"block", marginBottom:5 }}>Versandkosten</label>
                <div style={{ position:"relative" }}>
                  <input
                    style={{ ...input, paddingRight:28 }}
                    placeholder="7,90"
                    type="number"
                    min="0"
                    step="0.10"
                    value={form.shippingCost}
                    onChange={e => onFormChange({ shippingCost: e.target.value })}
                  />
                  <span style={{ position:"absolute", right:10, top:"50%",
                    transform:"translateY(-50%)",
                    fontSize:13, color:WT.ink3 }}>€</span>
                </div>
              </div>
              <div style={{ flex:1 }}>
                <label style={{ fontSize:11, color:WT.ink3, fontWeight:600,
                  display:"block", marginBottom:5 }}>Lieferzeit</label>
                <select
                  style={select}
                  value={form.shippingTime}
                  onChange={e => onFormChange({ shippingTime: e.target.value })}
                >
                  {SHIP_TIMES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            {/* Länder */}
            <div>
              <label style={{ fontSize:11, color:WT.ink3, fontWeight:600,
                display:"block", marginBottom:5 }}>Versandländer</label>
              <input
                style={input}
                placeholder="Deutschland, Österreich, Schweiz"
                value={form.shippingCountries}
                onChange={e => onFormChange({ shippingCountries: e.target.value })}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Separator ── */}
      <div style={{ height:1, background:"rgba(26,26,46,0.06)", marginBottom:22 }}/>

      {/* ══ 3. WERK DETAILS ══ */}
      <div style={{ marginBottom:24 }}>
        <SectionLabel number="3" title="Werk Details" optional />

        {/* Kategorie + Dateiformat */}
        <div style={{ display:"flex", gap:10, marginBottom:10 }}>
          <div style={{ flex:1 }}>
            <label style={{ fontSize:11, color:WT.ink3, fontWeight:600,
              display:"block", marginBottom:5 }}>Kategorie</label>
            <select style={select} value={form.category}
              onChange={e => onFormChange({ category: e.target.value })}>
              <option value="">Wählen…</option>
              {(CATEGORIES || []).filter(Boolean).map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ flex:1 }}>
            <label style={{ fontSize:11, color:WT.ink3, fontWeight:600,
              display:"block", marginBottom:5 }}>Dateiformat</label>
            <select style={select} value={form.fileFormat}
              onChange={e => onFormChange({ fileFormat: e.target.value })}>
              <option value="">Optional</option>
              {FORMATS.map(f => <option key={f}>{f}</option>)}
            </select>
          </div>
        </div>

        {/* Größe + Materialien */}
        <div style={{ display:"flex", gap:10, marginBottom:10 }}>
          <div style={{ flex:1 }}>
            <label style={{ fontSize:11, color:WT.ink3, fontWeight:600,
              display:"block", marginBottom:5 }}>Größe</label>
            <input style={input} placeholder="3000 x 2000 px"
              value={form.size}
              onChange={e => onFormChange({ size: e.target.value })} />
          </div>
          <div style={{ flex:1 }}>
            <label style={{ fontSize:11, color:WT.ink3, fontWeight:600,
              display:"block", marginBottom:5 }}>Materialien</label>
            <input style={input} placeholder="Digitale Malerei"
              value={form.materials}
              onChange={e => onFormChange({ materials: e.target.value })} />
          </div>
        </div>

        {/* Zustand — nur bei physischen Werken */}
        {form.shipping && (
          <div style={{ animation:"wfFadeStep 0.22s ease both" }}>
            <label style={{ fontSize:11, color:WT.ink3, fontWeight:600,
              display:"block", marginBottom:5 }}>Zustand</label>
            <select style={select} value={form.condition}
              onChange={e => onFormChange({ condition: e.target.value })}>
              {(CONDITIONS || []).filter(Boolean).map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* ── CTA ── */}
      <button onClick={onNext} style={{
        width:"100%", height:54, borderRadius:18, border:"none",
        background:`linear-gradient(135deg, ${WT.teal} 0%, #06B6D4 100%)`,
        color:"#fff", fontSize:16, fontWeight:800, cursor:"pointer",
        boxShadow:"0 8px 24px rgba(10,191,184,0.28)",
        marginBottom:4,
      }}>
        Weiter →
      </button>
    </div>
  );
}
