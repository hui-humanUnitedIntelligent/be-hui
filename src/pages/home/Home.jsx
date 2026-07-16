// src/pages/home/HomeInner.jsx — Home Runtime Orchestrator
import React, { useEffect, useCallback, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useOrbWorld } from "../../context/OrbWorldContext.jsx";
import { useWorldSurface } from "../../context/WorldSurfaceContext.jsx";
import HomeShell, { useHome } from "../../components/home/HomeShell.jsx";
import { useHuiFlow } from "../../core/hui.flow.js";
import { usePresence } from "../../lib/usePresence.js";
import { useChatList } from "../../lib/chatContext.js";
import { useContentPreview } from "../../context/ContentPreviewContext.jsx";
import { SAFE_MODE } from "../../config/safeMode.js";

import { HomeStyles } from "./components/HomeStyles.jsx";
import { HomeMainLayout } from "./components/HomeMainLayout.jsx";
import { HomeDevDebug } from "./components/HomeDevDebug.jsx";
import { HomeCommerceOverlays } from "./overlays/HomeCommerceOverlays.jsx";
import { HomeFlowOverlays } from "./overlays/HomeFlowOverlays.jsx";
import { HomeContentOverlays } from "./dialogs/HomeContentOverlays.jsx";

import { createCloseMeinHuiCinematic, createOrbOpenHandler } from "./utils/orbTransition.js";
import { bindFeedRefreshListener, bindNavigateTabListener } from "./runtime/homeEventListeners.js";
import { registerHomeWindowGlobals, unregisterHomeWindowGlobals } from "./runtime/windowGlobals.js";
import { applyPendingWerkKauf } from "./runtime/pendingWerkRedirect.js";
import { runSafariPaintRecoveryOnSurfaceClose } from "./runtime/safariPaintRecovery.js";
import { PaintRecoveryManager } from "../../lib/world/safariPaintRecovery.js";
import { createFeedHandlers } from "./handlers/feedHandlers.js";

