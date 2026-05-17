import React, { useState, useEffect } from "react";
import { ArrowLeft, BadgeCheck, ThumbsUp, Star, Search, Filter, ChevronRight, Award, Shield, TrendingUp, Users } from "lucide-react";
import { HuiWirker } from "@/api/entities";

const CORAL = "#FF6B5B";
const TEAL = "#2ABFAC";
const GOLD = "#F5A623";
const PURPLE = "#8B5CF6";

// Badge-Stufen
const BADGE_LEVELS = [
  { min: 0,   max: 4,   label: "Neu",         color: "#94a3b8", bg: "#f1f5f9",       icon: "🌱", desc: "Erste Schritte auf HUI" },
  { min: 5,   max: 14,  label: "Aktiv",        color: TEAL,      bg: `${TEAL}12`,     icon: "✨", desc: "Mehrfach verifiziert" },
  { min: 15,  max: 29,  label: "Bewährt",      color: GOLD,      bg: `${GOLD}12`,     icon: "⭐", desc: "Konstant positive Rückmeldungen" },
  { min: 30,  max: 59,  label: "Top Wirker",   color: CORAL,     bg: `${CORAL}12`,    icon: "🏆", desc: "Ausgezeichnete Leistung" },
  { min: 60,  max: 999, label: "HUI Champion", color: PURPLE,    bg: `${PURPLE}12`,   icon: "👑", desc: "Außergewöhnliche Gemeinschaft" },
];

function getBadge(recs) {
  return BADGE_LEVELS.find(b => recs >= b.min && recs <= b.max) || BADGE_LEVELS[0];
}

