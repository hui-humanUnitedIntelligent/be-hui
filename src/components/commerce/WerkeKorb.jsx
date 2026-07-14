// src/components/commerce/WerkeKorb.jsx — HUI Werkekorb v1.1
// Persönlicher Sammelraum. Kein Warenkorb. Ruhiger menschlicher Raum.
// Designsprache: HUI Design System (hui.design.js + hui.interaction.js)

import { HUIImpactIcon } from '../../design/icons/HuiSystemIcons.jsx';
import React, { useState, useRef, useEffect, useCallback } from "react";
import { EASE, DUR } from "../../design/hui.interaction.js";
import { NAV_CLEARANCE_CSS } from "../home/navigation/navigationGeometry.js";
import {
  C, TYPE_META, haptic as haptic_,
  calcTotal, calcImpact, calcTotalWithQty, calcPlatformFee,
  groupByPerson,
  allowsQuantity, getOriginalHint,
} from "./commerceUtils.js";
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
// groupByPerson: aus commerceUtils importiert

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
        bottom:       `calc(${NAV_CLEARANCE_CSS} + 20px)`,
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
function KorbKarte({ item, onRemove, idx, removing, onQtyChange }) {
  const meta       = TYPE_META[item.type] || TYPE_META.work;
  const price      = formatPrice(item._raw?.price ?? item.price);
  const thumb      = item._raw?.cover_url || item.cover_url || item.img || null;
  const title      = item.title || item._raw?.title || item.name || "Ohne Titel";
  const authorName = item.author?.name || null;

  const [pressed, setPressed] = useState(false);

  const canQty     = allowsQuantity(item);
  const origHint   = getOriginalHint(item);
  const [qty, setQty] = useState(
    (typeof item.quantity === "number" && item.quantity > 0) ? item.quantity : 1
  );
  // Qty-Änderung nach außen melden (parent kann item.quantity updaten)
  const changeQty = useCallback((delta) => {
    setQty(prev => {
      const next = Math.max(1, prev + delta);
      if (next !== prev) {
        haptic("light");
        onQtyChange?.(item, next);
      }
      return next;
    });
  }, [item, onQtyChange]);

  return (
    <div
      style={{
        background:   C.creamSoft,
        borderRadius: 18,
        padding:      "20px 14px 20px 16px",
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
      {/* ── v2.0: Werkbild groß → Titel dominant → Wirker ruhig → Typ+Preis ── */}

      {/* Werkbild — 88×88, weicher Schatten */}
      <div style={{
        width:        88,
        height:       88,
        borderRadius: 18,
        overflow:     "hidden",
        flexShrink:   0,
        background:   meta.bg,
        display:      "flex",
        alignItems:   "center",
        justifyContent: "center",
        boxShadow:    "0 4px 14px rgba(20,20,34,0.10)",
      }}>
        {thumb
          ? <img src={thumb} alt="" loading="lazy"
              style={{ width:"100%", height:"100%", objectFit:"cover" }} />
          : <span style={{ fontSize: 32, opacity: 0.35, color: meta.accent }}>◈</span>
        }
      </div>

      {/* Inhalt — v2.1: alles linksbündig, von oben nach unten */}
      <div style={{ flex: 1, minWidth: 0 }}>

        {/* Werktitel — stärkstes Element, sauberes Ellipsis */}
        <div style={{
          fontSize:      17,
          fontWeight:    800,
          color:         C.ink,
          lineHeight:    1.25,
          overflow:      "hidden",
          textOverflow:  "ellipsis",
          whiteSpace:    "nowrap",
          letterSpacing: -0.35,
          marginBottom:  8,
        }}>
          {title}
        </div>

        {/* Wirker — ruhig, dezent, mehr Luft nach unten */}
        {authorName && (
          <div style={{
            fontSize:     13,
            fontWeight:   400,
            color:        C.muted,
            letterSpacing: 0,
            marginBottom: 14,
            lineHeight:   1.3,
          }}>
            von {authorName}
          </div>
        )}

        {/* Typ-Pill — linksbündig, dezent */}
        <div style={{ marginBottom: price ? 6 : 0 }}>
          <span style={{
            display:       "inline-block",
            fontSize:      10,
            fontWeight:    600,
            color:         meta.accent,
            letterSpacing: 0.3,
            padding:       "3px 9px",
            borderRadius:  99,
            background:    meta.bg,
            border:        `1px solid ${meta.accent}22`,
            lineHeight:    1.4,
          }}>
            {meta.label}
          </span>
        </div>

        {/* Preis + Mengenwähler — v3.1: kontextabhängig */}
        <div style={{ marginTop: 4 }}>
          {price && (
            <div style={{
              fontSize:   14,
              fontWeight: 500,
              color:      C.muted,
              fontVariantNumeric: "tabular-nums",
              letterSpacing: -0.1,
              lineHeight:  1.3,
              marginBottom: canQty ? 10 : 0,
            }}>
              {price}{qty > 1 ? ` × ${qty}` : ""}
            </div>
          )}

          {/* Mengenwähler — nur bei geeigneten Items */}
          {canQty && (
            <div style={{
              display:     "flex",
              alignItems:  "center",
              gap:         10,
              marginTop:   2,
            }}>
              <button
                onPointerDown={e => e.stopPropagation()}
                onClick={() => changeQty(-1)}
                aria-label="Weniger"
                style={{
                  width:       32,
                  height:      32,
                  borderRadius:"50%",
                  border:      `1px solid rgba(13,196,181,0.22)`,
                  background:  "rgba(13,196,181,0.06)",
                  color:       qty <= 1 ? C.faint : C.teal,
                  fontSize:    17,
                  fontWeight:  300,
                  display:     "flex",
                  alignItems:  "center",
                  justifyContent:"center",
                  cursor:      qty <= 1 ? "default" : "pointer",
                  outline:     "none",
                  padding:     0,
                  flexShrink:  0,
                  transition:  "color 150ms ease, background 150ms ease",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                −
              </button>

              <span style={{
                fontSize:   14,
                fontWeight: 600,
                color:      C.inkMid,
                minWidth:   22,
                textAlign:  "center",
                fontVariantNumeric: "tabular-nums",
                letterSpacing: -0.1,
              }}>
                {qty}
              </span>

              <button
                onPointerDown={e => e.stopPropagation()}
                onClick={() => changeQty(+1)}
                aria-label="Mehr"
                style={{
                  width:       32,
                  height:      32,
                  borderRadius:"50%",
                  border:      `1px solid rgba(13,196,181,0.22)`,
                  background:  "rgba(13,196,181,0.06)",
                  color:       C.teal,
                  fontSize:    17,
                  fontWeight:  300,
                  display:     "flex",
                  alignItems:  "center",
                  justifyContent:"center",
                  cursor:      "pointer",
                  outline:     "none",
                  padding:     0,
                  flexShrink:  0,
                  transition:  "color 150ms ease, background 150ms ease",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                +
              </button>
            </div>
          )}

          {/* Original-Hinweis — nur bei Einzelstücken */}
          {origHint && !canQty && (
            <div style={{
              fontSize:   11,
              fontWeight: 500,
              color:      C.sage,
              letterSpacing: 0.2,
              marginTop:  4,
              lineHeight: 1.3,
            }}>
              {origHint}
            </div>
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
          alignSelf:   "flex-start",
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
function PersonGruppe({ group, onRemove, removingId, onQtyChange }) {
  const count = group.items.length;
  const label = count === 1 ? "1 Werk ausgewählt" : `${count} Auswahlen`;

  return (
    <div style={{ marginBottom: 14 }}>

      {/* ── Personen-Header: Avatar + Name + Subtext ── */}
      <div style={{
        display:     "flex",
        alignItems:  "center",
        gap:         10,
        padding:     "10px 4px 10px",
      }}>
        {/* Avatar */}
        {group.avatar
          ? <img loading="lazy" decoding="async" src={group.avatar} alt=""
              style={{
                width: 36, height: 36, borderRadius: "50%",
                objectFit: "cover", flexShrink: 0,
                border: `1.5px solid ${C.tealPale}`,
                boxShadow: "0 1px 8px rgba(13,196,181,0.14)",
              }} />
          : <div style={{
              width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
              background: `linear-gradient(135deg, ${C.tealPale}, ${C.creamDeep})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontWeight: 800, color: C.teal,
              border: `1px solid ${C.tealGlow}`,
              boxShadow: "0 1px 8px rgba(13,196,181,0.12)",
            }}>
              {group.name.charAt(0).toUpperCase()}
            </div>
        }

        {/* Name + Subtext */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize:      14,
            fontWeight:    800,
            color:         C.ink,
            letterSpacing: -0.25,
            lineHeight:    1.2,
            whiteSpace:    "nowrap",
            overflow:      "hidden",
            textOverflow:  "ellipsis",
          }}>
            {group.name}
          </div>
          <div style={{
            fontSize:     11,
            fontWeight:   500,
            color:        C.teal,
            letterSpacing: 0,
            lineHeight:   1.3,
            marginTop:    2,
          }}>
            {label}
          </div>
        </div>
      </div>

      {/* ── Karten ── */}
      {group.items.map((item, idx) => (
        <KorbKarte
          key={item.id || idx}
          item={item}
          onRemove={onRemove}
          idx={idx}
          removing={removingId === item.id}
          onQtyChange={onQtyChange}
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
function ImpactZeile({ impactEur, huiEur }) {
  if (!impactEur || impactEur <= 0) return null;
  const impactStr = impactEur.toFixed(2).replace(".", ",");
  const huiStr    = huiEur ? huiEur.toFixed(2).replace(".", ",") : impactStr;
  return (
    <div style={{
      marginTop:  14,
      paddingTop: 14,
      borderTop:  "1px solid rgba(20,20,34,0.05)",
    }}>
      {/* Hauptzeile: Icon + Text + Betrag */}
      <div style={{
        display:        "flex",
        alignItems:     "flex-start",
        gap:            8,
        marginBottom:   6,
      }}>
        <HUIImpactIcon size={12} style={{flexShrink:0, lineHeight:1.5, color:"rgba(14,196,184,0.7)"}} />
        <div style={{ flex:1 }}>
          <span style={{
            fontSize:   12,
            fontWeight: 600,
            color:      C.sage,
            lineHeight: 1.5,
          }}>
            Gemeinsam Wirkung schaffen — 
          </span>
          <span style={{
            fontSize:   12,
            color:      C.muted,
            lineHeight: 1.5,
          }}>
            HUI investiert {huiStr} € (20 %) aus den eigenen Einnahmen — davon {impactStr} € direkt in Impact-Projekte.
          </span>
        </div>
      </div>
      {/* Zweite Zeile: Hinweis */}
      <div style={{
        fontSize:   11,
        color:      C.faint,
        lineHeight: 1.5,
        paddingLeft: 20,
      }}>
        Für dich entstehen keine zusätzlichen Kosten.
      </div>
    </div>
  );
}


// ════════════════════════════════════════════════════════════════
//  PREISBLOCK — modular, zukunftssicher (Werke / Versand / Rabatt / Gesamt)
// ════════════════════════════════════════════════════════════════
function PreisBlock({ werke, versand, rabatt }) {
  const fmt = (v) => v.toFixed(2).replace(".", ",") + " €";
  const showVersand = versand !== null && versand !== undefined;
  const showRabatt  = rabatt  !== null && rabatt  !== undefined && rabatt > 0;
  const gesamt = werke + (showVersand ? versand : 0) - (showRabatt ? rabatt : 0);

  // Vereinfacht: nur Gesamtbetrag
  if (!showVersand && !showRabatt) {
    return (
      <div style={{ textAlign: "center", padding: "8px 0 12px" }}>
        <div style={{
          fontSize:      10,
          fontWeight:    600,
          color:         C.faint,
          letterSpacing: 0.8,
          textTransform: "uppercase",
          marginBottom:  6,
        }}>
          Deine Auswahl
        </div>
        <div style={{
          fontSize:   24,
          fontWeight: 600,
          color:      C.inkMid,
          letterSpacing: -0.5,
          lineHeight: 1.15,
          fontVariantNumeric: "tabular-nums",
        }}>
          {fmt(werke)}
        </div>
      </div>
    );
  }

  // Aufgeschlüsselt
  return (
    <div style={{ padding: "4px 0 10px" }}>
      <div style={{
        fontSize:10, fontWeight:600, color:C.faint,
        letterSpacing:0.8, textTransform:"uppercase", marginBottom:10,
      }}>
        Deine Auswahl
      </div>
      {[
        { label:"Werke", val:werke, color:C.inkMid, custom:null },
        ...(showVersand ? [{ label:"Versand", val:versand,
          color: versand === 0 ? C.sage : C.muted,
          custom: versand === 0 ? "Kostenlos" : null }] : []),
        ...(showRabatt ? [{ label:"Rabatt", val:rabatt,
          color:C.sage, custom: "−" + fmt(rabatt) }] : []),
      ].map((r, i) => (
        <div key={i} style={{ display:"flex", justifyContent:"space-between",
          alignItems:"center", marginBottom:5 }}>
          <span style={{ fontSize:13, color:C.muted }}>{r.label}</span>
          <span style={{ fontSize:13, fontWeight:500, color:r.color,
            fontVariantNumeric:"tabular-nums" }}>
            {r.custom ?? fmt(r.val)}
          </span>
        </div>
      ))}
      <div style={{ height:1, background:"rgba(20,20,34,0.06)", margin:"8px 0" }} />
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline" }}>
        <span style={{ fontSize:13, color:C.ink, fontWeight:600 }}>Gesamt</span>
        <span style={{ fontSize:20, fontWeight:700, color:C.ink,
          fontVariantNumeric:"tabular-nums", letterSpacing:-0.5 }}>
          {fmt(gesamt)}
        </span>
      </div>
    </div>
  );
}

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

  // v3.1: qty-Map — Mengen pro Item-ID (lokal in WerkeKorb)
  const [qtyMap, setQtyMap] = useState({});
  const enrichedItems = items.map(i => ({
    ...i,
    quantity: qtyMap[i.id] ?? 1,
  }));
  const handleQtyChange = useCallback((item, newQty) => {
    setQtyMap(prev => ({ ...prev, [item.id]: newQty }));
  }, []);

  const groups = groupByPerson(enrichedItems);
  const iCount = items.length;
  const pCount = groups.length;

  const total  = calcTotalWithQty(enrichedItems);
  const impact    = calcImpact(total);      // 6% Impact-Pool-Anteil
  const huiTotal  = calcPlatformFee(total);  // 20% HUI-Gesamt
  const gesamt    = +total.toFixed(2); // Käufer zahlt nur den Werkpreis
  const versandEur = null; // TODO: aus items.delivery_cost ableiten
  const rabattEur  = null; // TODO: aus cart.discount ableiten

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
      await onUnterstuetzen(enrichedItems); // P1: qty aus qtyMap korrekt übergeben
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
          zIndex:     10490, /* >BottomNav(10000) — Footer-Overlap-Fix 2026-07-05 */
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
          zIndex:        10500, /* >BottomNav(10000) — Footer-Overlap-Fix 2026-07-05 */
          background:    C.cream,
          borderRadius:  "22px 22px 0 0",
          boxShadow:     "0 -12px 48px rgba(20,20,34,0.14), 0 -2px 8px rgba(20,20,34,0.06)",
          maxHeight:     "88vh",
          display:       "flex",
          flexDirection: "column",
          animation:     `huiSheetRise ${DUR.page}ms ${EASE.outSoft} both`,
          // paddingBottom: im Sticky Footer (inkl. TabBar-Clearance 64px)
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
            <div style={{
              // Button-Strip (78px) + TabBar (56px) + Puffer (28px) + safe-area
              paddingBottom: `calc(162px + max(0px, env(safe-area-inset-bottom, 0px)))`,
            }}>
              {/* Menschen & Werke — immer zuerst */}
              {groups.map(group => (
                <PersonGruppe
                  key={group.key}
                  group={group}
                  onRemove={handleRemove}
                  removingId={removingId}
                  onQtyChange={handleQtyChange}
                />
              ))}

              {/* Preisübersicht + Impact — scrollt mit den Werken */}
              {total > 0 && (
                <div style={{
                  marginTop:  4,
                  paddingTop: 16,
                  borderTop:  `1px solid rgba(20,20,34,0.05)`,
                }}>
                  <PreisBlock
                    werke={gesamt}
                    versand={versandEur}
                    rabatt={rabattEur}
                  />
                </div>
              )}

              {/* Impact-Info */}
              <ImpactZeile impactEur={impact} huiEur={huiTotal} />

            </div>
          )}
        </div>

        {/* ── Sticky Button-Strip v4.2 ────────────────────────────────
             Nur der Unterstützen-Button bleibt dauerhaft sichtbar.
             PreisBlock + Impact scrollen mit den Werken.
             Safe-Area + TabBar-Clearance hier verankert.
        ────────────────────────────────────────────────────────── */}
        {iCount > 0 && phase !== "success" && (
          <div style={{
            flexShrink:    0,
            background:    `linear-gradient(to top, ${C.cream} 85%, transparent)`,
            paddingTop:    16,
            paddingLeft:   20,
            paddingRight:  20,
            // TabBar (56px) + visueller Puffer (28px) + safe-area
            paddingBottom: `calc(84px + max(0px, env(safe-area-inset-bottom, 0px)))`,
            display:       "flex",
            justifyContent:"center",
          }}>
            <button
              onClick={handleUnterstuetzen}
              onPointerDown={e => { if (phase !== "loading") e.currentTarget.style.transform = "scale(0.97)"; }}
              onPointerUp={e   => { e.currentTarget.style.transform = "scale(1)"; }}
              onPointerLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
              disabled={phase === "loading"}
              style={{
                width:        "78%",
                height:       "46px",
                borderRadius: 16,
                border:       "none",
                background:   phase === "loading"
                  ? "rgba(20,20,34,0.07)"
                  : `linear-gradient(135deg, ${C.teal} 0%, #14CEC2 100%)`,
                color:        phase === "loading" ? C.muted : "#fff",
                fontWeight:   700,
                fontSize:     15,
                letterSpacing: -0.1,
                cursor:       phase === "loading" ? "default" : "pointer",
                outline:      "none",
                boxShadow:    phase === "loading"
                  ? "none"
                  : `0 3px 12px rgba(13,196,181,0.15)`,
                transition:   `all ${DUR.normal}ms ${EASE.out}`,
                WebkitTapHighlightColor: "transparent",
                flexShrink:   0,
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
