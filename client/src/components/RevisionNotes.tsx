import React, { useState } from 'react';
import { FileText, Copy, Printer, Check, CheckSquare } from 'lucide-react';

interface RevisionNotesProps {
  markdown: string;
  topic: string;
  onMarkAsStudied?: () => void;
  isStudied?: boolean;
}

const RevisionNotes: React.FC<RevisionNotesProps> = ({ 
  markdown, 
  topic, 
  onMarkAsStudied,
  isStudied = false
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  // Convert markdown headings and points to JSX formatting
  const parseMarkdown = (md: string) => {
    const lines = md.split('\n');
    const elements: React.ReactNode[] = [];

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      if (trimmed.startsWith('### ')) {
        elements.push(
          <h4 key={idx} className="text-sm font-bold text-gray-800 dark:text-gray-100 mt-4 mb-2 font-display">
            {trimmed.substring(4)}
          </h4>
        );
      } else if (trimmed.startsWith('## ')) {
        elements.push(
          <h3 key={idx} className="text-base font-extrabold text-medical-600 dark:text-medical-455 mt-5 mb-2 font-display border-b border-gray-100 dark:border-slate-800 pb-1">
            {trimmed.substring(3)}
          </h3>
        );
      } else if (trimmed.startsWith('# ')) {
        elements.push(
          <h2 key={idx} className="text-lg font-black text-gray-800 dark:text-white mt-6 mb-3 font-display">
            {trimmed.substring(2)}
          </h2>
        );
      } else if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        elements.push(
          <li key={idx} className="text-xs text-gray-655 dark:text-slate-350 list-disc ml-5 my-1 leading-relaxed">
            {trimmed.substring(2)}
          </li>
        );
      } else if (trimmed.startsWith('> ')) {
        elements.push(
          <div key={idx} className="p-3 bg-medical-50/50 dark:bg-medical-950/10 border-l-4 border-medical-500 rounded-r-xl my-3 text-xs italic text-gray-700 dark:text-slate-300">
            {trimmed.substring(2)}
          </div>
        );
      } else if (trimmed === '') {
        // empty space
      } else {
        elements.push(
          <p key={idx} className="text-xs text-gray-700 dark:text-slate-300 leading-relaxed my-2 font-sans">
            {trimmed}
          </p>
        );
      }
    });

    return elements;
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-6 shadow-lg max-w-2xl mx-auto space-y-5 print:border-none print:shadow-none">
      {/* Header controls */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-850 print:hidden">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-medical-50 dark:bg-medical-950/20 text-medical-500 rounded-lg">
            <FileText className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm text-gray-850 dark:text-gray-200 font-display">Revision Notes: {topic}</span>
        </div>

        <div className="flex items-center gap-1.5">
          {onMarkAsStudied && (
            <button
              onClick={onMarkAsStudied}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all border ${
                isStudied 
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-700 dark:text-emerald-450' 
                  : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:text-medical-500'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>{isStudied ? 'Studied ✓' : 'Mark Studied'}</span>
            </button>
          )}

          <button
            onClick={handleCopy}
            className="p-2 text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition"
            title="Copy Notes"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>
          
          <button
            onClick={handlePrint}
            className="p-2 text-gray-500 hover:text-gray-850 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition"
            title="Print Notes"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main notes content */}
      <div className="space-y-1 overflow-y-auto max-h-[60vh] pr-2 print:max-h-none print:overflow-visible">
        {parseMarkdown(markdown)}
      </div>
    </div>
  );
};

export default RevisionNotes;
