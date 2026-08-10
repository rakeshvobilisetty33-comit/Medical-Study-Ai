export interface Flashcard {
  _id: string;
  workspaceId: string;
  deckName: string;
  question: string;
  answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'new' | 'learning' | 'review' | 'known';
  reviewCount: number;
  nextReviewDate: string;
  createdAt: string;
}

export interface WeeklyMinutes {
  day: string;
  minutes: number;
}

export interface StudyProgress {
  _id: string;
  userId: string;
  totalStudyTime: number; // minutes
  topicsStudiedCount: number;
  topicsCompleted: string[];
  questionsSolved: number;
  flashcardsReviewed: number;
  averageQuizScore: number;
  dailyStreak: number;
  lastStudyDate?: string;
  subjectProgress: Record<string, number>; // subject -> % progress
  weeklyStudyMinutes: WeeklyMinutes[];
  createdAt: string;
}

export interface Reminder {
  _id: string;
  userId: string;
  subject: string;
  topic: string;
  datetime: string;
  message?: string;
  active: boolean;
  createdAt: string;
}
