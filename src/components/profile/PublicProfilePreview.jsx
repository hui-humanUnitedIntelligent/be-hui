// PublicProfilePreview — zeigt das eigene Profil exakt so, wie andere es sehen
// MERKEN.1A: öffentliche Profilansicht aus Mein HUI heraus
// - Kein Edit-Modus, keine Admin-Komponenten
// - publicView=true erzwingt isOwner=false in TalentProfilePage/BasisProfilePage
//
// HUI Core Engine v2.0:
// - OrbLeaf: individuelles Blatt aus der Orb Engine
// - dominantPillars: "Wirkt besonders durch" (max. 3 Grundpfeiler)
import React, { useState, useEffect, Suspense } from "react";
import { ProfileService } from '../../services/db';
import { supabase } from "../../lib/supabaseClient.js";

// Lazy imports — kein Blocking
const TalentProfilePage = React.lazy(() => import("../../pages/TalentProfilePage.jsx"));
const BasisProfilePage  = React.lazy(() => import("../../pages/BasisProfilePage.jsx"));

// OrbLeaf: individuelles Blatt (lazy — kein kritischer Pfad)
const OrbLeaf = React.lazy(() =>
  import("../orb/OrbLeaf.jsx").catch(() => ({ default: () => null }))
);

// HUI Pillars
import { dominantPillarLabels } from "../../core/hui.pillars.js";

// useCoreProfile: liest dominantPillars aus Core Engine
import { useCoreProfile } from "../../hooks/useCoreEngine.js";

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

// ─── OrbSignatur: Blatt + "Wirkt besonders durch" ───────────────────────────
// Erscheint im Profil-Banner — dezent, warm, nie dominant.
function OrbSignatur({ profileId }) {
  const { dominantPillars, isLoading } = useCoreProfile(profileId);
  const pillarLabels = dominantPillarLabels(dominantPillars);

  // Wenn noch keine Resonanz → kein Orb anzeigen (neues Mitglied)
  if (isLoading || pillarLabels.length === 0) return null;

  return (
    <div style={{
      padding: "12px 16px 14px",
      borderBottom: "1px solid rgba(26,26,46,0.06)",
      background: "rgba(255,252,248,0.80)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 10,
    }}>
      {/* Blatt */}
      <Suspense fallback={null}>
        <OrbLeaf
          userId={profileId}
          size={40}
          variant="public"
          animate={true}
        />
      </Suspense>

      {/* "Wirkt besonders durch" */}
      <div style={{ textAlign: "center" }}>
        <p style={{
          fontSize: 10.5,
          color: "rgba(26,26,46,0.40)",
          fontWeight: 500,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          margin: "0 0 8px",
        }}>
          Wirkt besonders durch
        </p>
        <div style={{
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
          justifyContent: "center",
        }}>
          {pillarLabels.map(({ pillar, label, icon, colorSoft, colorBorder }) => (
            <span
              key={pillar}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "4px 10px",
                borderRadius: 99,
                background: colorSoft,
                border: `1px solid ${colorBorder}`,
                fontSize: 11.5,
                fontWeight: 600,
                color: "rgba(26,26,46,0.72)",
                letterSpacing: "0.01em",
              }}
            >
              <span style={{ fontSize: 12 }}>{icon}</span>
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PublicProfilePreview({ profileId, onClose }) {
  const [profileType, setProfileType] = useState(null); // "talent" | "basis" | null
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    if (!profileId) return;
    ProfileService.getById(profileId)
      .then(({ data }) => {
        const isTalent = data?.has_talent_profile || data?.role === "talent" || data?.role === "wirker";
        setProfileType(isTalent ? "talent" : "basis");
        setLoading(false);
      });
  }, [profileId]);

  if (loading) return <Spinner />;

  const ProfileComponent = profileType === "talent" ? TalentProfilePage : BasisProfilePage;

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:9990,
      background:"#F9F7F4",
      overflowY:"auto",
      WebkitOverflowScrolling:"touch",
    }}>
      {/* Info-Banner */}
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
          <span style={{ fontSize:12, fontWeight:700, color:"#16D7C5", letterSpacing:"0.02em" }}>
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
        >✕ Schließen</button>
      </div>

      {/* HUI Core Engine: Orb-Signatur + Grundpfeiler (rein additiv) */}
      {profileId && <OrbSignatur profileId={profileId} />}

      {/* Profil-Inhalt (unverändert) */}
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
