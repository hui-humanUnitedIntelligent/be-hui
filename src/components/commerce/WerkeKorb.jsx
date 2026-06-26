// src/components/commerce/WerkeKorb.jsx — HUI Werkekorb v1.0
// Persönlicher Sammelraum für Werke, Erlebnisse, Events und Impact-Projekte.
// Kein Einkaufswagen. Keine Amazon-UX. Ruhiger, menschlicher Raum.

import React, { useState, useCallback, useRef, useEffect } from "react";

// ── Konstanten ───────────────────────────────────────────────────
const CREAM  = "#FAF7F2";
const TEAL   = "#0DC4B5";
const CORAL  = "#F47355";
const INK    = "#141422";

const TYPE_META = {
  work:        { label: "Werk",            icon: "◈", accent: TEAL  },
  experience:  { label: "Erlebnis",        icon: "◉", accent: CORAL },
  event:       { label: "Event",           icon: "◇", accent: "#8B6FD4" },
  impact:      { label: "Impact-Projekt",  icon: "◎", accent: "#4CAF82" },
  moment:      { label: "Moment",          icon: "◌", accent: "#C4A35A" },
};

// ── Utilities ────────────────────────────────────────────────────
function formatPrice(val) {
  if (!val && val !== 0) return null;
  const n = typeof val === "string"
    ? parseFloat(val.replace(/[^0-9.,]/g, "").replace(",", "."))
    : Number(val);
  if (!n || isNaN(n)) return null;
  return n.toFixed(2).replace(".", ",") + " €";
}

function groupByPerson(items) {
  const map = new Map();
  for (const item of items) {
    const key   = item.author?.id || item.creatorId || "unbekannt";
    const name  = item.author?.name || "Unbekannte Person";
    const avatar= item.author?.avatar || null;
    if (!map.has(key)) map.set(key, { key, name, avatar, items: [] });
    map.get(key).items.push(item);
  }
  return Array.from(map.values());
}

// ── Floating Bowl Button ─────────────────────────────────────────
export function WerkeKorbButton({ count, onOpen, glowing }) {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (glowing) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 800);
      return () => clearTimeout(t);
    }
  }, [glowing]);

  return (
    <button
      onClick={onOpen}
      aria-label="Werkekorb öffnen"
      style={{
        position:        "fixed",
        bottom:          "calc(66px + max(14px, env(safe-area-inset-bottom, 14px)) + 20px)",
        right:           18,
        zIndex:          9500,
        width:           52,
        height:          52,
        borderRadius:    "50%",
        background:      "rgba(250,247,242,0.92)",
        backdropFilter:  "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        border:          "1.5px solid rgba(13,196,181,0.18)",
        boxShadow:       pulse
          ? "0 0 0 8px rgba(13,196,181,0.18), 0 4px 20px rgba(20,20,34,0.12)"
          : "0 4px 20px rgba(20,20,34,0.10)",
        display:         "flex",
        alignItems:      "center",
        justifyContent:  "center",
        cursor:          "pointer",
        transition:      "box-shadow 400ms ease, transform 200ms ease",
        transform:       pulse ? "scale(1.08)" : "scale(1)",
        userSelect:      "none",
        WebkitTapHighlightColor: "transparent",
        outline:         "none",
        padding:         0,
      }}
    >
      {/* Schale */}
      <span style={{ fontSize: 26, lineHeight: 1, opacity: count > 0 ? 1 : 0.45 }}>
        🏺
      </span>

      {/* Teal-Punkt wenn gefüllt */}
      {count > 0 && (
        <span style={{
          position:   "absolute",
          top:        7,
          right:      7,
          width:      count > 9 ? "auto" : 16,
          height:     16,
          minWidth:   16,
          padding:    count > 9 ? "0 4px" : 0,
          borderRadius: 99,
          background: TEAL,
          color:      "#fff",
          fontSize:   10,
          fontWeight: 700,
          display:    "flex",
          alignItems: "center",
          justifyContent: "center",
          lineHeight: 1,
          boxShadow:  "0 1px 4px rgba(13,196,181,0.35)",
        }}>
          {count > 0 ? count : ""}
        </span>
      )}
    </button>
  );
}

