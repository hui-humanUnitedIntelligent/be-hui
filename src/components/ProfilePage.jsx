// MyProfilePage.jsx — HUI "Mein kreatives Zentrum" v1
// Screenshot-exact: "Du" Design — eigene kreative Präsenz
// DNA: soft cream, teal, coral, Apple×Airbnb×Calm
// Replaces: src/components/ProfilePage.jsx
//
// Props:
//   onTalentAnbieten — Wirker-Flow öffnen
//   onLogout         — Auth logout
//   onViewPublicProfile — eigenes Fremdprofil ansehen
//   onClose          — zurück (wenn als Overlay)

import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/AuthContext";
import { BestellungenPage, NachrichtenPage, GespeichertePage, MeineInhaltePage, AnalyticsPage, EinnahmenPage, VerfuegbarkeitPage, ImpactSubPage, KontoPage } from "./MeinHUI_SubPages";
import EditProfile from "../pages/EditProfile";

/* ─────────────────────────────────────────────────────────
   DESIGN TOKENS
───────────────────────────────────────────────────────── */
const C = {
  teal:       "#16D7C5",
  teal2:      "#11C5B7",
  tealGlow:   "rgba(22,215,197,0.20)",
  tealPale:   "#E8FAF8",
  tealBorder: "rgba(22,215,197,0.28)",
  coral:      "#FF8A6B",
  coralPale:  "#FFF2EE",
  gold:       "#F5A623",
  green:      "#22C55E",
  cream:      "#F9F7F4",
  warm:       "#FFFCF9",
  card:       "#FFFFFF",
  ink:        "#1A1A1A",
  ink2:       "#3D3D3D",
  ink3:       "#5A5A5A",
  muted:      "#8A8A8A",
  muted2:     "#C0C0C0",
  border:     "rgba(0,0,0,0.06)",
  shadow:     "rgba(0,0,0,0.07)",
  shadowMd:   "rgba(0,0,0,0.11)",
};

/* ─────────────────────────────────────────────────────────
   CSS
───────────────────────────────────────────────────────── */
const CSS = `
  @keyframes mpFadeUp {
    from { opacity:0; transform:translateY(14px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes mpFadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes mpPulse   { 0%,100%{opacity:1} 50%{opacity:0.45} }
  @keyframes mpSkeleton {
    0%   { background-position:200% center; }
    100% { background-position:-200% center; }
  }
  @keyframes mpSlide   { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }

  .mp-root * { box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
  .mp-root   { font-family:-apple-system,"SF Pro Display",system-ui,sans-serif; }
  .mp-tap    { cursor:pointer; transition:opacity 0.16s ease, transform 0.16s ease; }
  .mp-tap:active { opacity:0.70; transform:scale(0.965); }
  .mp-scroll::-webkit-scrollbar { display:none; }
  .mp-scroll { -ms-overflow-style:none; scrollbar-width:none; }

  .mp-tab-line {
    position:absolute; bottom:0; left:50%; transform:translateX(-50%);
    width:75%; height:2.5px; border-radius:2px;
    background:${C.teal};
  }
  .mp-skeleton {
    background:linear-gradient(90deg,
      rgba(0,0,0,0.05) 25%, rgba(0,0,0,0.09) 50%, rgba(0,0,0,0.05) 75%);
    background-size:400% 100%;
    animation:mpSkeleton 1.7s ease-in-out infinite;
    border-radius:12px;
  }
`;

/* ─────────────────────────────────────────────────────────
   PRESENCE LABELS
───────────────────────────────────────────────────────── */
const PRESENCE_OPTIONS = [
  "Gerade im Atelier",
  "In kreativer Phase",
  "Offen für Begegnungen",
  "Arbeitet an neuer Serie",
  "Im Studio",
  "In der Natur",
  "Unterwegs",
  "Tief in einem Projekt",
  "Für Ideen offen",
];

/* ─────────────────────────────────────────────────────────
   TABS
───────────────────────────────────────────────────────── */
const TABS = [
  { key:"bewegung",   label:"Bewegung"   },
  { key:"werke",      label:"Werke"      },
  { key:"erlebnisse", label:"Erlebnisse" },
  { key:"wirkung",    label:"Wirkung"    },
  { key:"verbindung", label:"Verbindung" },
  { key:"raum",       label:"Raum"       },
];

/* ─────────────────────────────────────────────────────────
   WORLDS
───────────────────────────────────────────────────────── */
const WORLDS = [
  { label:"Atelier",    emoji:"🏺" },
  { label:"Projekte",   emoji:"🌿" },
  { label:"Natur",      emoji:"☀️" },
  { label:"Momente",    emoji:"📸" },
  { label:"Community",  emoji:"👥" },
  { label:"Musik",      emoji:"🎵" },
  { label:"Inspiration",emoji:"✨" },
];

/* ─────────────────────────────────────────────────────────
   HELPER: Zahlen formatieren
───────────────────────────────────────────────────────── */
function fmtNum(n) {
  if (!n) return "0";
  if (n >= 1000) return (n/1000).toFixed(1).replace(/\.0$/,"") + "K";
  return String(n);
}

