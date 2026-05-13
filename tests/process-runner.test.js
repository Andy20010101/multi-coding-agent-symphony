import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { setTimeout as sleep } from 'node:timers/promises';

import { NodeProcessRunner } from '../src/process-runner.js';

describe('NodeProcessRunner', () => {
  it('cancels active process handles and preserves partial output', async () => {
    const runner = new NodeProcessRunner();
    const handle = runner.start({
      executable: process.execPath,
      args: ['-e', "console.log('ready'); setInterval(() => {}, 1000);"],
      timeoutMs: 5000
    });

    await sleep(100);

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
});
