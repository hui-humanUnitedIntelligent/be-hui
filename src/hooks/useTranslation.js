// src/hooks/useTranslation.js
// Hook für komponenten-lokalen Zugriff auf das i18n-System.
// EAGER import — KEIN lazy loading, KEIN dynamic import().
// Nutzt NICHT die Supabase i18n_translations Tabelle. Alle Texte sind lokal.
// CustomEvent-basiert: Sprachwechsel ohne Reload, ohne White Screen.

import { useState, useCallback, useEffect } from 'react';
import { t, SUPPORTED_LANGS, detectSystemLang, ensureLanguageLoaded } from '../i18n/index.js';
import { setFormatLocale } from '../lib/formatters.js';

const LANG_CHANGE_EVENT = 'hui_lang_change';

export function useTranslation() {
  const [lang, setLang] = useState(() => detectSystemLang());

  // Keep formatDateDE in sync with UI locale
  useEffect(() => {
    setFormatLocale(lang);
  }, [lang]);

  useEffect(() => {
    function onLangChange(e) {
      setLang(e.detail.lang);
    }
    window.addEventListener(LANG_CHANGE_EVENT, onLangChange);
    return () => window.removeEventListener(LANG_CHANGE_EVENT, onLangChange);
  }, []);

  const translate = useCallback(
    (key, vars = {}) => {
      let text = t(key, lang);
      Object.entries(vars).forEach(([k, v]) => {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      });
      return text;
    },
    [lang]
  );

  // PERF-I18N-SPLIT-001: ASYNC — lädt den Sprach-Chunk VOR dem Speichern und
  // Event-Feuern. Erst wenn der Chunk (oder der de-Fallback) in der Registry
  // liegt, wird gehui_lang_change dispatched → alle Hooks rendern SYNCHRON in
  // der neuen Sprache. Kein Flash, keine Roh-Keys.
  const changeLang = useCallback(async (newLang) => {
    if (!SUPPORTED_LANGS.includes(newLang)) return;
    try {
      await ensureLanguageLoaded(newLang);
    } catch (e) {
      console.error('[HUI i18n] changeLang chunk load failed:', e);
      // ensureLanguageLoaded fängt selbst ab (de-Fallback) — weiter im Fluss.
    }
    localStorage.setItem('hui_lang', newLang);
    setFormatLocale(newLang);
    window.dispatchEvent(
      new CustomEvent(LANG_CHANGE_EVENT, { detail: { lang: newLang } })
    );
    setLang(newLang);
  }, []);

  return { t: translate, lang, changeLang };
}
