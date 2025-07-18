import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, mindMapNodes, conversationHistory } = await req.json();

    if (!message) {
      throw new Error('No message provided');
    }

    const systemPrompt = `You are a helpful mind mapping assistant. You help users modify and improve their mind maps through natural conversation.

Current mind map structure:
${JSON.stringify(mindMapNodes, null, 2)}

Instructions:
- Speak naturally and conversationally, like a friendly assistant
- NEVER use technical terms like "branch-1" or "node-2" 
- When the user asks to modify the mind map, respond with the updated structure
- For mind map changes, include a JSON object at the end of your response with the key "updatedMindMap" containing the new nodes array
- Keep mind map node text short (max 25 characters)
- Maintain the same coordinate layout patterns (central node at 400,200, branches radially distributed)
- Be helpful and encouraging

Remember: You're helping someone organize their thoughts, not teaching them technical concepts.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const assistantResponse = data.choices[0].message.content;

    // Check if response contains mind map updates
    let updatedMindMap = null;
    try {
      const jsonMatch = assistantResponse.match(/\{[\s\S]*"updatedMindMap"[\s\S]*\}/);
      if (jsonMatch) {
        const jsonData = JSON.parse(jsonMatch[0]);
        updatedMindMap = jsonData.updatedMindMap;
      }
    } catch (parseError) {
      // No JSON found, that's okay
    }

    return new Response(JSON.stringify({
      response: assistantResponse,
      updatedMindMap
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chat-assistant function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});