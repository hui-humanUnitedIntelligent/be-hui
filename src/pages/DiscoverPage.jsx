// DiscoverPage.jsx — HUI Entdecken v3
// Screenshot-exact rebuild: Airbnb × Apple × Pinterest × HUI
// Struktur: Header → Pills → Hero Cards → Beliebte Werke → Erlebnisse

import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { normalizeProfileInput, PROFILE_FIELDS } from "../lib/perfUtils";

/* ── Design Tokens ─────────────────────────────────────────── */
const C = {
  teal:      "#16D7C5",
  teal2:     "#11C5B7",
  tealPale:  "#E6FAF8",
  coral:     "#FF8A6B",
  coralPale: "#FFF2EE",
  gold:      "#F5A623",
  green:     "#10B981",
  cream:     "#F9F7F4",
  warm:      "#FEFCFA",
  card:      "#FFFFFF",
  ink:       "#1A1A1A",
  ink2:      "#3A3A3A",
  muted:     "#888888",
  muted2:    "#C8C8C8",
  border:    "rgba(0,0,0,0.07)",
};

/* ── CSS ────────────────────────────────────────────────────── */
const CSS = `
  * { box-sizing: border-box; -webkit-font-smoothing: antialiased; }

  @keyframes fadeUp {
    from { opacity:0; transform:translateY(8px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes scaleIn {
    from { opacity:0; transform:scale(0.96); }
    to   { opacity:1; transform:scale(1); }
  }
  @keyframes pillIn {
    from { opacity:0; transform:translateX(8px); }
    to   { opacity:1; transform:translateX(0); }
  }

  .dp-scroll::-webkit-scrollbar { display:none; }
  .dp-scroll { -ms-overflow-style:none; scrollbar-width:none; }

  .dp-hero-card {
    flex-shrink: 0;
    border-radius: 24px;
    overflow: hidden;
    position: relative;
    cursor: pointer;
    transition: transform 0.35s ease, box-shadow 0.35s ease;
    -webkit-tap-highlight-color: transparent;
  }
  .dp-hero-card:active {
    transform: scale(0.975);
  }

  .dp-werk-card {
    flex-shrink: 0;
    border-radius: 18px;
    overflow: hidden;
    background: #fff;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    -webkit-tap-highlight-color: transparent;
    box-shadow: 0 2px 12px rgba(0,0,0,0.07);
  }
  .dp-werk-card:active { transform: scale(0.97); }

  .dp-erlebnis-card {
    flex: 1;
    min-width: 0;
    border-radius: 20px;
    overflow: hidden;
    position: relative;
    cursor: pointer;
    transition: transform 0.2s ease;
    -webkit-tap-highlight-color: transparent;
  }
  .dp-erlebnis-card:active { transform: scale(0.97); }

  .dp-pill {
    flex-shrink: 0;
    border-radius: 999px;
    padding: 8px 18px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    outline: none;
    transition: all 0.18s ease;
    -webkit-tap-highlight-color: transparent;
    white-space: nowrap;
  }
  .dp-pill:active { transform: scale(0.95); }

  .dp-like-btn {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: rgba(255,255,255,0.9);
    backdrop-filter: blur(8px);
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: transform 0.15s ease;
    -webkit-tap-highlight-color: transparent;
    box-shadow: 0 2px 8px rgba(0,0,0,0.12);
  }
  .dp-like-btn:active { transform: scale(0.88); }

  .dp-search-btn {
    width: 38px; height: 38px;
    border-radius: 50%;
    background: ${C.cream};
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 17px;
    transition: background 0.15s;
    -webkit-tap-highlight-color: transparent;
  }
  .dp-search-btn:active { background: rgba(0,0,0,0.08); }

  .dp-filter-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 0 14px;
    height: 38px;
    border-radius: 999px;
    background: ${C.cream};
    border: none;
    font-size: 13px;
    font-weight: 600;
    color: ${C.ink2};
    cursor: pointer;
    transition: background 0.15s;
    -webkit-tap-highlight-color: transparent;
  }
  .dp-filter-btn:active { background: rgba(0,0,0,0.08); }
`;

