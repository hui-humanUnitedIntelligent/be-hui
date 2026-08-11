// src/pages/MeinHUI.jsx — HUI Wirkungsraum v7.0 (Einheitliche Kacheln)
// ═══════════════════════════════════════════════════════════════════
// v7.0: Alle Kacheln einheitlich 140px breit, gleiche Höhe, gleicher
// Border-Radius (16px), gleicher Padding. Jede Kachel zeigt echte
// Nutzerdaten. 4 Sektionen: Grundpfeiler, Reise, Impact-Momente,
// Wirkungs-Stats.
//
// ZINDEX: 10500 (createPortal) — PFLICHT nach footer-navbar-regel
// ═══════════════════════════════════════════════════════════════════

import React, { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../lib/supabaseClient.js";
import { APP_VERSION } from "../version";
import { optimizeAvatar } from "../lib/perfUtils.js";
import { useHuiActions, A } from "../core/hui.actions.js";
import { HUILogo } from "../components/brand/HUILogo.jsx";

// ─────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────
const T = {
  cream:      "#FAF7F2",
  creamCard:  "#FDFBF8",
  creamDeep:  "#F2EBE0",
  sand:       "#F0E9DB",
  teal:       "#0DC4B5",
  tealSoft:   "rgba(13,196,181,0.10)",
  tealPale:   "#E6FAF8",
  coral:      "#F47355",
  coralSoft:  "rgba(244,115,85,0.09)",
  sage:       "#5CA87A",
  sageSoft:   "rgba(92,168,122,0.11)",
  sagePale:   "#EEF7F2",
  gold:       "#D4952A",
  goldSoft:   "rgba(212,149,42,0.11)",
  goldPale:   "#FDF6E3",
  purple:     "#7B5EA7",
  purpleSoft: "rgba(123,94,167,0.10)",
  purplePale: "#F3EEF9",
  ink:        "#141422",
  inkMid:     "#2E2E45",
  inkSoft:    "rgba(20,20,34,0.48)",
  inkFaint:   "rgba(20,20,34,0.18)",
  white:      "#FFFFFF",
};

const FONT = "'Inter', Inter, sans-serif";
const EASE = "ease-in-out";

// ── Einheitliche Kachel-Konstanten ──
const TILE_W = 140;          // Alle Kacheln gleich breit
const TILE_RADIUS = 16;      // Gleicher Border-Radius
const TILE_PAD = "14px 12px 12px"; // Gleicher Padding
const TILE_GAP = 10;         // Gleicher Abstand
const ICON_SIZE = 36;        // Gleiche Icon-Größe
const TILE_MIN_H = 132;      // Mindesthöhe für Einheitlichkeit

// ── Choreografie ──
const CORE_DELAY    = 0;
const TITLE_DELAY   = 70;
const INFO_DELAY    = 140;
const PILLARS_DELAY = 210;
const JOURNEY_DELAY = 280;
const MOMENTS_DELAY = 350;
const STATS_DELAY   = 420;

const CLOSE_CONTENT_MS = 180;
const CLOSE_SCREEN_MS  = 220;

const KEYFRAMES = `
@keyframes mh-orb-breathe {
  0%, 100% { transform: scale(0.985); }
  50%       { transform: scale(1.015); }
}
@keyframes mh-atm-outer {
  0%, 100% { opacity: 0.22; transform: translate(-50%,-50%) scale(1.00); }
  50%       { opacity: 0.38; transform: translate(-50%,-50%) scale(1.05); }
}
@keyframes mh-atm-mid {
  0%, 100% { opacity: 0.30; transform: translate(-50%,-50%) scale(1.00); }
  50%       { opacity: 0.52; transform: translate(-50%,-50%) scale(1.08); }
}
@keyframes mh-atm-core {
  0%, 100% { opacity: 0.55; }
  50%       { opacity: 0.85; }
}
@keyframes mh-resonance {
  0%   { transform: translate(-50%,-50%) scale(0.85); opacity: 0.18; }
  100% { transform: translate(-50%,-50%) scale(1.40); opacity: 0; }
}
@keyframes mh-slide-down {
  0%   { transform: translateY(-12px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}
@keyframes mh-submodal-enter {
  0%   { transform: translateY(20px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}
`;

// ─────────────────────────────────────────────────────────────────
// FadeUp helper
// ─────────────────────────────────────────────────────────────────
function FadeUp({ delay = 0, children, style }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.style.opacity = "0";
    ref.current.style.transform = "translateY(10px)";
    const t = setTimeout(() => {
      if (ref.current) {
        ref.current.style.opacity = "1";
        ref.current.style.transform = "translateY(0)";
      }
    }, delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div ref={ref} style={{
      transition: `opacity 0.5s ${EASE}, transform 0.5s ${EASE}`,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// UNIVERSAL TILE — Einheitliche Kachel für alle Sektionen
// ─────────────────────────────────────────────────────────────────
function Tile({ icon, label, value, sub, accent, bg, border, onClick, delay, active: activeProp }) {
  const [active, setActive] = useState(false);
  return (
    <FadeUp delay={delay}>
      <div
        onClick={onClick}
        onPointerDown={() => setActive(true)}
        onPointerUp={() => setActive(false)}
        onPointerLeave={() => setActive(false)}
        style={{
          width: TILE_W,
          minHeight: TILE_MIN_H,
          flexShrink: 0,
          background: active ? T.creamCard : bg,
          border: `1px solid ${active ? accent + "40" : border}`,
          borderRadius: TILE_RADIUS,
          padding: TILE_PAD,
          cursor: "pointer",
          userSelect: "none",
          display: "flex",
          flexDirection: "column",
          transition: "transform 0.22s ease-in-out, box-shadow 0.22s ease-in-out, background 0.18s ease, border-color 0.18s ease",
          transform: active ? "translateY(-2px) scale(1.01)" : "translateY(0) scale(1)",
          boxShadow: active ? `0 6px 20px ${accent}22, 0 2px 8px rgba(0,0,0,0.05)` : `0 1px 4px rgba(0,0,0,0.04)`,
        }}
      >
        {/* Icon-Kreis */}
        <div style={{
          width: ICON_SIZE, height: ICON_SIZE, borderRadius: "50%",
          background: active ? bg : T.white,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: accent, marginBottom: 10, flexShrink: 0,
          boxShadow: active ? `0 2px 10px ${accent}18` : "0 1px 4px rgba(0,0,0,0.06)",
          transition: "box-shadow 0.22s ease, background 0.18s ease",
          fontSize: 18,
        }}>
          {icon}
        </div>
        {/* Label */}
        <div style={{
          fontFamily: FONT, fontSize: 13, fontWeight: 600,
          color: accent, marginBottom: 4, lineHeight: 1.2, letterSpacing: "-0.01em",
        }}>
          {label}
        </div>
        {/* Value (große Zahl oder Text) */}
        {value != null && (
          <div style={{
            fontFamily: FONT, fontSize: 20, fontWeight: 700,
            color: T.ink, lineHeight: 1.1, marginBottom: 2,
          }}>
            {value}
          </div>
        )}
        {/* Sub-Text */}
        {sub && (
          <div style={{
            fontFamily: FONT, fontSize: 11, fontWeight: 400,
            color: T.inkSoft, lineHeight: 1.45, flex: 1,
          }}>
            {sub}
          </div>
        )}
        {/* Accent-Linie */}
        <div style={{
          height: 2, borderRadius: 2, marginTop: 10,
          background: accent,
          width: active ? 28 : 18, opacity: active ? 0.65 : 0.35,
          transition: "width 0.25s ease-in-out, opacity 0.22s ease",
        }} />
      </div>
    </FadeUp>
  );
}

// ─────────────────────────────────────────────────────────────────
// DATA HOOK — Lädt echte Nutzer-Daten
// ─────────────────────────────────────────────────────────────────
function useWirkungsraumData(profile) {
  const [data, setData] = useState({
    loading: true,
    daysSince: 0,
    followers: 0,
    following: 0,
    worksCount: 0,
    ordersCount: 0,
    bookingsCount: 0,
    impactEur: 0,
    moments: [],
    newConnectionsThisWeek: 0,
    projectsCount: 0,
    profileViews: 0,
  });

  useEffect(() => {
    if (!profile?.id) return;
    let cancelled = false;

    async function load() {
      try {
        const uid = profile.id;

        // 1. member_since → Tage seit Beginn
        const memberSince = profile.member_since || profile.created_date;
        let daysSince = 0;
        if (memberSince) {
          const d = new Date(memberSince);
          if (!isNaN(d.getTime())) {
            daysSince = Math.max(1, Math.floor((Date.now() - d.getTime()) / 86400000));
          }
        }

        // 2. Follow counts (SSOT: get_follow_counts RPC)
        const { data: fc } = await supabase.rpc("get_follow_counts", { target_id: uid });

        // 3. Works count
        const { count: worksCount } = await supabase
          .from("works").select("id", { count: "exact", head: true })
          .eq("author_id", uid).eq("status", "published");

        // 4. Orders count (Käufe)
        const { count: ordersCount } = await supabase
          .from("orders").select("id", { count: "exact", head: true })
          .eq("buyer_id", uid).eq("payment_status", "paid");

        // 5. Talent bookings count
        const { count: bookingsCount } = await supabase
          .from("talent_bookings").select("id", { count: "exact", head: true })
          .eq("buyer_id", uid).eq("payment_status", "paid");

        // 6. Neue Verbindungen diese Woche
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const { count: newConnectionsThisWeek } = await supabase
          .from("follows").select("id", { count: "exact", head: true })
          .eq("followed_id", uid).gte("created_at", weekAgo.toISOString());

        // 7. Impact projects
        const { count: projectsCount } = await supabase
          .from("impact_applications").select("id", { count: "exact", head: true })
          .eq("applicant_id", uid).eq("status", "approved");

        // 8. Notifications → Impact-Momente
        const { data: notifs } = await supabase
          .from("notifications").select("type, metadata, created_at, is_read")
          .eq("user_id", uid).order("created_at", { ascending: false }).limit(20);

        // 9. Impact EUR + Profile Views
        const impactEur = profile.impact_eur || 0;
        const profileViews = profile.profile_views || 0;

        // Build moments from notifications
        const momentTypes = [
          "new_order", "order_confirmed", "talent_booking_paid",
          "new_follower", "work_published", "impact_project_completed",
          "comment", "inspire", "new_connection",
        ];
        const moments = (notifs || [])
          .filter(n => momentTypes.includes(n.type))
          .slice(0, 8)
          .map(n => {
            const md = n.metadata || {};
            const ageMin = Math.floor((Date.now() - new Date(n.created_at).getTime()) / 60000);
            let timeStr = "vor kurzem";
            if (ageMin < 60) timeStr = `vor ${ageMin} Min`;
            else if (ageMin < 1440) timeStr = `vor ${Math.floor(ageMin / 60)} Std`;
            else timeStr = `vor ${Math.floor(ageMin / 1440)} Tagen`;

            let icon = "♡", label = "", color = T.coral, bg = T.coralSoft, border = "rgba(244,115,85,0.13)";
            switch (n.type) {
              case "new_order":
                icon = "🛍️"; label = `Verkauft: ${md.item_titles || "Werk"}`;
                color = T.sage; bg = T.sageSoft; border = "rgba(92,168,122,0.13)";
                break;
              case "order_confirmed":
                icon = "✅"; label = `Beleg: ${md.item_titles || "Werk"}`;
                color = T.teal; bg = T.tealSoft; border = "rgba(13,196,181,0.13)";
                break;
              case "talent_booking_paid":
                icon = "📅"; label = `Buchung: ${md.offer_title || "Talent"}`;
                color = T.gold; bg = T.goldSoft; border = "rgba(212,149,42,0.13)";
                break;
              case "new_follower":
              case "new_connection":
                icon = "👥"; label = `Verbindung: ${md.follower_name || "Nutzer"}`;
                color = T.teal; bg = T.tealSoft; border = "rgba(13,196,181,0.13)";
                break;
              case "work_published":
                icon = "✏️"; label = `Werk veröffentlicht`;
                color = T.sage; bg = T.sageSoft; border = "rgba(92,168,122,0.13)";
                break;
              case "impact_project_completed":
                icon = "🌍"; label = `Projekt: ${md.project_name || "Impact"}`;
                color = T.purple; bg = T.purpleSoft; border = "rgba(123,94,167,0.13)";
                break;
              case "comment":
                icon = "💬"; label = `Kommentar: ${md.commenter_name || "Nutzer"}`;
                color = T.teal; bg = T.tealSoft; border = "rgba(13,196,181,0.13)";
                break;
              case "inspire":
                icon = "✨"; label = `Inspiration: jemand wurde inspiriert`;
                color = T.gold; bg = T.goldSoft; border = "rgba(212,149,42,0.13)";
                break;
              default:
                icon = "♡"; label = n.type || "Aktivität";
            }
            return { icon, label, time: timeStr, color, bg, border };
          });

        if (!cancelled) {
          setData({
            loading: false, daysSince,
            followers: fc?.[0]?.followers ?? profile.followers_count ?? 0,
            following: fc?.[0]?.following ?? 0,
            worksCount: worksCount || 0,
            ordersCount: ordersCount || 0,
            bookingsCount: bookingsCount || 0,
            impactEur, moments,
            newConnectionsThisWeek: newConnectionsThisWeek || 0,
            projectsCount: projectsCount || 0,
            profileViews,
          });
        }
      } catch (e) {
        console.warn("[MeinHUI] data load error:", e);
        if (!cancelled) setData(d => ({ ...d, loading: false }));
      }
    }
    load();
    return () => { cancelled = true; };
  }, [profile?.id]);

  return data;
}

// ─────────────────────────────────────────────────────────────────
// PROFILE HEADER
// ─────────────────────────────────────────────────────────────────
function ProfileHeader({ profile, onClose, delay }) {
  const avatarUrl = optimizeAvatar(profile?.avatar_url);
  const name = profile?.display_name || profile?.full_name || profile?.username || "Nutzer";
  return (
    <FadeUp delay={delay}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 20px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src={avatarUrl || "/assets/brand/hui-logo.png"} alt=""
            style={{ width: 42, height: 42, borderRadius: "50%", objectFit: "cover", background: T.creamDeep }} />
          <div>
            <div style={{ fontFamily: FONT, fontSize: 15, fontWeight: 600, color: T.ink, lineHeight: 1.2 }}>{name}</div>
            <div style={{ fontFamily: FONT, fontSize: 12, color: T.inkSoft, lineHeight: 1.2 }}>Willkommen zurück</div>
          </div>
        </div>
        <button onClick={onClose} aria-label="Schließen"
          style={{ width: 36, height: 36, borderRadius: "50%", border: "none", background: T.creamDeep, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: T.inkSoft }}>
          ×
        </button>
      </div>
    </FadeUp>
  );
}

// ─────────────────────────────────────────────────────────────────
// ORB HERO
// ─────────────────────────────────────────────────────────────────
function OrbHero({ data, coreDelay, infoDelay }) {
  return (
    <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 200, paddingTop: 16, paddingBottom: 8 }}>
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 260, height: 260, borderRadius: "50%", background: `radial-gradient(circle, ${T.teal}14 0%, transparent 70%)`, animation: "mh-atm-outer 8s ease-in-out infinite", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 180, height: 180, borderRadius: "50%", background: `radial-gradient(circle, ${T.coral}10 0%, transparent 70%)`, animation: "mh-atm-mid 6s ease-in-out infinite", pointerEvents: "none" }} />

      <FadeUp delay={coreDelay}>
        <div style={{
          width: 88, height: 88, borderRadius: "50%", background: T.white,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 8px 32px rgba(190,100,20,0.16), 0 2px 8px rgba(0,0,0,0.05)",
          animation: "mh-orb-breathe 4s ease-in-out infinite",
          position: "relative", zIndex: 1,
        }}>
          <HUILogo size={52} />
        </div>
      </FadeUp>

      <FadeUp delay={infoDelay}>
        <div style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", zIndex: 2, maxWidth: 115, textAlign: "left" }}>
          <p style={{ fontFamily: FONT, fontSize: 12.5, fontWeight: 400, lineHeight: 1.6, color: T.inkSoft, margin: "0 0 14px", letterSpacing: "0.005em" }}>
            Dein Blatt wächst durch das, was du für andere bewirkst.
          </p>
          <div style={{ color: T.coral, fontSize: 15, opacity: 0.75 }}>♡</div>
        </div>
      </FadeUp>

      <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", display: "flex", flexDirection: "column", gap: 8, zIndex: 2 }}>
        {[
          { icon: "🌱", label: "Deine Reise", sub: data.loading ? "…" : `seit ${data.daysSince} Tagen`, glow: T.sageSoft },
          { icon: "🔥", label: "Impact gesät", sub: data.loading ? "…" : `${data.worksCount + data.ordersCount + data.bookingsCount} Impulse`, glow: "rgba(244,115,85,0.08)" },
          { icon: "👥", label: "Verbindungen", sub: data.loading ? "…" : `${data.followers} Menschen`, glow: T.tealSoft },
        ].map((s, i) => (
          <FadeUp key={i} delay={infoDelay}>
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "rgba(253,251,248,0.82)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
              borderRadius: 13, padding: "6px 10px",
              boxShadow: `0 2px 10px ${s.glow}, 0 1px 3px rgba(0,0,0,0.05)`,
              border: "1px solid rgba(255,255,255,0.90)",
            }}>
              <span style={{ fontSize: 13, lineHeight: 1 }}>{s.icon}</span>
              <div>
                <div style={{ fontFamily: FONT, fontSize: 10.5, fontWeight: 600, color: T.ink, lineHeight: 1.2 }}>{s.label}</div>
                <div style={{ fontFamily: FONT, fontSize: 9.5, color: T.inkSoft, lineHeight: 1.2 }}>{s.sub}</div>
              </div>
            </div>
          </FadeUp>
        ))}
      </div>

      <FadeUp delay={infoDelay}>
        <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 400, color: T.inkSoft, margin: "2px 0 0", lineHeight: 1.5, letterSpacing: "0.02em" }}>
          Mein Wirkungsraum
        </p>
      </FadeUp>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// SEKTION: GRUNDPFEILER — 5 Kacheln, einheitlich, mit echten Daten
