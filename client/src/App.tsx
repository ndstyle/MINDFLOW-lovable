import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Router, Route, Switch } from "wouter";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Create from "./pages/Create";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import Auth from "./pages/Auth";
import Library from "./pages/Library";
import Upload from "./pages/Upload";
import Document from "./pages/Document";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Router>
          <Switch>
            <Route path="/" component={Index} />
            <Route path="/auth" component={Auth} />
            <Route path="/create">
              <ProtectedRoute>
                <Create />
              </ProtectedRoute>
            </Route>
            <Route path="/dashboard">
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            </Route>
            <Route path="/history">
              <ProtectedRoute>
                <History />
              </ProtectedRoute>
            </Route>
            <Route path="/library">
              <ProtectedRoute>
                <Library />
              </ProtectedRoute>
            </Route>
            <Route path="/upload">
              <ProtectedRoute>
                <Upload />
              </ProtectedRoute>
            </Route>
            <Route path="/document/:id">
              <ProtectedRoute>
                <Document />
              </ProtectedRoute>
            </Route>
            <Route component={NotFound} />
          </Switch>
        </Router>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;