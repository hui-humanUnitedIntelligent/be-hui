// PublicProfilePreview — zeigt das eigene Profil exakt so, wie andere es sehen
// MERKEN.1A: öffentliche Profilansicht aus Mein HUI heraus
// - Kein Edit-Modus, keine Admin-Komponenten
// - publicView=true erzwingt isOwner=false in TalentProfilePage/BasisProfilePage
import React, { useState, useEffect } from "react";
import { ProfileService } from '../../services/db';
import { supabase } from "../../lib/supabaseClient.js";

const TalentProfilePage = React.lazy(() => import("../../pages/TalentProfilePage.jsx"));
const BasisProfilePage  = React.lazy(() => import("../../pages/BasisProfilePage.jsx"));

function Spinner() {
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:9999,
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
    </div>
  );
}

export default function PublicProfilePreview({ profileId, onClose }) {
  const [profileType, setProfileType] = useState(null); // "talent" | "basis" | null
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    if (!profileId) return;
    ProfileService.getById(profileId) // ProfileService v1.0
      .then(({ data }) => {
        // Identity Contract v1.0: is_talent entfernt — has_talent_profile ist kanonisch
        const isTalent = data?.has_talent_profile || data?.role === "talent" || data?.role === "wirker";
        setProfileType(isTalent ? "talent" : "basis");
        setLoading(false);
      });
  }, [profileId]);

  if (loading) return <Spinner />;

  const ProfileComponent = profileType === "talent" ? TalentProfilePage : BasisProfilePage;

  return (
    // Fullscreen-Overlay — liegt über MyBasisProfile
    <div style={{
      position:"fixed", inset:0, zIndex:9990,
      background:"#F9F7F4",
      overflowY:"auto",
      WebkitOverflowScrolling:"touch",
    }}>
      {/* Info-Banner: "Öffentliche Ansicht" */}
      <div style={{
        position:"sticky", top:0, zIndex:9995,
        background:"linear-gradient(135deg,rgba(22,215,197,0.12),rgba(255,138,107,0.08))",
        borderBottom:"1px solid rgba(22,215,197,0.15)",
        padding:"10px 16px",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        backdropFilter:"blur(10px)",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:15 }}>👁️</span>
          <span style={{
            fontSize:12, fontWeight:700, color:"#16D7C5", letterSpacing:"0.02em",
          }}>
            Öffentliche Ansicht
          </span>
          <span style={{ fontSize:11, color:"rgba(26,26,46,0.45)", fontWeight:400 }}>
            So sehen andere dein Profil
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            padding:"6px 14px", borderRadius:20,
            background:"rgba(26,26,46,0.08)", border:"1px solid rgba(26,26,46,0.10)",
            fontSize:12, fontWeight:700, color:"rgba(26,26,46,0.55)",
            cursor:"pointer", touchAction:"manipulation",
          }}
        >
          ✕ Schließen
        </button>
      </div>

      {/* Profil-Inhalt */}
      <React.Suspense fallback={<Spinner />}>
        <ProfileComponent
          profileId={profileId}
          onClose={onClose}
          publicView={true}
        />
      </React.Suspense>
    </div>
  );
}