export function HomeInner() {
  const navigate = useNavigate();
  const tabRefs = {
    feed:      React.useRef(null),
    discover:  React.useRef(null),
    impact:    React.useRef(null),
    favorites: React.useRef(null),
  };
  const scrollContainerRef = React.useRef(null);
  const feedRefreshRef = React.useRef(null);

  React.useEffect(() => bindFeedRefreshListener(feedRefreshRef), []);

  const paintManager = React.useRef(new PaintRecoveryManager());

  const [orbTransition, setOrbTransition] = useState("idle");
  const [meinHuiClosing, setMeinHuiClosing] = useState(false);

  const {
    tab,
    handleTab,
    openOwnProfile,
    mainScrollRef,
    keepFeed, keepDiscover, keepImpact, keepFavorites,
    searchState, setSearchState,
    activeMood, setActiveMood,
    liveNotifCount,
    isTalent, isBaseUser, canCreate,
    isMember,
    currentUser,
    authProfile,
    openProfileById,
    showChat, setShowChat,
    chatRecipient, setChatRecipient,
    showNotifs, setShowNotifs,
    showMap, setShowMap,
    showMatch, setShowMatch,
    showMembership, setShowMembership,
    showPlusSheet, setShowPlusSheet,
    showCreateFlow, setShowCreateFlow,
    showConnect, setShowConnect,
    showTeilen, setShowTeilen,
    showTalentFlow, setShowTalentFlow,
    showStoryComposer, setShowStoryComposer,
    showWerkPublisher, setShowWerkPublisher,
    showExperienceCreator, setShowExperienceCreator,
    showImpactFlow, setShowImpactFlow,
    showContentSelector, setShowContentSelector,
    showInvitationFlow, setShowInvitationFlow,
    activeStory, setActiveStory,
    showCreatorDash, setShowCreatorDash,
    showCreatorDashboard,
    showWerkCheckout, setShowWerkCheckout,
    showBookingFlow, setShowBookingFlow,
    showWerkeKorb, setShowWerkeKorb,
    showUnterstutzenFlow, setShowUnterstutzenFlow,
    cart, setCart,
    clearCartPersist,
  } = useHome();

  const closeMeinHuiCinematic = useCallback(
    createCloseMeinHuiCinematic({ setMeinHuiClosing, setShowPlusSheet, setOrbTransition }),
    [setShowPlusSheet]
  );

  const { close: closeContentPreview } = useContentPreview();

  React.useEffect(() => bindNavigateTabListener(handleTab), [handleTab]);

  const { unreadTotal, markChatRead } = useChatList("home");
  usePresence(currentUser?.id);

  const location = useLocation();

  useEffect(() => {
    applyPendingWerkKauf(location?.state, setShowWerkCheckout);
  }, [location?.state?.pendingWerkKauf]); // eslint-disable-line

  React.useEffect(() => {
    registerHomeWindowGlobals({ setShowMembership, setShowCreatorDash, openProfileById });
    return unregisterHomeWindowGlobals;
  }, [setShowMembership, setShowCreatorDash, openProfileById]);

  const flow = useHuiFlow();

  const {
    openOrbWorld, closeOrbWorld, isOrbOpen, orbState,
    backdrop: orbBackdrop, navDrift: orbNavDrift,
  } = useOrbWorld();

  const {
    worldState,
    worldTokens,
    openSurface,
    closeSurface,
    confirmSurface,
    forceRecoverWorld,
    activeSurface,
  } = useWorldSurface();

  React.useEffect(() => {
    if (tab === "orb") {
      console.warn("[HUI INVALID ORB ROUTE] tab=orb detected. Resetting to feed.");
      handleTab("feed");
    }
  }, [tab, handleTab]);

  React.useEffect(() => {
    return runSafariPaintRecoveryOnSurfaceClose({
      paintManager,
      scrollContainerRef,
      tabRefs,
      tab,
      isMember,
      activeSurface,
    });
  }, [activeSurface]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    const mgr = paintManager.current;
    return () => mgr.cleanup();
  }, []);

  function onTabPress(key) {
    handleTab(key);
  }

  const feedHandlers = createFeedHandlers({
    navigate,
    openProfileById,
    setCart,
    setShowWerkeKorb,
    handleTab,
    feedRefreshRef,
    scrollContainerRef,
  });

  const onOrbAction = createOrbOpenHandler({
    setOrbTransition,
    setShowPlusSheet,
    canRenderOrbContent: SAFE_MODE.orb,
  });

  return (
    <>
      <HomeStyles />

      <HomeMainLayout
        activeMood={activeMood}
        setActiveMood={setActiveMood}
        liveNotifCount={liveNotifCount}
        unreadTotal={unreadTotal}
        currentUser={currentUser}
        setShowNotifs={setShowNotifs}
        setSearchState={setSearchState}
        worldTokens={worldTokens}
        mainScrollRef={mainScrollRef}
        scrollContainerRef={scrollContainerRef}
        tabRefs={tabRefs}
        orbTransition={orbTransition}
        keepFeed={keepFeed}
        keepDiscover={keepDiscover}
        keepImpact={keepImpact}
        keepFavorites={keepFavorites}
        feedHandlers={feedHandlers}
        searchState={searchState}
        showTalentFlow={showTalentFlow}
        setShowTalentFlow={setShowTalentFlow}
        openProfileById={openProfileById}
        setShowMap={setShowMap}
        setShowBookingFlow={setShowBookingFlow}
        handleTab={handleTab}
        tab={tab}
        onTabPress={onTabPress}
        showCreatorDashboard={showCreatorDashboard}
        isTalent={isTalent}
        activeSurface={activeSurface}
        showMembership={showMembership}
        showPlusSheet={showPlusSheet}
        authProfile={authProfile}
        onOrbAction={onOrbAction}
      />

      <HomeCommerceOverlays
        cart={cart}
        setCart={setCart}
        showWerkeKorb={showWerkeKorb}
        setShowWerkeKorb={setShowWerkeKorb}
        showUnterstutzenFlow={showUnterstutzenFlow}
        setShowUnterstutzenFlow={setShowUnterstutzenFlow}
        showWerkCheckout={showWerkCheckout}
        setShowWerkCheckout={setShowWerkCheckout}
        showBookingFlow={showBookingFlow}
        setShowBookingFlow={setShowBookingFlow}
        handleTab={handleTab}
        closeContentPreview={closeContentPreview}
        clearCartPersist={clearCartPersist}
      />

      <HomeFlowOverlays
        showConnect={showConnect}
        setShowConnect={setShowConnect}
        showTeilen={showTeilen}
        setShowTeilen={setShowTeilen}
        showChat={showChat}
        setShowChat={setShowChat}
        chatRecipient={chatRecipient}
        setChatRecipient={setChatRecipient}
        flow={flow}
        markChatRead={markChatRead}
        openProfileById={openProfileById}
        handleTab={handleTab}
        showMap={showMap}
        setShowMap={setShowMap}
        showMatch={showMatch}
        setShowMatch={setShowMatch}
        setActiveMood={setActiveMood}
        showPlusSheet={showPlusSheet}
        meinHuiClosing={meinHuiClosing}
        authProfile={authProfile}
        closeMeinHuiCinematic={closeMeinHuiCinematic}
        showStoryComposer={showStoryComposer}
        setShowStoryComposer={setShowStoryComposer}
        showWerkPublisher={showWerkPublisher}
        setShowWerkPublisher={setShowWerkPublisher}
        showExperienceCreator={showExperienceCreator}
        setShowExperienceCreator={setShowExperienceCreator}
        canCreate={canCreate}
        showMembership={showMembership}
        setShowMembership={setShowMembership}
        showCreatorDash={showCreatorDash}
        setShowCreatorDash={setShowCreatorDash}
        showCreateFlow={showCreateFlow}
        setShowCreateFlow={setShowCreateFlow}
        showImpactFlow={showImpactFlow}
        setShowImpactFlow={setShowImpactFlow}
      />

      <HomeContentOverlays
        showContentSelector={showContentSelector}
        setShowContentSelector={setShowContentSelector}
        isTalent={isTalent}
        setShowTeilen={setShowTeilen}
        setShowExperienceCreator={setShowExperienceCreator}
        setShowWerkPublisher={setShowWerkPublisher}
        setShowInvitationFlow={setShowInvitationFlow}
        showInvitationFlow={showInvitationFlow}
        activeStory={activeStory}
        setActiveStory={setActiveStory}
      />

      <HomeDevDebug
        activeSurface={activeSurface}
        worldState={worldState}
        showPlusSheet={showPlusSheet}
        tab={tab}
        keepFeed={keepFeed}
        keepImpact={keepImpact}
        keepDiscover={keepDiscover}
      />
    </>
  );
}

export default function Home() {
  return (
    <HomeShell>
      <HomeInner />
    </HomeShell>
  );
}
