// src/components/entry/IntroVideoScreen.jsx
// Intro-Video beim App-Start. Falls Autoplay blockiert wird → CSS-Animation als Fallback.
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

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
  const finishedRef = useRef(false);
  const videoStartedRef = useRef(false);

  const finish = useCallback((reason) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setFading(true);
    setTimeout(() => {
      setDone(true);
      navigate("/login", { replace: true });
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
      position: "fixed", inset: 0, zIndex: 99999,
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
          width: "100%", height: "100%", objectFit: "cover", objectPosition: "center",
          opacity: showFallback ? 0 : 1,
          transition: "opacity 400ms ease-out",
        }}
      />
      {showFallback && (
        <div style={{
          position: "absolute", inset: 0,
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
