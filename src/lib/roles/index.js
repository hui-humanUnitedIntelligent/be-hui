// src/lib/roles/index.js
// ═══════════════════════════════════════════════════════════════
// HUI ROLLEN- & MEMBERSHIP-SYSTEM v1.0
//
// ROLLEN-HIERARCHIE:
//   basis_user   → Entdecken, Speichern, Buchen, Verbinden
//   member       → + Gedanken teilen, Community beitreten
//   talent       → + Werke veröffentlichen, Erlebnisse öffnen
//   guardian     → + Community-Schutz, subtile Moderation
//   impact_team  → + Impact-Projekte kuratieren
//   moderator    → + Content-Review, Trust-Oversight
//
// WICHTIG:
// - Neue User starten IMMER als basis_user
// - Rolle wird NIEMALS im öffentlichen Profil als Badge angezeigt
// - Orb prüft Rollen zentral über canUseOrbNode()
// - Kein Gamification, kein "Level-Up"-Gefühl
// ═══════════════════════════════════════════════════════════════

import { supabase } from '../supabaseClient';
import { sentryCapture } from '../sentry.js';

// ── Rollen-Definitionen ───────────────────────────────────────
export const ROLES = {
  BASIS_USER:  'basis_user',
  MEMBER:      'member',
  TALENT:      'talent',
  GUARDIAN:    'guardian',
  IMPACT_TEAM: 'impact_team',
  MODERATOR:   'moderator',
};

// ── Berechtigungen je Rolle ───────────────────────────────────
export const PERMISSIONS = {
  // Was basis_user DARF
  discover:            [ROLES.BASIS_USER, ROLES.MEMBER, ROLES.TALENT, ROLES.GUARDIAN, ROLES.IMPACT_TEAM, ROLES.MODERATOR],
  save:                [ROLES.BASIS_USER, ROLES.MEMBER, ROLES.TALENT, ROLES.GUARDIAN, ROLES.IMPACT_TEAM, ROLES.MODERATOR],
  book:                [ROLES.BASIS_USER, ROLES.MEMBER, ROLES.TALENT, ROLES.GUARDIAN, ROLES.IMPACT_TEAM, ROLES.MODERATOR],
  connect:             [ROLES.BASIS_USER, ROLES.MEMBER, ROLES.TALENT, ROLES.GUARDIAN, ROLES.IMPACT_TEAM, ROLES.MODERATOR],
  resonate:            [ROLES.BASIS_USER, ROLES.MEMBER, ROLES.TALENT, ROLES.GUARDIAN, ROLES.IMPACT_TEAM, ROLES.MODERATOR],

  // Was nur member+ DARF
  share_thought:       [ROLES.MEMBER, ROLES.TALENT, ROLES.GUARDIAN, ROLES.IMPACT_TEAM, ROLES.MODERATOR],
  join_community:      [ROLES.MEMBER, ROLES.TALENT, ROLES.GUARDIAN, ROLES.IMPACT_TEAM, ROLES.MODERATOR],
  follow:              [ROLES.MEMBER, ROLES.TALENT, ROLES.GUARDIAN, ROLES.IMPACT_TEAM, ROLES.MODERATOR],

  // Was nur talent+ DARF
  publish_work:        [ROLES.TALENT, ROLES.GUARDIAN, ROLES.IMPACT_TEAM, ROLES.MODERATOR],
  create_experience:   [ROLES.TALENT, ROLES.GUARDIAN, ROLES.IMPACT_TEAM, ROLES.MODERATOR],
  start_impact:        [ROLES.TALENT, ROLES.GUARDIAN, ROLES.IMPACT_TEAM, ROLES.MODERATOR],
  receive_booking:     [ROLES.TALENT, ROLES.GUARDIAN, ROLES.IMPACT_TEAM, ROLES.MODERATOR],
  publish_story:       [ROLES.TALENT, ROLES.GUARDIAN, ROLES.IMPACT_TEAM, ROLES.MODERATOR],

  // Was nur guardian+ DARF
  protect_community:   [ROLES.GUARDIAN, ROLES.MODERATOR],
  flag_content:        [ROLES.GUARDIAN, ROLES.IMPACT_TEAM, ROLES.MODERATOR],

  // Was nur moderator DARF
  review_trust:        [ROLES.MODERATOR],
  manage_impact:       [ROLES.IMPACT_TEAM, ROLES.MODERATOR],
};

