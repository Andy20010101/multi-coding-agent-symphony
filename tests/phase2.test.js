import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { PolicyEngine } from '../src/policy-engine.js';
import { CapabilityRegistry } from '../src/capability-registry.js';
import { buildContextPack } from '../src/context-builder.js';

describe('Phase 2 policy and context modules', () => {
  it('denies sensitive file access with a machine-readable reason', () => {
    const policy = new PolicyEngine({
      deniedPaths: ['.env', '.env.*', '**/secrets/**'],
      allowedCommands: ['pnpm test', 'pnpm check']
    });

    assert.deepEqual(policy.decide({
      action: 'read',
      target: '.env'
    }), {
      decision: 'deny',
      reason: 'sensitive-path',
      matchedRule: '.env'
    });
  });

  it('allows known safe test commands and records the matched rule', () => {
    const policy = new PolicyEngine({
      deniedPaths: ['.env'],
      allowedCommands: ['pnpm test', 'pnpm check']
    });

    assert.deepEqual(policy.decide({
      action: 'shell',
      command: 'pnpm test'
    }), {
      decision: 'allow',
      reason: 'allowed-command',
      matchedRule: 'pnpm test'
    });
  });

  it('stores and queries capability reports', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-capabilities-'));

    try {
      const registry = new CapabilityRegistry(root);
      const report = {
        adapterId: 'codex',
        cliName: 'codex',
        cliVersion: '0.1.0',
        supportedCommands: ['plan', 'implement', 'review'],
        modelProfiles: ['gpt-codex-default'],
        supportsNonInteractive: true,
        supportsResume: true,
        supportsCancel: true,
        supportsHooks: true,
        supportsMcp: true,
        supportsStructuredOutput: true,
        workspaceIsolation: 'git-worktree',
        logStrategy: 'session-event-log',
        version: '1'
      };

      await registry.register(report);

      assert.deepEqual(await registry.get('codex'), report);
      assert.deepEqual(await registry.findByCommand('implement'), [report]);
      assert.deepEqual(await registry.findByCommand('qa'), []);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('builds a minimal context pack from task, selected events, and artifact references', () => {
    const taskSpec = {
      id: 'task-123',
      source: 'github',
      repository: 'Andy20010101/multi-coding-agent-symphony',
      objective: 'Implement policy and context modules',
      acceptance: ['sensitive files are denied', 'safe tests are allowed'],
      version: '1'
    };

    const contextPack = buildContextPack({
      taskSpec,
      commandName: 'implement',
      events: [
        {
          id: 'evt-1',
          type: 'command.queued',
          timestamp: '2026-05-13T00:00:00.000Z',
          actor: 'orchestrator',
          payload: { command: 'implement' },
          version: '1',
          sessionId: 'session-123'
        }
      ],
      artifactRefs: [
        {
          taskId: 'task-123',
          artifactId: 'evidence-1',
          kind: 'evidence',
          uri: 'artifacts/task-123/evidence-1.json'
        }
      ]
    });

    assert.equal(contextPack.task.id, 'task-123');
    assert.equal(contextPack.task.objective, 'Implement policy and context modules');
    assert.equal(contextPack.commandName, 'implement');
    assert.deepEqual(contextPack.events.map((event) => event.id), ['evt-1']);
    assert.deepEqual(contextPack.artifactRefs.map((ref) => ref.artifactId), ['evidence-1']);
    assert.equal(Object.hasOwn(contextPack.artifactRefs[0], 'content'), false);
  });
});

