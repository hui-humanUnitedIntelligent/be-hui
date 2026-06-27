// src/components/commerce/UnterstutzenFlow.jsx
// HUI Unterstützen Flow v1.0
// ─────────────────────────────────────────────────────────────────
// Vollständiger 4-Schritt-Flow nach dem WerkeKorb.
// Keine Commerce-Logik, keine Stripe-API, keine DB-Änderungen.
// Stripe-ready: onUnterstuetzen(items, formData, paymentMethod)
//
// Props:
//   items[]        — Cart-Items vom WerkeKorb
//   onClose()      — Flow schließen
//   onUnterstuetzen(items, form, method) — Async, Stripe-ready
//   onDiscover()   — Nach Erfolg: Feed öffnen
// ─────────────────────────────────────────────────────────────────

import React, { useState, useRef, useEffect, useCallback } from "react";
import { EASE, DUR } from "../../design/hui.interaction.js";
import {
  C, TYPE_META,
  haptic, formatPrice, parseAmount, calcTotal, calcImpact,
  uniquePeople, hasPhysical, hasEventOrExperience,
  isFormValid, EMPTY_FORM, clearCartAfterSuccess,
} from "./commerceUtils.js";
import StripePaymentStep from "./StripePaymentStep.jsx";
import { resolveShippingStrategy, orderService } from "../../services/commerceEngine.js";
import { useAuth } from "../../lib/AuthContext.jsx";
import { supabase } from "../../lib/supabaseClient.js";

// ═══════════════════════════════════════════════════════════════════
//  SHARED: Impact-Karte (identisch zum WerkeKorb)
// ═══════════════════════════════════════════════════════════════════
function ImpactKarte({ impactEur }) {
  if (!impactEur || impactEur <= 0) return null;
  const str = impactEur.toFixed(2).replace(".", ",");
  return (
    <div style={{
      borderRadius:         16,
      background:           "rgba(238,247,242,0.82)",
      backdropFilter:       "blur(12px) saturate(1.2)",
      WebkitBackdropFilter: "blur(12px) saturate(1.2)",
      border:               "1px solid rgba(107,174,143,0.22)",
      boxShadow:            "0 2px 16px rgba(107,174,143,0.10), inset 0 1px 0 rgba(255,255,255,0.60)",
      padding:              "22px 20px 20px",
      textAlign:            "center",
    }}>
      <div style={{ marginBottom: 12 }}>
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ display: "inline-block" }}>
          <path d="M14 4C14 4 6 8 6 16C6 20.4 9.6 24 14 24C18.4 24 22 20.4 22 16C22 8 14 4 14 4Z"
            fill="rgba(107,174,143,0.18)" stroke="#6BAE8F" strokeWidth="1.5" strokeLinejoin="round"/>
          <path d="M14 24V14" stroke="#6BAE8F" strokeWidth="1.4" strokeLinecap="round"/>
          <path d="M14 18C14 18 10 15 9 12" stroke="#6BAE8F" strokeWidth="1.2" strokeLinecap="round" opacity="0.6"/>
        </svg>
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: C.sage, letterSpacing: 0.15, marginBottom: 8 }}>
        Gemeinsam Wirkung schaffen
      </div>
      <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.65, maxWidth: 260, margin: "0 auto 18px" }}>
        HUI investiert bei jeder Unterstützung einen Teil der eigenen Einnahmen in den HUI Impact Pool.
      </div>
      <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5, marginBottom: 8 }}>
        Bei dieser Unterstützung fließen
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: C.teal, letterSpacing: -0.8, lineHeight: 1.1,
        fontVariantNumeric: "tabular-nums", marginBottom: 8 }}>
        {str}\u202F€
      </div>
      <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5, marginBottom: 14 }}>
        in gemeinsame Impact-Projekte.
      </div>
      <div style={{ fontSize: 11, color: C.faint, fontStyle: "italic", lineHeight: 1.55,
        paddingTop: 14, borderTop: "1px solid rgba(107,174,143,0.14)" }}>
        Für dich entstehen dadurch keine zusätzlichen Kosten.
      </div>
    </div>
  );
}

