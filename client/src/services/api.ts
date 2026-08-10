import axios from 'axios';
import { Workspace, Source } from '../types/source';
import { Message, StudySession } from '../types/chat';
import { Quiz } from '../types/quiz';
import { Flashcard, StudyProgress, Reminder } from '../types/study';

const API_BASE = '/api';

const client = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ==========================================
// WORKSPACE API
// ==========================================
export const workspaceAPI = {
  list: async (userId: string = 'default_user'): Promise<Workspace[]> => {
    const res = await client.get(`/workspaces?userId=${userId}`);
    return res.data;
  },
  create: async (data: { title: string; subject: string; topic?: string; description?: string; userId?: string }): Promise<Workspace> => {
    const res = await client.post('/workspaces', data);
    return res.data;
  },
  get: async (id: string): Promise<Workspace> => {
    const res = await client.get(`/workspaces/${id}`);
    return res.data;
  },
  delete: async (id: string): Promise<{ message: string }> => {
    const res = await client.delete(`/workspaces/${id}`);
    return res.data;
  },
};

// ==========================================
// SOURCE API
// ==========================================
export const sourceAPI = {
  list: async (workspaceId: string): Promise<Source[]> => {
    const res = await client.get(`/sources?workspaceId=${workspaceId}`);
    return res.data;
  },
  uploadFile: async (workspaceId: string, file: File): Promise<Source> => {
    const formData = new FormData();
    formData.append('workspaceId', workspaceId);
    formData.append('file', file);
    const res = await client.post('/sources/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },
  uploadPastedText: async (workspaceId: string, filename: string, rawText: string): Promise<Source> => {
    const res = await client.post('/sources/upload', { workspaceId, filename, rawText });
    return res.data;
  },
  delete: async (id: string): Promise<{ message: string }> => {
    const res = await client.delete(`/sources/${id}`);
    return res.data;
  },
  rename: async (id: string, filename: string): Promise<Source> => {
    const res = await client.patch(`/sources/${id}`, { filename });
    return res.data;
  },
  getById: async (id: string): Promise<Source> => {
    const res = await client.get(`/sources/${id}`);
    return res.data;
  },
};

// ==========================================
// CHAT API
// ==========================================
export const chatAPI = {
  send: async (workspaceId: string, message: string, sessionId?: string): Promise<{ message: string; citations: any[]; sessionId: string; isGeneralKnowledge: boolean }> => {
    const res = await client.post('/chat', { workspaceId, message, sessionId });
    return res.data;
  },
  getSession: async (sessionId: string): Promise<StudySession> => {
    const res = await client.get(`/chat/${sessionId}`);
    return res.data;
  },
};

// ==========================================
// QUIZ API
// ==========================================
export const quizAPI = {
  list: async (workspaceId?: string): Promise<Quiz[]> => {
    const url = workspaceId ? `/quiz?workspaceId=${workspaceId}` : '/quiz';
    const res = await client.get(url);
    return res.data;
  },
  generate: async (workspaceId: string, topic?: string, difficulty?: string, numQuestions?: number): Promise<Quiz> => {
    const res = await client.post('/quiz/generate', { workspaceId, topic, difficulty, numQuestions });
    return res.data;
  },
  submit: async (quizId: string, answers: Record<string, string>): Promise<{ score: number; accuracy: number; totalQuestions: number; weakTopics: string[]; strongTopics: string[]; quiz: Quiz }> => {
    const res = await client.post('/quiz/submit', { quizId, answers });
    return res.data;
  },
};

// ==========================================
// FLASHCARD API
// ==========================================
export const flashcardAPI = {
  list: async (workspaceId?: string, deckName?: string): Promise<Flashcard[]> => {
    let url = '/flashcards';
    const params = [];
    if (workspaceId) params.push(`workspaceId=${workspaceId}`);
    if (deckName) params.push(`deckName=${deckName}`);
    if (params.length > 0) url += `?${params.join('&')}`;
    
    const res = await client.get(url);
    return res.data;
  },
  generate: async (workspaceId: string, deckName?: string, numCards?: number): Promise<Flashcard[]> => {
    const res = await client.post('/flashcards/generate', { workspaceId, deckName, numCards });
    return res.data;
  },
  save: async (data: { workspaceId: string; deckName?: string; question: string; answer: string; difficulty?: string }): Promise<Flashcard> => {
    const res = await client.post('/flashcards/save', data);
    return res.data;
  },
  updateStatus: async (id: string, status?: string, difficulty?: string): Promise<Flashcard> => {
    const res = await client.patch(`/flashcards/${id}`, { status, difficulty });
    return res.data;
  },
  delete: async (id: string): Promise<{ message: string }> => {
    const res = await client.delete(`/flashcards/${id}`);
    return res.data;
  },
};

// ==========================================
// STUDY TOOLS & GENERATORS
// ==========================================
export const studyAPI = {
  generateRevision: async (workspaceId: string, topic: string): Promise<{ markdown: string }> => {
    const res = await client.post('/study/revision/generate', { workspaceId, topic });
    return res.data;
  },
  generateVisual: async (workspaceId: string, topic: string): Promise<{ markdown: string }> => {
    const res = await client.post('/study/visual/generate', { workspaceId, topic });
    return res.data;
  },
  generateStudyGuide: async (workspaceId: string, topic: string): Promise<{ markdown: string }> => {
    const res = await client.post('/study/study-guide/generate', { workspaceId, topic });
    return res.data;
  },
  generateComparison: async (workspaceId: string, concept1: string, concept2: string): Promise<{ markdown: string }> => {
    const res = await client.post('/study/comparison/generate', { workspaceId, concept1, concept2 });
    return res.data;
  },
  generateMnemonic: async (workspaceId: string, topic: string): Promise<{ markdown: string }> => {
    const res = await client.post('/study/mnemonic/generate', { workspaceId, topic });
    return res.data;
  },
  analyzeQuestionPaper: async (workspaceId: string, sourceId?: string): Promise<{ markdown: string }> => {
    const res = await client.post('/study/question-paper/analyze', { workspaceId, sourceId });
    return res.data;
  },

  // Progress stats
  getProgress: async (userId: string = 'default_user'): Promise<StudyProgress> => {
    const res = await client.get(`/study/progress?userId=${userId}`);
    return res.data;
  },
  updateProgress: async (data: { 
    userId?: string; 
    studyTimeMinutes?: number; 
    questionsSolved?: number; 
    flashcardsReviewed?: number;
    quizScore?: number;
    completedTopic?: string;
    subjectName?: string;
    subjectProgressPercent?: number;
  }): Promise<StudyProgress> => {
    const res = await client.post('/study/progress', data);
    return res.data;
  },

  // Reminders
  listReminders: async (userId: string = 'default_user'): Promise<Reminder[]> => {
    const res = await client.get(`/study/reminders?userId=${userId}`);
    return res.data;
  },
  createReminder: async (data: { subject: string; topic: string; datetime: string; message?: string; userId?: string }): Promise<Reminder> => {
    const res = await client.post('/study/reminders', data);
    return res.data;
  },
  deleteReminder: async (id: string): Promise<{ message: string }> => {
    const res = await client.delete(`/study/reminders/${id}`);
    return res.data;
  },

  // Global search
  search: async (q: string): Promise<{ workspaces: Workspace[]; sources: Source[]; flashcards: Flashcard[]; quizzes: Quiz[] }> => {
    const res = await client.get(`/study/search?q=${encodeURIComponent(q)}`);
    return res.data;
  },
};
