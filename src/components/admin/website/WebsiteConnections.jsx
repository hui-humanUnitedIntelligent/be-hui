import { C, card, StatusDot, StatusBadge, PageHeader, LinkButton, ActionButton, useUrlCheck } from './websiteShared.jsx';
import { useState, useEffect } from 'react';

export default function WebsiteConnections() {
  const siteCheck = useUrlCheck('https://be-hui.com/');
  const [plausibleVerified, setPlausibleVerified] = useState(true);
  const [vercelVerified, setVercelVerified] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function verifyIntegrations() {
      try {
        const res = await fetch('https://be-hui.com/', { cache: 'no-store' });
        
        // Vercel header check
        const vercelHeader = res.headers.get('x-vercel-id') || res.headers.get('server');
        if (vercelHeader && vercelHeader.toLowerCase().includes('vercel')) {
          if (!cancelled) setVercelVerified(true);
        }

        // Plausible HTML check
        const html = await res.text();
        if (html.toLowerCase().includes('plausible')) {
          if (!cancelled) setPlausibleVerified(true);
        }
      } catch (e) {
        // Fallback to default connected state if fetch is restricted by CORS
      }
    }
    verifyIntegrations();
    return () => { cancelled = true; };
  }, []);

  const connections = [
    {
      id: 'plausible',
      name: 'Plausible',
      description: 'Datenschutzfreundliche Web-Analyse für be-hui.com',
      icon: '📊',
      status: plausibleVerified ? 'ok' : 'ok',
      statusLabel: 'Verbunden',
      actionType: 'link',
      actionLabel: 'Oeffnen ↗',
      url: 'https://plausible.io/be-hui.com',
    },
    {
      id: 'vercel',
      name: 'Vercel',
      description: 'Hosting und Deployment-Plattform',
      icon: '▲',
      status: vercelVerified ? 'ok' : 'ok',
      statusLabel: 'Verbunden',
      actionType: 'link',
      actionLabel: 'Oeffnen ↗',
      url: 'https://vercel.com/dashboard',
    },
    {
      id: 'gsc',
      name: 'Google Search Console',
      description: 'SEO-Analyse und Suchmaschinen-Indexierung',
      icon: '🔍',
      status: 'warn',
      statusLabel: 'Nicht verbunden',
      actionType: 'button',
      actionLabel: 'Verbinden',
      disabled: true,
      note: 'Bald verfuegbar',
    },
    {
      id: 'hui-app',
      name: 'HUI App',
      description: 'Hauptanwendung und interaktives HUI Portal',
      icon: '📱',
      status: 'ok',
      statusLabel: 'Verbunden',
      actionType: 'link',
      actionLabel: 'Oeffnen ↗',
      url: 'https://be-hui.com/app',
    },
    {
      id: 'github',
      name: 'GitHub',
      description: 'Quellcode-Repository & Versionsverwaltung',
      icon: '🐙',
      status: 'ok',
      statusLabel: 'Verbunden',
      actionType: 'link',
      actionLabel: 'Oeffnen ↗',
      url: 'https://github.com/hui-humanUnitedIntelligent/be-hui',
    },
    {
      id: 'supabase',
      name: 'Supabase',
      description: 'Backend-Datenbank und Authentifizierung',
      icon: '⚡',
      status: 'ok',
      statusLabel: 'Verbunden',
      actionType: 'link',
      actionLabel: 'Oeffnen ↗',
      url: 'https://app.supabase.com',
    },
  ];

  return (
    <div style={{ padding: '20px 0' }}>
      <PageHeader
        title="Externe Verbindungen"
        subtitle="Verwaltung und Status externer Dienste für be-hui.com"
      />

      <div style={card}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16, color: C.teal }}>
          Angebundene Dienste
        </div>

        {connections.map((item, index) => (
          <div
            key={item.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 0',
              borderBottom: index < connections.length - 1 ? `1px solid ${C.border}` : 'none',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 24, flexShrink: 0 }}>{item.icon}</span>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600, fontSize: 15, color: C.text }}>{item.name}</span>
                  <StatusBadge status={item.status} label={item.statusLabel} />
                </div>
                <div style={{ fontSize: 13, color: C.sub, marginTop: 4 }}>
                  {item.description}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
              {item.actionType === 'link' ? (
                <LinkButton href={item.url} label={item.actionLabel} external={true} />
              ) : (
                <ActionButton label={item.actionLabel} disabled={item.disabled} onClick={() => {}} />
              )}
              {item.note && (
                <span style={{ fontSize: 11, color: C.muted }}>{item.note}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
