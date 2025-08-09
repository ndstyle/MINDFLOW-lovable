import express from 'express';
import { supabaseAdmin } from '../supabase';
import type { InsertQuiz, Quiz } from '@shared/supabase-types';

const router = express.Router();

// Generate quiz from mindmap
router.post('/generate', async (req, res) => {
  try {
    const { mindmapId, questionCount = 10, difficulty = 'medium' } = req.body;
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

    // Generate quiz using OpenAI
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
            content: `You are an expert quiz generator. Create a comprehensive quiz from the provided mindmap content.

Generate ${questionCount} questions with ${difficulty} difficulty level. Include these question types:
- Multiple choice (single answer)
- Multiple choice (multiple answers) 
- True/False
- Fill in the blank
- Matching pairs

Return a JSON object with this structure:
{
  "questions": [
    {
      "id": "q1",
      "type": "multiple_choice_single|multiple_choice_multiple|true_false|fill_blank|matching",
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"], // for multiple choice
      "correct_answers": ["correct_option_text"], // array even for single answer
      "explanation": "Why this is correct",
      "difficulty": "easy|medium|hard",
      "points": 10
    }
  ]
}

Focus on key concepts, definitions, and relationships from the mindmap.`
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
    const quizContent = JSON.parse(aiData.choices[0]?.message?.content || '{}');

    // Save quiz to database
    const quizData: InsertQuiz = {
      mindmap_id: mindmapId,
      user_id: userId,
      questions: quizContent
    };

    const { data: quiz, error: quizError } = await supabaseAdmin
      .from('quizzes')
      .insert(quizData)
      .select()
      .single();

    if (quizError) {
      throw new Error(`Failed to save quiz: ${quizError.message}`);
    }

    res.status(201).json(quiz);
  } catch (error) {
    console.error('Generate quiz error:', error);
    res.status(500).json({ error: 'Failed to generate quiz' });
  }
});

// Get quiz by ID
router.get('/:id', async (req, res) => {
  try {
    const { data: quiz, error } = await supabaseAdmin
      .from('quizzes')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user!.id)
      .single();

    if (error || !quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    res.json(quiz);
  } catch (error) {
    console.error('Get quiz error:', error);
    res.status(500).json({ error: 'Failed to fetch quiz' });
  }
});

// Get quizzes for a mindmap
router.get('/mindmap/:mindmapId', async (req, res) => {
  try {
    const { data: quizzes, error } = await supabaseAdmin
      .from('quizzes')
      .select('*')
      .eq('mindmap_id', req.params.mindmapId)
      .eq('user_id', req.user!.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch quizzes: ${error.message}`);
    }

    res.json(quizzes || []);
  } catch (error) {
    console.error('Get mindmap quizzes error:', error);
    res.status(500).json({ error: 'Failed to fetch quizzes' });
  }
});

// Submit quiz attempt
router.post('/:id/submit', async (req, res) => {
  try {
    const { answers, timeSpent } = req.body;
    const userId = req.user!.id;

    // Get quiz
    const { data: quiz, error: quizError } = await supabaseAdmin
      .from('quizzes')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', userId)
      .single();

    if (quizError || !quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Grade the quiz
    const questions = quiz.questions.questions || [];
    let totalPoints = 0;
    let earnedPoints = 0;
    const results = [];

    for (const question of questions) {
      totalPoints += question.points || 10;
      const userAnswers = answers[question.id] || [];
      const correctAnswers = question.correct_answers || [];
      
      // Check if answer is correct
      const isCorrect = Array.isArray(userAnswers) 
        ? userAnswers.length === correctAnswers.length && 
          userAnswers.every(answer => correctAnswers.includes(answer))
        : correctAnswers.includes(userAnswers);

      if (isCorrect) {
        earnedPoints += question.points || 10;
      }

      results.push({
        questionId: question.id,
        userAnswers,
        correctAnswers,
        isCorrect,
        explanation: question.explanation
      });
    }

    const score = Math.round((earnedPoints / totalPoints) * 100);
    const xpAwarded = Math.round(earnedPoints / 10); // 1 XP per 10 points

    // Award XP
    if (xpAwarded > 0) {
      await supabaseAdmin
        .from('xp_transactions')
        .insert({
          user_id: userId,
          amount: xpAwarded,
          type: 'earned',
          reason: `Completed quiz: ${score}% score`,
          mindmap_id: quiz.mindmap_id
        });

      // Update profile XP
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('xp, level')
        .eq('user_id', userId)
        .single();

      if (profile) {
        const newXp = profile.xp + xpAwarded;
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
      score,
      earnedPoints,
      totalPoints,
      xpAwarded,
      timeSpent,
      results
    });
  } catch (error) {
    console.error('Submit quiz error:', error);
    res.status(500).json({ error: 'Failed to submit quiz' });
  }
});

export default router;