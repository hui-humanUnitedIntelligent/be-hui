// api/impact-page.js — Öffentliche HUI-Impact-Übersicht (/impact)
// ══════════════════════════════════════════════════════════════════
// Vercel Serverless Function (via Rewrite: /impact und /en/impact).
// Rendert die Impact-Übersicht serverseitig mit den AKTUELLEN
// genehmigten Projekten aus der zentralen Datenquelle
// (impact_applications, status='approved' — gleiche Logik wie der
// Impactpool der HUI-App, ImpactStimmenModal).
//
// Ehrlichkeit:
//   - Keine Platzhalter-Projekte, keine erfundenen Zahlen
//   - Förderziel, erreichter Betrag und Status kommen aus der
//     Datenquelle — nichts wird hochgerechnet oder gerundet geschönt
//   - Ist die Datenquelle leer, zeigt die Seite einen ruhigen,
//     ehrlichen Leerzustand
// ══════════════════════════════════════════════════════════════════

const { renderPage, esc, fmtEur, pct } = require('./lib/hui-page.js');
const { fetchPublicProjects, withSlugs } = require('./lib/impact-data.js');

module.exports = async (req, res) => {
  const lang = (req.query && req.query.lang === 'en') ? 'en' : 'de';

  let projects = [];
  let dataError = false;
  try {
    projects = withSlugs(await fetchPublicProjects());
  } catch (err) {
    console.error('[IMPACT-PAGE]', err.message);
    dataError = true;
  }

  // ── Projektkarten (nur echte, genehmigte Projekte) ──
  let projectsHtml = '';
  if (!dataError && projects.length > 0) {
    const cards = projects.map((p) => {
      const img = p.cover_url || (Array.isArray(p.media_urls) && p.media_urls[0]) || null;
      const imgHtml = img
        ? `<div class="imp-card-img" style="background-image:url('${esc(img)}')" role="img" aria-label="${esc(p.project_name)}"></div>`
        : `<div class="imp-card-img imp-card-img-empty"><div class="imp-card-dot" aria-hidden="true">${esc((p.project_name || '◦').trim().charAt(0))}</div></div>`;

      const completed = p.is_completed === true;
      const received = Number(p.current_amount_eur) || 0;
      const goal = Number(p.funding_goal) || 0;
      const progress = goal > 0 ? Math.min(100, Math.round((received / goal) * 100)) : 0;

      const meta = [];
      if (p.location) meta.push(`<span>${esc(p.location)}</span>`);
      if (goal > 0) meta.push(`<span data-i18n="impact.meta.goal">Förderziel</span>&nbsp;${fmtEur(goal)}`);
      if (received > 0) meta.push(`<span class="imp-card-status" data-i18n="impact.meta.received">Bereits gefördert</span>&nbsp;${fmtEur(received)}`);

      const actions = completed
        ? `<div class="imp-card-actions">
          <a class="imp-btn-quiet" href="/impact/${esc(p.slug)}" data-i18n="impact.card.details">Projekt entdecken</a>
          <span class="imp-card-done" data-i18n="impact.card.funded">Finanziert — in Umsetzung</span>
        </div>`
        : `<div class="imp-card-actions">
          <a class="imp-btn-quiet" href="/impact/${esc(p.slug)}" data-i18n="impact.card.details">Projekt entdecken</a>
          <a class="imp-btn" href="/impact/${esc(p.slug)}#unterstuetzen" data-i18n="impact.card.support">Unterstützen</a>
        </div>`;

      return `
      <article class="imp-card reveal">
        ${imgHtml}
        <h3>${esc(p.project_name)}</h3>
        ${p.short_desc ? `<p class="imp-card-desc">${esc(p.short_desc)}</p>` : ''}
        ${meta.length > 0 ? `<div class="imp-card-meta">${meta.map((m) => `<span>${m}</span>`).join('')}</div>` : ''}
        ${goal > 0 && !completed ? `
        <div class="imp-progress">
          <div class="imp-progress-bar" style="width:${progress}%"></div>
        </div>
        <div class="imp-progress-label"><span>${fmtEur(received)}</span><span>${pct(progress)}%</span></div>` : ''}
        ${actions}
      </article>`;
    }).join('');
    projectsHtml = `<div class="imp-grid">${cards}</div>`;
  } else if (!dataError) {
    // Ehrlicher Leerzustand — keine Fake-Projekte
    projectsHtml = `
    <div class="imp-empty reveal d1">
      <div class="imp-empty-dot" aria-hidden="true"></div>
      <h3 data-i18n="impact.empty.title">Die ersten Impact-Projekte entstehen gerade.</h3>
      <p data-i18n="impact.empty.text">HUI steht am Anfang. Projekte aus der Gemeinschaft erscheinen hier, sobald sie öffentlich freigegeben sind — mit ihrer Geschichte, ihrem Ziel und der Möglichkeit, sie direkt zu unterstützen.</p>
    </div>`;
  } else {
    projectsHtml = `
    <div class="imp-empty reveal d1">
      <div class="imp-empty-dot" aria-hidden="true"></div>
      <h3 data-i18n="impact.error.title">Die Projekte können gerade nicht geladen werden.</h3>
      <p data-i18n="impact.error.text">Bitte versuche es in Kürze erneut.</p>
    </div>`;
  }

  // ── Seiteninhalt ──
  const body = `
  <section class="imp-hero">
    <div class="imp-hero-center">
      <p class="section-kicker reveal" data-i18n="imp.kicker">Impact</p>
      <h1 class="reveal d1" data-i18n="impact.h1">Wirkung wird sichtbar.</h1>
      <p class="reveal d2" data-i18n="impact.intro">Ein Teil dessen, was durch HUI entsteht, fließt in Projekte, die etwas bewegen. Hier kannst du entdecken, welche Projekte entstehen, worum es bei ihnen geht — und wie du sie direkt unterstützen kannst.</p>
    </div>
  </section>

  <section class="imp-section" id="projekte">
    <div class="imp-section-head reveal">
      <p class="section-kicker" data-i18n="impact.projects.kicker">HUI Impact</p>
      <h2 data-i18n="impact.projects.h2">Aktuelle Impact-Projekte</h2>
      <p data-i18n="impact.projects.sub">Entdecke Projekte, die mit Unterstützung aus dem HUI-Ökosystem entstehen.</p>
    </div>
    ${projectsHtml}
  </section>

  <section class="imp-section">
    <div class="imp-section-head reveal">
      <p class="section-kicker" data-i18n="impact.how.kicker">Transparenz</p>
      <h2 data-i18n="impact.how.h2">Wie Impact bei HUI entsteht</h2>
      <p data-i18n="impact.how.sub">Drei Schritte — offen und nachvollziehbar.</p>
    </div>
    <div class="imp-steps">
      <div class="imp-step reveal">
        <p class="imp-step-num">01</p>
        <h3 data-i18n="impact.how.1.title">Es entsteht Wert</h3>
        <p data-i18n="impact.how.1.text">Auf HUI begegnen sich Menschen, Talente und Projekte. Ein Teil dessen, was im Ökosystem entsteht, fließt in den Impact-Bereich.</p>
      </div>
      <div class="imp-step reveal d1">
        <p class="imp-step-num">02</p>
        <h3 data-i18n="impact.how.2.title">Die Gemeinschaft entscheidet mit</h3>
        <p data-i18n="impact.how.2.text">Projekte werden sichtbar, Menschen stimmen mit — und gemeinsam wird entschieden, welche Vorhaben Unterstützung erhalten.</p>
      </div>
      <div class="imp-step reveal d2">
        <p class="imp-step-num">03</p>
        <h3 data-i18n="impact.how.3.title">Wirkung wird berichtet</h3>
        <p data-i18n="impact.how.3.text">Was aus einer Unterstützung geworden ist, wird transparent festgehalten — hier auf dieser Seite und im Projekt selbst.</p>
      </div>
    </div>
  </section>

  <section class="imp-close">
    <p class="imp-close-l1 reveal" data-i18n="impact.close.1">Wirkung entsteht nicht nebenbei.</p>
    <p class="imp-close-l2 reveal d1" data-i18n="impact.close.2">Sie entsteht mit Menschen, die mitmachen.</p>
  </section>`;

  // ── Strukturierte Daten ──
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://be-hui.com/#organization',
        name: 'HUI',
        alternateName: 'Human United Intelligence',
        url: 'https://be-hui.com/',
        logo: { '@type': 'ImageObject', url: 'https://be-hui.com/hui_logo.webp' },
        description: 'HUI — Human United Intelligence verbindet Menschen, Ideen und Möglichkeiten in einem lebendigen Ökosystem.',
        sameAs: ['https://www.youtube.com/@be-HUI'],
      },
      {
        '@type': 'WebPage',
        '@id': 'https://be-hui.com/impact#webpage',
        url: 'https://be-hui.com/impact',
        name: 'Impact — HUI | Wirkung wird sichtbar',
        description: 'Impact bei HUI, Human United Intelligence: Projekte aus dem HUI-Ökosystem, ihre Geschichten und Möglichkeiten der direkten Unterstützung.',
        inLanguage: 'de',
        isPartOf: { '@id': 'https://be-hui.com/#organization' },
        breadcrumb: { '@id': 'https://be-hui.com/impact#breadcrumb' },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': 'https://be-hui.com/impact#breadcrumb',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'HUI', item: 'https://be-hui.com/' },
          { '@type': 'ListItem', position: 2, name: 'Impact', item: 'https://be-hui.com/impact' },
        ],
      },
    ],
  };

  // Reale Projekte als strukturierte Liste (nur wenn vorhanden)
  if (!dataError && projects.length > 0) {
    jsonLd['@graph'].push({
      '@type': 'ItemList',
      '@id': 'https://be-hui.com/impact#projects',
      name: 'Aktuelle Impact-Projekte',
      itemListElement: projects.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: p.project_name,
        url: `https://be-hui.com/impact/${p.slug}`,
      })),
    });
  }

  const html = renderPage({
    lang,
    title: 'Impact — HUI | Wirkung wird sichtbar',
    description: 'Impact bei HUI, Human United Intelligence: Projekte aus dem HUI-Ökosystem, ihre Geschichten und Möglichkeiten der direkten Unterstützung.',
    canonicalPath: '/impact',
    ogTitle: 'Impact — HUI | Wirkung wird sichtbar',
    jsonLd,
    body,
    inlineScript: `
document.addEventListener('DOMContentLoaded', function(){
  if(window.plausible){ window.plausible('impact_page_view'); }
});`,
  });

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=120');
  res.status(200).send(html);
};
