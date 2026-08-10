import React, { useState, useEffect } from 'react';
import { BarChart3, Clock, HelpCircle, Layers, CheckSquare, Award, Flame, RefreshCw } from 'lucide-react';
import { studyAPI } from '../services/api';
import { StudyProgress } from '../types/study';
import LoadingSpinner from '../components/LoadingSpinner';

const Progress: React.FC = () => {
  const [progress, setProgress] = useState<StudyProgress | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await studyAPI.getProgress();
      setProgress(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return <LoadingSpinner message="Assembling study statistics..." />;
  if (!progress) return <div className="text-center py-12 text-gray-400">Failed to load progress records.</div>;

  const weeklyData = progress.weeklyStudyMinutes || [];
  
  // Calculate max minutes to scale SVG bar chart
  const maxMinutes = Math.max(...weeklyData.map(d => d.minutes), 60); // minimum scale is 60 mins

  // SVG dimensions
  const chartHeight = 160;
  const chartWidth = 420;
  const barWidth = 32;
  const gap = 20;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6 select-none">
      
      {/* Header card toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 p-5 rounded-3xl">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-medical-50 dark:bg-medical-950/20 text-medical-500 rounded-2xl">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-850 dark:text-gray-100 font-display">Study Analytics</h2>
            <p className="text-[10px] text-gray-400 mt-0.5 font-semibold">Analytical progress of study metrics</p>
          </div>
        </div>

        <button
          onClick={loadData}
          className="p-2 text-gray-450 hover:text-gray-800 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition"
          title="Reload Statistics"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Grid numbers */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Streak card */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl shadow-sm flex flex-col justify-between h-28 relative overflow-hidden group">
          <div className="flex justify-between items-start shrink-0">
            <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Streak</span>
            <Flame className="w-5 h-5 text-amber-500 group-hover:scale-110 transition shrink-0" />
          </div>
          <div className="mt-2.5">
            <span className="text-3xl font-extrabold text-gray-800 dark:text-white font-display block leading-none">{progress.dailyStreak} Days</span>
            <span className="text-[10px] text-gray-400 dark:text-slate-500 font-medium block mt-1">Keep studying daily!</span>
          </div>
        </div>

        {/* Study time card */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl shadow-sm flex flex-col justify-between h-28 relative overflow-hidden group">
          <div className="flex justify-between items-start shrink-0">
            <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Total Time</span>
            <Clock className="w-5 h-5 text-medical-500 group-hover:scale-110 transition shrink-0" />
          </div>
          <div className="mt-2.5">
            <span className="text-3xl font-extrabold text-gray-800 dark:text-white font-display block leading-none">
              {Math.max(0.1, parseFloat((progress.totalStudyTime / 60).toFixed(1)))} hrs
            </span>
            <span className="text-[10px] text-gray-400 dark:text-slate-500 font-medium block mt-1">({progress.totalStudyTime} mins studied)</span>
          </div>
        </div>

        {/* Questions solved card */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl shadow-sm flex flex-col justify-between h-28 relative overflow-hidden group">
          <div className="flex justify-between items-start shrink-0">
            <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">MCQs Answered</span>
            <HelpCircle className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition shrink-0" />
          </div>
          <div className="mt-2.5">
            <span className="text-3xl font-extrabold text-gray-800 dark:text-white font-display block leading-none">{progress.questionsSolved}</span>
            <span className="text-[10px] text-gray-400 dark:text-slate-500 font-medium block mt-1">Avg Score: {progress.averageQuizScore}% Acc</span>
          </div>
        </div>

        {/* Flashcards reviewed card */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl shadow-sm flex flex-col justify-between h-28 relative overflow-hidden group">
          <div className="flex justify-between items-start shrink-0">
            <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Cards Studied</span>
            <Layers className="w-5 h-5 text-indigo-500 group-hover:scale-110 transition shrink-0" />
          </div>
          <div className="mt-2.5">
            <span className="text-3xl font-extrabold text-gray-800 dark:text-white font-display block leading-none">{progress.flashcardsReviewed}</span>
            <span className="text-[10px] text-gray-400 dark:text-slate-500 font-medium block mt-1">Recall decks reviewed</span>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Weekly Chart SVG (Left/Bottom) */}
        <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-xs text-gray-850 dark:text-gray-250 uppercase tracking-wider font-display border-b border-gray-50 dark:border-slate-850 pb-2">Weekly Study Time (Mins)</h3>
          
          <div className="flex justify-center py-2">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight + 30}`} className="w-full max-w-lg">
              {/* Interval dash lines */}
              {[0.25, 0.5, 0.75, 1.0].map((ratio, index) => {
                const y = chartHeight - (chartHeight * ratio);
                return (
                  <g key={index}>
                    <line x1="0" y1={y} x2={chartWidth} y2={y} stroke="#f1f5f9" className="dark:stroke-slate-800" strokeDasharray="3 3" />
                    <text x={chartWidth - 30} y={y - 4} fill="#94a3b8" className="text-[9px] font-bold font-mono">
                      {Math.round(maxMinutes * ratio)}m
                    </text>
                  </g>
                );
              })}

              {/* Draw bars */}
              {weeklyData.map((dayData, index) => {
                const heightRatio = dayData.minutes / maxMinutes;
                const barHeight = chartHeight * heightRatio;
                const x = index * (barWidth + gap) + 16;
                const y = chartHeight - barHeight;

                return (
                  <g key={index} className="group">
                    {/* Bar rectangle */}
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={Math.max(barHeight, 4)} // minimum height of 4px so it draws even if 0
                      fill={dayData.minutes > 0 ? '#0ea5e9' : '#e2e8f0'}
                      className="dark:fill-slate-800 group-hover:fill-medical-600 transition-colors duration-150"
                      rx="6"
                    />
                    {/* Hover tooltip text showing actual minutes */}
                    <text
                      x={x + barWidth / 2}
                      y={y - 8}
                      textAnchor="middle"
                      fill="#0284c7"
                      className="text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity font-mono"
                    >
                      {dayData.minutes}m
                    </text>
                    {/* Day label */}
                    <text
                      x={x + barWidth / 2}
                      y={chartHeight + 20}
                      textAnchor="middle"
                      fill="#94a3b8"
                      className="text-[10px] font-bold uppercase tracking-wider font-display"
                    >
                      {dayData.day}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Subjects completion levels (Right) */}
        <div className="md:col-span-1 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-5 space-y-4">
          <h3 className="font-bold text-xs text-gray-850 dark:text-gray-250 uppercase tracking-wider font-display border-b border-gray-50 dark:border-slate-850 pb-2">Subject Metrics</h3>
          
          <div className="space-y-4">
            {/* Direct mapped values */}
            {progress.subjectProgress && Object.keys(progress.subjectProgress).length > 0 ? (
              Object.entries(progress.subjectProgress).map(([subName, percent], i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-gray-700 dark:text-slate-350">
                    <span>{subName}</span>
                    <span className="font-mono text-medical-605">{percent}%</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-medical-500 h-full" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              ))
            ) : (
              <div className="space-y-3.5">
                {/* Default template metrics if empty */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-gray-700 dark:text-slate-350">
                    <span>Anatomy</span>
                    <span className="font-mono text-medical-600">45%</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-medical-500 h-full" style={{ width: '45%' }} />
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-gray-700 dark:text-slate-350">
                    <span>Physiology</span>
                    <span className="font-mono text-medical-600">30%</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-medical-500 h-full" style={{ width: '30%' }} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-gray-700 dark:text-slate-350">
                    <span>Pharmacology</span>
                    <span className="font-mono text-medical-600">15%</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-medical-500 h-full" style={{ width: '15%' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default Progress;
