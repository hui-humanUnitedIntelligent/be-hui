// src/components/entry/IntroVideoScreen.jsx — DIAGNOSE VERSION
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const VIDEO_PATH = "/assets/intro-video.mp4";
const PLAY_MODE = "every-launch";
const STORAGE_KEY = "hui_intro_video_played";
const FADE_DURATION = 600;
const SAFETY_TIMEOUT = 4000;

export default function IntroVideoScreen() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [fading, setFading] = useState(false);
  const [done, setDone] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [diag, setDiag] = useState("init");
  const startedRef = useRef(false);

  const finish = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    setDiag("FINISH called");
    setFading(true);
    setTimeout(() => {
      setDone(true);
      navigate("/login", { replace: true });
    }, FADE_DURATION);
  }, [navigate]);

  const shouldPlay = useCallback(() => {
    if (PLAY_MODE === "every-launch") return true;
    if (PLAY_MODE === "first-launch") {
      try {
        if (localStorage.getItem(STORAGE_KEY)) return false;
      } catch (e) {}
    }
    return true;
  }, []);

  useEffect(() => {
    if (!shouldPlay()) {
      navigate("/login", { replace: true });
      return;
    }
    const video = videoRef.current;
    if (!video) { finish(); return; }

    setDiag("useEffect — video ref OK");

    const safetyTimer = setTimeout(() => {
      if (!startedRef.current) {
        setDiag("SAFETY TIMEOUT");
        finish();
      }
    }, SAFETY_TIMEOUT);

    video.load();
    setDiag("video.load() called");

    const playTimer = setTimeout(async () => {
      try {
        video.muted = true;
        video.setAttribute("muted", "true");
        setDiag("tryPlay — calling play()...");
        await video.play();
        setDiag("tryPlay — play() OK! ct=" + video.currentTime + " dur=" + video.duration);
      } catch (err) {
        setDiag("tryPlay FAIL: " + (err?.message || "unknown"));
        setVideoError(true);
        finish();
      }
    }, 100);

    const handleVisibilityChange = () => {
      if (document.hidden) video?.pause();
      else if (!done && !fading && !videoError) video?.play().catch(() => {});
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearTimeout(safetyTimer);
      clearTimeout(playTimer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [shouldPlay, navigate, finish, done, fading, videoError]);

  useEffect(() => {
    if (videoError) {
      const t = setTimeout(() => finish(), 200);
      return () => clearTimeout(t);
    }
  }, [videoError, finish]);

  if (done) return null;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 99999,
        background: "#000",
        opacity: fading ? 0 : 1,
        transition: `opacity ${FADE_DURATION}ms ease-out`,
      }}
    >
      <video
        ref={videoRef}
        src={VIDEO_PATH}
        autoPlay muted playsInline preload="auto"
        onEnded={() => {
          setDiag("ENDED — ct=" + videoRef.current?.currentTime);
          if (PLAY_MODE === "first-launch") {
            try { localStorage.setItem(STORAGE_KEY, "1"); } catch (e) {}
          }
          finish();
        }}
        onError={() => {
          const v = videoRef.current;
          setDiag("ERROR — code=" + v?.error?.code + " msg=" + v?.error?.message);
          setVideoError(true);
        }}
        onCanPlay={() => {
          const v = videoRef.current;
          setDiag("canPlay — paused=" + v?.paused + " ct=" + v?.currentTime + " dur=" + v?.duration);
          if (v && v.paused) {
            v.muted = true;
            v.play().then(() => setDiag("canPlay play() OK")).catch(e => setDiag("canPlay play() FAIL: " + e.message));
          }
        }}
        onPlaying={() => setDiag("PLAYING — ct=" + videoRef.current?.currentTime)}
        style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
      />
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        color: "#0f0", font: "14px monospace", padding: "8px",
        background: "rgba(0,0,0,0.7)", zIndex: 100,
        pointerEvents: "none", whiteSpace: "pre-wrap",
      }}>
        DIAG: {diag}
      </div>
    </div>
  );
}
