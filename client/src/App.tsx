import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Router, Route, Switch } from "wouter";
import { AuthContext, useAuthHook } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Create from "./pages/Create";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import Auth from "./pages/Auth";
import Quiz from "./pages/Quiz";
import Flashcards from "./pages/Flashcards";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AuthProvider({ children }: { children: React.ReactNode }) {
  const authValue = useAuthHook();
  return <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Router>
          <Switch>
            <Route path="/" component={Index} />
            <Route path="/create" component={Create} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/history" component={History} />
            <Route path="/auth" component={Auth} />
            <Route path="/quiz/:quizId" component={Quiz} />
            <Route path="/flashcards/:flashcardId" component={Flashcards} />
            <Route component={NotFound} />
          </Switch>
        </Router>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
