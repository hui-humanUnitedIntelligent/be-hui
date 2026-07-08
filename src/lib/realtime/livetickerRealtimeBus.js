/**
 * livetickerRealtimeBus — Shared Owner für hui_liveticker_rt
 *
 * Mehrere useLiveTicker()-Instanzen (Home, Discover, Impact) teilen
 * einen Channel; jede Instanz registriert einen Listener.
 */
import { supabase } from '../supabaseClient';

const TOPIC = 'hui_liveticker_rt';
const listeners = new Set();
let channelRef = null;
let createdHere = false;
let channelStatus = 'idle';
const statusListeners = new Set();

function dispatch(type, payload) {
  listeners.forEach((fn) => {
    try { fn(type, payload); } catch (_) { /* non-blocking */ }
  });
}

function notifyStatus(status) {
  channelStatus = status;
  statusListeners.forEach((fn) => {
    try { fn(status); } catch (_) { /* non-blocking */ }
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
      table: 'works',
      filter: 'status=eq.published',
    }, (p) => {
      if (p.new?.approval_status !== 'approved') return;
      dispatch('works', p.new);
    })
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'experiences',
      filter: 'status=eq.published',
    }, (p) => {
      if (p.new?.approval_status !== 'approved') return;
      dispatch('experiences', p.new);
    })
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'invitations',
      filter: 'visibility=eq.public',
    }, (p) => {
      const inv = p.new;
      if (!inv || inv.status !== 'active') return;
      if (inv.expires_at && new Date(inv.expires_at) < new Date()) return;
      dispatch('invitations', inv);
    })
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'talents',
    }, (p) => {
      if (p.new?.status !== 'approved') return;
      dispatch('talents', p.new);
    })
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'talents',
    }, (p) => {
      if (p.new?.status !== 'approved' || p.old?.status === 'approved') return;
      dispatch('talents', p.new);
    })
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'impact_applications',
    }, (p) => {
      if (p.new?.status !== 'approved' || p.old?.status === 'approved') return;
      dispatch('impact_applications', p.new);
    })
    .subscribe((status) => {
      notifyStatus(status);
    });
  createdHere = true;
}

/**
 * @param {(table: string, row: object) => void} listener
 * @returns {() => void}
 */
export function subscribeLivetickerRealtime(listener) {
  listeners.add(listener);
  ensureChannel();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && channelRef && createdHere) {
      supabase.removeChannel(channelRef);
      channelRef = null;
      createdHere = false;
      channelStatus = 'idle';
    }
  };
}

/**
 * @param {(status: string) => void} listener
 * @returns {() => void}
 */
export function subscribeLivetickerStatus(listener) {
  statusListeners.add(listener);
  ensureChannel();
  if (channelStatus !== 'idle') listener(channelStatus);
  return () => statusListeners.delete(listener);
}

export const LIVETICKER_RT_TOPIC = TOPIC;
