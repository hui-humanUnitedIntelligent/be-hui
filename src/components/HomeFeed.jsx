// HomeFeed_v2.jsx — HUI Premium Social Feed
// Referenz: Screenshot IMG_2347 — Apple + Airbnb + Community DNA
// Design: helle Oberfläche, weicher Schatten, Glassmorphism, Türkis/Coral
// Struktur: StickyHeader → StoryLeiste → Heute in deiner Nähe → SozialerFeed → MenschenFürDich

import { useFeedData, useResonanceState } from '../lib/AppStateContext';
import React, { useState, useRef, useEffect, useCallback } from "react";

/* ─── Design Tokens ──────────────────────────────────────────────────── */
const T = {
  teal:       "#16D7C5",
  teal2:      "#11C5B7",
  tealFaint:  "rgba(22,215,197,0.10)",
  tealGlow:   "rgba(22,215,197,0.18)",
  coral:      "#FF8A6B",
  coralFaint: "rgba(255,138,107,0.10)",
  bg:         "#F9F7F4",
  surface:    "#FFFFFF",
  ink:        "#1A1A1A",
  ink2:       "#3A3A3A",
  muted:      "rgba(26,26,26,0.45)",
  muted2:     "rgba(26,26,26,0.28)",
  border:     "rgba(0,0,0,0.06)",
  borderSoft: "rgba(0,0,0,0.04)",
  shadow:     "0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)",
  shadowHover:"0 2px 8px rgba(0,0,0,0.07), 0 10px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.85)",
  radius:     18,
  radiusLg:   24,
  radiusSm:   12,
};

/* ─── CSS ─────────────────────────────────────────────────────────────── */
const CSS = `
  @keyframes hf-shimmer {
    0%   { background-position: -200% 0; }
    100% { background-position:  200% 0; }
  }
  @keyframes hf-fade-up {
    from { opacity:0; transform:translateY(6px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes hf-pulse-ring {
    0%,100% { transform:scale(1); opacity:0.6; }
    50%     { transform:scale(1.15); opacity:0; }
  }
  .hf-root {
    background: #FBFAF8;
    min-height: 100%;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display",
                 "Segoe UI", system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
    color: #1A1A1A;
    overscroll-behavior: contain;
  }
  /* Story Ring */
  .hf-story-ring {
    background: linear-gradient(135deg, #16D7C5 0%, #FF8A6B 100%);
    padding: 2.5px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .hf-story-ring--live {
    background: linear-gradient(135deg, #FF4D4D 0%, #FF8A6B 100%);
    animation: hf-pulse-ring 2s ease-in-out infinite;
  }
  .hf-story-ring--empty {
    background: rgba(0,0,0,0.10);
  }
  /* Tap feedback */
  .hf-tap { -webkit-tap-highlight-color: transparent; }
  .hf-tap:active { opacity: 0.75; transform: scale(0.97); transition: all 0.12s; }
  /* Card hover */
  .hf-card {
    background: #FFFFFF;
    border-radius: 16px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06);
    overflow: hidden;
    transition: box-shadow 0.35s ease, transform 0.35s ease;
  }
  .hf-card:active {
    box-shadow: 0 2px 8px rgba(0,0,0,0.06), 0 8px 28px rgba(0,0,0,0.10);
    transform: scale(0.985);
  }
  /* Search field */
  /* .hf-search { */
  /* background: rgba(0,0,0,0.055); */
  /* border: none; */
  /* border-radius: 22px; */
  /* padding: 9px 16px 9px 36px; */
  /* font-size: 14px; */
  /* color: #1A1A1A; */
    width: 100%;
    outline: none;
    font-family: inherit;
    -webkit-appearance: none;
  }
  .hf-search::placeholder { color: rgba(26,26,26,0.40); }
  .hf-search:focus {
    background: rgba(22,215,197,0.07);
    box-shadow: 0 0 0 1.5px rgba(22,215,197,0.30);
  }
  /* Feed items animation */
  .hf-feed-item {
    animation: hf-fade-up 0.38s cubic-bezier(0.22,1,0.36,1) both;
  }
  .hf-feed-item:nth-child(1) { animation-delay: 0.0s; }
  .hf-feed-item:nth-child(2) { animation-delay: 0.05s; }
  .hf-feed-item:nth-child(3) { animation-delay: 0.10s; }
  .hf-feed-item:nth-child(4) { animation-delay: 0.15s; }
  /* Like/Kommentar Buttons */
  .hf-action-btn {
    display: flex; align-items: center; gap: 5px;
    background: none; border: none; cursor: pointer;
    padding: 6px 10px; border-radius: 20px;
    font-size: 13px; font-weight: 500;
    color: rgba(26,26,26,0.55);
    -webkit-tap-highlight-color: transparent;
    transition: background 0.15s ease, color 0.15s ease;
    font-family: inherit;
  }
  .hf-action-btn:active {
    background: rgba(0,0,0,0.05);
    transform: scale(0.95);
  }
  .hf-action-btn--resonated {
    color: #FF4D6B;
  }
  /* Event Badge */
  .hf-badge {
    display: inline-flex; align-items: center;
    padding: 3px 8px; border-radius: 20px;
    font-size: 10.5px; font-weight: 700;
    letter-spacing: 0.02em;
    line-height: 1;
  }
  /* Scroll snapping für Stories */
  .hf-scroll-x {
    display: flex;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    padding-bottom: 4px;
    scroll-snap-type: x proximity;
  }
  .hf-scroll-x::-webkit-scrollbar { display: none; }
  .hf-scroll-x > * { scroll-snap-align: start; flex-shrink: 0; }
`;

