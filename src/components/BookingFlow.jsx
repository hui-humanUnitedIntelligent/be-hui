// BookingFlow.jsx — HUI Human Connection Flow
// Kein Checkout. Eine menschliche Verbindung.
import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/AuthContext";
import { useBookingActions, BOOKING_STATUS, REQ_TYPES as BREQ_TYPES, MOODS as BMOODS } from "../lib/bookingContext";
import { useDraftPersist } from "../lib/sessionHooks";

/* ── DESIGN ─────────────────────────────────────────────────────────── */
const C = {
  teal:"#16D7C5", teal2:"#11C5B7", tealPale:"#E6FAF8",
  tealGlow:"rgba(22,215,197,0.22)",
  coral:"#FF8A6B", coral2:"#FF7B72", coralPale:"#FFF2EE",
  coralGlow:"rgba(255,138,107,0.20)",
  gold:"#F5A623", green:"#3DB87A", greenGlow:"rgba(61,184,122,0.20)",
  cream:"#F9F6F2", warm:"#FFF9F4",
  card:"#FFFFFF", ink:"#1A1A1A", ink2:"#3A3A3A",
  muted:"#888", muted2:"#BBB", border:"rgba(0,0,0,0.06)",
  purple:"#A78BFA",
};

const CSS = `
  @keyframes bfFadeUp  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes bfSlideUp { from{opacity:0;transform:translateY(100%)} to{opacity:1;transform:translateY(0)} }
  @keyframes bfPulse   { 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }
  @keyframes bfCheck   { 0%{transform:scale(0) rotate(-10deg);opacity:0} 60%{transform:scale(1.2) rotate(3deg)} 100%{transform:scale(1) rotate(0);opacity:1} }
  @keyframes bfSpinner { to{transform:rotate(360deg)} }
  @keyframes bfGlow    { 0%,100%{box-shadow:0 0 0px rgba(22,215,197,0)} 50%{box-shadow:0 0 22px rgba(22,215,197,0.4)} }
  .bf-scroll::-webkit-scrollbar{display:none}
  .bf-scroll{-ms-overflow-style:none;scrollbar-width:none}
  .bf-tap{transition:transform .18s cubic-bezier(.34,1.4,.64,1);-webkit-tap-highlight-color:transparent}
  .bf-tap:active{transform:scale(.965)}
  .bf-day:hover{background:rgba(22,215,197,0.08)}
`;


  /* ── Inline HUI logo for BookingFlow ── */
function HuiLogoInline({ size=36 }) {
  return (
    <img src="/hui-logo.jpg" alt="HUI"
      style={{ width:size, height:size,
        borderRadius: Math.round(size * 0.27),
        objectFit:"cover", display:"block", flexShrink:0 }}/>
  );
}

/* ── UTILS ──────────────────────────────────────────────────────────── */
const MONTHS = ["Januar","Februar","März","April","Mai","Juni",
                "Juli","August","September","Oktober","November","Dezember"];
const WEEKDAYS = ["Mo","Di","Mi","Do","Fr","Sa","So"];
const SLOTS = ["09:00","10:00","11:00","13:00","14:00","15:00","16:00","17:00"];

