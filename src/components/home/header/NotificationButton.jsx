// header/NotificationButton.jsx — Phase 4B: Real Notifications
import React, { useState } from "react";
import { useNotifications, NotificationInbox, NotificationBadge } from "../../../lib/useNotifications.jsx";

export default function NotificationButton({ onPress }) {
  const { unread } = useNotifications();
  const [showInbox, setShowInbox] = useState(false);
  const [pressed,   setPressed]   = useState(false);
  const btnRef = React.useRef(null);

  function handlePress() {
    setShowInbox(prev => !prev);
    onPress?.();
  }

  const anchorRect = btnRef.current?.getBoundingClientRect?.() || null;

  return (
    <>
      <button
        ref={btnRef}
        onClick={handlePress}
        aria-label="Meldungen"
        style={{
          flexShrink:0, width:36, height:36, borderRadius:"50%",
          background:"rgba(255,255,255,0.80)",
          backdropFilter:"blur(14px)", WebkitBackdropFilter:"blur(14px)",
          border:"1.5px solid rgba(22,215,197,0.18)",
          boxShadow:"0 1px 8px rgba(0,0,0,0.06), 0 0 0 2.5px rgba(22,215,197,0.06)",
          display:"flex", alignItems:"center", justifyContent:"center",
          cursor:"pointer", position:"relative",
          WebkitTapHighlightColor:"transparent",
          transform: pressed ? "scale(0.93) translateY(0.5px)" : "scale(1)",
          transition:"transform 0.22s ease",
        }}
        onTouchStart={() => setPressed(true)}
        onTouchEnd={() => setPressed(false)}
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
      >
        <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
          <path d="M9 2 C6.2 2 4.5 4.2 4.5 6.5 L4.5 10 L3 11.5 L15 11.5 L13.5 10 L13.5 6.5 C13.5 4.2 11.8 2 9 2Z"
            fill="rgba(22,215,197,0.10)" stroke="#16D7C5" strokeWidth="1.35" strokeLinejoin="round"/>
          <path d="M7.2 12 Q7.6 13.5 9 13.5 Q10.4 13.5 10.8 12"
            stroke="#16D7C5" strokeWidth="1.25" strokeLinecap="round"/>
          <path d="M6.5 3 Q9 1.5 11.5 3"
            stroke="#FF8A6B" strokeWidth="1" strokeLinecap="round" opacity="0.55"/>
        </svg>
        <NotificationBadge count={unread} />
      </button>

      {showInbox && (
        <NotificationInbox
          anchorRect={anchorRect}
          onClose={() => setShowInbox(false)}
        />
      )}
    </>
  );
}
