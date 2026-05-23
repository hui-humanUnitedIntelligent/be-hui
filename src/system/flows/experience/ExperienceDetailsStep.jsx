// src/system/flows/experience/ExperienceDetailsStep.jsx
// Step 2 — Angebotsdetails: Preis, Dauer, Ort, Verfügbarkeit

import React from "react";
import { ET, EInput, ESelect } from "./ExperienceTokens.js";

const DURATIONS  = ["30 Minuten","1 Stunde","2 Stunden","Individuell"];
const AVAIL_DAYS = [
  { k:"mon", l:"Mo" }, { k:"tue", l:"Di" },
  { k:"wed", l:"Mi" }, { k:"thu", l:"Do" },
  { k:"fri", l:"Fr" }, { k:"sat", l:"Sa" },
  { k:"sun", l:"So" },
];
const AVAIL_TIMES = [
  { k:"morgens", l:"Morgens", sub:"6–12 Uhr" },
  { k:"mittags", l:"Mittags", sub:"12–17 Uhr" },
  { k:"abends",  l:"Abends",  sub:"17–22 Uhr" },
  { k:"flexibel",l:"Flexibel",sub:"Nach Absprache" },
];

/* ── Section Label ───────────────────────────────────────────── */
function SLabel({ n, title }) {
  return (
    <div style={{ fontSize:14, fontWeight:900, color:ET.ink,
      marginBottom:12, display:"flex", alignItems:"center", gap:8 }}>
      <div style={{
        width:22, height:22, borderRadius:7,
        background:`linear-gradient(135deg, ${ET.teal}, #06B6D4)`,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:11, fontWeight:900, color:"#fff", flexShrink:0,
      }}>{n}</div>
      {title}
    </div>
  );
}

/* ── Divider ─────────────────────────────────────────────────── */
const Divider = () => (
  <div style={{ height:1, background:"rgba(26,26,46,0.06)", margin:"20px 0" }}/>
);

/* ── Pills (Preis-Modus) ─────────────────────────────────────── */
function PricePills({ value, onChange }) {
  const opts = [
    { k:"free",    icon:"🎁", l:"Kostenlos" },
    { k:"hourly",  icon:"⏱", l:"Stundenpreis" },
    { k:"fixed",   icon:"🛡", l:"Festpreis" },
    { k:"inquiry", icon:"💬", l:"Auf Anfrage" },
  ];
  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
      {(opts||[]).filter(o=>o&&o.key).map(o => {
        const active = value === o.k;
        return (
          <button key={o.k} onClick={() => onChange(o.k)} style={{
            padding:"11px 10px", borderRadius:14, border:"none",
            background: active ? ET.teal : "rgba(26,26,46,0.05)",
            color: active ? "#fff" : ET.ink2,
            fontSize:13, fontWeight:700, cursor:"pointer",
            display:"flex", alignItems:"center", gap:8,
            transition:"all 0.18s ease",
            boxShadow: active ? `0 4px 16px rgba(10,191,184,0.26)` : "none",
          }}>
            <span style={{ fontSize:17 }}>{o.icon}</span>
            {o.l}
          </button>
        );
      })}
    </div>
  );
}

/* ── Dauer Pills ─────────────────────────────────────────────── */
function DurationPills({ value, onChange }) {
  return (
    <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
      {(DURATIONS||[]).filter(d=>d&&d.key).map(d => {
        const active = value === d;
        return (
          <button key={d} onClick={() => onChange(d)} style={{
            padding:"8px 16px", borderRadius:20, border:"none",
            background: active
              ? `linear-gradient(135deg, ${ET.teal}, #06B6D4)`
              : "rgba(26,26,46,0.06)",
            color: active ? "#fff" : ET.ink2,
            fontSize:13, fontWeight:700, cursor:"pointer",
            transition:"all 0.18s ease",
            boxShadow: active ? "0 4px 14px rgba(10,191,184,0.24)" : "none",
          }}>{d}</button>
        );
      })}
    </div>
  );
}

