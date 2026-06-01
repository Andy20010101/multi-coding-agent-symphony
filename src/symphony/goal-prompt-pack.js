import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { isSafeGoalEventToken } from './goal-event-contracts.js';
import { buildGoalNextAction } from './goal-next-action-resolver.js';
import { compactRunState } from './contract.js';
import { readLatestRun } from './state.js';
import {
  readManagedActiveGoalPointer,
  readManagedGoalRunbookState
} from './goal-runbook-registry.js';
import {
  buildGoalLedgerForRunbook,
  readGoalEventLogForRunbook
} from './goal-runbook-context.js';
import {
  GOAL_PROMPT_PACK_CONTRACT_NAME,
  GOAL_PROMPT_PACK_CONTRACT_VERSION,
  GOAL_PROMPT_PACK_ROLES,
  assertGoalPromptPackContract,
  assertGoalRunbookContract
} from './goal-runbook-contracts.js';

const REPO_ROOT = fileURLToPath(new URL('../../', import.meta.url));
const CONTROLLED_FIXTURE_GOAL_ID = 'v19-fixture';
const CONTROLLED_FIXTURE_REF = 'fixtures/contracts/goal-runbook.valid.v1.json';
const PLACEHOLDER_PLAN_HASH = 'sha256:0000000000000000000000000000000000000000000000000000000000000000';
const EVIDENCE_DATE = '2026-05-29';

const ROLE_LABELS = Object.freeze({
  worker: 'worker',
  reviewer: 'reviewer',
  'main-verifier': 'main verifier',
  'release-manager': 'release manager'
});
const RELEASE_GATE_COMMANDS = Object.freeze({
  'release.pnpm-check': 'pnpm check',
  'release.pnpm-test': 'pnpm test',
  'release.workbench-build': 'pnpm workbench:build',
  'release.mutation-gate': 'pnpm test:mutation:gate',
  'release.audit-high': 'pnpm audit --audit-level high',
  'release.diff-check': 'git diff --check',
  'release.mcas-doctor': 'pnpm --silent mcas doctor --json',
  'release.docs-updated': 'pnpm check',
  'release.tag-evidence': null
});
const REVISION_FAILURE_EVENTS = Object.freeze([
  'reviewer.needs-revision',
  'main.verification-failed'
]);

export class GoalPromptPackError extends Error {
  constructor(code, message, safeDetails) {
    super(message);
    this.name = 'GoalPromptPackError';
    this.code = code;

    if (safeDetails !== undefined) {
      this.safeDetails = safeDetails;
    }
  }
}

export async function buildGoalPromptPack({
  stateDir = '.symphony',
  goalId,
  taskId,
  role,
  next = false,
  promptFormat = 'markdown',
  generatedAt = new Date().toISOString()
} = {}) {
  const normalizedPromptFormat = normalizePromptFormat(promptFormat);
  const context = next
    ? await buildNextPromptContext({ stateDir, goalId, generatedAt })
    : await buildExplicitPromptContext({ stateDir, goalId, taskId, role });
  const prompt = buildPrompt({
    ...context,
    promptFormat: normalizedPromptFormat
  });
  const promptPack = {
    contractName: GOAL_PROMPT_PACK_CONTRACT_NAME,
    contractVersion: GOAL_PROMPT_PACK_CONTRACT_VERSION,
    goalId: context.runbook.goalId,
    generatedAt,
    prompts: [prompt],
    safety: {
      readOnly: true,
      copyOnly: true,
      workbenchWriteAvailable: false,
      browserExecutionAvailable: false,
      modelInvocationAvailable: false
    }
  };

  return assertGoalPromptPackContract(promptPack);
}

export function renderGoalPromptPackMarkdown(promptPack) {
  const prompts = Array.isArray(promptPack?.prompts) ? promptPack.prompts : [];

  return prompts.map((prompt) => prompt.text).join('\n\n');
}

export function renderGoalPromptPackText(promptPack) {
  const prompts = Array.isArray(promptPack?.prompts) ? promptPack.prompts : [];

  return prompts.map((prompt) => prompt.text).join('\n\n');
}

function normalizePromptFormat(format) {
  if (format === 'markdown' || format === 'text') {
    return format;
  }

  throw new GoalPromptPackError(
    'invalid-prompt-format',
    'goal prompt supports only markdown or text prompt formats.'
  );
}

async function buildExplicitPromptContext({ stateDir, goalId, taskId, role }) {
  const resolvedGoalId = await normalizeGoalId({ stateDir, goalId });
  const normalizedRole = normalizeRole(role);
  const normalizedTaskId = normalizeTaskId(taskId, '--task');
  const runbook = await loadRunbook({
    stateDir,
    goalId: resolvedGoalId,
    allowControlledFixtureFallback: resolvedGoalId === CONTROLLED_FIXTURE_GOAL_ID
  });
  const runbookTask = resolveRunbookTask({
    runbook,
    taskId: normalizedTaskId,
    role: normalizedRole
  });

  return {
    runbook,
    runbookTask,
    taskId: normalizedTaskId,
    role: normalizedRole,
    phase: rolePhase(normalizedRole),
    reason: null,
    revisionContext: null,
    validationCommands: validationCommandsFor({
      runbook,
      runbookTask,
      role: normalizedRole
    })
  };
}

