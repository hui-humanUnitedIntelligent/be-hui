// src/components/shared/ImageLightbox.jsx — LIGHTBOX.4 (2026-08-11)
// Appweit wiederverwendbare Full-Screen Bildbetrachter-Komponente.
// Wird ueber den globalen window.__HUI_LIGHTBOX__ Hook geoeffnet:
//   window.__HUI_LIGHTBOX__.open(images, startIndex)
//   images: Array von { url, type, alt } (type: "image" | "video")
//   startIndex: Index des zuerst anzuzeigenden Bildes (Default 0)
//
// FIX v4 (2026-08-11) — "Bild sofort anzeigen, nicht erst beim Schließen":
//   Progressive Image Loading: Das 400px-Thumbnail (aus Browser-Cache vom
//   Feed) wird SOFORT gezeigt. Die volle Aufloesung laedt darueber und
//   faded ein sobald sie bereit ist. Spinner falls Thumb nicht im Cache.
//
// FIX v3 (2026-08-11) — "in alle Richtungen zoombar":
//   Live-Pan-Clamping, Focal-Point Pinch-Zoom, e.preventDefault, will-change.
//
// FIX v2 (2026-08-11):
//   Zoom reduziert (1.5x/3x), Back-Button-Logik, SOFORT-Zuruecksetzen.
import React, { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useModalRegistration } from "../../hooks/useModalRegistration.js";
import { optimizeCard } from "../../lib/perfUtils.js";

const ANIM_MS = 220;
const DOUBLE_TAP_SCALE = 1.5;
const MAX_PINCH_SCALE = 3;
const CSS = `
@keyframes huiLbEnter { from { opacity: 0; } to { opacity: 1; } }
@keyframes huiLbImgEnter { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
@keyframes huiLbExit { from { opacity: 1; } to { opacity: 0; } }
@keyframes huiLbSpin { to { transform: rotate(360deg); } }
`;
let _cssInjected = false;
function injectCSS() {
  if (_cssInjected || typeof document === "undefined") return;
  _cssInjected = true;
  const s = document.createElement("style"); s.textContent = CSS;
  document.head.appendChild(s);
}

function Spinner() {
  return React.createElement("div", {
    style: {
      position: "absolute", top: "50%", left: "50%",
      width: 32, height: 32, marginTop: -16, marginLeft: -16,
      borderRadius: "50%",
      border: "3px solid rgba(255,255,255,0.2)",
      borderTopColor: "rgba(255,255,255,0.8)",
      animation: "huiLbSpin 0.7s linear infinite",
    }
  });
}

