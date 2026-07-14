// src/components/ui/HuiImage.jsx — HUI P5: Zentrale Bild-Komponente
// Lazy Loading · Responsive · Placeholder · Fade-In · Fehlerbehandlung
// ══════════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useMemo, memo } from "react";
import {
  optimizeImageUrl, buildSrcSet, hasLqip, blurhashToDataUrl,
} from "../../lib/huiImageUtils.js";

// ── Design-Tokens (einheitliche Placeholder-Strategie) ───────────
const PLACEHOLDER_BG = "linear-gradient(90deg, #F5EEE4 0%, #EDE5D8 50%, #F5EEE4 100%)";
const PLACEHOLDER_BG_ALT = "linear-gradient(135deg, rgba(22,215,197,0.07), rgba(255,138,107,0.07))";
const NEUTRAL_BG = "#F0EFED";
const TEAL_SOFT = "rgba(13,196,181,0.08)";
const TEAL = "#0DC4B5";

// ── CSS (einmal injizieren) ──────────────────────────────────────
const HUI_IMG_CSS = `
@keyframes huiImgShimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
@keyframes huiImgFadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
.hui-img-loaded {
  animation: huiImgFadeIn 0.32s ease both;
}
`;
let _cssInjected = false;
function injectCss() {
  if (_cssInjected || typeof document === "undefined") return;
  _cssInjected = true;
  const s = document.createElement("style");
  s.textContent = HUI_IMG_CSS;
  document.head.appendChild(s);
}

// ── Shimmer Placeholder ──────────────────────────────────────────
function ShimmerPlaceholder({ variant = "default", style }) {
  injectCss();
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        background: variant === "warm" ? PLACEHOLDER_BG_ALT : PLACEHOLDER_BG,
        backgroundSize: "200% 100%",
        animation: "huiImgShimmer 2.8s linear infinite",
        ...style,
      }}
    />
  );
}

// ── Blur-Up Placeholder (LQIP / Blurhash) ────────────────────────
function BlurPlaceholder({ src, style }) {
  if (!src) return <ShimmerPlaceholder style={style} />;
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        filter: "blur(20px)",
        transform: "scale(1.08)",
        ...style,
      }}
    />
  );
}

// ── HuiImageSkeleton — für Karten/Listen ohne Bildquelle ─────────
export function HuiImageSkeleton({ width, height, borderRadius = 8, delay = "0s", style }) {
  injectCss();
  return (
    <div
      aria-hidden="true"
      style={{
        width,
        height,
        borderRadius,
        flexShrink: 0,
        background: PLACEHOLDER_BG,
        backgroundSize: "300% 100%",
        animation: `huiImgShimmer 2.8s linear ${delay} infinite`,
        border: "1px solid rgba(0,0,0,0.032)",
        ...style,
      }}
    />
  );
}

// ── HuiImage ─────────────────────────────────────────────────────
const HuiImage = memo(function HuiImage({
  src,
  alt = "",
  width,
  height,
  aspectRatio,
  variant = "cover",
  priority = false,
  blurhash,
  thumbnail,
  placeholder = "auto",
  fallback,
  fallbackText,
  sizes,
  objectFit,
  borderRadius,
  isTalent = false,
  fill = false,
  className,
  style,
  imgStyle,
  onLoad,
  onError,
  onClick,
  ...rest
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [blurDataUrl, setBlurDataUrl] = useState(null);

  injectCss();

  const optimizedSrc = useMemo(() => optimizeImageUrl(src, width || 800), [src, width]);
  const srcSet = useMemo(() => buildSrcSet(src), [src]);

  useEffect(() => {
    if (!blurhash || placeholder === "shimmer" || placeholder === "none") return;
    let cancelled = false;
    blurhashToDataUrl(blurhash).then((url) => {
      if (!cancelled && url) setBlurDataUrl(url);
    });
    return () => { cancelled = true; };
  }, [blurhash, placeholder]);

  useEffect(() => {
    setLoaded(false);
    setError(false);
  }, [src]);

  const lqipSrc = thumbnail || blurDataUrl;
  const useBlur = placeholder === "blur"
    || (placeholder === "auto" && hasLqip({ thumbnail, blurhash: blurDataUrl }));
  const showPlaceholder = !loaded && !error;
  const showShimmer = showPlaceholder && (placeholder === "shimmer" || (placeholder === "auto" && !useBlur));

  const fit = objectFit || (variant === "contain" ? "contain" : "cover");
  const isAvatar = variant === "avatar";
  const radius = borderRadius ?? (isAvatar ? "50%" : 0);

  if (!src || error) {
    if (fallback) return <>{fallback}</>;
    if (isAvatar && fallbackText) {
      const letter = (fallbackText[0] || "H").toUpperCase();
      const sz = width || height || 38;
      return (
        <div
          className={className}
          style={{
            width: sz, height: sz, borderRadius: radius,
            background: TEAL_SOFT, display: "flex",
            alignItems: "center", justifyContent: "center",
            fontSize: sz * 0.38, fontWeight: 700, color: TEAL,
            border: isTalent ? "2px solid #16D7C5" : "1.5px solid rgba(13,196,181,0.18)",
            flexShrink: 0,
            ...style,
          }}
          {...rest}
        >
          {letter}
        </div>
      );
    }
    return null;
  }

  const containerStyle = {
    position: "relative",
    overflow: "hidden",
    background: NEUTRAL_BG,
    flexShrink: 0,
    ...(aspectRatio && !height ? { aspectRatio: String(aspectRatio) } : {}),
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
    ...(borderRadius != null ? { borderRadius: radius } : {}),
    ...(fill ? { position: "absolute", inset: 0, width: "100%", height: "100%" } : {}),
    ...(isAvatar && isTalent ? {
      border: "2px solid #16D7C5",
      boxShadow: "0 0 8px rgba(22,215,197,0.30)",
    } : isAvatar ? {
      border: "1.5px solid rgba(13,196,181,0.18)",
    } : {}),
    ...style,
  };

  return (
    <div
      className={className}
      style={containerStyle}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      {...rest}
    >
      {showPlaceholder && useBlur && (
        <BlurPlaceholder src={lqipSrc} />
      )}
      {showShimmer && <ShimmerPlaceholder variant={variant === "cover" ? "warm" : "default"} />}

      <img
        src={optimizedSrc}
        srcSet={srcSet}
        sizes={srcSet ? (sizes || "100vw") : undefined}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        fetchPriority={priority ? "high" : "auto"}
        onLoad={(e) => { setLoaded(true); onLoad?.(e); }}
        onError={(e) => { setError(true); onError?.(e); }}
        className={loaded ? "hui-img-loaded" : undefined}
        style={{
          width: "100%",
          height: "100%",
          objectFit: fit,
          display: "block",
          opacity: loaded ? 1 : 0,
          transition: "opacity 0.32s ease",
          ...(fill ? { position: "absolute", inset: 0 } : {}),
          ...imgStyle,
        }}
      />
    </div>
  );
});

export default HuiImage;
export { HuiImage, ShimmerPlaceholder, PLACEHOLDER_BG, NEUTRAL_BG };
