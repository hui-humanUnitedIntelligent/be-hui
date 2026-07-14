#!/usr/bin/env node
/**
 * HUI Performance Sprint P3 — HomeShell Context Re-Render Analysis
 *
 * Simuliert Context-Abhängigkeiten und berechnet theoretische
 * Re-Render-Kaskaden vor/nach der Context-Entkopplung.
 *
 * Usage: node scripts/measure-homeshell-renders.mjs
 */

const CONSUMERS_BEFORE = [
  { name: "Home.jsx (HomeInner)",        hook: "useHome()",        slices: ["all"] },
  { name: "HuiActionProvider",           hook: "useHome()",        slices: ["all"] },
  { name: "ProfileLauncher",             hook: "useHome()",        slices: ["all"] },
  { name: "MyBasisProfile",              hook: "useHome()",        slices: ["all"] },
  { name: "TalentProfilePage",           hook: "useHome()",        slices: ["all"] },
  { name: "BasisProfilePage",            hook: "useHome()",        slices: ["all"] },
  { name: "MyRecommendationsModal",      hook: "useHome()",        slices: ["all"] },
  { name: "AmbassadorStudioSection",     hook: "useHome()",        slices: ["all"] },
  { name: "HUIBottomNavigation (indirect)", hook: "useHuiActions()", slices: ["all"] },
  { name: "HomeHeader (indirect)",       hook: "useHuiActions()",  slices: ["all"] },
  { name: "ChatCenterOverlay (indirect)", hook: "useHuiActions()", slices: ["all"] },
  { name: "FavoritesPage (indirect)",    hook: "useHuiActions()",  slices: ["all"] },
];

const CONSUMERS_AFTER = [
  { name: "Home.jsx (HomeInner)",        hook: "useHome()",           slices: ["all"] },
  { name: "HuiActionProvider",           hook: "useHomeDispatch()",   slices: ["dispatch"] },
  { name: "ProfileLauncher",             hook: "useHomeProfile()",    slices: ["profile"] },
  { name: "MyBasisProfile",              hook: "useHomeDispatch()",   slices: ["dispatch"] },
  { name: "TalentProfilePage",           hook: "useHomeDispatch()",   slices: ["dispatch"] },
  { name: "BasisProfilePage",            hook: "useHomeDispatch()",   slices: ["dispatch"] },
  { name: "MyRecommendationsModal",      hook: "useHomeDispatch()",   slices: ["dispatch"] },
  { name: "AmbassadorStudioSection",     hook: "useHomeDispatch()",   slices: ["dispatch"] },
  { name: "HUIBottomNavigation (indirect)", hook: "useHuiActions()",  slices: ["dispatch"] },
  { name: "HomeHeader (indirect)",       hook: "useHuiActions()",     slices: ["dispatch"] },
  { name: "ChatCenterOverlay (indirect)", hook: "useHuiActions()",    slices: ["dispatch"] },
  { name: "FavoritesPage (indirect)",    hook: "useHuiActions()",     slices: ["dispatch"] },
];

const TRIGGERS = [
  { id: "overlay_open",   label: "Overlay öffnen (z.B. Chat)",     slice: "overlay" },
  { id: "overlay_close",  label: "Overlay schließen",              slice: "overlay" },
  { id: "tab_switch",     label: "Tabwechsel",                     slice: "nav" },
  { id: "notification",   label: "Notification Count",             slice: "user" },
  { id: "commerce",       label: "Warenkorb ändern",               slice: "commerce" },
  { id: "profile_open",   label: "Profil öffnen",                  slice: "profile" },
  { id: "search",         label: "Suche aktivieren",               slice: "nav" },
  { id: "mein_hui",       label: "Mein HUI (Orb) öffnen",          slice: "overlay" },
  { id: "resonance",      label: "Resonance/Chat Action",          slice: "overlay" },
];

function countRerenders(consumers, triggerSlice) {
  return consumers.filter((c) => {
    if (c.slices.includes("all")) return true;
    if (c.slices.includes("dispatch")) return false; // stable slice
    return c.slices.includes(triggerSlice);
  }).length;
}

function run() {
  console.log("═".repeat(64));
  console.log(" HUI Performance Sprint P3 — Re-Render Analysis");
  console.log("═".repeat(64));
  console.log();

  const results = TRIGGERS.map((t) => {
    const before = countRerenders(CONSUMERS_BEFORE, t.slice);
    const after  = countRerenders(CONSUMERS_AFTER, t.slice);
    const saved  = before - after;
    const pct    = before > 0 ? Math.round((saved / before) * 100) : 0;
    return { ...t, before, after, saved, pct };
  });

  console.log("Trigger                    | Vorher | Nachher | Ersparnis");
  console.log("-".repeat(64));
  for (const r of results) {
    const label = r.label.padEnd(26);
    console.log(`${label} | ${String(r.before).padStart(6)} | ${String(r.after).padStart(7)} | -${r.saved} (${r.pct}%)`);
  }

  const totalBefore = results.reduce((s, r) => s + r.before, 0);
  const totalAfter  = results.reduce((s, r) => s + r.after, 0);
  console.log("-".repeat(64));
  console.log(`${"GESAMT (alle Trigger)".padEnd(26)} | ${String(totalBefore).padStart(6)} | ${String(totalAfter).padStart(7)} | -${totalBefore - totalAfter} (${Math.round(((totalBefore - totalAfter) / totalBefore) * 100)}%)`);
  console.log();

  console.log("Größte Render-Ketten VORHER:");
  console.log("  Overlay-Änderung → 12 Consumer + buildActions() rebuild");
  console.log("  Tab-Wechsel      → 12 Consumer + Feed/Discover/Impact/Favorites");
  console.log();
  console.log("Größte Render-Ketten NACHHER:");
  console.log("  Overlay-Änderung → 1 Consumer (Home.jsx) + 0 Action-Rebuild");
  console.log("  Tab-Wechsel      → 2 Consumer (Home.jsx + Nav-Slice-Abonnenten)");
  console.log("  Profil öffnen    → 2 Consumer (Home.jsx + ProfileLauncher)");
  console.log();

  return { results, totalBefore, totalAfter };
}

run();