// ── Korb-Karte ───────────────────────────────────────────────────
function KorbKarte({ item, onRemove, idx }) {
  const meta    = TYPE_META[item.type] || TYPE_META.moment;
  const price   = formatPrice(item._raw?.price ?? item.price);
  const thumb   = item._raw?.cover_url || item.cover_url || item.img || null;
  const title   = item.title || item._raw?.title || item.name || "Ohne Titel";

  return (
    <div
      style={{
        display:       "flex",
        gap:           12,
        padding:       "14px 0",
        borderBottom:  "1px solid rgba(20,20,34,0.07)",
        animation:     `huiKorbSlideIn 320ms ${idx * 60}ms both cubic-bezier(0.22,1,0.36,1)`,
      }}
    >
      {/* Thumbnail */}
      <div style={{
        width:        52,
        height:       52,
        borderRadius: 12,
        overflow:     "hidden",
        flexShrink:   0,
        background:   `linear-gradient(135deg, ${meta.accent}22, ${meta.accent}44)`,
        display:      "flex",
        alignItems:   "center",
        justifyContent: "center",
      }}>
        {thumb
          ? <img src={thumb} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
          : <span style={{ fontSize: 22, opacity: 0.7 }}>{meta.icon}</span>
        }
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display:    "flex",
          alignItems: "center",
          gap:        6,
          marginBottom: 2,
        }}>
          <span style={{
            fontSize:    10,
            fontWeight:  700,
            color:       meta.accent,
            letterSpacing: 0.5,
            textTransform: "uppercase",
          }}>
            {meta.label}
          </span>
        </div>
        <div style={{
          fontSize:   14,
          fontWeight: 600,
          color:      INK,
          lineHeight: 1.3,
          overflow:   "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          maxWidth:   "100%",
        }}>
          {title}
        </div>
        {price && (
          <div style={{
            fontSize:   13,
            color:      "#666",
            marginTop:  2,
            fontVariantNumeric: "tabular-nums",
          }}>
            {price}
          </div>
        )}
      </div>

      {/* Entfernen */}
      <button
        onClick={() => onRemove(item)}
        aria-label="Entfernen"
        style={{
          width:       32,
          height:      32,
          borderRadius: "50%",
          border:      "none",
          background:  "rgba(20,20,34,0.05)",
          color:       "#999",
          fontSize:    16,
          display:     "flex",
          alignItems:  "center",
          justifyContent: "center",
          cursor:      "pointer",
          flexShrink:  0,
          alignSelf:   "center",
          transition:  "background 200ms",
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

// ── Personen-Gruppe ───────────────────────────────────────────────
function PersonGruppe({ group, onRemove }) {
  return (
    <div style={{ marginBottom: 8 }}>
      {/* Personen-Header */}
      <div style={{
        display:     "flex",
        alignItems:  "center",
        gap:         10,
        paddingTop:  16,
        paddingBottom: 4,
      }}>
        {group.avatar
          ? <img src={group.avatar} alt="" style={{
              width: 28, height: 28, borderRadius: "50%", objectFit: "cover",
              flexShrink: 0,
            }} />
          : <div style={{
              width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
              background: "linear-gradient(135deg, #0DC4B522, #F4735522)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 700, color: TEAL,
            }}>
              {group.name.charAt(0).toUpperCase()}
            </div>
        }
        <span style={{
          fontSize:   13,
          fontWeight: 700,
          color:      INK,
          letterSpacing: -0.2,
        }}>
          {group.name}
        </span>
        <span style={{
          fontSize:  11,
          color:     "#aaa",
          marginLeft: "auto",
        }}>
          {group.items.length} {group.items.length === 1 ? "Auswahl" : "Auswahlen"}
        </span>
      </div>

      {/* Karten */}
      {group.items.map((item, idx) => (
        <KorbKarte key={item.id || idx} item={item} onRemove={onRemove} idx={idx} />
      ))}
    </div>
  );
}

// ── Leerer Zustand ────────────────────────────────────────────────
function LeererKorb({ onDiscover, onClose }) {
  return (
    <div style={{
      display:        "flex",
      flexDirection:  "column",
      alignItems:     "center",
      justifyContent: "center",
      padding:        "48px 32px",
      textAlign:      "center",
      gap:            16,
    }}>
      <div style={{ fontSize: 64, opacity: 0.35, lineHeight: 1 }}>🏺</div>
      <div>
        <div style={{
          fontSize:   18,
          fontWeight: 700,
          color:      INK,
          marginBottom: 8,
          letterSpacing: -0.4,
          lineHeight: 1.3,
        }}>
          Dein Werkekorb ist noch<br/>ein leerer Raum.
        </div>
        <div style={{
          fontSize:   14,
          color:      "#888",
          lineHeight: 1.6,
          maxWidth:   260,
          margin:     "0 auto",
        }}>
          Hier sammelst du Werke, Erlebnisse und Projekte von Menschen, die dich berühren.
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginTop: 8 }}>
        <button onClick={onDiscover} style={{
          padding:      "11px 22px",
          borderRadius: 99,
          border:       "none",
          background:   `linear-gradient(135deg, ${TEAL}, #16D7C5)`,
          color:        "#fff",
          fontWeight:   700,
          fontSize:     14,
          cursor:       "pointer",
          outline:      "none",
          WebkitTapHighlightColor: "transparent",
          boxShadow:    "0 4px 14px rgba(13,196,181,0.28)",
        }}>
          Entdecken
        </button>
        <button onClick={onClose} style={{
          padding:      "11px 22px",
          borderRadius: 99,
          border:       "1.5px solid rgba(20,20,34,0.12)",
          background:   "transparent",
          color:        INK,
          fontWeight:   600,
          fontSize:     14,
          cursor:       "pointer",
          outline:      "none",
          WebkitTapHighlightColor: "transparent",
        }}>
          Deinen Raum öffnen
        </button>
      </div>
    </div>
  );
}

