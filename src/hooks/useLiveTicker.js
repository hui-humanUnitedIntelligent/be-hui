/**
 * useLiveTicker — Single Source of Truth für den HUI-Liveticker
 *
 * Datenquellen (erlaubt):
 *   impact_votes, approved impact_applications, stripe_impact_pool,
 *   published works/experiences, public invitations, approved talents
 *
 * Realtime first: Initial Fetch, danach ausschließlich Realtime.
 * Polling nur als Fallback bei Channel-Fehlern.
 *
 * Erweiterbar für: personalisierte Events, Radius, Interessen, Resonanz Engine
 * via `filters` ohne Architekturänderung.
 */
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { ProfileService } from '../services/db';
import { subscribeVotesRealtime } from '../lib/realtime/votesRealtimeBus';
import { subscribeLivetickerRealtime, subscribeLivetickerStatus } from '../lib/realtime/livetickerRealtimeBus';
import { useStripeImpactPool } from './useStripeImpactPool';

// ─── Konstanten ─────────────────────────────────────────────────────────────
const MAX_EVENTS = 12;
const INITIAL_PER_SOURCE = 4;
const POLL_FALLBACK_MS = 60_000;

export const TICKER_EVENT_TYPES = {
  IMPACT_VOTE:    'impact_vote',
  IMPACT_PROJECT: 'impact_project',
  POOL_GROWTH:    'pool_growth',
  WORK:           'work',
  EXPERIENCE:     'experience',
  INVITATION:     'invitation',
  TALENT:         'talent',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function relTime(ts) {
  if (!ts) return '';
  const d = (Date.now() - new Date(ts).getTime()) / 1000;
  if (d < 60)    return 'vor 1 Min.';
  if (d < 3600)  return `vor ${Math.round(d / 60)} Min.`;
  if (d < 86400) return `vor ${Math.round(d / 3600)} Std.`;
  return `vor ${Math.round(d / 86400)} Tg.`;
}

function displayName(profile, fallback = 'Jemand') {
  return profile?.display_name || profile?.username || fallback;
}

function makeEvent({ id, type, emoji, text, createdAt, userId = null, avatar = null, name = null, meta = {} }) {
  return {
    id,
    type,
    emoji,
    text,
    name,
    avatar,
    userId,
    createdAt,
    ago: relTime(createdAt),
    meta,
  };
}

// ─── Textgenerierung (menschlich, keine technischen Begriffe) ────────────────
const TEXT = {
  impactVote: (voter, project) =>
    `💚 ${voter} hat das Projekt „${project}" unterstützt.`,
  impactProject: (project) =>
    `🎨 Ein neues Kreativprojekt wurde veröffentlicht: „${project}".`,
  poolGrowth: (eur) =>
    `🌊 Der Impact Pool wächst — bereits ${eur} in diesem Monat.`,
  work: (author) =>
    `🌱 ${author} hat ein neues Werk veröffentlicht.`,
  experience: (author, title) =>
    `✨ ${author} hat ein neues Erlebnis veröffentlicht${title ? `: „${title}"` : ''}.`,
  invitation: (author, title) =>
    `📣 ${author} lädt ein${title ? `: „${title}"` : ''}.`,
  talent: (author, title) =>
    `⭐ ${author} ist jetzt als Talent freigegeben${title ? `: „${title}"` : ''}.`,
};

// ─── Profil-Cache (vermeidet redundante Abfragen bei Realtime-Bursts) ────────
const profileCache = new Map();

async function loadProfiles(userIds) {
  const missing = [...new Set(userIds)].filter((id) => id && !profileCache.has(id));
  if (!missing.length) return profileCache;
  try {
    const { data } = await ProfileService.getMany(missing);
    (data || []).forEach((p) => profileCache.set(p.id, p));
  } catch (_) { /* non-blocking */ }
  return profileCache;
}

function upsertEvents(prev, incoming) {
  const map = new Map(prev.map((e) => [e.id, e]));
  for (const ev of incoming) map.set(ev.id, ev);
  return [...map.values()]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, MAX_EVENTS);
}

