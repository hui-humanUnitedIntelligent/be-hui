// ══════════════════════════════════════════════════════════════════════════════
// ProjektreiseDetail.jsx — HUI V7.5 — Die Reise eines einzelnen Projekts
// ══════════════════════════════════════════════════════════════════════════════
//
// Dies ist kein Projektmanagement-Tool.
// Dies ist ein lebendiges Tagebuch.
//
// Jeder Eintrag erzählt, was entstanden ist,
// welche Herausforderungen es gab,
// welche Menschen beteiligt waren
// und welche Wirkung entstanden ist.
//
// Die Reise liest sich wie ein Buch — chronologisch, menschlich, warm.
//
// ══════════════════════════════════════════════════════════════════════════════
// ARCHITEKTURREGELN
// ══════════════════════════════════════════════════════════════════════════════
//
// ARL-05: PROJEKTREISE ALS GESCHICHTE
//   Die Projektreise dokumentiert die Entwicklung eines Projekts.
//   Sie ist kein Verwaltungsobjekt, sondern die dauerhaft erhaltene
//   Geschichte eines Vorhabens.
//   Die Trennung zwischen Projektverwaltung und Projekterzählung
//   bleibt langfristig erhalten.
//
// ARL-06: ADDITIVE EINTRÄGE
//   Einträge sind grundsätzlich additiv.
//   Bestehende Einträge werden langfristig nicht überschrieben.
//   Neue Erkenntnisse, Änderungen oder Korrekturen entstehen als
//   neue Einträge.
//   Dadurch bleibt die Reise nachvollziehbar und transparent.
// ══════════════════════════════════════════════════════════════════════════════
//
// DATEN: Supabase (impact_milestones, impact_milestone_updates, impact_applications)
// WIEDERVERWENDUNG: MilestoneUpdateSheet (bestehende Komponente für neue Einträge)
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../lib/supabaseClient.js';
import { useAuth } from '../../lib/AuthContext.jsx';
import MilestoneUpdateSheet from '../../components/studio/MilestoneUpdateSheet.jsx';
import { formatDateDE } from "../../lib/formatters.js";

const C = {
  cream: '#F9F7F4', white: '#FFFFFF', ink: '#1A1A1A',
  muted: 'rgba(80,80,80,0.55)', teal: '#16D7C5', coral: '#FF8A6B',
  green: '#10B981', border: 'rgba(0,0,0,0.06)',
};

const STATUS_CFG = {
  planned:     { label: 'Geplant',     color: C.muted },
  in_progress: { label: 'In Arbeit',   color: C.teal },
  completed:   { label: 'Abgeschlossen', color: C.green },
};

function relativeTime(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000);
  if (days > 7) return formatDateDE(new Date(dateStr), { day: '2-digit', month: 'long', year: 'numeric' });
  if (days > 0) return `vor ${days} ${days === 1 ? 'Tag' : 'Tagen'}`;
  if (hours > 0) return `vor ${hours} ${hours === 1 ? 'Stunde' : 'Stunden'}`;
  const mins = Math.floor(diff / 60000);
  if (mins > 0) return `vor ${mins} ${mins === 1 ? 'Minute' : 'Minuten'}`;
  return 'gerade eben';
}

