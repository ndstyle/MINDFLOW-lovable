import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { RotateCw, ArrowLeft, ArrowRight, Check, X, Brain, Trophy, Target } from "lucide-react";

interface FlashCard {
  id: string;
  front: string;
  back: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  tags: string[];
}

interface FlashcardSet {
  id: string;
  mindmap_id: string;
  cards: {
    cards: FlashCard[];
  };
  created_at: string;
}

const FlashcardsPage = () => {
  const { flashcardId } = useParams();
  const [, setLocation] = useLocation();
  const [flashcardSet, setFlashcardSet] = useState<FlashcardSet | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [studiedCards, setStudiedCards] = useState<Set<string>>(new Set());
  const [correctCards, setCorrectCards] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [studyMode, setStudyMode] = useState<'study' | 'review'>('study');

  useEffect(() => {
    if (flashcardId) {
      fetchFlashcards();
    }
  }, [flashcardId]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('supabase_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  const fetchFlashcards = async () => {
    try {
      const response = await fetch(`/api/flashcards/${flashcardId}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch flashcards');
      }

      const data = await response.json();
      setFlashcardSet(data);
    } catch (error) {
      console.error('Error fetching flashcards:', error);
      toast.error('Failed to load flashcards');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (correct: boolean) => {
    const currentCard = cards[currentCardIndex];
    setStudiedCards(prev => new Set([...prev, currentCard.id]));
    
    if (correct) {
      setCorrectCards(prev => new Set([...prev, currentCard.id]));
    }

    // Record study session
    try {
      await fetch(`/api/flashcards/${flashcardId}/study`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          cardId: currentCard.id,
          difficulty: currentCard.difficulty,
          correct
        })
      });

      if (correct) {
        toast.success('Correct! XP awarded');
      }
    } catch (error) {
      console.error('Error recording study session:', error);
    }

    // Move to next card
    setTimeout(() => {
      if (currentCardIndex < cards.length - 1) {
        setCurrentCardIndex(prev => prev + 1);
        setFlipped(false);
      } else {
        // End of deck
        toast.success(`Study session complete! ${correctCards.size + (correct ? 1 : 0)}/${cards.length} correct`);
      }
    }, 1000);
  };

  const nextCard = () => {
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
      setFlipped(false);
    }
  };

  const prevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(prev => prev - 1);
      setFlipped(false);
    }
  };

  const resetDeck = () => {
    setCurrentCardIndex(0);
    setFlipped(false);
    setStudiedCards(new Set());
    setCorrectCards(new Set());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <Header />
        <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[500px]">
          <div className="text-white">Loading flashcards...</div>
        </div>
      </div>
    );
  }

  if (!flashcardSet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6 text-center">
              <p>Flashcards not found</p>
              <Button onClick={() => setLocation('/')} className="mt-4">
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const cards = flashcardSet.cards.cards || [];
  const currentCard = cards[currentCardIndex];
  const progress = ((currentCardIndex + 1) / cards.length) * 100;
  const studyProgress = (studiedCards.size / cards.length) * 100;

  if (cards.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6 text-center">
              <p>No flashcards available</p>
              <Button onClick={() => setLocation('/')} className="mt-4">
                Back to Dashboard
              </Button>
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
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-white mb-2">Flashcards Study Session</h1>
            <div className="flex items-center justify-center gap-4 mb-4">
              <Badge variant="outline" className="text-white border-white">
                Card {currentCardIndex + 1} of {cards.length}
              </Badge>
              <Badge variant="outline" className="text-white border-white flex items-center gap-1">
                <Target className="h-3 w-3" />
                {currentCard?.difficulty}
              </Badge>
              <Badge variant="outline" className="text-white border-white flex items-center gap-1">
                <Brain className="h-3 w-3" />
                {currentCard?.category}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-gray-300">
                <span>Deck Progress</span>
                <span>{currentCardIndex + 1}/{cards.length}</span>
              </div>
              <Progress value={progress} className="w-full" />
              <div className="flex items-center justify-between text-sm text-gray-300">
                <span>Study Progress</span>
                <span>{studiedCards.size}/{cards.length} studied</span>
              </div>
              <Progress value={studyProgress} className="w-full bg-green-200" />
            </div>
          </div>

          {/* Flashcard */}
          <div className="mb-8">
            <Card 
              className={`h-96 cursor-pointer transition-all duration-500 transform-gpu ${flipped ? 'scale-105' : ''}`}
              onClick={() => setFlipped(!flipped)}
            >
              <CardContent className="h-full flex items-center justify-center p-8 relative">
                <div className={`transition-opacity duration-300 ${flipped ? 'opacity-0' : 'opacity-100'} absolute inset-0 flex items-center justify-center p-8`}>
                  <div className="text-center">
                    <div className="text-lg font-medium text-gray-600 mb-4">Question</div>
                    <div className="text-xl">{currentCard?.front}</div>
                    <div className="mt-6 text-sm text-gray-500 flex items-center justify-center gap-2">
                      <RotateCw className="h-4 w-4" />
                      Click to reveal answer
                    </div>
                  </div>
                </div>
                
                <div className={`transition-opacity duration-300 ${flipped ? 'opacity-100' : 'opacity-0'} absolute inset-0 flex items-center justify-center p-8 bg-blue-50`}>
                  <div className="text-center">
                    <div className="text-lg font-medium text-blue-600 mb-4">Answer</div>
                    <div className="text-xl">{currentCard?.back}</div>
                    {currentCard?.tags && currentCard.tags.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2 justify-center">
                        {currentCard.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-4">
            {/* Answer buttons (show when flipped) */}
            {flipped && (
              <div className="flex justify-center gap-4">
                <Button
                  onClick={() => handleAnswer(false)}
                  variant="outline"
                  size="lg"
                  className="flex items-center gap-2 border-red-500 text-red-500 hover:bg-red-50"
                >
                  <X className="h-5 w-5" />
                  Incorrect
                </Button>
                <Button
                  onClick={() => handleAnswer(true)}
                  size="lg"
                  className="flex items-center gap-2 bg-green-500 hover:bg-green-600"
                >
                  <Check className="h-5 w-5" />
                  Correct
                </Button>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={prevCard}
                disabled={currentCardIndex === 0}
                className="text-white border-white hover:bg-white hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={resetDeck}
                  className="text-white border-white hover:bg-white hover:text-gray-900"
                >
                  <RotateCw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setLocation('/')}
                  className="text-white border-white hover:bg-white hover:text-gray-900"
                >
                  Finish
                </Button>
              </div>

              <Button
                variant="outline"
                onClick={nextCard}
                disabled={currentCardIndex === cards.length - 1}
                className="text-white border-white hover:bg-white hover:text-gray-900"
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* Study Stats */}
          {studiedCards.size > 0 && (
            <div className="mt-8">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Study Session Stats
                  </h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{studiedCards.size}</div>
                      <div className="text-sm text-gray-600">Cards Studied</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{correctCards.size}</div>
                      <div className="text-sm text-gray-600">Correct</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600">
                        {studiedCards.size > 0 ? Math.round((correctCards.size / studiedCards.size) * 100) : 0}%
                      </div>
                      <div className="text-sm text-gray-600">Accuracy</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FlashcardsPage;