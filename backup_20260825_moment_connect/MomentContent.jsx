// src/feed/cards/MomentContent.jsx — HUI Feed Card v2
// Badge-Logik: Foto-Moment / Video-Moment / Bild-Moment (Galerie) / Gedanke
// Identisches Layout zu WorkContent / ExperienceContent / TalentContent
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient.js";
import BaseFeedCard, { ActionBtn } from "./BaseFeedCard.jsx";
import { useContentPreview } from "../../context/ContentPreviewContext.jsx";
import ReportReasonModal from "../../components/shared/ReportReasonModal.jsx";
import { useAuth } from "../../lib/AuthContext.jsx";

// ── Farben (identisch zu WorkContent / ExperienceContent) ────
const TEAL       = "#0DC4B5";
const TEAL_SOFT  = "rgba(13,196,181,0.10)";
const TEAL_BORD  = "rgba(13,196,181,0.22)";
const INK        = "#1A1A2E";
const INK3       = "rgba(26,26,46,0.42)";

// ── Melden-Icon (top-level — stabile Referenz für ActionBtn) ─────────────
// Finger-Icon: "Ich melde das" — Stroke 2px/round wie alle anderen Feed-Icons
const CORAL = "#C47A65";
function XIcon({ size = 24 }) {
  // X-Icon ("Melden") — Stroke 2.1px, gleicher Stil wie Heart/Chat/Share/Bookmark
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"
      aria-label="Melden"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ── Badge-Mapping: type × moment_source → Label + Farbe ──────
function getMomentBadge(raw) {
  // moment_type: der ursprüngliche beitraege.type (video/foto/gedanke) —
  // raw.type ist nach der Feed-Normalisierung immer "moment" (Top-Level-
  // Klassifizierung für die Card-Auswahl), siehe normalizeMomentRow() in
  // unifiedNormalizer.js. moment_type als Fallback falls type noch den
  // Rohwert trägt (z.B. ältere/gecachte Items).
  const type   = (raw?.moment_type || raw?.type || "").toLowerCase();
  const source = (raw?.moment_source || "").toLowerCase();

  // Galerie-Quelle → "Bild-Moment" (unabhängig von type)
  if (source === "galerie") {
    return {
      label:  "Bild-Moment",
      color:  "#8E44C8",
      bg:     "rgba(142,68,200,0.10)",
      border: "rgba(142,68,200,0.22)",
    };
  }

  if (type === "video" || source === "video") {
    return {
      label:  "Video-Moment",
      color:  "#E6A817",
      bg:     "rgba(230,168,23,0.10)",
      border: "rgba(230,168,23,0.22)",
    };
  }

  if (type === "foto" || source === "foto") {
    return {
      label:  "Foto-Moment",
      color:  TEAL,
      bg:     TEAL_SOFT,
      border: TEAL_BORD,
    };
  }

  // "gedanke" oder kein Typ → Gedanke
  return {
    label:  "Gedanke",
    color:  "#5B7EC9",
    bg:     "rgba(91,126,201,0.10)",
    border: "rgba(91,126,201,0.22)",
  };
}

export default function MomentContent({ item, onProfile, onReaction, onShare }) {
  // HOOK-ORDER-FIX (2026-08-08): ALLE Hooks (useContentPreview, useAuth,
  // useState x4, useEffect, useCallback) standen vorher NACH
  // "if (!item) return null" -- sobald item kurzzeitig null/undefined war
  // (z.B. waehrend Feed-Virtualisierung ein Item aus dem Cache entfernt),
  // ueberspreng React ALLE diese Hooks fuer diesen Render. Beim naechsten
  // Render mit gueltigem item wichen die Hook-Reihenfolgen voneinander ab
  // -> "Minified React error #310" ("Kurzer Aussetzer"-Screen), reproduzierbar
  // beim Antippen eines Moment-Bildes im Feed. Jetzt: alle Hooks vor dem
  // fruehen return.
  const { open }  = useContentPreview();
  const navigate = useNavigate();
  const { user }  = useAuth(); // FIX (2026-08-08): AuthContext-SSOT statt eigenem
  // supabase.auth.getUser()-Aufruf — jede Feed-Karte rief das vorher einzeln
  // beim Mount auf. Bei mehreren gleichzeitig gerenderten Momente-Karten
  // (Feed-Virtualisierung hält mehrere im DOM) führte das zu N redundanten
  // Netzwerk-Requests an /auth/v1/user, die in der Konsole als 403-Fehler
  // auftauchten (Screenshot Michael, 2026-08-08 — 6x identischer 403 beim
  // Öffnen des Talent-Buchungs-Modals, verursacht von im Hintergrund noch
  // gemounteten Momente-Karten im Feed, nicht vom Modal selbst).

  // ── MOMENTE-REPORTS-001: Melden-State ─────────────────────────
  const [reported,   setReported]   = useState(false);
  const [reporting,  setReporting]  = useState(false);
  const [reportDone, setReportDone] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  // Prüfen ob dieser Nutzer den Moment bereits gemeldet hat
  useEffect(() => {
    if (!item?._raw?.id || !user?.id) return;
    supabase
      .from("momente_reports")
      .select("id", { count: "exact", head: true })
      .eq("moment_id", item._raw.id)
      .eq("reporter_id", user.id)
      .then(({ count }) => {
        if ((count ?? 0) > 0) setReported(true);
      });
  }, [item?._raw?.id, user?.id]);

  const handleReport = useCallback(async (reason = "inappropriate") => {
    if (reported || reporting) return;
    const momentId = item?._raw?.id || item?.id;
    if (!momentId) return;
    setReporting(true);
    try {
      // CORS-FIX: Direkt über Supabase REST (kein Edge Function Call)
      // FIX (2026-08-08): AuthContext-User statt eigenem getUser()-Netzwerkcall.
      if (!user) throw new Error("not_authenticated");

      // 1) Meldung eintragen (UNIQUE constraint verhindert Doppelmeldung)
      // MELDE-FLOW-002: reason kommt jetzt aus der Kategorie-Auswahl im
      // ReportReasonModal statt hartkodiert "inappropriate".
      const { error: insertError } = await supabase
        .from("momente_reports")
        .insert({ moment_id: momentId, reporter_id: user.id, reason });

      // 409 = bereits gemeldet — kein echter Fehler
      if (insertError && insertError.code !== "23505") throw insertError;

      // 2) Anzahl Meldungen prüfen (COUNT verschiedener Reporter)
      const { count } = await supabase
        .from("momente_reports")
        .select("id", { count: "exact", head: true })
        .eq("moment_id", momentId);

      // 3) Bei >= 5 Meldungen → Status in beitraege auf "reported" setzen
      if ((count ?? 0) >= 5) {
        await supabase
          .from("beitraege")
          .update({ visibility_scope: "reported" })
          .eq("id", momentId);
      }

      setReported(true);
      setReportDone(true);
      setReportModalOpen(false);
      setTimeout(() => setReportDone(false), 2500);
    } catch (e) {
      console.warn("[MomentReport]", e);
    } finally {
      setReporting(false);
    }
  }, [reported, reporting, item, user]);

  if (!item) return null;

  const raw       = item._raw || {};
  const caption   = item.text || item.title || raw.caption || "";
  const badge     = getMomentBadge(raw);
  // SYSTEMNACHRICHT-FIX (2026-08-13): Bei Admin-Broadcasts soll der volle
  // Text sichtbar sein (kein Abschneiden nach 3 Zeilen) -- caption ist hier
  // durch die unifiedNormalizer.js-Erweiterung bereits Titel+Inhalt kombiniert.
  const isBroadcast = raw.moment_source === "system_broadcast";

  // reportButton als ActionBtn — identischer Look zu Heart/Chat/Share/Bookmark
  // FingerIcon + CORAL sind top-level (stabile Referenz — verhindert Remount-Bug)
  const reportButton = (
    <div style={{ position: "relative" }}>
      <ActionBtn
        Icon={XIcon}
        active={reported}
        activeColor={CORAL}
        inactiveColor={CORAL}
        variant="melden"
        disabled={reported || reporting}
        onClick={() => setReportModalOpen(true)}
      />
      <ReportReasonModal
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        onSubmit={(reasonKey) => handleReport(reasonKey)}
        submitting={reporting}
      />
      {reportDone && (
        <span style={{
          position:   "absolute",
          bottom:     -16,
          left:       "50%",
          transform:  "translateX(-50%)",
          fontSize:   9,
          fontWeight: 600,
          color:      CORAL,
          whiteSpace: "nowrap",
          pointerEvents: "none",
          letterSpacing: "0.2px",
        }}>
          Gemeldet
        </span>
      )}
    </div>
  );

  const isSystemProjectLink = raw.moment_source === "system_impact_completion" && !!raw.linked_project_id;

  return (
    <BaseFeedCard
      item={item}
      onProfile={onProfile}
      onReaction={onReaction}
      onShare={onShare}
      disableMediaLightbox={isSystemProjectLink}
      onCardClick={() => {
        // SYSTEM-PROJECT-LINK-001 (2026-08-10): System-Posts ("HUI" teilt
        // ein fertiges Projekt) fuehren per Klick direkt zum Projekt statt
        // zum Foto-Fullscreen -- additiv, betrifft ausschliesslich Posts mit
        // moment_source=system_impact_completion + linked_project_id.
        // Alle anderen Momente-Karten sind unveraendert (open(item)).
        if (isSystemProjectLink) {
          navigate("/impact", { state: { openProjectId: raw.linked_project_id } });
          return;
        }
        open(item);
      }}
      extraActions={reportButton}
    >
      {/* ── Titel — volle Kartenbreite, bis zu 3 Zeilen sichtbar
          (FIX 2026-08-11 v2: Typ-Badge "Foto-Moment" etc. entfernt, siehe
          Michael-Screenshot — der grüne Badge nahm dem Titel unnötig
          Breite weg. Titel nutzt jetzt die komplette Kartenbreite. ── */}
      <div style={{
        marginBottom: caption ? 6 : 0,
        minWidth: 0,
      }}>
        {/* Caption / Titel — 2-3 Zeilen sichtbar statt 1-zeilig+"…" */}
        {caption ? (
          <span style={{
            display: isBroadcast ? "block" : "-webkit-box",
            fontSize: 15,
            fontWeight: 600,
            color: INK,
            lineHeight: 1.4,
            letterSpacing: "-0.02em",
            ...(isBroadcast ? {} : {
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }),
            wordBreak: "break-word",
            whiteSpace: isBroadcast ? "pre-line" : "normal",
          }}>
            {caption}
          </span>
        ) : null}
      </div>

      {/* System-Projekt-Abschluss-Post: eigener, nicht-redundanter
          Zusatztext statt Duplikat der Caption (FIX 2026-08-11) */}
      {isSystemProjectLink && (
        <p style={{
          margin: "0 0 4px",
          fontSize: 14,
          lineHeight: 1.6,
          color: INK3,
          fontWeight: 400,
          letterSpacing: "-0.01em",
        }}>
          Das ist die Kraft von HUI: Wenn viele zusammenhalten, wird aus einer Idee Wirklichkeit. Entdecke im Impact-Bereich, welches Projekt du als Nächstes unterstützen möchtest.
        </p>
      )}
    </BaseFeedCard>
  );
}
