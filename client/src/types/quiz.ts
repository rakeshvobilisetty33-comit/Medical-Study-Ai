export interface QuizQuestion {
  _id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic?: string;
}

export interface Quiz {
  _id: string;
  workspaceId: string;
  title: string;
  questions: QuizQuestion[];
  score: number;
  totalQuestions: number;
  accuracy: number;
  difficulty: 'easy' | 'medium' | 'hard';
  weakTopics: string[];
  strongTopics: string[];
  createdAt: string;
}
