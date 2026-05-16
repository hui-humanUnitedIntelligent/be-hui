// OrdersPage.jsx — Meine Bestellungen & Buchungshistorie
// Ruhig. Hochwertig. Persönlich. Kein Amazon-Backend.
import React, { useState, useEffect } from "react";
import { supabase } from ".../lib/supabaseClient";

const C = {
  teal:"#16D7C5", teal2:"#11C5B7", tealPale:"#E6FAF8",
  tealGlow:"rgba(22,215,197,0.22)",
  coral:"#FF8A6B", coral2:"#FF7B72", coralPale:"#FFF2EE",
  coralGlow:"rgba(255,138,107,0.20)",
  gold:"#F5A623", goldPale:"#FFFBEB",
  green:"#3DB87A", greenPale:"rgba(61,184,122,0.10)",
  cream:"#F9F6F2", warm:"#FFF9F4",
  card:"#FFFFFF", ink:"#1A1A1A", ink2:"#3A3A3A",
  muted:"#888", muted2:"#C0C0C0", border:"rgba(0,0,0,0.06)",
};

const CSS = `
  @keyframes opUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
  @keyframes opPop{0%{transform:scale(0);opacity:0}60%{transform:scale(1.15)}100%{transform:scale(1);opacity:1}}
  .op-scroll::-webkit-scrollbar{display:none}
  .op-scroll{-ms-overflow-style:none;scrollbar-width:none}
  .op-tap{transition:transform .17s cubic-bezier(.34,1.4,.64,1);-webkit-tap-highlight-color:transparent}
  .op-tap:active{transform:scale(.96)}
`;

/* ── Status config ── */
const STATUS = {
  received:   { label:"Erhalten",       color:"#888",    dot:"#C0C0C0", step:0 },
  preparing:  { label:"In Vorbereitung", color:C.gold,    dot:C.gold,   step:1 },
  shipped:    { label:"Versandt",        color:C.teal,    dot:C.teal,   step:2 },
  transit:    { label:"Unterwegs",       color:C.teal,    dot:C.teal,   step:3 },
  delivered:  { label:"Zugestellt",      color:C.green,   dot:C.green,  step:4 },
  completed:  { label:"Abgeschlossen",   color:C.green,   dot:C.green,  step:5 },
};

/* ── Mock data ── */
const MOCK_ORDERS = [
  {
    id:"ord_1", type:"werk", status:"transit",
    title:"Keramik Vase Handgemacht",
    creator:"David Weber", creatorCity:"Berlin",
    img:"https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&q=80",
    price:"€ 89", date:"5. Mai 2026",
    shipping:"DHL · Tracking: 1234567890",
    recommended:false,
  },
  {
    id:"ord_2", type:"booking", status:"completed",
    title:"Portrait-Fotoshooting",
    creator:"Lea Sommer", creatorCity:"München",
    img:"https://images.unsplash.com/photo-1452457807411-4979b707c5be?w=400&q=80",
    price:"€ 280", date:"28. April 2026",
    duration:"2 Stunden", recommended:true,
    recommendation:"Lea ist außergewöhnlich. Die Fotos sind zeitlos.",
  },
  {
    id:"ord_3", type:"werk", status:"completed",
    title:"Aquarell Original A3",
    creator:"Lena M.", creatorCity:"Hamburg",
    img:"https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&q=80",
    price:"€ 120", date:"15. April 2026",
    recommended:false,
  },
  {
    id:"ord_4", type:"booking", status:"preparing",
    title:"Vision Coaching Session",
    creator:"Lars G.", creatorCity:"München",
    img:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    price:"€ 150", date:"12. Mai 2026",
    duration:"90 Minuten", recommended:false,
  },
];