/* ── Kategorien ─────────────────────────────────────────────── */
const PILLS = [
  { id:"alle",       label:"Für dich" },
  { id:"kunst",      label:"Kunst" },
  { id:"handwerk",   label:"Handwerk" },
  { id:"musik",      label:"Musik" },
  { id:"natur",      label:"Natur" },
  { id:"design",     label:"Design" },
  { id:"wellness",   label:"Wellness" },
  { id:"gemeinschaft", label:"Gemeinschaft" },
  { id:"kultur",     label:"Kultur" },
];

/* ── Mock Data ──────────────────────────────────────────────── */
const MOCK_HERO = [
  {
    id:"h1", title:"Die Kunst der\nStillen Keramik",
    img:"https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&q=80",
    creator:"Mia Kern", creatorImg:"https://i.pravatar.cc/40?img=47",
    badge:"Neu", category:"Handwerk",
  },
  {
    id:"h2", title:"Waldspaziergang\n& Achtsamkeit",
    img:"https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&q=80",
    creator:"Sara Voss", creatorImg:"https://i.pravatar.cc/40?img=11",
    badge:"Beliebt", category:"Natur",
  },
  {
    id:"h3", title:"Upcycling\naus Alt mach Neu",
    img:"https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&q=80",
    creator:"Kai Müller", creatorImg:"https://i.pravatar.cc/40?img=52",
    badge:"Empfohlen", category:"Design",
  },
  {
    id:"h4", title:"Licht & Klang\nAbend",
    img:"https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80",
    creator:"Elena Roth", creatorImg:"https://i.pravatar.cc/40?img=23",
    badge:"Heute", category:"Musik",
  },
];

const MOCK_WERKE = [
  {
    id:"w1", title:'Wandbild "Harmonie"',
    img:"https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&q=75",
    price:120, likes:32, creator:"Julia Brandt", creatorImg:"https://i.pravatar.cc/32?img=9",
  },
  {
    id:"w2", title:"Handgemachte Schale",
    img:"https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=400&q=75",
    price:85, likes:18, creator:"Mia Kern", creatorImg:"https://i.pravatar.cc/32?img=47",
  },
  {
    id:"w3", title:"Holzlampe Eiche",
    img:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=75",
    price:150, likes:41, creator:"Leon Brandt", creatorImg:"https://i.pravatar.cc/32?img=53",
  },
  {
    id:"w4", title:"Acryl Bild Meer",
    img:"https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=400&q=75",
    price:95, likes:27, creator:"Sara Voss", creatorImg:"https://i.pravatar.cc/32?img=11",
  },
  {
    id:"w5", title:"Keramik Vase",
    img:"https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400&q=75",
    price:68, likes:15, creator:"Anna Feld", creatorImg:"https://i.pravatar.cc/32?img=32",
  },
];

const MOCK_ERLEBNISSE = [
  {
    id:"e1", title:"Keramik Drehen",
    img:"https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&q=80",
    category:"Workshop", city:"München", date:"18. Mai",
    badge:"Noch 3 Plätze", badgeColor: C.teal,
    spots:3,
  },
  {
    id:"e2", title:"Gitarren Abend",
    img:"https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=600&q=80",
    category:"Musik", city:"Berlin", date:"19. Mai",
    badge:"Sehr beliebt", badgeColor: C.coral,
    spots:8,
  },
  {
    id:"e3", title:"Natur Retreat",
    img:"https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&q=80",
    category:"Wellness", city:"Schwarzwald", date:"24. Mai",
    badge:"Neu", badgeColor: C.gold,
    spots:12,
  },
  {
    id:"e4", title:"Gemeinschafts-Abend",
    img:"https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80",
    category:"Gemeinschaft", city:"Hamburg", date:"25. Mai",
    badge:"Beliebt", badgeColor: C.coral,
    spots:6,
  },
];

/* ── Helper ─────────────────────────────────────────────────── */
function storageUrl(bucket, path) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  try {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data?.publicUrl || null;
  } catch { return null; }
}

/* ── Skeleton ───────────────────────────────────────────────── */
function Skeleton({ w = "100%", h = 180, r = 18 }) {
  return (
    <div style={{
      width:w, height:h, borderRadius:r,
      background:"linear-gradient(90deg, #f0ede8 0%, #e8e4df 50%, #f0ede8 100%)",
      backgroundSize:"200% 100%",
      animation:"shimmer 1.6s infinite",
      flexShrink:0,
    }}/>
  );
}

