// src/core/hui.flow.return.js — HUI FLOW RETURN SYSTEM v1
// ══════════════════════════════════════════════════════════════════
// PHASE 2B: Flow Consistency Engine
//
// ZWECK:
//   Semantische Return-Strategien — die Plattform weiß wohin sie zurückkehrt.
//   Kein history.back(). Kein blindes Modal-Close.
//   Stattdessen: kontextbewusstes Zurückkehren.
//
// ARCHITEKTUR:
//   FlowReturn ist ein reines Utilities-Modul (keine React-Hooks).
//   Es arbeitet mit dem FlowStore und dem HomeShell-State zusammen.
//
// USAGE in hui.actions.js:
//   import { resolveReturn } from "./hui.flow.return.js";
//   const returnAction = resolveReturn(flow, shell);
//   returnAction?.execute();
//
// USAGE in Close-Handlers:
//   const ret = resolveReturn(flow, shell);
//   ret.execute();
// ══════════════════════════════════════════════════════════════════

import { cleanupOrbEnvironment } from "../lib/cleanup/cleanupOrbEnvironment.js";
import { isValidTab, normalizePersistedTab } from "../lib/world/orbLayer.js";
import { S, RETURN_TO, SURFACE_LABEL } from "./hui.sources.js";

const isDev = typeof import.meta !== "undefined"
  ? (import.meta.env?.DEV ?? false)
  : false;

// ─── Dev-Log ──────────────────────────────────────────────────────
function logReturn(from, to, method) {
  if (!isDev) return;
  var fromLabel = SURFACE_LABEL[from] || from || "?";
  var toLabel   = SURFACE_LABEL[to]   || to   || "?";
  console.log("[HUI_RETURN] " + fromLabel + " → " + toLabel + " (" + method + ")");
}

function sourceToTab(source, fallback = S.FEED) {
  if (isValidTab(source)) return source;
  const mapped = RETURN_TO[source];
  return isValidTab(mapped) ? mapped : fallback;
}

// ─── Return-Strategien ────────────────────────────────────────────

// STRATEGIE 1: Chat-Close → Profil (LOOP 1)
// Wenn Chat vom Profil aus geöffnet wurde → Profil wiederherstellen.
function ChatToProfile(flow, shell) {
  return {
    canExecute() {
      return !!flow.getReturnProfile();
    },
    execute() {
      var profile = flow.getReturnProfile();
      flow.clearReturnProfile();
      flow.pop?.();
      logReturn(S.CHAT, S.VISITOR_PROFILE, "ChatToProfile");
      // Sanfter Delay — Chat-Exit-Animation hat 80ms Overlap
      if (shell.setShowWirker) {
        setTimeout(function() { shell.setShowWirker(profile); }, 80);
      }
    },
  };
}

// STRATEGIE 2: Profile-Close → vorheriger Tab
// Wenn Profil aus Discover geöffnet wurde → zu Discover zurück.
function ProfileToTab(flow, shell) {
  return {
    canExecute() {
      var current = flow.current();
      return current && (current.source || current.sourceTab) && current.source !== S.SYSTEM;
    },
    execute() {
      var current   = flow.current();
      var fromSource = current?.sourceTab || current?.source || null;
      var returnTab  = sourceToTab(fromSource, S.FEED);
      flow.pop();
      logReturn(S.VISITOR_PROFILE, returnTab, "ProfileToTab");
      if (shell.switchTab) {
        shell.switchTab(returnTab);
      }
    },
  };
}

// STRATEGIE 3: Experience-Close → Discover
function ExperienceToDiscover(flow, shell) {
  return {
    canExecute() {
      var current = flow.current();
      return current && current.surface === S.EXPERIENCE;
    },
    execute() {
      flow.pop();
      logReturn(S.EXPERIENCE, S.DISCOVER, "ExperienceToDiscover");
      if (shell.switchTab) {
        shell.switchTab(S.DISCOVER);
      }
    },
  };
}