/* ── Progress Track ── */
function StatusTrack({ status }) {
  const steps = ["Erhalten","Vorbereitung","Versandt","Unterwegs","Zugestellt"];
  const current = STATUS[status]?.step ?? 0;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:0, marginTop:14 }}>
      {steps.map((s, i) => (
        <React.Fragment key={i}>
          <div style={{ display:"flex", flexDirection:"column",
            alignItems:"center", flex: i < steps.length-1 ? 0 : undefined }}>
            <div style={{ width:10, height:10, borderRadius:"50%",
              background: i <= current ? C.teal : C.muted2,
              boxShadow: i === current ? `0 0 6px ${C.tealGlow}` : "none",
              transition:"all 0.3s", flexShrink:0 }}/>
            <div style={{ fontSize:8.5, color: i<=current ? C.teal : C.muted2,
              marginTop:4, fontWeight: i===current ? 700 : 400,
              whiteSpace:"nowrap" }}>{s}</div>
          </div>
          {i < steps.length-1 && (
            <div style={{ flex:1, height:1.5, marginBottom:12,
              background: i < current
                ? `linear-gradient(90deg,${C.teal},${C.teal})`
                : C.muted2,
              transition:"background 0.4s" }}/>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

/* ── Recommendation Sheet ── */
function RecommendSheet({ order, onClose, onSubmit }) {
  const [text, setText] = useState("");
  return (
    <div style={{ position:"fixed", inset:0, zIndex:600,
      background:"rgba(10,10,10,0.5)",
      backdropFilter:"blur(14px)" }}
      onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{ position:"absolute", bottom:0, left:0, right:0,
        background:C.warm, borderRadius:"28px 28px 0 0",
        padding:"24px 22px max(36px,env(safe-area-inset-bottom,36px))",
        animation:"opUp 0.35s cubic-bezier(0.22,1,0.36,1) both" }}>
        <div style={{ display:"flex", justifyContent:"center", marginBottom:16 }}>
          <div style={{ width:40, height:4, borderRadius:999,
            background:"rgba(0,0,0,0.1)" }}/>
        </div>
        <div style={{ fontWeight:900, fontSize:20, color:C.ink,
          marginBottom:6 }}>
          Deine Empfehlung
        </div>
        <div style={{ fontSize:13, color:C.muted, marginBottom:20, lineHeight:1.6 }}>
          Was möchtest du anderen über {order.creator} sagen?
          Keine Sterne — nur deine echten Worte.
        </div>
        <textarea
          value={text} onChange={e => setText(e.target.value)}
          placeholder={`z.B. "${order.creator} hat mich wirklich überrascht. Die Qualität ist außergewöhnlich…"`}
          rows={4}
          style={{ width:"100%", background:C.card,
            border:`1.5px solid ${C.border}`, borderRadius:16,
            padding:"14px 16px", fontSize:14, color:C.ink,
            fontFamily:"inherit", resize:"none",
            boxSizing:"border-box", lineHeight:1.65,
            boxShadow:"0 2px 8px rgba(0,0,0,0.04)" }}/>
        <button
          onClick={() => text.trim() && onSubmit(text)}
          disabled={!text.trim()}
          style={{ width:"100%", padding:"16px", marginTop:14,
            background: text.trim()
              ? `linear-gradient(135deg,${C.teal},${C.teal2})`
              : C.muted2,
            border:"none", borderRadius:18, color:"white",
            fontSize:15, fontWeight:800, cursor:"pointer",
            fontFamily:"inherit",
            boxShadow: text.trim() ? `0 4px 18px ${C.tealGlow}` : "none",
            transition:"all 0.3s" }}>
          Empfehlung senden
        </button>
      </div>
    </div>
  );
}

/* ── Order Card ── */
function OrderCard({ order, onRecommend, idx }) {
  const [expanded, setExpanded] = useState(false);
  const st = STATUS[order.status] || STATUS.received;
  const isActive = !["completed","delivered"].includes(order.status);

  return (
    <div style={{ background:C.card, borderRadius:24,
      overflow:"hidden", marginBottom:16,
      border:`1px solid ${C.border}`,
      boxShadow:"0 3px 20px rgba(0,0,0,0.06)",
      animation:`opUp 0.4s ${idx*0.07}s both` }}>

      {/* Image + status ribbon */}
      <div style={{ position:"relative", height:160, overflow:"hidden" }}>
        <img src={order.img} alt={order.title}
          style={{ width:"100%", height:"100%", objectFit:"cover",
            filter:"brightness(0.88) saturate(1.1)" }}/>
        <div style={{ position:"absolute", inset:0,
          background:"linear-gradient(to bottom,transparent 40%,rgba(0,0,0,0.55) 100%)" }}/>

        {/* Type badge */}
        <div style={{ position:"absolute", top:12, left:12,
          background: order.type==="werk"
            ? "rgba(255,138,107,0.18)" : "rgba(22,215,197,0.18)",
          backdropFilter:"blur(10px)",
          border: `1px solid ${order.type==="werk" ? "rgba(255,138,107,0.4)" : "rgba(22,215,197,0.4)"}`,
          borderRadius:999, padding:"4px 12px",
          fontSize:9, fontWeight:800, letterSpacing:1.5,
          color: order.type==="werk" ? C.coral : C.teal,
          textTransform:"uppercase" }}>
          {order.type==="werk" ? "Werk" : "Buchung"}
        </div>

        {/* Status dot */}
        <div style={{ position:"absolute", top:12, right:12,
          display:"flex", alignItems:"center", gap:5,
          background:"rgba(0,0,0,0.38)", backdropFilter:"blur(8px)",
          borderRadius:999, padding:"4px 10px" }}>
          <div style={{ width:6, height:6, borderRadius:"50%",
            background:st.dot,
            boxShadow: isActive ? `0 0 5px ${st.dot}` : "none" }}/>
          <span style={{ fontSize:10, fontWeight:700,
            color:"rgba(255,255,255,0.9)" }}>{st.label}</span>
        </div>

        {/* Bottom info */}
        <div style={{ position:"absolute", bottom:12, left:16, right:16 }}>
          <div style={{ fontWeight:800, fontSize:15, color:"white",
            lineHeight:1.2 }}>{order.title}</div>
          <div style={{ fontSize:12, color:"rgba(255,255,255,0.75)",
            marginTop:3 }}>
            {order.creator} · {order.creatorCity}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding:"16px 18px" }}>
        {/* Meta row */}
        <div style={{ display:"flex", justifyContent:"space-between",
          alignItems:"center", marginBottom:12 }}>
          <div>
            <div style={{ fontWeight:900, fontSize:18, color:C.ink }}>
              {order.price}
            </div>
            <div style={{ fontSize:11, color:C.muted, marginTop:1 }}>
              {order.date}
              {order.duration && ` · ${order.duration}`}
            </div>
          </div>

          {/* Recommendation badge */}
          {order.recommended && (
            <div style={{ background:C.greenPale,
              border:`1px solid ${C.green}30`,
              borderRadius:12, padding:"6px 12px",
              fontSize:11, fontWeight:700, color:C.green }}>
              ✓ Empfohlen
            </div>
          )}
        </div>

        {/* Tracking (werk only, transit) */}
        {order.type==="werk" && order.status==="transit" && (
          <StatusTrack status={order.status}/>
        )}

        {/* Recommendation text */}
        {order.recommended && order.recommendation && (
          <div style={{ marginTop:12, padding:"12px 14px",
            background:"rgba(22,215,197,0.05)",
            border:`1px solid ${C.teal}20`,
            borderRadius:14, fontStyle:"italic",
            fontSize:13, color:C.ink2, lineHeight:1.65 }}>
            „{order.recommendation}"
          </div>
        )}

        {/* Shipping info */}
        {order.shipping && (
          <div style={{ marginTop:12, display:"flex", gap:8,
            alignItems:"center", fontSize:12, color:C.muted }}>
            <span>📦</span>
            <span>{order.shipping}</span>
          </div>
        )}

        {/* Actions */}
        <div style={{ display:"flex", gap:8, marginTop:14, flexWrap:"wrap" }}>
          {/* Empfehlen — only for completed without recommendation */}
          {order.status==="completed" && !order.recommended && (
            <button onClick={() => onRecommend(order)}
              className="op-tap"
              style={{ flex:1, padding:"12px",
                background:`linear-gradient(135deg,${C.teal},${C.teal2})`,
                border:"none", borderRadius:14, color:"white",
                fontSize:12.5, fontWeight:800, cursor:"pointer",
                fontFamily:"inherit",
                boxShadow:`0 3px 12px ${C.tealGlow}` }}>
              Empfehlung schreiben
            </button>
          )}

          {/* Re-buy */}
          {order.type==="werk" && (
            <button className="op-tap"
              style={{ flex:1, padding:"12px",
                background:C.card, border:`1.5px solid ${C.border}`,
                borderRadius:14, color:C.ink,
                fontSize:12.5, fontWeight:700, cursor:"pointer",
                fontFamily:"inherit" }}>
              Erneut kaufen
            </button>
          )}

          {/* Re-book */}
          {order.type==="booking" && (
            <button className="op-tap"
              style={{ flex:1, padding:"12px",
                background:C.card, border:`1.5px solid ${C.border}`,
                borderRadius:14, color:C.ink,
                fontSize:12.5, fontWeight:700, cursor:"pointer",
                fontFamily:"inherit" }}>
              Erneut buchen
            </button>
          )}

          {/* Invoice */}
          <button className="op-tap"
            style={{ padding:"12px 14px",
              background:C.card, border:`1.5px solid ${C.border}`,
              borderRadius:14, color:C.muted,
              fontSize:12.5, cursor:"pointer", fontFamily:"inherit" }}>
            🧾
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN EXPORT
══════════════════════════════════════════ */
export default function OrdersPage({ onClose }) {
  const [tab, setTab]       = useState("aktiv");   // aktiv | vergangen
  const [recommend, setRecommend] = useState(null);
  const [orders, setOrders] = useState(MOCK_ORDERS);

  const active = orders.filter(o =>
    ["received","preparing","shipped","transit"].includes(o.status));
  const past = orders.filter(o =>
    ["delivered","completed"].includes(o.status));

  const displayed = tab==="aktiv" ? active : past;

  const handleRecommend = (text) => {
    setOrders(prev => prev.map(o =>
      o.id === recommend.id
        ? {...o, recommended:true, recommendation:text}
        : o
    ));
    setRecommend(null);
  };

  return (
    <div className="op-scroll"
      style={{ position:"fixed", inset:0, zIndex:350,
        background:C.warm, overflowY:"auto",
        WebkitOverflowScrolling:"touch" }}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ background:"rgba(255,251,248,0.94)",
        backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)",
        borderBottom:`1px solid ${C.border}`,
        position:"sticky", top:0, zIndex:20 }}>
        <div style={{ height:"env(safe-area-inset-top,0)" }}/>
        <div style={{ display:"flex", alignItems:"center",
          justifyContent:"space-between",
          padding:"14px 20px" }}>
          <button onClick={onClose}
            style={{ width:38, height:38, borderRadius:13,
              background:C.card, border:`1px solid ${C.border}`,
              cursor:"pointer", fontSize:16, fontFamily:"inherit",
              boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>←</button>
          <div style={{ fontWeight:900, fontSize:17, color:C.ink,
            letterSpacing:-0.3 }}>Meine Käufe</div>
          <div style={{ width:38 }}/>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", padding:"0 20px 14px", gap:8 }}>
          {[
            { key:"aktiv",    label:`Aktiv (${active.length})` },
            { key:"vergangen",label:`Vergangen (${past.length})` },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ flex:1, padding:"10px",
                background: tab===t.key
                  ? `linear-gradient(135deg,${C.teal},${C.teal2})`
                  : C.card,
                border:`1px solid ${tab===t.key ? C.teal : C.border}`,
                borderRadius:14,
                fontSize:12.5, fontWeight: tab===t.key ? 800 : 500,
                color: tab===t.key ? "white" : C.muted,
                cursor:"pointer", fontFamily:"inherit",
                boxShadow: tab===t.key ? `0 3px 12px ${C.tealGlow}` : "none",
                transition:"all 0.22s" }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding:"20px 18px 40px" }}>
        {displayed.length === 0 ? (
          <div style={{ textAlign:"center", padding:"60px 24px" }}>
            <div style={{ fontSize:40, opacity:0.25, marginBottom:14 }}>
              {tab==="aktiv" ? "📦" : "📋"}
            </div>
            <div style={{ fontSize:15, fontWeight:700, color:C.ink,
              marginBottom:6 }}>
              {tab==="aktiv" ? "Keine aktiven Bestellungen"
                : "Noch keine vergangenen Käufe"}
            </div>
            <div style={{ fontSize:13, color:C.muted, lineHeight:1.65 }}>
              Entdecke Werke und Experiences im Feed.
            </div>
          </div>
        ) : (
          displayed.map((o, i) => (
            <OrderCard key={o.id} order={o} idx={i}
              onRecommend={setRecommend}/>
          ))
        )}
      </div>

      {/* Recommend sheet */}
      {recommend && (
        <RecommendSheet
          order={recommend}
          onClose={() => setRecommend(null)}
          onSubmit={handleRecommend}
        />
      )}
    </div>
  );
}
