// src/components/ProfileQuickPreview.jsx — Phase 3D
// ══════════════════════════════════════════════════════════════
// Floating glass card — quick social preview without full profile.
// Opens on avatar tap or long press.
// Isolated — crash = null render, no feed impact.
// ══════════════════════════════════════════════════════════════
import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase }        from "../lib/supabaseClient.js";
import { useAuth }         from "../lib/AuthContext.jsx";
import { FollowButton }    from "../lib/useFollowSystem.jsx";
import { PresenceDot, fmtPresence } from "../lib/usePresence.jsx";

const TEAL  = "#16D7C5";
const CORAL = "#FF8A6B";

const INTEREST_TAGS = ["Musik","Natur","Healing","Design","Kunst","Sprache","Bewegung","Handwerk","Tanz","Wirkung"];

// ── Error boundary shell ──────────────────────────────────────
class PQPBoundary extends React.Component {
  state = { crashed: false };
  static getDerivedStateFromError() { return { crashed: true }; }
  render() {
    if (this.state.crashed) return null;
    return this.props.children;
  }
}

// ── CSS ───────────────────────────────────────────────────────
const PQP_CSS = `
@keyframes pqpIn {
  from { opacity:0; transform:translateY(12px) scale(0.95); }
  to   { opacity:1; transform:translateY(0) scale(1); }
}
@keyframes pqpOut {
  from { opacity:1; transform:translateY(0) scale(1); }
  to   { opacity:0; transform:translateY(8px) scale(0.96); }
}
`;
let _pqpCSS = false;
function injectPQP() {
  if (_pqpCSS || typeof document === "undefined") return;
  _pqpCSS = true;
  const s = document.createElement("style"); s.textContent = PQP_CSS;
  document.head.appendChild(s);
}

