// api/impact-page.js — Öffentliche HUI-Impact-Übersicht (/impact)
// ══════════════════════════════════════════════════════════════════
// Vercel Serverless Function (via Rewrite: /impact und /en/impact).
// Rendert die Impact-Übersicht serverseitig mit den AKTUELLEN
// öffentlichen Projekten aus der zentralen Datenquelle
// (impact_projects, status='active' — gleiche Logik wie die HUI-App).
//
// Ehrlichkeit:
//   - Keine Platzhalter-Projekte, keine erfundenen Zahlen
//   - Ist die Datenquelle leer, zeigt die Seite einen ruhigen,
//     ehrlichen Leerzustand
//   - Neue öffentliche Projekte erscheinen automatisch (kein Umbau)
// ══════════════════════════════════════════════════════════════════

const { renderPage, esc } = require('./lib/hui-page.js');
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

  // ── Projektkarten (nur echte, öffentliche Projekte) ──
  let projectsHtml = '';
  if (!dataError && projects.length > 0) {
    const cards = projects.map((p) => {
      const dot = esc(p.icon || (p.name ? p.name.trim().charAt(0) : '◦'));
      const color = /^#[0-9a-fA-F]{3,8}$/.test(p.color || '') ? `background:${esc(p.color)}22;color:${esc(p.color)}` : '';
      const category = p.category ? `<span class="imp-card-chip">${esc(p.category)}</span>` : '';
      const meta = [
        p.month ? `<span data-i18n="impact.meta.month">Beitragsrunde</span>&nbsp;${esc(p.month)}` : null,
        Number(p.awarded_eur) > 0 ? `<span class="imp-card-status" data-i18n="impact.meta.received">Bereits gefördert</span>` : null,
      ].filter(Boolean).map((m) => `<span>${m}</span>`).join('');
      return `
      <article class="imp-card reveal">
        <div class="imp-card-top">
          <div class="imp-card-dot" style="${color}" aria-hidden="true">${dot}</div>
          ${category}
        </div>
        <h3>${esc(p.name)}</h3>
        ${p.description ? `<p class="imp-card-desc">${esc(p.description)}</p>` : ''}
        ${meta ? `<div class="imp-card-meta">${meta}</div>` : ''}
        <div class="imp-card-actions">
          <a class="imp-btn-quiet" href="/impact/${esc(p.slug)}" data-i18n="impact.card.details">Projekt entdecken</a>
          <a class="imp-btn" href="/impact/${esc(p.slug)}#unterstuetzen" data-i18n="impact.card.support">Unterstützen</a>
        </div>
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
        name: p.name,
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
