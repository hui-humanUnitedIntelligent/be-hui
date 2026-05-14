// ProfilePage.jsx — Premium Creator Profile
// Props-basiert: kein useNavigate/useParams direkt → Router-safe
import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/AuthContext";

/* ── Tokens ─────────────────────────────────────────────────────────── */
const C = {
  teal:"#16D7C5", teal2:"#11C5B7", tealPale:"rgba(22,215,197,0.10)",
  tealGlow:"rgba(22,215,197,0.25)", tealBorder:"rgba(22,215,197,0.28)",
  coral:"#FF8A6B", coral2:"#FF7055", coralPale:"rgba(255,138,107,0.10)",
  coralGlow:"rgba(255,138,107,0.25)",
  gold:"#F5A623", goldPale:"rgba(245,166,35,0.10)",
  purple:"#A78BFA", purplePale:"rgba(167,139,250,0.10)",
  warm:"#F9F7F4", warmCard:"#FFFFFF",
  ink:"#1A1A1A", ink2:"#3A3A3A", ink3:"#5A5A5A",
  muted:"#9A9A9A", muted2:"#C8C8C8",
  border:"rgba(0,0,0,0.07)",
  borderLight:"rgba(0,0,0,0.04)",
  glass:"rgba(255,255,255,0.72)",
  glassDark:"rgba(0,0,0,0.38)",
};

const CSS = `
  @keyframes ppFadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes ppPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }
  @keyframes ppSpin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
  @keyframes ppSkel { 0%,100%{opacity:1} 50%{opacity:0.45} }
  @keyframes ppGlow { 0%,100%{box-shadow:0 0 0 0 rgba(22,215,197,0)} 50%{box-shadow:0 0 0 8px rgba(22,215,197,0)} }
  @keyframes ppShimmer {
    0%{background-position:-200% 0}
    100%{background-position:200% 0}
  }
  .pp-tap { cursor:pointer; -webkit-tap-highlight-color:transparent; }
  .pp-tap:active { opacity:0.72; transform:scale(0.97); transition:all 0.12s; }
  .pp-scroll::-webkit-scrollbar { display:none; }
  .pp-scroll { -ms-overflow-style:none; scrollbar-width:none; }
  * { box-sizing:border-box; }
`;

/* ── Helpers ─────────────────────────────────────────────────────────── */
function fmtEur(n) {
  if (!n && n !== 0) return "—";
  return `€ ${Number(n).toFixed(2).replace(".",",")}`;
}

/* ── Avatar ──────────────────────────────────────────────────────────── */
function Avatar({ url, name, size=80, ring=false }) {
  const initials = (name||"?").split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2);
  const style = {
    width:size, height:size, borderRadius:"50%", flexShrink:0,
    border: ring ? `3px solid ${C.teal}` : "3px solid white",
    boxShadow: ring
      ? `0 0 0 4px ${C.tealGlow}, 0 8px 32px rgba(0,0,0,0.18)`
      : "0 6px 24px rgba(0,0,0,0.14)",
  };
  if (url) return <img loading="lazy" decoding="async" src={url} alt={name} style={{...style, objectFit:"cover"}}/>;
  return (
    <div style={{...style,
      background:`linear-gradient(135deg,${C.teal},${C.coral})`,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:size*0.32, fontWeight:900, color:"white", letterSpacing:-1}}>
      {initials}
    </div>
  );
}

/* ── Stat Pill ────────────────────────────────────────────────────────── */
function StatPill({ value, label, color, icon }) {
  return (
    <div style={{ flex:1, textAlign:"center", padding:"14px 8px",
      background:C.warmCard, borderRadius:18,
      border:`1px solid ${C.border}`,
      boxShadow:"0 2px 10px rgba(0,0,0,0.05)" }}>
      {icon && <div style={{ fontSize:18, marginBottom:4 }}>{icon}</div>}
      <div style={{ fontWeight:900, fontSize:20, color:color||C.ink,
        letterSpacing:-0.5, lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:10.5, color:C.muted, marginTop:3,
        fontWeight:600, letterSpacing:0.3 }}>{label}</div>
    </div>
  );
}

