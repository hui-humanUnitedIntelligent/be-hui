// src/components/forms/BirthdatePickerField.jsx
// ════════════════════════════════════════════════════════════════════
// BIRTHDATE-PICKER-001 (2026-09-09, Michael, Sammelaufgabe):
// Vereinfachte Geburtsdatum-Auswahl — ersetzt den nativen
// <input type="date"> (Browser-Datepicker), dessen winzige Jahres-
// Auswahl oben links die Nutzer nicht verstanden ("die Nutzer
// verstehen nicht wie man die Jahre wechselt", Michael-Report mit
// Screenshot des Chrome-Pickers). Freigegebene Visualisierung:
// Jahr zuerst mit großen ‹ › Steppern, darunter Monat als 12 Kacheln,
// darunter Tag als Zahlen-Grid. ALLES sichtbar, nichts versteckt.
//
// SSOT für BEIDE Geburtsdatum-Felder der App:
//   - LoginPage.jsx        (Registrierung, minAge=16 — Altersschutz)
//   - KontoSettingsPage.jsx (Konto & Einstellungen, optional)
//
// Architektur-Regeln die dieses Modul einhält:
//   - createPortal(..., document.body) + zIndex 10500 (Footer-Navbar-
//     Regel: Jedes Modal/Sheet per Portal, z-index >= 10500)
//   - padding-bottom 88px + safe-area im Sheet (Navbar-Abstands-Regel 8)
//   - EIGENER useTranslation()-Hook — t wird NIEMALS als Prop übergeben
//     (titleKey als String-Prop ist erlaubt, die Komponente übersetzt selbst)
//   - Monat-/Tag-Namen über Intl.DateTimeFormat(lang) — KEINE 8×16
//     manuellen Monats-Keys pflegen (i18n nur für UI-Chips/Hinweise)
//   - Ausgabe-Format unverändert 'YYYY-MM-DD' — LoginPage.calculateAge,
//     profiles.birth_date und profiles_geburtsdatum bleiben kompatibel
//   - KEINE Texteingabe → keine Tastatur → keine Keyboard-Shift-Probleme
// ════════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "../../hooks/useTranslation.js";

// ── Design Tokens (hui.design.js Werte, lokal gebündelt um Import-Kette schlank zu halten) ──
const C = {
  teal:      "#0DC4B5",
  tealSoft:  "rgba(13,196,181,0.10)",
  tealPale:  "rgba(13,196,181,0.08)",
  coral:     "#FF6F61",
  sheet:     "#FDFBF8",  // creamSoft — Sheet-Fläche
  white:     "#FFFFFF",
  ink:       "#14141e",  // hui ink
  ink2:      "rgba(20,20,30,0.62)",
  ink3:      "rgba(20,20,30,0.55)",
  border:    "rgba(0,0,0,0.07)",
};

const MIN_YEAR = 1900;

function pad2(n) { return String(n).padStart(2, "0"); }

// 'YYYY-MM-DD' → {y, m, d} (m: 1-12) | null
function parseValue(v) {
  if (typeof v !== "string") return null;
  const mt = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v.trim());
  if (!mt) return null;
  return { y: parseInt(mt[1], 10), m: parseInt(mt[2], 10), d: parseInt(mt[3], 10) };
}

function clampYear(y) {
  const maxYear = new Date().getFullYear();
  return Math.min(Math.max(y, MIN_YEAR), maxYear);
}

