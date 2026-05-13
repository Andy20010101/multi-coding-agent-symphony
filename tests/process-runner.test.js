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

  it('escalates timed out processes from SIGTERM to SIGKILL after a grace period', async () => {
    const runner = new NodeProcessRunner();
    const result = await runner.run({
      executable: process.execPath,
      args: ['-e', [
        "process.on('SIGTERM', () => {",
        "  console.log('sigterm ignored briefly');",
        '  setTimeout(() => process.exit(0), 500);',
        '});',
        "console.log('started');",
        'setInterval(() => {}, 1000);'
      ].join('\n')],
      timeoutMs: 100,
      timeoutKillDelayMs: 50
    });

    assert.equal(result.timedOut, true);
    assert.equal(result.killedAfterTimeout, true);
    assert.equal(result.signal, 'SIGKILL');
    assert.match(result.stdout, /started/);
  });
});
