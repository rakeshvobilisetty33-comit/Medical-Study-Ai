import React, { useState, useEffect } from 'react';
import { HelpCircle, Award, Plus, Calendar, Clock, BarChart } from 'lucide-react';
import { quizAPI, workspaceAPI } from '../services/api';
import { Quiz as QuizType } from '../types/quiz';
import { Workspace } from '../types/source';
import QuizPanel from '../components/QuizPanel';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';

interface QuizProps {
  initialWorkspaceId?: string;
}

const Quiz: React.FC<QuizProps> = ({ initialWorkspaceId }) => {
  const [quizzes, setQuizzes] = useState<QuizType[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);

  // New Quiz generator inputs
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(initialWorkspaceId || '');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [numQuestions, setNumQuestions] = useState(5);

  // Active Quiz practice state
  const [activeQuiz, setActiveQuiz] = useState<QuizType | null>(null);
  const [generating, setGenerating] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const wsList = await workspaceAPI.list();
      setWorkspaces(wsList);
      if (wsList.length > 0 && !selectedWorkspaceId) {
        setSelectedWorkspaceId(wsList[0]._id);
      }

      const prevQuizzes = await quizAPI.list(selectedWorkspaceId || undefined);
      setQuizzes(prevQuizzes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedWorkspaceId]);

  const handleGenerateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkspaceId) return;
    setGenerating(true);

    try {
      const generated = await quizAPI.generate(
        selectedWorkspaceId,
        topic.trim() || undefined,
        difficulty,
        numQuestions
      );
      
      setActiveQuiz(generated);
      setTopic(''); // reset
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.error || err.message || 'Failed to generate practice test. Please ensure notes are uploaded in workspace.';
      alert(errMsg);
    } finally {
      setGenerating(false);
    }
  };

  const handleQuizCompleted = () => {
    // reload completed lists
    loadData();
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6 select-none">
      
      {/* Header card toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 p-5 rounded-3xl">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-2xl">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-850 dark:text-gray-100 font-display">Medical MCQ Quiz Practice</h2>
            <p className="text-[10px] text-gray-400 mt-0.5 font-semibold">Generate structured exams from syllabus materials</p>
          </div>
        </div>
      </div>

      {activeQuiz ? (
        <div className="space-y-4">
          <button 
            onClick={() => setActiveQuiz(null)}
            className="flex items-center gap-1 text-[11px] text-medical-600 hover:underline font-bold"
          >
            Exit Exam Session
          </button>
          <QuizPanel
            quiz={activeQuiz}
            onQuizCompleted={handleQuizCompleted}
            onClose={() => setActiveQuiz(null)}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          
          {/* Practice Builder (Left/Top) */}
          <div className="md:col-span-1 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-xs text-gray-800 dark:text-gray-250 uppercase tracking-wider font-display border-b border-gray-50 dark:border-slate-850 pb-2">Exam Setup</h3>
            
            {workspaces.length === 0 ? (
              <p className="text-[10px] text-gray-400 leading-relaxed">
                Create a study workspace and upload notes before generating quizzes.
              </p>
            ) : (
              <form onSubmit={handleGenerateQuiz} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">Target Workspace</label>
                  <select
                    value={selectedWorkspaceId}
                    onChange={(e) => setSelectedWorkspaceId(e.target.value)}
                    className="w-full text-xs py-2 px-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none"
                    required
                  >
                    {workspaces.map(ws => (
                      <option key={ws._id} value={ws._id}>{ws.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">Syllabus Topic</label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Heart Valves, RAAS"
                    className="w-full text-xs py-2 px-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">Difficulty</label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as any)}
                      className="w-full text-xs py-2 px-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">Questions</label>
                    <select
                      value={numQuestions}
                      onChange={(e) => setNumQuestions(parseInt(e.target.value, 10))}
                      className="w-full text-xs py-2 px-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none"
                    >
                      <option value={5}>5 MCQs</option>
                      <option value={10}>10 MCQs</option>
                      <option value={15}>15 MCQs</option>
                      <option value={20}>20 MCQs</option>
                      <option value={25}>25 MCQs</option>
                      <option value={30}>30 MCQs</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={generating}
                  className="w-full mt-3 bg-medical-500 hover:bg-medical-600 text-white font-bold text-xs py-2.5 rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {generating ? 'Generating MCQs...' : 'Generate Practice Test'}
                </button>
              </form>
            )}
          </div>

          {/* Graded logs list (Right/Bottom) */}
          <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-5 space-y-4">
            <h3 className="font-bold text-xs text-gray-800 dark:text-gray-250 uppercase tracking-wider font-display border-b border-gray-50 dark:border-slate-850 pb-2">Graded Exams Log</h3>
            
            {loading ? (
              <LoadingSpinner message="Fetching graded history..." />
            ) : quizzes.length === 0 ? (
              <div className="text-center py-12 text-xs text-gray-400">No practice tests solved yet. Build one on the left.</div>
            ) : (
              <div className="space-y-3 overflow-y-auto max-h-[350px]">
                {quizzes.map((qz) => (
                  <div 
                    key={qz._id}
                    onClick={() => setActiveQuiz(qz)}
                    className="p-3 bg-gray-50/50 dark:bg-slate-800/20 border border-gray-150 dark:border-slate-750 hover:border-medical-300 dark:hover:border-slate-700 rounded-2xl flex items-center justify-between cursor-pointer transition"
                  >
                    <div className="min-w-0 flex-1 flex gap-3 items-center">
                      <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-xl shrink-0">
                        <Award className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-gray-800 dark:text-slate-200 truncate">{qz.title}</h4>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-450 dark:text-slate-500 font-bold uppercase tracking-tight">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{new Date(qz.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex items-center gap-3">
                      <div className="hidden sm:block">
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          qz.difficulty === 'easy' ? 'bg-emerald-100 text-emerald-700' : qz.difficulty === 'hard' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {qz.difficulty}
                        </span>
                      </div>
                      <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 px-3 py-1 rounded-xl text-center">
                        <span className="block text-[11px] font-black text-emerald-600 dark:text-emerald-450 leading-none">{qz.score} / {qz.totalQuestions}</span>
                        <span className="text-[9px] text-gray-400 font-semibold">{qz.accuracy}% Acc</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};

export default Quiz;
