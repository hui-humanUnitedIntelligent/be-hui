// src/core/HuiActionProvider.jsx
// ══════════════════════════════════════════════════════════════════
// Wraps HomeShell children — bridges HomeDispatchCtx into ActionCtx.
// P3: Nutzt stabilen Dispatch-Slice statt vollem HomeCtx →
//     buildActions() läuft einmal, kein Rebuild bei Overlay-Änderungen.
// ══════════════════════════════════════════════════════════════════

import React, { useMemo } from "react";
import { ActionCtx, buildActions } from "./hui.actions.js";
import { useHomeDispatch } from "../components/home/HomeShell.jsx";

export default function HuiActionProvider({ children }) {
  const dispatch = useHomeDispatch();

  // dispatch-Referenz ist stabil (useMemo mit [] in HomeShell)
  const actions = useMemo(() => {
    if (!dispatch) return null;
    return buildActions(dispatch);
  }, [dispatch]);

  return (
    <ActionCtx.Provider value={actions}>
      {children}
    </ActionCtx.Provider>
  );
}