// ── Erfolgs-Screen ────────────────────────────────────────────────
function ErfolgsScreen({ result, onChat, onDiscover }) {
  const { count, creators } = result;
  return (
    <div style={{
      display:        "flex",
      flexDirection:  "column",
      alignItems:     "center",
      textAlign:      "center",
      padding:        "48px 24px 32px",
      gap:            16,
    }}>
      <div style={{ fontSize: 52, lineHeight: 1 }}>✦</div>
      <div>
        <div style={{
          fontSize:   20,
          fontWeight: 800,
          color:      INK,
          marginBottom: 10,
          letterSpacing: -0.5,
        }}>
          Unterstützung angekommen.
        </div>
        <div style={{
          fontSize:   14,
          color:      "#666",
          lineHeight: 1.6,
          maxWidth:   280,
          margin:     "0 auto",
        }}>
          Du hast heute{" "}
          <strong>{count} {count === 1 ? "Auswahl" : "Auswahlen"}</strong>
          {creators > 0 && (
            <> von <strong>{creators} {creators === 1 ? "Person" : "Menschen"}</strong></>
          )}{" "}unterstützt.
        </div>
      </div>
      <div style={{
        fontSize:  12,
        color:     "#bbb",
        fontStyle: "italic",
        maxWidth:  240,
      }}>
        Die Verbindung zu Menschen entsteht niemals automatisch durch Unterstützung.
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginTop: 8 }}>
        {onChat && (
          <button onClick={onChat} style={{
            padding:      "11px 22px",
            borderRadius: 99,
            border:       "none",
            background:   `linear-gradient(135deg, ${TEAL}, #16D7C5)`,
            color:        "#fff",
            fontWeight:   700,
            fontSize:     14,
            cursor:       "pointer",
            outline:      "none",
            boxShadow:    "0 4px 14px rgba(13,196,181,0.28)",
            WebkitTapHighlightColor: "transparent",
          }}>
            Verbinden
          </button>
        )}
        <button onClick={onDiscover} style={{
          padding:      "11px 22px",
          borderRadius: 99,
          border:       "1.5px solid rgba(20,20,34,0.12)",
          background:   "transparent",
          color:        INK,
          fontWeight:   600,
          fontSize:     14,
          cursor:       "pointer",
          outline:      "none",
          WebkitTapHighlightColor: "transparent",
        }}>
          Weiter entdecken
        </button>
      </div>
    </div>
  );
}

