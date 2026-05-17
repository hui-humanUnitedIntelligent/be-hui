// src/lib/assist/transparency.js
// HUI — AI Transparency System — Phase 7A.7
// ═══════════════════════════════════════════════════════════════
//
// Jede AI-Unterstützung muss:
//   → sichtbar sein ("AI-Vorschlag")
//   → erklärbar sein ("Warum sehe ich das?")
//   → abschaltbar sein (vollständiges Opt-out)
//
// DESIGN:
//   Transparency UI ist minimal — kein Angst-Design.
//   Kein großes "⚠ AI" das Vertrauen untergräbt.
//   Nur: ehrliche, ruhige Kennzeichnung.
// ═══════════════════════════════════════════════════════════════

// ── AI Label Rendering ──────────────────────────────────────────

// Schlichtes AI-Label — tiny, ehrlich, nicht beunruhigend
export const AI_LABEL_STYLES = {
  micro: {
    // 10px, gedämpft — für Feed-Cards
    fontSize: 10, color: 'rgba(0,0,0,0.30)',
    fontWeight: 500, letterSpacing: '0.02em',
    fontStyle: 'italic',
    text: 'Assistenzvorschlag',
  },
  small: {
    // 11px — für Profil-Hints
    fontSize: 11, color: 'rgba(0,0,0,0.35)',
    fontWeight: 500, letterSpacing: '0.02em',
    text: 'AI-Unterstützung',
  },
  standard: {
    // 12px — für Explain-Dialoge
    fontSize: 12, color: 'rgba(0,0,0,0.45)',
    fontWeight: 600,
    text: 'Warum sehe ich das?',
  },
};

// ── "Warum sehe ich das?" ────────────────────────────────────────
/**
 * Gibt eine menschlich lesbare Erklärung für einen AI-Vorschlag zurück.
 * Verwendet die _assist.explanation aus dem Assist-Result.
 *
 * @param {Object} assistResult  — mit _assist.explanation + _assist.source
 */
export function explainAssistResult(assistResult) {
  if (!assistResult?._assist) return null;

  const { explanation, source, confidence } = assistResult._assist;

  const SOURCE_LABELS = {
    graph:     'Kreative Resonanz-Analyse',
    resonance: 'Atmosphärische Kompatibilitäts-Prüfung',
    local:     'Lokale Netzwerk-Analyse',
    context:   'Kontext-Unterstützung',
    heuristic: 'Einfache Übereinstimmungs-Logik',
  };

  const sourceLabel = SOURCE_LABELS[source] || 'Plattform-Analyse';

  return {
    headline:  'Wie entstand dieser Vorschlag?',
    reason:    explanation,
    method:    sourceLabel,
    confidence:confidence ? `${Math.round(confidence * 100)}% Übereinstimmung` : null,
    optOut:    'Du kannst AI-Unterstützung jederzeit in den Einstellungen deaktivieren.',
    isAI:      true,
  };
}

// ── Opt-out Management ──────────────────────────────────────────

const OPT_OUT_KEY = 'hui_assist_optout';

export function isAssistOptedOut() {
  try {
    return localStorage.getItem(OPT_OUT_KEY) === 'true';
  } catch (_) { return false; }
}

export function setAssistOptOut(optOut = true) {
  try {
    if (optOut) {
      localStorage.setItem(OPT_OUT_KEY, 'true');
    } else {
      localStorage.removeItem(OPT_OUT_KEY);
    }
    return true;
  } catch (_) { return false; }
}

export function getAssistOptOutState() {
  return {
    isOptedOut: isAssistOptedOut(),
    systems: {
      connections:   !isAssistOptedOut(),
      collaborations:!isAssistOptedOut(),
      bridges:       !isAssistOptedOut(),
      directions:    !isAssistOptedOut(),
      hints:         !isAssistOptedOut(),
    },
    settingsPath: '/settings/assistive-intelligence',
  };
}

// ── Transparency Registry ───────────────────────────────────────
// Welche AI-Systeme sind aktiv und was tun sie?

export const AI_SYSTEMS_REGISTRY = [
  {
    id:          'connection_suggest',
    name:        'Verbindungsvorschläge',
    description: 'Zeigt Menschen die kreativ ähnlich ausgerichtet sind.',
    method:      'Kreative Resonanz-Analyse (Graph-basiert, keine persönlichen Daten)',
    optIn:       true,
    canOptOut:   true,
    neverDoes:   ['Persönliche Daten verkaufen', 'Externe Tracking', 'Verhaltens-Profiling'],
  },
  {
    id:          'collab_suggest',
    name:        'Kollaborations-Assist',
    description: 'Zeigt mögliche Zusammenarbeiten basierend auf Verfügbarkeit und Resonanz.',
    method:      'Verfügbarkeits-Check + Resonanz-Score',
    optIn:       true,
    canOptOut:   true,
    neverDoes:   ['Dating-Mechanik', 'Match-Prozentsätze anzeigen'],
  },
  {
    id:          'bridge_suggest',
    name:        'Brücken-Finder',
    description: 'Findet kreative Verbindungen zwischen verschiedenen Feldern.',
    method:      'Domain-Familie-Analyse',
    optIn:       true,
    canOptOut:   true,
    neverDoes:   ['Algorithmic Curation ohne Erklärung'],
  },
  {
    id:          'context_support',
    name:        'Kontext-Unterstützung',
    description: 'Hilft Projekt-Kontext zu strukturieren und Themen zu erkennen.',
    method:      'Keyword-Clustering, keine externe AI',
    optIn:       false,  // Muss explizit aktiviert werden
    canOptOut:   true,
    neverDoes:   ['Inhalte generieren', 'Texte schreiben'],
  },
  {
    id:          'atmospheric_hint',
    name:        'Atmosphärischer Impuls',
    description: 'Optionale saisonale Inspiration — nur auf Anfrage.',
    method:      'Jahreszeit + Profil-Kontext',
    optIn:       false,  // Explizit opt-in
    canOptOut:   true,
    neverDoes:   ['Pushen', 'Drängen', 'Reminder'],
  },
];

export function getAISystemsInfo() {
  return {
    systems:     AI_SYSTEMS_REGISTRY,
    principle:   'Alle AI-Systeme sind erklärbar, reversibel und kulturell sensibel.',
    dataPolicy:  'Keine externen AI-APIs. Alle Berechnungen auf Basis von HUI-eigenen Graphdaten.',
    optOutPath:  '/settings/assistive-intelligence',
    timestamp:   new Date().toISOString(),
  };
}

// React Hook
import { useState, useCallback } from 'react';

export function useAITransparency() {
  const [optOut, setOptOutState] = useState(isAssistOptedOut);

  const toggleOptOut = useCallback(() => {
    const current = isAssistOptedOut();
    setAssistOptOut(!current);
    setOptOutState(!current);
  }, []);

  return {
    isOptedOut: optOut,
    toggleOptOut,
    systems:   AI_SYSTEMS_REGISTRY,
    explain:   explainAssistResult,
    info:      getAISystemsInfo(),
  };
}
