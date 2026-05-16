// src/services/db.js
// ══════════════════════════════════════════════════════════════
// HUI Core Database Service Layer
// 
// RÈGLES:
//  • Kein direktes supabase.from() in React-Components
//  • Alle Queries laufen durch diesen Service
//  • Jede Methode: safeQuery + FIELDS + limit
//  • Promise.all für parallele Queries
//  • Kein select("*") — nur explizite Felder
// ══════════════════════════════════════════════════════════════

import { supabase } from '../lib/supabaseClient';
import { safeQuery, cachedQuery, FIELDS, PAGE_SIZE, buildPage } from '../lib/perfUtils';

// ─── FIELDS (vollständig, kein select *) ─────────────────────
const F = {
  profile:      'id,display_name,username,avatar_url,header_img,bio,is_wirker,has_talent_profile,focus_type,talent,location_label,is_available,impact_eur,follower_count,profile_views,created_at',
  profileMin:   'id,display_name,username,avatar_url,is_wirker,has_talent_profile,talent,location_label',
  wirker:       'id,user_id,slug,talent,categories,location_label,avatar_url,header_img,hourly_rate,is_verified,rating_avg,booking_count',
  wirkerMin:    'id,user_id,slug,talent,location_label,avatar_url,is_verified',
  work:         'id,user_id,title,cover_url,media_url,price,category,medium,status,likes_count,location_text,created_at',
  experience:   'id,user_id,title,cover_url,price,duration,spots_available,location_text,status,created_at',
  story:        'id,user_id,media_url,media_type,text_overlay,mood,location,expires_at,views_count,created_at',
  booking:      'id,user_id,wirker_id,work_id,experience_id,amount,platform_fee,impact_fee,status,payment_status,escrow_status,created_at',
  message:      'id,conversation_id,sender_id,text,created_at,read,type',
  conversation: 'id,participant_a,participant_b,booking_id,last_message_at,last_message_text,unread_count_a,unread_count_b',
  impactProject:'id,name,category,description,icon,color,votes,status,goal_eur,awarded_eur,month,website,tags,contact_name',
  impactRound:  'id,month,status,pool_eur,winner_project_id,voting_ends_at,distributed_at',
  impactVote:   'id,user_id,project_id,round_id,weight,created_at',
  recommendation:'id,wirker_id,reviewer_id,reviewer_name,rating,text,work_title,booking_id,created_at',
  membership:   'id,user_id,membership_type,status,vote_weight,started_at,expires_at',
  matchScore:   'id,user_id,target_user_id,score,categories,updated_at',
};

// ─── PROFILES ────────────────────────────────────────────────
export const ProfileService = {
  async getById(id) {
    return cachedQuery(`profile:${id}`,
      () => safeQuery(supabase.from('profiles').select(F.profile).eq('id', id).single()),
      60_000
    );
  },

  async getByUsername(username) {
    return cachedQuery(`profile:@${username}`,
      () => safeQuery(supabase.from('profiles').select(F.profile).eq('username', username).single()),
      60_000
    );
  },

  async update(id, updates) {
    const { data, error } = await safeQuery(
      supabase.from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id).select(F.profile).single()
    );
    if (!error) {
      // Invalidate cache
      const { clearQueryCache } = await import('../lib/perfUtils');
      clearQueryCache(`profile:${id}`);
    }
    return { data, error };
  },

  async upsert(id, data) {
    return safeQuery(
      supabase.from('profiles')
        .upsert({ id, ...data, updated_at: new Date().toISOString() })
        .select(F.profile).single()
    );
  },
};

// ─── MEMBERSHIPS ─────────────────────────────────────────────
export const MembershipService = {
  async getForUser(userId) {
    return cachedQuery(`membership:${userId}`,
      () => safeQuery(
        supabase.from('memberships').select(F.membership)
          .eq('user_id', userId).eq('status', 'active').single()
      ), 120_000
    );
  },

  // Vote weight: Mitglied/Wirker = 2, Basisuser = 1
  getVoteWeight(membership) {
    if (!membership) return 1;
    return membership.vote_weight || (
      ['member', 'wirker', 'talent'].includes(membership.membership_type) ? 2 : 1
    );
  },

  async create(userId, type = 'member') {
    return safeQuery(
      supabase.from('memberships').insert({
        user_id: userId,
        membership_type: type,
        status: 'active',
        vote_weight: type === 'basisuser' ? 1 : 2,
        started_at: new Date().toISOString(),
      }).select(F.membership).single()
    );
  },
};