async function buildNextPromptContext({ stateDir, goalId, generatedAt }) {
  const nextAction = await buildGoalNextAction({
    stateDir,
    goalId: normalizeOptionalGoalId(goalId),
    generatedAt
  });

  if (nextAction.status !== 'action-required' || nextAction.next === null) {
    throw new GoalPromptPackError(
      'next-prompt-unavailable',
      'goal prompt --next requires an action-required goal-next-action.v1 result.'
    );
  }

  const runbook = await loadRunbook({
    stateDir,
    goalId: nextAction.goalId,
    allowControlledFixtureFallback: false
  });
  const runbookTask = resolveRunbookTask({
    runbook,
    taskId: nextAction.next.taskId,
    role: nextAction.next.role
  });
  const revisionContext = await buildRevisionContext({
    stateDir,
    runbook,
    runbookTask,
    taskId: nextAction.next.taskId,
    role: nextAction.next.role,
    phase: nextAction.next.phase,
    nextAction,
    generatedAt
  });

  return {
    runbook,
    runbookTask,
    taskId: nextAction.next.taskId,
    role: nextAction.next.role,
    phase: nextAction.next.phase,
    reason: nextAction.next.reason,
    revisionContext,
    validationCommands: validationCommandsFor({
      runbook,
      runbookTask,
      role: nextAction.next.role
    })
  };
}

async function buildRevisionContext({
  stateDir,
  runbook,
  runbookTask,
  taskId,
  role,
  phase,
  nextAction,
  generatedAt
}) {
  if (role !== 'worker' || phase !== 'revision') {
    return null;
  }

  const [eventState, latestRunState] = await Promise.all([
    readRevisionEventState({
      stateDir,
      runbook,
      taskId,
      generatedAt
    }),
    readRevisionLatestRunState({ stateDir })
  ]);
  const trigger = revisionTriggerFromEvents({
    taskEvents: eventState.taskEvents,
    latestWorkerEvidence: eventState.latestWorkerEvidence,
    reason: nextAction.next.reason
  });
  const ledgerTask = eventState.ledgerTask;
  const changedFiles = changedFilesFromRun(latestRunState.latestRun);
  const recordedFailedCommands = failedCommandsFromEvent(trigger.event);
  const rerunCommands = revisionRerunCommands({
    recordedFailedCommands,
    latestRun: latestRunState.latestRun,
    runbookTask
  });

  return {
    state: eventState.state === 'available' ? 'available' : 'partial',
    sourcePolicy: 'goal-event-log.v1 + goal-progress-ledger.v1 + goal-runbook.v1 + symphony.console-run',
    trigger: {
      eventType: trigger.event?.eventType ?? trigger.eventType,
      eventId: trigger.event?.eventId ?? null,
      sequence: trigger.event?.sequence ?? null,
      statement: trigger.event?.statement ?? nextAction.next.reason,
      evidenceRefs: evidenceRefStrings(trigger.event),
      actor: actorText(trigger.event?.actor),
      branch: trigger.event?.branch ?? null,
      commit: trigger.event?.commit ?? null
    },
    blockers: blockersFromLedgerTask(ledgerTask),
    failedCommands: {
      recorded: recordedFailedCommands,
      rerun: rerunCommands
    },
    changedFiles: {
      source: latestRunState.latestRun === null ? 'missing' : 'symphony.console-run',
      sourceRunId: latestRunState.latestRun?.runId ?? null,
      items: changedFiles
    },
    acceptanceDelta: acceptanceDeltaForRevision({
      runbookTask,
      trigger
    }),
    diagnostics: eventState.error === null && latestRunState.error === null
      ? []
      : uniqueNonEmptyStrings([eventState.error, latestRunState.error])
  };
}

async function readRevisionEventState({ stateDir, runbook, taskId, generatedAt }) {
  try {
    const eventLog = await readGoalEventLogForRunbook({
      stateDir,
      runbook
    });
    const ledger = await buildGoalLedgerForRunbook({
      stateDir,
      runbook,
      eventLog,
      generatedAt
    });
    const taskEvents = Array.isArray(eventLog?.events)
      ? eventLog.events.filter((event) => event?.taskId === taskId)
      : [];

    return {
      state: 'available',
      error: null,
      taskEvents,
      latestWorkerEvidence: latestEventOfTypes(taskEvents, TASK_WORKER_EVIDENCE_EVENTS),
      ledgerTask: Array.isArray(ledger?.tasks)
        ? ledger.tasks.find((task) => task?.taskId === taskId) ?? null
        : null
    };
  } catch (error) {
    return {
      state: 'unavailable',
      error: `Revision event context unavailable: ${safeErrorMessage(error)}`,
      taskEvents: [],
      latestWorkerEvidence: null,
      ledgerTask: null
    };
  }
}

async function readRevisionLatestRunState({ stateDir }) {
  try {
    return {
      latestRun: compactRunState(await readLatestRun({ stateDir })),
      error: null
    };
  } catch (error) {
    return {
      latestRun: null,
      error: `Latest run context unavailable: ${safeErrorMessage(error)}`
    };
  }
}

function revisionTriggerFromEvents({ taskEvents, latestWorkerEvidence, reason }) {
  const candidates = taskEvents
    .filter((event) => REVISION_FAILURE_EVENTS.includes(event?.eventType))
    .filter((event) => latestWorkerEvidence === null || isEventAfter(event, latestWorkerEvidence));
  const event = latestEvent(candidates);

  if (event !== null) {
    return {
      event,
      eventType: event.eventType
    };
  }

  return {
    event: null,
    eventType: reason?.includes('main verification failed')
      ? 'main.verification-failed'
      : reason?.includes('reviewer.needs-revision')
        ? 'reviewer.needs-revision'
        : 'revision-required'
  };
}

