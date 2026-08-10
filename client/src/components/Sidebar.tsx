import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  FolderHeart, 
  Layers, 
  HelpCircle, 
  CalendarDays, 
  BarChart3, 
  Settings as SettingsIcon, 
  Plus, 
  BookOpen, 
  ChevronRight 
} from 'lucide-react';
import { workspaceAPI } from '../services/api';
import { Workspace } from '../types/source';

interface SidebarProps {
  activePage: string;
  onChangePage: (page: string, workspaceId?: string) => void;
  selectedWorkspaceId?: string;
  refreshTrigger?: number;
  onOpenCreateWorkspace: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activePage, 
  onChangePage, 
  selectedWorkspaceId, 
  refreshTrigger = 0,
  onOpenCreateWorkspace
}) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);

  useEffect(() => {
    const loadWorkspaces = async () => {
      try {
        const list = await workspaceAPI.list();
        setWorkspaces(list);
      } catch (err) {
        console.error('Error loading workspaces in sidebar:', err);
      }
    };
    loadWorkspaces();
  }, [refreshTrigger]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'flashcards', label: 'Flashcards Decks', icon: Layers },
    { id: 'quiz', label: 'MCQ Practice', icon: HelpCircle },
    { id: 'planner', label: 'Study Planner', icon: CalendarDays },
    { id: 'progress', label: 'Study Progress', icon: BarChart3 },
  ];

  return (
    <aside className="w-64 border-r border-gray-200 dark:border-slate-800 bg-white dark:bg-darkbg-100 flex flex-col h-[calc(100vh-4rem)] select-none shrink-0 transition-colors duration-200">
      {/* Quick Action */}
      <div className="p-4">
        <button 
          onClick={onOpenCreateWorkspace}
          className="w-full bg-medical-500 hover:bg-medical-600 active:scale-[0.98] text-white flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold shadow-md shadow-medical-500/10 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Workspace</span>
        </button>
      </div>

      {/* Primary Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-1">
        <div className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onChangePage(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-medical-50 dark:bg-medical-950/40 text-medical-600 dark:text-medical-400 font-semibold' 
                    : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800/60 hover:text-gray-900 dark:hover:text-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-medical-500' : 'text-gray-400 dark:text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Separator */}
        <div className="my-4 border-t border-gray-100 dark:border-slate-800/80 mx-2" />

        {/* Workspaces List section */}
        <div>
          <div className="px-3 mb-2 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">
              My Study Workspaces
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={onOpenCreateWorkspace}
                className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-medical-500 rounded-md transition"
                title="Create Workspace"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <span className="bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 text-[10px] px-1.5 py-0.5 rounded-md font-semibold">
                {workspaces.length}
              </span>
            </div>
          </div>

          <div className="space-y-0.5 max-h-60 overflow-y-auto">
            {workspaces.length === 0 ? (
              <div className="text-center py-6 text-xs text-gray-400 dark:text-slate-500">
                No workspaces created.
              </div>
            ) : (
              workspaces.map((ws) => {
                const isActive = activePage === 'workspace' && selectedWorkspaceId === ws._id;
                return (
                  <button
                    key={ws._id}
                    onClick={() => onChangePage('workspace', ws._id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium group transition-all ${
                      isActive 
                        ? 'bg-medical-100/50 dark:bg-medical-900/25 text-medical-700 dark:text-medical-400 font-semibold border-l-2 border-medical-500 pl-2.5' 
                        : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800/50 hover:text-gray-900 dark:hover:text-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <BookOpen className="w-3.5 h-3.5 text-medical-500 shrink-0" />
                      <span className="truncate text-left">{ws.title}</span>
                    </div>
                    <ChevronRight className={`w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ${isActive ? 'opacity-100 text-medical-500' : ''}`} />
                  </button>
                );
              })
            )}
          </div>
        </div>
      </nav>

      {/* Footer Settings Toggle */}
      <div className="p-4 border-t border-gray-100 dark:border-slate-800/80">
        <button
          onClick={() => onChangePage('settings')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activePage === 'settings' 
              ? 'bg-medical-50 dark:bg-medical-950/40 text-medical-600 dark:text-medical-400 font-semibold' 
              : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800/60 hover:text-gray-900'
          }`}
        >
          <SettingsIcon className="w-4 h-4 text-gray-400" />
          <span>Profile Settings</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
