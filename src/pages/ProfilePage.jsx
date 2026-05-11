// ProfilePage.jsx — HUI v6
import { HighlightsRow } from '../components/StoryBar';
// BASISPROFIL = privater warmer Bereich
// WIRKERPROFIL = öffentliche kreative Bühne
import React, { useState } from "react";
import { useAuth } from "../lib/AuthContext";

const C = {
  teal:"#16D7C5", teal2:"#11C5B7", tealPale:"#E6FAF8",
  coral:"#FF8A6B", coralPale:"#FFF2EE",
  gold:"#F5A623", goldPale:"#FFFBEB",
  cream:"#F9F6F2", warm:"#FFF9F4",
  card:"#FFFFFF", ink:"#1A1A1A", ink2:"#3A3A3A",
  muted:"#888", border:"rgba(0,0,0,0.06)",
};

const CSS = `
  @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
  @keyframes pop{0%{transform:scale(0.94);opacity:0}70%{transform:scale(1.02)}100%{transform:scale(1);opacity:1}}
  @keyframes slideIn{from{opacity:0;transform:translateX(100%)}to{opacity:1;transform:translateX(0)}}
  @keyframes slideOut{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(100%)}}
  .hui-tap{transition:transform .15s cubic-bezier(.34,1.4,.64,1);-webkit-tap-highlight-color:transparent}
  .hui-tap:active{transform:scale(.96)}
  .hui-scroll::-webkit-scrollbar{display:none}
  .hui-scroll{-ms-overflow-style:none;scrollbar-width:none}
`;

