import React from "react";

export function TabOpenFallback({ label }) {
  return (
    <div style={{
      padding: "40px 20px", textAlign: "center", opacity: 0.6, fontSize: 13,
      color: "rgba(20,20,34,0.40)", animation: "huiFadeIn 0.5s ease",
    }}>
      {label}
    </div>
  );
}

export function FullScreenSpinnerFallback() {
  return (
    <div style={{
      position: 'fixed', inset: 0, display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: 'rgba(249,247,244,0.85)', zIndex: 10500,
      backdropFilter: 'blur(6px)',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        border: '3px solid rgba(22,215,197,0.2)',
        borderTopColor: '#16D7C5',
        animation: 'hui-spin 0.7s linear infinite',
      }}/>
      <style>{'@keyframes hui-spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  );
}
