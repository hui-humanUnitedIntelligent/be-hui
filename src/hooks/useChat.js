// src/hooks/useChat.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatService } from '../services/db';
import { supabase } from '.../lib/supabaseClient';

export function useConversations(userId) {
  const [convos,  setConvos]  = useState([]);
  const [loading, setLoading] = useState(!!userId);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    if (!userId) { setLoading(false); return; }

    // Pure async IIFE — no .then()
    (async () => {
      const { data } = await ChatService.getConversations(userId);
      if (!mounted.current) return;
      setConvos(data || []);
      setLoading(false);
    })();

    // Realtime: conversation list updates
    const channel = supabase.channel(`convos:${userId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'conversations',
        filter: `participant_a=eq.${userId}`,
      }, payload => {
        setConvos(prev => prev.map(c => c.id === payload.new.id ? payload.new : c));
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'conversations',
        filter: `participant_b=eq.${userId}`,
      }, payload => {
        setConvos(prev => prev.map(c => c.id === payload.new.id ? payload.new : c));
      })
      .subscribe();

    return () => {
      mounted.current = false;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return { convos, loading };
}

export function useMessages(conversationId, currentUserId) {
  const [messages, setMessages] = useState([]);
  const [loading,  setLoading]  = useState(!!conversationId);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    if (!conversationId) { setLoading(false); return; }

    // Pure async IIFE — no .then()
    (async () => {
      const { data } = await ChatService.getMessages(conversationId, 0);
      if (!mounted.current) return;
      setMessages(data || []);
      setLoading(false);
    })();

    // Mark as read — fire & forget is OK here
    if (currentUserId) ChatService.markRead(conversationId, currentUserId);

    // Realtime — only for active chat window
    const channel = supabase.channel(`msgs:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, payload => {
        if (!mounted.current) return;
        setMessages(prev => {
          if (prev.some(m => m.id === payload.new.id)) return prev;
          return [...prev, payload.new];
        });
        if (payload.new.sender_id !== currentUserId && currentUserId) {
          ChatService.markRead(conversationId, currentUserId);
        }
      })
      .subscribe();

    return () => {
      mounted.current = false;
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const sendMessage = useCallback(async (text, type = 'text') => {
    if (!conversationId || !currentUserId) return null;
    const { data } = await ChatService.sendMessage(conversationId, currentUserId, text, type);
    if (data) {
      setMessages(prev => prev.some(m => m.id === data.id) ? prev : [...prev, data]);
    }
    return data;
  }, [conversationId, currentUserId]);

  return { messages, loading, sendMessage };
}
