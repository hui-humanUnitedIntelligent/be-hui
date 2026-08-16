// src/components/studio/TransactionDetailSheet.jsx
// ══════════════════════════════════════════════════════════════════════
// TRANSAKTIONS-DETAIL — EIN gemeinsames Detail-Sheet für Käufe, Verkäufe,
// Buchungen, Gebucht-Einträge und Support-Zahlungen (Prinzip 7: keine
// Duplikate, ein Component-Modus mit normalisierten Props je Herkunft).
// Wird über FinanzuebersichtModal geöffnet: Klick auf eine Zeile/Karte
// zeigt hier ALLE Details + alle Aktionen (Chat, Beleg, Empfehlung,
// Ware bestätigen, Nicht erhalten, Profil ansehen).
// Pflicht: createPortal → document.body, zIndex >= 10500 (hier 10550,
// oberhalb des FinanzuebersichtModal-Sheets bei 10500).
// ══════════════════════════════════════════════════════════════════════

import { useState } from "react";
import { createPortal } from "react-dom";
import { HUILogo } from "../brand/HUILogo.jsx";
import { useModalRegistration } from "../../hooks/useModalRegistration.js";
import { formatEUR } from "../../lib/formatters.js";
import { useSheetDrag } from "../../hooks/useSheetDrag.js";

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
  greenMid: "rgba(16,185,129,0.20)",
  amber:    "#F59E0B",
  amberSoft:"rgba(245,158,11,0.10)",
  red:      "#DC2626",
  redSoft:  "rgba(220,38,38,0.08)",
  redMid:   "rgba(220,38,38,0.20)",
  r16: 16, r12: 12, r8: 8, r99: 99,
  ff: "Inter,sans-serif",
};

function eur(val) {
  if (val == null) return "—";
  return formatEUR(Number(val));
}

