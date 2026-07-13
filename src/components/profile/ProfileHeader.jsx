// src/components/profile/ProfileHeader.jsx
// ══════════════════════════════════════════════════════════════════════
// UNIFIED PROFILE HEADER v3 — 2026-07-13
// Cover + Welle als EIN SVG-Container, Avatar mittig auf Welle
// ══════════════════════════════════════════════════════════════════════

import React, { useState, useRef, useCallback } from "react";
import {
  FB_COVER, FB_AVATAR,
  sv,
  handleAvatarUpload, handleCoverUpload,
} from "../../lib/profileMedia.js";

const FB_AVT = FB_AVATAR;

const T = {
  bg:       "#F7F5F0",
  ink:      "#1A1A18",
  inkSoft:  "#4A4A45",
  inkFaint: "#8C8C85",
  teal:     "#0EC4B8",
  tealDeep: "#0AADA3",
  purple:   "#845EC2",
  dark:     "#111224",
};

function Sk({ w, h, r = 8 }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r, flexShrink: 0,
      background: "linear-gradient(90deg,#ede9e2 25%,#f7f5f0 50%,#ede9e2 75%)",
      backgroundSize: "200% 100%",
      animation: "ph-shimmer 1.4s ease-in-out infinite",
    }} />
  );
}

function CameraIcon({ size = 14, color = "white" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  );
}

function Spinner({ size = 16, color = "white" }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      border: `2px solid ${color}33`, borderTopColor: color,
      animation: "ph-spin .7s linear infinite",
    }} />
  );
}

