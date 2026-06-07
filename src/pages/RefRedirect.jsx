// src/pages/RefRedirect.jsx
// ── HUI Ref-Link Weiterleitung ────────────────────────────────
// Route: /ref/:username  OR  /:username (direkt)
// Speichert den Ambassador-Username und leitet in die App weiter.
import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient.js";

const STORAGE_AMB_KEY = "hui_referral_ambassador";

export default function RefRedirect() {
  const { username } = useParams();
  const navigate     = useNavigate();

  useEffect(() => {
    if (!username) { navigate("/home", { replace: true }); return; }

    const run = async () => {
      // Prüfe ob gültiger Ambassador-Link
      const { data } = await supabase
        .from("ambassador_ref_links")
        .select("user_id, username, referral_code")
        .eq("username", username.toLowerCase())
        .single();

      if (data) {
        // In localStorage speichern (7 Tage)
        const expiry = Date.now() + 7 * 24 * 60 * 60 * 1000;
        localStorage.setItem(STORAGE_AMB_KEY, JSON.stringify({ username: data.username, expiry }));
        console.log("[HUI] Referral gespeichert:", data.username);
      }

      // Immer zur App weiterleiten
      navigate("/home", { replace: true });
    };

    run();
  }, [username, navigate]);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
      height: "100vh", background: "#F7F5F2" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🔗</div>
        <div style={{ fontSize: 14, color: "rgba(26,26,24,0.55)" }}>Weiterleitung…</div>
      </div>
    </div>
  );
}
