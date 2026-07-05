// src/components/talents/TalentAngebotWizard.jsx
// ══════════════════════════════════════════════════════════════════════
// TALENT-ANGEBOT WIZARD — Erstellen/Bearbeiten eines Talent-/Dienstleistungs-
// Angebots. Analog zu WerkWizard.jsx/ExperienceWizard.jsx: Mehrstufiger
// Vollbild-Wizard mit Fortschrittsanzeige, gleiche Bausteine/Optik/Muster.
//
// ERWEITERUNG 2026-07-05 (MASTER-PROMPT "Talente mit Dienstleistungen"):
// Vorher ein einzelnes Screen-Formular (Titel/Kategorie/Beschreibung/Bilder).
// Jetzt 6 Schritte, logisch gruppiert wie gefordert:
//   1) Basisdaten  2) Preis  3) Ort  4) Datum & Zeiten  5) Kapazität  6) Bilder
// Bestehende Freigabe-Logik (isApproved sperrt Felder, wasRejected zeigt
// Ablehnungsgrund + Resubmission-Reset) bleibt vollständig erhalten.
// ══════════════════════════════════════════════════════════════════════
import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useWizardBodyLock } from "../../lib/wizardBodyLock.js";
import {
  createTalent, updateTalent, uploadTalentImage, TALENT_KATEGORIEN,
  TALENT_LOCATION_TYPES, TALENT_RECURRING_OPTIONS, TALENT_BOOKING_TYPES,
} from "../../hooks/useTalents.js";

const C = {
  teal: "#0EC4B8", tealD: "#0DBBAF", ink: "#1A1A18", inkMid: "rgba(26,26,24,0.55)",
  inkFade: "rgba(26,26,24,0.35)", border: "rgba(26,26,24,0.10)", cream: "#F8F7F4",
};

const TOTAL = 6;
const STEP_TITLES = ["Basisdaten", "Preis", "Ort", "Datum & Zeiten", "Kapazität", "Bilder"];

const INP = {
  width: "100%", boxSizing: "border-box", padding: "13px 15px", borderRadius: 12,
  border: `1.5px solid ${C.border}`, fontSize: 14, fontFamily: "inherit", background: "#fff",
};

function Lbl({ text, req, hint }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: C.inkMid }}>
        {text}{req && <span style={{ color: C.teal, marginLeft: 2 }}>*</span>}
      </span>
      {hint && <div style={{ fontSize: 11, color: C.inkFade, marginTop: 2 }}>{hint}</div>}
    </div>
  );
}

