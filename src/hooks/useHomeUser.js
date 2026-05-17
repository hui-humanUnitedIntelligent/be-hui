// src/hooks/useHomeUser.js
// HUI — Home User State — Phase 5B
// ═══════════════════════════════════════════════════════════════
//
// ZWECK:
// Trennt den User-State aus Home.jsx heraus.
// Verwaltet: userName, currentUser, isTalent, isWirker
// Single source of truth für user-derivierte Werte in Home.
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';

export function useHomeUser({ user, authProfile, authIsWirker, hasTalentProfile }) {
  // Talent-Status: sofort aus localStorage (kein Flicker),
  // dann von AuthContext überschrieben sobald Supabase antwortet
  const [isTalent, setIsTalent] = useState(
    () => localStorage.getItem('hui_talent') === '1'
  );
  const [isWirker,     setIsWirker]     = useState(false);
  const [userName,     setUserName]     = useState('');
  const [currentUser,  setCurrentUser]  = useState(null);

  // Supabase-bestätigter Talent-Status → lock in
  useEffect(() => {
    if (hasTalentProfile) {
      localStorage.setItem('hui_talent', '1');
      setIsTalent(true);
    }
    // IMPORTANT: setIsTalent(false) nur bei explizitem User-Cancel
  }, [hasTalentProfile]);

  // Safety net: re-read localStorage on mount
  useEffect(() => {
    if (localStorage.getItem('hui_talent') === '1') setIsTalent(true);
  }, []);

  // Sync wirker status
  useEffect(() => {
    if (authIsWirker || hasTalentProfile) setIsWirker(true);
  }, [authIsWirker, hasTalentProfile]);

  // Profile sync
  useEffect(() => {
    if (authProfile) {
      setCurrentUser(authProfile);
      setUserName(authProfile.display_name || authProfile.email?.split('@')[0] || '');
    }
  }, [authProfile?.id]);

  return { isTalent, isWirker, userName, currentUser };
}
