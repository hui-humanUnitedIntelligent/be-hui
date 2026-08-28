// ══════════════════════════════════════════════════════════════════════════════
// LandingPage.jsx — HUI Public Landing Page
// ══════════════════════════════════════════════════════════════════════════════
//
// ZWECK:
//   Öffentliche Landingpage für nicht-authentifizierte Besucher.
//   Erzählt die HUI Vision: Menschen, Ideen, Möglichkeiten → Wirkung.
//
// ROUTING:
//   /app/  → LandingPage (wenn nicht authentifiziert)
//   /app/login → LoginPage (bestehend)
//   CTAs führen zu /app/login → nach Login → AuthenticatedApp
//
// DESIGN:
//   HUI Design System (src/design/hui.design.js)
//   Inter Font, warme Cremetöne, Teal + Coral
//   Ruhig, menschlich, hochwertig
//
// I18N (2026-08-28): Alle sichtbaren Texte laufen jetzt über useTranslation().
// t() wird NIE auf Modul-Ebene aufgerufen, sondern nur innerhalb der jeweiligen
// Komponentenfunktion (nach useTranslation()-Aufruf).
// ══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from '../../hooks/useTranslation.js';


// ── HUI Design Tokens ─────────────────────────────────────────────────────────
const T = {
  teal:       '#0DC4B5',
  tealLight:  '#22DDD0',
  tealDeep:   '#09A89A',
  tealPale:   '#E6FAF8',
  coral:      '#F47355',
  coralLight: '#F99478',
  coralPale:  '#FFF0EB',
  cream:      '#FAF7F2',
  creamWarm:  '#F5EEE3',
  creamDeep:  '#EDE5D8',
  creamSoft:  '#FDFBF8',
  ink:        '#141422',
  inkMid:     '#2E2E45',
  ink2:       '#3A3A55',
  muted:      '#8A8A9E',
  faint:      '#C0C0D0',
  gold:       '#D4952A',
  violet:     '#7264D6',
  sage:       '#6BAE8F',
  white:      '#FFFFFF',
};

// ── Scroll Animation Hook ────────────────────────────────────────────────────
function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.lp-animate:not(.lp-visible)');
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('lp-visible');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

// ── Navigation ───────────────────────────────────────────────────────────────
function LandingNav() {
  const { t } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: t('nav.discover'), href: '#entdecken' },
    { label: t('landing.nav.wieWirkt'), href: '#prozess' },
    { label: t('landing.nav.projekte'), href: '#welt' },
    { label: t('landing.nav.mitmachen'), href: '#wege' },
    { label: t('landing.nav.ueberHui'), href: '#ueber' },
  ];

  return (
    <nav className={`lp-nav ${scrolled ? 'lp-nav--scrolled' : ''}`}>
      <div className="lp-nav__inner">
        <a href="/" className="lp-nav__logo">
          <img src="/assets/brand/hui-logo.png" alt="HUI" />
        </a>

        <div className="lp-nav__links">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} className="lp-nav__link">{l.label}</a>
          ))}
        </div>

        <div className="lp-nav__actions">
          <a href="/app/login" className="lp-nav__login">{t('landing.nav.login')}</a>
          <a href="/app/login" className="lp-nav__cta">{t('landing.cta.discoverHui')}</a>
        </div>

        <button
          className={`lp-nav__burger ${mobileOpen ? 'lp-nav__burger--open' : ''}`}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={t('landing.nav.menuAria')}
        >
          <span /><span /><span />
        </button>
      </div>

      {mobileOpen && (
        <div className="lp-nav__mobile">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setMobileOpen(false)}
              className="lp-nav__mobile-link"
            >{l.label}</a>
          ))}
          <a href="/app/login" className="lp-nav__mobile-cta" onClick={() => setMobileOpen(false)}>
            {t('landing.cta.discoverHui')}
          </a>
        </div>
      )}
    </nav>
  );
}

