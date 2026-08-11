// ══════════════════════════════════════════════════════════════════════════════
// WirkungPage.jsx — HUI V7.5 — Ein ruhiger Spiegel der entstandenen Wirkung
// ══════════════════════════════════════════════════════════════════════════════
//
// "Wirkung" ist kein Statistikbereich.
// Es geht darum, sichtbar zu machen, welche Veränderungen durch einen
// Menschen oder ein Projekt entstanden sind.
//
// Die Wirkung soll Geschichten unterstützen und Zahlen erklären.
// Nicht umgekehrt.
// Die Zahlen dienen der Geschichte.
// Die Geschichte dient niemals den Zahlen.
//
// Dieses Panel fühlt sich wie ein ruhiger Spiegel an,
// nicht wie ein Analytics-Dashboard.
//
// ══════════════════════════════════════════════════════════════════════════════
// ARCHITEKTURREGELN
// ══════════════════════════════════════════════════════════════════════════════
//
// ARL-07: QUALITATIVE UND QUANTITATIVE WIRKUNG SIND GLEICHWERTIG
//   Wirkung entsteht nicht ausschließlich durch Zahlen.
//   Eine berührende Rückmeldung, eine gelöste Herausforderung oder eine
//   inspirierte Person können genauso bedeutend sein wie hundert
//   Unterstützungen.
//   Die Wirkung soll langfristig auch persönliche Resonanz sichtbar
//   machen — nicht nur messbare Metriken.
//   Dies ist ausdrücklich eine langfristige Zielarchitektur (V8+).
//   In V7.5 werden nur quantitative Daten angezeigt. Die qualitative
//   Erweiterung folgt, sobald Resonanz-Daten strukturiert vorliegen.
//
// ARL-08: WIRKUNG GEHÖRT NIEMALS AUSSCHLIESSLICH EINER PERSON
//   Jede Wirkung entsteht gemeinsam.
//   Talente, Unterstützer, Projekte, Helfer und Gemeinschaft tragen
//   gemeinsam dazu bei.
//   Langfristig soll Wirkung auch Zusammenhänge sichtbar machen —
//   wer hat beigetragen, wer hat profitiert, was ist gemeinsam entstanden.
//   Nicht nur individuelle Zahlen, sondern ein Gewebe aus Beiträgen.
//   Dies ist ebenfalls eine langfristige Zielarchitektur (V8+).
// ══════════════════════════════════════════════════════════════════════════════
//
// DATEN: Supabase (profiles, creator_supports, impact_votes, bookings,
//        impact_milestones, impact_milestone_updates, impact_applications,
//        profiles)
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient.js';
import { useAuth } from '../../lib/AuthContext.jsx';
import { formatDateDE, formatNumberDE } from "../../lib/formatters.js";
import { HUI } from "../../design/hui.design.js";

const C = {
  cream: HUI.COLOR.creamStudio, white: HUI.COLOR.white, ink: HUI.COLOR.inkStudio,
  muted: 'rgba(80,80,80,0.55)', teal: HUI.COLOR.tealStudio, coral: HUI.COLOR.coralStudio,
  green: HUI.COLOR.greenStatus, border: 'rgba(0,0,0,0.06)',
};

function fmtNum(n) {
  return formatNumberDE((n || 0));
}

function fmtEur(n) {
  return `${fmtNum(n || 0)} €`;
}

function relativeTime(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days > 7) return formatDateDE(new Date(dateStr), { day: '2-digit', month: 'short' });
  if (days > 0) return `vor ${days} ${days === 1 ? 'Tag' : 'Tagen'}`;
  const hours = Math.floor(diff / 3600000);
  if (hours > 0) return `vor ${hours} ${hours === 1 ? 'Stunde' : 'Stunden'}`;
  const mins = Math.floor(diff / 60000);
  if (mins > 0) return `vor ${mins} ${mins === 1 ? 'Minute' : 'Minuten'}`;
  return 'gerade eben';
}

