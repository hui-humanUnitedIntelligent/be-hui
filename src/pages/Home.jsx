import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import mockWirkerProfiles from "../lib/mockData";
import ImpactPage        from "./ImpactPage";
import ProfilePage       from "./ProfilePage";
import WirkerProfilePage from "../components/WirkerProfilePage";
import BookingFlow       from "../components/BookingFlow";
import CreateFlow        from "../components/CreateFlow";

/* ─── Brand Colors (exact HUI) ─────────────────── */
const C = {
  teal:       "#16D7C5",
  teal2:      "#11C5B7",
  tealPale:   "#E6FAF8",
  coral:      "#FF8A6B",
  coral2:     "#FF7B72",
  coralPale:  "#FFF3EF",
  white:      "#FCFCFA",
  card:       "#FFFFFF",
  ink:        "#111111",
  ink2:       "#333333",
  muted:      "#666666",
  muted2:     "#999999",
  border:     "#EBEBEB",
  gold:       "#FFB800",
  goldPale:   "#FFF8E1",
  green:      "#22C55E",
};

const WIRKERS = Object.values(mockWirkerProfiles);

/* ═══════════════════════════════════════════════
   DATA
═══════════════════════════════════════════════ */
const FEATURED_WIRKER = [
  {
    name: "Sofia M.", talent: "Keramik-Künstlerin",
    img: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&q=85",
    bg:  "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&q=80",
    distance: "1,2 km", price: "ab 45 €", rec: 34,
    badge: "Top Talent", badgeColor: C.teal,
    score: 4.9,
  },
  {
    name: "Marcus B.", talent: "Fotograf & Videograf",
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=85",
    bg:  "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=600&q=80",
    distance: "0,8 km", price: "ab 90 €", rec: 47,
    badge: "Beliebt", badgeColor: C.coral,
    score: 4.8,
  },
  {
    name: "Maria L.", talent: "Yoga & Achtsamkeit",
    img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=85",
    bg:  "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&q=80",
    distance: "1,2 km", price: "ab 70 €", rec: 93,
    badge: "Top Talent", badgeColor: C.teal,
    score: 4.9,
  },
  {
    name: "Lena K.", talent: "Aquarell-Künstlerin",
    img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=85",
    bg:  "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&q=80",
    distance: "3,4 km", price: "ab 60 €", rec: 28,
    badge: "Neu", badgeColor: C.gold,
    score: 4.7,
  },
];

const POPULAR_WORKS = [
  { title: "Handgemachte Keramik-Tasse", price: "38 €",
    img: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&q=80",
    creator: "Sofia M.", creatorImg: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&q=80",
    likes: 124, saved: 52, mood: "warm" },
  { title: "Leder-Rucksack (handgenäht)", price: "195 €",
    img: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80",
    creator: "Tom H.", creatorImg: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&q=80",
    likes: 89, saved: 31, mood: "cool" },
  { title: "Aquarell-Druck (A3)", price: "55 €",
    img: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&q=80",
    creator: "Lena K.", creatorImg: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&q=80",
    likes: 67, saved: 24, mood: "warm" },
];

const NEARBY = [
  { name: "Marcus B.", talent: "Fotograf & Videograf",
    img: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=400&q=80",
    creatorImg: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&q=80",
    distance: "0,8 km" },
  { name: "Maria L.", talent: "Yoga & Achtsamkeit",
    img: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&q=80",
    creatorImg: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&q=80",
    distance: "1,2 km" },
  { name: "Tom H.", talent: "Leder-Handwerker",
    img: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80",
    creatorImg: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&q=80",
    distance: "2,1 km" },
];

const IMPACT_TEASER = { poolEur: 3847, month: "Mai 2026" };

const TOP_TALENTE = [
  { name: "Sofia M.",   talent: "Keramik-Künstlerin", img: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&q=80", score: 4.9 },
  { name: "Marcus B.",  talent: "Fotograf & Videograf", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&q=80", score: 4.8 },
  { name: "Lena K.",    talent: "Aquarell-Künstlerin", img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&q=80", score: 4.7 },
];

const KATEGORIEN = [
  { label: "Handwerk",      icon: "🔨", color: C.teal },
  { label: "Kunst & Design",icon: "🎨", color: C.coral },
  { label: "Fotografie",    icon: "📷", color: "#8B5CF6" },
  { label: "Coaching",      icon: "💬", color: C.gold },
  { label: "Gesundheit",    icon: "🧘", color: C.green },
  { label: "Musik",         icon: "🎵", color: "#EC4899" },
];

/* ═══════════════════════════════════════════════
   MICRO COMPONENTS
═══════════════════════════════════════════════ */

function Avatar({ src, name, size = 36 }) {
  const init = (name || "").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden", flexShrink: 0,
      background: `linear-gradient(135deg, ${C.tealPale}, ${C.coralPale})`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.38, fontWeight: 800, color: C.teal }}>
      {src
        ? <img src={src} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={e => e.target.style.display = "none"} />
        : init}
    </div>
  );
}

