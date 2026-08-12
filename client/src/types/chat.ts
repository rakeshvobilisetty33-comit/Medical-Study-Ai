export interface Citation {
  sourceId: string;
  sourceName: string;
  pageNumber: number;
  excerpt: string;
}

export interface Message {
  _id?: string;
  sender: 'user' | 'ai';
  text: string;
  citations?: Citation[];
  isGeneralKnowledge?: boolean;
  timestamp: string;
}

export interface SavedExplanation {
  _id?: string;
  type: string; // simple, clinical, exam
  explanation: string;
  savedAt: string;
}

export interface VisualLearningItem {
  _id?: string;
  type: string; // flowchart, mindmap, etc.
  data: any;
  savedAt: string;
}

export interface StudySession {
  _id: string;
  workspaceId: string;
  subject?: string;
  topic?: string;
  messages: Message[];
  startedAt?: string;
  lastStudiedAt?: string;
  totalStudyTime?: number;
  progress?: number;
  completedSections?: string[];
  revisionNotes?: string;
  savedExplanations?: SavedExplanation[];
  visualLearning?: VisualLearningItem[];
  createdAt: string;
}
