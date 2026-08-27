// ══════════════════════════════════════════════════════════════════════════════
// ProjektreisenPage.jsx — HUI V7.5 — Übersicht aller Projektreisen
// ══════════════════════════════════════════════════════════════════════════════
//
// Die Projektreise ist keine Projektverwaltung.
// Sie ist die Geschichte eines Vorhabens.
// Jede Karte öffnet eine Reise — nicht eine Tabelle.
//
// Diese Übersicht zeigt alle Projekte eines Talents.
// Warm, einladend, wie ein Buchdeckel.
//
// DATEN: Supabase (impact_applications, impact_milestones, impact_milestone_updates)
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient.js';
import { useAuth } from '../../lib/AuthContext.jsx';
import ProjektreiseDetail from './ProjektreiseDetail.jsx';
import { formatDateDE } from "../../lib/formatters.js";
import { HUI } from "../../design/hui.design.js";

const C = {
  cream: HUI.COLOR.creamStudio, white: HUI.COLOR.white, ink: HUI.COLOR.inkStudio,
  muted: 'rgba(80,80,80,0.55)', teal: HUI.COLOR.tealStudio, coral: HUI.COLOR.coralStudio,
  green: HUI.COLOR.greenStatus, border: 'rgba(0,0,0,0.06)',
};

const STATUS_CFG = {
  approved:  { label: 'Freigegeben',  color: C.green },
  pending:   { label: 'In Prüfung',  color: C.coral },
  rejected:  { label: 'Abgelehnt',   color: C.muted },
  active:    { label: 'Aktiv',       color: C.teal },
  draft:     { label: 'Entwurf',     color: C.muted },
};

export default function ProjektreisenPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    // Projekte des Talents laden
    const { data: apps } = await supabase
      .from('impact_applications')
      .select('id, name, description, status, category, icon, color, created_at, contact_name')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!apps || apps.length === 0) {
      setProjects([]);
      setLoading(false);
      return;
    }

    // Batch-Query: alle Milestones für alle Projekte in einer Abfrage
    const appIds = apps.map(a => a.id);
    const { data: allMilestones } = await supabase
      .from('impact_milestones')
      .select('id, title, status, updated_at, project_id, impact_milestone_updates(id, created_at)')
      .in('project_id', appIds)
      .order('sort_order');

    // Milestones nach Projekt gruppieren und anreichern
    const milestonesByProject = {};
    (allMilestones || []).forEach(m => {
      if (!milestonesByProject[m.project_id]) milestonesByProject[m.project_id] = [];
      milestonesByProject[m.project_id].push(m);
    });

    const enriched = apps.map(app => {
      const ms = milestonesByProject[app.id] || [];
      const allUpdates = ms.flatMap(m => m.impact_milestone_updates || []);
      const lastUpdate = allUpdates.length > 0
        ? allUpdates.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
        : null;

      return {
        ...app,
        milestoneCount: ms.length,
        updateCount: allUpdates.length,
        lastUpdateDate: lastUpdate?.created_at || null,
      };
    });

    setProjects(enriched);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  // Detail-Ansicht
  if (selectedProject) {
    return (
      <ProjektreiseDetail
        project={selectedProject}
        onBack={() => { setSelectedProject(null); load(); }}
      />
    );
  }

  return (
    <div style={{
      padding: '40px 32px', maxWidth: 680,
      fontFamily: "Inter, sans-serif",
    }}>
      <h2 style={{ fontSize: 24, fontWeight: 600, color: C.ink, marginBottom: 8 }}>
        Projektreisen
      </h2>
      <p style={{ fontSize: 15, color: C.muted, marginBottom: 32, lineHeight: 1.6 }}>
        Die Geschichte deiner Vorhaben. Jede Reise erzählt, was entstanden ist,
        welche Menschen beteiligt waren und welche Wirkung gewachsen ist.
      </p>

      {loading ? (
        <p style={{ color: C.muted, fontSize: 14 }}>Lade Reisen…</p>
      ) : projects.length === 0 ? (
        <div style={{
          padding: '32px', borderRadius: 16, background: C.white,
          border: `1px solid ${C.border}`, textAlign: 'center',
        }}>
          <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6, marginBottom: 0 }}>
            Du hast noch keine Projektreisen.
            Wenn ein Projekt angenommen wird, beginnt hier seine Geschichte.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {projects.map(project => (
            <ProjectCard key={project.id} project={project} onClick={() => setSelectedProject(project)} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectCard({ project, onClick }) {
  const sc = STATUS_CFG[project.status] || { label: project.status, color: C.muted };

  return (
    <button
      onClick={onClick}
      style={{
        padding: '20px', borderRadius: 14, background: C.white,
        border: `1px solid ${C.border}`, cursor: 'pointer', textAlign: 'left',
        width: '100%', boxSizing: 'border-box',
        transition: 'box-shadow 0.2s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: C.ink, margin: 0 }}>
          {project.name || 'Ohne Titel'}
        </h3>
        <span style={{
          fontSize: 11, fontWeight: 500, color: sc.color,
          padding: '3px 8px', borderRadius: 6, background: `${sc.color}12`,
          flexShrink: 0,
        }}>{sc.label}</span>
      </div>

      {project.description && (
        <p style={{
          fontSize: 13, color: C.muted, lineHeight: 1.5, marginBottom: 12,
          overflow: 'hidden', textOverflow: 'ellipsis',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>{project.description}</p>
      )}

      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: C.muted }}>
        <span>{project.milestoneCount} {project.milestoneCount === 1 ? 'Meilenstein' : 'Meilensteine'}</span>
        <span>{project.updateCount} {project.updateCount === 1 ? 'Eintrag' : 'Einträge'}</span>
        {project.lastUpdateDate && (
          <span>Zuletzt: {formatDateDE(new Date(project.lastUpdateDate))}</span>
        )}
      </div>
    </button>
  );
}