// ── Hero Section ──────────────────────────────────────────────────────────────
function HeroSection() {
  const { t } = useTranslation();
  return (
    <section className="lp-hero">
      <div className="lp-hero__bg" />
      <div className="lp-hero__content">
        <p className="lp-hero__kicker lp-animate">{t('landing.hero.kicker')}</p>
        <h1 className="lp-hero__title lp-animate" style={{ transitionDelay: '0.1s' }}>
          {t('landing.hero.titleLine1')}<br />
          {t('landing.hero.titleLine2')}<br />
          {t('landing.hero.titleLine3')}
        </h1>
        <p className="lp-hero__sub lp-animate" style={{ transitionDelay: '0.2s' }}>
          {t('landing.hero.sub')}
        </p>
        <p className="lp-hero__desc lp-animate" style={{ transitionDelay: '0.3s' }}>
          {t('landing.hero.descLine1')}<br className="lp-br" />
          {t('landing.hero.descLine2')}
        </p>
        <div className="lp-hero__cta-row lp-animate" style={{ transitionDelay: '0.4s' }}>
          <a href="/app/login" className="lp-btn lp-btn--primary">{t('landing.cta.discoverHui')}</a>
          <a href="#prozess" className="lp-btn lp-btn--ghost">{t('landing.hero.howItWorks')}</a>
        </div>
      </div>
      <div className="lp-hero__scroll lp-animate" style={{ transitionDelay: '0.6s' }}>
        <span />
      </div>
    </section>
  );
}

// ── Vision Section: "Was wäre, wenn…?" ──────────────────────────────────────
function VisionSection() {
  const { t } = useTranslation();
  const items = [
    t('landing.vision.item1'),
    t('landing.vision.item2'),
    t('landing.vision.item3'),
    t('landing.vision.item4'),
  ];

  return (
    <section className="lp-vision" id="ueber">
      <div className="lp-section__inner">
        <p className="lp-section__kicker lp-animate">{t('landing.vision.kicker')}</p>
        <h2 className="lp-vision__title lp-animate" style={{ transitionDelay: '0.1s' }}>
          {t('landing.vision.title')}
        </h2>
        <div className="lp-vision__list">
          {items.map((item, i) => (
            <p
              key={i}
              className="lp-vision__item lp-animate"
              style={{ transitionDelay: `${0.15 + i * 0.1}s` }}
            >
              {item}
            </p>
          ))}
        </div>
        <p className="lp-vision__answer lp-animate" style={{ transitionDelay: '0.6s' }}>
          {t('landing.vision.answer')}
        </p>
      </div>
    </section>
  );
}

