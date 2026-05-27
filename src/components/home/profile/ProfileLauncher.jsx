// src/components/home/profile/ProfileLauncher.jsx v6 — ID-basierter Modus
// ROUTING: showWirker._isOwnerView === true → CreatorProfilePage
//          sonst                           → WirkerProfilePage
// WICHTIG: CreatorProfilePage ist STATISCH importiert (kein lazy) → kein Suspense-Blackout

import React, { useCallback } from "react";
import { useHome } from "../HomeShell.jsx";
import { useHuiActions, A } from "../../../core/hui.actions.js";
import { S } from "../../../core/hui.sources.js";
import { useHuiFlow } from "../../../core/hui.flow.js";

// ── STATISCH: sofort verfügbar, kein lazy-Blackout ──────────────
// CreatorProfilePage wird immer mitgeladen (Teil des Home-Chunks)
import CreatorProfilePage from "../../../pages/creator-profile/index.jsx";

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
    showWirker, setShowWirker,
    selectedProfileId, closeProfileById,
    showChat,
    setShowChat, setChatRecipient,
    setShowConnect,
  } = useHome();

  // Phase 2: Flow Memory — merkt sich den Weg zurück
  const flow = useHuiFlow();

  console.log("🟣 STEP 5 — ProfileLauncher render", {
    selectedProfileId,
    showWirker: !!showWirker,
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

  // ── LEGACY: showWirker-Objekt Modus (eigenes Profil, Discover, etc.) ──
  if (!showWirker) return null;

  // showWirker normalisieren — kann rohe nav-Daten oder Feed-Items enthalten
  // Feed-Item Guard: type+author → author extrahieren
  const rawForProfile = (showWirker?.type && showWirker?.author && typeof showWirker.author === 'object')
    ? { id: showWirker.author.id, user_id: showWirker.author.id,
        display_name: showWirker.author.name, avatar_url: showWirker.author.avatar,
        username: showWirker.author.username, talent: showWirker.author.talent,
        is_verified: showWirker.author.verified, _raw: showWirker.author,
        _isOwnerView: showWirker._isOwnerView }
    : showWirker;

  const safeProfile = createProfileItem(rawForProfile);

  // Wenn createProfileItem null zurückgibt → nicht rendern, kein Crash
  if (!safeProfile) {
    console.warn("[ProfileLauncher] createProfileItem returned null for:", showWirker);
    return null;
  }

  // Zusätzlich: wenn die normalisierte id leer ist → kein Profil ladbar
  const resolvedId = safeProfile.id;
  if (!resolvedId || (typeof resolvedId === "string" && resolvedId.trim() === "")) {
    console.warn("[ProfileLauncher] Profil-ID leer — kein Render möglich", safeProfile);
    return null;
  }

  const isOwnerView = rawForProfile._isOwnerView === true;

  const handleClose = () => setShowWirker(null);

  // Phase 2 LOOP 1: Chat vom Profil aus — Flow Memory
  const handleChat = (profile) => {
    const recipient = {
      id:           profile?.id || profile?.user_id,
      display_name: profile?.display_name || profile?.full_name || profile?.name || "Creator",
      avatar_url:   profile?.avatar_url   || profile?.img       || null,
      talent:       profile?.talent       || null,
    };
    // Flow Memory: merkt sich dieses Profil für den Return
    // Nach Chat-Close wird das Profil wieder geöffnet (LOOP 1)
    flow.setReturnProfile(showWirker);
    flow.push({ surface: "profile", creatorId: profile?.id, creator: showWirker });

    setChatRecipient(recipient);
    setShowChat(true);
    // Phase 2 LOOP 1: Profil NICHT schließen.
    // _zIndex wird auf 9200 gesetzt wenn showChat=true (Chat liegt drüber bei 9400).
    // setShowWirker(null) hier entfernt — Chat-Close restored das Profil.
  };

  // Phase 23: Buchen → ConnectionCreate (Booking-Request) oder direkter Chat
  const handleBook = (profile) => {
    // Buchen = Verbindungs-Request mit Booking-Intent
    handleChat(profile);  // Vorerst: Chat öffnen (Booking ist Conversation-basiert)
  };

  const handleAction = (key) => { /* Studio, Edit, etc. — erweiterbar */ };

  // ── OWNER VIEW → CreatorProfilePage (statisch, sofort) ──────
  if (isOwnerView) {
    return (
      <CreatorProfilePage
        wirker={rawForProfile}
        onClose={handleClose}
        onAction={handleAction}
      />
    );
  }

  // ── PUBLIC VIEW → WirkerProfilePage (lazy) ──────────────────
  return (
    <React.Suspense fallback={<ProfileLoadingFallback />}>
      <WirkerProfilePage
        wirker={rawForProfile}
        onClose={handleClose}
        onBook={handleBook}
        onChat={handleChat}
        _zIndex={showChat ? 9200 : 9500}
      />
    </React.Suspense>
  );
}
