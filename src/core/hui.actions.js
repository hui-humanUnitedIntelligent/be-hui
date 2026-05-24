// src/core/hui.actions.js — HUI ACTION ENGINE v1
// ══════════════════════════════════════════════════════════════════
// Das zentrale Nervensystem der HUI-Plattform.
//
// REGEL: Kein Button darf direkt setState/navigate aufrufen.
//        Alle Interaktionen laufen über HUI_ACTIONS.
//
// USAGE:
//   const actions = useHuiActions();
//   actions.openProfile({ creatorId: "abc", source: "discover" });
//
// ══════════════════════════════════════════════════════════════════

import { useCallback, useContext, createContext } from "react";

// ─── Action log (dev mode) ─────────────────────────────────────────
const isDev = import.meta.env?.DEV ?? false;

function logAction(name, payload) {
  if (isDev) {
    console.log(
      `%c[HUI_ACTION] %c${name}`,
      "color:#0DC4B5;font-weight:800",
      "color:#1a1a2e;font-weight:600",
      payload ?? ""
    );
  }
}

// ─── Action Names (constants — use these, not raw strings) ─────────
export const A = {
  // Navigation / Profiles
  OPEN_PROFILE:         "OPEN_PROFILE",
  OPEN_OWN_PROFILE:     "OPEN_OWN_PROFILE",
  CLOSE_PROFILE:        "CLOSE_PROFILE",

  // Communication
  OPEN_CHAT:            "OPEN_CHAT",
  CLOSE_CHAT:           "CLOSE_CHAT",
  SEND_MESSAGE:         "SEND_MESSAGE",

  // Experiences
  OPEN_EXPERIENCE:      "OPEN_EXPERIENCE",
  BOOK_EXPERIENCE:      "BOOK_EXPERIENCE",
  CREATE_EXPERIENCE:    "CREATE_EXPERIENCE",

  // Impact
  OPEN_IMPACT:          "OPEN_IMPACT",
  SEND_RESONANCE:       "SEND_RESONANCE",

  // Social
  FOLLOW_CREATOR:       "FOLLOW_CREATOR",
  SHARE_MOMENT:         "SHARE_MOMENT",

  // Overlays / Sheets
  OPEN_ORB:             "OPEN_ORB",
  CLOSE_ORB:            "CLOSE_ORB",
  OPEN_BOOKING:         "OPEN_BOOKING",
  OPEN_CONNECT:         "OPEN_CONNECT",
  OPEN_NOTIFICATIONS:   "OPEN_NOTIFICATIONS",
  OPEN_MAP:             "OPEN_MAP",
  OPEN_MATCH:           "OPEN_MATCH",

  // Worlds / Rooms
  OPEN_WORLD:           "OPEN_WORLD",
  OPEN_ROOM:            "OPEN_ROOM",
  OPEN_COMMUNITY:       "OPEN_COMMUNITY",

  // Creator tools
  OPEN_STORY_COMPOSER:  "OPEN_STORY_COMPOSER",
  OPEN_IMPACT_FLOW:     "OPEN_IMPACT_FLOW",
  OPEN_CREATE_FLOW:     "OPEN_CREATE_FLOW",
  OPEN_CALENDAR:        "OPEN_CALENDAR",

  // Tab navigation
  GO_TO_TAB:            "GO_TO_TAB",
  GO_HOME:              "GO_HOME",
  GO_DISCOVER:          "GO_DISCOVER",
  GO_IMPACT:            "GO_IMPACT",
  GO_FAVORITES:         "GO_FAVORITES",
};

// ─── Action Context ────────────────────────────────────────────────
export const ActionCtx = createContext(null);

// ─── useHuiActions — main hook ─────────────────────────────────────
// Must be used inside HuiActionProvider (which wraps HomeShell)
export function useHuiActions() {
  const ctx = useContext(ActionCtx);
  if (!ctx) {
    // Graceful fallback — never crash the UI
    const noop = (name) => (payload) => {
      console.warn(`[HUI_ACTIONS] Provider not found for action: ${name}`, payload);
    };
    return Object.fromEntries(Object.values(A).map(k => [k, noop(k)]));
  }
  return ctx;
}

