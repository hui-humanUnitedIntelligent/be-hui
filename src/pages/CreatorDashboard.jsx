// src/pages/CreatorDashboard.jsx — HUI Phase 4D
// Creator Dashboard — Einnahmen · Buchungen · Verkäufe · Analytics
// Nicht überladen. Nicht aggressiv. Kreative Klarheit.
// ══════════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useCallback } from "react";
import { useAuth }           from "../lib/AuthContext";
import { supabase }          from "../lib/supabaseClient.js";
import { getCreatorSummary, bookingService, supportService, salesService }
  from "../services/creatorEconomy.js";

// ── Design ───────────────────────────────────────────────────────────
const T = {
  bg:      "#F9F7F4",
  card:    "#FFFFFF",
  ink:     "#1A1A2E",
  soft:    "rgba(26,26,46,0.50)",
  muted:   "rgba(26,26,46,0.35)",
  teal:    "#16D7C5",
  coral:   "#FF8A6B",
  gold:    "#F5A623",
  border:  "rgba(26,26,46,0.07)",
  shadow:  "0 2px 20px rgba(26,26,46,0.07)",
  r:       24,
};

const TABS = [
  { id:"overview",    label:"Übersicht",     icon:"✦" },
  { id:"bookings",    label:"Buchungen",      icon:"📅" },
  { id:"sales",       label:"Verkäufe",       icon:"🎨" },
  { id:"supports",    label:"Unterstützung",  icon:"💫" },
  { id:"analytics",   label:"Einblicke",      icon:"📊" },
];

let _css = false;
function injectCSS() {
  if (_css || typeof document === "undefined") return; _css = true;
  const s = document.createElement("style");
  s.textContent = `
    @keyframes cd-rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
    @keyframes cd-glow{0%,100%{box-shadow:0 0 24px rgba(22,215,197,0.18)}
      50%{box-shadow:0 0 40px rgba(22,215,197,0.32)}}
    @keyframes cd-pulse{0%,100%{opacity:0.7}50%{opacity:1}}
    .cd-tap{-webkit-tap-highlight-color:transparent;touch-action:manipulation;}
    .cd-scroll::-webkit-scrollbar{display:none}
    .cd-scroll{-ms-overflow-style:none;scrollbar-width:none}
  `;
  document.head.appendChild(s);
}

// ── Stat Card ────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon, color, delay=0, onClick }) {
  return (
    <div onClick={onClick} style={{
      flex: 1, background: T.card, borderRadius: T.r,
      padding: "18px 16px", border: `1px solid ${T.border}`,
      boxShadow: T.shadow, cursor: onClick ? "pointer" : "default",
      animation: `cd-rise 0.5s ${delay}s ease both`,
      transition: "transform 0.18s ease, box-shadow 0.18s ease",
      minWidth: 0,
    }}
    onTouchStart={e => { if(onClick) e.currentTarget.style.transform="scale(0.97)"; }}
    onTouchEnd={e => { if(onClick) e.currentTarget.style.transform="scale(1)"; }}>
      <div style={{fontSize:22,marginBottom:8}}>{icon}</div>
      <div style={{fontSize:22,fontWeight:800,color:color||T.ink,letterSpacing:-0.5,lineHeight:1.1}}>
        {value}
      </div>
      <div style={{fontSize:11,fontWeight:600,color:T.muted,letterSpacing:0.4,marginTop:5,
        textTransform:"uppercase"}}>{label}</div>
      {sub && <div style={{fontSize:11,color:T.soft,marginTop:3}}>{sub}</div>}
    </div>
  );
}