/* ── Ort Pills ───────────────────────────────────────────────── */
function LocationPills({ value, onChange }) {
  const opts = [
    { k:"online",  icon:"💻", l:"Online" },
    { k:"onsite",  icon:"📍", l:"Vor Ort" },
    { k:"hybrid",  icon:"🔀", l:"Hybrid" },
  ];
  return (
    <div style={{ display:"flex", gap:8 }}>
      {(opts||[]).filter(o=>o&&o.key).map(o => {
        const active = value === o.k;
        return (
          <button key={o.k} onClick={() => onChange(o.k)} style={{
            flex:1, padding:"11px 8px", borderRadius:14, border:"none",
            background: active ? ET.violet : "rgba(26,26,46,0.05)",
            color: active ? "#fff" : ET.ink2,
            fontSize:13, fontWeight:700, cursor:"pointer",
            display:"flex", flexDirection:"column",
            alignItems:"center", gap:4,
            transition:"all 0.18s ease",
            boxShadow: active ? `0 4px 16px rgba(139,92,246,0.26)` : "none",
          }}>
            <span style={{ fontSize:18 }}>{o.icon}</span>
            {o.l}
          </button>
        );
      })}
    </div>
  );
}

/* ── Wochentage ──────────────────────────────────────────────── */
function DayPicker({ value, onChange }) {
  const toggle = k => onChange(
    value.includes(k) ? value.filter(d=>d!==k) : [...value, k]
  );
  return (
    <div style={{ display:"flex", gap:6 }}>
      {(AVAIL_DAYS||[]).filter(d=>d&&d.key).map(d => {
        const active = value.includes(d.k);
        return (
          <button key={d.k} onClick={() => toggle(d.k)} style={{
            flex:1, height:36, borderRadius:10, border:"none",
            background: active
              ? `linear-gradient(135deg, ${ET.teal}, #06B6D4)`
              : "rgba(26,26,46,0.06)",
            color: active ? "#fff" : ET.ink3,
            fontSize:12, fontWeight:700, cursor:"pointer",
            transition:"all 0.15s ease",
          }}>{d.l}</button>
        );
      })}
    </div>
  );
}

/* ── Uhrzeiten ───────────────────────────────────────────────── */
function TimePills({ value, onChange }) {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
      {(AVAIL_TIMES||[]).filter(t=>t&&t.key).map(t => {
        const active = value === t.k;
        return (
          <button key={t.k} onClick={() => onChange(t.k)} style={{
            padding:"10px 12px", borderRadius:13,
            background: active
              ? "rgba(10,191,184,0.10)"
              : "rgba(26,26,46,0.04)",
            border: active
              ? `1.5px solid ${ET.teal}40`
              : "1.5px solid transparent",
            cursor:"pointer", textAlign:"left",
            transition:"all 0.16s ease",
          }}>
            <div style={{ fontSize:13, fontWeight:700,
              color: active ? ET.teal : ET.ink2 }}>{t.l}</div>
            <div style={{ fontSize:11, color:ET.ink4, marginTop:1 }}>{t.sub}</div>
          </button>
        );
      })}
    </div>
  );
}

/* ── Toggle ──────────────────────────────────────────────────── */
function Toggle({ value, onChange, label }) {
  return (
    <div style={{ display:"flex", alignItems:"center",
      justifyContent:"space-between" }}>
      <span style={{ fontSize:13.5, color:ET.ink2 }}>{label}</span>
      <div onClick={() => onChange(!value)} style={{
        width:46, height:26, borderRadius:13,
        background: value ? ET.teal : "rgba(26,26,46,0.14)",
        position:"relative", cursor:"pointer",
        transition:"background 0.22s ease", flexShrink:0,
      }}>
        <div style={{
          position:"absolute", top:2,
          left: value ? 22 : 2,
          width:22, height:22, borderRadius:"50%",
          background:"#fff",
          boxShadow:"0 2px 6px rgba(0,0,0,0.16)",
          transition:"left 0.22s cubic-bezier(0.34,1.4,0.64,1)",
        }}/>
      </div>
    </div>
  );
}

