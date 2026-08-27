// header/LangGlobeButton.jsx — Globus-Icon rechts neben dem Suchfeld
// SPRACHAUSWAHL-HEADER (2026-08-27, Michael-Request): Globus-Button öffnet
// ein Dropdown zur schnellen Sprachumschaltung, ohne erst ins Einstellungs-
// Modal wechseln zu müssen. Gleiche 36px-Kreis-Optik + 22px-Icon-Größe wie
// WerkeKorbHeaderButton/NotificationButton/MessageButton (Michael: "die
// Grösse des Icons gleich wie Werkekorb").
//
// Portal + zIndex 10500 (HUI-Standard für alle Portal-Elemente) — verhindert
// dass das Dropdown hinter der BottomNav (zIndex 10000) oder in einem
// Ancestor-Stacking-Context (filter/opacity/eigener z-index) gefangen wird.
// Click-Catcher-Overlay bei 10499 (knapp darunter) schließt das Dropdown bei
// Klick daneben.
import React, { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { HUIGlobeIcon } from "../../../design/icons/HuiSystemIcons.jsx";
import { useTranslation } from "../../../hooks/useTranslation.js";
import { SUPPORTED_LANGS, LANG_LABELS, LANG_FLAGS } from "../../../i18n/index.js";

export default function LangGlobeButton() {
  const { lang, changeLang } = useTranslation();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const btnRef = useRef(null);
  const [pressed, setPressed] = useState(false);

  // Position relativ zum Button neu berechnen -- Dropdown ist fixed
  // positioniert (Portal auf document.body), damit KEIN Ancestor-Overflow
  // oder Stacking-Context das Dropdown clippen/verstecken kann.
  useEffect(() => {
    if (!open) return;
    function updatePos() {
      const r = btnRef.current?.getBoundingClientRect();
      if (r) setPos({ top: r.bottom + 8, right: Math.max(8, window.innerWidth - r.right) });
    }
    updatePos();
    window.addEventListener("resize", updatePos);
    window.addEventListener("scroll", updatePos, true);
    return () => {
      window.removeEventListener("resize", updatePos);
      window.removeEventListener("scroll", updatePos, true);
    };
  }, [open]);

  function handleSelect(l) {
    changeLang(l);
    setOpen(false);
  }

  function handleTouchEnd(e) {
    e.preventDefault();
    setPressed(false);
    setOpen(o => !o);
  }

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => setOpen(o => !o)}
        onTouchStart={() => setPressed(true)}
        onTouchEnd={handleTouchEnd}
        aria-label="Sprache wählen / Choose language"
        aria-expanded={open}
        style={{
          flexShrink:0, width:36, height:36, borderRadius:"50%",
          background:"rgba(255,255,255,0.80)",
          backdropFilter:"blur(14px)", WebkitBackdropFilter:"blur(14px)",
          border:"1.5px solid rgba(22,215,197,0.18)",
          boxShadow:"0 1px 8px rgba(0,0,0,0.06), 0 0 0 2.5px rgba(22,215,197,0.06)",
          display:"flex", alignItems:"center", justifyContent:"center",
          cursor:"pointer", position:"relative",
          WebkitTapHighlightColor:"transparent",
          touchAction:"manipulation",
          transform: pressed ? "scale(0.93) translateY(0.5px)" : "scale(1)",
          transition:"transform 0.22s ease",
          userSelect:"none", WebkitUserSelect:"none",
        }}
      >
        <HUIGlobeIcon size={22} style={{ opacity:0.82, color:"#0EC4B8" }} />
      </button>

      {open && createPortal(
        <>
          {/* Click-Catcher — schließt das Dropdown bei Klick daneben */}
          <div onClick={() => setOpen(false)} style={{ position:"fixed", inset:0, zIndex:10499 }} />
          <div style={{
            position:"fixed",
            top: pos?.top ?? 60, right: pos?.right ?? 12,
            zIndex:10500, minWidth:172, maxHeight:"60vh", overflowY:"auto",
            background:"#FDFBF8", borderRadius:16,
            boxShadow:"0 8px 32px rgba(0,0,0,0.18)",
            border:"1px solid rgba(26,26,24,0.08)",
            padding:6, WebkitOverflowScrolling:"touch",
            animation:"hui-lang-dd-in .16s cubic-bezier(.22,1,.36,1) both",
          }}>
            {SUPPORTED_LANGS.map(l => (
              <button
                key={l}
                onClick={() => handleSelect(l)}
                style={{
                  display:"flex", alignItems:"center", gap:10, width:"100%",
                  padding:"10px 12px", borderRadius:10, border:"none",
                  background: l === lang ? "rgba(14,196,184,0.12)" : "transparent",
                  cursor:"pointer", fontFamily:"Inter, sans-serif", touchAction:"manipulation",
                  WebkitTapHighlightColor:"transparent",
                }}>
                <span style={{ fontSize:17 }}>{LANG_FLAGS[l]}</span>
                <span style={{ flex:1, textAlign:"left", fontSize:14, fontWeight: l===lang?700:500, color:"#1A1A18" }}>
                  {LANG_LABELS[l]}
                </span>
                {l === lang && <span style={{ color:"#0EC4B8", fontSize:14, fontWeight:700 }}>✓</span>}
              </button>
            ))}
          </div>
          <style>{`
            @keyframes hui-lang-dd-in {
              from { opacity:0; transform:translateY(-4px); }
              to   { opacity:1; transform:translateY(0); }
            }
          `}</style>
        </>,
        document.body
      )}
    </>
  );
}
