// ExperienceDetailPage.jsx — Official Experience Detail
// Route: /experience/:id
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { ProfileService } from "../services/db";
import { useAuth } from "../lib/AuthContext";
import { HUI } from "../design/hui.design.js";
import ExperienceWizard from "./experiences/ExperienceWizard.jsx";
import {
  EXPERIENCE_DETAIL_SELECT,
  getExperienceImages,
  formatExperiencePrice,
  formatExperienceDate,
  getParticipantInfo,
  getExperienceTypeLabel,
  canBookExperience,
  buildExperienceCartItem,
} from "../lib/experienceDetailUtils.js";

const C = {
  teal: HUI.COLOR.teal,
  tealPale: HUI.COLOR.tealPale,
  coral: HUI.COLOR.coral,
  warm: HUI.COLOR.cream,
  card: "#FFFFFF",
  ink: HUI.COLOR.ink,
  ink2: HUI.COLOR.ink2,
  muted: "#888",
  border: "rgba(0,0,0,0.07)",
};

const CSS = `
  @keyframes edFadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes edSkel { 0%,100%{opacity:1} 50%{opacity:0.45} }
  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  .ed-tap:active { opacity: 0.72; }
`;

function Skel({ w = "100%", h = 16, r = 8, mb = 0 }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r, marginBottom: mb,
      background: "#EBEBEB", animation: "edSkel 1.4s ease-in-out infinite",
    }} />
  );
}

function DetailSkeleton() {
  return (
    <div style={{ minHeight: "100vh", background: C.warm }}>
      <style>{CSS}</style>
      <div style={{
        width: "100%", height: "42vh",
        background: "linear-gradient(135deg,#e8e8e8,#f0f0f0)",
        animation: "edSkel 1.4s ease-in-out infinite",
      }} />
      <div style={{ padding: "24px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
        <Skel h={10} w="35%" />
        <Skel h={28} w="90%" />
        <Skel h={14} w="50%" />
        <div style={{ height: 1, background: C.border, margin: "8px 0" }} />
        <Skel h={13} w="100%" />
        <Skel h={13} w="88%" />
      </div>
    </div>
  );
}

function EmptyBlock({ icon, title, text }) {
  return (
    <div style={{
      padding: "20px 18px", borderRadius: 16,
      background: "rgba(14,196,184,0.04)",
      border: "1px dashed rgba(14,196,184,0.22)",
      textAlign: "center",
    }}>
      <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.45 }}>{icon}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.5 }}>{text}</div>
    </div>
  );
}

