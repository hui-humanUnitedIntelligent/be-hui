// ══════════════════════════════════════════════════════════════════════════════
// DesktopCommandPalette.jsx — HUI Desktop V3 — Ctrl+K
// ══════════════════════════════════════════════════════════════════════════════
//
// Spotlight-artig. Suche + Navigation + Aktionen. Tastatur: ↑↓ Enter ESC.
//
// DATEN: SearchService.search() (unverändert)
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchService } from '../../services/db.js';

const NAV_COMMANDS = [
  { id: 'nav-home',     label: 'Home',        sub: 'Der lebendige Raum', action: '/Home',     group: 'Navigation' },
  { id: 'nav-discover', label: 'Entdecken',    sub: 'Werke, Talente, Projekte', action: '/discover', group: 'Navigation' },
  { id: 'nav-studio',   label: 'Studio',       sub: 'Werke & Erlebnisse verwalten', action: '/studio', group: 'Navigation' },
  { id: 'nav-impact',   label: 'Impact',       sub: 'Wirkung entfalten', action: '/impact',   group: 'Navigation' },
  { id: 'nav-profile',  label: 'Mein Profil',  sub: 'Profil ansehen', action: '/profile/me', group: 'Navigation' },
];
const ACTION_COMMANDS = [
  { id: 'act-create', label: 'Werk erstellen', sub: 'Im Studio veröffentlichen', action: '/studio', group: 'Aktionen' },
  { id: 'act-impact', label: 'Projekt unterstützen', sub: 'Impact schaffen', action: '/impact', group: 'Aktionen' },
];

export default function DesktopCommandPalette({ onClose }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ profiles: [], works: [], experiences: [] });
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const timer = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (query.trim().length < 2) { setResults({ profiles: [], works: [], experiences: [] }); return; }
    setLoading(true);
    timer.current = setTimeout(async () => {
      try { setResults(await SearchService.search(query.trim(), { limit: 4 })); }
      catch (e) { console.error('[CmdK] search:', e); }
      finally { setLoading(false); setActiveIndex(0); }
    }, 250);
  }, [query]);

  function buildCommands() {
    const cmds = [];
    if (query.trim().length < 2) {
      [...NAV_COMMANDS, ...ACTION_COMMANDS].forEach(c => cmds.push({ ...c, type: 'nav' }));
    } else {
      (results.profiles || []).forEach(p => cmds.push({ id: `p-${p.id}`, label: p.display_name || p.username, sub: p.talent || 'Mitglied', group: 'Menschen', type: 'profile', data: p }));
      (results.works || []).forEach(w => cmds.push({ id: `w-${w.id}`, label: w.title, sub: 'Werk', group: 'Werke', type: 'work', data: w }));
      (results.experiences || []).forEach(e => cmds.push({ id: `e-${e.id}`, label: e.title, sub: 'Erlebnis', group: 'Erlebnisse', type: 'experience', data: e }));
      [...NAV_COMMANDS, ...ACTION_COMMANDS].filter(c => c.label.toLowerCase().includes(query.toLowerCase())).forEach(c => cmds.push({ ...c, type: 'nav' }));
    }
    return cmds;
  }

  const commands = buildCommands();

  function execute(cmd) {
    onClose();
    if (cmd.type === 'nav') navigate(cmd.action);
    else if (cmd.type === 'profile') navigate(`/profile/${cmd.data.username || cmd.data.id}`);
    else if (cmd.type === 'work') navigate(`/work/${cmd.data.id}`);
    else if (cmd.type === 'experience') navigate('/discover');
  }

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') { e.preventDefault(); onClose(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(p => Math.min(p + 1, commands.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(p => Math.max(p - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (commands[activeIndex]) execute(commands[activeIndex]); }
  }, [activeIndex, commands, onClose]);

  useEffect(() => {
    listRef.current?.querySelector(`[data-i="${activeIndex}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  let lastGroup = '';

  return (
    <div className="cmdk-overlay" onKeyDown={handleKeyDown}>
      <div className="cmdk-backdrop" onClick={onClose} />
      <div className="cmdk">
        <div className="cmdk-input-row">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="9" r="6" /><path d="M17 17l-3.5-3.5" /></svg>
          <input ref={inputRef} type="text" placeholder="Suche oder navigiere…" value={query} onChange={(e) => setQuery(e.target.value)} />
          <kbd>ESC</kbd>
        </div>
        <div className="cmdk-list" ref={listRef}>
          {commands.length === 0 && query.trim().length >= 2 && !loading && <div className="cmdk-status">Keine Ergebnisse.</div>}
          {loading && <div className="cmdk-status">Suche läuft…</div>}
          {commands.map((cmd, i) => {
            const showGroup = cmd.group !== lastGroup;
            lastGroup = cmd.group;
            return (
              <div key={cmd.id}>
                {showGroup && <div className="cmdk-group">{cmd.group}</div>}
                <button data-i={i} className={`cmdk-item ${i === activeIndex ? 'active' : ''}`} onClick={() => execute(cmd)} onMouseEnter={() => setActiveIndex(i)}>
                  <span className="cmdk-item-label">{cmd.label}</span>
                  <span className="cmdk-item-sub">{cmd.sub}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
