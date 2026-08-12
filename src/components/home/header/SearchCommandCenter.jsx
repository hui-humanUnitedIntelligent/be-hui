// src/components/home/header/SearchCommandCenter.jsx
// HUI Discovery Center — Phase 3: "Von Daten zu Möglichkeiten"
// Weniger Zahlen. Mehr Menschen. Weniger Dashboard. Mehr HUI.
//
// Visual Polish Pass (2026-07-06, Lars) — "Apple/Notion/Linear-Niveau":
// reines Styling-Update, KEINE neue Komponente, KEINE neue Logik. Ziel:
// mehr Weissraum, weichere Bar, monochrome Filter, ruhige Animationen.
//
// "Alle Kategorien"-Feature (2026-07-06, Lars): vollstaendige Kategorien-
// Ansicht als Bottom-Sheet (kein neue Seite/Route). Kategorien-Datenquelle
// ist jetzt zentral in src/lib/categories.js (Single Source of Truth) --
// siehe Kommentar dort fuer die Governance-Pflichtanalyse (Bestand vor
// diesem Sprint: 3 verschiedene, inkonsistente hartcodierte Kategorie-Listen).
// Siehe Kommentar am Anfang der Hauptkomponente fuer weitere Architektur-Details.

import { HUILocationIcon } from '../../../design/icons/HuiSystemIcons.jsx';
import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal }          from "react-dom";
import { supabase }              from "../../../lib/supabaseClient.js";
import { FEATURED_CATEGORIES, searchCategories } from "../../../lib/categories.js";
import { NAV_RESERVED_HEIGHT_CSS } from "../navigation/navigationGeometry.js";
import { useRadiusFilter, radiusLabel } from "../../../hooks/useRadiusFilter.js";
import { useModalRegistration } from "../../../hooks/useModalRegistration.js";
import { useContentPreview } from "../../../context/ContentPreviewContext.jsx";
import { fetchSearchSuggestions, highlightMatch, hasAnySuggestions, SUGGESTIONS_MIN_QUERY_LEN } from "../../../lib/searchSuggestions.js";

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────
const T = {
  teal:   "#0EC4B8",
  tealS:  "rgba(14,196,184,0.06)",
  tealM:  "rgba(14,196,184,0.14)",
  ink:    "#1A3530",
  inkS:   "rgba(26,53,48,0.50)",
  inkF:   "rgba(26,53,48,0.28)",
  inkFF:  "rgba(26,53,48,0.18)",   // sehr helle, sekundaere Ebene (Punkt 9)
  bg:     "rgba(255,253,251,0.97)",
  // Bar-Schatten: ruhig im Rest-Zustand, sanfter Glow bei Fokus (Punkt 2)
  shadowRest:  "0 1px 2px rgba(26,53,48,0.04), 0 6px 18px rgba(26,53,48,0.05)",
  shadowFocus: "0 2px 8px rgba(14,196,184,0.12), 0 12px 32px rgba(14,196,184,0.16), 0 0 0 3px rgba(14,196,184,0.09)",
  // Panel-Schatten: schwebt frei, kein harter Rahmen (Punkt 7)
  panelShadow: "0 10px 34px rgba(26,53,48,0.09), 0 2px 10px rgba(26,53,48,0.045)",
};

// ─────────────────────────────────────────────────────────────
// KONSTANTEN
// ─────────────────────────────────────────────────────────────
// KI-SUGGESTIONS — 2026-08-12, Michael-Auftrag: Jeder Satz hat jetzt
// eine echte action (statt nur query-Text zu setzen). Die action steuert
// gezielt typeFilter, categories, radius und query, sodass der Feed direkt
// die richtigen Inhalte zeigt.
//   action: "people"    -> typeFilter=null, query="" (Feed zeigt alles, aber
//                          Live-Vorschlaege fokussieren Personen via KI-Text)
//   action: "nearby"     -> aktiviert Standort + kleiner Radius + Werke
//   action: "match"      -> typeFilter=null, query="" (Künftige Matching-Logik)
//   action: "help"       -> typeFilter="experience" (Erlebnisse wo Hilfe nötig)
//   action: "events"     -> typeFilter="experience" (Veranstaltungen)
//   action: "discover"   -> typeFilter=null, query="" (Top Menschen, breit)
const KI_SUGGESTIONS = [
  { text:"Ich suche kreative Menschen",        emoji:"👥", action:"people"   },
  { text:"Projekte in meiner Nähe",            emoji:"📍", action:"nearby"   },
  { text:"Wer passt zu meinem Profil?",        emoji:"🔮", action:"match"    },
  { text:"Wo kann ich heute helfen?",          emoji:"🤝", action:"help"     },
  { text:"Veranstaltungen die zu mir passen",  emoji:"📅", action:"events"   },
  { text:"Welche Menschen sollte ich kennen?", emoji:"✨", action:"discover" },
];

// ─────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────
function useDebounce(v, d) {
  const [val, setVal] = useState(v);
  useEffect(() => {
    const t = setTimeout(() => setVal(v), d);
    return () => clearTimeout(t);
  }, [v, d]);
  return val;
}

