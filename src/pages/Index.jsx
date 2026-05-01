import React, { useState, useEffect } from "react";
import { Heart, Star, Leaf, Users, ArrowRight, Globe, ChevronDown, Play, Check, Sparkles } from "lucide-react";

const TEAL = "#2ABFAC";
const CORAL = "#FF6B5B";
const GOLD = "#F5A623";
const PURPLE = "#8b5cf6";

const translations = {
  de: {
    nav_about: "Was ist HUI?",
    nav_wirker: "Für Wirker",
    nav_impact: "Impact",
    nav_join: "Mitmachen",
    hero_tag: "Eine Bewegung. Eine Plattform. Ein Herz.",
    hero_title: "Human United Intelligent",
    hero_sub: "HUI verbindet echte Menschen, inspirierende Talente und bedeutungsvolle Werke — und jede Transaktion verändert die Welt ein kleines Stück.",
    hero_cta: "Jetzt Teil werden",
    hero_cta2: "Mehr entdecken",
    what_tag: "Was ist HUI?",
    what_title: "Mehr als ein Marktplatz",
    what_sub: "HUI ist ein Ort, an dem Menschen zusammenkommen — nicht nur um zu kaufen und zu verkaufen, sondern um etwas zu bewegen.",
    card1_title: "Echte Talente",
    card1_text: "Fotografen, Köche, Künstler, Handwerker — Menschen mit echten Fähigkeiten, die du direkt buchen kannst.",
    card2_title: "Echte Werke",
    card2_text: "Handgemachtes, Kunst, Unikate — Dinge mit Geschichte und Seele, direkt von den Menschen die sie erschaffen.",
    card3_title: "Echter Impact",
    card3_text: "Von jeder Transaktion fließt ein Teil in soziale Projekte — transparent, gemeinschaftlich, bedeutungsvoll.",
    how_tag: "Wie es funktioniert",
    how_title: "Einfach. Transparent. Bedeutungsvoll.",
    step1_title: "Entdecke",
    step1_text: "Durchstöbere Talente und Werke in deiner Nähe oder weltweit.",
    step2_title: "Buche & kaufe",
    step2_text: "Sicher per Treuhand-System — du zahlst erst wenn du zufrieden bist.",
    step3_title: "Verändere",
    step3_text: "15% unserer Provision fließt direkt in Projekte die ihr als Community wählt.",
    impact_tag: "Impact",
    impact_title: "Jede Buchung zählt",
    impact_sub: "Bei HUI ist Impact kein Marketingversprechen — es ist die Grundlage unseres Modells. Die Community entscheidet jeden Monat, welches Projekt gefördert wird.",
    impact_stat1: "Jeder Buchung",
    impact_stat1_sub: "fließt in den Impact Pool",
    impact_stat2: "Projekte",
    impact_stat2_sub: "werden monatlich gefördert",
    impact_stat3: "Community",
    impact_stat3_sub: "entscheidet gemeinsam",
    wirker_tag: "Für Wirker",
    wirker_title: "Zeig der Welt was du kannst",
    wirker_sub: "Du hast ein Talent, ein Handwerk, eine Leidenschaft? Dann gehörst du zu HUI. Werde Wirker und verdiene Geld mit dem was du liebst — während du gleichzeitig etwas Gutes tust.",
    wirker_1: "Kostenlos registrieren & Profil erstellen",
    wirker_2: "KI hilft dir deinen Bio zu schreiben",
    wirker_3: "Buchungen & Verkäufe sicher verwalten",
    wirker_4: "Teil einer wachsenden Community sein",
    wirker_cta: "Als Wirker starten",
    testimonials_tag: "Stimmen",
    testimonials_title: "Was Menschen über HUI sagen",
    t1_text: "\"Ich habe durch HUI nicht nur Kunden gefunden — ich habe Menschen gefunden die wirklich verstehen was ich tue.\"",
    t1_name: "Sofia M.",
    t1_role: "Keramik-Künstlerin",
    t2_text: "\"Endlich eine Plattform die sich nicht wie eine kalte Transaktion anfühlt. HUI fühlt sich menschlich an.\"",
    t2_name: "Marcus B.",
    t2_role: "Fotograf",
    t3_text: "\"Ich buche hier bewusst — weil ich weiß dass mein Geld nicht nur dem Talent hilft, sondern auch etwas Größerem.\"",
    t3_name: "Anna K.",
    t3_role: "HUI-Kundin",
    join_title: "Werde Teil von etwas Echtem",
    join_sub: "HUI ist mehr als eine App. Es ist eine Gemeinschaft von Menschen die glauben, dass Wirtschaft und Herz zusammenpassen.",
    join_cta: "Jetzt mitmachen",
    join_cta2: "Ich bin Wirker",
    footer_tagline: "Human. United. Intelligent.",
    footer_impact: "Impact",
    footer_community: "Community",
    footer_wirker: "Wirker werden",
    footer_contact: "Kontakt",
  },
  en: {
    nav_about: "What is HUI?",
    nav_wirker: "For Makers",
    nav_impact: "Impact",
    nav_join: "Join",
    hero_tag: "A movement. A platform. A heart.",
    hero_title: "Human United Intelligent",
    hero_sub: "HUI connects real people, inspiring talents and meaningful creations — and every transaction changes the world just a little bit.",
    hero_cta: "Join now",
    hero_cta2: "Discover more",
    what_tag: "What is HUI?",
    what_title: "More than a marketplace",
    what_sub: "HUI is a place where people come together — not just to buy and sell, but to make a difference.",
    card1_title: "Real Talents",
    card1_text: "Photographers, chefs, artists, craftspeople — real people with real skills you can book directly.",
    card2_title: "Real Creations",
    card2_text: "Handmade goods, art, one-of-a-kind pieces — things with story and soul, directly from the people who made them.",
    card3_title: "Real Impact",
    card3_text: "A portion of every transaction goes to social projects — transparently, collectively, meaningfully.",
    how_tag: "How it works",
    how_title: "Simple. Transparent. Meaningful.",
    step1_title: "Discover",
    step1_text: "Browse talents and creations near you or worldwide.",
    step2_title: "Book & buy",
    step2_text: "Safe via escrow system — you only pay when you're satisfied.",
    step3_title: "Change",
    step3_text: "15% of our commission goes directly to projects chosen by the community.",
    impact_tag: "Impact",
    impact_title: "Every booking counts",
    impact_sub: "At HUI, impact isn't a marketing promise — it's the foundation of our model. The community decides every month which project gets funded.",
    impact_stat1: "of every booking",
    impact_stat1_sub: "goes to the Impact Pool",
    impact_stat2: "Projects",
    impact_stat2_sub: "funded every month",
    impact_stat3: "Community",
    impact_stat3_sub: "decides together",
    wirker_tag: "For Makers",
    wirker_title: "Show the world what you can do",
    wirker_sub: "You have a talent, a craft, a passion? Then you belong at HUI. Become a Maker and earn money doing what you love — while doing something good at the same time.",
    wirker_1: "Register for free & create your profile",
    wirker_2: "AI helps you write your bio",
    wirker_3: "Manage bookings & sales securely",
    wirker_4: "Be part of a growing community",
    wirker_cta: "Start as a Maker",
    testimonials_tag: "Voices",
    testimonials_title: "What people say about HUI",
    t1_text: "\"Through HUI I didn't just find clients — I found people who truly understand what I do.\"",
    t1_name: "Sofia M.",
    t1_role: "Ceramic Artist",
    t2_text: "\"Finally a platform that doesn't feel like a cold transaction. HUI feels human.\"",
    t2_name: "Marcus B.",
    t2_role: "Photographer",
    t3_text: "\"I book here consciously — because I know my money not only helps the talent, but something bigger.\"",
    t3_name: "Anna K.",
    t3_role: "HUI Customer",
    join_title: "Become part of something real",
    join_sub: "HUI is more than an app. It's a community of people who believe that business and heart belong together.",
    join_cta: "Join now",
    join_cta2: "I'm a Maker",
    footer_tagline: "Human. United. Intelligent.",
    footer_impact: "Impact",
    footer_community: "Community",
    footer_wirker: "Become a Maker",
    footer_contact: "Contact",
  }
};

