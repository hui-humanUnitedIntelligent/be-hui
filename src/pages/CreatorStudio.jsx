// CreatorStudio.jsx — HUI Creator Home v2.0
// Phase 3D: Weniger Dashboard. Mehr kreatives Zuhause.
// Creator-zentriert, emotional, ruhig.

import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppState } from "../lib/AppStateContext";
import { useCreatorBookings, BOOKING_STATUS } from "../lib/bookingContext";
import { useAuth } from "../lib/AuthContext";
import { supabase } from "../lib/supabaseClient";
import { HUI } from "../design/hui.design.js";
import {
  getAmbientGreeting, useCreatorJourney, getSoftStatus,
  AMBIENT_CSS, TRANSITIONS,
} from "../lib/journeyContext";
import {
  AnalyticsPage, EinnahmenPage, VerfuegbarkeitPage,
  ImpactSubPage, KontoPage, MeineInhaltePage,
import SupportPage from "./studio/SupportPage.jsx";
  BestellungenPage, ReputationInsightsPage,
} from "./studio/StudioSubPages";

const C = {
  teal:HUI.COLOR.teal, teal2:HUI.COLOR.tealDeep, tealGlow:"rgba(22,215,197,0.18)",
  coral:HUI.COLOR.coral, coralGlow:"rgba(255,138,107,0.15)",
  gold:HUI.COLOR.gold, green:"#10B981", violet:HUI.COLOR.violet,
  cream:HUI.COLOR.cream, warm:HUI.COLOR.creamSoft, card:"#FFFFFF",
  ink:HUI.COLOR.ink, ink2:HUI.COLOR.ink2, muted:"#888", muted2:"#C0C0C0",
  border:"rgba(0,0,0,0.06)",
};

const CSS = `
  ${AMBIENT_CSS}
  @keyframes studioFadeUp{
    from{opacity:0;transform:translateY(18px)}
    to{opacity:1;transform:translateY(0)}
  }
  @keyframes studioHeaderIn{
    from{opacity:0;transform:translateY(-10px)}
    to{opacity:1;transform:translateY(0)}
  }
  @keyframes studioCardIn{
    from{opacity:0;transform:scale(0.97)}
    to{opacity:1;transform:scale(1)}
  }
  @keyframes studioPendingPulse{
    0%,100%{box-shadow:0 0 0 0 rgba(245,166,35,0)}
    50%{box-shadow:0 0 0 6px rgba(245,166,35,0.18)}
  }
`;

// Tool-Definitionen — Gruppen statt flache Liste
const TOOL_GROUPS = [
  {
    label: "Deine kreative Arbeit",
    tools: [
      { key:"content",      icon:"🎨", label:"Werke & Inhalte",  sub:"Was du erschaffen hast",     accent:C.teal    },
      { key:"availability", icon:"🗓", label:"Verfügbarkeit",    sub:"Wann du kreativ arbeitest",   accent:C.coral   },
      { key:"orders",       icon:"🤝", label:"Zusammenarbeit",   sub:"Anfragen & laufende Projekte",accent:C.violet  },
    ]
  },
  {
    label: "Deine Wirkung",
    tools: [
      { key:"analytics",   icon:"✦",  label:"Reichweite",       sub:"Wer folgt dir und warum",    accent:C.teal    },
      { key:"earnings",    icon:"◎",  label:"Einnahmen",        sub:"Dein kreatives Einkommen",   accent:C.green   },
      { key:"reputation",  icon:"⭐", label:"Vertrauen",        sub:"Zusammenarbeit & Feedback",  accent:C.gold    },
      { key:"impact",      icon:"🌱", label:"Impact",           sub:"Dein Beitrag zur Community", accent:C.green   },
    ]
  },
  {
    label: "Persönliches",
    tools: [
      { key:"settings",    icon:"◦",  label:"Einstellungen",    sub:"Konto & Sichtbarkeit",       accent:C.muted   },
    ]
  },
];

