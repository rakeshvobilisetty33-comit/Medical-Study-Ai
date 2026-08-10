import React, { useState } from 'react';
import { RefreshCw, CheckCircle, RotateCw } from 'lucide-react';
import { Flashcard } from '../types/study';

interface FlashcardCardProps {
  card: Flashcard;
  onRateStatus: (id: string, status: 'known' | 'review') => void;
  onRateDifficulty: (id: string, diff: 'easy' | 'medium' | 'hard') => void;
}

const FlashcardCard: React.FC<FlashcardCardProps> = ({ card, onRateStatus, onRateDifficulty }) => {
  const [flipped, setFlipped] = useState(false);

  const getDifficultyColor = (diff: string) => {
    if (diff === 'easy') return 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400';
    if (diff === 'hard') return 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400';
    return 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400';
  };

  const getStatusColor = (status: string) => {
    if (status === 'known') return 'border-emerald-500';
    if (status === 'review') return 'border-amber-500';
    return 'border-gray-200 dark:border-slate-800';
  };

  return (
    <div className="w-full max-w-md mx-auto h-72 perspective-1000 select-none">
      <div 
        onClick={() => setFlipped(!flipped)}
        className={`w-full h-full relative duration-500 preserve-3d cursor-pointer ${
          flipped ? 'rotate-y-180' : ''
        }`}
      >
        {/* FRONT SIDE */}
        <div className={`absolute inset-0 backface-hidden bg-white dark:bg-slate-800 border-2 ${getStatusColor(card.status)} rounded-3xl p-6 flex flex-col justify-between shadow-lg`}>
          {/* Card Header */}
          <div className="flex justify-between items-center shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">
              Deck: {card.deckName}
            </span>
            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${getDifficultyColor(card.difficulty)}`}>
              {card.difficulty}
            </span>
          </div>

          {/* Card Body */}
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
            <p className="font-semibold text-gray-800 dark:text-slate-100 text-sm leading-relaxed font-display">
              {card.question}
            </p>
          </div>

          {/* Card Footer */}
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-400 dark:text-slate-500 font-bold tracking-tight">
            <RotateCw className="w-3.5 h-3.5" />
            <span>Click to Reveal Answer</span>
          </div>
        </div>

        {/* BACK SIDE */}
        <div className={`absolute inset-0 backface-hidden rotate-y-180 bg-slate-50 dark:bg-slate-900 border-2 border-medical-500/50 rounded-3xl p-6 flex flex-col justify-between shadow-lg overflow-hidden`}>
          {/* Card Header */}
          <div className="flex justify-between items-center shrink-0 border-b border-gray-200/50 dark:border-slate-800 pb-2">
            <span className="text-[10px] font-bold text-medical-600 dark:text-medical-400">ANSWER / EXPLANATION</span>
            <span className="text-[10px] text-gray-400 dark:text-slate-500">
              Reviews: {card.reviewCount}
            </span>
          </div>

          {/* Card Body */}
          <div className="flex-1 overflow-y-auto py-4 text-center flex items-center justify-center">
            <p className="text-gray-700 dark:text-slate-350 text-xs leading-relaxed font-sans whitespace-pre-wrap">
              {card.answer}
            </p>
          </div>

          {/* Rating Section (Intercepts card flip clicks by calling stopPropagation) */}
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="flex items-center gap-2 border-t border-gray-200/50 dark:border-slate-800 pt-3 shrink-0"
          >
            {/* Status Rate */}
            <button
              onClick={() => onRateStatus(card._id, 'review')}
              className="flex-1 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold rounded-xl border border-amber-500/20 transition"
            >
              Needs Review
            </button>
            <button
              onClick={() => onRateStatus(card._id, 'known')}
              className="flex-1 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-xl border border-emerald-500/20 transition"
            >
              I Know It!
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default FlashcardCard;
