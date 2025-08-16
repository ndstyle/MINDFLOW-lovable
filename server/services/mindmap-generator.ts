import OpenAI from 'openai';
import { supabase } from '../../lib/supabase';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
});

export class MindMapGenerator {
  async generateMindMap(documentId: string, content: string) {
    try {
      // Generate mind map structure using OpenAI
      const prompt = `
        Create a comprehensive mind map structure from the following document content. 
        Generate exactly 1 main topic, 3-5 key concepts, and 2-3 specific details for each concept.
        Format as JSON with this structure:
        {
          "title": "Main Topic Title",
          "nodes": [
            {
              "id": "node_1",
              "title": "Main Topic",
              "content": "Brief summary of main topic",
              "level": 0,
              "parent_id": null
            },
            {
              "id": "node_2", 
              "title": "Key Concept 1",
              "content": "Description of concept",
              "level": 1,
              "parent_id": "node_1"
            },
            {
              "id": "node_3",
              "title": "Specific Detail",
              "content": "Detailed explanation",
              "level": 2,
              "parent_id": "node_2"
            }
          ]
        }

        Document content:
        ${content.substring(0, 4000)}
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an expert at creating educational mind maps. Generate structured, hierarchical mind maps that facilitate learning."
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
        mindMapData = JSON.parse(result);
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', result);
        throw new Error('Invalid response format from AI');
      }

      // Save nodes to database
      const nodeInserts = mindMapData.nodes.map((node: any) => ({
        document_id: documentId,
        title: node.title,
        summary: node.content,
        level: node.level,
        position_x: this.calculatePosition(node.level, node.id).x,
        position_y: this.calculatePosition(node.level, node.id).y,
        parent_id: node.parent_id,
        metadata: { ai_generated: true, node_id: node.id }
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