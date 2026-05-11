// ProfilePage.jsx — Öffentliches Nutzerprofil
// Route: /profile/:username
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

const C = {
  teal: "#16D7C5", teal2: "#11C5B7", tealPale: "#E6FAF8",
  coral: "#FF8A6B", coralPale: "#FFF2EE",
  gold: "#F5A623",
  warm: "#F9F7F4", card: "#FFFFFF",
  ink: "#1A1A1A", ink2: "#3A3A3A",
  muted: "#888", border: "rgba(0,0,0,0.07)",
};

function Avatar({ url, name, size = 80 }) {
  const initials = (name || "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  if (url) return (
    <img src={url} alt={name}
      style={{ width: size, height: size, borderRadius: "50%",
        objectFit: "cover", border: "3px solid white",
        boxShadow: "0 4px 20px rgba(0,0,0,0.12)" }} />
  );
  return (
    <div style={{ width: size, height: size, borderRadius: "50%",
      background: `linear-gradient(135deg, ${C.teal}, ${C.coral})`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.32, fontWeight: 900, color: "white",
      border: "3px solid white", boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
      letterSpacing: -1 }}>
      {initials}
    </div>
  );
}

function WerkGridCard({ werk, onClick }) {
  const imgUrl = werk.cover_url
    || (Array.isArray(werk.images) && werk.images[0])
    || null;
  return (
    <div onClick={() => onClick?.(werk)}
      style={{ borderRadius: 14, overflow: "hidden", cursor: "pointer",
        background: C.card, boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
        border: `1px solid ${C.border}`, aspectRatio: "1",
        position: "relative" }}>
      {imgUrl ? (
        <img src={imgUrl} alt={werk.title}
          style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <div style={{ width: "100%", height: "100%",
          background: `linear-gradient(135deg, ${C.tealPale}, ${C.coralPale})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexDirection: "column", gap: 6 }}>
          <ShoppingBag size={28} color={C.teal} opacity={0.5} />
          <span style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>
            {werk.category || "Werk"}
          </span>
        </div>
      )}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0,
        background: "linear-gradient(transparent, rgba(0,0,0,0.65))",
        padding: "20px 10px 8px" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "white",
          lineHeight: 1.3, marginBottom: 2 }}>
          {werk.title}
        </div>
        {werk.price != null && (
          <div style={{ fontSize: 12, fontWeight: 800, color: C.gold }}>
            € {Number(werk.price).toFixed(0)}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProfilePage({ onBack, onBuyWerk }) {
  const navigate = useNavigate();
  const { username } = useParams();
  const user = null;

  const [profile, setProfile] = useState(null);
  const [werke,   setWerke]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const isOwnProfile = user && profile && user.id === profile.id;

  useEffect(() => {
    if (!username) return;
    loadProfile();
  }, [username]);

  async function loadProfile() {
    setLoading(true);
    setError(null);
    try {
      // 1. Profil laden
      const { data: prof, error: profErr } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, bio, is_wirker, role")
        .eq("username", username)
        .single();

      if (profErr || !prof) throw new Error("Profil nicht gefunden");
      setProfile(prof);

      // 2. Werke laden
      const { data: worksData, error: worksErr } = await supabase
        .from("works")
        .select("id, title, description, price, cover_url, images, category, created_at")
        .eq("user_id", prof.id)
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (!worksErr) setWerke(worksData || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const handleBack = () => {
    if (onBack) onBack();
    else navigate(-1);
  };

  // ── Loading ──────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: "100vh", background: C.warm,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexDirection: "column", gap: 14 }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%",
        border: `3px solid ${C.teal}30`, borderTop: `3px solid ${C.teal}`,
        animation: "spin 0.8s linear infinite" }} />
      <div style={{ fontSize: 13, color: C.muted }}>Profil lädt…</div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // ── Error ────────────────────────────────────────────────────────
  if (error) return (
    <div style={{ minHeight: "100vh", background: C.warm,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexDirection: "column", gap: 16, padding: 32 }}>
      <div style={{ fontSize: 48 }}>😕</div>
      <div style={{ fontWeight: 800, fontSize: 18, color: C.ink }}>
        Profil nicht gefunden
      </div>
      <div style={{ fontSize: 13, color: C.muted, textAlign: "center" }}>
        @{username} existiert nicht oder wurde entfernt.
      </div>
      <button onClick={handleBack}
        style={{ padding: "12px 24px", borderRadius: 12,
          background: C.teal, color: "white", border: "none",
          fontWeight: 700, cursor: "pointer", fontSize: 14 }}>
        Zurück
      </button>
    </div>
  );

  // ── Profile ──────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: C.warm,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif" }}>

      {/* Header */}
      <div style={{ position: "sticky", top: 0, zIndex: 100,
        background: "rgba(249,247,244,0.92)", backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${C.border}`,
        display: "flex", alignItems: "center",
        padding: "12px 16px", gap: 12,
        paddingTop: "max(12px, env(safe-area-inset-top, 12px))" }}>
        <button onClick={handleBack}
          style={{ width: 38, height: 38, borderRadius: "50%",
            background: "rgba(0,0,0,0.06)", border: "none",
            cursor: "pointer", display: "flex", alignItems: "center",
            justifyContent: "center", flexShrink: 0 }}>
          <ArrowLeft size={18} color={C.ink} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: C.ink,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {profile.display_name || profile.username}
          </div>
          <div style={{ fontSize: 12, color: C.muted }}>
            @{profile.username}
          </div>
        </div>
        {isOwnProfile && (
          <button onClick={() => navigate("/profile/edit")}
            style={{ padding: "8px 16px", borderRadius: 20,
              background: "none", border: `1.5px solid ${C.border}`,
              fontSize: 13, fontWeight: 600, color: C.ink,
              cursor: "pointer" }}>
            Bearbeiten
          </button>
        )}
      </div>

      {/* Profile Hero */}
      <div style={{ padding: "28px 20px 20px",
        borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start",
          marginBottom: 16 }}>
          <Avatar url={profile.avatar_url} name={profile.display_name} size={72} />
          <div style={{ flex: 1, paddingTop: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6,
              marginBottom: 4 }}>
              <span style={{ fontWeight: 900, fontSize: 20, color: C.ink,
                letterSpacing: -0.5 }}>
                {profile.display_name || profile.username}
              </span>
              {profile.is_wirker && (
                <BadgeCheck size={18} color={C.teal} />
              )}
            </div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 8 }}>
              @{profile.username}
            </div>
            <div style={{ display: "flex", gap: 16 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 800, fontSize: 17, color: C.ink }}>
                  {werke.length}
                </div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>Werke</div>
              </div>
            </div>
          </div>
        </div>

        {profile.bio && (
          <p style={{ fontSize: 14, color: C.ink2, lineHeight: 1.6,
            margin: 0, whiteSpace: "pre-wrap" }}>
            {profile.bio}
          </p>
        )}

        {profile.is_wirker && (
          <div style={{ marginTop: 12, display: "inline-flex",
            alignItems: "center", gap: 6,
            padding: "6px 12px", borderRadius: 20,
            background: C.tealPale, border: `1px solid ${C.teal}33` }}>
            <BadgeCheck size={13} color={C.teal} />
            <span style={{ fontSize: 12, fontWeight: 700, color: C.teal }}>
              Wirker
            </span>
          </div>
        )}
      </div>

      {/* Werke Grid */}
      <div style={{ padding: "20px 16px 40px" }}>
        {werke.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 24px",
            color: C.muted }}>
            <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.4 }}>🎨</div>
            <div style={{ fontWeight: 700, fontSize: 15, color: C.ink,
              marginBottom: 6 }}>
              Noch keine Werke
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.6 }}>
              {isOwnProfile
                ? "Teile dein erstes Werk mit der Community."
                : `${profile.display_name || profile.username} hat noch nichts veröffentlicht.`}
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8,
              marginBottom: 16 }}>
              <Grid size={15} color={C.muted} />
              <span style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>
                Werke
              </span>
              <span style={{ fontSize: 12, color: C.muted }}>
                ({werke.length})
              </span>
            </div>
            <div style={{ display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {werke.map(werk => (
                <WerkGridCard key={werk.id} werk={werk}
                  onClick={onBuyWerk} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
