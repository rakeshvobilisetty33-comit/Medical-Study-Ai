import React, { useState, useEffect } from 'react';
import { Calendar, CheckSquare, Clock, Plus, BookOpen, AlertCircle, Sparkles } from 'lucide-react';
import { studyAPI, workspaceAPI } from '../services/api';
import { Workspace } from '../types/source';

interface PlannerTask {
  id: string;
  day: string; // e.g. "Monday", "Tuesday"
  time: string; // e.g. "09:00 - 10:00"
  subject: string;
  topic: string;
  completed: boolean;
}

const StudyPlanner: React.FC = () => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [plannerTasks, setPlannerTasks] = useState<PlannerTask[]>([]);
  const [loading, setLoading] = useState(false);

  // Planner inputs
  const [examDate, setExamDate] = useState('');
  const [studyHours, setStudyHours] = useState(4);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [focusTopic, setFocusTopic] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const list = await workspaceAPI.list();
        setWorkspaces(list);
        if (list.length > 0) setSelectedSubject(list[0].subject);
        
        // Load default weekly plan from local storage if exists
        const savedPlan = localStorage.getItem('medstudy_study_plan');
        if (savedPlan) {
          setPlannerTasks(JSON.parse(savedPlan));
        } else {
          // Initialize mock structural tasks if blank
          const initialTasks: PlannerTask[] = [
            { id: '1', day: 'Monday', time: '09:00 - 10:00', subject: 'Anatomy', topic: 'Upper Limb Brachial Plexus', completed: false },
            { id: '2', day: 'Wednesday', time: '10:15 - 11:30', subject: 'Physiology', topic: 'Cardiovascular Action Potential', completed: false },
            { id: '3', day: 'Friday', time: '14:00 - 15:15', subject: 'Pharmacology', topic: 'Autonomic Adrenergic Blockers', completed: false },
            { id: '4', day: 'Saturday', time: '11:00 - 12:00', subject: 'Anatomy', topic: 'Lower Limb Muscles', completed: false },
          ];
          setPlannerTasks(initialTasks);
          localStorage.setItem('medstudy_study_plan', JSON.stringify(initialTasks));
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadData();
  }, []);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!focusTopic || !selectedSubject) return;

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const randomDay = days[Math.floor(Math.random() * days.length)] || 'Monday';
    
    const newTask: PlannerTask = {
      id: Math.random().toString(),
      day: randomDay,
      time: '09:00 - 10:15',
      subject: selectedSubject,
      topic: focusTopic.trim(),
      completed: false
    };

    const updated = [newTask, ...plannerTasks];
    setPlannerTasks(updated);
    localStorage.setItem('medstudy_study_plan', JSON.stringify(updated));
    setFocusTopic(''); // reset
  };

  const handleToggleCompleted = (taskId: string) => {
    const updated = plannerTasks.map(t => {
      if (t.id === taskId) {
        const nextState = !t.completed;
        if (nextState) {
          // Log completion to progress API
          studyAPI.updateProgress({
            completedTopic: t.topic,
            subjectName: t.subject,
            subjectProgressPercent: 100
          });
        }
        return { ...t, completed: nextState };
      }
      return t;
    });

    setPlannerTasks(updated);
    localStorage.setItem('medstudy_study_plan', JSON.stringify(updated));
  };

  const handleClearFinished = () => {
    const updated = plannerTasks.filter(t => !t.completed);
    setPlannerTasks(updated);
    localStorage.setItem('medstudy_study_plan', JSON.stringify(updated));
  };

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6 select-none">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 p-5 rounded-3xl">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-50 dark:bg-blue-950/20 text-blue-500 rounded-2xl">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-850 dark:text-gray-100 font-display">Medical Study Planner</h2>
            <p className="text-[10px] text-gray-400 mt-0.5 font-semibold">Organize study targets before exam timelines</p>
          </div>
        </div>

        <button
          onClick={handleClearFinished}
          className="text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 py-2 px-4 rounded-xl border border-red-200 dark:border-red-900/60 font-bold transition"
        >
          Clear Finished Tasks
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        
        {/* Planner controls (Left/Top) */}
        <div className="md:col-span-1 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-5 space-y-4">
          <h3 className="font-bold text-xs text-gray-850 dark:text-gray-250 uppercase tracking-wider font-display border-b border-gray-50 dark:border-slate-850 pb-2 flex items-center gap-1">
            <Sparkles className="w-4 h-4 text-medical-500" />
            <span>Generate Schedule</span>
          </h3>

          <form onSubmit={handleAddTask} className="space-y-3.5">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">Target Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full text-xs py-2 px-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none"
              >
                {workspaces.map(ws => (
                  <option key={ws._id} value={ws.subject}>{ws.subject} - {ws.title}</option>
                ))}
                {workspaces.length === 0 && (
                  <>
                    <option value="Anatomy">Anatomy</option>
                    <option value="Physiology">Physiology</option>
                    <option value="Pharmacology">Pharmacology</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">Focus Topic / Chapter</label>
              <input
                type="text"
                value={focusTopic}
                onChange={(e) => setFocusTopic(e.target.value)}
                placeholder="e.g. Cranial Nerves"
                className="w-full text-xs py-2 px-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">Exam Date (Timeline Calc)</label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full text-xs py-2 px-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none text-gray-700 dark:text-slate-350"
              />
            </div>

            <div>
              <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                <span>Available Hours/Day</span>
                <span className="font-mono text-medical-600 dark:text-medical-400">{studyHours} hrs</span>
              </div>
              <input
                type="range"
                min="1"
                max="12"
                value={studyHours}
                onChange={(e) => setStudyHours(parseInt(e.target.value))}
                className="w-full h-1 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-medical-500"
              />
            </div>

            <button
              type="submit"
              className="w-full mt-2 bg-medical-500 hover:bg-medical-600 text-white font-bold text-xs py-2.5 rounded-xl shadow-md transition"
            >
              Add to Study Schedule
            </button>
          </form>
        </div>

        {/* Schedule grid layout (Right/Bottom) */}
        <div className="md:col-span-2 space-y-4">
          
          {daysOfWeek.map((day) => {
            const dayTasks = plannerTasks.filter(t => t.day === day);
            if (dayTasks.length === 0) return null;

            return (
              <div key={day} className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-5 space-y-3">
                <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 font-display flex items-center gap-1 border-b border-gray-50 dark:border-slate-850 pb-2">
                  <Clock className="w-4 h-4 text-medical-500 shrink-0" />
                  <span>{day} Tasks</span>
                </h4>
                
                <div className="space-y-2">
                  {dayTasks.map((task) => (
                    <div 
                      key={task.id} 
                      onClick={() => handleToggleCompleted(task.id)}
                      className={`p-3 border rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition ${
                        task.completed 
                          ? 'bg-emerald-50/20 border-emerald-250 opacity-60' 
                          : 'bg-white dark:bg-slate-805 border-gray-150 dark:border-slate-750 hover:shadow-sm'
                      }`}
                    >
                      <div className="min-w-0 flex-1 flex gap-3 items-start">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => {}} // handled by parent div click
                          className="w-4 h-4 border-gray-300 dark:border-slate-700 rounded text-medical-500 focus:ring-medical-500 shrink-0 mt-0.5"
                        />
                        <div className="min-w-0">
                          <p className={`text-xs font-bold ${task.completed ? 'line-through text-gray-400' : 'text-gray-800 dark:text-slate-200'}`}>{task.topic}</p>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                            <span>{task.subject}</span>
                            <span>•</span>
                            <span>{task.time}</span>
                          </div>
                        </div>
                      </div>

                      {task.completed && (
                        <span className="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 px-2 py-0.5 rounded-full text-[9px] font-bold">
                          Done ✓
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {plannerTasks.length === 0 && (
            <div className="text-center py-16 text-xs text-gray-400 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl">
              No tasks scheduled for this week. Use the panel on the left to set active study hours.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default StudyPlanner;
