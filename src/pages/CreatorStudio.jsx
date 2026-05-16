// CreatorStudio.jsx — HUI Creator Dashboard
// Ausschliesslich privater Bereich des Besitzers.
// Route: /studio

import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppState } from "../lib/AppStateContext";
import { useCreatorBookings, BOOKING_STATUS } from "../lib/bookingContext";
import { useAuth } from "../lib/AuthContext";
import { supabase } from "../lib/supabaseClient";
import {
  AnalyticsPage,
  EinnahmenPage,
  VerfuegbarkeitPage,
  ImpactSubPage,
  KontoPage,
  MeineInhaltePage,
  BestellungenPage,
  ReputationInsightsPage,
} from "../components/MeinHUI_SubPages";

const C = {
  teal:"#16D7C5", teal2:"#11C5B7", tealGlow:"rgba(22,215,197,0.18)",
  coral:"#FF8A6B", coralGlow:"rgba(255,138,107,0.15)",
  gold:"#F5A623",
  green:"#10B981",
  violet:"#8B5CF6",
  cream:"#F9F6F2", warm:"#FEFCFA", card:"#FFFFFF",
  ink:"#1A1A1A", ink2:"#3A3A3A", muted:"#888", muted2:"#C0C0C0",
  border:"rgba(0,0,0,0.06)",
};

const CSS = `
  @keyframes studioFadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
  @keyframes studioPulse{0%,100%{opacity:1}50%{opacity:.5}}
  @keyframes studioShimmer{0%,100%{opacity:0}50%{opacity:1}}
  .st-tap{transition:transform .15s cubic-bezier(.34,1.4,.64,1);-webkit-tap-highlight-color:transparent;cursor:pointer}
  .st-tap:active{transform:scale(.96)}
`;

const TOOLS = [
  { key:"analytics",    icon:"📊", label:"Analytics",       sub:"Views & Reichweite",   accent:C.teal,   bg:"rgba(22,215,197,0.08)"   },
  { key:"earnings",     icon:"💰", label:"Einnahmen",        sub:"Buchungen & Umsatz",   accent:C.green,  bg:"rgba(16,185,129,0.08)"   },
  { key:"content",      icon:"🎨", label:"Meine Inhalte",    sub:"Werke, Entwürfe",      accent:C.gold,   bg:"rgba(245,166,35,0.08)"   },
  { key:"availability", icon:"🗓", label:"Verfügbarkeit",    sub:"Kalender & Slots",     accent:C.coral,  bg:"rgba(255,138,107,0.08)"  },
  { key:"orders",       icon:"📦", label:"Bestellungen",     sub:"Aufträge & Historie",  accent:C.violet, bg:"rgba(139,92,246,0.08)"   },
  { key:"impact",       icon:"🌱", label:"Impact",           sub:"Soziale Wirkung",      accent:C.green,  bg:"rgba(16,185,129,0.08)"   },
  { key:"reputation",   icon:"✦", label:"Reputation",         sub:"Vertrauen & Zusammenarbeit", accent:C.violet },
  { key:"settings",     icon:"⚙", label:"Einstellungen",    sub:"Konto & Sichtbarkeit", accent:C.muted,  bg:"rgba(0,0,0,0.04)"        },
];

