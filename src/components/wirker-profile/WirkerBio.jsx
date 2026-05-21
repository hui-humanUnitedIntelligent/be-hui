// components/wirker-profile/WirkerBio.jsx
// Emotionale Bio-Sektion + Book CTA

import React from "react";

const C = {
  teal:"#16D7C5", teal2:"#11C5B7",
  ink:"#1A1A1A", cream:"#F9F7F4",
  muted:"rgba(80,80,80,0.62)",
};

export default function WirkerBio({ profile, onBook, bookable }) {
  const bio = profile?.bio
    || "Ich forme Erde, R\u00e4ume und Begegnungen.\nInspiriert von der Natur, getragen von Gemeinschaft.";

  return (
    <div style={{ padding:"0 20px 16px" }}>
      {/* Bio Text */}
      <p style={{
        margin:"0 0 16px",
        fontSize:14.5, lineHeight:1.65,
        color:"rgba(30,30,30,0.70)",
        fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif",
        whiteSpace:"pre-line",
      }}>{bio}</p>
    </div>
  );
}
