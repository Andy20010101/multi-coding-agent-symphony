import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  WorkspaceConflictError,
  WorkspaceManager
} from '../src/workspace-manager.js';
import { RouterScheduler } from '../src/router-scheduler.js';
import { verifyEvidence } from '../src/verifier.js';
import { classifyFailure } from '../src/failure-taxonomy.js';

const implementCommand = {
  name: 'implement',
  version: '1',
  allowedTools: ['read', 'write', 'shell', 'test'],
  workspacePolicy: 'primary-writer',
  doneCriteria: ['diff-created', 'tests-run', 'evidence-written'],
  evidenceSchema: 'implementation-evidence.v1'
};

const capabilityReports = [
  {
    adapterId: 'codex',
    cliName: 'codex',
    cliVersion: '0.130.0',
    supportedCommands: ['plan', 'implement', 'review', 'fix-ci', 'qa'],
    modelProfiles: ['gpt-codex-default'],
    supportsNonInteractive: true,
    supportsResume: true,
    supportsCancel: true,
    supportsHooks: true,
    supportsMcp: true,
    supportsStructuredOutput: true,
    workspaceIsolation: 'external-workspace',
    logStrategy: 'jsonl-stdout',
    version: '1'
  },
  {
    adapterId: 'kiro-cli',
    cliName: 'kiro-cli',
    cliVersion: '2.2.2',
    supportedCommands: ['plan', 'review', 'qa'],
    modelProfiles: ['claude-kiro-default'],
    supportsNonInteractive: true,
    supportsResume: true,
    supportsCancel: true,
    supportsHooks: true,
    supportsMcp: true,
    supportsStructuredOutput: true,
    workspaceIsolation: 'external-workspace',
    logStrategy: 'stdout',
    version: '1'
  }
];

describe('Phase 4 routing, workspace, and verification modules', () => {
  it('enforces one primary writer workspace per task', () => {
    const manager = new WorkspaceManager({ rootDirectory: '/tmp/mcas-workspaces' });

    const first = manager.allocate({
      taskId: 'task-123',
      role: 'primary-writer',
      adapterId: 'codex'
    });

    assert.equal(first.writable, true);
    assert.throws(
      () => manager.allocate({
        taskId: 'task-123',
        role: 'primary-writer',
        adapterId: 'claude-code'
      }),
      WorkspaceConflictError
    );
  });

  it('allows multiple isolated non-writable review workspaces', () => {
    const manager = new WorkspaceManager({ rootDirectory: '/tmp/mcas-workspaces' });

    manager.allocate({
      taskId: 'task-123',
      role: 'primary-writer',
      adapterId: 'codex'
    });
    const firstReview = manager.allocate({
      taskId: 'task-123',
      role: 'review',
      adapterId: 'claude-code'
    });
    const secondReview = manager.allocate({
      taskId: 'task-123',
      role: 'review',
      adapterId: 'kiro-cli'
    });

    assert.notEqual(firstReview.workspaceId, secondReview.workspaceId);
    assert.equal(firstReview.writable, false);
    assert.equal(secondReview.writable, false);
  });

  it('routes commands to capable adapters while honoring exclusions', () => {
    const scheduler = new RouterScheduler({ capabilityReports });

    assert.equal(scheduler.route({
      commandSpec: implementCommand
    }).adapterId, 'codex');

    assert.throws(() => scheduler.route({
      commandSpec: implementCommand,
      excludedAdapters: ['codex']
    }), /No capable adapter/);
  });

  it('plans retries from retryable failure taxonomy metadata', () => {
    const scheduler = new RouterScheduler({ capabilityReports });
    const failure = classifyFailure('adapter-crashed');

    assert.deepEqual(scheduler.planRetry({ failure }), {
      retry: true,
      nextCommand: 'qa',
      owner: 'adapter'
    });
  });

  it('rejects unverified model self-report as insufficient evidence', () => {
    assert.deepEqual(verifyEvidence({
      commandSpec: implementCommand,
      evidence: {
        command: 'implement',
        taskId: 'task-123',
        workspaceId: 'task-123-primary-writer-1',
        diffSummary: [],
        changedFiles: ['src/example.js'],
        checks: [],
        knownRisks: [],
        agentSummary: 'I ran the tests and everything passed.',
        version: '1'
      }
    }), {
      status: 'failed',
      reason: 'verification-insufficient',
      requiredEvidence: ['checks']
    });
  });

  it('accepts evidence with passing structured checks', () => {
    assert.deepEqual(verifyEvidence({
      commandSpec: implementCommand,
      evidence: {
        command: 'implement',
        taskId: 'task-123',
        workspaceId: 'task-123-primary-writer-1',
        diffSummary: [],
        changedFiles: ['src/example.js'],
        checks: [{ name: 'pnpm test', status: 'passed', output: 'tests passed' }],
        knownRisks: [],
        agentSummary: 'Implemented behavior.',
        version: '1'
      }
    }), {
      status: 'passed',
      reason: 'checks-passed',
      checks: [{ name: 'pnpm test', status: 'passed', output: 'tests passed' }]
    });
  });
});
