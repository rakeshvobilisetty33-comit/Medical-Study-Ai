import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, Layers, CheckSquare, BarChart2, MessageSquare, 
  Play, Pause, Square, ArrowLeft, Download, Printer, Copy, 
  Save, Sparkles, Send, Plus, Award, AlertCircle, Clock, Folder 
} from 'lucide-react';
import { studyAPI, flashcardAPI, quizAPI, workspaceAPI } from '../services/api';
import { Workspace } from '../types/source';
import { StudySession, Message, SavedExplanation, VisualLearningItem } from '../types/chat';
import { Flashcard } from '../types/study';
import { Quiz } from '../types/quiz';
import LoadingSpinner from '../components/LoadingSpinner';
import VisualPathway from '../components/VisualPathway';
import FlashcardCard from '../components/FlashcardCard';
import MedicalDiagramView from '../components/MedicalDiagramView';
import { visualAPI } from '../services/api';

interface TopicStudySpaceProps {
  workspaceId: string;
  topic: string;
  subject: string;
  onBackToPlanner: () => void;
}

const TopicStudySpace: React.FC<TopicStudySpaceProps> = ({ 
  workspaceId, 
  topic, 
  subject,
  onBackToPlanner 
}) => {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [session, setSession] = useState<StudySession | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'flashcards' | 'questions' | 'visuals' | 'saved'>('overview');
  
  // Tab states
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [previewCards, setPreviewCards] = useState<Flashcard[]>([]);
  const [isSavingDeck, setIsSavingDeck] = useState(false);
  const [isDeckSaved, setIsDeckSaved] = useState(false);
  
  // Notes editor
  const [notesContent, setNotesContent] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesStatus, setNotesStatus] = useState<string | null>(null);

  // Active quiz state
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizResult, setQuizResult] = useState<any>(null);
  const [quizLoading, setQuizLoading] = useState(false);

  // Active flashcard study index
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  // Visual pathways creation state
  const [visualType, setVisualType] = useState<'flowchart' | 'mindmap' | 'diagram'>('flowchart');
  const [diagramSubtype, setDiagramSubtype] = useState('anatomical');
  const [visualLoading, setVisualLoading] = useState(false);

  // AI Chat inputs
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Timer states
  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerRef = useRef<any>(null);

  // Overall loading
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load all workspaces and find matching session
  useEffect(() => {
    const initializeSpace = async () => {
      setLoading(true);
      try {
        // Load workspace info
        const wsList = await workspaceAPI.list();
        const matchedWs = wsList.find(w => w._id === workspaceId);
        if (matchedWs) setWorkspace(matchedWs);

        // Get or create study session for workspace + topic
        const studySpaceSession = await studyAPI.getOrCreateSession(workspaceId, topic, subject);
        setSession(studySpaceSession);
        if (studySpaceSession.revisionNotes) {
          setNotesContent(studySpaceSession.revisionNotes);
        }

        // Load associated flashcards and quizzes
        const cards = await flashcardAPI.list(workspaceId, undefined, topic);
        setFlashcards(cards);

        const quizList = await quizAPI.list(workspaceId, topic);
        setQuizzes(quizList);

      } catch (err) {
        console.error(err);
        setErrorMessage('Failed to load study space details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    initializeSpace();
  }, [workspaceId, topic, subject]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.messages, chatLoading]);

  // Timer logic
  useEffect(() => {
    if (timerActive) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerActive]);

  // Format study timer duration display
  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Save current accumulated study timer when leaving
  const handleSaveTimer = async () => {
    if (timerSeconds === 0 || !session) return;
    const elapsedMinutes = Math.max(1, Math.round(timerSeconds / 60));
    try {
      const updatedTime = (session.totalStudyTime || 0) + elapsedMinutes;
      await studyAPI.updateSession(session._id, { totalStudyTime: updatedTime });
      await studyAPI.updateProgress({ studyTimeMinutes: elapsedMinutes });
      setSession(prev => prev ? { ...prev, totalStudyTime: updatedTime } : null);
      setTimerSeconds(0);
    } catch (err) {
      console.error('Failed to save study time:', err);
    }
  };

  const handleBackClick = async () => {
    setTimerActive(false);
    await handleSaveTimer();
    onBackToPlanner();
  };

  // AI Chat generation
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !session || chatLoading) return;

    const userText = chatInput.trim();
    setChatInput('');
    setChatLoading(true);

    const updatedMessages: Message[] = [
      ...(session.messages || []),
      { sender: 'user', text: userText, timestamp: new Date().toISOString() }
    ];

    setSession(prev => prev ? { ...prev, messages: updatedMessages } : null);

    try {
      const fullContextMessage = `[Target Subject: ${subject}, Topic: ${topic}] Student query: ${userText}`;
      const response = await studyAPI.generateFocusTopic(workspaceId, fullContextMessage);

      const botMessage: Message = {
        sender: 'ai',
        text: response.markdown,
        timestamp: new Date().toISOString()
      };

      const finalMessages = [...updatedMessages, botMessage];
      const updatedSession = await studyAPI.updateSession(session._id, { messages: finalMessages });
      setSession(updatedSession);
      
      // Calculate progress contribution
      updateStudyProgressPercent(5);

    } catch (err) {
      console.error(err);
      alert('Unable to connect with AI assistant. Please try again.');
    } finally {
      setChatLoading(false);
    }
  };

  // Save an explanation from AI Chat response
  const handleSaveExplanation = async (aiText: string, type: string) => {
    if (!session) return;
    try {
      const explanationItem = {
        type,
        explanation: aiText,
        savedAt: new Date().toISOString()
      };

      const updatedExplanations = [...(session.savedExplanations || []), explanationItem];
      const updated = await studyAPI.updateSession(session._id, { savedExplanations: updatedExplanations });
      setSession(updated);
      alert('Explanation saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save explanation.');
    }
  };

  // Generate revision summary notes
  const handleGenerateNotes = async () => {
    if (!session) return;
    setNotesStatus('Generating grounded notes...');
    try {
      const notes = await studyAPI.generateRevision(workspaceId, topic);
      setNotesContent(notes.markdown);
      const updated = await studyAPI.updateSession(session._id, { revisionNotes: notes.markdown });
      setSession(updated);
      updateStudyProgressPercent(15);
      setNotesStatus('Notes saved successfully!');
    } catch (err: any) {
      console.error(err);
      setNotesStatus(null);
      alert(err.response?.data?.error || 'Failed to generate revision notes.');
    } finally {
      setTimeout(() => setNotesStatus(null), 3000);
    }
  };

  // Save modified revision notes
  const handleSaveNotes = async () => {
    if (!session) return;
    setNotesStatus('Saving notes...');
    try {
      const updated = await studyAPI.updateSession(session._id, { revisionNotes: notesContent });
      setSession(updated);
      setIsEditingNotes(false);
      setNotesStatus('Notes saved successfully!');
    } catch (err) {
      console.error(err);
      setNotesStatus('Failed to save notes.');
    } finally {
      setTimeout(() => setNotesStatus(null), 3000);
    }
  };

  // Generate flashcards
  const handleGenerateFlashcards = async () => {
    if (!session) return;
    setNotesStatus('Generating flashcards...');
    try {
      const cardList = await flashcardAPI.generate(workspaceId, `Topic: ${topic}`, 5, topic);
      setPreviewCards(cardList);
      setIsDeckSaved(false);
      alert('Generated 5 dynamic flashcards. Review and click "Save Deck" to persist them!');
    } catch (err) {
      console.error(err);
      alert('Failed to generate flashcards.');
    } finally {
      setNotesStatus(null);
    }
  };

  const handleSaveDeck = async () => {
    if (previewCards.length === 0 || !session || isSavingDeck) return;
    setIsSavingDeck(true);
    try {
      const savedCards = await flashcardAPI.save({
        workspaceId,
        topic,
        deckName: `Topic: ${topic}`,
        flashcards: previewCards
      });
      setFlashcards(prev => [...savedCards, ...prev]);
      setPreviewCards([]);
      setIsDeckSaved(true);
      setActiveCardIndex(0);
      updateStudyProgressPercent(15);
      alert('Flashcard deck saved successfully!');
    } catch (err: any) {
      console.error(err);
      alert('Unable to save flashcards. Please try again.');
    } finally {
      setIsSavingDeck(false);
    }
  };

  // Flashcards study status wrapper
  const handleFlashcardStatusChange = async (cardId: string, status: 'known' | 'review') => {
    try {
      const updatedCard = await flashcardAPI.updateStatus(cardId, status);
      setFlashcards(prev => prev.map(c => c._id === cardId ? updatedCard : c));
      
      // Update global study progress stats
      await studyAPI.updateProgress({ flashcardsReviewed: 1 });
      updateStudyProgressPercent(2);
    } catch (err) {
      console.error(err);
    }
  };

  // Generate MCQ Quiz
  const handleGenerateQuiz = async () => {
    setQuizLoading(true);
    try {
      const quiz = await quizAPI.generate(workspaceId, topic, 'medium', 5);
      setActiveQuiz(quiz);
      setQuizAnswers({});
      setQuizResult(null);
    } catch (err) {
      console.error(err);
      alert('Failed to generate practice quiz.');
    } finally {
      setQuizLoading(false);
    }
  };

  // Submit MCQ Answers
  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;
    setQuizLoading(true);
    try {
      const result = await quizAPI.submit(activeQuiz._id, quizAnswers);
      setQuizResult(result);
      
      // Update local quizzes listing
      const quizList = await quizAPI.list(workspaceId, topic);
      setQuizzes(quizList);

      // Log statistics to database stats
      await studyAPI.updateProgress({
        questionsSolved: activeQuiz.questions.length,
        quizScore: result.score
      });
      updateStudyProgressPercent(20);

    } catch (err) {
      console.error(err);
      alert('Failed to submit quiz answers.');
    } finally {
      setQuizLoading(false);
    }
  };

  // Generate flowcharts or mindmaps
  const handleGenerateVisual = async () => {
    if (!session) return;
    setVisualLoading(true);
    try {
      let visualData;
      if (visualType === 'diagram') {
        visualData = await visualAPI.generateDiagram(workspaceId, topic, diagramSubtype);
      } else {
        visualData = await studyAPI.generateVisual(workspaceId, topic, visualType);
      }
      
      const newVisualItem: VisualLearningItem = {
        type: visualType,
        data: visualData,
        savedAt: new Date().toISOString()
      };

      const updatedVisuals = [...(session.visualLearning || []), newVisualItem];
      const updated = await studyAPI.updateSession(session._id, { visualLearning: updatedVisuals });
      setSession(updated);
      updateStudyProgressPercent(15);
      alert(`${visualType === 'flowchart' ? 'Flowchart' : 'Mindmap'} generated and saved!`);
    } catch (err) {
      console.error(err);
      alert('Failed to generate visual chart.');
    } finally {
      setVisualLoading(false);
    }
  };

  // Helper to progress percent calculator
  const updateStudyProgressPercent = async (increment: number) => {
    if (!session) return;
    const currentProgress = session.progress || 0;
    const nextProgress = Math.min(100, currentProgress + increment);
    if (nextProgress === currentProgress) return;

    try {
      const updated = await studyAPI.updateSession(session._id, { progress: nextProgress });
      setSession(updated);
    } catch (err) {
      console.error('Failed to update session progress:', err);
    }
  };

  // Print revision notes helper
  const handlePrintNotes = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${topic} - Revision Notes</title>
            <style>
              body { font-family: system-ui, sans-serif; line-height: 1.6; padding: 2rem; color: #1e293b; }
              h1, h2, h3 { color: #0f172a; margin-top: 1.5rem; }
              pre { background: #f1f5f9; padding: 1rem; border-radius: 8px; }
            </style>
          </head>
          <body>
            <h1>Topic: ${topic}</h1>
            <h3>Subject: ${subject}</h3>
            <hr />
            <div>${notesContent.replace(/\n/g, '<br />')}</div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Clipboard copy notes
  const handleCopyNotes = () => {
    navigator.clipboard.writeText(notesContent);
    alert('Notes copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <LoadingSpinner message="Initializing Topic Study Space..." />
      </div>
    );
  }

  if (errorMessage || !session) {
    return (
      <div className="max-w-md mx-auto mt-12 p-6 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h3 className="font-bold text-gray-800 dark:text-slate-100">Error Loading Space</h3>
        <p className="text-xs text-gray-500">{errorMessage || 'Study session could not be established.'}</p>
        <button onClick={onBackToPlanner} className="text-xs bg-medical-500 hover:bg-medical-600 text-white font-bold py-2 px-4 rounded-xl">
          Back to Study Planner
        </button>
      </div>
    );
  }

  // Calc accuracy metrics
  const totalQuestionsSolved = quizzes.reduce((acc, q) => acc + (q.totalQuestions || 0), 0);
  const avgQuizAccuracy = quizzes.length > 0 
    ? Math.round(quizzes.reduce((acc, q) => acc + (q.accuracy || 0), 0) / quizzes.length)
    : 0;
  
  const totalCardsMastered = flashcards.filter(c => c.status === 'known').length;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50 dark:bg-slate-950">
      
      {/* Top Banner Navigation Bar */}
      <div className="shrink-0 bg-white dark:bg-slate-900 border-b border-gray-150 dark:border-slate-800 px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={handleBackClick}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 rounded-xl transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-850 dark:text-gray-100 font-display leading-tight">{topic}</h2>
              <span className="bg-medical-50 text-medical-600 dark:bg-medical-950/30 dark:text-medical-400 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">{subject}</span>
            </div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight mt-0.5">Workspace: {workspace?.title || 'Unknown'}</p>
          </div>
        </div>

        {/* Study Timer Panel */}
        <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-850 border border-gray-200 dark:border-slate-800 p-2 rounded-2xl shrink-0">
          <div className="flex items-center gap-1.5 px-2">
            <Clock className="w-4 h-4 text-medical-500" />
            <span className="font-mono text-xs font-black text-gray-800 dark:text-slate-100">{formatTimer(timerSeconds)}</span>
          </div>
          
          <div className="flex items-center gap-1">
            {!timerActive ? (
              <button 
                onClick={() => setTimerActive(true)}
                className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition"
                title="Start Study Timer"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
              </button>
            ) : (
              <button 
                onClick={() => setTimerActive(false)}
                className="p-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition"
                title="Pause Study Timer"
              >
                <Pause className="w-3.5 h-3.5 fill-white" />
              </button>
            )}
            
            <button 
              onClick={handleSaveTimer}
              disabled={timerSeconds === 0}
              className="p-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-600 dark:text-slate-200 rounded-lg transition disabled:opacity-30"
              title="Save Study Session Time"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout Panel */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        
        {/* Left Column: Tabbed Study Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto border-r border-gray-150 dark:border-slate-800 p-6 space-y-6">
          
          {/* Tab Navigation buttons */}
          <div className="flex flex-wrap gap-1 bg-gray-100 dark:bg-slate-900 p-1 rounded-2xl self-start shrink-0">
            {[
              { id: 'overview', label: 'Study Overview', icon: BarChart2 },
              { id: 'notes', label: 'Revision Notes', icon: BookOpen },
              { id: 'flashcards', label: 'Flashcards', icon: Layers },
              { id: 'questions', label: 'Practice Questions', icon: CheckSquare },
              { id: 'visuals', label: 'Visual Learning', icon: Sparkles },
              { id: 'saved', label: 'Saved Explanations', icon: Award },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
                    activeTab === tab.id
                      ? 'bg-white dark:bg-slate-800 text-medical-600 dark:text-medical-400 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB CONTENT AREA */}
          <div className="flex-1 min-h-0 min-w-0">
            
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-6 animate-fade-in">
                
                {/* Progress bar card */}
                <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-gray-800 dark:text-slate-100 text-sm">Study Completion Progress</h3>
                      <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Earn progress points by writing notes, completing quizzes, and flashcards.</p>
                    </div>
                    <span className="text-xl font-black text-medical-500 font-mono">{session.progress || 0}%</span>
                  </div>

                  <div className="w-full bg-gray-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-medical-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${session.progress || 0}%` }}
                    />
                  </div>
                </div>

                {/* Grid stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 p-4 rounded-3xl shadow-sm text-center">
                    <p className="text-[9px] uppercase tracking-wider text-gray-400 font-bold">Accumulated Time</p>
                    <p className="text-lg font-black text-gray-850 dark:text-slate-100 font-mono mt-1">{session.totalStudyTime || 0} min</p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 p-4 rounded-3xl shadow-sm text-center">
                    <p className="text-[9px] uppercase tracking-wider text-gray-400 font-bold">Solved MCQs</p>
                    <p className="text-lg font-black text-gray-850 dark:text-slate-100 font-mono mt-1">{totalQuestionsSolved}</p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 p-4 rounded-3xl shadow-sm text-center">
                    <p className="text-[9px] uppercase tracking-wider text-gray-400 font-bold">Average Accuracy</p>
                    <p className="text-lg font-black text-gray-850 dark:text-slate-100 font-mono mt-1">{avgQuizAccuracy}%</p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 p-4 rounded-3xl shadow-sm text-center">
                    <p className="text-[9px] uppercase tracking-wider text-gray-400 font-bold">Mastered Cards</p>
                    <p className="text-lg font-black text-gray-850 dark:text-slate-100 font-mono mt-1">{totalCardsMastered} / {flashcards.length}</p>
                  </div>
                </div>

                {/* Completed Checklist */}
                <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
                  <h4 className="text-xs font-bold text-gray-850 dark:text-gray-250 uppercase tracking-wider font-display border-b border-gray-50 dark:border-slate-850 pb-2">Completed Sections</h4>
                  
                  <div className="space-y-2">
                    {[
                      { label: 'Grounded Revision Notes generated', checked: !!session.revisionNotes },
                      { label: 'Sequential Flowchart created', checked: session.visualLearning?.some(v => v.type === 'flowchart') },
                      { label: 'Hierarchical Mindmap created', checked: session.visualLearning?.some(v => v.type === 'mindmap') },
                      { label: 'Dynamic Flashcard deck generated', checked: flashcards.length > 0 },
                      { label: 'High-Yield practice MCQ quiz finished', checked: quizzes.length > 0 },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2.5 py-1 text-xs font-semibold text-gray-700 dark:text-slate-350">
                        <input 
                          type="checkbox" 
                          checked={item.checked} 
                          readOnly
                          className="w-4 h-4 border-gray-300 dark:border-slate-700 rounded text-medical-500 pointer-events-none"
                        />
                        <span className={item.checked ? 'line-through text-gray-400' : ''}>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* REVISION NOTES TAB */}
            {activeTab === 'notes' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-gray-850 dark:text-gray-200 uppercase tracking-wider font-display">Notes Editor</h3>
                  
                  <div className="flex gap-2">
                    {session.revisionNotes && (
                      <>
                        <button onClick={handleCopyNotes} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 rounded-xl transition" title="Copy to Clipboard">
                          <Copy className="w-4 h-4" />
                        </button>
                        <button onClick={handlePrintNotes} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 rounded-xl transition" title="Print Notes">
                          <Printer className="w-4 h-4" />
                        </button>
                        {!isEditingNotes ? (
                          <button onClick={() => setIsEditingNotes(true)} className="bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-350 font-bold text-xs py-1.5 px-4 rounded-xl transition">
                            Edit Notes
                          </button>
                        ) : (
                          <button onClick={handleSaveNotes} className="bg-medical-500 hover:bg-medical-600 text-white font-bold text-xs py-1.5 px-4 rounded-xl transition flex items-center gap-1">
                            <Save className="w-4 h-4" />
                            <span>Save</span>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {notesStatus && (
                  <div className="text-xs font-bold text-medical-600 bg-medical-50 dark:bg-medical-950/20 p-2.5 rounded-xl border border-medical-200 dark:border-medical-900/50">
                    {notesStatus}
                  </div>
                )}

                {!session.revisionNotes && !isEditingNotes ? (
                  <div className="p-12 text-center border border-dashed border-gray-250 dark:border-slate-800 rounded-3xl bg-white space-y-4">
                    <p className="text-xs text-gray-500">No revision notes have been generated for this topic yet.</p>
                    <button 
                      onClick={handleGenerateNotes}
                      className="bg-medical-500 hover:bg-medical-600 text-white font-bold text-xs py-2 px-5 rounded-xl shadow transition flex items-center gap-1.5 mx-auto"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Notes from Sources</span>
                    </button>
                  </div>
                ) : isEditingNotes ? (
                  <textarea
                    value={notesContent}
                    onChange={(e) => setNotesContent(e.target.value)}
                    className="w-full h-96 text-xs p-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl focus:outline-none font-mono"
                  />
                ) : (
                  <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 p-6 rounded-3xl shadow-sm text-xs text-gray-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                    {session.revisionNotes}
                  </div>
                )}
              </div>
            )}

            {/* FLASHCARDS TAB */}
            {activeTab === 'flashcards' && (
              <div className="space-y-4 animate-fade-in">
                {flashcards.length === 0 && previewCards.length === 0 ? (
                  <div className="p-12 text-center border border-dashed border-gray-250 dark:border-slate-800 rounded-3xl bg-white space-y-4">
                    <p className="text-xs text-gray-500">No flashcards generated for this topic yet.</p>
                    <button 
                      onClick={handleGenerateFlashcards}
                      className="bg-medical-500 hover:bg-medical-600 text-white font-bold text-xs py-2 px-5 rounded-xl shadow transition flex items-center gap-1.5 mx-auto"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Generate Dynamic Flashcards</span>
                    </button>
                  </div>
                ) : previewCards.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-150 dark:border-slate-800 pb-3">
                      <span className="text-xs font-bold text-gray-400">Preview Deck ({previewCards.length} Cards)</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setPreviewCards([]); }}
                          className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-slate-300 font-bold py-1.5 px-3 rounded-xl border border-gray-200 dark:border-slate-700"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveDeck}
                          disabled={isSavingDeck}
                          className="bg-medical-500 hover:bg-medical-600 text-white font-bold text-xs py-1.5 px-4 rounded-xl shadow-sm transition disabled:opacity-50"
                        >
                          {isSavingDeck ? 'Saving...' : 'Save Deck'}
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-4 max-h-[50vh] overflow-y-auto pr-1 animate-fade-in">
                      {previewCards.map((card, index) => (
                        <div key={card._id || index} className="p-4 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl space-y-2 text-xs">
                          <p className="font-bold text-gray-800 dark:text-slate-205">Q: {card.question}</p>
                          <p className="text-gray-650 dark:text-slate-400">A: {card.answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center shrink-0">
                      <span className="text-xs font-bold text-gray-400">Card {activeCardIndex + 1} of {flashcards.length}</span>
                      <button 
                        onClick={handleGenerateFlashcards}
                        className="text-xs text-medical-600 font-bold hover:underline"
                      >
                        + Generate More Cards
                      </button>
                    </div>

                    <div className="max-w-md mx-auto">
                      {flashcards[activeCardIndex] && (
                        <div className="space-y-4">
                          <FlashcardCard 
                            card={flashcards[activeCardIndex]}
                            onRateStatus={handleFlashcardStatusChange}
                            onRateDifficulty={async (id, diff) => {
                              await flashcardAPI.updateStatus(id, undefined, diff);
                              const list = await flashcardAPI.list(workspaceId, undefined, topic);
                              setFlashcards(list);
                            }}
                          />

                          <div className="flex justify-between items-center px-4">
                            <button
                              onClick={() => setActiveCardIndex(prev => Math.max(0, prev - 1))}
                              disabled={activeCardIndex === 0}
                              className="text-xs font-bold text-gray-400 hover:text-gray-600 disabled:opacity-30"
                            >
                              ← Prev
                            </button>
                            <button
                              onClick={() => setActiveCardIndex(prev => Math.min(flashcards.length - 1, prev + 1))}
                              disabled={activeCardIndex === flashcards.length - 1}
                              className="text-xs font-bold text-gray-400 hover:text-gray-600 disabled:opacity-30"
                            >
                              Next →
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* PRACTICE QUESTIONS TAB */}
            {activeTab === 'questions' && (
              <div className="space-y-6 animate-fade-in">
                
                {/* Generate Quiz Card if none is active */}
                {!activeQuiz && (
                  <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-6 shadow-sm text-center space-y-4">
                    <div className="max-w-sm mx-auto space-y-2">
                      <h4 className="font-bold text-gray-800 dark:text-slate-100 text-sm">Grounded Practice Quiz</h4>
                      <p className="text-xs text-gray-400 leading-relaxed">Take a topic quiz generated dynamically from your uploaded workspace materials.</p>
                    </div>

                    <button
                      onClick={handleGenerateQuiz}
                      disabled={quizLoading}
                      className="bg-medical-500 hover:bg-medical-600 text-white font-bold text-xs py-2.5 px-6 rounded-xl transition shadow disabled:opacity-50 flex items-center gap-1.5 mx-auto"
                    >
                      {quizLoading ? 'Creating Quiz...' : 'Generate New 5-MCQ Quiz'}
                    </button>
                  </div>
                )}

                {/* Interactive Quiz Frame */}
                {activeQuiz && !quizResult && (
                  <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-6">
                    <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-800 pb-3 shrink-0">
                      <h4 className="text-xs font-bold text-gray-800 dark:text-slate-200 uppercase tracking-wider">{activeQuiz.title}</h4>
                      <button 
                        onClick={() => setActiveQuiz(null)}
                        className="text-xs text-gray-400 hover:text-gray-600"
                      >
                        Cancel Quiz
                      </button>
                    </div>

                    <div className="space-y-5">
                      {activeQuiz.questions.map((q, qIdx) => (
                        <div key={q._id || qIdx} className="space-y-2 text-xs">
                          <p className="font-bold text-gray-850 dark:text-slate-200">{qIdx + 1}. {q.question}</p>
                          <div className="grid grid-cols-1 gap-2 pl-2">
                            {q.options.map((opt) => {
                              const isSelected = quizAnswers[q._id || qIdx] === opt;
                              return (
                                <button
                                  key={opt}
                                  onClick={() => setQuizAnswers(prev => ({ ...prev, [q._id || qIdx]: opt }))}
                                  className={`text-left p-2.5 border rounded-xl font-semibold transition ${
                                    isSelected 
                                      ? 'border-medical-500 bg-medical-50/20 text-medical-600 dark:text-medical-400' 
                                      : 'border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-850'
                                  }`}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={handleSubmitQuiz}
                      disabled={quizLoading || Object.keys(quizAnswers).length < activeQuiz.questions.length}
                      className="w-full bg-medical-500 hover:bg-medical-600 text-white font-bold text-xs py-2.5 rounded-xl shadow transition disabled:opacity-50"
                    >
                      {quizLoading ? 'Grading...' : 'Submit Answers'}
                    </button>
                  </div>
                )}

                {/* Quiz Result Scorecard */}
                {quizResult && (
                  <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6 animate-fade-in">
                    <div className="text-center space-y-2">
                      <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-full border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center mx-auto">
                        <Award className="w-8 h-8" />
                      </div>
                      <h4 className="font-bold text-gray-800 dark:text-slate-100 text-sm">Quiz Graded!</h4>
                      <p className="text-xs text-gray-500">Score: <strong className="text-emerald-500">{quizResult.score} / {quizResult.totalQuestions}</strong> ({quizResult.accuracy}%)</p>
                    </div>

                    <div className="space-y-4">
                      {activeQuiz?.questions.map((q, qIdx) => {
                        const userAns = quizAnswers[q._id || qIdx];
                        const isCorrect = userAns === q.correctAnswer;
                        return (
                          <div key={q._id || qIdx} className="p-4 border border-gray-150 dark:border-slate-800 rounded-2xl space-y-2 text-xs">
                            <p className="font-bold text-gray-800 dark:text-slate-200">{qIdx + 1}. {q.question}</p>
                            <p className={`font-semibold ${isCorrect ? 'text-emerald-600' : 'text-red-500'}`}>
                              Your Answer: {userAns || 'None'} {isCorrect ? '✓' : '✗'}
                            </p>
                            {!isCorrect && (
                              <p className="font-semibold text-gray-600 dark:text-slate-350">
                                Correct Answer: <strong className="text-emerald-600">{q.correctAnswer}</strong>
                              </p>
                            )}
                            <p className="text-[10px] text-gray-400 leading-relaxed font-medium bg-gray-50 dark:bg-slate-850 p-2.5 rounded-xl border border-gray-100 dark:border-slate-800 italic mt-1">
                              <strong>Explanation:</strong> {q.explanation}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => {
                        setActiveQuiz(null);
                        setQuizResult(null);
                      }}
                      className="w-full bg-medical-500 hover:bg-medical-600 text-white font-bold text-xs py-2.5 rounded-xl transition"
                    >
                      Finish and Return
                    </button>
                  </div>
                )}

                {/* Score History List */}
                {quizzes.length > 0 && !activeQuiz && (
                  <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
                    <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider border-b border-gray-50 dark:border-slate-850 pb-2">Quiz History</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {quizzes.map((quiz, qIdx) => (
                        <div key={quiz._id || qIdx} className="flex justify-between items-center p-3 border border-gray-100 dark:border-slate-800 rounded-xl text-xs">
                          <div>
                            <p className="font-bold text-gray-850 dark:text-slate-200">{quiz.title}</p>
                            <p className="text-[10px] text-gray-400 font-semibold">{new Date(quiz.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-emerald-500">{quiz.score} / {quiz.totalQuestions}</p>
                            <p className="text-[9px] text-gray-400 font-bold uppercase">{quiz.accuracy}% accuracy</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* VISUAL LEARNING TAB */}
            {activeTab === 'visuals' && (
              <div className="space-y-6 animate-fade-in">
                
                {/* Visual Generator Bar */}
                <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 p-4 rounded-3xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-sm shrink-0">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-700 dark:text-slate-350">Visual Type:</span>
                      <select
                        value={visualType}
                        onChange={(e) => setVisualType(e.target.value as any)}
                        className="text-xs py-1.5 px-3 bg-gray-50 dark:bg-slate-855 border border-gray-200 dark:border-slate-750 rounded-xl focus:outline-none"
                      >
                        <option value="flowchart">Sequential Flowchart</option>
                        <option value="mindmap">Hierarchical Mindmap</option>
                        <option value="diagram">Labeled Medical Diagram</option>
                      </select>
                    </div>

                    {visualType === 'diagram' && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-700 dark:text-slate-350">Layout:</span>
                        <select
                          value={diagramSubtype}
                          onChange={(e) => setDiagramSubtype(e.target.value)}
                          className="text-xs py-1.5 px-3 bg-gray-55 dark:bg-slate-850 border border-gray-200 dark:border-slate-750 rounded-xl focus:outline-none"
                        >
                          <option value="anatomical">Anatomical Structure</option>
                          <option value="flowchart">Flow Diagram / Cascade</option>
                          <option value="process">Process Pathway</option>
                          <option value="organ">Organ Anatomy</option>
                          <option value="neural">Neural Network</option>
                          <option value="vascular">Vascular Diagram</option>
                        </select>
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={handleGenerateVisual}
                    disabled={visualLoading}
                    className="bg-medical-500 hover:bg-medical-600 text-white font-bold text-xs py-2 px-5 rounded-xl transition shadow disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{visualLoading ? 'Creating Chart...' : 'Create Visual Diagram'}</span>
                  </button>
                </div>

                {/* Render Saved Visuals */}
                {session.visualLearning && session.visualLearning.length > 0 ? (
                  <div className="space-y-6">
                    {session.visualLearning.map((item, idx) => (
                      <div key={idx} className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
                        <div className="flex justify-between items-center border-b border-gray-50 dark:border-slate-850 pb-2">
                          <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 capitalize font-display">{item.type} Visualization</h4>
                          <span className="text-[10px] text-gray-400 font-semibold">{new Date(item.savedAt).toLocaleDateString()}</span>
                        </div>
                        
                        <div className="overflow-x-auto py-2">
                          {item.type === 'diagram' || (item.data && 'connections' in item.data && 'nodes' in item.data && !('edges' in item.data)) ? (
                            <MedicalDiagramView 
                              diagram={item.data}
                              workspaceId={workspaceId}
                              sessionId={session._id}
                              subject={subject}
                              topic={topic}
                              onSaveSuccess={async () => {
                                const updated = await studyAPI.getOrCreateSession(workspaceId, topic, subject);
                                setSession(updated);
                              }}
                            />
                          ) : (
                            <VisualPathway data={item.data} />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center border border-dashed border-gray-250 dark:border-slate-800 rounded-3xl bg-white space-y-2">
                    <p className="text-xs text-gray-500">No flowcharts or mindmaps saved yet for this topic.</p>
                    <p className="text-[10px] text-gray-400">Select a layout format above and click Create Visual Diagram.</p>
                  </div>
                )}

              </div>
            )}

            {/* SAVED EXPLANATIONS TAB */}
            {activeTab === 'saved' && (
              <div className="space-y-4 animate-fade-in">
                {session.savedExplanations && session.savedExplanations.length > 0 ? (
                  <div className="space-y-4">
                    {session.savedExplanations.map((exp, idx) => (
                      <div key={idx} className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
                        <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-850 pb-2">
                          <span className="bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider">{exp.type} Explanation</span>
                          <span className="text-[10px] text-gray-400 font-semibold">{new Date(exp.savedAt).toLocaleDateString()}</span>
                        </div>
                        
                        <div className="text-xs text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto font-medium">
                          {exp.explanation}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center border border-dashed border-gray-250 dark:border-slate-800 rounded-3xl bg-white">
                    <p className="text-xs text-gray-500">No explanations saved yet.</p>
                    <p className="text-[10px] text-gray-400 mt-1">Ask the AI Study Assistant in the right panel and click Save Explanation.</p>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>

        {/* Right Column: AI Study Assistant chat panel */}
        <div className="w-80 shrink-0 bg-white dark:bg-slate-900 flex flex-col overflow-hidden min-h-0 border-l border-gray-150 dark:border-slate-800">
          
          {/* Assistant Header */}
          <div className="p-4 border-b border-gray-100 dark:border-slate-800 shrink-0 flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-500 rounded-xl">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-800 dark:text-slate-100 font-display">AI Topic Assistant</h3>
              <p className="text-[9px] text-gray-400 font-semibold">Tuned specifically to study {topic}</p>
            </div>
          </div>

          {/* Messages Listing */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {session.messages && session.messages.length === 0 && (
              <div className="text-center py-12 text-[11px] text-gray-400 leading-relaxed font-semibold max-w-xs mx-auto">
                Hi! I am your medical tutor. Ask me any questions, request simplifications, or explain clinical mechanisms for <strong>{topic}</strong>.
              </div>
            )}

            {session.messages?.map((msg, idx) => {
              const isUser = msg.sender === 'user';
              return (
                <div key={idx} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}>
                  <div className={`p-3 rounded-2xl text-xs leading-relaxed max-w-[85%] font-medium ${
                    isUser
                      ? 'bg-medical-500 text-white rounded-tr-none'
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-350 rounded-tl-none whitespace-pre-wrap'
                  }`}>
                    {msg.text}
                  </div>
                  
                  {!isUser && (
                    <div className="flex gap-2.5 text-[8px] font-bold text-gray-400 px-1 mt-0.5">
                      <button 
                        onClick={() => handleSaveExplanation(msg.text, 'simple')}
                        className="hover:text-medical-500 transition"
                      >
                        [Save Simple]
                      </button>
                      <button 
                        onClick={() => handleSaveExplanation(msg.text, 'clinical')}
                        className="hover:text-medical-500 transition"
                      >
                        [Save Clinical]
                      </button>
                      <button 
                        onClick={() => handleSaveExplanation(msg.text, 'exam')}
                        className="hover:text-medical-500 transition"
                      >
                        [Save Exam]
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            
            {chatLoading && (
              <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-medium">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                <span>Tutor is thinking...</span>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* Chat Form Input */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-100 dark:border-slate-800 shrink-0 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={`Ask about ${topic}...`}
              className="flex-1 text-xs py-2 px-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none"
              required
            />
            <button
              type="submit"
              disabled={chatLoading || !chatInput.trim()}
              className="p-2 bg-medical-500 hover:bg-medical-600 text-white rounded-xl transition disabled:opacity-30 shrink-0"
            >
              <Send className="w-4 h-4 fill-white" />
            </button>
          </form>

        </div>

      </div>

    </div>
  );
};

export default TopicStudySpace;
