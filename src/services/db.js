// src/services/db.js
// Cache-Buster: 202607201548
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
import { safeQuery, cachedQuery, clearQueryCache, warmQueryCache, readCache, FIELDS, PAGE_SIZE, buildPage } from '../lib/perfUtils';

// ─── FIELDS (vollständig, kein select *) ─────────────────────
// ─── IDENTITY CONTRACT v1.0 ─────────────────────────────
// Kanonischer Fieldset — einzige Quelle der Wahrheit.
// Alle Module verwenden ausschließlich diesen String.
// Änderungen nur nach Freigabe des Identity Contracts.
// Entfernte Felder: tagline, full_name, is_verified, availability,
//   follower_count, location, is_talent, header_img, skills, dna_tags
// Hinzugefügt: location_label, member_since, profile_views
export const IDENTITY_CONTRACT =
  'id,display_name,full_name,username,avatar_url,header_img,bio,location_label,location,member_since,role,has_talent_profile,talent,membership_type,membership_active,followers_count,impact_eur,profile_views,is_ambassador,profile_modules,website,tagline,focus_type,skills,dna_tags,is_available,hourly_rate';
  // SICHERHEIT: phone aus öffentlichem Fieldset entfernt (2026-07-29)
  // phone wird nur im privaten MyBasisProfile via separate Query geladen

const F = {
  // Identity Contract — einziges kanonisches Profil-Fieldset
  profile:      IDENTITY_CONTRACT,
  // profileMin: für Chat/Notifications (Avatar + Name) — bewusst minimal
  profileMin:   'id,display_name,username,avatar_url',
  // DEEPLINK.1 (2026-07-09): +slug fuer /werke/:slug (Migration 074)
  work:         'id,user_id,title,cover_url,media_url,price,category,medium,status,likes_count,location_text,created_at,slug',
  experience:   'id,user_id,title,cover_url,price,duration,spots_available,location_text,status,created_at',
  impactVote:   'id,voter_id,project_id,pool_month,weight,created_at',
  recommendation:'id,from_user_id,to_user_id,text,result_images,is_public,order_id,booking_id,created_at',
  membership:   'id,user_id,membership_type,status,vote_weight,started_at,expires_at',
  matchScore:   'id,user_id,target_user_id,score,categories,updated_at',
};

