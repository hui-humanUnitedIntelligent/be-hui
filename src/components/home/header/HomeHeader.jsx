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
import MoodSheet          from "../mood/MoodSheet.jsx";
import { useHuiActions, A } from "../../../core/hui.actions.js";
import { S } from "../../../core/hui.sources.js";

export default function HomeHeader({
  activeMood,
  onMoodSelect,
  notifCount  = 0,
  msgCount    = 0,
  onNotif,
  onChat,
  currentUser,
  // Search Experience 2.0 (2026-07-06, Lars) -- Suchstatus wird durchgereicht
  // an den Elternkontext (Home.jsx), der ihn an UnifiedFeed weitergibt.
  onSearchStateChange,
}) {
  const [showMood, setShowMood] = React.useState(false);
  const actions = useHuiActions();

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
        background:"rgba(255,251,248,0.93)",
        backdropFilter:"blur(32px) saturate(1.7)",
        WebkitBackdropFilter:"blur(32px) saturate(1.7)",
        borderBottom: has
          ? `1px solid ${mc}28`
          : "1px solid rgba(0,0,0,0.045)",
        transition:"border-color 0.35s ease",
        touchAction:"manipulation",
      }}>
        <div style={{ height:"env(safe-area-inset-top,0)" }}/>

        <div style={{
          display:"flex", alignItems:"center",
          padding:"8px 12px", gap:8,
          touchAction:"manipulation",
        }}>
          {/* Command Center — nimmt flex:1 ein */}
          <SearchCommandCenter
            activeMood={activeMood}
            currentUser={currentUser}
            onSearchStateChange={onSearchStateChange}
          />

          <MoodOrbButton
            activeMood={activeMood}
            isOpen={showMood}
            onToggle={() => setShowMood(p => !p)}
          />

          <NotificationButton count={notifCount} onPress={onNotif}/>

          <MessageButton count={msgCount} onPress={handleChat}/>
        </div>

        {has && (
          <div style={{
            height:1.5,
            background:`linear-gradient(90deg,transparent,${mc}55,transparent)`,
            transition:"background 0.4s ease",
          }}/>
        )}
      </div>

      {showMood && (
        <MoodSheet
          activeMood={activeMood}
          onSelect={(m) => { onMoodSelect?.(m); setShowMood(false); }}
          onClose={() => setShowMood(false)}
        />
      )}
    </>
  );
}
