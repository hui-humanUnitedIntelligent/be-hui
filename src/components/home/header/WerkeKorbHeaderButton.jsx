// header/WerkeKorbHeaderButton.jsx — Werke-Korb Header-Icon
// KORB-HEADER-MOVE (2026-08-18, Michael-Request): Werke-Korb wandert vom
// schwebenden Floating-Button (unten rechts über der TabBar) in den Header,
// permanent sichtbar neben Resonanzzentrum (Glocke) + Chat. Gleiche 36px-
// Kreis-Optik wie NotificationButton/MessageButton — drei Symbole nebeneinander.
// Badge: EXAKT derselbe rote Punkt wie MeinBereichTile (#EF4444, 2px weißer
// Rand, 11px) statt des bisherigen Teal-Punkts — auf Michaels ausdrücklichen
// Wunsch ("der selbe rote Punkt wie bei 'mein Bereich'").
// Additiv: WerkeKorbButton (Floating-Variante) bleibt als Komponente
// unverändert im Repo bestehen, wird nur nicht mehr in Home.jsx gerendert.
import React from "react";
import { SchalenIcon } from "../../commerce/WerkeKorb.jsx";

export default function WerkeKorbHeaderButton({ count = 0, onOpen = () => {} }) {
  const [pressed, setPressed] = React.useState(false);

  function handleTouchEnd(e) {
    e.preventDefault();
    setPressed(false);
    onOpen?.();
  }

  return (
    <button
      onClick={() => onOpen?.()}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={handleTouchEnd}
      aria-label={count > 0 ? "Werkekorb öffnen — neues Item" : "Werkekorb öffnen"}
      data-tutorial="nav-cart"
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
      {/* GRÖSSE+FARBE-FIX (2026-08-18, Michael-Request): "auch im grün" +
          "Symbol etwas größer, damit es symbolisch gleich groß ist wie die
          anderen beiden" — filled=true permanent (immer Teal-Stroke, wie
          Glocke/Chat, unabhängig vom Korb-Status) statt vorher nur bei
          count>0. size 16→22: SchalenIcon nutzt ein 32×32 viewBox in dem die
          Schale nur ca. die untere Hälfte füllt (vs. Glocke/Chat, die ihr
          18×18 viewBox zu ~65% ausfüllen) — bei identischer size wirkte der
          Korb dadurch kleiner, 22px gleicht das optisch an.
          VERTIKAL-ALIGN-FIX (2026-08-18, Michael-Request): Die Schale sitzt
          innerhalb ihres eigenen 32×32 viewBox weiter unten (Rand+Deckel oben
          nehmen Leerraum, die Schüssel selbst liegt in der unteren Hälfte) —
          dadurch wirkte sie beim reinen Zentrieren (alignItems/justifyContent
          center) tiefer als Glocke/Chat auf derselben horizontalen Ebene.
          Fix: nur hier (lokaler Wrapper, NICHT die geteilte SchalenIcon-
          Komponente selbst) 3px nach oben versetzt, damit alle drei
          Header-Icons optisch auf einer Linie liegen. */}
      <div style={{ transform: "translateY(-3px)" }}>
        <SchalenIcon size={22} opacity={1} filled={true} />
      </div>

      {/* MEIN-BEREICH-UPDATE-DOT-Stil (siehe MyBasisProfile.jsx MeinBereichTile) —
          derselbe rote Punkt, keine Zahl, rein binäres "hat neues Item" Signal. */}
      {count > 0 && (
        <span style={{
          position:"absolute", top:-2, right:-2,
          width:11, height:11, borderRadius:"50%",
          background:"#EF4444", border:"2px solid #FFFFFF",
          boxShadow:"0 1px 3px rgba(239,68,68,0.45)",
        }} aria-hidden="true"/>
      )}
    </button>
  );
}
