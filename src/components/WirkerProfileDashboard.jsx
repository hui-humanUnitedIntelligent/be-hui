// CreatorDashboard.jsx — HUI Phase 5
// Private Creator-Ansicht: echte Stats, Werke, Buchungen, Verfügbarkeit
// Ersetzt WirkerProfileDashboard.jsx

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/AuthContext";

const C = {
  teal:"#16D7C5", teal2:"#11C5B7", tealPale:"#E6FAF8", tealGlow:"rgba(22,215,197,0.18)",
  coral:"#FF8A6B", coralPale:"#FFF2EE", coralGlow:"rgba(255,138,107,0.15)",
  gold:"#F5A623", goldPale:"#FFFBEB",
  green:"#10B981", greenPale:"#ECFDF5",
  cream:"#F9F6F2", warm:"#FFF9F4", card:"#FFFFFF",
  ink:"#1A1A1A", ink2:"#3A3A3A", muted:"#888", muted2:"#BBB",
  border:"rgba(0,0,0,0.06)",
};

const CSS = `
  @keyframes cdFadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  @keyframes cdPulse{0%,100%{opacity:1}50%{opacity:.4}}
  @keyframes cdSpin{to{transform:rotate(360deg)}}
  @keyframes cdPop{0%{transform:scale(.9);opacity:0}70%{transform:scale(1.03)}100%{transform:scale(1);opacity:1}}
  .cd-tap{transition:transform .15s cubic-bezier(.34,1.4,.64,1);-webkit-tap-highlight-color:transparent}
  .cd-tap:active{transform:scale(.95)}
  .cd-scroll::-webkit-scrollbar{display:none}
  .cd-scroll{-ms-overflow-style:none;scrollbar-width:none}
`;

function Skel({ w="100%", h=16, r=8, mb=0 }) {
  return <div style={{ width:w, height:h, borderRadius:r, marginBottom:mb,
    background:"rgba(0,0,0,0.07)", animation:"cdPulse 1.4s ease-in-out infinite" }} />;
}

// ── Stat Card ─────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, accent=C.teal, loading }) {
  return (
    <div style={{ flex:1, minWidth:0, background:C.card, borderRadius:18,
      padding:"14px 14px 12px", border:`1px solid ${C.border}`,
      boxShadow:"0 2px 12px rgba(0,0,0,0.05)" }}>
      <div style={{ fontSize:20, marginBottom:6 }}>{icon}</div>
      {loading
        ? <><Skel h={22} w="60%" r={6} mb={4}/><Skel h={11} w="80%" r={5}/></>
        : <>
            <div style={{ fontSize:20, fontWeight:900, color:accent, lineHeight:1 }}>{value}</div>
            <div style={{ fontSize:11, fontWeight:700, color:C.muted, marginTop:3 }}>{label}</div>
            {sub && <div style={{ fontSize:10, color:C.muted2, marginTop:2 }}>{sub}</div>}
          </>}
    </div>
  );
}

