// src/components/talents/AvailabilityCalendar.jsx
// ══════════════════════════════════════════════════════════════════════
// STANDORT-KALENDER-037 (2026-07-08) — Echte Kalenderansicht fuer Talent-
// Verfuegbarkeit, statt flacher Text-Datum-Pillen.
//
// Ein einziges, wiederverwendbares Bauteil fuer BEIDE Seiten des Flusses
// (Charta-Prinzip "Erweitern statt duplizieren" — kein zweites Kalender-Bauteil):
//   mode="edit" — Anbieter waehlt/entfernt Verfuegbarkeits-Termine per Klick
//                 im Monatsraster (ersetzt das bisherige Datum-Einzel-Eingabefeld
//                 in TalentAngebotWizard.jsx, Schritt 4). Datenformat/Spalte
//                 (available_dates, jsonb-Array von ISO-Datumsstrings) bleibt
//                 unveraendert — rein UI-seitige Verbesserung.
//   mode="book" — Kunde waehlt aus den vom Anbieter freigegebenen Terminen
//                 (TalentBookingFlow.jsx), bereits ausgebuchte Termine/Zeit-
//                 fenster werden anhand von rpc_get_talent_month_availability
//                 (neu, additiv) ausgegraut/gesperrt dargestellt.
//
// Kein neuer State-Store, keine neue Bibliothek — reines Grid aus <button>.
// ══════════════════════════════════════════════════════════════════════
import React, { useMemo, useState } from "react";

const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const MONTH_NAMES = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];

