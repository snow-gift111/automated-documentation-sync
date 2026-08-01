import test from 'node:test';
import assert from 'node:assert/strict';
import { PipelineOrchestrator } from '../../src/core/pipeline-orchestrator';
import { RepositoryScanner } from '../../src/scanner/repository-scanner';
import { AuditStore } from '../../src/audit/audit-store';
import { GitService } from '../../src/git/git-service';
import type { RepositoryModel } from '../../src/models/repository-model';

class StubScanner extends RepositoryScanner {
  constructor() {
    super('/repo');
  }

  override async scanRepository(): Promise<RepositoryModel> {
    return {
      rootPath: '/repo',
      sourceFiles: [],
      documentationFiles: [],
      metadataFiles: [],
      summary: {
        sourceCount: 0,
        documentationCount: 0,
        metadataCount: 0,
        totalFiles: 0,
      },
    };
  }
}

test('PipelineOrchestrator executes the approved in-memory pipeline and records the review result', async () => {
  const orchestrator = new PipelineOrchestrator(
    '/repo',
    new GitService('/repo', ((() => 'main') as unknown) as typeof import('node:child_process').execFileSync),
    new StubScanner(),
    new AuditStore(),
  );

  const result = await orchestrator.run();

  assert.equal(result.executionStatus, 'success');
  assert.ok(result.completedStages.includes('RepositoryScanner'));
  assert.ok(result.completedStages.includes('ChangeDetector'));
  assert.ok(result.completedStages.includes('DocumentationAnalyzer'));
  assert.ok(result.completedStages.includes('DocumentationValidator'));
  assert.ok(result.completedStages.includes('DocumentationGenerator'));
  assert.ok(result.completedStages.includes('ReportGenerator'));
  assert.ok(result.completedStages.includes('ReviewOrchestrator'));
  assert.ok(result.completedStages.includes('AuditStore'));
  assert.ok(result.completedStages.includes('GitService'));
  assert.equal(result.reviewDecision?.canProceed, true);
  assert.equal(result.auditRecordReference, result.runId);
});

test('PipelineOrchestrator stops immediately on a blocking error and returns the failed stage', async () => {
  class FailingScanner extends RepositoryScanner {
  constructor() {
    super('/repo');
  }

  override async scanRepository(): Promise<RepositoryModel> {
    throw new Error('Repository is unavailable');
  }
}

  const orchestrator = new PipelineOrchestrator(
    '/repo',
    new GitService('/repo', ((() => 'main') as unknown) as typeof import('node:child_process').execFileSync),
    new FailingScanner(),
    new AuditStore(),
  );

  const result = await orchestrator.run();

  assert.equal(result.executionStatus, 'failed');
  assert.equal(result.failedStage, 'RepositoryScanner');
  assert.equal(result.completedStages.length, 0);
});
