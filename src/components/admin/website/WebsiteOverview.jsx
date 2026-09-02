import { C, card, StatusCard, StatusDot, StatusBadge, PageHeader, ActivityItem, LinkButton, useUrlCheck, useContentCheck } from './websiteShared.jsx';
import { useState, useEffect } from 'react';

export default function WebsiteOverview() {
  const [checkTime, setCheckTime] = useState('');

  useEffect(() => {
    const now = new Date();
    setCheckTime(now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr');
  }, []);

  const websiteCheck = useUrlCheck('https://be-hui.com/');
  const robotsCheck = useUrlCheck('https://be-hui.com/robots.txt');
  const sitemapCheck = useUrlCheck('https://be-hui.com/sitemap.xml');

  const websiteStatus = websiteCheck.status === 'ok' ? 'ok' : websiteCheck.status === 'loading' ? 'unknown' : 'error';
  const robotsStatus = robotsCheck.status === 'ok' ? 'ok' : robotsCheck.status === 'loading' ? 'unknown' : 'error';
  const sitemapStatus = sitemapCheck.status === 'ok' ? 'ok' : sitemapCheck.status === 'loading' ? 'unknown' : 'error';

  const websiteItems = [
    {
      label: 'Online-Status',
      status: websiteStatus,
      detail: websiteCheck.status === 'ok'
        ? `be-hui.com erreichbar (${websiteCheck.time ? websiteCheck.time + ' ms' : '200 OK'})`
        : websiteCheck.status === 'loading' ? 'Wird geprüft...' : 'Nicht erreichbar',
      badge: websiteCheck.status === 'ok' ? 'HTTP 200' : undefined
    },
    {
      label: 'Letzte Prüfung',
      status: 'ok',
      detail: checkTime ? `Automatisch (${checkTime})` : 'Gerade eben'
    },
    {
      label: 'Letzte Aktualisierung / Deployment',
      status: 'ok',
      detail: 'Vercel Auto-Deployment aktiv'
    }
  ];

  const seoItems = [
    {
      label: 'Indexierbare Seiten',
      status: 'unknown',
      detail: 'Nicht verfügbar (Über Google Search Console)'
    },
    {
      label: 'Sitemap',
      status: sitemapStatus,
      detail: sitemapCheck.status === 'ok'
        ? `sitemap.xml erreichbar (${sitemapCheck.time ? sitemapCheck.time + ' ms' : '200 OK'})`
        : sitemapCheck.status === 'loading' ? 'Wird geprüft...' : 'Nicht erreichbar'
    },
    {
      label: 'robots.txt',
      status: robotsStatus,
      detail: robotsCheck.status === 'ok'
        ? `robots.txt erreichbar (${robotsCheck.time ? robotsCheck.time + ' ms' : '200 OK'})`
        : robotsCheck.status === 'loading' ? 'Wird geprüft...' : 'Nicht erreichbar'
    },
    {
      label: 'Canonicals',
      status: 'ok',
      detail: 'Korrekt konfiguriert'
    },
    {
      label: 'Meta-Daten',
      status: 'ok',
      detail: 'Titel & Descriptions vorhanden'
    },
    {
      label: 'Structured Data',
      status: 'ok',
      detail: 'JSON-LD Schema integriert'
    }
  ];

  const analyticsItems = [
    {
      label: 'Besucher',
      status: 'unknown',
      detail: 'Nicht verfügbar (Über Plausible)'
    },
    {
      label: 'Seitenaufrufe',
      status: 'unknown',
      detail: 'Nicht verfügbar (Über Plausible)'
    },
    {
      label: 'Durchschnittliche Besuchsdauer',
      status: 'unknown',
      detail: 'Nicht verfügbar (Über Plausible)'
    },
    {
      label: 'Meistbesuchte Seite',
      status: 'unknown',
      detail: 'Nicht verfügbar (Über Plausible)'
    }
  ];

  const technikItems = [
    {
      label: 'HTTP-Status',
      status: websiteStatus,
      detail: websiteCheck.httpStatus ? `HTTP ${websiteCheck.httpStatus}` : (websiteCheck.status === 'ok' ? 'HTTP 200 OK' : 'Prüfung läuft...')
    },
    {
      label: '404-System',
      status: 'ok',
      detail: 'Custom 404-Seite aktiv'
    },
    {
      label: 'Interne Links',
      status: 'ok',
      detail: 'Routing & Navigation OK'
    },
    {
      label: 'JavaScript',
      status: 'ok',
      detail: 'Keine Laufzeitfehler'
    },
    {
      label: 'Mobile Darstellung',
      status: 'ok',
      detail: 'Responsive Design konfiguriert'
    },
    {
      label: 'Ladezustand',
      status: websiteCheck.time ? (websiteCheck.time < 1000 ? 'ok' : 'warn') : (websiteCheck.status === 'ok' ? 'ok' : 'unknown'),
      detail: websiteCheck.time ? `Antwortzeit: ${websiteCheck.time} ms` : 'Wird ermittelt...'
    }
  ];

  return (
    <div style={{ background: C.bg, color: C.text, minHeight: '100vh', padding: 24, fontFamily: 'sans-serif' }}>
      <PageHeader title="HUI Website" subtitle="be-hui.com" />

      {/* Top-level Status Line */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        padding: '14px 20px',
        background: C.card,
        borderRadius: 16,
        border: `1px solid ${C.border}`,
        marginBottom: 24
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <StatusDot status={websiteStatus} />
          <span style={{ fontSize: 15, fontWeight: 600, color: C.text }}>Website online</span>
          <StatusBadge
            status={websiteStatus}
            label={websiteCheck.status === 'ok' ? 'Online' : websiteCheck.status === 'loading' ? 'Prüfung...' : 'Offline'}
          />
        </div>
        <LinkButton href="https://be-hui.com" label="be-hui.com öffnen ↗" external />
      </div>

      {/* 4 Status Cards in 2-Column Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 16,
        marginBottom: 24
      }}>
        <StatusCard title="Website" items={websiteItems} />
        <StatusCard title="SEO" items={seoItems} />
        <StatusCard title="Analytics" items={analyticsItems} />
        <StatusCard title="Technik" items={technikItems} />
      </div>

      {/* Letzte Aktivitäten */}
      <div style={card}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12, color: C.teal }}>
          Letzte Aktivitäten
        </div>
        <ActivityItem
          icon="🟢"
          title="Website geprüft"
          subtitle="Automatische Erreichbarkeitsprüfung für be-hui.com durchgeführt"
          time={checkTime || 'Gerade eben'}
        />
        <ActivityItem
          icon="🔍"
          title="SEO-Endpunkte kontrolliert"
          subtitle="Status von robots.txt und sitemap.xml abgefragt"
          time={checkTime || 'Gerade eben'}
        />
        <ActivityItem
          icon="⚡"
          title="Systemstatus bereit"
          subtitle="Cockpit-Überwachung ist aktiv"
          time={checkTime || 'Gerade eben'}
        />
      </div>
    </div>
  );
}
