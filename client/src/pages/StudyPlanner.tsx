import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, AlertCircle, Sparkles, Trash2, Folder } from 'lucide-react';
import { studyAPI, workspaceAPI } from '../services/api';
import { Workspace } from '../types/source';
import { Reminder } from '../types/study';
import LoadingSpinner from '../components/LoadingSpinner';

interface StudyPlannerProps {
  onOpenStudySpace?: (workspaceId: string, topic: string, subject: string) => void;
}

const StudyPlanner: React.FC<StudyPlannerProps> = ({ onOpenStudySpace }) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [plannerTasks, setPlannerTasks] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(false);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filter States
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('');

  // Form Inputs
  const [formWorkspaceId, setFormWorkspaceId] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [focusTopic, setFocusTopic] = useState('');
  const [taskDate, setTaskDate] = useState('');
  const [taskTime, setTaskTime] = useState('');
  const [taskDuration, setTaskDuration] = useState(60);
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [taskNotes, setTaskNotes] = useState('');

  const loadWorkspaces = async () => {
    setLoading(true);
    try {
      const list = await workspaceAPI.list();
      setWorkspaces(list);
      if (list.length > 0) {
        setFormWorkspaceId(list[0]._id);
        setSelectedSubject(list[0].subject);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Unable to load workspaces. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async () => {
    setTasksLoading(true);
    try {
      const list = await studyAPI.listReminders();
      setPlannerTasks(list);
    } catch (err) {
      console.error(err);
      setErrorMsg('Unable to load study schedule. Please try again.');
    } finally {
      setTasksLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspaces();
    loadTasks();
  }, []);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!focusTopic.trim() || !formWorkspaceId || !taskDate || !taskTime) {
      alert('Please fill out all required fields (Workspace, Topic, Date, and Time).');
      return;
    }

    setSubmitLoading(true);
    try {
      const ws = workspaces.find(w => w._id === formWorkspaceId);
      const subject = ws ? ws.subject : selectedSubject;

      // Avoid UTC conversion: parse in local time
      const localDateTime = `${taskDate}T${taskTime}`;

      const newTask = await studyAPI.createReminder({
        workspaceId: formWorkspaceId,
        subject,
        topic: focusTopic.trim(),
        datetime: localDateTime,
        duration: taskDuration,
        priority: taskPriority,
        notes: taskNotes.trim()
      });

      setPlannerTasks(prev => [newTask, ...prev]);
      setFocusTopic('');
      setTaskNotes('');
      setTaskTime('');
      // Set to current date to keep form clean
    } catch (err) {
      console.error(err);
      alert('Failed to add study task. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleToggleCompleted = async (task: Reminder) => {
    try {
      const nextCompleted = !task.completed;
      const updatedTask = await studyAPI.updateReminder(task._id, { completed: nextCompleted });
      
      setPlannerTasks(prev => prev.map(t => t._id === task._id ? updatedTask : t));

      if (nextCompleted) {
        // Log completion to progress API
        await studyAPI.updateProgress({
          completedTopic: task.topic,
          subjectName: task.subject,
          subjectProgressPercent: 100
        });
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update task status. Please try again.');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this study task?')) return;
    try {
      await studyAPI.deleteReminder(taskId);
      setPlannerTasks(prev => prev.filter(t => t._id !== taskId));
    } catch (err) {
      console.error(err);
      alert('Failed to delete task. Please try again.');
    }
  };

  const handleClearFinished = async () => {
    const finishedTasks = plannerTasks.filter(t => t.completed);
    if (finishedTasks.length === 0) return;
    
    if (!confirm('Clear all completed study tasks?')) return;

    try {
      for (const t of finishedTasks) {
        await studyAPI.deleteReminder(t._id);
      }
      setPlannerTasks(prev => prev.filter(t => !t.completed));
    } catch (err) {
      console.error(err);
      alert('Failed to clear finished tasks. Please try again.');
    }
  };

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const getDayAndRange = (datetimeStr: string, durationMin: number) => {
    const dateObj = new Date(datetimeStr);
    const day = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
    
    const formatTime = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const startTime = formatTime(dateObj);
    const endTime = formatTime(new Date(dateObj.getTime() + durationMin * 60000));
    
    return { day, timeRange: `${startTime} - ${endTime}` };
  };

  // Filter tasks based on Workspace selection
  const filteredTasks = plannerTasks.filter(t => {
    if (!selectedWorkspaceId) return true;
    return t.workspaceId === selectedWorkspaceId;
  });

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
          <h3 className="font-bold text-xs text-gray-850 dark:text-gray-250 uppercase tracking-wider font-display border-b border-gray-50 dark:border-slate-855 pb-2 flex items-center gap-1">
            <Sparkles className="w-4 h-4 text-medical-500" />
            <span>Generate Schedule</span>
          </h3>

          <form onSubmit={handleAddTask} className="space-y-3.5">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">Target Workspace</label>
              <select
                value={formWorkspaceId}
                onChange={(e) => {
                  const wsId = e.target.value;
                  setFormWorkspaceId(wsId);
                  const ws = workspaces.find(w => w._id === wsId);
                  if (ws) setSelectedSubject(ws.subject);
                }}
                className="w-full text-xs py-2 px-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none"
                required
              >
                <option value="">Select Workspace</option>
                {workspaces.map(ws => (
                  <option key={ws._id} value={ws._id}>{ws.title} ({ws.subject})</option>
                ))}
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

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">Date</label>
                <input
                  type="date"
                  value={taskDate}
                  onChange={(e) => setTaskDate(e.target.value)}
                  className="w-full text-xs py-2 px-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none text-gray-700 dark:text-slate-350"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">Start Time</label>
                <input
                  type="time"
                  value={taskTime}
                  onChange={(e) => setTaskTime(e.target.value)}
                  className="w-full text-xs py-2 px-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none text-gray-700 dark:text-slate-350"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">Duration</label>
                <select
                  value={taskDuration}
                  onChange={(e) => setTaskDuration(parseInt(e.target.value))}
                  className="w-full text-xs py-2 px-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none"
                >
                  <option value={30}>30 mins</option>
                  <option value={45}>45 mins</option>
                  <option value={60}>60 mins</option>
                  <option value={90}>90 mins</option>
                  <option value={120}>120 mins</option>
                  <option value={180}>180 mins</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">Priority</label>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as any)}
                  className="w-full text-xs py-2 px-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">Notes / Description</label>
              <textarea
                value={taskNotes}
                onChange={(e) => setTaskNotes(e.target.value)}
                placeholder="e.g. Focus on high-yield diagrams"
                className="w-full text-xs py-2 px-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none h-16 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitLoading}
              className="w-full mt-2 bg-medical-500 hover:bg-medical-600 text-white font-bold text-xs py-2.5 rounded-xl shadow-md transition disabled:opacity-50"
            >
              {submitLoading ? 'Adding...' : 'Add to Study Schedule'}
            </button>
          </form>
        </div>

        {/* Schedule grid layout (Right/Bottom) */}
        <div className="md:col-span-2 space-y-4">
          
          {/* Workspace Filter Dropdown */}
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 p-4 rounded-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-slate-350">
              <Folder className="w-4 h-4 text-gray-400" />
              <span>Workspace Filter:</span>
            </div>
            <select
              value={selectedWorkspaceId}
              onChange={(e) => setSelectedWorkspaceId(e.target.value)}
              className="text-xs py-1.5 px-3 bg-gray-50 dark:bg-slate-855 border border-gray-200 dark:border-slate-750 rounded-xl focus:outline-none"
            >
              <option value="">All Workspaces</option>
              {workspaces.map(ws => (
                <option key={ws._id} value={ws._id}>{ws.title} ({ws.subject})</option>
              ))}
            </select>
          </div>

          {errorMsg && (
            <div className="p-4 border border-red-200 bg-red-50/50 text-red-650 rounded-2xl flex items-center gap-2 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {tasksLoading ? (
            <div className="py-12"><LoadingSpinner message="Loading study schedule..." /></div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-16 text-xs text-gray-400 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl">
              No study sessions scheduled yet. Use the panel on the left to set active study hours.
            </div>
          ) : (
            daysOfWeek.map((dayName) => {
              const dayTasks = filteredTasks.filter(t => {
                const info = getDayAndRange(t.datetime, t.duration || 60);
                return info.day === dayName;
              });
              if (dayTasks.length === 0) return null;

              return (
                <div key={dayName} className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-5 space-y-3">
                  <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 font-display flex items-center gap-1 border-b border-gray-50 dark:border-slate-850 pb-2">
                    <Clock className="w-4 h-4 text-medical-500 shrink-0" />
                    <span>{dayName} Tasks</span>
                  </h4>
                  
                  <div className="space-y-2">
                    {dayTasks.map((task) => {
                      const info = getDayAndRange(task.datetime, task.duration || 60);
                      const priorityColor = 
                        task.priority === 'high' 
                          ? 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400' 
                          : task.priority === 'medium' 
                            ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
                            : 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400';

                      return (
                        <div 
                          key={task._id} 
                          className={`p-3 border rounded-2xl flex items-center justify-between gap-3 transition ${
                            task.completed 
                              ? 'bg-emerald-50/20 border-emerald-250 opacity-60' 
                              : 'bg-white dark:bg-slate-805 border-gray-150 dark:border-slate-750 hover:shadow-sm'
                          }`}
                        >
                          <div className="min-w-0 flex-1 flex gap-3 items-start">
                            <input
                              type="checkbox"
                              checked={task.completed || false}
                              onChange={() => handleToggleCompleted(task)}
                              className="w-4 h-4 border-gray-300 dark:border-slate-700 rounded text-medical-500 focus:ring-medical-500 shrink-0 mt-0.5 cursor-pointer"
                            />
                            <div className="min-w-0">
                              <p className={`text-xs font-bold ${task.completed ? 'line-through text-gray-400' : 'text-gray-800 dark:text-slate-200'}`}>{task.topic}</p>
                              <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                                <span>{task.subject}</span>
                                <span>•</span>
                                <span>{info.timeRange}</span>
                                <span>•</span>
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${priorityColor}`}>{task.priority}</span>
                                {task.notes && (
                                  <>
                                    <span>•</span>
                                    <span className="normal-case font-medium text-gray-500 dark:text-slate-400 italic">"{task.notes}"</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            {task.completed && (
                              <span className="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 px-2 py-0.5 rounded-full text-[9px] font-bold">
                                Done ✓
                              </span>
                            )}
                            <button
                              onClick={() => {
                                if (onOpenStudySpace && task.workspaceId) {
                                  onOpenStudySpace(task.workspaceId, task.topic, task.subject);
                                }
                              }}
                              className="text-[10px] bg-medical-50 hover:bg-medical-100 text-medical-600 dark:bg-medical-950/20 dark:hover:bg-medical-900/40 py-1 px-2.5 rounded-lg font-bold transition shrink-0"
                            >
                              Review
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task._id)}
                              className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-800 transition"
                              title="Delete task"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

    </div>
  );
};

export default StudyPlanner;
