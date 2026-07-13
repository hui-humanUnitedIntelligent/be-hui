// src/components/profile/ProfileHeader.jsx
// ══════════════════════════════════════════════════════════════════════
// UNIFIED PROFILE HEADER v2 — Redesign 2026-07-13
// Orb-Wave Header: geschwungene Welle, Avatar mittig schwebend
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

  const COVER_H  = 210;
  const WAVE_H   = 48;
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
        @keyframes ph-fade-up {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ph-press { -webkit-tap-highlight-color: transparent; }
        .ph-press:active { opacity: 0.7; }
        .ph-identity { animation: ph-fade-up 0.45s ease both 0.1s; }
      `}</style>

      <input ref={coverInputRef}  type="file" accept="image/*" style={{ display:"none" }} onChange={handleCoverFile} />
      <input ref={avatarInputRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleAvatarFile} />

      <div style={{ position:"relative", width:"100%", userSelect:"none" }}>

        {/* ─── COVER ─────────────────────────────────────────────── */}
        <div
          style={{
            position:"relative", width:"100%", height:COVER_H, overflow:"hidden",
            background:`linear-gradient(145deg,#1A3530 0%,${T.teal} 45%,${T.purple} 75%,${T.dark} 100%)`,
            cursor: isOwner ? "pointer" : "default",
          }}
          onClick={isOwner && !coverUploading ? () => coverInputRef.current?.click() : undefined}
          onMouseEnter={() => isOwner && setCoverHover(true)}
          onMouseLeave={() => setCoverHover(false)}
          onTouchStart={() => isOwner && setCoverHover(true)}
          onTouchEnd={() => setCoverHover(false)}
        >
          {loading && (
            <div style={{
              position:"absolute", inset:0,
              background:"linear-gradient(90deg,#1a3530 25%,#2a5548 50%,#1a3530 75%)",
              backgroundSize:"200% 100%", animation:"ph-shimmer 1.6s ease-in-out infinite",
            }} />
          )}
          {!loading && (
            <img src={cover} alt=""
              onLoad={() => setCoverLoaded(true)}
              onError={() => setCoverLoaded(true)}
              style={{
                position:"absolute", inset:0, width:"100%", height:"100%",
                objectFit:"cover", opacity: coverLoaded ? 0.85 : 0, transition:"opacity 1.1s ease",
              }}
            />
          )}
          {/* Gradient-Fade unten */}
          <div style={{
            position:"absolute", inset:0, pointerEvents:"none",
            background:"linear-gradient(to bottom,transparent 30%,rgba(247,245,240,0.2) 80%,rgba(247,245,240,0.65) 100%)",
          }} />
          {/* Owner Hover-Overlay */}
          {isOwner && !loading && (
            <div style={{
              position:"absolute", inset:0,
              background: coverHover ? "rgba(0,0,0,0.38)" : "rgba(0,0,0,0)",
              transition:"background 0.25s ease",
              display:"flex", alignItems:"center", justifyContent:"center",
              pointerEvents:"none",
            }}>
              {(coverHover || coverUploading) && (
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
                  {coverUploading
                    ? <Spinner size={26} color="white" />
                    : <><CameraIcon size={28} color="white" /><span style={{ color:"white", fontSize:12, fontWeight:600 }}>Cover ändern</span></>
                  }
                </div>
              )}
            </div>
          )}
          {/* Cover-Button (Mobile: immer sichtbar) */}
          {isOwner && !loading && (
            <button className="ph-press"
              onClick={(e) => { e.stopPropagation(); coverInputRef.current?.click(); }}
              style={{
                position:"absolute", top:12, right:12, zIndex:20,
                display:"flex", alignItems:"center", gap:5,
                padding:"6px 11px", borderRadius:99,
                background:"rgba(0,0,0,0.42)",
                backdropFilter:"blur(8px)", WebkitBackdropFilter:"blur(8px)",
                border:"1px solid rgba(255,255,255,0.18)",
                cursor:"pointer", touchAction:"manipulation",
                color:"white", fontSize:11, fontWeight:600,
              }}
              aria-label="Cover ändern"
            >
              {coverUploading ? <Spinner size={12} /> : <CameraIcon size={13} />}
              <span>{coverUploading ? "…" : "Cover"}</span>
            </button>
          )}
        </div>

        {/* ─── ORB WAVE ──────────────────────────────────────────── */}
        <div style={{ position:"relative", marginTop:-2, lineHeight:0 }}>
          <svg viewBox="0 0 390 52" preserveAspectRatio="none"
            style={{ display:"block", width:"100%", height:WAVE_H }} aria-hidden="true">
            <defs>
              <linearGradient id="phwg" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor={T.teal}   stopOpacity="0.55" />
                <stop offset="40%"  stopColor={T.purple} stopOpacity="0.40" />
                <stop offset="100%" stopColor={T.teal}   stopOpacity="0.55" />
              </linearGradient>
            </defs>
            {/* Fill */}
            <path d="M0,0 C60,0 90,38 195,38 C300,38 330,0 390,0 L390,52 L0,52 Z" fill={T.bg} />
            {/* Stroke */}
            <path d="M0,0 C60,0 90,38 195,38 C300,38 330,0 390,0" fill="none" stroke="url(#phwg)" strokeWidth="1.5" />
            {/* Glow */}
            <path d="M0,0 C60,0 90,38 195,38 C300,38 330,0 390,0" fill="none" stroke={T.teal} strokeWidth="4" strokeOpacity="0.09" />
          </svg>

          {/* ─── AVATAR — mittig über Welle ──────────────────────── */}
          <div style={{
            position:"absolute", left:"50%", top:-(AVATAR_D / 2) + 2,
            transform:"translateX(-50%)", zIndex:10,
          }}>
            {/* Puls-Ring Ambassador */}
            {isAmbassador && !loading && (
              <div style={{
                position:"absolute", inset:-6, borderRadius:"50%",
                border:"2px solid #F59E0B",
                animation:"ph-pulse-ring 2.2s ease-out infinite",
                pointerEvents:"none",
              }} />
            )}
            {/* Glow-Halo */}
            <div style={{
              position:"absolute", inset:-10, borderRadius:"50%",
              background:`radial-gradient(circle,${T.teal}26 0%,transparent 70%)`,
              pointerEvents:"none",
            }} />
            {/* Avatar */}
            <div
              style={{
                width:AVATAR_D, height:AVATAR_D, borderRadius:"50%",
                border:`3.5px solid ${T.bg}`,
                boxShadow:`0 8px 32px rgba(14,196,184,0.22),0 2px 8px rgba(0,0,0,0.18)`,
                overflow:"hidden", background:T.bg, position:"relative",
                cursor: isOwner ? "pointer" : "default",
                transition:"transform 0.2s ease,box-shadow 0.2s ease",
                transform: avatarHover && isOwner ? "scale(1.04)" : "scale(1)",
              }}
              onClick={isOwner && !avatarUploading ? () => avatarInputRef.current?.click() : undefined}
              onMouseEnter={() => isOwner && setAvatarHover(true)}
              onMouseLeave={() => setAvatarHover(false)}
              onTouchStart={() => isOwner && setAvatarHover(true)}
              onTouchEnd={() => setAvatarHover(false)}
            >
              {(loading || !avatarLoaded) && (
                <div style={{
                  position:"absolute", inset:0, borderRadius:"50%",
                  background:"linear-gradient(90deg,#ede9e2 25%,#f7f5f0 50%,#ede9e2 75%)",
                  backgroundSize:"200% 100%", animation:"ph-shimmer 1.4s ease-in-out infinite",
                }} />
              )}
              {!loading && (
                <img src={avatar} alt={name}
                  onLoad={() => setAvatarLoaded(true)}
                  onError={() => setAvatarLoaded(true)}
                  style={{ width:"100%", height:"100%", objectFit:"cover", opacity: avatarLoaded ? 1 : 0, transition:"opacity .5s ease" }}
                />
              )}
              {/* Avatar Edit Overlay */}
              {isOwner && !loading && (avatarHover || avatarUploading) && (
                <div style={{
                  position:"absolute", inset:0, borderRadius:"50%",
                  background:"rgba(0,0,0,0.48)", backdropFilter:"blur(2px)",
                  display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:4,
                  pointerEvents:"none",
                }}>
                  {avatarUploading ? <Spinner size={20} color="white" />
                    : <><CameraIcon size={20} color="white" /><span style={{ color:"white", fontSize:9, fontWeight:700 }}>Ändern</span></>}
                </div>
              )}
            </div>
            {/* Ambassador Badge */}
            {isAmbassador && !loading && (
              <div style={{
                position:"absolute", bottom:2, right:-2,
                width:22, height:22, borderRadius:"50%",
                background:"linear-gradient(135deg,#F59E0B,#D97706)",
                border:`2px solid ${T.bg}`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:11, boxShadow:"0 2px 6px rgba(245,158,11,0.4)", zIndex:11,
              }}>⭐</div>
            )}
          </div>
        </div>

        {/* ─── IDENTITY ──────────────────────────────────────────── */}
        <div className="ph-identity" style={{
          background:T.bg, paddingTop: AVATAR_D / 2 + 4,
          paddingBottom:0, textAlign:"center",
        }}>
          {/* Name */}
          {loading
            ? <div style={{ display:"flex", justifyContent:"center", marginBottom:6 }}><Sk w={160} h={26} r={6} /></div>
            : <div style={{
                fontSize:24, fontWeight:900, letterSpacing:"-0.04em", lineHeight:1.1,
                color:T.ink, padding:"0 20px",
              }}>{name}</div>
          }
          {/* @username */}
          {!loading && username && (
            <div style={{ fontSize:12, color:T.inkFaint, marginTop:3, fontWeight:500 }}>@{username}</div>
          )}
          {/* Rolle Badge */}
          {!loading
            ? <div style={{
                display:"inline-flex", alignItems:"center", gap:5,
                marginTop:8,
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
            : <div style={{ display:"flex", justifyContent:"center", marginTop:8 }}><Sk w={110} h={22} r={99} /></div>
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
            margin:"10px 20px 0", height:1,
            background:"linear-gradient(to right,transparent,rgba(14,196,184,0.2),transparent)",
          }} />
        </div>

      </div>
    </>
  );
}

export default ProfileHeader;
