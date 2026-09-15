// api/impact-project.js — Öffentliche Projekt-Detailseite (/impact/:slug)
// ══════════════════════════════════════════════════════════════════
// Vercel Serverless Function (via Rewrite: /impact/:slug).
// Lädt das Projekt dynamisch aus der zentralen Datenquelle
// (impact_projects, status='active') und rendert die Detailseite
// serverseitig — mit individueller SEO pro Projekt.
//
// Ehrlichkeit & Sicherheit:
//   - Unbekannte/inaktive Projekte → ehrliche 404-Seite (noindex)
//   - Kontaktfelder werden nie angefragt (Whitelist in impact-data)
//   - Danke-Ansicht NUR nach serverseitiger Verifikation der
//     Stripe-Session (payment_status === 'paid') — keine Fake-Erfolge
//   - Zahlungsbeträge werden ausschließlich serverseitig validiert
// ══════════════════════════════════════════════════════════════════

const { renderPage, esc } = require('./lib/hui-page.js');
const { getProjectBySlug } = require('./lib/impact-data.js');

const STRIPE_SECRET_KEY = () => process.env.STRIPE_SECRET_KEY || '';
const SITE_URL = 'https://be-hui.com';

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

// ── Unterstützungsbereich ──
function supportSection(p, lang) {
  const t = lang === 'en' ? {
    h3: 'Support this project',
    text: 'Your support goes directly to this project — transparently and without detours. You choose the amount.',
    note: 'The payment is processed securely via Stripe. Your support is clearly allocated to this project.',
    error: 'Something went wrong. Please try again.',
  } : {
    h3: 'Dieses Projekt unterstützen',
    text: 'Deine Unterstützung fließt direkt in dieses Projekt — transparent und ohne Umwege. Du entscheidest über den Betrag.',
    note: 'Die Zahlung wird sicher über Stripe verarbeitet. Deine Unterstützung wird eindeutig diesem Projekt zugeordnet.',
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

// ── Verifizierte Danke-Ansicht (nur mit bezahlter Stripe-Session) ──
function thanksSection(p, amountEur, lang) {
  const t = lang === 'en' ? {
    h3: 'Thank you — your support has arrived.',
    text: `Your support of ${amountEur} € for „${p.name}" has been confirmed by our payment provider. It is clearly allocated to this project. Thank you — impact becomes visible together.`,
  } : {
    h3: 'Danke — deine Unterstützung ist angekommen.',
    text: `Deine Unterstützung von ${amountEur} € für „${p.name}" wurde vom Zahlungsdienstleister bestätigt. Sie wird eindeutig diesem Projekt zugeordnet. Danke dir — gemeinsam wird Wirkung sichtbar.`,
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

  // ── Verifikation: Rückkehr von Stripe mit session_id? ──
  let thanks = null;
  if (sessionId && /^cs_[a-zA-Z0-9_]{1,200}$/.test(sessionId)) {
    try {
      const session = await getStripeSession(sessionId);
      if (session && session.payment_status === 'paid' && session.metadata && session.metadata.project_slug === slug) {
        thanks = {
          amountEur: (session.amount_total / 100).toFixed(2).replace('.', ','),
        };
      }
    } catch (_) { /* Verifikation fehlgeschlagen → normale Ansicht */ }
  }

  // ── Fakten (nur reale Werte) ──
  const awarded = Number(project.awarded_eur) || 0;
  const facts = [];
  if (project.category) facts.push({ label: lang === 'en' ? 'Category' : 'Kategorie', value: project.category });
  facts.push({ label: lang === 'en' ? 'Status' : 'Status', value: project.status === 'active' ? (lang === 'en' ? 'Active' : 'Aktiv') : esc(project.status) });
  if (project.month) facts.push({ label: lang === 'en' ? 'Round' : 'Beitragsrunde', value: project.month });
  if (awarded > 0) facts.push({ label: lang === 'en' ? 'Received' : 'Erhalten', value: `${awarded.toFixed(2).replace('.', ',')} €` });

  const websiteLink = project.website
    ? `<p class="imp-detail-intro" style="margin-top:18px"><a href="${esc(project.website)}" target="_blank" rel="noopener noreferrer" data-i18n="impact.detail.website">Website des Projekts</a></p>` : '';

  const intro = project.description || '';

  const body = `
  <article class="imp-detail">
    <p class="section-kicker reveal" data-i18n="imp.kicker">Impact</p>
    <h1 class="reveal d1">${esc(project.name)}</h1>
    ${intro ? `<p class="imp-detail-intro reveal d2">${esc(intro)}</p>` : ''}
    ${websiteLink}
    ${facts.length > 0 ? `<div class="imp-chips reveal d2">${facts.map((f) => `<span>${esc(f.label)}: ${esc(f.value)}</span>`).join('')}</div>` : ''}

    ${project.description ? `
    <section class="imp-block">
      <h2 data-i18n="impact.detail.about">Worum geht es?</h2>
      <p>${esc(project.description)}</p>
    </section>` : ''}

    <section class="imp-block">
      <h2 data-i18n="impact.detail.status">Wo steht das Projekt?</h2>
      <div class="imp-facts">
        ${facts.map((f) => `<div class="imp-fact"><p class="imp-fact-label">${esc(f.label)}</p><p class="imp-fact-value">${esc(f.value)}</p></div>`).join('')}
      </div>
    </section>

    ${(project.impact_report || awarded > 0) ? `
    <section class="imp-block">
      <h2 data-i18n="impact.detail.impact">Wirkung</h2>
      ${project.impact_report ? `<p>${esc(project.impact_report)}</p>` : ''}
      ${awarded > 0 && !project.impact_report ? `<p data-i18n="impact.detail.received">Dieses Projekt hat bisher ${awarded.toFixed(2).replace('.', ',')} € aus dem HUI-Impact-Bereich erhalten.</p>` : ''}
    </section>` : ''}
  </article>

  <div class="imp-detail">
    ${thanks ? thanksSection(project, thanks.amountEur, lang) : supportSection(project, lang)}
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
        name: `${project.name} — HUI Impact`,
        description: (project.description || `Impact-Projekt ${project.name} bei HUI, Human United Intelligence.`).slice(0, 300),
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
          { '@type': 'ListItem', position: 3, name: project.name, item: `https://be-hui.com${canonicalPath}` },
        ],
      },
    ],
  };

  const html = renderPage({
    lang,
    title: `${project.name} — HUI Impact`,
    description: (project.description || `Impact-Projekt ${project.name} aus dem HUI-Ökosystem — entdecken und direkt unterstützen.`).slice(0, 300),
    canonicalPath,
    ogTitle: `${project.name} — HUI Impact`,
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
    if(!amt || amt < 0.5 || amt > 5000){ if(errBox){ errBox.style.display='block'; } return; }
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
