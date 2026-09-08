// src/hooks/useIOSResumeRecovery.js
// ═══════════════════════════════════════════════════════════════════════════
// BUG5-WHITESCREEN-RESUME-IOS (2026-09-08) — iOS-only, Android UNVERAENDERT.
// ═══════════════════════════════════════════════════════════════════════════
//
// SYMPTOM (Nutzerbericht, iPad): App laengere Zeit in den Hintergrund
// geschickt, beim Zurueckholen erscheint ein komplett weisser Screen statt
// des App-Inhalts. Erst vollstaendiges Schliessen + Neustarten behebt es.
//
// BEWIESENER ROOT CAUSE (aus mitgeliefertem Screenshot des Diagnose-Overlays,
// siehe index.html "DIAGNOSTIC ERROR OVERLAY"):
//   Das Overlay zeigte "Root children: 3" (React hatte also erfolgreich
//   gerendert, der Screen war NICHT leer) + 2x "Script error. (:0:0)" — ein
//   generisches, von WebKit maskiertes Laufzeit-Fehlerbild (typisch fuer
//   type="module"-Skripte ohne crossorigin-Attribut: WebKit unterdrueckt
//   dabei IMMER Zeile/Spalte/Message). D.h. der weisse Screen war NICHT
//   "React rendert nichts", sondern der Diagnose-Overlay selbst (position:
//   fixed; inset:0; z-index:999999; background:#fff) legte sich permanent
//   ohne jede Selbstheilung ueber die eigentlich noch lebende App — siehe
//   der zugehoerige Fix im "DIAGNOSTIC ERROR OVERLAY"-Script in index.html
//   (unterdrueckt den Vollflaechen-Overlay jetzt iOS-only, wenn bereits
//   erfolgreich gerendert wurde, plus Auto-Cleanup beim naechsten Resume).
//
// ZUSAETZLICHE HAERTUNG (dieser Hook): iOS/WKWebView reklamiert den
// Speicher eines backgrounded WebViews AGGRESSIVER als Android — nach
// langer Hintergrundzeit kann die Supabase-Session-Pruefung beim naechsten
// Render synchron fehlschlagen (abgelaufener Access-Token), was in
// Komponenten, die ungeschuetzt auf einen gueltigen User zugreifen, exakt
// so eine unhandled Exception ausloesen kann wie im Bug-Report beschrieben.
// Dieser Hook validiert die Session deshalb PROAKTIV beim Resume (still,
// ohne UI-Blockierung) und raeumt einen evtl. haengenden Diagnose-Overlay
// zusaetzlich von der React-Seite auf (Redundanz zur index.html-Bereinigung
// -- schadet nicht, falls dort aus irgendeinem Grund kein Cleanup lief).
//
// Gleiches Muster wie BiometricGate.jsx / OTAUpdatePopup.jsx:
// registerPlugin("App", {}) statt direktem @capacitor/app-Import, damit im
// Web-Build kein Rollup-Resolve-Fehler entsteht (Plugin ist dort ein No-Op).
// ═══════════════════════════════════════════════════════════════════════════

import { useEffect, useRef } from "react";
import { Capacitor, registerPlugin } from "@capacitor/core";
import { supabase } from "../lib/supabaseClient.js";

const AppPlugin = registerPlugin("App", {});

export function useIOSResumeRecovery() {
  const backgroundedAtRef = useRef(null);

  useEffect(() => {
    // Harte Platform-Weiche — Android und Web bleiben exakt unveraendert.
    if (!Capacitor.isNativePlatform()) return;
    if (Capacitor.getPlatform() !== "ios") return;

    let listener;
    (async () => {
      try {
        listener = await AppPlugin.addListener("appStateChange", async ({ isActive }) => {
          if (!isActive) {
            backgroundedAtRef.current = Date.now();
            return;
          }

          const bgAt = backgroundedAtRef.current;
          backgroundedAtRef.current = null;
          if (!bgAt) return; // erster Start (kein echtes Background→Resume)

          // 1) Haengenden Diagnose-Overlay entfernen, falls die App inhaltlich
          //    noch lebt (Root hat Kinder) — Redundanz zur index.html-Logik.
          try {
            const overlay = document.getElementById("hui-error-overlay");
            const root = document.getElementById("root");
            if (overlay && root && root.children.length > 0) {
              overlay.remove();
            }
          } catch {
            // defensiv — darf den Resume-Flow nie blockieren
          }

          // 2) Session-Frische pruefen. Nach langer Hintergrundzeit kann der
          //    Access-Token abgelaufen sein — still erneuern statt eine
          //    Komponente ungeschuetzt gegen eine tote Session rendern zu
          //    lassen.
          try {
            const { data, error } = await supabase.auth.getSession();
            if (error || !data?.session) {
              await supabase.auth.refreshSession();
            }
          } catch (e) {
            console.warn("[iOS-Resume] Session-Refresh fehlgeschlagen:", e?.message);
          }
        });
      } catch {
        // No-Op — Plugin auf dieser Plattform nicht verfuegbar
      }
    })();

    return () => {
      listener?.remove?.();
    };
  }, []);
}
