import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ROOT = new URL('../', import.meta.url);

const REQUIRED_V18_TERMS = [
  'goal-event-log.v1',
  'goal-update-plan.v1',
  'symphony goal update',
  'symphony goal review',
  'symphony goal gate',
  'dry-run',
  'confirm',
  'goal-progress-ledger.v1',
  'GET /api/goals/latest/events',
  'GET /api/goals/<goal-id>/events',
  'Goal Events Timeline',
  'Evidence Matrix',
  'v17 planned/unknown',
  'Autopilot',
  'Workbench execution',
  'browser terminal',
  'artifact download',
  'open local file',
  'arbitrary path preview',
  'model invocation',
  'automatic merge',
  'automatic tag'
];

const RELEASE_GATE_COMMANDS = [
  'pnpm check',
  'pnpm test',
  'pnpm workbench:build',
  'pnpm test:mutation:gate',
  'pnpm audit --audit-level high',
  'git diff --check',
  'pnpm mcas doctor'
];

const MAIN_VERIFICATION_EVENTS = new Map([
  ['task-1', 'evt_e908b490cef45bbd'],
  ['task-2', 'evt_f242c53432885599'],
  ['task-3', 'evt_2d7b134cb34f960c'],
  ['task-4', 'evt_d3ea7d1e9595d4ae'],
  ['task-5', 'evt_e1f9f485119c3a23'],
  ['task-6', 'evt_bad11e4f2603ecce'],
  ['task-7', 'evt_3bfe4e6e6e32bbe6'],
  ['task-8', 'evt_f692a9e1c08d2f32'],
  ['task-9', 'evt_2f4558d2995df6ed']
]);

const RELEASE_GATE_EVENTS = [
  'release.pnpm-check',
  'evt_90a73547013ebca9',
  'release.pnpm-test',
  'evt_00c14be9bcb632e1',
  'release.workbench-build',
  'evt_e35e5bbfdac2a294',
  'release.mutation-gate',
  'evt_7d882b06c45dc9ef',
  'release.audit-high',
  'evt_ea3d7ef735cbe2ae',
  'release.diff-check',
  'evt_9aded3ab20f11716',
  'release.mcas-doctor',
  'evt_a3942a951c9753f6',
  'release.docs-updated',
  'evt_110890a798ea21ab'
];

function readDoc(path) {
  return readFileSync(new URL(path, ROOT), 'utf8');
}

