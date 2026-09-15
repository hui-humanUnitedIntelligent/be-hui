// api/lib/hui-page.js — Gemeinsame Seitenvorlage für die öffentliche Impact-Sektion
// ══════════════════════════════════════════════════════════════════
// Wiederverwendet exakt das Chrome der bestehenden HUI-Website
// (Hauptnav, Drawer, Sidebar, Footer, Fonts, CSS, Scripts, Plausible).
// Kein App-Zugriff, keine App-Verlinkung — rein öffentliche Website.
// ══════════════════════════════════════════════════════════════════

const CHROME = `
<nav class="nav" id="nav">
  <a href="/" class="nav-brand">
    <img src="/hui_logo.webp" alt="HUI" class="nav-logo" width="36" height="36"/>
    <div>
      <span class="nav-name">HUI</span>
      <span class="nav-sub">Human United Intelligence</span>
    </div>
  </a>
  <div class="nav-links">
    <a href="/#ueber" class="nav-link" data-i18n="nav.about">Über HUI</a>
    <a href="/entdecken" class="nav-link" data-i18n="nav.discover">Entdecken</a>
    <a href="/#wie" class="nav-link" data-i18n="nav.how">Wie HUI wirkt</a>
    <a href="/impact" class="nav-link" aria-current="page" data-i18n="nav.impact">Impact</a>
    <a href="/#mitmachen" class="nav-link" data-i18n="nav.join">Mitmachen</a>
  </div>
  <button class="nav-ham" id="hamBtn" aria-label="Menü" data-i18n-aria="nav.menu-aria">
    <span></span><span></span><span></span>
  </button>
</nav>

<div class="drawer" id="drawer">
  <a href="/#ueber" data-i18n="nav.about">Über HUI</a>
  <a href="/entdecken" data-i18n="nav.discover">Entdecken</a>
  <a href="/#wie" data-i18n="nav.how">Wie HUI wirkt</a>
  <a href="/impact" aria-current="page" data-i18n="nav.impact">Impact</a>
  <a href="/#mitmachen" data-i18n="nav.join">Mitmachen</a>
</div>

<div class="backdrop" id="backdrop"></div>

<!-- ═══ HUI SIDEBAR ═══ -->
<button class="hui-tab" id="huiTab" aria-label="HUI Menü öffnen" data-i18n-aria="sidebar.tab.aria" aria-expanded="false" aria-controls="huiSidebar">
  <img src="/hui_logo.webp" alt="HUI" width="24" height="24"/>
</button>

<div class="hui-sidebar-backdrop" id="huiSidebarBackdrop" aria-hidden="true"></div>

<aside class="hui-sidebar" id="huiSidebar" role="complementary" aria-label="HUI Navigation" aria-hidden="true">
  <button class="hui-sidebar-close" id="huiSidebarClose" aria-label="Menü schließen" data-i18n-aria="sidebar.close.aria">
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M4 4L14 14M14 4L4 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
  </button>

  <div class="hui-sidebar-header">
    <img src="/hui_logo.webp" alt="HUI – Human United Intelligence" width="48" height="48" class="hui-sidebar-logo"/>
    <p class="hui-sidebar-tagline" data-i18n="sidebar.tagline">Entdecke HUI.</p>
    <p class="hui-sidebar-sub" data-i18n="sidebar.sub">Menschen. Ideen. Möglichkeiten.</p>
  </div>

  <div class="hui-sidebar-divider" aria-hidden="true"></div>

  <div class="hui-sidebar-scroll">
    <nav class="hui-sidebar-nav" aria-label="HUI Navigation">
      <!-- ENTDECKEN -->
      <section class="hui-nav-section">
        <p class="hui-nav-heading" data-i18n="sidebar.section.discover">Entdecken</p>
        <ul class="hui-nav-list">
          <li><a href="/werke" class="hui-nav-link" data-page="werke">
            <span class="hui-nav-link-label" data-i18n="sidebar.nav.works">Werke</span>
            <span class="hui-nav-link-sub" data-i18n="sidebar.sub.works">Geschaffenes entdecken</span>
          </a></li>
          <li><a href="/erlebnisse" class="hui-nav-link" data-page="erlebnisse">
            <span class="hui-nav-link-label" data-i18n="sidebar.nav.experiences">Erlebnisse</span>
            <span class="hui-nav-link-sub" data-i18n="sidebar.sub.experiences">Gemeinsame Momente erleben</span>
          </a></li>
          <li><a href="/unternehmen" class="hui-nav-link" data-page="unternehmen">
            <span class="hui-nav-link-label" data-i18n="sidebar.nav.companies">Unternehmen</span>
            <span class="hui-nav-link-sub" data-i18n="sidebar.sub.companies">Verantwortung und Partnerschaften</span>
          </a></li>
          <li><a href="/gemeinschaft" class="hui-nav-link" data-page="gemeinschaft">
            <span class="hui-nav-link-label" data-i18n="sidebar.nav.community">Gemeinschaft</span>
            <span class="hui-nav-link-sub" data-i18n="sidebar.sub.community">Menschen miteinander verbinden</span>
          </a></li>
          <li><a href="/impact" class="hui-nav-link" data-page="impact">
            <span class="hui-nav-link-label" data-i18n="nav.impact">Impact</span>
            <span class="hui-nav-link-sub" data-i18n="sidebar.sub.impact">Wirkung wird sichtbar</span>
          </a></li>
        </ul>
        <ul class="hui-nav-list-secondary">
          <li><a href="/menschen" data-i18n="sidebar.nav.people">Menschen</a></li>
          <li><a href="/talente" data-i18n="sidebar.nav.talents">Talente</a></li>
          <li><a href="/ideen" data-i18n="sidebar.nav.ideas">Ideen</a></li>
          <li><a href="/projekte" data-i18n="sidebar.nav.projects">Projekte</a></li>
        </ul>
      </section>

      <!-- DIE IDEE -->
      <section class="hui-nav-section">
        <p class="hui-nav-heading" data-i18n="sidebar.section.idea">Die Idee</p>
        <ul class="hui-nav-list">
          <li><a href="/was-ist-hui" class="hui-nav-link hui-nav-link-primary" data-page="was-ist-hui">
            <span class="hui-nav-link-label" data-i18n="sidebar.nav.what-is-hui">Was ist HUI?</span>
            <span class="hui-nav-link-sub" data-i18n="sidebar.sub.what-is-hui">Zentraler Einstieg</span>
          </a></li>
          <li><a href="/die-idee-dahinter" class="hui-nav-link-plain" data-i18n="sidebar.nav.the-idea">Die Idee dahinter</a></li>
          <li><a href="/warum-hui" class="hui-nav-link-plain" data-i18n="sidebar.nav.why-hui">Warum HUI?</a></li>
          <li><a href="https://4visionglobal.com/" target="_blank" rel="noopener noreferrer" class="hui-nav-link-plain" data-i18n="sidebar.nav.4vision">4VisionGlobal</a></li>
          <li><a href="https://ligaderkreativen.at/" target="_blank" rel="noopener noreferrer" class="hui-nav-link-plain" data-i18n="sidebar.nav.liga">Liga der Kreativen</a></li>
        </ul>
      </section>

      <!-- MITMACHEN -->
      <section class="hui-nav-section">
        <p class="hui-nav-heading" data-i18n="sidebar.section.join">Mitmachen</p>
        <ul class="hui-nav-list">
          <li><a href="/mitmachen/idee" class="hui-nav-action" data-page="mitmachen-idee">
            <span class="hui-nav-action-label" data-i18n="sidebar.nav.have-idea">Ich habe eine Idee</span>
          </a></li>
          <li><a href="/mitmachen/talent" class="hui-nav-action" data-page="mitmachen-talent">
            <span class="hui-nav-action-label" data-i18n="sidebar.nav.have-talent">Ich habe ein Talent</span>
          </a></li>
          <li><a href="/mitmachen/projekt" class="hui-nav-action" data-page="mitmachen-projekt">
            <span class="hui-nav-action-label" data-i18n="sidebar.nav.start-project">Ich möchte ein Projekt starten</span>
          </a></li>
          <li><a href="/mitmachen/unterstuetzen" class="hui-nav-action" data-page="mitmachen-unterstuetzen">
            <span class="hui-nav-action-label" data-i18n="sidebar.nav.support">Ich möchte unterstützen</span>
          </a></li>
        </ul>
      </section>

      <section class="hui-nav-section hui-nav-section-compact">
        <p class="hui-nav-heading" data-i18n="sidebar.section.coming">HUI kommt</p>
        <ul class="hui-nav-list-plain">
          <li><a href="/launch" data-i18n="sidebar.nav.launch">Launch</a></li>
          <li><a href="/updates" data-i18n="sidebar.nav.updates">Updates</a></li>
          <li><a href="/von-anfang-an-dabei" data-i18n="sidebar.nav.from-start">Von Anfang an dabei</a></li>
        </ul>
      </section>
    </nav>

    <!-- Die Reise von HUI -->
    <div class="hui-journey">
      <p class="hui-journey-title" data-i18n="sidebar.journey.title">Die Reise von HUI</p>
      <div class="hui-journey-steps">
        <div class="hui-journey-step hui-journey-active">
          <span class="hui-journey-num">01</span>
          <span class="hui-journey-label" data-i18n="sidebar.journey.1">Menschen</span>
        </div>
        <div class="hui-journey-step">
          <span class="hui-journey-num">02</span>
          <span class="hui-journey-label" data-i18n="sidebar.journey.2">Ideen</span>
        </div>
        <div class="hui-journey-step">
          <span class="hui-journey-num">03</span>
          <span class="hui-journey-label" data-i18n="sidebar.journey.3">Möglichkeiten</span>
        </div>
        <div class="hui-journey-step">
          <span class="hui-journey-num">04</span>
          <span class="hui-journey-label" data-i18n="sidebar.journey.4">Begegnungen</span>
        </div>
        <div class="hui-journey-step">
          <span class="hui-journey-num">05</span>
          <span class="hui-journey-label" data-i18n="sidebar.journey.5">Wirkung</span>
        </div>
      </div>
    </div>

    <!-- HUI Quote -->
    <div class="hui-quote">
      <p data-i18n="sidebar.quote">Eine Idee kann etwas bewegen. Gemeinsam kann sie die Welt verändern.</p>
    </div>
  </div>

  <div class="hui-sidebar-footer">
    <div class="hui-sidebar-lang" id="huiSidebarLang"></div>
    <div class="hui-sidebar-links">
      <a href="https://4visionglobal.com/" target="_blank" rel="noopener noreferrer">4VisionGlobal</a>
      <a href="https://ligaderkreativen.at/" target="_blank" rel="noopener noreferrer">Liga der Kreativen</a>
    </div>
  </div>
</aside>

<div class="hui-sidebar-toast" id="huiSidebarToast" role="alert" aria-live="polite">
  <p id="huiSidebarToastText"></p>
</div>

<div class="cs-toast" id="csToast" role="alert" aria-live="polite">
  <button class="cs-close" id="csToastClose" aria-label="Schließen" data-i18n-aria="cs.close-aria">&times;</button>
  <p class="cs-title" data-i18n="cs.title">HUI ist bald für dich da.</p>
  <p data-i18n="cs.text">Die HUI-App befindet sich momentan noch im Aufbau. Wir informieren dich, sobald es losgeht.</p>
</div>


`;

