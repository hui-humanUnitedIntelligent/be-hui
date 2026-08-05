// ══════════════════════════════════════════════════════════════════════════════
// useKeyboardShortcuts.js — Global Desktop Keyboard Shortcut Framework
// ══════════════════════════════════════════════════════════════════════════════
//
// ZWECK:
//   Zentrales Keyboard-Shortcut-System für die Desktop-Plattform.
//   Registriert Shortcuts mit Beschreibung (für Help-Overlay).
//   Verhindert Konflikte (spätere Registrierung überschreibt frühere).
//
// USAGE:
//   useKeyboardShortcuts({
//     '/':     { action: () => openSearch(),          description: 'Suche öffnen' },
//     'cmd+k': { action: () => openCommandPalette(),  description: 'Command Palette' },
//     'esc':   { action: () => closeAll(),            description: 'Alles schließen' },
//   });
//
// SHORTCUT FORMAT:
//   'key'              — einzelne Taste: '/', 'j', 'k'
//   'cmd+key'          — Ctrl/Cmd + Taste: 'cmd+k', 'cmd+/'
//   'shift+key'        — Shift + Taste: 'shift+/'
//   'g+h'              — Sequenz: erst 'g', dann 'h'
//
// REGEL:
//   Shortcuts werden NIE in Input/Textarea/ContentEditable ausgelöst.
//   Außer: 'esc' funktioniert immer.
// ══════════════════════════════════════════════════════════════════════════════

import { useEffect, useRef } from 'react';

const INPUT_TAGS = ['INPUT', 'TEXTAREA', 'SELECT', 'CONTENTEDITABLE'];

function isTypingInInput(e) {
  const target = e.target;
  if (!target) return false;
  if (target.isContentEditable) return true;
  if (INPUT_TAGS.includes(target.tagName)) return true;
  return false;
}

function matchShortcut(shortcut, e) {
  const parts = shortcut.toLowerCase().split('+');
  const key = parts[parts.length - 1];

  if (shortcut === 'esc' || shortcut === 'escape') {
    return e.key === 'Escape';
  }

  const hasCmd  = parts.includes('cmd') || parts.includes('ctrl');
  const hasShift = parts.includes('shift');
  const hasAlt   = parts.includes('alt');

  if (hasCmd  && !(e.metaKey || e.ctrlKey))  return false;
  if (hasShift && !e.shiftKey)               return false;
  if (hasAlt   && !e.altKey)                 return false;
  if (!hasCmd  && (e.metaKey || e.ctrlKey))  return false;
  if (!hasShift && e.shiftKey && key.length === 1) return false;

  return e.key.toLowerCase() === key;
}

export function useKeyboardShortcuts(shortcuts = {}) {
  // Sequenz-State: 'g' wartet auf nächsten Tastendruck
  const sequenceRef = useRef(null);
  const sequenceTimer = useRef(null);

  useEffect(() => {
    const entries = Object.entries(shortcuts);
    if (entries.length === 0) return;

    function handleKeyDown(e) {
      // ESC funktioniert immer — auch in Inputs
      if (e.key === 'Escape' && shortcuts['esc']) {
        shortcuts['esc'].action();
        return;
      }

      // Andere Shortcuts nicht in Inputs
      if (isTypingInInput(e)) return;

      // Sequenz-Handling: 'g+h' → erst 'g', dann 'h'
      const sequenceKeys = entries.filter(([s]) => s.includes('+') === false && s.length > 1 && s !== 'esc' && !s.includes('+'));

      // Prüfe Sequenz-Fortsetzung
      if (sequenceRef.current) {
        const pending = sequenceRef.current;
        const fullShortcut = `${pending}+${e.key.toLowerCase()}`;

        const match = entries.find(([s]) => s === fullShortcut);
        if (match) {
          e.preventDefault();
          match[1].action();
          sequenceRef.current = null;
          if (sequenceTimer.current) clearTimeout(sequenceTimer.current);
          return;
        }

        // Sequenz abgelaufen, reset
        sequenceRef.current = null;
        if (sequenceTimer.current) clearTimeout(sequenceTimer.current);
      }

      // Prüfe Sequenz-Start
      const sequenceStarts = entries.filter(([s]) => s.includes('+') === false && s.length > 1 && s !== 'esc' && !s.includes('+'));
      // Actually, let me handle sequences differently — look for shortcuts with '+' that aren't cmd/shift/alt
      const sequenceShortcuts = entries.filter(([s]) => {
        const parts = s.split('+');
        return parts.length === 2 && !['cmd', 'ctrl', 'shift', 'alt'].includes(parts[0]);
      });

      if (sequenceShortcuts.length > 0) {
        const firstKeys = [...new Set(sequenceShortcuts.map(([s]) => s.split('+')[0]))];
        if (firstKeys.includes(e.key.toLowerCase())) {
          sequenceRef.current = e.key.toLowerCase();
          if (sequenceTimer.current) clearTimeout(sequenceTimer.current);
          sequenceTimer.current = setTimeout(() => {
            sequenceRef.current = null;
          }, 600); // 600ms Timeout für Sequenz
          return;
        }
      }

      // Normale Single-Key + Modifier Shortcuts
      for (const [shortcut, config] of entries) {
        if (shortcut === 'esc') continue;
        if (shortcut.includes('+') && !['cmd', 'ctrl', 'shift', 'alt'].includes(shortcut.split('+')[0])) continue;
        if (!shortcut.includes('+') && shortcut.length > 1 && sequenceShortcuts.some(([s]) => s.split('+')[0] === shortcut)) continue;

        if (matchShortcut(shortcut, e)) {
          e.preventDefault();
          config.action();
          return;
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

export default useKeyboardShortcuts;
