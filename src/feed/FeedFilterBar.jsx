// src/feed/FeedFilterBar.jsx
// ─────────────────────────────────────────────────────────────────
// FEED-FILTERBAR — Michael-Auftrag (2026-08-12, 07:40)
// "lass uns in diesem Zwischenraum mit etwas Abstand zum ersten Post
//  jeweils eine Filter Einstellungsleiste einbauen, damit man nach
//  Datum Ort Werke Momente Talente usw filtern kann. mach Mal was —
//  vielleicht entfernen wir es auch wieder."
//
// EXPERIMENTELL — bewusst als eigenständige, leicht entfernbare
// Komponente gebaut (ein Import + eine Render-Zeile in UnifiedFeed.jsx,
// ein zusätzlicher useMemo-Filterschritt). Kein Eingriff in bestehende
// Architektur (SearchCommandCenter/kiMode bleiben unverändert) — reine
// Erweiterung ("Erweitern statt duplizieren", Prinzip 1).
//
// Sitzt im "Zwischenraum" zwischen FeedWelcomeHeader ("Heute auf HUI"-
// Stats-Kachel) und dem ersten Feed-Post. Rein clientseitig, filtert
// die bereits geladenen Feed-Items (keine neuen Backend-Calls, keine
// Performance-Kosten — Prinzip 4).
//
// Filter:
//  - Inhaltstyp-Chips: Alle · Werke · Momente · Erlebnisse · Talente
//  - Ort: Freitext-Filter auf item.location (Substring-Match)
//  - Datum: Neueste zuerst (Standard) / Älteste zuerst
//
// Design-Tokens 1:1 aus FeedWelcomeHeader übernommen (kein neues
// Farbschema erfunden — Prinzip 2, Design System First).
// ─────────────────────────────────────────────────────────────────
import { useState, useRef, useEffect } from "react";

const TEAL   = "#0DC4B5";
const INK    = "#141422";
const MUTED  = "rgba(20,20,34,0.50)";
const BORDER = "rgba(13,196,181,0.12)";

const TYPE_CHIPS = [
  { key: null,         label: "Alle",        icon: "✨" },
  { key: "work",       label: "Werke",       icon: "🌿" },
  { key: "moment",     label: "Momente",     icon: "💬" },
  { key: "experience", label: "Erlebnisse",  icon: "🗓️" },
  { key: "talent",     label: "Talente",     icon: "⭐" },
];

