import { readFileSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

import { createSymphonyConsoleServer } from '../src/symphony/console.js';
import {
  buildResultIntakePreview,
  validatePendingResultContract,
  validateResultEvidenceEscrowContract,
  validateResultIntakePreviewContract
} from '../src/symphony/result-intake-contracts.js';
import {
  readPendingResult,
  readResultEvidenceEscrow
} from '../src/symphony/result-intake-state.js';
import {
  buildGoalRunbookInitPlan,
  confirmGoalRunbookInit
} from '../src/symphony/goal-runbook-registry.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const FIXTURE_DIR = join(REPO_ROOT, 'fixtures/contracts/result-intake');
const GOAL_ID = 'v51-result-intake-evidence-escrow';
const RUNBOOK_FIXTURE = 'fixtures/contracts/goal-runbook.v23-goal-operation-run-console.v1.json';

describe('v51 result intake preview and confirm API', () => {
  it('returns sanitized resultIntakePreview.v1 without writing state or operation registry files', async () => {
    const context = await startResultIntakeConsoleServer();

    try {
      const request = fixture('safe-worker-result.v1.json');
      const before = await snapshotDirectoryFiles(context.stateDir);
      const response = await postJson(context, `/api/goals/${GOAL_ID}/result-intake-preview`, {
        ...request,
        resultBlock: {
          ...request.resultBlock,
          changedFiles: [
            '/Users/andy/project/private-note.txt',
            'src/symphony/console.js'
          ]
        }
      });
      const preview = await response.json();

      assert.equal(response.status, 200);
      assert.deepEqual(validateResultIntakePreviewContract(preview), {
        ok: true,
        errors: []
      });
      assert.equal(preview.contractName, 'resultIntakePreview.v1');
      assert.equal(preview.readOnly, true);
      assert.equal(preview.willMutate, false);
      assert.equal(preview.previewWriteTarget.writesOnPreview, false);
      assert.equal(preview.previewWriteTarget.writesGoalEventLog, false);
      assert.equal(preview.previewEndpoint.writesOperationRegistry, false);
      assert.deepEqual(preview.sanitizedSummary.changedFiles, ['src/symphony/console.js']);
      assert.deepEqual(preview.sanitizedSummary.evidenceRefs, []);
      assert.match(preview.planHash, /^sha256:[a-f0-9]{64}$/u);
      assertNoUnsafePayload(preview);
      assert.deepEqual(await snapshotDirectoryFiles(context.stateDir), before);
    } finally {
      await cleanupResultIntakeConsoleServer(context);
    }
  });

  it('rejects unsupported query, traversal routes, unsupported body fields, local path fields, and GET', async () => {
    const context = await startResultIntakeConsoleServer();

    try {
      const before = await snapshotDirectoryFiles(context.stateDir);
      const request = fixture('safe-worker-result.v1.json');
      const probes = [
        await postJson(context, `/api/goals/${GOAL_ID}/result-intake-preview?debug=1`, request),
        await postJson(context, '/api/goals/%2e%2e/result-intake-preview', request),
        await postJson(context, `/api/goals/${GOAL_ID}/result-intake-preview/extra`, request),
        await postJson(context, `/api/goals/${GOAL_ID}/result-intake-preview`, {
          ...request,
          localPath: '/Users/andy/.codex/sessions/raw.jsonl'
        }),
        await postJson(context, `/api/goals/${GOAL_ID}/result-intake-preview`, {
          ...request,
          resultBlock: {
            ...request.resultBlock,
            sessionFile: '/Users/andy/.codex/sessions/raw.jsonl'
          }
        }),
        await fetch(`${context.baseUrl}/api/goals/${GOAL_ID}/result-intake-preview`)
      ];

      assert.deepEqual(probes.map((response) => response.status), [400, 405, 405, 400, 400, 405]);

      for (const response of probes) {
        const envelope = await response.json();

        assert.equal(envelope.contractName, 'error-envelope.v1');
        assertNoUnsafePayload(envelope);
      }

      assert.deepEqual(await snapshotDirectoryFiles(context.stateDir), before);
    } finally {
      await cleanupResultIntakeConsoleServer(context);
    }
  });

  it('requires planHash before writing result escrow or pending result', async () => {
    const context = await startResultIntakeConsoleServer();

    try {
      const before = await snapshotDirectoryFiles(context.stateDir);
      const request = fixture('safe-worker-result.v1.json');
      const preview = await previewResultIntake(context, request);
      const response = await postJson(context, `/api/goals/${GOAL_ID}/result-intake-confirm`, {
        resultIntakeRequest: request,
        resultIntakePreview: preview
      });
      const envelope = await response.json();

      assert.equal(response.status, 400);
      assert.equal(envelope.error.code, 'invalid-result-intake-confirm-request');
      assert.equal(envelope.error.safeDetails.field, 'planHash');
      assertNoUnsafePayload(envelope);
      assert.deepEqual(await snapshotDirectoryFiles(context.stateDir), before);
    } finally {
      await cleanupResultIntakeConsoleServer(context);
    }
  });

  it('rejects mismatched planHash without writing result escrow or pending result', async () => {
    const context = await startResultIntakeConsoleServer();

    try {
      const before = await snapshotDirectoryFiles(context.stateDir);
      const request = fixture('safe-worker-result.v1.json');
      const preview = await previewResultIntake(context, request);
      const response = await postJson(context, `/api/goals/${GOAL_ID}/result-intake-confirm`, {
        resultIntakeRequest: request,
        resultIntakePreview: preview,
        planHash: 'sha256:2222222222222222222222222222222222222222222222222222222222222222'
      });
      const envelope = await response.json();

      assert.equal(response.status, 400);
      assert.equal(envelope.error.safeDetails.reason, 'planHash must match result intake preview');
      assertNoUnsafePayload(envelope);
      assert.deepEqual(await snapshotDirectoryFiles(context.stateDir), before);
    } finally {
      await cleanupResultIntakeConsoleServer(context);
    }
  });

  it('rejects expired and stale previews without writing state', async () => {
    const context = await startResultIntakeConsoleServer();

    try {
      const before = await snapshotDirectoryFiles(context.stateDir);
      const request = fixture('safe-worker-result.v1.json');
      const expiredPreview = buildResultIntakePreview(request, {
        generatedAt: '2000-01-01T00:00:00.000Z',
        expiresAt: '2000-01-01T00:05:00.000Z'
      });
      const expiredResponse = await postJson(context, `/api/goals/${GOAL_ID}/result-intake-confirm`, {
        resultIntakeRequest: request,
        resultIntakePreview: expiredPreview,
        planHash: expiredPreview.planHash
      });
      const expiredEnvelope = await expiredResponse.json();

      assert.equal(expiredResponse.status, 400);
      assert.equal(expiredEnvelope.error.safeDetails.reason, 'preview expired');

      const preview = await previewResultIntake(context, request);
      const staleResponse = await postJson(context, `/api/goals/${GOAL_ID}/result-intake-confirm`, {
        resultIntakeRequest: {
          ...request,
          resultBlock: {
            ...request.resultBlock,
            summary: 'This request changed after preview generation.'
          }
        },
        resultIntakePreview: preview,
        planHash: preview.planHash
      });
      const staleEnvelope = await staleResponse.json();

      assert.equal(staleResponse.status, 400);
      assert.equal(staleEnvelope.error.safeDetails.reason, 'stale-preview');

      const originalPreview = await previewResultIntake(context, request);
      const hashTamperedPreview = {
        ...originalPreview,
        planHash: 'sha256:3333333333333333333333333333333333333333333333333333333333333333'
      };
      const hashTamperedResponse = await postJson(context, `/api/goals/${GOAL_ID}/result-intake-confirm`, {
        resultIntakeRequest: request,
        resultIntakePreview: hashTamperedPreview,
        planHash: hashTamperedPreview.planHash
      });
      const hashTamperedEnvelope = await hashTamperedResponse.json();

      assert.equal(hashTamperedResponse.status, 400);
      assert.equal(hashTamperedEnvelope.error.safeDetails.reason, 'stale-preview');
      assertNoUnsafePayload(expiredEnvelope);
      assertNoUnsafePayload(staleEnvelope);
      assertNoUnsafePayload(hashTamperedEnvelope);
      assert.deepEqual(await snapshotDirectoryFiles(context.stateDir), before);
    } finally {
      await cleanupResultIntakeConsoleServer(context);
    }
  });

  it('writes result evidence escrow and pending result only, without appending goal events', async () => {
    const context = await startResultIntakeConsoleServer();

    try {
      const request = fixture('safe-worker-result.v1.json');
      const preview = await previewResultIntake(context, request);
      const beforeConfirm = await snapshotDirectoryFiles(context.stateDir);
      const response = await postJson(context, `/api/goals/latest/result-intake-confirm`, {
        resultIntakeRequest: request,
        resultIntakePreview: preview,
        planHash: preview.planHash
      });
      const confirmation = await response.json();
      const afterConfirm = await snapshotDirectoryFiles(context.stateDir);
      const addedFiles = Object.keys(afterConfirm).filter((file) => beforeConfirm[file] === undefined).sort();

      assert.equal(response.status, 200);
      assert.equal(confirmation.contractName, 'result-intake-confirmation.v1');
      assert.equal(confirmation.status, 'confirmed');
      assert.equal(confirmation.written, true);
      assert.equal(confirmation.planHash, preview.planHash);
      assert.equal(confirmation.resultEvidenceEscrow.contractName, 'resultEvidenceEscrow.v1');
      assert.equal(confirmation.pendingResult.contractName, 'pendingResult.v1');
      assert.equal(confirmation.safety.writesGoalEventLog, false);
      assert.equal(confirmation.safety.writesOperationRegistry, false);
      assert.equal(confirmation.refreshed.supervisor.pendingResultProjectionAvailable, false);
      assert.deepEqual(addedFiles, [
        `goals/pending-results/${GOAL_ID}/task-1.json`,
        `goals/result-evidence-escrow/${GOAL_ID}/${confirmation.resultEvidenceEscrow.escrowId}.json`
      ].sort());
      assert.equal(Object.keys(afterConfirm).some((file) => file.includes('goal-event')), false);
      assert.equal(Object.keys(afterConfirm).some((file) => file.startsWith('goals/operations/')), false);

      const escrow = await readResultEvidenceEscrow({
        stateDir: context.stateDir,
        goalId: GOAL_ID,
        escrowId: confirmation.resultEvidenceEscrow.escrowId
      });
      const pending = await readPendingResult({
        stateDir: context.stateDir,
        goalId: GOAL_ID,
        taskId: 'task-1'
      });

      assert.deepEqual(validateResultEvidenceEscrowContract(escrow, { preview }), {
        ok: true,
        errors: []
      });
      assert.deepEqual(validatePendingResultContract(pending), {
        ok: true,
        errors: []
      });
      assert.equal(escrow.boundaries.directGoalEventAppendAvailable, false);
      assert.equal(pending.boundaries.directGoalEventAppendAvailable, false);
      assertNoUnsafePayload(confirmation);
      assertNoUnsafePayload(pending);
    } finally {
      await cleanupResultIntakeConsoleServer(context);
    }
  });

  it('blocks reviewer, main verification, and release gate event families before confirm writes', async () => {
    const context = await startResultIntakeConsoleServer();

    try {
      const before = await snapshotDirectoryFiles(context.stateDir);
      const cases = [
        ['unsupported-event-family.v1.json', 'event-routed-to-goal-review', 'symphony goal review'],
        ['unsupported-main-verification-event.v1.json', 'event-routed-to-goal-gate', 'symphony goal gate'],
        ['unsupported-release-gate-event.v1.json', 'event-routed-to-goal-gate', 'symphony goal gate']
      ];

      for (const [name, reason, commandName] of cases) {
        const request = fixture(name);
        const preview = await previewResultIntake(context, request);

        assert.equal(preview.eventCandidate.state, 'blocked', name);
        assert.equal(preview.eventCandidate.reason, reason, name);
        assert.equal(preview.eventCandidate.commandName, commandName, name);

        const response = await postJson(context, `/api/goals/${GOAL_ID}/result-intake-confirm`, {
          resultIntakeRequest: request,
          resultIntakePreview: preview,
          planHash: preview.planHash
        });
        const envelope = await response.json();

        assert.equal(response.status, 400, name);
        assert.equal(envelope.error.safeDetails.reason, 'preview event candidate is not eligible', name);
        assertNoUnsafePayload(envelope);
      }

      assert.deepEqual(await snapshotDirectoryFiles(context.stateDir), before);
    } finally {
      await cleanupResultIntakeConsoleServer(context);
    }
  });

  it('keeps raw transcript and local session refs out of responses and written pending result', async () => {
    const context = await startResultIntakeConsoleServer();

    try {
      const unsafeResponse = await postJson(context, `/api/goals/${GOAL_ID}/result-intake-preview`, fixture('unsafe-transcript.invalid.v1.json'));
      const unsafeEnvelope = await unsafeResponse.json();

      assert.equal(unsafeResponse.status, 400);
      assertNoUnsafePayload(unsafeEnvelope);

      const request = fixture('safe-worker-result.v1.json');
      const unsafeNestedResponse = await postJson(context, `/api/goals/${GOAL_ID}/result-intake-preview`, {
        ...request,
        resultBlock: {
          ...request.resultBlock,
          evidenceRefs: [
            {
              kind: 'repo-doc',
              ref: '.codex/sessions/2026/06/12/raw-secret.jsonl',
              label: 'unsafe local session'
            }
          ]
        }
      });
      const unsafeNestedEnvelope = await unsafeNestedResponse.json();
      const pending = await readPendingResult({
        stateDir: context.stateDir,
        goalId: GOAL_ID,
        taskId: 'task-1'
      });

      assert.equal(unsafeNestedResponse.status, 400);
      assert.match(unsafeNestedEnvelope.error.safeDetails.reason, /not allowed/u);
      assert.equal(pending, null);
      assertNoUnsafePayload(unsafeNestedEnvelope);

      const cleanPreview = await previewResultIntake(context, request);
      const cleanResponse = await postJson(context, `/api/goals/${GOAL_ID}/result-intake-confirm`, {
        resultIntakeRequest: request,
        resultIntakePreview: cleanPreview,
        planHash: cleanPreview.planHash
      });
      const cleanConfirmation = await cleanResponse.json();
      const cleanPending = await readPendingResult({
        stateDir: context.stateDir,
        goalId: GOAL_ID,
        taskId: 'task-1'
      });

      assert.equal(cleanResponse.status, 200);
      assertNoUnsafePayload(cleanPreview);
      assertNoUnsafePayload(cleanConfirmation);
      assertNoUnsafePayload(cleanPending);
    } finally {
      await cleanupResultIntakeConsoleServer(context);
    }
  });
});

async function startResultIntakeConsoleServer() {
  const stateDir = await mkdtemp(join(tmpdir(), 'symphony-v51-result-intake-api-'));
  await mkdir(stateDir, { recursive: true });

  const initPlan = await buildGoalRunbookInitPlan({
    stateDir,
    goalId: GOAL_ID,
    fromJson: RUNBOOK_FIXTURE
  });

  await confirmGoalRunbookInit({
    stateDir,
    goalId: GOAL_ID,
    fromJson: RUNBOOK_FIXTURE,
    planHash: initPlan.planHash
  });

  const server = createSymphonyConsoleServer({
    stateDir
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      server.off('error', reject);
      resolve();
    });
  });

  const address = server.address();

  return {
    stateDir,
    server,
    baseUrl: `http://127.0.0.1:${address.port}`
  };
}

