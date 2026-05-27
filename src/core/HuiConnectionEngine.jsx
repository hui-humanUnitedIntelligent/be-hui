// src/core/HuiConnectionEngine.jsx — HUI Phase 2.5
// "A living emotional ecosystem where everything naturally flows together."
// ══════════════════════════════════════════════════════════════════════
//
// THE CONNECTION ENGINE transforms isolated screens into one living world.
//
// WHAT IT PROVIDES:
//   1. Unified Intent System — every meaningful action flows through here
//   2. Context Bridges — profile ↔ encounter ↔ project ↔ impact
//   3. Connection State — who has connected with whom, what follows what
//   4. Flow Memory — natural handoffs between sections
//   5. Ambient World State — the platform feels alive and aware
//
// USAGE:
//   const engine = useConnectionEngine();
//   engine.connect(personId);           // Connect with a human
//   engine.joinEncounter(encounterId);  // Join a gathering
//   engine.supportProject(projectId);  // Back an initiative
//   engine.shareImpact(amount);         // Send positive energy
//   engine.getContext(id);              // What do we know about this entity?
//
// ══════════════════════════════════════════════════════════════════════

import React, {
  createContext, useContext, useReducer, useCallback,
  useEffect, useRef, useMemo,
} from "react";
import { supabase } from "../lib/supabaseClient.js";

// ── Types ──────────────────────────────────────────────────────────
export const INTENT = {
  // Human connection
  CONNECT:         "CONNECT",          // Request a meaningful connection
  FOLLOW:          "FOLLOW",           // Follow someone's journey
  UNFOLLOW:        "UNFOLLOW",
  SEND_MESSAGE:    "SEND_MESSAGE",     // Open direct conversation
  VIEW_PROFILE:    "VIEW_PROFILE",     // Deep dive into a person's world

  // Encounters
  JOIN_ENCOUNTER:  "JOIN_ENCOUNTER",   // Attend a gathering
  LEAVE_ENCOUNTER: "LEAVE_ENCOUNTER",
  CREATE_ENCOUNTER:"CREATE_ENCOUNTER", // Host your own
  SHARE_ENCOUNTER: "SHARE_ENCOUNTER",  // Bring others in

  // Projects
  SUPPORT_PROJECT: "SUPPORT_PROJECT",  // Back an initiative
  JOIN_PROJECT:    "JOIN_PROJECT",     // Become a member
  CREATE_PROJECT:  "CREATE_PROJECT",   // Start something new

  // Impact
  SEND_IMPACT:     "SEND_IMPACT",      // Transfer positive energy
  VOTE_PROJECT:    "VOTE_PROJECT",     // Democratic impact voting

  // Discovery
  EXPLORE_CATEGORY:"EXPLORE_CATEGORY", // Browse a theme
  BOOKMARK:        "BOOKMARK",         // Save for later
};

export const CONNECTION_STATE = {
  NONE:      "none",
  PENDING:   "pending",    // Request sent, awaiting response
  CONNECTED: "connected",  // Mutual connection
  FOLLOWING: "following",  // One-way follow
};

// ── Initial State ──────────────────────────────────────────────────
const INITIAL = {
  // Connection graph
  connections: {},    // { [userId]: CONNECTION_STATE }
  followed:    {},    // { [userId]: true }
  bookmarks:   {},    // { [entityId]: { type, data, savedAt } }

  // Encounter participation
  joinedEncounters: {},  // { [encounterId]: { joinedAt, ...enc } }

  // Project participation
  supportedProjects: {}, // { [projectId]: { amount, joinedAt } }

  // Context cache — what we know about entities
  contextCache: {},   // { [id]: { type, profile | encounter | project, loadedAt } }

  // Flow state — where the user is coming from / going to
  currentFlow: null,  // { from, to, intent, payload }
  flowHistory: [],    // last 10 flows

  // Ambient — what's happening in the world right now
  ambientActivity: [], // recent meaningful actions (anonymized)
  worldEnergy: 0,      // 0-100 — how alive is HUI right now

  // Pending intents — optimistic UI
  pendingIntents: {},  // { [intentId]: { intent, payload, state } }
};