const MOCK = {
  name:"Lars Gutknecht", email:"lars@hui.app",
  img:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=90",
  impactEur:128.50, unreadMessages:2,
  orders:[{ title:"Keramik Vase", status:"In Lieferung", price:"€ 89", date:"5. Mai",
    img:"https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&q=80" }],
  favorites:[
    { title:"Aquarell A3", creator:"Lena M.", price:"€ 120",
      img:"https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=300&q=80" },
  ],
  // Wirker
  isWirker: true,
  talent:"Unternehmer & Visionär", city:"München",
  tagline:"Ich baue Dinge, die bedeuten.",
  bio:"Seit Jahren an der Schnittstelle zwischen Tech und Mensch. Ich schaffe Erlebnisse, die bleiben.",
  bg:"https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&q=80",
  verified:true, bookings:14, recommendations:12,
  werke:[
    { title:"Brand Identity Design", price:"ab € 1.200",
      img:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80" },
    { title:"Strategie-Workshop", price:"€ 490",
      img:"https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&q=80" },
  ],
};

/* ─── WIRKER ONBOARDING FLOW ─────────────────────────────────────── */
const ONBOARDING_STEPS = [
  { key:"identity", emoji:"✦", title:"Wer bist du?",
    sub:"Dein Name und dein Gesicht auf HUI." },
  { key:"direction", emoji:"🎨", title:"Was ist deine kreative Richtung?",
    sub:"Wähle was am besten zu dir passt." },
  { key:"location", emoji:"📍", title:"Wo wirkst du?",
    sub:"Stadt oder Region — damit dich Menschen finden." },
  { key:"tagline", emoji:"✍️", title:"Dein Satz.",
    sub:"Ein Satz der zeigt wer du bist." },
  { key:"done", emoji:"🌱", title:"Dein Wirkerprofil ist bereit.",
    sub:"Du kannst jetzt Werke, Storys und Angebote veröffentlichen." },
];

const DIRECTIONS = [
  { key:"art", label:"Kunst & Design", icon:"🎨" },
  { key:"craft", label:"Handwerk & Herstellung", icon:"🪵" },
  { key:"coaching", label:"Coaching & Beratung", icon:"💡" },
  { key:"experience", label:"Erlebnisse & Events", icon:"✨" },
  { key:"music", label:"Musik & Klang", icon:"🎵" },
  { key:"photo", label:"Fotografie & Film", icon:"📸" },
  { key:"writing", label:"Text & Sprache", icon:"✍️" },
  { key:"other", label:"Etwas anderes", icon:"🌿" },
];

function WirkerOnboarding({ onClose, onComplete }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name:"", direction:"", city:"", tagline:"" });

  const current = ONBOARDING_STEPS[step];
  const isLast = step === ONBOARDING_STEPS.length - 1;

  function next() {
    if (isLast) { onComplete(form); return; }
    setStep(s => s + 1);
  }
  function back() {
    if (step === 0) { onClose(); return; }
    setStep(s => s - 1);
  }

  return (
    <div style={{ position:"fixed", inset:0, zIndex:3000,
      background:C.cream, display:"flex", flexDirection:"column",
      animation:"slideIn 0.35s cubic-bezier(.32,0,.67,0) both" }}>
      <style>{CSS}</style>

      {/* Progress bar */}
      <div style={{ height:3, background:"#E8E2D8" }}>
        <div style={{
          height:"100%", borderRadius:2,
          background:`linear-gradient(90deg,${C.teal},${C.coral})`,
          width:`${((step+1)/ONBOARDING_STEPS.length)*100}%`,
          transition:"width 0.4s ease",
        }}/>
      </div>

      {/* Back */}
      <div style={{ padding:"20px 24px 0" }}>
        <button onClick={back} className="hui-tap"
          style={{ background:"none", border:"none", cursor:"pointer",
            fontSize:13, color:C.muted, fontWeight:600, padding:0 }}>
          ← {step === 0 ? "Abbrechen" : "Zurück"}
        </button>
      </div>

      {/* Content */}
      <div style={{ flex:1, padding:"32px 28px 0", overflow:"auto" }}
        className="hui-scroll">

        <div style={{ fontSize:48, marginBottom:16, animation:"pop 0.4s both" }}>
          {current.emoji}
        </div>
        <div style={{ fontWeight:900, fontSize:28, color:C.ink,
          letterSpacing:-0.8, lineHeight:1.2, marginBottom:8,
          animation:"fadeUp 0.4s 0.05s both" }}>
          {current.title}
        </div>
        <div style={{ fontSize:15, color:C.muted, lineHeight:1.6,
          marginBottom:36, animation:"fadeUp 0.4s 0.1s both" }}>
          {current.sub}
        </div>

        {/* STEP: Identity */}
        {step === 0 && (
          <div style={{ animation:"fadeUp 0.4s 0.15s both" }}>
            <input placeholder="Dein Name" value={form.name}
              onChange={e => setForm(f=>({...f,name:e.target.value}))}
              style={{ width:"100%", padding:"16px 18px",
                background:C.card, border:`1.5px solid #E8E2D8`,
                borderRadius:16, fontSize:16, color:C.ink,
                outline:"none", fontFamily:"inherit",
                boxSizing:"border-box" }}/>
          </div>
        )}

        {/* STEP: Direction */}
        {step === 1 && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr",
            gap:12, animation:"fadeUp 0.4s 0.15s both" }}>
            {DIRECTIONS.map(d => (
              <button key={d.key} onClick={() => setForm(f=>({...f,direction:d.key}))}
                className="hui-tap"
                style={{ padding:"18px 14px", borderRadius:18,
                  background: form.direction===d.key
                    ? `linear-gradient(135deg,${C.teal}20,${C.coral}20)`
                    : C.card,
                  border: form.direction===d.key
                    ? `2px solid ${C.teal}`
                    : `1.5px solid #E8E2D8`,
                  cursor:"pointer", fontFamily:"inherit",
                  display:"flex", flexDirection:"column",
                  alignItems:"center", gap:8 }}>
                <span style={{ fontSize:26 }}>{d.icon}</span>
                <span style={{ fontSize:12, fontWeight:700, color:C.ink,
                  textAlign:"center", lineHeight:1.3 }}>{d.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* STEP: Location */}
        {step === 2 && (
          <div style={{ animation:"fadeUp 0.4s 0.15s both" }}>
            <input placeholder="z.B. München, Berlin, Zürich…" value={form.city}
              onChange={e => setForm(f=>({...f,city:e.target.value}))}
              style={{ width:"100%", padding:"16px 18px",
                background:C.card, border:`1.5px solid #E8E2D8`,
                borderRadius:16, fontSize:16, color:C.ink,
                outline:"none", fontFamily:"inherit",
                boxSizing:"border-box" }}/>
          </div>
        )}

        {/* STEP: Tagline */}
        {step === 3 && (
          <div style={{ animation:"fadeUp 0.4s 0.15s both" }}>
            <textarea placeholder="z.B. Ich schaffe Erlebnisse die bleiben."
              value={form.tagline}
              onChange={e => setForm(f=>({...f,tagline:e.target.value}))}
              rows={3}
              style={{ width:"100%", padding:"16px 18px",
                background:C.card, border:`1.5px solid #E8E2D8`,
                borderRadius:16, fontSize:16, color:C.ink,
                outline:"none", fontFamily:"inherit",
                resize:"none", boxSizing:"border-box" }}/>
            <div style={{ fontSize:12, color:C.muted, marginTop:8, textAlign:"right" }}>
              {form.tagline.length}/80
            </div>
          </div>
        )}

        {/* STEP: Done */}
        {step === 4 && (
          <div style={{ animation:"fadeUp 0.4s 0.15s both" }}>
            <div style={{ background:`linear-gradient(135deg,${C.teal}15,${C.coral}15)`,
              border:`1.5px solid ${C.teal}30`,
              borderRadius:20, padding:"24px 20px", marginBottom:16 }}>
              <div style={{ fontWeight:800, fontSize:16, color:C.ink, marginBottom:12 }}>
                Dein Profil
              </div>
              {[
                ["Name", form.name || MOCK.name],
                ["Richtung", DIRECTIONS.find(d=>d.key===form.direction)?.label || "–"],
                ["Stadt", form.city || "–"],
                ["Satz", form.tagline || "–"],
              ].map(([k,v]) => (
                <div key={k} style={{ display:"flex", justifyContent:"space-between",
                  padding:"8px 0", borderBottom:`1px solid ${C.border}`,
                  fontSize:14 }}>
                  <span style={{ color:C.muted, fontWeight:600 }}>{k}</span>
                  <span style={{ color:C.ink, fontWeight:700, textAlign:"right",
                    maxWidth:"60%" }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CTA */}
      <div style={{ padding:"24px 28px max(32px,env(safe-area-inset-bottom,32px))" }}>
        <button onClick={next} className="hui-tap"
          disabled={
            (step===0 && !form.name.trim()) ||
            (step===1 && !form.direction) ||
            (step===2 && !form.city.trim()) ||
            (step===3 && !form.tagline.trim())
          }
          style={{ width:"100%", padding:"17px",
            background: `linear-gradient(135deg,${C.teal},${C.teal2})`,
            color:"white", border:"none", borderRadius:18,
            fontSize:17, fontWeight:800, cursor:"pointer",
            fontFamily:"inherit",
            boxShadow:"0 4px 24px rgba(22,215,197,0.4)",
            opacity: (
              (step===0&&!form.name.trim())||
              (step===1&&!form.direction)||
              (step===2&&!form.city.trim())||
              (step===3&&!form.tagline.trim())
            ) ? 0.45 : 1,
            transition:"opacity 0.2s" }}>
          {isLast ? "Wirkerprofil aktivieren ✦" : "Weiter →"}
        </button>
      </div>
    </div>
  );
}

/* ─── BASISPROFIL ──────────────────────────────────────────────────── */
function BaseProfil({ user, onOpenWirker, onShowOnboarding }) {
  return (
    <div style={{ minHeight:"100dvh", background:C.cream,
      paddingBottom:"max(100px,env(safe-area-inset-bottom,100px))" }}
      className="hui-scroll">

      {/* Header */}
      <div style={{ background:C.card, padding:"max(56px,env(safe-area-inset-top,56px)) 24px 24px",
        borderBottom:`1px solid ${C.border}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <div style={{ position:"relative" }}>
            <img src={user.img} alt="" style={{
              width:64, height:64, borderRadius:20,
              objectFit:"cover", display:"block" }}/>
            <div style={{ position:"absolute", bottom:-2, right:-2,
              width:18, height:18, borderRadius:"50%",
              background:`linear-gradient(135deg,${C.teal},${C.coral})`,
              border:"2px solid white" }}/>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:900, fontSize:20, color:C.ink,
              letterSpacing:-0.5 }}>{user.name}</div>
            <div style={{ fontSize:13, color:C.muted, marginTop:2 }}>{user.email}</div>
          </div>
          <button className="hui-tap"
            style={{ background:C.cream, border:"none", borderRadius:12,
              padding:"8px 14px", cursor:"pointer", fontFamily:"inherit" }}>
            <span style={{ fontSize:12, fontWeight:700, color:C.muted }}>Bearbeiten</span>
          </button>
        </div>

        {/* Impact pill */}
        <div style={{ marginTop:18, display:"inline-flex", alignItems:"center",
          gap:8, background:`${C.teal}12`, borderRadius:30,
          padding:"8px 16px", border:`1px solid ${C.teal}25` }}>
          <span style={{ fontSize:14 }}>🌱</span>
          <span style={{ fontSize:13, fontWeight:700, color:"#2A7A7A" }}>
            € {user.impactEur.toFixed(2)} Impact bewirkt
          </span>
        </div>
      </div>

      <div style={{ padding:"24px 20px" }}>

        {/* ── WIRKERPROFIL CARD ────────────────────────────── */}
        {!user.isWirker ? (
          <div style={{ marginBottom:24, borderRadius:24, overflow:"hidden",
            position:"relative", minHeight:200,
            animation:"fadeUp 0.4s 0.05s both" }}>
            <img src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80"
              alt="" style={{ position:"absolute", inset:0,
                width:"100%", height:"100%", objectFit:"cover",
                filter:"brightness(0.55)" }}/>
            <div style={{ position:"absolute", inset:0,
              background:"linear-gradient(to bottom,rgba(0,0,0,0.1),rgba(0,0,0,0.75))" }}/>
            <div style={{ position:"relative", padding:"28px 24px 24px" }}>
              <div style={{ display:"inline-block", background:"rgba(255,255,255,0.15)",
                backdropFilter:"blur(8px)", borderRadius:20, padding:"5px 12px",
                marginBottom:14 }}>
                <span style={{ fontSize:11, fontWeight:800, color:"white",
                  letterSpacing:1 }}>NEU</span>
              </div>
              <div style={{ fontWeight:900, fontSize:24, color:"white",
                letterSpacing:-0.5, lineHeight:1.2, marginBottom:8 }}>
                Deine kreative<br/>Identität auf HUI
              </div>
              <div style={{ fontSize:14, color:"rgba(255,255,255,0.8)",
                lineHeight:1.6, marginBottom:22 }}>
                Teile deine Werke, Angebote und Geschichten<br/>mit Menschen die dich suchen.
              </div>
              <button onClick={onShowOnboarding} className="hui-tap"
                style={{ background:`linear-gradient(135deg,${C.teal},${C.teal2})`,
                  border:"none", borderRadius:14, padding:"13px 24px",
                  color:"white", fontSize:15, fontWeight:800,
                  cursor:"pointer", fontFamily:"inherit",
                  boxShadow:"0 4px 20px rgba(22,215,197,0.5)" }}>
                Wirkerprofil erstellen ✦
              </button>
            </div>
          </div>
        ) : (
          /* Wirker aktiv → Bühnen-Card */
          <button onClick={onOpenWirker} className="hui-tap"
            style={{ width:"100%", marginBottom:24, borderRadius:24,
              overflow:"hidden", position:"relative", minHeight:130,
              border:"none", cursor:"pointer", display:"block",
              animation:"fadeUp 0.4s 0.05s both" }}>
            <img src={user.bg} alt="" style={{ position:"absolute", inset:0,
              width:"100%", height:"100%", objectFit:"cover",
              filter:"brightness(0.5)" }}/>
            <div style={{ position:"absolute", inset:0,
              background:"linear-gradient(135deg,rgba(22,215,197,0.3),rgba(255,138,107,0.3))" }}/>
            <div style={{ position:"relative", padding:"24px 22px",
              display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ textAlign:"left" }}>
                <div style={{ fontSize:11, fontWeight:800, color:"rgba(255,255,255,0.7)",
                  letterSpacing:1, marginBottom:4 }}>MEIN WIRKERPROFIL</div>
                <div style={{ fontWeight:900, fontSize:20, color:"white",
                  letterSpacing:-0.5 }}>{user.talent}</div>
                <div style={{ fontSize:13, color:"rgba(255,255,255,0.75)",
                  marginTop:4 }}>{user.city}</div>
              </div>
              <div style={{ background:"rgba(255,255,255,0.2)",
                backdropFilter:"blur(8px)", borderRadius:"50%",
                width:40, height:40, display:"flex",
                alignItems:"center", justifyContent:"center",
                fontSize:18, color:"white" }}>→</div>
            </div>
          </button>
        )}

        {/* ── MENÜ SECTIONS ─────────────────────────────── */}
        <Section title="Meine Aktivität" delay={0.1}>
          <MenuItem icon="📦" label="Bestellungen & Buchungen"
            sub={user.orders?.length ? `${user.orders.length} aktiv` : undefined}
            accent={C.teal} />
          <MenuItem icon="💬" label="Nachrichten"
            sub={user.unreadMessages ? `${user.unreadMessages} ungelesen` : undefined}
            badge={user.unreadMessages} accent={C.coral} />
          <MenuItem icon="🛍️" label="Werkekorb" accent={C.gold} />
          <MenuItem icon="❤️" label="Favoriten"
            sub={user.favorites?.length ? `${user.favorites.length} gespeichert` : undefined} />
        </Section>

        <Section title="Impact" delay={0.2}>
          <MenuItem icon="🌱" label="Meine Impact-Stimmen"
            sub="3 Stimmen vergeben" accent={C.teal} />
          <MenuItem icon="✦" label="Impact Pool"
            sub={`€ ${user.impactEur.toFixed(2)} beigetragen`} accent="#8B5CF6" />
        </Section>

        <Section title="Konto" delay={0.3}>
          <MenuItem icon="💳" label="Zahlungsmethoden" />
          <MenuItem icon="🧾" label="Rechnungen & Belege" />
          <MenuItem icon="🔒" label="Datenschutz & Sicherheit" />
          <MenuItem icon="⚙️" label="Einstellungen" />
        </Section>

        {/* Logout */}
        <button className="hui-tap"
          style={{ width:"100%", padding:"15px",
            background:"none", border:`1.5px solid #E8E2D8`,
            borderRadius:16, color:C.muted, fontSize:14,
            fontWeight:700, cursor:"pointer", fontFamily:"inherit",
            marginTop:8 }}>
          Abmelden
        </button>

        <div style={{ textAlign:"center", marginTop:20,
          fontSize:11, color:C.muted }}>
          HUI · Human United Intelligent
        </div>
      </div>
    </div>
  );
}

function Section({ title, children, delay=0 }) {
  return (
    <div style={{ marginBottom:24, animation:`fadeUp 0.4s ${delay}s both` }}>
      <div style={{ fontSize:11, fontWeight:800, color:C.muted,
        letterSpacing:1.2, marginBottom:6, paddingLeft:4 }}>
        {title.toUpperCase()}
      </div>
      <div style={{ background:C.card, borderRadius:20, padding:"0 18px",
        boxShadow:"0 1px 8px rgba(0,0,0,0.04)" }}>
        {children}
      </div>
    </div>
  );
}

function MenuItem({ icon, label, sub, badge, accent }) {
  return (
    <button className="hui-tap"
      style={{ width:"100%", display:"flex", alignItems:"center",
        gap:14, padding:"14px 0", background:"none", border:"none",
        cursor:"pointer", fontFamily:"inherit", textAlign:"left",
        borderBottom:`1px solid ${C.border}` }}>
      <div style={{ width:38, height:38, borderRadius:12,
        background: accent ? `${accent}15` : C.cream,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:17, flexShrink:0 }}>
        {icon}
      </div>
      <div style={{ flex:1 }}>
        <div style={{ fontWeight:700, fontSize:14, color:C.ink }}>{label}</div>
        {sub && <div style={{ fontSize:12, color:C.muted, marginTop:1 }}>{sub}</div>}
      </div>
      {badge ? (
        <div style={{ background:C.coral, color:"white", borderRadius:20,
          padding:"2px 8px", fontSize:11, fontWeight:800 }}>{badge}</div>
      ) : (
        <span style={{ color:C.muted, fontSize:16 }}>›</span>
      )}
    </button>
  );
}

/* ─── WIRKERPROFIL (öffentliche Bühne) ─────────────────────────────── */
function WirkerProfil({ user, onBack }) {
  const [tab, setTab] = useState("werke");

  return (
    <div style={{ minHeight:"100dvh", background:"#0A0A0A",
      animation:"slideIn 0.35s cubic-bezier(.32,0,.67,0) both" }}
      className="hui-scroll">

      {/* Hero */}
      <div style={{ position:"relative", height:"55dvh" }}>
        <img src={user.bg} alt="" style={{ position:"absolute", inset:0,
          width:"100%", height:"100%", objectFit:"cover",
          filter:"brightness(0.6) saturate(1.1)" }}/>
        <div style={{ position:"absolute", inset:0,
          background:"linear-gradient(to bottom,rgba(0,0,0,0.15) 0%,rgba(10,10,10,0.95) 100%)" }}/>

        {/* Back */}
        <button onClick={onBack} className="hui-tap"
          style={{ position:"absolute", top:"max(56px,env(safe-area-inset-top,56px))",
            left:20, background:"rgba(255,255,255,0.15)", backdropFilter:"blur(8px)",
            border:"none", borderRadius:"50%", width:38, height:38,
            color:"white", fontSize:16, cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center" }}>
          ←
        </button>

        {/* Plus */}
        <button className="hui-tap"
          style={{ position:"absolute", top:"max(56px,env(safe-area-inset-top,56px))",
            right:20, width:38, height:38, borderRadius:"50%",
            background:`linear-gradient(135deg,${C.teal},${C.coral})`,
            border:"none", color:"white", fontSize:22, cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow:"0 4px 16px rgba(22,215,197,0.5)" }}>
          +
        </button>

        {/* Info */}
        <div style={{ position:"absolute", bottom:28, left:24, right:24 }}>
          {user.verified && (
            <div style={{ display:"inline-flex", alignItems:"center", gap:5,
              background:`${C.teal}25`, borderRadius:20, padding:"4px 10px",
              marginBottom:10 }}>
              <span style={{ fontSize:10 }}>✦</span>
              <span style={{ fontSize:10, fontWeight:800, color:C.teal,
                letterSpacing:0.8 }}>VERIFIZIERT</span>
            </div>
          )}
          <div style={{ fontWeight:900, fontSize:30, color:"white",
            letterSpacing:-0.8, lineHeight:1.15, marginBottom:6 }}>
            {user.name}
          </div>
          <div style={{ fontSize:15, color:"rgba(255,255,255,0.75)",
            fontWeight:600 }}>{user.talent} · {user.city}</div>
          <div style={{ fontSize:14, color:"rgba(255,255,255,0.6)",
            marginTop:6, fontStyle:"italic" }}>
            „{user.tagline}"
          </div>

          {/* Stats */}
          <div style={{ display:"flex", gap:20, marginTop:16 }}>
            {[
              { val:user.bookings, label:"Buchungen" },
              { val:user.recommendations, label:"Empfehlungen" },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontWeight:900, fontSize:22, color:"white" }}>{s.val}</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.55)",
                  fontWeight:600 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background:"#111", position:"sticky", top:0, zIndex:10,
        display:"flex", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
        {[
          { key:"werke", label:"Werke" },
          { key:"stories", label:"Stories" },
          { key:"empfehlungen", label:"Empfehlungen" },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className="hui-tap"
            style={{ flex:1, padding:"14px 0", background:"none", border:"none",
              cursor:"pointer", fontFamily:"inherit",
              fontSize:13, fontWeight:700,
              color: tab===t.key ? C.teal : "rgba(255,255,255,0.4)",
              borderBottom: tab===t.key ? `2px solid ${C.teal}` : "2px solid transparent",
              transition:"color 0.2s" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ padding:"20px 20px max(100px,env(safe-area-inset-bottom,100px))" }}>

        {tab === "werke" && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            {user.werke.map((w,i) => (
              <div key={i} className="hui-tap"
                style={{ borderRadius:18, overflow:"hidden",
                  background:"#1A1A1A", cursor:"pointer",
                  animation:`fadeUp 0.4s ${i*0.08}s both` }}>
                <img src={w.img} alt="" style={{
                  width:"100%", aspectRatio:"4/3", objectFit:"cover",
                  display:"block" }}/>
                <div style={{ padding:"12px 14px" }}>
                  <div style={{ fontWeight:800, fontSize:13,
                    color:"white", lineHeight:1.3 }}>{w.title}</div>
                  <div style={{ fontSize:12, color:C.teal,
                    fontWeight:700, marginTop:4 }}>{w.price}</div>
                </div>
              </div>
            ))}
            {/* Add werk */}
            <div className="hui-tap"
              style={{ borderRadius:18, border:"2px dashed rgba(255,255,255,0.12)",
                aspectRatio:"3/4", display:"flex", flexDirection:"column",
                alignItems:"center", justifyContent:"center", gap:8,
                cursor:"pointer", color:"rgba(255,255,255,0.3)" }}>
              <span style={{ fontSize:28 }}>+</span>
              <span style={{ fontSize:11, fontWeight:700 }}>Werk hinzufügen</span>
            </div>
          </div>
        )}

        {tab === "stories" && (
          <div style={{ textAlign:"center", padding:"60px 0",
            color:"rgba(255,255,255,0.3)" }}>
            <div style={{ fontSize:40, marginBottom:12 }}>📸</div>
            <div style={{ fontWeight:700, fontSize:15 }}>Noch keine Stories</div>
            <div style={{ fontSize:13, marginTop:6 }}>
              Teile deine ersten Momente
            </div>
          </div>
        )}

        {tab === "empfehlungen" && (
          <div style={{ textAlign:"center", padding:"60px 0",
            color:"rgba(255,255,255,0.3)" }}>
            <div style={{ fontSize:40, marginBottom:12 }}>✦</div>
            <div style={{ fontWeight:700, fontSize:15 }}>Noch keine Empfehlungen</div>
            <div style={{ fontSize:13, marginTop:6 }}>
              Sie erscheinen nach abgeschlossenen Buchungen
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── MAIN EXPORT ──────────────────────────────────────────────────── */
export default function ProfilePage() {
  const { user: authUser } = useAuth();
  const [view, setView] = useState("base"); // base | wirker | onboarding
  const [userData, setUserData] = useState({ ...MOCK });

  function handleOnboardingComplete(form) {
    setUserData(u => ({ ...u, isWirker:true,
      talent: DIRECTIONS.find(d=>d.key===form.direction)?.label || u.talent,
      city: form.city || u.city,
      tagline: form.tagline || u.tagline,
    }));
    setView("wirker");
  }

  return (
    <>
      <style>{CSS}</style>
      {view === "onboarding" && (
        <WirkerOnboarding
          onClose={() => setView("base")}
          onComplete={handleOnboardingComplete}
        />
      )}
      {view === "wirker" && (
        <WirkerProfil user={userData} onBack={() => setView("base")} />
      )}
      {view === "base" && (
        <BaseProfil
          user={userData}
          onOpenWirker={() => setView("wirker")}
          onShowOnboarding={() => setView("onboarding")}
        />
      )}
    </>
  );
}
