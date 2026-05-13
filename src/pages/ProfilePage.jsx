// ProfilePage.jsx — HUI "Mein Bereich" v8
// Alle Bereiche verdrahtet mit MeinHUI_SubPages

import React, { useState, useEffect } from "react";
import { useAuth } from "../lib/AuthContext";
import { supabase } from "../lib/supabaseClient";
import {
  BestellungenPage,
  NachrichtenPage,
  GespeichertePage,
  MeineInhaltePage,
  AnalyticsPage,
  EinnahmenPage,
  VerfuegbarkeitPage,
  ImpactSubPage,
  KontoPage,
} from "../components/MeinHUI_SubPages";

const C = {
  teal:"#16D7C5", teal2:"#11C5B7", tealPale:"#E6FAF8",
  coral:"#FF8A6B", coralPale:"#FFF2EE",
  gold:"#F5A623", goldPale:"#FFFBEB",
  cream:"#F9F6F2", warm:"#FFF9F4",
  card:"#FFFFFF", ink:"#1A1A1A", ink2:"#3A3A3A",
  muted:"#888", muted2:"#C0C0C0", border:"rgba(0,0,0,0.06)",
  green:"#10B981", greenPale:"#ECFDF5",
};

const CSS = `
  @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
  .hui-tap{transition:transform .15s cubic-bezier(.34,1.4,.64,1);-webkit-tap-highlight-color:transparent}
  .hui-tap:active{transform:scale(.96)}
  .hui-scroll::-webkit-scrollbar{display:none}
  .hui-scroll{-ms-overflow-style:none;scrollbar-width:none}
  .hui-item:last-child{border-bottom:none!important}
`;

function Section({ title, children, delay=0 }) {
  return (
    <div style={{ marginBottom:20, animation:`fadeUp 0.35s ${delay}s both` }}>
      <div style={{ fontSize:11, fontWeight:800, color:C.muted2,
        letterSpacing:1.3, marginBottom:8, paddingLeft:4 }}>
        {title.toUpperCase()}
      </div>
      <div style={{ background:C.card, borderRadius:18,
        boxShadow:"0 1px 6px rgba(0,0,0,0.04)",
        border:`1px solid ${C.border}` }}>
        {children}
      </div>
    </div>
  );
}

function MenuItem({ icon, label, sub, badge, accent, onClick }) {
  return (
    <button className="hui-tap hui-item" onClick={onClick}
      style={{ width:"100%", display:"flex", alignItems:"center",
        gap:14, padding:"13px 16px", background:"none", border:"none",
        cursor:"pointer", fontFamily:"inherit", textAlign:"left",
        borderBottom:`1px solid ${C.border}` }}>
      <div style={{ width:36, height:36, borderRadius:10, flexShrink:0,
        background: accent ? `${accent}14` : C.cream,
        display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>
        {icon}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontWeight:700, fontSize:14, color:C.ink }}>{label}</div>
        {sub && <div style={{ fontSize:12, color:C.muted, marginTop:1 }}>{sub}</div>}
      </div>
      {badge > 0 && (
        <div style={{ minWidth:20, height:20, borderRadius:10,
          background:C.coral, color:"white", fontSize:11, fontWeight:800,
          display:"flex", alignItems:"center", justifyContent:"center", padding:"0 5px" }}>
          {badge}
        </div>
      )}
      <span style={{ color:C.muted2, fontSize:16, flexShrink:0 }}>›</span>
    </button>
  );
}

function StatPill({ icon, value, label, color }) {
  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column",
      alignItems:"center", padding:"14px 8px",
      background:C.card, borderRadius:16,
      boxShadow:"0 1px 6px rgba(0,0,0,0.04)", border:`1px solid ${C.border}` }}>
      <span style={{ fontSize:18, marginBottom:4 }}>{icon}</span>
      <span style={{ fontSize:17, fontWeight:900, color:color||C.ink }}>{value}</span>
      <span style={{ fontSize:11, color:C.muted, marginTop:2, textAlign:"center" }}>{label}</span>
    </div>
  );
}

