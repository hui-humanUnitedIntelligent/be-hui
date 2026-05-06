import mockWirkerProfiles from "../lib/mockData";
import React, { useState, useEffect } from "react";
import BookingFlow from "./BookingFlow";
import { supabase } from "../lib/supabaseClient";
import { Heart, Star, MapPin, ArrowLeft, ShoppingBag, Handshake, Grid, Image } from "lucide-react";

const CORAL = "#FF6B5B";
const TEAL = "#2ABFAC";
const GOLD = "#F5A623";
const PURPLE = "#A78BFA";

// ─────────────────────────────────────────────
// Fremdes Profil — wird je nach talent_type unterschiedlich gerendert
// talent_type: "wirker" | "werke" | "beides"
// ─────────────────────────────────────────────
function WirkerProfilePage({ wirkerName, onBack, onAddToCart, isOwnProfile, autoBook, returnStep6, onGoToChats, following, toggleFollow }) {
  const [dbWirker, setDbWirker] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [tab, setTab] = useState("main"); // main | beitraege | empfehlungen
  const [followed, setFollowed] = useState(false);
  const [showBooking, setShowBooking] = useState(!!autoBook);
  const [bookingDone, setBookingDone] = useState(false);
  const [werke, setWerke] = useState([]);
  const [beitraege, setBeitraege] = useState([]);

  // Sync following state
  useEffect(() => {
    const name = dbWirker?.name || wirkerName;
    if (following && name) setFollowed(following.has(name));
  }, [following, dbWirker, wirkerName]);

  useEffect(() => {
    async function loadWirker() {
      setLoadingProfile(true);
      try {
        const { data } = await supabase.from("wirker").select("*").eq("name", wirkerName).single();
        if (data) {
          setDbWirker(data);
          // Werke laden
          const { data: w } = await supabase.from("werke").select("*").eq("wirker_id", data.id).order("created_at", { ascending: false });
          if (w) setWerke(w);
          // Beiträge laden
          const { data: b } = await supabase.from("beitraege").select("*").eq("wirker_name", data.name).order("created_at", { ascending: false });
          if (b) setBeitraege(b);
        }
      } catch(e) {}
      setLoadingProfile(false);
    }
    loadWirker();
  }, [wirkerName]);

  const p = dbWirker || mockWirkerProfiles[wirkerName];
  if (loadingProfile) return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontSize: 32 }}>🌱</div>
    </div>
  );
  if (!p) return (
    <div style={{ padding: 32, textAlign: "center" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: TEAL, fontWeight: 700 }}>← Zurück</button>
      <p style={{ color: "#aaa" }}>Profil nicht gefunden</p>
    </div>
  );

  // Normalize fields
  const profile = {
    name: p.name || wirkerName,
    fullName: p.full_name || p.fullName || p.name || wirkerName,
    talent: p.talent || "",
    location: p.location || "",
    hourlyRate: p.hourly_rate ? `${p.hourly_rate} €/h` : (p.hourlyRate || ""),
    pricePerHour: p.hourly_rate || p.pricePerHour || 0,
    memberSince: p.memberSince || "2024",
    bookings: p.bookings || 0,
    followers: p.followers || 0,
    recommendations: p.recommendations || 0,
    impactEur: p.impact_eur || p.impactEur || 0,
    bio: p.bio || "",
    img: p.img || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name || wirkerName)}&background=2ABFAC&color=fff&size=200`,
    header: p.header_img || p.header || null,
    skills: p.skills || [],
    talentType: p.talent_type || p.talentType || "wirker", // "wirker" | "werke" | "beides"
    verified: p.verified || false,
    werke: werke.length > 0 ? werke : (p.werke || []),
    beitraege: beitraege,
    empfehlungen: p.empfehlungen || p.recommendations_list || [],
  };

  // Profil-Typ bestimmt UI
  const isWirker = profile.talentType === "wirker" || profile.talentType === "beides";
  const isWerke  = profile.talentType === "werke"  || profile.talentType === "beides";
  const isBeides = profile.talentType === "beides";

  // Farbe und Label je nach Typ
  const typeColor = isBeides ? PURPLE : isWerke ? GOLD : TEAL;
  const typeLabel = isBeides ? "🤝🎨 Wirker & Werke"
                 : isWerke   ? "🎨 Werke"
                 :              "🤝 Wirker";

  // Tabs je nach Typ
  const tabs = [];
  if (isWirker) tabs.push(["main", "🤝", "Dienste"]);
  if (isWerke)  tabs.push(["werke", "🎨", "Werke"]);
  tabs.push(["beitraege", "⊞", "Beiträge"]);
  tabs.push(["empfehlungen", "⭐", "Empfehlungen"]);

  // Default Tab setzen wenn nötig
  const activeTab = tabs.find(t => t[0] === tab) ? tab : tabs[0][0];

  return (
    <div style={{ paddingBottom: 100, overflowY: "auto", height: "100vh", background: "#fafafa" }}>

      {/* ── HERO HEADER ── */}
      <div style={{ position: "relative" }}>
        <div style={{ height: 220, overflow: "hidden", background: `linear-gradient(135deg, ${typeColor}50, ${CORAL}20)` }}>
          {profile.header && <img src={profile.header} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />}
        </div>

        {/* Typ-Badge oben rechts */}
        <div style={{ position: "absolute", top: 16, right: 60, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)", borderRadius: 20, padding: "5px 12px", fontSize: 12, fontWeight: 700, color: "white" }}>
          {typeLabel}
        </div>

        <button onClick={onBack} style={{ position: "absolute", top: 16, left: 16, width: 38, height: 38, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(8px)", border: "none", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>

        <div style={{ position: "absolute", bottom: -44, left: 20 }}>
          <div style={{ position: "relative" }}>
            <img src={profile.img} style={{ width: 90, height: 90, borderRadius: "50%", border: `4px solid white`, objectFit: "cover", boxShadow: "0 4px 16px rgba(0,0,0,0.15)" }} alt={profile.name} />
            {profile.verified && (
              <div style={{ position: "absolute", bottom: 2, right: 2, width: 22, height: 22, background: TEAL, borderRadius: "50%", border: "2px solid white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>✓</div>
            )}
          </div>
        </div>
      </div>

      {/* ── NAME & INFO ── */}
      <div style={{ background: "white", padding: "54px 20px 20px", marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 21, color: "#1a1a1a" }}>{profile.fullName}</div>
            <div style={{ fontSize: 13, color: typeColor, fontWeight: 700, marginTop: 2 }}>{profile.talent}</div>
            {profile.location && <div style={{ fontSize: 12, color: "#aaa", marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}>📍 {profile.location}</div>}
          </div>
          {!isOwnProfile && (
            <button onClick={() => { const next = !followed; setFollowed(next); if (toggleFollow) toggleFollow(profile.name); }}
              style={{ background: followed ? TEAL : "white", border: `2px solid ${TEAL}`, borderRadius: 22, padding: "8px 18px", fontSize: 13, fontWeight: 700, color: followed ? "white" : TEAL, cursor: "pointer", transition: "all 0.2s" }}>
              {followed ? "✓ Folge ich" : "+ Folgen"}
            </button>
          )}
        </div>

        {profile.bio && <div style={{ fontSize: 13, color: "#555", lineHeight: 1.65, marginBottom: 14 }}>{profile.bio}</div>}

        {/* Skills Tags */}
        {profile.skills?.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
            {profile.skills.slice(0, 5).map((s, i) => (
              <span key={i} style={{ background: `${typeColor}12`, color: typeColor, borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 600 }}>{s}</span>
            ))}
          </div>
        )}

        {/* Stats */}
        <div style={{ display: "flex", gap: 0, background: "#f8f8f8", borderRadius: 14, overflow: "hidden", marginBottom: 16 }}>
          {[
            ["⭐", profile.recommendations, "Empfehlungen"],
            ["👥", profile.followers, "Follower"],
            ["🌱", `${profile.impactEur} €`, "Impact"],
          ].map(([icon, val, label]) => (
            <div key={label} style={{ flex: 1, textAlign: "center", padding: "12px 6px", borderRight: "1px solid #eee" }}>
              <div style={{ fontSize: 16, marginBottom: 2 }}>{icon}</div>
              <div style={{ fontWeight: 800, fontSize: 14, color: "#1a1a1a" }}>{val}</div>
              <div style={{ fontSize: 10, color: "#aaa" }}>{label}</div>
            </div>
          ))}
        </div>

        {/* CTA Buttons — je nach Typ */}
        {!isOwnProfile && (
          <div style={{ display: "flex", gap: 10 }}>
            {isWirker && (
              <button onClick={() => setShowBooking(true)}
                style={{ flex: 2, background: `linear-gradient(135deg, ${CORAL}, ${TEAL})`, color: "white", border: "none", borderRadius: 14, padding: "14px", fontSize: 15, fontWeight: 800, cursor: "pointer", boxShadow: `0 4px 16px ${CORAL}33` }}>
                📅 Jetzt buchen {profile.pricePerHour > 0 ? `· ab ${profile.pricePerHour} €` : ""}
              </button>
            )}
            {isWerke && !isWirker && (
              <button onClick={() => { if (onGoToChats) onGoToChats(); }}
                style={{ flex: 2, background: `linear-gradient(135deg, ${GOLD}, ${CORAL})`, color: "white", border: "none", borderRadius: 14, padding: "14px", fontSize: 15, fontWeight: 800, cursor: "pointer", boxShadow: `0 4px 16px ${GOLD}33` }}>
                💬 Interesse bekunden
              </button>
            )}
            {isBeides && (
              <button onClick={() => { if (onGoToChats) onGoToChats(); }}
                style={{ flex: 1, background: "white", color: GOLD, border: `2px solid ${GOLD}`, borderRadius: 14, padding: "14px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                🎨 Werk anfragen
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── TABS ── */}
      <div style={{ background: "white", display: "flex", borderBottom: "1px solid #f0f0ee", marginBottom: 8 }}>
        {tabs.map(([key, icon, label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ flex: 1, background: "none", border: "none", borderBottom: activeTab === key ? `2.5px solid ${typeColor}` : "2.5px solid transparent", padding: "13px 6px", fontSize: 11, fontWeight: activeTab === key ? 800 : 500, color: activeTab === key ? typeColor : "#aaa", cursor: "pointer", transition: "all 0.2s" }}>
            <div style={{ fontSize: 17, marginBottom: 2 }}>{icon}</div>
            {label}
          </button>
        ))}
      </div>

      {/* ── TAB: DIENSTE (nur Wirker) ── */}
      {activeTab === "main" && isWirker && (
        <div style={{ padding: "16px" }}>
          {/* Preis-Info */}
          {profile.pricePerHour > 0 && (
            <div style={{ background: `linear-gradient(135deg, ${TEAL}12, ${TEAL}05)`, borderRadius: 18, padding: "16px 20px", marginBottom: 16, border: `1px solid ${TEAL}20` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 20, color: "#1a1a1a" }}>{profile.pricePerHour} €<span style={{ fontSize: 13, fontWeight: 500, color: "#888" }}> /Stunde</span></div>
                  <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>inkl. HUI-Provision · sicher im Treuhand</div>
                </div>
                <div style={{ fontSize: 36 }}>🤝</div>
              </div>
              <div style={{ background: `${TEAL}10`, borderRadius: 10, padding: "8px 12px", marginTop: 12, fontSize: 12, color: TEAL, fontWeight: 600 }}>
                🌱 {Math.round(profile.pricePerHour * 0.15 * 0.15 * 100) / 100} € pro Buchung fließen in Impact-Projekte
              </div>
            </div>
          )}

          {/* Skills als Dienste */}
          {profile.skills?.length > 0 && (
            <div style={{ background: "white", borderRadius: 18, padding: "16px 20px", marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a1a", marginBottom: 12 }}>Was {profile.name} anbietet</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {profile.skills.map((skill, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < profile.skills.length - 1 ? "1px solid #f5f5f5" : "none" }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${TEAL}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>✦</div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "#333" }}>{skill}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Buchen CTA unten */}
          {!isOwnProfile && (
            <button onClick={() => setShowBooking(true)}
              style={{ width: "100%", background: `linear-gradient(135deg, ${CORAL}, ${TEAL})`, color: "white", border: "none", borderRadius: 16, padding: "16px", fontSize: 16, fontWeight: 800, cursor: "pointer", boxShadow: `0 4px 16px ${CORAL}33` }}>
              📅 Termin buchen {profile.hourlyRate ? `· ${profile.hourlyRate}` : ""}
            </button>
          )}
        </div>
      )}

      {/* ── TAB: WERKE ── */}
      {activeTab === "werke" && (
        <div style={{ padding: "16px" }}>
          {profile.werke.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 20px", color: "#ccc" }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>🎨</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#aaa" }}>Noch keine Werke</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {profile.werke.map((w, i) => (
                <div key={i} style={{ background: "white", borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.07)", border: `1px solid ${GOLD}20` }}>
                  {(w.img || w.image || w.bild) && (
                    <img src={w.img || w.image || w.bild} alt={w.title || w.titel || w.name} style={{ width: "100%", height: 220, objectFit: "cover" }} />
                  )}
                  <div style={{ padding: "16px 18px" }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: "#1a1a1a", marginBottom: 4 }}>{w.title || w.titel || w.name}</div>
                    {(w.description || w.beschreibung) && <div style={{ fontSize: 13, color: "#777", lineHeight: 1.55, marginBottom: 10 }}>{w.description || w.beschreibung}</div>}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      {(w.price || w.preis) && <span style={{ fontWeight: 900, fontSize: 18, color: GOLD }}>{w.price || w.preis}</span>}
                      {!isOwnProfile && (
                        <button onClick={() => { if (onGoToChats) onGoToChats(); }}
                          style={{ background: `linear-gradient(135deg, ${GOLD}, ${CORAL})`, color: "white", border: "none", borderRadius: 12, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                          💬 Anfragen
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

      {/* ── TAB: BEITRÄGE ── */}
      {activeTab === "beitraege" && (
        <div style={{ padding: "14px" }}>
          {profile.beitraege.length === 0 && profile.werke.filter(w => w.img || w.image || w.bild).length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 20px" }}>
              <div style={{ fontSize: 44 }}>📷</div>
              <div style={{ fontSize: 15, color: "#aaa", marginTop: 10 }}>Noch keine Beiträge</div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 3 }}>
              {profile.beitraege.map((b, i) => (
                <div key={i} style={{ aspectRatio: "1", borderRadius: 4, overflow: "hidden", background: "#111", position: "relative" }}>
                  {b.type === "video"
                    ? <><video src={b.src || b.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted playsInline />
                        <div style={{ position: "absolute", top: 6, right: 6, fontSize: 12 }}>▶️</div></>
                    : <img src={b.src || b.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  }
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: EMPFEHLUNGEN ── */}
      {activeTab === "empfehlungen" && (
        <div style={{ padding: "16px" }}>
          {profile.empfehlungen.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 20px" }}>
              <div style={{ fontSize: 44 }}>💬</div>
              <div style={{ fontSize: 15, color: "#aaa", marginTop: 10 }}>Noch keine Empfehlungen</div>
              <div style={{ fontSize: 12, color: "#ccc", marginTop: 6 }}>Empfehlungen entstehen nach abgeschlossenen Buchungen</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {profile.empfehlungen.map((emp, i) => (
                <div key={i} style={{ background: "white", borderRadius: 18, padding: "16px 18px", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${TEAL}20`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, color: TEAL }}>
                      {(emp.name || emp.author || "?")[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{emp.name || emp.author || "Anonymer Nutzer"}</div>
                      <div style={{ fontSize: 11, color: "#aaa" }}>{emp.date || emp.created_at || ""}</div>
                    </div>
                    <div style={{ marginLeft: "auto", color: GOLD, fontSize: 13 }}>{"⭐".repeat(emp.stars || 5)}</div>
                  </div>
                  {emp.text && <div style={{ fontSize: 13, color: "#555", lineHeight: 1.6 }}>{emp.text}</div>}
                  {(emp.img || emp.image) && <img src={emp.img || emp.image} alt="" style={{ width: "100%", borderRadius: 12, marginTop: 10, objectFit: "cover", maxHeight: 200 }} />}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* BookingFlow Overlay */}
      {showBooking && (
        <BookingFlow
          wirker={profile}
          onClose={() => setShowBooking(false)}
          onAddToCart={onAddToCart}
          onSuccess={() => { setShowBooking(false); setBookingDone(true); if (onGoToChats) onGoToChats(); }}
          returnStep6={returnStep6}
        />
      )}
    </div>
  );
}

export default WirkerProfilePage;
