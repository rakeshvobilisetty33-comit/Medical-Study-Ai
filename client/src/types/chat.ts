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

export interface StudySession {
  _id: string;
  workspaceId: string;
  messages: Message[];
  createdAt: string;
}