function fmtDate(d) {
  if(!d) return "";
  return `${d.getDate()}. ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
function addDays(d, n) {
  const r = new Date(d); r.setDate(r.getDate()+n); return r;
}
function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function daysInMonth(d) {
  return new Date(d.getFullYear(), d.getMonth()+1, 0).getDate();
}

/* ── STEP INDICATOR ─────────────────────────────────────────────────── */
function StepDots({ step, total=5 }) {
  return (
    <div style={{ display:"flex", gap:5, alignItems:"center",
      justifyContent:"center" }}>
      {Array.from({length:total}).map((_,i) => (
        <div key={i} style={{
          width: i===step ? 18 : 6,
          height: 6, borderRadius:999,
          background: i===step ? C.teal : i<step ? `${C.teal}66` : C.muted2,
          transition:"all 0.3s cubic-bezier(.34,1.4,.64,1)",
        }}/>
      ))}
    </div>
  );
}

/* ── BACK BUTTON ────────────────────────────────────────────────────── */
function BackBtn({ onBack, onClose }) {
  return (
    <div style={{ display:"flex", alignItems:"center",
      justifyContent:"space-between", padding:"max(52px,env(safe-area-inset-top,52px)) 20px 16px" }}>
      <button onClick={onBack} className="bf-tap"
        style={{ width:40, height:40, borderRadius:14,
          background:C.card, border:`1px solid ${C.border}`,
          cursor:"pointer", display:"flex", alignItems:"center",
          justifyContent:"center", fontSize:16,
          boxShadow:"0 2px 10px rgba(0,0,0,0.06)" }}>
        ←
      </button>
      <button onClick={onClose} className="bf-tap"
        style={{ background:"none", border:"none", cursor:"pointer",
          fontSize:12, fontWeight:600, color:C.muted,
          padding:"8px 12px" }}>
        Abbrechen
      </button>
    </div>
  );
}

/* ── STEP 0: WIRKER INTRO CARD ──────────────────────────────────────── */
function StepIntro({ wirker, onNext }) {
  const hourlyRate = wirker.hourly_rate || wirker.hourly || 85;
  const totalRate  = Math.round(hourlyRate * 1.0); // customer sees full rate
  const impactNote = Math.round(totalRate * 0.025);

  return (
    <div style={{ padding:"0 20px 40px",
      animation:"bfFadeUp 0.5s both" }}>

      {/* HUI brand header */}
      <div style={{ display:"flex", alignItems:"center", gap:8,
        padding:"max(52px,env(safe-area-inset-top,52px)) 0 18px" }}>
        <HuiLogoInline size={32}/>
        <div>
          <span style={{ fontWeight:900, fontSize:13, letterSpacing:-0.3,
            background:"linear-gradient(135deg,#16D7C5,#11C5B7)",
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>H</span>
          <span style={{ fontWeight:500, fontSize:11, color:"rgba(30,30,30,0.55)" }}>uman </span>
          <span style={{ fontWeight:900, fontSize:13, letterSpacing:-0.3,
            background:"linear-gradient(135deg,#16D7C5,#FF8A6B)",
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>U</span>
          <span style={{ fontWeight:500, fontSize:11, color:"rgba(30,30,30,0.55)" }}>nited </span>
          <span style={{ fontWeight:900, fontSize:13, letterSpacing:-0.3,
            background:"linear-gradient(135deg,#FF8A6B,#16D7C5)",
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>I</span>
          <span style={{ fontWeight:500, fontSize:11, color:"rgba(30,30,30,0.55)" }}>ntelligent</span>
        </div>
      </div>

      {/* Hero portrait */}
      <div style={{ position:"relative", height:260,
        borderRadius:28, overflow:"hidden", marginBottom:28,
        boxShadow:"0 6px 30px rgba(0,0,0,0.13)" }}>
        <img src={wirker.img || wirker.imgUrl}
          alt={wirker.name}
          style={{ width:"100%", height:"100%", objectFit:"cover",
            objectPosition:"top center",
            filter:"brightness(0.78) saturate(1.1)" }}/>
        <div style={{ position:"absolute", inset:0,
          background:`linear-gradient(to bottom,
            ${C.teal}18 0%, transparent 30%,
            rgba(8,8,8,0.75) 100%)` }}/>
        <div style={{ position:"absolute", top:0, left:0, right:0,
          height:2.5,
          background:`linear-gradient(90deg,${C.teal},transparent)` }}/>
        <div style={{ position:"absolute", bottom:0,
          left:0, right:0, padding:"0 22px 20px" }}>
          <div style={{ fontWeight:900, fontSize:24, color:"white",
            letterSpacing:-0.5, lineHeight:1.1 }}>
            {wirker.name}
          </div>
          <div style={{ fontSize:13, color:C.teal,
            fontWeight:700, marginTop:4 }}>
            {wirker.talent || wirker.job || "Kreativschaffende/r"}
          </div>
          <div style={{ fontSize:11.5,
            color:"rgba(255,255,255,0.55)", marginTop:2 }}>
            📍 {wirker.city || wirker.location || "München"}
          </div>
        </div>
      </div>

      {/* Quote */}
      {(wirker.quote || wirker.bio) && (
        <p style={{ fontSize:15, color:C.ink2, fontStyle:"italic",
          lineHeight:1.75, textAlign:"center",
          marginBottom:28, padding:"0 8px",
          animation:"bfFadeUp 0.5s 0.1s both" }}>
          „{wirker.quote || wirker.bio}"
        </p>
      )}

      {/* Recs */}
      {(wirker.recs || wirker.recommendations) > 0 && (
        <div style={{ display:"flex", justifyContent:"center",
          marginBottom:28 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6,
            background:C.tealPale, borderRadius:999,
            padding:"7px 18px" }}>
            <span style={{ fontSize:13, fontWeight:800, color:C.teal }}>
              {wirker.recs || wirker.recommendations}
            </span>
            <span style={{ fontSize:12, color:C.muted }}>Empfehlungen</span>
          </div>
        </div>
      )}

      {/* Price block */}
      <div style={{ background:C.card, borderRadius:24,
        padding:"22px 22px", marginBottom:20,
        border:`1px solid ${C.border}`,
        boxShadow:"0 2px 16px rgba(0,0,0,0.05)",
        animation:"bfFadeUp 0.5s 0.15s both" }}>
        <div style={{ display:"flex", alignItems:"baseline",
          justifyContent:"space-between", marginBottom:10 }}>
          <div>
            <span style={{ fontWeight:900, fontSize:28, color:C.ink }}>
              € {totalRate}
            </span>
            <span style={{ fontSize:13, color:C.muted,
              marginLeft:5 }}>/Stunde</span>
          </div>
          {wirker.available !== false && (
            <div style={{ display:"flex", alignItems:"center", gap:5,
              background:"rgba(61,184,122,0.12)",
              borderRadius:999, padding:"4px 12px" }}>
              <span style={{ width:6, height:6, borderRadius:"50%",
                background:"#3DB87A",
                boxShadow:"0 0 5px rgba(61,184,122,0.6)" }}/>
              <span style={{ fontSize:11, fontWeight:700,
                color:"#3DB87A" }}>Verfügbar</span>
            </div>
          )}
        </div>
        {/* Impact note — subtle */}
        <div style={{ display:"flex", alignItems:"center", gap:7,
          padding:"10px 14px", borderRadius:14,
          background:"rgba(61,184,122,0.07)",
          border:"1px solid rgba(61,184,122,0.14)" }}>
          <span style={{ fontSize:14 }}>🌱</span>
          <span style={{ fontSize:11.5, color:"#3DB87A", lineHeight:1.5 }}>
            <strong>€ {impactNote}</strong> pro Stunde fließen automatisch in Projekte mit Herz.
          </span>
        </div>
      </div>

      {/* CTA */}
      <button onClick={onNext} className="bf-tap"
        style={{ width:"100%", padding:"17px",
          background:`linear-gradient(135deg,${C.teal},${C.teal2})`,
          border:"none", borderRadius:18,
          color:"white", fontSize:15.5, fontWeight:800,
          cursor:"pointer", fontFamily:"inherit",
          boxShadow:`0 5px 22px ${C.tealGlow}`,
          letterSpacing:0.2 }}>
        Zeit auswählen
      </button>

      <p style={{ textAlign:"center", fontSize:11.5, color:C.muted,
        marginTop:14, lineHeight:1.6 }}>
        Keine Verpflichtung. Du sendest erst eine Anfrage.
      </p>
    </div>
  );
}

/* ── STEP 1: CALENDAR ───────────────────────────────────────────────── */
function StepCalendar({ wirker, selected, onSelect, onNext, onBack, onClose }) {
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const first     = startOfMonth(viewMonth);
  const totalDays = daysInMonth(viewMonth);
  // Monday-based offset
  const offset    = (first.getDay() + 6) % 7;

  const isAvailable = (d) => {
    if(d < today) return false;
    const dow = d.getDay(); // 0=Sun
    // Wirker available Mon-Fri + Sat by default, not Sun
    return dow !== 0;
  };
  const isSelected = (d) =>
    selected && d.toDateString() === selected.toDateString();
  const isToday = (d) =>
    d.toDateString() === today.toDateString();

  return (
    <div style={{ padding:"0 20px 40px",
      animation:"bfFadeUp 0.4s both" }}>

      <BackBtn onBack={onBack} onClose={onClose}/>
      <StepDots step={1}/>

      <div style={{ textAlign:"center", padding:"18px 0 24px" }}>
        <div style={{ fontWeight:900, fontSize:22, color:C.ink,
          letterSpacing:-0.5 }}>Wann passt es?</div>
        <div style={{ fontSize:13, color:C.muted, marginTop:4 }}>
          Wähle einen Tag — {wirker.name?.split(" ")[0]} antwortet innerhalb 2h.
        </div>
      </div>

      {/* Month nav */}
      <div style={{ display:"flex", alignItems:"center",
        justifyContent:"space-between", marginBottom:20 }}>
        <button className="bf-tap" onClick={() =>
          setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth()-1, 1))}
          style={{ width:40, height:40, borderRadius:14,
            background:C.card, border:`1px solid ${C.border}`,
            cursor:"pointer", fontSize:16 }}>←</button>
        <span style={{ fontWeight:800, fontSize:15, color:C.ink }}>
          {MONTHS[viewMonth.getMonth()]} {viewMonth.getFullYear()}
        </span>
        <button className="bf-tap" onClick={() =>
          setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth()+1, 1))}
          style={{ width:40, height:40, borderRadius:14,
            background:C.card, border:`1px solid ${C.border}`,
            cursor:"pointer", fontSize:16 }}>→</button>
      </div>

      {/* Weekday headers */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)",
        marginBottom:8 }}>
        {WEEKDAYS.map(d => (
          <div key={d} style={{ textAlign:"center", fontSize:11,
            fontWeight:700, color:C.muted2, padding:"4px 0" }}>{d}</div>
        ))}
      </div>

      {/* Day grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)",
        gap:4, marginBottom:28 }}>
        {Array.from({length:offset}).map((_,i) => (
          <div key={`e${i}`}/>
        ))}
        {Array.from({length:totalDays}).map((_,i) => {
          const d   = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), i+1);
          const avl = isAvailable(d);
          const sel = isSelected(d);
          const tod = isToday(d);
          return (
            <button key={i} className="bf-day bf-tap"
              disabled={!avl}
              onClick={() => avl && onSelect(d)}
              style={{
                aspectRatio:"1", borderRadius:14,
                border:"none", cursor: avl ? "pointer" : "default",
                fontFamily:"inherit", fontSize:13.5,
                fontWeight: sel||tod ? 800 : 500,
                background: sel
                  ? `linear-gradient(135deg,${C.teal},${C.teal2})`
                  : tod ? C.tealPale : "transparent",
                color: sel ? "white"
                  : !avl ? C.muted2
                  : tod ? C.teal : C.ink,
                boxShadow: sel ? `0 3px 12px ${C.tealGlow}` : "none",
                transition:"all 0.18s",
              }}>
              {i+1}
            </button>
          );
        })}
      </div>

      {/* Available indicator */}
      <div style={{ display:"flex", alignItems:"center", gap:8,
        justifyContent:"center", marginBottom:24 }}>
        <div style={{ width:8, height:8, borderRadius:"50%",
          background:C.teal }}/>
        <span style={{ fontSize:11.5, color:C.muted }}>
          Montag–Samstag verfügbar
        </span>
      </div>

      <button onClick={onNext} className="bf-tap"
        disabled={!selected}
        style={{ width:"100%", padding:"17px",
          background: selected
            ? `linear-gradient(135deg,${C.teal},${C.teal2})`
            : C.muted2,
          border:"none", borderRadius:18,
          color:"white", fontSize:15, fontWeight:800,
          cursor: selected ? "pointer" : "default",
          fontFamily:"inherit",
          boxShadow: selected ? `0 5px 22px ${C.tealGlow}` : "none",
          transition:"all 0.3s" }}>
        {selected ? `${fmtDate(selected)} — weiter` : "Tag auswählen"}
      </button>
    </div>
  );
}

/* ── STEP 2: TIME SLOT ──────────────────────────────────────────────── */
function StepTime({ wirker, date, slot, onSlot, onNext, onBack, onClose }) {
  // morning / afternoon groups
  const morning   = SLOTS.filter(s => parseInt(s) < 12);
  const afternoon = SLOTS.filter(s => parseInt(s) >= 12);

  const SlotGroup = ({ label, slots }) => (
    <div style={{ marginBottom:20 }}>
      <div style={{ fontSize:11, fontWeight:700, color:C.muted,
        letterSpacing:1.5, textTransform:"uppercase",
        marginBottom:10 }}>{label}</div>
      <div style={{ display:"grid",
        gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
        {slots.map(s => (
          <button key={s} className="bf-tap"
            onClick={() => onSlot(s)}
            style={{ padding:"13px 0",
              background: slot===s
                ? `linear-gradient(135deg,${C.teal},${C.teal2})`
                : C.card,
              border:`1.5px solid ${slot===s ? "transparent" : C.border}`,
              borderRadius:14, fontFamily:"inherit",
              fontSize:13, fontWeight: slot===s ? 800 : 500,
              color: slot===s ? "white" : C.ink,
              cursor:"pointer",
              boxShadow: slot===s
                ? `0 3px 12px ${C.tealGlow}`
                : "0 2px 8px rgba(0,0,0,0.05)",
              transition:"all 0.2s" }}>
            {s}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ padding:"0 20px 40px",
      animation:"bfFadeUp 0.4s both" }}>

      <BackBtn onBack={onBack} onClose={onClose}/>
      <StepDots step={2}/>

      <div style={{ textAlign:"center", padding:"18px 0 28px" }}>
        <div style={{ fontWeight:900, fontSize:22, color:C.ink,
          letterSpacing:-0.5 }}>Welche Uhrzeit?</div>
        <div style={{ fontSize:13, color:C.muted, marginTop:4 }}>
          {fmtDate(date)}
        </div>
      </div>

      <SlotGroup label="Vormittag" slots={morning}/>
      <SlotGroup label="Nachmittag" slots={afternoon}/>

      {/* Duration */}
      <div style={{ marginBottom:28 }}>
        <div style={{ fontSize:11, fontWeight:700, color:C.muted,
          letterSpacing:1.5, textTransform:"uppercase",
          marginBottom:10 }}>Dauer</div>
        <div style={{ display:"grid",
          gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
          {["1 Stunde","2 Stunden","3 Stunden"].map((d,i) => (
            <div key={i} style={{ padding:"13px 0",
              background:i===0?`linear-gradient(135deg,${C.teal}22,${C.teal2}14)`:C.card,
              border:`1.5px solid ${i===0?C.teal+"55":C.border}`,
              borderRadius:14, textAlign:"center",
              fontSize:12.5, fontWeight:i===0?700:500,
              color:i===0?C.teal:C.muted }}>
              {d}
            </div>
          ))}
        </div>
      </div>

      <button onClick={onNext} className="bf-tap"
        disabled={!slot}
        style={{ width:"100%", padding:"17px",
          background: slot
            ? `linear-gradient(135deg,${C.teal},${C.teal2})`
            : C.muted2,
          border:"none", borderRadius:18,
          color:"white", fontSize:15, fontWeight:800,
          cursor: slot ? "pointer" : "default",
          fontFamily:"inherit",
          boxShadow: slot ? `0 5px 22px ${C.tealGlow}` : "none",
          transition:"all 0.3s" }}>
        {slot ? `${slot} Uhr — weiter` : "Uhrzeit auswählen"}
      </button>
    </div>
  );
}

/* ── STEP 3: MESSAGE + CONFIRM ──────────────────────────────────────── */
function StepMessage({ wirker, date, slot, msg, onMsg, onNext, onBack, onClose }) {
  const hourlyRate = wirker.hourly_rate || wirker.hourly || 85;
  const impactEur  = Math.round(hourlyRate * 0.025);

  return (
    <div style={{ padding:"0 20px 40px",
      animation:"bfFadeUp 0.4s both" }}>

      <BackBtn onBack={onBack} onClose={onClose}/>
      <StepDots step={3}/>

      <div style={{ textAlign:"center", padding:"18px 0 24px" }}>
        <div style={{ fontWeight:900, fontSize:22, color:C.ink,
          letterSpacing:-0.5 }}>Was möchtest du teilen?</div>
        <div style={{ fontSize:13, color:C.muted, marginTop:4 }}>
          Ein paar Worte an {wirker.name?.split(" ")[0]} — optional, aber herzlich willkommen.
        </div>
      </div>

      {/* Booking summary card */}
      <div style={{ background:C.card, borderRadius:22,
        padding:"20px 20px", marginBottom:22,
        border:`1px solid ${C.border}`,
        boxShadow:"0 2px 14px rgba(0,0,0,0.05)" }}>
        <div style={{ display:"flex", alignItems:"center",
          gap:14, marginBottom:16 }}>
          <img src={wirker.img || wirker.imgUrl}
            style={{ width:48, height:48, borderRadius:14,
              objectFit:"cover", objectPosition:"top" }}/>
          <div>
            <div style={{ fontWeight:800, fontSize:15, color:C.ink }}>
              {wirker.name}
            </div>
            <div style={{ fontSize:12, color:C.teal, fontWeight:600 }}>
              {wirker.talent || "Kreativschaffende/r"}
            </div>
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr",
          gap:10 }}>
          {[
            { icon:"📅", label:"Datum", val:fmtDate(date) },
            { icon:"⏰", label:"Uhrzeit", val:`${slot} Uhr` },
            { icon:"⏱", label:"Dauer", val:"1 Stunde" },
            { icon:"💶", label:"Gesamt", val:`€ ${wirker.hourly_rate||wirker.hourly||85}` },
          ].map((r,i) => (
            <div key={i} style={{ background:C.cream,
              borderRadius:14, padding:"12px 14px" }}>
              <div style={{ fontSize:11, color:C.muted,
                marginBottom:3 }}>{r.icon} {r.label}</div>
              <div style={{ fontWeight:700, fontSize:13,
                color:C.ink }}>{r.val}</div>
            </div>
          ))}
        </div>
        {/* Impact note */}
        <div style={{ marginTop:14, padding:"10px 14px",
          borderRadius:14, background:"rgba(61,184,122,0.07)",
          border:"1px solid rgba(61,184,122,0.14)",
          display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:15 }}>🌱</span>
          <span style={{ fontSize:11.5, color:"#3DB87A", lineHeight:1.5 }}>
            € {impactEur} dieser Buchung fließen in ein Herzensprojekt.
          </span>
        </div>
      </div>

      {/* Message field */}
      <textarea
        value={msg} onChange={e => onMsg(e.target.value)}
        placeholder={`Hallo ${wirker.name?.split(" ")[0]}, ich würde gerne…`}
        rows={4}
        style={{ width:"100%", background:C.card,
          border:`1.5px solid ${C.border}`, borderRadius:18,
          padding:"16px 18px", fontSize:14, color:C.ink,
          fontFamily:"inherit", resize:"none", outline:"none",
          boxSizing:"border-box", lineHeight:1.65,
          boxShadow:"0 2px 10px rgba(0,0,0,0.04)",
          transition:"border-color 0.2s" }}
        onFocus={e => e.target.style.borderColor=C.teal}
        onBlur={e => e.target.style.borderColor=C.border}
      />
      <div style={{ fontSize:11.5, color:C.muted, textAlign:"right",
        marginTop:6, marginBottom:24 }}>
        {msg.length}/300
      </div>

      <button onClick={onNext} className="bf-tap"
        style={{ width:"100%", padding:"17px",
          background:`linear-gradient(135deg,${C.teal},${C.teal2})`,
          border:"none", borderRadius:18,
          color:"white", fontSize:15, fontWeight:800,
          cursor:"pointer", fontFamily:"inherit",
          boxShadow:`0 5px 22px ${C.tealGlow}` }}>
        Anfrage senden
      </button>

      <p style={{ textAlign:"center", fontSize:11.5, color:C.muted,
        marginTop:14, lineHeight:1.65 }}>
        Das Geld wird erst nach Abschluss überwiesen.
        Du bist immer auf der sicheren Seite.
      </p>
    </div>
  );
}

/* ── STEP 4: ESCROW CONFIRMATION ────────────────────────────────────── */
function StepEscrow({ wirker, date, slot, onNext, onBack, onClose }) {
  const hourlyRate  = wirker.hourly_rate || wirker.hourly || 85;
  const impactEur   = Math.round(hourlyRate * 0.025);
  const huiEur      = Math.round(hourlyRate * 0.1275);
  const talentEur   = hourlyRate - Math.round(hourlyRate * 0.15);

  return (
    <div style={{ padding:"0 20px 40px",
      animation:"bfFadeUp 0.4s both" }}>

      <BackBtn onBack={onBack} onClose={onClose}/>
      <StepDots step={4}/>

      {/* Escrow visual */}
      <div style={{ textAlign:"center", padding:"18px 0 28px" }}>
        <div style={{ width:72, height:72,
          borderRadius:24, margin:"0 auto 16px",
          background:`linear-gradient(135deg,${C.teal}20,${C.teal2}14)`,
          border:`2px solid ${C.teal}40`,
          display:"flex", alignItems:"center",
          justifyContent:"center", fontSize:32,
          animation:"bfGlow 3s ease-in-out infinite" }}>
          🔒
        </div>
        <div style={{ fontWeight:900, fontSize:22, color:C.ink,
          letterSpacing:-0.5, marginBottom:6 }}>
          Dein Geld ist sicher
        </div>
        <div style={{ fontSize:13.5, color:C.muted,
          lineHeight:1.7, maxWidth:280, margin:"0 auto" }}>
          Es liegt im Treuhänder bis die Zusammenarbeit abgeschlossen ist.
          Erst dann entscheidest du.
        </div>
      </div>

      {/* Flow visualization */}
      <div style={{ background:C.card, borderRadius:24,
        padding:"24px 22px", marginBottom:22,
        border:`1px solid ${C.border}`,
        boxShadow:"0 2px 16px rgba(0,0,0,0.05)" }}>

        {[
          { icon:"💶", label:"Du bezahlst jetzt", val:`€ ${hourlyRate}`, note:"sicher im Treuhänder", color:C.ink },
          { icon:"🌱", label:"Impact-Beitrag", val:`€ ${impactEur}`, note:"direkt für Herzensprojekte", color:"#3DB87A" },
          { icon:"✅", label:"Nach deiner Empfehlung", val:`€ ${talentEur}`, note:`${wirker.name?.split(" ")[0]} bekommt ausgezahlt`, color:C.teal },
        ].map((row, i, arr) => (
          <div key={i}>
            <div style={{ display:"flex", alignItems:"center", gap:14 }}>
              <div style={{ width:40, height:40, borderRadius:14, flexShrink:0,
                background:`${row.color}14`,
                display:"flex", alignItems:"center",
                justifyContent:"center", fontSize:18 }}>
                {row.icon}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, color:C.muted,
                  marginBottom:2 }}>{row.label}</div>
                <div style={{ fontSize:14, fontWeight:800,
                  color:row.color }}>{row.val}</div>
                <div style={{ fontSize:11, color:C.muted2 }}>{row.note}</div>
              </div>
            </div>
            {i < arr.length-1 && (
              <div style={{ margin:"12px 0 12px 19px",
                width:2, height:18, background:`${C.teal}30`,
                borderRadius:999 }}/>
            )}
          </div>
        ))}
      </div>

      {/* Trust note */}
      <div style={{ padding:"14px 18px", borderRadius:18,
        background:C.tealPale,
        border:`1px solid ${C.teal}30`,
        marginBottom:28, textAlign:"center" }}>
        <div style={{ fontSize:12.5, color:C.teal,
          lineHeight:1.65 }}>
          Wenn du nicht zufrieden bist, wird das Geld zurückgebucht.
          <br/>Kein Risiko. Echte Verbindung.
        </div>
      </div>

      <button onClick={onNext} className="bf-tap"
        style={{ width:"100%", padding:"17px",
          background:`linear-gradient(135deg,${C.teal},${C.teal2})`,
          border:"none", borderRadius:18,
          color:"white", fontSize:15, fontWeight:800,
          cursor:"pointer", fontFamily:"inherit",
          boxShadow:`0 5px 22px ${C.tealGlow}` }}>
        Jetzt verbinden — € {hourlyRate}
      </button>

      <p style={{ textAlign:"center", fontSize:11.5, color:C.muted,
        marginTop:14, lineHeight:1.65 }}>
        Keine versteckten Gebühren. Keine Überraschungen.
      </p>
    </div>
  );
}

/* ── STEP 5: SUCCESS + CHAT UNLOCKED ────────────────────────────────── */
function StepSuccess({ wirker, date, slot, onClose, onChat }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    let mounted = true;
    const t = setTimeout(() => { if (mounted) setVisible(true); }, 80);
    return () => { mounted = false; clearTimeout(t); };
  }, []);

  return (
    <div style={{ padding:"40px 20px 40px",
      textAlign:"center",
      animation:"bfFadeUp 0.5s both" }}>

      {/* Checkmark */}
      <div style={{
        width:80, height:80, borderRadius:"50%",
        background:`linear-gradient(135deg,${C.teal},${C.teal2})`,
        margin:"0 auto 24px",
        display:"flex", alignItems:"center",
        justifyContent:"center", fontSize:36,
        boxShadow:`0 6px 28px ${C.tealGlow}`,
        animation:"bfCheck 0.6s 0.1s both" }}>
        ✓
      </div>

      <div style={{ fontWeight:900, fontSize:24, color:C.ink,
        letterSpacing:-0.5, marginBottom:8 }}>
        Verbindung hergestellt
      </div>
      <div style={{ fontSize:14, color:C.muted,
        lineHeight:1.7, maxWidth:280, margin:"0 auto 32px" }}>
        Deine Anfrage ist bei {wirker.name?.split(" ")[0]} angekommen.
        Der Chat ist jetzt geöffnet.
      </div>

      {/* Status timeline */}
      <div style={{ background:C.card, borderRadius:24,
        padding:"22px 20px", marginBottom:28,
        border:`1px solid ${C.border}`,
        boxShadow:"0 2px 14px rgba(0,0,0,0.05)",
        textAlign:"left" }}>

        {[
          { done:true,  label:"Anfrage gesendet",   note:`${fmtDate(date)}, ${slot} Uhr` },
          { done:false, label:"Bestätigung erwartet", note:"meist innerhalb 2h" },
          { done:false, label:"Buchung aktiv",         note:"Chat offen, los gehts" },
          { done:false, label:"Abschluss",             note:"Du entscheidest" },
          { done:false, label:"Empfehlung",            note:"Dein Feedback macht den Unterschied" },
        ].map((s, i, arr) => (
          <div key={i} style={{ display:"flex", gap:14, alignItems:"flex-start" }}>
            <div style={{ display:"flex", flexDirection:"column",
              alignItems:"center", marginTop:2 }}>
              <div style={{ width:22, height:22, borderRadius:"50%", flexShrink:0,
                background: s.done
                  ? `linear-gradient(135deg,${C.teal},${C.teal2})`
                  : C.cream,
                border: s.done ? "none" : `2px solid ${C.muted2}`,
                display:"flex", alignItems:"center",
                justifyContent:"center", fontSize:10,
                fontWeight:900, color: s.done ? "white" : C.muted2 }}>
                {s.done ? "✓" : i+1}
              </div>
              {i < arr.length-1 && (
                <div style={{ width:2, height:24,
                  background: s.done ? C.teal+"66" : C.muted2+"44",
                  margin:"3px 0" }}/>
              )}
            </div>
            <div style={{ paddingBottom:i<arr.length-1 ? 0 : 0, marginBottom:12 }}>
              <div style={{ fontWeight: s.done ? 700 : 500,
                fontSize:13, color: s.done ? C.ink : C.muted,
                lineHeight:1.3 }}>{s.label}</div>
              <div style={{ fontSize:11, color:C.muted2, marginTop:2 }}>
                {s.note}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chat unlock notice */}
      <div style={{ padding:"16px 20px", borderRadius:18,
        background:`linear-gradient(135deg,${C.teal}12,${C.coral}08)`,
        border:`1.5px solid ${C.teal}30`,
        marginBottom:24, display:"flex",
        alignItems:"center", gap:12, textAlign:"left" }}>
        <div style={{ fontSize:24 }}>💬</div>
        <div>
          <div style={{ fontWeight:700, fontSize:13, color:C.ink, marginBottom:2 }}>
            Chat ist freigeschaltet
          </div>
          <div style={{ fontSize:11.5, color:C.muted, lineHeight:1.5 }}>
            Du kannst {wirker.name?.split(" ")[0]} jetzt direkt schreiben.
          </div>
        </div>
      </div>

      <button onClick={onChat} className="bf-tap"
        style={{ width:"100%", padding:"16px",
          background:`linear-gradient(135deg,${C.teal},${C.teal2})`,
          border:"none", borderRadius:18,
          color:"white", fontSize:15, fontWeight:800,
          cursor:"pointer", fontFamily:"inherit",
          boxShadow:`0 5px 22px ${C.tealGlow}`,
          marginBottom:12 }}>
        Chat öffnen
      </button>

      <button onClick={onClose} className="bf-tap"
        style={{ width:"100%", padding:"14px",
          background:"none", border:`1.5px solid ${C.border}`,
          borderRadius:18, color:C.muted,
          fontSize:14, fontWeight:600,
          cursor:"pointer", fontFamily:"inherit" }}>
        Später
      </button>
    </div>
  );
}

/* ── POST-BOOKING: RECOMMENDATION ──────────────────────────────────── */
function StepRecommend({ wirker, onClose }) {
  const [choice, setChoice] = useState(null); // "yes" | "no"
  const [text, setText]     = useState("");
  const [done, setDone]     = useState(false);

  if(done) return (
    <div style={{ padding:"60px 20px", textAlign:"center",
      animation:"bfFadeUp 0.5s both" }}>
      <div style={{ fontSize:48, marginBottom:20,
        animation:"bfPulse 2s ease-in-out infinite" }}>
        {choice==="yes" ? "🌱" : "🤝"}
      </div>
      <div style={{ fontWeight:900, fontSize:22, color:C.ink,
        letterSpacing:-0.5, marginBottom:10 }}>
        {choice==="yes" ? "Danke für deine Empfehlung" : "Danke für dein Feedback"}
      </div>
      <div style={{ fontSize:13.5, color:C.muted, lineHeight:1.7,
        maxWidth:270, margin:"0 auto 32px" }}>
        {choice==="yes"
          ? "Die Zahlung an den Wirker wurde ausgelöst. Deine Empfehlung macht einen echten Unterschied."
          : "Das HUI-Team schaut sich den Fall an. Dein Geld ist sicher."}
      </div>
      <button onClick={onClose} className="bf-tap"
        style={{ width:"100%", padding:"16px",
          background:`linear-gradient(135deg,${C.teal},${C.teal2})`,
          border:"none", borderRadius:18, color:"white",
          fontSize:15, fontWeight:800, cursor:"pointer",
          fontFamily:"inherit", boxShadow:`0 5px 22px ${C.tealGlow}` }}>
        Schließen
      </button>
    </div>
  );

  return (
    <div style={{ padding:"0 20px 40px",
      animation:"bfFadeUp 0.5s both" }}>

      <div style={{ padding:"max(52px,env(safe-area-inset-top,52px)) 0 24px",
        textAlign:"center" }}>
        <div style={{ fontWeight:900, fontSize:22, color:C.ink,
          letterSpacing:-0.5, marginBottom:6 }}>
          Wie war deine Erfahrung?
        </div>
        <div style={{ fontSize:13, color:C.muted, lineHeight:1.65 }}>
          Dein Feedback entscheidet ob die Zahlung freigegeben wird.
        </div>
      </div>

      {/* Wirker card */}
      <div style={{ display:"flex", alignItems:"center", gap:14,
        background:C.card, borderRadius:20,
        padding:"16px 18px", marginBottom:28,
        border:`1px solid ${C.border}`,
        boxShadow:"0 2px 12px rgba(0,0,0,0.05)" }}>
        <img src={wirker.img || wirker.imgUrl}
          style={{ width:52, height:52, borderRadius:14,
            objectFit:"cover", objectPosition:"top" }}/>
        <div>
          <div style={{ fontWeight:800, fontSize:15, color:C.ink }}>
            {wirker.name}
          </div>
          <div style={{ fontSize:12, color:C.teal, fontWeight:600, marginTop:2 }}>
            {wirker.talent}
          </div>
        </div>
      </div>

      {/* Choice buttons */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr",
        gap:12, marginBottom:24 }}>
        <button className="bf-tap" onClick={() => setChoice("yes")}
          style={{ padding:"22px 16px", borderRadius:20,
            background: choice==="yes"
              ? `linear-gradient(135deg,${C.teal}22,${C.teal2}14)`
              : C.card,
            border:`2px solid ${choice==="yes" ? C.teal : C.border}`,
            cursor:"pointer", fontFamily:"inherit",
            transition:"all 0.2s",
            boxShadow: choice==="yes"
              ? `0 4px 16px ${C.tealGlow}` : "0 2px 8px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize:28, marginBottom:8 }}>🤝</div>
          <div style={{ fontWeight:800, fontSize:14,
            color: choice==="yes" ? C.teal : C.ink }}>Empfehlen</div>
          <div style={{ fontSize:11, color:C.muted, marginTop:4, lineHeight:1.4 }}>
            Zahlung freigeben
          </div>
        </button>
        <button className="bf-tap" onClick={() => setChoice("no")}
          style={{ padding:"22px 16px", borderRadius:20,
            background: choice==="no"
              ? `${C.coral}14` : C.card,
            border:`2px solid ${choice==="no" ? C.coral : C.border}`,
            cursor:"pointer", fontFamily:"inherit",
            transition:"all 0.2s",
            boxShadow: choice==="no"
              ? `0 4px 16px ${C.coralGlow}` : "0 2px 8px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize:28, marginBottom:8 }}>💬</div>
          <div style={{ fontWeight:800, fontSize:14,
            color: choice==="no" ? C.coral : C.ink }}>Nicht empfehlen</div>
          <div style={{ fontSize:11, color:C.muted, marginTop:4, lineHeight:1.4 }}>
            Geld zurückhalten
          </div>
        </button>
      </div>

      {/* Optional text */}
      {choice && (
        <div style={{ animation:"bfFadeUp 0.3s both" }}>
          <textarea
            value={text} onChange={e=>setText(e.target.value)}
            placeholder={choice==="yes"
              ? `Was hat dich an ${wirker.name?.split(" ")[0]} begeistert?`
              : "Was hätte besser sein können?"}
            rows={3}
            style={{ width:"100%", background:C.card,
              border:`1.5px solid ${C.border}`, borderRadius:16,
              padding:"14px 16px", fontSize:13.5, color:C.ink,
              fontFamily:"inherit", resize:"none", outline:"none",
              boxSizing:"border-box", lineHeight:1.65, marginBottom:20 }}
            onFocus={e => e.target.style.borderColor=C.teal}
            onBlur={e => e.target.style.borderColor=C.border}
          />
          <button onClick={() => setDone(true)} className="bf-tap"
            style={{ width:"100%", padding:"16px",
              background: choice==="yes"
                ? `linear-gradient(135deg,${C.teal},${C.teal2})`
                : `linear-gradient(135deg,${C.coral},${C.coral2})`,
              border:"none", borderRadius:18, color:"white",
              fontSize:15, fontWeight:800, cursor:"pointer",
              fontFamily:"inherit",
              boxShadow: choice==="yes"
                ? `0 5px 22px ${C.tealGlow}`
                : `0 5px 22px ${C.coralGlow}` }}>
            {choice==="yes" ? "Empfehlung abgeben ✓" : "Feedback senden"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   MAIN BOOKING FLOW
════════════════════════════════════════════════════════════════════ */
export default function BookingFlow({ wirker, onClose, onAddToCart, onSuccess }) {
  const { user } = useAuth();
  const { sendBookingRequest, loading: bookingLoading } = useBookingActions();

  // Draft Persistence — Buchungsanfragen überleben Overlay-Close
  const [draft, setDraft, clearDraft] = useDraftPersist(
    `booking-${wirker?.id || wirker?.user_id || "draft"}`,
    { reqType: null, mood: null, date: null, timeSlot: null,
      location: "", budget: "", guests: 1, direction: "", msg: "" }
  );

  const [step,      setStep]    = useState(0);
  const [date,      setDate]    = useState(draft.date ? new Date(draft.date) : null);
  const [slot,      setSlot]    = useState(draft.timeSlot || null);
  const [msg,       setMsg]     = useState(draft.msg || "");
  const [reqType,   setReqType] = useState(draft.reqType || null);
  const [mood,      setMood]    = useState(draft.mood || null);
  const [location,  setLocation]  = useState(draft.location || "");
  const [budget,    setBudget]    = useState(draft.budget || "");
  const [guests,    setGuests]    = useState(draft.guests || 1);
  const [direction, setDirection] = useState(draft.direction || "");
  const [loading,   setLoading]  = useState(false);
  const scrollRef = useRef(null);

  // Auto-save draft
  useEffect(() => {
    setDraft({ reqType, mood,
      date: date?.toISOString() || null, timeSlot: slot,
      location, budget, guests, direction, msg });
  }, [reqType, mood, date, slot, location, budget, guests, direction, msg]);

  // Smooth scroll to top on step change
  useEffect(() => {
    scrollRef.current?.scrollTo({ top:0, behavior:"smooth" });
  }, [step]);

  const handleSendRequest = async () => {
    setLoading(true);
    const rate = wirker.hourly_rate || wirker.hourly || 85;
    const creatorId = wirker.id || wirker.user_id;
    const { error } = await sendBookingRequest({
      creatorId,
      creatorName:  wirker.name || wirker.display_name,
      reqType:      reqType   || "other",
      mood,
      date:         date?.toISOString().split("T")[0] || null,
      timeSlot:     slot,
      location,
      budget,
      guests,
      direction,
      message:      msg,
      amountEur:    rate,
      impactEur:    Math.round(rate * 0.025),
    });
    if (!error) {
      clearDraft(); // Draft nach erfolgreichem Senden löschen
    }
    setLoading(false);
    setStep(4);
  };

  const handleEscrowConfirm = async () => {
    setLoading(true);
    // Booking wird nach Bestätigung auf "scheduled" gesetzt
    // Der Creator bekommt eine Notification
    try {
      if (user?.id) {
        await supabase.from("bookings")
          .update({ status: "scheduled", scheduled_at: new Date().toISOString() })
          .eq("requester_id", user.id)
          .eq("creator_id",   wirker.id || wirker.user_id)
          .in("status", ["accepted","requested"]);
      }
    } catch(e) { /* continue */ }
    setLoading(false);
    setStep(5);
  };

  return (
    <>
      <style>{CSS}</style>
      <div ref={scrollRef}
        className="bf-scroll"
        style={{ position:"fixed", inset:0,
          zIndex:300, background:C.warm,
          overflowY:"auto", WebkitOverflowScrolling:"touch" }}>

        {/* Loading overlay */}
        {loading && (
          <div style={{ position:"fixed", inset:0, zIndex:400,
            background:"rgba(249,246,242,0.88)",
            backdropFilter:"blur(8px)",
            display:"flex", flexDirection:"column",
            alignItems:"center", justifyContent:"center", gap:16 }}>
            <div style={{ width:36, height:36,
              borderRadius:"50%",
              border:`3px solid ${C.teal}30`,
              borderTop:`3px solid ${C.teal}`,
              animation:"bfSpinner 0.8s linear infinite" }}/>
            <div style={{ fontSize:13, color:C.muted }}>
              Verbindung wird hergestellt…
            </div>
          </div>
        )}

        {step === 0 && (
          <>
            {/* Close only — no back on first step */}
            <div style={{ display:"flex", justifyContent:"flex-end",
              padding:"max(52px,env(safe-area-inset-top,52px)) 20px 0" }}>
              <button onClick={onClose} className="bf-tap"
                style={{ background:"none", border:"none",
                  cursor:"pointer", fontSize:12,
                  fontWeight:600, color:C.muted, padding:"8px 12px" }}>
                Schließen
              </button>
            </div>
            <StepIntro wirker={wirker} onNext={() => setStep(1)}/>
          </>
        )}

        {step === 1 && (
          <StepCalendar
            wirker={wirker} selected={date}
            onSelect={setDate}
            onNext={() => setStep(2)}
            onBack={() => setStep(0)}
            onClose={onClose}
          />
        )}

        {step === 2 && (
          <StepTime
            wirker={wirker} date={date} slot={slot}
            onSlot={setSlot}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
            onClose={onClose}
          />
        )}

        {step === 3 && (
          <StepMessage
            wirker={wirker} date={date} slot={slot}
            msg={msg} onMsg={setMsg}
            onNext={handleSendRequest}
            onBack={() => setStep(2)}
            onClose={onClose}
          />
        )}

        {step === 4 && (
          <>
            <BackBtn onBack={() => setStep(3)} onClose={onClose}/>
            <StepEscrow
              wirker={wirker} date={date} slot={slot}
              onNext={handleEscrowConfirm}
              onBack={() => setStep(3)}
              onClose={onClose}
            />
          </>
        )}

        {step === 5 && (
          <StepSuccess
            wirker={wirker} date={date} slot={slot}
            onClose={onSuccess || onClose}
            onChat={() => { onSuccess?.(); }}
          />
        )}

        {step === 6 && (
          <StepRecommend
            wirker={wirker}
            onClose={onSuccess || onClose}
          />
        )}
      </div>
    </>
  );
}