function Avatar({ url, name, size = 44 }) {
  const initials = (name || "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  if (url) {
    return (
      <img src={url} alt={name} style={{
        width: size, height: size, borderRadius: "50%",
        objectFit: "cover", border: "2px solid white",
        boxShadow: "0 2px 10px rgba(0,0,0,0.12)", flexShrink: 0,
      }} />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "linear-gradient(135deg,#16D7C5,#FF8A6B)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.34, fontWeight: 900, color: "white",
      border: "2px solid white", flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

function ImageGallery({ images, title }) {
  const [idx, setIdx] = useState(0);
  const img = images[idx];

  if (images.length === 0) {
    return (
      <div style={{
        width: "100%", height: "clamp(240px, 38vh, 420px)",
        background: "linear-gradient(145deg,#E6FAF8 0%,#FFF5F0 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column", gap: 10,
      }}>
        <div style={{ fontSize: 48, opacity: 0.3 }}>🎟</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.muted }}>Noch keine Bilder</div>
        <div style={{ fontSize: 12.5, color: C.muted, opacity: 0.8, maxWidth: 240, textAlign: "center", lineHeight: 1.5 }}>
          Der Veranstalter hat noch keine Visuals hochgeladen.
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: "relative", width: "100%",
      height: "clamp(240px, 38vh, 420px)", overflow: "hidden", background: "#111",
    }}>
      <img
        key={img}
        src={img}
        alt={title || "Erlebnis"}
        style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.9)" }}
      />
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "linear-gradient(to bottom, rgba(0,0,0,0.18) 0%, transparent 40%, rgba(0,0,0,0.55) 100%)",
      }} />
      {images.length > 1 && (
        <div style={{
          position: "absolute", bottom: 14, left: "50%", transform: "translateX(-50%)",
          display: "flex", gap: 5,
        }}>
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIdx(i)}
              style={{
                width: i === idx ? 18 : 6, height: 6, borderRadius: 3, border: "none",
                background: i === idx ? "white" : "rgba(255,255,255,0.45)",
                cursor: "pointer", padding: 0,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ExperienceDetailPage({ onBookExperience, onViewCreator }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [experience, setExperience] = useState(null);
  const [creator, setCreator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showWizard, setShowWizard] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const { data: exp, error: expErr } = await supabase
        .from("experiences")
        .select(EXPERIENCE_DETAIL_SELECT)
        .eq("id", id)
        .single();

      if (expErr || !exp) throw new Error("Erlebnis nicht gefunden");

      const isOwner = !!user?.id && user.id === exp.user_id;
      const isPublic = exp.status === "published" && (!exp.approval_status || exp.approval_status === "approved");

      if (!isOwner && !isPublic) throw new Error("Dieses Erlebnis ist nicht verfügbar");

      setExperience(exp);

      if (exp.user_id) {
        const profile = await ProfileService.getById(exp.user_id).catch(() => null);
        setCreator(profile);
      }
    } catch (e) {
      setError(e.message || "Fehler beim Laden");
    } finally {
      setLoading(false);
    }
  }, [id, user?.id]);

  useEffect(() => { load(); }, [load]);

  const isOwner = !!user?.id && !!experience?.user_id && user.id === experience.user_id;
  const images = getExperienceImages(experience);
  const priceStr = formatExperiencePrice(experience);
  const dateStr = formatExperienceDate(experience);
  const participant = getParticipantInfo(experience);
  const typeLabel = getExperienceTypeLabel(experience);
  const bookable = canBookExperience(experience, isOwner);

  const handleBook = () => {
    const cartItem = buildExperienceCartItem(experience, creator);
    if (!cartItem) return;
    if (onBookExperience) {
      onBookExperience(cartItem);
    } else {
      navigate("/Home", { state: { pendingExperienceCart: cartItem } });
    }
  };

  const handleCreator = () => {
    const creatorId = creator?.id || experience?.user_id;
    if (!creatorId) return;
    if (onViewCreator) {
      onViewCreator(creator);
    } else if (creator?.username) {
      navigate(`/profile/${creator.username}`);
    } else {
      navigate(`/profile/${creatorId}`);
    }
  };

  if (loading) return <DetailSkeleton />;

  if (error || !experience) {
    return (
      <div style={{
        minHeight: "100vh", background: C.warm,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 32, fontFamily: "inherit",
      }}>
        <style>{CSS}</style>
        <div style={{ textAlign: "center", maxWidth: 320 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🎟</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.ink, marginBottom: 8 }}>
            {error || "Erlebnis nicht gefunden"}
          </div>
          <button
            type="button"
            className="ed-tap"
            onClick={() => navigate(-1)}
            style={{
              marginTop: 16, padding: "12px 24px", borderRadius: 14, border: "none",
              background: C.teal, color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer",
            }}
          >
            Zurück
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", background: C.warm, paddingBottom: 100,
      animation: "edFadeUp 0.35s both", fontFamily: "inherit",
    }}>
      <style>{CSS}</style>

      {/* Top bar */}
      <div style={{
        position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 680, zIndex: 200,
        padding: "max(12px, env(safe-area-inset-top, 12px)) 16px 8px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        pointerEvents: "none",
      }}>
        <button
          type="button"
          className="ed-tap"
          onClick={() => navigate(-1)}
          style={{
            pointerEvents: "auto", width: 40, height: 40, borderRadius: "50%",
            background: "rgba(255,255,255,0.92)", border: "none",
            boxShadow: "0 2px 12px rgba(0,0,0,0.12)", cursor: "pointer", fontSize: 18,
          }}
        >
          ‹
        </button>
        {isOwner && (
          <button
            type="button"
            className="ed-tap"
            onClick={() => setShowWizard(true)}
            style={{
              pointerEvents: "auto", padding: "8px 14px", borderRadius: 99,
              background: "rgba(255,255,255,0.92)", border: "none",
              boxShadow: "0 2px 12px rgba(0,0,0,0.12)", cursor: "pointer",
              fontSize: 13, fontWeight: 700, color: C.teal,
            }}
          >
            Bearbeiten
          </button>
        )}
      </div>

      <ImageGallery images={images} title={experience.title} />

      <div style={{ padding: "20px 20px 0", maxWidth: 680, margin: "0 auto" }}>
        {/* Badge row */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
          <span style={{
            fontSize: 10.5, fontWeight: 700, color: C.teal,
            background: "rgba(13,196,181,0.10)", border: "1px solid rgba(13,196,181,0.22)",
            borderRadius: 99, padding: "3px 10px",
          }}>
            ERLEBNIS
          </span>
          {typeLabel && (
            <span style={{
              fontSize: 10.5, fontWeight: 600, color: C.coral,
              background: "rgba(244,115,85,0.08)", borderRadius: 99, padding: "3px 10px",
            }}>
              {typeLabel}
            </span>
          )}
        </div>

        <h1 style={{
          margin: "0 0 12px", fontSize: 26, fontWeight: 900, color: C.ink,
          letterSpacing: "-0.03em", lineHeight: 1.2,
        }}>
          {experience.title || "Erlebnis"}
        </h1>

        {/* Organizer */}
        <button
          type="button"
          className="ed-tap"
          onClick={handleCreator}
          style={{
            display: "flex", alignItems: "center", gap: 12, width: "100%",
            padding: "12px 14px", marginBottom: 16, borderRadius: 16,
            background: C.card, border: `1px solid ${C.border}`,
            cursor: "pointer", textAlign: "left", fontFamily: "inherit",
          }}
        >
          <Avatar
            url={creator?.avatar_url}
            name={creator?.display_name || creator?.username}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: C.muted, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 2 }}>
              Veranstalter
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>
              {creator?.display_name || creator?.username || "Creator"}
            </div>
            {creator?.talent && (
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{creator.talent}</div>
            )}
          </div>
          <span style={{ color: C.muted, fontSize: 18 }}>›</span>
        </button>

        {/* Meta grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          <div style={{ padding: "14px 16px", background: C.card, borderRadius: 16, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: C.muted, letterSpacing: 1.1, textTransform: "uppercase", marginBottom: 6 }}>
              Datum
            </div>
            {dateStr ? (
              <div style={{ fontSize: 13.5, fontWeight: 600, color: C.ink, lineHeight: 1.45 }}>{dateStr}</div>
            ) : (
              <div style={{ fontSize: 12.5, color: C.muted, fontStyle: "italic" }}>Termin folgt</div>
            )}
          </div>

          <div style={{ padding: "14px 16px", background: C.card, borderRadius: 16, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: C.muted, letterSpacing: 1.1, textTransform: "uppercase", marginBottom: 6 }}>
              Ort
            </div>
            {experience.location_text ? (
              <div style={{ fontSize: 13.5, fontWeight: 600, color: C.ink, lineHeight: 1.45 }}>
                {experience.format === "online" ? "Online" : experience.location_text}
              </div>
            ) : (
              <div style={{ fontSize: 12.5, color: C.muted, fontStyle: "italic" }}>
                {experience.format === "online" ? "Online" : "Ort wird bekannt gegeben"}
              </div>
            )}
          </div>

          <div style={{ padding: "14px 16px", background: C.card, borderRadius: 16, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: C.muted, letterSpacing: 1.1, textTransform: "uppercase", marginBottom: 6 }}>
              Preis
            </div>
            {priceStr ? (
              <div style={{ fontSize: 15, fontWeight: 800, color: C.teal }}>{priceStr}</div>
            ) : (
              <div style={{ fontSize: 12.5, color: C.muted, fontStyle: "italic" }}>Preis auf Anfrage</div>
            )}
          </div>

          <div style={{ padding: "14px 16px", background: C.card, borderRadius: 16, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: C.muted, letterSpacing: 1.1, textTransform: "uppercase", marginBottom: 6 }}>
              Teilnahme
            </div>
            {participant ? (
              <div style={{ fontSize: 13.5, fontWeight: 600, color: C.ink }}>{participant.label}</div>
            ) : (
              <div style={{ fontSize: 12.5, color: C.muted, fontStyle: "italic" }}>Offen für alle</div>
            )}
          </div>
        </div>

        {/* Description */}
        <div style={{ marginBottom: 16 }}>
          <div style={{
            fontSize: 11, fontWeight: 800, color: C.muted,
            letterSpacing: 1.3, textTransform: "uppercase", marginBottom: 10,
          }}>
            Beschreibung
          </div>
          {experience.description || experience.caption ? (
            <div style={{
              padding: "18px", background: C.card, borderRadius: 18,
              border: `1px solid ${C.border}`,
            }}>
              <p style={{
                margin: 0, fontSize: 14.5, color: C.ink2,
                lineHeight: 1.75, whiteSpace: "pre-wrap",
              }}>
                {experience.description || experience.caption}
              </p>
            </div>
          ) : (
            <EmptyBlock
              icon="📝"
              title="Noch keine Beschreibung"
              text="Der Veranstalter hat noch keine Details zu diesem Erlebnis ergänzt."
            />
          )}
        </div>
      </div>

      {/* Sticky booking bar */}
      {!isOwner && (
        <div style={{
          position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
          width: "100%", maxWidth: 680,
          padding: "12px 20px", paddingBottom: "max(12px, env(safe-area-inset-bottom, 12px))",
          background: "rgba(249,247,244,0.96)", backdropFilter: "blur(16px)",
          borderTop: `1px solid ${C.border}`, zIndex: 150,
        }}>
          {bookable ? (
            <button
              type="button"
              className="ed-tap"
              onClick={handleBook}
              style={{
                width: "100%", padding: "15px", border: "none", borderRadius: 16,
                background: `linear-gradient(135deg, ${C.teal}, #09A89A)`,
                color: "white", fontSize: 15, fontWeight: 800, cursor: "pointer",
                boxShadow: "0 4px 18px rgba(13,196,181,0.30)",
              }}
            >
              {priceStr && priceStr !== "Kostenlos" && priceStr !== "Auf Anfrage"
                ? `${priceStr} · Jetzt buchen`
                : "Jetzt buchen ✦"}
            </button>
          ) : experience.pricing_type === "inquiry" ? (
            <button
              type="button"
              className="ed-tap"
              onClick={handleCreator}
              style={{
                width: "100%", padding: "15px", border: `1.5px solid ${C.teal}55`,
                borderRadius: 16, background: "none",
                color: C.teal, fontSize: 14, fontWeight: 700, cursor: "pointer",
              }}
            >
              Veranstalter kontaktieren
            </button>
          ) : null}
        </div>
      )}

      {showWizard && isOwner && (
        <ExperienceWizard
          userId={user.id}
          existingExp={experience}
          onClose={() => setShowWizard(false)}
          onSaved={() => {
            setShowWizard(false);
            load();
          }}
        />
      )}
    </div>
  );
}
