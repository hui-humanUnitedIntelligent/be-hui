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
// DATEN: Supabase (profiles, chats, chat_participants, recommendations,
//        project_support, impact_applications, feed_items)
//
// FIX 2026-08-12: conversations→chats, creator_supports→project_support,
// participant_a/b→participant_ids[], unread_count→chat_participants.last_read_at
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient.js';
import { useAuth } from '../../lib/AuthContext.jsx';
import { useChatList } from '../../lib/chatContext.js';
import { formatDateDE } from "../../lib/formatters.js";
import { HUI } from "../../design/hui.design.js";

const C = {
  cream: HUI.COLOR.creamStudio, white: HUI.COLOR.white, ink: HUI.COLOR.inkStudio,
  muted: 'rgba(80,80,80,0.55)', teal: HUI.COLOR.tealStudio, coral: HUI.COLOR.coralStudio,
  green: HUI.COLOR.greenStatus, border: 'rgba(0,0,0,0.06)',
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
  // useChatList übernimmt das korrekte Laden der chats-Tabelle inkl.
  // participant_ids, last_message, unread-count via chat_participants
  const { chats: conversations, loading: chatsLoading } = useChatList("community");

  const [loading, setLoading] = useState(true);
  const [activeMembers, setActiveMembers] = useState([]);
  const [recentSupports, setRecentSupports] = useState([]);
  const [recentRecommendations, setRecentRecommendations] = useState([]);
  const [totalMembers, setTotalMembers] = useState(0);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    // Parallel: alle Daten für den gemeinsamen Lebensraum
    const [
      membersRes, supportsRes, recsRes, countRes
    ] = await Promise.all([
      // Aktive Mitglieder — die letzten 12 mit activity (nicht nach followers sortiert)
      supabase.from('profiles')
        .select('id, display_name, avatar_url, role, is_talent, membership_active, updated_at')
        .eq('membership_active', true)
        .order('updated_at', { ascending: false })
        .limit(12),

      // Gemeinsame Unterstützung — die letzten 5 Supports
      // Tabelle: project_support (nicht creator_supports — existiert nicht)
      // Spalten: user_id (Supporter), project_id (→ impact_applications.id),
      //          amount_eur (nicht amount), message, created_at
      supabase.from('project_support')
        .select('id, amount_eur, message, created_at, user_id, project_id, anonymous')
        .order('created_at', { ascending: false })
        .limit(5),

      // Resonanz — öffentliche Empfehlungen
      supabase.from('recommendations')
        .select('id, text, created_at, from_user_id, to_user_id')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(5),

      // Gesamtzahl aktiver Mitglieder
      supabase.from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('membership_active', true),
    ]);

    setActiveMembers(membersRes.data || []);
    setRecentRecommendations(recsRes.data || []);
    setTotalMembers(countRes.count || 0);

    // ── Supports anreichern: Supporter + Creator Profile laden ──
    const rawSupports = supportsRes.data || [];
    if (rawSupports.length > 0) {
      // 1. Alle Supporter-IDs sammeln
      const supporterIds = [...new Set(rawSupports.map(s => s.user_id).filter(Boolean))];

      // 2. Alle Projekt-IDs sammeln → impact_applications für Creator user_id
      const projectIds = [...new Set(rawSupports.map(s => s.project_id).filter(Boolean))];

      // Parallel: Supporter-Profile + Projekt-Creator-IDs laden
      const [supportersRes, projectsRes] = await Promise.all([
        supporterIds.length > 0
          ? supabase.from('profiles')
              .select('id, display_name, avatar_url')
              .in('id', supporterIds)
          : Promise.resolve({ data: [] }),

        projectIds.length > 0
          ? supabase.from('impact_applications')
              .select('id, user_id')
              .in('id', projectIds)
          : Promise.resolve({ data: [] }),
      ]);

      // 3. Creator-Profile laden (aus impact_applications.user_id)
      const creatorIds = [...new Set(
        (projectsRes.data || []).map(p => p.user_id).filter(Boolean)
      )];
      const creatorsRes = creatorIds.length > 0
        ? await supabase.from('profiles')
            .select('id, display_name, avatar_url')
            .in('id', creatorIds)
        : { data: [] };

      // 4. Maps aufbauen
      const supporterMap = {};
      (supportersRes.data || []).forEach(p => { supporterMap[p.id] = p; });

      const projectCreatorMap = {};
      (projectsRes.data || []).forEach(p => {
        if (p.user_id) projectCreatorMap[p.id] = p.user_id;
      });

      const creatorMap = {};
      (creatorsRes.data || []).forEach(p => { creatorMap[p.id] = p; });

      // 5. Supports anreichern
      const enrichedSupports = rawSupports.map(s => {
        const supporter = supporterMap[s.user_id] || null;
        const creatorId = projectCreatorMap[s.project_id] || null;
        const creator = creatorId ? (creatorMap[creatorId] || null) : null;
        return {
          ...s,
          amount: s.amount_eur, // Alias für SupportMoment-Komponente
          supporter: s.anonymous ? { display_name: 'Anonym' } : supporter,
          creator,
        };
      });
      setRecentSupports(enrichedSupports);
    } else {
      setRecentSupports([]);
    }

    setLoading(false);
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  // Conversations aus useChatList übernehmen (korrektes Schema)
  const displayConversations = conversations.slice(0, 5);

  return (
    <div style={{
      padding: '40px 32px', maxWidth: 680,
      fontFamily: "Inter, sans-serif",
    }}>
      {/* Einleitung */}
      <h2 style={{ fontSize: 24, fontWeight: 600, color: C.ink, marginBottom: 8 }}>
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
          {displayConversations.length > 0 && (
            <Section title="Deine Begegnungen" hint="Menschen, mit denen du im Gespräch bist.">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {displayConversations.map(c => (
                  <ConversationRow
                    key={c.id}
                    person={c.other_profile}
                    lastMessage={c.last_message}
                    lastAt={c.last_message_at}
                    unread={c.unread || 0}
                  />
                ))}
              </div>
            </Section>
          )}

          {/* ═══ Leere Community ═══ */}
          {activeMembers.length === 0 && recentSupports.length === 0 &&
           recentRecommendations.length === 0 && displayConversations.length === 0 && (
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
function Section({ title = "", hint = "", children }) {
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
function MemberCard({ member = {} }) {
  const roleLabel = member.is_talent ? 'Talent' : 'Mitglied';

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
function SupportMoment({ support = {} }) {
  const supporterName = support.supporter?.display_name || 'Jemand';
  const creatorName = support.creator?.display_name || 'ein Projekt';

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
function ResonanceCard({ recommendation = {} }) {
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
function ConversationRow({ person = null, lastMessage = "", lastAt = null, unread = 0 }) {
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
          background: C.teal, color: '#fff', fontSize: 10, fontWeight: 600,
          padding: '2px 7px', borderRadius: 10, flexShrink: 0,
        }}>{unread}</span>
      )}
      <div style={{ fontSize: 11, color: C.muted, flexShrink: 0 }}>
        {lastAt ? relativeTime(lastAt) : ''}
      </div>
    </div>
  );
}