function LikeBtn({ count = 0, size = "sm" }) {
  const [liked, setLiked] = useState(false);
  const [n,     setN]     = useState(count);
  const [anim,  setAnim]  = useState(false);
  const fs = size === "lg" ? 22 : 18;

  function tap(e) {
    e.stopPropagation();
    setAnim(true); setTimeout(() => setAnim(false), 420);
    setLiked(p => { setN(c => p ? c - 1 : c + 1); return !p; });
  }
  return (
    <button onClick={tap} style={{ background: "none", border: "none", cursor: "pointer",
      display: "flex", alignItems: "center", gap: 4, padding: 0,
      WebkitTapHighlightColor: "transparent" }}>
      <span className={anim ? "hui-heart-pop" : ""}
        style={{ fontSize: fs, lineHeight: 1,
          filter: liked ? "none" : "grayscale(1) opacity(0.55)" }}>
        {liked ? "❤️" : "🤍"}
      </span>
      <span style={{ fontSize: 12, fontWeight: 700,
        color: liked ? C.coral : C.muted }}>{n}</span>
    </button>
  );
}

function StarScore({ score }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
      <span style={{ color: C.gold, fontSize: 12 }}>★</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: C.ink2 }}>{score}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   STORIES BAR
═══════════════════════════════════════════════ */
function StoriesBar({ onView }) {
  const stories = [
    { name: "Deine Story", img: null, isMine: true },
    { name: "Sofia", img: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&q=80", hasStory: true },
    { name: "Marcus", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&q=80", hasStory: true },
    { name: "Lena", img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&q=80", hasStory: true },
    { name: "Tom", img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&q=80", hasStory: false },
    { name: "Maria", img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&q=80", hasStory: true },
  ];
  return (
    <div className="scrollbar-hide"
      style={{ display: "flex", gap: 14, overflowX: "auto",
        padding: "4px 18px 4px" }}>
      {stories.map((s, i) => (
        <div key={i} onClick={() => !s.isMine && onView && onView(s.name)}
          style={{ display: "flex", flexDirection: "column", alignItems: "center",
            gap: 6, flexShrink: 0, cursor: s.isMine ? "default" : "pointer" }}>
          <div className={s.hasStory ? "hui-story-border" : ""}
            style={s.hasStory ? { borderRadius: "50%" }
              : { padding: 2.5, borderRadius: "50%",
                  background: C.border }}>
            <div style={{ padding: 2, borderRadius: "50%", background: C.white }}>
              <div className={s.hasStory ? "hui-story-glow" : ""}
                style={{ width: 52, height: 52, borderRadius: "50%",
                  overflow: "hidden", position: "relative",
                  background: `linear-gradient(135deg, ${C.tealPale}, ${C.coralPale})`,
                  display: "flex", alignItems: "center", justifyContent: "center" }}>
                {s.isMine
                  ? <span style={{ fontSize: 24 }}>👤</span>
                  : <img src={s.img} alt={s.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                {s.isMine && (
                  <div style={{ position: "absolute", bottom: 0, right: 0,
                    width: 18, height: 18, borderRadius: "50%",
                    background: C.coral, border: `2px solid ${C.white}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, color: "white", fontWeight: 900 }}>+</div>
                )}
              </div>
            </div>
          </div>
          <span style={{ fontSize: 10, fontWeight: 600, color: C.ink2,
            maxWidth: 56, textAlign: "center",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {s.name}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SEARCH BAR + HUI MATCH
═══════════════════════════════════════════════ */
const AI_CHIPS = ["Fotograf in Berlin", "Gartenhilfe bis 300 €", "Handgemachte Kunst"];

function SearchArea({ scrolled, onMatchOpen }) {
  const [val, setVal] = useState("");
  const [focused, setFocused] = useState(false);
  return (
    <div style={{
      position: "sticky", top: 58, zIndex: 55,
      background: scrolled ? "rgba(252,252,250,0.96)" : "transparent",
      backdropFilter: scrolled ? "blur(16px)" : "none",
      WebkitBackdropFilter: scrolled ? "blur(16px)" : "none",
      padding: scrolled ? "7px 18px 8px" : "8px 18px 12px",
      transition: "all 0.25s",
      borderBottom: scrolled ? `1px solid ${C.border}` : "none",
    }}>
      <div style={{ position: "relative" }}>
        {/* Search icon */}
        <span style={{ position: "absolute", left: 15, top: "50%",
          transform: "translateY(-50%)", fontSize: 16,
          color: focused ? C.teal : C.muted2, transition: "color 0.2s",
          pointerEvents: "none", zIndex: 1 }}>🔍</span>

        <input className="hui-search-pill"
          placeholder="Wen oder was suchst du heute?"
          value={val}
          onChange={e => setVal(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ paddingRight: 80 }}
        />

        {/* Clear */}
        {val && (
          <button onClick={() => setVal("")}
            style={{ position: "absolute", right: 52, top: "50%",
              transform: "translateY(-50%)",
              background: `${C.muted}25`, border: "none",
              borderRadius: "50%", width: 20, height: 20,
              cursor: "pointer", fontSize: 10, color: C.muted,
              display: "flex", alignItems: "center", justifyContent: "center",
              WebkitTapHighlightColor: "transparent" }}>✕</button>
        )}

        {/* HUI Match AI Button */}
        <button onClick={onMatchOpen}
          style={{ position: "absolute", right: 6, top: "50%",
            transform: "translateY(-50%)",
            width: 38, height: 38, borderRadius: "50%",
            background: `linear-gradient(135deg, ${C.teal}, ${C.coral})`,
            border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 17, boxShadow: `0 2px 10px rgba(22,215,197,0.35)`,
            WebkitTapHighlightColor: "transparent",
            transition: "transform 0.15s" }}
          onTouchStart={e => e.currentTarget.style.transform = "translateY(-50%) scale(0.9)"}
          onTouchEnd={e   => e.currentTarget.style.transform = "translateY(-50%) scale(1)"}>
          ✨
        </button>
      </div>

      {/* AI Chips */}
      {!scrolled && !val && (
        <div style={{ display: "flex", gap: 7, marginTop: 8,
          overflowX: "auto", paddingBottom: 2 }}
          className="scrollbar-hide">
          {AI_CHIPS.map((c, i) => (
            <button key={i} onClick={() => setVal(c)}
              style={{ flexShrink: 0, background: C.card,
                border: `1px solid ${C.border}`, borderRadius: 999,
                padding: "5px 12px", fontSize: 12, fontWeight: 600,
                color: C.ink2, cursor: "pointer", whiteSpace: "nowrap",
                WebkitTapHighlightColor: "transparent",
                boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   HUI MATCH OVERLAY
═══════════════════════════════════════════════ */
function HuiMatchOverlay({ onClose }) {
  const [query, setQuery] = useState("");
  const [thinking, setThinking] = useState(false);
  const [results, setResults] = useState(null);

  async function handleSearch() {
    if (!query.trim()) return;
    setThinking(true);
    await new Promise(r => setTimeout(r, 1800));
    setResults(FEATURED_WIRKER.slice(0, 3));
    setThinking(false);
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 400,
      background: "rgba(17,17,17,0.55)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "flex-end" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="hui-slide-up"
        style={{ width: "100%", borderRadius: "28px 28px 0 0",
          background: C.card, maxHeight: "88vh", overflowY: "auto",
          paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}>

        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 0" }}>
          <div style={{ width: 36, height: 4, borderRadius: 999, background: C.border }} />
        </div>

        <div style={{ padding: "16px 22px 20px" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <div style={{ width: 42, height: 42, borderRadius: 14,
              background: `linear-gradient(135deg, ${C.teal}, ${C.coral})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20 }}>✨</div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 18, color: C.ink }}>HUI Match</div>
              <div style={{ fontSize: 12, color: C.muted }}>Unsere KI findet perfekte Talente für dich</div>
            </div>
            <button onClick={onClose}
              style={{ marginLeft: "auto", background: C.border,
                border: "none", borderRadius: "50%",
                width: 30, height: 30, cursor: "pointer", fontSize: 14,
                display: "flex", alignItems: "center", justifyContent: "center",
                WebkitTapHighlightColor: "transparent" }}>✕</button>
          </div>

          <div style={{ fontSize: 13, color: C.muted, marginBottom: 18, lineHeight: 1.6 }}>
            Beschreibe was du suchst — ganz natürlich, wie du mit einem Freund sprechen würdest.
          </div>

          {/* Input */}
          <div style={{ position: "relative", marginBottom: 12 }}>
            <textarea
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="z. B. Fotograf für Hochzeit in München, max. 500 €, gerne mit Drohne..."
              rows={3}
              style={{ width: "100%", boxSizing: "border-box",
                padding: "14px 16px", fontSize: 14, color: C.ink,
                background: C.white, border: `1.5px solid ${C.border}`,
                borderRadius: 18, outline: "none", resize: "none",
                fontFamily: "inherit", lineHeight: 1.6,
                transition: "border-color 0.2s" }}
              onFocus={e => e.target.style.borderColor = C.teal}
              onBlur={e  => e.target.style.borderColor = C.border}
            />
          </div>

          <button onClick={handleSearch} disabled={!query.trim() || thinking}
            className="hui-btn hui-btn-primary"
            style={{ width: "100%", padding: "15px", fontSize: 15,
              opacity: query.trim() ? 1 : 0.5 }}>
            {thinking ? <><span className="hui-spin">⚙️</span> Analysiere…</> : "✨ Passende Talente finden"}
          </button>

          {/* Results */}
          {results && (
            <div style={{ marginTop: 22 }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: C.ink, marginBottom: 14 }}>
                Diese Talente passen zu dir
              </div>
              {results.map((w, i) => (
                <div key={i} className="hui-card-sm hui-card-tap hui-fade-up"
                  style={{ padding: "14px 16px", marginBottom: 10,
                    animationDelay: `${i * 0.08}s`,
                    display: "flex", gap: 12, alignItems: "center" }}>
                  <Avatar src={w.img} name={w.name} size={50} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: C.ink }}>{w.name}</div>
                    <div style={{ fontSize: 12, color: C.teal, fontWeight: 700 }}>{w.talent}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                      📍 {w.distance} · {w.price}
                    </div>
                  </div>
                  <StarScore score={w.score} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SECTION HEADER
═══════════════════════════════════════════════ */
function SectionHeader({ icon, title, onShowAll }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "20px 18px 12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span className="hui-section-title">{title}</span>
      </div>
      {onShowAll && (
        <button onClick={onShowAll} className="hui-section-link"
          style={{ background: "none", border: "none", cursor: "pointer",
            WebkitTapHighlightColor: "transparent" }}>
          Alle anzeigen →
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   FEATURED TALENT CARDS — horizontal scroll
═══════════════════════════════════════════════ */
function FeaturedTalentCard({ wirker, onView, onBook }) {
  return (
    <div className="hui-card-tap"
      style={{ flexShrink: 0, width: 200, borderRadius: 20, overflow: "hidden",
        background: C.card,
        boxShadow: "0 2px 16px rgba(0,0,0,0.09)" }}
      onClick={() => onView && onView(wirker.name)}>

      {/* BG Image */}
      <div style={{ height: 180, position: "relative", overflow: "hidden" }}>
        <img src={wirker.bg} alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, transparent 40%, rgba(17,17,17,0.70) 100%)" }} />

        {/* Badge */}
        <div style={{ position: "absolute", top: 10, left: 10 }}>
          <span style={{ background: wirker.badgeColor === C.gold
            ? C.goldPale : wirker.badgeColor === C.coral
              ? C.coralPale : C.tealPale,
            color: wirker.badgeColor,
            borderRadius: 999, padding: "3px 9px",
            fontSize: 10, fontWeight: 800 }}>
            {wirker.badge}
          </span>
        </div>

        {/* Avatar overlay */}
        <div style={{ position: "absolute", bottom: 10, left: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%",
            overflow: "hidden", border: "2px solid white",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
            <img src={wirker.img} alt={wirker.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: "10px 12px 14px" }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: C.ink, marginBottom: 2 }}>
          {wirker.name}
        </div>
        <div style={{ fontSize: 11, color: C.teal, fontWeight: 700, marginBottom: 6 }}>
          {wirker.talent}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 11, color: C.muted }}>📍 {wirker.distance}</div>
          <StarScore score={wirker.score} />
        </div>
        <div style={{ marginTop: 8, fontSize: 11, fontWeight: 700, color: C.ink2 }}>
          {wirker.price}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   POPULAR WORK CARD — full-width, tall
═══════════════════════════════════════════════ */
function PopularWorkCard({ work, onCart }) {
  const [added, setAdded] = useState(false);

  function handleCart(e) {
    e.stopPropagation();
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
    if (onCart) onCart(work);
  }

  return (
    <div className="hui-card hui-card-tap"
      style={{ margin: "0 18px 16px", overflow: "hidden" }}>

      {/* Full image */}
      <div style={{ position: "relative", height: 260, overflow: "hidden" }}>
        <img src={work.img} alt={work.title}
          style={{ width: "100%", height: "100%", objectFit: "cover" }} />

        {/* Price badge */}
        <div style={{ position: "absolute", top: 14, left: 14,
          background: `linear-gradient(135deg, ${C.teal}, ${C.teal2})`,
          color: "white", borderRadius: 999,
          padding: "5px 13px", fontSize: 14, fontWeight: 900 }}>
          {work.price}
        </div>

        {/* Gradient overlay */}
        <div style={{ position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, transparent 45%, rgba(17,17,17,0.62) 100%)" }} />

        {/* Creator in overlay */}
        <div style={{ position: "absolute", bottom: 12, left: 14,
          display: "flex", alignItems: "center", gap: 8 }}>
          <Avatar src={work.creatorImg} name={work.creator} size={28} />
          <span style={{ fontSize: 13, fontWeight: 700, color: "white" }}>{work.creator}</span>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ padding: "12px 14px", display: "flex",
        alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, color: C.ink, marginBottom: 2 }}>
            {work.title}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <LikeBtn count={work.likes} />
            <button style={{ background: "none", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 4, padding: 0 }}>
              <span style={{ fontSize: 16, filter: "grayscale(1) opacity(0.5)" }}>⭐</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.muted }}>{work.saved}</span>
            </button>
          </div>
        </div>

        {/* Impact hint + cart */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
          <div style={{ fontSize: 10, color: C.teal, fontWeight: 600,
            display: "flex", alignItems: "center", gap: 3 }}>
            <span className="hui-breathe">🌱</span> Impact inklusive
          </div>
          <button onClick={handleCart}
            className="hui-btn hui-btn-coral"
            style={{ width: 44, height: 44, borderRadius: "50%",
              fontSize: 18, padding: 0 }}>
            {added ? "✓" : "🛒"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   NEARBY SECTION — 2-col grid
═══════════════════════════════════════════════ */
function NearbyGrid({ items, onView }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr",
      gap: 12, padding: "0 18px" }}>
      {items.map((item, i) => (
        <div key={i} className="hui-card-tap"
          style={{ borderRadius: 18, overflow: "hidden",
            boxShadow: "0 2px 14px rgba(0,0,0,0.08)" }}
          onClick={() => onView && onView(item.name)}>
          <div style={{ height: 150, overflow: "hidden", position: "relative" }}>
            <img src={item.img} alt={item.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", inset: 0,
              background: "linear-gradient(to bottom, transparent 40%, rgba(17,17,17,0.7) 100%)" }} />
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                <Avatar src={item.creatorImg} name={item.name} size={22} />
                <div style={{ fontWeight: 800, fontSize: 12, color: "white" }}>{item.name}</div>
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>
                {item.talent}
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", marginTop: 2 }}>
                📍 {item.distance} entfernt
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   IMPACT TEASER CARD
═══════════════════════════════════════════════ */
function ImpactTeaserCard({ onImpact }) {
  return (
    <div className="hui-card-tap"
      style={{ margin: "0 18px", overflow: "hidden",
        borderRadius: 22, background: C.card,
        boxShadow: "0 4px 24px rgba(0,0,0,0.10)" }}
      onClick={onImpact}>

      <div style={{ position: "relative", height: 200, overflow: "hidden" }}>
        <img src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=80"
          alt="Impact" style={{ width: "100%", height: "100%", objectFit: "cover",
            filter: "brightness(0.68) saturate(1.1)" }} />
        <div style={{ position: "absolute", inset: 0,
          background: `linear-gradient(160deg, rgba(22,215,197,0.75) 0%, rgba(255,138,107,0.55) 100%)` }} />

        <div style={{ position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.85)",
            letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>
            Aktueller Impact Pool
          </div>
          <div style={{ fontWeight: 900, fontSize: 42, color: "white",
            textShadow: "0 2px 16px rgba(0,0,0,0.2)", lineHeight: 1, marginBottom: 6 }}>
            {IMPACT_TEASER.poolEur.toLocaleString("de-DE")} €
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", marginBottom: 16 }}>
            gesammelt diesen Monat
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6,
            background: "rgba(255,255,255,0.18)", backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.3)",
            borderRadius: 999, padding: "7px 16px",
            fontSize: 12, fontWeight: 700, color: "white" }}>
            <span className="hui-breathe">🌱</span>
            Abstimmung endet in 4 Tagen · 30. {IMPACT_TEASER.month}
          </div>
        </div>
      </div>

      <div style={{ padding: "14px 18px", display: "flex",
        alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.5, maxWidth: "65%" }}>
          Gemeinsam haben wir diesen Monat schon
          <strong style={{ color: C.teal }}> {IMPACT_TEASER.poolEur.toLocaleString("de-DE")} €</strong> bewegt.
        </div>
        <button className="hui-btn hui-btn-primary"
          style={{ padding: "10px 16px", fontSize: 13 }}>
          Impact ansehen
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   KATEGORIEN
═══════════════════════════════════════════════ */
function KategorienGrid() {
  return (
    <div style={{ padding: "0 18px",
      display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
      {KATEGORIEN.map((k, i) => (
        <button key={i}
          className="hui-card-tap"
          style={{ borderRadius: 18, padding: "16px 10px",
            background: C.card, border: "none", cursor: "pointer",
            boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
            WebkitTapHighlightColor: "transparent" }}>
          <div style={{ width: 44, height: 44, borderRadius: 14,
            background: `${k.color}15`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22 }}>
            {k.icon}
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.ink2 }}>{k.label}</span>
        </button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   TOP TALENTE LIST
═══════════════════════════════════════════════ */
function TopTalenteList({ onView }) {
  return (
    <div className="hui-card" style={{ margin: "0 18px", padding: "4px 0" }}>
      {TOP_TALENTE.map((t, i) => (
        <div key={i}
          className="hui-card-tap"
          onClick={() => onView && onView(t.name)}
          style={{ display: "flex", alignItems: "center",
            gap: 12, padding: "12px 16px",
            borderBottom: i < TOP_TALENTE.length - 1 ? `1px solid ${C.border}` : "none" }}>
          <Avatar src={t.img} name={t.name} size={44} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: C.ink }}>{t.name}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>{t.talent}</div>
          </div>
          <StarScore score={t.score} />
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   HEADER
═══════════════════════════════════════════════ */
function TopHeader({ cart, notif, onNotif, onCart }) {
  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 60,
      background: "rgba(252,252,250,0.95)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderBottom: `1px solid ${C.border}`,
    }}>
      <div style={{ height: "env(safe-area-inset-top, 0px)" }} />
      <div style={{ display: "flex", alignItems: "center",
        padding: "0 18px", height: 58, gap: 8 }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10,
            background: `linear-gradient(135deg, ${C.teal}, ${C.teal2})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, boxShadow: `0 2px 8px rgba(22,215,197,0.3)` }}>
            🌱
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 20, letterSpacing: -0.5,
              lineHeight: 1, color: C.ink }}>
              <span style={{ color: C.teal }}>H</span>
              <span style={{ color: C.coral }}>U</span>
              <span style={{ color: C.teal }}>I</span>
            </div>
            <div style={{ fontSize: 9, fontWeight: 600, color: C.muted, lineHeight: 1,
              letterSpacing: 0.3 }}>Human United Intelligent</div>
          </div>
        </div>

        {/* Icons */}
        <button onClick={onNotif}
          style={{ position: "relative", width: 38, height: 38, borderRadius: "50%",
            background: C.card, border: `1px solid ${C.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", fontSize: 17,
            boxShadow: "0 1px 5px rgba(0,0,0,0.06)",
            WebkitTapHighlightColor: "transparent" }}>
          🔔
          {notif > 0 && (
            <div style={{ position: "absolute", top: -3, right: -3,
              width: 16, height: 16, borderRadius: "50%",
              background: C.coral, color: "white",
              fontSize: 8, fontWeight: 900,
              display: "flex", alignItems: "center", justifyContent: "center",
              border: `2px solid ${C.white}` }}>
              {notif > 9 ? "9+" : notif}
            </div>
          )}
        </button>

        <button onClick={onCart}
          style={{ position: "relative", width: 38, height: 38, borderRadius: "50%",
            background: `linear-gradient(135deg, ${C.coralPale}, ${C.tealPale})`,
            border: `1px solid ${C.coral}28`,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", fontSize: 17,
            boxShadow: `0 1px 6px ${C.coral}18`,
            WebkitTapHighlightColor: "transparent" }}>
          🛒
          {cart > 0 && (
            <div style={{ position: "absolute", top: -3, right: -3,
              width: 16, height: 16, borderRadius: "50%",
              background: C.coral, color: "white",
              fontSize: 8, fontWeight: 900,
              display: "flex", alignItems: "center", justifyContent: "center",
              border: `2px solid ${C.white}` }}>{cart}</div>
          )}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   BOTTOM NAV
═══════════════════════════════════════════════ */
function BottomNav({ tab, onTab, unread, isTalent, onCreate }) {
  const left  = [{ key: "feed", icon: "🏠", label: "Home" },
                 { key: "impact", icon: "🌱", label: "Impact" }];
  const right = [{ key: "discover", icon: "🔍", label: "Entdecke" },
                 { key: "profile", icon: "👤", label: "Profil", badge: unread }];

  return (
    <div className="hui-bottom-nav">
      <div style={{ display: "flex", alignItems: "center",
        justifyContent: "space-around", padding: "6px 4px 4px" }}>
        {left.map(item => (
          <NavBtn key={item.key} item={item} active={tab === item.key}
            onTap={() => onTab(item.key)} />
        ))}
        {/* Center Plus */}
        {isTalent ? (
          <button onClick={onCreate}
            style={{ width: 54, height: 54, borderRadius: "50%", flexShrink: 0,
              background: `linear-gradient(135deg, ${C.teal}, ${C.coral})`,
              border: `3.5px solid ${C.white}`,
              boxShadow: `0 4px 20px rgba(22,215,197,0.45)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", fontSize: 26, color: "white",
              transform: "translateY(-12px)",
              transition: "transform 0.15s, box-shadow 0.15s",
              WebkitTapHighlightColor: "transparent" }}
            onTouchStart={e => { e.currentTarget.style.transform = "translateY(-12px) scale(0.9)"; }}
            onTouchEnd={e   => { e.currentTarget.style.transform = "translateY(-12px) scale(1)"; }}>
            +
          </button>
        ) : <div style={{ width: 54, flexShrink: 0 }} />}
        {right.map(item => (
          <NavBtn key={item.key} item={item} active={tab === item.key}
            onTap={() => onTab(item.key)} />
        ))}
      </div>
    </div>
  );
}

function NavBtn({ item, active, onTap }) {
  return (
    <button onClick={onTap}
      style={{ display: "flex", flexDirection: "column",
        alignItems: "center", gap: 3, background: "none",
        border: "none", cursor: "pointer", padding: "5px 10px",
        position: "relative", minWidth: 52,
        WebkitTapHighlightColor: "transparent" }}
      onTouchStart={e => e.currentTarget.style.transform = "scale(0.86)"}
      onTouchEnd={e   => e.currentTarget.style.transform = "scale(1)"}>
      {active && (
        <div style={{ position: "absolute", top: 2, left: "50%",
          transform: "translateX(-50%)",
          width: 4, height: 4, borderRadius: "50%",
          background: C.teal }} />
      )}
      <div style={{ fontSize: 21,
        filter: active ? "none" : "grayscale(1) opacity(0.38)",
        transform: active ? "translateY(-1px)" : "none",
        transition: "filter 0.2s, transform 0.2s" }}>
        {item.icon}
      </div>
      <div style={{ fontSize: 10, fontWeight: active ? 800 : 500,
        color: active ? C.teal : C.muted, transition: "color 0.2s" }}>
        {item.label}
      </div>
      {item.badge > 0 && (
        <div style={{ position: "absolute", top: 4, right: 6,
          width: 13, height: 13, borderRadius: "50%",
          background: C.coral, color: "white", fontSize: 7, fontWeight: 900,
          display: "flex", alignItems: "center", justifyContent: "center",
          border: `1.5px solid ${C.white}` }}>{item.badge}</div>
      )}
    </button>
  );
}

/* ═══════════════════════════════════════════════
   DISCOVER PAGE
═══════════════════════════════════════════════ */
function DiscoverPage({ onView }) {
  const [matchOpen, setMatchOpen] = useState(false);
  return (
    <div style={{ paddingBottom: 90 }}>
      {/* HUI Match Banner */}
      <div style={{ margin: "16px 18px",
        borderRadius: 22, overflow: "hidden",
        background: `linear-gradient(160deg, ${C.teal}18, ${C.coral}12)`,
        border: `1.5px solid ${C.teal}25`,
        padding: "18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between",
          alignItems: "flex-start", marginBottom: 10 }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 17, color: C.ink, marginBottom: 3 }}>
              ✨ HUI Match
            </div>
            <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5, maxWidth: "75%" }}>
              Beschreibe, was du suchst — unsere KI findet die perfekten Talente & Werke für dich.
            </div>
          </div>
          <span className="hui-badge-coral" style={{ fontSize: 10 }}>Neu</span>
        </div>
        <input className="hui-search-pill"
          placeholder="z. B. Fotograf für Hochzeit in München, max. 500 €"
          onFocus={() => setMatchOpen(true)}
          style={{ paddingLeft: 16 }}
          readOnly
        />
        {matchOpen && <HuiMatchOverlay onClose={() => setMatchOpen(false)} />}
      </div>

      {/* Karte preview */}
      <SectionHeader icon="🗺️" title="Karte" />
      <div style={{ margin: "0 18px", borderRadius: 20, overflow: "hidden",
        height: 160, background: `linear-gradient(135deg, ${C.tealPale}, ${C.coralPale})`,
        position: "relative",
        boxShadow: "0 2px 16px rgba(0,0,0,0.08)" }}>
        <div style={{ position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🗺️</div>
            <button className="hui-btn hui-btn-primary"
              style={{ padding: "10px 22px", fontSize: 14 }}>
              Karte öffnen
            </button>
          </div>
        </div>
        {/* Mock avatar pins */}
        {[{ top:30,left:60 },{ top:80,left:160 },{ top:50,left:240 }].map((pos,i)=>(
          <div key={i} style={{ position:"absolute", top:pos.top, left:pos.left,
            width:36, height:36, borderRadius:"50%",
            border:`2px solid ${C.teal}`,
            overflow:"hidden", boxShadow:"0 2px 8px rgba(0,0,0,0.15)",
            background: C.card }}>
            <img src={FEATURED_WIRKER[i]?.img} alt=""
              style={{ width:"100%", height:"100%", objectFit:"cover" }} />
          </div>
        ))}
      </div>

      {/* Kategorien */}
      <SectionHeader icon="🏷️" title="Kategorien" onShowAll={() => {}} />
      <KategorienGrid />

      {/* Top Talente */}
      <SectionHeader icon="⭐" title="Top Talente" onShowAll={() => {}} />
      <div style={{ padding: "0 4px 4px 4px" }}>
        <div style={{ fontSize: 12, color: C.muted, padding: "0 18px 10px" }}>
          Diese Woche beliebt
        </div>
        <TopTalenteList onView={onView} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN HOME FEED
═══════════════════════════════════════════════ */
function HomeFeedContent({ onView, onBook, onCart, onImpact }) {
  return (
    <div style={{ paddingBottom: 90 }}>

      {/* Stories */}
      <div style={{ padding: "14px 0 10px" }}>
        <StoriesBar onView={onView} />
      </div>
      <div style={{ height: 1, background: C.border, margin: "0 18px 4px" }} />

      {/* ── Section 1: Ausgewählte Talente ── */}
      <SectionHeader icon="✨" title="Für dich"
        onShowAll={() => {}} />
      <div style={{ fontSize: 12, color: C.muted, padding: "0 18px 12px",
        marginTop: -8 }}>Handverlesen für dich</div>

      <div className="scrollbar-hide"
        style={{ display: "flex", gap: 14, overflowX: "auto",
          padding: "0 18px 4px" }}>
        {FEATURED_WIRKER.map((w, i) => (
          <FeaturedTalentCard key={i} wirker={w}
            onView={onView} onBook={onBook} />
        ))}
      </div>

      {/* ── Section 2: Beliebte Werke ── */}
      <SectionHeader icon="🎨" title="Beliebte Werke"
        onShowAll={() => {}} />
      {POPULAR_WORKS.map((w, i) => (
        <PopularWorkCard key={i} work={w} onCart={onCart} />
      ))}

      {/* ── Section 3: In deiner Nähe ── */}
      <SectionHeader icon="📍" title="In deiner Nähe"
        onShowAll={() => {}} />
      <div style={{ fontSize: 12, color: C.muted, padding: "0 18px 12px", marginTop: -8 }}>
        Talente & Werke in deiner Umgebung
      </div>
      <NearbyGrid items={NEARBY} onView={onView} />

      {/* ── Section 4: Impact ── */}
      <SectionHeader icon="🌱" title="Inspiration"
        onShowAll={() => onImpact && onImpact()} />
      <div style={{ fontSize: 12, color: C.muted, padding: "0 18px 12px", marginTop: -8 }}>
        Geschichten, die bewegen
      </div>
      <ImpactTeaserCard onImpact={onImpact} />

      {/* Abstand */}
      <div style={{ height: 24 }} />
    </div>
  );
}

/* ═══════════════════════════════════════════════
   ROOT EXPORT
═══════════════════════════════════════════════ */
export default function Home() {
  const [tab,           setTab]           = useState("feed");
  const [viewingWirker, setViewingWirker] = useState(null);
  const [showBooking,   setShowBooking]   = useState(null);
  const [showCreate,    setShowCreate]    = useState(false);
  const [showMatch,     setShowMatch]     = useState(false);
  const [cart,          setCart]          = useState([]);
  const [notif,         setNotif]         = useState(3);
  const [unread,        setUnread]        = useState(0);
  const [currentUser,   setCurrentUser]   = useState(null);
  const [isTalent,      setIsTalent]      = useState(false);
  const [scrolled,      setScrolled]      = useState(false);
  const [following,     setFollowing]     = useState(new Set());
  const scrollRef = useRef(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      setCurrentUser(session.user);
      try {
        const { data } = await supabase.from("profiles")
          .select("talent_type").eq("user_id", session.user.id).single();
        if (data?.talent_type && data.talent_type !== "entdecker") setIsTalent(true);
      } catch { setIsTalent(true); }
    });
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const fn = () => setScrolled(el.scrollTop > 50);
    el.addEventListener("scroll", fn, { passive: true });
    return () => el.removeEventListener("scroll", fn);
  }, []);

  if (showCreate) return <CreateFlow onClose={() => setShowCreate(false)} />;

  if (viewingWirker) return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200,
      overflowY: "auto", background: C.white }}>
      <WirkerProfilePage
        wirkerName={viewingWirker}
        onBack={() => setViewingWirker(null)}
        onAddToCart={item => setCart(p => [...p, item])}
        isOwnProfile={false}
        following={following}
        toggleFollow={name => setFollowing(p => {
          const n = new Set(p); n.has(name) ? n.delete(name) : n.add(name); return n;
        })}
        onGoToChats={() => { setViewingWirker(null); setTab("chats"); }}
      />
    </div>
  );

  if (showBooking) return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200,
      overflowY: "auto", background: C.white }}>
      <BookingFlow
        wirker={showBooking}
        onClose={() => setShowBooking(null)}
        onAddToCart={item => setCart(p => [...p, item])}
        onSuccess={() => { setShowBooking(null); setTab("chats"); }}
      />
    </div>
  );

  return (
    <div className="hui-app-bg"
      style={{ height: "100dvh", display: "flex",
        flexDirection: "column", overflow: "hidden" }}>

      <TopHeader cart={cart.length} notif={notif}
        onNotif={() => setNotif(0)} onCart={() => {}} />

      <div ref={scrollRef}
        style={{ flex: 1, overflowY: "auto", overflowX: "hidden",
          WebkitOverflowScrolling: "touch" }}
        className="scrollbar-hide">

        {/* Search (only on feed + discover) */}
        {(tab === "feed" || tab === "discover") && (
          <SearchArea scrolled={scrolled} onMatchOpen={() => setShowMatch(true)} />
        )}

        {tab === "feed" && (
          <HomeFeedContent
            onView={setViewingWirker} onBook={setShowBooking}
            onCart={item => setCart(p => [...p, item])}
            onImpact={() => setTab("impact")}
          />
        )}
        {tab === "impact"   && <ImpactPage currentUser={currentUser} />}
        {tab === "discover" && <DiscoverPage onView={setViewingWirker} />}
        {tab === "profile"  && (
          <ProfilePage
            onTalentAnbieten={() => setShowCreate(true)}
            onLogout={() => { supabase.auth.signOut(); window.location.href = "/login"; }}
          />
        )}
      </div>

      <BottomNav tab={tab} onTab={setTab} unread={unread}
        isTalent={isTalent} onCreate={() => setShowCreate(true)} />

      {showMatch && <HuiMatchOverlay onClose={() => setShowMatch(false)} />}
    </div>
  );
}
