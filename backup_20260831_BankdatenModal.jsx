// src/components/settings/BankdatenModal.jsx
// BANKDATEN-002 (2026-08-16) — Bankverbindung fuer Auszahlungen (alle Nutzer)
// ═══════════════════════════════════════════════════════════════════
// Erweitert das bestehende AMB-BANK-PAYOUT-001-Muster (verschluesselte
// Speicherung via pgcrypto+Vault, RPC rpc_save_ambassador_bank_details/
// rpc_get_ambassador_bank_status) auf ALLE Nutzer, nicht nur Ambassadors.
// Nach dem Speichern wird zusaetzlich sync-payout-bank-account aufgerufen,
// das aus den Bankdaten einen echten Stripe-Connect-Custom-Account macht
// (profiles.stripe_account_id) -- das Ziel, an das confirm-and-transfer
// bei einer Kaeufer-Bestaetigung ("Ware erhalten") automatisch ueberweist.
// Einmalig auszufuellen, jederzeit aenderbar.
import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../../lib/supabaseClient.js";
import { HUIFinanzIcon, HUISicherheitIcon } from "../../design/icons/HuiSystemIcons.jsx";
import { useModalRegistration } from "../../hooks/useModalRegistration.js";
import { useKeyboardInset } from "../../hooks/useKeyboardInset.js"; // KBD-INSET-FIX (2026-08-23)
import { formatDateDE } from "../../lib/formatters.js";
import { useTranslation } from "../../hooks/useTranslation.js";

const T = {
  bg:       "#F7F5F0",
  bgCard:   "#FFFFFF",
  teal:     "#0EC4B8",
  tealSoft: "rgba(14,196,184,0.10)",
  ink:      "#1A1A18",
  inkSoft:  "rgba(26,26,24,0.52)",
  inkFaint: "rgba(26,26,24,0.28)",
  border:   "rgba(26,26,24,0.09)",
  danger:   "#FF5B5B",
  dangerBg: "rgba(255,91,91,0.08)",
  green:    "#1D9E6F",
  greenBg:  "rgba(29,158,111,0.10)",
  amber:    "#B8860B",
  amberBg:  "rgba(184,134,11,0.10)",
  radius:   14,
};

const inp = {
  width:"100%", boxSizing:"border-box",
  border:"1.5px solid " + T.border, borderRadius:10,
  padding:"11px 14px", fontSize:14, color:T.ink,
  fontFamily:"inherit", marginBottom:10, background:T.bgCard,
};

