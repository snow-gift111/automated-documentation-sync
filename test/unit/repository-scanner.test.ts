import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { RepositoryScanner } from '../../src/scanner/repository-scanner';

test('RepositoryScanner identifies source, documentation, and metadata files', async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), 'ads-scanner-'));

  try {
    mkdirSync(path.join(tempRoot, 'docs', 'api'), { recursive: true });
    mkdirSync(path.join(tempRoot, 'src', 'services'), { recursive: true });
    mkdirSync(path.join(tempRoot, 'architecture'), { recursive: true });

    writeFileSync(path.join(tempRoot, 'README.md'), '# Project\n');
    writeFileSync(path.join(tempRoot, 'CHANGELOG.md'), '# Changelog\n');
    writeFileSync(path.join(tempRoot, 'docs', 'overview.md'), '# Overview\n');
    writeFileSync(path.join(tempRoot, 'docs', 'api', 'index.md'), '# API\n');
    writeFileSync(path.join(tempRoot, 'architecture', 'solution.md'), '# Solution\n');
    writeFileSync(path.join(tempRoot, 'src', 'services', 'sync.ts'), 'export const sync = true;\n');
    writeFileSync(path.join(tempRoot, 'package.json'), '{"name":"demo"}\n');
    writeFileSync(path.join(tempRoot, 'tsconfig.json'), '{}\n');

    const scanner = new RepositoryScanner(tempRoot);
    const model = await scanner.scanRepository();

    assert.equal(model.summary.sourceCount, 1);
    assert.equal(model.summary.documentationCount, 5);
    assert.equal(model.summary.metadataCount, 2);
    assert.equal(model.summary.totalFiles, 8);

    assert.ok(model.documentationFiles.some((file) => file.relativePath === 'README.md' && file.documentationKind === 'readme'));
    assert.ok(model.documentationFiles.some((file) => file.relativePath === 'CHANGELOG.md' && file.documentationKind === 'changelog'));
    assert.ok(model.documentationFiles.some((file) => file.relativePath === 'docs/overview.md' && file.documentationKind === 'docs'));
    assert.ok(model.documentationFiles.some((file) => file.relativePath === 'docs/api/index.md' && file.documentationKind === 'api'));
    assert.ok(model.documentationFiles.some((file) => file.relativePath === 'architecture/solution.md' && file.documentationKind === 'architecture'));

    assert.ok(model.sourceFiles.some((file) => file.relativePath === 'src/services/sync.ts' && file.kind === 'source'));
    assert.ok(model.metadataFiles.some((file) => file.relativePath === 'package.json'));
    assert.ok(model.metadataFiles.some((file) => file.relativePath === 'tsconfig.json'));
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('RepositoryScanner ignores repository internals and returns a normalized repository model', async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), 'ads-scanner-ignore-'));

  try {
    mkdirSync(path.join(tempRoot, '.git', 'hooks'), { recursive: true });
    mkdirSync(path.join(tempRoot, 'node_modules', 'ignored'), { recursive: true });
    mkdirSync(path.join(tempRoot, 'src'), { recursive: true });

    writeFileSync(path.join(tempRoot, '.git', 'config'), '[core]\n');
    writeFileSync(path.join(tempRoot, 'node_modules', 'ignored', 'package.json'), '{}\n');
    writeFileSync(path.join(tempRoot, 'src', 'main.ts'), 'export default {};\n');

    const scanner = new RepositoryScanner(tempRoot);
    const model = await scanner.scanRepository();

    assert.equal(model.summary.totalFiles, 1);
    assert.equal(model.summary.sourceCount, 1);
    assert.equal(model.summary.documentationCount, 0);
    assert.equal(model.summary.metadataCount, 0);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});
