// src/i18n/index.js
// HUI i18n System — HYBRID Lazy/Eager (PERF-I18N-SPLIT-001, 2026-09-16).
// EAGER: de.js — deutscher Fallback, IMMER synchron verfügbar (kein White
//   Screen, kein Sprach-Flash: t() fällt auf de zurück, solange ein Chunk
//   noch nicht geladen ist).
// LAZY: en, fr, es, it, tr, pt, sq — je ein eigener Vite-Chunk, on-demand
//   geladen via ensureLanguageLoaded() VOR dem React-Render (Bootstrap in
//   main.jsx) und beim Sprachwechsel (useTranslation.changeLang).
// Synchrone t()-API bleibt unverändert. KEIN React.lazy, KEIN Suspense —
// nur roher dynamic import() (die dokumentierte __vitePreload-Hang-Falle
// der React.lazy-Ära wird damit strukturell umgangen).
// WICHTIG: Nutzt NICHT die Supabase i18n_translations Tabelle. Alle Texte
// kommen aus lokalen JS-Dateien — kein Supabase-Fetch für UI-Texte.

import de from './de.js';
import { sentryCapture } from '../lib/sentry.js';

// Lazy Chunk Imports — Vite spaltet jede Datei in einen eigenen Chunk auf.
// Bewusst als Objekt mit Thunks (NICHT top-level await): die Imports werden
// erst beim Aufruf von ensureLanguageLoaded() ausgeführt.
const lazyChunks = {
  en: () => import('./en.js'),
  fr: () => import('./fr.js'),
  es: () => import('./es.js'),
  it: () => import('./it.js'),
  tr: () => import('./tr.js'),
  pt: () => import('./pt.js'),
  sq: () => import('./sq.js'),
};

// TRANSLATIONS REGISTRY — startet nur mit de. Die 7 anderen Sprachen werden
// von ensureLanguageLoaded() in dieselbe Objekt-Referenz injiziert (Mutation,
// KEIN Neu-Zuweisen — t() hält die Closure-Referenz stabil).
// Platzhalter {} ⇒ t() fällt für ungeladene Sprachen auf de zurück.
const translations = {
  de,
  en: {},
  fr: {},
  es: {},
  it: {},
  tr: {},
  pt: {},
  sq: {},
};

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

/**
 * Lädt einen Sprach-Chunk on-demand (idempotent — mehrfacher Aufruf ist frei).
 * Aufrufer: main.jsx Bootstrap (vor React-Render) + useTranslation.changeLang.
 * Fehlerfall (OTA-Fenster/Offline/Chunk-404): Fallback auf de — die App bleibt
 * benutzbar, t() liefert deutschen Text, Sentry bekommt den Fehler.
 * @param {string} lang - Sprach-Code aus SUPPORTED_LANGS
 * @returns {Promise<void>}
 */
export async function ensureLanguageLoaded(lang) {
  if (lang === 'de' || !SUPPORTED_LANGS.includes(lang)) return;
  // Bereits geladen? (gefüllte Registry = >0 Keys; Platzhalter hat 0)
  if (translations[lang] && Object.keys(translations[lang]).length > 0) return;

  const loader = lazyChunks[lang];
  if (!loader) {
    console.warn(`[HUI i18n] No chunk for language "${lang}" — staying on de`);
    return;
  }

  try {
    const mod = await loader();
    translations[lang] = mod?.default || mod; // ESM default-Export
  } catch (err) {
    console.error(`[HUI i18n] Chunk load failed for "${lang}" — falling back to de:`, err);
    translations[lang] = de; // OTA/Offline-Fallback: deutsche Texte statt Roh-Keys
    try {
      sentryCapture(err instanceof Error ? err : new Error(`i18n chunk load failed: ${lang}`), {
        source: 'i18n.ensureLanguageLoaded',
        lang,
      });
    } catch (_) { /* Sentry darf den Bootstrap nie brechen */ }
  }
}

export const SUPPORTED_LANGS = ['de', 'en', 'fr', 'es', 'it', 'tr', 'pt', 'sq'];

export const LANG_LABELS = {
  de: 'Deutsch',
  en: 'English',
  fr: 'Français',
  es: 'Español',
  it: 'Italiano',
  tr: 'Türkçe',
  pt: 'Português',
  sq: 'Shqip'
};

export const LANG_FLAGS = {
  de: '🇩🇪', en: '🇬🇧', fr: '🇫🇷',
  es: '🇪🇸', it: '🇮🇹', tr: '🇹🇷', pt: '🇵🇹', sq: '🇦🇱'
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
// Async seit PERF-I18N-SPLIT-001: lädt erst alle 7 Chunks, dann Diff gegen de.
// Wird beim Modul-Load in DEV fire-and-forget aufgerufen (unten).
export async function checkTranslationCompleteness() {
  if (!import.meta.env.DEV) return;

  const deKeys = Object.keys(translations.de);
  const report = {};

  for (const lang of SUPPORTED_LANGS) {
    if (lang === 'de') continue;
    await ensureLanguageLoaded(lang);
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
