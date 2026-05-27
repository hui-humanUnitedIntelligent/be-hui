// src/components/home/profile/ProfileLauncher.jsx v7 — Unified ID Flow
// ROUTING:
//   selectedProfileId → PublicProfilePage (WirkerProfilePage) — Feed, Story, Search
//   showCreatorDashboard → MyCreatorDashboard — Tabbar Profile Tab
// KEINE showWirker/_isOwnerView Logik mehr

import React, { useCallback } from "react";
import { useHome } from "../HomeShell.jsx";
import { useHuiActions, A } from "../../../core/hui.actions.js";
import { S } from "../../../core/hui.sources.js";
import { useHuiFlow } from "../../../core/hui.flow.js";
import MyCreatorDashboard from "../../../pages/MyCreatorDashboard.jsx";

// ── Inline ErrorBoundary für WirkerProfilePage ───────────────────
class ProfileErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("🔴 ProfileErrorBoundary caught:", error?.message, error?.stack?.slice(0,400));
    console.error("🔴 ComponentStack:", errorInfo?.componentStack?.slice(0,600));
    this.setState({ errorInfo });
    // Sichtbarer DOM-Banner mit dem Fehler
    try {
      let banner = document.getElementById("__hui_error_banner__");
      if (!banner) {
        banner = document.createElement("div");
        banner.id = "__hui_error_banner__";
        banner.style.cssText = [
          "position:fixed","top:0","left:0","right:0","z-index:99999",
          "background:#FF4444","color:#fff","padding:12px 16px",
          "font-size:12px","font-family:monospace","white-space:pre-wrap",
          "max-height:40vh","overflow-y:auto",
        ].join(";");
        document.body.appendChild(banner);
      }
      banner.textContent = "PROFILE CRASH:\n" + (error?.message || "unknown") + "\n\nStack:\n" + (errorInfo?.componentStack || "").slice(0, 800);
      banner.style.display = "block";
    } catch(e) {}
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position:"fixed", inset:0, zIndex:9500,
          background:"#0A1A1A",
          display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center", gap:12,
          padding:24,
        }}>
          <div style={{fontSize:32}}>⚠️</div>
          <p style={{color:"#FF6B6B", fontSize:15, fontFamily:"sans-serif", textAlign:"center", margin:0}}>
            Profil konnte nicht geladen werden
          </p>
          <p style={{color:"rgba(255,255,255,0.4)", fontSize:11, fontFamily:"monospace", textAlign:"center"}}>
            {this.state.error?.message || "Unbekannter Fehler"}
          </p>
          <button
            onClick={() => { this.setState({hasError:false,error:null}); this.props.onClose?.(); }}
            style={{
              marginTop:8, padding:"10px 24px", borderRadius:20,
              background:"#0DC4B5", border:"none", color:"#000",
              fontWeight:700, fontSize:14, cursor:"pointer",
            }}
          >
            Schließen
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}


// ── LAZY: WirkerProfilePage nur bei Bedarf (~140KB) ─────────────
const WirkerProfilePage = React.lazy(
  () => import("../../../pages/wirker-profile/index.jsx")
);

/* ── Loading Fallback ── */
function ProfileLoadingFallback() {
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:9500,
      background:"#F9F7F4",
      display:"flex", alignItems:"center", justifyContent:"center",
    }}>
      <div style={{ opacity:0.25, fontSize:13, color:"#888" }}>Lade Profil…</div>
    </div>
  );
}

/* ── Hook: imperativer Zugriff ── */
export function useProfileLauncher() {
  const { setShowWirker, openOwnProfile: shellOpenOwn } = useHome();
  const actions = useHuiActions();

  const openProfile = useCallback((data) => {
    if (!data) return;
    // Push source surface so Return weiß woher wir kamen
    actions[A.OPEN_PROFILE]?.({ creator: data, source: S.SYSTEM });
  }, [actions]);

  const openOwnProfile = useCallback(() => {
    actions[A.OPEN_OWN_PROFILE]?.();
  }, [actions]);

  const openCreatorProfile = useCallback((id, extra = {}) => {
    actions[A.OPEN_PROFILE]?.({ creatorId: id, source: S.SYSTEM, ...extra });
  }, [actions]);

  return { openProfile, openOwnProfile, openCreatorProfile };
}

/* ════════════════════════════════════════════════════════════
   ProfileLauncher — einziger Render-Punkt für alle Profile
   ════════════════════════════════════════════════════════════ */
export default function ProfileLauncher() {
  const {
    selectedProfileId, closeProfileById,
    showCreatorDashboard, setShowCreatorDashboard,
    showChat, setShowChat, setChatRecipient,
  } = useHome();

  const flow = useHuiFlow();

  console.log("🟣 ProfileLauncher render", {
    selectedProfileId,
    showCreatorDashboard,
  });

  // ── NEU: ID-basierter Modus (Feed-Avatar-Klick) ────────────────
  // Einfachster, stabilster Pfad: nur ID → WirkerProfilePage lädt alles selbst
  if (selectedProfileId) {
    console.log("🟣 STEP 5b — ProfileLauncher: selectedProfileId vorhanden", selectedProfileId);
    return (
      <ProfileErrorBoundary profileId={selectedProfileId} onClose={closeProfileById}>
        <React.Suspense fallback={
          <div style={{
            position:"fixed", inset:0, zIndex:9500,
            background:"#0A1A1A",
            display:"flex", flexDirection:"column",
            alignItems:"center", justifyContent:"center", gap:16
          }}>
            <div style={{
              width:48, height:48, borderRadius:"50%",
              border:"3px solid rgba(13,196,181,0.3)",
              borderTop:"3px solid #0DC4B5",
              animation:"spin 0.8s linear infinite"
            }}/>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <p style={{color:"rgba(255,255,255,0.6)", fontSize:14, fontFamily:"sans-serif"}}>
              Profil wird geladen…
            </p>
            <p style={{color:"rgba(13,196,181,0.5)", fontSize:11, fontFamily:"monospace"}}>
              ID: {selectedProfileId?.slice(0,8)}…
            </p>
          </div>
        }>
          <WirkerProfilePage
            profileId={selectedProfileId}
            onClose={closeProfileById}
            onChat={(profile) => {
              const recipient = {
                id:           profile?.id || profile?.user_id,
                display_name: profile?.display_name || profile?.name || "Creator",
                avatar_url:   profile?.img || profile?.avatar_url || null,
                talent:       profile?.talent || null,
              };
              setChatRecipient(recipient);
              setShowChat(true);
            }}
            _zIndex={showChat ? 9200 : 9500}
          />
        </React.Suspense>
      </ProfileErrorBoundary>
    );
  }

  // ── CREATOR DASHBOARD: eigenes Profil / Tabbar ───────────────
  if (showCreatorDashboard) {
    return (
      <MyCreatorDashboard
        onClose={() => setShowCreatorDashboard(false)}
      />
    );
  }

  // Nichts zu zeigen
  return null;
}
