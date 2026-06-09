import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

const C = {
  bg: "#0A0F1E", card: "#111827", card2: "#1A2235", border: "#1E2D45",
  text: "#F1F5F9", sub: "#94A3B8", muted: "#475569",
  orange: "#F97316", green: "#10B981", red: "#EF4444",
  teal: "#2ABFAC", coral: "#FF6B5B", gold: "#F5A623",
  yellow: "#FBBF24",
};

// ── Content-Prüfung Tab ──────────────────────────────────────
function ContentTab() {
  const [works,       setWorks]       = useState([]);
  const [exps,        setExps]        = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [actioning,   setActioning]   = useState(null); // id
  const [filter,      setFilter]      = useState("all"); // "all"|"works"|"experiences"
  const [toast,       setToast]       = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [wRes, eRes] = await Promise.all([
      supabase.from("works")
        .select("id,user_id,title,description,cover_url,category,status,created_at,profiles(display_name,username,avatar_url)")
        .eq("status", "pending_review")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase.from("experiences")
        .select("id,user_id,title,description,cover_url,category,experience_type,status,created_at,profiles(display_name,username,avatar_url)")
        .eq("status", "pending_review")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);
    setWorks(wRes.data  || []);
    setExps(eRes.data   || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function showToast(msg, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  async function approve(type, id) {
    setActioning(id);
    const table = type === "werk" ? "works" : "experiences";
    const { error } = await supabase.from(table)
      .update({ status: "published", published: true, visible: true,
                updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      showToast("Fehler: " + error.message, false);
    } else {
      showToast(type === "werk" ? "✅ Werk freigegeben" : "✅ Erlebnis freigegeben");
      if (type === "werk")  setWorks(p  => p.filter(x => x.id !== id));
      else                  setExps(p   => p.filter(x => x.id !== id));
    }
    setActioning(null);
  }

  async function reject(type, id) {
    setActioning(id);
    const table = type === "werk" ? "works" : "experiences";
    const { error } = await supabase.from(table)
      .update({ status: "rejected", updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      showToast("Fehler: " + error.message, false);
    } else {
      showToast("❌ Abgelehnt");
      if (type === "werk")  setWorks(p  => p.filter(x => x.id !== id));
      else                  setExps(p   => p.filter(x => x.id !== id));
    }
    setActioning(null);
  }

  const card  = { background: C.card, borderRadius: 16, padding: 20,
                   border: `1px solid ${C.border}`, marginBottom: 16 };
  const total = works.length + exps.length;
  const items = [
    ...works.map(w => ({ ...w, _type: "werk" })),
    ...exps.map(e  => ({ ...e, _type: "experience" })),
  ].filter(x => filter === "all" || (filter === "works" && x._type === "werk")
             || (filter === "experiences" && x._type === "experience"))
   .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  if (loading) return (
    <div style={{ textAlign:"center", padding:40, color: C.sub }}>
      <div style={{ fontSize:32, marginBottom:8 }}>🔍</div>
      Lade Inhalte zur Prüfung…
    </div>
  );

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{
          position:"fixed", top:20, left:"50%", transform:"translateX(-50%)",
          zIndex:9999, padding:"12px 24px", borderRadius:99,
          background: toast.ok ? C.green : C.red,
          color:"white", fontSize:14, fontWeight:700,
          boxShadow:"0 4px 20px rgba(0,0,0,0.4)",
        }}>{toast.msg}</div>
      )}

      {/* Header */}
      <div style={{ ...card, display:"flex", alignItems:"center",
        justifyContent:"space-between", marginBottom:16 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:800, color:C.text }}>
            📋 Content-Prüfung
          </div>
          <div style={{ fontSize:12, color:C.sub, marginTop:3 }}>
            {total === 0
              ? "Keine Einträge zur Prüfung"
              : `${total} Eintrag${total !== 1 ? "e" : ""} warten auf Freigabe`}
          </div>
        </div>
        <div style={{ display:"flex", gap:6 }}>
          {[["all","Alle"], ["works","Werke"], ["experiences","Erlebnisse"]].map(([k,l]) => (
            <button key={k} onClick={() => setFilter(k)} style={{
              padding:"6px 14px", borderRadius:99, border:"none", cursor:"pointer",
              background: filter === k ? C.teal : C.card2,
              color: filter === k ? "#fff" : C.sub,
              fontSize:12, fontWeight:600,
            }}>{l}</button>
          ))}
        </div>
      </div>

      {/* Items */}
      {items.length === 0 ? (
        <div style={{ ...card, textAlign:"center", padding:48, color:C.sub }}>
          <div style={{ fontSize:40, marginBottom:12 }}>✨</div>
          <div style={{ fontSize:15, fontWeight:600 }}>Alles geprüft!</div>
          <div style={{ fontSize:12, marginTop:4 }}>Keine Einträge in dieser Kategorie.</div>
        </div>
      ) : items.map(item => {
        const isWerk = item._type === "werk";
        const profile = item.profiles || {};
        const acting = actioning === item.id;
        return (
          <div key={item.id} style={{ ...card, padding:0, overflow:"hidden" }}>
            <div style={{ display:"flex", gap:0 }}>
              {/* Cover */}
              <div style={{
                width:90, flexShrink:0, minHeight:90,
                background:"#1A2235", position:"relative",
              }}>
                {item.cover_url
                  ? <img src={item.cover_url} alt=""
                      style={{ width:"100%", height:"100%", objectFit:"cover",
                               position:"absolute", inset:0 }}/>
                  : <div style={{ position:"absolute", inset:0, display:"flex",
                      alignItems:"center", justifyContent:"center", fontSize:28 }}>
                      {isWerk ? "🎨" : "🎟"}
                    </div>
                }
                {/* Typ-Badge */}
                <div style={{
                  position:"absolute", top:6, left:6,
                  padding:"3px 8px", borderRadius:99,
                  background: isWerk ? "rgba(245,166,35,0.9)" : "rgba(42,191,172,0.9)",
                  fontSize:10, fontWeight:700, color:"#fff",
                }}>
                  {isWerk ? "WERK" : "ERLEBNIS"}
                </div>
              </div>

              {/* Content */}
              <div style={{ flex:1, padding:"14px 16px" }}>
                {/* Author */}
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                  {profile.avatar_url && (
                    <img src={profile.avatar_url} alt=""
                      style={{ width:22, height:22, borderRadius:"50%", objectFit:"cover" }}/>
                  )}
                  <span style={{ fontSize:11.5, color:C.sub, fontWeight:600 }}>
                    {profile.display_name || profile.username || item.user_id?.slice(0,8)}
                  </span>
                  <span style={{ fontSize:10.5, color:C.muted, marginLeft:"auto" }}>
                    {new Date(item.created_at).toLocaleDateString("de-DE",
                      {day:"2-digit",month:"2-digit",year:"numeric"})}
                  </span>
                </div>

                {/* Titel */}
                <div style={{ fontSize:14, fontWeight:800, color:C.text,
                  marginBottom:4, lineHeight:1.3 }}>
                  {item.title || "Kein Titel"}
                </div>

                {/* Beschreibung */}
                {item.description && (
                  <div style={{ fontSize:12, color:C.sub, lineHeight:1.5,
                    marginBottom:8, overflow:"hidden",
                    display:"-webkit-box", WebkitLineClamp:2,
                    WebkitBoxOrient:"vertical" }}>
                    {item.description}
                  </div>
                )}

                {/* Kategorie */}
                {(item.category || item.experience_type) && (
                  <div style={{
                    display:"inline-block", padding:"3px 10px", borderRadius:99,
                    background:C.card2, border:`1px solid ${C.border}`,
                    fontSize:11, color:C.sub, marginBottom:10,
                  }}>
                    {item.category || item.experience_type}
                  </div>
                )}

                {/* Actions */}
                <div style={{ display:"flex", gap:8 }}>
                  <button
                    disabled={acting}
                    onClick={() => approve(item._type, item.id)}
                    style={{
                      flex:2, padding:"9px 0", borderRadius:10, border:"none",
                      background: acting ? "rgba(16,185,129,0.3)" : C.green,
                      color:"#fff", fontSize:13, fontWeight:700,
                      cursor: acting ? "not-allowed" : "pointer",
                    }}>
                    {acting ? "…" : "✓ Freigeben"}
                  </button>
                  <button
                    disabled={acting}
                    onClick={() => reject(item._type, item.id)}
                    style={{
                      flex:1, padding:"9px 0", borderRadius:10, border:"none",
                      background: acting ? "rgba(239,68,68,0.3)" : C.card2,
                      color: acting ? C.muted : C.red,
                      fontSize:13, fontWeight:600,
                      cursor: acting ? "not-allowed" : "pointer",
                      border: `1px solid ${acting ? C.border : C.red}`,
                    }}>
                    {acting ? "…" : "✕ Ablehnen"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Haupt-Admin ──────────────────────────────────────────────
export default function Admin() {
  const [wirker,   setWirker]   = useState([]);
  const [payments, setPayments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [pending,  setPending]  = useState({ works: 0, exps: 0 });
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState("dashboard");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [wirkerRes, paymentsRes, projectsRes, wPendingRes, ePendingRes] = await Promise.all([
        supabase.from("wirker")
          .select("id,name,full_name,talent,location,img,verified,bookings,impact_eur,created_at")
          .order("created_at", { ascending: false }).limit(100),
        supabase.from("payments")
          .select("id,user_id,wirker_name,amount_eur,impact_eur,status,payment_status,created_at")
          .order("created_at", { ascending: false }).limit(200),
        supabase.from("impact_projects")
          .select("id,name,category,description,votes,status,goal_eur,awarded_eur,month")
          .order("votes", { ascending: false }).limit(50),
        supabase.from("works").select("id", { count:"exact", head:true })
          .eq("status","pending_review"),
        supabase.from("experiences").select("id", { count:"exact", head:true })
          .eq("status","pending_review"),
      ]);
      setWirker(wirkerRes.data   || []);
      setPayments(paymentsRes.data || []);
      setProjects(projectsRes.data || []);
      setPending({
        works: wPendingRes.count || 0,
        exps:  ePendingRes.count || 0,
      });
      setLoading(false);
    }
    load();
  }, []);

  const totalRevenue = payments
    .filter(p => p.payment_status === "paid")
    .reduce((s, p) => s + (p.amount_eur || 0), 0);
  const totalImpact = payments
    .filter(p => p.payment_status === "paid")
    .reduce((s, p) => s + (p.impact_eur || 0), 0);
  const totalPending = pending.works + pending.exps;

  const s    = { minHeight:"100vh", background:C.bg, color:C.text,
                  fontFamily:"-apple-system, sans-serif", padding:24 };
  const card = { background:C.card, borderRadius:16, padding:20,
                  border:`1px solid ${C.border}`, marginBottom:16 };
  const tab_btn = (active, badge) => ({
    padding:"8px 18px", borderRadius:20, border:"none", cursor:"pointer",
    background: active ? C.teal : C.card2,
    color: active ? "#fff" : C.sub,
    fontWeight:600, fontSize:13,
    position:"relative",
    ...(badge > 0 ? { paddingRight: 28 } : {}),
  });

  if (loading) return (
    <div style={{ ...s, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:40, marginBottom:12 }}>🌱</div>
        <div style={{ color:C.teal }}>Lade Admin-Daten…</div>
      </div>
    </div>
  );

  return (
    <div style={s}>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ margin:0, fontSize:22, fontWeight:800 }}>
          HUI Admin <span style={{ color:C.teal }}>Dashboard</span>
        </h1>
        <div style={{ color:C.sub, fontSize:13, marginTop:4 }}>Echtzeit-Daten aus Supabase</div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:8, marginBottom:24, flexWrap:"wrap" }}>
        {[
          { key:"dashboard",  label:"Dashboard" },
          { key:"content",    label:"Content",  badge: totalPending },
          { key:"wirker",     label:"Wirker" },
          { key:"payments",   label:"Payments" },
          { key:"projekte",   label:"Projekte" },
        ].map(({ key, label, badge=0 }) => (
          <button key={key} onClick={() => setTab(key)} style={tab_btn(tab === key, badge)}>
            {label}
            {badge > 0 && (
              <span style={{
                position:"absolute", top:-6, right:-6,
                minWidth:18, height:18, borderRadius:99,
                background:C.coral, color:"#fff",
                fontSize:10, fontWeight:800,
                display:"flex", alignItems:"center", justifyContent:"center",
                padding:"0 4px",
              }}>{badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── DASHBOARD ── */}
      {tab === "dashboard" && (
        <>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(2, 1fr)", gap:12, marginBottom:16 }}>
            {[
              { label:"Wirker",      value:wirker.length,              icon:"✨", color:C.teal   },
              { label:"Buchungen",   value:payments.length,            icon:"📋", color:C.orange },
              { label:"Umsatz",      value:`${totalRevenue.toFixed(0)} €`, icon:"💰", color:C.green },
              { label:"Impact Pool", value:`${totalImpact.toFixed(2)} €`, icon:"🌱", color:C.coral },
              { label:"Zur Prüfung", value:totalPending,               icon:"📝", color:C.yellow },
            ].map(kpi => (
              <div key={kpi.label} style={{ ...card, marginBottom:0 }}
                onClick={kpi.label === "Zur Prüfung" ? () => setTab("content") : undefined}
                style={{
                  ...card, marginBottom:0,
                  cursor: kpi.label === "Zur Prüfung" ? "pointer" : "default",
                }}>
                <div style={{ fontSize:24, marginBottom:6 }}>{kpi.icon}</div>
                <div style={{ fontSize:22, fontWeight:800, color:kpi.color }}>{kpi.value}</div>
                <div style={{ fontSize:12, color:C.sub }}>{kpi.label}</div>
              </div>
            ))}
          </div>
          <div style={card}>
            <div style={{ fontWeight:700, marginBottom:12 }}>🌍 Impact Projekte ({projects.length})</div>
            {projects.slice(0,3).map(p => (
              <div key={p.id} style={{ display:"flex", justifyContent:"space-between",
                padding:"8px 0", borderBottom:`1px solid ${C.border}` }}>
                <span style={{ fontSize:13 }}>{p.name || p.title}</span>
                <span style={{ color:C.teal, fontSize:12, fontWeight:600 }}>{p.status}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── CONTENT PRÜFUNG ── */}
      {tab === "content" && <ContentTab />}

      {/* ── WIRKER ── */}
      {tab === "wirker" && (
        <div style={card}>
          <div style={{ fontWeight:700, marginBottom:12 }}>✨ Alle Wirker ({wirker.length})</div>
          {(wirker || []).filter(w => w && typeof w === "object").map(w => (
            <div key={w.id} style={{ display:"flex", alignItems:"center", gap:12,
              padding:"10px 0", borderBottom:`1px solid ${C.border}` }}>
              <div style={{ width:36, height:36, borderRadius:"50%",
                background:C.teal + "30", display:"flex", alignItems:"center",
                justifyContent:"center", fontSize:16 }}>✨</div>
              <div>
                <div style={{ fontWeight:600, fontSize:14 }}>{w.name}</div>
                <div style={{ color:C.sub, fontSize:12 }}>{w.talent} · {w.location}</div>
              </div>
              <div style={{ marginLeft:"auto", color:C.gold, fontSize:13, fontWeight:700 }}>
                {w.hourly_rate} €/h
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── PAYMENTS ── */}
      {tab === "payments" && (
        <div style={card}>
          <div style={{ fontWeight:700, marginBottom:12 }}>💳 Alle Buchungen ({payments.length})</div>
          {(payments || []).filter(p => p && typeof p === "object").map(p => (
            <div key={p.id} style={{ padding:"10px 0", borderBottom:`1px solid ${C.border}` }}>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontSize:13, fontWeight:600 }}>{p.wirker_name || p.item_name}</span>
                <span style={{ color: p.payment_status === "paid" ? C.green : C.orange,
                  fontSize:12, fontWeight:700 }}>{p.payment_status}</span>
              </div>
              <div style={{ color:C.sub, fontSize:12, marginTop:2 }}>
                {p.amount_eur} € · Impact: {p.impact_eur} €
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── PROJEKTE ── */}
      {tab === "projekte" && (
        <div style={card}>
          <div style={{ fontWeight:700, marginBottom:12 }}>🌍 Impact Projekte ({projects.length})</div>
          {(projects || []).filter(p => p && typeof p === "object").map(p => (
            <div key={p.id} style={{ padding:"10px 0", borderBottom:`1px solid ${C.border}` }}>
              <div style={{ fontWeight:600, fontSize:14 }}>{p.name || p.title}</div>
              <div style={{ color:C.sub, fontSize:12, marginTop:2 }}>
                {p.category} · {p.status}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
