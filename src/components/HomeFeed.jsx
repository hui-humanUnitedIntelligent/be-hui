// HomeFeed.jsx — HUI Atmospheric Feed v1
// Design: Calm premium creator space. Not dopamine social media.
// Components: AtmosphericCard · CreatorHeader · MediaBlock · ReactionBar · CardSurface

import { useFeedData, useResonanceState } from '../lib/AppStateContext';
import { filterValidFeedItems }            from '../lib/factories/createFeedItem.js';
import { createProfileItem }               from '../lib/factories/createProfileItem.js';
import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { SAFE_MODE } from "../config/safeMode.js";

/* ─── Design Tokens ─────────────────────────────────────────────────────── */
const T = {
  teal:        "#16D7C5",
  tealFaint:   "rgba(22,215,197,0.08)",
  tealGlow:    "rgba(22,215,197,0.22)",
  tealMid:     "rgba(22,215,197,0.14)",
  coral:       "#FF8A6B",
  coralFaint:  "rgba(255,138,107,0.08)",
  coralGlow:   "rgba(255,138,107,0.18)",
  bg:          "#F9F7F4",
  surface:     "rgba(255,255,255,0.82)",
  surfaceDeep: "rgba(255,255,255,0.95)",
  ink:         "#1A1A1A",
  ink2:        "#3A3A3A",
  muted:       "rgba(26,26,26,0.42)",
  muted2:      "rgba(26,26,26,0.24)",
  border:      "rgba(0,0,0,0.045)",
  borderSoft:  "rgba(0,0,0,0.03)",
  // Atmospheric shadows
  shadowCard:  "0 2px 12px rgba(0,0,0,0.055), 0 1px 3px rgba(0,0,0,0.03)",
  shadowHover: "0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.05)",
  shadowFloat: "0 16px 48px rgba(22,215,197,0.08), 0 4px 16px rgba(0,0,0,0.06)",
  radius:      20,
  radiusLg:    24,
  radiusMd:    16,
  radiusSm:    10,
};

