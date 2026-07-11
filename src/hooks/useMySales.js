// src/hooks/useMySales.js
// ══════════════════════════════════════════════════════════════════════
// MEINE VERKÄUFE — Hook für abgeschlossene Verkäufe eigener Werke (Käufer-Sicht
// des Sellers). Additiv, neues Modul (Master-Prompt "Käufe-Übersicht" 2026-07-05).
// Liest ausschließlich aus den bestehenden Commerce-2.0-Tabellen orders/order_items
// (SSOT für Werk-Käufe, siehe Memory #470/#486) — keine neue Tabelle, keine neue Logik.
// Gleiches Muster wie useTalents.js: supabase-js + RLS (order_items_seller_select
// erlaubt seller_id=auth.uid() bereits), Realtime-Sync bei neuen Verkäufen.
// ══════════════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient.js";

/**
 * Lädt alle abgeschlossenen (state='paid') Verkäufe eigener Werke für userId,
 * neueste zuerst, inkl. Realtime-Update bei neuen Bestellungen.
 */
export function useMySales(userId) {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!userId) { setSales([]); setLoading(false); return; }
    setLoading(true);
    const { data, error: err } = await supabase
      .from("order_items")
      .select("id, order_id, work_id, snapshot, quantity, unit_price_eur, payout_eur, fulfillment_status, created_at, orders!inner(id, state, created_at, contact_name, total_eur, escrow_status, delivery_status, buyer_confirmed_at, payout_requested_at, auto_confirm_at)")
      .eq("seller_id", userId)
      .eq("orders.state", "paid")
      .order("created_at", { ascending: false });
    if (err) {
      console.error("[useMySales] load:", err.message);
      setError(err.message);
    } else {
      setError(null);
      setSales(data || []);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!userId) return;
    // Realtime-Dedupe-Schutz (2026-07-08, systemweit, siehe useProfileLocations.js):
    // existierenden Channel fuer diesen Topic wiederverwenden statt erneut zu
    // subscriben -- verhindert "cannot add postgres_changes callbacks ... after
    // subscribe()" bei gleichzeitigen Mounts fuer denselben Topic.
    const topic = "order_items:seller:" + userId;
    const existing = supabase.getChannels().find(c => c.topic === `realtime:${topic}`);
    let channel = existing;
    let createdHere = false;
    if (!existing) {
      channel = supabase
        .channel(topic)
        .on("postgres_changes", {
          event: "*", schema: "public", table: "order_items",
          filter: "seller_id=eq." + userId,
        }, () => load())
        .subscribe();
      createdHere = true;
    }
    return () => { if (createdHere) supabase.removeChannel(channel); };
  }, [userId, load]);

  const totalEarned = sales.reduce((sum, s) => sum + (Number(s.payout_eur) || 0), 0);

  return { sales, loading, error, reload: load, totalEarned };
}
