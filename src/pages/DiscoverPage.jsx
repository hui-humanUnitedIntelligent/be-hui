// src/pages/DiscoverPage.jsx — HUI Phase 2
// "A peaceful digital world where meaningful people can find each other."
// ══════════════════════════════════════════════════════════════════════
// ARCHITECTURE: Standalone. Uses supabase directly. No AppStateContext deps.
// PROPS: onView(profileId), onMap()
// ══════════════════════════════════════════════════════════════════════

import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from "react";
import { supabase } from "../lib/supabaseClient.js";
import { useConnectionEngine, useEncounterJoin } from "../core/HuiConnectionEngine.jsx";

// ── Design tokens ────────────────────────────────────────────────
const T = {
  bg:         "#F7F6F3",
  bgCard:     "#FFFFFF",
  bgGlass:    "rgba(255,255,255,0.82)",
  teal:       "#0EC4B8",
  tealSoft:   "rgba(14,196,184,0.10)",
  tealMid:    "rgba(14,196,184,0.20)",
  tealGlow:   "0 4px 20px rgba(14,196,184,0.30)",
  coral:      "#FF6B52",
  coralSoft:  "rgba(255,107,82,0.10)",
  coralGlow:  "0 4px 20px rgba(255,107,82,0.22)",
  ink:        "#0F1117",
  inkSoft:    "rgba(15,17,23,0.55)",
  inkFaint:   "rgba(15,17,23,0.30)",
  border:     "rgba(15,17,23,0.07)",
  borderMid:  "rgba(15,17,23,0.12)",
  px:         18,
  r12: 12, r16: 16, r20: 20, r24: 24, r99: 99,
  cardShadow: "0 2px 12px rgba(15,17,23,0.06), 0 1px 3px rgba(15,17,23,0.04)",
  floatShadow:"0 8px 32px rgba(15,17,23,0.09), 0 2px 8px rgba(15,17,23,0.05)",
};

// ── Global CSS ───────────────────────────────────────────────────
const CSS = `
  .dp-root { background:${T.bg}; font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Helvetica Neue',sans-serif; color:${T.ink}; }
  .dp-scroll { overflow-y:auto; -webkit-overflow-scrolling:touch; scrollbar-width:none; }
  .dp-scroll::-webkit-scrollbar { display:none; }
  .dp-hscroll { overflow-x:auto; -webkit-overflow-scrolling:touch; scrollbar-width:none; }
  .dp-hscroll::-webkit-scrollbar { display:none; }
  .dp-press { transition:transform .13s cubic-bezier(.22,1,.36,1),opacity .13s ease; }
  .dp-press:active { transform:scale(0.94); opacity:0.80; }
  @keyframes dp-fade-up   { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes dp-blob      { 0%,100%{transform:translate(0,0)scale(1)} 50%{transform:translate(10px,-6px)scale(1.04)} }
  @keyframes dp-shimmer   { from{background-position:-200% 0} to{background-position:200% 0} }
  @keyframes dp-breathe   { 0%,100%{transform:scale(1)} 50%{transform:scale(1.015)} }
  .dp-blob  { animation:dp-blob 14s ease-in-out infinite; }
  .dp-blob2 { animation:dp-blob 18s ease-in-out infinite reverse; }
  .dp-skeleton {
    background:linear-gradient(90deg,rgba(15,17,23,.05) 25%,rgba(15,17,23,.09) 50%,rgba(15,17,23,.05) 75%);
    background-size:200% 100%;
    animation:dp-shimmer 1.4s ease-in-out infinite;
    border-radius:10px;
  }
  .dp-section { animation:dp-fade-up .55s ease both; }
  .dp-pill-active {
    background:linear-gradient(135deg,${T.teal} 0%,#0DBBAF 100%) !important;
    color:white !important;
    box-shadow:${T.tealGlow} !important;
    border-color:transparent !important;
  }
  .dp-search-input { outline:none; border:none; background:none; width:100%; font-family:inherit; }
  .dp-search-input::placeholder { color:${T.inkFaint}; }
`;

// ── Helpers ──────────────────────────────────────────────────────
const safeStr = (v, fb = "") => (v && typeof v === "string" ? v.trim() : fb);
const safeNum = (v, fb = 0)  => (typeof v === "number" && isFinite(v) ? v : fb);
const safeArr = (v)           => (Array.isArray(v) ? v : []);

function useEntry(delay = 0) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVis(true); io.disconnect(); } },
      { threshold: 0.04 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return {
    ref,
    style: {
      opacity: vis ? 1 : 0,
      transform: vis ? "none" : "translateY(14px)",
      transition: `opacity .6s ease ${delay}ms, transform .6s ease ${delay}ms`,
    },
  };
}

// ── Seed data ─────────────────────────────────────────────────────
const CATEGORIES = [
  { key:"alle",          icon:"✨", label:"Alle"           },
  { key:"natur",         icon:"🌿", label:"Natur"          },
  { key:"tiere",         icon:"🐾", label:"Tiere"          },
  { key:"musik",         icon:"🎶", label:"Musik"          },
  { key:"meditation",    icon:"🧘", label:"Meditation"     },
  { key:"kreativitaet",  icon:"🎨", label:"Kreativität"    },
  { key:"gemeinschaft",  icon:"🤝", label:"Gemeinschaft"   },
  { key:"hilfe",         icon:"💛", label:"Hilfe"          },
  { key:"nachhaltigkeit",icon:"🌎", label:"Nachhaltigkeit" },
  { key:"begegnungen",   icon:"☕", label:"Begegnungen"    },
  { key:"inspiration",   icon:"💡", label:"Inspiration"    },
];

