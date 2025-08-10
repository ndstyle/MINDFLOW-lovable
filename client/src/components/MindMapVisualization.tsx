import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Plus, Search, Zap, Target, BookOpen, Users, Share2 } from 'lucide-react';

interface MindMapNode {
  id: string;
  text: string;
  x: number;
  y: number;
  type: 'main' | 'branch' | 'leaf';
  color: string;
  icon?: string;
  connections: string[];
}

interface MindMapVisualizationProps {
  nodes: MindMapNode[];
  onNodesChange: (nodes: MindMapNode[]) => void;
  title: string;
  readonly?: boolean;
  onGenerateQuiz?: () => void;
  onGenerateFlashcards?: () => void;
  onShare?: () => void;
}

export const MindMapVisualization: React.FC<MindMapVisualizationProps> = ({
  nodes,
  onNodesChange,
  title,
  readonly = false,
  onGenerateQuiz,
  onGenerateFlashcards,
  onShare
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const snapToGrid = (value: number, gridSize: number = 20) => {
    return Math.round(value / gridSize) * gridSize;
  };

  const handleNodeMouseDown = (nodeId: string, event: React.MouseEvent) => {
    if (readonly) return;
    
    event.preventDefault();
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    setDraggedNode(nodeId);
    setDragOffset({
      x: (event.clientX - rect.left) / zoom - node.x,
      y: (event.clientY - rect.top) / zoom - node.y
    });
    setSelectedNode(nodeId);
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!draggedNode || readonly) return;

    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const newX = snapToGrid((event.clientX - rect.left) / zoom - dragOffset.x);
    const newY = snapToGrid((event.clientY - rect.top) / zoom - dragOffset.y);

    const updatedNodes = nodes.map(node =>
      node.id === draggedNode
        ? { ...node, x: newX, y: newY }
        : node
    );

    onNodesChange(updatedNodes);
  };

  const handleMouseUp = () => {
    setDraggedNode(null);
  };

  const getNodeIcon = (type: string, icon?: string) => {
    if (icon) return icon;
    switch (type) {
      case 'main': return '🧠';
      case 'branch': return '🌿';
      case 'leaf': return '🍃';
      default: return '💡';
    }
  };

  const getNodeColor = (type: string, color?: string) => {
    if (color) return color;
    switch (type) {
      case 'main': return '#8B5CF6';
      case 'branch': return '#06B6D4';
      case 'leaf': return '#10B981';
      default: return '#6B7280';
    }
  };

  const filteredNodes = searchTerm
    ? nodes.filter(node => 
        node.text.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : nodes;

  const zoomToNode = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node || !svgRef.current) return;

    // Center the node in the view
    const rect = svgRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    setZoom(1.5);
    // In a real implementation, you'd also pan to center the node
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-purple-900 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-white/80 backdrop-blur-sm">
            <Brain className="h-3 w-3 mr-1" />
            {title}
          </Badge>
          <div className="relative">
            <Search className="h-4 w-4 absolute left-2 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search nodes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onGenerateQuiz && (
            <Button
              onClick={onGenerateQuiz}
              size="sm"
              variant="outline"
              className="bg-white/80 backdrop-blur-sm hover:bg-white"
            >
              <Target className="h-4 w-4 mr-1" />
              Quiz
            </Button>
          )}
          {onGenerateFlashcards && (
            <Button
              onClick={onGenerateFlashcards}
              size="sm"
              variant="outline"
              className="bg-white/80 backdrop-blur-sm hover:bg-white"
            >
              <BookOpen className="h-4 w-4 mr-1" />
              Cards
            </Button>
          )}
          {onShare && (
            <Button
              onClick={onShare}
              size="sm"
              variant="outline"
              className="bg-white/80 backdrop-blur-sm hover:bg-white"
            >
              <Share2 className="h-4 w-4 mr-1" />
              Share
            </Button>
          )}
          <Button
            onClick={() => setZoom(zoom === 1 ? 1.5 : 1)}
            size="sm"
            variant="outline"
            className="bg-white/80 backdrop-blur-sm hover:bg-white"
          >
            {zoom === 1 ? 'Zoom In' : 'Reset'}
          </Button>
        </div>
      </div>

      {/* Search Results */}
      {searchTerm && (
        <div className="absolute top-16 left-4 z-10 bg-white/90 backdrop-blur-sm rounded-md shadow-lg p-2 max-w-sm">
          <div className="text-sm font-medium mb-2">Search Results</div>
          {filteredNodes.map(node => (
            <button
              key={node.id}
              onClick={() => {
                zoomToNode(node.id);
                setSelectedNode(node.id);
              }}
              className="block w-full text-left px-2 py-1 text-sm hover:bg-purple-100 rounded"
            >
              {getNodeIcon(node.type)} {node.text}
            </button>
          ))}
        </div>
      )}

      {/* SVG Mind Map */}
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox="0 0 1200 800"
        className="cursor-grab active:cursor-grabbing"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ transform: `scale(${zoom})` }}
      >
        {/* Grid Background */}
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="0.5" opacity="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Connections */}
        {nodes.map(node =>
          node.connections.map(connectionId => {
            const targetNode = nodes.find(n => n.id === connectionId);
            if (!targetNode) return null;

            const isHighlighted = hoveredNode === node.id || hoveredNode === connectionId;

            return (
              <g key={`${node.id}-${connectionId}`}>
                <line
                  x1={node.x}
                  y1={node.y}
                  x2={targetNode.x}
                  y2={targetNode.y}
                  stroke={isHighlighted ? '#8B5CF6' : '#94A3B8'}
                  strokeWidth={isHighlighted ? 3 : 2}
                  strokeDasharray={isHighlighted ? '5,5' : 'none'}
                  className="transition-all duration-300"
                >
                  <animate
                    attributeName="stroke-dashoffset"
                    values="0;10;0"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </line>
              </g>
            );
          })
        )}

        {/* Nodes */}
        {nodes.map(node => {
          const isSelected = selectedNode === node.id;
          const isHighlighted = searchTerm && node.text.toLowerCase().includes(searchTerm.toLowerCase());
          const nodeColor = getNodeColor(node.type, node.color);

          return (
            <g
              key={node.id}
              onMouseDown={(e) => handleNodeMouseDown(node.id, e)}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              className="cursor-pointer"
              style={{ transform: hoveredNode === node.id ? 'scale(1.1)' : 'scale(1)' }}
            >
              {/* Node Shadow */}
              <circle
                cx={node.x + 2}
                cy={node.y + 2}
                r={node.type === 'main' ? 35 : node.type === 'branch' ? 25 : 20}
                fill="rgba(0,0,0,0.1)"
              />
              
              {/* Node Background */}
              <circle
                cx={node.x}
                cy={node.y}
                r={node.type === 'main' ? 35 : node.type === 'branch' ? 25 : 20}
                fill={nodeColor}
                stroke={isSelected ? '#7C3AED' : isHighlighted ? '#F59E0B' : 'white'}
                strokeWidth={isSelected ? 4 : isHighlighted ? 3 : 2}
                className="transition-all duration-300"
              />

              {/* Node Icon */}
              <text
                x={node.x}
                y={node.y + 5}
                textAnchor="middle"
                fontSize={node.type === 'main' ? 20 : 16}
                className="pointer-events-none select-none"
              >
                {getNodeIcon(node.type, node.icon)}
              </text>

              {/* Node Label */}
              <text
                x={node.x}
                y={node.y + (node.type === 'main' ? 55 : node.type === 'branch' ? 45 : 40)}
                textAnchor="middle"
                fontSize={node.type === 'main' ? 14 : 12}
                fontWeight={node.type === 'main' ? 'bold' : 'normal'}
                fill="#374151"
                className="pointer-events-none select-none max-w-24"
              >
                {node.text.length > 15 ? `${node.text.substring(0, 15)}...` : node.text}
              </text>

              {/* Pulse animation for selected node */}
              {isSelected && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.type === 'main' ? 45 : node.type === 'branch' ? 35 : 30}
                  fill="none"
                  stroke="#7C3AED"
                  strokeWidth="2"
                  opacity="0.6"
                >
                  <animate
                    attributeName="r"
                    values={`${node.type === 'main' ? 35 : node.type === 'branch' ? 25 : 20};${node.type === 'main' ? 50 : node.type === 'branch' ? 40 : 35};${node.type === 'main' ? 35 : node.type === 'branch' ? 25 : 20}`}
                    dur="2s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.6;0.2;0.6"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}
            </g>
          );
        })}
      </svg>

      {/* Node Details Panel */}
      {selectedNode && (
        <Card className="absolute bottom-4 right-4 w-64 bg-white/90 backdrop-blur-sm">
          <CardContent className="p-4">
            {(() => {
              const node = nodes.find(n => n.id === selectedNode);
              if (!node) return null;
              
              return (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{getNodeIcon(node.type, node.icon)}</span>
                    <Badge variant="outline">{node.type}</Badge>
                  </div>
                  <h3 className="font-semibold">{node.text}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Connected to {node.connections.length} nodes
                  </p>
                  {!readonly && (
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline">
                        <Plus className="h-3 w-3 mr-1" />
                        Add Child
                      </Button>
                      <Button size="sm" variant="outline">
                        Edit
                      </Button>
                    </div>
                  )}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  );
};