// src/hooks/useTranslation.js
// Hook für komponenten-lokalen Zugriff auf das i18n-System.
// EAGER import — KEIN lazy loading, KEIN dynamic import().
// Nutzt NICHT die Supabase i18n_translations Tabelle. Alle Texte sind lokal.
// CustomEvent-basiert: Sprachwechsel ohne Reload, ohne White Screen.

import { useState, useCallback, useEffect } from 'react';
import { t, SUPPORTED_LANGS, detectSystemLang } from '../i18n/index.js';

const LANG_CHANGE_EVENT = 'hui_lang_change';

export function useTranslation() {
  const [lang, setLang] = useState(() => detectSystemLang());

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

  const changeLang = useCallback((newLang) => {
    if (!SUPPORTED_LANGS.includes(newLang)) return;
    localStorage.setItem('hui_lang', newLang);
    window.dispatchEvent(
      new CustomEvent(LANG_CHANGE_EVENT, { detail: { lang: newLang } })
    );
    setLang(newLang);
  }, []);

  return { t: translate, lang, changeLang };
}
