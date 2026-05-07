import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";

const C = {
  teal:"#16D7C5", teal2:"#11C5B7", tealPale:"#E6FAF8",
  coral:"#FF8A6B", coral2:"#FF7B72", coralPale:"#FFF2EE",
  gold:"#F59E0B", goldPale:"#FFFBEB",
  cream:"#F9F6F2", creamWarm:"#FFF9F4",
  card:"#FFFFFF", ink:"#1A1A1A", ink2:"#3D3D3D",
  muted:"#888888", muted2:"#BBBBBB",
  border:"#EFEFEF", borderWarm:"#E8E2D8",
  green:"#10B981",
};

function HuiLogo({ size=40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="plg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#22E8D8"/>
          <stop offset="100%" stopColor="#FF8A6B"/>
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="18" fill="url(#plg)"/>
      <rect x="2" y="2" width="60" height="28" rx="18" fill="white" fillOpacity="0.15"/>
      <text x="10" y="44" fontSize="30" fontWeight="900" fill="white"
        fontFamily="-apple-system,system-ui,sans-serif" letterSpacing="-2">Hj</text>
    </svg>
  );
}

export default function ProfilePage({ onTalentAnbieten, onLogout }) {
  const [isTalent, setIsTalent] = useState(false);
  const [tab, setTab] = useState("posts");

  const user = {
    name: "Lars M.",
    talent: "Keramik-Künstler",
    city: "München",
    memberSince: "März 2024",
    bio: "Ich forme aus Ton Dinge, die bleiben. Handgemachte Keramik und Workshops – jedes Stück ein Unikat.",
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80",
    header: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=85",
    posts: 12, bookings: 41, followers: 218, recommendations: 34,
    impactEur: 47.25, huiPoints: 250,
    werke: [
      { img:"https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=300&q=80", title:"Schale", price:"55 €" },
      { img:"https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=300&q=80", title:"Workshop", price:"75 €" },
      { img:"https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=300&q=80", title:"Tassen-Set", price:"69 €" },
    ],
  };

  return (
    <div style={{ paddingBottom:90 }}>
      {/* Header image */}
      <div style={{ height:160, overflow:"hidden", position:"relative" }}>
        <img src={user.header} alt="Header"
          style={{ width:"100%", height:"100%", objectFit:"cover",
            filter:"brightness(0.8) saturate(1.1)" }}/>
        <div style={{ position:"absolute", inset:0,
          background:"linear-gradient(to bottom, transparent 30%, rgba(249,246,242,0.95) 100%)"}}/>
        {/* Settings */}
        <button style={{ position:"absolute", top:14, right:14,
          width:34, height:34, borderRadius:"50%",
          background:"rgba(255,255,255,0.3)", backdropFilter:"blur(8px)",
          border:"none", cursor:"pointer", fontSize:16,
          display:"flex", alignItems:"center", justifyContent:"center",
          WebkitTapHighlightColor:"transparent" }}>⚙️</button>
      </div>

      {/* Avatar + Name */}
      <div style={{ padding:"0 20px", marginTop:-32, position:"relative" }}>
        <div style={{ width:64, height:64, borderRadius:"50%",
          overflow:"hidden", border:"3px solid white",
          boxShadow:"0 4px 16px rgba(0,0,0,0.12)", marginBottom:10 }}>
          <img src={user.img} alt={user.name}
            style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
        </div>
        <div style={{ fontWeight:900, fontSize:22, color:C.ink,
          letterSpacing:-0.5 }}>{user.name}</div>
        <div style={{ fontSize:13, color:C.muted, marginTop:2 }}>
          📍 {user.city} · Mitglied seit {user.memberSince}
        </div>
      </div>

      {/* HUI Points Card */}
      <div style={{ margin:"16px 18px 0",
        background:`linear-gradient(135deg, ${C.gold}, #E8A000)`,
        borderRadius:20, padding:"16px 20px",
        display:"flex", alignItems:"center", gap:14,
        boxShadow:"0 4px 20px rgba(245,158,11,0.30)",
        cursor:"pointer" }}>
        <div style={{ width:42, height:42, borderRadius:13,
          background:"rgba(255,255,255,0.2)",
          display:"flex", alignItems:"center",
          justifyContent:"center", fontSize:22 }}>⭐</div>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:900, fontSize:20, color:"white" }}>
            {user.huiPoints} HUI-Punkte
          </div>
          <div style={{ fontSize:12, color:"rgba(255,255,255,0.8)", marginTop:2 }}>
            = {(user.huiPoints * 0.05).toFixed(2)} € Guthaben · Einlösen →
          </div>
        </div>
        <span style={{ fontSize:20, color:"rgba(255,255,255,0.7)" }}>›</span>
      </div>

      {/* Stats row */}
      <div style={{ display:"flex", margin:"16px 18px 0",
        background:C.card, borderRadius:18,
        boxShadow:"0 2px 8px rgba(0,0,0,0.05)" }}>
        {[
          {val:user.werke.length, label:"Werke"},
          {val:user.bookings,     label:"Buchungen"},
          {val:user.followers,    label:"Follower"},
          {val:user.recommendations, label:"Empf. ✓"},
        ].map((s,i)=>(
          <div key={i} style={{ flex:1, textAlign:"center",
            padding:"14px 4px",
            borderRight:i<3?`1px solid ${C.border}`:"none" }}>
            <div style={{ fontWeight:900, fontSize:17, color:C.ink }}>{s.val}</div>
            <div style={{ fontSize:10, color:C.muted, marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Impact mini */}
      <div style={{ margin:"12px 18px 0", padding:"14px 16px",
        background:C.tealPale, borderRadius:16,
        display:"flex", alignItems:"center", gap:12 }}>
        <span style={{ fontSize:20 }}>🌱</span>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:700, fontSize:13, color:C.ink }}>
            Dein Impact-Beitrag
          </div>
          <div style={{ fontSize:12, color:C.muted }}>
            {user.impactEur} € an echte Projekte
          </div>
        </div>
        <span style={{ fontSize:13, fontWeight:600, color:C.teal }}>Mehr →</span>
      </div>

      {/* Become Talent CTA */}
      {!isTalent && (
        <div style={{ margin:"12px 18px 0",
          background:`linear-gradient(160deg, rgba(22,215,197,0.08), rgba(255,138,107,0.06))`,
          borderRadius:18, padding:"18px 20px",
          border:`1px solid ${C.teal}18` }}>
          <div style={{ fontWeight:800, fontSize:16, color:C.ink, marginBottom:4 }}>
            Werde Teil der Community 🤝
          </div>
          <div style={{ fontSize:13, color:C.muted, lineHeight:1.6, marginBottom:14 }}>
            Biete dein Talent an — nur echte Menschen,<br/>kein Algorithmus entscheidet.
          </div>
          <button onClick={()=>{ setIsTalent(true); onTalentAnbieten&&onTalentAnbieten(); }}
            style={{ width:"100%", padding:"13px",
              background:`linear-gradient(135deg,${C.coral},${C.coral2})`,
              color:"white", border:"none", borderRadius:14,
              fontSize:14, fontWeight:800, cursor:"pointer",
              fontFamily:"inherit",
              boxShadow:`0 3px 14px rgba(255,138,107,0.35)`,
              WebkitTapHighlightColor:"transparent" }}>
            🚀 Jetzt Talent werden
          </button>
        </div>
      )}

      {/* Talent tabs */}
      {isTalent && (
        <>
          <div style={{ display:"flex", margin:"16px 0 0",
            borderBottom:`1px solid ${C.border}` }}>
            {["posts","werke","settings"].map(t=>(
              <button key={t} onClick={()=>setTab(t)}
                style={{ flex:1, padding:"11px 4px", background:"none",
                  border:"none", cursor:"pointer",
                  borderBottom:tab===t?`2.5px solid ${C.teal}`:"2.5px solid transparent",
                  fontSize:12, fontWeight:tab===t?800:500,
                  color:tab===t?C.teal:C.muted,
                  WebkitTapHighlightColor:"transparent" }}>
                {t==="posts"?"Beiträge":t==="werke"?"Werke":"Einstellungen"}
              </button>
            ))}
          </div>
          {tab==="werke" && (
            <div style={{ padding:"14px 18px",
              display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
              {user.werke.map((w,i)=>(
                <div key={i} style={{ borderRadius:14, overflow:"hidden",
                  background:C.card, boxShadow:"0 2px 8px rgba(0,0,0,0.07)" }}>
                  <div style={{ height:100, overflow:"hidden" }}>
                    <img src={w.img} alt={w.title}
                      style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                  </div>
                  <div style={{ padding:"6px 8px 8px" }}>
                    <div style={{ fontSize:11, fontWeight:700, color:C.ink }}>{w.title}</div>
                    <div style={{ fontSize:11, fontWeight:800, color:C.coral }}>{w.price}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {tab==="posts" && (
            <div style={{ padding:"16px 18px", textAlign:"center", color:C.muted }}>
              <div style={{ fontSize:32, marginBottom:8 }}>📸</div>
              <div style={{ fontSize:14 }}>Noch keine Beiträge</div>
            </div>
          )}
          {tab==="settings" && (
            <div style={{ padding:"14px 18px" }}>
              {[
                {icon:"👤", label:"Profil bearbeiten"},
                {icon:"🔔", label:"Benachrichtigungen"},
                {icon:"💳", label:"Zahlungen"},
                {icon:"🌍", label:"Datenschutz"},
                {icon:"❓", label:"Hilfe & Support"},
              ].map((s,i)=>(
                <div key={i} style={{ display:"flex", alignItems:"center",
                  gap:14, padding:"15px 16px",
                  background:C.card, borderRadius:14,
                  marginBottom:8,
                  boxShadow:"0 1px 4px rgba(0,0,0,0.04)",
                  cursor:"pointer" }}>
                  <span style={{ fontSize:20 }}>{s.icon}</span>
                  <span style={{ fontSize:14, fontWeight:600, color:C.ink, flex:1 }}>
                    {s.label}
                  </span>
                  <span style={{ color:C.muted2 }}>›</span>
                </div>
              ))}
              <button onClick={onLogout}
                style={{ width:"100%", marginTop:8, padding:"14px",
                  background:"none", border:`1.5px solid #FFCDD2`,
                  borderRadius:14, fontSize:14, fontWeight:600,
                  color:"#E53935", cursor:"pointer", fontFamily:"inherit" }}>
                Abmelden
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
