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
import { validate, SOURCE } from "./hui.contracts.js";
import { S, SURFACE_LABEL } from "./hui.sources.js";
import { ECHO, flowSignal } from "./hui.flow.states.js";
import {
  normalizeRecipient,
  normalizeCreator,
  normalizeExperience,
  checkSemantics,
  INTENT,
} from "./hui.semantics.js";

// ─── Action log (dev mode) ─────────────────────────────────────────
const isDev = import.meta.env?.DEV ?? false;

function logAction(name, payload) {
  if (isDev) {
    var src = payload?.source;
    var srcLabel = src ? (" from " + src) : "";
    console.log(
      "%c[HUI_ACTION]%c " + name + srcLabel,
      "color:#0DC4B5;font-weight:800",
      "color:#1a1a2e;font-weight:600",
      payload ?? ""
    );
  }
}

function logFlow(from, to, extra) {
  if (!isDev) return;
  var LABELS = SURFACE_LABEL || {};
  var f = LABELS[from] || from || "?";
  var t = LABELS[to]   || to   || "?";
  console.log("%c[HUI_FLOW]%c " + f + " → " + t,
    "color:#A78BFA;font-weight:700", "color:#4B5563", extra || "");
}

function logReturn(from, to) {
  if (!isDev) return;
  var LABELS = SURFACE_LABEL || {};
  var f = LABELS[from] || from || "?";
  var t = LABELS[to]   || to   || "?";
  console.log("%c[HUI_RETURN]%c ← " + f + " → " + t,
    "color:#F59E0B;font-weight:700", "color:#4B5563");
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
    // Role
    isTalent,
    // Overlays
    setShowPlusSheet,
    setShowMembership,
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
  function closeAll(callerAction) {
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
    [A.OPEN_PROFILE]: (rawPayload) => {
      const payload = validate("OPEN_PROFILE", rawPayload);
      if (!payload) return;
      logAction(A.OPEN_PROFILE, payload);
      // Defensive destructure — source immer mit Fallback (Phase 4G+)
      const safePayload = (payload && typeof payload === 'object') ? payload : {};
      const { creator, creatorId, source: rawSource, ...rest } = safePayload;
      const source = (typeof rawSource === 'string' && rawSource.length > 0) ? rawSource : S.SYSTEM;
      // Guard: Feed-Items haben type+author — nie direkt als Profil verwenden
      const rawCreator = creator || { id: creatorId, user_id: creatorId, ...rest };
      const isFeedItem = rawCreator?.type && rawCreator?.author && typeof rawCreator.author === 'object';
      const data = isFeedItem
        ? { id: rawCreator.author.id, user_id: rawCreator.author.id,
            display_name: rawCreator.author.name, avatar_url: rawCreator.author.avatar,
            username: rawCreator.author.username, talent: rawCreator.author.talent,
            is_verified: rawCreator.author.verified, _raw: rawCreator.author }
        : rawCreator;
      // Phase 2: Flow Stack — merke Navigations-Ursprung
      logFlow(source, S.VISITOR_PROFILE);
      flowStore?.push({ surface: S.VISITOR_PROFILE, creatorId: creatorId ?? data?.id, creator: data, source });
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
    [A.OPEN_CHAT]: (rawPayload) => {
      const payload = validate("OPEN_CHAT", rawPayload);
      if (!payload) return;
      logAction(A.OPEN_CHAT, payload);
      const { recipient, recipientId, name, avatar, ...rest } = payload;
      // Semantic: normalizeRecipient schützt vor rohen Supabase-Objekten
      var rawRec = recipient ?? (recipientId ? {
        id: recipientId,
        display_name: name ?? null,
        avatar_url: avatar ?? null,
        ...rest,
      } : null);
      const rec = rawRec ? normalizeRecipient(rawRec) : null;
      if (rec) setChatRecipient?.(rec);
      // Semantic guard (DEV): prüft ob der Chat-Payload vollständig ist
      checkSemantics("OPEN_CHAT", { recipient: rec, source: payload?.source || S.SYSTEM });
      // Phase 2: wenn Profil offen war → Return merken
      // NICHT setShowWirker(null) — Profil bleibt gemounted (LOOP 1)
      const chatSource = payload?.source || S.SYSTEM;
      logFlow(chatSource, S.CHAT);
      flowStore?.push({ surface: S.CHAT, recipient: rec, source: chatSource });
      setShowChat?.(true);
    },

    [A.CLOSE_CHAT]: () => {
      logAction(A.CLOSE_CHAT);
      setShowChat?.(false);
    },

    [A.SEND_MESSAGE]: (rawPayload) => {
      const payload = validate("SEND_MESSAGE", rawPayload);
      if (!payload) return;
      logAction(A.SEND_MESSAGE, payload);
      // Opens chat — actual send handled inside ChatCenter
      actions[A.OPEN_CHAT](payload);
    },

    // ── EXPERIENCES ───────────────────────────────────────────────
    [A.OPEN_EXPERIENCE]: (rawPayload) => {
      const payload = validate("OPEN_EXPERIENCE", rawPayload);
      if (!payload) return;
      logAction(A.OPEN_EXPERIENCE, payload);
      const { experience, creatorId } = payload;
      // Open the creator profile and highlight the experience
      if (creatorId || experience?.creator_id) {
        actions[A.OPEN_PROFILE]({
          creatorId: creatorId ?? experience?.creator_id,
          _highlightExp: experience?.id ?? null,
          source: payload.source || S.SYSTEM,  // source durchreichen
          intent: INTENT.EXPLORE,              // semantic intent
        });
      } else {
        // No creator context — open connect sheet
        actions[A.OPEN_CONNECT]({ intent: "experience", experience });
      }
    },

    [A.BOOK_EXPERIENCE]: (rawPayload) => {
      const payload = validate("BOOK_EXPERIENCE", rawPayload);
      if (!payload) return;
      logAction(A.BOOK_EXPERIENCE, payload);
      const { experience, creator } = payload;
      // Semantic: normalizeCreator → sicheres Recipient-Objekt für Booking-Chat
      const safeExp  = normalizeExperience(experience);
      const safeCr   = creator ? normalizeCreator(creator) : null;
      // Semantic guard (DEV)
      checkSemantics("BOOK_EXPERIENCE", { experience: safeExp, creator: safeCr, source: payload?.source || S.SYSTEM });
      // Set recipient so Connect-Sheet weiß wer gebucht wird
      if (safeCr) setChatRecipient?.(safeCr);
      // Flow-Log
      const bookSource = payload?.source || S.SYSTEM;
      logFlow(bookSource, S.BOOKING, safeCr ? { to: safeCr.display_name } : null);
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

    [A.SEND_RESONANCE]: (rawPayload) => {
      const payload = validate("SEND_RESONANCE", rawPayload);
      if (!payload) return;
      logAction(A.SEND_RESONANCE, payload);
      // Semantic guard (DEV)
      checkSemantics("SEND_RESONANCE", payload);
      // Fire-and-forget resonance — actual write handled by caller
      // Payload: { targetId, type: "profile"|"moment"|"experience" }
      flowSignal.emit("echo", { type: ECHO.SOFT_GLOW, action: A.SEND_RESONANCE, data: payload });
    },

    // ── SOCIAL ────────────────────────────────────────────────────
    [A.FOLLOW_CREATOR]: (rawPayload) => {
      const payload = validate("FOLLOW_CREATOR", rawPayload);
      if (!payload) return;
      logAction(A.FOLLOW_CREATOR, payload);
      // Semantic guard (DEV)
      checkSemantics("FOLLOW_CREATOR", payload);
      // Actual Supabase write handled by caller — Signal für UI-Echo
      flowSignal.emit("echo", { type: ECHO.WARMTH, action: A.FOLLOW_CREATOR, data: payload });
    },

    [A.SHARE_MOMENT]: (rawPayload) => {
      const payload = validate("SHARE_MOMENT", rawPayload);
      if (!payload) return;
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
      // ROLE GATE: BasisUser → membership flow, never PlusSheet
      if (!isTalent) {
        console.log("[HUI ACTION OPEN_ORB] BasisUser → membership flow");
        setShowMembership?.(true);
        return;
      }
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
      // DEAKTIVIERT: NotificationCenter.jsx ist abgeschaltet.
      // Notification-Zugang läuft über NotificationButton → ResonanzzentrumPanel.
      // Action ist absichtlich noop — kein setShowNotifs mehr.
      logAction(A.OPEN_NOTIFICATIONS);
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
