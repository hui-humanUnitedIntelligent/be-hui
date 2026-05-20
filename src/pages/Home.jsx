// src/pages/Home.jsx — HUI Home Orchestrator v8
// SAFARI-FIX: BottomNav außerhalb overflow:hidden Container
// iOS Safari vererbt pointer-events von overflow:hidden auf position:fixed Kinder

import React, { Suspense } from "react";
import HomeShell, { useHome }   from "../components/home/HomeShell.jsx";
import HomeHeader                from "../components/home/header/HomeHeader.jsx";
import BottomNav                 from "../components/home/navigation/BottomNav.jsx";
import ProfileLauncher           from "../components/home/profile/ProfileLauncher.jsx";
import HomeFeed                  from "../components/HomeFeed.jsx";
import DiscoverPage              from "./DiscoverPage.jsx";
import ImpactPage                from "./ImpactPage.jsx";
import FavoritesPage             from "./FavoritesPage.jsx";
import { StoryViewer }           from "../components/StoryBar.jsx";
import ChatCenterOverlay from "../components/chat-center/ChatCenterOverlay.jsx";
import ConnectionCreatePage from "../components/connection-create/ConnectionCreatePage.jsx";
import TeilenFlow from "../components/teilen/TeilenFlow.jsx";

const NotificationCenter  = React.lazy(() => import("../components/NotificationCenter.jsx"));
const LiveMapPage         = React.lazy(() => import("./LiveMapPage.jsx"));
const HuiMatchOverlay     = React.lazy(() => import("../components/HuiMatchOverlay.jsx"));
const HuiPlusSheet        = React.lazy(() => import("../components/HuiPlusSheet.jsx"));
const HuiMembershipFlow   = React.lazy(() => import("../components/HuiMembershipFlow.jsx"));
const HuiCreateFlow       = React.lazy(() => import("../components/HuiCreateFlow.jsx"));
const TalentOnboarding    = React.lazy(() => import("../components/TalentOnboarding.jsx"));
const StoryComposer       = React.lazy(() => import("../components/StoryComposer.jsx"));
const WorkFlow            = React.lazy(() => import("../system/flows/work/WorkFlow.jsx"));
const ExperienceFlow      = React.lazy(() => import("../system/flows/experience/ExperienceFlow.jsx"));
const ExperienceCreator   = React.lazy(() => import("../components/ExperienceCreator.jsx"));

const C = { cream: "#F9F6F2" };

const GLOBAL_CSS = `
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; height: 100%; overflow: hidden; }
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
      <style>{GLOBAL_CSS}</style>

      {/* ── Haupt-Layout: KEIN overflow:hidden hier ────────────── */}
      {/* overflow:hidden würde in iOS Safari pointer-events auf    */}
      {/* position:fixed Kinder vererben → BottomNav tot           */}
      <div style={{
        height:          "100dvh",
        display:         "flex",
        flexDirection:   "column",
        background:      C.cream,
        position:        "relative",
        /* overflow:hidden BEWUSST WEGGELASSEN — Safari Fix */
      }}>

        {/* Header */}
        <HomeHeader
          activeMood={activeMood}
          onMoodSelect={setActiveMood}
          notifCount={liveNotifCount}
          msgCount={0}
          onNotif={() => setShowNotifs(true)}
          onChat={() => {
            console.log("[SET SHOW CHAT] true");
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
          </div>

          <div style={keepDiscover}>
            <DiscoverPage onView={w => setShowWirker(w)} onMap={() => setShowMap(true)}/>
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
          if (key === "create") setShowPlusSheet(true);
        }}
      />

      {/* ── Overlay Layer ──────────────────────────────────────── */}
      <ProfileLauncher/>

      {/* ── Connection Create ───────────────────────────────────── */}
      {showConnect && (
        <ConnectionCreatePage
          onClose={() => {
            console.log("[CONNECTION PAGE CLOSE]");
            setShowConnect(false);
          }}
          onPublish={() => setShowConnect(false)}
        />
      )}

      {/* ── Teilen Flow ─────────────────────────────────────────── */}
      {showTeilen && (
        <TeilenFlow
          onClose={() => setShowTeilen(false)}
          onPublished={() => setShowTeilen(false)}
        />
      )}

      {/* ── HUI Resonanz Center ─────────────────────────────────── */}
      {showChat && (
        <ChatCenterOverlay
          onClose={() => {
            console.log("[CHAT OVERLAY CLOSE]");
            setShowChat(false);
          }}
        />
      )}

      <Suspense fallback={null}>
        {showMap && (
          <LiveMapPage
            onView={w => { setShowWirker(w); setShowMap(false); }}
            onMatch={() => { setShowMatch(true); setShowMap(false); }}
            onClose={() => setShowMap(false)}
          />
        )}
        {showMatch && (
          <HuiMatchOverlay
            onClose={() => setShowMatch(false)}
            onMoodSelect={(m) => { setActiveMood(m); setShowMatch(false); }}
            onView={w => { setShowWirker(w); setShowMatch(false); }}
          />
        )}
        {showPlusSheet && (
          <HuiPlusSheet
            isTalent={isTalent}
            onClose={() => setShowPlusSheet(false)}
            onSelect={(type) => {
              // TIMING FIX: kein setShowPlusSheet(false) hier —
              // HuiPlusSheet ruft onClose() selbst auf (synchron, vor RAF).
              // onSelect kommt per requestAnimationFrame NACH dem Unmount.
              // Wir setzen hier nur den Ziel-Flow-State.
              console.log("[HOME onSelect]", type);
              if (type === "moment" || type === "story" || type === "teilen") {
                setShowTeilen(true);
              } else if (type === "werk") {
                setShowWerkPublisher(true);
              } else if (type === "erlebnis") {
                setShowExperienceCreator(true);
              } else if (type === "wirker") {
                setShowTalentFlow(true);
              } else if (type === "create") {
                setShowCreateFlow(true);
              } else if (type === "connect" || type === "kollab" ||
                         type === "mentor"  || type === "partner") {
                setShowConnect(true);
              }
            }}
          />
        )}
        {showTalentFlow && (
          <TalentOnboarding
            onClose={() => setShowTalentFlow(false)}
            onSuccess={() => setShowTalentFlow(false)}
          />
        )}
        {showStoryComposer && (
          <StoryComposer
            onClose={() => setShowStoryComposer(false)}
            onPublished={() => setShowStoryComposer(false)}
          />
        )}
        {showWerkPublisher && (
          <WorkFlow
            onClose={() => setShowWerkPublisher(false)}
            onPublished={() => setShowWerkPublisher(false)}
          />
        )}
        {showExperienceCreator && (
          <ExperienceFlow
            onClose={() => setShowExperienceCreator(false)}
          />
        )}
        {showNotifs && (
          <NotificationCenter
            onClose={() => setShowNotifs(false)}
            onNavigate={() => setShowNotifs(false)}
          />
        )}
        {showMembership && (
          <HuiMembershipFlow
            onClose={() => setShowMembership(false)}
            onSuccess={() => setShowMembership(false)}
          />
        )}
        {showCreateFlow && (
          <HuiCreateFlow onClose={() => setShowCreateFlow(false)}/>
        )}
      </Suspense>

      {activeStory && (
        <StoryViewer story={activeStory} onClose={() => setActiveStory(null)}/>
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