/* ─── CSS ───────────────────────────────────────────────────────────────── */
const CSS = `
  @keyframes hf-fade-up {
    from { opacity:0; transform:translateY(8px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes hf-glow-pulse {
    0%,100% { opacity:0.5; }
    50%      { opacity:1; }
  }
  @keyframes hf-story-ring {
    0%,100% { transform:scale(1);    opacity:0.7; }
    50%     { transform:scale(1.18); opacity:0; }
  }
  @keyframes hf-ambient {
    0%   { transform:scale(1)    rotate(0deg);   opacity:0.6; }
    50%  { transform:scale(1.12) rotate(180deg); opacity:1; }
    100% { transform:scale(1)    rotate(360deg); opacity:0.6; }
  }

  .hf-root {
    background: #F9F7F4;
    min-height: 100%;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display",
                 "Segoe UI", system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
    -webkit-text-size-adjust: 100%;
    color: #1A1A1A;
    overscroll-behavior: contain;
    width: 100%;
  }

  /* ── Tap feedback ─────────── */
  .hf-tap { -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
  .hf-tap:active { opacity: 0.72; transform: scale(0.975); transition: all 0.1s ease; }

  /* ── Atmospheric Card Surface ─ */
  .hf-card {
    background: rgba(255,255,255,0.82);
    backdrop-filter: blur(20px) saturate(1.4);
    -webkit-backdrop-filter: blur(20px) saturate(1.4);
    border-radius: 20px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.055), 0 1px 3px rgba(0,0,0,0.03),
                inset 0 1px 0 rgba(255,255,255,0.9);
    overflow: hidden;
    transition: box-shadow 0.4s cubic-bezier(0.22,1,0.36,1),
                transform 0.4s cubic-bezier(0.22,1,0.36,1);
    border: 1px solid rgba(255,255,255,0.6);
    position: relative;
  }
  .hf-card::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg,
      rgba(22,215,197,0.025) 0%,
      transparent 50%,
      rgba(255,138,107,0.015) 100%);
    pointer-events: none;
    border-radius: inherit;
    z-index: 0;
  }
  .hf-card:active {
    box-shadow: 0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.05),
                inset 0 1px 0 rgba(255,255,255,0.9);
    transform: scale(0.988) translateY(-1px);
  }

  /* ── Feed animation ─────────── */
  .hf-feed-item {
    animation: hf-fade-up 0.5s cubic-bezier(0.22,1,0.36,1) both;
  }
  .hf-feed-item:nth-child(1) { animation-delay: 0.00s; }
  .hf-feed-item:nth-child(2) { animation-delay: 0.07s; }
  .hf-feed-item:nth-child(3) { animation-delay: 0.14s; }
  .hf-feed-item:nth-child(4) { animation-delay: 0.21s; }
  .hf-feed-item:nth-child(5) { animation-delay: 0.28s; }

  /* ── Reaction Buttons ─────────── */
  .hf-react-btn {
    display: flex; align-items: center; gap: 5px;
    background: none; border: none; cursor: pointer;
    padding: 7px 11px; border-radius: 24px;
    font-size: 12.5px; font-weight: 500;
    color: rgba(26,26,26,0.48);
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    transition: background 0.2s ease, color 0.2s ease, transform 0.15s ease;
    font-family: inherit;
    line-height: 1;
    letter-spacing: -0.1px;
  }
  .hf-react-btn:active { transform: scale(0.92); }
  .hf-react-btn--active {
    color: #16D7C5;
    background: rgba(22,215,197,0.08);
  }
  .hf-react-btn--berührt.hf-react-btn--active { color: #FF8A6B; background: rgba(255,138,107,0.08); }

  /* ── Story Ring ─────────── */
  .hf-story-ring {
    background: linear-gradient(135deg, #16D7C5 0%, #FF8A6B 100%);
    padding: 2.5px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .hf-story-ring--live {
    background: linear-gradient(135deg, #FF4D4D 0%, #FF8A6B 100%);
    animation: hf-story-ring 2s ease-in-out infinite;
  }
  .hf-story-ring--empty { background: rgba(0,0,0,0.09); }

  /* ── Horizontal scroll ─────── */
  .hf-scroll-x {
    display: flex;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    scroll-snap-type: x proximity;
  }
  .hf-scroll-x::-webkit-scrollbar { display: none; }
  .hf-scroll-x > * { scroll-snap-align: start; flex-shrink: 0; }

  /* ── Media ambient glow ─────── */
  .hf-media-wrap {
    position: relative;
    overflow: hidden;
  }
  .hf-media-wrap::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      180deg,
      transparent 45%,
      rgba(249,247,244,0.15) 75%,
      rgba(249,247,244,0.55) 100%
    );
    pointer-events: none;
  }

  /* ── Section label ─────── */
  .hf-section-label {
    font-size: 13px;
    font-weight: 600;
    color: rgba(26,26,26,0.38);
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  /* ── Badge ─────────── */
  .hf-badge {
    display: inline-flex; align-items: center;
    padding: 3px 9px; border-radius: 20px;
    font-size: 10px; font-weight: 700;
    letter-spacing: 0.03em; line-height: 1;
  }

  /* ── Ambient orb (decorative) ── */
  .hf-ambient-orb {
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
    animation: hf-ambient 8s ease-in-out infinite;
    filter: blur(40px);
    mix-blend-mode: multiply;
  }
`;

/* ─── Mock-Daten ────────────────────────────────────────────────────────── */
const MOCK_STORIES = [
  { id:"you",  label:"Dein Moment", avatar:null, isYou:true,  isLive:false },
  { id:"mia",  label:"Mia",  avatar:"https://i.pravatar.cc/80?img=47", isLive:false },
  { id:"leon", label:"Leon", avatar:"https://i.pravatar.cc/80?img=51", isLive:true  },
  { id:"sara", label:"Sara", avatar:"https://i.pravatar.cc/80?img=45", isLive:false },
  { id:"kai",  label:"Kai",  avatar:"https://i.pravatar.cc/80?img=33", isLive:false },
];

const MOCK_EVENTS = [
  {
    id:"e1", title:"Keramik Workshop",
    time:"Heute 18:30", location:"München",
    img:"https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400&q=80",
    badge:"Noch 2 Plätze", badgeColor:"#FF8A6B",
  },
  {
    id:"e2", title:"Live Musik Session",
    time:"Heute 20:00", location:"Berlin",
    img:"https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80",
    badge:"LIVE", badgeColor:"#FF4D4D",
  },
  {
    id:"e3", title:"Holz & Design Markt",
    time:"Morgen 11:00", location:"Hamburg",
    img:"https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=400&q=80",
    badge:null,
  },
];