// Flache Liste für SubPage-Lookup
const ALL_TOOLS = TOOL_GROUPS.flatMap(g => g.tools);

export default function CreatorStudio() {
  const navigate        = useNavigate();
  const { section }     = useParams();
  const { user }        = useAuth();
  const { ownWorks }    = useAppState();
  const { grouped: bookingGroups } = useCreatorBookings();
  const { journey }     = useCreatorJourney();

  const pendingCount    = bookingGroups.pending?.length  || 0;
  const activeCount     = (bookingGroups.accepted?.length || 0) + (bookingGroups.active?.length || 0);
  const recentCompleted = bookingGroups.completed?.slice(0,2) || [];

  const [profile,    setProfile]    = useState(null);
  const [activeTool, setActiveTool] = useState(section || null);

  // Ambient Greeting
  const greetingData = profile ? getAmbientGreeting(profile.display_name, {
    pendingBookings: pendingCount,
    newMessages:     journey?.unreadMessages || 0,
    hasActiveCollab: journey?.hasActiveCollab || false,
  }) : null;

  useEffect(() => {
    if (!user?.id) return;
    supabase.from("profiles")
      .select("id,display_name,avatar_url,username,focus_type,bio,collab_count,recommendations_count")
      .eq("id", user.id).single()
      .then(({ data }) => { if (data) setProfile(data); });
  }, [user?.id]);

  // Tool öffnen
  const openTool = (key) => {
    setActiveTool(key);
    navigate(`/studio/${key}`, { replace: true });
  };

  // Tool schließen
  const handleBack = () => {
    setActiveTool(null);
    navigate("/studio", { replace: true });
  };

  // Sub-Page rendern
  if (activeTool) {
    const subPageMap = {
      analytics:    () => <AnalyticsPage          onBack={handleBack} />,
      earnings:     () => <EinnahmenPage          onBack={handleBack} />,
      content:      () => <MeineInhaltePage       onBack={handleBack} userId={user?.id} />,
      availability: () => <VerfuegbarkeitPage     onBack={handleBack} />,
      orders:       () => <BestellungenPage       onBack={handleBack} />,
      impact:       () => <ImpactSubPage          onBack={handleBack} />,
      reputation:   () => <ReputationInsightsPage onBack={handleBack} />,
      settings:     () => <KontoPage              onBack={handleBack}
                            onLogout={() => { supabase.auth.signOut(); navigate("/login"); }} />,
    };
    const SubPage = subPageMap[activeTool];
    if (SubPage) return (
      <div style={{ position:"fixed", inset:0, zIndex:300, background:C.cream,
        overflowY:"auto", fontFamily:"-apple-system,'SF Pro Display',system-ui,sans-serif",
        animation:`studioCardIn ${TRANSITIONS.normal} ${TRANSITIONS.overlay} both` }}>
        <style>{CSS}</style>
        <SubPage />
      </div>
    );
  }

  const firstName = profile?.display_name?.split(" ")[0] || "Creator";

  return (
    <div style={{ position:"fixed", inset:0, zIndex:300, background:C.cream,
      overflowY:"auto", WebkitOverflowScrolling:"touch",
      fontFamily:"-apple-system,'SF Pro Display',system-ui,sans-serif" }}>
      <style>{CSS}</style>

      {/* ── Atmosphärischer Header ──────────────────────────── */}
      <div style={{
        background:"linear-gradient(160deg,#0F1923 0%,#1A2B3C 55%,#0F2B2A 100%)",
        padding:"max(56px,env(safe-area-inset-top,56px)) 20px 32px",
        position:"relative", overflow:"hidden",
        animation:`studioHeaderIn ${TRANSITIONS.slow} ${TRANSITIONS.overlay} both`,
      }}>
        {/* Ambient Glows — sehr subtil */}
        <div style={{ position:"absolute", top:-80, right:-60, width:240, height:240,
          borderRadius:"50%", background:"rgba(22,215,197,0.10)",
          filter:"blur(80px)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", bottom:-60, left:-30, width:200, height:200,
          borderRadius:"50%", background:"rgba(255,138,107,0.08)",
          filter:"blur(70px)", pointerEvents:"none" }} />
        {/* Feine Textur */}
        <div style={{ position:"absolute", inset:0, opacity:0.03,
          backgroundImage:"radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize:"32px 32px", pointerEvents:"none" }} />

        {/* Nav */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24,
          position:"relative" }}>
          <button className="hui-tap" onClick={() => navigate(-1)}
            style={{ width:36, height:36, borderRadius:10,
              background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.14)",
              display:"flex", alignItems:"center", justifyContent:"center",
              color:"rgba(255,255,255,0.75)", fontSize:16 }}>←</button>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:10, fontWeight:700, color:"rgba(22,215,197,0.70)",
              letterSpacing:2, textTransform:"uppercase", marginBottom:3 }}>
              Dein Studio
            </div>
          </div>
          {profile?.avatar_url && (
            <button className="hui-tap"
              onClick={() => profile?.username && navigate(`/profile/${profile.username}`)}
              style={{ width:38, height:38, borderRadius:"50%", overflow:"hidden",
                border:"1.5px solid rgba(22,215,197,0.35)", padding:0, background:"none" }}>
              <img src={profile.avatar_url} alt={firstName}
                style={{ width:"100%", height:"100%", objectFit:"cover" }} />
            </button>
          )}
        </div>

        {/* Ambient Greeting */}
        <div style={{ position:"relative", marginBottom:24 }}>
          <div style={{ fontSize:26, fontWeight:900, color:"white",
            letterSpacing:-.5, lineHeight:1.2, marginBottom:6 }}>
            {greetingData ? greetingData.greeting : `${firstName},`}
          </div>
          <div style={{ fontSize:14, color:"rgba(255,255,255,0.50)", fontWeight:400,
            lineHeight:1.5 }}>
            {greetingData ? greetingData.sub : "Schön, dass du wieder da bist"}
          </div>
        </div>

        {/* Aktive Situation — nur wenn relevant */}
        {(pendingCount > 0 || activeCount > 0) && (
          <div style={{ display:"flex", gap:8 }}>
            {pendingCount > 0 && (
              <div style={{ display:"flex", alignItems:"center", gap:6,
                padding:"8px 14px", borderRadius:50,
                background:"rgba(245,166,35,0.15)",
                border:"1px solid rgba(245,166,35,0.30)",
                animation:"studioPendingPulse 3s ease-in-out infinite",
                cursor:"pointer" }}
                onClick={() => openTool("orders")}>
                <span style={{ fontSize:12 }}>📋</span>
                <span style={{ fontSize:12, fontWeight:700, color:"rgba(245,166,35,0.90)" }}>
                  {pendingCount} offene Anfrage{pendingCount > 1 ? "n" : ""}
                </span>
              </div>
            )}
            {activeCount > 0 && (
              <div style={{ display:"flex", alignItems:"center", gap:6,
                padding:"8px 14px", borderRadius:50,
                background:"rgba(22,215,197,0.12)",
                border:"1px solid rgba(22,215,197,0.25)" }}>
                <span style={{ fontSize:12 }}>🤝</span>
                <span style={{ fontSize:12, fontWeight:700, color:"rgba(22,215,197,0.85)" }}>
                  {activeCount} aktiv{activeCount > 1 ? "e Projekte" : "s Projekt"}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Öffentliches Profil — als sanfte Verbindung ─────── */}
      <div style={{ padding:"16px 16px 0" }}>
        <button className="hui-tap hui-card-hover"
          onClick={() => profile?.username && navigate(`/profile/${profile.username}`)}
          style={{ width:"100%", padding:"14px 18px", background:C.card,
            border:`1px solid ${C.border}`, borderRadius:18,
            display:"flex", alignItems:"center", gap:12,
            boxShadow:"0 2px 12px rgba(0,0,0,0.04)",
            animation:`studioFadeUp ${TRANSITIONS.normal} 0.05s ${TRANSITIONS.overlay} both` }}>
          {profile?.avatar_url && (
            <img src={profile.avatar_url} alt=""
              style={{ width:36, height:36, borderRadius:"50%", objectFit:"cover" }} />
          )}
          <div style={{ flex:1, textAlign:"left" }}>
            <div style={{ fontSize:13, fontWeight:700, color:C.ink }}>
              Öffentliches Profil ansehen
            </div>
            <div style={{ fontSize:11, color:C.muted, marginTop:1 }}>
              So siehst du für andere aus
            </div>
          </div>
          <div style={{ fontSize:13, color:C.muted }}>→</div>
        </button>
      </div>

      {/* ── Tool-Gruppen ─────────────────────────────────────── */}
      <div style={{ padding:"20px 16px max(32px,env(safe-area-inset-bottom,32px))" }}>
        {TOOL_GROUPS.map((group, gi) => (
          <div key={group.label}
            style={{ marginBottom:24,
              animation:`studioFadeUp ${TRANSITIONS.normal} ${0.08 + gi * 0.06}s ${TRANSITIONS.overlay} both` }}>
            <div style={{ fontSize:11, fontWeight:700, color:C.muted2,
              letterSpacing:1.2, textTransform:"uppercase",
              marginBottom:10, paddingLeft:2 }}>
              {group.label}
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {group.tools.map((tool, ti) => {
                // Badge-Logik
                const badge = tool.key === "orders" && pendingCount > 0 ? pendingCount : null;
                const isActive = tool.key === "orders" && activeCount > 0;

                return (
                  <button key={tool.key}
                    className="hui-tap hui-card-hover"
                    onClick={() => openTool(tool.key)}
                    style={{ width:"100%", padding:"14px 16px",
                      background:C.card,
                      border:`1px solid ${C.border}`,
                      borderRadius:16,
                      display:"flex", alignItems:"center", gap:12,
                      boxShadow:"0 1px 8px rgba(0,0,0,0.03)",
                      animation:`studioFadeUp ${TRANSITIONS.normal} ${0.1 + gi*0.06 + ti*0.04}s ${TRANSITIONS.overlay} both`,
                      position:"relative",
                      // Aktives Projekt: linker Accent
                      ...(isActive ? { borderLeft:`3px solid ${tool.accent}` } : {}),
                    }}>
                    {/* Icon */}
                    <div style={{ width:38, height:38, borderRadius:12,
                      background:`${tool.accent}12`,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:18, flexShrink:0 }}>
                      {tool.icon}
                    </div>

                    {/* Label */}
                    <div style={{ flex:1, textAlign:"left" }}>
                      <div style={{ fontSize:14, fontWeight:700, color:C.ink,
                        marginBottom:2 }}>
                        {tool.label}
                      </div>
                      <div style={{ fontSize:12, color:C.muted }}>
                        {tool.sub}
                      </div>
                    </div>

                    {/* Badge */}
                    {badge ? (
                      <div style={{ minWidth:22, height:22, borderRadius:11,
                        background:`linear-gradient(135deg,${C.coral},#FF5F5F)`,
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:11, fontWeight:800, color:"white",
                        padding:"0 5px" }}>
                        {badge}
                      </div>
                    ) : (
                      <div style={{ fontSize:13, color:C.muted2 }}>›</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Sanfte untere Notiz */}
        <div style={{ textAlign:"center", padding:"8px 0 8px",
          fontSize:11, color:"rgba(0,0,0,0.20)", fontWeight:500,
          animation:`huiFadeIn ${TRANSITIONS.slow} 0.4s both` }}>
          HUI — Deine kreative Welt
        </div>
      </div>
    </div>
  );
}