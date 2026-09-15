// src/components/shared/ImageSlider.jsx — SLIDER.1 (2026-08-08)
// Horizontaler Bild-Slider fuer 2+ Bilder. Swipe-Navigation mit
// Dot-Indikatoren. Jedes Bild ist tappbar und oeffnet die globale
// ImageLightbox (window.__HUI_LIGHTBOX__) an der aktuellen Position.
//
// Props:
//   images: [{ url, type, alt }]   (mindestens 1)
//   height: number (px)             — Default 220
//   borderRadius: number            — Default 14
//   showDots: boolean               — Default true
//   objectFit: string               — Default "cover"
//   videoObjectFit: string           — VIDEO-CROP-FIX (2026-09-11): optionaler
//     objectFit NUR fuer <video>-Elemente (Fotos im selben Slider behalten
//     `objectFit`/"cover"). Default = objectFit (unveraendertes Verhalten).
//   background: string              — optionaler Container-Hintergrund fuer
//     Letterbox-Raum bei videoObjectFit="contain". Default unveraendert
//     (kein Hintergrund bei Einzelbild, "#F0EFED" bei Multi-Slider) —
//     bestehende Aufrufer (BaseFeedCard, ContentPreviewSheet) bleiben
//     dadurch 1:1 unveraendert.
//   onImageTap: function(index)     — optional, ueberschreibt Lightbox-Oeffnen
//
// VIDEO-SOUND-TOGGLE-001 (2026-09-15, Michael-Report 62f52ee5): Bei Video-
// Slides (Einzel-Video + Video-Slide in Galerien) erscheint oben rechts ein
// Ton-an/aus-Button (Standard: stumm, da AutoPlay). Klick = User-Gesture →
// Browser erlaubt Unmuting. Der Button stoppt Propagation (kein Lightbox-Tap).
import React, { useState, useCallback, useRef, useEffect, memo } from "react";
import { optimizeCard } from "../../lib/perfUtils.js";
// VIDEO-SOUND-TOGGLE-001 (2026-09-15, Michael-Report 62f52ee5): eigener
// useTranslation-Hook (t-als-Prop-Regel), Keys media.soundOn/media.soundOff ×8.
import { useTranslation } from "../../hooks/useTranslation.js";
// AUTOPAUSE-VIDEO-SSOT (2026-09-11): SSOT-Komponente fuer "Video pausiert
// automatisch außerhalb des Viewports" — vorher nur fuer den (jetzt
// entfernten) Einzel-Video-Sonderpfad in BaseFeedCard.jsx, jetzt fuer JEDEN
// inline Video-Preview hier (Einzel-Video + Video-Slide in Galerien).
import AutoPauseVideo from "./AutoPauseVideo.jsx";

const T = {
  teal: "#0DC4B5",
};

