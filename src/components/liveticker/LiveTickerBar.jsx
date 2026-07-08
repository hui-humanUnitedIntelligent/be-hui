/**
 * LiveTickerBar — Einheitliche Liveticker-UI für Home, Discover und Impact
 *
 * Varianten:
 *   marquee  — Home (horizontaler Ticker)
 *   cards    — Discover (horizontale Karten)
 *   compact  — Impact (vertikale Liste)
 */
import React, { useState, useEffect } from 'react';
import { useLiveTicker } from '../../hooks/useLiveTicker';

const T = {
  teal:     '#0EC4B8',
  ink:      '#1A3530',
  inkFaint: 'rgba(26,53,48,0.38)',
  inkSoft:  'rgba(26,53,48,0.72)',
  bg:       'rgba(250,250,248,0.92)',
  border:   'rgba(14,196,184,0.10)',
  line:     'rgba(26,53,48,0.08)',
  surface:  '#FDFAF5',
};

const MARQUEE_CSS = `
  @keyframes ltb-slide {
    from { transform: translateX(0) }
    to   { transform: translateX(-50%) }
  }
  @keyframes ltb-pulse {
    0%,100% { opacity:1; transform:scale(1) }
    50%     { opacity:.45; transform:scale(.78) }
  }
  .ltb-ticker { animation: ltb-slide 40s linear infinite; will-change:transform; }
  .ltb-dot    { animation: ltb-pulse 2.8s ease-in-out infinite; }
  .ltb-ticker:hover { animation-play-state:paused; }
  @keyframes ltb-fade {
    from { opacity:0; transform:translateY(4px) }
    to   { opacity:1; transform:translateY(0) }
  }
`;

function LiveBadge({ size = 'sm' }) {
  const dot = size === 'sm' ? 6 : 7;
  const font = size === 'sm' ? 9 : 10;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
      <div className="ltb-dot" style={{
        width: dot, height: dot, borderRadius: '50%',
        background: T.teal,
        boxShadow: '0 0 0 2px rgba(14,196,184,0.20)',
      }} />
      <span style={{
        fontSize: font, fontWeight: 800, color: T.teal,
        letterSpacing: '.06em', textTransform: 'uppercase',
      }}>Live</span>
    </div>
  );
}