const SEED_PEOPLE = [
  { id:"p1", name:"Mia Waldmann",  bio:"Naturpädagogin & Waldbaden Expertin", location:"München",  cat:"natur",         avatar:"https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&q=80", header:"https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=75", values:["🌿","🐾","☕"], impact:4200 },
  { id:"p2", name:"Jonas Kreuz",   bio:"Musiker & Community Builder",          location:"Berlin",   cat:"musik",         avatar:"https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=300&q=80", header:"https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&q=75", values:["🎶","🤝","✨"], impact:6800 },
  { id:"p3", name:"Lena Stern",    bio:"Meditationslehrerin & Heilraum",        location:"Hamburg",  cat:"meditation",    avatar:"https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&q=80", header:"https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=75", values:["🧘","💛","🌎"], impact:3100 },
  { id:"p4", name:"Timo Berger",   bio:"Permakulturgärtner & Saatgut Hüter",   location:"Freiburg", cat:"nachhaltigkeit",avatar:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80", header:"https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=75", values:["🌱","🌎","🤝"], impact:9200 },
  { id:"p5", name:"Anna Kowalski", bio:"Künstlerin & Kreativraum Kurateurin",   location:"Wien",     cat:"kreativitaet",  avatar:"https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&q=80", header:"https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=75", values:["🎨","💡","🤝"], impact:5500 },
  { id:"p6", name:"Felix Braun",   bio:"Tierheim-Aktivist & Hundetrainer",      location:"Leipzig",  cat:"tiere",         avatar:"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&q=80", header:"https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800&q=75", values:["🐾","💛","🌿"], impact:2800 },
];

const SEED_ENCOUNTERS = [
  { id:"e1", emoji:"🌿", title:"Waldbaden im Englischen Garten", type:"Natur", typeColor:"rgba(34,197,94,0.18)", typeText:"#16A34A", host:"Mia Waldmann", hostAvatar:"https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=60&q=80", date:"Sa, 31. Mai", time:"09:00", location:"München", spots:8, spotsLeft:3, img:"https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&q=80", feeling:"Erd dich. Atme tief. Komm an." },
  { id:"e2", emoji:"☕", title:"Stille Morgenrunde beim Café",   type:"Begegnung", typeColor:"rgba(245,158,11,0.15)", typeText:"#D97706", host:"Lena Stern",   hostAvatar:"https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=60&q=80", date:"Mo, 2. Jun", time:"08:30", location:"Hamburg",  spots:6, spotsLeft:4, img:"https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80", feeling:"Kaffee, Stille, echte Gespräche." },
  { id:"e3", emoji:"🎶", title:"Akustik Abend im Kiez",          type:"Musik", typeColor:"rgba(99,102,241,0.15)", typeText:"#6366F1", host:"Jonas Kreuz",  hostAvatar:"https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=60&q=80", date:"Fr, 6. Jun",  time:"19:00", location:"Berlin",   spots:30, spotsLeft:12, img:"https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=600&q=80", feeling:"Klang, der verbindet." },
  { id:"e4", emoji:"🧘", title:"Sonnenaufgang Meditation",       type:"Heilung", typeColor:"rgba(168,85,247,0.14)", typeText:"#9333EA", host:"Lena Stern",   hostAvatar:"https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=60&q=80", date:"So, 8. Jun",  time:"06:00", location:"Hamburg",  spots:12, spotsLeft:7, img:"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80", feeling:"Beginne den Tag in Stille." },
  { id:"e5", emoji:"🐾", title:"Tierheim Besuchstag",            type:"Tiere", typeColor:"rgba(251,146,60,0.15)", typeText:"#EA580C", host:"Felix Braun",  hostAvatar:"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&q=80", date:"Sa, 14. Jun", time:"11:00", location:"Leipzig",  spots:15, spotsLeft:9, img:"https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=600&q=80", feeling:"Liebe, die keine Worte braucht." },
  { id:"e6", emoji:"🎨", title:"Kreativworkshop: Aquarell",      type:"Kreativität", typeColor:"rgba(236,72,153,0.13)", typeText:"#DB2777", host:"Anna Kowalski",hostAvatar:"https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&q=80", date:"Di, 10. Jun", time:"17:00", location:"Wien",     spots:10, spotsLeft:5, img:"https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&q=80", feeling:"Farbe ist Sprache der Seele." },
];

const SEED_PROJECTS = [
  { id:"pr1", emoji:"🌱", title:"Stadtgarten Netz", desc:"Gemeinschaftsgärten in 12 Städten", tag:"Lokal",  tagColor:"rgba(34,197,94,0.15)", tagText:"#16A34A", members:47, img:"https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=75" },
  { id:"pr2", emoji:"🐾", title:"Tierheim Netzwerk", desc:"Monatliche Unterstützung & Vermittlung", tag:"Tiere",  tagColor:"rgba(251,146,60,0.15)", tagText:"#EA580C", members:132, img:"https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=400&q=75" },
  { id:"pr3", emoji:"🌊", title:"Küsten Cleanup",    desc:"Plastikfrei für unsere Meere",          tag:"Natur",  tagColor:"rgba(14,196,184,0.15)", tagText:"#0D9488", members:89,  img:"https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=400&q=75" },
  { id:"pr4", emoji:"🎶", title:"Musik für alle",    desc:"Kostenlose Konzerte in Parks",          tag:"Kultur", tagColor:"rgba(99,102,241,0.15)", tagText:"#6366F1", members:63,  img:"https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&q=75" },
];

// ════════════════════════════════════════════════════════════
// ATOMS
// ════════════════════════════════════════════════════════════
function Skel({ w = "100%", h = 16, r = 8 }) {
  return <div className="dp-skeleton" style={{ width: w, height: h, borderRadius: r, flexShrink: 0 }} />;
}

function SectionHead({ title, subtitle, cta, onCta, delay = 0 }) {
  const { ref, style } = useEntry(delay);
  return (
    <div ref={ref} style={{
      ...style,
      display: "flex", alignItems: "flex-end",
      justifyContent: "space-between",
      padding: `0 ${T.px}px 14px`,
    }}>
      <div>
        <div style={{ fontSize: 18, fontWeight: 800, color: T.ink, letterSpacing: "-0.025em", lineHeight: 1.2 }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: 12, color: T.inkFaint, marginTop: 3, fontWeight: 500 }}>
            {subtitle}
          </div>
        )}
      </div>
      {cta && (
        <button onClick={onCta} style={{
          background: "none", border: "none", padding: 0,
          fontSize: 12, color: T.teal, fontWeight: 700,
          cursor: "pointer", touchAction: "manipulation", fontFamily: "inherit",
          whiteSpace: "nowrap",
        }}>{cta}</button>
      )}
    </div>
  );
}

