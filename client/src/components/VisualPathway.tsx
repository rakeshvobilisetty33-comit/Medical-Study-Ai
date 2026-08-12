import React from 'react';
import { ArrowDown, GitFork, AlertCircle, Network, Layers } from 'lucide-react';

interface Node {
  id: string;
  label: string;
  description?: string;
}

interface Edge {
  source: string;
  target: string;
  label?: string;
}

interface VisualPathwayProps {
  data: {
    type: 'flowchart' | 'mindmap';
    title: string;
    nodes: Node[];
    edges: Edge[];
  };
}

const VisualPathway: React.FC<VisualPathwayProps> = ({ data }) => {
  if (!data || !data.nodes || data.nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-gray-400 dark:text-slate-500 bg-gray-50 dark:bg-slate-850 rounded-2xl border border-dashed border-gray-200 dark:border-slate-800">
        <AlertCircle className="w-8 h-8 mb-2 text-gray-350" />
        <p className="text-xs">No visual pathway structure could be generated.</p>
      </div>
    );
  }

  // Find root nodes (in-degree = 0)
  const incomingNodeIds = new Set(data.edges.map(e => e.target));
  let rootNodes = data.nodes.filter(n => !incomingNodeIds.has(n.id));

  // Fallback if there is a cycle or no roots found
  if (rootNodes.length === 0) {
    rootNodes = [data.nodes[0]];
  }

  const visitedNodes = new Set<string>();

  const renderNodeTree = (nodeId: string, depth = 0): React.ReactNode => {
    const node = data.nodes.find(n => n.id === nodeId);
    if (!node) return null;

    if (visitedNodes.has(nodeId)) {
      return (
        <div key={`ref-${nodeId}-${depth}`} className="flex flex-col items-center mt-2">
          <div className="px-3 py-1.5 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-750 text-[10px] text-gray-500 dark:text-slate-400 rounded-lg italic">
            Reference: {node.label} (ID: {node.id})
          </div>
        </div>
      );
    }

    visitedNodes.add(nodeId);

    // Get all outgoing connections from this node
    const outgoingEdges = data.edges.filter(e => e.source === nodeId);

    return (
      <div key={nodeId} className="flex flex-col items-center w-full">
        {/* Node card */}
        <div className={`p-4 rounded-2xl w-full max-w-sm border transition-all duration-150 hover:scale-[1.01] ${
          depth === 0
            ? 'bg-gradient-to-br from-medical-500 to-medical-600 text-white border-medical-500 shadow-md'
            : 'bg-white dark:bg-slate-900 border-gray-150 dark:border-slate-800 text-gray-800 dark:text-slate-200 shadow-sm'
        }`}>
          <div className="flex items-start justify-between gap-2">
            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
              depth === 0 
                ? 'bg-white/20 text-white' 
                : 'bg-medical-50 dark:bg-medical-950/20 text-medical-600 dark:text-medical-400'
            }`}>
              {data.type === 'mindmap' && depth === 0 ? 'Topic' : `Step ${node.id}`}
            </span>
          </div>
          <h4 className={`text-xs font-bold font-display mt-1.5 leading-snug ${depth === 0 ? 'text-white' : 'text-gray-850 dark:text-gray-100'}`}>
            {node.label}
          </h4>
          {node.description && (
            <p className={`text-[11px] font-sans mt-1 leading-relaxed ${depth === 0 ? 'text-white/80' : 'text-gray-500 dark:text-slate-400'}`}>
              {node.description}
            </p>
          )}
        </div>

        {/* Render children recursively */}
        {outgoingEdges.length > 0 && (
          <div className="w-full flex flex-col items-center">
            {/* If 1 child, draw direct line; if multiple, draw fork */}
            <div className="h-6 w-0.5 bg-gray-200 dark:bg-slate-750 flex items-center justify-center relative">
              {outgoingEdges.length === 1 && !outgoingEdges[0].label && (
                <ArrowDown className="w-3.5 h-3.5 text-gray-300 dark:text-slate-600 absolute -bottom-1 shrink-0" />
              )}
            </div>

            {outgoingEdges.length > 1 ? (
              <div className="w-full flex flex-col items-center">
                {/* Horizontal connection bar */}
                <div className="w-[80%] h-0.5 bg-gray-200 dark:bg-slate-750 rounded-full" />
                
                {/* Branches container */}
                <div className="w-full grid grid-cols-1 md:grid-flow-col gap-4 mt-2.5 items-start justify-center">
                  {outgoingEdges.map((edge) => (
                    <div key={edge.target} className="flex flex-col items-center w-full">
                      {/* Vertical line from bar to child node */}
                      <div className="h-4 w-0.5 bg-gray-200 dark:bg-slate-750 flex items-center justify-center relative">
                        {edge.label && (
                          <span className="absolute -top-3.5 text-[9px] font-black uppercase tracking-wider text-medical-600 dark:text-medical-400 bg-slate-50 dark:bg-slate-855 px-1.5 py-0.5 rounded border border-gray-150 dark:border-slate-800 shrink-0 whitespace-nowrap">
                            {edge.label}
                          </span>
                        )}
                      </div>
                      {renderNodeTree(edge.target, depth + 1)}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // Single child node
              <div className="w-full flex flex-col items-center">
                {outgoingEdges[0].label && (
                  <div className="my-1 text-[9px] font-bold text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-750 px-2 py-0.5 rounded-full">
                    {outgoingEdges[0].label}
                  </div>
                )}
                {renderNodeTree(outgoingEdges[0].target, depth + 1)}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-850 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-medical-50 dark:bg-medical-950/20 text-medical-500 rounded-lg">
            {data.type === 'mindmap' ? <Network className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
          </div>
          <span className="text-sm font-bold text-gray-850 dark:text-gray-200 font-display">
            {data.title}
          </span>
        </div>
        <span className="text-[10px] uppercase font-black bg-medical-100/50 dark:bg-medical-950/40 text-medical-600 dark:text-medical-400 px-2.5 py-1 rounded-full border border-medical-200/40">
          {data.type}
        </span>
      </div>

      <div className="flex flex-col gap-6 overflow-y-auto max-h-[60vh] pr-2 pb-6 items-center w-full">
        {rootNodes.map(root => renderNodeTree(root.id))}
      </div>
    </div>
  );
};

export default VisualPathway;
