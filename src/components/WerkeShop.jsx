// WerkeShop.jsx — HUI Werk Detail + Direkt-Kauf Flow
// Kaufen, nicht buchen. Warm. Hochwertig. Human.
import React, { useState, useRef, useEffect } from "react";

const C = {
  teal:"#16D7C5", teal2:"#11C5B7", tealPale:"#E6FAF8",
  tealGlow:"rgba(22,215,197,0.22)",
  coral:"#FF8A6B", coral2:"#FF7B72", coralPale:"#FFF2EE",
  coralGlow:"rgba(255,138,107,0.20)",
  gold:"#F5A623", goldPale:"#FFFBEB",
  green:"#3DB87A", greenGlow:"rgba(61,184,122,0.18)",
  cream:"#F9F6F2", warm:"#FFF9F4",
  card:"#FFFFFF", ink:"#1A1A1A", ink2:"#3A3A3A",
  muted:"#888", muted2:"#BBB", border:"rgba(0,0,0,0.06)",
};

const CSS = `
  @keyframes wsUp   { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
  @keyframes wsSheet{ from{opacity:0;transform:translateY(100%)} to{opacity:1;transform:translateY(0)} }
  @keyframes wsCheck{ 0%{transform:scale(0);opacity:0} 60%{transform:scale(1.25)} 100%{transform:scale(1);opacity:1} }
  @keyframes wsSpin { to{transform:rotate(360deg)} }
  @keyframes wsGlow { 0%,100%{box-shadow:0 0 0px transparent} 50%{box-shadow:0 0 20px rgba(22,215,197,0.35)} }
  .ws-scroll::-webkit-scrollbar{display:none}
  .ws-scroll{-ms-overflow-style:none;scrollbar-width:none}
  .ws-tap{transition:transform .17s cubic-bezier(.34,1.4,.64,1);-webkit-tap-highlight-color:transparent}
  .ws-tap:active{transform:scale(.962)}
`;

