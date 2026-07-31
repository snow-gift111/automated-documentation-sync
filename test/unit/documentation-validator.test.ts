import test from 'node:test';
import assert from 'node:assert/strict';
import { DocumentationValidator } from '../../src/validator/documentation-validator';
import type { DocumentationAnalysisResult } from '../../src/models/analysis-model';
import type { ChangeDetectionResult } from '../../src/models/change-model';
import type { RepositoryModel } from '../../src/models/repository-model';

const createRepositoryModel = (overrides: Partial<RepositoryModel> = {}): RepositoryModel => ({
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
  ...overrides,
});

const createChangeResult = (overrides: Partial<ChangeDetectionResult> = {}): ChangeDetectionResult => ({
  repository: createRepositoryModel(),
  changes: [],
  addedFiles: [],
  modifiedFiles: [],
  deletedFiles: [],
  hasChanges: false,
  ...overrides,
});

const createAnalysisResult = (overrides: Partial<DocumentationAnalysisResult> = {}): DocumentationAnalysisResult => ({
  repository: createRepositoryModel(),
  changeSet: createChangeResult(),
  items: [],
  generatedSections: [],
  ...overrides,
});

test('DocumentationValidator classifies approved, warning, and skipped documentation candidates', () => {
  const analysis = createAnalysisResult({
    items: [
      {
        status: 'up-to-date',
        file: {
          path: '/repo/README.md',
          relativePath: 'README.md',
          kind: 'documentation',
          documentationKind: 'readme',
          extension: '.md',
        },
        reason: 'Documentation is current.',
      },
      {
        status: 'outdated',
        file: {
          path: '/repo/docs/overview.md',
          relativePath: 'docs/overview.md',
          kind: 'documentation',
          documentationKind: 'docs',
          extension: '.md',
        },
        reason: 'Repository changes detected.',
      },
      {
        status: 'missing',
        file: null,
        reason: 'Expected docs section missing.',
      },
    ],
  });

  const validator = new DocumentationValidator(analysis);
  const result = validator.validate();

  assert.equal(result.candidates.length, 3);
  assert.equal(result.candidates[0].status, 'Approved');
  assert.equal(result.candidates[1].status, 'Warning');
  assert.equal(result.candidates[2].status, 'Skipped');
  assert.equal(result.warnings.length, 2);
  assert.equal(result.skippedSections.length, 1);
});

test('DocumentationValidator adds a warning when overall approval coverage is below threshold', () => {
  const analysis = createAnalysisResult({
    items: [
      {
        status: 'outdated',
        file: {
          path: '/repo/docs/overview.md',
          relativePath: 'docs/overview.md',
          kind: 'documentation',
          documentationKind: 'docs',
          extension: '.md',
        },
        reason: 'Repository changes detected.',
      },
      {
        status: 'missing',
        file: null,
        reason: 'Expected docs section missing.',
      },
    ],
  });

  const validator = new DocumentationValidator(analysis, {
    lowConfidenceThreshold: 0.5,
    minimumCoverageForApproval: 0.6,
    requireExplicitDocumentedSection: true,
  });

  const result = validator.validate();

  assert.equal(result.candidates.length, 2);
  assert.equal(result.candidates[0].status, 'Warning');
  assert.equal(result.candidates[1].status, 'Skipped');
  assert.ok(result.warnings.some((warning) => warning.section === 'overall-validation'));
});
