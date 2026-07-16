// src/feed/feedRhythmEngine.js
// ═══════════════════════════════════════════════════════════════════════
// HUI — FEED RHYTHM ENGINE  (Phase 4D)
// ═══════════════════════════════════════════════════════════════════════
//
// Der Feed ist keine Datenliste.
// Der Feed ist eine emotionale Landschaft.
//
// Diese Engine entscheidet: Reihenfolge · Abstand · Energie-Balance
// Input:  normalisierte Feed-Items (aus feedNormalizer)
// Output: rhythmisiertes Array + marginBottom pro Item
//
// KERN-REGELN:
//  R1  Nie gleicher Typ 3× hintereinander
//  R2  Nach high-energy (Experience, big Work) → immer low-energy (Moment)
//  R3  Moments als emotionale Übergänge — stabilisieren den Flow
//  R4  Invitations max. 1 pro 5 Elemente
//  R5  Works max. 2 hintereinander
//  R6  Dominant Experiences max. alle 4–5 Positionen
//  R7  Am Anfang: 1 Moment vor erster Experience (sanfter Einstieg)
// ═══════════════════════════════════════════════════════════════════════

"use strict";

/* ── Energy Score ────────────────────────────────────────────────────── */
const ENERGY = {
  moment:     0,   // low   — ruhig, intim
  note:       0,   // low   — synonym
  invitation: 1,   // medium — sozial, warm
  work:       2,   // medium/high — visuell
  experience: 3,   // high  — dominant, cinematic
};

function energyOf(item) {
  const ct = resolveContentType(item);
  return ENERGY[ct] ?? 1;
}

/* ── Content Type Resolution ──────────────────────────────────────────── */
export function resolveContentType(item) {
  const raw = (
    item?.content_type ||
    item?.type         ||
    item?._raw?.type   ||
    item?._raw?.content_type ||
    ""
  ).toLowerCase();

  if (raw === "experience" || raw === "erlebnis" || raw === "event" ||
      raw === "workshop"   || raw === "session"  || raw === "retreat") return "experience";
  if (raw === "work"       || raw === "werk"     || raw === "work_upload" ||
      raw === "kunstwerk"  || raw === "design"   || raw === "handwerk")   return "work";
  if (raw === "invitation" || raw === "einladung") return "invitation";
  // Alles andere: Moment
  return "moment";
}

/* ── Spacing per Übergang (vorheriger → aktueller Typ) ───────────────── */
const SPACING = {
  // [nach-Typ][vor-Typ]  → marginBottom in px
  experience: { experience: 34, work: 28, invitation: 24, moment: 16 },
  work:       { experience: 28, work: 14, invitation: 18, moment: 12 },
  invitation: { experience: 20, work: 16, invitation: 14, moment: 10 },
  moment:     { experience: 14, work: 12, invitation: 10, moment:  8 },
};

function spacingAfter(currentType, nextType) {
  // Welcher Abstand kommt NACH der aktuellen Card?
  return (SPACING[nextType]?.[currentType]) ?? 12;
}

/* ── Validator: Darf item an dieser Position stehen? ─────────────────── */
function isAllowed(item, placed) {
  const type   = resolveContentType(item);
  const len    = placed.length;
  if (len === 0) return true;

  const prev1  = len >= 1 ? resolveContentType(placed[len - 1]) : null;
  const prev2  = len >= 2 ? resolveContentType(placed[len - 2]) : null;
  const prev3  = len >= 3 ? resolveContentType(placed[len - 3]) : null;

  // R1: Nie 3× gleicher Typ hintereinander
  if (type === prev1 && type === prev2) return false;

  // R2: Nach high-energy (Experience) → kein weiteres high-energy (nur Moment/Invitation/Work)
  // Work (energy=2) nach Experience ist als Übergangskarte erlaubt
  if (energyOf(placed[len - 1]) >= 3 && energyOf(item) >= 3) return false;  // Nie Exp→Exp direkt

  // R5: Works max. 2× hintereinander
  if (type === "work" && prev1 === "work" && prev2 === "work") return false;

  // R4: Invitation max. 1 pro 4 Elemente — mind. 4 andere Cards seit letzter Invitation
  if (type === "invitation") {
    const lastInvIdx = [...placed].reverse().findIndex(p => resolveContentType(p) === "invitation");
    if (lastInvIdx !== -1 && lastInvIdx <= 3) return false;
  }

  // R6: Experience mind. alle 3 Positionen (mind. 2 andere dazwischen)
  if (type === "experience") {
    const lastIdx = [...placed].reverse().findIndex(p => resolveContentType(p) === "experience");
    if (lastIdx !== -1 && lastIdx <= 1) return false; // weniger als 2 andere seit letzter Experience
  }

  return true;
}