/* ─────────────────────────────────────────────────────────
   SKELETON
───────────────────────────────────────────────────────── */
function PageSkeleton() {
  return (
    <div style={{ background:C.cream, minHeight:"100vh" }}>
      <div style={{ height:230, background:"rgba(0,0,0,0.07)" }}/>
      <div style={{ padding:"0 20px", marginTop:-40 }}>
        <div style={{ width:84, height:84, borderRadius:"50%",
          border:`4px solid ${C.card}`, background:"rgba(0,0,0,0.09)" }}/>
        <div style={{ marginTop:12 }}>
          <div className="mp-skeleton" style={{ width:80, height:22, marginBottom:8 }}/>
          <div className="mp-skeleton" style={{ width:130, height:13, marginBottom:6 }}/>
          <div className="mp-skeleton" style={{ width:100, height:13 }}/>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   STAT ITEM (4 Spalten)
───────────────────────────────────────────────────────── */
function StatItem({ value, label }) {
  return (
    <div style={{ flex:1, textAlign:"center" }}>
      <div style={{ fontSize:17, fontWeight:900, color:C.ink,
        letterSpacing:-0.5, lineHeight:1.2 }}>
        {value}
      </div>
      <div style={{ fontSize:11, color:C.muted, marginTop:2,
        fontWeight:500, letterSpacing:0.1 }}>
        {label}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   WIRKUNG CARD (screenshot-exact)
───────────────────────────────────────────────────────── */
function WirkungCard({ impact, bookingCount, profile }) {
  const impactVal = impact || profile?.impact_eur || 0;
  const count     = bookingCount || 3;

  // Fake-Avatare für den Cluster
  const clusterColors = [
    "linear-gradient(135deg,#FFB347,#FF8A6B)",
    "linear-gradient(135deg,#89CFF0,#4A90D9)",
    "linear-gradient(135deg,#B5EAD7,#11C5B7)",
  ];

  return (
    <div style={{
      background:C.card,
      borderRadius:20,
      padding:"16px 18px",
      boxShadow:`0 2px 10px ${C.shadow}, 0 6px 24px rgba(0,0,0,0.05)`,
      border:`1px solid ${C.border}`,
      display:"flex", alignItems:"flex-end",
      gap:12,
      animation:"mpFadeUp 0.5s 0.15s both",
    }}>
      {/* Links: Text + Avatar-Cluster */}
      <div style={{ flex:1 }}>
        {/* Heading mit Leaf-Icon */}
        <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:8 }}>
          <span style={{ fontSize:17 }}>🌿</span>
          <span style={{ fontSize:14, fontWeight:800, color:C.ink,
            letterSpacing:-0.3 }}>
            Deine Wirkung
          </span>
        </div>

        {/* Beschreibung */}
        <p style={{ fontSize:12.5, color:C.muted, lineHeight:1.6,
          margin:"0 0 12px", fontWeight:450 }}>
          Durch deine Workshops und Projekte{" "}
          konnten bereits {count} kreative{" "}
          Projekte unterstützt werden.
        </p>

        {/* Avatar Cluster */}
        <div style={{ display:"flex", alignItems:"center" }}>
          {clusterColors.map((bg, i) => (
            <div key={i} style={{
              width:30, height:30, borderRadius:"50%",
              background:bg,
              border:`2.5px solid ${C.card}`,
              marginLeft: i > 0 ? -10 : 0,
              flexShrink:0,
              boxShadow:`0 2px 6px ${C.shadowMd}`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:12,
            }}>
              {["🧑","👩","🧑"][i]}
            </div>
          ))}
        </div>
      </div>

      {/* Rechts: Impact-Betrag */}
      <div style={{
        flexShrink:0, textAlign:"center",
        background:`${C.teal}10`,
        borderRadius:16, padding:"10px 14px",
        border:`1px solid ${C.tealBorder}`,
        minWidth:90,
      }}>
        <div style={{ fontSize:19, fontWeight:900, color:C.ink,
          letterSpacing:-0.6, lineHeight:1.1 }}>
          {"€" + (impactVal || "8.950").toLocaleString("de-DE")}
        </div>
        <div style={{ fontSize:10.5, color:C.muted, marginTop:3,
          fontWeight:500 }}>
          Gesamte Wirkung
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   WORLD BUBBLE
───────────────────────────────────────────────────────── */
function WorldBubble({ label, emoji, img, idx }) {
  return (
    <div style={{
      display:"flex", flexDirection:"column", alignItems:"center", gap:6,
      flexShrink:0,
      animation:`mpFadeUp 0.45s ${0.08 + idx*0.05}s both`,
    }}>
      <div style={{
        width:62, height:62, borderRadius:"50%",
        overflow:"hidden",
        border:`2px solid ${C.card}`,
        boxShadow:`0 3px 12px ${C.shadowMd}, 0 1px 4px ${C.shadow}`,
        background:`linear-gradient(135deg, ${C.tealPale}, ${C.coralPale})`,
        display:"flex", alignItems:"center", justifyContent:"center",
        flexShrink:0,
      }}>
        {img
          ? <img src={img} alt={label} loading="lazy"
              style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
          : <span style={{ fontSize:22 }}>{emoji}</span>
        }
      </div>
      <div style={{ fontSize:11, fontWeight:600, color:C.ink2,
        textAlign:"center", letterSpacing:0.1 }}>
        {label}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   ACTIVITY CARD — horizontale Liste (screenshot: links Bild, rechts Text+Badge)
───────────────────────────────────────────────────────── */
function ActivityRow({ item, idx }) {
  const badgeColor = {
    "Morgen": C.teal,
    "Heute":  C.coral,
    "Neu":    C.green,
    "Bald":   C.gold,
  }[item.badge] || C.muted;

  return (
    <div style={{
      display:"flex", alignItems:"center", gap:13,
      background:C.card,
      borderRadius:18, padding:"12px 14px",
      boxShadow:`0 2px 8px ${C.shadow}, 0 4px 16px rgba(0,0,0,0.04)`,
      border:`1px solid ${C.border}`,
      animation:`mpFadeUp 0.45s ${idx*0.07}s both`,
    }}>
      {/* Bild links */}
      <div style={{
        width:60, height:60, borderRadius:14, flexShrink:0,
        overflow:"hidden",
        background:`linear-gradient(135deg, ${C.tealPale}, ${C.coralPale})`,
      }}>
        {item.img
          ? <img src={item.img} alt={item.title} loading="lazy"
              style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
          : <div style={{ width:"100%", height:"100%",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:24 }}>
              {item.emoji || "🌿"}
            </div>
        }
      </div>

      {/* Text rechts */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:15, fontWeight:800, color:C.ink,
          letterSpacing:-0.3, lineHeight:1.3, marginBottom:3 }}>
          {item.title}
        </div>
        <div style={{ fontSize:12, color:C.muted, lineHeight:1.4 }}>
          {item.subtitle}
        </div>
        {item.meta && (
          <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:5 }}>
            {/* Mini-Avatar Cluster */}
            <div style={{ display:"flex" }}>
              {[1,2,3].map(i => (
                <div key={i} style={{
                  width:18, height:18, borderRadius:"50%",
                  background:`linear-gradient(135deg, ${C.tealPale}, ${C.teal})`,
                  border:`1.5px solid ${C.card}`,
                  marginLeft: i > 1 ? -6 : 0,
                  flexShrink:0,
                }}/>
              ))}
            </div>
            <span style={{ fontSize:11.5, color:C.muted, fontWeight:500 }}>
              {item.meta}
            </span>
          </div>
        )}
      </div>

      {/* Badge rechts */}
      {item.badge && (
        <div style={{
          padding:"4px 10px", borderRadius:12, flexShrink:0,
          background:`${badgeColor}16`,
          border:`1px solid ${badgeColor}35`,
          fontSize:12, fontWeight:700, color:badgeColor,
        }}>
          {item.badge}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   IMPACT JOURNEY CARD
───────────────────────────────────────────────────────── */
function ImpactJourneyCard({ impact, bookings, followers }) {
  const rows = [
    { icon:"✨", text:"Projekte unterstützt",    value: Math.max(3, Math.round((impact||0)/3000)) },
    { icon:"💚", text:"Menschen inspiriert",      value: (followers||127) + "+" },
    { icon:"🌱", text:"Wirkung ermöglicht",       value: "€" + (impact||"8.950").toLocaleString("de-DE") },
    { icon:"🤝", text:"Begegnungen geschaffen",   value: bookings || 24 },
  ];
  return (
    <div style={{
      background:`linear-gradient(135deg, #F2FBF9 0%, ${C.card} 100%)`,
      borderRadius:22,
      padding:"18px",
      border:`1.5px solid ${C.tealBorder}`,
      boxShadow:`0 4px 20px ${C.tealGlow}`,
      animation:"mpFadeUp 0.5s both",
    }}>
      <div style={{ fontSize:13, fontWeight:800, color:C.teal,
        letterSpacing:0.4, marginBottom:14, textTransform:"uppercase" }}>
        Deine Impact Journey
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:11 }}>
        {rows.map((r,i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{
              width:36, height:36, borderRadius:12, flexShrink:0,
              background:`${C.teal}14`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:17,
            }}>{r.icon}</div>
            <div style={{ flex:1, fontSize:13, color:C.muted }}>{r.text}</div>
            <div style={{ fontSize:16, fontWeight:900, color:C.ink,
              letterSpacing:-0.3 }}>{r.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   COMMUNITY CARD
───────────────────────────────────────────────────────── */
function CommunityCard({ connections, profile }) {
  return (
    <div style={{
      background:C.card, borderRadius:22, padding:"16px 18px",
      boxShadow:`0 2px 10px ${C.shadow}`,
      border:`1px solid ${C.border}`,
      animation:"mpFadeUp 0.5s 0.1s both",
    }}>
      <div style={{ fontSize:13, fontWeight:800, color:C.ink2,
        letterSpacing:0.2, marginBottom:12, textTransform:"uppercase" }}>
        Deine Community
      </div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}>
        {[
          { label:"Aktive Verbindungen", value:connections||189, icon:"🔗" },
          { label:"Kreative Kreise",     value:7,                icon:"🌐" },
          { label:"Kollaborationen",     value:12,               icon:"🤝" },
          { label:"Neue Begegnungen",    value:3,                icon:"✨" },
        ].map((item,i) => (
          <div key={i} style={{
            flex:"1 0 40%",
            background:`${C.cream}`,
            borderRadius:16, padding:"12px 14px",
            border:`1px solid ${C.border}`,
          }}>
            <div style={{ fontSize:18, marginBottom:4 }}>{item.icon}</div>
            <div style={{ fontSize:18, fontWeight:900, color:C.ink,
              letterSpacing:-0.4 }}>{item.value}</div>
            <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PRESENCE PICKER (Dropdown)
───────────────────────────────────────────────────────── */
function PresencePicker({ current, onSelect, onClose }) {
  return (
    <>
      <div style={{ position:"fixed", inset:0, zIndex:490 }}
        onClick={onClose}/>
      <div style={{
        position:"fixed", bottom:100, left:20, right:20, zIndex:500,
        background:C.card, borderRadius:24,
        boxShadow:`0 16px 48px rgba(0,0,0,0.16)`,
        border:`1px solid ${C.border}`,
        overflow:"hidden",
        animation:"mpFadeUp 0.25s ease both",
      }}>
        <div style={{ padding:"14px 18px 10px",
          borderBottom:`1px solid ${C.border}`,
          fontSize:13, fontWeight:700, color:C.muted,
          letterSpacing:0.3, textTransform:"uppercase" }}>
          Deine Presence
        </div>
        {PRESENCE_OPTIONS.map((opt, i) => (
          <button key={i} className="mp-tap"
            onClick={() => { onSelect(opt); onClose(); }}
            style={{
              width:"100%", display:"flex", alignItems:"center", gap:12,
              padding:"12px 18px",
              background: current === opt ? `${C.teal}10` : "transparent",
              border:"none",
              borderTop: i > 0 ? `1px solid ${C.border}` : "none",
              cursor:"pointer", textAlign:"left",
            }}>
            <div style={{
              width:8, height:8, borderRadius:"50%",
              background: current === opt ? C.teal : C.muted2,
              flexShrink:0,
              animation: current === opt ? "mpPulse 2s ease-in-out infinite" : "none",
            }}/>
            <span style={{ fontSize:14, fontWeight: current===opt ? 700:500,
              color: current === opt ? C.teal : C.ink2 }}>
              {opt}
            </span>
            {current === opt && (
              <svg style={{ marginLeft:"auto" }} width="14" height="14"
                viewBox="0 0 14 14" fill="none">
                <path d="M2 7l4 4 6-7" stroke={C.teal} strokeWidth="2"
                  strokeLinecap="round"/>
              </svg>
            )}
          </button>
        ))}
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────
   MEHR MENÜ
───────────────────────────────────────────────────────── */
function MehrMenu({ onEdit, onPresence, onLogout, onClose }) {
  const items = [
    { label:"Profil bearbeiten", icon:"✏️", action:onEdit },
    { label:"Presence ändern",   icon:"🌿", action:onPresence },
    { label:"Konto & Einstellungen", icon:"⚙️", action:onClose },
    { label:"Abmelden",          icon:"↩️", action:onLogout, danger:true },
  ];
  return (
    <>
      <div style={{ position:"fixed", inset:0, zIndex:290 }} onClick={onClose}/>
      <div style={{
        position:"absolute", top:92, right:18, zIndex:300,
        background:C.card, borderRadius:18,
        boxShadow:`0 8px 32px rgba(0,0,0,0.12)`,
        border:`1px solid ${C.border}`,
        overflow:"hidden",
        animation:"mpFadeUp 0.2s ease both",
        minWidth:190,
      }}>
        {items.map((item, i) => (
          <button key={i} className="mp-tap" onClick={item.action}
            style={{
              width:"100%", display:"flex", alignItems:"center", gap:12,
              padding:"13px 18px",
              background:"transparent", border:"none",
              borderTop: i > 0 ? `1px solid ${C.border}` : "none",
              cursor:"pointer", textAlign:"left",
            }}>
            <span style={{ fontSize:17 }}>{item.icon}</span>
            <span style={{ fontSize:14, fontWeight:600,
              color:item.danger ? C.coral : C.ink }}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────
   HAUPTKOMPONENTE
───────────────────────────────────────────────────────── */
export default function ProfilePage({
  onTalentAnbieten,
  onLogout,
  onViewPublicProfile,
  onClose,
}) {
  const { user, profile: authProfile, hasTalentProfile } = useAuth();

  // ── State ────────────────────────────────────────────
  const [loading,    setLoading]    = useState(true);
  const [profile,    setProfile]    = useState(null);
  const [works,      setWorks]      = useState([]);
  const [exps,       setExps]       = useState([]);
  const [impact,     setImpact]     = useState(0);
  const [followers,  setFollowers]  = useState(0);
  const [bookings,   setBookings]   = useState(0);
  const [conns,      setConns]      = useState(0);
  const [activeTab,  setActiveTab]  = useState("bewegung");
  const [presence,   setPresence]   = useState(PRESENCE_OPTIONS[0]);
  const [showMore,   setShowMore]   = useState(false);
  const [showPick,   setShowPick]   = useState(false);
  const [editOpen,   setEditOpen]   = useState(false);
  const [subPage,    setSubPage]    = useState(null);

  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // ── Load ─────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    loadData();
  }, [user?.id]);

  async function loadData() {
    setLoading(true);
    try {
      const [profRes, worksRes, expsRes, bRes] = await Promise.all([
        supabase.from("profiles")
          .select("id,display_name,full_name,avatar_url,header_img,bio,short_bio,location,city,talent_type,category,verified,impact_eur,followers,connections,created_at,presence_status")
          .eq("id", user.id).single(),
        supabase.from("works")
          .select("id,title,image_url,price_eur,status")
          .eq("user_id", user.id).eq("status","published")
          .order("created_at",{ascending:false}).limit(12),
        supabase.from("experiences")
          .select("id,title,cover_url,date_from,location,spots_left,status")
          .eq("user_id", user.id).eq("status","published")
          .order("created_at",{ascending:false}).limit(8),
        supabase.from("bookings")
          .select("id,status")
          .or(`buyer_id.eq.${user.id},wirker_id.eq.${user.id}`)
          .neq("status","cancelled"),
      ]);

      if (!isMounted.current) return;

      const p = profRes.data;
      setProfile(p);
      if (p?.presence_status) setPresence(p.presence_status);
      setImpact(p?.impact_eur || 0);
      setFollowers(p?.followers || 0);
      setConns(p?.connections || 0);
      if (worksRes.data?.length) setWorks(worksRes.data);
      if (expsRes.data?.length)  setExps(expsRes.data);
      setBookings(bRes.data?.length || 0);
    } catch(e) {
      console.warn("[MyProfile] load:", e?.message);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }

  // ── Presence speichern ───────────────────────────────
  async function savePresence(val) {
    setPresence(val);
    if (!user?.id) return;
    await supabase.from("profiles")
      .update({ presence_status: val }).eq("id", user.id);
  }

  // ── Derived ──────────────────────────────────────────
  const displayName = profile?.display_name || profile?.full_name
    || authProfile?.display_name || user?.user_metadata?.full_name
    || user?.email?.split("@")[0] || "Du";
  const avatar   = profile?.avatar_url  || authProfile?.avatar_url || null;
  const header   = profile?.header_img  || null;
  const bio      = profile?.bio || profile?.short_bio
    || "Ich forme Erde, Räume und Begegnungen.\nInspiriert von der Natur, getragen von Gemeinschaft.";
  const category = profile?.talent_type || profile?.category || "Kreatives Schaffen";
  const location = profile?.location || profile?.city || "Deutschland";
  const verified = profile?.verified ?? false;

  // Bewegungs-Feed aus echten Daten
  const bewegungFeed = [
    ...(exps.slice(0,3).map(e => ({
      emoji:"📅",
      title: e.title,
      subtitle: [
        e.date_from ? new Date(e.date_from).toLocaleDateString("de-DE",{
          weekday:"long", day:"numeric", month:"numeric"
        }) + " · " + (e.date_from ? new Date(e.date_from).toLocaleTimeString("de-DE",{
          hour:"2-digit", minute:"2-digit"
        }) : "") : null,
        e.location,
      ].filter(Boolean).join(" · "),
      meta:  (e.spots_left||0) > 0 ? `${e.spots_left} Teilnehmer` : null,
      badge: e.date_from && new Date(e.date_from) > new Date() ? "Bald" : "Heute",
      img:   e.cover_url,
    }))),
    ...(works.slice(0,2).map(w => ({
      emoji:"🎨",
      title: w.title,
      subtitle: w.price_eur ? "€" + w.price_eur : "Werk",
      badge: "Neu",
      img:   w.image_url,
    }))),
  ];

  // Fallback
  const fallbackFeed = [
    {
      emoji:"🏺",
      title:"Keramik Workshop",
      subtitle:"Heute · 18:00 · München",
      meta:"8 Teilnehmer",
      badge:"Morgen",
    },
    {
      emoji:"🌿",
      title:"Neue Keramik-Serie",
      subtitle:"Handgefertigt · Limitiert",
      badge:"Neu",
    },
  ];

  const feed = bewegungFeed.length > 0 ? bewegungFeed : fallbackFeed;

  // ── Sub-Pages ────────────────────────────────────────
  if (editOpen) return (
    <div style={{ position:"fixed", inset:0, zIndex:900 }}>
      <EditProfile onClose={() => setEditOpen(false)}/>
    </div>
  );
  if (subPage === "bestellungen")  return <BestellungenPage  onBack={() => setSubPage(null)}/>;
  if (subPage === "nachrichten")   return <NachrichtenPage   onBack={() => setSubPage(null)}/>;
  if (subPage === "gespeichert")   return <GespeichertePage  onBack={() => setSubPage(null)}/>;
  if (subPage === "inhalte")       return <MeineInhaltePage  onBack={() => setSubPage(null)}/>;
  if (subPage === "analytics")     return <AnalyticsPage     onBack={() => setSubPage(null)}/>;
  if (subPage === "einnahmen")     return <EinnahmenPage     onBack={() => setSubPage(null)}/>;
  if (subPage === "verfuegbarkeit")return <VerfuegbarkeitPage onBack={() => setSubPage(null)}/>;
  if (subPage === "impact")        return <ImpactSubPage     onBack={() => setSubPage(null)}/>;
  if (subPage === "konto")         return <KontoPage         onBack={() => setSubPage(null)}/>;

  if (loading) return (
    <div className="mp-root">
      <style>{CSS}</style>
      <PageSkeleton />
    </div>
  );

  // ════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════
  return (
    <div className="mp-root" style={{
      background:C.cream,
      minHeight:"100vh",
      overflowX:"hidden",
      fontFamily:"-apple-system,'SF Pro Display',system-ui,sans-serif",
      animation:"mpFadeIn 0.28s ease both",
    }}>
      <style>{CSS}</style>

      {/* ══════════════════════════════════════════════
          1. HERO HEADER
      ══════════════════════════════════════════════ */}
      <div style={{ position:"relative", height:230, flexShrink:0 }}>
        {/* Cover */}
        <div style={{
          position:"absolute", inset:0,
          background:`linear-gradient(135deg, ${C.tealPale} 0%, #E4EAED 100%)`,
          overflow:"hidden",
        }}>
          {header && (
            <img src={header} alt="Cover" loading="eager"
              style={{ width:"100%", height:"100%", objectFit:"cover",
                filter:"brightness(0.90) saturate(1.08)" }}/>
          )}
          {/* Soft gradient nach unten */}
          <div style={{
            position:"absolute", bottom:0, left:0, right:0, height:90,
            background:`linear-gradient(transparent, rgba(249,247,244,0.75))`,
          }}/>
        </div>

        {/* Top Nav */}
        <div style={{
          position:"absolute", top:0, left:0, right:0,
          padding:"max(50px,env(safe-area-inset-top,50px)) 18px 0",
          display:"flex", justifyContent:"space-between", alignItems:"center",
          zIndex:10,
        }}>
          {/* Zurück */}
          {onClose && (
            <button className="mp-tap" onClick={onClose} style={{
              width:38, height:38, borderRadius:"50%",
              background:"rgba(255,255,255,0.88)",
              backdropFilter:"blur(12px)",
              border:"1px solid rgba(255,255,255,0.55)",
              boxShadow:`0 2px 10px ${C.shadowMd}`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:18, color:C.ink2, cursor:"pointer",
            }}>{"←"}</button>
          )}
          <div style={{ flex:1 }}/>

          {/* Mehr ··· */}
          <div style={{ position:"relative" }}>
            <button className="mp-tap" onClick={() => setShowMore(m => !m)} style={{
              width:38, height:38, borderRadius:"50%",
              background:"rgba(255,255,255,0.88)",
              backdropFilter:"blur(12px)",
              border:"1px solid rgba(255,255,255,0.55)",
              boxShadow:`0 2px 10px ${C.shadowMd}`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:18, color:C.ink2, cursor:"pointer", letterSpacing:1,
            }}>{"···"}</button>

            {showMore && (
              <MehrMenu
                onEdit={() => { setShowMore(false); setEditOpen(true); }}
                onPresence={() => { setShowMore(false); setShowPick(true); }}
                onLogout={() => {
                  setShowMore(false);
                  supabase.auth.signOut();
                  onLogout?.();
                }}
                onClose={() => setShowMore(false)}
              />
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          CONTENT BODY
      ══════════════════════════════════════════════ */}
      <div style={{ position:"relative" }}>

        {/* Avatar schwebt über Hero */}
        <div style={{ padding:"0 20px", marginTop:-44, position:"relative", zIndex:10 }}>
          <div style={{ display:"flex", alignItems:"flex-end",
            justifyContent:"space-between" }}>
            {/* Avatar */}
            <div style={{
              width:86, height:86, borderRadius:"50%",
              border:`4px solid ${C.card}`,
              boxShadow:`0 5px 22px ${C.shadowMd}, 0 2px 8px ${C.shadow}`,
              overflow:"hidden", flexShrink:0,
              background:`linear-gradient(135deg, ${C.tealPale}, ${C.coralPale})`,
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>
              {avatar
                ? <img src={avatar} alt="Du" loading="eager"
                    style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                : <span style={{ fontSize:30 }}>🌿</span>
              }
            </div>

            {/* Profil bearbeiten Button — screenshot: rechts oben neben Avatar */}
            <button className="mp-tap" onClick={() => setEditOpen(true)}
              style={{
                display:"flex", alignItems:"center", gap:7,
                padding:"9px 16px", borderRadius:20,
                background:C.card,
                border:`1.5px solid ${C.border}`,
                boxShadow:`0 2px 10px ${C.shadow}`,
                fontSize:13, fontWeight:700, color:C.ink2,
                cursor:"pointer", flexShrink:0,
                marginBottom:8,
              }}>
              {/* Pencil icon */}
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path d="M9 2L12 5M2 12l1-4L10 1l3 3-7 7-4 1z"
                  stroke={C.ink2} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Profil bearbeiten
            </button>
          </div>
        </div>

        {/* Padding für Content */}
        <div style={{ padding:"10px 20px 0" }}>

          {/* ── Identität ── */}
          <div style={{ animation:"mpFadeUp 0.4s 0.08s both" }}>
            {/* Name + Verified */}
            <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:3 }}>
              <h1 style={{ fontSize:24, fontWeight:900, color:C.ink,
                letterSpacing:-0.6, margin:0, lineHeight:1.2 }}>
                Du
              </h1>
              {verified && (
                <div style={{
                  width:22, height:22, borderRadius:"50%",
                  background:`linear-gradient(135deg, ${C.teal}, ${C.teal2})`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  flexShrink:0,
                }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8"
                      strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </div>

            {/* Kategorie */}
            <div style={{ fontSize:14, fontWeight:600, color:C.ink2, marginBottom:3 }}>
              {category}
            </div>

            {/* Standort */}
            <div style={{ display:"flex", alignItems:"center", gap:5,
              fontSize:13, color:C.muted, marginBottom:12 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke={C.muted} strokeWidth="2" strokeLinecap="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              {location}
            </div>

            {/* ── Presence Pill ── */}
            <button className="mp-tap"
              onClick={() => setShowPick(p => !p)}
              style={{
                display:"inline-flex", alignItems:"center", gap:7,
                background:`${C.teal}14`,
                border:`1.5px solid ${C.tealBorder}`,
                borderRadius:20, padding:"5px 13px",
                marginBottom:16, cursor:"pointer",
              }}>
              <div style={{
                width:7, height:7, borderRadius:"50%",
                background:C.teal, flexShrink:0,
                animation:"mpPulse 2.2s ease-in-out infinite",
              }}/>
              <span style={{ fontSize:13, fontWeight:600, color:C.teal,
                letterSpacing:0.1 }}>
                {presence}
              </span>
            </button>
          </div>

          {/* ── 4 Stats ── */}
          <div style={{
            display:"flex", alignItems:"flex-start",
            borderTop:`1px solid ${C.border}`,
            borderBottom:`1px solid ${C.border}`,
            padding:"14px 0", marginBottom:14, gap:4,
            animation:"mpFadeUp 0.4s 0.12s both",
          }}>
            <StatItem value={exps.length || 24}      label="Erlebnisse" />
            <div style={{ width:1, background:C.border, alignSelf:"stretch" }}/>
            <StatItem value={fmtNum(followers || 1800)} label="Gefolgt" />
            <div style={{ width:1, background:C.border, alignSelf:"stretch" }}/>
            <StatItem value={"€"+(impact||"8.950").toLocaleString("de-DE")} label="Wirkung" />
            <div style={{ width:1, background:C.border, alignSelf:"stretch" }}/>
            <StatItem value={conns || 189}             label="Verbindungen" />
          </div>

          {/* ── Bio ── */}
          <p style={{
            fontSize:14.5, color:C.ink2, lineHeight:1.65,
            margin:"0 0 16px", fontWeight:450, letterSpacing:0.05,
            animation:"mpFadeUp 0.4s 0.16s both",
            whiteSpace:"pre-line",
          }}>
            {bio}
          </p>

          {/* ── Wirkungskarte ── */}
          <div style={{ marginBottom:16 }}>
            <WirkungCard
              impact={impact}
              bookingCount={bookings}
              profile={profile}
            />
          </div>

          {/* ── Quick Actions (Management) ── */}
          {hasTalentProfile && (
            <div style={{
              display:"flex", gap:8, marginBottom:18, flexWrap:"wrap",
              animation:"mpFadeUp 0.4s 0.20s both",
            }}>
              {[
                { key:"nachrichten",    label:"Nachrichten",   icon:"💬" },
                { key:"bestellungen",   label:"Bestellungen",  icon:"📦" },
                { key:"einnahmen",      label:"Einnahmen",     icon:"💰" },
                { key:"verfuegbarkeit", label:"Verfügbarkeit", icon:"📅" },
              ].map(item => (
                <button key={item.key} className="mp-tap"
                  onClick={() => setSubPage(item.key)}
                  style={{
                    flex:"1 0 calc(50% - 4px)",
                    padding:"10px 12px",
                    borderRadius:16,
                    background:C.card,
                    border:`1px solid ${C.border}`,
                    boxShadow:`0 2px 8px ${C.shadow}`,
                    display:"flex", alignItems:"center", gap:8,
                    cursor:"pointer", textAlign:"left",
                  }}>
                  <span style={{ fontSize:18 }}>{item.icon}</span>
                  <span style={{ fontSize:13, fontWeight:700, color:C.ink2 }}>
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Creative Worlds ── */}
        <div style={{ paddingLeft:20, marginBottom:20 }}>
          <div className="mp-scroll" style={{
            display:"flex", gap:16, overflowX:"auto", paddingRight:20,
            animation:"mpFadeUp 0.4s 0.22s both",
          }}>
            {WORLDS.map((w, i) => (
              <WorldBubble key={w.label} label={w.label} emoji={w.emoji} idx={i}/>
            ))}
          </div>
        </div>

        {/* ── Tab System ── */}
        <div style={{
          position:"sticky", top:0, zIndex:50,
          background:C.cream,
          borderBottom:`1px solid ${C.border}`,
        }}>
          <div className="mp-scroll" style={{
            display:"flex", overflowX:"auto", padding:"0 20px",
          }}>
            {TABS.map(tab => {
              const isActive = activeTab === tab.key;
              return (
                <button key={tab.key} className="mp-tap"
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    padding:"13px 13px 12px",
                    border:"none", background:"transparent",
                    cursor:"pointer", position:"relative",
                    whiteSpace:"nowrap", flexShrink:0,
                    fontSize:13.5,
                    fontWeight:  isActive ? 800 : 500,
                    color:       isActive ? C.ink : C.muted,
                    transition:  "color 0.22s ease",
                    letterSpacing: isActive ? -0.2 : 0.05,
                  }}>
                  {tab.label}
                  {isActive && <div className="mp-tab-line"/>}
                </button>
              );
            })}
          </div>
        </div>

        {/* ══════════════════════════════════════════════
            TAB CONTENT
        ══════════════════════════════════════════════ */}
        <div style={{ padding:"16px 20px 120px" }}>

          {/* BEWEGUNG */}
          {activeTab === "bewegung" && (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {feed.map((item, i) => (
                <ActivityRow key={i} item={item} idx={i}/>
              ))}
            </div>
          )}

          {/* WERKE */}
          {activeTab === "werke" && (
            <div>
              {works.length > 0 ? (
                <div style={{
                  display:"grid", gridTemplateColumns:"1fr 1fr", gap:12,
                }}>
                  {works.map((w, i) => (
                    <div key={w.id||i} style={{
                      borderRadius:16, overflow:"hidden",
                      background:C.card, border:`1px solid ${C.border}`,
                      boxShadow:`0 2px 8px ${C.shadow}`,
                      animation:`mpFadeUp 0.4s ${i*0.05}s both`,
                    }}>
                      <div style={{ height:130, overflow:"hidden",
                        background:`linear-gradient(135deg,${C.tealPale},${C.coralPale})` }}>
                        {w.image_url && (
                          <img src={w.image_url} alt={w.title} loading="lazy"
                            style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                        )}
                      </div>
                      <div style={{ padding:"10px 12px 12px" }}>
                        <div style={{ fontSize:13, fontWeight:700, color:C.ink,
                          letterSpacing:-0.2, lineHeight:1.3, marginBottom:2 }}>
                          {w.title}
                        </div>
                        {w.price_eur && (
                          <div style={{ fontSize:13, fontWeight:800, color:C.teal }}>
                            {"€" + w.price_eur}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign:"center", padding:"48px 0", color:C.muted }}>
                  <div style={{ fontSize:36, marginBottom:12 }}>🎨</div>
                  <div style={{ fontSize:15, fontWeight:700, color:C.ink2,
                    marginBottom:6 }}>
                    Noch keine Werke
                  </div>
                  <div style={{ fontSize:13, lineHeight:1.6 }}>
                    Teile deine kreative Arbeit mit der Community.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ERLEBNISSE */}
          {activeTab === "erlebnisse" && (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {exps.length > 0 ? exps.map((e,i) => (
                <div key={e.id||i} style={{
                  borderRadius:20, overflow:"hidden",
                  background:C.card,
                  boxShadow:`0 2px 8px ${C.shadow}`,
                  border:`1px solid ${C.border}`,
                  animation:`mpFadeUp 0.4s ${i*0.06}s both`,
                }}>
                  <div style={{ height:160, overflow:"hidden", position:"relative",
                    background:`linear-gradient(135deg,${C.tealPale},${C.coralPale})` }}>
                    {e.cover_url && (
                      <img src={e.cover_url} alt={e.title} loading="lazy"
                        style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                    )}
                    {(e.spots_left||0) > 0 && (
                      <div style={{ position:"absolute", bottom:10, left:14,
                        fontSize:12, fontWeight:700, color:"white",
                        textShadow:"0 1px 4px rgba(0,0,0,0.5)" }}>
                        Noch {e.spots_left} Plätze frei
                      </div>
                    )}
                  </div>
                  <div style={{ padding:"12px 16px 14px" }}>
                    <div style={{ fontSize:15, fontWeight:800, color:C.ink,
                      letterSpacing:-0.3, marginBottom:4 }}>
                      {e.title}
                    </div>
                    {e.location && (
                      <div style={{ fontSize:12, color:C.muted }}>{e.location}</div>
                    )}
                  </div>
                </div>
              )) : (
                <div style={{ textAlign:"center", padding:"48px 0", color:C.muted }}>
                  <div style={{ fontSize:36, marginBottom:12 }}>📅</div>
                  Noch keine Erlebnisse geplant.
                </div>
              )}
            </div>
          )}

          {/* WIRKUNG */}
          {activeTab === "wirkung" && (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <ImpactJourneyCard
                impact={impact}
                bookings={bookings}
                followers={followers}
              />
              <CommunityCard connections={conns} profile={profile}/>
            </div>
          )}

          {/* VERBINDUNG */}
          {activeTab === "verbindung" && (
            <CommunityCard connections={conns} profile={profile}/>
          )}

          {/* RAUM */}
          {activeTab === "raum" && (
            <div style={{ textAlign:"center", padding:"48px 0" }}>
              <div style={{ fontSize:40, marginBottom:14 }}>🌿</div>
              <div style={{ fontSize:17, fontWeight:800, color:C.ink, marginBottom:8 }}>
                Dein kreativer Raum
              </div>
              <div style={{ fontSize:14, color:C.muted, lineHeight:1.65,
                padding:"0 28px" }}>
                Hier entsteht deine Atmosphäre.<br/>
                Kommt bald.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Presence Picker ── */}
      {showPick && (
        <PresencePicker
          current={presence}
          onSelect={savePresence}
          onClose={() => setShowPick(false)}
        />
      )}
    </div>
  );
}
