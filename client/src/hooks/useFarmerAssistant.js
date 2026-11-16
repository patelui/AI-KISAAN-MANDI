import { useCallback, useEffect, useState } from 'react';
import api from '../utils/api';

const STORAGE_KEY = 'kisaan_assistant_chat';

const loadStoredMessages = () => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveMessages = (messages) => {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch {
    // ignore storage errors
  }
};

export const useFarmerAssistant = () => {
  const [messages, setMessages] = useState(loadStoredMessages);
  const [suggestions, setSuggestions] = useState([]);
  const [status, setStatus] = useState({ aiEnabled: false, provider: 'fallback', message: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  const loadStatus = useCallback(async () => {
    try {
      const { data } = await api.get('/farmer/assistant/status');
      setStatus(data);
    } catch {
      setStatus({
        aiEnabled: false,
        provider: 'fallback',
        message: 'Assistant is ready with built-in answers.',
      });
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const sendMessage = useCallback(async (text) => {
    const trimmed = text?.trim();
    if (!trimmed || loading) {
      return;
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    setError('');

    try {
      const history = messages.map((item) => ({
        role: item.role,
        content: item.content,
      }));

      const { data } = await api.post('/farmer/assistant/chat', {
        message: trimmed,
        history: history.slice(-8),
      });

      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        source: data.source,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      if (data.suggestions?.length) {
        setSuggestions(data.suggestions);
      }
    } catch (err) {
      const message =
        err.response?.data?.message ||
        (err.response?.status === 404
          ? 'Assistant API not found. Restart the server with: cd server && npm run dev'
          : '') ||
        err.message ||
        'Failed to get a response. Please try again.';
      setError(message);
      setMessages((prev) => prev.filter((item) => item.id !== userMessage.id));
    } finally {
      setLoading(false);
    }
  }, [loading, messages]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setSuggestions([]);
    setError('');
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    messages,
    suggestions,
    status,
    loading,
    error,
    sendMessage,
    clearChat,
    setSuggestions,
  };
};