// ── Positions-Karte (kompakt, kein Edit) ─────────────────────────
function PositionZeile({ item }) {
  const meta  = TYPE_META[item.type] || TYPE_META.work;
  const price = formatPrice(item._raw?.price ?? item.price);
  const thumb = item._raw?.cover_url || item.cover_url || item.img || null;
  const title = item.title || item._raw?.title || item.name || "Ohne Titel";
  const author = item.author?.name || null;

  return (
    <div style={{
      display:      "flex",
      gap:          12,
      alignItems:   "center",
      padding:      "12px 0",
      borderBottom: "1px solid rgba(20,20,34,0.05)",
    }}>
      {/* Thumbnail */}
      <div style={{
        width: 48, height: 48, borderRadius: 12, overflow: "hidden", flexShrink: 0,
        background: meta.bg, display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {thumb
          ? <img src={thumb} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <span style={{ fontSize: 20, opacity: 0.4, color: meta.accent }}>◈</span>
        }
      </div>
      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, overflow: "hidden",
          textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: -0.2 }}>
          {title}
        </div>
        {author && (
          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
            von {author}
          </div>
        )}
      </div>
      {/* Preis */}
      {price && (
        <div style={{ fontSize: 14, fontWeight: 600, color: C.inkMid,
          fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
          {price}
        </div>
      )}
    </div>
  );
}

// ── Primär-Button ─────────────────────────────────────────────────
function PrimaryButton({ label, onClick, loading = false, disabled = false }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      onPointerDown={() => { setPressed(true); haptic("light"); }}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        width:        "100%",
        padding:      "18px 0",
        borderRadius: 18,
        border:       "none",
        background:   (disabled || loading)
          ? "rgba(20,20,34,0.07)"
          : `linear-gradient(130deg, ${C.teal} 0%, #1ADDD0 55%, ${C.coral} 150%)`,
        color:        (disabled || loading) ? C.muted : "#fff",
        fontWeight:   700,
        fontSize:     17,
        letterSpacing: 0.1,
        cursor:       (disabled || loading) ? "default" : "pointer",
        outline:      "none",
        boxShadow:    (disabled || loading)
          ? "none"
          : pressed
            ? "0 4px 16px rgba(13,196,181,0.20)"
            : "0 10px 32px rgba(13,196,181,0.28), 0 2px 8px rgba(13,196,181,0.15)",
        transform:    pressed ? "scale(0.985)" : "scale(1)",
        transition:   `transform 120ms ease, box-shadow 200ms ease, background 200ms ease`,
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {loading ? "Einen Moment …" : label}
    </button>
  );
}

// ── Text-Input ────────────────────────────────────────────────────
function HuiInput({ label, value, onChange, type = "text", placeholder = "", required = false }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.muted,
        letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 6 }}>
        {label}{required && <span style={{ color: C.coral, marginLeft: 3 }}>*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width:        "100%",
          padding:      "13px 14px",
          borderRadius: 14,
          border:       focused
            ? `1.5px solid ${C.teal}`
            : `1.5px solid rgba(20,20,34,0.10)`,
          background:   C.creamSoft,
          fontSize:     15,
          color:        C.ink,
          outline:      "none",
          boxSizing:    "box-sizing",
          transition:   "border-color 180ms ease",
          WebkitAppearance: "none",
          fontFamily:   "inherit",
        }}
      />
    </div>
  );
}

