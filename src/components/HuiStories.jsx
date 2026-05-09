// HuiStories.jsx — HUI Story System
// Cinematic. Ruhig. Menschlich. Kein Instagram.
import React, { useState, useRef, useEffect, useCallback } from "react";

const C = {
  teal:"#16D7C5", teal2:"#11C5B7", tealGlow:"rgba(22,215,197,0.25)",
  coral:"#FF8A6B", coral2:"#FF7B72", coralGlow:"rgba(255,138,107,0.22)",
  gold:"#F5A623", goldPale:"rgba(245,166,35,0.12)",
  green:"#3DB87A",
  warm:"#FFF9F4", cream:"#F9F6F2",
  card:"#FFFFFF", ink:"#1A1A1A", ink2:"#3A3A3A",
  muted:"#888", muted2:"#C0C0C0", border:"rgba(0,0,0,0.06)",
};

const CSS = `
  @keyframes st-up    {from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes st-pop   {0%{transform:scale(0.88);opacity:0}65%{transform:scale(1.03)}100%{transform:scale(1);opacity:1}}
  @keyframes st-fadein{from{opacity:0}to{opacity:1}}
  @keyframes st-prog  {from{transform:scaleX(0)}to{transform:scaleX(1)}}
  @keyframes st-ring  {0%,100%{transform:scale(1);opacity:.7}50%{transform:scale(1.06);opacity:1}}
  @keyframes st-pulse {0%{transform:translate(-50%,-50%) scale(0.8);opacity:0.6}
                       70%{transform:translate(-50%,-50%) scale(1.3);opacity:0}
                       100%{transform:translate(-50%,-50%) scale(1.3);opacity:0}}
  @keyframes st-shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
  .st-scroll::-webkit-scrollbar{display:none}
  .st-scroll{-ms-overflow-style:none;scrollbar-width:none}
  .st-tap{transition:transform .17s cubic-bezier(.34,1.4,.64,1);-webkit-tap-highlight-color:transparent}
  .st-tap:active{transform:scale(.94)}
`;

/* ── Story mock data ───────────────────────────────────────────────── */
const STORIES = [
  {
    id:"s1", type:"process",
    user:"Lea S.", userImg:"https://images.unsplash.com/photo-1494790108755-2616b612b786?w=120&q=80",
    verified:true, isNew:true, tag:"Fotografie",
    tagColor:C.teal,
    slides:[
      {
        img:"https://images.unsplash.com/photo-1452457807411-4979b707c5be?w=800&q=85",
        caption:"Goldstunde heute morgen. Dieses Licht findet mich immer.",
        link:null,
      },
      {
        img:"https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=85",
        caption:"Neue Kamera. Neue Möglichkeiten. Neues Sehen.",
        link:{ type:"werk", label:"Portrait-Shooting buchen" },
      },
    ],
  },
  {
    id:"s2", type:"werk",
    user:"David W.", userImg:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&q=80",
    verified:false, isNew:true, tag:"Keramik",
    tagColor:C.coral,
    slides:[
      {
        img:"https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=85",
        caption:"Frisch aus dem Brennofen. Jede Vase ein eigenes Wesen.",
        link:{ type:"werk", label:"Vase ansehen" },
      },
      {
        img:"https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&q=85",
        caption:"Der Ton erinnert sich an deine Hände.",
        link:null,
      },
    ],
  },
  {
    id:"s3", type:"impact",
    user:"HUI Impact", userImg:"https://images.unsplash.com/photo-1459183885421-5cc683b8dbba?w=120&q=80",
    verified:true, isNew:true, tag:"Impact",
    tagColor:C.green,
    slides:[
      {
        img:"https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&q=85",
        caption:"€ 1.240 gesammelt. Der Bildungsfonds in Kolumbien wächst.",
        link:{ type:"impact", label:"Projekt entdecken" },
      },
    ],
  },
  {
    id:"s4", type:"process",
    user:"Lena M.", userImg:"https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&q=80",
    verified:true, isNew:false, tag:"Malerei",
    tagColor:C.gold,
    slides:[
      {
        img:"https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&q=85",
        caption:"Drei Wochen daran gearbeitet. Heute fertig.",
        link:{ type:"werk", label:"Aquarell kaufen" },
      },
    ],
  },
  {
    id:"s5", type:"experience",
    user:"Jonas K.", userImg:"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&q=80",
    verified:false, isNew:false, tag:"Yoga",
    tagColor:C.teal,
    slides:[
      {
        img:"https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=85",
        caption:"Sonnenaufgang-Session morgen. Noch 2 Plätze frei.",
        link:{ type:"book", label:"Platz reservieren" },
      },
    ],
  },
  {
    id:"s6", type:"behind",
    user:"Sara L.", userImg:"https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&q=80",
    verified:true, isNew:false, tag:"Handwerk",
    tagColor:C.coral,
    slides:[
      {
        img:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=85",
        caption:"Neues Atelier. Endlich Platz für große Projekte.",
        link:null,
      },
      {
        img:"https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=800&q=85",
        caption:"Hier passiert das Nächste.",
        link:{ type:"profile", label:"Profil besuchen" },
      },
    ],
  },
];

