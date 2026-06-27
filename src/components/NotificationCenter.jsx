// NotificationCenter.jsx — HUI Bewegungen v3
// Screenshot-exact: Split-Layout, Hero-Impact, Filter-Pills, Typed Notif-Cards, Chat-Detail
// ARCHITEKTUR-REGEL: Liest AUSSCHLIESSLICH aus AppStateContext.
// KEIN eigener supabase.channel() — AppStateContext ist Single-Owner.
// Props: { onClose, onNavigate } — rückwärtskompatibel.

import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { S } from "../core/hui.sources.js";
import { supabase }    from "../lib/supabaseClient";
import { useAppState } from "../lib/AppStateContext";
import { HUI } from "../design/hui.design.js";
import { useHuiActions, A } from "../core/hui.actions.js";

/* ══════════════════════════════════════════════════════════════
   DESIGN TOKENS
══════════════════════════════════════════════════════════════ */
const C = {
  teal:      HUI.COLOR.teal,
  teal2:     HUI.COLOR.tealDeep,
  tealPale:  HUI.COLOR.tealPale,
  tealGlow:  "rgba(32,211,194,0.22)",
  coral:     HUI.COLOR.coral,
  coralPale: HUI.COLOR.coralPale,
  coralGlow: "rgba(255,138,122,0.18)",
  gold:      HUI.COLOR.goldLight,
  goldPale:  "#FFFBEB",
  green:     "#22C55E",
  greenPale: "#ECFDF5",
  violet:    "#9B72CF",
  cream:     HUI.COLOR.cream,
  warm:      HUI.COLOR.creamSoft,
  card:      "rgba(255,255,255,0.95)",
  ink:       "#1E1E1E",
  ink2:      HUI.COLOR.ink2,
  muted:     "#8A8A8A",
  muted2:    "#C5C5C5",
  border:    "rgba(0,0,0,0.07)",
  borderL:   "rgba(0,0,0,0.04)",
};

/* ══════════════════════════════════════════════════════════════
   CSS
══════════════════════════════════════════════════════════════ */
const CSS = `
  * { box-sizing:border-box; -webkit-font-smoothing:antialiased; }
  @keyframes fadeUp  { from{opacity:0;transform:translateY(7px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes msgIn   { from{opacity:0;transform:translateY(5px) scale(0.98)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes slideR  { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
  @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.35} }
  @keyframes glow    { 0%,100%{box-shadow:0 0 0 0 rgba(32,211,194,0)} 50%{box-shadow:0 0 0 8px rgba(32,211,194,0.12)} }
  @keyframes waveBar { 0%,100%{transform:scaleY(0.4)} 50%{transform:scaleY(1)} }
  @keyframes shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
  .nc-scroll::-webkit-scrollbar { display:none; }
  .nc-scroll { -ms-overflow-style:none; scrollbar-width:none; }
  .nc-tap {
    -webkit-tap-highlight-color:transparent;
    transition:transform 0.28s ease, opacity 0.22s ease;
    cursor:pointer;
  }
  .nc-tap:active { transform:scale(0.982) translateY(1.5px); opacity:0.88; }
  .nc-card {
    transition:box-shadow 0.32s ease, transform 0.32s ease;
  }
  .nc-card:active { transform:scale(0.982) translateY(1.5px); }
  .nc-pill {
    flex-shrink:0; border-radius:999px;
    font-size:13px; font-weight:600;
    cursor:pointer; border:none; outline:none;
    transition:all 0.18s ease;
    -webkit-tap-highlight-color:transparent;
    white-space:nowrap;
  }
  .nc-pill:active { transform:scale(0.965) translateY(1px); }
  .nc-skel {
    background:linear-gradient(90deg,#f0ede8 0%,#e8e4df 50%,#f0ede8 100%);
    background-size:200% 100%;
    animation:shimmer 1.6s infinite;
    border-radius:10px;
  }
`;

/* ══════════════════════════════════════════════════════════════
   NOTIFICATION TYPE CONFIG
══════════════════════════════════════════════════════════════ */
const TYPE = {
  begegnung:  { color:C.teal,   bg:C.tealPale,   icon:"💬", label:"Begegnung"  },
  buchung:    { color:C.coral,  bg:C.coralPale,  icon:"📅", label:"Buchung"    },
  impact:     { color:C.green,  bg:C.greenPale,  icon:"🌿", label:"Wirkung"    },
  community:  { color:C.gold,   bg:C.goldPale,   icon:"👥", label:"Community"  },
  inspiration:{ color:C.violet, bg:"#F5F0FF",    icon:"✨", label:"Inspiration" },
  admin:      { color:"#6366F1",bg:"#EEF2FF",    icon:"📢", label:"Ankündigung" },
  system:     { color:C.muted,  bg:C.cream,      icon:"ⓘ",  label:"System"     },
  support_ticket:       { color:C.coral,  bg:'rgba(255,138,107,0.1)', icon:'🎧', label:'Support'     },
  support_ticket_reply: { color:C.teal,   bg:'rgba(22,215,197,0.1)', icon:'✅', label:'Support'     },
};

function getType(n) {
  const t = n.type || n.notification_type || "system";
  if (t.includes("begegn") || t.includes("message") || t.includes("chat"))    return TYPE.begegnung;
  if (t.includes("buchung") || t.includes("booking"))                          return TYPE.buchung;
  if (t.includes("impact") || t.includes("wirkung") || t.includes("pool"))    return TYPE.impact;
  if (t.includes("community") || t.includes("projekt") || t.includes("vote")) return TYPE.community;
  if (t.includes("inspiration") || t.includes("erlebnis"))                    return TYPE.inspiration;
  if (t.includes("admin_broadcast") || t.includes("broadcast") || t.includes("ankündig")) return TYPE.admin;
  return TYPE.system;
}

