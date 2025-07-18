import { Button } from "@/components/ui/button";
import { Download, Share } from "lucide-react";
import { toast } from "sonner";

interface ExportShareProps {
  mindMapData: any[];
}

export const ExportShare = ({ mindMapData }: ExportShareProps) => {
  const exportAsPNG = () => {
    const svgElement = document.querySelector('.mind-map-svg') as SVGElement;
    if (!svgElement) {
      toast.error("mind map not found");
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svg = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svg);
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const link = document.createElement('a');
          link.download = 'mindmap.png';
          link.href = URL.createObjectURL(blob);
          link.click();
          toast.success("mind map exported!");
        }
      });
      
      URL.revokeObjectURL(url);
    };
    
    img.src = url;
  };

  const shareMindMap = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'my mind map',
          text: 'check out my mind map created with mindflow!',
          url: window.location.href,
        });
      } catch (error) {
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("link copied to clipboard!");
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={exportAsPNG} className="lowercase">
        <Download className="w-4 h-4 mr-2" />
        export png
      </Button>
      <Button variant="outline" size="sm" onClick={shareMindMap} className="lowercase">
        <Share className="w-4 h-4 mr-2" />
        share
      </Button>
    </div>
  );
};