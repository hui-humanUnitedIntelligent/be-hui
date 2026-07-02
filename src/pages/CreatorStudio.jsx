// CreatorStudio.jsx — Offizielles Creator Studio (Route /studio)
// Phase 1.2: Einziger Einstiegspunkt — rendert HuiStudio im Route-Modus.

import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { supabase } from "../lib/supabaseClient";
import HuiStudio from "../components/studio/HuiStudio.jsx";

const SECTION_ALIASES = {
  tickets: "tickets",
  support: "support",
  content: "content",
};

export default function CreatorStudio() {
  const navigate = useNavigate();
  const { section: routeSection } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const querySection = searchParams.get("section");
  const initialSection = SECTION_ALIASES[routeSection || querySection] || routeSection || querySection || null;

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) setProfile(data);
        setLoading(false);
      });
  }, [user?.id]);

  if (loading) {
    return (
      <div style={{
        minHeight: "100dvh", display: "flex", alignItems: "center",
        justifyContent: "center", background: "#F7F5F0",
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          border: "2px solid #EEEBE6", borderTopColor: "#16D7C5",
          animation: "hui-spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes hui-spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{
        minHeight: "100dvh", display: "flex", alignItems: "center",
        justifyContent: "center", background: "#F7F5F0",
        padding: 24, textAlign: "center", color: "rgba(26,26,24,0.55)",
        fontFamily: "-apple-system,system-ui,sans-serif",
      }}>
        Profil nicht gefunden. Bitte erneut anmelden.
      </div>
    );
  }

  return (
    <HuiStudio
      profile={profile}
      initialSection={initialSection}
      onClose={() => navigate("/Home")}
      onProfileUpdate={(upd) => setProfile((p) => ({ ...p, ...upd }))}
    />
  );
}
