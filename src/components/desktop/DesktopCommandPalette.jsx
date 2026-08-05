// ══════════════════════════════════════════════════════════════════════════════
// DesktopCommandPalette.jsx — HUI Desktop Command Palette (Phase 2)
// ══════════════════════════════════════════════════════════════════════════════
//
// Ctrl+K öffnet eine globale Command Palette.
// Wie Spotlight / Notion — zentriert, elegant, tastaturgesteuert.
//
// Enthält:
//   - Suche (via SearchService — Menschen, Werke, Erlebnisse)
//   - Navigation (Home, Discover, Studio, Impact, Profil)
//   - Aktionen (Erstellen, Abmelden)
//
// Tastatur: ↑↓ Enter ESC Tab
// Business-Logik: SearchService (unverändert)
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchService } from '../../services/db.js';
import { useAuth } from '../../lib/AuthContext.jsx';

// ── Navigation Commands ──────────────────────────────────────────────────────
const NAV_COMMANDS = [
  { id: 'nav-home',     label: 'Home',         sub: 'Mission Control & Feed', action: '/Home',     icon: 'home',     group: 'Navigation' },
  { id: 'nav-discover', label: 'Entdecken',     sub: 'Werke, Talente, Projekte', action: '/discover',  icon: 'discover', group: 'Navigation' },
  { id: 'nav-studio',   label: 'Studio',        sub: 'Werke & Erlebnisse verwalten', action: '/studio',   icon: 'studio',   group: 'Navigation' },
  { id: 'nav-impact',   label: 'Impact',        sub: 'Wirkung entfalten', action: '/impact',   icon: 'impact',   group: 'Navigation' },
  { id: 'nav-profile',  label: 'Mein Profil',   sub: 'Profil ansehen', action: '/profile/me', icon: 'profile',  group: 'Navigation' },
];

const ACTION_COMMANDS = [
  { id: 'act-create-work',  label: 'Werk erstellen',    sub: 'Neues Werk veröffentlichen', action: '/studio', icon: 'create', group: 'Aktionen' },
  { id: 'act-create-exp',   label: 'Erlebnis anbieten',  sub: 'Termin öffnen',          action: '/studio', icon: 'create', group: 'Aktionen' },
  { id: 'act-impact',       label: 'Projekt unterstützen', sub: 'Impact schaffen',    action: '/impact', icon: 'impact', group: 'Aktionen' },
];

// ── Icon ──────────────────────────────────────────────────────────────────────
const ICON_PATHS = {
  home: <path d="M3 9.5L10 4l7 5.5V16a1 1 0 0 1-1 1h-3v-4H7v4H4a1 1 0 0 1-1-1V9.5z" />,
  discover: <><circle cx="10" cy="10" r="7" /><path d="M13.5 6.5l-2 4.5-4.5 2 2-4.5 4.5-2z" /></>,
  impact: <path d="M10 2v6l4 2-4 8v-6l-4-2 4-8z" />,
  studio: <><rect x="3" y="4" width="14" height="12" rx="2" /><path d="M3 8h14M7 4v4M13 4v4" /></>,
  profile: <><circle cx="10" cy="7" r="3" /><path d="M4 17c0-3 3-5 6-5s6 2 6 5" /></>,
  create: <path d="M10 4v12M4 10h12" />,
  person: <><circle cx="10" cy="7" r="3" /><path d="M4 17c0-3 3-5 6-5s6 2 6 5" /></>,
  work: <><rect x="3" y="3" width="14" height="14" rx="2" /><path d="M3 13l4-4 5 5M13 9l4 4" /></>,
  experience: <><circle cx="10" cy="10" r="7" /><path d="M10 6v4l2 2" /></>,
};

function CmdIcon({ name }) {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {ICON_PATHS[name] || null}
    </svg>
  );
}

