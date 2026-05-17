// ═══════════════════════════════════════════════════════════════
// STATUS: LEGACY — Phase 4A.5
// Diese Datei wird von keinem aktiven Modul importiert.
// NICHT LÖSCHEN — nur dokumentiert für spätere Bereinigung.
// Ersatz: siehe docs/LEGACY_MAP.md
// ═══════════════════════════════════════════════════════════════
// src/hooks/useProfile.v2.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { ProfileService } from '../services/db';

export function useProfile(userId) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(!!userId);
  const [error,   setError]   = useState(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    if (!userId) { setLoading(false); return; }
    setLoading(true);

    (async () => {
      const { data, error: err } = await ProfileService.getById(userId);
      if (!mounted.current) return;
      setProfile(data);
      setError(err?.message || null);
      setLoading(false);
    })();

    return () => { mounted.current = false; };
  }, [userId]);

  const updateProfile = useCallback(async (updates) => {
    const { data, error: err } = await ProfileService.update(userId, updates);
    if (data) setProfile(data);
    return { data, error: err };
  }, [userId]);

  return { profile, loading, error, updateProfile };
}

export function useProfileUpdate() {
  const [saving, setSaving] = useState(false);
  const save = useCallback(async (userId, updates) => {
    setSaving(true);
    const result = await ProfileService.update(userId, updates);
    setSaving(false);
    return result;
  }, []);
  return { save, saving };
}
