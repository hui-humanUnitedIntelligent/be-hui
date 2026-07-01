import React, { useState, useRef } from "react";
import { C } from "./tokens.js";

export default function ImageGallery({ images, title, placeholderEmoji = "🎨" }) {
  const [idx, setIdx] = useState(0);
  const startX = useRef(null);

  const prev = () => setIdx((i) => Math.max(0, i - 1));
  const next = () => setIdx((i) => Math.min(images.length - 1, i + 1));

  const onTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e) => {
    if (startX.current === null) return;
    const diff = startX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) next();
      else prev();
    }
    startX.current = null;
  };

  const img = images[idx];

  return (
    <div
      className="cd-swipe"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      style={{
        position: "relative",
        width: "100%",
        height: "clamp(280px, 42vh, 480px)",
        overflow: "hidden",
        background: "#111",
      }}
    >
      {img ? (
        <img
          key={idx}
          src={img}
          alt={`${title} ${idx + 1}`}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            animation: "cdFadeUp 0.35s both",
            filter: "brightness(0.88) saturate(1.1)",
          }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            background: "linear-gradient(135deg,#E6FAF8,#FFF2EE)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div style={{ fontSize: 52, opacity: 0.25 }}>{placeholderEmoji}</div>
          <div style={{ fontSize: 13, color: C.muted }}>Kein Bild verfügbar</div>
        </div>
      )}

      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.22) 0%, transparent 35%, transparent 55%, rgba(0,0,0,0.72) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: "radial-gradient(ellipse 70% 50% at 100% 0%, rgba(255,138,107,0.18) 0%, transparent 60%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg,${C.coral},${C.teal},transparent)`,
          pointerEvents: "none",
        }}
      />

      {images.length > 1 && (
        <div
          style={{
            position: "absolute",
            bottom: 16,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: 5,
          }}
        >
          {images.map((_, i) => (
            <div
              key={i}
              onClick={() => setIdx(i)}
              style={{
                width: i === idx ? 18 : 6,
                height: 6,
                borderRadius: 3,
                background: i === idx ? "white" : "rgba(255,255,255,0.45)",
                transition: "all 0.25s",
                cursor: "pointer",
              }}
            />
          ))}
        </div>
      )}

      {images.length > 1 && (
        <>
          {idx > 0 && (
            <button
              onClick={prev}
              className="cd-tap"
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.18)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.3)",
                color: "white",
                fontSize: 16,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ‹
            </button>
          )}
          {idx < images.length - 1 && (
            <button
              onClick={next}
              className="cd-tap"
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.18)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.3)",
                color: "white",
                fontSize: 16,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ›
            </button>
          )}
        </>
      )}

      {images.length > 1 && (
        <div
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(8px)",
            borderRadius: 999,
            padding: "3px 10px",
            fontSize: 11,
            fontWeight: 700,
            color: "rgba(255,255,255,0.88)",
          }}
        >
          {idx + 1} / {images.length}
        </div>
      )}
    </div>
  );
}
