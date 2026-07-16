// src/pages/profile/myBasis/MyBasisProfile.jsx — HUI Mein Profil v1
// "Ich gestalte meine Präsenz."
// Sprint 10 Phase 1: Businesslogik + Orchestrierung (UI-Module ausgelagert)

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { supabase } from "../../../lib/supabaseClient.js";
import { NAV_RESERVED_HEIGHT_CSS } from "../../../components/home/navigation/navigationGeometry.js";
import { useAuth }   from "../../../lib/AuthContext.jsx";
import { useHome }   from "../../../components/home/HomeShell.jsx";
const GemeinschaftsFlow = React.lazy(() => import("../../../components/GemeinschaftsFlow.jsx"));
const NotificationPanel = React.lazy(() => import("../../../components/notifications/NotificationPanel.jsx"));
import AmbassadorModal from "../../../components/ambassador/AmbassadorModal.jsx";
import SettingsModal  from "../../../components/settings/SettingsModal.jsx";
import { useAmbassador } from "../../../hooks/useAmbassador.js";
import { useProfileData } from "../../../hooks/useProfileData.js";
const HuiStudio              = React.lazy(() => import("../../../components/studio/HuiStudio.jsx"));
const MeineResonanz           = React.lazy(() => import("../../studio/MeineResonanz.jsx"));
import PublicProfilePreview   from "../../../components/profile/PublicProfilePreview.jsx";
import { OrbSignatur }        from "../../../components/profile/OrbSignatur.jsx";
import MerkenSection          from "../../../components/profile/MerkenSection.jsx";
import { AboutSection }          from "../../../components/profile/sections/AboutSection.jsx";
import { ProfileHeader as CanonicalProfileHeader } from "../../../components/profile/ProfileHeader.jsx";
import { MomentsSection }        from "../../../components/profile/sections/MomentsSection.jsx";
import { RecommendationsSection } from "../../../components/profile/sections/RecommendationsSection.jsx";
import { AvailabilitySection }   from "../../../components/profile/sections/AvailabilitySection.jsx";
import { LocationSection }       from "../../../components/profile/sections/LocationSection.jsx";
import { VisibilitySection }     from "../../../components/profile/sections/VisibilitySection.jsx";
const WerkWizard      = React.lazy(() => import("../../../components/works/WerkWizard.jsx"));
const TalentAngebotWizard = React.lazy(() => import("../../../components/talents/TalentAngebotWizard.jsx"));
import { useTalents } from "../../../hooks/useTalents.js";
const ExperienceWizard = React.lazy(() => import("../../../components/experiences/ExperienceWizard.jsx"));
import { HUIBookmarkIcon }      from "../../../design/icons/HuiInteractionIcons.jsx";
import { HUIAnsichtIcon, HUISettingsIcon } from "../../../design/icons/HuiSystemIcons.jsx";
import { NotificationBadge }    from "../../../lib/useNotifications.jsx";
import { useSavedPostsContext }  from "../../../context/SavedPostsContext.jsx";
import { useContentPreview } from "../../../context/ContentPreviewContext.jsx";

import { T, CSS } from "./tokens.js";
import { Gap } from "./components/primitives.jsx";
import { InteressenSection } from "./sections/InteressenSection.jsx";
import { OffenFuerSection } from "./sections/OffenFuerSection.jsx";
import { AmbassadorBanner } from "./sections/AmbassadorBanner.jsx";
import { TalentWerdenBanner } from "./sections/TalentWerdenBanner.jsx";
import { MeinBereichMenu } from "./studio/MeinBereichMenu.jsx";
import { TalentOnboardingModal } from "./dialogs/TalentOnboardingModal.jsx";


