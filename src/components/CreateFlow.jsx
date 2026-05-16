// CreateFlow.jsx — HUI Create Experience
// Emotional, warm, kreativ. Kein Shopify-Backend.
import React, { useState, useRef } from "react";
import { supabase } from ".../lib/supabaseClient";
import { MOOD_TAG_OPTIONS, ENERGY_LEVELS } from "../lib/moodUtils";

const C = {
  teal:"#16D7C5", teal2:"#11C5B7", tealPale:"#E6FAF8",
  tealGlow:"rgba(22,215,197,0.22)",
  coral:"#FF8A6B", coral2:"#FF7B72", coralPale:"#FFF2EE",
  coralGlow:"rgba(255,138,107,0.20)",
  gold:"#F5A623", goldPale:"#FFFBEB",
  green:"#3DB87A", purple:"#A78BFA",
  cream:"#F9F6F2", warm:"#FFF9F4",
  card:"#FFFFFF", ink:"#1A1A1A", ink2:"#3A3A3A",
  muted:"#888", muted2:"#BBB", border:"rgba(0,0,0,0.06)",
};

const CSS = `
  @keyframes cfUp   {from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
  @keyframes cfPop  {0%{transform:scale(0.9);opacity:0}60%{transform:scale(1.04)}100%{transform:scale(1);opacity:1}}
  @keyframes cfSpin {to{transform:rotate(360deg)}}
  .cf-scroll::-webkit-scrollbar{display:none}
  .cf-scroll{-ms-overflow-style:none;scrollbar-width:none;overflow-y:auto;-webkit-overflow-scrolling:touch}
  .cf-tap{transition:transform .17s cubic-bezier(.34,1.4,.64,1);-webkit-tap-highlight-color:transparent}
  .cf-tap:active{transform:scale(.955)}
  .cf-input:focus{outline:none;border-color:#16D7C5!important}
`;

