// src/feed/FeedWelcomeHeader.jsx
// Kapitel 2, Sprint 2.1 — Begrüßung · HUI-Missionszeile · "Heute auf HUI"-Stats.

import React from "react";
import { useHeuteStats } from "./useHeuteStats.js";
import {
  getFeedHeaderFirstName,
  getGreeting,
  getGreetingIcon,
} from "./feedWelcomeHeaderUtils.js";
import {
  FEED_WELCOME_HEADER_TOKENS,
  feedWelcomeHeaderStyles as styles,
  injectFeedWelcomeHeaderCSS,
} from "./feedWelcomeHeaderStyles.js";

function getHeuteStatItems(stats) {
  const { TEAL, CORAL } = FEED_WELCOME_HEADER_TOKENS;

  return [
    { icon: "🌿", color: TEAL,  bg: `${TEAL}14`,  count: stats.works,       label: "neue Werke"       },
    { icon: "🗓️", color: CORAL, bg: `${CORAL}12`, count: stats.experiences, label: "neue Erlebnisse"  },
    { icon: "👥", color: TEAL,  bg: `${TEAL}14`,  count: stats.members,     label: "neue Begegnungen" },
  ];
}

export default function FeedWelcomeHeader({ currentUser }) {
  const greeting = getGreeting();
  const firstName = getFeedHeaderFirstName(currentUser);
  const stats = useHeuteStats();

  React.useEffect(() => {
    injectFeedWelcomeHeaderCSS();
  }, []);

  return (
    <div style={styles.root}>

      {/* ── Begrüßung ───────────────────────────────────────────── */}
      <div style={styles.greetingSection}>
        <div style={styles.greetingRow}>
          {/* Sonne / Mond Icon */}
          <div style={styles.greetingIcon}>
            {getGreetingIcon()}
          </div>

          <div>
            <h1 style={styles.title}>
              {greeting}{firstName ? (
                <>, <span style={styles.titleName}>{firstName}.</span></>
              ) : "."}
            </h1>

            <p style={styles.mission}>
              Entdecke heute{" "}
              <span style={styles.missionTeal}>Menschen</span>,{" "}
              <span style={styles.missionTeal}>Ideen</span>{" "}
              und{" "}
              <span style={styles.missionCoral}>Erlebnisse</span>,
              <br />die dich inspirieren.
            </p>
          </div>
        </div>
      </div>

      {/* ── "Heute auf HUI" ────────────────────────────────────── */}
      <div style={styles.statsCard}>
        {/* Karten-Header */}
        <div style={styles.statsHeader}>
          <div style={styles.statsHeaderTitleWrap}>
            <div style={styles.statsHeaderIcon}>📈</div>
            <span style={styles.statsHeaderTitle}>
              Heute auf HUI
            </span>
          </div>
          <div style={styles.liveWrap}>
            <div style={styles.liveDot} />
            <span style={styles.liveText}>
              Live
            </span>
          </div>
        </div>

        {/* Stats-Zeile */}
        <div style={styles.statsRow}>
          {getHeuteStatItems(stats).map((s, i) => (
            <div key={i} style={styles.statItem(i)}>
              <div style={styles.statIcon(s)}>
                {s.icon}
              </div>
              <div>
                <div style={styles.statCount}>
                  {s.count}
                </div>
                <div style={styles.statLabel}>
                  {s.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Gerade passiert */}
        <div style={styles.activity}>
          <div style={styles.activityDot} />
          <span style={styles.activityLabel}>
            Gerade passiert:
          </span>
          <span style={styles.activityText}>
            {stats.liveText || "Neue Inhalte werden geladen…"}
          </span>
        </div>
      </div>

    </div>
  );
}
