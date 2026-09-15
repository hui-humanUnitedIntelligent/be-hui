// api/impact-project.js — Öffentliche Projekt-Detailseite (/impact/:slug)
// ══════════════════════════════════════════════════════════════════
// Vercel Serverless Function (via Rewrite: /impact/:slug).
// Lädt das Projekt dynamisch aus der zentralen Datenquelle
// (impact_applications, status='approved') und rendert die Detailseite
// serverseitig — mit individueller SEO pro Projekt.
//
// Buchungslogik (identisch zur App, PROJECT-DIRECT-SUPPORT-001):
//   Nach verifizierter Zahlung (Stripe-Session payment_status==='paid')
//   wird der Nettobetrag (nach Stripe-Standardgebühr 2,9% + 0,30 € —
//   exakt die Formel der App-Edge-Function) über die bestehende RPC
//   rpc_add_project_direct_support in current_amount_eur verbucht.
//   Idempotenz: Der Vermerk im PaymentIntent-Metadatum
//   website_support_processed verhindert Doppelerfassung bei Reload.
//   KEINE Änderung an Supabase-Schema, App-Webhook oder RPC.
//
// Ehrlichkeit & Sicherheit:
//   - Unbekannte/nicht genehmigte Projekte → ehrliche 404 (noindex)
//   - Kontaktfelder werden nie angefragt (Whitelist in impact-data)
//   - Danke-Ansicht NUR nach serverseitiger Verifikation — keine
//     Fake-Erfolge; Beträge werden ausschließlich serverseitig validiert
// ══════════════════════════════════════════════════════════════════

const { renderPage, esc, fmtEur, pct } = require('./lib/hui-page.js');
const { getProjectBySlug, calcStripeFee } = require('./lib/impact-data.js');

const STRIPE_SECRET_KEY = () => process.env.STRIPE_SECRET_KEY || '';
const SUPABASE_URL = () => process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE = () => process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

// ── Stripe-Checkout-Session abrufen (Verifikation der Rückkehr) ──
async function getStripeSession(sessionId) {
  const key = STRIPE_SECRET_KEY();
  if (!key || !sessionId) return null;
  const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!res.ok) return null;
  return res.json();
}

// ── PaymentIntent abrufen (Idempotenz-Vermerk) ──
async function getPaymentIntent(piId) {
  const key = STRIPE_SECRET_KEY();
  if (!key || !piId) return null;
  const res = await fetch(`https://api.stripe.com/v1/payment_intents/${encodeURIComponent(piId)}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!res.ok) return null;
  return res.json();
}

// ── PaymentIntent-Metadatum setzen (Verarbeitungs-Lock) ──
async function markPaymentIntentProcessed(piId) {
  const key = STRIPE_SECRET_KEY();
  if (!key || !piId) return false;
  const params = new URLSearchParams();
  params.set('metadata[website_support_processed]', String(Date.now()));
  const res = await fetch(`https://api.stripe.com/v1/payment_intents/${encodeURIComponent(piId)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  return res.ok;
}

// ── RPC: Nettobetrag in current_amount_eur verbuchen (App-RPC, Migration 141) ──
async function addDirectSupport(projectId, netEur) {
  const url = SUPABASE_URL();
  const key = SUPABASE_SERVICE();
  if (!url || !key) throw new Error('SUPABASE_NOT_CONFIGURED');
  const res = await fetch(`${url}/rest/v1/rpc/rpc_add_project_direct_support`, {
    method: 'POST',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ p_project_id: projectId, p_net_amount_eur: netEur }),
  });
  if (!res.ok) throw new Error(`RPC_ERROR_${res.status}`);
  return res.json();
}

