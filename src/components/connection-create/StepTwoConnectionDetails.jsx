// connection-create/StepTwoConnectionDetails.jsx
// STEP 2 — "Erzähl davon"
// 5 atmosphärische Sections als Glassmorphism-Cards
// Nutzt alle bestehenden Selektoren und Widgets

import React from "react";
import { MoodSelector, VisibilitySelector, CostSelector, OpennessPicker } from "./Selectors.jsx";
import { ParticipantStepper, LocationPicker, MediaAttachmentBar }          from "./Widgets.jsx";

const C = {
  violet:"#8B5CF6", ink:"#1A1A1A",
  muted:"rgba(80,80,80,0.50)", border:"rgba(0,0,0,0.07)",
};

const CSS = `
  @keyframes s2-in {
    from{ opacity:0; transform:translateY(18px); }
    to  { opacity:1; transform:translateY(0); }
  }
  .s2-input {
    width:100%; border:1.5px solid rgba(0,0,0,0.08);
    border-radius:14px; padding:12px 16px;
    font-size:15px; font-family:inherit; color:#1A1A1A;
    background:rgba(255,255,255,0.72);
    outline:none; transition:border 0.18s, box-shadow 0.18s;
    box-sizing:border-box; -webkit-appearance:none;
  }
  .s2-input:focus {
    border-color:rgba(139,92,246,0.38);
    box-shadow:0 0 0 3.5px rgba(139,92,246,0.10);
    background:rgba(255,255,255,0.90);
  }
  .s2-input::placeholder { color:rgba(80,80,80,0.38); }
  .s2-scroll {
    scrollbar-width:none; -ms-overflow-style:none;
    -webkit-overflow-scrolling:touch;
  }
  .s2-scroll::-webkit-scrollbar { display:none; }
`;

/* ── Section Card ── */
function Section({ icon, title, delay=0, children }) {
  return (
    <div style={{
      background:"rgba(255,255,255,0.76)",
      backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)",
      border:"1px solid rgba(255,255,255,0.72)",
      borderRadius:24,
      boxShadow:"0 6px 28px rgba(0,0,0,0.07), 0 2px 8px rgba(0,0,0,0.03)",
      padding:"24px 22px",
      marginBottom:16,
      animation:`s2-in 0.30s ${delay}s ease both`,
    }}>
      {/* Section Header */}
      <div style={{
        display:"flex", alignItems:"center", gap:10, marginBottom:20,
      }}>
        <div style={{
          width:36, height:36, borderRadius:11,
          background:"linear-gradient(135deg,rgba(139,92,246,0.12),rgba(124,58,237,0.07))",
          border:"1px solid rgba(139,92,246,0.15)",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:17, flexShrink:0,
        }}>{icon}</div>
        <div style={{
          fontSize:16, fontWeight:800, color:C.ink, letterSpacing:-0.3,
        }}>{title}</div>
      </div>
      {children}
    </div>
  );
}

/* ── Char Counter ── */
function CharCount({ cur, max }) {
  const warn = cur > max * 0.85;
  return (
    <div style={{
      textAlign:"right", fontSize:11,
      color: warn ? "#DC2626" : "rgba(80,80,80,0.38)",
      marginTop:5,
    }}>{cur}/{max}</div>
  );
}

