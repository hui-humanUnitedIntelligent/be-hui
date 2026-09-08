/**
 * useIsTabletScreen.js — SSOT für Tablet-Erkennung (2026-09-08)
 *
 * Ursprung: TABLET-MEDIA-3X in BaseFeedCard.jsx — für PUNKT5-IMPACT-TABLET
 * (Michaels Wunsch: Impact-Bilder auf Tablets 2x proportional) braucht auch
 * ImpactPage dieselbe Erkennung. Statt die Logik zu duplizieren, ist sie hier
 * als autoritative Quelle (Architektur-Charta P1: "Erweitern statt
 * duplizieren") ausgelagert; BaseFeedCard importiert sie von hier.
 *
 * Erkennung ueber die KLEINERE der beiden Viewport-Dimensionen — die bleibt
 * bei Rotation konstant:
 *   iPad (jede Ausrichtung):     min(1024,1366) = 1024 -> Tablet
 *   iPhone Pro Max (Querformat): min(926,428)  = 428  -> Phone (bleibt klein!)
 * Ein reiner Breiten-Check waere unzuverlaessig, weil ein Phone im Querformat
 * breiter sein kann als ein iPad im Hochformat. Schwelle 700px liegt sicher
 * zwischen dem groessten Phone (~430) und dem kleinsten echten Tablet
 * (iPad mini: 744). EIN geteilter Listener statt einem pro Karte
 * (Performance bei langen Listen mit vielen Karten).
 */
import { useState, useEffect } from "react";

const TABLET_MIN_DIM = 700;

export function getIsTabletScreen() {
  if (typeof window === "undefined") return false;
  return Math.min(window.innerWidth, window.innerHeight) >= TABLET_MIN_DIM;
}

const _tabletScreenSubscribers = new Set();
let _tabletScreenValue = getIsTabletScreen();
function _notifyTabletScreenSubscribers() {
  const next = getIsTabletScreen();
  if (next === _tabletScreenValue) return;
  _tabletScreenValue = next;
  _tabletScreenSubscribers.forEach(fn => fn(next));
}
if (typeof window !== "undefined") {
  window.addEventListener("resize", _notifyTabletScreenSubscribers);
  window.addEventListener("orientationchange", _notifyTabletScreenSubscribers);
}

export function useIsTabletScreen() {
  const [val, setVal] = useState(_tabletScreenValue);
  useEffect(() => {
    setVal(_tabletScreenValue); // Re-Sync beim Mount (falls sich seit Modul-Load geaendert hat)
    _tabletScreenSubscribers.add(setVal);
    return () => { _tabletScreenSubscribers.delete(setVal); };
  }, []);
  return val;
}