// ─── Initial Fetch ───────────────────────────────────────────────────────────
async function fetchInitialTickerEvents() {
  const now = new Date().toISOString();
  const [
    votesRes, appsRes, worksRes, expsRes, invsRes, talentsRes,
  ] = await Promise.allSettled([
    supabase
      .from('impact_votes')
      .select('id,voter_id,project_id,created_at')
      .order('created_at', { ascending: false })
      .limit(INITIAL_PER_SOURCE),
    supabase
      .from('impact_applications')
      .select('id,project_name,user_id,created_at,reviewed_at')
      .eq('status', 'approved')
      .order('reviewed_at', { ascending: false, nullsFirst: false })
      .limit(INITIAL_PER_SOURCE),
    supabase
      .from('works')
      .select('id,title,user_id,created_at')
      .eq('status', 'published')
      .eq('approval_status', 'approved')
      .order('created_at', { ascending: false })
      .limit(INITIAL_PER_SOURCE),
    supabase
      .from('experiences')
      .select('id,title,user_id,created_at')
      .eq('status', 'published')
      .eq('approval_status', 'approved')
      .order('created_at', { ascending: false })
      .limit(INITIAL_PER_SOURCE),
    supabase
      .from('invitations')
      .select('id,title,text,user_id,created_at')
      .eq('status', 'active')
      .eq('visibility', 'public')
      .gt('expires_at', now)
      .order('created_at', { ascending: false })
      .limit(INITIAL_PER_SOURCE),
    supabase
      .from('talents')
      .select('id,title,user_id,created_at')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(INITIAL_PER_SOURCE),
  ]);

  const votes    = votesRes.status    === 'fulfilled' ? (votesRes.value?.data    || []) : [];
  const apps     = appsRes.status     === 'fulfilled' ? (appsRes.value?.data     || []) : [];
  const works    = worksRes.status    === 'fulfilled' ? (worksRes.value?.data    || []) : [];
  const exps     = expsRes.status     === 'fulfilled' ? (expsRes.value?.data     || []) : [];
  const invs     = invsRes.status     === 'fulfilled' ? (invsRes.value?.data     || []) : [];
  const talents  = talentsRes.status  === 'fulfilled' ? (talentsRes.value?.data  || []) : [];

  const projectIds = [...new Set(votes.map((v) => v.project_id).filter(Boolean))];
  let projectMap = {};
  if (projectIds.length) {
    const { data: projData } = await supabase
      .from('impact_applications')
      .select('id,project_name')
      .in('id', projectIds);
    projectMap = Object.fromEntries((projData || []).map((p) => [p.id, p.project_name]));
  }

  const userIds = [
    ...votes.map((v) => v.voter_id),
    ...apps.map((a) => a.user_id),
    ...works.map((w) => w.user_id),
    ...exps.map((e) => e.user_id),
    ...invs.map((i) => i.user_id),
    ...talents.map((t) => t.user_id),
  ];
  await loadProfiles(userIds);

  const events = [];

  for (const v of votes) {
    const voter = displayName(profileCache.get(v.voter_id));
    const proj  = projectMap[v.project_id] || 'ein Projekt';
    events.push(makeEvent({
      id: `vote-${v.id}`,
      type: TICKER_EVENT_TYPES.IMPACT_VOTE,
      emoji: '💚',
      text: TEXT.impactVote(voter, proj),
      createdAt: v.created_at,
      userId: v.voter_id,
      avatar: profileCache.get(v.voter_id)?.avatar_url || null,
      name: voter,
      meta: { projectId: v.project_id },
    }));
  }

  for (const a of apps) {
    events.push(makeEvent({
      id: `app-${a.id}`,
      type: TICKER_EVENT_TYPES.IMPACT_PROJECT,
      emoji: '🎨',
      text: TEXT.impactProject(a.project_name || 'ein Herzensprojekt'),
      createdAt: a.reviewed_at || a.created_at,
      userId: a.user_id,
      avatar: profileCache.get(a.user_id)?.avatar_url || null,
      name: displayName(profileCache.get(a.user_id)),
      meta: { applicationId: a.id },
    }));
  }

  for (const w of works) {
    const author = displayName(profileCache.get(w.user_id));
    events.push(makeEvent({
      id: `work-${w.id}`,
      type: TICKER_EVENT_TYPES.WORK,
      emoji: '🌱',
      text: TEXT.work(author),
      createdAt: w.created_at,
      userId: w.user_id,
      avatar: profileCache.get(w.user_id)?.avatar_url || null,
      name: author,
      meta: { workId: w.id, title: w.title },
    }));
  }

  for (const e of exps) {
    const author = displayName(profileCache.get(e.user_id));
    events.push(makeEvent({
      id: `exp-${e.id}`,
      type: TICKER_EVENT_TYPES.EXPERIENCE,
      emoji: '✨',
      text: TEXT.experience(author, e.title),
      createdAt: e.created_at,
      userId: e.user_id,
      avatar: profileCache.get(e.user_id)?.avatar_url || null,
      name: author,
      meta: { experienceId: e.id },
    }));
  }

  for (const i of invs) {
    const author = displayName(profileCache.get(i.user_id));
    const title  = i.title || i.text || '';
    events.push(makeEvent({
      id: `inv-${i.id}`,
      type: TICKER_EVENT_TYPES.INVITATION,
      emoji: '📣',
      text: TEXT.invitation(author, title),
      createdAt: i.created_at,
      userId: i.user_id,
      avatar: profileCache.get(i.user_id)?.avatar_url || null,
      name: author,
      meta: { invitationId: i.id },
    }));
  }

  for (const t of talents) {
    const author = displayName(profileCache.get(t.user_id));
    events.push(makeEvent({
      id: `talent-${t.id}`,
      type: TICKER_EVENT_TYPES.TALENT,
      emoji: '⭐',
      text: TEXT.talent(author, t.title),
      createdAt: t.created_at,
      userId: t.user_id,
      avatar: profileCache.get(t.user_id)?.avatar_url || null,
      name: author,
      meta: { talentId: t.id },
    }));
  }

  return events.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, MAX_EVENTS);
}