/* ── Hero Card ──────────────────────────────────────────────── */
function HeroCard({ item, idx, onPress, liked, onLike }) {
  return (
    <div
      className="dp-hero-card"
      onClick={() => onPress?.(item)}
      style={{
        width: 220, height: 270,
        animation:`scaleIn 0.4s ${idx*0.08}s both`,
        boxShadow:"0 8px 32px rgba(0,0,0,0.16)",
      }}
    >
      {/* Bild */}
      <img
        src={item.img}
        alt={item.title}
        loading="lazy"
        decoding="async"
        style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
      />

      {/* Gradient Overlay */}
      <div style={{
        position:"absolute", inset:0,
        background:"linear-gradient(to bottom, rgba(0,0,0,0.0) 35%, rgba(0,0,0,0.72) 100%)",
        pointerEvents:"none",
      }}/>

      {/* Badge oben links */}
      <div style={{
        position:"absolute", top:12, left:12,
        background:"rgba(255,255,255,0.92)",
        backdropFilter:"blur(8px)",
        borderRadius:999,
        padding:"4px 10px",
        fontSize:11, fontWeight:700, color:C.ink,
        boxShadow:"0 1px 6px rgba(0,0,0,0.10)",
      }}>
        {item.badge}
      </div>

      {/* Like Button oben rechts */}
      <button
        className="dp-like-btn"
        onClick={e => { e.stopPropagation(); onLike?.(item.id); }}
      >
        <span style={{ fontSize:15, color: liked ? C.coral : C.muted }}>
          {liked ? "♥" : "♡"}
        </span>
      </button>

      {/* Content unten */}
      <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"16px 14px 14px" }}>
        <div style={{
          fontSize:16, fontWeight:800, color:"#fff",
          lineHeight:1.28, letterSpacing:-0.3,
          marginBottom:10, whiteSpace:"pre-line",
          textShadow:"0 1px 4px rgba(0,0,0,0.3)",
        }}>
          {item.title}
        </div>

        {/* Creator Row */}
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <img
            src={item.creatorImg} alt={item.creator}
            style={{ width:22, height:22, borderRadius:"50%",
              border:"1.5px solid rgba(255,255,255,0.7)",
              objectFit:"cover", flexShrink:0 }}
          />
          <span style={{ fontSize:12, color:"rgba(255,255,255,0.88)",
            fontWeight:500, letterSpacing:0.1 }}>
            {item.creator}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Werk Card ──────────────────────────────────────────────── */
