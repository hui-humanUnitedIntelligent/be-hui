import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import mockWirkerProfiles from "../lib/mockData";
import ImpactPage   from "./ImpactPage";
import ProfilePage  from "./ProfilePage";
import WirkerProfilePage from "../components/WirkerProfilePage";
import BookingFlow  from "../components/BookingFlow";
import CreateFlow   from "../components/CreateFlow";
import FavoritesPage from "./FavoritesPage";

/* ── Colors ───────────────────────────────── */
const C = {
  teal: "#16D3C5", teal2: "#11C5B7", tealPale: "#E6FAF8",
  coral: "#FF7043", coral2: "#FF5722", coralPale: "#FFF0EC",
  gold: "#FFB300", goldPale: "#FFF8E1",
  bg: "#FFFFFF", bg2: "#F5F5F5",
  card: "#FFFFFF", ink: "#1A1A1A", ink2: "#333333",
  muted: "#888888", muted2: "#BBBBBB",
  border: "#EEEEEE", border2: "#E0E0E0",
};

/* ── Mock Data ────────────────────────────── */
const WIRKERS_DATA = Object.values(mockWirkerProfiles);

const FEATURED_TALENTS = [
  { name:"Sofia M.", talent:"Keramik-Künstlerin",
    img:"https://images.unsplash.com/photo-1494790108755-2616b612b786?w=300&q=80",
    bg:"https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400&q=80",
    dist:"1,2 km", price:"45 €/h", rec:34, badge:"Trending", score:4.9 },
  { name:"Marcus B.", talent:"Fotograf & Videograf",
    img:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80",
    bg:"https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=400&q=80",
    dist:"0,8 km", price:"90 €/h", rec:47, badge:"Neu", score:4.8 },
  { name:"Maria L.", talent:"Yoga & Achtsamkeit",
    img:"https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&q=80",
    bg:"https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&q=80",
    dist:"1,2 km", price:"70 €/h", rec:93, badge:"Top bewertet", score:4.9 },
  { name:"Lena K.", talent:"Aquarell-Künstlerin",
    img:"https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&q=80",
    bg:"https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&q=80",
    dist:"3,4 km", price:"60 €/h", rec:28, badge:"Beliebt", score:4.7 },
];

const TOP_WORKS = [
  { title:"Keramik-Tasse", price:"38 €", likes:124,
    img:"https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=300&q=80",
    creator:"Sofia M.", creatorImg:"https://images.unsplash.com/photo-1494790108755-2616b612b786?w=60&q=80" },
  { title:"Aquarell-Portrait", price:"120 €", likes:89,
    img:"https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=300&q=80",
    creator:"Lena K.", creatorImg:"https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&q=80" },
  { title:"Leder-Rucksack", price:"195 €", likes:203,
    img:"https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&q=80",
    creator:"Tom H.", creatorImg:"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&q=80" },
  { title:"Makramee-Wandbild", price:"65 €", likes:77,
    img:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&q=80",
    creator:"Mia T.", creatorImg:"https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=60&q=80" },
];

const FEED_POSTS = [
  { type:"text_post",
    author:"Sofia M.", authorImg:"https://images.unsplash.com/photo-1494790108755-2616b612b786?w=60&q=80",
    verified:true, talent:"Keramik-Künstlerin",
    text:"Meine neueste Kreation – jede Tasse ist ein Unikat. 🌿 Handgedreht, handglasiert, mit ganzem Herzen gemacht.",
    likes:142, comments:3,
    action:"Profil ansehen →",
  },
  { type:"werk",
    img:"https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=700&q=85",
    price:"38 €",
    author:"Sofia M.", authorImg:"https://images.unsplash.com/photo-1494790108755-2616b612b786?w=60&q=80",
    location:"München",
    title:"Handgemachte Keramik-Tasse",
    likes:124, comments:2,
  },
  { type:"talent",
    author:"Marcus B.", authorImg:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&q=80",
    verified:true, talent:"Fotograf & Videograf",
    bg:"https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=700&q=85",
    dist:"0,8 km", price:"90 €/h", rec:47, score:4.8,
  },
];

const STORY_NAMES = ["Sofia","Marcus","Lena","Tom","Maria"];
const STORY_IMGS  = [
  "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&q=80",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&q=80",
];

