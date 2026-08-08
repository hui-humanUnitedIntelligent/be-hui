// src/components/talents/TalentBookingFlow.jsx
// ══════════════════════════════════════════════════════════════════════
// TALENT-BOOKING-PAYMENT-001 (2026-07-05) — echte Buchung + Bezahlung für
// ein Talent-Angebot aus der "Talente entdecken"-Sektion (DiscoverPage.jsx).
//
// FIX 2026-07-11: Button war nicht sichtbar → Sheet-Struktur auf
// Sticky-Footer-Button umgebaut:
//   - Sheet = Flex-Column, maxHeight: "92dvh" (mehr Platz)
//   - Scroll-Bereich = flex:1, overflowY: auto, padding-bottom 0
//   - Button-Bereich = sticky am unteren Rand, immer sichtbar
//   - padding-bottom im Scroll-Bereich entfernt (kein Abstand mehr nötig
//     da Button außerhalb des Scroll-Bereichs)
//
// PFLICHT (.agents/rules/footer-navbar-zindex.md): Portal zu document.body,
// zIndex >= 10500, useWizardBodyLock() (Formular + Bezahl-Button).
// ══════════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../lib/AuthContext";
import { supabase } from "../../lib/supabaseClient.js";
import { useModalRegistration } from "../../hooks/useModalRegistration.js";
import { useWizardBodyLock } from "../../lib/wizardBodyLock.js";
import StripePaymentStep from "../commerce/StripePaymentStep.jsx";
import { IMPACT_RATE } from "../commerce/commerceUtils.js";
import AvailabilityCalendar from "./AvailabilityCalendar.jsx";
import { useSavedPostsContext } from "../../context/SavedPostsContext.jsx";
import { useHuiActions, A } from "../../core/hui.actions.js";
import { S } from "../../core/hui.sources.js";
import {
  expandTalentAvailableDates, describeRecurring, TALENT_LOCATION_LABELS, formatDuration,
  todayIsoLocal,
} from "../../lib/talentAvailability.js";

const TEAL  = "#16D7C5";
const CORAL = "#FF8A6B";

