import React, { useState, useEffect } from 'react';
import { Sun, Moon, Search, Bell, Settings as SettingsIcon, LogOut, Check, Menu } from 'lucide-react';
import { storage } from '../utils/storage';
import { studyAPI } from '../services/api';
import { Reminder } from '../types/study';

interface NavbarProps {
  userName: string;
  onLogout: () => void;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  onToggleMobileSidebar?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ userName, onLogout, onOpenSearch, onOpenSettings, onToggleMobileSidebar }) => {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(storage.getTheme());
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showReminders, setShowReminders] = useState(false);

  // Sync theme to document element
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    storage.setTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Fetch reminders count
  useEffect(() => {
    const loadReminders = async () => {
      try {
        const list = await studyAPI.listReminders();
        // filter future active reminders
        const active = list.filter(r => r.active && new Date(r.datetime) > new Date());
        setReminders(active);
      } catch (err) {
        console.error(err);
      }
    };
    loadReminders();
    const interval = setInterval(loadReminders, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="h-16 border-b border-gray-200 dark:border-slate-800 bg-white/80 dark:bg-darkbg-100/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 transition-colors duration-200 shrink-0">
      {/* Brand Logo & Name */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="p-2 -ml-1 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition md:hidden"
            title="Toggle Navigation Drawer"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="bg-medical-500 text-white p-2 rounded-xl active-pulse shrink-0">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15m0 0l6.75 6.75M4.5 12l6.75-6.75" className="hidden" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </div>
        <span className="font-bold text-base sm:text-lg font-display tracking-tight text-gray-800 dark:text-gray-100 truncate">
          MedStudy <span className="text-medical-500">AI</span>
        </span>
      </div>


      {/* Center Navigation / Actions */}
      <div className="flex-1 max-w-lg mx-8 hidden md:block">
        <div 
          onClick={onOpenSearch}
          className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700/80 text-gray-400 rounded-xl cursor-pointer border border-transparent hover:border-gray-300 dark:hover:border-slate-600 transition-all duration-150"
        >
          <Search className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <span className="text-sm">Search workspaces, sources, flashcards...</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* User Greetings */}
        <div className="text-right hidden sm:block">
          <p className="text-xs text-gray-500 dark:text-slate-400">Welcome back,</p>
          <p className="text-sm font-semibold text-gray-800 dark:text-slate-200">{userName} 👋</p>
        </div>

        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="p-2 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-all"
          title="Toggle Light/Dark Mode"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Reminders Notifications */}
        <div className="relative">
          <button 
            onClick={() => setShowReminders(!showReminders)}
            className="p-2 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-all relative"
            title="Active Alarms & Reminders"
          >
            <Bell className="w-5 h-5" />
            {reminders.length > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white dark:border-darkbg-100 rounded-full" />
            )}
          </button>

          {showReminders && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden z-50">
              <div className="p-3 bg-gray-50 dark:bg-slate-700 border-b border-gray-100 dark:border-slate-600 flex justify-between items-center">
                <span className="font-semibold text-xs text-gray-800 dark:text-gray-200">Study Reminders</span>
                <span className="bg-medical-100 dark:bg-medical-900/50 text-medical-700 dark:text-medical-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                  {reminders.length} Active
                </span>
              </div>
              <div className="max-h-60 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-700">
                {reminders.length === 0 ? (
                  <div className="p-4 text-center text-xs text-gray-400 dark:text-slate-500">
                    No active study alerts.
                  </div>
                ) : (
                  reminders.map(rem => (
                    <div key={rem._id} className="p-3 hover:bg-gray-50 dark:hover:bg-slate-750 transition">
                      <div className="flex justify-between items-start">
                        <p className="font-semibold text-xs text-gray-700 dark:text-slate-200">{rem.subject}</p>
                        <span className="text-[10px] text-gray-400 dark:text-slate-500">
                          {new Date(rem.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-slate-400 mt-0.5 font-medium">{rem.topic}</p>
                      {rem.message && <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1 italic">"{rem.message}"</p>}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Settings */}
        <button 
          onClick={onOpenSettings}
          className="p-2 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-all"
          title="Profile Settings"
        >
          <SettingsIcon className="w-5 h-5" />
        </button>

        {/* Clear profile info / Logout */}
        <button 
          onClick={onLogout}
          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all"
          title="Sign out of student profile"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
