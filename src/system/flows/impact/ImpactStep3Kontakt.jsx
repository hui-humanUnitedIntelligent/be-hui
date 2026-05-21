// src/system/flows/impact/ImpactStep3Kontakt.jsx
// Step 3 — Kontakt & Online Präsenz

import React from "react";
import { IT, IInput, ImpactNextBtn } from "./ImpactTokens.jsx";

/* ── Label + Input ───────────────────────────────────────────── */
function Field({ label, required, placeholder, value, onChange, type="text" }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ fontSize:12, fontWeight:700, color:IT.ink3,
        display:"block", marginBottom:6, letterSpacing:0.3 }}>
        {label} {required && <span style={{ color:IT.coral }}>*</span>}
        {!required && <span style={{ color:IT.ink4, fontWeight:400,
          marginLeft:4 }}>(optional)</span>}
      </label>
      <input className="if-input" style={IInput}
        type={type} placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}

/* ── 2-Spalten Felder ────────────────────────────────────────── */
function FieldRow({ children }) {
  return (
    <div style={{ display:"flex", gap:10, marginBottom:14 }}>
      {children}
    </div>
  );
}

/* ── Link Field mit Icon ──────────────────────────────────────── */
function LinkField({ icon, platform, placeholder, value, onChange }) {
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ position:"relative" }}>
        <div style={{
          position:"absolute", left:12, top:"50%",
          transform:"translateY(-50%)",
          fontSize:16, pointerEvents:"none",
        }}>{icon}</div>
        <input className="if-input"
          style={{ ...IInput, paddingLeft:40, fontSize:14 }}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}

/* ── Step 3 ──────────────────────────────────────────────────── */
export function ImpactStep3Kontakt({ form, onFormChange, onNext }) {
  // Nur Name ist Pflicht für Step 3
  const canNext = form.contactName.trim().length >= 2;

  return (
    <div style={{ padding:"24px 20px 24px",
      animation:"ifFadeStep 0.28s ease both" }}>

      {/* ── Headline ── */}
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:22, fontWeight:900, color:IT.ink,
          letterSpacing:-0.5, margin:0 }}>
          Kontakt & Online Präsenz<span style={{ color:IT.teal, marginLeft:3 }}>·</span>
        </h1>
        <p style={{ fontSize:13, color:IT.ink3, margin:"5px 0 0" }}>
          Wie können wir euch erreichen?
        </p>
      </div>

      {/* ── Kontaktdaten ── */}
      <div style={{
        background:"rgba(26,26,46,0.025)",
        borderRadius:18, padding:"16px 16px 2px",
        marginBottom:18,
        border:"1px solid rgba(26,26,46,0.06)",
      }}>
        <div style={{ fontSize:12, fontWeight:800, color:IT.ink3,
          letterSpacing:0.5, marginBottom:14, textTransform:"uppercase" }}>
          Kontaktdaten
        </div>

        <Field label="Ansprechpartner" required
          placeholder="Anna Meier"
          value={form.contactName}
          onChange={v => onFormChange({ contactName:v })} />

        <Field label="E-Mail" required type="email"
          placeholder="anna@oceancleanup.io"
          value={form.email}
          onChange={v => onFormChange({ email:v })} />

        {/* Telefon + Standort nebeneinander */}
        <FieldRow>
          <div style={{ flex:1 }}>
            <label style={{ fontSize:12, fontWeight:700, color:IT.ink3,
              display:"block", marginBottom:6, letterSpacing:0.3 }}>
              Telefon <span style={{ color:IT.ink4, fontWeight:400 }}>(optional)</span>
            </label>
            <input className="if-input" style={{ ...IInput, fontSize:14 }}
              type="tel" placeholder="+49 176 12345678"
              value={form.phone}
              onChange={e => onFormChange({ phone:e.target.value })}
            />
          </div>
          <div style={{ flex:1 }}>
            <label style={{ fontSize:12, fontWeight:700, color:IT.ink3,
              display:"block", marginBottom:6, letterSpacing:0.3 }}>
              Standort <span style={{ color:IT.coral }}>*</span>
            </label>
            <input className="if-input" style={{ ...IInput, fontSize:14 }}
              placeholder="Hamburg, Deutschland"
              value={form.location}
              onChange={e => onFormChange({ location:e.target.value })}
            />
          </div>
        </FieldRow>
      </div>

      {/* ── Online Präsenz ── */}
      <div style={{
        background:"rgba(26,26,46,0.025)",
        borderRadius:18, padding:"16px 16px 6px",
        marginBottom:22,
        border:"1px solid rgba(26,26,46,0.06)",
      }}>
        <div style={{ fontSize:12, fontWeight:800, color:IT.ink3,
          letterSpacing:0.5, marginBottom:14, textTransform:"uppercase",
          display:"flex", alignItems:"center", gap:6 }}>
          Online Präsenz
          <span style={{ fontSize:10, color:IT.ink4, fontWeight:400,
            background:"rgba(26,26,46,0.06)", borderRadius:5, padding:"1px 6px",
            textTransform:"none" }}>optional</span>
        </div>

        <LinkField icon="🌐" platform="Website"
          placeholder="https://oceancleanup.io"
          value={form.website}
          onChange={v => onFormChange({ website:v })} />

        <LinkField icon="📸" platform="Instagram"
          placeholder="https://instagram.com/oceancleanup"
          value={form.instagram}
          onChange={v => onFormChange({ instagram:v })} />

        {/* LinkedIn + YouTube nebeneinander */}
        <div style={{ display:"flex", gap:10, marginBottom:10 }}>
          <div style={{ flex:1 }}>
            <div style={{ position:"relative" }}>
              <div style={{ position:"absolute", left:12, top:"50%",
                transform:"translateY(-50%)", fontSize:14, pointerEvents:"none" }}>
                💼
              </div>
              <input className="if-input"
                style={{ ...IInput, paddingLeft:38, fontSize:13 }}
                placeholder="LinkedIn URL"
                value={form.linkedin}
                onChange={e => onFormChange({ linkedin:e.target.value })}
              />
            </div>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ position:"relative" }}>
              <div style={{ position:"absolute", left:12, top:"50%",
                transform:"translateY(-50%)", fontSize:14, pointerEvents:"none" }}>
                ▶
              </div>
              <input className="if-input"
                style={{ ...IInput, paddingLeft:38, fontSize:13 }}
                placeholder="YouTube URL"
                value={form.youtube}
                onChange={e => onFormChange({ youtube:e.target.value })}
              />
            </div>
          </div>
        </div>

        <div>
          <input className="if-input" style={{ ...IInput, fontSize:13 }}
            placeholder="z. B. TikTok, Twitter, Behance, Medium …"
            value={form.otherLinks}
            onChange={e => onFormChange({ otherLinks:e.target.value })}
          />
        </div>
      </div>

      {/* ── CTA ── */}
      <ImpactNextBtn
        label="Weiter zur Prüfung →"
        onClick={onNext}
        disabled={!canNext}
      />
    </div>
  );
}
