// src/pages/MeinHUI.jsx — HUI Wirkungsraum v6.0 (Mein Wirkungsraum)
// ═══════════════════════════════════════════════════════════════════
// ZIEL: Der Orb öffnet "Mein Wirkungsraum" — persönliche Zusammenfassung
// mit echten Daten aus Supabase. Jede Kategorie hat ein Sub-Modal mit
// "Mehr anzeigen" → richtige Seite.
//
// ZINDEX: 10500 (createPortal auf document.body) — PFLICHT nach footer-navbar-regel
// ═══════════════════════════════════════════════════════════════════

import React, { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../lib/supabaseClient.js";
import { APP_VERSION } from "../version";
import { optimizeAvatar } from "../lib/perfUtils.js";
import { useHuiActions, A } from "../core/hui.actions.js";

// ─────────────────────────────────────────────────────────────────
// DESIGN TOKENS (gleiche wie v5.0)
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

// ── Choreografie: 70ms Abstand pro Block ──
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
@keyframes mh-particle-a {
  0%, 100% { transform: translate(0,0) rotate(0deg); opacity: 0; }
  15%       { opacity: 0.55; }
  85%       { opacity: 0.35; }
  100%      { transform: translate(var(--px), var(--py)) rotate(var(--pr)); opacity: 0; }
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
          .from("works")
          .select("id", { count: "exact", head: true })
          .eq("author_id", uid)
          .eq("status", "published");

        // 4. Orders count (Käufe)
        const { count: ordersCount } = await supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("buyer_id", uid)
          .eq("payment_status", "paid");

        // 5. Talent bookings count
        const { count: bookingsCount } = await supabase
          .from("talent_bookings")
          .select("id", { count: "exact", head: true })
          .eq("buyer_id", uid)
          .eq("payment_status", "paid");

        // 6. Neue Verbindungen diese Woche
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const { count: newConnectionsThisWeek } = await supabase
          .from("follows")
          .select("id", { count: "exact", head: true })
          .eq("followed_id", uid)
          .gte("created_at", weekAgo.toISOString());

        // 7. Impact projects
        const { count: projectsCount } = await supabase
          .from("impact_applications")
          .select("id", { count: "exact", head: true })
          .eq("applicant_id", uid)
          .eq("status", "approved");

        // 8. Impact-Momente aus notifications (letzte 10)
        const { data: notifs } = await supabase
          .from("notifications")
          .select("type, metadata, created_at, is_read")
          .eq("user_id", uid)
          .order("created_at", { ascending: false })
          .limit(20);

        // 9. Impact EUR
        const impactEur = profile.impact_eur || 0;

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

            let icon = "♡", label = "", color = T.coral, bg = "rgba(244,115,85,0.07)", border = "rgba(244,115,85,0.13)";
            switch (n.type) {
              case "new_order":
                icon = "🛍️"; label = `Du hast verkauft: ${md.item_titles || "Werk"}`;
                color = T.sage; bg = T.sageSoft; border = "rgba(92,168,122,0.13)";
                break;
              case "order_confirmed":
                icon = "✅"; label = `Beleg erstellt: ${md.item_titles || "Werk"}`;
                color = T.teal; bg = T.tealSoft; border = "rgba(13,196,181,0.13)";
                break;
              case "talent_booking_paid":
                icon = "📅"; label = `Buchung bestätigt: ${md.offer_title || "Talent"}`;
                color = T.gold; bg = T.goldSoft; border = "rgba(212,149,42,0.13)";
                break;
              case "new_follower":
              case "new_connection":
                icon = "👥"; label = `Neue Verbindung: ${md.follower_name || "Nutzer"}`;
                color = T.teal; bg = T.tealSoft; border = "rgba(13,196,181,0.13)";
                break;
              case "work_published":
                icon = "✏️"; label = `Du hast ein Werk veröffentlicht`;
                color = T.sage; bg = T.sageSoft; border = "rgba(92,168,122,0.13)";
                break;
              case "impact_project_completed":
                icon = "🌍"; label = `Projekt finanziert: ${md.project_name || "Impact"}`;
                color = T.purple; bg = T.purpleSoft; border = "rgba(123,94,167,0.13)";
                break;
              case "comment":
                icon = "💬"; label = `Kommentar von ${md.commenter_name || "Nutzer"}`;
                color = T.teal; bg = T.tealSoft; border = "rgba(13,196,181,0.13)";
                break;
              case "inspire":
                icon = "✨"; label = `Jemand wurde inspiriert durch dich`;
                color = T.gold; bg = T.goldSoft; border = "rgba(212,149,42,0.13)";
                break;
              default:
                icon = "♡"; label = n.type || "Aktivität";
            }
            return { icon, label, time: timeStr, color, bg, border };
          });

        if (!cancelled) {
          setData({
            loading: false,
            daysSince,
            followers: fc?.[0]?.followers ?? profile.followers_count ?? 0,
            following: fc?.[0]?.following ?? 0,
            worksCount: worksCount || 0,
            ordersCount: ordersCount || 0,
            bookingsCount: bookingsCount || 0,
            impactEur,
            moments,
            newConnectionsThisWeek: newConnectionsThisWeek || 0,
            projectsCount: projectsCount || 0,
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
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "6px 20px 0",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img
            src={avatarUrl || "/assets/brand/hui-logo.png"}
            alt=""
            style={{
              width: 42, height: 42, borderRadius: "50%",
              objectFit: "cover", background: T.creamDeep,
            }}
          />
          <div>
            <div style={{ fontFamily: FONT, fontSize: 15, fontWeight: 600, color: T.ink, lineHeight: 1.2 }}>
              {name}
            </div>
            <div style={{ fontFamily: FONT, fontSize: 12, color: T.inkSoft, lineHeight: 1.2 }}>
              Willkommen zurück
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Schließen"
          style={{
            width: 36, height: 36, borderRadius: "50%",
            border: "none", background: T.creamDeep, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, color: T.inkSoft,
          }}
        >
          ×
        </button>
      </div>
    </FadeUp>
  );
}

// ─────────────────────────────────────────────────────────────────
// ORB HERO (zentraler Orb mit Atmosphäre)
// ─────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────
// AMBIENT LEAVES — dekorative Partikel um den Orb
// ─────────────────────────────────────────────────────────────────
const LEAVES = [
  { size: 5, col: T.sage,  "--px": "-28px", "--py": "-38px", "--pr": "-22deg", dur: "8.5s", del: "0s"   },
  { size: 4, col: T.teal,  "--px": "26px",  "--py": "-32px", "--pr": "18deg",  dur: "9.8s", del: "2.1s" },
  { size: 6, col: T.gold,  "--px": "-20px", "--py": "30px",  "--pr": "-12deg", dur: "7.9s", del: "1.3s" },
  { size: 3, col: T.sage,  "--px": "22px",  "--py": "26px",  "--pr": "15deg",  dur: "10.2s","del": "3.4s"},
];

// ─────────────────────────────────────────────────────────────────
// ORB HERO — zentraler Orb mit Atmosphäre (Original-Layout, echte Daten)
// ─────────────────────────────────────────────────────────────────
function OrbHero({ data, coreDelay, infoDelay }) {
  return (
    <div style={{ position: "relative", textAlign: "center", padding: "24px 0 16px" }}>

      {/* Block 1 — Orb */}
      <FadeUp delay={coreDelay} style={{ position: "relative" }}>

        {/* Atmosphärische Hintergrundstrahlung */}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          width: 340, height: 340, marginTop: -170, marginLeft: -170,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,190,70,0.07) 0%, rgba(13,196,181,0.05) 45%, transparent 72%)",
          animation: "mh-atm-outer 9s ease-in-out infinite",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          width: 240, height: 240, marginTop: -120, marginLeft: -120,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,205,80,0.16) 0%, rgba(244,115,85,0.10) 40%, rgba(13,196,181,0.04) 70%, transparent 100%)",
          animation: "mh-atm-mid 7s ease-in-out 0.8s infinite",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          width: 150, height: 150, marginTop: -75, marginLeft: -75,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,255,255,0.92) 0%, rgba(255,215,90,0.30) 50%, transparent 100%)",
          animation: "mh-atm-core 5s ease-in-out 0.3s infinite",
          pointerEvents: "none",
        }} />

        {/* Resonanzwellen */}
        {[{ del: "0s" }, { del: "3.5s" }].map((w, i) => (
          <div key={i} style={{
            position: "absolute", top: "50%", left: "50%",
            width: 180, height: 180, marginTop: -90, marginLeft: -90,
            borderRadius: "50%",
            border: "1px solid rgba(13,196,181,0.18)",
            animation: `mh-resonance 7s ease-out ${w.del} infinite`,
            pointerEvents: "none",
          }} />
        ))}

        <div style={{
          position: "absolute", top: "50%", left: "50%",
          width: 210, height: 210, marginTop: -105, marginLeft: -105,
          borderRadius: "50%",
          border: "1px solid rgba(212,149,42,0.12)",
          pointerEvents: "none",
        }} />

        {/* Ambient-Blätter */}
        {LEAVES.map((l, i) => (
          <div key={i} style={{
            position: "absolute", top: "50%", left: "50%",
            marginTop: -l.size/2, marginLeft: -l.size/2,
            width: l.size, height: l.size,
            borderRadius: "50% 0 50% 0",
            background: l.col, opacity: 0,
            "--px": l["--px"], "--py": l["--py"], "--pr": l["--pr"],
            animation: `mh-particle-a ${l.dur} ease-in-out ${l.del} infinite`,
            pointerEvents: "none",
          }} />
        ))}

        {/* Das HUI-Logo — freistehend, großer Orb wie im Original */}
        <div style={{
          position: "relative", zIndex: 3,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 190, height: 190,
        }}>
          <div style={{
            animation: "mh-orb-breathe 8s ease-in-out infinite",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <img
              src="/assets/brand/hui-logo.png"
              alt="HUI"
              style={{
                width: 168, height: 168,
                objectFit: "contain", display: "block",
                userSelect: "none", pointerEvents: "none",
              }}
              draggable={false}
            />
          </div>
        </div>
      </FadeUp>

      {/* Block 3 — Info-Karten links + rechts, echte Daten */}
      <FadeUp delay={infoDelay} style={{
        position: "absolute",
        left: 16, top: "50%", transform: "translateY(-50%)",
        zIndex: 2, maxWidth: 115, textAlign: "left",
      }}>
        <p style={{
          fontFamily: FONT, fontSize: 12.5, fontWeight: 400,
          lineHeight: 1.6, color: T.inkSoft, margin: "0 0 14px",
          letterSpacing: "0.005em",
        }}>
          Dein Blatt wächst durch das, was du für andere bewirkst.
        </p>
        <div style={{ color: T.coral, fontSize: 15, opacity: 0.75 }}>♡</div>
      </FadeUp>

      <div style={{
        position: "absolute", right: 14, top: "50%",
        transform: "translateY(-50%)",
        display: "flex", flexDirection: "column", gap: 8,
        zIndex: 2,
      }}>
        {[
          { icon: "🌱", label: "Deine Reise", sub: data.loading ? "…" : `seit ${data.daysSince} Tagen`, glow: T.sageSoft },
          { icon: "🔥", label: "Impact gesät", sub: data.loading ? "…" : `${data.worksCount + data.ordersCount + data.bookingsCount} Impulse`, glow: "rgba(244,115,85,0.08)" },
          { icon: "👥", label: "Verbindungen", sub: data.loading ? "…" : `${data.followers} Menschen`, glow: T.tealSoft },
        ].map((s, i) => (
          <FadeUp key={i} delay={infoDelay}>
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "rgba(253,251,248,0.82)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              borderRadius: 13,
              padding: "6px 10px",
              boxShadow: `0 2px 10px ${s.glow}, 0 1px 3px rgba(0,0,0,0.05)`,
              border: "1px solid rgba(255,255,255,0.90)",
              minWidth: 0,
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

      {/* Tagline unter Orb — Teil des Info-Karten-Blocks, KEINE Überlappung
          da Orb (190px inline-flow) genug Höhe reserviert */}
      <FadeUp delay={infoDelay}>
        <p style={{
          fontFamily: FONT, fontSize: 13, fontWeight: 400,
          color: T.inkSoft, margin: "2px 0 0", lineHeight: 1.5,
          letterSpacing: "0.02em",
        }}>
          Mein Wirkungsraum
        </p>
      </FadeUp>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// GRUNDPFEILER
// ─────────────────────────────────────────────────────────────────
const PILLARS = [
  {
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    label: "Verbinden",
    text: "Du baust Brücken und schaffst echte Begegnungen.",
    accent: T.teal, bg: T.tealPale, border: "rgba(13,196,181,0.16)", glow: "rgba(13,196,181,0.14)",
    detail: "Du baust Brücken und schaffst echte Begegnungen. Jede Verbindung ist eine Tür zu einer neuen Perspektive. Menschen, die du triffst, bereichern deinen Weg und du bereicherst ihren.",
  },
  {
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
    label: "Unterstützen",
    text: "Du stärkst andere und gibst Halt, wo er gebraucht wird.",
    accent: T.sage, bg: T.sagePale, border: "rgba(92,168,122,0.18)", glow: "rgba(92,168,122,0.14)",
    detail: "Du stärkst andere und gibst Halt, wo er gebraucht wird. Unterstützung ist nicht nur Hilfe — sie ist Anerkennung. Wenn du anderen Halt gibst, wächst auch deine eigene Kraft.",
  },
  {
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
    label: "Erschaffen",
    text: "Du bringst Ideen in die Welt und schaffst Neues.",
    accent: T.coral, bg: "rgba(244,115,85,0.06)", border: "rgba(244,115,85,0.15)", glow: "rgba(244,115,85,0.12)",
    detail: "Du bringst Ideen in die Welt und schaffst Neues. Ersaffen bedeutet, etwas sichtbar zu machen, das vorher unsichtbar war. Jedes Werk ist ein Stück von dir, das weiterlebt.",
  },
  {
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><circle cx="12" cy="8" r="4"/><path d="M12 2v2m0 8v2m4-6h2M2 8h2m12.95 4.95 1.41 1.41M4.64 4.64l1.41 1.41M19.36 4.64l-1.41 1.41M6.05 12.95l-1.41 1.41"/></svg>,
    label: "Wertschöpfen",
    text: "Du schaffst echten Wert für Menschen und Projekte.",
    accent: T.gold, bg: T.goldPale, border: "rgba(212,149,42,0.18)", glow: "rgba(212,149,42,0.12)",
    detail: "Du schaffst echten Wert für Menschen und Projekte. Wertschöpfung ist mehr als Geld — es ist die Wirkung, die entsteht, wenn du deine Fähigkeiten für andere einsetzt.",
  },
  {
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
    label: "Impact",
    text: "Du hinterlässt Spuren, die die Welt verbessern.",
    accent: T.purple, bg: T.purplePale, border: "rgba(123,94,167,0.16)", glow: "rgba(123,94,167,0.12)",
    detail: "Du hinterlässt Spuren, die die Welt verbessern. Impact ist nicht messbar in Zahlen allein — er zeigt sich in den Menschen, die du berührt hast.",
  },
];

// Feste einheitliche Höhe für alle Grundpfeiler-Kacheln (unabhängig von Textlänge)
const PILLAR_CARD_HEIGHT = 182;

function PillarCard({ pillar, index, baseDelay, onClick }) {
  const [active, setActive] = useState(false);
  return (
    <FadeUp delay={baseDelay} style={{ height: "100%" }}>
      <div
        onClick={onClick}
        onPointerDown={() => setActive(true)}
        onPointerUp={() => setActive(false)}
        onPointerLeave={() => setActive(false)}
        style={{
          width: 126, height: PILLAR_CARD_HEIGHT, flexShrink: 0,
          display: "flex", flexDirection: "column",
          background: active ? T.creamCard : pillar.bg,
          border: `1px solid ${active ? pillar.accent + "40" : pillar.border}`,
          borderRadius: 18, padding: "15px 13px 13px",
          cursor: "pointer", userSelect: "none",
          transition: "transform 0.22s ease-in-out, box-shadow 0.22s ease-in-out, background 0.18s ease, border-color 0.18s ease",
          transform: active ? "translateY(-3px) scale(1.01)" : "translateY(0) scale(1)",
          boxShadow: active ? `0 8px 24px ${pillar.glow}, 0 2px 8px rgba(0,0,0,0.06)` : `0 1px 4px rgba(0,0,0,0.04)`,
        }}
      >
        <div style={{
          width: 38, height: 38, borderRadius: "50%",
          background: active ? pillar.bg : T.white,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: pillar.accent, marginBottom: 10,
          boxShadow: active ? `0 2px 10px ${pillar.glow}` : "0 1px 4px rgba(0,0,0,0.06)",
          transition: "box-shadow 0.22s ease, background 0.18s ease", flexShrink: 0,
        }}>
          {pillar.icon}
        </div>
        <div style={{
          fontFamily: FONT, fontSize: 13.5, fontWeight: 600,
          color: pillar.accent, marginBottom: 5, lineHeight: 1.2, letterSpacing: "-0.01em",
          flexShrink: 0,
        }}>
          {pillar.label}
        </div>
        <div style={{
          fontFamily: FONT, fontSize: 11.5, fontWeight: 400, color: T.inkSoft, lineHeight: 1.5,
          flex: 1, overflow: "hidden",
          display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical",
        }}>
          {pillar.text}
        </div>
        <div style={{
          height: 2, borderRadius: 2, marginTop: "auto",
          background: pillar.accent,
          width: active ? 32 : 20, opacity: active ? 0.7 : 0.4,
          transition: "width 0.25s ease-in-out, opacity 0.22s ease",
          flexShrink: 0,
        }} />
      </div>
    </FadeUp>
  );
}

function Pillars({ delay, onOpenSub }) {
  return (
    <div style={{ padding: "0 0 0 20px" }}>
      <FadeUp delay={delay}>
        <div style={{
          display: "flex", alignItems: "baseline", justifyContent: "space-between",
          paddingRight: 20, marginBottom: 14,
        }}>
          <div style={{ fontFamily: FONT, fontSize: 16, fontWeight: 600, color: T.ink, letterSpacing: "-0.015em" }}>
            Deine Grundpfeiler
          </div>
        </div>
      </FadeUp>
      <div style={{
        display: "flex", gap: 9, overflowX: "auto", scrollbarWidth: "none",
        paddingRight: 20, paddingBottom: 4, WebkitOverflowScrolling: "touch",
      }}>
        {PILLARS.map((p, i) => (
          <PillarCard key={p.label} pillar={p} index={i} baseDelay={delay}
            onClick={() => onOpenSub("pillars", p)}
          />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// REISE (Journey)
// ─────────────────────────────────────────────────────────────────
function Journey({ delay, data, onOpenSub }) {
  const items = [
    { emoji: "🌱", label: "Heute",        text: "Kleine Impulse setzen Großes in Gang.",           color: T.teal,   subKey: "today" },
    { emoji: "🤝", label: "Diese Woche",  text: `Du hast ${data.newConnectionsThisWeek} neue Verbindungen.`, color: T.sage, subKey: "week" },
    { emoji: "✨", label: "Diesen Monat", text: "Ein Projekt, das dir am Herzen liegt, wächst.",   color: T.coral,  subKey: "month" },
    { emoji: "🌅", label: "Dieses Jahr",  text: "Deine Wirkung erreicht immer mehr Menschen.",    color: T.gold,   subKey: "year" },
    { emoji: "🌳", label: "Seit Beginn",  text: `Dein Weg ist einzigartig und wertvoll.`,          color: T.purple, subKey: "beginning" },
  ];
  return (
    <div style={{ padding: "0 20px" }}>
      <FadeUp delay={delay}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14,
        }}>
          <div style={{ fontFamily: FONT, fontSize: 16, fontWeight: 600, color: T.ink, letterSpacing: "-0.015em" }}>
            Deine Reise
          </div>
          <button onClick={() => onOpenSub("journey", null)}
            style={{
            fontFamily: FONT, fontSize: 12.5, color: T.teal, fontWeight: 500,
            background: "none", border: "none", cursor: "pointer", padding: 0,
            display: "flex", alignItems: "center", gap: 3, opacity: 0.85,
          }}>
            Reise anzeigen <span style={{ fontSize: 11 }}>›</span>
          </button>
        </div>
      </FadeUp>
      <div style={{
        display: "flex", gap: 18, overflowX: "auto",
        scrollbarWidth: "none", paddingBottom: 4, WebkitOverflowScrolling: "touch",
      }}>
        {items.map((j) => (
          <FadeUp key={j.label} delay={delay}>
            <div onClick={() => onOpenSub(j.subKey, j)}
              style={{ width: 106, flexShrink: 0, textAlign: "center", cursor: "pointer" }}>
              <div style={{
                width: 68, height: 68, borderRadius: "50%", margin: "0 auto 9px",
                background: `linear-gradient(135deg, ${j.color}28 0%, ${j.color}55 100%)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                border: `1.5px solid ${j.color}38`,
                boxShadow: `0 3px 12px ${j.color}22`,
              }}>
                <span style={{ fontSize: 24 }}>{j.emoji}</span>
              </div>
              <div style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: T.ink, marginBottom: 4, lineHeight: 1.2 }}>
                {j.label}
              </div>
              <div style={{ fontFamily: FONT, fontSize: 11, color: T.inkSoft, lineHeight: 1.45 }}>
                {j.text}
              </div>
            </div>
          </FadeUp>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// IMPACT-MOMENTE
// ─────────────────────────────────────────────────────────────────
function ImpactMoments({ delay, data, onOpenSub }) {
  const moments = data.moments.length > 0 ? data.moments : [
    { icon: "🌱", label: "Dein Weg beginnt", time: "heute", color: T.teal, bg: T.tealSoft, border: "rgba(13,196,181,0.13)" },
  ];
  // Nur scrollbar machen, wenn tatsächlich genug Kacheln vorhanden sind, um zu scrollen.
  // Sonst wirkt die Zeile bei 1-2 Kacheln wie ein "loser" Scroller ohne Zweck -> verankert/fixiert.
  const scrollable = moments.length > 2;
  return (
    <div style={{ padding: "0 20px" }}>
      <FadeUp delay={delay}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14,
        }}>
          <div style={{ fontFamily: FONT, fontSize: 16, fontWeight: 600, color: T.ink, letterSpacing: "-0.015em" }}>
            Deine Impact-Momente
          </div>
          <button onClick={() => onOpenSub("moments", null)}
            style={{
            fontFamily: FONT, fontSize: 12.5, color: T.teal, fontWeight: 500,
            background: "none", border: "none", cursor: "pointer", padding: 0,
            display: "flex", alignItems: "center", gap: 3, opacity: 0.85,
          }}>
            Mehr anzeigen <span style={{ fontSize: 11 }}>›</span>
          </button>
        </div>
      </FadeUp>
      <div style={{
        display: "flex", gap: 9,
        overflowX: scrollable ? "auto" : "hidden",
        scrollbarWidth: "none", paddingBottom: 4,
        WebkitOverflowScrolling: scrollable ? "touch" : "auto",
        touchAction: scrollable ? "auto" : "pan-y",
      }}>
        {moments.map((m, i) => (
          <FadeUp key={i} delay={delay}>
            <div onClick={() => onOpenSub("moments", m)}
              style={{
              width: 138, flexShrink: 0,
              background: m.bg, border: `1px solid ${m.border}`,
              borderRadius: 16, padding: "13px 13px 11px", cursor: "pointer",
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: T.white, display: "flex",
                alignItems: "center", justifyContent: "center",
                fontSize: 15, marginBottom: 9,
                boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
              }}>
                {m.icon}
              </div>
              <div style={{ fontFamily: FONT, fontSize: 11.5, fontWeight: 600, color: m.color, lineHeight: 1.35, marginBottom: 4 }}>
                {m.label}
              </div>
              <div style={{ fontFamily: FONT, fontSize: 10.5, color: T.inkFaint }}>
                {m.time}
              </div>
            </div>
          </FadeUp>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// STATS GRID — Verbindungen / Impulse / Zeit-Räume
// ─────────────────────────────────────────────────────────────────
// Feste einheitliche Höhe für alle Wirkungsraum-Kacheln (unabhängig von Textlänge)
const STATS_CARD_HEIGHT = 118;

function StatsGrid({ delay, data, onOpenSub }) {
  const stats = [
    { label: "Verbindungen", value: data.followers, sub: "Menschen", icon: "👥", color: T.teal, bg: T.tealPale, key: "connections" },
    { label: "Impulse", value: data.worksCount + data.ordersCount + data.bookingsCount, sub: "gesät", icon: "🔥", color: T.coral, bg: "rgba(244,115,85,0.06)", key: "impulses" },
    { label: "Seit Beginn", value: data.daysSince, sub: "Tage", icon: "🌱", color: T.sage, bg: T.sagePale, key: "beginning" },
    { label: "Dieses Jahr", value: new Date().getFullYear(), sub: "Jahr", icon: "🌅", color: T.gold, bg: T.goldPale, key: "year" },
    { label: "Diesen Monat", value: new Date().toLocaleDateString("de-DE", { month: "long" }), sub: "", icon: "✨", color: T.purple, bg: T.purplePale, key: "month" },
    { label: "Heute", value: new Date().toLocaleDateString("de-DE", { day: "numeric", month: "numeric" }), sub: "", icon: "☀️", color: T.teal, bg: T.tealPale, key: "today" },
  ];

  return (
    <div style={{ padding: "0 20px" }}>
      <FadeUp delay={delay}>
        <div style={{
          fontFamily: FONT, fontSize: 16, fontWeight: 600, color: T.ink,
          letterSpacing: "-0.015em", marginBottom: 14,
        }}>
          Dein Wirkungsraum
        </div>
      </FadeUp>
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 9,
      }}>
        {stats.map((s, i) => (
          <FadeUp key={i} delay={delay + i * 35} style={{ height: "100%" }}>
            <div onClick={() => onOpenSub(s.key, s)}
              style={{
              height: STATS_CARD_HEIGHT,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              background: s.bg, borderRadius: 16, padding: "14px 10px 12px",
              textAlign: "center", cursor: "pointer",
              border: `1px solid ${s.color}22`,
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}
              onPointerDown={(e) => e.currentTarget.style.transform = "scale(0.96)"}
              onPointerUp={(e) => e.currentTarget.style.transform = "scale(1)"}
              onPointerLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
            >
              <div style={{ fontSize: 18, marginBottom: 4, flexShrink: 0 }}>{s.icon}</div>
              <div style={{ fontFamily: FONT, fontSize: 18, fontWeight: 700, color: s.color, lineHeight: 1.1, flexShrink: 0 }}>
                {s.value}
              </div>
              <div style={{
                fontFamily: FONT, fontSize: 10, fontWeight: 500, color: T.inkSoft, marginTop: 2,
                display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
              }}>
                {s.label}{s.sub ? ` · ${s.sub}` : ""}
              </div>
            </div>
          </FadeUp>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// SUB-MODAL — Generisches Portal-Modal für alle Kategorien
// ─────────────────────────────────────────────────────────────────
function SubModal({ title, subtitle, icon, accent, onClose, onMore, children }) {
  return createPortal(
    <div style={{
      position: "fixed", inset: 0, zIndex: 10600,
      background: T.cream,
      display: "flex", flexDirection: "column",
      animation: "mh-submodal-enter 0.3s ease-in-out",
    }}>
      <style>{KEYFRAMES}</style>
      {/* Header */}
      <div style={{
        paddingTop: "max(var(--hui-safe-top, 0px), 14px, env(safe-area-inset-top, 14px))",
        padding: "max(var(--hui-safe-top, 0px), 14px, env(safe-area-inset-top, 14px)) 20px 14px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: `1px solid ${T.inkFaint}`,
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: accent + "14",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: accent, fontSize: 18,
          }}>
            {icon}
          </div>
          <div>
            <div style={{ fontFamily: FONT, fontSize: 16, fontWeight: 600, color: T.ink, lineHeight: 1.2 }}>
              {title}
            </div>
            {subtitle && (
              <div style={{ fontFamily: FONT, fontSize: 12, color: T.inkSoft, lineHeight: 1.2 }}>
                {subtitle}
              </div>
            )}
          </div>
        </div>
        <button onClick={onClose}
          aria-label="Schließen"
          style={{
            width: 36, height: 36, borderRadius: "50%",
            border: "none", background: T.creamDeep, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, color: T.inkSoft,
          }}>
          ×
        </button>
      </div>

      {/* Content */}
      <div style={{
        flex: 1, overflowY: "auto", overflowX: "hidden",
        WebkitOverflowScrolling: "touch",
        paddingBottom: "calc(88px + env(safe-area-inset-bottom, 0px))",
      }}>
        {children}
      </div>

      {/* Footer: "Mehr anzeigen" */}
      {onMore && (
        <div style={{
          padding: "14px 20px calc(14px + env(safe-area-inset-bottom, 0px))",
          borderTop: `1px solid ${T.inkFaint}`,
          flexShrink: 0,
        }}>
          <button onClick={onMore}
            style={{
            width: "100%", padding: "14px", borderRadius: 14,
            background: accent, color: T.white, border: "none",
            fontFamily: FONT, fontSize: 14, fontWeight: 600,
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}>
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
function PillarsDetail({ pillar }) {
  return (
    <div style={{ padding: 20 }}>
      <div style={{
        width: 64, height: 64, borderRadius: "50%",
        background: pillar.bg, display: "flex",
        alignItems: "center", justifyContent: "center",
        color: pillar.accent, marginBottom: 16,
      }}>
        {React.cloneElement(pillar.icon, { width: 32, height: 32 })}
      </div>
      <div style={{
        fontFamily: FONT, fontSize: 22, fontWeight: 600, color: pillar.accent,
        marginBottom: 12,
      }}>
        {pillar.label}
      </div>
      <p style={{
        fontFamily: FONT, fontSize: 15, color: T.inkMid, lineHeight: 1.7,
        marginBottom: 16,
      }}>
        {pillar.detail}
      </p>
      <div style={{
        height: 3, borderRadius: 3, background: pillar.accent,
        width: 40, opacity: 0.5, marginBottom: 20,
      }} />
    </div>
  );
}

function JourneyDetail({ item, data }) {
  return (
    <div style={{ padding: 20 }}>
      <div style={{
        width: 80, height: 80, borderRadius: "50%", margin: "0 auto 16px",
        background: `linear-gradient(135deg, ${item.color}28 0%, ${item.color}55 100%)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        border: `2px solid ${item.color}38`,
        boxShadow: `0 4px 16px ${item.color}22`,
      }}>
        <span style={{ fontSize: 32 }}>{item.emoji}</span>
      </div>
      <div style={{
        fontFamily: FONT, fontSize: 22, fontWeight: 600, color: item.color,
        textAlign: "center", marginBottom: 12,
      }}>
        {item.label}
      </div>
      <p style={{
        fontFamily: FONT, fontSize: 15, color: T.inkMid, lineHeight: 1.7,
        textAlign: "center", marginBottom: 20,
      }}>
        {item.text}
      </p>
      {/* Detail info */}
      <div style={{
        background: T.creamCard, borderRadius: 16, padding: 16,
        border: `1px solid ${item.color}16`,
      }}>
        {item.subKey === "beginning" && (
          <>
            <div style={detailRow}>Mitglied seit: <b>{data.daysSince} Tagen</b></div>
            <div style={detailRow}>Werke veröffentlicht: <b>{data.worksCount}</b></div>
            <div style={detailRow}>Verbindungen: <b>{data.followers}</b></div>
            <div style={detailRow}>Impact: <b>{data.impactEur} €</b></div>
          </>
        )}
        {item.subKey === "year" && (
          <>
            <div style={detailRow}>Jahr: <b>{new Date().getFullYear()}</b></div>
            <div style={detailRow}>Impulse gesät: <b>{data.worksCount + data.ordersCount + data.bookingsCount}</b></div>
            <div style={detailRow}>Projekte unterstützt: <b>{data.projectsCount}</b></div>
          </>
        )}
        {item.subKey === "month" && (
          <>
            <div style={detailRow}>Monat: <b>{new Date().toLocaleDateString("de-DE", { month: "long" })}</b></div>
            <div style={detailRow}>Neue Verbindungen: <b>{data.newConnectionsThisWeek}</b></div>
          </>
        )}
        {item.subKey === "week" && (
          <div style={detailRow}>Neue Verbindungen diese Woche: <b>{data.newConnectionsThisWeek}</b></div>
        )}
        {item.subKey === "today" && (
          <div style={detailRow}>Heute ist: <b>{new Date().toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" })}</b></div>
        )}
      </div>
    </div>
  );
}

const detailRow = {
  fontFamily: FONT, fontSize: 14, color: T.inkSoft,
  padding: "8px 0", borderBottom: `1px solid ${T.inkFaint}`,
  display: "flex", justifyContent: "space-between", alignItems: "center",
};

function MomentsDetail({ data }) {
  return (
    <div style={{ padding: 20 }}>
      {data.moments.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: T.inkSoft, fontFamily: FONT, fontSize: 14 }}>
          Noch keine Impact-Momente. Dein Weg beginnt jetzt.
        </div>
      ) : (
        data.moments.map((m, i) => (
          <div key={i} style={{
            display: "flex", gap: 12, padding: "12px 0",
            borderBottom: `1px solid ${T.inkFaint}`,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%",
              background: m.bg, display: "flex",
              alignItems: "center", justifyContent: "center",
              fontSize: 18, flexShrink: 0,
            }}>
              {m.icon}
            </div>
            <div>
              <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 500, color: m.color, lineHeight: 1.3 }}>
                {m.label}
              </div>
              <div style={{ fontFamily: FONT, fontSize: 12, color: T.inkFaint, marginTop: 2 }}>
                {m.time}
              </div>
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
      <div style={{
        background: T.tealPale, borderRadius: 16, padding: 20,
        textAlign: "center", marginBottom: 20,
      }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>👥</div>
        <div style={{ fontFamily: FONT, fontSize: 32, fontWeight: 700, color: T.teal }}>
          {data.followers}
        </div>
        <div style={{ fontFamily: FONT, fontSize: 14, color: T.inkSoft }}>
          Menschen folgen dir
        </div>
      </div>
      <div style={detailRow}>Du folgst: <b>{data.following}</b> Menschen</div>
      <div style={detailRow}>Neue diese Woche: <b>{data.newConnectionsThisWeek}</b></div>
    </div>
  );
}

function ImpulsesDetail({ data }) {
  return (
    <div style={{ padding: 20 }}>
      <div style={{
        background: "rgba(244,115,85,0.06)", borderRadius: 16, padding: 20,
        textAlign: "center", marginBottom: 20,
      }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🔥</div>
        <div style={{ fontFamily: FONT, fontSize: 32, fontWeight: 700, color: T.coral }}>
          {data.worksCount + data.ordersCount + data.bookingsCount}
        </div>
        <div style={{ fontFamily: FONT, fontSize: 14, color: T.inkSoft }}>
          Impulse gesät
        </div>
      </div>
      <div style={detailRow}>Werke veröffentlicht: <b>{data.worksCount}</b></div>
      <div style={detailRow}>Käufe getätigt: <b>{data.ordersCount}</b></div>
      <div style={detailRow}>Buchungen getätigt: <b>{data.bookingsCount}</b></div>
      <div style={detailRow}>Projekte unterstützt: <b>{data.projectsCount}</b></div>
    </div>
  );
}

// Robust fuer BEIDE Quellen: StatsGrid-Kacheln (item.value/item.icon/item.key)
// UND Journey-Kreise (item.text/item.emoji/item.subKey) -- statKey kommt immer
// explizit vom Dispatcher (subModal.key), damit die Detail-Zeilen unabhaengig
// von der Datenform IMMER korrekt befuellt werden.
function GenericStatDetail({ item, data, statKey }) {
  const icon = item.icon || item.emoji || "✨";
  const hasValue = item.value !== undefined && item.value !== null && item.value !== "";
  return (
    <div style={{ padding: 20 }}>
      <div style={{
        background: (item.color || T.teal) + "14", borderRadius: 16, padding: 20,
        textAlign: "center", marginBottom: 20,
      }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>{icon}</div>
        {hasValue ? (
          <>
            <div style={{ fontFamily: FONT, fontSize: 28, fontWeight: 700, color: item.color || T.teal }}>
              {item.value}
            </div>
            <div style={{ fontFamily: FONT, fontSize: 14, color: T.inkSoft }}>
              {item.label}{item.sub ? ` · ${item.sub}` : ""}
            </div>
          </>
        ) : (
          <div style={{ fontFamily: FONT, fontSize: 15, color: T.inkMid, lineHeight: 1.6 }}>
            {item.text || item.label}
          </div>
        )}
      </div>
      {(statKey === "beginning") && (
        <>
          <div style={detailRow}>Mitglied seit: <b>{data.daysSince} Tagen</b></div>
          <div style={detailRow}>Werke veröffentlicht: <b>{data.worksCount}</b></div>
          <div style={detailRow}>Verbindungen: <b>{data.followers}</b></div>
          <div style={detailRow}>Impact: <b>{data.impactEur} €</b></div>
        </>
      )}
      {(statKey === "year") && (
        <>
          <div style={detailRow}>Jahr: <b>{new Date().getFullYear()}</b></div>
          <div style={detailRow}>Impulse gesät: <b>{data.worksCount + data.ordersCount + data.bookingsCount}</b></div>
          <div style={detailRow}>Projekte unterstützt: <b>{data.projectsCount}</b></div>
          <div style={detailRow}>Verbindungen gesamt: <b>{data.followers}</b></div>
        </>
      )}
      {(statKey === "month") && (
        <>
          <div style={detailRow}>Monat: <b>{new Date().toLocaleDateString("de-DE", { month: "long" })}</b></div>
          <div style={detailRow}>Neue Verbindungen diese Woche: <b>{data.newConnectionsThisWeek}</b></div>
          <div style={detailRow}>Werke veröffentlicht: <b>{data.worksCount}</b></div>
        </>
      )}
      {(statKey === "today") && (
        <>
          <div style={detailRow}>Heute ist: <b>{new Date().toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" })}</b></div>
          <div style={detailRow}>Verbindungen: <b>{data.followers}</b></div>
          <div style={detailRow}>Impulse gesamt: <b>{data.worksCount + data.ordersCount + data.bookingsCount}</b></div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// SUB-MODAL CONFIG — Maps sub-key to title/icon/accent/page-link
// ─────────────────────────────────────────────────────────────────
const SUB_MODAL_CONFIG = {
  pillars:    { title: "Grundpfeiler",       icon: "🏛️", accent: T.teal,   page: null },
  journey:    { title: "Reise",              icon: "🧭", accent: T.sage,   page: null },
  moments:    { title: "Impact-Momente",     icon: "✨", accent: T.purple, page: null },
  connections:{ title: "Verbindungen",        icon: "👥", accent: T.teal,   page: "discover" },
  impulses:   { title: "Impulse",            icon: "🔥", accent: T.coral,  page: null },
  beginning:  { title: "Seit Beginn",         icon: "🌳", accent: T.sage,   page: null },
  year:       { title: "Dieses Jahr",         icon: "🌅", accent: T.gold,   page: null },
  month:      { title: "Diesen Monat",        icon: "✨", accent: T.purple, page: null },
  today:      { title: "Heute",               icon: "☀️", accent: T.teal,   page: null },
  week:       { title: "Diese Woche",         icon: "🤝", accent: T.sage,   page: null },
};

// ─────────────────────────────────────────────────────────────────
// SHELL — MeinHUI v6.0
// ─────────────────────────────────────────────────────────────────
export default function MeinHUI({
  visible   = true,
  closing   = false,
  profile   = null,
  onClose,
  onNotif,
  onSettings,
}) {
  const scrollRef = useRef(null);
  const [entered, setEntered] = useState(false);
  const [subModal, setSubModal] = useState(null); // { key, data }
  const actions = useHuiActions();

  const wirkData = useWirkungsraumData(profile);

  useEffect(() => {
    if (visible) {
      setEntered(false);
      setSubModal(null);
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
      const raf1 = requestAnimationFrame(() => {
        requestAnimationFrame(() => setEntered(true));
      });
      return () => cancelAnimationFrame(raf1);
    } else {
      setEntered(false);
      setSubModal(null);
    }
  }, [visible]);

  const handleOpenSub = useCallback((key, item) => {
    setSubModal({ key, item });
  }, []);

  const handleCloseSub = useCallback(() => {
    setSubModal(null);
  }, []);

  const handleSubMore = useCallback((pageKey) => {
    // Navigate to the correct page
    if (pageKey === "discover") {
      actions[A.GO_TO_TAB]?.({ tab: "discover" });
    } else if (pageKey === "impact") {
      actions[A.GO_IMPACT]?.();
    } else if (pageKey === "profile") {
      actions[A.OPEN_OWN_PROFILE]?.();
    }
    // Close everything
    setSubModal(null);
    onClose?.();
  }, [actions, onClose]);

  if (!visible) return null;

  const screenStyle = {
    position: "fixed", inset: 0,
    background: T.cream,
    zIndex: 10500,   // PFLICHT: >= 10500 nach footer-navbar-regel
    overflowY: "auto", overflowX: "hidden",
    WebkitOverflowScrolling: "touch",
    overscrollBehavior: "contain",
    opacity: closing ? 0 : (entered ? 1 : 0),
    transform: closing ? "translateY(10px)" : (entered ? "translateY(0)" : "translateY(10px)"),
    transition: closing
      ? `opacity ${CLOSE_SCREEN_MS}ms ${EASE} ${CLOSE_CONTENT_MS}ms, transform ${CLOSE_SCREEN_MS}ms ${EASE} ${CLOSE_CONTENT_MS}ms`
      : `opacity 300ms ${EASE}, transform 300ms ${EASE}`,
  };

  const contentGroupStyle = closing
    ? {
        opacity: 0,
        transform: "translateY(8px)",
        transition: `opacity ${CLOSE_CONTENT_MS}ms ${EASE}, transform ${CLOSE_CONTENT_MS}ms ${EASE}`,
      }
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
        case "pillars":
          content = <PillarsDetail pillar={item} />;
          morePage = null; // Pillars have no dedicated page
          break;
        case "journey":
          content = item ? <JourneyDetail item={item} data={wirkData} /> : null;
          // Journey overview if no specific item
          if (!item) {
            content = (
              <div style={{ padding: 20 }}>
                <p style={{ fontFamily: FONT, fontSize: 15, color: T.inkMid, lineHeight: 1.7, marginBottom: 16 }}>
                  Deine Reise bei HUI zeigt, wie sich deine Wirkung über Zeit entwickelt. Jeder Schritt, jede Verbindung und jeder Impuls formt deinen einzigartigen Weg.
                </p>
                <div style={detailRow}>Tage seit Beginn: <b>{wirkData.daysSince}</b></div>
                <div style={detailRow}>Werke: <b>{wirkData.worksCount}</b></div>
                <div style={detailRow}>Verbindungen: <b>{wirkData.followers}</b></div>
                <div style={detailRow}>Impulse: <b>{wirkData.worksCount + wirkData.ordersCount + wirkData.bookingsCount}</b></div>
              </div>
            );
          }
          break;
        case "moments":
          content = <MomentsDetail data={wirkData} />;
          morePage = null;
          break;
        case "connections":
          content = <ConnectionsDetail data={wirkData} />;
          break;
        case "impulses":
          content = <ImpulsesDetail data={wirkData} />;
          break;
        case "beginning":
          content = item ? <GenericStatDetail item={item} data={wirkData} statKey="beginning" /> : null;
          break;
        case "year":
          content = item ? <GenericStatDetail item={item} data={wirkData} statKey="year" /> : null;
          break;
        case "month":
          content = item ? <GenericStatDetail item={item} data={wirkData} statKey="month" /> : null;
          break;
        case "today":
          content = item ? <GenericStatDetail item={item} data={wirkData} statKey="today" /> : null;
          break;
        case "week":
          content = (
            <div style={{ padding: 20 }}>
              <div style={{
                background: T.sagePale, borderRadius: 16, padding: 20,
                textAlign: "center", marginBottom: 20,
              }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🤝</div>
                <div style={{ fontFamily: FONT, fontSize: 28, fontWeight: 700, color: T.sage }}>
                  {wirkData.newConnectionsThisWeek}
                </div>
                <div style={{ fontFamily: FONT, fontSize: 14, color: T.inkSoft }}>
                  neue Verbindungen diese Woche
                </div>
              </div>
              <p style={{ fontFamily: FONT, fontSize: 14, color: T.inkSoft, lineHeight: 1.6 }}>
                Jede neue Verbindung ist eine neue Möglichkeit, gemeinsam etwas zu bewegen.
              </p>
            </div>
          );
          break;
      }

      subModalContent = (
        <SubModal
          title={cfg.title}
          icon={cfg.icon}
          accent={cfg.accent}
          onClose={handleCloseSub}
          onMore={morePage ? () => handleSubMore(morePage) : null}
        >
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
          {/* Begrüßung */}
          <ProfileHeader profile={profile} onClose={onClose} delay={TITLE_DELAY} />

          {/* Orb + Info-Karten */}
          <OrbHero data={wirkData} coreDelay={CORE_DELAY} infoDelay={INFO_DELAY} />

          <div style={{ width: 28, height: 1, background: T.inkFaint, margin: "6px auto 26px", opacity: 0.35 }} />

          {/* Grundpfeiler */}
          <Pillars delay={PILLARS_DELAY} onOpenSub={handleOpenSub} />

          <div style={{ height: 30 }} />

          {/* Reise */}
          <Journey delay={JOURNEY_DELAY} data={wirkData} onOpenSub={handleOpenSub} />

          <div style={{ height: 30 }} />

          {/* Impact-Momente */}
          <ImpactMoments delay={MOMENTS_DELAY} data={wirkData} onOpenSub={handleOpenSub} />

          <div style={{ height: 30 }} />

          {/* Stats Grid */}
          <StatsGrid delay={STATS_DELAY} data={wirkData} onOpenSub={handleOpenSub} />

          <div style={{ height: 12 }} />
          <p style={{ opacity: 0.6, fontSize: 12, marginTop: 20, textAlign: "center", fontFamily: FONT }}>
            Version {APP_VERSION}
          </p>
        </div>
      </div>

      {/* Sub-Modal via createPortal */}
      {subModalContent}
    </>
  );
}
