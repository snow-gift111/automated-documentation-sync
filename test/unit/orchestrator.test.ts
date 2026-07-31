import test from 'node:test';
import assert from 'node:assert/strict';
import { SyncOrchestrator } from '../../src/core/orchestrator';

test('SyncOrchestrator returns initialized skeleton message', () => {
  const orchestrator = new SyncOrchestrator();
  assert.equal(orchestrator.run(), 'Sync orchestrator skeleton initialized.');
});