/* ══════════════════════════════════════════════════════════════
   HELPER
══════════════════════════════════════════════════════════════ */
const MOCK_NOTIFS = [
  { id:"n1", type:"begegnung", message:"Mia hat auf deine Anfrage geantwortet.",
    body:"Keramik & Handwerk 🏺", created_at:new Date(Date.now()-25*60000).toISOString(),
    read:false, avatar:"https://i.pravatar.cc/52?img=47", unread_count:2,
    action_label:"Resonanz lesen", action_url:"/chat" },
  { id:"n2", type:"buchung", message:"Deine Begegnung mit Mia beginnt morgen ✦",
    body:"18:00 · Atelier Mia · Berlin", created_at:new Date(Date.now()-45*60000).toISOString(),
    read:false, avatar:"https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=80&q=75",
    action_label:"Begegnung ansehen", action_url:"/bookings", is_image:true },
  { id:"n3", type:"impact", message:"Durch deine letzte Buchung wurden \u20ac2,25 dem Impact Pool hinzugef\u00fcgt.",
    body:"", created_at:new Date(Date.now()-90*60000).toISOString(),
    read:false, avatar:null, icon_override:"🌿" },
  { id:"n4", type:"community", message:"127 Menschen unterst\u00fctzen jetzt das Projekt Musikr\u00e4ume f\u00fcr junge K\u00fcnstler.",
    body:"", created_at:new Date(Date.now()-3*60*60000).toISOString(),
    read:false, avatar:"https://i.pravatar.cc/52?img=53", group_avatars:["https://i.pravatar.cc/28?img=21","https://i.pravatar.cc/28?img=36","https://i.pravatar.cc/28?img=9"] },
  { id:"n5", type:"begegnung", message:"Leon hat dein Werk in seinen Raum aufgenommen ❖",
    body:"", created_at:new Date(Date.now()-60*60*24*1000).toISOString(),
    read:true, avatar:"https://i.pravatar.cc/52?img=53", icon_override:"❤️" },
  { id:"n6", type:"inspiration", message:"Ein neues Erlebnis k\u00f6nnte zu deinem kreativen Rhythmus passen.",
    body:"", created_at:new Date(Date.now()-60*60*25*1000).toISOString(),
    read:true, avatar:"https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=80&q=75", is_image:true,
    action_label:"Entdecken", action_url:"/discover" },
  { id:"n7", type:"begegnung", message:"Clara m\u00f6chte mit dir \u00fcber eine Zusammenarbeit sprechen.",
    body:"", created_at:new Date(Date.now()-60*60*60*1000).toISOString(),
    read:true, avatar:"https://i.pravatar.cc/52?img=5" },
];

const MOCK_CHAT = {
  other_profile:{ display_name:"Mia Kern", avatar_url:"https://i.pravatar.cc/80?img=47",
    talent:"Keramik & Handwerk", location:"Berlin" },
  presence:"präsent", presenceLabel:"Gerade im Atelier",
  booking_title:"Begegnung ❖ Formen der Erde",
  category:"Keramik & Handwerk", categoryIcon:"\uD83C\uDFFA",
};

const MOCK_MESSAGES = [
  { id:"m1", sender:"other", type:"text",
    text:"Hey! Sch\u00f6n von dir zu h\u00f6ren \uD83D\uDE0A\nDanke f\u00fcr dein Interesse an meinem Workshop.",
    created_at:new Date(Date.now()-55*60000).toISOString() },
  { id:"m2", sender:"me", type:"text",
    text:"Hallo Mia! Ich freue mich schon sehr darauf. Kannst du mir noch sagen, was ich mitbringen sollte?",
    created_at:new Date(Date.now()-50*60000).toISOString() },
  { id:"m3", sender:"other", type:"text",
    text:"Gerne! Alles, was dich inspiriert \u2013 und wenn du ein Instrument hast, bring es mit. Ansonsten ist alles da im Atelier.",
    created_at:new Date(Date.now()-46*60000).toISOString(), reaction:"\u2764\uFE0F", reactionCount:1 },
  { id:"m4", sender:"me", type:"text",
    text:"Perfekt, danke dir! \uD83C\uDF3F\uD83C\uDF4B",
    created_at:new Date(Date.now()-40*60000).toISOString() },
  { id:"m5", sender:"other", type:"voice", duration:"0:28",
    created_at:new Date(Date.now()-36*60000).toISOString() },
];

const PILLS = ["Alle","Begegnungen","Begleitung","Wirkung","Inspiration"];

function timeFmt(iso) {
  if (!iso) return "";
  const d   = new Date(iso);
  const now = new Date();
  const mins = (now - d) / 60000;
  if (mins < 60) { return `${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}`; }
  if (mins < 60*24) { return `${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}`; }
  if (mins < 60*24*2) return "Gestern";
  return `Sa ${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}`;
}

function groupByDay(notifs) {
  const today   = new Date(); today.setHours(0,0,0,0);
  const yest    = new Date(today); yest.setDate(yest.getDate()-1);
  const groups  = { today:[], week:[], older:[] };
  for (const n of notifs) {
    const d = new Date(n.created_at || Date.now()); d.setHours(0,0,0,0);
    if (d >= today)            groups.today.push(n);
    else if (d >= yest)        groups.week.push(n);
    else                       groups.older.push(n);
  }
  return groups;
}