function ImageSlider({ images, height, borderRadius, showDots, objectFit, videoObjectFit, background, onImageTap, onMediaError }) {
  const { t } = useTranslation();
  const [current, setCurrent] = useState(0);
  // VIDEO-SOUND-TOGGLE-001: Standard stumm (AutoPlay-Pflicht), Button oben
  const [soundOn, setSoundOn] = useState(false);
  const [dragX, setDragX] = useState(0);
  const containerRef = useRef(null);
  const [containerW, setContainerW] = useState(0);
  const dragRef = useRef({ startX: 0, startY: 0, dragging: false, moved: false });
  // MEDIA-LOADING-001 (2026-09-15, Michael-Spec Teil 1 — ERR_CACHE_OPERATION_
  // NOT_SUPPORTED): WebView-Cache-Bypass-Retry. Der Cache des Clients
  // verweigerte die Operation, nicht der Server (Live-Nachweis 15.09.:
  // HTTP 206 + CORS * + immutable). Beim ersten img-Fehler wird EINMAL mit
  // Cache-Buster (?hui-retry=<ts>) neu geladen — eine andere URL umgeht den
  // defekten Cache-Eintrag. Erst beim zweiten Fehlschlag wird onMediaError
  // an den Parent gereicht (FeedMedia zeigt dann den HUILogo-Fallback).
  // Videos: bewusst KEIN Retry (Range-Request + frische URL = kompletter
  // Neuladen eines bis zu 50MB-Videos) — Video-Fehler laufen wie bisher
  // ueber den Aspect-Probe in FeedMedia.
  const [retryMap, setRetryMap] = useState({});
  const withRetry = function(u, i) {
    var ts = retryMap[i];
    if (!ts) return u;
    return u + (u.indexOf("?") >= 0 ? "&" : "?") + "hui-retry=" + ts;
  };
  const handleImgError = function(i, u) {
    if (!retryMap[i]) {
      console.warn("[HUI Media] image failed — retrying with cache-buster:", u);
      setRetryMap(function(m) { var n = Object.assign({}, m); n[i] = Date.now(); return n; });
    } else {
      console.error("[HUI Media] image failed after retry:", u);
      onMediaError && onMediaError(i, u);
    }
  };

  const h = height || 220;
  const br = borderRadius != null ? borderRadius : 14;
  const fit = objectFit || "cover";
  // VIDEO-CROP-FIX (2026-09-11): videoObjectFit ueberschreibt NUR das
  // objectFit von <video>-Elementen, Fotos im selben Slider behalten `fit`.
  // Ohne videoObjectFit-Prop identisch zu vorher (vFit === fit).
  const vFit = videoObjectFit || fit;
  const showIndicators = showDots !== false;
  const imgs = Array.isArray(images) ? images : [];

  useEffect(() => {
    if (!containerRef.current) return;
    var update = function() {
      if (containerRef.current) setContainerW(containerRef.current.offsetWidth);
    };
    update();
    var ro = new ResizeObserver(update);
    ro.observe(containerRef.current);
    return function() { ro.disconnect(); };
  }, []);

  var onTouchStart = useCallback(function(e) {
    dragRef.current = { startX: e.touches[0].clientX, startY: e.touches[0].clientY, dragging: true, moved: false };
  }, []);

  var onTouchMove = useCallback(function(e) {
    if (!dragRef.current.dragging) return;
    var dx = e.touches[0].clientX - dragRef.current.startX;
    var dy = Math.abs(e.touches[0].clientY - dragRef.current.startY);
    if (dy > 10) { dragRef.current.moved = true; }
    setDragX(dx);
  }, []);

  var onTouchEnd = useCallback(function() {
    if (!dragRef.current.dragging) return;
    dragRef.current.dragging = false;
    if (Math.abs(dragX) > 50) {
      if (dragX < 0 && current < imgs.length - 1) setCurrent(current + 1);
      else if (dragX > 0 && current > 0) setCurrent(current - 1);
    }
    setDragX(0);
  }, [dragX, current, imgs.length]);

  var handleClick = useCallback(function(e, idx) {
    // If this was a drag or scroll (not a tap), skip
    if (Math.abs(dragX) > 10) return;
    if (dragRef.current.moved) return;
    // FEED-VIDEO-INSTAGRAM-STYLE-001 (2026-09-11): Media-Tap ist ein
    // eigenstaendiger Klick-Bereich (Lightbox/Player oeffnen) -- darf NIEMALS
    // zu einem umschliessenden Karten-Klick (Post-Detail-Navigation)
    // hochbubblen. Vorher fehlte stopPropagation komplett.
    if (e && typeof e.stopPropagation === "function") e.stopPropagation();
    if (onImageTap) {
      onImageTap(idx);
    } else if (typeof window !== "undefined" && window.__HUI_LIGHTBOX__) {
      window.__HUI_LIGHTBOX__.open(imgs, idx);
    }
  }, [dragX, onImageTap, imgs]);

  if (!imgs.length) return null;

  // VIDEO-SOUND-TOGGLE-001: Ton-Button oben rechts auf dem Video (nur wenn
  // der AKTUELLE Slide ein Video ist). Semi-transparent dunkler Kreis +
  // weisses Lautsprecher-SVG. stopPropagation → kein Lightbox/Player-Tap.
  var renderSoundButton = function() {
    return React.createElement("button", {
      key: "hui-sound-btn",
      type: "button",
      "aria-label": soundOn ? t("media.soundOff") : t("media.soundOn"),
      onClick: function(e) {
        if (e && typeof e.stopPropagation === "function") e.stopPropagation();
        // Klick = User-Gesture → Unmuting ist browser-erlaubt
        setSoundOn(!soundOn);
      },
      style: {
        position: "absolute", top: 10, right: 10, zIndex: 7,
        width: 30, height: 30, borderRadius: "50%", padding: 0,
        border: "none", cursor: "pointer", touchAction: "manipulation",
        background: "rgba(20,20,34,0.42)",
        display: "flex", alignItems: "center", justifyContent: "center",
        WebkitTapHighlightColor: "transparent",
      },
    },
      soundOn
        ? React.createElement("svg", { width: 15, height: 15, viewBox: "0 0 24 24", fill: "none", stroke: "#FFFFFF", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" },
            React.createElement("path", { d: "M11 5 6 9H3v6h3l5 4V5z" }),
            React.createElement("path", { d: "M15.5 8.5a5 5 0 0 1 0 7" }),
            React.createElement("path", { d: "M18.5 5.5a9 9 0 0 1 0 13" }))
        : React.createElement("svg", { width: 15, height: 15, viewBox: "0 0 24 24", fill: "none", stroke: "#FFFFFF", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" },
            React.createElement("path", { d: "M11 5 6 9H3v6h3l5 4V5z" }),
            React.createElement("line", { x1: 16, y1: 9, x2: 22, y2: 15 }),
            React.createElement("line", { x1: 22, y1: 9, x2: 16, y2: 15 }))
    );
  };

  // Single image — no slider needed, just make it tappable
  if (imgs.length === 1) {
    var m = imgs[0];
    var url = typeof m === "string" ? m : (m && m.url) || "";
    var isVideo = m && typeof m === "object" && m.type === "video";
    return React.createElement("div", {
      ref: containerRef,
      style: {
        width: "100%", height: h, borderRadius: br,
        overflow: "hidden", position: "relative",
        cursor: "pointer", flexShrink: 0,
        ...(background ? { background } : null),
      },
      onClick: function(e) { handleClick(e, 0); },
    },
      isVideo
        ? React.createElement(AutoPauseVideo, {
            // VIDEO-MOMENT-POSTER-FIX (2026-09-09): poster = extrahierter
            // Frame (aus unifiedNormalizer extractMedia), sofort sichtbar.
            // AUTOPAUSE-VIDEO-SSOT (2026-09-11): pausiert automatisch
            // außerhalb des Viewports (siehe AutoPauseVideo.jsx).
            // VIDEO-SOUND-TOGGLE-001: muted dynamisch statt fix true.
            src: url, poster: (m && m.poster) || undefined,
            muted: !soundOn, loop: true, playsInline: true, autoPlay: true,
            style: { width:"100%", height:"100%", objectFit: vFit, display:"block" }
          })
        : React.createElement("img", {
            src: withRetry(optimizeCard(url), 0), alt: (m && m.alt) || "", loading: "eager", decoding: "async",
            onError: function() { handleImgError(0, url); },
            style: { width:"100%", height:"100%", objectFit: fit, display:"block" }
          }),
      // VIDEO-SOUND-TOGGLE-001: Ton-Button auf Einzel-Video
      isVideo && renderSoundButton()
    );
  }

  // Multi-image slider
  var offset = -(current * (containerW || 100)) + dragX;
  return React.createElement("div", {
    ref: containerRef,
    style: {
      width: "100%", height: h, borderRadius: br,
      overflow: "hidden", position: "relative",
      flexShrink: 0, background: background || "#F0EFED",
      touchAction: "pan-y",
    },
    onTouchStart: onTouchStart,
    onTouchMove: onTouchMove,
    onTouchEnd: onTouchEnd,
  },
    // Track
    React.createElement("div", {
      style: {
        display: "flex", height: "100%",
        width: (imgs.length * 100) + "%",
        transform: "translateX(" + offset + "px)",
        transition: dragX === 0 ? "transform 0.25s ease" : "none",
      }
    },
      imgs.map(function(m, i) {
        var iurl = typeof m === "string" ? m : (m && m.url) || "";
        var iVideo = m && typeof m === "object" && m.type === "video";
        return React.createElement("div", {
          key: i,
          style: {
            width: (100 / imgs.length) + "%", height: "100%",
            flexShrink: 0, position: "relative",
            cursor: "pointer",
          },
          onClick: function(e) { handleClick(e, i); },
        },
          iVideo
            ? React.createElement(AutoPauseVideo, {
                // VIDEO-MOMENT-POSTER-FIX (2026-09-09)
                // AUTOPAUSE-VIDEO-SSOT (2026-09-11): siehe oben.
                // VIDEO-SOUND-TOGGLE-001: muted dynamisch statt fix true.
                src: iurl, poster: (m && m.poster) || undefined,
                muted: !soundOn, loop: true, playsInline: true, autoPlay: true,
                style: { width:"100%", height:"100%", objectFit: vFit, display:"block" }
              })
            : React.createElement("img", {
                src: withRetry(optimizeCard(iurl), i), alt: (m && m.alt) || "", loading: i === 0 ? "eager" : "lazy", decoding: "async",
                onError: function() { handleImgError(i, iurl); },
                style: { width:"100%", height:"100%", objectFit: fit, display:"block" }
              })
        );
      })
    ),
    // Dot indicators
    showIndicators && React.createElement("div", {
      style: {
        position: "absolute", bottom: 10, left: "50%",
        transform: "translateX(-50%)",
        display: "flex", gap: 6, zIndex: 5,
      }
    }, imgs.map(function(_, i) {
      return React.createElement("div", {
        key: i,
        style: {
          width: i === current ? 18 : 6, height: 6, borderRadius: 99,
          background: i === current ? T.teal : "rgba(255,255,255,0.5)",
          transition: "all 0.2s ease",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }
      });
    })),
    // VIDEO-SOUND-TOGGLE-001: Ton-Button auf dem AKTUELLEN Video-Slide
    (imgs[current] && typeof imgs[current] === "object" && imgs[current].type === "video")
      ? renderSoundButton()
      : null
  );
}

export default memo(ImageSlider);