// ── Unterstützungsbereich ──
function supportSection(p, lang) {
  const t = lang === 'en' ? {
    h3: 'Support this project',
    text: 'Your support goes directly to this project — transparently and without detours. You choose the amount.',
    note: 'The payment is processed securely via Stripe. The full amount minus the standard Stripe fee goes directly to the project.',
    error: 'Something went wrong. Please try again.',
  } : {
    h3: 'Dieses Projekt unterstützen',
    text: 'Deine Unterstützung fließt direkt in dieses Projekt — transparent und ohne Umwege. Du entscheidest über den Betrag.',
    note: 'Die Zahlung wird sicher über Stripe verarbeitet. Der Betrag abzüglich der üblichen Stripe-Gebühr fließt direkt in das Projekt.',
    error: 'Etwas ist schiefgelaufen. Bitte versuche es erneut.',
  };
  return `
  <section class="imp-block" id="unterstuetzen">
    <h2 data-i18n="impact.support.h2">Projekt unterstützen</h2>
    <div class="imp-support reveal">
      <h3 data-i18n="impact.support.h3">${esc(t.h3)}</h3>
      <p class="imp-support-text" data-i18n="impact.support.text">${esc(t.text)}</p>
      <div class="imp-amounts" role="group" data-i18n-aria="impact.support.amounts-aria" aria-label="Betrag wählen">
        <button type="button" class="imp-amount" data-amount="10">10&nbsp;€</button>
        <button type="button" class="imp-amount" data-amount="25">25&nbsp;€</button>
        <button type="button" class="imp-amount" data-amount="50">50&nbsp;€</button>
        <button type="button" class="imp-amount" data-amount="100">100&nbsp;€</button>
      </div>
      <div class="imp-custom">
        <label for="impCustomAmount" data-i18n="impact.support.custom-label">Eigener Betrag</label>
        <input type="number" id="impCustomAmount" min="1" max="5000" step="0.5" inputmode="decimal" placeholder="—"/>
        <span aria-hidden="true">€</span>
      </div>
      <button type="button" class="imp-btn" id="impSupportBtn" data-i18n="impact.support.cta">Projekt unterstützen</button>
      <p class="imp-support-note" data-i18n="impact.support.note">${esc(t.note)}</p>
      <div class="imp-support-error" id="impSupportError" role="alert" data-i18n="impact.support.error">${esc(t.error)}</div>
    </div>
  </section>`;
}

// ── Ehrlicher Abschluss-Hinweis für finanzierte Projekte ──
function completedSection(p, lang) {
  const t = lang === 'en'
    ? { h3: 'This project has been fully funded.', text: `The funding goal of ${fmtEur(p.funding_goal)} has been reached and the project is being implemented. Thank you to everyone who took part.` }
    : { h3: 'Dieses Projekt ist vollständig finanziert.', text: `Das Förderziel von ${fmtEur(p.funding_goal)} ist erreicht und das Projekt befindet sich in Umsetzung. Danke allen, die mitgemacht haben.` };
  return `
  <section class="imp-block" id="unterstuetzen">
    <h2 data-i18n="impact.support.h2">Projekt unterstützen</h2>
    <div class="imp-thanks reveal">
      <div class="imp-thanks-dot" aria-hidden="true"></div>
      <h3>${esc(t.h3)}</h3>
      <p>${esc(t.text)}</p>
    </div>
  </section>`;
}

// ── Verifizierte Danke-Ansicht (nur mit bezahlter Stripe-Session) ──
function thanksSection(p, amountEur, lang) {
  const t = lang === 'en' ? {
    h3: 'Thank you — your support has arrived.',
    text: `Your support of ${amountEur} € for „${p.project_name}" has been confirmed by our payment provider. After the standard Stripe fee, it flows directly into this project. Thank you — impact becomes visible together.`,
  } : {
    h3: 'Danke — deine Unterstützung ist angekommen.',
    text: `Deine Unterstützung von ${amountEur} € für „${p.project_name}" wurde vom Zahlungsdienstleister bestätigt. Nach Abzug der üblichen Stripe-Gebühr fließt sie direkt in dieses Projekt. Danke dir — gemeinsam wird Wirkung sichtbar.`,
  };
  return `
  <section class="imp-block" id="unterstuetzen">
    <h2 data-i18n="impact.support.h2">Projekt unterstützen</h2>
    <div class="imp-thanks reveal">
      <div class="imp-thanks-dot" aria-hidden="true"></div>
      <h3>${esc(t.h3)}</h3>
      <p>${esc(t.text)}</p>
    </div>
  </section>`;
}

