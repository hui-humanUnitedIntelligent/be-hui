import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";

/* ─── Design Tokens ─────────────────────────────────────── */
const C = {
  coral:   "#FF6B5B",
  teal:    "#2ABFAC",
  gold:    "#F5A623",
  purple:  "#A78BFA",
  ink:     "#1A1A2E",
  muted:   "#6B7280",
  surface: "#F8F7F5",
  card:    "#FFFFFF",
  border:  "#EEECE8",
};

/* ─── Hilfsfunktionen ───────────────────────────────────── */
function Avatar({ src, name, size = 80 }) {
  const initials = (name || "").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      overflow: "hidden", flexShrink: 0,
      background: `linear-gradient(135deg, ${C.coral}80, ${C.teal}80)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.35, fontWeight: 900, color: "white",
    }}>
      {src
        ? <img src={src} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={e => e.target.style.display = "none"} />
        : initials}
    </div>
  );
}

function StatPill({ icon, value, label, color = C.teal }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      gap: 2, flex: 1,
    }}>
      <div style={{ fontSize: 11, color: C.muted }}>{icon}</div>
      <div style={{ fontWeight: 900, fontSize: 18, color }}>{value}</div>
      <div style={{ fontSize: 10, color: C.muted, textAlign: "center", lineHeight: 1.3 }}>{label}</div>
    </div>
  );
}

function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{
      display: "flex", background: C.card,
      borderBottom: `1px solid ${C.border}`,
      position: "sticky", top: 0, zIndex: 10,
    }}>
      {tabs.map(([key, icon, label]) => (
        <button key={key} onClick={() => onChange(key)}
          style={{
            flex: 1, padding: "14px 4px", border: "none", cursor: "pointer",
            background: "none", display: "flex", flexDirection: "column",
            alignItems: "center", gap: 3,
            borderBottom: active === key ? `2.5px solid ${C.teal}` : "2.5px solid transparent",
            transition: "border-color 0.2s",
            WebkitTapHighlightColor: "transparent",
          }}>
          <span style={{ fontSize: 16 }}>{icon}</span>
          <span style={{
            fontSize: 10, fontWeight: active === key ? 800 : 500,
            color: active === key ? C.teal : C.muted,
            transition: "color 0.2s",
          }}>{label}</span>
        </button>
      ))}
    </div>
  );
}

/* ─── Mock-Daten ────────────────────────────────────────── */
const MOCK_PROFILE = {
  name: "Mia Kaufmann",
  bio: "Entdeckerin. Ich liebe handgemachte Dinge und echte Menschen.",
  location: "Berlin",
  hui_points: 340,
  profile_image_url: null,
  header_image_url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
  talent_type: null, // null = kein Talent aktiv
  recommendations_count: 0,
  works_count: 0,
  bookings_count: 4,
  impact_eur: 8.75,
  member_since: "März 2025",
  badges: [],
};

const MOCK_TALENT_PROFILE = {
  name: "Sofia Mayer",
  bio: "Ich forme aus Ton Dinge, die bleiben. Handgemachte Keramik und Workshops – jedes Stück ein Unikat.",
  location: "München",
  talent: "Keramik-Künstlerin",
  hui_points: 1240,
  profile_image_url: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&q=80",
  header_image_url: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&q=80",
  talent_type: "beides",
  skills: ["Töpfern", "Glasuren", "Raku-Brennen", "Workshops"],
  recommendations_count: 34,
  works_count: 8,
  bookings_count: 41,
  impact_eur: 124,
  member_since: "März 2024",
  badges: ["Top Wirker", "Community Liebling"],
  not_recommended_count: 1, // privat sichtbar
};

const MOCK_WERKE = [
  { id:1, title:"Keramik-Tasse", price:"38 €", img:"https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400&q=80" },
  { id:2, title:"Vase Handgedreht", price:"65 €", img:"https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=400&q=80" },
  { id:3, title:"Schüssel-Set", price:"89 €", img:"https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=400&q=80" },
  { id:4, title:"Töpfer-Workshop", price:"75 €/P.", img:"https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400&q=80" },
];

const MOCK_BOOKINGS = [
  { id:1, title:"Portrait-Shooting", wirker:"Marcus B.", date:"12. Apr 2026", status:"COMPLETED", amount:"180 €" },
  { id:2, title:"Yoga-Session", wirker:"Maria L.", date:"28. Apr 2026", status:"PAID", amount:"70 €" },
];

const MOCK_SLOTS = [
  { date:"Mo, 11. Mai", slots:["09:00","11:00","14:00"] },
  { date:"Di, 12. Mai", slots:["10:00","15:00"] },
  { date:"Mi, 13. Mai", slots:[] },
  { date:"Do, 14. Mai", slots:["09:00","13:00","16:00"] },
];

/* ─── Status-Chip ───────────────────────────────────────── */
function BookingStatusChip({ status }) {
  const map = {
    COMPLETED: { label:"Abgeschlossen", bg:`${C.teal}15`,  color:C.teal  },
    PAID:      { label:"Aktiv",         bg:`${C.gold}18`,  color:"#92400E" },
    DISPUTED:  { label:"In Klärung",    bg:`${C.coral}15`, color:C.coral },
    CREATED:   { label:"Ausstehend",    bg:"#F3F4F6",      color:C.muted },
  };
  const s = map[status] || map.CREATED;
  return (
    <span style={{ background:s.bg, color:s.color,
      borderRadius:20, padding:"3px 10px", fontSize:11, fontWeight:700 }}>
      {s.label}
    </span>
  );
}

/* ─── Kein-Talent-Profil ────────────────────────────────── */
function OwnProfileNoTalent({ profile, onTalentAnbieten, onLogout }) {
  return (
    <div style={{ minHeight:"100vh", background:C.surface, paddingBottom:90 }}>

      {/* Header-Bild */}
      <div style={{ height:220, position:"relative", overflow:"hidden",
        background:`linear-gradient(160deg, ${C.coral}30, ${C.teal}20)` }}>
        {profile.header_image_url &&
          <img src={profile.header_image_url} alt=""
            style={{ width:"100%", height:"100%", objectFit:"cover", filter:"brightness(0.88)" }} />}
        <div style={{ position:"absolute", inset:0,
          background:"linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(255,255,255,0.85) 100%)" }} />

        {/* Einstellungen */}
        <button onClick={onLogout}
          style={{ position:"absolute", top:16, right:16,
            width:38, height:38, borderRadius:"50%",
            background:"rgba(255,255,255,0.85)", backdropFilter:"blur(8px)",
            border:"none", cursor:"pointer", fontSize:16,
            display:"flex", alignItems:"center", justifyContent:"center",
            WebkitTapHighlightColor:"transparent" }}>
          ⚙️
        </button>
      </div>

      {/* Avatar über Kante */}
      <div style={{ display:"flex", justifyContent:"center", marginTop:-44 }}>
        <div style={{ border:"4px solid white", borderRadius:"50%",
          boxShadow:"0 4px 20px rgba(26,26,46,0.15)" }}>
          <Avatar src={profile.profile_image_url} name={profile.name} size={88} />
        </div>
      </div>

      {/* Name & Bio */}
      <div style={{ textAlign:"center", padding:"16px 24px 0" }}>
        <div style={{ fontWeight:900, fontSize:22, color:C.ink, marginBottom:4 }}>
          {profile.name}
        </div>
        {profile.bio && (
          <div style={{ fontSize:14, color:C.muted, lineHeight:1.65, maxWidth:280, margin:"0 auto" }}>
            {profile.bio}
          </div>
        )}
        {profile.location && (
          <div style={{ fontSize:12, color:C.muted, marginTop:8 }}>📍 {profile.location}</div>
        )}
      </div>

      {/* HUI-Punkte — zentral */}
      <div style={{ margin:"24px 20px 0" }}>
        <div style={{ background:C.card, borderRadius:24,
          padding:"24px 20px", textAlign:"center",
          boxShadow:"0 2px 16px rgba(26,26,46,0.07)",
          border:`1.5px solid ${C.gold}25` }}>
          <div style={{ fontSize:13, fontWeight:700, color:C.muted, marginBottom:6,
            letterSpacing:0.5, textTransform:"uppercase" }}>HUI-Punkte</div>
          <div style={{ fontWeight:900, fontSize:52, lineHeight:1,
            background:`linear-gradient(135deg, ${C.coral}, ${C.gold})`,
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
            backgroundClip:"text" }}>
            {profile.hui_points}
          </div>
          <div style={{ fontSize:12, color:C.muted, marginTop:6 }}>
            Du sammelst Punkte mit jeder Buchung
          </div>
        </div>
      </div>

      {/* Aktivitäts-Stats */}
      <div style={{ margin:"16px 20px 0", display:"flex", gap:12 }}>
        <div style={{ flex:1, background:C.card, borderRadius:18, padding:"16px 12px",
          textAlign:"center", boxShadow:"0 2px 10px rgba(0,0,0,0.05)" }}>
          <div style={{ fontWeight:900, fontSize:22, color:C.teal }}>{profile.bookings_count}</div>
          <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>Buchungen</div>
        </div>
        <div style={{ flex:1, background:C.card, borderRadius:18, padding:"16px 12px",
          textAlign:"center", boxShadow:"0 2px 10px rgba(0,0,0,0.05)" }}>
          <div style={{ fontWeight:900, fontSize:22, color:C.coral }}>€ {profile.impact_eur}</div>
          <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>Impact beigetragen</div>
        </div>
      </div>

      {/* CTA: Talent anbieten */}
      <div style={{ margin:"28px 20px 0" }}>
        <button onClick={onTalentAnbieten}
          style={{ width:"100%", padding:"18px",
            background:`linear-gradient(135deg, ${C.coral}, ${C.teal})`,
            color:"white", border:"none", borderRadius:20,
            fontSize:16, fontWeight:900, cursor:"pointer",
            boxShadow:`0 6px 24px ${C.coral}35`,
            display:"flex", alignItems:"center", justifyContent:"center", gap:10,
            WebkitTapHighlightColor:"transparent",
            transition:"transform 0.15s, box-shadow 0.15s" }}
          onTouchStart={e => e.currentTarget.style.transform = "scale(0.97)"}
          onTouchEnd={e => e.currentTarget.style.transform = "scale(1)"}>
          <span style={{ fontSize:22 }}>✨</span>
          Mein Talent anbieten
        </button>
        <div style={{ textAlign:"center", fontSize:12, color:C.muted, marginTop:10, lineHeight:1.5 }}>
          Teile dein Können — und bewege mit jeder Buchung etwas in der Welt.
        </div>
      </div>

      {/* Logout */}
      <div style={{ margin:"24px 20px 0" }}>
        <button onClick={onLogout}
          style={{ width:"100%", padding:"14px",
            background:"none", border:`1.5px solid ${C.border}`,
            borderRadius:16, fontSize:14, fontWeight:600,
            color:C.muted, cursor:"pointer",
            WebkitTapHighlightColor:"transparent" }}>
          Abmelden
        </button>
      </div>
    </div>
  );
}

/* ─── Talent-Profil (eigenes) ───────────────────────────── */
function OwnProfileTalent({ profile, onLogout }) {
  const [tab, setTab] = useState("werke");
  const [werke, setWerke] = useState(MOCK_WERKE);
  const [bookings] = useState(MOCK_BOOKINGS);
  const [slots]    = useState(MOCK_SLOTS);
  const [editing, setEditing] = useState(false);

  const typeColor =
    profile.talent_type === "beides" ? C.purple :
    profile.talent_type === "werke"  ? C.gold   : C.teal;

  const TABS = [
    ["werke",       "🎨", "Werke"],
    ["buchungen",   "📅", "Buchungen"],
    ["chats",       "💬", "Chats"],
    ["verfügbar",   "🗓️", "Verfügbar"],
  ];

  return (
    <div style={{ minHeight:"100vh", background:C.surface, paddingBottom:90 }}>

      {/* ── Hero Header ── */}
      <div style={{ position:"relative" }}>
        <div style={{ height:200, overflow:"hidden",
          background:`linear-gradient(160deg, ${typeColor}35, ${C.coral}15)` }}>
          {profile.header_image_url &&
            <img src={profile.header_image_url} alt=""
              style={{ width:"100%", height:"100%", objectFit:"cover", filter:"brightness(0.85)" }} />}
          <div style={{ position:"absolute", inset:0,
            background:"linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(255,255,255,0.82) 100%)" }} />
        </div>

        {/* Einstellungen oben rechts */}
        <button onClick={() => setEditing(true)}
          style={{ position:"absolute", top:16, right:16,
            width:38, height:38, borderRadius:"50%",
            background:"rgba(255,255,255,0.85)", backdropFilter:"blur(8px)",
            border:"none", cursor:"pointer", fontSize:16,
            display:"flex", alignItems:"center", justifyContent:"center",
            WebkitTapHighlightColor:"transparent" }}>
          ✏️
        </button>

        {/* Avatar */}
        <div style={{ position:"absolute", bottom:-32, left:20,
          border:"3.5px solid white", borderRadius:"50%",
          boxShadow:"0 4px 16px rgba(26,26,46,0.18)" }}>
          <Avatar src={profile.profile_image_url} name={profile.name} size={72} />
        </div>
      </div>

      {/* Name, Talent, Bio */}
      <div style={{ padding:"40px 20px 0" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <div style={{ fontWeight:900, fontSize:20, color:C.ink }}>{profile.name}</div>
            <div style={{ fontSize:13, fontWeight:700, color:typeColor, marginTop:2 }}>
              {profile.talent}
            </div>
            {profile.location && (
              <div style={{ fontSize:12, color:C.muted, marginTop:3 }}>
                📍 {profile.location}
              </div>
            )}
          </div>
          {/* Verified Badge */}
          {profile.verified && (
            <div style={{ background:`${C.teal}12`, color:C.teal,
              borderRadius:20, padding:"5px 12px", fontSize:11, fontWeight:700 }}>
              ✓ Verifiziert
            </div>
          )}
        </div>

        {profile.bio && (
          <div style={{ fontSize:13, color:"#555", lineHeight:1.65, marginTop:12 }}>
            {profile.bio}
          </div>
        )}

        {/* Badges */}
        {profile.badges?.length > 0 && (
          <div style={{ display:"flex", gap:6, marginTop:10, flexWrap:"wrap" }}>
            {profile.badges.map((b,i) => (
              <span key={i} style={{ background:`${C.gold}18`, color:"#92400E",
                borderRadius:20, padding:"4px 12px", fontSize:11, fontWeight:700 }}>
                🏆 {b}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Social Proof ── */}
      <div style={{ margin:"20px 20px 0" }}>
        {/* HUI-Punkte */}
        <div style={{ background:C.card, borderRadius:20,
          padding:"16px 20px", marginBottom:10,
          boxShadow:"0 2px 12px rgba(26,26,46,0.06)",
          display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ fontWeight:900, fontSize:32,
            background:`linear-gradient(135deg, ${C.coral}, ${C.gold})`,
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
            backgroundClip:"text", lineHeight:1 }}>
            {profile.hui_points}
          </div>
          <div>
            <div style={{ fontWeight:800, fontSize:13, color:C.ink }}>HUI-Punkte</div>
            <div style={{ fontSize:11, color:C.muted }}>Gesammelt durch Buchungen & Impact</div>
          </div>
        </div>

        {/* Empfehlungen */}
        <div style={{ background:C.card, borderRadius:20,
          padding:"16px 20px", marginBottom:10,
          boxShadow:"0 2px 12px rgba(26,26,46,0.06)",
          border:`1.5px solid ${C.teal}20` }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:24 }}>👥</span>
            <div>
              <div style={{ fontWeight:800, fontSize:14, color:C.ink }}>
                {profile.recommendations_count} Menschen haben dich weiterempfohlen
              </div>
              <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>
                Empfehlungen entstehen nach abgeschlossenen Buchungen
              </div>
            </div>
          </div>
        </div>

        {/* Privater Hinweis — nur für den User sichtbar */}
        {profile.not_recommended_count > 0 && (
          <div style={{ background:`${C.coral}08`, borderRadius:16,
            padding:"12px 16px", border:`1px dashed ${C.coral}40`,
            display:"flex", alignItems:"flex-start", gap:10 }}>
            <span style={{ fontSize:16, flexShrink:0 }}>🔒</span>
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:C.coral }}>
                Nur für dich sichtbar
              </div>
              <div style={{ fontSize:12, color:C.muted, marginTop:2, lineHeight:1.5 }}>
                {profile.not_recommended_count}× nicht empfohlen — bitte prüfe dein Profil oder melde dich bei uns.
              </div>
            </div>
          </div>
        )}

        {/* Stats-Leiste */}
        <div style={{ display:"flex", background:C.card, borderRadius:18,
          padding:"14px 8px", marginTop:10,
          boxShadow:"0 2px 10px rgba(0,0,0,0.05)" }}>
          <StatPill icon="📦" value={profile.works_count}    label="Werke"       color={C.gold}  />
          <div style={{ width:1, background:C.border, margin:"4px 0" }} />
          <StatPill icon="📅" value={profile.bookings_count} label="Buchungen"   color={C.teal}  />
          <div style={{ width:1, background:C.border, margin:"4px 0" }} />
          <StatPill icon="🌱" value={`€ ${profile.impact_eur}`} label="Impact"  color={C.coral} />
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ marginTop:20 }}>
        <TabBar tabs={TABS} active={tab} onChange={setTab} />

        {/* TAB: Werke */}
        {tab === "werke" && (
          <div style={{ padding:"16px" }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              {werke.map(w => (
                <div key={w.id} className="hui-feed-card">
                  <div style={{ height:130, overflow:"hidden" }}>
                    <img src={w.img} alt={w.title}
                      style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                  </div>
                  <div style={{ padding:"10px 12px" }}>
                    <div style={{ fontWeight:700, fontSize:13, color:C.ink,
                      whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{w.title}</div>
                    <div style={{ fontWeight:800, fontSize:13, color:C.coral, marginTop:2 }}>{w.price}</div>
                  </div>
                </div>
              ))}
              {/* Neues Werk */}
              <div style={{ borderRadius:24, border:`2px dashed ${C.border}`,
                display:"flex", flexDirection:"column", alignItems:"center",
                justifyContent:"center", minHeight:180, cursor:"pointer",
                background:`${C.teal}04` }}>
                <div style={{ fontSize:28, color:C.teal, marginBottom:6 }}>+</div>
                <div style={{ fontSize:12, fontWeight:700, color:C.teal }}>Werk hinzufügen</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: Buchungen */}
        {tab === "buchungen" && (
          <div style={{ padding:"16px", display:"flex", flexDirection:"column", gap:12 }}>
            {bookings.length === 0 && (
              <div style={{ textAlign:"center", padding:"40px 20px" }}>
                <div style={{ fontSize:40, marginBottom:10 }}>📅</div>
                <div style={{ fontWeight:700, color:C.ink }}>Noch keine Buchungen</div>
              </div>
            )}
            {bookings.map(b => (
              <div key={b.id} className="hui-feed-card" style={{ padding:"16px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                  <div style={{ fontWeight:800, fontSize:15, color:C.ink }}>{b.title}</div>
                  <BookingStatusChip status={b.status} />
                </div>
                <div style={{ fontSize:13, color:C.muted }}>{b.wirker} · {b.date}</div>
                <div style={{ fontWeight:800, fontSize:15, color:C.teal, marginTop:6 }}>{b.amount}</div>
              </div>
            ))}
          </div>
        )}

        {/* TAB: Chats */}
        {tab === "chats" && (
          <div style={{ padding:"40px 20px", textAlign:"center" }}>
            <div style={{ fontSize:48, marginBottom:12 }}>💬</div>
            <div style={{ fontWeight:800, fontSize:17, color:C.ink, marginBottom:6 }}>Deine Chats</div>
            <div style={{ fontSize:13, color:C.muted, lineHeight:1.6 }}>
              Chats öffnen sich automatisch nach einer Buchung.
            </div>
          </div>
        )}

        {/* TAB: Verfügbarkeit */}
        {tab === "verfügbar" && (
          <div style={{ padding:"16px" }}>
            <div style={{ fontSize:13, color:C.muted, marginBottom:14, lineHeight:1.5 }}>
              Zeige wann du buchbar bist — Entdecker sehen deine freien Zeiten.
            </div>
            {slots.map((day, i) => (
              <div key={i} className="hui-feed-card" style={{ padding:"14px 16px", marginBottom:10 }}>
                <div style={{ fontWeight:700, fontSize:14, color:C.ink, marginBottom:10 }}>{day.date}</div>
                {day.slots.length === 0 ? (
                  <div style={{ fontSize:12, color:C.muted }}>Keine freien Slots</div>
                ) : (
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    {day.slots.map((s, j) => (
                      <div key={j} style={{ background:`${C.teal}12`, color:C.teal,
                        borderRadius:12, padding:"6px 14px", fontSize:13, fontWeight:700,
                        border:`1px solid ${C.teal}25` }}>
                        {s}
                      </div>
                    ))}
                    <button style={{ background:"none", border:`1.5px dashed ${C.border}`,
                      borderRadius:12, padding:"6px 14px", fontSize:13,
                      color:C.muted, cursor:"pointer" }}>+ Slot</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Logout */}
      <div style={{ padding:"20px 20px 8px" }}>
        <button onClick={onLogout}
          style={{ width:"100%", padding:"13px",
            background:"none", border:`1.5px solid ${C.border}`,
            borderRadius:16, fontSize:14, fontWeight:600,
            color:C.muted, cursor:"pointer" }}>
          Abmelden
        </button>
      </div>
    </div>
  );
}

/* ─── Haupt-Export ──────────────────────────────────────── */
export default function ProfilePage({ onTalentAnbieten, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { setLoading(false); return; }

        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", session.user.id)
          .single();

        setProfile(data || null);
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return (
    <div style={{ height:"100vh", display:"flex", alignItems:"center",
      justifyContent:"center", background:C.surface }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:36, marginBottom:10 }} className="hui-pulse">🌱</div>
        <div style={{ fontSize:13, color:C.muted }}>Profil lädt…</div>
      </div>
    </div>
  );

  // Fallback auf Mock
  const p = profile || MOCK_TALENT_PROFILE;
  const isTalent = !!(p.talent_type && p.talent_type !== "entdecker");

  if (!isTalent) {
    return <OwnProfileNoTalent profile={p || MOCK_PROFILE} onTalentAnbieten={onTalentAnbieten} onLogout={onLogout} />;
  }
  return <OwnProfileTalent profile={p} onLogout={onLogout} />;
}
