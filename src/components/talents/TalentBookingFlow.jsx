// src/components/talents/TalentBookingFlow.jsx
// ══════════════════════════════════════════════════════════════════════
// TALENT-BOOKING-PAYMENT-001 (2026-07-05) — echte Buchung + Bezahlung für
// ein Talent-Angebot aus der "Talente entdecken"-Sektion (DiscoverPage.jsx).
//
// Evolution von TalentAnfrageFlow.jsx (reine Anfrage ohne Preis/Termin/Zahlung):
// Wenn das Angebot Preis+Kapazität hat, läuft jetzt der komplette Flow
// Termin/Teilnehmer wählen → Verfügbarkeit live prüfen → Stripe-Zahlung →
// Bestätigung. TalentAnfrageFlow.jsx bleibt unverändert bestehen (kein Rewrite),
// DiscoverPage öffnet ab jetzt diese neue Komponente.
//
// Preisformel (serverseitig autoritativ in rpc_create_talent_booking,
// hier nur als Vorschau gespiegelt):
//   price_per_session vorhanden  -> price_per_session * participants
//   sonst price_per_hour + duration_minutes -> price_per_hour * (min/60) * participants
//
// PFLICHT (.agents/rules/footer-navbar-zindex.md): Portal zu document.body,
// zIndex >= 10500, useWizardBodyLock() (Formular + Bezahl-Button).
// ══════════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../lib/AuthContext";
import { supabase } from "../../lib/supabaseClient.js";
import { useWizardBodyLock } from "../../lib/wizardBodyLock.js";
import { getStripe } from "../../lib/stripe.js";
import { Elements } from "@stripe/react-stripe-js";
import StripePaymentStep from "../commerce/StripePaymentStep.jsx";
import AvailabilityCalendar from "./AvailabilityCalendar.jsx";

const TEAL  = "#16D7C5";
const CORAL = "#FF8A6B";

