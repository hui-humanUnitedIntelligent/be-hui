// src/components/home/HomeShell.jsx v3 — sauber, keine Syntax-Fehler
// Single Source of Truth für alle Home-States + Profil-Flow

import React, {
  useState, useCallback, useEffect, createContext, useContext,
} from "react";
import { useAuth }        from "../../lib/AuthContext";
import { useNotifCount }  from "../../lib/AppStateContext";
import {
  useSessionRestore,
  useScrollMemory,
  useOwnPresence,
  useTabKeepAlive,
} from "../../lib/sessionHooks";

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
    authProfile,
    isWirker: authIsWirker,
    hasTalentProfile,
  } = useAuth();

  const liveNotifCount = useNotifCount();

  /* Tab */
  const [tab, _setTab]          = useSessionRestore("feed");
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
  useEffect(() => {
    if (authProfile) {
      setCurrentUser(authProfile);
      setUserName(
        authProfile.display_name ||
        authProfile.email?.split("@")[0] ||
        ""
      );
    }
  }, [authProfile?.id]);

  /* Mood */
  const [activeMood, setActiveMood] = useState(null);

  /* Overlays */
  const [showWirker,             setShowWirker]            = useState(null);
  const [showChat,               setShowChat]              = useState(false);
  const [showNotifs,             setShowNotifs]            = useState(false);
  const [showMap,                setShowMap]               = useState(false);
  const [showMatch,              setShowMatch]             = useState(false);
  const [showMembership,         setShowMembership]        = useState(false);
  const [showPlusSheet,          setShowPlusSheet]         = useState(false);
  const [showCreateFlow,         setShowCreateFlow]        = useState(false);
  const [showTalentFlow,         setShowTalentFlow]        = useState(false);
  const [showStoryComposer,      setShowStoryComposer]     = useState(false);
  const [showWerkPublisher,      setShowWerkPublisher]     = useState(false);
  const [showExperienceCreator,  setShowExperienceCreator] = useState(false);
  const [showWerkDetail,         setShowWerkDetail]        = useState(null);
  const [showWerkCheckout,       setShowWerkCheckout]      = useState(null);
  const [showWerkeKorb,          setShowWerkeKorb]         = useState(false);
  const [createType,             setCreateType]            = useState(null);
  const [activeStory,            setActiveStory]           = useState(null);
  const [cart,                   setCart]                  = useState([]);

  /* Keep-Alive */
  const keepFeed      = useTabKeepAlive(tab === "feed");
  const keepDiscover  = useTabKeepAlive(tab === "discover");
  const keepChat      = useTabKeepAlive(tab === "chat");
  const keepImpact    = useTabKeepAlive(tab === "impact");
  const keepFavorites = useTabKeepAlive(tab === "favorites");

  /* switchTab — schließt alle Overlays + wechselt Tab */
  const switchTab = useCallback((newTab) => {
    console.log("[HUI-SHELL] switchTab:", newTab);
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

  /* openOwnProfile — öffnet eigenes Profil, robust auch ohne authProfile */
  const openOwnProfile = useCallback(() => {
    const id = authProfile?.id || user?.id || "me";
    const profileData = {
      id,
      user_id:      id,
      username:     authProfile?.username                     || null,
      display_name: authProfile?.display_name
                    || authProfile?.email?.split("@")[0]
                    || user?.email?.split("@")[0]
                    || "Mein Profil",
      avatar_url:   authProfile?.avatar_url                   || null,
      header_img:   authProfile?.header_img                   || null,
      talent:       authProfile?.talent                       || null,
      focus_type:   authProfile?.focus_type                   || "hybrid",
      bio:          authProfile?.bio                          || null,
      dna_tags:     authProfile?.dna_tags                     || [],
      _isOwnerView: true,
    };
    console.log("[HUI-SHELL] openOwnProfile:", id, profileData.display_name);
    setShowWirker(profileData);
  }, [authProfile?.id, authProfile?.display_name, authProfile?.avatar_url, user?.id, setShowWirker]);

  /* handleTab — einziger onTab-Handler für BottomNav */
  const handleTab = useCallback((key) => {
    console.log("[HUI-SHELL] handleTab:", key);
    if (key === "profile") {
      openOwnProfile();
      return;
    }
    switchTab(key);
  }, [openOwnProfile, switchTab]);

  /* Context Value */
  const ctx = {
    user, authProfile, isTalent,
    currentUser, userName,
    tab, switchTab, handleTab, mainScrollRef,
    keepFeed, keepDiscover, keepChat, keepImpact, keepFavorites,
    activeMood, setActiveMood,
    liveNotifCount,
    showWirker,            setShowWirker,
    showChat,              setShowChat,
    showNotifs,            setShowNotifs,
    showMap,               setShowMap,
    showMatch,             setShowMatch,
    showMembership,        setShowMembership,
    showPlusSheet,         setShowPlusSheet,
    showCreateFlow,        setShowCreateFlow,
    showTalentFlow,        setShowTalentFlow,
    showStoryComposer,     setShowStoryComposer,
    showWerkPublisher,     setShowWerkPublisher,
    showExperienceCreator, setShowExperienceCreator,
    showWerkDetail,        setShowWerkDetail,
    showWerkCheckout,      setShowWerkCheckout,
    showWerkeKorb,         setShowWerkeKorb,
    createType,            setCreateType,
    activeStory,           setActiveStory,
    cart,                  setCart,
    openOwnProfile,
  };

  return (
    <HomeCtx.Provider value={ctx}>
      {children}
    </HomeCtx.Provider>
  );
}