// src/components/home/HomeShell.jsx v3 — sauber, keine Syntax-Fehler
// Single Source of Truth für alle Home-States + Profil-Flow

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

/* ── Context ──────────────────────────────────────────────────── */
const HomeCtx = createContext(null);

export function useHome() {
  const ctx = useContext(HomeCtx);
  if (!ctx) throw new Error("useHome must be inside HomeShell");
  return ctx;
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

  // authProfile normalisieren — kommt roh aus Supabase
  // Phase 16.7.1: include membership_type + talent in deps
  const safeAuthProfile = useMemo(
    () => authProfile ? createProfileItem(authProfile) : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [authProfile?.id, authProfile?.updated_at, authProfile?.membership_type, authProfile?.has_talent_profile]
  );

  const liveNotifCount = useNotifCount();

  /* Tab */
  const [tab, _setTab, restoreTab] = useSessionRestore("feed");
  // Tab aus sessionStorage erst nach Auth-Check laden
  React.useEffect(() => {
    if (authChecked) restoreTab();
  }, [authChecked, restoreTab]);
  // ── Navigation State ───────────────────────────────────────────
  const [prevTab, setPrevTab]   = React.useState("feed");
  const [carryOver, setCarryOver] = React.useState(null);
  const { ref: mainScrollRef }  = useScrollMemory(tab);
  useOwnPresence(user?.id);

  /* Talent / Membership — single source of truth from AuthContext
   * RULE: isProfileTalent(authProfile) — einzige Wahrheitsquelle (Sprint F.4C)
   * Entfernt: localStorage.hui_talent, is_member, role==="creator", useMemo-Logik.
   */
  // Sprint F.4C: isTalent — einzige Wahrheitsquelle: isProfileTalent()
  // Kein useMemo mehr: isProfileTalent() ist eine pure Funktion (kein Re-render-Risk)
  const isTalent = isProfileTalent(authProfile);

  // Phase 4C: Derived states — direkt aus isTalent abgeleitet
  const isBaseUser = !isTalent;
  const canCreate  = isTalent;

  // Keep localStorage in sync when profile upgrades
  useEffect(() => {
    if (isTalent) {
      localStorage.setItem("hui_talent", "1");
    } else {
      // Clear cache when profile explicitly shows non-member
      // (only clear when profile is loaded and confirms non-member)
      if (authProfile && authProfile.is_member === false && !authProfile.has_talent_profile) {
        localStorage.removeItem("hui_talent");
      }
    }
  }, [isTalent, authProfile]);

  /* User data */
  const [currentUser, setCurrentUser] = useState(null);
  const [userName,    setUserName]    = useState("");
  // Phase 16.7.1: depend on membership + talent changes, not only id
  // Membership transition (basic→member) keeps same id but changes membership_type
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
    authProfile?.membership_type,   // catches basic → member transition
    authProfile?.has_talent_profile, // catches talent onboarding
    authProfile?.updated_at,        // catches any profile refresh
  ]);

  /* Mood */
  const [activeMood, setActiveMood] = useState(null);

  /* Overlays */
  const [showWirker,             setShowWirker]            = useState(null);
  // NEU: ID-basierter Profile-Open (radikale Vereinfachung)
  const [selectedProfileId,      setSelectedProfileId]     = useState(null);
  // ── Creator / Profile State ────────────────────────────────────
  // Profil ist ein regulärer Keep-Alive-Tab im Home-Scroll (wie Feed/Discover/Impact).
  // Kein separates Overlay mehr — tab === "creator" ist die einzige Wahrheitsquelle.
  // ── Chat State ─────────────────────────────────────────────────
  const [showChat, _setShowChatRaw] = useState(false);
  const _showChatRef = React.useRef(false);
  const setShowChat = React.useCallback((val) => {
    const next = typeof val === 'function' ? val(_showChatRef.current) : val;
    _showChatRef.current = next;
    _setShowChatRaw(next);
  }, []);
  const [chatRecipient,          setChatRecipient]         = useState(null);  // Phase 23: direkter Chat-Einstieg

  // ── Overlay State (22 Overlays) ────────────────────────────────
  const [showNotifs,             setShowNotifs]            = useState(false);
  const [showMap,                setShowMap]               = useState(false);
  const [showMatch,              setShowMatch]             = useState(false);
  const [showMembership,         setShowMembership]        = useState(false);

  /* Flow Memory (Phase 2) — LIFO-Stack, kein Re-render */
  const flowStore = useRef(createFlowStore()).current;
  // ── Orb World Layer — replaces showPlusSheet as single source of truth
  const { openOrbWorld, closeOrbWorld, isOrbOpen, orbState } = useOrbWorld();
  // Legacy alias — HuiPlusSheet consumers use setShowPlusSheet(false) to close
  // We keep the state for SafeRender gating ONLY
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
  const [showCreatorDash,        setShowCreatorDash]        = useState(false); // Phase 4D
  const [showWerkDetail,         setShowWerkDetail]        = useState(null);
  const [showWerkCheckout,       setShowWerkCheckout]      = useState(null);
  const [showBookingFlow,        setShowBookingFlow]        = useState(null); // COMMERCE-01 E-3
  const [showWerkeKorb,          setShowWerkeKorb]         = useState(false);
  const [showUnterstutzenFlow,    setShowUnterstutzenFlow]  = useState(false);
  // ── Content / Commerce State ───────────────────────────────────
  const [createType,             setCreateType]            = useState(null);
  const [activeStory,            setActiveStory]           = useState(null);
  // KORB-PERSIST: useCartPersistence ersetzt useState([]) — persistiert über Reloads
  const { cart, setCart, clearCart: clearCartPersist } = useCartPersistence(user?.id);

  /* Keep-Alive */
  // Phase 16.4: Tab visibility via tabVisibilityController (single authority)
  // activeSurface from WorldSurface — no local opacity state
  const { activeSurface } = useWorldSurface();
  const { tabFeed, tabDiscover, tabImpact, tabFavorites, tabCreator } =
    useTabStyles(tab, activeSurface);
  // Legacy aliases for backward compat during transition
  const keepFeed      = tabFeed;
  const keepDiscover  = tabDiscover;
  const keepImpact    = tabImpact;
  const keepFavorites = tabFavorites;
  const keepCreator   = tabCreator;
  const showCreatorDashboard = tab === "creator";

  /* closeHomeOverlays — schließt alle transienten Overlays, behält Tab bei */
  const closeHomeOverlays = useCallback(() => {
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
    setSelectedProfileId(null);
    setChatRecipient?.(null);
    setShowNotifs(false);
    setShowMembership(false);
    setShowCreateFlow(false);
    if (!window.__PUBLISHING__) {
      setShowTeilen(false);
    }
    setShowPlusSheet(false);
    setCreateType(null);
    setShowConnect(false);
    setShowTalentFlow(false);
    try { sessionStorage.removeItem("hui_mein_hui_open"); } catch(_) {}
  }, []);

  /* switchTab — schließt alle Overlays + wechselt Tab */
  const switchTab = useCallback((newTab) => {
    // GUARD: Orb is a world-layer, never a tab destination
    if (!assertValidTab(newTab)) return;
    // Erste relevante Stack-Zeile (überspringt Error + switchTab selbst)
    // World continuity: track tab transition for atmospheric carry-over
    setPrevTab(tab);
    setCarryOver({ from: tab, to: newTab, timestamp: Date.now() });
    closeHomeOverlays();
    // showChat bleibt offen bei Tab-Wechsel (Chat ist Tab-unabhängiges Overlay)
    _setTab(newTab);
  }, [_setTab, tab, closeHomeOverlays]);

  /* openCreatorDashboard — kanonische Funktion zum Öffnen des Profilbereichs
   * NAV-001: Konsolidiert openOwnProfile + openCreatorDashboard (identisch gewesen).
   * sessionStorage-Key "hui_mein_hui_open" = historischer Naming-Drift (Tab-Key ist "creator").
   * Key bleibt aus Kompatibilitätsgründen unverändert. */
  const openCreatorDashboard = useCallback(() => {
    closeHomeOverlays();
    _setTab("creator");
    try { sessionStorage.setItem("hui_mein_hui_open", "1"); } catch(_) {}
  }, [_setTab, closeHomeOverlays]);

  /* openOwnProfile — Alias für openCreatorDashboard (NAV-001: konsolidiert) */
  const openOwnProfile = openCreatorDashboard;

  // ── openProfileById — einziger stabiler Einstiegspunkt für alle Feed-Avatar-Klicks
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


  /* handleTab — einziger onTab-Handler für BottomNav */
  // NAV-001: handleTab ist die EINZIGE autoritative Routing-Entscheidungsinstanz
  // für Tab-Navigation innerhalb der Home-Shell.
  // Home.jsx onTabPress delegiert vollständig an handleTab.
  const handleTab = useCallback((key) => {
    // "creator" und "profile" → regulärer Tab-Wechsel (Keep-Alive im Home-Scroll).
    if (key === "creator" || key === "profile") {
      openCreatorDashboard();
      return;
    }
    // Impact: direkter _setTab ohne switchTab — bewusst, damit offen Overlays
    // (z.B. Chat) beim Impact-Wechsel nicht geschlossen werden.
    if (key === "impact") {
      _setTab("impact");
      return;
    }
    // feed, discover, favorites → switchTab (schließt alle Overlays + wechselt Tab)
    switchTab(key);
  }, [_setTab, openCreatorDashboard, switchTab]);

  /* Context Value — useMemo für Referenzstabilität */
  // Ohne useMemo: ctx ist bei JEDEM render ein neues Objekt →
  // alle useHome()-Consumer re-rendern + buildActions() rebuildet.
  const ctx = useMemo(() => ({
    user, authProfile, isTalent, isBaseUser, canCreate, isMember,
    currentUser, userName,
    tab, switchTab, handleTab, mainScrollRef,
    keepFeed, keepDiscover, keepImpact, keepFavorites, keepCreator,
    tabFeed,  tabDiscover,  tabImpact,  tabFavorites,  tabCreator,
    activeSurface,
    prevTab, carryOver,
    isOrbOpen, openOrbWorld, closeOrbWorld, orbState,
    activeMood, setActiveMood,
    liveNotifCount,
    showWirker,            setShowWirker,
    selectedProfileId,     setSelectedProfileId,
    showCreatorDashboard,
    openCreatorDashboard,
    openProfileById,       closeProfileById,
    showChat,              setShowChat,
    chatRecipient,         setChatRecipient,
    showNotifs,            setShowNotifs,
    showMap,               setShowMap,
    showMatch,             setShowMatch,
    showMembership,        setShowMembership,
    showPlusSheet,         setShowPlusSheet,
    showCreateFlow,        setShowCreateFlow,
    showConnect,           setShowConnect,
    showTeilen,            setShowTeilen,
    showTalentFlow,        setShowTalentFlow,
    showStoryComposer,     setShowStoryComposer,
    showWerkPublisher,     setShowWerkPublisher,
    showExperienceCreator, setShowExperienceCreator,
    showImpactFlow,         setShowImpactFlow,
    showContentSelector,    setShowContentSelector,
    showInvitationFlow,     setShowInvitationFlow,
    showCreatorDash,        setShowCreatorDash,
    showWerkDetail,        setShowWerkDetail,
    showWerkCheckout,      setShowWerkCheckout,
    showBookingFlow,       setShowBookingFlow,      // COMMERCE-01 E-3
    showWerkeKorb,         setShowWerkeKorb,
    showUnterstutzenFlow,  setShowUnterstutzenFlow,
    createType,            setCreateType,
    activeStory,           setActiveStory,
    cart,                  setCart,
    clearCartPersist,
    openOwnProfile,
    flowStore,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [
    user, authProfile, isTalent, isBaseUser, canCreate, isMember,
    currentUser, userName, tab, switchTab, handleTab,
    keepFeed, keepDiscover, keepImpact, keepFavorites, keepCreator,
    tabFeed, tabDiscover, tabImpact, tabFavorites, tabCreator,
    activeSurface, prevTab, carryOver,
    isOrbOpen, openOrbWorld, closeOrbWorld, orbState,
    activeMood, liveNotifCount,
    showWirker, selectedProfileId,
    showCreatorDashboard, openCreatorDashboard,
    openProfileById, closeProfileById,
    showChat, chatRecipient,
    showNotifs, showMap, showMatch, showMembership,
    showPlusSheet, showCreateFlow, showConnect,
    showTeilen, showTalentFlow, showStoryComposer,
    showWerkPublisher, showExperienceCreator,
    showImpactFlow, showContentSelector, showInvitationFlow,
    showCreatorDash, showWerkDetail, showWerkCheckout, showWerkeKorb,
    showUnterstutzenFlow, showBookingFlow,
    createType, activeStory, cart, clearCartPersist,
    openOwnProfile, flowStore,
  ]);

  return (
    <>
      <style>{WORLD_CSS}</style>
      <NavigatorProvider onTabChange={_setTab}>
      <FlowCtx.Provider value={flowStore}>
      <HomeCtx.Provider value={ctx}>
        <HuiActionProvider>
          {children}
        </HuiActionProvider>
      </HomeCtx.Provider>
    </FlowCtx.Provider>
      </NavigatorProvider>
    </>
  );
}