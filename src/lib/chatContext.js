// chatContext.js — HUI Chat Intelligence Layer v1.1
// Phase 3D: softText Status-Übergänge
// Phase 3B: Intelligentes Creator-Kommunikationssystem
//
// CHAT TYPEN:
// direct       — einfacher Direktchat
// booking      — verknüpft mit Buchungsanfrage
// collaboration — gemeinsames Kreativprojekt
// project      — laufendes Projekt
// support      — Support-Gespräch
//
// MESSAGE TYPEN:
// text / image / voice / file
// booking_update / availability_update
// shared_work / shared_experience
// recommendation / system_message

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { feedback } from './feedback/index.js';
import { assertAuthenticated, globalMutationGuard } from './security/index.js';
import { validateMessage } from './validation/index.js';
import { supabase } from "./supabaseClient";
import { useAuth } from "./AuthContext";

// ────────────────────────────────────────────────────────────────
// Konstanten
// ────────────────────────────────────────────────────────────────
export const CHAT_TYPES = {
  direct:        { label: "Direktnachricht",   icon: "💬", color: "#16D7C5" },
  booking:       { label: "Buchungsgespräch",  icon: "📋", color: "#F59E0B" },
  collaboration: { label: "Zusammenarbeit",    icon: "🤝", color: "#8B5CF6" },
  project:       { label: "Projekt",           icon: "✦",  color: "#FF8A6B" },
  support:       { label: "Support",           icon: "💡", color: "#10B981" },
};

export const MSG_TYPES = {
  text:                { icon: null,  label: null },
  image:               { icon: "🖼",  label: "Bild" },
  voice:               { icon: "🎤",  label: "Sprachnachricht" },
  file:                { icon: "📎",  label: "Datei" },
  booking_update:      { icon: "📋",  label: "Buchungs-Update" },
  availability_update: { icon: "📅",  label: "Verfügbarkeit" },
  shared_work:         { icon: "🎨",  label: "Werk geteilt" },
  shared_experience:   { icon: "✨",  label: "Erlebnis geteilt" },
  recommendation:      { icon: "⭐",  label: "Empfehlung" },
  system_message:      { icon: "ℹ",   label: "System" },
};

// ────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────
export function formatChatTime(iso) {
  if (!iso) return "";
  const d     = new Date(iso);
  const now   = new Date();
  const diffMs = now - d;
  const diffH  = diffMs / 3600000;
  const diffD  = diffMs / 86400000;

  if (diffD < 1) {
    return d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  } else if (diffD < 7) {
    return d.toLocaleDateString("de-DE", { weekday: "short" });
  } else {
    return d.toLocaleDateString("de-DE", { day: "numeric", month: "short" });
  }
}

export function formatMsgDate(iso) {
  if (!iso) return "";
  const d   = new Date(iso);
  const now = new Date();
  const diffD = (now - d) / 86400000;
  if (diffD < 1) return "Heute";
  if (diffD < 2) return "Gestern";
  return d.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" });
}

// ────────────────────────────────────────────────────────────────
// useChatList — alle Chats des Users, sortiert + mit Kontext
// ────────────────────────────────────────────────────────────────
export function useChatList() {
  const { user } = useAuth();
  const [chats,   setChats]   = useState([]);
  const [loading, setLoading] = useState(true);
  const realtimeRef = useRef(null);

  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      // Chats laden (participant_a/b Schema)
      const { data: rawChats } = await supabase
        .from("chats")
        .select(`
          id, chat_type, state, booking_title, context_type, context_id,
          context_title, last_message, last_message_at, last_message_type,
          is_pinned, unread_a, unread_b, updated_at,
          booking_id,
          participant_a, participant_b,
          profile_a:profiles!chats_participant_a_fkey(
            id, display_name, avatar_url, username, last_seen, availability
          ),
          profile_b:profiles!chats_participant_b_fkey(
            id, display_name, avatar_url, username, last_seen, availability
          )
        `)
        .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
        .eq("state", "open")
        .order("last_message_at", { ascending: false, nullsFirst: false })
        .limit(50);

      if (!rawChats) { setLoading(false); return; }

      // Anreichern: other_profile + unread für diesen User
      const enriched = rawChats.map(c => {
        const isA  = c.participant_a === user.id;
        const other = isA ? c.profile_b : c.profile_a;
        const unread = isA ? (c.unread_a || 0) : (c.unread_b || 0);

        return {
          ...c,
          other_profile: other,
          unread,
          // Booking-Kontext-Priorität
          _priority: unread > 0 ? 100 :
                     c.chat_type === "booking" ? 50 :
                     c.chat_type === "collaboration" ? 40 :
                     c.chat_type === "project" ? 35 : 0,
        };
      });

      // Sortierung: Pinned → Unread → priority → last_message_at
      enriched.sort((a, b) => {
        if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
        if (a.unread > 0 !== b.unread > 0) return a.unread > 0 ? -1 : 1;
        if (a._priority !== b._priority)   return b._priority - a._priority;
        return new Date(b.last_message_at || 0) - new Date(a.last_message_at || 0);
      });

      setChats(enriched);
    } catch(e) {
      console.warn("[useChatList]", e.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  // Realtime: Chat-Updates (neue Nachrichten, Status)
  useEffect(() => {
    if (!user?.id) return;
    realtimeRef.current = supabase
      .channel(`chat-list:${user.id}`)
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "chats",
      }, () => load())
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "chats",
      }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(realtimeRef.current); };
  }, [user?.id, load]);

  // unreadTotal für Badge im Tab
  const unreadTotal = useMemo(() =>
    chats.reduce((sum, c) => sum + (c.unread || 0), 0), [chats]);

  // markChatRead — setzt unread für diesen User auf 0
  const markChatRead = useCallback(async (chatId) => {
    if (!user?.id) return;
    const c = chats.find(ch => ch.id === chatId);
    if (!c) return;
    const isA = c.participant_a === user.id;
    const updateField = isA ? { unread_a: 0 } : { unread_b: 0 };
    await supabase.from("chats").update(updateField).eq("id", chatId);
    // Auch messages als gelesen markieren
    await supabase.from("messages")
      .update({ read: true })
      .eq("chat_id", chatId)
      .neq("sender_id", user.id);
    setChats(prev => prev.map(ch =>
      ch.id === chatId ? { ...ch, unread: 0 } : ch
    ));
  }, [user?.id, chats]);

  return { chats, loading, unreadTotal, reload: load, markChatRead };
}

