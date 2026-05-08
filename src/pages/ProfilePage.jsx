// ProfilePage.jsx — RESET
// BASISPROFIL = privater Raum | WIRKERPROFIL = öffentliche Bühne
import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

const C = {
  teal:"#16D7C5", teal2:"#11C5B7", tealPale:"#E6FAF8",
  tealGlow:"rgba(22,215,197,0.22)",
  coral:"#FF8A6B", coral2:"#FF7B72", coralPale:"#FFF2EE",
  coralGlow:"rgba(255,138,107,0.20)",
  gold:"#F5A623", goldPale:"#FFFBEB",
  green:"#3DB87A",
  cream:"#F9F6F2", warm:"#FFF9F4",
  card:"#FFFFFF", ink:"#1A1A1A", ink2:"#3A3A3A",
  muted:"#888", muted2:"#C0C0C0", border:"rgba(0,0,0,0.06)",
};

const CSS = `
  @keyframes ppUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  @keyframes ppSlide{from{opacity:0;transform:translateX(18px)}to{opacity:1;transform:translateX(0)}}
  @keyframes ppPop{0%{transform:scale(0.92);opacity:0}70%{transform:scale(1.03)}100%{transform:scale(1);opacity:1}}
  .pp-scroll::-webkit-scrollbar{display:none}
  .pp-scroll{-ms-overflow-style:none;scrollbar-width:none}
  .pp-tap{transition:transform .17s cubic-bezier(.34,1.4,.64,1);-webkit-tap-highlight-color:transparent}
  .pp-tap:active{transform:scale(.963)}
  .pp-row{display:flex;align-items:center;gap:14;padding:15px 0;border-bottom:1px solid rgba(0,0,0,0.05);cursor:pointer}
`;

/* ── MOCK ── */
const MOCK = {
  name:"Lars Gutknecht", email:"lars@hui.app",
  img:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=90",
  memberSince:"2024", role:"wirker",
  impactEur:128.50, impactVotes:3,
  unreadMessages:2,
  // Wirker data
  talent:"Unternehmer & Visionär", city:"München",
  tagline:"Ich baue Dinge, die bedeuten.",
  bio:"Seit Jahren an der Schnittstelle zwischen Tech und Mensch.",
  bg:"https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&q=80",
  verified:true,
  impactProject:"Bildung für Kinder · Kolumbien",
  bookings:14, recommendations:12,
  werke:[
    {title:"Brand Identity Design", price:"ab € 1.200",
     img:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80"},
    {title:"Strategie-Workshop", price:"€ 490",
     img:"https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&q=80"},
  ],
  experiences:[
    {title:"Vision Retreat", price:"€ 890",
     img:"https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=400&q=80"},
  ],
  gespeichert:[
    {title:"Keramik Vase", price:"€ 89", creator:"David W.",
     img:"https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&q=80"},
    {title:"Aquarell A3", price:"€ 120", creator:"Lena M.",
     img:"https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=300&q=80"},
  ],
  orders:[
    {title:"Keramik Vase", status:"transit", price:"€ 89", date:"5. Mai",
     img:"https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&q=80"},
  ],
};

/* ══════════════════════════════════════════
   ROW component — clean list item
══════════════════════════════════════════ */
function Row({ icon, label, sub, badge, accent, onClick, idx=0 }) {
  return (
    <button onClick={onClick}
      className="pp-tap"
      style={{ width:"100%", display:"flex", alignItems:"center",
        gap:14, padding:"14px 0",
        background:"none", border:"none", cursor:"pointer",
        fontFamily:"inherit", textAlign:"left",
        borderBottom:`1px solid ${C.border}`,
        animation:`ppUp 0.35s ${idx*0.04}s both` }}>
      <div style={{ width:40, height:40, borderRadius:13,
        background:accent ? `${accent}15` : C.cream,
        border:`1px solid ${accent ? `${accent}30` : C.border}`,
        display:"flex", alignItems:"center",
        justifyContent:"center", fontSize:18, flexShrink:0 }}>
        {icon}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontWeight:700, fontSize:14, color:C.ink,
          lineHeight:1.2 }}>{label}</div>
        {sub && <div style={{ fontSize:11.5, color:C.muted,
          marginTop:2 }}>{sub}</div>}
      </div>
      {badge !== undefined && badge > 0 && (
        <div style={{ minWidth:20, height:20, borderRadius:999,
          background:`linear-gradient(135deg,${C.coral},${C.coral2})`,
          color:"white", fontSize:9, fontWeight:900,
          display:"flex", alignItems:"center",
          justifyContent:"center", padding:"0 5px" }}>
          {badge}
        </div>
      )}
      <span style={{ color:C.muted2, fontSize:14, flexShrink:0 }}>›</span>
    </button>
  );
}

