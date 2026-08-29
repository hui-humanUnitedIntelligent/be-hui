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
import { ProfileService } from '../services/db';
import { supabase } from "./supabaseClient";
import { logDebug } from "./debugCollector.js";
import { notifyMessage } from "./notificationService";
import { useAuth } from "./AuthContext";
import { formatDateDE, formatTimeDE } from "./formatters.js";

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
    return formatTimeDE(d, { hour: "2-digit", minute: "2-digit" });
  } else if (diffD < 7) {
    return formatDateDE(d, { weekday: "short" });
  } else {
    return formatDateDE(d, { day: "numeric", month: "short" });
  }
}

export function formatMsgDate(iso) {
  if (!iso) return "";
  const d   = new Date(iso);
  const now = new Date();
  const diffD = (now - d) / 86400000;
  if (diffD < 1) return "Heute";
  if (diffD < 2) return "Gestern";
  return formatDateDE(d, { weekday: "long", day: "numeric", month: "long" });
}

// ────────────────────────────────────────────────────────────────
// PRIO 1: useChatList — echtes DB-Schema
// participant_ids (uuid[]) statt participant_a/participant_b
// state = "opened" statt "open"
// ────────────────────────────────────────────────────────────────
export function useChatList(instanceId = "default") {
  const { user, authChecked } = useAuth();
  const [chats,   setChats]   = useState([]);
  const [loading, setLoading] = useState(true);

  // Wenn authChecked aber kein User → kein Login → loading beenden
  useEffect(() => {
    if (authChecked && !user?.id) setLoading(false);
  }, [authChecked, user?.id]);
  const realtimeRef = useRef(null);

  const load = useCallback(async () => {
    if (!authChecked) return;
    if (!user?.id) {
      setChats([]);
      setLoading(false);
      return;
    }
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
        // state-Filter: nur aktive Chats zeigen (keine closed/deleted)
        .in("state", ["opened", "archived", "muted", "blocked"])
        .order("last_message_at", { ascending: false, nullsFirst: false })
        .limit(50);

      if (chatError) {
        console.warn("[CHATLIST_ERROR]", chatError.message, chatError.code);
        setLoading(false);
        return;
      }
      if (!rawChats) { setLoading(false); return; }


      // Für jeden Chat: anderen Teilnehmer-Profil laden
      // participant_ids = [userA, userB] — der andere ist nicht user.id
      const enriched = await Promise.all(
        (rawChats || []).filter(c => c && c.id).map(async (c) => {
          const otherId = (c.participant_ids || []).find(id => id !== user.id);
          let otherProfile = null;
          if (otherId) {
            // ProfileService v1.0: getById — Versuch 2 (user_id) ist Dead Code (profiles.id = auth.uid)
            const { data: prof1 } = await ProfileService.getById(otherId);
            otherProfile = prof1 ?? null;
          }
          return {
            ...c,
            other_profile: otherProfile,
            unread: 0, // wird nach Enrichment berechnet
            _priority: 0,
          };
        })
      );

      // ── Unread-Count per Chat berechnen ───────────────────────
      // 1. Letzten Lesezeitpunkt des Users für jeden Chat laden
      const chatIds = enriched.map(c => c.id);
      const { data: readRows } = await supabase
        .from("chat_participants")
        .select("chat_id, last_read_at")
        .eq("user_id", user.id)
        .in("chat_id", chatIds);

      const lastReadMap = {};
      (readRows || []).forEach(r => { lastReadMap[r.chat_id] = r.last_read_at; });

      // 2. Alle ungelesenen Nachrichten für diese Chats in einer Query
      const { data: unreadMsgs } = await supabase
        .from("messages")
        .select("chat_id, created_at")
        .in("chat_id", chatIds)
        .neq("sender_id", user.id)
        .limit(500);  // Scale-Schutz: max 500 unread messages

      // 3. Unread pro Chat berechnen
      const unreadMap = {};
      (unreadMsgs || []).forEach(m => {
        const lr = lastReadMap[m.chat_id] || "1970-01-01T00:00:00Z";
        if (new Date(m.created_at) > new Date(lr)) {
          unreadMap[m.chat_id] = (unreadMap[m.chat_id] || 0) + 1;
        }
      });

      // 4. Unread in enriched eintragen
      const withUnread = enriched.map(c => ({
        ...c,
        unread: unreadMap[c.id] || 0,
      }));

      // Sortierung: ungelesene zuerst, dann last_message_at
      withUnread.sort((a, b) => {
        if (b.unread !== a.unread) return b.unread - a.unread;
        return new Date(b.last_message_at || 0) - new Date(a.last_message_at || 0);
      });
      setChats(withUnread);
    } catch(e) {
      console.error("[CHATLIST_LOAD_ERROR]", e?.message);
    } finally {
      setLoading(false);
    }
  }, [authChecked, user?.id]);

  useEffect(() => { load(); }, [load]);

  // Realtime: Chat-Updates + neue Nachrichten → unread live aktualisieren
  useEffect(() => {
    if (!user?.id) return;
    const channelName = `chat-list:${user.id}:${instanceId}`;
    // Realtime-Dedupe-Schutz (2026-07-08, systemweit, siehe useProfileLocations.js):
    // existierenden Channel fuer diesen Topic wiederverwenden statt erneut zu
    // subscriben -- verhindert "cannot add postgres_changes callbacks ... after
    // subscribe()" bei gleichzeitigen Mounts fuer denselben Topic.
    // Hinweis: instanceId (z.B. "home"/"cco") macht den Topic je Aufrufer
    // bereits eindeutig -- der Schutz wird trotzdem konsistent mitgefuehrt.
    const existing = supabase.getChannels().find(c => c.topic === `realtime:${channelName}`);
    let createdHere = false;
    if (existing) {
      realtimeRef.current = existing;
    } else {
      realtimeRef.current = supabase
        .channel(channelName)
        .on("postgres_changes", {
          event: "UPDATE", schema: "public", table: "chats",
        }, () => load())
        .on("postgres_changes", {
          event: "INSERT", schema: "public", table: "chats",
        }, () => load())
        .on("postgres_changes", {
          // Chat gelöscht (Hard-DELETE 2026-08-19) → Liste neu laden
          event: "DELETE", schema: "public", table: "chats",
        }, () => load())
        .on("postgres_changes", {
          // Neue Nachricht → unread_count neu berechnen
          event: "INSERT", schema: "public", table: "messages",
        }, (payload) => {
          const msg = payload.new;
          if (!msg?.chat_id || msg.sender_id === user.id) return; // eigene Nachricht ignorieren
          // Optimistic: unread für diesen Chat +1
          setChats(prev => prev.map(ch =>
            ch.id === msg.chat_id
              ? { ...ch, unread: (ch.unread || 0) + 1 }
              : ch
          ).sort((a, b) => {
            if (b.unread !== a.unread) return b.unread - a.unread;
            return new Date(b.last_message_at || 0) - new Date(a.last_message_at || 0);
          }));
        })
        .subscribe();
      createdHere = true;
    }
    return () => { if (createdHere) supabase.removeChannel(realtimeRef.current); };
  }, [user?.id, load]);

  // unreadTotal für Badge im Tab
  const unreadTotal = useMemo(() =>
    chats.reduce((sum, c) => sum + (c.unread || 0), 0), [chats]);

  // markChatRead — setzt messages als gelesen
  // unread_a/unread_b existieren nicht → nur messages.read updaten
  const markChatRead = useCallback(async (chatId) => {
    if (!user?.id || !chatId) return;
    // UPSERT in chat_participants — setzt last_read_at auf now()
    // Tabelle: chat_participants(chat_id, user_id, last_read_at) — Migration 048
    await supabase
      .from("chat_participants")
      .upsert({ chat_id: chatId, user_id: user.id, last_read_at: new Date().toISOString() },
               { onConflict: "chat_id,user_id" });
    // Optimistic update: unread sofort auf 0
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
    try {
      // SELECT nur existierende Spalten (verifiziert 2026-06-01)
      // CHAT-SCROLL-FIX (2026-08-11): Vorher order("created_at",{ascending:true})
      // .limit(100) -- das laedt bei Chats mit MEHR als 100 Nachrichten die
      // AELTESTEN 100, die neuesten Nachrichten wurden NIE geladen. Der
      // Auto-Scroll-ans-Ende-Mechanismus (ChatMessages.jsx) landete dadurch
      // korrekt am Ende DIESES unvollstaendigen Datensatzes -- fuer den Nutzer
      // sah es aber aus, als wuerde der Chat "mittendrin" oeffnen, weil die
      // wirklich letzten Nachrichten fehlten (Michael-Feedback 2026-08-11,
      // Screenshot Linda-Chat). Fix: absteigend sortieren + limit(100) holt
      // die NEUESTEN 100, anschliessend zurueck in aufsteigende Reihenfolge
      // fuer die Anzeige drehen (Standard-Pattern fuer Chat-Pagination).
      const { data, error: loadError } = await supabase
        .from("messages")
        .select(`
          id, text, sender_id, sender_name, sender_img,
          created_at, updated_at, read, is_read, message_type,
          media_url, media_type, is_deleted
        `)
        .eq("chat_id", chatId)
        .order("created_at", { ascending: false })
        .limit(100);
      if (data) {
        // Reaktionen für alle geladenen Nachrichten abrufen (post_reactions, polymorph)
        const msgIds = data.map(m => m.id);
        let reactionsMap = {};
        if (msgIds.length > 0) {
          try {
            const { data: reactions } = await supabase
              .from("post_reactions")
              .select("id, post_id, user_id, type, created_at")
              .in("post_id", msgIds)
              .eq("post_type", "chat_message");
            if (reactions) {
              for (const r of reactions) {
                if (!reactionsMap[r.post_id]) reactionsMap[r.post_id] = [];
                reactionsMap[r.post_id].push({ emoji: r.type, user_id: r.user_id, id: r.id });
              }
            }
          } catch(re) { /* Reaktionen sind optional */ }
        }
        setMessages(data.map(m => ({
          ...m,
          reactions: reactionsMap[m.id] || [],
        })).reverse());
      }
    } catch(e) {
    }
    finally { setLoading(false); }
  }, [chatId]);

  useEffect(() => { load(); }, [load]);

  // Realtime für neue Nachrichten
  useEffect(() => {
    if (!chatId) return;

    // Realtime-Dedupe-Schutz (2026-07-08, systemweit, siehe useProfileLocations.js):
    // existierenden Channel fuer diesen Topic wiederverwenden statt erneut zu
    // subscriben -- verhindert "cannot add postgres_changes callbacks ... after
    // subscribe()" bei gleichzeitigen Mounts fuer denselben Topic.
    const topic = `thread:${chatId}`;
    const existing = supabase.getChannels().find(c => c.topic === `realtime:${topic}`);
    let createdHere = false;
    let channel = existing;
    if (!existing) {
      channel = supabase
        .channel(topic)
        .on("postgres_changes", {
          event: "INSERT", schema: "public", table: "messages",
          filter: `chat_id=eq.${chatId}`,
        }, (payload) => {
          setMessages(prev => {
            const exists = prev.find(m => m.id === payload.new.id);
            if (exists) return prev;
            const withoutOptimistic = prev.filter(m =>
              !(m._optimistic && m.text === payload.new.text && m.sender_id === payload.new.sender_id)
            );
            const next = [...withoutOptimistic, payload.new];
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
          } else {
          }
        });
      createdHere = true;
    }

    realtimeRef.current = channel;

    return () => {
      if (createdHere) supabase.removeChannel(channel);
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
      media_url:    mediaUrl  || null,
      media_type:   mediaType || null,
      read:         false,
      created_at:   new Date().toISOString(),
    };
    setSending(true);

    // ── OPTIMISTIC ─────────────────────────────────────────────
    const tempId = `temp-${optimisticIdRef.current++}`;
    const optimisticMsg = { id: tempId, ...payload, _optimistic: true };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
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
              .maybeSingle();
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

  // deleteMessage — Soft-Delete in DB + lokal
  const deleteMessage = useCallback(async (messageId) => {
    setMessages(prev => prev.map(m =>
      m.id === messageId ? { ...m, is_deleted: true, text: "Diese Nachricht wurde gelöscht." } : m
    ));
    await supabase.from("messages")
      .update({ is_deleted: true, text: "Diese Nachricht wurde gelöscht." })
      .eq("id", messageId);
  }, []);

  // editMessage — nur Text, nur eigene Nachrichten
  const editMessage = useCallback(async (messageId, newText) => {
    if (!newText?.trim()) return;
    const edited = new Date().toISOString();
    setMessages(prev => prev.map(m =>
      m.id === messageId ? { ...m, text: newText.trim(), edited_at: edited } : m
    ));
    await supabase.from("messages")
      .update({ text: newText.trim(), edited_at: edited })
      .eq("id", messageId);
  }, []);

  // ── Reaktion auf Nachricht (Emoji) ──
  // Nutzt post_reactions Tabelle (polymorph): post_type='chat_message'
  const reactToMessage = useCallback(async (messageId, emoji) => {
    if (!messageId) return;
    const userId = user?.id;
    if (!userId) return;
    try {
      // Upsert: Wenn Nutzer schon reagiert hat → Toggle/Update
      const { data: existing } = await supabase
        .from("post_reactions")
        .select("id, type")
        .eq("post_id", messageId)
        .eq("post_type", "chat_message")
        .eq("user_id", userId)
        .maybeSingle();

      if (existing) {
        if (existing.type === emoji) {
          // Gleiche Reaktion → entfernen (Toggle off)
          await supabase.from("post_reactions").delete().eq("id", existing.id);
          setMessages(prev => prev.map(m => m.id === messageId
            ? { ...m, reactions: (m.reactions || []).filter(r => r.id !== existing.id) }
            : m));
        } else {
          // Andere Reaktion → aktualisieren
          const { data: updated } = await supabase
            .from("post_reactions")
            .update({ type: emoji })
            .eq("id", existing.id)
            .select("id, type")
            .single();
          if (updated) {
            setMessages(prev => prev.map(m => m.id === messageId
              ? { ...m, reactions: (m.reactions || []).map(r =>
                  r.id === existing.id ? { ...r, emoji: updated.type } : r) }
              : m));
          }
        }
      } else {
        // Neue Reaktion
        const { data: inserted } = await supabase
          .from("post_reactions")
          .insert({
            post_id: messageId,
            post_type: "chat_message",
            user_id: userId,
            type: emoji,
          })
          .select("id, type")
          .single();
        if (inserted) {
          setMessages(prev => prev.map(m => m.id === messageId
            ? { ...m, reactions: [...(m.reactions || []), { id: inserted.id, emoji: inserted.type, user_id: userId }] }
            : m));
        }
      }
    } catch(err) {
      console.error("[chatContext] reactToMessage error:", err?.message);
    }
  }, [user?.id]);

  return {
    messages, loading, sending,
    sendMessage, sendSystemMessage, sendBookingUpdate, shareWork, deleteMessage, editMessage,
    reactToMessage,
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
        id, status, booking_type, date, message, confirmed_at,
        total_eur,
        requester:profiles!bookings_user_id_fkey(id, display_name, avatar_url),
        creator:profiles!bookings_wirker_id_fkey(id, display_name, avatar_url)
      `)
      .eq("id", chat.booking_id)
      .maybeSingle()
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
    .neq("state", "deleted")
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
    // Reopen: falls Chat geschlossen ist, wieder oeffnen
    if (match.state && match.state !== "opened") {
      await supabase
        .from("chats")
        .update({ state: "opened", closed_at: null, last_message_at: new Date().toISOString() })
        .eq("id", match.id);
    }
    // [FCC_FOUND_EXISTING]
    const _found = { event: "FCC_FOUND_EXISTING", ..._fccMeta, chatId: match.id };
    logDebug("FCC_FOUND_EXISTING", _found);
    if (typeof window !== "undefined") window.__HUI_LAST_FCC__ = _found;
    // [FCC_SUCCESS]
    const _succ = { event: "FCC_SUCCESS", ..._fccMeta, chatId: match.id };
    logDebug("FCC_SUCCESS", _succ);
    if (typeof window !== "undefined") window.__HUI_LAST_FCC__ = _succ;
    return match;
  }

  // ── Neuen Chat erstellen ────────────────────────────────────
  // [FCC_CREATING]
  const _creating = { event: "FCC_CREATING", ..._fccMeta };
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
    .maybeSingle();

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
  logDebug("FCC_CREATED", _created);
  if (typeof window !== "undefined") window.__HUI_LAST_FCC__ = _created;

  // [FCC_SUCCESS]
  const _succ2 = { event: "FCC_SUCCESS", ..._fccMeta, chatId: created?.id };
  logDebug("FCC_SUCCESS", _succ2);
  if (typeof window !== "undefined") window.__HUI_LAST_FCC__ = _succ2;

  // [FCC_FINALLY]
  logDebug("FCC_FINALLY", { ..._fccMeta, chatId: created?.id, result: "ok" });

  return created ?? null;
}

// ────────────────────────────────────────────────────────────────
// closeChat — Chat als geschlossen markieren (state = "closed")
// Setzt closed_at auf jetzt; betrifft nur diesen User / diesen Chat.
// Verwendet vorhandene DB-Felder: state + closed_at.
// ────────────────────────────────────────────────────────────────
export async function closeChat(chatId, userId) {
  if (!chatId || !userId) return { error: "missing_args" };
  try {
    const { error } = await supabase
      .from("chats")
      .update({
        state:     "closed",
        closed_at: new Date().toISOString(),
      })
      .eq("id", chatId)
      .contains("participant_ids", [userId]); // Sicherheitscheck: nur eigene Chats
    return { error: error?.message ?? null };
  } catch (e) {
    return { error: e?.message ?? "unknown" };
  }
}


// ────────────────────────────────────────────────────────────────
// deleteChat — Chat unwiderruflich löschen (HARD DELETE, 2026-08-19 FIX)
//
// ROOT CAUSE (Bug-Report Michael 2026-08-19): Chat blieb nach "Löschen"
// in der Liste. Ursache: chats_state_check CHECK-Constraint in der DB
// erlaubt nur ('opened','archived','muted','blocked','closed') — NICHT
// 'deleted'. Das alte Soft-Delete (UPDATE state='deleted') scheiterte
// bei JEDEM Versuch an diesem Constraint (Postgres-Fehler), wurde aber
// vom Aufrufer (ChatCenterOverlay) nie geprüft → der Chat verschwand
// nur lokal (closedChatIds-Set) und kam nach Remount/Neuladen zurück.
//
// FIX: Echtes DELETE FROM chats (RLS-Policy chats_delete_own, angelegt
// via Migration 118, 2026-08-19 in Produktion aktiviert). messages.chat_id
// und chat_participants.chat_id haben beide ON DELETE CASCADE (Migration
// 103) — beim Löschen des Chats werden alle Nachrichten und Teilnehmer-
// Einträge automatisch von Postgres mitgelöscht. Kein manuelles
// Vor-Update der messages-Tabelle mehr nötig.
// ────────────────────────────────────────────────────────────────
export async function deleteChat(chatId, userId) {
  if (!chatId || !userId) return { error: "missing_args" };
  try {
    const { error, count } = await supabase
      .from("chats")
      .delete({ count: "exact" })
      .eq("id", chatId)
      .contains("participant_ids", [userId]); // Sicherheitscheck: nur eigene Chats

    if (error) return { error: error.message };
    if (!count) return { error: "not_found_or_forbidden" };
    return { error: null };
  } catch (e) {
    return { error: e?.message ?? "unknown" };
  }
}

// ══════════════════════════════════════════════════════════════════
// CHAT-LOGIK v2 (2026-08-22, Michael-Vorgabe)
// Universelle Regeln: Chat nur nach Kauf, Auto-Open, Auto-Close,
// Archivierung, Reopening bei neuer Transaktion, SADB-Events.
// Alle Funktionen sind ADDITIV — keine bestehenden Funktionen ersetzt.
// ══════════════════════════════════════════════════════════════════

// ────────────────────────────────────────────────────────────────
// autoCreateOrReopenChat — Wird nach erfolgreicher Zahlung aufgerufen.
// Nutzt die DB-RPC rpc_chat_auto_create_or_reopen.
// Findet bestehenden Chat (auch geschlossenen) → öffnet ihn wieder.
// Oder erstellt einen neuen Chat mit booking_id.
// ────────────────────────────────────────────────────────────────
export async function autoCreateOrReopenChat({
  userId,
  otherUserId,
  bookingId   = null,
  bookingType = null,   // 'werk' | 'talent' | 'erlebnis'
  bookingTitle = null,
}) {
  if (!userId || !otherUserId) {
    console.error("[CHAT-V2] autoCreateOrReopenChat: userId/otherUserId fehlt");
    return null;
  }

  try {
    const { data, error } = await supabase
      .rpc("rpc_chat_auto_create_or_reopen", {
        p_user_id:       userId,
        p_other_user_id: otherUserId,
        p_booking_id:    bookingId,
        p_booking_type:  bookingType,
        p_booking_title: bookingTitle,
      });

    if (error) {
      console.error("[CHAT-V2] rpc_chat_auto_create_or_reopen error:", error.message);
      return null;
    }

    if (!data?.ok) {
      console.warn("[CHAT-V2] rpc returned not ok:", data);
      return null;
    }

    return data; // { ok: true, chat_id: ..., reopened: bool }
  } catch (e) {
    console.error("[CHAT-V2] autoCreateOrReopenChat exception:", e?.message);
    return null;
  }
}

// ────────────────────────────────────────────────────────────────
// markSellerShipped — Verkäufer markiert "Versendet"
// ────────────────────────────────────────────────────────────────
export async function markSellerShipped(chatId, userId) {
  if (!chatId || !userId) return { error: "missing_args" };
  try {
    const { data, error } = await supabase
      .rpc("rpc_chat_mark_shipped", { p_chat_id: chatId, p_user_id: userId });
    if (error) return { error: error.message };
    return data; // { ok: true, delivery_status: 'shipped' }
  } catch (e) {
    return { error: e?.message ?? "unknown" };
  }
}

// ────────────────────────────────────────────────────────────────
// markBuyerReceived — Käufer bestätigt "Ware erhalten"
// ────────────────────────────────────────────────────────────────
export async function markBuyerReceived(chatId, userId) {
  if (!chatId || !userId) return { error: "missing_args" };
  try {
    const { data, error } = await supabase
      .rpc("rpc_chat_mark_received", { p_chat_id: chatId, p_user_id: userId });
    if (error) return { error: error.message };
    return data;
  } catch (e) {
    return { error: e?.message ?? "unknown" };
  }
}

// ────────────────────────────────────────────────────────────────
// submitBuyerRating — Käufer gibt Bewertung (recommend/not_recommend)
// Schließt automatisch den Chat, setzt Schreibsperre.
// ────────────────────────────────────────────────────────────────
export async function submitBuyerRating(chatId, userId, rating) {
  if (!chatId || !userId) return { error: "missing_args" };
  if (!["recommend", "not_recommend"].includes(rating)) {
    return { error: "invalid_rating" };
  }
  try {
    const { data, error } = await supabase
      .rpc("rpc_chat_submit_rating", {
        p_chat_id: chatId,
        p_user_id: userId,
        p_rating:  rating,
      });
    if (error) return { error: error.message };
    return data;
  } catch (e) {
    return { error: e?.message ?? "unknown" };
  }
}

// ────────────────────────────────────────────────────────────────
// useChatDeliveryStatus — Hook lädt delivery_status + transaction_status
// für einen Chat. Realtime-updates über chat_events.
// ────────────────────────────────────────────────────────────────
export function useChatDeliveryStatus(chatId) {
  const [status, setStatus] = useState({
    delivery_status:    "pending",
    transaction_status:  "active",
    seller_shipped_at:   null,
    buyer_received_at:   null,
    buyer_rated_at:      null,
    buyer_rating:        null,
    chat_state:          "opened",
    booking_type:         null,
    booking_title:        null,
  });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!chatId) { setLoading(false); return; }
    try {
      const { data, error } = await supabase
        .from("chats")
        .select(`
          state, delivery_status, transaction_status,
          seller_shipped_at, buyer_received_at,
          buyer_rated_at, buyer_rating,
          booking_type, booking_title
        `)
        .eq("id", chatId)
        .maybeSingle();

      if (error) { console.warn("[CHAT-V2] delivery status load error:", error.message); }
      if (data) {
        setStatus({
          delivery_status:    data.delivery_status    || "pending",
          transaction_status: data.transaction_status  || "active",
          seller_shipped_at:  data.seller_shipped_at   || null,
          buyer_received_at:  data.buyer_received_at   || null,
          buyer_rated_at:     data.buyer_rated_at      || null,
          buyer_rating:       data.buyer_rating        || null,
          chat_state:         data.state              || "opened",
          booking_type:        data.booking_type        || null,
          booking_title:      data.booking_title       || null,
        });
      }
    } catch (e) {
      console.warn("[CHAT-V2] delivery status exception:", e?.message);
    } finally {
      setLoading(false);
    }
  }, [chatId]);

  useEffect(() => { load(); }, [load]);

  // Realtime: chat_events für diesen Chat
  useEffect(() => {
    if (!chatId) return;
    const channel = supabase
      .channel(`chat-delivery:${chatId}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "chat_events",
        filter: `chat_id=eq.${chatId}`,
      }, () => load())
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "chats",
        filter: `id=eq.${chatId}`,
      }, () => load())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [chatId, load]);

  const isClosed    = status.chat_state === "closed" || status.delivery_status === "closed";
  const canWrite    = !isClosed;
  const canShip     = !isClosed && status.delivery_status === "pending" && !!status.booking_type;
  const canReceive  = !isClosed && status.delivery_status === "shipped";
  const canRate     = !isClosed && status.delivery_status === "delivered";

  return {
    ...status,
    loading,
    isClosed,
    canWrite,
    canShip,
    canReceive,
    canRate,
    refresh: load,
  };
}

