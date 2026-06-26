// src/components/commerce/WerkeKorb.jsx — HUI Werkekorb v1.1
// Persönlicher Sammelraum. Kein Warenkorb. Ruhiger menschlicher Raum.
// Designsprache: HUI Design System (hui.design.js + hui.interaction.js)

import React, { useState, useRef, useEffect, useCallback } from "react";
import { HUI } from "../../design/hui.design.js";
import { EASE, DUR } from "../../design/hui.interaction.js";

// ── Design Tokens (lokal gespiegelt für Performance) ─────────────
const C = {
  cream:       HUI?.COLOR?.cream       ?? "#FAF7F2",
  creamSoft:   HUI?.COLOR?.creamSoft   ?? "#FDFBF8",
  creamDeep:   HUI?.COLOR?.creamDeep   ?? "#EDE5D8",
  teal:        HUI?.COLOR?.teal        ?? "#0DC4B5",
  tealGlow:    HUI?.COLOR?.tealGlow    ?? "rgba(13,196,181,0.18)",
  tealPale:    HUI?.COLOR?.tealPale    ?? "#E6FAF8",
  coral:       HUI?.COLOR?.coral       ?? "#F47355",
  coralGlow:   HUI?.COLOR?.coralGlow   ?? "rgba(244,115,85,0.18)",
  ink:         HUI?.COLOR?.ink         ?? "#141422",
  inkMid:      HUI?.COLOR?.inkMid      ?? "#2E2E45",
  muted:       HUI?.COLOR?.muted       ?? "#8A8A9E",
  faint:       HUI?.COLOR?.faint       ?? "#C0C0D0",
  sage:        HUI?.COLOR?.sage        ?? "#6BAE8F",
  sagePale:    HUI?.COLOR?.sagePale    ?? "#EEF7F2",
  violet:      HUI?.COLOR?.violet      ?? "#7264D6",
  violetPale:  HUI?.COLOR?.violetPale  ?? "#F0EEFF",
  gold:        HUI?.COLOR?.gold        ?? "#D4952A",
  goldPale:    HUI?.COLOR?.goldPale    ?? "#FDF6E3",
};

// ── Typ-Metadaten ────────────────────────────────────────────────
const TYPE_META = {
  work:       { label: "Werk",           accent: C.teal,   bg: C.tealPale   },
  experience: { label: "Erlebnis",       accent: C.coral,  bg: C.coralGlow  },
  event:      { label: "Event",          accent: C.violet, bg: C.violetPale },
  impact:     { label: "Impact-Projekt", accent: C.sage,   bg: C.sagePale   },
  moment:     { label: "Moment",         accent: C.gold,   bg: C.goldPale   },
};

// ── Haptik (iOS) ─────────────────────────────────────────────────
function haptic(style = "light") {
  try {
    if (window.navigator?.vibrate) {
      const ms = style === "success" ? [10, 60, 10] : style === "medium" ? [12] : [6];
      window.navigator.vibrate(ms);
    }
  } catch (_) {}
}

// ── Preisformatierung ────────────────────────────────────────────
function formatPrice(val) {
  if (val == null) return null;
  const n = typeof val === "string"
    ? parseFloat(val.replace(/[^0-9.,]/g, "").replace(",", "."))
    : Number(val);
  if (!n || isNaN(n) || n <= 0) return null;
  return n.toFixed(2).replace(".", ",") + "\u202F€";
}

function parseAmount(val) {
  if (val == null) return 0;
  const n = typeof val === "string"
    ? parseFloat(val.replace(/[^0-9.,]/g, "").replace(",", "."))
    : Number(val);
  return isNaN(n) ? 0 : n;
}

// ── Gruppen nach Person ──────────────────────────────────────────
function groupByPerson(items) {
  const map = new Map();
  for (const item of items) {
    const key    = item.author?.id || item.creatorId || "__unknown__";
    const name   = item.author?.name || "Unbekannte Person";
    const avatar = item.author?.avatar || null;
    if (!map.has(key)) map.set(key, { key, name, avatar, items: [] });
    map.get(key).items.push(item);
  }
  return Array.from(map.values());
}

