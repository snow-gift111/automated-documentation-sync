import test from 'node:test';
import assert from 'node:assert/strict';
import { DocumentationGenerator } from '../../src/generator/documentation-generator';
import type { ValidationResult } from '../../src/models/validation-model';
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

const createValidationResult = (overrides: Partial<ValidationResult> = {}): ValidationResult => ({
  analysis: createAnalysisResult(),
  candidates: [],
  warnings: [],
  skippedSections: [],
  ...overrides,
});

test('DocumentationGenerator produces review-ready Markdown content only for approved items', () => {
  const validation = createValidationResult({
    candidates: [
      {
        section: 'README.md',
        status: 'Approved',
        warnings: [],
      },
      {
        section: 'docs/overview.md',
        status: 'Approved',
        warnings: [],
      },
      {
        section: 'docs/api/index.md',
        status: 'Approved',
        warnings: [],
      },
      {
        section: 'architecture/overview.md',
        status: 'Approved',
        warnings: [],
      },
      {
        section: 'CHANGELOG.md',
        status: 'Approved',
        warnings: [],
      },
      {
        section: 'docs/legacy.md',
        status: 'Warning',
        warnings: [{ section: 'docs/legacy.md', reason: 'Needs confirmation.' }],
      },
      {
        section: 'unmapped-section',
        status: 'Skipped',
        warnings: [],
        skippedReason: 'Expected docs section missing.',
      },
    ],
    warnings: [
      { section: 'docs/legacy.md', reason: 'Needs confirmation.' },
    ],
    skippedSections: [
      { section: 'unmapped-section', reason: 'Expected docs section missing.' },
    ],
  });

  const generator = new DocumentationGenerator(validation);
  const result = generator.generate();

  assert.equal(result.generatedContent.length, 5);
  assert.equal(result.skippedItems.length, 1);
  assert.equal(result.warnings.length, 1);
  assert.ok(result.generatedContent.every((entry) => entry.content.includes('# ')));
  assert.ok(result.generatedContent.some((entry) => entry.target === 'README.md'));
  assert.ok(result.generatedContent.some((entry) => entry.target === 'docs/'));
  assert.ok(result.generatedContent.some((entry) => entry.target === 'api'));
  assert.ok(result.generatedContent.some((entry) => entry.target === 'architecture'));
  assert.ok(result.generatedContent.some((entry) => entry.target === 'CHANGELOG.md'));
});

test('DocumentationGenerator records skipped items and warnings without generating markdown for them', () => {
  const validation = createValidationResult({
    candidates: [
      {
        section: 'docs/blocked.md',
        status: 'Warning',
        warnings: [{ section: 'docs/blocked.md', reason: 'Low confidence.' }],
      },
      {
        section: 'unmapped-section',
        status: 'Skipped',
        skippedReason: 'Unavailable section',
        warnings: [],
      },
    ],
    warnings: [{ section: 'docs/blocked.md', reason: 'Low confidence.' }],
    skippedSections: [{ section: 'unmapped-section', reason: 'Unavailable section' }],
  });

  const generator = new DocumentationGenerator(validation);
  const result = generator.generate();

  assert.equal(result.generatedContent.length, 0);
  assert.equal(result.skippedItems.length, 1);
  assert.equal(result.warnings.length, 1);
  assert.equal(result.warnings[0].section, 'docs/blocked.md');
  assert.equal(result.skippedItems[0].section, 'unmapped-section');
});