const FOOTER = `
<footer class="footer">
  <div class="footer-inner">
    <img src="/hui_logo.webp" alt="HUI" class="footer-logo" width="36" height="36"/>
    <p class="footer-tag" data-i18n="footer.tag">Human United Intelligence — Menschen. Ideen. Möglichkeiten.</p>
    <div class="footer-grid">
      <div class="footer-col">
        <h4 class="footer-col-title" data-i18n="footer.col1">HUI</h4>
        <a href="/#ueber" class="footer-link" data-i18n="footer.col1-1">Über HUI</a>
        <a href="/entdecken" class="footer-link" data-i18n="footer.col1-2">Entdecken</a>
        <a href="/#wie" class="footer-link" data-i18n="footer.col1-3">Wie HUI wirkt</a>
        <a href="/impact" class="footer-link" data-i18n="nav.impact">Impact</a>
        <a href="/#mitmachen" class="footer-link" data-i18n="footer.col1-4">Mitmachen</a>
        <a href="/was-ist-hui" class="footer-link" data-i18n="footer.col1-5">HUI entdecken</a>
      </div>
      <div class="footer-col">
        <h4 class="footer-col-title" data-i18n="footer.col2">Rechtliches</h4>
        <a href="/impressum" class="footer-link" data-i18n="footer.col2-1">Impressum</a>
        <a href="/datenschutz" class="footer-link" data-i18n="footer.col2-2">Datenschutz</a>
        <a href="/cookie-einstellungen" class="footer-link" data-i18n="footer.col2-3">Cookie-Einstellungen</a>
        <a href="/nutzungsbedingungen" class="footer-link" data-i18n="footer.col2-4">Nutzungsbedingungen</a>
        <a href="/barrierefreiheit" class="footer-link" data-i18n="footer.col2-5">Barrierefreiheit</a>
      </div>
      <div class="footer-col">
        <h4 class="footer-col-title" data-i18n="footer.col3">Kontakt &amp; Verbindungen</h4>
        <a href="/kontakt" class="footer-link" data-i18n="footer.col3-1">Kontakt</a>
        <a href="https://4visionglobal.com/" target="_blank" rel="noopener noreferrer" class="footer-link">4VisionGlobal</a>
        <a href="https://ligaderkreativen.at/" target="_blank" rel="noopener noreferrer" class="footer-link">Liga der Kreativen</a>
      </div>
    </div>
    <p class="footer-copy" data-i18n="footer.copy">© 2026 HUI — Human United Intelligence.</p>
  </div>
</footer>
`;

