// src/components/profile/ProfileHeader.jsx
// ══════════════════════════════════════════════════════════════════════
// UNIFIED PROFILE HEADER — Sprint B (Redesign: luftig / offen / 2026-07-19)
// ══════════════════════════════════════════════════════════════════════

import {
  HUILocationIcon, HUITalentIcon, HUIImpactIcon,
} from '../../design/icons/HuiSystemIcons.jsx';
import React, { useState, useRef, useCallback } from "react";
import {
  FB_COVER, FB_AVATAR,
  sv,
  handleAvatarUpload, handleCoverUpload,
} from "../../lib/profileMedia.js";

const FB_AVT = FB_AVATAR;

// Design-Tokens (inline)
const T = {
  bg:       "#F7F5F0",
  ink:      "#1A1A18",
  inkSoft:  "#4A4A45",
  inkFaint: "#8C8C85",
  teal:     "#0EC4B8",
  tealMid:  "rgba(14,196,184,0.30)",
  tealSoft: "rgba(14,196,184,0.10)",
  border:   "rgba(26,26,18,0.09)",
};

function Sk({ w, h, r = 8 }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r, flexShrink: 0,
      background: "linear-gradient(90deg,#ede9e2 25%,#f7f5f0 50%,#ede9e2 75%)",
      backgroundSize: "200% 100%",
      animation: "ph-shimmer 1.4s ease-in-out infinite",
    }}/>
  );
}