function assertContainsAll(text, expected, label) {
  for (const value of expected) {
    assert.match(text, new RegExp(escapeRegExp(value), 'u'), `${label} should mention ${value}`);
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

describe('v18 documentation and release evidence', () => {
  it('keeps the README, Workbench guide, and contract index aligned to the v18 surface', () => {
    assertContainsAll(readDoc('README.md'), REQUIRED_V18_TERMS, 'README');
    assertContainsAll(readDoc('docs/workbench-operator-guide.md'), REQUIRED_V18_TERMS, 'Workbench operator guide');
    assertContainsAll(readDoc('docs/symphony-product-contracts.md'), REQUIRED_V18_TERMS, 'Contract index');
  });

  it('records release gates and task evidence references for every v18 task', () => {
    const releaseEvidence = readDoc('docs/plans/v18-release-evidence-2026-05-28.md');
    const taskEvidenceIndex = readDoc('docs/plans/v18-task-evidence-index-2026-05-28.md');
    const reviewEvidence = readDoc('docs/plans/v18-task10-review-evidence-2026-05-28.md');
    const retrospectiveReviewEvidence = readDoc('docs/plans/v18-independent-review-evidence-2026-05-28.md');

    assertContainsAll(releaseEvidence, REQUIRED_V18_TERMS, 'v18 release evidence');
    assertContainsAll(releaseEvidence, RELEASE_GATE_COMMANDS, 'v18 release evidence');
    assertContainsAll(releaseEvidence, RELEASE_GATE_EVENTS, 'v18 release evidence');
    assertContainsAll(releaseEvidence, [
      'summary.needsRevisionTasks: 1',
      'summary.releaseReady: false',
      'releaseGates.tagEvidence: unknown'
    ], 'v18 release evidence');
    assertContainsAll(taskEvidenceIndex, [
      'worker evidence',
      'independent review evidence',
      'main verification evidence',
      'release gate evidence',
      'docs/plans/v18-independent-review-evidence-2026-05-28.md',
      'docs/plans/v18-task10-review-evidence-2026-05-28.md'
    ], 'v18 task evidence index');
    assertContainsAll(reviewEvidence, [
      'Reviewer verdict',
      'NEEDS_REVISION',
      'revision response'
    ], 'v18 Task 10 review evidence');
    assertContainsAll(retrospectiveReviewEvidence, [
      'task-1',
      'task-9',
      'APPROVED',
      'read-only retrospective review',
      'does not approve Task 10'
    ], 'v18 independent review evidence');

    assertNoEvidencePlaceholders(releaseEvidence, 'v18 release evidence');
    assertNoEvidencePlaceholders(taskEvidenceIndex, 'v18 task evidence index');
    assert.doesNotMatch(
      releaseEvidence,
      /release gate events (?:still )?need(?:ed)? to be recorded/iu,
      'release gates should be registered as events, not listed as unrecorded work'
    );

    const taskRows = parseTaskEvidenceRows(taskEvidenceIndex);
    for (let taskNumber = 1; taskNumber <= 9; taskNumber += 1) {
      const taskId = `task-${taskNumber}`;
      const row = taskRows.get(taskId);
      assert.ok(row, `v18 task evidence index should include ${taskId}`);
      assertWorkerEvidence(row.workerEvidence, taskId);
      assertReviewerApproval(row.independentReviewEvidence, taskId);
      assertMainVerificationEvent(row.mainVerificationEvidence, taskId);
    }

    const task10 = taskRows.get('task-10');
    assert.ok(task10, 'v18 task evidence index should include task-10');
    assertContainsAll(task10.workerEvidence, [
      'Current branch adds',
      'README',
      'Workbench Operator Guide',
      'contract index',
      'v18 release evidence',
      'tests/v18-docs-release-evidence.test.js'
    ], 'task-10 worker evidence');
    assertContainsAll(task10.independentReviewEvidence, [
      'goal-event-log.v1:evt_84c1a3303f63ef75',
      'reviewer.needs-revision',
      'docs/plans/v18-task10-review-evidence-2026-05-28.md'
    ], 'task-10 independent review evidence');
    assert.match(
      task10.mainVerificationEvidence,
      /Task 10 main verification event is not registered because the current review verdict is `NEEDS_REVISION`/u
    );
  });
});

function parseTaskEvidenceRows(text) {
  const rows = new Map();
  for (const line of text.split('\n')) {
    if (!line.startsWith('| task-')) {
      continue;
    }

    const cells = line.split('|').slice(1, -1).map((cell) => cell.trim());
    assert.equal(cells.length, 5, `task evidence row should have 5 cells: ${line}`);
    const [
      taskId,
      workerEvidence,
      independentReviewEvidence,
      mainVerificationEvidence,
      releaseGateEvidence
    ] = cells;
    rows.set(taskId, {
      workerEvidence,
      independentReviewEvidence,
      mainVerificationEvidence,
      releaseGateEvidence
    });
  }

  assert.equal(rows.size, 10, 'task evidence index should contain exactly 10 task rows');
  return rows;
}

function assertWorkerEvidence(text, taskId) {
  assertContainsAll(text, [
    'goal-event-log.v1:evt_',
    'worker.evidence-recorded'
  ], `${taskId} worker evidence`);
  assert.match(text, /`[0-9a-f]{7}`/u, `${taskId} should cite a worker commit`);
  assert.doesNotMatch(text, /\bNot found\b/iu, `${taskId} should not use placeholder worker evidence`);
}

function assertReviewerApproval(text, taskId) {
  assertContainsAll(text, [
    'goal-event-log.v1:evt_',
    'reviewer.approved',
    'APPROVED',
    'docs/plans/v18-independent-review-evidence-2026-05-28.md'
  ], `${taskId} independent review evidence`);
  assert.doesNotMatch(
    text,
    /docs\/plans\/v18-task10-review-evidence-2026-05-28\.md/u,
    `${taskId} must not reuse Task 10 review evidence as reviewer approval`
  );
  assert.doesNotMatch(
    text,
    /goal-event-log\.v1:evt_3d5aaba709fe8598/u,
    `${taskId} must not reuse the Task 10 needs-revision event as reviewer approval`
  );
}

function assertMainVerificationEvent(text, taskId) {
  assertContainsAll(text, [
    'goal-event-log.v1:evt_',
    'main.verification-passed',
    'docs/plans/v18-release-evidence-2026-05-28.md',
    'branch `main`'
  ], `${taskId} main verification evidence`);
}

function assertNoEvidencePlaceholders(text, label) {
  const placeholderPatterns = [
    /\bNot found\b/iu,
    /\bmissing\s+(?:independent\s+review|main\s+verification|reviewer|review|main)\s+evidence\b/iu,
    /\b(?:independent\s+review|main\s+verification|reviewer|review|main)\s+evidence\s+(?:is|are)\s+missing\b/iu,
    /\bRequired after\b/iu,
    /\bPending\b/iu,
    /\bwill be updated\b/iu
  ];

  for (const pattern of placeholderPatterns) {
    assert.doesNotMatch(text, pattern, `${label} should not contain placeholder evidence wording`);
  }
}
