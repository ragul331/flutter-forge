import { Progress } from '@/components/ui/progress';
import { BuildStatus } from '@/types/build';

interface BuildProgressBarProps {
  progress: number;
  status: BuildStatus;
}

export function BuildProgressBar({ progress, status }: BuildProgressBarProps) {
  const getProgressColor = () => {
    switch (status) {
      case 'success':
        return 'bg-emerald-500';
      case 'failed':
        return 'bg-destructive';
      case 'building':
        return 'bg-primary';
      default:
        return 'bg-muted';
    }
  };

  return (
    <div className="flex items-center gap-3 min-w-[180px]">
      <Progress
        value={progress}
        className="h-2 flex-1"
        indicatorClassName={getProgressColor()}
      />
      <span className="text-xs font-mono text-muted-foreground w-10 text-right">
        {progress}%
      </span>
    </div>
  );
}
