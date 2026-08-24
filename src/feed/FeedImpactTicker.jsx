// src/feed/FeedImpactTicker.jsx
// ═══════════════════════════════════════════════════════════════
// HUI — Feed Impact Transparency Ticker
// Kompakte Live-Anzeige der Impact-Pool-Verteilungen im Home-Feed.
// Zeigt die letzten 3 Verteilungen — anonymisiert, transparent.
// 60s Auto-Refresh.
// ═══════════════════════════════════════════════════════════════

import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient.js";

const TEAL = "#0DC4B5";
const TEAL_L = "#16D7C5";
const INK = "#1A3530";
const INK2 = "rgba(26,53,48,0.58)";
const MUTED = "rgba(26,53,48,0.32)";
const LINE = "rgba(26,53,48,0.06)";
const SURFACE = "#FFFFFF";

function relTime(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "gerade";
  if (m < 60) return `vor ${m} Min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `vor ${h} Std`;
  const d = Math.floor(h / 24);
  if (d < 7) return `vor ${d} Tag${d > 1 ? "en" : ""}`;
  return new Date(iso).toLocaleDateString("de-DE", { day: "1-digit", month: "short" });
}

function fmtEur(n) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(n || 0);
}

export default function FeedImpactTicker() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let dead = false;
    const load = async () => {
      try {
        const { data: rows } = await supabase
          .from("impact_distributions")
          .select("id,amount_eur,distributed_at,project_id")
          .order("distributed_at", { ascending: false })
          .limit(3);
        if (dead) return;
        if (!rows?.length) { setItems([]); setLoading(false); return; }

        const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const projIds = [...new Set(rows.map(r => r.project_id).filter(id => UUID_RE.test(String(id))))];
        let nameById = {};
        if (projIds.length) {
          const { data: apps } = await supabase
            .from("impact_applications")
            .select("id,project_name")
            .in("id", projIds);
          nameById = Object.fromEntries((apps || []).map(a => [a.id, a.project_name]));
        }
        if (dead) return;
        setItems(rows.map(r => ({
          id: r.id,
          amount: Number(r.amount_eur || 0),
          proj: r.project_id ? nameById[r.project_id] : null,
          ts: r.distributed_at,
          ago: relTime(r.distributed_at),
        })));
        setLoading(false);
      } catch { if (!dead) setLoading(false); }
    };
    load();
    const iv = setInterval(load, 60_000);
    return () => { dead = true; clearInterval(iv); };
  }, []);

  if (loading && !items.length) return null;
  if (!items.length) return null;

  return (
    <div style={{ padding: "0 16px 16px" }}>
      <div style={{
        background: `linear-gradient(135deg, ${TEAL}0A, ${TEAL}04)`,
        border: `1px solid ${TEAL}1A`,
        borderRadius: 20,
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "12px 16px 10px",
        }}>
          <div style={{
            width: 7, height: 7, borderRadius: "50%", background: TEAL,
            animation: "feedImpactPulse 1.4s ease-in-out infinite",
          }}/>
          <span style={{
            fontSize: 11, fontWeight: 600, color: TEAL,
            letterSpacing: "0.08em", textTransform: "uppercase",
          }}>
            Impact-Pool Verteilungen
          </span>
        </div>

        {/* Items */}
        {items.map((it, i) => (
          <div key={it.id} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "8px 16px",
            borderBottom: i < items.length - 1 ? `1px solid ${LINE}` : "none",
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
              background: `${TEAL}12`, border: `1px solid ${TEAL}20`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, color: TEAL, fontWeight: 600,
            }}>€</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 12, color: INK, lineHeight: 1.4,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                <b style={{ color: TEAL }}>{fmtEur(it.amount)}</b>
                {it.proj
                  ? <> wurde für „<b>{it.proj}</b>" verteilt</>
                  : <> wurde in den Impact-Pool eingezahlt</>
                }
              </div>
            </div>
            <div style={{ fontSize: 10, color: MUTED, flexShrink: 0 }}>{it.ago}</div>
          </div>
        ))}

        {/* Footer */}
        <div style={{
          padding: "8px 16px 10px",
          fontSize: 10, color: MUTED, lineHeight: 1.5,
        }}>
          Transparent & anonymisiert — keine Namen, nur Beträge.
        </div>
      </div>
    </div>
  );
}
