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
import { ActionCtx, buildActions } from "./hui.actions.js";
import { useHome } from "../components/home/HomeShell.jsx";

export default function HuiActionProvider({ children }) {
  const shell = useHome();

  // Rebuild actions only when shell reference changes
  // shell is the full HomeCtx value — stable reference from useMemo in HomeShell
  const actions = useMemo(() => {
    console.trace('[TRACE_BUILD_ACTIONS] buildActions(shell) — shell neu, actions werden rebuildet', { shellSetShowChat: typeof shell?.setShowChat, ts: Date.now() });
    return buildActions(shell);
  }, [shell]);

  return (
    <ActionCtx.Provider value={actions}>
      {children}
    </ActionCtx.Provider>
  );
}
