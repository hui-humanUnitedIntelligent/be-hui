// src/components/experiences/ExperienceWizard.jsx
// HUI – Erlebnis-Editor: 4-Schritte-Wizard (v2)
// Schritt 1: Basis | 2: Wann & Wo | 3: Teilnahme | 4: Veröffentlichen
import React, { useState, useRef, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient.js";

// ── Design-Tokens ─────────────────────────────────────────────
const C = {
  teal:      "#0EC4B8",
  tealD:     "#0DBBAF",
  tealSoft:  "rgba(14,196,184,0.08)",
  tealBdr:   "rgba(14,196,184,0.28)",
  cream:     "#F8F7F4",
  white:     "#FFFFFF",
  ink:       "#1A1A18",
  inkMid:    "rgba(26,26,24,0.55)",
  inkFade:   "rgba(26,26,24,0.35)",
  border:    "rgba(26,26,24,0.10)",
  borderMed: "rgba(26,26,24,0.16)",
  redSoft:   "rgba(239,68,68,0.08)",
  redBdr:    "rgba(239,68,68,0.20)",
};

// ── Erlebnis-Typen ────────────────────────────────────────────
const EXP_TYPEN = [
  { id:"workshop",    icon:"🛠️",  label:"Workshop"    },
  { id:"event",       icon:"🎉",  label:"Event"       },
  { id:"projekt",     icon:"🌱",  label:"Projekt"     },
  { id:"ausstellung", icon:"🖼️",  label:"Ausstellung" },
  { id:"kurs",        icon:"📚",  label:"Kurs"        },
  { id:"tour",        icon:"🗺️",  label:"Tour"        },
];

// ── Preis-Bezugsgrößen ────────────────────────────────────────
const PREIS_PRO = [
  { id:"Teilnehmer", label:"Teilnehmer", sub:"z. B. pro Person" },
  { id:"Ticket",     label:"Ticket",     sub:"z. B. pro Ticket" },
  { id:"Stunde",     label:"Stunde",     sub:"z. B. pro Stunde" },
  { id:"Tag",        label:"Tag",        sub:"z. B. pro Tag"    },
  { id:"Kurs",       label:"Kurs",       sub:"z. B. pro Kurs"   },
  { id:"Gruppe",     label:"Gruppe",     sub:"z. B. pro Gruppe" },
  { id:"Monat",      label:"Monat",      sub:"z. B. pro Monat"  },
];

const SICHTBARKEIT = [
  { id:"public",      icon:"🌍", label:"Öffentlich",   sub:"Sichtbar im HUI-Feed und Talent-Profil." },
  { id:"connections", icon:"🔗", label:"Verbindungen", sub:"Nur für Menschen in deinem Netzwerk." },
  { id:"private",     icon:"🔒", label:"Privat",       sub:"Nur für dich sichtbar." },
];

// ══════════════════════════════════════════════════════════════
// Basis-Bausteine
// ══════════════════════════════════════════════════════════════
const INP_BASE = {
  width: "100%", boxSizing: "border-box",
  padding: "14px 16px", borderRadius: 14,
  border: `1.5px solid ${C.border}`,
  outline: "none", fontSize: 16,
  fontFamily: "inherit", color: C.ink, background: C.white,
  WebkitAppearance: "none", appearance: "none",
};

function Label({ text, req, hint }) {
  return (
    <div style={{ marginBottom: 7 }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: C.inkMid }}>{text}</span>
      {req && <span style={{ color: C.teal, marginLeft: 3, fontSize: 13 }}>*</span>}
      {hint && <span style={{ fontSize: 11.5, color: C.inkFade, marginLeft: 8 }}>{hint}</span>}
    </div>
  );
}

function Field({ label, req, hint, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      {label && <Label text={label} req={req} hint={hint}/>}
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, maxLen, type="text", inputMode }) {
  return (
    <div>
      <input
        type={type} inputMode={inputMode}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLen}
        style={INP_BASE}
      />
      {maxLen && (
        <div style={{ textAlign: "right", fontSize: 11, color: C.inkFade, marginTop: 4 }}>
          {value.length}/{maxLen}
        </div>
      )}
    </div>
  );
}

