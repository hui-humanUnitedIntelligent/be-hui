import React from "react";
import { createPortal } from "react-dom";
export function MeinBereichDrawer({ title, icon, onClose, children, footer = true }) {
  return createPortal(
    <div
      onClick={onClose}
      style={{
        position:"fixed", inset:0, zIndex:10500,
        background:"rgba(26,26,24,0.55)",
        display:"flex", alignItems:"flex-end", justifyContent:"center",
        fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',sans-serif",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width:"100%", maxWidth:480,
          background:"#F7F5F0", borderRadius:"24px 24px 0 0",
          maxHeight:"90vh", display:"flex", flexDirection:"column",
          boxShadow:"0 -4px 32px rgba(26,26,24,0.20)",
        }}
      >
        {/* Handle */}
        <div style={{ display:"flex", justifyContent:"center", padding:"12px 0 4px", flexShrink:0 }}>
          <div style={{ width:36, height:4, borderRadius:99, background:"rgba(26,26,24,0.12)" }} />
        </div>
        {/* Header */}
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"8px 20px 14px", flexShrink:0,
          borderBottom:"1px solid rgba(26,26,24,0.08)",
        }}>
          <div style={{ fontSize:17, fontWeight:800, color:"#1A1A18", letterSpacing:"-0.02em" }}>
            <span style={{display:"flex",alignItems:"center",gap:7,color:"rgba(14,196,184,0.9)"}}>{icon}</span>{title}
          </div>
          <button onClick={onClose} style={{
            background:"rgba(26,26,24,0.07)", border:"none", cursor:"pointer",
            borderRadius:"50%", width:32, height:32,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:16, color:"rgba(26,26,24,0.52)",
          }}>✕</button>
        </div>
        {/* Inhalt scrollbar */}
        <div style={{
          flex:1, overflowY:"auto", WebkitOverflowScrolling:"touch", willChange:"transform", overscrollBehavior:"contain",
          scrollbarWidth:"none", padding: footer ? undefined : "0 0 24px",
        }}>
          {children}
        </div>
        {/* Footer */}
        {footer && (
          <div style={{ padding:"12px 20px 36px", borderTop:"1px solid rgba(26,26,24,0.08)", flexShrink:0 }}>
            <button onClick={onClose} style={{
              width:"100%", padding:"13px", borderRadius:14, border:"none",
              cursor:"pointer", background:"rgba(26,26,24,0.08)",
              color:"rgba(26,26,24,0.52)", fontSize:14, fontWeight:700,
              fontFamily:"inherit", WebkitTapHighlightColor:"transparent",
            }}>Schließen</button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
