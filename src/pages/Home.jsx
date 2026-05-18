// src/pages/Home.jsx — HUI Home Orchestrator v6
// KEIN Business-Logik. NUR Komposition.
// Alle States → HomeShell (Context)
// Alle Sub-Systeme → dedizierte Komponenten

import React, { useState, Suspense } from "react";
import { useAuth }             from "../lib/AuthContext";

// ── Shell + Context ──────────────────────────────────────────────
import HomeShell, { useHome }  from "../components/home/HomeShell.jsx";

// ── Header ──────────────────────────────────────────────────────
import HomeHeader              from "../components/home/header/HomeHeader.jsx";

// ── Navigation ──────────────────────────────────────────────────
import BottomNav               from "../components/home/navigation/BottomNav.jsx";

// ── Seiten (Keep-Alive) ──────────────────────────────────────────
import HomeFeed                from "../components/HomeFeed.jsx";
import DiscoverPage            from "./DiscoverPage.jsx";
import ChatPage                from "../components/ChatPage.jsx";
import ImpactPage              from "./ImpactPage.jsx";
import FavoritesPage           from "./FavoritesPage.jsx";

// ── Overlays / Lazy ──────────────────────────────────────────────
const WirkerProfilePage     = React.lazy(() => import("./wirker-profile/index.jsx"));
const ProfilePage           = React.lazy(() => import("./ProfilePage.jsx"));
const NotificationCenter    = React.lazy(() => import("../components/NotificationCenter.jsx"));
const ChatPageOverlay       = React.lazy(() => import("../components/ChatPage.jsx"));
const LiveMapPage           = React.lazy(() => import("./LiveMapPage.jsx"));
const HuiMatchOverlay       = React.lazy(() => import("../components/HuiMatchOverlay.jsx"));
const HuiPlusSheet          = React.lazy(() => import("../components/HuiPlusSheet.jsx"));
const HuiMembershipFlow     = React.lazy(() => import("../components/HuiMembershipFlow.jsx"));
const HuiCreateFlow         = React.lazy(() => import("../components/HuiCreateFlow.jsx"));
const TalentOnboarding      = React.lazy(() => import("../components/TalentOnboarding.jsx"));
const StoryComposer         = React.lazy(() => import("../components/StoryComposer.jsx"));
const WerkPublisher         = React.lazy(() => import("../components/WerkPublisher.jsx"));
const ExperienceCreator     = React.lazy(() => import("../components/ExperienceCreator.jsx"));
const { WerkDetail, WerkCheckout } = { WerkDetail: null, WerkCheckout: null }; // Lazy via WerkeShop
import { StoryBar, StoryViewer }   from "../components/StoryBar.jsx";

// ── Design Token ────────────────────────────────────────────────
const C = { cream:"#F9F6F2" };

const GLOBAL_CSS = `
  * { box-sizing: border-box; }
  html, body { margin:0; padding:0; height:100%; overflow:hidden; }
  .hui-scroll { scrollbar-width: none; -ms-overflow-style: none; }
  .hui-scroll::-webkit-scrollbar { display: none; }
`;

