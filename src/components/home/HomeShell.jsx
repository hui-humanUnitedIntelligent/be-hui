// src/components/home/HomeShell.jsx v4 — P3 Context Optimization
// Single Source of Truth für alle Home-States + Profil-Flow
// P3: Entkoppelte Context-Slices + stabiler Dispatch (weniger Re-Render-Kaskaden)

import React, {
  useState, useCallback, useEffect, useMemo, useRef, createContext, useContext,
} from "react";
import { useAuth }        from "../../lib/AuthContext";
import { isProfileTalent } from '../../lib/profileUtils.js';
import { NavigatorProvider, SCREENS, useNavigateTo } from "../../core/hui.navigator.jsx";
import { createProfileItem } from "../../lib/factories/createProfileItem.js";
import { useNotifCount }  from "../../lib/AppStateContext";
import {
  useSessionRestore,
  useScrollMemory,
  useOwnPresence,
} from "../../lib/sessionHooks";
import { useTabStyles } from "../../lib/world/tabVisibilityController.js";
import { useCartPersistence } from "../../hooks/useCartPersistence.js"; // KORB-PERSIST
import HuiActionProvider from "../../core/HuiActionProvider.jsx";
import { useWorldSurface } from "../../context/WorldSurfaceContext.jsx";
import { SAFE_MODE } from "../../config/safeMode.js";
import {
  computeTransitionCarryOver,
  mockWorldFromAtmosphere,
} from "../../lib/intelligence/worldContinuity.js";
import { WORLD_CSS } from "../../lib/intelligence/worldPolish.js";
import { useOrbWorld } from "../../context/OrbWorldContext.jsx";
import { assertValidTab } from "../../lib/world/orbLayer.js";
import { FlowCtx, createFlowStore } from "../../core/hui.flow.js";
import HuiConnectionEngine from "../../core/HuiConnectionEngine.jsx";
import HuiContextBridge from "../../core/HuiContextBridge.jsx";

/* ── Context Slices (P3) ───────────────────────────────────────── */
const HomeCtx           = createContext(null); // Legacy: voller Merge für Home.jsx
const HomeDispatchCtx   = createContext(null); // Stabil: Setter + Callbacks
const HomeProfileCtx    = createContext(null); // Profil-Routing
const HomeOverlayCtx    = createContext(null); // Overlay-Flags
const HomeNavCtx        = createContext(null); // Tab + Suche + Visibility
const HomeUserCtx       = createContext(null); // Auth + User-Identität
const HomeCommerceCtx   = createContext(null); // Warenkorb

/** Legacy-Hook — abonniert den vollen Merge-Context (Home.jsx Orchestrator). */
export function useHome() {
  const ctx = useContext(HomeCtx);
  return ctx || null;
}

/** Stabile Setter/Callbacks — Consumer re-rendern nicht bei Overlay/Tab-Änderungen. */
export function useHomeDispatch() {
  const ctx = useContext(HomeDispatchCtx);
  return ctx || null;
}

/** Profil-State — selectedProfileId, showCreatorDashboard. */
export function useHomeProfile() {
  const ctx = useContext(HomeProfileCtx);
  return ctx || null;
}

/** Overlay-Flags — häufig wechselnd, nur für Overlay-Gates relevant. */
export function useHomeOverlays() {
  const ctx = useContext(HomeOverlayCtx);
  return ctx || null;
}

/** Navigation — Tab, Suche, Keep-Alive-Styles. */
export function useHomeNav() {
  const ctx = useContext(HomeNavCtx);
  return ctx || null;
}

/** User/Auth — selten wechselnd. */
export function useHomeUser() {
  const ctx = useContext(HomeUserCtx);
  return ctx || null;
}

/** Commerce — Warenkorb. */
export function useHomeCommerce() {
  const ctx = useContext(HomeCommerceCtx);
  return ctx || null;
}