/* ── Avatar ────────────────────────────────── */
function Av({ src, name, size=36, border="" }) {
  return (
    <div style={{ width:size, height:size, borderRadius:"50%",
      overflow:"hidden", flexShrink:0,
      border:border||`2px solid ${C.border}`,
      background:`linear-gradient(135deg, ${C.tealPale}, ${C.coralPale})`,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:size*0.38, fontWeight:800, color:C.teal }}>
      {src
        ? <img src={src} alt={name}
            style={{ width:"100%", height:"100%", objectFit:"cover" }}
            onError={e=>e.target.style.display="none"} />
        : (name||"?")[0]}
    </div>
  );
}

/* ── Like Button ───────────────────────────── */
function LikeBtn({ count=0, white=false }) {
  const [liked,setLiked]=useState(false);
  const [n,setN]=useState(count);
  const [anim,setAnim]=useState(false);
  function tap(e) {
    e.stopPropagation();
    setAnim(true); setTimeout(()=>setAnim(false),420);
    setLiked(p=>{ setN(c=>p?c-1:c+1); return !p; });
  }
  return (
    <button onClick={tap} style={{ background:"none", border:"none",
      cursor:"pointer", display:"flex", alignItems:"center", gap:4, padding:0,
      WebkitTapHighlightColor:"transparent" }}>
      <span className={anim?"hui-heart":""}
        style={{ fontSize:17, lineHeight:1,
          filter:liked?"none":"grayscale(1) opacity(0.5)" }}>
        {liked?"❤️":"🤍"}
      </span>
      <span style={{ fontSize:13, fontWeight:600,
        color:liked?C.coral:white?"rgba(255,255,255,0.85)":C.muted }}>
        {n}
      </span>
    </button>
  );
}

/* ── HEADER ────────────────────────────────── */
function Header({ cart, notif, onNotif, onCart }) {
  return (
    <div style={{ position:"sticky", top:0, zIndex:60,
      background:"rgba(255,255,255,0.97)",
      backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)",
      borderBottom:`1px solid ${C.border}` }}>
      <div style={{ height:"env(safe-area-inset-top,0px)" }} />
      <div style={{ display:"flex", alignItems:"center",
        padding:"0 16px", height:54, gap:10 }}>

        {/* HUI Logo — exakt wie alte App */}
        <div style={{ display:"flex", alignItems:"center", gap:8, flex:1 }}>
          <div style={{ width:34, height:34, borderRadius:10, overflow:"hidden",
            background:`linear-gradient(135deg, ${C.teal}, ${C.teal2})`,
            display:"flex", alignItems:"center", justifyContent:"center",
            flexShrink:0 }}>
            <span style={{ fontWeight:900, fontSize:18, color:"white",
              letterSpacing:-1, fontFamily:"system-ui" }}>Hj</span>
          </div>
          <div style={{ fontWeight:800, fontSize:16, color:C.ink, letterSpacing:-0.3 }}>
            <span style={{ color:C.teal }}>H</span>
            <span style={{ color:C.ink }}>uman </span>
            <span style={{ color:C.coral }}>U</span>
            <span style={{ color:C.ink }}>nited </span>
            <span style={{ color:C.teal }}>I</span>
            <span style={{ color:C.ink }}>ntelligent</span>
          </div>
        </div>

        {/* Cart */}
        <button onClick={onCart}
          style={{ position:"relative", width:38, height:38, borderRadius:"50%",
            background:C.bg2, border:`1px solid ${C.border}`,
            display:"flex", alignItems:"center", justifyContent:"center",
            cursor:"pointer", fontSize:18,
            WebkitTapHighlightColor:"transparent" }}>
          🛒
          {cart>0 && (
            <div style={{ position:"absolute", top:-2, right:-2,
              width:16, height:16, borderRadius:"50%",
              background:C.coral, color:"white",
              fontSize:9, fontWeight:900,
              display:"flex", alignItems:"center", justifyContent:"center",
              border:`2px solid white` }}>{cart}</div>
          )}
        </button>

        {/* Notif */}
        <button onClick={onNotif}
          style={{ position:"relative", width:38, height:38, borderRadius:"50%",
            background:C.bg2, border:`1px solid ${C.border}`,
            display:"flex", alignItems:"center", justifyContent:"center",
            cursor:"pointer", fontSize:18,
            WebkitTapHighlightColor:"transparent" }}>
          🔔
          {notif>0 && (
            <div style={{ position:"absolute", top:-2, right:-2,
              width:16, height:16, borderRadius:"50%",
              background:C.coral, color:"white",
              fontSize:9, fontWeight:900,
              display:"flex", alignItems:"center", justifyContent:"center",
              border:`2px solid white` }}>{notif}</div>
          )}
        </button>
      </div>

      {/* Search row */}
      <div style={{ display:"flex", gap:8, padding:"6px 16px 10px", alignItems:"center" }}>
        <div style={{ flex:1, position:"relative" }}>
          <span style={{ position:"absolute", left:12, top:"50%",
            transform:"translateY(-50%)", fontSize:15, color:C.muted2,
            pointerEvents:"none" }}>🔍</span>
          <input className="hui-search-input"
            placeholder="Suche nach Talent, Werk, Name…" />
        </div>
        {/* Filter */}
        <button style={{ flexShrink:0, padding:"9px 14px",
          background:C.bg2, border:`1px solid ${C.border2}`,
          borderRadius:12, fontSize:13, fontWeight:600,
          color:C.ink2, cursor:"pointer", display:"flex",
          alignItems:"center", gap:5,
          WebkitTapHighlightColor:"transparent" }}>
          ⚙️ Filter
        </button>
        {/* Plus */}
        <button style={{ flexShrink:0, width:38, height:38, borderRadius:12,
          background:C.coral, border:"none",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:22, color:"white", fontWeight:300, cursor:"pointer",
          boxShadow:`0 3px 10px ${C.coral}40`,
          WebkitTapHighlightColor:"transparent" }}>+</button>
        {/* Map */}
        <button style={{ flexShrink:0, width:38, height:38, borderRadius:12,
          background:C.tealPale, border:`1px solid ${C.teal}30`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:18, cursor:"pointer",
          WebkitTapHighlightColor:"transparent" }}>🗺️</button>
      </div>
    </div>
  );
}

