// connection-create/ConnectionForm.jsx
// Screenshot-exact mittleres Formular
// Alle Felder: Titel, Beschreibung, Datum, Uhrzeit, Ort, Teilnehmer,
//             Kosten, Stimmung, Sichtbarkeit, Offenheit, Extras, Medien

import React from "react";
import { MoodSelector, VisibilitySelector, CostSelector, OpennessPicker } from "./Selectors.jsx";
import { ParticipantStepper, LocationPicker, MediaAttachmentBar } from "./Widgets.jsx";
import { HUI } from "../../design/hui.design.js";

const C = {
  violet:HUI.COLOR.violet, ink:HUI.COLOR.ink,
  muted:"rgba(80,80,80,0.52)", border:"rgba(0,0,0,0.08)",
  cream:HUI.COLOR.cream,
};

const CSS = `
  .cf-input {
    width:100%; border:1.5px solid rgba(0,0,0,0.08);
    border-radius:14px; padding:11px 14px;
    font-size:14.5px; font-family:inherit; color:#1A1A1A;
    background:rgba(255,255,255,0.80);
    outline:none; transition:border 0.18s, box-shadow 0.18s;
    box-sizing:border-box;
    -webkit-appearance:none;
  }
  .cf-input:focus {
    border-color:rgba(139,92,246,0.38);
    box-shadow:0 0 0 3px rgba(139,92,246,0.09);
  }
  .cf-input::placeholder { color:rgba(80,80,80,0.40); }
  .cf-label {
    font-size:13px; font-weight:700; color:rgba(80,80,80,0.70);
    margin-bottom:7px; display:block; letter-spacing:0.05em;
  }
  .cf-section { margin-bottom:24px; }
`;

function CharCount({ cur, max }) {
  return (
    <div style={{
      textAlign:"right", fontSize:11, color:"rgba(80,80,80,0.40)",
      marginTop:5,
    }}>{cur}/{max}</div>
  );
}

function Row({ children, gap=12 }) {
  return (
    <div style={{ display:"flex", gap, flexWrap:"wrap" }}>
      {children}
    </div>
  );
}