function TextArea({ value, onChange, placeholder, maxLen, rows=4 }) {
  return (
    <div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLen}
        style={{ ...INP_BASE, resize: "none", lineHeight: 1.6 }}
      />
      {maxLen && (
        <div style={{ textAlign: "right", fontSize: 11, color: C.inkFade, marginTop: 4 }}>
          {value.length}/{maxLen}
        </div>
      )}
    </div>
  );
}

// Typ-Chip: horizontale Grid-Kacheln (3 Spalten)
function TypChip({ active, icon, label, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 7,
        padding: "11px 14px", borderRadius: 12,
        border: active ? `2px solid ${C.teal}` : `1.5px solid ${C.border}`,
        background: active ? C.tealSoft : C.white,
        cursor: "pointer", touchAction: "manipulation",
        transition: "all .14s",
      }}
    >
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span style={{ fontSize: 13, fontWeight: active ? 700 : 600, color: active ? C.teal : C.ink }}>
        {label}
      </span>
    </div>
  );
}

// Format-Pill: Vor Ort / Online
function FormatPill({ active, label, icon, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        padding: "14px 10px", borderRadius: 12,
        border: active ? `2px solid ${C.teal}` : `1.5px solid ${C.border}`,
        background: active ? C.tealSoft : C.white,
        cursor: "pointer", touchAction: "manipulation", transition: "all .14s",
      }}
    >
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span style={{ fontSize: 14, fontWeight: active ? 700 : 600, color: active ? C.teal : C.ink }}>
        {label}
      </span>
    </div>
  );
}

// Preis-pro-Karte (vertikale Liste)
function PreisProCard({ active, item, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "14px 16px", borderRadius: 12,
        border: active ? `2px solid ${C.teal}` : `1.5px solid ${C.border}`,
        background: active ? C.tealSoft : C.white,
        cursor: "pointer", touchAction: "manipulation", transition: "all .14s",
        minHeight: 54,
      }}
    >
      {/* Radio-Dot */}
      <div style={{
        width: 20, height: 20, borderRadius: "50%",
        border: active ? `2px solid ${C.teal}` : `2px solid ${C.border}`,
        background: active ? C.teal : "transparent",
        flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {active && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff" }}/>}
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: active ? C.teal : C.ink }}>{item.label}</div>
        <div style={{ fontSize: 11.5, color: C.inkMid, marginTop: 1 }}>{item.sub}</div>
      </div>
    </div>
  );
}

// Sichtbarkeits-Karte
function SichtCard({ active, item, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "16px", borderRadius: 14,
        border: active ? `2px solid ${C.teal}` : `1.5px solid ${C.border}`,
        background: active ? C.tealSoft : C.white,
        cursor: "pointer", touchAction: "manipulation", transition: "all .14s",
      }}
    >
      <div style={{
        width: 20, height: 20, borderRadius: "50%",
        border: active ? `2px solid ${C.teal}` : `2px solid ${C.border}`,
        background: active ? C.teal : "transparent",
        flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {active && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff" }}/>}
      </div>
      <div style={{ fontSize: 20, flexShrink: 0 }}>{item.icon}</div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: active ? C.teal : C.ink }}>{item.label}</div>
        <div style={{ fontSize: 12, color: C.inkMid, marginTop: 2 }}>{item.sub}</div>
      </div>
    </div>
  );
}

// Ja/Nein Toggle-Pill
function JaNeinPill({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 10 }}>
      {[true, false].map(v => (
        <div
          key={String(v)}
          onClick={() => onChange(v)}
          style={{
            flex: 1, textAlign: "center", padding: "13px",
            borderRadius: 12, fontSize: 14, fontWeight: 700,
            border: value === v ? `2px solid ${C.teal}` : `1.5px solid ${C.border}`,
            background: value === v ? C.tealSoft : C.white,
            color: value === v ? C.teal : C.ink,
            cursor: "pointer", touchAction: "manipulation", transition: "all .14s",
          }}
        >
          {v ? "Ja" : "Nein"}
        </div>
      ))}
    </div>
  );
}