/* ══════════════════════════════════════════════════════════════
   HERO IMPACT CARD
══════════════════════════════════════════════════════════════ */
function HeroImpactCard({ weeklyEur = 8950 }) {
  return (
    <div style={{
      margin:"0 0 0",
      borderRadius:24, overflow:"hidden",
      position:"relative", height:160,
      background:"linear-gradient(135deg,#1a4a45 0%,#2d6e5a 60%,#4a7a5a 100%)",
      boxShadow:"0 8px 32px rgba(0,0,0,0.12)",
      animation:"fadeUp 0.4s ease both",
      flexShrink:0,
    }}>
      {/* Community-Bild rechts */}
      <img
        src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&q=75"
        alt="" loading="eager"
        style={{ position:"absolute", right:0, top:0, height:"100%",
          width:"55%", objectFit:"cover", objectPosition:"center" }}
      />
      {/* Gradient Overlay */}
      <div style={{
        position:"absolute", inset:0,
        background:"linear-gradient(90deg,rgba(20,60,45,1) 0%,rgba(20,60,45,0.85) 40%,rgba(20,60,45,0.0) 100%)",
      }}/>
      {/* Content */}
      <div style={{ position:"relative", padding:"18px 20px", zIndex:2 }}>
        <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:6 }}>
          <span style={{ fontSize:20 }}>🌿</span>
          <span style={{ fontSize:12.5, fontWeight:700, color:"rgba(255,255,255,0.88)",
            letterSpacing:0.3 }}>
            Gemeinsam Wirkung schaffen
          </span>
        </div>
        <div style={{ fontSize:11, color:"rgba(255,255,255,0.60)", marginBottom:4 }}>
          Diese Woche wurden durch HUI
        </div>
        <div style={{ display:"flex", alignItems:"baseline", gap:8, marginBottom:4 }}>
          <div style={{ fontSize:36, fontWeight:900, color:"#fff", letterSpacing:-1,
            lineHeight:1.0, textShadow:"0 2px 8px rgba(0,0,0,0.2)" }}>
            {"\u20AC"}{new Intl.NumberFormat("de-DE").format(weeklyEur)}
          </div>
          <span style={{ fontSize:16, color:C.teal }}>{"↗"}</span>
        </div>
        <div style={{ fontSize:11.5, color:"rgba(255,255,255,0.65)" }}>
          f\u00fcr kreative Projekte erm\u00f6glicht.
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   NOTIFICATION CARD
══════════════════════════════════════════════════════════════ */
function NotifCard({ n, onAction, idx }) {
  const cfg = getType(n);
  const hasContent = !!(n.body || n.message || n.title);
  return (
    <div
      className="nc-card nc-tap"
      onClick={() => onAction(n)}
      style={{
        display:"flex", alignItems:"flex-start", gap:12,
        padding:"13px 16px",
        background: n.read ? "transparent" : C.card,
        borderRadius:18,
        borderLeft: n.type === "impact"
          ? `3px solid ${C.teal}`
          : "3px solid transparent",
        boxShadow: n.read ? "none" : "0 2px 12px rgba(0,0,0,0.07)",
        animation:`fadeUp 0.35s ${idx*0.04}s both`,
        cursor: hasContent ? "pointer" : "default",
        position:"relative",
      }}
    >
      <div style={{ position:"relative", flexShrink:0 }}>
        {n.avatar ? (
          <img src={n.avatar} alt="" loading="lazy"
            style={{ width:50, height:50, borderRadius:"50%", objectFit:"cover" }}/>
        ) : (
          <div style={{
            width:50, height:50, borderRadius:"50%",
            background:`linear-gradient(135deg, ${cfg.bg} 0%, ${cfg.color}22 100%)`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:22, flexShrink:0,
            border:`1.5px solid ${cfg.color}22`,
          }}>
            {n.icon_override || cfg.icon}
          </div>
        )}
        {!n.read && (
          <div style={{
            position:"absolute", top:-2, right:-2,
            width:10, height:10, borderRadius:"50%",
            background:C.teal, border:"1.5px solid #fff",
          }}/>
        )}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", justifyContent:"space-between", gap:6, marginBottom:3 }}>
          <div style={{ fontSize:13.5, fontWeight: n.read ? 500 : 700, color:C.ink, lineHeight:1.4, flex:1 }}>
            {n.message || n.body || n.title || ""}
          </div>
          <span style={{ fontSize:10.5, color:C.muted, whiteSpace:"nowrap", flexShrink:0 }}>
            {timeFmt(n.created_at)}
          </span>
        </div>
        {n.body ? (
          <div style={{ fontSize:11.5, color:C.teal, fontWeight:600, marginBottom:4 }}>
            {n.body}
          </div>
        ) : null}
      </div>
      {hasContent && (
        <div style={{ fontSize:14, color:C.muted, alignSelf:"center", marginLeft:4 }}>›</div>
      )}
    </div>
  );
}


