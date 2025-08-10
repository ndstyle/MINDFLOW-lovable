import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import Header from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const { signUp, signIn } = useAuth();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signUp(email, password, username);
      toast.success("Account created successfully!");
      setLocation("/");
    } catch (error: any) {
      toast.error(error.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signIn(email, password);
      toast.success("Signed in successfully!");
      setLocation("/");
    } catch (error: any) {
      toast.error(error.message || "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-md mx-auto">
          <div className="text-center space-y-4 mb-8">
            <h1 className="text-3xl font-bold gradient-text lowercase">
              welcome
            </h1>
            <p className="text-muted-foreground lowercase">
              sign in or create an account to get started
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="lowercase">authentication</CardTitle>
              <CardDescription className="lowercase">
                access your personalized mind mapping experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin" className="lowercase">sign in</TabsTrigger>
                  <TabsTrigger value="signup" className="lowercase">sign up</TabsTrigger>
                </TabsList>
                
                <TabsContent value="signin">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email" className="lowercase">email</Label>
                      <Input
                        id="signin-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="enter your email"
                        required
                        className="lowercase placeholder:lowercase"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password" className="lowercase">password</Label>
                      <Input
                        id="signin-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="enter your password"
                        required
                        className="lowercase placeholder:lowercase"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full lowercase"
                      disabled={loading}
                    >
                      {loading ? "signing in..." : "sign in"}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-username" className="lowercase">username</Label>
                      <Input
                        id="signup-username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="choose a username"
                        required
                        className="lowercase placeholder:lowercase"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="lowercase">email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="enter your email"
                        required
                        className="lowercase placeholder:lowercase"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="lowercase">password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="create a password (min 6 characters)"
                        required
                        minLength={6}
                        className="lowercase placeholder:lowercase"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full lowercase"
                      disabled={loading}
                    >
                      {loading ? "creating account..." : "sign up"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Auth;