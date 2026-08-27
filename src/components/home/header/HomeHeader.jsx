// header/HomeHeader.jsx — HUI Command Center Header
// SearchCommandCenter ist die EINZIGE Suchleiste im gesamten Home-Bereich
// (Single Source of Truth). Das fruehere MatchBar.jsx wurde bereits vor
// dieser Umstellung ersetzt und war zuletzt komplett unreferenziert (0
// Importe) -- am 2026-07-06 endgueltig aus dem Repo entfernt (Debug-Runde
// 'zwei Suchleisten', Lars).

import React from "react";
import SearchCommandCenter from "./SearchCommandCenter.jsx";
import MoodOrbButton      from "./MoodOrbButton.jsx";
import NotificationButton from "./NotificationButton.jsx";
import MessageButton      from "./MessageButton.jsx";
import WerkeKorbHeaderButton from "./WerkeKorbHeaderButton.jsx"; // KORB-HEADER-MOVE 2026-08-18
import MoodSheet          from "../mood/MoodSheet.jsx";
import { useHuiActions, A } from "../../../core/hui.actions.js";
import { S } from "../../../core/hui.sources.js";
import { useTranslation } from "../../../hooks/useTranslation.js";
import LangGlobeButton from "./LangGlobeButton.jsx";

export default function HomeHeader({
  activeMood,
  onMoodSelect,
  notifCount  = 0,
  msgCount    = 0,
  korbCount   = 0,
  onNotif,
  onChat,
  onOpenKorb  = () => {},
  currentUser,
  // Search Experience 2.0 (2026-07-06, Lars) -- Suchstatus wird durchgereicht
  // an den Elternkontext (Home.jsx), der ihn an UnifiedFeed weitergibt.
  onSearchStateChange,
}) {
  const [showMood, setShowMood] = React.useState(false);
  const actions = useHuiActions();
  const { t } = useTranslation();

  const mc  = activeMood?.color || "#16D7C5";
  const has = !!activeMood;

  function handleChat() {
    actions[A.OPEN_CHAT]?.({ source: S.HOME }) || onChat?.();
  }

  return (
    <>
      {/* ── Sticky Bar ─────────────────────────────────────── */}
      <div style={{
        position:"sticky", top:0, zIndex:60,
        WebkitTransform:"translateZ(0)", transform:"translateZ(0)",
        // CREME-BALKEN-FIX (2026-08-18): background war rgba(255,251,248,0.93) —
        // sichtbar HELLER/WEISSER als der App-Hintergrund C.cream (#F9F7F4, Home.jsx).
        // Dieser Ton-Unterschied erzeugte einen sichtbaren "Balken" oben (Header
        // sitzt optisch als eigenes helleres Rechteck über dem Cream-Canvas), von
        // Michael per Screenshot markiert. Fix: exakt auf #F9F7F4 (denselben Wert
        // wie der Seiten-Hintergrund) umgestellt — Header verschmilzt jetzt nahtlos
        // mit dem Canvas, kein Zweiton-Effekt mehr.
        background:"rgba(249,247,244,0.93)",
        backdropFilter:"blur(32px) saturate(1.7)",
        WebkitBackdropFilter:"blur(32px) saturate(1.7)",
        // Visual Polish Pass Punkt 7: keine harte Kante mehr zwischen Header
        // und Feed -- extrem feiner Divider statt sichtbarer Linie.
        borderBottom: has
          ? `1px solid ${mc}1C`
          : "1px solid rgba(26,53,48,0.028)",
        transition:"border-color 0.35s ease",
        touchAction:"manipulation",
      }}>
        <div style={{ height:"max(var(--hui-safe-top, 0px), env(safe-area-inset-top, 0px))" }}/>


        <div style={{
          // ROOT-CAUSE-FIX (2026-07-06, Lars -- "Discovery-Panel rechts offen"):
          // SearchCommandCenter sass bisher als EIN flex:1-Kind neben den
          // Icon-Buttons (~135px breit) -- Bar UND Discovery-Panel waren
          // dadurch beide auf die schmalere Restbreite begrenzt, der Panel-
          // Hintergrund endete ~135px vor dem echten rechten Rand (sah
          // abgeschnitten/offen aus). Fix: flexWrap aktiviert, das Panel
          // (SearchCommandCenter liefert Bar + Panel jetzt als zwei separate
          // Flex-Items via display:contents) erhaelt flexBasis:100% -- CSS
          // erzwingt dadurch automatisch einen Zeilenumbruch NACH Bar+Icons,
          // das Panel bekommt exakt die volle Zeilenbreite. Keine Magic-
          // Number-Berechnung, reines Flex-Verhalten.
          display:"flex", flexWrap:"wrap", alignItems:"flex-start",
          padding:"8px 12px", gap:8,
          touchAction:"manipulation",
        }}>
          {/* Command Center -- liefert Bar (order:0, flex:1) und darunter EINE
              gemeinsame Zeile mit Radius-Anzeige links + Quick-Action-Gruppe
              rechts (order:1, flexBasis:100%), sowie das Discovery-Panel
              (order:99, flexBasis:100%) -- alles als flache Flex-Geschwister
              dieser Row (display:contents-Wrapper, siehe SearchCommandCenter.jsx).
              UX-Ticket 2026-07-06 "Quick-Action-Buttons rechts ausrichten":
              die drei Buttons sind jetzt ein durchgereichtes JSX-Buendel
              (quickActions-Prop) statt eines eigenen Geschwister-Flex-Items --
              Design/Verhalten der Buttons selbst unveraendert, nur die
              Positionierung liegt jetzt zentral bei SearchCommandCenter,
              gemeinsam mit der Radius-Zeile. */}
          <SearchCommandCenter
            activeMood={activeMood}
            currentUser={currentUser}
            onSearchStateChange={onSearchStateChange}
            quickActions={
              <>
                {/* GLOBUS — Sprachauswahl-Dropdown (2026-08-27, Michael-Request):
                    Globus-Icon rechts neben dem Suchfeld, gleiche 36px-Kreis-Optik
                    wie WerkeKorb/Glocke/Chat. Öffnet ein Hamburger-Dropdown zur
                    schnellen Sprachumschaltung. Das Suchfeld wird durch die
                    Icon-Breite automatisch schmaler (flex:1 verteilt den Rest). */}
                <LangGlobeButton/>
                {/* MOOD-ORB — 2026-08-12: Temporär ausgeblendet.
                    Mood-System existiert (moodConfig.js, MoodSheet.jsx, MoodOrbButton.jsx)
                    aber MOOD_FEED_HINTS sind noch nicht mit Feed-Logik verknüpft.
                    Wird re-aktiviert sobald die Feed-Priorisierung implementiert ist.
                    <MoodOrbButton
                      activeMood={activeMood}
                      isOpen={showMood}
                      onToggle={() => setShowMood(p => !p)}
                    />
                */}
                {/* KORB-HEADER-MOVE (2026-08-18): Werke-Korb jetzt permanent im
                    Header neben Resonanzzentrum + Chat — drei Symbole nebeneinander,
                    ersetzt den bisherigen Floating-Button unten rechts. */}
                <WerkeKorbHeaderButton count={korbCount} onOpen={onOpenKorb}/>
                <NotificationButton count={notifCount} userId={currentUser?.id || ""}/>
                <MessageButton count={msgCount} onPress={handleChat}/>
              </>
            }
          />
        </div>

        {has && (
          <div style={{
            height:1.5,
            background:`linear-gradient(90deg,transparent,${mc}55,transparent)`,
            transition:"background 0.4s ease",
          }}/>
        )}
      </div>

      {/* MOOD-SHEET — 2026-08-12: Temporär ausgeblendet (siehe MoodOrbButton-Kommentar oben).
          {showMood && (
            <MoodSheet
              activeMood={activeMood}
              onSelect={(m) => { onMoodSelect?.(m); setShowMood(false); }}
              onClose={() => setShowMood(false)}
            />
          )}
      */}
    </>
  );
}
