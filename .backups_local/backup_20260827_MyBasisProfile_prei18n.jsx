// src/pages/MyBasisProfile.jsx — HUI Mein Profil v1
// "Ich gestalte meine Präsenz."
// ════════════════════════════════════════════════════════════════
// Eigene Profil-Seite für Basis-User. Kein Creator-Dashboard.
// Alles inline-editierbar. Ruhig. Emotional. Human.
// ════════════════════════════════════════════════════════════════
// REFACTORED 2026-08-25: Sub-components extracted to src/components/profile/my-basis/
// No logic changes — pure file split for maintainability.

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { makeChunkReload } from "../lib/chunkReload.js";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { supabase } from "../lib/supabaseClient.js";


import { NAV_RESERVED_HEIGHT_CSS } from "../components/home/navigation/navigationGeometry.js";
import { useAuth }   from "../lib/AuthContext.jsx";
import { useHome }   from "../components/home/HomeShell.jsx";
import SettingsModal from "../components/settings/SettingsModal.jsx";
import { useProfileData } from "../hooks/useProfileData.js";
import { usePullToRefresh } from "../hooks/usePullToRefresh.js";
import { PullToRefreshIndicator } from "../components/ui/PullToRefreshIndicator.jsx";
const PublicProfilePreview = React.lazy(() => import("../components/profile/PublicProfilePreview.jsx").catch(makeChunkReload("MyBasisProfile:PublicProfilePreview")));
const OrbSignatur = React.lazy(() => import("../components/profile/OrbSignatur.jsx").then(m => ({ default: m.OrbSignatur })).catch(makeChunkReload("MyBasisProfile:OrbSignatur")));
import MerkenSection from "../components/profile/MerkenSection.jsx";
const AboutSection = React.lazy(() => import("../components/profile/sections/AboutSection.jsx").then(m => ({ default: m.AboutSection })).catch(makeChunkReload("MyBasisProfile:AboutSection")));
import { ProfileHeader as CanonicalProfileHeader } from "../components/profile/ProfileHeader.jsx";
const TalentSection = React.lazy(() => import("../components/profile/sections/TalentSection.jsx").then(m => ({ default: m.TalentSection })).catch(makeChunkReload("MyBasisProfile:TalentSection")));
const RecommendationsSection = React.lazy(() => import("../components/profile/sections/RecommendationsSection.jsx").then(m => ({ default: m.RecommendationsSection })).catch(makeChunkReload("MyBasisProfile:RecommendationsSection")));
const AvailabilitySection = React.lazy(() => import("../components/profile/sections/AvailabilitySection.jsx").then(m => ({ default: m.AvailabilitySection })).catch(makeChunkReload("MyBasisProfile:AvailabilitySection")));
const VisibilitySection = React.lazy(() => import("../components/profile/sections/VisibilitySection.jsx").then(m => ({ default: m.VisibilitySection })).catch(makeChunkReload("MyBasisProfile:VisibilitySection")));

// ── Wizard lazy imports (BUGFIX 2026-08-26: Wizard-Render-Blöcke fehlten nach Refactor) ──
const WerkWizard = React.lazy(() => import("../components/works/WerkWizard.jsx").catch(makeChunkReload("MyBasisProfile:WerkWizard")));
const TalentAngebotWizard = React.lazy(() => import("../components/talents/TalentAngebotWizard.jsx").catch(makeChunkReload("MyBasisProfile:TalentAngebotWizard")));
const ExperienceWizard = React.lazy(() => import("../components/experiences/ExperienceWizard.jsx").catch(makeChunkReload("MyBasisProfile:ExperienceWizard")));

import { useTalents } from "../hooks/useTalents.js";
import ProfilBearbeitenModal from "../components/studio/ProfilBearbeitenModal.jsx";
import { HUIBookmarkIcon }      from "../design/icons/HuiInteractionIcons.jsx";
import { HUIAnsichtIcon, HUISettingsIcon,
} from "../design/icons/HuiSystemIcons.jsx";
import { useContentPreview } from "../context/ContentPreviewContext.jsx";
import HuiMomentSheet from "../components/HuiMomentSheet.jsx";
import { useModalRegistration } from "../hooks/useModalRegistration.js";

