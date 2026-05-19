// src/pages/Home.jsx — HUI Home Orchestrator v7
// Profil-Button: direkte Verdrahtung, kein Context-Indirektions-Bug

import React, { Suspense } from "react";
import HomeShell, { useHome }   from "../components/home/HomeShell.jsx";
import HomeHeader                from "../components/home/header/HomeHeader.jsx";
import BottomNav                 from "../components/home/navigation/BottomNav.jsx";
import ProfileLauncher           from "../components/home/profile/ProfileLauncher.jsx";
import HomeFeed                  from "../components/HomeFeed.jsx";
import DiscoverPage              from "./DiscoverPage.jsx";
import ChatPage                  from "../components/ChatPage.jsx";
import ImpactPage                from "./ImpactPage.jsx";
import FavoritesPage             from "./FavoritesPage.jsx";
import { StoryViewer }           from "../components/StoryBar.jsx";

/* Lazy Overlays */
const NotificationCenter  = React.lazy(() => import("../components/NotificationCenter.jsx"));
const LiveMapPage         = React.lazy(() => import("./LiveMapPage.jsx"));
const HuiMatchOverlay     = React.lazy(() => import("../components/HuiMatchOverlay.jsx"));
const HuiPlusSheet        = React.lazy(() => import("../components/HuiPlusSheet.jsx"));
const HuiMembershipFlow   = React.lazy(() => import("../components/HuiMembershipFlow.jsx"));
const HuiCreateFlow       = React.lazy(() => import("../components/HuiCreateFlow.jsx"));
const TalentOnboarding    = React.lazy(() => import("../components/TalentOnboarding.jsx"));
const StoryComposer       = React.lazy(() => import("../components/StoryComposer.jsx"));
const WerkPublisher       = React.lazy(() => import("../components/WerkPublisher.jsx"));
const ExperienceCreator   = React.lazy(() => import("../components/ExperienceCreator.jsx"));

const C = { cream: "#F9F6F2" };
const GLOBAL_CSS = `
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; height: 100%; overflow: hidden; }
  .hui-scroll { scrollbar-width: none; -ms-overflow-style: none; }
  .hui-scroll::-webkit-scrollbar { display: none; }
`;

/* ══════════════════════════════════════════════════════════════ */
function HomeInner() {
  const {
    tab,
    handleTab,
    openOwnProfile,
    mainScrollRef,
    keepFeed, keepDiscover, keepChat, keepImpact, keepFavorites,
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
    showTalentFlow,    setShowTalentFlow,
    showStoryComposer, setShowStoryComposer,
    showWerkPublisher, setShowWerkPublisher,
    showExperienceCreator, setShowExperienceCreator,
    activeStory,       setActiveStory,
  } = useHome();

  /* onTab-Handler: profile → direkt openOwnProfile, rest → handleTab */
  function onTabPress(key) {
    console.log("[HUI-HOME] onTabPress:", key);
    if (key === "profile") {
      console.log("[HUI-HOME] -> openOwnProfile()");
      openOwnProfile();
    } else {
      handleTab(key);
    }
  }

  return (
    <>
      <style>{GLOBAL_CSS}</style>

      <div style={{
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: C.cream,
        position: "relative",
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

        {/* Scroll-Bereich */}
        <div
          className="hui-scroll"
          ref={mainScrollRef}
          style={{ flex: 1, overflowY: "auto", overflowX: "hidden",
            WebkitOverflowScrolling: "touch" }}
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

          <div style={keepChat}>
            <ChatPage onClose={() => handleTab("feed")}/>
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

        {/* Bottom Nav — onTab direkt verdrahtet */}
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
      </div>

      {/* ── Overlay Layer ──────────────────────────────────────── */}

      {/* PROFIL: ProfileLauncher liest showWirker aus Context */}
      <ProfileLauncher/>

      {/* Alle anderen Overlays in Suspense */}
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
              setShowPlusSheet(false);
              if (type === "moment")      setShowStoryComposer(true);
              else if (type === "werk")   setShowWerkPublisher(true);
              else if (type === "erlebnis") setShowExperienceCreator(true);
              else if (type === "wirker") setShowTalentFlow(true);
              else if (type === "create") setShowCreateFlow(true);
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
          <WerkPublisher
            onClose={() => setShowWerkPublisher(false)}
            onPublished={() => setShowWerkPublisher(false)}
          />
        )}

        {showExperienceCreator && (
          <ExperienceCreator
            onClose={() => setShowExperienceCreator(false)}
            onPublished={() => setShowExperienceCreator(false)}
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

      {/* StoryViewer — kein lazy nötig */}
      {activeStory && (
        <StoryViewer story={activeStory} onClose={() => setActiveStory(null)}/>
      )}
    </>
  );
}

/* Root Export */
export default function Home() {
  return (
    <HomeShell>
      <HomeInner/>
    </HomeShell>
  );
}
