import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Question } from '../../../shared/schema';

interface QuizPlayerProps {
  questions: Question[];
  onComplete?: (score: number) => void;
}

interface QuizState {
  currentQuestion: number;
  answers: { [questionId: string]: string };
  results: { [questionId: string]: { correct: boolean; explanation: string } };
  startTime: number;
  questionStartTime: number;
}

export function QuizPlayer({ questions, onComplete }: QuizPlayerProps) {
  const [quizState, setQuizState] = useState<QuizState>({
    currentQuestion: 0,
    answers: {},
    results: {},
    startTime: Date.now(),
    questionStartTime: Date.now()
  });

  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showResult, setShowResult] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const submitAnswerMutation = useMutation({
    mutationFn: async ({ questionId, answer, timeSpent }: { 
      questionId: string; 
      answer: string; 
      timeSpent: number; 
    }) => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch('/api/quiz/answer', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          questionId,
          answer,
          timeSpent,
          sessionId: `quiz_${Date.now()}`
        })
      });

      if (!response.ok) throw new Error('Failed to submit answer');
      return response.json();
    },
    onSuccess: (result) => {
      setQuizState(prev => ({
        ...prev,
        results: { ...prev.results, [currentQuestion.id]: result }
      }));
      setShowResult(true);
    },
    onError: () => {
      toast.error('Failed to submit answer');
    }
  });

  const currentQuestion = questions[quizState.currentQuestion];
  const isLastQuestion = quizState.currentQuestion === questions.length - 1;

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleSubmitAnswer = () => {
    if (!selectedAnswer) {
      toast.error('Please select an answer');
      return;
    }

    const timeSpent = Date.now() - quizState.questionStartTime;
    
    setQuizState(prev => ({
      ...prev,
      answers: { ...prev.answers, [currentQuestion.id]: selectedAnswer }
    }));

    submitAnswerMutation.mutate({
      questionId: currentQuestion.id,
      answer: selectedAnswer,
      timeSpent
    });
  };

  const handleNextQuestion = () => {
    if (isLastQuestion) {
      // Quiz complete
      setIsComplete(true);
      const correctCount = Object.values(quizState.results).filter(r => r.correct).length;
      const score = Math.round((correctCount / questions.length) * 100);
      onComplete?.(score);
    } else {
      // Next question
      setQuizState(prev => ({
        ...prev,
        currentQuestion: prev.currentQuestion + 1,
        questionStartTime: Date.now()
      }));
      setSelectedAnswer('');
      setShowResult(false);
    }
  };

  const getOptionsForQuestion = (question: Question): string[] => {
    const options = [question.correct_answer, ...question.distractors];
    // Shuffle options
    return options.sort(() => Math.random() - 0.5);
  };

  const getResultSummary = () => {
    const correctCount = Object.values(quizState.results).filter(r => r.correct).length;
    const totalTime = Math.round((Date.now() - quizState.startTime) / 1000);
    return {
      score: Math.round((correctCount / questions.length) * 100),
      correct: correctCount,
      total: questions.length,
      timeSpent: totalTime
    };
  };

  if (isComplete) {
    const summary = getResultSummary();
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-center lowercase">quiz complete!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">
              {summary.score}%
            </div>
            <p className="text-muted-foreground lowercase">
              {summary.correct} out of {summary.total} questions correct
            </p>
            <p className="text-sm text-muted-foreground lowercase">
              completed in {Math.floor(summary.timeSpent / 60)}:{(summary.timeSpent % 60).toString().padStart(2, '0')}
            </p>
          </div>

          <div className="space-y-3">
            {questions.map((question, index) => {
              const result = quizState.results[question.id];
              const userAnswer = quizState.answers[question.id];
              
              return (
                <div key={question.id} className="p-3 border rounded-lg">
                  <div className="flex items-start gap-2">
                    {result?.correct ? (
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{question.question}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Your answer: {userAnswer}
                      </p>
                      {!result?.correct && (
                        <p className="text-xs text-green-600 mt-1">
                          Correct: {question.correct_answer}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentQuestion) {
    return <div>No questions available</div>;
  }

  const options = getOptionsForQuestion(currentQuestion);
  const result = quizState.results[currentQuestion.id];
  const progress = ((quizState.currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="lowercase">question {quizState.currentQuestion + 1} of {questions.length}</span>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{Math.floor((Date.now() - quizState.questionStartTime) / 1000)}s</span>
          </div>
        </div>
        <Progress value={progress} className="w-full" />
      </div>

      {/* Question */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg lowercase">{currentQuestion.question}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Answer Options */}
          <div className="space-y-2">
            {options.map((option, index) => (
              <button
                key={index}
                onClick={() => !showResult && handleAnswerSelect(option)}
                disabled={showResult || submitAnswerMutation.isPending}
                className={`w-full p-3 text-left border rounded-lg transition-colors ${
                  selectedAnswer === option
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted/50'
                } ${showResult ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    selectedAnswer === option
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-muted-foreground'
                  }`}>
                    {selectedAnswer === option && (
                      <div className="w-2 h-2 rounded-full bg-current" />
                    )}
                  </div>
                  <span className="text-sm">{option}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Result Display */}
          {showResult && result && (
            <div className={`p-4 rounded-lg ${
              result.correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            } border`}>
              <div className="flex items-start gap-2">
                {result.correct ? (
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                )}
                <div>
                  <p className={`font-medium ${
                    result.correct ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {result.correct ? 'Correct!' : 'Incorrect'}
                  </p>
                  <p className={`text-sm mt-1 ${
                    result.correct ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {result.explanation}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {!showResult ? (
              <Button 
                onClick={handleSubmitAnswer}
                disabled={!selectedAnswer || submitAnswerMutation.isPending}
                className="lowercase"
              >
                {submitAnswerMutation.isPending ? 'submitting...' : 'submit answer'}
              </Button>
            ) : (
              <Button onClick={handleNextQuestion} className="lowercase">
                {isLastQuestion ? 'finish quiz' : 'next question'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}