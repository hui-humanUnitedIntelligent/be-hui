import { C, card, StatusCard, StatusDot, StatusBadge, PageHeader, useUrlCheck, useContentCheck } from './websiteShared.jsx';
import { useState, useEffect } from 'react';

// Content check helper functions
function checkCanonical(text, res) {
  if (!res || !res.ok) return { status: 'error', data: 'Startseite konnte nicht geladen werden' };
  const hasCanonical = /<link[^>]*rel=["']canonical["']/i.test(text);
  return {
    status: hasCanonical ? 'ok' : 'warn',
    data: hasCanonical ? 'Canonical-Tag in HTML-Head vorhanden' : 'Kein rel="canonical" im HTML-Head gefunden',
  };
}

function checkPlausible(text, res) {
  if (!res || !res.ok) return { status: 'error', data: 'Startseite konnte nicht geladen werden' };
  const hasPlausible = /plausible(\.io|\.js)/i.test(text) || text.toLowerCase().includes('plausible');
  return {
    status: hasPlausible ? 'ok' : 'warn',
    data: hasPlausible ? 'Plausible Analytics Script in HTML gefunden' : 'Plausible Analytics Script nicht im HTML gefunden',
  };
}

function TechStatusContent({ onRefresh }) {
  // Real client-side checks for be-hui.com
  const mainUrlCheck = useUrlCheck('https://be-hui.com/');
  const check404 = useUrlCheck('https://be-hui.com/this-page-does-not-exist-test-404-check');
  const sitemapCheck = useUrlCheck('https://be-hui.com/sitemap.xml');
  const robotsCheck = useUrlCheck('https://be-hui.com/robots.txt');
  const canonicalCheck = useContentCheck('https://be-hui.com/', checkCanonical);
  const plausibleCheck = useContentCheck('https://be-hui.com/', checkPlausible);

  // Status calculations
  // 1. Website erreichbar
  const websiteStatus = mainUrlCheck.status === 'loading'
    ? 'loading'
    : (mainUrlCheck.status === 'ok' ? 'ok' : 'error');

  // 2. SSL Check (if https:// fetch succeeds, SSL is working)
  const sslStatus = mainUrlCheck.status === 'loading'
    ? 'loading'
    : (mainUrlCheck.status === 'ok' ? 'ok' : 'error');

  // 3. HTTP-Statuscode
  const httpStatusStatus = mainUrlCheck.status === 'loading'
    ? 'loading'
    : (mainUrlCheck.httpStatus && mainUrlCheck.httpStatus >= 200 && mainUrlCheck.httpStatus < 400 ? 'ok' : 'error');

  // 4. 404 Check
  let status404 = 'loading';
  let detail404 = 'Wird geprueft...';
  let badge404 = 'Pruefe...';
  if (check404.status !== 'loading') {
    if (check404.httpStatus === 404) {
      status404 = 'ok';
      detail404 = '404 Statuscode wird fuer ungueltige URLs korrekt geliefert';
      badge404 = '404 OK';
    } else if (check404.httpStatus) {
      status404 = 'warn';
      detail404 = `Ungueltige URL lieferte HTTP ${check404.httpStatus} statt 404`;
      badge404 = `HTTP ${check404.httpStatus}`;
    } else {
      status404 = 'unknown';
      detail404 = '404-Test im Browser nicht verifizierbar (CORS/Netzwerk)';
      badge404 = 'Nicht verifizierbar';
    }
  }

  // 5. Sitemap
  const sitemapStatus = sitemapCheck.status === 'loading'
    ? 'loading'
    : (sitemapCheck.status === 'ok' ? 'ok' : 'error');

  // 6. robots.txt
  const robotsStatus = robotsCheck.status === 'loading'
    ? 'loading'
    : (robotsCheck.status === 'ok' ? 'ok' : 'error');

  // 7. Canonical Tags
  const canonicalStatus = canonicalCheck.status === 'loading'
    ? 'loading'
    : canonicalCheck.status;

  // 8. Plausible Analytics
  const plausibleStatus = plausibleCheck.status === 'loading'
    ? 'loading'
    : plausibleCheck.status;

  // 9. Grundlegende Ladezeit
  const ladezeitStatus = mainUrlCheck.status === 'loading'
    ? 'loading'
    : (mainUrlCheck.time === null
        ? 'error'
        : (mainUrlCheck.time < 2000 ? 'ok' : (mainUrlCheck.time < 5000 ? 'warn' : 'error')));

  // Testable checks evaluation for Health Score
  const testableChecks = [
    websiteStatus,
    sslStatus,
    httpStatusStatus,
    status404,
    sitemapStatus,
    robotsStatus,
    canonicalStatus,
    plausibleStatus,
    ladezeitStatus,
  ];

  const completedChecks = testableChecks.filter(s => s !== 'loading' && s !== 'unknown');
  const okChecks = completedChecks.filter(s => s === 'ok');

  let healthScoreText = 'Wird geprueft...';
  let healthPercent = null;

  if (completedChecks.length >= 3) {
    healthPercent = Math.round((okChecks.length / completedChecks.length) * 100);
    healthScoreText = `${healthPercent}%`;
  }

  const getHealthColor = (percent) => {
    if (percent === null) return C.sub;
    if (percent >= 80) return C.green;
    if (percent >= 50) return C.yellow;
    return C.red;
  };

  // Card items definitions
  const card1Items = [
    {
      label: 'Website erreichbar',
      status: websiteStatus,
      detail: mainUrlCheck.status === 'loading'
        ? 'Wird geprueft...'
        : (websiteStatus === 'ok' ? 'https://be-hui.com/ ist online' : 'Website nicht erreichbar'),
      badge: mainUrlCheck.status === 'loading' ? 'Pruefe...' : (websiteStatus === 'ok' ? 'Online' : 'Offline'),
    },
    {
      label: 'SSL-Zertifikat',
      status: sslStatus,
      detail: mainUrlCheck.status === 'loading'
        ? 'Wird geprueft...'
        : (sslStatus === 'ok' ? 'HTTPS-Verbindung ist sicher und aktiv' : 'HTTPS-Verbindung fehlgeschlagen'),
      badge: mainUrlCheck.status === 'loading' ? 'Pruefe...' : (sslStatus === 'ok' ? 'Gueltig' : 'Fehler'),
    },
    {
      label: 'HTTP-Statuscode',
      status: httpStatusStatus,
      detail: mainUrlCheck.status === 'loading'
        ? 'Wird geprueft...'
        : (mainUrlCheck.httpStatus ? `HTTP Statuscode ${mainUrlCheck.httpStatus}` : 'Kein HTTP Status empfangen'),
      badge: mainUrlCheck.status === 'loading' ? 'Pruefe...' : (mainUrlCheck.httpStatus ? `HTTP ${mainUrlCheck.httpStatus}` : 'Fehler'),
    },
    {
      label: '404 Fehlerseite',
      status: status404,
      detail: detail404,
      badge: badge404,
    },
  ];

  const card2Items = [
    {
      label: 'Sitemap (sitemap.xml)',
      status: sitemapStatus,
      detail: sitemapCheck.status === 'loading'
        ? 'Wird geprueft...'
        : (sitemapStatus === 'ok' ? 'sitemap.xml ist vorhanden und erreichbar' : 'sitemap.xml nicht gefunden'),
      badge: sitemapCheck.status === 'loading' ? 'Pruefe...' : (sitemapStatus === 'ok' ? 'Vorhanden' : 'Fehlt'),
    },
    {
      label: 'Robots.txt',
      status: robotsStatus,
      detail: robotsCheck.status === 'loading'
        ? 'Wird geprueft...'
        : (robotsStatus === 'ok' ? 'robots.txt ist vorhanden und erreichbar' : 'robots.txt nicht gefunden'),
      badge: robotsCheck.status === 'loading' ? 'Pruefe...' : (robotsStatus === 'ok' ? 'Vorhanden' : 'Fehlt'),
    },
    {
      label: 'Canonical Tags',
      status: canonicalStatus,
      detail: canonicalCheck.status === 'loading'
        ? 'Wird geprueft...'
        : (canonicalCheck.data || (canonicalStatus === 'ok' ? 'Canonical Tag vorhanden' : 'Kein Canonical Tag')),
      badge: canonicalCheck.status === 'loading' ? 'Pruefe...' : (canonicalStatus === 'ok' ? 'Aktiv' : 'Fehlt'),
    },
  ];

  const card3Items = [
    {
      label: 'Grundlegende Ladezeit',
      status: ladezeitStatus,
      detail: mainUrlCheck.status === 'loading'
        ? 'Wird geprueft...'
        : (mainUrlCheck.time !== null ? `Antwortzeit der Startseite: ${mainUrlCheck.time} ms` : 'Keine Antwortzeit gemessen'),
      badge: mainUrlCheck.status === 'loading' ? 'Pruefe...' : (mainUrlCheck.time !== null ? `${mainUrlCheck.time} ms` : 'Fehler'),
    },
    {
      label: 'JavaScript',
      status: 'unknown',
      detail: 'Vollstaendige JS-Analyse im Admin-Panel nicht moeglich',
      badge: 'Nicht pruefbar',
    },
    {
      label: 'Mobile Darstellung',
      status: 'unknown',
      detail: 'Automatischer Responsive-Test im Admin-Panel nicht moeglich',
      badge: 'Nicht pruefbar',
    },
  ];

  const card4Items = [
    {
      label: 'Plausible Analytics',
      status: plausibleStatus,
      detail: plausibleCheck.status === 'loading'
        ? 'Wird geprueft...'
        : (plausibleCheck.data || (plausibleStatus === 'ok' ? 'Script eingebunden' : 'Script nicht gefunden')),
      badge: plausibleCheck.status === 'loading' ? 'Pruefe...' : (plausibleStatus === 'ok' ? 'Eingebunden' : 'Nicht gefunden'),
    },
    {
      label: 'Interne Links',
      status: 'unknown',
      detail: 'Vollstaendiger Link-Crawl im Browser nicht moeglich',
      badge: 'Nicht pruefbar',
    },
  ];

  return (
    <>
      {/* Score Banner */}
      <div style={{
        background: C.card,
        borderRadius: 16,
        padding: 24,
        border: `1px solid ${C.border}`,
        marginBottom: 24,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <div>
          <div style={{ fontSize: 13, color: C.sub, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Website-Gesundheit
          </div>
          <div style={{ fontSize: 36, fontWeight: 700, color: getHealthColor(healthPercent), marginTop: 4 }}>
            {healthScoreText}
          </div>
          {completedChecks.length >= 3 && (
            <div style={{ fontSize: 12, color: C.sub, marginTop: 4 }}>
              {okChecks.length} von {completedChecks.length} abgeschlossenen Pruefungen erfolgreich
            </div>
          )}
        </div>

        <button
          onClick={onRefresh}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            borderRadius: 20,
            border: 'none',
            background: C.teal,
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(42,191,172,0.25)',
            transition: 'transform 0.1s, opacity 0.15s',
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.97)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          🔄 Neu pruefen
        </button>
      </div>

      {/* 2-Column Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: 16,
      }}>
        <StatusCard title="Verfuegbarkeit" items={card1Items} />
        <StatusCard title="Crawling" items={card2Items} />
        <StatusCard title="Performance" items={card3Items} />
        <StatusCard title="Integration" items={card4Items} />
      </div>
    </>
  );
}

export default function WebsiteTechStatus() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div>
      <PageHeader
        title="Technischer Status"
        subtitle="Technische Gesundheitsuebersicht fuer be-hui.com"
      />
      <TechStatusContent key={refreshKey} onRefresh={handleRefresh} />
    </div>
  );
}
