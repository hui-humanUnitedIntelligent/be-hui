// mood/MoodSheet.jsx — HUI Mood Panel Overlay
// Floating Glassmorphism Panel — erscheint unter dem Header

import React from "react";
import MoodSelector from "./MoodSelector.jsx";

export default function MoodSheet({ activeMood, onSelect, onClose }) {
  const [vis, setVis] = React.useState(false);

  React.useEffect(() => {
    requestAnimationFrame(() => setVis(true));
  }, []);

  const close = () => {
    setVis(false);
    setTimeout(onClose, 210);
  };

  const handleSelect = (m) => {
    setVis(false);
    setTimeout(() => { onSelect(m); }, 160);
  };

  return (
    <div
      onClick={close}
      style={{
        position:"fixed", inset:0, zIndex:500,
        background: vis ? "rgba(0,0,0,0.16)" : "rgba(0,0,0,0)",
        backdropFilter: vis ? "blur(6px)" : "none",
        WebkitBackdropFilter: vis ? "blur(6px)" : "none",
        transition:"background 0.2s ease, backdrop-filter 0.2s ease",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position:"absolute",
          top:"calc(env(safe-area-inset-top,0px) + 58px)",
          left:12, right:12,
          background:"rgba(255,251,248,0.97)",
          backdropFilter:"blur(40px) saturate(1.9)",
          WebkitBackdropFilter:"blur(40px) saturate(1.9)",
          borderRadius:24,
          border:"1px solid rgba(22,215,197,0.16)",
          boxShadow:"0 20px 50px rgba(0,0,0,0.14), 0 0 0 1px rgba(255,255,255,0.9) inset",
          padding:"18px 16px 20px",
          transform: vis ? "translateY(0) scale(1)" : "translateY(-12px) scale(0.97)",
          opacity: vis ? 1 : 0,
          transition:"transform 0.24s cubic-bezier(0.34,1.4,0.64,1), opacity 0.2s ease",
        }}
      >
        <div style={{
          fontSize:11, fontWeight:700, letterSpacing:1.1,
          color:"rgba(30,30,30,0.38)", textTransform:"uppercase",
          marginBottom:14, textAlign:"center",
        }}>
          Deine Energie heute
        </div>

        <MoodSelector activeMood={activeMood} onSelect={handleSelect}/>

        {activeMood && (
          <button
            onClick={() => handleSelect(null)}
            style={{
              display:"block", margin:"14px auto 0",
              background:"none", border:"none", cursor:"pointer",
              fontSize:11.5, color:"rgba(80,80,80,0.45)", fontWeight:500,
              WebkitTapHighlightColor:"transparent",
            }}
          >
            Stimmung zurücksetzen
          </button>
        )}
      </div>
    </div>
  );
}
