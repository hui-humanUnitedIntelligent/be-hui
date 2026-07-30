// src/pages/PublicProfilePage.jsx — HUI Öffentliches Profil v1 (2026-07-30)
// ════════════════════════════════════════════════════════════════════════
// REINE LESE-ANSICHT — kein Bearbeiten, kein Hochladen, keine Schreibrechte
// Zeigt: Basis-Infos, Bio, Talente, Werke, Momente, Experiences, Impact,
//        Follower-Zähler. Keine sensiblen Felder (phone, trust_score, etc.)
//
// Architektur:
//   useProfileData(profileId) → Phase1: Profil sofort / Phase2: lazy Content
//   Layout: TalentProfilePage-ähnlich (Cover + Avatar + Header + Sections)
//   Alle Sections read-only (isOwner=false, readOnly=true)
//
// Ersetzt: BasisProfilePage.jsx (archiviert unter .archive/public_profile_v1_2026-07-30/)
// ════════════════════════════════════════════════════════════════════════

import React, {
  useState, useEffect, useCallback, useMemo, useRef
} from "react";
import { createPortal } from "react-dom";
import { supabase } from "../lib/supabaseClient.js";
import { useAuth }  from "../lib/AuthContext.jsx";
import { useHome }  from "../components/home/HomeShell.jsx";
import { useProfileData } from "../hooks/useProfileData.js";
import { NAV_CLEARANCE_CSS } from "../components/home/navigation/navigationGeometry.js";
import {
  HUIWerkeIcon, HUIErlebnisIcon, HUIImpactIcon, HUITalentIcon,
  HUIKalenderIcon, HUILocationIcon, HUISettingsIcon,
} from '../design/icons/HuiSystemIcons.jsx';
import { HUIChatIcon, HUIBookmarkIcon } from '../design/icons/HuiInteractionIcons.jsx';
import { ProfileHeader } from "../components/profile/ProfileHeader.jsx";
import { notifyWatcher } from "../lib/notificationService.js";

// ── DEBUG: Module loaded signal ──
if (typeof document !== "undefined") {
  const __d = document.createElement("div");
  __d.id = "__ppp_module_loaded__";
  __d.style.display = "none";
  __d.textContent = "PPP_MODULE_LOADED";
  document.body.appendChild(__d);
}


// Lazy Sections — alle read-only
const TalentSection          = React.lazy(() => import("../components/profile/sections/TalentSection.jsx").then(m => ({ default: m.TalentSection })));
const WorksSection           = React.lazy(() => import("../components/profile/sections/WorksSection.jsx").then(m => ({ default: m.WorksSection })));
const ExperiencesSection     = React.lazy(() => import("../components/profile/sections/ExperiencesSection.jsx").then(m => ({ default: m.ExperiencesSection })));
const MomentsSection         = React.lazy(() => import("../components/profile/sections/MomentsSection.jsx").then(m => ({ default: m.MomentsSection })));
const RecommendationsSection = React.lazy(() => import("../components/profile/sections/RecommendationsSection.jsx").then(m => ({ default: m.RecommendationsSection })));
const LocationSection        = React.lazy(() => import("../components/profile/sections/LocationSection.jsx").then(m => ({ default: m.LocationSection })));
const OrbSignatur            = React.lazy(() => import("../components/profile/OrbSignatur.jsx").then(m => ({ default: m.OrbSignatur })));

