// ══════════════════════════════════════════════════════════════════════════════
// desktopNavConfig.js — HUI Web Desktop Navigation Configuration
// ══════════════════════════════════════════════════════════════════════════════
//
// ZWECK:
//   Zentrale Definition der Desktop-Sidebar-Navigation.
//   Modular und erweiterbar — neue Sektionen und Items können einfach
//   hinzugefügt werden, ohne die Sidebar-Komponente zu ändern.
//
// STRUKTUR:
//   Jede Sektion hat eine id (für Keys/Analytics), einen optionalen
//   Label (Section Header), und eine Liste von Items.
//   Jedes Item hat: key, label, route, icon (SVG-Name).
//
// ZUKUNFTSERWEITERUNGEN (vorbereitet, noch nicht aktiv):
//   - Projekte und Organisationen (Sektion "community")
//   - Vereine und Unternehmen (Sektion "organizations")
//   - Administration (Sektion "admin", nur für role=admin)
//   - Mehrsprachigkeit (Sektion "settings" → Sprache)
//
// ICONS:
//   Inline-SVGs werden in DesktopSidebar.jsx gerendert.
//   Die icon-Strings hier sind Keys, die auf SVG-Pfade mappen.
//   Neue Icons: in DesktopSidebar.jsx → ICON_PATHS hinzufügen.
// ══════════════════════════════════════════════════════════════════════════════

export const DESKTOP_NAV_SECTIONS = [
  {
    id: 'primary',
    label: null, // Kein Section-Header für primäre Navigation
    items: [
      { key: 'home',     label: 'Home',       route: '/Home',       icon: 'home' },
      { key: 'discover', label: 'Entdecken',  route: '/discover',    icon: 'discover' },
      { key: 'impact',   label: 'Impact',     route: '/impact',      icon: 'impact' },
    ],
  },
  {
    id: 'secondary',
    label: 'Studio',
    items: [
      { key: 'studio',    label: 'Studio',      route: '/studio',    icon: 'studio' },
      { key: 'messages',  label: 'Nachrichten',  route: '/messages',  icon: 'messages' },
    ],
  },
  {
    id: 'account',
    label: 'Konto',
    items: [
      { key: 'profile',   label: 'Mein Profil',    route: '/profile/me',  icon: 'profile' },
      { key: 'settings',  label: 'Einstellungen',  route: '/settings',     icon: 'settings' },
    ],
  },

  // ── ZUKUNFT: Community & Organisationen ────────────────────────────────
  // {
  //   id: 'community',
  //   label: 'Gemeinschaft',
  //   items: [
  //     { key: 'projects',  label: 'Projekte',        route: '/projects',      icon: 'projects' },
  //     { key: 'orgs',      label: 'Organisationen',  route: '/organizations',  icon: 'orgs' },
  //     { key: 'vereine',   label: 'Vereine',         route: '/vereine',       icon: 'vereine' },
  //   ],
  // },

  // ── ZUKUNFT: Administration (nur für role=admin) ────────────────────────
  // {
  //   id: 'admin',
  //   label: 'Administration',
  //   items: [
  //     { key: 'admin',      label: 'Admin-Panel',    route: '/Admin',      icon: 'admin' },
  //     { key: 'dashboard',  label: 'Plattform',       route: '/dashboard',  icon: 'dashboard' },
  //   ],
  // },
];

// ── Hilfsfunktion: Alle Routen für Active-State-Matching ──────────────────
export function getAllNavRoutes() {
  return DESKTOP_NAV_SECTIONS.flatMap(section =>
    section.items.map(item => item.route)
  );
}

// ── Hilfsfunktion: Item nach Route finden ──────────────────────────────────
export function findNavItemByRoute(route) {
  for (const section of DESKTOP_NAV_SECTIONS) {
    for (const item of section.items) {
      if (item.route === route) return { ...item, sectionId: section.id };
    }
  }
  return null;
}
