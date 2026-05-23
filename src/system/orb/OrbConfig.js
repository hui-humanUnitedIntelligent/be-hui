// Phase 21: HUI Design System
import { HUI } from "../../design/hui.design.js";

// src/system/orb/OrbConfig.js
// ═══════════════════════════════════════════════════════════════
// HUI ORB — Zentrale Konfiguration
// Alle Magic Numbers, Tokens, Node-Definitionen an einem Ort.
// Änderungen hier propagieren automatisch durch das gesamte System.
// ═══════════════════════════════════════════════════════════════

/* ── Z-Index Hierarchie ─────────────────────────────────────── */
export const Z = {
  background:  0,
  atmosphere:  1,
  rings:       2,
  nodes:       5,
  activeNode:  6,
  center:      10,
  hints:       20,
  overlays:    100,
  modals:      200,
  // Orb-Overlay selbst sitzt bei 9000 (über allem außer Profile 9500)
  orbOverlay:  9000,
};

/* ── Design Tokens ──────────────────────────────────────────── */
export const T = {
  // ── Phase 21: HUI Design System ──────────────────────────────
  teal:    HUI.COLOR.teal,      tealD:   HUI.COLOR.tealDeep,
  coral:   HUI.COLOR.coral,     coralD:  HUI.COLOR.coralDeep,
  violet:  HUI.COLOR.violet,    violetD: "#6452C4",
  blue:    "#38BDF8",           blueD:   "#0EA5E9",
  gold:    HUI.COLOR.gold,      goldD:   "#B8801E",
  // Background — warmes HUI Fundament statt kalt-blau
  bgGrad:  HUI.GRADIENT.hero,
  // Glass — HUI Material System
  glass:       HUI.SURFACE.glass,
  glassStrong: HUI.SURFACE.glassTop,
  glassBorder: "rgba(255,252,248,0.82)",
  // Typography
  ink:  HUI.COLOR.ink,
  ink2: "rgba(20,20,34,0.62)",
  ink3: "rgba(20,20,34,0.40)",
  ink4: "rgba(20,20,34,0.22)",
  // Helpers
  white: HUI.COLOR.white,
};