export default function FeedFilterBar({
  typeFilter, onTypeFilterChange,
  locationQuery, onLocationQueryChange,
  sort, onSortChange,
  resultCount = null,
  onReset,
}) {
  const [locationOpen, setLocationOpen] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (locationOpen) inputRef.current?.focus();
  }, [locationOpen]);

  const hasActiveFilter = !!typeFilter || !!locationQuery?.trim() || sort === "oldest";

  return (
    <div style={{
      paddingLeft: 16, paddingRight: 16,
      marginBottom: 14,
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        overflowX: "auto", WebkitOverflowScrolling: "touch",
        scrollbarWidth: "none", paddingBottom: 2,
      }} className="ffb-scroll">

        {/* ── Inhaltstyp-Chips ─────────────────────────────────── */}
        {TYPE_CHIPS.map((c) => {
          const active = typeFilter === c.key;
          return (
            <button
              key={c.label}
              className="ffb-chip"
              onClick={() => onTypeFilterChange(c.key)}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                flexShrink: 0,
                padding: "7px 12px",
                borderRadius: 99,
                border: active ? "none" : `1px solid ${BORDER}`,
                background: active ? TEAL : "rgba(255,255,255,0.7)",
                color: active ? "#fff" : INK,
                fontSize: 12, fontWeight: 600,
                letterSpacing: -0.1,
                cursor: "pointer",
                WebkitTapHighlightColor: "transparent",
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ fontSize: 12 }}>{c.icon}</span>
              {c.label}
            </button>
          );
        })}

        {/* ── Trenner ──────────────────────────────────────────── */}
        <div style={{ width: 1, height: 18, background: BORDER, flexShrink: 0, margin: "0 2px" }} />

        {/* ── Ort-Filter (Toggle-Button + Input) ──────────────── */}
        {!locationOpen ? (
          <button
            className="ffb-chip"
            onClick={() => setLocationOpen(true)}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              flexShrink: 0,
              padding: "7px 12px",
              borderRadius: 99,
              border: locationQuery?.trim() ? "none" : `1px solid ${BORDER}`,
              background: locationQuery?.trim() ? TEAL : "rgba(255,255,255,0.7)",
              color: locationQuery?.trim() ? "#fff" : INK,
              fontSize: 12, fontWeight: 600,
              cursor: "pointer",
              WebkitTapHighlightColor: "transparent",
              whiteSpace: "nowrap",
            }}
          >
            📍 {locationQuery?.trim() ? locationQuery : "Ort"}
          </button>
        ) : (
          <div style={{
            display: "flex", alignItems: "center", gap: 4,
            flexShrink: 0,
            background: "rgba(255,255,255,0.85)",
            border: `1px solid ${TEAL}`,
            borderRadius: 99,
            padding: "4px 6px 4px 12px",
          }}>
            <span style={{ fontSize: 12 }}>📍</span>
            <input
              ref={inputRef}
              value={locationQuery}
              onChange={(e) => onLocationQueryChange(e.target.value)}
              onBlur={() => { if (!locationQuery?.trim()) setLocationOpen(false); }}
              placeholder="Ort eingeben…"
              style={{
                border: "none", outline: "none", background: "transparent",
                fontSize: 12.5, fontWeight: 500, color: INK,
                width: 100, fontFamily: "inherit",
              }}
            />
            <button
              onClick={() => { onLocationQueryChange(""); setLocationOpen(false); }}
              style={{
                border: "none", background: "rgba(20,20,34,0.08)",
                borderRadius: "50%", width: 20, height: 20,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, color: MUTED, cursor: "pointer", flexShrink: 0,
                WebkitTapHighlightColor: "transparent",
              }}
            >✕</button>
          </div>
        )}

        {/* ── Datum-Sortierung ─────────────────────────────────── */}
        <button
          className="ffb-chip"
          onClick={() => onSortChange(sort === "newest" ? "oldest" : "newest")}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            flexShrink: 0,
            padding: "7px 12px",
            borderRadius: 99,
            border: sort === "oldest" ? "none" : `1px solid ${BORDER}`,
            background: sort === "oldest" ? TEAL : "rgba(255,255,255,0.7)",
            color: sort === "oldest" ? "#fff" : INK,
            fontSize: 12, fontWeight: 600,
            cursor: "pointer",
            WebkitTapHighlightColor: "transparent",
            whiteSpace: "nowrap",
          }}
        >
          🗓️ {sort === "oldest" ? "Älteste" : "Neueste"}
        </button>

        {/* ── Reset ────────────────────────────────────────────── */}
        {hasActiveFilter && (
          <button
            onClick={onReset}
            style={{
              flexShrink: 0, border: "none", background: "none",
              color: MUTED, fontSize: 12, fontWeight: 600,
              padding: "7px 8px", cursor: "pointer",
              WebkitTapHighlightColor: "transparent",
              textDecoration: "underline",
            }}
          >
            Zurücksetzen
          </button>
        )}
      </div>

      {/* ── Ergebnis-Zähler bei aktivem Filter ──────────────────── */}
      {hasActiveFilter && resultCount !== null && (
        <div style={{ fontSize: 11.5, color: MUTED, marginTop: 6, paddingLeft: 2 }}>
          {resultCount} {resultCount === 1 ? "Ergebnis" : "Ergebnisse"}
        </div>
      )}

      <style>{`
        .ffb-scroll::-webkit-scrollbar { display: none; }
        .ffb-chip { transition: transform .13s ease, opacity .13s ease; }
        .ffb-chip:active { transform: scale(0.96); opacity: 0.85; }
      `}</style>
    </div>
  );
}