/* ── WERK DETAIL VIEW ───────────────────────────────────────────────── */
function WerkDetail({ werk, onAddToKorb, onBuyNow, onClose }) {
  const [saved, setSaved] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);
  const price = parseFloat(String(werk.price||"0").replace(/[^0-9.]/g,"")) || 89;
  const impact = Math.round(price * 0.025);

  const images = werk.images || [werk.img].filter(Boolean);

  return (
    <div className="ws-scroll"
      style={{ position:"fixed", inset:0, zIndex:350,
        background:C.warm, overflowY:"auto",
        WebkitOverflowScrolling:"touch" }}>
      <style>{CSS}</style>

      {/* ── Hero image ── */}
      <div style={{ position:"relative", height:"55vh", maxHeight:440,
        overflow:"hidden" }}>
        <img
          src={images[imgIdx] || werk.img}
          alt={werk.title}
          style={{ width:"100%", height:"100%",
            objectFit:"cover", objectPosition:"center",
            filter:"brightness(0.88) saturate(1.12)" }}/>

        {/* Coral top accent — WERK identity */}
        <div style={{ position:"absolute", top:0, left:0, right:0, height:3,
          background:`linear-gradient(90deg,${C.coral},${C.coral}55,transparent)` }}/>

        {/* Gradient bottom */}
        <div style={{ position:"absolute", inset:0,
          background:"linear-gradient(to bottom,transparent 50%,rgba(249,246,242,0.98) 100%)" }}/>

        {/* Top bar */}
        <div style={{ position:"absolute", top:0, left:0, right:0,
          padding:"max(52px,env(safe-area-inset-top,52px)) 20px 0",
          display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <button onClick={onClose} className="ws-tap"
            style={{ width:40, height:40, borderRadius:14,
              background:"rgba(255,255,255,0.88)",
              backdropFilter:"blur(10px)",
              border:"1px solid rgba(255,255,255,0.5)",
              cursor:"pointer", fontSize:16,
              boxShadow:"0 2px 10px rgba(0,0,0,0.10)" }}>←</button>
          <button onClick={() => setSaved(s=>!s)} className="ws-tap"
            style={{ width:40, height:40, borderRadius:14,
              background:"rgba(255,255,255,0.88)",
              backdropFilter:"blur(10px)",
              border:"1px solid rgba(255,255,255,0.5)",
              cursor:"pointer", fontSize:18 }}>
            {saved ? "💙" : "🤍"}
          </button>
        </div>

        {/* Image dots */}
        {images.length > 1 && (
          <div style={{ position:"absolute", bottom:80, left:0, right:0,
            display:"flex", justifyContent:"center", gap:5 }}>
            {images.map((_,i) => (
              <div key={i} onClick={() => setImgIdx(i)}
                style={{ width: i===imgIdx?16:5, height:5, borderRadius:999,
                  background: i===imgIdx?"white":"rgba(255,255,255,0.5)",
                  cursor:"pointer", transition:"all 0.25s" }}/>
            ))}
          </div>
        )}

        {/* Category badge */}
        <div style={{ position:"absolute", bottom:20, left:20 }}>
          <div style={{ background:"rgba(255,138,107,0.15)",
            backdropFilter:"blur(10px)",
            border:"1px solid rgba(255,138,107,0.35)",
            borderRadius:999, padding:"4px 13px",
            fontSize:9, color:C.coral, fontWeight:800,
            letterSpacing:1.8, textTransform:"uppercase" }}>
            {werk.category || "Werk"}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ padding:"4px 22px 140px",
        animation:"wsUp 0.4s 0.1s both" }}>

        {/* Title + creator */}
        <div style={{ marginBottom:6 }}>
          <div style={{ fontWeight:900, fontSize:24, color:C.ink,
            letterSpacing:-0.5, lineHeight:1.15 }}>{werk.title}</div>
          <div style={{ fontSize:13, color:C.coral,
            fontWeight:700, marginTop:4 }}>
            von {werk.creator}
          </div>
          <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>
            📍 {werk.city || "Deutschland"}
          </div>
        </div>

        {/* Price block */}
        <div style={{ background:C.card, borderRadius:22,
          padding:"18px 20px", marginBottom:18,
          border:`1px solid ${C.border}`,
          boxShadow:"0 2px 14px rgba(0,0,0,0.05)" }}>
          <div style={{ display:"flex", alignItems:"baseline",
            justifyContent:"space-between", marginBottom:12 }}>
            <div>
              <span style={{ fontWeight:900, fontSize:30, color:C.ink }}>
                {werk.price || `€ ${price}`}
              </span>
            </div>
            <div style={{ fontSize:12, color:C.muted }}>
              zzgl. Versand
            </div>
          </div>
          {/* Shipping row */}
          <div style={{ display:"flex", justifyContent:"space-between",
            padding:"8px 0", borderTop:`1px solid ${C.border}` }}>
            <span style={{ fontSize:12, color:C.muted }}>🚚 Versand</span>
            <span style={{ fontSize:12, fontWeight:600, color:C.ink }}>
              {werk.shipping || "€ 6,90 · 3–5 Werktage"}
            </span>
          </div>
          {/* Stock */}
          {werk.stock !== undefined && (
            <div style={{ display:"flex", justifyContent:"space-between",
              padding:"8px 0", borderTop:`1px solid ${C.border}` }}>
              <span style={{ fontSize:12, color:C.muted }}>📦 Verfügbar</span>
              <span style={{ fontSize:12, fontWeight:600,
                color: werk.stock <= 3 ? C.coral : C.green }}>
                {werk.stock <= 3 ? `Nur noch ${werk.stock}` : "Auf Lager"}
              </span>
            </div>
          )}
          {/* Impact */}
          <div style={{ marginTop:10, padding:"10px 14px", borderRadius:14,
            background:"rgba(61,184,122,0.07)",
            border:"1px solid rgba(61,184,122,0.14)",
            display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:14 }}>🌱</span>
            <span style={{ fontSize:11.5, color:"#3DB87A", lineHeight:1.5 }}>
              <strong>€ {impact}</strong> dieses Kaufs fließen in ein Projekt mit Herz.
            </span>
          </div>
        </div>

        {/* Description */}
        {(werk.desc || werk.bio || werk.description) && (
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:12, fontWeight:700, color:C.muted,
              letterSpacing:1.5, textTransform:"uppercase",
              marginBottom:8 }}>Über dieses Werk</div>
            <p style={{ fontSize:14, color:C.ink2, lineHeight:1.75,
              margin:0 }}>
              {werk.desc || werk.bio || werk.description}
            </p>
          </div>
        )}

        {/* Creator info */}
        <div style={{ background:C.card, borderRadius:20,
          padding:"16px 18px", marginBottom:20,
          border:`1px solid ${C.border}`,
          boxShadow:"0 2px 10px rgba(0,0,0,0.04)",
          display:"flex", alignItems:"center", gap:14 }}>
          {werk.creatorImg && (
            <img src={werk.creatorImg}
              style={{ width:48, height:48, borderRadius:14,
                objectFit:"cover", objectPosition:"top" }}/>
          )}
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, fontSize:14, color:C.ink }}>
              {werk.creator}
            </div>
            <div style={{ fontSize:11.5, color:C.muted, marginTop:2 }}>
              {werk.creatorTalent || "Kreativschaffende/r"} · 📍 {werk.city||"Deutschland"}
            </div>
          </div>
          <div style={{ fontSize:13, color:C.muted2 }}>›</div>
        </div>
      </div>

      {/* ── Sticky buy bar ── */}
      <div style={{ position:"fixed", bottom:0, left:0, right:0,
        padding:"14px 20px max(28px,env(safe-area-inset-bottom,28px))",
        background:"rgba(255,249,244,0.94)",
        backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)",
        borderTop:`1px solid ${C.border}`,
        display:"flex", gap:10 }}>

        {/* Werkekorb */}
        <button onClick={() => onAddToKorb(werk)} className="ws-tap"
          style={{ flex:1, padding:"15px",
            background:C.card,
            border:`1.5px solid ${C.coral}55`,
            borderRadius:16, color:C.coral,
            fontSize:14, fontWeight:800,
            cursor:"pointer", fontFamily:"inherit",
            boxShadow:"0 2px 10px rgba(0,0,0,0.05)" }}>
          In den Werkekorb
        </button>

        {/* Jetzt kaufen */}
        <button onClick={() => onBuyNow(werk)} className="ws-tap"
          style={{ flex:1.4, padding:"15px",
            background:`linear-gradient(135deg,${C.coral},${C.coral2})`,
            border:"none", borderRadius:16,
            color:"white", fontSize:14, fontWeight:800,
            cursor:"pointer", fontFamily:"inherit",
            boxShadow:`0 4px 18px ${C.coralGlow}` }}>
          Jetzt kaufen
        </button>
      </div>
    </div>
  );
}

