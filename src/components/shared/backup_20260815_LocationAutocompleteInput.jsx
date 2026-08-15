// src/components/shared/LocationAutocompleteInput.jsx
// ══════════════════════════════════════════════════════════════════════
// LOCATION AUTOCOMPLETE INPUT — wiederverwendbares Adress-/Ort-Eingabefeld
// mit Live-Vorschlägen (OpenStreetMap Nominatim, gleiche Quelle wie
// LocationSection.jsx/RadiusContext.jsx). Tippt der Nutzer z.B. "Choulou",
// erscheinen darunter passende Orte zum Antippen — inkl. exakter
// Koordinaten, die direkt übernommen werden (kein erneutes Geocoding
// beim Speichern nötig, falls die Adresse danach nicht mehr manuell
// verändert wird).
//
// Verwendet in: TalentAngebotWizard.jsx, WerkWizard.jsx, ExperienceWizard.jsx
// (identisches "Ort"-Eingabefeld, bisher je ein reines Text-Input ohne
// Vorschläge — jetzt einheitlich).
//
// Design bewusst eigenständig/neutral gehalten (kein Zugriff auf die
// jeweils lokalen `C`-Farbobjekte der 3 Wizards, die leicht unterschiedliche
// Key-Namen verwenden) -- nutzt dieselbe Teal-Systemfarbe wie überall sonst
// im HUI-Design (siehe LocationSection.jsx T.teal).
// ══════════════════════════════════════════════════════════════════════
import React, { useState, useRef, useEffect } from "react";
import { searchPlaces } from "../../lib/geocoding.js";

const D = {
  teal: "#0EC4B8",
  ink: "#1A1A18",
  inkFaint: "rgba(26,26,24,0.45)",
  border: "rgba(26,26,24,0.10)",
  card: "0 1px 3px rgba(0,0,0,0.04),0 4px 20px rgba(0,0,0,0.06)",
};

/**
 * @param {string} value - aktueller Eingabetext (kontrolliert vom Parent)
 * @param {(text:string)=>void} onChange - bei jeder Texteingabe
 * @param {(place:{label:string,lat:number,lng:number})=>void} [onPick] - bei Auswahl eines Vorschlags
 * @param {boolean} [disabled]
 * @param {string} [placeholder]
 * @param {object} [style] - wird auf das <input> angewendet (z.B. bestehendes INP-Style des Wizards)
 */
export default function LocationAutocompleteInput({
  value = "", onChange = () => {}, onPick = () => {}, disabled = false,
  placeholder = "Straße, Ort", style = {},
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);
  const blurTimeoutRef = useRef(null);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!open || (value || "").trim().length < 2) { setSuggestions([]); setSearching(false); return; }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      const res = await searchPlaces(value);
      setSuggestions(res);
      setSearching(false);
    }, 450);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, open]);

  useEffect(() => () => clearTimeout(blurTimeoutRef.current), []);

  function handlePick(place) {
    clearTimeout(blurTimeoutRef.current);
    onChange(place.label);
    onPick(place);
    setSuggestions([]);
    setOpen(false);
  }

  const showDropdown = open && !disabled && ((value || "").trim().length >= 2) && (searching || suggestions.length > 0);

  return (
    <div style={{ position: "relative" }}>
      <input
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => { blurTimeoutRef.current = setTimeout(() => setOpen(false), 180); }}
        style={style}
      />
      {showDropdown && (
        <div style={{
          position: "absolute", left: 0, right: 0, top: "calc(100% + 4px)", zIndex: 20,
          borderRadius: 12, border: `1px solid ${D.border}`, background: "#fff",
          boxShadow: D.card, overflow: "hidden", maxHeight: 220, overflowY: "auto",
        }}>
          {searching && (
            <div style={{ padding: "9px 12px", fontSize: 12, color: D.inkFaint }}>Suche…</div>
          )}
          {!searching && suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onMouseDown={e => e.preventDefault() /* verhindert onBlur vor dem Klick */}
              onClick={() => handlePick(s)}
              style={{
                display: "block", width: "100%", textAlign: "left", padding: "9px 12px",
                background: "none", border: "none",
                borderTop: i > 0 ? `1px solid ${D.border}` : "none",
                fontSize: 12.5, color: D.ink, cursor: "pointer", fontFamily: "inherit",
              }}
            >
              📍 {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
