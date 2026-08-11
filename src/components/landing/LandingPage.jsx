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
// ══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

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
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: 'Entdecken', href: '#entdecken' },
    { label: 'Wie HUI wirkt', href: '#prozess' },
    { label: 'Projekte', href: '#welt' },
    { label: 'Mitmachen', href: '#wege' },
    { label: 'Über HUI', href: '#ueber' },
  ];

  return (
    <nav className={`lp-nav ${scrolled ? 'lp-nav--scrolled' : ''}`}>
      <div className="lp-nav__inner">
        <Link to="/" className="lp-nav__logo">
          <img src="/assets/brand/hui-logo.png" alt="HUI" />
        </Link>

        <div className="lp-nav__links">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} className="lp-nav__link">{l.label}</a>
          ))}
        </div>

        <div className="lp-nav__actions">
          <Link to="/login" className="lp-nav__login">Login</Link>
          <Link to="/login" className="lp-nav__cta">HUI entdecken →</Link>
        </div>

        <button
          className={`lp-nav__burger ${mobileOpen ? 'lp-nav__burger--open' : ''}`}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menü"
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
          <Link to="/login" className="lp-nav__mobile-cta" onClick={() => setMobileOpen(false)}>
            HUI entdecken →
          </Link>
        </div>
      )}
    </nav>
  );
}

// ── Hero Section ──────────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section className="lp-hero">
      <div className="lp-hero__bg" />
      <div className="lp-hero__content">
        <p className="lp-hero__kicker lp-animate">HUI — Human United Intelligence</p>
        <h1 className="lp-hero__title lp-animate" style={{ transitionDelay: '0.1s' }}>
          Menschen.<br />
          Ideen.<br />
          Möglichkeiten.
        </h1>
        <p className="lp-hero__sub lp-animate" style={{ transitionDelay: '0.2s' }}>
          Gemeinsam entsteht Wirkung.
        </p>
        <p className="lp-hero__desc lp-animate" style={{ transitionDelay: '0.3s' }}>
          HUI verbindet Menschen, Talente, Projekte, Werke und Erlebnisse —<br className="lp-br" />
          und macht aus Begegnungen echte Wirkung.
        </p>
        <div className="lp-hero__cta-row lp-animate" style={{ transitionDelay: '0.4s' }}>
          <Link to="/login" className="lp-btn lp-btn--primary">HUI entdecken →</Link>
          <a href="#prozess" className="lp-btn lp-btn--ghost">So funktioniert es ↓</a>
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
  const items = [
    'jeder Mensch etwas beitragen könnte?',
    'jedes Talent gesehen werden könnte?',
    'gute Ideen die Menschen erreichen könnten, die sie brauchen?',
    'aus Begegnungen etwas Neues entstehen könnte?',
  ];

  return (
    <section className="lp-vision" id="ueber">
      <div className="lp-section__inner">
        <p className="lp-section__kicker lp-animate">Eine Frage</p>
        <h2 className="lp-vision__title lp-animate" style={{ transitionDelay: '0.1s' }}>
          Was wäre, wenn&nbsp;…?
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
          Genau dafür entsteht HUI.
        </p>
      </div>
    </section>
  );
}