// ══════════════════════════════════════════════════════════════════
//  SCHALEN-ILLUSTRATION (SVG — inline, keine externe Datei)
// ══════════════════════════════════════════════════════════════════
function SchalenIcon({ size = 28, opacity = 1, filled = false }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 32 32"
      fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ opacity, display: "block", flexShrink: 0 }}
    >
      {/* Schatten unter der Schale */}
      <ellipse cx="16" cy="27.5" rx="9" ry="2" fill="rgba(20,20,34,0.08)" />

      {/* Schalen-Körper — organische Form */}
      <path
        d="M5.5 16 C5.5 22.351 10.201 26.5 16 26.5 C21.799 26.5 26.5 22.351 26.5 16"
        stroke={filled ? C.teal : C.inkMid}
        strokeWidth={filled ? "2" : "1.6"}
        strokeLinecap="round"
        fill={filled ? `${C.teal}18` : "none"}
      />

      {/* Schalen-Rand oben — leicht gewölbt */}
      <path
        d="M4 16 C4 15.448 4.448 15 5 15 L27 15 C27.552 15 28 15.448 28 16"
        stroke={filled ? C.teal : C.inkMid}
        strokeWidth={filled ? "2" : "1.6"}
        strokeLinecap="round"
        fill="none"
      />

      {/* Kleiner Standring */}
      <path
        d="M12 26.5 C13.2 27.3 14.5 27.5 16 27.5 C17.5 27.5 18.8 27.3 20 26.5"
        stroke={filled ? C.teal : C.muted}
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
      />

      {/* Innere Wölbung — Tiefe simulieren */}
      <path
        d="M9 16 C9 20.5 12 23.5 16 23.5 C20 23.5 23 20.5 23 16"
        stroke={filled ? `${C.teal}88` : `${C.faint}`}
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
      />

      {/* Highlight-Reflexion */}
      <path
        d="M8 15.2 C8.5 14.8 10 14.5 11.5 14.8"
        stroke="rgba(255,255,255,0.7)"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════════
