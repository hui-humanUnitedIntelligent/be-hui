// src/pages/DiscoverPage.jsx — HUI Redesign v3 (2026-05-30)
// ══════════════════════════════════════════════════════════════════
// DESIGN REFERENZ: Screenshot 2026-05-30
// Reihenfolge: Suche → Heute auf HUI → Menschen → Momente → Werke → Erlebnisse → Projekte → Orte
// KEINE Kategorie-Pills (HUI-Orb übernimmt Themennavigation)
// ══════════════════════════════════════════════════════════════════
import {
  HUIProfilIcon, HUILocationIcon, HUIFotoIcon, HUIImpactIcon,
  HUIWerkeIcon, HUIAnsichtIcon,
  HUIKalenderIcon, HUIPersonenIcon,
} from '../design/icons/HuiSystemIcons.jsx';
import React, { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from "react";
import { useNavigate }   from "react-router-dom";
import { supabase }      from "../lib/supabaseClient.js";
import { formatPresence } from "../lib/usePresence.js";
import { useAuthGate }    from "../components/auth/AuthGate.jsx";
import TalentAnfrageFlow  from "../components/talents/TalentAnfrageFlow.jsx";
import TalentBookingFlow  from "../components/talents/TalentBookingFlow.jsx";
import { searchPlaces, distanceKm } from "../lib/geocoding.js";
import { useRadiusFilter, radiusLabel } from "../hooks/useRadiusFilter.js";
const WerkeAllModal = lazy(() => import("../components/discover/WerkeAllModal.jsx"));
const TalenteAllModal = lazy(() => import("../components/discover/TalenteAllModal.jsx"));
const ErlebnisseAllModal = lazy(() => import("../components/discover/ErlebnisseAllModal.jsx"));
const MomenteAllModal = lazy(() => import("../components/discover/MomenteAllModal.jsx"));
const ProjekteAllModal = lazy(() => import("../components/discover/ProjekteAllModal.jsx"));
const OrteAllModal = lazy(() => import("../components/discover/OrteAllModal.jsx")); // Umkreissuche-Vereinheitlichung 2026-07-06 -- globaler Radius statt eigenem State
import { HUIHeartIcon, HUIChatIcon } from "../design/icons/HuiInteractionIcons.jsx"; // ICON-SSOT 2026-07-08 -- ersetzt lokale Emoji-Badges (❤️/💬)
import HuiLiveTicker from "../components/shared/HuiLiveTicker.jsx"; // LIVETICKER.1 2026-07-08 -- ersetzt LiveActivityBar (war Fake-Daten)
import { useContentPreview } from "../context/ContentPreviewContext.jsx";
import { useProfileLauncher } from "../components/home/profile/ProfileLauncher.jsx"; // Autor-Klick → Profil öffnen // OPEN.1 2026-07-08 -- geteilte Vorschau statt totem Tap / falschem Sprung
import { normalizePostForPreview, normalizeProjectForPreview, normalizeWirkerForPreview } from "../lib/previewNormalizers.js";

// ── Design Tokens ────────────────────────────────────────────────
const T = {
  bg:       "#F9F7F4",
  white:    "#FFFFFF",
  teal:     "#0EC4B8",
  tealSoft: "rgba(14,196,184,0.10)",
  tealMid:  "rgba(14,196,184,0.18)",
  coral:    "#E8573A",
  coralSoft:"rgba(232,87,58,0.10)",
  ink:      "#1A3530",
  inkSoft:  "rgba(26,53,48,0.55)",
  inkFaint: "rgba(26,53,48,0.32)",
  border:   "rgba(26,53,48,0.07)",
  px:       16,
  cardShadow:"0 2px 14px rgba(26,53,48,0.07), 0 1px 3px rgba(26,53,48,0.04)",
  cardShadowHover:"0 6px 24px rgba(26,53,48,0.11), 0 2px 8px rgba(26,53,48,0.06)",
};

// ── Global CSS ───────────────────────────────────────────────────
const CSS = `
  .dp-root * { box-sizing:border-box; }
  .dp-hscroll { overflow-x:auto; -webkit-overflow-scrolling:touch; scrollbar-width:none; overscroll-behavior-x:none; }
  .dp-hscroll::-webkit-scrollbar { display:none; }
  .dp-press { transition:transform .14s cubic-bezier(.22,1,.36,1),opacity .14s ease; cursor:pointer; }
  .dp-press:active { transform:scale(0.94); opacity:0.80; }
  @keyframes dp-in  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes dp-shim { from{background-position:-200% 0} to{background-position:200% 0} }
  .dp-in  { animation:dp-in .45s ease both; }
  .dp-skel {
    background:linear-gradient(90deg,rgba(26,53,48,.05) 25%,rgba(26,53,48,.09) 50%,rgba(26,53,48,.05) 75%);
    background-size:200% 100%;
    animation:dp-shim 1.4s ease-in-out infinite;
    border-radius:12px;
  }
  .dp-card-hover { transition:box-shadow .18s ease, transform .18s cubic-bezier(.22,1,.36,1); }
  .dp-card-hover:hover { box-shadow:0 6px 24px rgba(26,53,48,0.11)!important; transform:translateY(-2px); }
  @keyframes dp-live-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.75)} }
  .dp-live-dot { animation:dp-live-pulse 2.2s ease-in-out infinite; }
  /* List view */
  .dp-list-section { display:flex; flex-direction:column; gap:10px; padding:0 16px; }
  .dp-list-card { display:flex; align-items:center; gap:12px; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 2px 14px rgba(26,53,48,0.07),0 1px 3px rgba(26,53,48,0.04); border:1px solid rgba(26,53,48,0.07); padding:10px; cursor:pointer; transition:transform .14s,opacity .14s; }
  .dp-list-card:active { transform:scale(0.97); opacity:0.82; }
  .dp-list-thumb { width:58px; height:58px; border-radius:12px; object-fit:cover; flex-shrink:0; background:rgba(14,196,184,0.08); }
  .dp-list-thumb-placeholder { width:58px; height:58px; border-radius:12px; flex-shrink:0; background:rgba(14,196,184,0.08); display:flex; align-items:center; justify-content:center; font-size:22px; }
  /* Toggle animation */
  @keyframes dp-toggle-in { from{opacity:0;transform:scale(0.92)} to{opacity:1;transform:scale(1)} }
  .dp-toggle-in { animation:dp-toggle-in .18s ease both; }
  /* Live Activity Bar */
  @keyframes dp-activity-slide { from{transform:translateX(8px);opacity:0} to{transform:translateX(0);opacity:1} }
  .dp-activity-card { animation:dp-activity-slide .35s cubic-bezier(.22,1,.36,1) both; }
  /* Online Pulse */
  @keyframes dp-online-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,0.5)} 50%{box-shadow:0 0 0 4px rgba(34,197,94,0)} }
  .dp-online-pulse { animation:dp-online-pulse 2.4s ease-in-out infinite; }
  /* Stat card hover */
  .dp-stat-card { transition:transform .15s ease,box-shadow .15s ease; cursor:default; }
  .dp-stat-card:hover { transform:translateY(-2px); }
  /* Projekt Hero */
  .dp-projekt-hero { transition:transform .2s ease,box-shadow .2s ease; cursor:pointer; }
  .dp-projekt-hero:hover { transform:scale(1.01); }
  /* Tag pills */
  .dp-tag { display:inline-flex;align-items:center;gap:3px;padding:3px 9px;border-radius:99px;font-size:10px;font-weight:600;cursor:default; }
  /* Moment engagement row */
  .dp-engage { display:flex;align-items:center;gap:10px;font-size:10px;color:rgba(26,53,48,0.50); }
  .dp-engage span { display:flex;align-items:center;gap:3px; }
`;

// ── Helpers ──────────────────────────────────────────────────────
const safeStr = (v, fb="") => (v && typeof v === "string" ? v.trim() : fb);
const safeNum = (v, fb=0)  => (typeof v === "number" && isFinite(v) ? v : fb);
const safeArr = (v)         => (Array.isArray(v) ? v : []);
const fmtImpact = (n) => n >= 1000 ? `${(n/1000).toFixed(1)}k` : String(n);
const timeAgo = (dateStr) => {
  if (!dateStr) return "";
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000 / 3600;
  if (diff < 1) return "vor " + Math.round(diff*60) + " Min";
  if (diff < 24) return "vor " + Math.round(diff) + " Std";
  return "vor " + Math.round(diff/24) + " Tagen";
};

// ── View Toggle ──────────────────────────────────────────────────
function ViewToggle({ view, onChange }) {
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:2,
      background:"rgba(26,53,48,0.06)",
      borderRadius:12, padding:3,
      backdropFilter:"blur(8px)",
    }}>
      {[
        { key:"cards", icon:(
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
            <rect x="1" y="1" width="6" height="6" rx="2" stroke="currentColor" strokeWidth="1.5"/>
            <rect x="9" y="1" width="6" height="6" rx="2" stroke="currentColor" strokeWidth="1.5"/>
            <rect x="1" y="9" width="6" height="6" rx="2" stroke="currentColor" strokeWidth="1.5"/>
            <rect x="9" y="9" width="6" height="6" rx="2" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        )},
        { key:"list", icon:(
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
            <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        )},
      ].map(btn => {
        const active = view === btn.key;
        return (
          <button key={btn.key} onClick={() => onChange(btn.key)} style={{
            width:30, height:28, borderRadius:9, border:"none", cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center",
            background: active ? "white" : "transparent",
            color: active ? "#0EC4B8" : "rgba(26,53,48,0.45)",
            boxShadow: active ? "0 1px 6px rgba(26,53,48,0.10), 0 0 0 1px rgba(14,196,184,0.18)" : "none",
            transition:"background .16s, color .16s, box-shadow .16s",
            WebkitTapHighlightColor:"transparent",
            touchAction:"manipulation",
          }}>
            {btn.icon}
          </button>
        );
      })}
    </div>
  );
}

// ── Skeleton ─────────────────────────────────────────────────────
function Skel({ w="100%", h=14, r=10, mb=0 }) {
  return <div className="dp-skel" style={{ width:w, height:h, borderRadius:r, marginBottom:mb }} />;
}