/* ── WERK CHECKOUT FLOW (5 steps) ──────────────────────────────────── */
function WerkCheckout({ werk, items, onClose, onSuccess }) {
  const [step, setStep] = useState(0);
  const [addr, setAddr] = useState({ name:"", street:"", city:"", zip:"", country:"Deutschland" });
  const [ship, setShip] = useState("standard");
  const [done, setDone] = useState(false);

  const price    = items.reduce((s,w) => s + (parseFloat(String(w.price||"0").replace(/[^0-9.]/g,""))||89), 0);
  const shipCost = ship==="express" ? 12.9 : 6.9;
  const impact   = Math.round(price * 0.025 * 100)/100;
  const total    = Math.round((price + shipCost) * 100)/100;

  const scrollRef = useRef(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({top:0, behavior:"smooth"});
  }, [step]);

  if(done) return (
    <div className="ws-scroll" ref={scrollRef}
      style={{ position:"fixed", inset:0, zIndex:400,
        background:C.warm, overflowY:"auto",
        display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center",
        padding:"40px 24px", textAlign:"center" }}>
      <style>{CSS}</style>
      <div style={{ width:80, height:80, borderRadius:"50%",
        background:`linear-gradient(135deg,${C.coral},${C.coral2})`,
        display:"flex", alignItems:"center",
        justifyContent:"center", fontSize:34,
        boxShadow:`0 6px 28px ${C.coralGlow}`,
        animation:"wsCheck 0.6s both",
        margin:"0 auto 24px" }}>✓</div>
      <div style={{ fontWeight:900, fontSize:24, color:C.ink,
        letterSpacing:-0.5, marginBottom:8 }}>
        Dein Werk ist unterwegs
      </div>
      <div style={{ fontSize:14, color:C.muted, lineHeight:1.75,
        maxWidth:270, margin:"0 auto 28px" }}>
        {werk?.creator || items[0]?.creator} beginnt direkt mit der Vorbereitung.
        Du bekommst eine Bestätigung per E-Mail.
      </div>
      {/* Impact receipt */}
      <div style={{ width:"100%", maxWidth:340,
        background:C.card, borderRadius:22,
        padding:"18px 20px", marginBottom:28,
        border:`1px solid ${C.border}`,
        boxShadow:"0 2px 14px rgba(0,0,0,0.05)" }}>
        <div style={{ display:"flex", alignItems:"center",
          gap:8, marginBottom:10 }}>
          <span style={{ fontSize:16 }}>🌱</span>
          <span style={{ fontWeight:800, fontSize:14, color:C.ink }}>
            Dein Impact Beitrag
          </span>
        </div>
        <div style={{ fontWeight:900, fontSize:24, color:"#3DB87A" }}>
          € {impact}
        </div>
        <div style={{ fontSize:12, color:C.muted, marginTop:4, lineHeight:1.5 }}>
          fließen aus diesem Kauf in ein Projekt mit Herz.
          Danke, dass du Teil davon bist.
        </div>
      </div>
      <button onClick={onSuccess || onClose} className="ws-tap"
        style={{ width:"100%", maxWidth:340, padding:"16px",
          background:`linear-gradient(135deg,${C.coral},${C.coral2})`,
          border:"none", borderRadius:18, color:"white",
          fontSize:15, fontWeight:800, cursor:"pointer",
          fontFamily:"inherit", boxShadow:`0 5px 20px ${C.coralGlow}` }}>
        Zurück entdecken
      </button>
    </div>
  );

  return (
    <div className="ws-scroll" ref={scrollRef}
      style={{ position:"fixed", inset:0, zIndex:400,
        background:C.warm, overflowY:"auto",
        WebkitOverflowScrolling:"touch" }}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center",
        justifyContent:"space-between",
        padding:"max(52px,env(safe-area-inset-top,52px)) 20px 16px" }}>
        <button onClick={() => step>0 ? setStep(step-1) : onClose()}
          className="ws-tap"
          style={{ width:40, height:40, borderRadius:14,
            background:C.card, border:`1px solid ${C.border}`,
            cursor:"pointer", fontSize:16,
            boxShadow:"0 2px 10px rgba(0,0,0,0.06)" }}>←</button>
        <div style={{ display:"flex", gap:5 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ width:i===step?18:6, height:6,
              borderRadius:999,
              background:i===step?C.coral:i<step?`${C.coral}66`:C.muted2,
              transition:"all 0.3s cubic-bezier(.34,1.4,.64,1)" }}/>
          ))}
        </div>
        <button onClick={onClose} className="ws-tap"
          style={{ background:"none", border:"none", cursor:"pointer",
            fontSize:12, fontWeight:600, color:C.muted, padding:"8px" }}>
          Abbrechen
        </button>
      </div>

      <div style={{ padding:"0 20px 40px" }}>

        {/* STEP 0 — Versand ─────────────────────────────────────── */}
        {step === 0 && (
          <div style={{ animation:"wsUp 0.4s both" }}>
            <div style={{ textAlign:"center", paddingBottom:24 }}>
              <div style={{ fontWeight:900, fontSize:22, color:C.ink,
                letterSpacing:-0.5 }}>Wie soll es ankommen?</div>
              <div style={{ fontSize:13, color:C.muted, marginTop:4 }}>
                Wähle deine Versandoption
              </div>
            </div>

            {/* Items summary */}
            <div style={{ marginBottom:20 }}>
              {items.map((w,i) => (
                <div key={i} style={{ display:"flex", gap:14,
                  background:C.card, borderRadius:18,
                  padding:"14px 16px", marginBottom:10,
                  border:`1px solid ${C.border}`,
                  boxShadow:"0 2px 10px rgba(0,0,0,0.04)" }}>
                  <img src={w.img} alt={w.title}
                    style={{ width:56, height:56, borderRadius:12,
                      objectFit:"cover",
                      filter:"brightness(0.9) saturate(1.1)" }}/>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:14, color:C.ink }}>
                      {w.title}</div>
                    <div style={{ fontSize:12, color:C.coral,
                      fontWeight:600, marginTop:2 }}>{w.creator}</div>
                    <div style={{ fontSize:13, fontWeight:800,
                      color:C.ink, marginTop:4 }}>{w.price}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Shipping options */}
            {[
              { id:"standard", label:"Standard Versand", note:"3–5 Werktage", price:"€ 6,90", icon:"📦" },
              { id:"express",  label:"Express Versand",  note:"1–2 Werktage", price:"€ 12,90", icon:"⚡" },
            ].map(opt => (
              <button key={opt.id} onClick={() => setShip(opt.id)}
                className="ws-tap"
                style={{ width:"100%", display:"flex",
                  alignItems:"center", gap:14,
                  background: ship===opt.id
                    ? `linear-gradient(135deg,${C.coral}15,${C.coral2}0A)`
                    : C.card,
                  border:`2px solid ${ship===opt.id ? C.coral : C.border}`,
                  borderRadius:18, padding:"16px 18px",
                  cursor:"pointer", fontFamily:"inherit",
                  marginBottom:10,
                  boxShadow: ship===opt.id
                    ? `0 3px 14px ${C.coralGlow}` : "0 2px 8px rgba(0,0,0,0.04)",
                  transition:"all 0.2s", textAlign:"left" }}>
                <span style={{ fontSize:24 }}>{opt.icon}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:14,
                    color:ship===opt.id?C.coral:C.ink }}>{opt.label}</div>
                  <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>
                    {opt.note}</div>
                </div>
                <div style={{ fontWeight:800, fontSize:14,
                  color:ship===opt.id?C.coral:C.ink }}>{opt.price}</div>
              </button>
            ))}

            <button onClick={() => setStep(1)} className="ws-tap"
              style={{ width:"100%", padding:"17px",
                background:`linear-gradient(135deg,${C.coral},${C.coral2})`,
                border:"none", borderRadius:18, color:"white",
                fontSize:15, fontWeight:800, cursor:"pointer",
                fontFamily:"inherit", boxShadow:`0 5px 22px ${C.coralGlow}`,
                marginTop:16 }}>
              Weiter zur Adresse
            </button>
          </div>
        )}

        {/* STEP 1 — Adresse ─────────────────────────────────────── */}
        {step === 1 && (
          <div style={{ animation:"wsUp 0.4s both" }}>
            <div style={{ textAlign:"center", paddingBottom:24 }}>
              <div style={{ fontWeight:900, fontSize:22, color:C.ink,
                letterSpacing:-0.5 }}>Wohin soll es?</div>
              <div style={{ fontSize:13, color:C.muted, marginTop:4 }}>
                Deine Lieferadresse
              </div>
            </div>

            {[
              { key:"name",    label:"Name",   placeholder:"Max Mustermann" },
              { key:"street",  label:"Straße + Nr.",  placeholder:"Musterstraße 1" },
              { key:"zip",     label:"PLZ",    placeholder:"80331" },
              { key:"city",    label:"Stadt",  placeholder:"München" },
              { key:"country", label:"Land",   placeholder:"Deutschland" },
            ].map(f => (
              <div key={f.key} style={{ marginBottom:14 }}>
                <div style={{ fontSize:11, fontWeight:700, color:C.muted,
                  letterSpacing:1.3, textTransform:"uppercase",
                  marginBottom:6 }}>{f.label}</div>
                <input
                  value={addr[f.key]} placeholder={f.placeholder}
                  onChange={e => setAddr(a => ({...a, [f.key]:e.target.value}))}
                  style={{ width:"100%", background:C.card,
                    border:`1.5px solid ${C.border}`, borderRadius:14,
                    padding:"13px 16px", fontSize:14, color:C.ink,
                    fontFamily:"inherit", outline:"none",
                    boxSizing:"border-box",
                    boxShadow:"0 2px 8px rgba(0,0,0,0.04)",
                    transition:"border-color 0.2s" }}
                  onFocus={e => e.target.style.borderColor=C.coral}
                  onBlur={e => e.target.style.borderColor=C.border}
                />
              </div>
            ))}

            <button
              onClick={() => setStep(2)}
              disabled={!addr.name||!addr.street||!addr.city||!addr.zip}
              className="ws-tap"
              style={{ width:"100%", padding:"17px", marginTop:8,
                background: (addr.name&&addr.street&&addr.city&&addr.zip)
                  ? `linear-gradient(135deg,${C.coral},${C.coral2})` : C.muted2,
                border:"none", borderRadius:18, color:"white",
                fontSize:15, fontWeight:800, cursor:"pointer",
                fontFamily:"inherit",
                boxShadow: (addr.name&&addr.street&&addr.city&&addr.zip)
                  ? `0 5px 22px ${C.coralGlow}` : "none",
                transition:"all 0.3s" }}>
              Zur Übersicht
            </button>
          </div>
        )}

        {/* STEP 2 — Übersicht + Kauf ────────────────────────────── */}
        {step === 2 && (
          <div style={{ animation:"wsUp 0.4s both" }}>
            <div style={{ textAlign:"center", paddingBottom:24 }}>
              <div style={{ fontWeight:900, fontSize:22, color:C.ink,
                letterSpacing:-0.5 }}>Deine Bestellung</div>
              <div style={{ fontSize:13, color:C.muted, marginTop:4 }}>
                Alles stimmt so?
              </div>
            </div>

            {/* Summary */}
            <div style={{ background:C.card, borderRadius:22,
              padding:"20px 20px", marginBottom:16,
              border:`1px solid ${C.border}`,
              boxShadow:"0 2px 14px rgba(0,0,0,0.05)" }}>

              {/* Items */}
              {items.map((w,i) => (
                <div key={i} style={{ display:"flex", gap:12,
                  paddingBottom:12,
                  borderBottom:i<items.length-1?`1px solid ${C.border}`:"none",
                  marginBottom:i<items.length-1?12:0 }}>
                  <img src={w.img} alt={w.title}
                    style={{ width:44, height:44, borderRadius:10,
                      objectFit:"cover" }}/>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:C.ink }}>
                      {w.title}</div>
                    <div style={{ fontSize:11, color:C.muted }}>
                      {w.creator}</div>
                  </div>
                  <div style={{ fontWeight:800, fontSize:13, color:C.ink }}>
                    {w.price}
                  </div>
                </div>
              ))}

              {/* Price breakdown */}
              <div style={{ marginTop:16, paddingTop:14,
                borderTop:`1px solid ${C.border}` }}>
                {[
                  { label:"Werke", val:`€ ${price.toFixed(2)}` },
                  { label:"Versand", val:`€ ${shipCost.toFixed(2)}` },
                ].map((r,i) => (
                  <div key={i} style={{ display:"flex",
                    justifyContent:"space-between",
                    marginBottom:8 }}>
                    <span style={{ fontSize:13, color:C.muted }}>{r.label}</span>
                    <span style={{ fontSize:13, fontWeight:600, color:C.ink }}>{r.val}</span>
                  </div>
                ))}
                <div style={{ display:"flex", justifyContent:"space-between",
                  paddingTop:10, borderTop:`1px solid ${C.border}`,
                  marginBottom:12 }}>
                  <span style={{ fontSize:15, fontWeight:800, color:C.ink }}>
                    Gesamt</span>
                  <span style={{ fontSize:15, fontWeight:900, color:C.ink }}>
                    € {total.toFixed(2)}</span>
                </div>
                {/* Impact */}
                <div style={{ padding:"10px 14px", borderRadius:14,
                  background:"rgba(61,184,122,0.07)",
                  border:"1px solid rgba(61,184,122,0.14)",
                  display:"flex", gap:8, alignItems:"center" }}>
                  <span style={{ fontSize:14 }}>🌱</span>
                  <span style={{ fontSize:11.5, color:"#3DB87A", lineHeight:1.5 }}>
                    <strong>€ {impact}</strong> fließen in ein Projekt mit Herz.
                  </span>
                </div>
              </div>
            </div>

            {/* Delivery address */}
            <div style={{ background:C.card, borderRadius:18,
              padding:"16px 18px", marginBottom:24,
              border:`1px solid ${C.border}`,
              boxShadow:"0 2px 10px rgba(0,0,0,0.04)" }}>
              <div style={{ fontSize:11, fontWeight:700, color:C.muted,
                letterSpacing:1.3, textTransform:"uppercase",
                marginBottom:8 }}>Lieferadresse</div>
              <div style={{ fontSize:13.5, color:C.ink, lineHeight:1.65 }}>
                {addr.name}<br/>
                {addr.street}<br/>
                {addr.zip} {addr.city}<br/>
                {addr.country}
              </div>
            </div>

            <button onClick={() => setDone(true)} className="ws-tap"
              style={{ width:"100%", padding:"17px",
                background:`linear-gradient(135deg,${C.coral},${C.coral2})`,
                border:"none", borderRadius:18, color:"white",
                fontSize:15, fontWeight:800, cursor:"pointer",
                fontFamily:"inherit",
                boxShadow:`0 5px 22px ${C.coralGlow}` }}>
              Kauf abschließen · € {total.toFixed(2)}
            </button>

            <p style={{ textAlign:"center", fontSize:11.5, color:C.muted,
              marginTop:14, lineHeight:1.65 }}>
              Sicher bezahlen. 14 Tage Rückgaberecht.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── WERKEKORB SHEET ────────────────────────────────────────────────── */
