import React, { useState, useRef } from 'react';
import { Upload, FileText, Link as LinkIcon, AlertCircle, Check } from 'lucide-react';
import { sourceAPI } from '../services/api';

interface SourceUploaderProps {
  workspaceId: string;
  onUploadSuccess: () => void;
}

const SourceUploader: React.FC<SourceUploaderProps> = ({ workspaceId, onUploadSuccess }) => {
  const [activeTab, setActiveTab] = useState<'file' | 'text'>('file');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // File upload state
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pasted text state
  const [pasteTitle, setPasteTitle] = useState('');
  const [pasteContent, setPasteContent] = useState('');

  // Handle Drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Process File Select
  const processFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    // Check size limit (15MB)
    if (file.size > 15 * 1024 * 1024) {
      setError('File is too large. Max size allowed is 15MB.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await sourceAPI.uploadFile(workspaceId, file);
      setSuccess(true);
      onUploadSuccess();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to process and upload the file.');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFiles(e.target.files);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  // Process Pasted Text Submit
  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pasteContent.trim()) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const finalTitle = pasteTitle.trim() || `Study Notes - ${new Date().toLocaleDateString()}`;
      await sourceAPI.uploadPastedText(workspaceId, finalTitle, pasteContent);
      setSuccess(true);
      setPasteTitle('');
      setPasteContent('');
      onUploadSuccess();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to save pasted notes.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Tabs Headers */}
      <div className="flex border-b border-gray-100 dark:border-slate-800 mb-6">
        <button
          onClick={() => { setActiveTab('file'); setError(null); }}
          className={`flex items-center gap-2 pb-3 px-4 text-sm font-semibold transition-all border-b-2 ${
            activeTab === 'file'
              ? 'border-medical-500 text-medical-600 dark:text-medical-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-slate-350'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Upload File</span>
        </button>
        <button
          onClick={() => { setActiveTab('text'); setError(null); }}
          className={`flex items-center gap-2 pb-3 px-4 text-sm font-semibold transition-all border-b-2 ${
            activeTab === 'text'
              ? 'border-medical-500 text-medical-600 dark:text-medical-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-slate-350'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Paste Text</span>
        </button>
      </div>

      {/* Error and Success alerts */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-2xl flex items-start gap-2.5 text-xs text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-600 dark:text-emerald-400">
          <Check className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Source added successfully! Starting document analysis.</span>
        </div>
      )}

      {/* TAB CONTENT: FILE UPLOAD */}
      {activeTab === 'file' && (
        <div 
          onDragEnter={handleDrag} 
          onDragOver={handleDrag} 
          onDragLeave={handleDrag} 
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-3xl p-8 text-center flex flex-col items-center justify-center transition-all ${
            dragActive 
              ? 'border-medical-500 bg-medical-50/50 dark:bg-medical-950/10' 
              : 'border-gray-200 dark:border-slate-800 hover:border-medical-400'
          } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          <input 
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.txt,.md,.docx,.doc,.pptx,.ppt,image/*"
            onChange={handleFileChange}
            disabled={loading}
          />
          <div className="p-4 bg-gray-50 dark:bg-slate-800/80 rounded-2xl text-gray-400 dark:text-slate-500 mb-4">
            <Upload className="w-8 h-8 text-medical-500" />
          </div>
          <p className="font-semibold text-sm text-gray-700 dark:text-slate-200 mb-1">
            Drag and drop your document here
          </p>
          <p className="text-xs text-gray-400 dark:text-slate-500 max-w-xs leading-relaxed mb-6">
            Supports PDFs, TXT, MD, DOCX, or study diagrams up to 15MB.
          </p>
          <button
            type="button"
            onClick={onButtonClick}
            disabled={loading}
            className="bg-medical-500 hover:bg-medical-600 text-white text-xs font-semibold py-2.5 px-6 rounded-xl transition"
          >
            {loading ? 'Processing File...' : 'Select File'}
          </button>
        </div>
      )}

      {/* TAB CONTENT: PASTE NOTES */}
      {activeTab === 'text' && (
        <form onSubmit={handleTextSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
              Source Title
            </label>
            <input
              type="text"
              value={pasteTitle}
              onChange={(e) => setPasteTitle(e.target.value)}
              placeholder="e.g. Cardiovascular Physiology Lecture notes"
              className="w-full text-sm py-2 px-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-medical-500"
              disabled={loading}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
              Paste Content / Notes
            </label>
            <textarea
              value={pasteContent}
              onChange={(e) => setPasteContent(e.target.value)}
              placeholder="Paste or write your clinical definitions, notes or lecture transcripts here..."
              rows={8}
              className="w-full text-sm py-2 px-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-medical-500 font-sans"
              disabled={loading}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading || !pasteContent.trim()}
            className="w-full bg-medical-500 hover:bg-medical-600 text-white text-xs font-semibold py-2.5 rounded-xl transition disabled:opacity-50"
          >
            {loading ? 'Analyzing Content...' : 'Save and Process Notes'}
          </button>
        </form>
      )}
    </div>
  );
};

export default SourceUploader;