// ── Design Tokens (HUI-Standard) ─────────────────────────────────
const T = {
  bg:        "#F7F5F0",
  bgCard:    "#FFFFFF",
  bgSheet:   "rgba(252,251,248,0.98)",
  teal:      "#0EC4B8",
  tealDeep:  "#0AADA3",
  tealSoft:  "rgba(14,196,184,0.10)",
  tealMid:   "rgba(14,196,184,0.22)",
  coral:     "#FF6B52",
  ink:       "#1A1A18",
  inkSoft:   "rgba(26,26,24,0.52)",
  inkFaint:  "rgba(26,26,24,0.28)",
  border:    "rgba(26,26,24,0.08)",
  borderMid: "rgba(26,26,24,0.13)",
  px: 20,
  r12:12, r16:16, r20:20, r24:24, r99:99,
  card:  "0 1px 8px rgba(26,26,24,0.07), 0 1px 2px rgba(26,26,24,0.04)",
  cardMd:"0 2px 16px rgba(26,26,24,0.09), 0 1px 4px rgba(26,26,24,0.05)",
  glow:  "0 4px 18px rgba(14,196,184,0.26)",
  sheet: "0 -10px 40px rgba(26,26,24,0.10)",
};

const CSS = `
  .ppp-root{background:${T.bg};font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',sans-serif;color:${T.ink};}
  .ppp-scroll{overflow-y:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;}
  .ppp-scroll::-webkit-scrollbar{display:none;}
  @keyframes ppp-fade-up{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes ppp-shimmer{from{background-position:-200% 0}to{background-position:200% 0}}
  .ppp-skel{background:linear-gradient(90deg,rgba(26,26,24,.05) 25%,rgba(26,26,24,.09) 50%,rgba(26,26,24,.05) 75%);background-size:200% 100%;animation:ppp-shimmer 1.4s ease-in-out infinite;border-radius:8px;}
  .ppp-press{transition:transform .12s cubic-bezier(.22,1,.36,1),opacity .12s ease;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;}
  .ppp-press:active{transform:scale(0.94);opacity:0.75;}
  .ppp-press-light{transition:transform .14s ease,opacity .14s ease;}
  .ppp-press-light:active{transform:scale(0.97);opacity:0.82;}
  .ppp-in{animation:ppp-fade-up .45s ease both;}
  .ppp-badge{display:inline-flex;align-items:center;gap:5px;padding:4px 12px;border-radius:99px;font-size:12px;font-weight:700;}
  .ppp-stat{display:flex;flex-direction:column;align-items:center;gap:3px;flex:1;}
`;

// ── Atoms ─────────────────────────────────────────────────────────
function Gap({ h=16 }) { return <div style={{ height:h }}/>; }
function Skel({ w, h=14, r=8 }) {
  return <div className="ppp-skel" style={{ width:w, height:h, borderRadius:r, flexShrink:0 }}/>;
}

// ── Rollen-Badge ──────────────────────────────────────────────────
const ROLE_MAP = {
  superadmin:  { label:"Superadmin",  bg:"#1A1A2E", color:"#fff"  },
  super_admin: { label:"Superadmin",  bg:"#1A1A2E", color:"#fff"  },
  admin:       { label:"Admin",       bg:"#1A1A2E", color:"#fff"  },
  talent:      { label:"Talent",      bg:"rgba(14,196,184,0.15)", color:"#0AADA3" },
  ambassador:  { label:"Ambassador",  bg:"rgba(255,107,82,0.12)", color:"#E55A3A" },
  basis:       { label:"Mitglied",    bg:"rgba(26,26,24,0.07)",   color:"rgba(26,26,24,0.55)" },
};
function RoleBadge({ role, isAmbassador }) {
  const key  = isAmbassador ? "ambassador" : (role || "basis");
  const conf = ROLE_MAP[key] || ROLE_MAP.basis;
  return (
    <span className="ppp-badge" style={{ background:conf.bg, color:conf.color }}>
      <span style={{ fontSize:10 }}>✦</span>{conf.label}
    </span>
  );
}