function fmtEur(n) {
  return `${Number(n).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}
function fmtDate(d) {
  try { return new Date(d + "T00:00:00").toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "short" }); }
  catch { return d; }
}
function todayIso() { return new Date().toISOString().slice(0, 10); }
function addDaysIso(days) {
  const d = new Date(); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10);
}

export default function TalentBookingFlow({ talent, onClose }) {
  const { user } = useAuth();
  useWizardBodyLock();

  const [step,        setStep]        = useState("select"); // select | payment | success | error
  const [selectedDate, setSelectedDate] = useState(talent?.available_dates?.[0] || "");
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [participants, setParticipants] = useState(talent?.min_participants || 1);
  const [note,         setNote]         = useState("");
  const [availability, setAvailability] = useState(null); // { unlimited, remaining, is_full }
  const [availLoading, setAvailLoading] = useState(false);
  const [errMsg,        setErrMsg]      = useState("");
  const [submitting,    setSubmitting]  = useState(false);

  // Stripe-Zahlungsdaten (nach erfolgreicher Buchungs-Anlage)
  const [clientSecret,    setClientSecret]    = useState(null);
  const [publishableKey,  setPublishableKey]  = useState(null);
  const [bookingId,       setBookingId]       = useState(null);
  const [amountEur,       setAmountEur]       = useState(0);

  // STANDORT-KALENDER-037: echte Monatsverfuegbarkeit (statt nur Einzeldatum-
  // Abfrage) fuer die Kalenderansicht + Zeitfenster-Anzeige.
  const [monthAvail, setMonthAvail] = useState({}); // { "YYYY-MM-DD": {has_slots, slots:[...], is_full, remaining} }
  const loadMonthAvailability = useCallback((isoMonth) => {
    if (!talent?.id) return;
    supabase.rpc("rpc_get_talent_month_availability", { p_talent_id: talent.id, p_month: isoMonth })
      .then(({ data }) => { if (data?.ok) setMonthAvail(prev => ({ ...prev, ...data.dates })); })
      .catch(() => {});
  }, [talent?.id]);

  if (!talent) return null;

  const isGruppe   = talent.booking_type === "gruppe";
  const hasDates    = Array.isArray(talent.available_dates) && talent.available_dates.length > 0;
  const hasSlots    = Array.isArray(talent.available_time_slots) && talent.available_time_slots.length > 0;
  const minDate     = talent.booking_window_start || todayIso();
  const maxDate     = talent.booking_window_end || addDaysIso(90);

  // Termine, die laut Live-Verfuegbarkeit komplett ausgebucht sind (fuer Kalender-Grauung)
  const fullDates = useMemo(
    () => Object.keys(monthAvail).filter(d => monthAvail[d]?.is_full),
    [monthAvail]
  );
  // Verfuegbarkeit der aktuell gewaehlten Zeitfenster am gewaehlten Datum (falls Slots konfiguriert)
  const slotAvailability = selectedDate ? monthAvail[selectedDate]?.slots : null;

  const priceStr = talent.price_per_hour != null
    ? `${fmtEur(talent.price_per_hour)}/Std`
    : talent.price_per_session != null
      ? `${fmtEur(talent.price_per_session)}/Termin`
      : null;

  // Preis-Vorschau (client-seitig, Server rechnet autoritativ nach)
  const previewAmount = useMemo(() => {
    const p = Math.max(1, participants || 1);
    if (talent.price_per_session != null) return talent.price_per_session * p;
    if (talent.price_per_hour != null && talent.duration_minutes) {
      return Math.round(talent.price_per_hour * (talent.duration_minutes / 60) * p * 100) / 100;
    }
    return null;
  }, [talent, participants]);

  // Live-Verfügbarkeit laden, sobald Datum gewählt ist (nur relevant bei Gruppenangeboten)
  useEffect(() => {
    if (!selectedDate || !isGruppe) { setAvailability(null); return; }
    let cancelled = false;
    setAvailLoading(true);
    supabase.rpc("rpc_get_talent_availability", { p_talent_id: talent.id, p_date: selectedDate })
      .then(({ data }) => { if (!cancelled) setAvailability(data || null); })
      .catch(() => { if (!cancelled) setAvailability(null); })
      .finally(() => { if (!cancelled) setAvailLoading(false); });
    return () => { cancelled = true; };
  }, [selectedDate, isGruppe, talent.id]);

  const remaining = availability?.unlimited ? Infinity : (availability?.remaining ?? null);
  const isFull     = availability?.is_full === true;

  // Zusaetzliche, praezisere Sperre aus der Monats-Kalenderansicht: wenn Slots
  // konfiguriert sind, gilt der gewaehlte Slot selbst als gebucht/voll (auch
  // fuer Einzelbuchungen, wo die alte "isGruppe"-Pruefung oben nichts sperrte).
  const selectedSlotFull = hasSlots && selectedSlot
    ? slotAvailability?.find(s => s.start === selectedSlot.start && s.end === selectedSlot.end)?.is_full === true
    : false;
  const selectedDateFullNoSlots = !hasSlots && selectedDate ? (monthAvail[selectedDate]?.is_full === true) : false;

  const canSubmit = !!selectedDate
    && (!hasSlots || !!selectedSlot)
    && participants >= (talent.min_participants || 1)
    && (!isGruppe || remaining === null || remaining === Infinity || participants <= remaining)
    && !isFull
    && !selectedSlotFull
    && !selectedDateFullNoSlots;

  const handleBuchen = useCallback(async () => {
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

  const stripePromise = useMemo(() => (step === "payment" ? getStripe() : null), [step]);

  return createPortal(
    <div
      onClick={(e) => { if (e.target === e.currentTarget && step !== "payment") onClose?.(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 10500, /* >BottomNav(10000) — Pflichtregel footer-navbar-zindex.md */
        background: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <div style={{
        position: "relative", background: "#FDFCFA", borderRadius: "24px 24px 0 0",
        width: "100%", maxWidth: 480, maxHeight: "88vh", overflowY: "auto",
        padding: step === "payment" ? "20px 0 0" : "28px 24px calc(env(safe-area-inset-bottom,16px) + 40px)",
        boxShadow: "0 -8px 40px rgba(26,26,46,0.18)",
        animation: "tbfSlideUp 0.28s cubic-bezier(.32,1.2,.55,1) both",
        boxSizing: "border-box",
      }}>
        <style>{`
          @keyframes tbfSlideUp {
            from { transform: translateY(100%); opacity: 0; }
            to   { transform: translateY(0);    opacity: 1; }
          }
        `}</style>

        {/* Handle */}
        <div style={{
          width: 40, height: 4, borderRadius: 2, background: "rgba(26,26,46,0.12)",
          margin: step === "payment" ? "0 auto 16px" : "0 auto 24px",
        }} />

        {step === "success" && (
          <div style={{ textAlign: "center", padding: "16px 0 8px" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#1A1A2E", marginBottom: 8 }}>
              Buchung bestätigt
            </div>
            <div style={{ fontSize: 14, color: "rgba(26,26,46,0.55)", marginBottom: 8, lineHeight: 1.5 }}>
              Deine Zahlung war erfolgreich. {talent.author || "Der Anbieter"} wurde benachrichtigt.
            </div>
            <div style={{ fontSize: 13, color: "rgba(26,26,46,0.45)", marginBottom: 28 }}>
              {fmtDate(selectedDate)}{selectedSlot ? ` · ${selectedSlot.start}–${selectedSlot.end}` : ""}
            </div>
            <button onClick={onClose} style={{
              background: TEAL, color: "#fff", border: "none",
              borderRadius: 14, padding: "12px 32px",
              fontSize: 15, fontWeight: 700, cursor: "pointer", touchAction: "manipulation",
            }}>
              Schließen
            </button>
          </div>
        )}

        {step === "payment" && clientSecret && stripePromise && (
          <Elements
            stripe={stripePromise}
            options={{ clientSecret, appearance: { theme: "stripe" } }}
          >
            <div style={{ padding: "0 0 4px" }}>
              <div style={{ padding: "0 24px", marginBottom: 4 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: TEAL,
                  textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                  Zahlung
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#1A1A2E", marginBottom: 2 }}>
                  {talent.title}
                </div>
                <div style={{ fontSize: 13, color: "rgba(26,26,46,0.45)" }}>
                  {fmtDate(selectedDate)}{selectedSlot ? ` · ${selectedSlot.start}–${selectedSlot.end}` : ""}
                  {isGruppe && participants > 1 ? ` · ${participants} Teilnehmer` : ""}
                </div>
              </div>
              <StripePaymentStep
                total={amountEur}
                impact={0}
                clientSecret={clientSecret}
                publishableKey={publishableKey}
                orderId={bookingId}
                onSuccess={handleStripeSuccess}
                onError={handleStripeError}
                onBack={() => setStep("select")}
                hideHeader={true}
              />
            </div>
          </Elements>
        )}

        {step === "select" && (
          <>
            {/* ── Header ── */}
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

            {/* ── Preis ── */}
            {priceStr && (
              <div style={{
                background: "rgba(22,215,197,0.08)", border: "1px solid rgba(22,215,197,0.18)",
                borderRadius: 14, padding: "10px 16px", marginBottom: 18,
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <span style={{ fontSize: 13, color: "rgba(26,26,46,0.55)" }}>Preis</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: TEAL }}>{priceStr}</span>
              </div>
            )}

            {/* ── Termin (echte Kalenderansicht mit Live-Verfuegbarkeit) ── */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A2E", marginBottom: 8 }}>Termin</div>
              {hasDates ? (
                <div style={{
                  background: "#fff", border: "1.5px solid rgba(26,26,46,0.10)", borderRadius: 14,
                  padding: "14px 12px",
                }}>
                  <AvailabilityCalendar
                    mode="book"
                    availableDates={talent.available_dates}
                    selectedDate={selectedDate}
                    onSelectDate={(d) => { setSelectedDate(d); setSelectedSlot(null); }}
                    fullDates={fullDates}
                    onMonthChange={loadMonthAvailability}
                    minDate={minDate}
                    maxDate={maxDate}
                  />
                </div>
              ) : (
                <input
                  type="date"
                  value={selectedDate}
                  min={minDate}
                  max={maxDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: 12,
                    border: "1.5px solid rgba(26,26,46,0.12)", fontSize: 14,
                    color: "#1A1A2E", background: "#fff", outline: "none", boxSizing: "border-box",
                  }}
                />
              )}
            </div>

            {/* ── Zeitfenster (mit Live-Belegung pro Slot) ── */}
            {hasSlots && selectedDate && (
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A2E", marginBottom: 8 }}>Uhrzeit</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {talent.available_time_slots.map((s, i) => {
                    const active = selectedSlot && selectedSlot.start === s.start && selectedSlot.end === s.end;
                    const slotInfo = slotAvailability?.find(x => x.start === s.start && x.end === s.end);
                    const full = slotInfo?.is_full === true;
                    return (
                      <button key={i} type="button" onClick={() => !full && setSelectedSlot(s)} disabled={full} style={{
                        padding: "8px 14px", borderRadius: 10,
                        border: `1.5px solid ${full ? "rgba(232,58,58,0.2)" : active ? TEAL : "rgba(26,26,46,0.12)"}`,
                        background: full ? "rgba(232,58,58,0.05)" : active ? "rgba(22,215,197,0.1)" : "#fff",
                        color: full ? "rgba(232,58,58,0.55)" : active ? TEAL : "rgba(26,26,46,0.7)",
                        fontSize: 13, fontWeight: 600, cursor: full ? "default" : "pointer", touchAction: "manipulation",
                        textDecoration: full ? "line-through" : "none",
                      }}>
                        {s.start}–{s.end}{full ? " · belegt" : ""}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Teilnehmer (nur Gruppenangebote) ── */}
            {isGruppe && (
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A2E", marginBottom: 8 }}>
                  Teilnehmer
                </div>
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
              </div>
            )}

            {/* ── Nachricht ── */}
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nachricht an den Anbieter (optional)…"
              rows={2}
              style={{
                width: "100%", resize: "none",
                border: "1.5px solid rgba(26,26,46,0.12)", borderRadius: 14, padding: "12px 14px",
                fontSize: 14, color: "#1A1A2E", background: "#fff", outline: "none",
                marginBottom: 16, fontFamily: "inherit", lineHeight: 1.5, boxSizing: "border-box",
              }}
            />

            {/* ── Vorschau-Gesamtbetrag ── */}
            {previewAmount != null && (
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "12px 16px", borderRadius: 14, background: "rgba(255,138,107,0.08)",
                border: "1px solid rgba(255,138,107,0.18)", marginBottom: 16,
              }}>
                <span style={{ fontSize: 13, color: "rgba(26,26,46,0.55)" }}>Gesamt</span>
                <span style={{ fontSize: 20, fontWeight: 800, color: CORAL }}>{fmtEur(previewAmount)}</span>
              </div>
            )}

            {/* ── Fehler ── */}
            {errMsg && (
              <div style={{
                fontSize: 13, color: "#E83A3A", marginBottom: 14,
                padding: "10px 12px", borderRadius: 10, background: "rgba(232,58,58,0.07)",
              }}>
                {errMsg}
              </div>
            )}

            {/* ── Buttons ── */}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={onClose} style={{
                flex: 1, background: "transparent", border: "1.5px solid rgba(26,26,46,0.15)",
                borderRadius: 14, padding: "12px 0", fontSize: 14, fontWeight: 600,
                color: "rgba(26,26,46,0.55)", cursor: "pointer", touchAction: "manipulation",
              }}>
                Abbrechen
              </button>
              <button
                onClick={handleBuchen}
                disabled={submitting || !canSubmit}
                style={{
                  flex: 2,
                  background: (submitting || !canSubmit) ? "rgba(22,215,197,0.4)" : `linear-gradient(135deg,${TEAL},#0AB8B2)`,
                  color: "#fff", border: "none", borderRadius: 14, padding: "12px 0",
                  fontSize: 15, fontWeight: 700,
                  cursor: (submitting || !canSubmit) ? "not-allowed" : "pointer",
                  touchAction: "manipulation",
                }}
              >
                {submitting ? "Wird vorbereitet…" : (isFull ? "Ausgebucht" : "Weiter zur Zahlung")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
