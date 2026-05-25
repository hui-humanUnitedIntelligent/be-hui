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
import { reportActionFailure } from "../lib/runtimeDebug.js";

export default function HuiActionProvider({ children }) {
  const shell = useHome();

  // Rebuild actions only when shell reference changes
  // shell is the full HomeCtx value — stable reference from useMemo in HomeShell
  const actions = useMemo(() => {
    const rawActions = buildActions(shell);
    return Object.fromEntries(Object.entries(rawActions).map(([name, handler]) => [
      name,
      (...args) => {
        if (typeof handler !== "function") {
          reportActionFailure({
            flow: "hui-action",
            step: "missing-handler",
            entity: name,
            message: `Kein Handler für Action ${name}`,
            details: { args },
          });
          return undefined;
        }
        try {
          return handler(...args);
        } catch (error) {
          reportActionFailure({
            flow: "hui-action",
            step: "handler-exception",
            entity: name,
            message: error?.message || `Action ${name} fehlgeschlagen`,
            error,
            details: { args },
          });
          throw error;
        }
      },
    ]));
  }, [shell]);

  return (
    <ActionCtx.Provider value={actions}>
      {children}
    </ActionCtx.Provider>
  );
}