// ── Extracted sub-components ────────────────────────────────────
import { T, CSS } from "../components/profile/my-basis/constants.js";
import { Gap } from "../components/profile/my-basis/atoms.jsx";
import { MeinBereichMenu } from "../components/profile/my-basis/MeinBereich.jsx";
import { TalentWerdenBanner } from "../components/profile/my-basis/Misc.jsx";

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
  const [visibility, setVisibility] = useState("connections"); // lokal — kein DB-Write
  const [saving,     setSaving]     = useState(false);
  const [saveOk,     setSaveOk]     = useState(false);
  const [saveErrMsg, setSaveErrMsg] = useState("");
  // Lokale URL-Overrides für sofortige UI-Aktualisierung nach Upload
  const [localAvatar, setLocalAvatar] = useState(null);
  const [localCover,  setLocalCover]  = useState(null);
  const [showGemeinschaft, setShowGemeinschaft] = useState(false);
  const [showMomentSheet, setShowMomentSheet]  = useState(false);
  const [showPublicPreview, setShowPublicPreview] = useState(false);
  const [showMerken,       setShowMerken]       = useState(false);
  // MERKEN.3 (2026-07-08): Live-Zaehler fuer den Merken-Badge im Header.
  // Einzige Stelle im Baum, die useSavedPosts() aufruft (siehe
  // MerkenSection.jsx-Kommentar) -- count kommt direkt aus saved_posts,
  // keine zweite Berechnung/Query.
  // savedCount entfernt (2026-07-30): keine rote Zahl am Bookmark-Icon
  const [showSettings,    setShowSettings]    = useState(false);
  // BANKDATEN-LINK (2026-08-16): Für Deep-Link aus Notification → Settings → Bankdaten
  const [settingsAutoBankdaten, setSettingsAutoBankdaten] = useState(false);
  const [showProfilEditPage, setShowProfilEditPage] = useState(false);
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

  
  // ── Back-Button: Sub-Modals registrieren ─────────────────────────
  useModalRegistration(showSettings, () => setShowSettings(false), "MyBasisProfile-Settings");

  // BANKDATEN-LINK (2026-08-16): Globaler Event-Listener — von Home.jsx
  // window.__HUI_OPEN_BANKDATEN__ dispatched 'hui:open-bankdaten' CustomEvent.
  // Öffnet Settings-Modal + setzt autoOpenBankdaten-Flag für BankdatenModal.
  useEffect(() => {
    const handler = () => {
      setSettingsAutoBankdaten(true);
      setShowSettings(true);
    };
    window.addEventListener("hui:open-bankdaten", handler);
    return () => window.removeEventListener("hui:open-bankdaten", handler);
  }, []);
  // ── Back-Button: Weitere Modals/Overlays registrieren ────────────
  // NOTE: activeDrawer/empfehlungDetail/showFinanzModal werden in MeinBereichMenu
  // registriert (separate Komponente) — hier entfernt da TDZ-Crash im Bundle.
  useModalRegistration(showGemeinschaft, () => setShowGemeinschaft(false), "MyBasisProfile-Gemeinschaft");
  useModalRegistration(showMomentSheet, () => setShowMomentSheet(false), "MyBasisProfile-MomentSheet");
  useModalRegistration(showPublicPreview, () => setShowPublicPreview(false), "MyBasisProfile-PublicPreview");
  useModalRegistration(showMerken, () => setShowMerken(false), "MyBasisProfile-Merken");
  useModalRegistration(showProfilEditPage, () => setShowProfilEditPage(false), "MyBasisProfile-ProfilEditPage");
  useModalRegistration(showStudio, () => setShowStudio(false), "MyBasisProfile-Studio");
  useModalRegistration(showResonanz, () => setShowResonanz(false), "MyBasisProfile-Resonanz");
  useModalRegistration(showNotifications, () => setShowNotifications(false), "MyBasisProfile-Notifications");

  // BACK-BUTTON-STACK-FIX (2026-08-15, Michael-Report): analog zum Fix in
  // NotificationButton.jsx — setShowNotifications(false) stand vorher
  // unbedingt vor dem gesamten Switch und schloss das Resonanzzentrum-Panel
  // (inkl. DetailModal darin) IMMER, auch beim Oeffnen einer reinen Entity-
  // Vorschau (openRef). Jetzt: nur noch bei echten Seitenwechseln schliessen.
  const handleNotifAction = (n) => {
    const meta = n.metadata || {};
    const targetId = meta.target_id || meta.actor_id || n.actor_id || null;
    const werkId   = meta.werk_id   || null;

    // ── RESONANZ-BUCHUNG-001 (2026-08-08): "Mit Nutzer chatten" aus dem
    //    Buchungsdetail-Modal — typunabhängig, hat Vorrang vor dem Switch ──
    if (n._openChat) {
      setShowNotifications(false);
      const chatObj = typeof n._openChat === "object" ? n._openChat : { id: n._openChat, display_name: null };
      setChatRecipient(chatObj);
      setShowChat(true);
      return;
    }
    // BANKDATEN-LINK (2026-08-16): "Bankdaten hinterlegen" aus
    // payout_bank_details_needed Notification → Settings → Bankdaten
    if (n._openBankdaten) {
      setShowNotifications(false);
      setSettingsAutoBankdaten(true);
      setShowSettings(true);
      return;
    }

    // BELEG-002: Angebot-Link aus DetailModal (_refType/_refId) — Vorschau
    // bleibt im Panel-Kontext, kein Schliessen.
    if (n._openRef && n._refType && n._refId) {
      openRef({ type: n._refType, id: n._refId });
      return;
    }
    // 1. action_url ohne Entity-Ref → echter Seitenwechsel, Panel schliessen
    if (n.action_url && !n._openRef) {
      setShowNotifications(false);
      // Intern-Routing via Typ trotzdem ausführen für nahtlose UX
    }

    switch (n.type) {
      // ── Buchungen (Talent + Erlebnis): Detail wird bereits im DetailModal
      //    selbst vollständig angezeigt (wer/was/wann/wo), kein Routing nötig ──
      case "talent_booking_paid":
      case "talent_booking_confirmed":
      case "talent_booking_cancelled":
      case "experience_booking_paid":
      case "experience_booking_confirmed":
      case "experience_booking_cancelled":
        break;
      // ── Profil öffnen ───────────────────────────────────────────────────
      case "follow":
      case "follow_request":
      case "new_follower":
        setShowNotifications(false);
        if (targetId) openProfileById(targetId);
        break;

      // ── Chat öffnen ─────────────────────────────────────────────────────
      case "begegnung":
      case "buchung":
      case "booking":
      case "message":
      case "new_message":
        setShowNotifications(false);
        if (targetId) { setChatRecipient(targetId); setShowChat(true); }
        break;

      // ── Tab-Navigation ──────────────────────────────────────────────────
      case "impact":
      case "project_update":
      case "impact_update":
        setShowNotifications(false);
        switchTab("impact");
        break;

      case "community":
      case "community_update":
        setShowNotifications(false);
        switchTab("discover");
        break;

      case "inspiration":
      case "discover":
        setShowNotifications(false);
        switchTab("discover");
        break;

      // ── Werk-Detail öffnen ──────────────────────────────────────────────
      case "work_approved": {
        // _openRef vom DetailModal → ContentPreview öffnen (preferred)
        if (n._openRef && n.entity_id) {
          openRef({ type: n.entity_type || "work", id: n.entity_id });
        } else if (werkId) {
          setShowNotifications(false);
          setShowWerkDetail(werkId);
        }
        break;
      }

      // ── Kommentar/Antwort: oeffnet den kommentierten Beitrag in der
      //    bestehenden Preview/Fullscreen-Infrastruktur (KOMMENTAR.1) ───────
      case "comment":
      case "comment_reply": {
        const cmMeta = n.metadata || {};
        const cmId   = cmMeta.post_id   || n.entity_id   || null;
        const cmType = cmMeta.post_type || n.entity_type || null;
        if (cmId && cmType) openRef({ type: cmType, id: cmId });
        break;
      }

      // ── Werk abgelehnt: Modal wird in NotifCard selbst geöffnet ─────────
      case "work_rejected":
      case "content_rejected": {
        // _openRef vom DetailModal → Werk/Inhalt öffnen zum Überarbeiten
        if (n._openRef && n.entity_id && n.entity_type) {
          const rejectType = n.entity_type === "impact_project" ? "project" : n.entity_type;
          if (["work","experience","talent"].includes(rejectType)) {
            openRef({ type: rejectType, id: n.entity_id });
          }
        }
        break;
      }

      // ── Admin / System / Broadcast: Detailansicht (kein externes Routing) ──
      case "admin":
      case "admin_broadcast":
      case "broadcast":
      case "system":
      case "info":
      case "save_digest":
        // Kein Routing — alle Infos im DetailModal
        break;

      // ── Freigaben mit entity_id → _openRef-fähig ────────────────────────────
      case "experience_approved": {
        if (n._openRef && n.entity_id) openRef({ type: "experience", id: n.entity_id });
        break;
      }
      case "experience_rejected": {
        if (n._openRef && n.entity_id) openRef({ type: "experience", id: n.entity_id });
        break;
      }
      case "impact_project_approved":
      case "impact_project_rejected":
        // Kein openRef — ImpactProject-Preview nicht via ContentPreview
        break;
      case "work_deleted":
        // Kein Routing — Modal zeigt Titel + Grund vollständig
        break;

      // ── Resonanz/Like: öffnet Inhalt wenn entity_id vorhanden ─────────────
      case "resonanz":
      case "like":
      case "save": {
        // RESONANZ.5 (2026-07-30): save → direkt zum Beitrag navigieren
        const rEntityId   = n.entity_id   || (n.metadata || {}).post_id   || null;
        const rEntityType = n.entity_type || (n.metadata || {}).post_type || null;
        if (n._openRef && rEntityId && rEntityType) {
          openRef({ type: rEntityType, id: rEntityId });
        }
        break;
      }

      // ── Support: kein Routing — Antwort im Modal lesen ─────────────────────
      case "support_ticket":
      case "support_ticket_reply":
        break;

      // ── Bestellung/Zahlung — BELEG-002: jetzt mit Routing ───────────────
      case "new_order":
      case "order_confirmed": {
        // Werk öffnen wenn entity_id vorhanden (vom DetailModal "Werk ansehen")
        const oEntityId = n.entity_id || n.metadata?.work_id || n.metadata?.entity_id || null;
        const oEntityType = n.entity_type || n.metadata?.entity_type || "work";
        if (n._openRef && oEntityId) {
          openRef({ type: oEntityType, id: oEntityId });
        }
        break;
      }

      // ── Impact-Projekt eingereicht/gelöscht → Impact-Tab ─────────────────
      case "impact_project_completed":
        // BELEG-001: Projekt-Vollfinanzierung → Projekt öffnen wenn möglich
        if (n._openRef && (n.metadata?.project_id || n.entity_id)) {
          openRef({ type: "project", id: n.metadata?.project_id || n.entity_id });
        } else {
          setShowNotifications(false);
          switchTab("impact");
        }
        break;
      case "impact_project_submitted":
      case "impact_project_deleted":
        setShowNotifications(false);
        switchTab("impact");
        break;

      // ── Inhalt gemeldet/gelöscht/freigegeben → openRef wenn entity_id da ─
      case "work_flagged":
      case "content_flagged":
      case "content_deleted":
      case "content_approved": {
        const cMeta = n.metadata || {};
        const cEntityId   = n.entity_id   || cMeta.entity_id   || null;
        const cEntityType = n.entity_type || cMeta.entity_type || null;
        if (n._openRef && cEntityId && cEntityType) {
          openRef({ type: cEntityType, id: cEntityId });
        }
        break;
      }

            // ── Geteilter Inhalt öffnen ────────────────────────────────────────────
      case "share": {
        const shareMeta = n.metadata || {};
        const shareEntityId   = n._openRef ? (n.entity_id || shareMeta.entity_id) : (shareMeta.entity_id || n.entity_id);
        const shareEntityType = n.entity_type || shareMeta.entity_type || null;
        const shareActionUrl  = n._openUrl || n.action_url || null;
        if (shareEntityId && shareEntityType) {
          openRef({ type: shareEntityType, id: shareEntityId });
        } else if (shareActionUrl) {
          setShowNotifications(false);
          const path = shareActionUrl.startsWith("http")
            ? new URL(shareActionUrl).pathname
            : shareActionUrl;
          navigate(path);
        }
        break;
      }

      default:
        // _openRef: DetailModal hat einen Entity-Link → openRef öffnen
        if (n._openRef && n.entity_id && n.entity_type) {
          openRef({ type: n.entity_type, id: n.entity_id });
        }
        // _openUrl: DetailModal hat eine URL → navigate
        else if (n._openUrl) {
          setShowNotifications(false);
          const path = n._openUrl.startsWith("http")
            ? new URL(n._openUrl).pathname
            : n._openUrl;
          navigate(path);
        }
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
    loading:         hookLoading,
    reload,
    loadLazy,
    followCounts,
  } = useProfileData(user?.id, true); // includePrivate=true → phone für eigenes Profil

  // F.9C HOTFIX: lokale Aliase erst NACH useProfileData — TDZ-Fix
  // (hooksWorks/hooksExps/hooksRecs/profile sind jetzt deklariert)
  const [localWorks,       setLocalWorks]       = useState(null);
  const [localExperiences, setLocalExperiences] = useState(null);
  const works          = localWorks       ?? hooksWorks ?? [];
  const experiences    = localExperiences ?? hooksExps  ?? [];
  const recommendations = hooksRecs ?? [];

  // Lazy-Content laden (recommendations, works, experiences, moments) — fehlte zuvor
  useEffect(() => {
    if (profile?.id) loadLazy?.();
  }, [profile?.id, loadLazy]);
  const [showWerkWizard, setShowWerkWizard] = useState(false);
  const [showExpWizard,  setShowExpWizard]  = useState(false);
  const [editingWerk,   setEditingWerk]   = useState(null);
  const [editingExp,    setEditingExp]    = useState(null);
  const [showTalentWizard, setShowTalentWizard] = useState(false);
  const [showTalentOnboarding, setShowTalentOnboarding] = useState(false);
  const [editingTalent,    setEditingTalent]    = useState(null);
  const { talents, reload: reloadTalents } = useTalents(profile?.id);

  // ── PULL-TO-REFRESH (2026-08-17): eigenes Profil hat eigenen
  // Scroll-Container (.mbp-scroll), unabhaengig vom Home.jsx-Feed-Scroll ──
  const profileScrollRef = React.useRef(null);
  const handleProfilePullRefresh = React.useCallback(async () => {
    reload?.();
    loadLazy?.();
    reloadTalents?.();
    await new Promise(r => setTimeout(r, 400));
  }, [reload, loadLazy, reloadTalents]);
  const { pullDistance: profilePullDistance, isRefreshing: profileIsRefreshing, isTriggered: profileIsTriggered } = usePullToRefresh({
    onRefresh:  handleProfilePullRefresh,
    scrollRef:  profileScrollRef,
    threshold:  72,
    maxPull:    110,
    enabled:    true,
  });


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
    _save({ location: locationStr, location_label: locationStr });
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
        bottom:NAV_RESERVED_HEIGHT_CSS,
        zIndex:9500, /* <BottomNav(10000) — Root endet auf Tabbar-Unterkante */
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
    <Suspense fallback={<div style={{position:"fixed",inset:0,display:"flex",alignItems:"center",justifyContent:"center",zIndex:10500,background:"rgba(249,247,244,0.85)",backdropFilter:"blur(6px)"}}><div style={{width:36,height:36,borderRadius:"50%",border:"3px solid rgba(22,215,197,0.2)",borderTopColor:"#16D7C5",animation:"hui-spin 0.7s linear infinite"}}/></div>}>
    <div className="mbp-root" style={{
      position:"fixed", top:0, left:0, right:0,
      bottom:NAV_RESERVED_HEIGHT_CSS,
      zIndex:9500, /* <BottomNav(10000) — Root endet auf Tabbar-Unterkante */
      display:"flex", flexDirection:"column",
    }}>

      
{/* styles via head-inject — siehe useEffect */}

      {/* Save-Error-Toast */}
      {saveErrMsg ? (
        <div style={{
          position:"fixed", top:16, left:"50%", transform:"translateX(-50%)",
          zIndex:9999, padding:"10px 18px", borderRadius:99,
          background:"rgba(200,40,40,0.95)", color:"white",
          fontSize:12, fontWeight: 600, maxWidth:"88vw",
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
        padding:`max(14px,calc(10px + max(var(--hui-safe-top, 0px), env(safe-area-inset-top,0px)))) ${T.px}px 10px`,
        display:"flex", justifyContent:"space-between", alignItems:"flex-start",
        flexShrink:0,
        position:"relative", zIndex:2,   /* über mbp-scroll (overflow=auto erzeugt Stacking Context) */
      }}>
        <div>
          <div style={{ fontSize:24, fontWeight: 600, color:T.ink, letterSpacing:"-0.04em",
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
            aria-label="Gemerkte Inhalte"
            style={{
              width:34, height:34, borderRadius:"50%",
              background:"rgba(26,26,24,0.06)", border:`1px solid ${T.border}`,
              display:"flex", alignItems:"center", justifyContent:"center",
              color:T.ink, cursor:"pointer", touchAction:"manipulation", flexShrink:0,
            }}
          >
            <HUIBookmarkIcon size={18} />
          </button>
          <button
            className="mbp-press-light"
            onClick={() => {
              // Öffentliches Profil via globalem Hook öffnen — eager import, kein React.lazy
              if (profile?.id && window.__HUI_OPEN_PROFILE__) {
                window.__HUI_OPEN_PROFILE__(profile.id);
              }
            }}
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

      <div className="mbp-scroll" ref={profileScrollRef} style={{ flex:1, overflowY:"auto",
        position:"relative", paddingBottom: NAV_RESERVED_HEIGHT_CSS }}>

        {/* ── Pull-to-Refresh Indikator — oben im Scroll-Container ── */}
        <PullToRefreshIndicator
          pullDistance={profilePullDistance}
          isRefreshing={profileIsRefreshing}
          isTriggered={profileIsTriggered}
        />

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
        <Suspense fallback={<div style={{display:"flex",justifyContent:"center",alignItems:"center",padding:"20px 0",opacity:0.4}}><div style={{width:24,height:24,borderRadius:"50%",border:"2px solid rgba(22,215,197,0.2)",borderTopColor:"#16D7C5",animation:"hui-spin 0.7s linear infinite"}}/></div>}><OrbSignatur profileId={profile?.id ?? user?.id} /></Suspense>
        )}
        <Gap h={28}/>

        {/* Meine Resonanz — verschoben in "Mein Bereich"-Menü, 2026-07-06 */}

        {/* ══ TALENT-PROFIL-LAYOUT (is_talent === true) ══════════ */}
        {profile?.is_talent ? (
          <>
            {/* T1. Über mich — kanonisch: AboutSection */}
        <Suspense fallback={<div style={{display:"flex",justifyContent:"center",alignItems:"center",padding:"20px 0",opacity:0.4}}><div style={{width:24,height:24,borderRadius:"50%",border:"2px solid rgba(22,215,197,0.2)",borderTopColor:"#16D7C5",animation:"hui-spin 0.7s linear infinite"}}/></div>}><AboutSection
                profile={profile}
                isOwner={true}
                onSave={(bio) => handleBioSave(bio)}
              /></Suspense>
        <Gap h={24}/>

            {/* T2. Talente (TalentSection, Skill-Tag-Pillen "Meine Talente & Angebote")
                — auf Nutzerwunsch (2026-07-05) im eigenen Dashboard ausgeblendet, wird
                nicht benoetigt. Bewusst NICHT geloescht (nur auskommentiert) fuer den
                Fall einer spaeteren Reaktivierung/Verschmelzung mit TalentAngeboteSection
                (siehe Memory #528 "vertagt"). Bleibt auf TalentProfilePage.jsx bestehen,
                dort nicht Teil dieser Anfrage. */}
            {/*
            <Suspense fallback={<div style={{display:"flex",justifyContent:"center",alignItems:"center",padding:"20px 0",opacity:0.4}}><div style={{width:24,height:24,borderRadius:"50%",border:"2px solid rgba(22,215,197,0.2)",borderTopColor:"#16D7C5",animation:"hui-spin 0.7s linear infinite"}}/></div>}><TalentSection
              profile={profile}
              isOwner={true}
              onChange={handleSkillsSave}
            /></Suspense>
            <Gap h={24}/>
            */}

            {/* T2b-T4 + Empfehlungen/Impact/Finanzen — PROFIL-DRAWER-REDESIGN-003
                (2026-07-06): zusammengefasst in die "Mein Bereich"-Menü-Karte
                (MeinBereichMenu). Jede Kachel oeffnet die jeweilige Section/Modal
                als Bottom-Sheet-Drawer statt permanent inline zu rendern. */}
            <MeinBereichMenu
              profile={profile}
              isTalent={true}
              talents={talents}
              works={works}
              experiences={experiences}
              recommendations={recommendations}
              onTalentWizard={(t) => { setEditingTalent(t || null); setShowTalentWizard(true); }}
              onDeleteTalent={() => reloadTalents()}
              onWerkWizard={(w) => { setEditingWerk(w || null); setShowWerkWizard(true); }}
              onDeleteWerk={(id) => { setLocalWorks(null); reload(); }}
              onErlebnisWizard={(exp) => { setEditingExp(exp || null); setShowExpWizard(true); }}
              onDeleteErlebnis={(id) => { setLocalExperiences(null); reload(); }}
              onOpenResonanz={() => setShowResonanz(true)}
              onOpenMomentSheet={() => setShowMomentSheet(true)}
              onProfileUpdate={(upd) => {
                setAuthProfile && setAuthProfile(p => ({ ...p, ...upd }));
                refreshProfile?.().catch(() => {});
                reload();
              }}
            />
            <Gap h={20}/>

            {/* T5. Kundenstimmen — kanonisch: RecommendationsSection */}
        <Suspense fallback={<div style={{display:"flex",justifyContent:"center",alignItems:"center",padding:"20px 0",opacity:0.4}}><div style={{width:24,height:24,borderRadius:"50%",border:"2px solid rgba(22,215,197,0.2)",borderTopColor:"#16D7C5",animation:"hui-spin 0.7s linear infinite"}}/></div>}><RecommendationsSection
                recommendations={recommendations}
                isOwner={true}
                profileOwnerId={profile?.id || ""}
                profileOwnerName={profile?.display_name || profile?.nickname || ""}
              /></Suspense>
        <Gap h={24}/>


            <Gap h={24}/>

            {/* T7. Sichtbarkeit — kanonisch: VisibilitySection */}
        <Suspense fallback={<div style={{display:"flex",justifyContent:"center",alignItems:"center",padding:"20px 0",opacity:0.4}}><div style={{width:24,height:24,borderRadius:"50%",border:"2px solid rgba(22,215,197,0.2)",borderTopColor:"#16D7C5",animation:"hui-spin 0.7s linear infinite"}}/></div>}><VisibilitySection
                profile={profile}
                isOwner={true}
                onSave={handleVisibilitySave}
              /></Suspense>
        <Gap h={28}/>
            <Gap h={40}/>
          </>
        ) : (
          <>
            {/* ══ BASIS-PROFIL-LAYOUT ══════════════════════════════ */}
            {/* B1. Über mich — kanonisch: AboutSection */}
        <Suspense fallback={<div style={{display:"flex",justifyContent:"center",alignItems:"center",padding:"20px 0",opacity:0.4}}><div style={{width:24,height:24,borderRadius:"50%",border:"2px solid rgba(22,215,197,0.2)",borderTopColor:"#16D7C5",animation:"hui-spin 0.7s linear infinite"}}/></div>}><AboutSection
                profile={profile}
                isOwner={true}
                onSave={(bio) => handleBioSave(bio)}
              /></Suspense>
        <Gap h={24}/>

            {/* B1a. Kundenstimmen — kanonisch: RecommendationsSection (auch für Basis-User) */}
        <Suspense fallback={<div style={{display:"flex",justifyContent:"center",alignItems:"center",padding:"20px 0",opacity:0.4}}><div style={{width:24,height:24,borderRadius:"50%",border:"2px solid rgba(22,215,197,0.2)",borderTopColor:"#16D7C5",animation:"hui-spin 0.7s linear infinite"}}/></div>}><RecommendationsSection
                recommendations={recommendations}
                isOwner={true}
                profileOwnerId={profile?.id || ""}
                profileOwnerName={profile?.display_name || profile?.nickname || ""}
              /></Suspense>
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
              recommendations={recommendations}
              onTalentWizard={(t) => { setEditingTalent(t || null); setShowTalentWizard(true); }}
              onDeleteTalent={() => reloadTalents()}
              onWerkWizard={(w) => { setEditingWerk(w || null); setShowWerkWizard(true); }}
              onDeleteWerk={(id) => { setLocalWorks(null); reload(); }}
              onErlebnisWizard={(exp) => { setEditingExp(exp || null); setShowExpWizard(true); }}
              onDeleteErlebnis={(id) => { setLocalExperiences(null); reload(); }}
              onOpenResonanz={() => setShowResonanz(true)}
              onOpenMomentSheet={() => setShowMomentSheet(true)}
              onProfileUpdate={(upd) => {
                setAuthProfile && setAuthProfile(p => ({ ...p, ...upd }));
                refreshProfile?.().catch(() => {});
                reload();
              }}
            />
            <Gap h={20}/>

            {/* B2+B4. Interessen & Werte + Offen für Begegnungen — auf Nutzerwunsch
                (2026-08-07) aus dem Basis-Profil entfernt. Bewusst NICHT geloescht
                (nur auskommentiert), Komponenten InteressenSection/OffenFuerSection
                bleiben im Code fuer den Fall einer spaeteren Reaktivierung. Die
                zugrundeliegenden DB-Spalten profiles.skills / profiles.is_available
                bleiben unangetastet (skills hat fuer Talent-User in
                TalentProfilePage.jsx eine andere, weiterhin aktive Bedeutung
                "Professionelle Skills" — siehe ProfilBearbeitenModal.jsx Kommentar). */}

            {/* B5. Sichtbarkeit — kanonisch: VisibilitySection */}
        <Suspense fallback={<div style={{display:"flex",justifyContent:"center",alignItems:"center",padding:"20px 0",opacity:0.4}}><div style={{width:24,height:24,borderRadius:"50%",border:"2px solid rgba(22,215,197,0.2)",borderTopColor:"#16D7C5",animation:"hui-spin 0.7s linear infinite"}}/></div>}><VisibilitySection
                profile={profile}
                isOwner={true}
                onSave={handleVisibilitySave}
              /></Suspense>
        <Gap h={28}/>
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

      {/* SETTINGS MODAL (2026-08-22 wiederhergestellt — war beim
          Ambassador-Cleanup faelschlich mitentfernt worden, siehe
          Michael-Report "Gespeichert + Einstellungen Buttons tun nichts") */}
      {showSettings && (
          <SettingsModal
            profile={profile}
            onClose={() => { setShowSettings(false); setSettingsAutoBankdaten(false); }}
            autoOpenBankdaten={settingsAutoBankdaten}
            onProfileUpdate={(updated) => {
              refreshProfile?.().catch(() => {});
            }}
            onEditProfile={() => {
              setShowSettings(false);
              setShowProfilEditPage(true);
            }}
            onOpenBookings={() => {
              setShowSettings(false);
              if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("hui:openBookings"));
            }}
          />
      )}
      {showProfilEditPage && (
          <ProfilBearbeitenModal
            profile={profile}
            onClose={() => setShowProfilEditPage(false)}
            onProfileUpdate={() => { refreshProfile?.().catch(() => {}); setShowProfilEditPage(false); }}
          />
      )}

      {/* GEMERKTE INHALTE — Portal pflicht (liegt sonst hinter BottomNav durch mbp-root Stacking Context)
          (2026-08-22 wiederhergestellt, siehe Kommentar oben) */}
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
            paddingTop:"max(var(--hui-safe-top, 0px), 14px, env(safe-area-inset-top, 14px))",
            paddingBottom:"12px",
            paddingLeft:"16px",
            paddingRight:"16px",
            display:"flex", alignItems:"center", justifyContent:"space-between",
            backdropFilter:"blur(2px)",
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ display:"flex", color:"#1A1A2E" }}><HUIBookmarkIcon size={18} /></span>
              <span style={{ fontSize:15, fontWeight: 600, color:"#1A1A2E", letterSpacing:"-0.02em" }}>
                Gemerkte Inhalte
              </span>
            </div>
            <button
              onClick={() => setShowMerken(false)}
              style={{
                padding:"6px 14px", borderRadius:20,
                background:"rgba(26,26,46,0.08)", border:"1px solid rgba(26,26,46,0.10)",
                fontSize:12, fontWeight: 600, color:"rgba(26,26,46,0.55)",
                cursor:"pointer", touchAction:"manipulation",
              }}
            >✕ Schließen</button>
          </div>
          {/* Content */}
          <div style={{ padding:"16px" }}>
        <MerkenSection
              onClose={() => setShowMerken(false)}
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

      {/* MEINE MOMENTE SHEET — createPortal direkt zu body, zIndex 11000 (über Drawer 10500)
          Suspense INNERHALB des Portals — nicht darum (sonst rendert Portal nicht) */}
      {showMomentSheet && createPortal(
        <HuiMomentSheet
            visible={showMomentSheet}
            onClose={() => setShowMomentSheet(false)}
            visibilityScope="public"
          />
        ,
        document.body
      )}
      {/* ── WIZARD RENDERS (BUGFIX 2026-08-26: fehlten nach Refactor 35ca88f2) ── */}
      {showWerkWizard && profile?.id && createPortal(
        <Suspense fallback={null}>
          <WerkWizard
            userId={profile.id}
            existingWork={editingWerk}
            onClose={() => { setShowWerkWizard(false); setEditingWerk(null); }}
            onSaved={() => { setShowWerkWizard(false); setEditingWerk(null); reload(); }}
          />
        </Suspense>,
        document.body
      )}

      {showTalentWizard && profile?.id && createPortal(
        <Suspense fallback={null}>
          <TalentAngebotWizard
            userId={profile.id}
            existingTalent={editingTalent}
            onClose={() => { setShowTalentWizard(false); setEditingTalent(null); }}
            onSaved={() => { setShowTalentWizard(false); setEditingTalent(null); reloadTalents(); reload(); }}
          />
        </Suspense>,
        document.body
      )}

      {showExpWizard && profile?.id && createPortal(
        <Suspense fallback={null}>
          <ExperienceWizard
            userId={profile.id}
            existingExp={editingExp}
            onClose={() => { setShowExpWizard(false); setEditingExp(null); }}
            onSaved={() => { setShowExpWizard(false); setEditingExp(null); reload(); }}
          />
        </Suspense>,
        document.body
      )}

    </div>
    </Suspense>
  );
}

// ══════════════════════════════════════════════════════════════
// MEIN MOMENTE DRAWER — Zeigt Momente-Grid + "Neuen Moment erstellen"
// Performance: lazy images, keine Off-Screen-Elemente, Viewport-only Render
// Rechte: alle Nutzer können Momente veröffentlichen
// ══════════════════════════════════════════════════════════════
