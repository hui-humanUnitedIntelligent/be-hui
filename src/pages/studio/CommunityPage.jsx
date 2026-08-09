// ══════════════════════════════════════════════════════════════════════════════
// CommunityPage.jsx — HUI V7.5 — Ein gemeinsamer Lebensraum
// ══════════════════════════════════════════════════════════════════════════════
//
// Die Community ist kein soziales Netzwerk.
// Sie ist ein gemeinsamer Lebensraum.
// Sie funktioniert nicht nach Aufmerksamkeit, Likes, Reichweite oder Trends.
// Sie funktioniert nach Nähe, Resonanz, gegenseitiger Unterstützung und
// gemeinsamer Wirkung.
// Menschen sollen sich hier willkommen fühlen und nicht bewertet.
//
// KEINE Follower-Zahlen.
// KEINE Leaderboards.
// KEINE Trending-Listen.
//
// DATEN: Supabase (profiles, conversations, recommendations, impact_votes,
//        creator_supports, feed_items)
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient.js';
import { useAuth } from '../../lib/AuthContext.jsx';
import { formatDateDE } from "../../lib/formatters.js";

const C = {
  cream: '#F9F7F4', white: '#FFFFFF', ink: '#1A1A1A',
  muted: 'rgba(80,80,80,0.55)', teal: '#16D7C5', coral: '#FF8A6B',
  green: '#10B981', border: 'rgba(0,0,0,0.06)',
};

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