function ProgressBar({ step, total }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0 }}>
      {Array.from({ length: total }, (_, i) => {
        const n = i + 1; const done = n < step; const cur = n === step;
        return (
          <React.Fragment key={n}>
            <div style={{
              width: cur ? 26 : 20, height: cur ? 26 : 20, borderRadius: "50%",
              background: (done || cur) ? C.teal : "rgba(26,26,24,0.09)",
              border: cur ? `2.5px solid ${C.teal}` : "none",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: cur ? 11 : 9, fontWeight: 700,
              color: (done || cur) ? "#fff" : C.inkFade, flexShrink: 0, transition: "all .22s",
              boxShadow: cur ? "0 0 0 4px rgba(14,196,184,0.18)" : "none",
            }}>{done ? "✓" : n}</div>
            {i < total - 1 && <div style={{ flex: 1, height: 2, minWidth: 6, background: done ? C.teal : "rgba(26,26,24,0.09)" }}/>}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function TopBar({ onClose, step, total, isEdit }) {
  return (
    <div style={{ padding: "14px 20px 12px", background: "#fff", borderBottom: `1px solid ${C.border}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <button onClick={onClose} style={{ background: "none", border: "none", padding: 0, fontSize: 13, fontWeight: 600, color: C.inkMid, cursor: "pointer", touchAction: "manipulation" }}>Abbrechen</button>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{isEdit ? "Angebot bearbeiten" : "Neues Talent-Angebot"} · {STEP_TITLES[step - 1]}</div>
        <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(26,26,24,0.07)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", touchAction: "manipulation" }}>
          <span style={{ fontSize: 14, color: C.ink }}>×</span>
        </button>
      </div>
      <ProgressBar step={step} total={total}/>
    </div>
  );
}

function PBtn({ label, onClick, disabled, loading }) {
  return (
    <button onClick={onClick} disabled={disabled || loading} style={{
      width: "100%", padding: "15px", background: (disabled || loading) ? "rgba(14,196,184,0.32)" : `linear-gradient(135deg,${C.teal},${C.tealD})`,
      border: "none", borderRadius: 14, color: "#fff", fontSize: 15, fontWeight: 700,
      cursor: (disabled || loading) ? "not-allowed" : "pointer", fontFamily: "inherit", touchAction: "manipulation",
    }}>{loading ? "Wird gespeichert…" : label}</button>
  );
}

function SBtn({ label, onClick }) {
  return (
    <button onClick={onClick} style={{ width: "100%", padding: "13px", background: "none", border: "none", color: C.teal, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", touchAction: "manipulation" }}>{label}</button>
  );
}

function Chip({ active, children, onClick, disabled }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} style={{
      padding: "6px 12px", borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: disabled ? "default" : "pointer",
      fontFamily: "inherit", border: active ? `1.5px solid ${C.teal}` : `1.5px solid ${C.border}`,
      background: active ? "rgba(14,196,184,0.12)" : "#fff", color: active ? C.teal : C.inkMid,
    }}>{children}</button>
  );
}

export default function TalentAngebotWizard({ userId, existingTalent = null, onClose, onSaved }) {
  const isEdit = !!existingTalent?.id;
  const wasRejected = existingTalent?.status === "rejected";
  const isApproved = existingTalent?.status === "approved";
  const locked = isApproved;

  const [step, setStep] = useState(1);

  // 1) Basisdaten
  const [title, setTitle] = useState(existingTalent?.title || "");
  const [category, setCategory] = useState(existingTalent?.category || "");
  const [description, setDescription] = useState(existingTalent?.description || "");

  // 2) Preis
  const [pricePerHour, setPricePerHour] = useState(existingTalent?.price_per_hour ?? "");
  const [pricePerSession, setPricePerSession] = useState(existingTalent?.price_per_session ?? "");

  // 3) Ort
  const [locationType, setLocationType] = useState(existingTalent?.location_type || "");
  const [locationAddress, setLocationAddress] = useState(existingTalent?.location_address || "");
  const [locationNotes, setLocationNotes] = useState(existingTalent?.location_notes || "");
  const [mapLink, setMapLink] = useState(existingTalent?.map_link || "");

  // 4) Datum & Zeiten
  const [availableDates, setAvailableDates] = useState(existingTalent?.available_dates || []);
  const [dateDraft, setDateDraft] = useState("");
  const [timeSlots, setTimeSlots] = useState(existingTalent?.available_time_slots || []);
  const [slotStart, setSlotStart] = useState("");
  const [slotEnd, setSlotEnd] = useState("");
  const [recurring, setRecurring] = useState(existingTalent?.recurring || "");
  const [durationMinutes, setDurationMinutes] = useState(existingTalent?.duration_minutes ?? "");

  // 5) Kapazität & Buchbarkeit
  const [bookingType, setBookingType] = useState(existingTalent?.booking_type || "einzel");
  const [maxParticipants, setMaxParticipants] = useState(existingTalent?.max_participants ?? "");
  const [minParticipants, setMinParticipants] = useState(existingTalent?.min_participants ?? "");
  const [windowStart, setWindowStart] = useState(existingTalent?.booking_window_start || "");
  const [windowEnd, setWindowEnd] = useState(existingTalent?.booking_window_end || "");

  // 6) Bilder
  const [images, setImages] = useState(existingTalent?.images || []);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Referenzgezählter Body-Lock (Memory #531: verhindert Race Condition bei
  // ueberlappend offenen Wizards) statt eigener document.body.classList-Logik.
  useWizardBodyLock();

  async function handleUpload(e) {
    const files = Array.from(e.target.files || []);
    if (!userId || !files.length) return;
    setUploading(true);
    const next = [...images];
    for (const file of files.slice(0, 5 - next.length)) {
      const { url, path, error: upErr } = await uploadTalentImage(userId, file);
      if (!upErr && url) next.push({ url, path });
    }
    setImages(next);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }
  function removeImage(idx) { setImages(images.filter((_, i) => i !== idx)); }

  function addDate() {
    if (!dateDraft || availableDates.includes(dateDraft)) return;
    setAvailableDates([...availableDates, dateDraft].sort());
    setDateDraft("");
  }
  function removeDate(d) { setAvailableDates(availableDates.filter(x => x !== d)); }

  function addSlot() {
    if (!slotStart || !slotEnd) return;
    setTimeSlots([...timeSlots, { start: slotStart, end: slotEnd }]);
    setSlotStart(""); setSlotEnd("");
  }
  function removeSlot(idx) { setTimeSlots(timeSlots.filter((_, i) => i !== idx)); }

  function canNext() {
    if (step === 1) return !!(title.trim() && category);
    return true;
  }

  function num(v) { return v === "" || v === null || v === undefined ? null : Number(v); }

  async function handleSave() {
    if (!title.trim() || !category) {
      setError("Titel und Kategorie sind erforderlich."); setStep(1); return;
    }
    setSaving(true); setError(null);

    const servicePayload = {
      price_per_hour: num(pricePerHour),
      price_per_session: num(pricePerSession),
      location_type: locationType || null,
      location_address: locationAddress.trim() || null,
      location_notes: locationNotes.trim() || null,
      map_link: mapLink.trim() || null,
      available_dates: availableDates,
      available_time_slots: timeSlots,
      recurring: recurring || null,
      duration_minutes: num(durationMinutes),
      booking_type: bookingType,
      max_participants: num(maxParticipants),
      min_participants: num(minParticipants),
      booking_window_start: windowStart || null,
      booking_window_end: windowEnd || null,
    };

    const { error: saveErr } = isEdit
      ? await updateTalent(existingTalent.id, {
          title: title.trim(), description: description.trim() || null, category, images,
          previousStatus: existingTalent.status, ...servicePayload,
        })
      : await createTalent({
          userId, title: title.trim(), description: description.trim(), category, images, ...servicePayload,
        });
    setSaving(false);
    if (saveErr) { setError(saveErr.message || "Speichern fehlgeschlagen."); return; }
    onSaved?.();
    onClose?.();
  }

  const isLast = step === TOTAL;

  return createPortal(
    <div style={{
      // zIndex 10500 wie WerkWizard/ExperienceWizard — ueberschreibt BottomNav(10000) + ProfileLauncher(9500).
      position: "fixed", inset: 0, zIndex: 10500, background: C.cream,
      display: "flex", flexDirection: "column",
    }}>
      <TopBar onClose={onClose} step={step} total={TOTAL} isEdit={isEdit}/>

      <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", padding: "18px 20px" }}>
        {isApproved && (
          <div style={{ background: "rgba(14,196,184,0.10)", borderRadius: 10, padding: "10px 12px", fontSize: 12, color: C.teal, fontWeight: 600, marginBottom: 14 }}>
            ✅ Dieses Angebot ist bereits freigegeben und live. Änderungen sind erst nach Rückzug/Ablehnung wieder möglich.
          </div>
        )}
        {wasRejected && existingTalent?.rejection_reason && (
          <div style={{ background: "rgba(255,80,80,0.10)", borderRadius: 10, padding: "10px 12px", fontSize: 12, color: "#d13a3a", marginBottom: 14, lineHeight: 1.5 }}>
            ❌ Abgelehnt: {existingTalent.rejection_reason}<br/>
            <span style={{ fontWeight: 600 }}>Beim Speichern wird es erneut zur Prüfung eingereicht.</span>
          </div>
        )}

        {/* ── SCHRITT 1: Basisdaten ─────────────────────────────── */}
        {step === 1 && (
          <>
            <Lbl text="Titel" req/>
            <input value={title} onChange={e => setTitle(e.target.value)} disabled={locked}
              placeholder="z.B. Aquarell-Portraits nach Foto"
              style={{ ...INP, marginBottom: 14, background: locked ? "#f5f5f3" : "#fff" }}/>

            <Lbl text="Kategorie" req/>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
              {TALENT_KATEGORIEN.map(k => (
                <Chip key={k} active={category === k} disabled={locked} onClick={() => setCategory(k)}>{k}</Chip>
              ))}
            </div>

            <Lbl text="Beschreibung"/>
            <textarea value={description} onChange={e => setDescription(e.target.value)} disabled={locked}
              placeholder="Beschreibe dein Angebot..." rows={5}
              style={{ ...INP, marginBottom: 14, resize: "vertical", background: locked ? "#f5f5f3" : "#fff" }}/>
          </>
        )}

        {/* ── SCHRITT 2: Preis ──────────────────────────────────── */}
        {step === 2 && (
          <>
            <Lbl text="Preis pro Stunde (€)" hint="Wird erst nach Freigabe öffentlich sichtbar."/>
            <input type="number" min="0" step="0.5" value={pricePerHour} disabled={locked}
              onChange={e => setPricePerHour(e.target.value)} placeholder="z.B. 45"
              style={{ ...INP, marginBottom: 14, background: locked ? "#f5f5f3" : "#fff" }}/>

            <Lbl text="Preis pro Termin/Session (€)" hint="Optional — z.B. Pauschalpreis statt Stundensatz."/>
            <input type="number" min="0" step="0.5" value={pricePerSession} disabled={locked}
              onChange={e => setPricePerSession(e.target.value)} placeholder="z.B. 120"
              style={{ ...INP, marginBottom: 14, background: locked ? "#f5f5f3" : "#fff" }}/>

            <div style={{ fontSize: 11, color: C.inkFade }}>Währung: EUR</div>
          </>
        )}

        {/* ── SCHRITT 3: Ort ────────────────────────────────────── */}
        {step === 3 && (
          <>
            <Lbl text="Art des Angebots"/>
            <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
              {TALENT_LOCATION_TYPES.map(o => (
                <Chip key={o.value} active={locationType === o.value} disabled={locked} onClick={() => setLocationType(o.value)}>{o.label}</Chip>
              ))}
            </div>

            {locationType !== "online" && (
              <>
                <Lbl text="Adresse / Ort"/>
                <input value={locationAddress} onChange={e => setLocationAddress(e.target.value)} disabled={locked}
                  placeholder="Straße, Ort" style={{ ...INP, marginBottom: 14, background: locked ? "#f5f5f3" : "#fff" }}/>

                <Lbl text="Karten-Link (optional)"/>
                <input value={mapLink} onChange={e => setMapLink(e.target.value)} disabled={locked}
                  placeholder="https://maps.google.com/..." style={{ ...INP, marginBottom: 14, background: locked ? "#f5f5f3" : "#fff" }}/>
              </>
            )}

            <Lbl text="Hinweise zum Ort (optional)"/>
            <textarea value={locationNotes} onChange={e => setLocationNotes(e.target.value)} disabled={locked}
              placeholder="z.B. Parkplatz vorhanden, 2. Stock ohne Aufzug..." rows={3}
              style={{ ...INP, marginBottom: 14, resize: "vertical", background: locked ? "#f5f5f3" : "#fff" }}/>
          </>
        )}

        {/* ── SCHRITT 4: Datum & Zeiten ─────────────────────────── */}
        {step === 4 && (
          <>
            <Lbl text="Verfügbare Termine (optional)"/>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <input type="date" value={dateDraft} onChange={e => setDateDraft(e.target.value)} disabled={locked}
                style={{ ...INP, flex: 1, background: locked ? "#f5f5f3" : "#fff" }}/>
              <button type="button" onClick={addDate} disabled={locked || !dateDraft} style={{
                padding: "0 18px", borderRadius: 12, border: "none", background: C.teal, color: "#fff",
                fontWeight: 700, cursor: locked ? "default" : "pointer",
              }}>+</button>
            </div>
            {availableDates.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                {availableDates.map(d => (
                  <span key={d} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px",
                    borderRadius: 99, background: "rgba(14,196,184,0.10)", fontSize: 12, color: C.teal, fontWeight: 600 }}>
                    {d}
                    {!locked && <span onClick={() => removeDate(d)} style={{ cursor: "pointer", fontWeight: 800 }}>×</span>}
                  </span>
                ))}
              </div>
            )}

            <Lbl text="Zeitfenster (optional)"/>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <input type="time" value={slotStart} onChange={e => setSlotStart(e.target.value)} disabled={locked}
                style={{ ...INP, flex: 1, background: locked ? "#f5f5f3" : "#fff" }}/>
              <input type="time" value={slotEnd} onChange={e => setSlotEnd(e.target.value)} disabled={locked}
                style={{ ...INP, flex: 1, background: locked ? "#f5f5f3" : "#fff" }}/>
              <button type="button" onClick={addSlot} disabled={locked || !slotStart || !slotEnd} style={{
                padding: "0 18px", borderRadius: 12, border: "none", background: C.teal, color: "#fff",
                fontWeight: 700, cursor: locked ? "default" : "pointer",
              }}>+</button>
            </div>
            {timeSlots.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                {timeSlots.map((s, i) => (
                  <span key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px",
                    borderRadius: 99, background: "rgba(14,196,184,0.10)", fontSize: 12, color: C.teal, fontWeight: 600 }}>
                    {s.start}–{s.end}
                    {!locked && <span onClick={() => removeSlot(i)} style={{ cursor: "pointer", fontWeight: 800 }}>×</span>}
                  </span>
                ))}
              </div>
            )}

            <Lbl text="Wiederholung"/>
            <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
              {TALENT_RECURRING_OPTIONS.map(o => (
                <Chip key={o.value || "none"} active={recurring === o.value} disabled={locked} onClick={() => setRecurring(o.value)}>{o.label}</Chip>
              ))}
            </div>

            <Lbl text="Dauer (Minuten, optional)"/>
            <input type="number" min="0" step="5" value={durationMinutes} disabled={locked}
              onChange={e => setDurationMinutes(e.target.value)} placeholder="z.B. 60"
              style={{ ...INP, marginBottom: 14, background: locked ? "#f5f5f3" : "#fff" }}/>
          </>
        )}

        {/* ── SCHRITT 5: Kapazität & Buchbarkeit ────────────────── */}
        {step === 5 && (
          <>
            <Lbl text="Buchungsart"/>
            <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
              {TALENT_BOOKING_TYPES.map(o => (
                <Chip key={o.value} active={bookingType === o.value} disabled={locked} onClick={() => setBookingType(o.value)}>{o.label}</Chip>
              ))}
            </div>

            {bookingType === "gruppe" && (
              <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                <div style={{ flex: 1 }}>
                  <Lbl text="Min. Teilnehmer"/>
                  <input type="number" min="1" value={minParticipants} disabled={locked}
                    onChange={e => setMinParticipants(e.target.value)} style={{ ...INP, background: locked ? "#f5f5f3" : "#fff" }}/>
                </div>
                <div style={{ flex: 1 }}>
                  <Lbl text="Max. Teilnehmer"/>
                  <input type="number" min="1" value={maxParticipants} disabled={locked}
                    onChange={e => setMaxParticipants(e.target.value)} style={{ ...INP, background: locked ? "#f5f5f3" : "#fff" }}/>
                </div>
              </div>
            )}

            <Lbl text="Buchungszeitraum (optional)" hint="In welchem Zeitraum kann dieses Angebot gebucht werden?"/>
            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              <input type="date" value={windowStart} disabled={locked} onChange={e => setWindowStart(e.target.value)}
                style={{ ...INP, flex: 1, background: locked ? "#f5f5f3" : "#fff" }}/>
              <input type="date" value={windowEnd} disabled={locked} onChange={e => setWindowEnd(e.target.value)}
                style={{ ...INP, flex: 1, background: locked ? "#f5f5f3" : "#fff" }}/>
            </div>
          </>
        )}

        {/* ── SCHRITT 6: Bilder ─────────────────────────────────── */}
        {step === 6 && (
          <>
            <Lbl text="Bilder (bis zu 5)"/>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 14 }}>
              {images.map((img, idx) => (
                <div key={idx} style={{ position: "relative", aspectRatio: "1", borderRadius: 12, overflow: "hidden", background: "#e8e4df", border: `1.5px solid ${C.border}` }}>
                  <img src={img.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
                  {!locked && (
                    <button onClick={() => removeImage(idx)} style={{
                      position: "absolute", top: 4, right: 4, width: 20, height: 20, borderRadius: "50%",
                      background: "rgba(0,0,0,0.55)", border: "none", color: "#fff", fontSize: 12,
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    }}>×</button>
                  )}
                </div>
              ))}
              {images.length < 5 && !locked && (
                <div onClick={() => !uploading && fileRef.current?.click()} style={{
                  aspectRatio: "1", borderRadius: 12, border: `2px dashed rgba(14,196,184,0.38)`,
                  background: "rgba(14,196,184,0.04)", display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", cursor: uploading ? "not-allowed" : "pointer", gap: 4,
                }}>
                  {uploading ? <div style={{ fontSize: 12, color: C.teal }}>…</div> : (
                    <><div style={{ fontSize: 20, color: C.teal, fontWeight: 300 }}>+</div><div style={{ fontSize: 9, color: C.teal, fontWeight: 600 }}>Bild</div></>
                  )}
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleUpload}/>
          </>
        )}

        {error && (
          <div style={{ background: "rgba(255,80,80,0.10)", color: "#d13a3a", borderRadius: 10, padding: "10px 12px", fontSize: 12, marginTop: 4 }}>{error}</div>
        )}
      </div>

      {/* ── FOOTER-AKTIONEN ───────────────────────────────────── */}
      {!locked && (
        <div style={{ padding: "12px 20px max(12px, env(safe-area-inset-bottom, 12px))", background: "#fff", borderTop: `1px solid ${C.border}` }}>
          {isLast ? (
            <PBtn label={isEdit ? "Änderungen speichern" : "Zur Prüfung einreichen"} onClick={handleSave} loading={saving} disabled={uploading}/>
          ) : (
            <PBtn label="Weiter" onClick={() => canNext() && setStep(s => Math.min(TOTAL, s + 1))} disabled={!canNext()}/>
          )}
          {step > 1 && <SBtn label="Zurück" onClick={() => setStep(s => Math.max(1, s - 1))}/>}
        </div>
      )}
      {locked && (
        <div style={{ padding: "12px 20px max(12px, env(safe-area-inset-bottom, 12px))", background: "#fff", borderTop: `1px solid ${C.border}` }}>
          <SBtn label="Schließen" onClick={onClose}/>
        </div>
      )}
    </div>,
    document.body
  );
}
