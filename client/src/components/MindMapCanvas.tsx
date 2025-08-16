import { useEffect, useRef, useState } from 'react';
import type { Node } from '../../../shared/schema';

interface MindMapCanvasProps {
  nodes: Node[];
  onNodeClick?: (node: Node) => void;
  selectedNode?: Node | null;
  showMastery?: boolean;
}

export function MindMapCanvas({ nodes, onNodeClick, selectedNode, showMastery = false }: MindMapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState({ isDragging: false, lastX: 0, lastY: 0 });
  const [viewState, setViewState] = useState({ x: 0, y: 0, scale: 1 });

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * devicePixelRatio;
    canvas.height = rect.height * devicePixelRatio;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.scale(devicePixelRatio, devicePixelRatio);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Apply transforms
    ctx.save();
    ctx.translate(viewState.x + rect.width / 2, viewState.y + rect.height / 2);
    ctx.scale(viewState.scale, viewState.scale);

    // Draw connections first
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;
    nodes.forEach(node => {
      if (node.parent_id) {
        const parent = nodes.find(n => n.id === node.parent_id);
        if (parent) {
          ctx.beginPath();
          ctx.moveTo(parent.position_x, parent.position_y);
          ctx.lineTo(node.position_x, node.position_y);
          ctx.stroke();
        }
      }
    });

    // Draw nodes
    nodes.forEach(node => {
      const isSelected = selectedNode?.id === node.id;
      const nodeSize = getNodeSize(node.level);
      const nodeColor = getNodeColor(node.level, isSelected);

      // Draw node background
      ctx.fillStyle = nodeColor;
      ctx.beginPath();
      ctx.arc(node.position_x, node.position_y, nodeSize, 0, 2 * Math.PI);
      ctx.fill();

      // Draw border
      ctx.strokeStyle = isSelected ? '#7c3aed' : '#e5e7eb';
      ctx.lineWidth = isSelected ? 3 : 1;
      ctx.stroke();

      // Draw text
      ctx.fillStyle = '#1f2937';
      ctx.font = `${getNodeFontSize(node.level)}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Wrap text for longer titles
      const maxWidth = nodeSize * 1.8;
      const words = node.title.split(' ');
      const lines: string[] = [];
      let currentLine = '';

      words.forEach(word => {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      });
      if (currentLine) lines.push(currentLine);

      const lineHeight = getNodeFontSize(node.level) * 1.2;
      const totalHeight = lines.length * lineHeight;
      const startY = node.position_y - totalHeight / 2 + lineHeight / 2;

      lines.forEach((line, index) => {
        ctx.fillText(line, node.position_x, startY + index * lineHeight);
      });
    });

    ctx.restore();
  }, [nodes, selectedNode, viewState]);

  const getNodeSize = (level: number): number => {
    switch (level) {
      case 0: return 60; // Topic
      case 1: return 45; // Concept
      case 2: return 30; // Leaf
      default: return 30;
    }
  };

  const getNodeColor = (level: number, isSelected: boolean): string => {
    if (isSelected) return '#ddd6fe';
    switch (level) {
      case 0: return '#fef3c7'; // Yellow for topics
      case 1: return '#dbeafe'; // Blue for concepts
      case 2: return '#dcfce7'; // Green for leaves
      default: return '#f3f4f6';
    }
  };

  const getNodeFontSize = (level: number): number => {
    switch (level) {
      case 0: return 14;
      case 1: return 12;
      case 2: return 10;
      default: return 10;
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragState({ isDragging: true, lastX: e.clientX, lastY: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState.isDragging) return;

    const deltaX = e.clientX - dragState.lastX;
    const deltaY = e.clientY - dragState.lastY;

    setViewState(prev => ({
      ...prev,
      x: prev.x + deltaX,
      y: prev.y + deltaY
    }));

    setDragState(prev => ({ ...prev, lastX: e.clientX, lastY: e.clientY }));
  };

  const handleMouseUp = () => {
    setDragState(prev => ({ ...prev, isDragging: false }));
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!canvasRef.current || !containerRef.current || !onNodeClick) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();

    // Convert screen coordinates to canvas coordinates
    const x = (e.clientX - rect.left - containerRect.width / 2 - viewState.x) / viewState.scale;
    const y = (e.clientY - rect.top - containerRect.height / 2 - viewState.y) / viewState.scale;

    // Find clicked node
    const clickedNode = nodes.find(node => {
      const distance = Math.sqrt(
        Math.pow(x - node.position_x, 2) + Math.pow(y - node.position_y, 2)
      );
      return distance <= getNodeSize(node.level);
    });

    if (clickedNode) {
      onNodeClick(clickedNode);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
    setViewState(prev => ({
      ...prev,
      scale: Math.max(0.1, Math.min(3, prev.scale * scaleFactor))
    }));
  };

  const resetView = () => {
    setViewState({ x: 0, y: 0, scale: 1 });
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-96 border rounded-lg overflow-hidden bg-gray-50"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        onWheel={handleWheel}
      />
      
      {/* Controls */}
      <div className="absolute top-4 right-4 flex gap-2">
        <button
          onClick={resetView}
          className="px-3 py-1 bg-white border rounded text-sm hover:bg-gray-50"
        >
          Reset View
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/90 p-3 rounded-lg border text-xs space-y-1">
        <div className="font-medium">Node Types:</div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-200"></div>
          <span>Topics</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-200"></div>
          <span>Concepts</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-200"></div>
          <span>Details</span>
        </div>
      </div>
    </div>
  );
}