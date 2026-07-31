import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const PLAY_MODE = "every-launch";
const STORAGE_KEY = "hui_intro_video_played";
const FADE_DURATION = 600;
const SAFETY_TIMEOUT = 8000;

export default function IntroVideoScreen() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [fading, setFading] = useState(false);
  const [done, setDone] = useState(false);
  const [diag, setDiag] = useState(["init"]);
  const startedRef = useRef(false);
  const playAttemptRef = useRef(0);

  const addDiag = useCallback((msg) => {
    const ts = new Date().toISOString().substr(14, 9);
    setDiag(prev => [...prev.slice(-8), `${ts} ${msg}`]);
  }, []);

  const finish = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    addDiag("→ FINISH");
    setFading(true);
    setTimeout(() => {
      setDone(true);
      navigate("/login", { replace: true });
    }, FADE_DURATION);
  }, [navigate, addDiag]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) { finish(); return; }

    addDiag("mount — video ref OK");

    const safetyTimer = setTimeout(() => {
      if (!startedRef.current) {
        addDiag("⚠ SAFETY TIMEOUT — play() never resolved");
        if (video) {
          addDiag(`  paused=${video.paused} readyState=${video.readyState} currentTime=${video.currentTime} error=${video.error?.code || 'none'}`);
        }
        finish();
      }
    }, SAFETY_TIMEOUT);

    // Versuche play() nach 200ms
    const tryPlay = async () => {
      playAttemptRef.current++;
      const attempt = playAttemptRef.current;
      addDiag(`play attempt ${attempt} — paused=${video.paused} readyState=${video.readyState}`);
      try {
        video.muted = true;
        video.defaultMuted = true;
        video.volume = 0;
        const playPromise = video.play();
        addDiag(`play() returned: ${typeof playPromise}`);
        if (playPromise && typeof playPromise.then === 'function') {
          await playPromise;
          addDiag(`✓ play() resolved — ct=${video.currentTime} dur=${video.duration}`);
        } else {
          addDiag("play() returned non-Promise (legacy)");
        }
      } catch (err) {
        addDiag(`✗ play() rejected: ${err?.name} — ${err?.message}`);
        // Versuch 2: nach 500ms nochmal
        if (attempt < 3) {
          setTimeout(tryPlay, 500);
        } else {
          finish();
        }
      }
    };

    const t1 = setTimeout(tryPlay, 200);
    const t2 = setTimeout(tryPlay, 1000);
    const t3 = setTimeout(tryPlay, 2500);

    return () => {
      clearTimeout(safetyTimer);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [finish, addDiag]);

  useEffect(() => {
    if (fading && !done) {
      const t = setTimeout(() => finish(), 200);
      return () => clearTimeout(t);
    }
  }, [fading, done, finish]);

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
        src="/assets/intro-video.mp4"
        autoPlay
        muted
        playsInline
        loop={false}
        preload="auto"
        onLoadedMetadata={() => addDiag(`loadedMetadata — dur=${videoRef.current?.duration} w=${videoRef.current?.videoWidth} h=${videoRef.current?.videoHeight}`)}
        onLoadedData={() => addDiag("loadedData")}
        onCanPlay={() => addDiag(`canPlay — paused=${videoRef.current?.paused} readyState=${videoRef.current?.readyState}`)}
        onPlaying={() => addDiag(`▶ PLAYING — ct=${videoRef.current?.currentTime}`)}
        onTimeUpdate={() => addDiag(`timeUpdate — ct=${videoRef.current?.currentTime?.toFixed(2)}`)}
        onEnded={() => { addDiag("ENDED"); finish(); }}
        onError={() => addDiag(`✗ ERROR — code=${videoRef.current?.error?.code} msg=${videoRef.current?.error?.message}`)}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
        color: "#0f0", font: "11px monospace", padding: "8px",
        background: "rgba(0,0,0,0.85)", zIndex: 100,
        pointerEvents: "none", whiteSpace: "pre-wrap",
        overflow: "auto",
      }}>
        {diag.map((d, i) => <div key={i}>{d}</div>)}
      </div>
    </div>
  );
}
