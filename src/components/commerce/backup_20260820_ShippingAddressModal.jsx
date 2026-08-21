// src/components/commerce/ShippingAddressModal.jsx
// LIEFERINFORMATIONEN — Adressabfrage vor der Zahlung.
// Pflichtfelder: Vorname, Nachname, Straße+Hausnummer, PLZ, Stadt, Land.
// Telefonnummer bewusst weggelassen (DSGVO — keine Telefonnummern im System).
// Speichert in orders.shipping_address (jsonb).
//
// KBD-INSET-FIX (2026-08-20, Michael-Report "Hintergrund verschiebt sich
// nicht, wenn die Tastatur offen ist"): Root war position:"fixed",inset:0
// ohne jede Tastatur-Anpassung -- die Systemtastatur legte sich einfach
// über die unteren Felder (Land, "Weiter zur Zahlung"), ohne dass sich das
// Sheet nach oben verkleinerte. Fix analog zum selben Tag bereits gefixten
// WerkWizard.jsx (KBD-INSET-FIX 2026-08-20): useKeyboardInset() aktiviert
// die globale --hui-keyboard-inset CSS-Variable, der Backdrop bekommt
// bottom:"var(--hui-keyboard-inset,0px)" statt einem starren inset:0 und
// data-hui-kbd-self-managed, damit der globale Keyboard-Handler
// (globalKeyboardHandler.js) dieses Element nicht zusätzlich anfasst.
// Da der Backdrop flex+alignItems:"flex-end" ist, rutscht das Sheet beim
// Schrumpfen des Backdrops automatisch mit nach oben über die Tastatur.
//
// GEO-VORSCHLAG + LÄNDER-LISTE (2026-08-20, Michael-Feedback): (1) Button
// "Meinen Standort verwenden" nutzt navigator.geolocation + Nominatim
// Reverse-Geocoding (gleiches Muster wie ProfilBearbeitenModal.jsx
// handleGPSLocation) um Straße/PLZ/Stadt/Land automatisch vorzuschlagen.
// (2) Land ist kein Freitext mehr, sondern ein Auswahlfeld -- Klick öffnet
// CountryPickerSheet (eigener Portal-Layer, zIndex 10600, über dem
// Lieferinformationen-Sheet mit 10500) mit Suchfeld + scrollbarer Liste
// aus src/lib/countries.js (COUNTRIES_DE, SSOT für Länder-Namen).

import { useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useModalRegistration } from "../../hooks/useModalRegistration.js";
import { useWizardBodyLock } from "../../lib/wizardBodyLock.js";
import { useKeyboardInset } from "../../hooks/useKeyboardInset.js";
import { searchCountries } from "../../lib/countries.js";

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

// LÄNDER-AUSWAHLFELD — sieht aus wie Field, ist aber ein Button (öffnet
// CountryPickerSheet) statt eines Texteingabefelds.
function SelectField({ label, value, placeholder, error, onClick }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <label style={{
        display: "block", fontSize: 12, fontWeight: 600,
        color: T.inkSoft, marginBottom: 5,
      }}>
        {label} <span style={{ color: T.red }}>*</span>
      </label>
      <button
        type="button"
        onClick={onClick}
        style={{
          width: "100%", padding: "12px 14px", borderRadius: T.r12,
          border: error ? `1.5px solid ${T.red}` : `1px solid ${T.border}`,
          background: T.bgCard, fontSize: 14, color: value ? T.ink : T.inkFaint,
          fontFamily: T.ff, outline: "none", textAlign: "left",
          cursor: "pointer", display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: 8,
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {value || placeholder}
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, opacity: 0.5 }}>
          <path d="M6 9l6 6 6-6" stroke={T.ink} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {error && (
        <div style={{ fontSize: 11, color: T.red, marginTop: 4 }}>{error}</div>
      )}
    </div>
  );
}

