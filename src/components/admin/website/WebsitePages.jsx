import { C, card, StatusDot, StatusBadge, PageHeader, useUrlCheck } from './websiteShared.jsx';
import { useState, useEffect } from 'react';

const PAGES = [
  { name: 'Startseite', url: '/', path: 'https://be-hui.com/' },
  { name: 'Die Idee dahinter', url: '/die-idee-dahinter', path: 'https://be-hui.com/die-idee-dahinter' },
  { name: 'Erlebnisse', url: '/erlebnisse', path: 'https://be-hui.com/erlebnisse' },
  { name: 'Gemeinschaft', url: '/gemeinschaft', path: 'https://be-hui.com/gemeinschaft' },
  { name: 'Ideen', url: '/ideen', path: 'https://be-hui.com/ideen' },
  { name: 'Menschen', url: '/menschen', path: 'https://be-hui.com/menschen' },
  { name: 'Talente', url: '/talente', path: 'https://be-hui.com/talente' },
  { name: 'Mitmachen - Idee', url: '/mitmachen/idee', path: 'https://be-hui.com/mitmachen/idee' },
  { name: 'Mitmachen - Projekt', url: '/mitmachen/projekt', path: 'https://be-hui.com/mitmachen/projekt' },
  { name: 'Mitmachen - Talent', url: '/mitmachen/talent', path: 'https://be-hui.com/mitmachen/talent' },
  { name: 'Mitmachen - Informiert', url: '/mitmachen/informiert', path: 'https://be-hui.com/mitmachen/informiert' },
  { name: 'Mitmachen - Unterstuetzen', url: '/mitmachen/unterstuetzen', path: 'https://be-hui.com/mitmachen/unterstuetzen' },
  { name: 'Startphase', url: '/startphase', path: 'https://be-hui.com/startphase' },
  { name: 'Impressum', url: '/impressum', path: 'https://be-hui.com/impressum' },
  { name: 'Datenschutz', url: '/datenschutz', path: 'https://be-hui.com/datenschutz' },
  { name: 'Nutzungsbedingungen', url: '/nutzungsbedingungen', path: 'https://be-hui.com/nutzungsbedingungen' },
  { name: 'Kontakt', url: '/kontakt', path: 'https://be-hui.com/kontakt' },
];

