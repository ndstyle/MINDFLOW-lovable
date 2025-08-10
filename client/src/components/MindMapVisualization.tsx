import { useEffect, useRef } from 'react';
import './mindmap-styles.css';

interface MindMapNode {
  id: string;
  text: string;
  x: number;
  y: number;
  level: number;
  children: string[];
}

interface MindMapProps {
  nodes: MindMapNode[];
}

export const MindMapVisualization = ({ nodes }: MindMapProps) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    
    // Clear previous content
    svg.innerHTML = '';

    // Create connections first (so they appear behind nodes)
    nodes.forEach(node => {
      node.children.forEach(childId => {
        const childNode = nodes.find(n => n.id === childId);
        if (childNode) {
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          const d = `M ${node.x} ${node.y} Q ${(node.x + childNode.x) / 2} ${node.y - 50} ${childNode.x} ${childNode.y}`;
          line.setAttribute('d', d);
          line.setAttribute('class', 'mind-map-connection');
          svg.appendChild(line);
        }
      });
    });

    // Create nodes
    nodes.forEach(node => {
      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.setAttribute('class', 'mind-map-node');
      group.setAttribute('transform', `translate(${node.x - 60}, ${node.y - 15})`);

      // Node background
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('width', '120');
      rect.setAttribute('height', '30');
      rect.setAttribute('rx', '15');
      rect.setAttribute('fill', node.level === 0 ? 'hsl(var(--primary))' : 'hsl(var(--secondary))');
      rect.setAttribute('stroke', 'hsl(var(--border))');
      rect.setAttribute('stroke-width', '1');
      group.appendChild(rect);

      // Node text with proper wrapping
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', '60');
      text.setAttribute('y', '20');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'middle');
      text.setAttribute('fill', node.level === 0 ? 'hsl(var(--primary-foreground))' : 'hsl(var(--secondary-foreground))');
      text.setAttribute('font-size', '10');
      text.setAttribute('font-family', 'Inter, sans-serif');
      
      // Truncate text if too long
      const maxLength = 15;
      const displayText = node.text.length > maxLength ? 
        node.text.substring(0, maxLength) + '...' : 
        node.text;
      text.textContent = displayText.toLowerCase();
      group.appendChild(text);

      svg.appendChild(group);
    });
  }, [nodes]);

  return (
    <div className="w-full h-96 bg-card rounded-lg border border-border/50 overflow-hidden">
      <svg
        ref={svgRef}
        id="mindmap-svg"
        width="100%"
        height="100%"
        viewBox="0 0 800 400"
        className="w-full h-full"
        style={{ pointerEvents: 'none' }}
      />
    </div>
  );
};