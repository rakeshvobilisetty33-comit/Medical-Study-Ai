import React, { useState, useEffect } from 'react';
import { Search, X, Folder, FileText, HelpCircle, Layers, ArrowRight } from 'lucide-react';
import { studyAPI } from '../services/api';
import { Workspace, Source } from '../types/source';
import { Quiz } from '../types/quiz';
import { Flashcard } from '../types/study';

interface SearchBarProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: string, id?: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    workspaces: Workspace[];
    sources: Source[];
    flashcards: Flashcard[];
    quizzes: Quiz[];
  }>({ workspaces: [], sources: [], flashcards: [], quizzes: [] });

  useEffect(() => {
    if (!query.trim()) {
      setResults({ workspaces: [], sources: [], flashcards: [], quizzes: [] });
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await studyAPI.search(query);
        setResults(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const hasResults = 
    results.workspaces.length > 0 || 
    results.sources.length > 0 || 
    results.flashcards.length > 0 || 
    results.quizzes.length > 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm flex justify-center p-4 pt-[10vh]">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh] transform scale-100 transition-all duration-300">
        
        {/* Search Input Bar */}
        <div className="p-4 border-b border-gray-100 dark:border-slate-850 flex items-center gap-3 shrink-0">
          <Search className="w-5 h-5 text-gray-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search everything: RAAS, nephrotic, Anatomy, brachial..."
            className="flex-1 text-sm bg-transparent border-0 focus:outline-none focus:ring-0 text-gray-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 font-sans"
            autoFocus
          />
          <button 
            onClick={onClose}
            className="p-1 text-gray-450 hover:text-gray-700 bg-gray-100 dark:bg-slate-800 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="text-center py-12 text-xs text-gray-400 font-medium animate-pulse">
              Searching databases...
            </div>
          ) : !query.trim() ? (
            <div className="text-center py-12 text-xs text-gray-400 dark:text-slate-500">
              Type keywords above to find lectures, revision decks, or practice logs.
            </div>
          ) : !hasResults ? (
            <div className="text-center py-12 text-xs text-gray-400 dark:text-slate-500">
              No matching records found. Try another query.
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Workspaces results */}
              {results.workspaces.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold text-gray-400 dark:text-slate-550 uppercase tracking-wider mb-1.5 px-2">Workspaces</h4>
                  <div className="space-y-1">
                    {results.workspaces.map(ws => (
                      <button
                        key={ws._id}
                        onClick={() => { onNavigate('workspace', ws._id); onClose(); }}
                        className="w-full text-left p-2 hover:bg-gray-50 dark:hover:bg-slate-800/40 border border-transparent hover:border-gray-150 dark:hover:border-slate-800 rounded-xl flex items-center justify-between group transition text-xs font-semibold"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Folder className="w-4 h-4 text-medical-500 shrink-0" />
                          <span className="truncate text-gray-800 dark:text-slate-200">{ws.title} ({ws.subject})</span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sources results */}
              {results.sources.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold text-gray-400 dark:text-slate-550 uppercase tracking-wider mb-1.5 px-2">Documents</h4>
                  <div className="space-y-1">
                    {results.sources.map(src => (
                      <button
                        key={src._id}
                        onClick={() => { onNavigate('workspace', src.workspaceId); onClose(); }}
                        className="w-full text-left p-2 hover:bg-gray-50 dark:hover:bg-slate-800/40 border border-transparent hover:border-gray-150 dark:hover:border-slate-800 rounded-xl flex items-center justify-between group transition text-xs font-medium"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-4 h-4 text-red-500 shrink-0" />
                          <span className="truncate text-gray-850 dark:text-slate-200">{src.filename}</span>
                        </div>
                        <span className="text-[9px] bg-gray-50 dark:bg-slate-800 text-gray-400 px-1.5 py-0.5 rounded-md uppercase font-bold shrink-0">Open Workspace</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Flashcards results */}
              {results.flashcards.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold text-gray-400 dark:text-slate-550 uppercase tracking-wider mb-1.5 px-2">Flashcards</h4>
                  <div className="space-y-1">
                    {results.flashcards.map(card => (
                      <button
                        key={card._id}
                        onClick={() => { onNavigate('flashcards'); onClose(); }}
                        className="w-full text-left p-2.5 hover:bg-gray-50 dark:hover:bg-slate-800/40 border border-transparent hover:border-gray-150 dark:hover:border-slate-800 rounded-xl flex flex-col gap-1 transition text-xs"
                      >
                        <div className="flex items-center gap-1.5 font-bold text-[10px] text-gray-450 dark:text-slate-500 uppercase tracking-tight">
                          <Layers className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Deck: {card.deckName}</span>
                        </div>
                        <p className="font-semibold text-gray-800 dark:text-slate-200 line-clamp-1">{card.question}</p>
                        <p className="text-gray-450 dark:text-slate-400 line-clamp-1 text-[11px] font-medium italic">"{card.answer}"</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quizzes results */}
              {results.quizzes.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold text-gray-400 dark:text-slate-550 uppercase tracking-wider mb-1.5 px-2">Practice Logs</h4>
                  <div className="space-y-1">
                    {results.quizzes.map(qz => (
                      <button
                        key={qz._id}
                        onClick={() => { onNavigate('quiz'); onClose(); }}
                        className="w-full text-left p-2 hover:bg-gray-50 dark:hover:bg-slate-800/40 border border-transparent hover:border-gray-150 dark:hover:border-slate-800 rounded-xl flex items-center justify-between group transition text-xs font-semibold"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <HelpCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span className="truncate text-gray-800 dark:text-slate-200">{qz.title} (Accuracy: {qz.accuracy}%)</span>
                        </div>
                        <span className="text-[9px] bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 px-2 py-0.5 rounded-full shrink-0 font-extrabold">{qz.score}/{qz.totalQuestions}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
