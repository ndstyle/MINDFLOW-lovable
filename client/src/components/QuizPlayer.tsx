import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, RotateCcw, ArrowRight, Brain, Trophy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Question {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

interface QuizPlayerProps {
  questions: Question[];
  documentId: string;
}

export function QuizPlayer({ questions, documentId }: QuizPlayerProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (questions.length > 0) {
      setAnswers(new Array(questions.length).fill(null));
    }
  }, [questions.length]);

  const handleAnswerSelect = (answerIndex: number) => {
    if (showAnswer) return;
    setSelectedAnswer(answerIndex);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;

    const newAnswers = [...answers];
    newAnswers[currentQuestion] = selectedAnswer;
    setAnswers(newAnswers);

    const isCorrect = selectedAnswer === questions[currentQuestion].correct_answer;
    if (isCorrect && answers[currentQuestion] === null) {
      setScore(prev => prev + 1);
    }

    setShowAnswer(true);

    if (isCorrect) {
      toast({
        title: "Correct!",
        description: "Well done, that's the right answer.",
      });
    } else {
      toast({
        title: "Incorrect",
        description: "Don't worry, you'll get the next one!",
        variant: "destructive"
      });
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer(answers[currentQuestion + 1]);
      setShowAnswer(answers[currentQuestion + 1] !== null);
    } else {
      setQuizCompleted(true);
      toast({
        title: "Quiz completed!",
        description: `You scored ${score} out of ${questions.length} questions.`,
      });
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
      setSelectedAnswer(answers[currentQuestion - 1]);
      setShowAnswer(answers[currentQuestion - 1] !== null);
    }
  };

  const handleRestartQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowAnswer(false);
    setScore(0);
    setAnswers(new Array(questions.length).fill(null));
    setQuizCompleted(false);
  };

  const getScorePercentage = () => {
    return Math.round((score / questions.length) * 100);
  };

  const getScoreColor = () => {
    const percentage = getScorePercentage();
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Brain className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2 lowercase">no quiz available</h3>
          <p className="text-muted-foreground lowercase">
            quiz questions will appear here once they're generated from your document
          </p>
        </CardContent>
      </Card>
    );
  }

  if (quizCompleted) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2 lowercase">quiz completed!</h3>
          <div className={`text-3xl font-bold mb-4 ${getScoreColor()}`}>
            {score}/{questions.length} ({getScorePercentage()}%)
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-md mx-auto mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{score}</div>
              <div className="text-sm text-muted-foreground lowercase">correct</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{questions.length - score}</div>
              <div className="text-sm text-muted-foreground lowercase">incorrect</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{getScorePercentage()}%</div>
              <div className="text-sm text-muted-foreground lowercase">score</div>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <Button onClick={handleRestartQuiz} variant="outline" className="lowercase">
              <RotateCcw className="w-4 h-4 mr-2" />
              retake quiz
            </Button>
            <Button onClick={() => setCurrentQuestion(0)} className="lowercase">
              <Brain className="w-4 h-4 mr-2" />
              review answers
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const question = questions[currentQuestion];
  const isAnswered = answers[currentQuestion] !== null;
  const currentAnswer = answers[currentQuestion];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <CardTitle className="text-lg lowercase">
              question {currentQuestion + 1} of {questions.length}
            </CardTitle>
            {question.difficulty && (
              <Badge className={getDifficultyColor(question.difficulty)}>
                {question.difficulty}
              </Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            Score: {score}/{questions.length}
          </div>
        </div>
        <Progress value={(currentQuestion / questions.length) * 100} className="w-full" />
      </CardHeader>

      <CardContent className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold mb-4">{question.question}</h3>
          
          <div className="space-y-3">
            {question.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrect = index === question.correct_answer;
              const wasSelected = currentAnswer === index;
              
              let buttonVariant: "default" | "outline" | "secondary" = "outline";
              let buttonClass = "";
              
              if (showAnswer) {
                if (isCorrect) {
                  buttonClass = "border-green-500 bg-green-50 text-green-700";
                } else if (wasSelected && !isCorrect) {
                  buttonClass = "border-red-500 bg-red-50 text-red-700";
                }
              } else if (isSelected) {
                buttonVariant = "default";
              }

              return (
                <Button
                  key={index}
                  variant={buttonVariant}
                  className={`w-full text-left justify-start h-auto p-4 ${buttonClass}`}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={showAnswer}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold">
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span className="flex-1">{option}</span>
                    {showAnswer && isCorrect && (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    )}
                    {showAnswer && wasSelected && !isCorrect && (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                </Button>
              );
            })}
          </div>
        </div>

        {showAnswer && question.explanation && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2 lowercase">explanation</h4>
            <p className="text-blue-800">{question.explanation}</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            onClick={handlePreviousQuestion}
            variant="outline"
            disabled={currentQuestion === 0}
            className="lowercase"
          >
            previous
          </Button>

          <div className="flex gap-2">
            {!showAnswer ? (
              <Button
                onClick={handleSubmitAnswer}
                disabled={selectedAnswer === null}
                className="lowercase"
              >
                submit answer
              </Button>
            ) : (
              <Button onClick={handleNextQuestion} className="lowercase">
                {currentQuestion === questions.length - 1 ? 'finish quiz' : 'next question'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}