/* ── Hauptfunktion: rhythmizeFeed ────────────────────────────────────── */
// Erstellt einen Ghost-Separator (leere Atmungs-Karte)
function createGhostMoment(idx) {
  return {
    id:           `__ghost_${idx}`,
    content_type: "moment",
    _isGhost:     true,   // für UI: Spacer-Karte
    _raw:         {},
  };
}

export function rhythmizeFeed(rawItems) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) return [];

  // Sichere Kopie (nie original mutieren)
  const items = rawItems.filter(Boolean).map(item => ({ ...item }));

  // Ghost-Padding: sicherstellen dass genug nicht-Invitation Items vorhanden sind
  const heavyCount  = items.filter(i => { const ct=resolveContentType(i); return ct==="experience"||ct==="work"; }).length;
  const momentCount = items.filter(i => resolveContentType(i) === "moment").length;
  const invCount    = items.filter(i => resolveContentType(i) === "invitation").length;
  const nonInvCount = heavyCount + momentCount;

  // Regel 1: mind. 1 Moment pro 2 Heavy-Items
  const neededForHeavy = Math.max(0, Math.ceil(heavyCount / 2) - momentCount);
  // Regel 2: für jedes Paar Invitations → garantiert 1 Ghost-Separator dazwischen
  // Stellt sicher dass nie Inv→Inv direkt im Safety-Valve-Fallback erzwungen wird
  const neededForInv = invCount > 1 ? (invCount - 1) : 0;  // mind. (N-1) Ghosts für N Invitations
  const neededMoments = Math.max(neededForHeavy, neededForInv);
  for (let g = 0; g < neededMoments; g++) {
    items.push(createGhostMoment(g));
  }

  // R7: Mindestens 1 Moment am Anfang (sanfter Einstieg)
  // — stelle sicher dass item[0] oder item[1] ein Moment ist
  const firstExp = items.findIndex(i => resolveContentType(i) === "experience");
  if (firstExp === 0 && items.length > 1) {
    // Suche ersten Moment und stelle ihn voran
    const firstMoment = items.findIndex(i => resolveContentType(i) === "moment");
    if (firstMoment > 0) {
      const [m] = items.splice(firstMoment, 1);
      items.unshift(m);
    }
  }

  // Queues pro Typ (in Originalreihenfolge)
  const queues = {
    moment:     items.filter(i => resolveContentType(i) === "moment"),
    experience: items.filter(i => resolveContentType(i) === "experience"),
    work:       items.filter(i => resolveContentType(i) === "work"),
    invitation: items.filter(i => resolveContentType(i) === "invitation"),
  };
  const cursors = { moment: 0, experience: 0, work: 0, invitation: 0 };

  const placed    = [];
  const maxIter   = items.length * 8;
  let   iter      = 0;
  let   placed0   = 0;

  // Versuche jedes Item optimal zu platzieren
  while (placed.length < items.length && iter < maxIter) {
    iter++;

    // Prioritätsliste: welcher Typ darf jetzt?
    // Wenn letzter Typ high-energy → Moment zuerst versuchen
    const lastPlaced   = placed[placed.length - 1];
    const lastEnergy   = lastPlaced ? energyOf(lastPlaced) : 0;
    const lastType     = lastPlaced ? resolveContentType(lastPlaced) : null;

    let typePriority;
    if (lastEnergy >= 3) {
      // Nach Experience → Moment zuerst, dann Work, dann Invitation
      typePriority = ["moment", "work", "invitation", "experience"];
    } else if (lastType === "work") {
      // Nach Work → variieren
      typePriority = ["moment", "experience", "invitation", "work"];
    } else if (lastType === "moment") {
      // Nach Moment → aufbauen
      typePriority = ["experience", "work", "invitation", "moment"];
    } else if (lastType === "invitation") {
      // Nach Invitation → etwas Substantielles
      typePriority = ["moment", "work", "experience", "invitation"];
    } else {
      // Start / unbekannt
      typePriority = ["moment", "experience", "work", "invitation"];
    }

    let placed1 = false;
    for (const type of typePriority) {
      const q   = queues[type];
      const cur = cursors[type];
      if (cur >= q.length) continue;          // Queue erschöpft
      const candidate = q[cur];
      if (isAllowed(candidate, placed)) {
        placed.push(candidate);
        cursors[type]++;
        placed1 = true;
        break;
      }
    }

    // Safety: kein Fortschritt → Deadlock brechen
    // Stufe 1: Mindest-Regeln (R4+R6) behalten, R1/R2/R5 aufweichen
    if (!placed1) {
      for (const type of ["moment", "work", "experience", "invitation"]) {
        const q   = queues[type];
        const cur = cursors[type];
        if (cur >= q.length) continue;
        const candidate = q[cur];
        const ct = resolveContentType(candidate);
        // Stufe 1: nur R4 und R6 strikt halten
        let ok = true;
        // R4: Invitation spacing
        if (ct === "invitation") {
          const lastInvIdx = [...placed].reverse().findIndex(p => resolveContentType(p) === "invitation");
          if (lastInvIdx !== -1 && lastInvIdx === 0) ok = false;  // Safety: nie direkt hintereinander
        }
        // R6: Experience spacing Safety-lockerer (nur 1 andere dazwischen)
        if (ct === "experience") {
          const lastExpIdx = [...placed].reverse().findIndex(p => resolveContentType(p) === "experience");
          if (lastExpIdx !== -1 && lastExpIdx === 0) ok = false;  // Safety: nur direkte Nachfolger blockiert
        }
        if (ok) {
          placed.push(candidate);
          cursors[type]++;
          placed1 = true;
          break;
        }
      }
    }
    // Stufe 2: Absoluter Fallback — nimm irgendetwas AUSSER direkte Inv→Inv
    if (!placed1) {
      // Zuerst alles außer Invitation versuchen
      for (const type of ["moment", "work", "experience", "invitation"]) {
        const q = queues[type];
        if (cursors[type] >= q.length) continue;
        // Harte Grenze: Invitation nie direkt nach Invitation (auch im letzten Fallback)
        const ct = resolveContentType(q[cursors[type]]);
        if (ct === "invitation") {
          const lastType = placed.length > 0 ? resolveContentType(placed[placed.length - 1]) : null;
          if (lastType === "invitation") continue;  // überspringen
        }
        placed.push(q[cursors[type]]);
        cursors[type]++;
        placed1 = true;
        break;
      }
    }
    // Stufe 3: Wirklich letzter Ausweg (alle anderen Typen erschöpft)
    if (!placed1) {
      for (const type of ["invitation", "moment", "work", "experience"]) {
        const q = queues[type];
        if (cursors[type] < q.length) {
          placed.push(q[cursors[type]]);
          cursors[type]++;
          placed1 = true;
          break;
        }
      }
    }

    // Endlos-Schutz
    if (!placed1) break;
  }

  // ── Spacing annotieren ────────────────────────────────────────────────
  const result = placed.map((item, idx) => {
    const thisType = resolveContentType(item);
    const nextType = idx < placed.length - 1
      ? resolveContentType(placed[idx + 1])
      : "moment";
    return {
      ...item,
      _rhythm: {
        position:     idx,
        contentType:  thisType,
        energyScore:  energyOf(item),
        marginBottom: spacingAfter(thisType, nextType),
      },
    };
  });


  // ── POST-PROCESSING: Harte Garantie — nie Invitation direkt nach Invitation ──
  // Falls Safety-Valve-Fallback es trotzdem erzwingt → Ghost-Separator einschleusen
  let ghostPostIdx = 9000;
  for (let i = result.length - 1; i >= 1; i--) {
    if (
      result[i]?._rhythm?.contentType === "invitation" &&
      result[i - 1]?._rhythm?.contentType === "invitation"
    ) {
      const ghost = createGhostMoment(ghostPostIdx++);
      ghost._rhythm = {
        position:     i,
        contentType:  "moment",
        energyScore:  0,
        marginBottom: 8,
      };
      result.splice(i, 0, ghost);
    }
  }

  return result;
}

/* ── FeedRouter Spacing Helper (genutzt von FeedRouter.jsx) ──────────── */
export function getRhythmMargin(item) {
  return item?._rhythm?.marginBottom ?? 12;
}

/* ── Energie-Label für Dev-Overlay ────────────────────────────────────── */
export function getEnergyLabel(item) {
  const e = item?._rhythm?.energyScore ?? 0;
  if (e >= 3) return { label: "high",   color: "#FF8A6B" };
  if (e >= 2) return { label: "medium", color: "#38BDF8" };
  return            { label: "low",    color: "#0ABFB8" };
}