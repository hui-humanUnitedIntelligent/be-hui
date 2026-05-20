// src/system/flows/impact/ImpactStep2Vision.jsx
// Step 2 — Vision & Finanzierung

import React, { useState } from "react";
import { IT, IInput, ITextarea, ImpactNextBtn } from "./ImpactFlow.jsx";

/* ── Großes Finanzierungs-Eingabefeld ─────────────────────────── */
function FundingInput({ value, onChange }) {
  // Formatiert: "150000" → "150.000"
  const display = value
    ? parseInt(value.replace(/\D/g,"") || "0")
        .toLocaleString("de-DE")
    : "";

  return (
    <div style={{
      position:"relative",
      background:"rgba(10,191,184,0.04)",
      border:"2px solid rgba(10,191,184,0.18)",
      borderRadius:18, padding:"18px 56px 18px 20px",
    }}>
      <input
        style={{
          width:"100%", border:"none", outline:"none",
          background:"transparent", fontFamily:"inherit",
          fontSize:32, fontWeight:900, color:IT.ink,
          letterSpacing:-0.5, boxSizing:"border-box",
        }}
        placeholder="150.000"
        value={display}
        onChange={e => {
          const raw = e.target.value.replace(/\./g,"").replace(/\D/g,"");
          onChange(raw);
        }}
        inputMode="numeric"
      />
      {/* € Symbol */}
      <div style={{
        position:"absolute", right:18, top:"50%",
        transform:"translateY(-50%)",
        fontSize:24, fontWeight:800, color:IT.teal, opacity:0.7,
      }}>€</div>
    </div>
  );
}

/* ── Textarea mit Counter ─────────────────────────────────────── */
function CountedTextarea({ label, required, placeholder, value, onChange, max=500, rows=4 }) {
  return (
    <div style={{ marginBottom:18 }}>
      <label style={{ fontSize:12, fontWeight:700, color:IT.ink3,
        display:"block", marginBottom:6, letterSpacing:0.3 }}>
        {label} {required && <span style={{ color:IT.coral }}>*</span>}
      </label>
      <div style={{ position:"relative" }}>
        <textarea
          className="if-input"
          style={{
            ...ITextarea,
            minHeight: rows * 26,
          }}
          placeholder={placeholder}
          value={value}
          maxLength={max}
          onChange={e => onChange(e.target.value)}
        />
        <div style={{
          position:"absolute", bottom:8, right:12,
          fontSize:11, color:IT.ink4,
        }}>{value.length}/{max}</div>
      </div>
    </div>
  );
}

/* ── Step 2 ──────────────────────────────────────────────────── */
export function ImpactStep2Vision({ form, onFormChange, onNext }) {
  // Finanzierungsbetrag ist der einzige harte Pflichtblock in Step 2
  const canNext = form.funding.trim().length > 0;

  return (
    <div style={{ padding:"24px 20px 24px",
      animation:"ifFadeStep 0.28s ease both" }}>

      {/* ── Headline ── */}
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:22, fontWeight:900, color:IT.ink,
          letterSpacing:-0.5, margin:0 }}>
          Vision & Finanzierung<span style={{ color:IT.teal, marginLeft:3 }}>·</span>
        </h1>
      </div>

      {/* Fragen */}
      <CountedTextarea
        label="Welches Problem löst euer Projekt?"
        required
        placeholder="Jährlich gelangen über 11 Millionen Tonnen Plastik in unsere Ozeane. Unsere Technologie setzt genau dort an: an den Flüssen."
        value={form.problem}
        onChange={v => onFormChange({ problem:v })}
        rows={4}
      />

      <CountedTextarea
        label="Welche Vision verfolgt ihr?"
        required
        placeholder="Eine Welt, in der unsere Meere frei von Plastik sind und Ökosysteme sich regenerieren können."
        value={form.vision}
        onChange={v => onFormChange({ vision:v })}
        rows={3}
      />

      <CountedTextarea
        label="Warum sollte dieses Projekt unterstützt werden?"
        required={false}
        placeholder="Wir kombinieren innovative Technologie mit lokalem Community Impact und einem skalierbaren Modell, das weltweit angewendet werden kann."
        value={form.why}
        onChange={v => onFormChange({ why:v })}
        rows={3}
      />

      {/* ── Finanzierung ── */}
      <div style={{ marginBottom:18 }}>
        <label style={{ fontSize:12, fontWeight:700, color:IT.ink3,
          display:"block", marginBottom:8, letterSpacing:0.3 }}>
          Gewünschte Finanzierung <span style={{ color:IT.coral }}>*</span>
        </label>
        <FundingInput
          value={form.funding}
          onChange={v => onFormChange({ funding:v })}
        />
        <div style={{ fontSize:11.5, color:IT.ink4, marginTop:6, lineHeight:1.5 }}>
          Bitte gib den Betrag in Euro an, den dein Projekt benötigt.
        </div>
      </div>

      <CountedTextarea
        label="Wofür wird die Finanzierung genutzt?"
        required={false}
        placeholder="Für die Entwicklung der nächsten Filtergeneration, Feldtests in 3 weiteren Ländern und den Aufbau lokaler Partnerstrukturen."
        value={form.fundingUse}
        onChange={v => onFormChange({ fundingUse:v })}
        rows={3}
      />

      {/* ── CTA ── */}
      <ImpactNextBtn onClick={onNext} disabled={!canNext} />
    </div>
  );
}