/* ─── Mock-Daten (werden durch echte Props ersetzt) ──────────────────── */
const MOCK_STORIES = [
  { id: "you",  label: "Dein Moment", avatar: null,   isYou: true, isLive: false },
  { id: "mia",  label: "Mia",         avatar: "https://i.pravatar.cc/80?img=47",  isLive: false },
  { id: "leon", label: "Leon",         avatar: "https://i.pravatar.cc/80?img=51",  isLive: true },
  { id: "sara", label: "Sara",         avatar: "https://i.pravatar.cc/80?img=45",  isLive: false },
  { id: "kai",  label: "Kai",          avatar: "https://i.pravatar.cc/80?img=33",  isLive: false },
  { id: "more", label: "Mehr",         avatar: null,   isMore: true },
];

const MOCK_EVENTS = [
  {
    id: "e1", title: "Keramik Workshop",
    time: "Heute 18:30", location: "München",
    img: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=300&q=80",
    badge: "Noch 2 Plätze", badgeColor: "#FF8A6B", hasPlay: false,
  },
  {
    id: "e2", title: "Live Musik",
    time: "Heute 20:00", location: "Berlin",
    img: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&q=80",
    badge: "LIVE", badgeColor: "#FF4D4D", hasPlay: true,
  },
  {
    id: "e3", title: "Holz & Design Markt",
    time: "Morgen 11:00", location: "Hamburg",
    img: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=300&q=80",
    badge: null, hasPlay: false,
  },
];

const MOCK_FEED = [
  {
    id: "f1",
    type: "work_upload",
    avatar: "https://i.pravatar.cc/80?img=47",
    name: "Mia Kern",
    action: "hat neue Werke hochgeladen",
    time: "2 Std.",
    images: [
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&q=80",
      "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=300&q=80",
      "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=280&q=75",
    ],
    caption: "Neue Keramikstücke aus meiner Werkstatt 🌿",
    resonanz: 34,
    comments: 8,
    viewers: [
      "https://i.pravatar.cc/32?img=12",
      "https://i.pravatar.cc/32?img=23",
      "https://i.pravatar.cc/32?img=34",
      "https://i.pravatar.cc/32?img=56",
    ],
    viewerExtra: 5,
    resonated: false,
  },
  {
    id: "f2",
    type: "experience",
    avatar: "https://i.pravatar.cc/80?img=51",
    name: "Leon Brandt",
    action: "hat ein Erlebnis geteilt",
    time: "3 Std.",
    expImg: "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=500&q=80",
    expTitle: "Holzarbeiten für Anfänger",
    expMeta: "Workshop · 2. Juni · Wien",
    resonated: false,
    saved: false,
  },
  {
    id: "f3",
    type: "activity",
    avatar: "https://i.pravatar.cc/80?img=45",
    name: "Sara Müller",
    action: "sucht kreative Menschen",
    time: "1 Std.",
    caption: "Ich starte ein neues Projekt in Hamburg und suche Leute mit Lust auf Kollaboration 🎨",
    resonanz: 12,
    comments: 3,
    resonated: false,
  },
];