// ── HTML-Escaping (DB-Inhalte sind Nutzertext → immer escapen) ──
function esc(s) {
  if (s === null || s === undefined) return '';
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ── URL-sicherer Slug aus dem Projektnamen (deterministisch) ──
function slugify(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/\u00e4/g, 'ae').replace(/\u00f6/g, 'oe').replace(/\u00fc/g, 'ue').replace(/\u00df/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
}

// ── Vollständige HUI-Seite rendern ──
// opts: { lang, title, description, canonicalPath, ogTitle, jsonLd,
//         activePage, body, inlineScript, noindex, status }
function renderPage(opts) {
  const lang       = opts.lang === 'en' ? 'en' : 'de';
  const canonical  = 'https://be-hui.com' + opts.canonicalPath;
  const ogImage    = opts.ogImage || 'https://be-hui.com/hero.webp';
  const ogTitle    = opts.ogTitle || opts.title;
  const noindexTag = opts.noindex ? '<meta name="robots" content="noindex, follow"/>' : '';
  const jsonLd     = opts.jsonLd
    ? '<script type="application/ld+json">\n' + JSON.stringify(opts.jsonLd, null, 0) + '\n</script>'
    : '';

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1, interactive-widget=resizes-content"/>
<title>${esc(opts.title)}</title>
<meta name="description" content="${esc(opts.description)}"/>
<meta name="theme-color" content="#0DC4B5"/>
<link rel="icon" href="/favicon.ico" sizes="any"/>
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png"/>
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png"/>
<meta property="og:title" content="${esc(ogTitle)}"/>
<meta property="og:site_name" content="HUI — Human United Intelligence"/>
<meta property="og:description" content="${esc(opts.description)}"/>
<meta property="og:type" content="website"/>
<link rel="preload" as="font" href="/fonts/Inter-Regular.woff2" type="font/woff2" crossorigin/>
<link rel="stylesheet" href="/hui-shared.css"/>
<link rel="stylesheet" href="/hui-interactions.css"/>
<link rel="stylesheet" href="/impact.css"/>
<link rel="canonical" href="${canonical}"/>
${noindexTag}
<meta property="og:url" content="${canonical}"/>
<meta property="og:image" content="${ogImage}"/>
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(ogTitle)}">
<meta name="twitter:description" content="${esc(opts.description)}">
<meta name="twitter:image" content="${ogImage}">
<meta property="og:locale" content="${lang === 'en' ? 'en_US' : 'de_DE'}"/>
${jsonLd}
<!-- Privacy-friendly analytics by Plausible -->
<script async src="https://plausible.io/js/pa-0KhFSr-WTbTPddwKIV7pg.js"></script>
<script>
  window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};
  plausible.init()
</script>
</head>
<body>
${CHROME}
<!-- PAGE CONTENT -->
<main class="hui-page impact-page-main">
  <div class="page-hero-bg" aria-hidden="true"></div>
  <a href="/impact" class="hui-page-back" data-i18n="page.back">← HUI</a>
${opts.body}
</main>
${FOOTER}
<script src="/hui-pages.js"></script>
<script src="/i18n.js" defer></script>
<script src="/hui-interactions.js" defer></script>
<script src="/plausible-prep.js" defer></script>
${opts.inlineScript ? '<script>\n' + opts.inlineScript + '\n</script>' : ''}
</body>
</html>`;
}

// ── Zahlen-Formatierung (deutsche Notation, ohne erfundene Präzision) ──
function fmtEur(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '0 €';
  const [int, dec] = v.toFixed(v % 1 === 0 ? 0 : 2).split('.');
  const intDe = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return (dec ? intDe + ',' + dec : intDe) + ' €';
}

function pct(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '0';
  return String(Math.round(v));
}

module.exports = { renderPage, esc, slugify, fmtEur, pct };
