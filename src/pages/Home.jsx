// src/pages/Home.jsx — HUI Home Orchestrator v8
// SAFARI-FIX: BottomNav außerhalb overflow:hidden Container
// iOS Safari vererbt pointer-events von overflow:hidden auf position:fixed Kinder

import React, { Suspense, useEffect, useRef, useCallback } from "react";
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
import { PaintRecoveryManager } from "../lib/world/safariPaintRecovery.js";
import HomeShell, { useHome }   from "../components/home/HomeShell.jsx";
import { useHuiFlow } from "../core/hui.flow.js";
import { safeOrbAction } from "../core/hui.safePayload.js";
import HomeHeader                from "../components/home/header/HomeHeader.jsx";
import BottomNav                 from "../components/home/navigation/BottomNav.jsx";
import ProfileLauncher           from "../components/home/profile/ProfileLauncher.jsx";
import HomeFeed                  from "../components/HomeFeed.jsx";
import { StoryViewer }           from "../components/StoryBar.jsx";
import ChatCenterOverlay         from "../components/chat-center/ChatCenterOverlay.jsx";
import ConnectionCreatePage      from "../components/connection-create/ConnectionCreatePage.jsx";
// ── Tab-Pages: lazy → eigene Chunks, nur bei Bedarf geladen ────
// PHASE 17.3: ImpactPage + DiscoverPage — direkte imports (Safari-safe, kein lazy)
import DiscoverPage  from "./DiscoverPage.jsx";
import ImpactPage    from "./ImpactPage.jsx";
// PHASE 18: FavoritesPage direkte import (Safari-safe)
import FavoritesPage from "./FavoritesPage.jsx";
// ── Orb-Flows: lazy → nur bei Tap auf Orb-Node geladen ─────────
const TeilenFlow     = React.lazy(() => import("../components/teilen/TeilenFlow.jsx"));
const WorkFlow       = React.lazy(() => import("../system/flows/work/WorkFlow.jsx"));
const ExperienceFlow = React.lazy(() => import("../system/flows/experience/ExperienceFlow.jsx"));
const ImpactFlow     = React.lazy(() => import("../system/flows/impact/ImpactFlow.jsx"));

const NotificationCenter  = React.lazy(() => import("../components/NotificationCenter.jsx"));
const LiveMapPage         = React.lazy(() => import("./LiveMapPage.jsx"));
const HuiMatchOverlay     = React.lazy(() => import("../components/HuiMatchOverlay.jsx"));
// PHASE 18: HuiPlusSheet direkte import (Orb immer bereit)
import HuiPlusSheet from "../components/HuiPlusSheet.jsx";
import { IX } from "../design/hui.interaction.js";
import ContentTypeSelector from "../content/ContentTypeSelector.jsx";
import InvitationFlow from "../content/invitation/InvitationFlow.jsx";
const HuiMembershipFlow   = React.lazy(() => import("../components/HuiMembershipFlow.jsx"));
const HuiCreateFlow       = React.lazy(() => import("../components/HuiCreateFlow.jsx"));
const TalentOnboarding    = React.lazy(() => import("../components/TalentOnboarding.jsx"));
const StoryComposer       = React.lazy(() => import("../components/StoryComposer.jsx"));
// ExperienceCreator: removed (ExperienceFlow used instead — dead import)

