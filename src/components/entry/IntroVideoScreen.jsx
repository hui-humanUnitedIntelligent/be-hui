import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const VIDEO_PATH = "/assets/intro-video.mp4";
const FADE_DURATION = 600;
const SAFETY_TIMEOUT = 10000;

export default function IntroVideoScreen() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [fading, setFading] = useState(false);
  const [done, setDone] = useState(false);
  const [diag, setDiag] = useState(["init"]);
  const startedRef = useRef(false);
  const finishedRef = useRef(false);

  const addDiag = useCallback((msg) => {
    const ts = new Date().toISOString().substr(14, 9);
    setDiag(prev => [...prev.slice(-15), `${ts} ${msg}`]);
  }, []);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    startedRef.current = true;
    addDiag("→ FINISH → /login");
    setFading(true);
    setTimeout(() => {
      setDone(true);
      navigate("/login", { replace: true });
    }, FADE_DURATION);
  }, [navigate, addDiag]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) { finish(); return; }

    addDiag("mount OK");

    // EXPLICITLY set src + load
    video.src = VIDEO_PATH;
    video.load();
    addDiag("src set + load() called");

    // Check load status every 500ms
    const checkInterval = setInterval(() => {
      if (finishedRef.current) { clearInterval(checkInterval); return; }
      addDiag(`check — paused=${video.paused} readyState=${video.readyState} ct=${video.currentTime?.toFixed(2)} networkState=${video.networkState} buffered=${video.buffered?.length > 0 ? video.buffered.end(0)?.toFixed(2) : 'none'}`);
    }, 500);

    // Try play at 300ms, 1s, 2s, 4s
    const tryPlay = async (attempt) => {
      if (finishedRef.current) return;
      addDiag(`play#${attempt} — paused=${video.paused} readyState=${video.readyState}`);
      try {
        video.muted = true;
        video.defaultMuted = true;
        await video.play();
        addDiag(`✓ play#${attempt} OK — ct=${video.currentTime?.toFixed(2)}`);
      } catch (err) {
        addDiag(`✗ play#${attempt} FAIL: ${err?.name} ${err?.message}`);
        if (attempt >= 4) {
          addDiag("all play attempts failed");
          finish();
        }
      }
    };

    const t1 = setTimeout(() => tryPlay(1), 300);
    const t2 = setTimeout(() => tryPlay(2), 1000);
    const t3 = setTimeout(() => tryPlay(3), 2000);
    const t4 = setTimeout(() => tryPlay(4), 4000);

    const safetyTimer = setTimeout(() => {
      if (!finishedRef.current) {
        addDiag("⚠ SAFETY TIMEOUT");
        finish();
      }
    }, SAFETY_TIMEOUT);

    return () => {
      clearInterval(checkInterval);
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4);
      clearTimeout(safetyTimer);
    };
  }, [finish, addDiag]);

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
        onLoadedMetadata={(e) => addDiag(`meta — dur=${e.currentTarget.duration} w=${e.currentTarget.videoWidth} h=${e.currentTarget.videoHeight}`)}
        onLoadedData={() => addDiag("loadedData")}
        onCanPlay={(e) => addDiag(`canPlay — paused=${e.currentTarget.paused} rs=${e.currentTarget.readyState}`)}
        onPlaying={() => addDiag(`▶ PLAYING ct=${videoRef.current?.currentTime?.toFixed(2)}`)}
        onTimeUpdate={() => addDiag(`time ct=${videoRef.current?.currentTime?.toFixed(2)}`)}
        onEnded={() => { addDiag("ENDED"); finish(); }}
        onError={(e) => addDiag(`✗ ERROR code=${e.currentTarget.error?.code} msg=${e.currentTarget.error?.message}`)}
        onStalled={() => addDiag("stalled")}
        onSuspend={() => addDiag("suspend")}
        onProgress={() => addDiag(`progress — buffered=${videoRef.current?.buffered?.length > 0 ? videoRef.current?.buffered?.end(0)?.toFixed(2) : 'none'}`)}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
        color: "#0f0", font: "10px monospace", padding: "8px",
        background: "rgba(0,0,0,0.85)", zIndex: 100,
        pointerEvents: "none", whiteSpace: "pre-wrap",
        overflow: "auto",
      }}>
        {diag.map((d, i) => <div key={i}>{d}</div>)}
      </div>
    </div>
  );
}