// LÄNDER-PICKER — eigener Portal-Layer über dem Lieferinformationen-Sheet.
function CountryPickerSheet({ currentValue, onSelect, onClose }) {
  useModalRegistration(true, onClose, "CountryPickerSheet");
  const [query, setQuery] = useState("");
  const results = searchCountries(query);

  return createPortal(
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 10600,
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
          maxHeight: "80vh", display: "flex", flexDirection: "column",
          boxShadow: "0 -4px 32px rgba(26,26,24,0.20)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px", flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: "rgba(26,26,24,0.12)" }} />
        </div>

        <div style={{
          padding: "8px 20px 12px", flexShrink: 0,
          borderBottom: `1px solid ${T.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ fontSize: 17, fontWeight: 600, color: T.ink }}>Land auswählen</div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: "50%", border: "none",
              background: "rgba(26,26,24,0.06)", color: "rgba(26,26,24,0.45)",
              fontSize: 16, cursor: "pointer", lineHeight: 1, flexShrink: 0,
            }}
          >✕</button>
        </div>

        <div style={{ padding: "12px 20px", flexShrink: 0 }}>
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Land suchen…"
            style={{
              width: "100%", padding: "12px 14px", borderRadius: T.r12,
              border: `1px solid ${T.border}`, background: T.bgCard,
              fontSize: 14, color: T.ink, fontFamily: T.ff, outline: "none",
            }}
          />
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "0 8px 12px" }}>
          {results.length === 0 && (
            <div style={{ padding: "20px", textAlign: "center", fontSize: 13, color: T.inkFaint }}>
              Kein Land gefunden.
            </div>
          )}
          {results.map((country) => {
            const active = country === currentValue;
            return (
              <button
                key={country}
                type="button"
                onClick={() => onSelect(country)}
                style={{
                  width: "100%", textAlign: "left", padding: "12px 14px",
                  borderRadius: T.r12, border: "none", cursor: "pointer",
                  background: active ? T.tealSoft : "transparent",
                  color: active ? T.teal : T.ink,
                  fontWeight: active ? 600 : 400,
                  fontSize: 14.5, fontFamily: T.ff, display: "block",
                }}
              >
                {country}
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function ShippingAddressModal({ onConfirm = () => {}, onCancel = () => {} }) {
  useModalRegistration(true, onCancel, "ShippingAddressModal");
  useWizardBodyLock();
  // KBD-INSET-FIX (2026-08-20) -- siehe Kopf-Kommentar.
  useKeyboardInset();

  const [form, setForm] = useState({
    firstName: "", lastName: "", street: "",
    zip: "", city: "", country: "Deutschland",
  });
  const [errors, setErrors] = useState({});
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);

  // GEO-VORSCHLAG (2026-08-20) -- siehe Kopf-Kommentar. Gleiches Muster wie
  // ProfilBearbeitenModal.jsx handleGPSLocation (navigator.geolocation +
  // Nominatim Reverse-Geocoding), hier angewendet auf die Lieferadresse.
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState(false);
  const [geoApplied, setGeoApplied] = useState(false);

  const set = (key) => (val) => {
    setForm(prev => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: null }));
  };

  const handleUseGeoLocation = useCallback(() => {
    if (!navigator.geolocation) { setGeoError(true); return; }
    setGeoLoading(true); setGeoError(false);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude: lat, longitude: lng } = coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=de`,
            { headers: { Accept: "application/json" } }
          );
          const d = await res.json();
          const addr = d.address || {};
          const street = [addr.road, addr.house_number].filter(Boolean).join(" ");
          setForm(prev => ({
            ...prev,
            street:  street || prev.street,
            zip:     addr.postcode || prev.zip,
            city:    addr.city || addr.town || addr.village || addr.county || prev.city,
            country: addr.country || prev.country,
          }));
          setErrors({});
          setGeoApplied(true);
        } catch {
          setGeoError(true);
        } finally {
          setGeoLoading(false);
        }
      },
      () => { setGeoLoading(false); setGeoError(true); },
      { timeout: 8000, maximumAge: 60000 }
    );
  }, []);

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
      data-hui-kbd-self-managed
      style={{
        position: "fixed", top: 0, left: 0, right: 0,
        bottom: "var(--hui-keyboard-inset, 0px)", // KBD-INSET-FIX (2026-08-20)
        zIndex: 10500,
        background: "rgba(26,26,24,0.55)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        fontFamily: T.ff,
        transition: "bottom .15s ease-out",
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
          {/* Geo-Vorschlag */}
          {!geoApplied && (
            <button
              type="button"
              onClick={handleUseGeoLocation}
              disabled={geoLoading}
              style={{
                width: "100%", display: "flex", alignItems: "center",
                justifyContent: "center", gap: 8,
                padding: "12px 14px", marginBottom: 16,
                borderRadius: T.r12, border: `1px solid ${T.teal}44`,
                background: T.tealSoft, color: T.teal,
                fontSize: 13.5, fontWeight: 600, fontFamily: T.ff,
                cursor: geoLoading ? "default" : "pointer",
                opacity: geoLoading ? 0.7 : 1,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                <path d="M12 22s7-6.5 7-12A7 7 0 0 0 5 10c0 5.5 7 12 7 12Z" stroke={T.teal} strokeWidth="1.8" strokeLinejoin="round" />
                <circle cx="12" cy="10" r="2.4" stroke={T.teal} strokeWidth="1.8" />
              </svg>
              {geoLoading ? "Standort wird ermittelt…" : "Meinen Standort verwenden"}
            </button>
          )}
          {geoApplied && (
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 14px", marginBottom: 16,
              borderRadius: T.r12, background: T.tealSoft,
              color: T.teal, fontSize: 12.5, fontWeight: 600,
            }}>
              ✓ Adresse aus deinem Standort übernommen — bitte prüfen
            </div>
          )}
          {geoError && (
            <div style={{ fontSize: 11.5, color: T.red, marginBottom: 16 }}>
              Standort konnte nicht ermittelt werden. Bitte manuell ausfüllen oder Standortzugriff erlauben.
            </div>
          )}

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
            <SelectField
              label="Land"
              value={form.country}
              placeholder="Land auswählen"
              error={errors.country}
              onClick={() => setCountryPickerOpen(true)}
            />
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

      {countryPickerOpen && (
        <CountryPickerSheet
          currentValue={form.country}
          onSelect={(country) => {
            set("country")(country);
            setCountryPickerOpen(false);
          }}
          onClose={() => setCountryPickerOpen(false)}
        />
      )}
    </div>,
    document.body
  );
}