const TASK_WORKER_EVIDENCE_EVENTS = Object.freeze([
  'worker.evidence-recorded',
  'worker.self-check-passed',
  'worker.self-check-failed'
]);

function latestEventOfTypes(events, eventTypes) {
  return latestEvent(events.filter((event) => eventTypes.includes(event?.eventType)));
}

function latestEvent(events) {
  return events
    .filter((event) => Number.isInteger(event?.sequence))
    .sort((left, right) => left.sequence - right.sequence)
    .at(-1) ?? null;
}

function isEventAfter(left, right) {
  if (left === null || right === null) {
    return false;
  }

  return left.sequence > right.sequence;
}

function evidenceRefStrings(event) {
  if (!Array.isArray(event?.evidenceRefs)) {
    return [];
  }

  return uniqueNonEmptyStrings(event.evidenceRefs.map((evidenceRef) => {
    if (typeof evidenceRef?.ref !== 'string' || evidenceRef.ref.trim() === '') {
      return null;
    }

    return evidenceRef.kind === 'repo-doc'
      ? evidenceRef.ref
      : `${evidenceRef.kind ?? 'artifact-ref'}:${evidenceRef.ref}`;
  }));
}

function blockersFromLedgerTask(ledgerTask) {
  if (!Array.isArray(ledgerTask?.blockers)) {
    return [];
  }

  return ledgerTask.blockers
    .filter((blocker) => typeof blocker?.reason === 'string' && blocker.reason.trim() !== '')
    .map((blocker, index) => ({
      id: typeof blocker.id === 'string' && blocker.id.trim() !== ''
        ? blocker.id
        : `blocker.${index + 1}`,
      reason: blocker.reason,
      severity: typeof blocker.severity === 'string' && blocker.severity.trim() !== ''
        ? blocker.severity
        : 'warning'
    }));
}

function failedCommandsFromEvent(event) {
  if (event === null || event === undefined) {
    return [];
  }

  return uniqueNonEmptyStrings([
    ...commandStringsFromUnknown(event.failedCommands),
    ...commandStringsFromUnknown(event.metadata?.failedCommands),
    ...commandStringsFromUnknown(event.metadata?.failedCommand),
    ...failedCommandResultsFromUnknown(event.commandResults),
    ...failedCommandResultsFromUnknown(event.metadata?.commandResults)
  ]);
}

function failedCommandResultsFromUnknown(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((result) => result?.status === 'failed' || result?.exitCode > 0)
    .flatMap((result) => commandStringsFromUnknown(result.command));
}

function commandStringsFromUnknown(value) {
  if (typeof value === 'string' && value.trim() !== '') {
    return [value.trim()];
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry) => commandStringsFromUnknown(entry));
  }

  if (value !== null && typeof value === 'object' && typeof value.command === 'string') {
    return commandStringsFromUnknown(value.command);
  }

  return [];
}

function revisionRerunCommands({ recordedFailedCommands, latestRun, runbookTask }) {
  const sourceRunCommands = latestRun?.status === 'failed' || latestRun?.verifierStatus === 'failed'
    ? [
        latestRun.command,
        ...(Array.isArray(latestRun.verificationCommands) ? latestRun.verificationCommands : [])
      ]
    : [];

  return uniqueNonEmptyStrings([
    ...recordedFailedCommands,
    ...sourceRunCommands,
    ...(Array.isArray(runbookTask?.copyOnlyCommands) ? runbookTask.copyOnlyCommands : [])
  ]);
}

function changedFilesFromRun(latestRun) {
  return uniqueNonEmptyStrings([
    ...(Array.isArray(latestRun?.changedFiles) ? latestRun.changedFiles : []),
    ...(Array.isArray(latestRun?.createdFiles) ? latestRun.createdFiles : [])
  ]);
}

function acceptanceDeltaForRevision({ runbookTask, trigger }) {
  const triggerType = trigger.event?.eventType ?? trigger.eventType;

  return (Array.isArray(runbookTask?.acceptance) ? runbookTask.acceptance : [])
    .map((acceptance) => ({
      acceptance,
      status: `recheck-after-${triggerType}`
    }));
}

function actorText(actor) {
  if (typeof actor?.role === 'string' && typeof actor?.id === 'string') {
    return `${actor.role}:${actor.id}`;
  }

  return null;
}

async function normalizeGoalId({ stateDir, goalId }) {
  const normalizedGoalId = normalizeOptionalGoalId(goalId);

  if (normalizedGoalId !== 'latest') {
    return normalizedGoalId;
  }

  const pointer = await readManagedActiveGoalPointer({ stateDir });

  if (!isSafeGoalEventToken(pointer?.goalId)) {
    throw new GoalPromptPackError(
      'missing-active-goal',
      'goal prompt --goal latest requires an active managed goal runbook.'
    );
  }

  return pointer.goalId;
}

function normalizeOptionalGoalId(goalId) {
  if (goalId === undefined || goalId === null) {
    throw new GoalPromptPackError(
      'missing-goal-id',
      'goal prompt requires --goal.'
    );
  }

  if (goalId === 'latest') {
    return goalId;
  }

  if (!isSafeGoalEventToken(goalId)) {
    throw new GoalPromptPackError(
      'invalid-goal-id',
      '--goal must be latest or a safe non-empty goal id.'
    );
  }

  return goalId;
}