// ─── PROFILES ────────────────────────────────────────────────
export const ProfileService = {
  // Prewarm: Feed-geladene Profile in Cache schreiben
  // Aufruf aus DiscoverPage wenn Profil-Karten gerendert werden
  prewarm(profiles = []) {
    // SICHERHEIT: prewarm nutzt separaten Cache-Key ('prewarm:')
    // Damit wird der getById-Cache ('profile:') NICHT überschrieben
    // → getById macht immer eine echte Query mit F.profile (IDENTITY_CONTRACT)
    // → prewarm ist nur ein optischer Optimizer für Avatar-Vorschauen
    for (const p of profiles) {
      if (!p?.id) continue;
      warmQueryCache(`prewarm:${p.id}`, p, 60_000);
    }
  },

  // Synchroner Lesezugriff auf prewarm-Cache (kein Network)
  readPrewarm(id) {
    if (!id) return null;
    return readCache(`prewarm:${id}`);
  },
  


  async getById(id) {
    return cachedQuery(`profile:${id}`,
      () => safeQuery(supabase.from('profiles').select(F.profile).eq('id', id).maybeSingle()),
      60_000
    );
  },

  async getByUsername(username) {
    return cachedQuery(`profile:@${username}`,
      () => safeQuery(supabase.from('profiles').select(F.profile).eq('username', username).maybeSingle()),
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

  // Batch-Load für Feed (ersetzt lokale profileMaps)
  async getMany(ids) {
    if (!ids || ids.length === 0) return { data: [], error: null };
    return cachedQuery(`profiles:batch:${[...ids].sort().join(',')}`,
      () => safeQuery(
        supabase.from('profiles').select(F.profile).in('id', ids)
      ), 60_000
    );
  },

  // Minimales Profil für Avatar + Name (Chat, Notifications)
  async getMin(id) {
    return cachedQuery(`profile:min:${id}`,
      () => safeQuery(
        supabase.from('profiles').select(F.profileMin).eq('id', id).maybeSingle()
      ), 120_000
    );
  },
};

// ─── MEMBERSHIPS ─────────────────────────────────────────────
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

  // DEEPLINK.1: /werke/:slug -- Slug wird per Trigger beim Anlegen/Aendern
  // eines Werks automatisch vergeben (Migration 074), hier nur Lookup.
  async getBySlug(slug) {
    return cachedQuery(`work:slug:${slug}`,
      () => safeQuery(supabase.from('works').select(F.work).eq('slug', slug).eq('status', 'published').single()),
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
// ─── STORIES ─────────────────────────────────────────────────
// ─── BOOKINGS ────────────────────────────────────────────────
// ─── IMPACT SYSTEM ───────────────────────────────────────────
export const ImpactService = {
  // ── Zentrale Hilfsfunktion: aktueller Monat YYYY-MM ─────────────
  currentMonth() {
    return new Date().toISOString().slice(0, 7);
  },

  async getActiveProjects() {
    return cachedQuery('impact:active',
      () => safeQuery(
        supabase.from('impact_projects').select(F.impactProject)
          .eq('status', 'active').order('votes', { ascending: false }).limit(20)
      ), 30_000
    );
  },

  async getCurrentRound() {
    const month = this.currentMonth();
    return cachedQuery(`impact:round:${month}`,
      () => safeQuery(
        supabase.from('impact_rounds').select(F.impactRound)
          .eq('month', month).eq('status', 'active').maybeSingle()
      ), 60_000
    );
  },

  // ── Einheitlich: voter_id + pool_month (Single Source of Truth) ──
  async getUserVotesThisMonth(userId) {
    const month = this.currentMonth();
    return safeQuery(
      supabase.from('impact_votes')
        .select('id,project_id,pool_month,weight,created_at')
        .eq('voter_id', userId)
        .eq('pool_month', month)
        .limit(10)
    );
  },

  // Legacy-Alias für Rückwärtskompatibilität
  async getUserVotesThisRound(userId, _roundId) {
    return this.getUserVotesThisMonth(userId);
  },

  // ── Stimme abgeben — voter_id + pool_month (kein round_id) ──────
  async castVote(userId, projectId, _roundId, voteWeight = 1) {
    const month = this.currentMonth();

    // Bereits für dieses Projekt abgestimmt?
    const { data: existing } = await safeQuery(
      supabase.from('impact_votes')
        .select('id,project_id,weight')
        .eq('voter_id', userId)
        .eq('pool_month', month)
    );
    const totalUsed = (existing || []).reduce((s, v) => s + (v.weight || 1), 0);
    const maxVotes  = voteWeight >= 2 ? 2 : 1;

    if (totalUsed >= maxVotes) {
      return { data: null, error: { message: `Maximale Stimmen für diesen Monat erreicht (${maxVotes})` } };
    }
    const alreadyVoted = (existing || []).some(v => v.project_id === projectId);
    if (alreadyVoted) {
      return { data: null, error: { message: 'Bereits für dieses Projekt abgestimmt' } };
    }

    // Session-Refresh vor dem Insert — verhindert RLS-Fehler bei abgelaufenen JWTs
    try {
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        // 400 = RefreshToken abgelaufen → getUser nochmal versuchen (Token kann noch gültig sein)
        console.warn('[castVote] Session refresh skipped:', refreshError.message);
      }
    } catch (_) { /* ignorieren — Token könnte noch gültig sein */ }

    return safeQuery(
      supabase.from('impact_votes').insert({
        voter_id:   userId,
        project_id: projectId,
        pool_month: month,
        weight:     1,
        created_at: new Date().toISOString(),
      }).select('id,project_id,pool_month,weight').single()
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
// ─── MATCH SCORES ────────────────────────────────────────────
// ─── RECOMMENDATIONS ─────────────────────────────────────────
export const RecommendationService = {
  // Sprint F.4B.2: wirker_id → to_user_id (einzige Wahrheitsquelle)
  async getByUser(userId, page = 0) {
    return safeQuery(buildPage(
      supabase.from('recommendations')
        .select(`${F.recommendation}`)  // FK zu auth.users (nicht profiles) → kein PostgREST-Join
        .eq('to_user_id', userId)
        .eq('is_public', true)
        .order('created_at', { ascending: false }),
      page, 10
    ));
  },

  // Legacy-Alias für bestehende Aufrufer — leitet auf getByUser weiter
  async getByWirker(userId, page = 0) {
    return this.getByUser(userId, page);
  },

  async create(fromUserId, toUserId, text, { bookingId = null, orderId = null } = {}) {
    const payload = { from_user_id: fromUserId, to_user_id: toUserId, text, is_public: true };
    if (bookingId) payload.booking_id = bookingId;
    if (orderId)   payload.order_id   = orderId;
    return safeQuery(
      supabase.from('recommendations')
        .insert(payload)
        .select(F.recommendation)
        .single()
    );
  },

  // Prüft ob ein Nutzer eine Empfehlung schreiben darf.
  // Bedingung: hat etwas vom Profilinhaber gekauft/gebucht ODER an ihn verkauft.
  async canRecommend(fromUserId, toUserId) {
    if (!fromUserId || !toUserId || fromUserId === toUserId) return { eligible: false };

    // 1A. Werk-Käufe: fromUserId hat von toUserId gekauft (orders → order_items.seller_id)
    const { data: ordersBought } = await safeQuery(
      supabase.from('order_items')
        .select('id, order_id, seller_id, fulfillment_status')
        .eq('seller_id', toUserId)
        .in('fulfillment_status', ['delivered', 'completed', 'released', null])
    );
    let eligibleOrdersBought = [];
    if (ordersBought && ordersBought.length) {
      const orderIds = [...new Set(ordersBought.map(o => o.order_id))];
      const { data: myOrders } = await safeQuery(
        supabase.from('orders')
          .select('id, state')
          .in('id', orderIds)
          .eq('customer_id', fromUserId)
          .in('state', ['paid', 'completed', 'delivered'])
      );
      eligibleOrdersBought = (myOrders || []).map(o => o.id);
    }

    // 1B. Werk-Verkäufe: fromUserId hat an toUserId verkauft (order_items.seller_id = fromUserId, orders.customer_id = toUserId)
    const { data: ordersSold } = await safeQuery(
      supabase.from('order_items')
        .select('id, order_id, seller_id, fulfillment_status')
        .eq('seller_id', fromUserId)
        .in('fulfillment_status', ['delivered', 'completed', 'released', null])
    );
    let eligibleOrdersSold = [];
    if (ordersSold && ordersSold.length) {
      const orderIds = [...new Set(ordersSold.map(o => o.order_id))];
      const { data: theirOrders } = await safeQuery(
        supabase.from('orders')
          .select('id, state')
          .in('id', orderIds)
          .eq('customer_id', toUserId)
          .in('state', ['paid', 'completed', 'delivered'])
      );
      eligibleOrdersSold = (theirOrders || []).map(o => o.id);
    }

    const eligibleOrders = [...eligibleOrdersBought, ...eligibleOrdersSold];

    // 2A. Talent-Buchungen: fromUserId hat Talent von toUserId gebucht
    const { data: talents } = await safeQuery(
      supabase.from('talents')
        .select('id')
        .eq('user_id', toUserId)
    );
    let eligibleBookings = [];
    if (talents && talents.length) {
      const talentIds = talents.map(t => t.id);
      const { data: bookings } = await safeQuery(
        supabase.from('talent_bookings')
          .select('id, status')
          .in('talent_id', talentIds)
          .eq("customer_id", fromUserId)
          .in('status', ['completed', 'confirmed'])
      );
      eligibleBookings = (bookings || []).map(b => b.id);
    }

    // 2B. Talent-Buchungen: toUserId hat Talent von fromUserId gebucht (Verkäufer-Perspektive)
    const { data: myTalents } = await safeQuery(
      supabase.from('talents')
        .select('id')
        .eq('user_id', fromUserId)
    );
    if (myTalents && myTalents.length) {
      const myTalentIds = myTalents.map(t => t.id);
      const { data: theirBookings } = await safeQuery(
        supabase.from('talent_bookings')
          .select('id, status')
          .in('talent_id', myTalentIds)
          .eq("customer_id", toUserId)
          .in('status', ['completed', 'confirmed'])
      );
      if (theirBookings && theirBookings.length) {
        eligibleBookings = [...eligibleBookings, ...theirBookings.map(b => b.id)];
      }
    }

    const eligible = eligibleOrders.length > 0 || eligibleBookings.length > 0;
    return { eligible, orderId: eligibleOrders[0] || null, bookingId: eligibleBookings[0] || null };
  },

  // Meldet eine Empfehlung (nur Empfänger kann melden)
  // offender_id = Empfehlender, message = Empfehlungstext (für SADB denormalisiert)
  async reportRecommendation(recommendationId, reporterId, { reason = '', offenderId = null, message = '' } = {}) {
    const payload = {
      recommendation_id: recommendationId,
      reporter_id: reporterId,
      reason, message, status: 'new',
    };
    if (offenderId) payload.offender_id = offenderId;
    return safeQuery(
      supabase.from('recommendation_reports')
        .insert(payload)
        .select('id')
        .single()
    );
  },

  // Hat der Nutzer diese Person bereits empfohlen?
  async hasRecommended(fromUserId, toUserId) {
    const { data } = await safeQuery(
      supabase.from('recommendations')
        .select('id')
        .eq('from_user_id', fromUserId)
        .eq('to_user_id', toUserId)
        .limit(1)
    );
    return (data && data.length > 0);
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
