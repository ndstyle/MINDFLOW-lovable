import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, FileText, Lightbulb, Code, Users, Target } from "lucide-react";

interface ContextQuestionsProps {
  onContextSelect: (context: string) => void;
  isVisible: boolean;
}

const categories = [
  {
    id: "class-notes",
    title: "notes for a class",
    icon: FileText,
    description: "organize lecture content and study materials"
  },
  {
    id: "project-idea", 
    title: "project idea",
    icon: Lightbulb,
    description: "structure creative concepts and implementation plans"
  },
  {
    id: "fullstack-mvp",
    title: "full stack app MVP",
    icon: Code,
    description: "plan technical architecture and feature roadmap"
  },
  {
    id: "brainstorming",
    title: "brainstorming",
    icon: Users,
    description: "capture and organize creative thoughts"
  },
  {
    id: "problem-solving",
    title: "problem solving",
    icon: Target,
    description: "break down complex problems into actionable steps"
  }
];

export const ContextQuestions = ({ onContextSelect, isVisible }: ContextQuestionsProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  if (!isVisible) return null;

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setTimeout(() => {
      onContextSelect(categoryId);
    }, 500);
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl gradient-text lowercase">
            what is this mind map for?
          </CardTitle>
          <p className="text-muted-foreground lowercase">
            help us organize your thoughts perfectly
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((category) => {
              const Icon = category.icon;
              const isSelected = selectedCategory === category.id;
              
              return (
                <Button
                  key={category.id}
                  variant="outline"
                  className={`h-auto p-4 flex flex-col items-start space-y-2 hover:bg-secondary/50 transition-all duration-200 ${
                    isSelected ? 'border-primary bg-primary/10' : ''
                  }`}
                  onClick={() => handleCategorySelect(category.id)}
                >
                  <div className="flex items-center gap-2 w-full">
                    {isSelected ? (
                      <CheckCircle className="w-5 h-5 text-primary" />
                    ) : (
                      <Icon className="w-5 h-5 text-muted-foreground" />
                    )}
                    <span className="font-medium lowercase">{category.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground text-left lowercase">
                    {category.description}
                  </p>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};