import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  REAL_CODEX_WRITER_SMOKE_FLAG,
  REAL_CODEX_SMOKE_FLAG,
  runCodexRealSmoke,
  runCodexWriterSmoke
} from '../src/codex-real-smoke.js';

class FakeSmokeAdapter {
  constructor(evidence) {
    this.evidence = evidence;
    this.calls = [];
  }

  async start(input) {
    this.calls.push(input);

    return {
      runId: 'fake-run',
      adapterId: 'codex',
      status: 'completed',
      exitCode: 0
    };
  }

  async *streamEvents() {
    yield { type: 'adapter.started' };
    yield { type: 'command.finished' };
  }

  async collectEvidence() {
    return this.evidence;
  }
}

describe('Codex real model smoke script', () => {
  it('uses a strict schema accepted by Codex structured output', async () => {
    const schemaPath = fileURLToPath(new URL('../schemas/evidence-package.schema.json', import.meta.url));
    const schema = JSON.parse(await readFile(schemaPath, 'utf8'));

    assert.equal(schema.additionalProperties, false);
    assert.equal(schema.required.includes('diffSummary'), true);
    assert.equal(schema.properties.checks.items.additionalProperties, false);
    assert.equal(schema.properties.checks.items.required.includes('output'), true);
  });

  it('skips real model invocation unless explicitly gated on', async () => {
    const adapter = new FakeSmokeAdapter({});
    const result = await runCodexRealSmoke({
      adapter,
      env: {},
      workspace: '/work/repo'
    });

    assert.equal(result.skipped, true);
    assert.match(result.reason, /MCAS_RUN_REAL_CODEX=1/);
    assert.equal(adapter.calls.length, 0);
  });

  it('runs a read-only real-mode smoke path and verifies structured evidence', async () => {
    const adapter = new FakeSmokeAdapter({
      command: 'qa',
      taskId: 'model-task',
      workspaceId: 'model-workspace',
      diffSummary: [],
      changedFiles: [],
      checks: [{ name: 'codex-real-smoke', status: 'passed', output: 'smoke passed' }],
      knownRisks: [],
      agentSummary: 'Read package.json and README.md.',
      version: '1'
    });
    const result = await runCodexRealSmoke({
      adapter,
      env: {
        [REAL_CODEX_SMOKE_FLAG]: '1'
      },
      workspace: '/work/repo',
      timeoutMs: 1000
    });

    assert.equal(result.skipped, false);
    assert.equal(result.verification.status, 'passed');
    assert.equal(adapter.calls[0].executionMode, 'real');
    assert.equal(adapter.calls[0].commandSpec.workspacePolicy, 'review-only');
    assert.equal(adapter.calls[0].modelProfile, 'codex-config-default');
    assert.equal(adapter.calls[0].timeoutMs, 1000);
  });

  it('passes MCAS_CODEX_MODEL through to the adapter when provided', async () => {
    const adapter = new FakeSmokeAdapter({
      command: 'qa',
      taskId: 'task',
      workspaceId: '/work/repo',
      diffSummary: [],
      changedFiles: [],
      checks: [{ name: 'codex-real-smoke', status: 'passed', output: 'smoke passed' }],
      knownRisks: [],
      agentSummary: 'Read package metadata.',
      version: '1'
    });

    await runCodexRealSmoke({
      adapter,
      env: {
        [REAL_CODEX_SMOKE_FLAG]: '1',
        MCAS_CODEX_MODEL: 'gpt-5.5'
      },
      workspace: '/work/repo'
    });

    assert.equal(adapter.calls[0].modelProfile, 'gpt-5.5');
  });

  it('skips real writer smoke unless explicitly gated on', async () => {
    const adapter = new FakeSmokeAdapter({});
    const result = await runCodexWriterSmoke({
      adapter,
      env: {},
      workspace: '/work/writer-smoke'
    });

    assert.equal(result.skipped, true);
    assert.match(result.reason, /MCAS_RUN_REAL_CODEX_WRITER=1/);
    assert.equal(adapter.calls.length, 0);
  });

  it('runs an isolated writer smoke path with primary-writer policy', async () => {
    const adapter = new FakeSmokeAdapter({
      command: 'implement',
      taskId: 'writer-task',
      workspaceId: 'writer-workspace',
      diffSummary: ['Created writer smoke file.'],
      changedFiles: ['codex-writer-smoke.txt'],
      checks: [{ name: 'codex-writer-smoke', status: 'passed', output: 'writer smoke passed' }],
      knownRisks: [],
      agentSummary: 'Created and verified the smoke file.',
      version: '1'
    });
    const result = await runCodexWriterSmoke({
      adapter,
      env: {
        [REAL_CODEX_WRITER_SMOKE_FLAG]: '1'
      },
      workspace: '/work/writer-smoke',
      timeoutMs: 1000
    });

    assert.equal(result.skipped, false);
    assert.equal(result.verification.status, 'passed');
    assert.equal(adapter.calls[0].executionMode, 'real');
    assert.equal(adapter.calls[0].commandSpec.name, 'implement');
    assert.equal(adapter.calls[0].commandSpec.workspacePolicy, 'primary-writer');
    assert.equal(adapter.calls[0].modelProfile, 'codex-config-default');
    assert.equal(adapter.calls[0].workspace, '/work/writer-smoke');
    assert.equal(adapter.calls[0].timeoutMs, 1000);
  });

  it('creates an isolated temp git workspace for writer smoke by default', async () => {
    const adapter = new FakeSmokeAdapter({
      command: 'implement',
      taskId: 'writer-task',
      workspaceId: 'writer-workspace',
      diffSummary: ['Created writer smoke file.'],
      changedFiles: ['codex-writer-smoke.txt'],
      checks: [{ name: 'codex-writer-smoke', status: 'passed', output: 'writer smoke passed' }],
      knownRisks: [],
      agentSummary: 'Created and verified the smoke file.',
      version: '1'
    });
    let result;

    try {
      result = await runCodexWriterSmoke({
        adapter,
        env: {
          [REAL_CODEX_WRITER_SMOKE_FLAG]: '1'
        },
        timeoutMs: 1000
      });

      assert.match(result.workspace, /mcas-codex-writer-smoke-/);
      assert.equal(adapter.calls[0].workspace, result.workspace);
      assert.equal(adapter.calls[0].contextPack.task.repository, 'isolated-temp-workspace');
      assert.match(await readFile(join(result.workspace, 'README.md'), 'utf8'), /Codex Writer Smoke/);
      assert.match(await readFile(join(result.workspace, '.git', 'HEAD'), 'utf8'), /refs\/heads/);
    } finally {
      if (result?.workspace) {
        await rm(result.workspace, { recursive: true, force: true });
      }
    }
  });
});