// ══════════════════════════════════════════════════════════════════════
// ProfileHeader
// ══════════════════════════════════════════════════════════════════════
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

  const avatarInputRef = useRef(null);
  const coverInputRef  = useRef(null);

  const cover    = sv(profile?.header_img, FB_COVER);
  const avatar   = sv(profile?.avatar_url, FB_AVT);
  const name     = sv(profile?.full_name || profile?.display_name || profile?.username, "–");
  const username = sv(profile?.username);
  const location = sv(profile?.location_final || profile?.location);

  const isTalentResolved = isTalent || profile?.is_talent === true;

  const handleAvatarFile = useCallback((e) =>
    handleAvatarUpload({ event: e, profileId: profile?.id, onSuccess: onEditAvatar, setUploading: setAvatarUploading }),
  [profile?.id, onEditAvatar]);

  const handleCoverFile = useCallback((e) =>
    handleCoverUpload({ event: e, profileId: profile?.id, onSuccess: onEditCover, setUploading: setCoverUploading }),
  [profile?.id, onEditCover]);

  return (
    <>
      <style>{`
        @keyframes ph-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .ph-press { -webkit-tap-highlight-color: transparent; transition: opacity .12s ease; }
        .ph-press:active { opacity: 0.65; }
      `}</style>

      <input ref={coverInputRef}  type="file" accept="image/*"
        style={{ display:"none" }} onChange={handleCoverFile}  />
      <input ref={avatarInputRef} type="file" accept="image/*"
        style={{ display:"none" }} onChange={handleAvatarFile} />

      {/* ── COVER ──────────────────────────────────────────────────── */}
      <div style={{
        position:"relative", width:"100%", height:200, overflow:"hidden",
        background:"linear-gradient(160deg,#1A3530 0%,#2A5548 50%,#0EC4B8 100%)",
      }}>
        {loading ? (
          <div style={{
            position:"absolute", inset:0,
            background:"linear-gradient(90deg,#ede9e2 25%,#f7f5f0 50%,#ede9e2 75%)",
            backgroundSize:"200% 100%",
            animation:"ph-shimmer 1.4s ease-in-out infinite",
          }}/>
        ) : (
          <img
            src={cover} alt=""
            onLoad={() => setCoverLoaded(true)}
            onError={() => setCoverLoaded(true)}
            style={{
              width:"100%", height:"100%", objectFit:"cover", display:"block",
              opacity: coverLoaded ? 0.88 : 0, transition:"opacity 1.1s ease",
            }}
          />
        )}
        {/* Gradient-Fade unten */}
        <div style={{
          position:"absolute", inset:0,
          background:"linear-gradient(to bottom,transparent 35%,rgba(247,245,240,0.85) 100%)",
          pointerEvents:"none",
        }}/>

        {/* Cover-Kamera (Owner only) */}
        {isOwner && !loading && (
          <button className="ph-press" onClick={() => coverInputRef.current?.click()}
            style={{
              position:"absolute", top:14, left:14, zIndex:20,
              width:34, height:34, borderRadius:"50%",
              background:"rgba(0,0,0,0.40)", backdropFilter:"blur(6px)", WebkitBackdropFilter:"blur(6px)",
              border:"none", cursor:"pointer", touchAction:"manipulation",
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:14,
            }}
            aria-label="Cover ändern"
          >
            {coverUploading ? "⏳" : "📷"}
          </button>
        )}
      </div>

      {/* ── IDENTITY BLOCK ─────────────────────────────────────────── */}
      {/* Neues Layout (2026-07-19): Avatar zentriert, Name/Badge darunter — klare Hierarchie */}
      <div style={{ background: T.bg, paddingBottom: 24 }}>

        {/* ── Avatar — zentriert, ragt über Cover hinaus ── */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          marginTop: -56,
          paddingBottom: 0,
        }}>
          <div style={{ position:"relative", flexShrink:0 }}>
            <div style={{
              width:112, height:112, borderRadius:"50%",
              border:"4px solid white",
              boxShadow:"0 6px 28px rgba(0,0,0,0.15)",
              overflow:"hidden", background:T.bg, position:"relative",
            }}>
              {(loading || !avatarLoaded) && (
                <div style={{
                  position:"absolute", inset:0, borderRadius:"50%",
                  background:"linear-gradient(90deg,#ede9e2 25%,#f7f5f0 50%,#ede9e2 75%)",
                  backgroundSize:"200% 100%",
                  animation:"ph-shimmer 1.4s ease-in-out infinite",
                }}/>
              )}
              {!loading && (
                <img
                  src={avatar} alt={name}
                  onLoad={() => setAvatarLoaded(true)}
                  onError={() => setAvatarLoaded(true)}
                  style={{
                    width:"100%", height:"100%", objectFit:"cover",
                    opacity: avatarLoaded ? 1 : 0, transition:"opacity .5s ease",
                  }}
                />
              )}
            </div>

            {/* Avatar-Kamera (Owner only) */}
            {isOwner && !loading && (
              <button className="ph-press" onClick={() => avatarInputRef.current?.click()}
                style={{
                  position:"absolute", bottom:6, right:6,
                  width:30, height:30, borderRadius:"50%",
                  background: avatarUploading ? "rgba(26,26,24,0.5)" : T.teal,
                  border:"2.5px solid white",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:13, cursor:"pointer", touchAction:"manipulation",
                  boxShadow:"0 2px 8px rgba(14,196,184,0.35)", zIndex:10,
                }}
                aria-label="Avatar ändern"
              >
                {avatarUploading ? "⏳" : "📷"}
              </button>
            )}
          </div>
        </div>

        {/* ── Name ── */}
        <div style={{
          textAlign: "center",
          marginTop: 16,
          paddingLeft: 20,
          paddingRight: 20,
        }}>
          {loading ? (
            <div style={{ display:"flex", justifyContent:"center" }}>
              <Sk w={140} h={22} r={6}/>
            </div>
          ) : (
            <div style={{
              fontSize: 22,
              fontWeight: 800,
              color: T.ink,
              letterSpacing: "-0.025em",
              lineHeight: 1.2,
            }}>
              {name}
            </div>
          )}

          {/* @username */}
          {!loading && username && (
            <div style={{
              fontSize: 13,
              color: T.inkFaint,
              marginTop: 4,
              fontWeight: 400,
              letterSpacing: "0.01em",
            }}>
              @{username}
            </div>
          )}
        </div>

        {/* ── Badge ── */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          marginTop: 12,
        }}>
          {loading ? (
            <Sk w={100} h={28} r={99}/>
          ) : (
            <div style={{
              display:"inline-flex", alignItems:"center", gap:5,
              background: isTalentResolved ? T.tealSoft : "rgba(14,196,184,0.07)",
              border:`1.5px solid ${isTalentResolved ? T.tealMid : "rgba(14,196,184,0.18)"}`,
              borderRadius: 99,
              padding: "6px 14px",
              fontSize: 12,
              fontWeight: 700,
              color: "#0AADA3",
              letterSpacing: "0.01em",
            }}>
              <span style={{display:"flex",alignItems:"center"}}>
                {isTalentResolved ? <HUITalentIcon size={15}/> : <HUIImpactIcon size={15}/>}
              </span>
              <span>{isTalentResolved ? "HUI-Talent" : "Basis-Nutzer"}</span>
            </div>
          )}
        </div>

        {/* ── Trennlinie ── */}
        <div style={{
          height: 1,
          background: T.border,
          margin: "20px 20px 0",
        }}/>

        {/* ── Standort + Follower — horizontal, großzügig ── */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          padding: "16px 20px 0",
          flexWrap: "wrap",
        }}>
          {/* Standort */}
          {!loading && location && (
            <div style={{
              display:"flex", alignItems:"center", gap:5,
              fontSize: 13, color: T.inkSoft,
            }}>
              <HUILocationIcon size={14} style={{flexShrink:0, color:"rgba(14,196,184,0.7)"}} />
              <span style={{
                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                maxWidth: 180,
              }}>
                {location}
              </span>
            </div>
          )}

          {/* Follower-Zahlen */}
          {!loading && (followCounts.followers > 0 || followCounts.following > 0) && (
            <div style={{
              display:"flex", gap:20,
              fontSize: 13, color: T.inkFaint,
            }}>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:1 }}>
                <span style={{ fontSize:16, fontWeight:800, color:T.ink, lineHeight:1 }}>
                  {followCounts.followers}
                </span>
                <span style={{ fontSize:11, color:T.inkFaint, fontWeight:500 }}>Follower</span>
              </div>
              <div style={{
                width:1, background:T.border, borderRadius:1, alignSelf:"stretch",
              }}/>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:1 }}>
                <span style={{ fontSize:16, fontWeight:800, color:T.ink, lineHeight:1 }}>
                  {followCounts.following}
                </span>
                <span style={{ fontSize:11, color:T.inkFaint, fontWeight:500 }}>folgt</span>
              </div>
            </div>
          )}

          {/* Skeleton für Standort+Follower */}
          {loading && (
            <>
              <Sk w={100} h={14} r={6}/>
              <Sk w={80} h={14} r={6}/>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════
// DEMO — alle Zustände in einer Übersicht (Verifikation Sprint B)
// Wird nicht in Produktion genutzt.
// ══════════════════════════════════════════════════════════════════════

const DEMO_TALENT = {
  id: "demo-t1", display_name: "Lena Hartmann", username: "lena.hartmann",
  bio: "Ich erschaffe Räume, die Menschen verbinden. Fotografie, Klang und stille Momente.",
  avatar_url:   "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&q=80",
  header_img:   "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200&q=80",
  location_final: "München, Bayern",
  is_talent:    true,
};
