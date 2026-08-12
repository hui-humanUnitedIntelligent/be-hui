// src/components/home/profile/ProfileLauncher.jsx v8 — DB-basiertes Routing
// ROUTING:
//   selectedProfileId → DB-Query → role/has_talent_profile → TalentProfilePage | PublicProfilePage
//   showCreatorDashboard → MyBasisProfile (eigenes Profil — Talent-UI via isTalent)
// ROUTING-ENTSCHEIDUNG: aus Datenbank, NICHT aus flow.state (war immer undefined)

import { HUIWarnIcon } from '../../../design/icons/HuiSystemIcons.jsx';
import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useHome } from "../HomeShell.jsx";
import { useHuiActions, A } from "../../../core/hui.actions.js";
import { S } from "../../../core/hui.sources.js";
import { ProfileService } from '../../../services/db';
import { supabase } from "../../../lib/supabaseClient.js";
import { isProfileTalent } from "../../../lib/profileUtils.js";
import { useModalRegistration } from "../../../hooks/useModalRegistration.js";

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
      const isChunk = this.state.error?.message?.includes("Failed to fetch dynamically imported module")
        || this.state.error?.message?.includes("Importing a module script failed");
      // Bei ChunkLoadError: automatisch neu laden (einmalig)
      if (isChunk && !sessionStorage.getItem("chunk_boundary_reloaded")) {
        sessionStorage.setItem("chunk_boundary_reloaded", "1");
        setTimeout(() => window.location.reload(), 100);
        return (
          <div style={{
            position:"fixed", inset:0, zIndex:9500, background:"#F7F5F0", /* <BottomNav — Basis-Fallback, siehe PROFIL-NAV-FIX 2026-07-05 */
            display:"flex", flexDirection:"column", alignItems:"center",
            justifyContent:"center", gap:12, padding:24,
          }}>
            <div style={{fontSize:32}}>🔄</div>
            <p style={{color:"#1a1a18", fontSize:15, fontFamily:"Inter, sans-serif", textAlign:"center", margin:0}}>
              Wird neu geladen…
            </p>
          </div>
        );
      }
      return (
        <div style={{
          position:"fixed", inset:0, zIndex:9500, /* <BottomNav — Basis-Fallback, siehe PROFIL-NAV-FIX 2026-07-05 */
          background:"#0A1A1A",
          display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center", gap:12,
          padding:24,
        }}>
          <div style={{display:"flex",justifyContent:"center",color:"#F59E0B"}}><HUIWarnIcon size={32}/></div>
          <p style={{color:"#FF6B6B", fontSize:15, fontFamily:"Inter, sans-serif", textAlign:"center", margin:0}}>
            Profil konnte nicht geladen werden
          </p>
          <p style={{color:"rgba(255,255,255,0.4)", fontSize:11, fontFamily:"monospace", textAlign:"center"}}>
            {this.state.error?.message || "Unbekannter Fehler"}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop:8, padding:"10px 24px", borderRadius:20,
              background:"#0DC4B5", border:"none", color:"#000",
              fontWeight: 600, fontSize:14, cursor:"pointer",
            }}
          >
            🔄 Seite neu laden
          </button>
          <button
            onClick={() => { this.setState({hasError:false,error:null}); this.props.onClose?.(); }}
            style={{
              padding:"8px 24px", borderRadius:20,
              background:"transparent", border:"1px solid rgba(255,255,255,0.2)",
              color:"rgba(255,255,255,0.6)", fontWeight:600, fontSize:13, cursor:"pointer",
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


// ── Page Imports — EAGER (kein React.lazy, kein Suspense, kein __vitePreload) ─
// Root-Fix 2026-07-30: React.lazy + __vitePreload hing bei Suspense fest.
// Eager Import bündelt PublicProfilePage in den Haupt-Chunk → kein separater
// Chunk-Load nötig → Profil erscheint sofort.
import PublicProfilePage  from "../../../pages/PublicProfilePage.jsx";
import SystemBotProfile  from "../../profile/SystemBotProfile.jsx";
const SYSTEM_USER_ID = "152619c1-9adc-40bf-9078-eb67f5024ed2";
import MyBasisProfile     from "../../../pages/MyBasisProfile.jsx";




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

    let cancelled = false;

    // Timeout-Schutz: nach 6s Fallback auf PublicProfilePage
    const timeoutPromise = new Promise((resolve) =>
      setTimeout(() => resolve({ data: null, error: { message: "timeout" } }), 2000)
    );

    (async () => {
      try {
        const { data, error } = await Promise.race([
          ProfileService.getById(profileId),
          timeoutPromise,
        ]);
        if (cancelled) return;

        if (error) {
          // Bei Timeout oder DB-Fehler: Fallback PublicProfilePage (sicher)
          setState({ resolved: true, isTalent: false, role: "error" });
          return;
        }

        // Sprint F.4C: isProfileTalent() ist die einzige Wahrheitsquelle
        const isTalent = isProfileTalent(data);
        setState({ resolved: true, isTalent, role: data?.role ?? null });

      } catch (e) {
        if (!cancelled) setState({ resolved: true, isTalent: false, role: "exception" });
      }
    })();

    return () => { cancelled = true; };
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

  // BACK-BUTTON: Register so Android back button closes the profile overlay
  useModalRegistration(!!selectedProfileId, closeProfileById, "PublicProfile");
  useModalRegistration(showCreatorDashboard, () => setShowCreatorDashboard(false), "OwnProfile");

  // Portal-Target: document.body (escapes ALL ancestor Stacking Contexts)
  const portalTarget = typeof document !== "undefined" ? document.body : null;


  // ── ÖFFENTLICHES PROFIL (fremder User) ───────────────────────
  // INSTANT-OPEN: PublicProfilePage sofort rendern — kein DB-Routing-Block.
  // isTalent wird aus Phase-1-Profil (has_talent_profile) innerhalb von
  // PublicProfilePage / TalentProfilePage gelesen (via useProfileData).
  
if (selectedProfileId) {
    // HUI-System Bot: spezielles Bot-Profil statt PublicProfilePage
    if (selectedProfileId === SYSTEM_USER_ID) {
      const content = (
        <ProfileErrorBoundary profileId={selectedProfileId} onClose={closeProfileById}>
            <SystemBotProfile
              profileId={selectedProfileId}
              onClose={closeProfileById}
            />
        </ProfileErrorBoundary>
      );
      return portalTarget ? createPortal(content, portalTarget) : content;
    }
    const content = (
      <ProfileErrorBoundary profileId={selectedProfileId} onClose={closeProfileById}>
          <PublicProfilePage
            profileId={selectedProfileId}
            onClose={closeProfileById}
          />
      </ProfileErrorBoundary>
    );
    return portalTarget ? createPortal(content, portalTarget) : content;
  }

  // ── EIGENES PROFIL — IMMER MyBasisProfile (erweiterbar um Talent-Bereich)
  // MyBasisProfile rendert den Talent-Bereich conditional wenn isTalent===true.
  if (showCreatorDashboard) {
    const content = (
      <ProfileErrorBoundary profileId="own" onClose={() => setShowCreatorDashboard(false)}>
        <MyBasisProfile onClose={() => setShowCreatorDashboard(false)} />
      </ProfileErrorBoundary>
    );
    return portalTarget ? createPortal(content, portalTarget) : content;
  }

  // Nichts zu zeigen
  return null;
}