export default function WebsitePages() {
  const [statuses, setStatuses] = useState({});
  const [isChecking, setIsChecking] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  // Single URL hook check for real-time status of root page
  const mainPageCheck = useUrlCheck('https://be-hui.com/');

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const checkPages = async () => {
    setIsChecking(true);

    await Promise.all(
      PAGES.map(async (page) => {
        try {
          const start = performance.now();
          let res = await fetch(page.path, { method: 'HEAD', redirect: 'follow', cache: 'no-store' });
          if (!res.ok && res.status !== 404) {
            res = await fetch(page.path, { method: 'GET', redirect: 'follow', cache: 'no-store' });
          }
          const elapsed = Math.round(performance.now() - start);
          setStatuses((prev) => ({
            ...prev,
            [page.path]: {
              status: res.ok ? 'ok' : 'error',
              httpStatus: res.status,
              time: elapsed,
            },
          }));
        } catch {
          setStatuses((prev) => ({
            ...prev,
            [page.path]: {
              status: 'error',
              httpStatus: null,
              time: null,
            },
          }));
        }
      })
    );

    setIsChecking(false);
  };

  useEffect(() => {
    checkPages();
  }, []);

  const totalCount = PAGES.length;
  const onlineCount = Object.values(statuses).filter((s) => s?.status === 'ok').length;
  const offlineCount = Object.values(statuses).filter((s) => s?.status === 'error').length;

  return (
    <div style={{ padding: isMobile ? '12px' : '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <PageHeader
        title="Seiten"
        subtitle="Alle oeffentlichen Seiten von be-hui.com"
      />

      {/* Summary Cards Header */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '20px',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
          <div style={{ ...card, marginBottom: 0, padding: '12px 20px', minWidth: '130px', flex: '1 1 auto' }}>
            <div style={{ fontSize: '12px', color: C.sub }}>Gesamt</div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: C.text, marginTop: '2px' }}>
              {totalCount} Seiten
            </div>
          </div>

          <div style={{ ...card, marginBottom: 0, padding: '12px 20px', minWidth: '130px', flex: '1 1 auto' }}>
            <div style={{ fontSize: '12px', color: C.sub }}>Online</div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: C.green, marginTop: '2px' }}>
              {onlineCount}
            </div>
          </div>

          <div style={{ ...card, marginBottom: 0, padding: '12px 20px', minWidth: '130px', flex: '1 1 auto' }}>
            <div style={{ fontSize: '12px', color: C.sub }}>Offline</div>
            <div
              style={{
                fontSize: '20px',
                fontWeight: '700',
                color: offlineCount > 0 ? C.red : C.sub,
                marginTop: '2px',
              }}
            >
              {offlineCount}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {mainPageCheck.time && (
            <span style={{ fontSize: '12px', color: C.sub }}>
              Hauptseite Hook: <StatusDot status={mainPageCheck.status} /> {mainPageCheck.time}ms
            </span>
          )}
          <button
            onClick={checkPages}
            disabled={isChecking}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '12px',
              border: `1px solid ${C.border}`,
              background: isChecking ? C.card2 : C.teal,
              color: isChecking ? C.sub : '#fff',
              fontSize: '13px',
              fontWeight: '600',
              cursor: isChecking ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {isChecking ? 'Prüfung läuft...' : '🔄 Status aktualisieren'}
          </button>
        </div>
      </div>

      {/* Main Content: Table on desktop, Cards on mobile */}
      {isMobile ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {PAGES.map((page) => {
            const res = statuses[page.path];
            const statusType = res ? res.status : 'loading';

            return (
              <div key={page.path} style={{ ...card, marginBottom: 0, padding: '16px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '8px',
                  }}
                >
                  <div style={{ fontWeight: '600', fontSize: '15px', color: C.text }}>
                    {page.name}
                  </div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <StatusDot status={statusType} />
                    {statusType === 'ok' && <StatusBadge status="ok" label="Online" />}
                    {statusType === 'error' && <StatusBadge status="error" label="Offline" />}
                    {statusType === 'loading' && <StatusBadge status="unknown" label="Lädt..." />}
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <a
                    href={page.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: C.teal,
                      fontSize: '13px',
                      fontFamily: 'monospace',
                      textDecoration: 'none',
                      wordBreak: 'break-all',
                    }}
                  >
                    {page.url}
                  </a>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '10px',
                    paddingTop: '12px',
                    borderTop: `1px solid ${C.border}`,
                    fontSize: '12px',
                  }}
                >
                  <div>
                    <span style={{ color: C.sub }}>Indexierbar: </span>
                    <span
                      style={{
                        color: C.green,
                        fontWeight: '600',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <StatusDot status="ok" /> Ja
                    </span>
                  </div>

                  <div>
                    <span style={{ color: C.sub }}>SEO: </span>
                    <span style={{ color: C.sub, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <StatusDot status="unknown" /> Unbekannt
                    </span>
                  </div>

                  <div>
                    <span style={{ color: C.sub }}>Letzte Änderung: </span>
                    <span style={{ color: C.muted }}>—</span>
                  </div>

                  {res?.time && (
                    <div>
                      <span style={{ color: C.sub }}>Ladezeit: </span>
                      <span style={{ color: C.text }}>{res.time} ms</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
          {/* Table Header */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 2fr 1.2fr 1fr 1fr 1.2fr 80px',
              padding: '14px 20px',
              background: C.card2,
              borderBottom: `1px solid ${C.border}`,
              fontSize: '12px',
              fontWeight: '600',
              color: C.sub,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            <div>Seitenname</div>
            <div>URL</div>
            <div>Status</div>
            <div>Indexierbar</div>
            <div>SEO</div>
            <div>Letzte Änderung</div>
            <div style={{ textAlign: 'right' }}>Aktion</div>
          </div>

          {/* Table Body */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {PAGES.map((page, index) => {
              const res = statuses[page.path];
              const statusType = res ? res.status : 'loading';

              return (
                <div
                  key={page.path}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 2fr 1.2fr 1fr 1fr 1.2fr 80px',
                    padding: '14px 20px',
                    alignItems: 'center',
                    borderBottom: index < PAGES.length - 1 ? `1px solid ${C.border}` : 'none',
                    fontSize: '13px',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = C.card2 + '80')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ fontWeight: '600', color: C.text }}>{page.name}</div>

                  <div>
                    <a
                      href={page.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: C.teal,
                        fontFamily: 'monospace',
                        textDecoration: 'none',
                      }}
                    >
                      {page.url}
                    </a>
                  </div>

                  <div>
                    {statusType === 'ok' && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <StatusBadge status="ok" label="Online" />
                        {res?.time && <span style={{ fontSize: '11px', color: C.muted }}>{res.time}ms</span>}
                      </div>
                    )}
                    {statusType === 'error' && <StatusBadge status="error" label="Offline" />}
                    {statusType === 'loading' && <StatusBadge status="unknown" label="Lädt..." />}
                  </div>

                  <div>
                    <span style={{ color: C.green, fontWeight: '500', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <StatusDot status="ok" /> Ja
                    </span>
                  </div>

                  <div>
                    <span style={{ color: C.sub, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <StatusDot status="unknown" /> Unbekannt
                    </span>
                  </div>

                  <div style={{ color: C.muted }}>—</div>

                  <div style={{ textAlign: 'right' }}>
                    <a
                      href={page.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        background: C.card2,
                        color: C.teal,
                        fontSize: '12px',
                        border: `1px solid ${C.border}`,
                        textDecoration: 'none',
                      }}
                    >
                      Öffnen ↗
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
