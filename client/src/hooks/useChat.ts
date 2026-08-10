import { useState, useCallback } from 'react';
import { Message, Citation } from '../types/chat';
import { chatAPI } from '../services/api';

export const useChat = (workspaceId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [activeCitations, setActiveCitations] = useState<Citation[]>([]);

  // Load chat history from a session
  const loadSession = useCallback(async (sessId: string) => {
    try {
      setLoading(true);
      const session = await chatAPI.getSession(sessId);
      setMessages(session.messages);
      setSessionId(session._id);
    } catch (err) {
      console.error('Failed to load chat session:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Send message to the workspace tutor
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    // Append user message immediately
    const userMsg: Message = {
      sender: 'user',
      text,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const response = await chatAPI.send(workspaceId, text, sessionId);
      
      const aiMsg: Message = {
        sender: 'ai',
        text: response.message,
        citations: response.citations,
        isGeneralKnowledge: response.isGeneralKnowledge,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMsg]);
      
      if (!sessionId && response.sessionId) {
        setSessionId(response.sessionId);
      }

      if (response.citations && response.citations.length > 0) {
        setActiveCitations(response.citations);
      }
    } catch (err) {
      console.error('Failed to send chat message:', err);
      const errMsg: Message = {
        sender: 'ai',
        text: 'Sorry, I encountered an error while processing your request. Please verify your connection or try again.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, sessionId]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setSessionId(undefined);
    setActiveCitations([]);
  }, []);

  return {
    messages,
    loading,
    sessionId,
    activeCitations,
    sendMessage,
    loadSession,
    clearChat,
    setMessages
  };
};
