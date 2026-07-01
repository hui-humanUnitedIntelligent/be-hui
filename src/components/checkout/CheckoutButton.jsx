// src/components/checkout/CheckoutButton.jsx
// HUI — Universeller Checkout-Button (ARCH-006.1)
// Für alle Use Cases: Werk, Talent, Spende, Abo, Impact
import React from 'react';
import { useCheckout } from '../../hooks/useCheckout';

/**
 * CheckoutButton
 * @param {object} props
 * @param {string} props.type         - 'work'|'talent'|'donation'|'subscription'|'impact_subscription'
 * @param {number} props.amount       - Betrag in Cent
 * @param {string} [props.label]      - Button-Text (default: "Jetzt kaufen")
 * @param {string} [props.ambassadorId] - Ambassador ID (für Provision)
 * @param {string} [props.description]
 * @param {object} [props.metadata]
 * @param {string} [props.mode]       - 'redirect' | 'intent'
 * @param {Function} [props.onSuccess]- Callback nach erfolgreichem Redirect-Start
 * @param {Function} [props.onError]  - Callback bei Fehler
 * @param {object}  [props.style]     - Custom Styles
 * @param {string}  [props.className]
 */
export default function CheckoutButton({
  type,
  amount,
  label        = 'Jetzt kaufen',
  ambassadorId = null,
  description  = null,
  metadata     = {},
  mode         = 'redirect',
  onSuccess    = () => {},
  onError      = () => {},
  style        = {},
  className    = '',
  disabled     = false,
}) {
  const { startCheckout, loading, error } = useCheckout();

  const handleClick = async () => {
    if (loading || disabled) return;
    const result = await startCheckout({
      type, amount, ambassadorId, description, metadata, mode,
    });
    if (result?.ok) onSuccess(result);
    else onError(result?.error);
  };

  const defaultStyle = {
    display:         'inline-flex',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             8,
    padding:         '12px 24px',
    borderRadius:    10,
    border:          'none',
    background:      loading || disabled ? '#555' : 'linear-gradient(135deg, #635BFF, #4F46E5)',
    color:           '#fff',
    fontWeight:      700,
    fontSize:        14,
    cursor:          loading || disabled ? 'not-allowed' : 'pointer',
    transition:      'opacity 0.2s',
    opacity:         loading || disabled ? 0.7 : 1,
    ...style,
  };

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 6 }}>
      <button
        onClick={handleClick}
        disabled={loading || disabled}
        style={defaultStyle}
        className={className}
      >
        {loading ? (
          <>
            <span style={{ fontSize: 16 }}>⏳</span>
            Wird vorbereitet…
          </>
        ) : (
          <>
            <span style={{ fontSize: 16 }}>💳</span>
            {label}
          </>
        )}
      </button>
      {error && (
        <div style={{
          fontSize: 11, color: '#ff6b6b', padding: '4px 8px',
          background: '#ff6b6b15', borderRadius: 6, border: '1px solid #ff6b6b33',
        }}>
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}
