// src/pages/Home.jsx — HUI Home Orchestrator v9
// Layout: Header → Feed (scroll) → HUIBottomNavigation (in-flow)

import React, { Suspense, useEffect, useRef, useCallback, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom"; // COMMERCE-01
import { useOrbWorld } from "../context/OrbWorldContext.jsx";
import { useWorldSurface } from "../context/WorldSurfaceContext.jsx";
import { cleanupOrbEnvironment } from "../lib/cleanup/cleanupOrbEnvironment.js";
import {
  orbBackdropTokens,
  orbNavDriftTokens,
  assertValidTab,
} from "../lib/world/orbLayer.js";
import { SAFE_MODE } from "../config/safeMode.js";
import { SafeRender } from "../config/SafeRender.jsx";
import TalentOnboarding from "../components/TalentOnboarding.jsx";
import { logDebug }  from "../lib/debugCollector.js";
import { PaintRecoveryManager } from "../lib/world/safariPaintRecovery.js";
import HomeShell, { useHome }   from "../components/home/HomeShell.jsx";
import { useHuiFlow } from "../core/hui.flow.js";
import { safeOrbAction } from "../core/hui.safePayload.js";
import HomeHeader                from "../components/home/header/HomeHeader.jsx";
import HUIBottomNavigation       from "../components/home/navigation/HUIBottomNavigation.jsx";
import ProfileLauncher           from "../components/home/profile/ProfileLauncher.jsx";
import UnifiedFeed from "../feed/UnifiedFeed.jsx";
import { shareContent } from "../lib/shareContent.js"; // SHARE.1 2026-07-09
import { usePresence }             from "../lib/usePresence.js";
import { StoryViewer }           from "../components/StoryBar.jsx";
import { useProfileLauncher }    from "../components/home/profile/ProfileLauncher.jsx";
import ChatCenterOverlay          from "../components/chat-center/ChatCenterOverlay.jsx";
import { useChatList }             from "../lib/chatContext.js";
import ConnectionCreatePage      from "../components/connection-create/ConnectionCreatePage.jsx";
import WerkKaufFlow           from "../components/commerce/WerkKaufFlow.jsx";         // COMMERCE-01
import WerkeKorb, { WerkeKorbButton } from "../components/commerce/WerkeKorb.jsx"; // KORB-01
const UnterstutzenFlow = React.lazy(() => import("../components/commerce/UnterstutzenFlow.jsx")); // KORB-02 — lazy: Stripe erst bei Bedarf
import { clearCartAfterSuccess }        from "../components/commerce/commerceUtils.js";    // KORB-02
import ExperienceBookingFlow  from "../components/commerce/ExperienceBookingFlow.jsx"; // COMMERCE-01
// ── Tab-Pages: lazy → eigene Chunks, nur bei Bedarf geladen ────
// PHASE 17.3: ImpactPage + DiscoverPage — direkte imports (Safari-safe, kein lazy)
const DiscoverPage  = React.lazy(() => import("./DiscoverPage.jsx"));
import HuiLiveTicker    from "../components/shared/HuiLiveTicker.jsx"; // LIVETICKER.1 2026-07-08 -- ersetzt AmbientWorldBar (war Fake-Daten)
const ImpactPage    = React.lazy(() => import('./ImpactPage.jsx'));
// PHASE 18: FavoritesPage direkte import (Safari-safe)
const FavoritesPage = React.lazy(() => import("./FavoritesPage.jsx"));
// ── Orb-Flows: lazy → nur bei Tap auf Orb-Node geladen ─────────
const TeilenFlow     = React.lazy(() => import("../components/teilen/TeilenFlow.jsx"));
const WorkFlow       = React.lazy(() => import("../system/flows/work/WorkFlow.jsx"));
const ExperienceFlow = React.lazy(() => import("../system/flows/experience/ExperienceFlow.jsx"));
const ImpactFlow     = React.lazy(() => import("../system/flows/impact/ImpactFlow.jsx"));

// NotificationCenter deaktiviert — Resonanzzentrum übernimmt (NotificationButton.jsx)
const LiveMapPage         = React.lazy(() => import("./LiveMapPage.jsx"));
const HuiMatchOverlay     = React.lazy(() => import("../components/HuiMatchOverlay.jsx"));
// PHASE 18: HuiPlusSheet direkte import (Orb immer bereit)
// OrbCompass replaces HuiPlusSheet — Begegnungs-Kompass
import OrbCompass from "../components/OrbCompass.jsx";
import MeinHUI    from "./MeinHUI.jsx";
import { IX } from "../design/hui.interaction.js";
import ContentTypeSelector from "../content/ContentTypeSelector.jsx";
import InvitationFlow from "../content/invitation/InvitationFlow.jsx";
import { useContentPreview } from "../context/ContentPreviewContext.jsx";
import { usePullToRefresh }        from '../hooks/usePullToRefresh.js';
import { PullToRefreshIndicator }  from '../components/ui/PullToRefreshIndicator.jsx';
const HuiMembershipFlow   = React.lazy(() => import("../components/HuiMembershipFlow.jsx"));
const CreatorDashboard    = React.lazy(() => import("./CreatorDashboard.jsx"));
const HuiCreateFlow       = React.lazy(() => import("../components/HuiCreateFlow.jsx"));
// TalentOnboarding: direct import (kein lazy — verhindert Suspense-Spinner-Bug)
const StoryComposer       = React.lazy(() => import("../components/StoryComposer.jsx"));
// ExperienceCreator.jsx / WerkPublisher.jsx: Datei komplett entfernt (2026-07-08
// Dead-Code-Audit) -- showExperienceCreator/showWerkPublisher sind Legacy-benannte
// State-Flags, rendern aber schon seit laengerem ExperienceFlow/WorkFlow (s.u.).

const C = { cream: "#F9F7F4" };

const SAFE_MOTION_CSS = SAFE_MODE.motion ? '' : `
  /* SafeMode.motion=false: Alle Animationen deaktiviert */
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
`;

const GLOBAL_CSS = IX.CSS + `
  * { box-sizing: border-box; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
  html, body { margin: 0; padding: 0; background: #F9F7F4; }
  #root { width: 100%; max-width: 100%; overflow-x: hidden; background: #F9F7F4; }
  /* Phase 22: Keine Text-Select beim Tap */
  button, [role="button"] { -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
`;

/* ══════════════════════════════════════════════════════════════ */


function HomeInner() {
  const navigate = useNavigate();
  // Phase 16.6: Tab element refs for imperative Safari paint recovery
  const tabRefs = {
    feed:      React.useRef(null),
    discover:  React.useRef(null),
    impact:    React.useRef(null),
    favorites: React.useRef(null),
  };
  const scrollContainerRef = React.useRef(null);

  // ── feed-refresh Event → Feed neu laden ──────────────────────────
  const feedRefreshRef = React.useRef(null);   // wird von UnifiedFeed befüllt

  React.useEffect(() => {
    const handler = () => {
      feedRefreshRef.current?.();
    };
    window.addEventListener("feed-refresh", handler);
    return () => window.removeEventListener("feed-refresh", handler);
  }, []);

  // ── Pull-to-Refresh: Callback pro aktivem Tab ─────────────────
  // Löst tab-spezifischen Reload aus und sendet feed-refresh-Event
  const handlePullRefresh = React.useCallback(async () => {
    // Feed-Tab → UnifiedFeed.reload() via feedRefreshRef
    feedRefreshRef.current?.();
    // Alle Tabs: feed-refresh-Event → alle Subscriber werden benachrichtigt
    window.dispatchEvent(new CustomEvent("feed-refresh"));
    // Kurze Pause für visuelles Feedback (min 400ms)
    await new Promise(r => setTimeout(r, 400));
  }, []);

  // ── Pull-to-Refresh Hook ──────────────────────────────────────
  const { pullDistance, isRefreshing, isTriggered } = usePullToRefresh({
    onRefresh:  handlePullRefresh,
    scrollRef:  scrollContainerRef,
    threshold:  72,
    maxPull:    110,
    enabled:    true,
  });
  // PaintRecoveryManager — tracks rAF handles, cleaned up on unmount
  const paintManager = React.useRef(new PaintRecoveryManager());

  // ── Orb-Kontinuität — Cinematic Opening v2 (5 Phasen)
  // "idle" | "tap" | "focus" | "exiting" | "hidden" | "entering"
  const [orbTransition, setOrbTransition] = useState("idle");
  // Steuert MeinHUI's eigene Exit-Choreografie: Content fadet zuerst, dann schrumpft der Orb
  const [meinHuiClosing, setMeinHuiClosing] = useState(false);

  // ── Soft Transition — Schließen, spiegelbildlich zum Öffnen ──────────
  // 1. Inhalte verschwinden zuerst (0-180ms)       — via MeinHUI `closing` Prop
  // 2. Der gesamte Wirkungsraum blendet weich aus (180-400ms) — via `closing` Prop
  // 3. Erst danach: Nav-Orb blendet wieder ein (400ms+)
  const closeMeinHuiCinematic = useCallback(() => {
    setMeinHuiClosing(true);
    setTimeout(() => {
      setShowPlusSheet(false);
      setMeinHuiClosing(false);
      setOrbTransition("entering");
      setTimeout(() => setOrbTransition("idle"), 300);
    }, 400);
  }, []);

  // ── Orb-Reset bei externem PlusSheet-Close (Tab-Wechsel aus MeinHUI) ──
  // Wenn showPlusSheet durch switchTab/closeAllOverlays auf false gesetzt wird
  // (nicht durch closeMeinHuiCinematic), bleibt orbTransition="hidden" stecken.
  // Dieser Effect resetzt orbTransition sofort auf "idle" wenn das passiert.
  React.useEffect(() => {
    if (!showPlusSheet && orbTransition !== "idle") {
      setOrbTransition("idle");
    }
  }, [showPlusSheet]); // eslint-disable-line react-hooks/exhaustive-deps

  const { openCreatorProfile } = useProfileLauncher();
  const {
    tab,
    handleTab,
    openOwnProfile,
    mainScrollRef,
    keepFeed, keepDiscover,           keepImpact, keepFavorites,
    searchState,   setSearchState,
    activeMood,    setActiveMood,
    liveNotifCount,
    isTalent, isBaseUser, canCreate,
    isMember,
    currentUser,
    authProfile,
    openProfileById,
    showChat,          setShowChat,
    chatRecipient,     setChatRecipient,   // Phase 23: direkter Chat-Einstieg
    showNotifs,        setShowNotifs,
    showMap,           setShowMap,
    showMatch,         setShowMatch,
    showMembership,    setShowMembership,
    showPlusSheet,     setShowPlusSheet,
    showCreateFlow,    setShowCreateFlow,
    showConnect,       setShowConnect,
    showTeilen,        setShowTeilen,
    showTalentFlow,    setShowTalentFlow,
    showStoryComposer, setShowStoryComposer,
    showWerkPublisher, setShowWerkPublisher,
    showExperienceCreator, setShowExperienceCreator,
    showImpactFlow,         setShowImpactFlow,
    showContentSelector,    setShowContentSelector,
    showInvitationFlow,     setShowInvitationFlow,
    activeStory,       setActiveStory,
    showCreatorDash,   setShowCreatorDash,
    showCreatorDashboard,
    showWerkCheckout,  setShowWerkCheckout,  // COMMERCE-01 W-1
    showBookingFlow,   setShowBookingFlow,   // COMMERCE-01 W-1
    showWerkeKorb,     setShowWerkeKorb,     // KORB-01
    showUnterstutzenFlow, setShowUnterstutzenFlow, // KORB-02
    cart,              setCart,              // KORB-01
    clearCartPersist,                        // KORB-PERSIST
  } = useHome();

  const { close: closeContentPreview } = useContentPreview();

  // ── hui:navigate:tab Event → Tab wechseln (aus Feed-Karten, ContentPreviewSheet etc.) ──
  // MUSS nach useHome() stehen, da handleTab erst dort definiert wird
  React.useEffect(() => {
    const handler = (e) => { if (e.detail?.tab) handleTab(e.detail.tab); };
    window.addEventListener("hui:navigate:tab", handler);
    return () => window.removeEventListener("hui:navigate:tab", handler);
  }, [handleTab]);

  // ── Unread Message Count — live aus chatContext ────────
  const { unreadTotal, markChatRead } = useChatList("home");
  usePresence(currentUser?.id);

  // COMMERCE-01: WorkDetailPage → /Home + state → WerkKaufFlow öffnen
  const location = useLocation();

  // Stripe Redirect wird in UnterstutzenFlow behandelt (P1)

    useEffect(() => {
    const pending = location?.state?.pendingWerkKauf;
    if (pending && setShowWerkCheckout) {
      setShowWerkCheckout(pending);
      // Router-State sofort leeren damit Reload nicht erneut öffnet
      try { window.history.replaceState({}, document.title, window.location.pathname); } catch {}
    }
  }, [location?.state?.pendingWerkKauf]); // eslint-disable-line  // Activity Tracking: App-Start, Foreground, Heartbeat


  // ── Phase 4C: Talent Flow global registrieren ────────────────
  // Ermöglicht Guards aus beliebigen Komponenten: window.__HUI_OPEN_TALENT_FLOW?.()
  React.useEffect(() => {
    window.__HUI_OPEN_TALENT_FLOW    = () => setShowMembership(true);
    window.__HUI_OPEN_CREATOR_DASH   = () => setShowCreatorDash(true);
    window.__HUI_OPEN_PROFILE__       = (id) => { if(id) openProfileById(id); };
    return () => {
      delete window.__HUI_OPEN_TALENT_FLOW;
      delete window.__HUI_OPEN_CREATOR_DASH;
      delete window.__HUI_OPEN_PROFILE__;
    };
  }, [setShowMembership, setShowCreatorDash]);

  // ─────────────────────────────────────────────────────────────

  // Phase 2: Flow Memory System
  const flow = useHuiFlow();

  // ── Orb World Layer — above navigation ─────────────────────
  const {
    openOrbWorld, closeOrbWorld, isOrbOpen, orbState,
    backdrop: orbBackdrop, navDrift: orbNavDrift,
  } = useOrbWorld();

  // ── World Surface Controller — single authority blur/feed/nav ──
  const {
    worldState,
    worldTokens,
    openSurface,
    closeSurface,
    confirmSurface,
    forceRecoverWorld,
    activeSurface,
  } = useWorldSurface();

  // Debug guard: tab should never be "orb"
  React.useEffect(() => {
    if (tab === "orb") {
      console.warn("[HUI INVALID ORB ROUTE] tab=orb detected. Resetting to feed.");
      handleTab("feed");
    }
  }, [tab, handleTab]);

  // Phase 16.6: Safari Paint Recovery — safe, cancel-aware
  // When activeSurface→null (surface closed), trigger repaint on active tab.
  // Uses PaintRecoveryManager to track + cancel all rAF handles.
  React.useEffect(() => {
    if (activeSurface !== null) return;  // only on close

    // Cancel any in-flight recovery from previous close
    paintManager.current.cleanup();

    const t = setTimeout(() => {
      // Strip GPU hints from scroll container (synchronous, safe)
      paintManager.current.stripHints(scrollContainerRef.current, "scroll-container");

      // Force repaint on active tab div (async, cancel-aware)
      const activeTabRef = tabRefs[tab];
      // Phase 16.7.1: expose crash context globally for ErrorBoundary/SafeBoundary
      if (typeof window !== "undefined") {
        window.__HUI_WORLD_STATE__ = {
          ...(window.__HUI_WORLD_STATE__ || {}),
          activeTab: tab,
          membershipType: isMember ? "member" : "free",
        };
      }
      if (activeTabRef?.current) {
        paintManager.current.repaint(activeTabRef.current, `tab-${tab}`);
      }
    }, 320);  // after 280ms close-transition + 40ms buffer

    return () => {
      clearTimeout(t);
      // Cancel any pending rAF on cleanup (tab switch / unmount)
      paintManager.current.cleanup();
    };
  }, [activeSurface]); // eslint-disable-line react-hooks/exhaustive-deps

  // Phase 16.6: Cleanup on unmount — cancel all pending repaint rAFs
  React.useEffect(() => {
    const mgr = paintManager.current;
    return () => mgr.cleanup();
  }, []);

  /* onTabPress — delegiert vollständig an handleTab (NAV-001: konsolidiert)
   * handleTab ist die einzige autoritative Tab-Routing-Instanz.
   * Alle Routing-Entscheidungen (creator/profile/impact) liegen in HomeShell.handleTab. */
  function onTabPress(key) {
    handleTab(key);
  }

  return (
    <>
      <style>{GLOBAL_CSS + SAFE_MOTION_CSS}</style>


      {/* ── Haupt-Layout: Header → Feed → HUIBottomNavigation ─── */}
      <div style={{
        height:          "100dvh",         /* dvh: Safari 15.4+ */
        /* minHeight:-webkit-fill-available ENTFERNT:
           Kollidiert mit height:100dvh auf iPad Safari.
           -webkit-fill-available = Layout-Viewport (~1070px),
           100dvh = Visual-Viewport (~940px).
           min() gewinnt → Container zu groß → Safari-Scaling. */
        display:         "flex",
        flexDirection:   "column",
        background:      C.cream,
        position:        "relative",
        width:           "100%",           /* kein overflow über Viewport */
        maxWidth:        "100%",
        overflowX:       "hidden",
        /* overflow:hidden BEWUSST WEGGELASSEN — Safari pointer-events Fix */
      }}>

        {/* Header */}
        <HomeHeader
          activeMood={activeMood}
          onMoodSelect={setActiveMood}
          notifCount={liveNotifCount}
          msgCount={unreadTotal}
          currentUser={currentUser}
          onNotif={() => {
            setShowNotifs(true);
          }}
          onSearchStateChange={setSearchState}
        />

        {/* Phase 16.4: Surface Dim Overlay — position:fixed, above tab content,
             below surface overlays. Dims entire viewport when surface is active.
             NEVER blocks pointer events on tab content. */}
        <div
          style={{
            ...worldTokens.dimStyle,
            // Override zIndex to sit between tab content and overlays
            zIndex: 8985,
          }}
          aria-hidden="true"
        />

        {/* Scroll-Bereich */}
        <div
          className="hui-scroll"
          ref={(el) => { mainScrollRef.current = el; scrollContainerRef.current = el; }}
          style={{
            flex:         1,
            overflowY:    "auto",
            overflowX:    "hidden",
            position:     "relative",
            // overscroll-behavior:contain = kein Bounce/Rubber-Band am Ende,
            // Scrollen bleibt aber möglich (kein "none" → würde Scroll blockieren)
            overscrollBehavior: "contain",
            WebkitOverflowScrolling: "touch",
            // NAV-LAYOUT: Feed endet oberhalb der HUIBottomNavigation.
            // Die Navigation reserviert ihren Platz als flex-shrink:0 Geschwister.
            // Kein paddingBottom nötig — kein Content läuft hinter die Navigation.
            // Phase 22: Atmosphärische Kontinuität beim Tab-Wechsel
            // Sanfte background-transition — gibt das Gefühl von
            // "Raum-Wechsel" statt "Screen-Wechsel"
            // Soft Transition — Hintergrund wird innerhalb von ~300ms leicht
            // weicher (Opacity/Blur), kein harter Wechsel.
            // ROOT-CAUSE-FIX (2026-07-05): "blur(0px) brightness(1)" ist visuell ein
            // No-Op, aber CSS behandelt JEDEN filter-Wert != "none" als aktiv —
            // das erzeugt permanent einen eigenen Stacking-Context auf diesem
            // Scroll-Container. Dadurch wurde JEDER Modal-zIndex darin (auch 10500+)
            // in diesem lokalen Context eingesperrt und konnte den Footer/Orb
            // (zIndex:10000, Sibling AUSSERHALB dieses Containers) nie überragen —
            // unabhängig vom gesetzten zIndex-Wert. Fix: im Ruhezustand "none" statt
            // "blur(0px) brightness(1)" — keine Stacking-Context-Falle mehr, der
            // eigentliche Blur-Effekt beim orbTransition bleibt unverändert erhalten.
            filter: (orbTransition === "exiting" || orbTransition === "hidden")
              ? "blur(3px) brightness(0.96)"
              : "none",
            transition:   "background-color 320ms cubic-bezier(0.16,1,0.30,1), filter 0.3s ease-in-out",
            ...worldTokens.feedContainerStyle,
          }}
        >
          {/* ── Pull-to-Refresh Indikator — oben im Scroll-Container ── */}
          <PullToRefreshIndicator
            pullDistance={pullDistance}
            isRefreshing={isRefreshing}
            isTriggered={isTriggered}
          />

          <div ref={tabRefs.feed} style={keepFeed}>
            <HuiLiveTicker />
            {SAFE_MODE.homeFeed ? (
              <SafeRender flag="homeFeed" label="Feed">
                <UnifiedFeed
                  onRefreshBind={fn => { feedRefreshRef.current = fn; }}
                  showEvents={false}
                  currentUser={currentUser}
                  searchActive={searchState.active}
                  searchQuery={searchState.query}
                  typeFilter={searchState.typeFilter}
                  categoryFilters={searchState.categories}
                  radiusKm={searchState.radiusKm}
                  geo={searchState.geo}
                  onProfile={(userId) => {
                    if (!userId) {
                      return;
                    }
                    // Visuelles Debug-Toast damit wir auf iPad sehen ob der Klick ankommt
                    if (window.__HUI_DEBUG_PROFILE__) {
                      window.__HUI_DEBUG_PROFILE__(userId);
                    }
                    openProfileById(userId);
                  }}
                  onBook={(item) => {
                    // KORB-01: Werk/Experience → Werkekorb
                    if (!item?.id) return;
                    setCart(prev => {
                      if (prev.some(x => x.id === item.id)) return prev;
                      return [...prev, item];
                    });
                    setShowWerkeKorb(false); // kurzer Glow, kein Auto-Open
                  }}
                  onDetail={(item) => {
                    const werkId = item?.id || item?._raw?.id;
                    if (werkId) navigate(`/work/${werkId}`);
                  }}
                  // SHARE.1 (2026-07-09) BUGFIX: onShare oeffnete faelschlich den
                  // "Neuen Beitrag erstellen"-Flow (setShowTeilen) und ignorierte
                  // das angetippte item komplett -- "Weitergeben" auf einer Feed-
                  // Karte teilte nie den echten Inhalt. Jetzt: zentrale shareContent().
                  onShare={(item) => shareContent(item)}
                  onEventPress={(ev) => {
                    const creatorId = ev?.creator_id || ev?.author?.id || ev?.user_id;
                    if (creatorId) openProfileById(creatorId);
                  }}
                  onMoreEvents={() => handleTab("discover")}
                  onDiscover={() => handleTab("discover")}
                  // Suchtreffer "Impact-Projekte" (2026-07-06): springt zum
                  // Impact-Tab. Kein Deep-Link auf einzelnes Projekt noetig --
                  // ImpactPage zeigt Projekte ohnehin gruppiert/gerankt, ein
                  // Scroll-Ziel je Projekt waere eine zweite Navigation-Baustelle
                  // ohne echten Mehrwert fuer diesen Anwendungsfall.
                  onProjectPress={() => handleTab("impact")}
                   scrollContainerRef={scrollContainerRef}
                />
              </SafeRender>
            ) : (
              <div style={{
                padding:"40px 20px", textAlign:"center",
                display:"flex", flexDirection:"column", alignItems:"center", gap:16,
              }}>
                <div style={{ width:56, height:56, borderRadius:18,
                  background:"linear-gradient(135deg,rgba(13,196,181,0.10),rgba(244,115,85,0.07))",
                  animation:"huiBreathe 4.8s ease-in-out infinite",
                  border:"1px solid rgba(13,196,181,0.12)",
                }}/>
                <div style={{ fontSize:13, color:"rgba(20,20,34,0.32)", fontWeight:500,
                  letterSpacing:"-0.005em", animation:"huiFadeIn 0.6s ease" }}>Atmet…</div>
              </div>
            )}
          </div>

          {/* Phase 17.1 FIX: tabVisibilityController liefert jetzt position:absolute
               für inaktive Tabs → kein Flow-Space-Problem mehr */}
          <div ref={tabRefs.discover} style={keepDiscover}>
            {/* TalentOnboarding — direkt (kein lazy/Suspense) */}
      {showTalentFlow && SAFE_MODE.talentFlow && (
        <TalentOnboarding
          onClose={() => setShowTalentFlow(false)}
          onActivate={() => setShowTalentFlow(false)}
        />
      )}

      <Suspense fallback={<div style={{padding:"40px 20px",textAlign:"center",opacity:0.6,fontSize:13,
  color:"rgba(20,20,34,0.40)",animation:"huiFadeIn 0.5s ease"}}>Entdecken öffnet sich…</div>}>
              <SafeRender flag="discoverFeed" label="DiscoverPage">
                <DiscoverPage
                    onView={(id) => { if(id) openProfileById(id); }}
                    onMap={() => setShowMap(true)}
                    onBook={(item) => {
                      // Erlebnis aus DiscoverPage → ExperienceBookingFlow
                      setShowBookingFlow(item);
                    }}
                  />
              </SafeRender>
            </Suspense>
          </div>

          <div ref={tabRefs.impact} style={keepImpact}>
            <Suspense fallback={<div style={{padding:"40px 20px",textAlign:"center",opacity:0.6,fontSize:13,
  color:"rgba(20,20,34,0.40)",animation:"huiFadeIn 0.5s ease"}}>Impact-Raum öffnet sich…</div>}>
              <SafeRender flag="impactPage" label="ImpactPage">
                <ImpactPage currentUser={currentUser}/>
              </SafeRender>
            </Suspense>
          </div>

          <div ref={tabRefs.favorites} style={keepFavorites}>
            <Suspense fallback={<div style={{
          position:'fixed',inset:0,display:'flex',
          alignItems:'center',justifyContent:'center',
          background:'rgba(249,247,244,0.85)',zIndex:10500,
          backdropFilter:'blur(6px)'
        }}>
          <div style={{
            width:36,height:36,borderRadius:'50%',
            border:'3px solid rgba(22,215,197,0.2)',
            borderTopColor:'#16D7C5',
            animation:'hui-spin 0.7s linear infinite',
          }}/>
          <style>{'@keyframes hui-spin{to{transform:rotate(360deg)}}'}</style>
        </div>}>
              <FavoritesPage
                currentUser={currentUser}
                onView={w => { const id=w?.id||w?.user_id; if(id) openProfileById(id); }}
                onImpact={() => handleTab("impact")}
                onDiscover={() => handleTab("discover")}
              />
            </Suspense>
          </div>
        </div>

        {/* ── HUIBottomNavigation: in-flow, reserviert eigenen Platz ── */}
        <HUIBottomNavigation
          tab={tab}
          onTab={onTabPress}
          creatorOpen={showCreatorDashboard}
          hasTalent={isTalent}
          orbActive={activeSurface === 'orb' || showMembership || showTalentFlow}
          orbTransition={showPlusSheet ? "hidden" : orbTransition}
          navDrift={
            (showMembership || showTalentFlow)
              ? { opacity: 0, transform: "translateY(120%)",
                  transition: "opacity 0.52s cubic-bezier(0.22,1,0.36,1), transform 0.52s cubic-bezier(0.22,1,0.36,1)",
                  pointerEvents: "none" }
              : activeSurface ? worldTokens.navStyle : null
          }
          authProfile={authProfile}
          notifCount={liveNotifCount}
          msgCount={unreadTotal}
          onOrbAction={(key) => {
            if (key !== "create") return;

            const canRenderOrbContent = SAFE_MODE.orb;
            if (!canRenderOrbContent) return;

            // ── Soft Transition — Wirkungsraum öffnet ruhig ───────────────
            // Nav-Orb blendet sanft aus, während MeinHUI als Ganzes
            // weich einblendet (opacity + 10px translateY, ~300ms).
            // Der gestaffelte Content-Aufbau läuft intern in MeinHUI.
            setOrbTransition("exiting");
            setShowPlusSheet(true);
            setTimeout(() => setOrbTransition("hidden"), 300);
          }}
        />

      </div>

      {/* KORB-01: Floating Korb-Button — oberhalb TabBar */}
      {SAFE_MODE.werkFlow && (
        <WerkeKorbButton
          count={cart.length}
          onOpen={() => setShowWerkeKorb(true)}
        />
      )}

      {/* KORB-01: Werkekorb Bottom Sheet */}
      {showWerkeKorb && SAFE_MODE.werkFlow && (
        <WerkeKorb
          items={cart}
          onClose={() => setShowWerkeKorb(false)}
          onRemove={(item) => setCart(prev => prev.filter(x => x.id !== item.id))}
          onUnterstuetzen={async (items) => {
            // KORB-02: WerkeKorb → UnterstutzenFlow (kein Magic-Timeout)
            // WerkeKorb setzt phase="loading" → der Flow öffnet sich nach
            // Abschluss des await. onUnterstuetzen resolved → WerkeKorb schließt sich.
            setShowUnterstutzenFlow(true);
            setShowWerkeKorb(false);
            // C2.1: PI-Erstellung startet automatisch im UnterstutzenFlow-useEffect
          }}
          onDiscover={() => { setShowWerkeKorb(false); handleTab("discover"); }}
          onChat={null}
        />
      )}

      {/* KORB-02: UnterstutzenFlow — lazy (Stripe erst bei Bedarf laden) */}
      {showUnterstutzenFlow && SAFE_MODE.werkFlow && (
        <Suspense fallback={null}>
          <UnterstutzenFlow
            items={cart}
            onClose={() => { setShowUnterstutzenFlow(false); closeContentPreview(); }}
            onUnterstuetzen={async (items, form, method) => {
              // P1: Mock-Timeout entfernt — Stripe übernimmt Payment
              // UnterstutzenFlow ruft create-payment-intent direkt auf
            }}
            onClearCart={() => { clearCartAfterSuccess(setCart); clearCartPersist?.(); }}
            onDiscover={() => { setShowUnterstutzenFlow(false); handleTab("discover"); }}
            onResonanzCenter={() => setShowUnterstutzenFlow(false)}
          />
        </Suspense>
      )}

      {/* ── Overlay Layer ──────────────────────────────────────── */}
      <ProfileLauncher/>
      {/* ── WerkKaufFlow — COMMERCE-01 ─────────────────────────── */}
      {showWerkCheckout && (
        <WerkKaufFlow
          werk={showWerkCheckout}
          onClose={() => setShowWerkCheckout(null)}
        />
      )}

      {/* ── ExperienceBookingFlow — COMMERCE-01 ─────────────────── */}
      {showBookingFlow && (
        <ExperienceBookingFlow
          experience={showBookingFlow}
          onClose={() => setShowBookingFlow(null)}
        />
      )}


      {/* ── Connection Create ───────────────────────────────────── */}
      {showConnect && SAFE_MODE.connectFlow && (
        <SafeRender flag="connectFlow" label="ConnectionCreatePage">
          <ConnectionCreatePage
            onClose={() => {
              setShowConnect(false);
            }}
            onPublish={(result) => {

              // Feed Refresh: falls FeedRefresh-Mechanismus existiert, hier auslösen
              // Aktuell: kein automatischer Refresh → nur schließen
              setShowConnect(false);
            }}
          />
        </SafeRender>
      )}

      {/* ── Teilen Flow — STATIC IMPORT, ALWAYS IN DOM ── */}
      {/* visible prop steuert Sichtbarkeit — KEIN lazy, KEIN SafeRender, KEIN conditional */}
      <TeilenFlow
        visible={showTeilen}
        onClose={() => {
          setShowTeilen(false);
        }}
        onPublished={(result) => {
          setShowTeilen(false);
        }}
      />

      {/* ── HUI Resonanz Center ─────────────────────────────────── */}
      {showChat && SAFE_MODE.chatCenter && (
        <SafeRender flag="chatCenter" label="ChatCenterOverlay">
          <ChatCenterOverlay
            onClose={() => {
              setShowChat(false);
              setChatRecipient(null);
              const returnProfile = flow.getReturnProfile();
              if (returnProfile) {
                flow.clearReturnProfile();
                const retId = returnProfile?.id || returnProfile?.user_id;
                if (retId) { setTimeout(() => openProfileById(retId), 50); }
              }
            }}
            onMarkRead={markChatRead}
            initialRecipient={chatRecipient}
            onDiscoverClose={() => {
              setShowChat(false);
              setChatRecipient(null);
              flow.clearReturnProfile();
              handleTab("discover");
            }}
          />
        </SafeRender>
      )}

      <Suspense fallback={<div style={{
          position:'fixed',inset:0,display:'flex',
          alignItems:'center',justifyContent:'center',
          background:'rgba(249,247,244,0.85)',zIndex:10500,
          backdropFilter:'blur(6px)'
        }}>
          <div style={{
            width:36,height:36,borderRadius:'50%',
            border:'3px solid rgba(22,215,197,0.2)',
            borderTopColor:'#16D7C5',
            animation:'hui-spin 0.7s linear infinite',
          }}/>
          <style>{'@keyframes hui-spin{to{transform:rotate(360deg)}}'}</style>
        </div>}>
        {showMap && SAFE_MODE.liveMap && (
          <SafeRender flag="liveMap" label="LiveMapPage">
            <LiveMapPage
              onView={w => { const id=w?.id||w?.user_id; if(id) openProfileById(id); setShowMap(false); }}
              onMatch={() => { setShowMatch(true); setShowMap(false); }}
              onClose={() => setShowMap(false)}
            />
          </SafeRender>
        )}
        {showMatch && SAFE_MODE.matchOverlay && (
          <SafeRender flag="matchOverlay" label="HuiMatchOverlay">
            <HuiMatchOverlay
              onClose={() => setShowMatch(false)}
              onMoodSelect={(m) => { setActiveMood(m); setShowMatch(false); }}
              onView={w => { const id=w?.id||w?.user_id; if(id) openProfileById(id); setShowMatch(false); }}
            />
          </SafeRender>
        )}
        {/* MeinHUI — Persönlicher Wirkungsraum (Orb-Erfahrung v2.0, Cinematic Closing) */}
        <MeinHUI
          visible={showPlusSheet}
          closing={meinHuiClosing}
          profile={authProfile}
          onClose={closeMeinHuiCinematic}
          onNotif={closeMeinHuiCinematic}
          onSettings={closeMeinHuiCinematic}
        />
        {/* TalentOnboarding: außerhalb Suspense (kein lazy mehr) */}
        {showStoryComposer && SAFE_MODE.storyComposer && canCreate && (
          <SafeRender flag="storyComposer" label="StoryComposer">
            <StoryComposer
              onClose={() => setShowStoryComposer(false)}
              onPublished={() => setShowStoryComposer(false)}
            />
          </SafeRender>
        )}
        {showWerkPublisher && SAFE_MODE.werkFlow && canCreate && (
          <SafeRender flag="werkFlow" label="WorkFlow">
            <WorkFlow
              onClose={() => setShowWerkPublisher(false)}
              onPublished={() => setShowWerkPublisher(false)}
            />
          </SafeRender>
        )}
        {showExperienceCreator && SAFE_MODE.experienceFlow && canCreate && (
          <SafeRender flag="experienceFlow" label="ExperienceFlow">
            <ExperienceFlow
              onClose={() => setShowExperienceCreator(false)}
            />
          </SafeRender>
        )}
        {/* DEAKTIVIERT: NotificationCenter.jsx (altes System).
             Notification-Zugang läuft jetzt ausschliesslich über
             ResonanzzentrumPanel in NotificationButton.jsx.
             showNotifs / setShowNotifs bleiben im State für spätere Entfernung. */}
        {showMembership && SAFE_MODE.membership && (
          <SafeRender flag="membership" label="HuiMembershipFlow">
            <HuiMembershipFlow
              onClose={() => {
                try { cleanupOrbEnvironment({ reason: "membership-close" }); } catch {}
                setShowMembership(false);
              }}
              onComplete={() => {
                // Membership complete: cleanup + close modal
                // Note: no closeSurface() — membership was opened without openSurface()
                try { cleanupOrbEnvironment({ reason: "membership-complete" }); } catch {}
                setShowMembership(false);
                // isTalent will flip live via useMemo (authProfile.is_member→true)
                // → HUIBottomNavigation orb will automatically show CreatorOrb on next tap
              }}
            />
          </SafeRender>
        )}
        {/* Phase 4D: Creator Dashboard */}
        {showCreatorDash && (
          <React.Suspense fallback={null}>
            <CreatorDashboard
              visible={showCreatorDash}
              onClose={() => setShowCreatorDash(false)}
              onOpenProfile={(id) => {
                setShowCreatorDash(false);
                if (id === "discover") { handleTab("discover"); }
                else if (id) { openProfileById(id); }
              }}
            />
          </React.Suspense>
        )}
        {showCreateFlow && SAFE_MODE.createFlow && (
          <SafeRender flag="createFlow" label="HuiCreateFlow">
            <HuiCreateFlow onClose={() => setShowCreateFlow(false)}/>
          </SafeRender>
        )}
        {showImpactFlow && SAFE_MODE.impactFlow && (
          <SafeRender flag="impactFlow" label="ImpactFlow">
            <ImpactFlow
              onClose={() => setShowImpactFlow(false)}
            />
          </SafeRender>
        )}
      </Suspense>

      {/* Phase 4B: Content Type Selector — öffnet sich statt Orb für Mitglieder */}
      {showContentSelector && isTalent && (
        <ContentTypeSelector
          visible={showContentSelector}
          onClose={() => setShowContentSelector(false)}
          onSelect={(type) => {
            setShowContentSelector(false);
            // Routing: type → richtiger Flow
            if (type === "moment") {
              setShowTeilen(true);
            } else if (type === "experience") {
              setShowExperienceCreator(true);
            } else if (type === "work") {
              setShowWerkPublisher(true);
            } else if (type === "invitation") {
              setShowInvitationFlow(true);
            }
          }}
        />
      )}

      {/* Phase 4B: Einladung erstellen Flow */}
      {showInvitationFlow && (
        <InvitationFlow
          visible={showInvitationFlow}
          onClose={() => setShowInvitationFlow(false)}
        />
      )}

      {activeStory && SAFE_MODE.storyViewer && (
        <SafeRender flag="storyViewer" label="StoryViewer">
          <StoryViewer story={activeStory} onClose={() => setActiveStory(null)} onViewProfile={(story) => { if (story?.user_id) openCreatorProfile(story.user_id); }}/>
        </SafeRender>
      )}

      {/* Phase 16.4: World Surface + Tab Debug — tree-shaken in prod */}
      {import.meta.env.DEV && (
        <div style={{
          position:"fixed", top:8, right:8, zIndex:99999,
          background:"rgba(0,0,0,0.88)", backdropFilter:"blur(10px)",
          borderRadius:11, padding:"9px 13px", fontSize:10.5,
          fontFamily:"monospace", color:"#fff", lineHeight:1.75,
          pointerEvents:"none", userSelect:"none",
          border:"1px solid rgba(255,255,255,0.15)",
          minWidth:200,
        }}>
          <div style={{ color:"#16D7C5", fontWeight:700, marginBottom:3, fontSize:11 }}>
            🌍 World Surface
          </div>
          <div>surface: <b style={{color: activeSurface ? "#FF8A6B":"#aaa"}}>
            {activeSurface ?? "null"}
          </b></div>
          <div>confirmed: <b style={{color: worldState?.overlayConfirmed ? "#16D7C5":"#aaa"}}>
            {String(worldState?.overlayConfirmed ?? false)}
          </b></div>
          <div>navLocked: <b style={{color: worldState?.navLocked ? "#FF8A6B":"#aaa"}}>
            {String(worldState?.navLocked ?? false)}
          </b></div>
          <div>sheet: <b style={{color: showPlusSheet ? "#FF8A6B":"#aaa"}}>
            {String(showPlusSheet)}
          </b></div>

          <div style={{ borderTop:"1px solid rgba(255,255,255,0.12)", margin:"5px 0 3px" }} />
          <div style={{ color:"#a8d8cf", fontWeight:700, marginBottom:2 }}>Tabs</div>
          <div>activeTab: <b style={{color:"#16D7C5"}}>{tab}</b></div>
          <div>feed op: <b style={{color: keepFeed?.opacity === 1 ? "#16D7C5":"#FF8A6B"}}>
            {keepFeed?.opacity ?? "?"}
          </b></div>
          <div>impact op: <b style={{color: keepImpact?.opacity === 1 ? "#16D7C5":"#FF8A6B"}}>
            {keepImpact?.opacity ?? "?"}
          </b></div>
          <div>discover op: <b style={{color: keepDiscover?.opacity === 1 ? "#16D7C5":"#FF8A6B"}}>
            {keepDiscover?.opacity ?? "?"}
          </b></div>
          <div>tab→ptr: <b style={{color:"#aaa"}}>
            {keepFeed?.pointerEvents}/{keepImpact?.pointerEvents}
          </b></div>
        </div>
      )}

      

    </>
  );
}

export default function Home() {
  return (
    <HomeShell>
      <HomeInner/>
    </HomeShell>
  );
}