import React from "react";
import { C, CSS } from "./tokens.js";

function Skel({ w = "100%", h = 16, r = 8, mb = 0 }) {
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: r,
        background: "#EBEBEB",
        animation: "cdSkel 1.4s ease-in-out infinite",
        marginBottom: mb,
      }}
    />
  );
}

export default function ContentDetailSkeleton() {
  return (
    <div style={{ minHeight: "100vh", background: C.warm }}>
      <style>{CSS}</style>
      <div
        style={{
          width: "100%",
          height: "55vh",
          background: "linear-gradient(135deg,#e8e8e8,#f0f0f0)",
          animation: "cdSkel 1.4s ease-in-out infinite",
        }}
      />
      <div style={{ padding: "24px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
        <Skel h={10} w="40%" r={6} />
        <Skel h={28} w="85%" r={10} />
        <Skel h={20} w="30%" r={8} />
        <div style={{ height: 1, background: C.border, margin: "8px 0" }} />
        <Skel h={13} w="100%" r={6} />
        <Skel h={13} w="92%" r={6} />
        <Skel h={13} w="76%" r={6} />
      </div>
    </div>
  );
}
