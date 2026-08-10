import React, { useEffect, useRef } from 'react';
import { Sparkles, BrainCircuit } from 'lucide-react';
import { Message, Citation } from '../types/chat';
import ChatMessage from './ChatMessage';
import EmptyState from './EmptyState';

interface ChatWindowProps {
  messages: Message[];
  loading: boolean;
  onOpenCitation: (citation: Citation) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, loading, onOpenCitation }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of the chat list
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  return (
    <div className="flex-1 overflow-y-auto min-h-0 px-4 scroll-smooth">
      {messages.length === 0 ? (
        <div className="py-12">
          <EmptyState
            title="Chat with MedStudy AI"
            description="Ask questions about your uploaded notes or lectures. MedStudy AI retrieves matching sections and details the source documents in its answers."
            icon={BrainCircuit}
          />
        </div>
      ) : (
        <div className="space-y-1">
          {messages.map((msg, index) => (
            <ChatMessage
              key={index}
              message={msg}
              onOpenCitation={onOpenCitation}
            />
          ))}

          {/* AI generating loader skeleton */}
          {loading && (
            <div className="flex gap-3 my-4 justify-start">
              <div className="w-8 h-8 rounded-full bg-medical-500 text-white flex items-center justify-center font-bold text-xs shrink-0 select-none animate-pulse">
                MS
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-150 dark:border-slate-750 flex items-center gap-2">
                <span className="text-xs text-gray-400 dark:text-slate-500 font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-medical-500 animate-spin" />
                  Tutor is compiling details...
                </span>
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
