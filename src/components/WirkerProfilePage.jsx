import mockWirkerProfiles from "../lib/mockData";
import React, { useState, useEffect } from "react";
import BookingFlow from "./BookingFlow";
import { supabase } from "../lib/supabaseClient";
import { Heart, Star, MapPin, ArrowLeft } from "lucide-react";

const CORAL = "#FF6B5B";
const TEAL = "#2ABFAC";
const GOLD = "#F5A623";
const PURPLE = "#A78BFA";

function WirkerProfilePage({ wirkerName, onBack, onAddToCart, isOwnProfile, autoBook, returnStep6, onGoToChats, following, toggleFollow }) {
  const [dbWirker, setDbWirker] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [tab, setTab] = useState("werke");
  const [followed, setFollowed] = useState(false);
  // Sync mit globalem following State
  React.useEffect(() => {
    const name = dbWirker?.name || wirkerName;
    if (following && name) setFollowed(following.has(name));
  }, [following, dbWirker, wirkerName]);
  const [showBooking, setShowBooking] = useState(!!autoBook);
  const [showAvailEditor, setShowAvailEditor] = useState(false);
  const [bookingDone, setBookingDone] = useState(false);
  const [werke, setWerke] = useState([]);
  const [editingWerk, setEditingWerk] = useState(null);
  const [showWerkEditor, setShowWerkEditor] = useState(false);

  useEffect(() => {
    async function loadWirker() {
      setLoadingProfile(true);
      try {
        const { data: found, error } = await supabase
          .from('wirker')
          .select('*')
          .or(`name.eq.${wirkerName},full_name.eq.${wirkerName}`)
          .single();
        if (found && !error) {
          setDbWirker(found);
          setWerke(found.werke || []);
        } else {
          const mock = mockWirkerProfiles[wirkerName];
          if (mock) {
            setDbWirker(mock);
            setWerke(mock.werke || []);
          } else if (isOwnProfile) {
            // Eigenes Profil: Daten aus Auth + profiles Tabelle
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
              const u = session.user;
              const name = u.user_metadata?.full_name || u.email?.split('@')[0] || 'Ich';
              const { data: profile } = await supabase.from('profiles').select('*').eq('id', u.id).single();
              setDbWirker({
                name: name,
                full_name: name,
                talent: profile?.talent || 'Talent',
                location: profile?.location || 'München',
                bio: profile?.bio || 'Füge eine Beschreibung in deinen Einstellungen hinzu.',
                img: profile?.avatar_url || ('https://ui-avatars.com/api/?name=' + encodeURIComponent(name) + '&background=2ABFAC&color=fff&size=200'),
                header_img: null,
                hourly_rate: profile?.hourly_rate || 60,
                skills: profile?.skills || [],
                recommendations: 0,
                bookings: 0,
                impact_eur: 0,
                verified: false,
              });
              setWerke([]);
            }
          }
        }
      } catch(e) {
        const mock = mockWirkerProfiles[wirkerName];
        if (mock) { setDbWirker(mock); setWerke(mock.werke || []); }
      }
      setLoadingProfile(false);
    }
    loadWirker();
  }, [wirkerName, isOwnProfile]);

  const handleSaveWerk = (updatedWerk) => {
    setWerke(prev => {
      const idx = prev.findIndex(w => w.title === editingWerk?.title);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updatedWerk;
        return next;
      }
      return [...prev, updatedWerk];
    });
    setShowWerkEditor(false);
    setEditingWerk(null);
  };

  if (loadingProfile) return (
    <div style={{ padding: 32, textAlign: "center", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 32 }}>✨</div>
      <div style={{ color: TEAL, fontWeight: 600, fontSize: 15 }}>Lade Profil…</div>
    </div>
  );

  const p = dbWirker || mockWirkerProfiles[wirkerName];
  if (!p) return <div style={{ padding: 32, textAlign: "center" }}><button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: TEAL, fontWeight: 700 }}>← Zurück</button><p>Profil nicht gefunden</p></div>;
  
  // Normalize DB vs mock fields
  const profile = {
    name: p.name || wirkerName,
    fullName: p.full_name || p.fullName || p.name || wirkerName,
    talent: p.talent || "",
    location: p.location || "",
    hourlyRate: p.hourly_rate ? `${p.hourly_rate} €/h` : (p.hourlyRate || ""),
    memberSince: p.memberSince || "2024",
    bookings: p.bookings || 0,
    followers: p.followers || 0,
    recommendations: p.recommendations || 0,
    impactEur: p.impact_eur || p.impactEur || 0,
    bio: p.bio || "",
    img: p.img || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
    header: p.header_img || p.header || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=300&fit=crop",
    skills: p.skills || [],
    werke: werke,
    empfehlungen: p.empfehlungen || p.recommendations_list || [],
    pricePerHour: p.hourly_rate || p.pricePerHour || 0,
  };

  return (
    <div style={{ paddingBottom: 100, overflowY: "auto", height: "100vh", background: "#fafafa" }}>

      {/* ── HERO HEADER ── */}
      <div style={{ position: "relative" }}>
        <div style={{ height: 220, overflow: "hidden" }}>
          {profile.header
            ? <img src={profile.header} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
            : <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${TEAL}40, ${CORAL}20)` }} />
          }
        </div>
        <button onClick={onBack} style={{ position: "absolute", top: 16, left: 16, width: 38, height: 38, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(8px)", border: "none", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <button style={{ position: "absolute", top: 16, right: 16, width: 38, height: 38, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(8px)", border: "none", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/></svg>
        </button>
        <div style={{ position: "absolute", bottom: -44, left: 20 }}>
          <img src={profile.img} style={{ width: 90, height: 90, borderRadius: "50%", border: "4px solid white", objectFit: "cover", boxShadow: "0 4px 16px rgba(0,0,0,0.15)" }} alt={profile.name} />
        </div>
      </div>

      {/* ── NAME & INFO ── */}
      <div style={{ background: "white", padding: "54px 20px 20px", marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 21, color: "#1a1a1a" }}>{profile.fullName} {profile.recommendations >= 3 && <span style={{ color: TEAL }}>✓</span>}</div>
            <div style={{ fontSize: 13, color: TEAL, fontWeight: 600, marginTop: 2 }}>{profile.talent}</div>
          </div>
          {!isOwnProfile && (
            <button onClick={() => { const next = !followed; setFollowed(next); if(toggleFollow) toggleFollow(profile.name); }}
              style={{ background: followed ? TEAL : "white", border: `2px solid ${TEAL}`, borderRadius: 22, padding: "8px 18px", fontSize: 13, fontWeight: 700, color: followed ? "white" : TEAL, cursor: "pointer" }}>
              {followed ? "✓ Folge ich" : "+ Folgen"}
            </button>
          )}
        </div>
        {profile.bio && <div style={{ fontSize: 13, color: "#555", lineHeight: 1.65, marginBottom: 14 }}>{profile.bio}</div>}
        {profile.skills?.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
            {profile.skills.slice(0, 5).map((s, i) => (
              <span key={i} style={{ background: `${TEAL}12`, color: TEAL, borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 600 }}>{s}</span>
            ))}
          </div>
        )}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {profile.pricePerHour > 0 && <div style={{ background: `${GOLD}20`, borderRadius: 12, padding: "8px 14px" }}><span style={{ fontWeight: 800, fontSize: 14, color: "#92400E" }}>💰 Ab {profile.pricePerHour} €</span></div>}
          {profile.location && <div style={{ background: "#f5f5f5", borderRadius: 12, padding: "8px 14px" }}><span style={{ fontSize: 13, color: "#555" }}>📍 {profile.location}</span></div>}
          {profile.recommendations > 0 && <div style={{ background: `${TEAL}12`, borderRadius: 12, padding: "8px 14px" }}><span style={{ fontWeight: 700, fontSize: 13, color: TEAL }}>⭐ {profile.recommendations} Empfehlungen</span></div>}
        </div>
      </div>

      {/* ── TABS ── */}
      <div style={{ background: "white", display: "flex", borderBottom: "1px solid #f0f0ee" }}>
        {[["werke", "🎨", "Werke"], ["beitraege", "⊞", "Beiträge"]].map(([key, icon, label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ flex: 1, background: "none", border: "none", borderBottom: tab === key ? `2.5px solid ${CORAL}` : "2.5px solid transparent", padding: "14px 8px", fontSize: 12, fontWeight: tab === key ? 800 : 500, color: tab === key ? CORAL : "#aaa", cursor: "pointer", transition: "all 0.2s" }}>
            <div style={{ fontSize: 18, marginBottom: 2 }}>{icon}</div>
            {label}
          </button>
        ))}
      </div>

      {tab === "werke" && (
        <div style={{ padding: "16px" }}>
          {profile.werke.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 20px", color: "#ccc" }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>🎨</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#aaa" }}>Noch keine Werke</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {profile.werke.map((w, i) => (
                <div key={i} style={{ background: "white", borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
                  {(w.img || w.image) && <img src={w.img || w.image} alt={w.title || w.name} style={{ width: "100%", height: 220, objectFit: "cover" }} />}
                  <div style={{ padding: "16px 18px" }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: "#1a1a1a", marginBottom: 4 }}>{w.title || w.name}</div>
                    {w.description && <div style={{ fontSize: 13, color: "#777", lineHeight: 1.55, marginBottom: 10 }}>{w.description}</div>}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      {w.price && <span style={{ fontWeight: 900, fontSize: 18, color: TEAL }}>{w.price}</span>}
                      {!isOwnProfile && (
                        <button onClick={() => setShowBooking(true)} style={{ background: `linear-gradient(135deg, ${CORAL}, ${TEAL})`, color: "white", border: "none", borderRadius: 12, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                          💬 Interesse bekunden
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "beitraege" && (
        <div style={{ padding: "14px" }}>
          {profile.werke.filter(w => w.img || w.image).length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 20px" }}><div style={{ fontSize: 44 }}>📷</div><div style={{ fontSize: 15, color: "#aaa", marginTop: 10 }}>Noch keine Beiträge</div></div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 3 }}>
              {profile.werke.filter(w => w.img || w.image).map((w, i) => (
                <div key={i} style={{ aspectRatio: "1", borderRadius: 4, overflow: "hidden" }}>
                  <img src={w.img || w.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showBooking && (
        <BookingFlow wirker={profile} onClose={() => setShowBooking(false)} onAddToCart={onAddToCart} onSuccess={() => { setShowBooking(false); setBookingDone(true); }} returnStep6={returnStep6} />
      )}

    </div>
  );
}


export default WirkerProfilePage;