export function WerkeKorb({ items, onClose, onRemove, onCheckout }) {
  const total   = items.reduce((s,w) => s + (parseFloat(String(w.price||"0").replace(/[^0-9.]/g,""))||89), 0);
  const impact  = Math.round(total * 0.025 * 100)/100;

  return (
    <div style={{ position:"fixed", inset:0, zIndex:500,
      background:"rgba(10,10,10,0.48)",
      backdropFilter:"blur(14px)", WebkitBackdropFilter:"blur(14px)" }}
      onClick={e => e.target===e.currentTarget && onClose()}>
      <style>{CSS}</style>

      <div style={{ position:"absolute", bottom:0, left:0, right:0,
        background:C.warm, borderRadius:"30px 30px 0 0",
        maxHeight:"88vh", overflowY:"auto",
        animation:"wsSheet 0.34s cubic-bezier(0.22,1,0.36,1) both",
        paddingBottom:"max(28px,env(safe-area-inset-bottom,28px))" }}>

        {/* Handle */}
        <div style={{ display:"flex", justifyContent:"center",
          padding:"12px 0 0" }}>
          <div style={{ width:44, height:4, borderRadius:999,
            background:"rgba(0,0,0,0.10)" }}/>
        </div>

        <div style={{ padding:"16px 22px 8px" }}>
          {/* Header */}
          <div style={{ display:"flex", justifyContent:"space-between",
            alignItems:"center", marginBottom:22 }}>
            <div>
              <div style={{ fontWeight:900, fontSize:22, color:C.ink }}>
                Werkekorb
              </div>
              <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>
                {items.length === 0 ? "Noch leer" : `${items.length} ${items.length===1?"Werk":"Werke"}`}
              </div>
            </div>
            <button onClick={onClose}
              style={{ background:"none", border:"none", cursor:"pointer",
                fontSize:18, color:C.muted,
                WebkitTapHighlightColor:"transparent" }}>✕</button>
          </div>

          {/* Empty state */}
          {items.length === 0 && (
            <div style={{ textAlign:"center", padding:"32px 0" }}>
              <div style={{ fontSize:48, marginBottom:14,
                opacity:0.3 }}>🛍</div>
              <div style={{ fontSize:14, color:C.muted, lineHeight:1.65 }}>
                Dein Werkekorb ist noch leer.<br/>
                Entdecke Werke im Feed.
              </div>
            </div>
          )}

          {/* Items */}
          {items.map((w, i) => (
            <div key={i} style={{ display:"flex", gap:14,
              background:C.card, borderRadius:18,
              padding:"14px 16px", marginBottom:12,
              border:`1px solid ${C.border}`,
              boxShadow:"0 2px 10px rgba(0,0,0,0.04)",
              animation:`wsUp 0.3s ${i*0.05}s both` }}>
              <img src={w.img} alt={w.title}
                style={{ width:60, height:60, borderRadius:12,
                  objectFit:"cover", flexShrink:0,
                  filter:"brightness(0.9) saturate(1.1)" }}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:700, fontSize:14, color:C.ink,
                  lineHeight:1.3, marginBottom:2 }}>{w.title}</div>
                <div style={{ fontSize:12, color:C.coral,
                  fontWeight:600 }}>{w.creator}</div>
                <div style={{ fontSize:14, fontWeight:900,
                  color:C.ink, marginTop:6 }}>{w.price}</div>
              </div>
              <button onClick={() => onRemove(i)}
                style={{ background:"none", border:"none",
                  cursor:"pointer", fontSize:16, color:C.muted2,
                  alignSelf:"flex-start", padding:"2px",
                  WebkitTapHighlightColor:"transparent" }}>✕</button>
            </div>
          ))}

          {/* Total + impact */}
          {items.length > 0 && (
            <div style={{ background:C.card, borderRadius:20,
              padding:"16px 18px", marginBottom:16,
              border:`1px solid ${C.border}`,
              boxShadow:"0 2px 10px rgba(0,0,0,0.04)" }}>
              <div style={{ display:"flex", justifyContent:"space-between",
                marginBottom:8 }}>
                <span style={{ fontSize:14, color:C.muted }}>Zwischensumme</span>
                <span style={{ fontSize:14, fontWeight:800, color:C.ink }}>
                  € {total.toFixed(2)}</span>
              </div>
              <div style={{ display:"flex", alignItems:"center",
                gap:8, padding:"10px 14px",
                borderRadius:12, background:"rgba(61,184,122,0.07)",
                border:"1px solid rgba(61,184,122,0.14)" }}>
                <span style={{ fontSize:13 }}>🌱</span>
                <span style={{ fontSize:11.5, color:"#3DB87A" }}>
                  € {impact} Impact-Beitrag inklusive
                </span>
              </div>
            </div>
          )}

          {/* CTA */}
          {items.length > 0 && (
            <button onClick={onCheckout} className="ws-tap"
              style={{ width:"100%", padding:"17px",
                background:`linear-gradient(135deg,${C.coral},${C.coral2})`,
                border:"none", borderRadius:18, color:"white",
                fontSize:15, fontWeight:800, cursor:"pointer",
                fontFamily:"inherit",
                boxShadow:`0 5px 20px ${C.coralGlow}` }}>
              Zur Kasse · € {total.toFixed(2)}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   EXPORTS
════════════════════════════════════════════════════════════════════ */
export { WerkDetail, WerkCheckout };
export default WerkDetail;