export default function MyBasisProfile({ onClose, profileId }) {
  const navigate = useNavigate();
  // AuthContext: eigenen Profile-Cache nach Uploads aktualisieren
  const _auth = useAuth() || {};
  const user            = _auth.user   ?? null;          // Sprint F.7D: user für useProfileData
  const setAuthProfile  = _auth.setProfile ?? null;
  const refreshProfile  = _auth.refreshProfile ?? null;
  // Sprint F.7D: profile + loading aus useProfileData — lokale States entfernt
  const [bio,        setBio]        = useState("");

  const [interests,  setInterests]  = useState([]);
  const [openFor,    setOpenFor]    = useState([]);
  const [moments,    setMoments]    = useState([]);
  const [visibility, setVisibility] = useState("connections"); // lokal — kein DB-Write
  const [saving,     setSaving]     = useState(false);
  const [saveOk,     setSaveOk]     = useState(false);
  const [saveErrMsg, setSaveErrMsg] = useState("");
  // Lokale URL-Overrides für sofortige UI-Aktualisierung nach Upload
  const [localAvatar, setLocalAvatar] = useState(null);
  const [localCover,  setLocalCover]  = useState(null);
  const [showGemeinschaft, setShowGemeinschaft] = useState(false);
  const [showAmbModal,    setShowAmbModal]    = useState(false);
  const [showPublicPreview, setShowPublicPreview] = useState(false);
  const [showMerken,       setShowMerken]       = useState(false);
  // MERKEN.3 (2026-07-08): Live-Zaehler fuer den Merken-Badge im Header.
  // Einzige Stelle im Baum, die useSavedPosts() aufruft (siehe
  // MerkenSection.jsx-Kommentar) -- count kommt direkt aus saved_posts,
  // keine zweite Berechnung/Query.
  const { count: savedCount } = useSavedPostsContext();
  const [showSettings,    setShowSettings]    = useState(false);
  const [showStudio,        setShowStudio]        = useState(false);
  const [showResonanz,      setShowResonanz]      = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // ── Notification Action Routing ───────────────────────────────────────────
  const {
    openProfileById   = () => {},
    switchTab         = () => {},
    setChatRecipient  = () => {},
    setShowChat       = () => {},
    setShowWerkDetail = () => {},
    setShowTalentFlow = () => {},
  } = useHome?.() || {};
  const { openRef } = useContentPreview();

  const handleNotifAction = (n) => {
    // 1. action_url hat Vorrang
    if (n.action_url) {
      setShowNotifications(false);
      // Intern-Routing via Typ trotzdem ausführen für nahtlose UX
    }
    const meta = n.metadata || {};
    const targetId = meta.target_id || meta.actor_id || n.actor_id || null;
    const werkId   = meta.werk_id   || null;

    setShowNotifications(false); // Panel schließen

    switch (n.type) {
      // ── Profil öffnen ───────────────────────────────────────────────────
      case "follow":
      case "follow_request":
      case "new_follower":
        if (targetId) openProfileById(targetId);
        break;

      // ── Chat öffnen ─────────────────────────────────────────────────────
      case "begegnung":
      case "buchung":
      case "booking":
      case "message":
      case "new_message":
        if (targetId) { setChatRecipient(targetId); setShowChat(true); }
        break;

      // ── Tab-Navigation ──────────────────────────────────────────────────
      case "impact":
      case "project_update":
      case "impact_update":
        switchTab("impact");
        break;

      case "community":
      case "community_update":
        switchTab("discover");
        break;

      case "inspiration":
      case "discover":
        switchTab("discover");
        break;

      // ── Werk-Detail öffnen ──────────────────────────────────────────────
      case "work_approved":
        if (werkId) setShowWerkDetail(werkId);
        break;

      // ── Kommentar/Antwort: oeffnet den kommentierten Beitrag in der
      //    bestehenden Preview/Fullscreen-Infrastruktur (KOMMENTAR.1) ───────
      case "comment":
      case "comment_reply": {
        const cmMeta = n.metadata || {};
        if (cmMeta.post_id && cmMeta.post_type) openRef({ type: cmMeta.post_type, id: cmMeta.post_id });
        break;
      }

      // ── Werk abgelehnt: Modal wird in NotifCard selbst geöffnet ─────────
      case "work_rejected":
      case "content_rejected":
        // Handled by NotifCard → RejectionModal (kein weiteres Routing nötig)
        break;

      // ── Admin / System: Detailansicht ───────────────────────────────────
      case "admin":
      case "admin_broadcast":
      case "system":
      case "info":
        // Kein spezifisches Routing — Panel bleibt offen für Lesbarkeit
        break;

      default:
        // Unbekannter Typ — nichts tun, Panel wurde bereits geschlossen
        break;
    }
  };
  const [unreadCount,       setUnreadCount]       = useState(0);
  // ── Sprint F.7D: Einheitliche Datenpipeline via useProfileData ──────────
  // Ersetzt: eigenen Profil-Loader useEffect (Zeilen ~962-1003)
  // Beibehaltung: Realtime-Listener für works+experiences (Regel 1)
  const {
    profile,
    works:           hooksWorks,
    experiences:     hooksExps,
    recommendations: hooksRecs,
    moments:         hooksMoments,
    loading:         hookLoading,
    reload,
    followCounts,
  } = useProfileData(user?.id);

  // F.9C HOTFIX: lokale Aliase erst NACH useProfileData — TDZ-Fix
  // (hooksWorks/hooksExps/hooksRecs/profile sind jetzt deklariert)
  const ambState = useAmbassador(profile);
  const [localWorks,       setLocalWorks]       = useState(null);
  const [localExperiences, setLocalExperiences] = useState(null);
  const works          = localWorks       ?? hooksWorks ?? [];
  const experiences    = localExperiences ?? hooksExps  ?? [];
  const recommendations = hooksRecs ?? [];
  const [showWerkWizard, setShowWerkWizard] = useState(false);
  const [showExpWizard,  setShowExpWizard]  = useState(false);
  const [editingWerk,   setEditingWerk]   = useState(null);
  const [editingExp,    setEditingExp]    = useState(null);
  const [showTalentWizard, setShowTalentWizard] = useState(false);
  const [showTalentOnboarding, setShowTalentOnboarding] = useState(false);
  const [editingTalent,    setEditingTalent]    = useState(null);
  const { talents, reload: reloadTalents } = useTalents(profile?.id);


  // Sprint F.7D: Profil-Loader entfernt — useProfileData(user?.id) übernimmt
  // Alte lokale States (profile, loading) werden durch Hook-Werte ersetzt (Phase 2)
  // dna_tags → hooksMoments bereits normalisiert durch useProfileData
  // skills → profile.skills direkt aus useProfileData
  // is_available → profile.is_available direkt aus useProfileData

  // ── Sprint F.7D: Realtime-Listener (Regel 1: beibehalten, nutzt reload()) ──
  // loadWorksAndExps() entfernt — useProfileData lädt works+experiences
  // reload() triggert useProfileData neu → Realtime-Events bleiben wirksam
  useEffect(() => {
    if (!profile?.id) return;
    let channel;
    let createdHere = false;

    // Realtime-Dedupe-Schutz (2026-07-08, systemweit, siehe useProfileLocations.js):
    // existierenden Channel fuer diesen Topic wiederverwenden statt erneut zu
    // subscriben -- verhindert "cannot add postgres_changes callbacks ... after
    // subscribe()" bei gleichzeitigen Mounts fuer denselben Topic.
    const topic = "mbp:works-exps:" + profile.id;
    const existing = supabase.getChannels().find(c => c.topic === `realtime:${topic}`);
    if (existing) {
      channel = existing;
    } else {
      // Realtime: wenn Admin Status ändert → useProfileData neu laden
      channel = supabase
        .channel(topic)
        .on("postgres_changes", {
          event: "UPDATE", schema: "public", table: "works",
          filter: "user_id=eq." + profile.id,
        }, () => reload())
        .on("postgres_changes", {
          event: "UPDATE", schema: "public", table: "experiences",
          filter: "user_id=eq." + profile.id,
        }, () => reload())
        // Admin Hard-Delete → sofort neu laden
        .on("postgres_changes", {
          event: "DELETE", schema: "public", table: "experiences",
        }, () => reload())
        .on("postgres_changes", {
          event: "DELETE", schema: "public", table: "projects",
        }, () => reload())
        .subscribe();
      createdHere = true;
    }

    return () => { if (createdHere && channel) supabase.removeChannel(channel); };
  }, [profile?.id, reload]);

  // Auto-save on bio/interests/visibility change (debounced 1.2s)
  // ── Sprint F.7D Phase 3: Explizite Save-Handler (autoSave entfernt) ─────
  const saveTimer = useRef(null);

  // Gemeinsame Save-Funktion (intern, kein Debounce)
  const _save = useCallback(async (fields) => {
    const uid = profile?.id ?? user?.id;
    if (!uid) return;
    setSaving(true);
    try {
      const { error: saveErr } = await supabase.from("profiles")
        .update({ ...fields, updated_at: new Date().toISOString() })
        .eq("id", uid);
      if (saveErr) {
        setSaveErrMsg(Object.keys(fields).join(",") + ": " + saveErr.message);
        setTimeout(() => setSaveErrMsg(""), 8000);
      } else {
        setSaveOk(true); setTimeout(() => setSaveOk(false), 2000);
        setAuthProfile(prev => prev ? { ...prev, ...fields } : prev);
        reload();
      }
    } catch (e) {
      console.error("SAVE ERROR:", e?.message);
    }
    setSaving(false);
  }, [profile?.id, user?.id, setAuthProfile, reload]);

  const handleBioSave = useCallback((v) => {
    setBio(v);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => _save({ bio: v }), 1200);
  }, [_save]);

  // Alias für inline onChange (debounced)
  const handleBioChange = handleBioSave;

  const handleSkillsSave = useCallback((v) => {
    setInterests(v);
    _save({ skills: v });
  }, [_save]);
  const handleInterestsChange = handleSkillsSave; // Alias

  const handleMomentsSave = useCallback((newItems) => {
    setMoments(newItems);
    const urls = newItems.map(m => m.img).filter(Boolean);
    _save({ dna_tags: urls });
  }, [_save]);
  const handleMomentsChange = handleMomentsSave; // Alias

  const handleVisibilitySave = useCallback((v) => {
    setVisibility(v);
    _save({ focus_type: v });
  }, [_save]);
  const handleVisibilityChange = handleVisibilitySave; // Alias

  const handleAvailabilitySave = useCallback((v) => {
    setOpenFor(v);
    // v.length > 0 = verfügbar (true), [] = ausgelastet (false)
    _save({ is_available: v.length > 0 });
  }, [_save]);
  const handleOpenForChange = handleAvailabilitySave; // Alias

  const handleLocationSave = useCallback((locationStr) => {
    _save({ location: locationStr });
  }, [_save]);

  // Sofortige lokale Anzeige + globaler AuthContext-Update nach Upload
  const handleAvatarChange = useCallback((url) => {
    // Sofort lokalen State setzen — bleibt persistent bis Seitenwechsel
    setLocalAvatar(url);
    setAuthProfile(prev => prev ? { ...prev, avatar_url: url } : prev);
    // Cache wurde bereits in profileMedia.js invalidiert → reload holt frische DB-Daten
    // KEIN reload() hier — localAvatar reicht für sofortige Anzeige
    // reload() würde unnötig re-render triggern bevor DB geschrieben hat
  }, [setAuthProfile]);

  const handleCoverChange = useCallback((url) => {
    // Sofort lokalen State setzen — bleibt persistent bis Seitenwechsel
    setLocalCover(url);
    setAuthProfile(prev => prev ? { ...prev, header_img: url } : prev);
    // KEIN reload() — localCover reicht für sofortige Anzeige
  }, [setAuthProfile]);

  // CSS sofort in <head> injizieren — Safari-safe, kein Blink beim Lazy-Load
  useEffect(() => {
    const id = "__mbp_styles__";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id;
      el.textContent = CSS;
      document.head.appendChild(el);
    }
    return () => {
      // Style bleibt — kein Flicker bei re-mount
    };
  }, []);


  // Sofort sichtbarer Spinner während Profil lädt — kein weißer Screen
  if (hookLoading) {
    return (
      <div style={{
        position:"fixed", top:0, left:0, right:0,
        bottom:"calc(72px + env(safe-area-inset-bottom, 0px))",
        zIndex:9500, /* <BottomNav(10000) — Root endet vor Navbar */
        background:T.bg,
        display:"flex", alignItems:"center", justifyContent:"center",
      }}>
        <div style={{
          width:36, height:36, borderRadius:"50%",
          border:"3px solid rgba(14,196,184,0.15)",
          borderTop:"3px solid #0EC4B8",
          animation:"spin .8s linear infinite",
        }}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div className="mbp-root" style={{
      position:"fixed", top:0, left:0, right:0,
      bottom:"calc(72px + env(safe-area-inset-bottom, 0px))",
      zIndex:9500, /* <BottomNav(10000) — Root endet vor Navbar */
      display:"flex", flexDirection:"column",
    }}>

      
{/* styles via head-inject — siehe useEffect */}

      {/* Save-Error-Toast */}
      {saveErrMsg ? (
        <div style={{
          position:"fixed", top:16, left:"50%", transform:"translateX(-50%)",
          zIndex:9999, padding:"10px 18px", borderRadius:99,
          background:"rgba(200,40,40,0.95)", color:"white",
          fontSize:12, fontWeight:700, maxWidth:"88vw",
          boxShadow:"0 4px 20px rgba(0,0,0,0.3)",
          textAlign:"center", lineHeight:1.5,
        }}>
          ⚠️ Speicher-Fehler: {saveErrMsg}
        </div>
      ) : null}

      {/* Save indicator */}
      {(saving || saveOk) && (
        <div style={{
          position:"fixed", top:16, right:16, zIndex:9900,
          padding:"6px 14px", borderRadius:T.r99,
          background: saveOk ? T.tealSoft : "rgba(26,26,24,0.07)",
          border:`1px solid ${saveOk ? T.tealMid : T.border}`,
          fontSize:11.5, fontWeight:600,
          color: saveOk ? T.teal : T.inkFaint,
          backdropFilter:"blur(2px)",
          transition:"all .2s ease",
        }}>
          {saveOk ? "✓ Gespeichert" : "Speichert…"}
        </div>
      )}

      {/* ── SEITEN-TITEL — AUSSERHALB scroll (kein touch-offset Bug) ── */}
      <div style={{
        padding:`max(14px,calc(10px + env(safe-area-inset-top,0px))) ${T.px}px 10px`,
        display:"flex", justifyContent:"space-between", alignItems:"flex-start",
        flexShrink:0,
        position:"relative", zIndex:2,   /* über mbp-scroll (overflow=auto erzeugt Stacking Context) */
      }}>
        <div>
          <div style={{ fontSize:24, fontWeight:900, color:T.ink, letterSpacing:"-0.04em",
            lineHeight:1.15 }}>
            {profile?.is_talent ? "Mein Talent-Profil ✨" : "Mein Profil 🌿"}
          </div>
          <div style={{ fontSize:12, color:T.inkFaint, marginTop:2, fontWeight:400 }}>
            {profile?.is_talent
              ? "Gestalte dein Talent-Profil, wie es dich und dein Wirken zeigt."
              : "Gestalte dein Profil so, wie du bist."}
          </div>
        </div>
        {/* Header-Buttons: Icon-Only — Bookmark 👁️ ⚙️ */}
        <div style={{ display:"flex", gap:6, alignItems:"center", flexShrink:0 }}>
          <button
            className="mbp-press-light"
            onClick={() => { setShowPublicPreview(false); setShowSettings(false); setShowMerken(true); }}
            title="Gemerkt"
            aria-label={savedCount > 0 ? `Gemerkt, ${savedCount} gespeicherte Inhalte` : "Gemerkt"}
            style={{
              width:34, height:34, borderRadius:"50%",
              background:"rgba(26,26,24,0.06)", border:`1px solid ${T.border}`,
              display:"flex", alignItems:"center", justifyContent:"center",
              color:T.ink, cursor:"pointer", touchAction:"manipulation", flexShrink:0,
              position:"relative",
            }}
          >
            <HUIBookmarkIcon size={18} />
            <NotificationBadge count={savedCount} />
          </button>
          <button
            className="mbp-press-light"
            onClick={() => { setShowMerken(false); setShowSettings(false); setShowPublicPreview(true); }}
            title="Profil ansehen"
            aria-label="Profil ansehen"
            style={{
              width:34, height:34, borderRadius:"50%",
              background:"rgba(26,26,24,0.06)", border:`1px solid ${T.border}`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:16, cursor:"pointer", touchAction:"manipulation", flexShrink:0,
            }}
          ><HUIAnsichtIcon size={16}/></button>
          <button
            className="mbp-press-light"
            onClick={() => { setShowMerken(false); setShowPublicPreview(false); setShowSettings(true); }}
            title="Einstellungen"
            aria-label="Einstellungen"
            style={{
              width:34, height:34, borderRadius:"50%",
              background:"rgba(26,26,24,0.06)", border:`1px solid ${T.border}`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:16, cursor:"pointer", touchAction:"manipulation", flexShrink:0,
            }}
          ><HUISettingsIcon size={16}/></button>
        </div>
      </div>

      <div className="mbp-scroll" style={{ flex:1, overflowY:"auto",
        paddingBottom: NAV_RESERVED_HEIGHT_CSS }}>

        {/* ── HEADER — Cover + Avatar + Name ───────────────── */}
        <CanonicalProfileHeader
          profile={{
            ...profile,
            avatar_url: localAvatar || profile?.avatar_url,
            header_img: localCover  || profile?.header_img,
          }}
          isOwner={true}
          isTalent={!!profile?.is_talent}
          loading={hookLoading}
          followCounts={followCounts}
          onEditAvatar={handleAvatarChange}
          onEditCover={handleCoverChange}
        />
        {(profile?.id ?? user?.id) && (
          <OrbSignatur profileId={profile?.id ?? user?.id} />
        )}
        <Gap h={28}/>

        {/* Meine Resonanz — verschoben in "Mein Bereich"-Menü, 2026-07-06 */}

        {/* ══ TALENT-PROFIL-LAYOUT (is_talent === true) ══════════ */}
        {profile?.is_talent ? (
          <>
            {/* T1. Über mich — kanonisch: AboutSection */}
            <AboutSection
              profile={profile}
              isOwner={true}
              onSave={(bio) => handleBioSave(bio)}
            />
            <Gap h={24}/>

            {/* T2. Talente (TalentSection, Skill-Tag-Pillen "Meine Talente & Angebote")
                — auf Nutzerwunsch (2026-07-05) im eigenen Dashboard ausgeblendet, wird
                nicht benoetigt. Bewusst NICHT geloescht (nur auskommentiert) fuer den
                Fall einer spaeteren Reaktivierung/Verschmelzung mit TalentAngeboteSection
                (siehe Memory #528 "vertagt"). Bleibt auf TalentProfilePage.jsx bestehen,
                dort nicht Teil dieser Anfrage. */}
            {/*
            <TalentSection
              profile={profile}
              isOwner={true}
              onChange={handleSkillsSave}
            />
            <Gap h={24}/>
            */}

            {/* T2b-T4 + Ambassador/Empfehlungen/Impact/Finanzen — PROFIL-DRAWER-REDESIGN-003
                (2026-07-06): zusammengefasst in die "Mein Bereich"-Menü-Karte
                (MeinBereichMenu). Jede Kachel oeffnet die jeweilige Section/Modal
                als Bottom-Sheet-Drawer statt permanent inline zu rendern. */}
            <MeinBereichMenu
              profile={profile}
              isTalent={true}
              talents={talents}
              works={works}
              experiences={experiences}
              onTalentWizard={(t) => { setEditingTalent(t || null); setShowTalentWizard(true); }}
              onDeleteTalent={() => reloadTalents()}
              onWerkWizard={(w) => { setEditingWerk(w || null); setShowWerkWizard(true); }}
              onDeleteWerk={(id) => { setLocalWorks(null); reload(); }}
              onErlebnisWizard={(exp) => { setEditingExp(exp || null); setShowExpWizard(true); }}
              onDeleteErlebnis={(id) => { setLocalExperiences(null); reload(); }}
              onOpenResonanz={() => setShowResonanz(true)}
              onProfileUpdate={(upd) => {
                setAuthProfile && setAuthProfile(p => ({ ...p, ...upd }));
                refreshProfile?.().catch(() => {});
                reload();
              }}
            />
            <Gap h={20}/>

            {/* T5. Kundenstimmen — kanonisch: RecommendationsSection */}
            <RecommendationsSection
              recommendations={recommendations}
              isOwner={true}
            />
            <Gap h={24}/>

            {/* T6a. Verfügbarkeit — kanonisch: AvailabilitySection */}
            <AvailabilitySection
              profile={profile}
              isOwner={true}
              onSave={handleAvailabilitySave}
            />
            <Gap h={16}/>

            {/* T6b. Standort — kanonisch: LocationSection */}
            <LocationSection
              profile={profile}
              isOwner={true}
              onSave={handleLocationSave}
            />
            <Gap h={24}/>

            {/* T7. Sichtbarkeit — kanonisch: VisibilitySection */}
            <VisibilitySection
              profile={profile}
              isOwner={true}
              onSave={handleVisibilitySave}
            />
            <Gap h={40}/>
          </>
        ) : (
          <>
            {/* ══ BASIS-PROFIL-LAYOUT ══════════════════════════════ */}
            {/* B1. Über mich — kanonisch: AboutSection */}
            <AboutSection
              profile={profile}
              isOwner={true}
              onSave={(bio) => handleBioSave(bio)}
            />
            <Gap h={24}/>

            {/* B1c. TALENT WERDEN — Einladungskarte für Basis-User */}
            {!profile?.is_talent && (
              <TalentWerdenBanner onStart={() => setShowTalentOnboarding(true)} />
            )}
            <Gap h={20}/>

            {/* B1b. Mein Bereich — PROFIL-DRAWER-REDESIGN-003 (2026-07-06):
                Basis-Profil zeigt nur die universellen Kacheln (kein Talent-Bereich). */}
            <MeinBereichMenu
              profile={profile}
              isTalent={false}
              talents={talents}
              works={works}
              experiences={experiences}
              onTalentWizard={(t) => { setEditingTalent(t || null); setShowTalentWizard(true); }}
              onDeleteTalent={() => reloadTalents()}
              onWerkWizard={(w) => { setEditingWerk(w || null); setShowWerkWizard(true); }}
              onDeleteWerk={(id) => { setLocalWorks(null); reload(); }}
              onErlebnisWizard={(exp) => { setEditingExp(exp || null); setShowExpWizard(true); }}
              onDeleteErlebnis={(id) => { setLocalExperiences(null); reload(); }}
              onOpenResonanz={() => setShowResonanz(true)}
              onProfileUpdate={(upd) => {
                setAuthProfile && setAuthProfile(p => ({ ...p, ...upd }));
                refreshProfile?.().catch(() => {});
                reload();
              }}
            />
            <Gap h={20}/>

            {/* B2. Interessen & Werte — InteressenSection bleibt (Basis-spezifisch) */}
            <InteressenSection interests={interests} onChange={handleInterestsChange}/>
            <Gap h={24}/>

            {/* B3. Momente — kanonisch: MomentsSection */}
            <MomentsSection
              moments={moments}
              isOwner={true}
              onAddMoment={(newMoments) => handleMomentsSave(newMoments)}
            />
            <Gap h={24}/>

            {/* B4. Offen für Begegnungen — OffenFuerSection bleibt (Basis-spezifisch) */}
            <OffenFuerSection openFor={openFor} onChange={handleOpenForChange}/>
            <Gap h={24}/>

            {/* B5. Sichtbarkeit — kanonisch: VisibilitySection */}
            <VisibilitySection
              profile={profile}
              isOwner={true}
              onSave={handleVisibilitySave}
            />
            <Gap h={28}/>

            {/* B6. Ambassador-Banner */}
            <AmbassadorBanner
              profile={profile}
              ambState={ambState}
              onApply={() => setShowAmbModal(true)}
            />
            <Gap h={40}/>
          </>
        )}
      </div>

      {/* PROFIL-NAV-BACKDROP entfernt (2026-07-05): Die Einzel-Loesung hier
          wurde durch einen zentralen Fix in der einzigen geteilten
          HUIBottomNavigation-Komponente ersetzt (siehe dort "NAV-BACKDROP"),
          der jetzt automatisch auf ALLEN vier Tabs (Entdecken/Home/Impact/
          Profil) gleichzeitig greift -- keine Duplikat-Loesung pro Seite
          mehr noetig. */}

      {/* GEMEINSCHAFT FLOW MODAL */}
      {showGemeinschaft && (
              <React.Suspense fallback={null}>
        <GemeinschaftsFlow
          onClose={() => setShowGemeinschaft(false)}
          onComplete={() => {
            setShowGemeinschaft(false);
            // Sprint F.7D P2: reload() übernimmt is_talent-Aktualisierung
            refreshProfile?.().catch(() => {});
            reload();
          }}
        />
              </React.Suspense>
      )}

      {/* SETTINGS MODAL */}
      {showSettings && (
        <SettingsModal
          profile={profile}
          onClose={() => setShowSettings(false)}
          onProfileUpdate={(updated) => {
            refreshProfile?.().catch(() => {});
          }}
          onEditProfile={() => {
            setShowSettings(false);
            // Öffne Profil-Editor falls vorhanden
            if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("hui:openEditor"));
          }}
          onOpenBookings={() => {
            setShowSettings(false);
            if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("hui:openBookings"));
          }}
        />
      )}

      {/* GEMERKTE INHALTE — Portal pflicht (liegt sonst hinter BottomNav durch mbp-root Stacking Context) */}
      {showMerken && createPortal(
        <div style={{
          position:"fixed", inset:0, zIndex:10500, /* >BottomNav(10000) */
          background:"#F9F7F4",
          overflowY:"auto",
          WebkitOverflowScrolling:"touch",
        }}>
          {/* Header */}
          <div style={{
            position:"sticky", top:0, zIndex:10510, /* >BottomNav(10000) */
            background:"rgba(249,247,244,0.95)",
            borderBottom:"1px solid rgba(26,26,46,0.07)",
            padding:"12px 16px",
            display:"flex", alignItems:"center", justifyContent:"space-between",
            backdropFilter:"blur(2px)",
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ display:"flex", color:"#1A1A2E" }}><HUIBookmarkIcon size={18} /></span>
              <span style={{ fontSize:15, fontWeight:800, color:"#1A1A2E", letterSpacing:"-0.02em" }}>
                Gemerkte Inhalte
              </span>
            </div>
            <button
              onClick={() => setShowMerken(false)}
              style={{
                padding:"6px 14px", borderRadius:20,
                background:"rgba(26,26,46,0.08)", border:"1px solid rgba(26,26,46,0.10)",
                fontSize:12, fontWeight:700, color:"rgba(26,26,46,0.55)",
                cursor:"pointer", touchAction:"manipulation",
              }}
            >✕ Schließen</button>
          </div>
          {/* Content */}
          <div style={{ padding:"16px" }}>
            <MerkenSection
              onOpenProfile={(id) => {
                setShowMerken(false);
                if (typeof window !== "undefined" && window.__HUI_OPEN_PROFILE__) {
                  window.__HUI_OPEN_PROFILE__(id);
                }
              }}
              onOpenDiscover={() => {
                setShowMerken(false);
                switchTab("discover");
              }}
            />
          </div>
        </div>,
        document.body
      )}

      {/* 👁️ ÖFFENTLICHE PROFILANSICHT */}
      {showPublicPreview && profile?.id && (
        <PublicProfilePreview
          profileId={profile.id}
          onClose={() => setShowPublicPreview(false)}
        />
      )}

      {/* HUI STUDIO MODAL */}
      {showStudio && (
              <React.Suspense fallback={null}>
        <HuiStudio
          profile={profile}
          onClose={() => setShowStudio(false)}
          onProfileUpdate={(upd) => {
            // Sprint F.7D P2: setProfile → reload()
            setAuthProfile && setAuthProfile(p => ({ ...p, ...upd }));
            refreshProfile?.().catch(() => {});
            reload();
          }}
        />
              </React.Suspense>
      )}

      {/* ❤️ MEINE RESONANZ */}
      {showResonanz && (
              <React.Suspense fallback={null}>
        <MeineResonanz
          onClose={() => setShowResonanz(false)}
          onNavigate={(type, navId) => {
            setShowResonanz(false);
          }}
        />
              </React.Suspense>
      )}

      {/* AMBASSADOR BEWERBUNGS-MODAL */}
      {showAmbModal && profile?.id && (
        <AmbassadorModal
          userId={profile.id}
          onClose={() => setShowAmbModal(false)}
          onSuccess={() => {
            setShowAmbModal(false);
            refreshProfile?.().catch(() => {});
          }}
        />
      )}

      {/* NOTIFICATION PANEL */}
      {showNotifications && profile?.id && (
              <React.Suspense fallback={null}>
        <NotificationPanel
          userId={profile.id}
          onClose={() => setShowNotifications(false)}
          onUnreadChange={setUnreadCount}
          onAction={handleNotifAction}
        />
              </React.Suspense>
      )}


      {/* WERK WIZARD */}
      {showWerkWizard && profile?.id && (
              <React.Suspense fallback={null}>
        <WerkWizard
          userId={profile.id}
          existingWork={editingWerk}
          onClose={() => { setShowWerkWizard(false); setEditingWerk(null); }}
          onSaved={(werk) => {
            setShowWerkWizard(false); setEditingWerk(null);
            setLocalWorks(prev => {
              const list = Array.isArray(prev) ? prev : (Array.isArray(hooksWorks) ? hooksWorks : []);
              const idx = list.findIndex(w => w.id === werk.id);
              if (idx >= 0) { const n=[...list]; n[idx]=werk; return n; }
              return [werk, ...list];
            });
          }}
        />
              </React.Suspense>
      )}

      {/* TALENT WERDEN — Onboarding Flow */}
      {showTalentOnboarding && (
        <TalentOnboardingModal
          onClose={() => setShowTalentOnboarding(false)}
          onSuccess={() => {
            setShowTalentOnboarding(false);
            reload();
            refreshProfile?.().catch(() => {});
          }}
        />
      )}

      {/* TALENT-ANGEBOT WIZARD */}
      {showTalentWizard && profile?.id && (
              <React.Suspense fallback={null}>
        <TalentAngebotWizard
          userId={profile.id}
          existingTalent={editingTalent}
          onClose={() => { setShowTalentWizard(false); setEditingTalent(null); }}
          onSaved={() => { setShowTalentWizard(false); setEditingTalent(null); reloadTalents(); }}
        />
              </React.Suspense>
      )}

      {/* EXPERIENCE WIZARD */}
      {showExpWizard && profile?.id && (
              <React.Suspense fallback={null}>
        <ExperienceWizard
          userId={profile.id}
          existingExp={editingExp}
          onClose={() => { setShowExpWizard(false); setEditingExp(null); }}
          onSaved={(exp) => {
            setShowExpWizard(false); setEditingExp(null);
            setLocalExperiences(prev => {
              const list = Array.isArray(prev) ? prev : (Array.isArray(hooksExps) ? hooksExps : []);
              const idx = list.findIndex(e => e.id === exp.id);
              if (idx >= 0) { const n=[...list]; n[idx]=exp; return n; }
              return [exp, ...list];
            });
          }}
        />
              </React.Suspense>
      )}
    </div>
  );
}
