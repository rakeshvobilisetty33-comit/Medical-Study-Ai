import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ProgressCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'blue' | 'teal' | 'emerald' | 'amber' | 'red';
}

const ProgressCard: React.FC<ProgressCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon,
  color = 'blue'
}) => {
  const colorMap = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-950/20',
      text: 'text-blue-500 dark:text-blue-400',
      accent: 'text-blue-600 dark:text-blue-400'
    },
    teal: {
      bg: 'bg-medical-50 dark:bg-medical-950/20',
      text: 'text-medical-500 dark:text-medical-400',
      accent: 'text-medical-600 dark:text-medical-400'
    },
    emerald: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/20',
      text: 'text-emerald-500 dark:text-emerald-400',
      accent: 'text-emerald-600 dark:text-emerald-400'
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-950/20',
      text: 'text-amber-500 dark:text-amber-400',
      accent: 'text-amber-600 dark:text-amber-400'
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-950/20',
      text: 'text-red-500 dark:text-red-400',
      accent: 'text-red-600 dark:text-red-400'
    }
  };

  const selectedColors = colorMap[color];

  return (
    <div className="p-4 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl flex items-center gap-4 hover:shadow-md transition duration-150">
      {/* Icon Area */}
      <div className={`p-3 rounded-2xl ${selectedColors.bg} ${selectedColors.text} shrink-0`}>
        <Icon className="w-6 h-6" />
      </div>

      {/* Stats details */}
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
          {title}
        </p>
        <p className="text-xl font-black text-gray-800 dark:text-slate-100 font-display mt-0.5 leading-none">
          {value}
        </p>
        {subtitle && (
          <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1 font-medium truncate">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

export default ProgressCard;
