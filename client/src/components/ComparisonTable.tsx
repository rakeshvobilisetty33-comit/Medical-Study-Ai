import React from 'react';
import { Columns, Copy, Check, Download } from 'lucide-react';

interface ComparisonTableProps {
  markdown: string;
}

const ComparisonTable: React.FC<ComparisonTableProps> = ({ markdown }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to parse Markdown table into array rows
  const parseMarkdownTable = (md: string) => {
    const lines = md.split('\n');
    const tableRows: string[][] = [];
    let headers: string[] = [];

    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('|') && !trimmed.includes('---')) {
        const columns = trimmed
          .split('|')
          .map(c => c.trim())
          .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
        
        if (headers.length === 0) {
          headers = columns;
        } else {
          tableRows.push(columns);
        }
      }
    });

    return { headers, rows: tableRows };
  };

  const { headers, rows } = parseMarkdownTable(markdown);

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-5 shadow-lg max-w-3xl mx-auto space-y-4">
      {/* Header toolbar */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-850">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-medical-50 dark:bg-medical-950/20 text-medical-500 rounded-lg">
            <Columns className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm text-gray-800 dark:text-gray-200 font-display">Differential Comparison Table</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="p-1.5 text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-xl transition"
            title="Copy Table Markdown"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Render parsed table */}
      {headers.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-slate-850">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-gray-50 dark:bg-slate-800 font-display text-gray-700 dark:text-slate-200 border-b border-gray-200 dark:border-slate-850">
              <tr>
                {headers.map((header, idx) => (
                  <th key={idx} className="p-3 font-bold truncate">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-850">
              {rows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/35 transition">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className={`p-3 text-gray-700 dark:text-slate-350 leading-relaxed ${
                      cIdx === 0 ? 'font-bold text-gray-800 dark:text-slate-200 bg-gray-50/25 dark:bg-slate-800/10' : ''
                    }`}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-6 bg-slate-50 dark:bg-slate-800/25 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center text-xs text-gray-400">
          {markdown.includes('###') ? (
            <div className="text-left whitespace-pre-wrap text-gray-755 dark:text-slate-300 font-sans leading-relaxed">
              {markdown}
            </div>
          ) : (
            'Parsing error. Content does not contain a standard comparison matrix.'
          )}
        </div>
      )}
    </div>
  );
};

export default ComparisonTable;
