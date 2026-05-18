// home/HomeShell.jsx — HUI Home Context + Layout Shell
// Verwaltet alle Home-States und stellt sie via Context bereit
// Kein direktes Rendern von Business-Logik

import React, {
  useState, useCallback, createContext, useContext
} from "react";
import { useAuth }      from "../../lib/AuthContext";
import { useNotifCount } from "../../lib/AppStateContext";
import {
  useSessionRestore,
  useScrollMemory,
  useOwnPresence,
  useTabKeepAlive,
} from "../../lib/sessionHooks";

// ── Home Context ─────────────────────────────────────────────────
const HomeCtx = createContext(null);
export const useHome = () => {
  const ctx = useContext(HomeCtx);
  if (!ctx) throw new Error("useHome must be inside HomeShell");
  return ctx;
};

// ── HomeShell ────────────────────────────────────────────────────
export default function HomeShell({ children }) {
  const { user, authProfile, isWirker: authIsWirker,
          hasTalentProfile } = useAuth();
  const liveNotifCount = useNotifCount();

  // ── Tab State ───────────────────────────────────────────────
  const [tab, _setTab] = useSessionRestore("feed");
  const { ref: mainScrollRef } = useScrollMemory(tab);
  useOwnPresence(user?.id);

  // ── Talent Status ───────────────────────────────────────────
  const [isTalent, setIsTalent] = useState(
    () => localStorage.getItem("hui_talent") === "1"
  );
  React.useEffect(() => {
    if (hasTalentProfile) {
      localStorage.setItem("hui_talent", "1");
      setIsTalent(true);
    }
  }, [hasTalentProfile]);
  React.useEffect(() => {
    if (localStorage.getItem("hui_talent") === "1") setIsTalent(true);
  }, []);

  // ── User Data ───────────────────────────────────────────────
  const [currentUser, setCurrentUser] = useState(null);
  const [userName,    setUserName]    = useState("");
  React.useEffect(() => {
    if (authProfile) {
      setCurrentUser(authProfile);
      setUserName(authProfile.display_name || authProfile.email?.split("@")[0] || "");
    }
  }, [authProfile?.id]);

  // ── Mood ─────────────────────────────────────────────────────
  const [activeMood, setActiveMood] = useState(null);

  // ── Overlay States ───────────────────────────────────────────
  const [showWirker,            setShowWirker]           = useState(null);
  const [showChat,              setShowChat]             = useState(false);
  const [showNotifs,            setShowNotifs]           = useState(false);
  // showProfile entfernt — Profil läuft über setShowWirker(ownProfile)
  const [showMap,               setShowMap]              = useState(false);
  const [showMatch,             setShowMatch]            = useState(false);
  const [showMembership,        setShowMembership]       = useState(false);
  const [showPlusSheet,         setShowPlusSheet]        = useState(false);
  const [showCreateFlow,        setShowCreateFlow]       = useState(false);
  const [showTalentFlow,        setShowTalentFlow]       = useState(false);
  const [showStoryComposer,     setShowStoryComposer]    = useState(false);
  const [showWerkPublisher,     setShowWerkPublisher]    = useState(false);
  const [showExperienceCreator, setShowExperienceCreator]= useState(false);
  const [showWerkDetail,        setShowWerkDetail]       = useState(null);
  const [showWerkCheckout,      setShowWerkCheckout]     = useState(null);
  const [showWerkeKorb,         setShowWerkeKorb]        = useState(false);
  const [createType,            setCreateType]           = useState(null);
  const [activeStory,           setActiveStory]          = useState(null);
  const [cart,                  setCart]                 = useState([]);

  // ── Tab Keep-Alive ───────────────────────────────────────────
  const keepFeed      = useTabKeepAlive(tab === "feed");
  const keepDiscover  = useTabKeepAlive(tab === "discover");
  const keepChat      = useTabKeepAlive(tab === "chat");
  const keepImpact    = useTabKeepAlive(tab === "impact");
  const keepFavorites = useTabKeepAlive(tab === "favorites");

  // ── switchTab — schließt alle Overlays, wechselt Tab ────────
  const switchTab = useCallback((newTab) => {
    setShowWirker(null);
    setShowWerkDetail(null);
    setShowWerkCheckout(null);
    setShowWerkeKorb(false);
    setShowStoryComposer(false);
    setShowWerkPublisher(false);
    setShowExperienceCreator(false);
    setShowMatch(false);
    setShowMap(false);
    setShowChat(false);
    setShowNotifs(false);
    setShowMembership(false);
    setShowCreateFlow(false);
    setShowPlusSheet(false);
    setCreateType(null);
    _setTab(newTab);
  }, [_setTab]);

  // ── openOwnProfile — öffnet eigenes Profil als Overlay ──────
  // Robust: funktioniert auch wenn authProfile noch lädt
  const openOwnProfile = useCallback(() => {
    const id = authProfile?.id || user?.id || null;
    // Immer setShowWirker aufrufen — auch mit minimalen Daten
    setShowWirker({
      id:           id,
      user_id:      id,
      username:     authProfile?.username     || null,
      display_name: authProfile?.display_name || authProfile?.email?.split("@")[0] || "Mein Profil",
      avatar_url:   authProfile?.avatar_url   || null,
      header_img:   authProfile?.header_img   || null,
      talent:       authProfile?.talent       || null,
      focus_type:   authProfile?.focus_type   || "hybrid",
      bio:          authProfile?.bio          || null,
      dna_tags:     authProfile?.dna_tags     || [],
      _isOwnerView: true,
    });
  }, [authProfile, user, setShowWirker]);
  }, [authProfile, user]);

  // ── onTab handler — für BottomNav ────────────────────────────
  const handleTab = useCallback((key) => {
    if (key === "profile") { openOwnProfile(); return; }
    switchTab(key);
  }, [openOwnProfile, switchTab]);

  // ── Context Value ────────────────────────────────────────────
  const ctx = {
    // Auth
    user, authProfile, isTalent,
    currentUser, userName,
    // Tab
    tab, switchTab, handleTab, mainScrollRef,
    keepFeed, keepDiscover, keepChat, keepImpact, keepFavorites,
    // Mood
    activeMood, setActiveMood,
    // Notif
    liveNotifCount,
    // Overlays
    showWirker, setShowWirker,
    showChat, setShowChat,
    showNotifs, setShowNotifs,
    // showProfile entfernt aus Context
    showMap, setShowMap,
    showMatch, setShowMatch,
    showMembership, setShowMembership,
    showPlusSheet, setShowPlusSheet,
    showCreateFlow, setShowCreateFlow,
    showTalentFlow, setShowTalentFlow,
    showStoryComposer, setShowStoryComposer,
    showWerkPublisher, setShowWerkPublisher,
    showExperienceCreator, setShowExperienceCreator,
    showWerkDetail, setShowWerkDetail,
    showWerkCheckout, setShowWerkCheckout,
    showWerkeKorb, setShowWerkeKorb,
    createType, setCreateType,
    activeStory, setActiveStory,
    cart, setCart,
    openOwnProfile,
  };

  return (
    <HomeCtx.Provider value={ctx}>
      {children}
    </HomeCtx.Provider>
  );
}