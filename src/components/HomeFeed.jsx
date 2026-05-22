// HomeFeed.jsx — HUI Feed Rhythm & Atmosphere v2
// Goal: flowing atmospheric experience, not infinite-scroll energy.
// System: 5 visual feed states with organic rhythm.

import { useFeedData }           from '../lib/AppStateContext';
import { filterValidFeedItems }  from '../lib/factories/createFeedItem.js';
import { createProfileItem }     from '../lib/factories/createProfileItem.js';
import React, {
  useState, useRef, useEffect, useCallback, useMemo,
} from "react";
import { SAFE_MODE } from "../config/safeMode.js";
import {
  CreatorPresenceHeader,
  PresencePersonCard,
  PresenceAvatar,
  PresenceLabel,
  derivePresenceState,
} from "./CreatorPresence.jsx";
import {
  buildRelationshipMemory,
} from "../lib/intelligence/relationshipMemory.js";
import {
  useLivingMemory,
  useDwellTracker,
} from "../lib/intelligence/persistence/useLivingMemory.js";
import {
  resolveMemoryTokens,
  applyMemoryToCardStyle,
  memoryAdjustedDelay,
} from "../lib/intelligence/persistence/memoryTokens.js";
import {
  curateHumaneFeed,
  getTimeAtmosphere,
  QUIET_QUOTE_POOL,
  intelligentMicroMoment,
} from "../lib/feedIntelligence.js";
import {
  selectWarmthBoost,
  selectGlowBoost,
  selectCardDelay,
  isFallbackMemory,
} from "../lib/intelligence/index.js";

/* ─── Design Tokens ─────────────────────────────────────────────────────── */
const T = {
  teal:        "#16D7C5",
  teal2:       "#11C5B7",
  tealFaint:   "rgba(22,215,197,0.07)",
  tealMid:     "rgba(22,215,197,0.13)",
  tealGlow:    "rgba(22,215,197,0.20)",
  coral:       "#FF8A6B",
  coralFaint:  "rgba(255,138,107,0.07)",
  coralGlow:   "rgba(255,138,107,0.16)",
  bg:          "#F9F7F4",
  surface:     "rgba(255,255,255,0.80)",
  surfaceWarm: "rgba(252,250,248,0.88)",
  ink:         "#1A1A1A",
  ink2:        "#3A3A3A",
  ink3:        "#5A5A5A",
  muted:       "rgba(26,26,26,0.40)",
  muted2:      "rgba(26,26,26,0.22)",
  border:      "rgba(0,0,0,0.042)",
  borderSoft:  "rgba(0,0,0,0.028)",
  shadowSm:    "0 1px 4px rgba(0,0,0,0.04), 0 2px 10px rgba(0,0,0,0.035)",
  shadowMd:    "0 2px 14px rgba(0,0,0,0.055), 0 1px 3px rgba(0,0,0,0.028)",
  shadowLg:    "0 6px 28px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)",
  shadowHero:  "0 12px 48px rgba(0,0,0,0.12), 0 3px 10px rgba(0,0,0,0.06)",
  r20: 20, r24: 24, r16: 16, r12: 12, r8: 8,
};

/* ─── Feed Rhythm Sequence ───────────────────────────────────────────────
   Orchestrates the visual breathing pattern. Each slot maps item.type
   or feed index to a visual state.
   States: hero | note | experience | resonance | quiet
   ─────────────────────────────────────────────────────────────────────── */
const RHYTHM_MAP = [
  "hero",       // 0 — large immersive
  "resonance",  // 1 — compact interaction
  "note",       // 2 — creator thought
  "quiet",      // 3 — atmospheric pause
  "experience", // 4 — event/gathering
  "resonance",  // 5 — compact
  "hero",       // 6 — large
  "note",       // 7 — creator thought
  "quiet",      // 8 — breathing space
  "experience", // 9 — warm social
];

function getRhythmState(item, idx) {
  // Type overrides take priority
  if (item.rhythmState) return item.rhythmState;
  if (item.type === "experience" || item.type === "event") return "experience";
  if (item.type === "note" || item.type === "thought") return "note";
  if (item.type === "quiet" || item.type === "pause") return "quiet";
  // Default: follow the rhythm map
  return RHYTHM_MAP[idx % RHYTHM_MAP.length];
}

/* ─── Ambient Quotes — sourced from feedIntelligence ────────────────────── */
// QUIET_QUOTE_POOL is imported from feedIntelligence.js
// Keeping AMBIENT_QUOTES as alias for QuietSpace component
const AMBIENT_QUOTES = QUIET_QUOTE_POOL;