function normalizeTaskId(taskId, field) {
  if (!isSafeGoalEventToken(taskId)) {
    throw new GoalPromptPackError(
      'invalid-task-id',
      `${field} must be a safe non-empty task id.`
    );
  }

  return taskId;
}

function normalizeRole(role) {
  if (!GOAL_PROMPT_PACK_ROLES.includes(role)) {
    throw new GoalPromptPackError(
      'invalid-prompt-role',
      '--role must be worker, reviewer, main-verifier, or release-manager.'
    );
  }

  return role;
}

async function loadRunbook({ stateDir, goalId, allowControlledFixtureFallback }) {
  const state = await readManagedGoalRunbookState({ stateDir, goalId });

  if (state !== null) {
    try {
      return assertGoalRunbookContract(state.runbook);
    } catch (error) {
      throw new GoalPromptPackError(
        'invalid-managed-runbook',
        'managed goal runbook state is invalid.',
        { reason: safeErrorMessage(error) }
      );
    }
  }

  if (allowControlledFixtureFallback) {
    return readControlledFixtureRunbook(goalId);
  }

  throw new GoalPromptPackError(
    'missing-managed-runbook',
    `No managed goal-runbook.v1 state is registered for ${goalId}.`
  );
}

async function readControlledFixtureRunbook(goalId) {
  const parsed = JSON.parse(await readFile(join(REPO_ROOT, CONTROLLED_FIXTURE_REF), 'utf8'));

  return assertGoalRunbookContract({
    ...parsed,
    goalId
  });
}

function resolveRunbookTask({ runbook, taskId, role }) {
  if (role === 'release-manager') {
    if (taskId !== 'release') {
      throw new GoalPromptPackError(
        'invalid-release-task',
        'release-manager prompts require --task release.'
      );
    }

    return null;
  }

  const runbookTask = runbook.tasks.find((task) => task.taskId === taskId);

  if (runbookTask === undefined) {
    throw new GoalPromptPackError(
      'unknown-task',
      `Task ${taskId} is not present in the managed goal runbook.`
    );
  }

  if (!runbookTask.roleOrder.includes(role)) {
    throw new GoalPromptPackError(
      'role-not-in-task-order',
      `Role ${role} is not configured for ${taskId}.`
    );
  }

  return runbookTask;
}

function buildPrompt(context) {
  const evidenceFile = evidenceFileFor(context);
  const roleGuidance = roleGuidanceFor({
    ...context,
    evidenceFile
  });
  const registration = registrationFor({
    goalId: context.runbook.goalId,
    taskId: context.taskId,
    role: context.role,
    evidenceFile
  });

  return {
    taskId: context.taskId,
    role: context.role,
    phase: context.phase,
    title: promptTitle(context),
    copyOnly: true,
    format: context.promptFormat,
    text: promptTextFor({
      ...context,
      evidenceFile,
      roleGuidance,
      registration
    }),
    validationCommands: context.validationCommands,
    evidenceFile,
    roleGuidance,
    registration,
    revisionContext: context.revisionContext
  };
}

function promptTitle({ role, runbookTask, taskId, phase }) {
  if (role === 'release-manager') {
    return 'Prepare release closeout evidence';
  }

  if (role === 'worker' && phase === 'revision') {
    return `revision worker prompt for ${taskId}: ${runbookTask.title}`;
  }

  return `${ROLE_LABELS[role]} prompt for ${taskId}: ${runbookTask.title}`;
}

function promptTextFor(context) {
  if (context.role === 'worker') {
    return workerPromptText(context);
  }

  if (context.role === 'reviewer') {
    return reviewerPromptText(context);
  }

  if (context.role === 'main-verifier') {
    return mainVerifierPromptText(context);
  }

  return releaseManagerPromptText(context);
}

function workerPromptText(context) {
  if (context.phase === 'revision') {
    return workerRevisionPromptText(context);
  }

  return [
    `/goal`,
    `执行 ${context.runbook.goalId} ${context.taskId} worker implement：${context.runbookTask.title}。`,
    '',
    commonTaskScope(context),
    '',
    roleGuidanceSection(context.roleGuidance),
    '',
    validationSection(context.validationCommands),
    '',
    evidenceSection(context),
    '',
    registrationSection({
      heading: 'Event registration guidance after worker evidence exists:',
      registration: context.registration,
      allowedEvents: ['worker.evidence-recorded', 'worker.self-check-passed', 'worker.self-check-failed']
    }),
    '',
    'Return:',
    '- Summary',
    '- Files changed',
    '- Tests run with exact results',
    `- Suggested worker evidence file path: ${context.evidenceFile}`,
    '- Reviewer handoff; do not claim reviewer approval.'
  ].join('\n');
}

function workerRevisionPromptText(context) {
  return [
    '/goal',
    `执行 ${context.runbook.goalId} ${context.taskId} revision worker：${context.runbookTask.title}。`,
    '',
    commonTaskScope(context),
    '',
    revisionContextSection(context.revisionContext),
    '',
    roleGuidanceSection(context.roleGuidance),
    '',
    validationSection(context.validationCommands),
    '',
    evidenceSection(context),
    '',
    registrationSection({
      heading: 'Event registration guidance after revision worker evidence exists:',
      registration: context.registration,
      allowedEvents: ['worker.evidence-recorded', 'worker.self-check-passed', 'worker.self-check-failed']
    }),
    '',
    'Return:',
    '- Revision summary',
    '- Blockers fixed and any blockers still open',
    '- Changed files',
    '- Acceptance delta closed',
    '- Tests run with exact results',
    `- Updated worker evidence file path: ${context.evidenceFile}`,
    '- Reviewer handoff; do not claim reviewer approval, main verification, or release ready.'
  ].join('\n');
}

