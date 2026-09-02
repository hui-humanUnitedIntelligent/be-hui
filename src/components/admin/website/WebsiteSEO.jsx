import { C, card, StatusCard, StatusDot, StatusBadge, PageHeader, LinkButton, ActionButton, useUrlCheck, useContentCheck } from './websiteShared.jsx';
import { useState, useEffect } from 'react';

export default function WebsiteSEO() {
  const [gscNotice, setGscNotice] = useState(false);

  // 1. Indexierung Checks
  const robotsNoindexCheck = useContentCheck('https://be-hui.com/robots.txt', (text) => {
    if (!text) return { status: 'unknown', detail: 'Keine Antwort' };
    const lines = text.split('\n');
    const noindexLines = lines.filter(line => line.toLowerCase().includes('noindex'));
    if (noindexLines.length > 0) {
      return { status: 'warn', detail: `${noindexLines.length} Noindex-Anweisung(en) in robots.txt` };
    }
    return { status: 'ok', detail: 'Keine Noindex-Anweisungen in robots.txt' };
  });

  const canonicalCheck = useContentCheck('https://be-hui.com/', (html) => {
    if (!html) return { status: 'warn', detail: 'Kein HTML empfangen' };
    const hasCanonical = /rel=["']canonical["']/i.test(html) || /href=["'][^"']*["'][^>]*rel=["']canonical["']/i.test(html);
    if (hasCanonical) {
      const match = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i) ||
                    html.match(/<link[^>]*href=["']([^"']*)["'][^>]*rel=["']canonical["']/i);
      const href = match ? match[1] : null;
      return {
        status: 'ok',
        detail: href ? `Canonical Tag vorhanden (${href})` : 'Canonical Tag vorhanden'
      };
    }
    return { status: 'warn', detail: 'Kein Canonical Tag auf Landingpage gefunden' };
  });

  // 2. Meta-Daten Checks
  const titleCheck = useContentCheck('https://be-hui.com/', (html) => {
    if (!html) return { status: 'warn', detail: 'Kein HTML empfangen' };
    const match = html.match(/<title[^>]*>(.*?)<\/title>/i);
    const titleText = match ? match[1].trim() : '';
    const hasTitle = titleText.length > 0;
    return {
      status: hasTitle ? 'ok' : 'warn',
      detail: hasTitle ? `Vorhanden ("${titleText}")` : 'Fehlt oder leer'
    };
  });

  const metaDescCheck = useContentCheck('https://be-hui.com/', (html) => {
    if (!html) return { status: 'warn', detail: 'Kein HTML empfangen' };
    const match = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) ||
                  html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i);
    const descText = match ? match[1].trim() : '';
    const hasDesc = descText.length > 0;
    return {
      status: hasDesc ? 'ok' : 'warn',
      detail: hasDesc ? `Vorhanden (${descText.length} Zeichen)` : 'Fehlt oder leer'
    };
  });

  const ogCheck = useContentCheck('https://be-hui.com/', (html) => {
    if (!html) return { status: 'warn', detail: 'Kein HTML empfangen' };
    const hasOG = /<meta[^>]*property=["']og:[^"']+["']/i.test(html) ||
                  /<meta[^>]*name=["']og:[^"']+["']/i.test(html) ||
                  html.includes('og:');
    return {
      status: hasOG ? 'ok' : 'warn',
      detail: hasOG ? 'Open Graph Tags vorhanden' : 'Keine Open Graph Tags gefunden'
    };
  });

  const twitterCheck = useContentCheck('https://be-hui.com/', (html) => {
    if (!html) return { status: 'warn', detail: 'Kein HTML empfangen' };
    const hasTwitter = /<meta[^>]*name=["']twitter:[^"']+["']/i.test(html) ||
                       /<meta[^>]*property=["']twitter:[^"']+["']/i.test(html) ||
                       html.includes('twitter:');
    return {
      status: hasTwitter ? 'ok' : 'warn',
      detail: hasTwitter ? 'Twitter Card Tags vorhanden' : 'Keine Twitter Card Tags gefunden'
    };
  });

  // 3. Crawling Checks
  const sitemapUrlCheck = useUrlCheck('https://be-hui.com/sitemap.xml');
  const robotsUrlCheck = useUrlCheck('https://be-hui.com/robots.txt');
  const landingUrlCheck = useUrlCheck('https://be-hui.com/');

  // 4. Structured Data Checks
  const orgSchemaCheck = useContentCheck('https://be-hui.com/', (html) => {
    if (!html) return { status: 'warn', detail: 'Kein HTML empfangen' };
    const ldJsonMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
    let hasOrg = false;
    for (const match of ldJsonMatches) {
      if (match.includes('"Organization"') || match.includes("'Organization'") || match.includes('"@type":"Organization"')) {
        hasOrg = true;
        break;
      }
    }
    return {
      status: hasOrg ? 'ok' : 'warn',
      detail: hasOrg ? 'JSON-LD Organization vorhanden' : 'Kein Organization Schema gefunden'
    };
  });

  const faqSchemaCheck = useContentCheck('https://be-hui.com/', (html) => {
    if (!html) return { status: 'warn', detail: 'Kein HTML empfangen' };
    const ldJsonMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
    let hasFaq = false;
    for (const match of ldJsonMatches) {
      if (match.includes('"FAQPage"') || match.includes("'FAQPage'") || match.includes('"@type":"FAQPage"')) {
        hasFaq = true;
        break;
      }
    }
    return {
      status: hasFaq ? 'ok' : 'warn',
      detail: hasFaq ? 'JSON-LD FAQPage vorhanden' : 'Kein FAQPage Schema gefunden'
    };
  });

  // Helper function to resolve check state safely
  const resolveStatus = (checkObj, fallbackOkWarn = true) => {
    if (checkObj.status === 'loading') return 'unknown';
    if (checkObj.status === 'error') return fallbackOkWarn ? 'warn' : 'unknown';
    return checkObj.status || 'unknown';
  };

  const resolveDetail = (checkObj) => {
    if (checkObj.status === 'loading') return 'Wird geprueft...';
    if (checkObj.status === 'error') return 'Konnte nicht abgerufen werden';
    return checkObj.detail || 'Nicht geprueft';
  };

  // Section Items
  const indexierungItems = [
    {
      label: 'Anzahl indexierbarer Seiten',
      status: 'unknown',
      detail: 'Ueber Google Search Console'
    },
    {
      label: 'Anzahl noindex-Seiten',
      status: resolveStatus(robotsNoindexCheck),
      detail: resolveDetail(robotsNoindexCheck)
    },
    {
      label: 'Canonical-Status',
      status: resolveStatus(canonicalCheck),
      detail: resolveDetail(canonicalCheck)
    },
    {
      label: 'Moegliche Duplikate',
      status: 'unknown',
      detail: 'Ueber Google Search Console'
    }
  ];

  const metaDatenItems = [
    {
      label: 'Titles',
      status: resolveStatus(titleCheck),
      detail: resolveDetail(titleCheck)
    },
    {
      label: 'Meta Descriptions',
      status: resolveStatus(metaDescCheck),
      detail: resolveDetail(metaDescCheck)
    },
    {
      label: 'Open Graph',
      status: resolveStatus(ogCheck),
      detail: resolveDetail(ogCheck)
    },
    {
      label: 'Twitter Cards',
      status: resolveStatus(twitterCheck),
      detail: resolveDetail(twitterCheck)
    }
  ];

  const crawlingItems = [
    {
      label: 'sitemap.xml',
      status: sitemapUrlCheck.status === 'loading' ? 'unknown' : (sitemapUrlCheck.status === 'ok' ? 'ok' : 'warn'),
      detail: sitemapUrlCheck.status === 'loading'
        ? 'Wird geprueft...'
        : sitemapUrlCheck.status === 'ok'
          ? `Erreichbar (HTTP ${sitemapUrlCheck.httpStatus}, ${sitemapUrlCheck.time}ms)`
          : `Nicht erreichbar${sitemapUrlCheck.httpStatus ? ` (HTTP ${sitemapUrlCheck.httpStatus})` : ''}`
    },
    {
      label: 'robots.txt',
      status: robotsUrlCheck.status === 'loading' ? 'unknown' : (robotsUrlCheck.status === 'ok' ? 'ok' : 'warn'),
      detail: robotsUrlCheck.status === 'loading'
        ? 'Wird geprueft...'
        : robotsUrlCheck.status === 'ok'
          ? `Erreichbar (HTTP ${robotsUrlCheck.httpStatus}, ${robotsUrlCheck.time}ms)`
          : `Nicht erreichbar${robotsUrlCheck.httpStatus ? ` (HTTP ${robotsUrlCheck.httpStatus})` : ''}`
    },
    {
      label: 'HTTP-Status',
      status: landingUrlCheck.status === 'loading' ? 'unknown' : (landingUrlCheck.status === 'ok' ? 'ok' : 'error'),
      detail: landingUrlCheck.status === 'loading'
        ? 'Wird geprueft...'
        : landingUrlCheck.status === 'ok'
          ? `200 OK (${landingUrlCheck.time}ms)`
          : `Fehler${landingUrlCheck.httpStatus ? ` (HTTP ${landingUrlCheck.httpStatus})` : ''}`
    },
    {
      label: '404',
      status: 'unknown',
      detail: 'Kann nicht im Browser getestet werden'
    }
  ];

  const structuredDataItems = [
    {
      label: 'Organization',
      status: resolveStatus(orgSchemaCheck),
      detail: resolveDetail(orgSchemaCheck)
    },
    {
      label: 'FAQPage',
      status: resolveStatus(faqSchemaCheck),
      detail: resolveDetail(faqSchemaCheck)
    },
    {
      label: 'Weitere',
      status: 'unknown',
      detail: 'Nicht geprueft'
    }
  ];

  return (
    <div style={{ padding: "8px 0" }}>
      <PageHeader
        title="SEO & Google Health"
        subtitle="Suchmaschinenoptimierung und Indexierungs-Status fuer be-hui.com"
      />

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
        gap: 16,
        marginBottom: 24
      }}>
        <StatusCard title="Indexierung" items={indexierungItems} />
        <StatusCard title="Meta-Daten" items={metaDatenItems} />
        <StatusCard title="Crawling" items={crawlingItems} />
        <StatusCard title="Structured Data" items={structuredDataItems} />
      </div>

      <div style={card}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <span style={{ fontWeight: 600, fontSize: 15, color: C.text }}>
                Google Search Console
              </span>
              <StatusBadge status="warn" label="Noch nicht verbunden" />
            </div>
            <div style={{ fontSize: 13, color: C.sub, maxWidth: 540, lineHeight: 1.4 }}>
              Verbinde Google Search Console für detaillierte Indexierungsprüfungen, Suchbegriffe und Keyword-Rankings.
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {gscNotice && (
              <span style={{ fontSize: 12, color: C.gold, fontWeight: 600 }}>
                Coming soon
              </span>
            )}
            <div
              onClick={() => setGscNotice(true)}
              style={{ cursor: "pointer", display: "inline-block" }}
              title="Coming soon"
            >
              <ActionButton
                onClick={(e) => {
                  e.stopPropagation();
                  setGscNotice(true);
                }}
                label="Google Search Console verbinden"
                disabled={true}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
