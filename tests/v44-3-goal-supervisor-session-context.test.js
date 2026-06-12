import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  CONTEXT_ADVISORY_CONTRACT_NAME,
  SESSION_CONTEXT_CONTRACT_NAME,
  SESSION_SOURCE_INVENTORY_CONTRACT_NAME,
  THREAD_CONTINUATION_DECISION_CONTRACT_NAME,
  THREAD_CONTINUATION_DECISION_CONTRACT_VERSION,
  buildContextAdvisory,
  buildGoalSupervisorAppReadModel,
  buildGoalSupervisorAppReadModelFromContracts,
  buildSessionContext,
  buildSessionSourceInventory,
  buildThreadContinuationDecision
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
    assert.equal(model.contextStatus.tokenUsage.totalTokens, 'missing');
    assert.equal(model.contextStatus.contextUtilization.ratio, 'missing');
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

  it('scans bounded Codex date folders newest-first before applying the file cap', async (t) => {
    const temp = await temporaryDirectory(t);
    const codexRoot = join(temp.path, 'codex', 'sessions');
    const claudeRoot = join(temp.path, 'claude', 'projects');

    for (const day of ['09', '10', '11', '12']) {
      await writeJsonl(join(codexRoot, '2026', '06', day, `${day}.jsonl`), {
        timestamp: `2026-06-${day}T01:00:00.000Z`
      }, `2026-06-${day}T01:00:00.000Z`);
    }

    const inventory = await buildSessionSourceInventory({
      generatedAt: '2026-06-12T02:00:00.000Z',
      staleAfterMs: 24 * 60 * 60 * 1000,
      maxFilesPerProvider: 2,
      codexRoot,
      claudeRoot
    });
    const codex = providerByName(inventory, 'codex');

    assert.equal(codex.latestSessionRef, 'codex:2026/06/12/12.jsonl');
    assert.equal(codex.latestModifiedAt, '2026-06-12T01:00:00.000Z');
    assert.equal(codex.state, 'degraded');
    assert.equal(codex.sourceSummary.stale, false);
    assert.equal(codex.sourceSummary.scannedFileCount, 2);
    assert.deepEqual(codex.degradedReasons, ['max-files-per-provider-reached']);
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

    const inventory = await buildSessionSourceInventory({
      generatedAt: '2026-06-12T02:00:00.000Z',
      codexRoot,
      claudeRoot,
      readSessionFile: async (file) => (file === unreadable ? null : readFile(file, 'utf8'))
    });
    const codex = providerByName(inventory, 'codex');

    assert.equal(codex.state, 'unreadable');
    assert.equal(codex.candidateFileCount, 1);
    assert.equal(codex.readableFileCount, 0);
    assert.equal(codex.sourceSummary.readState, 'unreadable');
    assert.equal(JSON.stringify(inventory).includes('hidden unreadable content'), false);
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

describe('v49 context advisory projection', () => {
  it('projects available session context into contextAdvisory.v1 policy inputs', async () => {
    const context = await buildSessionContext({
      threadId: 'thread-session-1',
      generatedAt: '2026-06-10T03:26:00.000Z',
      codexFiles: [CODEX_ACTIVE],
      claudeFiles: [CLAUDE_ACTIVE]
    });
    const advisory = buildContextAdvisory({
      sessionContext: context,
      sessionSourceInventory: availableInventoryFixture(),
      generatedAt: '2026-06-12T02:00:00.000Z'
    });

    assert.equal(advisory.contractName, CONTEXT_ADVISORY_CONTRACT_NAME);
    assert.equal(advisory.readOnly, true);
    assert.equal(advisory.willMutate, false);
    assert.equal(advisory.sessionContextRef.contractName, SESSION_CONTEXT_CONTRACT_NAME);
    assert.equal(advisory.inventoryRef.contractName, SESSION_SOURCE_INVENTORY_CONTRACT_NAME);
    assert.equal(advisory.transcriptAvailability, 'readable');
    assert.equal(advisory.exchangeCount, 5);
    assert.equal(advisory.latestToolCall.name, 'Bash');
    assert.equal(advisory.latestToolCall.status, 'completed');
    assert.equal(advisory.tokenUsage.totalTokens, 'missing');
    assert.equal(advisory.contextUtilization.ratio, 'missing');
    assert.equal(advisory.contextBand, 'unknown');
    assert.equal(advisory.resultBlockEvidence.status, 'present');
    assert.equal(advisory.policyInputs.threadId, 'thread-session-1');
    assert.equal(advisory.policyInputs.transcriptAvailability, 'readable');
    assert.deepEqual(advisory.blockedFields, ['tokenUsage.totalTokens', 'contextUtilization.ratio']);
  });

  it('keeps adapter-sourced missing token totals and context ratio missing without inference', async () => {
    const context = await buildSessionContext({
      threadId: 'thread-session-1',
      generatedAt: '2026-06-10T03:26:00.000Z',
      codexFiles: [],
      claudeFiles: [CLAUDE_ACTIVE]
    });
    const advisory = buildContextAdvisory({
      sessionContext: context,
      generatedAt: '2026-06-12T02:00:00.000Z'
    });

    assert.equal(context.tokenUsage.inputTokens, 900);
    assert.equal(context.tokenUsage.outputTokens, 200);
    assert.equal(context.tokenUsage.totalTokens, 'missing');
    assert.equal(context.contextUtilization.usedTokens, 1100);
    assert.equal(context.contextUtilization.maxTokens, 20000);
    assert.equal(context.contextUtilization.ratio, 'missing');
    assert.equal(advisory.tokenUsage.totalTokens, 'missing');
    assert.equal(advisory.contextUtilization.ratio, 'missing');
    assert.equal(advisory.contextBand, 'unknown');
    assert.ok(advisory.blockedFields.includes('tokenUsage.totalTokens'));
    assert.ok(advisory.blockedFields.includes('contextUtilization.ratio'));
  });

  it('keeps manually supplied missing token totals and context ratio missing without inference', () => {
    const advisory = buildContextAdvisory({
      generatedAt: '2026-06-12T02:00:00.000Z',
      sessionContext: {
        contractName: SESSION_CONTEXT_CONTRACT_NAME,
        contractVersion: 1,
        generatedAt: '2026-06-12T01:59:00.000Z',
        readOnly: true,
        threadId: 'thread-missing-ratio',
        sessionSourceSummaries: [],
        transcriptAvailability: 'readable',
        exchangeCount: 1,
        latestTurnState: { status: 'completed', role: 'assistant', updatedAt: '2026-06-12T01:59:00.000Z' },
        tokenUsage: {
          status: 'available',
          inputTokens: 100,
          outputTokens: 40,
          totalTokens: 'missing'
        },
        contextUtilization: {
          status: 'available',
          usedTokens: 140,
          maxTokens: 1000,
          ratio: 'missing'
        },
        resultBlockEvidence: { status: 'missing', present: false }
      }
    });

    assert.equal(advisory.tokenUsage.inputTokens, 100);
    assert.equal(advisory.tokenUsage.outputTokens, 40);
    assert.equal(advisory.tokenUsage.totalTokens, 'missing');
    assert.equal(advisory.contextUtilization.usedTokens, 140);
    assert.equal(advisory.contextUtilization.maxTokens, 1000);
    assert.equal(advisory.contextUtilization.ratio, 'missing');
    assert.equal(advisory.contextBand, 'unknown');
    assert.ok(advisory.blockedFields.includes('tokenUsage.totalTokens'));
    assert.ok(advisory.blockedFields.includes('contextUtilization.ratio'));
  });

  it('does not leak raw transcript text, command stdout, raw JSONL, prompts, secrets, or local paths', () => {
    const advisory = buildContextAdvisory({
      generatedAt: '2026-06-12T02:00:00.000Z',
      sessionContext: {
        contractName: SESSION_CONTEXT_CONTRACT_NAME,
        contractVersion: 1,
        generatedAt: '2026-06-12T01:59:00.000Z',
        readOnly: true,
        threadId: 'thread-secret',
        sessionSourceSummaries: [{ provider: 'codex', status: 'readable', threadId: 'thread-secret', latestTurnAt: '2026-06-12T01:59:00.000Z' }],
        transcriptAvailability: 'readable',
        exchangeCount: 1,
        latestToolCall: { name: 'Bash', status: 'completed', updatedAt: '2026-06-12T01:59:00.000Z' },
        latestTurnState: { status: 'completed', role: 'assistant', updatedAt: '2026-06-12T01:59:00.000Z' },
        tokenUsage: { status: 'missing', inputTokens: 'missing', outputTokens: 'missing', totalTokens: 'missing' },
        contextUtilization: { status: 'missing', usedTokens: 'missing', maxTokens: 'missing', ratio: 'missing' },
        resultBlockEvidence: {
          status: 'present',
          present: true,
          sourceRef: '/var/folders/private/session.jsonl',
          evidenceRef: 'stdout: SECRET_TOKEN=hidden\nraw JSONL prompt text'
        },
        rawTranscript: 'sanitized user request SECRET_TOKEN raw JSONL prompt text command stdout'
      },
      sessionSourceInventory: availableInventoryFixture()
    });
    const serialized = JSON.stringify(advisory);

    assert.equal(serialized.includes('sanitized user request'), false);
    assert.equal(serialized.includes('SECRET_TOKEN'), false);
    assert.equal(serialized.includes('raw JSONL'), false);
    assert.equal(serialized.includes('prompt text'), false);
    assert.equal(serialized.includes('command stdout'), false);
    assert.equal(serialized.includes('/var/folders/private'), false);
  });

  it('assigns contextBand only from available ratio boundaries', () => {
    assert.equal(advisoryWithRatio('missing').contextBand, 'unknown');
    assert.equal(advisoryWithRatio(0.49).contextBand, 'low');
    assert.equal(advisoryWithRatio(0.5).contextBand, 'moderate');
    assert.equal(advisoryWithRatio(0.8).contextBand, 'high');
    assert.equal(advisoryWithRatio(0.95).contextBand, 'near-limit');
    assert.equal(advisoryWithRatio(1).contextBand, 'over-limit');
    assert.equal(advisoryWithRatio(1.2).contextBand, 'over-limit');
  });

  it('summarizes inventory degraded reasons into advisory reasons', () => {
    const advisory = buildContextAdvisory({
      generatedAt: '2026-06-12T02:00:00.000Z',
      sessionContext: {
        transcriptAvailability: 'readable',
        exchangeCount: 1,
        latestTurnState: { status: 'completed' },
        tokenUsage: { status: 'missing', inputTokens: 'missing', outputTokens: 'missing', totalTokens: 'missing' },
        contextUtilization: { status: 'missing', usedTokens: 'missing', maxTokens: 'missing', ratio: 'missing' },
        staleTranscriptState: {
          stale: true,
          reason: 'latest-session-turn-exceeded-stale-threshold'
        },
        missingTranscriptState: {
          missing: false,
          reason: null
        }
      },
      sessionSourceInventory: {
        contractName: SESSION_SOURCE_INVENTORY_CONTRACT_NAME,
        contractVersion: 1,
        generatedAt: '2026-06-12T01:59:00.000Z',
        readOnly: true,
        providers: [
          { provider: 'codex', state: 'degraded', degradedReasons: ['max-files-per-provider-reached'] },
          { provider: 'claude', state: 'failed', degradedReasons: ['root-stat-failed'] }
        ]
      }
    });

    assert.deepEqual(advisory.degradedReasons, [
      'codex:max-files-per-provider-reached',
      'claude:root-stat-failed',
      'session:latest-session-turn-exceeded-stale-threshold'
    ]);
  });

  it('stays read-only and does not expose execution or write permissions', () => {
    const advisory = buildContextAdvisory();

    assert.equal(advisory.readOnly, true);
    assert.equal(advisory.willMutate, false);
    assert.equal(advisory.boundaries.launchesProvider, false);
    assert.equal(advisory.boundaries.writesGoalState, false);
    assert.equal(advisory.boundaries.writesLedgers, false);
    assert.equal(advisory.boundaries.writesEventLogs, false);
    assert.equal(advisory.boundaries.writesSymphonyState, false);
    assert.equal(advisory.boundaries.dispatchesChildren, false);
    assert.equal(advisory.boundaries.compactsTranscripts, false);
  });
});

describe('v49 thread continuation decision projection', () => {
  it('returns continue for a healthy active child with recent context', () => {
    const decision = buildThreadContinuationDecision({
      contextAdvisory: continuationContextFixture(),
      activeChild: {
        status: 'thread-active',
        threadId: 'thread-session-1',
        taskId: 'task-1',
        role: 'implementer',
        ageMs: 60_000
      },
      taskState: {
        taskId: 'task-1',
        role: 'implementer',
        status: 'in-progress'
      },
      supervisorProjection: supervisorProjectionFixture(),
      supervisorPolicy: {
        decision: 'continue',
        reason: 'active-child-ready-to-continue'
      },
      generatedAt: '2026-06-12T02:00:00.000Z'
    });

    assert.equal(decision.contractName, THREAD_CONTINUATION_DECISION_CONTRACT_NAME);
    assert.equal(decision.contractVersion, THREAD_CONTINUATION_DECISION_CONTRACT_VERSION);
    assert.equal(decision.readOnly, true);
    assert.equal(decision.willMutate, false);
    assert.equal(decision.decision, 'continue');
    assert.equal(decision.reason, 'active-child-ready-to-continue');
    assert.equal(decision.confidence, 'known');
    assert.equal(decision.targetRole, 'implementer');
    assert.equal(decision.taskId, 'task-1');
    assert.equal(decision.threadId, 'thread-session-1');
  });

  it('returns compact when context is near limit and durable evidence exists', () => {
    const decision = buildThreadContinuationDecision({
      contextAdvisory: continuationContextFixture({
        contextBand: 'near-limit',
        contextUtilization: { status: 'available', usedTokens: 950, maxTokens: 1000, ratio: 0.95 },
        resultBlockEvidence: { status: 'present', present: true }
      }),
      activeChild: {
        status: 'thread-active',
        threadId: 'thread-session-1',
        taskId: 'task-1',
        role: 'implementer'
      },
      taskState: {
        checkpointRef: 'result:task-1',
        taskId: 'task-1'
      },
      supervisorProjection: supervisorProjectionFixture()
    });

    assert.equal(decision.decision, 'compact');
    assert.equal(decision.reason, 'context-utilization-near-limit');
    assert.equal(decision.checkpointRef, 'result:task-1');
  });

  it('blocks near-limit compaction when result block evidence has no durable ref', () => {
    const decision = buildThreadContinuationDecision({
      contextAdvisory: continuationContextFixture({
        contextBand: 'near-limit',
        contextUtilization: { status: 'available', usedTokens: 950, maxTokens: 1000, ratio: 0.95 },
        resultBlockEvidence: { status: 'present', present: true }
      }),
      activeChild: {
        status: 'thread-active',
        threadId: 'thread-session-1',
        taskId: 'task-1',
        role: 'implementer'
      },
      taskState: {
        taskId: 'task-1'
      },
      supervisorProjection: supervisorProjectionFixture()
    });

    assert.equal(decision.decision, 'blocked');
    assert.equal(decision.reason, 'compact-checkpoint-missing');
    assert.equal(decision.checkpointRef, null);
    assert.ok(decision.blockedFields.includes('checkpointRef'));
    assert.ok(decision.requiredEvidence.includes('durable-checkpoint'));
  });

  it('returns new-thread for stale transcript handoff advice without creating a thread', () => {
    const decision = buildThreadContinuationDecision({
      contextAdvisory: continuationContextFixture({
        staleTranscriptState: {
          stale: true,
          reason: 'latest-session-turn-exceeded-stale-threshold',
          thresholdMs: 1_800_000,
          ageMs: 3_600_000
        }
      }),
      taskState: {
        taskId: 'task-2',
        role: 'verifier',
        requiresHandoff: true,
        handoffReason: 'phase-handoff-needed'
      },
      supervisorProjection: supervisorProjectionFixture({
        current: { taskId: 'task-2', role: 'verifier', phase: 'verify' }
      })
    });

    assert.equal(decision.decision, 'new-thread');
    assert.equal(decision.reason, 'latest-session-turn-exceeded-stale-threshold');
    assert.equal(decision.commandBoundary.executionAvailable, false);
    assert.equal(decision.commandBoundary.copyOnly, true);
  });

  it('returns wait when an active child or tool call is still running with recent session signal', () => {
    const decision = buildThreadContinuationDecision({
      contextAdvisory: continuationContextFixture({
        latestToolCall: {
          name: 'Bash',
          status: 'running',
          updatedAt: '2026-06-12T01:59:30.000Z'
        }
      }),
      activeChild: {
        status: 'running',
        threadId: 'thread-running',
        taskId: 'task-3',
        role: 'worker',
        ageMs: 120_000
      },
      supervisorProjection: supervisorProjectionFixture({
        current: { taskId: 'task-3', role: 'worker', phase: 'implement' }
      })
    });

    assert.equal(decision.decision, 'wait');
    assert.equal(decision.reason, 'active-tool-call-in-progress');
    assert.deepEqual(decision.waitPolicy, {
      activeLeaseAgeMs: 120_000,
      staleThresholdMs: 1_800_000,
      latestSignalAt: '2026-06-12T01:59:30.000Z'
    });
  });

  it('returns blocked for missing transcript without another source of truth', () => {
    const decision = buildThreadContinuationDecision({
      contextAdvisory: continuationContextFixture({
        transcriptAvailability: 'missing',
        missingTranscriptState: {
          missing: true,
          reason: 'no-readable-session-transcript'
        },
        policyInputs: {
          transcriptAvailability: 'missing',
          threadId: null
        }
      }),
      supervisorProjection: supervisorProjectionFixture()
    });

    assert.equal(decision.decision, 'blocked');
    assert.equal(decision.reason, 'no-readable-session-transcript');
    assert.equal(decision.confidence, 'unknown');
    assert.ok(decision.blockedFields.includes('transcriptAvailability'));
  });

  it('blocks missing transcript even when explicit policy wants to continue an active thread', () => {
    const decision = buildThreadContinuationDecision({
      contextAdvisory: continuationContextFixture({
        transcriptAvailability: 'missing',
        missingTranscriptState: {
          missing: true,
          reason: 'no-readable-session-transcript'
        },
        policyInputs: {
          transcriptAvailability: 'missing',
          threadId: 'thread-session-1'
        }
      }),
      activeChild: {
        status: 'thread-active',
        threadId: 'thread-session-1',
        taskId: 'task-1',
        role: 'implementer'
      },
      taskState: {
        taskId: 'task-1',
        role: 'implementer',
        status: 'in-progress'
      },
      supervisorProjection: supervisorProjectionFixture(),
      supervisorPolicy: {
        decision: 'continue',
        reason: 'active-child-ready-to-continue'
      }
    });

    assert.equal(decision.decision, 'blocked');
    assert.equal(decision.reason, 'no-readable-session-transcript');
    assert.equal(decision.confidence, 'unknown');
    assert.ok(decision.blockedFields.includes('transcriptAvailability'));
  });

  it('returns checkpoint when pending result evidence needs registration', () => {
    const decision = buildThreadContinuationDecision({
      contextAdvisory: continuationContextFixture(),
      pendingResult: {
        status: 'pending',
        evidenceRef: 'result:task-4',
        parserReason: 'result-awaits-registration'
      },
      taskState: {
        taskId: 'task-4',
        role: 'verifier'
      },
      supervisorProjection: supervisorProjectionFixture({
        current: { taskId: 'task-4', role: 'verifier', phase: 'verify' }
      })
    });

    assert.equal(decision.decision, 'checkpoint');
    assert.equal(decision.reason, 'result-awaits-registration');
    assert.equal(decision.checkpointRef, 'result:task-4');
    assert.ok(decision.requiredEvidence.includes('pending-result-registration'));
  });

  it('returns recover-drift when supervisor and context state disagree', () => {
    const decision = buildThreadContinuationDecision({
      contextAdvisory: continuationContextFixture({
        mismatchList: ['daemon-supervisor-session-state-disagree']
      }),
      supervisorProjection: supervisorProjectionFixture({
        route: {
          state: 'dispatchable',
          current: { taskId: 'task-5', role: 'worker', phase: 'implement' },
          mismatchList: ['pr-state-disagrees-with-supervisor']
        }
      })
    });

    assert.equal(decision.decision, 'recover-drift');
    assert.equal(decision.reason, 'supervisor-context-drift-detected');
    assert.ok(decision.mismatchList.includes('daemon-supervisor-session-state-disagree'));
    assert.ok(decision.mismatchList.includes('pr-state-disagrees-with-supervisor'));
  });

  it('keeps command boundary read-only and does not expose executable previews or raw source payloads', () => {
    const decision = buildThreadContinuationDecision({
      contextAdvisory: {
        ...continuationContextFixture(),
        rawTranscript: 'SECRET_TOKEN command stdout prompt text raw JSONL',
        resultBlockEvidence: {
          status: 'present',
          present: true,
          evidenceRef: 'stdout: SECRET_TOKEN command stdout'
        }
      },
      activeChild: {
        status: 'thread-active',
        threadId: 'thread-secret',
        taskId: 'task-secret',
        role: 'worker'
      },
      supervisorProjection: supervisorProjectionFixture({
        rawPayload: 'SECRET_TOKEN raw supervisor payload'
      }),
      sourceContracts: [
        {
          contractName: 'raw-source-contract.v1',
          contractVersion: 1,
          generatedAt: '2026-06-12T01:59:00.000Z',
          readOnly: true,
          rawPayload: 'SECRET_TOKEN local path /var/folders/private/session.jsonl'
        }
      ],
      commandBoundary: {
        state: 'confirm-required',
        safeCommandPreview: 'goal dispatch task-secret worker --real',
        confirmation: {
          taskId: 'task-secret'
        }
      }
    });
    const serialized = JSON.stringify(decision);

    assert.equal(decision.decision, 'blocked');
    assert.equal(decision.reason, 'confirm-required-command-missing-context');
    assert.equal(decision.commandBoundary.readOnly, true);
    assert.equal(decision.commandBoundary.executionAvailable, false);
    assert.equal(decision.commandBoundary.copyOnly, true);
    assert.equal(Object.hasOwn(decision.commandBoundary, 'safeCommandPreview'), false);
    assert.ok(decision.blockedFields.includes('planHash'));
    assert.equal(serialized.includes('goal dispatch'), false);
    assert.equal(serialized.includes('SECRET_TOKEN'), false);
    assert.equal(serialized.includes('command stdout'), false);
    assert.equal(serialized.includes('prompt text'), false);
    assert.equal(serialized.includes('raw JSONL'), false);
    assert.equal(serialized.includes('/var/folders/private'), false);
    assert.deepEqual(decision.sourceContracts.find((ref) => ref.contractName === 'raw-source-contract.v1'), {
      contractName: 'raw-source-contract.v1',
      contractVersion: 1,
      generatedAt: '2026-06-12T01:59:00.000Z',
      readOnly: true,
      threadId: null
    });
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

function continuationContextFixture(overrides = {}) {
  return {
    contractName: CONTEXT_ADVISORY_CONTRACT_NAME,
    contractVersion: 1,
    generatedAt: '2026-06-12T01:59:00.000Z',
    readOnly: true,
    willMutate: false,
    sessionContextRef: {
      contractName: SESSION_CONTEXT_CONTRACT_NAME,
      contractVersion: 1,
      generatedAt: '2026-06-12T01:58:00.000Z',
      readOnly: true,
      threadId: 'thread-session-1'
    },
    inventoryRef: {
      contractName: SESSION_SOURCE_INVENTORY_CONTRACT_NAME,
      contractVersion: 1,
      generatedAt: '2026-06-12T01:57:00.000Z',
      readOnly: true,
      threadId: null
    },
    transcriptAvailability: 'readable',
    contextBand: 'low',
    contextUtilization: { status: 'available', usedTokens: 100, maxTokens: 1000, ratio: 0.1 },
    latestToolCall: {
      name: 'Bash',
      status: 'completed',
      updatedAt: '2026-06-12T01:58:30.000Z'
    },
    latestTurnState: {
      status: 'completed',
      role: 'assistant',
      updatedAt: '2026-06-12T01:59:00.000Z'
    },
    staleTranscriptState: {
      stale: false,
      reason: null,
      thresholdMs: 1_800_000,
      ageMs: 60_000
    },
    missingTranscriptState: {
      missing: false,
      reason: null
    },
    resultBlockEvidence: {
      status: 'missing',
      present: false
    },
    blockedFields: [],
    mismatchList: [],
    policyInputs: {
      threadId: 'thread-session-1',
      transcriptAvailability: 'readable'
    },
    ...overrides
  };
}

function supervisorProjectionFixture(overrides = {}) {
  return {
    contractName: 'goal-supervisor-core-projection.v1',
    contractVersion: 1,
    generatedAt: '2026-06-12T01:59:00.000Z',
    readOnly: true,
    willMutate: false,
    current: {
      taskId: 'task-1',
      role: 'implementer',
      phase: 'implement'
    },
    route: {
      state: 'active',
      current: {
        taskId: 'task-1',
        role: 'implementer',
        phase: 'implement'
      }
    },
    progress: {
      state: 'recent-progress',
      reason: 'active-thread-healthy'
    },
    ...overrides
  };
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

function availableInventoryFixture() {
  return {
    contractName: SESSION_SOURCE_INVENTORY_CONTRACT_NAME,
    contractVersion: 1,
    generatedAt: '2026-06-12T01:59:00.000Z',
    readOnly: true,
    providers: [
      {
        provider: 'codex',
        state: 'available',
        degradedReasons: [],
        sourceSummary: {
          availability: 'available',
          readState: 'readable',
          candidateFileCount: 1,
          scannedFileCount: 1,
          readableFileCount: 1,
          unreadableFileCount: 0,
          latestModifiedAt: '2026-06-12T01:58:00.000Z',
          stale: false,
          latestSessionRef: 'codex:2026/06/12/thread-session-1.jsonl'
        }
      }
    ]
  };
}

function advisoryWithRatio(ratio) {
  return buildContextAdvisory({
    sessionContext: {
      transcriptAvailability: 'readable',
      exchangeCount: 1,
      latestTurnState: { status: 'completed' },
      tokenUsage: { status: 'missing', inputTokens: 'missing', outputTokens: 'missing', totalTokens: 'missing' },
      contextUtilization: {
        status: 'available',
        usedTokens: 100,
        maxTokens: 1000,
        ratio
      }
    }
  });
}
