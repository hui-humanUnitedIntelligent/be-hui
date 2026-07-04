// src/components/ambassador/AmbassadorPayoutPanel.jsx
// HUI — Ambassador Auszahlungs-Panel (für Studio & Profil)
// ARCH-006.1: Alle Daten via RPC, kein Shadow State
// AMB-PAYOUT-009: Genehmigt/Abgelehnt-Status ergänzt
// AMB-BANK-PAYOUT-001: Bankdaten statt Stripe-Connect
// FIX (2026-07-04): Komponente war komplett im Dark-Theme gestylt (weißer Text, dunkle
// rgba-Ränder), wird aber im hellen Studio-Modal (T.bg #F7F5F0, T.ink #1A1A18) angezeigt --
// Text/Eingabefelder waren dadurch praktisch unsichtbar. Komplett auf Light-Theme umgestellt,
// passend zu den Farbwerten aus HuiStudio.jsx (T-Objekt).
import React, { useState, useEffect } from 'react';
import { useAmbassadorPayout } from '../../hooks/useAmbassadorPayout';

// Gleiche Palette wie T-Objekt in HuiStudio.jsx (lokal dupliziert, kein Import-Kopplungsrisiko)
const ink       = '#1A1A18';
const inkSoft   = 'rgba(26,26,24,0.62)';
const inkFaint  = 'rgba(26,26,24,0.38)';
const border    = 'rgba(26,26,24,0.10)';
const bgCard    = '#FFFFFF';
const teal      = '#0EC4B8';
const green     = '#2E9E5B';
const greenBg   = 'rgba(46,158,91,0.08)';
const greenBd   = 'rgba(46,158,91,0.30)';
const amber     = '#B9740A';
const amberBg   = 'rgba(185,116,10,0.08)';
const amberBd   = 'rgba(185,116,10,0.30)';
const red       = '#C0392B';
const redBg     = 'rgba(192,57,43,0.08)';

function eur(val) { return `€${((val ?? 0)).toFixed(2)}`; }
function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('de-DE', { day:'2-digit', month:'short', year:'numeric' });
}

const STATUS_COLORS = {
  requested: amber,
  approved:  teal,
  pending:   teal,
  paid:      green,
  rejected:  red,
  failed:    red,
};

const STATUS_LABELS = {
  requested: 'Offen',
  approved:  'Genehmigt',
  pending:   'Offen',
  paid:      'Ausgezahlt',
  rejected:  'Abgelehnt',
  failed:    'Fehlgeschlagen',
};

const inputStyle = {
  padding: '9px 12px', borderRadius: 8, border: `1px solid ${border}`,
  background: bgCard, color: ink, fontSize: 13, outline: 'none',
};

