// src/components/home/HomeShell.jsx v3 — sauber, keine Syntax-Fehler
// Single Source of Truth für alle Home-States + Profil-Flow

import React, {
  useState, useCallback, useEffect, useMemo, useRef, createContext, useContext,
} from "react";
import { useAuth }        from "../../lib/AuthContext";
import { createProfileItem } from "../../lib/factories/createProfileItem.js";
import { useNotifCount }  from "../../lib/AppStateContext";
import {
  useSessionRestore,
  useScrollMemory,
  useOwnPresence,
} from "../../lib/sessionHooks";
import { useTabStyles } from "../../lib/world/tabVisibilityController.js";
import HuiActionProvider from "../../core/HuiActionProvider.jsx";
import { useWorldSurface } from "../../context/WorldSurfaceContext.jsx";
import { SAFE_MODE } from "../../config/safeMode.js";
import { WORLD_CSS } from "../../lib/intelligence/worldPolish.js";
import { useOrbWorld } from "../../context/OrbWorldContext.jsx";
import { assertValidTab } from "../../lib/world/orbLayer.js";
import { FlowCtx, createFlowStore } from "../../core/hui.flow.js";
import { useFlowManager, normalizeOrbFlowKey } from "../../system/flows/FlowManager.jsx";
import { cleanupOrbEnvironment } from "../../lib/cleanup/cleanupOrbEnvironment.js";

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
  const [tab, _setTab]          = useSessionRestore("feed");
  const [prevTab, setPrevTab]   = React.useState("feed");
  const [carryOver, setCarryOver] = React.useState(null);
  const { ref: mainScrollRef }  = useScrollMemory(tab);
  useOwnPresence(user?.id);

  /* Talent */
  const [isTalent, setIsTalent] = useState(
    () => localStorage.getItem("hui_talent") === "1"
  );
  useEffect(() => {
    if (hasTalentProfile) {
      localStorage.setItem("hui_talent", "1");
      setIsTalent(true);
    }
  }, [hasTalentProfile]);
  useEffect(() => {
    if (localStorage.getItem("hui_talent") === "1") setIsTalent(true);
  }, []);

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
      // Expose on window for ErrorBoundary crash context
      if (typeof window !== "undefined") {
        window.__HUI_WORLD_STATE__ = {
          ...(window.__HUI_WORLD_STATE__ || {}),
          membershipType: authProfile.membership_type ?? "free",
        };
      }
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
  const [showChat,               setShowChat]              = useState(false);
  const [chatRecipient,          setChatRecipient]         = useState(null);  // Phase 23: direkter Chat-Einstieg
  const [showNotifs,             setShowNotifs]            = useState(false);
  const [showMap,                setShowMap]               = useState(false);
  const [showMatch,              setShowMatch]             = useState(false);
  const [showMembership,         setShowMembership]        = useState(false);

  /* Flow Memory (Phase 2) — LIFO-Stack, kein Re-render */
  const flowStore = useRef(createFlowStore()).current;
  // ── Orb World Layer — owned by the central Orb Router below
  const { openOrbWorld, closeOrbWorld, isOrbOpen, orbState } = useOrbWorld();
  const [showCreateFlow,         setShowCreateFlow]        = useState(false);
  const [showConnect,            setShowConnect]           = useState(false);
  const [showTeilen,             setShowTeilen]            = useState(false);
  const [showTalentFlow,         setShowTalentFlow]        = useState(false);
  const [showStoryComposer,      setShowStoryComposer]     = useState(false);
  const [showWerkPublisher,      setShowWerkPublisher]     = useState(false);
  const [showExperienceCreator,  setShowExperienceCreator] = useState(false);
  const [showImpactFlow,         setShowImpactFlow]         = useState(false);
  const [showContentSelector,    setShowContentSelector]    = useState(false);
  const [showWerkDetail,         setShowWerkDetail]        = useState(null);
  const [showWerkCheckout,       setShowWerkCheckout]      = useState(null);
  const [showWerkeKorb,          setShowWerkeKorb]         = useState(false);
  const [createType,             setCreateType]            = useState(null);
  const [activeStory,            setActiveStory]           = useState(null);
  const [cart,                   setCart]                  = useState([]);
  const {
    activeFlow: activeOrbFlow,
    startFlow:  startActiveOrbFlow,
    endFlow:    endActiveOrbFlow,
  } = useFlowManager();
  const orbFlowLockRef = useRef(false);

  /* Keep-Alive */
  // Phase 16.4: Tab visibility via tabVisibilityController (single authority)
  // activeSurface from WorldSurface — no local opacity state
  const { activeSurface, openSurface, closeSurface, confirmSurface } = useWorldSurface();
  const { tabFeed, tabDiscover, tabImpact, tabFavorites } =
    useTabStyles(tab, activeSurface);
  // Legacy aliases for backward compat during transition
  const keepFeed      = tabFeed;
  const keepDiscover  = tabDiscover;
  const keepImpact    = tabImpact;
  const keepFavorites = tabFavorites;

  /* Orb Router — single source of truth for every Orb surface + Orb flow */
  const closeAllOrbStates = useCallback((reason = "orb-close", options = {}) => {
    const keepActiveFlow = options?.keepActiveFlow === true;

    setShowContentSelector(false);
    setShowCreateFlow(false);
    setShowConnect(false);
    setShowTeilen(false);
    setShowWerkPublisher(false);
    setShowExperienceCreator(false);
    setShowImpactFlow(false);
    setShowTalentFlow(false);
    setShowMembership(false);
    setCreateType(null);

    if (!keepActiveFlow) {
      orbFlowLockRef.current = false;
      endActiveOrbFlow();
    }

    closeSurface(null, reason);
    closeOrbWorld(reason);
    cleanupOrbEnvironment({ reason: `orb-router-${reason}` });
  }, [closeOrbWorld, closeSurface, endActiveOrbFlow]);

  const openOrbRouter = useCallback((payload = {}) => {
    const safePayload = payload && typeof payload === "object" ? payload : {};

    closeAllOrbStates("open-reset");
    setShowWirker(null);
    setShowChat(false);
    setChatRecipient(null);
    setShowNotifs(false);
    setShowMap(false);
    setShowMatch(false);
    setShowStoryComposer(false);

    if (!SAFE_MODE.orb) {
      console.warn("[HUI ORB] SAFE_MODE.orb=false — router aborted");
      cleanupOrbEnvironment({ reason: "orb-router-safe-mode-disabled" });
      return;
    }

    if (!isMember) {
      openSurface("membership");
      setShowMembership(true);
      return;
    }

    const world = safePayload.world && typeof safePayload.world === "object"
      ? safePayload.world
      : {};

    openOrbWorld({
      source:           safePayload.source || "orb-button",
      originTab:        tab,
      worldTemperature: safePayload.worldTemperature ?? world.worldTemperature ?? "calm_flowing",
      atmosphereId:     safePayload.atmosphereId ?? safePayload.worldId ?? world.atmosphereId ?? null,
      continuityCarry:  safePayload.continuityCarry ?? world.continuityCarry ?? {},
    });
    openSurface("orb");
    setShowContentSelector(true);

    if (typeof window !== "undefined" && window.requestAnimationFrame) {
      window.requestAnimationFrame(() => confirmSurface("orb"));
    } else {
      confirmSurface("orb");
    }
  }, [
    closeAllOrbStates,
    confirmSurface,
    isMember,
    openOrbWorld,
    openSurface,
    setChatRecipient,
    tab,
  ]);

  const startOrbFlow = useCallback((rawType) => {
    const flowKey = normalizeOrbFlowKey(rawType);
    if (!flowKey) {
      console.warn("[HUI ORB] unknown flow ignored:", rawType);
      closeAllOrbStates("unknown-flow");
      return;
    }
    if (orbFlowLockRef.current || activeOrbFlow) return;

    orbFlowLockRef.current = true;
    closeAllOrbStates(`flow-start-${flowKey}`, { keepActiveFlow: true });
    startActiveOrbFlow(flowKey);

    window.setTimeout(() => {
      orbFlowLockRef.current = false;
    }, 400);
  }, [activeOrbFlow, closeAllOrbStates, startActiveOrbFlow]);

  const endOrbFlow = useCallback((reason = "flow-close") => {
    orbFlowLockRef.current = false;
    endActiveOrbFlow();
    closeSurface(null, reason);
    closeOrbWorld(reason);
    cleanupOrbEnvironment({ reason: `orb-router-${reason}` });
  }, [closeOrbWorld, closeSurface, endActiveOrbFlow]);

  /* switchTab — schließt alle Overlays + wechselt Tab */
  const switchTab = useCallback((newTab) => {
    // GUARD: Orb is a world-layer, never a tab destination
    if (!assertValidTab(newTab)) return;
    // World continuity: track tab transition for atmospheric carry-over
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
    setShowMatch(false);
    setShowMap(false);
    setShowChat(false);
    setShowNotifs(false);
    setShowMembership(false);
    setShowCreateFlow(false);
    setShowTeilen(false);
    endActiveOrbFlow();
    orbFlowLockRef.current = false;
    closeSurface(null, "tab-switch");
    closeOrbWorld("tab-switch");
    setCreateType(null);
    _setTab(newTab);
    // Phase 16.6: sync activeTab to window for ErrorBoundary diagnostics
    if (typeof window !== "undefined" && window.__HUI_WORLD_STATE__) {
      window.__HUI_WORLD_STATE__.activeTab = newTab;
    }
  }, [_setTab, closeOrbWorld, closeSurface, endActiveOrbFlow, tab]);

  /* openOwnProfile — öffnet Creator Profile Overlay (Owner View) */
  const openOwnProfile = useCallback(() => {
    const id = authProfile?.id || user?.id || "me";
    // Übergebe alle relevanten Profil-Felder für CreatorProfilePage
    const profileData = {
      id,
      user_id:        id,
      username:       authProfile?.username        || null,
      display_name:   authProfile?.display_name
                      || authProfile?.email?.split("@")[0]
                      || user?.email?.split("@")[0]
                      || "Mein Profil",
      avatar_url:     authProfile?.avatar_url      || null,
      header_img:     authProfile?.header_img      || null,
      talent:         authProfile?.talent          || null,
      focus_type:     authProfile?.focus_type      || "hybrid",
      bio:            authProfile?.bio             || null,
      dna_tags:       authProfile?.dna_tags        || [],
      location_label: authProfile?.location_label
                      || authProfile?.location     || null,
      impact_eur:     authProfile?.impact_eur      || null,
      is_wirker:      authProfile?.is_wirker
                      || authProfile?.has_talent_profile || false,
      current_mood:   authProfile?.current_mood    || null,
      experiences_count: authProfile?.experiences_count || null,
      followers_count:   authProfile?.followers_count   || null,
      connections_count: authProfile?.connections_count || null,
      _isOwnerView:   true,
    };
    setShowWirker(profileData);
  }, [authProfile, user?.id, setShowWirker]);

  /* handleTab — einziger onTab-Handler für BottomNav */
  const handleTab = useCallback((key) => {
    if (key === "profile") {
      openOwnProfile();
      return;
    }
    switchTab(key);
  }, [openOwnProfile, switchTab]);

  /* Context Value */
  const ctx = {
    user, authProfile, isTalent, isMember,
    currentUser, userName,
    tab, switchTab, handleTab, mainScrollRef,
    keepFeed, keepDiscover, keepImpact, keepFavorites,
    tabFeed,  tabDiscover,  tabImpact,  tabFavorites,
    activeSurface,
    prevTab, carryOver,
    isOrbOpen, openOrbWorld, closeOrbWorld, orbState,
    activeOrbFlow, openOrbRouter, closeAllOrbStates, startOrbFlow, endOrbFlow,
    activeMood, setActiveMood,
    liveNotifCount,
    showWirker,            setShowWirker,
    showChat,              setShowChat,
    chatRecipient,         setChatRecipient,
    showNotifs,            setShowNotifs,
    showMap,               setShowMap,
    showMatch,             setShowMatch,
    showMembership,        setShowMembership,
    showCreateFlow,        setShowCreateFlow,
    showConnect,           setShowConnect,
    showTeilen,            setShowTeilen,
    showTalentFlow,        setShowTalentFlow,
    showStoryComposer,     setShowStoryComposer,
    showWerkPublisher,     setShowWerkPublisher,
    showExperienceCreator, setShowExperienceCreator,
    showImpactFlow,         setShowImpactFlow,
    showContentSelector,
    showWerkDetail,        setShowWerkDetail,
    showWerkCheckout,      setShowWerkCheckout,
    showWerkeKorb,         setShowWerkeKorb,
    createType,            setCreateType,
    activeStory,           setActiveStory,
    cart,                  setCart,
    openOwnProfile,
    flowStore,          // Phase 2: Flow Memory
  };

  return (
    <>
      <style>{WORLD_CSS}</style>
      <FlowCtx.Provider value={flowStore}>
      <HomeCtx.Provider value={ctx}>
        <HuiActionProvider>
          {children}
        </HuiActionProvider>
      </HomeCtx.Provider>
    </FlowCtx.Provider>
    </>
  );
}