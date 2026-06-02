// src/core/HuiContextBridge.jsx — Phase 2.5
// Bridges context between sections: profile ↔ encounter ↔ project ↔ impact
// When you open a profile from an encounter, HUI remembers and surfaces the connection.
// ══════════════════════════════════════════════════════════════════

import React, { createContext, useContext, useReducer, useCallback, useMemo } from "react";

// ── Bridge State ──────────────────────────────────────────────────
const INITIAL_BRIDGE = {
  // Current context stack — what the user is "in"
  context: [],  // [{ type, id, data, enteredFrom, at }]

  // Cross-entity relationships surfaced in UI
  // e.g. "Jonas is also in this encounter you saved"
  connections: [],

  // Recently viewed — for natural back-navigation feel
  recentEntities: [], // [{ type, id, name, at }]

  // Shared values between current user and viewed entity
  sharedValues: [],

  // What brought the user here (referrer chain)
  referrerChain: [],
};

function bridgeReducer(state, action) {
  switch (action.type) {
    case "PUSH_CONTEXT": {
      const { type, id, data, enteredFrom } = action;
      const entry = { type, id, data, enteredFrom, at: Date.now() };
      const recent = { type, id, name: data?.name || data?.display_name || data?.title || id, at: Date.now() };
      return {
        ...state,
        context: [...state.context.slice(-4), entry],
        recentEntities: [recent, ...state.recentEntities.filter(e => e.id !== id)].slice(0, 8),
        referrerChain: enteredFrom
          ? [enteredFrom, ...state.referrerChain].slice(0, 5)
          : state.referrerChain,
      };
    }
    case "POP_CONTEXT": {
      return { ...state, context: state.context.slice(0, -1) };
    }
    case "SET_SHARED_VALUES": {
      return { ...state, sharedValues: action.values };
    }
    case "SET_CONNECTIONS": {
      return { ...state, connections: action.connections };
    }
    default:
      return state;
  }
}

const BridgeCtx = createContext(null);

export function useContextBridge() {
  const ctx = useContext(BridgeCtx);
  if (!ctx) return {
    currentContext: null,
    pushContext: () => {},
    popContext: () => {},
    recentEntities: [],
    sharedValues: [],
    referrerChain: [],
    contextDepth: 0,
  };
  return ctx;
}

export default function HuiContextBridge({ children }) {
  const [state, dispatch] = useReducer(bridgeReducer, INITIAL_BRIDGE);

  const pushContext = useCallback((type, id, data, enteredFrom) => {
    dispatch({ type: "PUSH_CONTEXT", contextType: type, id, data, enteredFrom });
  }, []);

  const popContext = useCallback(() => {
    dispatch({ type: "POP_CONTEXT" });
  }, []);

  const setSharedValues = useCallback((values) => {
    dispatch({ type: "SET_SHARED_VALUES", values });
  }, []);

  const value = useMemo(() => ({
    currentContext:  state.context[state.context.length - 1] || null,
    contextStack:    state.context,
    contextDepth:    state.context.length,
    recentEntities:  state.recentEntities,
    sharedValues:    state.sharedValues,
    referrerChain:   state.referrerChain,
    connections:     state.connections,
    pushContext,
    popContext,
    setSharedValues,
  }), [state, pushContext, popContext, setSharedValues]);

  return <BridgeCtx.Provider value={value}>{children}</BridgeCtx.Provider>;
}