module.exports = async (req, res) => {
  const lang = (req.query && req.query.lang === 'en') ? 'en' : 'de';
  const slug = (req.query && req.query.slug) || '';
  const sessionId = (req.query && req.query.session_id) || '';

  // Slug-Format grob validieren (keine Injektion in URLs)
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) {
    return send404(res, lang);
  }

  let project = null;
  try {
    project = await getProjectBySlug(slug);
  } catch (err) {
    console.error('[IMPACT-PROJECT]', err.message);
    return send503(res, lang);
  }
  if (!project) return send404(res, lang, slug);

  const completed = project.is_completed === true;
  const received = Number(project.current_amount_eur) || 0;
  const goal = Number(project.funding_goal) || 0;
  const progress = goal > 0 ? Math.min(100, Math.round((received / goal) * 100)) : 0;

  // ── Verifikation: Rückkehr von Stripe mit session_id? ──
  let thanks = null;
  if (sessionId && /^cs_[a-zA-Z0-9_]{1,200}$/.test(sessionId) && !completed) {
    try {
      const session = await getStripeSession(sessionId);
      if (session && session.payment_status === 'paid' && session.metadata && session.metadata.project_slug === slug) {
        const amountEur = (session.amount_total / 100).toFixed(2).replace('.', ',');
        thanks = { amountEur };

        // ── Verbuchung (einmalig, idempotent über PaymentIntent-Metadatum) ──
        const piId = session.payment_intent;
        if (piId) {
          const pi = await getPaymentIntent(piId);
          if (pi && !(pi.metadata && pi.metadata.website_support_processed)) {
            // Nettobetrag nach Stripe-Standardgebühr — identische Formel wie die App
            const grossEur = Number(session.amount_total) / 100;
            const { net } = calcStripeFee(grossEur);
            const locked = await markPaymentIntentProcessed(piId);
            if (locked) {
              try {
                await addDirectSupport(project.id, net);
              } catch (err) {
                // Zahlung ist real erfolgt — Fehler protokollieren, Danke trotzdem ehrlich zeigen
                console.error('[IMPACT-PROJECT] RPC verbuchen fehlgeschlagen:', err.message, 'project:', project.id, 'net:', net);
              }
            } else {
              console.error('[IMPACT-PROJECT] Idempotenz-Lock fehlgeschlagen — keine Verbuchung (Doppel-Vermeidung), PI:', piId);
            }
          }
        }
      }
    } catch (_) { /* Verifikation fehlgeschlagen → normale Ansicht */ }
  }

  // ── Fakten (nur reale Werte) ──
  const facts = [];
  facts.push({ label: lang === 'en' ? 'Status' : 'Status', value: completed ? (lang === 'en' ? 'Funded — in implementation' : 'Finanziert — in Umsetzung') : (lang === 'en' ? 'Active in pool' : 'Aktiv im Impactpool') });
  if (goal > 0) facts.push({ label: lang === 'en' ? 'Funding goal' : 'Förderziel', value: fmtEur(goal) });
  if (goal > 0) facts.push({ label: lang === 'en' ? 'Received' : 'Erhalten', value: `${fmtEur(received)} (${pct(progress)}%)` });
  if (project.location) facts.push({ label: lang === 'en' ? 'Location' : 'Ort', value: project.location });

  const websiteLink = project.website
    ? `<p class="imp-detail-intro" style="margin-top:18px"><a href="${esc(project.website)}" target="_blank" rel="noopener noreferrer" data-i18n="impact.detail.website">Website des Projekts</a></p>` : '';

  const img = project.cover_url || (Array.isArray(project.media_urls) && project.media_urls[0]) || null;
  const heroImg = img ? `<div class="imp-detail-hero reveal d2" style="background-image:url('${esc(img)}')" role="img" aria-label="${esc(project.project_name)}"></div>` : '';

  // Geschichtenabschnitte aus der Bewerbung (nur wenn inhaltlich gefüllt)
  const storyBlocks = [];
  if (project.problem) storyBlocks.push({ h: lang === 'en' ? 'The problem' : 'Das Problem', p: project.problem, key: 'impact.detail.problem' });
  if (project.vision) storyBlocks.push({ h: lang === 'en' ? 'The vision' : 'Die Vision', p: project.vision, key: 'impact.detail.vision' });
  if (project.funding_use) storyBlocks.push({ h: lang === 'en' ? 'What your support enables' : 'Was deine Unterstützung ermöglicht', p: project.funding_use, key: 'impact.detail.use' });

  const body = `
  <article class="imp-detail">
    <p class="section-kicker reveal" data-i18n="imp.kicker">Impact</p>
    <h1 class="reveal d1">${esc(project.project_name)}</h1>
    ${project.short_desc ? `<p class="imp-detail-intro reveal d2">${esc(project.short_desc)}</p>` : ''}
    ${heroImg}
    ${websiteLink}

    ${goal > 0 ? `
    <section class="imp-block">
      <h2 data-i18n="impact.detail.progress-h">Fortschritt</h2>
      <div class="imp-progress imp-progress-lg">
        <div class="imp-progress-bar" style="width:${progress}%"></div>
      </div>
      <p class="imp-progress-label imp-progress-label-lg"><span>${fmtEur(received)}</span><span>${pct(progress)}% ${lang === 'en' ? 'of' : 'von'} ${fmtEur(goal)}</span></p>
    </section>` : ''}

    ${project.short_desc ? `
    <section class="imp-block">
      <h2 data-i18n="impact.detail.about">Worum geht es?</h2>
      <p>${esc(project.short_desc)}</p>
    </section>` : ''}

    ${storyBlocks.map((b) => `
    <section class="imp-block">
      <h2 data-i18n="${b.key}">${esc(b.h)}</h2>
      <p>${esc(b.p)}</p>
    </section>`).join('')}

    <section class="imp-block">
      <h2 data-i18n="impact.detail.status">Wo steht das Projekt?</h2>
      <div class="imp-facts">
        ${facts.map((f) => `<div class="imp-fact"><p class="imp-fact-label">${esc(f.label)}</p><p class="imp-fact-value">${esc(f.value)}</p></div>`).join('')}
      </div>
    </section>
  </article>

  <div class="imp-detail">
    ${thanks ? thanksSection(project, thanks.amountEur, lang)
      : (completed ? completedSection(project, lang) : supportSection(project, lang))}
  </div>

  <section class="imp-close">
    <p class="imp-close-l1 reveal" data-i18n="impact.close.1">Wirkung entsteht nicht nebenbei.</p>
    <p class="imp-close-l2 reveal d1" data-i18n="impact.close.2">Sie entsteht mit Menschen, die mitmachen.</p>
  </section>`;

  // ── Strukturierte Daten (nur reale Inhalte) ──
  const canonicalPath = `/impact/${project.slug}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@id': 'https://be-hui.com/#organization', '@type': 'Organization', name: 'HUI', alternateName: 'Human United Intelligence', url: 'https://be-hui.com/' },
      {
        '@type': 'WebPage',
        '@id': `https://be-hui.com${canonicalPath}#webpage`,
        url: `https://be-hui.com${canonicalPath}`,
        name: `${project.project_name} — HUI Impact`,
        description: (project.short_desc || `Impact-Projekt ${project.project_name} bei HUI, Human United Intelligence.`).slice(0, 300),
        inLanguage: 'de',
        isPartOf: { '@id': 'https://be-hui.com/#organization' },
        breadcrumb: { '@id': `https://be-hui.com${canonicalPath}#breadcrumb` },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `https://be-hui.com${canonicalPath}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'HUI', item: 'https://be-hui.com/' },
          { '@type': 'ListItem', position: 2, name: 'Impact', item: 'https://be-hui.com/impact' },
          { '@type': 'ListItem', position: 3, name: project.project_name, item: `https://be-hui.com${canonicalPath}` },
        ],
      },
    ],
  };

  const html = renderPage({
    lang,
    title: `${project.project_name} — HUI Impact`,
    description: (project.short_desc || `Impact-Projekt ${project.project_name} aus dem HUI-Ökosystem — entdecken und direkt unterstützen.`).slice(0, 300),
    canonicalPath,
    ogTitle: `${project.project_name} — HUI Impact`,
    jsonLd,
    body,
    inlineScript: `
document.addEventListener('DOMContentLoaded', function(){
  if(window.plausible){ window.plausible('impact_project_opened'); }
  var selected = null;
  var custom = document.getElementById('impCustomAmount');
  var btn = document.getElementById('impSupportBtn');
  var errBox = document.getElementById('impSupportError');
  document.querySelectorAll('.imp-amount').forEach(function(b){
    b.addEventListener('click', function(){
      selected = b.getAttribute('data-amount');
      document.querySelectorAll('.imp-amount').forEach(function(x){ x.classList.remove('sel'); });
      b.classList.add('sel');
      if(custom) custom.value = '';
    });
  });
  if(custom) custom.addEventListener('input', function(){
    selected = null;
    document.querySelectorAll('.imp-amount').forEach(function(x){ x.classList.remove('sel'); });
  });
  if(btn) btn.addEventListener('click', function(){
    var amount = selected || (custom ? custom.value : null);
    var amt = parseFloat(amount);
    if(!amt || amt < 1 || amt > 5000){ if(errBox){ errBox.style.display='block'; } return; }
    if(errBox) errBox.style.display='none';
    btn.disabled = true;
    if(window.plausible){ window.plausible('impact_support_started', { props: { project: ${JSON.stringify(project.slug)} } }); }
    fetch('/api/impact-support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: ${JSON.stringify(project.slug)}, amount_eur: amt })
    }).then(function(r){ return r.json().then(function(j){ return { ok: r.ok, body: j }; }); })
      .then(function(res){
        if(res.ok && res.body && res.body.url){ window.location.href = res.body.url; }
        else { btn.disabled = false; if(errBox){ errBox.textContent = (res.body && res.body.error) || 'Etwas ist schiefgelaufen.'; errBox.style.display='block'; } }
      })
      .catch(function(){ btn.disabled = false; if(errBox){ errBox.style.display='block'; } });
  });
  ${thanks ? "if(window.plausible){ window.plausible('impact_support_completed'); }" : ''}
});`,
  });

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=60');
  res.status(200).send(html);
};

