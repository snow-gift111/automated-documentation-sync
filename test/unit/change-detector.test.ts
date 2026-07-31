import test from 'node:test';
import assert from 'node:assert/strict';
import { ChangeDetector } from '../../src/detector/change-detector';
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

test('ChangeDetector detects added, modified, and deleted files from repository state comparison', () => {
  const previous = createRepositoryModel({
    sourceFiles: [
      {
        path: '/repo/src/old.ts',
        relativePath: 'src/old.ts',
        kind: 'source',
        extension: '.ts',
      },
    ],
    documentationFiles: [
      {
        path: '/repo/README.md',
        relativePath: 'README.md',
        kind: 'documentation',
        documentationKind: 'readme',
        extension: '.md',
      },
    ],
    metadataFiles: [],
    summary: {
      sourceCount: 1,
      documentationCount: 1,
      metadataCount: 0,
      totalFiles: 2,
    },
  });

  const current = createRepositoryModel({
    sourceFiles: [
      {
        path: '/repo/src/new.ts',
        relativePath: 'src/new.ts',
        kind: 'source',
        extension: '.ts',
      },
      {
        path: '/repo/src/modified.ts',
        relativePath: 'src/modified.ts',
        kind: 'source',
        extension: '.ts',
      },
    ],
    documentationFiles: [
      {
        path: '/repo/README.md',
        relativePath: 'README.md',
        kind: 'documentation',
        documentationKind: 'readme',
        extension: '.md',
      },
      {
        path: '/repo/docs/api.md',
        relativePath: 'docs/api.md',
        kind: 'documentation',
        documentationKind: 'docs',
        extension: '.md',
      },
    ],
    metadataFiles: [
      {
        path: '/repo/package.json',
        relativePath: 'package.json',
        kind: 'metadata',
        extension: '.json',
      },
    ],
    summary: {
      sourceCount: 2,
      documentationCount: 2,
      metadataCount: 1,
      totalFiles: 5,
    },
  });

  const detector = new ChangeDetector(current);
  const result = detector.detectChanges(previous);

  assert.equal(result.hasChanges, true);
  assert.equal(result.addedFiles.length, 3);
  assert.equal(result.modifiedFiles.length, 0);
  assert.equal(result.deletedFiles.length, 1);
  assert.equal(result.changes.length, 4);

  assert.deepEqual(result.changes.map((change) => change.type), ['added', 'added', 'added', 'deleted']);
});

test('ChangeDetector reports no changes when repository state is unchanged', () => {
  const repository = createRepositoryModel({
    sourceFiles: [
      {
        path: '/repo/src/main.ts',
        relativePath: 'src/main.ts',
        kind: 'source',
        extension: '.ts',
      },
    ],
    documentationFiles: [
      {
        path: '/repo/README.md',
        relativePath: 'README.md',
        kind: 'documentation',
        documentationKind: 'readme',
        extension: '.md',
      },
    ],
    metadataFiles: [],
    summary: {
      sourceCount: 1,
      documentationCount: 1,
      metadataCount: 0,
      totalFiles: 2,
    },
  });

  const detector = new ChangeDetector(repository);
  const result = detector.detectChanges(repository);

  assert.equal(result.hasChanges, false);
  assert.equal(result.changes.length, 0);
  assert.equal(result.addedFiles.length, 0);
  assert.equal(result.modifiedFiles.length, 0);
  assert.equal(result.deletedFiles.length, 0);
});
