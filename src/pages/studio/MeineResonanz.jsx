// src/pages/studio/MeineResonanz.jsx
// ─────────────────────────────────────────────────────────────────
// HUI Commerce Phase C1 — "Meine Resonanz"
// Persönliche Timeline aller Aktivitäten: Unterstützung, Werke,
// Erlebnisse, Impact-Stimmen, Buchungen.
// Design: Apple Journal, nicht Amazon Orders.
// ─────────────────────────────────────────────────────────────────

import React from "react";
import { supabase } from "../../lib/supabaseClient.js";
import { useAuth }  from "../../lib/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

// ── Design Tokens ─────────────────────────────────────────────────
const T = {
  page:      "#F7F5F0",
  card:      "#FFFFFF",
  ink:       "#1A1A18",
  inkSoft:   "rgba(26,26,24,0.50)",
  inkFaint:  "rgba(26,26,24,0.30)",
  border:    "rgba(26,26,24,0.07)",
  teal:      "#0EC4B8",
  tealSoft:  "rgba(14,196,184,0.10)",
  ff:        "-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',sans-serif",
  px:        20,
};

const TYPE_CONFIG = {
  support:   { icon: "❤️",  label: "Unterstützung", color: "#E85D75", bg: "rgba(232,93,117,0.09)"  },
  werk:      { icon: "🎨",  label: "Werk",          color: "#7264D6", bg: "rgba(114,100,214,0.09)" },
  erlebnis:  { icon: "🌿",  label: "Erlebnis",      color: "#2D9E6A", bg: "rgba(45,158,106,0.09)"  },
  impact:    { icon: "🌍",  label: "Impact",         color: "#0EC4B8", bg: "rgba(14,196,184,0.09)"  },
  buchung:   { icon: "📅",  label: "Buchung",        color: "#F59E0B", bg: "rgba(245,158,11,0.09)"  },
};

const FILTERS = [
  { id: "all",      label: "Alle",          icon: "✨" },
  { id: "support",  label: "Unterstützung", icon: "❤️" },
  { id: "werk",     label: "Werke",         icon: "🎨" },
  { id: "erlebnis", label: "Erlebnisse",    icon: "🌿" },
  { id: "impact",   label: "Impact",        icon: "🌍" },
  { id: "buchung",  label: "Buchungen",     icon: "📅" },
];

const CSS = `
  @keyframes mr-fade { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:none; } }
  @keyframes mr-shimmer { 0%,100%{opacity:.4}50%{opacity:.8} }
  .mr-scroll { overflow-y:auto; -webkit-overflow-scrolling:touch; scrollbar-width:none; }
  .mr-scroll::-webkit-scrollbar { display:none; }
  .mr-chips { overflow-x:auto; -webkit-overflow-scrolling:touch; scrollbar-width:none; }
  .mr-chips::-webkit-scrollbar { display:none; }
  .mr-press { cursor:pointer; -webkit-tap-highlight-color:transparent; touch-action:manipulation; transition:transform .14s ease, opacity .14s ease; }
  .mr-press:active { transform:scale(.975); opacity:.8; }
  .mr-chip { cursor:pointer; -webkit-tap-highlight-color:transparent; touch-action:manipulation; transition:all .16s ease; border:none; }
  .mr-chip:active { transform:scale(.93); }
  .mr-entry { animation:mr-fade .32s ease both; }
  .mr-shimmer { animation:mr-shimmer 1.5s ease infinite; }
`;

function safeNum(v) { return typeof v === "number" ? v : parseFloat(v) || 0; }

function formatRelative(iso) {
  if (!iso) return "";
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60)    return "gerade eben";
  if (diff < 3600)  return "vor " + Math.floor(diff/60) + " Min";
  if (diff < 86400) return "vor " + Math.floor(diff/3600) + " Std";
  const days = Math.floor(diff/86400);
  if (days < 7)  return "vor " + days + " Tag" + (days>1?"en":"");
  if (days < 30) return "vor " + Math.floor(days/7) + " Woche" + (Math.floor(days/7)>1?"n":"");
  return new Date(iso).toLocaleDateString("de-DE", { day:"numeric", month:"long", year:"numeric" });
}