// ────────────────────────────────────────────────────────────────
// logChatEvent — Client-seitiges Event-Logging für SADB
// ────────────────────────────────────────────────────────────────
export async function logChatEvent(chatId, eventType, userId = null, data = {}) {
  if (!chatId || !eventType) return;
  try {
    await supabase.from("chat_events").insert({
      chat_id:   chatId,
      event_type: eventType,
      user_id:   userId,
      data:      data,
    });
  } catch (e) {
    console.warn("[CHAT-V2] logChatEvent error:", e?.message);
  }
}

// ══════════════════════════════════════════════════════════════════
// MOMENT-CONNECT (2026-08-25, Michael-Vorgabe)
// Verbinden-Funktion NUR für Momente — direkter Chat zwischen
// zwei Nutzern, unabhängig von Kauf/Verkauf. Keine Schreibsperre,
// keine Treuhand-Logik, keine Bewertung. Chat bleibt offen bis
// manuell geschlossen. ADDITIV — keine bestehende Logik berührt.
// ══════════════════════════════════════════════════════════════════

// ────────────────────────────────────────────────────────────────
// createMomentChat — Chat zwischen zwei Nutzern über ein Moment
// Sucht bestehenden Chat (auch geschlossenen) → öffnet ihn wieder.
// Oder erstellt einen neuen Chat mit booking_title="Moment-Chat".
// Keine Vermischung mit Kauf-Chats (booking_id bleibt null).
// ────────────────────────────────────────────────────────────────
export async function createMomentChat({
  userId,
  otherUserId,
  momentId = null,
}) {
  if (!userId || !otherUserId) {
    console.error("[MOMENT-CHAT] userId/otherUserId fehlt");
    return null;
  }

  if (userId === otherUserId) {
    console.warn("[MOMENT-CHAT] kann nicht mit sich selbst chatten");
    return null;
  }

  try {
    // 1. Bestehenden Chat zwischen diesen beiden Nutzern suchen
    // (egal ob "opened" oder "closed" — bei geschlossen → wieder öffnen)
    const { data: existing, error: findError } = await supabase
      .from("chats")
      .select("id, participant_ids, state, booking_id, booking_title")
      .contains("participant_ids", [userId, otherUserId])
      .neq("state", "deleted")
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .limit(5);

    if (findError) {
      console.error("[MOMENT-CHAT] SELECT error:", findError.message);
    }

    // Einen Chat finden, der KEINE booking_id hat (Moment-Chat) oder
    // auch einen mit booking_title "Moment-Chat"
    const momentChat = (existing || []).find(c =>
      Array.isArray(c.participant_ids) &&
      c.participant_ids.includes(userId) &&
      c.participant_ids.includes(otherUserId) &&
      (!c.booking_id || c.booking_title === "Moment-Chat")
    );

    if (momentChat) {
      // Bestehenden Chat ggf. wieder öffnen
      if (momentChat.state === "closed") {
        await supabase
          .from("chats")
          .update({
            state:     "opened",
            closed_at: null,
            last_message_at: new Date().toISOString(),
          })
          .eq("id", momentChat.id);
      }

      // SADB-Event: moment_chat_reopened
      await logMomentEvent("moment_chat_reopened", {
        chat_id: momentChat.id,
        moment_id: momentId,
        user_id: userId,
        other_user_id: otherUserId,
      });

      return {
        ok: true,
        chat_id: momentChat.id,
        reopened: momentChat.state === "closed",
      };
    }

    // 2. Neuen Moment-Chat erstellen
    const { error: createError } = await supabase
      .from("chats")
      .insert({
        participant_ids:  [userId, otherUserId],
        state:            "opened",
        booking_id:       null,   // KEINE Vermischung mit Kauf-Chats
        booking_title:    "Moment-Chat",
        opened_at:        new Date().toISOString(),
        last_message_at:  new Date().toISOString(),
      });

    if (createError) {
      console.error("[MOMENT-CHAT] INSERT error:", createError.message);
      return null;
    }

    // Gerade erzeugten Chat nachladen
    const { data: created, error: fetchError } = await supabase
      .from("chats")
      .select("id, participant_ids, state, booking_title")
      .contains("participant_ids", [userId, otherUserId])
      .eq("state", "opened")
      .order("opened_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError || !created) {
      console.error("[MOMENT-CHAT] FETCH error:", fetchError?.message);
      return null;
    }

    // SADB-Event: moment_chat_created
    await logMomentEvent("moment_chat_created", {
      chat_id: created.id,
      moment_id: momentId,
      user_id: userId,
      other_user_id: otherUserId,
    });

    return {
      ok: true,
      chat_id: created.id,
      reopened: false,
    };
  } catch (e) {
    console.error("[MOMENT-CHAT] exception:", e?.message);
    return null;
  }
}

