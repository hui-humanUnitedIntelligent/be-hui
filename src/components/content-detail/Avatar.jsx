import React from "react";

export default function Avatar({ url, name, size = 40 }) {
  const initials = (name || "?").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          border: "2px solid white",
          boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
          flexShrink: 0,
        }}
      />
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "linear-gradient(135deg,#16D7C5,#FF8A6B)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.34,
        fontWeight: 900,
        color: "white",
        border: "2px solid white",
        boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
        flexShrink: 0,
        letterSpacing: -0.5,
      }}
    >
      {initials}
    </div>
  );
}
