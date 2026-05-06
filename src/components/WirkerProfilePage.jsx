import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import mockWirkerProfiles from "../lib/mockData";

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

/* ─── Kleine Helfer ─────────────────────────────────────── */
function Avatar({ src, name, size = 80 }) {
  const initials = (name || "").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", overflow: "hidden",
      flexShrink: 0,
      background: `linear-gradient(135deg, ${C.coral}80, ${C.teal}80)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.35, fontWeight: 900, color: "white",
    }}>
      {src
        ? <img src={src} alt={name} style={{ width:"100%", height:"100%", objectFit:"cover" }}
            onError={e => e.target.style.display = "none"} />
        : initials}
    </div>
  );
}

function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{ display:"flex", background:C.card,
      borderBottom:`1px solid ${C.border}`,
      position:"sticky", top:0, zIndex:10 }}>
      {tabs.map(([key, icon, label]) => (
        <button key={key} onClick={() => onChange(key)}
          style={{ flex:1, padding:"14px 4px", border:"none", cursor:"pointer",
            background:"none", display:"flex", flexDirection:"column",
            alignItems:"center", gap:3,
            borderBottom: active === key ? `2.5px solid ${C.teal}` : "2.5px solid transparent",
            transition:"border-color 0.2s",
            WebkitTapHighlightColor:"transparent" }}>
          <span style={{ fontSize:16 }}>{icon}</span>
          <span style={{ fontSize:10, fontWeight: active === key ? 800 : 500,
            color: active === key ? C.teal : C.muted,
            transition:"color 0.2s" }}>{label}</span>
        </button>
      ))}
    </div>
  );
}

/* ─── Story-Leiste (kompakt) ────────────────────────────── */
function MiniStories({ werke = [] }) {
  const items = werke.slice(0, 6);
  if (items.length === 0) return null;
  return (
    <div style={{ padding:"12px 0 8px" }}>
      <div style={{ display:"flex", gap:12, overflowX:"auto", padding:"2px 16px",
        scrollbarWidth:"none" }} className="scrollbar-hide">
        {items.map((w, i) => (
          <div key={i} style={{ display:"flex", flexDirection:"column",
            alignItems:"center", gap:5, flexShrink:0 }}>
            <div style={{ width:56, height:56, borderRadius:"50%",
              overflow:"hidden", border:`2px solid ${C.teal}`,
              boxShadow:`0 0 0 2px white, 0 0 0 3.5px ${C.teal}55` }}>
              <img src={w.img || w.image_url} alt={w.title}
                style={{ width:"100%", height:"100%", objectFit:"cover" }}
                onError={e => e.target.style.display = "none"} />
            </div>
            <span style={{ fontSize:9, fontWeight:600, color:C.ink,
              maxWidth:58, textAlign:"center",
              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {w.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Aktiver Wirker – Profil ───────────────────────────── */
function ActiveWirkerProfile({ profile, onBack, onBook, following, toggleFollow }) {
  const [tab, setTab] = useState("werke");
  const [followed, setFollowed] = useState(following?.has(profile.name) || false);

  const typeColor =
    profile.talentType === "beides" ? C.purple :
    profile.talentType === "werke"  ? C.gold   : C.teal;

  const typeLabel =
    profile.talentType === "beides" ? "🤝🎨 Wirker & Werke" :
    profile.talentType === "werke"  ? "🎨 Werke" : "🤝 Wirker";

  function handleFollow() {
    setFollowed(p => !p);
    if (toggleFollow) toggleFollow(profile.name);
  }

  async function handleShare() {
    if (navigator.share) {
      try { await navigator.share({ title: profile.fullName, text: profile.bio, url: window.location.href }); }
      catch {}
    }
  }

  const TABS = [
    ["werke",  "🎨", "Werke"],
    ["ueber",  "👤", "Über"],
  ];

  return (
    <div style={{ minHeight:"100vh", background:C.surface, paddingBottom:90 }}>

      {/* ── Hero Header ── */}
      <div style={{ position:"relative" }}>
        {/* Zurück + Teilen */}
        <div style={{ position:"absolute", top:16, left:16, zIndex:20 }}>
          <button onClick={onBack}
            style={{ width:40, height:40, borderRadius:"50%",
              background:"rgba(0,0,0,0.38)", backdropFilter:"blur(8px)",
              border:"none", cursor:"pointer", color:"white",
              fontSize:20, display:"flex", alignItems:"center", justifyContent:"center",
              WebkitTapHighlightColor:"transparent" }}>
            ←
          </button>
        </div>
        <div style={{ position:"absolute", top:16, right:16, zIndex:20 }}>
          <button onClick={handleShare}
            style={{ width:40, height:40, borderRadius:"50%",
              background:"rgba(0,0,0,0.38)", backdropFilter:"blur(8px)",
              border:"none", cursor:"pointer", color:"white",
              fontSize:18, display:"flex", alignItems:"center", justifyContent:"center",
              WebkitTapHighlightColor:"transparent" }}>
            ↗️
          </button>
        </div>

        {/* Header-Bild */}
        <div style={{ height:220, overflow:"hidden",
          background:`linear-gradient(160deg, ${typeColor}35, ${C.coral}15)` }}>
          {profile.header &&
            <img src={profile.header} alt=""
              style={{ width:"100%", height:"100%", objectFit:"cover",
                filter:"brightness(0.85)" }} />}
          <div style={{ position:"absolute", inset:0,
            background:"linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(255,255,255,0.88) 100%)" }} />
        </div>

        {/* Avatar */}
        <div style={{ position:"absolute", bottom:-32, left:20,
          border:"3.5px solid white", borderRadius:"50%",
          boxShadow:"0 4px 16px rgba(26,26,46,0.18)" }}>
          <Avatar src={profile.img} name={profile.fullName} size={72} />
        </div>
      </div>

      {/* Name + Typ + Location */}
      <div style={{ padding:"40px 20px 0" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <div style={{ fontWeight:900, fontSize:20, color:C.ink }}>{profile.fullName}</div>
            <div style={{ fontSize:12, fontWeight:700, color:typeColor, marginTop:2 }}>{typeLabel}</div>
            {profile.location && (
              <div style={{ fontSize:12, color:C.muted, marginTop:3 }}>📍 {profile.location}</div>
            )}
          </div>
          {profile.verified && (
            <span style={{ background:`${C.teal}12`, color:C.teal,
              borderRadius:20, padding:"5px 12px", fontSize:11, fontWeight:700 }}>
              ✓ Verifiziert
            </span>
          )}
        </div>

        {/* Bio */}
        {profile.bio && (
          <div style={{ fontSize:13, color:"#555", lineHeight:1.7, marginTop:12 }}>
            {profile.bio}
          </div>
        )}
      </div>

      {/* Story-Leiste */}
      <MiniStories werke={profile.werke || []} />

      {/* ── Vertrauenszahl ── */}
      {profile.recommendations > 0 && (
        <div style={{ margin:"16px 20px 0" }}>
          <div style={{ background:`${C.teal}08`, borderRadius:20,
            padding:"18px 20px", border:`1.5px solid ${C.teal}22`,
            display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ fontSize:32, flexShrink:0 }}>👥</div>
            <div>
              <div style={{ fontWeight:900, fontSize:18, color:C.teal, lineHeight:1.2 }}>
                {profile.recommendations}
              </div>
              <div style={{ fontSize:13, color:C.ink, fontWeight:700, marginTop:2 }}>
                Menschen haben {profile.fullName?.split(" ")[0]} weiterempfohlen
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Stats ── */}
      <div style={{ margin:"12px 20px 0",
        display:"flex", background:C.card, borderRadius:18,
        padding:"14px 8px", boxShadow:"0 2px 10px rgba(0,0,0,0.05)" }}>
        {[
          ["📦", profile.werke?.length || 0,    "Werke"],
          ["📅", profile.bookings || 0,          "Buchungen"],
          ["📍", profile.distance || "Lokal",    "Entfernung"],
          ["🌱", `€ ${profile.impactEur || 0}`,  "Impact"],
        ].map(([icon, val, label], i, arr) => (
          <React.Fragment key={label}>
            <div style={{ flex:1, display:"flex", flexDirection:"column",
              alignItems:"center", gap:2 }}>
              <div style={{ fontSize:11, color:C.muted }}>{icon}</div>
              <div style={{ fontWeight:900, fontSize:15, color:C.ink }}>{val}</div>
              <div style={{ fontSize:10, color:C.muted, textAlign:"center" }}>{label}</div>
            </div>
            {i < arr.length - 1 && (
              <div style={{ width:1, background:C.border, margin:"4px 0" }} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Mitglied seit + Impact-Beitrag */}
      <div style={{ margin:"10px 20px 0", display:"flex", gap:10 }}>
        <div style={{ flex:1, background:C.card, borderRadius:14,
          padding:"12px 14px", boxShadow:"0 1px 6px rgba(0,0,0,0.04)" }}>
          <div style={{ fontSize:11, color:C.muted, marginBottom:2 }}>Mitglied seit</div>
          <div style={{ fontWeight:800, fontSize:13, color:C.ink }}>
            {profile.memberSince || "2024"}
          </div>
        </div>
        <div style={{ flex:1.4, background:`${C.teal}08`, borderRadius:14,
          padding:"12px 14px", border:`1px solid ${C.teal}20` }}>
          <div style={{ fontSize:11, color:C.muted, marginBottom:2 }}>Impact beigetragen</div>
          <div style={{ fontWeight:800, fontSize:13, color:C.teal }}>
            € {profile.impactEur || 0} gesammelt
          </div>
        </div>
      </div>

      {/* ── CTAs ── */}
      <div style={{ margin:"20px 20px 0", display:"flex", gap:10 }}>
        <button onClick={() => onBook && onBook(profile)}
          style={{ flex:2, padding:"15px",
            background:`linear-gradient(135deg, ${C.coral}, ${C.teal})`,
            color:"white", border:"none", borderRadius:18,
            fontSize:14, fontWeight:900, cursor:"pointer",
            boxShadow:`0 5px 18px ${C.coral}2E`,
            WebkitTapHighlightColor:"transparent" }}>
          ✨ Talent entdecken
        </button>
        <button onClick={handleFollow}
          style={{ flex:1, padding:"15px",
            background: followed ? `${C.teal}12` : C.card,
            color: followed ? C.teal : C.muted,
            border: `1.5px solid ${followed ? C.teal : C.border}`,
            borderRadius:18, fontSize:13, fontWeight:700, cursor:"pointer",
            transition:"all 0.2s",
            WebkitTapHighlightColor:"transparent" }}>
          {followed ? "✓ Folge" : "+ Folgen"}
        </button>
      </div>

      {/* ── Skills ── */}
      {profile.skills?.length > 0 && (
        <div style={{ margin:"16px 20px 0" }}>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {profile.skills.map((s, i) => (
              <span key={i} style={{ background:`${typeColor}10`, color:typeColor,
                borderRadius:20, padding:"5px 13px",
                fontSize:11, fontWeight:600 }}>{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* ── Tabs ── */}
      <div style={{ marginTop:20 }}>
        <TabBar tabs={TABS} active={tab} onChange={setTab} />

        {/* TAB: Werke */}
        {tab === "werke" && (
          <div style={{ padding:"16px" }}>
            {(!profile.werke || profile.werke.length === 0) ? (
              <div style={{ textAlign:"center", padding:"40px 20px" }}>
                <div style={{ fontSize:40, marginBottom:10 }}>🎨</div>
                <div style={{ fontWeight:700, color:C.muted }}>Noch keine Werke</div>
              </div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                {profile.werke.map((w, i) => (
                  <div key={i} className="hui-feed-card">
                    <div style={{ height:130, overflow:"hidden" }}>
                      <img src={w.img || w.image_url} alt={w.title}
                        style={{ width:"100%", height:"100%", objectFit:"cover" }}
                        onError={e => e.target.style.background = `${typeColor}20`} />
                    </div>
                    <div style={{ padding:"10px 12px" }}>
                      <div style={{ fontWeight:700, fontSize:13, color:C.ink,
                        whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                        {w.title}
                      </div>
                      <div style={{ display:"flex", justifyContent:"space-between",
                        alignItems:"center", marginTop:4 }}>
                        <div style={{ fontWeight:800, fontSize:13, color:C.coral }}>
                          {w.price}
                        </div>
                        {w.shipping && w.shipping !== "0 €" && (
                          <div style={{ fontSize:10, color:C.muted }}>
                            +{w.shipping} Versand
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: Über */}
        {tab === "ueber" && (
          <div style={{ padding:"16px", display:"flex", flexDirection:"column", gap:12 }}>

            {/* Über-Karte */}
            <div className="hui-feed-card" style={{ padding:"20px" }}>
              <div style={{ fontWeight:800, fontSize:15, color:C.ink, marginBottom:10 }}>
                Über {profile.fullName?.split(" ")[0]}
              </div>
              <div style={{ fontSize:13, color:"#555", lineHeight:1.7 }}>
                {profile.bio || "Keine Beschreibung vorhanden."}
              </div>
            </div>

            {/* Empfehlungen */}
            {profile.empfehlungen?.length > 0 && (
              <div>
                <div style={{ fontWeight:800, fontSize:15, color:C.ink,
                  marginBottom:10, padding:"0 4px" }}>
                  Was andere sagen
                </div>
                {profile.empfehlungen.map((e, i) => (
                  <div key={i} className="hui-feed-card"
                    style={{ padding:"16px", marginBottom:10 }}>
                    <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                      <div style={{ width:36, height:36, borderRadius:"50%",
                        overflow:"hidden", flexShrink:0,
                        background:`${C.teal}20` }}>
                        {e.avatar
                          ? <img src={e.avatar} alt={e.name}
                              style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                          : <div style={{ width:"100%", height:"100%",
                              display:"flex", alignItems:"center", justifyContent:"center",
                              fontWeight:800, fontSize:13, color:C.teal }}>
                              {(e.name||"")[0]}
                            </div>
                        }
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", justifyContent:"space-between" }}>
                          <div style={{ fontWeight:700, fontSize:13, color:C.ink }}>{e.name}</div>
                          <div style={{ fontSize:11, color:C.muted }}>{e.datum}</div>
                        </div>
                        <div style={{ fontSize:13, color:"#555", lineHeight:1.6, marginTop:4 }}>
                          „{e.text}"
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Noch keine Empfehlungen */}
            {(!profile.empfehlungen || profile.empfehlungen.length === 0) && (
              <div className="hui-feed-card" style={{ padding:"24px", textAlign:"center" }}>
                <div style={{ fontSize:32, marginBottom:8 }}>💬</div>
                <div style={{ fontWeight:700, fontSize:14, color:C.ink, marginBottom:4 }}>
                  Noch keine Empfehlungen
                </div>
                <div style={{ fontSize:12, color:C.muted }}>
                  Empfehlungen entstehen nach abgeschlossenen Buchungen.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Neuer User – kein Talent ──────────────────────────── */
function NewUserProfile({ profile, onBack, following, toggleFollow }) {
  const [followed, setFollowed] = useState(following?.has(profile.name) || false);

  function handleFollow() {
    setFollowed(p => !p);
    if (toggleFollow) toggleFollow(profile.name);
  }

  return (
    <div style={{ minHeight:"100vh", background:C.surface, paddingBottom:90 }}>

      {/* Zurück */}
      <div style={{ position:"absolute", top:16, left:16, zIndex:20 }}>
        <button onClick={onBack}
          style={{ width:40, height:40, borderRadius:"50%",
            background:"rgba(0,0,0,0.35)", backdropFilter:"blur(8px)",
            border:"none", cursor:"pointer", color:"white",
            fontSize:20, display:"flex", alignItems:"center", justifyContent:"center",
            WebkitTapHighlightColor:"transparent" }}>
          ←
        </button>
      </div>

      {/* Header */}
      <div style={{ height:200, overflow:"hidden", position:"relative",
        background:`linear-gradient(160deg, ${C.teal}25, ${C.coral}12)` }}>
        {profile.header &&
          <img src={profile.header} alt=""
            style={{ width:"100%", height:"100%", objectFit:"cover", filter:"brightness(0.82)" }} />}
        <div style={{ position:"absolute", inset:0,
          background:"linear-gradient(to bottom, rgba(0,0,0,0.08), rgba(255,255,255,0.88))" }} />
      </div>

      {/* Avatar */}
      <div style={{ display:"flex", justifyContent:"center", marginTop:-36 }}>
        <div style={{ border:"4px solid white", borderRadius:"50%",
          boxShadow:"0 4px 20px rgba(26,26,46,0.14)" }}>
          <Avatar src={profile.img} name={profile.fullName} size={80} />
        </div>
      </div>

      {/* Name & Bio */}
      <div style={{ textAlign:"center", padding:"14px 28px 0" }}>
        <div style={{ fontWeight:900, fontSize:22, color:C.ink, marginBottom:6 }}>
          {profile.fullName}
        </div>
        {profile.bio && (
          <div style={{ fontSize:13, color:C.muted, lineHeight:1.65 }}>
            {profile.bio}
          </div>
        )}
      </div>

      {/* Zentrale Botschaft */}
      <div style={{ margin:"28px 24px 0" }}>
        <div style={{ background:C.card, borderRadius:24,
          padding:"28px 24px", textAlign:"center",
          boxShadow:"0 2px 20px rgba(26,26,46,0.07)",
          border:`1.5px solid ${C.border}` }}>
          <div style={{ fontSize:44, marginBottom:14 }}>🌱</div>
          <div style={{ fontWeight:800, fontSize:17, color:C.ink, marginBottom:10, lineHeight:1.4 }}>
            Dieser Mensch hat sein Talent noch nicht angeboten.
          </div>
          <div style={{ fontSize:13, color:C.muted, lineHeight:1.65 }}>
            Auf HUI können Menschen ihr Können teilen — und mit jeder Buchung echte Projekte fördern.
            Vielleicht kommt bald etwas von {profile.fullName?.split(" ")[0]}.
          </div>
        </div>
      </div>

      {/* Einziger CTA: Folgen */}
      <div style={{ margin:"20px 24px 0" }}>
        <button onClick={handleFollow}
          style={{ width:"100%", padding:"16px",
            background: followed
              ? `${C.teal}12`
              : `linear-gradient(135deg, ${C.teal}20, ${C.teal}10)`,
            color: C.teal,
            border: `1.5px solid ${C.teal}${followed ? "50" : "30"}`,
            borderRadius:18, fontSize:14, fontWeight:800, cursor:"pointer",
            transition:"all 0.2s",
            WebkitTapHighlightColor:"transparent" }}>
          {followed ? "✓ Du folgst diesem Menschen" : `+ ${profile.fullName?.split(" ")[0]} folgen`}
        </button>
        <div style={{ textAlign:"center", fontSize:12, color:C.muted, marginTop:8, lineHeight:1.5 }}>
          Du wirst benachrichtigt, sobald {profile.fullName?.split(" ")[0]} sein Talent teilt.
        </div>
      </div>
    </div>
  );
}

/* ─── Haupt-Export ──────────────────────────────────────── */
export default function WirkerProfilePage({
  wirkerName, onBack, onAddToCart, isOwnProfile,
  following, toggleFollow, onGoToChats,
}) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // DB-Lookup
        const { data } = await supabase
          .from("profiles")
          .select("*, works(*), experiences(*)")
          .eq("name", wirkerName)
          .single();

        if (data) {
          setProfile({
            name:           data.id,
            fullName:       data.name,
            talent:         data.talent || "",
            location:       data.location || "",
            bio:            data.bio || "",
            img:            data.profile_image_url || null,
            header:         data.header_image_url || null,
            skills:         data.skills || [],
            recommendations: data.recommendations_count || 0,
            bookings:       0,
            impactEur:      0,
            memberSince:    new Date(data.created_at).toLocaleDateString("de-DE", { month:"long", year:"numeric" }),
            werke:          (data.works || []).map(w => ({ title:w.title, price:`${w.price} €`, img:w.media_urls?.[0] })),
            talentType:     data.user_type?.toLowerCase() || "talent",
            pricePerHour:   data.experiences?.[0]?.price || 0,
            verified:       false,
            empfehlungen:   [],
            distance:       "–",
          });
          setLoading(false);
          return;
        }
      } catch {}

      // Mock-Fallback
      const mock = mockWirkerProfiles[wirkerName];
      if (mock) {
        setProfile({
          name:           mock.name,
          fullName:       mock.fullName || mock.name,
          talent:         mock.talent || "",
          location:       mock.location || "",
          bio:            mock.bio || "",
          img:            mock.img || null,
          header:         mock.header || null,
          skills:         mock.skills || [],
          recommendations: mock.recommendations || 0,
          bookings:       mock.bookings || 0,
          impactEur:      mock.impactEur || 0,
          memberSince:    mock.memberSince || "2024",
          werke:          mock.werke || [],
          talentType:     mock.talentType || "wirker",
          pricePerHour:   mock.pricePerHour || 0,
          verified:       mock.verified || false,
          empfehlungen:   mock.empfehlungen || [],
          distance:       mock.distance || "–",
        });
      }
      setLoading(false);
    }
    load();
  }, [wirkerName]);

  if (loading) return (
    <div style={{ height:"100vh", display:"flex", alignItems:"center",
      justifyContent:"center", background:C.surface }}>
      <div style={{ fontSize:36 }} className="hui-pulse">🌱</div>
    </div>
  );

  if (!profile) return (
    <div style={{ padding:32, textAlign:"center" }}>
      <button onClick={onBack} style={{ background:"none", border:"none",
        cursor:"pointer", color:C.teal, fontSize:14, fontWeight:700 }}>
        ← Zurück
      </button>
      <div style={{ fontSize:14, color:C.muted, marginTop:12 }}>Profil nicht gefunden.</div>
    </div>
  );

  // Kein Talent = neuer User
  const hasTalent = !!(profile.talentType && profile.talentType !== "entdecker" && profile.talentType !== null);

  if (!hasTalent) {
    return <NewUserProfile profile={profile} onBack={onBack} following={following} toggleFollow={toggleFollow} />;
  }

  return (
    <ActiveWirkerProfile
      profile={profile}
      onBack={onBack}
      onBook={onAddToCart}
      following={following}
      toggleFollow={toggleFollow}
    />
  );
}
