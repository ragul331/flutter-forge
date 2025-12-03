export type BuildEnvironment = 'dev' | 'qa' | 'staging' | 'prod';
export type BuildStatus = 'queued' | 'building' | 'success' | 'failed';
export type BuildStage = 'pending' | 'checkout' | 'dependencies' | 'build' | 'upload' | 'complete';

export interface Build {
  id: string;
  environment: BuildEnvironment;
  base_url: string;
  status: BuildStatus;
  stage: BuildStage;
  progress: number;
  artifact_url: string | null;
  github_run_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface TriggerBuildPayload {
  environment: BuildEnvironment;
  base_url: string;
}

export interface UpdateStatusPayload {
  build_id: string;
  status: BuildStatus;
  stage: BuildStage;
  progress: number;
  artifact_url?: string;
}
