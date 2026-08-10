import { useState, useEffect, useCallback, useRef } from 'react';
import { StudyProgress } from '../types/study';
import { studyAPI } from '../services/api';

export const useStudySession = (userId: string = 'default_user') => {
  const [progress, setProgress] = useState<StudyProgress | null>(null);
  const [activeSessionMinutes, setActiveSessionMinutes] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const timerRef = useRef<any>(null);
  const secondsRef = useRef(0);

  // Fetch progress stats
  const fetchProgress = useCallback(async () => {
    setLoading(true);
    try {
      const data = await studyAPI.getProgress(userId);
      setProgress(data);
    } catch (err) {
      console.error('Failed to retrieve progress:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Sync session minutes to database
  const syncSessionMinutes = useCallback(async (minutesToSync: number) => {
    if (minutesToSync <= 0) return;
    try {
      const updated = await studyAPI.updateProgress({
        userId,
        studyTimeMinutes: minutesToSync
      });
      setProgress(updated);
      setActiveSessionMinutes(0); // reset synced count
    } catch (err) {
      console.error('Error syncing study minutes:', err);
    }
  }, [userId]);

  // Log completed topic
  const completeTopic = useCallback(async (topic: string, subject: string, percent: number) => {
    try {
      const updated = await studyAPI.updateProgress({
        userId,
        completedTopic: topic,
        subjectName: subject,
        subjectProgressPercent: percent
      });
      setProgress(updated);
    } catch (err) {
      console.error('Error logging topic completion:', err);
    }
  }, [userId]);

  // Log quiz accuracy
  const logQuizScore = useCallback(async (score: number, questionsCount: number) => {
    try {
      const updated = await studyAPI.updateProgress({
        userId,
        questionsSolved: questionsCount,
        quizScore: score
      });
      setProgress(updated);
    } catch (err) {
      console.error('Error logging quiz scores:', err);
    }
  }, [userId]);

  // Log flashcard reviews
  const logFlashcardsReviewed = useCallback(async (count: number) => {
    try {
      const updated = await studyAPI.updateProgress({
        userId,
        flashcardsReviewed: count
      });
      setProgress(updated);
    } catch (err) {
      console.error('Error logging flashcard reviews:', err);
    }
  }, [userId]);

  // Track session timer
  useEffect(() => {
    // Start session timer
    timerRef.current = setInterval(() => {
      secondsRef.current += 1;
      if (secondsRef.current >= 60) {
        secondsRef.current = 0;
        setActiveSessionMinutes(prev => {
          const newMin = prev + 1;
          // Sync dynamically every 5 minutes to avoid data loss
          if (newMin % 5 === 0) {
            syncSessionMinutes(5);
          }
          return newMin;
        });
      }
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      // Sync remaining minutes on unmount
      const remainingMinutes = Math.floor(secondsRef.current / 60) + activeSessionMinutes;
      if (remainingMinutes > 0) {
        syncSessionMinutes(remainingMinutes);
      }
    };
  }, [syncSessionMinutes, activeSessionMinutes]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  return {
    progress,
    activeSessionMinutes,
    loading,
    fetchProgress,
    syncSessionMinutes,
    completeTopic,
    logQuizScore,
    logFlashcardsReviewed
  };
};
