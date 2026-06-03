// chatContext.js — HUI Chat Intelligence Layer v1.2
// Schema-Fix 2026-06-01: Live-DB-Struktur verifiziert
// TABLE chats:    id, booking_id, participant_ids, state("opened"),
//                last_message_at, last_message, opened_at, closed_at,
//                created_at, booking_title
// TABLE messages: id, created_at, chat_id, sender_id, sender_name,
//                sender_img, text, read, message_type, is_read, updated_at
//
// ENTFERNT (existieren nicht in DB):
//   chats:    participant_a, participant_b, chat_type, context_type,
//             context_title, context_id, last_message_type, is_pinned,
//             unread_a, unread_b
//   messages: msg_type, media_url, media_type, media_meta,
//             context_ref, is_deleted, reply_to

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { feedback } from './feedback/index.js';
import { assertAuthenticated, globalMutationGuard } from './security/index.js';
import { validateMessage } from './validation/index.js';
import { supabase } from "./supabaseClient";
import { logDebug } from "./debugCollector.js";
import { notifyMessage } from "./notificationService";
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
// PRIO 1: useChatList — echtes DB-Schema
// participant_ids (uuid[]) statt participant_a/participant_b
// state = "opened" statt "open"
// ────────────────────────────────────────────────────────────────
export function useChatList() {
  const { user } = useAuth();
  const [chats,   setChats]   = useState([]);
  const [loading, setLoading] = useState(true);
  const realtimeRef = useRef(null);

  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      // SELECT nur existierende Spalten (verifiziert 2026-06-01)
      const { data: rawChats, error: chatError } = await supabase
        .from("chats")
        .select(`
          id, state, booking_title,
          last_message, last_message_at,
          opened_at, booking_id,
          participant_ids
        `)
        // participant_ids ist uuid[] → cs. (contains) prüft ob user.id enthalten
        .contains("participant_ids", [user.id])
        .or("state.eq.opened,state.is.null")
        .order("last_message_at", { ascending: false, nullsFirst: false })
        .limit(50);

      if (chatError) {
        console.error("[useChatList] SELECT Fehler:", chatError.code, chatError.message);
        setLoading(false);
        return;
      }
      if (!rawChats) { setLoading(false); return; }

      console.log('[useChatList] rawChats count:', rawChats.length);

      // Für jeden Chat: anderen Teilnehmer-Profil laden
      // participant_ids = [userA, userB] — der andere ist nicht user.id
      const enriched = await Promise.all(
        (rawChats || []).filter(c => c && c.id).map(async (c) => {
          const otherId = (c.participant_ids || []).find(id => id !== user.id);
          let otherProfile = null;
          if (otherId) {
            const { data: prof } = await supabase
              .from("profiles")
              .select("id, display_name, avatar_url, username, last_seen, availability")
              .eq("id", otherId)
              .single();
            otherProfile = prof;
          }
          return {
            ...c,
            other_profile: otherProfile,
            unread: 0, // unread_a/unread_b existieren nicht in DB
            _priority: 0,
          };
        })
      );

      // Sortierung: last_message_at
      enriched.sort((a, b) =>
        new Date(b.last_message_at || 0) - new Date(a.last_message_at || 0)
      );

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

  // markChatRead — setzt messages als gelesen
  // unread_a/unread_b existieren nicht → nur messages.read updaten
  const markChatRead = useCallback(async (chatId) => {
    if (!user?.id) return;
    await supabase.from("messages")
      .update({ read: true })
      .eq("chat_id", chatId)
      .neq("sender_id", user.id);
    setChats(prev => prev.map(ch =>
      ch.id === chatId ? { ...ch, unread: 0 } : ch
    ));
  }, [user?.id]);

  return { chats, loading, unreadTotal, reload: load, markChatRead };
}

