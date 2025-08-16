import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, RotateCcw, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface Question {
  id: string;
  question: string;
  correct_answer: string;
  distractors: string[];
  evidence_anchor: string;
  type: 'mcq' | 'cloze' | 'short_answer';
}

interface QuizPlayerProps {
  questions: Question[];
  documentId: string;
  onComplete?: () => void;
}

export function QuizPlayer({ questions, documentId, onComplete }: QuizPlayerProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showResult, setShowResult] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<{ questionId: string; correct: boolean; userAnswer: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const currentQuestion = questions[currentQuestionIndex];
  
  // Shuffle answers for multiple choice
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  
  useEffect(() => {
    if (currentQuestion && currentQuestion.type === 'mcq') {
      const options = [currentQuestion.correct_answer, ...currentQuestion.distractors];
      setShuffledOptions(options.sort(() => Math.random() - 0.5));
    }
  }, [currentQuestion]);

  const handleAnswerSubmit = async () => {
    if (!selectedAnswer.trim()) {
      toast({
        title: "Please select an answer",
        description: "Choose an answer before submitting.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/quiz/${currentQuestion.id}/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ answer: selectedAnswer })
      });

      if (!response.ok) {
        throw new Error('Failed to submit answer');
      }

      const result = await response.json();
      
      // Update score and answers
      if (result.isCorrect) {
        setScore(prev => prev + 1);
      }

      setAnswers(prev => [...prev, {
        questionId: currentQuestion.id,
        correct: result.isCorrect,
        userAnswer: selectedAnswer
      }]);

      setShowResult(true);

      // Show feedback toast
      toast({
        title: result.isCorrect ? "Correct!" : "Incorrect",
        description: result.explanation,
        variant: result.isCorrect ? "default" : "destructive"
      });

    } catch (error) {
      console.error('Submit answer error:', error);
      toast({
        title: "Error submitting answer",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer('');
      setShowResult(false);
    } else {
      setQuizComplete(true);
      onComplete?.();
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer('');
    setShowResult(false);
    setQuizComplete(false);
    setScore(0);
    setAnswers([]);
  };

  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Play className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2 lowercase">no quiz available</h3>
          <p className="text-muted-foreground lowercase">
            quiz questions are being generated for this document
          </p>
        </CardContent>
      </Card>
    );
  }

  if (quizComplete) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-center lowercase">quiz complete!</CardTitle>
          <CardDescription className="text-center lowercase">
            you scored {score} out of {questions.length} questions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-3xl font-bold mb-2">{percentage}%</div>
            <Progress value={percentage} className="w-full" />
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold lowercase">results breakdown:</h4>
            {answers.map((answer, index) => (
              <div key={answer.questionId} className="flex items-center justify-between p-2 rounded bg-muted/50">
                <span className="text-sm">question {index + 1}</span>
                <div className="flex items-center gap-2">
                  {answer.correct ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                  <Badge variant={answer.correct ? "default" : "destructive"}>
                    {answer.correct ? 'correct' : 'incorrect'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-4 justify-center">
            <Button onClick={handleRestart} variant="outline" className="lowercase">
              <RotateCcw className="w-4 h-4 mr-2" />
              try again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="lowercase">question {currentQuestionIndex + 1} of {questions.length}</CardTitle>
          <Badge variant="outline">{Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%</Badge>
        </div>
        <Progress value={((currentQuestionIndex + 1) / questions.length) * 100} className="w-full" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">{currentQuestion.question}</h3>
          
          {currentQuestion.type === 'mcq' && (
            <div className="space-y-3">
              {shuffledOptions.map((option, index) => (
                <div
                  key={index}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedAnswer === option 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => !showResult && setSelectedAnswer(option)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      selectedAnswer === option 
                        ? 'border-primary bg-primary' 
                        : 'border-muted-foreground'
                    }`} />
                    <span>{option}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showResult && (
          <div className={`p-4 rounded-lg ${
            answers[answers.length - 1]?.correct 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {answers[answers.length - 1]?.correct ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <span className="font-semibold">
                {answers[answers.length - 1]?.correct ? 'Correct!' : 'Incorrect'}
              </span>
            </div>
            <p className="text-sm">{currentQuestion.evidence_anchor}</p>
            {!answers[answers.length - 1]?.correct && (
              <p className="text-sm mt-2">
                <strong>correct answer:</strong> {currentQuestion.correct_answer}
              </p>
            )}
          </div>
        )}

        <div className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            score: {score}/{questions.length}
          </div>
          <div className="flex gap-2">
            {!showResult ? (
              <Button 
                onClick={handleAnswerSubmit} 
                disabled={!selectedAnswer.trim() || isSubmitting}
                className="lowercase"
              >
                {isSubmitting ? 'submitting...' : 'submit answer'}
              </Button>
            ) : (
              <Button onClick={handleNext} className="lowercase">
                {currentQuestionIndex < questions.length - 1 ? 'next question' : 'finish quiz'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}