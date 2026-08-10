import React, { useState, useEffect } from 'react';
import { Layers, Plus, RotateCcw, AlertCircle, BookOpen, Trash2 } from 'lucide-react';
import { flashcardAPI, workspaceAPI } from '../services/api';
import { Flashcard } from '../types/study';
import { Workspace } from '../types/source';
import FlashcardCard from '../components/FlashcardCard';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';

const Flashcards: React.FC = () => {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selection/Filter States
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('');
  const [decks, setDecks] = useState<string[]>([]);
  const [selectedDeck, setSelectedDeck] = useState('All');

  // Study Session Carousel States
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [reviewCountThisSession, setReviewCountThisSession] = useState(0);

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
      if (wsList.length > 0 && !selectedWorkspaceId) {
        setSelectedWorkspaceId(wsList[0]._id);
      }

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
      
      // advance carousel
      if (carouselIndex < filteredCards.length - 1) {
        setTimeout(() => setCarouselIndex(prev => prev + 1), 300);
      }
    } catch (err) {
      console.error(err);
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

  const filteredCards = cards.filter(c => 
    selectedDeck === 'All' ? true : c.deckName === selectedDeck
  );

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
          <div className="md:col-span-2 space-y-4">
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
                  onClick={() => setCarouselIndex(0)}
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
          </div>

          {/* Decks Filters side panel (Right) */}
          <div className="md:col-span-1 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-5 space-y-4">
            <h3 className="font-bold text-xs text-gray-800 dark:text-gray-250 uppercase tracking-wider font-display border-b border-gray-50 dark:border-slate-850 pb-2">Deck Categories</h3>
            <div className="space-y-1.5">
              <button
                onClick={() => { setSelectedDeck('All'); setCarouselIndex(0); }}
                className={`w-full text-left py-2 px-3 rounded-xl text-xs font-semibold transition ${
                  selectedDeck === 'All' 
                    ? 'bg-medical-50 dark:bg-medical-950/30 text-medical-600 dark:text-medical-400' 
                    : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                }`}
              >
                All Cards ({cards.length})
              </button>
              {decks.map((deck, idx) => {
                const count = cards.filter(c => c.deckName === deck).length;
                return (
                  <button
                    key={idx}
                    onClick={() => { setSelectedDeck(deck); setCarouselIndex(0); }}
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
