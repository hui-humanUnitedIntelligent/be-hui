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
//   onImageTap: function(index)     — optional, ueberschreibt Lightbox-Oeffnen
import React, { useState, useCallback, useRef, useEffect, memo } from "react";
import { optimizeCard } from "../../lib/perfUtils.js";

const T = {
  teal: "#0DC4B5",
};

function ImageSlider({ images, height, borderRadius, showDots, objectFit, onImageTap }) {
  const [current, setCurrent] = useState(0);
  const [dragX, setDragX] = useState(0);
  const containerRef = useRef(null);
  const [containerW, setContainerW] = useState(0);
  const dragRef = useRef({ startX: 0, startY: 0, dragging: false, moved: false });

  const h = height || 220;
  const br = borderRadius != null ? borderRadius : 14;
  const fit = objectFit || "cover";
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
    if (onImageTap) {
      onImageTap(idx);
    } else if (typeof window !== "undefined" && window.__HUI_LIGHTBOX__) {
      window.__HUI_LIGHTBOX__.open(imgs, idx);
    }
  }, [dragX, onImageTap, imgs]);

  if (!imgs.length) return null;

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
      },
      onClick: function(e) { handleClick(e, 0); },
    },
      isVideo
        ? React.createElement("video", {
            src: url, muted: true, loop: true, playsInline: true, autoPlay: true,
            style: { width:"100%", height:"100%", objectFit: fit, display:"block" }
          })
        : React.createElement("img", {
            src: optimizeCard(url), alt: (m && m.alt) || "", loading: "eager", decoding: "async",
            style: { width:"100%", height:"100%", objectFit: fit, display:"block" }
          })
    );
  }

  // Multi-image slider
  var offset = -(current * (containerW || 100)) + dragX;
  return React.createElement("div", {
    ref: containerRef,
    style: {
      width: "100%", height: h, borderRadius: br,
      overflow: "hidden", position: "relative",
      flexShrink: 0, background: "#F0EFED",
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
            ? React.createElement("video", {
                src: iurl, muted: true, loop: true, playsInline: true, autoPlay: true,
                style: { width:"100%", height:"100%", objectFit: fit, display:"block" }
              })
            : React.createElement("img", {
                src: optimizeCard(iurl), alt: (m && m.alt) || "", loading: i === 0 ? "eager" : "lazy", decoding: "async",
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
    }))
  );
}

export default memo(ImageSlider);