// ── Fortschrittsbalken oben ───────────────────────────────────
function ProgressBar({ step, total }) {
  const LABELS = ["Basis", "Wann & Wo", "Teilnahme", "Veröffentlichen"];
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center", gap: 0, padding: "0 8px" }}>
      {Array.from({ length: total }, (_, i) => {
        const n = i + 1; const done = n < step; const cur = n === step;
        return (
          <React.Fragment key={n}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, minWidth: 52 }}>
              <div style={{
                width: cur ? 30 : 24, height: cur ? 30 : 24, borderRadius: "50%",
                background: (done || cur) ? C.teal : "rgba(26,26,24,0.09)",
                border: cur ? `2.5px solid ${C.teal}` : "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: cur ? 13 : 11, fontWeight: 700,
                color: (done || cur) ? "#fff" : C.inkFade,
                flexShrink: 0, transition: "all .22s",
                boxShadow: cur ? `0 0 0 4px rgba(14,196,184,0.18)` : "none",
              }}>
                {done ? "✓" : n}
              </div>
              <div style={{
                fontSize: 10, fontWeight: cur ? 700 : 500,
                color: cur ? C.teal : C.inkFade,
                textAlign: "center", lineHeight: 1.2,
                whiteSpace: "nowrap",
              }}>
                {LABELS[i]}
              </div>
            </div>
            {i < total - 1 && (
              <div style={{
                flex: 1, height: 2, marginTop: 14,
                background: done ? C.teal : "rgba(26,26,24,0.09)",
                transition: "background .22s",
              }}/>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Top Bar ───────────────────────────────────────────────────
function TopBar({ onClose, step, total, isEdit }) {
  return (
    <div style={{ padding: "14px 20px 14px", background: C.white, borderBottom: `1px solid ${C.border}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <button onClick={onClose} style={{ background: "none", border: "none", padding: 0, fontSize: 13, fontWeight: 600, color: C.inkMid, cursor: "pointer", touchAction: "manipulation" }}>
          Abbrechen
        </button>
        <div style={{ fontSize: 15, fontWeight: 800, color: C.ink }}>
          {isEdit ? "Erlebnis bearbeiten" : "Erlebnis erstellen"}
        </div>
        <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(26,26,24,0.07)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", touchAction: "manipulation" }}>
          <span style={{ fontSize: 16, color: C.ink, lineHeight: 1 }}>×</span>
        </button>
      </div>
      <ProgressBar step={step} total={total}/>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// SCHRITT 1 — BASIS
// Titel · Typ · Kurzbeschreibung · Titelbild
// ══════════════════════════════════════════════════════════════
function S1({ data, onChange, userId }) {
  const [upl, setUpl] = useState(false);
  const ref = useRef(null);
  const imgs = data.images || [];

  async function upload(e) {
    const files = Array.from(e.target.files || []);
    if (!userId || !files.length) return;
    setUpl(true);
    const next = [...imgs];
    for (const file of files.slice(0, 5 - next.length)) {
      const ext  = file.name.split(".").pop().toLowerCase();
      const path = `experiences/${userId}/${Date.now()}_${Math.random().toString(36).slice(2, 6)}.${ext}`;
      const { error } = await supabase.storage.from("media").upload(path, file, { upsert: true });
      if (!error) {
        const { data: u } = supabase.storage.from("media").getPublicUrl(path);
        next.push({ url: u.publicUrl, path });
      }
    }
    onChange({ images: next });
    setUpl(false);
    if (ref.current) ref.current.value = "";
  }

  function removeImg(idx) {
    onChange({ images: imgs.filter((_, i) => i !== idx) });
  }

  const firstImg = imgs[0]?.url;

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, color: C.ink, marginBottom: 4 }}>Basis</div>
      <div style={{ fontSize: 13, color: C.inkMid, marginBottom: 24, lineHeight: 1.5 }}>Erzähl kurz, worum es geht.</div>

      {/* Titel */}
      <Field label="Titel" req>
        <TextInput value={data.title || ""} onChange={v => onChange({ title: v })} placeholder="Aquarell Workshop für Anfänger" maxLen={80}/>
      </Field>

      {/* Typ — 3-spaltige Chip-Kacheln */}
      <Field label="Typ" req>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {EXP_TYPEN.map(et => (
            <TypChip
              key={et.id}
              active={data.experience_type === et.id}
              icon={et.icon}
              label={et.label}
              onClick={() => onChange({ experience_type: et.id })}
            />
          ))}
        </div>
      </Field>

      {/* Kurzbeschreibung */}
      <Field label="Kurzbeschreibung" req>
        <TextArea
          value={data.caption || ""}
          onChange={v => onChange({ caption: v })}
          placeholder="Lerne die Grundlagen der Aquarellmalerei in entspannter Atmosphäre…"
          maxLen={250}
          rows={4}
        />
      </Field>

      {/* Titelbild */}
      <Field label="Titelbild" req>
        {firstImg ? (
          <div style={{ position: "relative", borderRadius: 14, overflow: "hidden", aspectRatio: "16/9", background: "#1A1A18" }}>
            <img src={firstImg} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}/>
            <button
              onClick={() => removeImg(0)}
              style={{
                position: "absolute", top: 10, right: 10,
                width: 30, height: 30, borderRadius: "50%",
                background: "rgba(0,0,0,0.60)", border: "none",
                color: "#fff", fontSize: 16, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                touchAction: "manipulation",
              }}
            >×</button>
            <div style={{
              position: "absolute", bottom: 10, left: 10,
              background: "rgba(14,196,184,0.90)", borderRadius: 8,
              padding: "3px 10px", fontSize: 10, fontWeight: 700, color: "#fff",
            }}>TITELBILD</div>
          </div>
        ) : (
          <div
            onClick={() => !upl && ref.current?.click()}
            style={{
              aspectRatio: "16/9", borderRadius: 14,
              border: `2px dashed ${C.tealBdr}`,
              background: C.tealSoft,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              gap: 8, cursor: upl ? "not-allowed" : "pointer",
              touchAction: "manipulation",
            }}
          >
            {upl ? (
              <div style={{ fontSize: 13, color: C.teal, fontWeight: 600 }}>Wird hochgeladen…</div>
            ) : (
              <>
                <div style={{ fontSize: 28, color: C.teal, lineHeight: 1 }}>📷</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.teal }}>Bild hochladen</div>
                <div style={{ fontSize: 11.5, color: C.inkFade }}>Tippe um ein Foto auszuwählen</div>
              </>
            )}
          </div>
        )}
        <input ref={ref} type="file" accept="image/*" style={{ display: "none" }} onChange={upload}/>
      </Field>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// SCHRITT 2 — WANN & WO
// Datum · Beginn · Ende · Ort · Vor Ort / Online
// ══════════════════════════════════════════════════════════════
function S2({ data, onChange }) {
  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, color: C.ink, marginBottom: 4 }}>Wann & Wo</div>
      <div style={{ fontSize: 13, color: C.inkMid, marginBottom: 24, lineHeight: 1.5 }}>Wann und wo findet das Erlebnis statt?</div>

      {/* Datum */}
      <Field label="Datum" req>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: C.inkFade, pointerEvents: "none" }}>📅</span>
          <input
            type="date"
            value={data.date || ""}
            onChange={e => onChange({ date: e.target.value })}
            style={{ ...INP_BASE, paddingLeft: 46 }}
          />
        </div>
      </Field>

      {/* Uhrzeiten — nebeneinander */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
        {/* Beginn */}
        <div>
          <Label text="Beginn" req/>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 15, color: C.inkFade, pointerEvents: "none" }}>🕐</span>
            <input
              type="time"
              value={data.time_start || ""}
              onChange={e => onChange({ time_start: e.target.value })}
              style={{ ...INP_BASE, paddingLeft: 44 }}
            />
          </div>
        </div>
        {/* Ende */}
        <div>
          <Label text="Ende" hint="optional"/>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 15, color: C.inkFade, pointerEvents: "none" }}>🕐</span>
            <input
              type="time"
              value={data.time_end || ""}
              onChange={e => onChange({ time_end: e.target.value })}
              style={{ ...INP_BASE, paddingLeft: 44 }}
            />
          </div>
        </div>
      </div>

      {/* Ort */}
      <Field label="Ort" req>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: C.inkFade, pointerEvents: "none" }}>📍</span>
          <input
            type="text"
            value={data.location_text || ""}
            onChange={e => onChange({ location_text: e.target.value })}
            placeholder="KunstRaum HUI, Wien"
            maxLength={120}
            style={{ ...INP_BASE, paddingLeft: 46 }}
          />
        </div>
      </Field>

      {/* Online oder Vor Ort */}
      <Field label="Online oder Vor Ort" req>
        <div style={{ display: "flex", gap: 10 }}>
          <FormatPill active={data.format === "vor_ort"} label="Vor Ort" icon="🏛️" onClick={() => onChange({ format: "vor_ort" })}/>
          <FormatPill active={data.format === "online"}  label="Online"  icon="💻" onClick={() => onChange({ format: "online"  })}/>
        </div>
      </Field>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// SCHRITT 3 — TEILNAHME
// Preis · Währung · Preis gilt pro · Teilnehmerzahl · Anmeldung
// ══════════════════════════════════════════════════════════════
function S3({ data, onChange }) {
  const WÄHRUNGEN = ["EUR – Euro", "CHF – Franken", "USD – Dollar"];

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, color: C.ink, marginBottom: 4 }}>Teilnahme</div>
      <div style={{ fontSize: 13, color: C.inkMid, marginBottom: 24, lineHeight: 1.5 }}>Details zur Teilnahme und zum Preis.</div>

      {/* Preis — großer Input */}
      <Field label="Preis" req>
        <div style={{ position: "relative" }}>
          <span style={{
            position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)",
            fontSize: 22, fontWeight: 700, color: "rgba(14,196,184,0.60)",
            pointerEvents: "none", userSelect: "none",
          }}>€</span>
          <input
            type="number" min="0" step="0.01"
            inputMode="decimal"
            value={data.price || ""}
            onChange={e => onChange({ price: e.target.value })}
            placeholder="49,00"
            style={{
              ...INP_BASE,
              paddingLeft: 52,
              fontSize: 28, fontWeight: 800,
              border: `2px solid ${data.price ? C.teal : C.border}`,
              letterSpacing: 0.5, transition: "border-color .15s",
            }}
          />
        </div>
      </Field>

      {/* Währung */}
      <Field label="Währung">
        <select
          value={data.currency || "EUR – Euro"}
          onChange={e => onChange({ currency: e.target.value.split(" ")[0] })}
          style={{
            ...INP_BASE,
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%230EC4B8' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat", backgroundPosition: "right 16px center", paddingRight: 44,
          }}
        >
          {WÄHRUNGEN.map(w => <option key={w} value={w}>{w}</option>)}
        </select>
      </Field>

      {/* Preis gilt pro — vertikale Radio-Liste */}
      <Field label="Preis gilt pro" req>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {PREIS_PRO.map(pp => (
            <PreisProCard
              key={pp.id}
              active={data.price_per === pp.id}
              item={pp}
              onClick={() => onChange({ price_per: pp.id })}
            />
          ))}
        </div>
        {data.price && data.price_per && (
          <div style={{
            marginTop: 12, padding: "10px 14px", borderRadius: 10,
            background: C.tealSoft, border: `1.5px solid ${C.tealBdr}`,
            fontSize: 13, fontWeight: 700, color: C.teal,
          }}>
            {parseFloat(data.price).toFixed(2).replace(".", ",")} {data.currency || "EUR"} pro {data.price_per}
          </div>
        )}
      </Field>

      {/* Max. Teilnehmerzahl */}
      <Field label="Maximale Teilnehmerzahl" hint="optional">
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 18, color: C.inkFade, pointerEvents: "none" }}>👥</span>
          <input
            type="number" min="1" max="9999"
            inputMode="numeric"
            value={data.max_participants || ""}
            onChange={e => onChange({ max_participants: e.target.value })}
            placeholder="12"
            style={{ ...INP_BASE, paddingLeft: 46, fontSize: 20, fontWeight: 700 }}
          />
        </div>
      </Field>

      {/* Anmeldung erforderlich */}
      <Field label="Anmeldung erforderlich?">
        <JaNeinPill
          value={data.registration_required ?? false}
          onChange={v => onChange({ registration_required: v })}
        />
      </Field>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// SCHRITT 4 — VERÖFFENTLICHEN
// Summary · Sichtbarkeit · Veröffentlichen-Button (im Footer)
// ══════════════════════════════════════════════════════════════
function S4({ data, onChange, saving }) {
  const cover   = data.images?.[0]?.url;
  const typeObj = EXP_TYPEN.find(t => t.id === data.experience_type);

  // Datum formatieren
  const fmtDate = iso => {
    if (!iso) return null;
    try { return new Date(iso).toLocaleDateString("de-DE", { day:"numeric", month:"2-digit", year:"numeric" }); }
    catch { return iso; }
  };

  // Uhrzeit-Range
  const timeRange = data.time_start
    ? data.time_end
      ? `${data.time_start} – ${data.time_end}`
      : data.time_start
    : null;

  // Preis-Anzeige
  const preisAnzeige = data.price && data.price_per
    ? `${parseFloat(data.price).toFixed(2).replace(".", ",")} ${data.currency || "EUR"} pro ${data.price_per}`
    : data.price
      ? `${parseFloat(data.price).toFixed(2).replace(".", ",")} ${data.currency || "EUR"}`
      : null;

  const summaryRows = [
    fmtDate(data.date) && { icon:"📅", text: fmtDate(data.date) },
    timeRange          && { icon:"🕐", text: timeRange },
    data.location_text && { icon:"📍", text: data.location_text },
    data.max_participants && { icon:"👥", text: `Max. ${data.max_participants} Teilnehmende` },
    preisAnzeige       && { icon:"💰", text: preisAnzeige },
    data.registration_required && { icon:"📋", text: "Anmeldung erforderlich" },
  ].filter(Boolean);

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, color: C.ink, marginBottom: 4 }}>Veröffentlichen</div>
      <div style={{ fontSize: 13, color: C.inkMid, marginBottom: 20, lineHeight: 1.5 }}>Fast geschafft! Prüfe deine Angaben.</div>

      {/* Summary-Karte */}
      <div style={{ borderRadius: 16, overflow: "hidden", border: `1.5px solid ${C.border}`, background: C.white, marginBottom: 24, boxShadow: "0 2px 16px rgba(26,26,24,0.07)" }}>
        {/* Titelbild */}
        {cover ? (
          <div style={{ width: "100%", aspectRatio: "16/9", background: "#1A1A18", overflow: "hidden" }}>
            <img src={cover} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}/>
          </div>
        ) : (
          <div style={{ width: "100%", height: 100, background: C.tealSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, opacity: 0.4 }}>📅</div>
        )}
        {/* Info */}
        <div style={{ padding: "16px 18px" }}>
          {/* Typ-Badge */}
          {typeObj && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 99, background: C.tealSoft, border: `1.5px solid ${C.tealBdr}`, fontSize: 11, fontWeight: 700, color: C.teal, marginBottom: 8 }}>
              {typeObj.icon} {typeObj.label}
            </div>
          )}
          {/* Titel */}
          <div style={{ fontSize: 18, fontWeight: 800, color: C.ink, lineHeight: 1.3, marginBottom: 12 }}>
            {data.title || "Kein Titel"}
          </div>
          {/* Summary-Rows */}
          {summaryRows.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {summaryRows.map((row, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{row.icon}</span>
                  <span style={{ fontSize: 13, color: C.inkMid, lineHeight: 1.4 }}>{row.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sichtbarkeit */}
      <div style={{ marginBottom: 20 }}>
        <Label text="Sichtbarkeit" req/>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {SICHTBARKEIT.map(s => (
            <SichtCard key={s.id} active={data.visibility === s.id} item={s} onClick={() => onChange({ visibility: s.id })}/>
          ))}
        </div>
      </div>

      {saving && (
        <div style={{ textAlign: "center", fontSize: 13, color: C.teal, fontWeight: 600, padding: "8px 0" }}>
          Wird gespeichert…
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// WIZARD ROOT
// ══════════════════════════════════════════════════════════════
export default function ExperienceWizard({ userId, existingExp = null, onClose, onSaved }) {
  const TOTAL = 4;
  const [step, setSt]             = useState(1);
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState(null);

  const [form, setForm] = useState(() => {
    if (existingExp) {
      let imgs = [];
      try { imgs = existingExp.images ? JSON.parse(existingExp.images) : []; } catch {}
      if (!imgs.length && existingExp.cover_url) imgs = [{ url: existingExp.cover_url }];
      return {
        images:               imgs,
        title:                existingExp.title               || "",
        experience_type:      existingExp.experience_type     || "",
        caption:              existingExp.caption             || "",
        date:                 existingExp.date ? existingExp.date.slice(0, 10) : "",
        time_start:           existingExp.time_start          || "",
        time_end:             existingExp.time_end            || "",
        location_text:        existingExp.location_text       || "",
        format:               existingExp.format              || "",
        price:                existingExp.price               ? String(existingExp.price) : "",
        currency:             existingExp.currency            || "EUR",
        price_per:            existingExp.price_per           || "",
        max_participants:     existingExp.max_participants     ? String(existingExp.max_participants) : "",
        registration_required: existingExp.registration_required ?? false,
        visibility:           existingExp.visibility          || "public",
        description:          existingExp.description         || "",
      };
    }
    return {
      images: [], title: "", experience_type: "", caption: "",
      date: "", time_start: "", time_end: "",
      location_text: "", format: "",
      price: "", currency: "EUR", price_per: "",
      max_participants: "", registration_required: false,
      visibility: "public", description: "",
    };
  });

  const patch  = u => setForm(p => ({ ...p, ...u }));
  const next   = () => setSt(s => Math.min(s + 1, TOTAL));
  const back   = () => setSt(s => Math.max(s - 1, 1));
  const isLast = step === TOTAL;

  // ── Validierung pro Schritt ────────────────────────────────
  const canContinue = useCallback(() => {
    switch (step) {
      case 1: return !!(form.title?.trim()) && !!(form.experience_type) && !!(form.caption?.trim()) && form.images.length > 0;
      case 2: return !!(form.date) && !!(form.time_start) && !!(form.location_text) && !!(form.format);
      case 3: return !!(form.price) && !!(form.price_per);
      case 4: return !!(form.visibility);
      default: return true;
    }
  }, [step, form]);

  // ── body-scroll sperren ────────────────────────────────────
  React.useLayoutEffect(() => {
    document.body.classList.add("hui-wizard-open");
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.classList.remove("hui-wizard-open");
      document.body.style.overflow = prev;
    };
  }, []);

  // ── Speichern ─────────────────────────────────────────────
  async function save(status) {
    console.log("[EXPERIENCE USER]", userId);
    if (!userId) {
      console.error("[EXPERIENCE USER] userId ist null/undefined — save() abgebrochen");
      return;
    }
    setSaving(true);

    const cover_url = form.images?.[0]?.url || null;
    const imagesArr = (form.images || []).map(img =>
      typeof img === "object" ? img : { url: img }
    );

    const payload = {
      user_id:               userId,
      title:                 form.title               || "",
      caption:               form.caption             || null,
      description:           form.description         || null,
      cover_url,
      images:                imagesArr,
      experience_type:       form.experience_type     || null,
      category:              form.experience_type     || null,
      date:                  form.date ? new Date(form.date).toISOString() : null,
      time_start:            form.time_start          || null,
      time_end:              form.time_end            || null,
      location_text:         form.location_text       || null,
      format:                form.format              || null,
      price:                 form.price ? parseFloat(form.price) : null,
      currency:              form.currency            || "EUR",
      price_per:             form.price_per           || null,
      max_participants:      form.max_participants ? parseInt(form.max_participants, 10) : null,
      registration_required: form.registration_required ?? false,
      visibility:            form.visibility          || "public",
      status,
      updated_at:            new Date().toISOString(),
    };

    console.log("[EXPERIENCE PUBLISH PAYLOAD]", JSON.stringify(payload, null, 2));

    const { data: saved, error } = existingExp?.id
      ? await supabase.from("experiences").update(payload).eq("id", existingExp.id).eq("user_id", userId).select().single()
      : await supabase.from("experiences").insert(payload).select().single();

    setSaving(false);

    if (error) {
      console.error("[EXPERIENCE INSERT ERROR]", error);
      setSaveError(error.message || "Speichern fehlgeschlagen");
      setTimeout(() => setSaveError(null), 6000);
      return;
    }

    console.log("[EXPERIENCE INSERT DATA]", saved);
    onSaved?.(saved);
    // pending_review: kurze Bestätigung, dann schließen
    if (saved?.status === "pending_review") {
      setSaveError("✅ Eingereicht! Das Erlebnis wird geprüft und dann freigegeben.");
      setTimeout(() => { setSaveError(null); onClose?.(); }, 2500);
    } else {
      onClose?.();
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0,
      zIndex: 10500,
      background: C.cream,
      display: "flex", flexDirection: "column",
    }}>
      {/* Header */}
      <TopBar onClose={onClose} step={step} total={TOTAL} isEdit={!!existingExp}/>

      {/* Scrollbarer Content */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
        padding: "24px 20px 0",
      }}>
        {step === 1 && <S1 data={form} onChange={patch} userId={userId}/>}
        {step === 2 && <S2 data={form} onChange={patch}/>}
        {step === 3 && <S3 data={form} onChange={patch}/>}
        {step === 4 && <S4 data={form} onChange={patch} saving={saving}/>}
        <div style={{ height: 120 }}/>
      </div>

      {/* Error Toast */}
      {saveError && (
        <div style={{
          flexShrink: 0, padding: "10px 20px",
          background: C.redSoft, borderTop: `1.5px solid ${C.redBdr}`,
          fontSize: 12.5, fontWeight: 600, color: "rgba(239,68,68,0.9)",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span>⚠</span>
          <span style={{ flex: 1 }}>{saveError}</span>
          <button onClick={() => setSaveError(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(239,68,68,0.7)", fontSize: 16, padding: 0 }}>×</button>
        </div>
      )}

      {/* Sticky Footer */}
      <div style={{
        flexShrink: 0, background: C.white,
        borderTop: `1px solid ${C.border}`,
        padding: "14px 20px",
        paddingBottom: "max(20px, env(safe-area-inset-bottom, 20px))",
        display: "flex", gap: 10,
        boxShadow: "0 -4px 20px rgba(0,0,0,0.07)",
      }}>
        {/* Zurück / Abbrechen */}
        {step > 1 ? (
          <button onClick={back} style={{
            flex: 1, padding: "16px",
            background: "rgba(26,26,24,0.06)", border: "none",
            borderRadius: 14, fontSize: 15, fontWeight: 700,
            color: C.inkMid, cursor: "pointer",
            fontFamily: "inherit", touchAction: "manipulation",
          }}>← Zurück</button>
        ) : (
          <button onClick={onClose} style={{
            flex: 1, padding: "16px",
            background: "rgba(26,26,24,0.06)", border: "none",
            borderRadius: 14, fontSize: 15, fontWeight: 700,
            color: C.inkMid, cursor: "pointer",
            fontFamily: "inherit", touchAction: "manipulation",
          }}>Abbrechen</button>
        )}

        {/* Weiter */}
        {!isLast && (
          <button onClick={next} disabled={!canContinue()} style={{
            flex: 2, padding: "16px",
            background: canContinue()
              ? `linear-gradient(135deg, ${C.teal}, ${C.tealD})`
              : "rgba(14,196,184,0.30)",
            border: "none", borderRadius: 14,
            color: "#fff", fontSize: 16, fontWeight: 700,
            cursor: canContinue() ? "pointer" : "not-allowed",
            fontFamily: "inherit", touchAction: "manipulation",
            transition: "background .18s",
          }}>
            Weiter →
          </button>
        )}

        {/* Letzer Schritt: Entwurf + Veröffentlichen */}
        {isLast && (
          <>
            <button onClick={() => save("draft")} disabled={saving} style={{
              flex: 1, padding: "16px",
              background: "rgba(26,26,24,0.06)", border: "none",
              borderRadius: 14, fontSize: 14, fontWeight: 600,
              color: C.inkMid, cursor: saving ? "not-allowed" : "pointer",
              fontFamily: "inherit", touchAction: "manipulation",
            }}>
              {saving ? "…" : "Entwurf"}
            </button>
            <button
              onClick={() => save("pending_review")}
              disabled={saving || !form.title?.trim() || !form.visibility}
              style={{
                flex: 2, padding: "16px",
                background: (saving || !form.title?.trim())
                  ? "rgba(14,196,184,0.30)"
                  : `linear-gradient(135deg, ${C.teal}, ${C.tealD})`,
                border: "none", borderRadius: 14,
                color: "#fff", fontSize: 15, fontWeight: 800,
                cursor: (saving || !form.title?.trim()) ? "not-allowed" : "pointer",
                fontFamily: "inherit", touchAction: "manipulation",
                letterSpacing: 0.2,
              }}
            >
              {saving ? "Wird eingereicht…" : "Zur Prüfung einreichen ✨"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
