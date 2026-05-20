import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { NodeProcessRunner } from '../src/process-runner.js';

describe('NodeProcessRunner', () => {
  it('cancels active process handles and preserves partial output', async () => {
    const runner = new NodeProcessRunner();
    const ready = waitForOutput(/ready/);
    const handle = runner.start({
      executable: 'bash',
      args: ['-lc', 'echo ready; while true; do sleep 1; done'],
      timeoutMs: 5000,
      onActivity: ready.onActivity
    });

    await ready.promise;

    assert.deepEqual(handle.cancel(), {
      status: 'cancelled',
      signal: 'SIGTERM'
    });

    const result = await handle.result;

    assert.equal(result.cancelled, true);
    assert.equal(result.timedOut, false);
    assert.equal(result.signal, 'SIGTERM');
    assert.match(result.stdout, /ready/);
  });

  it('escalates timed out processes from SIGTERM to SIGKILL after a grace period', async () => {
    const runner = new NodeProcessRunner();
    const result = await runner.run({
      executable: 'bash',
      args: ['-lc', [
        "trap 'echo sigterm ignored briefly; sleep 1; exit 0' TERM",
        'echo started',
        'while true; do sleep 1; done'
      ].join('; ')],
      timeoutMs: 500,
      timeoutKillDelayMs: 50
    });

    assert.equal(result.timedOut, true);
    assert.equal(result.killedAfterTimeout, true);
    assert.equal(result.signal, 'SIGKILL');
    assert.match(result.stdout, /started/);
  });
});

function waitForOutput(pattern) {
  let settle;
  const timeout = setTimeout(() => {
    settle.reject(new Error(`Timed out waiting for child output matching ${pattern}`));
  }, 3000);
  const promise = new Promise((resolve, reject) => {
    settle = { resolve, reject };
  });

  return {
    promise,
    onActivity(event) {
      if (pattern.test(event.chunk)) {
        clearTimeout(timeout);
        settle.resolve();
      }
    }
  };
}
