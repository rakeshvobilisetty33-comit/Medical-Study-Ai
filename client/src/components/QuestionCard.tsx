import React from 'react';
import { Check, X, AlertCircle } from 'lucide-react';
import { QuizQuestion } from '../types/quiz';

interface QuestionCardProps {
  question: QuizQuestion;
  selectedOption: string | null;
  onSelectOption: (option: string) => void;
  showFeedback: boolean;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ 
  question, 
  selectedOption, 
  onSelectOption, 
  showFeedback 
}) => {
  const letters = ['A', 'B', 'C', 'D'];

  const getOptionClasses = (option: string) => {
    const base = "w-full flex items-center justify-between p-3.5 rounded-2xl text-xs font-medium border text-left transition-all duration-150 ";
    
    if (!showFeedback) {
      if (selectedOption === option) {
        return base + "bg-medical-50 border-medical-500 text-medical-700 dark:bg-medical-950/20 dark:text-medical-400";
      }
      return base + "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-750 hover:bg-gray-50 dark:hover:bg-slate-700/60 text-gray-700 dark:text-slate-200";
    }

    // Feedback Mode (graded)
    const isCorrect = option === question.correctAnswer;
    const isSelected = option === selectedOption;

    if (isCorrect) {
      return base + "bg-emerald-50 border-emerald-500 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 font-semibold";
    }
    if (isSelected && !isCorrect) {
      return base + "bg-red-50 border-red-500 text-red-800 dark:bg-red-950/20 dark:text-red-400";
    }
    return base + "bg-white dark:bg-slate-800 border-gray-150 dark:border-slate-750 text-gray-400 dark:text-slate-550 opacity-60";
  };

  return (
    <div className="space-y-4">
      {/* Question Vignette */}
      <div className="p-4 bg-gray-50 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-850 rounded-2xl">
        <p className="text-xs font-bold uppercase tracking-wider text-medical-600 dark:text-medical-400 mb-1.5">
          {question.topic || 'Clinical Case Scenario'}
        </p>
        <p className="text-sm font-semibold text-gray-800 dark:text-slate-100 leading-relaxed font-display">
          {question.question}
        </p>
      </div>

      {/* Options grid */}
      <div className="space-y-2.5">
        {question.options.map((option, index) => {
          const letter = letters[index] || '•';
          const isSelected = option === selectedOption;
          const isCorrect = option === question.correctAnswer;

          return (
            <button
              key={index}
              onClick={() => !showFeedback && onSelectOption(option)}
              className={getOptionClasses(option)}
              disabled={showFeedback}
            >
              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold border shrink-0 ${
                  showFeedback 
                    ? isCorrect
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : isSelected
                        ? 'bg-red-500 border-red-500 text-white'
                        : 'bg-gray-100 dark:bg-slate-700 text-gray-400 border-gray-250 dark:border-slate-600'
                    : isSelected
                      ? 'bg-medical-500 border-medical-500 text-white'
                      : 'bg-gray-50 dark:bg-slate-800 text-gray-500 border-gray-200 dark:border-slate-700'
                }`}>
                  {letter}
                </span>
                <span className="font-sans leading-relaxed">{option}</span>
              </div>

              {/* Status Icons */}
              {showFeedback && (
                <span className="shrink-0 pl-2">
                  {isCorrect && <Check className="w-4 h-4 text-emerald-500 font-bold" />}
                  {isSelected && !isCorrect && <X className="w-4 h-4 text-red-500" />}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Feedback explanation details */}
      {showFeedback && question.explanation && (
        <div className="p-4 bg-emerald-50/40 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/60 rounded-2xl">
          <div className="flex gap-2 items-start text-emerald-800 dark:text-emerald-400">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold">Clinical Clarification:</p>
              <p className="leading-relaxed text-gray-650 dark:text-slate-350">{question.explanation}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionCard;
