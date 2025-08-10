import React from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  Zap, 
  BookOpen, 
  Users, 
  Target, 
  Trophy, 
  ArrowRight,
  Mic,
  Share2,
  Sparkles
} from 'lucide-react';
import { Header } from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';

export default function Index() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Mind Maps',
      description: 'Transform any text or voice input into beautiful, interactive mind maps using advanced AI',
      color: 'from-purple-600 to-blue-600'
    },
    {
      icon: Target,
      title: 'Smart Quiz Generation',
      description: 'Generate comprehensive quizzes with multiple choice, true/false, and fill-in-the-blank questions',
      color: 'from-blue-600 to-teal-600'
    },
    {
      icon: BookOpen,
      title: 'Interactive Flashcards',
      description: 'Create study flashcards automatically from your mind maps with flip animations and progress tracking',
      color: 'from-teal-600 to-green-600'
    },
    {
      icon: Users,
      title: 'Real-time Collaboration',
      description: 'Share mind maps with read/write permissions and collaborate in real-time',
      color: 'from-green-600 to-yellow-600'
    },
    {
      icon: Trophy,
      title: 'Gamification & XP',
      description: 'Earn XP, level up, and unlock new themes and features as you learn',
      color: 'from-yellow-600 to-red-600'
    },
    {
      icon: Sparkles,
      title: 'AI Chat Assistant',
      description: 'Edit mind maps using natural language commands and get instant feedback',
      color: 'from-red-600 to-purple-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-teal-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900">
      <Header />
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge variant="outline" className="mb-4 bg-white/80 backdrop-blur-sm">
            🧠 AI-Powered Visual Learning Platform
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-teal-600 bg-clip-text text-transparent mb-6">
            Mindflow
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            Transform messy notes into beautiful mind maps, generate AI-powered quizzes and flashcards, 
            and accelerate your learning with gamification
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              size="lg" 
              onClick={() => setLocation(user ? '/create' : '/auth')}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-lg px-8 py-3"
            >
              {user ? 'Create Mind Map' : 'Get Started Free'}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            
            {user && (
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => setLocation('/dashboard')}
                className="bg-white/80 backdrop-blur-sm border-purple-200 hover:bg-white text-lg px-8 py-3"
              >
                <Brain className="mr-2 h-5 w-5" />
                Dashboard
              </Button>
            )}
          </div>

          {/* Demo Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-16">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">1000+</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Mind Maps Created</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">500+</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Quizzes Generated</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-teal-600">2000+</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Flashcards Created</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Powerful Features for Visual Learning
          </h2>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Everything you need to transform your learning experience with AI-powered tools and interactive visualizations
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <Card key={index} className="group hover:shadow-lg transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            How It Works
          </h2>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Get started with Mindflow in just a few simple steps
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center mx-auto mb-4">
              <Mic className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">1. Input Content</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Type or speak your notes, lecture content, or any text you want to visualize
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-teal-600 flex items-center justify-center mx-auto mb-4">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">2. AI Generation</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Our AI creates beautiful, interactive mind maps with smart node connections
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-teal-600 to-green-600 flex items-center justify-center mx-auto mb-4">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">3. Learn & Share</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Generate quizzes, create flashcards, and collaborate with others in real-time
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <Card className="max-w-4xl mx-auto bg-gradient-to-r from-purple-600 to-blue-600 border-0 text-white">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Transform Your Learning?
            </h2>
            <p className="text-xl mb-8 text-purple-100">
              Join thousands of students and professionals using Mindflow to accelerate their learning
            </p>
            <Button 
              size="lg"
              onClick={() => setLocation(user ? '/create' : '/auth')}
              className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-8 py-3"
            >
              {user ? 'Start Creating' : 'Sign Up Free'}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}