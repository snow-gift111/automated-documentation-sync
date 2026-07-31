import test from 'node:test';
import assert from 'node:assert/strict';
import { AuditStore } from '../../src/audit/audit-store';
import type { ReviewDecision } from '../../src/models/review-model';
import type { SynchronizationReport } from '../../src/models/report-model';

const createReport = (overrides: Partial<SynchronizationReport> = {}): SynchronizationReport => ({
  markdown: '# report',
  generatedDocumentationSummary: ['- README.md'],
  generatedFiles: ['README.md'],
  skippedItems: [],
  validationWarnings: [],
  generationWarnings: [],
  executionSummary: {
    generatedCount: 1,
    skippedCount: 0,
    warningCount: 0,
    status: 'success',
  },
  ...overrides,
});

test('AuditStore records review outcomes and supports lookup by run ID', () => {
  const reviewDecision: ReviewDecision = {
    state: 'Pending Review',
    reviewState: 'Approved',
    canProceed: true,
    reason: 'Report approved for next stage.',
  };

  const report = createReport();
  const store = new AuditStore();
  const runId = 'run-001';

  const record = store.record(runId, reviewDecision, report);
  const lookup = store.getByRunId(runId);

  assert.equal(record.runId, runId);
  assert.equal(record.reviewState, 'Approved');
  assert.equal(record.decision, 'Approved');
  assert.equal(record.reportMetadata.generatedCount, 1);
  assert.equal(record.validationSummary.warningCount, 0);
  assert.equal(lookup.length, 1);
});

test('AuditStore returns an empty result when a run ID has no stored records', () => {
  const store = new AuditStore();
  const lookup = store.getByRunId('unknown-run');

  assert.deepEqual(lookup, []);
});
