// src/components/entry/IntroVideoScreen.jsx
// Intro-Video beim App-Start. Falls Autoplay blockiert wird → CSS-Animation als Fallback.
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { APP_VERSION } from "../../version.js";
import { supabase } from "../../lib/supabaseClient";

const VIDEO_PATH = "/assets/intro-video.mp4";
const POSTER_PATH = "/assets/intro-poster.jpg";
const FADE_DURATION = 800;
const VIDEO_TIMEOUT = 2500;   // Wenn Video nach 2.5s nicht startet → Fallback
const FALLBACK_DURATION = 1500; // Fallback-Anzeige Dauer

export default function IntroVideoScreen() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [fading, setFading] = useState(false);
  const [done, setDone] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const [versionLabel, setVersionLabel] = useState(`v${APP_VERSION}`);
  const finishedRef = useRef(false);
  const videoStartedRef = useRef(false);
  // NAV-SKIP-LOGIN-FLASH (2026-08-18): Session wird PARALLEL zum Video geprüft,
  // damit bereits eingeloggte Nutzer direkt zu /Home springen und der
  // LoginPage-Screen ("Verbinde dich mit Menschen...") nicht mehr kurz aufblitzt.
  const targetRouteRef = useRef("/login");

  // OTA-Check: Aktuelle Version oder "Update auf x.x.x" anzeigen
  useEffect(() => {
    const checkUpdate = async () => {
      try {
        const resp = await fetch("https://be-hui.vercel.app/app-version.json", { cache: "no-store" });
        if (!resp.ok) return;
        const data = await resp.json();
        const serverVersion = data.version;
        if (!serverVersion) return;
        // Vergleiche Versionen
        const pa = String(serverVersion).split(".").map(Number);
        const pb = String(APP_VERSION).split(".").map(Number);
        let isNewer = false;
        for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
          const va = pa[i] || 0;
          const vb = pb[i] || 0;
          if (va > vb) { isNewer = true; break; }
          if (va < vb) break;
        }
        if (isNewer) {
          setVersionLabel(`Update auf v${serverVersion}`);
        }
      } catch (e) { /* offline — zeige aktuelle Version */ }
    };
    checkUpdate();

    // Session parallel zum Video prüfen (siehe targetRouteRef oben)
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        targetRouteRef.current = session ? "/Home" : "/login";
      } catch (e) {
        targetRouteRef.current = "/login"; // Fallback: sicherer Weg über Login
      }
    };
    checkSession();
  }, []);

  const finish = useCallback((reason) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setFading(true);
    setTimeout(() => {
      setDone(true);
      navigate(targetRouteRef.current, { replace: true });
    }, FADE_DURATION);
  }, [navigate]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) { finish("no-ref"); return; }

    // Video laden
    video.src = VIDEO_PATH;
    video.load();

    // Timer: Wenn Video nach VIDEO_TIMEOUT nicht gestartet ist → Fallback
    const fallbackTimer = setTimeout(() => {
      if (!videoStartedRef.current && !finishedRef.current) {
        setShowFallback(true);
        setTimeout(() => finish("fallback"), FALLBACK_DURATION);
      }
    }, VIDEO_TIMEOUT);

    // Safety: Nach 12s definitiv finish
    const safetyTimer = setTimeout(() => {
      if (!finishedRef.current) finish("safety");
    }, 12000);

    // Visibility handling
    const handleVisibility = () => {
      if (document.hidden) video?.pause();
      else if (!finishedRef.current && videoStartedRef.current) video?.play().catch(() => {});
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearTimeout(fallbackTimer);
      clearTimeout(safetyTimer);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [finish]);

  // Versuche play() nach kurzer Verzögerung
  useEffect(() => {
    if (showFallback || done) return;
    const video = videoRef.current;
    if (!video) return;

    const tryPlay = async () => {
      if (videoStartedRef.current || finishedRef.current) return;
      try {
        video.muted = true;
        video.defaultMuted = true;
        await video.play();
      } catch (err) {
        // Autoplay blockiert — Fallback übernimmt
      }
    };

    const t1 = setTimeout(tryPlay, 200);
    const t2 = setTimeout(tryPlay, 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [showFallback, done]);

  if (done) return null;

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100vw", height: "100dvh",
      zIndex: 99999,
      background: "#000",
      opacity: fading ? 0 : 1,
      transition: `opacity ${FADE_DURATION}ms ease-out`,
    }}>
      <video
        ref={videoRef}
        muted
        playsInline
        preload="auto"
        poster={POSTER_PATH}
        onPlaying={() => { videoStartedRef.current = true; setShowFallback(false); }}
        onEnded={() => finish("ended")}
        onError={() => setShowFallback(true)}
        style={{
          width: "100vw", height: "100dvh", objectFit: "cover", objectPosition: "center",
          display: "block",
          opacity: showFallback ? 0 : 1,
          transition: "opacity 400ms ease-out",
        }}
      />
      {/* Versions-Anzeige — nur während des Intro-Videos */}
      <div style={{
        position: "absolute",
        bottom: "calc(24px + max(var(--hui-safe-bottom, 0px), env(safe-area-inset-bottom, 0px), 0px))",
        left: 0, right: 0,
        textAlign: "center",
        color: "rgba(0,0,0,0.45)",
        fontSize: "12px",
        fontWeight: 500,
        fontFamily: "Inter, system-ui, sans-serif",
        letterSpacing: "0.5px",
        zIndex: 1,
        pointerEvents: "none",
        opacity: showFallback ? 0 : (fading ? 0 : 1),
        transition: "opacity 400ms ease-out",
      }}>
        {versionLabel}
      </div>
      {showFallback && (
        <div style={{
          position: "absolute", top: 0, left: 0, width: "100vw", height: "100dvh",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexDirection: "column", gap: "24px",
        }}>
          <div style={{
            width: "80px", height: "80px", borderRadius: "50%",
            background: "linear-gradient(135deg, #00D4B1, #00A89A)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "36px", fontWeight: 600, color: "#fff",
            animation: "introPulse 1.2s ease-in-out infinite",
            boxShadow: "0 0 40px rgba(0, 212, 177, 0.4)",
          }}>H</div>
          <div style={{
            color: "rgba(255,255,255,0.9)", fontSize: "14px", fontWeight: 600,
            letterSpacing: "2px", textTransform: "uppercase",
            animation: "introFadeIn 800ms ease-out",
          }}>HUI</div>
          <style>{`
            @keyframes introPulse {
              0%,100% { transform: scale(1); opacity: 0.85; }
              50% { transform: scale(1.12); opacity: 1; }
            }
            @keyframes introFadeIn {
              from { opacity: 0; transform: translateY(8px); }
              to { opacity: 0.9; transform: translateY(0); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
