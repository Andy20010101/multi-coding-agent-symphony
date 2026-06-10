import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

import {
  SESSION_CONTEXT_CONTRACT_NAME,
  buildGoalSupervisorAppReadModel,
  buildGoalSupervisorAppReadModelFromContracts,
  buildSessionContext
} from '../src/symphony/goal-supervisor/index.js';

const FIXTURE_DIR = new URL('../fixtures/contracts/goal-supervisor/session-context/', import.meta.url);
const CODEX_ACTIVE = fileURLToPath(new URL('codex-thread-active.jsonl', FIXTURE_DIR));
const CLAUDE_ACTIVE = fileURLToPath(new URL('claude-thread-active.jsonl', FIXTURE_DIR));
const CODEX_MISSING_FIELDS = fileURLToPath(new URL('codex-thread-missing-fields.jsonl', FIXTURE_DIR));

describe('v44.3 goal supervisor session hook runtime', () => {
  it('normalizes Codex and Claude JSONL into sessionContext.v1 without raw transcript text', async () => {
    const context = await buildSessionContext({
      threadId: 'thread-session-1',
      generatedAt: '2026-06-10T03:26:00.000Z',
      codexFiles: [CODEX_ACTIVE],
      claudeFiles: [CLAUDE_ACTIVE]
    });

    assert.equal(context.contractName, SESSION_CONTEXT_CONTRACT_NAME);
    assert.equal(context.readOnly, true);
    assert.equal(context.willMutate, false);
    assert.equal(context.transcriptAvailability, 'readable');
    assert.equal(context.exchangeCount, 5);
    assert.deepEqual(context.sessionSourceSummaries.map((source) => source.provider), ['codex', 'claude']);
    assert.equal(context.latestToolCall.name, 'Bash');
    assert.equal(context.latestToolCall.status, 'completed');
    assert.equal(context.tokenUsage.status, 'available');
    assert.equal(context.tokenUsage.inputTokens, 2100);
    assert.equal(context.tokenUsage.outputTokens, 500);
    assert.equal(context.contextUtilization.status, 'available');
    assert.equal(context.contextUtilization.usedTokens, 1100);
    assert.equal(context.resultBlockEvidence.status, 'present');
    assertNoRawTranscriptText(context);
  });

  it('marks recent and stale transcripts separately from transcript availability', async () => {
    const recent = await buildSessionContext({
      threadId: 'thread-session-1',
      generatedAt: '2026-06-10T03:26:00.000Z',
      staleAfterMs: 10 * 60 * 1000,
      codexFiles: [CODEX_ACTIVE],
      claudeFiles: []
    });
    const stale = await buildSessionContext({
      threadId: 'thread-session-1',
      generatedAt: '2026-06-10T04:30:00.000Z',
      staleAfterMs: 10 * 60 * 1000,
      codexFiles: [CODEX_ACTIVE],
      claudeFiles: []
    });

    assert.equal(recent.transcriptAvailability, 'readable');
    assert.equal(recent.staleTranscriptState.stale, false);
    assert.equal(stale.transcriptAvailability, 'readable');
    assert.equal(stale.staleTranscriptState.stale, true);
    assert.equal(stale.staleTranscriptState.reason, 'latest-session-turn-exceeded-stale-threshold');
  });

  it('keeps unknown token usage and context utilization as missing', async () => {
    const context = await buildSessionContext({
      threadId: 'thread-missing-fields',
      generatedAt: '2026-06-10T03:05:00.000Z',
      codexFiles: [CODEX_MISSING_FIELDS],
      claudeFiles: []
    });

    assert.equal(context.transcriptAvailability, 'readable');
    assert.deepEqual(context.tokenUsage, {
      status: 'missing',
      inputTokens: 'missing',
      outputTokens: 'missing',
      totalTokens: 'missing'
    });
    assert.deepEqual(context.contextUtilization, {
      status: 'missing',
      usedTokens: 'missing',
      maxTokens: 'missing',
      ratio: 'missing'
    });
    assert.equal(context.latestToolCall, null);
  });

  it('reports missing transcripts without scanning provider sessions when no active thread is known', async () => {
    const context = await buildSessionContext({
      generatedAt: '2026-06-10T03:05:00.000Z',
      codexFiles: [CODEX_ACTIVE],
      claudeFiles: [CLAUDE_ACTIVE]
    });

    assert.equal(context.transcriptAvailability, 'missing');
    assert.equal(context.missingTranscriptState.missing, true);
    assert.equal(context.missingTranscriptState.reason, 'no-active-thread-id');
    assert.equal(context.exchangeCount, 0);
  });

  it('feeds normalized session context into the app read model pipeline', async () => {
    const model = await buildGoalSupervisorAppReadModelFromContracts({
      goalId: 'v19-fixture',
      generatedAt: '2026-06-10T03:26:00.000Z',
      supervisorObservability: {
        contractName: 'goal-supervisor-observability.v1',
        generatedAt: '2026-06-10T03:26:00.000Z',
        daemon: { state: 'external-orchestration-owner' },
        activeChild: {
          state: 'active-child-present',
          leaseId: 'lease-session-1',
          threadId: 'thread-session-1',
          startedAt: '2026-06-10T03:00:00.000Z'
        }
      },
      sessionHookOptions: {
        codexFiles: [CODEX_ACTIVE],
        claudeFiles: [CLAUDE_ACTIVE]
      }
    });

    assert.ok(model.goalSnapshot.sourceContracts.includes(SESSION_CONTEXT_CONTRACT_NAME));
    assert.equal(model.contextStatus.transcriptAvailability, 'readable');
    assert.equal(model.contextStatus.latestToolCall.name, 'Bash');
    assert.equal(model.contextStatus.tokenUsage.totalTokens, 2600);
    assert.equal(model.contextStatus.contextUtilization.ratio, 0.055);
    assert.equal(model.contextStatus.resultBlockEvidence.present, true);
    assertNoRawTranscriptText(model);
  });

  it('uses missing session context to block an active lease with no transcript', () => {
    const model = buildGoalSupervisorAppReadModel({
      goalId: 'v44-3-app-contract-context-supervisor',
      state: {
        goalId: 'v44-3-app-contract-context-supervisor',
        active: {
          status: 'thread-active',
          threadId: 'thread-missing',
          taskId: 'task-3',
          role: 'worker',
          phase: 'implement',
          updatedAt: '2026-06-10T03:00:00.000Z'
        }
      },
      sessionContext: {
        transcriptAvailability: 'missing',
        missingTranscriptState: {
          missing: true,
          reason: 'no-readable-session-transcript'
        }
      },
      nowMs: Date.parse('2026-06-10T03:05:00.000Z')
    });

    assert.equal(model.recommendedNextAction.actionId, 'block');
    assert.equal(model.recommendedNextAction.reason, 'no-readable-session-transcript');
  });
});

function assertNoRawTranscriptText(value) {
  const serialized = JSON.stringify(value);

  assert.equal(serialized.includes('sanitized user request'), false);
  assert.equal(serialized.includes('sanitized assistant update'), false);
  assert.equal(serialized.includes('RESULT_BLOCK_START'), false);
  assert.equal(serialized.includes('RESULT_BLOCK_END'), false);
  assert.equal(serialized.includes('pnpm check'), false);
}
