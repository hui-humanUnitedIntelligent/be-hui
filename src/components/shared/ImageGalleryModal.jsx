// src/components/shared/ImageGalleryModal.jsx
// ══════════════════════════════════════════════════════════════════
// ImageGalleryModal — zentrale Fullscreen-Bildergalerie (SSOT) fuer die
// gesamte App.
//
// Ersetzt ALLE bisherigen <a href={url} target="_blank">-Muster um
// Bilder, die eine externe Supabase-Storage-URL im (System-)Browser
// oeffneten. Ab jetzt bleibt jede Bild-Ansicht innerhalb der App.
//
// Aufruf von ueberall im Code (siehe ImageGalleryContext.jsx):
//   import { useImageGallery } from "../../context/ImageGalleryContext.jsx";
//   const { openGallery } = useImageGallery();
//   onClick={() => openGallery(images, idx)}
//
// Pflicht-Muster (siehe .agents/rules/footer-navbar-zindex.md):
// createPortal auf document.body + zIndex weit oberhalb der BottomNav
// (10000) UND oberhalb aller anderen Portale (>=10500) -- diese Galerie
// kann aus JEDEM bestehenden Modal/Sheet heraus geoeffnet werden (Chat,
// Kommentare, Profil-Studio, Impact-Updates, Support-Tickets), muss also
// immer zuoberst liegen.
// ══════════════════════════════════════════════════════════════════
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useWizardBodyLock } from "../../lib/wizardBodyLock.js";

const GALLERY_Z = 20000;
const SWIPE_THRESHOLD = 60;
const MAX_ZOOM = 4;
const DOUBLE_TAP_ZOOM = 2.4;

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
  const startX = useRef(null);
  const startY = useRef(null);
  const panStart = useRef({ x: 0, y: 0 });
  const pinchStart = useRef(null);
  const lastTap = useRef(0);
  const swiping = useRef(false);

  useWizardBodyLock(true);

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
      pinchStart.current = { dist: touchDist(e.touches), scale };
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
    if (e.touches.length === 2 && pinchStart.current) {
      const factor = touchDist(e.touches) / pinchStart.current.dist;
      setScale(Math.min(Math.max(pinchStart.current.scale * factor, 1), MAX_ZOOM));
      return;
    }
    if (e.touches.length === 1 && startX.current !== null) {
      const dx = e.touches[0].clientX - startX.current;
      const dy = e.touches[0].clientY - startY.current;
      if (swiping.current) {
        setDragPx(dx);
      } else {
        setPan({ x: panStart.current.x + dx, y: panStart.current.y + dy });
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
          position: "absolute", top: "calc(16px + env(safe-area-inset-top, 0px))", right: 16,
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
          position: "absolute", top: "calc(20px + env(safe-area-inset-top, 0px))", left: "50%",
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
                src={src} alt={`Bild ${i + 1} von ${total}`}
                onClick={i === idx ? onImageTap : undefined}
                draggable={false}
                loading={Math.abs(i - idx) <= 1 ? "eager" : "lazy"}
                style={{
                  maxWidth: "100%", maxHeight: "100%", objectFit: "contain",
                  transform: i === idx ? `translate(${pan.x}px, ${pan.y}px) scale(${scale})` : "none",
                  transition: dragging ? "none" : "transform 0.2s ease",
                  userSelect: "none", WebkitUserSelect: "none",
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