// ── Reducer ────────────────────────────────────────────────────────
function engineReducer(state, action) {
  switch (action.type) {

    case "SET_CONNECTION": {
      const { userId, connectionState } = action;
      return { ...state, connections: { ...state.connections, [userId]: connectionState } };
    }

    case "SET_FOLLOWED": {
      const { userId, followed } = action;
      return { ...state, followed: { ...state.followed, [userId]: followed } };
    }

    case "JOIN_ENCOUNTER": {
      const { encounterId, enc } = action;
      return { ...state, joinedEncounters: {
        ...state.joinedEncounters,
        [encounterId]: { ...enc, joinedAt: Date.now() }
      }};
    }

    case "LEAVE_ENCOUNTER": {
      const next = { ...state.joinedEncounters };
      delete next[action.encounterId];
      return { ...state, joinedEncounters: next };
    }

    case "SUPPORT_PROJECT": {
      const { projectId, project } = action;
      return { ...state, supportedProjects: {
        ...state.supportedProjects,
        [projectId]: { ...project, supportedAt: Date.now() }
      }};
    }

    case "BOOKMARK": {
      const { entityId, type, data } = action;
      const next = { ...state.bookmarks };
      if (next[entityId]) {
        delete next[entityId];
      } else {
        next[entityId] = { type, data, savedAt: Date.now() };
      }
      return { ...state, bookmarks: next };
    }

    case "CACHE_CONTEXT": {
      const { id, type, data } = action;
      return { ...state, contextCache: {
        ...state.contextCache,
        [id]: { type, data, loadedAt: Date.now() }
      }};
    }

    case "SET_FLOW": {
      const { from, to, intent, payload } = action;
      const flow = { from, to, intent, payload, at: Date.now() };
      return {
        ...state,
        currentFlow: flow,
        flowHistory: [flow, ...state.flowHistory].slice(0, 10),
      };
    }

    case "SET_AMBIENT": {
      return {
        ...state,
        ambientActivity: action.activity,
        worldEnergy: action.energy ?? state.worldEnergy,
      };
    }

    case "PENDING_INTENT": {
      const { intentId, intent, payload } = action;
      return { ...state, pendingIntents: {
        ...state.pendingIntents,
        [intentId]: { intent, payload, state: "pending", at: Date.now() }
      }};
    }

    case "RESOLVE_INTENT": {
      const next = { ...state.pendingIntents };
      delete next[action.intentId];
      return { ...state, pendingIntents: next };
    }

    default:
      return state;
  }
}

// ── Context ────────────────────────────────────────────────────────
const EngineCtx = createContext(null);

export function useConnectionEngine() {
  const ctx = useContext(EngineCtx);
  if (!ctx) {
    // Graceful fallback — never crash
    return {
      state: INITIAL,
      connect: () => {},
      follow: () => {},
      unfollow: () => {},
      joinEncounter: () => {},
      leaveEncounter: () => {},
      supportProject: () => {},
      bookmark: () => {},
      isFollowed: () => false,
      isConnected: () => false,
      hasJoined: () => false,
      isBookmarked: () => false,
      getContext: () => null,
      setFlow: () => {},
      getFlowContext: () => null,
    };
  }
  return ctx;
}

// Shorthand hooks
export function useFollow(userId) {
  const engine = useConnectionEngine();
  return {
    followed: engine.isFollowed(userId),
    toggle:   () => engine.isFollowed(userId) ? engine.unfollow(userId) : engine.follow(userId),
  };
}

export function useEncounterJoin(encounterId) {
  const engine = useConnectionEngine();
  return {
    joined: engine.hasJoined(encounterId),
    toggle: (enc) => engine.hasJoined(encounterId)
      ? engine.leaveEncounter(encounterId)
      : engine.joinEncounter(encounterId, enc),
  };
}

export function useBookmark(entityId, type) {
  const engine = useConnectionEngine();
  return {
    bookmarked: engine.isBookmarked(entityId),
    toggle: (data) => engine.bookmark(entityId, type, data),
  };
}

