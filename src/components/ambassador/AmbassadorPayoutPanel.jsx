// src/components/ambassador/AmbassadorPayoutPanel.jsx
// HUI — Ambassador Auszahlungs-Panel (für Studio & Profil)
// ARCH-006.1: Alle Daten via RPC, kein Shadow State
// AMB-PAYOUT-009: Genehmigt/Abgelehnt-Status + Stripe-Connect-Onboarding ergänzt
import React, { useState } from 'react';
import { useAmbassadorPayout } from '../../hooks/useAmbassadorPayout';

function eur(val) { return `€${((val ?? 0)).toFixed(2)}`; }
function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('de-DE', { day:'2-digit', month:'short', year:'numeric' });
}

const STATUS_COLORS = {
  requested: '#ffd43b',
  approved:  '#74c0fc',
  pending:   '#74c0fc',
  paid:      '#51cf66',
  rejected:  '#ff8787',
  failed:    '#ff6b6b',
};

const STATUS_LABELS = {
  requested: 'Offen',
  approved:  'Genehmigt',
  pending:   'Offen',
  paid:      'Ausgezahlt',
  rejected:  'Abgelehnt',
  failed:    'Fehlgeschlagen',
};

export default function AmbassadorPayoutPanel({ ambassadorId }) {
  const {
    availableEur, requestedEur, paidEur, minimumEur,
    canRequest, payouts, loading, requesting,
    requestPayout, fmtAvailable, fmtPaid,
    isStripeConnected, stripeConnectStatus, connecting, startStripeConnect,
  } = useAmbassadorPayout(ambassadorId);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [result,      setResult]      = useState(null);

  const handleRequest = async () => {
    const res = await requestPayout();
    setResult(res);
    setConfirmOpen(false);
  };

  if (loading) return (
    <div style={{ padding: 24, textAlign: 'center', color: '#888', fontSize: 13 }}>
      Lade Auszahlungs-Daten…
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Stripe-Connect-Hinweis: ohne verbundenes Konto kann keine echte Auszahlung erfolgen */}
      {!isStripeConnected && (
        <div style={{
          background: 'rgba(255,212,59,0.08)', border: '1px solid rgba(255,212,59,0.35)',
          borderRadius: 12, padding: '12px 14px', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap',
        }}>
          <div style={{ fontSize: 12, color: '#e0a800', lineHeight: 1.4 }}>
            💳 {stripeConnectStatus === 'onboarding'
              ? 'Stripe-Konto wird noch eingerichtet — bitte Onboarding abschließen.'
              : 'Verbinde ein Stripe-Konto, um Auszahlungen erhalten zu können.'}
          </div>
          <button onClick={startStripeConnect} disabled={connecting} style={{
            padding: '7px 14px', borderRadius: 8, background: '#ffd43b',
            border: 'none', color: '#000', fontWeight: 700, fontSize: 12, cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}>
            {connecting ? '…' : stripeConnectStatus === 'onboarding' ? 'Fortsetzen' : 'Stripe verbinden'}
          </button>
        </div>
      )}

      {/* KPI-Kacheln */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          { label: '💰 Verfügbar',     val: fmtAvailable, color: '#51cf66' },
          { label: '⏳ Angefordert',   val: eur(requestedEur), color: '#ffd43b' },
          { label: '✅ Ausgezahlt',    val: fmtPaid,       color: '#74c0fc' },
        ].map(k => (
          <div key={k.label} style={{
            background: 'rgba(255,255,255,0.05)', border: `1px solid ${k.color}33`,
            borderRadius: 12, padding: '12px 14px',
          }}>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>{k.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: k.color }}>{k.val}</div>
          </div>
        ))}
      </div>

      {/* Auszahlung anfordern */}
      <div style={{
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12, padding: '14px 16px',
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Auszahlung anfordern</div>
        {canRequest ? (
          <>
            {!confirmOpen ? (
              <button onClick={() => setConfirmOpen(true)} style={{
                padding: '8px 18px', borderRadius: 8,
                background: '#51cf66', border: 'none', color: '#000',
                fontWeight: 700, fontSize: 13, cursor: 'pointer',
              }}>
                {fmtAvailable} auszahlen →
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: '#ccc' }}>Sicher? {fmtAvailable} werden beantragt.</span>
                <button onClick={handleRequest} disabled={requesting} style={{
                  padding: '6px 14px', borderRadius: 6, background: '#51cf66',
                  border: 'none', color: '#000', fontWeight: 700, fontSize: 12, cursor: 'pointer',
                }}>
                  {requesting ? '…' : 'Ja, anfordern'}
                </button>
                <button onClick={() => setConfirmOpen(false)} style={{
                  padding: '6px 14px', borderRadius: 6, background: 'transparent',
                  border: '1px solid #555', color: '#999', fontSize: 12, cursor: 'pointer',
                }}>Abbrechen</button>
              </div>
            )}
          </>
        ) : (
          <div style={{ fontSize: 12, color: '#888' }}>
            {availableEur < minimumEur
              ? `Mindestbetrag: €${minimumEur} (aktuell ${eur(availableEur)})`
              : requestedEur > 0
                ? 'Bereits eine Anfrage ausstehend'
                : 'Keine offenen Provisionen'}
          </div>
        )}

        {result && (
          <div style={{
            marginTop: 10, padding: '8px 12px', borderRadius: 8,
            background: result.ok ? '#51cf6622' : '#ff6b6b22',
            border: `1px solid ${result.ok ? '#51cf66' : '#ff6b6b'}44`,
            fontSize: 12, color: result.ok ? '#51cf66' : '#ff6b6b',
          }}>
            {result.ok
              ? `✅ ${eur(result.amount_eur)} beantragt (${result.commissions} Provisionen)`
              : `❌ ${result.error === 'below_minimum' ? `Mindestbetrag nicht erreicht (${eur(result.total_eur)} < €${minimumEur})` : result.error}`}
          </div>
        )}
      </div>

      {/* Letzte Auszahlungen */}
      {payouts.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase',
            letterSpacing: '0.07em', marginBottom: 10 }}>Letzte Auszahlungen</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {payouts.slice(0, 5).map(p => {
              const sc = STATUS_COLORS[p.status] || '#888';
              const label = STATUS_LABELS[p.status] || p.status;
              return (
                <div key={p.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 14px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: sc }}>
                      {eur(p.amount_eur)}
                    </div>
                    <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>
                      {fmtDate(p.requested_at)}
                      {p.failed_reason && ` · ${p.failed_reason}`}
                      {p.rejected_reason && ` · ${p.rejected_reason}`}
                    </div>
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                    background: `${sc}22`, color: sc, border: `1px solid ${sc}44`,
                  }}>{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