/* ── Impact Bar ──────────────────────────────────────────────────────── */
function ImpactBar({ value=0, max=100 }) {
  const pct = Math.min(100, (value/max)*100);
  return (
    <div style={{ height:6, borderRadius:3, background:"rgba(0,0,0,0.06)", overflow:"hidden" }}>
      <div style={{ height:"100%", borderRadius:3,
        width:`${pct}%`, minWidth: pct > 0 ? 8 : 0,
        background:`linear-gradient(90deg,${C.teal},${C.coral})`,
        transition:"width 0.8s cubic-bezier(0.34,1.56,0.64,1)" }}/>
    </div>
  );
}

/* ── Werk Card ───────────────────────────────────────────────────────── */
function WerkCard({ werk, onPress }) {
  const img = werk.cover_url||(Array.isArray(werk.images)&&werk.images[0])||null;
  return (
    <div className="pp-tap" onClick={() => onPress?.(werk)}
      style={{ borderRadius:16, overflow:"hidden", position:"relative",
        aspectRatio:"1", background:"#EEE",
        boxShadow:"0 3px 14px rgba(0,0,0,0.10)" }}>
      {img
        ? <img loading="lazy" decoding="async" src={img} alt={werk.title}
            style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
        : <div style={{ width:"100%", height:"100%",
            background:`linear-gradient(135deg,${C.tealPale},${C.coralPale})`,
            display:"flex", alignItems:"center", justifyContent:"center",
            flexDirection:"column", gap:4 }}>
            <span style={{ fontSize:28, opacity:0.35 }}>🎨</span>
            <span style={{ fontSize:10, color:C.muted, fontWeight:600 }}>
              {werk.category||"Werk"}
            </span>
          </div>
      }
      <div style={{ position:"absolute", inset:0,
        background:"linear-gradient(transparent 45%,rgba(0,0,0,0.70))" }}/>
      <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"10px 9px 8px" }}>
        <div style={{ fontSize:11, fontWeight:700, color:"white",
          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
          lineHeight:1.3 }}>{werk.title||"Werk"}</div>
        {werk.price!=null && (
          <div style={{ fontSize:11, fontWeight:900, color:C.gold, marginTop:1 }}>
            € {Number(werk.price).toFixed(0)}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Section Header ──────────────────────────────────────────────────── */
function SectionHeader({ title, sub, action, onAction }) {
  return (
    <div style={{ display:"flex", alignItems:"baseline",
      justifyContent:"space-between", marginBottom:14 }}>
      <div>
        <div style={{ fontWeight:800, fontSize:16, color:C.ink, letterSpacing:-0.3 }}>
          {title}
        </div>
        {sub && <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>{sub}</div>}
      </div>
      {action && (
        <button onClick={onAction} className="pp-tap"
          style={{ fontSize:12, fontWeight:700, color:C.teal,
            background:"none", border:"none", cursor:"pointer", padding:"4px 0" }}>
          {action}
        </button>
      )}
    </div>
  );
}

/* ── Quick Action Button ─────────────────────────────────────────────── */
function QuickAction({ icon, label, color, bg, onPress }) {
  return (
    <button className="pp-tap" onClick={onPress}
      style={{ flex:1, display:"flex", flexDirection:"column",
        alignItems:"center", gap:6, padding:"14px 8px",
        background: bg||C.warmCard, borderRadius:18,
        border:`1px solid ${C.border}`, cursor:"pointer",
        boxShadow:"0 2px 10px rgba(0,0,0,0.05)" }}>
      <span style={{ fontSize:22 }}>{icon}</span>
      <span style={{ fontSize:10.5, fontWeight:700,
        color:color||C.ink3, letterSpacing:0.2 }}>{label}</span>
    </button>
  );
}

/* ── Skeleton ────────────────────────────────────────────────────────── */
function Skel({ w="100%", h=16, r=8 }) {
  return <div style={{ width:w, height:h, borderRadius:r,
    background:"linear-gradient(90deg,#EBEBEB 25%,#F5F5F5 50%,#EBEBEB 75%)",
    backgroundSize:"200% 100%", animation:"ppShimmer 1.6s ease-in-out infinite" }}/>;
}

function ProfileSkeleton() {
  return (
    <div style={{ minHeight:"100vh", background:C.warm }}>
      <style>{CSS}</style>
      <div style={{ height:240, background:"linear-gradient(135deg,#e8e8e8,#f0f0f0)",
        animation:"ppSkel 1.4s ease-in-out infinite" }}/>
      <div style={{ padding:"80px 20px 24px" }}>
        <Skel h={28} w="60%" r={10}/>
        <div style={{ height:8 }}/>
        <Skel h={14} w="40%" r={6}/>
        <div style={{ height:20 }}/>
        <div style={{ display:"flex", gap:10 }}>
          {[1,2,3].map(i=><Skel key={i} h={72} r={16}/>)}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   OWN PROFILE — Premium Dashboard
══════════════════════════════════════════════════════════════════════ */
function OwnProfileView({ onTalentAnbieten, onLogout, onEditProfile }) {
  const { user, profile, wirkerProfile, isWirker, hasTalentProfile, profileModules, loadingAuth, loadingProfile } = useAuth();
  const [werke,        setWerke]        = useState([]);
  const [worksLoading, setWorksLoading] = useState(true);
  const [impactTotal,  setImpactTotal]  = useState(0);
  const [bookingCount, setBookingCount] = useState(0);
  const [tab,          setTab]          = useState("werke");
  const [showSettings, setShowSettings] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    loadWerke();
    loadStats();
  }, [user]);

  async function loadWerke() {
    setWorksLoading(true);
    const { data } = await supabase.from("works")
      .select("id,title,description,price,cover_url,images,category,status,created_at")
      .eq("user_id", user.id)
      .order("created_at",{ascending:false});
    setWerke(data||[]);
    setWorksLoading(false);
  }

  async function loadStats() {
    try {
      const [impactRes, bookRes] = await Promise.allSettled([
        supabase.from("payments")
          .select("impact_eur")
          .eq("user_id", user.id),
        supabase.from("bookings")
          .select("id",{count:"exact"})
          .eq("user_id", user.id),
      ]);
      if (impactRes.status==="fulfilled" && impactRes.value.data) {
        const total = impactRes.value.data.reduce((s,r)=>s+(r.impact_eur||0),0);
        setImpactTotal(total);
      }
      if (bookRes.status==="fulfilled" && bookRes.value.count!=null) {
        setBookingCount(bookRes.value.count);
      }
    } catch(e) { /* Stats sind nice-to-have */ }
  }

  if (loadingAuth || loadingProfile) return <ProfileSkeleton/>;

  const hasTalent   = hasTalentProfile || profile?.has_talent_profile || profile?.is_wirker || false;
  const modules     = profileModules   || profile?.profile_modules    || {};
  const displayName = profile?.display_name || profile?.username
    || user?.email?.split("@")[0] || "HUI User";
  const username   = profile?.username || "mein-profil";
  const avatarUrl  = profile?.avatar_url || null;
  const bio        = profile?.bio || null;
  const pubWerke   = werke.filter(w=>w.status==="published");
  const draftWerke = werke.filter(w=>w.status!=="published");

  return (
    <div ref={scrollRef}
      style={{ minHeight:"100vh", background:C.warm, paddingBottom:110,
        fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
        animation:"ppFadeUp 0.4s both" }}>
      <style>{CSS}</style>

      {/* ── Hero Banner ─────────────────────────────────────────────── */}
      <div style={{ position:"relative", height:200, overflow:"hidden",
        background:`linear-gradient(135deg,
          rgba(22,215,197,0.55) 0%,
          rgba(255,138,107,0.45) 55%,
          rgba(245,166,35,0.35) 100%)`,
        flexShrink:0 }}>
        {/* Pattern overlay */}
        <div style={{ position:"absolute", inset:0, opacity:0.12,
          backgroundImage:`radial-gradient(circle at 20% 50%, white 1px, transparent 1px),
            radial-gradient(circle at 80% 20%, white 1px, transparent 1px)`,
          backgroundSize:"40px 40px" }}/>
        {/* Bottom fade */}
        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:80,
          background:`linear-gradient(transparent, ${C.warm})` }}/>
      </div>

      {/* ── Avatar + Name (overlap) ──────────────────────────────────── */}
      <div style={{ padding:"0 20px", marginTop:-68, position:"relative", zIndex:10 }}>
        <div style={{ display:"flex", alignItems:"flex-end",
          justifyContent:"space-between", marginBottom:14 }}>
          <Avatar url={avatarUrl} name={displayName} size={88} ring={true}/>
          <div style={{ display:"flex", gap:8, paddingBottom:6 }}>
            <button className="pp-tap"
              onClick={onEditProfile || (() => {})}
              style={{ padding:"9px 16px", borderRadius:20,
                background:C.warmCard, border:`1.5px solid ${C.border}`,
                fontWeight:700, fontSize:12, color:C.ink2,
                cursor:"pointer", backdropFilter:"blur(8px)" }}>
              ✏️ Bearbeiten
            </button>
          </div>
        </div>

        {/* Name + Username */}
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
          <h1 style={{ margin:0, fontSize:24, fontWeight:900, color:C.ink,
            letterSpacing:-0.6, lineHeight:1.1 }}>{displayName}</h1>
          {hasTalent && (
            <div style={{ padding:"3px 9px", borderRadius:999,
              background:C.tealPale, border:`1px solid ${C.tealBorder}`,
              fontSize:11, fontWeight:800, color:C.teal, letterSpacing:0.5 }}>
              ✦ TALENT
            </div>
          )}
        </div>
        <div style={{ fontSize:13, color:C.muted, marginBottom: bio ? 10 : 0 }}>
          @{username}
        </div>
        {bio && (
          <p style={{ margin:"8px 0 0", fontSize:14, color:C.ink2,
            lineHeight:1.65, maxWidth:500 }}>{bio}</p>
        )}
      </div>

      {/* ── Stats Row ────────────────────────────────────────────────── */}
      <div style={{ padding:"18px 20px 0" }}>
        <div style={{ display:"flex", gap:10 }}>
          <StatPill value={pubWerke.length} label="Werke" icon="🎨" color={C.teal}/>
          <StatPill value={bookingCount||0} label="Buchungen" icon="📅" color={C.coral}/>
          <StatPill value={fmtEur(impactTotal)} label="Impact" icon="🌱" color="#22C55E"/>
        </div>
      </div>

      {/* ── Impact Section ───────────────────────────────────────────── */}
      {(isWirker || impactTotal > 0) && (
        <div style={{ margin:"16px 20px 0", padding:"18px",
          background:`linear-gradient(135deg,rgba(22,215,197,0.08),rgba(245,166,35,0.06))`,
          borderRadius:20, border:`1px solid ${C.tealBorder}` }}>
          <div style={{ display:"flex", justifyContent:"space-between",
            alignItems:"center", marginBottom:12 }}>
            <div>
              <div style={{ fontWeight:800, fontSize:15, color:C.ink }}>🌱 Dein Impact</div>
              <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>
                Beitrag zum HUI Pool
              </div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontWeight:900, fontSize:22, color:C.teal,
                letterSpacing:-0.5 }}>{fmtEur(impactTotal)}</div>
              <div style={{ fontSize:11, color:C.muted }}>gesamt</div>
            </div>
          </div>
          <ImpactBar value={impactTotal} max={500}/>
          <div style={{ fontSize:11, color:C.muted, marginTop:8, textAlign:"right" }}>
            Ziel: € 500 → Projektförderung
          </div>
        </div>
      )}

      {/* ── Quick Actions ─────────────────────────────────────────────── */}
      <div style={{ padding:"16px 20px 0" }}>
        <SectionHeader title="Schnellzugriff"/>
        <div style={{ display:"flex", gap:10 }}>
          {!hasTalent && onTalentAnbieten && (
            <QuickAction icon="✦" label="Talent anbieten"
              color={C.teal}
              bg={`linear-gradient(135deg,${C.tealPale},rgba(255,255,255,0.8))`}
              onPress={onTalentAnbieten}/>
          )}
          <QuickAction icon="🛍️" label="Bestellungen" color={C.coral}
            bg={`linear-gradient(135deg,${C.coralPale},rgba(255,255,255,0.8))`}
            onPress={() => {}}/>
          <QuickAction icon="💬" label="Nachrichten" color={C.purple}
            bg={`linear-gradient(135deg,${C.purplePale},rgba(255,255,255,0.8))`}
            onPress={() => {}}/>
          <QuickAction icon="⚙️" label="Einstellungen" color={C.muted}
            onPress={() => setShowSettings(s=>!s)}/>
        </div>
      </div>

      {/* ── Talent Hub (nur Wirker) ──────────────────────────────────── */}
      {hasTalent && (
        <div style={{ margin:"16px 20px 0", padding:"18px",
          background:`linear-gradient(135deg,rgba(255,138,107,0.08),rgba(245,166,35,0.06))`,
          borderRadius:20, border:`1px solid rgba(255,138,107,0.2)` }}>
          <div style={{ fontWeight:800, fontSize:15, color:C.ink, marginBottom:14 }}>
            🎯 Talent Hub
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {[
              { icon:"📈", label:"Analytics", sub:"Aufrufe & Reichweite" },
              { icon:"💰", label:"Einnahmen", sub:`${fmtEur(0)} diesen Monat` },
              { icon:"⭐", label:"Bewertungen", sub:"Empfehlungen" },
              { icon:"📦", label:"Bestellungen", sub:`${bookingCount} aktiv` },
            ].map(item => (
              <div key={item.label} className="pp-tap"
                style={{ padding:"12px 14px",
                  background:"rgba(255,255,255,0.72)", backdropFilter:"blur(8px)",
                  borderRadius:14, border:`1px solid ${C.border}`,
                  cursor:"pointer" }}>
                <div style={{ fontSize:18, marginBottom:5 }}>{item.icon}</div>
                <div style={{ fontWeight:700, fontSize:13, color:C.ink }}>{item.label}</div>
                <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{item.sub}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Werke Tabs + Grid ─────────────────────────────────────────── */}
      <div style={{ padding:"24px 20px 0" }}>
        <SectionHeader title="Meine Werke"
          sub={`${pubWerke.length} veröffentlicht${draftWerke.length>0 ? `, ${draftWerke.length} Entwurf` : ""}`}
          action="+ Hinzufügen"
          onAction={() => {}}/>

        {/* Tab Filter */}
        <div className="pp-scroll"
          style={{ display:"flex", gap:8, overflowX:"auto",
            marginBottom:16, paddingBottom:2 }}>
          {[
            { key:"werke", label:`Alle (${werke.length})` },
            { key:"pub",   label:`Publik (${pubWerke.length})` },
            { key:"draft", label:`Entwurf (${draftWerke.length})` },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="pp-tap"
              style={{ flexShrink:0, padding:"7px 16px", borderRadius:999,
                fontWeight: tab===t.key ? 800 : 600,
                fontSize:12, cursor:"pointer",
                background: tab===t.key
                  ? `linear-gradient(135deg,${C.teal},${C.teal2})`
                  : C.warmCard,
                color: tab===t.key ? "white" : C.muted,
                border: tab===t.key ? "none" : `1px solid ${C.border}`,
                boxShadow: tab===t.key ? `0 3px 12px ${C.tealGlow}` : "none" }}>
              {t.label}
            </button>
          ))}
        </div>

        {worksLoading ? (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
            {[1,2,3,4,5,6].map(i => (
              <div key={i} style={{ aspectRatio:"1", borderRadius:16,
                background:"linear-gradient(90deg,#EBEBEB 25%,#F5F5F5 50%,#EBEBEB 75%)",
                backgroundSize:"200% 100%",
                animation:"ppShimmer 1.6s ease-in-out infinite" }}/>
            ))}
          </div>
        ) : (() => {
          const display = tab==="pub" ? pubWerke : tab==="draft" ? draftWerke : werke;
          if (display.length === 0) return (
            <div style={{ textAlign:"center", padding:"48px 20px",
              borderRadius:20, background:C.warmCard,
              border:`1px solid ${C.border}` }}>
              <div style={{ fontSize:40, marginBottom:12, opacity:0.3 }}>🎨</div>
              <div style={{ fontWeight:700, fontSize:15, color:C.ink, marginBottom:6 }}>
                {tab==="draft" ? "Keine Entwürfe" : "Noch keine Werke"}
              </div>
              <div style={{ fontSize:13, color:C.muted, lineHeight:1.6, marginBottom:20 }}>
                Teile dein erstes Werk mit der Community.
              </div>
              <button className="pp-tap"
                style={{ padding:"12px 24px", borderRadius:14,
                  background:`linear-gradient(135deg,${C.teal},${C.teal2})`,
                  border:"none", color:"white", fontWeight:800,
                  fontSize:13, cursor:"pointer",
                  boxShadow:`0 4px 14px ${C.tealGlow}` }}>
                Werk erstellen ✦
              </button>
            </div>
          );
          return (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
              {display.map(w => <WerkCard key={w.id} werk={w} onPress={() => {}}/>)}
            </div>
          );
        })()}
      </div>

      {/* ── Settings Drawer ───────────────────────────────────────────── */}
      {showSettings && (
        <div style={{ margin:"16px 20px 0", borderRadius:20,
          background:C.warmCard, border:`1px solid ${C.border}`,
          overflow:"hidden", animation:"ppFadeUp 0.25s both" }}>
          {[
            { icon:"👤", label:"Profil bearbeiten", action: onEditProfile||(() => {}) },
            { icon:"🔔", label:"Benachrichtigungen", action:() => {} },
            { icon:"🔒", label:"Datenschutz", action:() => {} },
            { icon:"💳", label:"Zahlungsmethoden", action:() => {} },
            { icon:"🌍", label:"Sprache & Region", action:() => {} },
          ].map((item,i) => (
            <div key={item.label} className="pp-tap" onClick={item.action}
              style={{ display:"flex", alignItems:"center", gap:14,
                padding:"16px 18px", cursor:"pointer",
                borderBottom: i < 4 ? `1px solid ${C.borderLight}` : "none" }}>
              <span style={{ fontSize:20, width:28, textAlign:"center" }}>{item.icon}</span>
              <span style={{ flex:1, fontWeight:600, fontSize:14, color:C.ink2 }}>
                {item.label}
              </span>
              <span style={{ color:C.muted2, fontSize:16 }}>›</span>
            </div>
          ))}
          <div className="pp-tap" onClick={onLogout}
            style={{ display:"flex", alignItems:"center", gap:14,
              padding:"16px 18px", cursor:"pointer",
              background:C.coralPale }}>
            <span style={{ fontSize:20, width:28, textAlign:"center" }}>🚪</span>
            <span style={{ flex:1, fontWeight:700, fontSize:14, color:C.coral }}>
              Abmelden
            </span>
          </div>
        </div>
      )}

      {/* ── Wirker CTA (nur Non-Wirker) ───────────────────────────────── */}
      {!hasTalent && onTalentAnbieten && (
        <div style={{ margin:"24px 20px 0", padding:"24px 20px",
          borderRadius:24,
          background:`linear-gradient(135deg,rgba(22,215,197,0.12),rgba(255,138,107,0.08))`,
          border:`1px solid ${C.tealBorder}`,
          textAlign:"center" }}>
          <div style={{ fontSize:32, marginBottom:12 }}>✦</div>
          <div style={{ fontWeight:900, fontSize:18, color:C.ink,
            letterSpacing:-0.4, marginBottom:8 }}>
            Teile dein Talent
          </div>
          <div style={{ fontSize:13, color:C.ink3, lineHeight:1.65,
            marginBottom:20, maxWidth:280, margin:"0 auto 20px" }}>
            Biete deine Stärken an, verdiene Geld und trage zum Impact-Pool bei.
          </div>
          <button className="pp-tap" onClick={onTalentAnbieten}
            style={{ padding:"14px 32px", borderRadius:16,
              background:`linear-gradient(135deg,${C.teal},${C.coral})`,
              border:"none", color:"white", fontWeight:900,
              fontSize:15, cursor:"pointer",
              boxShadow:`0 6px 24px rgba(22,215,197,0.35)` }}>
            Talent anbieten ✦
          </button>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   PUBLIC PROFILE — Reduced Portfolio View
══════════════════════════════════════════════════════════════════════ */
function PublicProfileView({ username, onBack, onNavigate, onBuyWerk }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [werke,   setWerke]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (username) loadProfile();
  }, [username]);

  async function loadProfile() {
    setLoading(true); setError(null);
    try {
      const { data:prof, error:e } = await supabase.from("profiles")
        .select("id,username,display_name,avatar_url,bio,is_wirker,role")
        .eq("username", username).single();
      if (e||!prof) throw new Error("Profil nicht gefunden");
      setProfile(prof);
      const { data:works } = await supabase.from("works")
        .select("id,title,price,cover_url,images,category,created_at")
        .eq("user_id",prof.id).eq("status","published")
        .order("created_at",{ascending:false});
      setWerke(works||[]);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }

  const handleBack = () => {
    if (onBack) onBack();
    else if (onNavigate) onNavigate(-1);
    else window.history.back();
  };

  if (loading) return <ProfileSkeleton/>;

  if (error||!profile) return (
    <div style={{ minHeight:"100vh", background:C.warm, display:"flex",
      flexDirection:"column", alignItems:"center", justifyContent:"center",
      padding:32, fontFamily:"-apple-system,sans-serif" }}>
      <style>{CSS}</style>
      <div style={{ fontSize:48, marginBottom:16 }}>😕</div>
      <div style={{ fontWeight:800, fontSize:18, color:C.ink, marginBottom:8 }}>
        Profil nicht gefunden
      </div>
      <div style={{ fontSize:13, color:C.muted, textAlign:"center", marginBottom:24 }}>
        @{username} existiert nicht.
      </div>
      <button onClick={handleBack} className="pp-tap"
        style={{ padding:"12px 24px", borderRadius:12, background:C.teal,
          color:"white", border:"none", fontWeight:700, cursor:"pointer", fontSize:14 }}>
        Zurück
      </button>
    </div>
  );

  const displayName = profile.display_name||profile.username;
  const isOwn = user && user.id === profile.id;

  return (
    <div style={{ minHeight:"100vh", background:C.warm, paddingBottom:40,
      fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif" }}>
      <style>{CSS}</style>

      {/* Sticky Header */}
      <div style={{ position:"sticky", top:0, zIndex:100,
        background:"rgba(249,247,244,0.92)", backdropFilter:"blur(12px)",
        borderBottom:`1px solid ${C.border}`, padding:"12px 16px",
        paddingTop:"max(12px,env(safe-area-inset-top,12px))",
        display:"flex", alignItems:"center", gap:12 }}>
        <button onClick={handleBack} className="pp-tap"
          style={{ width:38, height:38, borderRadius:"50%", background:"rgba(0,0,0,0.06)",
            border:"none", cursor:"pointer", display:"flex",
            alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>
          ‹
        </button>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:800, fontSize:16, color:C.ink,
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {displayName}
          </div>
          <div style={{ fontSize:11, color:C.muted }}>@{profile.username}</div>
        </div>
        {isOwn && (
          <div style={{ fontSize:12, padding:"5px 12px", borderRadius:20,
            background:C.tealPale, color:C.teal, fontWeight:700 }}>
            Ich
          </div>
        )}
      </div>

      {/* Hero */}
      <div style={{ padding:"28px 20px 20px", borderBottom:`1px solid ${C.border}` }}>
        <div style={{ display:"flex", gap:16, alignItems:"flex-start" }}>
          <Avatar url={profile.avatar_url} name={displayName} size={76} ring={profile.is_wirker}/>
          <div style={{ flex:1, paddingTop:4 }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
              <span style={{ fontWeight:900, fontSize:20, color:C.ink, letterSpacing:-0.5 }}>
                {displayName}
              </span>
              {profile.is_wirker && <span style={{ fontSize:14 }}>✦</span>}
            </div>
            <div style={{ fontSize:12, color:C.muted, marginBottom:10 }}>
              @{profile.username}
            </div>
            <div style={{ display:"flex", gap:20 }}>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontWeight:900, fontSize:18, color:C.ink }}>{werke.length}</div>
                <div style={{ fontSize:10, color:C.muted }}>Werke</div>
              </div>
            </div>
          </div>
        </div>
        {profile.bio && (
          <p style={{ fontSize:14, color:C.ink2, lineHeight:1.65, margin:"14px 0 0" }}>
            {profile.bio}
          </p>
        )}
        {profile.is_wirker && (
          <div style={{ marginTop:12, display:"inline-flex", alignItems:"center", gap:6,
            padding:"5px 12px", borderRadius:20,
            background:C.tealPale, border:`1px solid ${C.tealBorder}` }}>
            <span style={{ fontSize:12 }}>✦</span>
            <span style={{ fontSize:12, fontWeight:700, color:C.teal }}>Wirker</span>
          </div>
        )}
      </div>

      {/* Werke */}
      <div style={{ padding:"20px 16px 40px" }}>
        {werke.length===0 ? (
          <div style={{ textAlign:"center", padding:"48px 24px", color:C.muted }}>
            <div style={{ fontSize:40, marginBottom:12, opacity:0.4 }}>🎨</div>
            <div style={{ fontWeight:700, fontSize:15, color:C.ink, marginBottom:6 }}>
              Noch keine Werke
            </div>
            <div style={{ fontSize:13 }}>
              {displayName} hat noch nichts veröffentlicht.
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontSize:13, fontWeight:700, color:C.ink, marginBottom:14 }}>
              Werke ({werke.length})
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
              {werke.map(w => <WerkCard key={w.id} werk={w} onPress={onBuyWerk}/>)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   MAIN EXPORT — Smart Routing
══════════════════════════════════════════════════════════════════════ */
export default function ProfilePage({
  username,        // wenn gesetzt → öffentliches Profil
  onBack,
  onNavigate,
  onBuyWerk,
  onTalentAnbieten,
  onLogout,
  onEditProfile,
  onViewPublicProfile,  // öffnet eigenes Profil in WirkerProfilePage
}) {
  if (username) {
    return (
      <PublicProfileView
        username={username}
        onBack={onBack}
        onNavigate={onNavigate}
        onBuyWerk={onBuyWerk}
      />
    );
  }
  return (
    <OwnProfileView
      onTalentAnbieten={onTalentAnbieten}
      onLogout={onLogout}
      onEditProfile={onEditProfile}
      onViewPublicProfile={onViewPublicProfile}
    />
  );
}