/* ── helpers ── */
// ErrorBoundary für Create Modal
class CreateErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(e) { return { error: e }; }
  componentDidCatch(e, info) { console.error("[HUI] CreateFlow Crash:", e, info); }
  render() {
    if (this.state.error) {
      return (
        <div style={{ position:"fixed", inset:0, zIndex:400,
          background:"#FFF0EE", display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center", padding:32 }}>
          <div style={{ fontSize:40, marginBottom:16 }}>⚠️</div>
          <div style={{ fontWeight:900, fontSize:18, color:"#E05A3A",
            marginBottom:12 }}>Create Modal Fehler</div>
          <div style={{ fontSize:13, color:"#C04020", lineHeight:1.6,
            maxWidth:300, textAlign:"center", marginBottom:20 }}>
            {this.state.error?.message || "Unbekannter Fehler"}
          </div>
          <button onClick={() => this.setState({ error: null })}
            style={{ padding:"12px 24px", borderRadius:12,
              background:"#FF8A6B", color:"white", border:"none",
              fontWeight:700, cursor:"pointer", fontSize:14 }}>
            Schließen
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}


function Field({ label, children, note }) {
  return (
    <div style={{ marginBottom:18 }}>
      <div style={{ fontSize:11, fontWeight:700, color:C.muted,
        letterSpacing:1.3, textTransform:"uppercase", marginBottom:7 }}>
        {label}
      </div>
      {children}
      {note && <div style={{ fontSize:11, color:C.muted2,
        marginTop:5, lineHeight:1.5 }}>{note}</div>}
    </div>
  );
}

function TInput({ value, onChange, placeholder, type="text", prefix }) {
  return (
    <div style={{ position:"relative" }}>
      {prefix && (
        <span style={{ position:"absolute", left:14, top:"50%",
          transform:"translateY(-50%)",
          fontSize:14, fontWeight:700, color:C.muted }}>
          {prefix}
        </span>
      )}
      <input
        className="cf-input"
        type={type} value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        style={{
          width:"100%", background:C.card,
          border:`1.5px solid ${C.border}`, borderRadius:14,
          padding: prefix ? "13px 16px 13px 28px" : "13px 16px",
          fontSize:14, color:C.ink, fontFamily:"inherit",
          boxSizing:"border-box",
          boxShadow:"0 2px 8px rgba(0,0,0,0.04)",
          transition:"border-color 0.2s",
        }}
      />
    </div>
  );
}

function TArea({ value, onChange, placeholder, rows=3 }) {
  return (
    <textarea
      className="cf-input"
      value={value} placeholder={placeholder} rows={rows}
      onChange={e => onChange(e.target.value)}
      style={{
        width:"100%", background:C.card,
        border:`1.5px solid ${C.border}`, borderRadius:14,
        padding:"13px 16px", fontSize:14, color:C.ink,
        fontFamily:"inherit", resize:"none",
        boxSizing:"border-box", lineHeight:1.65,
        boxShadow:"0 2px 8px rgba(0,0,0,0.04)",
        transition:"border-color 0.2s",
      }}
    />
  );
}

function BackBtn({ onBack, onClose, step, total }) {
  return (
    <div style={{ display:"flex", alignItems:"center",
      justifyContent:"space-between",
      padding:"max(52px,env(safe-area-inset-top,52px)) 20px 16px" }}>
      <button onClick={onBack} className="cf-tap"
        style={{ width:40, height:40, borderRadius:14,
          background:C.card, border:`1px solid ${C.border}`,
          cursor:"pointer", fontSize:16,
          boxShadow:"0 2px 10px rgba(0,0,0,0.06)" }}>←</button>
      <div style={{ display:"flex", gap:5 }}>
        {Array.from({length:total}).map((_,i) => (
          <div key={i} style={{ width:i===step?18:6, height:6,
            borderRadius:999,
            background:i===step?C.teal:i<step?`${C.teal}55`:C.muted2,
            transition:"all 0.28s cubic-bezier(.34,1.4,.64,1)" }}/>
        ))}
      </div>
      <button onClick={onClose} className="cf-tap"
        style={{ background:"none", border:"none", cursor:"pointer",
          fontSize:12, fontWeight:600, color:C.muted, padding:"8px" }}>
        Abbrechen
      </button>
    </div>
  );
}

/* ════════════════════════════════════════════════
   STEP 0 — Was möchtest du teilen?
════════════════════════════════════════════════ */
function StepChoose({ onChoose, onClose }) {
  return (
    <div className="cf-scroll" style={{ position:"fixed", inset:0,
      zIndex:350, background:C.warm }}>
      <style>{CSS}</style>

      <div style={{ padding:"max(52px,env(safe-area-inset-top,52px)) 20px 0",
        display:"flex", justifyContent:"flex-end" }}>
        <button onClick={onClose} className="cf-tap"
          style={{ background:"none", border:"none", cursor:"pointer",
            fontSize:12, fontWeight:600, color:C.muted, padding:"8px" }}>
          Schließen
        </button>
      </div>

      <div style={{ padding:"8px 24px 48px", animation:"cfUp 0.4s both" }}>
        <div style={{ marginBottom:32 }}>
          <div style={{ fontWeight:900, fontSize:26, color:C.ink,
            letterSpacing:-0.6, lineHeight:1.2, marginBottom:8 }}>
            Was möchtest<br/>du teilen?
          </div>
          <div style={{ fontSize:14, color:C.muted, lineHeight:1.65 }}>
            Dein Werk. Deine Experience. Deine Energie.
          </div>
        </div>

        {/* Werk card */}
        <button onClick={() => onChoose("werk")} className="cf-tap"
          style={{ width:"100%", textAlign:"left", background:C.card,
            border:`1.5px solid ${C.border}`, borderRadius:24,
            padding:"24px 22px", marginBottom:14, cursor:"pointer",
            fontFamily:"inherit",
            boxShadow:"0 3px 20px rgba(0,0,0,0.07)",
            animation:"cfPop 0.4s 0.05s both" }}>
          <div style={{ display:"flex", alignItems:"center",
            gap:16, marginBottom:14 }}>
            <div style={{ width:52, height:52, borderRadius:16,
              background:`linear-gradient(135deg,${C.gold}22,${C.gold}0A)`,
              border:`1.5px solid ${C.gold}44`,
              display:"flex", alignItems:"center",
              justifyContent:"center", fontSize:24 }}>🎨</div>
            <div>
              <div style={{ fontWeight:900, fontSize:18, color:C.ink,
                letterSpacing:-0.3 }}>Werk erstellen</div>
              <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>
                Produkt · Kunst · Design · Digital
              </div>
            </div>
          </div>
          <p style={{ fontSize:13, color:C.muted, lineHeight:1.65,
            margin:0 }}>
            Teile etwas das du geschaffen hast — ein Objekt, ein Kunstwerk,
            ein digitales Werk. Andere können es direkt kaufen.
          </p>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:14 }}>
            {["Kunst","Handwerk","Fotografie","Design","Digitales"].map(t=>(
              <span key={t} style={{ background:`${C.gold}18`,
                border:`1px solid ${C.gold}44`,
                borderRadius:999, padding:"3px 10px",
                fontSize:11, fontWeight:600, color:C.gold }}>
                {t}
              </span>
            ))}
          </div>
        </button>

        {/* Experience card */}
        <button onClick={() => onChoose("experience")} className="cf-tap"
          style={{ width:"100%", textAlign:"left", background:C.card,
            border:`1.5px solid ${C.border}`, borderRadius:24,
            padding:"24px 22px", marginBottom:14, cursor:"pointer",
            fontFamily:"inherit",
            boxShadow:"0 3px 20px rgba(0,0,0,0.07)",
            animation:"cfPop 0.4s 0.12s both" }}>
          <div style={{ display:"flex", alignItems:"center",
            gap:16, marginBottom:14 }}>
            <div style={{ width:52, height:52, borderRadius:16,
              background:`${C.teal}18`, border:`1.5px solid ${C.teal}44`,
              display:"flex", alignItems:"center",
              justifyContent:"center", fontSize:24 }}>✨</div>
            <div>
              <div style={{ fontWeight:900, fontSize:18, color:C.ink,
                letterSpacing:-0.3 }}>Experience anbieten</div>
              <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>
                Session · Event · Coaching · Erlebnis
              </div>
            </div>
          </div>
          <p style={{ fontSize:13, color:C.muted, lineHeight:1.65, margin:0 }}>
            Biete deine Zeit, dein Wissen oder ein einzigartiges Erlebnis an.
            Andere buchen direkt bei dir.
          </p>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:14 }}>
            {["Yoga","Fotoshooting","Coaching","Musik","Backen"].map(t=>(
              <span key={t} style={{ background:`${C.teal}14`,
                border:`1px solid ${C.teal}35`,
                borderRadius:999, padding:"3px 10px",
                fontSize:11, fontWeight:600, color:C.teal }}>
                {t}
              </span>
            ))}
          </div>
        </button>

        {/* Both */}
        <button onClick={() => onChoose("both")} className="cf-tap"
          style={{ width:"100%", textAlign:"left",
            background:`linear-gradient(135deg,${C.gold}0A,${C.teal}0A)`,
            border:`1.5px solid rgba(0,0,0,0.07)`, borderRadius:20,
            padding:"16px 22px", cursor:"pointer",
            fontFamily:"inherit",
            animation:"cfPop 0.4s 0.18s both",
            display:"flex", alignItems:"center", gap:14 }}>
          <span style={{ fontSize:20 }}>🌟</span>
          <div>
            <div style={{ fontWeight:800, fontSize:14, color:C.ink }}>
              Beides erstellen
            </div>
            <div style={{ fontSize:12, color:C.muted, marginTop:1 }}>
              Zuerst ein Werk, dann eine Experience
            </div>
          </div>
          <span style={{ marginLeft:"auto", color:C.muted2 }}>›</span>
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   WERK CREATE FLOW (4 steps)
════════════════════════════════════════════════ */
function WerkCreateFlow({ onClose, onPublish }) {
  const [step, setStep]   = useState(0);
  const [draft, setDraft] = useState({
    title:"", desc:"", price:"", shipping:"6.90",
    stock:"", countries:["Deutschland","Österreich","Schweiz"],
    images:[], imageFiles:[], category:"",
  });
  const [loading, setLoading]         = useState(false);
  const [done, setDone]               = useState(false);
  const [publishError, setPublishError] = useState(null);
  const scrollRef = useRef(null);

  const up = (k, v) => setDraft(d => ({...d, [k]:v}));

  const CATS = ["Kunst","Design","Fotografie","Handwerk","Keramik",
                "Holz","Textil","Schmuck","Digital","Sonstiges"];
  const COUNTRIES = ["Deutschland","Österreich","Schweiz","Europa","Weltweit"];

  if(done) return (
    <div className="cf-scroll" style={{ position:"fixed", inset:0,
      zIndex:360, background:C.warm, display:"flex",
      flexDirection:"column", alignItems:"center",
      justifyContent:"center", padding:"40px 24px",
      textAlign:"center" }}>
      <style>{CSS}</style>
      <div style={{ fontSize:56, marginBottom:20,
        animation:"cfPop 0.5s both" }}>🎨</div>
      <div style={{ fontWeight:900, fontSize:24, color:C.ink,
        letterSpacing:-0.5, marginBottom:8 }}>
        Dein Werk lebt
      </div>
      <div style={{ fontSize:14, color:C.muted, lineHeight:1.75,
        maxWidth:260, margin:"0 auto 32px" }}>
        Es erscheint jetzt im Feed, auf deinem Profil
        und kann direkt gekauft werden.
      </div>
      <div style={{ background:C.card, borderRadius:22,
        padding:"18px 20px", marginBottom:28, width:"100%", maxWidth:320,
        border:`1px solid ${C.border}`,
        boxShadow:"0 2px 14px rgba(0,0,0,0.05)" }}>
        <div style={{ fontWeight:800, fontSize:16, color:C.ink,
          marginBottom:4 }}>{draft.title}</div>
        <div style={{ fontSize:22, fontWeight:900, color:C.gold }}>
          € {draft.price}</div>
        <div style={{ fontSize:12, color:C.muted, marginTop:6,
          padding:"8px 12px", background:`${C.green}08`,
          borderRadius:10, border:`1px solid ${C.green}22` }}>
          🌱 € {(parseFloat(draft.price||0)*0.025).toFixed(2)} gehen in ein Herzensprojekt
        </div>
      </div>
      <button onClick={onClose} className="cf-tap"
        style={{ width:"100%", maxWidth:320, padding:"16px",
          background:`linear-gradient(135deg,${C.gold},#E8951A)`,
          border:"none", borderRadius:18, color:"white",
          fontSize:15, fontWeight:800, cursor:"pointer",
          fontFamily:"inherit",
          boxShadow:"0 5px 20px rgba(245,166,35,0.3)" }}>
        Im Feed entdecken
      </button>
    </div>
  );

  const handlePublish = async (draft_mode=false) => {
    setLoading(true);
    setPublishError(null);
    console.log("[HUI] handlePublish gestartet", { draft_mode, draft });

    try {
      // Auth check
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      console.log("[HUI] Auth:", { user: user?.id, authErr });
      if (authErr || !user) throw new Error("Nicht eingeloggt — bitte neu anmelden");

      // 1. Bilder hochladen
      const uploadedUrls = [];
      const imageFiles = draft.imageFiles || [];
      console.log("[HUI] imageFiles:", imageFiles.length);

      console.log("[HUI] imageFiles vor Upload:", imageFiles.length, imageFiles);
      for (const img of imageFiles) {
        if (!img?.file) {
          console.warn("[HUI] ⚠ img.file fehlt:", img);
          continue;
        }
        const ext = (img.file.name?.split(".").pop()) || "jpg";
        const path = `${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        console.log("[HUI] → Storage upload:", path, img.file.size, "bytes");

        const { data: upData, error: uploadErr } = await supabase.storage
          .from("works")
          .upload(path, img.file, { contentType: img.file.type, upsert: false });

        console.log("[HUI] ← Storage result:", { upData, uploadErr });
        if (uploadErr) throw new Error("Storage Upload Fehler: " + uploadErr.message);

        const { data: urlData } = supabase.storage.from("works").getPublicUrl(path);
        console.log("[HUI] publicUrl:", urlData?.publicUrl);
        uploadedUrls.push(urlData.publicUrl);
      }
      console.log("[HUI] uploadedUrls:", uploadedUrls);

      // 2. INSERT payload bauen
      const payload = {
        user_id: user.id,
        title: draft.title?.trim() || "Ohne Titel",
        description: draft.desc?.trim() || "",
        price: parseFloat(draft.price) || 0,
        category: draft.category || null,
        images: uploadedUrls,
        cover_url: uploadedUrls[0] || null,
        status: draft_mode ? "draft" : "published",
        mood_tags:     Array.isArray(draft.moodTags) && draft.moodTags.length > 0 ? draft.moodTags : null,
        energy_level:  draft.energyLevel  || null,
        social_energy: draft.socialEnergy || null,
      };
      console.log("[HUI] INSERT payload:", JSON.stringify(payload, null, 2));

      // 3. INSERT ausführen
      const { data: insertData, error: insertErr } = await supabase
        .from("works")
        .insert(payload)
        .select();

      console.log("[HUI] INSERT response:", { insertData, insertErr });

      if (insertErr) {
        throw new Error(
          `DB-Fehler (${insertErr.code}): ${insertErr.message}` +
          (insertErr.details ? " | " + insertErr.details : "")
        );
      }
      if (!insertData || insertData.length === 0) {
        throw new Error("Insert ausgeführt aber keine Daten zurück — prüfe RLS Policies");
      }

      console.log("[HUI] ✅ Werk gespeichert:", insertData[0]?.id);

      // 4. Erfolg
      setLoading(false);
      if (!draft_mode) {
        setDone(true);
        onSuccess?.(); // Feed refresh
      } else {
        onClose?.();
      }

    } catch(e) {
      console.error("[HUI] ❌ Publish Fehler:", e);
      setPublishError(e.message || "Unbekannter Fehler");
      setLoading(false);
    }
  };

  return (
    <div className="cf-scroll" ref={scrollRef}
      style={{ position:"fixed", inset:0, zIndex:360, background:C.warm }}>
      <style>{CSS}</style>

      
      {publishError && (
        <div style={{ position:"fixed", top:"max(60px,env(safe-area-inset-top,60px))",
          left:16, right:16, zIndex:500,
          background:"#FFF0EE", border:"2px solid #FF8A6B",
          borderRadius:18, padding:"16px 20px",
          boxShadow:"0 8px 32px rgba(255,138,107,0.35)" }}>
          <div style={{ fontWeight:900, fontSize:14, color:"#E05A3A", marginBottom:6 }}>
            ⚠ Veröffentlichung fehlgeschlagen
          </div>
          <div style={{ fontSize:13, color:"#C04020", lineHeight:1.6 }}>
            {publishError}
          </div>
          <button onClick={() => setPublishError(null)}
            style={{ marginTop:10, fontSize:12, fontWeight:700,
              color:"#FF8A6B", background:"none", border:"none",
              cursor:"pointer", padding:0 }}>
            Schließen ✕
          </button>
        </div>
      )}

      {loading && (
        <div style={{ position:"fixed", inset:0, zIndex:400,
          background:"rgba(249,246,242,0.9)", backdropFilter:"blur(8px)",
          display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center", gap:14 }}>
          <div style={{ width:34, height:34, borderRadius:"50%",
            border:`3px solid ${C.gold}30`,
            borderTop:`3px solid ${C.gold}`,
            animation:"cfSpin 0.8s linear infinite" }}/>
          <div style={{ fontSize:13, color:C.muted }}>
            Wird veröffentlicht…
          </div>
        </div>
      )}

      <BackBtn onBack={() => step>0?setStep(s=>s-1):onClose()}
        onClose={onClose} step={step} total={4}/>

      <div style={{ padding:"0 20px 120px" }}>

        {/* STEP 0 — Basics */}
        {step===0 && (
          <div style={{ animation:"cfUp 0.35s both" }}>
            <div style={{ marginBottom:24 }}>
              <div style={{ fontWeight:900, fontSize:22, color:C.ink,
                letterSpacing:-0.4 }}>Dein Werk</div>
              <div style={{ fontSize:13, color:C.muted, marginTop:3 }}>
                Was hast du geschaffen?
              </div>
            </div>

            {/* Category chips */}
            <Field label="Kategorie">
              <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
                {CATS.map(c => (
                  <button key={c} onClick={() => up("category",c)}
                    className="cf-tap"
                    style={{ padding:"7px 14px", borderRadius:999,
                      background:draft.category===c
                        ? `linear-gradient(135deg,${C.gold}33,${C.gold}18)`
                        : C.card,
                      border:`1.5px solid ${draft.category===c?C.gold:C.border}`,
                      fontSize:12.5, fontWeight:draft.category===c?700:500,
                      color:draft.category===c?C.gold:C.muted,
                      cursor:"pointer", fontFamily:"inherit",
                      transition:"all 0.18s" }}>
                    {c}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Titel">
              <TInput value={draft.title} onChange={v=>up("title",v)}
                placeholder="z.B. Keramik Vase Handgemacht"/>
            </Field>

            <Field label="Beschreibung">
              <TArea value={draft.desc} onChange={v=>up("desc",v)} rows={4}
                placeholder="Erzähl die Geschichte hinter diesem Werk…"/>
            </Field>
          </div>
        )}

        {/* STEP 1 — Preis + Versand */}
        {step===1 && (
          <div style={{ animation:"cfUp 0.35s both" }}>
            <div style={{ marginBottom:24 }}>
              <div style={{ fontWeight:900, fontSize:22, color:C.ink,
                letterSpacing:-0.4 }}>Preis & Versand</div>
              <div style={{ fontSize:13, color:C.muted, marginTop:3 }}>
                Was soll dein Werk kosten?
              </div>
            </div>

            <Field label="Preis">
              <TInput value={draft.price} onChange={v=>up("price",v)}
                type="number" placeholder="89" prefix="€"/>
            </Field>

            {/* Impact preview */}
            {draft.price && (
              <div style={{ padding:"12px 16px", borderRadius:14,
                background:"rgba(61,184,122,0.07)",
                border:"1px solid rgba(61,184,122,0.14)",
                marginBottom:18, display:"flex", gap:8, alignItems:"center",
                animation:"cfUp 0.3s both" }}>
                <span style={{ fontSize:15 }}>🌱</span>
                <span style={{ fontSize:12.5, color:"#3DB87A", lineHeight:1.5 }}>
                  € {(parseFloat(draft.price)*0.025).toFixed(2)} fließen automatisch
                  in Impact-Projekte — ohne Aufpreis für dich.
                </span>
              </div>
            )}

            <Field label="Versandkosten" note="Wird dem Kunden separat angezeigt">
              <TInput value={draft.shipping} onChange={v=>up("shipping",v)}
                type="number" placeholder="6.90" prefix="€"/>
            </Field>

            <Field label="Bestand (optional)">
              <TInput value={draft.stock} onChange={v=>up("stock",v)}
                type="number" placeholder="z.B. 3 (leer = unbegrenzt)"/>
            </Field>

            <Field label="Versand nach">
              <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
                {COUNTRIES.map(c => {
                  const sel = draft.countries.includes(c);
                  return (
                    <button key={c} onClick={() =>
                      up("countries", sel
                        ? draft.countries.filter(x=>x!==c)
                        : [...draft.countries,c])}
                      className="cf-tap"
                      style={{ padding:"7px 14px", borderRadius:999,
                        background: sel ? `${C.teal}18` : C.card,
                        border:`1.5px solid ${sel?C.teal:C.border}`,
                        fontSize:12.5, fontWeight:sel?700:500,
                        color:sel?C.teal:C.muted,
                        cursor:"pointer", fontFamily:"inherit",
                        transition:"all 0.18s" }}>
                      {c}
                    </button>
                  );
                })}
              </div>
            </Field>
          </div>
        )}

        {/* STEP 2 — Bilder */}
        {step===2 && (
          <div style={{ animation:"cfUp 0.35s both" }}>
            <div style={{ marginBottom:24 }}>
              <div style={{ fontWeight:900, fontSize:22, color:C.ink,
                letterSpacing:-0.4 }}>Zeig dein Werk</div>
              <div style={{ fontSize:13, color:C.muted, marginTop:3 }}>
                Bilder sagen mehr als tausend Worte.
              </div>
            </div>

            {/* Upload area */}
            <div style={{ borderRadius:22, border:`2px dashed ${C.border}`,
              padding:"40px 24px", textAlign:"center", marginBottom:20,
              background:"rgba(22,215,197,0.02)",
              cursor:"pointer" }}
              onClick={() => document.getElementById("cf-img-input").click()}>
              <div style={{ fontSize:36, marginBottom:12, opacity:0.4 }}>📷</div>
              <div style={{ fontWeight:700, fontSize:14, color:C.ink,
                marginBottom:4 }}>
                Fotos hinzufügen
              </div>
              <div style={{ fontSize:12, color:C.muted }}>
                JPG, PNG, WebP · bis 10 MB
              </div>
              <input id="cf-img-input" type="file" multiple
                accept="image/*" style={{ display:"none" }}
                onChange={e => {
                  const files = Array.from(e.target.files);
                  console.log("[HUI] Files ausgewählt:", files.length, files.map(f=>f.name));
                  const previews = files.map(f => URL.createObjectURL(f));
                  // File-Objekte für echten Upload speichern
                  const fileObjs = files.map(f => ({ file: f, previewUrl: URL.createObjectURL(f) }));
                  up("imageFiles", [...(draft.imageFiles||[]), ...fileObjs]);
                  up("images", [...draft.images, ...previews]);
                  console.log("[HUI] imageFiles nach Auswahl:", [...(draft.imageFiles||[]), ...fileObjs].length);
                }}/>
            </div>

            {/* Preview grid */}
            {draft.images.length > 0 && (
              <div style={{ display:"grid",
                gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
                {draft.images.map((url, i) => (
                  <div key={i} style={{ position:"relative",
                    borderRadius:14, overflow:"hidden",
                    aspectRatio:"1" }}>
                    <img src={url} alt=""
                      style={{ width:"100%", height:"100%",
                        objectFit:"cover" }}/>
                    <button onClick={() =>
                      up("images", draft.images.filter((_,j)=>j!==i))}
                      style={{ position:"absolute", top:5, right:5,
                        width:22, height:22, borderRadius:"50%",
                        background:"rgba(0,0,0,0.55)",
                        border:"none", color:"white", fontSize:11,
                        cursor:"pointer", lineHeight:1 }}>✕</button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop:20, padding:"14px 16px",
              borderRadius:16, background:C.tealPale,
              border:`1px solid ${C.teal}22` }}>
              <div style={{ fontSize:12.5, color:C.teal, lineHeight:1.65 }}>
                💡 Tipp: Natürliches Licht, klarer Hintergrund.
                Zeig Details die das Besondere sichtbar machen.
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 — Preview + Publish */}
        {step===3 && (
          <div style={{ animation:"cfUp 0.35s both" }}>
            <div style={{ marginBottom:24 }}>
              <div style={{ fontWeight:900, fontSize:22, color:C.ink,
                letterSpacing:-0.4 }}>Bereit zum Teilen</div>
              <div style={{ fontSize:13, color:C.muted, marginTop:3 }}>
                So sehen dich andere.
              </div>
            </div>

            {/* Feed preview */}
            <div style={{ background:C.card, borderRadius:22,
              overflow:"hidden", marginBottom:20,
              border:`1px solid ${C.border}`,
              boxShadow:"0 4px 20px rgba(0,0,0,0.08)" }}>
              {/* Mock image */}
              <div style={{ height:200,
                background: draft.images[0]
                  ? `url(${draft.images[0]}) center/cover`
                  : `linear-gradient(135deg,${C.gold}22,${C.gold}0A)`,
                display:"flex", alignItems:"center",
                justifyContent:"center" }}>
                {!draft.images[0] && (
                  <span style={{ fontSize:40, opacity:0.3 }}>🎨</span>
                )}
              </div>
              <div style={{ padding:"16px 18px" }}>
                {/* Coral werk badge */}
                <div style={{ display:"flex", alignItems:"center",
                  gap:6, marginBottom:8 }}>
                  <div style={{ width:8, height:8, borderRadius:2,
                    background:C.coral }}/>
                  <span style={{ fontSize:10, fontWeight:700,
                    color:C.coral, letterSpacing:1.2,
                    textTransform:"uppercase" }}>Werk</span>
                </div>
                <div style={{ fontWeight:800, fontSize:16, color:C.ink,
                  marginBottom:4 }}>
                  {draft.title || "Dein Werk-Titel"}
                </div>
                <div style={{ fontSize:12, color:C.muted, lineHeight:1.5,
                  marginBottom:12 }}>
                  {draft.desc?.slice(0,80) || "Deine Beschreibung…"}
                  {draft.desc?.length>80 ? "…" : ""}
                </div>
                <div style={{ display:"flex", alignItems:"center",
                  justifyContent:"space-between" }}>
                  <span style={{ fontWeight:900, fontSize:20, color:C.ink }}>
                    € {draft.price || "—"}
                  </span>
                  <div style={{ background:`linear-gradient(135deg,${C.coral},${C.coral2})`,
                    borderRadius:12, padding:"8px 16px",
                    fontSize:12, fontWeight:800, color:"white" }}>
                    Jetzt kaufen
                  </div>
                </div>
              </div>
            </div>

            {/* ── Emotionales Tagging ── */}
            <div style={{
              marginBottom:18, padding:"14px 16px", borderRadius:18,
              background:"linear-gradient(135deg,rgba(22,215,197,0.04),rgba(167,139,250,0.04))",
              border:"1px solid rgba(0,0,0,0.05)",
            }}>
              <div style={{ fontSize:13, fontWeight:800, color:C.ink, marginBottom:2 }}>
                Wie fühlt sich dein Werk an?
              </div>
              <div style={{ fontSize:11.5, color:C.muted, marginBottom:10 }}>
                Optional — hilft passenden Menschen dich zu entdecken.
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:10 }}>
                {MOOD_TAG_OPTIONS.slice(0,8).map(tag => {
                  const on = (draft.moodTags||[]).includes(tag.key);
                  return (
                    <button key={tag.key} className="cf-tap"
                      onClick={() => up("moodTags",
                        on ? (draft.moodTags||[]).filter(k=>k!==tag.key)
                           : (draft.moodTags||[]).length < 3
                           ? [...(draft.moodTags||[]), tag.key]
                           : (draft.moodTags||[])
                      )}
                      style={{
                        display:"flex", alignItems:"center", gap:5,
                        padding:"6px 12px", borderRadius:999,
                        background: on ? `${tag.color}18` : "rgba(0,0,0,0.04)",
                        border: on ? `1.5px solid ${tag.color}44` : "1.5px solid rgba(0,0,0,0.06)",
                        color: on ? tag.color : C.muted,
                        fontSize:12, fontWeight: on ? 800 : 500,
                        fontFamily:"inherit", cursor:"pointer",
                        transition:"all .18s cubic-bezier(.34,1.3,.64,1)",
                      }}>
                      <span style={{fontSize:13}}>{tag.emoji}</span>{tag.label}
                    </button>
                  );
                })}
              </div>
              <div style={{ display:"flex", gap:6 }}>
                {ENERGY_LEVELS.map(lvl => {
                  const on = draft.energyLevel === lvl.key;
                  return (
                    <button key={lvl.key} className="cf-tap"
                      onClick={() => up("energyLevel", on ? null : lvl.key)}
                      style={{
                        flex:1, padding:"8px 4px", borderRadius:12, textAlign:"center",
                        background: on ? "rgba(22,215,197,0.08)" : "rgba(0,0,0,0.04)",
                        border: on ? "1.5px solid rgba(22,215,197,0.35)" : "1.5px solid rgba(0,0,0,0.06)",
                        fontFamily:"inherit", cursor:"pointer", transition:"all .18s",
                      }}>
                      <div style={{fontSize:14, marginBottom:1}}>{lvl.emoji}</div>
                      <div style={{fontSize:10.5, fontWeight: on ? 800:500,
                        color: on ? "#16D7C5" : C.muted}}>{lvl.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stripe note */}
            <div style={{ padding:"14px 18px", borderRadius:18,
              background:C.tealPale, border:`1px solid ${C.teal}28`,
              marginBottom:20 }}>
              <div style={{ fontWeight:700, fontSize:13, color:C.teal,
                marginBottom:4 }}>💳 Auszahlungen</div>
              <div style={{ fontSize:12.5, color:C.muted, lineHeight:1.6 }}>
                HUI wickelt alle Zahlungen ab. Du bekommst automatisch
                85 % des Verkaufspreises — ohne eigenes Stripe-Konto.
              </div>
            </div>

            {/* Publish + draft */}
            <button onClick={() => handlePublish(false)} className="cf-tap"
              style={{ width:"100%", padding:"17px",
                background:`linear-gradient(135deg,${C.gold},#E8951A)`,
                border:"none", borderRadius:18, color:"white",
                fontSize:15, fontWeight:800, cursor:"pointer",
                fontFamily:"inherit",
                boxShadow:"0 5px 20px rgba(245,166,35,0.32)",
                marginBottom:10 }}>
              Werk veröffentlichen ✓
            </button>
            <button onClick={() => handlePublish(true)} className="cf-tap"
              style={{ width:"100%", padding:"14px",
                background:"none", border:`1.5px solid ${C.border}`,
                borderRadius:18, color:C.muted,
                fontSize:14, fontWeight:600, cursor:"pointer",
                fontFamily:"inherit" }}>
              Als Entwurf speichern
            </button>
          </div>
        )}
      </div>

      {/* Sticky CTA */}
      {step < 3 && (
        <div style={{ position:"fixed", bottom:0, left:0, right:0,
          padding:"14px 20px max(28px,env(safe-area-inset-bottom,28px))",
          background:"rgba(255,249,244,0.95)",
          backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)",
          borderTop:`1px solid ${C.border}` }}>
          <button onClick={() => setStep(s=>s+1)} className="cf-tap"
            disabled={step===0 && !draft.title}
            style={{ width:"100%", padding:"16px",
              background:step===0&&!draft.title ? C.muted2
                : `linear-gradient(135deg,${C.teal},${C.teal2})`,
              border:"none", borderRadius:18, color:"white",
              fontSize:15, fontWeight:800, cursor:"pointer",
              fontFamily:"inherit",
              boxShadow:step===0&&!draft.title?"none":`0 5px 22px ${C.tealGlow}`,
              transition:"all 0.3s" }}>
            Weiter →
          </button>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════
   EXPERIENCE CREATE FLOW (4 steps)
════════════════════════════════════════════════ */
function ExperienceCreateFlow({ onClose, onPublish }) {
  const [step, setStep]   = useState(0);
  const [draft, setDraft] = useState({
    title:"", desc:"", price:"", duration:"60",
    location:"", online:false, inperson:true,
    skills:[], images:[],
    days:{ Mo:true, Di:true, Mi:false, Do:true, Fr:true, Sa:false, So:false },
    slots:["09:00","11:00","14:00","16:00"],
  });
  const [loading, setLoading]           = useState(false);
  const [done, setDone]                 = useState(false);
  const [publishError, setPublishError] = useState(null);
  const scrollRef = useRef(null);

  const up = (k,v) => setDraft(d=>({...d,[k]:v}));

  const SKILLS = ["Fotografie","Yoga","Kochen","Musik","Coaching",
                  "Design","Keramik","Handwerk","Backen","Schreiben",
                  "Programmieren","Malen","Meditation"];
  const DURATIONS = [
    {v:"30",  l:"30 Min"},
    {v:"60",  l:"1 Std"},
    {v:"90",  l:"1,5 Std"},
    {v:"120", l:"2 Std"},
    {v:"180", l:"3 Std"},
    {v:"240", l:"4 Std"},
  ];
  const DAYS = ["Mo","Di","Mi","Do","Fr","Sa","So"];

  if(done) return (
    <div className="cf-scroll" style={{ position:"fixed", inset:0,
      zIndex:360, background:C.warm, display:"flex",
      flexDirection:"column", alignItems:"center",
      justifyContent:"center", padding:"40px 24px",
      textAlign:"center" }}>
      <style>{CSS}</style>
      <div style={{ fontSize:56, marginBottom:20,
        animation:"cfPop 0.5s both" }}>✨</div>
      <div style={{ fontWeight:900, fontSize:24, color:C.ink,
        letterSpacing:-0.5, marginBottom:8 }}>
        Du bist als Wirker aktiv
      </div>
      <div style={{ fontSize:14, color:C.muted, lineHeight:1.75,
        maxWidth:260, margin:"0 auto 28px" }}>
        Andere können dich jetzt finden und direkt buchen.
        Du wirst sofort benachrichtigt.
      </div>
      <div style={{ background:C.card, borderRadius:22,
        padding:"18px 20px", marginBottom:28, width:"100%", maxWidth:320,
        border:`1px solid ${C.border}`,
        boxShadow:"0 2px 14px rgba(0,0,0,0.05)" }}>
        <div style={{ fontWeight:800, fontSize:16, color:C.ink,
          marginBottom:4 }}>{draft.title}</div>
        <div style={{ fontSize:13, color:C.teal, fontWeight:600,
          marginBottom:8 }}>€ {draft.price} / {DURATIONS.find(d=>d.v===draft.duration)?.l || "Stunde"}</div>
        <div style={{ fontSize:12, color:C.muted, padding:"8px 12px",
          background:`${C.green}08`, borderRadius:10,
          border:`1px solid ${C.green}22` }}>
          🌱 € {(parseFloat(draft.price||0)*0.025).toFixed(2)} Impact pro Buchung
        </div>
      </div>
      <button onClick={onPublish||onClose} className="cf-tap"
        style={{ width:"100%", maxWidth:320, padding:"16px",
          background:`linear-gradient(135deg,${C.teal},${C.teal2})`,
          border:"none", borderRadius:18, color:"white",
          fontSize:15, fontWeight:800, cursor:"pointer",
          fontFamily:"inherit",
          boxShadow:`0 5px 20px ${C.tealGlow}` }}>
        Im Feed entdecken
      </button>
    </div>
  );

  const handlePublish = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if(user) {
        await supabase.from("experiences").insert({
          user_id: user.id,
          title: draft.title,
          description: draft.desc,
          price_eur: parseFloat(draft.price)||0,
          duration_min: parseInt(draft.duration)||60,
          location: draft.location,
          is_online: draft.online,
          is_inperson: draft.inperson,
          skills: draft.skills,
          availability_days: Object.entries(draft.days)
            .filter(([,v])=>v).map(([k])=>k),
          available_slots: draft.slots,
          status:"published",
        });
      }
    } catch(e) {}
    setLoading(false);
    setDone(true);
  };

  return (
    <div className="cf-scroll" ref={scrollRef}
      style={{ position:"fixed", inset:0, zIndex:360, background:C.warm }}>
      <style>{CSS}</style>

      
      {publishError && (
        <div style={{ position:"fixed", top:"max(60px,env(safe-area-inset-top,60px))",
          left:16, right:16, zIndex:500,
          background:"#FFF0EE", border:"2px solid #FF8A6B",
          borderRadius:18, padding:"16px 20px",
          boxShadow:"0 8px 32px rgba(255,138,107,0.35)" }}>
          <div style={{ fontWeight:900, fontSize:14, color:"#E05A3A", marginBottom:6 }}>
            ⚠ Veröffentlichung fehlgeschlagen
          </div>
          <div style={{ fontSize:13, color:"#C04020", lineHeight:1.6 }}>
            {publishError}
          </div>
          <button onClick={() => setPublishError(null)}
            style={{ marginTop:10, fontSize:12, fontWeight:700,
              color:"#FF8A6B", background:"none", border:"none",
              cursor:"pointer", padding:0 }}>
            Schließen ✕
          </button>
        </div>
      )}

      {loading && (
        <div style={{ position:"fixed", inset:0, zIndex:400,
          background:"rgba(249,246,242,0.9)", backdropFilter:"blur(8px)",
          display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center", gap:14 }}>
          <div style={{ width:34, height:34, borderRadius:"50%",
            border:`3px solid ${C.teal}30`,
            borderTop:`3px solid ${C.teal}`,
            animation:"cfSpin 0.8s linear infinite" }}/>
          <div style={{ fontSize:13, color:C.muted }}>Wird aktiviert…</div>
        </div>
      )}

      <BackBtn onBack={() => step>0?setStep(s=>s-1):onClose()}
        onClose={onClose} step={step} total={4}/>

      <div style={{ padding:"0 20px 120px" }}>

        {/* STEP 0 — Was bietest du an */}
        {step===0 && (
          <div style={{ animation:"cfUp 0.35s both" }}>
            <div style={{ marginBottom:24 }}>
              <div style={{ fontWeight:900, fontSize:22, color:C.ink,
                letterSpacing:-0.4 }}>Deine Experience</div>
              <div style={{ fontSize:13, color:C.muted, marginTop:3 }}>
                Was kannst du anderen schenken?
              </div>
            </div>

            <Field label="Titel">
              <TInput value={draft.title} onChange={v=>up("title",v)}
                placeholder="z.B. Portrait-Fotoshooting am Abend"/>
            </Field>

            <Field label="Deine Fähigkeiten">
              <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
                {SKILLS.map(s => {
                  const sel = draft.skills.includes(s);
                  return (
                    <button key={s} onClick={() =>
                      up("skills", sel
                        ? draft.skills.filter(x=>x!==s)
                        : [...draft.skills,s])}
                      className="cf-tap"
                      style={{ padding:"7px 14px", borderRadius:999,
                        background:sel?`${C.teal}18`:C.card,
                        border:`1.5px solid ${sel?C.teal:C.border}`,
                        fontSize:12.5, fontWeight:sel?700:500,
                        color:sel?C.teal:C.muted,
                        cursor:"pointer", fontFamily:"inherit",
                        transition:"all 0.18s" }}>
                      {s}
                    </button>
                  );
                })}
              </div>
            </Field>

            <Field label="Beschreibung">
              <TArea value={draft.desc} onChange={v=>up("desc",v)} rows={4}
                placeholder="Was erwartet die Person? Was macht deine Experience einzigartig?"/>
            </Field>
          </div>
        )}

        {/* STEP 1 — Preis + Format */}
        {step===1 && (
          <div style={{ animation:"cfUp 0.35s both" }}>
            <div style={{ marginBottom:24 }}>
              <div style={{ fontWeight:900, fontSize:22, color:C.ink,
                letterSpacing:-0.4 }}>Preis & Format</div>
            </div>

            <Field label="Preis pro Einheit">
              <TInput value={draft.price} onChange={v=>up("price",v)}
                type="number" placeholder="85" prefix="€"/>
            </Field>

            {draft.price && (
              <div style={{ padding:"12px 16px", borderRadius:14,
                background:"rgba(61,184,122,0.07)",
                border:"1px solid rgba(61,184,122,0.14)",
                marginBottom:18, display:"flex", gap:8, alignItems:"center",
                animation:"cfUp 0.3s both" }}>
                <span style={{ fontSize:15 }}>🌱</span>
                <span style={{ fontSize:12.5, color:"#3DB87A", lineHeight:1.5 }}>
                  € {(parseFloat(draft.price)*0.025).toFixed(2)} gehen automatisch
                  in Impact-Projekte.
                  Du bekommst € {(parseFloat(draft.price)*0.85).toFixed(2)}.
                </span>
              </div>
            )}

            <Field label="Dauer">
              <div style={{ display:"grid",
                gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
                {DURATIONS.map(d => (
                  <button key={d.v} onClick={() => up("duration",d.v)}
                    className="cf-tap"
                    style={{ padding:"12px 8px", borderRadius:14,
                      background:draft.duration===d.v
                        ? `${C.teal}18` : C.card,
                      border:`1.5px solid ${draft.duration===d.v?C.teal:C.border}`,
                      fontSize:13, fontWeight:draft.duration===d.v?800:500,
                      color:draft.duration===d.v?C.teal:C.muted,
                      cursor:"pointer", fontFamily:"inherit",
                      transition:"all 0.18s" }}>
                    {d.l}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Format">
              <div style={{ display:"grid",
                gridTemplateColumns:"1fr 1fr", gap:10 }}>
                {[
                  {k:"inperson", icon:"📍", l:"Vor Ort"},
                  {k:"online",   icon:"💻", l:"Online"},
                ].map(opt => (
                  <button key={opt.k}
                    onClick={() => up(opt.k, !draft[opt.k])}
                    className="cf-tap"
                    style={{ padding:"14px", borderRadius:16,
                      background:draft[opt.k]?`${C.teal}14`:C.card,
                      border:`2px solid ${draft[opt.k]?C.teal:C.border}`,
                      cursor:"pointer", fontFamily:"inherit",
                      transition:"all 0.2s",
                      display:"flex", alignItems:"center",
                      gap:8, justifyContent:"center" }}>
                    <span>{opt.icon}</span>
                    <span style={{ fontSize:13,
                      fontWeight:draft[opt.k]?700:500,
                      color:draft[opt.k]?C.teal:C.muted }}>
                      {opt.l}
                    </span>
                  </button>
                ))}
              </div>
            </Field>

            {draft.inperson && (
              <Field label="Standort / Stadt"
                note="Wird auf der Karte angezeigt">
                <TInput value={draft.location}
                  onChange={v=>up("location",v)}
                  placeholder="München, Bayern"/>
              </Field>
            )}
          </div>
        )}

        {/* STEP 2 — Verfügbarkeit */}
        {step===2 && (
          <div style={{ animation:"cfUp 0.35s both" }}>
            <div style={{ marginBottom:24 }}>
              <div style={{ fontWeight:900, fontSize:22, color:C.ink,
                letterSpacing:-0.4 }}>Wann bist du da?</div>
              <div style={{ fontSize:13, color:C.muted, marginTop:3 }}>
                Wähle deine verfügbaren Tage und Zeiten.
              </div>
            </div>

            <Field label="Verfügbare Tage">
              <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
                {DAYS.map(d => (
                  <button key={d}
                    onClick={() => up("days",{...draft.days,[d]:!draft.days[d]})}
                    className="cf-tap"
                    style={{ width:42, height:42, borderRadius:13,
                      background:draft.days[d]?`${C.teal}18`:C.card,
                      border:`1.5px solid ${draft.days[d]?C.teal:C.border}`,
                      fontSize:12, fontWeight:draft.days[d]?800:500,
                      color:draft.days[d]?C.teal:C.muted,
                      cursor:"pointer", fontFamily:"inherit",
                      transition:"all 0.18s" }}>
                    {d}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Verfügbare Uhrzeiten"
              note="Diese Slots können Kunden wählen">
              <div style={{ display:"grid",
                gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
                {["08:00","09:00","10:00","11:00","12:00",
                  "13:00","14:00","15:00","16:00","17:00",
                  "18:00","19:00"].map(t => {
                  const sel = draft.slots.includes(t);
                  return (
                    <button key={t}
                      onClick={() => up("slots", sel
                        ? draft.slots.filter(s=>s!==t)
                        : [...draft.slots,t])}
                      className="cf-tap"
                      style={{ padding:"10px 0", borderRadius:12,
                        background:sel?`${C.teal}18`:C.card,
                        border:`1.5px solid ${sel?C.teal:C.border}`,
                        fontSize:12, fontWeight:sel?700:500,
                        color:sel?C.teal:C.muted,
                        cursor:"pointer", fontFamily:"inherit",
                        transition:"all 0.18s" }}>
                      {t}
                    </button>
                  );
                })}
              </div>
            </Field>
          </div>
        )}

        {/* STEP 3 — Vorschau + Publish */}
        {step===3 && (
          <div style={{ animation:"cfUp 0.35s both" }}>
            <div style={{ marginBottom:24 }}>
              <div style={{ fontWeight:900, fontSize:22, color:C.ink,
                letterSpacing:-0.4 }}>Bereit als Wirker</div>
              <div style={{ fontSize:13, color:C.muted, marginTop:3 }}>
                So siehst du aus im Feed.
              </div>
            </div>

            {/* Feed preview */}
            <div style={{ background:C.card, borderRadius:22,
              overflow:"hidden", marginBottom:20,
              border:`1px solid ${C.border}`,
              boxShadow:"0 4px 20px rgba(0,0,0,0.08)" }}>
              <div style={{ height:160,
                background:`linear-gradient(135deg,${C.teal}22,${C.teal}0A)`,
                display:"flex", alignItems:"center",
                justifyContent:"center", fontSize:40 }}>
                ✨
              </div>
              <div style={{ padding:"16px 18px" }}>
                <div style={{ display:"flex", gap:6, alignItems:"center",
                  marginBottom:8 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%",
                    background:C.teal }}/>
                  <span style={{ fontSize:10, fontWeight:700,
                    color:C.teal, letterSpacing:1.2,
                    textTransform:"uppercase" }}>Experience</span>
                </div>
                <div style={{ fontWeight:800, fontSize:16, color:C.ink,
                  marginBottom:8 }}>
                  {draft.title || "Dein Experience-Titel"}
                </div>
                <div style={{ display:"flex", alignItems:"center",
                  justifyContent:"space-between" }}>
                  <div>
                    <span style={{ fontWeight:900, fontSize:18, color:C.ink }}>
                      € {draft.price || "—"}
                    </span>
                    <span style={{ fontSize:12, color:C.muted, marginLeft:4 }}>
                      / {DURATIONS.find(d=>d.v===draft.duration)?.l}
                    </span>
                  </div>
                  <div style={{
                    background:`linear-gradient(135deg,${C.teal},${C.teal2})`,
                    borderRadius:12, padding:"8px 16px",
                    fontSize:12, fontWeight:800, color:"white" }}>
                    Jetzt buchen
                  </div>
                </div>
              </div>
            </div>

            {/* Payout note */}
            <div style={{ padding:"14px 18px", borderRadius:18,
              background:C.tealPale, border:`1px solid ${C.teal}28`,
              marginBottom:20 }}>
              <div style={{ fontWeight:700, fontSize:13, color:C.teal,
                marginBottom:4 }}>💳 Auszahlungen einrichten</div>
              <div style={{ fontSize:12.5, color:C.muted, lineHeight:1.6 }}>
                Sobald du deine erste Buchung erhältst, führen wir dich
                durch die Einrichtung deiner Auszahlungen. Einfach und sicher.
              </div>
            </div>

            <button onClick={handlePublish} className="cf-tap"
              style={{ width:"100%", padding:"17px",
                background:`linear-gradient(135deg,${C.teal},${C.teal2})`,
                border:"none", borderRadius:18, color:"white",
                fontSize:15, fontWeight:800, cursor:"pointer",
                fontFamily:"inherit",
                boxShadow:`0 5px 22px ${C.tealGlow}`,
                marginBottom:10 }}>
              Als Wirker starten ✓
            </button>
            <button onClick={onClose} className="cf-tap"
              style={{ width:"100%", padding:"14px",
                background:"none", border:`1.5px solid ${C.border}`,
                borderRadius:18, color:C.muted,
                fontSize:14, fontWeight:600, cursor:"pointer",
                fontFamily:"inherit" }}>
              Als Entwurf speichern
            </button>
          </div>
        )}
      </div>

      {step < 3 && (
        <div style={{ position:"fixed", bottom:0, left:0, right:0,
          padding:"14px 20px max(28px,env(safe-area-inset-bottom,28px))",
          background:"rgba(255,249,244,0.95)",
          backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)",
          borderTop:`1px solid ${C.border}` }}>
          <button onClick={() => setStep(s=>s+1)} className="cf-tap"
            disabled={step===0 && !draft.title}
            style={{ width:"100%", padding:"16px",
              background:step===0&&!draft.title ? C.muted2
                : `linear-gradient(135deg,${C.teal},${C.teal2})`,
              border:"none", borderRadius:18, color:"white",
              fontSize:15, fontWeight:800, cursor:"pointer",
              fontFamily:"inherit",
              boxShadow:step===0&&!draft.title?"none":`0 5px 22px ${C.tealGlow}`,
              transition:"all 0.3s" }}>
            Weiter →
          </button>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════
   MAIN EXPORT — orchestrates choose → flow
════════════════════════════════════════════════ */
export default function CreateFlowWrapped(props) {
  return (
    <CreateErrorBoundary>
      <CreateFlowInner {...props} />
    </CreateErrorBoundary>
  );
}

function CreateFlowInner({ onClose }) {
  const [mode, setMode] = useState(null); // null | "werk" | "experience" | "both"
  const [bothStep, setBothStep] = useState(0); // for "both": 0=werk, 1=experience

  if(!mode) return (
    <StepChoose
      onChoose={m => {
        if(m==="both") { setMode("both"); }
        else setMode(m);
      }}
      onClose={onClose}
    />
  );

  if(mode==="werk") return (
    <WerkCreateFlow
      onClose={onClose}
      onPublish={onClose}
    />
  );

  if(mode==="experience") return (
    <ExperienceCreateFlow
      onClose={onClose}
      onPublish={onClose}
    />
  );

  // both: first werk, then experience
  if(mode==="both") {
    if(bothStep===0) return (
      <WerkCreateFlow
        onClose={onClose}
        onPublish={() => setBothStep(1)}
      />
    );
    return (
      <ExperienceCreateFlow
        onClose={onClose}
        onPublish={onClose}
      />
    );
  }

  return null;
}