const MOCK_FEED = [
  {
    id:"f1", type:"work_upload",
    name:"Lena Morgenstern", talent:"Keramik", location:"Rostock",
    avatar:"https://i.pravatar.cc/80?img=47",
    isVerified:true,
    caption:"Neue Schalen aus dem Brennofen — jede ein Unikat aus lokalem Ton.",
    images:[
      "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&q=80",
      "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=400&q=80",
      "https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=400&q=80",
    ],
    resonanz:34, berührt:12, begleitet:7,
    viewers:["https://i.pravatar.cc/32?img=12","https://i.pravatar.cc/32?img=23",
             "https://i.pravatar.cc/32?img=34","https://i.pravatar.cc/32?img=56"],
    viewerExtra:5, time:"vor 2 Std.",
  },
  {
    id:"f2", type:"experience",
    name:"Marcus Keil", talent:"Musik", location:"München",
    avatar:"https://i.pravatar.cc/80?img=51",
    isVerified:false,
    caption:"Neue Stücke entstehen — kommt vorbei und hört zu.",
    expImg:"https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80",
    expTitle:"Akustik Session — Atelierkonzert",
    expMeta:"Freitag 20:00 · München Schwabing · 12 €",
    resonanz:12, berührt:4, begleitet:9,
    viewers:[], viewerExtra:0, time:"vor 4 Std.",
  },
  {
    id:"f3", type:"work_upload",
    name:"Yuki Tanaka", talent:"Illustration", location:"Hamburg",
    avatar:"https://i.pravatar.cc/80?img=45",
    isVerified:true,
    caption:"Herbst-Serie 2025 — Tinte auf Reispapier.",
    images:[
      "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=600&q=80",
    ],
    resonanz:28, berührt:19, begleitet:3,
    viewers:["https://i.pravatar.cc/32?img=10","https://i.pravatar.cc/32?img=22"],
    viewerExtra:2, time:"vor 6 Std.",
  },
];

const MOCK_PEOPLE = [
  { id:"p1", name:"Sophie H.", role:"Textil & Druck", location:"Berlin",
    tags:["Stoff","Natur"], status:"Verfügbar",
    avatar:"https://i.pravatar.cc/200?img=32" },
  { id:"p2", name:"Tom B.", role:"Fotografie", location:"Leipzig",
    tags:["Analog","Portrait"], status:"Im Atelier",
    avatar:"https://i.pravatar.cc/200?img=53" },
  { id:"p3", name:"Elena V.", role:"Keramik", location:"Köln",
    tags:["Ton","Gefäße"], status:"Verfügbar",
    avatar:"https://i.pravatar.cc/200?img=41" },
  { id:"p4", name:"Nico F.", role:"Holzarbeit", location:"München",
    tags:["Möbel","Handwerk"], status:null,
    avatar:"https://i.pravatar.cc/200?img=68" },
];

/* ─── Root Component ────────────────────────────────────────────────────── */
export default function HomeFeed({
  stories    = null,
  feedItems  = null,
  events     = null,
  people     = null,
  onProfile  = null,
  onStory    = null,
  onEvent    = null,
  onLike     = null,
  onComment  = null,
}) {
  const feedData = useFeedData?.() || {};
  const liveItems = feedItems || feedData?.feedItems || MOCK_FEED;

  return (
    <div className="hf-root" style={{ paddingBottom: 24, width: "100%" }}>
      <style>{CSS}</style>

      {/* Ambient background orbs — very subtle */}
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", overflow:"hidden", zIndex:0 }}>
        <div className="hf-ambient-orb" style={{
          width:320, height:320,
          top:-80, right:-80,
          background:"rgba(22,215,197,0.06)",
          animationDuration:"12s",
        }}/>
        <div className="hf-ambient-orb" style={{
          width:240, height:240,
          bottom:80, left:-60,
          background:"rgba(255,138,107,0.04)",
          animationDuration:"16s",
          animationDelay:"-5s",
        }}/>
      </div>

      <div style={{ position:"relative", zIndex:1 }}>
        {/* Story Leiste */}
        {SAFE_MODE.homeFeed && (
          <StoryLeiste
            stories={stories || MOCK_STORIES}
            onStory={onStory}
          />
        )}

        {/* Heute in deiner Nähe */}
        {SAFE_MODE.homeFeed && (
          <EventsSection
            events={events || MOCK_EVENTS}
            onEvent={onEvent}
          />
        )}

        {/* Atmosphärischer Feed */}
        {SAFE_MODE.homeFeed && (
          <AtmosphericFeed
            items={liveItems}
            onProfile={onProfile}
            onLike={onLike}
            onComment={onComment}
          />
        )}

        {/* Menschen für dich */}
        {SAFE_MODE.homeFeed && (
          <MenschenSection
            people={people || MOCK_PEOPLE}
            onPerson={onProfile}
          />
        )}
      </div>
    </div>
  );
}

/* ─── Story Leiste ──────────────────────────────────────────────────────── */
function StoryLeiste({ stories, onStory }) {
  return (
    <div style={{ paddingTop:16, paddingBottom:8 }}>
      <div className="hf-scroll-x"
        style={{ gap:14, paddingLeft:16, paddingRight:16 }}>
        {stories.map(story => (
          <StoryBubble key={story.id} story={story} onPress={() => onStory?.(story)} />
        ))}
      </div>
    </div>
  );
}