function WerkCard({ item, idx, onPress, liked, onLike }) {
  return (
    <div
      className="dp-werk-card"
      onClick={() => onPress?.(item)}
      style={{
        width: 150,
        animation:`fadeUp 0.4s ${0.1 + idx*0.07}s both`,
      }}
    >
      {/* Bild */}
      <div style={{ position:"relative", height:130 }}>
        <img
          src={item.img} alt={item.title}
          loading="lazy" decoding="async"
          style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
        />
        {/* Preis Badge */}
        <div style={{
          position:"absolute", bottom:8, left:8,
          background:"rgba(255,255,255,0.93)",
          backdropFilter:"blur(6px)",
          borderRadius:8,
          padding:"3px 8px",
          fontSize:12, fontWeight:700, color:C.ink,
        }}>
          € {item.price}
        </div>
        {/* Likes */}
        <div style={{
          position:"absolute", bottom:8, right:8,
          display:"flex", alignItems:"center", gap:3,
          background:"rgba(255,255,255,0.93)",
          backdropFilter:"blur(6px)",
          borderRadius:8, padding:"3px 8px",
          fontSize:12, fontWeight:600, color:C.muted,
        }}>
          <span style={{ color: C.coral, fontSize:11 }}>♥</span>
          {item.likes}
        </div>
      </div>

      {/* Info */}
      <div style={{ padding:"10px 10px 12px" }}>
        <div style={{
          fontSize:13, fontWeight:700, color:C.ink,
          lineHeight:1.3, marginBottom:6,
          overflow:"hidden", textOverflow:"ellipsis",
          display:"-webkit-box", WebkitLineClamp:2,
          WebkitBoxOrient:"vertical",
        }}>
          {item.title}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:5 }}>
          <img
            src={item.creatorImg} alt={item.creator}
            style={{ width:16, height:16, borderRadius:"50%", objectFit:"cover" }}
          />
          <span style={{ fontSize:11, color:C.muted, fontWeight:500,
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {item.creator}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Erlebnis Card ──────────────────────────────────────────── */
function ErlebnisCard({ item, idx, onPress }) {
  return (
    <div
      className="dp-erlebnis-card"
      onClick={() => onPress?.(item)}
      style={{
        height: 168,
        animation:`fadeUp 0.45s ${0.15 + idx*0.1}s both`,
        boxShadow:"0 4px 20px rgba(0,0,0,0.12)",
      }}
    >
      <img
        src={item.img} alt={item.title}
        loading="lazy" decoding="async"
        style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
      />

      {/* Gradient */}
      <div style={{
        position:"absolute", inset:0,
        background:"linear-gradient(to bottom, rgba(0,0,0,0.0) 30%, rgba(0,0,0,0.68) 100%)",
      }}/>

      {/* Badge */}
      <div style={{
        position:"absolute", top:10, left:10,
        background:"rgba(255,255,255,0.92)",
        backdropFilter:"blur(8px)",
        borderRadius:999,
        padding:"4px 10px",
        fontSize:11, fontWeight:700,
        color: item.badgeColor || C.teal,
        boxShadow:"0 1px 6px rgba(0,0,0,0.10)",
      }}>
        {item.badge}
      </div>

      {/* Content */}
      <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"12px" }}>
        <div style={{
          fontSize:15, fontWeight:800, color:"#fff",
          lineHeight:1.25, marginBottom:5, letterSpacing:-0.2,
          textShadow:"0 1px 4px rgba(0,0,0,0.25)",
        }}>
          {item.title}
        </div>
        <div style={{ fontSize:11, color:"rgba(255,255,255,0.80)", fontWeight:500 }}>
          {item.category} · {item.city} · {item.date}
        </div>
      </div>
    </div>
  );
}

