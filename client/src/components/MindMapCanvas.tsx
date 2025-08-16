import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2 } from 'lucide-react';

interface MindMapNode {
  id: string;
  title: string;
  content: string;
  level: number;
  parent_id?: string;
  position: { x: number; y: number };
  color?: string;
}

interface MindMapCanvasProps {
  nodes: MindMapNode[];
}

export function MindMapCanvas({ nodes }: MindMapCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Calculate positions if not provided
  const processedNodes = nodes.map((node, index) => {
    if (node.position) return node;
    
    // Simple radial layout for nodes without positions
    const angle = (index / nodes.length) * 2 * Math.PI;
    const radius = 100 + node.level * 80;
    return {
      ...node,
      position: {
        x: 400 + Math.cos(angle) * radius,
        y: 300 + Math.sin(angle) * radius
      }
    };
  });

  const getNodeColor = (level: number, isSelected: boolean) => {
    const colors = [
      '#8B5CF6', // Purple - Root
      '#06B6D4', // Cyan - Level 1
      '#10B981', // Emerald - Level 2
      '#F59E0B', // Amber - Level 3
      '#EF4444', // Red - Level 4+
    ];
    
    const baseColor = colors[Math.min(level, colors.length - 1)];
    return isSelected ? '#FF6B6B' : baseColor;
  };

  const handleZoom = (direction: 'in' | 'out') => {
    const factor = direction === 'in' ? 1.2 : 0.8;
    setZoom(prev => Math.max(0.1, Math.min(3, prev * factor)));
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedNode(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === svgRef.current) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Find connections between nodes
  const connections = processedNodes.flatMap(node => {
    if (!node.parent_id) return [];
    const parent = processedNodes.find(n => n.id === node.parent_id);
    if (!parent) return [];
    
    return [{
      from: parent.position,
      to: node.position,
      id: `${parent.id}-${node.id}`
    }];
  });

  return (
    <Card className="w-full h-[600px] relative overflow-hidden">
      <CardContent className="p-0 h-full">
        {/* Controls */}
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleZoom('in')}
            className="bg-background/80 backdrop-blur-sm"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleZoom('out')}
            className="bg-background/80 backdrop-blur-sm"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="bg-background/80 backdrop-blur-sm"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        {/* Mind Map SVG */}
        <svg
          ref={svgRef}
          className="w-full h-full cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* Connections */}
            {connections.map(connection => (
              <line
                key={connection.id}
                x1={connection.from.x}
                y1={connection.from.y}
                x2={connection.to.x}
                y2={connection.to.y}
                stroke="hsl(var(--muted-foreground))"
                strokeWidth="2"
                strokeOpacity="0.6"
                markerEnd="url(#arrowhead)"
              />
            ))}

            {/* Arrow marker */}
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill="hsl(var(--muted-foreground))"
                  opacity="0.6"
                />
              </marker>
            </defs>

            {/* Nodes */}
            {processedNodes.map((node) => {
              const isSelected = selectedNode === node.id;
              const nodeColor = getNodeColor(node.level, isSelected);
              const radius = 40 + (4 - node.level) * 10;

              return (
                <g key={node.id}>
                  {/* Node circle */}
                  <circle
                    cx={node.position.x}
                    cy={node.position.y}
                    r={radius}
                    fill={nodeColor}
                    stroke={isSelected ? '#FFFFFF' : 'transparent'}
                    strokeWidth="3"
                    className="cursor-pointer transition-all duration-200 hover:opacity-80"
                    onClick={() => setSelectedNode(isSelected ? null : node.id)}
                  />
                  
                  {/* Node text */}
                  <text
                    x={node.position.x}
                    y={node.position.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize={Math.max(10, 14 - node.level * 2)}
                    fontWeight="600"
                    className="pointer-events-none select-none"
                  >
                    {node.title.length > 15 ? `${node.title.substring(0, 15)}...` : node.title}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Selected Node Details */}
        {selectedNode && (
          <div className="absolute bottom-4 left-4 right-4 bg-background/95 backdrop-blur-sm border rounded-lg p-4 max-h-32 overflow-y-auto">
            {(() => {
              const node = processedNodes.find(n => n.id === selectedNode);
              if (!node) return null;
              
              return (
                <div>
                  <h4 className="font-semibold text-lg mb-2">{node.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {node.content || 'No additional content available'}
                  </p>
                </div>
              );
            })()}
          </div>
        )}

        {/* Empty state */}
        {processedNodes.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Maximize2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 lowercase">no mind map data</h3>
              <p className="text-muted-foreground lowercase">
                mind map will appear here once the document is processed
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}