// src/components/profile/TrailerGrid.jsx
// HUI-TALENT-INTERVIEWS-001 (2026-09-15, Michael-Spec "HUI-Talent Interviews
// Rubrik mit Trailer-Anzeige") — Grid-Darstellung der Video-Broadcasts im
// HUI-Bot-Profil (myHUI).
//
// ARCHITEKTUR-ENTSCHEIDUNG (Charta "Evolution statt Rewrite" + "Keine
// konkurrierenden Zustaendigkeiten" + Engineering Constitution "Kein Raten"):
// Der Spec-Vorschlag sah eine NEUE Tabelle `broadcast_videos` vor. Diese
// Daten existieren aber bereits: Migration 136 (2026-09-11,
// VIDEO-BROADCAST-001) speichert trailer_url/youtube_url bereits im
// `notifications.data`-JSONB jeder Broadcast-Zeile (type IN ('broadcast',
// 'admin_broadcast')) — SystemBotProfile.jsx laedt genau diese Zeilen schon
// fuer den bestehenden "Systemnachrichten"-Block. Eine zweite Tabelle waere
// eine zweite Wahrheit fuer dieselbe Information (verboten laut Charta
// Prinzip "Eine autoritative Quelle pro Zustaendigkeitsbereich").
// Diese Komponente ist daher bewusst NUR praesentational — sie erhaelt die
// bereits geladenen, gefilterten Interview-Zeilen als Prop, statt eine
// eigene konkurrierende Query zu bauen (keine Duplicate-Fetches derselben
// Tabelle).
//
// Felder, die im echten Schema NICHT existieren, werden NICHT erfunden
// (Kein-Raten-Regel): `creator_name` und `thumbnail_url` aus dem Spec-Vorbild
// gibt es weder in notifications.data noch sonstwo — daher zeigt die Karte
// nur echte Felder (title/body/created_at/trailer_url/youtube_url).
//
// Video-Rendering nutzt die MediaVideo-SSOT (components/media/, aus
// MEDIA-LOADING-001) — preload="metadata", aspect-exakte Hoehe
// (VIDEO-BREITEN-FIX-Regel), HUILogo-Fallback bei Ladefehler. Der native
// <video controls>-Fullscreen-Button deckt "Video-Fullscreen oeffnen"
// (Anforderung 6) ab, ohne eine zweite Fullscreen-Infrastruktur zu bauen.
import React from "react";
import MediaVideo from "../media/MediaVideo.jsx";
import { formatDateDE } from "../../lib/formatters.js";

const T = {
  bgCard: "#FFFFFF",
  teal: "#0EC4B8",
  tealSoft: "rgba(14,196,184,0.10)",
  ink: "#1A1A18",
  inkSoft: "#55556B",
  inkFaint: "#808098",
  border: "rgba(26,26,24,0.08)",
  card: "0 1px 8px rgba(26,26,24,0.07), 0 1px 2px rgba(26,26,24,0.04)",
};

function TrailerCard({ interview = {} }) {
  const date = interview.created_at ? new Date(interview.created_at) : null;
  const dateStr = date ? formatDateDE(date, { day: "2-digit", month: "short", year: "numeric" }) : "";
  const trailerUrl = interview?.data?.trailer_url;
  const youtubeUrl = interview?.data?.youtube_url;

  return (
    <div style={{
      background: T.bgCard, borderRadius: 12, overflow: "hidden",
      boxShadow: T.card, border: "1px solid " + T.border,
    }}>
      <MediaVideo src={trailerUrl} style={{ borderRadius: 0 }} />
      <div style={{ padding: 12 }}>
        <span style={{
          fontSize: 10, fontWeight: 600, color: T.teal, background: T.tealSoft,
          padding: "2px 8px", borderRadius: 99,
        }}>
          {dateStr}
        </span>
        {interview.title && (
          <div style={{ fontSize: 14, fontWeight: 700, color: T.ink, lineHeight: 1.3, margin: "8px 0 4px" }}>
            {interview.title}
          </div>
        )}
        {interview.body && (
          <div style={{
            fontSize: 12, color: T.inkSoft, lineHeight: 1.5,
            overflow: "hidden", display: "-webkit-box",
            WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
          }}>
            {interview.body}
          </div>
        )}
        {youtubeUrl && (
          <a
            href={youtubeUrl} target="_blank" rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{ display: "inline-block", marginTop: 8, fontSize: 12, fontWeight: 600, color: T.teal, textDecoration: "none" }}
          >
            🎬 {youtubeUrl.length > 34 ? youtubeUrl.slice(0, 34) + "…" : youtubeUrl}
          </a>
        )}
      </div>
    </div>
  );
}

/**
 * @param {Array} interviews — bereits gefilterte notifications-Zeilen
 *   (id, title, body, created_at, data: {trailer_url, youtube_url})
 * @param {string} emptyLabel — i18n-Text fuer den Leer-Zustand
 */
export default function TrailerGrid({ interviews = [], emptyLabel = "" }) {
  if (!interviews.length) {
    return (
      <div style={{ padding: "24px 0", textAlign: "center", color: T.inkFaint, fontSize: 13 }}>
        {emptyLabel}
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
      {interviews.map(i => (
        <TrailerCard key={i.id} interview={i} />
      ))}
    </div>
  );
}