function EmptyState({ onDiscover }) {
  const emptyActions = useHuiActions();
  function handleDiscover() {
    emptyActions[A.GO_DISCOVER]?.();
    onDiscover?.();
  }
  return (
    <div style={{
      flex:1, display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      padding:"48px 32px", textAlign:"center",
      animation:"fadeUp 0.5s ease both",
    }}>
      <div style={{
        width:90, height:90, borderRadius:"50%",
        background:`linear-gradient(135deg, ${C.tealPale} 0%, rgba(246,199,104,0.15) 100%)`,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:40, marginBottom:20,
        boxShadow:`0 8px 28px ${C.tealGlow}`,
      }}>
        {"🔔"}
      </div>
      <div style={{ fontSize:17, fontWeight:800, color:C.ink,
        letterSpacing:-0.4, marginBottom:8, lineHeight:1.3 }}>
        Noch ist es ruhig.
      </div>
      <div style={{ fontSize:13, color:C.muted, lineHeight:1.7,
        maxWidth:260, marginBottom:28 }}>
        Sobald Begegnungen, Projekte oder kreative Impulse entstehen, erscheinen sie hier.
      </div>
      <button onClick={handleDiscover} style={{
        background:`linear-gradient(135deg, ${C.teal} 0%, ${C.teal2} 100%)`,
        color:"#fff", border:"none", borderRadius:16,
        padding:"12px 26px", fontSize:14, fontWeight:700,
        cursor:"pointer",
        boxShadow:`0 6px 18px ${C.tealGlow}`,
      }}>
        Entdecken
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MINI CHAT DETAIL (rechte Spalte im Split-Layout)
══════════════════════════════════════════════════════════════ */
function MiniChatDetail({ chat, messages, onBack, onSend, isWide }) {
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [messages]);

  const other = chat?.other_profile || {};
  const msgList = messages?.length > 0 ? messages : MOCK_MESSAGES;

  return (
    <div style={{
      flex:1, display:"flex", flexDirection:"column",
      background:C.warm, height:"100%",
      animation:"slideR 0.3s ease both",
    }}>
      {/* ── Creator Header ──────────────────────────────────────── */}
      <div style={{
        padding:"16px 20px 12px",
        background:"rgba(254,252,249,0.95)",
        backdropFilter:"blur(16px)",
        WebkitBackdropFilter:"blur(16px)",
        borderBottom:`1px solid ${C.borderL}`,
        display:"flex", alignItems:"center", gap:12,
      }}>
        {!isWide && (
          <button className="nc-tap" onClick={onBack} style={{
            width:36, height:36, borderRadius:"50%",
            background:"rgba(0,0,0,0.05)", border:"none",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:18, color:C.ink2, flexShrink:0,
          }}>{"‹"}</button>
        )}
        {isWide && (
          <button className="nc-tap" onClick={onBack} style={{
            width:32, height:32, borderRadius:"50%",
            background:"rgba(0,0,0,0.05)", border:"none",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:16, color:C.ink2, flexShrink:0,
          }}>{"‹"}</button>
        )}
        <div style={{ position:"relative", flexShrink:0 }}>
          <img src={other.avatar_url || "https://i.pravatar.cc/50?img=47"} alt={other.display_name}
            style={{ width:44, height:44, borderRadius:"50%", objectFit:"cover",
              border:`2px solid ${C.teal}22` }}/>
          <div style={{
            position:"absolute", bottom:1, right:1,
            width:10, height:10, borderRadius:"50%",
            background:C.green, border:"2px solid #fff",
          }}/>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:15, fontWeight:800, color:C.ink, letterSpacing:-0.3 }}>
            {other.display_name}
          </div>
          <div style={{ fontSize:11, color:C.muted }}>
            {chat?.category || other.talent}
            {other.location ? ` · ${"\uD83D\uDCCD"} ${other.location}` : ""}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:2 }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:C.green,
              animation:"pulse 2s ease infinite" }}/>
            <span style={{ fontSize:11, color:C.teal, fontWeight:600 }}>
              {chat?.presenceLabel || "Gerade aktiv"}
            </span>
          </div>
        </div>
        <button className="nc-tap" style={{
          width:34, height:34, borderRadius:"50%",
          background:"rgba(0,0,0,0.05)", border:"none",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:14, color:C.ink2,
        }}>{"···"}</button>
      </div>

      {/* ── Booking Preview ─────────────────────────────────────── */}
      <div style={{
        margin:"12px 16px 8px",
        background:"rgba(255,255,255,0.80)",
        backdropFilter:"blur(10px)",
        borderRadius:16, overflow:"hidden",
        boxShadow:"0 2px 10px rgba(0,0,0,0.07)",
        display:"flex", alignItems:"stretch",
        flexShrink:0,
      }}>
        <div style={{ width:72, flexShrink:0 }}>
          <img src="https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=150&q=75"
            alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
        </div>
        <div style={{ flex:1, padding:"10px 12px" }}>
          <div style={{ fontSize:9.5, color:C.teal, fontWeight:700, letterSpacing:0.4, marginBottom:2 }}>
            {"KERAMIK WORKSHOP"}
          </div>
          <div style={{ fontSize:13, fontWeight:800, color:C.ink, lineHeight:1.25, marginBottom:4 }}>
            {chat?.booking_title || "Formen der Erde"}
          </div>
          <div style={{ fontSize:10.5, color:C.muted }}>
            {"19. Mai 2025 · 18:00 Uhr · Berlin"}
          </div>
          <button style={{ background:"none", border:"none", padding:0,
            fontSize:11.5, fontWeight:700, color:C.teal, cursor:"pointer", marginTop:4 }}>
            {"Details ansehen \u2192"}
          </button>
        </div>
      </div>

      {/* ── Messages ────────────────────────────────────────────── */}
      <div className="nc-scroll" style={{ flex:1, overflowY:"auto", padding:"4px 16px 8px" }}>
        <div style={{ textAlign:"center", padding:"8px 0 12px" }}>
          <span style={{ fontSize:11, color:C.muted, fontWeight:600,
            background:"rgba(0,0,0,0.05)", padding:"3px 10px", borderRadius:999 }}>
            Heute
          </span>
        </div>
        {msgList.map((msg, i) => {
          const isOwn = msg.sender === "me";
          if (msg.type === "voice") return (
            <div key={msg.id || i} style={{ display:"flex", alignItems:"flex-end", gap:8,
              marginBottom:10, animation:`msgIn 0.3s ${i*0.05}s both` }}>
              <img src={other.avatar_url || "https://i.pravatar.cc/32?img=47"} alt=""
                style={{ width:26, height:26, borderRadius:"50%", objectFit:"cover", flexShrink:0 }}/>
              <div style={{
                display:"flex", alignItems:"center", gap:8,
                background:"rgba(255,255,255,0.92)",
                borderRadius:"16px 16px 16px 4px",
                padding:"9px 13px",
                boxShadow:"0 2px 10px rgba(0,0,0,0.08)",
                minWidth:160,
              }}>
                <button style={{ width:30, height:30, borderRadius:"50%",
                  background:C.teal, border:"none", cursor:"pointer",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:13, color:"#fff" }}>{"▶"}</button>
                <div style={{ flex:1, display:"flex", alignItems:"center", gap:1.5, height:20 }}>
                  {Array.from({length:18}).map((_,k) => (
                    <div key={k} style={{
                      width:2, borderRadius:2,
                      background:`${C.teal}99`,
                      height:`${22+Math.sin(k*0.9)*14+Math.cos(k*1.5)*8}%`,
                    }}/>
                  ))}
                </div>
                <span style={{ fontSize:10.5, color:C.muted, flexShrink:0 }}>{msg.duration || "0:28"}</span>
              </div>
            </div>
          );
          return (
            <div key={msg.id || i} style={{
              display:"flex", flexDirection:isOwn?"row-reverse":"row",
              alignItems:"flex-end", gap:8, marginBottom:8,
              animation:`msgIn 0.3s ${i*0.05}s both`,
            }}>
              {!isOwn && (
                <img src={other.avatar_url || "https://i.pravatar.cc/32?img=47"} alt=""
                  style={{ width:26, height:26, borderRadius:"50%", objectFit:"cover",
                    flexShrink:0, alignSelf:"flex-end" }}/>
              )}
              <div style={{ maxWidth:"70%", display:"flex", flexDirection:"column",
                alignItems:isOwn?"flex-end":"flex-start" }}>
                <div style={{
                  padding:"10px 14px", fontSize:13.5, lineHeight:1.55,
                  whiteSpace:"pre-wrap",
                  ...(isOwn ? {
                    background:`linear-gradient(135deg, ${C.teal} 0%, ${C.teal2} 100%)`,
                    color:"#fff", borderRadius:"16px 16px 4px 16px",
                    boxShadow:`0 4px 14px ${C.tealGlow}`,
                  } : {
                    background:"rgba(255,255,255,0.92)",
                    color:C.ink, borderRadius:"16px 16px 16px 4px",
                    boxShadow:"0 2px 10px rgba(0,0,0,0.08)",
                    backdropFilter:"blur(8px)",
                  }),
                }}>
                  {msg.text}
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:3,
                  flexDirection:isOwn?"row-reverse":"row" }}>
                  {msg.reaction && (
                    <div style={{ fontSize:10.5, background:"rgba(255,255,255,0.9)",
                      borderRadius:999, padding:"2px 7px",
                      boxShadow:"0 1px 5px rgba(0,0,0,0.10)",
                      display:"flex", alignItems:"center", gap:2 }}>
                      {msg.reaction}
                      {msg.reactionCount > 1 && <span style={{ fontSize:10, color:C.muted }}>{msg.reactionCount}</span>}
                    </div>
                  )}
                  <span style={{ fontSize:10, color:C.muted }}>{timeFmt(msg.created_at)}</span>
                  {isOwn && <span style={{ fontSize:10, color:C.teal }}>{"✓✓"}</span>}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef}/>
      </div>

      {/* ── Input Bar ───────────────────────────────────────────── */}
      <div style={{
        padding:"8px 14px max(18px,env(safe-area-inset-bottom,18px))",
        background:"rgba(254,252,249,0.95)",
        backdropFilter:"blur(14px)",
        WebkitBackdropFilter:"blur(14px)",
        borderTop:`1px solid ${C.borderL}`,
        display:"flex", alignItems:"center", gap:8, flexShrink:0,
      }}>
        <button className="nc-tap" style={{
          width:34, height:34, borderRadius:"50%",
          background:"rgba(0,0,0,0.05)", border:"none",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:18, color:C.muted, flexShrink:0,
        }}>{"+"}</button>
        <div style={{
          flex:1, background:"rgba(255,255,255,0.80)",
          backdropFilter:"blur(8px)",
          borderRadius:20, border:`1px solid ${C.border}`,
          display:"flex", alignItems:"center", padding:"0 12px", height:40,
        }}>
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key==="Enter" && !e.shiftKey && setInput("")}
            placeholder="Nachricht schreiben..."
            style={{ flex:1, border:"none", background:"none",
              fontSize:13.5, color:C.ink, outline:"none" }}/>
          <button className="nc-tap" style={{ background:"none", border:"none",
            fontSize:17, color:C.muted }}>{"😊"}</button>
        </div>
        <button className="nc-tap" style={{
          width:40, height:40, borderRadius:"50%", flexShrink:0,
          background:`linear-gradient(135deg, ${C.teal} 0%, ${C.teal2} 100%)`,
          border:"none",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:17, color:"#fff",
          boxShadow:`0 4px 12px ${C.tealGlow}`,
        }}>{"🎤"}</button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   INSPIRE BANNER (unten in der Sidebar)
