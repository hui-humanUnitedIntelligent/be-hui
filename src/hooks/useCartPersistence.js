// src/hooks/useCartPersistence.js
// HUI Werkekorb — persistente Speicherung (v1.1)
//
// v1.1 Änderung: Dual-Persistenz-Strategie
//   - setCart-Wrapper schreibt synchron (sofort beim Aufruf)
//   - useEffect schreibt als Fallback bei jedem cart-Änderung
//   → verhindert Datenverlust wenn cart außerhalb von setCart geändert wird
//
// Architektur:
//   Layer 0 (aktiv):  localStorage  — synchron, kein Server nötig
//   Layer 1 (später): Supabase-Sync — kann hier transparent ergänzt werden
//
// Regeln (hard):
//   ✅ Persistiert: beim Hinzufügen, Entfernen, Mengenänderung
//   ✅ Wiederhergestellt: beim App-Start (vor erstem Render des Warenkorbs)
//   ❌ Gelöscht NUR bei: erfolgreicher Unterstützung ODER bewusstem Leeren
//   ❌ Ein Reload löscht niemals den Inhalt

import { useState, useEffect, useCallback, useRef } from "react";

const STORAGE_KEY_PREFIX = "hui_cart_v1:";

function storageKey(userId) {
  // Warte auf eine echte User-ID — niemals mit 'anon' schreiben wenn userId kommt
  return userId ? `${STORAGE_KEY_PREFIX}${userId}` : null;
}

function readFromStorage(key) {
  if (!key) return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeToStorage(key, items) {
  if (!key) return; // kein Key = kein Schreiben
  try {
    if (!items || items.length === 0) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(items));
    }
  } catch (e) {
    console.warn("[HUI Cart] localStorage write failed:", e?.message);
  }
}

function deleteFromStorage(key) {
  if (!key) return;
  try {
    localStorage.removeItem(key);
  } catch {}
}

// ── Phase-2-Stub ────────────────────────────────────────────────
// async function syncToCloud(userId, items) { /* Supabase upsert */ }
// async function loadFromCloud(userId) { /* Supabase select */ }
// async function deleteFromCloud(userId) { /* Supabase delete */ }

/**
 * useCartPersistence — Drop-in-Ersatz für useState([]) im Werkekorb
 *
 * @param {string|null} userId  — Auth-User-ID
 * @returns {{ cart, setCart, clearCart }}
 */
export function useCartPersistence(userId) {
  const key = storageKey(userId);
  const prevKeyRef = useRef(key);

  // Initialer State aus Storage (lazy initializer — läuft einmal beim Mount)
  const [cart, _setCart] = useState(() => readFromStorage(key));

  // ── Kritisch: userId-Wechsel (z.B. nach Login/Logout) ──────────
  // Wenn user.id erst nach dem ersten Render verfügbar ist,
  // laden wir den korrekten Cart nach.
  useEffect(() => {
    if (prevKeyRef.current !== key) {
      prevKeyRef.current = key;
      const restored = readFromStorage(key);
      _setCart(restored);
    }
  }, [key]);

  // ── Dual-Persistenz: Fallback useEffect ────────────────────────
  // Schreibt bei JEDER cart-Änderung in Storage.
  // Funktioniert auch wenn cart von außen geändert wurde.
  // skip: wenn key null (userId noch nicht bekannt)
  //       wenn cart leer und Storage leer (kein sinnloser Write)
  const isFirstRender = useRef(true);
  useEffect(() => {
    // Ersten Render überspringen (Initialisierung aus Storage — kein Write nötig)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!key) return;
    writeToStorage(key, cart);
    // Phase-2-Hook-Point: syncToCloud(userId, cart)
  }, [cart, key]);

  /** Wrapper um setState — persistiert sofort (primärer Pfad) */
  const setCart = useCallback((updater) => {
    _setCart(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      // Sofort schreiben — nicht auf useEffect warten
      writeToStorage(key, next);
      return next;
    });
  }, [key]);

  /** Bewusstes Leeren — NUR nach Erfolg oder explizitem User-Action */
  const clearCart = useCallback(() => {
    deleteFromStorage(key);
    _setCart([]);
    // Phase-2-Hook-Point: deleteFromCloud(userId)
  }, [key]);

  return { cart, setCart, clearCart };
}
