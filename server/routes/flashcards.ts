import express from 'express';
import { supabaseAdmin } from '../supabase';
import type { InsertFlashcard } from '@shared/supabase-types';

const router = express.Router();

// Generate flashcards from mindmap
router.post('/generate', async (req, res) => {
  try {
    const { mindmapId, cardCount = 20 } = req.body;
    const userId = req.user!.id;

    // Get mindmap content
    const { data: mindmap, error: mindmapError } = await supabaseAdmin
      .from('mindmaps')
      .select('*')
      .eq('id', mindmapId)
      .eq('user_id', userId)
      .single();

    if (mindmapError || !mindmap) {
      return res.status(404).json({ error: 'Mindmap not found' });
    }

    // Generate flashcards using OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert flashcard generator. Create effective flashcards from the provided mindmap content.

Generate up to ${cardCount} flashcards focusing on:
- Key concepts and definitions
- Important relationships
- Critical facts and details
- Process steps
- Cause and effect relationships

Return a JSON object with this structure:
{
  "cards": [
    {
      "id": "card1",
      "front": "Question or prompt text",
      "back": "Answer or explanation text",
      "difficulty": "easy|medium|hard",
      "category": "concept|definition|process|relationship",
      "tags": ["tag1", "tag2"]
    }
  ]
}

Make flashcards concise but comprehensive. Front should be clear questions/prompts, back should be detailed answers.`
          },
          {
            role: 'user',
            content: `Mindmap title: ${mindmap.title}\nMindmap content: ${JSON.stringify(mindmap.content)}`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiData = await response.json();
    const flashcardContent = JSON.parse(aiData.choices[0]?.message?.content || '{}');

    // Save flashcards to database
    const flashcardData: InsertFlashcard = {
      mindmap_id: mindmapId,
      user_id: userId,
      cards: flashcardContent
    };

    const { data: flashcards, error: flashcardError } = await supabaseAdmin
      .from('flashcards')
      .insert(flashcardData)
      .select()
      .single();

    if (flashcardError) {
      throw new Error(`Failed to save flashcards: ${flashcardError.message}`);
    }

    res.status(201).json(flashcards);
  } catch (error) {
    console.error('Generate flashcards error:', error);
    res.status(500).json({ error: 'Failed to generate flashcards' });
  }
});

// Get flashcards by ID
router.get('/:id', async (req, res) => {
  try {
    const { data: flashcards, error } = await supabaseAdmin
      .from('flashcards')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user!.id)
      .single();

    if (error || !flashcards) {
      return res.status(404).json({ error: 'Flashcards not found' });
    }

    res.json(flashcards);
  } catch (error) {
    console.error('Get flashcards error:', error);
    res.status(500).json({ error: 'Failed to fetch flashcards' });
  }
});

// Get flashcards for a mindmap
router.get('/mindmap/:mindmapId', async (req, res) => {
  try {
    const { data: flashcards, error } = await supabaseAdmin
      .from('flashcards')
      .select('*')
      .eq('mindmap_id', req.params.mindmapId)
      .eq('user_id', req.user!.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch flashcards: ${error.message}`);
    }

    res.json(flashcards || []);
  } catch (error) {
    console.error('Get mindmap flashcards error:', error);
    res.status(500).json({ error: 'Failed to fetch flashcards' });
  }
});

// Update flashcard study progress
router.post('/:id/study', async (req, res) => {
  try {
    const { cardId, difficulty, correct } = req.body;
    const userId = req.user!.id;

    // Award XP for studying
    const xpAmount = correct ? (difficulty === 'hard' ? 3 : difficulty === 'medium' ? 2 : 1) : 0;
    
    if (xpAmount > 0) {
      await supabaseAdmin
        .from('xp_transactions')
        .insert({
          user_id: userId,
          amount: xpAmount,
          type: 'earned',
          reason: 'Studied flashcard'
        });

      // Update profile XP
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('xp, level')
        .eq('user_id', userId)
        .single();

      if (profile) {
        const newXp = profile.xp + xpAmount;
        const newLevel = Math.floor(newXp / 100) + 1;
        
        await supabaseAdmin
          .from('profiles')
          .update({ 
            xp: newXp, 
            level: newLevel,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
      }
    }

    res.json({ 
      xpAwarded: xpAmount,
      message: correct ? 'Correct! XP awarded.' : 'Keep studying!'
    });
  } catch (error) {
    console.error('Study flashcard error:', error);
    res.status(500).json({ error: 'Failed to record study session' });
  }
});

export default router;