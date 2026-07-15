// src/feed/FeedEventsSection.jsx
// ═══════════════════════════════════════════════════════════════
// HUI Feed V3 — Bereich "Demnächst"
//
// Zeigt bevorstehende Erlebnisse und Veranstaltungen oberhalb des
// Haupt-Feeds. Eigene Query, eigener State — kein Feed-Crash bei Fehler.
// ═══════════════════════════════════════════════════════════════

import { HUILocationIcon, HUIKalenderIcon, HUIPersonenIcon } from '../design/icons/HuiSystemIcons.jsx';
import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient.js";

const TEAL  = "#16D7C5";
const CORAL = "#FF8A6B";
const INK   = "#141422";
const MUTED = "rgba(20,20,34,0.46)";

function formatDateBlock(dateStr) {
  if (!dateStr) return { month: "", day: "?", weekday: "" };
  try {
    const d = new Date(dateStr);
    return {
      month:   d.toLocaleDateString("de-DE", { month: "short" }).toUpperCase(),
      day:     d.getDate(),
      weekday: d.toLocaleDateString("de-DE", { weekday: "short" }),
    };
  } catch {
    return { month: "", day: "?", weekday: "" };
  }
}

function formatTime(timeStr, fallbackLabel) {
  if (timeStr) return timeStr.slice(0, 5);
  return fallbackLabel || "";
}

function participantLabel(event) {
  const max = event.maxParticipants;
  if (!max) return null;
  return `Max. ${max} Teilnehmende`;
}

/* ── Event Card (Demnächst) ───────────────────────────────────── */
function EventCard({ event, onPress, onBook }) {
  const [pressed, setPressed] = useState(false);
  const dt = formatDateBlock(event.date);
  const time = formatTime(event.time, event.timeLabel);
  const participants = participantLabel(event);
  const isExperience = event.kind === "experience";

  const handleCta = (e) => {
    e.stopPropagation();
    if (isExperience && onBook) onBook(event.rawItem);
    else onPress?.(event);
  };

  return (
    <button
      onClick={() => onPress?.(event)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        background: "#fff",
        border: "1px solid rgba(26,26,46,0.06)",
        borderRadius: 16,
        padding: 12,
        cursor: "pointer",
        flexShrink: 0,
        width: 260,
        textAlign: "left",
        boxShadow: "0 2px 12px rgba(26,26,46,0.06)",
        opacity: pressed ? 0.9 : 1,
        transition: "opacity 0.15s ease",
        touchAction: "manipulation",
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
      }}
    >
      {/* Datum */}
      <div style={{
        width: 44, minWidth: 44, background: "rgba(13,196,181,0.10)",
        borderRadius: 10, padding: "6px 4px", textAlign: "center",
      }}>
        <div style={{ fontSize: 9, fontWeight: 800, color: TEAL, letterSpacing: "0.06em" }}>
          {dt.month}
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: INK, lineHeight: 1.1 }}>
          {dt.day}
        </div>
        {dt.weekday && (
          <div style={{ fontSize: 9, fontWeight: 600, color: MUTED, marginTop: 2 }}>
            {dt.weekday}
          </div>
        )}
      </div>

      {/* Inhalt */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{
          fontSize: 13.5, fontWeight: 700, color: INK, lineHeight: 1.25,
          overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
        }}>
          {event.title}
        </div>

        {time && (
          <div style={{ fontSize: 11.5, color: MUTED, display: "flex", alignItems: "center", gap: 4 }}>
            <span>🕐</span> {time} Uhr
          </div>
        )}

        {event.location && (
          <div style={{ fontSize: 11.5, color: MUTED, display: "flex", alignItems: "center", gap: 4 }}>
            <HUILocationIcon size={12} style={{ flexShrink: 0 }} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {event.location}
            </span>
          </div>
        )}

        {participants && (
          <div style={{ fontSize: 11.5, color: MUTED, display: "flex", alignItems: "center", gap: 4 }}>
            <HUIPersonenIcon size={12} style={{ flexShrink: 0 }} />
            {participants}
          </div>
        )}

        <button
          onClick={handleCta}
          style={{
            marginTop: 6, alignSelf: "flex-start",
            background: "linear-gradient(135deg,#0DC4B5,#09A89A)",
            color: "#fff", border: "none", borderRadius: 99,
            padding: "7px 14px", fontSize: 12, fontWeight: 700,
            cursor: "pointer", touchAction: "manipulation",
          }}
        >
          {isExperience ? "Teilnehmen" : "Ansehen"}
        </button>
      </div>
    </button>
  );
}

function computeBadge(dateStr) {
  if (!dateStr) return "Geplant";
  const evDate   = new Date(dateStr);
  const now      = new Date();
  const today    = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const in7days  = new Date(today); in7days.setDate(today.getDate() + 7);
  const evDay    = new Date(evDate.getFullYear(), evDate.getMonth(), evDate.getDate());
  if (evDay.getTime() === today.getTime())    return "Heute";
  if (evDay.getTime() === tomorrow.getTime()) return "Morgen";
  if (evDay < in7days) {
    return evDate.toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "short" });
  }
  return evDate.toLocaleDateString("de-DE", { day: "numeric", month: "short" });
}