/* ── Type colors ── */
const TYPE_META = {
  process:  { label:"Prozess",   glow:"rgba(22,215,197,0.3)"  },
  werk:     { label:"Werk",      glow:"rgba(245,166,35,0.3)"  },
  impact:   { label:"Impact",    glow:"rgba(61,184,122,0.3)"  },
  experience:{ label:"Erlebnis", glow:"rgba(22,215,197,0.25)" },
  behind:   { label:"Atelier",   glow:"rgba(255,138,107,0.3)" },
};

/* ══════════════════════════════════════════════════════
   STORY VIEWER — fullscreen cinematic
══════════════════════════════════════════════════════ */
function StoryViewer({ story, allStories, storyIndex, onClose, onNext, onPrev, onOpenLink }) {
  const [slideIdx, setSlideIdx]   = useState(0);
  const [paused,   setPaused]     = useState(false);
  const [saved,    setSaved]      = useState(false);
  const [imgLoaded,setImgLoaded]  = useState(false);
  const timerRef = useRef(null);
  const DURATION = 5000;

  const slide = story.slides[slideIdx];
  const totalSlides = story.slides.length;

  const goNext = useCallback(() => {
    if (slideIdx < totalSlides - 1) {
      setSlideIdx(i => i + 1);
      setImgLoaded(false);
    } else {
      onNext();
    }
  }, [slideIdx, totalSlides, onNext]);

  const goPrev = useCallback(() => {
    if (slideIdx > 0) {
      setSlideIdx(i => i - 1);
      setImgLoaded(false);
    } else {
      onPrev();
    }
  }, [slideIdx, onPrev]);

  useEffect(() => {
    if (paused) { clearTimeout(timerRef.current); return; }
    timerRef.current = setTimeout(goNext, DURATION);
    return () => clearTimeout(timerRef.current);
  }, [slideIdx, paused, goNext]);

  // Touch handling
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const handleTouchStart = e => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setPaused(true);
  };
  const handleTouchEnd = e => {
    setPaused(false);
    if (!touchStartX.current) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
    if (dy > 40) return; // vertical swipe = ignore
    if (Math.abs(dx) < 10) {
      // tap: left half = prev, right half = next
      const tapX = e.changedTouches[0].clientX;
      if (tapX < window.innerWidth * 0.35) goPrev();
      else goNext();
    }
    touchStartX.current = null;
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:600,
      background:"#000",
      animation:"st-fadein 0.3s both" }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}>

      {/* BG image */}
      <img
        src={slide.img} alt=""
        onLoad={() => setImgLoaded(true)}
        style={{ position:"absolute", inset:0, width:"100%", height:"100%",
          objectFit:"cover", objectPosition:"center",
          filter:"brightness(0.78) saturate(1.15)",
          transition:"opacity 0.4s",
          opacity: imgLoaded ? 1 : 0 }}/>

      {/* Cinematic gradient overlay */}
      <div style={{ position:"absolute", inset:0,
        background:"linear-gradient(to bottom,rgba(0,0,0,0.45) 0%,transparent 30%,transparent 55%,rgba(0,0,0,0.72) 100%)" }}/>

      {/* ── Progress bars ── */}
      <div style={{ position:"absolute",
        top:"max(16px,env(safe-area-inset-top,16px))",
        left:16, right:16,
        display:"flex", gap:3, zIndex:10 }}>
        {story.slides.map((_, i) => (
          <div key={i} style={{ flex:1, height:2.5,
            background:"rgba(255,255,255,0.25)", borderRadius:999,
            overflow:"hidden" }}>
            <div style={{
              height:"100%", borderRadius:999,
              background:"white",
              transformOrigin:"left",
              transform: i < slideIdx ? "scaleX(1)"
                : i === slideIdx ? undefined : "scaleX(0)",
              animation: i === slideIdx && !paused
                ? `st-prog ${DURATION}ms linear forwards` : undefined,
            }}/>
          </div>
        ))}
      </div>

      {/* ── Top bar ── */}
      <div style={{ position:"absolute",
        top:"max(32px,calc(env(safe-area-inset-top,16px) + 16px))",
        left:16, right:16,
        display:"flex", alignItems:"center",
        gap:10, zIndex:10 }}>

        {/* Avatar */}
        <div style={{ position:"relative" }}>
          <img src={story.userImg} alt={story.user}
            style={{ width:38, height:38, borderRadius:13,
              objectFit:"cover",
              border:"1.5px solid rgba(255,255,255,0.5)" }}/>
          {story.verified && (
            <div style={{ position:"absolute", bottom:-3, right:-3,
              width:14, height:14, borderRadius:"50%",
              background:C.teal,
              border:"2px solid rgba(0,0,0,0.7)",
              display:"flex", alignItems:"center",
              justifyContent:"center", fontSize:7, color:"white",
              fontWeight:900 }}>✓</div>
          )}
        </div>

        {/* Name + tag */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:800, fontSize:13.5, color:"white",
            lineHeight:1.2 }}>{story.user}</div>
          <div style={{ fontSize:10.5, color:"rgba(255,255,255,0.65)",
            marginTop:1 }}>
            {story.tag} · {TYPE_META[story.type]?.label || story.type}
          </div>
        </div>

        {/* Save */}
        <button
          onClick={e => { e.stopPropagation(); setSaved(s => !s); }}
          style={{ background:"rgba(255,255,255,0.12)",
            backdropFilter:"blur(8px)",
            border:"1px solid rgba(255,255,255,0.2)",
            borderRadius:11, padding:"7px 12px",
            cursor:"pointer", fontFamily:"inherit",
            fontSize:11, fontWeight:700,
            color: saved ? C.teal : "rgba(255,255,255,0.85)",
            transition:"all 0.2s",
            display:"flex", alignItems:"center", gap:5 }}>
          <span>{saved ? "♥" : "♡"}</span>
          <span>{saved ? "Gespeichert" : "Speichern"}</span>
        </button>

        {/* Close */}
        <button
          onClick={onClose}
          style={{ width:34, height:34, borderRadius:11,
            background:"rgba(255,255,255,0.12)",
            backdropFilter:"blur(8px)",
            border:"1px solid rgba(255,255,255,0.18)",
            cursor:"pointer", fontSize:15, color:"white",
            display:"flex", alignItems:"center",
            justifyContent:"center" }}>×</button>
      </div>

      {/* ── Caption + Link ── */}
      <div style={{ position:"absolute", bottom:0, left:0, right:0,
        padding:"0 22px max(32px,env(safe-area-inset-bottom,32px))",
        zIndex:10 }}>

        {/* Caption */}
        {slide.caption && (
          <div style={{ fontWeight:500, fontSize:16, color:"white",
            lineHeight:1.65, marginBottom:16,
            textShadow:"0 1px 8px rgba(0,0,0,0.5)",
            maxWidth:340 }}>
            „{slide.caption}"
          </div>
        )}

        {/* Link CTA */}
        {slide.link && (
          <button
            onClick={e => { e.stopPropagation(); onOpenLink && onOpenLink(slide.link); }}
            style={{ display:"flex", alignItems:"center", gap:10,
              background:"rgba(255,255,255,0.14)",
              backdropFilter:"blur(16px)",
              border:"1px solid rgba(255,255,255,0.28)",
              borderRadius:18, padding:"13px 18px",
              width:"100%", cursor:"pointer",
              fontFamily:"inherit", marginBottom:10,
              transition:"all 0.2s" }}>
            <div style={{ width:34, height:34, borderRadius:11,
              background:`linear-gradient(135deg,${C.teal},${C.coral})`,
              display:"flex", alignItems:"center",
              justifyContent:"center", flexShrink:0,
              fontSize:15 }}>
              {slide.link.type === "werk"    ? "🎨" :
               slide.link.type === "book"    ? "✨" :
               slide.link.type === "impact"  ? "🌱" : "→"}
            </div>
            <div style={{ flex:1, textAlign:"left" }}>
              <div style={{ fontWeight:800, fontSize:13, color:"white" }}>
                {slide.link.label}
              </div>
              <div style={{ fontSize:10.5,
                color:"rgba(255,255,255,0.6)", marginTop:1 }}>
                Direkt auf HUI
              </div>
            </div>
            <span style={{ color:"rgba(255,255,255,0.5)", fontSize:16 }}>›</span>
          </button>
        )}

        {/* Story nav hint dots */}
        {totalSlides > 1 && (
          <div style={{ display:"flex", justifyContent:"center", gap:5, marginTop:4 }}>
            {story.slides.map((_, i) => (
              <div key={i} style={{ width: i===slideIdx ? 16 : 5,
                height:5, borderRadius:999,
                background: i===slideIdx ? "white" : "rgba(255,255,255,0.35)",
                transition:"all 0.25s cubic-bezier(0.34,1.4,0.64,1)" }}/>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   STORY BUBBLE — the ring thumbnail in the strip
══════════════════════════════════════════════════════ */
function StoryBubble({ story, onOpen, idx }) {
  const meta = TYPE_META[story.type] || {};
  const ringColor = story.tagColor || C.teal;
  const isImpact = story.type === "impact";

  return (
    <button
      onClick={() => onOpen(idx)}
      className="st-tap"
      style={{ display:"flex", flexDirection:"column",
        alignItems:"center", gap:8, background:"none",
        border:"none", cursor:"pointer", padding:"4px 2px",
        fontFamily:"inherit", flexShrink:0, width:70,
        animation:`st-up 0.35s ${idx * 0.06}s both` }}>

      {/* Ring + avatar */}
      <div style={{ position:"relative", width:62, height:62 }}>

        {/* Outer glow ring — animated for new */}
        {story.isNew && (
          <div style={{ position:"absolute", inset:-3,
            borderRadius:22,
            background:`linear-gradient(135deg,${ringColor},${ringColor}88,${C.coral})`,
            padding:2.5, zIndex:0 }}>
            <div style={{ width:"100%", height:"100%",
              borderRadius:19, background:C.warm }}/>
          </div>
        )}

        {/* Static ring for viewed */}
        {!story.isNew && (
          <div style={{ position:"absolute", inset:-3,
            borderRadius:22,
            border:`2px solid ${C.muted2}`,
            zIndex:0 }}/>
        )}

        {/* Avatar image */}
        <div style={{ position:"relative", zIndex:1,
          width:62, height:62, borderRadius:20,
          overflow:"hidden",
          border:`2.5px solid ${C.warm}` }}>
          <img src={story.userImg} alt={story.user}
            style={{ width:"100%", height:"100%",
              objectFit:"cover", objectPosition:"top" }}/>

          {/* Type tag micro-badge */}
          <div style={{ position:"absolute", bottom:4, left:0, right:0,
            display:"flex", justifyContent:"center" }}>
            <div style={{ background:"rgba(0,0,0,0.62)",
              backdropFilter:"blur(6px)",
              borderRadius:999, padding:"2px 7px",
              fontSize:7.5, fontWeight:800,
              color: story.tagColor || "white",
              letterSpacing:0.3 }}>
              {story.tag.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Verified dot */}
        {story.verified && (
          <div style={{ position:"absolute", top:-3, right:-3, zIndex:2,
            width:16, height:16, borderRadius:"50%",
            background:C.teal,
            border:`2px solid ${C.warm}`,
            display:"flex", alignItems:"center",
            justifyContent:"center", fontSize:7.5,
            color:"white", fontWeight:900 }}>✓</div>
        )}

        {/* Impact pulse ring */}
        {isImpact && story.isNew && (
          <div style={{ position:"absolute", top:"50%", left:"50%",
            width:68, height:68, borderRadius:22,
            border:`2px solid ${C.green}`,
            animation:"st-pulse 2s ease-out infinite",
            pointerEvents:"none", zIndex:-1 }}/>
        )}
      </div>

      {/* Name */}
      <div style={{ fontSize:10.5, fontWeight: story.isNew ? 700 : 500,
        color: story.isNew ? C.ink : C.muted,
        textAlign:"center", lineHeight:1.2,
        maxWidth:64, overflow:"hidden",
        textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
        {story.user.split(" ")[0]}
      </div>
    </button>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN EXPORT — StoryStrip
══════════════════════════════════════════════════════ */
export default function HuiStories({ onOpenProfile, onOpenWerk, onOpenImpact }) {
  const [activeStory, setActiveStory] = useState(null); // index
  const [viewed,      setViewed]      = useState(new Set());

  const stories = STORIES.map((s, i) => ({
    ...s,
    isNew: !viewed.has(s.id),
  }));

  const openStory = (idx) => {
    setActiveStory(idx);
    setViewed(v => new Set([...v, STORIES[idx].id]));
  };

  const goNext = () => {
    if (activeStory < stories.length - 1) {
      const next = activeStory + 1;
      setActiveStory(next);
      setViewed(v => new Set([...v, STORIES[next].id]));
    } else {
      setActiveStory(null);
    }
  };

  const goPrev = () => {
    if (activeStory > 0) {
      setActiveStory(activeStory - 1);
    }
  };

  const handleLink = (link) => {
    setActiveStory(null);
    if (link.type === "profile")  onOpenProfile?.();
    if (link.type === "werk")     onOpenWerk?.();
    if (link.type === "impact")   onOpenImpact?.();
    if (link.type === "book")     onOpenProfile?.();
  };

  return (
    <>
      <style>{CSS}</style>

      {/* ── Story strip ── */}
      <div style={{ marginBottom:6 }}>
        {/* Section label */}
        <div style={{ padding:"18px 20px 10px",
          display:"flex", alignItems:"center",
          justifyContent:"space-between" }}>
          <div>
            <div style={{ fontWeight:800, fontSize:14, color:"#1A1A1A",
              letterSpacing:-0.2 }}>Momente</div>
            <div style={{ fontSize:11, color:"#888", marginTop:1 }}>
              Einblicke aus kreativen Leben
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:5,
            fontSize:10.5, color:"#16D7C5", fontWeight:700 }}>
            <div style={{ width:6, height:6, borderRadius:"50%",
              background:"#16D7C5",
              boxShadow:"0 0 5px rgba(22,215,197,0.6)" }}/>
            Live
          </div>
        </div>

        {/* Horizontal scroll strip */}
        <div className="st-scroll"
          style={{ display:"flex", gap:10, overflowX:"auto",
            padding:"0 20px 14px",
            WebkitOverflowScrolling:"touch" }}>
          {stories.map((story, i) => (
            <StoryBubble
              key={story.id}
              story={story}
              idx={i}
              onOpen={openStory}
            />
          ))}
        </div>
      </div>

      {/* ── Fullscreen viewer ── */}
      {activeStory !== null && (
        <StoryViewer
          story={stories[activeStory]}
          allStories={stories}
          storyIndex={activeStory}
          onClose={() => setActiveStory(null)}
          onNext={goNext}
          onPrev={goPrev}
          onOpenLink={handleLink}
        />
      )}
    </>
  );
}