export default function CommunityPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeMembers, setActiveMembers] = useState([]);
  const [recentSupports, setRecentSupports] = useState([]);
  const [recentRecommendations, setRecentRecommendations] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [totalMembers, setTotalMembers] = useState(0);
  const [convPersons, setConvPersons] = useState({});

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    // Parallel: alle Daten für den gemeinsamen Lebensraum
    const [
      membersRes, supportsRes, recsRes, convsRes, countRes
    ] = await Promise.all([
      // Aktive Mitglieder — die letzten 12 mit activity (nicht nach followers sortiert)
      supabase.from('profiles')
        .select('id, display_name, avatar_url, role, is_talent, is_ambassador, membership_active, updated_at')
        .eq('membership_active', true)
        .order('updated_at', { ascending: false })
        .limit(12),

      // Gemeinsame Unterstützung — die letzten 5 Supports im Dachverband
      supabase.from('creator_supports')
        .select('id, amount, created_at, message, supporter:supporter_id(id, display_name, avatar_url), creator:creator_id(id, display_name, avatar_url)')
        .order('created_at', { ascending: false })
        .limit(5),

      // Resonanz — öffentliche Empfehlungen
      supabase.from('recommendations')
        .select('id, text, created_at, from_user_id, to_user_id')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(5),

      // Begegnungen — eigene Konversationen
      supabase.from('conversations')
        .select('id, participant_a, participant_b, last_message_at, last_message_text, unread_count_a, unread_count_b')
        .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
        .order('last_message_at', { ascending: false })
        .limit(5),

      // Gesamtzahl aktiver Mitglieder
      supabase.from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('membership_active', true),
    ]);

    setActiveMembers(membersRes.data || []);
    setRecentSupports(supportsRes.data || []);
    setRecentRecommendations(recsRes.data || []);
    const convs = convsRes.data || [];
    setConversations(convs);
    setTotalMembers(countRes.count || 0);

    // Batch-Fetch: alle Profile der Konversationspartner in einer Query
    const otherIds = convs.map(c =>
      c.participant_a === user.id ? c.participant_b : c.participant_a
    ).filter(Boolean);
    if (otherIds.length > 0) {
      const personsRes = await supabase.from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', otherIds);
      const personsMap = {};
      (personsRes.data || []).forEach(p => { personsMap[p.id] = p; });
      setConvPersons(personsMap);
    }

    setLoading(false);
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={{
      padding: '40px 32px', maxWidth: 680,
      fontFamily: "Inter, sans-serif",
    }}>
      {/* Einleitung */}
      <h2 style={{ fontSize: 24, fontWeight: 700, color: C.ink, marginBottom: 8 }}>
        Gemeinsam
      </h2>
      <p style={{ fontSize: 15, color: C.muted, marginBottom: 8, lineHeight: 1.7 }}>
        Ein gemeinsamer Lebensraum. Keine Bühne, kein Wettbewerb.
        Hier begegnest du Menschen, die etwas bewegen — und die du kennenlernen kannst.
      </p>
      {totalMembers > 0 && (
        <p style={{ fontSize: 13, color: C.muted, marginBottom: 32 }}>
          {totalMembers} {totalMembers === 1 ? 'Mitglied ist aktiv' : 'Mitglieder sind aktiv'} im Dachverband.
        </p>
      )}

      {loading ? (
        <p style={{ color: C.muted, fontSize: 14 }}>Lade den Lebensraum…</p>
      ) : (
        <>
          {/* ═══ Wer ist da ═══ */}
          {activeMembers.length > 0 && (
            <Section title="Wer ist da" hint="Menschen, die kürzlich aktiv waren.">
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: 12,
              }}>
                {activeMembers.filter(m => m.id !== user?.id).slice(0, 8).map(member => (
                  <MemberCard key={member.id} member={member} />
                ))}
              </div>
            </Section>
          )}

          {/* ═══ Gemeinsame Wirkung ═══ */}
          {recentSupports.length > 0 && (
            <Section title="Was gemeinsam gewächst ist" hint="Menschen, die einander unterstützt haben.">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {recentSupports.map(s => (
                  <SupportMoment key={s.id} support={s} />
                ))}
              </div>
            </Section>
          )}

          {/* ═══ Resonanz ═══ */}
          {recentRecommendations.length > 0 && (
            <Section title="Was Menschen einander sagen" hint="Echtes Feedback, keine Bewertungen.">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {recentRecommendations.map(r => (
                  <ResonanceCard key={r.id} recommendation={r} />
                ))}
              </div>
            </Section>
          )}

          {/* ═══ Begegnungen ═══ */}
          {conversations.length > 0 && (
            <Section title="Deine Begegnungen" hint="Menschen, mit denen du im Gespräch bist.">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {conversations.map(c => {
                  const otherId = c.participant_a === user?.id ? c.participant_b : c.participant_a;
                  const unread = c.participant_a === user?.id ? c.unread_count_a : c.unread_count_b;
                  return (
                    <ConversationRow
                      key={c.id}
                      otherId={otherId}
                      person={convPersons[otherId]}
                      lastMessage={c.last_message_text}
                      lastAt={c.last_message_at}
                      unread={unread || 0}
                    />
                  );
                })}
              </div>
            </Section>
          )}

          {/* ═══ Leere Community ═══ */}
          {activeMembers.length === 0 && recentSupports.length === 0 &&
           recentRecommendations.length === 0 && conversations.length === 0 && (
            <div style={{
              padding: '32px', borderRadius: 16, background: C.white,
              border: `1px solid ${C.border}`, textAlign: 'center',
            }}>
              <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.7, marginBottom: 0 }}>
                Der Lebensraum wächst mit jedem Menschen, der dazu kommt.
                Schreibe Mitgliedern, unterstützt Projekte, teilt eure Erfahrungen —
                Gemeinschaft entsteht durch Begegnung.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Section ──────────────────────────────────────────────────────────
function Section({ title, hint, children }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <h3 style={{ fontSize: 16, fontWeight: 600, color: C.ink, marginBottom: 4 }}>
        {title}
      </h3>
      {hint && (
        <p style={{ fontSize: 13, color: C.muted, marginBottom: 16, lineHeight: 1.5 }}>{hint}</p>
      )}
      {children}
    </div>
  );
}