function statusLabel(status) {
  const map = {
    paid:"Bezahlt", completed:"Abgeschlossen", confirmed:"Bestätigt",
    pending:"Ausstehend", cancelled:"Storniert", approved:"Genehmigt",
    fulfilled:"Erfüllt", shipped:"Versandt", delivered:"Geliefert",
    processing:"In Bearbeitung", voted:"Abgestimmt", submitted:"Eingereicht",
  };
  return map[status?.toLowerCase()] || status || "";
}

function statusColor(status) {
  const s = status?.toLowerCase();
  if (["paid","completed","confirmed","fulfilled","shipped","delivered","approved","voted"].includes(s))
    return { color:"#2D9E6A", bg:"rgba(45,158,106,0.09)" };
  if (["pending","processing","submitted"].includes(s))
    return { color:"#F59E0B", bg:"rgba(245,158,11,0.09)" };
  if (["cancelled","rejected"].includes(s))
    return { color:"#E85D75", bg:"rgba(232,93,117,0.09)" };
  return { color:T.inkSoft, bg:"rgba(26,26,24,0.05)" };
}

async function loadTimeline(userId) {
  const entries = [];

  // 1. Orders + Items (Werkekäufe + Erlebniskäufe)
  try {
    const { data: orders } = await supabase
      .from("orders")
      .select(`id, state, total_eur, created_at, order_items(id, item_type, unit_price_eur, quantity, snapshot, fulfillment_status, item_id)`)
      .eq("customer_id", userId)
      .not("state", "eq", "cancelled")
      .order("created_at", { ascending:false })
      .limit(60);

    for (const order of orders || []) {
      for (const item of order.order_items || []) {
        const snap = item.snapshot || {};
        const type = item.item_type === "experience" ? "erlebnis" : "werk";
        entries.push({
          id:      "order-" + item.id,
          type,
          date:    order.created_at,
          title:   snap.title || snap.name || (type==="erlebnis" ? "Erlebnis gebucht" : "Werk erworben"),
          desc:    snap.description || snap.short_desc || snap.caption || "",
          img:     snap.cover_url || (snap.images && snap.images[0]) || snap.media_url || null,
          amount:  safeNum(item.unit_price_eur) * safeNum(item.quantity || 1),
          status:  item.fulfillment_status || order.state,
          navId:   item.item_id || order.id,
        });
      }
    }
  } catch(e) { console.warn("[Resonanz orders]", e?.message); }

  // 2. Payments (Direkt-Unterstützung — ohne Buchungen)
  try {
    const { data: payments } = await supabase
      // Legacy-Hinweis: Diese Stelle liest aus der alten Tabelle 'payments'.
      // Die Tabelle wurde nie befuellt und hat kein SSOT-Mapping (SYS-LegacyMark-024).
      // UI zeigt korrekt leer/0 an. Kein Ersatz vorhanden.

      .from("payments")
      .select("id, item_name, item_type, amount_eur, status, state, created_at, booking_id")
      .eq("payer_id", userId)
      .is("booking_id", null)
      .order("created_at", { ascending:false })
      .limit(30);

    for (const p of payments || []) {
      entries.push({
        id:     "pay-" + p.id,
        type:   "support",
        date:   p.created_at,
        title:  p.item_name || "Unterstützung",
        desc:   p.item_type || "",
        img:    null,
        amount: safeNum(p.amount_eur),
        status: p.state || p.status,
        navId:  p.id,
      });
    }
  } catch(e) { console.warn("[Resonanz payments]", e?.message); }

  // 3. Buchungen
  try {
    const { data: bookings } = await supabase
      .from("bookings")
      .select("id, service_title, work_title, service, state, status, total_eur, subtotal_eur, amount, scheduled_at, created_at, wirker_name")
      .eq("customer_id", userId)
      .order("created_at", { ascending:false })
      .limit(30);

    for (const b of bookings || []) {
      entries.push({
        id:          "booking-" + b.id,
        type:        "buchung",
        date:        b.created_at,
        title:       b.service_title || b.work_title || b.service || "Buchung",
        desc:        b.wirker_name ? "bei " + b.wirker_name : "",
        img:         null,
        amount:      safeNum(b.total_eur || b.subtotal_eur || b.amount),
        status:      b.state || b.status,
        navId:       b.id,
        scheduledAt: b.scheduled_at,
      });
    }
  } catch(e) { console.warn("[Resonanz bookings]", e?.message); }

  // 4. Impact-Stimmen
  try {
    const { data: votes } = await supabase
      .from("impact_votes")
      .select("id, project_id, pool_month, created_at, impact_applications(project_name, cover_url, short_desc)")
      .eq("voter_id", userId)
      .order("created_at", { ascending:false })
      .limit(20);

    for (const v of votes || []) {
      const app = v.impact_applications;
      entries.push({
        id:     "vote-" + v.id,
        type:   "impact",
        date:   v.created_at,
        title:  (app && app.project_name) || "Herzensprojekt unterstützt",
        desc:   (app && app.short_desc) || ("Stimme für " + v.pool_month),
        img:    (app && app.cover_url) || null,
        amount: null,
        status: "voted",
        navId:  v.project_id,
      });
    }
  } catch(e) { console.warn("[Resonanz votes]", e?.message); }

  // 5. Eigene Impact-Projekte
  try {
    const { data: myApps } = await supabase
      .from("impact_applications")
      .select("id, project_name, short_desc, cover_url, status, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending:false })
      .limit(10);

    for (const a of myApps || []) {
      entries.push({
        id:     "impact-app-" + a.id,
        type:   "impact",
        date:   a.created_at,
        title:  a.project_name || "Herzensprojekt eingereicht",
        desc:   a.short_desc || "Eigenes Projekt",
        img:    a.cover_url || null,
        amount: null,
        status: a.status,
        navId:  a.id,
      });
    }
  } catch(e) { console.warn("[Resonanz own apps]", e?.message); }

  entries.sort((a, b) => new Date(b.date) - new Date(a.date));
  return entries;
}

// ── Skeleton ──────────────────────────────────────────────────────
function EntrySkeleton() {
  return (
    <div style={{ display:"flex", gap:14, padding:"20px 0", borderBottom:"1px solid " + T.border }}>
      <div className="mr-shimmer" style={{ width:72, height:72, borderRadius:16, background:"rgba(26,26,24,0.06)", flexShrink:0 }} />
      <div style={{ flex:1, display:"flex", flexDirection:"column", gap:9 }}>
        <div className="mr-shimmer" style={{ height:13, width:"60%", borderRadius:8, background:"rgba(26,26,24,0.06)" }} />
        <div className="mr-shimmer" style={{ height:16, width:"80%", borderRadius:8, background:"rgba(26,26,24,0.05)" }} />
        <div className="mr-shimmer" style={{ height:11, width:"40%", borderRadius:8, background:"rgba(26,26,24,0.04)" }} />
        <div className="mr-shimmer" style={{ height:20, width:"30%", borderRadius:99, background:"rgba(26,26,24,0.04)" }} />
      </div>
    </div>
  );
}

// ── Monats-Trennlinie ─────────────────────────────────────────────
function MonthDivider({ label }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12, padding:"28px 0 4px" }}>
      <div style={{ flex:1, height:1, background:T.border }} />
      <span style={{ fontSize:11, fontWeight:700, color:T.inkFaint, letterSpacing:"0.07em", textTransform:"uppercase" }}>{label}</span>
      <div style={{ flex:1, height:1, background:T.border }} />
    </div>
  );
}

