// navigateToShellTab.js — NAV-1.4: Shell-Tab-Navigation aus Modals/Overlays
import { buildShellTabNavigateState, applyShellHash } from "./shellDeepLink.js";

/**
 * Wechselt zu einem HomeShell-Tab.
 * Bevorzugt handleTab/switchTab wenn im Shell-Kontext verfügbar.
 * Fallback: React Router → /Home mit shellTab-State (Deep-Link-kompatibel).
 */
export function navigateToShellTab(tab, {
  handleTab = null,
  switchTab = null,
  navigate = null,
  hash = "",
  onBeforeNavigate = null,
} = {}) {
  onBeforeNavigate?.();

  const cleanHash = hash ? (hash.startsWith("#") ? hash : `#${hash}`) : "";

  if (tab === "impact" && typeof handleTab === "function") {
    handleTab("impact");
    if (cleanHash) applyShellHash(cleanHash);
    return true;
  }
  if (typeof switchTab === "function") {
    switchTab(tab);
    if (cleanHash) applyShellHash(cleanHash);
    return true;
  }
  if (typeof handleTab === "function") {
    handleTab(tab);
    if (cleanHash) applyShellHash(cleanHash);
    return true;
  }
  if (typeof navigate === "function") {
    navigate("/Home", { state: buildShellTabNavigateState(tab, cleanHash) });
    return true;
  }
  return false;
}