function reviewerPromptText(context) {
  return [
    '/goal',
    `审查 ${context.runbook.goalId} ${context.taskId}：${context.runbookTask.title}。`,
    '',
    commonTaskScope(context),
    '',
    roleGuidanceSection(context.roleGuidance),
    '',
    validationSection(context.validationCommands),
    '',
    evidenceSection(context),
    '',
    registrationSection({
      heading: 'Event registration guidance after review verdict:',
      registration: context.registration,
      allowedEvents: ['reviewer.approved', 'reviewer.needs-revision']
    }),
    '',
    reviewerOutcomeRegistrationSection(context),
    '',
    'Return:',
    '- Findings first, ordered by severity',
    '- Verdict: APPROVED or NEEDS_REVISION',
    '- Tests checked with exact results',
    `- Suggested review evidence file path: ${context.evidenceFile}`,
    '- If approved, hand off to main-verifier; if needs revision, hand back to worker.'
  ].join('\n');
}

function mainVerifierPromptText(context) {
  return [
    '/goal',
    `执行 ${context.runbook.goalId} ${context.taskId} main verification：${context.runbookTask.title}。`,
    '',
    commonTaskScope(context),
    '',
    roleGuidanceSection(context.roleGuidance),
    '',
    validationSection(context.validationCommands),
    '',
    evidenceSection(context),
    '',
    registrationSection({
      heading: 'Event registration guidance after main verification:',
      registration: context.registration,
      allowedEvents: ['main.verification-passed', 'main.verification-failed']
    }),
    '',
    mainVerifierOutcomeRegistrationSection(context),
    '',
    'Return:',
    '- Summary',
    '- Main commit or checked commit',
    '- Commands run with exact results',
    `- Suggested main verification evidence file path: ${context.evidenceFile}`,
    '- Remaining blockers, if any.'
  ].join('\n');
}

function releaseManagerPromptText(context) {
  const releaseGates = context.runbook.releaseGates.map((gate) => `- ${gate}`).join('\n');

  return [
    '/goal',
    `执行 ${context.runbook.goalId} release-manager prompt：准备 release gate 和 closeout evidence。`,
    '',
    'Release scope:',
    `- Goal: ${context.runbook.goalId}`,
    `- Title: ${context.runbook.goalTitle}`,
    `- Baseline: ${context.runbook.baseline.tag}`,
    '- Tasks must already have worker evidence, reviewer approval, and main verification.',
    '- Release gates:',
    releaseGates,
    context.reason === null ? '' : `- Next-action reason: ${context.reason}`,
    '',
    roleGuidanceSection(context.roleGuidance),
    '',
    validationSection(context.validationCommands),
    '',
    evidenceSection(context),
    '',
    registrationSection({
      heading: 'Event registration guidance after each release gate has evidence:',
      registration: context.registration,
      allowedEvents: ['release.gate-passed', 'release.gate-failed', 'release.ready-declared']
    }),
    '',
    releaseManagerOutcomeRegistrationSection(context),
    '',
    'Return:',
    '- Summary',
    '- Release gates checked with exact results',
    `- Suggested release evidence file path: ${context.evidenceFile}`,
    '- Remaining blockers and the next gate to register.'
  ].filter((line) => line !== '').join('\n');
}

function commonTaskScope({ runbook, runbookTask, reason }) {
  return [
    'Task scope:',
    `- Goal: ${runbook.goalId}`,
    `- Title: ${runbook.goalTitle}`,
    `- Task: ${runbookTask.taskId}`,
    `- Task title: ${runbookTask.title}`,
    `- Branch is copy-only text, not evidence: ${runbookTask.branch}`,
    '- Acceptance:',
    ...runbookTask.acceptance.map((item) => `  - ${item}`),
    '- Expected evidence:',
    ...expectedEvidenceLines(runbookTask),
    reason === null ? null : `- Next-action reason: ${reason}`
  ].filter((line) => line !== null).join('\n');
}

function expectedEvidenceLines(runbookTask) {
  return Object.entries(runbookTask.expectedEvidence)
    .map(([key, value]) => `  - ${key}: ${Array.isArray(value) ? value.join(', ') : value}`);
}

function validationSection(commands) {
  return [
    'Validation commands to run and report exactly:',
    '```bash',
    ...commands,
    '```'
  ].join('\n');
}

function evidenceSection({ evidenceFile }) {
  return [
    'Evidence requirements:',
    `- Suggested path: ${evidenceFile}`,
    '- Include goal id, task id, branch, changed files, exact command results, and boundary notes.',
    '- Record exact command results, relevant files changed, and any blockers.',
    '- Do not claim reviewer approval, main verification, or release ready unless the matching event is explicitly registered.'
  ].join('\n');
}

