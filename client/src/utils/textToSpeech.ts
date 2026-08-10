export interface SpeechOptions {
  voice?: SpeechSynthesisVoice;
  rate?: number; // Speed: 0.5 to 2
  volume?: number; // Volume: 0 to 1
  onEnd?: () => void;
  onBoundary?: (event: SpeechSynthesisEvent) => void;
}

class TextToSpeechManager {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      this.synth = window.speechSynthesis;
    }
  }

  public getVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    return this.synth.getVoices();
  }

  public speak(text: string, options: SpeechOptions = {}) {
    if (!this.synth) return;

    this.stop(); // Stop any ongoing speech

    // Remove markdown symbols for cleaner speech
    const cleanText = text
      .replace(/[*_#`~>]/g, '') // remove markdown indicators
      .replace(/\[Source:.*?\]/g, '') // remove citation citations
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    if (options.voice) utterance.voice = options.voice;
    if (options.rate !== undefined) utterance.rate = options.rate;
    if (options.volume !== undefined) utterance.volume = options.volume;
    
    if (options.onEnd) {
      utterance.onend = () => {
        this.currentUtterance = null;
        options.onEnd?.();
      };
      utterance.onerror = () => {
        this.currentUtterance = null;
        options.onEnd?.();
      };
    }

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  public pause() {
    if (this.synth && this.synth.speaking && !this.synth.paused) {
      this.synth.pause();
    }
  }

  public resume() {
    if (this.synth && this.synth.paused) {
      this.synth.resume();
    }
  }

  public stop() {
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
  }

  public isSpeaking(): boolean {
    return this.synth ? this.synth.speaking : false;
  }

  public isPaused(): boolean {
    return this.synth ? this.synth.paused : false;
  }
}

export const tts = new TextToSpeechManager();