// ─────────────────────────────────────────────────────────────────
const PILLARS_DEF = [
  {
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    label: "Verbinden", accent: T.teal, bg: T.tealPale, border: "rgba(13,196,181,0.16)",
    detail: "Du baust Brücken und schaffst echte Begegnungen. Jede Verbindung ist eine Tür zu einer neuen Perspektive.",
  },
  {
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
    label: "Unterstützen", accent: T.sage, bg: T.sagePale, border: "rgba(92,168,122,0.18)",
    detail: "Du stärkst andere und gibst Halt, wo er gebraucht wird. Unterstützung ist Anerkennung.",
  },
  {
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
    label: "Erschaffen", accent: T.coral, bg: "rgba(244,115,85,0.06)", border: "rgba(244,115,85,0.15)",
    detail: "Du bringst Ideen in die Welt und schaffst Neues. Jedes Werk ist ein Stück von dir.",
  },
  {
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><circle cx="12" cy="8" r="4"/><path d="M12 2v2m0 8v2m4-6h2M2 8h2m12.95 4.95 1.41 1.41M4.64 4.64l1.41 1.41M19.36 4.64l-1.41 1.41M6.05 12.95l-1.41 1.41"/></svg>,
    label: "Wertschöpfen", accent: T.gold, bg: T.goldPale, border: "rgba(212,149,42,0.18)",
    detail: "Du schaffst echten Wert für Menschen und Projekte. Wertschöpfung ist mehr als Geld.",
  },
  {
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
    label: "Impact", accent: T.purple, bg: T.purplePale, border: "rgba(123,94,167,0.16)",
    detail: "Du hinterlässt Spuren, die die Welt verbessern. Impact zeigt sich in den Menschen, die du berührt hast.",
  },
];

