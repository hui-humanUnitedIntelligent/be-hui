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


// Lazy Sections — alle read-only
import { TalentSection }      from "../components/profile/sections/TalentSection.jsx";
import { WorksSection }       from "../components/profile/sections/WorksSection.jsx";
import { ExperiencesSection } from "../components/profile/sections/ExperiencesSection.jsx";
import { MomentsSection }     from "../components/profile/sections/MomentsSection.jsx";
import { RecommendationsSection } from "../components/profile/sections/RecommendationsSection.jsx";
import { OrbSignatur }        from "../components/profile/OrbSignatur.jsx";
import { PublicTalentOffersSection } from "../components/profile/sections/PublicTalentOffersSection.jsx";
import { useModalRegistration } from "../hooks/useModalRegistration.js";

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
  superadmin:  { label:"Superadmin",  bg:"rgba(120,60,200,0.15)", color:"#7B3FC4" },
  super_admin: { label:"Superadmin",  bg:"rgba(120,60,200,0.15)", color:"#7B3FC4" },
  admin:       { label:"Admin",       bg:"#1A1A2E", color:"#fff"  },
  talent:      { label:"Talent",      bg:"rgba(14,196,184,0.15)", color:"#0AADA3" },
  ambassador:  { label:"Ambassador",  bg:"rgba(255,107,82,0.12)", color:"#E55A3A" },
  basis:       { label:"Mitglied",    bg:"rgba(26,26,24,0.07)",   color:"rgba(26,26,24,0.55)" },
};
function RoleBadge({ role, isAmbassador }) {
  // Superadmin hat immer Vorrang — unabhängig von is_ambassador
  const isSuperAdmin = role === "superadmin" || role === "super_admin" || role === "admin";
  const key  = isSuperAdmin ? role : (isAmbassador ? "ambassador" : (role || "basis"));
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
        width:40, height:40, borderRadius:"50%",
        background:T.bgCard, border:`1.5px solid ${T.border}`,
        display:"flex", alignItems:"center", justifyContent:"center",
        cursor:"pointer", touchAction:"manipulation",
        boxShadow:"0 2px 10px rgba(26,26,24,0.10), 0 1px 3px rgba(26,26,24,0.07)",
        flexShrink:0, padding:0,
      }}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M11 4L6 9L11 14" stroke={T.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
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
          <OrbSignatur style={{ position:"absolute", inset:0 }} compact />
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
            display:"flex", alignItems:"center", justifyContent:"space-between",
            fontSize:26, color:T.teal,
          }}>
            {(profile?.display_name || "?")[0]?.toUpperCase() || "?"}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Aktions-Sektion: Verbinden + Folgen ───────────────────────────
