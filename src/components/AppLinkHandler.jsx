// src/components/AppLinkHandler.jsx
// ══════════════════════════════════════════════════════════════════════
// ANDROID APP LINKS — appUrlOpen Listener (INC-003, 2026-09-01)
// ══════════════════════════════════════════════════════════════════════
//
// Wenn Android einen App Link (https://be-hui.vercel.app/...) öffnet,
// landet die URL in der Capacitor WebView. Ohne diesen Handler würde
// die WebView einfach zur URL navigieren (was bei /auth/callback die
// React-Router-Route auslöst — das funktioniert). ABER bei Links die
// nicht im React-Router definiert sind (z.B. Marketing-Seiten) würde
// die WebView einen 404 zeigen.
//
// Dieser Handler fängt appUrlOpen-Events ab und übersetzt sie in
// React-Router-Navigation, analog zum etablierten Pattern in
// AndroidBackButtonHandler.jsx (registerPlugin statt @capacitor/app
// Import → kein Rollup-Resolve-Fehler im Web-Build).
//
// PFLICHT: Muss INSIDE BrowserRouter leben (braucht useNavigate).
// ══════════════════════════════════════════════════════════════════════

import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Capacitor, registerPlugin } from "@capacitor/core";

const App = registerPlugin("App", {});

// Bekannte React-Router-Routen (Präfix-Matching reicht für die meisten).
// Wenn die URL hiermit matcht → navigate, sonst → window.location fallback.
const ROUTE_PREFIXES = [
  "/auth/callback",
  "/login",
  "/Home",
  "/home",
  "/work/",
  "/profile/",
  "/wirker/",
  "/werke/",
  "/beitrag/",
  "/projekt/",
  "/erlebnis/",
  "/veranstaltung/",
  "/talent/",
  "/impact",
  "/diagnose",
  "/dashboard",
  "/Admin",
];

export function AppLinkHandler({ children }) {
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let removed = false;
    let listenerPromise = null;

    const setup = async () => {
      try {
        listenerPromise = App.addListener("appUrlOpen", ({ url }) => {
          if (!url || removed) return;

          try {
            const parsed = new URL(url);
            const path = parsed.pathname;

            // Prüfe ob die URL eine unserer React-Router-Routen ist
            const isKnownRoute = ROUTE_PREFIXES.some(
              (prefix) => path === prefix || path.startsWith(prefix)
            );

            if (isKnownRoute) {
              // Query-Params mitnehmen (token_hash, type für /auth/callback)
              const search = parsed.search || "";
              navigateRef.current(path + search);
            } else {
              // Unbekannte Route (z.B. Marketing-Seite) → in WebView laden
              // statt Router-Navigation — lässt die Seite normal anzeigen.
              // Nur wenn es unsere Domain ist, sonst extern.
              if (
                parsed.hostname.includes("be-hui") ||
                parsed.hostname.includes("hui.app")
              ) {
                window.location.href = url;
              }
              // Externe URLs: nicht automatisch öffnen (Sicherheit)
            }
          } catch (e) {
            // URL-Parsing-Fehler → sicherer Fallback
            console.warn("[AppLinkHandler] Could not parse URL:", url, e);
          }
        });
      } catch (e) {
        // Plugin nicht verfügbar (sollte auf nativer Plattform nicht passieren)
        console.warn("[AppLinkHandler] Could not register appUrlOpen listener:", e);
      }
    };

    setup();

    return () => {
      removed = true;
      listenerPromise?.then?.((listener) => {
        listener?.remove?.();
      }).catch(() => {});
    };
  }, []);

  return children || null;
}