// ── Provider ───────────────────────────────────────────────────────
export default function HuiConnectionEngine({ children }) {
  const [state, dispatch] = useReducer(engineReducer, INITIAL);
  const userId = useRef(null); // set from auth

  // Hydrate connection state from localStorage (fast, optimistic)
  useEffect(() => {
    try {
      const saved = localStorage.getItem("hui_connections_v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.followed) {
          Object.entries(parsed.followed).forEach(([id, v]) => {
            if (v) dispatch({ type: "SET_FOLLOWED", userId: id, followed: true });
          });
        }
        if (parsed.joinedEncounters) {
          Object.entries(parsed.joinedEncounters).forEach(([id, enc]) => {
            dispatch({ type: "JOIN_ENCOUNTER", encounterId: id, enc });
          });
        }
        if (parsed.bookmarks) {
          Object.entries(parsed.bookmarks).forEach(([id, bm]) => {
            dispatch({ type: "BOOKMARK", entityId: id, type: bm.type, data: bm.data });
          });
        }
      }
    } catch (e) { /* fresh start */ }
  }, []);

  // Persist key state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("hui_connections_v1", JSON.stringify({
        followed:         state.followed,
        joinedEncounters: state.joinedEncounters,
        bookmarks:        state.bookmarks,
      }));
    } catch (e) {}
  }, [state.followed, state.joinedEncounters, state.bookmarks]);

  // ── World ambient — what's happening right now ──────────────────
  useEffect(() => {
    const activity = [
      { text: "Mia hat sich mit Jonas verbunden",       type: "connect",  emoji: "✦" },
      { text: "Lena bietet einen neuen Abend an",       type: "encounter",emoji: "🌿" },
      { text: "3 Menschen haben Stadtgarten unterstützt",type: "project",  emoji: "💛" },
      { text: "Felix hat einen Waldbaden-Abend erstellt",type: "encounter",emoji: "🧘" },
      { text: "Anna teilt einen neuen Moment",          type: "moment",   emoji: "✨" },
    ];
    const energy = Math.min(100, 60 + Math.floor(Math.random() * 30));
    dispatch({ type: "SET_AMBIENT", activity, energy });
  }, []);

  // ── Actions ─────────────────────────────────────────────────────

  const connect = useCallback(async (targetId, profile) => {
    const intentId = `connect_${targetId}_${Date.now()}`;
    dispatch({ type: "PENDING_INTENT", intentId, intent: INTENT.CONNECT, payload: { targetId } });
    // Optimistic
    dispatch({ type: "SET_CONNECTION", userId: targetId, connectionState: CONNECTION_STATE.PENDING });
    dispatch({ type: "SET_FOLLOWED",   userId: targetId, followed: true });
    try {
      if (supabase && userId.current) {
        await supabase.from("follows").upsert({
          follower_id: userId.current,
          following_id: targetId,
        }, { onConflict: "follower_id,following_id" });
      }
    } catch (e) { console.warn("[CE] follow error:", e?.message); }
    dispatch({ type: "RESOLVE_INTENT", intentId });
  }, []);

  const follow = useCallback(async (targetId) => {
    dispatch({ type: "SET_FOLLOWED", userId: targetId, followed: true });
    try {
      if (supabase && userId.current) {
        await supabase.from("follows").upsert({
          follower_id: userId.current,
          following_id: targetId,
        }, { onConflict: "follower_id,following_id" });
      }
    } catch (e) {}
  }, []);

  const unfollow = useCallback(async (targetId) => {
    dispatch({ type: "SET_FOLLOWED", userId: targetId, followed: false });
    try {
      if (supabase && userId.current) {
        await supabase.from("follows")
          .delete()
          .eq("follower_id", userId.current)
          .eq("following_id", targetId);
      }
    } catch (e) {}
  }, []);

  const joinEncounter = useCallback((encounterId, enc) => {
    dispatch({ type: "JOIN_ENCOUNTER", encounterId, enc: enc || {} });
  }, []);

  const leaveEncounter = useCallback((encounterId) => {
    dispatch({ type: "LEAVE_ENCOUNTER", encounterId });
  }, []);

  const supportProject = useCallback((projectId, project) => {
    dispatch({ type: "SUPPORT_PROJECT", projectId, project: project || {} });
  }, []);

  const bookmark = useCallback((entityId, type, data) => {
    dispatch({ type: "BOOKMARK", entityId, type, data });
  }, []);

  const cacheContext = useCallback((id, type, data) => {
    dispatch({ type: "CACHE_CONTEXT", id, type, data });
  }, []);

  const setFlow = useCallback((from, to, intent, payload) => {
    dispatch({ type: "SET_FLOW", from, to, intent, payload });
  }, []);

  // ── Selectors ───────────────────────────────────────────────────
  const isFollowed   = useCallback((id) => !!state.followed[id],          [state.followed]);
  const isConnected  = useCallback((id) => state.connections[id] === CONNECTION_STATE.CONNECTED || state.connections[id] === CONNECTION_STATE.PENDING, [state.connections]);
  const hasJoined    = useCallback((id) => !!state.joinedEncounters[id],  [state.joinedEncounters]);
  const isBookmarked = useCallback((id) => !!state.bookmarks[id],         [state.bookmarks]);
  const getContext   = useCallback((id) => state.contextCache[id] || null,[state.contextCache]);
  const getFlowContext = useCallback(() => state.currentFlow,              [state.currentFlow]);

  // Connection suggestions — people with shared values
  const getSuggestions = useCallback((interests = [], limit = 5) => {
    // Returns IDs of people not yet followed — real impl would use DB
    return [];
  }, []);

  const value = useMemo(() => ({
    state,
    // Actions
    connect,
    follow,
    unfollow,
    joinEncounter,
    leaveEncounter,
    supportProject,
    bookmark,
    cacheContext,
    setFlow,
    // Selectors
    isFollowed,
    isConnected,
    hasJoined,
    isBookmarked,
    getContext,
    getFlowContext,
    getSuggestions,
    // Derived
    connectionCount:  Object.values(state.connections).filter(s => s === CONNECTION_STATE.CONNECTED).length,
    followingCount:   Object.values(state.followed).filter(Boolean).length,
    joinedCount:      Object.keys(state.joinedEncounters).length,
    ambientActivity:  state.ambientActivity,
    worldEnergy:      state.worldEnergy,
  }), [
    state,
    connect, follow, unfollow,
    joinEncounter, leaveEncounter,
    supportProject, bookmark,
    cacheContext, setFlow,
    isFollowed, isConnected,
    hasJoined, isBookmarked,
    getContext, getFlowContext, getSuggestions,
  ]);

  return <EngineCtx.Provider value={value}>{children}</EngineCtx.Provider>;
}
