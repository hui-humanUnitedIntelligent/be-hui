// ══════════════════════════════════════════════════════════
// src/i18n/index.js — HUI i18n Engine v2 (Auto-Translation)
// ══════════════════════════════════════════════════════════
// Features:
// - 7 languages (DE/EN/FR/ES/IT/EL/TR)
// - Static JSON resources (build-time)
// - Dynamic translations from Supabase (runtime)
// - Auto-translation of missing keys via Edge Function
// - Fallback chain: user lang → en → key string
// - Profile-based language selection
// - Live injection of new translations (no restart)
// ══════════════════════════════════════════════════════════

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import de from './locales/de.json';
import en from './locales/en.json';
import fr from './locales/fr.json';
import es from './locales/es.json';
import it from './locales/it.json';
import el from './locales/el.json';
import tr from './locales/tr.json';

export const SUPPORTED_LANGUAGES = ['de', 'en', 'fr', 'es', 'it', 'el', 'tr'];

export const LANGUAGE_LABELS = {
  de: 'Deutsch',
  en: 'English',
  fr: 'Français',
  es: 'Español',
  it: 'Italiano',
  el: 'Ελληνικά',
  tr: 'Türkçe',
};

export const LANGUAGE_FLAGS = {
  de: '🇩🇪',
  en: '🇬🇧',
  fr: '🇫🇷',
  es: '🇪🇸',
  it: '🇮🇹',
  el: '🇬🇷',
  tr: '🇹🇷',
};