// ── Wallet Hero ──────────────────────────────────────────────────────
function WalletHero({ wallet }) {
  const fmt = v => `€ ${parseFloat(v||0).toFixed(2)}`;
  return (
    <div style={{
      margin:"0 16px 16px",
      borderRadius:28,
      background:`linear-gradient(135deg, #0D1B2A 0%, #16384A 100%)`,
      padding:"28px 24px",
      boxShadow:"0 8px 40px rgba(6,10,20,0.25)",
      animation:"cd-glow 4s ease infinite, cd-rise 0.4s ease both",
      position:"relative",overflow:"hidden",
    }}>
      {/* Ambient glow */}
      <div style={{position:"absolute",top:-40,right:-40,
        width:160,height:160,borderRadius:"50%",
        background:"rgba(22,215,197,0.12)",filter:"blur(32px)",pointerEvents:"none"}}/>
      <div style={{position:"relative"}}>
        <div style={{fontSize:12,fontWeight:600,color:"rgba(255,255,255,0.45)",
          letterSpacing:1.2,marginBottom:6}}>DEIN GUTHABEN</div>
        <div style={{fontSize:42,fontWeight:800,color:"white",letterSpacing:-1.5,lineHeight:1}}>
          {fmt(wallet?.balance)}
        </div>
        <div style={{display:"flex",gap:24,marginTop:18}}>
          <div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.40)",letterSpacing:0.4}}>OFFEN</div>
            <div style={{fontSize:16,fontWeight:700,color:"rgba(22,215,197,0.85)"}}>
              {fmt(wallet?.pending_balance)}
            </div>
          </div>
          <div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.40)",letterSpacing:0.4}}>GESAMT</div>
            <div style={{fontSize:16,fontWeight:700,color:"rgba(255,138,107,0.85)"}}>
              {fmt(wallet?.total_earned)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Booking Card ─────────────────────────────────────────────────────
function BookingCard({ booking, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const status = booking?.booking_status;
  const statusColor = {
    pending:"rgba(245,166,35,0.15)", confirmed:"rgba(22,215,197,0.12)",
    completed:"rgba(26,26,46,0.07)", cancelled:"rgba(255,138,107,0.10)"
  }[status] || "rgba(26,26,46,0.07)";
  const statusText = {
    pending:"Anfrage", confirmed:"Bestätigt",
    completed:"Abgeschlossen", cancelled:"Abgesagt"
  }[status] || status;

  const handle = async (newStatus) => {
    setLoading(true);
    await bookingService.updateStatus(booking.id, newStatus);
    onUpdate?.();
    setLoading(false);
  };

  return (
    <div style={{background:T.card,borderRadius:20,padding:"16px",
      border:`1px solid ${T.border}`,boxShadow:T.shadow,marginBottom:10}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
        <div style={{width:38,height:38,borderRadius:12,overflow:"hidden",
          background:"rgba(22,215,197,0.10)",flexShrink:0,
          display:"flex",alignItems:"center",justifyContent:"center",
          fontSize:16,fontWeight:700,color:T.teal}}>
          {booking?.guest?.avatar_url
            ? <img loading="lazy" decoding="async" src={booking.guest.avatar_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
            : (booking?.guest?.display_name||"G")[0].toUpperCase()}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:13.5,fontWeight:700,color:T.ink,
            overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
            {booking?.guest?.display_name || "Gast"}
          </div>
          <div style={{fontSize:11,color:T.soft}}>
            {booking?.experience?.title||"Erlebnis"} · {booking?.seats||1} Platz
          </div>
        </div>
        <div style={{padding:"4px 10px",borderRadius:20,background:statusColor,
          fontSize:10,fontWeight:700,color:T.ink,letterSpacing:0.3}}>
          {statusText}
        </div>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontSize:17,fontWeight:800,color:T.teal}}>
          € {parseFloat(booking?.amount||0).toFixed(2)}
        </div>
        {status === "pending" && (
          <div style={{display:"flex",gap:8}}>
            <button className="cd-tap" disabled={loading} onClick={() => handle("confirmed")}
              style={{padding:"7px 14px",borderRadius:12,border:"none",
                background:`linear-gradient(135deg,${T.teal},${T.coral})`,
                color:"white",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
              Bestätigen
            </button>
            <button className="cd-tap" disabled={loading} onClick={() => handle("cancelled")}
              style={{padding:"7px 14px",borderRadius:12,
                border:`1.5px solid ${T.border}`,
                background:"transparent",color:T.soft,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>
              Absagen
            </button>
          </div>
        )}
        {status === "confirmed" && (
          <button className="cd-tap" disabled={loading} onClick={() => handle("completed")}
            style={{padding:"7px 14px",borderRadius:12,border:"none",
              background:"rgba(22,215,197,0.12)",color:T.teal,
              fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
            Abschließen
          </button>
        )}
      </div>
      {booking?.guest_message && (
        <div style={{marginTop:10,padding:"10px 12px",borderRadius:12,
          background:"rgba(26,26,46,0.04)",
          fontSize:12,color:T.soft,lineHeight:1.5,fontStyle:"italic"}}>
          „{booking.guest_message}"
        </div>
      )}
    </div>
  );
}

// ── Support Card ─────────────────────────────────────────────────────
function SupportCard({ support }) {
  return (
    <div style={{background:T.card,borderRadius:20,padding:"14px 16px",
      border:`1px solid ${T.border}`,boxShadow:T.shadow,marginBottom:10,
      display:"flex",alignItems:"center",gap:12}}>
      <div style={{width:38,height:38,borderRadius:12,overflow:"hidden",
        background:"rgba(255,138,107,0.10)",flexShrink:0,
        display:"flex",alignItems:"center",justifyContent:"center",
        fontSize:15,fontWeight:700,color:T.coral}}>
        {support?.supporter?.avatar_url
          ? <img loading="lazy" decoding="async" src={support.supporter.avatar_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
          : (support?.supporter?.display_name||"S")[0].toUpperCase()}
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:13.5,fontWeight:700,color:T.ink}}>
          {support?.supporter?.display_name || "Jemand"}
        </div>
        {support?.message && (
          <div style={{fontSize:11,color:T.soft,marginTop:2,
            overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
            „{support.message}"
          </div>
        )}
      </div>
      <div style={{fontSize:16,fontWeight:800,color:T.coral,flexShrink:0}}>
        +€ {parseFloat(support?.amount||0).toFixed(2)}
      </div>
    </div>
  );
}

// ── Analytics Overview ───────────────────────────────────────────────
function AnalyticsView({ analytics }) {
  const items = [
    { label:"Profilaufrufe",  value: analytics?.profile_views||0, icon:"👁", color:T.teal },
    { label:"Story Views",    value: analytics?.story_views||0,   icon:"📖", color:T.coral },
    { label:"Werk-Aufrufe",   value: analytics?.work_views||0,    icon:"🎨", color:T.gold },
  ];
  return (
    <div style={{padding:"0 16px"}}>
      <div style={{fontSize:12,color:T.soft,marginBottom:14,fontWeight:500}}>
        Letzte 7 Tage
      </div>
      {items.map((it,i) => (
        <div key={it.label} style={{display:"flex",alignItems:"center",gap:14,
          padding:"14px 0",borderBottom: i<items.length-1 ? `1px solid ${T.border}`:"none"}}>
          <div style={{fontSize:20,width:36,textAlign:"center"}}>{it.icon}</div>
          <div style={{flex:1}}>
            <div style={{fontSize:13.5,fontWeight:600,color:T.ink}}>{it.label}</div>
          </div>
          <div style={{fontSize:20,fontWeight:800,color:it.color}}>{it.value}</div>
        </div>
      ))}
      <div style={{marginTop:20,padding:"16px",borderRadius:18,
        background:"rgba(22,215,197,0.07)",border:`1px solid rgba(22,215,197,0.15)`}}>
        <div style={{fontSize:12,color:T.teal,fontWeight:600,marginBottom:4}}>💡 Einblick</div>
        <div style={{fontSize:13,color:T.soft,lineHeight:1.6}}>
          Erweiterte Analytics kommen bald. Fokussiere dich jetzt auf echte Verbindungen —
          das ist das Herz von HUI.
        </div>
      </div>
    </div>
  );
}

// ── Empty State ──────────────────────────────────────────────────────
function EmptyState({ icon, title, sub }) {
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",
      justifyContent:"center",padding:"48px 32px",textAlign:"center"}}>
      <div style={{fontSize:40,marginBottom:16,animation:"cd-pulse 3s ease infinite"}}>{icon}</div>
      <div style={{fontSize:16,fontWeight:700,color:T.ink,marginBottom:8}}>{title}</div>
      <div style={{fontSize:13,color:T.soft,lineHeight:1.6}}>{sub}</div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ════════════════════════════════════════════════════════════════════

export default function CreatorDashboard({ visible, onClose, onOpenProfile }) {
  injectCSS();
  const { user, profile, isTalent } = useAuth();
  const [tab,       setTab]       = useState("overview");
  const [summary,   setSummary]   = useState(null);
  const [bookings,  setBookings]  = useState([]);
  const [supports,  setSupports]  = useState([]);
  const [sales,     setSales]     = useState([]);
  const [loading,   setLoading]   = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const [sum, bk, sp, sl] = await Promise.all([
      getCreatorSummary(user.id),
      bookingService.forCreator(user.id, { limit: 20 }),
      supportService.received(user.id, { limit: 20 }),
      salesService.forCreator(user.id, { limit: 20 }),
    ]);
    setSummary(sum);
    setBookings(Array.isArray(bk) ? bk : []);
    setSupports(Array.isArray(sp) ? sp : []);
    setSales(Array.isArray(sl) ? sl : []);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { if (visible && user?.id) load(); }, [visible, user?.id, load]);

  if (!visible) return null;
  if (!isTalent) return null; // Nur für Talente

  const w = summary?.wallet;

  return (
    <div style={{
      position:"fixed",inset:0,zIndex:10500,
      background:T.bg,
      fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif",
      WebkitFontSmoothing:"antialiased",
      display:"flex",flexDirection:"column",
      overflow:"hidden",
    }}>
      {/* ── Header ── */}
      <div style={{
        display:"flex",alignItems:"center",justifyContent:"space-between",
        padding:"max(18px,env(safe-area-inset-top,18px)) 20px 0",
        flexShrink:0,
      }}>
        <div>
          <div style={{fontSize:11,fontWeight:600,color:T.soft,letterSpacing:0.8}}>TALENT STUDIO</div>
          <div style={{fontSize:22,fontWeight:800,color:T.ink,letterSpacing:-0.5}}>
            Dein kreativer Raum
          </div>
        </div>
        <button className="cd-tap" onClick={onClose}
          style={{width:36,height:36,borderRadius:"50%",border:`1.5px solid ${T.border}`,
            background:"white",display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:14,color:T.soft,cursor:"pointer",fontFamily:"inherit"}}>✕</button>
      </div>

      {/* ── Tabs ── */}
      <div className="cd-scroll" style={{
        display:"flex",gap:6,padding:"16px 16px 0",
        overflowX:"auto",flexShrink:0,
      }}>
        {TABS.map(t => (
          <button key={t.id} className="cd-tap" onClick={() => setTab(t.id)}
            style={{
              flexShrink:0,padding:"8px 16px",borderRadius:20,border:"none",
              background: tab===t.id
                ? `linear-gradient(135deg,${T.teal},${T.coral})`
                : "rgba(26,26,46,0.07)",
              color: tab===t.id ? "white" : T.soft,
              fontSize:13,fontWeight: tab===t.id ? 700:500,
              cursor:"pointer",fontFamily:"inherit",
              transition:"all 0.18s ease",
              whiteSpace:"nowrap",
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="cd-scroll" style={{flex:1,overflowY:"auto",padding:"16px 0 32px"}}>
        {loading ? (
          <div style={{display:"flex",justifyContent:"center",alignItems:"center",height:200}}>
            <div style={{fontSize:28,animation:"cd-pulse 1.5s ease infinite"}}>✦</div>
          </div>
        ) : (
          <>
            {/* OVERVIEW */}
            {tab==="overview" && (
              <>
                <WalletHero wallet={w}/>
                {/* Stats Grid */}
                <div style={{display:"flex",gap:10,padding:"0 16px",marginBottom:16}}>
                  <StatCard icon="📅" label="Buchungen offen"
                    value={summary?.bookings?.pending||0}
                    color={T.gold} delay={0.05}
                    onClick={() => setTab("bookings")}/>
                  <StatCard icon="💫" label="Unterstützungen"
                    value={summary?.supports_30d?.count||0}
                    sub={`€ ${parseFloat(summary?.supports_30d?.total||0).toFixed(0)} / 30 Tage`}
                    color={T.coral} delay={0.10}
                    onClick={() => setTab("supports")}/>
                  <StatCard icon="🎨" label="Verkäufe"
                    value={summary?.sales_30d?.count||0}
                    sub={`€ ${parseFloat(summary?.sales_30d?.total||0).toFixed(0)} / 30 Tage`}
                    color={T.teal} delay={0.15}
                    onClick={() => setTab("sales")}/>
                </div>
                {/* Analytics Preview */}
                <div style={{margin:"0 16px",background:T.card,borderRadius:T.r,
                  border:`1px solid ${T.border}`,boxShadow:T.shadow,padding:"16px"}}>
                  <div style={{fontSize:13,fontWeight:700,color:T.ink,marginBottom:14}}>
                    📊 Einblicke — letzte 7 Tage
                  </div>
                  <div style={{display:"flex",gap:16}}>
                    {[
                      {label:"Profil",v:summary?.analytics_7d?.profile_views||0,c:T.teal},
                      {label:"Stories",v:summary?.analytics_7d?.story_views||0,c:T.coral},
                      {label:"Werke",v:summary?.analytics_7d?.work_views||0,c:T.gold},
                    ].map(it => (
                      <div key={it.label} style={{flex:1,textAlign:"center",
                        padding:"12px 8px",borderRadius:16,background:"rgba(26,26,46,0.04)"}}>
                        <div style={{fontSize:22,fontWeight:800,color:it.c}}>{it.v}</div>
                        <div style={{fontSize:10,color:T.muted,letterSpacing:0.3,marginTop:4}}>
                          {it.label.toUpperCase()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* BOOKINGS */}
            {tab==="bookings" && (
              <div style={{padding:"0 16px"}}>
                {bookings.length === 0
                  ? <EmptyState icon="📅"
                      title="Keine Buchungen"
                      sub="Sobald jemand eines deiner Erlebnisse bucht, siehst du es hier."/>
                  : bookings.map(b => (
                    <BookingCard key={b.id} booking={b} onUpdate={load}/>
                  ))
                }
              </div>
            )}

            {/* SUPPORTS */}
            {tab==="supports" && (
              <div style={{padding:"0 16px"}}>
                {supports.length === 0
                  ? <EmptyState icon="💫"
                      title="Noch keine Unterstützungen"
                      sub="Wenn jemand dich unterstützt, erscheint es hier. Sei präsent — die Gemeinschaft sieht dich."/>
                  : supports.map(s => <SupportCard key={s.id} support={s}/>)
                }
              </div>
            )}

            {/* SALES */}
            {tab==="sales" && (
              <div style={{padding:"0 16px"}}>
                {sales.length === 0
                  ? <EmptyState icon="🎨"
                      title="Noch keine Werkverkäufe"
                      sub="Markiere deine Werke als käuflich, um hier Einnahmen zu sehen."/>
                  : sales.map(s => (
                    <div key={s.id} style={{background:T.card,borderRadius:20,
                      padding:"14px 16px",border:`1px solid ${T.border}`,
                      boxShadow:T.shadow,marginBottom:10,
                      display:"flex",alignItems:"center",gap:12}}>
                      <div style={{width:38,height:38,borderRadius:12,overflow:"hidden",
                        background:"rgba(22,215,197,0.10)",flexShrink:0}}>
                        {s?.work?.cover_url
                          ? <img loading="lazy" decoding="async" src={s.work.cover_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                          : <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",
                              justifyContent:"center",fontSize:16}}>🎨</div>}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13.5,fontWeight:700,color:T.ink,
                          overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                          {s?.work?.title||"Werk"}
                        </div>
                        <div style={{fontSize:11,color:T.soft}}>
                          von {s?.buyer?.display_name||"Käufer:in"}
                        </div>
                      </div>
                      <div style={{fontSize:16,fontWeight:800,color:T.teal,flexShrink:0}}>
                        +€ {parseFloat(s?.amount||0).toFixed(2)}
                      </div>
                    </div>
                  ))
                }
              </div>
            )}

            {/* ANALYTICS */}
            {tab==="analytics" && (
              <AnalyticsView analytics={summary?.analytics_7d}/>
            )}

            {/* MERKEN */}

          </>
        )}
      </div>
    </div>
  );
}
