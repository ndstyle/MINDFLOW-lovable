import OpenAI from 'openai';
import { supabase } from '../../lib/supabase';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
});

export class QuizGenerator {
  async generateQuiz(documentId: string, nodes: any[]) {
    try {
      // Create quiz questions from nodes
      const questions = [];
      
      for (const node of nodes.slice(0, 5)) { // Limit to 5 questions
        const prompt = `
          Create a multiple choice question about this topic:
          Title: ${node.title}
          Content: ${node.summary}
          
          Format as JSON:
          {
            "question": "Clear, specific question about the topic",
            "correct_answer": "The correct answer",
            "distractors": ["Wrong answer 1", "Wrong answer 2", "Wrong answer 3"],
            "evidence_anchor": "Brief explanation of why this answer is correct"
          }
        `;

        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are an expert educator creating high-quality quiz questions for effective learning assessment."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: 500,
          temperature: 0.8
        });

        const result = response.choices[0].message.content;
        if (!result) continue;

        try {
          const questionData = JSON.parse(result);
          questions.push({
            node_id: node.id,
            type: 'mcq' as const,
            question: questionData.question,
            correct_answer: questionData.correct_answer,
            distractors: questionData.distractors,
            evidence_anchor: questionData.evidence_anchor,
            metadata: { ai_generated: true }
          });
        } catch (parseError) {
          console.error('Failed to parse question:', result);
          continue;
        }
      }

      // Save questions to database
      if (questions.length > 0) {
        const { data: savedQuestions, error: questionError } = await supabase
          .from('questions')
          .insert(questions)
          .select();

        if (questionError) {
          console.error('Error saving questions:', questionError);
          throw new Error('Failed to save quiz questions');
        }

        return savedQuestions || [];
      }

      return [];

    } catch (error) {
      console.error('Quiz generation error:', error);
      throw error;
    }
  }

  async getQuizForDocument(documentId: string) {
    try {
      // Get all nodes for this document
      const { data: nodes, error: nodeError } = await supabase
        .from('nodes')
        .select('*')
        .eq('document_id', documentId);

      if (nodeError || !nodes) {
        throw new Error('Failed to fetch document nodes');
      }

      // Get questions for these nodes
      const nodeIds = nodes.map(node => node.id);
      
      const { data: questions, error: questionError } = await supabase
        .from('questions')
        .select('*')
        .in('node_id', nodeIds);

      if (questionError) {
        throw new Error('Failed to fetch quiz questions');
      }

      return {
        questions: questions || [],
        totalQuestions: questions?.length || 0
      };

    } catch (error) {
      console.error('Get quiz error:', error);
      throw error;
    }
  }

  async submitQuizAnswer(questionId: string, userAnswer: string, userId: string) {
    try {
      // Get the question to check the answer
      const { data: question, error: questionError } = await supabase
        .from('questions')
        .select('*')
        .eq('id', questionId)
        .single();

      if (questionError || !question) {
        throw new Error('Question not found');
      }

      // Check if answer is correct
      const isCorrect = userAnswer.toLowerCase().trim() === question.correct_answer.toLowerCase().trim();

      // Save the attempt (you'd need to create a quiz_attempts table)
      const attemptData = {
        user_id: userId,
        question_id: questionId,
        user_answer: userAnswer,
        is_correct: isCorrect,
        attempted_at: new Date().toISOString()
      };

      // For now, just return the result
      return {
        isCorrect,
        correctAnswer: question.correct_answer,
        evidenceAnchor: question.evidence_anchor,
        explanation: isCorrect ? 
          'Correct! ' + question.evidence_anchor : 
          `Incorrect. The correct answer is: ${question.correct_answer}. ${question.evidence_anchor}`
      };

    } catch (error) {
      console.error('Submit quiz answer error:', error);
      throw error;
    }
  }
}

export const quizGenerator = new QuizGenerator();