const mockWirkerData = [
  {
    id: "w1", name: "Maria L.", fullName: "Maria Langner",
    talent: "Yoga & Achtsamkeit", location: "Zürich",
    img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop",
    recommendations: 93, bookings: 156, followers: 847,
    verified: true, memberSince: "Feb 2024",
    empfehlungen: [
      { name: "Lena K.", text: "Unglaubliche Session – habe danach so tief geschlafen wie seit Jahren nicht.", datum: "Apr 2026", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop", verified: true },
      { name: "Tom H.", text: "Maria ist einfach eine außergewöhnliche Lehrerin. Immer wieder gerne!", datum: "Apr 2026", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop", verified: true },
      { name: "Sofia M.", text: "Jeden Montag meine Lieblingsstunde. Absolute Empfehlung.", datum: "Mär 2026", avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=60&h=60&fit=crop", verified: true },
    ],
    trend: +12,
  },
  {
    id: "w2", name: "Marcus B.", fullName: "Marcus Braun",
    talent: "Fotograf & Videograf", location: "Berlin",
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
    recommendations: 47, bookings: 89, followers: 512,
    verified: true, memberSince: "Jan 2024",
    empfehlungen: [
      { name: "Anna P.", text: "Die besten Fotos meines Lebens. Marcus hat ein unglaubliches Auge.", datum: "Apr 2026", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=60&h=60&fit=crop", verified: true },
      { name: "Lars M.", text: "Event-Fotos waren traumhaft. Schnelle Lieferung, super Qualität.", datum: "Mär 2026", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop", verified: true },
    ],
    trend: +5,
  },
  {
    id: "w3", name: "Sofia M.", fullName: "Sofia Mayer",
    talent: "Keramik-Künstlerin", location: "München",
    img: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop",
    recommendations: 34, bookings: 41, followers: 218,
    verified: true, memberSince: "Mär 2024",
    empfehlungen: [
      { name: "Marc B.", text: "Die Tasse ist ein echtes Kunstwerk. Jedes Stück ein Unikat!", datum: "Apr 2026", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop", verified: true },
      { name: "Julia S.", text: "Workshop war super entspannend und kreativ. Absolut empfehlenswert!", datum: "Mär 2026", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop", verified: true },
    ],
    trend: +8,
  },
  {
    id: "w4", name: "Lena K.", fullName: "Lena Kraft",
    talent: "Aquarell-Illustratorin", location: "Hamburg",
    img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
    recommendations: 22, bookings: 33, followers: 190,
    verified: true, memberSince: "Apr 2024",
    empfehlungen: [
      { name: "Max T.", text: "Mein Portrait hat mich zu Tränen gerührt. Einfach wunderschön.", datum: "Apr 2026", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&h=60&fit=crop", verified: true },
    ],
    trend: +3,
  },
  {
    id: "w5", name: "Tom H.", fullName: "Tom Huber",
    talent: "Leder-Handwerk", location: "Wien",
    img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop",
    recommendations: 28, bookings: 45, followers: 301,
    verified: false, memberSince: "Feb 2024",
    empfehlungen: [
      { name: "Klaus M.", text: "Der Rucksack ist perfekt verarbeitet. Werde ihn ein Leben lang tragen.", datum: "Mär 2026", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop", verified: true },
    ],
    trend: +6,
  },
  {
    id: "w6", name: "Jonas W.", fullName: "Jonas Weber",
    talent: "Musiker & Produzent", location: "München",
    img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
    recommendations: 7, bookings: 12, followers: 89,
    verified: false, memberSince: "Mai 2024",
    empfehlungen: [
      { name: "Mia T.", text: "Super Unterricht! Jonas erklärt alles sehr verständlich.", datum: "Apr 2026", avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=60&h=60&fit=crop", verified: true },
    ],
    trend: +2,
  },
];

function VerifiedBadge({ level, size = "sm" }) {
  const badge = getBadge(level);
  const isLarge = size === "lg";
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: isLarge ? 6 : 4,
      background: badge.bg, borderRadius: 99,
      padding: isLarge ? "5px 12px" : "3px 8px",
    }}>
      <span style={{ fontSize: isLarge ? 14 : 11 }}>{badge.icon}</span>
      <span style={{ fontSize: isLarge ? 13 : 10, fontWeight: 700, color: badge.color }}>{badge.label}</span>
      {level >= 5 && <BadgeCheck size={isLarge ? 14 : 11} color={badge.color} />}
    </div>
  );
}

function WirkerDetailSheet({ wirker, onClose, onViewProfile }) {
  const badge = getBadge(wirker.recommendations);
  const nextBadge = BADGE_LEVELS.find(b => b.min > wirker.recommendations);
  const progress = nextBadge
    ? ((wirker.recommendations - badge.min) / (nextBadge.min - badge.min)) * 100
    : 100;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 800, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-end" }}>
      <div style={{ background: "white", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 430, margin: "0 auto", maxHeight: "90vh", overflowY: "auto" }}>
        {/* Header */}
        <div style={{ position: "relative", padding: "24px 20px 16px" }}>
          <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "#f0f0ee", border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <span style={{ fontSize: 18, lineHeight: 1, color: "#888" }}>×</span>
          </button>
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <img src={wirker.img} style={{ width: 68, height: 68, borderRadius: "50%", objectFit: "cover", border: `3px solid ${badge.color}` }} alt={wirker.name} />
              {wirker.verified && (
                <div style={{ position: "absolute", bottom: 0, right: 0, background: TEAL, borderRadius: "50%", width: 20, height: 20, border: "2px solid white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <BadgeCheck size={12} color="white" />
                </div>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 18, color: "#222", marginBottom: 2 }}>{wirker.fullName}</div>
              <div style={{ fontSize: 13, color: TEAL, fontWeight: 600, marginBottom: 6 }}>{wirker.talent} · {wirker.location}</div>
              <VerifiedBadge level={wirker.recommendations} size="lg" />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", margin: "0 20px 16px", background: "#f9f9f7", borderRadius: 16, overflow: "hidden" }}>
          {[
            { val: wirker.recommendations, label: "Empfehlungen", icon: "👍", color: TEAL },
            { val: wirker.bookings, label: "Buchungen", icon: "📅", color: CORAL },
            { val: wirker.followers, label: "Follower", icon: "👥", color: GOLD },
          ].map(({ val, label, icon, color }, i) => (
            <div key={label} style={{ flex: 1, padding: "14px 8px", textAlign: "center", borderRight: i < 2 ? "1px solid #eee" : "none" }}>
              <div style={{ fontSize: 16, marginBottom: 4 }}>{icon}</div>
              <div style={{ fontWeight: 900, fontSize: 18, color }}>{val}</div>
              <div style={{ fontSize: 10, color: "#aaa", marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Badge Progress */}
        <div style={{ margin: "0 20px 20px", background: `${badge.color}0d`, border: `1px solid ${badge.color}25`, borderRadius: 14, padding: "14px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#333" }}>Badge-Fortschritt</div>
            {nextBadge && (
              <div style={{ fontSize: 11, color: "#aaa" }}>Nächstes: {nextBadge.icon} {nextBadge.label}</div>
            )}
          </div>
          <div style={{ background: "#e8e8e8", borderRadius: 99, height: 7, overflow: "hidden", marginBottom: 8 }}>
            <div style={{ background: `linear-gradient(90deg, ${badge.color}, ${badge.color}aa)`, height: "100%", borderRadius: 99, width: `${Math.min(progress, 100)}%`, transition: "width 0.6s ease" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#aaa" }}>
            <span>{badge.icon} {badge.label} ({badge.min}+)</span>
            {nextBadge && <span>{nextBadge.min - wirker.recommendations} weitere bis {nextBadge.label}</span>}
            {!nextBadge && <span style={{ color: PURPLE, fontWeight: 700 }}>👑 Maximaler Badge!</span>}
          </div>
        </div>

        {/* Empfehlungen */}
        <div style={{ padding: "0 20px 28px" }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#222", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            👍 Verifizierte Empfehlungen
            <span style={{ background: `${TEAL}15`, color: TEAL, borderRadius: 20, padding: "2px 9px", fontSize: 12 }}>{wirker.recommendations}</span>
          </div>
          {wirker.empfehlungen.map((e, i) => (
            <div key={i} style={{ background: "#f9f9f7", borderRadius: 14, padding: "12px 14px", marginBottom: 10 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6 }}>
                <img src={e.avatar} style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }} alt={e.name} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 12, color: "#222" }}>{e.name}</div>
                  <div style={{ fontSize: 10, color: "#bbb" }}>{e.datum}</div>
                </div>
                {e.verified && (
                  <div style={{ background: `${TEAL}15`, borderRadius: 99, padding: "3px 8px", fontSize: 10, fontWeight: 700, color: TEAL, display: "flex", alignItems: "center", gap: 3 }}>
                    <BadgeCheck size={10} color={TEAL} /> Verifiziert
                  </div>
                )}
              </div>
              <div style={{ fontSize: 13, color: "#555", lineHeight: 1.6, fontStyle: "italic" }}>"{e.text}"</div>
            </div>
          ))}
          <button onClick={onViewProfile} style={{ width: "100%", background: `linear-gradient(135deg, ${CORAL}, ${GOLD})`, color: "white", border: "none", borderRadius: 14, padding: "13px", fontWeight: 700, fontSize: 15, cursor: "pointer", marginTop: 4 }}>
            Vollständiges Profil ansehen →
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WirkerVerifizierungDashboard({ onClose, onViewWirker }) {
  const [wirkerList, setWirkerList] = useState(mockWirkerData);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("alle"); // alle | verified | top | aufsteigend
  const [selectedWirker, setSelectedWirker] = useState(null);
  const [activeTab, setActiveTab] = useState("rangliste"); // rangliste | badges | trending

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await HuiWirker.list().catch(() => []);
        if (data && data.length > 0) {
          const mapped = data.map(w => ({
            id: w.id,
            name: w.name || w.full_name || "",
            fullName: w.full_name || w.name || "",
            talent: w.talent || "",
            location: w.location || "",
            img: w.img || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
            recommendations: w.recommendations || 0,
            bookings: w.bookings || 0,
            followers: w.followers || 0,
            verified: w.verified || false,
            memberSince: "2024",
            empfehlungen: [],
            trend: Math.floor(Math.random() * 15),
          }));
          setWirkerList([...mapped, ...mockWirkerData].filter((w, i, arr) => arr.findIndex(x => x.name === w.name) === i));
        }
      } catch(e) { console.error("[WirkerVerifizierung]", e?.message || e); }
      setLoading(false);
    }
    load();
  }, []);

  const filtered = wirkerList
    .filter(w => {
      if (search && !w.name.toLowerCase().includes(search.toLowerCase()) && !w.talent.toLowerCase().includes(search.toLowerCase())) return false;
      if (filter === "verified") return w.verified;
      if (filter === "top") return w.recommendations >= 30;
      return true;
    })
    .sort((a, b) => {
      if (filter === "aufsteigend") return a.recommendations - b.recommendations;
      return b.recommendations - a.recommendations;
    });

  // Badge-Verteilung berechnen
  const badgeCounts = BADGE_LEVELS.map(b => ({
    ...b,
    count: wirkerList.filter(w => w.recommendations >= b.min && w.recommendations <= b.max).length,
  }));

  // Trending (höchster Trend)
  const trending = [...wirkerList].sort((a, b) => (b.trend || 0) - (a.trend || 0)).slice(0, 5);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "#f7f7f5", display: "flex", flexDirection: "column", maxWidth: 430, margin: "0 auto", fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* Header */}
      <div style={{ background: "white", padding: "16px 16px 0", boxShadow: "0 1px 6px rgba(0,0,0,0.06)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <ArrowLeft size={20} color="#444" />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: "#222" }}>Wirker-Verifizierung</div>
            <div style={{ fontSize: 12, color: "#aaa" }}>{wirkerList.filter(w => w.verified).length} verifizierte Talente</div>
          </div>
          <div style={{ background: `${TEAL}15`, borderRadius: 12, padding: "6px 12px", display: "flex", alignItems: "center", gap: 5 }}>
            <Shield size={13} color={TEAL} />
            <span style={{ fontSize: 12, fontWeight: 700, color: TEAL }}>Live</span>
          </div>
        </div>

        {/* Quick Stats */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {[
            { val: wirkerList.length, label: "Wirker", icon: "👥", color: "#222" },
            { val: wirkerList.filter(w => w.verified).length, label: "Verifiziert", icon: "✓", color: TEAL },
            { val: wirkerList.reduce((s, w) => s + w.recommendations, 0), label: "Empfehlungen", icon: "👍", color: CORAL },
          ].map(({ val, label, icon, color }) => (
            <div key={label} style={{ flex: 1, background: "#f9f9f7", borderRadius: 12, padding: "10px 8px", textAlign: "center" }}>
              <div style={{ fontWeight: 900, fontSize: 16, color }}>{val}</div>
              <div style={{ fontSize: 10, color: "#aaa", marginTop: 1 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex" }}>
          {[["rangliste", "🏆 Rangliste"], ["badges", "🎖 Badges"], ["trending", "📈 Trending"]].map(([id, label]) => (
            <button key={id} onClick={() => setActiveTab(id)}
              style={{ flex: 1, background: "none", border: "none", borderBottom: activeTab === id ? `2.5px solid ${CORAL}` : "2.5px solid transparent", padding: "9px 4px 11px", fontWeight: activeTab === id ? 700 : 500, fontSize: 12, color: activeTab === id ? CORAL : "#aaa", cursor: "pointer" }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px 80px" }}>

        {/* ── RANGLISTE ── */}
        {activeTab === "rangliste" && (
          <>
            {/* Suche + Filter */}
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <div style={{ flex: 1, background: "white", borderRadius: 10, padding: "8px 12px", display: "flex", gap: 8, alignItems: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                <Search size={14} color="#aaa" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Name oder Talent…" style={{ border: "none", outline: "none", flex: 1, fontSize: 13, color: "#222", background: "transparent" }} />
              </div>
              <select value={filter} onChange={e => setFilter(e.target.value)} style={{ background: "white", border: "1px solid #eee", borderRadius: 10, padding: "8px 10px", fontSize: 12, color: "#555", outline: "none", cursor: "pointer" }}>
                <option value="alle">Alle</option>
                <option value="verified">✓ Verifiziert</option>
                <option value="top">🏆 Top (30+)</option>
                <option value="aufsteigend">↑ Aufsteigend</option>
              </select>
            </div>

            {loading ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#aaa" }}>Lade Wirker…</div>
            ) : filtered.map((w, i) => {
              const badge = getBadge(w.recommendations);
              const rank = filter === "aufsteigend" ? filtered.length - i : i + 1;
              return (
                <div key={w.id} onClick={() => setSelectedWirker(w)}
                  style={{ background: "white", borderRadius: 16, padding: "14px 16px", marginBottom: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", cursor: "pointer", display: "flex", gap: 12, alignItems: "center", border: i === 0 && filter !== "aufsteigend" ? `2px solid ${GOLD}40` : "2px solid transparent" }}>
                  {/* Rang */}
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: i === 0 ? GOLD : i === 1 ? "#c0c0c0" : i === 2 ? "#cd7f32" : "#f0f0ee", display: "flex", alignItems: "center", justifyContent: "center", fontSize: i < 3 ? 13 : 11, fontWeight: 800, color: i < 3 ? "white" : "#aaa", flexShrink: 0 }}>
                    {i < 3 ? ["🥇","🥈","🥉"][i] : `#${rank}`}
                  </div>
                  {/* Avatar */}
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <img src={w.img} style={{ width: 46, height: 46, borderRadius: "50%", objectFit: "cover", border: `2.5px solid ${badge.color}` }} alt={w.name} />
                    {w.verified && (
                      <div style={{ position: "absolute", bottom: -1, right: -1, background: TEAL, borderRadius: "50%", width: 14, height: 14, border: "1.5px solid white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <BadgeCheck size={9} color="white" />
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#222", marginBottom: 2 }}>{w.name}</div>
                    <div style={{ fontSize: 11, color: TEAL, fontWeight: 600, marginBottom: 4 }}>{w.talent}</div>
                    <VerifiedBadge level={w.recommendations} />
                  </div>
                  {/* Empfehlungen */}
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontWeight: 900, fontSize: 18, color: badge.color }}>{w.recommendations}</div>
                    <div style={{ fontSize: 10, color: "#aaa" }}>Empf.</div>
                    {w.trend > 0 && (
                      <div style={{ fontSize: 10, color: "#10b981", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 2, marginTop: 2 }}>
                        <TrendingUp size={10} color="#10b981" /> +{w.trend}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* ── BADGES ── */}
        {activeTab === "badges" && (
          <>
            <div style={{ background: `${TEAL}0d`, borderRadius: 14, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "#555", lineHeight: 1.65, border: `1px solid ${TEAL}20` }}>
              🏅 <strong>Verified Badges</strong> werden automatisch vergeben, basierend auf der Anzahl der verifizierten Empfehlungen. Jede Empfehlung wird erst nach Abschluss einer echten Buchung freigeschaltet.
            </div>

            {BADGE_LEVELS.map((b, i) => {
              const count = badgeCounts[i].count;
              const wirkerInBadge = wirkerList.filter(w => w.recommendations >= b.min && w.recommendations <= b.max);
              return (
                <div key={b.label} style={{ background: "white", borderRadius: 16, overflow: "hidden", marginBottom: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                  <div style={{ background: b.bg, padding: "14px 16px", display: "flex", gap: 12, alignItems: "center", borderBottom: `1px solid ${b.color}20` }}>
                    <div style={{ fontSize: 32 }}>{b.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: 15, color: b.color }}>{b.label}</div>
                      <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{b.desc}</div>
                    </div>
                    <div>
                      <div style={{ background: b.color, color: "white", borderRadius: 99, padding: "3px 10px", fontSize: 12, fontWeight: 700, textAlign: "center" }}>
                        {b.min}{b.max < 999 ? `–${b.max}` : "+"} Empf.
                      </div>
                      <div style={{ fontSize: 11, color: "#aaa", textAlign: "center", marginTop: 4 }}>{count} Wirker</div>
                    </div>
                  </div>
                  {wirkerInBadge.length > 0 && (
                    <div style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: -6, flexWrap: "wrap", gap: 8 }}>
                        {wirkerInBadge.slice(0, 6).map((w, j) => (
                          <div key={j} onClick={() => setSelectedWirker(w)} style={{ display: "flex", alignItems: "center", gap: 6, background: "#f9f9f7", borderRadius: 99, padding: "4px 10px 4px 4px", cursor: "pointer" }}>
                            <img src={w.img} style={{ width: 22, height: 22, borderRadius: "50%", objectFit: "cover" }} alt={w.name} />
                            <span style={{ fontSize: 11, fontWeight: 600, color: "#444" }}>{w.name}</span>
                          </div>
                        ))}
                        {wirkerInBadge.length > 6 && (
                          <div style={{ background: "#f0f0ee", borderRadius: 99, padding: "4px 12px", fontSize: 11, color: "#888" }}>+{wirkerInBadge.length - 6}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}

        {/* ── TRENDING ── */}
        {activeTab === "trending" && (
          <>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#333", marginBottom: 12 }}>📈 Meiste neue Empfehlungen diesen Monat</div>
            {trending.map((w, i) => {
              const badge = getBadge(w.recommendations);
              return (
                <div key={w.id} onClick={() => setSelectedWirker(w)}
                  style={{ background: "white", borderRadius: 16, padding: "14px 16px", marginBottom: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", cursor: "pointer", display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: i === 0 ? `linear-gradient(135deg, ${CORAL}, ${GOLD})` : "#f0f0ee", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: i === 0 ? "white" : "#aaa", flexShrink: 0 }}>
                    {i === 0 ? "🔥" : `#${i + 1}`}
                  </div>
                  <img src={w.img} style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: `2px solid ${badge.color}`, flexShrink: 0 }} alt={w.name} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#222" }}>{w.name}</div>
                    <div style={{ fontSize: 11, color: TEAL, fontWeight: 600 }}>{w.talent}</div>
                    <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>{w.recommendations} Empfehlungen gesamt</div>
                  </div>
                  <div style={{ background: "#e8faf6", borderRadius: 99, padding: "5px 12px", display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                    <TrendingUp size={13} color="#10b981" />
                    <span style={{ fontWeight: 800, fontSize: 14, color: "#10b981" }}>+{w.trend}</span>
                  </div>
                </div>
              );
            })}

            {/* Info-Box */}
            <div style={{ background: `${GOLD}0d`, border: `1px solid ${GOLD}25`, borderRadius: 14, padding: "14px 16px", marginTop: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#333", marginBottom: 6 }}>Wie werden Empfehlungen verifiziert?</div>
              <div style={{ fontSize: 12, color: "#666", lineHeight: 1.7 }}>
                ✓ Nur echte Buchungen & Käufe zählen<br />
                ✓ Empfehlung erst nach Treuhand-Freigabe<br />
                ✓ Jeder Nutzer kann nur einmal pro Buchung empfehlen<br />
                ✓ HUI prüft verdächtige Aktivitäten
              </div>
            </div>
          </>
        )}
      </div>

      {/* Detail Sheet */}
      {selectedWirker && (
        <WirkerDetailSheet
          wirker={selectedWirker}
          onClose={() => setSelectedWirker(null)}
          onViewProfile={() => { onViewWirker && onViewWirker(selectedWirker.name); setSelectedWirker(null); onClose(); }}
        />
      )}
    </div>
  );
}