// ─── Hook ────────────────────────────────────────────────────────────────────
/**
 * @param {object} [options]
 * @param {object} [options.filters] — Erweiterungspunkt (Radius, Interessen, userId)
 * @param {boolean} [options.enabled=true]
 */
export function useLiveTicker({ filters = {}, enabled = true } = {}) {
  const [events, setEvents]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [isRealtime, setRealtime] = useState(true);
  const mountedRef                = useRef(true);
  const pollRef                   = useRef(null);
  const prevPoolEurRef              = useRef(null);
  const filtersRef                = useRef(filters);

  const { totalEur, fmtTotal, loading: poolLoading } = useStripeImpactPool();

  filtersRef.current = filters;

  const addEvent = useCallback((ev) => {
    if (!mountedRef.current || !ev) return;
    setEvents((prev) => upsertEvents(prev, [ev]));
  }, []);

  const buildVoteEvent = useCallback(async (vote) => {
    if (!vote?.id) return null;
    await loadProfiles([vote.voter_id]);
    let projectName = 'ein Projekt';
    if (vote.project_id) {
      const { data } = await supabase
        .from('impact_applications')
        .select('project_name')
        .eq('id', vote.project_id)
        .maybeSingle();
      projectName = data?.project_name || projectName;
    }
    const voter = displayName(profileCache.get(vote.voter_id));
    return makeEvent({
      id: `vote-${vote.id}`,
      type: TICKER_EVENT_TYPES.IMPACT_VOTE,
      emoji: '💚',
      text: TEXT.impactVote(voter, projectName),
      createdAt: vote.created_at || new Date().toISOString(),
      userId: vote.voter_id,
      avatar: profileCache.get(vote.voter_id)?.avatar_url || null,
      name: voter,
      meta: { projectId: vote.project_id },
    });
  }, []);

  const buildUserContentEvent = useCallback(async (row, type) => {
    if (!row?.id) return null;
    await loadProfiles([row.user_id]);
    const author = displayName(profileCache.get(row.user_id));
    const base = {
      createdAt: row.created_at || new Date().toISOString(),
      userId: row.user_id,
      avatar: profileCache.get(row.user_id)?.avatar_url || null,
      name: author,
    };

    switch (type) {
      case TICKER_EVENT_TYPES.WORK:
        return makeEvent({
          ...base,
          id: `work-${row.id}`,
          type,
          emoji: '🌱',
          text: TEXT.work(author),
          meta: { workId: row.id, title: row.title },
        });
      case TICKER_EVENT_TYPES.EXPERIENCE:
        return makeEvent({
          ...base,
          id: `exp-${row.id}`,
          type,
          emoji: '✨',
          text: TEXT.experience(author, row.title),
          meta: { experienceId: row.id },
        });
      case TICKER_EVENT_TYPES.INVITATION:
        return makeEvent({
          ...base,
          id: `inv-${row.id}`,
          type,
          emoji: '📣',
          text: TEXT.invitation(author, row.title || row.text || ''),
          meta: { invitationId: row.id },
        });
      case TICKER_EVENT_TYPES.TALENT:
        return makeEvent({
          ...base,
          id: `talent-${row.id}`,
          type,
          emoji: '⭐',
          text: TEXT.talent(author, row.title),
          meta: { talentId: row.id },
        });
      case TICKER_EVENT_TYPES.IMPACT_PROJECT:
        return makeEvent({
          ...base,
          id: `app-${row.id}`,
          type,
          emoji: '🎨',
          text: TEXT.impactProject(row.project_name || 'ein Herzensprojekt'),
          createdAt: row.reviewed_at || row.created_at,
          meta: { applicationId: row.id },
        });
      default:
        return null;
    }
  }, []);

  // ── Initial Fetch ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) { setLoading(false); return; }
    mountedRef.current = true;
    let dead = false;

    (async () => {
      try {
        const initial = await fetchInitialTickerEvents();
        if (!dead) setEvents(initial);
      } catch (_) { /* silent */ }
      finally {
        if (!dead) setLoading(false);
      }
    })();

    return () => { dead = true; mountedRef.current = false; };
  }, [enabled]);

  // ── Pool-Wachstum via useStripeImpactPool (kein eigener Channel) ───────────
  useEffect(() => {
    if (!enabled || poolLoading) return;
    if (prevPoolEurRef.current === null) {
      prevPoolEurRef.current = totalEur;
      return;
    }
    if (totalEur > prevPoolEurRef.current) {
      addEvent(makeEvent({
        id: `pool-${Date.now()}`,
        type: TICKER_EVENT_TYPES.POOL_GROWTH,
        emoji: '🌊',
        text: TEXT.poolGrowth(fmtTotal),
        createdAt: new Date().toISOString(),
        meta: { totalEur },
      }));
    }
    prevPoolEurRef.current = totalEur;
  }, [enabled, totalEur, fmtTotal, poolLoading, addEvent]);

  // ── votes_rt_main via Shared Bus ───────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;
    return subscribeVotesRealtime(async (payload) => {
      const ev = await buildVoteEvent(payload.new);
      if (ev) addEvent(ev);
    });
  }, [enabled, buildVoteEvent, addEvent]);

  // ── Liveticker-Channel via Shared Bus ──────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;

    const TABLE_TYPE = {
      works: TICKER_EVENT_TYPES.WORK,
      experiences: TICKER_EVENT_TYPES.EXPERIENCE,
      invitations: TICKER_EVENT_TYPES.INVITATION,
      talents: TICKER_EVENT_TYPES.TALENT,
      impact_applications: TICKER_EVENT_TYPES.IMPACT_PROJECT,
    };

    const unsubRt = subscribeLivetickerRealtime(async (table, row) => {
      const type = TABLE_TYPE[table];
      if (!type) return;
      const ev = await buildUserContentEvent(row, type);
      if (ev) addEvent(ev);
    });

    const unsubStatus = subscribeLivetickerStatus((status) => {
      if (status === 'CHANNEL_ERROR') {
        setRealtime(false);
        if (!pollRef.current) {
          pollRef.current = setInterval(async () => {
            try {
              const fresh = await fetchInitialTickerEvents();
              if (mountedRef.current) setEvents(fresh);
            } catch (_) { /* silent */ }
          }, POLL_FALLBACK_MS);
        }
      } else if (status === 'SUBSCRIBED') {
        setRealtime(true);
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      }
    });

    return () => {
      unsubRt();
      unsubStatus();
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [enabled, buildUserContentEvent, addEvent]);

  const visibleEvents = useMemo(() => {
    // Erweiterungspunkt: filtersRef für Radius/Interessen/Personalisierung
    void filtersRef.current;
    return events;
  }, [events]);

  return {
    events: visibleEvents,
    loading,
    isRealtime,
    isEmpty: !loading && visibleEvents.length === 0,
  };
}

export default useLiveTicker;
