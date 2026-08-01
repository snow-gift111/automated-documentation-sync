import test from 'node:test';
import assert from 'node:assert/strict';
import { mock } from 'node:test';
import { runCli } from '../../src/cli/cli';
import { PipelineOrchestrator } from '../../src/core/pipeline-orchestrator';

test('runCli logs initialization message when invoked without arguments', async () => {
  const output: string[] = [];
  const originalLog = console.log;

  console.log = (message?: unknown) => {
    output.push(String(message));
  };

  try {
    const exitCode = await runCli([]);
    assert.equal(exitCode, 0);
  } finally {
    console.log = originalLog;
  }

  assert.deepEqual(output, ['Automated Documentation Sync CLI initialized.']);
});

test('runCli executes the pipeline and prints a concise execution summary', async () => {
  const output: string[] = [];
  const originalLog = console.log;
  const runMock = mock.method(PipelineOrchestrator.prototype, 'run', async () => ({
    runId: 'run-123',
    executionStatus: 'success',
    completedStages: ['RepositoryScanner', 'ChangeDetector'],
    generatedReport: {
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
    },
    reviewDecision: {
      state: 'Approved',
      reviewState: 'Approved',
      canProceed: true,
      reason: 'Report approved for next stage.',
    },
    auditRecordReference: 'run-123',
  }));

  console.log = (message?: unknown) => {
    output.push(String(message));
  };

  try {
    const exitCode = await runCli(['C:/repo', '--output', 'C:/out', '--verbose']);
    assert.equal(exitCode, 0);
  } finally {
    console.log = originalLog;
    runMock.mock.restore();
  }

  assert.ok(output.join('\n').includes('Run ID: run-123'));
  assert.ok(output.join('\n').includes('Status: success'));
  assert.ok(output.join('\n').includes('Generated files: README.md'));
});

test('runCli returns a non-zero exit code when pipeline execution fails', async () => {
  const runMock = mock.method(PipelineOrchestrator.prototype, 'run', async () => ({
    runId: 'run-456',
    executionStatus: 'failed',
    completedStages: ['RepositoryScanner'],
    failedStage: 'RepositoryScanner',
  }));

  try {
    const exitCode = await runCli(['C:/repo']);
    assert.equal(exitCode, 1);
  } finally {
    runMock.mock.restore();
  }
});