const MOCK_PEOPLE = [
  { id: "p1", name: "Jonas W.", role: "Fotograf", location: "München",
    avatar: "https://i.pravatar.cc/80?img=11",
    tags: ["Portrait", "Editorial"], status: "Verfügbar" },
  { id: "p2", name: "Lena K.", role: "Designerin", location: "Berlin",
    avatar: "https://i.pravatar.cc/80?img=44",
    tags: ["Branding", "UX"], status: "Im Studio" },
  { id: "p3", name: "Tom R.", role: "Musiker", location: "Hamburg",
    avatar: "https://i.pravatar.cc/80?img=65",
    tags: ["Jazz", "Live"], status: "Verfügbar" },
  { id: "p4", name: "Yuki S.", role: "Keramikerin", location: "Wien",
    avatar: "https://i.pravatar.cc/80?img=56",
    tags: ["Keramik", "Workshops"], status: null },
];

/* ─── Sub-Komponenten ────────────────────────────────────────────────── */

// FeedHeader entfernt — Header läuft über Home.jsx <Header>

function IconBtn({ count, onClick, children, accent = T.coral }) {
  return (
    <button onClick={onClick} className="hf-tap" style={{
      position: "relative", background: "none", border: "none",
      cursor: "pointer", padding: 4, borderRadius: 10,
      display: "flex", alignItems: "center", justifyContent: "center",
      width: 36, height: 36,
    }}>
      {children}
      {count > 0 && (
        <div style={{
          position: "absolute", top: 1, right: 1,
          minWidth: 15, height: 15, borderRadius: 999,
          background: accent,
          color: "white", fontSize: 9, fontWeight: 800,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "0 3px",
          border: "2px solid #FAFAF8",
          boxShadow: `0 1px 4px ${accent}55`,
        }}>
          {count > 9 ? "9+" : count}
        </div>
      )}
    </button>
  );
}

/* ─── Momente-Leiste ─────────────────────────────────────────────────── */
function StoryLeiste({ stories = MOCK_STORIES, onStory }) {
  return (
    <div style={{ padding: "14px 0 4px 0" }}>
      <div className="hf-scroll-x" style={{ paddingLeft: 16, paddingRight: 16, gap: 14 }}>
        {stories.map(story => (
          <StoryItem key={story.id} story={story} onPress={() => onStory?.(story)} />
        ))}
      </div>
    </div>
  );
}

function StoryItem({ story, onPress }) {
  if (story.isMore) {
    return (
      <button onClick={onPress} className="hf-tap" style={{
        background: "none", border: "none", cursor: "pointer",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
        padding: 0,
      }}>
        <div style={{
          width: 60, height: 60, borderRadius: "50%",
          background: "rgba(0,0,0,0.055)",
          border: `1.5px solid ${T.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="8" height="8" rx="2" stroke={T.muted} strokeWidth="1.6"/>
            <rect x="13" y="3" width="8" height="8" rx="2" stroke={T.muted} strokeWidth="1.6"/>
            <rect x="3" y="13" width="8" height="8" rx="2" stroke={T.muted} strokeWidth="1.6"/>
            <rect x="13" y="13" width="8" height="8" rx="2" stroke={T.muted} strokeWidth="1.6"/>
          </svg>
        </div>
        <span style={{ fontSize: 11, fontWeight: 500, color: T.muted, letterSpacing: -0.1 }}>
          Mehr
        </span>
      </button>
    );
  }

  if (story.isYou) {
    return (
      <button onClick={onPress} className="hf-tap" style={{
        background: "none", border: "none", cursor: "pointer",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
        padding: 0,
      }}>
        <div style={{ position: "relative" }}>
          <div className="hf-story-ring hf-story-ring--empty" style={{ padding: 2 }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: T.tealFaint,
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "2px solid white",
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke={T.teal} strokeWidth="2.2" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
          {/* HUI Badge */}
          <div style={{
            position: "absolute", bottom: -1, right: -1,
            width: 20, height: 20, borderRadius: "50%",
            background: `linear-gradient(135deg, ${T.teal}, ${T.coral})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "2px solid white",
          }}>
            <span style={{ fontSize: 9, fontWeight: 900, color: "white" }}>+</span>
          </div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, color: T.teal, letterSpacing: -0.1 }}>
          Dein Moment
        </span>
      </button>
    );
  }

  return (
    <button onClick={onPress} className="hf-tap" style={{
      background: "none", border: "none", cursor: "pointer",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
      padding: 0,
    }}>
      <div style={{ position: "relative" }}>
        <div className={`hf-story-ring${story.isLive ? " hf-story-ring--live" : ""}`}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            overflow: "hidden", border: "2.5px solid white",
          }}>
            {story.avatar
              ? <img src={story.avatar} alt={story.label}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <div style={{ width: "100%", height: "100%",
                  background: `linear-gradient(135deg, ${T.teal}, ${T.coral})`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20, fontWeight: 900, color: "white",
                }}>
                  {story.label[0]}
                </div>
            }
          </div>
        </div>
        {story.isLive && (
          <div style={{
            position: "absolute", bottom: -1, left: "50%", transform: "translateX(-50%)",
            background: "#FF4D4D", color: "white",
            fontSize: 8.5, fontWeight: 800, letterSpacing: 0.5,
            padding: "2px 5px", borderRadius: 99,
            border: "1.5px solid white",
          }}>LIVE</div>
        )}
      </div>
      <span style={{ fontSize: 11, fontWeight: 500, color: T.ink2,
        letterSpacing: -0.1, maxWidth: 62, textAlign: "center",
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {story.label}
      </span>
    </button>
  );
}