/* ─── CSS ───────────────────────────────────────────────────────────────── */
const CSS = `
  /* ── Keyframes ─────────────────── */
  @keyframes hf-fade-up {
    from { opacity:0; transform:translateY(10px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes hf-fade-in {
    from { opacity:0; }
    to   { opacity:1; }
  }
  @keyframes hf-ambient-drift {
    0%   { transform: scale(1.00) translate(0px,    0px)   rotate(0deg);   opacity:0.55; }
    33%  { transform: scale(1.08) translate(18px,  -12px)  rotate(120deg); opacity:0.80; }
    66%  { transform: scale(0.96) translate(-10px,  16px)  rotate(240deg); opacity:0.60; }
    100% { transform: scale(1.00) translate(0px,    0px)   rotate(360deg); opacity:0.55; }
  }
  @keyframes hf-haze-float {
    0%,100% { transform: translateY(0px)   scaleX(1.00); opacity:0.40; }
    50%     { transform: translateY(-14px) scaleX(1.06); opacity:0.65; }
  }
  @keyframes hf-glow-breathe {
    0%,100% { opacity:0.45; transform:scale(1.00); }
    50%     { opacity:0.80; transform:scale(1.06); }
  }
  @keyframes hf-story-pulse {
    0%,100% { transform:scale(1.00); opacity:0.65; }
    50%     { transform:scale(1.20); opacity:0; }
  }
  @keyframes hf-quiet-shimmer {
    0%   { background-position: -200% 0; }
    100% { background-position:  200% 0; }
  }
  @keyframes hf-presence-dot {
    0%,100% { opacity:1; }
    50%     { opacity:0.35; }
  }

  /* ── Root ───────────────────────── */
  .hf-root {
    background: #F9F7F4;
    min-height: 100%;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display",
                 "Segoe UI", system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
    -webkit-text-size-adjust: 100%;
    color: #1A1A1A;
    overscroll-behavior-y: contain;
    width: 100%;
    position: relative;
  }

  /* ── Tap ────────────────────────── */
  .hf-tap {
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }
  .hf-tap:active {
    opacity: 0.70;
    transform: scale(0.972);
    transition: opacity 0.08s ease, transform 0.08s ease;
  }

  /* ── Card surfaces ──────────────── */
  .hf-card-base {
    background: rgba(255,255,255,0.80);
    backdrop-filter: blur(18px) saturate(1.35);
    -webkit-backdrop-filter: blur(18px) saturate(1.35);
    border: 1px solid rgba(255,255,255,0.58);
    position: relative;
    overflow: hidden;
  }
  .hf-card-base::before {
    content:'';
    position:absolute; inset:0;
    background: linear-gradient(145deg,
      rgba(22,215,197,0.022) 0%,
      transparent 55%,
      rgba(255,138,107,0.014) 100%);
    pointer-events:none;
    border-radius:inherit;
    z-index:0;
  }

  /* ── Feed items reveal ──────────── */
  .hf-reveal {
    animation: hf-fade-up 0.55s cubic-bezier(0.22,1,0.36,1) both;
  }
  .hf-reveal-fast {
    animation: hf-fade-in 0.35s ease both;
  }

  /* ── Hero card ───────────────────── */
  .hf-hero {
    border-radius: 22px;
    box-shadow: 0 12px 48px rgba(0,0,0,0.12), 0 3px 10px rgba(0,0,0,0.06),
                inset 0 1px 0 rgba(255,255,255,0.85);
    transition: transform 0.45s cubic-bezier(0.22,1,0.36,1),
                box-shadow 0.45s cubic-bezier(0.22,1,0.36,1);
  }
  .hf-hero:active {
    transform: scale(0.985) translateY(-2px);
    box-shadow: 0 18px 60px rgba(0,0,0,0.14), 0 4px 14px rgba(0,0,0,0.07);
  }

  /* ── Note card ───────────────────── */
  .hf-note {
    border-radius: 18px;
    box-shadow: 0 1px 5px rgba(0,0,0,0.04), 0 3px 14px rgba(0,0,0,0.045),
                inset 0 1px 0 rgba(255,255,255,0.92);
    transition: transform 0.35s ease, box-shadow 0.35s ease;
  }
  .hf-note:active {
    transform: scale(0.990);
    box-shadow: 0 2px 10px rgba(0,0,0,0.06), 0 6px 22px rgba(0,0,0,0.08);
  }

  /* ── Experience card ─────────────── */
  .hf-experience {
    border-radius: 20px;
    box-shadow: 0 4px 20px rgba(255,138,107,0.08), 0 2px 8px rgba(0,0,0,0.04),
                inset 0 1px 0 rgba(255,255,255,0.88);
    transition: transform 0.4s ease, box-shadow 0.4s ease;
  }
  .hf-experience:active {
    transform: scale(0.987);
  }

  /* ── Resonance card ─────────────── */
  .hf-resonance {
    border-radius: 16px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.035), 0 2px 10px rgba(0,0,0,0.04),
                inset 0 1px 0 rgba(255,255,255,0.90);
    transition: transform 0.3s ease;
  }
  .hf-resonance:active { transform: scale(0.992); }

  /* ── Reaction buttons ────────────── */
  .hf-react-btn {
    display:flex; align-items:center; gap:5px;
    background:none; border:none; cursor:pointer;
    padding:7px 10px; border-radius:24px;
    font-size:12px; font-weight:500;
    color:rgba(26,26,26,0.44);
    -webkit-tap-highlight-color:transparent;
    touch-action:manipulation;
    transition:background 0.22s ease, color 0.22s ease, transform 0.12s ease;
    font-family:inherit; line-height:1; letter-spacing:-0.1px;
  }
  .hf-react-btn:active { transform:scale(0.90); }
  .hf-react-btn--active { color:#16D7C5; background:rgba(22,215,197,0.08); }
  .hf-react-btn--warm.hf-react-btn--active { color:#FF8A6B; background:rgba(255,138,107,0.08); }

  /* ── Quiet space ─────────────────── */
  .hf-quiet-shimmer {
    background: linear-gradient(90deg,
      transparent 0%, rgba(22,215,197,0.06) 30%,
      rgba(255,138,107,0.04) 60%, transparent 100%);
    background-size: 200% 100%;
    animation: hf-quiet-shimmer 5s ease-in-out infinite;
  }

  /* ── Media wrap ──────────────────── */
  .hf-media-wrap { position:relative; overflow:hidden; }
  .hf-media-wrap::after {
    content:'';
    position:absolute; inset:0;
    background:linear-gradient(
      180deg,
      transparent 42%,
      rgba(249,247,244,0.12) 72%,
      rgba(249,247,244,0.48) 100%
    );
    pointer-events:none;
  }

  /* ── Story ring ──────────────────── */
  .hf-story-ring { border-radius:50%; flex-shrink:0; }
  .hf-story-ring--colored {
    background:linear-gradient(135deg,#16D7C5 0%,#FF8A6B 100%);
    padding:2.5px;
  }
  .hf-story-ring--live {
    background:linear-gradient(135deg,#FF4D4D 0%,#FF8A6B 100%);
    padding:2.5px;
    animation:hf-story-pulse 2s ease-in-out infinite;
  }
  .hf-story-ring--empty { background:rgba(0,0,0,0.08); padding:2.5px; }

  /* ── Scroll x ────────────────────── */
  .hf-scroll-x {
    display:flex; overflow-x:auto;
    -webkit-overflow-scrolling:touch;
    scrollbar-width:none;
    scroll-snap-type:x proximity;
  }
  .hf-scroll-x::-webkit-scrollbar { display:none; }
  .hf-scroll-x > * { scroll-snap-align:start; flex-shrink:0; }

  /* ── Section label ───────────────── */
  .hf-section-label {
    font-size:12.5px; font-weight:600;
    color:rgba(26,26,26,0.34);
    letter-spacing:0.045em; text-transform:uppercase;
  }

  /* ── Presence dot ────────────────── */
  .hf-presence-dot {
    animation:hf-presence-dot 2.4s ease-in-out infinite;
  }

  /* ── Ambient background ──────────── */
  .hf-ambient-layer {
    position:fixed; inset:0;
    pointer-events:none; overflow:hidden; z-index:0;
  }
  .hf-ambient-blob {
    position:absolute; border-radius:50%;
    pointer-events:none;
    filter:blur(55px);
    mix-blend-mode:multiply;
  }
  .hf-haze {
    position:absolute;
    pointer-events:none;
    animation:hf-haze-float 10s ease-in-out infinite;
  }

  /* ── Badge ───────────────────────── */
  .hf-badge {
    display:inline-flex; align-items:center;
    padding:3px 9px; border-radius:20px;
    font-size:10px; font-weight:700;
    letter-spacing:0.03em; line-height:1;
  }
`;

/* ─── Mock Data ─────────────────────────────────────────────────────────── */
const MOCK_STORIES = [
  { id:"you",  label:"Dein Moment", avatar:null, isYou:true,  isLive:false },
  { id:"mia",  label:"Mia",   avatar:"https://i.pravatar.cc/80?img=47", isLive:false },
  { id:"leon", label:"Leon",  avatar:"https://i.pravatar.cc/80?img=51", isLive:true  },
  { id:"sara", label:"Sara",  avatar:"https://i.pravatar.cc/80?img=45", isLive:false },
  { id:"kai",  label:"Kai",   avatar:"https://i.pravatar.cc/80?img=33", isLive:false },
];

const MOCK_EVENTS = [
  { id:"e1", title:"Keramik Workshop",
    time:"Heute 18:30", location:"München",
    img:"https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400&q=80",
    badge:"Noch 2 Plätze", badgeColor:"#FF8A6B" },
  { id:"e2", title:"Live Musik Session",
    time:"Heute 20:00", location:"Berlin",
    img:"https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80",
    badge:"LIVE", badgeColor:"#FF4D4D" },
  { id:"e3", title:"Holz & Design Markt",
    time:"Morgen 11:00", location:"Hamburg",
    img:"https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=400&q=80",
    badge:null },
];

