// ImpactPage.jsx — HUI Impact System v3
// Community Pool · Stimmen · Monatliche Ausschüttung · Keine NGO-Energie

import React, { useState, useEffect, useRef } from "react";
import { supabase }      from "../lib/supabaseClient";
import SupportSheet      from "../components/SupportSheet";

/* ── Brand ──────────────────────────────────── */
const C = {
  teal:"#16D7C5", teal2:"#11C5B7", tealGlow:"rgba(22,215,197,0.22)",
  coral:"#FF8A6B", coralGlow:"rgba(255,138,107,0.22)",
  gold:"#F5A623", goldGlow:"rgba(245,166,35,0.22)",
  green:"#3DB87A", greenGlow:"rgba(61,184,122,0.20)",
  violet:"#9B72CF",
  cream:"#F9F6F2", card:"#FFFFFF",
  ink:"#1A1A1A", ink2:"#3A3A3A",
  muted:"#888", muted2:"#BBBBBB",
  border:"rgba(0,0,0,0.06)",
};

/* ── Status config ──────────────────────────── */
const STATUS = {
  growing:  { emoji:"🌱", label:"Wächst",         color:"#3DB87A" },
  voting:   { emoji:"🗳",  label:"Abstimmung",      color:"#16D7C5" },
  active:   { emoji:"✨", label:"Wird unterstützt", color:"#F5A623" },
  featured: { emoji:"🏆", label:"Monatsprojekt",   color:"#FF8A6B" },
  funded:   { emoji:"✅", label:"Finanziert",       color:"#9B72CF" },
  done:     { emoji:"🚀", label:"Umgesetzt",        color:"#3DB87A" },
};

/* ── Fallback projects ──────────────────────── */
const PROJECTS = [
  {
    id:1,
    title:"Repair Café Netzwerk",
    short:"Gemeinsam reparieren statt wegwerfen.",
    story:`In 14 Städten treffen sich Menschen jeden Alters, um gemeinsam zu reparieren. Ein alter Plattenspieler, eine Nähmaschine, ein Kinderfahrrad.

Was hier entsteht, ist mehr als Reparatur. Es entstehen Gespräche, Freundschaften, Fähigkeiten. Und ein Bewusstsein, dass Dinge einen Wert haben — wenn man sich um sie kümmert.`,
    location:"Deutschland",
    category:"Gemeinschaft",
    categoryColor:"#3DB87A",
    img:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=90",
    img2:"https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=900&q=90",
    raised:48650, goal:80000, votes:0, status:"voting",
    supporters:1248,
    goals:[
      {label:"20 Repair Cafés eröffnet",  done:true,  progress:"14/20"},
      {label:"5.000 Reparaturen",          done:true,  progress:"3.840/5.000"},
      {label:"Werkzeug-Sharing aufgebaut", done:true,  progress:"✓"},
    ],
  },
  {
    id:2,
    title:"Musikräume für junge Künstler",
    short:"Kreativität braucht Raum.",
    story:`In vielen Städten fehlt jungen Musikerinnen und Musikern einfach der Platz. Kein Proberaum, kein Equipment, keine Bühne.

Gemeinsam schaffen wir Orte, an denen Musik entsteht. Offene Studios. Kostenlose Kurse. Erste Auftritte. Weil jedes Talent einen Raum verdient, um sich zu entfalten.`,
    location:"Österreich & Deutschland",
    category:"Musik & Kreativität",
    categoryColor:"#16D7C5",
    img:"https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=900&q=90",
    img2:"https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=900&q=90",
    raised:36200, goal:80000, votes:0, status:"voting",
    supporters:876,
    goals:[
      {label:"8 Studios eröffnet",        done:true,  progress:"5/8"},
      {label:"200 Kurse angeboten",       done:false, progress:"140/200"},
      {label:"Erste Konzerte ermöglicht", done:false, progress:"28 Konzerte"},
    ],
  },
  {
    id:3,
    title:"Gemeinschaftsgärten als Begegnungsorte",
    short:"Wo Erde wächst, wächst Gemeinschaft.",
    story:`Berlin, Frankfurt, Hamburg. Zwischen Asphalt und Hochhäusern entstehen Orte, die wachsen.

Menschen verschiedenster Herkunft kommen zusammen, pflanzen gemeinsam, tauschen Rezepte aus, erzählen Geschichten. Was als Garten beginnt, wird zur Gemeinschaft.`,
    location:"Deutschland",
    category:"Gemeinschaft",
    categoryColor:"#F5A623",
    img:"https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=900&q=90",
    img2:"https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=900&q=90",
    raised:12800, goal:40000, votes:0, status:"growing",
    supporters:412,
    goals:[
      {label:"12 Gärten angelegt",  done:false, progress:"8/12"},
      {label:"1.000 Teilnehmer",    done:false, progress:"680/1.000"},
    ],
  },
];

const BEWIRKT = [
  {
    title:"12 Workshops ermöglicht",
    location:"München & Umgebung", month:"April 2026",
    awarded:14800,
    img:"https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600&q=85",
    highlight:"Über 300 Menschen haben gemeinsam gelernt, erschaffen und sich kennengelernt.",
    status:"done",
  },
  {
    title:"Repair Café Gründung",
    location:"Hamburg, Berlin, Wien", month:"März 2026",
    awarded:9600,
    img:"https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&q=85",
    highlight:"3 neue Orte, an denen Gemeinschaft entsteht — eine Reparatur nach der anderen.",
    status:"done",
  },
  {
    title:"Musikprojekt für Jugendliche",
    location:"Wien", month:"Februar 2026",
    awarded:18200,
    img:"https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&q=85",
    highlight:"28 junge Künstler haben ihre ersten Konzerte gespielt.",
    status:"done",
  },
];