export function ProfileHeader({
  profile      = null,
  isOwner      = false,
  isTalent     = false,
  loading      = false,
  followCounts = { followers: 0, following: 0 },
  onEditAvatar = null,
  onEditCover  = null,
}) {
  const [coverLoaded,     setCoverLoaded]     = useState(false);
  const [avatarLoaded,    setAvatarLoaded]    = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [coverUploading,  setCoverUploading]  = useState(false);
  const [coverHover,      setCoverHover]      = useState(false);
  const [avatarHover,     setAvatarHover]     = useState(false);

  const avatarInputRef = useRef(null);
  const coverInputRef  = useRef(null);

  const cover    = sv(profile?.header_img, FB_COVER);
  const avatar   = sv(profile?.avatar_url, FB_AVT);
  const name     = sv(profile?.display_name || profile?.username, "–");
  const username = sv(profile?.username);
  const location = sv(profile?.location_final || profile?.location);
  const isTalentResolved = isTalent || profile?.is_talent === true;
  const isAmbassador = profile?.is_ambassador === true;

  const handleAvatarFile = useCallback((e) =>
    handleAvatarUpload({ event: e, profileId: profile?.id, onSuccess: onEditAvatar, setUploading: setAvatarUploading }),
  [profile?.id, onEditAvatar]);

  const handleCoverFile = useCallback((e) =>
    handleCoverUpload({ event: e, profileId: profile?.id, onSuccess: onEditCover, setUploading: setCoverUploading }),
  [profile?.id, onEditCover]);

  // SVG viewBox: 100 Einheiten breit, 60 hoch
  // Wellen-Kurve bei y=45: links oben, Mitte unten, rechts oben
  // Cover füllt y=0..45 (oben), Welle schneidet unten ein
  // Avatar-Mittelpunkt: x=50, y=45 (auf der Welle)
  const AVATAR_D = 96;

  return (
    <>
      <style>{`
        @keyframes ph-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes ph-spin { to { transform: rotate(360deg); } }
        @keyframes ph-pulse-ring {
          0%   { transform: scale(0.95); opacity: 0.6; }
          70%  { transform: scale(1.08); opacity: 0; }
          100% { transform: scale(0.95); opacity: 0; }
        }
        .ph-press { -webkit-tap-highlight-color: transparent; }
        .ph-press:active { opacity: 0.7; }
      `}</style>

      <input ref={coverInputRef}  type="file" accept="image/*" style={{ display:"none" }} onChange={handleCoverFile} />
      <input ref={avatarInputRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleAvatarFile} />

      {/* ════════════════════════════════════════════════════════
          HEADER-BLOCK: Cover + Welle + Avatar als Einheit
          Breite: 100%, Höhe: auto durch SVG viewBox
          SVG viewBox: 0 0 100 68
            - Cover: y=0..50 (Cover-Bild)
            - Welle: y≈42..50 (geschwungene Kurve)
            - Avatar: Mittelpunkt x=50 y=50 (auf der Welle)
            - Unterhalb der Welle: Hintergrundfarbe
          ════════════════════════════════════════════════════════ */}
      <div style={{ position:"relative", width:"100%", userSelect:"none" }}>

        {/* Haupt-SVG — definiert die gesamte Header-Höhe */}
        <svg
          viewBox="0 0 100 72"
          preserveAspectRatio="xMidYMid meet"
          style={{ display:"block", width:"100%", overflow:"visible" }}
          aria-hidden="true"
        >
          <defs>
            {/* Cover-Bild als Pattern — füllt den Cover-Bereich */}
            <pattern id="coverPat" patternUnits="userSpaceOnUse" x="0" y="0" width="100" height="50">
              <image
                href={(!loading && coverLoaded) ? cover : ""}
                x="0" y="0" width="100" height="50"
                preserveAspectRatio="xMidYMid slice"
              />
              {/* Gradient-Fallback wenn kein Bild */}
              <rect x="0" y="0" width="100" height="50"
                fill="url(#coverGrad)"
                opacity={(!loading && coverLoaded) ? "0" : "1"}
              />
            </pattern>

            {/* Cover Fallback-Gradient */}
            <linearGradient id="coverGrad" x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox">
              <stop offset="0%"   stopColor="#1A3530"/>
              <stop offset="40%"  stopColor={T.teal}/>
              <stop offset="75%"  stopColor={T.purple}/>
              <stop offset="100%" stopColor={T.dark}/>
            </linearGradient>

            {/* Clip-Path: Cover wird durch Wellen-Form beschnitten */}
            <clipPath id="waveClip">
              <path d="M0,0 L100,0 L100,44 C75,44 62,52 50,52 C38,52 25,44 0,44 Z"/>
            </clipPath>

            {/* Wellen-Gradient für den Stroke */}
            <linearGradient id="waveStroke" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor={T.teal}   stopOpacity="0.8"/>
              <stop offset="50%"  stopColor={T.purple} stopOpacity="0.6"/>
              <stop offset="100%" stopColor={T.teal}   stopOpacity="0.8"/>
            </linearGradient>

            {/* Avatar-Clip: Kreis */}
            <clipPath id="avatarClip">
              <circle cx="50" cy="50" r="12.5"/>
            </clipPath>
          </defs>

          {/* ── Hintergrund (unter Welle) ── */}
          <rect x="0" y="44" width="100" height="28" fill={T.bg}/>

          {/* ── Cover-Bereich — durch Wellen-Clip beschnitten ── */}
          <g clipPath="url(#waveClip)">
            {/* Gradient Fallback */}
            <rect x="0" y="0" width="100" height="50" fill="url(#coverGrad)"/>
            {/* Cover-Bild */}
            {!loading && (
              <image
                href={cover}
                x="0" y="0" width="100" height="50"
                preserveAspectRatio="xMidYMid slice"
                opacity={coverLoaded ? "1" : "0"}
                style={{ transition:"opacity 0.8s ease" }}
                onLoad={() => setCoverLoaded(true)}
                onError={() => setCoverLoaded(true)}
              />
            )}
            {/* Shimmer beim Laden */}
            {loading && (
              <rect x="0" y="0" width="100" height="50" fill="#2a5548" opacity="0.7"/>
            )}
            {/* Cover-Hover Overlay */}
            {isOwner && !loading && coverHover && (
              <rect x="0" y="0" width="100" height="50" fill="rgba(0,0,0,0.35)"/>
            )}
          </g>

          {/* ── Wellen-Linie (Stroke über dem Clip) ── */}
          <path
            d="M0,44 C25,44 38,52 50,52 C62,52 75,44 100,44"
            fill="none"
            stroke="url(#waveStroke)"
            strokeWidth="0.5"
          />
          {/* Wellen-Glow */}
          <path
            d="M0,44 C25,44 38,52 50,52 C62,52 75,44 100,44"
            fill="none"
            stroke={T.teal}
            strokeWidth="1.5"
            strokeOpacity="0.12"
          />

          {/* ── Avatar-Halo (Glow hinter Avatar) ── */}
          {!loading && (
            <circle cx="50" cy="50" r="17" fill={T.teal} fillOpacity="0.10"/>
          )}

          {/* ── Ambassador Puls-Ring ── */}
          {isAmbassador && !loading && (
            <circle cx="50" cy="50" r="14.5" fill="none" stroke="#F59E0B" strokeWidth="0.4" strokeOpacity="0.8"/>
          )}

          {/* ── Avatar Border (weißer Ring) ── */}
          <circle cx="50" cy="50" r="13.5" fill={T.bg}/>

          {/* ── Avatar-Bild ── */}
          <g clipPath="url(#avatarClip)">
            {!loading ? (
              <image
                href={avatar}
                x="37.5" y="37.5" width="25" height="25"
                preserveAspectRatio="xMidYMid slice"
                opacity={avatarLoaded ? "1" : "0"}
                style={{ transition:"opacity 0.4s ease" }}
                onLoad={() => setAvatarLoaded(true)}
                onError={() => setAvatarLoaded(true)}
              />
            ) : (
              <circle cx="50" cy="50" r="7.5" fill="#ede9e2"/>
            )}
          </g>

          {/* ── Ambassador Badge ── */}
          {isAmbassador && !loading && (
            <g>
              <circle cx="56" cy="56.5" r="2.2" fill="url(#ambGrad)"/>
              <text x="56" y="57.4" textAnchor="middle" fontSize="2.5" fill="white">⭐</text>
            </g>
          )}
        </svg>

        {/* ── Cover-Kamera-Button (absolut über SVG) ── */}
        {isOwner && !loading && (
          <button className="ph-press"
            onClick={() => coverInputRef.current?.click()}
            style={{
              position:"absolute", top:10, right:10, zIndex:20,
              display:"flex", alignItems:"center", gap:5,
              padding:"5px 10px", borderRadius:99,
              background:"rgba(0,0,0,0.45)",
              backdropFilter:"blur(8px)", WebkitBackdropFilter:"blur(8px)",
              border:"1px solid rgba(255,255,255,0.2)",
              cursor:"pointer", touchAction:"manipulation",
              color:"white", fontSize:11, fontWeight:600,
            }}
            aria-label="Cover ändern"
            onMouseEnter={() => setCoverHover(true)}
            onMouseLeave={() => setCoverHover(false)}
          >
            {coverUploading ? <Spinner size={12} /> : <CameraIcon size={13} />}
            <span>{coverUploading ? "…" : "Cover"}</span>
          </button>
        )}

        {/* ── Avatar-Edit-Button (absolut über SVG, an Avatar-Position) ── */}
        {isOwner && !loading && (
          <button className="ph-press"
            onClick={() => avatarInputRef.current?.click()}
            style={{
              position:"absolute",
              /* Avatar-Mitte liegt bei SVG y=50/68 der SVG-Höhe vom Top */
              /* In % der SVG-Höhe: 50/68 * 100 = 73.5% */
              top:"calc(50/68 * 100% - 24px)",
              left:"50%",
              transform:"translateX(-50%)",
              zIndex:20,
              width:80, height:80,
              borderRadius:"50%",
              background:"transparent",
              border:"none",
              cursor:"pointer",
              touchAction:"manipulation",
            }}
            onMouseEnter={() => setAvatarHover(true)}
            onMouseLeave={() => setAvatarHover(false)}
            aria-label="Profilbild ändern"
          >
            {(avatarHover || avatarUploading) && (
              <div style={{
                position:"absolute", inset:0, borderRadius:"50%",
                background:"rgba(0,0,0,0.5)",
                display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:2,
              }}>
                {avatarUploading ? <Spinner size={16}/> : <><CameraIcon size={16}/><span style={{ color:"white", fontSize:8, fontWeight:700 }}>Ändern</span></>}
              </div>
            )}
          </button>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════
          IDENTITY BLOCK — direkt unter dem Header-SVG
          Kein paddingTop nötig — SVG endet auf Höhe des Avatars
          ════════════════════════════════════════════════════════ */}
      <div style={{
        background: T.bg,
        paddingTop: 4,
        paddingBottom: 0,
        textAlign: "center",
      }}>
        {/* Name */}
        {loading
          ? <div style={{ display:"flex", justifyContent:"center", marginBottom:6 }}><Sk w={160} h={26} r={6}/></div>
          : <div style={{ fontSize:22, fontWeight:900, letterSpacing:"-0.04em", lineHeight:1.1, color:T.ink, padding:"0 20px" }}>
              {name}
            </div>
        }

        {/* @username */}
        {!loading && username && (
          <div style={{ fontSize:12, color:T.inkFaint, marginTop:3, fontWeight:500 }}>@{username}</div>
        )}

        {/* Rolle Badge */}
        {!loading
          ? <div style={{
              display:"inline-flex", alignItems:"center", gap:5, marginTop:8,
              background: isTalentResolved
                ? "linear-gradient(135deg,rgba(14,196,184,0.12),rgba(132,94,194,0.08))"
                : "rgba(14,196,184,0.07)",
              border:`1px solid ${isTalentResolved ? "rgba(14,196,184,0.28)" : "rgba(14,196,184,0.15)"}`,
              borderRadius:99, padding:"4px 14px",
              fontSize:11, fontWeight:700, color:T.tealDeep,
            }}>
              <span>{isTalentResolved ? "✨" : "🌿"}</span>
              <span>{isTalentResolved ? "HUI-Talent" : "HUI-Mitglied"}</span>
              {isTalentResolved && (
                <span style={{ fontWeight:400, color:"rgba(10,173,163,0.55)", fontSize:10 }}> · Creator</span>
              )}
            </div>
          : <div style={{ display:"flex", justifyContent:"center", marginTop:8 }}><Sk w={110} h={22} r={99}/></div>
        }

        {/* Standort */}
        {!loading && location && (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:4, marginTop:7, fontSize:12, color:T.inkSoft }}>
            <span style={{ fontSize:11 }}>📍</span>
            <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:220 }}>{location}</span>
          </div>
        )}

        {/* Follow-Counts */}
        {!loading && (followCounts.followers > 0 || followCounts.following > 0) && (
          <div style={{ display:"flex", gap:20, justifyContent:"center", marginTop:10, fontSize:12, color:T.inkFaint }}>
            <span><strong style={{ color:T.ink, fontWeight:800 }}>{followCounts.followers}</strong> Follower</span>
            <span style={{ color:T.inkFaint }}>·</span>
            <span><strong style={{ color:T.ink, fontWeight:800 }}>{followCounts.following}</strong> folge ich</span>
          </div>
        )}

        {/* Trennlinie */}
        <div style={{
          margin:"14px 20px 0", height:1,
          background:"linear-gradient(to right,transparent,rgba(14,196,184,0.2),transparent)",
        }}/>
      </div>
    </>
  );
}

export default ProfileHeader;
