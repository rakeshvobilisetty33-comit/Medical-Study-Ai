import React, { useState, useEffect } from 'react';
import { Volume2, Play, Pause, Square, Settings as SettingsIcon } from 'lucide-react';
import { tts } from '../utils/textToSpeech';

interface VoicePlayerProps {
  textToSpeak: string;
}

const VoicePlayer: React.FC<VoicePlayerProps> = ({ textToSpeak }) => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | undefined>(undefined);
  const [rate, setRate] = useState(1.0);
  const [volume, setVolume] = useState(0.8);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = tts.getVoices();
      setVoices(availableVoices);
      // Select default english voice if found
      const defaultVoice = availableVoices.find(v => v.lang.includes('en-US') || v.lang.includes('en-GB')) || availableVoices[0];
      setSelectedVoice(defaultVoice);
    };

    loadVoices();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const handlePlay = () => {
    if (!textToSpeak) return;
    
    if (isPaused) {
      tts.resume();
      setIsPaused(false);
      setIsPlaying(true);
    } else {
      setIsPlaying(true);
      setIsPaused(false);
      tts.speak(textToSpeak, {
        voice: selectedVoice,
        rate,
        volume,
        onEnd: () => {
          setIsPlaying(false);
          setIsPaused(false);
        }
      });
    }
  };

  const handlePause = () => {
    tts.pause();
    setIsPaused(true);
    setIsPlaying(false);
  };

  const handleStop = () => {
    tts.stop();
    setIsPlaying(false);
    setIsPaused(false);
  };

  return (
    <div className="p-3 bg-gray-50 dark:bg-slate-800/60 border border-gray-150 dark:border-slate-750 rounded-2xl flex flex-col gap-2">
      {/* Player Main Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-medical-500" />
          <span className="text-xs font-bold text-gray-700 dark:text-slate-200">Voice Explanation</span>
        </div>

        <div className="flex items-center gap-1.5">
          {isPlaying ? (
            <button
              onClick={handlePause}
              className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 rounded-lg transition"
              title="Pause"
            >
              <Pause className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handlePlay}
              disabled={!textToSpeak}
              className="p-1.5 bg-medical-500 hover:bg-medical-600 text-white rounded-lg transition disabled:opacity-30"
              title="Play Voice"
            >
              <Play className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={handleStop}
            disabled={!isPlaying && !isPaused}
            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition disabled:opacity-30"
            title="Stop"
          >
            <Square className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 text-gray-550 dark:text-slate-455 hover:bg-gray-200/50 dark:hover:bg-slate-700 rounded-lg transition"
            title="Voice Preferences"
          >
            <SettingsIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expandable options drawer */}
      {showSettings && (
        <div className="border-t border-gray-200/50 dark:border-slate-700 mt-2 pt-2 space-y-2.5">
          {/* Select Voice */}
          {voices.length > 0 && (
            <div>
              <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                Select Voice
              </label>
              <select
                value={selectedVoice?.name || ''}
                onChange={(e) => setSelectedVoice(voices.find(v => v.name === e.target.value))}
                className="w-full text-[11px] py-1 px-1.5 bg-white dark:bg-slate-750 border border-gray-200 dark:border-slate-700 rounded-lg focus:outline-none"
              >
                {voices.map((voice, idx) => (
                  <option key={idx} value={voice.name}>{voice.name} ({voice.lang})</option>
                ))}
              </select>
            </div>
          )}

          {/* Sliders */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                <span>Speed</span>
                <span className="font-mono text-medical-600 dark:text-medical-400">{rate}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value))}
                className="w-full h-1 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-medical-500"
              />
            </div>

            <div>
              <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                <span>Volume</span>
                <span className="font-mono text-medical-600 dark:text-medical-400">{Math.round(volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full h-1 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-medical-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoicePlayer;