// ── Process Section: "So wirkt HUI" ──────────────────────────────────────────
function ProcessSection() {
  const { t } = useTranslation();
  const steps = [
    { num: '01', title: t('landing.process.step1Title'), text: t('landing.process.step1Text') },
    { num: '02', title: t('landing.nav.mitmachen'), text: t('landing.process.step2Text') },
    { num: '03', title: t('landing.process.step3Title'), text: t('landing.process.step3Text') },
    { num: '04', title: t('landing.process.step4Title'), text: t('landing.process.step4Text') },
    { num: '05', title: t('landing.process.step5Title'), text: t('landing.process.step5Text') },
  ];

  return (
    <section className="lp-process" id="prozess">
      <div className="lp-section__inner">
        <p className="lp-section__kicker lp-animate">{t('landing.process.kicker')}</p>
        <h2 className="lp-section__title lp-animate" style={{ transitionDelay: '0.1s' }}>
          {t('landing.process.title')}
        </h2>
        <div className="lp-process__flow">
          {steps.map((s, i) => (
            <div
              key={s.num}
              className="lp-process__step lp-animate"
              style={{ transitionDelay: `${0.15 + i * 0.1}s` }}
            >
              <div className="lp-process__num">{s.num}</div>
              <h3 className="lp-process__step-title">{s.title}</h3>
              <p className="lp-process__step-text">{s.text}</p>
              {i < steps.length - 1 && <div className="lp-process__connector" />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Ecosystem Section: "Die Welt von HUI" ─────────────────────────────────────
function EcosystemSection() {
  const { t } = useTranslation();
  const areas = [
    { icon: '◆', title: t('landing.eco.projekteTitle'), text: t('landing.eco.projekteText') },
    { icon: '●', title: t('landing.eco.werkeTitle'), text: t('landing.eco.werkeText') },
    { icon: '▲', title: t('landing.eco.erlebnisseTitle'), text: t('landing.eco.erlebnisseText') },
    { icon: '★', title: t('landing.eco.wirkerTitle'), text: t('landing.eco.wirkerText') },
    { icon: '■', title: t('landing.eco.unternehmenTitle'), text: t('landing.eco.unternehmenText') },
  ];

  return (
    <section className="lp-ecosystem" id="welt">
      <div className="lp-section__inner">
        <p className="lp-section__kicker lp-animate">{t('landing.eco.kicker')}</p>
        <h2 className="lp-section__title lp-animate" style={{ transitionDelay: '0.1s' }}>
          {t('landing.eco.title')}
        </h2>
        <div className="lp-ecosystem__grid">
          {areas.map((a, i) => (
            <div
              key={a.title}
              className="lp-ecosystem__item lp-animate"
              style={{ transitionDelay: `${0.1 + i * 0.08}s` }}
            >
              <div className="lp-ecosystem__icon">{a.icon}</div>
              <h3 className="lp-ecosystem__name">{a.title}</h3>
              <p className="lp-ecosystem__text">{a.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Honest Section: "Wir fangen gerade erst an" ───────────────────────────────
function HonestSection() {
  const { t } = useTranslation();
  return (
    <section className="lp-honest" id="entdecken">
      <div className="lp-section__inner">
        <div className="lp-honest__content lp-animate">
          <p className="lp-section__kicker lp-honest__kicker">{t('landing.honest.kicker')}</p>
          <h2 className="lp-honest__title">
            {t('landing.honest.title')}
          </h2>
          <div className="lp-honest__text">
            <p>{t('landing.honest.line1')}</p>
            <p>{t('landing.honest.line2')}</p>
            <p>{t('landing.honest.line3')}</p>
            <p>{t('landing.honest.line4')}</p>
          </div>
          <p className="lp-honest__call">
            {t('landing.honest.call')}
          </p>
          <p className="lp-honest__invite">
            {t('landing.honest.inviteLine1')}<br />
            {t('landing.honest.inviteLine2')}
          </p>
        </div>
      </div>
    </section>
  );
}

// ── Impact Section ───────────────────────────────────────────────────────────
function ImpactSection() {
  const { t } = useTranslation();
  const activities = [
    t('landing.impact.act1'),
    t('landing.impact.act2'),
    t('landing.impact.act3'),
    t('landing.impact.act4'),
    t('landing.impact.act5'),
  ];

  return (
    <section className="lp-impact">
      <div className="lp-section__inner">
        <div className="lp-impact__content">
          <p className="lp-section__kicker lp-animate">{t('landing.impact.kicker')}</p>
          <h2 className="lp-impact__title lp-animate" style={{ transitionDelay: '0.1s' }}>
            {t('landing.impact.titleLine1')}<br />{t('landing.impact.titleLine2')}
          </h2>
          <div className="lp-impact__activities lp-animate" style={{ transitionDelay: '0.2s' }}>
            {activities.map((a, i) => (
              <span key={i} className="lp-impact__activity">{a}</span>
            ))}
          </div>
          <p className="lp-impact__text lp-animate" style={{ transitionDelay: '0.3s' }}>
            {t('landing.impact.textLine1')}<br className="lp-br" />
            {t('landing.impact.textLine2')}
          </p>
        </div>
      </div>
    </section>
  );
}

// ── Paths Section: "Welche Geschichte möchtest du mitgestalten?" ─────────────
function PathsSection() {
  const { t } = useTranslation();
  const paths = [
    {
      title: t('landing.paths.p1Title'),
      text: t('landing.paths.p1Text'),
      cta: t('landing.paths.p1Cta'),
      href: '/login',
    },
    {
      title: t('landing.paths.p2Title'),
      text: t('landing.paths.p2Text'),
      cta: t('landing.paths.p2Cta'),
      href: '/login',
    },
    {
      title: t('landing.paths.p3Title'),
      text: t('landing.paths.p3Text'),
      cta: t('landing.paths.p3Cta'),
      href: '/login',
    },
    {
      title: t('landing.paths.p4Title'),
      text: t('landing.paths.p4Text'),
      cta: t('landing.paths.p4Cta'),
      href: '/login',
    },
  ];

  return (
    <section className="lp-paths" id="wege">
      <div className="lp-section__inner">
        <p className="lp-section__kicker lp-animate">{t('landing.paths.kicker')}</p>
        <h2 className="lp-section__title lp-animate" style={{ transitionDelay: '0.1s' }}>
          {t('landing.paths.title')}
        </h2>
        <div className="lp-paths__grid">
          {paths.map((p, i) => (
            <div
              key={i}
              className="lp-paths__card lp-animate"
              style={{ transitionDelay: `${0.1 + i * 0.08}s` }}
            >
              <h3 className="lp-paths__card-title">{p.title}</h3>
              <p className="lp-paths__card-text">{p.text}</p>
              <a href="/app/login" className="lp-paths__card-cta">{p.cta}</a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── App Section ──────────────────────────────────────────────────────────────
function AppSection() {
  const { t } = useTranslation();
  const features = [
    { title: t('nav.discover'), text: t('landing.app.f1Text') },
    { title: t('nav.myHui'), text: t('landing.app.f2Text') },
    { title: t('nav.impact'), text: t('landing.app.f3Text') },
    { title: t('nav.profile'), text: t('landing.app.f4Text') },
  ];

  return (
    <section className="lp-app">
      <div className="lp-section__inner">
        <p className="lp-section__kicker lp-animate">{t('landing.app.kicker')}</p>
        <h2 className="lp-section__title lp-animate" style={{ transitionDelay: '0.1s' }}>
          {t('landing.app.title')}
        </h2>
        <p className="lp-app__sub lp-animate" style={{ transitionDelay: '0.2s' }}>
          {t('landing.app.sub')}
        </p>

        <div className="lp-app__features">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="lp-app__feature lp-animate"
              style={{ transitionDelay: `${0.2 + i * 0.08}s` }}
            >
              <h3 className="lp-app__feature-title">{f.title}</h3>
              <p className="lp-app__feature-text">{f.text}</p>
            </div>
          ))}
        </div>

        <div className="lp-app__cta-row lp-animate" style={{ transitionDelay: '0.6s' }}>
          <a href="/app/login" className="lp-btn lp-btn--primary">{t('landing.cta.discoverHui')}</a>
        </div>
      </div>
    </section>
  );
}

// ── Final CTA ────────────────────────────────────────────────────────────────
function FinalCTA() {
  const { t } = useTranslation();
  return (
    <section className="lp-final">
      <div className="lp-section__inner">
        <div className="lp-final__content lp-animate">
          <h2 className="lp-final__title">
            {t('landing.finalCta.titleLine1')}<br />
            {t('landing.finalCta.titleLine2')}<br />
            {t('landing.finalCta.titleLine3')}
          </h2>
          <p className="lp-final__sub">
            {t('landing.finalCta.subLine1')}<br />
            {t('landing.finalCta.subLine2')}
          </p>
          <div className="lp-final__cta-row">
            <a href="/app/login" className="lp-btn lp-btn--primary">{t('landing.finalCta.ctaDiscover')}</a>
            <a href="/app/login" className="lp-btn lp-btn--ghost">{t('landing.finalCta.ctaJoin')}</a>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Footer ───────────────────────────────────────────────────────────────────
function LandingFooter() {
  const { t } = useTranslation();
  const cols = [
    {
      title: 'HUI',
      links: [
        { label: t('landing.nav.ueberHui'), href: '#ueber' },
        { label: t('landing.nav.wieWirkt'), href: '#prozess' },
      ],
    },
    {
      title: t('nav.discover'),
      links: [
        { label: t('landing.nav.projekte'), href: '#welt' },
        { label: t('landing.footer.werke'), href: '#welt' },
        { label: t('landing.footer.erlebnisse'), href: '#welt' },
        { label: t('landing.footer.wirker'), href: '#welt' },
      ],
    },
    {
      title: t('landing.nav.mitmachen'),
      links: [
        { label: t('landing.footer.wirkerWerden'), href: '/login' },
        { label: t('landing.footer.projektStarten'), href: '/login' },
        { label: t('landing.footer.partnerWerden'), href: '/login' },
      ],
    },
    {
      title: t('landing.footer.legalTitle'),
      links: [
        { label: t('landing.footer.impressum'), href: '#impressum' },
        { label: t('landing.footer.datenschutz'), href: '#datenschutz' },
      ],
    },
  ];

  return (
    <footer className="lp-footer" id="wege-footer">
      <div className="lp-footer__inner">
        <div className="lp-footer__brand">
          <img src="/assets/brand/hui-logo.png" alt="HUI" className="lp-footer__logo" />
          <p className="lp-footer__tagline">
            {t('landing.footer.taglineLine1')}<br />{t('landing.footer.taglineLine2')}
          </p>
        </div>
        <div className="lp-footer__cols">
          {cols.map((col) => (
            <div key={col.title} className="lp-footer__col">
              <h4 className="lp-footer__col-title">{col.title}</h4>
              {col.links.map((l) => (
                l.href.startsWith('#')
                  ? <a key={l.label} href={l.href} className="lp-footer__link">{l.label}</a>
                  : <a key={l.label} href="/app/login" className="lp-footer__link">{l.label}</a>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="lp-footer__bottom">
        <p>{t('landing.footer.copyright', { year: new Date().getFullYear() })}</p>
      </div>
    </footer>
  );
}

// ── LandingPage (Main) ───────────────────────────────────────────────────────
export default function LandingPage() {
  useScrollReveal();

  return (
    <div className="hui-landing">
      <LandingNav />
      <HeroSection />
      <VisionSection />
      <ProcessSection />
      <EcosystemSection />
      <HonestSection />
      <ImpactSection />
      <PathsSection />
      <AppSection />
      <FinalCTA />
      <LandingFooter />
    </div>
  );
}