function StoryBubble({ story, onPress }) {
  const ringCls = story.isLive
    ? "hf-story-ring hf-story-ring--live"
    : story.isYou || story.isMore
      ? "hf-story-ring hf-story-ring--empty"
      : "hf-story-ring";

  return (
    <button onClick={onPress} className="hf-tap" style={{
      background:"none", border:"none", cursor:"pointer", padding:0,
      display:"flex", flexDirection:"column", alignItems:"center", gap:5,
    }}>
      <div className={ringCls}>
        <div style={{
          width:52, height:52, borderRadius:"50%",
          overflow:"hidden",
          background: story.isYou
            ? "none"
            : `linear-gradient(135deg, ${T.teal}, ${T.coral})`,
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          {story.isYou ? (
            <div style={{
              width:"100%", height:"100%", borderRadius:"50%",
              background:"rgba(22,215,197,0.10)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:22,
            }}>+</div>
          ) : story.avatar ? (
            <img src={story.avatar} alt={story.label}
              style={{ width:"100%", height:"100%", objectFit:"cover" }}
              loading="lazy" />
          ) : (
            <div style={{ fontSize:20, color:"rgba(26,26,26,0.3)" }}>✦</div>
          )}
        </div>
      </div>
      <span style={{
        fontSize:10.5, fontWeight:500,
        color: story.isLive ? T.coral : T.muted,
        letterSpacing:-0.1, maxWidth:56,
        textAlign:"center", lineHeight:1.2,
        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
      }}>
        {story.isLive ? "● LIVE" : story.label}
      </span>
    </button>
  );
}

/* ─── Events Section ────────────────────────────────────────────────────── */
function EventsSection({ events, onEvent }) {
  return (
    <div style={{ paddingTop:8, paddingBottom:4 }}>
      <div style={{
        display:"flex", alignItems:"center",
        justifyContent:"space-between",
        paddingLeft:16, paddingRight:16, marginBottom:12,
      }}>
        <span className="hf-section-label">Heute in deiner Nähe</span>
        <button className="hf-tap" style={{
          background:"none", border:"none", cursor:"pointer",
          fontSize:12, fontWeight:600, color:T.teal, padding:"2px 0",
        }}>Alle ›</button>
      </div>

      <div className="hf-scroll-x"
        style={{ gap:10, paddingLeft:16, paddingRight:16 }}>
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
      background:"none", border:"none", cursor:"pointer", padding:0,
      width:155, flexShrink:0,
    }}>
      {/* Card surface */}
      <div style={{
        borderRadius:T.radiusMd,
        overflow:"hidden",
        boxShadow: T.shadowCard,
        background:"rgba(255,255,255,0.75)",
        backdropFilter:"blur(16px)",
        WebkitBackdropFilter:"blur(16px)",
        border:"1px solid rgba(255,255,255,0.5)",
      }}>
        {/* Image */}
        <div className="hf-media-wrap" style={{ height:105, position:"relative" }}>
          <img src={event.img} alt={event.title} loading="lazy"
            style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
          />
          {/* Gradient overlay */}
          <div style={{
            position:"absolute", inset:0,
            background:"linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.55) 100%)",
          }}/>
          {/* Badge */}
          {event.badge && (
            <div className="hf-badge" style={{
              position:"absolute", top:8, left:8,
              background: event.badgeColor || T.coral,
              color:"white",
            }}>
              {event.badge}
            </div>
          )}
          {/* Title over image */}
          <div style={{
            position:"absolute", bottom:0, left:0, right:0,
            padding:"8px 10px 10px",
          }}>
            <div style={{ fontSize:12, fontWeight:700, color:"white",
              lineHeight:1.25, marginBottom:2 }}>{event.title}</div>
            <div style={{ fontSize:10.5, color:"rgba(255,255,255,0.78)" }}>
              {event.time} · {event.location}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

/* ─── Atmospheric Feed ──────────────────────────────────────────────────── */
function AtmosphericFeed({ items, onProfile, onLike, onComment }) {
  const safeItems = useMemo(
    () => filterValidFeedItems(items || MOCK_FEED),
    [items]
  );
  const [reactions, setReactions] = useState({});

  const handleReaction = useCallback((itemId, type) => {
    setReactions(prev => {
      const current = prev[itemId] || {};
      return {
        ...prev,
        [itemId]: { ...current, [type]: !current[type] },
      };
    });
    onLike?.(itemId);
  }, [onLike]);

  return (
    <div style={{ padding:"20px 0 0" }}>
      <div style={{
        display:"flex", alignItems:"center",
        justifyContent:"space-between",
        paddingLeft:16, paddingRight:16, marginBottom:14,
      }}>
        <span className="hf-section-label">Gerade aktiv</span>
      </div>

      <div style={{
        display:"flex", flexDirection:"column", gap:14,
        paddingLeft:14, paddingRight:14,
      }}>
        {safeItems.map((item, idx) => (
          <div key={item.id} className="hf-card hf-feed-item"
            style={{ animationDelay:`${idx * 0.07}s` }}>
            <AtmosphericCard
              item={item}
              itemReactions={reactions[item.id] || {}}
              onProfile={() => onProfile?.(item)}
              onReaction={(type) => handleReaction(item.id, type)}
              onComment={() => onComment?.(item)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Atmospheric Card ──────────────────────────────────────────────────── */
function AtmosphericCard({ item, itemReactions, onProfile, onReaction, onComment }) {
  const isResonated  = itemReactions.resonanz;
  const isInspired   = itemReactions.inspiriert;
  const isBegleitet  = itemReactions.begleitet;

  return (
    <div style={{ position:"relative" }}>
      {/* Subtle ambient glow behind card */}
      {isResonated && (
        <div style={{
          position:"absolute", inset:-12,
          background:"radial-gradient(ellipse, rgba(22,215,197,0.10) 0%, transparent 70%)",
          borderRadius:32, pointerEvents:"none",
          transition:"opacity 0.6s ease",
          zIndex:0,
        }}/>
      )}

      <div style={{ position:"relative", zIndex:1 }}>
        {/* ── Creator Header ──────────────────── */}
        <CreatorHeader
          item={item}
          onProfile={onProfile}
        />

        {/* ── Media Block ─────────────────────── */}
        <MediaBlock item={item} />

        {/* ── Caption ─────────────────────────── */}
        {item.caption && (
          <div style={{ padding:"10px 14px 6px" }}>
            <p style={{
              margin:0, fontSize:14, color:T.ink2, lineHeight:1.55,
              letterSpacing:-0.15, fontWeight:400,
            }}>
              {item.caption}
            </p>
          </div>
        )}

        {/* ── Reaction Bar ────────────────────── */}
        <ReactionBar
          item={item}
          itemReactions={itemReactions}
          onReaction={onReaction}
          onComment={onComment}
        />
      </div>
    </div>
  );
}

/* ─── Creator Header ────────────────────────────────────────────────────── */
function CreatorHeader({ item, onProfile }) {
  // Normalisieren
  const creator = useMemo(() => createProfileItem({
    id: item.creatorId || item.id,
    display_name: item.name || item.creator?.name,
    avatar_url: item.avatar || item.creator?.avatar,
    talent: item.talent || item.category,
    location: item.location || item.creator?.location,
    is_wirker: item.isVerified || item.creator?.isVerified,
  }), [item.id, item.name, item.avatar, item.talent, item.location, item.isVerified]);

  return (
    <button onClick={onProfile} className="hf-tap" style={{
      background:"none", border:"none", cursor:"pointer", padding:0,
      width:"100%", display:"block", textAlign:"left",
    }}>
      <div style={{
        display:"flex", alignItems:"center",
        padding:"13px 14px 10px", gap:11,
      }}>
        {/* Avatar — larger, atmospheric */}
        <div style={{ position:"relative", flexShrink:0 }}>
          <div style={{
            width:50, height:50, borderRadius:"50%",
            overflow:"hidden",
            background:`linear-gradient(135deg, ${T.teal}, ${T.coral})`,
            boxShadow:`0 0 0 2px rgba(255,255,255,0.9), 0 2px 12px rgba(22,215,197,0.18)`,
          }}>
            {creator.avatar ? (
              <img src={creator.avatar} alt={creator.displayName}
                style={{ width:"100%", height:"100%", objectFit:"cover" }}
                loading="lazy" />
            ) : (
              <div style={{
                width:"100%", height:"100%",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:19, fontWeight:700, color:"white",
              }}>
                {(creator.displayName || "?")[0].toUpperCase()}
              </div>
            )}
          </div>
          {/* Live indicator */}
          {item.isLive && (
            <div style={{
              position:"absolute", bottom:1, right:1,
              width:13, height:13, borderRadius:"50%",
              background:"#FF4D4D",
              border:"2px solid white",
              boxShadow:"0 0 6px rgba(255,77,77,0.5)",
            }}/>
          )}
        </div>

        {/* Identity */}
        <div style={{ flex:1, minWidth:0 }}>
          {/* Name + verified */}
          <div style={{
            display:"flex", alignItems:"center", gap:5, marginBottom:2,
          }}>
            <span style={{
              fontSize:15, fontWeight:700, color:T.ink,
              letterSpacing:-0.3, lineHeight:1.2,
              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
            }}>
              {creator.displayName}
            </span>
            {creator.isVerified && (
              <span style={{
                fontSize:11, color:T.teal, flexShrink:0,
                fontWeight:700, letterSpacing:-0.2,
              }}>✦</span>
            )}
          </div>
          {/* Meta: talent · location */}
          <div style={{
            fontSize:12, color:T.muted, lineHeight:1.3,
            display:"flex", alignItems:"center", gap:4,
            overflow:"hidden",
          }}>
            {creator.talent && (
              <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                maxWidth:100 }}>
                {creator.talent}
              </span>
            )}
            {creator.talent && creator.location && (
              <span style={{ color:T.muted2, flexShrink:0 }}>·</span>
            )}
            {creator.location && (
              <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                color:"rgba(26,26,26,0.34)" }}>
                {creator.location}
              </span>
            )}
          </div>
        </div>

        {/* Time + Menu */}
        <div style={{
          display:"flex", flexDirection:"column", alignItems:"flex-end",
          gap:4, flexShrink:0,
        }}>
          <span style={{ fontSize:11, color:T.muted2 }}>{item.time || ""}</span>
          <button className="hf-tap" style={{
            background:"none", border:"none", cursor:"pointer",
            padding:"2px 4px", color:T.muted2,
            fontSize:15, letterSpacing:1.5, lineHeight:1,
          }} onClick={e => e.stopPropagation()}>···</button>
        </div>
      </div>
    </button>
  );
}

/* ─── Media Block ───────────────────────────────────────────────────────── */
function MediaBlock({ item }) {
  if (item.type === "work_upload" && item.images?.length) {
    return <WorkMediaBlock images={item.images} />;
  }
  if (item.type === "experience" && (item.expImg || item.media?.[0])) {
    return <ExperienceMediaBlock item={item} />;
  }
  if (item.media?.[0]) {
    return <SingleMediaBlock src={item.media[0]} alt={item.title} />;
  }
  return null;
}

function WorkMediaBlock({ images }) {
  const [activeIdx, setActiveIdx] = useState(0);

  if (images.length === 1) {
    return (
      <div className="hf-media-wrap" style={{
        margin:"0 14px",
        borderRadius:T.radiusSm,
        overflow:"hidden",
        boxShadow:"0 4px 20px rgba(0,0,0,0.08)",
      }}>
        <img src={images[0]} alt=""
          loading="lazy"
          style={{
            width:"100%", aspectRatio:"4/3",
            objectFit:"cover", display:"block",
          }}
        />
      </div>
    );
  }

  // Multi-image: cinematic 4:3 main + strip
  return (
    <div style={{ margin:"0 14px" }}>
      {/* Main image */}
      <div className="hf-media-wrap" style={{
        borderRadius:`${T.radiusSm}px ${T.radiusSm}px 0 0`,
        overflow:"hidden",
        boxShadow:"0 4px 20px rgba(0,0,0,0.07)",
      }}>
        <img src={images[activeIdx]} alt=""
          loading="lazy"
          style={{
            width:"100%", aspectRatio:"4/3",
            objectFit:"cover", display:"block",
            transition:"opacity 0.3s ease",
          }}
        />
        {/* Image counter */}
        <div style={{
          position:"absolute", top:10, right:10,
          background:"rgba(0,0,0,0.42)",
          backdropFilter:"blur(8px)", WebkitBackdropFilter:"blur(8px)",
          borderRadius:20, padding:"3px 9px",
          fontSize:10.5, fontWeight:600, color:"white",
          border:"1px solid rgba(255,255,255,0.15)",
          zIndex:2,
        }}>
          {activeIdx + 1}/{images.length}
        </div>
      </div>

      {/* Thumbnail strip */}
      <div style={{
        display:"flex", gap:2,
        background:"rgba(0,0,0,0.04)",
        borderRadius:`0 0 ${T.radiusSm}px ${T.radiusSm}px`,
        overflow:"hidden", padding:2,
        paddingTop:0,
      }}>
        {images.slice(0, 4).map((src, i) => (
          <button key={i} className="hf-tap"
            onClick={() => setActiveIdx(i)}
            style={{
              flex:1, background:"none", border:"none",
              cursor:"pointer", padding:0,
            }}>
            <img src={src} alt="" loading="lazy"
              style={{
                width:"100%", height:42, objectFit:"cover", display:"block",
                opacity: i === activeIdx ? 1 : 0.52,
                transition:"opacity 0.2s ease",
                borderRadius: i === 0 ? `0 0 0 ${T.radiusSm}px` : i === images.length-1 ? `0 0 ${T.radiusSm}px 0` : 0,
              }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

function ExperienceMediaBlock({ item }) {
  const src = item.expImg || item.media?.[0];
  return (
    <div style={{ margin:"0 14px" }}>
      <div style={{
        borderRadius:T.radiusSm,
        overflow:"hidden",
        background:"rgba(0,0,0,0.02)",
        border:`1px solid ${T.border}`,
        display:"flex",
        boxShadow:"0 2px 12px rgba(0,0,0,0.06)",
      }}>
        {/* Cinematic image */}
        <div className="hf-media-wrap" style={{ width:100, flexShrink:0 }}>
          <img src={src} alt="" loading="lazy"
            style={{ width:"100%", height:100, objectFit:"cover", display:"block" }}
          />
        </div>

        {/* Info */}
        <div style={{
          padding:"12px 14px",
          flex:1, minWidth:0,
          display:"flex", flexDirection:"column", justifyContent:"center", gap:5,
          background:"rgba(255,255,255,0.6)",
        }}>
          <div style={{
            fontSize:13.5, fontWeight:700, color:T.ink,
            letterSpacing:-0.25, lineHeight:1.25,
          }}>
            {item.expTitle || item.title}
          </div>
          <div style={{ fontSize:12, color:T.muted, lineHeight:1.35 }}>
            {item.expMeta || item.description}
          </div>
          {/* CTA */}
          <div style={{
            display:"inline-flex", alignItems:"center", gap:4, marginTop:2,
            fontSize:11.5, fontWeight:600, color:T.teal,
          }}>
            Mehr erfahren ›
          </div>
        </div>
      </div>
    </div>
  );
}

function SingleMediaBlock({ src, alt }) {
  return (
    <div className="hf-media-wrap" style={{
      margin:"0 14px",
      borderRadius:T.radiusSm,
      overflow:"hidden",
      boxShadow:"0 4px 20px rgba(0,0,0,0.08)",
    }}>
      <img src={src} alt={alt || ""}
        loading="lazy"
        style={{
          width:"100%", aspectRatio:"16/9",
          objectFit:"cover", display:"block",
        }}
      />
    </div>
  );
}

/* ─── Reaction Bar ──────────────────────────────────────────────────────── */
function ReactionBar({ item, itemReactions, onReaction, onComment }) {
  const resonanzCount  = (item.resonanz  || 0) + (itemReactions.resonanz  ? 1 : 0);
  const berührtCount   = (item.berührt   || 0) + (itemReactions.berührt   ? 1 : 0);
  const begleitetCount = (item.begleitet || 0) + (itemReactions.begleitet ? 1 : 0);

  return (
    <div style={{
      display:"flex", alignItems:"center",
      padding:"8px 6px 10px",
      borderTop:`1px solid ${T.borderSoft}`,
      marginTop:8,
      gap:2,
    }}>
      {/* Resonanz */}
      <button
        onClick={() => onReaction("resonanz")}
        className={`hf-react-btn${itemReactions.resonanz ? " hf-react-btn--active" : ""}`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 21.593c-5.63-5.539-11-10.297-11-14.402C1 4.015 2.75 2 5.438 2
               c1.787 0 3.481.926 4.562 2.354C11.081 2.926 12.775 2 14.562 2
               17.25 2 19 4.015 19 7.191c0 4.105-5.37 8.863-11 14.402z"
            fill={itemReactions.resonanz ? T.teal : "none"}
            stroke={itemReactions.resonanz ? T.teal : T.muted}
            strokeWidth="1.6"
          />
        </svg>
        <span style={{ fontWeight: itemReactions.resonanz ? 600 : 400 }}>
          {resonanzCount > 0 ? resonanzCount : ""} Resonanz
        </span>
      </button>

      {/* Inspiriert */}
      <button
        onClick={() => onReaction("inspiriert")}
        className={`hf-react-btn${itemReactions.inspiriert ? " hf-react-btn--active" : ""}`}
      >
        <span style={{ fontSize:13 }}>{itemReactions.inspiriert ? "✦" : "✧"}</span>
        <span>inspiriert</span>
      </button>

      {/* Begleitet */}
      <button
        onClick={() => onReaction("berührt")}
        className={`hf-react-btn hf-react-btn--berührt${itemReactions.berührt ? " hf-react-btn--active" : ""}`}
      >
        <span style={{ fontSize:12 }}>◎</span>
        <span>berührt</span>
      </button>

      <div style={{ flex:1 }} />

      {/* Viewer avatars */}
      {item.viewers?.length > 0 && (
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
            width:20, height:20, borderRadius:"50%",
            overflow:"hidden", marginLeft: i === 0 ? 0 : -7,
            border:"1.5px solid white",
            background:`linear-gradient(135deg, ${T.teal}, ${T.coral})`,
            boxShadow:"0 1px 3px rgba(0,0,0,0.10)",
            flexShrink:0,
          }}>
            <img src={av} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
          </div>
        ))}
      </div>
      {extra > 0 && (
        <span style={{ fontSize:10.5, color:T.muted2, fontWeight:600 }}>+{extra}</span>
      )}
    </div>
  );
}

/* ─── Menschen Section ──────────────────────────────────────────────────── */
function MenschenSection({ people, onPerson }) {
  return (
    <div style={{ padding:"28px 0 32px" }}>
      <div style={{
        display:"flex", alignItems:"center",
        justifyContent:"space-between",
        paddingLeft:16, paddingRight:16, marginBottom:14,
      }}>
        <span className="hf-section-label">Menschen für dich</span>
        <button className="hf-tap" style={{
          background:"none", border:"none", cursor:"pointer",
          fontSize:12, fontWeight:600, color:T.teal, padding:"2px 0",
        }}>
          Alle ›
        </button>
      </div>

      <div className="hf-scroll-x"
        style={{ gap:10, paddingLeft:14, paddingRight:14 }}>
        {(people || []).filter(Boolean).map(person => (
          <PersonCard key={person.id} person={person}
            onPress={() => onPerson?.(person)} />
        ))}
      </div>
    </div>
  );
}

function PersonCard({ person, onPress }) {
  const [following, setFollowing] = useState(false);

  return (
    <div style={{
      width:150, flexShrink:0,
      background:"rgba(255,255,255,0.80)",
      backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)",
      borderRadius:T.radiusMd,
      boxShadow: T.shadowCard,
      border:"1px solid rgba(255,255,255,0.55)",
      overflow:"hidden",
    }}>
      {/* Image */}
      <button onClick={onPress} className="hf-tap" style={{
        background:"none", border:"none", cursor:"pointer",
        padding:0, width:"100%", display:"block",
      }}>
        <div className="hf-media-wrap" style={{ height:112, position:"relative" }}>
          <img src={person.avatar} alt={person.name} loading="lazy"
            style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
          />
          <div style={{
            position:"absolute", inset:0,
            background:"linear-gradient(to bottom, transparent 35%, rgba(0,0,0,0.55) 100%)",
          }}/>
          {/* Presence pill */}
          {person.status && (
            <div style={{
              position:"absolute", bottom:8, left:8,
              background:"rgba(255,255,255,0.16)",
              backdropFilter:"blur(10px)", WebkitBackdropFilter:"blur(10px)",
              border:"1px solid rgba(255,255,255,0.28)",
              borderRadius:99, padding:"2.5px 8px",
              fontSize:9.5, fontWeight:700, color:"white",
              display:"flex", alignItems:"center", gap:4,
            }}>
              <div style={{
                width:5, height:5, borderRadius:"50%",
                background: person.status === "Verfügbar" ? "#4ADE80" : T.coral,
              }}/>
              {person.status}
            </div>
          )}
        </div>
      </button>

      {/* Info */}
      <div style={{ padding:"10px 11px 12px" }}>
        <div style={{
          fontSize:13, fontWeight:700, color:T.ink,
          letterSpacing:-0.2, marginBottom:1,
        }}>
          {person.name}
        </div>
        <div style={{ fontSize:11.5, color:T.muted, marginBottom:8, lineHeight:1.3 }}>
          {person.role}
          {person.location && (
            <span style={{ color:T.muted2 }}> · {person.location}</span>
          )}
        </div>

        {/* Tags */}
        <div style={{ display:"flex", flexWrap:"wrap", gap:3, marginBottom:9 }}>
          {(person.tags || []).slice(0, 2).map(tag => (
            <span key={tag} style={{
              fontSize:10, fontWeight:600,
              color: T.teal,
              background: T.tealFaint,
              borderRadius:99, padding:"2px 7px",
              letterSpacing:-0.1,
            }}>
              {tag}
            </span>
          ))}
        </div>

        {/* Follow button */}
        <button
          onClick={() => setFollowing(f => !f)}
          className="hf-tap"
          style={{
            width:"100%",
            background: following
              ? "rgba(22,215,197,0.08)"
              : "linear-gradient(135deg, #16D7C5, #11C5B7)",
            color: following ? T.teal : "white",
            border: following ? `1.5px solid ${T.tealMid}` : "none",
            borderRadius:99, padding:"6px 0",
            fontSize:11.5, fontWeight:700,
            cursor:"pointer", fontFamily:"inherit",
            letterSpacing:-0.1,
            transition:"all 0.25s ease",
          }}>
          {following ? "Folge ich ✦" : "Begleiten"}
        </button>
      </div>
    </div>
  );
}