export default function ProjektreiseDetail({ project, onBack }) {
  const { user } = useAuth();
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updateSheet, setUpdateSheet] = useState(null); // milestone object or null

  const load = useCallback(async () => {
    if (!project?.id) return;
    setLoading(true);

    const { data } = await supabase
      .from('impact_milestones')
      .select('*, impact_milestone_updates(*)')
      .eq('project_id', project.id)
      .order('sort_order');

    // Updates innerhalb jedes Meilensteins nach Datum sortieren (neueste zuerst)
    const enriched = (data || []).map(m => ({
      ...m,
      impact_milestone_updates: (m.impact_milestone_updates || [])
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    }));

    setMilestones(enriched);
    setLoading(false);
  }, [project?.id]);

  useEffect(() => { load(); }, [load]);

  // Zähle alle Einträge für die Chronik
  const totalEntries = milestones.reduce((sum, m) => sum + (m.impact_milestone_updates?.length || 0), 0);

  return (
    <div style={{
      padding: '40px 32px', maxWidth: 680,
      fontFamily: "Inter, sans-serif",
    }}>
      {/* Zurück */}
      <button
        onClick={onBack}
        style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          fontSize: 13, color: C.muted, marginBottom: 24, padding: 0,
        }}
      >← Alle Reisen</button>

      {/* Projekt-Titel */}
      <h2 style={{ fontSize: 26, fontWeight: 700, color: C.ink, marginBottom: 8, lineHeight: 1.3 }}>
        {project.name || 'Ohne Titel'}
      </h2>
      {project.description && (
        <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.7, marginBottom: 8 }}>
          {project.description}
        </p>
      )}
      <p style={{ fontSize: 13, color: C.muted, marginBottom: 32 }}>
        {milestones.length} {milestones.length === 1 ? 'Kapitel' : 'Kapitel'} · {totalEntries} {totalEntries === 1 ? 'Eintrag' : 'Einträge'}
      </p>

      {/* Neue Reise-Einträge hinzufügen */}
      {milestones.length > 0 && (
        <div style={{ marginBottom: 32, padding: '16px', borderRadius: 14, background: C.white, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.ink, marginBottom: 10 }}>
            Eintrag hinzufügen
          </div>
          <p style={{ fontSize: 13, color: C.muted, marginBottom: 12, lineHeight: 1.5 }}>
            Wähle ein Kapitel, um die Geschichte fortzuschreiben.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {milestones.map(m => (
              <button
                key={m.id}
                onClick={() => setUpdateSheet(m)}
                style={{
                  padding: '8px 14px', borderRadius: 10, border: `1px solid ${C.border}`,
                  background: 'transparent', cursor: 'pointer',
                  fontSize: 13, color: C.ink, fontWeight: 500,
                }}
              >
                {m.title || 'Ohne Titel'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Die Reise — chronologische Timeline */}
      {loading ? (
        <p style={{ color: C.muted, fontSize: 14 }}>Lade Reise…</p>
      ) : milestones.length === 0 ? (
        <div style={{
          padding: '32px', borderRadius: 16, background: C.white,
          border: `1px solid ${C.border}`, textAlign: 'center',
        }}>
          <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6, marginBottom: 0 }}>
            Diese Reise hat noch keine Kapitel.
            Meilensteine werden beim Projektantrag festgelegt.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {milestones.map((milestone, idx) => {
            const sc = STATUS_CFG[milestone.status] || STATUS_CFG.planned;
            return (
              <MilestoneChapter
                key={milestone.id}
                milestone={milestone}
                chapterNumber={idx + 1}
                statusColor={sc.color}
                statusLabel={sc.label}
                onAddEntry={() => setUpdateSheet(milestone)}
              />
            );
          })}
        </div>
      )}

      {/* MilestoneUpdateSheet — bestehende Komponente wiederverwendet */}
      {updateSheet && createPortal(
        <MilestoneUpdateSheet
          milestone={updateSheet}
          projectId={project.id}
          authorId={user?.id}
          onClose={() => setUpdateSheet(null)}
          onSubmitted={() => { setUpdateSheet(null); load(); }}
        />,
        document.body
      )}
    </div>
  );
}

function MilestoneChapter({ milestone, chapterNumber, statusColor, statusLabel, onAddEntry }) {
  const updates = milestone.impact_milestone_updates || [];

  return (
    <div>
      {/* Kapitel-Titel */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
        paddingBottom: 12, borderBottom: `1px solid ${C.border}`,
      }}>
        <span style={{
          fontSize: 12, fontWeight: 700, color: C.muted, letterSpacing: 1,
        }}>KAPITEL {String(chapterNumber).padStart(2, '0')}</span>
        <span style={{
          fontSize: 11, fontWeight: 500, color: statusColor,
          padding: '2px 8px', borderRadius: 6, background: `${statusColor}12`,
        }}>{statusLabel}</span>
      </div>

      <h3 style={{ fontSize: 18, fontWeight: 600, color: C.ink, marginBottom: 6 }}>
        {milestone.title || 'Ohne Titel'}
      </h3>
      {milestone.description && (
        <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6, marginBottom: 16 }}>
          {milestone.description}
        </p>
      )}

      {/* Einträge — Tagebuch */}
      {updates.length === 0 ? (
        <div style={{
          padding: '16px', borderRadius: 12, background: C.cream, marginBottom: 8,
          fontSize: 13, color: C.muted, textAlign: 'center',
        }}>
          Noch keine Einträge in diesem Kapitel.
        </div>
      ) : (
        <div style={{ position: 'relative', paddingLeft: 16 }}>
          {/* Timeline line */}
          <div style={{
            position: 'absolute', left: 4, top: 8, bottom: 8, width: 1,
            background: C.border,
          }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {updates.map((update, i) => (
              <DiaryEntry key={update.id || i} update={update} />
            ))}
          </div>
        </div>
      )}

      {/* Eintrag hinzufügen */}
      <button
        onClick={onAddEntry}
        style={{
          marginTop: 12, padding: '8px 16px', borderRadius: 10,
          border: `1px solid ${C.border}`, background: 'transparent',
          cursor: 'pointer', fontSize: 13, color: C.teal, fontWeight: 500,
        }}
      >
        + Eintrag schreiben
      </button>
    </div>
  );
}

function DiaryEntry({ update }) {
  const mediaUrls = update.media_urls || [];

  return (
    <div style={{ position: 'relative' }}>
      {/* Timeline dot */}
      <div style={{
        position: 'absolute', left: -16, top: 6, width: 9, height: 9,
        borderRadius: '50%', background: C.teal,
        border: `2px solid ${C.cream}`,
      }} />

      {/* Entry content */}
      <div style={{
        padding: '16px', borderRadius: 12, background: C.white,
        border: `1px solid ${C.border}`,
      }}>
        {/* Datum */}
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>
          {relativeTime(update.created_at)}
        </div>

        {/* Text — die Erzählung */}
        {update.content && (
          <p style={{
            fontSize: 14, color: C.ink, lineHeight: 1.7, marginBottom: 0,
            whiteSpace: 'pre-wrap',
          }}>{update.content}</p>
        )}

        {/* Bilder — wie eingeklebte Fotos im Tagebuch */}
        {mediaUrls.length > 0 && (
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12,
          }}>
            {mediaUrls.map((url, i) => (
              <img
                key={i}
                src={url}
                alt=""
                style={{
                  width: 120, height: 120, objectFit: 'cover',
                  borderRadius: 10, border: `1px solid ${C.border}`,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