export default function BankdatenModal({ userId, onClose = () => {}, onSaved = () => {} }) {
  const { t } = useTranslation();
  useModalRegistration(true);
  useKeyboardInset(); // KBD-INSET-FIX (2026-08-23): aktiviert --hui-keyboard-inset CSS-Var
  const [status, setStatus] = useState(null); // { has_bank_details, bank_iban_last4, updated_at }
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [holder, setHolder] = useState("");
  const [iban, setIban] = useState("");
  const [bic, setBic] = useState("");
  const [bankName, setBankName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [syncNote, setSyncNote] = useState(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error: e } = await supabase.rpc("rpc_get_ambassador_bank_status", { p_ambassador_id: userId });
      if (e) throw e;
      setStatus(data);
      if (!data?.has_bank_details) setEditing(true);
    } catch (err) {
      console.warn("[BankdatenModal] load:", err?.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!userId || !iban || !holder) return;
    setSaving(true);
    setError(null);
    setSyncNote(null);
    try {
      const { data, error: e } = await supabase.rpc("rpc_save_ambassador_bank_details", {
        p_ambassador_id: userId, p_iban: iban, p_holder: holder,
        p_bic: bic || null, p_bank_name: bankName || null,
      });
      if (e) throw e;
      if (!data?.ok) { setError(data?.error || "Fehler beim Speichern"); setSaving(false); return; }

      // Bankdaten lokal gespeichert -- jetzt Stripe-Connect-Ziel synchronisieren,
      // damit Auszahlungen bei Kaeufer-Bestaetigung wirklich ankommen.
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-payout-bank-account`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
        });
        const syncResult = await res.json();
        if (!syncResult?.ok) {
          setSyncNote(t("bank.syncNote"));
        }
      } catch (syncErr) {
        console.warn("[BankdatenModal] sync-payout-bank-account:", syncErr);
      }

      setIban(""); setHolder(""); setBic(""); setBankName("");
      setEditing(false);
      await load();
      onSaved?.();
    } catch (err) {
      setError(err?.message || "Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }} role="button" tabIndex={0}
      data-hui-kbd-self-managed
      style={{
      position:"fixed", top:0, left:0, right:0,
      bottom:"var(--hui-keyboard-inset, 0px)", // KBD-INSET-FIX (2026-08-23): Sheet weicht der Tastatur
      background:"rgba(0,0,0,0.45)",
      display:"flex", alignItems:"flex-end", justifyContent:"center", zIndex:10500,
      transition:"bottom .15s ease-out",
    }}>
      <div style={{
        width:"100%", maxWidth:520,
        maxHeight:"calc(88vh - var(--hui-keyboard-inset, 0px))", // KBD-INSET-FIX (2026-08-23)
        overflowY:"auto", transition:"max-height .15s ease-out",
        background:T.bg, borderRadius:"20px 20px 0 0",
        paddingBottom:"calc(24px + env(safe-area-inset-bottom, 0px))",
      }}>
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"max(var(--hui-safe-top, 0px), 18px, env(safe-area-inset-top, 18px)) 18px 13px",
          position:"sticky", top:0, background:T.bg, borderBottom:"1px solid "+T.border,
          borderRadius:"20px 20px 0 0", zIndex:1,
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <HUIFinanzIcon size={16}/>
            <div style={{ fontSize:17, fontWeight:600, color:T.ink }}>{t("bank.title")}</div>
          </div>
          <button onClick={onClose} style={{ background:"rgba(26,26,24,0.07)", border:"none",
            borderRadius:"50%", width:34, height:34, fontSize:16, cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
        </div>

        <div style={{ padding:"18px 16px 8px" }}>
          <p style={{ fontSize:13, color:T.inkSoft, lineHeight:1.5, margin:"0 0 16px" }}>
            Hier hinterlegst du das Bankkonto, auf das dein Geld überwiesen wird, sobald eine
            Zahlung bei dir freigegeben wurde (z.B. wenn ein Käufer den Erhalt bestätigt).
            {t("bank.einmaligHint")}
          </p>

          {loading ? (
            <div style={{ padding:20, textAlign:"center", color:T.inkFaint, fontSize:13 }}>Lädt…</div>
          ) : !editing ? (
            <div style={{
              background:T.greenBg, border:`1px solid ${T.green}33`, borderRadius:T.radius,
              padding:14, display:"flex", flexDirection:"column", gap:10,
            }}>
              <div style={{ fontSize:13, fontWeight:600, color:T.green }}>
                🏦 {t("bank.connectionStored")} {status?.bank_iban_last4 || "????"}
              </div>
              {status?.updated_at && (
                <div style={{ fontSize:11.5, color:T.inkSoft }}>
                  {t("bank.lastUpdated")}: {formatDateDE(status.updated_at)}
                </div>
              )}
              <button onClick={() => setEditing(true)} style={{
                alignSelf:"flex-start", padding:"9px 16px", borderRadius:10,
                background:"transparent", border:`1px solid ${T.border}`, color:T.ink,
                fontWeight:600, fontSize:12.5, cursor:"pointer", fontFamily:"inherit",
              }}>{t("bank.change")}</button>
            </div>
          ) : (
            <div style={{
              background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:T.radius, padding:14,
            }}>
              <div style={{ fontSize:13, fontWeight:600, color:T.ink, marginBottom:10 }}>
                {t("bank.connectionAction", { has: status?.has_bank_details })}
              </div>
              <input value={holder} onChange={(e) => setHolder(e.target.value)}
                placeholder={t("bank.holderPlaceholder")} style={inp}/>
              <input value={iban} onChange={(e) => setIban(e.target.value.toUpperCase())}
                placeholder={t("bank.ibanPlaceholder")} style={inp}/>
              <input value={bic} onChange={(e) => setBic(e.target.value.toUpperCase())}
                placeholder={t("bank.bicPlaceholder")} style={inp}/>
              <input value={bankName} onChange={(e) => setBankName(e.target.value)}
                placeholder={t("bank.bankNamePlaceholder")} style={inp}/>

              <div style={{ display:"flex", alignItems:"flex-start", gap:6, fontSize:11.5,
                color:T.inkSoft, marginBottom:12, lineHeight:1.4 }}>
                <HUISicherheitIcon size={13} style={{ flexShrink:0, marginTop:1 }}/>
                <span>{t("bank.encryptionNote")}</span>
              </div>

              {error && (
                <div style={{ fontSize:12, color:T.danger, marginBottom:10 }}>
                  ❌ {error === "invalid_iban" ? t("bank.invalidIban")
                    : error === "holder_required" ? "Bitte einen Kontoinhaber angeben."
                    : error}
                </div>
              )}
              {syncNote && (
                <div style={{ fontSize:12, color:T.amber, marginBottom:10 }}>ℹ️ {syncNote}</div>
              )}

              <div style={{ display:"flex", gap:8 }}>
                <button onClick={handleSave} disabled={saving || !iban || !holder} style={{
                  flex:1, padding:"11px 16px", borderRadius:10,
                  background:(saving || !iban || !holder) ? "rgba(26,26,24,0.12)" : T.teal,
                  border:"none", color:(saving || !iban || !holder) ? T.inkFaint : "#fff",
                  fontWeight:600, fontSize:13, cursor:(saving || !iban || !holder) ? "not-allowed" : "pointer",
                  fontFamily:"inherit",
                }}>{saving ? "…" : "Speichern"}</button>
                {status?.has_bank_details && (
                  <button onClick={() => setEditing(false)} style={{
                    padding:"11px 16px", borderRadius:10, background:"transparent",
                    border:`1px solid ${T.border}`, color:T.ink, fontWeight:600, fontSize:13,
                    cursor:"pointer", fontFamily:"inherit",
                  }}>Abbrechen</button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