// ── Section Header ────────────────────────────────────────────────
function SectionHead({ title, sub, action, onAction, delay=0 }) {
  return (
    <div className="dp-in" style={{
      display:"flex", alignItems:"flex-end", justifyContent:"space-between",
      padding:`0 ${T.px}px`, marginBottom:14,
      animationDelay:`${delay}ms`,
    }}>
      <div>
        <div style={{ fontSize:17, fontWeight:800, color:T.ink, letterSpacing:"-0.03em", lineHeight:1.2 }}>
          {title}
        </div>
        {sub && <div style={{ fontSize:12, color:T.inkFaint, marginTop:3, fontWeight:400 }}>{sub}</div>}
      </div>
      {action && (
        <button onClick={onAction} style={{
          background:"none", border:"none", cursor:"pointer", padding:0,
          fontSize:12.5, fontWeight:600, color:T.teal,
          display:"flex", alignItems:"center", gap:4,
          touchAction:"manipulation", WebkitTapHighlightColor:"transparent",
        }}>
          {action} <span style={{ fontSize:13 }}>›</span>
        </button>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 1. TITELBEREICH (Suchleiste entfernt — globale Suche im Header)
// ════════════════════════════════════════════════════════════════
// HOME.1 (2026-07-08, Lars): diese Komponente rendert unter dem Nav-Tab
// key="discover", der in navConfig.js explizit mit Label "Home" beschriftet
// ist (NAV.1A-Entscheidung: feed→"Entdecken", discover→"Home"). Der Titel
// zeigte bisher noch "Entdecken" + Discovery-Marketing-Subline -- eine
// Altlast aus der Zeit vor der Home/Discover-Aufteilung. Jetzt korrekt auf
// den persoenlichen "Zuhause"-Charakter des Home-Bereichs umgestellt.
// Der Nav-Tab mit Label "Entdecken" (key="feed", UnifiedFeed) bleibt
// unveraendert der Ort zum Entdecken neuer Menschen/Werke/Erlebnisse/
// Projekte -- hier wird NUR der Home-Titel angepasst, kein Funktions-/
// Layout-Eingriff. KEIN Bezug auf Tageszeiten (kein "Guten Morgen").
// Komponentenname 'DiscoverTitleBar' bewusst technisch beibehalten (reines
// Implementierungsdetail, keine sichtbare Aenderung durch Umbenennung noetig).
function DiscoverTitleBar({ view, onViewChange }) {
  return (
    <div style={{
      padding:`12px ${T.px}px 14px`,
      background:T.bg,
    }}>
      {/* Title Row */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:22, fontWeight:900, color:T.ink, letterSpacing:"-0.04em" }}>Dein Zuhause auf HUI</span>
        </div>
        {/* View Toggle — oben rechts */}
        <ViewToggle view={view} onChange={onViewChange} />
      </div>
      <div style={{ fontSize:12.5, color:T.inkFaint, marginTop:2, fontWeight:400 }}>
        Der Ort, an dem deine Ideen, Begegnungen und Wirkung zusammenkommen.
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
const SEED_PEOPLE = [
  { id:"p1", name:"Mia Waldmann",  bio:"Naturpädagogin & Waldcoach",       location:"München", avatar:"https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&q=80", impact:4200 },
  { id:"p2", name:"Jonas Kreuz",   bio:"Musiker & Community Builder",      location:"Berlin",  avatar:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80", impact:6800 },
  { id:"p3", name:"Lena Stern",    bio:"Meditationslehrerin & Heilerin",   location:"Hamburg", avatar:"https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80", impact:6100 },
  { id:"p4", name:"Timo Berger",   bio:"Permakultur & Saatgut Hüter",      location:"Freiburg",avatar:"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80", impact:7200 },
  { id:"p5", name:"Anna Kowalski", bio:"Künstlerin & Kreativraum Kuratorin",location:"Wien",   avatar:"https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80", impact:6500 },
  { id:"p6", name:"Felix Braun",   bio:"Tierheim-Aktivist & Hundefreund",  location:"Leipzig", avatar:"https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&q=80", impact:2800 },
];

// Interesse-Tags pro Person — deterministisch aus index
const INTEREST_POOLS = ["Natur","Musik","Kunst","Gemeinschaft","Spiritualität","Nachhaltigkeit","Fotografie","Design","Bildung","Umwelt"];
function personTags(person, max=2) {
  if (person.interests?.length) return person.interests.slice(0,max);
  // deterministisch aus Name-Hashcode
  const code = String(person.name||"").split("").reduce((a,c)=>a+c.charCodeAt(0),0);
  const start = code % INTEREST_POOLS.length;
  return [INTEREST_POOLS[start % INTEREST_POOLS.length], INTEREST_POOLS[(start+3) % INTEREST_POOLS.length]];
}

function PersonCard({ person, onPress, delay=0 }) {
  const [imgErr, setImgErr] = useState(false);
  const av = (!imgErr && person.avatar) ? person.avatar : null;
  const presence = formatPresence(person.last_seen_at);
  const tags = personTags(person, 2);

  return (
    <div className="dp-press dp-in dp-card-hover" onClick={() => onPress?.(person)} style={{
      width:135, flexShrink:0,
      display:"flex", flexDirection:"column", alignItems:"center",
      padding:"14px 10px 12px",
      background:T.white,
      borderRadius:20,
      boxShadow:T.cardShadow,
      border:`1px solid ${T.border}`,
      animationDelay:`${delay}ms`,
      touchAction:"manipulation",
      WebkitTapHighlightColor:"transparent",
      position:"relative",
    }}>
      {/* Avatar + Online-Dot */}
      <div style={{ position:"relative", marginBottom:10 }}>
        <div style={{
          width:72, height:72, borderRadius:"50%", overflow:"hidden",
          border:`2.5px solid ${T.white}`,
          boxShadow:`0 0 0 2.5px rgba(14,196,184,0.30), 0 4px 14px rgba(26,53,48,0.12)`,
          background:av ? "transparent" : T.tealSoft,
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          {av ? (
            <img loading="lazy" decoding="async" src={av} alt={person.name} onError={() => setImgErr(true)}
              style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}/>
          ) : (
            <HUIProfilIcon size={26} style={{opacity:0.4, color:"rgba(14,196,184,0.6)"}} />
          )}
        </div>
        {/* Online-Status Dot */}
        <div style={{
          position:"absolute", bottom:2, right:2,
          width:14, height:14, borderRadius:"50%",
          background: presence?.online ? "#22c55e" : presence ? "rgba(200,200,200,0.9)" : "rgba(200,200,200,0.9)",
          border:"2px solid white",
          boxShadow: presence?.online ? "0 0 0 2px rgba(34,197,94,0.25)" : "none",
        }} className={presence?.online ? "dp-online-pulse" : ""}/>
      </div>

      {/* Name */}
      <div style={{
        fontSize:12.5, fontWeight:700, color:T.ink, textAlign:"center",
        letterSpacing:"-0.02em", lineHeight:1.25, marginBottom:3,
        overflow:"hidden", display:"-webkit-box",
        WebkitLineClamp:2, WebkitBoxOrient:"vertical",
      }}>
        {person.name}
      </div>

      {/* Bio */}
      <div style={{
        fontSize:10.5, color:T.inkSoft, textAlign:"center", lineHeight:1.4,
        marginBottom:6, fontWeight:400,
        overflow:"hidden", display:"-webkit-box",
        WebkitLineClamp:2, WebkitBoxOrient:"vertical",
      }}>
        {person.bio}
      </div>

      {/* Online-Status Text */}
      {presence && (
        <div style={{
          fontSize:10, fontWeight:600, marginBottom:6,
          color: presence.online ? "#22c55e" : "rgba(26,53,48,0.42)",
          display:"flex", alignItems:"center", gap:4,
        }}>
          <span style={{
            display:"inline-block", width:6, height:6, borderRadius:"50%",
            background:presence.dot, flexShrink:0,
          }}/>
          {presence.label}
        </div>
      )}

      {/* Interesse-Tags */}
      <div style={{ display:"flex", gap:4, flexWrap:"wrap", justifyContent:"center", marginBottom:8 }}>
        {tags.map(t => (
          <span key={t} className="dp-tag" style={{ background:"rgba(14,196,184,0.09)", color:T.teal }}>
            {t}
          </span>
        ))}
      </div>

      {/* Location */}
      {person.location && (
        <div style={{
          display:"flex", alignItems:"center", gap:3,
          fontSize:10, color:T.inkFaint, marginBottom:8,
        }}>
          <HUILocationIcon size={9} style={{flexShrink:0}} />
          <span style={{ fontWeight:500 }}>{person.location}</span>
        </div>
      )}

      {/* Impact — stärker hervorgehoben */}
      <div style={{
        display:"flex", alignItems:"center", gap:4,
        background:`linear-gradient(135deg,rgba(14,196,184,0.12),rgba(14,196,184,0.06))`,
        borderRadius:99, padding:"4px 10px",
        border:"1px solid rgba(14,196,184,0.18)",
      }}>
        <span style={{ fontSize:11 }}>⚡</span>
        <span style={{ fontSize:11.5, fontWeight:800, color:T.teal, letterSpacing:"-0.02em" }}>
          {fmtImpact(person.impact)} Wirkung
        </span>
      </div>
    </div>
  );
}

function PeopleSection({ people, onPersonPress, loading, delay=0, view='cards', onSectionAction }) {
  return (
    <div className="dp-in" style={{ animationDelay:`${delay}ms`, marginTop:10 }}>
      <div data-dp-people/>
      <SectionHead
        title="Inspirierende Menschen"
        sub="Entdecke wundervolle Menschen auf HUI."
        action="Alle anzeigen"
        onAction={onSectionAction}
        delay={delay}
      />
      {view === "cards" ? (
        <div className="dp-hscroll" style={{
          display:"flex", gap:10,
          paddingLeft:T.px, paddingRight:T.px, paddingBottom:4,
        }}>
          {loading
            ? Array.from({length:4}).map((_,i) => (
                <div key={i} style={{ width:130, flexShrink:0, borderRadius:20, overflow:"hidden", background:T.white, boxShadow:T.cardShadow, padding:"14px 10px" }}>
                  <Skel w={72} h={72} r={99} mb={10} />
                  <Skel w="80%" h={12} r={8} mb={6} />
                  <Skel w="60%" h={10} r={6} mb={8} />
                  <Skel w="70%" h={10} r={6} />
                </div>
              ))
            : people.map((p, i) => (
                <PersonCard key={p.id} person={p} onPress={onPersonPress} delay={i*40+delay} />
              ))
          }
        </div>
      ) : (
        <div className="dp-list-section dp-toggle-in">
          {loading
            ? Array.from({length:4}).map((_,i) => (
                <div key={i} className="dp-list-card"><Skel w={58} h={58} r={12} /><div style={{flex:1}}><Skel w="70%" h={13} r={6} mb={6}/><Skel w="50%" h={10} r={5}/></div></div>
              ))
            : people.map((p, i) => (
                <div key={p.id} className="dp-list-card" onClick={() => onPersonPress?.(p)}>
                  {p.avatar
                    ? <img loading="lazy" decoding="async" src={p.avatar} alt={p.name} className="dp-list-thumb" onError={e => e.target.style.display='none'}/>
                    : <div className="dp-list-thumb-placeholder" style={{display:"flex",alignItems:"center",justifyContent:"center"}}><HUIProfilIcon size={24} style={{opacity:0.35, color:"rgba(14,196,184,0.5)"}}/></div>
                  }
                  <div style={{ flex:1, overflow:"hidden" }}>
                    <div style={{ fontSize:13.5, fontWeight:700, color:T.ink, marginBottom:3, letterSpacing:"-0.02em" }}>{p.name}</div>
                    <div style={{ fontSize:11.5, color:T.inkSoft, marginBottom:5, overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>{p.bio}</div>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      {p.location && <span style={{ fontSize:11, color:T.inkFaint, display:"flex", alignItems:"center", gap:2 }}><HUILocationIcon size={11}/>{p.location}</span>}
                      <span style={{ fontSize:11, color:T.teal, fontWeight:600 }}>⚡ {fmtImpact(p.impact)}</span>
                    </div>
                  </div>
                </div>
              ))
          }
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 4. MOMENTE AUS DEINER NÄHE
// ════════════════════════════════════════════════════════════════
const SEED_MOMENTE = [
  { id:"m1", src:"https://images.unsplash.com/photo-1448375240586-882707db888b?w=280&q=75", caption:"Waldspaziergang & Waldbaden im Englischen Garten", name:"Mia W.", location:"München",     created_at: new Date(Date.now()-3600000*1).toISOString(),    type:"foto" },
  { id:"m2", src:"https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=280&q=75", caption:"Stille Morgenrunde beim Café Lichtblick",          name:"Lena S.", location:"Hamburg",    created_at: new Date(Date.now()-3600000*2).toISOString(),    type:"foto" },
  { id:"m3", src:"https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=280&q=75", caption:"Akustik Abend im Kiez — alle sind willkommen",     name:"Jonas K.", location:"Berlin",    created_at: new Date(Date.now()-3600000*3).toISOString(),    type:"foto" },
  { id:"m4", src:"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=280&q=75", caption:"Sonnenaufgang Meditation",                         name:"Lena S.", location:"Hamburg",    created_at: new Date(Date.now()-3600000*5).toISOString(),    type:"foto" },
  { id:"m5", src:"https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=280&q=75", caption:"Tierheim Besuchstag – helfen macht glücklich",       name:"Felix B.", location:"Leipzig",    created_at: new Date(Date.now()-3600000*6).toISOString(),    type:"foto" },
  { id:"m6", src:"https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=280&q=75", caption:"Kreativworkshop für Kinder",                      name:"Anne K.", location:"Wien",        created_at: new Date(Date.now()-3600000*8).toISOString(),    type:"foto" },
];

function MomentCard({ moment, delay=0, onPress, onAuthorPress }) {
  const [imgErr, setImgErr] = useState(false);
  const cover = (!imgErr && (moment.src || moment.media_url)) ? (moment.src || moment.media_url) : null;

  return (
    <div className="dp-press dp-in dp-card-hover" onClick={() => onPress?.(moment)} style={{
      width:165, flexShrink:0,
      borderRadius:CARD_RADIUS, overflow:"hidden",
      background:T.white, boxShadow:T.cardShadow,
      border:`1px solid ${T.border}`,
      animationDelay:`${delay}ms`,
      touchAction:"manipulation",
      WebkitTapHighlightColor:"transparent",
      display:"flex", flexDirection:"column",
    }}>
      {/* Cover — identische Höhe wie WerkCard/ErlebnisCard */}
      <div style={{ width:"100%", height:120, flexShrink:0, position:"relative", overflow:"hidden",
        background: cover ? "#1A1A18" : `linear-gradient(135deg,${T.tealSoft},${T.coralSoft})` }}>
        {cover ? (
          <img loading="lazy" decoding="async" src={cover} alt={moment.caption || "Moment"}
            onError={() => setImgErr(true)}
            style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}/>
        ) : (
          <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <HUIFotoIcon size={32} style={{opacity:0.3, color:"rgba(14,196,184,0.5)"}} />
          </div>
        )}

        {/* MOMENT-Badge oben links — identisch zu WERK/ERLEBNIS */}
        <CardBadge pos="left" bg="rgba(244,115,85,0.15)" color={T.coral} cover={cover}>
          MOMENT
        </CardBadge>

        {/* Live-Badge oben rechts (optional) */}
        {moment.isLive && (
          <CardBadge pos="right" bg="rgba(232,87,58,0.92)" color="#fff" cover={false}>
            <span style={{ display:"flex", alignItems:"center", gap:3 }}>
              <span className="dp-live-dot" style={{ width:5,height:5,borderRadius:"50%",background:"white",display:"inline-block" }}/>
              Live
            </span>
          </CardBadge>
        )}
      </div>

      {/* Info — flexGrow:1, flex-column für marginTop:auto */}
      <div style={{ padding:"10px 11px 12px", flexGrow:1, display:"flex", flexDirection:"column" }}>
        {/* Titel (caption) — identisch zu CardTitle */}
        <CardTitle>{moment.caption || moment.subject || "Moment"}</CardTitle>

        {/* Autor */}
        <div style={{ fontSize:10.5, color:T.inkFaint, fontWeight:400, marginBottom:6 }}>
          von{" "}
          <span
            role={moment.user_id ? "button" : undefined}
            onClick={moment.user_id ? (e) => { e.stopPropagation(); onAuthorPress?.(moment.user_id); } : undefined}
            style={{ cursor:moment.user_id?"pointer":"default",
              textDecoration:moment.user_id?"underline dotted":"none", textDecorationColor:"rgba(0,0,0,0.2)" }}
          >{moment.name}</span>
        </div>

        {/* Standort (falls vorhanden) */}
        <div style={{ minHeight:moment.location ? "auto" : 0 }}>
          {moment.location && <CardLocationRow location={moment.location}/>}
        </div>

        {/* Engagement Row — immer am unteren Rand */}
        <div className="dp-engage" style={{ marginTop:"auto", paddingTop:4 }}>
          <span><HUIHeartIcon size={12} /> {moment.likes ?? Math.floor(4 + (moment.id?.charCodeAt?.(moment.id.length-1)??7) % 30)}</span>
          <span><HUIChatIcon size={12} /> {moment.comments ?? Math.floor(1 + (moment.id?.charCodeAt?.(0)??3) % 12)}</span>
        </div>
      </div>
    </div>
  );
}

function MomenteSection({ momente, loading, delay=0, view='cards', onPress, onAuthorPress = () => {}, onSectionAction }) {
  return (
    <div className="dp-in" style={{ marginTop:24, animationDelay:`${delay}ms` }}>
      <div data-dp-momente/>
      <SectionHead
        title="Momente aus deiner Nähe"
        sub="Echte Geschichten, gerade jetzt."
        action="Alle anzeigen"
        onAction={onSectionAction}
        delay={delay}
      />
      {view === "cards" ? (
        <div className="dp-hscroll" style={{ display:"flex", gap:10, paddingLeft:T.px, paddingRight:T.px, paddingBottom:4 }}>
          {loading
            ? Array.from({length:4}).map((_,i) => (
                <div key={i} style={{ width:175, flexShrink:0, borderRadius:18, overflow:"hidden", background:T.white, boxShadow:T.cardShadow }}>
                  <Skel w="100%" h={130} r={0} mb={0}/>
                  <div style={{ padding:"10px 10px" }}><Skel w="80%" h={12} r={6} mb={6}/><Skel w="50%" h={10} r={6}/></div>
                </div>
              ))
            : momente.map((m, i) => <MomentCard key={m.id} moment={m} delay={i*35+delay} onPress={onPress} onAuthorPress={onAuthorPress} />)
          }
        </div>
      ) : (
        <div className="dp-list-section dp-toggle-in">
          {loading
            ? Array.from({length:4}).map((_,i) => (
                <div key={i} className="dp-list-card"><Skel w={58} h={58} r={12}/><div style={{flex:1}}><Skel w="75%" h={12} r={6} mb={6}/><Skel w="45%" h={10} r={5}/></div></div>
              ))
            : momente.map((m) => (
                <div key={m.id} className="dp-list-card" onClick={() => onPress?.(m)} style={{cursor:"pointer"}}>
                  {m.src
                    ? <img loading="lazy" decoding="async" src={m.src} alt={m.caption} className="dp-list-thumb" onError={e => e.target.style.display='none'} style={{ objectFit:"cover" }}/>
                    : <div className="dp-list-thumb-placeholder" style={{display:"flex",alignItems:"center",justifyContent:"center"}}><HUIFotoIcon size={24} style={{opacity:0.3, color:"rgba(14,196,184,0.5)"}}/></div>
                  }
                  <div style={{ flex:1, overflow:"hidden" }}>
                    <div style={{ fontSize:13, fontWeight:600, color:T.ink, marginBottom:4, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", lineHeight:1.35 }}>{m.caption}</div>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <span style={{ fontSize:11, fontWeight:600, color:T.inkSoft }}>{m.name}</span>
                      {m.location && <span style={{ fontSize:11, color:T.inkFaint, display:"flex", alignItems:"center", gap:2 }}><HUILocationIcon size={11}/>{m.location}</span>}
                      <span style={{ fontSize:10.5, color:T.inkFaint }}>{timeAgo(m.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))
          }
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 4b. TALENTE ENTDECKEN (TALENT-DISCOVERY-001, 2026-07-05)
// Zeigt freigegebene Dienstleistungen aus der "talents"-Tabelle
// (TALENT-OFFERS-001/TALENT-SERVICES-001). Gleiches Karten-Layout wie
// "Werke entdecken" (WerkCard/WerkeSection), bewusst als eigene, additive
// Komponente — kein Umbau der bestehenden Werke-Sektion.
// ════════════════════════════════════════════════════════════════
const SEED_TALENTE = [
  { id:"t1", title:"Gitarrenunterricht für Anfänger", category:"Musik & Klang", cover:"https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=280&q=75", author:"Jonas K.", price_per_hour:35, currency:"EUR", location_type:"online" },
  { id:"t2", title:"Personal Yoga Coaching",           category:"Fitness & Bewegung", cover:"https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=280&q=75", author:"Lena S.", price_per_session:60, currency:"EUR", location_type:"vor_ort" },
];

const TALENT_LOCATION_LABEL = { online:"Online", vor_ort:"Vor Ort", hybrid:"Online & Vor Ort" };

// ── Gemeinsame Card-Bausteine (Werk/Erlebnis/Talent) ──────────────
// SUCHKARTEN-VEREINHEITLICHUNG 2026-07-09: TalentCard/WerkCard/ErlebnisCard
// nutzten fast identische, aber leicht abweichende Werte (Eckenradius,
// Titel-/Standort-Abstaende). Auf gemeinsame Bausteine gezogen, damit alle
// drei Discover-Karten wie eine Familie wirken -- Inhalte pro Typ bleiben
// bewusst unterschiedlich (Preis/Status/Datum sind echte Domaenen-Unterschiede,
// keine Inkonsistenz).
const CARD_RADIUS = 16;

function CardBadge({ pos="left", bg, color, cover, children }) {
  return (
    <div style={{
      position:"absolute", top:8, [pos]:8,
      background: cover ? "rgba(0,0,0,0.54)" : bg,
      backdropFilter: "none",
      borderRadius:99, padding:"2px 9px",
      fontSize:9, fontWeight:700,
      color: cover ? "rgba(255,255,255,0.92)" : color,
      letterSpacing:".03em",
    }}>
      {children}
    </div>
  );
}

function CardTitle({ children }) {
  return (
    <div style={{
      fontSize:13, fontWeight:700, color:T.ink,
      marginBottom:3, letterSpacing:"-0.02em", lineHeight:1.25,
      overflow:"hidden", display:"-webkit-box",
      WebkitLineClamp:2, WebkitBoxOrient:"vertical",
    }}>
      {children}
    </div>
  );
}

function CardLocationRow({ location, distanceKm }) {
  if (!location && !Number.isFinite(distanceKm)) return null;
  return (
    <div style={{
      fontSize:10, color:T.inkFaint, marginBottom:6,
      display:"flex", alignItems:"center", gap:3,
    }}>
      <HUILocationIcon size={9} style={{flexShrink:0}} />
      <span style={{ overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>
        {location}{location && Number.isFinite(distanceKm) ? " " : ""}
        {Number.isFinite(distanceKm) ? `${distanceKm.toFixed(0)} km entfernt` : ""}
      </span>
    </div>
  );
}

function TalentCard({ talent, delay=0, onPress, onAuthorPress }) {
  const [imgErr, setImgErr] = useState(false);
  const cover  = (!imgErr && talent.cover) ? talent.cover : null;
  const medCol = MEDIUM_COLOR[talent.category] || { bg:T.tealSoft, text:T.teal };
  const priceStr = talent.price_per_hour != null
    ? parseFloat(talent.price_per_hour).toLocaleString("de-DE", { minimumFractionDigits:0 }) + " €/Std"
    : talent.price_per_session != null
      ? parseFloat(talent.price_per_session).toLocaleString("de-DE", { minimumFractionDigits:0 }) + " €/Termin"
      : null;
  const locationLabel = TALENT_LOCATION_LABEL[talent.location_type] || null;

  return (
    <div className="dp-press dp-in dp-card-hover" onClick={() => onPress?.(talent)} style={{
      width:165, flexShrink:0,
      borderRadius:CARD_RADIUS, overflow:"hidden",
      background:T.white, boxShadow:T.cardShadow,
      border:`1px solid ${T.border}`,
      animationDelay:`${delay}ms`,
      touchAction:"manipulation",
      WebkitTapHighlightColor:"transparent",
      display:"flex", flexDirection:"column",
    }}>
      {/* Cover */}
      <div style={{ width:"100%", height:120, position:"relative", overflow:"hidden", background:cover ? "#1A1A18" : medCol.bg }}>
        {cover ? (
          <img loading="lazy" decoding="async" src={cover} alt={talent.title} onError={() => setImgErr(true)}
            style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}/>
        ) : (
          <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:6 }}>
            <HUIImpactIcon size={32} style={{opacity:0.3, color:"rgba(14,196,184,0.5)"}} />
          </div>
        )}
        {/* Kategorie-Badge oben links */}
        {talent.category && (
          <CardBadge pos="left" bg={medCol.bg} color={medCol.text} cover={cover}>
            {talent.category}
          </CardBadge>
        )}
      </div>

      {/* Info — flex-column damit Preis immer unten sitzt */}
      <div style={{ padding:"10px 11px 12px", display:"flex", flexDirection:"column", flexGrow:1 }}>
        {/* Titel */}
        <CardTitle>{talent.title}</CardTitle>

        {/* Anbieter */}
        <div style={{ fontSize:10.5, color:T.inkFaint, fontWeight:400, marginBottom:6 }}>
          von{" "}
          <span
            role={talent.user_id ? "button" : undefined}
            onClick={talent.user_id ? (e) => { e.stopPropagation(); onAuthorPress?.(talent.user_id); } : undefined}
            style={{ cursor:talent.user_id?"pointer":"default",
              textDecoration:talent.user_id?"underline dotted":"none", textDecorationColor:"rgba(0,0,0,0.2)" }}
          >{talent.author}</span>
        </div>

        {/* Standort/Ort — nimmt Platz ein oder nicht, Preis bleibt unten */}
        <div style={{ minHeight:20 }}>
          <CardLocationRow location={locationLabel} distanceKm={talent.distanceKm}/>
        </div>

        {/* Preis — immer am unteren Rand */}
        <div style={{ marginTop:"auto", paddingTop:4, display:"flex", alignItems:"center" }}>
          {priceStr ? (
            <div style={{ fontSize:14, fontWeight:800, color:T.teal, letterSpacing:"-0.02em" }}>
              {priceStr}
            </div>
          ) : (
            <div style={{ fontSize:10.5, color:T.inkFaint, fontStyle:"italic" }}>Preis auf Anfrage</div>
          )}
        </div>
      </div>
    </div>
  );
}

function TalenteSection({
  talente, loading, delay=0, view='cards', onPress, onAuthorPress = () => {}, onSectionAction,
  locQuery, onLocQueryChange, locSuggest, locSearching, locActive,
  onPickLoc, onClearLoc, radiusKm, radiusStages, onRadiusChange, hiddenNoCoordsCount=0,
}) {
  return (
    <div className="dp-in" style={{ marginTop:24, animationDelay:`${delay}ms` }}>
      <div data-dp-talente/>
      <SectionHead
        title="Talente entdecken"
        sub="Dienstleistungen & Angebote von HUI Talenten."
        action="Alle Talente"
        onAction={onSectionAction}
        delay={delay}
      />

      {/* ── Umkreissuche ── */}
      <div style={{ padding:`0 ${T.px}px`, marginBottom:10 }}>
        {locActive ? (
          <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 10px",
              borderRadius:99, background:T.tealSoft || "rgba(14,196,184,0.1)", border:`1px solid ${T.border}` }}>
              <HUILocationIcon size={12} style={{flexShrink:0}} />
              <span style={{ fontSize:11.5, fontWeight:600, color:T.ink,
                maxWidth:180, overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>
                {locActive.label}
              </span>
              <button onClick={onClearLoc} style={{ background:"none", border:"none", cursor:"pointer",
                color:T.inkFaint, fontSize:14, lineHeight:1, padding:"0 2px" }}>×</button>
            </div>
            {/* Umkreissuche-Vereinheitlichung (2026-07-06): keine eigene
                Werteliste mehr -- radiusStages kommt ausschliesslich aus
                RADIUS_OPTIONS (src/context/RadiusContext.jsx), radiusKm/
                onRadiusChange sind derselbe globale Zustand wie in der
                Hauptsuche. radiusLabel() ist dieselbe Formatierungsfunktion
                wie in SearchCommandCenter -- kein zweiter "Weltweit"-String. */}
            <div style={{ display:"flex", gap:5, overflowX:"auto", WebkitOverflowScrolling:"touch", scrollbarWidth:"none" }}>
              {radiusStages.map(stage => (
                <button key={String(stage)} onClick={() => onRadiusChange(stage)}
                  style={{ flexShrink:0, padding:"5px 10px", borderRadius:99, fontSize:10.5, fontWeight:700,
                    cursor:"pointer", border: radiusKm===stage ? "none" : `1px solid ${T.border}`,
                    background: radiusKm===stage ? T.ink : "none",
                    color: radiusKm===stage ? "#fff" : T.inkFaint, whiteSpace:"nowrap" }}>
                  {radiusLabel(stage)}
                </button>
              ))}
            </div>
            {hiddenNoCoordsCount > 0 && (
              <span style={{ fontSize:10, color:T.inkFaint }}>
                {hiddenNoCoordsCount} Angebot{hiddenNoCoordsCount>1?"e":""} ohne Standortangabe ausgeblendet
              </span>
            )}
          </div>
        ) : (
          <div style={{ position:"relative", maxWidth:320 }}>
            <input value={locQuery} onChange={e => onLocQueryChange(e.target.value)}
              placeholder="Standort eingeben, z.B. Paphos CY"
              style={{ width:"100%", padding:"8px 12px", borderRadius:99,
                border:`1px solid ${T.border}`, outline:"none", fontSize:12,
                color:T.ink, fontFamily:"inherit", boxSizing:"border-box", background:T.white }}/>
            {(locSearching || locSuggest.length > 0) && locQuery.trim().length >= 2 && (
              <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, right:0, zIndex:5,
                borderRadius:12, border:`1px solid ${T.border}`, background:T.white,
                boxShadow:T.cardShadow, overflow:"hidden" }}>
                {locSearching && <div style={{ padding:"8px 10px", fontSize:11, color:T.inkFaint }}>Suche…</div>}
                {!locSearching && locSuggest.map((s,i) => (
                  <button key={i} onClick={() => onPickLoc(s)}
                    style={{ display:"block", width:"100%", textAlign:"left", padding:"8px 10px",
                      background:"none", border:"none", borderTop: i>0 ? `1px solid ${T.border}` : "none",
                      fontSize:11.5, color:T.ink, cursor:"pointer", fontFamily:"inherit" }}>
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      {view === "cards" ? (
        <div className="dp-hscroll" style={{ display:"flex", gap:10, paddingLeft:T.px, paddingRight:T.px, paddingBottom:4 }}>
          {loading
            ? Array.from({length:4}).map((_,i) => (
                <div key={i} style={{ width:165, flexShrink:0, borderRadius:16, overflow:"hidden", background:T.white, boxShadow:T.cardShadow }}>
                  <Skel w="100%" h={120} r={0} mb={0}/>
                  <div style={{ padding:"10px 11px" }}><Skel w="80%" h={12} r={6} mb={6}/><Skel w="50%" h={10} r={6}/></div>
                </div>
              ))
            : talente.map((t, i) => <TalentCardM key={t.id} talent={t} delay={i*35+delay} onPress={onPress} onAuthorPress={onAuthorPress} />)
          }
        </div>
      ) : (
        <div className="dp-list-section dp-toggle-in">
          {loading
            ? Array.from({length:4}).map((_,i) => (
                <div key={i} className="dp-list-card"><Skel w={58} h={58} r={12}/><div style={{flex:1}}><Skel w="75%" h={12} r={6} mb={6}/><Skel w="45%" h={10} r={5}/></div></div>
              ))
            : talente.map((t) => {
                const medCol = MEDIUM_COLOR[t.category] || { bg:T.tealSoft, text:T.teal };
                const priceStr = t.price_per_hour != null
                  ? parseFloat(t.price_per_hour).toLocaleString("de-DE", { minimumFractionDigits:0 }) + " €/Std"
                  : t.price_per_session != null
                    ? parseFloat(t.price_per_session).toLocaleString("de-DE", { minimumFractionDigits:0 }) + " €/Termin"
                    : null;
                return (
                  <div key={t.id} className="dp-list-card" onClick={() => onPress?.(t)}>
                    {t.cover
                      ? <img loading="lazy" decoding="async" src={t.cover} alt={t.title} className="dp-list-thumb" onError={e => e.target.style.display='none'} style={{ objectFit:"cover" }}/>
                      : <div className="dp-list-thumb-placeholder" style={{display:"flex",alignItems:"center",justifyContent:"center"}}><HUIImpactIcon size={24} style={{opacity:0.3, color:"rgba(14,196,184,0.5)"}}/></div>
                    }
                    <div style={{ flex:1, overflow:"hidden" }}>
                      <div style={{ fontSize:13, fontWeight:600, color:T.ink, marginBottom:4, overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>{t.title}</div>
                      <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                        {t.category && (
                          <span style={{ fontSize:10.5, background:medCol.bg, color:medCol.text, borderRadius:99, padding:"2px 8px", fontWeight:600 }}>{t.category}</span>
                        )}
                        {priceStr && (
                          <span style={{ fontSize:12, fontWeight:800, color:T.teal }}>{priceStr}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
          }
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 5. WERKE ENTDECKEN
// ════════════════════════════════════════════════════════════════
const SEED_WERKE = [
  { id:"w1", title:"Farben der Stille",   medium:"Malerei",   cover:"https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=280&q=75",   author:"Anna K.", likes:128 },
  { id:"w2", title:"Seelenklang",          medium:"Musik",     cover:"https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=280&q=75",  author:"Jonas K.", likes:96  },
  { id:"w3", title:"Küstenrauschen",       medium:"Fotografie",cover:"https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=280&q=75",  author:"Timo B.", likes:87  },
  { id:"w4", title:"Freiheitsvogel",       medium:"Illustration",cover:"https://images.unsplash.com/photo-1567359781514-3b964e2b04d6?w=280&q=75",author:"Mia W.", likes:64  },
  { id:"w5", title:"Verbunden",            medium:"Skulptur",  cover:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=280&q=75",     author:"Lena S.", likes:63  },
  { id:"w6", title:"Kleiner Moment",       medium:"Text",      cover:null,                                                                          author:"Felix B.", likes:42  },
];

const MEDIUM_COLOR = {
  "Malerei":    { bg:"rgba(147,51,234,0.12)",  text:"#9333EA" },
  "Musik":      { bg:"rgba(14,196,184,0.12)",  text:T.teal    },
  "Fotografie": { bg:"rgba(22,163,74,0.12)",   text:"#16A34A" },
  "Illustration":{ bg:"rgba(232,87,58,0.12)", text:T.coral    },
  "Skulptur":   { bg:"rgba(245,158,11,0.12)",  text:"#D97706" },
  "Text":       { bg:"rgba(100,116,139,0.12)", text:"#64748B" },
};

function WerkCard({ werk, delay=0, onPress, onAuthorPress }) {
  const [imgErr, setImgErr] = useState(false);
  const cover  = (!imgErr && werk.cover) ? werk.cover : null;
  const medCol = MEDIUM_COLOR[werk.medium] || { bg:T.tealSoft, text:T.teal };
  const priceStr = werk.price != null
    ? parseFloat(werk.price).toLocaleString("de-DE", { minimumFractionDigits:0 }) + " €"
    : null;

  return (
    <div className="dp-press dp-in dp-card-hover" onClick={() => onPress?.(werk)} style={{
      width:165, flexShrink:0,
      borderRadius:CARD_RADIUS, overflow:"hidden",
      background:T.white, boxShadow:T.cardShadow,
      border:`1px solid ${T.border}`,
      animationDelay:`${delay}ms`,
      touchAction:"manipulation",
      WebkitTapHighlightColor:"transparent",
      display:"flex", flexDirection:"column",
    }}>
      {/* Cover — feste Höhe, nie gestaucht */}
      <div style={{ width:"100%", height:120, flexShrink:0, position:"relative", overflow:"hidden", background:cover ? "#1A1A18" : medCol.bg }}>
        {cover ? (
          <img loading="lazy" decoding="async" src={cover} alt={werk.title} onError={() => setImgErr(true)}
            style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}/>
        ) : (
          <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:6 }}>
            <HUIWerkeIcon size={32} style={{opacity:0.3, color:"rgba(14,196,184,0.5)"}} />
          </div>
        )}
        {/* Kategorie-Badge oben links */}
        {werk.medium && (
          <CardBadge pos="left" bg={medCol.bg} color={medCol.text} cover={cover}>
            {werk.medium}
          </CardBadge>
        )}
      </div>

      {/* Info — flexGrow:1 füllt den Rest, flex-column für marginTop:auto */}
      <div style={{ padding:"10px 11px 12px", flexGrow:1, display:"flex", flexDirection:"column" }}>
        {/* Titel */}
        <CardTitle>{werk.title}</CardTitle>

        {/* Autor */}
        <div style={{ fontSize:10.5, color:T.inkFaint, fontWeight:400, marginBottom:6 }}>
          von{" "}
          <span
            role={werk.user_id ? "button" : undefined}
            onClick={werk.user_id ? (e) => { e.stopPropagation(); onAuthorPress?.(werk.user_id); } : undefined}
            style={{ cursor:werk.user_id?"pointer":"default",
              textDecoration:werk.user_id?"underline dotted":"none", textDecorationColor:"rgba(0,0,0,0.2)" }}
          >{werk.author}</span>
        </div>

        {/* Standort — reservierter Platz damit Preis nicht springt */}
        <div style={{ minHeight:20 }}>
          <CardLocationRow location={werk.location} distanceKm={werk.distanceKm}/>
        </div>

        {/* Preis — immer am unteren Rand, unabhängig vom Ort */}
        <div style={{ marginTop:"auto", paddingTop:4 }}>
          <div style={{ display:"flex", alignItems:"center", marginBottom:6 }}>
            {priceStr ? (
              <div style={{ fontSize:14, fontWeight:800, color:T.teal, letterSpacing:"-0.02em" }}>
                {priceStr}
              </div>
            ) : (
              <div style={{ fontSize:10.5, color:T.inkFaint, fontStyle:"italic" }}>Nicht zum Verkauf</div>
            )}
          </div>
          {/* Likes + Views */}
          <div className="dp-engage">
            <span><HUIHeartIcon size={12} /> {werk.likes ?? Math.floor(5 + (werk.id?.charCodeAt?.(werk.id.length-1)??9) % 40)}</span>
            <span style={{display:"flex",alignItems:"center",gap:2}}><HUIAnsichtIcon size={12}/>{werk.views ?? Math.floor(50 + (werk.id?.charCodeAt?.(0)??5) % 400)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Umkreissuche-Zeile fuer Werke/Erlebnisse -- identisches UI-Muster wie in
 * TalenteSection (siehe dort), nutzt aber denselben globalen radius-Zustand
 * (radiusKm/radiusStages/onRadiusChange kommen 1:1 aus useRadiusFilter()).
 * Bewusst als eigene kleine Komponente statt TalenteSection zu refactorn --
 * geringeres Konfliktrisiko mit der parallel laufenden Radius-Vereinheit-
 * lichungs-Session, gleiches Verhalten.
 */
function LocationRadiusRow({
  locQuery, onLocQueryChange, locSuggest, locSearching, locActive,
  onPickLoc, onClearLoc, radiusKm, radiusStages, onRadiusChange, hiddenNoCoordsCount=0,
}) {
  return (
    <div style={{ padding:`0 ${T.px}px`, marginBottom:10 }}>
      {locActive ? (
        <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 10px",
            borderRadius:99, background:T.tealSoft || "rgba(14,196,184,0.1)", border:`1px solid ${T.border}` }}>
            <HUILocationIcon size={12} style={{flexShrink:0}} />
            <span style={{ fontSize:11.5, fontWeight:600, color:T.ink,
              maxWidth:180, overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>
              {locActive.label}
            </span>
            <button onClick={onClearLoc} style={{ background:"none", border:"none", cursor:"pointer",
              color:T.inkFaint, fontSize:14, lineHeight:1, padding:"0 2px" }}>×</button>
          </div>
          <div style={{ display:"flex", gap:5, overflowX:"auto", WebkitOverflowScrolling:"touch", scrollbarWidth:"none" }}>
            {(radiusStages || [10,25,50,100]).map(stage => (
              <button key={String(stage)} onClick={() => onRadiusChange(stage)}
                style={{ flexShrink:0, padding:"5px 10px", borderRadius:99, fontSize:10.5, fontWeight:700,
                  cursor:"pointer", border: radiusKm===stage ? "none" : `1px solid ${T.border}`,
                  background: radiusKm===stage ? T.ink : "none",
                  color: radiusKm===stage ? "#fff" : T.inkFaint, whiteSpace:"nowrap" }}>
                {stage === "world" ? "Weltweit 🌍" : `${stage} km`}
              </button>
            ))}
          </div>
          {hiddenNoCoordsCount > 0 && (
            <span style={{ fontSize:10, color:T.inkFaint }}>
              {hiddenNoCoordsCount} Eintrag{hiddenNoCoordsCount>1?"e":""} ohne Standortangabe ausgeblendet
            </span>
          )}
        </div>
      ) : (
        <div style={{ position:"relative", maxWidth:320 }}>
          <input value={locQuery} onChange={e => onLocQueryChange(e.target.value)}
            placeholder="Standort eingeben, z.B. Paphos CY"
            style={{ width:"100%", padding:"8px 12px", borderRadius:99,
              border:`1px solid ${T.border}`, outline:"none", fontSize:12,
              color:T.ink, fontFamily:"inherit", boxSizing:"border-box", background:T.white }}/>
          {(locSearching || locSuggest.length > 0) && locQuery.trim().length >= 2 && (
            <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, right:0, zIndex:5,
              borderRadius:12, border:`1px solid ${T.border}`, background:T.white,
              boxShadow:T.cardShadow, overflow:"hidden" }}>
              {locSearching && <div style={{ padding:"8px 10px", fontSize:11, color:T.inkFaint }}>Suche…</div>}
              {!locSearching && locSuggest.map((s,i) => (
                <button key={i} onClick={() => onPickLoc(s)}
                  style={{ display:"block", width:"100%", textAlign:"left", padding:"8px 10px",
                    background:"none", border:"none", borderTop: i>0 ? `1px solid ${T.border}` : "none",
                    fontSize:11.5, color:T.ink, cursor:"pointer", fontFamily:"inherit" }}>
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function WerkeSection({
  werke, loading, delay=0, view='cards', onPress, onAuthorPress = () => {}, onSectionAction,
  locQuery, onLocQueryChange, locSuggest, locSearching, locActive,
  onPickLoc, onClearLoc, radiusKm, radiusStages, onRadiusChange, hiddenNoCoordsCount=0,
}) {
  return (
    <div className="dp-in" style={{ marginTop:24, animationDelay:`${delay}ms` }}>
      <div data-dp-werke/>
      <SectionHead
        title="Werke entdecken"
        sub="Kunst, Musik, Fotografie & mehr von der HUI Community."
        action="Alle Werke"
        onAction={onSectionAction}
        delay={delay}
      />
      <LocationRadiusRow
        locQuery={locQuery} onLocQueryChange={onLocQueryChange}
        locSuggest={locSuggest} locSearching={locSearching} locActive={locActive}
        onPickLoc={onPickLoc} onClearLoc={onClearLoc}
        radiusKm={radiusKm} radiusStages={radiusStages} onRadiusChange={onRadiusChange}
        hiddenNoCoordsCount={hiddenNoCoordsCount}
      />
      {view === "cards" ? (
        <div className="dp-hscroll" style={{ display:"flex", gap:10, paddingLeft:T.px, paddingRight:T.px, paddingBottom:4 }}>
          {loading
            ? Array.from({length:4}).map((_,i) => (
                <div key={i} style={{ width:145, flexShrink:0, borderRadius:16, overflow:"hidden", background:T.white, boxShadow:T.cardShadow }}>
                  <Skel w="100%" h={100} r={0} mb={0}/>
                  <div style={{ padding:"9px 10px" }}><Skel w="75%" h={12} r={6} mb={6}/><Skel w="50%" h={10} r={5}/></div>
                </div>
              ))
            : werke.map((w, i) => <WerkCardM key={w.id} werk={w} delay={i*35+delay} onPress={onPress} onAuthorPress={onAuthorPress} />)
          }
        </div>
      ) : (
        <div className="dp-list-section dp-toggle-in">
          {loading
            ? Array.from({length:4}).map((_,i) => (
                <div key={i} className="dp-list-card"><Skel w={58} h={58} r={12}/><div style={{flex:1}}><Skel w="70%" h={12} r={6} mb={6}/><Skel w="40%" h={10} r={5}/></div></div>
              ))
            : werke.map((w) => {
                const medCol = MEDIUM_COLOR[w.medium] || { bg:T.tealSoft, text:T.teal };
                const priceStr = w.price != null
                  ? parseFloat(w.price).toLocaleString("de-DE", { minimumFractionDigits:0 }) + " €"
                  : null;
                return (
                  <div key={w.id} className="dp-list-card" onClick={() => onPress?.(w)} style={{cursor:"pointer"}}>
                    <div className="dp-list-thumb-placeholder" style={{ background: w.cover ? "#1A1A18" : medCol.bg }}>
                      {w.cover
                        ? <img loading="lazy" decoding="async" src={w.cover} alt={w.title} style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius:12 }} onError={e => e.currentTarget.style.display="none"}/>
                        : <span style={{ fontSize:20 }}>🎨</span>
                      }
                    </div>
                    <div style={{ flex:1, overflow:"hidden" }}>
                      <div style={{ fontSize:13.5, fontWeight:700, color:T.ink, marginBottom:2, letterSpacing:"-0.02em",
                        overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>{w.title}</div>
                      <div style={{ fontSize:11.5, color:T.inkFaint, marginBottom:4 }}>von {w.author}</div>
                      {w.location && (
                        <div style={{ fontSize:10.5, color:T.inkFaint, marginBottom:4, display:"flex", alignItems:"center", gap:3 }}>
                          <HUILocationIcon size={9} style={{flexShrink:0}} />
                          <span style={{ overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>{w.location}</span>
                        </div>
                      )}
                      <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                        {w.medium && (
                          <span style={{ fontSize:10.5, background:medCol.bg, color:medCol.text, borderRadius:99, padding:"2px 8px", fontWeight:600 }}>{w.medium}</span>
                        )}
                        {priceStr && (
                          <span style={{ fontSize:12, fontWeight:800, color:T.teal }}>{priceStr}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
          }
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 6. ERLEBNISSE FÜR DICH
// ════════════════════════════════════════════════════════════════
const SEED_ERLEBNISSE = [
  { id:"e1", title:"Yoga im Park",              date:"30", month:"Mai",  dayLabel:"Heute",  time:"18:00", location:"München",  spots:12, cover:"https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=280&q=75" },
  { id:"e2", title:"Urban Gardening Workshop",  date:"31", month:"Mai",  dayLabel:"Morgen", time:"10:00", location:"Hamburg",  spots:8,  cover:"https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=280&q=75" },
  { id:"e3", title:"Gitarre für Anfänger",      date:"02", month:"Jun",  dayLabel:"Mo",     time:"19:00", location:"Berlin",   spots:6,  cover:"https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=280&q=75" },
  { id:"e4", title:"Acryl Malen für Einsteiger",date:"04", month:"Jun",  dayLabel:"Mi",     time:"17:00", location:"Leipzig",  spots:7,  cover:"https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=280&q=75" },
  { id:"e5", title:"Sonnenaufgang Wanderung",   date:"06", month:"Jun",  dayLabel:"Fr",     time:"05:00", location:"Freiburg", spots:10, cover:"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=280&q=75" },
  { id:"e6", title:"Tierheim Helfer Tag",       date:"07", month:"Jun",  dayLabel:"Sa",     time:"11:00", location:"Leipzig",  spots:9,  cover:"https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=280&q=75" },
];

function ErlebnisCard({ erlebnis, delay=0, onPress }) {
  const [imgErr, setImgErr] = useState(false);
  const cover = (!imgErr && erlebnis.cover) ? erlebnis.cover : null;

  // Status-Farben
  const STATUS_DOT = {
    "Aktiv":        "#16A34A",
    "Geplant":      "#D97706",
    "Abgeschlossen":"rgba(26,26,46,0.35)",
  };
  const statusDot   = STATUS_DOT[erlebnis.statusLabel] || T.inkFaint;
  const statusColor = erlebnis.statusColor || T.inkFaint;

  return (
    <div className="dp-press dp-in dp-card-hover" onClick={() => onPress?.(erlebnis)} style={{
      width:165, flexShrink:0,
      borderRadius:CARD_RADIUS, overflow:"hidden",
      background:T.white, boxShadow:T.cardShadow,
      border:`1px solid ${T.border}`,
      animationDelay:`${delay}ms`,
      touchAction:"manipulation",
      WebkitTapHighlightColor:"transparent",
    }}>
      {/* Cover */}
      <div style={{ width:"100%", height:120, position:"relative", overflow:"hidden", background:cover ? "#1A1A18" : T.tealSoft }}>
        {cover ? (
          <img loading="lazy" decoding="async" src={cover} alt={erlebnis.title} onError={() => setImgErr(true)}
            style={{ width:"100%", height:"100%", objectFit:"cover", display:"block", opacity:0.88 }}/>
        ) : (
          <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <HUIKalenderIcon size={36} style={{opacity:0.35, color:"rgba(14,196,184,0.5)"}} />
          </div>
        )}

        {/* Datum-Block oben links — nur wenn Datum vorhanden */}
        {erlebnis.date && (
          <div style={{
            position:"absolute", top:8, left:8,
            background:"rgba(255,255,255,0.94)", backdropFilter:"blur(8px)",
            borderRadius:10, padding:"5px 9px", textAlign:"center", minWidth:36,
          }}>
            <div style={{ fontSize:16, fontWeight:900, color:T.ink, lineHeight:1 }}>
              {erlebnis.date}
            </div>
            {erlebnis.month && (
              <div style={{ fontSize:8.5, fontWeight:700, color:T.inkSoft, textTransform:"uppercase", letterSpacing:".04em", marginTop:1 }}>
                {erlebnis.month}
              </div>
            )}
          </div>
        )}

        {/* Typ-Badge oben rechts */}
        {erlebnis.typeLabel && (
          <CardBadge pos="right" bg="rgba(14,196,184,0.15)" color={T.teal} cover={cover}>
            {erlebnis.typeLabel}
          </CardBadge>
        )}
      </div>

      {/* Info */}
      <div style={{ padding:"10px 11px 12px" }}>
        {/* Titel */}
        <CardTitle>{erlebnis.title}</CardTitle>

        {/* Standort */}
        <CardLocationRow location={erlebnis.location} distanceKm={erlebnis.distanceKm}/>

        {/* Dauer falls vorhanden */}
        {erlebnis.time && (
          <div style={{ fontSize:10.5, color:T.teal, fontWeight:600, marginBottom:4 }}>
            {erlebnis.time}
          </div>
        )}

        {/* Status-Dot */}
        {/* Status + Likes Row */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop: erlebnis.statusLabel ? 0 : 0 }}>
          {erlebnis.statusLabel && (
            <div style={{ display:"flex", alignItems:"center", gap:5 }}>
              <span style={{
                width:6, height:6, borderRadius:"50%",
                background:statusDot, flexShrink:0, display:"inline-block",
              }}/>
              <span style={{ fontSize:10.5, fontWeight:600, color:statusColor }}>
                {erlebnis.statusLabel}
              </span>
            </div>
          )}
          {erlebnis.likes > 0 && (
            <span style={{ display:"flex", alignItems:"center", gap:3, fontSize:10.5, color:T.coral, fontWeight:700 }}>
              <HUIHeartIcon size={11} /> {erlebnis.likes}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function ErlebnisseSection({
  erlebnisse, loading, delay=0, view='cards', onPress, onSectionAction,
  locQuery, onLocQueryChange, locSuggest, locSearching, locActive,
  onPickLoc, onClearLoc, radiusKm, radiusStages, onRadiusChange, hiddenNoCoordsCount=0,
}) {
  return (
    <div className="dp-in" style={{ marginTop:24, animationDelay:`${delay}ms` }}>
      <div data-dp-erlebnisse/>
      <SectionHead
        title="Erlebnisse für dich"
        sub="Workshops, Treffen, Kurse & besondere Momente."
        action="Alle Erlebnisse"
        onAction={onSectionAction}
        delay={delay}
      />
      <LocationRadiusRow
        locQuery={locQuery} onLocQueryChange={onLocQueryChange}
        locSuggest={locSuggest} locSearching={locSearching} locActive={locActive}
        onPickLoc={onPickLoc} onClearLoc={onClearLoc}
        radiusKm={radiusKm} radiusStages={radiusStages} onRadiusChange={onRadiusChange}
        hiddenNoCoordsCount={hiddenNoCoordsCount}
      />
      {view === "cards" ? (
        <div className="dp-hscroll" style={{ display:"flex", gap:10, paddingLeft:T.px, paddingRight:T.px, paddingBottom:4 }}>
          {loading
            ? Array.from({length:4}).map((_,i) => (
                <div key={i} style={{ width:155, flexShrink:0, borderRadius:CARD_RADIUS, overflow:"hidden", background:T.white, boxShadow:T.cardShadow }}>
                  <Skel w="100%" h={105} r={0} mb={0}/>
                  <div style={{ padding:"10px 10px" }}><Skel w="80%" h={12} r={6} mb={6}/><Skel w="55%" h={10} r={5}/></div>
                </div>
              ))
            : erlebnisse.map((e, i) => <ErlebnisCardM key={e.id} erlebnis={e} delay={i*35+delay} onPress={onPress} />)
          }
        </div>
      ) : (
        <div className="dp-list-section dp-toggle-in">
          {loading
            ? Array.from({length:4}).map((_,i) => (
                <div key={i} className="dp-list-card"><Skel w={58} h={58} r={12}/><div style={{flex:1}}><Skel w="75%" h={12} r={6} mb={6}/><Skel w="50%" h={10} r={5}/></div></div>
              ))
            : erlebnisse.map((e) => {
                const statusDot = {
                  "Aktiv":"#16A34A", "Geplant":"#D97706",
                }[e.statusLabel] || "rgba(26,26,46,0.30)";
                return (
                  <div key={e.id} className="dp-list-card">
                    <div className="dp-list-thumb-placeholder" style={{ background: e.cover ? "#1A1A18" : T.tealSoft, position:"relative", overflow:"hidden" }}>
                      {e.cover
                        ? <img loading="lazy" decoding="async" src={e.cover} alt={e.title} style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} onError={ev => ev.currentTarget.style.display="none"}/>
                        : <HUIKalenderIcon size={20} style={{color:"rgba(14,196,184,0.5)"}} />
                      }
                      {e.date && (
                        <div style={{ position:"absolute", bottom:3, left:0, right:0, textAlign:"center",
                          background:"rgba(0,0,0,0.45)", padding:"1px 0" }}>
                          <span style={{ fontSize:9, fontWeight:800, color:"white" }}>{e.date} {e.month}</span>
                        </div>
                      )}
                    </div>
                    <div style={{ flex:1, overflow:"hidden" }}>
                      <div style={{ fontSize:13.5, fontWeight:700, color:T.ink, marginBottom:2, letterSpacing:"-0.02em",
                        overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>{e.title}</div>
                      {e.typeLabel && (
                        <div style={{ fontSize:11, color:T.teal, fontWeight:600, marginBottom:3 }}>{e.typeLabel}</div>
                      )}
                      {e.location && (
                        <div style={{ fontSize:11, color:T.inkFaint, marginBottom:3, display:"flex", alignItems:"center", gap:2 }}><HUILocationIcon size={11}/>{e.location}</div>
                      )}
                      {e.statusLabel && (
                        <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                          <span style={{ width:6, height:6, borderRadius:"50%", background:statusDot, display:"inline-block" }}/>
                          <span style={{ fontSize:10.5, fontWeight:600, color:e.statusColor }}>{e.statusLabel}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
          }
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 7. PROJEKTE & INITIATIVEN
// ════════════════════════════════════════════════════════════════
const SEED_PROJEKTE = [
  { id:"pr1", title:"Stadtgarten Netz",    desc:"Gemeinschaftliche Gärten in 12 Städten",              members:47, cat:"Natur",     cover:"https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=280&q=75", catColor:{ bg:"rgba(22,163,74,0.12)", text:"#16A34A" } },
  { id:"pr2", title:"Tierheim Netzwerk",   desc:"Moralische Unterstützung & Vermittlung",               members:133,cat:"Tiere",     cover:"https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=280&q=75", catColor:{ bg:"rgba(217,119,6,0.12)", text:"#D97706" } },
  { id:"pr3", title:"Küsten Cleanup",      desc:"Kostenlose Aktionen für unsere Meere",                members:89, cat:"Umwelt",    cover:"https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=280&q=75", catColor:{ bg:"rgba(14,196,184,0.12)", text:T.teal    } },
  { id:"pr4", title:"Musik für alle",      desc:"Kostenlose Konzerte in Parks",                        members:63, cat:"Kultur",    cover:"https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=280&q=75", catColor:{ bg:"rgba(99,102,241,0.12)", text:"#6366F1" } },
  { id:"pr5", title:"Kunst für Kinder",    desc:"Kreativworkshops für Kinder & Jugendliche",            members:76, cat:"Bildung",   cover:"https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=280&q=75", catColor:{ bg:"rgba(232,87,58,0.12)", text:T.coral   } },
  { id:"pr6", title:"Klima Zukunft",       desc:"Bildung & Aktionen für eine bessere Welt",            members:54, cat:"Klima",     cover:"https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=280&q=75", catColor:{ bg:"rgba(22,163,74,0.12)", text:"#16A34A" } },
];

function ProjektCard({ projekt, delay=0, onPress }) {
  const [imgErr, setImgErr] = useState(false);
  const cover = (!imgErr && projekt.cover) ? projekt.cover : null;
  const cc = projekt.catColor || { bg:"rgba(34,197,94,0.12)", text:"#16A34A" };
  const membersStr = projekt.members != null
    ? (projekt.members > 0 ? projekt.members.toLocaleString("de-DE") + " Stimmen" : "Jetzt unterstützen")
    : null;

  return (
    <div className="dp-press dp-in dp-card-hover" onClick={() => onPress?.(projekt)} style={{
      width:165, flexShrink:0,
      borderRadius:CARD_RADIUS, overflow:"hidden",
      background:T.white, boxShadow:T.cardShadow,
      border:`1px solid ${T.border}`,
      animationDelay:`${delay}ms`,
      touchAction:"manipulation",
      WebkitTapHighlightColor:"transparent",
      display:"flex", flexDirection:"column",
    }}>
      {/* Cover — feste Höhe, identisch zu WerkCard / TalentCard */}
      <div style={{ width:"100%", height:120, flexShrink:0, position:"relative", overflow:"hidden", background:cover ? "#1A1A18" : cc.bg }}>
        {cover ? (
          <img loading="lazy" decoding="async" src={cover} alt={projekt.title} onError={() => setImgErr(true)}
            style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}/>
        ) : (
          <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:6 }}>
            <HUIImpactIcon size={32} style={{opacity:0.3, color:"rgba(34,197,94,0.5)"}} />
          </div>
        )}
        {/* Kategorie-Badge oben links */}
        {projekt.cat && (
          <CardBadge pos="left" bg={cc.bg} color={cc.text} cover={cover}>
            {projekt.cat}
          </CardBadge>
        )}
      </div>

      {/* Info — flex-column damit Footer immer unten sitzt */}
      <div style={{ padding:"10px 11px 12px", flexGrow:1, display:"flex", flexDirection:"column" }}>
        {/* Titel */}
        <CardTitle>{projekt.title}</CardTitle>

        {/* Beschreibung */}
        <div style={{ fontSize:10.5, color:T.inkFaint, lineHeight:1.4, marginBottom:6,
          overflow:"hidden", display:"-webkit-box",
          WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
          {projekt.desc}
        </div>

        {/* Mitglieder — immer am unteren Rand */}
        <div style={{ marginTop:"auto", paddingTop:4, display:"flex", alignItems:"center", gap:4 }}>
          {membersStr ? (
            <>
              <HUIPersonenIcon size={11} style={{flexShrink:0, color:"rgba(34,197,94,0.8)"}} />
              <span style={{ fontSize:10.5, fontWeight:600, color:"rgba(34,197,94,0.9)" }}>{membersStr}</span>
            </>
          ) : (
            <span style={{ fontSize:10.5, color:T.inkFaint, fontStyle:"italic" }}>Mitmachen</span>
          )}
        </div>
      </div>
    </div>
  );
}

function ProjekteSection({ projekte, loading, delay=0, view='cards', onPress, onSectionAction }) {
  const allProjekte = projekte.length > 0 ? projekte : SEED_PROJEKTE;
  const hero = allProjekte[0];
  const rest = allProjekte.slice(1);
  return (
    <div className="dp-in" style={{ marginTop:24, animationDelay:`${delay}ms` }}>
      <div data-dp-projekte/>
      <SectionHead
        title="Projekte & Initiativen"
        sub="Gemeinsam echte Wirkung schaffen."
        action="Alle Projekte"
        onAction={onSectionAction}
        delay={delay}
      />
      {view === "cards" ? (
        <div style={{ paddingLeft:T.px, paddingRight:T.px }}>
          {/* ── Hero: Projekt der Woche ── */}
          {!loading && hero && (
            <div className="dp-projekt-hero dp-in" onClick={() => onPress?.(hero)} style={{
              position:"relative", borderRadius:20, overflow:"hidden",
              cursor:"pointer",
              height:180, marginBottom:10,
              background: hero.cover ? "#000" : "linear-gradient(135deg,rgba(14,196,184,0.15),rgba(232,87,58,0.10))",
              boxShadow:"0 6px 24px rgba(26,53,48,0.12)",
              animationDelay:`${delay}ms`,
            }}>
              {hero.cover && (
                <img loading="lazy" decoding="async" src={hero.cover} alt={hero.title}
                  style={{ position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",opacity:0.75 }}
                  onError={e => e.target.style.display="none"}/>
              )}
              {/* Gradient */}
              <div style={{ position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,0.80) 0%,rgba(0,0,0,0.10) 60%)" }}/>
              {/* Badge */}
              <div style={{
                position:"absolute",top:12,left:12,
                background:"#D97706", borderRadius:99,
                padding:"3px 10px", fontSize:9.5, fontWeight:800,
                color:"white", letterSpacing:".04em",
              }}>🔥 Projekt der Woche</div>
              {/* Content */}
              <div style={{ position:"absolute",bottom:14,left:14,right:14 }}>
                <div style={{ fontSize:17, fontWeight:900, color:"white", letterSpacing:"-0.03em", marginBottom:4, lineHeight:1.2 }}>
                  {hero.title}
                </div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.72)", marginBottom:10, lineHeight:1.4 }}>
                  {hero.desc}
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.80)", display:"flex", alignItems:"center", gap:4 }}>
                    <span style={{display:"flex",alignItems:"center",gap:4}}><HUIPersonenIcon size={14}/><span>{hero.members > 0 ? `${hero.members} Stimmen` : "Jetzt unterstützen"}</span></span>
                  </div>
                  <div onClick={() => onPress?.(hero)} style={{
                    background:"rgba(14,196,184,0.90)", backdropFilter:"blur(8px)",
                    borderRadius:99, padding:"5px 14px",
                    fontSize:11, fontWeight:700, color:"white",
                    cursor:"pointer", touchAction:"manipulation",
                    WebkitTapHighlightColor:"transparent",
                  }}>Projekt ansehen →</div>
                </div>
              </div>
            </div>
          )}
          {/* ── Restliche Projekte — horizontal scrollbar ── */}
          <div className="dp-hscroll" style={{ display:"flex", gap:10, paddingBottom:4 }}>
            {loading
              ? Array.from({length:4}).map((_,i) => (
                  <div key={i} style={{ width:165, flexShrink:0, borderRadius:CARD_RADIUS, overflow:"hidden", background:T.white, boxShadow:T.cardShadow }}>
                    <Skel w="100%" h={120} r={0} mb={0}/>
                    <div style={{ padding:"10px 11px" }}><Skel w="75%" h={12} r={6} mb={6}/><Skel w="60%" h={10} r={5} mb={6}/><Skel w="50%" h={10} r={5}/></div>
                  </div>
                ))
              : rest.map((p, i) => <ProjektCard key={p.id} projekt={p} delay={i*35+delay} onPress={onPress} />)
            }
          </div>
        </div>
      ) : (
        <div className="dp-list-section dp-toggle-in">
          {loading
            ? Array.from({length:4}).map((_,i) => (
                <div key={i} className="dp-list-card"><Skel w={58} h={58} r={12}/><div style={{flex:1}}><Skel w="70%" h={12} r={6} mb={6}/><Skel w="50%" h={10} r={5}/></div></div>
              ))
            : projekte.map((p) => {
                const cc = p.catColor || { bg:T.tealSoft, text:T.teal };
                return (
                  <div key={p.id} className="dp-list-card" onClick={() => onPress?.(p)} style={{cursor:"pointer"}}>
                    <div className="dp-list-thumb-placeholder" style={{ background:cc.bg, position:"relative", overflow:"hidden" }}>
                      {p.cover
                        ? <img loading="lazy" decoding="async" src={p.cover} alt={p.title} style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", opacity:0.85 }} onError={ev => ev.target.style.display='none'}/>
                        : <span>🌍</span>
                      }
                    </div>
                    <div style={{ flex:1, overflow:"hidden" }}>
                      <div style={{ fontSize:13.5, fontWeight:700, color:T.ink, marginBottom:2, letterSpacing:"-0.02em" }}>{p.title}</div>
                      <div style={{ fontSize:11.5, color:T.inkSoft, marginBottom:5, overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>{p.desc}</div>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ fontSize:11, background:cc.bg, color:cc.text, borderRadius:99, padding:"1px 7px", fontWeight:600 }}>{p.cat}</span>
                        <span style={{ fontSize:11, color:T.inkFaint, display:"flex", alignItems:"center", gap:2 }}><HUIPersonenIcon size={11}/>{p.members} Mitgl.</span>
                      </div>
                    </div>
                  </div>
                );
              })
          }
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 8. ORTE ENTDECKEN
// ════════════════════════════════════════════════════════════════
const SEED_ORTE = [
  { id:"o1", name:"Waldlichtung",      city:"München",  dist:"0,3 km",  active:8,  nextEvent:null,           cover:"https://images.unsplash.com/photo-1448375240586-882707db888b?w=200&q=75"  },
  { id:"o2", name:"Community Garten",  city:"Hamburg",  dist:"1,2 km",  active:12, nextEvent:null,           cover:"https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=200&q=75"  },
  { id:"o3", name:"Atelier Raum",      city:"Berlin",   dist:"2,7 km",  active:9,  nextEvent:null,           cover:"https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=200&q=75"  },
  { id:"o4", name:"Meditationsraum",   city:"Freiburg", dist:"3,1 km",  active:7,  nextEvent:"morgen",       cover:"https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=200&q=75"     },
  { id:"o5", name:"Tierheim Treffpunkt",city:"Leipzig", dist:"4,0 km",  active:6,  nextEvent:"Heute 3 Begegnungen", cover:"https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=200&q=75"},
  { id:"o6", name:"Kreativwerkstatt",  city:"Wien",     dist:"4,5 km",  active:9,  nextEvent:null,           cover:"https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=200&q=75"  },
];

function OrteSection({ onMap, delay=0, view='cards' }) {
  return (
    <div className="dp-in" style={{ marginTop:24, animationDelay:`${delay}ms` }}>
      <SectionHead
        title="Orte entdecken"
        sub="Besondere HUI-Räume, Parks & Begegnungsorte."
        action="Alle Orte"
        onAction={() => setShowOrteModal(true)}
        delay={delay}
      />
      {view === "cards" ? (
        <div className="dp-hscroll" style={{ display:"flex", gap:8, paddingLeft:T.px, paddingRight:T.px, paddingBottom:4 }}>
          {SEED_ORTE.map((ort, i) => <OrtCard key={ort.id} ort={ort} delay={i*30+delay} onMap={onMap} />)}
        </div>
      ) : (
        <div className="dp-list-section dp-toggle-in">
          {SEED_ORTE.map((ort) => (
            <div key={ort.id} className="dp-list-card" onClick={onMap}>
              <div className="dp-list-thumb-placeholder" style={{ position:"relative", overflow:"hidden" }}>
                {ort.cover
                  ? <img loading="lazy" decoding="async" src={ort.cover} alt={ort.name} style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} onError={e => e.target.style.display='none'}/>
                  : <HUILocationIcon size={11} style={{flexShrink:0}} />
                }
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13.5, fontWeight:700, color:T.ink, marginBottom:2, letterSpacing:"-0.02em" }}>{ort.name}</div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:11.5, color:T.inkFaint, display:"flex", alignItems:"center", gap:2 }}><HUILocationIcon size={11}/>{ort.city}</span>
                  {ort.dist !== "—" && <span style={{ fontSize:11, background:T.tealSoft, color:T.teal, borderRadius:99, padding:"1px 7px", fontWeight:600 }}>{ort.dist}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OrtCard({ ort, delay=0, onMap }) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <div className="dp-press dp-in dp-card-hover" onClick={onMap} style={{
      width:110, flexShrink:0,
      borderRadius:14, overflow:"hidden",
      background:T.white, boxShadow:T.cardShadow,
      border:`1px solid ${T.border}`,
      animationDelay:`${delay}ms`,
      touchAction:"manipulation",
    }}>
      <div style={{ width:"100%", height:68, overflow:"hidden", position:"relative", background:T.tealSoft }}>
        {!imgErr && ort.cover ? (
          <img loading="lazy" decoding="async" src={ort.cover} alt={ort.name} onError={() => setImgErr(true)}
            style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}/>
        ) : (
          <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <HUILocationIcon size={24} style={{opacity:0.4, color:"rgba(14,196,184,0.5)"}} />
          </div>
        )}
        {ort.dist !== "—" && (
          <div style={{
            position:"absolute", top:5, left:5,
            background:"rgba(255,255,255,0.90)", backdropFilter:"blur(6px)",
            borderRadius:99, padding:"1px 6px",
            fontSize:9, fontWeight:700, color:T.teal,
          }}>
            {ort.dist}
          </div>
        )}
      </div>
      <div style={{ padding:"7px 8px 9px" }}>
        <div style={{ fontSize:11, fontWeight:700, color:T.ink, marginBottom:2, lineHeight:1.25,
          overflow:"hidden", display:"-webkit-box", WebkitLineClamp:1, WebkitBoxOrient:"vertical" }}>
          {ort.name}
        </div>
        <div style={{ fontSize:9.5, color:T.inkFaint, fontWeight:500, marginBottom:4 }}>{ort.city}</div>
        {/* Aktivität */}
        {ort.nextEvent ? (
          <div style={{ fontSize:9, color:"#D97706", fontWeight:600, display:"flex", alignItems:"center", gap:2 }}><HUIKalenderIcon size={9}/>{ort.nextEvent}</div>
        ) : ort.active ? (
          <div style={{ display:"flex", alignItems:"center", gap:3, fontSize:9.5, color:"#22c55e", fontWeight:700 }}>
            <span style={{ display:"inline-block",width:6,height:6,borderRadius:"50%",background:"#22c55e" }}/>
            {ort.active} aktiv
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════
/**
 * Gemeinsamer Umkreisfilter fuer Werke/Erlebnisse -- gleiche Logik wie der
 * bestehende Talente-Filter (siehe displayTalente unten), aber als kleine
 * Hilfsfunktion statt ein drittes Mal ausgeschrieben. isOnlineFn entscheidet,
 * ob ein Eintrag standortunabhaengig ist (bleibt dann immer sichtbar).
 */
function filterByRadius(items, radius, isOnlineFn) {
  if (!radius.geo || radius.isWorldwide) return { list: items, hidden: 0 };
  let hidden = 0;
  const list = items
    .map(item => {
      if (isOnlineFn(item)) return { ...item, distanceKm: null };
      if (Number.isFinite(item.lat) && Number.isFinite(item.lng)) {
        return { ...item, distanceKm: distanceKm(radius.geo.lat, radius.geo.lng, item.lat, item.lng) };
      }
      return { ...item, distanceKm: undefined };
    })
    .filter(item => {
      if (isOnlineFn(item)) return true;
      if (item.distanceKm === undefined) { hidden++; return false; }
      return item.distanceKm <= radius.radiusKm;
    })
    .sort((a, b) => {
      if (a.distanceKm == null) return 1;
      if (b.distanceKm == null) return -1;
      return a.distanceKm - b.distanceKm;
    });
  return { list, hidden };
}

// ── Performance: Memo-Wrapper für Karten-Komponenten ────────────
// Verhindert Re-Renders bei Parent-State-Änderungen (Radius-Slider, Tab-Wechsel)
const TalentCardM    = React.memo(TalentCard);
const WerkCardM      = React.memo(WerkCard);
const ErlebnisCardM  = React.memo(ErlebnisCard);

export default function DiscoverPage({ onView, onMap, onBook }) {
  const [view, setView]         = useState("cards"); // "cards" | "list"
  const [loading, setLoading] = useState(true);
  const [people, setPeople]           = useState([]);
  const [momente, setMomente]         = useState([]);
  const [werke, setWerke]             = useState([]);
  const [talente, setTalente]         = useState([]);

  // ── Talent-Umkreissuche -- VEREINHEITLICHT (2026-07-06) ──
  // Frueher: eigener lokaler Radius-State (talentRadiusKm, Default 50km,
  // 4 feste Stufen) + eigene Standort-Auswahl (talentLocActive), komplett
  // unabhaengig von der globalen Suche. Jetzt: derselbe useRadiusFilter()-
  // Hook wie SearchCommandCenter -- radius.geo/radius.radiusKm sind exakt
  // derselbe Zustand, Aenderungen an einer Stelle wirken ueberall sofort.
  // Die Autocomplete-Vorschlagsliste (Tippen -> Nominatim-Vorschlaege ->
  // konkrete Zeile anklicken) ist reine UI-Mechanik und bleibt lokal --
  // beim Anklicken wird die gewaehlte Zeile per radius.setGeo() direkt in
  // den globalen Zustand geschrieben (kein zweites Geocoding).
  const radius = useRadiusFilter();
  const [talentLocQuery, setTalentLocQuery]     = useState("");
  const [talentLocSuggest, setTalentLocSuggest] = useState([]);
  const [talentLocSearching, setTalentLocSearching] = useState(false);
  const talentLocDebounce = useRef(null);

  useEffect(() => {
    clearTimeout(talentLocDebounce.current);
    if (talentLocQuery.trim().length < 2) { setTalentLocSuggest([]); return; }
    setTalentLocSearching(true);
    talentLocDebounce.current = setTimeout(async () => {
      const res = await searchPlaces(talentLocQuery);
      setTalentLocSuggest(res);
      setTalentLocSearching(false);
    }, 450);
    return () => clearTimeout(talentLocDebounce.current);
  }, [talentLocQuery]);

  function handlePickTalentLoc(place) {
    radius.setGeo(place);
    setTalentLocQuery("");
    setTalentLocSuggest([]);
  }
  function handleClearTalentLoc() {
    radius.clearLocation();
    setTalentLocQuery("");
    setTalentLocSuggest([]);
  }

  // ── Werke/Erlebnisse-Umkreissuche -- gleicher globaler radius-Zustand ──
  // (Erweiterung 2026-07-06: Radius-Vereinheitlichung war bisher nur fuer
  // Talente verdrahtet, siehe Commit 071a8dab. Werke/Erlebnisse nutzen
  // denselben Autocomplete-lokal/Ergebnis-global-Mechanismus.)
  const [werkLocQuery, setWerkLocQuery]     = useState("");
  const [werkLocSuggest, setWerkLocSuggest] = useState([]);
  const [werkLocSearching, setWerkLocSearching] = useState(false);
  const werkLocDebounce = useRef(null);

  useEffect(() => {
    clearTimeout(werkLocDebounce.current);
    if (werkLocQuery.trim().length < 2) { setWerkLocSuggest([]); return; }
    setWerkLocSearching(true);
    werkLocDebounce.current = setTimeout(async () => {
      const res = await searchPlaces(werkLocQuery);
      setWerkLocSuggest(res);
      setWerkLocSearching(false);
    }, 450);
    return () => clearTimeout(werkLocDebounce.current);
  }, [werkLocQuery]);

  function handlePickWerkLoc(place) {
    radius.setGeo(place);
    setWerkLocQuery("");
    setWerkLocSuggest([]);
  }
  function handleClearWerkLoc() {
    radius.clearLocation();
    setWerkLocQuery("");
    setWerkLocSuggest([]);
  }

  const [erlebnisLocQuery, setErlebnisLocQuery]     = useState("");
  const [erlebnisLocSuggest, setErlebnisLocSuggest] = useState([]);
  const [erlebnisLocSearching, setErlebnisLocSearching] = useState(false);
  const erlebnisLocDebounce = useRef(null);

  useEffect(() => {
    clearTimeout(erlebnisLocDebounce.current);
    if (erlebnisLocQuery.trim().length < 2) { setErlebnisLocSuggest([]); return; }
    setErlebnisLocSearching(true);
    erlebnisLocDebounce.current = setTimeout(async () => {
      const res = await searchPlaces(erlebnisLocQuery);
      setErlebnisLocSuggest(res);
      setErlebnisLocSearching(false);
    }, 450);
    return () => clearTimeout(erlebnisLocDebounce.current);
  }, [erlebnisLocQuery]);

  function handlePickErlebnisLoc(place) {
    radius.setGeo(place);
    setErlebnisLocQuery("");
    setErlebnisLocSuggest([]);
  }
  function handleClearErlebnisLoc() {
    radius.clearLocation();
    setErlebnisLocQuery("");
    setErlebnisLocSuggest([]);
  }

  const [erlebnisse, setErlebnisse]   = useState([]);
  const [projekte, setProjekte]       = useState([]);
  const [talentInquiry, setTalentInquiry] = useState(null);
  const [talentBooking, setTalentBooking] = useState(null); // ausgewaehltes Talent fuer Anfrage-Modal
  const { requireAuth } = useAuthGate();

  // ── Daten laden ─────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        // People
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id,display_name,username,avatar_url,bio,location_label,member_since,role,has_talent_profile,talent,membership_type,membership_active,followers_count,impact_eur,profile_views") // Identity Contract v1.0
          .or("has_talent_profile.eq.true,is_member.eq.true,role.eq.talent,role.eq.wirker")
          .order("created_at", { ascending:false })
          .limit(12);

        if (!cancelled && profiles?.length > 0) {
          setPeople(profiles.map(p => ({
            id:           p.id,
            name:         safeStr(p.display_name || p.username) || null,
            bio:          safeStr(p.bio),
            location:     safeStr(p.location_label), // Identity Contract v1.0
            avatar:       safeStr(p.avatar_url),
            impact:       safeNum(p.impact_eur, 0),
            last_seen_at: null, // last_seen_at nicht im Identity Contract
            interests:    [], // dna_tags/skills nicht im Identity Contract
          })));
        }

        // Momente (beitraege) — 2-Schritt-Query (kein FK beitraege.user_id → profiles)
        const { data: beitr } = await supabase
          .from("beitraege")
          .select("id,src,type,caption,created_at,user_id")
          .order("created_at", { ascending:false })
          .limit(8);

        if (!cancelled && beitr?.length > 0) {
          // Profile nachladen
          const beitrUserIds = [...new Set(beitr.map(b => b.user_id).filter(Boolean))];
          let beitrProfileMap = {};
          if (beitrUserIds.length > 0) {
            const { data: bpros } = await supabase
              .from("public_profiles")
              .select("id,display_name,avatar_url")
              .in("id", beitrUserIds);
            if (bpros) beitrProfileMap = Object.fromEntries(bpros.map(p => [p.id, p]));
          }
          setMomente(beitr.map(b => {
            const bp = beitrProfileMap[b.user_id] || {};
            return {
            id:         b.id,
            user_id:    b.user_id,
            src:        safeStr(b.src),
            caption:    safeStr(b.caption, "Ein Moment"),
            type:       safeStr(b.type, "foto"),
            created_at: b.created_at,
            name:       safeStr(bp.display_name, "HUI Mitglied"),
            avatar_url: bp.avatar_url || null,
            location:   "",
          };
          }));
        }

        // Werke — 2-Schritt-Query (kein FK von works.user_id → profiles)
        // Schritt 1: Werke laden
        const { data: ws, error: wsErr } = await supabase
          .from("works")
          .select("id,title,cover_url,category,file_format,tags,status,approval_status,visibility,price,location_text,lat,lng,user_id,created_at,likes_count")
          .eq("status", "published")
          .eq("approval_status", "approved")
          .eq("visibility", "public")
          .order("created_at", { ascending:false })
          .limit(8);

        if (!cancelled && ws?.length > 0) {
          // Schritt 2: Profile für alle Autoren nachladen (public_profiles = öffentlich lesbar)
          const FILE_FORMAT_LABEL = {
            original: "Original",
            druck:    "Druck",
            digital:  "Digital Art",
          };
          const userIds = [...new Set(ws.map(w => w.user_id).filter(Boolean))];
          let profileMap = {};
          if (userIds.length > 0) {
            const { data: profs } = await supabase
              .from("public_profiles")
              .select("id,display_name,avatar_url")
              .in("id", userIds);
            if (profs) profileMap = Object.fromEntries(profs.map(p => [p.id, p]));
          }
          setWerke(ws.map(w => {
            const prof = profileMap[w.user_id] || {};
            return {
              id:        w.id,
              user_id:   w.user_id,
              title:     safeStr(w.title, "Werk"),
              cover:     safeStr(w.cover_url),
              medium:    FILE_FORMAT_LABEL[w.file_format] || safeStr(w.category, "Werk"),
              price:     w.price != null ? safeNum(w.price, 0) : null,
              location:  safeStr(w.location_text),
              lat:       Number.isFinite(w.lat) ? w.lat : null,
              lng:       Number.isFinite(w.lng) ? w.lng : null,
              author:    safeStr(prof.display_name, "HUI Talent"),
              avatar_url: prof.avatar_url || null,
              likes:     w.likes_count || 0,
            };
          }));
        } else if (!wsErr) {
          // Keine Werke in DB → setWerke([]) → displayWerke fällt auf SEED zurück
          if (!cancelled) setWerke([]);
        }

        // Talente — freigegebene Dienstleistungsangebote (TALENT-OFFERS-001/TALENT-SERVICES-001)
        // Oeffentlich sichtbar nur status='approved' (RLS deckt das zusaetzlich ab)
        const { data: tal, error: talErr } = await supabase
          .from("talents")
          .select("id,title,description,category,images,price_per_hour,price_per_session,currency,location_type,location_address,location_notes,map_link,lat,lng,user_id,created_at,available_dates,available_time_slots,recurring,duration_minutes,max_participants,min_participants,booking_type,booking_window_start,booking_window_end")
          .eq("status", "approved")
          .order("created_at", { ascending:false })
          .limit(8);

        if (talErr) {
        }

        if (!cancelled && tal?.length > 0) {
          // Anbieternamen nachladen (kein FK-Embed, eigene Anfrage — gleiches Muster wie "People")
          const providerIds = [...new Set(tal.map(t => t.user_id).filter(Boolean))];
          let providerMap = {};
          if (providerIds.length > 0) {
            const { data: provs } = await supabase
              .from("profiles")
              .select("id,display_name,username")
              .in("id", providerIds);
            providerMap = Object.fromEntries((provs || []).map(p => [p.id, safeStr(p.display_name || p.username, "HUI Talent")]));
          }
          if (!cancelled) {
            setTalente(tal.map(t => ({
              id:                    t.id,
              user_id:               t.user_id,
              title:                 safeStr(t.title, "Talent-Angebot"),
              description:           safeStr(t.description),
              cover:                 (Array.isArray(t.images) && t.images[0]?.url) ? safeStr(t.images[0].url) : null,
              category:              safeStr(t.category),
              price_per_hour:        t.price_per_hour != null ? safeNum(t.price_per_hour, 0) : null,
              price_per_session:     t.price_per_session != null ? safeNum(t.price_per_session, 0) : null,
              currency:              safeStr(t.currency, "EUR"),
              location_type:         safeStr(t.location_type),
              location_address:      safeStr(t.location_address),
              location_notes:        safeStr(t.location_notes),
              map_link:              safeStr(t.map_link),
              lat:                   Number.isFinite(t.lat) ? t.lat : null,
              lng:                   Number.isFinite(t.lng) ? t.lng : null,
              author:                providerMap[t.user_id] || "HUI Talent",
              // Buchungsdaten (TALENT-SERVICES-001) — fuer TalentBookingFlow
              available_dates:       Array.isArray(t.available_dates) ? t.available_dates : [],
              available_time_slots:  Array.isArray(t.available_time_slots) ? t.available_time_slots : [],
              recurring:             safeStr(t.recurring),
              duration_minutes:      t.duration_minutes != null ? safeNum(t.duration_minutes, 0) : null,
              max_participants:      t.max_participants != null ? safeNum(t.max_participants, 1) : 1,
              min_participants:      t.min_participants != null ? safeNum(t.min_participants, 1) : 1,
              booking_type:          safeStr(t.booking_type, "einzel"),
              booking_window_start:  safeStr(t.booking_window_start),
              booking_window_end:    safeStr(t.booking_window_end),
            })));
          }
        } else if (!talErr) {
          if (!cancelled) setTalente([]);
        }

        // Erlebnisse — korrigierte Feldnamen: location_text, max_participants
        const { data: exps, error: expsErr } = await supabase
          .from("experiences")
          .select("id,title,cover_url,date,duration,location_text,max_participants,status,approval_status,category,experience_type,format,lat,lng,user_id,created_at,likes_count")
          .eq("status", "published")
          .eq("approval_status", "approved")
          .order("created_at", { ascending:false })
          .limit(8);

        if (expsErr) {
        }

        if (!cancelled && exps?.length > 0) {
          setErlebnisse(exps.map(e => {
            const d = e.date ? new Date(e.date) : null;
            const now = new Date();
            // Status ableiten
            let statusLabel = "Aktiv";
            let statusColor = "#16A34A";
            if (d && d > now) { statusLabel = "Geplant";       statusColor = "#D97706"; }
            if (d && d < now) { statusLabel = "Abgeschlossen"; statusColor = "rgba(26,26,46,0.38)"; }

            // Typ-Label
            const typeRaw = e.experience_type || e.category || "";
            const typeMap = { workshop:"Workshop", event:"Event", ausstellung:"Ausstellung",
              projekt:"Projekt", kurs:"Kurs", online:"Online" };
            const typeLabel = typeMap[typeRaw.toLowerCase()] || typeRaw || "Erlebnis";

            // Datum
            const dateStr = d ? d.toLocaleDateString("de-DE",{ day:"numeric", month:"short" }) : null;
            const dayNum  = d ? String(d.getDate()).padStart(2,"0") : null;
            const monthSh = d ? d.toLocaleString("de",{month:"short"}) : null;

            return {
              id:          e.id,
              user_id:     e.user_id,
              title:       safeStr(e.title, "Erlebnis"),
              cover:       safeStr(e.cover_url),
              date:        dayNum,
              month:       monthSh,
              dateStr,
              dayLabel:    dateStr || "",
              time:        safeStr(e.duration),
              location:    safeStr(e.location_text),
              spots:       safeNum(e.max_participants, 0),
              statusLabel,
              statusColor,
              typeLabel,
              format:      safeStr(e.format),
              lat:         Number.isFinite(e.lat) ? e.lat : null,
              lng:         Number.isFinite(e.lng) ? e.lng : null,
              likes:       e.likes_count || 0,
            };
          }));
        } else if (!expsErr) {
          if (!cancelled) setErlebnisse([]);
        }

        // SYS-REFACTOR-023: totes impact_pool-Query entfernt (Ergebnis 'imp' wurde nie gelesen, keine Verhaltensaenderung)

        // Impact-Projekte — nach Stimmen/Rank sortiert (Projekt der Woche = #1)
        // Spalten: project_name (nicht name), rank (Trigger aktuell via impact_votes)
        const { data: projRaw } = await supabase
          .from("impact_applications")
          .select("id,project_name,short_desc,cover_url,location,rank,funding_goal,current_amount_eur,status,created_at")
          .eq("status","approved")
          .order("rank", { ascending:true, nullsFirst:false })
          .order("created_at", { ascending:true })
          .limit(10);

        // vote_count per Projekt via impact_votes (für Mitglieder-Anzeige)
        let voteMap = {};
        if (projRaw && projRaw.length > 0) {
          const ids = projRaw.map(p => p.id);
          const { data: voteRows } = await supabase
            .from("impact_votes")
            .select("project_id")
            .in("project_id", ids);
          if (voteRows) {
            voteRows.forEach(v => { voteMap[v.project_id] = (voteMap[v.project_id] || 0) + 1; });
          }
        }
        // null-rank Projekte ans Ende, nach votes sortieren
        const projData = projRaw
          ? [...projRaw].sort((a, b) => {
              const aRank = a.rank ?? 9999;
              const bRank = b.rank ?? 9999;
              if (aRank !== bRank) return aRank - bRank;
              return (voteMap[b.id] || 0) - (voteMap[a.id] || 0);
            })
          : null;

        if (!cancelled && projData?.length > 0) {
          const CAT_COLOR = {
            natur:    { bg:"rgba(22,163,74,0.12)", text:"#16A34A" },
            tiere:    { bg:"rgba(217,119,6,0.12)",  text:"#D97706" },
            umwelt:   { bg:"rgba(14,196,184,0.12)", text:"#0DC4B5" },
            kultur:   { bg:"rgba(99,102,241,0.12)", text:"#6366F1" },
            bildung:  { bg:"rgba(232,87,58,0.12)",  text:"#F47355" },
            sozial:   { bg:"rgba(14,196,184,0.12)", text:"#0DC4B5" },
          };
          // Kategorie aus location (Fallback: "Impact")
          const CAT_COLOR_EXT = {
            ...CAT_COLOR,
            impact:   { bg:"rgba(14,196,184,0.12)", text:"#0DC4B5" },
            sozial:   { bg:"rgba(14,196,184,0.12)", text:"#0DC4B5" },
            gesundheit: { bg:"rgba(239,68,68,0.12)", text:"#EF4444" },
            community: { bg:"rgba(99,102,241,0.12)", text:"#6366F1" },
          };
          // Fallback-Cover-Pool für Projekte ohne Bild
          const COVER_FALLBACKS = [
            "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=280&q=75",
            "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=280&q=75",
            "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=280&q=75",
            "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=280&q=75",
            "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=280&q=75",
            "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=280&q=75",
          ];
          setProjekte(projData.map((p, idx) => {
            // Kategorie: aus Beschreibung/Name ableiten oder "Impact" als Fallback
            let catRaw = "";
            const nameLower = (p.project_name || "").toLowerCase();
            if (nameLower.includes("tier") || nameLower.includes("hund") || nameLower.includes("dog")) catRaw = "tiere";
            else if (nameLower.includes("garten") || nameLower.includes("natur") || nameLower.includes("grün")) catRaw = "natur";
            else if (nameLower.includes("meer") || nameLower.includes("küste") || nameLower.includes("umwelt") || nameLower.includes("klima")) catRaw = "umwelt";
            else if (nameLower.includes("kind") || nameLower.includes("lern") || nameLower.includes("schule") || nameLower.includes("bildung")) catRaw = "bildung";
            else if (nameLower.includes("musik") || nameLower.includes("kunst") || nameLower.includes("kultur")) catRaw = "kultur";
            else if (nameLower.includes("sozial") || nameLower.includes("obdach") || nameLower.includes("mahlzeit") || nameLower.includes("mensch")) catRaw = "sozial";
            else catRaw = "impact";
            const cc = CAT_COLOR_EXT[catRaw] || { bg:"rgba(14,196,184,0.12)", text:"#0DC4B5" };
            const catLabel = catRaw.charAt(0).toUpperCase() + catRaw.slice(1);
            const votes = voteMap[p.id] || 0;
            return {
              id:       p.id,
              title:    p.project_name || "Projekt",
              desc:     p.short_desc || "",
              cat:      catLabel,
              catColor: cc,
              cover:    p.cover_url || COVER_FALLBACKS[idx % COVER_FALLBACKS.length],
              members:  votes,
              rank:     p.rank || 0,
              funding_goal:       p.funding_goal || 0,
              current_amount_eur: p.current_amount_eur || 0,
              _raw:     p,
            };
          }));
        }

      } catch (e) {
        console.warn("[DiscoverPage] load error:", e?.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // ── People: DB oder Seed ─────────────────────────────────────
  const filteredPeople = people.length > 0 ? people : SEED_PEOPLE;

  const displayMomente    = momente.length > 0 ? momente : SEED_MOMENTE;
  const navigate           = useNavigate();
  const { open: openPreview } = useContentPreview(); // OPEN.1 2026-07-08
  const { openCreatorProfile } = useProfileLauncher(); // Autor-Klick → Profil
  const baseDisplayWerke      = werke.length > 0 ? werke : SEED_WERKE;
  const baseDisplayTalente    = talente.length > 0 ? talente : SEED_TALENTE;
  const baseDisplayErlebnisse = erlebnisse.length > 0 ? erlebnisse : SEED_ERLEBNISSE;

  // Umkreisfilter: nur aktiv wenn Nutzer einen Standort ausgewaehlt hat UND
  // der globale Radius nicht "Weltweit" ist (radius.isWorldwide => kein
  // Distanzfilter, wie bei Werken/Erlebnissen/Veranstaltungen).
  // Online-Angebote bleiben immer sichtbar (kein Standort-Bezug).
  // Angebote ohne Koordinaten (nicht geocodebar) werden ausgeblendet, aber
  // gezaehlt, damit es nicht "grundlos" weniger Ergebnisse gibt.
  let hiddenNoCoordsCount = 0;
  const displayTalente = (!radius.geo || radius.isWorldwide)
    ? baseDisplayTalente
    : baseDisplayTalente
        .map(t => {
          if (t.location_type === "online") return { ...t, distanceKm: null };
          if (Number.isFinite(t.lat) && Number.isFinite(t.lng)) {
            const d = distanceKm(radius.geo.lat, radius.geo.lng, t.lat, t.lng);
            return { ...t, distanceKm: d };
          }
          return { ...t, distanceKm: undefined }; // ohne Koordinaten
        })
        .filter(t => {
          if (t.location_type === "online") return true;
          if (t.distanceKm === undefined) { hiddenNoCoordsCount++; return false; }
          return t.distanceKm <= radius.radiusKm;
        })
        .sort((a, b) => {
          if (a.distanceKm == null) return 1;
          if (b.distanceKm == null) return -1;
          return a.distanceKm - b.distanceKm;
        });
  const { list: displayWerke, hidden: werkHiddenCount } =
    filterByRadius(baseDisplayWerke, radius, () => false);
  const { list: displayErlebnisse, hidden: erlebnisHiddenCount } =
    filterByRadius(baseDisplayErlebnisse, radius, e => e.format === "online");

  const displayProjekte   = projekte.length > 0 ? projekte : SEED_PROJEKTE;

  // Person/Wirker-Karte (OPEN.4 2026-07-08): sprang bisher IMMER direkt aufs
  // Profil ohne jede Vorschau -- echte Luecke, da "alle Wirker" explizit zur
  // einheitlichen Vorschau gehoeren. Jetzt: Vorschau zuerst, "Vollstaendige
  // Ansicht" darin fuehrt zum Profil (bei echter UUID + Username), sonst
  // (Seed-Karten) bleibt nur die Vorschau ohne Profil-Sprung.
  const handlePersonPress = useCallback((person) => {
    const isRealId = person?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(person.id));
    // Direkt Profil öffnen — kein Preview-Sheet für Personen (Karte zeigt schon alles)
    if (isRealId && typeof onView === "function") {
      onView(person.id);
      return;
    }
    // Fallback: Preview für unbekannte IDs / Seed-Daten
    const item = normalizeWirkerForPreview(person);
    if (item) {
      openPreview({
        ...item,
        canOpenFull: false, // Kein navigate — würde RefRedirect auslösen
      });
      return;
    }
    if (typeof onView === "function") onView(person.id || person.user_id);
  }, [openPreview, onView]);

  // Werk-Karte: öffne Werk-Detailseite (nur bei echter DB-ID, nicht bei Seed-Daten)
  const handleWerkPress = useCallback((werk) => {
    const werkId = werk.id;
    const isRealId = werkId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(werkId));
    if (!isRealId) return; // Seed-Karte: nichts tun
    // Direkt zur WorkDetailPage navigieren (zuverlässiger als Sheet-Normalisierung)
    navigate(`/work/${werkId}`);
  }, [navigate]);

  // Talent-Karte: Anmeldung/Registrierung erzwingen (useAuthGate), danach Anfrage-Modal öffnen.
  // Seed-Karten (keine echte UUID) öffnen nach Login bewusst kein Modal (kein echter Anbieter dahinter).
  const handleTalentPress = useCallback((talent) => {
    const talentId = talent.id;
    const isRealId = talentId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(talentId));
    // Hat das Angebot einen Preis (TALENT-SERVICES-001)? -> echte Buchung+Zahlung.
    // Sonst (kein Preis hinterlegt) -> Fallback auf die einfache Anfrage-Maske.
    const hasPrice = talent.price_per_hour != null || talent.price_per_session != null;
    requireAuth(hasPrice ? "ein Talent zu buchen" : "ein Talent zu kontaktieren", () => {
      if (!isRealId) return;
      if (hasPrice) setTalentBooking(talent);
      else setTalentInquiry(talent);
    });
  }, [requireAuth]);

  // Moment-Karte (OPEN.1, 2026-07-08): oeffnet jetzt die geteilte Vorschau
  // des Moments selbst statt direkt zum Profil zu springen -- der bisherige
  // Weg (Profil des Erstellers) ist ohne eigenen Moment-Detail-View durch
  // die Vorschau ersetzt, die Titelbild/Text/Datum des Moments zeigt.
  const handleMomentPress = useCallback((moment) => {
    const item = normalizePostForPreview({ ...moment, title: moment.caption }, "moment");
    if (item) openPreview(item);
  }, [openPreview]);

  // Erlebnis-Karte: öffne ExperienceBookingFlow (Detail + Buchen)
  const handleErlebnisPress = useCallback((erlebnis) => {
    const isRealId = erlebnis?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(erlebnis.id));
    if (isRealId) {
      // Erlebnisse direkt mit ExperienceBookingFlow öffnen (hat Bild, Beschreibung, Buchungs-Button)
      // ContentPreviewSheet ist für Beiträge/Projekte, nicht für buchbare Erlebnisse
      if (typeof onBook === "function") { onBook(erlebnis); return; }
    }
    // Seed-Karte oder kein onBook: Fallback auf Profil
    const profileId = erlebnis.user_id;
    if (profileId && typeof onView === "function") onView(profileId);
  }, [onBook, onView]);

  // Projekt-Karte (OPEN.1, 2026-07-08): zeigte bisher IMMER nur die
  // allgemeine Impact-Seite, unabhaengig davon welches Projekt angetippt
  // wurde. Jetzt: Vorschau des konkreten Projekts (Name/Beschreibung/Bild);
  // "Vollstaendige Ansicht" fuehrt weiterhin zur Impact-Seite (keine eigene
  // Projekt-Detailroute vorhanden).
  const handleProjektPress = useCallback((projekt) => {
    // Seed-Karten (keine echte UUID) → kein Deep-Link (keine Detailseite verfügbar)
    const isRealId = projekt?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(projekt.id));
    if (!isRealId) return; // Seed-Karte: kein Klick-Effekt
    // Direkter Deep-Link zu /impact → ApprovedProjectDetail öffnet sich über
    // location.state.openProjectId (bestehender Mechanismus in ImpactPage.jsx)
    navigate("/impact", { state: { openProjectId: projekt.id } });
  }, [navigate]);

  // SectionHead "Alle ansehen →" → Modal öffnen
  const makeScrollHandler = useCallback((selector) => () => {
    const el = document.querySelector(selector);
    if (el) el.scrollIntoView({ behavior:"smooth", block:"start" });
  }, []);

  // Modal-States (lazy — erst beim Öffnen initialisiert)
  const [showWerkeModal,      setShowWerkeModal]      = useState(false);
  const [showTalenteModal,    setShowTalenteModal]     = useState(false);
  const [showErlebnisseModal, setShowErlebnisseModal]  = useState(false);
  const [showMomenteModal,    setShowMomenteModal]     = useState(false);
  const [showProjekteModal,   setShowProjekteModal]    = useState(false);
  const [showOrteModal,       setShowOrteModal]        = useState(false);

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="dp-root" style={{
      width:"100%", background:T.bg,
      fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Helvetica Neue',sans-serif",
      color:T.ink,
      overscrollBehavior:"none",
    }}>
      <style>{CSS}</style>

      {/* ── 1. Titelbereich ── */}
      <DiscoverTitleBar view={view} onViewChange={setView} />

      {/* ── 1b. Live Activity Bar ── */}
      <div style={{ marginBottom:8 }}>
        <HuiLiveTicker/>
      </div>

      {/* ── 3. Menschen entdecken ── */}
      <PeopleSection
        people={filteredPeople}
        onPersonPress={handlePersonPress}
        loading={loading && people.length === 0}
        delay={60}
        view={view}
        onSectionAction={makeScrollHandler("[data-dp-people]")}
      />

      {/* ── 4. Momente aus deiner Nähe ── */}
      <MomenteSection
        momente={displayMomente}
        loading={loading && momente.length === 0}
        delay={80}
        view={view}
        onPress={handleMomentPress}
        onAuthorPress={(userId) => openCreatorProfile(userId)}
        onSectionAction={() => setShowMomenteModal(true)}
      />

      {/* ── 4b. Talente entdecken ── */}
      <TalenteSection
        talente={displayTalente}
        loading={loading && talente.length === 0}
        delay={90}
        view={view}
        onPress={handleTalentPress}
        onAuthorPress={(userId) => openCreatorProfile(userId)}
        onSectionAction={() => setShowTalenteModal(true)}
        locQuery={talentLocQuery}
        onLocQueryChange={setTalentLocQuery}
        locSuggest={talentLocSuggest}
        locSearching={talentLocSearching}
        locActive={radius.geo}
        onPickLoc={handlePickTalentLoc}
        onClearLoc={handleClearTalentLoc}
        radiusKm={radius.radiusKm}
        radiusStages={radius.stages}
        onRadiusChange={radius.setRadiusKm}
        hiddenNoCoordsCount={hiddenNoCoordsCount}
      />

      {/* ── 5. Werke entdecken ── */}
      <WerkeSection
        werke={displayWerke}
        loading={loading && werke.length === 0}
        delay={100}
        view={view}
        onPress={handleWerkPress}
        onAuthorPress={(userId) => openCreatorProfile(userId)}
        onSectionAction={() => setShowWerkeModal(true)}
        locQuery={werkLocQuery}
        onLocQueryChange={setWerkLocQuery}
        locSuggest={werkLocSuggest}
        locSearching={werkLocSearching}
        locActive={radius.geo}
        onPickLoc={handlePickWerkLoc}
        onClearLoc={handleClearWerkLoc}
        radiusKm={radius.radiusKm}
        radiusStages={radius.stages}
        onRadiusChange={radius.setRadiusKm}
        hiddenNoCoordsCount={werkHiddenCount}
      />

      {/* ── 6. Erlebnisse für dich ── */}
      <ErlebnisseSection
        erlebnisse={displayErlebnisse}
        loading={loading && erlebnisse.length === 0}
        delay={120}
        view={view}
        onPress={handleErlebnisPress}
        onSectionAction={() => setShowErlebnisseModal(true)}
        locQuery={erlebnisLocQuery}
        onLocQueryChange={setErlebnisLocQuery}
        locSuggest={erlebnisLocSuggest}
        locSearching={erlebnisLocSearching}
        locActive={radius.geo}
        onPickLoc={handlePickErlebnisLoc}
        onClearLoc={handleClearErlebnisLoc}
        radiusKm={radius.radiusKm}
        radiusStages={radius.stages}
        onRadiusChange={radius.setRadiusKm}
        hiddenNoCoordsCount={erlebnisHiddenCount}
      />

      {/* ── 7. Projekte & Initiativen ── */}
      <ProjekteSection
        projekte={displayProjekte}
        loading={loading}
        delay={140}
        view={view}
        onPress={handleProjektPress}
        onSectionAction={() => setShowProjekteModal(true)}
      />

      {/* ── 8. Orte entdecken ── */}
      <OrteSection onMap={onMap} delay={160} view={view} />

      {/* Talent-Anfrage-Modal (Portal, siehe .agents/rules/footer-navbar-zindex.md) */}
      {talentInquiry && (
        <TalentAnfrageFlow talent={talentInquiry} onClose={() => setTalentInquiry(null)} />
      )}
      {talentBooking && (
        <TalentBookingFlow talent={talentBooking} onClose={() => setTalentBooking(null)} />
      )}

      {/* ── Alle-Ansehen-Modals (lazy, erst beim Öffnen geladen) ── */}
      <Suspense fallback={null}>
        <WerkeAllModal
          isOpen={showWerkeModal}
          onClose={() => setShowWerkeModal(false)}
          onPressItem={(werk) => {
            setShowWerkeModal(false);
            navigate(`/work/${werk.id}`);
          }}
        />
        <TalenteAllModal
          isOpen={showTalenteModal}
          onClose={() => setShowTalenteModal(false)}
          onPressTalent={(talent) => {
            setShowTalenteModal(false);
            openPreview({ id:talent.id, type:"talent", title:talent.title, talentId:talent.id });
          }}
        />
        <ErlebnisseAllModal
          isOpen={showErlebnisseModal}
          onClose={() => setShowErlebnisseModal(false)}
          onPressItem={(exp) => {
            setShowErlebnisseModal(false);
            openPreview({ id:exp.id, type:"erlebnis", title:exp.title, experienceId:exp.id });
          }}
        />
        <MomenteAllModal
          isOpen={showMomenteModal}
          onClose={() => setShowMomenteModal(false)}
          onPressItem={() => setShowMomenteModal(false)}
        />
        <ProjekteAllModal
          isOpen={showProjekteModal}
          onClose={() => setShowProjekteModal(false)}
          onPressItem={(proj) => {
            // Direkt zur vollständigen Impact-Projekt-Detailseite navigieren.
            // ApprovedProjectDetail in ImpactPage.jsx öffnet sich über den
            // Deep-Link-Mechanismus: location.state.openProjectId
            setShowProjekteModal(false);
            navigate("/impact", { state: { openProjectId: proj.id } });
          }}
        />
        <OrteAllModal
          isOpen={showOrteModal}
          onClose={() => setShowOrteModal(false)}
        />
      </Suspense>
    </div>
  );
}
