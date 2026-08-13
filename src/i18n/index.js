// ══════════════════════════════════════════════════════════
// src/i18n/index.js — HUI i18n Engine (SSOT für Sprachlogik)
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
  });

export function changeLanguage(lang) {
  if (!SUPPORTED_LANGUAGES.includes(lang)) return;
  localStorage.setItem(STORAGE_KEY, lang);
  i18n.changeLanguage(lang);
  try { document.documentElement.lang = lang; } catch {}
}

export function setLanguageFromProfile(profileLocale) {
  if (profileLocale && SUPPORTED_LANGUAGES.includes(profileLocale)) {
    localStorage.setItem(STORAGE_KEY, profileLocale);
    i18n.changeLanguage(profileLocale);
  }
}

try { document.documentElement.lang = i18n.language || 'en'; } catch {}

export default i18n;