function StatusChip({ label, color = T.inkFaint, bg = T.border }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: "3px 10px",
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
        <div style={{ fontSize: 11, fontWeight: 600, color: T.inkFaint, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>
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
    receipt: { background: T.bgCard, color: "#22C55E", border: `1.5px solid rgba(34,197,94,0.35)` },
    ghost:   { background: T.bgCard, color: T.inkSoft, border: `1px solid ${T.border}` },
    danger:  { background: T.bgCard, color: T.red, border: `1.5px solid rgba(220,38,38,0.30)` },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        width: "100%", padding: "13px 0", borderRadius: T.r99,
        fontSize: 14, fontWeight: 600, cursor: disabled ? "default" : "pointer",
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
 * @param {object} tx — normalisiertes Transaktions-Objekt:
 *   {
 *     kindLabel: string,           // "Kauf" | "Verkauf" | "Buchung" | "Gebucht" | "Support"
 *     title: string,
 *     image: string|null,
 *     amount: number,
 *     amountLabel: string,
 *     dateLabel: string,
 *     statusChips: [{label,color,bg}],
 *     breakdown: [{label, value}],
 *     meta: [{label, value}],
 *     description: string|null,
 *     person: { name, avatar, email, website, roleLabel, id } | null,
 *     actions: {
 *       onChat, onViewProfile,
 *       onConfirmReceipt, confirmingReceipt, receiptConfirmed,
 *       onDispute, disputing,                    // NEU: Nicht erhalten
 *       disputeOpen,                              // NEU: Dispute bereits offen
 *       onDownloadReceipt,
 *       onRecommend, canRecommend,
 *     }
 *   }
 */
export default function TransactionDetailSheet({ tx, onClose = () => {} }) {
  const { dragHandlers, sheetTransform, sheetTransition } = useSheetDrag(onClose);
  useModalRegistration(!!tx, onClose, "TransactionDetailSheet");
  const [imgErr, setImgErr] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeNote, setDisputeNote] = useState("");
  const [showShipConfirm, setShowShipConfirm] = useState(false);
  const [showReceiveConfirm, setShowReceiveConfirm] = useState(false);

  if (!tx) return null;
  const a = tx.actions || {};

  const handleDownload = async () => {
    if (!a.onDownloadReceipt) return;
    setDownloading(true);
    try { await a.onDownloadReceipt(); } finally { setDownloading(false); }
  };

  const handleDispute = async () => {
    if (!a.onDispute) return;
    await a.onDispute(disputeNote.trim() || undefined);
    setShowDisputeForm(false);
    setDisputeNote("");
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
          background: T.bg, borderRadius: "24px 24px 0 0", transform: sheetTransform, transition: sheetTransition,
          maxHeight: "94vh", display: "flex", flexDirection: "column",
          boxShadow: "0 -4px 32px rgba(26,26,24,0.20)",
        }}
      >
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px", flexShrink: 0 }}>
          <div {...dragHandlers} style={{ touchAction:"none", cursor:"grab", width: 36, height: 4, borderRadius: 99, background: "rgba(26,26,24,0.12)" }} />
        </div>

        {/* Header */}
        <div style={{
          padding: "8px 20px 12px", flexShrink: 0,
          borderBottom: `1px solid ${T.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: 10.5, fontWeight: 600, color: T.teal, textTransform: "uppercase",
              letterSpacing: "0.04em", marginBottom: 3,
            }}>
              {tx.kindLabel}
            </div>
            <div style={{
              fontSize: 17, fontWeight: 600, color: T.ink, letterSpacing: "-0.02em",
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
              <div style={{ fontSize: 26, fontWeight: 600, color: T.ink, letterSpacing: "-0.02em" }}>{eur(tx.amount)}</div>
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
                {tx.breakdown.map((row, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < tx.breakdown.length - 1 ? `1px solid ${T.border}` : "none" }}>
                    <span style={{ fontSize: 13, color: T.inkSoft }}>{row.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{row.value}</span>
                  </div>
                ))}
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
                <div style={{ width: 40, height: 40, borderRadius: "50%", overflow: "hidden", background: T.tealSoft, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {tx.person.avatar
                    ? <img src={tx.person.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span style={{ fontSize: 16, fontWeight: 600, color: T.teal }}>{(tx.person.name || "?").slice(0, 1).toUpperCase()}</span>}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {tx.person.name}
                  </div>
                  {tx.person.email && <div style={{ fontSize: 11, color: T.teal, marginTop: 2 }}>✉ {tx.person.email}</div>}
                  {tx.person.website && <div style={{ fontSize: 11, color: T.teal, marginTop: 1 }}>🔗 {tx.person.website}</div>}
                </div>
              </div>
            </Section>
          )}

          {/* ── VERKÄUFER: "Versendet" Button ── */}
          {a.onMarkShipped && !a.shipped && (
            <Section>
              <div style={{
                background: T.tealSoft, borderRadius: T.r12, padding: "16px 16px 12px",
                border: `1.5px solid ${T.teal}`,
              }}>
                <div style={{
                  fontSize: 13, fontWeight: 700, color: T.teal, marginBottom: 6,
                }}>
                  Versand
                </div>
                <div style={{ fontSize: 13, color: T.inkSoft, lineHeight: 1.5, marginBottom: 14 }}>
                  Markiere diesen Verkauf als versendet, sobald du das Werk verschickt hast.
                  Der Käufer erhält eine Benachrichtigung.
                </div>
                {showShipConfirm ? (
                  <div style={{ display: "flex", gap: 10, marginBottom: 4 }}>
                    <button
                      onClick={() => setShowShipConfirm(false)}
                      style={{
                        flex: 1, padding: "13px 0", borderRadius: T.r99,
                        background: T.bgCard, color: T.inkSoft,
                        border: `1px solid ${T.border}`, fontSize: 14, fontWeight: 600,
                        cursor: "pointer", fontFamily: T.ff,
                      }}
                    >
                      Abbrechen
                    </button>
                    <button
                      onClick={() => { a.onMarkShipConfirm?.() || a.onMarkShipped?.(); }}
                      disabled={a.shipping}
                      style={{
                        flex: 1, padding: "13px 0", borderRadius: T.r99,
                        background: a.shipping ? "rgba(14,196,184,0.35)" : T.teal,
                        color: "#fff", border: "none", fontSize: 14, fontWeight: 600,
                        cursor: a.shipping ? "not-allowed" : "pointer", fontFamily: T.ff,
                        opacity: a.shipping ? 0.6 : 1,
                      }}
                    >
                      {a.shipping ? "Wird markiert…" : "✓ Ja, versendet"}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowShipConfirm(true)}
                    style={{
                      width: "100%", padding: "13px 0", borderRadius: T.r99,
                      background: T.teal, color: "#fff", border: "none",
                      fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: T.ff,
                    }}
                  >
                    Als versendet markieren
                  </button>
                )}
              </div>
            </Section>
          )}

          {/* ── VERKÄUFER: Versand bestätigt ── */}
          {a.shipped && a.shippedAt && (
            <Section>
              <div style={{
                background: T.greenSoft, borderRadius: T.r12, padding: "14px 16px",
                border: `1.5px solid ${T.greenMid}`,
                fontSize: 13, color: T.inkSoft, lineHeight: 1.5,
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <span style={{ fontSize: 18 }}>✅</span>
                <div>
                  <div style={{ fontWeight: 600, color: T.green }}>Versendet</div>
                  Versendet am {a.shippedAt}
                </div>
              </div>
            </Section>
          )}

                    {/* ── KÄUFER-BESTÄTIGUNG: "Bestätigung erforderlich" ── */}
          {a.onConfirmReceipt && !a.receiptConfirmed && !a.disputeOpen && !showDisputeForm && (
            <Section>
              <div style={{
                background: T.amberSoft, borderRadius: T.r12, padding: "16px 16px 12px",
                border: `1.5px solid ${T.amber}`,
              }}>
                <div style={{
                  fontSize: 13, fontWeight: 700, color: T.amber, marginBottom: 6,
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  ⚠ Bestätigung erforderlich
                </div>
                <div style={{ fontSize: 13, color: T.inkSoft, lineHeight: 1.5, marginBottom: 14 }}>
                  Bitte bestätige, dass du dein {tx.kindLabel === "Buchung" ? "Talent/Erlebnis erhalten hast" : "Werk erhalten hast"}.
                  Erst dann wird die Zahlung an den Anbieter freigegeben.
                </div>
                {showReceiveConfirm ? (
                  <div style={{ marginBottom: 4 }}>
                    <div style={{
                      fontSize: 12.5, color: T.red, fontWeight: 600,
                      marginBottom: 10, lineHeight: 1.5,
                    }}>
                      ⚠ Achtung: Wenn du bestätigst, dass du die Ware erhalten hast,
                      wird die Zahlung an den Verkäufer freigegeben.
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button
                        onClick={() => setShowReceiveConfirm(false)}
                        style={{
                          flex: 1, padding: "13px 0", borderRadius: T.r99,
                          background: T.bgCard, color: T.inkSoft,
                          border: `1px solid ${T.border}`, fontSize: 14, fontWeight: 600,
                          cursor: "pointer", fontFamily: T.ff,
                        }}
                      >
                        Abbrechen
                      </button>
                      <button
                        onClick={a.onConfirmReceipt}
                        disabled={a.confirmingReceipt}
                        style={{
                          flex: 1, padding: "13px 0", borderRadius: T.r99,
                          background: a.confirmingReceipt ? "rgba(16,185,129,0.35)" : `linear-gradient(135deg, ${T.green}, #059669)`,
                          color: "#fff", border: "none", fontSize: 14, fontWeight: 600,
                          cursor: a.confirmingReceipt ? "not-allowed" : "pointer", fontFamily: T.ff,
                          opacity: a.confirmingReceipt ? 0.6 : 1,
                        }}
                      >
                        {a.confirmingReceipt ? "…" : "✓ Ja, erhalten"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 10, marginBottom: 4 }}>
                    <button
                      onClick={() => setShowReceiveConfirm(true)}
                      style={{
                        flex: 1, padding: "13px 0", borderRadius: T.r99,
                        background: `linear-gradient(135deg, ${T.green}, #059669)`,
                        color: "#fff", border: "none", fontSize: 14, fontWeight: 600,
                        cursor: "pointer", fontFamily: T.ff,
                      }}
                    >
                      ✓ Ware erhalten
                    </button>
                    <button
                      onClick={() => setShowDisputeForm(true)}
                      style={{
                        flex: 1, padding: "13px 0", borderRadius: T.r99,
                        background: T.bgCard, color: T.red,
                        border: `1.5px solid ${T.redMid}`,
                        fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: T.ff,
                      }}
                    >
                      ✕ Nicht erhalten
                    </button>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* ── DISPUTE-FORM: "Nicht erhalten" → Begründung eingeben ── */}
          {showDisputeForm && (
            <Section>
              <div style={{
                background: T.redSoft, borderRadius: T.r12, padding: "16px 16px 12px",
                border: `1.5px solid ${T.redMid}`,
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.red, marginBottom: 6 }}>
                  Nicht erhalten melden
                </div>
                <div style={{ fontSize: 13, color: T.inkSoft, lineHeight: 1.5, marginBottom: 12 }}>
                  Beschreibe kurz was passiert ist. Der Verkäufer wird benachrichtigt und kann Beweise vorlegen. Ein Admin prüft den Fall.
                </div>
                <textarea
                  value={disputeNote}
                  onChange={(e) => setDisputeNote(e.target.value)}
                  placeholder="Was ist passiert?"
                  rows={3}
                  style={{
                    width: "100%", resize: "none", border: `1px solid ${T.border}`,
                    borderRadius: T.r8, padding: "10px 12px", fontSize: 14, color: T.ink,
                    background: "#fff", outline: "none", marginBottom: 10,
                    fontFamily: T.ff, lineHeight: 1.5, boxSizing: "border-box",
                  }}
                />
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={() => { setShowDisputeForm(false); setDisputeNote(""); }}
                    style={{
                      flex: 1, padding: "12px 0", borderRadius: T.r99,
                      background: T.bgCard, color: T.inkSoft,
                      border: `1px solid ${T.border}`, fontSize: 14, fontWeight: 600,
                      cursor: "pointer", fontFamily: T.ff,
                    }}
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleDispute}
                    disabled={a.disputing}
                    style={{
                      flex: 1, padding: "12px 0", borderRadius: T.r99,
                      background: a.disputing ? "rgba(220,38,38,0.35)" : T.red,
                      color: "#fff", border: "none", fontSize: 14, fontWeight: 600,
                      cursor: a.disputing ? "not-allowed" : "pointer", fontFamily: T.ff,
                    }}
                  >
                    {a.disputing ? "…" : "Fall melden"}
                  </button>
                </div>
              </div>
            </Section>
          )}

          {/* ── DISPUTE BEREITS OFFEN ── */}
          {a.disputeOpen && !a.receiptConfirmed && (
            <Section>
              <div style={{
                background: T.amberSoft, borderRadius: T.r12, padding: "14px 16px",
                border: `1.5px solid ${T.amber}`,
                fontSize: 13, color: T.inkSoft, lineHeight: 1.5,
              }}>
                <div style={{ fontWeight: 700, color: T.amber, marginBottom: 4 }}>
                  ⚖ Fall in Prüfung
                </div>
                Du hast den Erhalt nicht bestätigt. Ein Admin prüft den Fall und entscheidet über die Auszahlung.
                Du wirst benachrichtigt sobald es ein Update gibt.
              </div>
            </Section>
          )}

          {/* ── BESTÄTIGT — Erfolgs-Anzeige ── */}
          {a.receiptConfirmed && (
            <Section>
              <div style={{
                background: T.greenSoft, borderRadius: T.r12, padding: "14px 16px",
                border: `1.5px solid ${T.greenMid}`,
                fontSize: 13, color: T.inkSoft, lineHeight: 1.5,
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <span style={{ fontSize: 18 }}>✅</span>
                <div>
                  <div style={{ fontWeight: 600, color: T.green }}>Erhalten</div>
                  Du hast den Erhalt bestätigt. Die Zahlung wurde freigegeben.
                </div>
              </div>
            </Section>
          )}

          {/* Standard-Aktionen */}
          <Section>
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
                Beleg herunterladen
              </ActionButton>
            )}
          </Section>
        </div>

        {/* Pflicht: 'Profil ansehen' als dunkler Balken am unteren Rand (globale Regel) */}
        {a.onViewProfile && (
          <div style={{
            flexShrink: 0, padding: "12px 20px calc(16px + max(var(--hui-safe-bottom, 0px), env(safe-area-inset-bottom, 0px), 0px))",
            borderTop: `1px solid ${T.border}`, background: T.bg,
          }}>
            <button
              onClick={a.onViewProfile}
              style={{
                width: "100%", padding: "14px 0", borderRadius: T.r99,
                background: T.ink, color: "#fff", border: "none",
                fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: T.ff,
              }}
            >
              Profil ansehen
            </button>
          </div>
        )}
        {!a.onViewProfile && (
          <div style={{ flexShrink: 0, height: "calc(12px + max(var(--hui-safe-bottom, 0px), env(safe-area-inset-bottom, 0px), 0px))" }} />
        )}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
