import React, { useState, useEffect } from 'react';
import { BookOpen, FolderPlus, HelpCircle, Layers, Calendar, BarChart3, AlertCircle, Plus, BookText, Trash2, ArrowRight } from 'lucide-react';
import { storage } from '../utils/storage';
import { workspaceAPI, studyAPI } from '../services/api';
import { Workspace } from '../types/source';
import { StudyProgress, Reminder } from '../types/study';


// List of medical subjects specified in section 5
const SUBJECTS = [
  { name: 'Anatomy', icon: '💀', desc: 'Skeletal, muscular, and nerve systems' },
  { name: 'Physiology', icon: '🫀', desc: 'Organ systems and functional mechanisms' },
  { name: 'Biochemistry', icon: '🧬', desc: 'Cellular chemical pathways' },
  { name: 'Pathology', icon: '🔬', desc: 'Disease processes and structural alterations' },
  { name: 'Pharmacology', icon: '💊', desc: 'Drug groups, mechanisms, and kinetics' },
  { name: 'Microbiology', icon: '🧫', desc: 'Bacterial, viral, and fungal pathogens' },
  { name: 'Forensic Medicine', icon: '⚖️', desc: 'Medical jurisprudence and toxicology' },
  { name: 'Community Medicine', icon: '🩺', desc: 'Epidemiology and public health' },
  { name: 'Medicine', icon: '🏥', desc: 'Clinical diagnosis and systemic therapeutics' },
  { name: 'Surgery', icon: '✂️', desc: 'Operative procedures and trauma management' },
  { name: 'Pediatrics', icon: '👶', desc: 'Neonatal growth and pediatric conditions' },
  { name: 'Obstetrics & Gynecology', icon: '🤰', desc: 'Maternal health and fetal medicine' },
  { name: 'Orthopedics', icon: '🦴', desc: 'Musculoskeletal injuries and repairs' },
  { name: 'Dermatology', icon: '☀️', desc: 'Cutaneous pathologies and diagnostics' },
  { name: 'Psychiatry', icon: '🧠', desc: 'Mental health and psychopharmacology' },
  { name: 'Radiology', icon: '🩻', desc: 'Diagnostic imaging: X-Ray, CT, MRI' },
  { name: 'Ophthalmology', icon: '👁️', desc: 'Ocular systems and visual pathologies' },
  { name: 'ENT', icon: '👂', desc: 'Ear, nose, and throat clinical syndromes' }
];

interface HomeProps {
  userName: string;
  setUserName: (name: string) => void;
  onNavigatePage: (page: string, id?: string) => void;
  refreshWorkspacesTrigger: () => void;
  workspacesRefresh: number;
  onOpenCreateWorkspace: (defaultSubject?: string, defaultTitle?: string) => void;
}

