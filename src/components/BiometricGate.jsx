// src/components/BiometricGate.jsx
// Biometric/PIN Gate — zeigt BiometricLockScreen beim App-Start
// und beim Resume aus dem Hintergrund (nach 30s).
// Nur auf nativer Plattform (Android/iOS) — im Web ein No-Op.
// ══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from "react";
import { Capacitor, registerPlugin } from "@capacitor/core";
import { useAuth } from "../lib/AuthContext.jsx";
import { supabase } from "../lib/supabaseClient.js";
import { BiometricLockScreen } from "./BiometricLockScreen.jsx";
import {
  isBiometricEnabled,
  isPINEnabled,
  getSavedSession,
  clearSavedSession,
} from "../lib/biometricService.js";

// ── Plugin Proxy (läuft auf allen Plattformen, No-Op auf Web) ────────────────
// Gleiches Muster wie AndroidBackButtonHandler.jsx — registerPlugin("App", {})
// statt direktem @capacitor/app Import → kein Rollup-Resolve-Fehler im Web.
const App = registerPlugin("App", {});

// ── Konstanten ──────────────────────────────────────────────────────────────
const BACKGROUND_LOCK_THRESHOLD_MS = 30_000; // 30 Sekunden im Hintergrund → lock

export function BiometricGate({ children }) {
  const { isAuthenticated, loadingAuth, authChecked, signOut } = useAuth() || {};

  const [showLockScreen, setShowLockScreen] = useState(false);
  const [lockChecked, setLockChecked] = useState(false);

  // ── Timestamps für Background-Lock ────────────────────────────────────────
  const backgroundedAtRef = useRef(null);
  const lockEnabledRef = useRef(false);

  // ── Init: Biometric/PIN Status prüfen beim App-Start ──────────────────────
  useEffect(() => {
    if (loadingAuth || !authChecked) return;
    if (!isAuthenticated) {
      setLockChecked(true);
      return;
    }

    let cancelled = false;
    (async () => {
      if (!Capacitor.isNativePlatform()) {
        // Web → kein Lock
        setLockChecked(true);
        return;
      }

      const bioOn = await isBiometricEnabled();
      const pinOn = await isPINEnabled();
      const enabled = bioOn || pinOn;
      lockEnabledRef.current = enabled;

      if (enabled) {
        setShowLockScreen(true);
      }
      if (!cancelled) setLockChecked(true);
    })();

    return () => { cancelled = true; };
  }, [loadingAuth, authChecked, isAuthenticated]);

  // ── AppState Listener: Background → Active ───────────────────────────────
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    if (!lockEnabledRef.current) return;

    let listener;
    (async () => {
      try {
        listener = await App.addListener("appStateChange", ({ isActive }) => {
          if (!isActive) {
            // App geht in den Hintergrund → Timestamp setzen
            backgroundedAtRef.current = Date.now();
          } else if (isActive) {
            // App kommt zurück → prüfen ob lange genug im Hintergrund
            const bgAt = backgroundedAtRef.current;
            if (bgAt && Date.now() - bgAt >= BACKGROUND_LOCK_THRESHOLD_MS) {
              setShowLockScreen(true);
            }
            backgroundedAtRef.current = null;
          }
        });
      } catch (e) {
        // No-Op auf Web — Plugin nicht verfügbar
      }
    })();

    return () => {
      if (listener?.remove) listener.remove();
    };
  }, [authChecked]);

  // ── Unlock Handler ───────────────────────────────────────────────────────
  const handleUnlock = useCallback(async (refreshToken, email) => {
    // LockScreen aufheben — Session ist bereits aktiv via Supabase localStorage
    // (refreshToken/email werden für zukünftige setSession verwendet falls nötig)
    if (refreshToken) {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data?.session) {
          // Session expired while locked → restore via refresh token
          const { data: refreshData } = await supabase.auth.setSession({
            refresh_token: refreshToken,
          });
          if (refreshData?.session) {
            // Session restored
          }
        }
      } catch (e) {
        console.warn("[BiometricGate] setSession error:", e?.message);
      }
    }
    setShowLockScreen(false);
  }, []);

  // ── Logout Handler ────────────────────────────────────────────────────────
  const handleLogout = useCallback(async () => {
    try {
      await signOut?.();
    } catch (e) {
      console.warn("[BiometricGate] signOut error:", e?.message);
    }
    setShowLockScreen(false);
  }, [signOut]);

  // ── Render ────────────────────────────────────────────────────────────────
  // Vor dem Lock-Check → Kinder rendern (kein Blockieren des App-Starts)
  // Lock aktiv → LockScreen über alles legen, Kinder im Hintergrund behalten
  return (
    <>
      {children}
      {showLockScreen && (
        <BiometricLockScreen
          onUnlock={handleUnlock}
          onLogout={handleLogout}
        />
      )}
    </>
  );
}
