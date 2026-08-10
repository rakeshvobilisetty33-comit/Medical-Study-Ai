import React, { useState, useEffect } from 'react';
import { Bell, Calendar, Trash2, CheckCircle2, Clock, Plus } from 'lucide-react';
import { studyAPI } from '../services/api';
import { Reminder } from '../types/study';

interface StudyReminderProps {
  refreshTrigger?: number;
  onReminderAdded?: () => void;
}

const StudyReminder: React.FC<StudyReminderProps> = ({ 
  refreshTrigger = 0,
  onReminderAdded 
}) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [datetime, setDatetime] = useState('');
  const [message, setMessage] = useState('');

  const fetchReminders = async () => {
    try {
      const list = await studyAPI.listReminders();
      setReminders(list);
    } catch (err) {
      console.error('Error fetching reminders:', err);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, [refreshTrigger]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !topic || !datetime) return;
    setLoading(true);

    try {
      await studyAPI.createReminder({
        subject,
        topic,
        datetime,
        message
      });
      // Reset form
      setSubject('');
      setTopic('');
      setDatetime('');
      setMessage('');
      
      fetchReminders();
      onReminderAdded?.();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await studyAPI.deleteReminder(id);
      setReminders(prev => prev.filter(r => r._id !== id));
      onReminderAdded?.(); // trigger layout notification updates
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      {/* Scheduler Form (Left/Top) */}
      <div className="md:col-span-1 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-slate-850">
          <Bell className="w-4 h-4 text-medical-500" />
          <span className="font-bold text-sm text-gray-850 dark:text-gray-200 font-display">Schedule Alert</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Anatomy"
              className="w-full text-xs py-2 px-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-medical-500"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">Topic</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Brachial Plexus"
              className="w-full text-xs py-2 px-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-medical-500"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">Date & Time</label>
            <input
              type="datetime-local"
              value={datetime}
              onChange={(e) => setDatetime(e.target.value)}
              className="w-full text-xs py-2 px-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-medical-500 text-gray-700 dark:text-slate-300"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">Message (Optional)</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Focus on branch drawings."
              rows={2}
              className="w-full text-xs py-2 px-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-medical-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-medical-500 hover:bg-medical-600 text-white font-bold text-xs py-2.5 rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Set Study Alarm</span>
          </button>
        </form>
      </div>

      {/* Reminders List (Right/Bottom) */}
      <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-slate-850">
          <span className="font-bold text-sm text-gray-850 dark:text-gray-200 font-display">Active Alarms</span>
          <span className="bg-medical-50 dark:bg-medical-950/20 text-medical-700 dark:text-medical-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
            {reminders.length} Scheduled
          </span>
        </div>

        <div className="space-y-2.5 overflow-y-auto max-h-[300px] pr-1">
          {reminders.length === 0 ? (
            <div className="text-center py-12 text-xs text-gray-400 dark:text-slate-550 border border-dashed border-gray-150 dark:border-slate-800 rounded-2xl">
              No study reminders set. Schedule one on the left.
            </div>
          ) : (
            reminders.map((rem) => {
              const dateObj = new Date(rem.datetime);
              const isPast = dateObj < new Date();

              return (
                <div 
                  key={rem._id} 
                  className={`p-3 border rounded-2xl flex items-center justify-between gap-3 ${
                    isPast 
                      ? 'bg-gray-50/50 border-gray-100 dark:bg-slate-800/10 dark:border-slate-850 opacity-60' 
                      : 'bg-white dark:bg-slate-800/30 border-gray-150 dark:border-slate-750 hover:shadow-sm transition'
                  }`}
                >
                  <div className="min-w-0 flex-1 flex gap-3 items-start">
                    <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                      isPast ? 'bg-gray-100 text-gray-400' : 'bg-medical-50 dark:bg-medical-950/30 text-medical-500'
                    }`}>
                      <Calendar className="w-4 h-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-xs text-gray-800 dark:text-slate-200 truncate">{rem.subject}</p>
                        <span className="text-[10px] bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 px-1.5 py-0.2 rounded-md font-semibold">
                          {rem.topic}
                        </span>
                      </div>
                      
                      {rem.message && <p className="text-[10px] text-gray-550 dark:text-slate-400 mt-1 italic">"{rem.message}"</p>}
                      
                      <div className="flex items-center gap-1 mt-1.5 text-[9px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-tight">
                        <Clock className="w-3 h-3" />
                        <span>{dateObj.toLocaleDateString()} at {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(rem._id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition"
                    title="Remove Alarm"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
};

export default StudyReminder;
