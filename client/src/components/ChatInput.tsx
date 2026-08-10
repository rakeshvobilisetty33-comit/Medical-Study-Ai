import React, { useState, useRef, useEffect } from 'react';
import { Send, CornerDownLeft } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  disabled: boolean;
  placeholder?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  disabled, 
  placeholder = "Ask MedStudy AI about your lectures or study files..." 
}) => {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize height based on input length
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!text.trim() || disabled) return;
    onSendMessage(text.trim());
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700/80 rounded-2xl p-2 shadow-sm transition-all focus-within:shadow-md">
      <div className="flex items-end gap-2 pl-2">
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 text-sm bg-transparent border-0 focus:ring-0 focus:outline-none resize-none py-2 pr-12 min-h-[38px] max-h-[120px] text-gray-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 font-sans"
          disabled={disabled}
        />
        
        {/* Submit icon button */}
        <button
          type="submit"
          disabled={disabled || !text.trim()}
          className="p-2.5 bg-medical-500 hover:bg-medical-600 active:scale-95 text-white rounded-xl transition disabled:opacity-30 disabled:scale-100 disabled:pointer-events-none shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      {/* Helper text hints */}
      <div className="absolute right-16 bottom-4 hidden sm:flex items-center gap-1 text-[10px] text-gray-400 dark:text-slate-500 font-semibold pointer-events-none">
        <span>Enter to ask</span>
        <CornerDownLeft className="w-2.5 h-2.5" />
      </div>
    </form>
  );
};

export default ChatInput;