// ══════════════════════════════════════════════════════════════════
// HomeInner — liest aus HomeShell-Context, kein State-Management
// ══════════════════════════════════════════════════════════════════
function HomeInner() {
  const {
    // Auth
    user, authProfile, isTalent, currentUser, userName,
    // Tab
    tab, handleTab, mainScrollRef,
    keepFeed, keepDiscover, keepChat, keepImpact, keepFavorites,
    // Mood
    activeMood, setActiveMood,
    // Notif
    liveNotifCount,
    // Overlays
    showWirker,       setShowWirker,
    showChat,         setShowChat,
    showNotifs,       setShowNotifs,
    showProfile,      setShowProfile,
    showMap,          setShowMap,
    showMatch,        setShowMatch,
    showMembership,   setShowMembership,
    showPlusSheet,    setShowPlusSheet,
    showCreateFlow,   setShowCreateFlow,
    showTalentFlow,   setShowTalentFlow,
    showStoryComposer,setShowStoryComposer,
    showWerkPublisher,setShowWerkPublisher,
    showExperienceCreator, setShowExperienceCreator,
    showWerkDetail,   setShowWerkDetail,
    showWerkCheckout, setShowWerkCheckout,
    activeStory,      setActiveStory,
    cart,             setCart,
  } = useHome();

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{
        height:"100dvh", display:"flex",
        flexDirection:"column", overflow:"hidden",
        background: C.cream,
      }}>

        {/* ── HEADER ─────────────────────────────────────── */}
        <HomeHeader
          activeMood={activeMood}
          onMoodSelect={setActiveMood}
          notifCount={liveNotifCount}
          msgCount={0}
          onNotif={() => setShowNotifs(true)}
          onChat={() => setShowChat(true)}
        />

        {/* ── KEEP-ALIVE SCROLL AREA ─────────────────────── */}
        <div className="hui-scroll" ref={mainScrollRef}
          style={{ flex:1, overflowY:"auto", overflowX:"hidden",
            WebkitOverflowScrolling:"touch" }}>

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
            <DiscoverPage
              onView={w => setShowWirker(w)}
              onMap={() => setShowMap(true)}
            />
          </div>

          <div style={keepChat}>
            <ChatPage onClose={() => handleTab("feed")} />
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

        {/* ── BOTTOM NAV ─────────────────────────────────── */}
        <BottomNav
          tab={tab}
          onTab={handleTab}
          hasTalent={isTalent}
          orbActive={showPlusSheet}
          authProfile={authProfile}
          notifCount={liveNotifCount}
          msgCount={0}
          onOrbAction={(key) => {
            if (key === "create") {
              setShowPlusSheet(true);
            }
          }}
        />
      </div>

      {/* ══════════════════════════════════════════════════
          OVERLAY LAYER — alle floating Sheets/Pages
          ══════════════════════════════════════════════════ */}
      <Suspense fallback={null}>

        {/* Wirker / Profil */}
        {showWirker && (
          <WirkerProfilePage
            wirker={showWirker}
            onClose={() => setShowWirker(null)}
            onBook={() => {}}
          />
        )}

        {/* Map */}
        {showMap && (
          <LiveMapPage
            onView={w => { setShowWirker(w); setShowMap(false); }}
            onMatch={() => { setShowMatch(true); setShowMap(false); }}
            onClose={() => setShowMap(false)}
          />
        )}

        {/* Match Overlay */}
        {showMatch && (
          <HuiMatchOverlay
            onClose={() => setShowMatch(false)}
            onMoodSelect={(m) => { setActiveMood(m); setShowMatch(false); }}
            onView={w => { setShowWirker(w); setShowMatch(false); }}
          />
        )}

        {/* Plus Sheet / Create */}
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

        {/* Talent Onboarding */}
        {showTalentFlow && (
          <TalentOnboarding
            onClose={() => setShowTalentFlow(false)}
            onSuccess={() => { setShowTalentFlow(false); }}
          />
        )}

        {/* Story Composer */}
        {showStoryComposer && (
          <StoryComposer
            onClose={() => setShowStoryComposer(false)}
            onPublished={() => setShowStoryComposer(false)}
          />
        )}

        {/* Werk Publisher */}
        {showWerkPublisher && (
          <WerkPublisher
            onClose={() => setShowWerkPublisher(false)}
            onPublished={() => setShowWerkPublisher(false)}
          />
        )}

        {/* Experience Creator */}
        {showExperienceCreator && (
          <ExperienceCreator
            onClose={() => setShowExperienceCreator(false)}
            onPublished={() => setShowExperienceCreator(false)}
          />
        )}

        {/* Notifications */}
        {showNotifs && (
          <NotificationCenter
            onClose={() => setShowNotifs(false)}
            onNavigate={() => setShowNotifs(false)}
          />
        )}

        {/* Membership */}
        {showMembership && (
          <HuiMembershipFlow
            onClose={() => setShowMembership(false)}
            onSuccess={() => setShowMembership(false)}
          />
        )}

        {/* Create Flow */}
        {showCreateFlow && (
          <HuiCreateFlow
            onClose={() => setShowCreateFlow(false)}
          />
        )}

        {/* Profile Fallback */}
        {showProfile && (
          <ProfilePage onClose={() => setShowProfile(false)}/>
        )}

        {/* Story Viewer */}
        {activeStory && (
          <StoryViewer
            story={activeStory}
            onClose={() => setActiveStory(null)}
          />
        )}

      </Suspense>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════
// Home — Root Export: Shell wraps Inner
// ══════════════════════════════════════════════════════════════════
export default function Home() {
  return (
    <HomeShell>
      <HomeInner/>
    </HomeShell>
  );
}
