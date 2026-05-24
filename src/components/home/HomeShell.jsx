// src/components/home/HomeShell.jsx v3 — sauber, keine Syntax-Fehler
// Single Source of Truth für alle Home-States + Profil-Flow

import React, {
  useState, useCallback, useEffect, useMemo, createContext, useContext,
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
import {
  computeTransitionCarryOver,
  mockWorldFromAtmosphere,
} from "../../lib/intelligence/worldContinuity.js";
import { WORLD_CSS } from "../../lib/intelligence/worldPolish.js";
import { useOrbWorld } from "../../context/OrbWorldContext.jsx";
import { assertValidTab } from "../../lib/world/orbLayer.js";

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
  const [showWerkDetail,         setShowWerkDetail]        = useState(null);
  const [showWerkCheckout,       setShowWerkCheckout]      = useState(null);
  const [showWerkeKorb,          setShowWerkeKorb]         = useState(false);
  const [createType,             setCreateType]            = useState(null);
  const [activeStory,            setActiveStory]           = useState(null);
  const [cart,                   setCart]                  = useState([]);

  /* Keep-Alive */
  // Phase 16.4: Tab visibility via tabVisibilityController (single authority)
  // activeSurface from WorldSurface — no local opacity state
  const { activeSurface } = useWorldSurface();
  const { tabFeed, tabDiscover, tabImpact, tabFavorites } =
    useTabStyles(tab, activeSurface);
  // Legacy aliases for backward compat during transition
  const keepFeed      = tabFeed;
  const keepDiscover  = tabDiscover;
  const keepImpact    = tabImpact;
  const keepFavorites = tabFavorites;

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
    setShowMatch(false);
    setShowMap(false);
    setShowChat(false);
    setShowNotifs(false);
    setShowMembership(false);
    setShowCreateFlow(false);
    setShowTeilen(false);
    setShowPlusSheet(false);
    setCreateType(null);
    _setTab(newTab);
    // Phase 16.6: sync activeTab to window for ErrorBoundary diagnostics
    if (typeof window !== "undefined" && window.__HUI_WORLD_STATE__) {
      window.__HUI_WORLD_STATE__.activeTab = newTab;
    }
  }, [_setTab]);

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
    activeMood, setActiveMood,
    liveNotifCount,
    showWirker,            setShowWirker,
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
    showWerkDetail,        setShowWerkDetail,
    showWerkCheckout,      setShowWerkCheckout,
    showWerkeKorb,         setShowWerkeKorb,
    createType,            setCreateType,
    activeStory,           setActiveStory,
    cart,                  setCart,
    openOwnProfile,
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