/* ── HomeShell ────────────────────────────────────────────────── */
export default function HomeShell({ children }) {

  /* Auth */
  const {
    user,
    profile: authProfile,
    isWirker: authIsWirker,
    hasTalentProfile,
    isMember,
    refreshProfile,
    authChecked,
  } = useAuth();

  const safeAuthProfile = useMemo(
    () => authProfile ? createProfileItem(authProfile) : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [authProfile?.id, authProfile?.updated_at, authProfile?.membership_type, authProfile?.has_talent_profile]
  );

  const liveNotifCount = useNotifCount();

  /* Tab */
  const [tab, _setTab, restoreTab] = useSessionRestore("feed");
  React.useEffect(() => {
    if (authChecked) restoreTab();
  }, [authChecked, restoreTab]);
  const [prevTab, setPrevTab]   = React.useState("feed");
  const [carryOver, setCarryOver] = React.useState(null);
  const { ref: mainScrollRef }  = useScrollMemory(tab);
  useOwnPresence(user?.id);

  const isTalent = isProfileTalent(authProfile);
  const isBaseUser = !isTalent;
  const canCreate  = isTalent;

  useEffect(() => {
    if (isTalent) {
      localStorage.setItem("hui_talent", "1");
    } else {
      if (authProfile && authProfile.is_member === false && !authProfile.has_talent_profile) {
        localStorage.removeItem("hui_talent");
      }
    }
  }, [isTalent, authProfile]);

  /* User data */
  const [currentUser, setCurrentUser] = useState(null);
  const [userName,    setUserName]    = useState("");
  useEffect(() => {
    if (authProfile) {
      setCurrentUser(authProfile);
      setUserName(
        authProfile.display_name ||
        authProfile.email?.split("@")[0] ||
        ""
      );
    }
  }, [
    authProfile?.id,
    authProfile?.membership_type,
    authProfile?.has_talent_profile,
    authProfile?.updated_at,
  ]);

  /* Mood */
  const [activeMood, setActiveMood] = useState(null);

  /* Overlays */
  const [showWirker,             setShowWirker]            = useState(null);
  const [selectedProfileId,      setSelectedProfileId]     = useState(null);
  const [showCreatorDashboard,   setShowCreatorDashboard]  = useState(false);
  const [showChat, _setShowChatRaw] = useState(false);
  const _showChatRef = React.useRef(false);
  const setShowChat = React.useCallback((val) => {
    const next = typeof val === 'function' ? val(_showChatRef.current) : val;
    _showChatRef.current = next;
    _setShowChatRaw(next);
  }, []);
  const [chatRecipient,          setChatRecipient]         = useState(null);

  const [showNotifs,             setShowNotifs]            = useState(false);
  const [showMap,                setShowMap]               = useState(false);
  const [showMatch,              setShowMatch]             = useState(false);
  const [showMembership,         setShowMembership]        = useState(false);

  const flowStore = useRef(createFlowStore()).current;
  const { openOrbWorld, closeOrbWorld, isOrbOpen, orbState } = useOrbWorld();
  const [showPlusSheet,          setShowPlusSheet]         = useState(false);
  const [showCreateFlow,         setShowCreateFlow]        = useState(false);
  const [showConnect,            setShowConnect]           = useState(false);
  const [showTeilen,             setShowTeilen]            = useState(false);
  const [showTalentFlow,         setShowTalentFlow]        = useState(false);
  const [showStoryComposer,      setShowStoryComposer]     = useState(false);
  const [showWerkPublisher,      setShowWerkPublisher]     = useState(false);
  const [showExperienceCreator,  setShowExperienceCreator] = useState(false);
  const [showImpactFlow,         setShowImpactFlow]         = useState(false);
  const [showContentSelector,    setShowContentSelector]    = useState(false);
  const [showInvitationFlow,     setShowInvitationFlow]     = useState(false);
  const [showCreatorDash,        setShowCreatorDash]        = useState(false);
  const [showWerkDetail,         setShowWerkDetail]        = useState(null);
  const [showWerkCheckout,       setShowWerkCheckout]      = useState(null);
  const [showBookingFlow,        setShowBookingFlow]        = useState(null);
  const [showWerkeKorb,          setShowWerkeKorb]         = useState(false);
  const [showUnterstutzenFlow,    setShowUnterstutzenFlow]  = useState(false);
  const [createType,             setCreateType]            = useState(null);
  const [activeStory,            setActiveStory]           = useState(null);
  const { cart, setCart, clearCart: clearCartPersist } = useCartPersistence(user?.id);

  const { activeSurface } = useWorldSurface();

  const [searchState, setSearchState] = useState({ query:"", typeFilter:null, category:null, active:false, radiusKm:null, geo:null });

  const { tabFeed, tabDiscover, tabImpact, tabFavorites } =
    useTabStyles(tab, activeSurface, searchState.active);
  const keepFeed      = tabFeed;
  const keepDiscover  = tabDiscover;
  const keepImpact    = tabImpact;
  const keepFavorites = tabFavorites;

  const switchTab = useCallback((newTab) => {
    if (!assertValidTab(newTab)) return;
    setPrevTab(tab);
    setCarryOver({ from: tab, to: newTab, timestamp: Date.now() });
    setShowWirker(null);
    setShowWerkDetail(null);
    setShowWerkCheckout(null);
    setShowWerkeKorb(false);
    setShowStoryComposer(false);
    setShowWerkPublisher(false);
    setShowExperienceCreator(false);
    setShowImpactFlow(false);
    setShowContentSelector(false);
    setShowInvitationFlow(false);
    setShowMatch(false);
    setShowMap(false);
    setChatRecipient?.(null);
    setShowNotifs(false);
    setShowMembership(false);
    setShowCreateFlow(false);
    if (!window.__PUBLISHING__) {
      setShowTeilen(false);
    }
    setShowPlusSheet(false);
    setCreateType(null);
    setShowCreatorDashboard(false);
    try { sessionStorage.removeItem("hui_mein_hui_open"); } catch(_) {}
    setShowConnect(false);
    setShowTalentFlow(false);
    _setTab(newTab);
  }, [_setTab, setShowCreatorDashboard]);

  const openCreatorDashboard = useCallback(() => {
    _setTab("creator");
    setShowCreatorDashboard(true);
    try { sessionStorage.setItem("hui_mein_hui_open", "1"); } catch(_) {}
  }, [_setTab, setShowCreatorDashboard]);

  const openOwnProfile = openCreatorDashboard;

  const openProfileById = React.useCallback((id) => {
    if (!id || typeof id !== "string" || id.trim() === "") {
      return;
    }
    const trimmed = id.trim();
    setSelectedProfileId(trimmed);
  }, []);

  const closeProfileById = React.useCallback(() => {
    setSelectedProfileId(null);
  }, []);

  const handleTab = useCallback((key) => {
    if (key === "creator" || key === "profile") {
      _setTab("creator");
      openCreatorDashboard();
      return;
    }
    if (key === "impact") {
      _setTab("impact");
      return;
    }
    switchTab(key);
  }, [_setTab, openCreatorDashboard, switchTab]);

  /* ── P3: Ref-Sync für stabile Dispatch-Referenz ─────────────── */
  const isTalentRef = useRef(isTalent);
  isTalentRef.current = isTalent;

  const orbFnsRef = useRef({ openOrbWorld, closeOrbWorld });
  orbFnsRef.current = { openOrbWorld, closeOrbWorld };

  const navFnsRef = useRef({ switchTab, handleTab, openCreatorDashboard, openOwnProfile, openProfileById, closeProfileById });
  navFnsRef.current = { switchTab, handleTab, openCreatorDashboard, openOwnProfile, openProfileById, closeProfileById };

  const dispatch = useMemo(() => ({
    setShowWirker,
    setSelectedProfileId,
    setShowCreatorDashboard,
    setShowChat,
    setChatRecipient,
    setShowNotifs,
    setShowMap,
    setShowMatch,
    setShowMembership,
    setShowPlusSheet,
    setShowCreateFlow,
    setShowConnect,
    setShowTeilen,
    setShowTalentFlow,
    setShowStoryComposer,
    setShowWerkPublisher,
    setShowExperienceCreator,
    setShowImpactFlow,
    setShowContentSelector,
    setShowInvitationFlow,
    setShowCreatorDash,
    setShowWerkDetail,
    setShowWerkCheckout,
    setShowBookingFlow,
    setShowWerkeKorb,
    setShowUnterstutzenFlow,
    setCreateType,
    setActiveStory,
    setActiveMood,
    setSearchState,
    setCart,
    clearCartPersist,
    flowStore,
    mainScrollRef,
    get isTalent() { return isTalentRef.current; },
    get openOrbWorld() { return orbFnsRef.current.openOrbWorld; },
    get closeOrbWorld() { return orbFnsRef.current.closeOrbWorld; },
    get switchTab() { return navFnsRef.current.switchTab; },
    get handleTab() { return navFnsRef.current.handleTab; },
    get openCreatorDashboard() { return navFnsRef.current.openCreatorDashboard; },
    get openOwnProfile() { return navFnsRef.current.openOwnProfile; },
    get openProfileById() { return navFnsRef.current.openProfileById; },
    get closeProfileById() { return navFnsRef.current.closeProfileById; },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), []);

  /* ── P3: Slice-Contexts (entkoppelt nach Änderungsfrequenz) ─── */
  const profileCtx = useMemo(() => ({
    selectedProfileId,
    showCreatorDashboard,
    authProfile,
    setSelectedProfileId,
    setShowCreatorDashboard,
    closeProfileById,
  }), [selectedProfileId, showCreatorDashboard, authProfile, closeProfileById]);

  const overlayCtx = useMemo(() => ({
    showWirker,
    showChat,
    chatRecipient,
    showNotifs,
    showMap,
    showMatch,
    showMembership,
    showPlusSheet,
    showCreateFlow,
    showConnect,
    showTeilen,
    showTalentFlow,
    showStoryComposer,
    showWerkPublisher,
    showExperienceCreator,
    showImpactFlow,
    showContentSelector,
    showInvitationFlow,
    showCreatorDash,
    showWerkDetail,
    showWerkCheckout,
    showBookingFlow,
    showWerkeKorb,
    showUnterstutzenFlow,
    createType,
    activeStory,
    isOrbOpen,
    orbState,
  }), [
    showWirker, showChat, chatRecipient,
    showNotifs, showMap, showMatch, showMembership,
    showPlusSheet, showCreateFlow, showConnect,
    showTeilen, showTalentFlow, showStoryComposer,
    showWerkPublisher, showExperienceCreator,
    showImpactFlow, showContentSelector, showInvitationFlow,
    showCreatorDash, showWerkDetail, showWerkCheckout, showBookingFlow,
    showWerkeKorb, showUnterstutzenFlow,
    createType, activeStory, isOrbOpen, orbState,
  ]);

  const navCtx = useMemo(() => ({
    tab,
    mainScrollRef,
    keepFeed, keepDiscover, keepImpact, keepFavorites,
    tabFeed, tabDiscover, tabImpact, tabFavorites,
    searchState,
    activeSurface,
    prevTab,
    carryOver,
  }), [
    tab, keepFeed, keepDiscover, keepImpact, keepFavorites,
    tabFeed, tabDiscover, tabImpact, tabFavorites,
    searchState, activeSurface, prevTab, carryOver,
  ]);

  const userCtx = useMemo(() => ({
    user,
    authProfile,
    isTalent,
    isBaseUser,
    canCreate,
    isMember,
    currentUser,
    userName,
    activeMood,
    liveNotifCount,
  }), [
    user, authProfile, isTalent, isBaseUser, canCreate, isMember,
    currentUser, userName, activeMood, liveNotifCount,
  ]);

  const commerceCtx = useMemo(() => ({
    cart,
  }), [cart]);

  /* Legacy merge — Home.jsx Orchestrator braucht alles in einem Hook */
  const ctx = useMemo(() => ({
    ...userCtx,
    ...navCtx,
    ...overlayCtx,
    ...profileCtx,
    ...commerceCtx,
    switchTab,
    handleTab,
    setSearchState,
    setActiveMood,
    openCreatorDashboard,
    openProfileById,
    setShowChat,
    setChatRecipient,
    setShowWirker,
    setShowNotifs,
    setShowMap,
    setShowMatch,
    setShowMembership,
    setShowPlusSheet,
    setShowCreateFlow,
    setShowConnect,
    setShowTeilen,
    setShowTalentFlow,
    setShowStoryComposer,
    setShowWerkPublisher,
    setShowExperienceCreator,
    setShowImpactFlow,
    setShowContentSelector,
    setShowInvitationFlow,
    setShowCreatorDash,
    setShowWerkDetail,
    setShowWerkCheckout,
    setShowBookingFlow,
    setShowWerkeKorb,
    setShowUnterstutzenFlow,
    setCreateType,
    setActiveStory,
    setCart,
    clearCartPersist,
    openOwnProfile,
    openOrbWorld,
    closeOrbWorld,
    flowStore,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [
    userCtx, navCtx, overlayCtx, profileCtx, commerceCtx,
    switchTab, handleTab, openCreatorDashboard, openProfileById,
    openOwnProfile, openOrbWorld, closeOrbWorld, flowStore,
  ]);

  return (
    <>
      <style>{WORLD_CSS}</style>
      <NavigatorProvider onTabChange={_setTab}>
      <FlowCtx.Provider value={flowStore}>
      <HomeDispatchCtx.Provider value={dispatch}>
      <HomeProfileCtx.Provider value={profileCtx}>
      <HomeOverlayCtx.Provider value={overlayCtx}>
      <HomeNavCtx.Provider value={navCtx}>
      <HomeUserCtx.Provider value={userCtx}>
      <HomeCommerceCtx.Provider value={commerceCtx}>
      <HomeCtx.Provider value={ctx}>
        <HuiActionProvider>
          {children}
        </HuiActionProvider>
      </HomeCtx.Provider>
      </HomeCommerceCtx.Provider>
      </HomeUserCtx.Provider>
      </HomeNavCtx.Provider>
      </HomeOverlayCtx.Provider>
      </HomeProfileCtx.Provider>
      </HomeDispatchCtx.Provider>
    </FlowCtx.Provider>
      </NavigatorProvider>
    </>
  );
}