function PQPInner({ userId, anchorRect, onClose, onMessage, onFullProfile }) {
  const { user } = useAuth();
  const [profile,  setProfile]  = useState(null);
  const [presence, setPresence] = useState(null);
  const [closing,  setClosing]  = useState(false);
  const [followers,setFollowers]= useState(null);
  const [following,setFollowing]= useState(null);

  injectPQP();

  useEffect(() => {
    if (!userId) return;
    async function load() {
      try {
        const [{ data: p }, { data: pres }, { count: frs }, { count: fng }] = await Promise.all([
          supabase.from("profiles").select(
            "id,username,display_name,avatar_url,bio,talent,location,verified,interests"
          ).eq("id", userId).maybeSingle(),
          supabase.from("user_presence").select("status,last_seen_at").eq("user_id", userId).maybeSingle(),
          supabase.from("follows").select("*",{count:"exact",head:true}).eq("followed_id", userId),
          supabase.from("follows").select("*",{count:"exact",head:true}).eq("follower_id", userId),
        ]);
        setProfile(p);
        setPresence(pres?.data ?? pres);
        setFollowers(frs ?? 0);
        setFollowing(fng ?? 0);
      } catch { /* silent */ }
    }
    load();
  }, [userId]);

  function close() {
    setClosing(true);
    setTimeout(onClose, 180);
  }

  // Click outside → close
  const cardRef = useRef(null);
  useEffect(() => {
    const h = (e) => {
      if (cardRef.current && !cardRef.current.contains(e.target)) close();
    };
    setTimeout(() => document.addEventListener("pointerdown", h), 100);
    return () => document.removeEventListener("pointerdown", h);
  }, []); // eslint-disable-line

  // Position: below anchor, centered, never off-screen
  const vw = typeof window !== "undefined" ? window.innerWidth  : 375;
  const vh = typeof window !== "undefined" ? window.innerHeight : 812;
  const cardW = Math.min(320, vw - 32);
  let left = anchorRect ? anchorRect.left + anchorRect.width / 2 - cardW / 2 : vw / 2 - cardW / 2;
  left = Math.max(16, Math.min(left, vw - cardW - 16));
  let top  = anchorRect ? anchorRect.bottom + 10 : vh / 2 - 200;
  if (top + 400 > vh - 16) top = Math.max(16, (anchorRect?.top ?? vh/2) - 400 - 10);

  const name   = profile?.display_name || profile?.username || "Human";
  const avatar = profile?.avatar_url   || null;
  const bio    = profile?.bio          || null;
  const talent = profile?.talent       || null;
  const loc    = profile?.location     || null;
  const presText = fmtPresence(presence);

  // Interests: from profile or random subset
  const interests = (profile?.interests && Array.isArray(profile.interests))
    ? profile.interests.slice(0, 4)
    : INTEREST_TAGS.slice(0, 3);

  return (
    <div style={{
      position:  "fixed",
      zIndex:    15000,
      inset:     0,
      pointerEvents: "none",
    }}>
      <div
        ref={cardRef}
        style={{
          position:   "absolute",
          top:        top,
          left:       left,
          width:      cardW,
          pointerEvents: "all",
          background: "rgba(255,255,255,0.88)",
          backdropFilter: "blur(32px) saturate(180%)",
          WebkitBackdropFilter: "blur(32px) saturate(180%)",
          borderRadius: 28,
          border:     "1px solid rgba(22,215,197,0.18)",
          boxShadow:  "0 8px 40px rgba(26,26,46,0.16), 0 2px 8px rgba(26,26,46,0.08)",
          overflow:   "hidden",
          animation:  closing ? "pqpOut 0.18s ease forwards" : "pqpIn 0.22s cubic-bezier(.22,1,.36,1) both",
          fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
        }}
      >
        {/* Top gradient bar */}
        <div style={{
          height: 4,
          background: `linear-gradient(90deg, ${TEAL}, ${CORAL})`,
        }} />

        <div style={{ padding: "16px 18px 18px" }}>
          {/* Avatar row */}
          <div style={{ display:"flex", alignItems:"flex-start", gap:14, marginBottom:14 }}>
            <div style={{ position:"relative", flexShrink:0 }}>
              <div style={{
                width:60, height:60, borderRadius:18,
                overflow:"hidden", background:"rgba(22,215,197,0.10)",
                border:"2px solid rgba(22,215,197,0.22)",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:24, fontWeight:700, color:TEAL,
              }}>
                {avatar
                  ? <img src={avatar} alt={name} style={{width:"100%",height:"100%",objectFit:"cover"}} />
                  : (name[0]||"H").toUpperCase()
                }
              </div>
              {/* Presence dot */}
              {presence?.status && presence.status !== "offline" && (
                <div style={{ position:"absolute", bottom:-2, right:-2 }}>
                  <PresenceDot status={presence.status} size={12} />
                </div>
              )}
            </div>

            <div style={{ flex:1, minWidth:0, paddingTop:2 }}>
              <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                <span style={{ fontWeight:800, fontSize:16, color:"#1A1A2E", letterSpacing:-0.3 }}>
                  {name}
                </span>
                {profile?.verified && <span style={{ fontSize:12, color:TEAL }}>✦</span>}
              </div>
              {talent && (
                <div style={{ fontSize:12, color:"rgba(26,26,46,0.5)", marginTop:1 }}>{talent}</div>
              )}
              {loc && (
                <div style={{ fontSize:11.5, color:"rgba(26,26,46,0.4)", marginTop:2 }}>📍 {loc}</div>
              )}
              {presText && (
                <div style={{
                  fontSize:11, color: presence?.status === "online" ? "#22C55E" : "#F59E0B",
                  marginTop:4, fontWeight:500,
                }}>● {presText}</div>
              )}
            </div>

            <button onClick={close} style={{
              background:"none", border:"none", color:"rgba(26,26,46,0.3)",
              fontSize:20, cursor:"pointer", padding:"0 0 0 4px",
              lineHeight:1, touchAction:"manipulation", flexShrink:0,
            }}>×</button>
          </div>

          {/* Follower counts */}
          <div style={{ display:"flex", gap:20, marginBottom:12 }}>
            {[
              { label:"Begleiter",   val: followers },
              { label:"Begleitet",   val: following  },
            ].map(({ label, val }) => (
              <div key={label} style={{ textAlign:"center" }}>
                <div style={{ fontWeight:800, fontSize:17, color:"#1A1A2E", lineHeight:1 }}>
                  {val == null ? "—" : val >= 1000 ? (val/1000).toFixed(1)+"k" : val}
                </div>
                <div style={{ fontSize:10.5, color:"rgba(26,26,46,0.42)", marginTop:2 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Bio */}
          {bio && (
            <p style={{
              fontSize:13.5, color:"rgba(26,26,46,0.72)", lineHeight:1.58,
              margin:"0 0 12px", letterSpacing:0.05,
            }}>
              {bio.length > 90 ? bio.slice(0,90)+"…" : bio}
            </p>
          )}

          {/* Interest pills */}
          {interests.length > 0 && (
            <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:14 }}>
              {interests.map(tag => (
                <span key={tag} style={{
                  padding:"4px 10px", borderRadius:20,
                  background:"rgba(22,215,197,0.09)",
                  border:"1px solid rgba(22,215,197,0.20)",
                  fontSize:11.5, fontWeight:600, color:TEAL,
                }}>{tag}</span>
              ))}
            </div>
          )}

          {/* Actions */}
          <div style={{ display:"flex", gap:8 }}>
            <FollowButton
              currentUserId={user?.id}
              targetUserId={userId}
              size="md"
            />
            <button onClick={() => { close(); setTimeout(() => onMessage?.(userId), 200); }} style={{
              flex:1, padding:"7px 14px", borderRadius:22,
              background:"rgba(26,26,46,0.06)", border:"none",
              color:"rgba(26,26,46,0.6)", fontSize:13.5, fontWeight:600,
              cursor:"pointer", touchAction:"manipulation",
            }}>✉ Nachricht</button>
            {onFullProfile && (
              <button onClick={() => { close(); setTimeout(() => onFullProfile?.(userId), 200); }} style={{
                padding:"7px 12px", borderRadius:22,
                background:"rgba(22,215,197,0.10)", border:"1px solid rgba(22,215,197,0.20)",
                color:TEAL, fontSize:13, fontWeight:600,
                cursor:"pointer", touchAction:"manipulation",
              }}>Profil →</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Public wrapper with error boundary ───────────────────────
export default function ProfileQuickPreview(props) {
  return (
    <PQPBoundary>
      {props.userId ? <PQPInner {...props} /> : null}
    </PQPBoundary>
  );
}