// ── Orb-Node → Berechtigung Mapping ──────────────────────────
// OrbSystem prüft canUseOrbNode(node.key, userRole)
export const ORB_NODE_PERMISSIONS = {
  teilen:    'share_thought',    // Gedanke/Moment teilen
  werk:      'publish_work',     // Werk erschaffen
  erlebnis:  'create_experience',// Erlebnis öffnen
  wirkung:   'start_impact',     // Wirkung starten
  verbindung:'connect',          // Verbindung (alle)
};

// ── Hilfsfunktionen ───────────────────────────────────────────

// Prüft ob eine Rolle eine Berechtigung hat
export function hasPermission(role, permission) {
  const allowed = PERMISSIONS[permission];
  if (!allowed) return false;
  return allowed.includes(role);
}

// Prüft ob User eine Orb-Node nutzen darf
export function canUseOrbNode(nodeKey, role) {
  const permission = ORB_NODE_PERMISSIONS[nodeKey];
  if (!permission) return true; // Unbekannte Node: erlaubt (fail-open für neue Nodes)
  return hasPermission(role, permission);
}

// Rollenvergleich: ist role1 >= role2 (in Hierarchie)?
const ROLE_RANK = {
  [ROLES.BASIS_USER]:  0,
  [ROLES.MEMBER]:      1,
  [ROLES.TALENT]:      2,
  [ROLES.GUARDIAN]:    3,
  [ROLES.IMPACT_TEAM]: 3,
  [ROLES.MODERATOR]:   4,
};

export function isAtLeast(userRole, requiredRole) {
  return (ROLE_RANK[userRole] || 0) >= (ROLE_RANK[requiredRole] || 0);
}

// ── getUserRole ───────────────────────────────────────────────
// Bestimmt die effektive Rolle eines Users aus seinem Profil.
// EINE Quelle der Wahrheit.
export function getUserRole(profile) {
  if (!profile) return ROLES.BASIS_USER;

  // Explizite Rolle hat Vorrang
  if (profile.role && ROLES[profile.role?.toUpperCase()]) {
    return profile.role;
  }

  // Rückwärtskompatibilität mit bestehenden Feldern
  if (profile.is_moderator)                return ROLES.MODERATOR;
  if (profile.is_impact_team)              return ROLES.IMPACT_TEAM;
  if (profile.is_guardian)                 return ROLES.GUARDIAN;
  if (profile.has_talent_profile || profile.is_wirker) return ROLES.TALENT;
  if (profile.is_member)                   return ROLES.MEMBER;

  return ROLES.BASIS_USER;
}

// ── getWelcomeMessage ─────────────────────────────────────────
// Ruhige, einladende Nachricht für neue Mitglieder (kein Gamification).
export function getWelcomeMessage(role) {
  const messages = {
    [ROLES.BASIS_USER]:  'Entdecke deinen Weg durch HUI.',
    [ROLES.MEMBER]:      'Du bist Teil der Gemeinschaft. Dein Raum wartet.',
    [ROLES.TALENT]:      'Deine kreative Präsenz ist bereit.',
    [ROLES.GUARDIAN]:    'Du schützt den Raum. Danke.',
    [ROLES.IMPACT_TEAM]: 'Du gestaltest Wirkung mit.',
    [ROLES.MODERATOR]:   'Du hütest die Kultur von HUI.',
  };
  return messages[role] || messages[ROLES.BASIS_USER];
}

// ── promoteToMember (nach Membership-Flow) ───────────────────
export async function promoteToMember(userId) {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ is_member: true, role: ROLES.MEMBER, member_since: new Date().toISOString() })
      .eq('id', userId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    sentryCapture(err, { context: 'promoteToMember', userId });
    return { error: err.message };
  }
}

// ── promoteToTalent ───────────────────────────────────────────
export async function promoteToTalent(userId) {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        has_talent_profile: true,
        is_wirker: true,
        role: ROLES.TALENT,
      })
      .eq('id', userId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    sentryCapture(err, { context: 'promoteToTalent', userId });
    return { error: err.message };
  }
}

// ── useUserRole (React Hook) ──────────────────────────────────
import { useMemo } from 'react';
import { useAuth } from '../AuthContext.jsx';