const wirkerProfiles = [
  { name: "Sofia M.", role: "Keramik · Ceramic", img: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=200&fit=crop&crop=face", rating: 4.9, location: "München" },
  { name: "Marcus B.", role: "Fotograf · Photographer", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face", rating: 5.0, location: "Berlin" },
  { name: "Lena K.", role: "Aquarell · Watercolor", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face", rating: 4.8, location: "Hamburg" },
  { name: "Tom R.", role: "Yoga · Wellness", img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face", rating: 4.9, location: "Wien" },
  { name: "Maria L.", role: "Koch · Chef", img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face", rating: 5.0, location: "Zürich" },
];

const impactProjects = [
  { icon: "🌱", name: "Stadtgarten München", desc: "Urban gardening für alle", amount: "1.240 €", color: "#10b981" },
  { icon: "🐾", name: "Tierheim Hilfe", desc: "Futter & Pflege für Tiere in Not", amount: "890 €", color: CORAL },
  { icon: "📚", name: "Bildung für Alle", desc: "Schulmaterial für Kinder", amount: "2.100 €", color: GOLD },
];

export default function LandingPage() {
  const [lang, setLang] = useState("de");
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const t = translations[lang];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", background: "#fafaf8", color: "#1a1a1a", overflowX: "hidden" }}>

      {/* NAV */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? "rgba(255,255,255,0.95)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(0,0,0,0.06)" : "none",
        transition: "all 0.3s ease",
        padding: "0 24px",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg, ${TEAL}, ${CORAL})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Heart size={18} color="white" fill="white" />
            </div>
            <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: "-0.5px" }}>HUI</span>
          </div>

          <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
            <button onClick={() => scrollTo("what")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: scrolled ? "#1a1a1a" : "white", fontWeight: 500 }}>{t.nav_about}</button>
            <button onClick={() => scrollTo("wirker")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: scrolled ? "#1a1a1a" : "white", fontWeight: 500 }}>{t.nav_wirker}</button>
            <button onClick={() => scrollTo("impact")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: scrolled ? "#1a1a1a" : "white", fontWeight: 500 }}>{t.nav_impact}</button>
            <button
              onClick={() => setLang(lang === "de" ? "en" : "de")}
              style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 20, padding: "4px 12px", cursor: "pointer", fontSize: 13, color: scrolled ? "#1a1a1a" : "white", display: "flex", alignItems: "center", gap: 4 }}
            >
              <Globe size={13} /> {lang === "de" ? "EN" : "DE"}
            </button>
            <button
              onClick={() => scrollTo("join")}
              style={{ background: TEAL, color: "white", border: "none", borderRadius: 24, padding: "8px 20px", cursor: "pointer", fontSize: 14, fontWeight: 600 }}
            >
              {t.nav_join}
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{
        minHeight: "100vh",
        background: `linear-gradient(135deg, #0f1923 0%, #1a2d3a 40%, #0d2a25 100%)`,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        textAlign: "center", padding: "120px 24px 80px", position: "relative", overflow: "hidden"
      }}>
        {/* Background orbs */}
        <div style={{ position: "absolute", top: "20%", left: "10%", width: 400, height: 400, borderRadius: "50%", background: `radial-gradient(circle, ${TEAL}22, transparent 70%)`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "20%", right: "10%", width: 300, height: 300, borderRadius: "50%", background: `radial-gradient(circle, ${CORAL}22, transparent 70%)`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 600, borderRadius: "50%", background: `radial-gradient(circle, ${PURPLE}11, transparent 70%)`, pointerEvents: "none" }} />

        {/* Floating wirker avatars */}
        {wirkerProfiles.map((w, i) => (
          <div key={i} style={{
            position: "absolute",
            top: `${[15, 70, 25, 60, 80][i]}%`,
            left: `${[5, 3, 88, 85, 45][i]}%`,
            opacity: 0.6,
            animation: `float${i} 6s ease-in-out infinite`,
            animationDelay: `${i * 0.8}s`,
          }}>
            <img src={w.img} alt={w.name} style={{ width: [48, 40, 52, 44, 36][i], height: [48, 40, 52, 44, 36][i], borderRadius: "50%", border: `2px solid ${[TEAL, CORAL, GOLD, PURPLE, TEAL][i]}`, objectFit: "cover" }} />
          </div>
        ))}

        <div style={{ position: "relative", zIndex: 2, maxWidth: 700 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 24, padding: "6px 16px", marginBottom: 24 }}>
            <Sparkles size={14} color={GOLD} />
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>{t.hero_tag}</span>
          </div>

          <h1 style={{ fontSize: "clamp(48px, 8vw, 88px)", fontWeight: 900, color: "white", margin: "0 0 8px", letterSpacing: "-2px", lineHeight: 1 }}>
            HUI
          </h1>
          <h2 style={{ fontSize: "clamp(16px, 3vw, 24px)", fontWeight: 400, color: "rgba(255,255,255,0.6)", margin: "0 0 24px", letterSpacing: "4px", textTransform: "uppercase" }}>
            {t.hero_title}
          </h2>

          <p style={{ fontSize: "clamp(16px, 2.5vw, 20px)", color: "rgba(255,255,255,0.75)", lineHeight: 1.7, marginBottom: 40, maxWidth: 580, margin: "0 auto 40px" }}>
            {t.hero_sub}
          </p>

          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => scrollTo("join")}
              style={{ background: `linear-gradient(135deg, ${TEAL}, #1da893)`, color: "white", border: "none", borderRadius: 32, padding: "16px 32px", cursor: "pointer", fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", gap: 8, boxShadow: `0 8px 32px ${TEAL}44` }}
            >
              {t.hero_cta} <ArrowRight size={18} />
            </button>
            <button
              onClick={() => scrollTo("what")}
              style={{ background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 32, padding: "16px 32px", cursor: "pointer", fontSize: 16, fontWeight: 600 }}
            >
              {t.hero_cta2}
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: 48, justifyContent: "center", marginTop: 64, flexWrap: "wrap" }}>
            {[
              { value: "500+", label: lang === "de" ? "Wirker" : "Makers" },
              { value: "2.400+", label: lang === "de" ? "Buchungen" : "Bookings" },
              { value: "12.000 €", label: "Impact" },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: "white" }}>{s.value}</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)", animation: "bounce 2s infinite" }}>
          <ChevronDown size={24} color="rgba(255,255,255,0.4)" />
        </div>
      </section>

      {/* WHAT IS HUI */}
      <section id="what" style={{ padding: "100px 24px", background: "white" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: `${TEAL}15`, borderRadius: 24, padding: "6px 16px", marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: TEAL, fontWeight: 600 }}>{t.what_tag}</span>
          </div>
          <h2 style={{ fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 800, margin: "0 0 16px", letterSpacing: "-1px" }}>{t.what_title}</h2>
          <p style={{ fontSize: 18, color: "#666", maxWidth: 600, margin: "0 auto 64px", lineHeight: 1.7 }}>{t.what_sub}</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
            {[
              { icon: <Users size={28} color={TEAL} />, title: t.card1_title, text: t.card1_text, color: TEAL, bg: `${TEAL}10` },
              { icon: <Star size={28} color={GOLD} />, title: t.card2_title, text: t.card2_text, color: GOLD, bg: `${GOLD}10` },
              { icon: <Leaf size={28} color="#10b981" />, title: t.card3_title, text: t.card3_text, color: "#10b981", bg: "#10b98110" },
            ].map((c, i) => (
              <div key={i} style={{ background: c.bg, borderRadius: 24, padding: 32, textAlign: "left", border: `1px solid ${c.color}22` }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: "white", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, boxShadow: `0 4px 12px ${c.color}22` }}>
                  {c.icon}
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px" }}>{c.title}</h3>
                <p style={{ fontSize: 15, color: "#666", lineHeight: 1.6, margin: 0 }}>{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WIRKER CAROUSEL */}
      <section style={{ padding: "80px 0", background: "#f8f8f6", overflow: "hidden" }}>
        <div style={{ textAlign: "center", marginBottom: 48, padding: "0 24px" }}>
          <h3 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: "#1a1a1a" }}>
            {lang === "de" ? "Echte Menschen. Echte Talente." : "Real people. Real talents."}
          </h3>
        </div>
        <div style={{ display: "flex", gap: 20, padding: "0 24px", overflowX: "auto", scrollbarWidth: "none" }}>
          {[...wirkerProfiles, ...wirkerProfiles].map((w, i) => (
            <div key={i} style={{ minWidth: 200, background: "white", borderRadius: 20, padding: 20, textAlign: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", flexShrink: 0 }}>
              <img src={w.img} alt={w.name} style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", marginBottom: 12, border: `3px solid ${TEAL}33` }} />
              <div style={{ fontWeight: 700, fontSize: 15 }}>{w.name}</div>
              <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>{w.role}</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginTop: 8 }}>
                <Star size={12} color={GOLD} fill={GOLD} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>{w.rating}</span>
                <span style={{ fontSize: 12, color: "#999" }}>· {w.location}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: "100px 24px", background: "white" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: `${CORAL}15`, borderRadius: 24, padding: "6px 16px", marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: CORAL, fontWeight: 600 }}>{t.how_tag}</span>
          </div>
          <h2 style={{ fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 800, margin: "0 0 64px", letterSpacing: "-1px" }}>{t.how_title}</h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 32, position: "relative" }}>
            {[
              { num: "01", title: t.step1_title, text: t.step1_text, icon: "🔍", color: TEAL },
              { num: "02", title: t.step2_title, text: t.step2_text, icon: "🔒", color: CORAL },
              { num: "03", title: t.step3_title, text: t.step3_text, icon: "🌱", color: "#10b981" },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>{s.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: s.color, letterSpacing: "2px", marginBottom: 8 }}>{s.num}</div>
                <h3 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 12px" }}>{s.title}</h3>
                <p style={{ fontSize: 15, color: "#666", lineHeight: 1.7, margin: 0 }}>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* IMPACT */}
      <section id="impact" style={{ padding: "100px 24px", background: `linear-gradient(135deg, #0f1923, #0d2a25)`, color: "white" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(16,185,129,0.2)", borderRadius: 24, padding: "6px 16px", marginBottom: 16 }}>
              <Leaf size={14} color="#10b981" />
              <span style={{ fontSize: 13, color: "#10b981", fontWeight: 600 }}>{t.impact_tag}</span>
            </div>
            <h2 style={{ fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 800, margin: "0 0 16px", letterSpacing: "-1px" }}>{t.impact_title}</h2>
            <p style={{ fontSize: 18, color: "rgba(255,255,255,0.65)", maxWidth: 600, margin: "0 auto", lineHeight: 1.7 }}>{t.impact_sub}</p>
          </div>

          {/* Impact Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 24, marginBottom: 64 }}>
            {[
              { value: "2,25%", label: t.impact_stat1, sub: t.impact_stat1_sub, color: "#10b981" },
              { value: "1", label: t.impact_stat2, sub: t.impact_stat2_sub, color: GOLD },
              { value: "100%", label: t.impact_stat3, sub: t.impact_stat3_sub, color: TEAL },
            ].map((s, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${s.color}33`, borderRadius: 20, padding: 28, textAlign: "center" }}>
                <div style={{ fontSize: 40, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "white", marginTop: 4 }}>{s.label}</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Impact Projects */}
          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, textAlign: "center", color: "rgba(255,255,255,0.8)" }}>
            {lang === "de" ? "Aktuelle Projekte" : "Current Projects"}
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
            {impactProjects.map((p, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.06)", borderRadius: 20, padding: 24, border: `1px solid ${p.color}33` }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>{p.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 4 }}>{p.name}</div>
                <div style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", marginBottom: 16 }}>{p.desc}</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ height: 4, flex: 1, background: "rgba(255,255,255,0.1)", borderRadius: 4, marginRight: 12, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${[65, 45, 80][i]}%`, background: p.color, borderRadius: 4 }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: p.color }}>{p.amount}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOR WIRKER */}
      <section id="wirker" style={{ padding: "100px 24px", background: "white" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 64, alignItems: "center" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: `${PURPLE}15`, borderRadius: 24, padding: "6px 16px", marginBottom: 16 }}>
              <span style={{ fontSize: 13, color: PURPLE, fontWeight: 600 }}>{t.wirker_tag}</span>
            </div>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, margin: "0 0 16px", letterSpacing: "-1px", lineHeight: 1.2 }}>{t.wirker_title}</h2>
            <p style={{ fontSize: 17, color: "#666", lineHeight: 1.7, marginBottom: 32 }}>{t.wirker_sub}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 40 }}>
              {[t.wirker_1, t.wirker_2, t.wirker_3, t.wirker_4].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: `${TEAL}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Check size={14} color={TEAL} />
                  </div>
                  <span style={{ fontSize: 15, color: "#444" }}>{item}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => scrollTo("join")}
              style={{ background: `linear-gradient(135deg, ${PURPLE}, #7c3aed)`, color: "white", border: "none", borderRadius: 32, padding: "16px 32px", cursor: "pointer", fontSize: 16, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 8 }}
            >
              {t.wirker_cta} <ArrowRight size={18} />
            </button>
          </div>

          {/* Visual */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {wirkerProfiles.slice(0, 4).map((w, i) => (
              <div key={i} style={{
                background: `linear-gradient(135deg, ${["#0f1923", "#1a2d3a", "#0d2a25", "#1a1a2e"][i]}, ${["#1a2d3a", "#0d2a25", "#1a1a2e", "#0f1923"][i]})`,
                borderRadius: 20, padding: 20, textAlign: "center",
                transform: i === 1 ? "translateY(20px)" : i === 3 ? "translateY(-20px)" : "none"
              }}>
                <img src={w.img} alt={w.name} style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", marginBottom: 10, border: `2px solid ${[TEAL, CORAL, GOLD, PURPLE][i]}` }} />
                <div style={{ fontWeight: 700, fontSize: 14, color: "white" }}>{w.name}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{w.role.split(" · ")[0]}</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3, marginTop: 6 }}>
                  <Star size={10} color={GOLD} fill={GOLD} />
                  <span style={{ fontSize: 12, color: GOLD, fontWeight: 600 }}>{w.rating}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ padding: "100px 24px", background: "#f8f8f6" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: `${GOLD}20`, borderRadius: 24, padding: "6px 16px", marginBottom: 16 }}>
            <Star size={14} color={GOLD} />
            <span style={{ fontSize: 13, color: GOLD, fontWeight: 600 }}>{t.testimonials_tag}</span>
          </div>
          <h2 style={{ fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 800, margin: "0 0 48px", letterSpacing: "-1px" }}>{t.testimonials_title}</h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
            {[
              { text: t.t1_text, name: t.t1_name, role: t.t1_role, img: wirkerProfiles[0].img, color: TEAL },
              { text: t.t2_text, name: t.t2_name, role: t.t2_role, img: wirkerProfiles[1].img, color: CORAL },
              { text: t.t3_text, name: t.t3_name, role: t.t3_role, img: wirkerProfiles[2].img, color: PURPLE },
            ].map((t2, i) => (
              <div key={i} style={{ background: "white", borderRadius: 24, padding: 32, textAlign: "left", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", border: `1px solid ${t2.color}22` }}>
                <div style={{ display: "flex", gap: 2, marginBottom: 16 }}>
                  {[1,2,3,4,5].map(s => <Star key={s} size={14} color={GOLD} fill={GOLD} />)}
                </div>
                <p style={{ fontSize: 15, color: "#444", lineHeight: 1.7, margin: "0 0 20px", fontStyle: "italic" }}>{t2.text}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <img src={t2.img} alt={t2.name} style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: `2px solid ${t2.color}` }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{t2.name}</div>
                    <div style={{ fontSize: 12, color: "#999" }}>{t2.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* JOIN CTA */}
      <section id="join" style={{ padding: "100px 24px", background: `linear-gradient(135deg, ${TEAL}, #1da893)`, textAlign: "center", color: "white" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🌍</div>
          <h2 style={{ fontSize: "clamp(28px, 5vw, 52px)", fontWeight: 900, margin: "0 0 16px", letterSpacing: "-1px" }}>{t.join_title}</h2>
          <p style={{ fontSize: 18, opacity: 0.85, lineHeight: 1.7, marginBottom: 48 }}>{t.join_sub}</p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <button style={{ background: "white", color: TEAL, border: "none", borderRadius: 32, padding: "16px 36px", cursor: "pointer", fontSize: 16, fontWeight: 800, boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
              {t.join_cta} ✨
            </button>
            <button style={{ background: "rgba(255,255,255,0.2)", color: "white", border: "2px solid rgba(255,255,255,0.5)", borderRadius: 32, padding: "16px 36px", cursor: "pointer", fontSize: 16, fontWeight: 700 }}>
              {t.join_cta2} 💫
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "#0f1923", color: "rgba(255,255,255,0.6)", padding: "48px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 24 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg, ${TEAL}, ${CORAL})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Heart size={16} color="white" fill="white" />
            </div>
            <span style={{ fontWeight: 800, fontSize: 18, color: "white" }}>HUI</span>
          </div>
          <p style={{ fontSize: 14, margin: "0 0 24px", color: "rgba(255,255,255,0.4)" }}>{t.footer_tagline}</p>
          <div style={{ display: "flex", gap: 32, justifyContent: "center", flexWrap: "wrap", marginBottom: 32 }}>
            {[t.footer_impact, t.footer_community, t.footer_wirker, t.footer_contact].map((link, i) => (
              <button key={i} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 14 }}>{link}</button>
            ))}
          </div>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", margin: 0 }}>© 2025 HUI — Human United Intelligent. {lang === "de" ? "Mit ❤️ gemacht." : "Made with ❤️"}</p>
        </div>
      </footer>

      <style>{`
        @keyframes bounce { 0%, 100% { transform: translateX(-50%) translateY(0); } 50% { transform: translateX(-50%) translateY(8px); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
