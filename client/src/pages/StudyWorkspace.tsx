import React, { useState, useEffect } from 'react';
import { 
  FileText, BrainCircuit, Sparkles, BookOpen, AlertCircle, 
  ArrowLeft, FileDown, Layers, HelpCircle, Columns, Lightbulb, 
  ChevronRight, ArrowRight, Check, X, FileQuestion, Target
} from 'lucide-react';
import { useSources } from '../hooks/useSources';
import { useChat } from '../hooks/useChat';
import { useStudySession } from '../hooks/useStudySession';
import { workspaceAPI, studyAPI, quizAPI, flashcardAPI } from '../services/api';
import { Workspace, Source } from '../types/source';
import { Citation } from '../types/chat';

// Component imports
import SourceList from '../components/SourceList';
import ChatWindow from '../components/ChatWindow';
import ChatInput from '../components/ChatInput';
import DocumentViewer from '../components/DocumentViewer';
import Modal from '../components/Modal';
import QuizPanel from '../components/QuizPanel';
import FlashcardCard from '../components/FlashcardCard';
import RevisionNotes from '../components/RevisionNotes';
import ComparisonTable from '../components/ComparisonTable';
import SourceUploader from '../components/SourceUploader';
import LoadingSpinner from '../components/LoadingSpinner';
import VisualPathway from '../components/VisualPathway';
import MedicalDiagramView from '../components/MedicalDiagramView';
import { visualAPI } from '../services/api';

interface StudyWorkspaceProps {
  workspaceId: string;
  onNavigateHome: () => void;
  onRefreshSidebar: () => void;
}