const MOCK_FEED = [
  { id:"f1", type:"work_upload", rhythmState:"hero", presenceState:"creating",
    name:"Lena Morgenstern", talent:"Keramik", location:"Rostock",
    avatar:"https://i.pravatar.cc/80?img=47", isVerified:true,
    caption:"Neue Schalen aus dem Brennofen — jede ein Unikat aus lokalem Ton.",
    images:[
      "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&q=85",
      "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=500&q=80",
      "https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=500&q=80",
    ],
    resonanz:34, berührt:12, begleitet:7,
    viewers:["https://i.pravatar.cc/32?img=12","https://i.pravatar.cc/32?img=23",
             "https://i.pravatar.cc/32?img=34"], viewerExtra:8, time:"vor 2 Std." },
  { id:"f2", type:"note", rhythmState:"note", presenceState:"reflecting",
    name:"Marcus Keil", talent:"Musik", location:"München",
    avatar:"https://i.pravatar.cc/80?img=51", isVerified:false,
    caption:"Manchmal entsteht das Schönste, wenn man aufhört, etwas erschaffen zu wollen. Heute im Studio einfach gespielt — keine Erwartung, nur Klang.",
    resonanz:18, berührt:9, begleitet:4,
    viewers:[], viewerExtra:0, time:"vor 3 Std." },
  { id:"f3", type:"experience", rhythmState:"experience", presenceState:"gathering",
    name:"Studio Fink", talent:"Keramik & Ton", location:"München Schwabing",
    avatar:"https://i.pravatar.cc/80?img=44", isVerified:true,
    caption:"Stille Hände, lebendiger Ton — komm in den Kreis.",
    expImg:"https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&q=80",
    expTitle:"Keramik Abend — offenes Atelier",
    expMeta:"Freitag 19:00 · München · 18 €",
    resonanz:26, berührt:11, begleitet:14,
    viewers:["https://i.pravatar.cc/32?img=20","https://i.pravatar.cc/32?img=21"],
    viewerExtra:5, time:"vor 5 Std." },
  { id:"f4", type:"work_upload", rhythmState:"resonance", presenceState:"resonating",
    name:"Yuki Tanaka", talent:"Illustration", location:"Hamburg",
    avatar:"https://i.pravatar.cc/80?img=45", isVerified:true,
    caption:"Herbst-Serie 2025 — Tinte auf Reispapier.",
    images:["https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=600&q=80"],
    resonanz:28, berührt:19, begleitet:3,
    viewers:["https://i.pravatar.cc/32?img=10","https://i.pravatar.cc/32?img=22"],
    viewerExtra:2, time:"vor 6 Std." },
];

const MOCK_PEOPLE = [
  { id:"p1", name:"Sophie H.", role:"Textil & Druck", location:"Berlin",
    tags:["Stoff","Natur"], presenceState:"creating", status:"Verfügbar", avatar:"https://i.pravatar.cc/200?img=32" },
  { id:"p2", name:"Tom B.",    role:"Fotografie",      location:"Leipzig",
    tags:["Analog","Portrait"], presenceState:"reflecting", status:"Im Atelier",   avatar:"https://i.pravatar.cc/200?img=53" },
  { id:"p3", name:"Elena V.",  role:"Keramik",         location:"Köln",
    tags:["Ton","Gefäße"], presenceState:"resonating", status:"Verfügbar",          avatar:"https://i.pravatar.cc/200?img=41" },
  { id:"p4", name:"Nico F.",   role:"Holzarbeit",      location:"München",
    tags:["Möbel","Handwerk"], status:null,             avatar:"https://i.pravatar.cc/200?img=68" },
];

/* ═══════════════════════════════════════════════════════════════════════════
   ROOT
   ═══════════════════════════════════════════════════════════════════════════ */
