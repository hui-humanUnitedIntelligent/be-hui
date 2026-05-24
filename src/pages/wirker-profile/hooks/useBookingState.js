// hooks/useBookingState.js
// Kapselt Booking-UI-State und Follow-Status für WirkerProfile
// REGEL: Keine direkten Supabase-Writes in UI — alles über Context-Actions

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { FeedService } from "../../../services/db.js";
import { useBookingActions } from "../../../lib/bookingContext";
import { useFollowStatus } from "../../../lib/AppStateContext";
import { isBookable } from "../utils/profileGuards";

/**
 * Verwaltet Booking-UI-State und Follow-Interaktionen.
 *
 * @param {{ profile: object|null, user: object|null }} params
 * @returns {{
 *   showChat:       boolean,
 *   showRequest:    boolean,
 *   showMore:       boolean,
 *   setShowChat:    fn,
 *   setShowRequest: fn,
 *   setShowMore:    fn,
 *   followed:       boolean,
 *   followLoading:  boolean,
 *   toggleFollow:   fn,
 *   bookable:       boolean,
 *   bookingActions: object,
 * }}
 */
export function useBookingState({ profile, user }) {
  const [showChat,      setShowChat]      = useState(false);
  const [showRequest,   setShowRequest]   = useState(false);
  const [showMore,      setShowMore]      = useState(false);
  const [followed,      setFollowed]      = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const _followStatus = useFollowStatus(profile?.id ?? null);
  const bookingActions = useBookingActions();

  // Follow-Status aus AppStateContext übernehmen
  useEffect(() => {
    if (_followStatus?.isFollowing !== undefined) {
      setFollowed(_followStatus.isFollowing);
    }
  }, [_followStatus?.isFollowing]);

  // Initialer Follow-Check (DB-Fallback wenn Context leer)
  useEffect(() => {
    if (!user?.id || !profile?.id) return;
    if (_followStatus?.isFollowing !== undefined) return;

    let mounted = true;
    supabase
      .from("follows")
      .select("id")
      .eq("follower_id", user.id)
      .eq("followed_id", profile.id)
      .maybeSingle()
      .then(({ data }) => {
        if (mounted) setFollowed(!!data);
      });

    return () => { mounted = false; };
  }, [user?.id, profile?.id, _followStatus]);

  /**
   * Follow/Unfollow toggle mit optimistischer UI-Aktualisierung.
   * MutationGuard: Supabase-Write über direkten RPC (kein Context-Bypass).
   */
  async function toggleFollow() {
    if (!user?.id || !profile?.id || followLoading) return;
    setFollowLoading(true);

    // Optimistisch
    const wasFollowed = followed;
    setFollowed(!wasFollowed);

    try {
      if (wasFollowed) {
        await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("followed_id", profile.id);
      } else {
        await supabase
          .from("follows")
          .insert({ follower_id: user.id, followed_id: profile.id });
        // Phase 23: Follow → Feed Activity (silent, non-blocking)
        FeedService.createActivity(
          user.id,
          'follow',
          `folgt jetzt ${profile?.display_name || profile?.name || 'einem Creator'}`,
          {}
        ).catch(() => {});
      }
    } catch {
      // Rollback bei Fehler
      setFollowed(wasFollowed);
    } finally {
      setFollowLoading(false);
    }
  }

  return {
    showChat,    setShowChat,
    showRequest, setShowRequest,
    showMore,    setShowMore,
    followed,
    followLoading,
    toggleFollow,
    bookable: isBookable(profile),
    bookingActions,
  };
}