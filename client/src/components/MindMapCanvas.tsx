import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Download, Maximize } from 'lucide-react';

interface Node {
  id: string;
  title: string;
  content: string;
  level: number;
  x?: number;
  y?: number;
  children?: string[];
  parent?: string;
}

interface MindMapCanvasProps {
  nodes: Node[];
  onNodeClick?: (nodeId: string) => void;
  className?: string;
}

export function MindMapCanvas({ nodes, onNodeClick, className = "" }: MindMapCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Colors for different levels
  const levelColors = [
    'from-primary to-primary/80',
    'from-accent to-accent/80', 
    'from-secondary to-secondary/80',
    'from-blue-500 to-blue-400',
    'from-green-500 to-green-400',
    'from-purple-500 to-purple-400'
  ];

  // Calculate node positions if not provided
  const positionedNodes = React.useMemo(() => {
    if (nodes.length === 0) return [];

    const positioned = [...nodes];
    const centerX = 400;
    const centerY = 300;
    const levelGap = 150;
    const nodeGap = 100;

    // Find root node (level 0)
    const rootNode = positioned.find(n => n.level === 0);
    if (rootNode && !rootNode.x && !rootNode.y) {
      rootNode.x = centerX;
      rootNode.y = centerY;
    }

    // Position nodes by level
    for (let level = 1; level <= 3; level++) {
      const levelNodes = positioned.filter(n => n.level === level);
      const angleStep = (2 * Math.PI) / Math.max(levelNodes.length, 1);
      
      levelNodes.forEach((node, index) => {
        if (!node.x && !node.y) {
          const angle = angleStep * index;
          const radius = level * levelGap;
          node.x = centerX + Math.cos(angle) * radius;
          node.y = centerY + Math.sin(angle) * radius;
        }
      });
    }

    return positioned;
  }, [nodes]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
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

  const handleZoom = (delta: number) => {
    setZoom(prev => Math.max(0.5, Math.min(3, prev + delta)));
  };

  const exportSVG = () => {
    if (!svgRef.current) return;
    
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = 'mindmap.svg';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(svgUrl);
  };

  return (
    <div className={`relative w-full h-96 border border-border rounded-lg overflow-hidden bg-background ${className}`}>
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button size="sm" variant="outline" onClick={() => handleZoom(0.1)}>
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="outline" onClick={() => handleZoom(-0.1)}>
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="outline" onClick={exportSVG}>
          <Download className="w-4 h-4" />
        </Button>
      </div>

      {/* SVG Canvas */}
      <svg
        ref={svgRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)` }}
      >
        <defs>
          {levelColors.map((gradient, index) => (
            <linearGradient key={index} id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={`hsl(var(--primary))`} />
              <stop offset="100%" stopColor={`hsl(var(--primary) / 0.8)`} />
            </linearGradient>
          ))}
        </defs>

        {/* Connections */}
        {positionedNodes.map(node => (
          node.children?.map(childId => {
            const child = positionedNodes.find(n => n.id === childId);
            if (!child || !node.x || !node.y || !child.x || !child.y) return null;

            return (
              <line
                key={`${node.id}-${childId}`}
                x1={node.x}
                y1={node.y}
                x2={child.x}
                y2={child.y}
                stroke="hsl(var(--border))"
                strokeWidth="2"
                opacity="0.6"
              />
            );
          }) || []
        ))}

        {/* Nodes */}
        {positionedNodes.map((node, index) => {
          if (!node.x || !node.y) return null;

          const colorIndex = Math.min(node.level, levelColors.length - 1);
          
          return (
            <g key={node.id}>
              {/* Node background */}
              <circle
                cx={node.x}
                cy={node.y}
                r={node.level === 0 ? 50 : 40}
                fill={`url(#gradient-${colorIndex})`}
                stroke="hsl(var(--border))"
                strokeWidth="2"
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => onNodeClick?.(node.id)}
              />
              
              {/* Node text */}
              <text
                x={node.x}
                y={node.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontSize={node.level === 0 ? "14" : "12"}
                fontWeight="600"
                className="pointer-events-none"
              >
                {node.title.length > 15 ? `${node.title.substring(0, 15)}...` : node.title}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Empty state */}
      {positionedNodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <Maximize className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground lowercase">mind map will appear here</p>
          </div>
        </div>
      )}
    </div>
  );
}