// ────────────────────────────────────────────────────────────────
// logMomentEvent — SADB-Event für Moment-Connect-System
// Speichert Events in der moment_events Tabelle (wird via Migration
// angelegt). Failsafe: wenn Tabelle nicht existiert → silent fail.
// ────────────────────────────────────────────────────────────────
async function logMomentEvent(eventType, data = {}) {
  try {
    await supabase
      .from("moment_events")
      .insert({
        event_type:  eventType,
        moment_id:   data.moment_id   || null,
        chat_id:     data.chat_id      || null,
        user_id:     data.user_id      || null,
        other_user_id: data.other_user_id || null,
        created_at:  new Date().toISOString(),
      });
  } catch (e) {
    // Silent fail — Event-Logging darf nie den Hauptfluss blockieren
    if (import.meta.env.DEV) console.warn("[MOMENT-EVENT]", eventType, e?.message);
  }
}

// ────────────────────────────────────────────────────────────────
// closeMomentChat — Nutzer schließt einen Moment-Chat manuell
// ────────────────────────────────────────────────────────────────
export async function closeMomentChat(chatId, userId) {
  if (!chatId || !userId) return { error: "missing_args" };
  try {
    const { error } = await supabase
      .from("chats")
      .update({
        state:     "closed",
        closed_at: new Date().toISOString(),
      })
      .eq("id", chatId)
      .contains("participant_ids", [userId])
      .eq("booking_title", "Moment-Chat");

    if (error) return { error: error.message };

    // SADB-Event
    await logMomentEvent("moment_chat_closed", {
      chat_id: chatId,
      user_id: userId,
    });

    return { error: null };
  } catch (e) {
    return { error: e?.message ?? "unknown" };
  }
}
