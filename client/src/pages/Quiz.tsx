import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { CheckCircle, XCircle, Clock, Target, Trophy, ArrowLeft, ArrowRight } from "lucide-react";

interface Question {
  id: string;
  type: 'multiple_choice_single' | 'multiple_choice_multiple' | 'true_false' | 'fill_blank' | 'matching';
  question: string;
  options?: string[];
  correct_answers: string[];
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
}

interface Quiz {
  id: string;
  mindmap_id: string;
  questions: {
    questions: Question[];
  };
  created_at: string;
}

const QuizPage = () => {
  const { quizId } = useParams();
  const [, setLocation] = useLocation();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const [startTime] = useState(Date.now());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (quizId) {
      fetchQuiz();
    }
  }, [quizId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('supabase_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  const fetchQuiz = async () => {
    try {
      const response = await fetch(`/api/quiz/${quizId}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch quiz');
      }

      const data = await response.json();
      setQuiz(data);
    } catch (error) {
      console.error('Error fetching quiz:', error);
      toast.error('Failed to load quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const submitQuiz = async () => {
    try {
      const response = await fetch(`/api/quiz/${quizId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          answers,
          timeSpent
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit quiz');
      }

      const data = await response.json();
      setResults(data);
      setShowResults(true);
      toast.success(`Quiz completed! Score: ${data.score}%`);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast.error('Failed to submit quiz');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <Header />
        <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[500px]">
          <div className="text-white">Loading quiz...</div>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6 text-center">
              <p>Quiz not found</p>
              <Button onClick={() => setLocation('/')} className="mt-4">
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const questions = quiz.questions.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  if (showResults && results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-4xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                <Trophy className="h-8 w-8 text-yellow-500" />
                Quiz Complete!
              </CardTitle>
              <CardDescription>
                Here are your results
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{results.score}%</div>
                  <div className="text-sm text-gray-600">Final Score</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{results.earnedPoints}</div>
                  <div className="text-sm text-gray-600">Points Earned</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{results.xpAwarded}</div>
                  <div className="text-sm text-gray-600">XP Awarded</div>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{formatTime(results.timeSpent)}</div>
                  <div className="text-sm text-gray-600">Time Spent</div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Question Review</h3>
                {results.results.map((result: any, index: number) => {
                  const question = questions.find(q => q.id === result.questionId);
                  if (!question) return null;

                  return (
                    <Card key={result.questionId} className={`border-l-4 ${result.isCorrect ? 'border-l-green-500' : 'border-l-red-500'}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          {result.isCorrect ? (
                            <CheckCircle className="h-5 w-5 text-green-500 mt-1" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500 mt-1" />
                          )}
                          <div className="flex-1">
                            <p className="font-medium">{question.question}</p>
                            <div className="mt-2 text-sm text-gray-600">
                              <p><strong>Your answer:</strong> {Array.isArray(result.userAnswers) ? result.userAnswers.join(', ') : result.userAnswers}</p>
                              <p><strong>Correct answer:</strong> {result.correctAnswers.join(', ')}</p>
                              {result.explanation && (
                                <p className="mt-1 text-blue-600"><strong>Explanation:</strong> {result.explanation}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="flex justify-center">
                <Button onClick={() => setLocation('/')} size="lg">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Quiz in Progress</CardTitle>
                <CardDescription>
                  Question {currentQuestionIndex + 1} of {questions.length}
                </CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTime(timeSpent)}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  {currentQuestion?.difficulty}
                </Badge>
              </div>
            </div>
            <Progress value={progress} className="w-full" />
          </CardHeader>
          
          <CardContent className="space-y-6">
            {currentQuestion && (
              <div>
                <h2 className="text-xl font-semibold mb-4">{currentQuestion.question}</h2>
                
                {currentQuestion.type === 'multiple_choice_single' && (
                  <RadioGroup
                    value={answers[currentQuestion.id] || ''}
                    onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                  >
                    {currentQuestion.options?.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <RadioGroupItem value={option} id={`option-${index}`} />
                        <Label htmlFor={`option-${index}`}>{option}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {currentQuestion.type === 'multiple_choice_multiple' && (
                  <div className="space-y-2">
                    {currentQuestion.options?.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Checkbox
                          id={`option-${index}`}
                          checked={(answers[currentQuestion.id] || []).includes(option)}
                          onCheckedChange={(checked) => {
                            const currentAnswers = answers[currentQuestion.id] || [];
                            if (checked) {
                              handleAnswerChange(currentQuestion.id, [...currentAnswers, option]);
                            } else {
                              handleAnswerChange(currentQuestion.id, currentAnswers.filter((a: string) => a !== option));
                            }
                          }}
                        />
                        <Label htmlFor={`option-${index}`}>{option}</Label>
                      </div>
                    ))}
                  </div>
                )}

                {currentQuestion.type === 'true_false' && (
                  <RadioGroup
                    value={answers[currentQuestion.id] || ''}
                    onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="True" id="true" />
                      <Label htmlFor="true">True</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="False" id="false" />
                      <Label htmlFor="false">False</Label>
                    </div>
                  </RadioGroup>
                )}

                {currentQuestion.type === 'fill_blank' && (
                  <Input
                    value={answers[currentQuestion.id] || ''}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                    placeholder="Type your answer here..."
                    className="max-w-md"
                  />
                )}

                <div className="flex justify-between mt-8">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentQuestionIndex === 0}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  
                  {currentQuestionIndex === questions.length - 1 ? (
                    <Button onClick={submitQuiz} size="lg">
                      Submit Quiz
                      <Trophy className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                    >
                      Next
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QuizPage;