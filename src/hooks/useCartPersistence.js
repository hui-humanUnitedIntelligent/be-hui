// src/hooks/useCartPersistence.js
// HUI Werkekorb — persistente Speicherung (v1.0)
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
//
// Phase-2-Vorbereitung:
//   Der Hook ist so geschrieben, dass clearCart() und saveCart() später
//   parallel eine Supabase-Funktion aufrufen können, ohne die API zu ändern.

import { useState, useEffect, useCallback, useRef } from "react";

const STORAGE_KEY_PREFIX = "hui_cart_v1:";

/** Gibt den nutzer-spezifischen Key zurück (oder globalen Fallback). */
function storageKey(userId) {
  return userId ? `${STORAGE_KEY_PREFIX}${userId}` : `${STORAGE_KEY_PREFIX}anon`;
}

/** Liest den Cart sicher aus localStorage.
 *  Gibt [] zurück wenn nichts vorhanden oder JSON fehlerhaft. */
function readFromStorage(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Schreibt den Cart in localStorage. */
function writeToStorage(key, items) {
  try {
    if (!items || items.length === 0) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(items));
    }
  } catch (e) {
    // QuotaExceededError u.ä. — kein crash
    console.warn("[HUI Cart] localStorage write failed:", e?.message);
  }
}

/** Löscht den Cart aus localStorage. */
function deleteFromStorage(key) {
  try {
    localStorage.removeItem(key);
  } catch {}
}

// ── Phase-2-Stub: spätere Cloud-Sync-Funktionen ────────────────────
// Diese Funktionen können implementiert werden ohne die Hook-API zu ändern.
//
// async function syncToCloud(userId, items) { /* Supabase upsert */ }
// async function loadFromCloud(userId) { /* Supabase select */ }
// async function deleteFromCloud(userId) { /* Supabase delete */ }

/**
 * useCartPersistence — Drop-in-Ersatz für useState([]) im Werkekorb
 *
 * @param {string|null} userId  — Auth-User-ID (kann null sein bei Gast)
 * @returns {{ cart, setCart, clearCart }}
 *
 * setCart:   identisch zu React setState — akzeptiert Wert oder Funktion
 * clearCart: löscht Cart + Storage (nur nach Erfolg oder bewusstem Leeren)
 */
export function useCartPersistence(userId) {
  const key = storageKey(userId);

  // Initialer State direkt aus Storage — vor erstem Render
  const [cart, _setCart] = useState(() => readFromStorage(key));

  // Key-Wechsel bei userId-Änderung (Login/Logout)
  const prevKeyRef = useRef(key);
  useEffect(() => {
    if (prevKeyRef.current !== key) {
      prevKeyRef.current = key;
      _setCart(readFromStorage(key));
    }
  }, [key]);

  /** Wrapper um setState — persistiert automatisch nach jeder Änderung */
  const setCart = useCallback((updater) => {
    _setCart(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      writeToStorage(key, next);
      // Phase-2-Hook-Point: syncToCloud(userId, next)
      return next;
    });
  }, [key]);

  /** Bewusstes Leeren + Storage-Löschung.
   *  Aufruf NUR nach Erfolg oder explizitem User-Action. */
  const clearCart = useCallback(() => {
    deleteFromStorage(key);
    _setCart([]);
    // Phase-2-Hook-Point: deleteFromCloud(userId)
  }, [key]);

  return { cart, setCart, clearCart };
}
