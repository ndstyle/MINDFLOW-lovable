import OpenAI from 'openai';
import { supabase } from '../../lib/supabase';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
});

export class MindMapGenerator {
  async generateMindMap(documentId: string, content: string) {
    try {
      // Generate mind map structure using OpenAI with specific constraints for reference design
      const prompt = `
        Create a mind map structure that matches EXACTLY this layout specification:
        - 1 root topic positioned on the left
        - 3-5 main concepts branching to the right
        - 2-3 sub-concepts for each main concept
        - NO deeper nesting beyond level 2 (root → main → sub)
        - Assign distinct colors to different branch families
        
        Return JSON with this EXACT structure:
        {
          "title": "Main Topic Title",
          "nodes": [
            {
              "id": "root",
              "title": "Main Topic",
              "content": "Brief description",
              "level": 0,
              "parent_id": null,
              "color": "#8B5CF6",
              "x": 150,
              "y": 300
            },
            {
              "id": "concept_1", 
              "title": "Key Concept 1",
              "content": "Description of concept",
              "level": 1,
              "parent_id": "root",
              "color": "#06B6D4",
              "x": 400,
              "y": 200
            },
            {
              "id": "sub_1_1",
              "title": "Sub Concept",
              "content": "Detailed explanation",
              "level": 2,
              "parent_id": "concept_1",
              "color": "#06B6D4",
              "x": 650,
              "y": 150
            }
          ]
        }

        Use these colors for different branch families:
        - Purple (#8B5CF6) for root
        - Cyan (#06B6D4) for first branch family
        - Emerald (#10B981) for second branch family  
        - Amber (#F59E0B) for third branch family
        - Red (#EF4444) for fourth branch family

        Document content:
        ${content.substring(0, 4000)}
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an expert at creating educational mind maps. Generate ONLY the JSON structure requested with exact positioning for left-to-right radial layout. Stop at level 2 maximum."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7
      });

      const result = response.choices[0].message.content;
      if (!result) {
        throw new Error('No response from OpenAI');
      }

      let mindMapData;
      try {
        // Clean response if it contains code blocks
        let cleanResult = result;
        if (cleanResult.includes('```json')) {
          cleanResult = cleanResult.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        }
        if (cleanResult.includes('```')) {
          cleanResult = cleanResult.replace(/```/g, '');
        }
        mindMapData = JSON.parse(cleanResult);
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', result);
        throw new Error('Invalid response format from AI');
      }

      // Ensure proper left-to-right positioning if AI didn't follow exactly
      mindMapData.nodes = this.ensureProperPositioning(mindMapData.nodes);

      // Save nodes to database
      const nodeInserts = mindMapData.nodes.map((node: any) => ({
        document_id: documentId,
        title: node.title,
        summary: node.content,
        level: node.level,
        position_x: node.x,
        position_y: node.y,
        parent_id: node.parent_id,
        metadata: { 
          ai_generated: true, 
          node_id: node.id,
          color: node.color
        }
      }));

      const { data: nodes, error: nodeError } = await supabase
        .from('nodes')
        .insert(nodeInserts)
        .select();

      if (nodeError) {
        console.error('Error saving nodes:', nodeError);
        throw new Error('Failed to save mind map nodes');
      }

      // Update document status to completed
      await supabase
        .from('documents')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId);

      return {
        title: mindMapData.title,
        nodes: nodes || []
      };

    } catch (error) {
      console.error('Mind map generation error:', error);
      
      // Mark document as failed
      await supabase
        .from('documents')
        .update({ 
          status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId);

      throw error;
    }
  }

  private ensureProperPositioning(nodes: any[]): any[] {
    // Colors for different branch families
    const branchColors = [
      '#8B5CF6', // Purple for root
      '#06B6D4', // Cyan
      '#10B981', // Emerald  
      '#F59E0B', // Amber
      '#EF4444'  // Red
    ];

    let colorIndex = 0;
    const processedNodes = nodes.map(node => {
      // Assign proper positioning based on level
      if (node.level === 0) {
        // Root node on the left
        return {
          ...node,
          x: 150,
          y: 300,
          color: branchColors[0]
        };
      } else if (node.level === 1) {
        // Main concepts spread vertically to the right
        colorIndex++;
        const branchIndex = nodes.filter(n => n.level === 1).indexOf(node);
        const totalBranches = nodes.filter(n => n.level === 1).length;
        const spacing = 120;
        const startY = 300 - (totalBranches - 1) * spacing / 2;
        
        return {
          ...node,
          x: 400,
          y: startY + branchIndex * spacing,
          color: branchColors[colorIndex % branchColors.length]
        };
      } else if (node.level === 2) {
        // Sub-concepts further to the right
        const parent = nodes.find(n => n.id === node.parent_id);
        const parentColor = parent ? processedNodes.find(n => n.id === parent.id)?.color || branchColors[1] : branchColors[1];
        const siblingIndex = nodes.filter(n => n.level === 2 && n.parent_id === node.parent_id).indexOf(node);
        const siblingCount = nodes.filter(n => n.level === 2 && n.parent_id === node.parent_id).length;
        
        const parentY = parent ? processedNodes.find(n => n.id === parent.id)?.y || 300 : 300;
        const subSpacing = 80;
        const startY = parentY - (siblingCount - 1) * subSpacing / 2;
        
        return {
          ...node,
          x: 650,
          y: startY + siblingIndex * subSpacing,
          color: parentColor
        };
      }
      
      return node;
    });

    return processedNodes;
  }

  private calculatePosition(level: number, nodeId: string): { x: number, y: number } {
    // Simple position calculation - center root, arrange others in circles
    const centerX = 400;
    const centerY = 300;
    
    if (level === 0) {
      return { x: centerX, y: centerY };
    }

    // Create some variety in positioning based on node ID
    const hash = nodeId.split('_')[1] || '1';
    const index = parseInt(hash) || 1;
    const angle = (index * 2 * Math.PI) / 8; // Distribute around circle
    const radius = level === 1 ? 150 : 250;

    return {
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius
    };
  }
}

export const mindMapGenerator = new MindMapGenerator();