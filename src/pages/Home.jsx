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
import HomeHeader                from "../components/home/header/HomeHeader.jsx";
import BottomNav                 from "../components/home/navigation/BottomNav.jsx";
import ProfileLauncher           from "../components/home/profile/ProfileLauncher.jsx";
import HomeFeed                  from "../components/HomeFeed.jsx";
import { StoryViewer }           from "../components/StoryBar.jsx";
import ChatCenterOverlay         from "../components/chat-center/ChatCenterOverlay.jsx";
import ConnectionCreatePage      from "../components/connection-create/ConnectionCreatePage.jsx";
// ── Tab-Pages: lazy → eigene Chunks, nur bei Bedarf geladen ────
const DiscoverPage   = React.lazy(() => import("./DiscoverPage.jsx"));
const ImpactPage     = React.lazy(() => import("./ImpactPage.jsx"));
const FavoritesPage  = React.lazy(() => import("./FavoritesPage.jsx"));
// ── Orb-Flows: lazy → nur bei Tap auf Orb-Node geladen ─────────
const TeilenFlow     = React.lazy(() => import("../components/teilen/TeilenFlow.jsx"));
const WorkFlow       = React.lazy(() => import("../system/flows/work/WorkFlow.jsx"));
const ExperienceFlow = React.lazy(() => import("../system/flows/experience/ExperienceFlow.jsx"));
const ImpactFlow     = React.lazy(() => import("../system/flows/impact/ImpactFlow.jsx"));

const NotificationCenter  = React.lazy(() => import("../components/NotificationCenter.jsx"));
const LiveMapPage         = React.lazy(() => import("./LiveMapPage.jsx"));
const HuiMatchOverlay     = React.lazy(() => import("../components/HuiMatchOverlay.jsx"));
const HuiPlusSheet        = React.lazy(() => import("../components/HuiPlusSheet.jsx"));
const HuiMembershipFlow   = React.lazy(() => import("../components/HuiMembershipFlow.jsx"));
const HuiCreateFlow       = React.lazy(() => import("../components/HuiCreateFlow.jsx"));
const TalentOnboarding    = React.lazy(() => import("../components/TalentOnboarding.jsx"));
const StoryComposer       = React.lazy(() => import("../components/StoryComposer.jsx"));
const ExperienceCreator   = React.lazy(() => import("../components/ExperienceCreator.jsx"));

const C = { cream: "#F9F6F2" };

const SAFE_MOTION_CSS = SAFE_MODE.motion ? '' : `
  /* SafeMode.motion=false: Alle Animationen deaktiviert */
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
`;

const GLOBAL_CSS = `
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  /* Safari Fix: overflow:hidden auf body bricht Layout-Viewport-Berechnung.
     Scroll-Lock läuft über #root + Feed-Container, NICHT body. */
  #root { width: 100%; max-width: 100%; overflow-x: hidden; }
  .hui-scroll {
    scrollbar-width: none;
    -ms-overflow-style: none;
    -webkit-overflow-scrolling: touch;
  }
  .hui-scroll::-webkit-scrollbar { display: none; }
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
    activeStory,       setActiveStory,
  } = useHome();

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

  /* onTab: profile → openOwnProfile direkt, sonst handleTab */
  function onTabPress(key) {
    if (key === "profile") {
      openOwnProfile();
    } else {
      handleTab(key);
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
          onChat={() => {
            setShowChat(true);
          }}
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
            flex:        1,
            overflowY:   "auto",
            overflowX:   "hidden",
            position:    "relative",
            // Phase 16.4: scale-only atmospheric depth effect.
            // Opacity: NOT here (handled per tab by tabVisibilityController).
            // Blur:    NOT here (handled by dimStyle fixed overlay).
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
                  onComment={() => {}}
                  onPerson={(p) => setShowWirker(p)}
                />
              </SafeRender>
            ) : (
              <div style={{ padding: "40px 24px", textAlign: "center", color: "#999", fontSize: 14 }}>
                Feed lädt…
              </div>
            )}
          </div>

          {/* Phase 16.8.3: individueller Suspense pro lazy Tab — kein shared fallback-block */}
          <div ref={tabRefs.discover} style={{
            ...keepDiscover,
            opacity: tab === "discover" ? 1 : keepDiscover?.opacity ?? 0,
            pointerEvents: tab === "discover" ? "auto" : keepDiscover?.pointerEvents ?? "none",
          }}>
            <Suspense fallback={null}>
              <SafeRender flag="discoverFeed" label="DiscoverPage">
                <DiscoverPage onView={w => setShowWirker(w)} onMap={() => setShowMap(true)}/>
              </SafeRender>
            </Suspense>
          </div>

          <div ref={tabRefs.impact} style={{
            ...keepImpact,
            opacity: tab === "impact" ? 1 : keepImpact?.opacity ?? 0,
            pointerEvents: tab === "impact" ? "auto" : keepImpact?.pointerEvents ?? "none",
          }}>
            <Suspense fallback={null}>
              <SafeRender flag="impactPage" label="ImpactPage">
                <ImpactPage currentUser={currentUser}/>
              </SafeRender>
            </Suspense>
          </div>

          <div ref={tabRefs.favorites} style={keepFavorites}>
            <Suspense fallback={null}>
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

          // Validated: open world layer + mount orb content atomically
          console.log("[HUI ORB] → opening orb world (member)");
          openSurface("orb");  // Phase 16.2: WorldSurface authority — blur after confirmation
          openOrbWorld({
            source:           "orb-button",
            originTab:        tab,
            worldTemperature: "calm_flowing",
          });
          setShowPlusSheet(true);
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
            onClose={() => setShowChat(false)}
          />
        </SafeRender>
      )}

      <Suspense fallback={null}>
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
            onSelect={(type) => {
              // TIMING FIX: kein setShowPlusSheet(false) hier —
              // HuiPlusSheet ruft onClose() selbst auf (synchron, vor RAF).
              // onSelect kommt per requestAnimationFrame NACH dem Unmount.
              // Wir setzen hier nur den Ziel-Flow-State.
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
                         type === "erlebnis_s") {
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
        )}}
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
              onNavigate={() => setShowNotifs(false)}
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
          <div style={{ color:"#a8d8cf", fontWeight:700, marginBottom:2 }}>📋 Tabs</div>
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