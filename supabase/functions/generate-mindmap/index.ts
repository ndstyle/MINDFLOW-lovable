import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MindMapNode {
  id: string;
  text: string;
  x: number;
  y: number;
  level: number;
  children: string[];
}

const generateMindMapPrompt = (text: string, category: string) => {
  const categoryPrompts = {
    'notes for a class': 'Create a mind map for academic notes with main topics, subtopics, key concepts, and detailed explanations. Focus on learning objectives and knowledge hierarchy.',
    'project idea': 'Create a mind map for a project with phases, deliverables, resources needed, timeline, and key stakeholders. Focus on project planning and execution.',
    'full stack app MVP': 'Create a mind map for an app MVP with features, tech stack, user flows, database design, API endpoints, and deployment strategy. Focus on technical architecture.',
    'brainstorming': 'Create a mind map for brainstorming with main themes, creative ideas, connections between concepts, and potential solutions. Focus on idea generation and exploration.',
    'problem solving': 'Create a mind map for problem solving with problem definition, root causes, potential solutions, evaluation criteria, and implementation steps. Focus on systematic analysis.',
    'other': 'Create a comprehensive mind map that organizes the information into logical categories and subcategories.'
  };

  const specificPrompt = categoryPrompts[category as keyof typeof categoryPrompts] || categoryPrompts.other;

  return `${specificPrompt}

Input text: "${text}"

Create a JSON response with a "nodes" array. Each node should have:
- id: unique identifier (string)
- text: short, clear label (max 25 characters)
- x: x coordinate (number)
- y: y coordinate (number)  
- level: hierarchy level (0 for center, 1 for main branches, 2 for sub-branches)
- children: array of child node IDs

Layout the nodes in a radial pattern around a central node at (400, 200). Main branches should be 150px from center, sub-branches 80px from their parent. Distribute evenly in a circle.

Return only the JSON object with the nodes array. No other text.`;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, category } = await req.json();

    if (!text) {
      throw new Error('No text provided');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a mind mapping expert. Create well-structured, organized mind maps based on user input and category.'
          },
          {
            role: 'user',
            content: generateMindMapPrompt(text, category || 'other')
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      const mindMapData = JSON.parse(content);
      return new Response(JSON.stringify(mindMapData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      // Fallback if AI doesn't return valid JSON
      const fallbackNodes: MindMapNode[] = [
        {
          id: 'central',
          text: text.substring(0, 25),
          x: 400,
          y: 200,
          level: 0,
          children: ['branch-1', 'branch-2']
        },
        {
          id: 'branch-1',
          text: 'Main Idea 1',
          x: 550,
          y: 150,
          level: 1,
          children: []
        },
        {
          id: 'branch-2',
          text: 'Main Idea 2',
          x: 250,
          y: 250,
          level: 1,
          children: []
        }
      ];
      
      return new Response(JSON.stringify({ nodes: fallbackNodes }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error in generate-mindmap function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});