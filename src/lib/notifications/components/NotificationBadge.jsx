import React from "react";

export function NotificationBadge({ count }) {
  if (!count || count < 1) return null;
  return (
    <div style={{
      position:"absolute", top:-4, right:-4,
      minWidth:17, height:17,
      background:"linear-gradient(135deg,#FF8A6B,#FF6B4A)",
      borderRadius:10,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:10, fontWeight:800, color:"#fff",
      border:"2px solid #fff", padding:"0 4px",
      lineHeight:1, pointerEvents:"none",
    }}>
      {count > 99 ? "99+" : count}
    </div>
  );
}