//  FLOATING BUTTON
// ══════════════════════════════════════════════════════════════════
export function WerkeKorbButton({ count, onOpen, glowing }) {
  const [glow,    setGlow]    = useState(false);
  const [mounted, setMounted] = useState(count > 0); // nur rendern wenn nötig
  const [visible, setVisible] = useState(count > 0); // CSS opacity/transform
  const prevCount = useRef(count);
  const hideTimer = useRef(null);

  // Sichtbarkeits-Steuerung: einfahren / ausfahren
  useEffect(() => {
    if (count > 0) {
      // Einfahren: sofort mounten, dann auf sichtbar wechseln (für CSS-Transition)
      clearTimeout(hideTimer.current);
      setMounted(true);
      requestAnimationFrame(() => setVisible(true));
    } else {
      // Ausfahren: 2 s warten, dann ausblenden, dann unmounten
      setVisible(false);
      hideTimer.current = setTimeout(() => setMounted(false), 2200); // 2s + 200ms Transition
    }
    return () => clearTimeout(hideTimer.current);
  }, [count > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  // Glow + Toast beim Hinzufügen
  useEffect(() => {
    if (count > prevCount.current) {
      setGlow(true);
      haptic("light");
      const t = setTimeout(() => setGlow(false), 600);
      prevCount.current = count;
      // Toast: "Zum Werkekorb hinzugefügt." — nur beim ERSTEN Item
      if (prevCount.current === 1) {
        import("../../lib/useToast.jsx").then(m => {
          m?.toast?.success?.("Zum Werkekorb hinzugefügt.", { duration: 2500 });
        }).catch(() => {});
      }
      return () => clearTimeout(t);
    }
    prevCount.current = count;
  }, [count]);

  useEffect(() => {
    if (glowing) {
      setGlow(true);
      const t = setTimeout(() => setGlow(false), 600);
      return () => clearTimeout(t);
    }
  }, [glowing]);

  if (!mounted) return null;

  return (
    <button
      onClick={onOpen}
      aria-label="Werkekorb öffnen"
      style={{
        position:     "fixed",
        bottom:       `calc(66px + max(14px, env(safe-area-inset-bottom, 14px)) + 20px)`,
        right:        16,
        zIndex:       9500,
        width:        50,
        height:       50,
        borderRadius: "50%",
        background:   glow
          ? "rgba(230,250,248,0.97)"
          : "rgba(253,251,248,0.94)",
        backdropFilter:       "blur(16px) saturate(1.4)",
        WebkitBackdropFilter: "blur(16px) saturate(1.4)",
        border:       glow
          ? `1.5px solid rgba(13,196,181,0.45)`
          : `1.5px solid rgba(20,20,34,0.09)`,
        boxShadow:    glow
          ? `0 0 0 6px rgba(13,196,181,0.10), 0 4px 20px rgba(13,196,181,0.16), 0 2px 8px rgba(20,20,34,0.08)`
          : `0 4px 16px rgba(20,20,34,0.10), 0 1px 4px rgba(20,20,34,0.06)`,
        display:      "flex",
        alignItems:   "center",
        justifyContent: "center",
        cursor:       "pointer",
        // Einfahren: von unten rechts + opacity 0 → sichtbar
        opacity:      visible ? 1 : 0,
        transform:    visible ? "translateY(0) scale(1)" : "translateY(14px) scale(0.88)",
        transition:   [
          `opacity 300ms ${EASE.outSoft}`,
          `transform 300ms ${EASE.outSoft}`,
          `box-shadow ${DUR.mood}ms ${EASE.outGentle}`,
          `border-color ${DUR.mood}ms ${EASE.outGentle}`,
          `background ${DUR.mood}ms ${EASE.outGentle}`,
        ].join(", "),
        outline:      "none",
        padding:      0,
        userSelect:   "none",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <SchalenIcon size={26} opacity={count > 0 ? 1 : 0.42} filled={count > 0} />

      {/* Kein Badge — nur Teal-Punkt bei 1 Item */}
      {count === 1 && (
        <span style={{
          position:    "absolute",
          top:         8,
          right:       8,
          width:       8,
          height:      8,
          borderRadius:"50%",
          background:  C.teal,
          boxShadow:   `0 0 0 2px rgba(253,251,248,0.9)`,
          transition:  `opacity ${DUR.micro}ms ${EASE.out}`,
        }} />
      )}

      {/* Badge ab 2 Items */}
      {count >= 2 && (
        <span style={{
          position:    "absolute",
          top:         6,
          right:       6,
          minWidth:    17,
          height:      17,
          padding:     "0 4px",
          borderRadius: 99,
          background:  C.teal,
          color:       "#fff",
          fontSize:    10,
          fontWeight:  700,
          display:     "flex",
          alignItems:  "center",
          justifyContent: "center",
          lineHeight:  1,
          boxShadow:   `0 1px 6px rgba(13,196,181,0.40), 0 0 0 2px rgba(253,251,248,0.9)`,
          fontVariantNumeric: "tabular-nums",
          letterSpacing: -0.3,
          transition:  `opacity ${DUR.micro}ms ${EASE.out}`,
        }}>
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
}

// ══════════════════════════════════════════════════════════════════
//  KARTE
// ══════════════════════════════════════════════════════════════════
function KorbKarte({ item, onRemove, idx, removing }) {
  const meta       = TYPE_META[item.type] || TYPE_META.work;
  const price      = formatPrice(item._raw?.price ?? item.price);
  const thumb      = item._raw?.cover_url || item.cover_url || item.img || null;
  const title      = item.title || item._raw?.title || item.name || "Ohne Titel";
  const authorName = item.author?.name || null;

  const [pressed, setPressed] = useState(false);

  return (
    <div
      style={{
        background:   C.creamSoft,
        borderRadius: 18,
        padding:      "16px 14px 16px 16px",
        marginBottom: 10,
        display:      "flex",
        gap:          14,
        alignItems:   "flex-start",
        boxShadow:    "0 2px 16px rgba(20,20,34,0.05), 0 1px 3px rgba(20,20,34,0.03)",
        border:       `1px solid rgba(20,20,34,0.04)`,
        transform:    removing ? "translateX(-20px)" : pressed ? "scale(0.985)" : "scale(1)",
        opacity:      removing ? 0 : 1,
        transition:   removing
          ? `transform ${DUR.normal}ms ${EASE.in}, opacity ${DUR.normal}ms ${EASE.in}`
          : `transform ${DUR.tap}ms ${EASE.outSoft}`,
        animation:    !removing ? `huiKorbFadeUp ${DUR.page}ms ${idx * 60}ms both ${EASE.outSoft}` : "none",
        willChange:   "transform, opacity",
      }}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
    >
      {/* Thumbnail */}
      <div style={{
        width:          60,
        height:         60,
        borderRadius:   14,
        overflow:       "hidden",
        flexShrink:     0,
        background:     meta.bg,
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
      }}>
        {thumb
          ? <img src={thumb} alt="" loading="lazy"
              style={{ width:"100%", height:"100%", objectFit:"cover" }} />
          : <span style={{ fontSize: 24, opacity: 0.45, color: meta.accent }}>◈</span>
        }
      </div>

      {/* Inhalt — Werk zuerst, Wirker dezent darunter */}
      <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>

        {/* Werktitel — größte Schrift der Karte */}
        <div style={{
          fontSize:     16,
          fontWeight:   800,
          color:        C.ink,
          lineHeight:   1.25,
          overflow:     "hidden",
          textOverflow: "ellipsis",
          whiteSpace:   "nowrap",
          letterSpacing: -0.3,
          marginBottom: 5,
        }}>
          {title}
        </div>

        {/* Wirker — dezent darunter */}
        {authorName && (
          <div style={{
            fontSize:    12,
            fontWeight:  400,
            color:       C.muted,
            letterSpacing: 0.05,
            marginBottom: 8,
          }}>
            von {authorName}
          </div>
        )}

        {/* Typ-Pill + Preis — unterste Zeile */}
        <div style={{ display:"flex", alignItems:"center", gap:7 }}>
          <span style={{
            fontSize:      9,
            fontWeight:    700,
            color:         meta.accent,
            letterSpacing: 0.6,
            textTransform: "uppercase",
            padding:       "2px 7px",
            borderRadius:  99,
            background:    meta.bg,
            border:        `1px solid ${meta.accent}20`,
          }}>
            {meta.label}
          </span>
          {price && (
            <span style={{
              fontSize:   12,
              fontWeight: 400,
              color:      C.faint,
              fontVariantNumeric: "tabular-nums",
              letterSpacing: 0.1,
            }}>
              {price}
            </span>
          )}
        </div>
      </div>
      {/* Entfernen */}
      <button
        onPointerDown={e => e.stopPropagation()}
        onClick={() => { haptic("medium"); onRemove(item); }}
        aria-label="Entfernen"
        style={{
          width:       28,
          height:      28,
          borderRadius:"50%",
          border:      `1px solid rgba(20,20,34,0.07)`,
          background:  "transparent",
          color:       C.faint,
          fontSize:    15,
          display:     "flex",
          alignItems:  "center",
          justifyContent: "center",
          cursor:      "pointer",
          flexShrink:  0,
          marginTop:   2,
          transition:  `color ${DUR.tap}ms ${EASE.out}`,
          outline:     "none",
          padding:     0,
          WebkitTapHighlightColor: "transparent",
        }}
      >
        ×
      </button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  PERSONEN-GRUPPE
// ══════════════════════════════════════════════════════════════════
function PersonGruppe({ group, onRemove, removingId }) {
  return (
    <div style={{ marginBottom: 4 }}>
      {/* Personen-Linie */}
      <div style={{
        display:     "flex",
        alignItems:  "center",
        gap:         9,
        padding:     "14px 0 8px",
      }}>
        {group.avatar
          ? <img
              src={group.avatar}
              alt=""
              style={{
                width: 32, height: 32, borderRadius: "50%",
                objectFit: "cover", flexShrink: 0,
                border: `1.5px solid ${C.tealPale}`,
                boxShadow: "0 1px 6px rgba(13,196,181,0.12)",
              }}
            />
          : <div style={{
              width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
              background: `linear-gradient(135deg, ${C.tealPale}, ${C.creamDeep})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 800, color: C.teal,
              border: `1px solid ${C.tealGlow}`,
              boxShadow: "0 1px 6px rgba(13,196,181,0.12)",
            }}>
              {group.name.charAt(0).toUpperCase()}
            </div>
        }
        <span style={{
          fontSize:   14,
          fontWeight: 800,
          color:      C.ink,
          letterSpacing: -0.3,
          flex: 1,
        }}>
          {group.name}
        </span>
        <span style={{
          fontSize:  11,
          color:     C.muted,
          fontWeight: 500,
        }}>
          {group.items.length} {group.items.length === 1 ? "Auswahl" : "Auswahlen"}
        </span>
      </div>

      {group.items.map((item, idx) => (
        <KorbKarte
          key={item.id || idx}
          item={item}
          onRemove={onRemove}
          idx={idx}
          removing={removingId === item.id}
        />
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  LEERER ZUSTAND
// ══════════════════════════════════════════════════════════════════
function LeererKorb({ onDiscover, onClose }) {
  return (
    <div style={{
      display:       "flex",
      flexDirection: "column",
      alignItems:    "center",
      padding:       "52px 32px 36px",
      textAlign:     "center",
      gap:           0,
    }}>
      {/* Illustration */}
      <div style={{
        marginBottom: 28,
        position:     "relative",
        width:        80,
        height:       80,
        display:      "flex",
        alignItems:   "center",
        justifyContent: "center",
      }}>
        {/* Halo */}
        <div style={{
          position:    "absolute",
          inset:       -12,
          borderRadius:"50%",
          background:  `radial-gradient(circle, ${C.tealPale} 0%, transparent 70%)`,
          opacity:     0.8,
        }} />
        <SchalenIcon size={56} opacity={0.35} filled={false} />
      </div>

      <div style={{
        fontSize:    20,
        fontWeight:  800,
        color:       C.ink,
        lineHeight:  1.3,
        letterSpacing: -0.5,
        marginBottom: 12,
      }}>
        Dein Werkekorb ist noch<br />ein leerer Raum.
      </div>
      <div style={{
        fontSize:    14,
        color:       C.muted,
        lineHeight:  1.65,
        maxWidth:    260,
        marginBottom: 32,
      }}>
        Hier sammelst du Werke, Erlebnisse und Projekte von Menschen, die dich berühren.
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        <button
          onClick={onDiscover}
          style={{
            padding:      "12px 24px",
            borderRadius: 99,
            border:       "none",
            background:   `linear-gradient(135deg, ${C.teal} 0%, #16D7C5 100%)`,
            color:        "#fff",
            fontWeight:   700,
            fontSize:     14,
            letterSpacing:-.2,
            cursor:       "pointer",
            outline:      "none",
            boxShadow:    `0 6px 20px rgba(13,196,181,0.30)`,
            WebkitTapHighlightColor: "transparent",
            transition:   `transform ${DUR.tap}ms ${EASE.outSoft}`,
          }}
        >
          Entdecken
        </button>
        <button
          onClick={onClose}
          style={{
            padding:      "12px 24px",
            borderRadius: 99,
            border:       `1.5px solid rgba(20,20,34,0.12)`,
            background:   "transparent",
            color:        C.inkMid,
            fontWeight:   600,
            fontSize:     14,
            cursor:       "pointer",
            outline:      "none",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          Deinen Raum öffnen
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  ERFOLGS-SCREEN
// ══════════════════════════════════════════════════════════════════
function ErfolgsScreen({ result, onChat, onDiscover }) {
  return (
    <div style={{
      display:       "flex",
      flexDirection: "column",
      alignItems:    "center",
      textAlign:     "center",
      padding:       "52px 28px 36px",
      gap:           0,
      animation:     `huiKorbFadeUp ${DUR.page}ms ${EASE.outSoft} both`,
    }}>
      {/* Symbol */}
      <div style={{
        width:        72,
        height:       72,
        borderRadius: "50%",
        background:   `radial-gradient(circle, ${C.tealPale} 0%, ${C.cream} 80%)`,
        display:      "flex",
        alignItems:   "center",
        justifyContent: "center",
        marginBottom: 24,
        boxShadow:    `0 0 0 12px rgba(13,196,181,0.06)`,
        fontSize:     32,
      }}>
        ✦
      </div>

      <div style={{
        fontSize:    22,
        fontWeight:  800,
        color:       C.ink,
        letterSpacing:-0.6,
        lineHeight:  1.2,
        marginBottom: 12,
      }}>
        Unterstützung angekommen.
      </div>

      <div style={{
        fontSize:    14,
        color:       C.muted,
        lineHeight:  1.65,
        maxWidth:    280,
        marginBottom: 12,
      }}>
        Du hast heute{" "}
        <strong style={{ color: C.inkMid }}>{result.count} {result.count === 1 ? "Auswahl" : "Auswahlen"}</strong>
        {result.creators > 0 && (
          <> von{" "}
            <strong style={{ color: C.inkMid }}>
              {result.creators} {result.creators === 1 ? "Person" : "Menschen"}
            </strong>
          </>
        )}{" "}unterstützt.
      </div>

      <div style={{
        fontSize:   12,
        color:      C.faint,
        fontStyle:  "italic",
        maxWidth:   240,
        lineHeight: 1.6,
        marginBottom: 32,
      }}>
        Die Verbindung entsteht niemals automatisch. Sie bleibt immer deine Wahl.
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        {onChat && (
          <button
            onClick={() => { haptic("light"); onChat(); }}
            style={{
              padding:      "12px 24px",
              borderRadius: 99,
              border:       "none",
              background:   `linear-gradient(135deg, ${C.teal}, #16D7C5)`,
              color:        "#fff",
              fontWeight:   700,
              fontSize:     14,
              cursor:       "pointer",
              outline:      "none",
              boxShadow:    `0 6px 20px rgba(13,196,181,0.28)`,
              WebkitTapHighlightColor: "transparent",
            }}
          >
            Verbinden
          </button>
        )}
        <button
          onClick={onDiscover}
          style={{
            padding:      "12px 24px",
            borderRadius: 99,
            border:       `1.5px solid rgba(20,20,34,0.12)`,
            background:   "transparent",
            color:        C.inkMid,
            fontWeight:   600,
            fontSize:     14,
            cursor:       "pointer",
            outline:      "none",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          Weiter entdecken
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  IMPACT-ZEILE
// ══════════════════════════════════════════════════════════════════
function ImpactZeile({ impactEur }) {
  if (!impactEur || impactEur <= 0) return null;
  const impactStr = impactEur.toFixed(2).replace(".", ",");
  return (
    <div style={{
      borderRadius:         16,
      background:           "rgba(238,247,242,0.82)",
      backdropFilter:       "blur(12px) saturate(1.2)",
      WebkitBackdropFilter: "blur(12px) saturate(1.2)",
      border:               `1px solid rgba(107,174,143,0.22)`,
      boxShadow:            "0 2px 16px rgba(107,174,143,0.10), inset 0 1px 0 rgba(255,255,255,0.60)",
      padding:              "22px 20px 20px",
      marginBottom:         0,
      textAlign:            "center",
    }}>
      {/* SVG-Blatt */}
      <div style={{ marginBottom:12 }}>
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none"
             xmlns="http://www.w3.org/2000/svg" style={{ display:"inline-block" }}>
          <path d="M14 4C14 4 6 8 6 16C6 20.4 9.6 24 14 24C18.4 24 22 20.4 22 16C22 8 14 4 14 4Z"
            fill="rgba(107,174,143,0.18)" stroke="#6BAE8F" strokeWidth="1.5" strokeLinejoin="round"/>
          <path d="M14 24V14" stroke="#6BAE8F" strokeWidth="1.4" strokeLinecap="round"/>
          <path d="M14 18C14 18 10 15 9 12" stroke="#6BAE8F" strokeWidth="1.2"
                strokeLinecap="round" opacity="0.6"/>
        </svg>
      </div>

      <div style={{ fontSize:13, fontWeight:700, color:C.sage, letterSpacing:0.15, marginBottom:8 }}>
        Gemeinsam Wirkung schaffen
      </div>

      <div style={{ fontSize:12, color:C.muted, lineHeight:1.65, maxWidth:260, margin:"0 auto 18px" }}>
        HUI investiert bei jeder Unterstützung einen Teil der eigenen Einnahmen in den HUI Impact Pool.
      </div>

      <div>
        <div style={{ fontSize:12, color:C.muted, lineHeight:1.5, marginBottom:8 }}>
          Bei dieser Unterstützung fließen
        </div>
        <div style={{
          fontSize:28, fontWeight:800, color:C.teal,
          letterSpacing:-0.8, lineHeight:1.1,
          fontVariantNumeric:"tabular-nums",
          marginBottom:8,
        }}>
          {impactStr} €
        </div>
        <div style={{ fontSize:12, color:C.muted, lineHeight:1.5 }}>
          in gemeinsame Impact-Projekte.
        </div>
      </div>

      <div style={{
        fontSize:11, color:C.faint, fontStyle:"italic",
        marginTop:16, lineHeight:1.55,
        paddingTop:14, borderTop:`1px solid rgba(107,174,143,0.14)`,
      }}>
        Für dich entstehen dadurch keine zusätzlichen Kosten.
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  HAUPT-KOMPONENTE
// ══════════════════════════════════════════════════════════════════
export default function WerkeKorb({
  items = [],
  onClose,
  onRemove,
  onUnterstuetzen,
  onDiscover,
  onChat,
}) {
  const [phase,     setPhase]     = useState("list");
  const [result,    setResult]    = useState(null);
  const [removingId, setRemovingId] = useState(null);

  const groups = groupByPerson(items);
  const iCount = items.length;
  const pCount = groups.length;

  const total  = items.reduce((s, item) =>
    s + parseAmount(item._raw?.price ?? item.price), 0);
  const impact = +(total * 0.07).toFixed(2);
  const gesamt = +total.toFixed(2); // Käufer zahlt nur den Werkpreis

  // Entfernen mit Animation
  const handleRemove = useCallback((item) => {
    setRemovingId(item.id);
    setTimeout(() => {
      onRemove?.(item);
      setRemovingId(null);
    }, DUR.normal);
  }, [onRemove]);

  async function handleUnterstuetzen() {
    if (!onUnterstuetzen || items.length === 0) return;
    haptic("success");
    setPhase("loading");
    try {
      await onUnterstuetzen(items);
      setResult({ count: iCount, creators: pCount });
      setPhase("success");
    } catch (err) {
      console.error("[WerkeKorb] Fehler:", err);
      setPhase("list");
    }
  }

  // Backdrop-Tap → Schließen
  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onClose?.();
  }

  return (
    <>
      {/* ── CSS-Keyframes ─────────────────────────────────────── */}
      <style>{`
        @keyframes huiKorbFadeUp {
          from { opacity:0; transform:translateY(12px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes huiSheetRise {
          from { transform:translateY(100%); }
          to   { transform:translateY(0); }
        }
        @keyframes huiBackdropIn {
          from { opacity:0; }
          to   { opacity:1; }
        }
      `}</style>

      {/* ── Backdrop ──────────────────────────────────────────── */}
      <div
        onClick={handleBackdropClick}
        style={{
          position:   "fixed",
          inset:      0,
          zIndex:     9800,
          background: "rgba(20,20,34,0.32)",
          backdropFilter:       "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          animation:  `huiBackdropIn ${DUR.page}ms ${EASE.outGentle} both`,
        }}
      />

      {/* ── Bottom Sheet ──────────────────────────────────────── */}
      <div
        style={{
          position:      "fixed",
          left:          0,
          right:         0,
          bottom:        0,
          zIndex:        9900,
          background:    C.cream,
          borderRadius:  "22px 22px 0 0",
          boxShadow:     "0 -12px 48px rgba(20,20,34,0.14), 0 -2px 8px rgba(20,20,34,0.06)",
          maxHeight:     "88vh",
          display:       "flex",
          flexDirection: "column",
          animation:     `huiSheetRise ${DUR.page}ms ${EASE.outSoft} both`,
          paddingBottom: `max(20px, env(safe-area-inset-bottom, 20px))`,
          overflow:      "hidden",
        }}
      >
        {/* Handle */}
        <div style={{
          width:        36,
          height:       4,
          borderRadius: 99,
          background:   "rgba(20,20,34,0.10)",
          margin:       "12px auto 0",
          flexShrink:   0,
        }} />

        {/* Header */}
        <div style={{
          padding:        "16px 20px 12px",
          flexShrink:     0,
          display:        "flex",
          alignItems:     "flex-start",
          justifyContent: "space-between",
          borderBottom:   `1px solid rgba(20,20,34,0.06)`,
        }}>
          <div>
            <div style={{
              fontSize:    21,
              fontWeight:  800,
              color:       C.ink,
              letterSpacing: -0.5,
              lineHeight:  1.2,
            }}>
              Dein Werkekorb
            </div>
            {iCount > 0 && phase !== "success" && (
              <div style={{ marginTop: 5 }}>
                <div style={{
                  fontSize:    13,
                  color:       C.muted,
                  fontWeight:  500,
                  lineHeight:  1.5,
                }}>
                  {pCount === 1
                    ? "Du unterstützt 1 Menschen"
                    : `Du unterstützt ${pCount} Menschen`}
                </div>
                <div style={{
                  fontSize:    11,
                  color:       C.faint,
                  marginTop:   2,
                  fontWeight:  400,
                }}>
                  {iCount} {iCount === 1 ? "Auswahl" : "Auswahlen"}
                </div>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Schließen"
            style={{
              width:       34,
              height:      34,
              borderRadius:"50%",
              border:      `1px solid rgba(20,20,34,0.09)`,
              background:  "rgba(20,20,34,0.05)",
              color:       C.muted,
              fontSize:    17,
              display:     "flex",
              alignItems:  "center",
              justifyContent:"center",
              cursor:      "pointer",
              outline:     "none",
              padding:     0,
              flexShrink:  0,
              WebkitTapHighlightColor: "transparent",
            }}
          >
            ×
          </button>
        </div>

        {/* Scroll-Bereich */}
        <div style={{
          flex:       1,
          overflowY:  "auto",
          padding:    "0 16px",
          WebkitOverflowScrolling: "touch",
          // Scrollbar dezent auf iOS
          scrollbarWidth: "none",
        }}>
          {phase === "success" && result ? (
            <ErfolgsScreen
              result={result}
              onChat={onChat}
              onDiscover={() => { onDiscover?.(); onClose?.(); }}
            />
          ) : iCount === 0 ? (
            <LeererKorb
              onDiscover={() => { onDiscover?.(); onClose?.(); }}
              onClose={onClose}
            />
          ) : (
            <div style={{ paddingBottom: 16 }}>
              {groups.map(group => (
                <PersonGruppe
                  key={group.key}
                  group={group}
                  onRemove={handleRemove}
                  removingId={removingId}
                />
              ))}
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        {iCount > 0 && phase !== "success" && (
          <div style={{
            padding:    "20px 16px 0",
            borderTop:  `1px solid rgba(20,20,34,0.07)`,
            flexShrink: 0,
          }}>
            {/* Gesamt — einzige Preiszeile */}
            {total > 0 && (
              <div style={{
                display:"flex", justifyContent:"space-between", alignItems:"baseline",
                marginBottom:18, padding:"12px 16px",
                background:C.creamSoft, borderRadius:12,
                border:`1px solid rgba(20,20,34,0.05)`,
              }}>
                <span style={{ fontSize:14, fontWeight:600, color:C.muted, letterSpacing:0 }}>Deine Unterstützung</span>
                <span style={{ fontSize:18, fontWeight:800, color:C.ink, letterSpacing:-0.4, fontVariantNumeric:"tabular-nums" }}>
                  {gesamt.toFixed(2).replace(".", ",")} €
                </span>
              </div>
            )}

            {/* Impact — Informationsbereich, kein Preisaufschlag */}
            <ImpactZeile impactEur={impact} />

                        {/* CTA */}
            <button
              onClick={handleUnterstuetzen}
              onPointerDown={e => { if (phase !== "loading") e.currentTarget.style.transform = "scale(0.98)"; }}
              onPointerUp={e   => { e.currentTarget.style.transform = "scale(1)"; }}
              onPointerLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
              disabled={phase === "loading"}
              style={{
                width:        "100%",
                marginTop:    18,
                padding:      "18px 0",
                borderRadius: 16,
                border:       "none",
                background:   phase === "loading"
                  ? "rgba(20,20,34,0.07)"
                  : `linear-gradient(135deg, ${C.teal} 0%, #18DDD0 50%, ${C.coral} 160%)`,
                color:        phase === "loading" ? C.muted : "#fff",
                fontWeight:   800,
                fontSize:     16,
                letterSpacing:-.3,
                cursor:       phase === "loading" ? "default" : "pointer",
                outline:      "none",
                boxShadow:    phase === "loading"
                  ? "none"
                  : `0 8px 28px rgba(13,196,181,0.30), 0 2px 8px rgba(13,196,181,0.18)`,
                transition:   `all ${DUR.normal}ms ${EASE.out}`,
                WebkitTapHighlightColor: "transparent",
              }}
            >
              {phase === "loading" ? "Einen Moment …" : "Unterstützen"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