export default function ProfilePage({ onTalentAnbieten, onLogout, onViewPublicProfile }) {
  const { user, profile, hasTalentProfile } = useAuth();

  const [page,        setPage]        = useState(null); // active sub-page key
  const [impactEur,   setImpactEur]   = useState(0);
  const [orderCount,  setOrderCount]  = useState(0);
  const [msgCount,    setMsgCount]    = useState(0);
  const [earnedEur,   setEarnedEur]   = useState(0);

  useEffect(() => {
    if (!user?.id) return;
    async function loadStats() {
      try {
        const [impactRes, ordersRes, earningsRes] = await Promise.all([
          supabase.from("profiles").select("impact_eur").eq("id", user.id).single(),
          supabase.from("bookings").select("id",{count:"exact"})
            .or(`buyer_id.eq.${user.id},wirker_id.eq.${user.id}`)
            .neq("status","cancelled"),
          supabase.from("bookings").select("amount")
            .eq("wirker_id", user.id).eq("status","completed"),
        ]);
        setImpactEur(impactRes.data?.impact_eur || 0);
        setOrderCount(ordersRes.count || 0);
        const total = (earningsRes.data||[]).reduce((s,b)=>s+(+b.amount||0),0);
        setEarnedEur(total * 0.85);
      } catch(e) { console.warn("[ProfilePage]", e.message); }
    }
    loadStats();
  }, [user?.id]);

  function handleLogout() {
    supabase.auth.signOut();
    onLogout?.();
  }

  const displayName = profile?.display_name || user?.user_metadata?.full_name
    || user?.email?.split("@")[0] || "Nutzer";
  const email       = user?.email || "";
  const avatarUrl   = profile?.avatar_url || null;
  const memberYear  = profile?.created_at
    ? new Date(profile.created_at).getFullYear() : new Date().getFullYear();

  // ── Sub-page routing ─────────────────────────────────────────────
  if (page === "bestellungen")  return <BestellungenPage  onBack={()=>setPage(null)} onOpenChat={()=>setPage("nachrichten")}/>;
  if (page === "nachrichten")   return <NachrichtenPage   onBack={()=>setPage(null)}/>;
  if (page === "gespeichert")   return <GespeichertePage  onBack={()=>setPage(null)}/>;
  if (page === "inhalte")       return <MeineInhaltePage  onBack={()=>setPage(null)}/>;
  if (page === "analytics")     return <AnalyticsPage     onBack={()=>setPage(null)}/>;
  if (page === "einnahmen")     return <EinnahmenPage     onBack={()=>setPage(null)}/>;
  if (page === "verfuegbarkeit") return <VerfuegbarkeitPage onBack={()=>setPage(null)}/>;
  if (page === "impact")        return <ImpactSubPage     onBack={()=>setPage(null)}/>;
  if (page === "konto")         return <KontoPage         onBack={()=>setPage(null)} onLogout={handleLogout}/>;

  return (
    <>
      <style>{CSS}</style>
      <div className="hui-scroll"
        style={{ minHeight:"100dvh", background:C.cream,
          paddingBottom:"max(100px,env(safe-area-inset-bottom,100px))" }}>

        {/* ══ HEADER ═══════════════════════════════════════════════ */}
        <div style={{
          background:C.card,
          padding:"max(52px,env(safe-area-inset-top,52px)) 20px 20px",
          borderBottom:`1px solid ${C.border}`,
          animation:"fadeUp 0.3s ease both",
        }}>
          <div style={{ fontSize:13, fontWeight:800, color:C.muted2,
            letterSpacing:1.2, marginBottom:14 }}>
            MEIN BEREICH
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:16 }}>
            <div style={{ width:52, height:52, borderRadius:16, flexShrink:0,
              overflow:"hidden", background:`linear-gradient(135deg,${C.teal}44,${C.coral}33)`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:20, fontWeight:900, color:C.teal, border:`1.5px solid ${C.border}` }}>
              {avatarUrl
                ? <img src={avatarUrl} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }}/>
                : displayName[0]?.toUpperCase()}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:900, fontSize:18, color:C.ink,
                letterSpacing:-0.3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {displayName}
              </div>
              <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>
                {email} · Mitglied seit {memberYear}
              </div>
            </div>
            <button className="hui-tap" onClick={() => setPage("konto")}
              style={{ background:C.cream, border:`1px solid ${C.border}`,
                borderRadius:10, padding:"7px 12px", cursor:"pointer", fontFamily:"inherit" }}>
              <span style={{ fontSize:12, fontWeight:700, color:C.muted }}>Bearbeiten</span>
            </button>
          </div>

          <div style={{ display:"inline-flex", alignItems:"center", gap:8,
            background:`${C.teal}10`, borderRadius:50, padding:"7px 14px",
            border:`1px solid ${C.teal}22` }}>
            <span>🌱</span>
            <span style={{ fontSize:13, fontWeight:700, color:"#1A8A80" }}>
              € {Number(impactEur).toFixed(2)} Impact bewirkt
            </span>
          </div>
        </div>

        <div style={{ padding:"20px 16px 0" }}>

          {/* ══ TALENT CARD ══════════════════════════════════════ */}
          {!hasTalentProfile ? (
            <div style={{ marginBottom:20, borderRadius:20, overflow:"hidden",
              position:"relative", minHeight:120, animation:"fadeUp 0.35s 0.05s both" }}>
              <img src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80"
                alt="" style={{ position:"absolute",inset:0,width:"100%",height:"100%",
                  objectFit:"cover",filter:"brightness(0.5)" }}/>
              <div style={{ position:"absolute",inset:0,
                background:"linear-gradient(to right,rgba(22,215,197,0.35),rgba(255,138,107,0.25))" }}/>
              <div style={{ position:"relative",padding:"22px 20px",
                display:"flex",alignItems:"center",justifyContent:"space-between",gap:16 }}>
                <div>
                  <div style={{ fontSize:16,fontWeight:900,color:"white",letterSpacing:-0.3,marginBottom:4 }}>
                    Talent werden
                  </div>
                  <div style={{ fontSize:13,color:"rgba(255,255,255,0.75)" }}>
                    Zeige deine Werke & Erlebnisse
                  </div>
                </div>
                <button onClick={onTalentAnbieten} className="hui-tap"
                  style={{ background:`linear-gradient(135deg,${C.teal},${C.teal2})`,
                    border:"none",borderRadius:50,padding:"10px 20px",
                    color:"white",fontSize:14,fontWeight:800,cursor:"pointer",
                    fontFamily:"inherit",flexShrink:0,
                    boxShadow:`0 4px 16px rgba(22,215,197,0.45)` }}>
                  Jetzt starten
                </button>
              </div>
            </div>
          ) : (
            <div style={{ marginBottom:20, animation:"fadeUp 0.35s 0.05s both" }}>
              <div style={{ background:C.card, borderRadius:18,
                border:`1px solid ${C.border}`,
                boxShadow:"0 1px 6px rgba(0,0,0,0.04)",
                padding:"16px 18px",
                display:"flex", alignItems:"center", gap:14 }}>
                <div style={{ width:40,height:40,borderRadius:12,flexShrink:0,
                  background:`linear-gradient(135deg,${C.teal}22,${C.coral}18)`,
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:18 }}>
                  ✦
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:800,fontSize:14,color:C.ink }}>Talent-Profil aktiv</div>
                  <div style={{ fontSize:12,color:C.muted,marginTop:1 }}>
                    Dein öffentliches Profil ist sichtbar
                  </div>
                </div>
                <button onClick={onViewPublicProfile} className="hui-tap"
                  style={{ background:C.cream, border:`1px solid ${C.border}`,
                    borderRadius:50, padding:"8px 14px",
                    color:C.ink2, fontSize:12, fontWeight:700,
                    cursor:"pointer", fontFamily:"inherit",
                    display:"flex", alignItems:"center", gap:5, flexShrink:0 }}>
                  <span>👁</span> Ansehen
                </button>
              </div>
            </div>
          )}

          {/* ══ STATS (nur Talente) ═══════════════════════════════ */}
          {hasTalentProfile && (
            <div style={{ display:"flex", gap:10, marginBottom:20,
              animation:"fadeUp 0.35s 0.1s both" }}>
              <StatPill icon="💰" value={`€ ${earnedEur.toFixed(0)}`} label="Einnahmen" color={C.teal}/>
              <StatPill icon="📦" value={orderCount} label="Buchungen" color={C.ink}/>
              <StatPill icon="🌱" value={`€ ${Number(impactEur).toFixed(0)}`} label="Impact" color="#1A8A80"/>
            </div>
          )}

          {/* ══ AKTIVITÄT ════════════════════════════════════════ */}
          <Section title="Aktivität" delay={0.12}>
            <MenuItem icon="📦" label="Bestellungen & Buchungen"
              sub={orderCount > 0 ? `${orderCount} Einträge` : "Keine aktiven Buchungen"}
              accent={C.teal} onClick={() => setPage("bestellungen")}/>
            <MenuItem icon="💬" label="Nachrichten"
              sub="Unterhaltungen & Chats"
              accent={C.coral} onClick={() => setPage("nachrichten")}/>
            <MenuItem icon="❤️" label="Gespeicherte Inhalte"
              sub="Favoriten & Gelikte"
              onClick={() => setPage("gespeichert")}/>
          </Section>

          {/* ══ CREATOR STUDIO (nur Talente) ════════════════════ */}
          {hasTalentProfile && (
            <Section title="Creator Studio" delay={0.18}>
              <MenuItem icon="🎨" label="Meine Inhalte"
                sub="Werke, Erlebnisse, Storys" accent={C.gold}
                onClick={() => setPage("inhalte")}/>
              <MenuItem icon="📊" label="Analytics"
                sub="Views, Likes, Reichweite" accent={C.teal}
                onClick={() => setPage("analytics")}/>
              <MenuItem icon="💳" label="Einnahmen & Auszahlungen"
                sub={earnedEur > 0 ? `€ ${earnedEur.toFixed(2)} verfügbar` : undefined}
                accent={C.green} onClick={() => setPage("einnahmen")}/>
              <MenuItem icon="📅" label="Verfügbarkeit & Slots"
                accent={C.coral} onClick={() => setPage("verfuegbarkeit")}/>
            </Section>
          )}

          {/* ══ IMPACT ═══════════════════════════════════════════ */}
          <Section title="Impact" delay={0.22}>
            <MenuItem icon="🌱" label="Meine Impact-Stimmen"
              sub="Projekte unterstützen & abstimmen" accent={C.teal}
              onClick={() => setPage("impact")}/>
          </Section>

          {/* ══ KONTO ════════════════════════════════════════════ */}
          <Section title="Konto" delay={0.26}>
            <MenuItem icon="⚙️" label="Konto & Einstellungen"
              sub="Profil, Zahlung, Datenschutz"
              onClick={() => setPage("konto")}/>
          </Section>

          <button className="hui-tap" onClick={handleLogout}
            style={{ width:"100%", padding:"14px", background:"none",
              border:`1.5px solid ${C.border}`, borderRadius:14,
              color:C.muted, fontSize:14, fontWeight:700, cursor:"pointer",
              fontFamily:"inherit", marginTop:4, animation:"fadeUp 0.35s 0.3s both" }}>
            Abmelden
          </button>

          <div style={{ textAlign:"center", marginTop:20, paddingBottom:8,
            fontSize:11, color:C.muted2 }}>
            HUI · Human United Intelligent
          </div>
        </div>
      </div>
    </>
  );
}
