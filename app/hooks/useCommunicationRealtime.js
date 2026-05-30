"use client";

import { useEffect, useRef, useCallback } from "react";
import { subscribeToConversation, subscribeToPresence, updatePresence } from "../lib/communications/communicationsService";

export function useCommunicationRealtime(conversationId, { onMessage, onActivity } = {}) {
  const onMessageRef = useRef(onMessage);
  const onActivityRef = useRef(onActivity);
  onMessageRef.current = onMessage;
  onActivityRef.current = onActivity;

  useEffect(() => {
    if (!conversationId) return undefined;
    return subscribeToConversation(conversationId, {
      onMessage: (msg) => onMessageRef.current?.(msg),
      onActivity: (evt) => onActivityRef.current?.(evt),
    });
  }, [conversationId]);
}

export function usePresence() {
  useEffect(() => {
    updatePresence(true).catch(() => {});

    const heartbeat = setInterval(() => {
      updatePresence(true).catch(() => {});
    }, 30000);

    const handleUnload = () => {
      navigator.sendBeacon?.("/api/communications/users", JSON.stringify({ is_online: false }));
      updatePresence(false).catch(() => {});
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      clearInterval(heartbeat);
      window.removeEventListener("beforeunload", handleUnload);
      updatePresence(false).catch(() => {});
    };
  }, []);
}

export function usePresenceUpdates(onPresence) {
  const handlerRef = useRef(onPresence);
  handlerRef.current = onPresence;

  useEffect(() => subscribeToPresence({
    onPresence: (profile) => handlerRef.current?.(profile),
  }), []);
}

export function useTypingIndicator(conversationId, currentUserId) {
  const typingUsersRef = useRef(new Map());
  const timeoutRef = useRef(null);

  const emitTyping = useCallback(() => {
    if (!conversationId) return;
    // Typing is local-only for now; can extend with Supabase Broadcast
    typingUsersRef.current.set(currentUserId, Date.now());
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      typingUsersRef.current.delete(currentUserId);
    }, 2000);
  }, [conversationId, currentUserId]);

  return { emitTyping, typingUsers: typingUsersRef.current };
}