// ── NavBar ────────────────────────────────────────────────────────
function NavBar({ onBack = () => {}, title = "Öffentliches Profil" }) {
  return (
    <div style={{
      display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:`14px ${T.px}px 10px`, background:T.bg,
    }}>
      <button className="ppp-press" onClick={onBack} aria-label="Zurück" style={{
        width:36, height:36, borderRadius:"50%",
        background:T.bgCard, border:`1px solid ${T.border}`,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:18, cursor:"pointer", touchAction:"manipulation",
        boxShadow:T.card, color:T.ink, fontFamily:"sans-serif",
      }}>‹</button>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:15.5, fontWeight:700, color:T.ink, letterSpacing:"-0.02em" }}>
          {title}
        </div>
        <div style={{ fontSize:11, color:T.inkFaint, marginTop:1 }}>
          Entdecke diese Person
        </div>
      </div>
      {/* Platzhalter rechts für Symmetrie */}
      <div style={{ width:36 }}/>
    </div>
  );
}

// ── Profil-Skeleton ────────────────────────────────────────────────
function ProfileSkeleton() {
  return (
    <div style={{ background:T.bg }}>
      <div className="ppp-skel" style={{ width:"100%", height:140, borderRadius:0 }}/>
      <div style={{ padding:"0 20px", marginTop:-36 }}>
        <div className="ppp-skel" style={{ width:72, height:72, borderRadius:"50%", border:"3px solid "+T.bg }}/>
        <div style={{ marginTop:12, display:"flex", flexDirection:"column", gap:8 }}>
          <Skel w={160} h={18}/>
          <Skel w={100} h={13}/>
          <Skel w={130} h={13}/>
        </div>
        <div style={{ display:"flex", gap:24, marginTop:20 }}>
          {[80,80,80].map((w,i) => <div key={i}><Skel w={w} h={16}/></div>)}
        </div>
        <div style={{ marginTop:24, display:"flex", flexDirection:"column", gap:10 }}>
          <Skel w="100%" h={14}/><Skel w="85%" h={14}/><Skel w="70%" h={14}/>
        </div>
      </div>
    </div>
  );
}

