import { supabase } from '../../lib/supabase';
import type { Node, Question, QuestionInsert } from '../../shared/schema';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
});

export class QuizGenerator {
  async generateQuestionsForNode(nodeId: string): Promise<Question[]> {
    // Get node and related nodes for context
    const { data: node, error: nodeError } = await supabase
      .from('nodes')
      .select('*')
      .eq('id', nodeId)
      .single();

    if (nodeError || !node) {
      throw new Error('Node not found');
    }

    // Get sibling and related nodes for distractor generation
    const { data: relatedNodes } = await supabase
      .from('nodes')
      .select('*')
      .eq('document_id', node.document_id)
      .neq('id', nodeId)
      .limit(10);

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert quiz creator. Generate 3-5 high-quality multiple choice questions based on the given node content.

            Requirements:
            1. Each question must have exactly 4 options (1 correct, 3 distractors)
            2. Distractors should be plausible but clearly wrong
            3. Include an evidence anchor (direct quote supporting the answer)
            4. Questions should test understanding, not just memorization
            5. Avoid ambiguous or trick questions
            6. No "all of the above" or "none of the above" options

            Return JSON format:
            {
              "questions": [
                {
                  "question": "Clear, specific question?",
                  "correct_answer": "Correct option",
                  "distractors": ["Wrong option 1", "Wrong option 2", "Wrong option 3"],
                  "evidence_anchor": "Direct quote from content that supports the answer"
                }
              ]
            }`
          },
          {
            role: 'user',
            content: `Node Title: ${node.title}
            Node Summary: ${node.summary}
            Evidence: ${node.metadata?.evidence || ''}
            
            Related concepts for distractors: ${relatedNodes?.map(n => n.title).join(', ')}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      });

      const quizData = JSON.parse(response.choices[0].message.content || '{"questions": []}');
      
      // Validate and insert questions
      const questionsToInsert: QuestionInsert[] = [];
      
      for (const q of quizData.questions) {
        // Validate question structure
        if (!q.question || !q.correct_answer || !Array.isArray(q.distractors) || 
            q.distractors.length !== 3 || !q.evidence_anchor) {
          console.warn('Invalid question structure:', q);
          continue;
        }

        // Check for duplicate content
        const isDuplicate = await this.checkDuplicateQuestion(nodeId, q.question);
        if (isDuplicate) {
          continue;
        }

        questionsToInsert.push({
          node_id: nodeId,
          type: 'mcq',
          question: q.question,
          correct_answer: q.correct_answer,
          distractors: q.distractors,
          evidence_anchor: q.evidence_anchor,
          metadata: { 
            generated_at: new Date().toISOString(),
            source_node_title: node.title 
          }
        });
      }

      if (questionsToInsert.length === 0) {
        throw new Error('No valid questions generated');
      }

      // Insert questions
      const { data: insertedQuestions, error } = await supabase
        .from('questions')
        .insert(questionsToInsert)
        .select();

      if (error) {
        throw new Error('Failed to save questions to database');
      }

      return insertedQuestions;

    } catch (error) {
      console.error('Error generating questions:', error);
      
      // Create fallback questions
      return this.createFallbackQuestions(node);
    }
  }

  private async checkDuplicateQuestion(nodeId: string, questionText: string): Promise<boolean> {
    const { data: existingQuestions } = await supabase
      .from('questions')
      .select('question')
      .eq('node_id', nodeId);

    if (!existingQuestions) return false;

    // Simple duplicate check - could be enhanced with semantic similarity
    return existingQuestions.some(q => 
      this.calculateSimilarity(q.question.toLowerCase(), questionText.toLowerCase()) > 0.8
    );
  }

  private calculateSimilarity(str1: string, str2: string): number {
    // Simple Jaccard similarity
    const set1 = new Set(str1.split(' '));
    const set2 = new Set(str2.split(' '));
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  private async createFallbackQuestions(node: Node): Promise<Question[]> {
    // Create basic questions when AI generation fails
    const fallbackQuestion: QuestionInsert = {
      node_id: node.id,
      type: 'mcq',
      question: `What is the main concept related to "${node.title}"?`,
      correct_answer: node.title,
      distractors: ['Option A', 'Option B', 'Option C'],
      evidence_anchor: node.summary || node.title,
      metadata: { fallback: true }
    };

    const { data: insertedQuestion, error } = await supabase
      .from('questions')
      .insert(fallbackQuestion)
      .select()
      .single();

    if (error) {
      throw new Error('Failed to create fallback question');
    }

    return [insertedQuestion];
  }

  async getQuestionsForNode(nodeId: string): Promise<Question[]> {
    const { data: questions, error } = await supabase
      .from('questions')
      .select('*')
      .eq('node_id', nodeId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error('Failed to fetch questions');
    }

    return questions || [];
  }

  async submitAnswer(questionId: string, userId: string, answer: string, timeSpent?: number, sessionId?: string): Promise<{ correct: boolean; explanation: string }> {
    // Get question details
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('*')
      .eq('id', questionId)
      .single();

    if (questionError || !question) {
      throw new Error('Question not found');
    }

    // Check if answer is correct
    const isCorrect = answer.toLowerCase().trim() === question.correct_answer.toLowerCase().trim();

    // Record attempt
    const attemptData = {
      question_id: questionId,
      user_id: userId,
      answer,
      is_correct: isCorrect,
      time_spent: timeSpent,
      session_id: sessionId
    };

    const { error: attemptError } = await supabase
      .from('attempts')
      .insert(attemptData);

    if (attemptError) {
      console.error('Error recording attempt:', attemptError);
    }

    // Update mastery score for the node
    await this.updateMasteryScore(question.node_id, userId, isCorrect);

    return {
      correct: isCorrect,
      explanation: isCorrect 
        ? `Correct! ${question.evidence_anchor}` 
        : `Incorrect. The correct answer is "${question.correct_answer}". ${question.evidence_anchor}`
    };
  }

  private async updateMasteryScore(nodeId: string, userId: string, wasCorrect: boolean) {
    // Get or create review record
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('*')
      .eq('node_id', nodeId)
      .eq('user_id', userId)
      .single();

    const scoreChange = wasCorrect ? 15 : -10; // +15 for correct, -10 for incorrect
    const currentScore = existingReview?.mastery_score || 0;
    const newScore = Math.max(0, Math.min(100, currentScore + scoreChange));

    // Calculate next review interval based on performance
    const baseInterval = 1; // 1 day
    const multiplier = Math.floor(newScore / 20); // 0-5 based on mastery
    const nextInterval = Math.max(1, baseInterval * Math.pow(2, multiplier));
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + nextInterval);

    if (existingReview) {
      // Update existing review
      await supabase
        .from('reviews')
        .update({
          mastery_score: newScore,
          next_review_date: nextReviewDate.toISOString(),
          review_interval: nextInterval,
          last_reviewed: new Date().toISOString()
        })
        .eq('id', existingReview.id);
    } else {
      // Create new review
      await supabase
        .from('reviews')
        .insert({
          node_id: nodeId,
          user_id: userId,
          mastery_score: newScore,
          next_review_date: nextReviewDate.toISOString(),
          review_interval: nextInterval,
          last_reviewed: new Date().toISOString()
        });
    }
  }
}

export const quizGenerator = new QuizGenerator();