// src/components/studio/TransactionDetailSheet.jsx
// ══════════════════════════════════════════════════════════════════════
// TRANSAKTIONS-DETAIL — EIN gemeinsames Detail-Sheet für Käufe, Verkäufe,
// Buchungen, Gebucht-Einträge und Support-Zahlungen (Prinzip 7: keine
// Duplikate, ein Component-Modus mit normalisierten Props je Herkunft).
// Wird über FinanzuebersichtModal geöffnet: Klick auf eine Zeile/Karte
// zeigt hier ALLE Details + alle Aktionen (Chat, Quittung, Empfehlung,
// Ware bestätigen, Profil ansehen).
// Pflicht: createPortal → document.body, zIndex >= 10500 (hier 10550,
// oberhalb des FinanzuebersichtModal-Sheets bei 10500).
// ══════════════════════════════════════════════════════════════════════

import { useState } from "react";
import { createPortal } from "react-dom";
import { HUILogo } from "../brand/HUILogo.jsx";
import { useModalRegistration } from "../../hooks/useModalRegistration.js";

const T = {
  bg:       "#F7F5F0",
  bgCard:   "#FFFFFF",
  teal:     "#0EC4B8",
  tealSoft: "rgba(14,196,184,0.10)",
  tealMid:  "rgba(14,196,184,0.20)",
  ink:      "#1A1A18",
  inkSoft:  "rgba(26,26,24,0.52)",
  inkFaint: "rgba(26,26,24,0.30)",
  border:   "rgba(26,26,24,0.08)",
  green:    "#10B981",
  greenSoft:"rgba(16,185,129,0.10)",
  amber:    "#F59E0B",
  amberSoft:"rgba(245,158,11,0.10)",
  red:      "#DC2626",
  redSoft:  "rgba(220,38,38,0.08)",
  r16: 16, r12: 12, r8: 8, r99: 99,
  ff: "Inter,sans-serif",
};

function eur(val) {
  if (val == null) return "—";
  return Number(val).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}

function StatusChip({ label, color = T.inkFaint, bg = T.border }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: "3px 10px",
      borderRadius: T.r99, background: bg, color, letterSpacing: "0.02em",
    }}>
      {label}
    </span>
  );
}