/* ── BOTTOM NAV ────────────────────────────── */
const NAV = [
  { key:"feed",      icon:"🏠", label:"Home" },
  { key:"impact",    icon:"🌱", label:"Impact" },
  null, // center HUI button
  { key:"favorites", icon:"☆",  label:"Favoriten" },
  { key:"profile",   icon:"👤", label:"Profil" },
];

function BottomNav({ tab, onTab, isTalent, onCreate }) {
  return (
    <div className="hui-bottom-nav">
      <div style={{ display:"flex", alignItems:"center",
        justifyContent:"space-around", padding:"6px 8px 4px" }}>
        {NAV.map((item,i)=>{
          if(!item) return (
            <button key="center" onClick={onCreate}
              style={{ width:54, height:54, borderRadius:"50%",
                background:`linear-gradient(135deg, ${C.teal}, ${C.teal2})`,
                border:`3px solid white`,
                boxShadow:`0 4px 18px rgba(22,211,197,0.45)`,
                display:"flex", alignItems:"center", justifyContent:"center",
                cursor:"pointer", flexShrink:0,
                transform:"translateY(-12px)",
                WebkitTapHighlightColor:"transparent" }}>
              {/* HUI Icon */}
              <span style={{ fontWeight:900, fontSize:20, color:"white",
                letterSpacing:-1 }}>Hj</span>
            </button>
          );
          const active = tab===item.key;
          return (
            <button key={item.key} onClick={()=>onTab(item.key)}
              style={{ display:"flex", flexDirection:"column",
                alignItems:"center", gap:2, background:"none",
                border:"none", cursor:"pointer", padding:"4px 8px",
                minWidth:50, position:"relative",
                WebkitTapHighlightColor:"transparent" }}
              onTouchStart={e=>e.currentTarget.style.transform="scale(0.88)"}
              onTouchEnd={e=>e.currentTarget.style.transform="scale(1)"}>
              {active && (
                <div style={{ position:"absolute", top:0, left:"50%",
                  transform:"translateX(-50%)",
                  width:3, height:3, borderRadius:"50%",
                  background:C.coral }} />
              )}
              <span style={{ fontSize:20,
                filter:active?"none":"grayscale(1) opacity(0.4)",
                transform:active?"translateY(-1px)":"none",
                transition:"all 0.2s" }}>{item.icon}</span>
              <span style={{ fontSize:9, fontWeight:active?700:500,
                color:active?C.coral:C.muted,
                transition:"color 0.2s" }}>
                {item.key==="feed"?"Home":
                 item.key==="impact"?"Impact":
                 item.key==="favorites"?"Favoriten":"Profil"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── STORY AVATARS ─────────────────────────── */
function StoriesRow({ onView }) {
  return (
    <div className="scrollbar-hide"
      style={{ display:"flex", gap:12, overflowX:"auto",
        padding:"10px 16px 6px" }}>
      {STORY_NAMES.map((name,i)=>(
        <div key={i} onClick={()=>onView(name)}
          style={{ display:"flex", flexDirection:"column",
            alignItems:"center", gap:5, flexShrink:0, cursor:"pointer" }}>
          <div style={{ padding:2, borderRadius:"50%",
            background:`linear-gradient(135deg, ${C.teal}, ${C.coral})` }}>
            <div style={{ padding:2, borderRadius:"50%", background:"white" }}>
              <div style={{ width:46, height:46, borderRadius:"50%",
                overflow:"hidden" }}>
                <img src={STORY_IMGS[i]} alt={name}
                  style={{ width:"100%", height:"100%", objectFit:"cover" }} />
              </div>
            </div>
          </div>
          <span style={{ fontSize:10, fontWeight:600, color:C.ink2 }}>{name}</span>
        </div>
      ))}
    </div>
  );
}

/* ── SECTION HEADER ────────────────────────── */
function SecHead({ icon, title, sub, onAll }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between",
      alignItems:"flex-end", padding:"18px 16px 10px" }}>
      <div>
        <div style={{ fontWeight:800, fontSize:18, color:C.ink, letterSpacing:-0.3 }}>
          {icon} {title}
        </div>
        {sub && <div style={{ fontSize:12, color:C.muted, marginTop:1 }}>{sub}</div>}
      </div>
      {onAll && (
        <button onClick={onAll}
          style={{ background:"none", border:"none", cursor:"pointer",
            fontSize:13, fontWeight:600, color:C.teal,
            WebkitTapHighlightColor:"transparent" }}>
          Alle →
        </button>
      )}
    </div>
  );
}

/* ── TALENT CARD (horizontal scroll) ───────── */
function TalentCard({ w, onView, idx }) {
  const badgeColor = w.badge==="Trending"?C.coral:w.badge==="Neu"?C.teal:
                     w.badge==="Top bewertet"?C.gold:C.teal;
  return (
    <div className="hui-card-tap"
      style={{ flexShrink:0, width:160, borderRadius:16, overflow:"hidden",
        background:C.card, border:`1px solid ${C.border}`,
        boxShadow:"0 2px 12px rgba(0,0,0,0.09)",
        animation:`hui-fade-up 0.4s ${idx*0.06}s both` }}
      onClick={()=>onView&&onView(w.name)}>

      {/* Header image */}
      <div style={{ height:120, overflow:"hidden", position:"relative" }}>
        <img src={w.bg} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
        {/* Badge */}
        <div style={{ position:"absolute", top:8, left:8 }}>
          <span style={{ background:badgeColor, color:"white",
            borderRadius:999, padding:"3px 9px",
            fontSize:10, fontWeight:800 }}>{w.badge}</span>
        </div>
        {/* Avatar bottom */}
        <div style={{ position:"absolute", bottom:-18, left:12 }}>
          <div style={{ width:36, height:36, borderRadius:"50%",
            border:"2.5px solid white", overflow:"hidden",
            boxShadow:"0 2px 8px rgba(0,0,0,0.15)" }}>
            <img src={w.img} alt={w.name}
              style={{ width:"100%", height:"100%", objectFit:"cover" }} />
          </div>
        </div>
      </div>

      {/* Info */}
      <div style={{ padding:"22px 10px 12px" }}>
        <div style={{ fontWeight:800, fontSize:13, color:C.ink, marginBottom:2 }}>{w.name}
          <span style={{ color:C.teal, fontSize:11, marginLeft:4 }}>✓</span>
        </div>
        <div style={{ fontSize:10, color:C.teal, fontWeight:700 }}>{w.talent}</div>
        <div style={{ fontSize:10, color:C.muted, marginTop:4 }}>
          📍 {w.dist} · {w.price}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:4 }}>
          <span style={{ color:C.gold, fontSize:11 }}>★</span>
          <span style={{ fontSize:11, fontWeight:700, color:C.ink2 }}>{w.score}</span>
          <span style={{ fontSize:10, color:C.muted }}>· {w.rec} Empf.</span>
        </div>
      </div>
    </div>
  );
}

/* ── WORK CARD (horizontal scroll) ─────────── */
function WorkCard({ w, idx }) {
  const [added,setAdded]=useState(false);
  return (
    <div className="hui-card-tap"
      style={{ flexShrink:0, width:140, borderRadius:14, overflow:"hidden",
        background:C.card, border:`1px solid ${C.border}`,
        boxShadow:"0 2px 10px rgba(0,0,0,0.08)",
        animation:`hui-fade-up 0.4s ${idx*0.07}s both` }}>
      {/* Image */}
      <div style={{ height:130, overflow:"hidden", position:"relative" }}>
        <img src={w.img} alt={w.title}
          style={{ width:"100%", height:"100%", objectFit:"cover" }} />
        {/* Price */}
        <div style={{ position:"absolute", top:8, left:8,
          background:"rgba(0,0,0,0.75)", color:"white",
          borderRadius:8, padding:"3px 9px",
          fontSize:13, fontWeight:800 }}>{w.price}</div>
      </div>
      <div style={{ padding:"8px 10px 10px" }}>
        <div style={{ fontWeight:700, fontSize:12, color:C.ink,
          marginBottom:4, lineHeight:1.3 }}>{w.title}</div>
        <div style={{ display:"flex", alignItems:"center",
          justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:4 }}>
            <Av src={w.creatorImg} name={w.creator} size={18} border="none" />
            <span style={{ fontSize:10, color:C.teal, fontWeight:700 }}>{w.creator}</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:3 }}>
            <span style={{ fontSize:14, color:C.coral }}>❤</span>
            <span style={{ fontSize:10, color:C.muted, fontWeight:600 }}>{w.likes}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── FEED CARD ─────────────────────────────── */
function FeedCard({ post, onView, onBook, onCart }) {
  const [added,setAdded]=useState(false);

  if(post.type==="text_post") return (
    <div className="hui-card"
      style={{ margin:"0 16px 14px", padding:0, overflow:"hidden" }}>
      {/* Author */}
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px 8px" }}>
        <Av src={post.authorImg} name={post.author} size={38} border="none" />
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:800, fontSize:14, color:C.ink }}>
            {post.author}
            {post.verified && <span style={{ color:C.teal, fontSize:12, marginLeft:4 }}>✓</span>}
          </div>
          <div style={{ fontSize:11, color:C.teal, fontWeight:600 }}>{post.talent}</div>
        </div>
      </div>
      <div style={{ padding:"0 14px 10px", fontSize:14, color:C.ink2, lineHeight:1.6 }}>
        {post.text}
      </div>
      <div style={{ padding:"8px 14px 12px", borderTop:`1px solid ${C.border}`,
        display:"flex", alignItems:"center", gap:16 }}>
        <LikeBtn count={post.likes} />
        <button style={{ background:"none", border:"none", cursor:"pointer",
          display:"flex", alignItems:"center", gap:4, padding:0 }}>
          <span style={{ fontSize:15, color:C.muted }}>💬</span>
          <span style={{ fontSize:13, color:C.muted, fontWeight:600 }}>{post.comments}</span>
        </button>
        <button style={{ background:"none", border:"none", cursor:"pointer",
          fontSize:15, color:C.muted, padding:0 }}>↗️</button>
        <div style={{ flex:1 }} />
        <button onClick={()=>onView&&onView(post.author.split(" ")[0])}
          style={{ background:"none", border:"none", cursor:"pointer",
            fontSize:13, fontWeight:600, color:C.teal }}>
          Profil ansehen →
        </button>
      </div>
    </div>
  );

  if(post.type==="werk") return (
    <div className="hui-card"
      style={{ margin:"0 16px 14px", overflow:"hidden",
        border:`2px solid ${C.gold}` }}>
      {/* Image — full width, NOT cropped */}
      <div style={{ position:"relative" }}>
        <img src={post.img} alt={post.title}
          style={{ width:"100%", display:"block",
            maxHeight:320, objectFit:"cover", objectPosition:"center" }} />
        {/* Price badge */}
        <div style={{ position:"absolute", top:12, left:12,
          background:"rgba(0,0,0,0.78)", color:"white",
          borderRadius:10, padding:"5px 12px",
          fontSize:16, fontWeight:900 }}>{post.price}</div>
        {/* Coral CTA */}
        <button onClick={e=>{e.stopPropagation();setAdded(true);setTimeout(()=>setAdded(false),2000);}}
          style={{ position:"absolute", bottom:12, right:12 }}
          className="hui-btn-coral"
          style2={{ padding:"10px 18px", fontSize:14, borderRadius:20 }}>
          <span style={{ display:"flex", alignItems:"center", gap:6,
            background:`linear-gradient(135deg, ${C.coral}, #FF8A65)`,
            color:"white", borderRadius:20, padding:"10px 16px",
            fontSize:13, fontWeight:800, cursor:"pointer",
            boxShadow:`0 3px 12px ${C.coral}40`,
            WebkitTapHighlightColor:"transparent" }}>
            {added?"✓ Im Korb":"🛒 In den Korb"}
          </span>
        </button>
      </div>
      {/* Info bar */}
      <div style={{ padding:"10px 14px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
          <Av src={post.authorImg} name={post.author} size={24} border="none" />
          <span style={{ fontSize:12, fontWeight:700, color:C.teal }}>{post.author}</span>
          <span style={{ fontSize:11, color:C.muted }}>📍 {post.location}</span>
        </div>
        <div style={{ fontWeight:800, fontSize:15, color:C.ink, marginBottom:8 }}>
          {post.title}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <LikeBtn count={post.likes} />
          <button style={{ background:"none", border:"none",cursor:"pointer",padding:0,
            display:"flex",alignItems:"center",gap:4 }}>
            <span style={{ fontSize:15,color:C.muted }}>↗️</span>
          </button>
          <button style={{ background:"none", border:"none",cursor:"pointer",padding:0,
            display:"flex",alignItems:"center",gap:4 }}>
            <span style={{ fontSize:15,color:C.muted }}>☆</span>
          </button>
          <div style={{ flex:1 }} />
          <button style={{ background:"none", border:"none", cursor:"pointer",
            fontSize:13, fontWeight:600, color:C.muted,
            display:"flex", alignItems:"center", gap:4 }}>
            💬 {post.comments}
          </button>
          <button style={{ background:C.coralPale, border:`1px solid ${C.coral}30`,
            color:C.coral, borderRadius:20, padding:"6px 14px",
            fontSize:12, fontWeight:700, cursor:"pointer" }}>
            Details →
          </button>
        </div>
      </div>
    </div>
  );

  if(post.type==="talent") return (
    <div className="hui-card hui-card-tap"
      style={{ margin:"0 16px 14px", overflow:"hidden" }}
      onClick={()=>onView&&onView(post.author)}>
      <div style={{ height:200, position:"relative", overflow:"hidden" }}>
        <img src={post.bg} alt={post.author}
          style={{ width:"100%", height:"100%", objectFit:"cover" }} />
        <div style={{ position:"absolute", inset:0,
          background:"linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.72) 100%)" }} />
        <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"14px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
            <Av src={post.authorImg} name={post.author} size={32}
              border="2px solid rgba(255,255,255,0.7)" />
            <div>
              <div style={{ fontWeight:800, fontSize:14, color:"white" }}>
                {post.author}
                <span style={{ color:C.teal, marginLeft:4, fontSize:12 }}>✓</span>
              </div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.8)" }}>{post.talent}</div>
            </div>
            <div style={{ marginLeft:"auto", display:"flex", flexDirection:"column",
              alignItems:"flex-end", gap:3 }}>
              <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                <span style={{ color:C.gold, fontSize:12 }}>★</span>
                <span style={{ fontSize:13, fontWeight:700, color:"white" }}>{post.score}</span>
              </div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.75)" }}>
                📍 {post.dist} · {post.price}
              </div>
            </div>
          </div>
          <button onClick={e=>{e.stopPropagation();onBook&&onBook({name:post.author});}}
            style={{ width:"100%", padding:"11px",
              background:`linear-gradient(135deg, ${C.coral}, #FF8A65)`,
              color:"white", border:"none", borderRadius:12,
              fontSize:14, fontWeight:800, cursor:"pointer",
              boxShadow:`0 3px 12px ${C.coral}35`,
              WebkitTapHighlightColor:"transparent" }}>
            Termin buchen
          </button>
        </div>
      </div>
    </div>
  );

  return null;
}

