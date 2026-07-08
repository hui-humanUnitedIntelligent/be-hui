// src/hooks/useTalentBookings.js
// ══════════════════════════════════════════════════════════════════════
// MEINE BUCHUNGEN — Hook für Talent-Buchungen (TALENT-BOOKING-PAYMENT-001,
// additiv 2026-07-05). Zwei Perspektiven auf dieselbe talent_bookings-Tabelle:
//   - asCustomer: Termine, die der eingeloggte Nutzer selbst gebucht hat
//   - asSeller:   Buchungsanfragen für die eigenen Talent-Angebote
// RLS deckt beide Sichten bereits ab (talent_bookings_customer_select /
// talent_bookings_seller_select, siehe Migration 20260705_063). Stornieren
// läuft ausschließlich über rpc_cancel_talent_booking (serverseitige
// Berechtigungsprüfung: nur customer_id oder seller_id der Zeile).
// Gleiches Realtime-Muster wie useMySales.js — talent_bookings ist bereits
// Teil der supabase_realtime-Publication (Memory #536).
//
// Kein Embed für profiles: talent_bookings hat 3 FKs auf profiles
// (customer_id/seller_id/ambassador_id) — PostgREST-Embed wäre mehrdeutig.
// Gegenpartei-Namen werden stattdessen separat nachgeladen (gleiches Muster
// wie DiscoverPage.jsx providerMap).
// ══════════════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient.js";

const SELECT_FIELDS = "id, talent_id, customer_id, seller_id, selected_date, selected_time_slot, participants, status, amount_eur, customer_note, created_at, cancelled_at, talents(title, images, category)";

export function useTalentBookings(userId) {
  const [asCustomer, setAsCustomer] = useState([]);
  const [asSeller,   setAsSeller]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  const load = useCallback(async () => {
    if (!userId) { setAsCustomer([]); setAsSeller([]); setLoading(false); return; }
    setLoading(true);
    const [customerRes, sellerRes] = await Promise.all([
      supabase.from("talent_bookings").select(SELECT_FIELDS)
        .eq("customer_id", userId).order("selected_date", { ascending: false }),
      supabase.from("talent_bookings").select(SELECT_FIELDS)
        .eq("seller_id", userId).order("selected_date", { ascending: false }),
    ]);
    if (customerRes.error) { console.error("[useTalentBookings] customer:", customerRes.error.message); setError(customerRes.error.message); }
    if (sellerRes.error)   { console.error("[useTalentBookings] seller:", sellerRes.error.message);   setError(sellerRes.error.message); }

    const customerRows = customerRes.data || [];
    const sellerRows   = sellerRes.data || [];

    // Gegenpartei-Namen nachladen: bei "asCustomer" brauche ich den Anbieter (seller_id),
    // bei "asSeller" brauche ich den Kunden (customer_id).
    const otherIds = [...new Set([
      ...customerRows.map(r => r.seller_id),
      ...sellerRows.map(r => r.customer_id),
    ].filter(Boolean))];

    let nameMap = {};
    if (otherIds.length > 0) {
      const { data: profs } = await supabase.from("profiles")
        .select("id, display_name, username").in("id", otherIds);
      nameMap = Object.fromEntries((profs || []).map(p => [p.id, p.display_name || p.username || "HUI Mitglied"]));
    }

    setAsCustomer(customerRows.map(r => ({ ...r, other_name: nameMap[r.seller_id] || "Anbieter" })));
    setAsSeller(sellerRows.map(r => ({ ...r, other_name: nameMap[r.customer_id] || "Kunde" })));
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!userId) return;
    // Realtime-Dedupe-Schutz (2026-07-08, systemweit, siehe useProfileLocations.js):
    // existierenden Channel fuer diesen Topic wiederverwenden statt erneut zu
    // subscriben -- verhindert "cannot add postgres_changes callbacks ... after
    // subscribe()" bei gleichzeitigen Mounts fuer denselben Topic.
    const topic = "talent_bookings:user:" + userId;
    const existing = supabase.getChannels().find(c => c.topic === `realtime:${topic}`);
    let channel = existing;
    let createdHere = false;
    if (!existing) {
      channel = supabase
        .channel(topic)
        .on("postgres_changes", {
          event: "*", schema: "public", table: "talent_bookings",
          filter: "customer_id=eq." + userId,
        }, () => load())
        .on("postgres_changes", {
          event: "*", schema: "public", table: "talent_bookings",
          filter: "seller_id=eq." + userId,
        }, () => load())
        .subscribe();
      createdHere = true;
    }
    return () => { if (createdHere) supabase.removeChannel(channel); };
  }, [userId, load]);

  // TALENT-BOOKING-REFUND-004 (2026-07-06): Stornieren läuft jetzt über die
  // Edge Function cancel-talent-booking statt direkt über die RPC — sie
  // storniert (via derselben rpc_cancel_talent_booking) UND löst bei bereits
  // bezahlten Buchungen automatisch einen Stripe-Refund aus. Die bestehende
  // charge.refunded-Webhook-Buchhaltung übernimmt den Rest automatisch.
  const cancelBooking = useCallback(async (bookingId) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { ok: false, error: "Bitte melde dich an." };

    const { data, error: err } = await supabase.functions.invoke("cancel-talent-booking", {
      body: { booking_id: bookingId },
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (err) return { ok: false, error: err.message || "Stornierung fehlgeschlagen" };
    if (data?.error) return { ok: false, error: data.error };

    await load();
    return {
      ok: true,
      refundApplicable: !!data?.refund_applicable,
      refundOk: data?.refund_ok ?? null,
      refundError: data?.refund_error ?? null,
    };
  }, [load]);

  return { asCustomer, asSeller, loading, error, reload: load, cancelBooking };
}
