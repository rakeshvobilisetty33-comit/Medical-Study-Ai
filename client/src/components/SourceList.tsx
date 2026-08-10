import React, { useState } from 'react';
import { Search, Plus, FileQuestion } from 'lucide-react';
import { Source } from '../types/source';
import SourceCard from './SourceCard';
import EmptyState from './EmptyState';

interface SourceListProps {
  sources: Source[];
  onDeleteSource: (id: string) => void;
  onRenameSource: (id: string, newName: string) => Promise<any>;
  onOpenSource: (source: Source) => void;
  onOpenUploadModal: () => void;
}

const SourceList: React.FC<SourceListProps> = ({ 
  sources, 
  onDeleteSource, 
  onRenameSource, 
  onOpenSource,
  onOpenUploadModal
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSources = sources.filter(src => 
    src.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      {/* Search & Actions Header */}
      <div className="flex items-center gap-2 mb-4 shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files..."
            className="w-full text-xs pl-9 pr-3 py-2 bg-gray-100 dark:bg-slate-800 border border-transparent focus:border-gray-200 dark:focus:border-slate-700 rounded-xl focus:outline-none focus:ring-0"
          />
        </div>
        <button
          onClick={onOpenUploadModal}
          className="bg-medical-500 hover:bg-medical-600 text-white p-2 rounded-xl active:scale-95 transition"
          title="Add Medical Source"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Sources Grid Container */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-1 space-y-3">
        {sources.length === 0 ? (
          <div className="py-8">
            <EmptyState
              title="Start building your study space"
              description="Add your medical study materials to begin asking questions and generating study resources."
              icon={FileQuestion}
              actionLabel="+ Add Source"
              onAction={onOpenUploadModal}
            />
          </div>
        ) : filteredSources.length === 0 ? (
          <div className="text-center py-12 text-sm text-gray-400 dark:text-slate-500">
            No files match your search.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredSources.map((source) => (
              <SourceCard
                key={source._id}
                source={source}
                onDelete={onDeleteSource}
                onRename={onRenameSource}
                onOpen={onOpenSource}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SourceList;
