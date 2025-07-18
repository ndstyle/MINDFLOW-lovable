import { Button } from "@/components/ui/button";
import { BookOpen, Lightbulb, Code, Users, Puzzle, MoreHorizontal } from "lucide-react";

interface CategorySelectorProps {
  onCategorySelect: (category: string) => void;
  isVisible: boolean;
}

const categories = [
  { id: 'notes for a class', label: 'notes for a class', icon: BookOpen },
  { id: 'project idea', label: 'project idea', icon: Lightbulb },
  { id: 'full stack app MVP', label: 'full stack app MVP', icon: Code },
  { id: 'brainstorming', label: 'brainstorming', icon: Users },
  { id: 'problem solving', label: 'problem solving', icon: Puzzle },
  { id: 'other', label: 'other', icon: MoreHorizontal },
];

export const CategorySelector = ({ onCategorySelect, isVisible }: CategorySelectorProps) => {
  if (!isVisible) return null;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 p-6 bg-card rounded-lg border border-border/50">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold text-foreground lowercase">
          what is this mind map for?
        </h3>
        <p className="text-sm text-muted-foreground lowercase">
          choose a category to help us structure your mind map perfectly
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <Button
              key={category.id}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-secondary/50 lowercase"
              onClick={() => onCategorySelect(category.id)}
            >
              <Icon className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">{category.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
};