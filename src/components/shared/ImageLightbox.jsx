// src/components/shared/ImageLightbox.jsx — LIGHTBOX.5 (2026-08-11)
// Appweit wiederverwendbare Full-Screen Bildbetrachter-Komponente.
// Wird ueber den globalen window.__HUI_LIGHTBOX__ Hook geoeffnet:
//   window.__HUI_LIGHTBOX__.open(images, startIndex)
//   images: Array von { url, type, alt } (type: "image" | "video")
//   startIndex: Index des zuerst anzuzeigenden Bildes (Default 0)
//
// FIX v6 (2026-08-11) — "No blur, no background loading":
//   willChange:transform entfernt (verursachte Low-Res-Layer beim ersten
//   Öffnen → blurry). opacity immer 1 (kein onLoad-Gate). decoding=sync.
//   Spinner entfernt — Bild wird direkt gezeigt.
//
// FIX v5 (2026-08-11) — "Blur-Layer entfernt, nur EIN Bild-Layer":
//   Der progressive Thumbnail-Blur-Layer aus v4 wurde ENTFERNT (Michael-
//   Feedback: unnoetiger Blur-Effekt + fuehlte sich wie ein zweites Modal
//   an). Jetzt: NUR EIN <img>, direkt die volle Aufloesung, kein
//   Zwischenschritt, kein Hintergrund-Laden. Waehrend das Bild laedt nur
//   ein dezenter Spinner (kein Blur-Platzhalter). Overlay ist sofort
//   voll opak (kein Fade-In mehr) um jedes Durchscheinen anderer Modals
//   dahinter (z.B. ContentPreviewSheet) auszuschliessen.
//
// FIX v4 (2026-08-11) — Progressive Loading (ENTFERNT in v5, siehe oben).
//
// FIX v3 (2026-08-11) — "in alle Richtungen zoombar":
//   Live-Pan-Clamping, Focal-Point Pinch-Zoom, e.preventDefault, will-change.
//
// FIX v2 (2026-08-11):
//   Zoom reduziert (1.5x/3x), Back-Button-Logik, SOFORT-Zuruecksetzen.
import React, { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useModalRegistration } from "../../hooks/useModalRegistration.js";
import { optimizeFull } from "../../lib/perfUtils.js";

const ANIM_MS = 220;
const DOUBLE_TAP_SCALE = 1.5;
const MAX_PINCH_SCALE = 3;
const CSS = `
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
  const [imgError, setImgError] = useState(false);
  const [useRawUrl, setUseRawUrl] = useState(false);
  const dragRef = useRef({ startX:0, startY:0, dragging:false, pinchStart:0, pinchDist:0, lastTap:0, panStartX:0, panStartY:0, pinchCenterX:0, pinchCenterY:0 });
  const closeTimerRef = useRef(null);
  const scaleRef = useRef(1);
  const imgRef = useRef(null);
  const imgDimsRef = useRef({ w: 0, h: 0 });
  scaleRef.current = scale;

  injectCSS();

  // ── Pan-Clamp: berechnet max PanX/PanY aus echten Bild-Dimensionen × Scale ──
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
        setImgLoaded(false); setImgError(false); setUseRawUrl(false);
        scaleRef.current = 1;
        imgDimsRef.current = { w: 0, h: 0 };
        // Sofort voll sichtbar — kein Fade-In, damit dahinterliegende Modals
        // (z.B. ContentPreviewSheet) nie durchscheinen koennen.
        setVisible(true);
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

  // Loading-State beim Bildwechsel zuruecksetzen
  useEffect(function() {
    setImgLoaded(false); setImgError(false); setUseRawUrl(false);
  }, [index]);

  function onImgError() {
    if (!useRawUrl) {
      // Transform-API-URL fehlgeschlagen -> Fallback auf Original-Datei versuchen
      setUseRawUrl(true);
    } else {
      // Auch die Original-Datei ist fehlgeschlagen -> echte Fehleranzeige statt endlosem Spinner
      setImgError(true);
    }
  }

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

  return createPortal(
    React.createElement("div", {
      style: {
        position:"fixed", inset:0, zIndex:10600,
        background:"#000",
        display:"flex", alignItems:"center", justifyContent:"center",
        opacity: visible ? 1 : 0,
        transition: visible ? "none" : "opacity "+ANIM_MS+"ms ease",
        touchAction:"none",
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
      // Spinner nur solange das Bild noch nicht geladen ist UND kein Fehler vorliegt.
      null /* Spinner removed — image shows directly */,
      // Echte Fehleranzeige statt endlosem Spinner, wenn Original UND Transform-URL fehlschlagen.
      imgError && current && current.type !== "video" && React.createElement("div", {
        style: {
          position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)",
          color:"rgba(255,255,255,0.75)", fontSize:14, textAlign:"center", width:"80%",
          display:"flex", flexDirection:"column", alignItems:"center", gap:10,
        }
      },
        React.createElement("div", { style:{ fontSize:32 } }, "\u26A0\uFE0F"),
        React.createElement("div", null, "Bild konnte nicht geladen werden"),
        React.createElement("button", {
          onClick: function() { setImgError(false); setUseRawUrl(false); setImgLoaded(false); },
          style: {
            marginTop:6, padding:"8px 18px", borderRadius:20, border:"1px solid rgba(255,255,255,0.3)",
            background:"rgba(255,255,255,0.1)", color:"#fff", fontSize:13, cursor:"pointer",
          }
        }, "Erneut versuchen")
      ),
      // Image container — EIN einziger Bild-Layer, direkt volle Aufloesung.
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
        current && current.type === "video"
          ? React.createElement("video", {
              src: current.url, controls: true, autoPlay: true, playsInline: true,
              style: { maxWidth:"100%", maxHeight:"100%", objectFit:"contain",
                transform: "translate("+panX+"px, "+panY+"px) scale("+scale+")",
                transition: (scale<=1.02 && panX===0 && panY===0) ? "transform 0.2s ease" : "none",
                
            })
          : !imgError && React.createElement("img", {
              ref: imgRef,
              src: current ? (useRawUrl ? current.url : optimizeFull(current.url)) : "",
              decoding: "sync",
              alt: current ? current.alt : "", draggable: false,
              onLoad: onImgLoad,
              onError: onImgError,
              style: { maxWidth:"100%", maxHeight:"100%", objectFit:"contain",
                transform: "translate("+panX+"px, "+panY+"px) scale("+scale+")",
                transition: (scale<=1.02 && panX===0 && panY===0) ? "transform 0.2s ease" : "none",
                opacity: 1,
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