/* ── Step 2 ──────────────────────────────────────────────────── */
export function ExperienceDetailsStep({ form, onFormChange, onNext }) {
  return (
    <div style={{ padding:"24px 20px 20px",
      animation:"efFadeStep 0.28s ease both" }}>

      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:22, fontWeight:900, color:ET.ink,
          letterSpacing:-0.5, margin:0 }}>
          Angebotsdetails<span style={{ color:ET.teal, marginLeft:3 }}>·</span>
        </h1>
      </div>

      {/* ══ 1. PREIS ══ */}
      <SLabel n="1" title="Preis" />
      <p style={{ fontSize:13, color:ET.ink3, margin:"0 0 12px" }}>
        Wie möchtest du deine Fähigkeit anbieten?
      </p>
      <PricePills
        value={form.priceMode}
        onChange={v => onFormChange({ priceMode:v })}
      />
      {(form.priceMode === "hourly" || form.priceMode === "fixed") && (
        <div style={{ marginTop:12, position:"relative",
          animation:"efFadeStep 0.22s ease both" }}>
          <input
            style={{ ...EInput, paddingRight:32 }}
            placeholder={form.priceMode==="hourly" ? "80,00" : "250,00"}
            type="number" min="0" step="0.01"
            value={form.price}
            onChange={e => onFormChange({ price:e.target.value })}
          />
          <div style={{
            position:"absolute", right:13, top:"50%",
            transform:"translateY(-50%)",
            fontSize:14, color:ET.ink3, fontWeight:600,
          }}>
            {form.priceMode==="hourly" ? "€/h" : "€"}
          </div>
        </div>
      )}

      <Divider/>

      {/* ══ 2. DAUER ══ */}
      <SLabel n="2" title="Dauer" />
      <DurationPills
        value={form.duration}
        onChange={v => onFormChange({ duration:v })}
      />
      {form.duration === "Individuell" && (
        <div style={{ marginTop:10, animation:"efFadeStep 0.22s ease both" }}>
          <input
            style={EInput}
            placeholder="z.B. 90 Minuten, ganzer Tag…"
            value={form.durationCustom}
            onChange={e => onFormChange({ durationCustom:e.target.value })}
          />
        </div>
      )}

      <Divider/>

      {/* ══ 3. ORT ══ */}
      <SLabel n="3" title="Ort" />
      <LocationPills
        value={form.locationType}
        onChange={v => onFormChange({ locationType:v })}
      />
      {(form.locationType === "onsite" || form.locationType === "hybrid") && (
        <div style={{ marginTop:12, animation:"efFadeStep 0.22s ease both" }}>
          <input
            style={EInput}
            placeholder="z.B. München, Schwabing / oder Online-Link"
            value={form.locationText}
            onChange={e => onFormChange({ locationText:e.target.value })}
          />
        </div>
      )}

      <Divider/>

      {/* ══ 4. VERFÜGBARKEIT ══ */}
      <SLabel n="4" title="Verfügbarkeit" />

      <div style={{ marginBottom:10 }}>
        <div style={{ fontSize:12, fontWeight:700, color:ET.ink3,
          letterSpacing:0.3, marginBottom:8 }}>WOCHENTAGE</div>
        <DayPicker
          value={form.availDays}
          onChange={days => onFormChange({ availDays:days })}
        />
      </div>

      <div style={{ marginTop:12, marginBottom:10 }}>
        <div style={{ fontSize:12, fontWeight:700, color:ET.ink3,
          letterSpacing:0.3, marginBottom:8 }}>UHRZEITEN</div>
        <TimePills
          value={form.availTimes}
          onChange={v => onFormChange({ availTimes:v })}
        />
      </div>

      <div style={{ marginTop:14, marginBottom:14 }}>
        <div style={{ fontSize:12, fontWeight:700, color:ET.ink3,
          letterSpacing:0.3, marginBottom:8 }}>MAX. TEILNEHMENDE</div>
        <div style={{ position:"relative" }}>
          <input
            style={EInput}
            placeholder="z.B. 1 (Einzelsession) oder 10"
            type="number" min="1"
            value={form.maxParticipants}
            onChange={e => onFormChange({ maxParticipants:e.target.value })}
          />
        </div>
      </div>

      <div style={{ marginTop:4, marginBottom:20 }}>
        <Toggle
          value={form.bookingMode === "direct"}
          onChange={v => onFormChange({ bookingMode: v ? "direct" : "request" })}
          label="Sofortbuchung aktivieren"
        />
        <p style={{ fontSize:11.5, color:ET.ink4, margin:"5px 0 0", lineHeight:1.5 }}>
          {form.bookingMode==="direct"
            ? "Buchungen werden sofort bestätigt."
            : "Du prüfst jede Anfrage manuell."}
        </p>
      </div>

      {/* ── CTA ── */}
      <button onClick={onNext} style={{
        width:"100%", height:54, borderRadius:18, border:"none",
        background:`linear-gradient(135deg, ${ET.teal} 0%, #06B6D4 100%)`,
        color:"#fff", fontSize:16, fontWeight:800, cursor:"pointer",
        boxShadow:"0 8px 24px rgba(10,191,184,0.26)",
        marginBottom:4,
      }}>Weiter →</button>
    </div>
  );
}
