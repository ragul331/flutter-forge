import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTriggerBuild } from '@/hooks/useTriggerBuild';
import { BuildEnvironment } from '@/types/build';
import { Rocket, Loader2 } from 'lucide-react';

const environments: { value: BuildEnvironment; label: string; description: string }[] = [
  { value: 'dev', label: 'Development', description: 'Local development builds' },
  { value: 'qa', label: 'QA', description: 'Quality assurance testing' },
  { value: 'staging', label: 'Staging', description: 'Pre-production environment' },
  { value: 'prod', label: 'Production', description: 'Live production release' },
];

export function BuildTriggerForm() {
  const [environment, setEnvironment] = useState<BuildEnvironment>('dev');
  const [baseUrl, setBaseUrl] = useState('');
  const { triggerBuild, isTriggering } = useTriggerBuild();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!baseUrl.trim()) {
      return;
    }

    await triggerBuild({
      environment,
      base_url: baseUrl.trim(),
    });
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Rocket className="h-5 w-5 text-primary" />
          Trigger New Build
        </CardTitle>
        <CardDescription>
          Configure and start a new Flutter build through GitHub Actions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="environment">Environment</Label>
            <Select value={environment} onValueChange={(v) => setEnvironment(v as BuildEnvironment)}>
              <SelectTrigger id="environment" className="bg-background">
                <SelectValue placeholder="Select environment" />
              </SelectTrigger>
              <SelectContent>
                {environments.map((env) => (
                  <SelectItem key={env.value} value={env.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{env.label}</span>
                      <span className="text-xs text-muted-foreground">{env.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="baseUrl">Base URL</Label>
            <Input
              id="baseUrl"
              type="url"
              placeholder="https://xxxx.ngrok-free.app"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="bg-background font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Enter your API base URL (localhost with ngrok or production endpoint)
            </p>
          </div>

          <Button
            type="submit"
            disabled={isTriggering || !baseUrl.trim() || !isValidUrl(baseUrl)}
            className="w-full"
          >
            {isTriggering ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Starting Build...
              </>
            ) : (
              <>
                <Rocket className="mr-2 h-4 w-4" />
                Start Build
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
