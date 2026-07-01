// shellDeepLink.js — NAV-1.4: Deep-Link State für HomeShell-Tabs
//
// Impact und andere Shell-Tabs leben ausschließlich in /Home (HomeShell).
// URL-Routen wie /impact leiten auf /Home mit Router-State um.

export const SHELL_TAB_STATE = "shellTab";
export const SHELL_HASH_STATE = "shellHash";

/** Router-State für navigate("/Home", { state }) */
export function buildShellTabNavigateState(tab, hash = "") {
  const cleanHash = hash ? (hash.startsWith("#") ? hash : `#${hash}`) : "";
  return {
    [SHELL_TAB_STATE]: tab,
    [SHELL_HASH_STATE]: cleanHash,
  };
}

/** Hash setzen und optional zu Element scrollen (nach Tab-Mount). */
export function applyShellHash(hash, delayMs = 450) {
  if (!hash) return;
  const clean = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!clean) return;
  try {
    window.location.hash = clean;
  } catch (_) { /* ignore */ }
  setTimeout(() => {
    const el = document.getElementById(clean);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, delayMs);
}
