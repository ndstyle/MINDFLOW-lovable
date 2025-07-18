import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold gradient-text lowercase">
              dashboard
            </h1>
            <p className="text-muted-foreground lowercase">
              manage your mind maps and projects
            </p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="lowercase">coming soon</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground lowercase">
                your dashboard will show saved mind maps, recent projects, and analytics.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;