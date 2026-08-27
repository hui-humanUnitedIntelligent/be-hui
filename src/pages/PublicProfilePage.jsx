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
import { useProfileData } from "../hooks/useProfileData.js";
import { NAV_CLEARANCE_CSS } from "../components/home/navigation/navigationGeometry.js";
import {
  HUIWerkeIcon, HUIErlebnisIcon, HUIImpactIcon, HUITalentIcon, HUIMomenteIcon, HUITalentStarIcon,
  HUIKalenderIcon, HUISettingsIcon,
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
import { PublicTalentOffersSection } from "../components/profile/sections/PublicTalentOffersSection.jsx";
import { useModalRegistration } from "../hooks/useModalRegistration.js";
import SupportFlow from "../components/economy/SupportFlow.jsx";
import { useTranslation } from "../hooks/useTranslation.js";

// UNTERSTÜTZEN-BUTTON TEMPORÄR VERSTECKT (2026-08-18, Michael-Request):
// Code/State/SupportFlow bleiben vollständig erhalten (no-regression-protection.md) —
// nur der Render wird unterdrückt. Zum Reaktivieren: SHOW_SUPPORT_BUTTON = true.
const SHOW_SUPPORT_BUTTON = false;

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
  .ppp-root{background:${T.bg};font-family:Inter,sans-serif;color:${T.ink};}
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
  .ppp-badge{display:inline-flex;align-items:center;gap:5px;padding:4px 12px;border-radius:99px;font-size:12px;font-weight:600;}
  .ppp-stat{display:flex;flex-direction:column;align-items:center;gap:3px;flex:1;}
`;

// ── Atoms ─────────────────────────────────────────────────────────
function Gap({ h=16 }) { return <div style={{ height:h }}/>; }
function Skel({ w, h=14, r=8 }) {
  return <div className="ppp-skel" style={{ width:w, height:h, borderRadius:r, flexShrink:0 }}/>;
}

// ── Rollen-Badge ──────────────────────────────────────────────────
// ── NavBar ────────────────────────────────────────────────────────
function NavBar({ onBack = () => {}, title = "Öffentliches Profil" }) {
  return (
    <div style={{
      display:"flex", alignItems:"center", justifyContent:"space-between",
      // SAFE-AREA-TOP-FIX (2026-08-10): 3-Ebenen-Fallback wie NAV_SAFE_BOTTOM_CSS
      padding:`max(var(--hui-safe-top, 0px), 14px, env(safe-area-inset-top, 14px)) ${T.px}px 10px`, background:T.bg,
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
        <div style={{ fontSize:15.5, fontWeight: 600, color:T.ink, letterSpacing:"-0.02em" }}>
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

// ── Aktions-Sektion: Verbinden + Folgen ───────────────────────────
// CHAT-LOGIK-v2 (2026-08-22, Michael): "Verbinden"-Button entfernt — Chat
// ist ab sofort ausschließlich nach Buchung/Kauf verfügbar (öffnet automatisch
// nach Bezahlung), nicht mehr per Klick von einem beliebigen Profil aus.
function RelationButtons({ profileId = "", currentUserId = "", profile = {}, onFollowChange }) {
  const [isFollowing,   setIsFollowing]   = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
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

  // Kurzname für Button-Labels
  const shortName = (displayName || "").split(" ")[0] || displayName;

  return (
    <div style={{ display:"flex", flexDirection:"row", gap:8, padding:`0 ${T.px}px`, marginBottom:4 }}>
      {/* Folgen Button — einziger Aktions-Button (Verbinden entfernt, CHAT-LOGIK-v2) */}
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
// STATS-DEEPLINK-001 (2026-08-16, Michael-Request): Zeile zeigt jetzt
// Talent/Werke/Momente/Erlebnisse (statt Follower — die Follower-Zahl
// bleibt bereits sichtbar im ProfileHeader darüber, siehe followCounts-Block
// dort). Jede Kachel ist klickbar und scrollt per onStatClick(key) zur
// jeweiligen Section weiter unten auf der Seite (kein Modal, kein
// Seitenwechsel — bleibt im selben Fenster).
function QuickStats({ talents = [], works = [], experiences = [], moments = [], onStatClick = () => {} }) {
  const stats = [
    { key:"talent",     icon:<HUITalentStarIcon size={20}/>,  val: talents?.length ?? 0,     label:"Talent"     },
    { key:"werke",      icon:<HUIWerkeIcon size={20}/>,      val: works?.length ?? 0,       label:"Werke"      },
    { key:"momente",    icon:<HUIMomenteIcon size={20}/>,    val: moments?.length ?? 0,     label:"Momente"    },
    { key:"erlebnisse", icon:<HUIErlebnisIcon size={20}/>,   val: experiences?.length ?? 0, label:"Erlebnisse" },
  ];
  return (
    <div style={{
      display:"flex", padding:`12px ${T.px}px`,
      background:T.bgCard, borderRadius:T.r16,
      margin:`0 ${T.px}px`,
      boxShadow:T.card, border:`1px solid ${T.border}`,
    }}>
      {stats.map((s, i) => (
        <button
          key={i}
          onClick={() => onStatClick?.(s.key)}
          aria-label={`Zu ${s.label} springen`}
          className="ppp-stat ppp-press"
          style={{
            background:"none", border:"none", cursor:"pointer", fontFamily:"inherit",
            padding:0, WebkitTapHighlightColor:"transparent", touchAction:"manipulation",
          }}
        >
          <span style={{ display:"flex", color:T.teal }}>{s.icon}</span>
          <span style={{ fontSize:17, fontWeight: 600, color:T.ink }}>{s.val}</span>
          <span style={{ fontSize:10.5, color:T.inkFaint, fontWeight:500 }}>{s.label}</span>
        </button>
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
          <span style={{ fontSize:14, fontWeight: 600, color:T.ink, letterSpacing:"-0.01em" }}>{title}</span>
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
  const { t } = useTranslation();
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:10500, background:T.bg,
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"space-between", gap:16, padding:32,
    }}>
      <span style={{ fontSize:40 }}>🔍</span>
      <p style={{ fontSize:16, fontWeight: 600, color:T.ink, textAlign:"center", margin:0 }}>
        Profil nicht gefunden
      </p>
      <p style={{ fontSize:13, color:T.inkSoft, textAlign:"center", margin:0 }}>
        Dieses Profil existiert nicht oder ist nicht öffentlich sichtbar.
      </p>
      <button onClick={onClose} className="ppp-press" style={{
        marginTop:8, padding:"12px 32px", borderRadius:T.r99,
        background:T.teal, border:"none", color:"#fff",
        fontWeight: 600, fontSize:14, cursor:"pointer",
        boxShadow:T.glow, fontFamily:"inherit",
      }}>{t("common.back")}</button>
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
  // CHAT-LOGIK-v2 (2026-08-22): handleOpenChat entfernt — Chat wird nicht
  // mehr per Klick vom Profil aus geöffnet, siehe RelationButtons-Kommentar.

  const {
    profile, works, experiences, recommendations, moments,
    worksSaleStatus, followCounts, loading, loadingLazy, error, loadLazy, reload,
  } = useProfileData(profileId, false);

  // STATS-DEEPLINK-001 (2026-08-16): Talent-Anzahl fürs QuickStats-Widget.
  // Bewusst NUR ein leichtgewichtiger Count-Query (head:true, keine Zeilen-
  // daten) -- die vollen Talent-Angebote (Bilder/Preise) lädt weiterhin
  // ausschließlich PublicTalentOffersSection selbst (kein Duplikat der
  // bestehenden Fetch-Logik, nur eine zusätzliche Zahl für die Kopfzeile).
  const [talentsCount, setTalentsCount] = useState(0);
  useEffect(() => {
    if (!profileId) { setTalentsCount(0); return; }
    let cancelled = false;
    supabase
      .from("talents")
      .select("id", { count: "exact", head: true })
      .eq("user_id", profileId)
      .eq("status", "approved")
      .then(({ count, error }) => {
        if (!cancelled && !error) setTalentsCount(count || 0);
      });
    return () => { cancelled = true; };
  }, [profileId]);

  // STATS-DEEPLINK-001 (2026-08-16, Michael-Request): Klick auf eine der 4
  // QuickStats-Kacheln (Talent/Werke/Momente/Erlebnisse) scrollt IM SELBEN
  // Fenster automatisch zur jeweiligen Section weiter unten -- kein Modal,
  // kein Seitenwechsel. Refs zeigen auf die Section-Wrapper unten im JSX.
  const talentSectionRef     = useRef(null);
  const werkeSectionRef      = useRef(null);
  const momenteSectionRef    = useRef(null);
  const erlebnisseSectionRef = useRef(null);
  const handleStatClick = useCallback((key) => {
    const refMap = {
      talent: talentSectionRef, werke: werkeSectionRef,
      momente: momenteSectionRef, erlebnisse: erlebnisseSectionRef,
    };
    refMap[key]?.current?.scrollIntoView({ behavior:"smooth", block:"start" });
  }, []);

  // Live-Follower-Delta für sofortige UI-Reaktion
  const [followerDelta, setFollowerDelta] = useState(0);
  const [showSupport,   setShowSupport]   = useState(false);
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

  // SADB: recommendation_profile_viewed
  useEffect(() => {
    if (!profileId) return;
    supabase.from("commerce_events").insert({
      event_type: "recommendation_profile_viewed",
      actor_type: "user",
      payload: { profile_owner_id: profileId },
    }).then(() => {});
  }, [profileId]);

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
        paddingBottom: isOwnProfile ? NAV_CLEARANCE_CSS : "calc(88px + max(var(--hui-safe-bottom, 0px), env(safe-area-inset-bottom, 0px), 0px))",
        overflowY:"auto",
      }}>
        <NavBar onBack={handleBack} title="Öffentliches Profil" />

        {/* ── Kanonischer ProfileHeader (SSOT) — ersetzt Legacy-ProfileHero + Duplikat-Identity-Block ── */}
        {(profile || loading) && (
          <ProfileHeader
            profile={profile}
            isOwner={false}
            isTalent={profile?.is_talent === true}
            loading={loading}
            followCounts={{
              followers: (followCounts?.followers ?? 0) + followerDelta,
              following: followCounts?.following ?? 0,
            }}
          />
        )}

        <Gap h={14}/>

        {/* ── AKTIONS-BUTTONS ── */}
        {profile && !isOwnProfile && (
          <RelationButtons profileId={profileId} currentUserId={user?.id} profile={profile} onFollowChange={handleFollowChange} />
        )}
        {SHOW_SUPPORT_BUTTON && profile && !isOwnProfile && (
          <button onClick={() => setShowSupport(true)} className="ppp-press" style={{
            width:"100%", height:36, borderRadius:T.r99,
            background:"rgba(255,138,107,0.08)",
            border:`1.5px solid rgba(255,138,107,0.22)`,
            color:"#FF6F61", fontWeight:600, fontSize:12, cursor:"pointer",
            touchAction:"manipulation", fontFamily:"inherit",
            display:"flex", alignItems:"center", justifyContent:"center", gap:6,
            marginTop:8, whiteSpace:"nowrap",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            Unterstützen
          </button>
        )}
        {SHOW_SUPPORT_BUTTON && profile && !isOwnProfile && <Gap h={14}/>}

        {/* ── SUPPORT FLOW ── */}
        {showSupport && profile?.id && (
          <SupportFlow
            creator={profile}
            visible={showSupport}
            onClose={() => setShowSupport(false)}
            sourceType="profile"
            sourceId={profile.id}
          />
        )}

        {/* ── QUICK STATS ── */}
        {profile && (
          <QuickStats talents={{ length: talentsCount }} works={works} experiences={experiences} moments={moments} onStatClick={handleStatClick} />
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
          <div ref={talentSectionRef}>
            <SectionCard icon={<HUITalentIcon size={16}/>} title="Talent-Angebote" delay={90}>
              <PublicTalentOffersSection profileId={profileId}/>
            </SectionCard>
            <Gap h={12}/>
          </div>
        )}

        {/* ── WERKE ── immer anzeigen, Platzhalter wenn leer */}
        {profile && (
          <div ref={werkeSectionRef}>
            <SectionCard icon={<HUIWerkeIcon size={16}/>} title="Werke" delay={100}>
              {loadingLazy ? (
                <div style={{display:"flex",gap:10,overflowX:"auto"}}>{[1,2,3].map(i=><Skel key={i} w={120} h={120} r={T.r12}/>)}</div>
              ) : works.length > 0 ? (
                  <WorksSection works={works} profile={profile} isOwner={false} loading={false} saleStatus={worksSaleStatus} />
              ) : (
                <div style={{ padding:"16px 0", textAlign:"center", color:T.inkFaint, fontSize:13 }}>
                  🎨 Noch keine Werke vorhanden
                </div>
              )}
            </SectionCard>
            <Gap h={12}/>
          </div>
        )}

        {/* ── MOMENTE ── immer anzeigen, Platzhalter wenn leer */}
        {profile && (
          <div ref={momenteSectionRef}>
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
          </div>
        )}

        {/* ── ERLEBNISSE ── immer anzeigen, Platzhalter wenn leer */}
        {profile && (
          <div ref={erlebnisseSectionRef}>
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
          </div>
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
