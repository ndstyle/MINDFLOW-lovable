interface MindMapNode {
  id: string;
  text: string;
  x: number;
  y: number;
  level: number;
  children: string[];
}

const getContextualPrompt = (context: string, text: string) => {
  const prompts = {
    'class-notes': `
      Analyze these class notes and create a structured mind map:
      - Central node: Main topic/subject
      - Primary branches: Key concepts, themes, or chapters
      - Secondary branches: Supporting details, examples, formulas
      - Keep academic structure in mind
      - Prioritize learning objectives
      
      Text: ${text}
    `,
    'project-idea': `
      Transform this project idea into an organized mind map:
      - Central node: Project name/core concept
      - Primary branches: Main features, target audience, objectives
      - Secondary branches: Implementation details, resources needed
      - Focus on creative and practical aspects
      
      Text: ${text}
    `,
    'fullstack-mvp': `
      Structure this full-stack MVP concept into a technical mind map:
      - Central node: App/product name
      - Primary branches: Frontend, Backend, Database, Features, Tech Stack
      - Secondary branches: Specific technologies, APIs, user flows
      - Emphasize technical architecture and development phases
      
      Text: ${text}
    `,
    'brainstorming': `
      Organize these brainstorming thoughts into a creative mind map:
      - Central node: Main theme or challenge
      - Primary branches: Different idea categories or approaches
      - Secondary branches: Specific ideas, variations, inspirations
      - Keep creative flow and connections visible
      
      Text: ${text}
    `,
    'problem-solving': `
      Structure this problem-solving content into a logical mind map:
      - Central node: Core problem statement
      - Primary branches: Problem analysis, potential solutions, action steps
      - Secondary branches: Root causes, pros/cons, implementation details
      - Focus on clear problem-to-solution pathway
      
      Text: ${text}
    `
  };

  return prompts[context as keyof typeof prompts] || prompts['brainstorming'];
};

export const generateMindMapWithLLM = async (
  text: string, 
  context: string, 
  apiKey: string
): Promise<MindMapNode[]> => {
  if (!apiKey) {
    throw new Error('OpenAI API key is required');
  }

  const prompt = getContextualPrompt(context, text);
  
  const systemPrompt = `You are an AI that creates structured mind map data from text input. 

  Return ONLY a valid JSON array of mind map nodes with this exact structure:
  [
    {
      "id": "central",
      "text": "Main Topic",
      "x": 400,
      "y": 200,
      "level": 0,
      "children": ["branch-1", "branch-2", "branch-3"]
    },
    {
      "id": "branch-1",
      "text": "First Branch",
      "x": 250,
      "y": 100,
      "level": 1,
      "children": ["sub-1-1", "sub-1-2"]
    }
  ]

  Rules:
  - Central node at level 0, positioned at (400, 200)
  - Primary branches at level 1, arranged in a circle around center (radius ~150px)
  - Secondary branches at level 2, positioned around their parents (radius ~80px)
  - Use angles to position nodes: 0°, 60°, 120°, 180°, 240°, 300° for primary branches
  - Keep text concise (max 25 characters per node)
  - Limit to 1 central node, 4-6 primary branches, 2-3 sub-branches per primary
  - Return ONLY the JSON array, no additional text or explanation`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1500,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();
    
    // Extract JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from AI');
    }

    const nodes = JSON.parse(jsonMatch[0]);
    
    // Validate the structure
    if (!Array.isArray(nodes) || nodes.length === 0) {
      throw new Error('Invalid mind map structure returned');
    }

    return nodes;
  } catch (error) {
    console.error('LLM mind map generation error:', error);
    throw error;
  }
};