function Section({ title, children }) {
  if (children == null) return null;
  return (
    <div style={{ marginBottom: 18 }}>
      {title && (
        <div style={{ fontSize: 11, fontWeight: 700, color: T.inkFaint, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

function MetaRow({ label, value }) {
  if (value == null || value === "") return null;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
      <span style={{ fontSize: 12.5, color: T.inkSoft }}>{label}</span>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: T.ink, textAlign: "right", maxWidth: "62%" }}>{value}</span>
    </div>
  );
}

function ActionButton({ children, onClick, variant = "outline", disabled, loading }) {
  const styles = {
    solid:   { background: `linear-gradient(135deg, ${T.teal}, #0DBBAF)`, color: "#fff", border: "none" },
    outline: { background: T.bgCard, color: T.teal, border: `1.5px solid ${T.teal}` },
    receipt: { background: T.bgCard, color: "#22C55E", border: "1.5px solid rgba(34,197,94,0.35)" },
    ghost:   { background: T.bgCard, color: T.inkSoft, border: `1px solid ${T.border}` },
    danger:  { background: T.bgCard, color: T.red, border: "1.5px solid rgba(220,38,38,0.30)" },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        width: "100%", padding: "13px 0", borderRadius: T.r99,
        fontSize: 14, fontWeight: 700, cursor: disabled ? "default" : "pointer",
        fontFamily: T.ff, marginBottom: 10, opacity: disabled || loading ? 0.55 : 1,
        transition: "opacity .15s ease",
        ...styles[variant],
      }}
    >
      {loading ? "Wird bearbeitet…" : children}
    </button>
  );
}

// ── Cover-Bild oder HUI-Logo-Platzhalter (PFLICHTREGEL Bild-Platzhalter) ──
function Cover({ src, imgErr, onErr }) {
  return (
    <div style={{
      width: "100%", height: 180, borderRadius: T.r16, overflow: "hidden",
      background: T.tealSoft, display: "flex", alignItems: "center", justifyContent: "center",
      marginBottom: 16, flexShrink: 0,
    }}>
      {src && !imgErr ? (
        <img src={src} alt="" onError={onErr} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <HUILogo size={44} style={{ opacity: 0.5 }} />
      )}
    </div>
  );
}

/**
 * TransactionDetailSheet
 * @param {object} tx — normalisiertes Transaktions-Objekt (siehe Aufrufstellen in FinanzuebersichtModal.jsx):
 *   {
 *     kindLabel: string,           // "Kauf" | "Verkauf" | "Buchung" | "Gebucht" | "Support"
 *     title: string,
 *     image: string|null,
 *     amount: number,
 *     amountLabel: string,         // "Bezahlt" | "Verdient" | "Betrag"
 *     dateLabel: string,           // formatiertes Datum
 *     statusChips: [{label,color,bg}],
 *     breakdown: [{label, value}], // Preis-Aufschlüsselung
 *     meta: [{label, value}],      // Ort/Zeit/Teilnehmer/Kategorie etc.
 *     description: string|null,    // Beschreibung/Support-Nachricht
 *     person: { name, avatar, email, website, roleLabel, id } | null,
 *     actions: {
 *       onChat, onViewProfile,
 *       onConfirmReceipt, confirmingReceipt, receiptConfirmed,
 *       onDownloadReceipt,
 *       onRecommend, canRecommend,
 *     }
 *   }
 */
export default function TransactionDetailSheet({ tx, onClose }) {
  useModalRegistration(!!tx, onClose, "TransactionDetailSheet");
  const [imgErr, setImgErr] = useState(false);
  const [downloading, setDownloading] = useState(false);

  if (!tx) return null;
  const a = tx.actions || {};

  const handleDownload = async () => {
    if (!a.onDownloadReceipt) return;
    setDownloading(true);
    try { await a.onDownloadReceipt(); } finally { setDownloading(false); }
  };

  const content = (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 10550,
        background: "rgba(26,26,24,0.55)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        fontFamily: T.ff,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 520,
          background: T.bg, borderRadius: "24px 24px 0 0",
          maxHeight: "94vh", display: "flex", flexDirection: "column",
          boxShadow: "0 -4px 32px rgba(26,26,24,0.20)",
        }}
      >
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px", flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: "rgba(26,26,24,0.12)" }} />
        </div>

        {/* Header */}
        <div style={{
          padding: "8px 20px 12px", flexShrink: 0,
          borderBottom: `1px solid ${T.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: 10.5, fontWeight: 700, color: T.teal, textTransform: "uppercase",
              letterSpacing: "0.04em", marginBottom: 3,
            }}>
              {tx.kindLabel}
            </div>
            <div style={{
              fontSize: 17, fontWeight: 800, color: T.ink, letterSpacing: "-0.02em",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {tx.title}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(26,26,24,0.07)", border: "none", cursor: "pointer",
            borderRadius: "50%", width: 32, height: 32, flexShrink: 0, marginLeft: 12,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, color: T.inkSoft,
          }}>✕</button>
        </div>

        {/* Scrollbarer Inhalt */}
        <div style={{
          flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain", scrollbarWidth: "none",
          padding: "16px 20px 12px",
        }}>
          <Cover src={tx.image} imgErr={imgErr} onErr={() => setImgErr(true)} />

          {/* Betrag groß + Status */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "flex-start",
            marginBottom: 14,
          }}>
            <div>
              <div style={{ fontSize: 11, color: T.inkFaint, fontWeight: 600, marginBottom: 2 }}>{tx.amountLabel || "Betrag"}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: T.ink, letterSpacing: "-0.02em" }}>{eur(tx.amount)}</div>
            </div>
            {tx.dateLabel && (
              <div style={{ textAlign: "right", fontSize: 12, color: T.inkFaint, fontWeight: 600, paddingTop: 4 }}>
                {tx.dateLabel}
              </div>
            )}
          </div>

          {Array.isArray(tx.statusChips) && tx.statusChips.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
              {tx.statusChips.map((c, i) => <StatusChip key={i} {...c} />)}
            </div>
          )}

          {tx.description && (
            <Section title="Beschreibung">
              <div style={{
                fontSize: 13.5, color: T.inkSoft, lineHeight: 1.55,
                background: T.bgCard, borderRadius: T.r12, padding: "12px 14px",
                border: `1px solid ${T.border}`,
              }}>
                {tx.description}
              </div>
            </Section>
          )}

          {Array.isArray(tx.breakdown) && tx.breakdown.length > 0 && (
            <Section title="Preis-Aufschlüsselung">
              <div style={{ background: T.bgCard, borderRadius: T.r12, padding: "4px 14px", border: `1px solid ${T.border}` }}>
                {tx.breakdown.map((row, i) => <MetaRow key={i} {...row} />)}
              </div>
            </Section>
          )}

          {Array.isArray(tx.meta) && tx.meta.length > 0 && (
            <Section title="Details">
              <div style={{ background: T.bgCard, borderRadius: T.r12, padding: "4px 14px", border: `1px solid ${T.border}` }}>
                {tx.meta.map((row, i) => <MetaRow key={i} {...row} />)}
              </div>
            </Section>
          )}

          {tx.person && (
            <Section title={tx.person.roleLabel || "Kontakt"}>
              <div style={{
                display: "flex", alignItems: "center", gap: 12,
                background: T.bgCard, borderRadius: T.r12, padding: "12px 14px",
                border: `1px solid ${T.border}`,
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: "50%", overflow: "hidden", flexShrink: 0,
                  background: T.tealSoft, display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {tx.person.avatar
                    ? <img src={tx.person.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span style={{ fontSize: 16, fontWeight: 700, color: T.teal }}>{(tx.person.name || "?").slice(0, 1).toUpperCase()}</span>}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {tx.person.name}
                  </div>
                  {tx.person.email && <div style={{ fontSize: 11, color: T.teal, marginTop: 2 }}>✉ {tx.person.email}</div>}
                  {tx.person.website && <div style={{ fontSize: 11, color: T.teal, marginTop: 1 }}>🔗 {tx.person.website}</div>}
                </div>
              </div>
            </Section>
          )}

          {/* Aktionen */}
          <Section>
            {a.onConfirmReceipt && !a.receiptConfirmed && (
              <ActionButton variant="solid" onClick={a.onConfirmReceipt} loading={a.confirmingReceipt}>
                ✓ Ware erhalten
              </ActionButton>
            )}
            {a.onChat && (
              <ActionButton variant="outline" onClick={a.onChat}>
                {tx.person?.roleLabel ? `${tx.person.roleLabel} kontaktieren` : "Kontaktieren"}
              </ActionButton>
            )}
            {a.canRecommend && a.onRecommend && (
              <ActionButton variant="outline" onClick={a.onRecommend}>
                + Empfehlung schreiben
              </ActionButton>
            )}
            {a.onDownloadReceipt && (
              <ActionButton variant="receipt" onClick={handleDownload} loading={downloading}>
                Quittung herunterladen
              </ActionButton>
            )}
          </Section>
        </div>

        {/* Pflicht: 'Profil ansehen' als dunkler Balken am unteren Rand (globale Regel) */}
        {a.onViewProfile && (
          <div style={{
            flexShrink: 0, padding: "12px 20px calc(16px + env(safe-area-inset-bottom, 0px))",
            borderTop: `1px solid ${T.border}`, background: T.bg,
          }}>
            <button
              onClick={a.onViewProfile}
              style={{
                width: "100%", padding: "14px 0", borderRadius: T.r99,
                background: T.ink, color: "#fff", border: "none",
                fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: T.ff,
              }}
            >
              Profil ansehen
            </button>
          </div>
        )}
        {!a.onViewProfile && (
          <div style={{ flexShrink: 0, height: "calc(12px + env(safe-area-inset-bottom, 0px))" }} />
        )}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