function revisionContextSection(revisionContext) {
  if (revisionContext === null || revisionContext === undefined) {
    return [
      'Revision context:',
      '- Revision trigger is unavailable from goal-next-action context.',
      '- Re-read goal events and goal-status before editing; record the missing context in worker evidence.'
    ].join('\n');
  }

  const trigger = revisionContext.trigger;
  const triggerLines = [
    `- Event: ${trigger.eventType ?? 'unknown'}`,
    `- Event id: ${trigger.eventId ?? 'unknown'}`,
    `- Statement: ${trigger.statement ?? 'not recorded'}`,
    `- Evidence refs: ${formatInlineList(trigger.evidenceRefs)}`
  ];
  const blockerLines = revisionContext.blockers.length === 0
    ? ['- No open blocker is recorded in goal-progress-ledger.v1; use the failure evidence and statement above as the revision source.']
    : revisionContext.blockers.map((blocker) => `- ${blocker.id}: ${blocker.reason} (${blocker.severity})`);
  const recordedFailedCommandLines = revisionContext.failedCommands.recorded.length === 0
    ? ['- No failed command is encoded in the goal event; check the failure evidence refs before changing code.']
    : revisionContext.failedCommands.recorded.map((command) => `- ${command}`);
  const rerunCommandLines = revisionContext.failedCommands.rerun.length === 0
    ? ['- No rerun command is recorded; use the runbook acceptance commands if applicable.']
    : revisionContext.failedCommands.rerun.map((command) => `- ${command}`);
  const changedFileLines = revisionContext.changedFiles.items.length === 0
    ? ['- No changed files are recorded in the latest exposed run; record the actual changed files in worker evidence.']
    : revisionContext.changedFiles.items.map((file) => `- ${file}`);
  const acceptanceDeltaLines = revisionContext.acceptanceDelta.length === 0
    ? ['- No acceptance items are recorded for this task.']
    : revisionContext.acceptanceDelta.map((item) => `- ${item.status}: ${item.acceptance}`);

  return [
    'Revision context:',
    ...triggerLines,
    `- Source policy: ${revisionContext.sourcePolicy}`,
    '',
    'Blockers to address:',
    ...blockerLines,
    '',
    'Failed commands recorded by the failure event:',
    ...recordedFailedCommandLines,
    '',
    'Commands to rerun before reviewer handoff:',
    ...rerunCommandLines,
    '',
    `Changed files from latest exposed run (${revisionContext.changedFiles.sourceRunId ?? 'no source run'}):`,
    ...changedFileLines,
    '',
    'Acceptance delta to close:',
    ...acceptanceDeltaLines
  ].join('\n');
}

function roleGuidanceSection(roleGuidance) {
  return [
    'Role boundary:',
    ...roleGuidance.boundary.map((item) => `- ${item}`),
    '',
    'Role evidence checklist:',
    ...roleGuidance.evidenceRequirements.map((item) => `- ${item}`),
    '',
    'Handoff checklist:',
    ...roleGuidance.handoffChecklist.map((item) => `- ${item}`)
  ].join('\n');
}

function registrationSection({ heading, registration, allowedEvents }) {
  return [
    heading,
    `- Allowed events: ${allowedEvents.join(', ')}`,
    '- Dry-run first; dry-run writes nothing.',
    '- Confirm only after reviewing the dry-run plan and replacing the placeholder hash with the returned planHash.',
    '```bash',
    registration.dryRunCommand,
    registration.confirmCommand,
    '```'
  ].join('\n');
}

function reviewerOutcomeRegistrationSection({
  runbook,
  taskId,
  evidenceFile
}) {
  const approved = buildRegistrationCommandPair([
    'symphony',
    'goal',
    'review',
    '--goal',
    runbook.goalId,
    '--task',
    taskId,
    '--reviewer',
    `codex-reviewer-${taskId}`,
    '--verdict',
    'approved',
    '--evidence-ref',
    evidenceFile
  ]);
  const needsRevision = buildRegistrationCommandPair([
    'symphony',
    'goal',
    'review',
    '--goal',
    runbook.goalId,
    '--task',
    taskId,
    '--reviewer',
    `codex-reviewer-${taskId}`,
    '--verdict',
    'needs-revision',
    '--evidence-ref',
    evidenceFile
  ]);

  return outcomeRegistrationSection({
    heading: 'Verdict-specific registration commands:',
    entries: [
      ['APPROVED', approved],
      ['NEEDS_REVISION', needsRevision]
    ]
  });
}

function mainVerifierOutcomeRegistrationSection({
  runbook,
  taskId,
  evidenceFile
}) {
  const passed = buildRegistrationCommandPair([
    'symphony',
    'goal',
    'gate',
    '--goal',
    runbook.goalId,
    '--gate',
    'main-verification',
    '--task',
    taskId,
    '--status',
    'passed',
    '--verifier',
    'codex-main-verifier',
    '--evidence-ref',
    evidenceFile
  ]);
  const failed = buildRegistrationCommandPair([
    'symphony',
    'goal',
    'gate',
    '--goal',
    runbook.goalId,
    '--gate',
    'main-verification',
    '--task',
    taskId,
    '--status',
    'failed',
    '--verifier',
    'codex-main-verifier',
    '--evidence-ref',
    evidenceFile
  ]);

  return outcomeRegistrationSection({
    heading: 'Main verification outcome commands:',
    entries: [
      ['PASSED', passed],
      ['FAILED', failed]
    ]
  });
}