// ── Hauptkomponente ──────────────────────────────────────────────────────────
export default function DesktopCommandPalette({ onClose }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ profiles: [], works: [], experiences: [] });
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const searchTimer = useRef(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (query.trim().length < 2) {
      setSearchResults({ profiles: [], works: [], experiences: [] });
      return;
    }
    setSearchLoading(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const results = await SearchService.search(query.trim(), { limit: 4 });
        setSearchResults(results);
      } catch (e) {
        console.error('[CmdPalette] Search:', e);
      } finally {
        setSearchLoading(false);
      }
      setActiveIndex(0);
    }, 250);
  }, [query]);

  // Build command list
  const commands = useCallback(() => {
    const cmds = [];
    if (query.trim().length < 2) {
      // Show navigation + actions
      [...NAV_COMMANDS, ...ACTION_COMMANDS].forEach(c => cmds.push({ ...c, type: 'nav' }));
    } else {
      // Show search results + matching nav
      (searchResults.profiles || []).forEach(p => cmds.push({
        id: `s-p-${p.id}`, label: p.display_name || p.username, sub: p.talent || 'Mitglied', icon: 'person', group: 'Menschen', type: 'profile', data: p,
      }));
      (searchResults.works || []).forEach(w => cmds.push({
        id: `s-w-${w.id}`, label: w.title, sub: w.category || 'Werk', icon: 'work', group: 'Werke', type: 'work', data: w,
      }));
      (searchResults.experiences || []).forEach(e => cmds.push({
        id: `s-e-${e.id}`, label: e.title, sub: e.category || 'Erlebnis', icon: 'experience', group: 'Erlebnisse', type: 'experience', data: e,
      }));
      // Filter nav commands by query
      [...NAV_COMMANDS, ...ACTION_COMMANDS]
        .filter(c => c.label.toLowerCase().includes(query.toLowerCase()))
        .forEach(c => cmds.push({ ...c, type: 'nav' }));
    }
    return cmds;
  }, [query, searchResults]);

  const allCommands = commands();

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => Math.min(prev + 1, allCommands.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const cmd = allCommands[activeIndex];
      if (cmd) executeCommand(cmd);
    }
  }, [activeIndex, allCommands, onClose]);

  // Execute command
  function executeCommand(cmd) {
    onClose();
    if (cmd.type === 'nav') {
      navigate(cmd.action);
    } else if (cmd.type === 'profile') {
      navigate(`/profile/${cmd.data.username || cmd.data.id}`);
    } else if (cmd.type === 'work') {
      navigate(`/work/${cmd.data.id}`);
    } else if (cmd.type === 'experience') {
      navigate('/discover');
    }
  }

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [activeIndex]);

  // Group commands
  let lastGroup = '';

  return (
    <div className="dcpalette-overlay" onKeyDown={handleKeyDown}>
      <div className="dcpalette-backdrop" onClick={onClose} />
      <div className="dcpalette">
        <div className="dcpalette-input">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="9" r="6" /><path d="M17 17l-3.5-3.5" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Suche Menschen, Werke, Erlebnisse oder navigiere…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Command Palette"
          />
          <kbd className="dcpalette-kbd">ESC</kbd>
        </div>
        <div className="dcpalette-list" ref={listRef}>
          {allCommands.length === 0 && query.trim().length >= 2 && !searchLoading && (
            <div className="dcpalette-empty">Keine Ergebnisse für „{query}"</div>
          )}
          {searchLoading && (
            <div className="dcpalette-loading">Suche läuft…</div>
          )}
          {allCommands.map((cmd, i) => {
            const showGroup = cmd.group !== lastGroup;
            lastGroup = cmd.group;
            return (
              <div key={cmd.id}>
                {showGroup && <div className="dcpalette-group">{cmd.group}</div>}
                <button
                  data-index={i}
                  className={`dcpalette-item ${i === activeIndex ? 'active' : ''}`}
                  onClick={() => executeCommand(cmd)}
                  onMouseEnter={() => setActiveIndex(i)}
                >
                  <span className="dcpalette-item-icon"><CmdIcon name={cmd.icon} /></span>
                  <span className="dcpalette-item-label">{cmd.label}</span>
                  <span className="dcpalette-item-sub">{cmd.sub}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
