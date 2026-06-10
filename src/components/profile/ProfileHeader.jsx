// src/components/profile/ProfileHeader.jsx
// ══════════════════════════════════════════════════════════════════════
// UNIFIED PROFILE HEADER — Sprint B
// ──────────────────────────────────────────────────────────────────────
// Ersetzt langfristig:
//   • MeinProfilHeader        (MyBasisProfile.jsx)
//   • CinematicHero           (TalentProfilePage.jsx)
//   • CinematicHero           (BasisProfilePage.jsx)
//   • ProfileHeader (lokal)   (BasisProfilePage.jsx)
//   • ProfileHeader (extern)  (wirker-profile/components/ProfileHeader.jsx)
//   • HeroSection             (wirker-profile/sections/HeroSection.jsx)
//   • ProfileHero             (TalentProfilePage.jsx, BasisProfilePage.jsx)
//
// NOCH NICHT INTEGRIERT — wird in Sprint C in die Seiten eingebunden.
// ══════════════════════════════════════════════════════════════════════

import React, { useState, useRef, useCallback } from "react";
import {
  FB_COVER, FB_AVATAR,
  sv,
  handleAvatarUpload, handleCoverUpload,
} from "../../lib/profileMedia.js";

// Fallback-Assets: FB_COVER, FB_AVATAR aus profileMedia.js
// FB_AVT-Alias fuer Rueckwaertskompatibilitaet im JSX unten
const FB_AVT = FB_AVATAR;

