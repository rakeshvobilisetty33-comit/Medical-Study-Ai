import React, { useState } from 'react';
import { Settings as SettingsIcon, ShieldAlert, User, Paintbrush, Cpu, Key, Check } from 'lucide-react';
import { storage } from '../utils/storage';

interface SettingsProps {
  userName: string;
  onUpdateName: (name: string) => void;
  onOpenSettings?: () => void;
}

const Settings: React.FC<SettingsProps> = ({ userName, onUpdateName }) => {
  const [name, setName] = useState(userName);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(storage.getTheme());
  const [success, setSuccess] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    storage.setUserName(name);
    onUpdateName(name.trim());
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    const root = window.document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else if (newTheme === 'light') {
      root.classList.remove('dark');
    } else {
      // System sync
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (systemDark) root.classList.add('dark');
      else root.classList.remove('dark');
    }
    storage.setTheme(newTheme);
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-6 select-none">
      
      {/* Header toolbar */}
      <div className="flex items-center gap-2 pb-4 border-b border-gray-150 dark:border-slate-800">
        <div className="p-2 bg-slate-100 dark:bg-slate-800 text-gray-500 rounded-2xl">
          <SettingsIcon className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-850 dark:text-gray-100 font-display">Workspace Preferences</h2>
          <p className="text-[10px] text-gray-400 mt-0.5 font-semibold">Tune your interface and system properties</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        
        {/* Profile Card (Left/Top) */}
        <div className="md:col-span-1 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-xs text-gray-850 dark:text-gray-250 uppercase tracking-wider font-display border-b border-gray-50 dark:border-slate-850 pb-2 flex items-center gap-1.5">
            <User className="w-4 h-4 text-medical-500" />
            <span>Profile Details</span>
          </h3>

          <form onSubmit={handleSaveProfile} className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Student Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Bhavana"
                className="w-full text-xs py-2 px-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none"
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-medical-500 hover:bg-medical-600 text-white font-bold text-xs py-2.5 rounded-xl shadow-sm transition flex items-center justify-center gap-1.5"
            >
              {success ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-350" />
                  <span>Profile Saved</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </form>
        </div>

        {/* Configurations Drawer (Right/Bottom) */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Theme card */}
          <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-sm">
            <h3 className="font-bold text-xs text-gray-850 dark:text-gray-250 uppercase tracking-wider font-display border-b border-gray-50 dark:border-slate-850 pb-2 flex items-center gap-1.5">
              <Paintbrush className="w-4 h-4 text-indigo-500" />
              <span>Theme customisation</span>
            </h3>

            <div className="grid grid-cols-3 gap-3">
              {(['light', 'dark', 'system'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => handleThemeChange(t)}
                  className={`py-2 px-4 rounded-xl text-xs font-bold capitalize transition border ${
                    theme === t 
                      ? 'bg-medical-50 dark:bg-medical-950/30 border-medical-500 text-medical-600 dark:text-medical-400' 
                      : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-500'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Credentials Info card */}
          <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-sm">
            <h3 className="font-bold text-xs text-gray-850 dark:text-gray-250 uppercase tracking-wider font-display border-b border-gray-50 dark:border-slate-850 pb-2 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-emerald-500" />
              <span>AI Provider Connections</span>
            </h3>

            <div className="p-4 bg-gray-50 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-850 rounded-2xl space-y-3.5">
              <div className="flex gap-2 items-start text-xs text-gray-650 dark:text-slate-350 leading-relaxed font-sans">
                <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-gray-800 dark:text-slate-200">Security Precautionary Rule:</p>
                  <p>
                    MedStudy AI never exposes API keys in frontend code. API credentials exist only in server-side environment configurations.
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-150 dark:border-slate-800/80 pt-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-medical-500" />
                  <span>How to connect Gemini or OpenAI:</span>
                </p>
                <ol className="list-decimal pl-4 mt-2 text-[10px] text-gray-500 dark:text-slate-400 space-y-1 font-semibold leading-relaxed">
                  <li>Open the file <code className="bg-gray-150 dark:bg-slate-800 px-1 py-0.5 rounded font-mono text-[9px]">server/.env</code> in your editor.</li>
                  <li>Configure <code className="bg-gray-150 dark:bg-slate-800 px-1 py-0.5 rounded font-mono text-[9px]">AI_PROVIDER=gemini</code> or <code className="bg-gray-150 dark:bg-slate-800 px-1 py-0.5 rounded font-mono text-[9px]">openai</code>.</li>
                  <li>Uncomment and populate <code className="bg-gray-150 dark:bg-slate-800 px-1 py-0.5 rounded font-mono text-[9px]">GEMINI_API_KEY</code> or <code className="bg-gray-150 dark:bg-slate-800 px-1 py-0.5 rounded font-mono text-[9px]">OPENAI_API_KEY</code>.</li>
                  <li>Restart the backend server to apply settings.</li>
                </ol>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default Settings;