function releaseManagerOutcomeRegistrationSection({
  runbook,
  evidenceFile
}) {
  const gate = runbook.releaseGates[0] ?? 'release.pnpm-check';
  const gatePassed = buildRegistrationCommandPair([
    'symphony',
    'goal',
    'gate',
    '--goal',
    runbook.goalId,
    '--gate',
    gate,
    '--status',
    'passed',
    '--verifier',
    'codex-release-manager',
    '--evidence-ref',
    evidenceFile
  ]);
  const gateFailed = buildRegistrationCommandPair([
    'symphony',
    'goal',
    'gate',
    '--goal',
    runbook.goalId,
    '--gate',
    gate,
    '--status',
    'failed',
    '--verifier',
    'codex-release-manager',
    '--evidence-ref',
    evidenceFile
  ]);
  const readyDeclared = buildRegistrationCommandPair([
    'symphony',
    'goal',
    'gate',
    '--goal',
    runbook.goalId,
    '--gate',
    'release.ready',
    '--status',
    'declared',
    '--verifier',
    'codex-release-manager',
    '--evidence-ref',
    evidenceFile
  ]);

  return [
    'Release event command choices:',
    `- Replace ${gate} with the release gate that has evidence before copying a gate command.`,
    ...outcomeRegistrationLines([
      ['GATE_PASSED', gatePassed],
      ['GATE_FAILED', gateFailed],
      ['RELEASE_READY_DECLARED', readyDeclared]
    ])
  ].join('\n');
}

function outcomeRegistrationSection({ heading, entries }) {
  return [
    heading,
    ...outcomeRegistrationLines(entries)
  ].join('\n');
}

function outcomeRegistrationLines(entries) {
  return entries.flatMap(([label, commands]) => [
    `- ${label}:`,
    '```bash',
    commands.dryRunCommand,
    commands.confirmCommand,
    '```'
  ]);
}

function validationCommandsFor({ runbook, runbookTask, role }) {
  if (role === 'release-manager') {
    return uniqueNonEmptyStrings([
      ...runbook.releaseGates.map((gate) => RELEASE_GATE_COMMANDS[gate]),
      `pnpm --silent symphony goal closeout --goal ${runbook.goalId} --markdown`,
      `pnpm --silent symphony goal-status --goal ${runbook.goalId} --json`
    ]);
  }

  return uniqueNonEmptyStrings(runbookTask.copyOnlyCommands);
}

function roleGuidanceFor({ role, phase, runbook, runbookTask, evidenceFile, revisionContext }) {
  if (role === 'worker') {
    if (phase === 'revision') {
      const triggerEventType = revisionContext?.trigger?.eventType ?? 'revision failure';

      return {
        label: 'worker revision',
        phase: 'revision',
        boundary: [
          `只修复 ${triggerEventType} 暴露的 blockers、失败命令和 acceptance delta；不要扩大到其他 tasks。`,
          '禁止 self-review：worker 不能审查、批准或合并自己的 task。',
          '不从 prompt 文本、branch 名、commit message 或 command text 推断完成状态。'
        ],
        evidenceRequirements: [
          `Worker evidence file: ${evidenceFile}`,
          'Record revision summary, blockers fixed, changed files, failed commands rerun with exact results, acceptance delta closed, and boundary notes.',
          'If a blocker remains, record the blocker and do not register approval events.'
        ],
        handoffChecklist: [
          'Updated worker evidence exists at the suggested path.',
          'Failure evidence refs, failed commands, changed files, and acceptance delta have been addressed or explicitly left blocked.',
          'Independent reviewer can inspect the revised diff and evidence without relying on worker self-approval.'
        ]
      };
    }

    return {
      label: 'worker implementation',
      phase: 'implement',
      boundary: [
        '只做 worker implementation 和自测记录；不要 reviewer approval、main verification 或 release readiness。',
        '禁止 self-review：worker 不能审查、批准或合并自己的 task。',
        '不从 prompt 文本、branch 名、commit message 或 command text 推断完成状态。'
      ],
      evidenceRequirements: [
        `Worker evidence file: ${evidenceFile}`,
        'Record implementation summary, files changed, exact validation command results, boundary notes, and reviewer handoff checklist.',
        'If a blocker remains, record the blocker and do not register approval events.'
      ],
      handoffChecklist: [
        'Worker evidence exists at the suggested path.',
        'All required validation commands have exact results.',
        'Independent reviewer can inspect the diff and evidence without relying on worker self-approval.'
      ]
    };
  }

  if (role === 'reviewer') {
    return {
      label: 'independent reviewer',
      phase: 'review',
      boundary: [
        '你是 independent reviewer；如果你参与过本 task 的 worker implementation，先停止并说明，不能 self-review。',
        'goal review 使用的 reviewer id 必须不同于该 task 最近一次 worker actor id。',
        '只根据 diff、tests、contract output 和 evidence 判断，不复述 worker 总结当作结论。',
        '不做 implementation、不登记 main verification、不声明 release ready。'
      ],
      evidenceRequirements: [
        `Review evidence file: ${evidenceFile}`,
        `Read worker evidence expected for ${runbookTask.taskId} before giving a verdict.`,
        'Record findings first, verdict, exact tests checked, and whether the task goes to main-verifier or back to worker.'
      ],
      handoffChecklist: [
        'Verdict is APPROVED or NEEDS_REVISION.',
        'Review evidence cites the diff, evidence refs, and command results checked.',
        'No main verification or release gate is registered from this role.'
      ]
    };
  }

  if (role === 'main-verifier') {
    return {
      label: 'main verifier',
      phase: 'main-verification',
      boundary: [
        '先确认 reviewer.approved evidence 明确存在；没有 reviewer approval 就停止。',
        '禁止 self-review：main verification 不能替代 independent reviewer approval。',
        '只登记 main verification gate；不要登记 worker 或 reviewer event。',
        '不从 prompt 文本、branch 名、commit message 或 command text 推断完成状态。'
      ],
      evidenceRequirements: [
        `Main verification evidence file: ${evidenceFile}`,
        'Record reviewer approval evidence checked, main or checked commit, exact validation command results, and remaining blockers.',
        'Use goal gate main-verification only after the reviewer-approved evidence is explicit.'
      ],
      handoffChecklist: [
        'Reviewer approval evidence is named and checked.',
        'Main verification result is passed or failed with exact commands.',
        'Release manager receives only explicit main verification evidence, not branch or filename assumptions.'
      ]
    };
  }

  return {
    label: 'release manager',
    phase: 'release-gate',
    boundary: [
      '禁止 self-review：release-manager 不能补做缺失的 worker/reviewer/main-verifier approval。',
      '不执行 prompt，不调用模型，不把 prompt 文本当 evidence。',
      '只根据明确 event log 和 gate evidence 判断；不从文件名、branch 或命令文本推断 release-ready。'
    ],
    evidenceRequirements: [
      `Release evidence file: ${evidenceFile}`,
      `Check every task in ${runbook.goalId} has worker evidence, reviewer approval, and main verification before release.ready.`,
      'Record each release gate command result, gate evidence refs, remaining blockers, and the next gate to register.'
    ],
    handoffChecklist: [
      'Every release gate has explicit evidence before a gate-passed event.',
      'release.ready is declared only after required task and gate evidence exists.',
      'No worker, reviewer, or main-verifier evidence is backfilled by the release-manager role.'
    ]
  };
}

