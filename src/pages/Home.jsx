import React, { useState } from "react";

export default function App() {
  const [count, setCount] = useState(0);
  return (
    <div style={{ padding: 20, fontFamily: "sans-serif", maxWidth: 430, margin: "0 auto" }}>
      <h1 style={{ color: "#FF6B5B" }}>🌟 HUI Test</h1>
      <p>Die App läuft! Counter: {count}</p>
      <button 
        onClick={() => setCount(c => c + 1)}
        style={{ background: "#2ABFAC", color: "white", border: "none", padding: "10px 20px", borderRadius: 10, fontSize: 16, cursor: "pointer" }}
      >
        Klick mich
      </button>
    </div>
  );
}
