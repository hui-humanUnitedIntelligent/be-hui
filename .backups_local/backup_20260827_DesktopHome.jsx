// ══════════════════════════════════════════════════════════════════════════════
// DesktopHome.jsx — HUI Desktop V3.1 — Lebendiger Einstieg
// ══════════════════════════════════════════════════════════════════════════════
//
// V3.1-PHILOSOPHIE:
//   Kein Statusbericht. Kein Dashboard. Ein lebendiger Raum.
//   Begrüßung → Hero (groß, emotional, echtes Bild) → Strom (Feed)
//
// HERO rotiert durch (alle aus useDesktopData — keine neuen Queries):
//   1. Werk des Tages (cover_url, title, creator)
//   2. Talent des Tages (avatar, bio, talent)
//   3. Neue Resonanz (activity.items)
//   4. Impact-Moment (impact.fmtTotal)
//
// FEED: UnifiedFeed (unverändert) — CSS in desktopV3.css überschreibt
//   die Mobile-Kartengrößen für Desktop (breiter, mehr Abstand, Hover).
// ══════════════════════════════════════════════════════════════════════════════

import React, { Suspense, lazy, useState, useEffect, useMemo } from 'react';
import { PerfProfiler, usePerfMount, heroMark } from './perf-instrument.js';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext.jsx';
import { useDesktopData } from './DesktopDataContext.jsx';
import { formatDateDE } from "../../lib/formatters.js";

const UnifiedFeed = lazy(() => import('../../feed/UnifiedFeed.jsx'));

// ── Helpers ────────────────────────────────────────────────────────────────────
function timeGreeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Gute Nacht';
  if (h < 11) return 'Guten Morgen';
  if (h < 17) return 'Guten Tag';
  if (h < 22) return 'Guten Abend';
  return 'Gute Nacht';
}

function formatToday() {
  return formatDateDE(new Date(), { weekday: 'long', day: 'numeric', month: 'long' });
}

// ── Hero Skeleton ──────────────────────────────────────────────────────────────
function HeroSkeleton() {
  return (
    <div className="hero-card hero-skeleton">
      <div className="hero-skeleton-img" />
      <div className="hero-skeleton-text">
        <div className="v3-shimmer" style={{ width: '40%', height: 12 }} />
        <div className="v3-shimmer" style={{ width: '70%', height: 20, marginTop: 12 }} />
        <div className="v3-shimmer" style={{ width: '50%', height: 14, marginTop: 8 }} />
      </div>
    </div>
  );
}

// ── Werk des Tages ──────────────────────────────────────────────────────────────
function WerkHero({ work, navigate }) {
  if (!work) return null;
  return (
    <div className="hero-card" onClick={() => navigate(`/work/${work.id}`)} role="button" tabIndex={0}>
      <div className="hero-img-wrap">
        {work.cover_url ? (
          <img className="hero-img" src={work.cover_url} alt={work.title} loading="lazy" onLoad={() => heroMark("imgLoadEnd")} onError={() => heroMark("imgLoadEnd")} />
        ) : (
          <div className="hero-img hero-img-fallback" />
        )}
        <div className="hero-overlay" />
      </div>
      <div className="hero-body">
        <span className="hero-tag">Werk des Tages</span>
        <h2 className="hero-title">{work.title || 'Ein neues Werk'}</h2>
        {work.category && <span className="hero-meta">{work.category}</span>}
        <div className="hero-action">
          <button className="hero-btn">Entdecken →</button>
        </div>
      </div>
    </div>
  );
}

// ── Talent des Tages ────────────────────────────────────────────────────────────
function TalentHero({ talent, navigate }) {
  if (!talent) return null;
  const name = talent.display_name || talent.username || 'Ein Wirker';
  return (
    <div className="hero-card hero-card-talent" onClick={() => navigate(`/profile/${talent.username || talent.id}`)} role="button" tabIndex={0}>
      <div className="hero-talent-visual">
        {talent.avatar_url ? (
          <img className="hero-talent-avatar" src={talent.avatar_url} alt={name} loading="lazy" />
        ) : (
          <div className="hero-talent-avatar hero-talent-avatar-fallback">{name.charAt(0).toUpperCase()}</div>
        )}
      </div>
      <div className="hero-body">
        <span className="hero-tag">Talent des Tages</span>
        <h2 className="hero-title">{name}</h2>
        {talent.talent && <span className="hero-meta">{talent.talent}</span>}
        {talent.bio && <p className="hero-desc">{talent.bio.slice(0, 120)}{talent.bio.length > 120 ? '…' : ''}</p>}
        {talent.location_label && <span className="hero-location">{talent.location_label}</span>}
        <div className="hero-action">
          <button className="hero-btn">Jetzt entdecken →</button>
        </div>
      </div>
    </div>
  );
}

// ── Resonanz Moment ──────────────────────────────────────────────────────────────
function ResonanzHero({ activity, navigate }) {
  const item = (activity.items || [])[0];
  if (!item) return null;
  const ref = item.openRef;
  return (
    <div className="hero-card hero-card-resonanz" onClick={() => {
      if (ref?.type === 'work') navigate(`/work/${ref.id}`);
      else if (ref?.type === 'experience') navigate('/discover');
      else if (ref?.type === 'project') navigate('/impact');
    }}>
      <div className="hero-resonanz-visual">
        <div className="hero-resonanz-orb" />
      </div>
      <div className="hero-body">
        <span className="hero-tag">Lebendig gerade jetzt</span>
        <h2 className="hero-title">{item.text || 'Auf HUI passiert gerade etwas.'}</h2>
        <span className="hero-meta">Vor wenigen Momenten</span>
        <div className="hero-action">
          <button className="hero-btn">Mehr entdecken →</button>
        </div>
      </div>
    </div>
  );
}