/* ── HOME FEED ─────────────────────────────── */
function HomeFeed({ onView, onBook, onCart }) {
  return (
    <div style={{ paddingBottom:90 }}>
      {/* Stories */}
      <StoriesRow onView={onView} />
      <div style={{ height:1, background:C.border, margin:"6px 0" }} />

      {/* ── Ausgewählte Talente ── */}
      <SecHead icon="✨" title="Ausgewählte Talente"
        sub="Handverlesen · Diese Woche im Spotlight" onAll={()=>{}} />
      <div className="scrollbar-hide"
        style={{ display:"flex", gap:12, overflowX:"auto", padding:"0 16px 4px" }}>
        {FEATURED_TALENTS.map((w,i)=>(
          <TalentCard key={i} w={w} idx={i} onView={onView} />
        ))}
      </div>

      {/* ── Top Werke ── */}
      <SecHead icon="🎁" title="Top Werke"
        sub="Handgemachtes von echten Talenten" onAll={()=>{}} />
      <div className="scrollbar-hide"
        style={{ display:"flex", gap:10, overflowX:"auto", padding:"0 16px 4px" }}>
        {TOP_WORKS.map((w,i)=>(
          <WorkCard key={i} w={w} idx={i} />
        ))}
      </div>

      {/* ── Neuigkeiten / Feed ── */}
      <SecHead icon="📰" title="Neuigkeiten"
        sub="Was die Community gerade bewegt" />
      {FEED_POSTS.map((post,i)=>(
        <FeedCard key={i} post={post} onView={onView}
          onBook={onBook} onCart={onCart} />
      ))}
    </div>
  );
}