export default function WirkungPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [moments, setMoments] = useState([]);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    // Schritt 1: Projekt-IDs einmal laden (wird für votes und milestones benötigt)
    const projectsRes = await supabase.from('impact_applications')
      .select('id, name, status, created_at')
      .eq('user_id', user.id);
    const projectIds = (projectsRes.data || []).map(p => p.id);

    // Schritt 2: Alle weiteren Daten parallel laden
    const [
      supportsRes, votesRes, bookingsRes,
      milestonesRes, worksRes, profileRes
    ] = await Promise.all([
      // Unterstützungen erhalten
      supabase.from('creator_supports')
        .select('id, amount, created_at, payment_status, message, supporter:supporter_id(id, display_name, avatar_url)')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10),
      // Impact-Stimmen für meine Projekte
      projectIds.length > 0
        ? supabase.from('impact_votes')
            .select('id, created_at, project_id, voter_id')
            .in('project_id', projectIds)
            .order('created_at', { ascending: false })
            .limit(10)
        : Promise.resolve({ data: [] }),
      // Buchungen
      supabase.from('bookings')
        .select('id, amount, created_at, status, user_id')
        .eq('wirker_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10),
      // Meilensteine (alle Projekte des Talents)
      projectIds.length > 0
        ? supabase.from('impact_milestones')
            .select('id, status, project_id, title, impact_milestone_updates(id, created_at)')
            .in('project_id', projectIds)
        : Promise.resolve({ data: [] }),
      // Werke
      supabase.from('works')
        .select('id, title, status, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      // Profil-Daten (followers_count, impact_eur, profile_views)
      supabase.from('profiles')
        .select('followers_count, impact_eur, profile_views')
        .eq('id', user.id)
        .single(),
    ]);

    // Aggregationen
    const supports = supportsRes.data || [];
    const votes = votesRes.data || [];
    const bookings = bookingsRes.data || [];
    const projects = projectsRes.data || [];
    const milestones = milestonesRes.data || [];
    const works = worksRes.data || [];

    const totalSupportEur = supports
      .filter(s => s.payment_status === 'completed' || s.payment_status === 'pending')
      .reduce((sum, s) => sum + (s.amount || 0), 0);

    const uniqueSupporters = new Set(supports.map(s => s.supporter?.id)).size;
    const uniqueVoters = new Set(votes.map(v => v.voter_id)).size;
    const completedMilestones = milestones.filter(m => m.status === 'completed').length;
    const totalMilestoneUpdates = milestones.reduce((sum, m) => sum + (m.impact_milestone_updates?.length || 0), 0);
    const publishedWorks = works.filter(w => w.status === 'published').length;
    const approvedProjects = projects.filter(p => p.status === 'approved').length;
    const totalBookings = bookings.filter(b => b.status === 'completed').length;
    const followers = profileRes.data?.followers_count || 0;
    const impactEur = profileRes.data?.impact_eur || 0;
    const profileViews = profileRes.data?.profile_views || 0;

    setData({
      totalSupportEur, uniqueSupporters, uniqueVoters,
      completedMilestones, totalMilestoneUpdates,
      publishedWorks, approvedProjects, totalBookings,
      followers, impactEur, profileViews,
      totalProjects: projects.length,
    });

    // Wirkungsmomente — eine chronologische Liste
    const allMoments = [];

    supports.forEach(s => allMoments.push({
      type: 'support', date: s.created_at,
      text: s.supporter?.display_name
        ? `${s.supporter.display_name} hat dich unterstützt`
        : 'Jemand hat dich unterstützt',
      detail: s.message || `${fmtEur(s.amount)}`,
    }));

    votes.forEach(v => allMoments.push({
      type: 'vote', date: v.created_at,
      text: 'Jemand hat für dein Projekt gestimmt',
      detail: '',
    }));

    bookings.forEach(b => allMoments.push({
      type: 'booking', date: b.created_at,
      text: 'Eine neue Buchung',
      detail: `${fmtEur(b.amount)}`,
    }));

    // Sortieren und begrenzen
    allMoments.sort((a, b) => new Date(b.date) - new Date(a.date));
    setMoments(allMoments.slice(0, 8));

    setLoading(false);
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div style={{ padding: '40px 32px', maxWidth: 680, fontFamily: "Inter, sans-serif" }}>
        <p style={{ color: C.muted, fontSize: 14 }}>Spiegelt deine Wirkung…</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div style={{
      padding: '40px 32px', maxWidth: 680,
      fontFamily: "Inter, sans-serif",
    }}>
      {/* Einleitung */}
      <h2 style={{ fontSize: 24, fontWeight: 600, color: C.ink, marginBottom: 8 }}>
        Deine Wirkung
      </h2>
      <p style={{ fontSize: 15, color: C.muted, marginBottom: 40, lineHeight: 1.7 }}>
        Was durch dich entstanden ist. Was gewachsen ist.
        Was andere Menschen erreicht hat.
      </p>

      {/* ═══ Erzählte Wirkung ═══ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginBottom: 40 }}>
        {/* Menschen erreicht */}
        {data.profileViews > 0 && (
          <WirkungsSatz
            zahl={fmtNum(data.profileViews)}
            satz="Menschen haben dich entdeckt."
            detail="Sie haben dein Profil gesehen, deine Arbeit wahrgenommen, deine Geschichte gelesen."
          />
        )}

        {/* Vertrauen */}
        {data.followers > 0 && (
          <WirkungsSatz
            zahl={fmtNum(data.followers)}
            satz="Menschen folgen deiner Arbeit."
            detail="Sie möchten wissen, was du als Nächstes erschaffst."
          />
        )}

        {/* Gemeinsame Wirkung */}
        {data.impactEur > 0 && (
          <WirkungsSatz
            zahl={fmtEur(data.impactEur)}
            satz="wurden gemeinsam bewirkt."
            detail="Durch deine Arbeit, deine Angebote und die Gemeinschaft, die dir vertraut."
          />
        )}

        {/* Werke erschaffen */}
        {data.publishedWorks > 0 && (
          <WirkungsSatz
            zahl={fmtNum(data.publishedWorks)}
            satz={data.publishedWorks === 1 ? "Werk hast du erschaffen und geteilt." : "Werke hast du erschaffen und geteilt."}
            detail="Jedes Werk ist ein Stück von dir, das die Welt sehen kann."
          />
        )}

        {/* Projekte begleitet */}
        {data.approvedProjects > 0 && (
          <WirkungsSatz
            zahl={fmtNum(data.approvedProjects)}
            satz={data.approvedProjects === 1 ? "Projekt hast du begleitet." : "Projekte hast du begleitet."}
            detail={data.completedMilestones > 0
              ? `${fmtNum(data.completedMilestones)} Meilensteine erreicht, ${fmtNum(data.totalMilestoneUpdates)} Einträge in der Reise dokumentiert.`
              : 'Die Reise beginnt.'}
          />
        )}

        {/* Unterstützer */}
        {data.uniqueSupporters > 0 && (
          <WirkungsSatz
            zahl={fmtNum(data.uniqueSupporters)}
            satz={data.uniqueSupporters === 1 ? "Mensch hat dich direkt unterstützt." : "Menschen haben dich direkt unterstützt."}
            detail={`${fmtEur(data.totalSupportEur)} wurden dir anvertraut.`}
          />
        )}

        {/* Stimmen */}
        {data.uniqueVoters > 0 && (
          <WirkungsSatz
            zahl={fmtNum(data.uniqueVoters)}
            satz={data.uniqueVoters === 1 ? "Stimme wurde für deine Projekte abgegeben." : "Stimmen wurden für deine Projekte abgegeben."}
            detail="Menschen, die an das glauben, was du voranbringst."
          />
        )}

        {/* Buchungen */}
        {data.totalBookings > 0 && (
          <WirkungsSatz
            zahl={fmtNum(data.totalBookings)}
            satz={data.totalBookings === 1 ? "Mensch hat Zeit mit dir verbracht." : "Menschen haben Zeit mit dir verbracht."}
            detail="Sie haben dir ihre Neugier, ihre Fragen, ihr Vertrauen anvertraut."
          />
        )}
      </div>

      {/* ═══ Leere Wirkung ═══ */}
      {data.profileViews === 0 && data.followers === 0 && data.impactEur === 0 &&
       data.publishedWorks === 0 && data.approvedProjects === 0 &&
       data.uniqueSupporters === 0 && data.totalBookings === 0 && (
        <div style={{
          padding: '32px', borderRadius: 16, background: C.white,
          border: `1px solid ${C.border}`, textAlign: 'center', marginBottom: 40,
        }}>
          <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.7, marginBottom: 0 }}>
            Deine Wirkung wächst mit jedem Schritt.
            Jedes Werk, das du teilst, jedes Projekt, das du begleitest,
            jeder Mensch, der dich erreicht — alles wird hier sichtbar.
          </p>
        </div>
      )}

      {/* ═══ Wirkungsmomente ═══ */}
      {moments.length > 0 && (
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: C.ink, marginBottom: 16 }}>
            Was sich kürzlich verändert hat
          </h3>
          <div style={{ position: 'relative', paddingLeft: 16 }}>
            <div style={{
              position: 'absolute', left: 4, top: 8, bottom: 8, width: 1,
              background: C.border,
            }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {moments.map((m, i) => (
                <Moment key={i} moment={m} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Ein Wirkungssatz: Zahl + Satz + Detail ────────────────────────────
function WirkungsSatz({ zahl, satz, detail }) {
  return (
    <div style={{
      padding: '20px', borderRadius: 14, background: C.white,
      border: `1px solid ${C.border}`,
    }}>
      <p style={{
        fontSize: 15, color: C.ink, lineHeight: 1.5, marginBottom: 0,
      }}>
        <span style={{ fontWeight: 600, color: C.teal, fontSize: 18 }}>{zahl}</span>{' '}
        {satz}
      </p>
      <p style={{
        fontSize: 13, color: C.muted, lineHeight: 1.6, marginTop: 6, marginBottom: 0,
      }}>{detail}</p>
    </div>
  );
}

// ── Ein Wirkungsmoment in der Timeline ───────────────────────────────
function Moment({ moment }) {
  const typeColors = {
    support: C.coral, vote: C.teal, booking: C.green,
  };
  const color = typeColors[moment.type] || C.muted;

  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        position: 'absolute', left: -16, top: 6, width: 9, height: 9,
        borderRadius: '50%', background: color, border: `2px solid ${C.cream}`,
      }} />
      <div>
        <div style={{ fontSize: 14, color: C.ink, marginBottom: 2 }}>
          {moment.text}
        </div>
        {moment.detail && (
          <div style={{ fontSize: 13, color: C.muted }}>{moment.detail}</div>
        )}
        <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
          {relativeTime(moment.date)}
        </div>
      </div>
    </div>
  );
}
