import React, { useState } from 'react';
import { Volume2, VolumeX, BookOpen, AlertCircle } from 'lucide-react';
import { Message, Citation } from '../types/chat';
import { tts } from '../utils/textToSpeech';

interface ChatMessageProps {
  message: Message;
  onOpenCitation: (citation: Citation) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onOpenCitation }) => {
  const isAi = message.sender === 'ai';
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Simple Markdown to HTML-like JSX renderer
  const renderFormattedText = (text: string) => {
    if (!text) return null;

    // Split text by lines
    const lines = text.split('\n');
    let inList = false;
    let listItems: string[] = [];
    const elements: React.ReactNode[] = [];

    const flushList = (key: string) => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${key}`} className="list-disc pl-5 my-2 space-y-1 text-sm">
            {listItems.map((li, idx) => (
              <li key={`li-${idx}`} className="text-gray-700 dark:text-slate-350">{parseInlineStyles(li)}</li>
            ))}
          </ul>
        );
        listItems = [];
      }
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      // Table formatting helper
      if (trimmed.startsWith('|') && idx < lines.length && lines[idx+1]?.trim().startsWith('|')) {
        flushList(`${idx}`);
        // Render simple placeholder or standard table parsed blocks
        // For premium styling, we can check if it is a table and render it!
        // To keep it simple but beautiful, let's extract table rows
        return; 
      }

      // Headers
      if (trimmed.startsWith('### ')) {
        flushList(`${idx}`);
        elements.push(
          <h4 key={idx} className="text-sm font-bold text-gray-800 dark:text-gray-200 mt-4 mb-2 font-display">
            {parseInlineStyles(trimmed.substring(4))}
          </h4>
        );
      } else if (trimmed.startsWith('## ')) {
        flushList(`${idx}`);
        elements.push(
          <h3 key={idx} className="text-base font-extrabold text-medical-600 dark:text-medical-450 mt-5 mb-3 font-display border-b border-gray-150 dark:border-slate-800 pb-1">
            {parseInlineStyles(trimmed.substring(3))}
          </h3>
        );
      } else if (trimmed.startsWith('# ')) {
        flushList(`${idx}`);
        elements.push(
          <h2 key={idx} className="text-lg font-black text-gray-800 dark:text-white mt-6 mb-3 font-display">
            {parseInlineStyles(trimmed.substring(2))}
          </h2>
        );
      } 
      // Bullet items
      else if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        inList = true;
        listItems.push(trimmed.substring(2));
      } 
      // Callout quotes (GitHub-style alerts)
      else if (trimmed.startsWith('> [!NOTE]') || trimmed.startsWith('> [!IMPORTANT]') || trimmed.startsWith('> [!WARNING]')) {
        flushList(`${idx}`);
        const alertText = lines[idx + 1]?.trim().replace(/^>\s*/, '') || '';
        const alertType = trimmed.includes('WARNING') ? 'warning' : trimmed.includes('IMPORTANT') ? 'important' : 'note';
        
        let colorClasses = 'border-l-4 border-medical-500 bg-medical-50/50 dark:bg-medical-950/10 text-medical-800 dark:text-medical-300';
        if (alertType === 'warning') colorClasses = 'border-l-4 border-red-500 bg-red-50/50 dark:bg-red-950/10 text-red-800 dark:text-red-300';
        
        elements.push(
          <div key={`alert-${idx}`} className={`p-3 rounded-r-xl my-3 text-xs leading-relaxed ${colorClasses}`}>
            {alertText}
          </div>
        );
        lines[idx + 1] = ''; // skip next line as we consumed it
      }
      // Skip callout inner block if consumed
      else if (line === '') {
        flushList(`${idx}`);
        inList = false;
      } else {
        if (inList) {
          listItems.push(trimmed);
        } else {
          flushList(`${idx}`);
          elements.push(
            <p key={idx} className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed my-2 font-sans">
              {parseInlineStyles(trimmed)}
            </p>
          );
        }
      }
    });

    flushList('final');
    return elements;
  };

  // Helper to format inline tags (**bold**, `code`, citations)
  const parseInlineStyles = (text: string) => {
    if (!text) return '';
    
    // Bold matching
    const boldRegex = /\*\*(.*?)\*\*/g;
    // Citation tag matching: e.g. [Source: test.pdf, Page: 4]
    const citationRegex = /\[Source:\s*(.*?),\s*Page:\s*(\d+)\]/g;

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    // Scan through citations and style them as clickable badges
    while ((match = citationRegex.exec(text)) !== null) {
      const matchIndex = match.index;
      
      // Add text before match
      if (matchIndex > lastIndex) {
        parts.push(text.substring(lastIndex, matchIndex));
      }

      const sourceName = match[1];
      const pageNum = parseInt(match[2], 10);
      
      parts.push(
        <button
          key={`cite-${matchIndex}`}
          onClick={() => onOpenCitation({ sourceId: '', sourceName, pageNumber: pageNum, excerpt: '' })}
          className="inline-flex items-center gap-0.5 mx-1 px-1.5 py-0.5 bg-medical-50 dark:bg-medical-950/40 hover:bg-medical-100 dark:hover:bg-medical-900 border border-medical-200 dark:border-medical-900 text-medical-600 dark:text-medical-400 rounded-md text-[10px] font-bold transition-all align-middle"
        >
          <BookOpen className="w-2.5 h-2.5" />
          <span>p.{pageNum}</span>
        </button>
      );

      lastIndex = citationRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    // Secondary pass: Format bold texts inside sections
    return parts.map((part, pIdx) => {
      if (typeof part !== 'string') return part;

      const subparts = [];
      let subLast = 0;
      let bMatch;
      
      // reset boldRegex
      boldRegex.lastIndex = 0;
      while ((bMatch = boldRegex.exec(part)) !== null) {
        if (bMatch.index > subLast) {
          subparts.push(part.substring(subLast, bMatch.index));
        }
        subparts.push(
          <strong key={`bold-${bMatch.index}`} className="font-bold text-gray-900 dark:text-white">
            {bMatch[1]}
          </strong>
        );
        subLast = boldRegex.lastIndex;
      }
      if (subLast < part.length) {
        subparts.push(part.substring(subLast));
      }

      return <span key={pIdx}>{subparts}</span>;
    });
  };

  const handleSpeechToggle = () => {
    if (isSpeaking) {
      tts.stop();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      tts.speak(message.text, {
        rate: 1.0,
        volume: 0.9,
        onEnd: () => setIsSpeaking(false)
      });
    }
  };

  return (
    <div className={`flex gap-3 my-4 ${isAi ? 'justify-start' : 'justify-end'}`}>
      
      {/* Avatar icon */}
      {isAi && (
        <div className="w-8 h-8 rounded-full bg-medical-500 text-white flex items-center justify-center font-bold text-xs shrink-0 select-none">
          MS
        </div>
      )}

      {/* Bubble container */}
      <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm border ${
        isAi 
          ? 'bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 border-gray-150 dark:border-slate-750' 
          : 'bg-medical-500 text-white border-medical-500'
      }`}>
        
        {/* Grounding Status alerts */}
        {isAi && message.isGeneralKnowledge && (
          <div className="mb-3 p-2 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-100 dark:border-yellow-900/60 rounded-xl flex items-start gap-2 text-[10px] text-yellow-700 dark:text-yellow-400">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>This answer contains general medical concepts because specific facts were not present in your uploads.</span>
          </div>
        )}

        {/* Bubble text */}
        <div className="min-w-0 break-words">
          {isAi ? renderFormattedText(message.text) : <p className="text-sm font-sans whitespace-pre-wrap">{message.text}</p>}
        </div>

        {/* Action Toolbar (AI message only) */}
        {isAi && (
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-50 dark:border-slate-750/50">
            {/* Audio Speech */}
            <button
              onClick={handleSpeechToggle}
              className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all ${
                isSpeaking 
                  ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400' 
                  : 'bg-gray-50 dark:bg-slate-700/50 text-gray-500 dark:text-slate-400 hover:text-medical-500'
              }`}
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="w-3 h-3 animate-pulse" />
                  <span>Stop Listening</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3 h-3" />
                  <span>Listen</span>
                </>
              )}
            </button>

            {/* Citations Footer */}
            {message.citations && message.citations.length > 0 && (
              <span className="text-[10px] text-gray-400 dark:text-slate-500 font-semibold italic">
                {message.citations.length} grounded citations
              </span>
            )}
          </div>
        )}
      </div>

      {/* User Avatar */}
      {!isAi && (
        <div className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold text-xs shrink-0 select-none">
          U
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