/* ══════════════════════════════════════════
   BASISPROFIL VIEW
══════════════════════════════════════════ */
function BaseProfil({ profile, onSwitchToWirker, onShowOrders,
  onTalentAnbieten, onLogout, onClose }) {

  return (
    <div className="pp-scroll"
      style={{ background:C.warm, overflowY:"auto", height:"100%",
        WebkitOverflowScrolling:"touch" }}>
      <style>{CSS}</style>

      {/* ── Quiet personal header ── */}
      <div style={{ padding:"max(52px,env(safe-area-inset-top,52px)) 22px 0" }}>
        <div style={{ display:"flex", alignItems:"center",
          justifyContent:"space-between", marginBottom:24,
          animation:"ppUp 0.35s both" }}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ position:"relative" }}>
              <img src={profile.img} alt={profile.name}
                style={{ width:56, height:56, borderRadius:18,
                  objectFit:"cover", objectPosition:"top",
                  border:`2px solid ${C.card}`,
                  boxShadow:"0 3px 14px rgba(0,0,0,0.12)" }}/>
              <div style={{ position:"absolute", bottom:-2, right:-2,
                width:14, height:14, borderRadius:"50%",
                background:C.green,
                border:"2px solid white" }}/>
            </div>
            <div>
              <div style={{ fontWeight:900, fontSize:17, color:C.ink,
                letterSpacing:-0.3 }}>
                {profile.name.split(" ")[0]} ·
                <span style={{ fontWeight:500, fontSize:14,
                  color:C.muted }}> Mein Bereich</span>
              </div>
              <div style={{ fontSize:11.5, color:C.muted, marginTop:1 }}>
                Dabei seit {profile.memberSince}
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats row — quiet ── */}
        <div style={{ background:C.card, borderRadius:20,
          padding:"14px 16px", marginBottom:24,
          border:`1px solid ${C.border}`,
          boxShadow:"0 2px 12px rgba(0,0,0,0.04)",
          display:"flex", gap:0,
          animation:"ppUp 0.35s 0.04s both" }}>
          {[
            { val:`€ ${profile.impactEur.toFixed(0)}`, label:"Impact", color:C.green },
            { val:profile.recommendations, label:"Empfehlungen", color:C.teal },
            { val:profile.bookings,        label:"Buchungen",    color:C.coral },
          ].map((s, i) => (
            <div key={i} style={{ flex:1, textAlign:"center",
              borderRight: i < 2 ? `1px solid ${C.border}` : "none" }}>
              <div style={{ fontWeight:900, fontSize:18,
                color:s.color }}>{s.val}</div>
              <div style={{ fontSize:10.5, color:C.muted,
                marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Wirker switch banner ── */}
        {profile.role === "wirker" && (
          <button onClick={onSwitchToWirker} className="pp-tap"
            style={{ width:"100%", background:`linear-gradient(135deg,${C.teal}18,${C.coral}0A)`,
              border:`1px solid ${C.teal}30`, borderRadius:18,
              padding:"14px 18px", marginBottom:24,
              cursor:"pointer", fontFamily:"inherit", textAlign:"left",
              display:"flex", alignItems:"center", gap:12,
              animation:"ppUp 0.35s 0.08s both" }}>
            <div style={{ width:38, height:38, borderRadius:12,
              background:`linear-gradient(135deg,${C.teal},${C.coral})`,
              display:"flex", alignItems:"center",
              justifyContent:"center", fontSize:18 }}>✨</div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:800, fontSize:14, color:C.teal }}>
                Mein Wirkerprofil ansehen
              </div>
              <div style={{ fontSize:11.5, color:C.muted, marginTop:1 }}>
                Deine öffentliche kreative Identität
              </div>
            </div>
            <span style={{ color:C.teal, fontSize:16 }}>›</span>
          </button>
        )}

        {profile.role !== "wirker" && (
          <button onClick={onTalentAnbieten} className="pp-tap"
            style={{ width:"100%",
              background:`linear-gradient(135deg,${C.coral},${C.coral2})`,
              border:"none", borderRadius:18,
              padding:"16px 18px", marginBottom:24,
              cursor:"pointer", fontFamily:"inherit", textAlign:"left",
              display:"flex", alignItems:"center", gap:12, color:"white",
              boxShadow:`0 4px 18px ${C.coralGlow}`,
              animation:"ppUp 0.35s 0.08s both" }}>
            <div style={{ fontSize:22 }}>🌟</div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:800, fontSize:14 }}>
                Wirker werden
              </div>
              <div style={{ fontSize:11.5, opacity:0.8, marginTop:1 }}>
                Teile dein Talent mit der Welt
              </div>
            </div>
            <span style={{ fontSize:16, opacity:0.8 }}>›</span>
          </button>
        )}
      </div>

      {/* ── Sections ── */}
      <div style={{ padding:"0 22px 100px" }}>

        {/* Käufe & Buchungen */}
        <div style={{ fontSize:10.5, fontWeight:700, color:C.muted,
          letterSpacing:1.5, textTransform:"uppercase",
          marginBottom:4, marginTop:8 }}>Meine Aktivität</div>
        <div style={{ background:C.card, borderRadius:18,
          padding:"0 4px", marginBottom:20,
          border:`1px solid ${C.border}`,
          boxShadow:"0 2px 10px rgba(0,0,0,0.04)" }}>
          {[
            { icon:"📦", label:"Bestellungen & Buchungen",
              sub:"Aktive und vergangene Käufe",
              badge: profile.orders?.filter(o=>o.status==="transit").length || 1,
              accent:C.teal, action:onShowOrders },
            { icon:"💙", label:"Gespeicherte Werke",
              sub:`${profile.gespeichert?.length || 0} Werke gespeichert`,
              accent:C.coral },
            { icon:"💬", label:"Nachrichten",
              sub:"Buchungsgespräche",
              badge:profile.unreadMessages, accent:C.teal },
            { icon:"🌱", label:"Impact Stimmen",
              sub:`${profile.impactVotes} Stimmen abgegeben · € ${profile.impactEur.toFixed(0)} bewirkt`,
              accent:C.green },
          ].map((item, i) => (
            <Row key={i} {...item} idx={i} onClick={item.action}/>
          ))}
        </div>

        <div style={{ fontSize:10.5, fontWeight:700, color:C.muted,
          letterSpacing:1.5, textTransform:"uppercase",
          marginBottom:4 }}>Konto & Einstellungen</div>
        <div style={{ background:C.card, borderRadius:18,
          padding:"0 4px", marginBottom:20,
          border:`1px solid ${C.border}`,
          boxShadow:"0 2px 10px rgba(0,0,0,0.04)" }}>
          {[
            { icon:"💳", label:"Zahlungsmethoden",
              sub:"Karten, Bankverbindung", accent:C.gold },
            { icon:"🔔", label:"Benachrichtigungen",
              sub:"Anfragen, Updates, Impact", accent:C.coral },
            { icon:"🔒", label:"Privatsphäre",
              sub:"Sichtbarkeit & Datenschutz", accent:C.muted },
            { icon:"✏️", label:"Profil bearbeiten",
              sub:"Name, Foto, Beschreibung", accent:C.teal },
          ].map((item, i) => (
            <Row key={i} {...item} idx={i+4}/>
          ))}
        </div>

        {/* Logout */}
        <button onClick={onLogout} className="pp-tap"
          style={{ width:"100%", padding:"14px",
            background:"none", border:`1.5px solid rgba(255,138,107,0.3)`,
            borderRadius:16, color:C.coral,
            fontSize:13.5, fontWeight:700, cursor:"pointer",
            fontFamily:"inherit", marginTop:8 }}>
          Abmelden
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   WIRKERPROFIL VIEW — cinematic, public
══════════════════════════════════════════ */
function WirkerProfil({ profile, onSwitchToBase, onEdit }) {
  const [activeTab, setActiveTab] = useState("werke");

  const tabs = [
    { key:"werke",       label:"Werke" },
    { key:"erlebnisse",  label:"Erlebnisse" },
    { key:"empfehlungen",label:"Empfehlungen" },
  ];

  return (
    <div className="pp-scroll"
      style={{ background:C.cream, overflowY:"auto", height:"100%",
        WebkitOverflowScrolling:"touch" }}>
      <style>{CSS}</style>

      {/* ── CINEMATIC HERO ── */}
      <div style={{ position:"relative", height:"54vh",
        minHeight:340, maxHeight:480 }}>
        <img src={profile.bg} alt=""
          style={{ position:"absolute", inset:0, width:"100%", height:"100%",
            objectFit:"cover", objectPosition:"center",
            filter:"brightness(0.82) saturate(1.15)" }}/>
        <div style={{ position:"absolute", inset:0,
          background:"linear-gradient(to bottom,rgba(0,0,0,0.12) 0%,rgba(0,0,0,0.65) 100%)" }}/>

        {/* Top bar */}
        <div style={{ position:"absolute", top:0, left:0, right:0,
          padding:"max(52px,env(safe-area-inset-top,52px)) 20px 0",
          display:"flex", justifyContent:"space-between", alignItems:"center" }}>

          {/* Switch to base */}
          <button onClick={onSwitchToBase} className="pp-tap"
            style={{ display:"flex", alignItems:"center", gap:6,
              background:"rgba(255,255,255,0.15)",
              backdropFilter:"blur(10px)",
              border:"1px solid rgba(255,255,255,0.25)",
              borderRadius:999, padding:"7px 14px",
              cursor:"pointer", fontFamily:"inherit" }}>
            <span style={{ fontSize:10, fontWeight:700,
              color:"rgba(255,255,255,0.9)", letterSpacing:0.3 }}>
              ← Mein Bereich
            </span>
          </button>

          {/* Edit */}
          <button onClick={onEdit} className="pp-tap"
            style={{ width:38, height:38, borderRadius:13,
              background:"rgba(255,255,255,0.15)",
              backdropFilter:"blur(10px)",
              border:"1px solid rgba(255,255,255,0.25)",
              cursor:"pointer", fontSize:16 }}>✏️</button>
        </div>

        {/* Identity */}
        <div style={{ position:"absolute", bottom:0, left:0, right:0,
          padding:"0 22px 22px" }}>
          {profile.verified && (
            <div style={{ display:"inline-flex", alignItems:"center", gap:5,
              background:"rgba(22,215,197,0.22)",
              backdropFilter:"blur(8px)",
              borderRadius:999, padding:"4px 12px",
              marginBottom:10,
              border:"1px solid rgba(22,215,197,0.35)" }}>
              <div style={{ width:5, height:5, borderRadius:"50%",
                background:C.teal }}/>
              <span style={{ fontSize:10, color:C.teal, fontWeight:700 }}>
                Verifiziert seit {profile.memberSince}
              </span>
            </div>
          )}
          <div style={{ fontWeight:900, fontSize:30, color:"white",
            letterSpacing:-0.8, lineHeight:1.1, marginBottom:6 }}>
            {profile.name}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8,
            marginBottom:10 }}>
            <span style={{ fontSize:13.5, color:"rgba(255,255,255,0.85)",
              fontWeight:600 }}>{profile.talent}</span>
            <span style={{ width:3, height:3, borderRadius:"50%",
              background:"rgba(255,255,255,0.4)", display:"inline-block" }}/>
            <span style={{ fontSize:12.5, color:"rgba(255,255,255,0.65)" }}>
              📍 {profile.city}
            </span>
          </div>
          <div style={{ fontSize:14.5, color:"rgba(255,255,255,0.78)",
            fontStyle:"italic", lineHeight:1.6,
            maxWidth:320 }}>„{profile.tagline}"</div>
        </div>
      </div>

      {/* ── Stats + avatar ── */}
      <div style={{ background:C.card,
        borderBottom:`1px solid ${C.border}` }}>
        <div style={{ display:"flex", alignItems:"flex-end",
          justifyContent:"space-between",
          padding:"0 22px", marginTop:-28 }}>
          <img src={profile.img} alt={profile.name}
            style={{ width:76, height:76, borderRadius:"50%",
              objectFit:"cover", objectPosition:"top",
              border:"4px solid white",
              boxShadow:"0 4px 16px rgba(0,0,0,0.18)" }}/>
          <div style={{ paddingBottom:4, display:"flex", gap:8 }}>
            <button style={{ padding:"10px 18px",
              background:`linear-gradient(135deg,${C.teal},${C.teal2})`,
              border:"none", borderRadius:14, color:"white",
              fontSize:12.5, fontWeight:800, cursor:"pointer",
              fontFamily:"inherit",
              boxShadow:`0 3px 12px ${C.tealGlow}` }}>
              Jetzt buchen
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display:"flex", gap:0,
          margin:"16px 22px 20px" }}>
          {[
            { val:`€ ${profile.impactEur.toFixed(0)}`, label:"Impact", color:C.green },
            { val:profile.recommendations, label:"Empfehlungen", color:C.teal },
            { val:profile.bookings, label:"Buchungen", color:C.coral },
          ].map((s, i) => (
            <div key={i} style={{ flex:1, textAlign:"center",
              borderRight: i<2 ? `1px solid ${C.border}` : "none" }}>
              <div style={{ fontWeight:900, fontSize:20, color:s.color }}>
                {s.val}
              </div>
              <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bio ── */}
      <div style={{ background:C.card, padding:"24px 22px",
        borderBottom:`1px solid ${C.border}` }}>
        <div style={{ fontSize:11, fontWeight:700, color:C.teal,
          letterSpacing:1.8, textTransform:"uppercase",
          marginBottom:10 }}>Über mich</div>
        <div style={{ fontSize:15.5, color:C.ink2,
          lineHeight:1.85 }}>{profile.bio}</div>
        {/* Impact line */}
        <div style={{ marginTop:18, padding:"10px 14px",
          borderRadius:14, background:"rgba(61,184,122,0.07)",
          border:"1px solid rgba(61,184,122,0.14)",
          display:"flex", gap:8, alignItems:"center" }}>
          <span style={{ fontSize:14 }}>🌱</span>
          <span style={{ fontSize:12, color:"#3DB87A", lineHeight:1.5 }}>
            Unterstützt: <strong>{profile.impactProject}</strong>
          </span>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ background:C.card, position:"sticky", top:0,
        zIndex:10, borderBottom:`1px solid ${C.border}` }}>
        <div style={{ display:"flex" }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              style={{ flex:1, padding:"14px 4px",
                background:"none", border:"none", cursor:"pointer",
                fontFamily:"inherit",
                fontSize:12.5,
                fontWeight: activeTab===t.key ? 800 : 500,
                color: activeTab===t.key ? C.teal : C.muted,
                borderBottom: activeTab===t.key
                  ? `2px solid ${C.teal}` : "2px solid transparent",
                transition:"all 0.2s" }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ── */}
      <div style={{ padding:"20px 18px 120px" }}>

        {/* WERKE */}
        {activeTab==="werke" && (
          <div style={{ display:"grid",
            gridTemplateColumns:"1fr 1fr", gap:12 }}>
            {profile.werke.map((w, i) => (
              <div key={i} style={{ background:C.card, borderRadius:20,
                overflow:"hidden", border:`1px solid ${C.border}`,
                boxShadow:"0 2px 12px rgba(0,0,0,0.06)",
                animation:`ppUp 0.35s ${i*0.07}s both` }}>
                <img src={w.img} alt={w.title}
                  style={{ width:"100%", height:110,
                    objectFit:"cover",
                    filter:"brightness(0.9) saturate(1.1)" }}/>
                <div style={{ padding:"10px 12px" }}>
                  <div style={{ fontWeight:700, fontSize:12.5,
                    color:C.ink, lineHeight:1.3,
                    marginBottom:4 }}>{w.title}</div>
                  <div style={{ fontWeight:900, fontSize:14,
                    color:C.gold }}>{w.price}</div>
                  <button style={{ width:"100%", marginTop:8,
                    padding:"8px", background:`${C.coral}18`,
                    border:`1px solid ${C.coral}44`,
                    borderRadius:10, fontSize:11,
                    fontWeight:700, color:C.coral,
                    cursor:"pointer", fontFamily:"inherit" }}>
                    Kaufen
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ERLEBNISSE */}
        {activeTab==="erlebnisse" && (
          <div>
            {profile.experiences.map((e, i) => (
              <div key={i} style={{ background:C.card, borderRadius:20,
                overflow:"hidden", marginBottom:14,
                border:`1px solid ${C.border}`,
                boxShadow:"0 2px 12px rgba(0,0,0,0.06)",
                animation:`ppUp 0.35s ${i*0.07}s both` }}>
                <img src={e.img} alt={e.title}
                  style={{ width:"100%", height:160,
                    objectFit:"cover",
                    filter:"brightness(0.88) saturate(1.1)" }}/>
                <div style={{ padding:"14px 16px",
                  display:"flex", justifyContent:"space-between",
                  alignItems:"center" }}>
                  <div>
                    <div style={{ fontWeight:800, fontSize:15,
                      color:C.ink }}>{e.title}</div>
                    <div style={{ fontWeight:900, fontSize:16,
                      color:C.teal, marginTop:4 }}>{e.price}</div>
                  </div>
                  <button style={{ padding:"10px 18px",
                    background:`linear-gradient(135deg,${C.teal},${C.teal2})`,
                    border:"none", borderRadius:13, color:"white",
                    fontSize:12, fontWeight:800, cursor:"pointer",
                    fontFamily:"inherit",
                    boxShadow:`0 3px 10px ${C.tealGlow}` }}>
                    Buchen
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* EMPFEHLUNGEN */}
        {activeTab==="empfehlungen" && (
          <div>
            {[
              { name:"Julia M.", city:"Berlin", text:"Außergewöhnlich. Ich komme sicher wieder.",
                img:"https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&q=80" },
              { name:"Tom B.", city:"Hamburg", text:"Professionell, warm und sehr präzise.",
                img:"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&q=80" },
            ].map((r, i) => (
              <div key={i} style={{ background:C.card, borderRadius:20,
                padding:"18px 18px", marginBottom:12,
                border:`1px solid ${C.border}`,
                boxShadow:"0 2px 12px rgba(0,0,0,0.05)",
                animation:`ppUp 0.35s ${i*0.07}s both` }}>
                <div style={{ display:"flex", gap:12,
                  alignItems:"center", marginBottom:12 }}>
                  <img src={r.img} alt={r.name}
                    style={{ width:40, height:40, borderRadius:13,
                      objectFit:"cover" }}/>
                  <div>
                    <div style={{ fontWeight:700, fontSize:13,
                      color:C.ink }}>{r.name}</div>
                    <div style={{ fontSize:11, color:C.muted }}>
                      📍 {r.city}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize:14, color:C.ink2,
                  fontStyle:"italic", lineHeight:1.65 }}>
                  „{r.text}"
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN EXPORT
══════════════════════════════════════════ */
export default function ProfilePage({ onTalentAnbieten, onLogout }) {
  const [profile, setProfile] = useState(MOCK);
  // "base" | "wirker"
  const [view, setView] = useState("base");
  const [showOrders, setShowOrders] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      const u = session.user;
      setProfile(p => ({
        ...p,
        name: u.user_metadata?.full_name || u.email?.split("@")[0] || p.name,
        img: u.user_metadata?.avatar_url || p.img,
        email: u.email || p.email,
      }));
    });
  }, []);

  // Lazy-load OrdersPage to keep bundle clean
  if (showOrders) {
    // Inline minimal orders view since we can't dynamic import here
    return (
      <div style={{ position:"fixed", inset:0, zIndex:350,
        background:C.warm, overflowY:"auto" }}>
        <style>{CSS}</style>
        <div style={{ padding:"max(52px,env(safe-area-inset-top,52px)) 20px 0",
          display:"flex", alignItems:"center", gap:14, marginBottom:20 }}>
          <button onClick={() => setShowOrders(false)}
            style={{ width:38, height:38, borderRadius:13,
              background:C.card, border:`1px solid ${C.border}`,
              cursor:"pointer", fontSize:16 }}>←</button>
          <div style={{ fontWeight:900, fontSize:17, color:C.ink }}>
            Bestellungen & Buchungen
          </div>
        </div>
        {MOCK.orders.map((o, i) => (
          <div key={i} style={{ margin:"0 18px 14px",
            background:C.card, borderRadius:20, overflow:"hidden",
            border:`1px solid ${C.border}`,
            boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
            <img src={o.img} alt={o.title}
              style={{ width:"100%", height:140, objectFit:"cover" }}/>
            <div style={{ padding:"14px 16px" }}>
              <div style={{ display:"flex", justifyContent:"space-between",
                alignItems:"center" }}>
                <div>
                  <div style={{ fontWeight:800, fontSize:15, color:C.ink }}>
                    {o.title}</div>
                  <div style={{ fontSize:12, color:C.muted,
                    marginTop:2 }}>{o.date} · {o.price}</div>
                </div>
                <div style={{ background:`${C.teal}18`,
                  border:`1px solid ${C.teal}40`,
                  borderRadius:999, padding:"5px 12px",
                  fontSize:10.5, fontWeight:700, color:C.teal }}>
                  Unterwegs
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (view === "wirker" && profile.role === "wirker") {
    return (
      <div style={{ position:"fixed", inset:0, zIndex:300,
        height:"100dvh", overflow:"hidden" }}>
        <WirkerProfil
          profile={profile}
          onSwitchToBase={() => setView("base")}
          onEdit={() => {}}
        />
      </div>
    );
  }

  return (
    <div style={{ position:"relative", height:"100dvh", overflow:"hidden" }}>
      <BaseProfil
        profile={profile}
        onSwitchToWirker={() => setView("wirker")}
        onShowOrders={() => setShowOrders(true)}
        onTalentAnbieten={onTalentAnbieten}
        onLogout={onLogout}
      />
    </div>
  );
}
