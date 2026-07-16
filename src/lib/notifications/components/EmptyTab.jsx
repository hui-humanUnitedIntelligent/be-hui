import React from "react";
import { T } from "../notificationTypes.js";
import { EMPTY_TAB_MESSAGES } from "../notificationHelpers.js";

export function EmptyTab({ tab }) {
  const m = EMPTY_TAB_MESSAGES[tab] || EMPTY_TAB_MESSAGES.alle;
  return (
    <div style={{
      display:"flex", flexDirection:"column", alignItems:"center",
      padding:"48px 24px", gap:14, textAlign:"center",
    }}>
      <div style={{
        width:64, height:64, borderRadius:20,
        background:`linear-gradient(135deg,rgba(22,215,197,0.12),rgba(255,138,107,0.08))`,
        display:"flex", alignItems:"center", justifyContent:"center", fontSize:28,
      }}>
        {m.icon}
      </div>
      <div style={{fontSize:13.5, color:T.inkSoft, lineHeight:1.6, maxWidth:240}}>
        {m.text}
      </div>
    </div>
  );
}
