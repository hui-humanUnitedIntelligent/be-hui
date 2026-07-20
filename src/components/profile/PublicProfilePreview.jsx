// PublicProfilePreview — zeigt das eigene Profil exakt so, wie andere es sehen
// MERKEN.1A: öffentliche Profilansicht aus Mein HUI heraus
// - Kein Edit-Modus, keine Admin-Komponenten
// - publicView=true erzwingt isOwner=false in TalentProfilePage/BasisProfilePage
//
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ProfileService } from '../../services/db';

// Lazy imports — kein Blocking
const TalentProfilePage = React.lazy(() => import("../../pages/TalentProfilePage.jsx"));
const BasisProfilePage  = React.lazy(() => import("../../pages/BasisProfilePage.jsx"));

function Spinner() {
  return createPortal(
    <div style={{
      position:"fixed", inset:0, zIndex:10600, /* >BottomNav(10000) */
      display:"flex", alignItems:"center", justifyContent:"center",
      background:"rgba(249,247,244,0.96)",
    }}>
      <div style={{
        width:36, height:36, borderRadius:"50%",
        border:"3px solid rgba(22,215,197,0.18)",
        borderTopColor:"#16D7C5",
        animation:"spin 0.7s linear infinite",
      }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>,
    document.body
  );
}

export default function PublicProfilePreview({ profileId, onClose }) {
  const [profileType, setProfileType] = useState(null); // "talent" | "basis" | null
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    if (!profileId) { setLoading(false); return; }
    let cancelled = false;
    // Timeout-Schutz: max 2500ms warten (war 8000ms — zu lang!)
    const timeout = setTimeout(() => {
      if (!cancelled) { setLoading(false); setProfileType("basis"); }
    }, 2500);
    const timeoutGuard = new Promise((_, rej) =>
      setTimeout(() => rej(new Error("preview-type-timeout")), 2500)
    );
    Promise.race([ProfileService.getById(profileId), timeoutGuard])
      .then(({ data }) => {
        if (cancelled) return;
        const isTalent = data?.has_talent_profile || data?.role === "talent" || data?.role === "wirker";
        setProfileType(isTalent ? "talent" : "basis");
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) { setProfileType("basis"); setLoading(false); }
      })
      .finally(() => clearTimeout(timeout));
    return () => { cancelled = true; clearTimeout(timeout); };
  }, [profileId]);

  if (loading) return <Spinner />;

  const ProfileComponent = profileType === "talent" ? TalentProfilePage : BasisProfilePage;

  return createPortal(
    <div style={{
      position:"fixed", inset:0, zIndex:10500, /* >BottomNav(10000) */
      background:"#F9F7F4",
      overflowY:"auto",
      WebkitOverflowScrolling:"touch",
    }}>
      {/* Floating Schließen-Button oben links */}
      <button
        onClick={onClose}
        style={{
          position:"fixed", top:16, left:16, zIndex:10520,
          width:36, height:36, borderRadius:"50%",
          background:"rgba(26,26,24,0.75)", border:"none",
          backdropFilter:"blur(8px)",
          display:"flex", alignItems:"center", justifyContent:"center",
          cursor:"pointer", touchAction:"manipulation",
          color:"#fff", fontSize:18, fontWeight:300, lineHeight:1,
        }}
      >‹</button>

      {/* Profil-Inhalt — OrbSignatur ist in den Profilseiten integriert */}
      <React.Suspense fallback={<Spinner />}>
        <ProfileComponent
          profileId={profileId}
          onClose={onClose}
          publicView={true}
        />
      </React.Suspense>
    </div>,
    document.body
  );
}
