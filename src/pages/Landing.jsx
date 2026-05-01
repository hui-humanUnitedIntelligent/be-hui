import React, { useState, useEffect } from "react";

export default function LandingPage() {
  const [lang, setLang] = useState("de");
  const [scrolled, setScrolled] = useState(false);

  const TEAL = "#2ABFAC";
  const CORAL = "#FF6B5B";
  const GOLD = "#F5A623";
  const PURPLE = "#8b5cf6";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const de = {
    hero_tag: "Eine Bewegung. Eine Plattform. Ein Herz.",
    hero_title: "Human United Intelligent",
    hero_sub: "HUI verbindet echte Menschen, inspirierende Talente und bedeutungsvolle Werke — und jede Transaktion verändert die Welt ein kleines Stück.",
    hero_cta: "Jetzt Teil werden",
    what_title: "Mehr als ein Marktplatz",
    what_sub: "HUI ist ein Ort, an dem Menschen zusammenkommen — nicht nur um zu kaufen und zu verkaufen, sondern um etwas zu bewegen.",
    c1: "Echte Talente", c1t: "Fotografen, Köche, Künstler, Handwerker — Menschen mit echten Fähigkeiten, die du direkt buchen kannst.",
    c2: "Echte Werke", c2t: "Handgemachtes, Kunst, Unikate — Dinge mit Geschichte und Seele, direkt von den Menschen die sie erschaffen.",
    c3: "Echter Impact", c3t: "Von jeder Transaktion fließt ein Teil in soziale Projekte — transparent, gemeinschaftlich, bedeutungsvoll.",
    how_title: "Wie es funktioniert",
    s1: "Entdecke", s1t: "Durchstöbere Talente und Werke in deiner Nähe.",
    s2: "Buche sicher", s2t: "Per Treuhand-System — du zahlst erst wenn du zufrieden bist.",
    s3: "Verändere die Welt", s3t: "15% unserer Provision fließt in Projekte die ihr als Community wählt.",
    impact_title: "Jede Buchung zählt 🌱",
    impact_sub: "Bei HUI ist Impact kein Marketingversprechen — es ist die Grundlage unseres Modells. Die Community entscheidet jeden Monat, welches Projekt gefördert wird.",
    wirker_title: "Zeig der Welt was du kannst",
    wirker_sub: "Du hast ein Talent, ein Handwerk, eine Leidenschaft? Werde Wirker und verdiene Geld mit dem was du liebst — während du gleichzeitig etwas Gutes tust.",
    join_title: "Werde Teil von etwas Echtem 💛",
    join_sub: "HUI ist mehr als eine App. Es ist eine Gemeinschaft von Menschen die glauben, dass Wirtschaft und Herz zusammenpassen.",
    join_cta: "Jetzt mitmachen ✨",
    join_cta2: "Ich bin Wirker 💫",
    btn_lang: "EN",
  };

  const en = {
    hero_tag: "A movement. A platform. A heart.",
    hero_title: "Human United Intelligent",
    hero_sub: "HUI connects real people, inspiring talents and meaningful creations — and every transaction changes the world just a little bit.",
    hero_cta: "Join now",
    what_title: "More than a marketplace",
    what_sub: "HUI is a place where people come together — not just to buy and sell, but to make a difference.",
    c1: "Real Talents", c1t: "Photographers, chefs, artists, craftspeople — real people with real skills you can book directly.",
    c2: "Real Creations", c2t: "Handmade goods, art, one-of-a-kind pieces — things with story and soul, directly from the people who made them.",
    c3: "Real Impact", c3t: "A portion of every transaction goes to social projects — transparently, collectively, meaningfully.",
    how_title: "How it works",
    s1: "Discover", s1t: "Browse talents and creations near you.",
    s2: "Book safely", s2t: "Via escrow system — you only pay when you're satisfied.",
    s3: "Change the world", s3t: "15% of our commission goes to projects chosen by the community.",
    impact_title: "Every booking counts 🌱",
    impact_sub: "At HUI, impact isn't a marketing promise — it's the foundation of our model. The community decides every month which project gets funded.",
    wirker_title: "Show the world what you can do",
    wirker_sub: "You have a talent, a craft, a passion? Become a Maker and earn money doing what you love — while doing something good at the same time.",
    join_title: "Become part of something real 💛",
    join_sub: "HUI is more than an app. It's a community of people who believe that business and heart belong together.",
    join_cta: "Join now ✨",
    join_cta2: "I'm a Maker 💫",
    btn_lang: "DE",
  };

  const t = lang === "de" ? de : en;

  const wirker = [
    { name: "Sofia M.", role: lang === "de" ? "Keramik-Künstlerin" : "Ceramic Artist", img: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=120&h=120&fit=crop&crop=face", rating: 4.9 },
    { name: "Marcus B.", role: lang === "de" ? "Fotograf" : "Photographer", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=face", rating: 5.0 },
    { name: "Lena K.", role: lang === "de" ? "Aquarell-Künstlerin" : "Watercolor Artist", img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&h=120&fit=crop&crop=face", rating: 4.8 },
    { name: "Tom R.", role: "Yoga & Wellness", img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&crop=face", rating: 4.9 },
  ];

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: "#fafaf8", color: "#1a1a1a", overflowX: "hidden" }}>

      {/* NAV */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: scrolled ? "rgba(255,255,255,0.95)" : "transparent", backdropFilter: scrolled ? "blur(20px)" : "none", borderBottom: scrolled ? "1px solid rgba(0,0,0,0.06)" : "none", transition: "all 0.3s", padding: "0 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg, ${TEAL}, ${CORAL})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>❤️</div>
            <span style={{ fontWeight: 800, fontSize: 20, color: scrolled ? "#1a1a1a" : "white" }}>HUI</span>
          </div>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <button onClick={() => scrollTo("impact")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: scrolled ? "#555" : "rgba(255,255,255,0.8)", fontWeight: 500 }}>Impact</button>
            <button onClick={() => setLang(lang === "de" ? "en" : "de")} style={{ background: scrolled ? "#f0f0f0" : "rgba(255,255,255,0.15)", border: "none", borderRadius: 20, padding: "4px 14px", cursor: "pointer", fontSize: 13, color: scrolled ? "#333" : "white", fontWeight: 600 }}>{t.btn_lang}</button>
            <button onClick={() => scrollTo("join")} style={{ background: TEAL, color: "white", border: "none", borderRadius: 24, padding: "8px 20px", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>{t.join_cta.split(" ")[0]}</button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f1923 0%, #1a2d3a 50%, #0d2a25 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "120px 24px 80px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "20%", left: "8%", width: 350, height: 350, borderRadius: "50%", background: `radial-gradient(circle, ${TEAL}25, transparent 70%)`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "20%", right: "8%", width: 300, height: 300, borderRadius: "50%", background: `radial-gradient(circle, ${CORAL}20, transparent 70%)`, pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 2, maxWidth: 680 }}>
          <div style={{ display: "inline-block", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 24, padding: "6px 18px", marginBottom: 28, fontSize: 13, color: "rgba(255,255,255,0.8)" }}>
            ✨ {t.hero_tag}
          </div>
          <h1 style={{ fontSize: "clamp(56px, 10vw, 96px)", fontWeight: 900, color: "white", margin: "0 0 8px", letterSpacing: "-3px", lineHeight: 1 }}>HUI</h1>
          <h2 style={{ fontSize: "clamp(13px, 2vw, 18px)", fontWeight: 400, color: "rgba(255,255,255,0.5)", margin: "0 0 28px", letterSpacing: "5px", textTransform: "uppercase" }}>{t.hero_title}</h2>
          <p style={{ fontSize: "clamp(16px, 2.5vw, 20px)", color: "rgba(255,255,255,0.75)", lineHeight: 1.7, marginBottom: 44, maxWidth: 560, margin: "0 auto 44px" }}>{t.hero_sub}</p>

          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => scrollTo("join")} style={{ background: `linear-gradient(135deg, ${TEAL}, #1da893)`, color: "white", border: "none", borderRadius: 32, padding: "16px 34px", cursor: "pointer", fontSize: 16, fontWeight: 700, boxShadow: `0 8px 32px ${TEAL}44` }}>
              {t.hero_cta} →
            </button>
            <button onClick={() => scrollTo("what")} style={{ background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 32, padding: "16px 34px", cursor: "pointer", fontSize: 16, fontWeight: 500 }}>
              {lang === "de" ? "Mehr entdecken" : "Learn more"}
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: 48, justifyContent: "center", marginTop: 72, flexWrap: "wrap" }}>
            {[["500+", lang === "de" ? "Wirker" : "Makers"], ["2.400+", lang === "de" ? "Buchungen" : "Bookings"], ["12.000 €", "Impact"]].map(([v, l], i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 30, fontWeight: 800, color: "white" }}>{v}</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 3 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT IS HUI */}
      <section id="what" style={{ padding: "90px 24px", background: "white" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(26px, 5vw, 46px)", fontWeight: 800, margin: "0 0 14px", letterSpacing: "-1px" }}>{t.what_title}</h2>
          <p style={{ fontSize: 17, color: "#666", maxWidth: 560, margin: "0 auto 56px", lineHeight: 1.7 }}>{t.what_sub}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 22 }}>
            {[[t.c1, t.c1t, "👥", TEAL, `${TEAL}12`], [t.c2, t.c2t, "⭐", GOLD, `${GOLD}12`], [t.c3, t.c3t, "🌱", "#10b981", "#10b98112"]].map(([title, text, icon, color, bg], i) => (
              <div key={i} style={{ background: bg, borderRadius: 22, padding: 30, textAlign: "left", border: `1px solid ${color}25` }}>
                <div style={{ fontSize: 36, marginBottom: 16 }}>{icon}</div>
                <h3 style={{ fontSize: 19, fontWeight: 700, margin: "0 0 8px" }}>{title}</h3>
                <p style={{ fontSize: 14, color: "#666", lineHeight: 1.6, margin: 0 }}>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WIRKER */}
      <section style={{ padding: "70px 0", background: "#f5f5f2", overflow: "hidden" }}>
        <h3 style={{ textAlign: "center", fontSize: 22, fontWeight: 700, margin: "0 0 36px", padding: "0 24px" }}>{lang === "de" ? "Echte Menschen. Echte Talente." : "Real people. Real talents."}</h3>
        <div style={{ display: "flex", gap: 18, padding: "0 24px", overflowX: "auto", scrollbarWidth: "none" }}>
          {[...wirker, ...wirker].map((w, i) => (
            <div key={i} style={{ minWidth: 180, background: "white", borderRadius: 18, padding: 18, textAlign: "center", boxShadow: "0 4px 18px rgba(0,0,0,0.06)", flexShrink: 0 }}>
              <img src={w.img} alt={w.name} style={{ width: 68, height: 68, borderRadius: "50%", objectFit: "cover", marginBottom: 10, border: `3px solid ${TEAL}44` }} />
              <div style={{ fontWeight: 700, fontSize: 14 }}>{w.name}</div>
              <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>{w.role}</div>
              <div style={{ marginTop: 8, fontSize: 13, color: GOLD }}>{"★".repeat(5)} {w.rating}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: "90px 24px", background: "white" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(26px, 5vw, 46px)", fontWeight: 800, margin: "0 0 56px", letterSpacing: "-1px" }}>{t.how_title}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 40 }}>
            {[["🔍", "01", t.s1, t.s1t, TEAL], ["🔒", "02", t.s2, t.s2t, CORAL], ["🌱", "03", t.s3, t.s3t, "#10b981"]].map(([icon, num, title, text, color], i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 44, marginBottom: 12 }}>{icon}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: "2px", marginBottom: 8 }}>{num}</div>
                <h3 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 10px" }}>{title}</h3>
                <p style={{ fontSize: 14, color: "#666", lineHeight: 1.7, margin: 0 }}>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* IMPACT */}
      <section id="impact" style={{ padding: "90px 24px", background: "linear-gradient(135deg, #0f1923, #0d2a25)", color: "white", textAlign: "center" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(26px, 5vw, 46px)", fontWeight: 800, margin: "0 0 16px", letterSpacing: "-1px" }}>{t.impact_title}</h2>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.65)", lineHeight: 1.7, marginBottom: 56, maxWidth: 580, margin: "0 auto 56px" }}>{t.impact_sub}</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 20, marginBottom: 56 }}>
            {[["2,25%", lang === "de" ? "jeder Buchung" : "of every booking", lang === "de" ? "fließt in Impact" : "goes to Impact", "#10b981"], ["1", lang === "de" ? "Projekt" : "Project", lang === "de" ? "wird monatlich gefördert" : "funded every month", GOLD], ["100%", "Community", lang === "de" ? "entscheidet gemeinsam" : "decides together", TEAL]].map(([val, label, sub, color], i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${color}33`, borderRadius: 18, padding: 26 }}>
                <div style={{ fontSize: 36, fontWeight: 800, color }}>{val}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "white", marginTop: 4 }}>{label}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 4 }}>{sub}</div>
              </div>
            ))}
          </div>

          {/* Projects */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 18 }}>
            {[["🌱", "Stadtgarten München", lang === "de" ? "Urban gardening für alle" : "Urban gardening for all", "1.240 €", 65, "#10b981"], ["🐾", "Tierheim Hilfe", lang === "de" ? "Futter & Pflege für Tiere in Not" : "Food & care for animals in need", "890 €", 45, CORAL], ["📚", lang === "de" ? "Bildung für Alle" : "Education for All", lang === "de" ? "Schulmaterial für Kinder" : "School supplies for children", "2.100 €", 80, GOLD]].map(([icon, name, desc, amount, pct, color], i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.06)", borderRadius: 18, padding: 22, textAlign: "left", border: `1px solid ${color}33` }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{icon}</div>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{name}</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 14 }}>{desc}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 4 }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 4 }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color }}>{amount}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOR WIRKER */}
      <section style={{ padding: "90px 24px", background: "#f5f5f2" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(26px, 5vw, 46px)", fontWeight: 800, margin: "0 0 16px", letterSpacing: "-1px" }}>{t.wirker_title}</h2>
          <p style={{ fontSize: 17, color: "#666", lineHeight: 1.7, marginBottom: 40, maxWidth: 560, margin: "0 auto 40px" }}>{t.wirker_sub}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 420, margin: "0 auto 36px", textAlign: "left" }}>
            {[lang === "de" ? "Kostenlos registrieren & Profil erstellen" : "Register for free & create your profile", lang === "de" ? "KI hilft dir deinen Bio zu schreiben" : "AI helps you write your bio", lang === "de" ? "Buchungen sicher per Treuhand verwalten" : "Manage bookings safely via escrow", lang === "de" ? "Teil einer wachsenden Community sein" : "Be part of a growing community"].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: `${TEAL}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 13 }}>✓</div>
                <span style={{ fontSize: 15, color: "#444" }}>{item}</span>
              </div>
            ))}
          </div>
          <button onClick={() => scrollTo("join")} style={{ background: `linear-gradient(135deg, ${PURPLE}, #7c3aed)`, color: "white", border: "none", borderRadius: 32, padding: "15px 32px", cursor: "pointer", fontSize: 15, fontWeight: 700 }}>
            {lang === "de" ? "Als Wirker starten →" : "Start as a Maker →"}
          </button>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ padding: "90px 24px", background: "white" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(26px, 5vw, 46px)", fontWeight: 800, margin: "0 0 48px", letterSpacing: "-1px" }}>{lang === "de" ? "Was Menschen über HUI sagen" : "What people say about HUI"}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 22 }}>
            {[[lang === "de" ? "\"Ich habe durch HUI nicht nur Kunden gefunden — ich habe Menschen gefunden die wirklich verstehen was ich tue.\"" : "\"Through HUI I didn't just find clients — I found people who truly understand what I do.\"", "Sofia M.", lang === "de" ? "Keramik-Künstlerin" : "Ceramic Artist", wirker[0].img, TEAL],
              [lang === "de" ? "\"Endlich eine Plattform die sich nicht wie eine kalte Transaktion anfühlt. HUI fühlt sich menschlich an.\"" : "\"Finally a platform that doesn't feel like a cold transaction. HUI feels human.\"", "Marcus B.", lang === "de" ? "Fotograf" : "Photographer", wirker[1].img, CORAL],
              [lang === "de" ? "\"Ich buche hier bewusst — weil ich weiß dass mein Geld nicht nur dem Talent hilft, sondern auch etwas Größerem.\"" : "\"I book here consciously — because I know my money not only helps the talent, but something bigger.\"", "Anna K.", lang === "de" ? "HUI-Kundin" : "HUI Customer", wirker[2].img, PURPLE]
            ].map(([text, name, role, img, color], i) => (
              <div key={i} style={{ background: "#fafaf8", borderRadius: 22, padding: 28, textAlign: "left", border: `1px solid ${color}22` }}>
                <div style={{ fontSize: 13, color: GOLD, marginBottom: 12 }}>★★★★★</div>
                <p style={{ fontSize: 14, color: "#444", lineHeight: 1.7, margin: "0 0 20px", fontStyle: "italic" }}>{text}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <img src={img} alt={name} style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", border: `2px solid ${color}` }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{name}</div>
                    <div style={{ fontSize: 11, color: "#999" }}>{role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* JOIN */}
      <section id="join" style={{ padding: "90px 24px", background: `linear-gradient(135deg, ${TEAL}, #1da893)`, textAlign: "center", color: "white" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div style={{ fontSize: 52, marginBottom: 14 }}>🌍</div>
          <h2 style={{ fontSize: "clamp(26px, 5vw, 50px)", fontWeight: 900, margin: "0 0 14px", letterSpacing: "-1px" }}>{t.join_title}</h2>
          <p style={{ fontSize: 17, opacity: 0.85, lineHeight: 1.7, marginBottom: 44 }}>{t.join_sub}</p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <button style={{ background: "white", color: TEAL, border: "none", borderRadius: 32, padding: "15px 34px", cursor: "pointer", fontSize: 16, fontWeight: 800, boxShadow: "0 8px 28px rgba(0,0,0,0.12)" }}>{t.join_cta}</button>
            <button style={{ background: "rgba(255,255,255,0.18)", color: "white", border: "2px solid rgba(255,255,255,0.45)", borderRadius: 32, padding: "15px 34px", cursor: "pointer", fontSize: 16, fontWeight: 700 }}>{t.join_cta2}</button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "#0f1923", color: "rgba(255,255,255,0.5)", padding: "44px 24px", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 20 }}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: `linear-gradient(135deg, ${TEAL}, ${CORAL})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>❤️</div>
          <span style={{ fontWeight: 800, fontSize: 17, color: "white" }}>HUI</span>
        </div>
        <p style={{ fontSize: 13, margin: "0 0 20px", color: "rgba(255,255,255,0.35)" }}>Human. United. Intelligent.</p>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", margin: 0 }}>© 2025 HUI — {lang === "de" ? "Mit ❤️ gemacht." : "Made with ❤️"}</p>
      </footer>

      <style>{`* { box-sizing: border-box; } ::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
}
