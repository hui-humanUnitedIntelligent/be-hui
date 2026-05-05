import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { MapPin, Check, ArrowLeft, Calendar, Clock, Tag } from "lucide-react";

const CORAL = "#FF6B5B";
const TEAL = "#2ABFAC";

const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const WEEKDAY_FULL = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];
const MONTHS = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];

const GOLD = "#F5A623";
const PURPLE = "#A78BFA";

function BookingFlow({ wirker, onClose, onSuccess, returnStep6 }) {
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [confirming, setConfirming] = useState(false);
  const [confetti, setConfetti] = useState([]);
  const [locationType, setLocationType] = useState(null); // "kunde" | "talent" | "andere"
  const [locationAddress, setLocationAddress] = useState("");
  const [zahlart, setZahlart] = React.useState("karte");


  // Nach Stripe-Rückkehr: direkt Step 6 zeigen (via returnStep6 prop)
  React.useEffect(() => {
    if (returnStep6) {
      // Buchungsdaten aus localStorage wiederherstellen
      try {
        const lastBooking = JSON.parse(localStorage.getItem("hui_last_booking") || "null");
        if (lastBooking?.selectedDate) setSelectedDate(lastBooking.selectedDate);
        if (lastBooking?.selectedTime) setSelectedTime(lastBooking.selectedTime);
      } catch(e) {}
      setStep(6);
    }
  }, [returnStep6]);
  const availability = defaultAvailability[wirker.name] || {};
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstWeekday = getFirstWeekday(viewYear, viewMonth);

  const availableDays = new Set();
  for (let d = 1; d <= daysInMonth; d++) {
    const jsDay = new Date(viewYear, viewMonth, d).getDay();
    const wdIdx = (jsDay + 6) % 7;
    const wd = WEEKDAYS[wdIdx];
    if (availability[wd]?.length > 0) availableDays.add(d);
  }

  const isPast = (d) => new Date(viewYear, viewMonth, d) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const goTo = (nextStep) => { setStep(nextStep); };

  const handleDayClick = (d) => {
    if (!availableDays.has(d) || isPast(d)) return;
    const jsDay = new Date(viewYear, viewMonth, d).getDay();
    const wdIdx = (jsDay + 6) % 7;
    setSelectedDate({ year: viewYear, month: viewMonth, day: d, weekday: WEEKDAYS[wdIdx] });
    setSelectedTime(null);
    setTimeout(() => goTo(2), 120);
  };

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      const amountCents = Math.round(total * 100);
      const res = await fetch('https://michi-6f9abd25.base44.app/functions/createCheckout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemName: `${wirker.talent} – 1 Stunde mit ${wirker.fullName}`,
          amountCents,
          itemType: 'buchung',
          wirkerName: wirker.fullName || wirker.name,
          imageUrl: wirker.img,
          successUrl: 'https://be-hui.vercel.app?payment=success',
          cancelUrl: 'https://be-hui.vercel.app',
        }),
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        // Booking in Supabase speichern
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            await supabase.from('bookings').insert({
              user_id: session.user.id,
              wirker_name: wirker.name || wirker.fullName,
              service: `${wirker.talent} – 1 Stunde`,
              date: selectedDate ? `${selectedDate.day}.${selectedDate.month+1}.${selectedDate.year}` : null,
              time: selectedTime || null,
              location: locationType === "talent" ? wirker.location : (locationAddress || null),
              price_eur: total,
              status: 'pending',
            });
          }
        } catch(e) {}
        try {
          localStorage.setItem("hui_last_booking", JSON.stringify({
            wirkerName: wirker.name,
            wirkerFullName: wirker.fullName || wirker.name,
            wirkerImg: wirker.img,
            itemName: `${wirker.talent} – 1 Stunde mit ${wirker.fullName || wirker.name}`,
            totalEur: data.totalEur,
            impactEur: data.impactEur,
            selectedDate,
            selectedTime,
          }));
        } catch(e) {}
        window.location.href = data.checkoutUrl;
      } else {
        alert('Fehler beim Erstellen der Zahlung: ' + (data.error || 'Unbekannt'));
        setConfirming(false);
      }
    } catch (err) {
      alert('Verbindungsfehler: ' + err.message);
      setConfirming(false);
    }
  };

  const availableSlots = selectedDate ? (availability[selectedDate.weekday] || []) : [];
  const pricePerHour = wirker.pricePerHour || 60;
  const provision = Math.round(pricePerHour * 0.15 * 100) / 100;
  const impact = Math.round(provision * 0.15 * 100) / 100;
  const talentEarns = Math.round((pricePerHour - provision) * 100) / 100;
  const total = pricePerHour;
  const formatDate = (d) => d ? `${WEEKDAY_FULL[WEEKDAYS.indexOf(d.weekday)]}, ${d.day}. ${MONTHS[d.month]} ${d.year}` : "";
  const stepLabels = ["Datum", "Uhrzeit", "Ort", "Zahlung"];
  const stepIcons = ["\u{1F4C5}", "\u{1F550}", "\u{1F4CD}", "\u{1F4B3}"];

  if (step === 6) return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "white", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", maxWidth: 430, margin: "0 auto", overflow: "hidden" }}>
      <style>{`
        @keyframes confettiFall { 0% { transform: translateY(0) rotate(0deg); opacity: 1; } 100% { transform: translateY(110vh) rotate(720deg); opacity: 0.2; } }
        @keyframes successPop { 0% { transform: scale(0); opacity: 0; } 60% { transform: scale(1.15); } 100% { transform: scale(1); opacity: 1; } }
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      {confetti.map(p => (
        <div key={p.id} style={{ position: "absolute", left: `${p.x}%`, top: -20, width: p.size, height: p.size, background: p.color, borderRadius: 2, transform: `rotate(${p.rotation}deg)`, animation: `confettiFall 1.8s ${p.delay}s ease-in forwards`, opacity: 0 }} />
      ))}
      <div style={{ width: 100, height: 100, borderRadius: "50%", background: `linear-gradient(135deg, ${TEAL}, ${TEAL}88)`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24, boxShadow: `0 8px 32px ${TEAL}44`, animation: "successPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards" }}>
        <span style={{ fontSize: 48 }}>✓</span>
      </div>
      <div style={{ fontWeight: 900, fontSize: 26, color: "#1a1a1a", textAlign: "center", marginBottom: 8, animation: "fadeSlideUp 0.4s 0.3s both" }}>Buchung gesichert! 🎉</div>
      <div style={{ fontSize: 15, color: "#888", textAlign: "center", lineHeight: 1.6, marginBottom: 28, animation: "fadeSlideUp 0.4s 0.4s both" }}>Dein Geld liegt sicher im Treuhand-Konto und wird erst freigegeben, wenn du zufrieden bist.</div>
      <div style={{ width: "100%", background: "#fafaf8", borderRadius: 20, overflow: "hidden", border: "1px solid #f0f0ee", marginBottom: 20, animation: "fadeSlideUp 0.4s 0.5s both" }}>
        <div style={{ padding: "16px 18px", display: "flex", gap: 12, alignItems: "center", borderBottom: "1px solid #f0f0ee" }}>
          <img src={wirker.img} style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", border: "2px solid white", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }} alt={wirker.name} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: "#1a1a1a" }}>{wirker.fullName}</div>
            <div style={{ fontSize: 12, color: TEAL, fontWeight: 600 }}>{wirker.talent}</div>
          </div>
          <div style={{ background: `${TEAL}15`, borderRadius: 10, padding: "4px 10px", fontSize: 11, color: TEAL, fontWeight: 700 }}>Bestätigt</div>
        </div>
        <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}><span style={{ fontSize: 18 }}>📅</span><div><div style={{ fontSize: 13, fontWeight: 700, color: "#222" }}>{formatDate(selectedDate)}</div><div style={{ fontSize: 12, color: "#aaa" }}>Datum</div></div></div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}><span style={{ fontSize: 18 }}>🕐</span><div><div style={{ fontSize: 13, fontWeight: 700, color: "#222" }}>{selectedTime} Uhr</div><div style={{ fontSize: 12, color: "#aaa" }}>Uhrzeit</div></div></div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}><span style={{ fontSize: 18 }}>💶</span><div><div style={{ fontSize: 13, fontWeight: 700, color: "#222" }}>{total.toFixed(2)} €</div><div style={{ fontSize: 12, color: "#aaa" }}>Im Treuhand</div></div></div>
          <div style={{ background: `linear-gradient(90deg, ${TEAL}12, ${TEAL}05)`, borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
            <span style={{ fontSize: 16 }}>🌱</span>
            <div style={{ fontSize: 12, color: TEAL, fontWeight: 600 }}>{impact.toFixed(2)} € fließen in den Impact Pool — du machst einen Unterschied!</div>
          </div>
        </div>
      </div>
      <div style={{ width: "100%", background: `${CORAL}10`, borderRadius: 14, padding: "12px 16px", fontSize: 13, color: "#666", lineHeight: 1.6, marginBottom: 24, display: "flex", gap: 10, alignItems: "center", animation: "fadeSlideUp 0.4s 0.6s both" }}>
        <span style={{ fontSize: 20 }}>💬</span>
        <span>Der Chat mit <strong>{wirker.name}</strong> ist jetzt freigeschaltet. Eine erste Nachricht wurde bereits gesendet.</span>
      </div>
      <button onClick={onSuccess} style={{ width: "100%", background: `linear-gradient(135deg, ${CORAL}, ${GOLD})`, color: "white", border: "none", borderRadius: 16, padding: "16px", fontWeight: 800, fontSize: 16, cursor: "pointer", boxShadow: `0 4px 16px ${CORAL}44`, animation: "fadeSlideUp 0.4s 0.7s both" }}>Zum Chat mit {wirker.name} →</button>
      <button onClick={onClose} style={{ background: "none", border: "none", color: "#bbb", fontSize: 13, cursor: "pointer", marginTop: 14 }}>Zurück zur Übersicht</button>
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "white", display: "flex", flexDirection: "column", maxWidth: 430, margin: "0 auto" }}>
      <div style={{ padding: "14px 18px 0", borderBottom: "1px solid #f5f5f3" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <button onClick={step > 1 ? () => goTo(step - 1) : onClose} style={{ background: "#f5f5f3", border: "none", borderRadius: "50%", width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <ArrowLeft size={18} color="#444" />
          </button>
          <img src={wirker.img} style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", border: `2px solid ${TEAL}33` }} alt={wirker.name} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: "#1a1a1a", lineHeight: 1.2 }}>{wirker.fullName}</div>
            <div style={{ fontSize: 11, color: TEAL, fontWeight: 600 }}>{wirker.talent}</div>
          </div>
          <div style={{ fontSize: 13, color: "#aaa", fontWeight: 600 }}>{Math.min(step,4)}/4</div>
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          {stepLabels.map((label, i) => {
            const s = i + 1;
            const isActive = step === s;
            const isDone = step > s;
            return (
              <div key={s} style={{ flex: isActive ? 2 : 1, display: "flex", alignItems: "center", gap: 5, background: isDone ? `${TEAL}22` : isActive ? `${CORAL}12` : "#f5f5f3", borderRadius: 30, padding: "7px 12px", transition: "all 0.35s cubic-bezier(0.4,0,0.2,1)" }}>
                <span style={{ fontSize: 13 }}>{isDone ? "✓" : stepIcons[i]}</span>
                {isActive && <span style={{ fontSize: 12, fontWeight: 700, color: CORAL, whiteSpace: "nowrap" }}>{label}</span>}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 18px" }}>
        {step === 1 && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <button onClick={() => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y-1); } else setViewMonth(m => m-1); }} style={{ background: "#f5f5f3", border: "none", borderRadius: "50%", width: 40, height: 40, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
              <span style={{ fontWeight: 800, fontSize: 18, color: "#1a1a1a" }}>{MONTHS[viewMonth]} {viewYear}</span>
              <button onClick={() => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y+1); } else setViewMonth(m => m+1); }} style={{ background: "#f5f5f3", border: "none", borderRadius: "50%", width: 40, height: 40, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 6 }}>
              {WEEKDAYS.map(d => <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "#ccc", paddingBottom: 6 }}>{d}</div>)}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3 }}>
              {Array(firstWeekday).fill(null).map((_, i) => <div key={"e"+i} />)}
              {Array(daysInMonth).fill(null).map((_, i) => {
                const d = i + 1;
                const past = isPast(d);
                const avail = availableDays.has(d);
                const isSelected = selectedDate?.day === d && selectedDate?.month === viewMonth && selectedDate?.year === viewYear;
                const isToday = d === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
                return (
                  <button key={d} onClick={() => handleDayClick(d)} style={{ aspectRatio: "1", borderRadius: "50%", border: isToday && !isSelected ? `2px solid ${CORAL}55` : "2px solid transparent", cursor: avail && !past ? "pointer" : "default", background: isSelected ? `linear-gradient(135deg, ${CORAL}, ${GOLD})` : avail && !past ? `${TEAL}15` : "transparent", color: isSelected ? "white" : past ? "#ddd" : avail ? TEAL : "#ccc", fontWeight: avail && !past ? 800 : 400, fontSize: 14, position: "relative", transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)", boxShadow: isSelected ? `0 4px 16px ${CORAL}55` : "none", transform: isSelected ? "scale(1.15)" : "scale(1)" }}>
                    {d}
                    {avail && !past && !isSelected && <div style={{ position: "absolute", bottom: 3, left: "50%", transform: "translateX(-50%)", width: 4, height: 4, borderRadius: "50%", background: TEAL }} />}
                  </button>
                );
              })}
            </div>
            <div style={{ marginTop: 22, display: "flex", gap: 16, fontSize: 12, color: "#aaa" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: "50%", background: `${TEAL}33` }} />Verfügbar</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: "50%", background: "#e0e0e0" }} />Nicht verfügbar</div>
            </div>
            <div style={{ background: `linear-gradient(135deg, ${GOLD}12, ${GOLD}06)`, borderRadius: 14, padding: "14px 16px", marginTop: 20, display: "flex", alignItems: "center", gap: 12, border: `1px solid ${GOLD}25` }}>
              <span style={{ fontSize: 24 }}>💶</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#333" }}>{wirker.hourlyRate}</div>
                <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>inkl. HUI-Provision · davon 15% fließen in Impact-Projekte</div>
              </div>
            </div>
          </>
        )}

        {step === 2 && selectedDate && (
          <>
            <div style={{ background: `linear-gradient(135deg, ${TEAL}12, ${TEAL}06)`, borderRadius: 16, padding: "14px 18px", marginBottom: 24, display: "flex", alignItems: "center", gap: 12, border: `1px solid ${TEAL}20` }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg, ${CORAL}, ${GOLD})`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 900, lineHeight: 1 }}>{selectedDate.day}</div>
                <div style={{ fontSize: 9, fontWeight: 600, opacity: 0.85 }}>{MONTHS[selectedDate.month].slice(0,3).toUpperCase()}</div>
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: "#1a1a1a" }}>{formatDate(selectedDate)}</div>
                <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>{availableSlots.length} freie Slots verfügbar</div>
              </div>
            </div>
            <div style={{ fontWeight: 800, fontSize: 15, color: "#1a1a1a", marginBottom: 14 }}>Wähle deine Uhrzeit:</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {availableSlots.map(slot => {
                const isSel = selectedTime === slot;
                return (
                  <button key={slot} onClick={() => setSelectedTime(slot)} style={{ padding: "14px 8px", borderRadius: 16, border: `2px solid ${isSel ? CORAL : "#eee"}`, background: isSel ? `linear-gradient(135deg, ${CORAL}, ${GOLD})` : "white", color: isSel ? "white" : "#333", fontWeight: 700, fontSize: 14, cursor: "pointer", transition: "all 0.2s", boxShadow: isSel ? `0 4px 14px ${CORAL}33` : "0 1px 4px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 18 }}>🕐</span>
                    <span>{slot}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div style={{ fontWeight: 800, fontSize: 18, color: "#1a1a1a", marginBottom: 6 }}>Wo findet es statt?</div>
            <div style={{ fontSize: 13, color: "#aaa", marginBottom: 20 }}>Wähle den Treffpunkt für die Buchung.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { key: "talent", emoji: "🏠", label: "Beim Talent", desc: `Bei ${wirker.fullName} (${wirker.location})` },
                { key: "kunde", emoji: "📍", label: "Bei mir zu Hause", desc: "Adresse eingeben" },
                { key: "andere", emoji: "📌", label: "Anderer Ort", desc: "Eigene Adresse angeben" },
              ].map(opt => (
                <div key={opt.key} onClick={() => setLocationType(opt.key)}
                  style={{ borderRadius: 16, border: `2px solid ${locationType === opt.key ? TEAL : "#f0f0ee"}`, background: locationType === opt.key ? `${TEAL}08` : "white", padding: "14px 16px", cursor: "pointer", display: "flex", gap: 14, alignItems: "flex-start", transition: "all 0.15s" }}>
                  <span style={{ fontSize: 24 }}>{opt.emoji}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a1a" }}>{opt.label}</div>
                    <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>{opt.desc}</div>
                  </div>
                  {locationType === opt.key && <span style={{ marginLeft: "auto", color: TEAL, fontSize: 18 }}>✓</span>}
                </div>
              ))}
            </div>
            {(locationType === "kunde" || locationType === "andere") && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#444", marginBottom: 8 }}>
                  {locationType === "kunde" ? "Deine Adresse" : "Adresse des Treffpunkts"}
                </div>
                <textarea
                  value={locationAddress}
                  onChange={e => setLocationAddress(e.target.value)}
                  placeholder="Straße, Hausnummer, PLZ, Ort"
                  rows={3}
                  style={{ width: "100%", borderRadius: 12, border: "1.5px solid #e0e0de", padding: "12px 14px", fontSize: 14, fontFamily: "inherit", resize: "none", outline: "none", boxSizing: "border-box", color: "#1a1a1a" }}
                />
              </div>
            )}
          </>
        )}

        {step === 4 && (
          <>
            <div style={{ fontWeight: 800, fontSize: 18, color: "#1a1a1a", marginBottom: 6 }}>Wie möchtest du zahlen?</div>
            <div style={{ fontSize: 13, color: "#aaa", marginBottom: 20 }}>Dein Geld liegt sicher im HUI-Treuhand bis du die Leistung bestätigst.</div>

            {/* Zahlungsoptionen */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
              {[
                { key: "karte", emoji: "💳", label: "Kredit- oder Debitkarte", desc: "Visa, Mastercard, Amex" },
                { key: "paypal", emoji: "🅿️", label: "PayPal", desc: "Schnell & bekannt" },
                { key: "sepa", emoji: "🏦", label: "SEPA-Lastschrift", desc: "Direkt vom Bankkonto" },
              ].map(opt => (
                <div key={opt.key} onClick={() => setZahlart(opt.key)}
                  style={{ borderRadius: 16, border: `2px solid ${zahlart === opt.key ? TEAL : "#f0f0ee"}`, background: zahlart === opt.key ? `${TEAL}08` : "white", padding: "14px 16px", cursor: "pointer", display: "flex", gap: 14, alignItems: "center", transition: "all 0.15s" }}>
                  <span style={{ fontSize: 26 }}>{opt.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a1a" }}>{opt.label}</div>
                    <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>{opt.desc}</div>
                  </div>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${zahlart === opt.key ? TEAL : "#ddd"}`, background: zahlart === opt.key ? TEAL : "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {zahlart === opt.key && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "white" }} />}
                  </div>
                </div>
              ))}
            </div>

            {/* Betrag Übersicht */}
            <div style={{ background: "#fafaf8", borderRadius: 16, padding: "14px 18px", border: "1px solid #f0f0ee" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: "#888" }}>1 Std. mit {wirker.fullName || wirker.name}</span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{total.toFixed(2)} €</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: TEAL }}>🌱 davon Impact</span>
                <span style={{ fontSize: 12, color: TEAL, fontWeight: 600 }}>{impact.toFixed(2)} €</span>
              </div>
              <div style={{ height: 1, background: "#f0f0ee", marginBottom: 8 }} />
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 15, fontWeight: 800 }}>Gesamt</span>
                <span style={{ fontSize: 16, fontWeight: 900, color: CORAL }}>{total.toFixed(2)} €</span>
              </div>
            </div>

            <div style={{ background: `${TEAL}08`, borderRadius: 14, padding: "12px 16px", marginTop: 16, display: "flex", gap: 10, alignItems: "center", border: `1px solid ${TEAL}15` }}>
              <span style={{ fontSize: 18 }}>🔒</span>
              <div style={{ fontSize: 12, color: "#555", lineHeight: 1.6 }}>Zahlung über <strong>Stripe</strong> gesichert. Du wirst weitergeleitet.</div>
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <div style={{ fontWeight: 800, fontSize: 18, color: "#1a1a1a", marginBottom: 6 }}>Deine Buchung</div>
            <div style={{ fontSize: 13, color: "#aaa", marginBottom: 20 }}>Bitte überprüfe alles und bestätige.</div>
            <div style={{ background: "#fafaf8", borderRadius: 18, overflow: "hidden", border: "1px solid #f0f0ee", marginBottom: 16 }}>
              <div style={{ padding: "16px 18px", display: "flex", gap: 12, alignItems: "center", background: `linear-gradient(135deg, ${TEAL}08, white)` }}>
                <img src={wirker.img} style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", border: `2px solid ${TEAL}33` }} alt={wirker.name} />
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: "#1a1a1a" }}>{wirker.fullName}</div>
                  <div style={{ fontSize: 12, color: TEAL, fontWeight: 600 }}>{wirker.talent}</div>
                  <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>📍 {wirker.location}</div>
                </div>
              </div>
              <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 12, borderTop: "1px solid #f5f5f3" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "#888" }}>📅 Datum</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#222" }}>{formatDate(selectedDate)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "#888" }}>🕐 Uhrzeit</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#222" }}>{selectedTime} Uhr</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "#888" }}>📍 Treffpunkt</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#222", textAlign: "right", maxWidth: "60%" }}>
                    {locationType === "talent" ? wirker.location : locationAddress}
                  </span>
                </div>
                <div style={{ height: 1, background: "#f0f0ee" }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: "#1a1a1a" }}>Du zahlst</span>
                  <span style={{ fontSize: 18, fontWeight: 900, color: CORAL }}>{total.toFixed(2)} €</span>
                </div>

              </div>
            </div>
            <div style={{ background: `linear-gradient(135deg, ${TEAL}10, ${TEAL}04)`, borderRadius: 14, padding: "14px 16px", marginBottom: 12, display: "flex", gap: 12, alignItems: "flex-start", border: `1px solid ${TEAL}20` }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>🔒</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#333", marginBottom: 3 }}>Treuhand-Schutz</div>
                <div style={{ fontSize: 12, color: "#777", lineHeight: 1.6 }}>Dein Geld wird erst freigegeben, wenn du die Leistung bestätigt hast. Du bist immer abgesichert.</div>
              </div>
            </div>
            <div style={{ background: `${TEAL}08`, borderRadius: 14, padding: "12px 16px", marginBottom: 24, display: "flex", gap: 10, alignItems: "center", border: `1px solid ${TEAL}15` }}>
              <span style={{ fontSize: 20 }}>🌱</span>
              <div style={{ fontSize: 12, color: TEAL, fontWeight: 600 }}>{impact.toFixed(2)} € deiner Buchung fließen in echte Impact-Projekte.</div>
            </div>
          </>
        )}
      </div>

      <div style={{ padding: "14px 18px 28px", borderTop: "1px solid #f5f5f3", background: "white" }}>
        {step === 1 && <div style={{ textAlign: "center", color: "#bbb", fontSize: 13 }}>Wähle einen grün markierten Tag</div>}
        {step === 2 && (
          <button onClick={() => selectedTime && goTo(3)} disabled={!selectedTime} style={{ width: "100%", background: selectedTime ? `linear-gradient(135deg, ${CORAL}, ${GOLD})` : "#f0f0ee", color: selectedTime ? "white" : "#bbb", border: "none", borderRadius: 16, padding: "16px", fontWeight: 800, fontSize: 16, cursor: selectedTime ? "pointer" : "default", boxShadow: selectedTime ? `0 4px 16px ${CORAL}33` : "none", transition: "all 0.25s" }}>
            Weiter → Treffpunkt wählen
          </button>
        )}
        {step === 3 && (
          <button
            onClick={() => locationType && (locationType === "talent" || locationAddress.trim()) && goTo(4)}
            disabled={!locationType || ((locationType === "kunde" || locationType === "andere") && !locationAddress.trim())}
            style={{ width: "100%", background: (locationType && (locationType === "talent" || locationAddress.trim())) ? `linear-gradient(135deg, ${CORAL}, ${GOLD})` : "#f0f0ee", color: (locationType && (locationType === "talent" || locationAddress.trim())) ? "white" : "#bbb", border: "none", borderRadius: 16, padding: "16px", fontWeight: 800, fontSize: 16, cursor: "pointer", boxShadow: (locationType && (locationType === "talent" || locationAddress.trim())) ? `0 4px 16px ${CORAL}33` : "none", transition: "all 0.25s" }}>
            Weiter → Zahlung wählen
          </button>
        )}
        {step === 4 && (
          <button onClick={() => goTo(5)} style={{ width: "100%", background: `linear-gradient(135deg, ${CORAL}, ${GOLD})`, color: "white", border: "none", borderRadius: 16, padding: "16px", fontWeight: 800, fontSize: 16, cursor: "pointer", boxShadow: `0 4px 16px ${CORAL}33` }}>
            Weiter → Buchung prüfen
          </button>
        )}
        {step === 5 && (
          <div>
            <button onClick={handleConfirm} disabled={confirming} style={{ width: "100%", background: confirming ? "#f0f0ee" : `linear-gradient(135deg, ${CORAL}, ${GOLD})`, color: confirming ? "#bbb" : "white", border: "none", borderRadius: 16, padding: "16px", fontWeight: 800, fontSize: 16, cursor: confirming ? "default" : "pointer", boxShadow: confirming ? "none" : `0 4px 16px ${CORAL}33`, transition: "all 0.25s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {confirming ? (<><div style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid #ddd", borderTopColor: CORAL, animation: "spin 0.7s linear infinite" }} />Wird gebucht…</>) : (<>💳 Jetzt verbindlich buchen · {total.toFixed(2)} €</>)}
            </button>
            <style>{"@keyframes heartPop {\n  0%   { transform: scale(1); }\n  40%  { transform: scale(1.45); }\n  70%  { transform: scale(0.9); }\n  100% { transform: scale(1); }\n}\n@keyframes toastIn {\n  from { opacity: 0; transform: translateX(-50%) translateY(20px); }\n  to   { opacity: 1; transform: translateX(-50%) translateY(0); }\n}\n@keyframes spin { to { transform: rotate(360deg); } }"}</style>
            <div style={{ fontSize: 11, color: "#bbb", textAlign: "center", marginTop: 10 }}>🔒 Verschlüsselt · Treuhand-gesichert · Jederzeit stornierbar</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// WIRKER PROFIL PAGE
// ══════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════
// WERK EDITOR (Versandkosten & Details vom Wirker bearbeitbar)
// ══════════════════════════════════════════════════════════════════

export default BookingFlow;