function mapExperienceRow(r) {
  const sortDate = r.date || null;
  return {
    id:              `exp-${r.id}`,
    kind:            "experience",
    title:           r.title || "Erlebnis",
    date:            sortDate,
    sortMs:          sortDate ? new Date(sortDate).getTime() : 0,
    time:            r.time_start || null,
    timeLabel:       null,
    location:        r.location_text || "Online",
    maxParticipants: r.max_participants || r.participant_limit || null,
    badge:           r.is_live ? "Live" : computeBadge(r.date),
    badgeColor:      r.is_live ? CORAL : TEAL,
    user_id:         r.user_id || null,
    creator_id:      r.creator_id || null,
    rawItem:         { id: r.id, type: "experience", title: r.title, _raw: r },
  };
}

function mapInvitationRow(r) {
  const sortDate = r.starts_at ? r.starts_at.slice(0, 10) : null;
  const timeFromStart = r.starts_at ? new Date(r.starts_at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) : null;
  return {
    id:              `inv-${r.id}`,
    kind:            "invitation",
    title:           r.title || r.text || "Veranstaltung",
    date:            sortDate,
    sortMs:          sortDate ? new Date(sortDate).getTime() : (r.starts_at ? new Date(r.starts_at).getTime() : 0),
    time:            timeFromStart,
    timeLabel:       r.time_label || null,
    location:        [r.location, r.city].filter(Boolean).join(", ") || "Ort folgt",
    maxParticipants: r.max_participants || null,
    badge:           computeBadge(sortDate),
    badgeColor:      TEAL,
    user_id:         r.user_id || null,
    creator_id:      r.user_id || null,
    rawItem:         { id: r.id, type: "event", title: r.title, _raw: r },
  };
}

/* ── Main Section ─────────────────────────────────────────────── */
export default function FeedEventsSection({ onEventPress, onMoreEvents, onBook }) {
  const [events,  setEvents]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadEvents(); }, []);

  async function loadEvents() {
    setLoading(true);
    try {
      const todayStr = new Date().toISOString().slice(0, 10);
      const nowIso   = new Date().toISOString();

      const [expRes, invRes] = await Promise.all([
        supabase
          .from("experiences")
          .select(`
            id, title, location_text, date, time_start, time_end,
            cover_url, media_url, is_live,
            creator_id, user_id, max_participants, participant_limit
          `)
          .eq("status", "published")
          .eq("approval_status", "approved")
          .gte("date", todayStr)
          .order("date", { ascending: true })
          .limit(12),
        supabase
          .from("invitations")
          .select(`
            id, user_id, text, title, location, city, time_label,
            starts_at, expires_at, max_participants
          `)
          .eq("status", "active")
          .eq("visibility", "public")
          .gt("expires_at", nowIso)
          .order("starts_at", { ascending: true, nullsFirst: false })
          .limit(12),
      ]);

      if (expRes.error) throw expRes.error;
      if (invRes.error) throw invRes.error;

      const rows = [
        ...(expRes.data || []).map(mapExperienceRow),
        ...(invRes.data || []).map(mapInvitationRow),
      ]
        .filter(e => e.sortMs > 0 || e.date)
        .sort((a, b) => (a.sortMs || 0) - (b.sortMs || 0))
        .slice(0, 12);

      setEvents(rows);
    } catch (err) {
      if (import.meta.env.DEV) console.warn("[HUI_DEMNAECHST_LOAD_ERR]", err?.message);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return null;
  if (events.length === 0) return null;

  return (
    <div style={{ paddingTop: 10, paddingBottom: 4, marginBottom: 4 }}>
      <div style={{ paddingLeft: 16, paddingRight: 16, marginBottom: 10 }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 2,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <HUIKalenderIcon size={15} style={{ flexShrink: 0 }} />
            <span style={{
              fontSize: 15, fontWeight: 700, color: INK,
              letterSpacing: -0.3,
            }}>
              Demnächst
            </span>
          </div>
          {onMoreEvents && (
            <button onClick={onMoreEvents} style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 12, fontWeight: 600, color: TEAL, padding: "2px 0",
              touchAction: "manipulation",
              display: "flex", alignItems: "center", gap: 2,
            }}>
              Alle anzeigen <span style={{ fontSize: 11 }}>›</span>
            </button>
          )}
        </div>
        <p style={{
          margin: 0, padding: 0,
          fontSize: 12.5, color: MUTED, fontWeight: 400, lineHeight: 1.45,
        }}>
          Erlebnisse und Veranstaltungen, die bald stattfinden.
        </p>
      </div>

      <div style={{
        display: "flex", flexDirection: "row",
        overflowX: "auto", overflowY: "hidden",
        gap: 10, paddingLeft: 16, paddingRight: 16,
        WebkitOverflowScrolling: "touch",
        scrollbarWidth: "none", msOverflowStyle: "none",
        paddingBottom: 4,
      }}>
        {events.map((ev) => (
          <EventCard
            key={ev.id}
            event={ev}
            onPress={onEventPress}
            onBook={onBook}
          />
        ))}
      </div>

      <div style={{
        height: 1, marginLeft: 16, marginRight: 16,
        marginTop: 10, background: "rgba(26,53,48,0.06)",
      }} />
    </div>
  );
}
