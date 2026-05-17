// bookingContext.js — HUI Booking Intelligence Layer v1.0
// Phase 3A: Zentrales Booking-System
//
// STATUS FLOW:
// draft → requested → pending_response → accepted/declined
//   accepted → scheduled → in_progress → completed
//   any → cancelled
//
// ARCHITEKTUR:
// - useBookingContext: Hook für alle Booking-Operationen
// - useCreatorBookings: Creator Dashboard — alle eingehenden Anfragen
// - useMyBookings: Client — eigene gesendete Anfragen
// - useBookingRealtime: Live-Updates für Statusänderungen
// - getTrustSignals: Trust-Badges für Creator-Profile

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { assertAuthenticated, assertCreator, globalMutationGuard } from './security/index.js';
import { feedback, FEEDBACK_MESSAGES } from './feedback/index.js';
import { validateBookingRequest, assertValid } from './validation/index.js';
import { supabase } from "./supabaseClient";
import { useAuth } from "./AuthContext";

// ────────────────────────────────────────────────────────────────
// Status System
// ────────────────────────────────────────────────────────────────
export const BOOKING_STATUS = {
  draft:            { label: "Entwurf",             softText: "Wird vorbereitet …",           color: "#94A3B8", emoji: "📝" },
  requested:        { label: "Angefragt",            softText: "Anfrage unterwegs",             color: "#F59E0B", emoji: "✨" },
  pending_response: { label: "Wartet auf Antwort",  softText: "Warten auf Rückmeldung",        color: "#6366F1", emoji: "⏳" },
  accepted:         { label: "Angenommen",           softText: "Zusammenarbeit bestätigt ✓",    color: "#10B981", emoji: "✓"  },
  declined:         { label: "Abgelehnt",            softText: "Leider nicht möglich",          color: "#EF4444", emoji: "✗"  },
  scheduled:        { label: "Geplant",              softText: "Termin steht",                  color: "#16D7C5", emoji: "📅" },
  in_progress:      { label: "Läuft",                softText: "Ihr arbeitet gemeinsam",        color: "#8B5CF6", emoji: "⚡" },
  completed:        { label: "Abgeschlossen",        softText: "Zusammenarbeit abgeschlossen",  color: "#10B981", emoji: "⭐" },
  cancelled:        { label: "Storniert",            softText: "Nicht zustande gekommen",       color: "#888",    emoji: "✗"  },
};

export const REQ_TYPES = [
  { key:"workshop",  label:"Workshop",       icon:"🎓", sub:"Gruppenformat oder 1:1" },
  { key:"shooting",  label:"Shooting",       icon:"📸", sub:"Foto oder Video"        },
  { key:"collab",    label:"Collaboration",  icon:"🤝", sub:"Kreativprojekt"         },
  { key:"event",     label:"Event",          icon:"🎪", sub:"Auftritt oder Performance" },
  { key:"coaching",  label:"Coaching",       icon:"💡", sub:"Beratung oder Mentoring" },
  { key:"other",     label:"Offene Anfrage", icon:"✨", sub:"Freie Anfrage"          },
];

export const MOODS = [
  "entspannt","kreativ","professionell","abenteuerlich","intim","energetisch",
  "inspirierend","experimentell",
];

// ────────────────────────────────────────────────────────────────
// Trust Signals — für Creator-Profile
// ────────────────────────────────────────────────────────────────
export function getTrustSignals(profile) {
  const signals = [];

  if (!profile) return signals;

  // Antwortzeit
  const rt = profile.avg_response_time_h;
  if (rt != null) {
    if (rt <= 1)  signals.push({ icon:"⚡", text:"Antwortet meist innerhalb 1 Stunde" });
    else if (rt <= 24) signals.push({ icon:"🕐", text:`Antwortet meist in ${Math.round(rt)}h` });
  }

  // Response Rate
  const rr = profile.response_rate;
  if (rr != null && rr >= 80) {
    signals.push({ icon:"✓", text:`${Math.round(rr)}% Antwortrate` });
  }

  // Abgeschlossene Buchungen
  const cb = profile.completed_bookings;
  if (cb > 0) {
    signals.push({ icon:"⭐", text:`${cb} erfolgreiche Projekte` });
  }

  // Verfügbarkeit
  const av = profile.availability;
  if (av === "available") {
    signals.push({ icon:"🟢", text:"Aktuell verfügbar" });
  } else if (av === "partial") {
    signals.push({ icon:"🟡", text:"Teilweise verfügbar" });
  } else if (av === "busy") {
    signals.push({ icon:"🔴", text:"Aktuell ausgebucht" });
  }

  return signals;
}

