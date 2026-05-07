import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import mockWirkerProfiles from "../lib/mockData";
import ImpactPage        from "./ImpactPage";
import ProfilePage       from "./ProfilePage";
import WirkerProfilePage from "../components/WirkerProfilePage";
import BookingFlow       from "../components/BookingFlow";
import CreateFlow        from "../components/CreateFlow";

/* ── Brand Colors ─────────────────────────────── */
const C = {
  teal:       "#16D3C5",
  tealBright: "#1AE8D8",
  tealPale:   "#E4F9F7",
  tealUltra:  "#F0FDFB",
  mint:       "#8EF7D7",
  mintPale:   "#EEFBF5",
  coral:      "#FF8A6B",
  coralBright:"#FF7055",
  coralPale:  "#FFF3EE",
  coralUltra: "#FFF8F5",
  peach:      "#FFC49D",
  bg:         "#FFFDF8",
  bg2:        "#FAF8F2",
  card:       "#FFFFFF",
  cardWarm:   "#FFFEF9",
  ink:        "#111111",
  ink2:       "#2D2D2D",
  ink3:       "#444444",
  muted:      "#777777",
  muted2:     "#AAAAAA",
  border:     "#ECECEC",
  borderWarm: "#EDE9E0",
  gold:       "#FFB800",
  goldPale:   "#FFF8E0",
  green:      "#1EC77A",
};

/* ── Mock Data ────────────────────────────────── */
const WIRKERS = Object.values(mockWirkerProfiles);

const FEATURED = [
  { name:"Sofia M.", talent:"Keramik-Künstlerin",
    img:"https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&q=85",
    bg:"https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&q=80",
    dist:"1,2 km", price:"ab 45 €", score:4.9, rec:34,
    badge:"Top Talent", badgeStyle:"teal" },
  { name:"Marcus B.", talent:"Fotograf & Videograf",
    img:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=85",
    bg:"https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=600&q=80",
    dist:"0,8 km", price:"ab 90 €", score:4.8, rec:47,
    badge:"Beliebt", badgeStyle:"coral" },
  { name:"Maria L.", talent:"Yoga & Achtsamkeit",
    img:"https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=85",
    bg:"https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&q=80",
    dist:"1,2 km", price:"ab 70 €", score:4.9, rec:93,
    badge:"Top Talent", badgeStyle:"teal" },
  { name:"Lena K.", talent:"Aquarell-Künstlerin",
    img:"https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=85",
    bg:"https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&q=80",
    dist:"3,4 km", price:"ab 60 €", score:4.7, rec:28,
    badge:"Neu", badgeStyle:"new" },
  { name:"Tom H.", talent:"Leder-Handwerker",
    img:"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=85",
    bg:"https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80",
    dist:"2,1 km", price:"ab 55 €", score:4.6, rec:19,
    badge:"Handwerk", badgeStyle:"gold" },
];

const WORKS = [
  { title:"Handgemachte Keramik-Tasse", price:"38 €", likes:124, saved:52,
    img:"https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=700&q=85",
    creator:"Sofia M.", creatorImg:"https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&q=80",
    h:280 },
  { title:"Leder-Rucksack, handgenäht", price:"195 €", likes:89, saved:31,
    img:"https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=700&q=85",
    creator:"Tom H.", creatorImg:"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&q=80",
    h:340 },
  { title:"Aquarell-Druck (A3)", price:"55 €", likes:67, saved:24,
    img:"https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=700&q=85",
    creator:"Lena K.", creatorImg:"https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&q=80",
    h:260 },
  { title:"Keramik-Workshop (2h)", price:"75 €", likes:112, saved:48,
    img:"https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=700&q=85",
    creator:"Sofia M.", creatorImg:"https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&q=80",
    h:300 },
];

const MATCH_CHIPS = [
  "Gartenhilfe","Fotograf für Hochzeit","Yoga in Berlin",
  "Handgemachte Kunst","Musiker für Event","Keramik-Kurs",
];

const NAV_ITEMS = [
  { key:"feed",     icon:"🏠", label:"Home"     },
  { key:"impact",   icon:"🌱", label:"Impact"   },
  { key:"discover", icon:"🔍", label:"Entdecken" },
  { key:"favorites",icon:"♡",  label:"Favoriten" },
  { key:"profile",  icon:"👤", label:"Profil"   },
];

/* ── Helpers ──────────────────────────────────── */
function Avatar({ src, name, size=36 }) {
  const init = (name||"").split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase();
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", overflow:"hidden",
      background:`linear-gradient(135deg, ${C.tealPale}, ${C.coralPale})`,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:size*0.38, fontWeight:800, color:C.teal, flexShrink:0 }}>
      {src
        ? <img src={src} alt={name}
            style={{ width:"100%", height:"100%", objectFit:"cover" }}
            onError={e => e.target.style.display="none"} />
        : init}
    </div>
  );
}

function LikeBtn({ count=0 }) {
  const [liked,setLiked]=useState(false);
  const [n,setN]=useState(count);
  const [anim,setAnim]=useState(false);
  function tap(e) {
    e.stopPropagation();
    setAnim(true); setTimeout(()=>setAnim(false),440);
    setLiked(p=>{ setN(c=>p?c-1:c+1); return !p; });
  }
  return (
    <button onClick={tap} style={{ background:"none", border:"none",
      cursor:"pointer", display:"flex", alignItems:"center", gap:4, padding:0,
      WebkitTapHighlightColor:"transparent" }}>
      <span className={anim?"hui-heart":""} style={{ fontSize:18, lineHeight:1,
        filter:liked?"none":"grayscale(1) opacity(0.5)" }}>
        {liked?"❤️":"🤍"}
      </span>
      <span style={{ fontSize:12, fontWeight:700,
        color:liked?C.coral:C.muted }}>{n}</span>
    </button>
  );
}

function StarRow({ score }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:3 }}>
      <span style={{ color:C.gold, fontSize:12 }}>★</span>
      <span style={{ fontSize:12, fontWeight:700, color:C.ink2 }}>{score}</span>
    </div>
  );
}