const STORAGE_KEY = 'hui_locale';
const DYNAMIC_CACHE_KEY = 'hui_i18n_dynamic';
const MISSING_QUEUE_KEY = 'hui_i18n_missing_queue';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://gxztrhvhcxhmunhhkfjd.supabase.co';
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/auto-translate`;

// ─── Language Detection ───────────────────────────────────

export function detectDeviceLanguage() {
  try {
    const navLang = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
    const baseLang = navLang.split('-')[0];
    if (SUPPORTED_LANGUAGES.includes(baseLang)) return baseLang;
    return 'en';
  } catch {
    return 'en';
  }
}

function getInitialLanguage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED_LANGUAGES.includes(stored)) return stored;
    return detectDeviceLanguage();
  } catch {
    return 'en';
  }
}

// ─── Missing Key Queue (auto-translation) ──────────────────

let missingQueue = [];
let flushTimer = null;

function addToMissingQueue(lng, ns, key, fallbackValue) {
  // Only queue if we have a usable fallback value (the source text)
  if (!fallbackValue || typeof fallbackValue !== 'string') return;
  if (fallbackValue === key) return; // No defaultValue provided — key IS the fallback
  
  // Check if already in queue
  if (missingQueue.some(item => item.key === key)) return;
  
  missingQueue.push({
    key,
    sourceText: fallbackValue,
    namespace: ns,
  });
  
  scheduleFlush();
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flushMissingQueue();
  }, 2000); // Batch after 2s of inactivity
}

async function flushMissingQueue() {
  if (missingQueue.length === 0) return;
  
  const batch = missingQueue.splice(0, 50);
  missingQueue = []; // Clear remaining — they'll be re-queued if they fail
  
  try {
    const resp = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keys: batch }),
    });
    
    if (!resp.ok) return;
    
    const data = await resp.json();
    if (!data.translations) return;
    
    // Inject translations live into i18n
    for (const t of data.translations) {
      const langMap = {
        de: t.de, en: t.en, fr: t.fr, es: t.es, it: t.it, el: t.el, tr: t.tr,
      };
      
      for (const [lang, value] of Object.entries(langMap)) {
        if (value) {
          i18n.addResource(lang, t.namespace || 'translation', t.key, value, {
            silent: true,
          });
        }
      }
    }
    
    // Cache to localStorage for next launch
    cacheDynamicTranslations(data.translations);
    
    // Trigger re-render
    i18n.emit('added');
  } catch (err) {
    // Silent fail — fallback to English is already in place
    if (import.meta.env.DEV) console.warn('[i18n] Auto-translation failed:', err);
  }
}

function cacheDynamicTranslations(translations) {
  try {
    const cache = JSON.parse(localStorage.getItem(DYNAMIC_CACHE_KEY) || '{}');
    for (const t of translations) {
      cache[t.key] = {
        de: t.de, en: t.en, fr: t.fr, es: t.es,
        it: t.it, el: t.el, tr: t.tr,
      };
    }
    localStorage.setItem(DYNAMIC_CACHE_KEY, JSON.stringify(cache));
  } catch {}
}

function loadCachedTranslations() {
  try {
    const cache = JSON.parse(localStorage.getItem(DYNAMIC_CACHE_KEY) || '{}');
    let count = 0;
    for (const [key, langs] of Object.entries(cache)) {
      for (const [lang, value] of Object.entries(langs)) {
        if (value) {
          i18n.addResource(lang, 'translation', key, value, { silent: true });
          count++;
        }
      }
    }
    if (count > 0 && import.meta.env.DEV) {
      console.log(`[i18n] Loaded ${count} cached dynamic translations`);
    }
  } catch {}
}

// ─── Dynamic Translation Loading from Supabase ─────────────

async function loadDynamicTranslations(lang) {
  try {
    // Use Supabase RPC to fetch all translations for this language
    const supabaseUrl = SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!anonKey) return;
    
    const resp = await fetch(
      `${supabaseUrl}/rest/v1/rpc/rpc_get_i18n_translations`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
        },
        body: JSON.stringify({ lang }),
      }
    );
    
    if (!resp.ok) return;
    
    const data = await resp.json();
    if (!Array.isArray(data)) return;
    
    let count = 0;
    for (const row of data) {
      if (row.translation) {
        i18n.addResource(lang, row.namespace || 'translation', row.key, row.translation, {
          silent: true,
        });
        count++;
      }
    }
    
    if (count > 0 && import.meta.env.DEV) {
      console.log(`[i18n] Loaded ${count} dynamic translations for ${lang}`);
    }
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[i18n] Dynamic load failed:', err);
  }
}

// ─── i18n Initialization ───────────────────────────────────

i18n
  .use(initReactI18next)
  .init({
    resources: {
      de: { translation: de },
      en: { translation: en },
      fr: { translation: fr },
      es: { translation: es },
      it: { translation: it },
      el: { translation: el },
      tr: { translation: tr },
    },
    lng: getInitialLanguage(),
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGUAGES,
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
    returnNull: false,
    returnEmptyString: false,
    
    // ─── Auto-translation config ──────────────────────────
    saveMissing: true,
    saveMissingPlurals: true,
    missingKeyHandler: (lngs, ns, key, fallbackValue, options) => {
      // Queue for auto-translation
      // fallbackValue is the defaultValue from t("key", { defaultValue: "..." })
      // or the key string itself if no defaultValue was provided
      addToMissingQueue(Array.isArray(lngs) ? lngs[0] : lngs, ns, key, fallbackValue);
      
      // Return false to let i18next use its normal fallback behavior
      return false;
    },
  });

// Load cached dynamic translations immediately (sync, from localStorage)
loadCachedTranslations();

// Load dynamic translations from Supabase (async, from DB)
const currentLang = i18n.language || 'en';
loadDynamicTranslations(currentLang);

// ─── Language Switching ───────────────────────────────────

export async function changeLanguage(lang) {
  if (!SUPPORTED_LANGUAGES.includes(lang)) return;
  localStorage.setItem(STORAGE_KEY, lang);
  await i18n.changeLanguage(lang);
  try { document.documentElement.lang = lang; } catch {}
  
  // Load dynamic translations for the new language
  loadDynamicTranslations(lang);
}

export async function setLanguageFromProfile(profileLocale) {
  if (profileLocale && SUPPORTED_LANGUAGES.includes(profileLocale)) {
    localStorage.setItem(STORAGE_KEY, profileLocale);
    await i18n.changeLanguage(profileLocale);
    try { document.documentElement.lang = profileLocale; } catch {}
    loadDynamicTranslations(profileLocale);
  }
}

try { document.documentElement.lang = i18n.language || 'en'; } catch {}

// ─── Helper: Translate new text manually ──────────────────
// Usage: import { translateNewText } from '../i18n';
// await translateNewText('mynamespace.mykey', 'Deutscher Text', 'mynamespace');
export async function translateNewText(key, sourceText, namespace = 'translation') {
  try {
    const resp = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keys: [{ key, sourceText, namespace }] }),
    });
    
    if (!resp.ok) return false;
    
    const data = await resp.json();
    if (!data.translations || data.translations.length === 0) return false;
    
    const t = data.translations[0];
    const langMap = {
      de: t.de, en: t.en, fr: t.fr, es: t.es, it: t.it, el: t.el, tr: t.tr,
    };
    
    for (const [lang, value] of Object.entries(langMap)) {
      if (value) {
        i18n.addResource(lang, namespace, key, value, { silent: true });
      }
    }
    
    cacheDynamicTranslations(data.translations);
    i18n.emit('added');
    return true;
  } catch {
    return false;
  }
}

// ─── Helper: Flush pending translations ─────────────────────
// Call on app resume / visibility change
export function flushPendingTranslations() {
  if (missingQueue.length > 0) {
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
    flushMissingQueue();
  }
}

export default i18n;
