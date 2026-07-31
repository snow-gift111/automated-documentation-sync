import test from 'node:test';
import assert from 'node:assert/strict';
import { runCli } from '../../src/cli/cli';

test('runCli logs initialization message', () => {
  const output: string[] = [];
  const originalLog = console.log;

  console.log = (message?: unknown) => {
    output.push(String(message));
  };

  try {
    runCli();
  } finally {
    console.log = originalLog;
  }

  assert.deepEqual(output, ['Automated Documentation Sync CLI initialized.']);
});