// ────────────────────────────────────────────────────────────────
// useBookingActions — alle DB-Operationen für Bookings
// ────────────────────────────────────────────────────────────────
export function useBookingActions() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  // Neue Buchungsanfrage senden
  // Erstellt gleichzeitig einen verknüpften Chat
  const sendBookingRequest = useCallback(async ({
    creatorId, creatorName, reqType, mood, date, timeSlot,
    location, budget, guests, direction, message, amountEur, impactEur,
  }) => {
    // ── Security Guards ──────────────────────────────────────────
    assertAuthenticated(user);
    if (!creatorId) return { error: "Creator-ID fehlt" };

    // ── Double-Submit Guard ──────────────────────────────────────
    const guardKey = `booking-${user.id}-${creatorId}`;
    if (!globalMutationGuard.lockWithTimeout(guardKey, 8000)) {
      return { error: "Anfrage bereits in Bearbeitung." };
    }

    // ── Input Validation ─────────────────────────────────────────
    const validResult = validateBookingRequest({
      creatorId,
      requesterId: user.id,
      title:       message || reqType || 'Anfrage',
      description: message,
      budget:      amountEur,
      reqType,
    });
    if (!validResult.valid) {
      globalMutationGuard.unlock(guardKey);
      return { error: validResult.errors[0] };
    }

    setLoading(true); setError(null);
    try {
      // 1. Chat für diese Anfrage erstellen
      const chatTitle = `${reqType ? REQ_TYPES.find(r=>r.key===reqType)?.label || reqType : "Anfrage"} mit ${creatorName || "Creator"}`;
      const { data: chat, error: chatErr } = await supabase
        .from("chats")
        .insert({
          participant_ids: [user.id, creatorId],
          state:           "open",
          booking_title:   chatTitle,
          last_message:    message || `Neue ${chatTitle}`,
          last_message_at: new Date().toISOString(),
          opened_at:       new Date().toISOString(),
        })
        .select("id").single();
      if (chatErr) console.warn("[Booking] Chat-Erstellung:", chatErr);

      // 2. Booking erstellen (mit Chat-Referenz)
      const { data: booking, error: bookErr } = await supabase
        .from("bookings")
        .insert({
          requester_id:  user.id,
          creator_id:    creatorId,
          wirker_name:   creatorName,
          status:        "requested",
          req_type:      reqType,
          req_mood:      mood,
          req_date:      date || null,
          req_time_slot: timeSlot || null,
          req_location:  location || null,
          req_budget:    budget || null,
          req_guests:    guests || 1,
          req_direction: direction || null,
          message:       message || null,
          amount_eur:    amountEur || null,
          impact_eur:    impactEur || null,
          chat_id:       chat?.id || null,
          updated_at:    new Date().toISOString(),
        })
        .select("id").single();
      if (bookErr) throw bookErr;

      // 3. Erste Chat-Nachricht = Anfrage-Summary
      if (chat?.id && message) {
        await supabase.from("messages").insert({
          chat_id:    chat.id,
          sender_id:  user.id,
          text:       message,
          created_at: new Date().toISOString(),
        }).catch(err => sentryCapture(normalizeError(err), { source: 'bookingContext' }));
      }

      // 4. Notification für Creator
      await supabase.from("notifications").insert({
        user_id:   creatorId,
        type:      "booking_request",
        text:      `Neue Anfrage von ${user.email?.split("@")[0] || "jemand"}`,
        read:      false,
        actor_id:  user.id,
        created_at: new Date().toISOString(),
      }).catch(err => sentryCapture(normalizeError(err), { source: 'bookingContext' }));

      return { data: booking, chatId: chat?.id };
    } catch(e) {
      setError(e.message);
      return { error: e.message };
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Creator: Buchung annehmen
  const acceptBooking = useCallback(async (bookingId, note = "") => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("bookings")
        .update({
          status:       "accepted",
          creator_note: note || null,
          confirmed_at: new Date().toISOString(),
        })
        .eq("id", bookingId)
        .eq("creator_id", user.id);
      if (error) throw error;

      // Booking Event loggen
      await supabase.from("booking_events").insert({
        booking_id:  bookingId,
        actor_id:    user.id,
        event_type:  "status_change",
        from_status: "requested",
        to_status:   "accepted",
        note:        note || null,
      }).catch(err => sentryCapture(normalizeError(err), { source: 'bookingContext' }));

      return { success: true };
    } catch(e) {
      setError(e.message);
      return { error: e.message };
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Creator: Buchung ablehnen
  const declineBooking = useCallback(async (bookingId, reason = "") => {
    if (!user?.id) return;
    setLoading(true);
    try {
      await supabase.from("bookings")
        .update({
          status:           "declined",
          declined_reason:  reason || null,
        })
        .eq("id", bookingId)
        .eq("creator_id", user.id);

      await supabase.from("booking_events").insert({
        booking_id:  bookingId,
        actor_id:    user.id,
        event_type:  "status_change",
        to_status:   "declined",
        note:        reason || null,
      }).catch(err => sentryCapture(normalizeError(err), { source: 'bookingContext' }));

      return { success: true };
    } catch(e) {
      setError(e.message);
      return { error: e.message };
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Buchung abschließen
  const completeBooking = useCallback(async (bookingId) => {
    if (!user?.id) return;
    // Update booking — Trigger after_booking_completed feuert automatisch in DB:
    // → erstellt collaboration entry
    // → erstellt trust_event: collaboration_completed
    // → updated profile.collab_count
    await supabase.from("bookings")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", bookingId)
      .or(`requester_id.eq.${user.id},creator_id.eq.${user.id}`);
    return { success: true };
  }, [user?.id]);

  // Stornieren
  const cancelBooking = useCallback(async (bookingId) => {
    if (!user?.id) return;
    await supabase.from("bookings")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", bookingId)
      .or(`requester_id.eq.${user.id},creator_id.eq.${user.id}`);
    return { success: true };
  }, [user?.id]);

  return {
    loading, error,
    sendBookingRequest,
    acceptBooking,
    declineBooking,
    completeBooking,
    cancelBooking,
  };
}

// ────────────────────────────────────────────────────────────────
// useCreatorBookings — Creator Dashboard: eingehende Anfragen
// ────────────────────────────────────────────────────────────────
export function useCreatorBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const realtimeRef = useRef(null);

  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data } = await supabase
        .from("bookings")
        .select(`
          id, status, req_type, req_mood, req_date, req_time_slot,
          req_location, req_budget, req_guests, message, amount_eur,
          chat_id, creator_note, confirmed_at, created_at, updated_at,
          requester:profiles!bookings_requester_id_fkey(
            id, display_name, avatar_url, username
          )
        `)
        .eq("creator_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (data) setBookings(data);
    } catch(e) { console.warn("[useCreatorBookings]", e); }
    finally { setLoading(false); }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  // Realtime
  useEffect(() => {
    if (!user?.id) return;
    realtimeRef.current = supabase
      .channel(`creator-bookings:${user.id}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "bookings",
        filter: `creator_id=eq.${user.id}`,
      }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(realtimeRef.current); };
  }, [user?.id, load]);

  // Grouped by status
  const grouped = useMemo(() => ({
    pending:   bookings.filter(b => ["requested","pending_response"].includes(b.status)),
    accepted:  bookings.filter(b => ["accepted","scheduled"].includes(b.status)),
    active:    bookings.filter(b => b.status === "in_progress"),
    completed: bookings.filter(b => b.status === "completed"),
    declined:  bookings.filter(b => ["declined","cancelled"].includes(b.status)),
  }), [bookings]);

  return { bookings, grouped, loading, reload: load };
}

// ────────────────────────────────────────────────────────────────
// useMyBookings — Client: eigene gesendete Anfragen
// ────────────────────────────────────────────────────────────────
export function useMyBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data } = await supabase
        .from("bookings")
        .select(`
          id, status, req_type, req_date, req_time_slot, message,
          amount_eur, chat_id, creator_note, created_at, updated_at,
          creator:profiles!bookings_creator_id_fkey(
            id, display_name, avatar_url, username
          )
        `)
        .eq("requester_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);
      if (data) setBookings(data);
    } catch(e) { console.warn("[useMyBookings]", e); }
    finally { setLoading(false); }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  return { bookings, loading, reload: load };
}

// ────────────────────────────────────────────────────────────────
// useAvailableSlots — Verfügbare Slots eines Creators
// ────────────────────────────────────────────────────────────────
export function useAvailableSlots(creatorId) {
  const [slots,   setSlots]   = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!creatorId) return;
    setLoading(true);
    const from = new Date();
    const to   = new Date(Date.now() + 30 * 24 * 3600000); // 30 Tage
    supabase.from("availability_slots")
      .select("id,slot_date,slot_time,duration_min,is_booked")
      .eq("creator_id", creatorId)
      .eq("is_booked", false)
      .gte("slot_date", from.toISOString().split("T")[0])
      .lte("slot_date", to.toISOString().split("T")[0])
      .order("slot_date")
      .then(({ data }) => {
        setSlots(data || []);
        setLoading(false);
      });
  }, [creatorId]);

  return { slots, loading };
}