/* ── Helpers ────────────────────────────────── */
function fmt(n) {
  return (n||0).toLocaleString("de-DE", {minimumFractionDigits:0});
}
function pct(raised, goal) {
  return Math.min(100, Math.round((raised / Math.max(goal,1)) * 100));
}
function getStatus(s) {
  return STATUS[s] || STATUS.growing;
}

/* ── Global CSS ─────────────────────────────── */
const CSS = `
  @keyframes fadeUp {
    from { opacity:0; transform:translateY(18px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes spin {
    from { transform:rotate(0deg); }
    to   { transform:rotate(360deg); }
  }
  @keyframes breathe {
    0%,100% { transform:scale(1);   opacity:1; }
    50%      { transform:scale(1.2); opacity:0.7; }
  }
  @keyframes float {
    0%,100% { transform:translateY(0px); }
    50%      { transform:translateY(-6px); }
  }
  @keyframes pulse-ring {
    0%   { transform:scale(1);   opacity:0.5; }
    100% { transform:scale(1.8); opacity:0; }
  }
  @keyframes shimmer {
    0%   { background-position:200% 0; }
    100% { background-position:-200% 0; }
  }
  .ip-tap { -webkit-tap-highlight-color:transparent; cursor:pointer; }
  .ip-scroll::-webkit-scrollbar { display:none; }
  .ip-scroll { -ms-overflow-style:none; scrollbar-width:none; }
`;

/* ════════════════════════════════════════════
   STIMMEN BADGE — zeigt verbleibende Stimmen
════════════════════════════════════════════ */
function StimmenBadge({ votesLeft, totalVotes }) {
  return (
    <div style={{
      display:"inline-flex", alignItems:"center", gap:8,
      background:"rgba(255,255,255,0.85)",
      backdropFilter:"blur(12px)",
      border:`1.5px solid ${C.teal}33`,
      borderRadius:999, padding:"8px 16px",
      boxShadow:"0 2px 16px rgba(22,215,197,0.12)",
    }}>
      <div style={{ display:"flex", gap:4 }}>
        {Array.from({length:totalVotes}).map((_,i) => (
          <div key={i} style={{
            width:10, height:10, borderRadius:"50%",
            background: i < votesLeft
              ? `radial-gradient(circle at 35% 35%,${C.teal},${C.teal2})`
              : "rgba(0,0,0,0.10)",
            boxShadow: i < votesLeft ? `0 0 6px ${C.tealGlow}` : "none",
            transition:"all .3s",
          }}/>
        ))}
      </div>
      <span style={{ fontSize:12, fontWeight:700, color:C.ink2 }}>
        {votesLeft === 0
          ? "Stimme abgegeben ✓"
          : `${votesLeft} Stimme${votesLeft > 1 ? "n" : ""} verfügbar`}
      </span>
    </div>
  );
}