// ── Cover + Avatar ─────────────────────────────────────────────────
function ProfileHero({ profile = {}, loading = false }) {
  const cover  = profile?.header_img || null;
  const avatar = profile?.avatar_url || null;
  return (
    <div style={{ position:"relative" }}>
      <div style={{
        width:"100%", height:140, overflow:"hidden",
        background:"linear-gradient(135deg,#0EC4B8 0%,#0AADA3 60%,rgba(26,26,24,0.15) 100%)",
        position:"relative",
      }}>
        {cover && (
          <img src={cover} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} loading="lazy" />
        )}
        {!cover && (
          <React.Suspense fallback={null}>
            <OrbSignatur style={{ position:"absolute", inset:0 }} compact />
          </React.Suspense>
        )}
      </div>
      <div style={{
        position:"absolute", bottom:-32, left:T.px,
        width:68, height:68, borderRadius:"50%",
        border:`3px solid ${T.bg}`,
        background:T.bgCard,
        boxShadow:T.card, overflow:"hidden",
      }}>
        {avatar ? (
          <img src={avatar} alt="Avatar" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
        ) : (
          <div style={{
            width:"100%", height:"100%", background:T.tealSoft,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:26, color:T.teal,
          }}>
            {(profile?.display_name || "?")[0]?.toUpperCase() || "?"}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Beziehungs-Buttons: Im Blick behalten + Nachricht ─────────────
function RelationButtons({ profileId = "", currentUserId = "", profile = {} }) {
  const [watching,     setWatching]    = useState(false);
  const [watchLoading, setWatchLoad]  = useState(false);
  const { setShowChat, setChatRecipient } = useHome() || {};

  useEffect(() => {
    if (!profileId || !currentUserId || profileId === currentUserId) return;
    supabase
      .from("profile_watchlist")
      .select("id")
      .eq("watcher_id", currentUserId)
      .eq("profile_id", profileId)
      .maybeSingle()
      .then(({ data }) => setWatching(!!data))
      .catch(() => {});
  }, [profileId, currentUserId]);

  if (!currentUserId || profileId === currentUserId) return null;

  const handleWatch = async () => {
    if (watchLoading) return;
    setWatchLoad(true);
    try {
      if (watching) {
        await supabase.from("profile_watchlist")
          .delete().eq("watcher_id", currentUserId).eq("profile_id", profileId);
        setWatching(false);
      } else {
        await supabase.from("profile_watchlist")
          .insert({ watcher_id: currentUserId, profile_id: profileId });
        setWatching(true);
        await notifyWatcher(profileId, currentUserId).catch(() => {});
      }
    } catch(e) { /* Realtime/Reload gleicht ab */ }
    finally { setWatchLoad(false); }
  };

  const handleChat = () => {
    if (!profile?.id || !setShowChat) return;
    setChatRecipient?.({
      id: profile.id,
      display_name: profile.display_name || profile.username || "Mitglied",
      avatar_url: profile.avatar_url || null,
    });
    setShowChat?.(true);
  };

  return (
    <div style={{ display:"flex", gap:10, padding:`0 ${T.px}px`, marginBottom:4 }}>
      <button onClick={handleWatch} disabled={watchLoading} className="ppp-press" style={{
        flex:1, height:42, borderRadius:T.r99,
        background: watching ? T.teal : "transparent",
        border: `1.5px solid ${watching ? T.teal : T.tealDeep}`,
        color: watching ? "#fff" : T.tealDeep,
        fontWeight:700, fontSize:14, cursor:"pointer",
        touchAction:"manipulation", fontFamily:"inherit",
        display:"flex", alignItems:"center", justifyContent:"center", gap:7,
        boxShadow: watching ? T.glow : "none",
        transition:"all .18s ease", opacity: watchLoading ? 0.6 : 1,
      }}>
        <span style={{ fontSize:16 }}>🔭</span>
        {watching ? "Im Blick" : "Im Blick behalten"}
      </button>
      <button onClick={handleChat} className="ppp-press" style={{
        width:42, height:42, borderRadius:"50%",
        background:T.bgCard, border:`1.5px solid ${T.border}`,
        display:"flex", alignItems:"center", justifyContent:"center",
        cursor:"pointer", touchAction:"manipulation",
        boxShadow:T.card, color:T.ink, flexShrink:0,
      }} aria-label="Nachricht senden">
        <HUIChatIcon size={18}/>
      </button>
    </div>
  );
}

// ── QuickStats ─────────────────────────────────────────────────────
function QuickStats({ followCounts = {}, works = [], experiences = [], moments = [] }) {
  const stats = [
    { icon:"👥", val: followCounts?.followers ?? 0,   label:"Follower"  },
    { icon:"🌟", val: works?.length ?? 0,              label:"Werke"     },
    { icon:"💬", val: moments?.length ?? 0,            label:"Momente"   },
    { icon:"⭐", val: experiences?.length ?? 0,        label:"Erlebnisse"},
  ];
  return (
    <div style={{
      display:"flex", padding:`12px ${T.px}px`,
      background:T.bgCard, borderRadius:T.r16,
      margin:`0 ${T.px}px`,
      boxShadow:T.card, border:`1px solid ${T.border}`,
    }}>
      {stats.map((s, i) => (
        <div key={i} className="ppp-stat">
          <span style={{ fontSize:18 }}>{s.icon}</span>
          <span style={{ fontSize:17, fontWeight:800, color:T.ink }}>{s.val}</span>
          <span style={{ fontSize:10.5, color:T.inkFaint, fontWeight:500 }}>{s.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── SectionCard ────────────────────────────────────────────────────
function SectionCard({ icon, title = "", children, delay = 0 }) {
  return (
    <div className="ppp-in" style={{
      animationDelay:`${delay}ms`,
      margin:`0 ${T.px}px`,
      background:T.bgCard, borderRadius:T.r16,
      border:`1px solid ${T.border}`, boxShadow:T.card,
      overflow:"hidden",
    }}>
      <div style={{
        display:"flex", alignItems:"center", gap:10,
        padding:"14px 16px 10px", borderBottom:`1px solid ${T.border}`,
      }}>
        <span style={{ display:"flex", color:T.teal }}>{icon}</span>
        <span style={{ fontSize:14, fontWeight:800, color:T.ink, letterSpacing:"-0.01em" }}>{title}</span>
      </div>
      <div style={{ padding:"12px 16px 16px" }}>{children}</div>
    </div>
  );
}

// ── Bio-Karte ──────────────────────────────────────────────────────
function BioCard({ profile = {}, loading = false }) {
  if (loading && !profile?.bio) return null;
  const bio = profile?.bio;
  if (!bio) return null;
  return (
    <div style={{
      margin:`0 ${T.px}px`, background:T.bgCard, borderRadius:T.r16,
      border:`1px solid ${T.border}`, boxShadow:T.card, padding:"14px 16px",
    }}>
      <p style={{ margin:0, fontSize:14, lineHeight:1.6, color:T.ink, fontStyle:"italic" }}>
        „{bio}"
      </p>
    </div>
  );
}

// ── Skills/Interessen ──────────────────────────────────────────────
function SkillsCard({ profile = {}, loading = false }) {
  const skills = Array.isArray(profile?.skills_final) ? profile.skills_final : [];
  if (!loading && skills.length === 0) return null;
  return (
    <SectionCard icon={<HUITalentIcon size={16}/>} title="Interessen & Schwerpunkte" delay={60}>
      {loading ? (
        <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
          {[100,120,80,110,90].map((w,i) => <Skel key={i} w={w} h={32} r={T.r99}/>)}
        </div>
      ) : (
        <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
          {skills.map((s, i) => (
            <span key={i} style={{
              padding:"6px 14px", borderRadius:T.r99,
              background:T.tealSoft, border:`1px solid ${T.tealMid}`,
              fontSize:13, fontWeight:600, color:T.tealDeep,
            }}>
              {s?.icon && <span style={{ marginRight:4 }}>{s.icon}</span>}
              {typeof s === "string" ? s : (s?.label || s?.name || "")}
            </span>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

// ── Fehler-View ────────────────────────────────────────────────────
function ErrorView({ onClose = () => {} }) {
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:10500, background:T.bg,
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", gap:16, padding:32,
    }}>
      <span style={{ fontSize:40 }}>🔍</span>
      <p style={{ fontSize:16, fontWeight:700, color:T.ink, textAlign:"center", margin:0 }}>
        Profil nicht gefunden
      </p>
      <p style={{ fontSize:13, color:T.inkSoft, textAlign:"center", margin:0 }}>
        Dieses Profil existiert nicht oder ist nicht öffentlich sichtbar.
      </p>
      <button onClick={onClose} className="ppp-press" style={{
        marginTop:8, padding:"12px 32px", borderRadius:T.r99,
        background:T.teal, border:"none", color:"#fff",
        fontWeight:700, fontSize:14, cursor:"pointer",
        boxShadow:T.glow, fontFamily:"inherit",
      }}>Zurück</button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// HAUPT-KOMPONENTE
// ══════════════════════════════════════════════════════════════════
export default function PublicProfilePage({ profileId, onClose = () => {} }) {
  const { user } = useAuth();
  const isOwnProfile = user?.id === profileId;

  const {
    profile, works, experiences, recommendations, moments,
    followCounts, loading, loadingLazy, error, loadLazy, reload,
  } = useProfileData(profileId, false);

  // Lazy-Content laden sobald Profil da ist
  useEffect(() => {
    if (profile && !loadingLazy) loadLazy?.();
  }, [!!profile]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleBack = useCallback(() => onClose?.(), [onClose]);

  // Fehler-State
  if (!loading && error && !profile) {
    return createPortal(
      <div className="ppp-root" style={{ position:"fixed", inset:0, zIndex:10500 }}>
        <style>{CSS}</style>
        <ErrorView onClose={handleBack}/>
      </div>,
      document.body
    );
  }

  const displayName = profile?.display_name || profile?.full_name || profile?.username || "";

  return createPortal(
    <div className="ppp-root" style={{ position:"fixed", inset:0, zIndex:10500, overflowY:"hidden" }}>
      <style>{CSS}</style>
      <div className="ppp-scroll" style={{
        position:"absolute", inset:0,
        paddingBottom: isOwnProfile ? NAV_CLEARANCE_CSS : "calc(88px + env(safe-area-inset-bottom, 0px))",
        overflowY:"auto",
      }}>
        <NavBar onBack={handleBack} title={displayName || "Öffentliches Profil"} />

        {loading && !profile && <ProfileSkeleton/>}
        {(profile || loading) && <ProfileHero profile={profile} loading={loading}/>}
        <Gap h={40}/>

        {/* ── PROFIL-INFOS ── */}
        <div style={{ padding:`0 ${T.px}px` }}>
          {loading && !profile ? (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              <Skel w={180} h={20}/><Skel w={110} h={14}/>
            </div>
          ) : profile ? (
            <div>
              <div style={{ fontSize:20, fontWeight:800, color:T.ink, letterSpacing:"-0.025em", lineHeight:1.2 }}>
                {profile.display_name || profile.full_name || profile.username || "Unbekannt"}
              </div>
              {profile.username && (
                <div style={{ fontSize:13, color:T.inkSoft, marginTop:3 }}>@{profile.username}</div>
              )}
            </div>
          ) : null}

          <Gap h={8}/>
          {profile && <RoleBadge role={profile.role} isAmbassador={profile.is_ambassador}/>}
          <Gap h={8}/>

          {profile && (profile.location_final || profile.website) && (
            <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
              {profile.location_final && (
                <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:13, color:T.inkSoft }}>
                  <HUILocationIcon size={13} style={{ color:T.coral, flexShrink:0 }}/>
                  {profile.location_final}
                </div>
              )}
              {profile.website && (
                <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:13 }}>
                  <span style={{ fontSize:12 }}>🔗</span>
                  <a href={profile.website.startsWith("http") ? profile.website : "https://"+profile.website}
                    target="_blank" rel="noopener noreferrer"
                    style={{ color:T.teal, fontWeight:600, textDecoration:"none" }}
                    onClick={e => e.stopPropagation()}>
                    {profile.website.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              )}
            </div>
          )}

          <Gap h={4}/>
          {profile && (
            <div style={{ display:"flex", gap:16, fontSize:13, color:T.inkSoft }}>
              <span><strong style={{ color:T.ink }}>{followCounts?.followers ?? 0}</strong> Follower</span>
              <span><strong style={{ color:T.ink }}>{followCounts?.following ?? 0}</strong> folgt</span>
            </div>
          )}
        </div>

        <Gap h={14}/>

        {/* ── AKTIONS-BUTTONS ── */}
        {profile && !isOwnProfile && (
          <RelationButtons profileId={profileId} currentUserId={user?.id} profile={profile} />
        )}
        {profile && !isOwnProfile && <Gap h={14}/>}

        {/* ── QUICK STATS ── */}
        {profile && (
          <QuickStats followCounts={followCounts} works={works} experiences={experiences} moments={moments} />
        )}
        <Gap h={16}/>

        {/* ── BIO ── */}
        <BioCard profile={profile} loading={loading}/>
        {profile?.bio && <Gap h={12}/>}

        {/* ── SKILLS ── */}
        <SkillsCard profile={profile} loading={loading}/>
        <Gap h={12}/>

        {/* ── TALENT-SEKTION ── */}
        {(profile?.has_talent_profile || profile?.is_talent) && (
          <>
            <SectionCard icon={<HUITalentIcon size={16}/>} title="Talente & Angebote" delay={80}>
              <React.Suspense fallback={<div style={{display:"flex",flexDirection:"column",gap:8}}>{[1,2].map(i=><Skel key={i} w="100%" h={72} r={T.r12}/>)}</div>}>
                <TalentSection profile={profile} isOwner={false} loading={loading} />
              </React.Suspense>
            </SectionCard>
            <Gap h={12}/>
          </>
        )}

        {/* ── WERKE ── */}
        {(works.length > 0 || loadingLazy) && (
          <>
            <SectionCard icon={<HUIWerkeIcon size={16}/>} title="Werke" delay={100}>
              <React.Suspense fallback={<div style={{display:"flex",gap:10,overflowX:"auto"}}>{[1,2,3].map(i=><Skel key={i} w={120} h={120} r={T.r12}/>)}</div>}>
                <WorksSection works={works} profile={profile} isOwner={false} loading={loadingLazy} />
              </React.Suspense>
            </SectionCard>
            <Gap h={12}/>
          </>
        )}

        {/* ── MOMENTE ── */}
        {(moments.length > 0 || loadingLazy) && (
          <>
            <SectionCard icon={<span style={{ fontSize:16 }}>💬</span>} title="Momente" delay={120}>
              <React.Suspense fallback={<div style={{display:"flex",gap:8,overflowX:"auto"}}>{[1,2,3].map(i=><Skel key={i} w={100} h={100} r={T.r12}/>)}</div>}>
                <MomentsSection moments={moments} isOwner={false} loading={loadingLazy} />
              </React.Suspense>
            </SectionCard>
            <Gap h={12}/>
          </>
        )}

        {/* ── ERLEBNISSE ── */}
        {(experiences.length > 0 || loadingLazy) && (
          <>
            <SectionCard icon={<HUIErlebnisIcon size={16}/>} title="Erlebnisse" delay={140}>
              <React.Suspense fallback={<div style={{display:"flex",gap:10,overflowX:"auto"}}>{[1,2].map(i=><Skel key={i} w={180} h={110} r={T.r12}/>)}</div>}>
                <ExperiencesSection experiences={experiences} isOwner={false} loading={loadingLazy} />
              </React.Suspense>
            </SectionCard>
            <Gap h={12}/>
          </>
        )}

        {/* ── STANDORT ── */}
        {profile?.location_final && (
          <>
            <SectionCard icon={<HUILocationIcon size={16}/>} title="Standort" delay={160}>
              <React.Suspense fallback={<Skel w="100%" h={80} r={T.r12}/>}>
                <LocationSection profile={profile} isOwner={false} loading={loading} />
              </React.Suspense>
            </SectionCard>
            <Gap h={12}/>
          </>
        )}

        {/* ── EMPFEHLUNGEN ── */}
        {(recommendations.length > 0 || loadingLazy) && (
          <>
            <SectionCard icon={<HUIImpactIcon size={16}/>} title="Empfehlungen" delay={180}>
              <React.Suspense fallback={<Skel w="100%" h={60} r={T.r12}/>}>
                <RecommendationsSection recommendations={recommendations} isOwner={false} loading={loadingLazy} />
              </React.Suspense>
            </SectionCard>
            <Gap h={12}/>
          </>
        )}

        {/* ── LEER-STATE ── */}
        {!loading && !loadingLazy && profile &&
          works.length === 0 && moments.length === 0 &&
          experiences.length === 0 && recommendations.length === 0 &&
          !profile.has_talent_profile && (
          <div style={{
            margin:`0 ${T.px}px`, padding:"24px 16px",
            background:T.bgCard, borderRadius:T.r16,
            border:`1px solid ${T.border}`, boxShadow:T.card, textAlign:"center",
          }}>
            <div style={{ fontSize:28, marginBottom:8 }}>🌱</div>
            <p style={{ fontSize:14, color:T.inkSoft, margin:0, lineHeight:1.5 }}>
              Diese Person hat noch keine Inhalte geteilt.
            </p>
          </div>
        )}
        <Gap h={16}/>
      </div>
    </div>,
    document.body
  );
}