// ─── TALENT PROFILES (Wirker) ─────────────────────────────────
export const TalentService = {
  async getByUserId(userId) {
    return cachedQuery(`talent:${userId}`,
      () => safeQuery(
        supabase.from('wirker_profiles').select(F.wirker).eq('user_id', userId).single()
      ), 60_000
    );
  },

  async getBySlug(slug) {
    return cachedQuery(`talent:slug:${slug}`,
      () => safeQuery(
        supabase.from('wirker_profiles').select(F.wirker).eq('slug', slug).single()
      ), 60_000
    );
  },

  async list({ page = 0, category = null, location = null } = {}) {
    let q = supabase.from('wirker_profiles').select(F.wirker)
      .order('booking_count', { ascending: false });
    if (category) q = q.contains('categories', [category]);
    if (location) q = q.ilike('location_label', `%${location}%`);
    return safeQuery(buildPage(q, page));
  },

  async update(userId, updates) {
    const { data, error } = await safeQuery(
      supabase.from('wirker_profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('user_id', userId).select(F.wirker).single()
    );
    if (!error) {
      const { clearQueryCache } = await import('../lib/perfUtils');
      clearQueryCache(`talent:${userId}`);
    }
    return { data, error };
  },

  async create(userId, data) {
    const slug = (data.talent || 'wirker')
      .toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      + '-' + Math.random().toString(36).slice(2, 6);
    return safeQuery(
      supabase.from('wirker_profiles')
        .insert({ user_id: userId, slug, ...data })
        .select(F.wirker).single()
    );
  },
};

// ─── WORKS ───────────────────────────────────────────────────
export const WorkService = {
  async getByUser(userId, page = 0) {
    return safeQuery(buildPage(
      supabase.from('works').select(F.work)
        .eq('user_id', userId).eq('status', 'published')
        .order('created_at', { ascending: false }),
      page
    ));
  },

  async getById(id) {
    return cachedQuery(`work:${id}`,
      () => safeQuery(supabase.from('works').select(F.work).eq('id', id).single()),
      30_000
    );
  },

  async create(userId, data) {
    return safeQuery(
      supabase.from('works')
        .insert({ user_id: userId, status: 'draft', ...data })
        .select(F.work).single()
    );
  },

  async update(id, updates) {
    return safeQuery(
      supabase.from('works')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id).select(F.work).single()
    );
  },

  async publish(id) {
    return WorkService.update(id, { status: 'published' });
  },

  async delete(id) {
    return safeQuery(supabase.from('works').update({ status: 'archived' }).eq('id', id));
  },
};

// ─── EXPERIENCES ─────────────────────────────────────────────
export const ExperienceService = {
  async getByUser(userId, page = 0) {
    return safeQuery(buildPage(
      supabase.from('experiences').select(F.experience)
        .eq('user_id', userId).eq('status', 'published')
        .order('created_at', { ascending: false }),
      page
    ));
  },

  async getById(id) {
    return cachedQuery(`exp:${id}`,
      () => safeQuery(supabase.from('experiences').select(F.experience).eq('id', id).single()),
      30_000
    );
  },

  async create(userId, data) {
    return safeQuery(
      supabase.from('experiences')
        .insert({ user_id: userId, status: 'draft', ...data })
        .select(F.experience).single()
    );
  },

  async update(id, updates) {
    return safeQuery(
      supabase.from('experiences')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id).select(F.experience).single()
    );
  },
};

// ─── STORIES ─────────────────────────────────────────────────
export const StoryService = {
  async getActive(userIds = []) {
    const now = new Date().toISOString();
    let q = supabase.from('stories').select(F.story)
      .gt('expires_at', now).order('created_at', { ascending: false }).limit(50);
    if (userIds.length > 0) q = q.in('user_id', userIds);
    return safeQuery(q);
  },

  async getByUser(userId) {
    const now = new Date().toISOString();
    return safeQuery(
      supabase.from('stories').select(F.story)
        .eq('user_id', userId).gt('expires_at', now)
        .order('created_at', { ascending: false }).limit(20)
    );
  },

  async create(userId, mediaUrl, mediaType, options = {}) {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    return safeQuery(
      supabase.from('stories').insert({
        user_id: userId,
        media_url: mediaUrl,
        media_type: mediaType,
        expires_at: expiresAt,
        ...options,
      }).select(F.story).single()
    );
  },

  async markViewed(storyId, userId) {
    // Fire & forget — no await needed for view tracking
    supabase.from('story_views').upsert({
      story_id: storyId, viewer_id: userId, viewed_at: new Date().toISOString()
    }).then(() => {});
  },
};

