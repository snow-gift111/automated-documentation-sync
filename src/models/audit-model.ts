import type { ReviewDecision } from './review-model';
import type { SynchronizationReport } from './report-model';

export type AuditDecision = 'Approved' | 'Rejected';

export interface AuditRecord {
  runId: string;
  timestamp: string;
  reviewState: ReviewDecision['reviewState'];
  decision: AuditDecision;
  reportMetadata: {
    markdownSummary: string;
    generatedCount: number;
    skippedCount: number;
    warningCount: number;
  };
  validationSummary: {
    warningCount: number;
    skippedCount: number;
    generatedCount: number;
  };
}

export interface AuditStoreInput {
  review: ReviewDecision;
  report: SynchronizationReport;
}