// ────────────────────────────────────────────────────────────────
// PRIO 2: useChatThread — echtes messages-Schema
// Nur existierende Felder: id, created_at, chat_id, sender_id,
// sender_name, sender_img, text, read, message_type, is_read, updated_at
// Entfernt: msg_type, media_url, media_type, media_meta,
//           context_ref, is_deleted, reply_to
// ────────────────────────────────────────────────────────────────
export function useChatThread(chatId) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [sending,  setSending]  = useState(false);
  const realtimeRef = useRef(null);
  const optimisticIdRef = useRef(0);

  const load = useCallback(async () => {
    if (!chatId) {
      console.warn("[HUI_CHAT] useChatThread: kein chatId — kein Load");
      return;
    }
    const isFake = typeof chatId === "string" && chatId.startsWith("direct_");
    if (isFake) {
      console.warn("[HUI_CHAT] useChatThread: fake chatId:", chatId, "— kein DB-Load");
      setLoading(false);
      return;
    }
    console.log("[HUI_CHAT] useChatThread loading, chatId:", chatId, "type:", typeof chatId);
    console.log("[THREAD_LOAD]", { chatId, typeofChatId: typeof chatId, isFake: String(chatId).startsWith("direct_") });
    console.error("CHAT_TRACE", { step: "8_useChatThread_load", chatId, typeofChatId: typeof chatId, ts: Date.now() });
    try {
      // SELECT nur existierende Spalten (verifiziert 2026-06-01)
      const { data, error: loadError } = await supabase
        .from("messages")
        .select(`
          id, text, sender_id, sender_name, sender_img,
          created_at, updated_at, read, is_read, message_type
        `)
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true })
        .limit(100);
      console.log("[LOAD_RESULT]", {
        chatId,
        count:        data?.length ?? 0,
        error:        loadError?.message ?? null,
        errorCode:    loadError?.code ?? null,
        firstMsgId:   data?.[0]?.id ?? null,
        ts:           Date.now(),
      });
      console.error("CHAT_TRACE", { step: "8b_LOAD_RESULT", chatId,
        count: data?.length ?? 0, firstMsgId: data?.[0]?.id ?? null,
        error: loadError?.message ?? null, ts: Date.now() });
      if (data) setMessages(data);
    } catch(e) {
      console.error("[LOAD_RESULT]", { chatId, count: 0, error: e.message, ts: Date.now() });
    }
    finally { setLoading(false); }
  }, [chatId]);

  useEffect(() => { load(); }, [load]);

  // Realtime für neue Nachrichten
  useEffect(() => {
    if (!chatId) return;

    const channel = supabase
      .channel(`thread:${chatId}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "messages",
        filter: `chat_id=eq.${chatId}`,
      }, (payload) => {
        console.log("[MESSAGE_INSERT_EVENT]", {
          id:        payload.new?.id,
          sender_id: payload.new?.sender_id,
          chat_id:   payload.new?.chat_id,
          text:      payload.new?.text?.substring(0, 40),
          ts:        Date.now(),
        });
        setMessages(prev => {
          const exists = prev.find(m => m.id === payload.new.id);
          if (exists) return prev;
          const withoutOptimistic = prev.filter(m =>
            !(m._optimistic && m.text === payload.new.text && m.sender_id === payload.new.sender_id)
          );
          const next = [...withoutOptimistic, payload.new];
          console.log("[MESSAGE_RECEIVED]", { total: next.length, newId: payload.new?.id });
          return next;
        });
      })
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "messages",
        filter: `chat_id=eq.${chatId}`,
      }, (payload) => {
        setMessages(prev => (prev||[]).map(m =>
          m.id === payload.new.id ? { ...m, ...payload.new } : m
        ));
      })
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          console.log("[SUBSCRIBE_CREATED]", { chatId, status, ts: Date.now() });
        } else {
          console.log("[SUBSCRIBE_STATUS]", { chatId, status, err: err?.message || null, ts: Date.now() });
        }
      });

    realtimeRef.current = channel;

    return () => {
      console.log("[UNSUBSCRIBED]", { chatId, ts: Date.now() });
      supabase.removeChannel(channel);
    };
  }, [chatId]);

  // PRIO 3: sendMessage — echtes messages-Schema
  // message_type statt msg_type
  // Entfernt: media_url, media_type, media_meta, context_ref
  const sendMessage = useCallback(async ({
    text, msgType = "text", mediaUrl, mediaType, mediaMeta, contextRef,
  }) => {
    // ── GUARD ─────────────────────────────────────────────────
    if (!chatId) {
      console.error("[HUI_MESSAGE_ERROR] kein chatId — Message abgebrochen", { chatId, userId: user?.id });
      return { error: "no_chat_id" };
    }
    if (!user?.id) {
      console.error("[HUI_MESSAGE_ERROR] kein user.id — nicht eingeloggt?", { chatId });
      return { error: "not_authenticated" };
    }
    if (!text?.trim()) {
      console.warn("[HUI_MESSAGE_ERROR] leerer Text — abgebrochen");
      return { error: "empty_message" };
    }

    // Payload: nur existierende DB-Spalten (verifiziert 2026-06-01)
    const payload = {
      chat_id:      chatId,
      sender_id:    user.id,
      text:         text?.trim() || "",
      message_type: msgType,   // DB-Spalte heißt "message_type", nicht "msg_type"
      read:         false,
      created_at:   new Date().toISOString(),
    };
    console.log("[HUI_MESSAGE_SEND] Payload →", JSON.stringify(payload));
    setSending(true);

    // ── OPTIMISTIC ─────────────────────────────────────────────
    const tempId = `temp-${optimisticIdRef.current++}`;
    const optimisticMsg = { id: tempId, ...payload, _optimistic: true };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      console.log("[HUI_MESSAGE_INSERT] Supabase INSERT start…");
      const { data: insertedData, error } = await supabase
        .from("messages")
        .insert(payload)
        .select("id")
        .single();

      if (error) {
        console.error("[SEND_RESULT]", {
          ok:      false,
          chatId,
          payload,
          code:    error.code,
          message: error.message,
          details: error.details,
          hint:    error.hint,
          ts:      Date.now(),
        });
        setMessages(prev => prev.filter(m => m.id !== tempId));
        return { error: error.message, code: error.code };
      }

      console.log("[SEND_RESULT]", {
        ok:     true,
        chatId,
        msgId:  insertedData?.id,
        payload,
        ts:     Date.now(),
      });
      // Optimistic message mit echter ID ersetzen
      setMessages(prev => prev.map(m =>
        m.id === tempId ? { ...m, id: insertedData?.id || tempId, _optimistic: false } : m
      ));

      // PRIO 4: Notification — participant_ids statt participant_a/b
      if (insertedData?.id && chatId) {
        Promise.resolve().then(async () => {
          try {
            const { data: chatRow } = await supabase
              .from("chats")
              .select("participant_ids")
              .eq("id", chatId)
              .single();
            if (!chatRow?.participant_ids) return;
            // Empfänger = das andere Element in participant_ids
            const recipientId = (chatRow.participant_ids || []).find(id => id !== user?.id);
            if (!recipientId) return;
            const { data: me } = await supabase
              .from("profiles").select("display_name").eq("id", user?.id).single();
            await notifyMessage({
              senderId:    user?.id,
              recipientId,
              senderName:  me?.display_name || "Jemand",
              chatId,
              preview:     payload?.text || "",
            });
          } catch { /* notification failure is non-critical */ }
        });
      }

      return { success: true, id: insertedData?.id };

    } catch(e) {
      console.error("[HUI_MESSAGE_ERROR] Exception:", e.message, e);
      setMessages(prev => prev.filter(m => m.id !== tempId));
      return { error: e.message };
    } finally {
      setSending(false);
    }
  }, [chatId, user?.id]);

  // sendSystemMessage — für Booking-Updates etc.
  const sendSystemMessage = useCallback(async (text, contextRef) => {
    return sendMessage({ text, msgType: "system_message" });
  }, [sendMessage]);

  // sendBookingUpdate — weiche Status-Beschreibung statt technischer Text
  const sendBookingUpdate = useCallback(async (statusText, bookingData) => {
    const finalText = statusText || (bookingData?.status
      ? `Status: ${bookingData.status}` : "Status aktualisiert");
    return sendMessage({
      text:    finalText,
      msgType: "booking_update",
    });
  }, [sendMessage]);

  // shareWork — Werk im Chat teilen
  const shareWork = useCallback(async (work) => {
    return sendMessage({
      text:    `Ich teile mein Werk: ${work.title}`,
      msgType: "shared_work",
    });
  }, [sendMessage]);

  // deleteMessage — UI-only (is_deleted existiert nicht in DB)
  // Markiert message lokal als gelöscht, kein DB-Update
  const deleteMessage = useCallback(async (messageId) => {
    // is_deleted existiert nicht in DB — nur lokal entfernen
    setMessages(prev => prev.filter(m => m.id !== messageId));
  }, []);

  return {
    messages, loading, sending,
    sendMessage, sendSystemMessage, sendBookingUpdate, shareWork, deleteMessage,
    reload: load,
  };
}

// ────────────────────────────────────────────────────────────────
// useChatContext — Kontext eines Chats (Booking-Daten etc.)
// context_title/context_type existieren nicht in DB → entfernt
// booking_title existiert → bleibt
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
  // context_title/chat_type existieren nicht in DB — nur booking_title
  const contextLabel = useMemo(() => {
    if (chat?.booking_title) return chat.booking_title;
    if (booking?.req_type)   return booking.req_type;
    return null;
  }, [chat, booking]);

  return { booking, loadingCtx, contextLabel };
}

// ────────────────────────────────────────────────────────────────
// findOrCreateChat — Chat zwischen zwei Usern finden oder erstellen
// participant_ids (uuid[]) — verifiziert 2026-06-01
// state = "opened" (DB-Default)
// ────────────────────────────────────────────────────────────────
export async function findOrCreateChat({
  userId, otherUserId, chatType = "direct",
  bookingId = null, contextTitle = null, contextType = null,
}) {
  const _fccTs = Date.now();
  const _fccMeta = { userId, recipientId: otherUserId, ts: _fccTs };

  // [FCC_START]
  console.log("[FCC_START]", _fccMeta);
  logDebug("FCC_START", _fccMeta);
  if (typeof window !== "undefined") window.__HUI_LAST_FCC__ = { event: "FCC_START", ..._fccMeta };

  if (!userId || !otherUserId) {
    const _err = { event: "FCC_ERROR", ..._fccMeta, error: "userId oder otherUserId fehlt" };
    console.error("[FCC_ERROR]", _err);
    logDebug("FCC_ERROR", _err);
    if (typeof window !== "undefined") window.__HUI_LAST_FCC__ = _err;
    return null;
  }

  // ── Bestehenden Chat suchen ─────────────────────────────────
  const { data: existing, error: findError } = await supabase
    .from("chats")
    .select("id, participant_ids, state, last_message, last_message_at, booking_id")
    .contains("participant_ids", [userId, otherUserId])
    .eq("state", "opened")
    .order("last_message_at", { ascending: false })
    .limit(5);

  if (findError) {
    console.error("[CHAT] SELECT Fehler", { code: findError?.code, message: findError?.message });
    // Trotzdem weiterversuchen
  }

  const match = (existing || []).find(c =>
    Array.isArray(c.participant_ids) &&
    c.participant_ids.includes(userId) &&
    c.participant_ids.includes(otherUserId)
  );

  if (match) {
    // [FCC_FOUND_EXISTING]
    const _found = { event: "FCC_FOUND_EXISTING", ..._fccMeta, chatId: match.id };
    console.log("[FCC_FOUND_EXISTING]", _found);
    logDebug("FCC_FOUND_EXISTING", _found);
    if (typeof window !== "undefined") window.__HUI_LAST_FCC__ = _found;
    // [FCC_SUCCESS]
    const _succ = { event: "FCC_SUCCESS", ..._fccMeta, chatId: match.id };
    console.log("[FCC_SUCCESS]", _succ);
    logDebug("FCC_SUCCESS", _succ);
    if (typeof window !== "undefined") window.__HUI_LAST_FCC__ = _succ;
    return match;
  }

  // ── Neuen Chat erstellen ────────────────────────────────────
  // [FCC_CREATING]
  const _creating = { event: "FCC_CREATING", ..._fccMeta };
  console.log("[FCC_CREATING]", _creating);
  logDebug("FCC_CREATING", _creating);
  if (typeof window !== "undefined") window.__HUI_LAST_FCC__ = _creating;

  const { error: createError } = await supabase
    .from("chats")
    .insert({
      participant_ids:  [userId, otherUserId],
      state:            "opened",
      booking_id:       bookingId ?? null,
      opened_at:        new Date().toISOString(),
      last_message_at:  new Date().toISOString(),
    });

  if (createError) {
    const _err2 = { event: "FCC_ERROR", ..._fccMeta, error: createError?.message, code: createError?.code };
    console.error("[FCC_ERROR]", _err2);
    logDebug("FCC_ERROR", _err2);
    if (typeof window !== "undefined") window.__HUI_LAST_FCC__ = _err2;
    // [FCC_FINALLY]
    logDebug("FCC_FINALLY", { ..._fccMeta, result: "error" });
    return null;
  }

  // ── Gerade erzeugten Chat nachladen ─────────────────────────
  const { data: created, error: fetchError } = await supabase
    .from("chats")
    .select("id, participant_ids, state, booking_id, opened_at")
    .contains("participant_ids", [userId, otherUserId])
    .eq("state", "opened")
    .order("opened_at", { ascending: false })
    .limit(1)
    .single();

  if (fetchError) {
    const _err3 = { event: "FCC_ERROR", ..._fccMeta, error: fetchError?.message, code: fetchError?.code, phase: "fetch_after_insert" };
    console.error("[FCC_ERROR]", _err3);
    logDebug("FCC_ERROR", _err3);
    if (typeof window !== "undefined") window.__HUI_LAST_FCC__ = _err3;
    // [FCC_FINALLY]
    logDebug("FCC_FINALLY", { ..._fccMeta, result: "fetch_error" });
    return null;
  }

  // [FCC_CREATED]
  const _created = { event: "FCC_CREATED", ..._fccMeta, chatId: created?.id };
  console.log("[FCC_CREATED]", _created);
  logDebug("FCC_CREATED", _created);
  if (typeof window !== "undefined") window.__HUI_LAST_FCC__ = _created;

  // [FCC_SUCCESS]
  const _succ2 = { event: "FCC_SUCCESS", ..._fccMeta, chatId: created?.id };
  console.log("[FCC_SUCCESS]", _succ2);
  logDebug("FCC_SUCCESS", _succ2);
  if (typeof window !== "undefined") window.__HUI_LAST_FCC__ = _succ2;

  // [FCC_FINALLY]
  logDebug("FCC_FINALLY", { ..._fccMeta, chatId: created?.id, result: "ok" });

  return created ?? null;
}
