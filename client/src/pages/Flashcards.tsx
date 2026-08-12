import React, { useState, useEffect } from 'react';
import { Layers, Plus, RotateCcw, AlertCircle, BookOpen, Trash2, CheckCircle } from 'lucide-react';
import { flashcardAPI, workspaceAPI } from '../services/api';
import { Flashcard } from '../types/study';
import { Workspace } from '../types/source';
import FlashcardCard from '../components/FlashcardCard';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';

interface FlashcardsProps {
  initialWorkspaceId?: string;
}

const Flashcards: React.FC<FlashcardsProps> = ({ initialWorkspaceId }) => {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selection/Filter States
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(initialWorkspaceId || '');
  const [decks, setDecks] = useState<string[]>([]);
  const [selectedDeck, setSelectedDeck] = useState('All');

  // Study Session Carousel States
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [reviewCountThisSession, setReviewCountThisSession] = useState(0);
  const [reviewFilter, setReviewFilter] = useState<'queue' | 'mastered' | 'all'>('queue');
  const [isDeckFinished, setIsDeckFinished] = useState(false);

  // Manual Creation states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createWorkspaceId, setCreateWorkspaceId] = useState('');
  const [createDeckName, setCreateDeckName] = useState('Custom Decks');
  const [createQuestion, setCreateQuestion] = useState('');
  const [createAnswer, setCreateAnswer] = useState('');
  const [createDiff, setCreateDiff] = useState<'easy' | 'medium' | 'hard'>('medium');

  const loadData = async () => {
    setLoading(true);
    try {
      const wsList = await workspaceAPI.list();
      setWorkspaces(wsList);

      // Fetch cards
      const allCards = await flashcardAPI.list(selectedWorkspaceId || undefined);
      setCards(allCards);
      
      // Compile deck names
      const deckNames = Array.from(new Set(allCards.map(c => c.deckName)));
      setDecks(deckNames);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedWorkspaceId]);

  const handleRateStatus = async (id: string, status: 'known' | 'review') => {
    try {
      await flashcardAPI.updateStatus(id, status);
      setReviewCountThisSession(prev => prev + 1);
      
      // update state locally
      setCards(prev => prev.map(c => c._id === id ? { ...c, status, reviewCount: c.reviewCount + 1 } : c));
      
      // Determine if we finished the deck or need to advance
      const nextFiltered = filteredCards.filter(c => c._id !== id);
      if (nextFiltered.length === 0) {
        setTimeout(() => setIsDeckFinished(true), 300);
      } else if (carouselIndex >= nextFiltered.length) {
        setTimeout(() => {
          setIsDeckFinished(true);
        }, 300);
      } else {
        // If the card remains in this view (e.g. filter is 'all'), we advance the index
        if (reviewFilter === 'all' || (reviewFilter === 'queue' && status === 'review') || (reviewFilter === 'mastered' && status === 'known')) {
          if (carouselIndex < filteredCards.length - 1) {
            setTimeout(() => setCarouselIndex(prev => prev + 1), 300);
          } else {
            setTimeout(() => setIsDeckFinished(true), 300);
          }
        }
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update flashcard status. Please try again.');
    }
  };

  const handleDeleteCard = async (id: string) => {
    if (!confirm('Are you sure you want to delete this card?')) return;
    try {
      await flashcardAPI.delete(id);
      setCards(prev => prev.filter(c => c._id !== id));
      if (carouselIndex >= cards.length - 2) {
        setCarouselIndex(Math.max(0, cards.length - 3));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createWorkspaceId || !createQuestion.trim() || !createAnswer.trim()) return;

    try {
      const saved = await flashcardAPI.save({
        workspaceId: createWorkspaceId,
        deckName: createDeckName.trim() || 'Custom Deck',
        question: createQuestion.trim(),
        answer: createAnswer.trim(),
        difficulty: createDiff
      });

      setCards(prev => [saved, ...prev]);
      // reset forms
      setCreateQuestion('');
      setCreateAnswer('');
      setShowCreateModal(false);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredCards = cards.filter(c => {
    const matchesDeck = selectedDeck === 'All' ? true : c.deckName === selectedDeck;
    if (!matchesDeck) return false;
    
    if (reviewFilter === 'queue') {
      return c.status !== 'known';
    } else if (reviewFilter === 'mastered') {
      return c.status === 'known';
    }
    return true;
  });

  const knownCount = cards.filter(c => c.status === 'known').length;
  const reviewCount = cards.filter(c => c.status === 'review').length;
  const remainingCount = cards.filter(c => c.status !== 'known' && c.status !== 'review').length;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6 select-none">
      
      {/* Header tool bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 p-5 rounded-3xl">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500 rounded-2xl">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-850 dark:text-gray-100 font-display">Spaced Repetition Flashcards</h2>
            <p className="text-[10px] text-gray-400 mt-0.5 font-semibold">Test your recall on active terminology decks</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Workspace select filter */}
          <select
            value={selectedWorkspaceId}
            onChange={(e) => { setSelectedWorkspaceId(e.target.value); setCarouselIndex(0); }}
            className="text-xs py-2 px-3 bg-gray-50 dark:bg-slate-800 border border-gray-205 dark:border-slate-700 rounded-xl focus:outline-none"
          >
            <option value="">All Workspaces</option>
            {workspaces.map(ws => (
              <option key={ws._id} value={ws._id}>{ws.title}</option>
            ))}
          </select>

          {/* New Card button */}
          <button
            onClick={() => {
              if (workspaces.length > 0) {
                setCreateWorkspaceId(selectedWorkspaceId || workspaces[0]._id);
              }
              setShowCreateModal(true);
            }}
            className="bg-medical-500 hover:bg-medical-600 text-white font-bold text-xs py-2 px-4 rounded-xl transition flex items-center gap-1 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Card</span>
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Fetching revision decks..." />
      ) : filteredCards.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-gray-200 dark:border-slate-800 rounded-3xl bg-white/40 dark:bg-slate-900/10">
          <p className="text-xs text-gray-400 dark:text-slate-500 mb-2">No flashcards found in this section.</p>
          <p className="text-[11px] text-gray-400/80 max-w-xs mx-auto leading-relaxed">
            Create cards using the button above, or go to your Workspace and click <strong>Generate Flashcards</strong> on the right panel.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          
          {/* Carousel panel (Left/Center) */}
          <div className="md:col-span-2 space-y-4 animate-fade-in">
            {isDeckFinished ? (
              <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-sm">
                <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-100 dark:border-emerald-900/50">
                  <CheckCircle className="w-8 h-8" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100 font-display">Well Done!</h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                    You have completed reviewing all the cards in this queue. Mastered cards have been moved to your known list.
                  </p>
                </div>

                <div className="flex justify-center gap-4 py-2 border-y border-gray-100 dark:border-slate-850 max-w-xs mx-auto text-xs font-bold text-gray-500">
                  <div>
                    <p className="text-gray-800 dark:text-slate-200 text-sm font-black">{reviewCountThisSession}</p>
                    <p className="text-[9px] uppercase tracking-wider text-gray-400">Session Reviews</p>
                  </div>
                  <div className="w-px bg-gray-200 dark:bg-slate-800"></div>
                  <div>
                    <p className="text-gray-800 dark:text-slate-200 text-sm font-black">{knownCount}</p>
                    <p className="text-[9px] uppercase tracking-wider text-gray-400">Total Mastered</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-center gap-3">
                  <button
                    onClick={() => {
                      setCarouselIndex(0);
                      setIsDeckFinished(false);
                      setReviewCountThisSession(0);
                    }}
                    className="bg-medical-500 hover:bg-medical-600 text-white font-bold text-xs py-2.5 px-6 rounded-xl transition shadow-md"
                  >
                    Restart Deck Review
                  </button>
                  <button
                    onClick={() => {
                      setReviewFilter('all');
                      setCarouselIndex(0);
                      setIsDeckFinished(false);
                    }}
                    className="bg-gray-100 hover:bg-gray-250 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-250 font-bold text-xs py-2.5 px-6 rounded-xl transition"
                  >
                    View All Cards
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
                <div className="flex justify-between items-center text-xs font-bold text-gray-400 mb-4 pb-2 border-b border-gray-100 dark:border-slate-850 shrink-0">
                  <span>Card {carouselIndex + 1} of {filteredCards.length}</span>
                  <span>Session Reviews: {reviewCountThisSession}</span>
                </div>
 
                {/* Slider */}
                <div className="py-2">
                  {filteredCards[carouselIndex] && (
                    <div className="space-y-4">
                      <FlashcardCard
                        card={filteredCards[carouselIndex]}
                        onRateStatus={handleRateStatus}
                        onRateDifficulty={async (id, diff) => {
                          await flashcardAPI.updateStatus(id, undefined, diff);
                          loadData();
                        }}
                      />
                      <div className="flex justify-center mt-2.5">
                        <button
                          onClick={() => handleDeleteCard(filteredCards[carouselIndex]._id)}
                          className="text-gray-400 hover:text-red-500 p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition flex items-center gap-1 text-[10px] font-bold"
                          title="Delete Card"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Card</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
 
                {/* Reset session controls */}
                <div className="flex justify-between mt-4 pt-3 border-t border-gray-100 dark:border-slate-850">
                  <button
                    onClick={() => setCarouselIndex(prev => Math.max(0, prev - 1))}
                    disabled={carouselIndex === 0}
                    className="text-xs font-semibold text-gray-400 hover:text-gray-700 disabled:opacity-30"
                  >
                    Previous Card
                  </button>
                  
                  <button
                    onClick={() => {
                      setCarouselIndex(0);
                      setIsDeckFinished(false);
                      setReviewCountThisSession(0);
                    }}
                    className="text-xs font-semibold text-medical-600 hover:underline flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restart Deck</span>
                  </button>
 
                  <button
                    onClick={() => setCarouselIndex(prev => Math.min(filteredCards.length - 1, prev + 1))}
                    disabled={carouselIndex === filteredCards.length - 1}
                    className="text-xs font-semibold text-gray-400 hover:text-gray-700 disabled:opacity-30"
                  >
                    Next Card
                  </button>
                </div>
              </div>
            )}
          </div>
 
          {/* Decks Filters side panel (Right) */}
          <div className="md:col-span-1 space-y-4">
            
            {/* Progress Panel */}
            <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-sm">
              <div className="bg-gray-50 dark:bg-slate-800/25 border border-gray-150 dark:border-slate-800/80 rounded-2xl p-4 space-y-3">
                <span className="text-[10px] font-extrabold text-gray-400 dark:text-slate-500 uppercase tracking-wider block">Deck Progress</span>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white dark:bg-slate-850 p-2 rounded-xl border border-gray-100 dark:border-slate-800">
                    <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">{knownCount}</p>
                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tight">Known</p>
                  </div>
                  <div className="bg-white dark:bg-slate-850 p-2 rounded-xl border border-gray-100 dark:border-slate-800">
                    <p className="text-xs font-black text-amber-600 dark:text-amber-400">{reviewCount}</p>
                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tight">Review</p>
                  </div>
                  <div className="bg-white dark:bg-slate-850 p-2 rounded-xl border border-gray-100 dark:border-slate-800">
                    <p className="text-xs font-black text-indigo-600 dark:text-indigo-400">{remainingCount}</p>
                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tight">Remaining</p>
                  </div>
                </div>
              </div>

              {/* Review Filter Queue Tabs */}
              <div className="flex bg-gray-50 dark:bg-slate-800/40 p-1.5 rounded-2xl border border-gray-150 dark:border-slate-800">
                <button
                  onClick={() => { setReviewFilter('queue'); setCarouselIndex(0); setIsDeckFinished(false); }}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-[10px] font-bold transition ${
                    reviewFilter === 'queue'
                      ? 'bg-white dark:bg-slate-700 text-medical-600 dark:text-medical-400 shadow-sm'
                      : 'text-gray-550 dark:text-slate-400 hover:text-gray-800'
                  }`}
                >
                  Queue
                </button>
                <button
                  onClick={() => { setReviewFilter('mastered'); setCarouselIndex(0); setIsDeckFinished(false); }}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-[10px] font-bold transition ${
                    reviewFilter === 'mastered'
                      ? 'bg-white dark:bg-slate-700 text-medical-600 dark:text-medical-400 shadow-sm'
                      : 'text-gray-550 dark:text-slate-400 hover:text-gray-800'
                  }`}
                >
                  Mastered
                </button>
                <button
                  onClick={() => { setReviewFilter('all'); setCarouselIndex(0); setIsDeckFinished(false); }}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-[10px] font-bold transition ${
                    reviewFilter === 'all'
                      ? 'bg-white dark:bg-slate-700 text-medical-600 dark:text-medical-400 shadow-sm'
                      : 'text-gray-550 dark:text-slate-400 hover:text-gray-800'
                  }`}
                >
                  All
                </button>
              </div>
            </div>

            {/* Categories Selection list */}
            <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-sm">
              <h3 className="font-bold text-xs text-gray-800 dark:text-gray-250 uppercase tracking-wider font-display border-b border-gray-50 dark:border-slate-850 pb-2">Deck Categories</h3>
              <div className="space-y-1.5">
                <button
                  onClick={() => { setSelectedDeck('All'); setCarouselIndex(0); setIsDeckFinished(false); }}
                  className={`w-full text-left py-2 px-3 rounded-xl text-xs font-semibold transition ${
                    selectedDeck === 'All' 
                      ? 'bg-medical-50 dark:bg-medical-950/30 text-medical-600 dark:text-medical-400' 
                      : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                  }`}
                >
                  All Categories ({cards.length})
                </button>
                {decks.map((deck, idx) => {
                  const count = cards.filter(c => c.deckName === deck).length;
                  return (
                    <button
                      key={idx}
                      onClick={() => { setSelectedDeck(deck); setCarouselIndex(0); setIsDeckFinished(false); }}
                      className={`w-full text-left py-2 px-3 rounded-xl text-xs font-semibold transition ${
                        selectedDeck === deck 
                          ? 'bg-medical-50 dark:bg-medical-950/30 text-medical-600 dark:text-medical-400' 
                          : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {deck} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Manual Card Creation Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Custom Flashcard"
      >
        <form onSubmit={handleCreateCard} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">Target Workspace</label>
            <select
              value={createWorkspaceId}
              onChange={(e) => setCreateWorkspaceId(e.target.value)}
              className="w-full text-xs py-2 px-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none"
              required
            >
              {workspaces.map(ws => (
                <option key={ws._id} value={ws._id}>{ws.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 dark:text-slate-550 uppercase tracking-wider mb-1">Deck Name</label>
            <input
              type="text"
              value={createDeckName}
              onChange={(e) => setCreateDeckName(e.target.value)}
              placeholder="e.g. Pharmacology Basics"
              className="w-full text-xs py-2 px-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 dark:text-slate-550 uppercase tracking-wider mb-1">Question (Front)</label>
            <input
              type="text"
              value={createQuestion}
              onChange={(e) => setCreateQuestion(e.target.value)}
              placeholder="e.g. What is the mechanism of action of Heparin?"
              className="w-full text-xs py-2.5 px-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 dark:text-slate-550 uppercase tracking-wider mb-1">Answer / Explanation (Back)</label>
            <textarea
              value={createAnswer}
              onChange={(e) => setCreateAnswer(e.target.value)}
              placeholder="e.g. Heparin binds to antithrombin III, accelerating its inhibition of thrombin (factor IIa) and factor Xa."
              rows={3}
              className="w-full text-xs py-2.5 px-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 dark:text-slate-550 uppercase tracking-wider mb-1">Card Difficulty</label>
            <select
              value={createDiff}
              onChange={(e) => setCreateDiff(e.target.value as any)}
              className="w-full text-xs py-2 px-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-medical-500 hover:bg-medical-600 text-white font-bold text-xs py-2.5 rounded-xl transition"
          >
            Save Flashcard
          </button>
        </form>
      </Modal>

    </div>
  );
};

export default Flashcards;
