/**
 * votesRealtimeBus — Shared Owner für votes_rt_main
 *
 * Ein Channel, mehrere Listener (ImpactPage Stimmen-UI + useLiveTicker).
 * Dedupe-Muster wie useProfileLocations.js — kein doppeltes Subscriben.
 */
import { supabase } from '../supabaseClient';

const TOPIC = 'votes_rt_main';
const listeners = new Set();
let channelRef = null;
let createdHere = false;

function dispatch(payload) {
  listeners.forEach((fn) => {
    try { fn(payload); } catch (_) { /* listener darf UI nicht crashen */ }
  });
}

function ensureChannel() {
  if (channelRef) return;

  const existing = supabase.getChannels().find((c) => c.topic === `realtime:${TOPIC}`);
  if (existing) {
    channelRef = existing;
    createdHere = false;
    return;
  }

  channelRef = supabase
    .channel(TOPIC)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'impact_votes',
    }, (payload) => dispatch(payload))
    .subscribe();
  createdHere = true;
}

/**
 * @param {(payload: { new: object }) => void} listener
 * @returns {() => void} unsubscribe
 */
export function subscribeVotesRealtime(listener) {
  listeners.add(listener);
  ensureChannel();

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && channelRef && createdHere) {
      supabase.removeChannel(channelRef);
      channelRef = null;
      createdHere = false;
    }
  };
}

export const VOTES_RT_TOPIC = TOPIC;