const StudyWorkspace: React.FC<StudyWorkspaceProps> = ({ 
  workspaceId, 
  onNavigateHome,
  onRefreshSidebar
}) => {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  
  // Mobile responsive layout tab: 'sources' | 'chat' | 'tools'
  const [mobileTab, setMobileTab] = useState<'sources' | 'chat' | 'tools'>('chat');
  
  // Custom RAG Hooks
  const { sources, loading: sourcesLoading, fetchSources, deleteSource, renameSource } = useSources(workspaceId);
  const { messages, loading: chatLoading, sendMessage, loadSession, clearChat } = useChat(workspaceId);
  const { logQuizScore, logFlashcardsReviewed, completeTopic } = useStudySession();

  // Active document viewer state
  const [activeViewSourceId, setActiveViewSourceId] = useState<string | null>(null);
  const [activeViewPage, setActiveViewPage] = useState(1);

  // Modals / Tools State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [activeToolModal, setActiveToolModal] = useState<
    'none' | 'focus' | 'summary' | 'quiz' | 'flashcards' | 'compare' | 'mnemonic' | 'visual' | 'paper'
  >('none');
  const [toolLoading, setToolLoading] = useState(false);
  const [toolOutput, setToolOutput] = useState<any>(null);
  const [toolError, setToolError] = useState<string | null>(null);

  // Form states for tools
  const [toolTopic, setToolTopic] = useState('');
  const [compareConcept1, setCompareConcept1] = useState('');
  const [compareConcept2, setCompareConcept2] = useState('');
  const [visualType, setVisualType] = useState<'flowchart' | 'mindmap' | 'diagram'>('flowchart');
  const [diagramSubtype, setDiagramSubtype] = useState('anatomical');
  const [isSavingDeck, setIsSavingDeck] = useState(false);
  const [isDeckSaved, setIsDeckSaved] = useState(false);

  // Load workspace metadata on id changes
  useEffect(() => {
    const loadWs = async () => {
      try {
        const meta = await workspaceAPI.get(workspaceId);
        setWorkspace(meta);
        setToolTopic(meta.topic || '');
      } catch (err) {
        console.error(err);
      }
    };
    loadWs();
    fetchSources();
    clearChat();
  }, [workspaceId, fetchSources, clearChat]);

  // Handle citation click: opens document viewer at page
  const handleOpenCitation = (citation: Citation) => {
    // Locate document by filename in active list
    const doc = sources.find(s => s.filename.toLowerCase() === citation.sourceName.toLowerCase());
    if (doc) {
      setActiveViewSourceId(doc._id);
      setActiveViewPage(citation.pageNumber || 1);
      setMobileTab('sources'); // switch view on mobile
    }
  };

  // Run specific AI Tools
  const runStudyTool = async (type: typeof activeToolModal) => {
    setActiveToolModal(type);
    setToolLoading(true);
    setToolOutput(null);
    setToolError(null);
    setIsSavingDeck(false);
    setIsDeckSaved(false);

    try {
      if (type === 'summary') {
        const res = await studyAPI.generateRevision(workspaceId, toolTopic || 'General Concepts');
        setToolOutput(res.markdown);
      } else if (type === 'quiz') {
        // Create 5 practice MCQs
        const qz = await quizAPI.generate(workspaceId, toolTopic || 'General Concepts', 'medium', 5);
        setToolOutput(qz);
      } else if (type === 'flashcards') {
        const cards = await flashcardAPI.generate(workspaceId, toolTopic || 'Revision Decks', 5);
        setToolOutput(cards);
      } else if (type === 'mnemonic') {
        const res = await studyAPI.generateMnemonic(workspaceId, toolTopic || 'Selected Concept');
        setToolOutput(res.markdown);
      } else if (type === 'visual') {
        const res = await studyAPI.generateVisual(workspaceId, toolTopic || 'Core Flow', 'flowchart');
        setToolOutput(res);
      } else if (type === 'compare') {
        // Wait, requires concept parameters, we prompt in form first
      } else if (type === 'paper') {
        // Analysis past exam paper
        const res = await studyAPI.analyzeQuestionPaper(workspaceId);
        setToolOutput(res.markdown);
      }
    } catch (err: any) {
      console.error(err);
      setToolError(err.response?.data?.error || err.message || 'Failed to generate study contents.');
    } finally {
      setToolLoading(false);
    }
  };

  const handleComparisonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compareConcept1 || !compareConcept2) return;
    setToolLoading(true);
    setToolError(null);
    try {
      const res = await studyAPI.generateComparison(workspaceId, compareConcept1, compareConcept2);
      setToolOutput(res.markdown);
    } catch (err: any) {
      console.error(err);
      setToolError(err.response?.data?.error || err.message || 'Comparison failed.');
    } finally {
      setToolLoading(false);
    }
  };

  const handleFocusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTopic = toolTopic.trim();
    if (!trimmedTopic) {
      alert('Please enter a topic to focus on.');
      return;
    }
    if (sources.length === 0) {
      setToolError('Please upload study sources or notes first in this workspace before selecting a focus topic.');
      return;
    }
    
    setToolLoading(true);
    setToolError(null);
    try {
      const res = await studyAPI.generateFocusTopic(workspaceId, trimmedTopic);
      setToolOutput(res.markdown);
    } catch (err: any) {
      console.error(err);
      setToolError(err.response?.data?.error || err.message || 'Unable to load your study material. Please check your connection or try again.');
    } finally {
      setToolLoading(false);
    }
  };

  const handleVisualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setToolLoading(true);
    setToolError(null);
    try {
      if (visualType === 'diagram') {
        const res = await visualAPI.generateDiagram(workspaceId, toolTopic || 'Anatomy Focus', diagramSubtype);
        setToolOutput(res);
      } else {
        const res = await studyAPI.generateVisual(workspaceId, toolTopic || 'Core Flow', visualType);
        setToolOutput(res);
      }
    } catch (err: any) {
      console.error(err);
      setToolError(err.response?.data?.error || err.message || 'Visual pathway generation failed.');
    } finally {
      setToolLoading(false);
    }
  };

  const handleQuizGradeSync = (score: number, total: number) => {
    logQuizScore(score, total);
  };

  const handleCardRateStatus = async (id: string, rate: 'known' | 'review') => {
    try {
      await flashcardAPI.updateStatus(id, rate);
      logFlashcardsReviewed(1);
      if (Array.isArray(toolOutput)) {
        setToolOutput((prev: any[]) => prev.map((c: any) => c._id === id ? { ...c, status: rate } : c));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveDeck = async () => {
    if (!toolOutput || toolOutput.length === 0 || isSavingDeck) return;
    setIsSavingDeck(true);
    try {
      const savedCards = await flashcardAPI.save({
        workspaceId,
        topic: toolTopic || workspace?.topic || 'General',
        deckName: toolTopic || 'Revision Decks',
        flashcards: toolOutput
      });
      setToolOutput(savedCards);
      setIsDeckSaved(true);
      alert('Flashcard deck saved successfully!');
    } catch (err: any) {
      console.error(err);
      alert('Unable to save flashcards. Please try again.');
    } finally {
      setIsSavingDeck(false);
    }
  };

  if (!workspace) return <div className="p-8"><LoadingSpinner message="Locating study workspace..." /></div>;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-gray-50 dark:bg-darkbg-250 transition-colors duration-200">
      
      {/* Workspace Header Toolbar */}
      <div className="bg-white dark:bg-darkbg-100 border-b border-gray-150 dark:border-slate-800 px-6 py-3 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-3">
          <button 
            onClick={onNavigateHome}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl text-gray-500 transition"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase bg-medical-500 text-white px-2 py-0.5 rounded-md">
                {workspace.subject}
              </span>
              <h2 className="text-sm font-bold text-gray-805 dark:text-slate-100 font-display truncate max-w-xs">{workspace.title}</h2>
            </div>
            {workspace.topic && <p className="text-[10px] text-gray-400 dark:text-slate-500 font-semibold mt-0.5 truncate">Focus: {workspace.topic}</p>}
          </div>
        </div>

        {/* Mobile responsive panel selectors */}
        <div className="flex sm:hidden bg-gray-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs font-bold">
          <button 
            onClick={() => setMobileTab('sources')}
            className={`px-3 py-1.5 rounded-lg transition-all ${mobileTab === 'sources' ? 'bg-white dark:bg-slate-700 text-medical-600 dark:text-medical-400' : 'text-gray-500'}`}
          >
            Sources
          </button>
          <button 
            onClick={() => setMobileTab('chat')}
            className={`px-3 py-1.5 rounded-lg transition-all ${mobileTab === 'chat' ? 'bg-white dark:bg-slate-700 text-medical-600 dark:text-medical-400' : 'text-gray-500'}`}
          >
            Chat
          </button>
          <button 
            onClick={() => setMobileTab('tools')}
            className={`px-3 py-1.5 rounded-lg transition-all ${mobileTab === 'tools' ? 'bg-white dark:bg-slate-700 text-medical-600 dark:text-medical-400' : 'text-gray-500'}`}
          >
            Tools
          </button>
        </div>
      </div>

      {/* Main Multi-Panel layout */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        
        {/* PANEL 1: LEFT - SOURCES */}
        <div className={`w-80 border-r border-gray-150 dark:border-slate-800 bg-white dark:bg-darkbg-100 p-4 flex flex-col min-h-0 shrink-0 ${
          mobileTab === 'sources' ? 'flex flex-1 w-full' : 'hidden sm:flex'
        }`}>
          {activeViewSourceId ? (
            <div className="flex flex-col h-full">
              <button 
                onClick={() => { setActiveViewSourceId(null); }}
                className="mb-4 flex items-center gap-1 text-[11px] text-medical-600 hover:underline font-bold shrink-0 self-start"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to files list</span>
              </button>
              <div className="flex-1 min-h-0">
                <DocumentViewer
                  sourceId={activeViewSourceId}
                  initialPage={activeViewPage}
                  onClose={() => setActiveViewSourceId(null)}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full min-h-0">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-850 mb-4 shrink-0">
                <span className="text-xs font-bold text-gray-800 dark:text-gray-250 uppercase tracking-wider font-display">Study Sources</span>
                <span className="bg-gray-50 dark:bg-slate-800 text-gray-500 text-[10px] px-1.5 py-0.5 rounded-md font-semibold">
                  {sources.length} total
                </span>
              </div>
              <div className="flex-1 min-h-0">
                <SourceList
                  sources={sources}
                  onDeleteSource={deleteSource}
                  onRenameSource={renameSource}
                  onOpenSource={(src) => { setActiveViewSourceId(src._id); setActiveViewPage(1); }}
                  onOpenUploadModal={() => setShowUploadModal(true)}
                />
              </div>
            </div>
          )}
        </div>

        {/* PANEL 2: CENTER - AI CHAT */}
        <div className={`flex-1 flex flex-col bg-gray-50 dark:bg-darkbg-250 min-h-0 ${
          mobileTab === 'chat' ? 'flex' : 'hidden sm:flex'
        }`}>
          {/* Messages block */}
          <div className="flex-1 flex flex-col min-h-0 py-4">
            <ChatWindow
              messages={messages}
              loading={chatLoading}
              onOpenCitation={handleOpenCitation}
            />
          </div>

          {/* Form input block */}
          <div className="p-4 bg-white/70 dark:bg-darkbg-100/70 border-t border-gray-150 dark:border-slate-800/80 shrink-0">
            <ChatInput
              onSendMessage={sendMessage}
              disabled={chatLoading}
            />
          </div>
        </div>

        {/* PANEL 3: RIGHT - STUDY TOOLS */}
        <div className={`w-72 border-l border-gray-150 dark:border-slate-800 bg-white dark:bg-darkbg-100 p-4 flex flex-col gap-4 overflow-y-auto shrink-0 ${
          mobileTab === 'tools' ? 'flex flex-1 w-full' : 'hidden lg:flex'
        }`}>
          <div className="pb-3 border-b border-gray-100 dark:border-slate-850 shrink-0">
            <span className="text-xs font-bold text-gray-800 dark:text-gray-250 uppercase tracking-wider font-display">Study Toolset</span>
          </div>

          {/* Inline topic setting */}
          <div className="space-y-1.5 shrink-0 bg-gray-50 dark:bg-slate-800/30 p-3 rounded-2xl border border-gray-150 dark:border-slate-800">
            <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Focus Topic</label>
            <input
              type="text"
              value={toolTopic}
              onChange={(e) => setToolTopic(e.target.value)}
              placeholder="e.g. Action Potential"
              className="w-full text-xs py-1.5 px-2 bg-white dark:bg-slate-850 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none"
            />
          </div>

          {/* Action buttons */}
          <div className="space-y-2">
            <button
              onClick={() => { setActiveToolModal('focus'); setToolOutput(null); setToolError(null); }}
              className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-medical-50/50 to-white dark:from-slate-800 dark:to-slate-850 border border-medical-200 dark:border-slate-750 hover:border-medical-400 rounded-2xl transition group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-medical-500 text-white rounded-xl">
                  <Target className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="font-extrabold text-xs text-medical-700 dark:text-slate-200">Focus Topic Study</p>
                  <p className="text-[10px] text-gray-450 dark:text-slate-500 mt-0.5">High-yield deep-dive guide</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-450 opacity-0 group-hover:opacity-100 transition shrink-0" />
            </button>

            <button
              onClick={() => runStudyTool('summary')}
              disabled={sources.length === 0 || toolLoading}
              className="w-full flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-gray-150 dark:border-slate-750 hover:border-medical-400 rounded-2xl transition group disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 dark:bg-amber-950/20 text-amber-500 rounded-xl">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-xs text-gray-800 dark:text-slate-200">Revision Summary</p>
                  <p className="text-[10px] text-gray-450 dark:text-slate-500 mt-0.5">High-yield revision notes</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-450 opacity-0 group-hover:opacity-100 transition shrink-0" />
            </button>

            <button
              onClick={() => runStudyTool('quiz')}
              disabled={sources.length === 0 || toolLoading}
              className="w-full flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-gray-150 dark:border-slate-750 hover:border-medical-400 rounded-2xl transition group disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-xl">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-xs text-gray-800 dark:text-slate-200">Generate MCQs</p>
                  <p className="text-[10px] text-gray-450 dark:text-slate-500 mt-0.5">Grade clinical case tests</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-450 opacity-0 group-hover:opacity-100 transition shrink-0" />
            </button>

            <button
              onClick={() => runStudyTool('flashcards')}
              disabled={sources.length === 0 || toolLoading}
              className="w-full flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-gray-150 dark:border-slate-750 hover:border-medical-400 rounded-2xl transition group disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500 rounded-xl">
                  <Layers className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-xs text-gray-800 dark:text-slate-200">Generate Cards</p>
                  <p className="text-[10px] text-gray-450 dark:text-slate-500 mt-0.5">Spaced repetition decks</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-450 opacity-0 group-hover:opacity-100 transition shrink-0" />
            </button>

            <button
              onClick={() => { setActiveToolModal('visual'); setToolOutput(null); setToolError(null); }}
              disabled={sources.length === 0 || toolLoading}
              className="w-full flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-gray-150 dark:border-slate-750 hover:border-medical-400 rounded-2xl transition group disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-950/20 text-blue-500 rounded-xl">
                  <BrainCircuit className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-xs text-gray-800 dark:text-slate-200">Visual Pathways</p>
                  <p className="text-[10px] text-gray-450 dark:text-slate-500 mt-0.5">Flowcharts & Mindmaps</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-450 opacity-0 group-hover:opacity-100 transition shrink-0" />
            </button>

            <button
              onClick={() => { setActiveToolModal('compare'); setToolOutput(null); setToolError(null); }}
              disabled={sources.length === 0 || toolLoading}
              className="w-full flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-gray-150 dark:border-slate-750 hover:border-medical-400 rounded-2xl transition group disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 dark:bg-purple-950/20 text-purple-500 rounded-xl">
                  <Columns className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-xs text-gray-800 dark:text-slate-200">Compare Concepts</p>
                  <p className="text-[10px] text-gray-450 dark:text-slate-500 mt-0.5">Differential tables VS</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-450 opacity-0 group-hover:opacity-100 transition shrink-0" />
            </button>

            <button
              onClick={() => runStudyTool('mnemonic')}
              disabled={sources.length === 0 || toolLoading}
              className="w-full flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-gray-150 dark:border-slate-750 hover:border-medical-400 rounded-2xl transition group disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-xl">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-xs text-gray-800 dark:text-slate-200">Study Mnemonic</p>
                  <p className="text-[10px] text-gray-450 dark:text-slate-500 mt-0.5">Acronyms & memory tricks</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-450 opacity-0 group-hover:opacity-100 transition shrink-0" />
            </button>

            <button
              onClick={() => runStudyTool('paper')}
              disabled={sources.length === 0 || toolLoading}
              className="w-full flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-gray-150 dark:border-slate-750 hover:border-medical-400 rounded-2xl transition group disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-50 dark:bg-cyan-950/20 text-cyan-500 rounded-xl">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-xs text-gray-800 dark:text-slate-200">Past Paper Trends</p>
                  <p className="text-[10px] text-gray-450 dark:text-slate-500 mt-0.5">Frequently asked metrics</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-450 opacity-0 group-hover:opacity-100 transition shrink-0" />
            </button>
          </div>
        </div>

      </div>

      {/* MODAL 1: ADD / UPLOAD SOURCE */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Add Medical Study Source"
      >
        <SourceUploader
          workspaceId={workspaceId}
          onUploadSuccess={() => {
            fetchSources();
            setShowUploadModal(false);
          }}
        />
      </Modal>

      {/* MODAL 2: ACTIVE TOOLS VIEWER */}
      <Modal
        isOpen={activeToolModal !== 'none'}
        onClose={() => { setActiveToolModal('none'); setToolOutput(null); }}
        title={`${activeToolModal === 'focus' ? 'Focus Topic Study Guide' : activeToolModal === 'summary' ? 'Revision Notes' : activeToolModal === 'quiz' ? 'MCQ Practice' : activeToolModal === 'flashcards' ? 'Revision Flashcards' : activeToolModal === 'visual' ? 'Process Map Flow' : activeToolModal === 'compare' ? 'Concept Comparison' : activeToolModal === 'mnemonic' ? 'Study Mnemonic' : 'Past Paper Patterns'}`}
      >
        <div className="w-full">
          {toolLoading ? (
            <LoadingSpinner message={activeToolModal === 'focus' ? 'Analyzing your study material...' : 'Generating content using medical data model...'} />
          ) : toolError ? (
            <div className="p-5 text-center bg-red-50 dark:bg-red-950/20 text-red-650 dark:text-red-400 border border-red-150 dark:border-red-900/50 rounded-2xl space-y-2">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
              <p className="font-bold text-xs">Generation Failed</p>
              <p className="text-[11px] leading-relaxed opacity-90">{toolError}</p>
            </div>
          ) : activeToolModal === 'focus' && !toolOutput ? (
            <form onSubmit={handleFocusSubmit} className="space-y-4">
              <p className="text-xs text-gray-400 dark:text-slate-500 font-semibold leading-relaxed">Analyze your study sources and generate a high-yield study sheet focused on a specific medical topic.</p>
              
              {sources.length === 0 ? (
                <div className="p-4 text-center bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-150 dark:border-amber-900/50 rounded-2xl text-xs font-semibold">
                  Please upload study sources or notes first in this workspace before selecting a focus topic.
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">What topic do you want to focus on?</label>
                    <input
                      type="text"
                      maxLength={100}
                      value={toolTopic}
                      onChange={(e) => setToolTopic(e.target.value)}
                      placeholder="e.g. Action Potential, Brachial Plexus"
                      className="w-full text-xs py-2.5 px-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-750 rounded-xl focus:outline-none"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-medical-500 hover:bg-medical-600 text-white font-bold text-xs py-2.5 rounded-xl shadow-md transition"
                  >
                    Analyze Focus Topic
                  </button>
                </>
              )}
            </form>
          ) : activeToolModal === 'visual' && !toolOutput ? (
            <form onSubmit={handleVisualSubmit} className="space-y-4">
              <p className="text-xs text-gray-400 dark:text-slate-500">Generate a structured biological mechanism pathway or anatomical concepts map from your notes.</p>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Focus Concept/Topic</label>
                <input
                  type="text"
                  value={toolTopic}
                  onChange={(e) => setToolTopic(e.target.value)}
                  placeholder="e.g. Cardiac Cycle, Reflex Arc"
                  className="w-full text-xs py-2 px-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-750 rounded-xl focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Diagram Format</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setVisualType('flowchart')}
                    className={`py-2 text-[10px] font-bold rounded-xl border transition ${
                      visualType === 'flowchart'
                        ? 'bg-medical-500 text-white border-medical-500 shadow-sm'
                        : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-750 dark:text-slate-200'
                    }`}
                  >
                    Flowchart
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisualType('mindmap')}
                    className={`py-2 text-[10px] font-bold rounded-xl border transition ${
                      visualType === 'mindmap'
                        ? 'bg-medical-500 text-white border-medical-500 shadow-sm'
                        : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-750 dark:text-slate-200'
                    }`}
                  >
                    Mindmap
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisualType('diagram')}
                    className={`py-2 text-[10px] font-bold rounded-xl border transition ${
                      visualType === 'diagram'
                        ? 'bg-medical-500 text-white border-medical-500 shadow-sm'
                        : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-750 dark:text-slate-200'
                    }`}
                  >
                    Labeled Diagram
                  </button>
                </div>
              </div>

              {visualType === 'diagram' && (
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Diagram Layout Type</label>
                  <select
                    value={diagramSubtype}
                    onChange={(e) => setDiagramSubtype(e.target.value)}
                    className="w-full text-xs py-2 px-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-medical-500 text-gray-800 dark:text-slate-200"
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
              <button
                type="submit"
                className="w-full bg-medical-500 hover:bg-medical-600 text-white font-bold text-xs py-2.5 rounded-xl shadow-md transition"
              >
                Generate Visual Pathway
              </button>
            </form>
          ) : activeToolModal === 'compare' && !toolOutput ? (
            <form onSubmit={handleComparisonSubmit} className="space-y-4">
              <p className="text-xs text-gray-405 dark:text-slate-500">Compare two clinical diseases, pharmacology agents, or anatomical paths based on your uploads.</p>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Concept 1</label>
                <input
                  type="text"
                  value={compareConcept1}
                  onChange={(e) => setCompareConcept1(e.target.value)}
                  placeholder="e.g. Crohn's Disease"
                  className="w-full text-xs py-2 px-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-750 rounded-xl"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Concept 2</label>
                <input
                  type="text"
                  value={compareConcept2}
                  onChange={(e) => setCompareConcept2(e.target.value)}
                  placeholder="e.g. Ulcerative Colitis"
                  className="w-full text-xs py-2 px-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-750 rounded-xl"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-medical-500 hover:bg-medical-600 text-white font-bold text-xs py-2.5 rounded-xl shadow-md transition"
              >
                Generate Comparison Matrix
              </button>
            </form>
          ) : toolOutput ? (
            <div className="space-y-4">
              
              {/* Focus Topic Study Guide Output */}
              {activeToolModal === 'focus' && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl overflow-y-auto max-h-[50vh] border border-gray-150 dark:border-slate-800">
                    <RevisionNotes markdown={toolOutput} topic={toolTopic} />
                  </div>
                  
                  {/* Optional Study Actions */}
                  <div className="bg-gray-50 dark:bg-slate-800/30 p-4 rounded-2xl border border-gray-150 dark:border-slate-800 space-y-2">
                    <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">Explore Focused Study Actions</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          setActiveToolModal('quiz');
                          runStudyTool('quiz');
                        }}
                        className="flex items-center gap-2 p-2 bg-white dark:bg-slate-800 border border-gray-150 dark:border-slate-700 hover:border-emerald-400 rounded-xl text-left text-xs transition"
                      >
                        <HelpCircle className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="font-semibold text-gray-700 dark:text-slate-200">Generate MCQs</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveToolModal('flashcards');
                          runStudyTool('flashcards');
                        }}
                        className="flex items-center gap-2 p-2 bg-white dark:bg-slate-800 border border-gray-150 dark:border-slate-700 hover:border-indigo-400 rounded-xl text-left text-xs transition"
                      >
                        <Layers className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="font-semibold text-gray-700 dark:text-slate-200">Generate Cards</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveToolModal('summary');
                          runStudyTool('summary');
                        }}
                        className="flex items-center gap-2 p-2 bg-white dark:bg-slate-800 border border-gray-150 dark:border-slate-700 hover:border-amber-400 rounded-xl text-left text-xs transition"
                      >
                        <FileText className="w-3.5 h-3.5 text-amber-500" />
                        <span className="font-semibold text-gray-700 dark:text-slate-200">Generate Summary</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveToolModal('visual');
                          runStudyTool('visual');
                        }}
                        className="flex items-center gap-2 p-2 bg-white dark:bg-slate-800 border border-gray-150 dark:border-slate-700 hover:border-blue-400 rounded-xl text-left text-xs transition"
                      >
                        <BrainCircuit className="w-3.5 h-3.5 text-blue-500" />
                        <span className="font-semibold text-gray-700 dark:text-slate-200">Create Study Notes</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Revision Summaries */}
              {activeToolModal === 'summary' && (
                <RevisionNotes
                  markdown={toolOutput}
                  topic={toolTopic || 'General Concepts'}
                  onMarkAsStudied={() => {
                    completeTopic(toolTopic || 'General', workspace.subject, 100);
                  }}
                />
              )}

              {/* MCQ Quiz Panels */}
              {activeToolModal === 'quiz' && (
                <QuizPanel
                  quiz={toolOutput}
                  onQuizCompleted={handleQuizGradeSync}
                  onClose={() => setActiveToolModal('none')}
                />
              )}

              {/* Spaced Repetition Decks */}
              {activeToolModal === 'flashcards' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
                    <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-wider">Dynamic Deck Deployed ({toolOutput.length} Cards)</p>
                    
                    <button
                      onClick={handleSaveDeck}
                      disabled={isSavingDeck || isDeckSaved}
                      className={`text-xs font-bold py-1.5 px-4 rounded-xl transition ${
                        isDeckSaved
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-250 cursor-default'
                          : 'bg-medical-500 hover:bg-medical-600 text-white shadow-sm'
                      }`}
                    >
                      {isSavingDeck ? 'Saving...' : isDeckSaved ? '✓ Saved' : 'Save Deck'}
                    </button>
                  </div>
                  
                  <div className="flex flex-col gap-4 max-h-[50vh] overflow-y-auto pr-1 animate-fade-in">
                    {toolOutput.map((card: any) => (
                      <FlashcardCard
                        key={card._id}
                        card={card}
                        onRateStatus={handleCardRateStatus}
                        onRateDifficulty={async (id, diff) => {
                          await flashcardAPI.updateStatus(id, undefined, diff);
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Differential Comparison Matrices */}
              {activeToolModal === 'compare' && (
                <ComparisonTable markdown={toolOutput} />
              )}

              {/* Visual Pathways flowcharts/mindmaps */}
              {activeToolModal === 'visual' && (
                <div className="space-y-4">
                  {toolOutput && 'connections' in toolOutput && 'nodes' in toolOutput && !('edges' in toolOutput) ? (
                    <MedicalDiagramView 
                      diagram={toolOutput}
                      workspaceId={workspaceId}
                      subject={workspace.subject}
                      topic={toolTopic}
                    />
                  ) : (
                    <div className="p-4 bg-slate-50 dark:bg-slate-855 rounded-2xl overflow-y-auto max-h-[50vh] border border-gray-150 dark:border-slate-800 animate-fade-in">
                      <VisualPathway data={toolOutput} />
                    </div>
                  )}
                </div>
              )}

              {/* Acronym Mnemonics, Past Papers */}
              {(activeToolModal === 'mnemonic' || activeToolModal === 'paper') && (
                <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl overflow-y-auto max-h-[50vh]">
                  <RevisionNotes markdown={toolOutput} topic={toolTopic} />
                </div>
              )}

            </div>
          ) : (
            <div className="text-center py-6 text-xs text-gray-400">Failed to render tool output.</div>
          )}
        </div>
      </Modal>

    </div>
  );
};

export default StudyWorkspace;
