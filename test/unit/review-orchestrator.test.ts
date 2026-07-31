import test from 'node:test';
import assert from 'node:assert/strict';
import { ReviewOrchestrator } from '../../src/review/review-orchestrator';
import type { SynchronizationReport } from '../../src/models/report-model';

const createReport = (overrides: Partial<SynchronizationReport> = {}): SynchronizationReport => ({
  markdown: '# report',
  generatedDocumentationSummary: [],
  generatedFiles: [],
  skippedItems: [],
  validationWarnings: [],
  generationWarnings: [],
  executionSummary: {
    generatedCount: 0,
    skippedCount: 0,
    warningCount: 0,
    status: 'success',
  },
  ...overrides,
});

test('ReviewOrchestrator keeps the report in Pending Review until approved', () => {
  const report = createReport();
  const orchestrator = new ReviewOrchestrator(report);

  const initial = orchestrator.getCurrentState();
  const next = orchestrator.transition('Approved');

  assert.equal(initial.state, 'Pending Review');
  assert.equal(next.reviewState, 'Approved');
  assert.equal(next.canProceed, true);
  assert.equal(next.reason, 'Report approved for next stage.');
});

test('ReviewOrchestrator rejects a report when the approval transition is not permitted', () => {
  const report = createReport();
  const orchestrator = new ReviewOrchestrator(report);

  const result = orchestrator.transition('Rejected');

  assert.equal(result.reviewState, 'Rejected');
  assert.equal(result.canProceed, false);
  assert.equal(result.reason, 'Report rejected and cannot progress to the next stage.');
});

test('ReviewOrchestrator blocks progression when a report is not approved', () => {
  const report = createReport();
  const orchestrator = new ReviewOrchestrator(report);

  const pending = orchestrator.getCurrentState();
  const attempted = orchestrator.canProceed();

  assert.equal(pending.state, 'Pending Review');
  assert.equal(attempted, false);
});
