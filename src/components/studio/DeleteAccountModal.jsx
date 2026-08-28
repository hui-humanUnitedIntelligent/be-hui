// src/components/studio/DeleteAccountModal.jsx
// ═══════════════════════════════════════════════════════════════════
// ACCOUNT-DELETION-001 — Warn-Bestätigung vor endgültiger Account-Löschung
//
// Zweck: Sicherheits-Gate vor supabase.functions.invoke('delete-account').
// Der Nutzer muss aktiv "LÖSCHEN" eintippen, bevor der finale Button aktiv
// wird — Standard-Pattern für unwiderrufliche, destruktive Aktionen.
//
// Nach Erfolg: signOut() + Redirect auf /login (gleiches Muster wie
// SettingsModal.jsx "Abmelden", siehe Zeile 387-388 dort).
// ═══════════════════════════════════════════════════════════════════
import { useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../../lib/supabaseClient.js";
import { platformPath } from "../../lib/platform.js";
import { useTranslation } from "../../hooks/useTranslation.js";

const T = {
  bg: "#FAF9F7", coral: "#FF4D4D", coralSoft: "rgba(255,77,77,0.10)",
  ink: "#1A1A18", inkSoft: "rgba(26,26,24,0.55)", border: "rgba(26,26,24,0.10)",
  r16: 16, r12: 12, ff: "Inter, system-ui, sans-serif",
};

const CONFIRM_WORD = t("del.confirmWord");

export default function DeleteAccountModal({ onClose = () => {} }) {
  const { t } = useTranslation();
  const [step, setStep] = useState(1); // 1 = Warnung, 2 = Eingabe-Bestätigung
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  const canConfirm = confirmText.trim().toUpperCase() === CONFIRM_WORD;

  const handleDelete = async () => {
    if (!canConfirm || deleting) return;
    setDeleting(true);
    setError(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error("Sitzung abgelaufen. Bitte neu einloggen und erneut versuchen.");

      const { data, error: fnErr } = await supabase.functions.invoke("delete-account", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (fnErr) throw new Error(fnErr.message || t("del.loeschungFehlgeschlagen"));
      if (data?.error) throw new Error(data.detail || data.error);

      setDone(true);
      // kurz sichtbar lassen, dann ausloggen + zur Login-Seite
      setTimeout(async () => {
        await supabase.auth.signOut().catch(() => {});
        window.location.href = platformPath("/login");
      }, 1800);
    } catch (e) {
      setError(e.message || t("del.unbekannterFehler"));
      setDeleting(false);
    }
  };

  const modal = (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 10550,
        background: "rgba(26,26,24,0.65)", display: "flex",
        alignItems: "center", justifyContent: "center", padding: 20,
      }}
      onClick={(e) => { if (e.target === e.currentTarget && !deleting) onClose(); }}
    >
      <div
        style={{
          width: "100%", maxWidth: 420, background: T.bg,
          borderRadius: T.r16 + 4, padding: 24, boxShadow: "0 12px 48px rgba(26,26,24,0.35)",
          fontFamily: T.ff, maxHeight: "88dvh", overflowY: "auto",
        }}
      >
        {done ? (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.ink }}>
              {t("del.accountGeloescht")}
            </div>
            <div style={{ fontSize: 13, color: T.inkSoft, marginTop: 8 }}>
              Du wirst gleich abgemeldet…
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                background: T.coralSoft, display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 20,
              }}>⚠️</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: T.coral, letterSpacing: "-0.01em" }}>
                {t("del.accountLoeschen")}
              </div>
            </div>

            {step === 1 && (
              <>
                <div style={{ fontSize: 14, color: T.ink, lineHeight: 1.55, marginBottom: 16 }}>
                  Diese Aktion ist <strong>unwiderruflich</strong>. Es wird{" "}
                  <strong>{t("del.alles")}</strong> {t("del.geloeschtWas")}
                  in deinem Account gespeichert ist:
                </div>
                <ul style={{
                  margin: "0 0 16px", padding: 0, listStyle: "none",
                  display: "flex", flexDirection: "column", gap: 8,
                }}>
                  {[
                    "Profil, Bio, Fotos & Standort",
                    "Werke, Talente, Erlebnisse & Momente",
                    "Kommentare, Reaktionen, Nachrichten",
                    "Follower, Favoriten, Empfehlungen",
                    "Deine E-Mail-Adresse — sie wird komplett entfernt",
                  ].map((t) => (
                    <li key={t} style={{ display: "flex", gap: 8, fontSize: 13, color: T.inkSoft }}>
                      <span style={{ color: T.coral, flexShrink: 0 }}>✕</span>{t}
                    </li>
                  ))}
                </ul>
                <div style={{
                  padding: "10px 14px", borderRadius: T.r12, background: T.coralSoft,
                  border: `1px solid ${T.coral}30`, fontSize: 12.5, color: T.coral,
                  fontWeight: 600, marginBottom: 18, lineHeight: 1.5,
                }}>
                  {t("del.keineWiederherstellung")}
                  {t("del.emailNeuRegistrieren")}
                  {t("del.fuerImmerWeg")}
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={onClose} style={btnSecondary}>Abbrechen</button>
                  <button onClick={() => setStep(2)} style={btnDanger}>Verstanden, weiter</button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div style={{ fontSize: 14, color: T.ink, lineHeight: 1.55, marginBottom: 14 }}>
                  {t("del.umZuLoeschen")} <strong>{CONFIRM_WORD}</strong> {t("del.inDasFeld")}
                  Feld unten ein.
                </div>
                <input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={CONFIRM_WORD}
                  disabled={deleting}
                  autoCapitalize="characters"
                  style={{
                    width: "100%", padding: "12px 14px", borderRadius: T.r12,
                    border: `1.5px solid ${canConfirm ? T.coral : T.border}`,
                    fontSize: 15, fontFamily: T.ff, fontWeight: 600,
                    color: T.ink, background: "#fff", marginBottom: 14,
                    boxSizing: "border-box", outline: "none",
                  }}
                />
                {error && (
                  <div style={{
                    padding: "10px 14px", borderRadius: T.r12, background: T.coralSoft,
                    border: `1px solid ${T.coral}40`, fontSize: 13, color: T.coral,
                    fontWeight: 600, marginBottom: 14,
                  }}>
                    ❌ {error}
                  </div>
                )}
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={onClose} disabled={deleting} style={btnSecondary}>Abbrechen</button>
                  <button
                    onClick={handleDelete}
                    disabled={!canConfirm || deleting}
                    style={{
                      ...btnDanger,
                      opacity: (!canConfirm || deleting) ? 0.5 : 1,
                      cursor: (!canConfirm || deleting) ? "not-allowed" : "pointer",
                    }}
                  >
                    {deleting ? t("del.wirdGeloescht") : t("del.endgueltigLoeschen")}
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

const btnBase = {
  flex: 1, padding: "13px", borderRadius: 14, border: "none",
  fontSize: 14, fontWeight: 700, fontFamily: T.ff, cursor: "pointer",
  transition: "all .2s",
};
const btnSecondary = {
  ...btnBase, background: "rgba(26,26,24,0.06)", color: T.ink,
};
const btnDanger = {
  ...btnBase, background: T.coral, color: "#fff",
  boxShadow: "0 4px 16px rgba(255,77,77,0.30)",
};