// ── Process Section: "So wirkt HUI" ──────────────────────────────────────────
function ProcessSection() {
  const steps = [
    { num: '01', title: 'Menschen finden', text: 'Entdecke Menschen, Talente und Ideen, die dich inspirieren.' },
    { num: '02', title: 'Mitmachen', text: 'Bring dich ein — mit deiner Zeit, deinem Können, deiner Idee oder deiner Unterstützung.' },
    { num: '03', title: 'Wirkung erzeugen', text: 'Aus Aktivitäten entsteht Impact, der dorthin fließen kann, wo er gebraucht wird.' },
    { num: '04', title: 'Gemeinsam wachsen', text: 'Menschen, Projekte und Möglichkeiten verbinden sich.' },
    { num: '05', title: 'Zukunft gestalten', text: 'Kleine Beiträge können gemeinsam etwas Großes verändern.' },
  ];

  return (
    <section className="lp-process" id="prozess">
      <div className="lp-section__inner">
        <p className="lp-section__kicker lp-animate">Der Weg</p>
        <h2 className="lp-section__title lp-animate" style={{ transitionDelay: '0.1s' }}>
          So wirkt HUI
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
  const areas = [
    { icon: '◆', title: 'PROJEKTE', text: 'Ideen, die gerade entstehen.' },
    { icon: '●', title: 'WERKE', text: 'Dinge, die Menschen erschaffen.' },
    { icon: '▲', title: 'ERLEBNISSE', text: 'Momente, die Menschen verbinden.' },
    { icon: '★', title: 'WIRKER', text: 'Menschen mit Talent, Wissen und Leidenschaft.' },
    { icon: '■', title: 'UNTERNEHMEN', text: 'Partner, die Möglichkeiten schaffen möchten.' },
  ];

  return (
    <section className="lp-ecosystem" id="welt">
      <div className="lp-section__inner">
        <p className="lp-section__kicker lp-animate">Das Ökosystem</p>
        <h2 className="lp-section__title lp-animate" style={{ transitionDelay: '0.1s' }}>
          Die Welt von HUI
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
  return (
    <section className="lp-honest" id="entdecken">
      <div className="lp-section__inner">
        <div className="lp-honest__content lp-animate">
          <p className="lp-section__kicker lp-honest__kicker">Ehrlich</p>
          <h2 className="lp-honest__title">
            Wir fangen gerade erst an.
          </h2>
          <div className="lp-honest__text">
            <p>HUI ist noch jung.</p>
            <p>Viele Ideen sind noch nicht umgesetzt.</p>
            <p>Viele Menschen haben wir noch nicht kennennegelernt.</p>
            <p>Viele Geschichten sind noch nicht geschrieben.</p>
          </div>
          <p className="lp-honest__call">
            Und genau deshalb bist du hier.
          </p>
          <p className="lp-honest__invite">
            Hier entstehen die ersten Geschichten.<br />
            Du kannst Teil der ersten Geschichte sein.
          </p>
        </div>
      </div>
    </section>
  );
}

// ── Impact Section ───────────────────────────────────────────────────────────
function ImpactSection() {
  const activities = [
    'Ein Kauf.',
    'Eine Buchung.',
    'Eine Teilnahme.',
    'Eine Empfehlung.',
    'Eine Unterstützung.',
  ];

  return (
    <section className="lp-impact">
      <div className="lp-section__inner">
        <div className="lp-impact__content">
          <p className="lp-section__kicker lp-animate">Wirkung</p>
          <h2 className="lp-impact__title lp-animate" style={{ transitionDelay: '0.1s' }}>
            Deine Aktivität.<br />Echte Wirkung.
          </h2>
          <div className="lp-impact__activities lp-animate" style={{ transitionDelay: '0.2s' }}>
            {activities.map((a, i) => (
              <span key={i} className="lp-impact__activity">{a}</span>
            ))}
          </div>
          <p className="lp-impact__text lp-animate" style={{ transitionDelay: '0.3s' }}>
            Was du innerhalb von HUI tust, kann mehr bewirken<br className="lp-br" />
            als nur in deinem eigenen Leben.
          </p>
        </div>
      </div>
    </section>
  );
}

// ── Paths Section: "Welche Geschichte möchtest du mitgestalten?" ─────────────
function PathsSection() {
  const paths = [
    {
      title: 'Ich habe etwas zu geben',
      text: 'Werde Wirker.',
      cta: 'Wirker werden →',
      href: '/login',
    },
    {
      title: 'Ich habe eine Idee',
      text: 'Starte ein Projekt.',
      cta: 'Projekt starten →',
      href: '/login',
    },
    {
      title: 'Ich möchte etwas erleben',
      text: 'Entdecke Erlebnisse und Menschen.',
      cta: 'Entdecken →',
      href: '/login',
    },
    {
      title: 'Ich möchte ermöglichen',
      text: 'Unterstütze Menschen und Projekte.',
      cta: 'Partner werden →',
      href: '/login',
    },
  ];

  return (
    <section className="lp-paths" id="wege">
      <div className="lp-section__inner">
        <p className="lp-section__kicker lp-animate">Dein Weg</p>
        <h2 className="lp-section__title lp-animate" style={{ transitionDelay: '0.1s' }}>
          Welche Geschichte möchtest du mitgestalten?
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
              <Link to={p.href} className="lp-paths__card-cta">{p.cta}</Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── App Section ──────────────────────────────────────────────────────────────
function AppSection() {
  const features = [
    { title: 'Entdecken', text: 'Finde Menschen, Projekte und Werke, die bewegen.' },
    { title: 'Mein HUI', text: 'Dein Raum — Profil, Werke, Buchungen, Aktivitäten.' },
    { title: 'Impact', text: 'Sieh, wie aus Beiträgen Wirkung entsteht.' },
    { title: 'Profil', text: 'Zeige, was du kannst und was dich ausmacht.' },
  ];

  return (
    <section className="lp-app">
      <div className="lp-section__inner">
        <p className="lp-section__kicker lp-animate">Die Plattform</p>
        <h2 className="lp-section__title lp-animate" style={{ transitionDelay: '0.1s' }}>
          Alles, was Menschen miteinander möglich machen.
        </h2>
        <p className="lp-app__sub lp-animate" style={{ transitionDelay: '0.2s' }}>
          HUI bringt Menschen, Möglichkeiten und Wirkung an einem Ort zusammen.
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
          <Link to="/login" className="lp-btn lp-btn--primary">HUI entdecken →</Link>
        </div>
      </div>
    </section>
  );
}

// ── Final CTA ────────────────────────────────────────────────────────────────
function FinalCTA() {
  return (
    <section className="lp-final">
      <div className="lp-section__inner">
        <div className="lp-final__content lp-animate">
          <h2 className="lp-final__title">
            Was kannst du heute tun,<br />
            um die Welt ein kleines bisschen<br />
            besser zu machen?
          </h2>
          <p className="lp-final__sub">
            HUI beginnt nicht mit einer App.<br />
            HUI beginnt mit dir.
          </p>
          <div className="lp-final__cta-row">
            <Link to="/login" className="lp-btn lp-btn--primary">Jetzt entdecken →</Link>
            <Link to="/login" className="lp-btn lp-btn--ghost">Mitmachen →</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Footer ───────────────────────────────────────────────────────────────────
function LandingFooter() {
  const cols = [
    {
      title: 'HUI',
      links: [
        { label: 'Über HUI', href: '#ueber' },
        { label: 'Wie HUI wirkt', href: '#prozess' },
      ],
    },
    {
      title: 'Entdecken',
      links: [
        { label: 'Projekte', href: '#welt' },
        { label: 'Werke', href: '#welt' },
        { label: 'Erlebnisse', href: '#welt' },
        { label: 'Wirker', href: '#welt' },
      ],
    },
    {
      title: 'Mitmachen',
      links: [
        { label: 'Wirker werden', href: '/login' },
        { label: 'Projekt starten', href: '/login' },
        { label: 'Partner werden', href: '/login' },
      ],
    },
    {
      title: 'Rechtliches',
      links: [
        { label: 'Impressum', href: '#impressum' },
        { label: 'Datenschutz', href: '#datenschutz' },
      ],
    },
  ];

  return (
    <footer className="lp-footer" id="wege-footer">
      <div className="lp-footer__inner">
        <div className="lp-footer__brand">
          <img src="/assets/brand/hui-logo.png" alt="HUI" className="lp-footer__logo" />
          <p className="lp-footer__tagline">
            Ein ruhiges kreatives Netzwerk<br />für Menschen die wirken.
          </p>
        </div>
        <div className="lp-footer__cols">
          {cols.map((col) => (
            <div key={col.title} className="lp-footer__col">
              <h4 className="lp-footer__col-title">{col.title}</h4>
              {col.links.map((l) => (
                l.href.startsWith('#')
                  ? <a key={l.label} href={l.href} className="lp-footer__link">{l.label}</a>
                  : <Link key={l.label} to={l.href} className="lp-footer__link">{l.label}</Link>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="lp-footer__bottom">
        <p>© 2026 HUI — Human United Intelligence</p>
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