// ── Booking Row ───────────────────────────────────────────────────────
function BookingRow({ b, onAccept, onDecline }) {
  const statusColor = b.status==="confirmed" ? C.green : b.status==="pending" ? C.gold : C.muted;
  const statusLabel = b.status==="confirmed" ? "Bestätigt" : b.status==="pending" ? "Ausstehend" : b.status;

  return (
    <div style={{ background:C.card, borderRadius:14, padding:"12px 14px",
      marginBottom:8, border:`1px solid ${C.border}`,
      boxShadow:"0 1px 8px rgba(0,0,0,0.04)" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:700, fontSize:13, color:C.ink, marginBottom:2 }}>
            {b.client_name || "Unbekannt"}
          </div>
          <div style={{ fontSize:12, color:C.muted, marginBottom:4 }}>
            {b.service_title || b.work_title || "Buchung"}
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <div style={{ fontSize:11, color:C.muted2 }}>
              {b.scheduled_at
                ? new Date(b.scheduled_at).toLocaleDateString("de-DE",{weekday:"short",day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})
                : new Date(b.created_at).toLocaleDateString("de-DE",{day:"numeric",month:"short"})}
            </div>
            <div style={{ fontSize:11, fontWeight:700, color:statusColor,
              background:`${statusColor}18`, borderRadius:50, padding:"2px 8px" }}>
              {statusLabel}
            </div>
          </div>
        </div>
        <div style={{ textAlign:"right", flexShrink:0, marginLeft:10 }}>
          <div style={{ fontSize:14, fontWeight:800, color:C.coral }}>
            € {b.amount || b.total_amount || "—"}
          </div>
          {b.status === "pending" && (
            <div style={{ display:"flex", gap:6, marginTop:6 }}>
              <button className="cd-tap" onClick={() => onDecline(b.id)}
                style={{ padding:"5px 10px", background:"rgba(0,0,0,0.05)",
                  border:"none", borderRadius:50, fontSize:11, fontWeight:700,
                  color:C.muted, cursor:"pointer" }}>✕</button>
              <button className="cd-tap" onClick={() => onAccept(b.id)}
                style={{ padding:"5px 12px", background:`linear-gradient(135deg,${C.teal},${C.teal2})`,
                  border:"none", borderRadius:50, fontSize:11, fontWeight:700,
                  color:"white", cursor:"pointer" }}>✓</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Work Row ──────────────────────────────────────────────────────────
function WorkRow({ w, onToggle, onDelete }) {
  return (
    <div style={{ background:C.card, borderRadius:14, padding:"12px",
      marginBottom:8, border:`1px solid ${C.border}`,
      display:"flex", gap:12, alignItems:"center" }}>
      <div style={{ width:52, height:52, borderRadius:10, overflow:"hidden",
        flexShrink:0, background:C.cream }}>
        <img src={w.cover_url || w.images?.[0] ||
          "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=200&q=80"}
          alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontWeight:700, fontSize:13, color:C.ink,
          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          {w.title}
        </div>
        <div style={{ display:"flex", gap:10, marginTop:3 }}>
          {w.price && <span style={{ fontSize:12, fontWeight:700, color:C.coral }}>€ {w.price}</span>}
          <span style={{ fontSize:11, color:C.muted }}>{w.views || 0} Views</span>
        </div>
      </div>
      <div style={{ display:"flex", gap:6, flexShrink:0 }}>
        <button className="cd-tap" onClick={() => onToggle(w)}
          style={{ padding:"6px 12px",
            background: w.status==="published" ? C.greenPale : "rgba(0,0,0,0.06)",
            border:"none", borderRadius:50, fontSize:11, fontWeight:700,
            color: w.status==="published" ? C.green : C.muted, cursor:"pointer" }}>
          {w.status==="published" ? "Live" : "Entwurf"}
        </button>
      </div>
    </div>
  );
}

// ── Verfügbarkeit ─────────────────────────────────────────────────────
const WEEKDAYS = ["Mo","Di","Mi","Do","Fr","Sa","So"];
const WEEKDAY_FULL = ["Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag","Sonntag"];

function AvailabilityEditor({ userId, onClose }) {
  const [slots, setSlots] = useState({});
  const [day,   setDay]   = useState("Mo");
  const [time,  setTime]  = useState("09:00");
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  useEffect(() => {
    supabase.from("profiles").select("availability_slots")
      .eq("id", userId).single()
      .then(({ data }) => {
        if (data?.availability_slots) setSlots(data.availability_slots);
      });
  }, [userId]);

  function addSlot() {
    if (!time.match(/^\d{2}:\d{2}$/)) return;
    setSlots(s => {
      const u = { ...s };
      if (!u[day]) u[day] = [];
      if (!u[day].includes(time)) u[day] = [...u[day], time].sort();
      return u;
    });
  }

  function removeSlot(d, t) {
    setSlots(s => {
      const u = { ...s };
      u[d] = u[d].filter(x => x !== t);
      if (!u[d].length) delete u[d];
      return u;
    });
  }

  async function save() {
    setSaving(true);
    await supabase.from("profiles")
      .update({ availability_slots: slots, availability: true })
      .eq("id", userId);
    setSaving(false);
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 1000);
  }

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)",
      zIndex:600   /* Z.critical */, display:"flex", alignItems:"flex-end" }}
      onClick={e => { if(e.target===e.currentTarget) onClose(); }}>
      <div style={{ background:C.card, borderRadius:"22px 22px 0 0", width:"100%",
        maxHeight:"85vh", display:"flex", flexDirection:"column",
        paddingBottom:"max(24px,env(safe-area-inset-bottom,24px))" }}>
        <div style={{ padding:"18px 20px 14px", borderBottom:`1px solid ${C.border}`,
          display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontWeight:800, fontSize:17, color:C.ink }}>Verfügbarkeit</div>
            <div style={{ fontSize:12, color:C.muted }}>Wann bist du buchbar?</div>
          </div>
          <button className="cd-tap" onClick={onClose}
            style={{ background:"rgba(0,0,0,0.06)", border:"none", borderRadius:"50%",
              width:32, height:32, cursor:"pointer", fontSize:16, color:C.muted }}>✕</button>
        </div>

        <div className="cd-scroll" style={{ flex:1, overflowY:"auto", padding:"16px 20px" }}>
          {/* Add slot */}
          <div style={{ background:C.tealPale, borderRadius:14, padding:"12px",
            marginBottom:18, border:`1px solid ${C.teal}30` }}>
            <div style={{ fontWeight:700, fontSize:12, color:C.teal, marginBottom:10 }}>
              + Neuer Slot
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <select value={day} onChange={e=>setDay(e.target.value)}
                style={{ flex:1, padding:"9px 10px", borderRadius:10,
                  border:`1.5px solid ${C.teal}40`, fontSize:13, outline:"none" }}>
                {WEEKDAYS.map((d,i) => <option key={d} value={d}>{WEEKDAY_FULL[i]}</option>)}
              </select>
              <input type="time" value={time} onChange={e=>setTime(e.target.value)}
                style={{ flex:1, padding:"9px", borderRadius:10,
                  border:`1.5px solid ${C.teal}40`, fontSize:13, outline:"none" }} />
              <button className="cd-tap" onClick={addSlot}
                style={{ background:C.teal, color:"white", border:"none",
                  borderRadius:10, padding:"9px 14px", fontWeight:700, fontSize:15,
                  cursor:"pointer" }}>+</button>
            </div>
          </div>

          {/* Slots */}
          {WEEKDAYS.filter(d => slots[d]?.length).map((d,i) => (
            <div key={d} style={{ marginBottom:14 }}>
              <div style={{ fontWeight:700, fontSize:13, color:C.ink,
                marginBottom:8, display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:26, height:26, borderRadius:"50%", background:C.teal,
                  color:"white", display:"flex", alignItems:"center",
                  justifyContent:"center", fontSize:10, fontWeight:800 }}>{d}</div>
                {WEEKDAY_FULL[WEEKDAYS.indexOf(d)]}
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                {slots[d].map(t => (
                  <div key={t} className="cd-tap" onClick={() => removeSlot(d,t)}
                    style={{ padding:"6px 12px", background:C.tealPale,
                      border:`1px solid ${C.teal}40`, borderRadius:50,
                      fontSize:12, fontWeight:700, color:C.teal, cursor:"pointer",
                      display:"flex", alignItems:"center", gap:5 }}>
                    {t} <span style={{ opacity:.6, fontSize:11 }}>✕</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {Object.keys(slots).length === 0 && (
            <div style={{ textAlign:"center", padding:"30px 0", color:C.muted, fontSize:14 }}>
              Noch keine Slots. Füge welche hinzu.
            </div>
          )}
        </div>

        <div style={{ padding:"12px 20px 0" }}>
          <button className="cd-tap" onClick={save} disabled={saving}
            style={{ width:"100%", padding:"14px",
              background: saved ? C.green : `linear-gradient(135deg,${C.teal},${C.teal2})`,
              border:"none", borderRadius:50, fontSize:15, fontWeight:800,
              color:"white", cursor:"pointer", fontFamily:"inherit",
              transition:"background .3s" }}>
            {saving ? "Speichern..." : saved ? "✓ Gespeichert" : "Speichern"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────
export default function CreatorDashboard({ onClose, onCreateWork, onCreateExp }) {
  const { user } = useAuth();
  const [stats,     setStats]     = useState(null);
  const [works,     setWorks]     = useState([]);
  const [bookings,  setBookings]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState("uebersicht");
  const [showAvail, setShowAvail] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      // 1. Works
      const { data: worksData } = await supabase
        .from("works")
        .select("id, title, price, cover_url, images, status, views, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setWorks(worksData || []);

      // 2. Bookings (als Wirker)
      const { data: bookData } = await supabase
        .from("bookings")
        .select("id, status, amount, total_amount, scheduled_at, created_at, client_name, service_title, work_title")
        .eq("wirker_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      setBookings(bookData || []);

      // 3. Stats aggregation
      const published = (worksData||[]).filter(w => w.status==="published").length;
      const totalViews = (worksData||[]).reduce((s,w) => s + (w.views||0), 0);
      const totalEarned = (bookData||[])
        .filter(b => b.status==="completed")
        .reduce((s,b) => s + (+b.amount||+b.total_amount||0), 0);
      const pendingCount = (bookData||[]).filter(b => b.status==="pending").length;

      // 4. Recommendations count
      const { count: recCount } = await supabase
        .from("recommendations")
        .select("id", { count:"exact" })
        .eq("wirker_id", user.id);

      // 5. Story views
      const { count: storyViews } = await supabase
        .from("story_views")
        .select("id", { count:"exact" })
        .in("story_id",
          await supabase.from("stories").select("id").eq("user_id", user.id)
            .then(({data}) => (data||[]).map(s=>s.id))
        );

      setStats({
        worksPublished: published,
        totalViews,
        totalEarned: totalEarned.toFixed(2),
        pendingBookings: pendingCount,
        recommendations: recCount || 0,
        storyViews: storyViews || 0,
      });
    } catch(e) {
      console.error("[CreatorDashboard]", e.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  async function handleAcceptBooking(id) {
    if (!user?.id) return;
    const { error } = await supabase
      .from("bookings")
      .update({ status: "confirmed", updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("wirker_user_id", user.id);
    if (error) { console.error("[Dashboard] accept failed:", error.message); return; }
    setBookings(prev => prev.map(b => b.id===id ? {...b, status:"confirmed"} : b));
  }

  async function handleDeclineBooking(id) {
    if (!user?.id) return;
    const { error } = await supabase
      .from("bookings")
      .update({ status: "declined", updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("wirker_user_id", user.id);
    if (error) { console.error("[Dashboard] decline failed:", error.message); return; }
    setBookings(prev => prev.map(b => b.id===id ? {...b, status:"declined"} : b));
  }

  async function handleToggleWork(w) {
    if (!user?.id) return;
    const newStatus = w.status === "published" ? "draft" : "published";
    const { error } = await supabase
      .from("works")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", w.id)
      .eq("user_id", user.id);
    if (error) { console.error("[Dashboard] toggle failed:", error.message); return; }
    setWorks(prev => prev.map(wk => wk.id===w.id ? {...wk, status:newStatus} : wk));
  }

  const pendingBookings = bookings.filter(b => b.status==="pending");
  const otherBookings   = bookings.filter(b => b.status!=="pending");

  const TABS = [
    { key:"uebersicht", label:"Übersicht" },
    { key:"werke",      label:`Werke (${works.length})` },
    { key:"buchungen",  label:`Buchungen${pendingBookings.length ? ` · ${pendingBookings.length}` : ""}` },
  ];

  return (
    <>
      <style>{CSS}</style>

      {showAvail && (
        <AvailabilityEditor userId={user?.id} onClose={() => { setShowAvail(false); load(); }} />
      )}

      <div style={{ position:"fixed", inset:0, zIndex:300, background:C.cream,
        overflowY:"auto", animation:"cdFadeUp .25s ease both" }}
        className="cd-scroll">

        {/* ── HEADER ── */}
        <div style={{ padding:"max(52px,env(safe-area-inset-top,52px)) 20px 0",
          background:`linear-gradient(to bottom, ${C.teal}0A, transparent)` }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:4 }}>
            {onClose && (
              <button className="cd-tap" onClick={onClose}
                style={{ background:"rgba(0,0,0,0.06)", border:"none", borderRadius:"50%",
                  width:38, height:38, cursor:"pointer", fontSize:18, color:C.ink,
                  display:"flex", alignItems:"center", justifyContent:"center" }}>
                ←
              </button>
            )}
            <div>
              <div style={{ fontSize:22, fontWeight:900, color:C.ink, letterSpacing:-.3 }}>
                Creator Studio
              </div>
              <div style={{ fontSize:13, color:C.muted }}>Deine Zahlen, deine Inhalte.</div>
            </div>
          </div>

          {/* Quick actions */}
          <div style={{ display:"flex", gap:8, marginTop:16, marginBottom:4 }}>
            <button className="cd-tap" onClick={onCreateWork}
              style={{ flex:1, padding:"11px 8px",
                background:`linear-gradient(135deg,${C.teal},${C.teal2})`,
                border:"none", borderRadius:14, fontSize:13, fontWeight:700,
                color:"white", cursor:"pointer", fontFamily:"inherit" }}>
              + Werk
            </button>
            <button className="cd-tap" onClick={onCreateExp}
              style={{ flex:1, padding:"11px 8px",
                background:`linear-gradient(135deg,${C.coral}CC,${C.coral})`,
                border:"none", borderRadius:14, fontSize:13, fontWeight:700,
                color:"white", cursor:"pointer", fontFamily:"inherit" }}>
              + Erlebnis
            </button>
            <button className="cd-tap" onClick={() => setShowAvail(true)}
              style={{ flex:1, padding:"11px 8px",
                background:C.card, border:`1px solid ${C.border}`,
                borderRadius:14, fontSize:13, fontWeight:700,
                color:C.ink, cursor:"pointer", fontFamily:"inherit" }}>
              🗓 Slots
            </button>
          </div>
        </div>

        {/* ── TABS ── */}
        <div style={{ padding:"16px 20px 0" }}>
          <div style={{ display:"flex", gap:4, background:"rgba(0,0,0,0.05)",
            borderRadius:50, padding:4 }}>
            {TABS.map(t => (
              <button key={t.key} className="cd-tap"
                onClick={() => setTab(t.key)}
                style={{ flex:1, padding:"9px 4px",
                  background: tab===t.key
                    ? `linear-gradient(135deg,${C.teal},${C.teal2})`
                    : "transparent",
                  border:"none", borderRadius:50,
                  fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
                  color: tab===t.key ? "white" : C.muted,
                  transition:"all .2s", whiteSpace:"nowrap" }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding:"20px 20px 100px" }}>

          {/* ══ ÜBERSICHT ══════════════════════════════════════════════ */}
          {tab === "uebersicht" && (
            <div style={{ animation:"cdFadeUp .3s ease both" }}>

              {/* Stats grid */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
                <StatCard icon="👁" label="Gesamt-Views" loading={loading}
                  value={stats?.totalViews ?? "—"} accent={C.teal} />
                <StatCard icon="💰" label="Verdient" loading={loading}
                  value={stats ? `€ ${stats.totalEarned}` : "—"} accent={C.coral} />
                <StatCard icon="📦" label="Werke live" loading={loading}
                  value={stats?.worksPublished ?? "—"} accent={C.gold} />
                <StatCard icon="⭐" label="Empfehlungen" loading={loading}
                  value={stats?.recommendations ?? "—"} accent={C.green} />
              </div>

              {/* Story views */}
              <div style={{ background:C.card, borderRadius:18, padding:"14px 16px",
                marginBottom:16, border:`1px solid ${C.border}`,
                display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ fontSize:28 }}>📸</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:13, color:C.ink }}>Story-Aufrufe</div>
                  <div style={{ fontSize:11, color:C.muted }}>Wie oft deine Stories angesehen wurden</div>
                </div>
                {loading
                  ? <Skel w={40} h={22} r={6} />
                  : <div style={{ fontSize:20, fontWeight:900, color:C.teal }}>
                      {stats?.storyViews ?? 0}
                    </div>}
              </div>

              {/* Pending bookings preview */}
              {pendingBookings.length > 0 && (
                <div>
                  <div style={{ fontSize:13, fontWeight:800, color:C.ink,
                    marginBottom:10, display:"flex", alignItems:"center", gap:6 }}>
                    <div style={{ width:8, height:8, borderRadius:"50%",
                      background:C.gold, animation:"cdPulse 1.5s infinite" }} />
                    {pendingBookings.length} ausstehende Anfrage{pendingBookings.length>1?"n":""}
                  </div>
                  {pendingBookings.map(b => (
                    <BookingRow key={b.id} b={b}
                      onAccept={handleAcceptBooking}
                      onDecline={handleDeclineBooking} />
                  ))}
                </div>
              )}

              {!loading && pendingBookings.length === 0 && stats?.totalEarned === "0.00" && (
                <div style={{ textAlign:"center", padding:"30px 0" }}>
                  <div style={{ fontSize:36, marginBottom:12 }}>🌱</div>
                  <div style={{ fontSize:15, fontWeight:700, color:C.ink, marginBottom:6 }}>
                    Dein Studio wartet
                  </div>
                  <div style={{ fontSize:13, color:C.muted, lineHeight:1.6 }}>
                    Lade dein erstes Werk hoch und werde sichtbar.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ WERKE ══════════════════════════════════════════════════ */}
          {tab === "werke" && (
            <div style={{ animation:"cdFadeUp .3s ease both" }}>
              {loading
                ? [0,1,2].map(i => <Skel key={i} h={72} r={14} mb={8} />)
                : works.length > 0
                  ? works.map(w => (
                      <WorkRow key={w.id} w={w}
                        onToggle={handleToggleWork}
                        onDelete={() => {}} />
                    ))
                  : (
                    <div style={{ textAlign:"center", padding:"40px 0" }}>
                      <div style={{ fontSize:36, marginBottom:12 }}>🎨</div>
                      <div style={{ fontSize:14, color:C.muted }}>
                        Noch keine Werke — leg los!
                      </div>
                      <button className="cd-tap" onClick={onCreateWork}
                        style={{ marginTop:16, padding:"12px 24px",
                          background:`linear-gradient(135deg,${C.teal},${C.teal2})`,
                          border:"none", borderRadius:50, fontSize:14, fontWeight:700,
                          color:"white", cursor:"pointer", fontFamily:"inherit" }}>
                        Erstes Werk hochladen
                      </button>
                    </div>
                  )}
            </div>
          )}

          {/* ══ BUCHUNGEN ══════════════════════════════════════════════ */}
          {tab === "buchungen" && (
            <div style={{ animation:"cdFadeUp .3s ease both" }}>
              {loading
                ? [0,1,2].map(i => <Skel key={i} h={88} r={14} mb={8} />)
                : bookings.length > 0 ? (
                  <>
                    {pendingBookings.length > 0 && (
                      <>
                        <div style={{ fontSize:11, fontWeight:800, color:C.gold,
                          textTransform:"uppercase", letterSpacing:.8, marginBottom:8 }}>
                          Ausstehend
                        </div>
                        {pendingBookings.map(b => (
                          <BookingRow key={b.id} b={b}
                            onAccept={handleAcceptBooking}
                            onDecline={handleDeclineBooking} />
                        ))}
                      </>
                    )}
                    {otherBookings.length > 0 && (
                      <>
                        <div style={{ fontSize:11, fontWeight:800, color:C.muted,
                          textTransform:"uppercase", letterSpacing:.8,
                          margin:"16px 0 8px" }}>
                          Alle Buchungen
                        </div>
                        {otherBookings.map(b => (
                          <BookingRow key={b.id} b={b}
                            onAccept={handleAcceptBooking}
                            onDecline={handleDeclineBooking} />
                        ))}
                      </>
                    )}
                  </>
                ) : (
                  <div style={{ textAlign:"center", padding:"40px 0" }}>
                    <div style={{ fontSize:36, marginBottom:12 }}>📅</div>
                    <div style={{ fontSize:14, color:C.muted }}>
                      Noch keine Buchungen. Werde sichtbar — poste ein Werk oder eine Story.
                    </div>
                  </div>
                )}
            </div>
          )}

        </div>
      </div>
    </>
  );
}