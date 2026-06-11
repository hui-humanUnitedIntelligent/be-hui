// src/feed/FeedEventsSection.jsx
// ═══════════════════════════════════════════════════════════════
// HUI — EVENTS SECTION (Phase 2A: Safe Reintegration)
//
// ISOLIERT — eigene Query, eigener State.
// Crash → leerer Container, kein Feed-Crash.
// ═══════════════════════════════════════════════════════════════

import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient.js";

const TEAL  = "#16D7C5";
const CORAL = "#FF8A6B";


/* ── Event Card ───────────────────────────────────────────────── */
function EventCard({ event, onPress, delay }) {
  const [pressed, setPressed] = useState(false);
  const [imgErr,  setImgErr]  = useState(false);
  const img = (!imgErr && event.img) ? event.img : null;

  // Color from badge
  const accentColor = event.badgeColor || TEAL;

  return (
    <button
      onClick={() => onPress?.(event)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        background: "none", border: "none", padding: 0, cursor: "pointer",
        flexShrink: 0, width: 148,
        opacity: pressed ? 0.85 : 1,
        transition: "opacity 0.15s ease",
        touchAction: "manipulation",
      }}
    >
      <div style={{
        borderRadius: 20, overflow: "hidden",
        background: "#fff",
        boxShadow: "0 2px 12px rgba(26,26,46,0.08)",
        border: "1px solid rgba(26,26,46,0.05)",
      }}>
        {/* Media area — fixed 100px */}
        <div style={{
          width: "100%", height: 100, position: "relative",
          background: img ? "#F0EFED"
            : `linear-gradient(135deg, ${accentColor}22 0%, ${accentColor}08 100%)`,
          overflow: "hidden",
        }}>
          {img && (
            <img src={img} alt={event.title}
              onError={() => setImgErr(true)}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          )}

          {/* Gradient overlay for text */}
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(180deg, rgba(0,0,0,0.02) 40%, rgba(0,0,0,0.48) 100%)",
          }} />

          {/* Badge */}
          {event.badge && (
            <div style={{
              position: "absolute", top: 8, left: 8,
              background: accentColor, color: "#fff",
              fontSize: 9, fontWeight: 800, letterSpacing: 0.4,
              padding: "2px 7px", borderRadius: 6,
            }}>
              {event.badge}
            </div>
          )}

          {/* Title on image */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            padding: "6px 10px 8px",
          }}>
            <div style={{
              fontSize: 11.5, fontWeight: 700, color: "#fff",
              lineHeight: 1.2, overflow: "hidden",
              display: "-webkit-box", WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}>
              {event.title}
            </div>
          </div>
        </div>

        {/* Meta row */}
        <div style={{
          padding: "7px 10px 9px",
          display: "flex", alignItems: "center", gap: 5,
        }}>
          <span style={{ fontSize: 10, color: "rgba(26,26,46,0.42)" }}>🕐</span>
          <span style={{ fontSize: 10.5, color: "rgba(26,26,46,0.55)", fontWeight: 500 }}>
            {event.time} · {event.location}
          </span>
        </div>
      </div>
    </button>
  );
}

/* ── Main Section ─────────────────────────────────────────────── */
export default function FeedEventsSection({ onEventPress, onMoreEvents }) {
  // Active system log
  React.useEffect(() => {
    console.log("[ACTIVE_FEED_SYSTEM] FeedEventsSection mounted");
  }, []);
  const [events,  setEvents]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadEvents(); }, []);

  async function loadEvents() {
    setLoading(true);
    try {
      const today = new Date();
      const todayStr = today.toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("experiences")
        .select(`
          id, title, location_text, price, format, duration,
          cover_url, media_url, is_live, created_at,
          profile:user_id(display_name, avatar_url)
        `)
        // FEED.4B FIX-1 — Moderation-konforme Filter (identisch zu fetchFeedPage)
        .eq("status", "published")
        .eq("approval_status", "approved")
        .order("created_at", { ascending: false })
        .limit(12);

      if (error) throw error;

      const rows = (data || []).map(r => ({
        id:          String(r.id),
        title:       r.title   || "Erlebnis",
        time:        r.duration || "Offen",
        location:    r.location_text || null,  // FEED.4B FIX-2 — kein 'Berlin'-Fallback
        img:         r.cover_url || r.media_url || null,
        badge:       r.is_live ? "Live" : "Heute",
        badgeColor:  r.is_live ? "#EF4444" : TEAL,
      }));

      setEvents(rows);  // FEED.4B FIX-3 — leere DB → Section rendert nicht (Z.169)
    } catch (err) {
      console.warn("[HUI_EVENTS_LOAD_ERR]", err?.message);
      setEvents([]); // FEED.4B FIX-3 — DB-Fehler → Section rendert nicht
    } finally {
      setLoading(false);
    }
  }

  // Don't render while loading to avoid layout jump
  if (loading) return null;
  if (events.length === 0) return null;

  return (
    <div style={{ paddingTop: 10, paddingBottom: 4, marginBottom: 4 }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        paddingLeft: 16, paddingRight: 16, marginBottom: 12,
      }}>
        <span style={{
          fontSize: 12.5, fontWeight: 700, color: "rgba(26,53,48,0.60)",
          letterSpacing: -0.1,
        }}>
          Heute in deiner Nähe
        </span>
        <button onClick={onMoreEvents} style={{
          background: "none", border: "none", cursor: "pointer",
          fontSize: 12, fontWeight: 600, color: TEAL, padding: "2px 0",
          touchAction: "manipulation",
        }}>
          Alle ›
        </button>
      </div>

      {/* Horizontal carousel — fixed */}
      <div style={{
        display: "flex", flexDirection: "row",
        overflowX: "auto", overflowY: "hidden",
        gap: 10, paddingLeft: 16, paddingRight: 16,
        WebkitOverflowScrolling: "touch",
        scrollbarWidth: "none", msOverflowStyle: "none",
        paddingBottom: 4,
      }}>
        {events.map((ev, i) => (
          <EventCard key={ev.id} event={ev} onPress={onEventPress} delay={i * 50} />
        ))}
      </div>

      {/* Divider */}
      <div style={{
        height: 1, marginLeft: 16, marginRight: 16,
        marginTop: 10, background: "rgba(26,53,48,0.06)",
      }} />
    </div>
  );
}
