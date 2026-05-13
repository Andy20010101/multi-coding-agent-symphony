import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { ArtifactStore } from '../src/artifact-store.js';
import { CodexAdapter } from '../src/adapters/codex-adapter.js';
import { Orchestrator, PolicyDeniedError } from '../src/orchestrator.js';
import { PolicyEngine } from '../src/policy-engine.js';
import { RouterScheduler } from '../src/router-scheduler.js';
import { SessionEventLog } from '../src/session-event-log.js';
import { WorkspaceManager } from '../src/workspace-manager.js';

describe('Phase 9 security, redaction, and policy enforcement', () => {
  it('redacts secret-looking artifact output before persistence', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-security-artifacts-'));

    try {
      const store = new ArtifactStore(root);
      const artifact = {
        command: 'qa',
        stdout: 'GITHUB_TOKEN=ghp_abcdefghijklmnopqrstuvwxyz1234567890 read /repo/.env.local',
        nested: {
          auth: 'Authorization: Bearer sk-abcdefghijklmnopqrstuvwxyz123456'
        },
        version: '1'
      };

      await store.writeArtifact('task-123', 'qa-evidence', artifact);

      const raw = await readFile(join(root, 'task-123', 'qa-evidence.json'), 'utf8');
      const stored = await store.readArtifact('task-123', 'qa-evidence');

      assert.doesNotMatch(raw, /ghp_abcdefghijklmnopqrstuvwxyz1234567890/);
      assert.doesNotMatch(raw, /sk-abcdefghijklmnopqrstuvwxyz123456/);
      assert.doesNotMatch(raw, /\.env/);
      assert.match(raw, /\[REDACTED_TOKEN\]/);
      assert.match(raw, /\[REDACTED_PATH\]/);
      assert.equal(stored.stdout, 'GITHUB_TOKEN=[REDACTED_TOKEN] read [REDACTED_PATH]');
      assert.equal(stored.nested.auth, 'Authorization: Bearer [REDACTED_TOKEN]');
      assert.equal(
        artifact.stdout,
        'GITHUB_TOKEN=ghp_abcdefghijklmnopqrstuvwxyz1234567890 read /repo/.env.local'
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('redacts secret-looking session event payloads before persistence', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-security-events-'));

    try {
      const log = new SessionEventLog(root, 'session-123');
      const appended = await log.append({
        id: 'evt-1',
        type: 'tool.observed',
        timestamp: '2026-05-13T00:00:00.000Z',
        actor: 'adapter',
        payload: {
          output: 'curl -H "Authorization: Bearer sk-abcdefghijklmnopqrstuvwxyz123456" /tmp/project/.env',
          files: ['/tmp/project/.env', 'src/index.js']
        },
        version: '1'
      });
      const raw = await readFile(join(root, 'session-123.json'), 'utf8');
      const events = await log.readAll();

      assert.doesNotMatch(raw, /sk-abcdefghijklmnopqrstuvwxyz123456/);
      assert.doesNotMatch(raw, /\.env/);
      assert.equal(
        appended.payload.output,
        'curl -H "Authorization: Bearer [REDACTED_TOKEN]" [REDACTED_PATH]'
      );
      assert.deepEqual(events[0].payload.files, ['[REDACTED_PATH]', 'src/index.js']);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('denies default sensitive paths before adapter start', async () => {
    const policy = new PolicyEngine();

    assert.deepEqual(policy.decide({
      action: 'read',
      target: '/repo/.env.local'
    }), {
      decision: 'deny',
      reason: 'sensitive-path',
      matchedRule: '.env.*'
    });
    assert.deepEqual(policy.decide({
      action: 'write',
      target: '/home/user/.ssh/id_rsa'
    }), {
      decision: 'deny',
      reason: 'sensitive-path',
      matchedRule: '**/.ssh/**'
    });
  });

  it('blocks sensitive path policy requests before adapter start', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-security-policy-'));

    try {
      const adapter = new CapturingAdapter();
      const report = await adapter.probe();
      const orchestrator = new Orchestrator({
        artifactStore: new ArtifactStore(join(root, 'artifacts')),
        eventLog: new SessionEventLog(join(root, 'events'), 'session-123'),
        workspaceManager: new WorkspaceManager({ rootDirectory: join(root, 'workspaces') }),
        scheduler: new RouterScheduler({ capabilityReports: [report] }),
        policyEngine: new PolicyEngine(),
        adapters: {
          codex: adapter
        }
      });

      await assert.rejects(
        () => orchestrator.runCommand({
          taskSpec,
          commandSpec,
          policyRequests: [{
            action: 'read',
            target: '/repo/.env'
          }]
        }),
        PolicyDeniedError
      );
      assert.equal(adapter.starts.length, 0);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('allows shell commands through exact and pattern policy rules', () => {
    const policy = new PolicyEngine({
      allowedCommands: ['pnpm test', 'rm -rf tmp/generated'],
      deniedCommands: ['rm -rf tmp/generated'],
      allowedCommandPatterns: ['pnpm --filter * test', 'pnpm --filter * exec *'],
      deniedCommandPatterns: ['pnpm --filter * exec *']
    });

    assert.deepEqual(policy.decide({
      action: 'shell',
      command: 'pnpm test'
    }), {
      decision: 'allow',
      reason: 'allowed-command',
      matchedRule: 'pnpm test'
    });
    assert.deepEqual(policy.decide({
      action: 'shell',
      command: 'rm -rf tmp/generated'
    }), {
      decision: 'deny',
      reason: 'denied-command',
      matchedRule: 'rm -rf tmp/generated'
    });
    assert.deepEqual(policy.decide({
      action: 'shell',
      command: 'pnpm --filter packages/orchestrator test'
    }), {
      decision: 'allow',
      reason: 'allowed-command-pattern',
      matchedRule: 'pnpm --filter * test'
    });
    assert.deepEqual(policy.decide({
      action: 'shell',
      command: 'pnpm --filter packages/orchestrator exec sh'
    }), {
      decision: 'deny',
      reason: 'denied-command-pattern',
      matchedRule: 'pnpm --filter * exec *'
    });
    assert.deepEqual(policy.decide({
      action: 'shell',
      command: 'pnpm --filter packages/orchestrator lint'
    }), {
      decision: 'deny',
      reason: 'command-not-allowed',
      matchedRule: null
    });
  });

  it('enforces configured network policy decisions', () => {
    const policy = new PolicyEngine({
      network: 'restricted',
      allowedNetworkHosts: ['api.github.com'],
      deniedNetworkHosts: ['*.internal']
    });

    assert.deepEqual(policy.decide({
      action: 'network',
      target: 'https://api.github.com/repos'
    }), {
      decision: 'allow',
      reason: 'network-host-allowed',
      matchedRule: 'api.github.com'
    });
    assert.deepEqual(policy.decide({
      action: 'network',
      target: 'https://build.internal/jobs'
    }), {
      decision: 'deny',
      reason: 'network-denied',
      matchedRule: '*.internal'
    });
    assert.deepEqual(new PolicyEngine({ network: 'disabled' }).decide({
      action: 'network',
      target: 'https://api.github.com'
    }), {
      decision: 'deny',
      reason: 'network-denied',
      matchedRule: 'disabled'
    });
  });

  it('blocks denied network requests before adapter start and records allowed decisions', async () => {
    const deniedRoot = await mkdtemp(join(tmpdir(), 'mcas-security-network-deny-'));
    const allowedRoot = await mkdtemp(join(tmpdir(), 'mcas-security-network-allow-'));
    const networkRequest = {
      action: 'network',
      target: 'https://api.github.com/repos'
    };

    try {
      const deniedAdapter = new CapturingAdapter();
      const deniedReport = await deniedAdapter.probe();
      const deniedOrchestrator = new Orchestrator({
        artifactStore: new ArtifactStore(join(deniedRoot, 'artifacts')),
        eventLog: new SessionEventLog(join(deniedRoot, 'events'), 'session-123'),
        workspaceManager: new WorkspaceManager({ rootDirectory: join(deniedRoot, 'workspaces') }),
        scheduler: new RouterScheduler({ capabilityReports: [deniedReport] }),
        policyEngine: new PolicyEngine({ network: 'disabled' }),
        adapters: {
          codex: deniedAdapter
        }
      });

      await assert.rejects(
        () => deniedOrchestrator.runCommand({
          taskSpec,
          commandSpec: networkCommandSpec,
          policyRequests: [networkRequest]
        }),
        PolicyDeniedError
      );
      assert.equal(deniedAdapter.starts.length, 0);

      const allowedAdapter = new CapturingAdapter();
      const allowedReport = await allowedAdapter.probe();
      const allowedEventLog = new SessionEventLog(join(allowedRoot, 'events'), 'session-allowed');
      const allowedOrchestrator = new Orchestrator({
        artifactStore: new ArtifactStore(join(allowedRoot, 'artifacts')),
        eventLog: allowedEventLog,
        workspaceManager: new WorkspaceManager({ rootDirectory: join(allowedRoot, 'workspaces') }),
        scheduler: new RouterScheduler({ capabilityReports: [allowedReport] }),
        policyEngine: new PolicyEngine({
          network: 'restricted',
          allowedNetworkHosts: ['api.github.com']
        }),
        adapters: {
          codex: allowedAdapter
        }
      });

      await allowedOrchestrator.runCommand({
        taskSpec: {
          ...taskSpec,
          id: 'task-security-policy-network'
        },
        commandSpec: networkCommandSpec,
        policyRequests: [networkRequest]
      });

      const policyEvent = (await allowedEventLog.readAll()).find((event) => {
        return event.type === 'policy.decision';
      });

      assert.deepEqual(policyEvent.payload, {
        request: networkRequest,
        decision: {
          decision: 'allow',
          reason: 'network-host-allowed',
          matchedRule: 'api.github.com'
        }
      });
      assert.equal(allowedAdapter.starts.length, 1);
      assert.deepEqual(allowedAdapter.starts[0].policyDecisions, [policyEvent.payload.decision]);
    } finally {
      await rm(deniedRoot, { recursive: true, force: true });
      await rm(allowedRoot, { recursive: true, force: true });
    }
  });
});

const taskSpec = {
  id: 'task-security-policy',
  source: 'manual',
  repository: 'Andy20010101/multi-coding-agent-symphony',
  objective: 'Verify policy gate',
  acceptance: ['adapter is not started'],
  version: '1'
};

const commandSpec = {
  name: 'implement',
  version: '1',
  allowedTools: ['read', 'write', 'shell', 'test'],
  workspacePolicy: 'primary-writer',
  doneCriteria: ['diff-created', 'tests-run', 'evidence-written'],
  evidenceSchema: 'implementation-evidence.v1'
};

const networkCommandSpec = {
  ...commandSpec,
  allowedTools: [...commandSpec.allowedTools, 'network']
};

class CapturingAdapter extends CodexAdapter {
  constructor() {
    super({ cliVersion: 'synthetic-policy-test' });
    this.starts = [];
  }

  async start(input) {
    this.starts.push(structuredClone(input));
    return super.start(input);
  }
}