/* ── Date + Time Row ── */
function DateTimeRow({ date, time, onDate, onTime }) {
  const today = new Date().toISOString().slice(0,10);
  const todayLabel = new Date().toLocaleDateString("de-DE",
    {weekday:"short", day:"numeric", month:"long", year:"numeric"});

  return (
    <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
      <div style={{ flex:2, minWidth:180, position:"relative" }}>
        <span style={{
          position:"absolute", left:13, top:"50%", transform:"translateY(-50%)",
          fontSize:16, pointerEvents:"none", zIndex:1,
        }}>📅</span>
        <select className="s2-input" style={{ paddingLeft:40, appearance:"none" }}
          value={date || today} onChange={e => onDate(e.target.value)}>
          <option value={today}>Heute, {todayLabel.split(",")[1]?.trim()}</option>
          {[1,2,3,4,5,6,7].map(d => {
            const nd = new Date(Date.now() + d * 86400000);
            const val = nd.toISOString().slice(0,10);
            const lbl = nd.toLocaleDateString("de-DE",{weekday:"short",day:"numeric",month:"long"});
            return <option key={d} value={val}>{lbl}</option>;
          })}
        </select>
        <span style={{
          position:"absolute", right:12, top:"50%", transform:"translateY(-50%)",
          color:C.muted, fontSize:11, pointerEvents:"none",
        }}>▾</span>
      </div>
      <div style={{ flex:1, minWidth:120, position:"relative" }}>
        <span style={{
          position:"absolute", left:13, top:"50%", transform:"translateY(-50%)",
          fontSize:16, pointerEvents:"none", zIndex:1,
        }}>🕐</span>
        <select className="s2-input" style={{ paddingLeft:40, appearance:"none" }}
          value={time || "20:00"} onChange={e => onTime(e.target.value)}>
          {["10:00","12:00","14:00","16:00","18:00","19:00","20:00","21:00","22:00"]
            .map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <span style={{
          position:"absolute", right:12, top:"50%", transform:"translateY(-50%)",
          color:C.muted, fontSize:11, pointerEvents:"none",
        }}>▾</span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════ */
export default function StepTwoConnectionDetails({ data, onChange }) {
  const set = (key, val) => onChange({ ...data, [key]: val });

  return (
    <div className="s2-scroll" style={{
      flex:1, overflowY:"auto", overflowX:"hidden",
      padding:"0 20px 24px",
    }}>
      <style>{CSS}</style>

      {/* ── Headline ── */}
      <div style={{ textAlign:"center", marginBottom:28 }}>
        <div style={{
          fontSize:26, fontWeight:900, color:C.ink,
          letterSpacing:-0.7, marginBottom:8,
        }}>Erz\u00e4hl davon</div>
        <div style={{ fontSize:14, color:C.muted, lineHeight:1.6 }}>
          Lass andere sp\u00fcren, was dich bewegt.
        </div>
      </div>

      {/* ── Section 1: Wann & Wo ── */}
      <Section icon="📍" title="Wann &amp; Wo?" delay={0}>
        <DateTimeRow
          date={data.date} time={data.time}
          onDate={v => set("date", v)} onTime={v => set("time", v)}
        />
        <div style={{ height:12 }}/>
        <LocationPicker value={data.location || ""} onChange={v => set("location", v)}/>
      </Section>

      {/* ── Section 2: Was passiert dort ── */}
      <Section icon="✨" title="Was passiert dort?" delay={0.05}>
        <input
          className="s2-input"
          maxLength={60}
          value={data.title || ""}
          onChange={e => set("title", e.target.value)}
          placeholder="Titel deiner Verbindung \u2014 z.B. Lagerfeuer am Strand \uD83D\uDD25"
          style={{ marginBottom:4 }}
        />
        <CharCount cur={data.title?.length || 0} max={60}/>
        <div style={{ height:10 }}/>
        <textarea
          className="s2-input"
          maxLength={300}
          rows={4}
          value={data.description || ""}
          onChange={e => set("description", e.target.value)}
          placeholder="Beschreibe den Moment \u2014 was f\u00fchlst du, was wird passieren\u2026"
          style={{ resize:"none", minHeight:100, marginBottom:4 }}
        />
        <CharCount cur={data.description?.length || 0} max={300}/>
      </Section>

      {/* ── Section 3: Wer soll kommen ── */}
      <Section icon="👥" title="Wer soll kommen?" delay={0.10}>
        <ParticipantStepper
          value={data.participants || 30}
          onChange={v => set("participants", v)}
        />
        <div style={{ height:16 }}/>
        <div style={{ fontSize:13, fontWeight:700, color:C.muted, marginBottom:10 }}>
          Offenheit
        </div>
        <OpennessPicker value={data.openness || "open"} onChange={v => set("openness", v)}/>
        <div style={{ height:16 }}/>
        <div style={{ fontSize:13, fontWeight:700, color:C.muted, marginBottom:10 }}>
          Sichtbarkeit
        </div>
        <VisibilitySelector value={data.visibility || "public"} onChange={v => set("visibility", v)}/>
      </Section>

      {/* ── Section 4: Energie & Kosten ── */}
      <Section icon="🌿" title="Welche Energie hat der Moment?" delay={0.15}>
        <div style={{ fontSize:13, fontWeight:700, color:C.muted, marginBottom:10 }}>
          Stimmung
        </div>
        <MoodSelector value={data.mood || "gesellig"} onChange={v => set("mood", v)}/>
        <div style={{ height:16 }}/>
        <div style={{ fontSize:13, fontWeight:700, color:C.muted, marginBottom:10 }}>
          Kostenmodell
        </div>
        <CostSelector value={data.cost || "free"} onChange={v => set("cost", v)}/>
        {(data.cost === "fixed" || data.cost === "donation") && (
          <input
            className="s2-input"
            style={{ marginTop:10 }}
            placeholder="Betrag \u2014 z.B. 12 \u20ac"
            value={data.costAmount || ""}
            onChange={e => set("costAmount", e.target.value)}
          />
        )}
        {data.cost === "free" && (
          <div style={{ fontSize:12.5, color:C.muted, marginTop:9 }}>
            Diese Verbindung ist kostenlos und offen f\u00fcr alle.
          </div>
        )}
      </Section>

      {/* ── Section 5: Medien ── */}
      <Section icon="🎨" title="Zus\u00e4tzliche Elemente" delay={0.20}>
        <MediaAttachmentBar onImage={() => {}} onMusic={() => {}} onLink={() => {}}/>
        <div style={{ height:10 }}/>
        <textarea
          className="s2-input"
          maxLength={200}
          rows={2}
          value={data.extras || ""}
          onChange={e => set("extras", e.target.value)}
          placeholder="Besondere Hinweise, Mitbringliste, Notizen\u2026"
          style={{ resize:"none", marginBottom:4 }}
        />
        <CharCount cur={data.extras?.length || 0} max={200}/>
      </Section>
    </div>
  );
}