const BirthdatePickerField = ({
  value = "",           // 'YYYY-MM-DD' | ''
  onChange,             // (newValue: 'YYYY-MM-DD') => void
  titleKey,             // i18n-Key für Sheet-Titel + Feld-Label (String-Prop, NICHT t)
  placeholderKey,       // optional: eigener Placeholder-Key (Default: titleKey)
  minAge = 0,           // 16 in der Registrierung — steuert Live-Altershinweis
  variant = "light",    // 'light' (Studio/Konto) | 'dark' (Login-Glass)
  disabled = false,
}) => {
  const { t, lang } = useTranslation();

  const [open, setOpen] = useState(false);
  const [selY, setSelY] = useState(null);
  const [selM, setSelM] = useState(null); // 1-12
  const [selD, setSelD] = useState(null); // 1-31

  const maxYear = useMemo(() => new Date().getFullYear(), []);
  const todayStr = useMemo(() => {
    const n = new Date();
    return `${n.getFullYear()}-${pad2(n.getMonth() + 1)}-${pad2(n.getDate())}`;
  }, []);

  // ── Sheet beim Öffnen mit vorhandenem Wert initialisieren ──
  function openSheet() {
    if (disabled) return;
    const parsed = parseValue(value);
    if (parsed) {
      setSelY(parsed.y); setSelM(parsed.m); setSelD(parsed.d);
    } else {
      // Sensibler Default: ~25 zurück — die häufigste Zielgruppe liegt dort
      setSelY(maxYear - 25); setSelM(null); setSelD(null);
    }
    setOpen(true);
  }

  // ── Tag-Anzahl des gewählten Monats/Jahres ──
  const daysInMonth = useMemo(() => {
    if (!selY || !selM) return 31;
    return new Date(selY, selM, 0).getDate();
  }, [selY, selM]);

  // Tag zurücksetzen, wenn er im neu gewählten Monat nicht existiert (z.B. 31 → Feb)
  useEffect(() => {
    if (selD != null && selD > daysInMonth) setSelD(null);
  }, [selD, daysInMonth]);

  const complete = !!(selY && selM && selD);
  const resultStr = complete ? `${selY}-${pad2(selM)}-${pad2(selD)}` : "";

  // ── Live-Alter (Altersschutz-Hinweis im Sheet) ──
  const age = useMemo(() => {
    if (!complete) return null;
    const today = new Date();
    const b = new Date(selY, selM - 1, selD);
    let a = today.getFullYear() - b.getFullYear();
    const mDiff = today.getMonth() - b.getMonth();
    if (mDiff < 0 || (mDiff === 0 && today.getDate() < b.getDate())) a--;
    return a;
  }, [complete, selY, selM, selD]);

  const isFuture = complete && resultStr > todayStr;
  const tooYoung = minAge > 0 && age != null && age >= 0 && age < minAge;

  // ── Monat/Tag-Formatierung über Intl (8 App-Sprachen, keine manuellen Keys) ──
  const monthNames = useMemo(() => {
    try {
      const fmt = new Intl.DateTimeFormat(lang || "de", { month: "short" });
      return Array.from({ length: 12 }, (_, i) => fmt.format(new Date(2026, i, 1)));
    } catch {
      return ["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"];
    }
  }, [lang]);

  const displayDate = useMemo(() => {
    const parsed = parseValue(value);
    if (!parsed) return null;
    try {
      return new Intl.DateTimeFormat(lang || "de", { day: "numeric", month: "long", year: "numeric" })
        .format(new Date(parsed.y, parsed.m - 1, parsed.d));
    } catch {
      return `${parsed.d}.${parsed.m}.${parsed.y}`;
    }
  }, [value, lang]);

  function handleDone() {
    if (!complete || isFuture) return;
    onChange?.(resultStr);
    setOpen(false);
  }

  // ── Feld-Optik: 'dark' = Login-Glass, 'light' = Studio-Kachel ──
  const fieldBase = { width: "100%", boxSizing: "border-box", cursor: disabled ? "not-allowed" : "pointer", fontFamily: "inherit", textAlign: "left" };
  const fieldStyle = variant === "dark"
    ? { ...fieldBase, padding: "12px 14px", background: "rgba(255,255,255,0.07)", border: "1.5px solid rgba(255,255,255,0.13)", borderRadius: 14, fontSize: 14, color: displayDate ? "#FFFFFF" : "rgba(255,255,255,0.38)", display: "flex", alignItems: "center", justifyContent: "space-between" }
    : { ...fieldBase, padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.white, fontSize: 14, color: displayDate ? C.ink : C.ink3, display: "flex", alignItems: "center", justifyContent: "space-between" };

  const chevronCol = variant === "dark" ? "rgba(255,255,255,0.45)" : "rgba(20,20,30,0.30)";

  return (
    <>
      {/* ── Das Feld (öffnet das Sheet — KEIN natives input mehr) ── */}
      <button type="button" onClick={openSheet} disabled={disabled} style={fieldStyle} aria-label={t(titleKey)}>
        <span>{displayDate || t(placeholderKey || titleKey)}</span>
        <span style={{ color: chevronCol, fontSize: 16, flexShrink: 0, marginLeft: 8 }}>▾</span>
      </button>

      {/* ── Sheet: Portal + zIndex 10500 (Footer-Navbar-Regel) ── */}
      {open && createPortal(
        <div
          onClick={() => setOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: 10500, background: "rgba(20,20,30,0.55)", display: "flex", alignItems: "flex-end" }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: "100%", maxHeight: "92dvh", overflowY: "auto", WebkitOverflowScrolling: "touch",
              background: C.sheet, borderRadius: "24px 24px 0 0",
              padding: "20px 20px calc(88px + env(safe-area-inset-bottom, 0px))", /* 72px Navbar + 16px Luft */
              boxShadow: "0 -12px 40px rgba(20,20,30,0.30)",
            }}
          >
            {/* Kopfzeile */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
              <div style={{ fontSize: 16.5, fontWeight: 700, color: C.ink, letterSpacing: "-0.02em" }}>{t(titleKey)}</div>
              <button type="button" onClick={() => setOpen(false)} aria-label="✕"
                style={{ width: 28, height: 28, borderRadius: "50%", border: "none", background: "rgba(20,20,30,0.06)", color: "rgba(20,20,30,0.5)", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}>✕</button>
            </div>

            {/* ── 1) JAHR — große Stepper (48px Touch-Fläche, sofort sichtbar) ── */}
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: C.ink3, margin: "14px 0 8px" }}>{t("datepicker.year")}</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: C.white, border: `1px solid ${C.border}`, borderRadius: 16, padding: "8px 12px" }}>
              <button type="button" onClick={() => setSelY(clampYear(selY - 1))} aria-label="‹"
                style={{ width: 48, height: 48, borderRadius: 14, background: C.tealSoft, border: "none", fontSize: 22, fontWeight: 700, color: C.teal, cursor: "pointer", flexShrink: 0, fontFamily: "inherit" }}>‹</button>
              <div style={{ fontSize: 34, fontWeight: 700, color: C.ink, letterSpacing: "-0.02em", textAlign: "center", flex: 1 }}>{selY}</div>
              <button type="button" onClick={() => setSelY(clampYear(selY + 1))} aria-label="›"
                style={{ width: 48, height: 48, borderRadius: 14, background: C.tealSoft, border: "none", fontSize: 22, fontWeight: 700, color: C.teal, cursor: "pointer", flexShrink: 0, fontFamily: "inherit" }}>›</button>
            </div>
            <div style={{ fontSize: 11, color: "rgba(20,20,30,0.55)", textAlign: "center", marginTop: 6 }}>{t("datepicker.yearHint")}</div>

            {/* ── 2) MONAT — 12 Kacheln (4×3) ── */}
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: C.ink3, margin: "14px 0 8px" }}>{t("datepicker.month")}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              {monthNames.map((name, i) => {
                const m = i + 1;
                const sel = selM === m;
                return (
                  <button type="button" key={m} onClick={() => setSelM(m)}
                    style={{
                      padding: "9px 0", borderRadius: 11, border: `1px solid ${sel ? C.teal : C.border}`,
                      background: sel ? C.teal : C.white,
                      fontSize: 12.5, fontWeight: sel ? 700 : 600,
                      color: sel ? "#fff" : C.ink2, textAlign: "center", cursor: "pointer", fontFamily: "inherit",
                    }}>{name}</button>
                );
              })}
            </div>

            {/* ── 3) TAG — Zahlen-Grid (7 Spalten, nur gültige Tage) ── */}
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: C.ink3, margin: "14px 0 8px" }}>{t("datepicker.day")}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
                const sel = selD === d;
                return (
                  <button type="button" key={d} onClick={() => setSelD(d)}
                    style={{
                      aspectRatio: "1", maxHeight: 38, borderRadius: 10,
                      border: `1px solid ${sel ? C.teal : "rgba(0,0,0,0.06)"}`,
                      background: sel ? C.teal : C.white,
                      fontSize: 12.5, fontWeight: sel ? 700 : 600,
                      color: sel ? "#fff" : C.ink2,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", fontFamily: "inherit", padding: 0,
                    }}>{d}</button>
                );
              })}
            </div>

            {/* ── Live-Ergebnis + Altersschutz-Hinweis ── */}
            {complete && (
              <div style={{
                marginTop: 14, background: isFuture || tooYoung ? "rgba(255,111,97,0.08)" : C.tealPale,
                borderRadius: 12, padding: "10px 14px",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <span style={{ fontSize: 13, color: C.ink, fontWeight: 600 }}>
                  {new Intl.DateTimeFormat(lang || "de", { day: "numeric", month: "long", year: "numeric" }).format(new Date(selY, selM - 1, selD))}
                </span>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: isFuture || tooYoung ? C.coral : C.teal }}>
                  {isFuture
                    ? t("datepicker.future")
                    : age < 0
                      ? t("datepicker.ageYears", { age: 0 })
                      : t("datepicker.ageYears", { age })}
                </span>
              </div>
            )}
            {tooYoung && !isFuture && (
              <div style={{ fontSize: 11.5, color: C.coral, marginTop: 8, lineHeight: 1.5, padding: "0 4px" }}>
                {t("datepicker.tooYoung", { minAge })}
              </div>
            )}

            {/* ── CTA ── */}
            <button type="button" onClick={handleDone} disabled={!complete || isFuture}
              style={{
                marginTop: 14, width: "100%", padding: "15px 0", borderRadius: 16, border: "none",
                background: (!complete || isFuture) ? "rgba(13,196,181,0.35)" : C.teal,
                color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", letterSpacing: "0.01em", fontFamily: "inherit",
              }}>{t("datepicker.done")}</button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default BirthdatePickerField;