══════════════════════════════════════════════════════════════ */
function InspireBanner({ onSettings }) {
  return (
    <div style={{
      margin:"12px 16px 20px",
      background:`linear-gradient(135deg, ${C.tealPale} 0%, rgba(246,199,104,0.12) 100%)`,
      borderRadius:20, padding:"16px 18px",
      border:`1px solid rgba(32,211,194,0.15)`,
      boxShadow:"0 2px 10px rgba(0,0,0,0.05)",
      display:"flex", alignItems:"flex-start", gap:14,
    }}>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:13.5, fontWeight:800, color:C.ink,
          marginBottom:4, lineHeight:1.3 }}>
          Bleibe inspiriert
        </div>
        <div style={{ fontSize:12, color:C.muted, lineHeight:1.55, marginBottom:12 }}>
          Aktiviere wichtige Mitteilungen, damit du keine wertvollen Momente verpasst.
        </div>
        <button className="nc-tap" onClick={onSettings} style={{
          background:`linear-gradient(135deg, ${C.teal} 0%, ${C.teal2} 100%)`,
          color:"#fff", border:"none", borderRadius:12,
          padding:"9px 16px", fontSize:12, fontWeight:700,
          cursor:"pointer",
          boxShadow:`0 4px 10px ${C.tealGlow}`,
        }}>
          Einstellungen {"\u00F6ffnen"}
        </button>
      </div>
      <div style={{ fontSize:38, opacity:0.75, flexShrink:0 }}>{"🪴"}</div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   NOTIFICATION FEED (linke Spalte)
