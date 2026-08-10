import React from 'react';
import { BookOpen, ExternalLink } from 'lucide-react';
import { Citation } from '../types/chat';

interface CitationCardProps {
  citation: Citation;
  onOpen: () => void;
}

const CitationCard: React.FC<CitationCardProps> = ({ citation, onOpen }) => {
  return (
    <div className="p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700/80 rounded-2xl flex flex-col justify-between hover:border-medical-300 dark:hover:border-slate-650 transition duration-150">
      <div>
        {/* Source File and Page header */}
        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-slate-200">
          <BookOpen className="w-3.5 h-3.5 text-medical-500 shrink-0" />
          <span className="truncate flex-1" title={citation.sourceName}>{citation.sourceName}</span>
          <span className="bg-medical-100 dark:bg-medical-950/60 text-medical-700 dark:text-medical-400 px-2 py-0.5 rounded-full text-[10px] shrink-0 font-bold">
            Page {citation.pageNumber}
          </span>
        </div>

        {/* Excerpt */}
        {citation.excerpt && (
          <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-2 leading-relaxed italic bg-white dark:bg-slate-900/50 p-2 rounded-xl border border-gray-100 dark:border-slate-800/80">
            "{citation.excerpt}"
          </p>
        )}
      </div>

      {/* Action button */}
      <button
        onClick={onOpen}
        className="w-full mt-3 flex items-center justify-center gap-1 py-1.5 bg-white dark:bg-slate-750 border border-gray-200 dark:border-slate-700 hover:bg-gray-150 dark:hover:bg-slate-700 text-[10px] font-bold text-gray-600 dark:text-slate-350 rounded-xl transition"
      >
        <ExternalLink className="w-3 h-3 text-medical-500" />
        <span>Verify in Document Viewer</span>
      </button>
    </div>
  );
};

export default CitationCard;
