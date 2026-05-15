/**
 * Targeted tests to push orchestrator.js from 69.1% to ≥70%.
 * Focus on the smallest set of mutants needed to cross the threshold.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { ArtifactStore } from '../src/artifact-store.js';
import { SessionEventLog } from '../src/session-event-log.js';
import { WorkspaceManager } from '../src/workspace-manager.js';
import { RouterScheduler } from '../src/router-scheduler.js';
import { Orchestrator } from '../src/orchestrator.js';
import { CodexAdapter } from '../src/adapters/codex-adapter.js';

const taskSpec = {
  id: 'task-orch-targeted',
  source: 'manual',
  repository: 'owner/repo',
  objective: 'targeted test',
  acceptance: ['done'],
  version: '1'
};

const implementSpec = {
  name: 'implement',
  version: '1',
  allowedTools: ['read', 'write', 'shell', 'test'],
  workspacePolicy: 'primary-writer',
  doneCriteria: ['diff-created', 'tests-run', 'evidence-written'],
  evidenceSchema: 'implementation-evidence.v1'
};

const reviewSpec = {
  name: 'review',
  version: '1',
  allowedTools: ['read', 'shell', 'test'],
  workspacePolicy: 'review-only',
  doneCriteria: ['review-completed', 'evidence-written'],
  evidenceSchema: 'review-evidence.v1'
};

class PassingAdapter extends CodexAdapter {
  async collectEvidence(handle) {
    return {
      command: handle.command,
      taskId: handle.taskId,
      workspaceId: handle.workspaceId,
      diffSummary: [],
      changedFiles: handle.command === 'implement' ? ['src/foo.js'] : [],
      checks: [{ name: 'test', status: 'passed', command: 'pnpm test', exitCode: 0, output: 'ok' }],
      knownRisks: [],
      agentSummary: 'done',
      ...(handle.command === 'review' ? { noFindingRationale: 'no issues' } : {}),
      version: '1'
    };
  }
}

async function buildOrchestrator(root) {
  const adapter = new PassingAdapter({ cliVersion: '0.130.0' });
  const report = await adapter.probe();
  return new Orchestrator({
    artifactStore: new ArtifactStore(join(root, 'artifacts')),
    eventLog: new SessionEventLog(join(root, 'events'), 'session-1'),
    workspaceManager: new WorkspaceManager({ rootDirectory: join(root, 'workspaces') }),
    scheduler: new RouterScheduler({ capabilityReports: [report] }),
    adapters: { codex: adapter }
  });
}

describe('orchestrator.js targeted mutant killers', () => {

  // ── L150: sourceWorkspaceId && workspaceRole !== 'primary-writer' ─────────
  // Kills: LogicalOperator(||), ConditionalExpression(true/false)
  // Test: reviewer with sourceWorkspaceId uses cloneFrom, not allocate

  it('reviewer with sourceWorkspaceId clones workspace from writer', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-orch-targeted-'));
    try {
      const orchestrator = await buildOrchestrator(root);

      // First run writer to get a workspace
      const writerResult = await orchestrator.runCommand({
        taskSpec,
        commandSpec: implementSpec
      });

      // Then run reviewer with sourceWorkspaceId
      const reviewerResult = await orchestrator.runCommand({
        taskSpec,
        commandSpec: reviewSpec,
        sourceWorkspaceId: writerResult.workspace.workspaceId
      });

      // Reviewer workspace should reference the writer workspace
      assert.equal(reviewerResult.workspace.sourceWorkspaceId, writerResult.workspace.workspaceId);
      assert.equal(reviewerResult.workspace.writable, false);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('primary-writer does not clone even when sourceWorkspaceId is provided', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-orch-targeted-writer-'));
    try {
      const orchestrator = await buildOrchestrator(root);

      // Run first writer
      const first = await orchestrator.runCommand({ taskSpec, commandSpec: implementSpec });

      // Run second writer with sourceWorkspaceId — should allocate fresh, not clone
      const second = await orchestrator.runCommand({
        taskSpec: { ...taskSpec, id: 'task-2' },
        commandSpec: implementSpec,
        sourceWorkspaceId: first.workspace.workspaceId
      });

      // primary-writer always gets a fresh writable workspace
      assert.equal(second.workspace.writable, true);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  // ── L161: typeof this.eventLog.readAll === 'function' ────────────────────
  // Kills: EqualityOperator(!=), ConditionalExpression(true/false)
  // Test: events are included in context pack when eventLog.readAll exists

  it('prior events are passed to adapter context pack', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-orch-targeted-events-'));
    try {
      const adapter = new PassingAdapter({ cliVersion: '0.130.0' });
      const starts = [];
      const origStart = adapter.start.bind(adapter);
      adapter.start = async (input) => {
        starts.push(input);
        return origStart(input);
      };

      const report = await adapter.probe();
      const orchestrator = new Orchestrator({
        artifactStore: new ArtifactStore(join(root, 'artifacts')),
        eventLog: new SessionEventLog(join(root, 'events'), 'session-1'),
        workspaceManager: new WorkspaceManager({ rootDirectory: join(root, 'workspaces') }),
        scheduler: new RouterScheduler({ capabilityReports: [report] }),
        adapters: { codex: adapter }
      });

      await orchestrator.runCommand({ taskSpec, commandSpec: implementSpec });

      // Second run should have prior events in context
      await orchestrator.runCommand({
        taskSpec: { ...taskSpec, id: 'task-2' },
        commandSpec: implementSpec
      });

      // Second start should have events from first run
      assert.ok(starts.length >= 2);
      const secondContextPack = starts[1].contextPack;
      assert.ok(Array.isArray(secondContextPack.events));
      assert.ok(secondContextPack.events.length > 0, 'second run should have prior events');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  // ── L143/L174: modelProfile ?? route.modelProfile ?? route.modelProfiles[0] ─
  // Kills: LogicalOperator mutations on model profile selection

  it('explicit modelProfile is used when provided', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-orch-targeted-model-'));
    try {
      const adapter = new PassingAdapter({ cliVersion: '0.130.0' });
      const starts = [];
      const origStart = adapter.start.bind(adapter);
      adapter.start = async (input) => { starts.push(input); return origStart(input); };

      const report = await adapter.probe();
      const orchestrator = new Orchestrator({
        artifactStore: new ArtifactStore(join(root, 'artifacts')),
        eventLog: new SessionEventLog(join(root, 'events'), 'session-1'),
        workspaceManager: new WorkspaceManager({ rootDirectory: join(root, 'workspaces') }),
        scheduler: new RouterScheduler({ capabilityReports: [report] }),
        adapters: { codex: adapter }
      });

      await orchestrator.runCommand({
        taskSpec,
        commandSpec: implementSpec,
        modelProfile: 'custom-model-profile'
      });

      assert.equal(starts[0].modelProfile, 'custom-model-profile');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  // ── L96, L131, L139: ObjectLiteral {} mutations ───────────────────────────
  // Kills: route decision artifact fields replaced with {}

  it('route decision artifact has adapterId and command fields', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-orch-targeted-route-'));
    try {
      const orchestrator = await buildOrchestrator(root);
      const result = await orchestrator.runCommand({ taskSpec, commandSpec: implementSpec });

      const artifactStore = new ArtifactStore(join(root, 'artifacts'));
      const routeDecision = await artifactStore.readArtifact(taskSpec.id, result.routeDecisionArtifactId);

      assert.equal(routeDecision.adapterId, 'codex');
      assert.equal(routeDecision.command, 'implement');
      assert.ok(typeof routeDecision.reason === 'string' && routeDecision.reason.length > 0);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
