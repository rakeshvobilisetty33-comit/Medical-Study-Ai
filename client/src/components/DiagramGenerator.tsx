import React, { useState } from 'react';
import { Sparkles, AlertCircle } from 'lucide-react';
import { visualAPI } from '../services/api';
import { MedicalDiagram } from './MedicalDiagramView';

interface DiagramGeneratorProps {
  workspaceId: string;
  onGenerateSuccess: (diagram: MedicalDiagram) => void;
  defaultTopic?: string;
}

const DIAGRAM_TYPES = [
  { value: 'anatomical', label: 'Anatomical Structure' },
  { value: 'flowchart', label: 'Flow Diagram / Cascade' },
  { value: 'process', label: 'Process Pathway' },
  { value: 'organ', label: 'Organ Anatomy' },
  { value: 'neural', label: 'Neural Network' },
  { value: 'vascular', label: 'Vascular Diagram' }
];

const DiagramGenerator: React.FC<DiagramGeneratorProps> = ({
  workspaceId,
  onGenerateSuccess,
  defaultTopic = ''
}) => {
  const [topic, setTopic] = useState(defaultTopic);
  const [diagramType, setDiagramType] = useState('anatomical');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      alert('Please enter a medical topic.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const diagram = await visualAPI.generateDiagram(workspaceId, topic.trim(), diagramType);
      onGenerateSuccess(diagram);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || err.message || 'Unable to generate labeled medical diagram.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-xs text-gray-400 dark:text-slate-500 font-semibold leading-relaxed">
        Generate custom, interactive educational medical diagrams with precise anatomy labels and connectivity markers.
      </p>

      {errorMsg && (
        <div className="p-3.5 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/50 rounded-2xl flex items-center gap-2 text-xs">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Topic Input */}
      <div>
        <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-550 uppercase tracking-wider mb-1">
          Topic / Structure
        </label>
        <input
          type="text"
          maxLength={100}
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. Nephron, Brachial Plexus, Blood Coagulation"
          className="w-full text-xs py-2.5 px-3 bg-gray-50 dark:bg-slate-800 border border-gray-250 dark:border-slate-700 rounded-xl focus:outline-none focus:border-medical-500 transition text-gray-800 dark:text-slate-200"
          required
          disabled={loading}
        />
      </div>

      {/* Format Selection Grid */}
      <div>
        <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-550 uppercase tracking-wider mb-1.5">
          Diagram Layout Format
        </label>
        <div className="grid grid-cols-2 gap-2">
          {DIAGRAM_TYPES.map((type) => {
            const isSelected = diagramType === type.value;
            return (
              <button
                key={type.value}
                type="button"
                onClick={() => setDiagramType(type.value)}
                disabled={loading}
                className={`py-2 px-2 text-[10.5px] font-bold rounded-xl border text-center transition ${
                  isSelected
                    ? 'bg-medical-500 border-medical-500 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-350 hover:bg-gray-55 dark:hover:bg-slate-750'
                }`}
              >
                {type.label}
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-medical-500 hover:bg-medical-600 text-white font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 shadow disabled:opacity-50"
      >
        <Sparkles className="w-4 h-4" />
        <span>{loading ? 'Analyzing & Drawing Diagram...' : 'Generate Medical Diagram'}</span>
      </button>
    </form>
  );
};

export default DiagramGenerator;