export function useUserRole() {
  const { authProfile, profile } = useAuth();
  const _profile = authProfile ?? profile;  // authProfile Alias jetzt im Context

  const role = useMemo(() => getUserRole(_profile), [_profile]);

  return {
    role,
    can:         (permission) => hasPermission(role, permission),
    canUseOrb:   (nodeKey)    => canUseOrbNode(nodeKey, role),
    isAtLeast:   (required)   => isAtLeast(role, required),
    isTalent:    role === ROLES.TALENT || isAtLeast(role, ROLES.TALENT),
    isMember:    isAtLeast(role, ROLES.MEMBER),
    isGuardian:  isAtLeast(role, ROLES.GUARDIAN),
    welcomeMsg:  getWelcomeMessage(role),
    ROLES,
  };
}

// ─────────────────────────────────────────────────────────────
// PHASE 2: CONTENT-BERECHTIGUNGEN
// Zentrale Prüfung für alle Content-Operationen
// ─────────────────────────────────────────────────────────────

// Content-Typen
export const CONTENT_TYPES = {
  POST:       'post',        // Gedanken / Feed-Posts
  WORK:       'work',        // Werke veröffentlichen
  EXPERIENCE: 'experience',  // Erlebnisse anbieten
  STORY:      'story',       // Stories posten
  IMPACT:     'impact',      // Impact-Projekte einreichen
};

// Wer darf welche Inhalte erstellen?
// BasisUser:  nur Resonanz geben + speichern
// Member:     Gedanken teilen, Stories
// Talent:     alles — Werke, Erlebnisse, Impact
const CONTENT_PERMISSIONS = {
  [CONTENT_TYPES.POST]:       ['member', 'talent', 'guardian', 'impact_team', 'moderator', 'admin'],
  [CONTENT_TYPES.WORK]:       ['talent', 'guardian', 'moderator', 'admin'],
  [CONTENT_TYPES.EXPERIENCE]: ['talent', 'guardian', 'moderator', 'admin'],
  [CONTENT_TYPES.STORY]:      ['member', 'talent', 'guardian', 'moderator', 'admin'],
  [CONTENT_TYPES.IMPACT]:     ['member', 'talent', 'guardian', 'impact_team', 'moderator', 'admin'],
};

// canCreateContent — zentrale Berechtigungsprüfung
// Gibt { allowed: bool, reason: string } zurück — nie undefined
export function canCreateContent(profile, contentType) {
  if (!profile) {
    return { allowed: false, reason: 'Bitte melde dich an.' };
  }

  const role = getUserRole(profile);
  const allowed_roles = CONTENT_PERMISSIONS[contentType] || [];

  // Prüfe: ist Rolle in der allowed-Liste?
  const allowed = allowed_roles.includes(role) ||
                  profile?.is_moderator ||
                  profile?.is_guardian;

  if (!allowed) {
    // Ruhige, menschliche Fehlermeldung — keine technische Sprache
    const messages = {
      [CONTENT_TYPES.WORK]:       'Werde Talent um Werke zu veröffentlichen. ✦',
      [CONTENT_TYPES.EXPERIENCE]: 'Werde Talent um Erlebnisse anzubieten. ✦',
      [CONTENT_TYPES.POST]:       'Werde Mitglied um Gedanken zu teilen. ✦',
      [CONTENT_TYPES.STORY]:      'Werde Mitglied um Stories zu teilen. ✦',
      [CONTENT_TYPES.IMPACT]:     'Werde Mitglied um Wirkung einzureichen. ✦',
    };
    return {
      allowed: false,
      reason:  messages[contentType] || 'Diese Aktion ist für deine aktuelle Rolle nicht verfügbar.',
      role,
    };
  }

  return { allowed: true, role };
}

// canPublish — Alias für Veröffentlichungs-Checks
export const canPublish = canCreateContent;

// canResonate — BasisUser dürfen immer resonieren
// (Resonanz ist für alle offen — das ist die Basis der Gemeinschaft)
export function canResonate(profile) {
  if (!profile) return { allowed: false, reason: 'Anmeldung erforderlich.' };
  return { allowed: true };  // Jeder darf resonieren
}

// canSave — Inhalte speichern (alle dürfen)
export const canSave = canResonate;

// canDiscover — Entdecken (alle dürfen)
export const canDiscover = (profile) => ({ allowed: true });

// Rollen-Hierarchie für UI-Feedback
export const ROLE_LABELS = {
  basis_user: 'Entdecker',
  member:     'Mitglied',
  talent:     'Talent',
  guardian:   'Guardian',
  impact_team:'Impact-Team',
  moderator:  'Moderator',
  admin:      'Admin',
};

export function getRoleLabel(profile) {
  const role = getUserRole(profile);
  return ROLE_LABELS[role] || 'Entdecker';
}