// ── Haupt-Komponente: WerkeKorb ──────────────────────────────────
export default function WerkeKorb({
  items = [],           // Array normalisierter FeedItems
  onClose,
  onRemove,
  onUnterstuetzen,      // async fn(items) → Promise
  onDiscover,
  onChat,               // optional: öffnet Chat mit erstem Creator
}) {
  const [phase,  setPhase]  = useState("list");  // list | loading | success
  const [result, setResult] = useState(null);
  const sheetRef = useRef(null);

  const groups   = groupByPerson(items);
  const total    = items.reduce((s, item) => {
    const raw = item._raw?.price ?? item.price ?? 0;
    const n   = typeof raw === "string"
      ? parseFloat(raw.replace(/[^0-9.,]/g, "").replace(",", "."))
      : Number(raw);
    return s + (isNaN(n) ? 0 : n);
  }, 0);
  const impact   = Math.max(0, +(total * 0.07).toFixed(2));
  const gesamt   = +(total + impact).toFixed(2);
  const pCount   = groups.length;
  const iCount   = items.length;

  async function handleUnterstuetzen() {
    if (!onUnterstuetzen || items.length === 0) return;
    setPhase("loading");
    try {
      await onUnterstuetzen(items);
      setResult({ count: iCount, creators: pCount });
      setPhase("success");
    } catch (err) {
      console.error("[WerkeKorb] Unterstützung fehlgeschlagen:", err);
      setPhase("list");
    }
  }

  // Schließen bei Backdrop-Klick
  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onClose?.();
  }

  return (
    <>
      <style>{`
        @keyframes huiKorbSlideIn {
          from { opacity:0; transform:translateY(10px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes huiSheetUp {
          from { transform:translateY(100%); opacity:0.6; }
          to   { transform:translateY(0);    opacity:1; }
        }
        @keyframes huiFadeIn {
          from { opacity:0; }
          to   { opacity:1; }
        }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={handleBackdropClick}
        style={{
          position:   "fixed",
          inset:      0,
          zIndex:     9800,
          background: "rgba(20,20,34,0.38)",
          backdropFilter: "blur(3px)",
          WebkitBackdropFilter: "blur(3px)",
          animation:  "huiFadeIn 320ms ease",
        }}
      />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        style={{
          position:     "fixed",
          left:         0,
          right:        0,
          bottom:       0,
          zIndex:       9900,
          background:   CREAM,
          borderRadius: "24px 24px 0 0",
          boxShadow:    "0 -8px 48px rgba(20,20,34,0.14)",
          maxHeight:    "86vh",
          display:      "flex",
          flexDirection:"column",
          animation:    "huiSheetUp 320ms cubic-bezier(0.22,1,0.36,1)",
          paddingBottom:"max(20px, env(safe-area-inset-bottom, 20px))",
          overflow:     "hidden",
        }}
      >
        {/* Handle */}
        <div style={{
          width:        40,
          height:       4,
          borderRadius: 99,
          background:   "rgba(20,20,34,0.12)",
          margin:       "12px auto 0",
          flexShrink:   0,
        }} />

        {/* Header */}
        <div style={{
          padding:        "16px 20px 0",
          flexShrink:     0,
          display:        "flex",
          alignItems:     "flex-start",
          justifyContent: "space-between",
        }}>
          <div>
            <div style={{
              fontSize:    20,
              fontWeight:  800,
              color:       INK,
              letterSpacing: -0.5,
              lineHeight:  1.2,
            }}>
              Dein Werkekorb
            </div>
            {iCount > 0 && (
              <div style={{
                fontSize: 13,
                color:    "#888",
                marginTop: 3,
              }}>
                {iCount} {iCount === 1 ? "Auswahl" : "Auswahlen"}
                {pCount > 0 && ` · ${pCount} ${pCount === 1 ? "Mensch" : "Menschen"}`}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Schließen"
            style={{
              width:       36,
              height:      36,
              borderRadius:"50%",
              border:      "none",
              background:  "rgba(20,20,34,0.06)",
              color:       "#888",
              fontSize:    18,
              display:     "flex",
              alignItems:  "center",
              justifyContent: "center",
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

        {/* Content — scrollbar */}
        <div style={{
          flex:       1,
          overflowY:  "auto",
          padding:    "0 20px",
          WebkitOverflowScrolling: "touch",
        }}>
          {phase === "success" && result ? (
            <ErfolgsScreen
              result={result}
              onChat={onChat}
              onDiscover={() => { onDiscover?.(); onClose?.(); }}
            />
          ) : items.length === 0 ? (
            <LeererKorb
              onDiscover={() => { onDiscover?.(); onClose?.(); }}
              onClose={onClose}
            />
          ) : (
            groups.map(group => (
              <PersonGruppe
                key={group.key}
                group={group}
                onRemove={onRemove}
              />
            ))
          )}
        </div>

        {/* Sticky Footer — nur wenn Inhalt vorhanden und nicht Erfolg */}
        {items.length > 0 && phase !== "success" && (
          <div style={{
            padding:    "16px 20px 0",
            borderTop:  "1px solid rgba(20,20,34,0.07)",
            flexShrink: 0,
          }}>
            {/* Summen */}
            <div style={{ display:"flex", flexDirection:"column", gap: 6, marginBottom: 14 }}>
              {total > 0 && (
                <>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize: 13, color: "#888" }}>
                    <span>Zwischensumme</span>
                    <span style={{ fontVariantNumeric:"tabular-nums" }}>
                      {total.toFixed(2).replace(".", ",")} €
                    </span>
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize: 13, color: "#888" }}>
                    <span>Impact-Beitrag <span style={{ fontSize:11, color: TEAL }}>+7 %</span></span>
                    <span style={{ fontVariantNumeric:"tabular-nums", color: TEAL }}>
                      +{impact.toFixed(2).replace(".", ",")} €
                    </span>
                  </div>
                  <div style={{
                    display:       "flex",
                    justifyContent:"space-between",
                    fontSize:      16,
                    fontWeight:    700,
                    color:         INK,
                    paddingTop:    6,
                    borderTop:     "1px solid rgba(20,20,34,0.07)",
                  }}>
                    <span>Gesamt</span>
                    <span style={{ fontVariantNumeric:"tabular-nums" }}>
                      {gesamt.toFixed(2).replace(".", ",")} €
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* CTA */}
            <button
              onClick={handleUnterstuetzen}
              disabled={phase === "loading"}
              style={{
                width:        "100%",
                padding:      "15px 0",
                borderRadius: 16,
                border:       "none",
                background:   phase === "loading"
                  ? "rgba(20,20,34,0.08)"
                  : `linear-gradient(135deg, ${TEAL} 0%, #16D7C5 60%, ${CORAL} 140%)`,
                color:        phase === "loading" ? "#aaa" : "#fff",
                fontWeight:   800,
                fontSize:     16,
                letterSpacing:-.3,
                cursor:       phase === "loading" ? "default" : "pointer",
                outline:      "none",
                boxShadow:    phase === "loading"
                  ? "none"
                  : "0 6px 24px rgba(13,196,181,0.32)",
                transition:   "all 280ms ease",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              {phase === "loading" ? "Einen Moment …" : "Jetzt unterstützen"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