function fmtEur(n) {
  return `${Number(n).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}
function fmtDate(d) {
  try { return new Date(d + "T00:00:00").toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "short" }); }
  catch { return d; }
}
// TIME-LOCK-001 (2026-08-08): delegiert an die lokale SSOT (talentAvailability.js)
// statt eigener UTC-basierter Berechnung — sonst könnte "heute" um Mitternacht
// herum vom tatsächlichen lokalen Datum abweichen.
function todayIso() { return todayIsoLocal(); }
function addDaysIso(days) {
  const d = new Date(); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10);
}

export default function TalentBookingFlow({ talent, onClose = () => {} }) {
  const { user } = useAuth();
  useWizardBodyLock();
  useModalRegistration(true, onClose, "TalentBookingFlow");
  const { isSaved, toggleSave } = useSavedPostsContext();
  const actions = useHuiActions();
  const [showChatConfirm, setShowChatConfirm] = useState(false);
  const saved = isSaved(talent?.id);
  const handleSave = useCallback(() => {
    if (!talent?.id) return;
    toggleSave(talent.id, "talent", { title: talent?.title, cover_url: talent?.cover, author_name: talent?.author });
  }, [talent?.id, talent?.title, talent?.cover, talent?.author, toggleSave]);

  const [step,        setStep]        = useState("select"); // select | payment | success | error
  // Initial-Datum wird unten per useEffect gesetzt, sobald expandedDates bereit
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [participants, setParticipants] = useState(talent?.min_participants || 1);
  const [note,         setNote]         = useState("");
  const [availability, setAvailability] = useState(null);
  const [availLoading, setAvailLoading] = useState(false);
  const [errMsg,        setErrMsg]      = useState("");
  const [submitting,    setSubmitting]  = useState(false);

  // TIME-LOCK-001 (2026-08-08): Michael-Vorgabe — ein Termin für HEUTE, dessen
  // Startzeit bereits vergangen ist (aktuelle Uhrzeit > Slot-Start), darf
  // nicht mehr gebucht werden. Bsp: Slot 10:00–11:00, aktuell 10:10 Uhr →
  // heute nicht mehr buchbar. Tick alle 30s, damit die Sperre auch greift,
  // falls das Sheet über die Startzeit hinweg offen bleibt.
  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);
  const nowMinutes = useMemo(() => {
    const d = new Date(nowTick);
    return d.getHours() * 60 + d.getMinutes();
  }, [nowTick]);
  function slotStartMinutes(slot) {
    const [h, m] = String(slot?.start || "").split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  }
  function isSlotPastToday(slot, dateIso) {
    if (!slot || dateIso !== todayIso()) return false;
    return slotStartMinutes(slot) <= nowMinutes;
  }

  // Stripe-Zahlungsdaten (nach erfolgreicher Buchungs-Anlage)
  const [clientSecret,    setClientSecret]    = useState(null);
  const [publishableKey,  setPublishableKey]  = useState(null);
  const [bookingId,       setBookingId]       = useState(null);
  const [amountEur,       setAmountEur]       = useState(0);

  // Monatsverfügbarkeit für Kalenderansicht
  const [monthAvail, setMonthAvail] = useState({});
  const loadMonthAvailability = useCallback((isoMonth) => {
    if (!talent?.id) return;
    supabase.rpc("rpc_get_talent_month_availability", { p_talent_id: talent.id, p_month: isoMonth })
      .then(({ data }) => { if (data?.ok) setMonthAvail(prev => ({ ...prev, ...data.dates })); })
      .catch(() => {});
  }, [talent?.id]);

  const isGruppe   = talent?.booking_type === "gruppe";
  const hasSlots    = Array.isArray(talent?.available_time_slots) && talent.available_time_slots.length > 0;
  const minDate     = talent?.booking_window_start || todayIso();
  const maxDate     = talent?.booking_window_end || addDaysIso(365);

  // TALENT-BOOKING-RECURRING-001 (2026-08-08): available_dates wird bei
  // gesetztem `recurring` (wöchentlich/monatlich) gemäß des gewählten
  // Musters auf alle konkret buchbaren Tage im Buchungsfenster
  // hochgerechnet. Ohne recurring gelten die Anker-Tage literal.
  // SSOT: src/lib/talentAvailability.js — expandTalentAvailableDates().
  const expandedDates = useMemo(
    () => expandTalentAvailableDates(talent, { windowStart: minDate, windowEnd: maxDate }),
    [talent, minDate, maxDate]
  );
  const hasDates = expandedDates.length > 0;
  const recurringDesc = useMemo(() => describeRecurring(talent), [talent]);

  // Sobald expandedDates bereit ist, das initiale Datum auf den ersten
  // buchbaren Tag setzen (falls noch keins gewählt).
  useEffect(() => {
    if (!selectedDate && expandedDates.length > 0) {
      setSelectedDate(expandedDates[0]);
    }
  }, [expandedDates, selectedDate]);

  const fullDates = useMemo(
    () => Object.keys(monthAvail).filter(d => monthAvail[d]?.is_full),
    [monthAvail]
  );
  const slotAvailability = selectedDate ? monthAvail[selectedDate]?.slots : null;

  const isSelectedToday = selectedDate === todayIso();

  // TIME-LOCK-001: wird der gewählte Slot durch Zeitablauf (nowTick-Tick)
  // ungültig, automatisch abwählen — verhindert eine stehengebliebene
  // Auswahl, die der Nutzer nicht mehr buchen könnte.
  useEffect(() => {
    if (selectedSlot && isSlotPastToday(selectedSlot, selectedDate)) {
      setSelectedSlot(null);
    }
  }, [nowMinutes, selectedDate]); // eslint-disable-line react-hooks/exhaustive-deps

  // Alle Zeitfenster des Angebots für "heute" bereits vergangen?
  const allSlotsPastToday = hasSlots && isSelectedToday
    && talent.available_time_slots.every(s => isSlotPastToday(s, selectedDate));

  // Wochentag-Info für gewähltes Datum (für Feedback unter dem Datum-Input)
  const dateInfo = useMemo(() => {
    if (!selectedDate) return null;
    try {
      const dt = new Date(selectedDate + "T00:00:00");
      return {
        weekday: dt.toLocaleDateString("de-DE", { weekday: "long" }),
        full: dt.toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" }),
        isWeekend: dt.getDay() === 0 || dt.getDay() === 6,
      };
    } catch { return null; }
  }, [selectedDate]);

  const previewAmount = useMemo(() => {
    const p = Math.max(1, participants || 1);
    if (talent?.price_per_session != null) return talent.price_per_session * p;
    if (talent?.price_per_hour != null && talent.duration_minutes) {
      return Math.round(talent.price_per_hour * (talent.duration_minutes / 60) * p * 100) / 100;
    }
    return null;
  }, [talent, participants]);

  useEffect(() => {
    if (!talent?.id || !selectedDate || !isGruppe) { setAvailability(null); return; }
    let cancelled = false;
    setAvailLoading(true);
    supabase.rpc("rpc_get_talent_availability", { p_talent_id: talent.id, p_date: selectedDate })
      .then(({ data }) => { if (!cancelled) setAvailability(data || null); })
      .catch(() => { if (!cancelled) setAvailability(null); })
      .finally(() => { if (!cancelled) setAvailLoading(false); });
    return () => { cancelled = true; };
  }, [selectedDate, isGruppe, talent?.id]);

  const remaining = availability?.unlimited ? Infinity : (availability?.remaining ?? null);
  const isFull     = availability?.is_full === true;

  const selectedSlotFull = hasSlots && selectedSlot
    ? slotAvailability?.find(s => s.start === selectedSlot.start && s.end === selectedSlot.end)?.is_full === true
    : false;
  const selectedDateFullNoSlots = !hasSlots && selectedDate ? (monthAvail[selectedDate]?.is_full === true) : false;

  const canSubmit = !!selectedDate
    && (!hasSlots || !!selectedSlot)
    && !(selectedSlot && isSlotPastToday(selectedSlot, selectedDate)) // TIME-LOCK-001
    && participants >= (talent?.min_participants || 1)
    && (!isGruppe || remaining === null || remaining === Infinity || participants <= remaining)
    && !isFull
    && !selectedSlotFull
    && !selectedDateFullNoSlots;

  const handleBuchen = useCallback(async () => {
    if (!talent) return;
    if (!user?.id) return setErrMsg("Bitte melde dich an.");
    if (user.id === talent.user_id) return setErrMsg("Du kannst dein eigenes Angebot nicht buchen.");
    if (!canSubmit) return;

    setSubmitting(true);
    setErrMsg("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) throw new Error("Nicht eingeloggt.");

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const res = await fetch(`${supabaseUrl}/functions/v1/create-talent-booking-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          talent_id: talent.id,
          selected_date: selectedDate,
          time_slot: selectedSlot,
          participants,
          customer_note: note.trim() || null,
        }),
      });
      const result = await res.json();
      if (!res.ok || result.error) {
        throw new Error(result.error || "Buchung fehlgeschlagen.");
      }
      setClientSecret(result.clientSecret);
      setPublishableKey(result.publishableKey || null);
      setBookingId(result.bookingId);
      setAmountEur(result.amountEur);
      setStep("payment");
    } catch (e) {
      setErrMsg(e?.message || "Buchung fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setSubmitting(false);
    }
  }, [user, talent, canSubmit, selectedDate, selectedSlot, participants, note]);

  const handleStripeSuccess = useCallback(async () => {
    setStep("success");
  }, []);

  const handleStripeError = useCallback(() => {
    // Fehler wird bereits innerhalb von StripePaymentStep angezeigt
  }, []);


  if (!talent) return null;

  const priceStr = talent.price_per_hour != null
    ? `${fmtEur(talent.price_per_hour)}/Std`
    : talent.price_per_session != null
      ? `${fmtEur(talent.price_per_session)}/Termin`
      : null;

  return createPortal(
    <div
      onClick={(e) => { if (e.target === e.currentTarget && step !== "payment") onClose?.(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 10500,
        background: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      {/* ── Sheet-Container: FLEX COLUMN — Scroll oben, Button sticky unten ── */}
      <div style={{
        position: "relative",
        background: "#FDFCFA",
        borderRadius: "24px 24px 0 0",
        width: "100%",
        maxWidth: 480,
        /* FIX: 92dvh statt 88vh, dvh = dynamic viewport height (korrekt auf Mobile) */
        maxHeight: "92dvh",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 -8px 40px rgba(26,26,46,0.18)",
        animation: "tbfSlideUp 0.28s cubic-bezier(.32,1.2,.55,1) both",
        overflow: "hidden", /* wichtig: kein overflow am Container selbst */
      }}>
        <style>{`
          @keyframes tbfSlideUp {
            from { transform: translateY(100%); opacity: 0; }
            to   { transform: translateY(0);    opacity: 1; }
          }
        `}</style>

        {/* Handle — immer sichtbar oben */}
        <div style={{
          width: 40, height: 4, borderRadius: 2, background: "rgba(26,26,46,0.12)",
          margin: "12px auto 0", flexShrink: 0,
        }} />

        {/* ── SUCCESS ── */}
        {step === "success" && (
          <div style={{
            flex: 1, overflowY: "auto",
            padding: "20px 24px calc(env(safe-area-inset-bottom,16px) + 24px)",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#1A1A2E", marginBottom: 8 }}>
              Buchung bestätigt!
            </div>
            {/* Detaillierte Buchungsinfo */}
            <div style={{
              background: "rgba(22,215,197,0.06)", border: "1px solid rgba(22,215,197,0.15)",
              borderRadius: 14, padding: "14px 16px", marginBottom: 20, textAlign: "left",
            }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1A2E", marginBottom: 10 }}>
                {talent.title}
              </div>
              {talent.author && (
                <div style={{ fontSize: 13, color: "rgba(26,26,46,0.55)", marginBottom: 6 }}>
                  <span style={{ fontWeight: 600 }}>Anbieter:</span> {talent.author}
                </div>
              )}
              {selectedDate && (
                <div style={{ fontSize: 13, color: "rgba(26,26,46,0.55)", marginBottom: 6 }}>
                  <span style={{ fontWeight: 600 }}>Datum:</span> {fmtDate(selectedDate)}
                </div>
              )}
              {selectedSlot && (
                <div style={{ fontSize: 13, color: "rgba(26,26,46,0.55)", marginBottom: 6 }}>
                  <span style={{ fontWeight: 600 }}>Uhrzeit:</span> {selectedSlot.start}–{selectedSlot.end}
                </div>
              )}
              {participants > 1 && (
                <div style={{ fontSize: 13, color: "rgba(26,26,46,0.55)", marginBottom: 6 }}>
                  <span style={{ fontWeight: 600 }}>Teilnehmer:</span> {participants}
                </div>
              )}
              {amountEur > 0 && (
                <div style={{ fontSize: 13, color: "rgba(26,26,46,0.55)", marginBottom: 6 }}>
                  <span style={{ fontWeight: 600 }}>Betrag:</span> {fmtEur(amountEur)}
                </div>
              )}
              {note.trim() && (
                <div style={{ fontSize: 13, color: "rgba(26,26,46,0.55)", marginBottom: 6 }}>
                  <span style={{ fontWeight: 600 }}>Notiz:</span> {note.trim()}
                </div>
              )}
              <div style={{ fontSize: 13, color: "rgba(26,26,46,0.55)", marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(22,215,197,0.12)" }}>
                Der Anbieter wurde benachrichtigt und wird dich kontaktieren.
              </div>
            </div>
            <button onClick={onClose} style={{
              width: "100%", background: `linear-gradient(135deg,${TEAL},#0AB8B2)`,
              color: "#fff", border: "none", borderRadius: 14, padding: "14px 0",
              fontSize: 15, fontWeight: 700, cursor: "pointer", touchAction: "manipulation",
            }}>
              Schließen
            </button>
            {talent.user_id && (
              <button
                onClick={() => setShowChatConfirm(true)}
                style={{
                  width: "100%", marginTop: 10, padding: "14px 0",
                  borderRadius: 14, border: "1.5px solid rgba(20,20,34,0.10)",
                  background: "transparent", color: "rgba(26,26,46,0.65)",
                  fontSize: 15, fontWeight: 600, cursor: "pointer",
                  outline: "none", WebkitTapHighlightColor: "transparent",
                }}
              >
                Verkäufer kontaktieren
              </button>
            )}
          </div>
        )}

        {/* Ja/Nein-Bestätigung für Chat mit dem Anbieter */}
        {showChatConfirm && talent.user_id && (
          <div style={{
            position: "fixed", inset: 0, zIndex: 10600,
            background: "rgba(20,20,34,0.55)",
            backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{
              width: "88%", maxWidth: 320,
              background: "#FDFCFA", borderRadius: 20,
              padding: "24px 20px", textAlign: "center",
              boxShadow: "0 12px 48px rgba(20,20,34,0.25)",
            }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: "#1A1A2E", marginBottom: 8 }}>
                Mit {talent.author || "dem Verkäufer"} chatten?
              </div>
              <div style={{ fontSize: 14, color: "rgba(26,26,46,0.55)", lineHeight: 1.5, marginBottom: 20 }}>
                Möchtest du wirklich eine Unterhaltung mit dem Verkäufer starten?
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => setShowChatConfirm(false)}
                  style={{
                    flex: 1, padding: "14px 0", borderRadius: 13,
                    border: "1.5px solid rgba(20,20,34,0.10)",
                    background: "transparent", color: "rgba(26,26,46,0.65)",
                    fontSize: 15, fontWeight: 600, cursor: "pointer",
                    outline: "none", WebkitTapHighlightColor: "transparent",
                  }}
                >
                  Nein
                </button>
                <button
                  onClick={() => {
                    setShowChatConfirm(false);
                    actions[A.OPEN_CHAT]?.({
                      recipient: {
                        id: talent.user_id,
                        display_name: talent.author || "Verkäufer",
                        avatar_url: null,
                      },
                      source: S.SYSTEM,
                    });
                    onClose?.();
                  }}
                  style={{
                    flex: 1, padding: "14px 0", borderRadius: 13,
                    border: "none",
                    background: TEAL, color: "#fff",
                    fontSize: 15, fontWeight: 700, cursor: "pointer",
                    outline: "none", WebkitTapHighlightColor: "transparent",
                  }}
                >
                  Ja
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── PAYMENT ── */}
        {/* BUGFIX: StripePaymentStep erwartet Prop "total" (nicht "amountEur") und */}
        {/* verwaltet seinen eigenen <Elements>-Kontext intern — die äußere <Elements> */}
        {/* hier war redundant und wurde entfernt (führte zu 0,00€-Anzeige, da "total" */}
        {/* nie gesetzt wurde und auf den Default 0 zurückfiel). */}
        {step === "payment" && clientSecret && (
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 0 0" }}>
            <StripePaymentStep
              clientSecret={clientSecret}
              publishableKey={publishableKey}
              total={amountEur}
              impact={Math.round(amountEur * IMPACT_RATE * 100) / 100}
              orderId={bookingId}
              onSuccess={handleStripeSuccess}
              onError={handleStripeError}
              onBack={() => setStep("select")}
            />
          </div>
        )}

        {/* ── SELECT (Hauptformular) ── */}
        {step === "select" && (
          <>
            {/* Scroll-Bereich — alles außer Buttons */}
            <div style={{
              flex: 1,
              overflowY: "auto",
              padding: "20px 24px 16px",
              WebkitOverflowScrolling: "touch",
            }}>
              {/* Header */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: TEAL,
                  textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                  Talent buchen
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "#1A1A2E", lineHeight: 1.3 }}>
                  {talent.title}
                </div>
                {talent.author && (
                  <div style={{ fontSize: 13, color: "rgba(26,26,46,0.45)", marginTop: 3 }}>
                    bei {talent.author}
                  </div>
                )}
              </div>

              {/* ── Angebots-Details, kompakt (2026-08-08 Redesign): Chips im
                  systemweiten 11px/3px-8px-Chip-Standard (siehe
                  Interessen-Chips PublicProfilePage.jsx), Wiederholung +
                  Ort-Zusatz als eine schlanke Meta-Zeile statt eigener
                  breiter Pills, Preis direkt in dieselbe Karte integriert
                  statt separater Box darunter — deutlich weniger Höhe. ── */}
              <div style={{
                background: "#fff", border: "1px solid rgba(26,26,46,0.08)",
                borderRadius: 16, padding: "13px 15px", marginBottom: 16,
              }}>
                {talent.description && (
                  <div style={{
                    fontSize: 13, color: "rgba(26,26,46,0.62)", lineHeight: 1.5, marginBottom: 9,
                    overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical",
                  }}>
                    {talent.description}
                  </div>
                )}

                {/* Kompakte Chip-Reihe — 11px / 3px-8px Padding (SSOT-Chip-Standard) */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {talent.category && (
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#1A1A2E",
                      background: "#fff", border: `1px solid rgba(22,215,197,0.35)`,
                      borderRadius: 99, padding: "3px 8px" }}>
                      {talent.category}
                    </span>
                  )}
                  {TALENT_LOCATION_LABELS[talent.location_type] && (
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#1A1A2E",
                      background: "#fff", border: "1px solid rgba(26,26,46,0.12)",
                      borderRadius: 99, padding: "3px 8px" }}>
                      {TALENT_LOCATION_LABELS[talent.location_type]}
                    </span>
                  )}
                  {formatDuration(talent.duration_minutes) && (
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#1A1A2E",
                      background: "#fff", border: "1px solid rgba(26,26,46,0.12)",
                      borderRadius: 99, padding: "3px 8px" }}>
                      {formatDuration(talent.duration_minutes)}
                    </span>
                  )}
                  {talent.booking_type === "gruppe" && (
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#1A1A2E",
                      background: "#fff", border: "1px solid rgba(26,26,46,0.12)",
                      borderRadius: 99, padding: "3px 8px" }}>
                      {talent.min_participants > 1 ? `Gruppe ab ${talent.min_participants}` : "Gruppe"}
                      {talent.max_participants > 0 ? ` · max ${talent.max_participants}` : ""}
                    </span>
                  )}
                  {hasSlots && (
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#1A1A2E",
                      background: "#fff", border: "1px solid rgba(26,26,46,0.12)",
                      borderRadius: 99, padding: "3px 8px" }}>
                      {talent.available_time_slots.map(s => `${s.start}–${s.end}`).join(", ")}
                    </span>
                  )}
                </div>

                {/* Eine schlanke Meta-Zeile statt separater breiter Pills */}
                {(recurringDesc || (talent.location_address && talent.location_type !== "online") || talent.location_notes) && (
                  <div style={{ fontSize: 11.5, color: "rgba(26,26,46,0.5)", marginTop: 8, lineHeight: 1.5 }}>
                    {[
                      recurringDesc,
                      talent.location_type !== "online" ? talent.location_address : null,
                      talent.location_notes,
                    ].filter(Boolean).join("  ·  ")}
                  </div>
                )}

                {/* Preis — direkt in derselben Karte, kein eigener Block mehr */}
                {priceStr && (
                  <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(26,26,46,0.07)",
                  }}>
                    <span style={{ fontSize: 12.5, color: "rgba(26,26,46,0.5)" }}>Preis</span>
                    <span style={{ fontSize: 17, fontWeight: 800, color: TEAL }}>{priceStr}</span>
                  </div>
                )}
              </div>

              {/* Termin / Kalender — immer als Monatskalender, niemals nur input[type=date] */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A2E", marginBottom: 8 }}>
                  Termin wählen
                </div>
                <div style={{
                  background: "#fff", border: "1.5px solid rgba(26,26,46,0.10)", borderRadius: 14,
                  padding: "14px 12px",
                }}>
                  <AvailabilityCalendar
                    mode={hasDates ? "book" : "free"}
                    availableDates={expandedDates}
                    selectedDate={selectedDate}
                    onSelectDate={(d) => { setSelectedDate(d); setSelectedSlot(null); }}
                    fullDates={fullDates}
                    onMonthChange={loadMonthAvailability}
                    minDate={minDate}
                    maxDate={maxDate}
                  />
                </div>
                {/* Wochentag-Feedback unter dem Kalender nach Auswahl */}
                {dateInfo && (
                  <div style={{
                    marginTop: 8, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
                  }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      background: dateInfo.isWeekend ? "rgba(255,138,107,0.12)" : "rgba(13,196,181,0.10)",
                      color: dateInfo.isWeekend ? "#FF8A6B" : "rgba(0,150,136,1)",
                      borderRadius: 99, padding: "5px 12px",
                      fontSize: 12, fontWeight: 700,
                    }}>
                      {dateInfo.weekday}, {dateInfo.full}
                    </span>
                    {/* Im free-Mode: zeige ob Tag bereits ausgebucht ist */}
                    {!hasDates && selectedDate && monthAvail[selectedDate]?.is_full && (
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        background: "rgba(232,58,58,0.08)", color: "rgba(185,28,28,1)",
                        borderRadius: 99, padding: "5px 12px", fontSize: 12, fontWeight: 600,
                      }}>Bereits ausgebucht</span>
                    )}
                  </div>
                )}
              </div>

              {/* Zeitfenster */}
              {hasSlots && selectedDate && (
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A2E", marginBottom: 8 }}>Uhrzeit</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {talent.available_time_slots.map((s, i) => {
                      const active = selectedSlot && selectedSlot.start === s.start && selectedSlot.end === s.end;
                      const slotInfo = slotAvailability?.find(x => x.start === s.start && x.end === s.end);
                      const full = slotInfo?.is_full === true;
                      // TIME-LOCK-001: heutiger Termin, dessen Startzeit bereits
                      // vergangen ist, gilt ebenfalls als nicht buchbar.
                      const past = isSlotPastToday(s, selectedDate);
                      const blocked = full || past;
                      const label = full ? "belegt" : past ? "vorbei" : "";
                      return (
                        <button key={i} type="button" onClick={() => !blocked && setSelectedSlot(s)} disabled={blocked} style={{
                          padding: "8px 14px", borderRadius: 10,
                          border: `1.5px solid ${blocked ? "rgba(232,58,58,0.2)" : active ? TEAL : "rgba(26,26,46,0.12)"}`,
                          background: blocked ? "rgba(232,58,58,0.05)" : active ? "rgba(22,215,197,0.1)" : "#fff",
                          color: blocked ? "rgba(232,58,58,0.55)" : active ? TEAL : "rgba(26,26,46,0.7)",
                          fontSize: 13, fontWeight: 600, cursor: blocked ? "default" : "pointer", touchAction: "manipulation",
                          textDecoration: blocked ? "line-through" : "none",
                        }}>
                          {s.start}–{s.end}{label ? ` · ${label}` : ""}
                        </button>
                      );
                    })}
                  </div>
                  {/* Hinweis, wenn heute keine Zeit mehr buchbar ist */}
                  {allSlotsPastToday && (
                    <div style={{
                      marginTop: 8, fontSize: 12.5, color: "rgba(232,58,58,0.85)",
                      background: "rgba(232,58,58,0.06)", borderRadius: 10, padding: "8px 12px",
                    }}>
                      Für heute sind alle Zeiten bereits vorbei — bitte wähle einen anderen Tag.
                    </div>
                  )}
                </div>
              )}

              {/* Teilnehmer (Gruppenangebote) */}
              {isGruppe && (
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A2E", marginBottom: 8 }}>Teilnehmer</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <button type="button"
                      onClick={() => setParticipants(p => Math.max(talent.min_participants || 1, p - 1))}
                      style={{
                        width: 36, height: 36, borderRadius: 10, border: "1.5px solid rgba(26,26,46,0.12)",
                        background: "#fff", fontSize: 18, fontWeight: 700, color: "#1A1A2E",
                        cursor: "pointer", touchAction: "manipulation",
                      }}>−</button>
                    <span style={{ fontSize: 16, fontWeight: 700, color: "#1A1A2E", minWidth: 24, textAlign: "center" }}>
                      {participants}
                    </span>
                    <button type="button"
                      onClick={() => setParticipants(p => {
                        const cap = remaining === Infinity || remaining === null ? talent.max_participants : Math.min(talent.max_participants, remaining);
                        return Math.min(cap || 1, p + 1);
                      })}
                      style={{
                        width: 36, height: 36, borderRadius: 10, border: "1.5px solid rgba(26,26,46,0.12)",
                        background: "#fff", fontSize: 18, fontWeight: 700, color: "#1A1A2E",
                        cursor: "pointer", touchAction: "manipulation",
                      }}>+</button>
                    {selectedDate && (
                      <span style={{ fontSize: 12, color: availLoading ? "rgba(26,26,46,0.35)" : (isFull ? "#E83A3A" : "rgba(26,26,46,0.45)"), marginLeft: 4 }}>
                        {availLoading ? "prüfe Verfügbarkeit…" : isFull ? "ausgebucht" : (remaining != null && remaining !== Infinity ? `${remaining} Plätze frei` : "")}
                      </span>
                    )}
                  </div>
                  {/* Uhrzeit direkt bei Teilnehmer sichtbar (Michael-Vorgabe 2026-08-08) */}
                  {selectedDate && (
                    <div style={{ fontSize: 12.5, color: "rgba(26,26,46,0.5)", marginTop: 8 }}>
                      Uhrzeit: {hasSlots
                        ? (selectedSlot ? `${selectedSlot.start}–${selectedSlot.end} Uhr` : "bitte oben wählen")
                        : "flexibel / ganztägig"}
                    </div>
                  )}
                </div>
              )}

              {/* Nachricht */}
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Nachricht an den Anbieter (optional)…"
                rows={2}
                style={{
                  width: "100%", resize: "none",
                  border: "1.5px solid rgba(26,26,46,0.12)", borderRadius: 14, padding: "12px 14px",
                  fontSize: 14, color: "#1A1A2E", background: "#fff", outline: "none",
                  marginBottom: 12, fontFamily: "inherit", lineHeight: 1.5, boxSizing: "border-box",
                }}
              />

              {/* Vorschau Gesamtbetrag */}
              {previewAmount != null && (
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "12px 16px", borderRadius: 14, background: "rgba(255,138,107,0.08)",
                  border: "1px solid rgba(255,138,107,0.18)",
                }}>
                  <span style={{ fontSize: 13, color: "rgba(26,26,46,0.55)" }}>Gesamt</span>
                  <span style={{ fontSize: 20, fontWeight: 800, color: CORAL }}>{fmtEur(previewAmount)}</span>
                </div>
              )}

              {/* Fehler */}
              {errMsg && (
                <div style={{
                  fontSize: 13, color: "#E83A3A", marginTop: 12,
                  padding: "10px 12px", borderRadius: 10, background: "rgba(232,58,58,0.07)",
                }}>
                  {errMsg}
                </div>
              )}
            </div>

            {/* ── STICKY BUTTON-BEREICH — immer sichtbar, außerhalb des Scroll-Bereichs ── */}
            <div style={{
              flexShrink: 0,
              padding: `12px 24px calc(env(safe-area-inset-bottom, 16px) + 12px)`,
              background: "#FDFCFA",
              borderTop: "1px solid rgba(26,26,46,0.07)",
              display: "flex",
              gap: 10,
            }}>
              <button onClick={handleSave} style={{
                flex: 1, background: "transparent", border: "1.5px solid rgba(26,26,46,0.15)",
                borderRadius: 14, padding: "13px 0", fontSize: 14, fontWeight: 600,
                color: "rgba(26,26,46,0.55)", cursor: "pointer", touchAction: "manipulation",
              }}>
                {saved ? "Gemerkt ✓" : "Merken"}
              </button>
              <button
                onClick={handleBuchen}
                disabled={submitting || !canSubmit}
                style={{
                  flex: 2,
                  background: (submitting || !canSubmit) ? "rgba(22,215,197,0.4)" : `linear-gradient(135deg,${TEAL},#0AB8B2)`,
                  color: "#fff", border: "none", borderRadius: 14, padding: "13px 0",
                  fontSize: 15, fontWeight: 700,
                  cursor: (submitting || !canSubmit) ? "not-allowed" : "pointer",
                  touchAction: "manipulation",
                }}
              >
                {submitting ? "Wird vorbereitet…" : (isFull ? "Ausgebucht" : "Buchen")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
