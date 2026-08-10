import React, { useState } from 'react';
import { FileText, FileDown, Trash2, Eye, Edit2, Check, X, AlertCircle } from 'lucide-react';
import { Source } from '../types/source';
import { formatFileSize } from '../utils/formatText';

interface SourceCardProps {
  source: Source;
  onDelete: (id: string) => void;
  onRename: (id: string, newName: string) => Promise<any>;
  onOpen: (source: Source) => void;
}

const SourceCard: React.FC<SourceCardProps> = ({ source, onDelete, onRename, onOpen }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(source.filename);
  const [renameLoading, setRenameLoading] = useState(false);

  const handleRenameSubmit = async () => {
    if (!newName.trim() || newName === source.filename) {
      setIsEditing(false);
      return;
    }
    setRenameLoading(true);
    try {
      await onRename(source._id, newName.trim());
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setRenameLoading(false);
    }
  };

  const getStatusBadge = (status: Source['status']) => {
    switch (status) {
      case 'uploading':
        return <span className="bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">Uploading...</span>;
      case 'extracting':
        return <span className="bg-yellow-50 dark:bg-yellow-950/30 text-yellow-600 dark:text-yellow-400 text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">Extracting...</span>;
      case 'analyzing':
        return <span className="bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">Analyzing...</span>;
      case 'preparing':
        return <span className="bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">Preparing...</span>;
      case 'ready':
        return <span className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-bold">Ready ✓</span>;
      case 'failed':
        return <span className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1"><AlertCircle className="w-2.5 h-2.5" /> Failed</span>;
      default:
        return null;
    }
  };

  const getFileIcon = (type: string) => {
    const ext = type.toLowerCase();
    if (ext === 'pdf') {
      return <FileText className="w-5 h-5 text-red-500" />;
    } else if (['png', 'jpg', 'jpeg', 'gif'].includes(ext)) {
      return <FileDown className="w-5 h-5 text-purple-500" />;
    } else if (ext === 'md' || ext === 'txt') {
      return <FileText className="w-5 h-5 text-indigo-500" />;
    } else {
      return <FileText className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="p-3 bg-white dark:bg-slate-800 border border-gray-150 dark:border-slate-750 rounded-2xl hover:shadow-md transition-all flex flex-col justify-between group">
      {/* File Header */}
      <div className="flex items-start gap-2.5">
        <div className="p-2 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
          {getFileIcon(source.type)}
        </div>
        
        {/* Name details */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-1.5 mt-0.5">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full text-xs py-1 px-2 border border-gray-200 dark:border-slate-750 bg-gray-50 dark:bg-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-medical-500"
                disabled={renameLoading}
                autoFocus
              />
              <button 
                onClick={handleRenameSubmit} 
                className="p-1 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-md"
                disabled={renameLoading}
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => { setIsEditing(false); setNewName(source.filename); }} 
                className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md"
                disabled={renameLoading}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div>
              <p className="font-semibold text-xs text-gray-800 dark:text-slate-200 truncate pr-2 group-hover:text-medical-600 dark:group-hover:text-medical-400 transition" title={source.filename}>
                {source.filename}
              </p>
              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-400 dark:text-slate-500">
                <span>{formatFileSize(source.size)}</span>
                <span>•</span>
                <span>{source.pages} {source.pages === 1 ? 'page' : 'pages'}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer controls & badges */}
      <div className="flex items-center justify-between border-t border-gray-50 dark:border-slate-750/50 mt-3 pt-2.5">
        <div>
          {getStatusBadge(source.status)}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {source.status === 'ready' && (
            <button
              onClick={() => onOpen(source)}
              className="p-1.5 text-gray-500 dark:text-slate-400 hover:text-medical-500 dark:hover:text-medical-400 hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-lg transition"
              title="Open Document Viewer"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => setIsEditing(true)}
            className="p-1.5 text-gray-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-lg transition"
            title="Rename Document"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(source._id)}
            className="p-1.5 text-gray-550 dark:text-slate-400 hover:text-red-500 hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-lg transition"
            title="Delete Document"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SourceCard;
