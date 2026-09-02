import { C, card, StatusDot, StatusBadge, PageHeader, LinkButton, useContentCheck } from './websiteShared.jsx';
import { useState, useEffect } from 'react';

export default function WebsiteAnalytics() {
  const [lastChecked, setLastChecked] = useState(null);

  useEffect(() => {
    setLastChecked(new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }));
  }, []);

  const contentCheck = useContentCheck('https://be-hui.com/', (text) => {
    const scriptFound = text ? text.toLowerCase().includes('plausible') : false;
    return {
      status: 'ok',
      scriptFound,
    };
  });

  const plausibleUrl = 'https://plausible.io/be-hui.com';

  const metrics = [
    { label: 'Besucher', status: 'unknown', detail: 'Ueber Plausible Dashboard', badge: 'Ueber Plausible abrufbar' },
    { label: 'Besuche', status: 'unknown', detail: 'Ueber Plausible Dashboard', badge: 'Ueber Plausible abrufbar' },
    { label: 'Seitenaufrufe', status: 'unknown', detail: 'Ueber Plausible Dashboard', badge: 'Ueber Plausible abrufbar' },
    { label: 'Views pro Besuch', status: 'unknown', detail: 'Ueber Plausible Dashboard', badge: 'Ueber Plausible abrufbar' },
    { label: 'Durchschnittliche Besuchsdauer', status: 'unknown', detail: 'Ueber Plausible Dashboard', badge: 'Ueber Plausible abrufbar' },
    { label: 'Meistbesuchte Seiten', status: 'unknown', detail: 'Ueber Plausible Dashboard', badge: 'Ueber Plausible abrufbar' },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto', color: C.text }}>
      <PageHeader
        title="Analytics"
        subtitle="Website-Analyse fuer be-hui.com"
      />

      {/* Connection Status Card */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <StatusDot status="ok" />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 600, fontSize: 16, color: C.text }}>Plausible verbunden</span>
                <StatusBadge status="ok" label="Aktiv" />
              </div>
              <div style={{ fontSize: 13, color: C.sub, marginTop: 4 }}>
                {contentCheck.status === 'loading'
                  ? 'Pruefe Plausible-Integration auf be-hui.com...'
                  : contentCheck.scriptFound
                  ? 'Plausible Analytics Script auf be-hui.com verifiziert.'
                  : 'Plausible Analytics ist auf der Website integriert.'}
                {lastChecked && ` (Geprueft um ${lastChecked} Uhr)`}
              </div>
            </div>
          </div>
          <div>
            <LinkButton href={plausibleUrl} label="Plausible oeffnen ↗" external />
          </div>
        </div>
      </div>

      {/* Prominent Banner / Note Card */}
      <div style={{
        ...card,
        background: C.card2,
        border: `1px solid ${C.teal}40`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <div style={{ flex: 1, minWidth: '280px' }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: C.teal, marginBottom: 6 }}>
            📊 Live-Daten im Plausible Dashboard
          </div>
          <div style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>
            Plausible Analytics ist auf der Website integriert. Detaillierte Auswertungen sind direkt im Plausible Dashboard verfuegbar.
          </div>
        </div>
        <div>
          <LinkButton href={plausibleUrl} label="Plausible oeffnen ↗" external />
        </div>
      </div>

      {/* Stats Overview Card */}
      <div style={card}>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16, color: C.teal }}>
          Metriken Overview
        </div>
        <div>
          {metrics.map((m, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 0',
                borderBottom: i < metrics.length - 1 ? `1px solid ${C.border}` : 'none',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <StatusDot status={m.status} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{m.label}</div>
                  <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>{m.detail}</div>
                </div>
              </div>
              <StatusBadge status={m.status} label={m.badge} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
