// src/lib/talentAvailability.js
// ══════════════════════════════════════════════════════════════════════
// TALENT-BOOKING-RECURRING-001 (2026-08-08)
// SSOT für die Umrechnung der vom Anbieter im TalentAngebotWizard (Schritt 4)
// gewählten Verfügbarkeits-Konfiguration (available_dates + recurring) in
// die tatsächlich konkret buchbaren ISO-Datumswerte innerhalb eines
// Buchungsfensters. Wird von TalentBookingFlow.jsx (Kunden-Kalender) genutzt.
// Die serverseitige RPC rpc_get_talent_month_availability (Migration
// 20260808_084) implementiert dieselbe Erweiterungslogik in SQL, damit
// Belegungs-/Ausgebucht-Status auch für hochgerechnete Wiederholungstage
// korrekt berechnet wird — EIN Regelwerk, zwei Laufzeiten.
//
// Hintergrund-Bug (2026-08-08, Screenshot Michael): Ein Anbieter wählte im
// Kalender NUR den 8. August als Termin UND setzte "Wiederholung: Monatlich".
// Das Feld `recurring` wurde zwar gespeichert, aber NIRGENDS in der
// Buchungslogik ausgewertet — available_dates blieb ["2026-08-08"], ein
// einzelnes Datum. Je nach Lesepfad (manche Talent-Listen selektierten
// available_dates/recurring gar nicht aus der DB) fiel die Buchungsansicht
// dadurch in den "free"-Modus (jeder Tag buchbar) ODER zeigte NUR den
// 8. August als buchbar an (alle folgenden Monate komplett gesperrt) —
// beides widerspricht der Absicht des Anbieters ("jeden Monat am 8.").
//
// Fix: available_dates gilt bei gesetztem `recurring` nicht mehr als
// Literal-Liste, sondern als Menge von "Anker"-Tagen, die auf das gewählte
// Muster (wöchentlich/monatlich) für jedes Monat/jede Woche im
// Buchungsfenster hochgerechnet werden.
// ══════════════════════════════════════════════════════════════════════

const WEEKDAY_NAMES = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

export function isoFromParts(year, monthIndex0, day) {
  return `${year}-${String(monthIndex0 + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function todayIsoLocal() {
  const d = new Date();
  return isoFromParts(d.getFullYear(), d.getMonth(), d.getDate());
}

function parseIsoLocal(iso) {
  const parts = String(iso || "").split("-").map(Number);
  if (parts.length !== 3 || parts.some(n => Number.isNaN(n))) return null;
  const [y, m, d] = parts;
  return new Date(y, m - 1, d); // lokale Zeit, kein UTC-Tagesversatz
}

/**
 * Erweitert die rohen Anker-Termine eines Talent-Angebots (available_dates)
 * anhand des gewählten Wiederholungsmusters (recurring) zu allen konkret
 * buchbaren ISO-Daten innerhalb [windowStart, windowEnd].
 *
 * - recurring leer/"einmalig": available_dates gilt 1:1 (unverändertes
 *   Verhalten wie vor diesem Fix).
 * - recurring="weekly": für jeden Anker-Tag wird derselbe Wochentag in
 *   jeder Woche des Fensters erzeugt.
 * - recurring="monthly": für jeden Anker-Tag wird derselbe Tag-im-Monat in
 *   jedem Monat des Fensters erzeugt (Monate ohne diesen Tag, z.B. der 31.
 *   im Februar, werden übersprungen — kein Rollover auf den Folgemonat).
 *
 * Ohne Anker-Termine (available_dates leer) → leeres Ergebnis, unabhängig
 * vom recurring-Wert (ein "wiederkehrend" ohne Tag-Auswahl ist eine
 * unvollständige Konfiguration und macht bewusst NICHTS buchbar, statt
 * einen falschen Tag zu raten — "keine Ausführung ohne Validierung").
 */
export function expandTalentAvailableDates(talent, { windowStart, windowEnd } = {}) {
  const anchors = Array.isArray(talent?.available_dates) ? talent.available_dates.filter(Boolean) : [];
  if (!anchors.length) return [];

  const recurring = talent?.recurring || "";
  if (!recurring) return [...new Set(anchors)].sort();

  const today = todayIsoLocal();
  const start = windowStart && windowStart > today ? windowStart : today;
  const now = new Date();
  const end = windowEnd || isoFromParts(now.getFullYear() + 1, now.getMonth(), now.getDate());
  const startDate = parseIsoLocal(start);
  const endDate = parseIsoLocal(end);
  if (!startDate || !endDate || startDate > endDate) return [];

  const result = new Set();

  for (const anchorIso of anchors) {
    const anchor = parseIsoLocal(anchorIso);
    if (!anchor) continue;

    if (recurring === "weekly") {
      const weekday = anchor.getDay();
      const cur = new Date(startDate);
      while (cur.getDay() !== weekday) cur.setDate(cur.getDate() + 1);
      while (cur <= endDate) {
        result.add(isoFromParts(cur.getFullYear(), cur.getMonth(), cur.getDate()));
        cur.setDate(cur.getDate() + 7);
      }
    } else if (recurring === "monthly") {
      const dayOfMonth = anchor.getDate();
      let cursorY = startDate.getFullYear();
      let cursorM = startDate.getMonth();
      while (isoFromParts(cursorY, cursorM, 1) <= isoFromParts(endDate.getFullYear(), endDate.getMonth(), 1)) {
        const daysInMonth = new Date(cursorY, cursorM + 1, 0).getDate();
        if (dayOfMonth <= daysInMonth) {
          const candidateIso = isoFromParts(cursorY, cursorM, dayOfMonth);
          if (candidateIso >= start && candidateIso <= end) result.add(candidateIso);
        }
        cursorM += 1;
        if (cursorM > 11) { cursorM = 0; cursorY += 1; }
      }
    } else {
      // Unbekannter/zukünftiger recurring-Wert → sicherer Fallback: Anker literal
      if (anchorIso >= start && anchorIso <= end) result.add(anchorIso);
    }
  }

  return Array.from(result).sort();
}

/** Menschenlesbare Kurzbeschreibung des Wiederholungsmusters für die Buchungsansicht. */
export function describeRecurring(talent) {
  const anchors = Array.isArray(talent?.available_dates) ? talent.available_dates.filter(Boolean) : [];
  const recurring = talent?.recurring || "";
  if (!recurring || !anchors.length) return null;

  if (recurring === "weekly") {
    const weekdays = [...new Set(anchors.map(a => {
      const d = parseIsoLocal(a);
      return d ? WEEKDAY_NAMES[d.getDay()] : null;
    }).filter(Boolean))];
    if (!weekdays.length) return null;
    return `Wöchentlich wiederkehrend, jeden ${weekdays.join(" & ")}`;
  }
  if (recurring === "monthly") {
    const days = [...new Set(anchors.map(a => {
      const d = parseIsoLocal(a);
      return d ? d.getDate() : null;
    }).filter(Boolean))].sort((a, b) => a - b);
    if (!days.length) return null;
    return `Monatlich wiederkehrend, jeweils am ${days.join(". & ")}. des Monats`;
  }
  return null;
}

export const TALENT_LOCATION_LABELS = {
  online: "Online",
  vor_ort: "Vor Ort",
  hybrid: "Hybrid",
};

export function formatDuration(minutes) {
  const m = Number(minutes);
  if (!m || m <= 0) return null;
  if (m < 60) return `${m} Min.`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest === 0 ? `${h} Std.` : `${h} Std. ${rest} Min.`;
}
