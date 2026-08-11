// src/components/shared/ImageGalleryModal.jsx
// ══════════════════════════════════════════════════════════════════
// ImageGalleryModal — zentrale Fullscreen-Bildergalerie (SSOT) fuer die
// gesamte App.
//
// FIX v2 (2026-08-11) — "in alle Richtungen zoombar":
//   1. e.preventDefault() in ALLEN Touch-Move-Branches (Xiaomi WebView Fix)
//   2. Live-Pan-Clamping WAHREND des Draggings (nicht erst am Ende)
//   3. Pan-Range aus echten Bild-Dimensionen × Scale
//   4. will-change:transform fuer GPU-Beschleunigung
//   5. Pinch-Zoom mit Focal-Point (Zoom zum Pinch-Mittelpunkt)
//
// Aufruf: import { useImageGallery } from "../../context/ImageGalleryContext.jsx";
//   const { openGallery } = useImageGallery();
//   onClick={() => openGallery(images, idx)
// ══════════════════════════════════════════════════════════════════
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useWizardBodyLock } from "../../lib/wizardBodyLock.js";

const GALLERY_Z = 20000;
const SWIPE_THRESHOLD = 60;
const MAX_ZOOM = 3;
const DOUBLE_TAP_ZOOM = 2;

function touchDist(touches) {
  const [a, b] = touches;
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

function ArrowButton({ side, onClick, children }) {
  return (
    <button
      onClick={onClick}
      aria-label={side === "left" ? "Vorheriges Bild" : "Naechstes Bild"}
      style={{
        position: "absolute", [side]: 12, top: "50%", transform: "translateY(-50%)",
        zIndex: GALLERY_Z + 10,
        width: 40, height: 40, borderRadius: "50%",
        background: "rgba(255,255,255,0.14)", backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        border: "1px solid rgba(255,255,255,0.22)", color: "#fff",
        fontSize: 20, cursor: "pointer", fontFamily: "inherit",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >{children}</button>
  );
}

export default function ImageGalleryModal({ images, startIndex = 0, onClose = () => {} }) {
  const total = images.length;
  const [idx, setIdx] = useState(Math.min(Math.max(startIndex, 0), Math.max(total - 1, 0)));
  const [dragPx, setDragPx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const viewportRef = useRef(null);
  const imgRef = useRef(null);
  const startX = useRef(null);
  const startY = useRef(null);
  const panStart = useRef({ x: 0, y: 0 });
  const pinchStart = useRef(null);
  const lastTap = useRef(0);
  const swiping = useRef(false);
  const imgDimsRef = useRef({ w: 0, h: 0 });

  useWizardBodyLock(true);

  // ── Pan-Clamp: berechnet max Pan aus echten Bild-Dimensionen × Scale ──
  function clampPan(pX, pY, s) {
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var dims = imgDimsRef.current;
    var imgW = dims.w || vw;
    var imgH = dims.h || vh;
    var sw = imgW * s;
    var sh = imgH * s;
    var maxPX = Math.max(0, (sw - vw) / 2);
    var maxPY = Math.max(0, (sh - vh) / 2);
    return {
      x: Math.min(Math.max(pX, -maxPX), maxPX),
      y: Math.min(Math.max(pY, -maxPY), maxPY),
    };
  }

  function onImgLoad(e) {
    var img = e.target;
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var nw = img.naturalWidth || vw;
    var nh = img.naturalHeight || vh;
    var ar = nw / nh;
    var vwAr = vw / vh;
    if (ar > vwAr) {
      imgDimsRef.current = { w: vw, h: vw / ar };
    } else {
      imgDimsRef.current = { w: vh * ar, h: vh };
    }
  }

  const resetZoom = useCallback(() => { setScale(1); setPan({ x: 0, y: 0 }); }, []);

  const goTo = useCallback((next) => {
    if (next < 0 || next > total - 1) return;
    setIdx(next);
    resetZoom();
  }, [total, resetZoom]);

  const prev = useCallback(() => goTo(idx - 1), [idx, goTo]);
  const next = useCallback(() => goTo(idx + 1), [idx, goTo]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, prev, next]);

  const onTouchStart = (e) => {
    if (e.touches.length === 2) {
      var cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      var cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      pinchStart.current = { dist: touchDist(e.touches), scale, panX: pan.x, panY: pan.y, cx, cy };
      return;
    }
    if (e.touches.length === 1) {
      startX.current = e.touches[0].clientX;
      startY.current = e.touches[0].clientY;
      panStart.current = { ...pan };
      swiping.current = scale <= 1.02;
      setDragging(true);
    }
  };

  const onTouchMove = (e) => {
    // IMMER preventDefault — sonst greift der native WebView-Zoom (Xiaomi etc.)
    if (e.cancelable) e.preventDefault();

    if (e.touches.length === 2 && pinchStart.current) {
      const factor = touchDist(e.touches) / pinchStart.current.dist;
      const newScale = Math.min(Math.max(pinchStart.current.scale * factor, 1), MAX_ZOOM);
      setScale(newScale);
      // Focal-Point Zoom: Zoom zum Pinch-Mittelpunkt
      if (newScale > 1.02) {
        var cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        var cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        var vw = window.innerWidth;
        var vh = window.innerHeight;
        var offX = cx - vw / 2;
        var offY = cy - vh / 2;
        var scaleRatio = newScale / pinchStart.current.scale;
        var newPanX = pinchStart.current.panX * scaleRatio + offX * (1 - scaleRatio);
        var newPanY = pinchStart.current.panY * scaleRatio + offY * (1 - scaleRatio);
        var clamped = clampPan(newPanX, newPanY, newScale);
        setPan({ x: clamped.x, y: clamped.y });
      } else {
        setPan({ x: 0, y: 0 });
      }
      return;
    }
    if (e.touches.length === 1 && startX.current !== null) {
      const dx = e.touches[0].clientX - startX.current;
      const dy = e.touches[0].clientY - startY.current;
      if (swiping.current) {
        setDragPx(dx);
      } else {
        // ZOOMED: free pan mit LIVE-Clamping
        var rawX = panStart.current.x + dx;
        var rawY = panStart.current.y + dy;
        var clamped = clampPan(rawX, rawY, scale);
        setPan({ x: clamped.x, y: clamped.y });
      }
    }
  };

  const onTouchEnd = () => {
    pinchStart.current = null;
    if (swiping.current) {
      const w = viewportRef.current?.clientWidth || 1;
      if (dragPx > SWIPE_THRESHOLD && idx > 0) prev();
      else if (dragPx < -SWIPE_THRESHOLD && idx < total - 1) next();
      setDragPx(0);
    } else if (scale > 1.02) {
      // Final clamp safety
      var clamped = clampPan(pan.x, pan.y, scale);
      setPan({ x: clamped.x, y: clamped.y });
    }
    if (scale < 1.05) resetZoom();
    setDragging(false);
    startX.current = null;
    startY.current = null;
    swiping.current = false;
  };

  const onImageTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (scale > 1) resetZoom();
      else { setScale(DOUBLE_TAP_ZOOM); setPan({ x: 0, y: 0 }); }
    }
    lastTap.current = now;
  };

  if (!total) return null;

  const dragPercent = dragging && swiping.current
    ? (dragPx / (viewportRef.current?.clientWidth || 1)) * 100
    : 0;

  return createPortal(
    <div
      style={{
        position: "fixed", inset: 0, zIndex: GALLERY_Z,
        background: "rgba(8,8,10,0.97)",
        display: "flex", flexDirection: "column",
        touchAction: "none",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <button
        onClick={onClose}
        aria-label="Galerie schliessen"
        style={{
          position: "absolute", top: "calc(16px + max(var(--hui-safe-top, 0px), env(safe-area-inset-top, 0px)))", right: 16,
          zIndex: GALLERY_Z + 10,
          width: 40, height: 40, borderRadius: "50%",
          background: "rgba(255,255,255,0.12)", backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          border: "1px solid rgba(255,255,255,0.2)", color: "#fff",
          fontSize: 20, lineHeight: 1, cursor: "pointer", fontFamily: "inherit",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >✕</button>

      {total > 1 && (
        <div style={{
          position: "absolute", top: "calc(20px + max(var(--hui-safe-top, 0px), env(safe-area-inset-top, 0px)))", left: "50%",
          transform: "translateX(-50%)", zIndex: GALLERY_Z + 10,
          color: "rgba(255,255,255,0.88)", fontSize: 13, fontWeight: 600,
          background: "rgba(255,255,255,0.12)", borderRadius: 99, padding: "4px 12px",
          fontFamily: "inherit",
        }}>{idx + 1} / {total}</div>
      )}

      <div
        ref={viewportRef}
        style={{ flex: 1, position: "relative", overflow: "hidden" }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          style={{
            display: "flex", height: "100%",
            transform: `translateX(calc(${-idx * 100}% + ${dragPercent}%))`,
            transition: dragging ? "none" : "transform 0.28s cubic-bezier(0.22,1,0.36,1)",
          }}
        >
          {images.map((src, i) => (
            <div key={i} style={{
              flex: "0 0 100%", height: "100%",
              display: "flex", alignItems: "center", justifyContent: "center",
              overflow: "hidden",
            }}>
              <img
                ref={i === idx ? imgRef : undefined}
                src={src} alt={`Bild ${i + 1} von ${total}`}
                onLoad={i === idx ? onImgLoad : undefined}
                onClick={i === idx ? onImageTap : undefined}
                draggable={false}
                loading={Math.abs(i - idx) <= 1 ? "eager" : "lazy"}
                style={{
                  maxWidth: "100%", maxHeight: "100%", objectFit: "contain",
                  transform: i === idx ? `translate(${pan.x}px, ${pan.y}px) scale(${scale})` : "none",
                  transition: dragging ? "none" : "transform 0.2s ease",
                  userSelect: "none", WebkitUserSelect: "none",
                  willChange: "transform",
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {total > 1 && idx > 0 && <ArrowButton side="left" onClick={prev}>‹</ArrowButton>}
      {total > 1 && idx < total - 1 && <ArrowButton side="right" onClick={next}>›</ArrowButton>}

      {total > 1 && total <= 12 && (
        <div style={{
          position: "absolute", bottom: "calc(20px + env(safe-area-inset-bottom, 0px))", left: "50%",
          transform: "translateX(-50%)", display: "flex", gap: 5, zIndex: GALLERY_Z + 10,
        }}>
          {images.map((_, i) => (
            <div key={i} onClick={() => goTo(i)}
              style={{
                width: i === idx ? 18 : 6, height: 6, borderRadius: 3,
                background: i === idx ? "#fff" : "rgba(255,255,255,0.4)",
                transition: "all 0.25s", cursor: "pointer",
              }} />
          ))}
        </div>
      )}
    </div>,
    document.body
  );
}