function TickerCard({ event, idx, onPress }) {
  const [imgErr, setImgErr] = useState(false);
  const av = (!imgErr && event.avatar) ? event.avatar : null;
  return (
    <div
      className="dp-activity-card dp-press"
      onClick={() => onPress?.(event)}
      style={{
        width: 168, flexShrink: 0,
        background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(12px)',
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.70)',
        boxShadow: '0 2px 12px rgba(26,53,48,0.07)',
        padding: '11px 11px 10px',
        animationDelay: `${idx * 60}ms`,
        touchAction: 'manipulation',
        cursor: onPress ? 'pointer' : 'default',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
          background: av ? 'transparent' : 'rgba(14,196,184,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1.5px solid rgba(14,196,184,0.20)',
        }}>
          {av
            ? <img src={av} alt="" onError={() => setImgErr(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: 12 }}>{event.emoji || '✦'}</span>
          }
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {event.name && (
            <div style={{
              fontSize: 11, fontWeight: 700, color: T.ink,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{event.name}</div>
          )}
          <div style={{ fontSize: 9.5, color: 'rgba(26,53,48,0.40)', fontWeight: 500 }}>{event.ago}</div>
        </div>
      </div>
      <div style={{
        fontSize: 11, color: T.inkSoft, lineHeight: 1.4, fontWeight: 400,
        overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
      }}>{event.text}</div>
    </div>
  );
}

function MarqueeVariant({ events }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 320);
    return () => clearTimeout(t);
  }, []);

  if (!events.length) return null;
  const items = [...events, ...events];

  return (
    <div style={{
      width: '100%', overflow: 'hidden',
      opacity: visible ? 1 : 0,
      transition: 'opacity .6s ease',
    }}>
      <style>{MARQUEE_CSS}</style>
      <div style={{
        background: T.bg,
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderBottom: `1px solid ${T.border}`,
        padding: '6px 0',
        display: 'flex', alignItems: 'center', overflow: 'hidden',
      }}>
        <div style={{
          flexShrink: 0, padding: '0 12px',
          borderRight: '1px solid rgba(14,196,184,0.14)',
          marginRight: 10,
        }}>
          <LiveBadge />
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div className="ltb-ticker" style={{ display: 'inline-flex', gap: 28, whiteSpace: 'nowrap' }}>
            {items.map((ev, i) => (
              <div key={`${ev.id}-${i}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12 }}>{ev.emoji}</span>
                <span style={{ fontSize: 11, color: T.inkFaint, fontWeight: 500, letterSpacing: '-0.01em' }}>
                  {ev.text}
                </span>
                <span style={{ width: 2, height: 2, borderRadius: '50%', background: 'rgba(26,53,48,0.15)', flexShrink: 0 }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CardsVariant({ events, onEventPress, title = 'Jetzt auf HUI' }) {
  if (!events.length) return null;
  return (
    <div style={{ padding: '4px 16px 14px', marginBottom: 0 }}>
      <style>{MARQUEE_CSS}</style>
      <div style={{
        background: 'linear-gradient(135deg,rgba(14,196,184,0.05) 0%,rgba(232,87,58,0.03) 100%)',
        border: '1px solid rgba(14,196,184,0.12)',
        borderRadius: 20, padding: '14px 0 14px 14px', overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, paddingRight: 14 }}>
          <LiveBadge size="md" />
          <span style={{ fontSize: 14, fontWeight: 800, color: T.ink, letterSpacing: '-0.03em' }}>{title}</span>
        </div>
        <div className="dp-hscroll" style={{ display: 'flex', gap: 8, paddingRight: 14 }}>
          {events.slice(0, 8).map((ev, i) => (
            <TickerCard key={ev.id} event={ev} idx={i} onPress={onEventPress} />
          ))}
        </div>
      </div>
    </div>
  );
}

function CompactVariant({ events, title = 'Live auf HUI' }) {
  if (!events.length) return null;
  return (
    <div style={{ padding: '16px 16px 0' }}>
      <style>{MARQUEE_CSS}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <LiveBadge size="md" />
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: T.ink, letterSpacing: '-0.01em' }}>
          {title}
        </h3>
      </div>
      <div style={{
        background: T.surface, borderRadius: 20,
        boxShadow: '0 2px 16px rgba(26,53,48,0.06)',
        border: `1px solid ${T.line}`, overflow: 'hidden',
      }}>
        {events.slice(0, 5).map((ev, i) => (
          <div key={ev.id} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '11px 16px',
            borderBottom: i < Math.min(events.length, 5) - 1 ? `1px solid ${T.line}` : 'none',
            animation: 'ltb-fade 0.28s ease both',
            animationDelay: `${i * 0.04}s`,
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              overflow: 'hidden', background: 'rgba(14,196,184,0.08)',
              border: '1px solid rgba(14,196,184,0.20)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
            }}>
              {ev.avatar
                ? <img src={ev.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : (ev.emoji || '✦')
              }
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 12, color: T.ink, lineHeight: 1.4,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{ev.text}</div>
            </div>
            <div style={{ fontSize: 10, color: 'rgba(26,53,48,0.40)', flexShrink: 0 }}>{ev.ago}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HeroStripVariant({ events }) {
  const latest = events[0];
  if (!latest) return null;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '10px 22px',
      background: 'rgba(13,196,181,0.08)',
      borderTop: '1px solid rgba(13,196,181,0.12)',
    }}>
      <LiveBadge size="sm" />
      <span style={{ fontSize: 12, color: 'rgba(26,53,48,0.72)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {latest.text}
      </span>
    </div>
  );
}

/**
 * @param {'marquee'|'cards'|'compact'|'hero-strip'} variant
 * @param {(event: object) => void} [onEventPress]
 */
export default function LiveTickerBar({ variant = 'marquee', onEventPress, title, filters, enabled = true }) {
  const { events, loading, isEmpty } = useLiveTicker({ filters, enabled });

  if (loading || isEmpty) return null;

  switch (variant) {
    case 'cards':
      return <CardsVariant events={events} onEventPress={onEventPress} title={title} />;
    case 'compact':
      return <CompactVariant events={events} title={title} />;
    case 'hero-strip':
      return <HeroStripVariant events={events} />;
    case 'marquee':
    default:
      return <MarqueeVariant events={events} />;
  }
}

export { useLiveTicker };