async function cleanupResultIntakeConsoleServer(context) {
  await new Promise((resolve, reject) => {
    context.server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
  await rm(context.stateDir, {
    recursive: true,
    force: true
  });
}

async function previewResultIntake(context, request) {
  const response = await postJson(context, `/api/goals/${GOAL_ID}/result-intake-preview`, request);
  const preview = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(validateResultIntakePreviewContract(preview), {
    ok: true,
    errors: []
  });

  return preview;
}

async function postJson(context, path, body) {
  return await fetch(`${context.baseUrl}${path}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
}

function fixture(name) {
  return JSON.parse(readFileSync(join(FIXTURE_DIR, name), 'utf8'));
}

async function snapshotDirectoryFiles(root) {
  const files = await collectFiles(root, root);
  const entries = await Promise.all(
    files.map(async (file) => [
      file,
      await readFile(join(root, file), 'utf8')
    ])
  );

  return Object.fromEntries(entries.sort(([left], [right]) => left.localeCompare(right)));
}

async function collectFiles(root, current) {
  const entries = await readdir(current, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = join(current, entry.name);

    if (entry.isDirectory()) {
      files.push(...await collectFiles(root, fullPath));
    } else if (entry.isFile()) {
      files.push(relative(root, fullPath));
    }
  }

  return files;
}

function assertNoUnsafePayload(value) {
  const serialized = JSON.stringify(value);

  assert.doesNotMatch(serialized, /provider session secret/u);
  assert.doesNotMatch(serialized, /raw model output/u);
  assert.doesNotMatch(serialized, /rawTranscript/u);
  assert.doesNotMatch(serialized, /rawModelOutput/u);
  assert.doesNotMatch(serialized, /\.codex\/sessions/u);
  assert.doesNotMatch(serialized, /\.claude/u);
  assert.doesNotMatch(serialized, /\.jsonl/u);
}
