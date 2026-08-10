import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
  title, 
  description, 
  icon: Icon = Inbox, 
  actionLabel, 
  onAction 
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-gray-200 dark:border-slate-800 rounded-3xl bg-white/40 dark:bg-slate-900/10 backdrop-blur-sm max-w-md mx-auto my-6">
      <div className="p-4 bg-medical-50 dark:bg-medical-950/20 text-medical-500 rounded-full mb-4 active-pulse">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="font-bold text-gray-800 dark:text-gray-200 text-base font-display mb-1">{title}</h3>
      <p className="text-xs text-gray-500 dark:text-slate-400 font-sans max-w-xs leading-relaxed mb-6">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="bg-medical-500 hover:bg-medical-600 active:scale-[0.98] text-white py-2 px-4 rounded-xl text-xs font-semibold shadow-sm transition"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