// ─── Factory: build action map from HomeShell context ─────────────
// Called once in HuiActionProvider. Returns stable action object.
export function buildActions(shell) {
  const {
    // Profile
    setShowWirker,
    openOwnProfile,
    // Flow Memory (Phase 2)
    flowStore,
    // Chat
    setShowChat,
    setChatRecipient,
    chatRecipient,
    // Overlays
    setShowPlusSheet,
    setShowCreateFlow,
    setShowConnect,
    setShowNotifs,
    setShowMap,
    setShowMatch,
    setShowStoryComposer,
    setShowImpactFlow,
    setShowExperienceCreator,
    // Tabs
    switchTab,
    handleTab,
    // Orb
    openOrbWorld,
    closeOrbWorld,
  } = shell;

  // ── helper: close all overlays before opening another ────────────
  function closeAll() {
    setShowWirker?.(null);
    setShowChat?.(false);
    setShowPlusSheet?.(false);
    setShowConnect?.(false);
    setShowNotifs?.(false);
    setShowMap?.(false);
    setShowMatch?.(false);
    setShowStoryComposer?.(false);
    setShowImpactFlow?.(false);
    setShowExperienceCreator?.(false);
    closeOrbWorld?.();
  }

  // ── action map ────────────────────────────────────────────────────
  const actions = {

    // ── PROFILE ──────────────────────────────────────────────────
    [A.OPEN_PROFILE]: (payload = {}) => {
      logAction(A.OPEN_PROFILE, payload);
      const { creator, creatorId, source, ...rest } = payload;
      const data = creator
        ? creator
        : { id: creatorId, user_id: creatorId, ...rest };
      // Phase 2: Flow Stack — merke Navigations-Ursprung
      flowStore?.push({ surface: "profile", creatorId: creatorId ?? data?.id, creator: data, source });
      setShowWirker?.(data);
    },

    [A.OPEN_OWN_PROFILE]: (payload = {}) => {
      logAction(A.OPEN_OWN_PROFILE, payload);
      openOwnProfile?.();
    },

    [A.CLOSE_PROFILE]: () => {
      logAction(A.CLOSE_PROFILE);
      setShowWirker?.(null);
    },

    // ── CHAT ─────────────────────────────────────────────────────
    [A.OPEN_CHAT]: (payload = {}) => {
      logAction(A.OPEN_CHAT, payload);
      const { recipient, recipientId, name, avatar, ...rest } = payload;
      const rec = recipient ?? (recipientId ? {
        id: recipientId,
        display_name: name ?? "Creator",
        avatar_url: avatar ?? null,
        ...rest,
      } : chatRecipient);
      if (rec) setChatRecipient?.(rec);
      // Phase 2: wenn Profil offen war → Return merken
      // NICHT setShowWirker(null) — Profil bleibt gemounted (LOOP 1)
      flowStore?.push({ surface: "chat", recipient: rec });
      setShowChat?.(true);
    },

    [A.CLOSE_CHAT]: () => {
      logAction(A.CLOSE_CHAT);
      setShowChat?.(false);
    },

    [A.SEND_MESSAGE]: (payload = {}) => {
      logAction(A.SEND_MESSAGE, payload);
      // Opens chat — actual send handled inside ChatCenter
      actions[A.OPEN_CHAT](payload);
    },

    // ── EXPERIENCES ───────────────────────────────────────────────
    [A.OPEN_EXPERIENCE]: (payload = {}) => {
      logAction(A.OPEN_EXPERIENCE, payload);
      const { experience, creatorId } = payload;
      // Open the creator profile and highlight the experience
      if (creatorId || experience?.creator_id) {
        actions[A.OPEN_PROFILE]({
          creatorId: creatorId ?? experience?.creator_id,
          _highlightExp: experience?.id ?? null,
        });
      } else {
        // No creator context — open connect sheet
        actions[A.OPEN_CONNECT]({ intent: "experience", experience });
      }
    },

    [A.BOOK_EXPERIENCE]: (payload = {}) => {
      logAction(A.BOOK_EXPERIENCE, payload);
      const { experience, creator } = payload;
      // Set recipient for booking chat
      if (creator) setChatRecipient?.(creator);
      setShowConnect?.(true);
    },

    [A.CREATE_EXPERIENCE]: (payload = {}) => {
      logAction(A.CREATE_EXPERIENCE, payload);
      setShowExperienceCreator?.(true);
    },

    // ── IMPACT ────────────────────────────────────────────────────
    [A.OPEN_IMPACT]: (payload = {}) => {
      logAction(A.OPEN_IMPACT, payload);
      switchTab?.("impact");
    },

    [A.SEND_RESONANCE]: (payload = {}) => {
      logAction(A.SEND_RESONANCE, payload);
      // Fire-and-forget resonance — actual write handled by caller
      // Payload: { targetId, type: "profile"|"moment"|"experience" }
      if (isDev) console.log("[HUI] Resonance sent:", payload);
    },

    // ── SOCIAL ────────────────────────────────────────────────────
    [A.FOLLOW_CREATOR]: (payload = {}) => {
      logAction(A.FOLLOW_CREATOR, payload);
      // Payload: { creatorId, following: boolean }
      // Actual Supabase write handled by caller
      if (isDev) console.log("[HUI] Follow toggled:", payload);
    },

    [A.SHARE_MOMENT]: (payload = {}) => {
      logAction(A.SHARE_MOMENT, payload);
      const { url, title, text } = payload;
      if (typeof navigator !== "undefined" && navigator.share) {
        navigator.share({ url, title, text }).catch(() => {});
      } else {
        // Fallback: open share overlay
        setShowStoryComposer?.(true);
      }
    },

    // ── ORB / OVERLAYS ────────────────────────────────────────────
    [A.OPEN_ORB]: (payload = {}) => {
      logAction(A.OPEN_ORB, payload);
      setShowPlusSheet?.(true);
      openOrbWorld?.(payload?.world ?? null);
    },

    [A.CLOSE_ORB]: () => {
      logAction(A.CLOSE_ORB);
      setShowPlusSheet?.(false);
      closeOrbWorld?.();
    },

    [A.OPEN_BOOKING]: (payload = {}) => {
      logAction(A.OPEN_BOOKING, payload);
      if (payload?.recipient) setChatRecipient?.(payload.recipient);
      setShowConnect?.(true);
    },

    [A.OPEN_CONNECT]: (payload = {}) => {
      logAction(A.OPEN_CONNECT, payload);
      setShowConnect?.(true);
    },

    [A.OPEN_NOTIFICATIONS]: () => {
      logAction(A.OPEN_NOTIFICATIONS);
      setShowNotifs?.(true);
    },

    [A.OPEN_MAP]: () => {
      logAction(A.OPEN_MAP);
      setShowMap?.(true);
    },

    [A.OPEN_MATCH]: () => {
      logAction(A.OPEN_MATCH);
      setShowMatch?.(true);
    },

    // ── WORLDS / ROOMS ────────────────────────────────────────────
    [A.OPEN_WORLD]: (payload = {}) => {
      logAction(A.OPEN_WORLD, payload);
      openOrbWorld?.(payload?.world ?? null);
      setShowPlusSheet?.(true);
    },

    [A.OPEN_ROOM]: (payload = {}) => {
      logAction(A.OPEN_ROOM, payload);
      // Future: dedicated room overlay
      // For now: open creator profile at "raum" tab
      if (payload?.creatorId) {
        actions[A.OPEN_PROFILE]({ creatorId: payload.creatorId, _tab: "raum" });
      } else {
        openOrbWorld?.("raum");
        setShowPlusSheet?.(true);
      }
    },

    [A.OPEN_COMMUNITY]: (payload = {}) => {
      logAction(A.OPEN_COMMUNITY, payload);
      switchTab?.("community");
    },

    // ── CREATOR TOOLS ─────────────────────────────────────────────
    [A.OPEN_STORY_COMPOSER]: () => {
      logAction(A.OPEN_STORY_COMPOSER);
      setShowStoryComposer?.(true);
    },

    [A.OPEN_IMPACT_FLOW]: () => {
      logAction(A.OPEN_IMPACT_FLOW);
      setShowImpactFlow?.(true);
    },

    [A.OPEN_CREATE_FLOW]: (payload = {}) => {
      logAction(A.OPEN_CREATE_FLOW, payload);
      setShowCreateFlow?.(true);
    },

    [A.OPEN_CALENDAR]: () => {
      logAction(A.OPEN_CALENDAR);
      // Future: calendar overlay
      if (isDev) console.log("[HUI] Calendar — coming soon");
    },

    // ── TAB NAVIGATION ────────────────────────────────────────────
    [A.GO_TO_TAB]: (payload = {}) => {
      const tab = typeof payload === "string" ? payload : payload?.tab ?? "feed";
      logAction(A.GO_TO_TAB, { tab });
      switchTab?.(tab);
    },

    [A.GO_HOME]:      () => { logAction(A.GO_HOME);      switchTab?.("feed");      },
    [A.GO_DISCOVER]:  () => { logAction(A.GO_DISCOVER);  switchTab?.("discover");  },
    [A.GO_IMPACT]:    () => { logAction(A.GO_IMPACT);    switchTab?.("impact");    },
    [A.GO_FAVORITES]: () => { logAction(A.GO_FAVORITES); switchTab?.("favorites"); },
  };

  return actions;
}
