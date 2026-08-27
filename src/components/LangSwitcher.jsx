// src/components/LangSwitcher.jsx
// Sprachumschalter — EAGER import, KEIN lazy loading, KEIN dynamic import().
// Nutzt useTranslation Hook für CustomEvent-basierte Sprachwechsel ohne Reload.

import { SUPPORTED_LANGS, LANG_LABELS, LANG_FLAGS } from '../i18n/index.js';
import { useTranslation } from '../hooks/useTranslation.js';

export default function LangSwitcher({ style = {}, selectStyle = {} }) {
  const { lang, changeLang } = useTranslation();

  return (
    <div style={{ position: 'relative', display: 'inline-block', ...style }}>
      <select
        value={lang}
        onChange={(e) => changeLang(e.target.value)}
        style={{
          background: 'transparent',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '8px',
          color: 'inherit',
          padding: '6px 12px',
          fontSize: '14px',
          cursor: 'pointer',
          appearance: 'none',
          WebkitAppearance: 'none',
          ...selectStyle,
        }}
        aria-label="Language / Sprache"
      >
        {SUPPORTED_LANGS.map(l => (
          <option key={l} value={l}>
            {LANG_FLAGS[l]} {l.toUpperCase()}
          </option>
        ))}
      </select>
    </div>
  );
}
