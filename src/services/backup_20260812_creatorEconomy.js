// src/services/creatorEconomy.js — HUI Phase 4D
// Creator Economy Service — Wallet · Supports · Bookings · Sales · Analytics
// ══════════════════════════════════════════════════════════════════════════
// REGELN:
//  · Kein direktes DB-Schema — nutzt Supabase-Client
//  · Graceful fallbacks überall
//  · Optimistic UI-freundlich: sofort lokalen State updaten, DB async
//  · Niemals "E-Commerce" Sprache — HUI-Vokabular
// ══════════════════════════════════════════════════════════════════════════
import { supabase } from "../lib/supabaseClient.js";

// ── Safe Query Wrapper ────────────────────────────────────────────────
async function sq(queryFn, fallback = null) {
  try {
    const { data, error } = await queryFn();
    if (error) { console.warn("[ECONOMY]", error.message); return fallback; }
    return data;
  } catch (e) {
    console.warn("[ECONOMY] Unexpected:", e?.message);
    return fallback;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// WALLET
// ═══════════════════════════════════════════════════════════════════════
export const walletService = {
  async get(userId) {
    return sq(() => supabase
      .from("creator_wallets")
      .select("*")
      .eq("user_id", userId)
      .single()
    , { balance: 0, pending_balance: 0, total_earned: 0 });
  },

  async getOrCreate(userId) {
    const existing = await walletService.get(userId);
    if (existing?.id) return existing;
    // Wallet noch nicht da → erstellen (Trigger sollte das auto machen, Fallback)
    return sq(() => supabase
      .from("creator_wallets")
      .insert({ user_id: userId })
      .select()
      .single()
    , { balance: 0, pending_balance: 0, total_earned: 0 });
  },
};

// ═══════════════════════════════════════════════════════════════════════
// SUPPORTS (Direkte Unterstützungen)
// ═══════════════════════════════════════════════════════════════════════
export const supportService = {
  // Unterstützung senden
  async send({ supporterId, creatorId, amount, message = "", sourceType = null, sourceId = null }) {
    if (!supporterId || !creatorId || !amount) return { error: "Fehlende Felder" };
    if (supporterId === creatorId) return { error: "Keine Selbst-Unterstützung" };
    if (amount <= 0) return { error: "Betrag muss positiv sein" };

    const { data, error } = await supabase
      .from("creator_supports")
      .insert({
        supporter_id:     supporterId,
        creator_id:       creatorId,
        amount,
        message:          message || null,
        source_type:      sourceType,
        source_id:        sourceId,
        payment_status:   "pending",
        payment_provider: "stripe",
      })
      .select()
      .single();

    if (error) {
      console.warn("[SUPPORT] insert error:", error.message);
      return { error: error.message };
    }
    return { data };
  },

  // Alle Supports die ich erhalten habe
  async received(creatorId, { limit = 20 } = {}) {
    return sq(() => supabase
      .from("creator_supports")
      .select(`
        id, amount, message, created_at, payment_status, source_type,
        supporter:supporter_id(id, display_name, avatar_url, membership_type)
      `)
      .eq("creator_id", creatorId)
      .order("created_at", { ascending: false })
      .limit(limit)
    , []);
  },

  // Alle Supports die ich gegeben habe
  async given(supporterId, { limit = 20 } = {}) {
    return sq(() => supabase
      .from("creator_supports")
      .select(`
        id, amount, message, created_at, payment_status,
        creator:creator_id(id, display_name, avatar_url)
      `)
      .eq("supporter_id", supporterId)
      .order("created_at", { ascending: false })
      .limit(limit)
    , []);
  },
};

// ═══════════════════════════════════════════════════════════════════════
// EXPERIENCE BOOKINGS
// ═══════════════════════════════════════════════════════════════════════
export const bookingService = {
  async create({ experienceId, creatorId, userId, seats = 1, amount, message = "" }) {
    if (!experienceId || !creatorId || !userId) return { error: "Fehlende Felder" };
    if (userId === creatorId) return { error: "Creator kann eigenes Erlebnis nicht buchen" };

    // bookings ist Legacy — experience bookings laufen über talent_bookings (TALENT-BOOKING-PAYMENT-001)
    // Nur echte Spalten verwenden: user_id, customer_id, amount, status
    const { data, error } = await supabase
      .from("bookings")
      .insert({
        user_id:        userId,
        customer_id:    userId,
        amount:         amount ?? 0,
        status:         "pending",
        payment_status: "pending",
      })
      .select("id,user_id,amount,status,payment_status,created_at")
      .single();

    if (error) return { error: error.message };
    return { data };
  },

  // Buchungen für Creator (Anfragen die ich erhalte)
  async forCreator(creatorId, { status = null, limit = 30 } = {}) {
    let q = supabase
      .from("bookings")
      .select(`
        id, amount, status, payment_status, created_at, confirmed_at, completed_at
      `)
      .eq("user_id", creatorId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (status) q = q.eq("status", status);
    return sq(() => q, []);
  },

  // Buchungen des Gastes (Erlebnisse die ich gebucht habe)
  async forUser(userId, { limit = 20 } = {}) {
    return sq(() => supabase
      .from("bookings")
      .select(`
        id, amount, status, payment_status, created_at, confirmed_at, completed_at
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit)
    , []);
  },

  // Status updaten (Creator only)
  async updateStatus(bookingId, status, { response = null } = {}) {
    const updates = {
      status,  // echte Spalte (booking_status existiert nicht in bookings-Tabelle)
    };
    if (status === "confirmed") updates.confirmed_at = new Date().toISOString();
    if (status === "completed") updates.completed_at = new Date().toISOString();

    return sq(() => supabase
      .from("bookings")
      .update(updates)
      .eq("id", bookingId)
      .select()
      .single()
    , null);
  },
};

// ═══════════════════════════════════════════════════════════════════════
// WORK SALES
// ═══════════════════════════════════════════════════════════════════════
export const salesService = {
  async createSale({ workId, creatorId, buyerId, amount }) {
    if (!workId || !creatorId || !buyerId) return { error: "Fehlende Felder" };
    if (buyerId === creatorId) return { error: "Kein Selbstkauf" };

    const { data, error } = await supabase
      .from("work_sales")
      .insert({
        work_id:          workId,
        creator_id:       creatorId,
        buyer_id:         buyerId,
        amount,
        payment_status:   "pending",
        payment_provider: "stripe",
      })
      .select()
      .single();

    if (error) return { error: error.message };
    return { data };
  },

  async forCreator(creatorId, { limit = 30 } = {}) {
    return sq(() => supabase
      .from("work_sales")
      .select(`
        id, amount, created_at, payment_status,
        work:work_id(id, title, cover_url, price),
        buyer:buyer_id(id, display_name, avatar_url)
      `)
      .eq("creator_id", creatorId)
      .eq("payment_status", "completed")
      .order("created_at", { ascending: false })
      .limit(limit)
    , []);
  },
};

// ═══════════════════════════════════════════════════════════════════════
// ANALYTICS
// ═══════════════════════════════════════════════════════════════════════
export const analyticsService = {
  async track({ creatorId, eventType, sourceType = null, sourceId = null, viewerId = null }) {
    if (!creatorId || !eventType) return;
    // Fire-and-forget — blockiert nie UI
    supabase.from("creator_analytics").insert({
      creator_id:  creatorId,
      event_type:  eventType,
      source_type: sourceType,
      source_id:   sourceId,
      viewer_id:   viewerId,
    }).then(({ error }) => {
      if (error) console.warn("[ANALYTICS] track error:", error.message);
    });
  },
};

// ═══════════════════════════════════════════════════════════════════════
// DASHBOARD SUMMARY (RPC — ein Aufruf für alles)
// ═══════════════════════════════════════════════════════════════════════
export async function getCreatorSummary(userId) {
  return sq(() => supabase.rpc("get_creator_summary", { p_user_id: userId }),
    {
      wallet:       { balance: 0, pending_balance: 0, total_earned: 0 },
      supports_30d: { count: 0, total: 0 },
      bookings:     { pending: 0, confirmed: 0, completed: 0 },
      sales_30d:    { count: 0, total: 0 },
      analytics_7d: { profile_views: 0, story_views: 0, work_views: 0 },
    }
  );
}