/* ── Section Header ─────────────────────────────────────────── */
function SectionHeader({ title, onAll }) {
  return (
    <div style={{
      display:"flex", alignItems:"center",
      justifyContent:"space-between",
      padding:"0 20px", marginBottom:14,
    }}>
      <span style={{
        fontSize:18, fontWeight:800, color:C.ink,
        letterSpacing:-0.4,
      }}>
        {title}
      </span>
      {onAll && (
        <button
          onClick={onAll}
          style={{
            background:"none", border:"none",
            fontSize:13, fontWeight:700, color:C.teal,
            cursor:"pointer", padding:"4px 0",
          }}
        >
          Alle anzeigen
        </button>
      )}
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────── */
export default function DiscoverPage({ onMap, onView, onBook, refreshSignal }) {
  const [activeCategory, setActiveCategory] = useState("alle");
  const [heroItems,     setHeroItems]     = useState(MOCK_HERO);
  const [works,         setWorks]         = useState(MOCK_WERKE);
  const [experiences,   setExperiences]   = useState(MOCK_ERLEBNISSE);
  const [talents,       setTalents]       = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [likedHero,     setLikedHero]     = useState(new Set());
  const [likedWerke,    setLikedWerke]    = useState(new Set());
  const [showSearch,    setShowSearch]    = useState(false);
  const [searchQ,       setSearchQ]       = useState("");
  const searchRef = useRef(null);

  // Daten laden
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [profilesRes, worksRes] = await Promise.all([
        supabase
          .from("profiles")
          .select(PROFILE_FIELDS)
          .eq("has_talent_profile", true)
          .limit(12),
        supabase
          .from("works")
          .select(`id,title,category,price,cover_url,images,description,
            profile:user_id(display_name,full_name,avatar_url)`)
          .eq("status", "published")
          .order("created_at", { ascending: false })
          .limit(16),
      ]);

      // Werke aus DB
      if (worksRes.data?.length > 0) {
        const mapped = worksRes.data.map((w, i) => ({
          id:          w.id,
          title:       w.title || MOCK_WERKE[i % MOCK_WERKE.length].title,
          img:         storageUrl("works", w.cover_url)
                       || w.images?.[0]
                       || MOCK_WERKE[i % MOCK_WERKE.length].img,
          price:       w.price || MOCK_WERKE[i % MOCK_WERKE.length].price,
          likes:       Math.floor(Math.random() * 50) + 5,
          creator:     w.profile?.display_name || w.profile?.full_name || MOCK_WERKE[i % MOCK_WERKE.length].creator,
          creatorImg:  `https://i.pravatar.cc/32?img=${(i % 50) + 1}`,
          type:        "werk",
          raw:         w,
        }));
        setWorks(mapped);
      }

      // Talents aus DB → Hero Cards
      if (profilesRes.data?.length > 0) {
        setTalents(profilesRes.data.map((p, i) => ({
          ...normalizeProfileInput(p),
          type: "wirker",
        })));
      }
    } catch (err) {
      // silent — Mocks bleiben
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData, refreshSignal]);

  useEffect(() => {
    if (showSearch) setTimeout(() => searchRef.current?.focus(), 80);
  }, [showSearch]);

  const toggleLikeHero  = id => setLikedHero(s  => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleLikeWerk  = id => setLikedWerke(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleView = item => onView?.(item);

  // Kategorie-Filter
  const filteredHero = activeCategory === "alle"
    ? heroItems
    : heroItems.filter(h => h.category?.toLowerCase() === activeCategory);

  const filteredWerke = activeCategory === "alle"
    ? works
    : works.filter(w => w.category?.toLowerCase() === activeCategory);

  const filteredErlebnisse = activeCategory === "alle"
    ? experiences
    : experiences.filter(e => e.category?.toLowerCase() === activeCategory);

  return (
    <div style={{
      minHeight:"100vh",
      background: C.warm,
      fontFamily:"-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif",
      paddingBottom: 100,
    }}>
      <style>{CSS}</style>

      {/* ════════════════════════════════════════
          STICKY HEADER
      ════════════════════════════════════════ */}
      <div style={{
        position:"sticky", top:0, zIndex:100,
        background:"rgba(254,252,250,0.92)",
        backdropFilter:"blur(16px)",
        WebkitBackdropFilter:"blur(16px)",
        borderBottom:`1px solid ${C.border}`,
        padding:"14px 20px 12px",
      }}>
        {showSearch ? (
          /* Search Mode */
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{
              flex:1, display:"flex", alignItems:"center", gap:8,
              background:C.cream, borderRadius:14,
              padding:"0 14px", height:42,
              border:`1.5px solid ${C.teal}`,
            }}>
              <span style={{ fontSize:15, opacity:0.5 }}>🔍</span>
              <input
                ref={searchRef}
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                placeholder="Suche nach Erlebnissen, Werken..."
                style={{
                  flex:1, border:"none", background:"none",
                  fontSize:14, color:C.ink, outline:"none",
                }}
              />
            </div>
            <button
              onClick={() => { setShowSearch(false); setSearchQ(""); }}
              style={{
                background:"none", border:"none",
                fontSize:14, fontWeight:600, color:C.teal,
                cursor:"pointer", padding:"4px 0",
              }}
            >
              Abbrechen
            </button>
          </div>
        ) : (
          /* Normal Mode */
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span style={{
              fontSize:26, fontWeight:900, color:C.ink, letterSpacing:-0.8,
            }}>
              Entdecken
            </span>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <button className="dp-search-btn" onClick={() => setShowSearch(true)}>
                🔍
              </button>
              <button className="dp-filter-btn">
                <span style={{ fontSize:14 }}>⚙︎</span>
                Filter
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════
          KATEGORIE PILLS
      ════════════════════════════════════════ */}
      <div
        className="dp-scroll"
        style={{
          display:"flex", gap:8,
          overflowX:"auto",
          padding:"14px 20px",
        }}
      >
        {PILLS.map((pill, i) => {
          const active = activeCategory === pill.id;
          return (
            <button
              key={pill.id}
              className="dp-pill"
              onClick={() => setActiveCategory(pill.id)}
              style={{
                background: active
                  ? `linear-gradient(135deg, ${C.teal} 0%, ${C.coral} 100%)`
                  : C.card,
                color: active ? "#fff" : C.ink2,
                boxShadow: active
                  ? `0 4px 16px rgba(22,215,197,0.30)`
                  : "0 1px 6px rgba(0,0,0,0.07)",
                animation: `pillIn 0.3s ${i*0.04}s both`,
                fontWeight: active ? 700 : 500,
                transform: active ? "scale(1.04)" : "scale(1)",
              }}
            >
              {pill.label}
            </button>
          );
        })}
      </div>

      {/* ════════════════════════════════════════
          HERO DISCOVERY CARDS
      ════════════════════════════════════════ */}
      <div style={{ marginBottom:28 }}>
        <SectionHeader title="Inspiration für dich" />
        <div
          className="dp-scroll"
          style={{
            display:"flex", gap:14,
            overflowX:"auto",
            padding:"4px 20px 8px",
          }}
        >
          {(filteredHero.length > 0 ? filteredHero : heroItems).map((item, i) => (
            <HeroCard
              key={item.id}
              item={item}
              idx={i}
              onPress={handleView}
              liked={likedHero.has(item.id)}
              onLike={toggleLikeHero}
            />
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════
          BELIEBTE WERKE
      ════════════════════════════════════════ */}
      <div style={{ marginBottom:28 }}>
        <SectionHeader
          title="Beliebte Werke"
          onAll={() => onView?.({ type:"werke_liste" })}
        />
        <div
          className="dp-scroll"
          style={{
            display:"flex", gap:12,
            overflowX:"auto",
            padding:"4px 20px 8px",
          }}
        >
          {loading
            ? [1,2,3,4].map(k => <Skeleton key={k} w={150} h={200} r={18} />)
            : (filteredWerke.length > 0 ? filteredWerke : works).map((werk, i) => (
              <WerkCard
                key={werk.id}
                item={werk}
                idx={i}
                onPress={handleView}
                liked={likedWerke.has(werk.id)}
                onLike={toggleLikeWerk}
              />
            ))
          }
        </div>
      </div>

      {/* ════════════════════════════════════════
          ERLEBNISSE ENTDECKEN
      ════════════════════════════════════════ */}
      <div style={{ marginBottom:28 }}>
        <SectionHeader
          title="Erlebnisse entdecken"
          onAll={() => onView?.({ type:"erlebnisse_liste" })}
        />
        {/* 2-spaltig Grid */}
        <div style={{ padding:"4px 20px 8px" }}>
          <div style={{ display:"flex", gap:12, marginBottom:12 }}>
            {(filteredErlebnisse.length > 0 ? filteredErlebnisse : experiences)
              .slice(0,2)
              .map((item, i) => (
                <ErlebnisCard
                  key={item.id}
                  item={item}
                  idx={i}
                  onPress={handleView}
                />
              ))}
          </div>
          {(filteredErlebnisse.length > 2 || experiences.length > 2) && (
            <div style={{ display:"flex", gap:12 }}>
              {(filteredErlebnisse.length > 0 ? filteredErlebnisse : experiences)
                .slice(2,4)
                .map((item, i) => (
                  <ErlebnisCard
                    key={item.id}
                    item={item}
                    idx={i+2}
                    onPress={handleView}
                  />
                ))}
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════
          MAP BUTTON (floating)
      ════════════════════════════════════════ */}
      {onMap && (
        <div style={{ display:"flex", justifyContent:"center", padding:"8px 0 4px" }}>
          <button
            onClick={onMap}
            style={{
              display:"flex", alignItems:"center", gap:8,
              background:`linear-gradient(135deg, ${C.teal} 0%, ${C.teal2} 100%)`,
              color:"#fff", border:"none",
              borderRadius:999,
              padding:"12px 24px",
              fontSize:14, fontWeight:700,
              cursor:"pointer",
              boxShadow:`0 6px 20px rgba(22,215,197,0.35)`,
              letterSpacing:-0.2,
            }}
          >
            <span>🗺</span>
            Auf Karte entdecken
          </button>
        </div>
      )}

    </div>
  );
}
