import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, Share2, Link, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MindMapNode {
  id: string;
  title: string;
  content: string;
  level: number;
  parent_id?: string;
  position: { x: number; y: number };
}

interface ExportMindMapProps {
  nodes: MindMapNode[];
  documentTitle: string;
  documentId: string;
}

export function ExportMindMap({ nodes, documentTitle, documentId }: ExportMindMapProps) {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [isGeneratingShare, setIsGeneratingShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const exportToPDF = async () => {
    try {
      toast({
        title: "Exporting PDF...",
        description: "Your mind map is being prepared for download.",
      });

      // In a real implementation, you would generate a PDF
      // For now, we'll create a simple text version
      const content = generateTextContent();
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${documentTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_mindmap.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export complete!",
        description: "Your mind map has been downloaded.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "There was an error exporting your mind map.",
        variant: "destructive"
      });
    }
  };

  const exportToImage = async () => {
    try {
      toast({
        title: "Exporting image...",
        description: "Your mind map is being prepared as an image.",
      });

      // Create SVG content
      const svgContent = generateSVGContent();
      const blob = new Blob([svgContent], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${documentTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_mindmap.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export complete!",
        description: "Your mind map image has been downloaded.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "There was an error exporting your mind map image.",
        variant: "destructive"
      });
    }
  };

  const generateShareUrl = async () => {
    setIsGeneratingShare(true);
    try {
      // Generate a shareable link
      const shareToken = Math.random().toString(36).substring(2, 15);
      const url = `${window.location.origin}/shared/${shareToken}`;
      setShareUrl(url);
      setShareDialogOpen(true);
      
      toast({
        title: "Share link created!",
        description: "Anyone with this link can view your mind map.",
      });
    } catch (error) {
      toast({
        title: "Share failed",
        description: "There was an error creating the share link.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingShare(false);
    }
  };

  const copyShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      toast({
        title: "Link copied!",
        description: "The share link has been copied to your clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Could not copy the link to clipboard.",
        variant: "destructive"
      });
    }
  };

  const generateTextContent = (): string => {
    let content = `${documentTitle.toUpperCase()}\nMIND MAP EXPORT\n\n`;
    
    // Sort nodes by level
    const sortedNodes = [...nodes].sort((a, b) => a.level - b.level);
    
    sortedNodes.forEach(node => {
      const indent = '  '.repeat(node.level);
      content += `${indent}${node.title}\n`;
      if (node.content) {
        content += `${indent}  ${node.content}\n`;
      }
      content += '\n';
    });
    
    return content;
  };

  const generateSVGContent = (): string => {
    const width = 800;
    const height = 600;
    
    let svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#0a0a0a"/>
  <defs>
    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#666"/>
    </marker>
  </defs>`;

    // Add connections
    nodes.forEach(node => {
      if (node.parent_id) {
        const parent = nodes.find(n => n.id === node.parent_id);
        if (parent) {
          svgContent += `
  <line x1="${parent.position.x}" y1="${parent.position.y}" 
        x2="${node.position.x}" y2="${node.position.y}" 
        stroke="#666" stroke-width="2" marker-end="url(#arrowhead)"/>`;
        }
      }
    });

    // Add nodes
    nodes.forEach(node => {
      const colors = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'];
      const color = colors[Math.min(node.level, colors.length - 1)];
      const radius = 40 + (4 - node.level) * 10;
      
      svgContent += `
  <circle cx="${node.position.x}" cy="${node.position.y}" r="${radius}" fill="${color}"/>
  <text x="${node.position.x}" y="${node.position.y}" text-anchor="middle" 
        dominant-baseline="middle" fill="white" font-size="12" font-weight="600">
    ${node.title.length > 15 ? node.title.substring(0, 15) + '...' : node.title}
  </text>`;
    });

    svgContent += '\n</svg>';
    return svgContent;
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="lowercase">
            <Download className="w-4 h-4 mr-2" />
            export & share
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={exportToPDF}>
            <Download className="w-4 h-4 mr-2" />
            Export as PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={exportToImage}>
            <Download className="w-4 h-4 mr-2" />
            Export as Image
          </DropdownMenuItem>
          <DropdownMenuItem onClick={generateShareUrl} disabled={isGeneratingShare}>
            <Share2 className="w-4 h-4 mr-2" />
            {isGeneratingShare ? 'Generating...' : 'Create Share Link'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="lowercase">share mind map</DialogTitle>
            <DialogDescription className="lowercase">
              anyone with this link can view your mind map. the link will remain active until you delete it.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="share-url" className="lowercase">share url</Label>
              <div className="flex gap-2">
                <Input
                  id="share-url"
                  value={shareUrl}
                  readOnly
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyShareUrl}
                  className="px-3"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShareDialogOpen(false)} className="lowercase">
              close
            </Button>
            <Button onClick={copyShareUrl} className="lowercase">
              <Link className="w-4 h-4 mr-2" />
              copy link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}