// ────────────────────────────────────────────────────────────────
// useChatThread — Nachrichten eines Chats + Realtime
// ────────────────────────────────────────────────────────────────
export function useChatThread(chatId) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [sending,  setSending]  = useState(false);
  const realtimeRef = useRef(null);
  const optimisticIdRef = useRef(0);

  const load = useCallback(async () => {
    if (!chatId) return;
    try {
      const { data } = await supabase
        .from("messages")
        .select(`
          id, text, sender_id, created_at, read, updated_at,
          msg_type, media_url, media_type, media_meta,
          context_ref, is_deleted, reply_to
        `)
        .eq("chat_id", chatId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: true })
        .limit(100);
      if (data) setMessages(data);
    } catch(e) { console.warn("[useChatThread]", e.message); }
    finally { setLoading(false); }
  }, [chatId]);

  useEffect(() => { load(); }, [load]);

  // Realtime für neue Nachrichten
  useEffect(() => {
    if (!chatId) return;
    realtimeRef.current = supabase
      .channel(`thread:${chatId}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "messages",
        filter: `chat_id=eq.${chatId}`,
      }, (payload) => {
        setMessages(prev => {
          // Deduplizieren — optimistic messages ersetzen
          const exists = prev.find(m => m.id === payload.new.id);
          if (exists) return prev;
          // Optimistic message (mit temp ID) ersetzen
          const withoutTemp = prev.filter(m => !m._optimistic);
          return [...withoutTemp, payload.new];
        });
      })
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "messages",
        filter: `chat_id=eq.${chatId}`,
      }, (payload) => {
        setMessages(prev => prev.map(m =>
          m.id === payload.new.id ? { ...m, ...payload.new } : m
        ));
      })
      .subscribe();
    return () => { supabase.removeChannel(realtimeRef.current); };
  }, [chatId]);

  // sendMessage — Optimistic Update + Supabase
  const sendMessage = useCallback(async ({
    text, msgType = "text", mediaUrl, mediaType, mediaMeta, contextRef,
  }) => {
    if (!chatId || !user?.id || (!text?.trim() && !mediaUrl)) return;
    setSending(true);

    // Optimistic message sofort anzeigen
    const tempId = `temp-${optimisticIdRef.current++}`;
    const optimisticMsg = {
      id:         tempId,
      chat_id:    chatId,
      sender_id:  user.id,
      text:       text || "",
      msg_type:   msgType,
      media_url:  mediaUrl || null,
      media_type: mediaType || null,
      media_meta: mediaMeta || null,
      context_ref: contextRef || null,
      created_at: new Date().toISOString(),
      read:       false,
      _optimistic: true,
    };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      const { error } = await supabase.from("messages").insert({
        chat_id:    chatId,
        sender_id:  user.id,
        text:       text?.trim() || "",
        msg_type:   msgType,
        media_url:  mediaUrl || null,
        media_type: mediaType || null,
        media_meta: mediaMeta || null,
        context_ref: contextRef || null,
        created_at: new Date().toISOString(),
        read:       false,
      });
      if (error) {
        // Rollback optimistic
        setMessages(prev => prev.filter(m => m.id !== tempId));
        console.error("[sendMessage]", error.message);
        return { error: error.message };
      }
      return { success: true };
    } catch(e) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      return { error: e.message };
    } finally {
      setSending(false);
    }
  }, [chatId, user?.id]);

  // sendSystemMessage — für Booking-Updates etc.
  const sendSystemMessage = useCallback(async (text, contextRef) => {
    return sendMessage({ text, msgType: "system_message", contextRef });
  }, [sendMessage]);

  // sendBookingUpdate — weiche Status-Beschreibung statt technischer Text
  // Verwendet BOOKING_STATUS.softText wenn vorhanden
  const sendBookingUpdate = useCallback(async (statusText, bookingData) => {
    // softText aus bookingData.status holen wenn nicht explizit übergeben
    const finalText = statusText || (bookingData?.status
      ? `Status: ${bookingData.status}` : "Status aktualisiert");
    return sendMessage({
      text:       finalText,
      msgType:    "booking_update",
      contextRef: bookingData,
    });
  }, [sendMessage]);

  // shareWork — Werk im Chat teilen
  const shareWork = useCallback(async (work) => {
    return sendMessage({
      text:    `Ich teile mein Werk: ${work.title}`,
      msgType: "shared_work",
      contextRef: {
        type:      "work",
        id:        work.id,
        title:     work.title,
        thumbnail: work.cover_url || work.media_url,
        price:     work.price,
      },
    });
  }, [sendMessage]);

  // deleteMessage — soft delete
  const deleteMessage = useCallback(async (messageId) => {
    await supabase.from("messages")
      .update({ is_deleted: true })
      .eq("id", messageId)
      .eq("sender_id", user.id);
    setMessages(prev => prev.filter(m => m.id !== messageId));
  }, [user?.id]);

  return {
    messages, loading, sending,
    sendMessage, sendSystemMessage, sendBookingUpdate, shareWork, deleteMessage,
    reload: load,
  };
}

// ────────────────────────────────────────────────────────────────
// useChatContext — vollständiger Kontext eines Chats
// (Booking-Daten, andere Profile, Projekt-Status)
// ────────────────────────────────────────────────────────────────
export function useChatContext(chat) {
  const [booking,  setBooking]  = useState(null);
  const [loadingCtx, setLoadingCtx] = useState(false);

  useEffect(() => {
    if (!chat?.booking_id) return;
    setLoadingCtx(true);
    supabase.from("bookings")
      .select(`
        id, status, req_type, req_date, req_time_slot,
        amount_eur, message, confirmed_at,
        requester:profiles!bookings_requester_id_fkey(id, display_name, avatar_url),
        creator:profiles!bookings_creator_id_fkey(id, display_name, avatar_url)
      `)
      .eq("id", chat.booking_id)
      .single()
      .then(({ data }) => {
        setBooking(data);
        setLoadingCtx(false);
      })
      .catch(() => setLoadingCtx(false));
  }, [chat?.booking_id]);

  // Kontext-Label für Header
  const contextLabel = useMemo(() => {
    if (chat?.context_title) return chat.context_title;
    if (chat?.booking_title) return chat.booking_title;
    if (booking?.req_type)   return booking.req_type;
    if (chat?.chat_type && chat.chat_type !== "direct") {
      return CHAT_TYPES[chat.chat_type]?.label || "";
    }
    return null;
  }, [chat, booking]);

  return { booking, loadingCtx, contextLabel };
}

// ────────────────────────────────────────────────────────────────
// useOrCreateChat — Chat zwischen zwei Usern finden oder neu erstellen
// ────────────────────────────────────────────────────────────────
export async function findOrCreateChat({
  userId, otherUserId, chatType = "direct",
  bookingId = null, contextTitle = null, contextType = null,
}) {
  if (!userId || !otherUserId) return null;

  // Existing chat suchen
  const { data: existing } = await supabase
    .from("chats")
    .select("id, chat_type, state, last_message, booking_id")
    .or(`participant_a.eq.${userId},participant_b.eq.${userId}`)
    .or(`participant_a.eq.${otherUserId},participant_b.eq.${otherUserId}`)
    .eq("state", "open")
    .order("last_message_at", { ascending: false })
    .limit(10);

  // Prüfen ob ein bestehender Chat zwischen den zwei Usern existiert
  const match = (existing || []).find(c => {
    const parties = [c.participant_a, c.participant_b];
    return parties.includes(userId) && parties.includes(otherUserId);
  });

  if (match) return match;

  // Neuen Chat erstellen
  const { data: newChat } = await supabase
    .from("chats")
    .insert({
      participant_a:    userId,
      participant_b:    otherUserId,
      participant_ids:  [userId, otherUserId],
      chat_type:        chatType,
      state:            "open",
      booking_id:       bookingId,
      context_title:    contextTitle,
      context_type:     contextType,
      opened_at:        new Date().toISOString(),
      last_message_at:  new Date().toISOString(),
    })
    .select("id").single();

  return newChat;
}
