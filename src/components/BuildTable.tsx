import { useBuilds } from '@/hooks/useBuilds';
import { BuildStatusBadge, BuildStageBadge } from '@/components/BuildStatusBadge';
import { BuildProgressBar } from '@/components/BuildProgressBar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Download, ExternalLink, History, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

export function BuildTable() {
  const { builds, isLoading } = useBuilds();

  const formatEnvironment = (env: string) => {
    const labels: Record<string, string> = {
      dev: 'Development',
      qa: 'QA',
      staging: 'Staging',
      prod: 'Production',
    };
    return labels[env] || env;
  };

  const truncateUrl = (url: string, maxLength = 30) => {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + '...';
  };

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <History className="h-5 w-5 text-primary" />
              Build History
            </CardTitle>
            <CardDescription>
              Real-time tracking of all Flutter builds
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <RefreshCw className="h-3 w-3 animate-spin" />
              Live updates enabled
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : builds.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <History className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">No builds yet</p>
            <p className="text-sm">Trigger your first build to see it here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Build ID</TableHead>
                  <TableHead>Environment</TableHead>
                  <TableHead>Base URL</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead className="w-[200px]">Progress</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {builds.map((build) => (
                  <TableRow key={build.id} className="group">
                    <TableCell className="font-mono text-xs">
                      {build.id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {formatEnvironment(build.environment)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {truncateUrl(build.base_url)}
                      </code>
                    </TableCell>
                    <TableCell>
                      <BuildStatusBadge status={build.status} />
                    </TableCell>
                    <TableCell>
                      <BuildStageBadge stage={build.stage} />
                    </TableCell>
                    <TableCell>
                      <BuildProgressBar progress={build.progress} status={build.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(build.created_at), 'MMM d, HH:mm')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {build.artifact_url && build.status === 'success' && (
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="gap-1"
                          >
                            <a href={build.artifact_url} target="_blank" rel="noopener noreferrer">
                              <Download className="h-3 w-3" />
                              APK
                            </a>
                          </Button>
                        )}
                        {build.github_run_id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="gap-1"
                          >
                            <a
                              href={`https://github.com/${import.meta.env.VITE_GITHUB_OWNER || 'owner'}/${import.meta.env.VITE_GITHUB_REPO || 'repo'}/actions/runs/${build.github_run_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-3 w-3" />
                              View
                            </a>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
