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
import { validateAction } from "./hui.contracts.js";
import { S, SURFACE_LABEL } from "./hui.sources.js";
import { ECHO, flowSignal } from "./hui.flow.states.js";
import {
  normalizeRecipient,
  normalizeCreator,
  normalizeExperience,
  checkSemantics,
  INTENT,
} from "./hui.semantics.js";
import { SAFE_MODE } from "../config/safeMode.js";

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
  OPEN_WERK:            "OPEN_WERK",
  OPEN_MOMENT:          "OPEN_MOMENT",

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
  OPEN_EARNINGS:        "OPEN_EARNINGS",
  OPEN_EXPERIENCE_MANAGER: "OPEN_EXPERIENCE_MANAGER",
  OPEN_NOTIFICATIONS_SETTINGS: "OPEN_NOTIFICATIONS_SETTINGS",
  FILTER_CATEGORY:      "FILTER_CATEGORY",

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
      return false;
    };
    return Object.fromEntries(Object.values(A).map(k => [k, noop(k)]));
  }
  return ctx;
}

// ─── Factory: build action map from HomeShell context ─────────────
// Called once in HuiActionProvider. Returns stable action object.
export function buildActions(shell) {
  const {
    user,
    tab,
    isMember,
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
    setShowMembership,
    setShowNotifs,
    setShowMap,
    setShowMatch,
    setShowTeilen,
    setShowTalentFlow,
    setShowWerkPublisher,
    setShowStoryComposer,
    setShowImpactFlow,
    setShowExperienceCreator,
    setShowContentSelector,
    setShowInvitationFlow,
    // Tabs
    switchTab,
    // Orb
    openOrbWorld,
    closeOrbWorld,
    // World / cleanup
    openSurface,
    closeSurface,
    centralCloseFlow,
  } = shell;

  function closeAll(reason = "action-close", opts = {}) {
    if (typeof centralCloseFlow === "function") {
      centralCloseFlow(reason, opts);
      return;
    }
    setShowWirker?.(null);
    setShowChat?.(false);
    setChatRecipient?.(null);
    setShowPlusSheet?.(false);
    setShowConnect?.(false);
    setShowMembership?.(false);
    setShowNotifs?.(false);
    setShowMap?.(false);
    setShowMatch?.(false);
    setShowTeilen?.(false);
    setShowTalentFlow?.(false);
    setShowWerkPublisher?.(false);
    setShowStoryComposer?.(false);
    setShowImpactFlow?.(false);
    setShowExperienceCreator?.(false);
    setShowContentSelector?.(false);
    setShowInvitationFlow?.(false);
    closeSurface?.(null, reason);
    closeOrbWorld?.(reason);
    flowStore?.clear?.(reason);
  }

  function makeAction(actionId, handler, runtime = {}) {
    return (rawPayload) => {
      const checked = validateAction(actionId, rawPayload, {
        hasAuth: Boolean(user?.id || user),
        isMounted: true,
        handlerExists: typeof handler === "function",
        ...runtime,
      });
      if (!checked) return false;
      logAction(actionId, checked.action);
      try {
        const result = handler(checked.payload, checked.action);
        if (result === false) {
          console.error("[HUI_ACTION_RUNTIME] " + actionId + ": Handler ohne Runtime-Effekt beendet.", checked.action);
          return false;
        }
        return true;
      } catch (error) {
        console.error("[HUI_ACTION_RUNTIME] " + actionId + ": Handler failed", {
          message: error?.message,
          stack: error?.stack,
          action: checked.action,
        });
        return false;
      }
    };
  }

  // ── action map ────────────────────────────────────────────────────
  const actions = {

    // ── PROFILE ──────────────────────────────────────────────────
    [A.OPEN_PROFILE]: makeAction(A.OPEN_PROFILE, (payload) => {
      // Defensive destructure — source immer mit Fallback (Phase 4G+)
      const safePayload = (payload && typeof payload === 'object') ? payload : {};
      const { creator, creatorId, source: rawSource, ...rest } = safePayload;
      const source = (typeof rawSource === 'string' && rawSource.length > 0) ? rawSource : S.SYSTEM;
      const data = creator
        ? creator
        : { id: creatorId, user_id: creatorId, ...rest };
      closeAll("open-profile", { preserveReturnProfile: true });
      // Phase 2: Flow Stack — merke Navigations-Ursprung
      logFlow(source, S.VISITOR_PROFILE);
      flowStore?.push({ surface: S.VISITOR_PROFILE, creatorId: creatorId ?? data?.id, creator: data, source });
      setShowWirker?.(data);
    }),

    [A.OPEN_OWN_PROFILE]: makeAction(A.OPEN_OWN_PROFILE, () => {
      closeAll("open-own-profile", { preserveReturnProfile: false });
      openOwnProfile?.();
    }),

    [A.CLOSE_PROFILE]: makeAction(A.CLOSE_PROFILE, () => {
      setShowWirker?.(null);
      flowStore?.pop?.();
    }),

    // ── CHAT ─────────────────────────────────────────────────────
    [A.OPEN_CHAT]: makeAction(A.OPEN_CHAT, (payload) => {
      const { recipient, recipientId, name, avatar, ...rest } = payload;
      // Semantic: normalizeRecipient schützt vor rohen Supabase-Objekten
      var rawRec = recipient ?? (recipientId ? {
        id: recipientId,
        display_name: name ?? null,
        avatar_url: avatar ?? null,
        ...rest,
      } : chatRecipient);
      const rec = rawRec ? normalizeRecipient(rawRec) : null;
      closeAll("open-chat", {
        preserveProfile: payload?.source === S.VISITOR_PROFILE || Boolean(payload?.returnProfile),
        preserveReturnProfile: true,
      });
      if (rec) setChatRecipient?.(rec);
      // Semantic guard (DEV): prüft ob der Chat-Payload vollständig ist
      checkSemantics("OPEN_CHAT", { recipient: rec, source: payload?.source || S.SYSTEM });
      // Phase 2: wenn Profil offen war → Return merken
      // NICHT setShowWirker(null) — Profil bleibt gemounted (LOOP 1)
      const chatSource = payload?.source || S.SYSTEM;
      if (chatSource === S.VISITOR_PROFILE && payload?.returnProfile) {
        flowStore?.setReturnProfile?.(payload.returnProfile);
      }
      logFlow(chatSource, S.CHAT);
      flowStore?.push({ surface: S.CHAT, recipient: rec, source: chatSource });
      setShowChat?.(true);
    }),

    [A.CLOSE_CHAT]: makeAction(A.CLOSE_CHAT, () => {
      setShowChat?.(false);
      setChatRecipient?.(null);
    }),

    [A.SEND_MESSAGE]: makeAction(A.SEND_MESSAGE, (payload) => {
      // Opens chat — actual send handled inside ChatCenter
      return actions[A.OPEN_CHAT](payload);
    }),

    // ── EXPERIENCES ───────────────────────────────────────────────
    [A.OPEN_EXPERIENCE]: makeAction(A.OPEN_EXPERIENCE, (payload) => {
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
        return actions[A.OPEN_CONNECT]({ intent: "experience", experience, source: payload.source || S.SYSTEM });
      }
    }),

    [A.BOOK_EXPERIENCE]: makeAction(A.BOOK_EXPERIENCE, (payload) => {
      const { experience, creator } = payload;
      // Semantic: normalizeCreator → sicheres Recipient-Objekt für Booking-Chat
      const safeExp  = normalizeExperience(experience);
      const safeCr   = creator ? normalizeCreator(creator) : null;
      // Semantic guard (DEV)
      checkSemantics("BOOK_EXPERIENCE", { experience: safeExp, creator: safeCr, source: payload?.source || S.SYSTEM });
      closeAll("open-booking", { preserveProfile: true, preserveReturnProfile: true });
      // Set recipient so Connect-Sheet weiß wer gebucht wird
      if (safeCr) setChatRecipient?.(safeCr);
      // Flow-Log
      const bookSource = payload?.source || S.SYSTEM;
      logFlow(bookSource, S.BOOKING, safeCr ? { to: safeCr.display_name } : null);
      setShowConnect?.(true);
    }),

    [A.CREATE_EXPERIENCE]: makeAction(A.CREATE_EXPERIENCE, () => {
      closeAll("create-experience");
      setShowExperienceCreator?.(true);
    }),

    // ── IMPACT ────────────────────────────────────────────────────
    [A.OPEN_IMPACT]: makeAction(A.OPEN_IMPACT, () => {
      switchTab?.("impact");
    }),

    [A.SEND_RESONANCE]: makeAction(A.SEND_RESONANCE, (payload) => {
      // Semantic guard (DEV)
      checkSemantics("SEND_RESONANCE", payload);
      // Fire-and-forget resonance — actual write handled by caller
      // Payload: { targetId, type: "profile"|"moment"|"experience" }
      flowSignal.emit("echo", { type: ECHO.SOFT_GLOW, action: A.SEND_RESONANCE, data: payload });
    }),

    // ── SOCIAL ────────────────────────────────────────────────────
    [A.FOLLOW_CREATOR]: makeAction(A.FOLLOW_CREATOR, (payload) => {
      // Semantic guard (DEV)
      checkSemantics("FOLLOW_CREATOR", payload);
      // Actual Supabase write handled by caller — Signal für UI-Echo
      flowSignal.emit("echo", { type: ECHO.WARMTH, action: A.FOLLOW_CREATOR, data: payload });
    }),

    [A.SHARE_MOMENT]: makeAction(A.SHARE_MOMENT, (payload) => {
      const { url, title, text } = payload;
      if (typeof navigator !== "undefined" && navigator.share) {
        navigator.share({ url, title, text }).catch((error) => {
          console.error("[HUI_ACTION_RUNTIME] SHARE_MOMENT failed", error);
        });
      } else {
        // Fallback: open share overlay
        closeAll("share-moment");
        setShowStoryComposer?.(true);
      }
    }),

    [A.OPEN_WERK]: makeAction(A.OPEN_WERK, (payload) => {
      const werk = payload?.werk || null;
      const creator = werk?.profile || werk?.creator || null;
      const creatorId = werk?.creator_id || werk?.user_id || creator?.id || creator?.user_id || werk?.id;
      if (werk || creatorId || creator) {
        const creatorPayload = (creator && typeof creator === "object")
          ? creator
          : {
              id: creatorId,
              user_id: creatorId,
              display_name: werk?.creator || werk?.name || werk?.title || "Werk",
              avatar_url: werk?.creatorImg || werk?.creator_img || werk?.avatar_url || null,
              _highlightWerk: werk?.id || payload?.werkId || null,
            };
        return actions[A.OPEN_PROFILE]({
          creatorId,
          creator: creatorPayload,
          source: payload.source || S.DISCOVER,
          _highlightWerk: werk?.id || payload?.werkId || null,
        });
      }
      if (payload?.view) {
        switchTab?.("discover");
        return true;
      }
      console.error("[HUI_ACTION_RUNTIME] OPEN_WERK ohne werk/view kann keinen Runtime-Effekt ausfuehren.", payload);
      return false;
    }),

    [A.OPEN_MOMENT]: makeAction(A.OPEN_MOMENT, (payload) => {
      if (payload?.moment || payload?.momentId) {
        closeAll("open-moment");
        setShowStoryComposer?.(true);
        return true;
      }
      console.error("[HUI_ACTION_RUNTIME] OPEN_MOMENT ist deprecated ohne Moment-Entity.", payload);
      return false;
    }),

    // ── ORB / OVERLAYS ────────────────────────────────────────────
    [A.OPEN_ORB]: makeAction(A.OPEN_ORB, (payload) => {
      closeAll("open-orb");

      if (!isMember) {
        openSurface?.("membership");
        setShowMembership?.(true);
        return true;
      }

      if (!SAFE_MODE.orb) {
        console.error("[HUI_ACTION_RUNTIME] OPEN_ORB abgebrochen: SAFE_MODE.orb=false");
        return false;
      }

      openSurface?.("orb");
      openOrbWorld?.({
        source: payload?.source || "orb-button",
        originTab: payload?.originTab || tab || "feed",
        worldTemperature: payload?.worldTemperature || "calm_flowing",
      });
      setShowContentSelector?.(true);
      return true;
    }),

    [A.CLOSE_ORB]: makeAction(A.CLOSE_ORB, () => {
      setShowPlusSheet?.(false);
      setShowContentSelector?.(false);
      closeSurface?.("orb", "action-close");
      closeOrbWorld?.("action-close");
    }),

    [A.OPEN_BOOKING]: makeAction(A.OPEN_BOOKING, (payload) => {
      closeAll("open-booking", { preserveProfile: true, preserveReturnProfile: true });
      if (payload?.recipient) setChatRecipient?.(payload.recipient);
      setShowConnect?.(true);
    }),

    [A.OPEN_CONNECT]: makeAction(A.OPEN_CONNECT, () => {
      closeAll("open-connect", { preserveProfile: true, preserveReturnProfile: true });
      setShowConnect?.(true);
    }),

    [A.OPEN_NOTIFICATIONS]: makeAction(A.OPEN_NOTIFICATIONS, () => {
      closeAll("open-notifications");
      setShowNotifs?.(true);
    }),

    [A.OPEN_MAP]: makeAction(A.OPEN_MAP, () => {
      closeAll("open-map");
      setShowMap?.(true);
    }),

    [A.OPEN_MATCH]: makeAction(A.OPEN_MATCH, () => {
      closeAll("open-match");
      setShowMatch?.(true);
    }),

    // ── WORLDS / ROOMS ────────────────────────────────────────────
    [A.OPEN_WORLD]: makeAction(A.OPEN_WORLD, (payload) => {
      return actions[A.OPEN_ORB]({ ...payload, source: payload.source || S.ORB });
    }),

    [A.OPEN_ROOM]: makeAction(A.OPEN_ROOM, (payload) => {
      // Future: dedicated room overlay
      // For now: open creator profile at "raum" tab
      if (payload?.creatorId) {
        return actions[A.OPEN_PROFILE]({ creatorId: payload.creatorId, _tab: "raum", source: payload.source || S.SYSTEM });
      } else {
        return actions[A.OPEN_ORB]({ ...payload, source: payload.source || S.ORB, worldTemperature: "calm_flowing" });
      }
    }),

    [A.OPEN_COMMUNITY]: makeAction(A.OPEN_COMMUNITY, () => {
      switchTab?.("discover");
    }),

    // ── CREATOR TOOLS ─────────────────────────────────────────────
    [A.OPEN_STORY_COMPOSER]: makeAction(A.OPEN_STORY_COMPOSER, () => {
      closeAll("open-story-composer");
      setShowStoryComposer?.(true);
    }),

    [A.OPEN_IMPACT_FLOW]: makeAction(A.OPEN_IMPACT_FLOW, () => {
      closeAll("open-impact-flow");
      setShowImpactFlow?.(true);
    }),

    [A.OPEN_CREATE_FLOW]: makeAction(A.OPEN_CREATE_FLOW, () => {
      closeAll("open-create-flow");
      setShowCreateFlow?.(true);
    }),

    [A.OPEN_CALENDAR]: makeAction(A.OPEN_CALENDAR, () => false),
    [A.OPEN_EARNINGS]: makeAction(A.OPEN_EARNINGS, () => false),
    [A.OPEN_EXPERIENCE_MANAGER]: makeAction(A.OPEN_EXPERIENCE_MANAGER, () => false),
    [A.OPEN_NOTIFICATIONS_SETTINGS]: makeAction(A.OPEN_NOTIFICATIONS_SETTINGS, () => false),
    [A.FILTER_CATEGORY]: makeAction(A.FILTER_CATEGORY, () => true),

    // ── TAB NAVIGATION ────────────────────────────────────────────
    [A.GO_TO_TAB]: makeAction(A.GO_TO_TAB, (payload = {}) => {
      const tab = typeof payload === "string" ? payload : payload?.tab ?? "feed";
      switchTab?.(tab);
    }),

    [A.GO_HOME]:      makeAction(A.GO_HOME,      () => { switchTab?.("feed");      }),
    [A.GO_DISCOVER]:  makeAction(A.GO_DISCOVER,  () => { switchTab?.("discover");  }),
    [A.GO_IMPACT]:    makeAction(A.GO_IMPACT,    () => { switchTab?.("impact");    }),
    [A.GO_FAVORITES]: makeAction(A.GO_FAVORITES, () => { switchTab?.("favorites"); }),
  };

  return actions;
}
