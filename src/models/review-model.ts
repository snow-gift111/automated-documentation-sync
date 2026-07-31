import type { SynchronizationReport } from './report-model';

export type ReviewState = 'Pending Review' | 'Approved' | 'Rejected';

export interface ReviewDecision {
  state: ReviewState;
  reviewState: ReviewState;
  canProceed: boolean;
  reason: string;
}

export interface ReviewOrchestratorInput {
  report: SynchronizationReport;
}
