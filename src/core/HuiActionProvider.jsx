// src/core/HuiActionProvider.jsx
// ══════════════════════════════════════════════════════════════════
// Wraps HomeShell children — bridges HomeCtx state into ActionCtx.
// Place INSIDE HomeShell (so useHome() is available).
//
// USAGE in HomeShell.jsx:
//   import HuiActionProvider from "../../core/HuiActionProvider.jsx";
//   // Inside HomeShell return, wrap children:
//   <HomeCtx.Provider value={ctx}>
//     <HuiActionProvider>
//       {children}
//     </HuiActionProvider>
//   </HomeCtx.Provider>
// ══════════════════════════════════════════════════════════════════

import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ActionCtx, buildActions } from "./hui.actions.js";
import { useHome } from "../components/home/HomeShell.jsx";

export default function HuiActionProvider({ children }) {
  const shell = useHome();
  const navigate = useNavigate();

  const actions = useMemo(() => {
    return buildActions({ ...shell, navigate });
  }, [shell, navigate]);

  return (
    <ActionCtx.Provider value={actions}>
      {children}
    </ActionCtx.Provider>
  );
}