// STRATEGIE 4: Overlay-Close → prevTab (generisch)
// Für Notifications, Map, Match etc.
function OverlayToPrevTab(fromSurface, flow, shell) {
  return {
    canExecute() {
      return !!(shell.prevTab);
    },
    execute() {
      var target = RETURN_TO[fromSurface] || shell.prevTab || S.FEED;
      target = sourceToTab(target || shell.prevTab, normalizePersistedTab(shell.prevTab || S.FEED));
      logReturn(fromSurface, target, "OverlayToPrevTab");
      // Kein flow.pop() hier — Overlays liegen nicht auf dem Stack
      if (shell.switchTab) {
        shell.switchTab(target);
      }
    },
  };
}

// STRATEGIE 5: Fallback — immer ausführbar, geht zum Feed
function FallbackToHome(flow, shell) {
  return {
    canExecute() { return true; },
    execute() {
      logReturn("?", S.FEED, "FallbackToHome");
      if (shell.switchTab) {
        shell.switchTab(S.FEED);
      }
    },
  };
}

// ─── Haupt-Resolver ───────────────────────────────────────────────
// Gibt die beste Return-Strategie für die aktuelle Flow-Situation.
//
// flow:  FlowStore (aus createFlowStore)
// shell: Subset von HomeShell-ctx { setShowWirker, switchTab, prevTab }
// hint:  optional — expliziter Surface-Hint ("chat", "profile", ...)
export function resolveReturn(flow, shell, hint) {
  var strategies;

  if (hint === S.CHAT) {
    strategies = [
      ChatToProfile(flow, shell),
      FallbackToHome(flow, shell),
    ];
  } else if (hint === S.VISITOR_PROFILE || hint === S.OWNER_PROFILE) {
    strategies = [
      ProfileToTab(flow, shell),
      FallbackToHome(flow, shell),
    ];
  } else if (hint === S.EXPERIENCE) {
    strategies = [
      ExperienceToDiscover(flow, shell),
      FallbackToHome(flow, shell),
    ];
  } else {
    // Generisch: prüfe Stack, dann prevTab
    strategies = [
      ChatToProfile(flow, shell),
      ExperienceToDiscover(flow, shell),
      OverlayToPrevTab(hint || S.UNKNOWN, flow, shell),
      FallbackToHome(flow, shell),
    ];
  }

  // Erste ausführbare Strategie zurückgeben
  for (var i = 0; i < strategies.length; i++) {
    if (strategies[i].canExecute()) {
      return strategies[i];
    }
  }

  return FallbackToHome(flow, shell);
}

// ─── Convenience: Return sofort ausführen ─────────────────────────
export function executeReturn(flow, shell, hint) {
  var strategy = resolveReturn(flow, shell, hint);
  strategy.execute();
}

// ─── Central Close Flow ─────────────────────────────────────────────
// Alle Flow-/Overlay-Closes laufen hier zusammen. Keine history.back()
// und keine lokalen Back-Hacks: State-Cleanup zuerst, Return danach.
export function centralCloseFlow({
  source = S.UNKNOWN,
  returnTo = null,
  preserveWorld = false,
  preserveTab = false,
  reason = "central-close",
  flow = null,
  shell = {},
  navigate = null,
  fallbackPath = "/Home",
} = {}) {
  const closeReason = `${reason}:${source}`;

  shell.setShowChat?.(false);
  shell.setChatRecipient?.(null);

  if (typeof shell.closeTransientState === "function") {
    shell.closeTransientState({
      reason: closeReason,
      preserveWorld,
      preserveTab,
      preserveProfile: source === S.CHAT && !!flow?.getReturnProfile?.(),
    });
  } else {
    shell.setShowWirker?.(null);
    if (!preserveWorld) {
      shell.closeSurface?.(null, closeReason);
      shell.closeOrbWorld?.(closeReason);
      cleanupOrbEnvironment({ reason: closeReason });
    }
  }

  if (returnTo && !preserveTab) {
    const targetTab = normalizePersistedTab(returnTo);
    if (shell.switchTab && isValidTab(targetTab)) {
      logReturn(source, targetTab, "centralCloseFlow:returnTo");
      shell.switchTab(targetTab);
      return targetTab;
    }
  }

  if (flow && shell.switchTab && !preserveTab) {
    executeReturn(flow, shell, source);
    return source;
  }

  if (typeof navigate === "function") {
    navigate(fallbackPath, { replace: true });
    return fallbackPath;
  }

  return null;
}
