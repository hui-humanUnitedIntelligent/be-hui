// src/hooks/useProfile.js — v2
// Service-backed, no direct supabase queries
import { useProfile, useProfileUpdate } from './useProfile.v2';
import { useTalentProfile } from './useTalentProfile';
import { supabase } from '.../lib/supabaseClient';
import { ProfileService } from '../services/db';
import { useState, useEffect, useRef } from 'react';

// Re-export primary hooks
export { useProfile, useProfileUpdate };

export function useMyWirkerProfile(userId) {
  const { talent, loading } = useTalentProfile(userId);
  // backward compat: expose as "wirkerProfile"
  return { wirkerProfile: talent, loading };
}
