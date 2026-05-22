// src/pages/Home.jsx — HUI Home Orchestrator v8
// SAFARI-FIX: BottomNav außerhalb overflow:hidden Container
// iOS Safari vererbt pointer-events von overflow:hidden auf position:fixed Kinder

import React, { Suspense } from "react";
import { SAFE_MODE } from "../config/safeMode.js";
import { SafeRender } from "../config/SafeRender.jsx";
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

        {/* Scroll-Bereich */}
        <div
          className="hui-scroll"
          ref={mainScrollRef}
          style={{
            flex:       1,
            overflowY:  "auto",
            overflowX:  "hidden",
            /* Kein overflow:hidden am Wrapper */
          }}
        >
          <div style={keepFeed}>
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

          <div style={keepDiscover}>
            <SafeRender flag="discoverFeed" label="DiscoverPage">
              <DiscoverPage onView={w => setShowWirker(w)} onMap={() => setShowMap(true)}/>
            </SafeRender>
          </div>

          <div style={keepImpact}>
            <ImpactPage currentUser={currentUser}/>
          </div>

          <div style={keepFavorites}>
            <FavoritesPage
              currentUser={currentUser}
              onView={w => setShowWirker(w)}
              onImpact={() => handleTab("impact")}
              onDiscover={() => handleTab("discover")}
            />
          </div>
        </div>

      </div>
      {/* ↑ overflow:hidden Container endet hier — BottomNav ist DRAUSSEN */}

      {/* ── BottomNav: AUSSERHALB des overflow:hidden Divs ─────────
          KRITISCH für iOS Safari: position:fixed Elements müssen
          außerhalb von overflow:hidden Parents stehen damit
          pointer-events korrekt funktionieren                      */}
      <BottomNav
        tab={tab}
        onTab={onTabPress}
        hasTalent={isTalent}
        orbActive={showPlusSheet}
        authProfile={authProfile}
        notifCount={liveNotifCount}
        msgCount={0}
        onOrbAction={(key) => {
          if (key !== "create") return;
          // Basis-User (nicht Mitglied): Membership-Journey starten
          if (!isMember) {
            setShowMembership(true);
            return;
          }
          // Mitglied: echter Orb öffnet sich
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
        {showPlusSheet && SAFE_MODE.orb && (
          <SafeRender flag="orb" label="HuiPlusSheet/OrbSystem">
            <HuiPlusSheet
            isTalent={isTalent}
            onClose={() => setShowPlusSheet(false)}
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
              onNavigate={() => setShowNotifs(false)}
            />
          </SafeRender>
        )}
        {showMembership && SAFE_MODE.membership && (
          <SafeRender flag="membership" label="HuiMembershipFlow">
            <HuiMembershipFlow
              onClose={() => setShowMembership(false)}
              onComplete={() => {
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