function Pillars({ delay, data, onOpenSub }) {
  // Jeder Grundpfeiler bekommt eine echte Kennzahl
  const pillarData = {
    "Verbinden":   { value: data.followers, sub: "Menschen folgen dir" },
    "Unterstützen":{ value: data.projectsCount, sub: "Projekte unterstützt" },
    "Erschaffen":  { value: data.worksCount, sub: "Werke veröffentlicht" },
    "Wertschöpfen":{ value: `${data.impactEur} €`, sub: "Impact-Wert geschaffen" },
    "Impact":      { value: data.worksCount + data.ordersCount + data.bookingsCount, sub: "Impulse gesät" },
  };

  return (
    <div style={{ padding: "0 0 0 20px" }}>
      <FadeUp delay={delay}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", paddingRight: 20, marginBottom: 14 }}>
          <div style={{ fontFamily: FONT, fontSize: 16, fontWeight: 600, color: T.ink, letterSpacing: "-0.015em" }}>
            Deine Grundpfeiler
          </div>
        </div>
      </FadeUp>
      <div style={{ display: "flex", gap: TILE_GAP, overflowX: "auto", scrollbarWidth: "none", paddingRight: 20, paddingBottom: 4, WebkitOverflowScrolling: "touch" }}>
        {PILLARS_DEF.map((p) => {
          const pd = pillarData[p.label] || {};
          return (
            <Tile
              key={p.label}
              icon={p.icon}
              label={p.label}
              value={data.loading ? "…" : pd.value}
              sub={pd.sub}
              accent={p.accent}
              bg={p.bg}
              border={p.border}
              onClick={() => onOpenSub("pillars", p)}
              delay={delay}
            />
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// SEKTION: REISE — 5 Kacheln, einheitlich, mit echten Daten
// ─────────────────────────────────────────────────────────────────
function Journey({ delay, data, onOpenSub }) {
  const items = [
    {
      icon: "☀️", label: "Heute", accent: T.teal, bg: T.tealPale, border: "rgba(13,196,181,0.16)", subKey: "today",
      value: new Date().toLocaleDateString("de-DE", { day: "numeric", month: "numeric" }),
      sub: new Date().toLocaleDateString("de-DE", { weekday: "long" }),
    },
    {
      icon: "🤝", label: "Diese Woche", accent: T.sage, bg: T.sagePale, border: "rgba(92,168,122,0.18)", subKey: "week",
      value: data.loading ? "…" : `+${data.newConnectionsThisWeek}`,
      sub: "neue Verbindungen",
    },
    {
      icon: "✨", label: "Diesen Monat", accent: T.coral, bg: "rgba(244,115,85,0.06)", border: "rgba(244,115,85,0.15)", subKey: "month",
      value: new Date().toLocaleDateString("de-DE", { month: "long" }),
      sub: `${data.loading ? "…" : data.worksCount + data.ordersCount} Impulse`,
    },
    {
      icon: "🌅", label: "Dieses Jahr", accent: T.gold, bg: T.goldPale, border: "rgba(212,149,42,0.18)", subKey: "year",
      value: new Date().getFullYear(),
      sub: `${data.loading ? "…" : data.worksCount + data.ordersCount + data.bookingsCount} Impulse gesät`,
    },
    {
      icon: "🌳", label: "Seit Beginn", accent: T.purple, bg: T.purplePale, border: "rgba(123,94,167,0.16)", subKey: "beginning",
      value: data.loading ? "…" : `${data.daysSince}`,
      sub: "Tage auf HUI",
    },
  ];

  return (
    <div style={{ padding: "0 20px" }}>
      <FadeUp delay={delay}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ fontFamily: FONT, fontSize: 16, fontWeight: 600, color: T.ink, letterSpacing: "-0.015em" }}>Deine Reise</div>
          <button onClick={() => onOpenSub("journey", null)} style={{ fontFamily: FONT, fontSize: 12.5, color: T.teal, fontWeight: 500, background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 3, opacity: 0.85 }}>
            Reise anzeigen <span style={{ fontSize: 11 }}>›</span>
          </button>
        </div>
      </FadeUp>
      <div style={{ display: "flex", gap: TILE_GAP, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 4, WebkitOverflowScrolling: "touch" }}>
        {items.map((j) => (
          <Tile
            key={j.label}
            icon={j.icon}
            label={j.label}
            value={j.value}
            sub={j.sub}
            accent={j.accent}
            bg={j.bg}
            border={j.border}
            onClick={() => onOpenSub(j.subKey, j)}
            delay={delay}
          />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// SEKTION: IMPACT-MOMENTE — Kacheln mit echten Notifications
// ─────────────────────────────────────────────────────────────────
function ImpactMoments({ delay, data, onOpenSub }) {
  const moments = data.moments.length > 0 ? data.moments : [
    { icon: "🌱", label: "Dein Weg beginnt", time: "heute", color: T.teal, bg: T.tealSoft, border: "rgba(13,196,181,0.13)" },
  ];

  return (
    <div style={{ padding: "0 20px" }}>
      <FadeUp delay={delay}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ fontFamily: FONT, fontSize: 16, fontWeight: 600, color: T.ink, letterSpacing: "-0.015em" }}>Deine Impact-Momente</div>
          <button onClick={() => onOpenSub("moments", null)} style={{ fontFamily: FONT, fontSize: 12.5, color: T.teal, fontWeight: 500, background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 3, opacity: 0.85 }}>
            Mehr anzeigen <span style={{ fontSize: 11 }}>›</span>
          </button>
        </div>
      </FadeUp>
      <div style={{ display: "flex", gap: TILE_GAP, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 4, WebkitOverflowScrolling: "touch" }}>
        {moments.map((m, i) => (
          <Tile
            key={i}
            icon={m.icon}
            label={m.label}
            value={null}
            sub={m.time}
            accent={m.color}
            bg={m.bg}
            border={m.border}
            onClick={() => onOpenSub("moments", m)}
            delay={delay}
          />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// SEKTION: WIRKUNGS-STATS — Grid mit echten Daten
// ─────────────────────────────────────────────────────────────────
function StatsGrid({ delay, data, onOpenSub }) {
  const stats = [
    { label: "Verbindungen", value: data.loading ? "…" : data.followers, sub: "Menschen folgen dir", icon: "👥", color: T.teal, bg: T.tealPale, border: "rgba(13,196,181,0.16)", key: "connections" },
    { label: "Impulse", value: data.loading ? "…" : data.worksCount + data.ordersCount + data.bookingsCount, sub: "Werke, Käufe, Buchungen", icon: "🔥", color: T.coral, bg: "rgba(244,115,85,0.06)", border: "rgba(244,115,85,0.15)", key: "impulses" },
    { label: "Werke", value: data.loading ? "…" : data.worksCount, sub: "veröffentlicht", icon: "✏️", color: T.sage, bg: T.sagePale, border: "rgba(92,168,122,0.18)", key: "works" },
    { label: "Käufe", value: data.loading ? "…" : data.ordersCount, sub: "getätigt", icon: "🛍️", color: T.gold, bg: T.goldPale, border: "rgba(212,149,42,0.18)", key: "orders" },
    { label: "Buchungen", value: data.loading ? "…" : data.bookingsCount, sub: "Talente gebucht", icon: "📅", color: T.purple, bg: T.purplePale, border: "rgba(123,94,167,0.16)", key: "bookings" },
    { label: "Impact", value: data.loading ? "…" : `${data.impactEur} €`, sub: "Wert geschaffen", icon: "🌍", color: T.teal, bg: T.tealPale, border: "rgba(13,196,181,0.16)", key: "impact" },
    { label: "Projekte", value: data.loading ? "…" : data.projectsCount, sub: "unterstützt", icon: "❤️", color: T.coral, bg: "rgba(244,115,85,0.06)", border: "rgba(244,115,85,0.15)", key: "projects" },
    { label: "Profil-Aufrufe", value: data.loading ? "…" : data.profileViews, sub: "gesamt", icon: "👁️", color: T.sage, bg: T.sagePale, border: "rgba(92,168,122,0.18)", key: "views" },
    { label: "Auf HUI seit", value: data.loading ? "…" : `${data.daysSince}`, sub: "Tagen", icon: "🌱", color: T.gold, bg: T.goldPale, border: "rgba(212,149,42,0.18)", key: "beginning" },
  ];

  return (
    <div style={{ padding: "0 20px" }}>
      <FadeUp delay={delay}>
        <div style={{ fontFamily: FONT, fontSize: 16, fontWeight: 600, color: T.ink, letterSpacing: "-0.015em", marginBottom: 14 }}>
          Dein Wirkungsraum
        </div>
      </FadeUp>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(${TILE_W}px, 1fr))`, gap: TILE_GAP }}>
        {stats.map((s, i) => (
          <Tile
            key={i}
            icon={s.icon}
            label={s.label}
            value={s.value}
            sub={s.sub}
            accent={s.color}
            bg={s.bg}
            border={s.border}
            onClick={() => onOpenSub(s.key, s)}
            delay={delay + i * 30}
          />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// SUB-MODAL — Generisches Portal-Modal
// ─────────────────────────────────────────────────────────────────
function SubModal({ title, subtitle, icon, accent, onClose, onMore, children }) {
  return createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: 10600, background: T.cream, display: "flex", flexDirection: "column", animation: "mh-submodal-enter 0.3s ease-in-out" }}>
      <style>{KEYFRAMES}</style>
      <div style={{
        paddingTop: "max(var(--hui-safe-top, 0px), 14px, env(safe-area-inset-top, 14px))",
        padding: "max(var(--hui-safe-top, 0px), 14px, env(safe-area-inset-top, 14px)) 20px 14px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: `1px solid ${T.inkFaint}`, flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: accent + "14", display: "flex", alignItems: "center", justifyContent: "center", color: accent, fontSize: 18 }}>{icon}</div>
          <div>
            <div style={{ fontFamily: FONT, fontSize: 16, fontWeight: 600, color: T.ink, lineHeight: 1.2 }}>{title}</div>
            {subtitle && <div style={{ fontFamily: FONT, fontSize: 12, color: T.inkSoft, lineHeight: 1.2 }}>{subtitle}</div>}
          </div>
        </div>
        <button onClick={onClose} aria-label="Schließen" style={{ width: 36, height: 36, borderRadius: "50%", border: "none", background: T.creamDeep, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: T.inkSoft }}>×</button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", WebkitOverflowScrolling: "touch", paddingBottom: "calc(88px + env(safe-area-inset-bottom, 0px))" }}>
        {children}
      </div>
      {onMore && (
        <div style={{ padding: "14px 20px calc(14px + env(safe-area-inset-bottom, 0px))", borderTop: `1px solid ${T.inkFaint}`, flexShrink: 0 }}>
          <button onClick={onMore} style={{ width: "100%", padding: "14px", borderRadius: 14, background: accent, color: T.white, border: "none", fontFamily: FONT, fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            Mehr anzeigen <span style={{ fontSize: 13 }}>›</span>
          </button>
        </div>
      )}
    </div>,
    document.body
  );
}

// ─────────────────────────────────────────────────────────────────
// SUB-MODAL CONTENTS
// ─────────────────────────────────────────────────────────────────
const detailRow = {
  fontFamily: FONT, fontSize: 14, color: T.inkSoft,
  padding: "8px 0", borderBottom: `1px solid ${T.inkFaint}`,
  display: "flex", justifyContent: "space-between", alignItems: "center",
};

function PillarsDetail({ pillar }) {
  return (
    <div style={{ padding: 20 }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: pillar.bg, display: "flex", alignItems: "center", justifyContent: "center", color: pillar.accent, marginBottom: 16 }}>
        {React.cloneElement(pillar.icon, { width: 32, height: 32 })}
      </div>
      <div style={{ fontFamily: FONT, fontSize: 22, fontWeight: 600, color: pillar.accent, marginBottom: 12 }}>{pillar.label}</div>
      <p style={{ fontFamily: FONT, fontSize: 15, color: T.inkMid, lineHeight: 1.7, marginBottom: 16 }}>{pillar.detail}</p>
      <div style={{ height: 3, borderRadius: 3, background: pillar.accent, width: 40, opacity: 0.5, marginBottom: 20 }} />
    </div>
  );
}

function JourneyDetail({ item, data }) {
  return (
    <div style={{ padding: 20 }}>
      <div style={{ width: 80, height: 80, borderRadius: "50%", margin: "0 auto 16px", background: `linear-gradient(135deg, ${item.color}28 0%, ${item.color}55 100%)`, display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${item.color}38`, boxShadow: `0 4px 16px ${item.color}22` }}>
        <span style={{ fontSize: 32 }}>{item.emoji}</span>
      </div>
      <div style={{ fontFamily: FONT, fontSize: 22, fontWeight: 600, color: item.color, textAlign: "center", marginBottom: 12 }}>{item.label}</div>
      <p style={{ fontFamily: FONT, fontSize: 15, color: T.inkMid, lineHeight: 1.7, textAlign: "center", marginBottom: 20 }}>{item.text}</p>
      <div style={{ background: T.creamCard, borderRadius: 16, padding: 16, border: `1px solid ${item.color}16` }}>
        {item.subKey === "beginning" && (<>
          <div style={detailRow}>Mitglied seit: <b>{data.daysSince} Tagen</b></div>
          <div style={detailRow}>Werke veröffentlicht: <b>{data.worksCount}</b></div>
          <div style={detailRow}>Verbindungen: <b>{data.followers}</b></div>
          <div style={detailRow}>Impact: <b>{data.impactEur} €</b></div>
        </>)}
        {item.subKey === "year" && (<>
          <div style={detailRow}>Jahr: <b>{new Date().getFullYear()}</b></div>
          <div style={detailRow}>Impulse gesät: <b>{data.worksCount + data.ordersCount + data.bookingsCount}</b></div>
          <div style={detailRow}>Projekte unterstützt: <b>{data.projectsCount}</b></div>
        </>)}
        {item.subKey === "month" && (<>
          <div style={detailRow}>Monat: <b>{new Date().toLocaleDateString("de-DE", { month: "long" })}</b></div>
          <div style={detailRow}>Neue Verbindungen: <b>{data.newConnectionsThisWeek}</b></div>
        </>)}
        {item.subKey === "week" && <div style={detailRow}>Neue Verbindungen diese Woche: <b>{data.newConnectionsThisWeek}</b></div>}
        {item.subKey === "today" && <div style={detailRow}>Heute ist: <b>{new Date().toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" })}</b></div>}
      </div>
    </div>
  );
}

function MomentsDetail({ data }) {
  return (
    <div style={{ padding: 20 }}>
      {data.moments.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: T.inkSoft, fontFamily: FONT, fontSize: 14 }}>
          Noch keine Impact-Momente. Dein Weg beginnt jetzt.
        </div>
      ) : (
        data.moments.map((m, i) => (
          <div key={i} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: `1px solid ${T.inkFaint}` }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: m.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{m.icon}</div>
            <div>
              <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 500, color: m.color, lineHeight: 1.3 }}>{m.label}</div>
              <div style={{ fontFamily: FONT, fontSize: 12, color: T.inkFaint, marginTop: 2 }}>{m.time}</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function ConnectionsDetail({ data }) {
  return (
    <div style={{ padding: 20 }}>
      <div style={{ background: T.tealPale, borderRadius: 16, padding: 20, textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>👥</div>
        <div style={{ fontFamily: FONT, fontSize: 32, fontWeight: 700, color: T.teal }}>{data.followers}</div>
        <div style={{ fontFamily: FONT, fontSize: 14, color: T.inkSoft }}>Menschen folgen dir</div>
      </div>
      <div style={detailRow}>Du folgst: <b>{data.following}</b> Menschen</div>
      <div style={detailRow}>Neue diese Woche: <b>{data.newConnectionsThisWeek}</b></div>
      <div style={detailRow}>Profil-Aufrufe: <b>{data.profileViews}</b></div>
    </div>
  );
}

function ImpulsesDetail({ data }) {
  return (
    <div style={{ padding: 20 }}>
      <div style={{ background: "rgba(244,115,85,0.06)", borderRadius: 16, padding: 20, textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🔥</div>
        <div style={{ fontFamily: FONT, fontSize: 32, fontWeight: 700, color: T.coral }}>{data.worksCount + data.ordersCount + data.bookingsCount}</div>
        <div style={{ fontFamily: FONT, fontSize: 14, color: T.inkSoft }}>Impulse gesät</div>
      </div>
      <div style={detailRow}>Werke veröffentlicht: <b>{data.worksCount}</b></div>
      <div style={detailRow}>Käufe getätigt: <b>{data.ordersCount}</b></div>
      <div style={detailRow}>Buchungen getätigt: <b>{data.bookingsCount}</b></div>
      <div style={detailRow}>Projekte unterstützt: <b>{data.projectsCount}</b></div>
    </div>
  );
}

function GenericStatDetail({ item, data }) {
  return (
    <div style={{ padding: 20 }}>
      <div style={{ background: (item.color || T.teal) + "14", borderRadius: 16, padding: 20, textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>{item.icon}</div>
        <div style={{ fontFamily: FONT, fontSize: 28, fontWeight: 700, color: item.color || T.teal }}>{item.value}</div>
        <div style={{ fontFamily: FONT, fontSize: 14, color: T.inkSoft }}>{item.label}{item.sub ? ` · ${item.sub}` : ""}</div>
      </div>
      {(item.key === "beginning") && (<>
        <div style={detailRow}>Mitglied seit: <b>{data.daysSince} Tagen</b></div>
        <div style={detailRow}>Werke: <b>{data.worksCount}</b></div>
        <div style={detailRow}>Verbindungen: <b>{data.followers}</b></div>
        <div style={detailRow}>Impact: <b>{data.impactEur} €</b></div>
      </>)}
      {(item.key === "year") && (<>
        <div style={detailRow}>Impulse gesät: <b>{data.worksCount + data.ordersCount + data.bookingsCount}</b></div>
        <div style={detailRow}>Projekte unterstützt: <b>{data.projectsCount}</b></div>
      </>)}
      {(item.key === "month") && <div style={detailRow}>Neue Verbindungen diese Woche: <b>{data.newConnectionsThisWeek}</b></div>}
      {(item.key === "today") && <div style={detailRow}>Heute: <b>{new Date().toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" })}</b></div>}
      {(item.key === "works") && <div style={detailRow}>Werke veröffentlicht: <b>{data.worksCount}</b></div>}
      {(item.key === "orders") && <div style={detailRow}>Käufe getätigt: <b>{data.ordersCount}</b></div>}
      {(item.key === "bookings") && <div style={detailRow}>Buchungen getätigt: <b>{data.bookingsCount}</b></div>}
      {(item.key === "impact") && <div style={detailRow}>Impact-Wert: <b>{data.impactEur} €</b></div>}
      {(item.key === "projects") && <div style={detailRow}>Projekte unterstützt: <b>{data.projectsCount}</b></div>}
      {(item.key === "views") && <div style={detailRow}>Profil-Aufrufe: <b>{data.profileViews}</b></div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// SUB-MODAL CONFIG
// ─────────────────────────────────────────────────────────────────
const SUB_MODAL_CONFIG = {
  pillars:     { title: "Grundpfeiler",       icon: "🏛️", accent: T.teal,   page: null },
  journey:     { title: "Reise",              icon: "🧭", accent: T.sage,   page: null },
  moments:     { title: "Impact-Momente",     icon: "✨", accent: T.purple, page: null },
  connections: { title: "Verbindungen",        icon: "👥", accent: T.teal,   page: "discover" },
  impulses:    { title: "Impulse",            icon: "🔥", accent: T.coral,  page: null },
  works:       { title: "Werke",              icon: "✏️", accent: T.sage,   page: "profile" },
  orders:      { title: "Käufe",              icon: "🛍️", accent: T.gold,   page: null },
  bookings:    { title: "Buchungen",           icon: "📅", accent: T.purple, page: null },
  impact:      { title: "Impact",             icon: "🌍", accent: T.teal,   page: "impact" },
  projects:    { title: "Projekte",            icon: "❤️", accent: T.coral,  page: "impact" },
  views:       { title: "Profil-Aufrufe",      icon: "👁️", accent: T.sage,   page: "profile" },
  beginning:   { title: "Seit Beginn",         icon: "🌱", accent: T.gold,   page: null },
  year:        { title: "Dieses Jahr",         icon: "🌅", accent: T.gold,   page: null },
  month:       { title: "Diesen Monat",        icon: "✨", accent: T.purple, page: null },
  today:       { title: "Heute",               icon: "☀️", accent: T.teal,   page: null },
  week:        { title: "Diese Woche",         icon: "🤝", accent: T.sage,   page: null },
};

// ─────────────────────────────────────────────────────────────────
// SHELL — MeinHUI v7.0
// ─────────────────────────────────────────────────────────────────
export default function MeinHUI({ visible = true, closing = false, profile = null, onClose, onNotif, onSettings }) {
  const scrollRef = useRef(null);
  const [entered, setEntered] = useState(false);
  const [subModal, setSubModal] = useState(null);
  const actions = useHuiActions();
  const wirkData = useWirkungsraumData(profile);

  useEffect(() => {
    if (visible) {
      setEntered(false);
      setSubModal(null);
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
      const raf1 = requestAnimationFrame(() => { requestAnimationFrame(() => setEntered(true)); });
      return () => cancelAnimationFrame(raf1);
    } else {
      setEntered(false);
      setSubModal(null);
    }
  }, [visible]);

  const handleOpenSub = useCallback((key, item) => { setSubModal({ key, item }); }, []);
  const handleCloseSub = useCallback(() => { setSubModal(null); }, []);

  const handleSubMore = useCallback((pageKey) => {
    if (pageKey === "discover") actions[A.GO_TO_TAB]?.({ tab: "discover" });
    else if (pageKey === "impact") actions[A.GO_IMPACT]?.();
    else if (pageKey === "profile") actions[A.OPEN_OWN_PROFILE]?.();
    setSubModal(null);
    onClose?.();
  }, [actions, onClose]);

  if (!visible) return null;

  const screenStyle = {
    position: "fixed", inset: 0, background: T.cream, zIndex: 10500,
    overflowY: "auto", overflowX: "hidden", WebkitOverflowScrolling: "touch", overscrollBehavior: "contain",
    opacity: closing ? 0 : (entered ? 1 : 0),
    transform: closing ? "translateY(10px)" : (entered ? "translateY(0)" : "translateY(10px)"),
    transition: closing
      ? `opacity ${CLOSE_SCREEN_MS}ms ${EASE} ${CLOSE_CONTENT_MS}ms, transform ${CLOSE_SCREEN_MS}ms ${EASE} ${CLOSE_CONTENT_MS}ms`
      : `opacity 300ms ${EASE}, transform 300ms ${EASE}`,
  };

  const contentGroupStyle = closing
    ? { opacity: 0, transform: "translateY(8px)", transition: `opacity ${CLOSE_CONTENT_MS}ms ${EASE}, transform ${CLOSE_CONTENT_MS}ms ${EASE}` }
    : {};

  // Sub-modal rendering
  let subModalContent = null;
  if (subModal) {
    const cfg = SUB_MODAL_CONFIG[subModal.key];
    if (cfg) {
      const item = subModal.item;
      let content = null;
      let morePage = cfg.page;

      switch (subModal.key) {
        case "pillars": content = <PillarsDetail pillar={item} />; morePage = null; break;
        case "journey":
          if (item) { content = <JourneyDetail item={item} data={wirkData} />; }
          else {
            content = (
              <div style={{ padding: 20 }}>
                <p style={{ fontFamily: FONT, fontSize: 15, color: T.inkMid, lineHeight: 1.7, marginBottom: 16 }}>
                  Deine Reise bei HUI zeigt, wie sich deine Wirkung über Zeit entwickelt.
                </p>
                <div style={detailRow}>Tage seit Beginn: <b>{wirkData.daysSince}</b></div>
                <div style={detailRow}>Werke: <b>{wirkData.worksCount}</b></div>
                <div style={detailRow}>Verbindungen: <b>{wirkData.followers}</b></div>
                <div style={detailRow}>Impulse: <b>{wirkData.worksCount + wirkData.ordersCount + wirkData.bookingsCount}</b></div>
              </div>
            );
          }
          break;
        case "moments": content = <MomentsDetail data={wirkData} />; morePage = null; break;
        case "connections": content = <ConnectionsDetail data={wirkData} />; break;
        case "impulses": content = <ImpulsesDetail data={wirkData} />; break;
        case "works": case "orders": case "bookings": case "impact": case "projects": case "views":
        case "beginning": case "year": case "month": case "today": case "week":
          content = item ? <GenericStatDetail item={item} data={wirkData} /> : null;
          break;
      }

      subModalContent = (
        <SubModal title={cfg.title} icon={cfg.icon} accent={cfg.accent} onClose={handleCloseSub} onMore={morePage ? () => handleSubMore(morePage) : null}>
          {content}
        </SubModal>
      );
    }
  }

  return (
    <>
      <style>{KEYFRAMES}</style>
      <div ref={scrollRef} style={screenStyle}>
        <div style={{
          paddingTop: "max(var(--hui-safe-top, 0px), 14px, env(safe-area-inset-top, 14px))",
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 120px)",
          ...contentGroupStyle,
        }}>
          <ProfileHeader profile={profile} onClose={onClose} delay={TITLE_DELAY} />
          <OrbHero data={wirkData} coreDelay={CORE_DELAY} infoDelay={INFO_DELAY} />
          <div style={{ width: 28, height: 1, background: T.inkFaint, margin: "6px auto 26px", opacity: 0.35 }} />

          <Pillars delay={PILLARS_DELAY} data={wirkData} onOpenSub={handleOpenSub} />
          <div style={{ height: 30 }} />

          <Journey delay={JOURNEY_DELAY} data={wirkData} onOpenSub={handleOpenSub} />
          <div style={{ height: 30 }} />

          <ImpactMoments delay={MOMENTS_DELAY} data={wirkData} onOpenSub={handleOpenSub} />
          <div style={{ height: 30 }} />

          <StatsGrid delay={STATS_DELAY} data={wirkData} onOpenSub={handleOpenSub} />
          <div style={{ height: 12 }} />
          <p style={{ opacity: 0.6, fontSize: 12, marginTop: 20, textAlign: "center", fontFamily: FONT }}>Version {APP_VERSION}</p>
        </div>
      </div>
      {subModalContent}
    </>
  );
}
