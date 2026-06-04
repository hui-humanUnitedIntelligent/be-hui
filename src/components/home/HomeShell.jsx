// src/components/home/HomeShell.jsx v3 — sauber, keine Syntax-Fehler
// Single Source of Truth für alle Home-States + Profil-Flow

import React, {
  useState, useCallback, useEffect, useMemo, useRef, createContext, useContext,
} from "react";
import { useAuth }        from "../../lib/AuthContext";
import { NavigatorProvider, SCREENS, useNavigateTo } from "../../core/hui.navigator.jsx";
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

  // ── HOME MOUNT DEBUG ─────────────────────────────────────────────────
  React.useEffect(() => {
    console.log("HOME_MOUNTED", new Date().toISOString());
  }, []);

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
  const [prevTab, setPrevTab]   = React.useState("feed");
  const [carryOver, setCarryOver] = React.useState(null);
  const { ref: mainScrollRef }  = useScrollMemory(tab);
  useOwnPresence(user?.id);

  /* Talent / Membership — single source of truth from AuthContext
   * RULE: isTalent === true ONLY when profile.is_member===true OR profile.role==="talent"
   * OR profile.has_talent_profile===true.
   * localStorage is ONLY a performance cache — always overridden by live profile.
   */
  // Phase 4C: isTalent — erweitert um membership_type + membership_active
  const isTalent = React.useMemo(() => {
    if (!authProfile) return localStorage.getItem("hui_talent") === "1";
    // Phase 4C: primäre Prüfung via neue Felder
    if (authProfile.membership_type === "talent" && authProfile.membership_active === true) return true;
    if (authProfile.membership_type === "guardian" || authProfile.membership_type === "team") return true;
    // Legacy Kompatibilität (bestehende Nutzer ohne Migration)
    if (authProfile.is_member === true) return true;
    if (authProfile.role === "talent" || authProfile.role === "wirker" || authProfile.role === "creator") return true;
    if (authProfile.has_talent_profile === true) return true;
    if (isMember) return true;
    return localStorage.getItem("hui_talent") === "1";
  }, [
    authProfile?.membership_type,
    authProfile?.membership_active,
    authProfile?.is_member,
    authProfile?.role,
    authProfile?.has_talent_profile,
    isMember,
  ]);

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
  // NEU: ID-basierter Profile-Open (radikale Vereinfachung)
  const [selectedProfileId,      setSelectedProfileId]     = useState(null);
  const [showCreatorDashboard,   setShowCreatorDashboard]  = useState(false);
  const [showChat,               setShowChat]              = useState(false);
  const [chatRecipient,          setChatRecipient]         = useState(null);  // Phase 23: direkter Chat-Einstieg
  const _prevChatRecipientRef = React.useRef(undefined);
  React.useEffect(() => {
    const prev = _prevChatRecipientRef.current;
    const next = chatRecipient;
    const stack = new Error().stack;
    if (prev === undefined) { _prevChatRecipientRef.current = next; return; }
    const prevId = prev?.id ?? null;
    const nextId = next?.id ?? null;
    let event;
    if (!prevId && nextId)                           event = "RECIPIENT_SET";
    else if (prevId && !nextId)                     event = "RECIPIENT_CLEARED";
    else if (prevId && nextId && prevId !== nextId) event = "RECIPIENT_CHANGED";
    else return;
    const shortStack = (stack || "").split("\n").slice(1, 5).join(" | ");
    const payload = { event, prevId, nextId,
      prevName: prev?.display_name ?? null, nextName: next?.display_name ?? null,
      ts: Date.now(), stack: shortStack };
    if (event === 'RECIPIENT_CLEARED') {
      console.error("[CHAT_RECIPIENT_CLEAR]", { caller: "HomeShell/chatRecipient-watcher", prevId, ts: Date.now(), stack: (new Error().stack) });
    } else if (event === 'RECIPIENT_SET') {
      console.error("[CHAT_RECIPIENT_SET]", { recipientId: nextId, recipient: chatRecipient, caller: "HomeShell/chatRecipient-watcher", ts: Date.now(), stack: (new Error().stack) });
    } else {
      console.error("[CHAT_RECIPIENT_CHANGED]", { from: prevId, to: nextId, caller: "HomeShell/chatRecipient-watcher", ts: Date.now(), stack: (new Error().stack) });
    }
    _prevChatRecipientRef.current = next;
  }, [chatRecipient]);

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
    // Erste relevante Stack-Zeile (überspringt Error + switchTab selbst)
    if (typeof window !== "undefined") {
    }
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
    setShowInvitationFlow(false);
    setShowMatch(false);
    setShowMap(false);
    console.error("[TAB_SWITCH_CLEAR_CHAT_RECIPIENT]", { newTab, ts: Date.now() });
    setChatRecipient?.(null);
    setShowNotifs(false);
    setShowMembership(false);
    setShowCreateFlow(false);
    if (window.__PUBLISHING__) {
    } else {
      setShowTeilen(false);
    }
    setShowPlusSheet(false);
    setCreateType(null);
    // FIX BUG 3: Profil-Overlay schließen wenn User auf anderen Tab wechselt
    setShowCreatorDashboard(false);
    _setTab(newTab);
    // Phase 16.6: sync activeTab to window for ErrorBoundary diagnostics
    if (typeof window !== "undefined" && window.__HUI_WORLD_STATE__) {
      window.__HUI_WORLD_STATE__.activeTab = newTab;
    }
  }, [_setTab, setShowCreatorDashboard]);

  /* openOwnProfile → öffnet MyCreatorDashboard (eigene, separate Seite) */
  const openOwnProfile = useCallback(() => {
    setShowCreatorDashboard(true);
    try { sessionStorage.setItem("hui_overlay_profile", "1"); } catch (_) {}
  }, [setShowCreatorDashboard]);

  /* openCreatorDashboard — direkter Alias */
  const openCreatorDashboard = useCallback(() => {
    setShowCreatorDashboard(true);
    try { sessionStorage.setItem("hui_overlay_profile", "1"); } catch (_) {}
  }, [setShowCreatorDashboard]);

  // ── openProfileById — einziger stabiler Einstiegspunkt für alle Feed-Avatar-Klicks
  const openProfileById = React.useCallback((id) => {
    // ── PROFILE_OPEN INSTRUMENTATION ────────────────────────────
    const _stack2 = new Error().stack;
    const _short2 = (_stack2 || "").split("\n").slice(1, 6).join(" | ");
    const _ev2 = { event: "PROFILE_OPEN", profileId: id, ts: Date.now(), caller: _short2 };
    console.log("[PROFILE_OPEN]", _ev2);
    if (typeof window !== "undefined") {
      if (!window.HUI_PROFILE_EVENTS) window.HUI_PROFILE_EVENTS = [];
      window.HUI_PROFILE_EVENTS.push(_ev2);
      if (window.HUI_PROFILE_EVENTS.length > 20) window.HUI_PROFILE_EVENTS.shift();
      window.HUI_LAST_PROFILE_EVENT = _ev2;
      window.__HUI_SELECTED_PROFILE_ID__ = id;
    }
    // ── end instrumentation ─────────────────────────────────────
    console.log("🟠 STEP 4 — HomeShell openProfileById aufgerufen", { id, typeOf: typeof id });
    if (!id || typeof id !== "string" || id.trim() === "") {
      console.warn("🔴 STEP 4 — HomeShell openProfileById: leere oder fehlende ID ignoriert", { id });
      return;
    }
    const trimmed = id.trim();
    console.log("🟠 STEP 4 — HomeShell setSelectedProfileId →", trimmed);
    // Visueller Beweis: Temporärer DOM-Banner für iPad-Debugging
    try {
      let banner = document.getElementById("__hui_profile_debug__");
      if (!banner) {
        banner = document.createElement("div");
        banner.id = "__hui_profile_debug__";
        banner.style.cssText = "position:fixed;top:60px;left:50%;transform:translateX(-50%);z-index:99999;background:#0DC4B5;color:#000;padding:8px 18px;border-radius:20px;font-size:13px;font-family:monospace;font-weight:bold;pointer-events:none;";
        document.body.appendChild(banner);
      }
      banner.textContent = "openProfileById: " + trimmed.slice(0,12) + "…";
      banner.style.display = "block";
      setTimeout(() => { if(banner) banner.style.display = "none"; }, 4000);
    } catch(e) {}
    setSelectedProfileId(trimmed);
  }, []);

  const closeProfileById = React.useCallback(() => {
    // ── PROFILE_CLOSE INSTRUMENTATION ──────────────────────────
    const _stack = new Error().stack;
    const _short = (_stack || "").split("\n").slice(1, 6).join(" | ");
    const _ev = {
      event:             "PROFILE_CLOSE",
      selectedProfileId: (typeof window !== "undefined" && window.__HUI_SELECTED_PROFILE_ID__) ?? null,
      recipientId:       null,  // filled by watcher
      ts:                Date.now(),
      caller:            _short,
    };
    console.warn("[PROFILE_CLOSE]", _ev);
    if (typeof window !== "undefined") {
      if (!window.HUI_PROFILE_EVENTS) window.HUI_PROFILE_EVENTS = [];
      window.HUI_PROFILE_EVENTS.push(_ev);
      if (window.HUI_PROFILE_EVENTS.length > 20) window.HUI_PROFILE_EVENTS.shift();
      window.HUI_LAST_PROFILE_EVENT = _ev;
    }
    // ── end instrumentation ─────────────────────────────────────
    setSelectedProfileId(null);
  }, []);

  // DIAG: selectedProfileId-Watcher
  React.useEffect(() => {
    const _ev = {
      event:             selectedProfileId ? "SELECTED_PROFILE_SET" : "SELECTED_PROFILE_CLEARED",
      selectedProfileId: selectedProfileId ?? null,
      ts:                Date.now(),
      stack:             new Error().stack.split("\n").slice(1,5).join(" | "),
    };
    console.log("[SELECTED_PROFILE_CHANGE]", _ev);
    if (typeof window !== "undefined") {
      window.__HUI_SELECTED_PROFILE_ID__ = selectedProfileId ?? null;
      if (!window.HUI_PROFILE_EVENTS) window.HUI_PROFILE_EVENTS = [];
      window.HUI_PROFILE_EVENTS.push(_ev);
      if (window.HUI_PROFILE_EVENTS.length > 20) window.HUI_PROFILE_EVENTS.shift();
  }, [selectedProfileId]);

  /* handleTab — einziger onTab-Handler für BottomNav */
  const handleTab = useCallback((key) => {
    // Creator tab → handled by OPEN_OWN_PROFILE action (overlay, no tab switch)
    if (key === "creator") {
      openCreatorDashboard();
      return;
    }
    // Impact Tab
    if (key === "impact") {
      _setTab("impact");
      return;
    }
    if (key === "profile") {
      openOwnProfile();
      return;
    }
    switchTab(key);
  }, [openOwnProfile, switchTab]);

  /* Context Value */
  const ctx = {
    user, authProfile, isTalent, isBaseUser, canCreate, isMember,
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
    selectedProfileId,     setSelectedProfileId,
    showCreatorDashboard,  setShowCreatorDashboard,
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