/* ── DISCOVER (Entdecke HUI) ───────────────── */
function DiscoverPage({ onView }) {
  return (
    <div style={{ paddingBottom:90 }}>
      <div style={{ padding:"20px 16px 8px" }}>
        <div style={{ fontWeight:900, fontSize:22, color:C.ink, marginBottom:4 }}>
          Entdecke HUI
        </div>
        <div style={{ fontSize:14, color:C.muted }}>Finde das, was zu dir passt</div>
      </div>

      {/* HUI Match card */}
      <div style={{ margin:"0 16px 16px",
        background:`linear-gradient(160deg, ${C.tealPale}, ${C.coralPale})`,
        borderRadius:20, padding:"18px",
        border:`1px solid ${C.teal}20` }}>
        <div style={{ display:"flex", justifyContent:"space-between",
          alignItems:"flex-start", marginBottom:10 }}>
          <div style={{ fontWeight:900, fontSize:17, color:C.ink }}>✨ HUI Match</div>
          <span style={{ background:`linear-gradient(135deg, ${C.coral}, #FF8A65)`,
            color:"white", borderRadius:999,
            padding:"3px 10px", fontSize:11, fontWeight:800 }}>Neu</span>
        </div>
        <div style={{ fontSize:13, color:C.muted, marginBottom:12, lineHeight:1.5 }}>
          Beschreibe, was du suchst — unsere KI findet die perfekten Talente & Werke für dich.
        </div>
        <input style={{ width:"100%", boxSizing:"border-box",
          padding:"11px 14px", background:"rgba(255,255,255,0.85)",
          border:`1px solid ${C.border}`, borderRadius:12,
          fontSize:13, color:C.muted, outline:"none", fontFamily:"inherit" }}
          placeholder="z. B. Fotograf für Hochzeit in München, max. 500 €"
          readOnly />
      </div>

      {/* Karte */}
      <SecHead icon="🗺️" title="Karte"
        sub="Entdecke Talente & Werke in deiner Nähe" />
      <div style={{ margin:"0 16px", borderRadius:18, overflow:"hidden",
        height:140, position:"relative",
        background:`linear-gradient(135deg, ${C.tealPale}, ${C.coralPale})`,
        boxShadow:`0 2px 12px rgba(0,0,0,0.08)`, cursor:"pointer" }}>
        {[{t:"30%",l:"35%"},{t:"55%",l:"62%"},{t:"40%",l:"72%"}].map((p,i)=>(
          <div key={i} style={{ position:"absolute", top:p.t, left:p.l,
            transform:"translate(-50%,-50%)",
            width:36, height:36, borderRadius:"50%",
            border:`2px solid ${C.teal}`,
            overflow:"hidden",
            boxShadow:`0 0 0 3px rgba(22,211,197,0.2)` }}>
            <img src={STORY_IMGS[i]} alt=""
              style={{ width:"100%", height:"100%", objectFit:"cover" }} />
          </div>
        ))}
        <div style={{ position:"absolute", bottom:12, left:0,right:0,
          display:"flex", justifyContent:"center" }}>
          <button className="hui-btn-teal"
            style={{ padding:"9px 20px", fontSize:13, borderRadius:12 }}>
            Karte öffnen
          </button>
        </div>
      </div>

      {/* Top Talente */}
      <SecHead icon="⭐" title="Top Talente"
        sub="Diese Woche beliebt" onAll={()=>{}} />
      <div className="hui-card" style={{ margin:"0 16px" }}>
        {FEATURED_TALENTS.map((w,i)=>(
          <div key={i} style={{ display:"flex", alignItems:"center",
            gap:12, padding:"12px 16px",
            borderBottom:i<3?`1px solid ${C.border}`:"none",
            cursor:"pointer" }}
            onClick={()=>onView&&onView(w.name)}>
            <Av src={w.img} name={w.name} size={44} border="none" />
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:800, fontSize:15, color:C.ink }}>{w.name}</div>
              <div style={{ fontSize:12, color:C.muted }}>{w.talent}</div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:3 }}>
              <span style={{ color:C.gold, fontSize:12 }}>★</span>
              <span style={{ fontSize:12, fontWeight:700, color:C.ink2 }}>{w.score}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── ROOT ──────────────────────────────────── */
export default function Home() {
  const [tab,           setTab]           = useState("feed");
  const [viewingWirker, setViewingWirker] = useState(null);
  const [showBooking,   setShowBooking]   = useState(null);
  const [showCreate,    setShowCreate]    = useState(false);
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

  if(showCreate) return <CreateFlow onClose={()=>setShowCreate(false)} />;

  if(viewingWirker) return (
    <div style={{ position:"fixed",inset:0,zIndex:200,overflowY:"auto",background:C.bg }}>
      <WirkerProfilePage
        wirkerName={viewingWirker}
        onBack={()=>setViewingWirker(null)}
        onAddToCart={item=>setCart(p=>[...p,item])}
        isOwnProfile={false}
        following={following}
        toggleFollow={name=>setFollowing(p=>{
          const n=new Set(p);n.has(name)?n.delete(name):n.add(name);return n;
        })}
        onGoToChats={()=>{setViewingWirker(null);setTab("chats");}}
      />
    </div>
  );

  if(showBooking) return (
    <div style={{ position:"fixed",inset:0,zIndex:200,overflowY:"auto",background:C.bg }}>
      <BookingFlow
        wirker={showBooking}
        onClose={()=>setShowBooking(null)}
        onAddToCart={item=>setCart(p=>[...p,item])}
        onSuccess={()=>{setShowBooking(null);setTab("chats");}}
      />
    </div>
  );

  return (
    <div style={{ height:"100dvh", display:"flex", flexDirection:"column",
      overflow:"hidden", background:C.bg }}>

      <Header cart={cart.length} notif={notif}
        onNotif={()=>setNotif(0)} onCart={()=>{}} />

      <div style={{ flex:1, overflowY:"auto", overflowX:"hidden",
        WebkitOverflowScrolling:"touch" }}
        className="scrollbar-hide">
        {tab==="feed"      && <HomeFeed onView={setViewingWirker}
                               onBook={setShowBooking}
                               onCart={item=>setCart(p=>[...p,item])} />}
        {tab==="impact"    && <ImpactPage currentUser={currentUser} />}
        {tab==="discover"  && <DiscoverPage onView={setViewingWirker} />}
        {tab==="favorites" && <FavoritesPage />}
        {tab==="profile"   && (
          <ProfilePage
            onTalentAnbieten={()=>setShowCreate(true)}
            onLogout={()=>{supabase.auth.signOut();window.location.href="/login";}}
          />
        )}
      </div>

      <BottomNav tab={tab} onTab={t=>{
          if(t==="discover") setTab("discover");
          else setTab(t);
        }}
        isTalent={isTalent}
        onCreate={()=>isTalent?setShowCreate(true):setTab("profile")}
      />
    </div>
  );
}
