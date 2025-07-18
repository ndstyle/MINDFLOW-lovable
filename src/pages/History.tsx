import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const History = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold gradient-text lowercase">
              history
            </h1>
            <p className="text-muted-foreground lowercase">
              view your previous mind maps and sessions
            </p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="lowercase">coming soon</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground lowercase">
                your history will show all previously created mind maps with search and filtering options.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default History;