// Design-Tokens (inline)
const T = {
  bg:       "#F7F5F0",
  ink:      "#1A1A18",
  inkSoft:  "#4A4A45",
  inkFaint: "#8C8C85",
  teal:     "#0EC4B8",
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

// sv() aus profileMedia.js importiert

// uploadProfileImage() aus profileMedia.js importiert

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
  const name     = sv(profile?.display_name || profile?.username, "–");
  const username = sv(profile?.username);
  const bio      = sv(profile?.bio);
  // location_final aus useProfileData; Fallback auf location für nicht migrierte Seiten
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

      {/* ── COVER ──────────────────────────────────────────────── */}
      <div style={{
        position:"relative", width:"100%", height:180, overflow:"hidden",
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
        {/* Gradient-Fade */}
        <div style={{
          position:"absolute", inset:0,
          background:"linear-gradient(to bottom,transparent 40%,rgba(247,245,240,0.7) 100%)",
          pointerEvents:"none",
        }}/>

        {/* Cover-Kamera (Owner only) */}
        {isOwner && !loading && (
          <button className="ph-press" onClick={() => coverInputRef.current?.click()}
            style={{
              position:"absolute", top:12, left:12, zIndex:20,
              width:32, height:32, borderRadius:"50%",
              background:"rgba(0,0,0,0.40)", backdropFilter:"blur(6px)",
              border:"none", cursor:"pointer", touchAction:"manipulation",
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:14,
            }}
            aria-label="Cover ändern"
          >
            {coverUploading ? "⏳" : "📷"}
          </button>
        )}
      </div>

      {/* ── IDENTITY BLOCK ─────────────────────────────────────── */}
      <div style={{ background: T.bg, padding:"0 16px 20px" }}>

        {/* Row: Avatar + Name + Badge + Standort */}
        <div style={{ display:"flex", alignItems:"flex-end", gap:14, marginTop:-44, marginBottom:14 }}>

          {/* Avatar */}
          <div style={{ position:"relative", flexShrink:0 }}>
            <div style={{
              width:88, height:88, borderRadius:"50%",
              border:"3.5px solid white",
              boxShadow:"0 4px 20px rgba(0,0,0,0.15)",
              overflow:"hidden", background:T.bg, position:"relative",
            }}>
              {loading ? (
                <div style={{
                  position:"absolute", inset:0, borderRadius:"50%",
                  background:"linear-gradient(90deg,#ede9e2 25%,#f7f5f0 50%,#ede9e2 75%)",
                  backgroundSize:"200% 100%",
                  animation:"ph-shimmer 1.4s ease-in-out infinite",
                }}/>
              ) : (
                <>
                  {!avatarLoaded && (
                    <div style={{
                      position:"absolute", inset:0, borderRadius:"50%",
                      background:"linear-gradient(90deg,#ede9e2 25%,#f7f5f0 50%,#ede9e2 75%)",
                      backgroundSize:"200% 100%",
                      animation:"ph-shimmer 1.4s ease-in-out infinite",
                    }}/>
                  )}
                  <img
                    src={avatar} alt={name}
                    onLoad={() => setAvatarLoaded(true)}
                    onError={() => setAvatarLoaded(true)}
                    style={{
                      width:"100%", height:"100%", objectFit:"cover",
                      opacity: avatarLoaded ? 1 : 0, transition:"opacity .5s ease",
                    }}
                  />
                </>
              )}
            </div>

            {/* Avatar-Kamera (Owner only) */}
            {isOwner && !loading && (
              <button className="ph-press" onClick={() => avatarInputRef.current?.click()}
                style={{
                  position:"absolute", bottom:2, right:2,
                  width:26, height:26, borderRadius:"50%",
                  background: avatarUploading ? "rgba(26,26,24,0.5)" : T.teal,
                  border:"2px solid white",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:12, cursor:"pointer", touchAction:"manipulation",
                  boxShadow:"0 2px 8px rgba(14,196,184,0.35)", zIndex:10,
                }}
                aria-label="Avatar ändern"
              >
                {avatarUploading ? "⏳" : "📷"}
              </button>
            )}
          </div>

          {/* Text-Block: Name / @username / Badge / Standort */}
          <div style={{ flex:1, paddingBottom:4, minWidth:0 }}>

            {loading ? <Sk w={140} h={22} r={6}/> : (
              <div style={{
                fontSize:22, fontWeight:800, color:T.ink,
                letterSpacing:"-0.04em", lineHeight:1.1,
                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
              }}>
                {name}
              </div>
            )}

            {!loading && username && (
              <div style={{ fontSize:12, color:T.inkFaint, marginTop:2, fontWeight:400 }}>
                @{username}
              </div>
            )}

            {/* Mitgliedschaftsbadge — dynamisch nach is_talent */}
            {!loading && (
              <div style={{
                display:"inline-flex", alignItems:"center", gap:5,
                marginTop:5, marginBottom:2,
                background: isTalentResolved ? "rgba(14,196,184,0.09)" : "rgba(14,196,184,0.07)",
                border:`1px solid ${isTalentResolved ? "rgba(14,196,184,0.25)" : "rgba(14,196,184,0.15)"}`,
                borderRadius:99, padding:"3px 10px",
                fontSize:11, fontWeight:700, color:"#0AADA3",
              }}>
                <span style={{ fontSize:11 }}>{isTalentResolved ? "✨" : "🌿"}</span>
                <span>{isTalentResolved ? "HUI-Talent" : "HUI-Mitglied"}</span>
                {isTalentResolved && (
                  <span style={{ fontWeight:400, color:"rgba(10,173,163,0.6)", fontSize:10 }}>
                    · Aktiver Gestalter
                  </span>
                )}
              </div>
            )}

            {/* Standort */}
            {!loading && location ? (
              <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:4, fontSize:12, color:T.inkSoft }}>
                <span>📍</span>
                <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {location}
                </span>
              </div>
            ) : loading ? (
              <div style={{ marginTop:4 }}><Sk w={90} h={13} r={5}/></div>
            ) : null}
          </div>
        </div>

        {/* Bio — max. 2 Zeilen */}
        {loading ? (
          <div>
            <Sk w="100%" h={13} r={5} style={{ marginBottom:5 }}/>
            <Sk w="72%"  h={13} r={5}/>
          </div>
        ) : bio ? (
          <p style={{
            fontSize:13.5, lineHeight:1.65, color:T.inkSoft,
            margin:"0 0 0", fontStyle:"italic",
            display:"-webkit-box",
            WebkitLineClamp:2,
            WebkitBoxOrient:"vertical",
            overflow:"hidden",
          }}>
            {bio}
          </p>
        ) : null}

        {/* Follow-Counts */}
        {!loading && (followCounts.followers > 0 || followCounts.following > 0) && (
          <div style={{ display:"flex", gap:16, marginTop:12, fontSize:12, color:T.inkFaint }}>
            <span>
              <strong style={{ color:T.ink, fontWeight:700 }}>{followCounts.followers}</strong> Follower
            </span>
            <span>
              <strong style={{ color:T.ink, fontWeight:700 }}>{followCounts.following}</strong> folgt
            </span>
          </div>
        )}
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

const DEMO_MEMBER = {
  id: "demo-m1", display_name: "Jonas Weber", username: "jonas.weber",
  bio: "Auf der Suche nach echten Begegnungen und gemeinsamen Projekten.",
  avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80",
  header_img: null,
  location_final: "Berlin",
  is_talent:  false,
};

export function ProfileHeaderDemo() {
  return (
    <div style={{ background:"#F7F5F0", minHeight:"100vh" }}>
      <style>{`
        body { margin:0; }
        .ph-demo-label {
          font-size:11px; font-weight:700; color:#8C8C85;
          letter-spacing:0.08em; text-transform:uppercase;
          padding:16px 16px 6px;
        }
        .ph-demo-divider { height:8px; background:#EDE9E2; margin:16px 0; }
      `}</style>

      <div className="ph-demo-label">① Loading (Skeleton)</div>
      <ProfileHeader loading={true}/>

      <div className="ph-demo-divider"/>

      <div className="ph-demo-label">② Talent — Besucher (isOwner=false, kein 📷)</div>
      <ProfileHeader
        profile={DEMO_TALENT} isOwner={false} isTalent={true}
        followCounts={{ followers: 142, following: 38 }}
      />

      <div className="ph-demo-divider"/>

      <div className="ph-demo-label">③ Talent — Owner (isOwner=true, 📷 sichtbar)</div>
      <ProfileHeader
        profile={DEMO_TALENT} isOwner={true} isTalent={true}
        followCounts={{ followers: 142, following: 38 }}
        onEditAvatar={(url) => console.log("[Demo] Avatar →", url)}
        onEditCover={(url)  => console.log("[Demo] Cover →", url)}
      />

      <div className="ph-demo-divider"/>

      <div className="ph-demo-label">④ Basis-Mitglied (🌿) — Besucher</div>
      <ProfileHeader
        profile={DEMO_MEMBER} isOwner={false} isTalent={false}
        followCounts={{ followers: 23, following: 11 }}
      />

      <div className="ph-demo-divider"/>

      <div className="ph-demo-label">⑤ Basis-Mitglied — Owner (📷 sichtbar)</div>
      <ProfileHeader
        profile={DEMO_MEMBER} isOwner={true} isTalent={false}
        followCounts={{ followers: 23, following: 11 }}
        onEditAvatar={(url) => console.log("[Demo] Avatar →", url)}
        onEditCover={(url)  => console.log("[Demo] Cover →", url)}
      />

      <div className="ph-demo-divider"/>

      <div className="ph-demo-label">⑥ Null-Profil — Fehlerfall</div>
      <ProfileHeader profile={null} isOwner={false} isTalent={false} loading={false}/>
    </div>
  );
}

export default ProfileHeader;
