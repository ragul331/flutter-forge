import { Badge } from '@/components/ui/badge';
import { BuildStatus, BuildStage } from '@/types/build';
import { CheckCircle, Clock, Loader2, XCircle } from 'lucide-react';

interface BuildStatusBadgeProps {
  status: BuildStatus;
}

export function BuildStatusBadge({ status }: BuildStatusBadgeProps) {
  const config = {
    queued: {
      icon: Clock,
      label: 'Queued',
      variant: 'secondary' as const,
    },
    building: {
      icon: Loader2,
      label: 'Building',
      variant: 'default' as const,
    },
    success: {
      icon: CheckCircle,
      label: 'Success',
      variant: 'default' as const,
    },
    failed: {
      icon: XCircle,
      label: 'Failed',
      variant: 'destructive' as const,
    },
  };

  const { icon: Icon, label, variant } = config[status];

  return (
    <Badge
      variant={variant}
      className={`gap-1 ${
        status === 'success'
          ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/30'
          : status === 'building'
          ? 'bg-primary/10 text-primary hover:bg-primary/20 border-primary/30'
          : ''
      }`}
    >
      <Icon className={`h-3 w-3 ${status === 'building' ? 'animate-spin' : ''}`} />
      {label}
    </Badge>
  );
}

interface BuildStageBadgeProps {
  stage: BuildStage;
}

export function BuildStageBadge({ stage }: BuildStageBadgeProps) {
  const labels: Record<BuildStage, string> = {
    pending: 'Pending',
    checkout: 'Checkout',
    dependencies: 'Dependencies',
    build: 'Building',
    upload: 'Uploading',
    complete: 'Complete',
  };

  return (
    <Badge variant="outline" className="font-mono text-xs">
      {labels[stage]}
    </Badge>
  );
}