══════════════════════════════════════════════════════════════ */
function NotifFeed({
  notifs, weeklyEur, onAction, onFilterChange,
  activeFilter, activeId, onClose, isWide,
}) {
  const [onlyImportant, setOnlyImportant] = useState(false);

  const filtered = notifs.filter(n => {
    if (onlyImportant && n.read) return false;
    if (activeFilter === "Alle") return true;
    if (activeFilter === "Begegnungen") return n.type === "begegnung";
    if (activeFilter === "Begleitung")  return n.type === "buchung";
    if (activeFilter === "Wirkung")     return n.type === "impact";
    if (activeFilter === "Inspiration") return n.type === "inspiration";
    return true;
  });

  const groups = groupByDay(filtered);
  const GROUP_LABELS = { today:"Heute", week:"Diese Woche", older:"Fr\u00FCher" };

  return (
    <div style={{
      width: isWide ? 320 : "100%",
      flexShrink:0,
      background:C.cream,
      borderRight: isWide ? `1px solid ${C.border}` : "none",
      display:"flex", flexDirection:"column",
      height:"100%",
    }}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{
        padding:"max(52px,env(safe-area-inset-top,52px)) 20px 12px",
        background:"rgba(254,252,249,0.95)",
        backdropFilter:"blur(16px)",
        WebkitBackdropFilter:"blur(16px)",
        borderBottom:`1px solid ${C.borderL}`,
        flexShrink:0,
      }}>
        {/* Titel Row */}
        <div style={{ display:"flex", alignItems:"flex-start",
          justifyContent:"space-between", marginBottom:12 }}>
          <div>
            <div style={{ fontSize:26, fontWeight:900, color:C.ink,
              letterSpacing:-0.8, lineHeight:1.1 }}>
              {"Bewegungen"}<span style={{ color:C.teal }}>{"·"}</span>
            </div>
            <div style={{ fontSize:12, color:C.muted, marginTop:3, lineHeight:1.5 }}>
              {"Menschen, Projekte und\nBegegnungen entwickeln sich."}
            </div>
          </div>
          <div style={{ display:"flex", gap:7, flexShrink:0, flexDirection:"column",
            alignItems:"flex-end", marginTop:4 }}>
            <button className="nc-tap" onClick={() => setOnlyImportant(p => !p)}
              style={{
                display:"flex", alignItems:"center", gap:5,
                background: onlyImportant ? C.tealPale : C.card,
                border:`1px solid ${onlyImportant ? C.teal : C.border}`,
                borderRadius:999, padding:"5px 12px",
                fontSize:11.5, fontWeight:600,
                color: onlyImportant ? C.teal : C.ink2,
                boxShadow:"0 1px 6px rgba(0,0,0,0.06)",
              }}>
              <span style={{ fontSize:12 }}>{"⚙"}</span>
              Nur Wichtiges
            </button>
            <button className="nc-tap" style={{
              display:"flex", alignItems:"center", gap:5,
              background:C.card, border:`1px solid ${C.border}`,
              borderRadius:999, padding:"5px 12px",
              fontSize:11.5, fontWeight:600, color:C.ink2,
              boxShadow:"0 1px 6px rgba(0,0,0,0.06)",
            }}>
              <span style={{ fontSize:12 }}>{"✓"}</span>
              Alles gelesen
            </button>
          </div>
        </div>

        {/* Hero Impact Card */}
        <HeroImpactCard weeklyEur={weeklyEur} />
      </div>

      {/* ── Filter Pills ────────────────────────────────────────── */}
      <div className="nc-scroll" style={{
        display:"flex", gap:7, overflowX:"auto",
        padding:"10px 16px", flexShrink:0,
        borderBottom:`1px solid ${C.borderL}`,
      }}>
        {PILLS.map(pill => {
          const active = activeFilter === pill;
          return (
            <button key={pill} className="nc-pill"
              onClick={() => onFilterChange(pill)}
              style={{
                background: active ? C.teal : C.card,
                color: active ? "#fff" : C.ink2,
                padding:"6px 14px",
                boxShadow: active
                  ? `0 3px 10px ${C.tealGlow}`
                  : "0 1px 4px rgba(0,0,0,0.06)",
                fontWeight: active ? 700 : 500,
                transform: active ? "scale(1.03)" : "scale(1)",
                display:"flex", alignItems:"center", gap:5,
              }}>
              {pill === "Alle" && (
                <span style={{
                  minWidth:18, height:18, borderRadius:9,
                  background: active ? "rgba(255,255,255,0.25)" : C.teal,
                  color: active ? "#fff" : "#fff",
                  fontSize:10, fontWeight:700,
                  display:"inline-flex", alignItems:"center", justifyContent:"center",
                  padding:"0 4px",
                }}>{notifs.filter(n => !n.read).length}</span>
              )}
              {pill}
            </button>
          );
        })}
        <button className="nc-pill" style={{
          background:C.card, color:C.muted, padding:"6px 12px",
          boxShadow:"0 1px 4px rgba(0,0,0,0.06)", fontSize:11.5,
          display:"flex", alignItems:"center", gap:4,
        }}>
          <span>{"⚙"}</span> Einstellungen
        </button>
      </div>

      {/* ── Notif-Liste ─────────────────────────────────────────── */}
      <div className="nc-scroll" style={{ flex:1, overflowY:"auto", padding:"4px 0" }}>
        {filtered.length === 0 ? (
          <EmptyState onDiscover={onClose} />
        ) : (
          Object.entries(groups||{}).map(([key, items]) => {
            if (!items.length) return null;
            return (
              <div key={key}>
                <div style={{ padding:"10px 16px 4px",
                  fontSize:11, fontWeight:700, color:C.muted, letterSpacing:0.5 }}>
                  {GROUP_LABELS[key] || key}
                </div>
                {items.map((n, i) => (
                  <NotifCard
                    key={n.id}
                    n={n}
                    idx={i}
                    onAction={onAction}
                  />
                ))}
              </div>
            );
          })
        )}
        <InspireBanner onSettings={() => {}} />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   EXPORTED HOOK (rückwärtskompatibel)
══════════════════════════════════════════════════════════════ */
export function useNotifCount() {
  const { unreadNotifCount } = useAppState();
  return unreadNotifCount ?? 0;
}

/* ══════════════════════════════════════════════════════════════
   MAIN: NotificationCenter
   Props: { onClose, onNavigate } — unverändert
══════════════════════════════════════════════════════════════ */
export default function NotificationCenter({ onClose, onNavigate }) {
  // HINWEIS: Diese Komponente ist in Home.jsx deaktiviert.
  // Sie wird nicht mehr gerendert. Resonanzzentrum übernimmt.
  const actions = useHuiActions();
  const {
    notifications,
    unreadNotifCount,
    markNotifsRead,
    loadNotifications,
  } = useAppState() ?? {};

  const [activeFilter,  setActiveFilter]  = useState("Alle");
  const [detailNotif,   setDetailNotif]   = useState(null);
  const [activeNotif,   setActiveNotif]   = useState(null);
  const [weeklyEur,     setWeeklyEur]     = useState(8950);
  const safeInnerWidth = typeof window !== "undefined" ? window.innerWidth : 390;
  const [isWide, setIsWide] = React.useState(safeInnerWidth >= 1200);
  React.useEffect(() => {
    const fn = () => setIsWide(window.innerWidth >= 1200);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  // ── Daten laden ───────────────────────────────────────────────────
  useEffect(() => {
    loadNotifications();
    // Weekly impact EUR aus payments
    (async () => {
      try {
        const weekAgo = new Date(Date.now() - 7*24*60*60*1000).toISOString();
        const { data } = await supabase
          .from("payments").select("impact_eur").gte("created_at", weekAgo);
        const total = (data||[]).reduce((s,r) => s+(r.impact_eur||0), 0);
        if (total > 0) setWeeklyEur(total);
      } catch { /* silent */ }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Notif-Action — Batch 4: Action Engine ───────────────────────
  const handleAction = useCallback(async (n) => {
    // 1. Mark read in DB
    if (!n.read) {
      try {
        await supabase.from("notifications").update({ read:true }).eq("id", n.id);
        loadNotifications();
      } catch { /* silent */ }
    }
    // 2. Route via Action Engine — type-safe, logged
    if (n.type === "begegnung" || n.type === "buchung") {
      if (n.sender_id) {
        actions[A.OPEN_CHAT]?.({
          source: S.NOTIFICATIONS,
          recipient: {
            id:           n.sender_id,
            display_name: n.sender_name   || n.from_name   || null,
            avatar_url:   n.sender_avatar || n.from_avatar || null,
          },
        });
        onClose?.();
      } else {
        setActiveNotif(n); // fallback: inline detail
      }
    } else if (n.type === "impact" || n.type === "community") {
      actions[A.GO_IMPACT]?.();
      onClose?.();
    } else if (n.type === "inspiration") {
      actions[A.GO_DISCOVER]?.();
      onClose?.();
    } else if (n.type === "follow" && n.sender_id) {
      actions[A.OPEN_PROFILE]?.({ source: S.NOTIFICATIONS, creatorId: n.sender_id,
        creator: { name: n.sender_name || null, avatar_url: n.sender_avatar || null },
      });
      onClose?.();
    } else if (n.action_url) {
      } else if (n.type === 'support_ticket' || n.type === 'support_ticket_reply') {
        onNavigate?.('/studio?section=tickets');
      } else {
        onNavigate?.(n.action_url); // generic fallback for unknown types
    }
  }, [actions, loadNotifications, onNavigate, onClose]);

  const handleMarkAllRead = useCallback(async () => {
    try {
      await supabase.from("notifications").update({ read:true }).eq("read", false);
      markNotifsRead();
    } catch { /* silent */ }
  }, [markNotifsRead]);

  // ── Daten: DB oder Mock ───────────────────────────────────────────
  // Phase 4E: kein Mock-Fallback — echter Empty State
  const notifList = notifications || [];

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:400,
      display:"flex", flexDirection:"row",
      fontFamily:"-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif",
      overflow:"hidden",
      background:C.cream,
    }}>
      <style>{CSS}</style>

      {/* ── NOTIFICATION FEED (links) ────────────────────────────── */}
      {(isWide || !activeNotif) && (
        <NotifFeed
          notifs={notifList}
          weeklyEur={weeklyEur}
          onAction={(n) => {
              const d = (n.data && typeof n.data === "object") ? n.data : {};
              const fullText = d.message || d.admin_reply || d.reason || "";
              const hasDetail = fullText.length > 0 || (n.title && n.title.length > 50) || n.type?.includes("support") || n.type?.includes("rejected") || n.type?.includes("approved") || n.type === "broadcast";
              if (hasDetail) { if (!n.read) { supabase.from("notifications").update({ read:true }).eq("id", n.id).then(()=>{}); } setDetailNotif(n); }
              else { handleAction(n); }
            }}
          onFilterChange={setActiveFilter}
          activeFilter={activeFilter}
          activeId={activeNotif?.id}
          onClose={onClose}
          isWide={isWide}
        />
      )}

      {/* ── CHAT DETAIL (rechts) ─────────────────────────────────── */}
      {(isWide || activeNotif) && (
        activeNotif ? (
          <MiniChatDetail
            chat={MOCK_CHAT}
            messages={MOCK_MESSAGES}
            onBack={() => setActiveNotif(null)}
            isWide={isWide}
          />
        ) : isWide ? (
          <div style={{ flex:1, display:"flex", alignItems:"center",
            justifyContent:"center", background:C.warm }}>
            <EmptyState onDiscover={onClose} />
          </div>
        ) : null
      )}

      {/* ── Detail-Overlay ───────────────────────────────────── */}
      {detailNotif && (() => {
        const n   = detailNotif;
        const cfg = getType(n);
        const d   = (n.data && typeof n.data === "object") ? n.data : {};
        const isRejection = n.type?.includes("rejected") || n.type?.includes("reject");
        const isApproval  = n.type?.includes("approved") || n.type?.includes("approve");
        const accentColor = isRejection ? "#DC2626" : isApproval ? C.teal : cfg.color || C.teal;
        const fullText    = d.message || d.admin_reply || d.reason || d.body || n.body || "";
        const titleText   = d.title || d.subject || n.title || n.message || cfg.label;
        const subText     = isRejection ? "Ablehnungsgrund" : isApproval ? "Freigabe" : cfg.label?.toUpperCase();
        return (
          <div
            onClick={() => setDetailNotif(null)}
            style={{
              position:"fixed", inset:0, zIndex:99999,
              background:"rgba(0,0,0,0.5)",
              display:"flex", alignItems:"center", justifyContent:"center",
              padding:"20px",
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                background:"#fff",
                borderRadius:24,
                padding:"32px 24px 24px",
                maxWidth:400, width:"100%",
                boxShadow:"0 20px 60px rgba(0,0,0,0.25)",
                maxHeight:"80vh", overflowY:"auto",
                textAlign:"center",
              }}
            >
              <div style={{ fontSize:36, marginBottom:12 }}>{n.icon_override || cfg.icon}</div>
              <div style={{ fontSize:18, fontWeight:800, color:"#1a1a1a", marginBottom:6, lineHeight:1.3 }}>
                {titleText}
              </div>
              {subText && (
                <div style={{ fontSize:11, fontWeight:700, letterSpacing:1, color:C.muted, marginBottom:16, textTransform:"uppercase" }}>
                  {subText}
                </div>
              )}
              {fullText ? (
                <div style={{
                  background: isRejection ? "#FEF2F2" : isApproval ? "rgba(22,215,197,0.08)" : "#F9F9F9",
                  border: `1px solid ${isRejection ? "#FECACA" : isApproval ? "rgba(22,215,197,0.3)" : "#eee"}`,
                  borderRadius:14, padding:"16px", marginBottom:20,
                  fontSize:14, lineHeight:1.7, color:"#2a2a2a", textAlign:"left",
                  wordBreak:"break-word",
                }}>
                  {fullText}
                </div>
              ) : (
                <div style={{ color:C.muted, fontSize:13, marginBottom:20 }}>
                  {n.body || n.message || "Keine weiteren Details."}
                </div>
              )}
              {d.project_name && (
                <div style={{ fontSize:12, color:C.muted, marginBottom:8 }}>
                  Projekt: <strong>{d.project_name}</strong>
                </div>
              )}
              <button
                onClick={() => setDetailNotif(null)}
                style={{
                  width:"100%", padding:"14px",
                  borderRadius:99, border:"none",
                  background: accentColor,
                  color:"#fff", fontSize:15, fontWeight:700,
                  cursor:"pointer", fontFamily:"inherit",
                }}
              >
                Verstanden
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}