// ── Zahlungs-Karte ────────────────────────────────────────────────
function PaymentCard({ method, selected, onSelect }) {
  const pressed = useRef(false);
  const [p, setP] = useState(false);

  const METHODS = {
    apple:  { label: "Apple Pay",    icon: ApplePayIcon  },
    google: { label: "Google Pay",   icon: GooglePayIcon },
    card:   { label: "Kreditkarte",  icon: CardIcon      },
  };
  const m = METHODS[method];

  return (
    <div
      onClick={() => { haptic("light"); onSelect(method); }}
      onPointerDown={() => setP(true)}
      onPointerUp={() => setP(false)}
      onPointerLeave={() => setP(false)}
      style={{
        display:      "flex",
        alignItems:   "center",
        gap:          14,
        padding:      "16px 18px",
        borderRadius: 16,
        background:   selected ? C.tealPale : C.creamSoft,
        border:       selected
          ? `1.5px solid rgba(13,196,181,0.45)`
          : `1.5px solid rgba(20,20,34,0.06)`,
        marginBottom: 10,
        cursor:       "pointer",
        transform:    p ? "scale(0.985)" : "scale(1)",
        transition:   "transform 100ms ease, background 180ms ease, border-color 180ms ease",
        boxShadow:    selected ? "0 2px 12px rgba(13,196,181,0.12)" : "none",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {/* Icon */}
      <div style={{ width: 36, height: 36, display: "flex", alignItems: "center",
        justifyContent: "center", flexShrink: 0 }}>
        <m.icon />
      </div>
      <span style={{ fontSize: 15, fontWeight: selected ? 700 : 500,
        color: selected ? C.ink : C.inkMid, flex: 1, letterSpacing: -0.1 }}>
        {m.label}
      </span>
      {/* Auswahl-Indikator */}
      <div style={{
        width: 20, height: 20, borderRadius: "50%",
        border: selected ? "none" : `1.5px solid rgba(20,20,34,0.18)`,
        background: selected
          ? `linear-gradient(135deg, ${C.teal}, #1ADDD0)`
          : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: selected ? "0 2px 8px rgba(13,196,181,0.35)" : "none",
        transition: "all 180ms ease",
        flexShrink: 0,
      }}>
        {selected && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
    </div>
  );
}

// ── Payment-Icons (SVG, inline) ───────────────────────────────────
function ApplePayIcon() {
  return (
    <svg width="36" height="22" viewBox="0 0 36 22" fill="none">
      <rect width="36" height="22" rx="6" fill="#141422"/>
      <path d="M12.5 7.5C13.1 6.8 13.5 5.9 13.4 5C12.5 5.05 11.5 5.55 10.9 6.25C10.35 6.88 9.85 7.8 10 8.65C10.95 8.7 11.9 8.2 12.5 7.5Z" fill="white"/>
      <path d="M13.35 8.8C11.95 8.72 10.75 9.6 10.1 9.6C9.45 9.6 8.4 8.84 7.3 8.86C5.86 8.88 4.5 9.72 3.78 11.04C2.3 13.7 3.38 17.7 4.82 19.9C5.52 20.98 6.36 22.18 7.48 22.14C8.54 22.1 8.98 21.44 10.28 21.44C11.58 21.44 11.98 22.14 13.1 22.12C14.26 22.1 14.98 20.98 15.68 19.9C16.48 18.68 16.8 17.5 16.82 17.44C16.8 17.42 14.52 16.52 14.5 13.86C14.48 11.62 16.28 10.56 16.36 10.5C15.28 8.9 13.62 8.76 13.35 8.8Z" fill="white"/>
      <path d="M22.5 5.5H20.1L18.5 10.6H18.56L20.16 5.5H22.5Z" fill="white" opacity="0.9"/>
      <path d="M23.5 16.5H25.7L27 10.6H24.8L23.5 16.5Z" fill="white" opacity="0.9"/>
    </svg>
  );
}
function GooglePayIcon() {
  return (
    <svg width="36" height="22" viewBox="0 0 36 22" fill="none">
      <rect width="36" height="22" rx="6" fill="#F8F8F8" stroke="rgba(20,20,34,0.08)" strokeWidth="1"/>
      <text x="5" y="15" fontFamily="sans-serif" fontWeight="700" fontSize="10">
        <tspan fill="#4285F4">G</tspan>
        <tspan fill="#EA4335">o</tspan>
        <tspan fill="#FBBC05">o</tspan>
        <tspan fill="#4285F4">g</tspan>
        <tspan fill="#34A853">l</tspan>
        <tspan fill="#EA4335">e</tspan>
        <tspan fill="#141422" fontSize="9" fontWeight="600"> Pay</tspan>
      </text>
    </svg>
  );
}
function CardIcon() {
  return (
    <svg width="36" height="22" viewBox="0 0 36 22" fill="none">
      <rect width="36" height="22" rx="6" fill={C.tealPale} stroke="rgba(13,196,181,0.25)" strokeWidth="1"/>
      <rect x="4" y="7" width="28" height="3" rx="1.5" fill="rgba(13,196,181,0.30)"/>
      <rect x="4" y="14" width="8" height="2" rx="1" fill={C.teal} opacity="0.6"/>
      <rect x="14" y="14" width="6" height="2" rx="1" fill={C.teal} opacity="0.4"/>
    </svg>
  );
}

// ── Teal-Partikel für Erfolgsscreen ──────────────────────────────
function TealPartikel() {
  const particles = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    x:  25 + Math.random() * 50,
    delay: i * 120,
    size: 4 + Math.random() * 4,
    dur: 1800 + Math.random() * 600,
  }));

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position:  "absolute",
          left:      `${p.x}%`,
          bottom:    "40%",
          width:     p.size,
          height:    p.size,
          borderRadius: "50%",
          background: C.teal,
          opacity:   0,
          animation: `huiPartikelAuf ${p.dur}ms ${p.delay}ms ease-out both`,
        }} />
      ))}
      <style>{`
        @keyframes huiPartikelAuf {
          0%   { opacity: 0; transform: translateY(0) scale(0.5); }
          20%  { opacity: 0.7; }
          100% { opacity: 0; transform: translateY(-180px) scale(0.2); }
        }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  SCHRITT 1 — Übersicht
// ═══════════════════════════════════════════════════════════════════
function Schritt1({ items, total, impact, onWeiter, loading = false, error = null }) {
  const pCount = uniquePeople(items);
  const iCount = items.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div style={{ padding: "32px 24px 20px", flexShrink: 0 }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: C.ink, letterSpacing: -0.6,
          lineHeight: 1.15, marginBottom: 10 }}>
          Deine Unterstützung
        </div>
        <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.6 }}>
          Du unterstützt heute
          <span style={{ fontWeight: 700, color: C.ink }}> {pCount} {pCount === 1 ? "Menschen" : "Menschen"}</span>
          {iCount > pCount && (
            <span> mit <span style={{ fontWeight: 700, color: C.ink }}>{iCount} {iCount === 1 ? "Werk" : "Werken"}</span></span>
          )}.
        </div>
      </div>

      {/* Scroll-Bereich */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 24px",
        WebkitOverflowScrolling: "touch" }}>

        {/* Positionen */}
        <div style={{ marginBottom: 24 }}>
          {items.map((item, i) => (
            <PositionZeile key={item.id || i} item={item} />
          ))}
        </div>

        {/* Gesamtbetrag */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline",
          padding: "14px 16px", background: C.creamSoft, borderRadius: 14,
          border: "1px solid rgba(20,20,34,0.05)", marginBottom: 20 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: C.muted }}>Deine Unterstützung</span>
          <span style={{ fontSize: 18, fontWeight: 800, color: C.ink,
            fontVariantNumeric: "tabular-nums", letterSpacing: -0.4 }}>
            {total.toFixed(2).replace(".", ",")}\u202F€
          </span>
        </div>

        {/* Impact */}
        <div style={{ marginBottom: 24 }}>
          <ImpactKarte impactEur={impact} />
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: "16px 24px", flexShrink: 0 }}>
        <PrimaryButton label={loading ? "Wird vorbereitet\u2026" : "Weiter"} onClick={onWeiter} loading={loading} disabled={loading} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  SCHRITT 2 — Angaben
// ═══════════════════════════════════════════════════════════════════
function Schritt2({ items, form, setForm, onWeiter }) {
  const needsShipping = hasPhysical(items);
  const needsPhone    = hasEventOrExperience(items);

  const valid = isFormValid(form, items);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "32px 24px 20px", flexShrink: 0 }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: C.ink, letterSpacing: -0.6,
          lineHeight: 1.15, marginBottom: 8 }}>
          Deine Angaben
        </div>
        <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
          Nur was wirklich nötig ist. Kein Konto erforderlich.
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "4px 24px 0",
        WebkitOverflowScrolling: "touch" }}>

        <HuiInput label="Vorname" value={form.vorname} required
          onChange={v => setForm(f => ({ ...f, vorname: v }))} />
        <HuiInput label="Nachname" value={form.nachname} required
          onChange={v => setForm(f => ({ ...f, nachname: v }))} />
        <HuiInput label="E-Mail" value={form.email} type="email" required
          placeholder="deine@email.de"
          onChange={v => setForm(f => ({ ...f, email: v }))} />

        {needsPhone && (
          <HuiInput label="Telefon (optional für Events)" value={form.telefon}
            type="tel" placeholder="+49"
            onChange={v => setForm(f => ({ ...f, telefon: v }))} />
        )}

        {needsShipping && (
          <>
            <div style={{ height: 1, background: "rgba(20,20,34,0.06)", margin: "8px 0 18px" }} />
            <div style={{ fontSize: 13, fontWeight: 600, color: C.inkMid, marginBottom: 12 }}>
              Versandadresse
            </div>
            <HuiInput label="Straße & Hausnummer" value={form.strasse} required
              onChange={v => setForm(f => ({ ...f, strasse: v }))} />
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ width: 100 }}>
                <HuiInput label="PLZ" value={form.plz} required
                  onChange={v => setForm(f => ({ ...f, plz: v }))} />
              </div>
              <div style={{ flex: 1 }}>
                <HuiInput label="Stadt" value={form.stadt} required
                  onChange={v => setForm(f => ({ ...f, stadt: v }))} />
              </div>
            </div>
          </>
        )}

        <div style={{ height: 24 }} />
      </div>

      <div style={{ padding: "16px 24px", flexShrink: 0 }}>
        <PrimaryButton label="Weiter" onClick={onWeiter} disabled={!valid} />
        <div style={{ textAlign: "center", marginTop: 10, fontSize: 11, color: C.faint,
          lineHeight: 1.5 }}>
          Kein Konto. Kein Newsletter. Nur deine Bestellung.
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  SCHRITT 3 — Zahlung
// ═══════════════════════════════════════════════════════════════════
function Schritt3({ total, impact, paymentMethod, setPaymentMethod, onAbschliessen, loading }) {
  const available = ["apple", "google", "card"];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "32px 24px 20px", flexShrink: 0 }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: C.ink, letterSpacing: -0.6,
          lineHeight: 1.15, marginBottom: 8 }}>
          Zahlung
        </div>
        <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
          Wähle deine bevorzugte Zahlungsmethode.
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "4px 24px 0",
        WebkitOverflowScrolling: "touch" }}>

        {/* Zahlungsmethoden */}
        {available.map(m => (
          <PaymentCard key={m} method={m} selected={paymentMethod === m}
            onSelect={setPaymentMethod} />
        ))}

        {/* Betrag-Übersicht */}
        <div style={{ marginTop: 20, padding: "14px 16px", background: C.creamSoft,
          borderRadius: 14, border: "1px solid rgba(20,20,34,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: C.muted }}>Unterstützung</span>
            <span style={{ fontSize: 13, color: C.inkMid, fontVariantNumeric: "tabular-nums" }}>
              {total.toFixed(2).replace(".", ",")}\u202F€
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between",
            paddingTop: 8, borderTop: "1px solid rgba(20,20,34,0.06)" }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>Gesamt</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: C.ink,
              fontVariantNumeric: "tabular-nums", letterSpacing: -0.3 }}>
              {total.toFixed(2).replace(".", ",")}\u202F€
            </span>
          </div>
        </div>

        {/* Mini-Impact */}
        {impact > 0 && (
          <div style={{ marginTop: 14, padding: "12px 16px",
            background: "rgba(238,247,242,0.7)", borderRadius: 12,
            border: "1px solid rgba(107,174,143,0.18)", display: "flex", gap: 10, alignItems: "center" }}>
            <svg width="18" height="18" viewBox="0 0 28 28" fill="none" style={{ flexShrink: 0 }}>
              <path d="M14 4C14 4 6 8 6 16C6 20.4 9.6 24 14 24C18.4 24 22 20.4 22 16C22 8 14 4 14 4Z"
                fill="rgba(107,174,143,0.18)" stroke="#6BAE8F" strokeWidth="1.8" strokeLinejoin="round"/>
              <path d="M14 24V14" stroke="#6BAE8F" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
            <span style={{ fontSize: 12, color: C.sage, lineHeight: 1.5 }}>
              <strong>{impact.toFixed(2).replace(".", ",")}\u202F€</strong> fließen in den HUI Impact Pool.
            </span>
          </div>
        )}

        <div style={{ height: 24 }} />
      </div>

      <div style={{ padding: "16px 24px", flexShrink: 0 }}>
        <PrimaryButton
          label="Unterstützung abschließen"
          onClick={onAbschliessen}
          loading={loading}
          disabled={!paymentMethod}
        />
        <div style={{ textAlign: "center", marginTop: 10, fontSize: 11, color: C.faint, lineHeight: 1.5 }}>
          Gesicherte Verbindung · SSL-verschlüsselt
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  SCHRITT 4 — Erfolg
// ═══════════════════════════════════════════════════════════════════
function Schritt4({ items, impact, total, onDiscover, onResonanz }) {
  const pCount = uniquePeople(items);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%",
      position: "relative", overflow: "hidden" }}>
      <TealPartikel />

      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column",
        alignItems: "center", padding: "52px 24px 24px", textAlign: "center",
        WebkitOverflowScrolling: "touch" }}>

        {/* Symbol */}
        <div style={{
          width:        72, height: 72, borderRadius: "50%",
          background:   `radial-gradient(circle, ${C.tealPale} 0%, ${C.cream} 80%)`,
          display:      "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 28,
          boxShadow:    `0 0 0 16px rgba(13,196,181,0.06), 0 0 0 32px rgba(13,196,181,0.03)`,
          opacity:      visible ? 1 : 0,
          transform:    visible ? "scale(1)" : "scale(0.85)",
          transition:   "opacity 500ms ease, transform 500ms ease",
        }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M6 16L12 22L26 8" stroke={C.teal} strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* Headline */}
        <div style={{
          fontSize:    40, fontWeight: 800, color: C.ink, letterSpacing: -1.2,
          lineHeight:  1.1, marginBottom: 16,
          opacity:     visible ? 1 : 0,
          transform:   visible ? "translateY(0)" : "translateY(12px)",
          transition:  "opacity 500ms 100ms ease, transform 500ms 100ms ease",
        }}>
          Danke.
        </div>

        <div style={{
          fontSize:   16, color: C.muted, lineHeight: 1.65, maxWidth: 280, marginBottom: 28,
          opacity:    visible ? 1 : 0,
          transform:  visible ? "translateY(0)" : "translateY(8px)",
          transition: "opacity 500ms 200ms ease, transform 500ms 200ms ease",
        }}>
          Deine Unterstützung ist unterwegs.
        </div>

        {/* Menschen + Werke */}
        <div style={{
          padding:    "16px 20px", borderRadius: 16,
          background: C.creamSoft, border: "1px solid rgba(20,20,34,0.05)",
          width:      "100%", marginBottom: 24, textAlign: "left",
          opacity:    visible ? 1 : 0,
          transform:  visible ? "translateY(0)" : "translateY(8px)",
          transition: "opacity 500ms 300ms ease, transform 500ms 300ms ease",
        }}>
          <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.7 }}>
            Du hast heute
          </div>
          <div style={{ fontSize: 17, fontWeight: 800, color: C.ink, letterSpacing: -0.3,
            lineHeight: 1.3, marginTop: 2 }}>
            {pCount} {pCount === 1 ? "Menschen" : "Menschen"}
          </div>
          {items.length > pCount && (
            <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>
              mit {items.length} {items.length === 1 ? "Werk" : "Werken"}
            </div>
          )}
          <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
            unterstützt.
          </div>
        </div>

        {/* Impact */}
        <div style={{
          width:      "100%", marginBottom: 32,
          opacity:    visible ? 1 : 0,
          transform:  visible ? "translateY(0)" : "translateY(8px)",
          transition: "opacity 500ms 400ms ease, transform 500ms 400ms ease",
        }}>
          <ImpactKarte impactEur={impact} />
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding:    "16px 24px",
        flexShrink: 0,
        opacity:    visible ? 1 : 0,
        transform:  visible ? "translateY(0)" : "translateY(8px)",
        transition: "opacity 500ms 500ms ease, transform 500ms 500ms ease",
      }}>
        <PrimaryButton label="Weiter entdecken" onClick={onDiscover} />
        <button
          onClick={onResonanz}
          style={{
            width:        "100%",
            marginTop:    10,
            padding:      "14px 0",
            borderRadius: 14,
            border:       "1.5px solid rgba(20,20,34,0.10)",
            background:   "transparent",
            color:        C.inkMid,
            fontSize:     15,
            fontWeight:   600,
            cursor:       "pointer",
            outline:      "none",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          Zum Resonanz Center
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  PROGRESS-DOTS
// ═══════════════════════════════════════════════════════════════════
function ProgressDots({ step, total = 3 }) {
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} style={{
          width:        i === step ? 20 : 6,
          height:       6,
          borderRadius: 99,
          background:   i === step ? C.teal : "rgba(20,20,34,0.12)",
          transition:   "width 300ms ease, background 300ms ease",
        }} />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  HAUPT-KOMPONENTE
// ═══════════════════════════════════════════════════════════════════
export default function UnterstutzenFlow({
  items = [],
  onClose,
  onUnterstuetzen,
  onDiscover,
  onClearCart,
  onResonanzCenter,
}) {
  const { user } = useAuth();

  const [step,          setStep]          = useState(0);   // 0=Übersicht 1=Stripe 2=Danke
  const [form,          setForm]          = useState(EMPTY_FORM);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [loading,       setLoading]       = useState(false);
  const [visible,       setVisible]       = useState(false);
  const [slideDir,      setSlideDir]      = useState(1);
  const [animating,     setAnimating]     = useState(false);

  // Stripe Commerce Engine
  const [clientSecret,  setClientSecret]  = useState(null);
  const [orderId,       setOrderId]       = useState(null);
  const [stripeError,   setStripeError]   = useState(null);
  const [piLoading,     setPiLoading]     = useState(false);

  const total  = calcTotal(items);
  const impact = calcImpact(total);

  // Einblend-Animation beim Öffnen
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 20);
    return () => clearTimeout(t);
  }, []);

  function goTo(nextStep, dir = 1) {
    if (animating) return;
    setAnimating(true);
    setSlideDir(dir);
    haptic("light");
    setTimeout(() => {
      setStep(nextStep);
      setAnimating(false);
    }, 220);
  }

  // Schritt 0 → 1: Payment Intent erzeugen, dann Stripe öffnen
  async function handleWeiterToStripe() {
    if (piLoading) return;
    haptic("light");
    setPiLoading(true);
    setStripeError(null);
    try {
      const shippingStrategy = resolveShippingStrategy(items);
      const payload          = orderService.buildOrderPayload(items, shippingStrategy, user?.id);
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const res = await fetch(`${supabaseUrl}/functions/v1/create-payment-intent`, {
        method: "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok || result.error) throw new Error(result.error || "Payment Intent fehlgeschlagen");
      setClientSecret(result.clientSecret || null);
      setOrderId(result.orderId || null);
      goTo(1);
    } catch (e) {
      console.error("[UnterstutzenFlow] PI Fehler:", e);
      setStripeError(e?.message || "Verbindungsfehler. Bitte erneut versuchen.");
    } finally {
      setPiLoading(false);
    }
  }

  async function handleStripeSuccess({ orderId: oid, paymentIntentId }) {
    haptic("success");
    try { await onUnterstuetzen?.(items, form, "stripe"); } catch {}
    goTo(2);
  }

  function handleStripeError(err) {
    setStripeError(err?.message || "Zahlung fehlgeschlagen.");
  }

  const STEPS = [
    <Schritt1 key="s1" items={items} total={total} impact={impact}
      onWeiter={handleWeiterToStripe} loading={piLoading} error={stripeError} />,
    <StripePaymentStep key="stripe"
      total={total} impact={impact}
      clientSecret={clientSecret} orderId={orderId}
      onSuccess={handleStripeSuccess}
      onError={handleStripeError}
      onBack={() => goTo(0, -1)} />,
    <Schritt4 key="s4" items={items} impact={impact} total={total}
      onDiscover={() => { onClearCart?.(); onClose?.(); onDiscover?.(); }}
      onResonanz={() => { onClearCart?.(); onClose?.(); onResonanzCenter?.(); }} />,
  ];

  const isSuccess = step === 2;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={isSuccess ? undefined : onClose}
        style={{
          position:   "fixed",
          inset:      0,
          background: "rgba(20,20,34,0.45)",
          zIndex:     10000,
          opacity:    visible ? 1 : 0,
          transition: "opacity 320ms ease",
        }}
      />

      {/* Panel */}
      <div style={{
        position:             "fixed",
        left:                 0,
        right:                0,
        bottom:               0,
        top:                  "max(44px, env(safe-area-inset-top, 44px))",
        zIndex:               10001,
        background:           C.cream,
        borderRadius:         "24px 24px 0 0",
        display:              "flex",
        flexDirection:        "column",
        overflow:             "hidden",
        opacity:              visible ? 1 : 0,
        transform:            visible ? "translateY(0)" : "translateY(40px)",
        transition:           "opacity 320ms cubic-bezier(0.22,1,0.36,1), transform 320ms cubic-bezier(0.22,1,0.36,1)",
      }}>

        {/* Top-Bar */}
        {!isSuccess && (
          <div style={{
            display:        "flex",
            alignItems:     "center",
            justifyContent: "space-between",
            padding:        "14px 20px 10px",
            flexShrink:     0,
            borderBottom:   "1px solid rgba(20,20,34,0.06)",
          }}>
            {/* Zurück / Schließen */}
            <button
              onClick={() => step > 0 ? goTo(step - 1, -1) : onClose?.()}
              style={{
                width: 36, height: 36, borderRadius: "50%",
                border: "1px solid rgba(20,20,34,0.09)",
                background: "rgba(20,20,34,0.04)",
                color: C.muted, fontSize: 17,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", outline: "none", padding: 0,
                WebkitTapHighlightColor: "transparent",
              }}
            >
              {step === 0 ? "×" : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M10 3L5 8L10 13" stroke={C.muted} strokeWidth="1.8"
                    strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>

            {/* Progress */}
            <ProgressDots step={step} total={2} />

            {/* Schritt-Label */}
            <div style={{ fontSize: 12, color: C.faint, fontWeight: 500, minWidth: 36, textAlign: "right" }}>
              {step + 1} / 2
            </div>
          </div>
        )}

        {/* Content — mit Slide-Animation */}
        <div style={{
          flex:      1,
          overflow:  "hidden",
          position:  "relative",
        }}>
          <div style={{
            position:   "absolute",
            inset:      0,
            opacity:    animating ? 0 : 1,
            transform:  animating
              ? `translateX(${slideDir * 24}px)`
              : "translateX(0)",
            transition: `opacity 180ms ease, transform 180ms ease`,
          }}>
            {STEPS[step]}
          </div>
        </div>
      </div>
    </>
  );
}