function evidenceFileFor({ runbook, taskId, role }) {
  const goalSegment = evidenceGoalSegment(runbook.goalId);

  if (role === 'release-manager') {
    return `docs/plans/${goalSegment}-release-evidence-${EVIDENCE_DATE}.md`;
  }

  const taskSegment = evidenceTaskSegment({
    goalSegment,
    taskId
  });
  const roleSegment = role === 'main-verifier'
    ? 'main-verification'
    : role === 'reviewer'
      ? 'review'
      : 'worker';

  return `docs/plans/${goalSegment}-${taskSegment}-${roleSegment}-evidence-${EVIDENCE_DATE}.md`;
}

function evidenceGoalSegment(goalId) {
  const match = /^(v\d+)(?:-|$)/u.exec(goalId);

  return match?.[1] ?? goalId;
}

function evidenceTaskSegment({ goalSegment, taskId }) {
  if (goalSegment === 'v19') {
    return taskId.replaceAll('-', '');
  }

  return taskId;
}

function registrationFor({
  goalId,
  taskId,
  role,
  evidenceFile
}) {
  if (role === 'worker') {
    return buildRegistration([
      'symphony',
      'goal',
      'update',
      '--goal',
      goalId,
      '--task',
      taskId,
      '--event',
      'worker.evidence-recorded',
      '--actor',
      `codex-worker-${taskId}`,
      '--evidence-ref',
      evidenceFile
    ]);
  }

  if (role === 'reviewer') {
    return buildRegistration([
      'symphony',
      'goal',
      'review',
      '--goal',
      goalId,
      '--task',
      taskId,
      '--reviewer',
      `codex-reviewer-${taskId}`,
      '--verdict',
      'approved',
      '--evidence-ref',
      evidenceFile
    ]);
  }

  if (role === 'main-verifier') {
    return buildRegistration([
      'symphony',
      'goal',
      'gate',
      '--goal',
      goalId,
      '--gate',
      'main-verification',
      '--task',
      taskId,
      '--status',
      'passed',
      '--verifier',
      'codex-main-verifier',
      '--evidence-ref',
      evidenceFile
    ]);
  }

  return buildRegistration([
    'symphony',
    'goal',
    'gate',
    '--goal',
    goalId,
    '--gate',
    'release.pnpm-check',
    '--status',
    'passed',
    '--verifier',
    'codex-release-manager',
    '--evidence-ref',
    evidenceFile
  ]);
}

function buildRegistration(baseArgs) {
  return {
    ...buildRegistrationCommandPair(baseArgs),
    confirmRequired: true,
    writesInDryRun: false,
    appendOnlyOnConfirm: true
  };
}

function buildRegistrationCommandPair(baseArgs) {
  return {
    dryRunCommand: [...baseArgs, '--dry-run'].map(shellQuote).join(' '),
    confirmCommand: [...baseArgs, '--confirm', '--plan-hash', PLACEHOLDER_PLAN_HASH].map(shellQuote).join(' ')
  };
}

function rolePhase(role) {
  if (role === 'reviewer') {
    return 'review';
  }

  if (role === 'main-verifier') {
    return 'main-verification';
  }

  if (role === 'release-manager') {
    return 'release-gate';
  }

  return 'implement';
}

function shellQuote(value) {
  if (/^[A-Za-z0-9._:/=-]+$/u.test(value)) {
    return value;
  }

  return `'${value.replaceAll("'", "'\"'\"'")}'`;
}

function formatInlineList(values) {
  return Array.isArray(values) && values.length > 0
    ? values.join(', ')
    : 'none recorded';
}

function safeErrorMessage(error) {
  if (typeof error?.safeDetails?.reason === 'string') {
    return error.safeDetails.reason;
  }

  return typeof error?.message === 'string' && error.message.trim() !== ''
    ? error.message
    : 'unknown error';
}

function uniqueNonEmptyStrings(values) {
  return [...new Set(values.filter((value) => typeof value === 'string' && value.trim() !== ''))];
}