/* ════════════════════════════════════════════
   PROJECT STORY — full detail view
════════════════════════════════════════════ */
function ProjectStory({ p, onBack, onVote, votesLeft, onSupport }) {
  const [voted, setVoted]       = useState(false);
  const [showConfirm, setConfirm] = useState(false);
  const st = getStatus(p.status);
  const progress = pct(p.raised, p.goal);
  const canVote  = votesLeft > 0 && !voted && p.status === "voting";

  function doVote() {
    if (!canVote) return;
    setVoted(true);
    setConfirm(true);
    onVote(p.id);
    setTimeout(() => setConfirm(false), 3000);
  }

  return (
    <div style={{ background:C.cream, minHeight:"100vh", paddingBottom:120 }}>
      <style>{CSS}</style>

      {/* Cinematic hero */}
      <div style={{ position:"relative", height:"52vh", minHeight:320, overflow:"hidden" }}>
        <img src={p.img} alt={p.title}
          style={{ position:"absolute", inset:0, width:"100%", height:"100%",
            objectFit:"cover", filter:"brightness(0.62) saturate(1.15)" }}/>
        <div style={{ position:"absolute", inset:0,
          background:`linear-gradient(to bottom,
            rgba(22,215,197,0.18) 0%, transparent 35%,
            rgba(10,5,0,0.82) 100%)` }}/>

        {/* Back */}
        <button onClick={onBack}
          style={{ position:"absolute",
            top:"max(52px,env(safe-area-inset-top,52px))", left:20,
            width:40, height:40, borderRadius:"50%",
            background:"rgba(255,255,255,0.18)", backdropFilter:"blur(10px)",
            border:"1px solid rgba(255,255,255,0.3)",
            color:"white", fontSize:18, cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center",
            WebkitTapHighlightColor:"transparent" }}>
          ←
        </button>

        {/* Status badge */}
        <div style={{ position:"absolute",
          top:"max(52px,env(safe-area-inset-top,52px))", right:20 }}>
          <div style={{ background:`${st.color}33`, backdropFilter:"blur(8px)",
            border:`1px solid ${st.color}55`, borderRadius:999,
            padding:"5px 13px", display:"flex", alignItems:"center", gap:5 }}>
            <span style={{ fontSize:11 }}>{st.emoji}</span>
            <span style={{ fontSize:11, fontWeight:700, color:st.color }}>{st.label}</span>
          </div>
        </div>

        <div style={{ position:"absolute", bottom:0, left:0, right:0,
          padding:"0 24px 28px" }}>
          <div style={{ fontWeight:900, fontSize:26, color:"white",
            letterSpacing:-0.5, lineHeight:1.2, marginBottom:6 }}>
            {p.title}
          </div>
          <div style={{ fontSize:13, color:"rgba(255,255,255,0.72)" }}>
            📍 {p.location}
          </div>
        </div>
      </div>

      {/* Story */}
      <div style={{ padding:"28px 24px 0" }}>
        <div style={{ fontSize:15, color:C.ink2, lineHeight:1.8,
          whiteSpace:"pre-line", marginBottom:28 }}>
          {p.story}
        </div>

        {/* Progress */}
        <div style={{ background:C.card, borderRadius:22,
          padding:"20px 20px", marginBottom:20,
          boxShadow:"0 2px 18px rgba(0,0,0,0.07)" }}>
          <div style={{ display:"flex", justifyContent:"space-between",
            alignItems:"flex-end", marginBottom:12 }}>
            <div>
              <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginBottom:2 }}>
                Bisher bewegt
              </div>
              <div style={{ fontWeight:900, fontSize:26, color:C.ink, letterSpacing:-0.5 }}>
                € {fmt(p.raised)}
              </div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginBottom:2 }}>
                Ziel
              </div>
              <div style={{ fontWeight:700, fontSize:16, color:C.muted }}>
                € {fmt(p.goal)}
              </div>
            </div>
          </div>
          <div style={{ height:7, borderRadius:999,
            background:"rgba(0,0,0,0.06)", overflow:"hidden" }}>
            <div style={{ height:"100%", borderRadius:999,
              width:`${progress}%`,
              background:`linear-gradient(90deg,${C.teal},${C.teal2})`,
              boxShadow:`0 0 8px ${C.tealGlow}`,
              transition:"width 1.2s cubic-bezier(0.4,0,0.2,1)" }}/>
          </div>
          <div style={{ fontSize:12, color:C.teal, fontWeight:700, marginTop:8 }}>
            {progress}% des Ziels erreicht · {fmt(p.supporters)} Menschen dabei
          </div>
        </div>

        {/* Goals */}
        {p.goals?.length > 0 && (
          <div style={{ marginBottom:20 }}>
            <div style={{ fontWeight:800, fontSize:12, color:C.muted,
              letterSpacing:1.2, textTransform:"uppercase", marginBottom:12 }}>
              Meilensteine
            </div>
            {p.goals.map((g,i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:12,
                padding:"10px 0",
                borderBottom: i < p.goals.length-1 ? `1px solid ${C.border}` : "none" }}>
                <div style={{ width:22, height:22, borderRadius:"50%", flexShrink:0,
                  background: g.done ? C.teal : "rgba(0,0,0,0.06)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:11, color:"white", fontWeight:800 }}>
                  {g.done ? "✓" : "·"}
                </div>
                <div style={{ flex:1, fontSize:14, color: g.done ? C.ink : C.muted }}>
                  {g.label}
                </div>
                <div style={{ fontSize:12, color:C.teal, fontWeight:700 }}>
                  {g.progress}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Direct support button — shown for all projects */}
        {p.status !== "voting" && (
          <button
            onClick={() => onSupport?.(p)}
            style={{ width:"100%", padding:"14px",
              background:`linear-gradient(135deg,${C.coral},${C.gold})`,
              border:"none", borderRadius:16,
              fontSize:14, fontWeight:800, color:"white",
              cursor:"pointer", fontFamily:"inherit", marginBottom:20,
              boxShadow:`0 4px 18px ${C.coralGlow}`,
              WebkitTapHighlightColor:"transparent" }}>
            🤍 Dieses Projekt direkt unterstützen
          </button>
        )}

        {/* Second image */}
        {p.img2 && (
          <div style={{ borderRadius:20, overflow:"hidden",
            height:200, marginBottom:20 }}>
            <img src={p.img2} alt="" style={{ width:"100%", height:"100%",
              objectFit:"cover", filter:"brightness(0.85) saturate(1.1)" }}/>
          </div>
        )}
      </div>

      {/* Sticky vote bar */}
      {p.status === "voting" && (
        <div style={{ position:"fixed", bottom:0, left:0, right:0,
          padding:"16px 20px max(28px,env(safe-area-inset-bottom,28px))",
          background:"rgba(249,246,242,0.95)",
          backdropFilter:"blur(20px)",
          borderTop:`1px solid ${C.border}` }}>

          {showConfirm ? (
            <div style={{ textAlign:"center", padding:"12px 0",
              animation:"fadeUp .3s ease both" }}>
              <div style={{ fontSize:24, marginBottom:4 }}>🌱</div>
              <div style={{ fontWeight:800, fontSize:15, color:C.teal }}>
                Deine Stimme bewegt etwas.
              </div>
              <div style={{ fontSize:13, color:C.muted, marginTop:2 }}>
                Die Community entscheidet gemeinsam.
              </div>
            </div>
          ) : (
            <>
              <button onClick={doVote}
                disabled={!canVote}
                style={{ width:"100%", padding:"15px",
                  background: voted
                    ? `linear-gradient(135deg,${C.green},#2DA86A)`
                    : canVote
                      ? `linear-gradient(135deg,${C.teal},${C.coral})`
                      : "rgba(0,0,0,0.08)",
                  border:"none", borderRadius:16,
                  color: canVote || voted ? "white" : C.muted,
                  fontSize:15, fontWeight:800, cursor: canVote ? "pointer" : "default",
                  fontFamily:"inherit",
                  boxShadow: canVote ? `0 4px 20px ${C.tealGlow}` : "none",
                  transition:"all .3s",
                  WebkitTapHighlightColor:"transparent" }}>
                {voted ? "✓ Stimme abgegeben" :
                 canVote ? "🌱 Für dieses Projekt stimmen" :
                 votesLeft === 0 ? "Stimme bereits abgegeben" : "Abstimmung beendet"}
              </button>
              {canVote && (
                <div style={{ textAlign:"center", fontSize:11, color:C.muted,
                  marginTop:8 }}>
                  Deine Stimme zählt bis Ende des Monats
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════
   PROJECT CARD
════════════════════════════════════════════ */
function ProjectCard({ p, idx, onOpen, votesLeft, onVote, onSupport }) {
  const [localVoted, setLocalVoted] = useState(false);
  const progress = pct(p.raised, p.goal);
  const st       = getStatus(p.status);
  const canVote  = votesLeft > 0 && !localVoted && p.status === "voting";
  const isFeatured = p.status === "featured";

  function handleVote(e) {
    e.stopPropagation();
    if (!canVote) return;
    setLocalVoted(true);
    onVote(p.id);
  }

  return (
    <div className="ip-tap" onClick={onOpen}
      style={{ borderRadius:28, overflow:"hidden",
        background:C.card,
        border: isFeatured ? `2px solid ${C.coral}44` : "none",
        boxShadow: isFeatured
          ? `0 6px 32px ${C.coralGlow}, 0 2px 12px rgba(0,0,0,0.08)`
          : "0 4px 28px rgba(0,0,0,0.09)",
        animation:`fadeUp 0.5s ${idx*0.08}s both` }}>

      {/* Hero image */}
      <div style={{ position:"relative", height:240, overflow:"hidden" }}>
        <img src={p.img} alt={p.title}
          style={{ width:"100%", height:"100%", objectFit:"cover",
            filter:"brightness(0.70) saturate(1.1)" }}/>
        <div style={{ position:"absolute", inset:0,
          background:`linear-gradient(to bottom,
            rgba(0,0,0,0) 25%, rgba(10,5,0,0.78) 100%)` }}/>

        {/* Featured crown */}
        {isFeatured && (
          <div style={{ position:"absolute", top:14, left:14,
            background:`linear-gradient(135deg,${C.coral},${C.gold})`,
            borderRadius:999, padding:"4px 12px",
            fontSize:11, fontWeight:800, color:"white",
            boxShadow:`0 3px 12px ${C.coralGlow}` }}>
            🏆 Monatsprojekt
          </div>
        )}

        {/* Status badge */}
        {!isFeatured && (
          <div style={{ position:"absolute", top:14, left:14 }}>
            <div style={{ background:`${st.color}33`, backdropFilter:"blur(8px)",
              border:`1px solid ${st.color}55`, borderRadius:999,
              padding:"4px 11px", display:"flex", alignItems:"center", gap:4 }}>
              <span style={{ fontSize:10 }}>{st.emoji}</span>
              <span style={{ fontSize:10, fontWeight:700, color:st.color }}>{st.label}</span>
            </div>
          </div>
        )}

        {/* Supporters */}
        <div style={{ position:"absolute", bottom:14, left:16 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <div style={{ display:"flex" }}>
              {[
                "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&q=80",
                "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&q=80",
                "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=60&q=80",
              ].map((src,i) => (
                <img key={i} src={src} alt=""
                  style={{ width:20, height:20, borderRadius:"50%",
                    objectFit:"cover",
                    border:"2px solid rgba(255,255,255,0.7)",
                    marginLeft: i>0 ? -6 : 0 }}/>
              ))}
            </div>
            <span style={{ fontSize:11, color:"rgba(255,255,255,0.85)", fontWeight:600 }}>
              {fmt(p.supporters || 0)} dabei
            </span>
          </div>
        </div>

        {/* Vote count badge */}
        {p.status === "voting" && p.votes > 0 && (
          <div style={{ position:"absolute", bottom:14, right:14,
            background:"rgba(22,215,197,0.22)", backdropFilter:"blur(8px)",
            border:"1px solid rgba(22,215,197,0.4)",
            borderRadius:999, padding:"3px 10px",
            fontSize:11, fontWeight:700, color:C.teal }}>
            {p.votes} Stimmen
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding:"18px 18px 0" }}>
        <div style={{ fontWeight:900, fontSize:17, color:C.ink,
          letterSpacing:-0.3, lineHeight:1.25, marginBottom:5 }}>
          {p.title}
        </div>
        <div style={{ fontSize:13, color:C.muted, fontStyle:"italic",
          lineHeight:1.5, marginBottom:14 }}>
          {p.short}
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom:14 }}>
          <div style={{ display:"flex", justifyContent:"space-between",
            alignItems:"center", marginBottom:6 }}>
            <span style={{ fontSize:13, fontWeight:800, color:C.ink }}>
              € {fmt(p.raised)}
            </span>
            <span style={{ fontSize:11, color:C.muted }}>
              von € {fmt(p.goal)} · {progress}%
            </span>
          </div>
          <div style={{ height:5, borderRadius:999,
            background:"rgba(0,0,0,0.06)", overflow:"hidden" }}>
            <div style={{ height:"100%", borderRadius:999,
              width:`${progress}%`,
              background:`linear-gradient(90deg,${C.teal},${C.teal2})`,
              boxShadow:`0 0 6px ${C.tealGlow}` }}/>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ padding:"0 18px 18px", display:"flex", gap:8 }}>
        {p.status === "voting" ? (
          <button onClick={handleVote}
            style={{ flex:1, padding:"11px",
              background:(localVoted)
                ? `linear-gradient(135deg,${C.green},#2DA86A)`
                : canVote
                  ? `linear-gradient(135deg,${C.teal},${C.teal2})`
                  : "rgba(0,0,0,0.06)",
              border:"none", borderRadius:12,
              fontSize:13, fontWeight:800,
              color: localVoted || canVote ? "white" : C.muted,
              cursor: canVote ? "pointer" : "default",
              fontFamily:"inherit",
              boxShadow: canVote ? `0 3px 12px ${C.tealGlow}` : "none",
              transition:"all .3s",
              WebkitTapHighlightColor:"transparent" }}>
            {localVoted ? "✓ Stimme abgegeben"
             : canVote ? "🌱 Stimme geben"
             : "Geschichte lesen →"}
          </button>
        ) : (
          <button onClick={e=>{e.stopPropagation();onOpen();}}
            style={{ flex:1, padding:"11px",
              background:`linear-gradient(135deg,${C.teal},${C.teal2})`,
              border:"none", borderRadius:12,
              fontSize:13, fontWeight:800, color:"white",
              cursor:"pointer", fontFamily:"inherit",
              boxShadow:`0 3px 12px ${C.tealGlow}`,
              WebkitTapHighlightColor:"transparent" }}>
            Geschichte lesen →
          </button>
        )}
        {/* Support heart button */}
        <button className="ss-tap"
          onClick={e=>{e.stopPropagation();onSupport?.();}}
          style={{ width:44, height:44, borderRadius:12, flexShrink:0,
            background:`linear-gradient(135deg,${C.coral}18,${C.coral}0A)`,
            border:`1.5px solid ${C.coral}44`,
            cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:18,
            WebkitTapHighlightColor:"transparent" }}>
          🤍
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   AUSSCHÜTTUNGS ERKLÄRUNG — wie es funktioniert
════════════════════════════════════════════ */
function HowItWorks() {
  const steps = [
    { icon:"🌱", title:"Jede Buchung wirkt", text:"Ein Teil jeder Transaktion fließt automatisch in den Community Impact Pool." },
    { icon:"🗳",  title:"Die Community entscheidet", text:"Talente und Mitglieder stimmen monatlich ab, welches Projekt zuerst gefördert wird." },
    { icon:"✨", title:"Projekte wachsen gemeinsam", text:"Das Gewinnerprojekt erhält seinen vollen Wunschbetrag. Der Rest verteilt sich auf alle anderen." },
    { icon:"🚀", title:"Wirkung bleibt sichtbar", text:"Abgeschlossene Projekte bleiben als Inspiration erhalten — damit alle sehen: Es bewegt sich wirklich etwas." },
  ];

  return (
    <div style={{ margin:"0 20px 28px",
      background:C.card, borderRadius:24,
      padding:"22px 20px",
      boxShadow:"0 2px 18px rgba(0,0,0,0.06)" }}>
      <div style={{ fontWeight:800, fontSize:13, color:C.teal,
        letterSpacing:1.2, textTransform:"uppercase", marginBottom:18 }}>
        Wie es funktioniert
      </div>
      {steps.map((s,i) => (
        <div key={i} style={{ display:"flex", gap:14, alignItems:"flex-start",
          marginBottom: i < steps.length-1 ? 16 : 0 }}>
          <div style={{ width:36, height:36, borderRadius:12, flexShrink:0,
            background:`linear-gradient(135deg,${C.teal}18,${C.coral}10)`,
            border:`1px solid ${C.teal}22`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:16 }}>
            {s.icon}
          </div>
          <div style={{ flex:1, paddingTop:2 }}>
            <div style={{ fontWeight:800, fontSize:13, color:C.ink,
              marginBottom:3 }}>
              {s.title}
            </div>
            <div style={{ fontSize:12, color:C.muted, lineHeight:1.6 }}>
              {s.text}
            </div>
          </div>
          {i < steps.length-1 && (
            <div style={{ position:"absolute", left:38,
              width:1, height:16, background:C.border }}/>
          )}
        </div>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════
   BEWIRKT SECTION
════════════════════════════════════════════ */
function BewirktSection() {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      {BEWIRKT.map((d,i) => (
        <div key={i} style={{ borderRadius:22, overflow:"hidden",
          background:C.card,
          boxShadow:"0 3px 18px rgba(0,0,0,0.07)",
          animation:`fadeUp 0.5s ${i*0.1}s both` }}>
          <div style={{ height:180, overflow:"hidden", position:"relative" }}>
            <img src={d.img} alt={d.title}
              style={{ width:"100%", height:"100%", objectFit:"cover",
                filter:"brightness(0.75) saturate(1.1)" }}/>
            <div style={{ position:"absolute", inset:0,
              background:"linear-gradient(to bottom,transparent 35%,rgba(0,0,0,0.72) 100%)"}}/>
            <div style={{ position:"absolute", bottom:14, left:16, right:50 }}>
              <div style={{ fontWeight:900, fontSize:15, color:"white",
                marginBottom:2 }}>{d.title}</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.72)" }}>
                📍 {d.location} · {d.month}
              </div>
            </div>
            <div style={{ position:"absolute", top:14, right:14,
              width:32, height:32, borderRadius:"50%",
              background:C.green,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:14, color:"white", fontWeight:800,
              boxShadow:"0 4px 12px rgba(61,184,122,0.40)" }}>
              ✓
            </div>
          </div>
          <div style={{ padding:"14px 16px" }}>
            <div style={{ fontWeight:800, fontSize:13, color:C.teal,
              marginBottom:4 }}>
              ✦ € {fmt(d.awarded)} in Wirkung verwandelt
            </div>
            <div style={{ fontSize:13, color:C.ink2,
              fontStyle:"italic", lineHeight:1.65 }}>
              „{d.highlight}"
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════ */
export default function ImpactPage({ currentUser }) {
  const [projects,      setProjects]     = useState([]);
  const [selected,      setSelected]     = useState(null);
  const [supportProject,setSupportProject]= useState(null); // direct support
  const [votedIds,      setVotedIds]     = useState([]);
  const [votesLeft,     setVotesLeft]    = useState(1);
  const [totalVotes,    setTotalVotes]   = useState(1);
  const [poolTotal,     setPoolTotal]    = useState(0);
  const [weeklyInflow,  setWeeklyInflow] = useState(0);
  const [activeFilter,  setActiveFilter] = useState("aktiv");
  const [loading,       setLoading]      = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // Projects
        const { data: projData } = await supabase
          .from("impact_projects")
          .select("*")
          .in("status", ["active","voting","growing","featured","funded"])
          .order("votes", { ascending:false });

        if (projData?.length > 0) {
          setProjects(projData.map(p => ({
            id:            p.id,
            title:         p.name,
            short:         (p.description || "").slice(0,80) + "…",
            story:         p.description || "",
            location:      p.contact_name || "Deutschland",
            category:      p.category || "Gemeinschaft",
            categoryColor: p.color || C.teal,
            img:           p.icon?.startsWith("http") ? p.icon
                           : "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=900&q=90",
            img2:          null,
            raised:        p.awarded_eur || 0,
            goal:          10000,
            votes:         p.votes || 0,
            status:        p.status || "growing",
            supporters:    p.votes ? p.votes * 8 : 120,
            goals:         [],
          })));
        } else {
          setProjects(PROJECTS);
        }

        // Pool total
        const { data: poolData } = await supabase
          .from("payments").select("impact_eur");
        const total = (poolData||[]).reduce((s,r) => s+(r.impact_eur||0), 0);
        setPoolTotal(total > 0 ? total : 124850);

        // Weekly
        const weekAgo = new Date(Date.now()-7*24*60*60*1000).toISOString();
        const { data: weekData } = await supabase
          .from("payments").select("impact_eur").gte("created_at", weekAgo);
        const weekly = (weekData||[]).reduce((s,r) => s+(r.impact_eur||0), 0);
        setWeeklyInflow(weekly > 0 ? weekly : 8950);

      } catch(e) {
        console.error("[ImpactPage]", e.message);
        setProjects(PROJECTS);
        setPoolTotal(124850);
        setWeeklyInflow(8950);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Load user's votes for this month + determine vote allowance
  useEffect(() => {
    if (!currentUser?.id) return;
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    // Check talent status (2 votes) vs base (1 vote)
    supabase.from("profiles")
      .select("has_talent_profile")
      .eq("id", currentUser.id)
      .maybeSingle()
      .then(({ data }) => {
        const isTalent = data?.has_talent_profile === true;
        const alloc    = isTalent ? 2 : 1;
        setTotalVotes(alloc);

        // How many has the user already cast this month?
        supabase.from("impact_votes")
          .select("project_id")
          .eq("user_id", currentUser.id)
          .gte("created_at", monthStart)
          .then(({ data: vdata }) => {
            const ids = (vdata||[]).map(v => v.project_id);
            setVotedIds(ids);
            setVotesLeft(Math.max(0, alloc - ids.length));
          });
      });
  }, [currentUser?.id]);

  async function handleVote(projectId) {
    if (votesLeft <= 0 || !currentUser?.id) return;
    const newVotedIds = [...votedIds, projectId];
    setVotedIds(newVotedIds);
    setVotesLeft(v => Math.max(0, v - 1));
    setProjects(ps => ps.map(p =>
      p.id === projectId ? {...p, votes: p.votes + 1} : p
    ));
    await supabase.from("impact_votes").insert({
      user_id:    currentUser.id,
      project_id: projectId,
      created_at: new Date().toISOString(),
    });
    await supabase.from("impact_projects")
      .update({ votes: (projects.find(p=>p.id===projectId)?.votes||0) + 1 })
      .eq("id", projectId);
  }

  const votingProjects = projects.filter(p => p.status === "voting" || p.status === "featured");
  const activeProjects = projects.filter(p => !["funded","done"].includes(p.status));

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
      height:"60vh", flexDirection:"column", gap:12 }}>
      <style>{CSS}</style>
      <div style={{ width:36, height:36, border:`3px solid ${C.teal}`,
        borderTopColor:"transparent", borderRadius:"50%",
        animation:"spin 0.8s linear infinite" }}/>
      <div style={{ fontSize:13, color:C.muted }}>Wirkung wird geladen…</div>
    </div>
  );

  if (selected) return (
    <ProjectStory
      p={selected}
      onBack={() => setSelected(null)}
      onVote={handleVote}
      votesLeft={votesLeft}
      onSupport={(proj) => { setSelected(null); setSupportProject(proj); }}
    />
  );

  return (
    <>
      <style>{CSS}</style>
      <div style={{ background:C.cream, paddingBottom:110 }}>

        {/* ══ 1. CINEMATIC HERO ══════════════════════════════ */}
        <div style={{ position:"relative", height:"52vh",
          minHeight:320, maxHeight:460, overflow:"hidden" }}>
          <img
            src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&q=90"
            alt="HUI Impact"
            style={{ position:"absolute", inset:0, width:"100%",
              height:"100%", objectFit:"cover",
              filter:"brightness(0.58) saturate(1.2)" }}/>
          <div style={{ position:"absolute", inset:0,
            background:`linear-gradient(to bottom,
              rgba(22,215,197,0.28) 0%, transparent 30%,
              rgba(10,5,0,0.80) 100%)` }}/>

          {/* Live badge */}
          <div style={{ position:"absolute",
            top:"max(52px,env(safe-area-inset-top,52px))", left:24 }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:6,
              background:"rgba(22,215,197,0.20)", backdropFilter:"blur(8px)",
              border:"1px solid rgba(22,215,197,0.40)",
              borderRadius:999, padding:"5px 14px" }}>
              <span style={{ width:6, height:6, borderRadius:"50%",
                background:C.teal, display:"inline-block",
                boxShadow:`0 0 6px ${C.teal}`,
                animation:"breathe 3s ease-in-out infinite" }}/>
              <span style={{ fontSize:11, color:C.teal, fontWeight:700 }}>
                Community Pool · Mai 2026
              </span>
            </div>
          </div>

          {/* Headline */}
          <div style={{ position:"absolute", bottom:0,
            left:0, right:0, padding:"0 24px 28px" }}>
            <div style={{ fontWeight:900, fontSize:30, color:"white",
              letterSpacing:-0.8, lineHeight:1.15, marginBottom:10 }}>
              Aus Kreativität<br/>entsteht Wirkung.
            </div>
            <div style={{ fontSize:13, color:"rgba(255,255,255,0.72)",
              lineHeight:1.65, maxWidth:300, marginBottom:16 }}>
              Ein Teil jeder Buchung fließt automatisch in echte Projekte der Community.
              Ihr entscheidet gemeinsam, wohin.
            </div>
            {/* Stimmen badge in hero */}
            {currentUser && (
              <StimmenBadge votesLeft={votesLeft} totalVotes={totalVotes} />
            )}
          </div>
        </div>

        {/* ══ 2. COMMUNITY POOL CARD ═════════════════════════ */}
        <div style={{ margin:"24px 20px 20px",
          borderRadius:28, overflow:"hidden",
          background:`linear-gradient(145deg,
            rgba(22,215,197,0.10) 0%,
            rgba(255,138,107,0.06) 100%)`,
          border:`1px solid rgba(22,215,197,0.16)`,
          boxShadow:"0 4px 32px rgba(22,215,197,0.08)",
          padding:"24px 22px" }}>

          <div style={{ display:"flex", alignItems:"center", gap:18, marginBottom:20 }}>
            <div style={{ position:"relative", flexShrink:0 }}>
              {/* Pulse ring */}
              <div style={{ position:"absolute", inset:-6, borderRadius:"50%",
                border:`2px solid ${C.teal}40`,
                animation:"pulse-ring 2.5s ease-out infinite" }}/>
              <div style={{ width:60, height:60, borderRadius:"50%",
                background:`radial-gradient(circle at 30% 30%,${C.teal},${C.teal2})`,
                display:"flex", alignItems:"center", justifyContent:"center",
                animation:"float 5s ease-in-out infinite",
                boxShadow:`0 0 20px ${C.tealGlow}` }}>
                <span style={{ fontSize:24 }}>🌱</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginBottom:3 }}>
                Gemeinsamer Impact Pool
              </div>
              <div style={{ fontWeight:900, fontSize:30, color:C.ink,
                letterSpacing:-1 }}>
                € {fmt(poolTotal)}
              </div>
              <div style={{ fontSize:12, color:C.teal, fontWeight:600, marginTop:2 }}>
                ↑ € {fmt(weeklyInflow)} diese Woche
              </div>
            </div>
          </div>

          <div style={{ fontSize:14, color:C.ink2, lineHeight:1.75,
            padding:"14px 16px",
            background:"rgba(255,255,255,0.55)",
            borderRadius:16 }}>
            Aus Werken, Erlebnissen und Begegnungen entsteht echte Wirkung.
            Die Community entscheidet gemeinsam, welche Ideen und Projekte gefördert werden.
            <span style={{ color:C.teal, fontWeight:700 }}> Deine Stimme zählt.</span>
          </div>
        </div>

        {/* ══ 3. FILTER TABS ══════════════════════════════════ */}
        <div className="ip-scroll"
          style={{ display:"flex", gap:8, padding:"0 20px 24px",
            overflowX:"auto" }}>
          {[
            { key:"aktiv",   label:"Aktive Projekte", icon:"✨" },
            { key:"voting",  label:"Community wählt", icon:"🗳" },
            { key:"bewirkt", label:"Was bewegt wurde", icon:"🚀" },
            { key:"how",     label:"Wie es funktioniert", icon:"💡" },
          ].map(f => (
            <button key={f.key} onClick={() => setActiveFilter(f.key)}
              style={{ padding:"8px 14px", borderRadius:999, flexShrink:0,
                background: activeFilter===f.key
                  ? `linear-gradient(135deg,${C.teal},${C.teal2})`
                  : "rgba(0,0,0,0.05)",
                color: activeFilter===f.key ? "white" : C.muted,
                border:"none", cursor:"pointer", fontSize:12,
                fontWeight: activeFilter===f.key ? 700 : 500,
                fontFamily:"inherit", whiteSpace:"nowrap",
                boxShadow: activeFilter===f.key ? `0 4px 12px ${C.tealGlow}` : "none",
                transition:"all 0.22s",
                WebkitTapHighlightColor:"transparent" }}>
              {f.icon} {f.label}
            </button>
          ))}
        </div>

        {/* ══ 4. CONTENT AREA ═════════════════════════════════ */}
        <div style={{ padding:"0 20px" }}>

          {/* Aktive Projekte */}
          {activeFilter === "aktiv" && (
            <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
              {activeProjects.map((p,i) => (
                <ProjectCard key={p.id} p={p} idx={i}
                  onOpen={() => setSelected(p)}
                  votesLeft={votesLeft}
                  onVote={handleVote}
                  onSupport={() => setSupportProject(p)}
                />
              ))}
              {activeProjects.length === 0 && (
                <div style={{ textAlign:"center", padding:"40px 0",
                  color:C.muted, fontSize:14 }}>
                  Neue Projekte kommen bald 🌱
                </div>
              )}
            </div>
          )}

          {/* Community Voting */}
          {activeFilter === "voting" && (
            <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
              {/* Stimmen info */}
              <div style={{ background:`linear-gradient(135deg,${C.teal}12,${C.coral}08)`,
                border:`1px solid ${C.teal}22`, borderRadius:20,
                padding:"18px 18px" }}>
                <div style={{ fontWeight:800, fontSize:15, color:C.ink,
                  marginBottom:6 }}>
                  🗳 Die Community entscheidet
                </div>
                <div style={{ fontSize:13, color:C.ink2, lineHeight:1.65,
                  marginBottom:14 }}>
                  Jeden Monat stimmt ihr gemeinsam ab, welches Projekt zuerst
                  gefördert wird. Das Gewinnerprojekt erhält seinen vollen Wunschbetrag —
                  alle anderen wachsen weiter.
                </div>
                {currentUser && (
                  <StimmenBadge votesLeft={votesLeft} totalVotes={totalVotes} />
                )}
                {!currentUser && (
                  <div style={{ fontSize:12, color:C.muted, fontStyle:"italic" }}>
                    Melde dich an, um abzustimmen.
                  </div>
                )}
              </div>

              {/* Voting cards */}
              {votingProjects.map((p,i) => (
                <ProjectCard key={p.id} p={p} idx={i}
                  onOpen={() => setSelected(p)}
                  votesLeft={votesLeft}
                  onVote={handleVote}
                  onSupport={() => setSupportProject(p)}
                />
              ))}
              {votingProjects.length === 0 && activeProjects.map((p,i) => (
                <ProjectCard key={p.id} p={p} idx={i}
                  onOpen={() => setSelected(p)}
                  votesLeft={votesLeft}
                  onVote={handleVote}
                  onSupport={() => setSupportProject(p)}
                />
              ))}
            </div>
          )}

          {/* Was bewegt wurde */}
          {activeFilter === "bewirkt" && (
            <div>
              <div style={{ fontWeight:800, fontSize:13, color:C.teal,
                letterSpacing:1.2, textTransform:"uppercase",
                marginBottom:16 }}>
                Was bereits bewegt wurde
              </div>
              <BewirktSection />
            </div>
          )}

          {/* Wie es funktioniert */}
          {activeFilter === "how" && (
            <HowItWorks />
          )}
        </div>
      </div>

      {/* ── Direct Support Sheet ───────────────────────── */}
      {supportProject && (
        <SupportSheet
          project={supportProject}
          currentUser={currentUser}
          onClose={() => setSupportProject(null)}
          onSuccess={(amount) => {
            // Optimistically update raised amount in list
            setProjects(ps => ps.map(p =>
              p.id === supportProject.id
                ? {...p, raised: (p.raised||0) + amount}
                : p
            ));
            setSupportProject(null);
          }}
        />
      )}
    </>
  );
}
