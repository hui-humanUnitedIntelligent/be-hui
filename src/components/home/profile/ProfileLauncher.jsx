// src/components/home/profile/ProfileLauncher.jsx v8 — DB-basiertes Routing
// ROUTING:
//   selectedProfileId → DB-Query → role/has_talent_profile → TalentProfilePage | BasisProfilePage
//   showCreatorDashboard → MyTalentProfile | MyBasisProfile (eigenes Profil)
// ROUTING-ENTSCHEIDUNG: aus Datenbank, NICHT aus flow.state (war immer undefined)

import React, { useState, useEffect, useCallback } from "react";
import { useHome } from "../HomeShell.jsx";
import { useHuiActions, A } from "../../../core/hui.actions.js";
import { S } from "../../../core/hui.sources.js";
import { supabase } from "../../../lib/supabaseClient.js";

// ── Inline ErrorBoundary ─────────────────────────────────────────
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

// ── Lazy Page Imports ────────────────────────────────────────────
const BasisProfilePage = React.lazy(
  () => import("../../../pages/BasisProfilePage.jsx")
);
const TalentProfilePage = React.lazy(
  () => import("../../../pages/TalentProfilePage.jsx")
);
const MyBasisProfile = React.lazy(
  () => import("../../../pages/MyBasisProfile.jsx")
);
const MyTalentProfile = React.lazy(
  () => import("../../../pages/MyTalentProfile.jsx")
);
const MyCreatorDashboard = React.lazy(
  () => import("../../../pages/MyCreatorDashboard.jsx")
);

// ── Spinner Fallback ─────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:9500,
      background:"#F7F5F0",
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", gap:16,
    }}>
      <div style={{
        width:40, height:40, borderRadius:"50%",
        border:"3px solid rgba(14,196,184,0.15)",
        borderTop:"3px solid #0EC4B8",
        animation:"spin 0.8s linear infinite",
      }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ── useProfileType — lädt role/has_talent_profile aus DB ─────────
// Gibt zurück: { resolved: bool, isTalent: bool }
function useProfileType(profileId) {
  const [state, setState] = useState({ resolved: false, isTalent: false, role: null });

  useEffect(() => {
    if (!profileId) {
      setState({ resolved: true, isTalent: false, role: null });
      return;
    }
    setState({ resolved: false, isTalent: false, role: null });

    (async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          // P2: is_talent als primärer Routing-Indikator
          // Langfristig: isProfileTalent(data) aus src/lib/profileUtils.js verwenden
          // Derzeit kein Import um den Routing-Pfad minimal zu halten
          .select("id, is_talent, membership_type, role, has_talent_profile")
          .eq("id", profileId)
          .single();

        if (error) {
          console.error("[PROFILE ROUTER] DB-Fehler:", error.message);
          setState({ resolved: true, isTalent: false, role: "error" });
          return;
        }

        // P2: Konsolidierte Talent-Erkennung — konsistent mit isProfileTalent()
        const isTalent = !!(
          data?.is_talent === true ||
          data?.membership_type === "talent" ||
          data?.membership_type === "guardian" ||
          data?.membership_type === "team" ||
          data?.role === "talent" ||
          data?.role === "wirker" ||
          data?.has_talent_profile === true
        );


        setState({ resolved: true, isTalent, role: data?.role ?? null });

      } catch (e) {
        console.error("[PROFILE ROUTER] Exception:", e);
        setState({ resolved: true, isTalent: false, role: "exception" });
      }
    })();
  }, [profileId]);

  return state;
}

// ── Hook: imperativer Zugriff (Public API unverändert) ───────────
export function useProfileLauncher() {
  const actions = useHuiActions();

  const openProfile = useCallback((data) => {
    if (!data) return;
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
    selectedProfileId,    closeProfileById,
    showCreatorDashboard, setShowCreatorDashboard,
    authProfile,
  } = useHome();

  // ── DB-Routing für fremde öffentliche Profile ─────────────────
  const { resolved, isTalent, role } = useProfileType(selectedProfileId);

  // ── ÖFFENTLICHES PROFIL (fremder User) ───────────────────────
  if (selectedProfileId) {

    // Solange DB-Query läuft → Spinner zeigen, NICHT schon rendern
    if (!resolved) {
      return <Spinner />;
    }

    const ProfileComponent = isTalent ? TalentProfilePage : BasisProfilePage;

    return (
      <ProfileErrorBoundary profileId={selectedProfileId} onClose={closeProfileById}>
        <React.Suspense fallback={<Spinner />}>
          <ProfileComponent
            profileId={selectedProfileId}
            onClose={closeProfileById}
          />
        </React.Suspense>
      </ProfileErrorBoundary>
    );
  }

  // ── EIGENES PROFIL — IMMER MyBasisProfile (erweiterbar um Talent-Bereich)
  // MyBasisProfile rendert den Talent-Bereich conditional wenn isTalent===true.
  // MyTalentProfile wird NICHT mehr verwendet — verhindert Profil-Duplikate.
  if (showCreatorDashboard) {
    return (
      <ProfileErrorBoundary profileId="own" onClose={() => setShowCreatorDashboard(false)}>
        <MyBasisProfile onClose={() => setShowCreatorDashboard(false)} />
      </ProfileErrorBoundary>
    );
  }

  // Nichts zu zeigen
  return null;
}