// ─────────────────────────────────────────────────────────────
// MICRO-COMPONENTS
// ─────────────────────────────────────────────────────────────
function SectionLabel({ children, color, action, onAction }) {
  return (
    <div style={{
      display:"flex", alignItems:"center", justifyContent:"space-between",
      marginBottom: 10,
    }}>
      <div style={{
        fontSize: 10, fontWeight: 600, letterSpacing: ".08em",
        textTransform: "uppercase", color: color || T.inkFF,
      }}>{children}</div>
      {action && (
        <button onClick={onAction} style={{
          background:"none", border:"none", cursor:"pointer",
          fontSize: 10.5, color: T.inkF, fontWeight: 600, padding: 0,
        }}>{action}</button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// UMKREISSUCHE (2026-07-06, Lars) — RadiusRow
// Horizontal scrollbare Pill-Reihe: Standort-Chip + 9 Radius-Stufen
// (1/5/10/25/50/100/250/500 km + Weltweit). Gleiche Optik wie die
// Kategorien-/Filter-Pills (dc-tag), damit sich der Umkreisregler wie
// ein natuerlicher Teil der bestehenden Suchoberflaeche anfuehlt und
// NICHT wie ein separates Feature (Vorgabe Lars, Punkt "Integration").
// Standortabfrage wird IMMER erst bei explizitem Tap ausgeloest, nie
// automatisch -- bei Ablehnung/Fehler erscheint sanft ein PLZ/Ort-Feld
// als Fallback (Vorgabe: "freundlich anfragen", manuelle Ortsauswahl).
// ─────────────────────────────────────────────────────────────
// PERSISTENTE RADIUS-ANZEIGE (2026-07-06, UX-Ticket "Radius ueberall sichtbar")
//
// Direkt unter der Suchleiste, IMMER sichtbar (auch wenn die Suche
// geschlossen ist -- nicht nur im aufgeklappten Discovery-Panel). Dezent,
// keine Box/kein Banner -- nur ein leiser Text-Hinweis, der genauso wirkt
// wie ein natuerlicher Zustandssatz ("das ist gerade dein Radius"), keine
// Statusmeldung.
//
// Aktualisiert sich automatisch: der Text kommt 1:1 aus radius.radiusKm/
// radius.geo (globaler Context) -- kein eigener State. Der key={label} auf
// dem Wrapper laesst React das Element bei jeder Aenderung neu mounten,
// wodurch die hui-search-fade-in-Animation automatisch erneut abspielt
// ("aktive Stufe weich animieren", ohne Flackern -- der Text selbst bleibt
// stabil sichtbar, nur ein sanftes Fade beim Wechsel).
function RadiusIndicator({ radius, activeFilterCount = 0, onFilterPillClick }) {
  const label = radius.isWorldwide
    ? "🌍 Weltweit"
    : `📍 ${radius.geo?.label || "In deiner Nähe"} · ${radiusLabel(radius.radiusKm)}`;

  // FILTER-ZÄHLER (2026-08-12, Michael-Auftrag) -- macht sichtbar, WARUM der
  // Feed gerade nur eine Teilmenge zeigt (z.B. nur Werke), auch wenn das
  // Discovery-Panel geschlossen ist und die Chips selbst nicht sichtbar sind.
  // Dezente Pill direkt neben dem Radius-Text, gleiche Zeile, kein Umbruch.
  // Klick auf die Pill öffnet das Discovery-Panel (Filter schnell erreichbar).
  return (
    <div key={label} style={{
      padding: "0 0 0 18px",
      display:"flex", alignItems:"center", gap:8, minWidth:0,
      animation: "hui-search-fade-in .22s cubic-bezier(.22,1,.36,1) both",
    }}>
      <span style={{
        fontSize: 11.5,
        fontWeight: 500,
        letterSpacing: "-0.01em",
        color: "rgba(26,53,48,0.40)",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}>
        {label}
      </span>
      {activeFilterCount > 0 && (
        <button
          onClick={onFilterPillClick}
          style={{
            flexShrink:0,
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: "-0.01em",
            color: T.teal,
            background: T.tealM,
            border: "1px solid rgba(14,196,184,0.30)",
            borderRadius: 99,
            padding: "2.5px 9px",
            whiteSpace: "nowrap",
            cursor: "pointer",
            WebkitTapHighlightColor: "transparent",
            transition: "transform .12s ease, box-shadow .12s ease",
          }}
          onTouchStart={e => { e.currentTarget.style.transform = "scale(0.94)"; }}
          onTouchEnd={e => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          {activeFilterCount} Filter aktiv
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
function RadiusRow({ radius }) {
  const [manualOpen,  setManualOpen]  = useState(false);
  const [manualQuery, setManualQuery] = useState("");

  // BUGFIX (2026-07-06, Lars-Ticket "Radius-Buttons ohne Funktion"): der
  // Button darf NIE auf die Geo-Antwort warten, bevor er aktiv wird und die
  // Suche neu laedt -- vorher blockierte hier ein await auf
  // requestBrowserLocation() (bis zu 8s Timeout) bzw. wurde bei Ablehnung/
  // Sperre (z.B. iPad/eingebetteter Webview ohne Geolocation-Erlaubnis) NIE
  // aufgeloest, wodurch setRadiusKm() gar nicht erreicht wurde -- fuer den
  // Nutzer sah der Tap dann komplett wirkungslos aus.
  // Neu: setRadiusKm() feuert SOFORT + synchron (macht den Button sofort aktiv
  // und stoesst ueber den State sofort einen Re-Fetch der Ergebnisse an, siehe
  // useFeedStream-Effekt auf radiusKm/geo). Die Standortermittlung laeuft
  // NUR noch nebenlaeufig im Hintergrund hinterher und verfeinert die bereits
  // sichtbaren Ergebnisse, sobald Koordinaten da sind (progressive
  // Verbesserung statt Blockierung).
  const handlePickRadius = (stage) => {
    radius.setRadiusKm(stage);
    if (stage !== "world" && !radius.geo) {
      radius.requestBrowserLocation().then(g => { if (!g) setManualOpen(true); });
    }
  };

  const handleLocationChipTap = async () => {
    if (radius.geo) { radius.clearLocation(); return; }
    const g = await radius.requestBrowserLocation();
    if (!g) setManualOpen(true);
  };

  const submitManual = async () => {
    if (!manualQuery.trim()) return;
    const g = await radius.setManualPlace(manualQuery.trim());
    if (g) { setManualOpen(false); setManualQuery(""); }
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{display:"flex",gap:7,overflowX:"auto",paddingBottom:2,WebkitOverflowScrolling:"touch",scrollbarWidth:"none"}} className="dc-scroll">
        <button className="dc-tag" onClick={handleLocationChipTap} style={{
          display:"flex",alignItems:"center",gap:5,flexShrink:0,
          background: radius.geo ? T.tealM : "rgba(26,53,48,0.035)",
          border:`1px solid ${radius.geo ? "rgba(14,196,184,0.30)" : "rgba(26,53,48,0.07)"}`,
          borderRadius:99,padding:"7px 13px",cursor:"pointer",
          fontSize:12,fontWeight:600,letterSpacing:"-0.01em",
          color: radius.geo ? T.teal : T.inkF, whiteSpace:"nowrap",
          WebkitTapHighlightColor:"transparent",
        }}>
          <HUILocationIcon size={12} style={{flexShrink:0, opacity:0.55}} />
          {radius.status === "requesting" ? "Suche…" : (radius.geo ? radius.geo.label : "Standort")}
        </button>
        {radius.stages.map(stage => {
          const active = radius.radiusKm === stage;
          return (
            <button key={String(stage)} className="dc-tag" onClick={()=>handlePickRadius(stage)} style={{
              flexShrink:0,
              background: active ? T.teal : "rgba(26,53,48,0.035)",
              border:`1px solid ${active ? T.teal : "rgba(26,53,48,0.07)"}`,
              borderRadius:99,padding:"7px 13px",cursor:"pointer",
              fontSize:11.5,fontWeight:600,letterSpacing:"-0.01em",
              color: active ? "#fff" : "rgba(26,53,48,0.62)",
              boxShadow: active ? "0 3px 10px rgba(14,196,184,0.26)" : "none",
              transition:"background .2s ease,border-color .2s ease,color .2s ease,box-shadow .2s ease",
              whiteSpace:"nowrap",
              WebkitTapHighlightColor:"transparent",
            }}>
              {radiusLabel(stage)}
            </button>
          );
        })}
      </div>
      {manualOpen && (
        <div style={{display:"flex",gap:6,marginTop:8,animation:"hui-search-fade-in .18s ease both"}}>
          <input
            value={manualQuery}
            onChange={e=>setManualQuery(e.target.value.slice(0,200))}
            onKeyDown={e=>{ if (e.key==="Enter") submitManual(); }}
            placeholder="PLZ oder Ort eingeben…"
            style={{
              flex:1, minWidth:0, border:"1px solid rgba(26,53,48,0.09)", borderRadius:99,
              padding:"7px 13px", fontSize:12, outline:"none", background:"rgba(26,53,48,0.02)",
              color:T.ink,
            }}
          />
          <button className="dc-tag" onClick={submitManual} style={{
            flexShrink:0, background:T.teal, color:"#fff", border:"none", borderRadius:99,
            padding:"7px 15px", fontSize:12, fontWeight:600, cursor:"pointer",
          }}>OK</button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// KI PANEL
// ─────────────────────────────────────────────────────────────
function KiPanel({ onSelect, onClose }) {
  return (
    <div style={{
      position:"absolute", top:"calc(100% + 8px)", right:0,
      width:264, zIndex:10,
      background:T.bg, backdropFilter:"blur(24px) saturate(1.5)", WebkitBackdropFilter:"blur(24px) saturate(1.5)",
      borderRadius:18, boxShadow:"0 12px 36px rgba(26,53,48,0.14), 0 2px 8px rgba(26,53,48,0.05)",
      border:"1px solid rgba(26,53,48,0.05)", overflow:"hidden",
      animation:"dc-in .2s cubic-bezier(.22,1,.36,1) both",
    }}>
      <div style={{
        padding:"13px 15px 10px",
        background:"linear-gradient(135deg,rgba(14,196,184,0.07),rgba(14,196,184,0.015))",
        borderBottom:"1px solid rgba(14,196,184,0.08)",
      }}>
        <div style={{ fontSize:12.5,fontWeight: 600,color:T.teal,marginBottom:2,letterSpacing:"-0.01em" }}>
          ✨ HUI KI kann dir helfen…
        </div>
        <div style={{ fontSize:10.5,color:T.inkF }}>Wähle einen Vorschlag</div>
      </div>
      <div style={{ padding:"8px 8px 10px" }}>
        {KI_SUGGESTIONS.map((s,i) => (
          <button key={i} className="dc-tag" onClick={()=>{onSelect(s);onClose();}} style={{
            display:"flex",alignItems:"center",gap:9,width:"100%",
            textAlign:"left",padding:"9px 11px",background:"none",border:"none",
            borderRadius:12,cursor:"pointer",WebkitTapHighlightColor:"transparent",
          }}
            onMouseEnter={e=>e.currentTarget.style.background="rgba(14,196,184,0.07)"}
            onMouseLeave={e=>e.currentTarget.style.background="none"}
          >
            <span style={{fontSize:14,flexShrink:0}}>{s.emoji}</span>
            <span style={{fontSize:12.5,fontWeight:500,color:T.ink,letterSpacing:"-0.01em"}}>{s.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ALLE-KATEGORIEN BOTTOM SHEET
// ─────────────────────────────────────────────────────────────
// Rendert per createPortal auf document.body -- ist ein reines Auswahl-UI
// (wie ein Picker/Dropdown), kein Ergebnis-Feed. Widerspricht NICHT der
// "kein Overlay/Portal mehr"-Architekturentscheidung von Search Experience
// 2.0 -- diese bezog sich ausschliesslich auf die SUCHERGEBNISSE (Feed),
// die weiterhin inline im normalen Feed erscheinen, nie in einem Overlay.
function AllCategoriesSheet({ sheetRef, phase, query, onQueryChange, onSelect, onClose, activeIds = [] }) {
  const results = searchCategories(query);
  const visible = phase === "visible";

  return createPortal(
    <div ref={sheetRef}>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position:"fixed", inset:0, zIndex:9990,
        background:"rgba(20,38,34,0.30)",
        opacity: visible ? 1 : 0,
        transition: phase === "leaving" ? "opacity .18s ease" : "opacity .22s ease",
      }} role="button" tabIndex={0} />

      {/* Sheet */}
      <div style={{
        position:"fixed", left:0, right:0, bottom:0, zIndex:9991,
        maxHeight:"90vh", display:"flex", flexDirection:"column",
        background:T.bg, backdropFilter:"blur(24px) saturate(1.4)", WebkitBackdropFilter:"blur(24px) saturate(1.4)",
        borderRadius:"24px 24px 0 0",
        boxShadow:"0 -12px 40px rgba(26,53,48,0.16)",
        transform: visible ? "translateY(0)" : "translateY(100%)",
        opacity: visible ? 1 : 0,
        transition: phase === "leaving"
          ? "transform .18s cubic-bezier(.22,1,.36,1), opacity .18s ease"
          : "transform .22s cubic-bezier(.22,1,.36,1), opacity .22s ease",
      }}>
        {/* Griff */}
        <div style={{ display:"flex", justifyContent:"center", padding:"10px 0 4px" }}>
          <div style={{ width:36, height:4, borderRadius:99, background:"rgba(26,53,48,0.14)" }}/>
        </div>

        {/* Header + eigenes Suchfeld -- "Suche innerhalb der Kategorien" */}
        <div style={{ padding:"6px 20px 14px", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
            <div style={{ fontSize:16.5, fontWeight: 600, color:T.ink, letterSpacing:"-0.01em" }}>Alle Kategorien</div>
            <button className="dc-tag" onClick={onClose} style={{
              width:28, height:28, borderRadius:"50%", background:"rgba(26,53,48,0.06)",
              border:"none", display:"flex", alignItems:"center", justifyContent:"center",
              cursor:"pointer", fontSize:12, color:T.inkS, fontWeight: 600,
            }}>✕</button>
          </div>
          <div style={{
            display:"flex", alignItems:"center", gap:8, height:38,
            background:"rgba(26,53,48,0.045)", borderRadius:14,
            padding:"0 12px",
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{flexShrink:0,opacity:.4}}>
              <circle cx="11" cy="11" r="7" stroke={T.teal} strokeWidth="1.7"/>
              <path d="M20 20L16.5 16.5" stroke={T.teal} strokeWidth="1.7" strokeLinecap="round"/>
            </svg>
            <input
              autoFocus={false}
              value={query}
              onChange={e=>onQueryChange(e.target.value.slice(0,200))}
              placeholder="Kategorien durchsuchen…"
              style={{
                flex:1, outline:"none", border:"none", background:"none",
                fontSize:13.5, fontWeight:500, letterSpacing:"-0.01em", color:T.ink,
              }}
            />
            {query && (
              <button className="dc-tag" onClick={()=>onQueryChange("")} style={{
                width:16, height:16, borderRadius:"50%", background:"rgba(26,53,48,0.10)",
                border:"none", display:"flex", alignItems:"center", justifyContent:"center",
                cursor:"pointer", fontSize:8, color:"rgba(26,53,48,0.55)", fontWeight: 600, flexShrink:0,
              }}>✕</button>
            )}
          </div>
        </div>

        {/* Grid -- dezent, modern, leicht (Vorgabe Lars) */}
        {/* Bottom-Padding = Safe-Area-Inset + HUI-Tabbar-Hoehe (beide aus der
            geteilten navigationGeometry-Quelle, KEIN fester Pixelwert) + 28px
            Zusatzluft -- die Tabbar liegt mit zIndex 10000 ueber diesem Sheet
            (zIndex 9991); ohne dieses Padding wuerde die letzte Kategorien-
            Reihe hinter der Tabbar verschwinden. Siehe Bugreport Lars 2026-07-06. */}
        <div style={{
          flex:"1 1 auto", minHeight:0, overflowY:"auto", WebkitOverflowScrolling:"touch",
          padding:`0 16px calc(${NAV_RESERVED_HEIGHT_CSS} + 28px)`,
        }}>
          {results.length === 0 ? (
            <div style={{ padding:"32px 8px", textAlign:"center", fontSize:13, color:T.inkF }}>
              Keine Kategorien für „{query}"
            </div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:10 }}>
              {results.map(cat => {
                const isActive = activeIds.includes(cat.id);
                return (
                  <button key={cat.id} className="dc-tag" onClick={()=>onSelect(cat)} style={{
                    display:"flex", flexDirection:"column", alignItems:"center", gap:6,
                    padding:"16px 6px 13px", borderRadius:16,
                    background: isActive ? "#0EC4B8" : `${cat.color}0A`,
                    border: isActive ? "1px solid #0EC4B8" : `1px solid ${cat.color}22`,
                    cursor:"pointer", WebkitTapHighlightColor:"transparent",
                    transition:"background .18s ease, border-color .18s ease, transform .18s ease",
                    transform: isActive ? "scale(1.03)" : "scale(1)",
                  }}>
                    <span style={{ fontSize:22 }}>{isActive ? "✓" : cat.icon}</span>
                    <span style={{ fontSize:11, fontWeight:600, letterSpacing:"-0.01em", color: isActive ? "#fff" : cat.color, textAlign:"center", lineHeight:1.25 }}>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─────────────────────────────────────────────────────────────
// LIVE-SUCHVORSCHLAEGE — kategorisiert (2026-08-12, Michael-Auftrag)
// ─────────────────────────────────────────────────────────────
// Reine Autocomplete-Anzeige (siehe Architektur-Kommentar in
// src/lib/searchSuggestions.js) -- ersetzt NICHT die bestehende Inline-
// Feed-Filterung, ergaenzt sie nur um sofortiges Antipp-Feedback direkt
// unter der Suchleiste, waehrend getippt wird. Rendert innerhalb des
// bereits bestehenden, nicht-portalierten Discovery-Panels (kein neues
// Overlay, kein neuer Portal-Layer).
function HighlightedLabel({ text, query }) {
  const { before, match, after } = highlightMatch(text, query);
  if (!match) return <>{text}</>;
  return (
    <>
      {before}
      <span style={{ color:T.teal, fontWeight:700 }}>{match}</span>
      {after}
    </>
  );
}

function SuggestionCategory({ label, emoji, items, query, onSelect, renderAvatar }) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ marginBottom:12 }}>
      <div style={{
        fontSize:10, fontWeight:600, letterSpacing:".08em", textTransform:"uppercase",
        color:T.inkFF, marginBottom:6, display:"flex", alignItems:"center", gap:5,
      }}>
        <span style={{fontSize:11}}>{emoji}</span>{label}
      </div>
      {items.map((item) => (
        <button key={item.id} className="dc-tag" onClick={() => onSelect(item)} style={{
          display:"flex", alignItems:"center", gap:9, width:"100%",
          textAlign:"left", padding:"7px 6px", background:"none", border:"none",
          borderRadius:10, cursor:"pointer", WebkitTapHighlightColor:"transparent",
        }}
          onMouseEnter={e=>e.currentTarget.style.background="rgba(14,196,184,0.07)"}
          onMouseLeave={e=>e.currentTarget.style.background="none"}
        >
          {renderAvatar ? renderAvatar(item) : (
            <span style={{width:6,height:6,borderRadius:"50%",background:"rgba(26,53,48,0.18)",flexShrink:0}}/>
          )}
          <span style={{
            fontSize:13, fontWeight:500, letterSpacing:"-0.01em", color:T.ink,
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
          }}>
            <HighlightedLabel text={item.label} query={query} />
          </span>
        </button>
      ))}
    </div>
  );
}

function SuggestionsBlock({ query, suggestions, loading, onSelectProfile, onSelectRef }) {
  const trimmed = query.trim();
  if (trimmed.length < SUGGESTIONS_MIN_QUERY_LEN) return null;

  const empty = !loading && !hasAnySuggestions(suggestions);

  return (
    <div style={{marginBottom:16, animation:"hui-search-fade-in .18s ease both"}}>
      {loading && !hasAnySuggestions(suggestions) ? (
        <div style={{ padding:"10px 6px", fontSize:12, color:T.inkF }}>Suche…</div>
      ) : empty ? (
        <div style={{ padding:"10px 6px", fontSize:12, color:T.inkF }}>
          Keine Treffer für „{trimmed}"
        </div>
      ) : (
        <>
          <SuggestionCategory
            label="Personen" emoji="👥" query={trimmed}
            items={suggestions?.people} onSelect={onSelectProfile}
            renderAvatar={(item) => (
              <span style={{
                width:26, height:26, borderRadius:"50%", flexShrink:0, overflow:"hidden",
                background:"rgba(14,196,184,0.14)", display:"flex", alignItems:"center", justifyContent:"center",
              }}>
                {item.avatar
                  ? <img src={item.avatar} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                  : <span style={{fontSize:11,color:T.teal,fontWeight:700}}>{(item.label||"?").charAt(0).toUpperCase()}</span>}
              </span>
            )}
          />
          <SuggestionCategory label="Werke"      emoji="🎨" query={trimmed} items={suggestions?.works}       onSelect={(item)=>onSelectRef("work", item.id)} />
          <SuggestionCategory label="Talente"    emoji="⭐" query={trimmed} items={suggestions?.talents}     onSelect={(item)=>onSelectRef("talent", item.id)} />
          <SuggestionCategory label="Erlebnisse" emoji="📅" query={trimmed} items={suggestions?.experiences} onSelect={(item)=>onSelectRef("experience", item.id)} />
          <SuggestionCategory label="Momente"    emoji="💬" query={trimmed} items={suggestions?.moments}     onSelect={(item)=>onSelectRef("moment", item.id)} />
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// HAUPTKOMPONENTE — Search Experience 2.0 (2026-07-06, Lars)
// ─────────────────────────────────────────────────────────────
// ARCHITEKTUR-WECHSEL: Kein Portal, kein Fullscreen-Overlay, keine eigene
// Ergebnisliste mehr (useUnifiedSearch/ResultCol/KiDiscoveryCol entfernt --
// vollstaendig ersetzt, keine doppelte Suchlogik mehr im System).
// Die Suche ist jetzt ein Zustand des Home-Feeds:
//   - open=false                   -> normaler Feed (Dashboard, Discover etc.)
//   - open=true,  query leer       -> Discovery: Kategorien + Filter + Verlauf,
//                                     als frei schwebendes Panel unter der Bar
//   - open=true,  query nicht leer -> Kategorien+Verlauf blenden aus, Filter
//                                     bleiben sichtbar; der bestehende Feed
//                                     (UnifiedFeed/useFeedStream) zeigt live
//                                     gefilterte Ergebnisse.
//   - activeCategories nicht leer   -> wie query nicht leer: Feed filtert live
//                                     nach Kategorie-Keywords (siehe
//                                     useFeedStream.js), unabhaengig vom
//                                     freien Suchtext -- beides kann kombiniert
//                                     werden (Kategorie(n) UND Freitext
//                                     gleichzeitig). Mehrfachauswahl seit
//                                     2026-07-07 -- mehrere Kategorien wirken
//                                     als OR untereinander, UND-verknuepft
//                                     mit Freitext/Radius.
// Diese Komponente besitzt selbst KEINE Ergebnisdaten mehr -- sie meldet nur
// {query, typeFilter, category, active} per onSearchStateChange nach oben
// (Home.jsx), welches es an UnifiedFeed durchreicht. Single Source of Truth
// ist der Feed (useFeedStream), nicht die Suchleiste.
//
// EINGESCHRAENKTE FUNKTION -- BEWUSST TRANSPARENT: Der Filter "Menschen" kann
// aktuell KEINE Feed-Items filtern, weil das Feed-Kartensystem (FeedRouter)
// nur 4 Typen kennt: moment/work/experience/event -- keinen Personen-Typ.
// Eine echte Personensuche im Feed wuerde eine neue Kartenart erfordern
// (Architektur-Entscheidung, kein reiner Bugfix). Bis dahin zeigt ein Tap auf
// "Menschen" einen kurzen Hinweis statt einen leeren/kaputten Feed-Zustand.
export default function SearchCommandCenter({
  activeMood, currentUser, onSearchStateChange,
  // Quick-Action-Gruppe (2026-07-06, UX-Ticket "rechts ausrichten"): die drei
  // Header-Buttons (Mood/Netzwerk, Benachrichtigungen, Nachrichten) werden von
  // HomeHeader.jsx als fertiges JSX-Buendel durchgereicht -- Design/Verhalten
  // der Buttons selbst bleibt zu 100% unangetastet (weiterhin einzeln in
  // MoodOrbButton/NotificationButton/MessageButton definiert). Hier wird nur
  // die POSITION festgelegt: gemeinsame Zeile mit der Radius-Anzeige, rechts
  // ausgerichtet, damit beide Elemente auf einer horizontalen Linie sitzen
  // statt auf getrennten, versetzten Zeilen.
  quickActions = null,
}) {
  const [open,       setOpen]       = useState(false);   // Suche fokussiert/aktiv
  const [query,      setQuery]      = useState("");
  const [typeFilter, setTypeFilter] = useState(null);    // null | "work" | "moment" | "experience" | "talent"
  const [showKi,     setShowKi]     = useState(false);
  // Ort + Sortierung (2026-08-12, Michael-Auftrag) -- ersetzt die vormals im
  // Feed sitzende FeedFilterBar (verschwand beim Scrollen). Jetzt Teil des
  // ueber die fixe Suchleiste jederzeit erreichbaren Discovery-Panels.
  // Freitext-Ort-Filter (Substring-Match auf item.location, KEIN Geo/Radius --
  // die bestehende RadiusRow oben bleibt fuer echte Umkreissuche unberuehrt).
  const [locationQuery,     setLocationQuery]     = useState("");
  const [locationInputOpen, setLocationInputOpen] = useState(false);
  const [sort,              setSort]              = useState("newest"); // "newest" | "oldest"
  // kiMode: Spezial-Modus der durch KI-Suggestions gesetzt wird (people,
  // match, discover). Wird an onSearchStateChange übergeben, damit der
  // Feed/UnifiedFeed entsprechend reagieren kann. null = kein KI-Modus.
  const [kiMode,     setKiMode]     = useState(null);
  const radius = useRadiusFilter(); // Umkreissuche 2026-07-06 -- geteilter Radius-Zustand

  // "Alle Kategorien"-Feature (2026-07-06): ausgewaehlte Kategorie (Objekt aus
  // src/lib/categories.js) + Bottom-Sheet-Sichtbarkeit + eigenes Suchfeld
  // innerhalb des Sheets (rein clientseitige Filterung der Kategorie-Liste).
  // Mehrfachauswahl (2026-07-07, Ticket "Kategorie-Chips global"): mehrere
  // Kategorien gleichzeitig aktiv statt nur einer.
  const [activeCategories,   setActiveCategories]  = useState([]);
  const [showAllCategories,  setShowAllCategories]   = useState(false);
  const [categorySheetQuery, setCategorySheetQuery]  = useState("");
  const [sheetPhase,         setSheetPhase]          = useState("hidden"); // hidden|entering|visible|leaving
  const sheetTimerRef = useRef(null);
  const sheetRef       = useRef(null);

  // ── Back-Button: Such-Overlays registrieren ──
  // WICHTIG: useModalRegistration muss NACH den useState-Deklarationen stehen,
  // sonst TDZ-Verletzung (Cannot access 'x' before initialization)
  useModalRegistration(open, () => setOpen(false), "SearchCommandCenter-Search");
  useModalRegistration(showAllCategories, () => setShowAllCategories(false), "SearchCommandCenter-Categories");
  useModalRegistration(showKi, () => setShowKi(false), "SearchCommandCenter-Ki");

  // Visual Polish Pass -- Panel-Phase fuer weiches Ein-/Ausblenden statt
  // hartem Mount/Unmount-Sprung (Vorgabe Punkt 8: 180ms Fade beim Verschwinden,
  // keine Sprünge). "hidden" = nicht im DOM, "visible" = normal sichtbar,
  // "leaving" = spielt gerade die Exit-Animation ab, danach -> hidden.
  const [panelPhase, setPanelPhase] = useState("hidden");
  const panelTimerRef = useRef(null);

  const wrapRef  = useRef(null);
  const inputRef = useRef(null);
  const kiRef    = useRef(null);
  const filterRowRef = useRef(null);
  const recognitionRef = useRef(null);
  const [listening, setListening] = useState(false);

  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem("hui_search_history")||"[]"); }
    catch { return []; }
  });

  // Debounce 150-200ms (Vorgabe Lars, Search Experience 2.0) -- vorher 250ms.
  // UI-Reaktionen (Discovery ein/ausblenden, Eingabefeld) bleiben INSTANT und
  // nutzen die rohe `query` -- nur der teure Feed-Refetch wartet auf den
  // debouncten Wert.
  const debouncedQuery = useDebounce(query, 180);

  // ── Live-Suchvorschläge (2026-08-12, Michael-Auftrag) ──────────
  // Eigener State, unabhaengig vom Feed-Filter-State oben -- reine
  // Autocomplete-Anzeige (siehe src/lib/searchSuggestions.js). Fetch erst ab
  // SUGGESTIONS_MIN_QUERY_LEN Zeichen, nutzt denselben debouncedQuery (kein
  // zweiter Debounce-Timer noetig). requestSeq verhindert Race Conditions
  // (langsamere ältere Antwort ueberschreibt nicht das Ergebnis einer
  // neueren Anfrage -- gleiches Muster wie ueberall sonst im System bei
  // async Suchen).
  const [suggestions, setSuggestions] = useState(null);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const suggestSeqRef = useRef(0);
  const { openRef: openContentRef } = useContentPreview();

  useEffect(() => {
    const q = debouncedQuery.trim();
    if (!open || q.length < SUGGESTIONS_MIN_QUERY_LEN) {
      setSuggestions(null);
      setSuggestLoading(false);
      return;
    }
    const seq = ++suggestSeqRef.current;
    setSuggestLoading(true);
    fetchSearchSuggestions(q).then((res) => {
      if (suggestSeqRef.current !== seq) return; // veraltete Antwort verwerfen
      setSuggestions(res);
      setSuggestLoading(false);
    }).catch(() => {
      if (suggestSeqRef.current !== seq) return;
      setSuggestions(null);
      setSuggestLoading(false);
    });
  }, [debouncedQuery, open, currentUser?.id]);

  function handleSelectProfileSuggestion(item) {
    if (typeof window !== "undefined" && window.__HUI_OPEN_PROFILE__) {
      window.__HUI_OPEN_PROFILE__(item.id);
    }
    close_();
  }
  function handleSelectRefSuggestion(type, id) {
    openContentRef?.({ type, id });
    close_();
  }

  // Suchstatus nach oben melden (Home.jsx -> UnifiedFeed). Der Feed entscheidet
  // selbst, welche Inhalte er anzeigt (Query/Filter sind nur Parameter).
  useEffect(() => {
    onSearchStateChange?.({
      query: debouncedQuery, typeFilter, categories: activeCategories, active: open,
      radiusKm: radius.radiusKm, geo: radius.geo, isWorldwide: radius.isWorldwide,
      kiMode, locationQuery, sort,
    });
    // categoryKey statt Array-Referenz -- verhindert unnoetige Re-Emits bei jedem Render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, typeFilter, activeCategories.map(c=>c.id).join(","), open, radius.radiusKm, radius.geo, radius.isWorldwide, kiMode, locationQuery, sort]);

  // Verlauf speichern, sobald ein Suchbegriff kurz stabil war (kein Spam pro Tastendruck)
  useEffect(() => {
    if (!debouncedQuery.trim()) return;
    const t = setTimeout(() => saveHistory(debouncedQuery), 1200);
    return () => clearTimeout(t);
  }, [debouncedQuery]); // eslint-disable-line

  // Panel-Phase steuern (Visual Polish Pass, Punkt 8: weiche Animationen).
  // Discovery erscheint: 220ms Fade+Translate. Discovery verschwindet: 180ms Fade.
  useEffect(() => {
    clearTimeout(panelTimerRef.current);
    if (open) {
      setPanelPhase("entering");
      panelTimerRef.current = setTimeout(() => setPanelPhase("visible"), 220);
    } else if (panelPhase !== "hidden") {
      setPanelPhase("leaving");
      panelTimerRef.current = setTimeout(() => setPanelPhase("hidden"), 180);
    }
    return () => clearTimeout(panelTimerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Sheet-Phase steuern -- gleiches 220ms/180ms-Timing wie das Discovery-
  // Panel (Vorgabe Lars: "Öffnen ca. 220ms, Schließen ca. 180ms").
  useEffect(() => {
    clearTimeout(sheetTimerRef.current);
    if (showAllCategories) {
      setSheetPhase("entering");
      // Doppel-rAF: erst mit der Off-Screen-Position mounten, dann im
      // naechsten Frame auf die On-Screen-Position wechseln -- nur so
      // greift der CSS-transform-transition-Uebergang zuverlaessig
      // (sonst wuerde der Browser den ersten und einzigen Zustand direkt
      // ohne Animation rendern).
      const raf1 = requestAnimationFrame(() => {
        requestAnimationFrame(() => setSheetPhase("visible"));
      });
      return () => cancelAnimationFrame(raf1);
    } else if (sheetPhase !== "hidden") {
      setSheetPhase("leaving");
      sheetTimerRef.current = setTimeout(() => setSheetPhase("hidden"), 180);
    }
    return () => clearTimeout(sheetTimerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAllCategories]);

  // Placeholder-Rotation (nur wenn nicht aktiv)
  const PH = ["Menschen, Werke oder Erlebnisse","Menschen finden","Werke entdecken","Projekte erkunden"];
  const [phIdx,setPhIdx] = useState(0);
  const [phVis,setPhVis] = useState(true);
  useEffect(()=>{
    if(open)return;
    const t=setInterval(()=>{
      setPhVis(false);
      setTimeout(()=>{ setPhIdx(i=>(i+1)%PH.length); setPhVis(true); },290);
    },3800);
    return()=>clearInterval(t);
  },[open]);

  // Click-Outside beendet den aktiven Suchzustand (kein Portal mehr zu schliessen --
  // einfach open=false, Feed faellt automatisch auf den Normalzustand zurueck).
  // sheetRef ist ausgenommen -- ein Klick INNERHALB des Kategorien-Sheets
  // (inkl. Backdrop) soll NICHT automatisch die gesamte Suche schliessen,
  // nur das Sheet selbst (eigene onClick-Handler dort).
  useEffect(()=>{
    if(!open)return;
    function h(e){
      if(sheetRef.current?.contains(e.target)) return;
      if(!wrapRef.current?.contains(e.target)&&!kiRef.current?.contains(e.target)) close_();
    }
    document.addEventListener("mousedown",h);
    document.addEventListener("touchstart",h,{passive:true});
    return()=>{ document.removeEventListener("mousedown",h); document.removeEventListener("touchstart",h); };
  },[open]);

  // Escape beendet zuerst das Sheet, dann die KI-Vorschlaege, dann die Suche
  useEffect(()=>{
    function h(e){
      if(e.key!=="Escape")return;
      if(showAllCategories){setShowAllCategories(false);return;}
      if(showKi){setShowKi(false);return;}
      close_();
    }
    document.addEventListener("keydown",h);
    return()=>document.removeEventListener("keydown",h);
  },[showKi,showAllCategories]);

  const mc  = activeMood?.color || "#0EC4B8";
  const has = !!activeMood;

  function open_(){
    setOpen(true);
    setTimeout(()=>inputRef.current?.focus(), 60);
  }
  function close_(){
    setOpen(false);
    setShowKi(false);
    setShowAllCategories(false);
    inputRef.current?.blur();
    // Bewusst: Suchtext + aktive Kategorie bleiben erhalten -- erneutes
    // Antippen der Bar zeigt sofort wieder dieselben gefilterten Ergebnisse
    // (kein Datenverlust).
  }
  function clearQuery(){
    setQuery("");
    inputRef.current?.focus();
  }

  // ── Global close hook — 2026-08-12 ──
  // Home.jsx scroll container can call window.__HUI_CLOSE_SEARCH__() to
  // close the search dropdown when the user taps the feed area.
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.__HUI_CLOSE_SEARCH__ = close_;
    }
    return () => { if (typeof window !== "undefined") delete window.__HUI_CLOSE_SEARCH__; };
  }, []);

  // ── Spracherkennung (Web Speech API) — 2026-08-12, Michael-Auftrag ──
  // Mikrofon-Icon rechts neben der Suchleiste startet/stoppt die
  // Spracherkennung. Erkannter Text wird direkt ins Suchfeld geschrieben.
  function toggleVoiceInput(){
    // Bereits aktiv → stoppen
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
      setListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return; // nicht unterstützt → no-op

    const recog = new SpeechRecognition();
    recog.lang = "de-DE";
    recog.interimResults = true;
    recog.continuous = false;
    recog.maxAlternatives = 1;

    let finalText = "";

    recog.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const tr = e.results[i];
        if (tr.isFinal) finalText += tr[0].transcript;
        else interim += tr[0].transcript;
      }
      const display = (finalText + interim).trim();
      if (display) {
        setQuery(display.slice(0, 200));
      }
    };

    recog.onerror = () => {
      setListening(false);
      recognitionRef.current = null;
    };

    recog.onend = () => {
      setListening(false);
      recognitionRef.current = null;
      // Fokus zurück ins Suchfeld
      inputRef.current?.focus();
    };

    recognitionRef.current = recog;
    setListening(true);
    open_();
    try { recog.start(); } catch { setListening(false); recognitionRef.current = null; }
  }
  function saveHistory(q){ if(!q.trim())return; const n=[q,...history.filter(h=>h!==q)].slice(0,8); setHistory(n); try{localStorage.setItem("hui_search_history",JSON.stringify(n));}catch{} }
  function handleHistory(q){ setQuery(q); inputRef.current?.focus(); }
  // KI-Select — 2026-08-12: Jeder KI-Vorschlag löst jetzt eine echte
  // Filter-Aktion aus statt nur Text in das Suchfeld zu schreiben. Der
  // alte behaviour (nur query=text) hatte keinen Effekt auf die
  // Ergebnisliste -- der Feed filterte nach "Ich suche kreative Menschen"
  // als ob das ein Suchbegriff wäre (fand natürlich nichts). Jetzt steuert
  // jeder Satz gezielt typeFilter, categories, radius und query.
  function handleKiSelect(item) {
    const text = typeof item === "string" ? item : item.text;
    const action = typeof item === "string" ? null : item.action;
    setShowKi(false);

    switch (action) {
      case "people":
        // Kreative Menschen: kein Text-Filter (Feed kann keine Personen als
        // Karten anzeigen), dafuer Live-Suggestions auf Personen fokussiert.
        // Setzt query auf kurzen Text damit die Suggestion-Engine anspringt,
        // aber Feed bleibt ungefiltert (typeFilter=null, categories=[]).
        setQuery("");
        setTypeFilter(null);
        setActiveCategories([]);
        // Profil-Suche triggern: wir setzen query auf leeren String und
        // öffnen stattdessen die Suggestions direkt mit einem breiten
        // Personen-Fetch. Einfachster Weg: query leer lassen, Feed zeigt
        // alles. Nutzer kann dann in den Vorschlägen Personen finden.
        // Besser: Wir setzen einen speziellen query-Modus.
        setKiMode("people");
        inputRef.current?.focus();
        break;

      case "nearby":
        // Projekte in meiner Nähe: Standort aktivieren + kleiner Radius +
        // Werke als Primärfilter (Werke sind der Content-Typ der am ehesten
        // "Projekte" repräsentiert -- Erlebnisse wären "Veranstaltungen").
        setQuery("");
        setTypeFilter("work");
        setActiveCategories([]);
        setKiMode(null);
        if (!radius.geo) {
          radius.requestBrowserLocation();
        }
        if (radius.isWorldwide) {
          radius.setRadiusKm(25);
        }
        inputRef.current?.focus();
        break;

      case "match":
        // Wer passt zu meinem Profil: Künftige Matching-Logik. Vorläufig:
        // breit filtern (kein typeFilter, kein Text), Feed zeigt alles.
        // TODO: Matching-RPC mit Interessen/Tags des currentUser.
        setQuery("");
        setTypeFilter(null);
        setActiveCategories([]);
        setKiMode("match");
        inputRef.current?.focus();
        break;

      case "help":
        // Wo kann ich heute helfen: Erlebnisse zeigen (dort braucht man
        // Hilfe/Teilnahme), kein Text-Filter.
        setQuery("");
        setTypeFilter("experience");
        setActiveCategories([]);
        setKiMode(null);
        inputRef.current?.focus();
        break;

      case "events":
        // Veranstaltungen die zu mir passen: Erlebnisse + Standort-Radius.
        setQuery("");
        setTypeFilter("experience");
        setActiveCategories([]);
        setKiMode(null);
        if (!radius.geo) {
          radius.requestBrowserLocation();
        }
        if (radius.isWorldwide) {
          radius.setRadiusKm(50);
        }
        inputRef.current?.focus();
        break;

      case "discover":
        // Welche Menschen sollte ich kennen: aehnlich "people", aber mit
        // Fokus auf Entdeckung. Setzt kiMode fuer künftige Empfehlungs-Logik.
        setQuery("");
        setTypeFilter(null);
        setActiveCategories([]);
        setKiMode("discover");
        inputRef.current?.focus();
        break;

      default:
        // Fallback: altes Verhalten (nur Text setzen)
        setQuery(text);
        setKiMode(null);
        inputRef.current?.focus();
    }
  }
  function toggleFilter(f){
    setTypeFilter(prev => prev===f ? null : f);
  }

  // AKTIVE-FILTER-ZÄHLER (2026-08-12, Michael-Auftrag) -- zählt alle Filter,
  // die den Feed-Inhalt EINSCHRÄNKEN (Content-Typ, Kategorien, Ort, KI-Modus).
  // Radius/Standort selbst zählt NICHT mit -- der ist bereits im Radius-Text
  // selbst sichtbar ("Weltweit" vs. "In deiner Nähe · 25km"), doppelte
  // Anzeige waere redundant. Sortierung zählt nicht (schränkt nichts ein,
  // ändert nur die Reihenfolge). useMemo verhindert unnötige Re-Renders.
  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (typeFilter) n += 1;
    n += activeCategories.length;
    if (locationQuery && locationQuery.trim()) n += 1;
    if (kiMode) n += 1;
    return n;
  }, [typeFilter, activeCategories, locationQuery, kiMode]);
  // Kategorie-Auswahl (Schnellauswahl-Zeile UND "Alle Kategorien"-Grid nutzen
  // denselben Handler -- ein Auswahlverhalten, keine Doppellogik). Mehrfach-
  // auswahl (2026-07-07, Ticket "Kategorie-Chips global"): ein Tap schaltet
  // die Kategorie in `activeCategories` an/aus (Toggle), statt sie als
  // einzige aktive Kategorie zu ersetzen. Das Sheet schliesst sich beim
  // Auswaehlen NICHT mehr automatisch -- bei Mehrfachauswahl soll man mehrere
  // Kategorien hintereinander antippen koennen, ohne das Sheet neu zu oeffnen
  // (Schliessen weiterhin ueber den expliziten ✕-Button im Sheet-Header).
  function toggleCategory(cat){
    setActiveCategories(prev =>
      prev.some(c => c.id === cat.id) ? prev.filter(c => c.id !== cat.id) : [...prev, cat]
    );
  }
  function removeCategory(id){
    setActiveCategories(prev => prev.filter(c => c.id !== id));
  }

  const activeCategoryIds = activeCategories.map(c => c.id);
  // Schnellauswahl-Zeile bleibt sichtbar, solange KEIN Freitext getippt wird --
  // unabhaengig davon, ob bereits Kategorien aktiv sind (Vorgabe: "mehrere
  // Kategorien sollen gleichzeitig auswaehlbar sein", die Zeile darf beim
  // ersten Tap also nicht verschwinden). Aktive Chips heben sich direkt in
  // derselben Zeile per Tuerkis-Highlighting ab (siehe unten) -- keine
  // separate zweite Leiste noetig.
  const showCategoriesAndHistory = open && !query.trim() && activeCategories.length === 0;
  const showFilters              = open; // Filter bleiben sichtbar, auch waehrend Live-Search

  // ── SEARCH-BAR — Visual Polish Pass: mehr Hoehe, weichere Rundung, kein
  // harter Rahmen, sanfter Glow statt Border bei Fokus (Punkt 2) ──────────
  const searchBar = (
    <div onClick={() => { open ? close_() : open_(); }} style={{
      display:"flex", alignItems:"center", gap:10, height:44,
      background: has ? `linear-gradient(135deg,${mc}12,rgba(255,253,251,0.95))` : "rgba(255,255,255,0.90)",
      backdropFilter:"blur(18px) saturate(1.6)", WebkitBackdropFilter:"blur(18px) saturate(1.6)",
      borderRadius: 22,
      border: `1px solid ${has ? mc+"30" : "rgba(26,53,48,0.055)"}`,
      boxShadow: open ? T.shadowFocus : T.shadowRest,
      padding:"0 10px 0 16px", cursor:"text",
      transition:"box-shadow .32s cubic-bezier(.22,1,.36,1), background .28s ease, border-color .28s ease",
    }} role="button" tabIndex={0}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{flexShrink:0,opacity:open?.7:.36,transition:"opacity .2s ease"}}>
        <circle cx="11" cy="11" r="7" stroke={T.teal} strokeWidth="1.7"/>
        <path d="M20 20L16.5 16.5" stroke={T.teal} strokeWidth="1.7" strokeLinecap="round"/>
      </svg>
      <div style={{flex:1,position:"relative",height:44,display:"flex",alignItems:"center"}}>
        <input ref={inputRef} className="dc-input"
          value={query}
          onChange={e=>setQuery(e.target.value.slice(0,200))}
          onFocus={open_}
          onClick={e=>e.stopPropagation()}
          // 2026-08-12 Fix (v2, robust): Schliessen bei zweitem Tap auf die
          // BEREITS offene Suchleiste. onFocus feuert auf Android WebViews
          // unzuverlaessig NICHT erneut (Element ist schon fokussiert -- kein
          // Focus-Wechsel, kein Event) -- ein reiner onFocus/onClick-Ansatz
          // (v1-Fix) ist deshalb fragil. Robuster Standard-Pattern:
          // onMouseDown/onTouchStart VOR dem eigentlichen Focus-Event abfangen
          // und mit preventDefault() den Focus-Zyklus komplett verhindern,
          // wenn bereits offen + kein Suchtext -- dann direkt schliessen.
          // Ist die Suche geschlossen (oder Text vorhanden), laeuft der
          // native Fokus-Vorgang normal weiter -> onFocus oeffnet wie gewohnt.
          onMouseDown={e=>{ if(open && !query.trim()){ e.preventDefault(); close_(); } }}
          onTouchStart={e=>{ if(open && !query.trim()){ e.preventDefault(); close_(); } }}
        />
        {!query && !open && (
          <span style={{position:"absolute",left:0,pointerEvents:"none",fontSize:14,fontWeight:450,letterSpacing:"-0.01em",color:has?`${mc}85`:"rgba(26,53,48,0.32)",opacity:phVis?1:0,transform:phVis?"translateY(0)":"translateY(4px)",transition:"opacity .3s ease, transform .3s ease",whiteSpace:"nowrap",overflow:"hidden",maxWidth:"100%"}}>{PH[phIdx]}</span>
        )}
        {open && !query && (
          <span style={{position:"absolute",left:0,pointerEvents:"none",fontSize:14,fontWeight:400,letterSpacing:"-0.01em",color:"rgba(26,53,48,0.26)",whiteSpace:"nowrap"}}>Was möchtest du bewirken?</span>
        )}
      </div>
      {query && (
        <button className="dc-tag" onClick={e=>{e.stopPropagation();clearQuery();}} style={{flexShrink:0,width:18,height:18,borderRadius:"50%",background:"rgba(26,53,48,0.07)",border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:9,color:"rgba(26,53,48,0.55)",fontWeight: 600}}>✕</button>
      )}
      <div ref={kiRef} style={{position:"relative",flexShrink:0}}>
        <button className="dc-tag" onClick={e=>{e.stopPropagation();open_();setShowKi(p=>!p);}} style={{display:"flex",alignItems:"center",gap:3,background:showKi?T.teal:"rgba(14,196,184,0.07)",border:"none",borderRadius:99,padding:"4px 9px",cursor:"pointer",transition:"background .18s ease",WebkitTapHighlightColor:"transparent"}}>
          <span style={{width:6,height:6,borderRadius:"50%",background:"rgba(14,196,184,0.4)",flexShrink:0,display:"inline-block"}} />
          <span style={{fontSize:8.5,fontWeight: 600,color:showKi?"white":`${T.teal}CC`,letterSpacing:".01em"}}>KI</span>
        </button>
        {showKi && <KiPanel onSelect={handleKiSelect} onClose={()=>setShowKi(false)}/>}
      </div>
      <button
        type="button"
        onClick={e=>{e.stopPropagation();toggleVoiceInput();}}
        style={{flexShrink:0,padding:"0 2px",border:"none",background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",opacity:listening?1:.4,transition:"opacity .2s ease",WebkitTapHighlightColor:"transparent"}}
        aria-label={listening ? "Spracheingabe stoppen" : "Spracheingabe starten"}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={listening?{animation:"hui-mic-pulse 1s ease-in-out infinite"}:undefined}>
          <rect x="9" y="2" width="6" height="11" rx="3" stroke={listening?"#FF6F61":T.ink} strokeWidth="1.7" fill={listening?"rgba(255,111,97,0.15)":"none"}/>
          <path d="M5 10a7 7 0 0014 0" stroke={listening?"#FF6F61":T.ink} strokeWidth="1.7" strokeLinecap="round"/>
          <line x1="12" y1="21" x2="12" y2="17" stroke={listening?"#FF6F61":T.ink} strokeWidth="1.7" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );

  // ── DISCOVERY / FILTER-PANEL — frei schwebendes Panel, kein Portal, kein
  // Glued-Border zur Bar mehr (Punkt 1 + 7: mehr Weissraum, kein harter
  // Uebergang). Weiches Ein-/Ausblenden ueber panelPhase (Punkt 8). ──────────
  // Content-Typ-Filter (2026-08-12, Michael-Auftrag) -- ersetzt die alte
  // Menschen/Werke/Erlebnisse-Zeile. "Menschen" entfernt, da der Feed keine
  // Personensuche unterstuetzt (kein Feed-Kartentyp, siehe alter toggleFilter-
  // Sonderfall). Neu: Momente + Talente ergaenzt, deckt jetzt alle 4
  // Feed-Kartentypen ab (work/moment/experience/talent).
  const FILTERS = [
    {key:"work",       label:"Werke",      emoji:"🎨"},
    {key:"moment",     label:"Momente",    emoji:"💬"},
    {key:"experience", label:"Erlebnisse", emoji:"📅"},
    {key:"talent",     label:"Talente",    emoji:"⭐"},
  ];

  const panelAnimating = panelPhase === "entering" || panelPhase === "leaving";
  const discoveryPanel = (panelPhase !== "hidden") ? (
    <div style={{
      background:T.bg,
      backdropFilter:"blur(20px) saturate(1.4)", WebkitBackdropFilter:"blur(20px) saturate(1.4)",
      border:"1px solid rgba(26,53,48,0.045)",
      borderRadius: 20,
      boxShadow: T.panelShadow,
      padding:"20px 18px 22px", overflow:"hidden",
      opacity: panelPhase === "leaving" ? 0 : 1,
      transform: panelPhase === "leaving" ? "translateY(-5px)" : "translateY(0)",
      transition: panelAnimating
        ? (panelPhase === "leaving"
            ? "opacity .18s ease, transform .18s ease"
            : "opacity .22s cubic-bezier(.22,1,.36,1), transform .22s cubic-bezier(.22,1,.36,1)")
        : "none",
    }}>
      {/* Aktive Kategorien -- ersetzt die Kategorien-Schnellauswahl, solange
          mindestens eine Kategorie gewaehlt ist. Mehrfachauswahl (2026-07-07):
          jede aktive Kategorie ein eigener Tuerkis-Chip mit eigenem ✕; ein
          "+ Kategorie"-Chip oeffnet das volle Sheet, um weitere hinzuzufuegen.
          Feed filtert sofort live ueber onSearchStateChange. Bleibt sichtbar
          auch waehrend getipptem Freitext -- Kategorie(n) + Text sollen sich
          kombinieren lassen. */}
      {activeCategories.length > 0 && (
        <div style={{marginBottom:16, animation:"hui-search-fade-in .22s cubic-bezier(.22,1,.36,1) both"}}>
          <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
            {activeCategories.map(cat => (
              <div key={cat.id} style={{display:"inline-flex",alignItems:"center",gap:7,background:"#0EC4B8",borderRadius:99,padding:"7px 8px 7px 14px",boxShadow:"0 4px 14px rgba(14,196,184,0.28)"}}>
                <span style={{fontSize:13}}>{cat.icon}</span>
                <span style={{fontSize:12.5,fontWeight:600,color:"#fff",letterSpacing:"-0.01em"}}>{cat.name}</span>
                <button className="dc-tag" onClick={()=>removeCategory(cat.id)} style={{
                  width:18,height:18,borderRadius:"50%",background:"rgba(255,255,255,0.28)",
                  border:"none",display:"flex",alignItems:"center",justifyContent:"center",
                  cursor:"pointer",fontSize:8.5,color:"#fff",fontWeight: 600,marginLeft:2,
                }}>✕</button>
              </div>
            ))}
            <button className="dc-tag" onClick={()=>setShowAllCategories(true)} style={{
              display:"flex",alignItems:"center",gap:4,flexShrink:0,
              background:"rgba(26,53,48,0.035)",border:"1px solid rgba(26,53,48,0.07)",
              borderRadius:99,padding:"7px 14px",cursor:"pointer",
              fontSize:12,fontWeight:600,letterSpacing:"-0.01em",color:T.inkF,whiteSpace:"nowrap",
              WebkitTapHighlightColor:"transparent",
            }}>+ Kategorie</button>
          </div>
        </div>
      )}

      {/* Kategorien -- horizontal scrollbar, eine Zeile, nur in reiner Discovery */}
      {showCategoriesAndHistory && (
        <div style={{marginBottom:20, animation:"hui-search-fade-in .22s cubic-bezier(.22,1,.36,1) both"}}>
          <div style={{display:"flex",gap:7,overflowX:"auto",paddingBottom:2,WebkitOverflowScrolling:"touch",scrollbarWidth:"none"}} className="dc-scroll">
            {FEATURED_CATEGORIES.map(cat=>(
              <button key={cat.id} className="dc-tag" onClick={()=>toggleCategory(cat)} style={{
                display:"flex",alignItems:"center",gap:5,flexShrink:0,
                background:`${cat.color}0A`,border:`1px solid ${cat.color}22`,
                borderRadius:99,padding:"7px 14px",cursor:"pointer",
                fontSize:12,fontWeight:600,letterSpacing:"-0.01em",color:cat.color,whiteSpace:"nowrap",
                WebkitTapHighlightColor:"transparent",
              }}>
                <span style={{fontSize:12.5}}>{cat.icon}</span>{cat.name}
              </button>
            ))}
            <button className="dc-tag" onClick={()=>setShowAllCategories(true)} style={{
              display:"flex",alignItems:"center",gap:4,flexShrink:0,
              background:"rgba(26,53,48,0.035)",border:"1px solid rgba(26,53,48,0.07)",
              borderRadius:99,padding:"7px 14px",cursor:"pointer",
              fontSize:12,fontWeight:600,letterSpacing:"-0.01em",color:T.inkF,whiteSpace:"nowrap",
              WebkitTapHighlightColor:"transparent",
            }}>Alle Kategorien ➡</button>
          </div>
        </div>
      )}

      {/* Umkreissuche -- immer erreichbar solange das Panel offen ist, nicht
          nur in der reinen Discovery-Ansicht (Vorgabe: "jederzeit schnell
          erreichbar", gilt fuer Kategorien UND Filter UND freie Suche). */}
      <RadiusRow radius={radius} />

      {/* Filter -- fast monochrom, nur der aktive Filter erhaelt die HUI-Farbe (Punkt 5).
          Erweitert (2026-08-12, Michael-Auftrag): Content-Typ-Chips + Ort-Filter +
          Datum-Sortierung in EINER Zeile -- ersetzt die vormals separate, im Feed
          sitzende FeedFilterBar (verschwand beim Scrollen). Jetzt Teil dieses immer
          ueber die fixe Suchleiste erreichbaren Discovery-Panels. Gleiche dc-tag-
          Optik wie alle anderen Pills hier (Design System First, Prinzip 2). */}
      {showFilters && (
        <div ref={filterRowRef} style={{marginBottom: showCategoriesAndHistory && history.length>0 ? 20 : 0}}>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
            {FILTERS.map(f=>{
              const activeF = typeFilter===f.key;
              return (
                <button key={f.key} className="dc-tag" onClick={()=>toggleFilter(f.key)} style={{
                  display:"flex",alignItems:"center",gap:5,
                  background: activeF ? T.teal : "rgba(26,53,48,0.035)",
                  border:`1px solid ${activeF ? T.teal : "rgba(26,53,48,0.07)"}`,
                  borderRadius:99,padding:"6px 13px",cursor:"pointer",
                  fontSize:11.5,fontWeight:600,letterSpacing:"-0.01em",
                  color: activeF ? "#fff" : "rgba(26,53,48,0.62)",
                  boxShadow: activeF ? "0 3px 10px rgba(14,196,184,0.26)" : "none",
                  transition:"background .2s ease,border-color .2s ease,color .2s ease,box-shadow .2s ease",
                  WebkitTapHighlightColor:"transparent",
                }}>
                  <span style={{fontSize:12,opacity:activeF?1:.75}}>{f.emoji}</span>{f.label}
                </button>
              );
            })}

            {/* Ort -- Freitext-Filter auf item.location (Substring, KEIN Geo/Radius).
                Tap oeffnet ein Inline-Textfeld direkt im Chip, analog zum bestehenden
                manuellen Standort-Fallback in RadiusRow (gleiches Interaktionsmuster). */}
            {!locationInputOpen ? (
              <button className="dc-tag" onClick={()=>setLocationInputOpen(true)} style={{
                display:"flex",alignItems:"center",gap:5,
                background: locationQuery ? T.tealM : "rgba(26,53,48,0.035)",
                border:`1px solid ${locationQuery ? "rgba(14,196,184,0.30)" : "rgba(26,53,48,0.07)"}`,
                borderRadius:99,padding:"6px 13px",cursor:"pointer",
                fontSize:11.5,fontWeight:600,letterSpacing:"-0.01em",
                color: locationQuery ? T.teal : "rgba(26,53,48,0.62)",
                whiteSpace:"nowrap", WebkitTapHighlightColor:"transparent",
              }}>
                <HUILocationIcon size={12} style={{flexShrink:0, opacity: locationQuery ? 1 : .55}} />
                {locationQuery || "Ort"}
              </button>
            ) : (
              <div style={{
                display:"flex",alignItems:"center",gap:6,
                background:"rgba(26,53,48,0.035)",border:"1px solid rgba(26,53,48,0.09)",
                borderRadius:99,padding:"5px 6px 5px 13px",minWidth:130,
              }}>
                <HUILocationIcon size={12} style={{flexShrink:0, opacity:.55}} />
                <input
                  autoFocus
                  value={locationQuery}
                  onChange={e=>setLocationQuery(e.target.value.slice(0,200))}
                  onBlur={()=>{ if (!locationQuery) setLocationInputOpen(false); }}
                  onKeyDown={e=>{ if (e.key==="Enter") e.currentTarget.blur(); }}
                  placeholder="Ort eingeben…"
                  style={{
                    flex:1,minWidth:0,border:"none",outline:"none",background:"transparent",
                    fontSize:11.5,fontWeight:600,letterSpacing:"-0.01em",color:T.ink,
                  }}
                />
                <button className="dc-tag" onClick={()=>{setLocationQuery("");setLocationInputOpen(false);}} style={{
                  width:18,height:18,borderRadius:"50%",background:"rgba(26,53,48,0.09)",
                  border:"none",display:"flex",alignItems:"center",justifyContent:"center",
                  cursor:"pointer",fontSize:9,color:"rgba(26,53,48,0.55)",fontWeight:600,flexShrink:0,
                }}>✕</button>
              </div>
            )}

            {/* Datum-Sortierung -- Toggle Neueste/Aelteste, gleiche Chip-Optik. */}
            <button className="dc-tag" onClick={()=>setSort(s => s==="newest" ? "oldest" : "newest")} style={{
              display:"flex",alignItems:"center",gap:5,
              background:"rgba(26,53,48,0.035)",border:"1px solid rgba(26,53,48,0.07)",
              borderRadius:99,padding:"6px 13px",cursor:"pointer",
              fontSize:11.5,fontWeight:600,letterSpacing:"-0.01em",color:"rgba(26,53,48,0.62)",
              whiteSpace:"nowrap", WebkitTapHighlightColor:"transparent",
            }}>
              <span style={{fontSize:12,opacity:.75}}>🕐</span>{sort==="newest" ? "Neueste" : "Älteste"}
            </button>
          </div>
        </div>
      )}

      {/* Zuletzt gesucht -- kleine dezente Pills, nicht dominant (Punkt 6) */}
      {showCategoriesAndHistory && history.length>0 && (
        <div style={{animation:"hui-search-fade-in .22s cubic-bezier(.22,1,.36,1) both"}}>
          <SectionLabel action="Löschen" onAction={()=>{setHistory([]);localStorage.removeItem("hui_search_history");}}>
            Zuletzt gesucht
          </SectionLabel>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {history.slice(0,6).map((h,i)=>(
              <button key={i} className="dc-tag" onClick={()=>handleHistory(h)} style={{display:"flex",alignItems:"center",gap:4,background:"rgba(26,53,48,0.03)",border:"1px solid rgba(26,53,48,0.055)",borderRadius:99,padding:"4px 10px",fontSize:10.5,fontWeight:500,color:T.inkF,cursor:"pointer",WebkitTapHighlightColor:"transparent"}}>
                <span style={{fontSize:9,opacity:.38}}>🕐</span>{h}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  ) : null;

  return (
    <>
      <style>{`
        @keyframes dc-in {
          from { opacity:0; transform:translateY(-6px) scaleY(.97); transform-origin:top center; }
          to   { opacity:1; transform:translateY(0) scaleY(1); }
        }
        @keyframes hui-search-fade-in {
          from { opacity:0; transform:translateY(5px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes hui-mic-pulse {
          0%, 100% { transform:scale(1); }
          50% { transform:scale(1.18); }
        }
        .dc-input {
          outline:none; border:none; background:none; width:100%;
          font-family:Inter,sans-serif;
          font-size:15px; font-weight:500; letter-spacing:-0.01em; color:#1A3530;
        }
        .dc-input::placeholder { color:rgba(26,53,48,0.28); }
        .dc-scroll::-webkit-scrollbar { display:none; }
        /* Premium-Detail (Punkt 10): weiche Scale-Reaktion auf Touch/Klick,
           keine harten Zustaende -- gilt fuer alle Kategorie-/Filter-/Verlaufs-Pills. */
        .dc-tag { transition: transform .13s ease, opacity .13s ease; }
        .dc-tag:active { transform: scale(0.97); opacity: 0.86; }
        @media (hover:hover) {
          .dc-tag:hover { opacity: 0.92; }
        }
      `}</style>

      {/* WRAPPER — display:contents: gibt Bar und Panel als ZWEI separate
          Flex-Items an die Eltern-Row (HomeHeader) weiter, statt sie in
          einer gemeinsamen flex:1-Spalte neben den Icon-Buttons einzusperren
          (ROOT-CAUSE-FIX "Discovery-Panel rechts offen", 2026-07-06).
          wrapRef bleibt fuer die Click-Outside-Erkennung gueltig -- .contains()
          arbeitet auf dem DOM-Baum, display:contents aendert nur das Rendering,
          nicht die DOM-Struktur. */}
      <div ref={wrapRef} style={{ display:"contents" }}>
        {/* Bar-Slot -- order:0, flex:1 wie bisher, teilt sich die erste Zeile
            mit den Icon-Buttons (order:1 in HomeHeader.jsx). */}
        <div style={{ position:"relative", flex:1, minWidth:0, order:0, zIndex:300 }}>
          {searchBar}
          {/* Live-Suchvorschläge -- 2026-08-12, Korrektur nach Michael-Feedback:
              NICHT mehr Teil der Discovery-/Distanz-Kachel (discoveryPanel),
              sondern ein eigenstaendiges, absolut positioniertes Dropdown, das
              direkt UNTER dem Suchfeld schwebt -- exakt gleiches Muster wie
              KiPanel (position:absolute, top:calc(100% + 8px)), nur volle
              Breite der Suchleiste statt der schmalen 264px. zIndex 400 liegt
              ueber der Radius-Zeile (298) und dem discoveryPanel (siehe unten),
              schwebt also frei darueber -- klassisches Autocomplete-Verhalten. */}
          {open && query.trim().length >= SUGGESTIONS_MIN_QUERY_LEN && (
            <div style={{
              position:"absolute", top:"calc(100% + 8px)", left:0, right:0, zIndex:400,
              background:T.bg, backdropFilter:"blur(20px) saturate(1.4)", WebkitBackdropFilter:"blur(20px) saturate(1.4)",
              border:"1px solid rgba(26,53,48,0.045)", borderRadius:18, boxShadow:T.panelShadow,
              padding:"14px 14px 8px", maxHeight:"60vh", overflowY:"auto", WebkitOverflowScrolling:"touch",
              animation:"dc-in .18s cubic-bezier(.22,1,.36,1) both",
            }}>
              <SuggestionsBlock
                query={query}
                suggestions={suggestions}
                loading={suggestLoading}
                onSelectProfile={handleSelectProfileSuggestion}
                onSelectRef={handleSelectRefSuggestion}
              />
            </div>
          )}
        </div>

        {/* Radius + Quick-Action-Gruppe -- GEMEINSAME Zeile (2026-07-06,
            UX-Ticket "Quick-Action-Buttons rechts ausrichten"). order:1 +
            flexBasis:100% erzwingt den Zeilenumbruch DIREKT unter der Bar,
            unabhaengig vom Panel/vom "open"-Zustand (Radius soll dauerhaft
            sichtbar sein, nicht nur waehrend die Suche offen ist).
            justifyContent:space-between haelt Radius links / Buttons rechts
            auf einer gemeinsamen horizontalen Linie, alignItems:center
            sorgt fuer perfekte vertikale Ausrichtung zwischen Radius-Text
            (11.5px Zeilenhoehe) und den 36-38px runden Buttons.
            Fade-In beim Laden: hui-search-fade-in (bereits definierte
            Keyframe, opacity 0->1 + translateY 5px->0 -- exakt die
            gewuenschten 4-6px, kein neuer/doppelter Keyframe). Spielt nur
            einmal beim ersten Mount ab (Zeile ist immer im DOM, kein
            Re-Mount bei Radius-Wechsel -- nur RadiusIndicator selbst
            re-mounted gezielt ueber key={label}, s.o.). */}
        <div style={{
          flexBasis:"100%", width:"100%", order:1, zIndex:298, marginTop:9,
          display:"flex", alignItems:"center", justifyContent:"space-between", gap:14,
          animation:"hui-search-fade-in .26s cubic-bezier(.22,1,.36,1) both",
        }}>
          <div style={{ minWidth:0, flex:"1 1 auto", overflow:"hidden" }}>
            <RadiusIndicator radius={radius} activeFilterCount={activeFilterCount} onFilterPillClick={() => { setOpen(true); setTimeout(() => filterRowRef.current?.scrollIntoView({ behavior:"smooth", block:"nearest" }), 120); }} />
          </div>
          {quickActions && (
            <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
              {quickActions}
            </div>
          )}
        </div>

        {/* Panel-Slot -- order:99 + flexBasis:100% zwingt per CSS-Flex-Wrap
            einen Zeilenumbruch NACH Bar+Icons: das Panel bekommt dadurch
            die VOLLE Breite der Eltern-Row, nie nur die schmalere Bar-Spalte.
            Nur gemountet, waehrend panelPhase != "hidden" (Ein-/Ausblend-
            Animation, siehe oben). */}
        {panelPhase !== "hidden" && (
          <div style={{ flexBasis:"100%", width:"100%", order:99, zIndex:299, marginTop:12 }}>
            {discoveryPanel}
          </div>
        )}
      </div>

      {/* "Alle Kategorien"-Bottom-Sheet -- eigener Portal, siehe Kommentar
          an der Komponente oben. */}
      {sheetPhase !== "hidden" && (
        <AllCategoriesSheet
          sheetRef={sheetRef}
          phase={sheetPhase}
          query={categorySheetQuery}
          onQueryChange={setCategorySheetQuery}
          onSelect={toggleCategory}
          onClose={()=>setShowAllCategories(false)}
          activeIds={activeCategoryIds}
        />
      )}
    </>
  );
}
