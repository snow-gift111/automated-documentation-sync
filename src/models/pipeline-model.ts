import type { AuditRecord } from './audit-model';
import type { ReviewDecision } from './review-model';
import type { SynchronizationReport } from './report-model';
import type { RepositoryModel } from './repository-model';

export type PipelineExecutionStatus = 'success' | 'warning' | 'failed';

export type PipelineStageName =
  | 'RepositoryScanner'
  | 'ChangeDetector'
  | 'DocumentationAnalyzer'
  | 'DocumentationValidator'
  | 'DocumentationGenerator'
  | 'ReportGenerator'
  | 'ReviewOrchestrator'
  | 'AuditStore'
  | 'GitService';

export interface PipelineExecutionResult {
  runId: string;
  executionStatus: PipelineExecutionStatus;
  completedStages: PipelineStageName[];
  failedStage?: PipelineStageName;
  generatedReport?: SynchronizationReport;
  reviewDecision?: ReviewDecision;
  auditRecordReference?: string;
  repositoryModel?: RepositoryModel;
  auditRecord?: AuditRecord;
}
