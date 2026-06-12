import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { chmod, mkdir, mkdtemp, rm, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  SESSION_CONTEXT_CONTRACT_NAME,
  SESSION_SOURCE_INVENTORY_CONTRACT_NAME,
  buildGoalSupervisorAppReadModel,
  buildGoalSupervisorAppReadModelFromContracts,
  buildSessionContext,
  buildSessionSourceInventory
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

describe('v49 session source inventory contract', () => {
  it('inventories bounded Codex and Claude sources without exposing transcript content', async (t) => {
    const temp = await temporaryDirectory(t);
    const codexRoot = join(temp.path, 'codex', 'sessions');
    const claudeRoot = join(temp.path, 'claude', 'projects');

    await writeJsonl(join(codexRoot, '2026', '06', '12', 'codex-newest.jsonl'), {
      timestamp: '2026-06-12T01:00:00.000Z',
      message: { role: 'user', content: 'do not expose secret transcript text' }
    }, '2026-06-12T01:00:00.000Z');
    await writeJsonl(join(codexRoot, '2026', '06', '11', 'codex-middle.jsonl'), {
      timestamp: '2026-06-11T01:00:00.000Z'
    }, '2026-06-11T01:00:00.000Z');
    await writeJsonl(join(codexRoot, '2026', '06', '10', 'codex-oldest.jsonl'), {
      timestamp: '2026-06-10T01:00:00.000Z'
    }, '2026-06-10T01:00:00.000Z');
    await writeJsonl(join(codexRoot, 'ignored-flat.jsonl'), {
      timestamp: '2026-06-12T02:00:00.000Z'
    }, '2026-06-12T02:00:00.000Z');
    await writeJsonl(join(claudeRoot, 'project-a', 'claude-readable.jsonl'), {
      timestamp: '2026-06-12T01:30:00.000Z'
    }, '2026-06-12T01:30:00.000Z');

    const inventory = await buildSessionSourceInventory({
      generatedAt: '2026-06-12T02:00:00.000Z',
      staleAfterMs: 24 * 60 * 60 * 1000,
      maxFilesPerProvider: 2,
      codexRoot,
      claudeRoot
    });

    assert.equal(inventory.contractName, SESSION_SOURCE_INVENTORY_CONTRACT_NAME);
    assert.equal(inventory.readOnly, true);
    assert.equal(inventory.willMutate, false);
    assert.equal(inventory.scanScope, 'bounded-provider-session-roots');
    assert.equal(inventory.maxFilesPerProvider, 2);
    assert.equal(inventory.boundaries.frontendMayScanFolders, false);
    assert.equal(inventory.boundaries.exposesRawTranscript, false);
    assert.equal(inventory.boundaries.launchesProvider, false);

    const codex = providerByName(inventory, 'codex');
    assert.equal(codex.rootDisplayPath, '~/.codex/sessions');
    assert.equal(codex.pattern, '~/.codex/sessions/YYYY/MM/DD/*.jsonl');
    assert.equal(codex.state, 'degraded');
    assert.equal(codex.candidateFileCount, 2);
    assert.equal(codex.readableFileCount, 2);
    assert.equal(codex.latestSessionRef, 'codex:2026/06/12/codex-newest.jsonl');
    assert.deepEqual(codex.degradedReasons, ['max-files-per-provider-reached']);
    assert.equal(codex.sourceSummary.readState, 'readable');
    assert.equal(codex.sourceSummary.scannedFileCount, 2);

    const claude = providerByName(inventory, 'claude');
    assert.equal(claude.pattern, '~/.claude/projects/**/*.jsonl');
    assert.equal(claude.state, 'available');
    assert.equal(claude.sourceSummary.readState, 'readable');
    assert.equal(claude.latestSessionRef, 'claude:project-a/claude-readable.jsonl');

    const serialized = JSON.stringify(inventory);
    assert.equal(serialized.includes(temp.path), false);
    assert.equal(serialized.includes('do not expose secret transcript text'), false);
  });

  it('reports missing source roots as inventory state instead of throwing', async (t) => {
    const temp = await temporaryDirectory(t);
    const inventory = await buildSessionSourceInventory({
      generatedAt: '2026-06-12T02:00:00.000Z',
      codexRoot: join(temp.path, 'missing-codex'),
      claudeRoot: join(temp.path, 'missing-claude')
    });

    assert.equal(inventory.summary.state, 'missing');
    assert.deepEqual(inventory.providers.map((provider) => provider.state), ['missing', 'missing']);
    assert.deepEqual(providerByName(inventory, 'codex').degradedReasons, ['source-root-missing']);
  });

  it('marks stale readable sources separately from missing and unreadable sources', async (t) => {
    const temp = await temporaryDirectory(t);
    const codexRoot = join(temp.path, 'codex', 'sessions');
    const claudeRoot = join(temp.path, 'claude', 'projects');

    await writeJsonl(join(codexRoot, '2026', '06', '01', 'stale.jsonl'), {
      timestamp: '2026-06-01T01:00:00.000Z'
    }, '2026-06-01T01:00:00.000Z');
    await writeJsonl(join(claudeRoot, 'project-a', 'fresh.jsonl'), {
      timestamp: '2026-06-12T01:45:00.000Z'
    }, '2026-06-12T01:45:00.000Z');

    const inventory = await buildSessionSourceInventory({
      generatedAt: '2026-06-12T02:00:00.000Z',
      staleAfterMs: 60 * 60 * 1000,
      codexRoot,
      claudeRoot
    });

    const codex = providerByName(inventory, 'codex');
    assert.equal(codex.state, 'stale');
    assert.equal(codex.sourceSummary.readState, 'readable');
    assert.equal(codex.sourceSummary.stale, true);
    assert.deepEqual(codex.degradedReasons, ['latest-session-file-exceeded-stale-threshold']);
    assert.equal(providerByName(inventory, 'claude').state, 'available');
  });

  it('reports unreadable candidate files without exposing paths or contents', async (t) => {
    const temp = await temporaryDirectory(t);
    const codexRoot = join(temp.path, 'codex', 'sessions');
    const claudeRoot = join(temp.path, 'claude', 'projects');
    const unreadable = join(codexRoot, '2026', '06', '12', 'unreadable.jsonl');

    await writeJsonl(unreadable, {
      timestamp: '2026-06-12T01:00:00.000Z',
      message: { role: 'assistant', content: 'hidden unreadable content' }
    }, '2026-06-12T01:00:00.000Z');
    await chmod(unreadable, 0o000);

    try {
      const inventory = await buildSessionSourceInventory({
        generatedAt: '2026-06-12T02:00:00.000Z',
        codexRoot,
        claudeRoot
      });
      const codex = providerByName(inventory, 'codex');

      assert.equal(codex.state, 'unreadable');
      assert.equal(codex.candidateFileCount, 1);
      assert.equal(codex.readableFileCount, 0);
      assert.equal(codex.sourceSummary.readState, 'unreadable');
      assert.equal(JSON.stringify(inventory).includes('hidden unreadable content'), false);
    } finally {
      await chmod(unreadable, 0o600);
    }
  });

  it('reports degraded and failed provider states explicitly', async (t) => {
    const temp = await temporaryDirectory(t);
    const codexRoot = join(temp.path, 'codex', 'sessions');

    await writeFileWithMtime(
      join(codexRoot, '2026', '06', '12', 'invalid.jsonl'),
      '{not valid json}\n',
      '2026-06-12T01:00:00.000Z'
    );

    const inventory = await buildSessionSourceInventory({
      generatedAt: '2026-06-12T02:00:00.000Z',
      staleAfterMs: 24 * 60 * 60 * 1000,
      codexRoot,
      claudeRoot: '\0invalid-claude-root'
    });

    const codex = providerByName(inventory, 'codex');
    const claude = providerByName(inventory, 'claude');

    assert.equal(codex.state, 'degraded');
    assert.deepEqual(codex.degradedReasons, ['some-candidate-files-have-invalid-jsonl']);
    assert.equal(codex.sourceSummary.readState, 'readable');
    assert.equal(claude.state, 'failed');
    assert.deepEqual(claude.degradedReasons, ['root-stat-failed']);
    assert.equal(inventory.summary.state, 'failed');
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

async function temporaryDirectory(t) {
  const path = await mkdtemp(join(tmpdir(), 'session-source-inventory-'));

  t.after(async () => {
    await rm(path, { recursive: true, force: true });
  });

  return {
    path
  };
}

async function writeJsonl(file, entry, mtime) {
  await writeFileWithMtime(file, `${JSON.stringify(entry)}\n`, mtime);
}

async function writeFileWithMtime(file, text, mtime) {
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, text, 'utf8');

  const timestamp = new Date(mtime);
  await utimes(file, timestamp, timestamp);
}

function providerByName(inventory, provider) {
  return inventory.providers.find((candidate) => candidate.provider === provider);
}