// ── Summary Card ──────────────────────────────────────────────────
function ResonanzSummary({ entries }) {
  const t = { support:0, werk:0, erlebnis:0, impact:0, buchung:0, eur:0 };
  for (const e of entries) {
    t[e.type] = (t[e.type]||0) + 1;
    if (e.amount > 0) t.eur += e.amount;
  }

  const stats = [
    { icon:"❤️", label:"Unterstützt", val:t.support  },
    { icon:"🎨", label:"Werke",       val:t.werk      },
    { icon:"🌿", label:"Erlebnisse",  val:t.erlebnis  },
    { icon:"🌍", label:"Impact",      val:t.impact    },
    { icon:"📅", label:"Buchungen",   val:t.buchung   },
  ].filter(s => s.val > 0);

  if (!stats.length && !t.eur) return null;

  return (
    <div style={{
      background:T.card, borderRadius:20, border:"1px solid " + T.border,
      padding:"24px 20px", marginBottom:8,
      boxShadow:"0 2px 16px rgba(26,26,24,0.05)",
    }}>
      {t.eur > 0 && (
        <div style={{ textAlign:"center", marginBottom:stats.length ? 20 : 0 }}>
          <div style={{ fontSize:12, color:T.inkSoft, letterSpacing:"0.05em", textTransform:"uppercase", marginBottom:4 }}>
            Gesamte Resonanz
          </div>
          <div style={{ fontSize:32, fontWeight:800, color:T.ink, letterSpacing:"-0.04em", lineHeight:1 }}>
            {t.eur.toLocaleString("de-DE", { style:"currency", currency:"EUR", minimumFractionDigits: t.eur%1===0?0:2 })}
          </div>
          <div style={{ fontSize:12, color:T.inkSoft, marginTop:6 }}>
            in {entries.length} {entries.length===1?"Aktivität":"Aktivitäten"}
          </div>
        </div>
      )}
      {stats.length > 0 && (
        <div style={{ display:"flex", gap:8, justifyContent:"center", flexWrap:"wrap" }}>
          {stats.map(s => (
            <div key={s.label} style={{
              background:"rgba(26,26,24,0.04)", borderRadius:14,
              padding:"10px 14px", textAlign:"center", minWidth:64,
            }}>
              <div style={{ fontSize:22, marginBottom:2 }}>{s.icon}</div>
              <div style={{ fontSize:18, fontWeight:800, color:T.ink, lineHeight:1 }}>{s.val}</div>
              <div style={{ fontSize:11, color:T.inkSoft, marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Timeline Entry ─────────────────────────────────────────────────
function ResonanzEntry({ entry, animIndex, onTap }) {
  const cfg   = TYPE_CONFIG[entry.type] || TYPE_CONFIG.werk;
  const st    = statusColor(entry.status);
  const sl    = statusLabel(entry.status);
  const [imgErr, setImgErr] = React.useState(false);
  const hasImg = entry.img && !imgErr;

  return (
    <div
      className="mr-press mr-entry"
      role="button"
      tabIndex={0}
      onClick={() => onTap(entry)}
      onKeyDown={e => e.key==="Enter" && onTap(entry)}
      style={{
        animationDelay: (animIndex * 0.04) + "s",
        display:"flex", gap:14, padding:"20px 0",
        borderBottom:"1px solid " + T.border,
      }}
    >
      {/* Bild oder Icon-Box */}
      <div style={{
        width:72, height:72, borderRadius:16, flexShrink:0,
        overflow:"hidden",
        background: hasImg ? "#000" : cfg.bg,
        display:"flex", alignItems:"center", justifyContent:"center",
        position:"relative",
        WebkitMaskImage:"-webkit-radial-gradient(white,black)",
      }}>
        {hasImg ? (
          <img src={entry.img} alt="" loading="eager"
            onError={() => setImgErr(true)}
            style={{ width:"100%", height:"100%", objectFit:"cover", WebkitTransform:"translateZ(0)" }} />
        ) : (
          <span style={{ fontSize:30 }}>{cfg.icon}</span>
        )}
        {hasImg && (
          <div style={{
            position:"absolute", bottom:4, right:4,
            width:20, height:20, borderRadius:99,
            background:"rgba(255,255,255,0.9)",
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:11,
          }}>{cfg.icon}</div>
        )}
      </div>

      {/* Text */}
      <div style={{ flex:1, minWidth:0 }}>
        {/* Typ + Datum */}
        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
          <span style={{ fontSize:11, fontWeight:700, color:cfg.color, letterSpacing:"0.04em", textTransform:"uppercase" }}>
            {cfg.label}
          </span>
          <span style={{ fontSize:11, color:T.inkFaint }}>·</span>
          <span style={{ fontSize:11, color:T.inkFaint }}>{formatRelative(entry.date)}</span>
        </div>

        {/* Titel */}
        <div style={{
          fontSize:15, fontWeight:600, color:T.ink,
          lineHeight:"1.35", marginBottom:4,
          overflow:"hidden", textOverflow:"ellipsis",
          display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical",
        }}>
          {entry.title}
        </div>

        {/* Beschreibung */}
        {!!entry.desc && (
          <div style={{
            fontSize:13, color:T.inkSoft, lineHeight:"1.4",
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
            marginBottom:7,
          }}>
            {entry.desc}
          </div>
        )}
        {!entry.desc && <div style={{ height:7 }} />}

        {/* Footer */}
        <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
          {entry.amount > 0 && (
            <span style={{ fontSize:14, fontWeight:700, color:T.ink, letterSpacing:"-0.02em" }}>
              {entry.amount.toLocaleString("de-DE", { style:"currency", currency:"EUR", minimumFractionDigits: entry.amount%1===0?0:2 })}
            </span>
          )}
          {sl && (
            <span style={{ fontSize:11, fontWeight:600, color:st.color, background:st.bg, padding:"2px 8px", borderRadius:99 }}>
              {sl}
            </span>
          )}
          {entry.scheduledAt && (
            <span style={{ fontSize:11, color:T.inkFaint }}>
              📅 {new Date(entry.scheduledAt).toLocaleDateString("de-DE",{day:"numeric",month:"short"})}
            </span>
          )}
        </div>
      </div>

      {/* Chevron */}
      <span style={{ color:T.inkFaint, fontSize:18, alignSelf:"center", flexShrink:0 }}>›</span>
    </div>
  );
}

// ── Leer-State ────────────────────────────────────────────────────
function EmptyState({ filter }) {
  const cfg = filter !== "all" ? TYPE_CONFIG[filter] : null;
  return (
    <div style={{ textAlign:"center", padding:"72px 32px 48px" }}>
      <div style={{ fontSize:54, marginBottom:18 }}>{cfg?.icon || "✨"}</div>
      <div style={{ fontSize:18, fontWeight:700, color:T.ink, marginBottom:10, letterSpacing:"-0.02em" }}>
        {filter==="all" ? "Deine Geschichte beginnt hier" : "Noch keine " + (cfg?.label||"Aktivitäten")}
      </div>
      <div style={{ fontSize:14, color:T.inkSoft, lineHeight:"1.65", maxWidth:260, margin:"0 auto" }}>
        {filter==="all"
          ? "Jede Buchung, jede Stimme, jedes erworbene Werk erscheint hier als Teil deiner persönlichen Resonanz."
          : "Sobald du " + (cfg?.label?.toLowerCase()||"etwas") + " unterstützt oder erlebst, erscheint es hier."}
      </div>
    </div>
  );
}

// ── Hauptkomponente ────────────────────────────────────────────────
export default function MeineResonanz({ onClose, onNavigate }) {
  const { user, profile } = useAuth();
  const [entries, setEntries] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [filter,  setFilter]  = React.useState("all");

  const uid = (user && user.id) || (profile && profile.id);

  React.useEffect(() => {
    if (!uid) { setLoading(false); return; }
    let dead = false;
    setLoading(true);
    loadTimeline(uid).then(data => {
      if (!dead) { setEntries(data); setLoading(false); }
    });
    return () => { dead = true; };
  }, [uid]);

  const filtered = React.useMemo(
    () => filter === "all" ? entries : entries.filter(e => e.type === filter),
    [entries, filter]
  );

  // Nach Monat gruppieren
  const grouped = React.useMemo(() => {
    const out = [];
    let last = null;
    let animIdx = 0;
    for (const entry of filtered) {
      const d = new Date(entry.date);
      const mk = d.getFullYear() + "-" + d.getMonth();
      const ml = d.toLocaleDateString("de-DE", { month:"long", year:"numeric" });
      if (mk !== last) { out.push({ isDivider:true, label:ml, key:"div-"+mk }); last = mk; }
      out.push({ isDivider:false, entry, animIdx: animIdx++ });
    }
    return out;
  }, [filtered]);

  function handleTap(entry) {
    if (!onNavigate) return;
    if (entry.type === "impact")    onNavigate("impact",  entry.navId);
    else if (entry.type === "werk") onNavigate("work",    entry.navId);
    else if (entry.type === "erlebnis") onNavigate("erlebnis", entry.navId);
    else if (entry.type === "buchung")  onNavigate("buchung",  entry.navId);
    else if (entry.type === "support")  onNavigate("support",  entry.navId);
  }

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:12000,
      background:T.page, display:"flex", flexDirection:"column",
      fontFamily:T.ff, WebkitFontSmoothing:"antialiased",
    }}>
      <style>{CSS}</style>

      {/* ── Header ── */}
      <div style={{
        position:"sticky", top:0, zIndex:10,
        background:"rgba(247,245,240,0.95)",
        backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)",
        borderBottom:"1px solid " + T.border,
        paddingTop:"max(52px, env(safe-area-inset-top, 52px))",
        WebkitTransform:"translateZ(0)", transform:"translateZ(0)",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"14px " + T.px + "px 10px" }}>
          {onClose && (
            <button onClick={onClose} className="mr-press" style={{
              background:"none", border:"none", cursor:"pointer",
              fontSize:24, color:T.inkSoft, padding:"2px 10px 2px 0", lineHeight:1,
            }}>‹</button>
          )}
          <div style={{ flex:1 }}>
            <div style={{ fontSize:24, fontWeight:800, color:T.ink, letterSpacing:"-0.03em", lineHeight:1.1 }}>
              Meine Resonanz
            </div>
            <div style={{ fontSize:13, color:T.inkSoft, marginTop:3, lineHeight:"1.4" }}>
              Alles, was du unterstützt, erlebt und bewegt hast.
            </div>
          </div>
        </div>

        {/* Filter-Chips */}
        <div className="mr-chips" style={{ display:"flex", gap:8, padding:"0 " + T.px + "px 14px" }}>
          {FILTERS.map(f => {
            const active = filter === f.id;
            return (
              <button key={f.id} className="mr-chip" onClick={() => setFilter(f.id)} style={{
                display:"inline-flex", alignItems:"center", gap:5,
                padding:"7px 13px", borderRadius:99,
                background: active ? T.ink : T.card,
                border: active ? "none" : "1px solid " + T.border,
                color: active ? "#FFFFFF" : T.inkSoft,
                fontSize:13, fontWeight: active ? 700 : 500,
                whiteSpace:"nowrap", flexShrink:0,
                boxShadow: active ? "0 2px 10px rgba(26,26,24,0.2)" : "none",
              }}>
                <span>{f.icon}</span><span>{f.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Scroll Area ── */}
      <div className="mr-scroll" style={{ flex:1 }}>
        <div style={{
          padding:"16px " + T.px + "px",
          paddingBottom:"max(100px, calc(80px + env(safe-area-inset-bottom, 20px)))",
        }}>

          {/* Summary */}
          {!loading && filter==="all" && entries.length > 0 && (
            <ResonanzSummary entries={entries} />
          )}

          {/* Loading Skeletons */}
          {loading && [0,1,2,3].map(i => <EntrySkeleton key={i} />)}

          {/* Empty */}
          {!loading && filtered.length === 0 && <EmptyState filter={filter} />}

          {/* Timeline */}
          {!loading && grouped.map(item =>
            item.isDivider
              ? <MonthDivider key={item.key} label={item.label} />
              : <ResonanzEntry key={item.entry.id} entry={item.entry} animIndex={item.animIdx} onTap={handleTap} />
          )}

          {/* Footer */}
          {!loading && filtered.length > 0 && (
            <div style={{ textAlign:"center", padding:"36px 0 8px", fontSize:12, color:T.inkFaint, lineHeight:"1.6" }}>
              Das ist deine Resonanz.{"\n"}Jede Aktivität hinterlässt eine Spur.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