const Home: React.FC<HomeProps> = ({ 
  userName, 
  setUserName, 
  onNavigatePage,
  refreshWorkspacesTrigger,
  workspacesRefresh,
  onOpenCreateWorkspace
}) => {
  // First-load Name prompting state
  const [nameInput, setNameInput] = useState('');
  const [showWelcome, setShowWelcome] = useState(!storage.getUserName());
  
  // Workspace list state
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  
  const [progress, setProgress] = useState<StudyProgress | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);

  // Load dashboards contents
  const loadDashboardData = async () => {
    try {
      const list = await workspaceAPI.list();
      setWorkspaces(list);

      const stats = await studyAPI.getProgress();
      setProgress(stats);

      const alertList = await studyAPI.listReminders();
      setReminders(alertList.filter(r => r.active).slice(0, 4));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [workspacesRefresh]);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    storage.setUserName(nameInput);
    setUserName(nameInput);
    setShowWelcome(false);
  };

  const handleDeleteWorkspace = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent opening workspace on card click
    if (!confirm('Are you sure you want to delete this workspace and all uploaded file data?')) return;
    try {
      await workspaceAPI.delete(id);
      loadDashboardData();
      refreshWorkspacesTrigger();
    } catch (err) {
      console.error(err);
    }
  };

  // 2. MAIN DASHBOARD PAGE
  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8 select-none relative">
      
      {/* 1. FIRST LOAD USER PROFILE MODAL OVERLAY */}
      {showWelcome && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 text-center">
            <div className="flex justify-center">
              <div className="bg-medical-500 text-white p-4 rounded-3xl active-pulse">
                <BookOpen className="w-10 h-10" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-gray-800 dark:text-white font-display">Welcome to MedStudy AI</h2>
              <p className="text-xs text-gray-500 dark:text-slate-400 max-w-xs mx-auto">
                Your intelligent clinical study companion. Set up your student profile to start.
              </p>
            </div>

            <form onSubmit={handleSaveName} className="space-y-4">
              <div className="text-left">
                <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">What is your name?</label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="e.g. Bhavana"
                  className="w-full py-3 px-4 text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-medical-500 rounded-2xl"
                  required
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="w-full bg-medical-500 hover:bg-medical-600 active:scale-[0.98] text-white py-3 rounded-2xl font-semibold shadow-md shadow-medical-500/10 transition"
              >
                Continue to Study Space
              </button>
            </form>
          </div>
        </div>
      )}

      
      {/* Disclaimer Alert */}
      <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-150 dark:border-blue-900 rounded-2xl flex gap-2.5 text-xs text-blue-700 dark:text-blue-400 leading-relaxed font-sans shrink-0 items-center">
        <AlertCircle className="w-4 h-4 text-blue-500 shrink-0" />
        <span>
          <strong>Grounded Education Disclaimer:</strong> MedStudy AI is an educational study tool. It is not a substitute for qualified medical advice, diagnosis, or treatment.
        </span>
      </div>

      {/* Hero Welcome banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-medical-600 to-medical-800 text-white rounded-3xl p-6 shadow-md shadow-medical-500/5">
        <div>
          <h1 className="text-xl font-black font-display">Good day, {userName} 👋</h1>
          <p className="text-xs text-medical-100/90 mt-1 max-w-md leading-relaxed font-medium">
            Ready to master your classes? Ask questions, generate flippable study decks, or practice clinical case MCQs.
          </p>
        </div>
        <button
          onClick={() => onOpenCreateWorkspace()}
          className="bg-white text-medical-700 hover:bg-medical-50 active:scale-95 py-2.5 px-5 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 shrink-0"
        >
          <FolderPlus className="w-4 h-4 text-medical-500" />
          <span>New Workspace</span>
        </button>
      </div>

      {/* Analytics stats row */}
      {progress && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl text-center">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Daily Streak</span>
            <span className="text-2xl font-black text-amber-500 font-display block mt-1">🔥 {progress.dailyStreak} Days</span>
          </div>
          <div className="p-4 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl text-center">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Study Hours</span>
            <span className="text-2xl font-black text-medical-500 font-display block mt-1">
              {Math.max(0.1, parseFloat((progress.totalStudyTime / 60).toFixed(1)))} hrs
            </span>
          </div>
          <div className="p-4 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl text-center">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">MCQs Solved</span>
            <span className="text-2xl font-black text-emerald-500 font-display block mt-1">✓ {progress.questionsSolved}</span>
          </div>
          <div className="p-4 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl text-center">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Cards Reviewed</span>
            <span className="text-2xl font-black text-indigo-500 font-display block mt-1">🗂️ {progress.flashcardsReviewed}</span>
          </div>
        </div>
      )}

      {/* Workspaces list */}
      <div className="space-y-4">
        <h3 className="font-extrabold text-sm text-gray-800 dark:text-white uppercase tracking-wider font-display">
          Recent Study Workspaces
        </h3>
        {workspaces.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-gray-200 dark:border-slate-800 rounded-3xl bg-white/40 dark:bg-slate-900/10 space-y-3">
            <h4 className="font-bold text-xs text-gray-800 dark:text-slate-200">No study workspaces yet</h4>
            <p className="text-xs text-gray-400 dark:text-slate-500">Create your first workspace to start studying.</p>
            <button
              onClick={() => onOpenCreateWorkspace()}
              className="bg-medical-500 hover:bg-medical-600 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition"
            >
              + Create Workspace
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {workspaces.map(ws => (
              <div
                key={ws._id}
                onClick={() => onNavigatePage('workspace', ws._id)}
                className="p-4 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl hover:shadow-md cursor-pointer transition flex flex-col justify-between h-36 group relative"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] bg-medical-50 dark:bg-medical-950/40 border border-medical-200 dark:border-medical-900 text-medical-600 dark:text-medical-400 px-2 py-0.5 rounded-full font-bold">
                      {ws.subject}
                    </span>
                    <button
                      onClick={(e) => handleDeleteWorkspace(ws._id, e)}
                      className="text-gray-400 hover:text-red-500 p-1 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition shrink-0"
                      title="Delete Workspace"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <h4 className="font-bold text-gray-850 dark:text-slate-100 text-sm mt-3 group-hover:text-medical-600 dark:group-hover:text-medical-400 transition truncate">
                    {ws.title}
                  </h4>
                  {ws.topic && <p className="text-[10px] text-gray-400 mt-1 font-semibold truncate">Topic: {ws.topic}</p>}
                </div>
                
                <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 dark:text-slate-500 mt-3 border-t border-gray-50 dark:border-slate-800 pt-2 shrink-0 group-hover:text-medical-500 transition">
                  <span>Enter Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Subject categories grid */}
      <div className="space-y-4">
        <h3 className="font-extrabold text-sm text-gray-800 dark:text-white uppercase tracking-wider font-display">
          Medical Subject Categories
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
          {SUBJECTS.map((sub, idx) => (
            <div
              key={idx}
              onClick={() => {
                onOpenCreateWorkspace(sub.name, `${sub.name} Workspace`);
              }}
              className="p-3.5 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 hover:border-medical-400 rounded-3xl hover:shadow-sm text-center cursor-pointer transition-all duration-150 group"
            >
              <div className="text-2xl mb-1.5 group-hover:scale-110 transition shrink-0">{sub.icon}</div>
              <p className="font-bold text-[11px] text-gray-800 dark:text-slate-100 group-hover:text-medical-600 dark:group-hover:text-medical-400 truncate">{sub.name}</p>
              <p className="text-[9px] text-gray-400 dark:text-slate-500 mt-0.5 line-clamp-1">{sub.desc}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default Home;
