import test from 'node:test';
import assert from 'node:assert/strict';
import { DocumentationAnalyzer } from '../../src/analyzer/documentation-analyzer';
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

test('DocumentationAnalyzer classifies missing and outdated documentation sections', () => {
  const repository = createRepositoryModel({
    documentationFiles: [
      {
        path: '/repo/README.md',
        relativePath: 'README.md',
        kind: 'documentation',
        documentationKind: 'readme',
        extension: '.md',
      },
      {
        path: '/repo/docs/overview.md',
        relativePath: 'docs/overview.md',
        kind: 'documentation',
        documentationKind: 'docs',
        extension: '.md',
      },
    ],
    summary: {
      sourceCount: 0,
      documentationCount: 2,
      metadataCount: 0,
      totalFiles: 2,
    },
  });

  const changeSet = createChangeResult({
    hasChanges: true,
    changes: [
      {
        type: 'modified',
        file: {
          path: '/repo/src/service.ts',
          relativePath: 'src/service.ts',
          kind: 'source',
          extension: '.ts',
        },
      },
    ],
  });

  const analyzer = new DocumentationAnalyzer(repository, changeSet);
  const result = analyzer.analyze();

  assert.equal(result.items.length, 5);
  assert.equal(result.items[0].status, 'outdated');
  assert.equal(result.items[1].status, 'missing');
  assert.equal(result.items[2].status, 'outdated');
  assert.equal(result.items[3].status, 'missing');
  assert.equal(result.items[4].status, 'missing');
});

test('DocumentationAnalyzer reports up-to-date documentation when no relevant changes are detected', () => {
  const repository = createRepositoryModel({
    documentationFiles: [
      {
        path: '/repo/README.md',
        relativePath: 'README.md',
        kind: 'documentation',
        documentationKind: 'readme',
        extension: '.md',
      },
      {
        path: '/repo/CHANGELOG.md',
        relativePath: 'CHANGELOG.md',
        kind: 'documentation',
        documentationKind: 'changelog',
        extension: '.md',
      },
      {
        path: '/repo/docs/overview.md',
        relativePath: 'docs/overview.md',
        kind: 'documentation',
        documentationKind: 'docs',
        extension: '.md',
      },
    ],
    summary: {
      sourceCount: 0,
      documentationCount: 3,
      metadataCount: 0,
      totalFiles: 3,
    },
  });

  const changeSet = createChangeResult({
    hasChanges: false,
    changes: [],
  });

  const analyzer = new DocumentationAnalyzer(repository, changeSet);
  const result = analyzer.analyze();

  assert.equal(result.items.length, 5);
  assert.equal(result.items[0].status, 'up-to-date');
  assert.equal(result.items[1].status, 'up-to-date');
  assert.equal(result.items[2].status, 'up-to-date');
  assert.equal(result.items[3].status, 'missing');
  assert.equal(result.items[4].status, 'missing');
});
