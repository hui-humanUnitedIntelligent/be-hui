// src/components/shared/ImageLightbox.jsx — LIGHTBOX.1 (2026-08-08)
// Appweit wiederverwendbare Full-Screen Bildbetrachter-Komponente.
// Wird ueber den globalen window.__HUI_LIGHTBOX__ Hook geoeffnet:
//   window.__HUI_LIGHTBOX__.open(images, startIndex)
//   images: Array von { url, type, alt } (type: "image" | "video")
//   startIndex: Index des zuerst anzuzeigenden Bildes (Default 0)
import React, { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useModalRegistration } from "../../hooks/useModalRegistration.js";

const ANIM_MS = 220;
const CSS = `
@keyframes huiLbEnter { from { opacity: 0; } to { opacity: 1; } }
@keyframes huiLbImgEnter { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
@keyframes huiLbExit { from { opacity: 1; } to { opacity: 0; } }
`;
let _cssInjected = false;
function injectCSS() {
  if (_cssInjected || typeof document === "undefined") return;
  _cssInjected = true;
  const s = document.createElement("style"); s.textContent = CSS;
  document.head.appendChild(s);
}

export default function ImageLightbox() {
  const [images, setImages] = useState(null);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [scale, setScale] = useState(1);
  const [dragY, setDragY] = useState(0);
  const [dragX, setDragX] = useState(0);
  const dragRef = useRef({ startX:0, startY:0, dragging:false, pinchStart:0, pinchDist:0, lastTap:0 });
  const closeTimerRef = useRef(null);
  const rafRef = useRef(null);

  injectCSS();

  useEffect(() => {
    window.__HUI_LIGHTBOX__ = {
      open(imgs, start) {
        if (!imgs || !imgs.length) return;
        const normalized = imgs.map(function(m) {
          if (typeof m === "string") return { url: m, type: "image", alt: "" };
          return { url: (m && m.url) || (m && m.src) || "", type: (m && m.type === "video") ? "video" : "image", alt: (m && m.alt) || "" };
        }).filter(function(m) { return !!m.url; });
        if (!normalized.length) return;
        if (closeTimerRef.current) { clearTimeout(closeTimerRef.current); closeTimerRef.current = null; }
        setImages(normalized);
        setIndex(Math.min(start || 0, normalized.length - 1));
        setScale(1); setDragY(0); setDragX(0);
        rafRef.current = requestAnimationFrame(function() { setVisible(true); });
      },
    };
    return function() { delete window.__HUI_LIGHTBOX__; };
  }, []);

  useEffect(function() {
    if (!images) return;
    var prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return function() { document.body.style.overflow = prev; };
  }, [images]);

  var close = useCallback(function() {
    setVisible(false);
    closeTimerRef.current = setTimeout(function() {
      setImages(null); setScale(1); setDragY(0); setDragX(0);
    }, ANIM_MS);
  }, []);

  // BACK-BUTTON: Register so Android back button closes the lightbox
  useModalRegistration(!!images, close, "ImageLightbox");

  var onTouchStart = useCallback(function(e) {
    if (e.touches.length === 2) {
      var dx = e.touches[0].clientX - e.touches[1].clientX;
      var dy = e.touches[0].clientY - e.touches[1].clientY;
      dragRef.current = { startX:0, startY:0, dragging:false, pinchStart:scale, pinchDist:Math.hypot(dx,dy), lastTap:0 };
    } else if (e.touches.length === 1) {
      dragRef.current = { startX:e.touches[0].clientX, startY:e.touches[0].clientY, dragging:true, pinchStart:0, pinchDist:0, lastTap:dragRef.current.lastTap };
    }
  }, [scale]);

  var onTouchMove = useCallback(function(e) {
    if (e.touches.length === 2 && dragRef.current.pinchDist > 0) {
      var dx = e.touches[0].clientX - e.touches[1].clientX;
      var dy = e.touches[0].clientY - e.touches[1].clientY;
      var dist = Math.hypot(dx, dy);
      var newScale = Math.min(Math.max(dragRef.current.pinchStart * (dist / dragRef.current.pinchDist), 1), 4);
      setScale(newScale);
      e.preventDefault();
    } else if (e.touches.length === 1 && dragRef.current.dragging && scale <= 1) {
      var ddx = e.touches[0].clientX - dragRef.current.startX;
      var ddy = e.touches[0].clientY - dragRef.current.startY;
      if (Math.abs(ddy) > Math.abs(ddx) && ddy > 0) {
        setDragY(ddy); setDragX(0);
      } else if (Math.abs(ddx) > Math.abs(ddy) && images && images.length > 1) {
        setDragX(ddx); setDragY(0);
      } else {
        setDragY(ddy > 0 ? ddy : 0);
      }
    }
  }, [scale, images]);

  var onTouchEnd = useCallback(function() {
    var wasDragging = dragRef.current.dragging;
    dragRef.current.dragging = false;
    if (dragY > 100) { close(); return; }
    if (Math.abs(dragX) > 60 && images && images.length > 1) {
      if (dragX < 0 && index < images.length - 1) setIndex(index + 1);
      else if (dragX > 0 && index > 0) setIndex(index - 1);
    }
    var now = Date.now();
    if (wasDragging && Math.abs(dragX) < 10 && Math.abs(dragY) < 10) {
      var dt = now - (dragRef.current.lastTap || 0);
      if (dt < 300 && dt > 60) setScale(function(s) { return s > 1 ? 1 : 2.5; });
      dragRef.current.lastTap = now;
    }
    setDragY(0); setDragX(0);
  }, [dragY, dragX, close, images, index]);

  if (!images) return null;
  var current = images[index];
  var opacity = visible ? 1 : 0;

  return createPortal(
    React.createElement("div", {
      style: {
        position:"fixed", inset:0, zIndex:10600,
        background:"rgba(0,0,0,0.96)",
        display:"flex", alignItems:"center", justifyContent:"center",
        opacity: opacity, transition: "opacity "+ANIM_MS+"ms ease",
        touchAction:"none",
        animation: visible ? "huiLbEnter 0.22s ease" : "huiLbExit 0.22s ease",
      },
      onTouchStart: onTouchStart,
      onTouchMove: onTouchMove,
      onTouchEnd: onTouchEnd,
    },
      // Close button
      React.createElement("button", {
        onClick: close,
        style: {
          position:"absolute", top:"max(12px, env(safe-area-inset-top, 12px))",
          right:16, zIndex:10, width:40, height:40, borderRadius:"50%",
          background:"rgba(255,255,255,0.15)", border:"none",
          color:"#fff", fontSize:20, cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center",
          touchAction:"manipulation",
        }
      }, "\u2715"),
      // Counter
      images.length > 1 && React.createElement("div", {
        style: {
          position:"absolute", top:"max(16px, env(safe-area-inset-top, 16px))",
          left:"50%", transform:"translateX(-50%)",
          color:"rgba(255,255,255,0.7)", fontSize:13, fontWeight:600,
          zIndex:10, pointerEvents:"none",
        }
      }, (index + 1) + " / " + images.length),
      // Image container
      React.createElement("div", {
        style: {
          width:"100%", height:"100%",
          display:"flex", alignItems:"center", justifyContent:"center",
          transform: "translate("+(dragX*0.3)+"px, "+dragY+"px)",
          transition: dragY === 0 && dragX === 0 ? "transform 0.2s ease" : "none",
        }
      },
        current && current.type === "video"
          ? React.createElement("video", {
              src: current.url, controls: true, autoPlay: true, playsInline: true,
              style: { maxWidth:"100%", maxHeight:"100%", objectFit:"contain", transform:"scale("+scale+")", transition: scale===1?"transform 0.2s ease":"none" }
            })
          : React.createElement("img", {
              src: current ? current.url : "", alt: current ? current.alt : "", draggable: false,
              style: { maxWidth:"100%", maxHeight:"100%", objectFit:"contain", transform:"scale("+scale+")", transition: scale===1?"transform 0.2s ease":"none", animation: visible?"huiLbImgEnter 0.28s ease":"none" }
            })
      ),
      // Dot indicators
      images.length > 1 && React.createElement("div", {
        style: {
          position:"absolute", bottom:"max(24px, env(safe-area-inset-bottom, 24px))",
          left:"50%", transform:"translateX(-50%)",
          display:"flex", gap:7, zIndex:10,
        }
      }, images.map(function(_, i) {
        return React.createElement("div", {
          key: i,
          style: {
            width: i === index ? 20 : 7, height: 7, borderRadius: 99,
            background: i === index ? "#0DC4B5" : "rgba(255,255,255,0.35)",
            transition: "all 0.2s ease",
          }
        });
      }))
    ),
    document.body
  );
}