export default function HomeFeed({
  stories   = null, feedItems = null, events = null, people = null,
  onProfile = null, onStory   = null, onEvent = null,
  onLike    = null, onComment = null,
}) {
  const feedData  = useFeedData?.() || {};
  const liveItems = feedItems || feedData?.feedItems || MOCK_FEED;

  return (
    <div className="hf-root" style={{ paddingBottom:28, width:"100%" }}>
      <style>{CSS}</style>

      {/* ── Living Background System ──────────────────────────────────── */}
      <AmbientBackground />

      <div style={{ position:"relative", zIndex:1 }}>

        {/* Story Leiste */}
        {SAFE_MODE.homeFeed && (
          <StoryLeiste stories={stories || MOCK_STORIES} onStory={onStory} />
        )}

        {/* Events */}
        {SAFE_MODE.homeFeed && (
          <EventsSection events={events || MOCK_EVENTS} onEvent={onEvent} />
        )}

        {/* Rhythmic Feed */}
        {SAFE_MODE.homeFeed && (
          <RhythmicFeed
            items={liveItems}
            onProfile={onProfile}
            onLike={onLike}
            onComment={onComment}
          />
        )}

        {/* Menschen */}
        {SAFE_MODE.homeFeed && (
          <MenschenSection people={people || MOCK_PEOPLE} onPerson={onProfile} />
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   AMBIENT BACKGROUND — barely visible, only emotionally noticeable
   ═══════════════════════════════════════════════════════════════════════════ */
function AmbientBackground() {
  return (
    <div className="hf-ambient-layer">
      {/* Primary teal field — top right */}
      <div className="hf-ambient-blob" style={{
        width:380, height:380,
        top:-100, right:-100,
        background:"rgba(22,215,197,0.055)",
        animation:"hf-ambient-drift 18s ease-in-out infinite",
      }}/>
      {/* Coral field — bottom left */}
      <div className="hf-ambient-blob" style={{
        width:280, height:280,
        bottom:60, left:-80,
        background:"rgba(255,138,107,0.040)",
        animation:"hf-ambient-drift 24s ease-in-out infinite",
        animationDelay:"-8s",
      }}/>
      {/* Mid-page warmth */}
      <div className="hf-ambient-blob" style={{
        width:220, height:160,
        top:"42%", left:"20%",
        background:"rgba(255,240,220,0.060)",
        borderRadius:"60% 40% 55% 45% / 50% 60% 40% 50%",
        animation:"hf-ambient-drift 30s ease-in-out infinite",
        animationDelay:"-14s",
      }}/>
      {/* Depth haze — top vignette */}
      <div className="hf-haze" style={{
        top:0, left:0, right:0, height:80,
        background:"linear-gradient(180deg, rgba(249,247,244,0.65) 0%, transparent 100%)",
        animationDuration:"0s",
        animation:"none",
      }}/>
      {/* Depth haze — bottom */}
      <div style={{
        position:"absolute", bottom:0, left:0, right:0, height:60,
        background:"linear-gradient(0deg, rgba(249,247,244,0.70) 0%, transparent 100%)",
        pointerEvents:"none",
      }}/>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   STORY LEISTE
   ═══════════════════════════════════════════════════════════════════════════ */
function StoryLeiste({ stories, onStory }) {
  return (
    <div style={{ paddingTop:14, paddingBottom:6 }}>
      <div className="hf-scroll-x" style={{ gap:13, paddingLeft:16, paddingRight:16 }}>
        {stories.map(s => (
          <StoryBubble key={s.id} story={s} onPress={() => onStory?.(s)} />
        ))}
      </div>
    </div>
  );
}

function StoryBubble({ story, onPress }) {
  const ringCls = story.isLive
    ? "hf-story-ring hf-story-ring--live"
    : (story.isYou || story.isMore)
      ? "hf-story-ring hf-story-ring--empty"
      : "hf-story-ring hf-story-ring--colored";

  return (
    <button onClick={onPress} className="hf-tap" style={{
      background:"none", border:"none", cursor:"pointer", padding:0,
      display:"flex", flexDirection:"column", alignItems:"center", gap:5,
    }}>
      <div className={ringCls}>
        <div style={{
          width:50, height:50, borderRadius:"50%", overflow:"hidden",
          background: story.isYou
            ? "rgba(22,215,197,0.08)"
            : `linear-gradient(135deg, ${T.teal}, ${T.coral})`,
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          {story.isYou
            ? <span style={{ fontSize:21, color:T.teal, fontWeight:300 }}>+</span>
            : story.avatar
              ? <img src={story.avatar} alt={story.label}
                  style={{ width:"100%", height:"100%", objectFit:"cover" }} loading="lazy"/>
              : <span style={{ fontSize:18, color:"rgba(26,26,26,0.25)" }}>✦</span>
          }
        </div>
      </div>
      <span style={{
        fontSize:10, fontWeight:500,
        color: story.isLive ? T.coral : T.muted,
        letterSpacing:-0.05, maxWidth:54,
        textAlign:"center", lineHeight:1.2,
        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
      }}>
        {story.isLive ? "● LIVE" : story.label}
      </span>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   EVENTS SECTION
   ═══════════════════════════════════════════════════════════════════════════ */
function EventsSection({ events, onEvent }) {
  return (
    <div style={{ paddingTop:6, paddingBottom:2 }}>
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        paddingLeft:16, paddingRight:16, marginBottom:11,
      }}>
        <span className="hf-section-label">{"Heute in deiner Nähe"}</span>
        <button className="hf-tap" style={{
          background:"none", border:"none", cursor:"pointer",
          fontSize:12, fontWeight:600, color:T.teal, padding:"2px 0",
        }}>{"Alle ›"}</button>
      </div>
      <div className="hf-scroll-x" style={{ gap:9, paddingLeft:16, paddingRight:16 }}>
        {events.map(ev => (
          <EventCard key={ev.id} event={ev} onPress={() => onEvent?.(ev)} />
        ))}
      </div>
    </div>
  );
}

function EventCard({ event, onPress }) {
  return (
    <button onClick={onPress} className="hf-tap" style={{
      background:"none", border:"none", cursor:"pointer", padding:0, width:150, flexShrink:0,
    }}>
      <div className="hf-card-base" style={{
        borderRadius:T.r16, overflow:"hidden",
        boxShadow: T.shadowMd,
      }}>
        <div className="hf-media-wrap" style={{ height:100, position:"relative" }}>
          <img src={event.img} alt={event.title} loading="lazy"
            style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}/>
          <div style={{
            position:"absolute", inset:0,
            background:"linear-gradient(180deg, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.52) 100%)",
          }}/>
          {event.badge && (
            <div className="hf-badge" style={{
              position:"absolute", top:7, left:7,
              background: event.badgeColor || T.coral, color:"white",
            }}>{event.badge}</div>
          )}
          <div style={{
            position:"absolute", bottom:0, left:0, right:0, padding:"7px 9px 9px",
          }}>
            <div style={{ fontSize:11.5, fontWeight:700, color:"white",
              lineHeight:1.2, marginBottom:2 }}>{event.title}</div>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.75)" }}>
              {event.time} · {event.location}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   RHYTHMIC FEED — Feed Intelligence v1
   Replaces mechanical sequence with humane curation.
   ═══════════════════════════════════════════════════════════════════════════ */
function RhythmicFeed({ items, onProfile, onLike, onComment }) {
  const rawItems = items || MOCK_FEED;
  const [reactions, setReactions] = useState({});

  // ── Phase 16: Living Memory ───────────────────────────────────────────────
  // Extracts all creator IDs from feed for memory pre-build
  const feedCreatorIds = useMemo(() =>
    [...new Set((rawItems||[]).map(i => i.creator_id||i.user_id||i.creatorId).filter(Boolean))],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [(rawItems||[]).map(i=>i.creator_id||i.user_id||i.creatorId).join(",")]
  );

  const {
    viewerContext,
    recordReaction: memRecordReaction,
    recordProfileVisit,
    getRelationshipDepth,
  } = useLivingMemory(user, feedCreatorIds);

  const handleReaction = useCallback((itemId, type) => {
    setReactions(prev => {
      const cur = prev[itemId] || {};
      return { ...prev, [itemId]: { ...cur, [type]: !cur[type] } };
    });
    onLike?.(itemId);
    // Phase 16: record via Living Memory hook (throttled, debounced)
    const feedItem = (rawItems || []).find(i => i.id === itemId);
    const cid = feedItem?.creator_id || feedItem?.user_id || feedItem?.creatorId;
    if (cid) memRecordReaction(cid, type);
  }, [onLike, memRecordReaction, rawItems]);

  // ── Feed Intelligence: humane curation ──────────────────────────────────
  const curated = useMemo(() => {
    const now  = new Date();
    const safe = filterValidFeedItems(rawItems);
    // Pass raw (non-frozen) items to allow enrichment + relationship tokens
    const enrichable = safe.map(item => ({ ...item }));
    // Phase 16: viewerContext from useLivingMemory — never null,
    // contains full relationship depths pre-built from localStorage
    // Build relationship map from pre-computed depths in viewerContext
    let relationshipMap = null;
    if (viewerContext.relationshipDepths && enrichable.length > 0) {
      const depths = viewerContext.relationshipDepths;
      const entries = Object.entries(depths);
      if (entries.length > 0) {
        relationshipMap = new Map();
        for (const [creatorId, depth] of entries) {
          // Re-use pre-built relationship tokens directly (avoid re-computation)
          if (depth?.state) {
            relationshipMap.set(creatorId, {
              state:          depth.state,
              resonanceScore: depth.resonanceScore || 0,
              warmthBoost:    depth.warmthBoost    || 0,
              motionCalm:     depth.motionCalm     || 0,
              glowBoost:      depth.glowBoost      || 0,
              cardDelay:      depth.cardDelay      || 1.0,
              microMoment:    depth.microMoment    || null,
              _fallback:      false,
            });
          }
        }
        if (relationshipMap.size === 0) relationshipMap = null;
      }
    }

    return curateHumaneFeed(enrichable, {
      now,
      diversity:   true,
      pacing:      true,
      rebalance:   true,
      maxItems:    40,
      // Phase 16: viewerContext always hydrated from living memory
      viewerContext,
      relationshipMap,
    });
  // viewerContext is derived from viewerContext object identity
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawItems, viewerContext]);

  const { atmosphere, sharedAtmosphere, resonanceSpaces, worldState, sequence, stats } = curated;

  // DEV: uncomment to debug intelligence layers
  // console.log("[HUI World]", worldState?.temperature?.id, "| Space:", resonanceSpaces?.dominant?.id);

  // ── World breath — synchronized motion pacing
  const worldBreath = worldState?.breath;
  const feedSurface = worldState?.feed;

  // DEV: log curation stats (removed in production by tree-shaking)
  // console.log("[HUI Feed]", stats);

  if ((sequence || []).filter(s => s.kind === "card").length === 0) {
    return <FeedEmptyState />;
  }

  return (
    <div style={{ padding:"18px 0 0" }}>

      {/* ── Section header with time-of-day atmosphere ──────────────── */}
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        paddingLeft:16, paddingRight:16, marginBottom:16,
      }}>
        <div>
          <span className="hf-section-label">{atmosphere.feedLabel}</span>
          {atmosphere.feedTagline && (
            <div style={{
              fontSize:11, color:T.muted, marginTop:2,
              fontStyle:"italic", letterSpacing:-0.05,
            }}>
              {atmosphere.feedTagline}
            </div>
          )}
        </div>

        {/* Community presence — space-aware, never aggressive */}
        <div style={{
          display:"flex", alignItems:"center", gap:5,
          fontSize:11, color:T.muted, fontWeight:500,
        }}>
          <span className="hf-presence-dot" style={{
            width:6, height:6, borderRadius:"50%",
            // Presence dot color shifts with world temperature
            background: worldState?.temperature?.id === "night_still"
              ? "#6B8AC4"
              : worldState?.temperature?.id === "warm_creative"
              ? "#F5A623"
              : worldState?.temperature?.id === "human_warm"
              ? "#FF8A6B"
              : "#4ADE80",
            display:"inline-block",
            // World breath: dot pulses in sync with world rhythm
            animationDuration: worldBreath?.period || "16s",
          }}/>
          <span>12 jetzt aktiv</span>
        </div>
      </div>

      {/* ── Curated feed sequence ─────────────────────────────────── */}
      <div style={{ display:"flex", flexDirection:"column" }}>
        {(sequence || []).map((slot, si) => {
          if (!slot || typeof slot !== "object") return null;

          if (slot.kind === "quiet") {
            return (
              <div key={`quiet-${si}`}
                className="hf-reveal"
                style={{
                  animationDelay:`${Math.min(si * 0.05 + 0.08, 1.2)}s`,
                }}>
                <QuietSpace
                  quoteIdx={slot.quoteIdx || 0}
                  atmosphere={atmosphere}
                  sharedAtmosphere={sharedAtmosphere}
                  resonanceSpaces={resonanceSpaces}
                />
              </div>
            );
          }

          if (slot.kind !== "card" || !slot.item) return null;

          const { item } = slot;
          const state = getRhythmState(item, slot.idx || 0);

          // Variable gap + padding by rhythm state
          const gapBefore = state === "hero" ? 18 : 12;
          const padH      = state === "hero" ? 0  : state === "resonance" ? 16 : 14;

          return (
            <div key={item.id || si}
              className="hf-reveal"
              style={{
                paddingTop:    gapBefore,
                paddingLeft:   padH,
                paddingRight:  padH,
                // _cardDelay: familiar creators appear slightly sooner (0.72–1.0 multiplier)
                // _scaledDelay: already multiplied by stagger + relationship _cardDelay
                animationDelay:`${slot._scaledDelay != null
                  ? Math.min(slot._scaledDelay, 1.6)
                  : Math.min(si * 0.055 * (item._cardDelay ?? 1.0), 1.4)}s`,
              }}>
              <RhythmCard
                item={item}
                state={state}
                atmosphere={atmosphere}
                sharedAtmosphere={sharedAtmosphere}
                resonanceSpaces={resonanceSpaces}
                worldState={worldState}
                itemReactions={reactions[item.id] || {}}
                relationshipDepth={getRelationshipDepth(
                  item?.creator_id || item?.user_id || item?.creatorId
                )}
                viewerId={user?.id || null}
                microMoment={item.microMoment ?? null}
                onProfile={() => {
                  const cid = item?.creator_id || item?.user_id || item?.creatorId;
                  if (cid) recordProfileVisit(cid);
                  onProfile?.(item);
                }}
                onReaction={(type) => handleReaction(item.id, type)}
                onComment={() => onComment?.(item)}
              />
            </div>
          );
        })}
      </div>

      <div style={{ height:24 }} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   RHYTHM CARD — routes to the correct visual state
   ═══════════════════════════════════════════════════════════════════════════ */
function RhythmCard({
  item, state, atmosphere, sharedAtmosphere, resonanceSpaces, worldState,
  itemReactions, onProfile, onReaction, onComment,
  // Phase 16: living memory tokens
  relationshipDepth = null, viewerId = null, microMoment = null,
}) {
  const isResonated = itemReactions.resonanz;
  const creatorId   = item?.creator_id || item?.user_id || item?.creatorId;

  // ── Resolve memory tokens (memoized per relationship state) ────────────
  const mt = useMemo(() => resolveMemoryTokens(relationshipDepth), [relationshipDepth?.state]);

  // ── Dwell tracking (IntersectionObserver, passive) ─────────────────────
  const { ref: dwellRef } = useDwellTracker(viewerId, creatorId);

  // ── Animation: calm for familiar creators ──────────────────────────────
  // Never re-renders on scroll — purely CSS multiplier
  const cardAnimStyle = mt.isFamiliar
    ? { animationDuration: `${(1 / mt.animationMultiplier).toFixed(2)}` }
    : {};

  return (
    <div ref={dwellRef} style={{ position:"relative" }}>
      {/* Resonance glow (user-triggered) */}
      {isResonated && (
        <div style={{
          position:"absolute", inset:-16, zIndex:0,
          background:"radial-gradient(ellipse at 50% 60%, rgba(22,215,197,0.08) 0%, transparent 70%)",
          borderRadius:36, pointerEvents:"none",
          transition:"opacity 0.7s ease",
          animation:"hf-glow-breathe 4s ease-in-out infinite",
        }}/>
      )}
      {/* Phase 16: relationship warmth — atmospheric familiarity glow */}
      {mt.isFamiliar && (
        <div style={{
          position:"absolute", inset:-8, zIndex:0,
          background:`radial-gradient(ellipse at 50% 30%, ${mt.ambientGlow} 0%, transparent 65%)`,
          borderRadius:32, pointerEvents:"none",
          transition:`opacity ${0.9 + mt.motionCalm}s ease`,
        }}/>
      )}
      <div style={{ position:"relative", zIndex:1 }}>
        {state === "hero"       && <HeroCard       item={item} itemReactions={itemReactions} onProfile={onProfile} onReaction={onReaction} onComment={onComment} memoryTokens={mt} />}
        {state === "note"       && <NoteCard        item={item} itemReactions={itemReactions} onProfile={onProfile} onReaction={onReaction} onComment={onComment} memoryTokens={mt} />}
        {state === "experience" && <ExperienceCard  item={item} itemReactions={itemReactions} onProfile={onProfile} onReaction={onReaction} onComment={onComment} memoryTokens={mt} />}
        {state === "resonance"  && <ResonanceCard   item={item} itemReactions={itemReactions} onProfile={onProfile} onReaction={onReaction} onComment={onComment} memoryTokens={mt} />}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   STATE 1 — HERO MOMENT
   Large immersive. Full-width. Used for rich multi-image work uploads.
   ═══════════════════════════════════════════════════════════════════════════ */
function HeroCard({ item, itemReactions, onProfile, onReaction, onComment, memoryTokens = null }) {
  const [imgIdx, setImgIdx] = useState(0);
  const creator = useCreator(item);
  const images = item.images || (item.media ? [item.media[0]] : []);
  const hasImages = images.length > 0;
  const microMoment = item.microMoment || null;

  return (
    <div className="hf-card-base hf-hero">
      {/* Creator presence header */}
      <CreatorPresenceHeader item={item} creator={creator} onProfile={onProfile}
        compact={false} microMoment={microMoment} memoryTokens={memoryTokens} />

      {/* Full-width hero media */}
      {hasImages && (
        <div style={{ position:"relative" }}>
          <div className="hf-media-wrap" style={{ height:260 }}>
            <img src={images[imgIdx]} alt="" loading="lazy"
              style={{
                width:"100%", height:"100%", objectFit:"cover", display:"block",
                transition:"opacity 0.35s ease",
              }}
            />
          </div>
          {/* Counter + nav */}
          {images.length > 1 && (
            <>
              <div style={{
                position:"absolute", top:10, right:10, zIndex:2,
                background:"rgba(0,0,0,0.38)",
                backdropFilter:"blur(8px)", WebkitBackdropFilter:"blur(8px)",
                borderRadius:20, padding:"3px 10px",
                fontSize:10, fontWeight:600, color:"white",
                border:"1px solid rgba(255,255,255,0.14)",
              }}>
                {imgIdx + 1}/{images.length}
              </div>
              {/* Thumbnail dots */}
              <div style={{
                position:"absolute", bottom:10, left:0, right:0,
                display:"flex", justifyContent:"center", gap:5, zIndex:2,
              }}>
                {images.map((_, i) => (
                  <button key={i} onClick={() => setImgIdx(i)} className="hf-tap"
                    style={{
                      width: i === imgIdx ? 18 : 6,
                      height:6, borderRadius:3,
                      background: i === imgIdx ? "white" : "rgba(255,255,255,0.45)",
                      border:"none", cursor:"pointer", padding:0,
                      transition:"width 0.25s ease, background 0.25s ease",
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Caption */}
      {item.caption && (
        <div style={{ padding:"12px 16px 6px" }}>
          <p style={{
            margin:0, fontSize:14.5, color:T.ink2, lineHeight:1.58,
            letterSpacing:-0.18, fontWeight:400,
          }}>{item.caption}</p>
        </div>
      )}

      {/* Reaction bar */}
      <ReactionBar item={item} itemReactions={itemReactions}
        onReaction={onReaction} onComment={onComment} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   STATE 2 — CREATOR NOTE
   Compact text-focused. Soft minimal. No large media.
   ═══════════════════════════════════════════════════════════════════════════ */
function NoteCard({ item, itemReactions, onProfile, onReaction, onComment, memoryTokens = null }) {
  const creator = useCreator(item);
  const microMoment = item.microMoment || null;

  return (
    <div className="hf-card-base hf-note" style={{
      background:"rgba(252,250,248,0.90)",
    }}>
      {/* Soft decorative teal line */}
      <div style={{
        position:"absolute", top:0, left:20, right:20, height:1.5, zIndex:2,
        background:`linear-gradient(90deg, transparent, ${T.tealMid}, transparent)`,
      }}/>

      <CreatorPresenceHeader item={item} creator={creator} onProfile={onProfile}
        compact={true} microMoment={microMoment} />

      {/* Large atmospheric quote text */}
      <div style={{ padding:"4px 18px 14px" }}>
        <p style={{
          margin:0,
          fontSize:15.5, fontWeight:400,
          color:T.ink2, lineHeight:1.65,
          letterSpacing:-0.2,
          fontStyle:"italic",
        }}>
          {item.caption || item.text}
        </p>
        {/* Decorative quote mark */}
        <div style={{
          marginTop:12,
          fontSize:11, fontWeight:600,
          color:T.teal, letterSpacing:"0.02em",
          opacity:0.7,
        }}>{"✦"} Gedanke</div>
      </div>

      <ReactionBar item={item} itemReactions={itemReactions}
        onReaction={onReaction} onComment={onComment} minimal={true} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   STATE 3 — EXPERIENCE CARD
   Warm social energy. Event/gathering/workshop.
   ═══════════════════════════════════════════════════════════════════════════ */
function ExperienceCard({ item, itemReactions, onProfile, onReaction, onComment, memoryTokens = null }) {
  const creator = useCreator(item);
  const src = item.expImg || item.media?.[0];
  const microMoment = item.microMoment || null;

  return (
    <div className="hf-card-base hf-experience" style={{
      background:"rgba(255,252,249,0.88)",
    }}>
      {/* Warm coral top accent */}
      <div style={{
        position:"absolute", top:0, left:0, right:0, height:2, zIndex:2,
        background:`linear-gradient(90deg, transparent 0%, ${T.coral}55 40%, ${T.teal}44 80%, transparent 100%)`,
      }}/>

      <CreatorPresenceHeader item={item} creator={creator} onProfile={onProfile}
        compact={false} microMoment={microMoment} memoryTokens={memoryTokens} />

      {/* Experience block: image + info */}
      {src && (
        <div style={{ margin:"0 14px 12px" }}>
          <div className="hf-card-base" style={{
            borderRadius:T.r12, overflow:"hidden",
            boxShadow: T.shadowSm,
            display:"flex",
          }}>
            <div className="hf-media-wrap" style={{ width:92, height:96, flexShrink:0 }}>
              <img src={src} alt="" loading="lazy"
                style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}/>
            </div>
            <div style={{
              flex:1, padding:"12px 13px",
              display:"flex", flexDirection:"column", justifyContent:"center", gap:5,
              background:"rgba(255,255,255,0.55)",
            }}>
              <div style={{ fontSize:13.5, fontWeight:700, color:T.ink,
                letterSpacing:-0.25, lineHeight:1.22 }}>
                {item.expTitle || item.title}
              </div>
              <div style={{ fontSize:11.5, color:T.muted, lineHeight:1.38 }}>
                {item.expMeta || item.description}
              </div>
              <div style={{
                display:"inline-flex", alignItems:"center", gap:3, marginTop:1,
                fontSize:11, fontWeight:700, color:T.coral,
              }}>{"Jetzt anmelden ›"}</div>
            </div>
          </div>
        </div>
      )}

      {item.caption && (
        <div style={{ padding:"0 16px 8px" }}>
          <p style={{ margin:0, fontSize:13.5, color:T.ink3,
            lineHeight:1.52, letterSpacing:-0.12 }}>{item.caption}</p>
        </div>
      )}

      <ReactionBar item={item} itemReactions={itemReactions}
        onReaction={onReaction} onComment={onComment} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   STATE 4 — COMMUNITY RESONANCE
   Compact. Interaction-focused. Feels human and alive.
   ═══════════════════════════════════════════════════════════════════════════ */
function ResonanceCard({ item, itemReactions, onProfile, onReaction, onComment, memoryTokens = null }) {
  const creator = useCreator(item);
  const img = item.images?.[0] || item.media?.[0] || item.expImg;

  return (
    <div className="hf-card-base hf-resonance">
      <div style={{ display:"flex", alignItems:"flex-start", padding:"12px 13px 0", gap:11 }}>
        {/* Compact avatar with presence */}
        <button onClick={onProfile} className="hf-tap" style={{
          background:"none", border:"none", cursor:"pointer", padding:0, flexShrink:0,
        }}>
          <PresenceAvatar
            src={creator.avatar}
            name={creator.displayName}
            size={44}
            presenceState={item.presenceState || null}
            isVerified={creator.isVerified}
          />
        </button>

        {/* Content */}
        <div style={{ flex:1, minWidth:0 }}>
          {/* Name row */}
          <div style={{
            display:"flex", alignItems:"center", gap:5, marginBottom:1,
          }}>
            <span style={{ fontSize:13.5, fontWeight:700, color:T.ink, letterSpacing:-0.25 }}>
              {creator.displayName}
            </span>
            {creator.isVerified && (
              <span style={{ fontSize:10.5, color:T.teal, fontWeight:700 }}>✦</span>
            )}
            <span style={{ fontSize:11, color:T.muted2, marginLeft:"auto" }}>{item.time}</span>
          </div>
          <div style={{ fontSize:11.5, color:T.muted, marginBottom:6 }}>
            {creator.talent}{creator.location ? ` · ${creator.location}` : ""}
          </div>

          {/* Presence label */}
          {item.presenceState && (
            <div style={{ marginBottom:4 }}>
              <PresenceLabel presenceState={item.presenceState} />
            </div>
          )}

          {/* Caption */}
          {item.caption && (
            <p style={{ margin:"0 0 8px", fontSize:13.5, color:T.ink2,
              lineHeight:1.52, letterSpacing:-0.12 }}>
              {item.caption}
            </p>
          )}

          {/* Compact image if present */}
          {img && (
            <div className="hf-media-wrap" style={{
              borderRadius:T.r8, overflow:"hidden",
              height:110, marginBottom:8,
              boxShadow: T.shadowSm,
            }}>
              <img src={img} alt="" loading="lazy"
                style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}/>
            </div>
          )}
        </div>
      </div>

      {/* Compact reaction row */}
      <ReactionBar item={item} itemReactions={itemReactions}
        onReaction={onReaction} onComment={onComment} minimal={true} compact={true} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   STATE 5 — QUIET SPACE
   Visual breathing. Atmospheric quote. Soft haze.
   ═══════════════════════════════════════════════════════════════════════════ */
function QuietSpace({ quoteIdx = 0, atmosphere = null, sharedAtmosphere = null, resonanceSpaces = null }) {
  // Use atmosphere's time-of-day quote pool if available
  const pool  = (atmosphere?.quotePool?.length > 0) ? atmosphere.quotePool : AMBIENT_QUOTES;
  const quote = pool[quoteIdx % pool.length];

  return (
    <div style={{
      margin:"8px 20px",
      borderRadius:T.r20,
      padding:"20px 22px",
      position:"relative", overflow:"hidden",
      background:"rgba(249,247,244,0.60)",
      border:"1px solid rgba(22,215,197,0.08)",
    }}>
      {/* Shimmer haze */}
      <div className="hf-quiet-shimmer" style={{
        position:"absolute", inset:0, borderRadius:"inherit",
        pointerEvents:"none",
      }}/>
      {/* Ambient blobs */}
      <div style={{
        position:"absolute", top:-20, right:-20,
        width:80, height:80, borderRadius:"50%",
        background:"rgba(22,215,197,0.06)", filter:"blur(20px)",
        pointerEvents:"none",
      }}/>
      <div style={{
        position:"absolute", bottom:-15, left:10,
        width:60, height:60, borderRadius:"50%",
        background:"rgba(255,138,107,0.05)", filter:"blur(18px)",
        pointerEvents:"none",
      }}/>

      {/* Quote */}
      <div style={{ position:"relative", zIndex:1, textAlign:"center" }}>
        <div style={{
          fontSize:13, color:T.teal,
          marginBottom:8, opacity:0.6, letterSpacing:"0.04em",
        }}>{"✦ ✦ ✦"}</div>
        <p style={{
          margin:"0 0 10px",
          fontSize:14, fontWeight:400, fontStyle:"italic",
          color:"rgba(26,26,26,0.52)", lineHeight:1.65,
          letterSpacing:-0.1,
        }}>
          {quote}
        </p>
        <div style={{
          fontSize:11, color:T.muted2,
          letterSpacing:"0.04em", textTransform:"uppercase", fontWeight:600,
        }}>HUI</div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SHARED: CREATOR HEADER
   ═══════════════════════════════════════════════════════════════════════════ */
function CreatorHeader({ item, creator, onProfile, compact = false }) {
  return (
    <button onClick={onProfile} className="hf-tap" style={{
      background:"none", border:"none", cursor:"pointer", padding:0,
      width:"100%", display:"block", textAlign:"left",
    }}>
      <div style={{
        display:"flex", alignItems:"center",
        padding: compact ? "11px 14px 8px" : "13px 14px 10px",
        gap:10,
      }}>
        {/* Avatar */}
        <div style={{ position:"relative", flexShrink:0 }}>
          <div style={{
            width: compact ? 44 : 50,
            height: compact ? 44 : 50,
            borderRadius:"50%", overflow:"hidden",
            background:`linear-gradient(135deg, ${T.teal}, ${T.coral})`,
            boxShadow:`0 0 0 2px rgba(255,255,255,0.92), 0 2px 10px rgba(22,215,197,0.16)`,
          }}>
            {creator.avatar
              ? <img src={creator.avatar} alt={creator.displayName}
                  style={{ width:"100%", height:"100%", objectFit:"cover" }} loading="lazy"/>
              : <div style={{ width:"100%", height:"100%",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize: compact ? 17 : 20, fontWeight:700, color:"white" }}>
                  {(creator.displayName||"?")[0].toUpperCase()}
                </div>
            }
          </div>
          {item.isLive && (
            <div style={{
              position:"absolute", bottom:1, right:1,
              width:12, height:12, borderRadius:"50%",
              background:"#FF4D4D", border:"2px solid white",
              boxShadow:"0 0 5px rgba(255,77,77,0.5)",
            }}/>
          )}
        </div>

        {/* Identity */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:2 }}>
            <span style={{
              fontSize: compact ? 13.5 : 15,
              fontWeight:700, color:T.ink,
              letterSpacing:-0.28, lineHeight:1.18,
              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
            }}>{creator.displayName}</span>
            {creator.isVerified && (
              <span style={{ fontSize:10.5, color:T.teal, fontWeight:700, flexShrink:0 }}>✦</span>
            )}
          </div>
          <div style={{
            fontSize:11.5, color:T.muted, lineHeight:1.28,
            display:"flex", alignItems:"center", gap:4,
            overflow:"hidden",
          }}>
            {creator.talent && (
              <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                maxWidth:90 }}>{creator.talent}</span>
            )}
            {creator.talent && creator.location && (
              <span style={{ color:T.muted2, flexShrink:0 }}>·</span>
            )}
            {creator.location && (
              <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                color:"rgba(26,26,26,0.30)" }}>{creator.location}</span>
            )}
          </div>
        </div>

        {/* Time + menu */}
        <div style={{
          display:"flex", flexDirection:"column",
          alignItems:"flex-end", gap:4, flexShrink:0,
        }}>
          <span style={{ fontSize:10.5, color:T.muted2 }}>{item.time || ""}</span>
          <button className="hf-tap" onClick={e => e.stopPropagation()} style={{
            background:"none", border:"none", cursor:"pointer",
            padding:"2px 3px", color:T.muted2,
            fontSize:15, letterSpacing:1.5, lineHeight:1,
          }}>{"···"}</button>
        </div>
      </div>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SHARED: REACTION BAR — HUI language
   ═══════════════════════════════════════════════════════════════════════════ */
function ReactionBar({ item, itemReactions, onReaction, onComment, minimal=false, compact=false }) {
  const resonanzCount  = (item.resonanz  || 0) + (itemReactions.resonanz  ? 1 : 0);
  const berührtCount   = (item.berührt   || 0) + (itemReactions.berührt   ? 1 : 0);
  const begleitetCount = (item.begleitet || 0) + (itemReactions.begleitet ? 1 : 0);

  return (
    <div style={{
      display:"flex", alignItems:"center",
      padding: compact ? "6px 8px 8px" : "7px 6px 11px",
      borderTop:`1px solid ${T.borderSoft}`,
      marginTop: compact ? 6 : 8,
      gap:1,
    }}>
      {/* Resonanz */}
      <button
        onClick={() => onReaction("resonanz")}
        className={`hf-react-btn${itemReactions.resonanz ? " hf-react-btn--active":""}`}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.176 1.75-5.191 4.438-5.191
               1.787 0 3.481.926 4.562 2.354C11.081 2.926 12.775 2 14.562 2
               17.25 2 19 4.015 19 7.191c0 4.105-5.37 8.863-11 14.402z"
            fill={itemReactions.resonanz ? T.teal : "none"}
            stroke={itemReactions.resonanz ? T.teal : "rgba(26,26,26,0.38)"}
            strokeWidth="1.6"
          />
        </svg>
        <span style={{ fontWeight: itemReactions.resonanz ? 600 : 400 }}>
          {resonanzCount > 0 ? `${resonanzCount} ` : ""}Resonanz
        </span>
      </button>

      {!minimal && (
        <button
          onClick={() => onReaction("inspiriert")}
          className={`hf-react-btn${itemReactions.inspiriert ? " hf-react-btn--active":""}`}>
          <span style={{ fontSize:12 }}>{itemReactions.inspiriert ? "✦" : "✧"}</span>
          <span>inspiriert</span>
        </button>
      )}

      <button
        onClick={() => onReaction("berührt")}
        className={`hf-react-btn hf-react-btn--warm${itemReactions.berührt ? " hf-react-btn--active":""}`}>
        <span style={{ fontSize:11 }}>◎</span>
        <span>{"berührt"}</span>
      </button>

      <div style={{ flex:1 }} />

      {/* Viewer stack */}
      {(item.viewers?.length > 0) && (
        <ViewerStack viewers={item.viewers} extra={item.viewerExtra || 0} />
      )}
    </div>
  );
}

function ViewerStack({ viewers, extra }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:3, paddingRight:4 }}>
      <div style={{ display:"flex" }}>
        {viewers.slice(0, 3).map((av, i) => (
          <div key={i} style={{
            width:19, height:19, borderRadius:"50%", overflow:"hidden",
            marginLeft: i === 0 ? 0 : -7,
            border:"1.5px solid white",
            background:`linear-gradient(135deg, ${T.teal}, ${T.coral})`,
            boxShadow:"0 1px 3px rgba(0,0,0,0.09)",
          }}>
            <img src={av} alt=""
              style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
          </div>
        ))}
      </div>
      {extra > 0 && (
        <span style={{ fontSize:10, color:T.muted2, fontWeight:600 }}>+{extra}</span>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   EMPTY STATE — human emotional guidance
   ═══════════════════════════════════════════════════════════════════════════ */
function FeedEmptyState() {
  return (
    <div style={{
      display:"flex", flexDirection:"column", alignItems:"center",
      padding:"48px 32px 40px", textAlign:"center",
      position:"relative",
    }}>
      {/* Ambient glow */}
      <div style={{
        position:"absolute", top:0, left:"50%", transform:"translateX(-50%)",
        width:240, height:180,
        background:"radial-gradient(ellipse, rgba(22,215,197,0.10) 0%, transparent 70%)",
        pointerEvents:"none",
        animation:"hf-glow-breathe 5s ease-in-out infinite",
      }}/>

      {/* Orb visual */}
      <div style={{
        width:64, height:64, borderRadius:"50%",
        background:`linear-gradient(135deg, ${T.tealFaint}, ${T.coralFaint})`,
        border:`1.5px solid ${T.tealMid}`,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:24, marginBottom:20,
        boxShadow:`0 0 32px ${T.tealGlow}`,
        animation:"hf-glow-breathe 4s ease-in-out infinite",
      }}>✦</div>

      {/* Emotional copy */}
      <p style={{
        margin:"0 0 8px",
        fontSize:16.5, fontWeight:600,
        color:T.ink, letterSpacing:-0.3, lineHeight:1.35,
      }}>
        Noch keine Momente heute.
      </p>
      <p style={{
        margin:0, fontSize:13.5, color:T.muted,
        lineHeight:1.65, letterSpacing:-0.1, maxWidth:260,
      }}>
        Teile heute etwas, das dich bewegt — vielleicht inspiriert dein Moment jemand anderen.
      </p>

      {/* Quiet divider */}
      <div style={{
        marginTop:28, width:40, height:1,
        background:`linear-gradient(90deg, transparent, ${T.tealMid}, transparent)`,
      }}/>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MENSCHEN SECTION
   ═══════════════════════════════════════════════════════════════════════════ */
function MenschenSection({ people, onPerson }) {
  return (
    <div style={{ padding:"28px 0 32px" }}>
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        paddingLeft:16, paddingRight:16, marginBottom:13,
      }}>
        <span className="hf-section-label">{"Menschen für dich"}</span>
        <button className="hf-tap" style={{
          background:"none", border:"none", cursor:"pointer",
          fontSize:12, fontWeight:600, color:T.teal, padding:"2px 0",
        }}>{"Alle ›"}</button>
      </div>
      <div className="hf-scroll-x" style={{ gap:9, paddingLeft:14, paddingRight:14 }}>
        {(people || []).filter(Boolean).map(p => (
          <PresencePersonCard key={p.id} person={p} onPress={() => onPerson?.(p)} />
        ))}
      </div>
    </div>
  );
}

function PersonCard({ person, onPress }) {
  const [following, setFollowing] = useState(false);

  return (
    <div className="hf-card-base" style={{
      width:148, flexShrink:0,
      borderRadius:T.r16,
      boxShadow: T.shadowMd, overflow:"hidden",
    }}>
      <button onClick={onPress} className="hf-tap" style={{
        background:"none", border:"none", cursor:"pointer",
        padding:0, width:"100%", display:"block",
      }}>
        <div className="hf-media-wrap" style={{ height:108, position:"relative" }}>
          <img src={person.avatar} alt={person.name} loading="lazy"
            style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}/>
          <div style={{
            position:"absolute", inset:0,
            background:"linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.52) 100%)",
          }}/>
          {person.status && (
            <div style={{
              position:"absolute", bottom:7, left:7,
              background:"rgba(255,255,255,0.15)",
              backdropFilter:"blur(10px)", WebkitBackdropFilter:"blur(10px)",
              border:"1px solid rgba(255,255,255,0.26)",
              borderRadius:99, padding:"2.5px 7px",
              fontSize:9, fontWeight:700, color:"white",
              display:"flex", alignItems:"center", gap:3,
            }}>
              <div className={person.status === "Verfügbar" ? "hf-presence-dot" : ""} style={{
                width:5, height:5, borderRadius:"50%",
                background: person.status === "Verfügbar" ? "#4ADE80" : T.coral,
              }}/>
              {person.status}
            </div>
          )}
        </div>
      </button>

      <div style={{ padding:"9px 10px 11px" }}>
        <div style={{ fontSize:12.5, fontWeight:700, color:T.ink,
          letterSpacing:-0.2, marginBottom:1 }}>{person.name}</div>
        <div style={{ fontSize:11, color:T.muted, marginBottom:7, lineHeight:1.3 }}>
          {person.role}
          {person.location && <span style={{ color:T.muted2 }}> · {person.location}</span>}
        </div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:3, marginBottom:8 }}>
          {(person.tags || []).slice(0, 2).map(tag => (
            <span key={tag} style={{
              fontSize:9.5, fontWeight:600, color:T.teal,
              background:T.tealFaint, borderRadius:99, padding:"2px 6px",
            }}>{tag}</span>
          ))}
        </div>
        <button
          onClick={() => setFollowing(f => !f)}
          className="hf-tap"
          style={{
            width:"100%",
            background: following
              ? "rgba(22,215,197,0.08)"
              : `linear-gradient(135deg, ${T.teal}, ${T.teal2})`,
            color: following ? T.teal : "white",
            border: following ? `1.5px solid ${T.tealMid}` : "none",
            borderRadius:99, padding:"6px 0",
            fontSize:11, fontWeight:700,
            cursor:"pointer", fontFamily:"inherit",
            letterSpacing:-0.05,
            transition:"all 0.28s ease",
          }}>
          {following ? "Begleite ich ✦" : "Begleiten"}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   HOOK: useCreator — normalize feed item to safe creator profile
   ═══════════════════════════════════════════════════════════════════════════ */
function useCreator(item) {
  return useMemo(() => createProfileItem({
    id:           item.creatorId || item.userId || item.id,
    display_name: item.name     || item.creator?.name,
    avatar_url:   item.avatar   || item.creator?.avatar,
    talent:       item.talent   || item.category,
    location:     item.location || item.creator?.location,
    is_wirker:    item.isVerified || item.creator?.isVerified,
  }), [
    item.id, item.creatorId, item.name,
    item.avatar, item.talent, item.location, item.isVerified,
  ]);
}
