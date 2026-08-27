// src/i18n/index.js
// HUI i18n System — EAGER imports only. KEIN lazy loading, KEIN dynamic import().
// Alle Sprachdateien werden synchron geladen — das verhindert White Screens.
// WICHTIG: Nutzt NICHT die Supabase i18n_translations Tabelle. Alle Texte kommen
// aus lokalen JS-Dateien — kein Supabase-Fetch, kein async, kein Network-Request.

import de from './de.js';
import en from './en.js';
import fr from './fr.js';
import es from './es.js';
import it from './it.js';
import tr from './tr.js';
import pt from './pt.js';

const translations = { de, en, fr, es, it, tr, pt };

export function t(key, lang = 'de') {
  const val = translations[lang]?.[key] ?? translations['de']?.[key];

  if (val === undefined) {
    if (import.meta.env.DEV) {
      console.warn(
        `%c[HUI i18n] Missing key: "${key}" (lang: ${lang})`,
        'color: orange; font-weight: bold'
      );
    }
    return key;
  }

  return val;
}

export const SUPPORTED_LANGS = ['de', 'en', 'fr', 'es', 'it', 'tr', 'pt'];

export const LANG_LABELS = {
  de: 'Deutsch',
  en: 'English',
  fr: 'Français',
  es: 'Español',
  it: 'Italiano',
  tr: 'Türkçe',
  pt: 'Português'
};

export const LANG_FLAGS = {
  de: '🇩🇪', en: '🇬🇧', fr: '🇫🇷',
  es: '🇪🇸', it: '🇮🇹', tr: '🇹🇷', pt: '🇵🇹'
};

// Systemsprache erkennen — Browser und OS
export function detectSystemLang() {
  const stored = localStorage.getItem('hui_lang');
  if (stored && SUPPORTED_LANGS.includes(stored)) return stored;

  if (navigator.languages && navigator.languages.length > 0) {
    for (const lang of navigator.languages) {
      const code = lang.split('-')[0].toLowerCase();
      if (SUPPORTED_LANGS.includes(code)) return code;
    }
  }

  const single = navigator.language?.split('-')[0]?.toLowerCase();
  if (single && SUPPORTED_LANGS.includes(single)) return single;

  return 'de';
}

// ── Completeness Check (DEV only) ──────────────────────────────
export function checkTranslationCompleteness() {
  const deKeys = Object.keys(translations.de);
  const report = {};

  for (const lang of SUPPORTED_LANGS) {
    if (lang === 'de') continue;
    const missing = deKeys.filter(k => !translations[lang][k]);
    if (missing.length > 0) {
      report[lang] = missing;
    }
  }

  if (Object.keys(report).length === 0) {
    console.log(
      '%c[HUI i18n] ✅ Alle 7 Sprachen vollständig!',
      'color: green; font-weight: bold'
    );
  } else {
    console.warn('[HUI i18n] ⚠️ Fehlende Übersetzungen:', report);
  }

  return report;
}

if (import.meta.env.DEV) {
  checkTranslationCompleteness();
}
