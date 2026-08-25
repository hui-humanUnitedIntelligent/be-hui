// src/components/discover/DiscoverTitleBar.jsx
// Extracted from DiscoverPage.jsx — no logic changes.
import React from "react";
import { T } from "./constants.js";

export function DiscoverTitleBar() {
  return (
    <div style={{
      padding:`12px ${T.px}px 14px`,
      background:T.bg,
    }}>
      {/* Title Row */}
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ fontSize:22, fontWeight: 600, color:T.ink, letterSpacing:"-0.04em" }}>Entdecke HUI</span>
      </div>
      <div style={{ fontSize:12.5, color:T.inkFaint, marginTop:2, fontWeight:400 }}>
        Menschen, Ideen, Werke und Erlebnisse — alles auf einen Blick.
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 1b. LIVETICKER — "Jetzt auf HUI"
// ════════════════════════════════════════════════════════════════
// LIVETICKER.1 (2026-07-08, Lars): Die alte, komplett hartcodierte
// LiveActivityBar/ActivityCard-Karte (Fake-Namen, Unsplash-Bilder,
// erfundene "vor X Min"-Zeitstempel) wurde ersatzlos entfernt und durch
// die appweit geteilte <HuiLiveTicker/>-Komponente ersetzt (siehe
// src/components/shared/HuiLiveTicker.jsx + useLiveTicker-Hook). Zeigt
// jetzt ausschliesslich echte, live aus der DB geladene Ereignisse.
// Dieselbe Komponente ist auch im Entdecken-Tab (Home.jsx) eingehaengt --
// EIN Liveticker, eine Datenquelle, zwei Anzeigeorte (siehe
// LiveTickerContext.jsx fuer die geteilte Instanz).

// ════════════════════════════════════════════════════════════════
// HOME.2 (2026-07-08, Lars): Der komplette "Heute auf HUI entdecken"-
// Statistik-Kachel-Bereich (TodayStats/STAT_DEFS: neue Momente/Begegnungen/
// Werke/aktive Erlebnisse/neue Projekte/"Deine Aktivität") wurde ersatzlos
// entfernt. Home soll ein ruhiger, inspirierender persoenlicher Startpunkt
// sein, kein Statistik-Cockpit. Die dazugehoerige Datenabfrage (3 Supabase
// Count-Queries fuer Momente/Werke/Erlebnisse, siehe frueher weiter unten
// im Loading-Effect) wurde mitentfernt, da sie ausschliesslich fuer diese
// Kacheln existierte -- keine anderen Verbraucher (Performance-Pflicht:
// keine toten Queries).
// ════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════
// 3. MENSCHEN ENTDECKEN
// ════════════════════════════════════════════════════════════════
// SEED_PEOPLE entfernt — war Dead Code (nie referenziert).

// (Fake-Interesse-Tags entfernt 2026-08-06 — INTEREST_POOLS/personTags waren erfundene
//  Platzhalter-Tags, deterministisch aus dem Namen gehasht. Keine echten Nutzerdaten.
//  dna_tags/skills sind nicht im Identity Contract v1.0 enthalten.)

