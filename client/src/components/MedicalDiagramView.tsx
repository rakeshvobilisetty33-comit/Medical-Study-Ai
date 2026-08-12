import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, Download, Copy, Save, AlertCircle, RefreshCw } from 'lucide-react';
import { visualAPI } from '../services/api';

interface DiagramNode {
  id: string;
  label: string;
  x: number;
  y: number;
  description?: string;
}

interface DiagramConnection {
  from: string;
  to: string;
  label?: string;
}

export interface MedicalDiagram {
  title: string;
  type: string;
  nodes: DiagramNode[];
  connections: DiagramConnection[];
  isGeneralKnowledge?: boolean;
}

interface MedicalDiagramViewProps {
  diagram: MedicalDiagram;
  workspaceId: string;
  sessionId?: string;
  subject?: string;
  topic?: string;
  onSaveSuccess?: () => void;
}

const MedicalDiagramView: React.FC<MedicalDiagramViewProps> = ({
  diagram,
  workspaceId,
  sessionId,
  subject,
  topic,
  onSaveSuccess
}) => {
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [saveLoading, setSaveLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const svgRef = useRef<SVGSVGElement | null>(null);

  // Reset states on diagram change
  useEffect(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
    setIsSaved(false);
  }, [diagram]);

  // Zoom controls
  const handleZoomIn = () => setScale(prev => Math.min(2.5, prev + 0.15));
  const handleZoomOut = () => setScale(prev => Math.max(0.5, prev - 0.15));
  const handleResetZoom = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  // Pan controls
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Serialize SVG to XML string
  const getSVGString = (): string => {
    if (!svgRef.current) return '';
    try {
      const serializer = new XMLSerializer();
      return serializer.serializeToString(svgRef.current);
    } catch (err) {
      console.error(err);
      return '';
    }
  };

  // Copy SVG string to clipboard
  const handleCopySVG = () => {
    const svgStr = getSVGString();
    if (svgStr) {
      navigator.clipboard.writeText(svgStr);
      alert('SVG markup copied to clipboard!');
    }
  };

  // Download SVG file
  const handleDownloadSVG = () => {
    const svgStr = getSVGString();
    if (!svgStr) return;
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${diagram.title.toLowerCase().replace(/\s+/g, '_')}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download PNG file via Canvas
  const handleDownloadPNG = () => {
    const svgStr = getSVGString();
    if (!svgStr || !svgRef.current) return;

    const svgWidth = svgRef.current.clientWidth || 600;
    const svgHeight = svgRef.current.clientHeight || 450;

    const img = new Image();
    const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = svgWidth * 2; // high res scaling
      canvas.height = svgHeight * 2;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff'; // white background
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.scale(2, 2);
        ctx.drawImage(img, 0, 0);
        
        const imgUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = imgUrl;
        link.download = `${diagram.title.toLowerCase().replace(/\s+/g, '_')}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  // Save diagram data to study workspace
  const handleSaveToWorkspace = async () => {
    if (saveLoading || isSaved) return;
    setSaveLoading(true);
    try {
      await visualAPI.saveDiagram({
        workspaceId,
        sessionId,
        topic: topic || diagram.title,
        subject,
        diagramData: diagram
      });
      setIsSaved(true);
      alert('Diagram saved successfully to your study workspace!');
      if (onSaveSuccess) onSaveSuccess();
    } catch (err) {
      console.error(err);
      alert('Failed to save diagram to workspace.');
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-5 shadow-lg space-y-4 select-none">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-slate-850 pb-3">
        <div>
          <h3 className="text-sm font-bold text-gray-800 dark:text-slate-100 font-display flex items-center gap-1.5">
            <span>{diagram.title}</span>
            <span className="bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
              {diagram.type}
            </span>
          </h3>
          <p className="text-[10px] text-gray-400 dark:text-slate-500 font-semibold mt-0.5">
            {diagram.isGeneralKnowledge 
              ? 'General educational medical diagram' 
              : 'Workspace grounded medical diagram'}
          </p>
        </div>

        {/* Toolbar buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button 
            onClick={handleZoomIn} 
            className="p-2 text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button 
            onClick={handleZoomOut} 
            className="p-2 text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button 
            onClick={handleResetZoom} 
            className="p-2 text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition"
            title="Reset Zoom & Pan"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <div className="w-px h-5 bg-gray-200 dark:bg-slate-800 mx-1"></div>
          <button 
            onClick={handleCopySVG} 
            className="p-2 text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition"
            title="Copy SVG to Clipboard"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button 
            onClick={handleDownloadSVG} 
            className="p-2 text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition"
            title="Download SVG"
          >
            <Download className="w-4 h-4" />
          </button>
          <button 
            onClick={handleDownloadPNG} 
            className="text-xs bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-250 font-bold py-1.5 px-3 rounded-xl transition"
            title="Download PNG"
          >
            Download PNG
          </button>
          <button 
            onClick={handleSaveToWorkspace}
            disabled={saveLoading || isSaved}
            className={`text-xs font-bold py-1.5 px-4 rounded-xl transition flex items-center gap-1.5 ${
              isSaved
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-250 cursor-default'
                : 'bg-medical-500 hover:bg-medical-600 text-white shadow-sm'
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saveLoading ? 'Saving...' : isSaved ? '✓ Saved' : 'Save to Workspace'}</span>
          </button>
        </div>
      </div>

      {/* SVG Canvas Board */}
      <div className="relative border border-gray-150 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 rounded-2xl overflow-hidden h-[420px] cursor-grab active:cursor-grabbing">
        <svg
          ref={svgRef}
          className="w-full h-full"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Arrow markers for connections */}
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="18"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#64748b" />
            </marker>
          </defs>

          {/* Grid Background pattern */}
          <rect width="100%" height="100%" fill="none" />
          
          {/* Transforming canvas group */}
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${scale})`}>
            
            {/* Draw connection lines/leader lines */}
            {diagram.connections?.map((conn, idx) => {
              const fromNode = diagram.nodes.find(n => n.id === conn.from);
              const toNode = diagram.nodes.find(n => n.id === conn.to);
              
              if (!fromNode || !toNode) return null;

              // Quadratic curve path
              const midX = (fromNode.x + toNode.x) / 2;
              const midY = (fromNode.y + toNode.y) / 2 - 20;

              return (
                <g key={idx}>
                  <path
                    d={`M ${fromNode.x} ${fromNode.y} Q ${midX} ${midY} ${toNode.x} ${toNode.y}`}
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    strokeDasharray={diagram.type === 'neural' ? '4 3' : 'none'}
                    markerEnd="url(#arrow)"
                    className="transition-all duration-350"
                  />
                  {conn.label && (
                    <text
                      x={midX}
                      y={midY - 5}
                      textAnchor="middle"
                      className="text-[9px] fill-gray-400 dark:fill-slate-500 font-bold font-sans"
                    >
                      {conn.label}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Draw nodes (Anatomical labels with boxes) */}
            {diagram.nodes?.map((node) => {
              // Custom colors based on diagram type/node index
              const colorClass = 
                diagram.type === 'neural' 
                  ? 'fill-indigo-50 dark:fill-indigo-950/20 stroke-indigo-400'
                  : diagram.type === 'vascular'
                  ? 'fill-red-50 dark:fill-red-950/20 stroke-red-400'
                  : 'fill-sky-50 dark:fill-sky-950/20 stroke-sky-400';

              const textColor = 'fill-gray-800 dark:fill-slate-100';

              return (
                <g 
                  key={node.id} 
                  transform={`translate(${node.x}, ${node.y})`}
                  className="transition-transform duration-350 group"
                >
                  {/* Outer circle/box */}
                  <rect
                    x={-75}
                    y={-22}
                    width={150}
                    height={44}
                    rx={12}
                    className={`stroke-2 shadow-sm ${colorClass}`}
                  />
                  
                  {/* Label Text */}
                  <text
                    x={0}
                    y={-2}
                    textAnchor="middle"
                    className={`text-[10px] font-bold font-display ${textColor}`}
                  >
                    {node.label}
                  </text>

                  {/* Subtext description (smaller) */}
                  {node.description && (
                    <text
                      x={0}
                      y={12}
                      textAnchor="middle"
                      className="text-[7.5px] fill-gray-400 dark:fill-slate-500 font-semibold font-sans"
                    >
                      {node.description.length > 32 
                        ? `${node.description.substring(0, 30)}...` 
                        : node.description}
                    </text>
                  )}

                  {/* Tooltip on Hover */}
                  {node.description && (
                    <g className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none duration-250">
                      <rect
                        x={-100}
                        y={-65}
                        width={200}
                        height={36}
                        rx={8}
                        className="fill-slate-800/90 dark:fill-slate-900/95 stroke-slate-700"
                      />
                      <text
                        x={0}
                        y={-45}
                        textAnchor="middle"
                        className="fill-white text-[8px] font-medium font-sans"
                      >
                        {node.description}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

          </g>
        </svg>

        {/* Tip Badge info Overlay */}
        <div className="absolute bottom-3 left-3 bg-slate-900/75 dark:bg-slate-900/90 text-white text-[9px] font-bold px-2.5 py-1 rounded-xl flex items-center gap-1">
          <AlertCircle className="w-3 h-3 text-blue-400" />
          <span>Tip: Hover nodes to inspect functional descriptions. Drag to pan.</span>
        </div>
      </div>

    </div>
  );
};

export default MedicalDiagramView;