function SectionHeader({ icon, title, sub, onAll }) {
  return (
    <div style={{ padding:"22px 20px 12px",
      display:"flex", alignItems:"flex-end",
      justifyContent:"space-between" }}>
      <div>
        <div style={{ fontSize:18, fontWeight:800, color:C.ink,
          letterSpacing:-0.5, display:"flex", alignItems:"center", gap:7 }}>
          <span>{icon}</span> {title}
        </div>
        {sub && <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>{sub}</div>}
      </div>
      {onAll && (
        <button onClick={onAll} style={{ background:"none", border:"none",
          cursor:"pointer", fontSize:13, fontWeight:600, color:C.teal,
          WebkitTapHighlightColor:"transparent" }}>
          Alle anzeigen →
        </button>
      )}
    </div>
  );
}

/* ── Stories ──────────────────────────────────── */
function StoriesBar({ onView }) {
  const stories = [
    { name:"Deine Story", img:null, isMine:true },
    ...FEATURED.slice(0,5).map((w,i)=>({ name:w.name.split(" ")[0], img:w.img, hasStory:i<4 })),
  ];
  return (
    <div className="scrollbar-hide"
      style={{ display:"flex", gap:14, overflowX:"auto", padding:"4px 20px" }}>
      {stories.map((s,i)=>(
        <div key={i} onClick={()=>!s.isMine&&onView&&onView(s.name)}
          style={{ display:"flex", flexDirection:"column",
            alignItems:"center", gap:6, flexShrink:0,
            cursor:s.isMine?"default":"pointer" }}>
          <div style={{
            padding:2.5, borderRadius:"50%",
            background:s.hasStory
              ? `linear-gradient(135deg, ${C.teal}, ${C.coral})`
              : C.border,
          }}>
            <div className={s.hasStory?"hui-story-ring":""}
              style={{ padding:2, borderRadius:"50%", background:C.bg }}>
              <div style={{ width:52, height:52, borderRadius:"50%", overflow:"hidden",
                background:`linear-gradient(135deg, ${C.tealPale}, ${C.coralPale})`,
                display:"flex", alignItems:"center", justifyContent:"center",
                position:"relative" }}>
                {s.isMine
                  ? <><span style={{ fontSize:24 }}>👤</span>
                      <div style={{ position:"absolute", bottom:0, right:0,
                        width:18, height:18, borderRadius:"50%",
                        background:C.coral, border:`2px solid ${C.bg}`,
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:11, color:"white", fontWeight:900 }}>+</div>
                    </>
                  : <img src={s.img} alt={s.name}
                      style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                }
              </div>
            </div>
          </div>
          <span style={{ fontSize:10, fontWeight:600, color:C.ink2,
            maxWidth:56, textAlign:"center", overflow:"hidden",
            textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.name}</span>
        </div>
      ))}
    </div>
  );
}

/* ── HERO SEARCH CARD ─────────────────────────── */
function HeroSearchCard({ onMatchOpen, onMapOpen }) {
  const [val,setVal]=useState("");
  return (
    <div style={{ margin:"16px 18px",
      background:`linear-gradient(160deg, ${C.tealUltra} 0%, ${C.coralUltra} 100%)`,
      borderRadius:28, padding:"20px 20px 18px",
      boxShadow:`0 4px 8px rgba(0,0,0,0.03), 0 16px 40px rgba(22,211,197,0.12), 0 16px 40px rgba(255,138,107,0.07)`,
      border:`1px solid rgba(22,211,197,0.14)` }}>

      {/* Heading */}
      <div style={{ fontWeight:800, fontSize:19, color:C.ink,
        letterSpacing:-0.5, marginBottom:4 }}>
        Wen oder was suchst du?
      </div>
      <div style={{ fontSize:13, color:C.muted, marginBottom:14 }}>
        Echte Talente · Handgemachtes · Erlebnisse
      </div>

      {/* Search input */}
      <div style={{ position:"relative", marginBottom:12 }}>
        <span style={{ position:"absolute", left:16, top:"50%",
          transform:"translateY(-50%)", fontSize:17,
          color:val?C.teal:C.muted2, transition:"color 0.2s",
          pointerEvents:"none" }}>🔍</span>
        <input className="hui-search"
          placeholder="Wen oder was suchst du heute?"
          value={val}
          onChange={e=>setVal(e.target.value)}
          style={{ borderRadius:18 }}
        />
        {val && (
          <button onClick={()=>setVal("")}
            style={{ position:"absolute", right:16, top:"50%",
              transform:"translateY(-50%)",
              background:`${C.muted}22`, border:"none",
              borderRadius:"50%", width:22, height:22,
              cursor:"pointer", fontSize:11, color:C.muted,
              display:"flex", alignItems:"center", justifyContent:"center",
              WebkitTapHighlightColor:"transparent" }}>✕</button>
        )}
      </div>

      {/* Two action buttons */}
      <div style={{ display:"flex", gap:10 }}>
        <button onClick={onMatchOpen} className="hui-btn hui-btn-teal"
          style={{ flex:1, padding:"13px 12px", fontSize:14,
            borderRadius:16 }}>
          ✨ HUI Match
        </button>
        <button onClick={onMapOpen} className="hui-btn hui-btn-coral"
          style={{ flex:1, padding:"13px 12px", fontSize:14,
            borderRadius:16 }}>
          🌍 In der Nähe
        </button>
      </div>
    </div>
  );
}

/* ── HUI MATCH CHIPS ──────────────────────────── */
function MatchChips({ onOpen }) {
  return (
    <div style={{ padding:"0 18px 4px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8,
        marginBottom:10 }}>
        <div style={{ fontWeight:800, fontSize:14, color:C.ink }}>✨ HUI Match</div>
        <span className="hui-badge hui-badge-new" style={{ fontSize:10 }}>KI</span>
      </div>
      <div style={{ fontSize:12, color:C.muted, marginBottom:10 }}>
        Beschreibe einfach, wen oder was du suchst.
      </div>
      <div className="scrollbar-hide"
        style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:2 }}>
        {MATCH_CHIPS.map((c,i)=>(
          <button key={i} onClick={()=>onOpen(c)}
            style={{ flexShrink:0, background:C.card,
              border:`1px solid ${C.borderWarm}`,
              borderRadius:999, padding:"7px 14px",
              fontSize:12, fontWeight:600, color:C.ink2,
              cursor:"pointer", whiteSpace:"nowrap",
              boxShadow:"0 1px 6px rgba(0,0,0,0.05)",
              WebkitTapHighlightColor:"transparent",
              transition:"all 0.15s" }}
            onTouchStart={e=>{
              e.currentTarget.style.background=C.tealPale;
              e.currentTarget.style.borderColor=C.teal;
              e.currentTarget.style.color=C.teal;
            }}
            onTouchEnd={e=>{
              e.currentTarget.style.background=C.card;
              e.currentTarget.style.borderColor=C.borderWarm;
              e.currentTarget.style.color=C.ink2;
            }}>
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── HUI MATCH OVERLAY ────────────────────────── */
function MatchOverlay({ initial="", onClose }) {
  const [query,setQuery]=useState(initial);
  const [busy,setBusy]=useState(false);
  const [results,setResults]=useState(null);

  async function run() {
    if(!query.trim()) return;
    setBusy(true);
    await new Promise(r=>setTimeout(r,1800));
    setResults(FEATURED.slice(0,3));
    setBusy(false);
  }

  return (
    <div style={{ position:"fixed", inset:0, zIndex:400,
      background:"rgba(17,17,17,0.52)",
      backdropFilter:"blur(10px)", WebkitBackdropFilter:"blur(10px)",
      display:"flex", alignItems:"flex-end" }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="hui-slide-up"
        style={{ width:"100%", background:C.bg, borderRadius:"32px 32px 0 0",
          maxHeight:"88vh", overflowY:"auto",
          paddingBottom:"max(28px,env(safe-area-inset-bottom))" }}>

        <div style={{ display:"flex", justifyContent:"center", padding:"14px 0 0" }}>
          <div style={{ width:38, height:4, borderRadius:999, background:C.border }} />
        </div>

        <div style={{ padding:"18px 22px 24px" }}>
          {/* Header */}
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
            <div style={{ width:46, height:46, borderRadius:16, flexShrink:0,
              background:`linear-gradient(135deg, ${C.teal}, ${C.coral})`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:22, boxShadow:`0 4px 16px rgba(22,211,197,0.35)` }}>✨</div>
            <div>
              <div style={{ fontWeight:900, fontSize:20, color:C.ink, letterSpacing:-0.5 }}>
                HUI Match
              </div>
              <div style={{ fontSize:12, color:C.muted, marginTop:1 }}>
                Unsere KI findet perfekte Talente für dich
              </div>
            </div>
            <button onClick={onClose}
              style={{ marginLeft:"auto", width:32, height:32, borderRadius:"50%",
                background:C.border, border:"none", cursor:"pointer",
                fontSize:14, display:"flex", alignItems:"center",
                justifyContent:"center", color:C.muted,
                WebkitTapHighlightColor:"transparent" }}>✕</button>
          </div>

          <textarea value={query} onChange={e=>setQuery(e.target.value)}
            placeholder={"Ich suche jemanden für meinen Garten.\n3 Stunden. Budget 300 €.\nKennt sich mit Blumen aus."}
            rows={4}
            style={{ width:"100%", boxSizing:"border-box",
              padding:"16px 18px", fontSize:15, color:C.ink,
              background:C.card, border:`1.5px solid ${C.borderWarm}`,
              borderRadius:20, outline:"none", resize:"none",
              fontFamily:"inherit", lineHeight:1.65,
              boxShadow:"0 2px 12px rgba(0,0,0,0.04)",
              transition:"border-color 0.2s, box-shadow 0.2s",
              marginBottom:12 }}
            onFocus={e=>{
              e.target.style.borderColor=C.teal;
              e.target.style.boxShadow=`0 0 0 4px rgba(22,211,197,0.12)`;
            }}
            onBlur={e=>{
              e.target.style.borderColor=C.borderWarm;
              e.target.style.boxShadow="0 2px 12px rgba(0,0,0,0.04)";
            }}
          />

          <button onClick={run} disabled={!query.trim()||busy}
            className="hui-btn hui-btn-warm"
            style={{ width:"100%", padding:"16px", fontSize:15, borderRadius:18,
              opacity:query.trim()?1:0.5 }}>
            {busy
              ? <><span className="hui-spin">⚙️</span> Analysiere…</>
              : "✨ Passende Talente finden"}
          </button>

          {results && (
            <div style={{ marginTop:24 }}>
              <div style={{ fontWeight:800, fontSize:16, color:C.ink, marginBottom:14 }}>
                Diese Talente passen zu dir
              </div>
              {results.map((w,i)=>(
                <div key={i} className="hui-card hui-rise"
                  style={{ padding:"14px 16px", marginBottom:12,
                    animationDelay:`${i*0.08}s`,
                    display:"flex", gap:12, alignItems:"center",
                    cursor:"pointer" }}>
                  <Avatar src={w.img} name={w.name} size={52} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:800, fontSize:15, color:C.ink }}>{w.name}</div>
                    <div style={{ fontSize:12, color:C.teal, fontWeight:700, marginTop:1 }}>
                      {w.talent}
                    </div>
                    <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>
                      📍 {w.dist} · {w.price}
                    </div>
                  </div>
                  <StarRow score={w.score} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── MAP OVERLAY ──────────────────────────────── */
function MapOverlay({ onClose }) {
  const [radius,setRadius]=useState(20);
  const radii=[20,50,100,"∞"];
  return (
    <div style={{ position:"fixed", inset:0, zIndex:400,
      background:"rgba(17,17,17,0.52)",
      backdropFilter:"blur(10px)", WebkitBackdropFilter:"blur(10px)",
      display:"flex", alignItems:"flex-end" }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="hui-slide-up"
        style={{ width:"100%", background:C.bg, borderRadius:"32px 32px 0 0",
          height:"82vh", display:"flex", flexDirection:"column",
          paddingBottom:"env(safe-area-inset-bottom)" }}>

        <div style={{ display:"flex", justifyContent:"center", padding:"14px 0 0" }}>
          <div style={{ width:38, height:4, borderRadius:999, background:C.border }} />
        </div>

        <div style={{ display:"flex", alignItems:"center",
          padding:"14px 22px 12px", gap:12 }}>
          <div style={{ fontWeight:900, fontSize:20, color:C.ink }}>🌍 In der Nähe</div>
          <button onClick={onClose} style={{ marginLeft:"auto", width:32, height:32,
            borderRadius:"50%", background:C.border, border:"none", cursor:"pointer",
            fontSize:14, display:"flex", alignItems:"center", justifyContent:"center",
            WebkitTapHighlightColor:"transparent" }}>✕</button>
        </div>

        {/* Radius selector */}
        <div style={{ padding:"0 22px 14px", display:"flex", gap:8 }}>
          {radii.map(r=>(
            <button key={r} onClick={()=>setRadius(r)}
              style={{ flex:1, padding:"9px 4px",
                background:radius===r
                  ? `linear-gradient(135deg, ${C.teal}, ${C.tealBright})`
                  : C.card,
                color:radius===r?"white":C.ink2,
                border:`1.5px solid ${radius===r?C.teal:C.borderWarm}`,
                borderRadius:12, fontSize:13, fontWeight:700, cursor:"pointer",
                WebkitTapHighlightColor:"transparent",
                transition:"all 0.2s" }}>
              {typeof r==="number"?`${r} km`:r}
            </button>
          ))}
        </div>

        {/* Map placeholder */}
        <div style={{ flex:1, margin:"0 18px 16px", borderRadius:24, overflow:"hidden",
          position:"relative",
          background:`linear-gradient(135deg, ${C.tealPale} 0%, ${C.mintPale} 50%, ${C.coralUltra} 100%)`,
          boxShadow:"0 4px 20px rgba(0,0,0,0.08)" }}>

          {/* Roads */}
          <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%" }}
            viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 200 Q100 180 200 200 Q300 220 400 200" stroke="white" strokeWidth="3" opacity="0.6"/>
            <path d="M200 0 Q180 100 200 200 Q220 300 200 400" stroke="white" strokeWidth="3" opacity="0.6"/>
            <path d="M50 50 Q150 120 250 180 Q320 230 380 350" stroke="white" strokeWidth="2" opacity="0.4"/>
          </svg>

          {/* Talent pins */}
          {[
            {top:"28%",left:"38%",img:FEATURED[0].img,name:FEATURED[0].name},
            {top:"55%",left:"62%",img:FEATURED[1].img,name:FEATURED[1].name},
            {top:"40%",left:"72%",img:FEATURED[2].img,name:FEATURED[2].name},
            {top:"68%",left:"28%",img:FEATURED[3].img,name:FEATURED[3].name},
          ].map((pin,i)=>(
            <div key={i} style={{ position:"absolute", top:pin.top, left:pin.left,
              transform:"translate(-50%,-50%)" }}>
              <div style={{ width:44, height:44, borderRadius:"50%",
                border:`2.5px solid ${C.teal}`,
                overflow:"hidden",
                boxShadow:`0 0 0 4px rgba(22,211,197,0.20), 0 4px 16px rgba(0,0,0,0.15)`,
                background:C.card }}>
                <img src={pin.img} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
              </div>
              {/* pin dot */}
              <div style={{ width:8, height:8, borderRadius:"50%",
                background:C.teal, margin:"-2px auto 0",
                boxShadow:`0 0 8px ${C.teal}` }} />
            </div>
          ))}

          {/* My location */}
          <div style={{ position:"absolute", top:"52%", left:"48%",
            transform:"translate(-50%,-50%)" }}>
            <div style={{ width:16, height:16, borderRadius:"50%",
              background:C.coral,
              boxShadow:`0 0 0 4px rgba(255,138,107,0.25), 0 0 0 8px rgba(255,138,107,0.10)` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── TALENT CARD — 4:5 Stage ──────────────────── */
function TalentCard({ w, onView, onBook, idx=0 }) {
  const badgeStyle = {
    teal:  { bg:C.tealPale,  color:C.teal  },
    coral: { bg:C.coralPale, color:C.coral },
    gold:  { bg:C.goldPale,  color:"#8A6200" },
    new:   { bg:`linear-gradient(135deg,${C.coral},${C.peach})`, color:"white", grad:true },
  }[w.badgeStyle] || { bg:C.tealPale, color:C.teal };

  return (
    <div style={{ flexShrink:0, width:220, cursor:"pointer",
      borderRadius:24, overflow:"hidden",
      background:C.card,
      boxShadow:"0 2px 8px rgba(0,0,0,0.05), 0 10px 32px rgba(0,0,0,0.09)",
      transition:"transform 0.22s cubic-bezier(0.34,1.2,0.64,1)" }}
      className={`hui-rise-${Math.min(idx+1,5)}`}
      onClick={()=>onView&&onView(w.name)}
      onTouchStart={e=>e.currentTarget.style.transform="scale(0.96)"}
      onTouchEnd={e=>e.currentTarget.style.transform="scale(1)"}>

      {/* Image — 4:5 */}
      <div style={{ position:"relative", paddingTop:"125%", overflow:"hidden",
        background:`linear-gradient(160deg, ${C.tealPale}, ${C.coralPale})` }}>
        <img src={w.bg} alt={w.name}
          style={{ position:"absolute", inset:0, width:"100%", height:"100%",
            objectFit:"cover" }} />
        {/* soft bottom fade */}
        <div style={{ position:"absolute", inset:0,
          background:"linear-gradient(to bottom, transparent 50%, rgba(17,17,17,0.65) 100%)" }} />

        {/* Badge top-left */}
        <div style={{ position:"absolute", top:12, left:12 }}>
          <span style={{
            background:badgeStyle.grad?badgeStyle.bg:badgeStyle.bg,
            color:badgeStyle.color, borderRadius:999,
            padding:"4px 11px", fontSize:10, fontWeight:800,
            boxShadow:"0 2px 8px rgba(0,0,0,0.08)" }}>
            {w.badge}
          </span>
        </div>

        {/* Avatar bottom-left */}
        <div style={{ position:"absolute", bottom:10, left:10,
          display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:34, height:34, borderRadius:"50%",
            overflow:"hidden", border:`2px solid rgba(255,255,255,0.8)`,
            boxShadow:"0 2px 8px rgba(0,0,0,0.15)" }}>
            <img src={w.img} alt={w.name}
              style={{ width:"100%", height:"100%", objectFit:"cover" }} />
          </div>
        </div>
      </div>

      {/* Info */}
      <div style={{ padding:"10px 13px 14px" }}>
        <div style={{ fontWeight:800, fontSize:14, color:C.ink, marginBottom:2 }}>{w.name}</div>
        <div style={{ fontSize:11, color:C.teal, fontWeight:700, marginBottom:6 }}>{w.talent}</div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
          marginBottom:6 }}>
          <div style={{ fontSize:11, color:C.muted }}>📍 {w.dist}</div>
          <StarRow score={w.score} />
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontSize:12, fontWeight:800, color:C.ink2 }}>{w.price}</div>
          <button onClick={e=>{e.stopPropagation();onBook&&onBook(w);}}
            className="hui-btn hui-btn-teal"
            style={{ padding:"7px 13px", fontSize:11, borderRadius:10 }}>
            Buchen
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── WORK CARD — Masonry style ────────────────── */
function WorkCard({ work, idx=0 }) {
  const [saved,setSaved]=useState(false);
  const [added,setAdded]=useState(false);

  function handleCart(e) {
    e.stopPropagation();
    setAdded(true); setTimeout(()=>setAdded(false),2000);
  }

  return (
    <div className="hui-card"
      style={{ overflow:"hidden", cursor:"pointer",
        animation:`hui-rise 0.5s ${idx*0.07}s cubic-bezier(0.34,1.1,0.64,1) both` }}
      onTouchStart={e=>e.currentTarget.style.transform="scale(0.97)"}
      onTouchEnd={e=>e.currentTarget.style.transform="scale(1)"}>

      {/* Image — variable height for masonry feel */}
      <div style={{ height:work.h, overflow:"hidden", position:"relative",
        background:`linear-gradient(135deg, ${C.tealPale}, ${C.coralPale})` }}>
        <img src={work.img} alt={work.title}
          style={{ width:"100%", height:"100%", objectFit:"cover" }} />

        {/* Price badge */}
        <div style={{ position:"absolute", top:12, left:12,
          background:`linear-gradient(135deg, ${C.teal}, ${C.tealBright})`,
          color:"white", borderRadius:999,
          padding:"5px 13px", fontSize:13, fontWeight:900,
          boxShadow:"0 2px 10px rgba(22,211,197,0.35)" }}>
          {work.price}
        </div>

        {/* Save button top-right */}
        <button onClick={e=>{e.stopPropagation();setSaved(p=>!p);}}
          style={{ position:"absolute", top:10, right:10,
            width:36, height:36, borderRadius:"50%",
            background:"rgba(255,255,255,0.88)", backdropFilter:"blur(8px)",
            border:"none", cursor:"pointer", fontSize:17,
            display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow:"0 2px 8px rgba(0,0,0,0.1)",
            WebkitTapHighlightColor:"transparent",
            transition:"transform 0.15s" }}
          onTouchStart={e=>e.currentTarget.style.transform="scale(0.88)"}
          onTouchEnd={e=>e.currentTarget.style.transform="scale(1)"}>
          {saved?"⭐":"☆"}
        </button>

        {/* Bottom overlay */}
        <div style={{ position:"absolute", inset:0,
          background:"linear-gradient(to bottom, transparent 55%, rgba(17,17,17,0.55) 100%)" }} />

        <div style={{ position:"absolute", bottom:10, left:12,
          display:"flex", alignItems:"center", gap:7 }}>
          <Avatar src={work.creatorImg} name={work.creator} size={24} />
          <span style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.9)" }}>
            {work.creator}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding:"11px 13px 13px",
        display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <div style={{ fontWeight:700, fontSize:13, color:C.ink, marginBottom:4 }}>
            {work.title}
          </div>
          <div style={{ display:"flex", gap:12, alignItems:"center" }}>
            <LikeBtn count={work.likes} />
            <div style={{ display:"flex", alignItems:"center", gap:4 }}>
              <span style={{ fontSize:16, filter:"grayscale(1) opacity(0.5)" }}>☆</span>
              <span style={{ fontSize:12, fontWeight:600, color:C.muted }}>{work.saved}</span>
            </div>
            <button style={{ background:"none", border:"none", cursor:"pointer",
              fontSize:15, filter:"grayscale(1) opacity(0.5)",
              WebkitTapHighlightColor:"transparent" }}>↗️</button>
          </div>
        </div>
        <button onClick={handleCart}
          className={`hui-btn ${added?"hui-btn-teal":"hui-btn-coral"}`}
          style={{ width:42, height:42, borderRadius:"50%", fontSize:17, padding:0 }}>
          {added?"✓":"🛒"}
        </button>
      </div>

      {/* Impact hint */}
      <div style={{ padding:"0 13px 12px",
        display:"flex", alignItems:"center", gap:5 }}>
        <span className="hui-breathe" style={{ fontSize:11 }}>🌱</span>
        <span style={{ fontSize:11, color:C.teal, fontWeight:600 }}>
          Impact inklusive
        </span>
      </div>
    </div>
  );
}

/* ── IMPACT TEASER ────────────────────────────── */
function ImpactTeaser({ onImpact }) {
  return (
    <div style={{ margin:"0 18px",
      borderRadius:28, overflow:"hidden",
      boxShadow:"0 4px 8px rgba(0,0,0,0.04), 0 20px 48px rgba(22,211,197,0.15)",
      cursor:"pointer" }}
      onClick={onImpact}>
      <div style={{ position:"relative", height:210, overflow:"hidden" }}>
        <img src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=900&q=80"
          alt="Impact"
          style={{ width:"100%", height:"100%", objectFit:"cover",
            filter:"brightness(0.65) saturate(1.15)" }} />
        <div style={{ position:"absolute", inset:0,
          background:`linear-gradient(160deg, rgba(22,211,197,0.75) 0%, rgba(255,138,107,0.55) 100%)` }} />
        <div style={{ position:"absolute", inset:0,
          display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center" }}>
          <div className="hui-breathe" style={{ fontSize:40, marginBottom:8 }}>🌱</div>
          <div style={{ fontWeight:900, fontSize:42, color:"white",
            letterSpacing:-1.5, textShadow:"0 2px 20px rgba(0,0,0,0.2)", lineHeight:1 }}>
            3.847 €
          </div>
          <div style={{ fontSize:14, color:"rgba(255,255,255,0.88)", marginTop:6, fontWeight:600 }}>
            gemeinsam bewegt · Mai 2026
          </div>
        </div>
      </div>
      <div style={{ background:`linear-gradient(135deg, ${C.tealUltra}, ${C.coralUltra})`,
        padding:"16px 18px",
        display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ fontSize:14, color:C.ink, fontWeight:600, lineHeight:1.55 }}>
          Jeden Monat wählen Wirker welche<br/>Projekte gefördert werden.
        </div>
        <button className="hui-btn hui-btn-teal"
          style={{ padding:"11px 16px", fontSize:13, flexShrink:0, marginLeft:12 }}>
          Impact ansehen
        </button>
      </div>
    </div>
  );
}

/* ── DISCOVER PAGE ────────────────────────────── */
function DiscoverPage({ onView, onMatchOpen, onMapOpen }) {
  const KATEGORIEN = [
    { label:"Handwerk",      icon:"🔨", color:C.teal   },
    { label:"Kunst & Design",icon:"🎨", color:C.coral  },
    { label:"Fotografie",    icon:"📷", color:"#8B5CF6"},
    { label:"Coaching",      icon:"💬", color:C.gold   },
    { label:"Gesundheit",    icon:"🧘", color:C.green  },
    { label:"Musik",         icon:"🎵", color:"#EC4899"},
  ];

  return (
    <div style={{ paddingBottom:100 }}>
      {/* Match Banner */}
      <div style={{ margin:"16px 18px",
        background:`linear-gradient(160deg, ${C.tealUltra}, ${C.coralUltra})`,
        borderRadius:24, padding:"18px",
        border:`1px solid rgba(22,211,197,0.15)`,
        boxShadow:"0 4px 24px rgba(22,211,197,0.10)" }}>
        <div style={{ display:"flex", justifyContent:"space-between",
          alignItems:"flex-start", marginBottom:12 }}>
          <div>
            <div style={{ fontWeight:900, fontSize:18, color:C.ink,
              letterSpacing:-0.5 }}>✨ HUI Match</div>
            <div style={{ fontSize:12, color:C.muted, marginTop:3, lineHeight:1.5 }}>
              Beschreibe was du suchst — <br/>unsere KI findet perfekte Matches.
            </div>
          </div>
          <span className="hui-badge hui-badge-new">Neu</span>
        </div>
        <button onClick={onMatchOpen}
          className="hui-btn hui-btn-teal"
          style={{ width:"100%", padding:"14px", fontSize:14, borderRadius:16 }}>
          ✨ Match starten
        </button>
      </div>

      {/* Karte */}
      <SectionHeader icon="🗺️" title="Karte" />
      <div style={{ margin:"0 18px", borderRadius:24, overflow:"hidden",
        height:170, position:"relative", cursor:"pointer",
        background:`linear-gradient(135deg, ${C.tealPale}, ${C.mintPale})`,
        boxShadow:"0 4px 20px rgba(0,0,0,0.08)" }}
        onClick={onMapOpen}>
        {/* Mini-map preview */}
        <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%" }}
          viewBox="0 0 360 170" fill="none">
          <path d="M0 85 Q90 75 180 85 Q270 95 360 85" stroke="white" strokeWidth="2.5" opacity="0.5"/>
          <path d="M180 0 Q165 45 180 85 Q195 125 180 170" stroke="white" strokeWidth="2.5" opacity="0.5"/>
        </svg>
        {[{t:"25%",l:"35%"},{t:"55%",l:"65%"},{t:"40%",l:"75%"}].map((p,i)=>(
          <div key={i} style={{ position:"absolute", top:p.t, left:p.l,
            transform:"translate(-50%,-50%)",
            width:38, height:38, borderRadius:"50%",
            border:`2px solid ${C.teal}`,
            overflow:"hidden",
            boxShadow:`0 0 0 3px rgba(22,211,197,0.2), 0 3px 12px rgba(0,0,0,0.15)` }}>
            <img src={FEATURED[i].img} alt=""
              style={{ width:"100%", height:"100%", objectFit:"cover" }} />
          </div>
        ))}
        <div style={{ position:"absolute", bottom:14, left:0, right:0,
          display:"flex", justifyContent:"center" }}>
          <span className="hui-btn hui-btn-teal"
            style={{ padding:"10px 22px", fontSize:13, borderRadius:14 }}>
            Karte öffnen
          </span>
        </div>
      </div>

      {/* Kategorien */}
      <SectionHeader icon="🏷️" title="Kategorien" onAll={()=>{}} />
      <div style={{ padding:"0 18px",
        display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
        {KATEGORIEN.map((k,i)=>(
          <button key={i} style={{ borderRadius:20, padding:"16px 10px",
            background:C.card, border:"none", cursor:"pointer",
            boxShadow:"0 2px 10px rgba(0,0,0,0.06)",
            display:"flex", flexDirection:"column",
            alignItems:"center", gap:6,
            WebkitTapHighlightColor:"transparent",
            transition:"transform 0.15s" }}
            onTouchStart={e=>e.currentTarget.style.transform="scale(0.95)"}
            onTouchEnd={e=>e.currentTarget.style.transform="scale(1)"}>
            <div style={{ width:46, height:46, borderRadius:14,
              background:`${k.color}14`,
              display:"flex", alignItems:"center",
              justifyContent:"center", fontSize:22 }}>{k.icon}</div>
            <span style={{ fontSize:11, fontWeight:700, color:C.ink2 }}>{k.label}</span>
          </button>
        ))}
      </div>

      {/* Top Talente */}
      <SectionHeader icon="⭐" title="Top Talente" sub="Diese Woche beliebt" onAll={()=>{}} />
      <div className="hui-card" style={{ margin:"0 18px" }}>
        {FEATURED.slice(0,4).map((w,i)=>(
          <div key={i} onClick={()=>onView&&onView(w.name)}
            style={{ display:"flex", alignItems:"center",
              gap:12, padding:"13px 16px", cursor:"pointer",
              borderBottom:i<3?`1px solid ${C.borderWarm}`:"none",
              transition:"background 0.15s" }}
            onTouchStart={e=>e.currentTarget.style.background=C.bg2}
            onTouchEnd={e=>e.currentTarget.style.background="transparent"}>
            <Avatar src={w.img} name={w.name} size={46} />
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:800, fontSize:15, color:C.ink }}>{w.name}</div>
              <div style={{ fontSize:12, color:C.muted, marginTop:1 }}>{w.talent}</div>
            </div>
            <StarRow score={w.score} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── FAVORITES PAGE ───────────────────────────── */
function FavoritesPage() {
  return (
    <div style={{ padding:"32px 20px", paddingBottom:100, textAlign:"center" }}>
      <div style={{ fontSize:64, marginBottom:16 }}>♡</div>
      <div style={{ fontWeight:900, fontSize:22, color:C.ink, marginBottom:8 }}>
        Deine Favoriten
      </div>
      <div style={{ fontSize:14, color:C.muted, lineHeight:1.7,
        maxWidth:270, margin:"0 auto" }}>
        Speichere Talente und Werke die dich berühren — hier findest du sie wieder.
      </div>
    </div>
  );
}

/* ── HEADER ───────────────────────────────────── */
function Header({ cart, notif, onNotif, onCart }) {
  return (
    <div className="hui-glass" style={{
      position:"sticky", top:0, zIndex:60,
      borderBottom:`1px solid rgba(255,255,255,0.5)`,
      borderTop:"none", borderLeft:"none", borderRight:"none",
    }}>
      <div style={{ height:"env(safe-area-inset-top,0px)" }} />
      <div style={{ display:"flex", alignItems:"center",
        padding:"0 18px", height:58, gap:10 }}>

        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center", gap:9, flex:1 }}>
          <div style={{ width:36, height:36, borderRadius:12, flexShrink:0,
            background:`linear-gradient(135deg, ${C.teal}, ${C.tealBright})`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:19, boxShadow:`0 3px 12px rgba(22,211,197,0.35)` }}>🌱</div>
          <div>
            <div style={{ fontWeight:900, fontSize:21, letterSpacing:-1, lineHeight:1 }}>
              <span style={{ color:C.teal }}>H</span>
              <span style={{ color:C.coral }}>U</span>
              <span style={{ color:C.teal }}>I</span>
            </div>
            <div style={{ fontSize:9, fontWeight:600, color:C.muted,
              lineHeight:1, letterSpacing:0.2 }}>Human United Intelligent</div>
          </div>
        </div>

        {/* Notification */}
        <button onClick={onNotif}
          style={{ position:"relative", width:40, height:40, borderRadius:"50%",
            background:"rgba(255,255,255,0.85)", backdropFilter:"blur(8px)",
            border:`1px solid ${C.borderWarm}`,
            display:"flex", alignItems:"center", justifyContent:"center",
            cursor:"pointer", fontSize:18,
            boxShadow:"0 1px 6px rgba(0,0,0,0.06)",
            WebkitTapHighlightColor:"transparent" }}>
          🔔
          {notif>0 && (
            <div style={{ position:"absolute", top:-3, right:-3,
              width:17, height:17, borderRadius:"50%",
              background:C.coral, color:"white",
              fontSize:9, fontWeight:900,
              display:"flex", alignItems:"center", justifyContent:"center",
              border:`2px solid ${C.bg}` }}>
              {notif>9?"9+":notif}
            </div>
          )}
        </button>

        {/* Cart */}
        <button onClick={onCart}
          style={{ position:"relative", width:40, height:40, borderRadius:"50%",
            background:`linear-gradient(135deg, ${C.coralPale}, ${C.tealPale})`,
            border:`1px solid rgba(255,138,107,0.22)`,
            display:"flex", alignItems:"center", justifyContent:"center",
            cursor:"pointer", fontSize:18,
            boxShadow:`0 2px 8px rgba(255,138,107,0.18)`,
            WebkitTapHighlightColor:"transparent" }}>
          🛒
          {cart>0 && (
            <div style={{ position:"absolute", top:-3, right:-3,
              width:17, height:17, borderRadius:"50%",
              background:C.coral, color:"white",
              fontSize:9, fontWeight:900,
              display:"flex", alignItems:"center", justifyContent:"center",
              border:`2px solid ${C.bg}` }}>{cart}</div>
          )}
        </button>
      </div>
    </div>
  );
}

/* ── FLOATING BOTTOM NAV ──────────────────────── */
function BottomNav({ tab, onTab, isTalent, onCreate }) {
  const left  = NAV_ITEMS.slice(0,2);
  const right = NAV_ITEMS.slice(3,5);

  return (
    <div className="hui-nav">
      <div className="hui-nav-inner">
        {left.map(item=>(
          <NavBtn key={item.key} item={item}
            active={tab===item.key}
            onTap={()=>onTab(item.key)} />
        ))}

        {/* Floating Plus */}
        {isTalent ? (
          <button onClick={onCreate}
            className="hui-float-glow"
            style={{ width:56, height:56, borderRadius:"50%", flexShrink:0,
              background:`linear-gradient(135deg, ${C.teal}, ${C.coral})`,
              border:`3px solid ${C.bg}`,
              display:"flex", alignItems:"center", justifyContent:"center",
              cursor:"pointer", fontSize:28, color:"white", fontWeight:300,
              WebkitTapHighlightColor:"transparent",
              transition:"transform 0.15s" }}
            onTouchStart={e=>{
              e.currentTarget.style.transform="translateY(-14px) scale(0.90)";
              e.currentTarget.style.animation="none";
            }}
            onTouchEnd={e=>{
              e.currentTarget.style.transform="";
              e.currentTarget.style.animation="";
            }}>
            +
          </button>
        ) : (
          <div style={{ width:56, flexShrink:0 }} />
        )}

        {right.map(item=>(
          <NavBtn key={item.key} item={item}
            active={tab===item.key}
            onTap={()=>onTab(item.key)} />
        ))}
      </div>
    </div>
  );
}

function NavBtn({ item, active, onTap }) {
  return (
    <button onClick={onTap}
      style={{ flex:1, display:"flex", flexDirection:"column",
        alignItems:"center", gap:3, background:"none",
        border:"none", cursor:"pointer", padding:"6px 4px",
        position:"relative", minWidth:44,
        WebkitTapHighlightColor:"transparent" }}
      onTouchStart={e=>e.currentTarget.style.transform="scale(0.86)"}
      onTouchEnd={e=>e.currentTarget.style.transform="scale(1)"}>
      {active && (
        <div style={{ position:"absolute", top:0, left:"50%",
          transform:"translateX(-50%)",
          width:18, height:3, borderRadius:999,
          background:`linear-gradient(90deg, ${C.teal}, ${C.coral})` }} />
      )}
      <div style={{ fontSize:active?22:20,
        filter:active?"none":"grayscale(1) opacity(0.42)",
        transform:active?"translateY(-1px)":"none",
        transition:"all 0.2s" }}>
        {item.icon}
      </div>
      <div style={{ fontSize:9, fontWeight:active?800:500,
        color:active?C.teal:C.muted, transition:"color 0.2s" }}>
        {item.label}
      </div>
    </button>
  );
}

/* ── HOME FEED CONTENT ────────────────────────── */
function HomeFeedContent({ onView, onBook, onCart, onImpact, onMatchOpen, onMapOpen }) {
  return (
    <div style={{ paddingBottom:100 }}>

      {/* Stories */}
      <div style={{ padding:"14px 0 12px" }}>
        <StoriesBar onView={onView} />
      </div>

      {/* Hero Search Card */}
      <HeroSearchCard onMatchOpen={onMatchOpen} onMapOpen={onMapOpen} />

      {/* HUI Match Chips */}
      <div style={{ padding:"16px 0 4px" }}>
        <MatchChips onOpen={q=>onMatchOpen(q)} />
      </div>

      {/* ── Section: Talente ── */}
      <SectionHeader icon="✨" title="Für dich" sub="Handverlesen für diesen Moment"
        onAll={()=>{}} />
      <div className="scrollbar-hide"
        style={{ display:"flex", gap:16, overflowX:"auto",
          padding:"0 18px 4px" }}>
        {FEATURED.map((w,i)=>(
          <TalentCard key={i} w={w} idx={i}
            onView={onView} onBook={onBook} />
        ))}
      </div>

      {/* ── Section: Werke — Masonry ── */}
      <SectionHeader icon="🎨" title="Beliebte Werke"
        sub="Handgemacht mit Herz" onAll={()=>{}} />
      <div style={{ padding:"0 18px",
        columnCount:2, columnGap:12 }}>
        {WORKS.map((w,i)=>(
          <div key={i} style={{ breakInside:"avoid", marginBottom:12 }}>
            <WorkCard work={w} idx={i} onCart={onCart} />
          </div>
        ))}
      </div>

      {/* ── Section: Impact ── */}
      <SectionHeader icon="🌱" title="Inspiration"
        sub="Geschichten die bewegen" />
      <ImpactTeaser onImpact={onImpact} />

      <div style={{ height:24 }} />
    </div>
  );
}

/* ── ROOT ─────────────────────────────────────── */
export default function Home() {
  const [tab,           setTab]           = useState("feed");
  const [viewingWirker, setViewingWirker] = useState(null);
  const [showBooking,   setShowBooking]   = useState(null);
  const [showCreate,    setShowCreate]    = useState(false);
  const [showMatch,     setShowMatch]     = useState(false);
  const [matchInitial,  setMatchInitial]  = useState("");
  const [showMap,       setShowMap]       = useState(false);
  const [cart,          setCart]          = useState([]);
  const [notif,         setNotif]         = useState(3);
  const [currentUser,   setCurrentUser]   = useState(null);
  const [isTalent,      setIsTalent]      = useState(false);
  const [following,     setFollowing]     = useState(new Set());

  useEffect(()=>{
    supabase.auth.getSession().then(async({data:{session}})=>{
      if(!session) return;
      setCurrentUser(session.user);
      try {
        const {data} = await supabase.from("profiles")
          .select("talent_type").eq("user_id",session.user.id).single();
        if(data?.talent_type&&data.talent_type!=="entdecker") setIsTalent(true);
      } catch { setIsTalent(true); }
    });
  },[]);

  function openMatch(q="") {
    setMatchInitial(q);
    setShowMatch(true);
  }

  if(showCreate) return <CreateFlow onClose={()=>setShowCreate(false)} />;

  if(viewingWirker) return (
    <div style={{ position:"fixed", inset:0, zIndex:200,
      overflowY:"auto", background:C.bg }}>
      <WirkerProfilePage
        wirkerName={viewingWirker}
        onBack={()=>setViewingWirker(null)}
        onAddToCart={item=>setCart(p=>[...p,item])}
        isOwnProfile={false}
        following={following}
        toggleFollow={name=>setFollowing(p=>{
          const n=new Set(p); n.has(name)?n.delete(name):n.add(name); return n;
        })}
        onGoToChats={()=>{setViewingWirker(null);setTab("chats");}}
      />
    </div>
  );

  if(showBooking) return (
    <div style={{ position:"fixed", inset:0, zIndex:200,
      overflowY:"auto", background:C.bg }}>
      <BookingFlow
        wirker={showBooking}
        onClose={()=>setShowBooking(null)}
        onAddToCart={item=>setCart(p=>[...p,item])}
        onSuccess={()=>{setShowBooking(null);setTab("chats");}}
      />
    </div>
  );

  return (
    <div className="hui-app"
      style={{ height:"100dvh", display:"flex",
        flexDirection:"column", overflow:"hidden" }}>

      <Header cart={cart.length} notif={notif}
        onNotif={()=>setNotif(0)} onCart={()=>{}} />

      <div style={{ flex:1, overflowY:"auto", overflowX:"hidden",
        WebkitOverflowScrolling:"touch" }}
        className="scrollbar-hide">

        {tab==="feed" && (
          <HomeFeedContent
            onView={setViewingWirker}
            onBook={setShowBooking}
            onCart={item=>setCart(p=>[...p,item])}
            onImpact={()=>setTab("impact")}
            onMatchOpen={openMatch}
            onMapOpen={()=>setShowMap(true)}
          />
        )}
        {tab==="impact"    && <ImpactPage currentUser={currentUser} />}
        {tab==="discover"  && (
          <DiscoverPage
            onView={setViewingWirker}
            onMatchOpen={openMatch}
            onMapOpen={()=>setShowMap(true)}
          />
        )}
        {tab==="favorites" && <FavoritesPage />}
        {tab==="profile"   && (
          <ProfilePage
            onTalentAnbieten={()=>setShowCreate(true)}
            onLogout={()=>{supabase.auth.signOut();window.location.href="/login";}}
          />
        )}
      </div>

      <BottomNav tab={tab} onTab={setTab}
        isTalent={isTalent} onCreate={()=>setShowCreate(true)} />

      {showMatch && (
        <MatchOverlay initial={matchInitial} onClose={()=>setShowMatch(false)} />
      )}
      {showMap && <MapOverlay onClose={()=>setShowMap(false)} />}
    </div>
  );
}