/* ── Node Definitionen ──────────────────────────────────────── */
// Alles über Nodes hier — niemals in Komponenten hardcoden.
// forAll: true  → auch Non-Wirker
// isImpact: true → öffnet ImpactDetail statt DetailCard
// directAction: true → Single-Tap startet Flow sofort
export const NODES = [
  {
    key:         "teilen",
    label:       "Teilen",
    icon:        "🌿",
    color:       HUI.COLOR.teal,
    dark:        "#0891B2",
    glow:        "rgba(10,191,184,",
    angle:       -90,
    floatAnim:   "orbFloatA",
    delay:       0.08,
    desc:        "Teile einen Moment, der dich berührt hat.",
    action:      "story",
    ctaLabel:    "Moment teilen ✦",
    forAll:      true,
    directAction: true,   // ← Single-Tap
    sub: [
      { key:"foto",        icon:"📷", label:"Foto / Video"    },
      { key:"gedanke",     icon:"💭", label:"Gedanke"         },
      { key:"inspiration", icon:"✨", label:"Inspiration"     },
      { key:"musik",       icon:"🎵", label:"Musik"           },
      { key:"geschichte",  icon:"📖", label:"Geschichte"      },
    ],
  },
  {
    key:         "werk",
    label:       "Werk erschaffen",
    icon:        "🎨",
    color:       HUI.COLOR.coral,
    dark:        "#EA580C",
    glow:        "rgba(251,146,60,",
    angle:       -18,
    floatAnim:   "orbFloatB",
    delay:       0.16,
    desc:        "Deine Schöpfung verdient einen Raum in der Welt.",
    action:      "werk",
    ctaLabel:    "Werk öffnen",
    forAll:      false,
    directAction: true,
    sub: [
      { key:"kunstwerk", icon:"🖼",  label:"Kunstwerk"          },
      { key:"handwerk",  icon:"🏺",  label:"Handwerk"           },
      { key:"design",    icon:"✏️",  label:"Design"             },
      { key:"digital",   icon:"💻",  label:"Digitale Produkte"  },
      { key:"sammler",   icon:"💎",  label:"Sammlerstücke"      },
    ],
  },
  {
    key:         "erlebnis",
    label:       "Erlebnis öffnen",
    icon:        "📅",
    color:       "#38BDF8",
    dark:        "#0EA5E9",
    glow:        "rgba(56,189,248,",
    angle:       54,
    floatAnim:   "orbFloatC",
    delay:       0.24,
    desc:        "Öffne eine Begegnung — ein Erlebnis das verbindet.",
    action:      "experience",
    ctaLabel:    "Einladung öffnen",
    forAll:      false,
    directAction: true,
    sub: [
      { key:"workshop",   icon:"🔨", label:"Workshop"  },
      { key:"retreat",    icon:"🌲", label:"Retreat"   },
      { key:"event",      icon:"🎉", label:"Event"     },
      { key:"session",    icon:"🎯", label:"Session"   },
      { key:"erlebnis_s", icon:"🌟", label:"Erlebnis"  },
    ],
  },
  {
    key:         "wirkung",
    label:       "Wirkung starten",
    icon:        "🌱",
    color:       "#10B981",
    dark:        "#059669",
    glow:        "rgba(16,185,129,",
    angle:       126,
    floatAnim:   "orbFloatD",
    delay:       0.32,
    desc:        "Starte etwas das bleibt — echte Wirkung entsteht.",
    action:      "impact",
    ctaLabel:    "Wirkung starten",
    forAll:      true,
    isImpact:    false,
    directAction: true,
    sub: [
      { key:"idee",     icon:"💡", label:"Idee einreichen"     },
      { key:"wirkraum", icon:"🌍", label:"Wirkungsraum"        },
      { key:"einreich", icon:"📋", label:"Meine Einreichungen" },
    ],
  },
  {
    key:         "verbindung",
    label:       "Verbindung",
    icon:        "👥",
    color:       HUI.COLOR.violet,
    dark:        "#7C3AED",
    glow:        "rgba(139,92,246,",
    angle:       198,
    floatAnim:   "orbFloatE",
    delay:       0.40,
    desc:        "Finde Menschen mit ähnlicher Resonanz ✦",
    action:      "connect",
    ctaLabel:    "Verbindung öffnen ✦",
    forAll:      true,
    directAction: true,
    sub: [
      { key:"kollab",    icon:"🤝", label:"Gemeinsam schaffen"    },
      { key:"mentor",    icon:"🎓", label:"Begleitung finden"    },
      { key:"partner",   icon:"🔗", label:"Projektpartner"   },
      { key:"community", icon:"🌐", label:"Resonanzraum"        },
    ],
  },
];

/* ── Impact Steps ───────────────────────────────────────────── */
export const IMPACT_STEPS = [
  { icon:"💡", title:"Idee einreichen",           sub:"Teile deine Vision."          },
  { icon:"🔍", title:"Prüfung durch HUI Team",    sub:"Wir prüfen, ob es passt."     },
  { icon:"🗳",  title:"Community Entscheidung",    sub:"Die Community entscheidet."   },
  { icon:"🌱", title:"Gemeinsam Wirkung schaffen", sub:"Transparenz und echter Impact."},
];

/* ── Layout ─────────────────────────────────────────────────── */
export const NODE_SIZE   = 62;   // px — konstant, kein active-Sprung
export const ORBIT_RATIO = 0.30; // 30% der kleinsten Viewport-Dimension
export const ORB_MIN     = 100;  // px
export const ORB_MAX     = 155;  // px

/* ── Timing ─────────────────────────────────────────────────── */
export const TRANSITION_LOCK_MS = 380; // Click-Lock — kurz genug für Responsiveness
export const MOUNT_DELAY_MS     = 40;  // Erstmount-Delay — bewusstes Erscheinen
