import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Search, ZoomIn, ZoomOut, Bookmark, BookOpen, X } from 'lucide-react';
import { Source } from '../types/source';
import { sourceAPI } from '../services/api';
import LoadingSpinner from './LoadingSpinner';

interface DocumentViewerProps {
  sourceId: string;
  initialPage?: number;
  onClose: () => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ sourceId, initialPage = 1, onClose }) => {
  const [source, setSource] = useState<Source | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [zoomLevel, setZoomLevel] = useState<'sm' | 'md' | 'lg'>('md');
  const [searchText, setSearchText] = useState('');
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    const fetchDoc = async () => {
      setLoading(true);
      try {
        const doc = await sourceAPI.getById(sourceId);
        setSource(doc);
        setCurrentPage(initialPage);
      } catch (err) {
        console.error('Failed to load document info:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDoc();
  }, [sourceId, initialPage]);

  // Sync bookmark status on page change
  useEffect(() => {
    setIsBookmarked(bookmarks.includes(currentPage));
  }, [currentPage, bookmarks]);

  const toggleBookmark = () => {
    if (isBookmarked) {
      setBookmarks(prev => prev.filter(p => p !== currentPage));
    } else {
      setBookmarks(prev => [...prev, currentPage].sort((a, b) => a - b));
    }
    setIsBookmarked(!isBookmarked);
  };

  const handleNext = () => {
    if (source && currentPage < source.pages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  // Compile text belonging to current page
  const getPageText = () => {
    if (!source || !source.chunks) return '';
    // Filter chunks matching current page
    const pageChunks = source.chunks.filter(chunk => chunk.pageNumber === currentPage);
    if (pageChunks.length === 0) {
      // Fallback: divide raw text evenly if pages metadata chunks aren't explicit
      const charsPerPage = 2000;
      const start = (currentPage - 1) * charsPerPage;
      return source.rawText?.substring(start, start + charsPerPage) || '';
    }
    return pageChunks.map(c => c.text).join('\n\n');
  };

  // Highlight search keywords in text block
  const renderHighlightedText = (text: string) => {
    if (!searchText.trim()) return <p className="whitespace-pre-wrap">{text}</p>;

    const regex = new RegExp(`(${searchText.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return (
      <p className="whitespace-pre-wrap">
        {parts.map((part, idx) => 
          regex.test(part) ? (
            <mark key={idx} className="bg-yellow-250 dark:bg-yellow-900/60 dark:text-amber-250 rounded px-0.5 font-semibold">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </p>
    );
  };

  if (loading) return <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-gray-150 dark:border-slate-800"><LoadingSpinner message="Opening document viewer..." /></div>;
  if (!source) return <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-gray-150 dark:border-slate-800 text-center text-xs text-gray-400">Failed to render document context.</div>;

  const fontSizes = {
    sm: 'text-xs leading-relaxed',
    md: 'text-sm leading-loose',
    lg: 'text-base leading-loose'
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-5 shadow-lg max-w-2xl mx-auto flex flex-col h-[520px]">
      
      {/* Viewer Header Controls */}
      <div className="flex items-center justify-between shrink-0 pb-3 border-b border-gray-100 dark:border-slate-850">
        <div className="flex items-center gap-2 truncate">
          <BookOpen className="w-4 h-4 text-medical-500 shrink-0" />
          <span className="font-bold text-xs text-gray-850 dark:text-gray-200 truncate" title={source.filename}>{source.filename}</span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Zoom controls */}
          <button
            onClick={() => setZoomLevel(prev => prev === 'lg' ? 'md' : prev === 'md' ? 'sm' : 'sm')}
            className="p-1.5 text-gray-500 hover:text-gray-800 dark:text-slate-400 rounded-lg transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoomLevel(prev => prev === 'sm' ? 'md' : prev === 'md' ? 'lg' : 'lg')}
            className="p-1.5 text-gray-500 hover:text-gray-800 dark:text-slate-400 rounded-lg transition"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          {/* Bookmark Button */}
          <button
            onClick={toggleBookmark}
            className={`p-1.5 rounded-lg transition ${
              isBookmarked ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/20' : 'text-gray-400 hover:text-gray-700'
            }`}
            title="Bookmark Page"
          >
            <Bookmark className="w-3.5 h-3.5" fill={isBookmarked ? 'currentColor' : 'none'} />
          </button>

          {/* Close Panel */}
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 bg-gray-50 dark:bg-slate-800 rounded-lg transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Search Input tool */}
      <div className="my-3 relative shrink-0">
        <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-450" />
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search page content..."
          className="w-full text-xs pl-8 pr-3 py-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700/80 rounded-xl focus:outline-none"
        />
      </div>

      {/* Pages content Area */}
      <div className="flex-1 overflow-y-auto min-h-0 bg-slate-50 dark:bg-slate-850 rounded-2xl p-5 border border-gray-100 dark:border-slate-800 shadow-inner">
        <div className={`text-gray-755 dark:text-slate-300 font-sans ${fontSizes[zoomLevel]}`}>
          {renderHighlightedText(getPageText())}
        </div>
      </div>

      {/* Page Navigation Footer */}
      <div className="flex items-center justify-between border-t border-gray-100 dark:border-slate-850 mt-4 pt-3 shrink-0">
        <button
          onClick={handlePrev}
          disabled={currentPage === 1}
          className="flex items-center gap-0.5 text-xs font-bold text-gray-500 hover:text-gray-800 dark:text-slate-400 disabled:opacity-30 disabled:pointer-events-none"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Prev</span>
        </button>

        {/* Page status */}
        <div className="text-xs font-bold text-gray-655 dark:text-slate-400">
          <span>Page {currentPage} of {source.pages}</span>
          {bookmarks.length > 0 && (
            <span className="text-[10px] ml-2 text-amber-500 hover:underline cursor-pointer" onClick={() => setCurrentPage(bookmarks[0])}>
              ({bookmarks.length} bookmarked)
            </span>
          )}
        </div>

        <button
          onClick={handleNext}
          disabled={currentPage === source.pages}
          className="flex items-center gap-0.5 text-xs font-bold text-medical-600 hover:text-medical-700 dark:text-medical-400 disabled:opacity-30 disabled:pointer-events-none"
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};

export default DocumentViewer;
