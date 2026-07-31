import test from 'node:test';
import assert from 'node:assert/strict';
import { ReportGenerator } from '../../src/report/report-generator';
import type { GenerationResult } from '../../src/models/generation-model';
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

const createGenerationResult = (overrides: Partial<GenerationResult> = {}): GenerationResult => ({
  validation: createValidationResult(),
  generatedContent: [],
  skippedItems: [],
  warnings: [],
  ...overrides,
});

test('ReportGenerator builds a structured Markdown synchronization report from generator output', () => {
  const generation = createGenerationResult({
    generatedContent: [
      {
        target: 'README.md',
        relatedSection: 'README.md',
        content: '# README\n\nReview-ready markdown.',
      },
      {
        target: 'docs/',
        relatedSection: 'docs/overview.md',
        content: '# Documentation\n\nReview-ready markdown.',
      },
    ],
    skippedItems: [
      {
        section: 'unmapped-section',
        reason: 'Expected docs section missing.',
      },
    ],
    warnings: [
      { section: 'docs/legacy.md', reason: 'Section requires manual review.' },
    ],
    validation: createValidationResult({
      warnings: [
        { section: 'docs/legacy.md', reason: 'Section requires manual review.' },
      ],
      skippedSections: [
        { section: 'unmapped-section', reason: 'Expected docs section missing.' },
      ],
    }),
  });

  const generator = new ReportGenerator({ generation });
  const report = generator.generate();

  assert.ok(report.markdown.includes('# Documentation Synchronization Report'));
  assert.deepEqual(report.generatedDocumentationSummary, ['- README.md', '- docs/']);
  assert.deepEqual(report.generatedFiles, ['README.md', 'docs/']);
  assert.equal(report.skippedItems.length, 1);
  assert.equal(report.validationWarnings.length, 1);
  assert.equal(report.generationWarnings.length, 1);
  assert.equal(report.executionSummary.generatedCount, 2);
  assert.equal(report.executionSummary.skippedCount, 1);
  assert.equal(report.executionSummary.warningCount, 2);
  assert.equal(report.executionSummary.status, 'warning');
});

test('ReportGenerator keeps the report markdown deterministic for empty generation results', () => {
  const generation = createGenerationResult();
  const generator = new ReportGenerator({ generation });
  const report = generator.generate();

  assert.ok(report.markdown.includes('## Execution Summary'));
  assert.equal(report.executionSummary.generatedCount, 0);
  assert.equal(report.executionSummary.skippedCount, 0);
  assert.equal(report.executionSummary.warningCount, 0);
  assert.equal(report.executionSummary.status, 'blocked');
});