// ── Impact Moment ────────────────────────────────────────────────────────────────
function ImpactHero({ impact, navigate }) {
  if (impact.loading || !impact.fmtTotal) return null;
  return (
    <div className="hero-card hero-card-impact" onClick={() => navigate('/impact')} role="button" tabIndex={0}>
      <div className="hero-impact-visual">
        <div className="hero-impact-glow" />
      </div>
      <div className="hero-body">
        <span className="hero-tag">Gemeinsame Wirkung</span>
        <h2 className="hero-title hero-impact-value">{impact.fmtTotal}</h2>
        <p className="hero-desc">Von Menschen für Menschen. Jeder Beitrag zählt.</p>
        <div className="hero-action">
          <button className="hero-btn">Impact ansehen →</button>
        </div>
      </div>
    </div>
  );
}

// ── Hauptkomponente ──────────────────────────────────────────────────────────
export default function DesktopHome() {
  usePerfMount('DesktopHome');
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { discover, activity, impact, bookings } = useDesktopData();
  useEffect(() => { if (discover.works?.length || discover.talents?.length) heroMark('dataLoad'); }, [discover.works, discover.talents]);

  const firstName = (profile?.display_name || profile?.username || '').split(' ')[0] || '';

  // ── Hero rotation: baue Liste verfügbarer Hero-Inhalte ──────────────────────
  const heroes = useMemo(() => {
    const list = [];
    const works = discover.works || [];
    const talents = discover.talents || [];
    const activityItems = activity.items || [];

    if (works[0]) list.push({ type: 'werk', data: works[0] });
    if (talents[0]) list.push({ type: 'talent', data: talents[0] });
    if (activityItems[0]) list.push({ type: 'resonanz', data: activityItems[0] });
    if (!impact.loading && impact.fmtTotal) list.push({ type: 'impact', data: impact });

    // Zweites Werk wenn vorhanden (für Abwechslung)
    if (works[1]) list.push({ type: 'werk', data: works[1] });
    if (talents[1]) list.push({ type: 'talent', data: talents[1] });

    return list;
  }, [discover.works, discover.talents, activity.items, impact.loading, impact.fmtTotal]);

  const [heroIndex, setHeroIndex] = useState(0);
  const [heroVisible, setHeroVisible] = useState(false);

  // Sanfte Entrance-Animation
  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  // Rotation alle 8 Sekunden (nur wenn mehr als 1 Hero)
  useEffect(() => {
    if (heroes.length <= 1) return;
    const t = setInterval(() => {
      heroMark('rotation');
      setHeroVisible(false);
      setTimeout(() => {
        setHeroIndex(i => (i + 1) % heroes.length);
        setHeroVisible(true);
      }, 350);
    }, 8000);
    return () => clearInterval(t);
  }, [heroes.length]);

  function renderHero() {
    heroMark('render');
    if (heroes.length === 0 || discover.loading) return <HeroSkeleton />;
    const hero = heroes[heroIndex % heroes.length];
    if (!hero) return <HeroSkeleton />;
    if (hero.type === 'werk') return <WerkHero work={hero.data} navigate={navigate} />;
    if (hero.type === 'talent') return <TalentHero talent={hero.data} navigate={navigate} />;
    if (hero.type === 'resonanz') return <ResonanzHero activity={{ items: [hero.data] }} navigate={navigate} />;
    if (hero.type === 'impact') return <ImpactHero impact={hero.data} navigate={navigate} />;
    return <HeroSkeleton />;
  }

  return (
    <div className="hui-home">
      {/* ── Begrüßung ────────────────────────────────────────────── */}
      <div className="home-greeting">
        <h1>{timeGreeting()}{firstName ? `, ${firstName}` : ''} <span className="wave">👋</span></h1>
        <p className="home-date">{formatToday()}</p>
      </div>

      {/* ── Hero-Bereich ─────────────────────────────────────────── */}
      <PerfProfiler id="DesktopHero">
      <div className={`hero-wrap ${heroVisible ? 'hero-visible' : ''}`}>
        {renderHero()}
        {heroes.length > 1 && (
          <div className="hero-dots">
            {heroes.map((_, i) => (
              <button
                key={i}
                className={`hero-dot ${i === heroIndex % heroes.length ? 'active' : ''}`}
                onClick={() => { setHeroVisible(false); setTimeout(() => { setHeroIndex(i); setHeroVisible(true); }, 200); }}
                aria-label={`Hero ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
      </PerfProfiler>

      {/* ── Der Strom ────────────────────────────────────────────── */}
      <div className="stream-header">
        <h2>Der Strom</h2>
      </div>
      <div className="hui-feed">
        <Suspense fallback={<div className="feed-loading"><div className="feed-loading-spinner" /></div>}>
          <UnifiedFeed skipWelcome />
        </Suspense>
      </div>
    </div>
  );
}