const C = { cream: "#F9F6F2" };

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
  // Phase 16.6: Tab element refs for imperative Safari paint recovery
  const tabRefs = {
    feed:      React.useRef(null),
    discover:  React.useRef(null),
    impact:    React.useRef(null),
    favorites: React.useRef(null),
  };
  const scrollContainerRef = React.useRef(null);
  // PaintRecoveryManager — tracks rAF handles, cleaned up on unmount
  const paintManager = React.useRef(new PaintRecoveryManager());

  const {
    tab,
    handleTab,
    openOwnProfile,
    mainScrollRef,
    keepFeed, keepDiscover,           keepImpact, keepFavorites,
    activeMood,    setActiveMood,
    liveNotifCount,
    isTalent,
    isMember,
    currentUser,
    authProfile,
    setShowWirker,
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
  } = useHome();

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

  /* onTab: routed through Action Engine — handleTab still syncs HomeShell state */
  function onTabPress(key) {
    // Action Engine handles logging + future side-effects
    // handleTab remains the source of truth for tab state in HomeShell
    if (key === "profile") {
      openOwnProfile();   // handled by Action Engine in BottomNav, kept here as fallback
    } else {
      handleTab(key);     // HomeShell state sync (non-negotiable)
    }
  }

  return (
    <>
      <style>{GLOBAL_CSS + SAFE_MOTION_CSS}</style>

      {/* ── Haupt-Layout: KEIN overflow:hidden hier ────────────── */}
      {/* overflow:hidden würde in iOS Safari pointer-events auf    */}
      {/* position:fixed Kinder vererben → BottomNav tot           */}
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
          msgCount={0}
          onNotif={() => setShowNotifs(true)}
          onChat={() => setShowChat(true)}
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
            // Phase 22: Atmosphärische Kontinuität beim Tab-Wechsel
            // Sanfte background-transition — gibt das Gefühl von
            // "Raum-Wechsel" statt "Screen-Wechsel"
            transition:   "background-color 320ms cubic-bezier(0.16,1,0.30,1)",
            ...worldTokens.feedContainerStyle,
          }}
        >
          <div ref={tabRefs.feed} style={keepFeed}>
            {SAFE_MODE.homeFeed ? (
              <SafeRender flag="homeFeed" label="HomeFeed">
                <HomeFeed
                  user={currentUser}
                  notifCount={liveNotifCount}
                  chatCount={0}
                  onSearch={() => {}}
                  onNotif={() => setShowNotifs(true)}
                  onChat={() => setShowChat(true)}
                  onStory={(s) => {
                    if (s?.isYou) setShowStoryComposer(true);
                    else if (s) setActiveStory(s);
                  }}
                  onEvent={() => {}}
                  onMoreEvents={() => handleTab("discover")}
                  onProfile={(item) => setShowWirker(item)}
                  onLike={() => {}}
                  onComment={(item) => {
                    // Phase 23: Kommentar = Gespräch mit Creator
                    const userId = item?.user_id || item?.author_id || item?.id;
                    const name   = item?.display_name || item?.author || item?.name || "Creator";
                    const avatar = item?.avatar_url   || item?.avatar || null;
                    if (userId) {
                      setChatRecipient({ id: userId, display_name: name, avatar_url: avatar });
                      setShowChat(true);
                    }
                  }}
                  onPerson={(p) => setShowWirker(p)}
                  onDiscover={() => handleTab("discover")}
                  onShare={() => setShowTeilen(true)}
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
            <Suspense fallback={<div style={{padding:"40px 20px",textAlign:"center",opacity:0.6,fontSize:13,
  color:"rgba(20,20,34,0.40)",animation:"huiFadeIn 0.5s ease"}}>Entdecken öffnet sich…</div>}>
              <SafeRender flag="discoverFeed" label="DiscoverPage">
                <DiscoverPage onView={w => setShowWirker(w)} onMap={() => setShowMap(true)}/>
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
          background:'rgba(249,247,244,0.85)',zIndex:8000,
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
                onView={w => setShowWirker(w)}
                onImpact={() => handleTab("impact")}
                onDiscover={() => handleTab("discover")}
              />
            </Suspense>
          </div>
        </div>

      </div>
      {/* ↑ overflow:hidden Container endet hier — BottomNav ist DRAUSSEN */}

      {/* ── BottomNav: AUSSERHALB des overflow:hidden Divs ─────────
          KRITISCH für iOS Safari: position:fixed Elements müssen
          außerhalb von overflow:hidden Parents stehen damit
          pointer-events korrekt funktionieren                      */}
      {/* BottomNav: hidden during membership + all fullscreen flows
          NEVER unmounted — just opacity:0 + translateY(120%) */}
      <BottomNav
        tab={tab}
        onTab={onTabPress}
        hasTalent={isTalent}
        orbActive={activeSurface === 'orb' || showMembership || showTalentFlow}
        navDrift={
          (showMembership || showTalentFlow)
            ? { opacity: 0, transform: "translateY(120%)",
                transition: "opacity 0.52s cubic-bezier(0.22,1,0.36,1), transform 0.52s cubic-bezier(0.22,1,0.36,1)",
                pointerEvents: "none" }
            : activeSurface ? worldTokens.navStyle : {}  /* Phase 16.3: no orbNavDrift parallel */
        }
        authProfile={authProfile}
        notifCount={liveNotifCount}
        msgCount={0}
        onOrbAction={(key) => {
          if (key !== "create") return;

          // Phase 15.3: Safe Opening Pipeline
          // RULE: overlay activation ONLY after content validation
          // RULE: never openOrbWorld() before canRenderOrbContent check

          const canRenderOrbContent = SAFE_MODE.orb;

          console.log("[HUI ORB] tap", {
            membershipType: isMember ? "member+" : "basis",
            canRenderOrbContent,
            isMember,
            isTalent,
          });

          // Basis-User: Membership-Journey (no blur needed)
          if (!isMember) {
            console.log("[HUI ORB] → membership flow");
            openSurface("membership");  // Phase 16.2
            setShowMembership(true);
            return;
          }

          // Member+: validate content renderable BEFORE activating any overlay
          if (!canRenderOrbContent) {
            // Ghost-State-Guard: SAFE_MODE.orb disabled
            // Do NOT open overlay — do NOT activate blur
            console.warn("[HUI ORB] canRenderOrbContent=false — orb disabled by SAFE_MODE, skip open");
            return;
          }

          // Phase 4B: ContentTypeSelector statt direktem Orb-Overlay
          // Mitglieder wählen zuerst den Content-Typ
          console.log("[HUI ORB] → ContentTypeSelector öffnen (Phase 4B)");
          setShowContentSelector(true);
        }}
      />

      {/* ── Overlay Layer ──────────────────────────────────────── */}
      <ProfileLauncher/>

      {/* ── Connection Create ───────────────────────────────────── */}
      {showConnect && SAFE_MODE.connectFlow && (
        <SafeRender flag="connectFlow" label="ConnectionCreatePage">
          <ConnectionCreatePage
            onClose={() => setShowConnect(false)}
            onPublish={() => setShowConnect(false)}
          />
        </SafeRender>
      )}

      {/* ── Teilen Flow ─────────────────────────────────────────── */}
      {showTeilen && SAFE_MODE.teilenFlow && (
        <SafeRender flag="teilenFlow" label="TeilenFlow">
          <TeilenFlow
            onClose={() => setShowTeilen(false)}
            onPublished={() => setShowTeilen(false)}
          />
        </SafeRender>
      )}

      {/* ── HUI Resonanz Center ─────────────────────────────────── */}
      {showChat && SAFE_MODE.chatCenter && (
        <SafeRender flag="chatCenter" label="ChatCenterOverlay">
          <ChatCenterOverlay
            onClose={() => {
              setShowChat(false);
              setChatRecipient(null);
              // Phase 2 LOOP 1: Return zum Profil wenn Chat vom Profil aus kam
              const returnProfile = flow.getReturnProfile();
              if (returnProfile) {
                flow.clearReturnProfile();
                setTimeout(() => setShowWirker(returnProfile), 80);
              }
            }}
            initialRecipient={chatRecipient}
            onDiscoverClose={() => {
              setShowChat(false);
              setChatRecipient(null);
              flow.clearReturnProfile(); // kein Return bei Discover-Navigate
              handleTab("discover");   // Phase 23: Chat leer → Discover
            }}
          />
        </SafeRender>
      )}

      <Suspense fallback={<div style={{
          position:'fixed',inset:0,display:'flex',
          alignItems:'center',justifyContent:'center',
          background:'rgba(249,247,244,0.85)',zIndex:8000,
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
              onView={w => { setShowWirker(w); setShowMap(false); }}
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
              onView={w => { setShowWirker(w); setShowMatch(false); }}
            />
          </SafeRender>
        )}
        {/* Phase 16.3: HuiPlusSheet ALWAYS mounted — visible prop controls render */}
        {SAFE_MODE.orb && (
          <SafeRender flag="orb" label="HuiPlusSheet/OrbSystem"
            onError={() => {
              console.warn("[WORLD SURFACE] SafeRender.onError → forceRecoverWorld");
              forceRecoverWorld("safe-render-error");
              setShowPlusSheet(false);
              closeOrbWorld("error");
            }}
          >
            <HuiPlusSheet
            isTalent={isTalent}
            visible={showPlusSheet}
            onMounted={() => {
              console.log("[ORB] mounted");
              confirmSurface("orb");
              console.log("[ORB] confirmSurface fired");
            }}
            onClose={() => {
              console.log("[ORB] close — resurfacing world");
              setShowPlusSheet(false);
              closeSurface("orb", "user-close");
              closeOrbWorld("user-close");
            }}
            onSelect={(rawType) => {
              // TIMING FIX: kein setShowPlusSheet(false) hier —
              // HuiPlusSheet ruft onClose() selbst auf (synchron, vor RAF).
              // onSelect kommt per requestAnimationFrame NACH dem Unmount.
              // safeOrbAction: gibt null zurück wenn type ungültig/leer
              const type = safeOrbAction(rawType);
              if (!type) {
                console.warn("[HUI_ORB] onSelect: ungültiger type ignoriert:", rawType);
                return; // kein crash, kein Flow, stille Rückkehr
              }
              // ── Teilen ──────────────────────────────────────────
              if (type === "teilen" || type === "story" || type === "moment" ||
                  type === "thought") {
                setShowTeilen(true);
              // ── Werk erschaffen ──────────────────────────────────
              } else if (type === "werk" ||
                         type === "kunstwerk" || type === "handwerk" ||
                         type === "design"    || type === "digital"  ||
                         type === "sammler") {
                setShowWerkPublisher(true);
              // ── Erlebnis öffnen ──────────────────────────────────
              } else if (type === "experience" || type === "erlebnis" ||
                         type === "workshop"   || type === "retreat"  ||
                         type === "event"      || type === "session"  ||
                         type === "erlebnis_s" || type === "veranstaltung") {
                setShowExperienceCreator(true);
              // ── Verbindung ───────────────────────────────────────
              } else if (type === "connect" || type === "connection" ||
                         type === "kollab"  || type === "mentor"  ||
                         type === "partner" || type === "community") {
                setShowConnect(true);
              // ── Wirker werden ────────────────────────────────────
              } else if (type === "wirker" || type === "membership") {
                setShowTalentFlow(true);
              // ── Impact / Wirkung starten ────────────────────────
              } else if (type === "impact" || type === "idee" ||
                         type === "projekt" ||
                         type === "wirkraum" || type === "einreich" ||
                         type === "wirkung") {
                setShowImpactFlow(true);
              // ── Create ──────────────────────────────────────────
              } else if (type === "create") {
                setShowCreateFlow(true);
              }
            }}
            />
          </SafeRender>
        )}
        {showTalentFlow && SAFE_MODE.talentFlow && (
          <SafeRender flag="talentFlow" label="TalentOnboarding">
            <TalentOnboarding
              onClose={() => setShowTalentFlow(false)}
              onSuccess={() => setShowTalentFlow(false)}
            />
          </SafeRender>
        )}
        {showStoryComposer && SAFE_MODE.storyComposer && (
          <SafeRender flag="storyComposer" label="StoryComposer">
            <StoryComposer
              onClose={() => setShowStoryComposer(false)}
              onPublished={() => setShowStoryComposer(false)}
            />
          </SafeRender>
        )}
        {showWerkPublisher && SAFE_MODE.werkFlow && (
          <SafeRender flag="werkFlow" label="WorkFlow">
            <WorkFlow
              onClose={() => setShowWerkPublisher(false)}
              onPublished={() => setShowWerkPublisher(false)}
            />
          </SafeRender>
        )}
        {showExperienceCreator && SAFE_MODE.experienceFlow && (
          <SafeRender flag="experienceFlow" label="ExperienceFlow">
            <ExperienceFlow
              onClose={() => setShowExperienceCreator(false)}
            />
          </SafeRender>
        )}
        {showNotifs && SAFE_MODE.notifications && (
          <SafeRender flag="notifications" label="NotificationCenter">
            <NotificationCenter
              onClose={() => setShowNotifs(false)}
              onNavigate={(target) => {
                // Phase 23: echte Navigation aus Notifications heraus
                setShowNotifs(false);
                if (!target) return;

                // String-Shortcuts
                if (target === "chat")    { setShowChat(true); return; }
                if (target === "impact")  { handleTab("impact"); return; }
                if (target === "feed")    { handleTab("home"); return; }
                if (target === "discover"){ handleTab("discover"); return; }

                // Objekt: { type, id, ... }
                if (typeof target === "object") {
                  if (target.type === "chat" && target.recipientId) {
                    setChatRecipient({
                      id:           target.recipientId,
                      display_name: target.recipientName || "Creator",
                      avatar_url:   target.recipientAvatar || null,
                    });
                    setShowChat(true);
                    return;
                  }
                  if (target.type === "profile" && target.userId) {
                    setShowWirker({ id: target.userId, user_id: target.userId });
                    return;
                  }
                  if (target.type === "impact") {
                    handleTab("impact");
                    return;
                  }
                }
              }}
            />
          </SafeRender>
        )}
        {showMembership && SAFE_MODE.membership && (
          <SafeRender flag="membership" label="HuiMembershipFlow">
            <HuiMembershipFlow
              onClose={() => {
                closeSurface("membership", "user-close");  // Phase 16.2
                cleanupOrbEnvironment({ reason: "membership-close" });
                setShowMembership(false);
              }}
              onComplete={() => {
                // Phase 15.2: cleanup → close Orb world → close modal
                closeSurface("membership", "complete");  // Phase 16.2
                cleanupOrbEnvironment({ reason: "membership-complete" });
                closeOrbWorld("membership-complete");
                setShowMembership(false);
              }}
            />
          </SafeRender>
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
      {showContentSelector && (
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
          <StoryViewer story={activeStory} onClose={() => setActiveStory(null)}/>
        </SafeRender>
      )}

      {/* Phase 16.4: World Surface + Tab Debug — tree-shaken in prod */}
      {process.env.NODE_ENV !== "production" && (
        <div style={{
          position:"fixed", top:8, right:8, zIndex:99999,
          background:"rgba(0,0,0,0.88)", backdropFilter:"blur(10px)",
          borderRadius:11, padding:"9px 13px", fontSize:10.5,
          fontFamily:"monospace", color:"#fff", lineHeight:1.75,
          pointerEvents:"none", userSelect:"none",
          border:"1px solid rgba(255,255,255,0.15)",
          minWidth:200,
        }}>
          <div style={{ color:HUI.COLOR.teal, fontWeight:700, marginBottom:3, fontSize:11 }}>
            🌍 World Surface
          </div>
          <div>surface: <b style={{color: activeSurface ? HUI.COLOR.coral:"#aaa"}}>
            {activeSurface ?? "null"}
          </b></div>
          <div>confirmed: <b style={{color: worldState?.overlayConfirmed ? HUI.COLOR.teal:"#aaa"}}>
            {String(worldState?.overlayConfirmed ?? false)}
          </b></div>
          <div>navLocked: <b style={{color: worldState?.navLocked ? HUI.COLOR.coral:"#aaa"}}>
            {String(worldState?.navLocked ?? false)}
          </b></div>
          <div>sheet: <b style={{color: showPlusSheet ? HUI.COLOR.coral:"#aaa"}}>
            {String(showPlusSheet)}
          </b></div>

          <div style={{ borderTop:"1px solid rgba(255,255,255,0.12)", margin:"5px 0 3px" }} />
          <div style={{ color:"#a8d8cf", fontWeight:700, marginBottom:2 }}>📋 Tabs</div>
          <div>activeTab: <b style={{color:HUI.COLOR.teal}}>{tab}</b></div>
          <div>feed op: <b style={{color: keepFeed?.opacity === 1 ? HUI.COLOR.teal:HUI.COLOR.coral}}>
            {keepFeed?.opacity ?? "?"}
          </b></div>
          <div>impact op: <b style={{color: keepImpact?.opacity === 1 ? HUI.COLOR.teal:HUI.COLOR.coral}}>
            {keepImpact?.opacity ?? "?"}
          </b></div>
          <div>discover op: <b style={{color: keepDiscover?.opacity === 1 ? HUI.COLOR.teal:HUI.COLOR.coral}}>
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