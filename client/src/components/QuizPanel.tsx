import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2, Award, Clock, RefreshCw, BookOpen } from 'lucide-react';
import { Quiz } from '../types/quiz';
import QuestionCard from './QuestionCard';
import { quizAPI } from '../services/api';

interface QuizPanelProps {
  quiz: Quiz;
  onQuizCompleted: (score: number, total: number) => void;
  onClose: () => void;
}

const QuizPanel: React.FC<QuizPanelProps> = ({ quiz, onQuizCompleted, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [gradedResults, setGradedResults] = useState<any>(null);
  
  // Timer State
  const [secondsLeft, setSecondsLeft] = useState(quiz.questions.length * 60); // 1 min per question
  const [timerActive, setTimerActive] = useState(true);

  useEffect(() => {
    if (!timerActive || secondsLeft <= 0 || submitted) return;

    const timer = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitQuiz(); // Auto submit on timer run-out
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timerActive, secondsLeft, submitted]);

  const handleSelectOption = (optionText: string) => {
    const questionId = quiz.questions[currentIndex]?._id;
    if (!questionId || submitted) return;

    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionText
    }));
  };

  const handleNext = () => {
    if (currentIndex < quiz.questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    if (submitted) return;
    setSubmitting(true);
    setTimerActive(false);

    try {
      const result = await quizAPI.submit(quiz._id, selectedAnswers);
      setGradedResults(result);
      setSubmitted(true);
      onQuizCompleted(result.score, result.totalQuestions);
    } catch (err) {
      console.error('Failed to submit quiz:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentQuestion = quiz.questions[currentIndex];
  const isQuestionAnswered = currentQuestion ? !!selectedAnswers[currentQuestion._id] : false;
  const progressPercent = Math.round(((currentIndex + 1) / quiz.questions.length) * 100);

  // 1. DISPLAY COMPLETED GRADING CARD
  if (submitted && gradedResults) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-gray-100 dark:border-slate-800 shadow-xl max-w-xl mx-auto space-y-6">
        <div className="text-center">
          <div className="inline-flex p-4 bg-medical-50 dark:bg-medical-950/20 text-medical-500 rounded-full mb-3 active-pulse">
            <Award className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 font-display">Quiz Complete!</h2>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Practice makes doctors. Here is your scorecard:</p>
        </div>

        {/* Scoring board */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-850 rounded-2xl text-center">
            <p className="text-xs text-gray-400 dark:text-slate-500 font-bold uppercase tracking-wider">Score</p>
            <p className="text-3xl font-extrabold text-medical-600 dark:text-medical-450 mt-1">
              {gradedResults.score} <span className="text-sm font-medium text-gray-400">/ {gradedResults.totalQuestions}</span>
            </p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-850 rounded-2xl text-center">
            <p className="text-xs text-gray-400 dark:text-slate-500 font-bold uppercase tracking-wider">Accuracy</p>
            <p className={`text-3xl font-extrabold mt-1 ${gradedResults.accuracy >= 70 ? 'text-emerald-500' : gradedResults.accuracy >= 40 ? 'text-amber-500' : 'text-red-500'}`}>
              {gradedResults.accuracy}%
            </p>
          </div>
        </div>

        {/* Analytics Section */}
        <div className="space-y-3.5">
          {gradedResults.strongTopics.length > 0 && (
            <div className="p-3.5 bg-emerald-50/30 dark:bg-emerald-950/10 border border-emerald-100/50 dark:border-emerald-900/40 rounded-2xl">
              <p className="text-xs font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Strong Concepts (Mastered):</span>
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {gradedResults.strongTopics.map((topic: string, i: number) => (
                  <span key={i} className="text-[10px] bg-white dark:bg-slate-850 border border-emerald-250 dark:border-emerald-900/60 px-2 py-0.5 rounded-full text-emerald-700 dark:text-emerald-400 font-semibold">{topic}</span>
                ))}
              </div>
            </div>
          )}

          {gradedResults.weakTopics.length > 0 && (
            <div className="p-3.5 bg-red-50/30 dark:bg-red-950/10 border border-red-100/50 dark:border-red-900/40 rounded-2xl">
              <p className="text-xs font-bold text-red-800 dark:text-red-400 flex items-center gap-1.5">
                <Clock className="w-4 h-4 shrink-0" />
                <span>Needs Revision (Review Recommended):</span>
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {gradedResults.weakTopics.map((topic: string, i: number) => (
                  <span key={i} className="text-[10px] bg-white dark:bg-slate-850 border border-red-250 dark:border-red-900/60 px-2 py-0.5 rounded-full text-red-700 dark:text-red-400 font-semibold">{topic}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => {
              setSubmitted(false);
              setGradedResults(null);
              setSelectedAnswers({});
              setCurrentIndex(0);
              setSecondsLeft(quiz.questions.length * 60);
              setTimerActive(true);
            }}
            className="flex-1 py-2.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-250 dark:hover:bg-slate-700 text-xs font-bold text-gray-700 dark:text-slate-300 rounded-xl transition flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retake Quiz</span>
          </button>
          
          <button
            onClick={() => {
              // Allows reviewing question cards with green/red feedback badges active
              setSubmitted(false);
              setCurrentIndex(0);
            }}
            className="flex-1 py-2.5 bg-medical-500 hover:bg-medical-600 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Review Answers</span>
          </button>
        </div>
      </div>
    );
  }

  // 2. ACTIVE QUIZ CARDS INTERFACE
  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-5 shadow-lg max-w-xl mx-auto flex flex-col justify-between min-h-[480px]">
      
      {/* Header controls */}
      <div className="flex items-center justify-between shrink-0 mb-4 pb-3 border-b border-gray-100 dark:border-slate-850">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-medical-600 dark:text-medical-450 uppercase bg-medical-50 dark:bg-medical-950/30 px-2.5 py-0.5 rounded-full">
            Question {currentIndex + 1} of {quiz.questions.length}
          </span>
          {gradedResults && (
            <span className="text-[10px] font-extrabold uppercase bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 px-2 py-0.5 rounded-full">
              Reviewing Graded
            </span>
          )}
        </div>

        {/* Timer countdown */}
        {!gradedResults && (
          <div className="flex items-center gap-1 text-xs font-bold text-gray-600 dark:text-slate-400">
            <Clock className="w-4 h-4 text-medical-500 animate-pulse" />
            <span className="font-mono">{formatTime(secondsLeft)}</span>
          </div>
        )}
      </div>

      {/* Progress Line */}
      <div className="w-full bg-gray-100 dark:bg-slate-800 h-1 rounded-full mb-6 overflow-hidden shrink-0">
        <div className="bg-medical-500 h-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
      </div>

      {/* Main question card */}
      <div className="flex-1 min-h-0">
        {currentQuestion ? (
          <QuestionCard
            question={currentQuestion}
            selectedOption={selectedAnswers[currentQuestion._id] || null}
            onSelectOption={handleSelectOption}
            showFeedback={!!gradedResults}
          />
        ) : (
          <div className="text-center py-12 text-sm text-gray-400">Question indexing error.</div>
        )}
      </div>

      {/* Footer slide buttons */}
      <div className="flex items-center justify-between border-t border-gray-100 dark:border-slate-850 mt-6 pt-4 shrink-0">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200 disabled:opacity-30 disabled:pointer-events-none"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        {currentIndex === quiz.questions.length - 1 ? (
          !gradedResults ? (
            <button
              onClick={handleSubmitQuiz}
              disabled={submitting || Object.keys(selectedAnswers).length < quiz.questions.length}
              className="bg-medical-500 hover:bg-medical-600 active:scale-95 text-white font-bold text-xs py-2 px-5 rounded-xl shadow-md transition disabled:opacity-40 disabled:scale-100"
            >
              {submitting ? 'Grading...' : 'Submit Answers'}
            </button>
          ) : (
            <button
              onClick={onClose}
              className="bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs py-2 px-5 rounded-xl transition"
            >
              Close Review
            </button>
          )
        ) : (
          <button
            onClick={handleNext}
            className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-medical-600 hover:text-medical-700 dark:text-medical-400"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

    </div>
  );
};

export default QuizPanel;