export default function ConnectionForm({ data, onChange }) {
  const set = (key, val) => onChange({ ...data, [key]: val });

  const today = new Date().toISOString().slice(0,10);
  const todayDisplay = new Date().toLocaleDateString("de-DE",
    { weekday:"short", day:"numeric", month:"long", year:"numeric" });

  return (
    <div>
      <style>{CSS}</style>

      {/* ── Titel ── */}
      <div className="cf-section">
        <label className="cf-label">Titel deiner Verbindung</label>
        <input
          className="cf-input"
          maxLength={60}
          value={data.title || ""}
          onChange={e => set("title", e.target.value)}
          placeholder="Lagerfeuer am Strand \uD83D\uDD25"
        />
        <CharCount cur={data.title?.length || 0} max={60}/>
      </div>

      {/* ── Beschreibung ── */}
      <div className="cf-section">
        <label className="cf-label">Beschreibung</label>
        <textarea
          className="cf-input"
          maxLength={300}
          rows={4}
          value={data.description || ""}
          onChange={e => set("description", e.target.value)}
          placeholder="Gemeinsames Lagerfeuer, gute Gespr\u00e4che, Musik und einfach den Moment genie\u00dfen&#8230;"
          style={{ resize:"vertical", minHeight:88 }}
        />
        <CharCount cur={data.description?.length || 0} max={300}/>
      </div>

      {/* ── Datum + Uhrzeit ── */}
      <div className="cf-section">
        <Row>
          <div style={{ flex:1, minWidth:160 }}>
            <label className="cf-label">Datum</label>
            <div style={{ position:"relative" }}>
              <span style={{
                position:"absolute", left:12, top:"50%", transform:"translateY(-50%)",
                fontSize:15, pointerEvents:"none",
              }}>📅</span>
              <select
                className="cf-input"
                style={{ paddingLeft:36, appearance:"none" }}
                value={data.date || today}
                onChange={e => set("date", e.target.value)}
              >
                <option value={today}>Heute, {todayDisplay.split(",")[1]?.trim()}</option>
                <option value="">Datum w\u00e4hlen\u2026</option>
              </select>
              <span style={{
                position:"absolute", right:12, top:"50%", transform:"translateY(-50%)",
                color:C.muted, fontSize:11, pointerEvents:"none",
              }}>▾</span>
            </div>
          </div>
          <div style={{ flex:1, minWidth:120 }}>
            <label className="cf-label">Uhrzeit</label>
            <div style={{ position:"relative" }}>
              <span style={{
                position:"absolute", left:12, top:"50%", transform:"translateY(-50%)",
                fontSize:15, pointerEvents:"none",
              }}>🕐</span>
              <select
                className="cf-input"
                style={{ paddingLeft:36, appearance:"none" }}
                value={data.time || "20:00"}
                onChange={e => set("time", e.target.value)}
              >
                {["10:00","12:00","14:00","16:00","18:00","19:00","20:00","21:00","22:00"].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <span style={{
                position:"absolute", right:12, top:"50%", transform:"translateY(-50%)",
                color:C.muted, fontSize:11, pointerEvents:"none",
              }}>▾</span>
            </div>
          </div>
        </Row>
      </div>

      {/* ── Ort ── */}
      <div className="cf-section">
        <label className="cf-label">Ort</label>
        <LocationPicker
          value={data.location || ""}
          onChange={v => set("location", v)}
        />
      </div>

      {/* ── Teilnehmer ── */}
      <div className="cf-section">
        <label className="cf-label">Teilnehmer</label>
        <ParticipantStepper
          value={data.participants || 30}
          onChange={v => set("participants", v)}
        />
      </div>

      {/* ── Kosten ── */}
      <div className="cf-section">
        <label className="cf-label">Kosten</label>
        <CostSelector
          value={data.cost || "free"}
          onChange={v => set("cost", v)}
        />
        {data.cost === "free" && (
          <div style={{ fontSize:12, color:C.muted, marginTop:8 }}>
            Diese Verbindung ist kostenlos.
          </div>
        )}
        {(data.cost === "fixed" || data.cost === "donation") && (
          <input
            className="cf-input"
            style={{ marginTop:10 }}
            placeholder="Betrag eingeben (z.B. 12 \u20ac)"
            value={data.costAmount || ""}
            onChange={e => set("costAmount", e.target.value)}
          />
        )}
      </div>

      {/* ── Stimmung / Energie ── */}
      <div className="cf-section">
        <label className="cf-label">Stimmung / Energie</label>
        <MoodSelector
          value={data.mood || "gesellig"}
          onChange={v => set("mood", v)}
        />
      </div>

      {/* ── Sichtbarkeit ── */}
      <div className="cf-section">
        <label className="cf-label">Sichtbarkeit</label>
        <VisibilitySelector
          value={data.visibility || "public"}
          onChange={v => set("visibility", v)}
        />
      </div>

      {/* ── Offenheit ── */}
      <div className="cf-section">
        <label className="cf-label">Offenheit</label>
        <OpennessPicker
          value={data.openness || "open"}
          onChange={v => set("openness", v)}
        />
      </div>

      {/* ── Zusätzliche Infos ── */}
      <div className="cf-section">
        <label className="cf-label">Zus\u00e4tzliche Infos (optional)</label>
        <textarea
          className="cf-input"
          maxLength={200}
          rows={2}
          value={data.extras || ""}
          onChange={e => set("extras", e.target.value)}
          placeholder="z.B. Mitbringen, Hinweise, Besonderheiten\u2026"
          style={{ resize:"none" }}
        />
        <CharCount cur={data.extras?.length || 0} max={200}/>
      </div>

      {/* ── Medien ── */}
      <div className="cf-section">
        <MediaAttachmentBar
          onImage={() => {}}
          onMusic={() => {}}
          onLink={() => {}}
        />
      </div>
    </div>
  );
}