export default function CreatorStudio() {
  const navigate  = useNavigate();
  const { section } = useParams();  // /studio/:section
  const { user }  = useAuth();
  const { ownWorks, ownExperiences, unreadNotifCount,
          loadOwnWorks, loadOwnExperiences } = useAppState();
  // Booking-Daten direkt aus bookingContext (Creator-spezifisch)
  const { grouped: bookingGroups, loading: bookingLoading } = useCreatorBookings();
  const pendingBookings  = bookingGroups.pending?.length  || 0;
  const activeBookings   = (bookingGroups.accepted?.length || 0) + (bookingGroups.active?.length || 0);
  const [profile, setProfile] = useState(null);
  // section aus URL ODER lokaler State — URL hat Priorität
  const [activeTool, setActiveTool] = useState(section || null);
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Guten Morgen" : h < 17 ? "Hallo" : "Guten Abend");
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    supabase.from("profiles")
      .select("id,display_name,avatar_url,is_wirker,has_talent_profile,username,focus_type")
      .eq("id", user.id).single()
      .then(({ data }) => { if (data) setProfile(data); });
  }, [user?.id]);

  // Wenn Sub-Tool aktiv
  if (activeTool) {
      // Back aus Sub-Tool → /studio root
  const handleBack = () => {
    setActiveTool(null);
    navigate('/studio', { replace: true });
  };

  const SubPage = {
      analytics:    () => <AnalyticsPage          onBack={handleBack} />,
      earnings:     () => <EinnahmenPage          onBack={handleBack} />,
      content:      () => <MeineInhaltePage       onBack={handleBack} />,
      availability: () => <VerfuegbarkeitPage     onBack={handleBack} />,
      orders:       () => <BestellungenPage        onBack={handleBack} />,
      impact:       () => <ImpactSubPage           onBack={handleBack} />,
      reputation:   () => <ReputationInsightsPage  onBack={handleBack} />,
      settings:     () => <KontoPage         onBack={handleBack} onLogout={() => { supabase.auth.signOut(); navigate("/login"); }} />,
    }[activeTool];
    if (SubPage) return (
      <div style={{ position:"fixed", inset:0, zIndex:300,
        background:C.cream, overflowY:"auto",
        fontFamily:"-apple-system,'SF Pro Display',system-ui,sans-serif" }}>
        <SubPage />
      </div>
    );
  }

  const firstName = profile?.display_name?.split(" ")[0] || "Creator";

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:300,
      background:C.cream, overflowY:"auto",
      fontFamily:"-apple-system,'SF Pro Display',system-ui,sans-serif",
      WebkitOverflowScrolling:"touch",
    }}>
      <style>{CSS}</style>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{
        background:`linear-gradient(160deg,#0F1923 0%,#1A2B3C 60%,#0F2B2A 100%)`,
        padding:"max(56px,env(safe-area-inset-top,56px)) 20px 28px",
        position:"relative", overflow:"hidden",
      }}>
        {/* Ambient Glow */}
        <div style={{ position:"absolute", top:-60, right:-40, width:200, height:200,
          borderRadius:"50%", background:"rgba(22,215,197,0.12)",
          filter:"blur(60px)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", bottom:-40, left:-20, width:160, height:160,
          borderRadius:"50%", background:"rgba(255,138,107,0.10)",
          filter:"blur(50px)", pointerEvents:"none" }} />

        {/* Back + Title */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
          <button className="st-tap" onClick={() => navigate(-1)}
            style={{ width:36, height:36, borderRadius:10,
              background:"rgba(255,255,255,0.10)", border:"1px solid rgba(255,255,255,0.16)",
              display:"flex", alignItems:"center", justifyContent:"center",
              color:"rgba(255,255,255,0.80)", fontSize:16 }}>
            ←
          </button>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"rgba(22,215,197,0.80)",
              letterSpacing:1.5, textTransform:"uppercase", marginBottom:2 }}>
              Creator Studio
            </div>
            <div style={{ fontSize:18, fontWeight:900, color:"white", letterSpacing:-.3 }}>
              {greeting}, {firstName} ✦
            </div>
          </div>
          {/* Avatar */}
          {profile?.avatar_url && (
            <div style={{ width:40, height:40, borderRadius:"50%", overflow:"hidden",
              border:"2px solid rgba(22,215,197,0.40)" }}>
              <img src={profile.avatar_url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
            </div>
          )}
        </div>

        {/* Quick Stats — echte Daten aus AppStateContext */}
        <div style={{ display:"flex", gap:10 }}>
          {[
            {
              icon:"🎨",
              label:"Werke",
              value: ownWorks.length > 0 ? ownWorks.length : (profile?.works_count || 0),
            },
            {
              icon:"📦",
              label: pendingBookings > 0 ? `${pendingBookings} offen` : "Aufträge",
              value: pendingBookings > 0 ? pendingBookings : (activeBookings || "—"),
            },
            {
              icon:"🌱",
              label:"Impact",
              value: profile?.impact_eur ? `€ ${Math.round(profile.impact_eur)}` : "—",
            },
          ].map(s => (
            <div key={s.label} style={{ flex:1, padding:"10px 12px",
              background:"rgba(255,255,255,0.07)",
              border:"1px solid rgba(255,255,255,0.10)",
              borderRadius:14 }}>
              <div style={{ fontSize:13, marginBottom:3 }}>{s.icon}</div>
              <div style={{ fontSize:15, fontWeight:900, color:"white" }}>{s.value}</div>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.45)",
                fontWeight:600, marginTop:1 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Öffentliches Profil Button ─────────────────────────── */}
      <div style={{ padding:"16px 16px 0" }}>
        <button className="st-tap"
          onClick={() => {
            const u = profile?.username || user?.id;
            if (u) navigate(`/profile/${u}`);
          }}
          style={{ width:"100%", padding:"14px 18px",
            background:"white",
            border:`1.5px solid rgba(22,215,197,0.22)`,
            borderRadius:18,
            display:"flex", alignItems:"center", gap:14,
            boxShadow:"0 2px 16px rgba(0,0,0,0.06)" }}>
          <div style={{ width:42, height:42, borderRadius:"50%", flexShrink:0,
            background:`linear-gradient(135deg,${C.teal},${C.coral})`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:16, color:"white", overflow:"hidden" }}>
            {profile?.avatar_url
              ? <img src={profile.avatar_url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
              : "👤"}
          </div>
          <div style={{ flex:1, textAlign:"left" }}>
            <div style={{ fontSize:13.5, fontWeight:800, color:C.ink }}>
              Mein öffentliches Profil
            </div>
            <div style={{ fontSize:12, color:C.muted, marginTop:1 }}>
              So sehen dich andere · Tippe zum Anzeigen
            </div>
          </div>
          <div style={{ fontSize:16, color:C.teal }}>↗</div>
        </button>
      </div>

      {/* ── Tool Grid ──────────────────────────────────────────── */}
      <div style={{ padding:"20px 16px 40px" }}>
        <div style={{ fontSize:11, fontWeight:800, color:C.muted,
          letterSpacing:1.2, textTransform:"uppercase", marginBottom:12 }}>
          Dein Studio
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          {TOOLS.map((tool, idx) => (
            <button key={tool.key} className="st-tap"
              onClick={() => {
                setActiveTool(tool.key);
                navigate(`/studio/${tool.key}`, { replace: true });
              }}
              style={{
                padding:"18px 16px",
                background:tool.bg,
                border:`1.5px solid ${tool.accent}22`,
                borderRadius:20,
                textAlign:"left", cursor:"pointer",
                fontFamily:"inherit",
                animation:`studioFadeUp .4s ${idx * 0.05}s ease both`,
              }}>
              <div style={{ fontSize:24, marginBottom:10 }}>{tool.icon}</div>
              <div style={{ fontSize:13.5, fontWeight:800, color:C.ink,
                letterSpacing:-.2, marginBottom:3 }}>
                {tool.label}
              </div>
              <div style={{ fontSize:11.5, color:C.muted, lineHeight:1.4 }}>
                {tool.sub}
              </div>
              <div style={{ marginTop:10, display:"flex", alignItems:"center",
                gap:4, color:tool.accent }}>
                <span style={{ fontSize:11, fontWeight:700 }}>Öffnen</span>
                <span style={{ fontSize:10 }}>→</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
