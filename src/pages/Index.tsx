import { BuildTriggerForm } from '@/components/BuildTriggerForm';
import { BuildTable } from '@/components/BuildTable';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Zap, Cloud } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                <Smartphone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Flutter Build Automation</h1>
                <p className="text-sm text-muted-foreground">CI/CD Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <Cloud className="h-3 w-3" />
                Lovable Cloud
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <Zap className="h-3 w-3" />
                Real-time
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-[400px_1fr]">
          {/* Build Trigger Form */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <BuildTriggerForm />
          </div>

          {/* Build History Table */}
          <div className="min-w-0">
            <BuildTable />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/30 mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>Flutter Build Automation System</p>
            <div className="flex items-center gap-4">
              <span>Powered by GitHub Actions</span>
              <span>•</span>
              <span>Built with Lovable Cloud</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