export default function ImageLightbox() {
  const [images, setImages] = useState(null);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [scale, setScale] = useState(1);
  const [dragY, setDragY] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [thumbLoaded, setThumbLoaded] = useState(false);
  const dragRef = useRef({ startX:0, startY:0, dragging:false, pinchStart:0, pinchDist:0, lastTap:0, panStartX:0, panStartY:0, pinchCenterX:0, pinchCenterY:0 });
  const closeTimerRef = useRef(null);
  const rafRef = useRef(null);
  const scaleRef = useRef(1);
  const imgRef = useRef(null);
  const imgDimsRef = useRef({ w: 0, h: 0 });
  scaleRef.current = scale;

  injectCSS();

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
        setScale(1); setDragY(0); setDragX(0); setPanX(0); setPanY(0);
        setImgLoaded(false); setThumbLoaded(false);
        scaleRef.current = 1;
        imgDimsRef.current = { w: 0, h: 0 };
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

  // Reset loading state when switching images
  useEffect(function() {
    setImgLoaded(false); setThumbLoaded(false);
  }, [index]);

  function onImgLoad(e) {
    setImgLoaded(true);
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

  var resetZoom = useCallback(function() {
    setScale(1); setPanX(0); setPanY(0); setDragX(0); setDragY(0);
    scaleRef.current = 1;
  }, []);

  var close = useCallback(function() {
    setScale(1); setPanX(0); setPanY(0); setDragX(0); setDragY(0);
    scaleRef.current = 1;
    setVisible(false);
    closeTimerRef.current = setTimeout(function() {
      setImages(null);
    }, ANIM_MS);
  }, []);

  var handleBack = useCallback(function() {
    if (scaleRef.current > 1.02) {
      resetZoom();
    } else {
      close();
    }
  }, [resetZoom, close]);

  useModalRegistration(!!images, handleBack, "ImageLightbox");

  var onTouchStart = useCallback(function(e) {
    if (e.touches.length === 2) {
      var dx = e.touches[0].clientX - e.touches[1].clientX;
      var dy = e.touches[0].clientY - e.touches[1].clientY;
      var cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      var cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      dragRef.current = {
        startX:0, startY:0, dragging:false,
        pinchStart:scale, pinchDist:Math.hypot(dx,dy),
        lastTap:0, panStartX:panX, panStartY:panY,
        pinchCenterX:cx, pinchCenterY:cy,
      };
    } else if (e.touches.length === 1) {
      dragRef.current = {
        startX:e.touches[0].clientX, startY:e.touches[0].clientY,
        dragging:true, pinchStart:0, pinchDist:0,
        lastTap:dragRef.current.lastTap,
        panStartX:panX, panStartY:panY,
        pinchCenterX:0, pinchCenterY:0,
      };
    }
  }, [scale, panX, panY]);

  var onTouchMove = useCallback(function(e) {
    if (e.cancelable) e.preventDefault();

    if (e.touches.length === 2 && dragRef.current.pinchDist > 0) {
      var dx = e.touches[0].clientX - e.touches[1].clientX;
      var dy = e.touches[0].clientY - e.touches[1].clientY;
      var dist = Math.hypot(dx, dy);
      var newScale = Math.min(Math.max(dragRef.current.pinchStart * (dist / dragRef.current.pinchDist), 1), MAX_PINCH_SCALE);
      setScale(newScale);
      if (newScale > 1.02) {
        var cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        var cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        var vw = window.innerWidth;
        var vh = window.innerHeight;
        var offX = cx - vw / 2;
        var offY = cy - vh / 2;
        var scaleRatio = newScale / dragRef.current.pinchStart;
        var newPanX = dragRef.current.panStartX * scaleRatio + offX * (1 - scaleRatio);
        var newPanY = dragRef.current.panStartY * scaleRatio + offY * (1 - scaleRatio);
        var clamped = clampPan(newPanX, newPanY, newScale);
        setPanX(clamped.x);
        setPanY(clamped.y);
      } else {
        setPanX(0); setPanY(0);
      }
    } else if (e.touches.length === 1 && dragRef.current.dragging && scale > 1.02) {
      var pdx = e.touches[0].clientX - dragRef.current.startX;
      var pdy = e.touches[0].clientY - dragRef.current.startY;
      var rawX = dragRef.current.panStartX + pdx;
      var rawY = dragRef.current.panStartY + pdy;
      var clamped = clampPan(rawX, rawY, scale);
      setPanX(clamped.x);
      setPanY(clamped.y);
      setDragY(0); setDragX(0);
    } else if (e.touches.length === 1 && dragRef.current.dragging && scale <= 1.02) {
      var sdx = e.touches[0].clientX - dragRef.current.startX;
      var sdy = e.touches[0].clientY - dragRef.current.startY;
      if (Math.abs(sdy) > Math.abs(sdx) && sdy > 0) {
        setDragY(sdy); setDragX(0);
      } else if (Math.abs(sdx) > Math.abs(sdy) && images && images.length > 1) {
        setDragX(sdx); setDragY(0);
      } else {
        setDragY(sdy > 0 ? sdy : 0);
      }
    }
  }, [scale, images]);

  var onTouchEnd = useCallback(function() {
    var wasDragging = dragRef.current.dragging;
    dragRef.current.dragging = false;
    if (scale > 1.02) {
      var clamped = clampPan(panX, panY, scale);
      setPanX(clamped.x);
      setPanY(clamped.y);
    } else {
      if (dragY > 100) { close(); return; }
      if (Math.abs(dragX) > 60 && images && images.length > 1) {
        if (dragX < 0 && index < images.length - 1) setIndex(index + 1);
        else if (dragX > 0 && index > 0) setIndex(index - 1);
      }
    }
    var now = Date.now();
    if (wasDragging && Math.abs(dragX) < 10 && Math.abs(dragY) < 10) {
      var dt = now - (dragRef.current.lastTap || 0);
      if (dt < 300 && dt > 60) {
        if (scale > 1.02) {
          setScale(1); setPanX(0); setPanY(0);
        } else {
          setScale(DOUBLE_TAP_SCALE); setPanX(0); setPanY(0);
        }
      }
      dragRef.current.lastTap = now;
    }
    setDragY(0); setDragX(0);
  }, [dragY, dragX, close, images, index, scale, panX, panY]);

  if (!images) return null;
  var current = images[index];
  var opacity = visible ? 1 : 0;
  var showSpinner = !imgLoaded && !thumbLoaded;
  var thumbUrl = current && current.type !== "video" ? optimizeCard(current.url) : "";

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
      React.createElement("button", {
        onClick: close,
        style: {
          position:"absolute", top:"max(var(--hui-safe-top, 0px), 12px, env(safe-area-inset-top, 12px))",
          right:16, zIndex:10, width:40, height:40, borderRadius:"50%",
          background:"rgba(255,255,255,0.15)", border:"none",
          color:"#fff", fontSize:20, cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center",
          touchAction:"manipulation",
        }
      }, "\u2715"),
      images.length > 1 && React.createElement("div", {
        style: {
          position:"absolute", top:"max(var(--hui-safe-top, 0px), 16px, env(safe-area-inset-top, 16px))",
          left:"50%", transform:"translateX(-50%)",
          color:"rgba(255,255,255,0.7)", fontSize:13, fontWeight:600,
          zIndex:10, pointerEvents:"none",
        }
      }, (index + 1) + " / " + images.length),
      // Spinner (nur wenn weder Thumb noch Full geladen)
      showSpinner && React.createElement(Spinner),
      // Image container
      React.createElement("div", {
        style: {
          width:"100%", height:"100%",
          display:"flex", alignItems:"center", justifyContent:"center",
          transform: scale > 1.02 ? "none" : "translate("+(dragX*0.3)+"px, "+dragY+"px)",
          transition: (dragY === 0 && dragX === 0 && scale <= 1.02) ? "transform 0.2s ease" : "none",
          overflow: "hidden",
          position: "relative",
        }
      },
        // Layer 1: Thumbnail (sofort aus Browser-Cache, leicht unscharf)
        !imgLoaded && thumbUrl && thumbUrl !== current.url && React.createElement("img", {
          src: thumbUrl, alt: "", draggable: false,
          onLoad: function() { setThumbLoaded(true); },
          style: {
            position: "absolute",
            maxWidth:"100%", maxHeight:"100%", objectFit:"contain",
            filter: "blur(6px)",
            transform: "scale(1.03)",
            opacity: thumbLoaded ? 0.7 : 0,
            transition: "opacity 0.15s ease",
          }
        }),
        // Layer 2: Full-resolution image (faded ein wenn geladen)
        current && current.type === "video"
          ? React.createElement("video", {
              src: current.url, controls: true, autoPlay: true, playsInline: true,
              style: { maxWidth:"100%", maxHeight:"100%", objectFit:"contain",
                transform: "translate("+panX+"px, "+panY+"px) scale("+scale+")",
                transition: (scale<=1.02 && panX===0 && panY===0) ? "transform 0.2s ease" : "none",
                willChange: "transform" }
            })
          : React.createElement("img", {
              ref: imgRef,
              src: current ? current.url : "", alt: current ? current.alt : "", draggable: false,
              onLoad: onImgLoad,
              style: { maxWidth:"100%", maxHeight:"100%", objectFit:"contain",
                transform: "translate("+panX+"px, "+panY+"px) scale("+scale+")",
                transition: (scale<=1.02 && panX===0 && panY===0) ? "transform 0.2s ease" : "none",
                animation: visible ? "huiLbImgEnter 0.28s ease" : "none",
                willChange: "transform",
                opacity: imgLoaded ? 1 : 0,
                transitionDelay: imgLoaded ? "0ms" : "0ms",
              }
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
