// src/components/commerce/ShippingAddressModal.jsx
// LIEFERINFORMATIONEN — Adressabfrage vor der Zahlung.
// Pflichtfelder: Vorname, Nachname, Straße+Hausnummer, PLZ, Stadt, Land.
// Telefonnummer bewusst weggelassen (DSGVO — keine Telefonnummern im System).
// Speichert in orders.shipping_address (jsonb).

import { useState } from "react";
import { createPortal } from "react-dom";
import { useModalRegistration } from "../../hooks/useModalRegistration.js";
import { useWizardBodyLock } from "../../lib/wizardBodyLock.js";

const T = {
  bg:       "#F7F5F0",
  bgCard:   "#FFFFFF",
  teal:     "#0EC4B8",
  tealSoft: "rgba(14,196,184,0.10)",
  ink:      "#1A1A18",
  inkSoft:  "rgba(26,26,24,0.52)",
  inkFaint: "rgba(26,26,24,0.30)",
  border:   "rgba(26,26,24,0.08)",
  red:      "#DC2626",
  redSoft:  "rgba(220,38,38,0.08)",
  r16: 16, r12: 12, r8: 8, r99: 99,
  ff: "Inter,sans-serif",
};

function Field({ label, value, onChange, placeholder, error, type = "text", autoComplete = "" }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <label style={{
        display: "block", fontSize: 12, fontWeight: 600,
        color: T.inkSoft, marginBottom: 5,
      }}>
        {label} <span style={{ color: T.red }}>*</span>
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        style={{
          width: "100%", padding: "12px 14px", borderRadius: T.r12,
          border: error ? `1.5px solid ${T.red}` : `1px solid ${T.border}`,
          background: T.bgCard, fontSize: 14, color: T.ink,
          fontFamily: T.ff, outline: "none",
          transition: "border-color 0.15s",
        }}
      />
      {error && (
        <div style={{ fontSize: 11, color: T.red, marginTop: 4 }}>{error}</div>
      )}
    </div>
  );
}

export default function ShippingAddressModal({ onConfirm = () => {}, onCancel = () => {} }) {
  useModalRegistration(true, onCancel, "ShippingAddressModal");
  useWizardBodyLock();

  const [form, setForm] = useState({
    firstName: "", lastName: "", street: "",
    zip: "", city: "", country: "Deutschland",
  });
  const [errors, setErrors] = useState({});

  const set = (key) => (val) => {
    setForm(prev => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = "Bitte ausfüllen";
    if (!form.lastName.trim())  e.lastName  = "Bitte ausfüllen";
    if (!form.street.trim())    e.street    = "Bitte ausfüllen";
    if (!form.zip.trim())        e.zip       = "Bitte ausfüllen";
    if (!form.city.trim())       e.city      = "Bitte ausfüllen";
    if (!form.country.trim())    e.country   = "Bitte ausfüllen";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const address = {
      firstName: form.firstName.trim(),
      lastName:  form.lastName.trim(),
      street:    form.street.trim(),
      zip:       form.zip.trim(),
      city:      form.city.trim(),
      country:   form.country.trim(),
      full:      `${form.firstName.trim()} ${form.lastName.trim()}\n${form.street.trim()}\n${form.zip.trim()} ${form.city.trim()}\n${form.country.trim()}`,
    };
    onConfirm(address);
  };

  return createPortal(
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onCancel?.(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 10500,
        background: "rgba(26,26,24,0.55)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        fontFamily: T.ff,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 520,
          background: T.bg, borderRadius: "24px 24px 0 0",
          maxHeight: "94vh", display: "flex", flexDirection: "column",
          boxShadow: "0 -4px 32px rgba(26,26,24,0.20)",
        }}
      >
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px", flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: "rgba(26,26,24,0.12)" }} />
        </div>

        {/* Header */}
        <div style={{
          padding: "8px 20px 12px", flexShrink: 0,
          borderBottom: `1px solid ${T.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, color: T.ink }}>Lieferinformationen</div>
            <div style={{ fontSize: 12, color: T.inkFaint, marginTop: 2 }}>
              Bitte gib deine Lieferadresse an
            </div>
          </div>
          <button
            onClick={onCancel}
            style={{
              width: 32, height: 32, borderRadius: "50%", border: "none",
              background: "rgba(26,26,24,0.06)", color: "rgba(26,26,24,0.45)",
              fontSize: 16, cursor: "pointer", lineHeight: 1, flexShrink: 0,
            }}
          >✕</button>
        </div>

        {/* Body */}
        <div style={{
          flex: 1, overflowY: "auto", padding: "20px",
          paddingBottom: "calc(88px + env(safe-area-inset-bottom, 0px))",
        }}>
          <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
            <Field label="Vorname" value={form.firstName} onChange={set("firstName")} placeholder="Max" error={errors.firstName} autoComplete="given-name" />
            <Field label="Nachname" value={form.lastName} onChange={set("lastName")} placeholder="Mustermann" error={errors.lastName} autoComplete="family-name" />
          </div>

          <div style={{ marginBottom: 14 }}>
            <Field label="Straße + Hausnummer" value={form.street} onChange={set("street")} placeholder="Musterstraße 1" error={errors.street} autoComplete="street-address" />
          </div>

          <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
            <Field label="PLZ" value={form.zip} onChange={set("zip")} placeholder="10115" error={errors.zip} autoComplete="postal-code" />
            <Field label="Stadt" value={form.city} onChange={set("city")} placeholder="Berlin" error={errors.city} autoComplete="address-level2" />
          </div>

          <div style={{ marginBottom: 24 }}>
            <Field label="Land" value={form.country} onChange={set("country")} placeholder="Deutschland" error={errors.country} autoComplete="country-name" />
          </div>

          <div style={{
            background: T.tealSoft, borderRadius: T.r12, padding: "12px 14px",
            fontSize: 12.5, color: T.inkSoft, lineHeight: 1.55,
            marginBottom: 20,
          }}>
            Diese Adresse wird an den Verkäufer weitergegeben, damit er dein Werk versenden kann.
          </div>

          <button
            onClick={handleSubmit}
            style={{
              width: "100%", padding: "16px", borderRadius: 14, border: "none",
              background: T.teal, color: "#fff", fontSize: 16, fontWeight: 600,
              cursor: "pointer", fontFamily: T.ff,
            }}
          >
            Weiter zur Zahlung
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