// ── Mitgliedskarte ───────────────────────────────────────────────────
function MemberCard({ member }) {
  const roleLabel = member.is_talent ? 'Talent' : member.is_ambassador ? 'Ambassador' : 'Mitglied';

  return (
    <div style={{
      padding: '16px', borderRadius: 14, background: C.white,
      border: `1px solid ${C.border}`, textAlign: 'center',
    }}>
      {member.avatar_url ? (
        <img
          src={member.avatar_url}
          alt=""
          style={{
            width: 48, height: 48, borderRadius: '50%',
            objectFit: 'cover', margin: '0 auto 10px', display: 'block',
          }}
        />
      ) : (
        <div style={{
          width: 48, height: 48, borderRadius: '50%', background: C.cream,
          margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, color: C.muted,
        }}>
          {(member.display_name || '?')[0]}
        </div>
      )}
      <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, marginBottom: 2 }}>
        {member.display_name || 'Mitglied'}
      </div>
      <div style={{ fontSize: 11, color: C.muted }}>
        {roleLabel}
      </div>
    </div>
  );
}

// ── Unterstützungs-Moment ────────────────────────────────────────────
function SupportMoment({ support }) {
  const supporterName = support.supporter?.display_name || 'Jemand';
  const creatorName = support.creator?.display_name || 'ein Talent';

  return (
    <div style={{
      padding: '16px', borderRadius: 12, background: C.white,
      border: `1px solid ${C.border}`,
    }}>
      <p style={{ fontSize: 14, color: C.ink, marginBottom: 4, lineHeight: 1.5 }}>
        <strong style={{ fontWeight: 600 }}>{supporterName}</strong> unterstützt{' '}
        <strong style={{ fontWeight: 600 }}>{creatorName}</strong>
      </p>
      {support.message && (
        <p style={{
          fontSize: 13, color: C.muted, fontStyle: 'italic',
          lineHeight: 1.5, marginBottom: 4,
        }}>"{support.message}"</p>
      )}
      <div style={{ fontSize: 12, color: C.muted }}>
        {relativeTime(support.created_at)}
      </div>
    </div>
  );
}

// ── Resonanz-Karte ───────────────────────────────────────────────────
function ResonanceCard({ recommendation }) {
  return (
    <div style={{
      padding: '16px', borderRadius: 12, background: C.white,
      border: `1px solid ${C.border}`,
    }}>
      <p style={{
        fontSize: 14, color: C.ink, lineHeight: 1.6, marginBottom: 8,
        fontStyle: 'italic',
      }}>"{recommendation.text}"</p>
      <div style={{ fontSize: 12, color: C.muted }}>
        {relativeTime(recommendation.created_at)}
      </div>
    </div>
  );
}

// ── Begegnungs-Zeile ─────────────────────────────────────────────────
function ConversationRow({ person, lastMessage, lastAt, unread }) {
  const otherName = person?.display_name || 'Mitglied';
  const otherAvatar = person?.avatar_url || null;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 16px', borderRadius: 12, background: C.white,
      border: `1px solid ${C.border}`,
    }}>
      {otherAvatar ? (
        <img src={otherAvatar} alt="" style={{
          width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0,
        }} />
      ) : (
        <div style={{
          width: 36, height: 36, borderRadius: '50%', background: C.cream,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, color: C.muted, flexShrink: 0,
        }}>{otherName[0]}</div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>
          {otherName}
        </div>
        {lastMessage && (
          <div style={{
            fontSize: 12, color: C.muted,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{lastMessage}</div>
        )}
      </div>
      {unread > 0 && (
        <span style={{
          background: C.teal, color: '#fff', fontSize: 10, fontWeight: 700,
          padding: '2px 7px', borderRadius: 10, flexShrink: 0,
        }}>{unread}</span>
      )}
      <div style={{ fontSize: 11, color: C.muted, flexShrink: 0 }}>
        {lastAt ? relativeTime(lastAt) : ''}
      </div>
    </div>
  );
}
