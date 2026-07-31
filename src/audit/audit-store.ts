import type { ReviewDecision } from '../models/review-model';
import type { SynchronizationReport } from '../models/report-model';
import type { AuditRecord } from '../models/audit-model';

export class AuditStore {
  private readonly records: AuditRecord[] = [];

  record(runId: string, review: ReviewDecision, report: SynchronizationReport): AuditRecord {
    const record: AuditRecord = {
      runId,
      timestamp: new Date().toISOString(),
      reviewState: review.reviewState,
      decision: review.canProceed ? 'Approved' : 'Rejected',
      reportMetadata: {
        markdownSummary: report.markdown,
        generatedCount: report.executionSummary.generatedCount,
        skippedCount: report.executionSummary.skippedCount,
        warningCount: report.executionSummary.warningCount,
      },
      validationSummary: {
        warningCount: report.validationWarnings.length + report.generationWarnings.length,
        skippedCount: report.skippedItems.length,
        generatedCount: report.executionSummary.generatedCount,
      },
    };

    this.records.push(record);
    return record;
  }

  getByRunId(runId: string): AuditRecord[] {
    return this.records.filter((record) => record.runId === runId);
  }
}
