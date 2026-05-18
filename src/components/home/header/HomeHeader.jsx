// header/HomeHeader.jsx — HUI Match Header (Orchestrator)
// Sticky Header: MatchBar + MoodOrb + Notif + Chat
// Keine Business-Logik — nur Komposition der Header-Teile

import React from "react";
import MatchBar           from "./MatchBar.jsx";
import MoodOrbButton      from "./MoodOrbButton.jsx";
import NotificationButton from "./NotificationButton.jsx";
import MessageButton      from "./MessageButton.jsx";
import MoodSheet          from "../mood/MoodSheet.jsx";

export default function HomeHeader({
  activeMood,
  onMoodSelect,
  notifCount  = 0,
  msgCount    = 0,
  onNotif,
  onChat,
}) {
  const [showMood,  setShowMood]  = React.useState(false);
  const [matchVal,  setMatchVal]  = React.useState("");

  const mc  = activeMood?.color || "#16D7C5";
  const has = !!activeMood;

  return (
    <>
      {/* ── Sticky Bar ─────────────────────────────────────── */}
      <div style={{
        position:"sticky", top:0, zIndex:60,
        background:"rgba(255,251,248,0.93)",
        backdropFilter:"blur(32px) saturate(1.7)",
        WebkitBackdropFilter:"blur(32px) saturate(1.7)",
        borderBottom: has
          ? `1px solid ${mc}28`
          : "1px solid rgba(0,0,0,0.045)",
        transition:"border-color 0.35s ease",
      }}>
        <div style={{ height:"env(safe-area-inset-top,0)" }}/>

        <div style={{
          display:"flex", alignItems:"center",
          padding:"8px 12px", gap:8,
        }}>
          <MatchBar
            activeMood={activeMood}
            value={matchVal}
            onChange={setMatchVal}
          />

          <MoodOrbButton
            activeMood={activeMood}
            isOpen={showMood}
            onToggle={() => setShowMood(p => !p)}
          />

          <NotificationButton count={notifCount} onPress={onNotif}/>

          <MessageButton count={msgCount} onPress={onChat}/>
        </div>

        {/* Mood-Akzentlinie */}
        {has && (
          <div style={{
            height:1.5,
            background:`linear-gradient(90deg,transparent,${mc}55,transparent)`,
            transition:"background 0.4s ease",
          }}/>
        )}
      </div>

      {/* Mood Panel */}
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
