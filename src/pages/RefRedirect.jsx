// src/pages/RefRedirect.jsx
// ── HUI Ref-Link Weiterleitung ────────────────────────────────
// Route: /ref/:username  OR  /:username (direkt, z.B. be-hui.com/milileo)
// Prüft den Ambassador-Link in der DB, speichert ihn im localStorage, leitet weiter.
import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient.js";

const STORAGE_AMB_KEY = "hui_referral_ambassador";

// Bekannte App-Routen die NICHT als Ref-Link gelten
// NAV-001B: Umbenennung von APP_ROUTES → KNOWN_APP_PATHS (Namenskonflikt mit App.jsx vermieden).
// MIGRATION (NAV-002): Durch import { EXCLUDED_REF_PATHS } from '../routes/registry.js' ersetzen.
// EXCLUDED_REF_PATHS in registry.js ist die konsolidierte Union beider Exclusion-Listen.
const KNOWN_APP_PATHS = new Set([
  'home','login','studio','impact','admin','diagnose','dashboard',
  'profile','work','auth','ref','entdecken','buchung','mein-hui',
  'community','impressum','datenschutz','agb','copyright','cookies',
  'auth-callback','callback',
]);

export default function RefRedirect() {
  const { username } = useParams();
  const navigate     = useNavigate();

  useEffect(() => {
    if (!username) { navigate("/Home", { replace: true }); return; }

    // Wenn es eine bekannte App-Route ist → direkt weiterleiten ohne DB-Abfrage
    if (KNOWN_APP_PATHS.has(username.toLowerCase())) {
      navigate("/Home", { replace: true });
      return;
    }

    const run = async () => {
      try {
        const uname = username.toLowerCase();
        let ambassadorId = null, referralCode = null;

        // Schritt 1: ambassador_ref_links (schneller Cache)
        const { data } = await supabase
          .from("ambassador_ref_links")
          .select("user_id, username, referral_code")
          .eq("username", uname)
          .maybeSingle();
        if (data?.user_id) {
          ambassadorId = data.user_id;
          referralCode = data.referral_code;
        }

        // Schritt 2 (Fallback): profiles direkt — Single Source of Truth
        // (falls ambassador_ref_links veraltet/leer ist, z.B. Status erst kuerzlich bestaetigt)
        if (!ambassadorId) {
          const { data: prof } = await supabase
            .from("profiles")
            .select("id, username")
            .eq("username", uname)
            .or("role.eq.ambassador,is_ambassador.eq.true")
            .eq("ambassador_status", "confirmed")
            .maybeSingle();
          if (prof?.id) ambassadorId = prof.id;
        }

        if (ambassadorId) {
          // Im localStorage speichern (7 Tage)
          const expiry = Date.now() + 7 * 24 * 60 * 60 * 1000;
          localStorage.setItem(STORAGE_AMB_KEY, JSON.stringify({
            username: uname,
            ambassadorId,
            referralCode,
            expiry,
          }));
        }
      } catch (e) {
        // DB-Fehler → trotzdem weiterleiten
      }

      // Immer zur App weiterleiten (Login-Seite zeigen)
      navigate("/login", { replace: true });
    };

    run();
  }, [username, navigate]);

  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
      height:"100vh", background:"#F7F5F2" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:36, marginBottom:12 }}>🔗</div>
        <div style={{ fontSize:14, color:"rgba(26,26,24,0.55)" }}>Weiterleitung…</div>
      </div>
    </div>
  );
}
