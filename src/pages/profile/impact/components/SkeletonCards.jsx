import React from "react";
import { T } from "../tokens.js";

export function SkeletonCards({ count = 2 }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      {Array.from({ length:count }).map((_,i) => (
        <div key={i} style={{ height:200, borderRadius:22,
          background:"linear-gradient(90deg,#EDE9E0 25%,#F5F0E8 50%,#EDE9E0 75%)",
          backgroundSize:"200% 100%",
          animation:"ipFade 1.5s ease-in-out infinite" }}/>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// EXPORT
// ════════════════════════════════════════════════════════════════