export default function AmbassadorPayoutPanel({ ambassadorId }) {
  const {
    availableEur, requestedEur, paidEur, minimumEur,
    canRequest, payouts, loading, requesting,
    requestPayout, fmtAvailable, fmtPaid,
    hasBankDetails, bankIbanLast4, savingBank, saveBankDetails,
  } = useAmbassadorPayout(ambassadorId);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [result,      setResult]      = useState(null);
  const [amountInput, setAmountInput] = useState('');
  // AMB-BANK-PAYOUT-001: Bankdaten-Formular statt Stripe-Connect
  const [bankFormOpen, setBankFormOpen] = useState(false);
  const [ibanInput,    setIbanInput]    = useState('');
  const [holderInput,  setHolderInput]  = useState('');
  const [bicInput,     setBicInput]     = useState('');
  const [bankNameInput, setBankNameInput] = useState('');
  const [bankResult,   setBankResult]   = useState(null);

  // AMB-PAYOUT-016: Betrag vorbelegen mit dem vollen verfuegbaren Betrag, sobald geladen
  useEffect(() => {
    if (availableEur > 0 && !amountInput) setAmountInput(availableEur.toFixed(2));
  }, [availableEur]); // eslint-disable-line react-hooks/exhaustive-deps

  const amountNum = parseFloat(amountInput.replace(',', '.')) || 0;
  const amountValid = amountNum > 0 && amountNum <= availableEur && amountNum >= minimumEur;

  const handleRequest = async () => {
    const res = await requestPayout(amountNum);
    setResult(res);
    setConfirmOpen(false);
  };

  // AMB-BANK-PAYOUT-001: Bankdaten speichern statt Stripe-Connect-Onboarding
  const handleSaveBank = async () => {
    const res = await saveBankDetails(ibanInput, holderInput, bicInput || null, bankNameInput || null);
    setBankResult(res);
    if (res?.ok) { setBankFormOpen(false); setIbanInput(''); setHolderInput(''); setBicInput(''); setBankNameInput(''); }
  };

  if (loading) return (
    <div style={{ padding: 24, textAlign: 'center', color: inkFaint, fontSize: 13 }}>
      Lade Auszahlungs-Daten…
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* AMB-BANK-PAYOUT-001: Bankverbindung statt Stripe-Connect-Onboarding */}
      <div style={{
        background: hasBankDetails ? greenBg : amberBg,
        border: `1px solid ${hasBankDetails ? greenBd : amberBd}`,
        borderRadius: 12, padding: '12px 14px',
      }}>
        {!bankFormOpen ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: hasBankDetails ? green : amber, lineHeight: 1.4 }}>
              {hasBankDetails
                ? `🏦 Bankverbindung hinterlegt: IBAN endet auf •••• ${bankIbanLast4 || '????'}`
                : '🏦 Bitte hinterlege deine Bankverbindung, um Auszahlungen erhalten zu können.'}
            </div>
            <button onClick={() => setBankFormOpen(true)} style={{
              padding: '7px 14px', borderRadius: 8,
              background: hasBankDetails ? 'transparent' : amber,
              border: hasBankDetails ? `1px solid ${border}` : 'none',
              color: hasBankDetails ? ink : '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}>
              {hasBankDetails ? 'Ändern' : 'Bankdaten hinterlegen'}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: amber }}>Bankverbindung {hasBankDetails ? 'ändern' : 'hinterlegen'}</div>
            <input value={holderInput} onChange={e => setHolderInput(e.target.value)} placeholder="Kontoinhaber (Vor- und Nachname)"
              style={inputStyle} />
            <input value={ibanInput} onChange={e => setIbanInput(e.target.value.toUpperCase())} placeholder="IBAN (z.B. DE89 3704 0044 0532 0130 00)"
              style={{ ...inputStyle, fontFamily: 'monospace', letterSpacing: '0.5px' }} />
            <input value={bicInput} onChange={e => setBicInput(e.target.value.toUpperCase())} placeholder="BIC (optional)"
              style={inputStyle} />
            <input value={bankNameInput} onChange={e => setBankNameInput(e.target.value)} placeholder="Name und Anschrift der Bank (optional)"
              style={inputStyle} />
            <div style={{ fontSize: 11, color: inkFaint, lineHeight: 1.4 }}>
              🔒 Deine Bankdaten werden verschlüsselt gespeichert und sind nur für die Auszahlungs-Genehmigung sichtbar.
            </div>
            {bankResult && !bankResult.ok && (
              <div style={{ fontSize: 11, color: red, fontWeight: 600 }}>
                ❌ {bankResult.error === 'invalid_iban' ? 'Bitte eine gültige IBAN eingeben.'
                  : bankResult.error === 'holder_required' ? 'Bitte einen Kontoinhaber angeben.'
                  : bankResult.error}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleSaveBank} disabled={savingBank || !ibanInput || !holderInput} style={{
                padding: '8px 18px', borderRadius: 8,
                background: (savingBank || !ibanInput || !holderInput) ? 'rgba(26,26,24,0.12)' : green,
                border: 'none', color: (savingBank || !ibanInput || !holderInput) ? inkFaint : '#fff',
                fontWeight: 700, fontSize: 12, cursor: (savingBank || !ibanInput || !holderInput) ? 'not-allowed' : 'pointer',
              }}>
                {savingBank ? '…' : 'Speichern'}
              </button>
              <button onClick={() => setBankFormOpen(false)} style={{
                padding: '8px 18px', borderRadius: 8, background: 'transparent',
                border: `1px solid ${border}`, color: inkSoft, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}>Abbrechen</button>
            </div>
          </div>
        )}
      </div>

      {/* KPI-Kacheln */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          { label: '💰 Verfügbar',     val: fmtAvailable,      color: green },
          { label: '⏳ Angefordert',   val: eur(requestedEur), color: amber },
          { label: '✅ Ausgezahlt',    val: fmtPaid,           color: teal },
        ].map(k => (
          <div key={k.label} style={{
            background: bgCard, border: `1px solid ${border}`,
            borderRadius: 12, padding: '12px 14px',
          }}>
            <div style={{ fontSize: 11, color: inkFaint, fontWeight: 600, marginBottom: 4 }}>{k.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: k.color }}>{k.val}</div>
          </div>
        ))}
      </div>

      {/* Auszahlung anfordern */}
      <div style={{
        background: bgCard, border: `1px solid ${border}`,
        borderRadius: 12, padding: '14px 16px',
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: ink, marginBottom: 8 }}>Auszahlung anfordern</div>
        {!hasBankDetails ? (
          <div style={{ fontSize: 12, color: inkFaint }}>
            Bitte zuerst oben deine Bankverbindung hinterlegen.
          </div>
        ) : canRequest ? (
          <>
            {/* AMB-PAYOUT-016: freier Betrag, max. = auszahlbarer Betrag */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: inkSoft }}>Betrag:</span>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: inkFaint, fontSize: 13 }}>€</span>
                <input
                  type="number" step="0.01" min={minimumEur} max={availableEur}
                  value={amountInput}
                  onChange={e => setAmountInput(e.target.value)}
                  style={{ ...inputStyle, padding: '7px 10px 7px 22px', width: 110 }}
                />
              </div>
              <button onClick={() => setAmountInput(availableEur.toFixed(2))} style={{
                padding: '6px 10px', borderRadius: 6, background: 'transparent',
                border: `1px solid ${border}`, color: inkSoft, fontSize: 11, fontWeight: 600, cursor: 'pointer',
              }}>Max ({fmtAvailable})</button>
            </div>
            {!amountValid && amountInput && (
              <div style={{ fontSize: 11, color: red, fontWeight: 600, marginBottom: 8 }}>
                {amountNum > availableEur
                  ? `Maximal ${fmtAvailable} verfügbar`
                  : `Mindestbetrag €${minimumEur}`}
              </div>
            )}
            {!confirmOpen ? (
              <button onClick={() => setConfirmOpen(true)} disabled={!amountValid} style={{
                padding: '9px 20px', borderRadius: 8,
                background: amountValid ? green : 'rgba(26,26,24,0.10)',
                border: 'none', color: amountValid ? '#fff' : inkFaint,
                fontWeight: 700, fontSize: 13, cursor: amountValid ? 'pointer' : 'not-allowed',
              }}>
                {eur(amountNum)} auszahlen →
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: inkSoft }}>Sicher? {eur(amountNum)} werden beantragt.</span>
                <button onClick={handleRequest} disabled={requesting} style={{
                  padding: '7px 16px', borderRadius: 8, background: green,
                  border: 'none', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer',
                }}>
                  {requesting ? '…' : 'Ja, anfordern'}
                </button>
                <button onClick={() => setConfirmOpen(false)} style={{
                  padding: '7px 16px', borderRadius: 8, background: 'transparent',
                  border: `1px solid ${border}`, color: inkSoft, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}>Abbrechen</button>
              </div>
            )}
          </>
        ) : (
          <div style={{ fontSize: 12, color: inkFaint }}>
            {availableEur < minimumEur
              ? `Mindestbetrag: €${minimumEur} (aktuell ${eur(availableEur)})`
              : requestedEur > 0
                ? 'Bereits eine Anfrage ausstehend'
                : 'Keine offenen Provisionen'}
          </div>
        )}

        {hasBankDetails && canRequest && !result && (
          <div style={{ fontSize: 11, color: inkFaint, marginTop: 8 }}>
            ℹ️ Nach Genehmigung wird der Betrag innerhalb von 3 Werktagen auf dein Konto überwiesen.
          </div>
        )}

        {result && (
          <div style={{
            marginTop: 10, padding: '8px 12px', borderRadius: 8,
            background: result.ok ? greenBg : redBg,
            border: `1px solid ${result.ok ? greenBd : 'rgba(192,57,43,0.30)'}`,
            fontSize: 12, fontWeight: 600, color: result.ok ? green : red,
          }}>
            {result.ok
              ? `✅ ${eur(result.amount_eur)} beantragt (${result.commissions} Provisionen) — wird innerhalb von 3 Werktagen bearbeitet.`
              : `❌ ${
                  result.error === 'below_minimum' ? `Mindestbetrag nicht erreicht (${eur(result.total_eur)} < €${minimumEur})`
                  : result.error === 'not_an_ambassador' ? 'Dein Ambassador-Status ist noch nicht bestätigt.'
                  : result.error === 'bank_details_required' ? 'Bitte zuerst deine Bankverbindung hinterlegen.'
                  : result.error
                }`}
          </div>
        )}
      </div>

      {/* Letzte Auszahlungen */}
      {payouts.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: inkFaint, textTransform: 'uppercase',
            letterSpacing: '0.07em', marginBottom: 10 }}>Letzte Auszahlungen</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {payouts.slice(0, 5).map(p => {
              const sc = STATUS_COLORS[p.status] || inkFaint;
              const label = STATUS_LABELS[p.status] || p.status;
              return (
                <div key={p.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: bgCard, border: `1px solid ${border}`, borderRadius: 10, padding: '10px 12px',
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: ink }}>{eur(p.amount_eur)}</div>
                    <div style={{ fontSize: 10, color: inkFaint }}>{fmtDate(p.requested_at)}</div>
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                    background: `${sc}1A`, color: sc,
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
