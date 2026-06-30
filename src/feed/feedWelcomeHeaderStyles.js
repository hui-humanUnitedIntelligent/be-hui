// src/feed/feedWelcomeHeaderStyles.js
// Design tokens and style objects for FeedWelcomeHeader.

export const FEED_WELCOME_HEADER_TOKENS = {
  TEAL:   "#0DC4B5",
  CORAL:  "#F47355",
  CREAM:  "#FAF7F2",
  INK:    "#141422",
  MUTED:  "rgba(20,20,34,0.50)",
  BORDER: "rgba(13,196,181,0.12)",
};

const { TEAL, CORAL, CREAM, INK, MUTED, BORDER } = FEED_WELCOME_HEADER_TOKENS;

export const FEED_WELCOME_HEADER_CSS = `
@keyframes huiPulseGreen {
  0%,100% { opacity: 1; }
  50%     { opacity: 0.35; }
}
`;

let feedWelcomeHeaderCSSInjected = false;

export function injectFeedWelcomeHeaderCSS() {
  if (feedWelcomeHeaderCSSInjected || typeof document === "undefined") return;
  feedWelcomeHeaderCSSInjected = true;
  const s = document.createElement("style");
  s.textContent = FEED_WELCOME_HEADER_CSS;
  document.head.appendChild(s);
}

export const feedWelcomeHeaderStyles = {
  root: {
    background: CREAM,
    paddingTop: 20,
    paddingBottom: 4,
  },
  greetingSection: {
    paddingLeft: 20,
    paddingRight: 20,
    marginBottom: 20,
  },
  greetingRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 8,
  },
  greetingIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    background: "linear-gradient(135deg, #FFF3CC 0%, #FFE08A 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    flexShrink: 0,
    marginTop: 3,
    boxShadow: "0 2px 8px rgba(255,200,50,0.25)",
  },
  title: {
    margin: 0,
    padding: 0,
    fontSize: 26,
    fontWeight: 800,
    color: INK,
    letterSpacing: -0.8,
    lineHeight: 1.15,
  },
  titleName: {
    color: TEAL,
  },
  mission: {
    margin: "6px 0 0",
    padding: 0,
    fontSize: 14,
    lineHeight: 1.55,
    color: MUTED,
    fontWeight: 400,
  },
  missionTeal: {
    color: TEAL,
    fontWeight: 600,
  },
  missionCoral: {
    color: CORAL,
    fontWeight: 600,
  },
  statsCard: {
    marginLeft: 16,
    marginRight: 16,
    marginBottom: 20,
    background: "rgba(255,255,255,0.82)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    borderRadius: 18,
    border: `1px solid ${BORDER}`,
    boxShadow: "0 2px 16px rgba(13,196,181,0.06), 0 1px 4px rgba(0,0,0,0.04)",
    overflow: "hidden",
  },
  statsHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 16px 12px",
    borderBottom: "1px solid rgba(13,196,181,0.08)",
  },
  statsHeaderTitleWrap: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  statsHeaderIcon: {
    width: 22,
    height: 22,
    borderRadius: 7,
    background: `linear-gradient(135deg, ${TEAL}22, ${TEAL}10)`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
  },
  statsHeaderTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: INK,
    letterSpacing: -0.2,
  },
  liveWrap: {
    display: "flex",
    alignItems: "center",
    gap: 5,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "#22C55E",
    boxShadow: "0 0 0 2px rgba(34,197,94,0.25)",
    animation: "huiPulseGreen 2s ease-in-out infinite",
  },
  liveText: {
    fontSize: 11,
    fontWeight: 600,
    color: "#22C55E",
    letterSpacing: 0.2,
  },
  statsRow: {
    display: "flex",
    alignItems: "stretch",
    padding: "16px 16px 14px",
    gap: 0,
  },
  statItem: (index) => ({
    flex: 1,
    display: "flex",
    alignItems: "center",
    gap: 9,
    paddingLeft: index > 0 ? 12 : 0,
    borderLeft: index > 0 ? "1px solid rgba(13,196,181,0.10)" : "none",
  }),
  statIcon: (stat) => ({
    width: 34,
    height: 34,
    borderRadius: 11,
    flexShrink: 0,
    background: stat.bg,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 15,
  }),
  statCount: {
    fontSize: 22,
    fontWeight: 800,
    color: INK,
    lineHeight: 1.1,
    letterSpacing: -0.8,
  },
  statLabel: {
    fontSize: 10.5,
    color: MUTED,
    fontWeight: 500,
    marginTop: 1,
  },
  activity: {
    margin: "0 12px 12px",
    background: "rgba(13,196,181,0.05)",
    borderRadius: 12,
    padding: "9px 12px",
    display: "flex",
    alignItems: "center",
    gap: 8,
    border: "1px solid rgba(13,196,181,0.09)",
  },
  activityDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    flexShrink: 0,
    background: "#22C55E",
  },
  activityLabel: {
    fontSize: 12,
    color: MUTED,
    fontWeight: 600,
    flexShrink: 0,
  },
  activityText: {
    fontSize: 12,
    color: "rgba(20,20,34,0.65)",
    fontWeight: 400,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
};
