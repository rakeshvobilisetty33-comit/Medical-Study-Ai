import React, { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import Modal from './Modal';

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: {
    title: string;
    subject: string;
    topic?: string;
  }) => Promise<void> | void;
  defaultSubject?: string;
  defaultTitle?: string;
}

const SUBJECTS = [
  'Anatomy',
  'Physiology',
  'Biochemistry',
  'Pathology',
  'Pharmacology',
  'Microbiology',
  'Forensic Medicine',
  'Community Medicine',
  'Medicine',
  'Surgery',
  'Pediatrics',
  'Obstetrics & Gynecology',
  'Orthopedics',
  'Dermatology',
  'Psychiatry',
  'Radiology',
  'Ophthalmology',
  'ENT',
  'Other'
];

const CreateWorkspaceModal: React.FC<CreateWorkspaceModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  defaultSubject,
  defaultTitle
}) => {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Anatomy');
  const [topic, setTopic] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Reset fields on modal open, pre-populating defaults if provided
  useEffect(() => {
    if (isOpen) {
      setTitle(defaultTitle || '');
      setSubject(defaultSubject || 'Anatomy');
      setTopic('');
      setError(null);
    }
  }, [isOpen, defaultSubject, defaultTitle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!title.trim()) {
      setError('Please enter a workspace name.');
      return;
    }

    setLoading(true);
    try {
      await onCreate({
        title: title.trim(),
        subject,
        topic: topic.trim() || undefined
      });
      onClose();
    } catch (err: any) {
      console.error(err);
      setError('Unable to create workspace. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Study Workspace">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-2xl flex items-start gap-2.5 text-xs text-red-650 dark:text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
            Workspace Name *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Anatomy – Upper Limb"
            className="w-full text-xs py-2.5 px-3 bg-gray-50 dark:bg-slate-800 border border-gray-250 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-medical-500 text-gray-800 dark:text-slate-100"
            disabled={loading}
            required
            autoFocus
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-400 dark:text-slate-555 uppercase tracking-wider mb-1.5">
            Subject
          </label>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full text-xs py-2.5 px-3 bg-gray-50 dark:bg-slate-800 border border-gray-250 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-medical-500 text-gray-855 dark:text-slate-200"
            disabled={loading}
          >
            {SUBJECTS.map((subjectName) => (
              <option key={subjectName} value={subjectName}>
                {subjectName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-400 dark:text-slate-555 uppercase tracking-wider mb-1.5">
            Topic (Optional)
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Brachial Plexus"
            className="w-full text-xs py-2.5 px-3 bg-gray-50 dark:bg-slate-800 border border-gray-250 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-medical-500 text-gray-800 dark:text-slate-100"
            disabled={loading}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-gray-100 dark:bg-slate-855 hover:bg-gray-200 dark:hover:bg-slate-750 text-xs font-bold text-gray-700 dark:text-slate-350 rounded-xl transition"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 bg-medical-500 hover:bg-medical-600 text-white font-bold text-xs py-2.5 rounded-xl shadow-md transition disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Workspace'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateWorkspaceModal;