function RelationButtons({ profileId = "", currentUserId = "", profile = {}, onFollowChange, onOpenChat }) {
  const [isFollowing,   setIsFollowing]   = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [isConnected,   setIsConnected]   = useState(false);
  const displayName = profile?.display_name || profile?.full_name || profile?.username || "diese Person";

  // Prüfe ob bereits gefolgt
  useEffect(() => {
    if (!profileId || !currentUserId || profileId === currentUserId) return;
    supabase
      .from("follows")
      .select("follower_id")
      .eq("follower_id", currentUserId)
      .eq("followed_id", profileId)
      .maybeSingle()
      .then(({ data }) => setIsFollowing(!!data))
      .catch(() => {});
  }, [profileId, currentUserId]);

  // Prüfe ob bereits verbunden (gegenseitig folgend = Verbindung)
  useEffect(() => {
    if (!profileId || !currentUserId || profileId === currentUserId) return;
    supabase
      .from("follows")
      .select("follower_id")
      .eq("follower_id", profileId)
      .eq("followed_id", currentUserId)
      .maybeSingle()
      .then(({ data: theyFollow }) => {
        if (theyFollow) setIsConnected(true);
      })
      .catch(() => {});
  }, [profileId, currentUserId, isFollowing]);

  if (!currentUserId || profileId === currentUserId) return null;

  const handleFollow = async (e) => {
    e?.stopPropagation();
    if (followLoading) return;
    setFollowLoading(true);
    const prevFollowing = isFollowing;
    try {
      if (isFollowing) {
        setIsFollowing(false);
        onFollowChange?.(-1);
        const { error } = await supabase.from("follows")
          .delete()
          .eq("follower_id", currentUserId)
          .eq("followed_id", profileId);
        if (error) {
          console.warn("[Follow] delete error:", error.message);
          setIsFollowing(true);
          onFollowChange?.(+1);
        }
      } else {
        setIsFollowing(true);
        onFollowChange?.(+1);
        const { error } = await supabase.from("follows")
          .upsert({ follower_id: currentUserId, followed_id: profileId }, { onConflict: "follower_id,followed_id", ignoreDuplicates: true });
        if (error) {
          console.warn("[Follow] upsert error:", error.message);
          setIsFollowing(false);
          onFollowChange?.(-1);
        }
      }
    } catch(e) {
      console.warn("[Follow] exception:", e);
      setIsFollowing(prevFollowing);
    }
    finally { setFollowLoading(false); }
  };

  const handleChat = (e) => {
    e?.stopPropagation();
    if (!profile?.id) return;
    onOpenChat?.({
      id: profile.id,
      display_name: profile.display_name || profile.username || "Mitglied",
      avatar_url: profile.avatar_url || null,
    });
  };

  // Verbindungs-Label: gegenseitig folgend = verbunden
  const connected = isFollowing && isConnected;

  // Kurzname für Button-Labels
  const shortName = (displayName || "").split(" ")[0] || displayName;

  return (
    <div style={{ display:"flex", flexDirection:"row", gap:8, padding:`0 ${T.px}px`, marginBottom:4 }}>
      {/* Verbinden Button — kompakt, teal gefüllt */}
      <button onClick={handleChat} className="ppp-press" style={{
        flex:1, height:36, borderRadius:T.r99,
        background: connected ? T.bgCard : T.teal,
        border: connected ? `1.5px solid ${T.border}` : "none",
        color: connected ? T.inkSoft : "#fff",
        fontWeight:600, fontSize:12, cursor:"pointer",
        touchAction:"manipulation", fontFamily:"inherit",
        display:"flex", alignItems:"center", justifyContent:"center", gap:6,
        boxShadow: connected ? T.card : T.glow,
        transition:"all .18s ease", whiteSpace:"nowrap", overflow:"hidden",
        paddingLeft:10, paddingRight:12,
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <span style={{ overflow:"hidden", textOverflow:"ellipsis" }}>
          {connected ? "Verbunden" : `Verbinden`}
        </span>
      </button>

      {/* Folgen Button — kompakt, outline */}
      <button onClick={handleFollow} disabled={followLoading} className="ppp-press" style={{
        flex:1, height:36, borderRadius:T.r99,
        background: isFollowing ? T.bgCard : "transparent",
        border: `1.5px solid ${isFollowing ? T.border : T.tealDeep}`,
        color: isFollowing ? T.inkSoft : T.tealDeep,
        fontWeight:600, fontSize:12, cursor:"pointer",
        touchAction:"manipulation", fontFamily:"inherit",
        display:"flex", alignItems:"center", justifyContent:"center", gap:6,
        transition:"all .18s ease", opacity: followLoading ? 0.6 : 1,
        whiteSpace:"nowrap", overflow:"hidden",
        paddingLeft:10, paddingRight:12,
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}>
          {isFollowing
            ? <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>
            : <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></>
          }
        </svg>
        <span style={{ overflow:"hidden", textOverflow:"ellipsis" }}>
          {isFollowing ? `Gefolgt` : `${shortName} folgen`}
        </span>
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
      {title && (
        <div style={{
          display:"flex", alignItems:"center", gap:10,
          padding:"14px 16px 10px", borderBottom:`1px solid ${T.border}`,
        }}>
          <span style={{ display:"flex", color:T.teal }}>{icon}</span>
          <span style={{ fontSize:14, fontWeight:800, color:T.ink, letterSpacing:"-0.01em" }}>{title}</span>
        </div>
      )}
      <div style={{ padding: title ? "12px 16px 16px" : "14px 16px 16px" }}>{children}</div>
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
          {[60,70,50,65,55].map((w,i) => <Skel key={i} w={w} h={20} r={T.r99}/>)}
        </div>
      ) : (
        <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
          {skills.map((s, i) => (
            <span key={i} style={{
              display:"inline-flex", alignItems:"center", gap:4,
              padding:"3px 8px", borderRadius:T.r99,
              background:T.bgCard, border:`1px solid ${T.tealMid}`,
              fontSize:11, fontWeight:600, color:T.ink, boxShadow:T.card,
            }}>
              {s?.icon && <span style={{ fontSize:11 }}>{s.icon}</span>}
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
      alignItems:"center", justifyContent:"space-between", gap:16, padding:32,
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
  useModalRegistration(true, () => onClose?.(), "PublicProfilePage");
  const { user } = useAuth();
  const isOwnProfile = user?.id === profileId;
  const { setShowChat, setChatRecipient } = useHome() || {};

  // Öffnet Chat direkt UND schließt das Profil — Reihenfolge: erst Recipient setzen, dann Profil schließen, dann Chat öffnen
  const handleOpenChat = useCallback((recipient) => {
    if (!recipient?.id || !setShowChat) return;
    setChatRecipient?.({
      id: recipient.id,
      display_name: recipient.display_name || "Mitglied",
      avatar_url: recipient.avatar_url || null,
    });
    onClose?.();          // Profil schließen
    setShowChat(true);    // Chat öffnen
  }, [setChatRecipient, setShowChat, onClose]);

  const {
    profile, works, experiences, recommendations, moments,
    followCounts, loading, loadingLazy, error, loadLazy, reload,
  } = useProfileData(profileId, false);

  // Live-Follower-Delta für sofortige UI-Reaktion
  const [followerDelta, setFollowerDelta] = useState(0);
  useEffect(() => { setFollowerDelta(0); }, [profileId]);
  const handleFollowChange = useCallback((delta) => setFollowerDelta(d => d + delta), []);

  // Lazy-Content laden sobald Profil da ist — einmalig pro profileId
  const lazyCalledRef = React.useRef(false);
  useEffect(() => { lazyCalledRef.current = false; }, [profileId]);
  useEffect(() => {
    if (profile && !lazyCalledRef.current) {
      lazyCalledRef.current = true;
      loadLazy?.();
    }
  }, [profile, loadLazy, profileId]);

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
        <NavBar onBack={handleBack} title="Öffentliches Profil" />

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
            /* ── 2-Spalten: Links Name+Badge, Rechts Ort+Website+Follower ── */
            <div style={{ display:"flex", alignItems:"stretch", gap:12 }}>
              {/* LINKS */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:20, fontWeight:800, color:T.ink, letterSpacing:"-0.025em", lineHeight:1.2 }}>
                  {profile.display_name || profile.full_name || profile.username || "Unbekannt"}
                </div>
                {profile.username && (
                  <div style={{ fontSize:13, color:T.inkSoft, marginTop:3 }}>@{profile.username}</div>
                )}
                <div style={{ marginTop:7 }}>
                  <RoleBadge role={profile.role} isAmbassador={profile.is_ambassador}/>
                </div>
              </div>

              {/* RECHTS: vertikal zentriert zwischen Oberkante Name und Unterkante Badge */}
              <div style={{
                display:"flex", flexDirection:"column", justifyContent:"space-between",
                gap:5, alignItems:"flex-start",
                flexShrink:0, width:"45%",
              }}>
                {profile.location_final && (
                  <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, color:T.inkSoft }}>
                    <HUILocationIcon size={12} style={{ color:T.coral, flexShrink:0 }}/>
                    <span style={{ lineHeight:1.3 }}>{profile.location_final}</span>
                  </div>
                )}
                {profile.website && (
                  <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:12 }}>
                    <span style={{ fontSize:11, flexShrink:0 }}>🔗</span>
                    <a href={profile.website.startsWith("http") ? profile.website : "https://"+profile.website}
                      target="_blank" rel="noopener noreferrer"
                      style={{ color:T.teal, fontWeight:600, textDecoration:"none" }}
                      onClick={e => e.stopPropagation()}>
                      {profile.website.replace(/^https?:\/\//, "")}
                    </a>
                  </div>
                )}
                <div style={{ display:"flex", gap:10, fontSize:12, color:T.inkSoft }}>
                  <span><strong style={{ color:T.ink }}>{(followCounts?.followers ?? 0) + followerDelta}</strong> Follower</span>
                  <span><strong style={{ color:T.ink }}>{followCounts?.following ?? 0}</strong> folgt</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <Gap h={14}/>

        {/* ── AKTIONS-BUTTONS ── */}
        {profile && !isOwnProfile && (
          <RelationButtons profileId={profileId} currentUserId={user?.id} profile={profile} onFollowChange={handleFollowChange} onOpenChat={handleOpenChat} />
        )}
        {profile && !isOwnProfile && <Gap h={14}/>}

        {/* ── QUICK STATS ── */}
        {profile && (
          <QuickStats followCounts={{ ...followCounts, followers: (followCounts?.followers ?? 0) + followerDelta }} works={works} experiences={experiences} moments={moments} />
        )}
        <Gap h={16}/>

        {/* ── BIO ── */}
        <BioCard profile={profile} loading={loading}/>
        {profile?.bio && <Gap h={12}/>}

        {/* ── EMPFEHLUNGEN / KUNDENSTIMMEN — direkt unter Bio, immer sichtbar ── */}
        <SectionCard icon={<HUIImpactIcon size={16}/>} title="Empfehlungen" delay={60}>
            <RecommendationsSection recommendations={recommendations} isOwner={false} loading={loadingLazy} profileOwnerId={profileId || ""} profileOwnerName={profile?.display_name || profile?.nickname || ""} />
        </SectionCard>
        <Gap h={12}/>

        {/* ── SKILLS ── */}
        <SkillsCard profile={profile} loading={loading}/>
        <Gap h={12}/>

        {/* ── TALENT-SEKTION (Skills-Chips) ── */}
        {(profile?.has_talent_profile || profile?.is_talent) && (
          <>
            <SectionCard icon={<HUITalentIcon size={16}/>} title="" delay={80}>
                <TalentSection profile={profile} isOwner={false} loading={loading} noPadding />
            </SectionCard>
            <Gap h={12}/>
          </>
        )}

        {/* ── TALENT-ANGEBOTE (aus talents-Tabelle, nur approved) ── */}
        {(profile?.has_talent_profile || profile?.is_talent) && profileId && (
          <>
            <SectionCard icon={<HUITalentIcon size={16}/>} title="Talent-Angebote" delay={90}>
              <PublicTalentOffersSection profileId={profileId}/>
            </SectionCard>
            <Gap h={12}/>
          </>
        )}

        {/* ── WERKE ── immer anzeigen, Platzhalter wenn leer */}
        {profile && (
          <>
            <SectionCard icon={<HUIWerkeIcon size={16}/>} title="Werke" delay={100}>
              {loadingLazy ? (
                <div style={{display:"flex",gap:10,overflowX:"auto"}}>{[1,2,3].map(i=><Skel key={i} w={120} h={120} r={T.r12}/>)}</div>
              ) : works.length > 0 ? (
                  <WorksSection works={works} profile={profile} isOwner={false} loading={false} />
              ) : (
                <div style={{ padding:"16px 0", textAlign:"center", color:T.inkFaint, fontSize:13 }}>
                  🎨 Noch keine Werke vorhanden
                </div>
              )}
            </SectionCard>
            <Gap h={12}/>
          </>
        )}

        {/* ── MOMENTE ── immer anzeigen, Platzhalter wenn leer */}
        {profile && (
          <>
            <SectionCard icon={<span style={{ fontSize:16 }}>💬</span>} title="Momente" delay={120}>
              {loadingLazy ? (
                <div style={{display:"flex",gap:8,overflowX:"auto"}}>{[1,2,3].map(i=><Skel key={i} w={100} h={100} r={T.r12}/>)}</div>
              ) : moments.length > 0 ? (
                  <MomentsSection moments={moments} isOwner={false} loading={false} />
              ) : (
                <div style={{ padding:"16px 0", textAlign:"center", color:T.inkFaint, fontSize:13 }}>
                  💬 Noch keine Momente geteilt
                </div>
              )}
            </SectionCard>
            <Gap h={12}/>
          </>
        )}

        {/* ── ERLEBNISSE ── immer anzeigen, Platzhalter wenn leer */}
        {profile && (
          <>
            <SectionCard icon={<HUIErlebnisIcon size={16}/>} title="Erlebnisse" delay={140}>
              {loadingLazy ? (
                <div style={{display:"flex",gap:10,overflowX:"auto"}}>{[1,2].map(i=><Skel key={i} w={180} h={110} r={T.r12}/>)}</div>
              ) : experiences.length > 0 ? (
                  <ExperiencesSection experiences={experiences} isOwner={false} loading={false} />
              ) : (
                <div style={{ padding:"16px 0", textAlign:"center", color:T.inkFaint, fontSize:13 }}>
                  ⭐ Noch keine Erlebnisse angeboten
                </div>
              )}
            </SectionCard>
            <Gap h={12}/>
          </>
        )}

        {/* ── STANDORT ── */}



        {/* ── LEER-STATE — nur noch wenn KEINE Empfehlungen und kein Talent (alles andere hat eigenen Platzhalter) ── */}
        {!loading && !loadingLazy && profile &&
          recommendations.length === 0 &&
          !profile.has_talent_profile && !profile.is_talent && (
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