function Gap({ h = 28 }) { return <div style={{ height: h }} />; }
function Divider() {
  return <div style={{ height: 1, margin: `0 ${T.px}px`, background: T.border }} />;
}

// ════════════════════════════════════════════════════════════
// 1. HEADER — Atmospheric hero
// ════════════════════════════════════════════════════════════
function DiscoverHeader({ searchQ, onSearch, onFocus, focused }) {
  const inputRef = useRef(null);
  useEffect(() => {
    if (focused) setTimeout(() => inputRef.current?.focus(), 80);
  }, [focused]);

  return (
    <div style={{
      width: "100%", position: "relative", overflow: "hidden",
      background: `linear-gradient(160deg, rgba(14,196,184,0.06) 0%, rgba(247,246,243,0) 60%)`,
      paddingTop: "max(52px, calc(44px + env(safe-area-inset-top, 0px)))",
      paddingBottom: 20,
    }}>
      {/* Ambient blobs */}
      <div className="dp-blob" style={{
        position: "absolute", top: -60, right: -40,
        width: 220, height: 220, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(14,196,184,0.14) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div className="dp-blob2" style={{
        position: "absolute", bottom: -20, left: -50,
        width: 180, height: 180, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(255,107,82,0.09) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Title */}
      <div style={{ padding: `0 ${T.px}px 18px`, position: "relative", zIndex: 2 }}>
        <div style={{
          fontSize: 28, fontWeight: 800, color: T.ink,
          letterSpacing: "-0.035em", lineHeight: 1.1, marginBottom: 4,
        }}>Entdecken</div>
        <div style={{ fontSize: 13.5, color: T.inkSoft, fontWeight: 400 }}>
          Finde Menschen, Begegnungen & Initiativen
        </div>
      </div>

      {/* Search bar */}
      <div style={{ padding: `0 ${T.px}px`, position: "relative", zIndex: 2 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          background: focused ? T.bgCard : "rgba(255,255,255,0.72)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: focused ? `1.5px solid ${T.teal}` : `1.5px solid ${T.border}`,
          borderRadius: T.r99, padding: "11px 16px",
          boxShadow: focused ? T.tealGlow : T.cardShadow,
          transition: "border-color .2s ease, box-shadow .2s ease, background .2s ease",
        }}>
          <span style={{ fontSize: 16, opacity: 0.5 }}>🔍</span>
          <input
            ref={inputRef}
            className="dp-search-input"
            value={searchQ}
            onChange={e => onSearch(e.target.value)}
            onFocus={onFocus}
            placeholder="Suche nach Menschen, Themen, Orten…"
            style={{ fontSize: 14, color: T.ink, fontWeight: 400 }}
          />
          {searchQ && (
            <button onClick={() => onSearch("")} style={{
              background: "none", border: "none", padding: 0,
              fontSize: 16, color: T.inkFaint, cursor: "pointer",
              touchAction: "manipulation", lineHeight: 1,
            }}>✕</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// 2. CATEGORIES — Floating pills
// ════════════════════════════════════════════════════════════
function CategoryPills({ active, onChange }) {
  const scrollRef = useRef(null);

  return (
    <div style={{ width: "100%", paddingBottom: 6 }}>
      <div
        ref={scrollRef}
        className="dp-hscroll"
        style={{
          display: "flex", gap: 8,
          padding: `4px ${T.px}px 6px`,
          WebkitOverflowScrolling: "touch",
        }}
      >
        {CATEGORIES.map((cat) => {
          const isActive = active === cat.key;
          return (
            <button
              key={cat.key}
              className={`dp-press${isActive ? " dp-pill-active" : ""}`}
              onClick={() => onChange(cat.key)}
              style={{
                flexShrink: 0,
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "8px 16px", borderRadius: T.r99,
                fontSize: 13, fontWeight: 600,
                cursor: "pointer", touchAction: "manipulation",
                fontFamily: "inherit", border: "none",
                background: isActive
                  ? `linear-gradient(135deg, ${T.teal} 0%, #0DBBAF 100%)`
                  : "rgba(255,255,255,0.85)",
                color: isActive ? "white" : T.inkSoft,
                boxShadow: isActive
                  ? T.tealGlow
                  : "0 1px 4px rgba(15,17,23,0.08), 0 0 0 1px rgba(15,17,23,0.06)",
                transition: "all .22s cubic-bezier(.22,1,.36,1)",
              }}
            >
              <span style={{ fontSize: 15 }}>{cat.icon}</span>
              {cat.label}
            </button>
          );
        })}
        <div style={{ flexShrink: 0, width: 8 }} />
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// 3. PEOPLE SECTION — Meaningful humans
// ════════════════════════════════════════════════════════════
function PersonCard({ person, onPress, delay }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [avatarLoaded, setAvatarLoaded] = useState(false);

  return (
    <div
      className="dp-press dp-section"
      onClick={() => onPress(person)}
      style={{
        flexShrink: 0, width: 200,
        borderRadius: T.r20, overflow: "hidden",
        background: T.bgCard, cursor: "pointer",
        touchAction: "manipulation",
        boxShadow: T.floatShadow,
        animationDelay: `${delay}ms`,
      }}
    >
      {/* Header image */}
      <div style={{ height: 120, position: "relative", background: "rgba(14,196,184,0.08)", overflow: "hidden" }}>
        <img
          src={person.header || person.avatar}
          alt={person.name}
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgLoaded(true)}
          style={{
            width: "100%", height: "100%", objectFit: "cover",
            opacity: imgLoaded ? 1 : 0, transition: "opacity .5s ease",
            display: "block",
          }}
        />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.0) 45%)",
        }} />
      </div>

      {/* Avatar — floats over image */}
      <div style={{ padding: "0 16px 16px", marginTop: -22, position: "relative" }}>
        <div style={{
          width: 44, height: 44, borderRadius: "50%",
          border: "2.5px solid white",
          boxShadow: "0 2px 10px rgba(15,17,23,0.14)",
          overflow: "hidden", background: T.bg,
          marginBottom: 10,
        }}>
          <img
            src={person.avatar}
            alt={person.name}
            onLoad={() => setAvatarLoaded(true)}
            onError={() => setAvatarLoaded(true)}
            style={{
              width: "100%", height: "100%", objectFit: "cover",
              opacity: avatarLoaded ? 1 : 0, transition: "opacity .4s ease",
            }}
          />
        </div>

        {/* Name */}
        <div style={{
          fontSize: 14, fontWeight: 800, color: T.ink,
          letterSpacing: "-0.02em", marginBottom: 4, lineHeight: 1.2,
        }}>{person.name}</div>

        {/* Bio */}
        <div style={{
          fontSize: 11.5, color: T.inkSoft, lineHeight: 1.45,
          marginBottom: 10,
          display: "-webkit-box", WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>{person.bio}</div>

        {/* Values + location row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 3 }}>
            {safeArr(person.values).slice(0, 3).map((v, i) => (
              <span key={i} style={{ fontSize: 13 }}>{v}</span>
            ))}
          </div>
          {person.location && (
            <span style={{ fontSize: 10, color: T.inkFaint, fontWeight: 500 }}>
              📍 {person.location}
            </span>
          )}
        </div>

        {/* Impact */}
        {person.impact > 0 && (
          <div style={{
            marginTop: 10, paddingTop: 10,
            borderTop: `1px solid ${T.border}`,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <span style={{ fontSize: 11 }}>🌱</span>
            <span style={{ fontSize: 10.5, color: T.teal, fontWeight: 700 }}>
              €{(person.impact / 1000).toFixed(1)}K Wirkung
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function PeopleSection({ people, onPersonPress, loading, delay }) {
  const { ref, style } = useEntry(delay);
  const items = people.length > 0 ? people : SEED_PEOPLE;

  return (
    <div ref={ref} style={{ ...style, width: "100%" }}>
      <SectionHead
        title="Menschen entdecken"
        subtitle="Bedeutungsvolle Begegnungen beginnen hier"
        cta="Alle Menschen"
        delay={delay}
      />
      <div className="dp-hscroll" style={{
        display: "flex", gap: 10,
        padding: `3px ${T.px}px 8px`,
        WebkitOverflowScrolling: "touch",
      }}>
        {loading
          ? [1,2,3].map(i => (
              <div key={i} style={{ flexShrink:0, width:200, borderRadius:T.r20, overflow:"hidden" }}>
                <Skel w={200} h={120} r={0} />
                <div style={{ padding:"14px 16px", display:"flex", flexDirection:"column", gap:8 }}>
                  <Skel w={44} h={44} r={99} />
                  <Skel w="70%" h={14} />
                  <Skel w="90%" h={11} />
                  <Skel w="90%" h={11} />
                </div>
              </div>
            ))
          : items.map((p, i) => (
              <PersonCard key={p.id || i} person={p} onPress={onPersonPress} delay={i * 60} />
            ))
        }
        <div style={{ flexShrink: 0, width: 8 }} />
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// 4. ENCOUNTERS SECTION — Core HUI feature
// ════════════════════════════════════════════════════════════
function EncounterCard({ enc, onPress, layout = "card" }) {
  const [imgLoaded, setImgLoaded] = useState(false);

  if (layout === "list") {
    return (
      <div
        className="dp-press"
        onClick={() => onPress(enc)}
        style={{
          display: "flex", gap: 14, cursor: "pointer",
          touchAction: "manipulation", padding: "14px 0",
          borderBottom: `1px solid ${T.border}`,
        }}
      >
        {/* Thumbnail */}
        <div style={{
          width: 80, height: 80, borderRadius: T.r16, overflow: "hidden",
          flexShrink: 0, background: "rgba(14,196,184,0.08)",
          position: "relative",
        }}>
          <img src={enc.img} alt={enc.title}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgLoaded(true)}
            style={{
              width:"100%",height:"100%",objectFit:"cover",
              opacity: imgLoaded ? 1 : 0, transition:"opacity .4s ease",
            }}
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:4 }}>
            <span style={{ fontSize:14 }}>{enc.emoji}</span>
            <span style={{
              fontSize:9.5, fontWeight:700, letterSpacing:".04em",
              color:enc.typeText, background:enc.typeColor,
              padding:"2px 8px", borderRadius:T.r99,
            }}>{enc.type}</span>
          </div>
          <div style={{ fontSize:13, fontWeight:700, color:T.ink, marginBottom:4, letterSpacing:"-0.01em", lineHeight:1.3 }}>
            {enc.title}
          </div>
          <div style={{ display:"flex", gap:10, fontSize:10.5, color:T.inkFaint, marginBottom:6 }}>
            <span>📅 {enc.date}</span>
            <span>⏰ {enc.time}</span>
            <span>📍 {enc.location}</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <img src={enc.hostAvatar} alt={enc.host} style={{ width:20,height:20,borderRadius:"50%",objectFit:"cover" }} />
            <span style={{ fontSize:10.5, color:T.inkSoft, fontWeight:500 }}>{enc.host}</span>
            <span style={{ marginLeft:"auto", fontSize:10.5, fontWeight:700,
              color:enc.spotsLeft <= 3 ? T.coral : T.teal }}>
              {enc.spotsLeft} Plätze frei
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Card layout (horizontal scroll)
  return (
    <div
      className="dp-press dp-section"
      onClick={() => onPress(enc)}
      style={{
        flexShrink: 0, width: 240,
        borderRadius: T.r20, overflow: "hidden",
        background: T.bgCard, cursor: "pointer",
        touchAction: "manipulation",
        boxShadow: T.floatShadow,
      }}
    >
      {/* Image */}
      <div style={{ height: 150, position: "relative", background: "rgba(14,196,184,0.08)", overflow: "hidden" }}>
        <img src={enc.img} alt={enc.title}
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgLoaded(true)}
          style={{
            width:"100%", height:"100%", objectFit:"cover",
            opacity: imgLoaded ? 1 : 0, transition:"opacity .5s ease",
          }}
        />
        {/* Gradient */}
        <div style={{
          position:"absolute", inset:0,
          background:"linear-gradient(to top, rgba(15,17,23,0.55) 0%, rgba(15,17,23,0.0) 55%)",
        }} />
        {/* Type badge */}
        <div style={{
          position:"absolute", top:12, left:12,
          background:"rgba(255,255,255,0.90)", backdropFilter:"blur(8px)",
          WebkitBackdropFilter:"blur(8px)",
          padding:"4px 10px", borderRadius:T.r99,
          fontSize:10, fontWeight:700, color:enc.typeText,
          display:"flex", alignItems:"center", gap:5,
        }}>
          <span style={{ fontSize:12 }}>{enc.emoji}</span>
          {enc.type}
        </div>
        {/* Spots badge */}
        <div style={{
          position:"absolute", top:12, right:12,
          background: enc.spotsLeft <= 3 ? T.coral : T.teal,
          padding:"4px 9px", borderRadius:T.r99,
          fontSize:9.5, fontWeight:800, color:"white",
        }}>{enc.spotsLeft} frei</div>
        {/* Date on image */}
        <div style={{
          position:"absolute", bottom:12, left:14, right:14,
          display:"flex", alignItems:"center", gap:6,
        }}>
          <span style={{ fontSize:11, color:"rgba(255,255,255,0.8)", fontWeight:500 }}>
            {enc.date} · {enc.time}
          </span>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding:"14px 15px 16px" }}>
        {/* Feeling quote */}
        <div style={{
          fontSize:11, color:T.teal, fontStyle:"italic",
          fontWeight:500, marginBottom:6, lineHeight:1.45,
        }}>"{enc.feeling}"</div>

        {/* Title */}
        <div style={{
          fontSize:14, fontWeight:800, color:T.ink,
          letterSpacing:"-0.02em", marginBottom:10, lineHeight:1.3,
        }}>{enc.title}</div>

        {/* Host row */}
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <img src={enc.hostAvatar} alt={enc.host}
            style={{ width:26,height:26,borderRadius:"50%",objectFit:"cover",flexShrink:0 }}
            onError={e=>{e.target.style.display="none";}}
          />
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:11, color:T.inkSoft, lineHeight:1 }}>von</div>
            <div style={{ fontSize:12, fontWeight:700, color:T.ink, letterSpacing:"-0.01em" }}>
              {enc.host}
            </div>
          </div>
          <div style={{ fontSize:10, color:T.inkFaint, textAlign:"right" }}>
            📍 {enc.location}
          </div>
        </div>
      </div>
    </div>
  );
}

function EncountersSection({ encounters, onEncounterPress, delay }) {
  const { ref, style } = useEntry(delay);
  const items = encounters.length > 0 ? encounters : SEED_ENCOUNTERS;
  const [view, setView] = useState("cards"); // "cards" | "list"

  return (
    <div ref={ref} style={{ ...style, width: "100%" }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "flex-end",
        justifyContent: "space-between",
        padding: `0 ${T.px}px 14px`,
      }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: T.ink, letterSpacing: "-0.025em", lineHeight: 1.2 }}>
            Begegnungen
          </div>
          <div style={{ fontSize: 12, color: T.inkFaint, marginTop: 3, fontWeight: 500 }}>
            Echte menschliche Momente
          </div>
        </div>
        <div style={{ display:"flex", gap:6, alignItems:"center" }}>
          {["cards","list"].map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              width:30, height:30, borderRadius:8,
              border:`1px solid ${view===v ? T.teal : T.border}`,
              background: view===v ? T.tealSoft : "transparent",
              cursor:"pointer", touchAction:"manipulation",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:14, transition:"all .18s ease",
            }}>
              {v === "cards" ? "▤" : "☰"}
            </button>
          ))}
        </div>
      </div>

      {/* Cards view */}
      {view === "cards" && (
        <div className="dp-hscroll" style={{
          display:"flex", gap:10,
          padding:`3px ${T.px}px 8px`,
          WebkitOverflowScrolling:"touch",
        }}>
          {items.map((e, i) => (
            <EncounterCard key={e.id} enc={e} onPress={onEncounterPress} layout="card" />
          ))}
          <div style={{ flexShrink:0, width:8 }} />
        </div>
      )}

      {/* List view */}
      {view === "list" && (
        <div style={{ padding:`0 ${T.px}px` }}>
          {items.map(e => (
            <EncounterCard key={e.id} enc={e} onPress={onEncounterPress} layout="list" />
          ))}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// 5. PROJECTS SECTION
// ════════════════════════════════════════════════════════════
function ProjectCard({ p, delay }) {
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <div
      className="dp-press dp-section"
      style={{
        flexShrink: 0, width: 190,
        borderRadius: T.r20, overflow: "hidden",
        background: T.bgCard, cursor: "pointer",
        touchAction: "manipulation",
        boxShadow: T.floatShadow,
        animationDelay: `${delay}ms`,
      }}
    >
      <div style={{ height: 110, position:"relative", background:"rgba(14,196,184,0.06)", overflow:"hidden" }}>
        <img src={p.img} alt={p.title}
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgLoaded(true)}
          style={{ width:"100%",height:"100%",objectFit:"cover",
            opacity: imgLoaded ? 1 : 0, transition:"opacity .5s ease" }}
        />
        <div style={{
          position:"absolute", inset:0,
          background:"linear-gradient(to top,rgba(255,255,255,0.92) 0%,rgba(255,255,255,0) 50%)"
        }}/>
        <div style={{
          position:"absolute",top:10,right:10,
          width:36,height:36,borderRadius:10,
          background:"rgba(255,255,255,0.90)",backdropFilter:"blur(8px)",
          display:"flex",alignItems:"center",justifyContent:"center",
          fontSize:20,
        }}>{p.emoji}</div>
      </div>
      <div style={{ padding:"0 14px 14px", marginTop:-8 }}>
        <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:6 }}>
          <span style={{
            fontSize:9, fontWeight:800, letterSpacing:".04em",
            color:p.tagText, background:p.tagColor,
            padding:"2px 8px", borderRadius:T.r99,
          }}>{p.tag}</span>
        </div>
        <div style={{ fontSize:13,fontWeight:800,color:T.ink,letterSpacing:"-0.02em",marginBottom:4 }}>
          {p.title}
        </div>
        <div style={{ fontSize:11,color:T.inkSoft,lineHeight:1.45,marginBottom:10 }}>{p.desc}</div>
        <div style={{ display:"flex",alignItems:"center",gap:5,fontSize:10.5,color:T.inkFaint }}>
          <span>👥</span>
          <span>{p.members} Mitglieder</span>
        </div>
      </div>
    </div>
  );
}

function ProjectsSection({ projects, delay }) {
  const { ref, style } = useEntry(delay);
  const items = projects.length > 0 ? projects : SEED_PROJECTS;

  return (
    <div ref={ref} style={{ ...style, width: "100%" }}>
      <SectionHead
        title="Initiativen & Projekte"
        subtitle="Menschen bauen gute Dinge zusammen"
        cta="Alle Projekte"
        delay={delay}
      />
      <div className="dp-hscroll" style={{
        display:"flex", gap:10,
        padding:`3px ${T.px}px 8px`,
        WebkitOverflowScrolling:"touch",
      }}>
        {items.map((p, i) => (
          <ProjectCard key={p.id} p={p} delay={i * 70} />
        ))}
        <div style={{ flexShrink:0, width:8 }} />
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// 6. PLACES — Map preview teaser
// ════════════════════════════════════════════════════════════
function PlacesTeaser({ onMap }) {
  const { ref, style } = useEntry(80);

  return (
    <div ref={ref} style={{ ...style, padding: `0 ${T.px}px` }}>
      <div
        className="dp-press"
        onClick={onMap}
        style={{
          borderRadius: T.r20, overflow: "hidden",
          background: T.bgCard, cursor: "pointer",
          touchAction: "manipulation",
          boxShadow: T.floatShadow,
          position: "relative",
        }}
      >
        {/* Map bg placeholder */}
        <div style={{
          height: 140,
          background: `linear-gradient(135deg,
            rgba(14,196,184,0.12) 0%,
            rgba(255,107,82,0.08) 50%,
            rgba(14,196,184,0.06) 100%)`,
          position: "relative", overflow: "hidden",
        }}>
          {/* Fake map dots */}
          {[
            {top:"30%",left:"25%",size:10,color:T.teal},
            {top:"55%",left:"55%",size:14,color:T.coral},
            {top:"25%",left:"68%",size:8, color:T.teal},
            {top:"65%",left:"30%",size:9, color:"#6366F1"},
            {top:"45%",left:"78%",size:11,color:T.teal},
          ].map((dot, i) => (
            <div key={i} style={{
              position:"absolute", top:dot.top, left:dot.left,
              width:dot.size, height:dot.size, borderRadius:"50%",
              background:dot.color, boxShadow:`0 0 0 3px ${dot.color}33`,
              animation:`dp-breathe ${2.5 + i*0.4}s ease-in-out infinite`,
            }}/>
          ))}
          {/* Grid lines (map feel) */}
          <svg style={{ position:"absolute",inset:0,width:"100%",height:"100%",opacity:0.10 }}>
            {[20,40,60,80].map(x => (
              <line key={`v${x}`} x1={`${x}%`} y1="0" x2={`${x}%`} y2="100%" stroke={T.ink} strokeWidth="1"/>
            ))}
            {[33,66].map(y => (
              <line key={`h${y}`} x1="0" y1={`${y}%`} x2="100%" y2={`${y}%`} stroke={T.ink} strokeWidth="1"/>
            ))}
          </svg>
        </div>

        {/* Label */}
        <div style={{
          padding:"14px 18px",
          display:"flex", alignItems:"center", gap:12,
        }}>
          <div style={{
            width:40, height:40, borderRadius:T.r12,
            background:T.tealSoft,
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,
          }}>🗺️</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14,fontWeight:800,color:T.ink,letterSpacing:"-0.02em",marginBottom:2 }}>
              Orte entdecken
            </div>
            <div style={{ fontSize:12,color:T.inkSoft }}>
              Lokale HUI Räume, Parks & Begegnungsorte
            </div>
          </div>
          <div style={{ fontSize:18, color:T.inkFaint }}>→</div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// 7. ENCOUNTER DETAIL OVERLAY
// ════════════════════════════════════════════════════════════
function EncounterDetail({ enc, onClose, engine }) {
  const [mounted, setMounted] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 40); return () => clearTimeout(t); }, []);

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:9600,
      background:T.bg,
      opacity: mounted ? 1 : 0,
      transform: mounted ? "none" : "translateY(24px)",
      transition: "opacity .35s ease, transform .4s cubic-bezier(.22,1,.36,1)",
      overflowY:"auto", WebkitOverflowScrolling:"touch",
    }}>
      {/* Hero */}
      <div style={{ position:"relative", height:280, overflow:"hidden", background:"rgba(14,196,184,0.08)" }}>
        <img src={enc.img} alt={enc.title}
          onLoad={()=>setImgLoaded(true)}
          style={{
            width:"100%",height:"100%",objectFit:"cover",
            opacity:imgLoaded?1:0,transition:"opacity .5s ease",
          }}
        />
        <div style={{
          position:"absolute",inset:0,
          background:"linear-gradient(to top, rgba(247,246,243,1) 0%, rgba(247,246,243,0.2) 50%, rgba(0,0,0,0.3) 100%)"
        }}/>
        {/* Back */}
        <button
          className="dp-press"
          onClick={onClose}
          style={{
            position:"absolute",top:16,left:16,zIndex:10,
            width:36,height:36,borderRadius:"50%",
            background:"rgba(255,255,255,0.90)",backdropFilter:"blur(10px)",
            border:`1px solid rgba(255,255,255,0.6)`,
            boxShadow:"0 2px 10px rgba(0,0,0,0.12)",
            cursor:"pointer",touchAction:"manipulation",
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:16,color:T.ink,
          }}
        >←</button>

        {/* Type + emoji */}
        <div style={{
          position:"absolute",top:16,right:16,
          background:enc.typeColor,backdropFilter:"blur(8px)",
          padding:"5px 12px",borderRadius:T.r99,
          fontSize:11,fontWeight:800,color:enc.typeText,
          display:"flex",alignItems:"center",gap:6,
        }}>
          <span style={{fontSize:14}}>{enc.emoji}</span>{enc.type}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding:`0 ${T.px}px 120px` }}>
        {/* Feeling */}
        <div style={{
          fontSize:14,fontStyle:"italic",color:T.teal,fontWeight:500,
          marginBottom:10,lineHeight:1.6,
          fontFamily:"-apple-system,'Georgia',serif",
        }}>"{enc.feeling}"</div>

        {/* Title */}
        <h1 style={{
          fontSize:24,fontWeight:800,color:T.ink,
          letterSpacing:"-0.03em",lineHeight:1.2,
          margin:"0 0 20px",
        }}>{enc.title}</h1>

        {/* Meta cards */}
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:24 }}>
          {[
            {icon:"📅",label:"Datum",val:enc.date},
            {icon:"⏰",label:"Zeit",val:enc.time},
            {icon:"📍",label:"Ort",val:enc.location},
            {icon:"👥",label:"Plätze frei",val:`${enc.spotsLeft} von ${enc.spots}`},
          ].map((m,i)=>(
            <div key={i} style={{
              background:T.bgCard,borderRadius:T.r16,
              border:`1px solid ${T.border}`,
              padding:"14px",
              boxShadow:T.cardShadow,
            }}>
              <div style={{fontSize:18,marginBottom:6}}>{m.icon}</div>
              <div style={{fontSize:10.5,color:T.inkFaint,fontWeight:500,marginBottom:3}}>{m.label}</div>
              <div style={{fontSize:13,fontWeight:700,color:T.ink}}>{m.val}</div>
            </div>
          ))}
        </div>

        {/* Host */}
        <div style={{
          display:"flex",alignItems:"center",gap:14,
          background:T.bgCard,borderRadius:T.r20,
          border:`1px solid ${T.border}`,padding:"16px",
          boxShadow:T.cardShadow,marginBottom:24,
        }}>
          <img src={enc.hostAvatar} alt={enc.host}
            style={{width:52,height:52,borderRadius:"50%",objectFit:"cover"}}
            onError={e=>{e.target.style.display="none";}}
          />
          <div>
            <div style={{fontSize:11,color:T.inkFaint,marginBottom:3}}>Organisiert von</div>
            <div style={{fontSize:15,fontWeight:800,color:T.ink,letterSpacing:"-0.02em"}}>{enc.host}</div>
          </div>
        </div>

        {/* About */}
        <div style={{ marginBottom:24 }}>
          <div style={{fontSize:15,fontWeight:800,color:T.ink,letterSpacing:"-0.02em",marginBottom:10}}>
            Über diese Begegnung
          </div>
          <p style={{
            fontSize:14,color:T.inkSoft,lineHeight:1.7,margin:0,
            fontFamily:"-apple-system,'Georgia',serif",
          }}>
            Diese Begegnung ist ein bewusster Raum für echte menschliche Verbindung.
            Kein Stress, keine Performance — nur authentische Präsenz und gemeinsame Erfahrung.
            {enc.feeling && ` "${enc.feeling}"`}
          </p>
        </div>
      </div>

      {/* Sticky CTA */}
      <div style={{
        position:"fixed",
        bottom:"max(88px, calc(80px + env(safe-area-inset-bottom,0px)))",
        left:T.px,right:T.px,zIndex:9700,
      }}>
        <button
          className="dp-press"
          style={{
            width:"100%",
            background: engine?.hasJoined(enc.id)
              ? "rgba(15,17,23,0.07)"
              : `linear-gradient(135deg,${T.teal} 0%,#0DBBAF 100%)`,
            border: engine?.hasJoined(enc.id) ? `1px solid rgba(15,17,23,0.12)` : "none",
            borderRadius:T.r99,padding:"15px 28px",
            color: engine?.hasJoined(enc.id) ? "rgba(15,17,23,0.55)" : "white",
            fontSize:15,fontWeight:700,
            cursor:"pointer",touchAction:"manipulation",
            boxShadow: engine?.hasJoined(enc.id) ? "none" : `${T.tealGlow},0 4px 24px rgba(0,0,0,0.12)`,
            fontFamily:"inherit",
            transition:"all .25s ease",
          }}
          onClick={() => {
            if (engine?.hasJoined(enc.id)) {
              engine?.leaveEncounter(enc.id);
            } else {
              engine?.joinEncounter(enc.id, enc);
            }
          }}
        >
          {engine?.hasJoined(enc.id) ? "✓ Du bist dabei" : `✦ Ich bin dabei — ${enc.date}`}
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// ROOT — DiscoverPage
// ════════════════════════════════════════════════════════════
export default function DiscoverPage({ onView, onMap }) {
  const [activeCategory, setActiveCategory] = useState("alle");
  const [searchQ, setSearchQ] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedEncounter, setSelectedEncounter] = useState(null);
  const engine = useConnectionEngine();

  // Data state
  const [people, setPeople]       = useState([]);
  const [encounters, setEncounters] = useState([]);
  const [projects, setProjects]   = useState([]);
  const [loading, setLoading]     = useState(true);

  // Load from Supabase
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id,username,display_name,bio,avatar_url,header_img,location,impact_eur,interests,verified,has_talent_profile,is_member,role")
          .or("has_talent_profile.eq.true,is_member.eq.true,role.eq.talent,role.eq.wirker")
          .limit(12);

        if (!cancelled && profiles?.length > 0) {
          setPeople(profiles.map(p => ({
            id:       p.id,
            name:     safeStr(p.display_name || p.username, "Human"),
            bio:      safeStr(p.bio),
            location: safeStr(p.location),
            avatar:   safeStr(p.avatar_url),
            header:   safeStr(p.header_img),
            values:   safeArr(p.interests).slice(0,3),
            impact:   safeNum(p.impact_eur, 0),
            cat:      "alle",
          })));
        }
      } catch (e) {
        console.warn("[DiscoverPage] Supabase load error:", e?.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // Category + search filter
  const filteredPeople = useMemo(() => {
    let items = people.length > 0 ? people : SEED_PEOPLE;
    if (activeCategory !== "alle") {
      items = items.filter(p =>
        p.cat === activeCategory ||
        safeArr(p.values).some(v => v.toLowerCase().includes(activeCategory))
      );
    }
    if (searchQ.trim()) {
      const q = searchQ.toLowerCase();
      items = items.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.bio?.toLowerCase().includes(q) ||
        p.location?.toLowerCase().includes(q)
      );
    }
    return items;
  }, [people, activeCategory, searchQ]);

  const filteredEncounters = useMemo(() => {
    let items = encounters.length > 0 ? encounters : SEED_ENCOUNTERS;
    if (activeCategory !== "alle") {
      items = items.filter(e => e.type?.toLowerCase().includes(activeCategory) || e.cat === activeCategory);
    }
    if (searchQ.trim()) {
      const q = searchQ.toLowerCase();
      items = items.filter(e =>
        e.title?.toLowerCase().includes(q) ||
        e.host?.toLowerCase().includes(q) ||
        e.location?.toLowerCase().includes(q)
      );
    }
    return items;
  }, [encounters, activeCategory, searchQ]);

  const handlePersonPress = useCallback((person) => {
    if (typeof onView === "function") {
      onView(person.id || person.user_id);
    }
  }, [onView]);

  const handleEncounterPress = useCallback((enc) => {
    setSelectedEncounter(enc);
  }, []);

  const handleMap = useCallback(() => {
    if (typeof onMap === "function") onMap();
  }, [onMap]);

  return (
    <div className="dp-root" style={{ width:"100%", minHeight:"100%" }}>
      <style>{CSS}</style>

      {/* 1. Atmospheric header */}
      <DiscoverHeader
        searchQ={searchQ}
        onSearch={setSearchQ}
        onFocus={() => setSearchFocused(true)}
        focused={searchFocused}
      />

      {/* 2. Category pills */}
      <CategoryPills active={activeCategory} onChange={cat => {
        setActiveCategory(cat);
        setSearchFocused(false);
      }} />

      <Gap h={20} />

      {/* 3. People */}
      <PeopleSection
        people={filteredPeople}
        onPersonPress={handlePersonPress}
        loading={loading}
        delay={0}
      />

      <Gap h={28} />
      <Divider />
      <Gap h={28} />

      {/* 4. Encounters */}
      <EncountersSection
        encounters={filteredEncounters}
        onEncounterPress={handleEncounterPress}
        delay={60}
      />

      <Gap h={28} />
      <Divider />
      <Gap h={28} />

      {/* 5. Projects */}
      <ProjectsSection projects={projects} delay={80} />

      <Gap h={28} />
      <Divider />
      <Gap h={28} />

      {/* 6. Places / Map teaser */}
      <PlacesTeaser onMap={handleMap} />

      <Gap h={40} />

      {/* Encounter Detail Overlay */}
      {selectedEncounter && (
        <EncounterDetail
          enc={selectedEncounter}
          onClose={() => setSelectedEncounter(null)}
          engine={engine}
        />
      )}
    </div>
  );
}