function toIso(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
function todayIso() { return new Date().toISOString().slice(0, 10); }

// Baut das Monatsraster: fuehrende Leerfelder (Montag-Start), dann alle Tage.
function buildGrid(year, month) {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leading = (first.getDay() + 6) % 7; // Montag=0
  const cells = Array.from({ length: leading }, () => null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
}

export default function AvailabilityCalendar({
  mode = "book",              // "edit" | "book"
  // edit mode:
  selectedDates = [],          // bereits gewaehlte Termine (ISO-Strings)
  onToggleDate = () => {},     // (isoDate) => void
  // book mode:
  availableDates = [],         // vom Anbieter freigegebene Termine (ISO-Strings)
  selectedDate = "",           // aktuell gewaehltes Datum
  onSelectDate = () => {},     // (isoDate) => void
  fullDates = [],              // Termine, die komplett ausgebucht sind (book mode)
  onMonthChange = null,        // (isoMonth: "YYYY-MM") => void — fuer Live-Verfuegbarkeitsabruf
  minDate = todayIso(),
  maxDate = null,              // optional harte Obergrenze (Buchungsfenster-Ende)
  disabled = false,
}) {
  const min = minDate || todayIso();
  const initial = useMemo(() => {
    const ref = (mode === "book" && selectedDate) ? selectedDate : min;
    const [y, m] = ref.split("-").map(Number);
    return { y, m: m - 1 };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [viewYear, setViewYear] = useState(initial.y);
  const [viewMonth, setViewMonth] = useState(initial.m);

  React.useEffect(() => {
    onMonthChange?.(`${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`);
  }, [viewYear, viewMonth]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedSet = mode === "edit" ? new Set(selectedDates) : null;
  const availableSet = mode === "book" ? new Set(availableDates) : null;
  const fullSet = mode === "book" ? new Set(fullDates) : null;

  const grid = buildGrid(viewYear, viewMonth);
  const canGoPrev = !(viewYear === Number(min.slice(0, 4)) && viewMonth === Number(min.slice(5, 7)) - 1);
  const maxAllowed = maxDate ? maxDate.slice(0, 7) : null;
  const viewKey = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;
  const canGoNext = !maxAllowed || viewKey < maxAllowed;

  function goPrev() {
    if (!canGoPrev) return;
    const nm = viewMonth === 0 ? 11 : viewMonth - 1;
    const ny = viewMonth === 0 ? viewYear - 1 : viewYear;
    setViewYear(ny); setViewMonth(nm);
  }
  function goNext() {
    if (!canGoNext) return;
    const nm = viewMonth === 11 ? 0 : viewMonth + 1;
    const ny = viewMonth === 11 ? viewYear + 1 : viewYear;
    setViewYear(ny); setViewMonth(nm);
  }

  return (
    <div style={{ userSelect: "none" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <button type="button" onClick={goPrev} disabled={!canGoPrev || disabled} style={{
          width: 30, height: 30, borderRadius: 9, border: "1.5px solid rgba(26,26,24,0.10)",
          background: "#fff", color: canGoPrev ? "#1A1A18" : "rgba(26,26,24,0.25)",
          fontSize: 15, fontWeight: 700, cursor: canGoPrev ? "pointer" : "default", touchAction: "manipulation",
        }}>‹</button>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: "#1A1A18" }}>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </div>
        <button type="button" onClick={goNext} disabled={!canGoNext || disabled} style={{
          width: 30, height: 30, borderRadius: 9, border: "1.5px solid rgba(26,26,24,0.10)",
          background: "#fff", color: canGoNext ? "#1A1A18" : "rgba(26,26,24,0.25)",
          fontSize: 15, fontWeight: 700, cursor: canGoNext ? "pointer" : "default", touchAction: "manipulation",
        }}>›</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3, marginBottom: 4 }}>
        {WEEKDAYS.map(w => (
          <div key={w} style={{ textAlign: "center", fontSize: 10.5, fontWeight: 700, color: "rgba(26,26,24,0.35)" }}>
            {w}
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3 }}>
        {grid.map((d, i) => {
          if (d == null) return <div key={`b${i}`} />;
          const iso = toIso(viewYear, viewMonth, d);
          const isPast = iso < min;
          const isOverMax = maxDate ? iso > maxDate : false;

          let state = "muted";      // book mode default: nicht buchbar
          if (mode === "edit") {
            state = selectedSet.has(iso) ? "selected" : (isPast ? "disabled" : "pickable");
          } else {
            if (isPast || isOverMax) state = "disabled";
            else if (!availableSet.has(iso)) state = "muted";
            else if (fullSet.has(iso)) state = "full";
            else state = selectedDate === iso ? "selected" : "available";
          }

          const clickable = !disabled && (
            (mode === "edit" && !isPast) ||
            (mode === "book" && (state === "available" || state === "selected"))
          );

          const styles = {
            selected:  { bg: "#0EC4B8", color: "#fff", border: "#0EC4B8", fw: 800 },
            available: { bg: "rgba(14,196,184,0.10)", color: "#0EC4B8", border: "rgba(14,196,184,0.35)", fw: 700 },
            pickable:  { bg: "#fff", color: "#1A1A18", border: "rgba(26,26,24,0.12)", fw: 500 },
            full:      { bg: "rgba(232,58,58,0.06)", color: "rgba(232,58,58,0.55)", border: "rgba(232,58,58,0.15)", fw: 500, strike: true },
            muted:     { bg: "transparent", color: "rgba(26,26,24,0.20)", border: "transparent", fw: 400 },
            disabled:  { bg: "transparent", color: "rgba(26,26,24,0.16)", border: "transparent", fw: 400 },
          }[state];

          return (
            <button
              key={iso}
              type="button"
              disabled={!clickable}
              title={state === "full" ? "Ausgebucht" : undefined}
              onClick={() => {
                if (!clickable) return;
                if (mode === "edit") onToggleDate(iso);
                else onSelectDate(iso);
              }}
              style={{
                aspectRatio: "1", borderRadius: 9, border: `1.5px solid ${styles.border}`,
                background: styles.bg, color: styles.color, fontWeight: styles.fw,
                fontSize: 12.5, cursor: clickable ? "pointer" : "default",
                touchAction: "manipulation", textDecoration: styles.strike ? "line-through" : "none",
                padding: 0,
              }}
            >
              {d}
            </button>
          );
        })}
      </div>

      {mode === "book" && (
        <div style={{ display: "flex", gap: 12, marginTop: 10, flexWrap: "wrap" }}>
          <Legend swatch="rgba(14,196,184,0.10)" border="rgba(14,196,184,0.35)" label="Verfügbar" />
          <Legend swatch="rgba(232,58,58,0.06)" border="rgba(232,58,58,0.15)" label="Ausgebucht" />
        </div>
      )}
    </div>
  );
}

function Legend({ swatch, border, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <span style={{ width: 11, height: 11, borderRadius: 4, background: swatch, border: `1.5px solid ${border}` }} />
      <span style={{ fontSize: 11, color: "rgba(26,26,24,0.45)" }}>{label}</span>
    </div>
  );
}
