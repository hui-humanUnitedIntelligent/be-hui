// sections/HeroSection.jsx
// Hero-Bild + Avatar + Name + Location + Actions
// REGEL: Pure presentational — kein State, kein Supabase

import React from "react";
import LazyImage from "../../../components/LazyImage";
import { PresenceBadge } from "../components/PresenceBadge";
import { ProfileActions } from "../components/ProfileActions";
import {
  formatDisplayName, formatTalent, formatLocation, formatAvatarUrl, formatHeroUrl,
} from "../utils/profileFormatters";

const C = {
  teal:    "#16D7C5",
  teal2:   "#11C5B7",
  coral:   "#FF8A6B",
  ink:     "#1A1A1A",
  ink2:    "#3A3A3A",
  muted:   "#888",
  cream:   "#F9F7F4",
};

/**
 * @param {{
 *   profile:        object,
 *   presenceInfo:   object|null,
 *   presenceStatus: string,
 *   isOwner:        boolean,
 *   followed:       boolean,
 *   followLoading:  boolean,
 *   bookable:       boolean,
 *   onHeroLoad:     fn,
 *   onFollow:       fn,
 *   onChat:         fn,
 *   onBook:         fn,
 *   onEdit:         fn,
 * }} props
 */
export function HeroSection({
  profile, presenceInfo, presenceStatus,
  isOwner, followed, followLoading, bookable,
  onHeroLoad, onFollow, onChat, onBook, onEdit,
}) {
  const name     = formatDisplayName(profile);
  const talent   = formatTalent(profile);
  const location = formatLocation(profile);
  const avatarUrl = formatAvatarUrl(profile, 1);
  const heroUrl   = formatHeroUrl(profile);

  return (
    <div>
      {/* ── Hero Image ─────────────────────────────────────────────── */}
      <div style={{
        position: "relative",
        height: 280,
        background: `linear-gradient(160deg, ${C.teal}22 0%, ${C.coral}11 100%)`,
        overflow: "hidden",
      }}>
        {heroUrl ? (
          <LazyImage
            src={heroUrl}
            alt={name}
            onLoad={onHeroLoad}
            style={{ width:"100%", height:"100%", objectFit:"cover" }}
          />
        ) : (
          <div style={{
            width:"100%", height:"100%",
            background:`linear-gradient(160deg, ${C.teal}33 0%, ${C.coral}22 100%)`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:56, opacity:0.4,
          }}>
            ✦
          </div>
        )}
        {/* Gradient Overlay */}
        <div style={{
          position:"absolute", inset:0,
          background:"linear-gradient(to bottom, rgba(0,0,0,0.0) 50%, rgba(0,0,0,0.35) 100%)",
          pointerEvents:"none",
        }}/>
      </div>

      {/* ── Avatar + Info ───────────────────────────────────────────── */}
      <div style={{ padding:"0 20px 8px", background:C.cream }}>
        {/* Avatar (überlappt Hero) */}
        <div style={{
          marginTop: -40,
          marginBottom: 12,
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            border: "3px solid #fff",
            overflow: "hidden",
            boxShadow: "0 4px 16px rgba(0,0,0,0.14)",
            background: C.cream,
          }}>
            <img
              src={avatarUrl}
              alt={name}
              style={{ width:"100%", height:"100%", objectFit:"cover" }}
              loading="eager"
            />
          </div>
        </div>

        {/* Name + Talent */}
        <h1 style={{
          margin:"0 0 2px",
          fontSize: 22, fontWeight: 900,
          color: C.ink, letterSpacing: -0.5,
          lineHeight: 1.2,
        }}>
          {name}
        </h1>

        <div style={{
          fontSize: 14, color: C.muted, fontWeight: 500,
          marginBottom: location ? 4 : 8,
        }}>
          {talent}
        </div>

        {location && (
          <div style={{
            fontSize: 13, color: C.muted,
            display: "flex", alignItems: "center", gap: 4,
            marginBottom: 8,
          }}>
            <span>📍</span>
            {location}
          </div>
        )}

        {/* Online-Status */}
        <PresenceBadge
          presenceInfo={presenceInfo}
          presenceStatus={presenceStatus}
        />
      </div>

      {/* ── Actions ─────────────────────────────────────────────────── */}
      {isOwner ? (
        <div style={{ padding:"8px 20px 16px" }}>
          <button
            onClick={onEdit}
            style={{
              width:"100%", height:42,
              borderRadius:14,
              background:`linear-gradient(135deg, ${C.teal} 0%, ${C.teal2} 100%)`,
              color:"#fff", border:"none",
              fontSize:14, fontWeight:700,
              cursor:"pointer",
              boxShadow:"0 4px 14px rgba(22,215,197,0.28)",
            }}
          >
            Profil bearbeiten
          </button>
        </div>
      ) : (
        <ProfileActions
          isOwner={false}
          followed={followed}
          followLoading={followLoading}
          bookable={bookable}
          onFollow={onFollow}
          onChat={onChat}
          onBook={onBook}
        />
      )}
    </div>
  );
}