// ── Ehrliche 404 ──
function send404(res, lang, slug) {
  const t = lang === 'en'
    ? { h1: 'This project does not exist — or is not public yet.', p: 'Perhaps the project is still being prepared. You can find all public impact projects here:', back: 'To all impact projects' }
    : { h1: 'Dieses Projekt existiert nicht — oder ist noch nicht öffentlich.', p: 'Vielleicht wird das Projekt gerade vorbereitet. Alle öffentlichen Impact-Projekte findest du hier:', back: 'Zu allen Impact-Projekten' };
  const body = `
  <section class="imp-hero">
    <div class="imp-hero-center">
      <p class="section-kicker reveal" data-i18n="imp.kicker">Impact</p>
      <h1 class="reveal d1">${esc(t.h1)}</h1>
      <p class="reveal d2">${esc(t.p)}</p>
      <p class="reveal d3" style="margin-top:28px"><a class="imp-btn" href="/impact">${esc(t.back)}</a></p>
    </div>
  </section>`;
  const html = renderPage({
    lang,
    title: 'Projekt nicht gefunden — HUI Impact',
    description: 'Dieses Impact-Projekt wurde nicht gefunden oder ist noch nicht öffentlich.',
    canonicalPath: '/impact',
    body,
    noindex: true,
  });
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(404).send(html);
}

// ── Ehrliche 503 (Datenquelle nicht erreichbar) ──
function send503(res, lang) {
  const t = lang === 'en'
    ? { h1: 'The projects cannot be loaded right now.', p: 'Please try again in a moment.' }
    : { h1: 'Die Projekte können gerade nicht geladen werden.', p: 'Bitte versuche es in Kürze erneut.' };
  const body = `
  <section class="imp-hero">
    <div class="imp-hero-center">
      <p class="section-kicker reveal" data-i18n="imp.kicker">Impact</p>
      <h1 class="reveal d1">${esc(t.h1)}</h1>
      <p class="reveal d2">${esc(t.p)}</p>
      <p class="reveal d3" style="margin-top:28px"><a class="imp-btn" href="/impact">${lang === 'en' ? 'Retry' : 'Erneut versuchen'}</a></p>
    </div>
  </section>`;
  const html = renderPage({
    lang,
    title: 'Impact — HUI | derzeit nicht verfügbar',
    description: 'Die Impact-Projekte können gerade nicht geladen werden.',
    canonicalPath: '/impact',
    body,
    noindex: true,
  });
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(503).send(html);
}
