import React from "react";

export function MilestoneCard({ milestone, index, onViewProgress }) {
  const m = milestone;
  const statusConfig = {
    planned:      { label: '📅 Geplant',      color: '#898998', bg: 'rgba(137,137,152,0.12)' },
    in_progress:  { label: '🔄 In Arbeit',     color: '#0DC4B5', bg: 'rgba(13,196,181,0.12)' },
    completed:    { label: '✅ Abgeschlossen',  color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  };
  const sc = statusConfig[m.status] || statusConfig.planned;
  const truncatedDesc = m.description && m.description.length > 100
    ? m.description.slice(0, 100) + '…'
    : m.description;
  const plannedDate = m.planned_date || m.target_date || m.due_date || null;
  const fmtD = (iso) => iso
    ? new Date(iso).toLocaleDateString("de-DE", { day:"2-digit", month:"short", year:"numeric" })
    : "";

  return (
    <div style={{
      display: 'flex', gap: 12, marginBottom: 12, alignItems: 'flex-start',
      background: 'rgba(0,0,0,0.025)', borderRadius: 14, padding: '12px 14px',
    }}>
      {/* Nummer */}
      <div style={{
        width: 28, height: 28, borderRadius: '50%', background: '#0DC4B5', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 800, flexShrink: 0,
      }}>
        {index + 1}
      </div>
      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#141422' }}>{m.title}</span>
          <span style={{
            fontSize: 10, fontWeight: 700, color: sc.color,
            background: sc.bg, borderRadius: 99, padding: '2px 8px',
          }}>{sc.label}</span>
        </div>
        {truncatedDesc && (
          <div style={{ fontSize: 12, color: '#666', lineHeight: 1.5, marginBottom: 6 }}>{truncatedDesc}</div>
        )}
        {plannedDate && (
          <div style={{ fontSize: 11, color: '#999', marginBottom: 6 }}>🎯 {fmtD(plannedDate)}</div>
        )}
        <button
          onClick={onViewProgress}
          style={{
            padding: '6px 14px', borderRadius: 99, border: '1px solid rgba(13,196,181,0.25)',
            background: 'rgba(13,196,181,0.08)', color: '#0DC4B5',
            fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          📊 Fortschritt ansehen
        </button>
      </div>
    </div>
  );
}

// ── MilestoneDetailSheet ─────────────────────────────────────────
