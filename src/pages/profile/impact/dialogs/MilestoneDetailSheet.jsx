import React from "react";
import { T } from "../tokens.js";

export function MilestoneDetailSheet({ milestone, onClose }) {
  const m = milestone;
  const updates = m.impact_milestone_updates || [];
  const sortedUpdates = [...updates].sort((a, b) =>
    new Date(b.created_at || 0) - new Date(a.created_at || 0)
  );

  const statusConfig = {
    planned:      { label: '📅 Geplant',      color: '#898998', bg: 'rgba(137,137,152,0.12)' },
    in_progress:  { label: '🔄 In Arbeit',     color: '#0DC4B5', bg: 'rgba(13,196,181,0.12)' },
    completed:    { label: '✅ Abgeschlossen',  color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  };
  const sc = statusConfig[m.status] || statusConfig.planned;
  const plannedDate = m.planned_date || m.target_date || m.due_date || null;
  const fmtD = (iso) => iso
    ? new Date(iso).toLocaleDateString("de-DE", { day:"2-digit", month:"short", year:"numeric" })
    : "";

  const content = (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: "fixed", inset: 0, zIndex: 10590,
        background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)",
      }} />
      {/* Sheet */}
      <div onClick={e => e.stopPropagation()} style={{
        position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 10600,
        background: "#FDFAF5", borderRadius: "24px 24px 0 0",
        maxHeight: "88vh", display: "flex", flexDirection: "column",
        boxShadow: "0 -12px 60px rgba(0,0,0,0.22)",
        animation: "ipSlideUp 0.30s cubic-bezier(0.22,1,0.36,1) both",
      }}>
        {/* Handle */}
        <div style={{ flexShrink: 0, paddingTop: 10, paddingBottom: 4 }}>
          <div style={{ width: 40, height: 4, borderRadius: 99, background: "rgba(20,20,34,0.15)", margin: "0 auto" }} />
        </div>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 20px 14px", flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#141422" }}>🏁 Meilenstein-Fortschritt</div>
            <div style={{ fontSize: 13, color: "#666", marginTop: 2 }}>{m.title}</div>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: "50%", border: "none",
            background: "rgba(0,0,0,0.08)", cursor: "pointer", fontSize: 16,
          }}>✕</button>
        </div>
        {/* Scroll content */}
        <div style={{
          flex: 1, overflowY: "auto", overscrollBehavior: "contain",
          WebkitOverflowScrolling: "touch",
          padding: "0 20px calc(88px + env(safe-area-inset-bottom, 0px))",
        }}>
          {/* Meta */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            <span style={{
              fontSize: 11, fontWeight: 700, color: sc.color,
              background: sc.bg, borderRadius: 99, padding: "4px 10px",
            }}>{sc.label}</span>
            {plannedDate && (
              <span style={{
                fontSize: 11, fontWeight: 700, color: "#888",
                background: "rgba(0,0,0,0.05)", borderRadius: 99, padding: "4px 10px",
              }}>🎯 {fmtD(plannedDate)}</span>
            )}
          </div>
          {/* Description */}
          {m.description && (
            <div style={{
              fontSize: 13, color: "#444", lineHeight: 1.6, marginBottom: 20,
              padding: "12px 14px", background: "rgba(0,0,0,0.03)", borderRadius: 14,
            }}>{m.description}</div>
          )}
          {/* Updates */}
          <div style={{ fontSize: 13, fontWeight: 800, color: "#141422", marginBottom: 12 }}>
            📋 Updates ({sortedUpdates.length})
          </div>
          {sortedUpdates.length === 0 ? (
            <div style={{ color: "#888", fontSize: 13, textAlign: "center", padding: "24px 0" }}>
              Noch keine Updates für diesen Meilenstein.
            </div>
          ) : (
            sortedUpdates.map((u, idx) => (
              <div key={u.id || idx} style={{
                marginBottom: 14, padding: "14px",
                background: "rgba(0,0,0,0.025)", borderRadius: 14,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: "#999", fontWeight: 600 }}>
                    {fmtD(u.created_at)}
                  </span>
                  {u.status_update && statusConfig[u.status_update] && (
                    <span style={{
                      fontSize: 10, fontWeight: 700,
                      color: statusConfig[u.status_update].color,
                      background: statusConfig[u.status_update].bg,
                      borderRadius: 99, padding: "2px 8px",
                    }}>{statusConfig[u.status_update].label}</span>
                  )}
                </div>
                {u.content && (
                  <div style={{ fontSize: 13, color: "#333", lineHeight: 1.6, marginBottom: 8 }}>{u.content}</div>
                )}
                {u.media_urls && u.media_urls.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {u.media_urls.map((url, mi) => {
                      const isImg = /\.(jpg|jpeg|png|webp|gif)$/i.test(url);
                      const isVid = /\.(mp4|webm|mov|avi)$/i.test(url);
                      return isImg ? (
                        <a key={mi} href={url} target="_blank" rel="noreferrer">
                          <img loading="lazy" decoding="async" src={url} alt={`Bild ${mi+1}`}
                            style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 10,
                              border: "1px solid rgba(0,0,0,0.10)" }} />
                        </a>
                      ) : isVid ? (
                        <a key={mi} href={url} target="_blank" rel="noreferrer"
                          style={{
                            display: "flex", alignItems: "center", gap: 6,
                            background: "rgba(114,100,214,0.08)", border: "1px solid rgba(114,100,214,0.20)",
                            borderRadius: 10, padding: "8px 12px", fontSize: 12, color: "#7264D6",
                            fontWeight: 600, textDecoration: "none",
                          }}>🎬 Video {mi+1}</a>
                      ) : (
                        <a key={mi} href={url} target="_blank" rel="noreferrer"
                          style={{
                            display: "flex", alignItems: "center", gap: 6,
                            background: "rgba(114,100,214,0.08)", border: "1px solid rgba(114,100,214,0.20)",
                            borderRadius: 10, padding: "8px 12px", fontSize: 12, color: "#7264D6",
                            fontWeight: 600, textDecoration: "none",
                          }}>📎 Datei {mi+1}</a>
                      );
                    })}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
  return typeof document !== "undefined"
    ? ReactDOM.createPortal(content, document.body)
    : content;
}

// ── Karte für bewilligte Anträge ────────────────────────────────