// ─── BOOKINGS ────────────────────────────────────────────────
export const BookingService = {
  async getByUser(userId, page = 0) {
    return safeQuery(buildPage(
      supabase.from('bookings').select(F.booking)
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      page
    ));
  },

  async getByWirker(wirkerId, page = 0) {
    return safeQuery(buildPage(
      supabase.from('bookings').select(F.booking)
        .eq('wirker_id', wirkerId)
        .order('created_at', { ascending: false }),
      page
    ));
  },

  async getById(id) {
    return safeQuery(
      supabase.from('bookings').select(F.booking).eq('id', id).single()
    );
  },

  async create(data) {
    return safeQuery(
      supabase.from('bookings').insert({
        ...data,
        status: 'pending',
        payment_status: 'pending',
        escrow_status: 'held',
      }).select(F.booking).single()
    );
  },

  async updateStatus(id, status) {
    return safeQuery(
      supabase.from('bookings')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id).select(F.booking).single()
    );
  },

  async releaseEscrow(id) {
    return safeQuery(
      supabase.from('bookings')
        .update({
          escrow_status: 'released',
          payment_status: 'paid',
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id).select(F.booking).single()
    );
  },
};

// ─── CONVERSATIONS / MESSAGES ─────────────────────────────────
export const ChatService = {
  async getConversations(userId) {
    return safeQuery(
      supabase.from('conversations').select(F.conversation)
        .or(`participant_a.eq.${userId},participant_b.eq.${userId}`)
        .order('last_message_at', { ascending: false }).limit(30)
    );
  },

  async getOrCreateConversation(userA, userB, bookingId = null) {
    // Check existing
    const { data: existing } = await safeQuery(
      supabase.from('conversations')
        .select('id')
        .or(`and(participant_a.eq.${userA},participant_b.eq.${userB}),and(participant_a.eq.${userB},participant_b.eq.${userA})`)
        .single()
    );
    if (existing) return { data: existing, error: null };
    // Create new
    return safeQuery(
      supabase.from('conversations').insert({
        participant_a: userA,
        participant_b: userB,
        booking_id: bookingId,
        last_message_at: new Date().toISOString(),
      }).select(F.conversation).single()
    );
  },

  async getMessages(conversationId, page = 0) {
    return safeQuery(buildPage(
      supabase.from('messages').select(F.message)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true }),
      page, 50
    ));
  },

  async sendMessage(conversationId, senderId, text, type = 'text') {
    const [msgResult] = await Promise.all([
      safeQuery(
        supabase.from('messages').insert({
          conversation_id: conversationId,
          sender_id: senderId,
          text, type,
        }).select(F.message).single()
      ),
      // Update conversation metadata
      safeQuery(
        supabase.from('conversations').update({
          last_message_at: new Date().toISOString(),
          last_message_text: text.slice(0, 100),
        }).eq('id', conversationId)
      ),
    ]);
    return msgResult;
  },

  async markRead(conversationId, userId) {
    // Fire & forget
    supabase.from('messages')
      .update({ read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .eq('read', false)
      .then(() => {});
  },
};

// ─── IMPACT SYSTEM ───────────────────────────────────────────
export const ImpactService = {
  async getActiveProjects() {
    return cachedQuery('impact:active',
      () => safeQuery(
        supabase.from('impact_projects').select(F.impactProject)
          .eq('status', 'active').order('votes', { ascending: false }).limit(20)
      ), 30_000
    );
  },

  async getCurrentRound() {
    const month = new Date().toISOString().slice(0, 7); // YYYY-MM
    return cachedQuery(`impact:round:${month}`,
      () => safeQuery(
        supabase.from('impact_rounds').select(F.impactRound)
          .eq('month', month).eq('status', 'active').single()
      ), 60_000
    );
  },

  async getUserVotesThisRound(userId, roundId) {
    return safeQuery(
      supabase.from('impact_votes').select(F.impactVote)
        .eq('user_id', userId).eq('round_id', roundId).limit(10)
    );
  },

  // Vote weight: Mitglieder = 2, Basisuser = 1 (max 2 Stimmen/Monat)
  async castVote(userId, projectId, roundId, voteWeight = 1) {
    // Check existing votes this round
    const { data: existing } = await safeQuery(
      supabase.from('impact_votes').select('id,weight')
        .eq('user_id', userId).eq('round_id', roundId)
    );
    const totalUsed = (existing || []).reduce((s, v) => s + (v.weight || 1), 0);
    const maxVotes  = voteWeight >= 2 ? 2 : 1;

    if (totalUsed >= maxVotes) {
      return { data: null, error: { message: `Maximale Stimmen für diesen Monat erreicht (${maxVotes})` } };
    }

    // Already voted for THIS project?
    const alreadyVoted = (existing || []).some(v => v.project_id === projectId);
    if (alreadyVoted) {
      return { data: null, error: { message: 'Bereits für dieses Projekt abgestimmt' } };
    }

    return safeQuery(
      supabase.from('impact_votes').insert({
        user_id: userId,
        project_id: projectId,
        round_id: roundId,
        weight: 1, // each vote = 1 regardless of total weight
        created_at: new Date().toISOString(),
      }).select(F.impactVote).single()
    );
  },

  async getProjectById(id) {
    return cachedQuery(`impact:project:${id}`,
      () => safeQuery(
        supabase.from('impact_projects').select(F.impactProject).eq('id', id).single()
      ), 30_000
    );
  },

  async distributeRound(roundId) {
    // Logic: Winner gets full goal_eur, rest splits remaining pool
    // This should run server-side (Supabase Edge Function) — 
    // frontend call just triggers it
    return await safeQuery(
      supabase.rpc('distribute_impact_round', { round_id: roundId })
    );
  },
};

// ─── FEED ────────────────────────────────────────────────────
export const FeedService = {
  async getHomeFeed(page = 0, filters = {}) {
    const now = new Date().toISOString();
    let q = supabase.from('feed_items')
      .select('id,user_id,type,media_url,caption,likes_count,created_at,expires_at,work_id,experience_id')
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order('created_at', { ascending: false });

    if (filters.type)     q = q.eq('type', filters.type);
    if (filters.userIds)  q = q.in('user_id', filters.userIds);
    if (filters.category) q = q.eq('category', filters.category);

    return safeQuery(buildPage(q, page));
  },

  async getByUser(userId, page = 0) {
    return safeQuery(buildPage(
      supabase.from('feed_items')
        .select('id,user_id,type,media_url,caption,likes_count,created_at')
        .eq('user_id', userId).order('created_at', { ascending: false }),
      page
    ));
  },
};

// ─── MATCH SCORES ────────────────────────────────────────────
export const MatchService = {
  async getTopMatches(userId, limit = 20) {
    return cachedQuery(`match:${userId}`,
      () => safeQuery(
        supabase.from('user_match_scores').select(F.matchScore)
          .eq('user_id', userId)
          .order('score', { ascending: false })
          .limit(limit)
      ), 300_000 // 5min cache — scores change slowly
    );
  },

  // Scores werden via Supabase Edge Function vorberechnet
  // Frontend ruft nur gespeicherte Scores ab — kein live computation
  async triggerScoreUpdate(userId) {
    return safeQuery(supabase.rpc('compute_match_scores', { for_user_id: userId }));
  },
};

// ─── RECOMMENDATIONS ─────────────────────────────────────────
export const RecommendationService = {
  async getByWirker(wirkerId, page = 0) {
    return safeQuery(buildPage(
      supabase.from('recommendations').select(F.recommendation)
        .eq('wirker_id', wirkerId).order('created_at', { ascending: false }),
      page, 10
    ));
  },

  async create(data) {
    return safeQuery(
      supabase.from('recommendations').insert(data).select(F.recommendation).single()
    );
  },
};

// ─── SEARCH ──────────────────────────────────────────────────
export const SearchService = {
  async search(query, { limit = 15 } = {}) {
    if (!query || query.length < 2) return { profiles: [], works: [], experiences: [] };

    const like = `%${query}%`;
    const [profilesRes, worksRes, expsRes] = await Promise.all([
      safeQuery(
        supabase.from('profiles').select(F.profileMin)
          .or(`display_name.ilike.${like},talent.ilike.${like},location_label.ilike.${like}`)
          .eq('is_wirker', true).limit(limit)
      ),
      safeQuery(
        supabase.from('works').select(F.work)
          .ilike('title', like).eq('status', 'published').limit(limit)
      ),
      safeQuery(
        supabase.from('experiences').select(F.experience)
          .ilike('title', like).eq('status', 'published').limit(limit)
      ),
    ]);

    return {
      profiles:    profilesRes.data || [],
      works:       worksRes.data || [],
      experiences: expsRes.data || [],
    };
  },
};
