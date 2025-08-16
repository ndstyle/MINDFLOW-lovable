import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import html2canvas from 'html2canvas';
import { useToast } from '@/hooks/use-toast';

interface MindMapNode {
  id: string;
  title: string;
  content?: string;
  level: number;
  parent_id?: string | null;
  x: number;
  y: number;
  color: string;
}

interface MindMapVisualizationProps {
  nodes: MindMapNode[];
  title?: string;
}

export const MindMapVisualization = ({ nodes, title }: MindMapVisualizationProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const { toast } = useToast();

  // Calculate SVG dimensions based on node positions
  const calculateBounds = () => {
    if (nodes.length === 0) return { width: 800, height: 600, minX: 0, minY: 0 };
    
    const xs = nodes.map(n => n.x);
    const ys = nodes.map(n => n.y);
    const minX = Math.min(...xs) - 100;
    const maxX = Math.max(...xs) + 200;
    const minY = Math.min(...ys) - 100;
    const maxY = Math.max(...ys) + 100;
    
    return {
      width: maxX - minX,
      height: maxY - minY,
      minX,
      minY
    };
  };

  const bounds = calculateBounds();

  // Generate smooth curved connection path
  const generatePath = (fromNode: MindMapNode, toNode: MindMapNode): string => {
    const dx = toNode.x - fromNode.x;
    const dy = toNode.y - fromNode.y;
    
    // Control points for smooth curve
    const controlX1 = fromNode.x + dx * 0.5;
    const controlY1 = fromNode.y;
    const controlX2 = fromNode.x + dx * 0.5;
    const controlY2 = toNode.y;
    
    return `M ${fromNode.x} ${fromNode.y} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${toNode.x} ${toNode.y}`;
  };

  // Word wrapping for text
  const wrapText = (text: string, maxWidth: number): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      // Rough character width estimation
      if (testLine.length * 8 <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
    
    return lines;
  };

  // Get node dimensions
  const getNodeDimensions = (node: MindMapNode) => {
    const lines = wrapText(node.title, node.level === 0 ? 180 : 150);
    const width = node.level === 0 ? 200 : 160;
    const height = Math.max(50, lines.length * 18 + 20);
    return { width, height, lines };
  };

  // Handle zoom controls
  const handleZoom = (factor: number) => {
    setZoom(prev => Math.max(0.3, Math.min(2, prev * factor)));
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Handle pan/drag
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

  // Export as PNG
  const handleExport = async () => {
    if (!containerRef.current) return;
    
    try {
      const canvas = await html2canvas(containerRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true
      });
      
      const link = document.createElement('a');
      link.download = `${title || 'mindmap'}.png`;
      link.href = canvas.toDataURL();
      link.click();
      
      toast({
        title: "Export successful",
        description: "Mind map has been exported as PNG"
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: "Could not export mind map",
        variant: "destructive"
      });
    }
  };

  if (nodes.length === 0) {
    return (
      <Card className="w-full h-[600px] flex items-center justify-center">
        <p className="text-muted-foreground">No mind map data available</p>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => handleZoom(1.2)}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleZoom(0.8)}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground ml-2">
            {Math.round(zoom * 100)}%
          </span>
        </div>
        
        <Button 
          onClick={handleExport}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
        >
          <Download className="w-4 h-4 mr-2" />
          Generate Image
        </Button>
      </div>

      {/* Mind Map */}
      <Card className="w-full h-[600px] overflow-hidden bg-white dark:bg-gray-50 relative">
        <div 
          ref={containerRef}
          className="w-full h-full cursor-move"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            viewBox={`${bounds.minX + pan.x / zoom} ${bounds.minY + pan.y / zoom} ${bounds.width / zoom} ${bounds.height / zoom}`}
            className="select-none"
            style={{ transform: `scale(${zoom})` }}
          >
            {/* Connections */}
            <g>
              {nodes.map(node => {
                if (!node.parent_id) return null;
                const parent = nodes.find(n => n.id === node.parent_id);
                if (!parent) return null;
                
                return (
                  <path
                    key={`${parent.id}-${node.id}`}
                    d={generatePath(parent, node)}
                    stroke={node.color}
                    strokeWidth="3"
                    fill="none"
                    opacity="0.7"
                  />
                );
              })}
            </g>

            {/* Nodes */}
            <g>
              {nodes.map(node => {
                const { width, height, lines } = getNodeDimensions(node);
                
                return (
                  <g key={node.id}>
                    {/* Node background */}
                    <rect
                      x={node.x - width / 2}
                      y={node.y - height / 2}
                      width={width}
                      height={height}
                      rx="12"
                      ry="12"
                      fill={node.color}
                      stroke="white"
                      strokeWidth="2"
                      opacity="0.9"
                    />
                    
                    {/* Node text */}
                    {lines.map((line, index) => (
                      <text
                        key={index}
                        x={node.x}
                        y={node.y - (lines.length - 1) * 9 + index * 18}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="white"
                        fontSize={node.level === 0 ? "14" : "12"}
                        fontWeight={node.level === 0 ? "bold" : "medium"}
                        fontFamily="Inter, sans-serif"
                      >
                        {line}
                      </text>
                    ))}
                  </g>
                );
              })}
            </g>
          </svg>
        </div>
      </Card>
    </div>
  );
};