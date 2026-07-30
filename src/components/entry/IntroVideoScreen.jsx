// src/components/entry/IntroVideoScreen.jsx
// HUI Intro Video Screen — ersetzt das pulsierende Splash-Logo
// Spielt ein lokales Video im 9:16 Format ab, danach -> Login/AuthGate
// Unterstützt: Web (HTML5 video) + Capacitor (iOS/Android via same element)
// Lifecycle: Cold Start, AppState resume, sessionStorage-Flag

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// ── Konfiguration ──────────────────────────────────────────────────────────
const VIDEO_PATH = "/assets/intro-video.mp4";

// Modus: "first-launch" = nur beim ersten App-Start (localStorage Flag)
//        "every-launch"  = bei jedem App-Start
const PLAY_MODE = "first-launch";

const STORAGE_KEY = "hui_intro_video_played";
const FADE_DURATION = 600; // ms — sanfter Fade-Out

export default function IntroVideoScreen() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [fading, setFading] = useState(false);
  const [done, setDone] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const startedRef = useRef(false);

  // ── Transition to Login ──────────────────────────────────────────────────
  const finish = useCallback(() => {
    if (startedRef.current) return; // Guard — nur einmal
    startedRef.current = true;
    setFading(true);
    setTimeout(() => {
      setDone(true);
      navigate("/login", { replace: true });
    }, FADE_DURATION);
  }, [navigate]);

  // ── Soll das Video abgespielt werden? ────────────────────────────────────
  const shouldPlay = useCallback(() => {
    if (PLAY_MODE === "every-launch") return true;
    if (PLAY_MODE === "first-launch") {
      try {
        const played = localStorage.getItem(STORAGE_KEY);
        if (played) return false; // schon abgespielt -> skip
      } catch (e) {}
    }
    return true;
  }, []);

  // ── Video-Start + Lifecycle ──────────────────────────────────────────────
  useEffect(() => {
    if (!shouldPlay()) {
      navigate("/login", { replace: true });
      return;
    }

    const video = videoRef.current;
    if (!video) {
      finish();
      return;
    }

    video.load();

    const tryPlay = async () => {
      try {
        video.muted = false;
        await video.play();
      } catch (err) {
        try {
          video.muted = true;
          video.setAttribute("muted", "true");
          await video.play();
        } catch (err2) {
          console.warn("[IntroVideo] Autoplay blockiert:", err2?.message);
          setVideoError(true);
          finish();
        }
      }
    };

    const playTimer = setTimeout(tryPlay, 100);

    // ── AppState Handling (document visibility) ───────────────────────────
    const handleVisibilityChange = () => {
      if (document.hidden) {
        video?.pause();
      } else if (!done && !fading && !videoError) {
        video?.play().catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // ── Capacitor AppState Plugin (falls vorhanden) ────────────────────────
    let cleanupCapacitor = null;
    if (window.Capacitor?.Plugins?.App) {
      const { App: CapApp } = window.Capacitor.Plugins;
      const listenerPromise = CapApp.addListener("appStateChange", (state) => {
        if (state.isActive && !done && !fading && !videoError) {
          video?.play().catch(() => {});
        } else if (!state.isActive) {
          video?.pause();
        }
      });
      cleanupCapacitor = () => listenerPromise.then((l) => l.remove());
    }

    return () => {
      clearTimeout(playTimer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (cleanupCapacitor) cleanupCapacitor();
    };
  }, [shouldPlay, navigate, finish, done, fading, videoError]);

  // ── Video Error Fallback -> direkt weiter ────────────────────────────────
  useEffect(() => {
    if (videoError) {
      const t = setTimeout(() => finish(), 200);
      return () => clearTimeout(t);
    }
  }, [videoError, finish]);

  if (done) return null;
  if (videoError) return null;

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        opacity: fading ? 0 : 1,
        transition: `opacity ${FADE_DURATION}ms ease-out`,
      }}
    >
      <video
        ref={videoRef}
        src={VIDEO_PATH}
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={() => {
          if (PLAY_MODE === "first-launch") {
            try { localStorage.setItem(STORAGE_KEY, "1"); } catch (e) {}
          }
          finish();
        }}
        onError={() => {
          console.warn("[IntroVideo] Video konnte nicht geladen werden:", VIDEO_PATH);
          setVideoError(true);
        }}
        onLoadedData={() => {
          const v = videoRef.current;
          if (v && v.paused) {
            v.play().catch(() => {
              v.muted = true;
              v.play().catch(() => setVideoError(true));
            });
          }
        }}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center",
        }}
      />
    </div>
  );
}
