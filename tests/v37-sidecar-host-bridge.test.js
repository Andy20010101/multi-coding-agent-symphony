import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  buildAppStateSnapshot,
  validateAppStateSnapshotContract
} from '../src/symphony/app-state-snapshot.js';
import {
  buildLocalRuntimeHealth,
  validateLocalRuntimeHealthContract
} from '../src/symphony/local-runtime-health.js';
import {
  buildSidecarHostLifecycle,
  validateSidecarHostLifecycleContract
} from '../src/symphony/sidecar-host-bridge.js';

describe('v37 sidecar host lifecycle bridge', () => {
  it('validates the sidecar host lifecycle fixture', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/sidecar-host-lifecycle.v1.json', 'utf8'));

    assert.deepEqual(validateSidecarHostLifecycleContract(fixture), {
      ok: true,
      errors: []
    });
    assert.equal(fixture.launcher.rendererLaunchAvailable, false);
    assert.equal(fixture.boundaries.genericShellRunnerAvailable, false);
  });

  it('defines attach and launch lifecycle state without exposing generic shell or path access', () => {
    const lifecycle = buildSidecarHostLifecycle({
      generatedAt: '2026-06-03T00:00:00.000Z',
      pid: 8765,
      attach: {
        state: 'attached',
        strategy: 'current-runtime-health',
        processId: 8765
      },
      launcher: {
        state: 'defined'
      }
    });

    assert.deepEqual(validateSidecarHostLifecycleContract(lifecycle), {
      ok: true,
      errors: []
    });
    assert.equal(lifecycle.contractName, 'sidecar-host-lifecycle.v1');
    assert.equal(lifecycle.lifecycle, 'attached');
    assert.equal(lifecycle.attach.state, 'attached');
    assert.equal(lifecycle.attach.healthRoute, '/api/health');
    assert.equal(lifecycle.launcher.commandId, 'symphony.console.sidecar.launch');
    assert.equal(lifecycle.launcher.nativeHostRequired, true);
    assert.equal(lifecycle.launcher.rendererLaunchAvailable, false);
    assert.deepEqual(lifecycle.launcher.allowedHosts, ['127.0.0.1', 'localhost']);
    assert.equal(lifecycle.launcher.allowedPortRange.min, 1024);
    assert.equal(lifecycle.launcher.allowedPortRange.max, 65535);
    assert.equal(lifecycle.boundaries.rendererShellExecutionAvailable, false);
    assert.equal(lifecycle.boundaries.genericShellRunnerAvailable, false);
    assert.equal(lifecycle.boundaries.arbitraryCommandAvailable, false);
    assert.equal(lifecycle.boundaries.arbitraryPathAvailable, false);
    assert.equal(lifecycle.boundaries.modelInvocationAvailable, false);
    assert.equal(lifecycle.boundaries.gitWriteAvailable, false);
    assert.equal(lifecycle.boundaries.releaseWriteAvailable, false);

    const drift = structuredClone(lifecycle);
    drift.boundaries.arbitraryCommandAvailable = true;

    assert.deepEqual(validateSidecarHostLifecycleContract(drift), {
      ok: false,
      errors: ['boundaries.arbitraryCommandAvailable must be false']
    });
  });

  it('carries the bridge through local runtime health and app-state snapshot', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v37-sidecar-bridge-'));

    try {
      await mkdir(join(root, '.git'));

      const health = await buildLocalRuntimeHealth({
        cwd: root,
        startedAt: '2026-06-03T00:00:00.000Z',
        generatedAt: '2026-06-03T00:00:01.000Z',
        pid: 4321,
        nowMs: Date.parse('2026-06-03T00:00:02.000Z')
      });

      assert.deepEqual(validateLocalRuntimeHealthContract(health), {
        ok: true,
        errors: []
      });
      assert.equal(health.sidecarHost.contractName, 'sidecar-host-lifecycle.v1');
      assert.equal(health.sidecarHost.attach.state, 'attached');
      assert.equal(health.sidecarHost.launcher.state, 'defined');
      assert.equal(health.sidecarHost.launcher.rendererLaunchAvailable, false);

      const snapshot = await buildAppStateSnapshot({
        cwd: root,
        generatedAt: '2026-06-03T00:00:01.000Z',
        startedAt: '2026-06-03T00:00:00.000Z',
        nowMs: Date.parse('2026-06-03T00:00:02.000Z')
      });

      assert.deepEqual(validateAppStateSnapshotContract(snapshot), {
        ok: true,
        errors: []
      });
      assert.equal(snapshot.runtime_health.sidecarHost.contractName, 'sidecar-host-lifecycle.v1');
      assert.equal(snapshot.runtime_health.sidecarHost.attach.sourceContract, 'local-runtime-health.v1');
      assert.equal(snapshot.runtime_health.sidecarHost.launcher.commandId, 'symphony.console.sidecar.launch');
      assert.equal(snapshot.boundaries.arbitraryCommandExecutionAvailable, false);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
