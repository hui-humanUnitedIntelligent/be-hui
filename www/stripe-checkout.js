<!-- Stripe Checkout Section für be-hui.com -->
<!-- Einbinden in index.html vor </body> -->
<script>
// ── HUI Stripe Checkout (be-hui.com) ────────────────────────────
// Nutzt denselben Flow wie die App: Supabase RPC → Stripe Checkout Session
const HUI_SUPABASE_URL = 'https://gxztrhvhcxhmunhhkfjd.supabase.co';
const HUI_SUPABASE_ANON = 'YOUR_ANON_KEY'; // wird via Env ersetzt

async function huiStartCheckout({ type, amount, description = null }) {
  try {
    // Session via Supabase RPC erstellen
    const res = await fetch(`${HUI_SUPABASE_URL}/rest/v1/rpc/rpc_create_checkout_session`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'apikey':        HUI_SUPABASE_ANON,
        'Authorization': `Bearer ${HUI_SUPABASE_ANON}`,
      },
      body: JSON.stringify({
        p_user_id:      '00000000-0000-0000-0000-000000000000', // Guest / Public
        p_amount:       amount,
        p_currency:     'eur',
        p_payment_type: type,
        p_success_url:  window.location.origin + '/checkout-success.html',
        p_cancel_url:   window.location.href,
        p_description:  description,
      }),
    });
    const data = await res.json();
    if (!data?.ok) throw new Error(data?.error || 'Checkout-Fehler');
    
    // Stripe Checkout Session direkt starten
    const stripe = Stripe('YOUR_STRIPE_PK'); // wird via Env ersetzt
    await stripe.redirectToCheckout({
      lineItems: [{ price: 'price_1ToMkjQygHtJtH5iDAEa7NF9', quantity: 1 }],
      mode: 'payment',
      successUrl: data.success_url,
      cancelUrl:  data.cancel_url,
    });
  } catch (err) {
    console.error('[HUI Checkout]', err);
    alert('Fehler beim Checkout: ' + err.message);
  }
}

// Donation Buttons automatisch initialisieren
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-hui-checkout]').forEach(btn => {
    btn.addEventListener('click', () => {
      const type   = btn.dataset.huiCheckout || 'donation';
      const amount = parseInt(btn.dataset.huiAmount || '1000');
      const desc   = btn.dataset.huiDesc || 'HUI Spende';
      huiStartCheckout({ type, amount, description: desc });
    });
  });
});
</script>
