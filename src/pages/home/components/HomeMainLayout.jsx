import React from "react";
import HomeHeader from "../../../components/home/header/HomeHeader.jsx";
import HUIBottomNavigation from "../../../components/home/navigation/HUIBottomNavigation.jsx";
import { C } from "../tokens/homeTokens.js";
import { HomeFeedTab } from "./HomeFeedTab.jsx";
import { HomeDiscoverTab } from "./HomeDiscoverTab.jsx";
import { HomeImpactTab } from "./HomeImpactTab.jsx";
import { HomeFavoritesTab } from "./HomeFavoritesTab.jsx";

export function HomeMainLayout({
  activeMood,
  setActiveMood,
  liveNotifCount,
  unreadTotal,
  currentUser,
  setShowNotifs,
  setSearchState,
  worldTokens,
  mainScrollRef,
  scrollContainerRef,
  tabRefs,
  orbTransition,
  keepFeed,
  keepDiscover,
  keepImpact,
  keepFavorites,
  feedHandlers,
  searchState,
  showTalentFlow,
  setShowTalentFlow,
  openProfileById,
  setShowMap,
  setShowBookingFlow,
  handleTab,
  tab,
  onTabPress,
  showCreatorDashboard,
  isTalent,
  activeSurface,
  showMembership,
  showPlusSheet,
  authProfile,
  onOrbAction,
}) {
  return (
    <div style={{
      height: "100dvh",
      display: "flex",
      flexDirection: "column",
      background: C.cream,
      position: "relative",
      width: "100%",
      maxWidth: "100%",
      overflowX: "hidden",
    }}>
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

      <div
        style={{
          ...worldTokens.dimStyle,
          zIndex: 8985,
        }}
        aria-hidden="true"
      />

      <div
        className="hui-scroll"
        ref={(el) => { mainScrollRef.current = el; scrollContainerRef.current = el; }}
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          position: "relative",
          overscrollBehavior: "contain",
          WebkitOverflowScrolling: "touch",
          filter: (orbTransition === "exiting" || orbTransition === "hidden")
            ? "blur(3px) brightness(0.96)"
            : "none",
          transition: "background-color 320ms cubic-bezier(0.16,1,0.30,1), filter 0.3s ease-in-out",
          ...worldTokens.feedContainerStyle,
        }}
      >
        <HomeFeedTab
          tabRef={tabRefs.feed}
          keepFeed={keepFeed}
          feedHandlers={feedHandlers}
          currentUser={currentUser}
          searchState={searchState}
        />

        <HomeDiscoverTab
          tabRef={tabRefs.discover}
          keepDiscover={keepDiscover}
          showTalentFlow={showTalentFlow}
          setShowTalentFlow={setShowTalentFlow}
          openProfileById={openProfileById}
          setShowMap={setShowMap}
          setShowBookingFlow={setShowBookingFlow}
        />

        <HomeImpactTab
          tabRef={tabRefs.impact}
          keepImpact={keepImpact}
          currentUser={currentUser}
        />

        <HomeFavoritesTab
          tabRef={tabRefs.favorites}
          keepFavorites={keepFavorites}
          currentUser={currentUser}
          openProfileById={openProfileById}
          handleTab={handleTab}
        />
      </div>

      <HUIBottomNavigation
        tab={tab}
        onTab={onTabPress}
        creatorOpen={showCreatorDashboard}
        hasTalent={isTalent}
        orbActive={activeSurface === 'orb' || showMembership || showTalentFlow}
        orbTransition={showPlusSheet ? "hidden" : orbTransition}
        navDrift={
          (showMembership || showTalentFlow)
            ? {
                opacity: 0,
                transform: "translateY(120%)",
                transition: "opacity 0.52s cubic-bezier(0.22,1,0.36,1), transform 0.52s cubic-bezier(0.22,1,0.36,1)",
                pointerEvents: "none",
              }
            : activeSurface ? worldTokens.navStyle : {}
        }
        authProfile={authProfile}
        notifCount={liveNotifCount}
        msgCount={unreadTotal}
        onOrbAction={onOrbAction}
      />
    </div>
  );
}