/* ─── Heute in deiner Nähe ─────────────────────────────────────────── */
function HeuteSection({ events = MOCK_EVENTS, onEvent, onMoreEvents }) {
  return (
    <div style={{ padding: "20px 16px 0" }}>
      {/* Section Header */}
      <div style={{ display: "flex", alignItems: "center",
        justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
              fill={T.tealFaint} stroke={T.teal} strokeWidth="1.8"/>
            <circle cx="12" cy="9" r="2.5" fill={T.teal}/>
          </svg>
          <span style={{ fontSize: 15, fontWeight: 700, color: T.ink, letterSpacing: -0.3 }}>
            Erlebnisse in deiner Nähe
          </span>
        </div>
        <button onClick={onMoreEvents} className="hf-tap" style={{
          background: "none", border: "none", cursor: "pointer",
          fontSize: 12.5, fontWeight: 600, color: T.teal,
          display: "flex", alignItems: "center", gap: 2, padding: "2px 0",
        }}>
          Mehr <span style={{ fontSize: 11 }}>›</span>
        </button>
      </div>

      {/* Event Cards — horizontaler Scroll */}
      <div className="hf-scroll-x" style={{ gap: 10, marginLeft: -16, paddingLeft: 16,
        marginRight: -16, paddingRight: 16 }}>
        {events.map(ev => (
          <EventCard key={ev.id} event={ev} onPress={() => onEvent?.(ev)} />
        ))}
        {/* Neues Event erstellen */}
        <button onClick={onMoreEvents} className="hf-tap" style={{
          width: 110, height: 130, borderRadius: T.radius,
          background: T.tealFaint,
          border: `1.5px dashed rgba(22,215,197,0.35)`,
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", gap: 8,
          cursor: "pointer", flexShrink: 0,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "white",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 2px 8px ${T.tealGlow}`,
          }}>
            <span style={{ fontSize: 18, color: T.teal, fontWeight: 300 }}>+</span>
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, color: T.teal,
            textAlign: "center", lineHeight: 1.3, padding: "0 8px",
          }}>Neues<br/>Event</span>
        </button>
      </div>
    </div>
  );
}

function EventCard({ event, onPress }) {
  return (
    <button onClick={onPress} className="hf-tap" style={{
      width: 110, flexShrink: 0, borderRadius: T.radius,
      overflow: "hidden", cursor: "pointer",
      background: "none", border: "none", padding: 0,
      position: "relative",
    }}>
      {/* Bild */}
      <div style={{ width: 110, height: 130, position: "relative" }}>
        <img src={event.img} alt={event.title}
          loading="lazy"
          style={{ width: "100%", height: "100%", objectFit: "cover",
            borderRadius: T.radius, display: "block" }}
        />
        {/* Gradient Overlay */}
        <div style={{
          position: "absolute", inset: 0, borderRadius: T.radius,
          background: "linear-gradient(to bottom, rgba(0,0,0,0) 30%, rgba(0,0,0,0.68) 100%)",
        }}/>

        {/* Play-Button */}
        {event.hasPlay && (
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: 32, height: 32, borderRadius: "50%",
            background: "rgba(255,255,255,0.22)",
            backdropFilter: "blur(8px)",
            border: "1.5px solid rgba(255,255,255,0.50)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="10" height="12" viewBox="0 0 10 12" fill="none">
              <path d="M1 1l8 5-8 5V1z" fill="white"/>
            </svg>
          </div>
        )}

        {/* Badge */}
        {event.badge && (
          <div className="hf-badge" style={{
            position: "absolute", top: 8, left: 8,
            background: event.badgeColor || T.coral,
            color: "white",
          }}>
            {event.badge}
          </div>
        )}

        {/* Info */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          padding: "8px 8px 9px",
        }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: "white",
            lineHeight: 1.25, marginBottom: 3 }}>
            {event.title}
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.80)", lineHeight: 1.3 }}>
            {event.time}
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", lineHeight: 1.3 }}>
            {event.location}
          </div>
        </div>
      </div>
    </button>
  );
}

/* ─── Gemeinschaft Feed ─────────────────────────────────────────────────── */
function SozialerFeed({ items = MOCK_FEED, onProfile, onLike, onComment }) {
  const [inspired, setInspired] = useState({});

  function handleLike(id) {
    setInspired(p => ({ ...p, [id]: !p[id] }));
    onLike?.(id);
  }

  return (
    <div style={{ padding: "24px 0 0" }}>
      {/* Section Label */}
      <div style={{ paddingLeft: 16, marginBottom: 14 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: T.ink, letterSpacing: -0.3 }}>
          Gerade aktiv
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12,
        paddingLeft: 16, paddingRight: 16 }}>
        {items.map((item, idx) => (
          <div key={item.id} className="hf-card hf-feed-item"
            style={{ animationDelay: `${idx * 0.06}s` }}>
            <FeedItem
              item={item}
              isLiked={!!inspired[item.id]}
              onProfile={() => onProfile?.(item)}
              onLike={() => handleLike(item.id)}
              onComment={() => onComment?.(item)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function FeedItem({ item, isLiked, onProfile, onLike, onComment }) {
  return (
    <div>
      {/* Header: Avatar + Name + Time + Menu */}
      <div style={{ display: "flex", alignItems: "center",
        padding: "14px 14px 10px", gap: 10 }}>
        <button onClick={onProfile} className="hf-tap" style={{
          background: "none", border: "none", cursor: "pointer", padding: 0,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: "50%",
            overflow: "hidden", flexShrink: 0,
            background: `linear-gradient(135deg, ${T.teal}, ${T.coral})`,
          }}>
            {item.avatar && (
              <img src={item.avatar} alt={item.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            )}
          </div>
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: T.ink,
            letterSpacing: -0.2, lineHeight: 1.2 }}>
            {item.name}
          </div>
          <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.3, marginTop: 1 }}>
            {item.action} · <span style={{ color: T.muted2 }}>{item.time}</span>
          </div>
        </div>
        {/* Menü */}
        <button className="hf-tap" style={{
          background: "none", border: "none", cursor: "pointer",
          padding: "4px 6px", color: T.muted,
          fontSize: 16, letterSpacing: 1.5, lineHeight: 1,
        }}>···</button>
      </div>

      {/* Content: Werk-Bilder */}
      {item.type === "work_upload" && item.images && (
        <div style={{ paddingLeft: 14, paddingRight: 14, marginBottom: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.05fr 0.5fr 0.5fr",
            gap: 4, borderRadius: T.radiusSm, overflow: "hidden", height: 130 }}>
            {item.images.slice(0, 3).map((img, i) => (
              <img key={i} src={img} alt=""
                loading="lazy"
                style={{ width: "100%", height: "100%", objectFit: "cover",
                  display: "block",
                  borderRadius: i === 0 ? "8px 0 0 8px" : i === 2 ? "0 8px 8px 0" : 0,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Content: Experience-Card */}
      {item.type === "experience" && (
        <div style={{ paddingLeft: 14, paddingRight: 14, marginBottom: 10 }}>
          <div style={{
            borderRadius: T.radiusSm, overflow: "hidden",
            background: "rgba(0,0,0,0.02)",
            border: `1px solid ${T.border}`,
            display: "flex", height: 80,
          }}>
            <img src={item.expImg} alt=""
              loading="lazy"
              style={{ width: 90, height: 80, objectFit: "cover", flexShrink: 0 }}
            />
            <div style={{ padding: "12px 12px 12px 14px", flex: 1, minWidth: 0,
              display: "flex", flexDirection: "column", justifyContent: "center", gap: 4 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.ink,
                letterSpacing: -0.2, lineHeight: 1.25 }}>
                {item.expTitle}
              </div>
              <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.3 }}>
                {item.expMeta}
              </div>
            </div>
            <button className="hf-tap" style={{
              background: "none", border: "none", cursor: "pointer",
              padding: "12px 12px 12px 0", color: T.muted,
              display: "flex", alignItems: "flex-start",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
                  stroke={T.muted} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Caption */}
      {item.caption && (
        <div style={{ paddingLeft: 14, paddingRight: 14, marginBottom: 10 }}>
          <p style={{ margin: 0, fontSize: 13.5, color: T.ink2, lineHeight: 1.5,
            letterSpacing: -0.1 }}>
            {item.caption}
          </p>
        </div>
      )}

      {/* Footer: Likes + Comments + Viewers */}
      <div style={{
        display: "flex", alignItems: "center",
        padding: "4px 8px 10px",
        borderTop: `1px solid ${T.borderSoft}`,
        marginTop: 4,
      }}>
        {/* Like */}
        <button onClick={onLike} className={`hf-action-btn${isLiked ? " hf-action-btn--inspired" : ""}`}>
          <span style={{ fontSize: 15, color: isLiked ? "#16D7C5" : "rgba(80,80,80,0.5)" }}>✦</span>
          <span>{(item.resonanz || 0) + (isLiked ? 1 : 0)}</span>
        </button>
        {/* Comment */}
        <button onClick={onComment} className="hf-action-btn">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
              stroke={T.muted} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>{item.comments || 0}</span>
        </button>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Viewer Avatars */}
        {item.viewers && (
          <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
            <div style={{ display: "flex" }}>
              {item.viewers.slice(0, 4).map((av, i) => (
                <div key={i} style={{
                  width: 22, height: 22, borderRadius: "50%",
                  overflow: "hidden", marginLeft: i === 0 ? 0 : -6,
                  border: "2px solid white",
                  background: `linear-gradient(135deg, ${T.teal}, ${T.coral})`,
                }}>
                  <img src={av} alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ))}
            </div>
            {item.viewerExtra > 0 && (
              <span style={{ fontSize: 11, color: T.muted, marginLeft: 5, fontWeight: 600 }}>
                +{item.viewerExtra}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Begegnungen ─────────────────────────────────────────────── */
function MenschenSection({ people = MOCK_PEOPLE, onPerson }) {
  return (
    <div style={{ padding: "24px 0 32px" }}>
      <div style={{ display: "flex", alignItems: "center",
        justifyContent: "space-between", paddingLeft: 16, paddingRight: 16, marginBottom: 14 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: T.ink, letterSpacing: -0.3 }}>
          Menschen für dich
        </span>
        <button className="hf-tap" style={{
          background: "none", border: "none", cursor: "pointer",
          fontSize: 12.5, fontWeight: 600, color: T.teal,
          display: "flex", alignItems: "center", gap: 2,
        }}>
          Alle <span style={{ fontSize: 11 }}>›</span>
        </button>
      </div>

      <div className="hf-scroll-x"
        style={{ gap: 10, paddingLeft: 16, paddingRight: 16 }}>
        {people.map(person => (
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
    <div className="hf-card" style={{ width: 148, flexShrink: 0 }}>
      {/* Avatar */}
      <button onClick={onPress} className="hf-tap" style={{
        background: "none", border: "none", cursor: "pointer",
        padding: 0, width: "100%", display: "block",
      }}>
        <div style={{ position: "relative", height: 110 }}>
          <img src={person.avatar} alt={person.name}
            loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover",
              borderRadius: "16px 16px 0 0" }}
          />
          {/* Gradient */}
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.50) 100%)",
            borderRadius: "16px 16px 0 0",
          }}/>
          {/* Status */}
          {person.status && (
            <div style={{
              position: "absolute", bottom: 8, left: 8,
              background: "rgba(255,255,255,0.18)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.30)",
              borderRadius: 99, padding: "2.5px 7px",
              fontSize: 9.5, fontWeight: 700, color: "white",
              display: "flex", alignItems: "center", gap: 4,
            }}>
              <div style={{
                width: 5, height: 5, borderRadius: "50%",
                background: person.status === "Verfügbar" ? "#4ADE80" : T.coral,
              }}/>
              {person.status}
            </div>
          )}
        </div>
      </button>

      {/* Info */}
      <div style={{ padding: "10px 12px 12px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.ink,
          letterSpacing: -0.2, marginBottom: 1 }}>
          {person.name}
        </div>
        <div style={{ fontSize: 11.5, color: T.muted, marginBottom: 2 }}>
          {person.role}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 10 }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
              fill={T.tealFaint} stroke={T.teal} strokeWidth="2"/>
          </svg>
          <span style={{ fontSize: 10.5, color: T.muted }}>{person.location}</span>
        </div>

        {/* Tags */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
          {person.tags.slice(0, 2).map(tag => (
            <span key={tag} style={{
              fontSize: 9.5, fontWeight: 600, color: T.teal,
              background: T.tealFaint, borderRadius: 99,
              padding: "2px 7px",
            }}>
              {tag}
            </span>
          ))}
        </div>

        {/* Follow Button */}
        <button onClick={e => { e.stopPropagation(); setFollowing(f => !f); }}
          className="hf-tap" style={{
          width: "100%", height: 30,
          background: following
            ? "rgba(0,0,0,0.05)"
            : `linear-gradient(135deg, ${T.teal}, ${T.teal2})`,
          border: following ? `1px solid ${T.border}` : "none",
          borderRadius: 99,
          fontSize: 11.5, fontWeight: 700,
          color: following ? T.muted : "white",
          cursor: "pointer",
          transition: "all 0.22s ease",
          letterSpacing: 0.1,
        }}>
          {following ? "Folge ich" : "Folgen"}
        </button>
      </div>
    </div>
  );
}

/* ─── Trennlinie ─────────────────────────────────────────────────────── */
function Divider({ mx = 16 }) {
  return (
    <div style={{
      height: 1, margin: `4px ${mx}px`,
      background: `linear-gradient(90deg, transparent, ${T.border} 30%, ${T.border} 70%, transparent)`,
    }}/>
  );
}

/* ─── ROOT: HomeFeed ─────────────────────────────────────────────────── */
export default function HomeFeed({
  user       = null,
  stories    = MOCK_STORIES,
  events     = MOCK_EVENTS,
  feedItems  = MOCK_FEED,
  people     = MOCK_PEOPLE,
  notifCount = 3,
  chatCount  = 2,
  onSearch,
  onNotif,
  onChat,
  onStory,
  onEvent,
  onMoreEvents,
  onProfile,
  onLike,
  onComment,
  onPerson,
}) {
  // ── Echte Daten laden wenn feedItems nicht als Prop übergeben ──
  const { items: liveFeed, loading: feedLoading } = useFeedData({
    enabled: feedItems === null,   // nur laden wenn kein Prop übergeben
    limit:   12,
  });
  const { toggle: toggleResonance, isResonated } = useResonanceState();

  // Effektive Feed-Items: Prop hat Vorrang → Fallback echte Daten → Mocks
  const effectiveFeedItems = feedItems !== null
    ? feedItems
    : (liveFeed.length > 0 ? liveFeed : MOCK_FEED);

  return (
    <>
      <style>{CSS}</style>
      <div className="hf-root">
        <StoryLeiste stories={stories} onStory={onStory} />

        <Divider />

        <HeuteSection
          events={events}
          onEvent={onEvent}
          onMoreEvents={onMoreEvents}
        />

        <Divider mx={0} />

        <SozialerFeed
          items={effectiveFeedItems}
          onProfile={onProfile}
          onLike={(id) => {
            toggleResonance(id, 'work', 'inspired');
            onLike?.(id);
          }}
          onComment={onComment}
        />

        <MenschenSection people={people} onPerson={onPerson} />

        {/* Bottom Padding für Nav */}
        <div style={{ height: "calc(env(safe-area-inset-bottom, 0px) + 80px)" }}/>
      </div>
    </>
  );
}