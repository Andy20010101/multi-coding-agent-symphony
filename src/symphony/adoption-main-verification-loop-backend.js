import { createHash } from 'node:crypto';

import {
  ADOPTION_MAIN_VERIFICATION_BOUNDARIES,
  V68_ADOPTION_MAIN_VERIFICATION_GOAL_ID,
  buildAdoptionReadiness,
  validateAdoptionReadinessContract
} from './adoption-main-verification-loop-contracts.js';

export { V68_ADOPTION_MAIN_VERIFICATION_GOAL_ID } from './adoption-main-verification-loop-contracts.js';

export const ADOPTION_CONFIRMATION_CONTRACT_NAME = 'adoptionConfirmation.v1';
export const MAIN_VERIFICATION_PREVIEW_CONTRACT_NAME = 'mainVerificationPreview.v1';
export const MAIN_VERIFICATION_CONFIRMATION_CONTRACT_NAME = 'mainVerificationConfirmation.v1';
export const MAIN_VERIFICATION_GATE_DRAFT_CONTRACT_NAME = 'mainVerificationGateDraft.v1';
export const ADOPTION_BACKEND_CONTRACT_VERSION = 1;
export const MAIN_VERIFICATION_SUITE_ID = 'v68-main-verification-fixed-suite';

const ADOPTION_CONFIRM_ALLOWED_FIELDS = new Set([
  'planHash',
  'goalId',
  'taskId',
  'adoptionId',
  'workerRunId',
  'reviewerVerdictId',
  'patchFingerprint',
  'sourceFingerprint'
]);
const MAIN_VERIFICATION_CONFIRM_ALLOWED_FIELDS = new Set([
  'planHash',
  'goalId',
  'taskId',
  'suiteId',
  'adoptionId',
  'adoptionPlanHash',
  'sourceFingerprint'
]);
const MAIN_VERIFICATION_FIXED_COMMANDS = Object.freeze([
  'node --test tests/v68-adoption-main-verification-loop.test.js',
  'node --test tests/v67-claude-code-reviewer-lane.test.js',
  'node --test tests/v66-controlled-codex-worker-execution.test.js',
  'pnpm check',
  'git diff --check'
]);
const SAFE_TOKEN_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/u;
const HASH_PATTERN = /^sha256:[a-f0-9]{64}$/u;

export class AdoptionBackendError extends Error {
  constructor(code, message, safeDetails = {}) {
    super(message);
    this.name = 'AdoptionBackendError';
    this.code = code;
    this.safeDetails = safeDetails;
  }
}

export function buildAdoptionPreviewFromBackend({
  goalId = V68_ADOPTION_MAIN_VERIFICATION_GOAL_ID,
  taskId = 'pr-2-adoption-preview-confirm',
  generatedAt = new Date().toISOString(),
  workerEvidence = null,
  reviewerVerdict = null,
  worktreeState = null,
  sourceFingerprint = null,
  patchPlan = null,
  artifactRefs = null
} = {}) {
  return buildAdoptionReadiness({
    generatedAt,
    goal: {
      goalId,
      title: goalId,
      state: goalId === 'missing-goal' ? 'missing' : 'active',
      sourceContract: 'goal-next-action.v1',
      sourceRef: `goal-next-action:${goalId}`
    },
    task: {
      taskId,
      title: taskId,
      state: taskId === 'missing-task' ? 'missing' : 'active',
      sourceContract: 'goal-next-action.v1',
      sourceRef: `goal-next-action:${goalId}:${taskId}`
    },
    workerEvidence: workerEvidence ?? defaultWorkerEvidence({ taskId }),
    reviewerVerdict: reviewerVerdict ?? defaultReviewerVerdict({ taskId }),
    worktreeState: worktreeState ?? defaultWorktreeState(),
    sourceFingerprint: sourceFingerprint ?? defaultSourceFingerprint(),
    patchPlan: patchPlan ?? defaultPatchPlan(),
    artifactRefs: artifactRefs ?? defaultArtifactRefs()
  });
}

export function validateAdoptionConfirmInput({
  preview,
  input
} = {}) {
  const errors = [];
  const previewValidation = validateAdoptionReadinessContract(preview);

  if (!previewValidation.ok) {
    errors.push(...previewValidation.errors.map((error) => `preview.${error}`));
  } else if (preview.state !== 'ready') {
    errors.push('preview must be ready before adoption confirm');
  }

  if (!isPlainObject(input)) {
    errors.push('adoption confirm input must be a plain object');
    return { ok: false, errors };
  }

  for (const field of Object.keys(input)) {
    if (!ADOPTION_CONFIRM_ALLOWED_FIELDS.has(field)) {
      errors.push(`${field} is not an allowed adoption confirm field`);
    }
  }

  requireHash(errors, input.planHash, 'planHash');
  requireSafeToken(errors, input.goalId, 'goalId');
  requireSafeToken(errors, input.taskId, 'taskId');
  requireSafeToken(errors, input.adoptionId, 'adoptionId');
  requireSafeToken(errors, input.workerRunId, 'workerRunId');
  requireSafeToken(errors, input.reviewerVerdictId, 'reviewerVerdictId');
  requireHash(errors, input.patchFingerprint, 'patchFingerprint');
  requireHash(errors, input.sourceFingerprint, 'sourceFingerprint');

  if (previewValidation.ok) {
    if (input.planHash !== preview.planHash) {
      errors.push('planHash must match adoption preview');
    }

    if (input.goalId !== preview.goal.goalId) {
      errors.push('goalId must match adoption preview');
    }

    if (input.taskId !== preview.task.taskId) {
      errors.push('taskId must match adoption preview');
    }

    if (input.adoptionId !== preview.adoptionId) {
      errors.push('adoptionId must match adoption preview');
    }

    if (input.workerRunId !== preview.workerEvidence.workerRunId) {
      errors.push('workerRunId must match adoption preview');
    }

    if (input.reviewerVerdictId !== preview.reviewerEvidence.verdictId) {
      errors.push('reviewerVerdictId must match adoption preview');
    }

    if (input.patchFingerprint !== preview.patchPlan.patchFingerprint) {
      errors.push('patchFingerprint must match adoption preview');
    }

    if (input.sourceFingerprint !== preview.sourceFingerprint.current) {
      errors.push('sourceFingerprint must match adoption preview');
    }
  }

  return {
    ok: errors.length === 0,
    errors
  };
}

export async function confirmAdoptionPreview({
  preview,
  input,
  currentSourceFingerprint = null,
  applyAdoption = fakeAdoptionApplicator,
  writeJournal = null,
  startedAt = new Date().toISOString(),
  finishedAt = null
} = {}) {
  const validation = validateAdoptionConfirmInput({
    preview,
    input
  });

  if (!validation.ok) {
    throw new AdoptionBackendError(
      'invalid-adoption-confirm-request',
      'Adoption confirm request is invalid.',
      { errors: validation.errors }
    );
  }

  if (typeof applyAdoption !== 'function') {
    throw new AdoptionBackendError(
      'missing-adoption-applicator',
      'Adoption confirm requires a backend-owned applicator.',
      { applicator: 'missing' }
    );
  }

  const revalidation = revalidatePreviewBeforeApply({
    preview,
    currentSourceFingerprint: currentSourceFingerprint ?? preview.sourceFingerprint.current
  });

  if (!revalidation.ok) {
    throw new AdoptionBackendError(
      'adoption-confirm-revalidation-failed',
      'Adoption confirm revalidation failed.',
      { errors: revalidation.errors }
    );
  }

  const journal = buildAdoptionJournal({
    preview,
    startedAt,
    status: 'applying'
  });

  if (typeof writeJournal === 'function') {
    await writeJournal(structuredClone(journal));
  }

  const applyRequest = buildAdoptionApplyRequest({ preview });
  const applyResult = normalizeApplyResult(await applyAdoption(structuredClone(applyRequest)));
  const status = applyResult.status === 'applied' ? 'applied' : 'failed';
  const effectiveFinishedAt = new Date(millisOrNow(finishedAt ?? applyResult.finishedAt ?? startedAt)).toISOString();
  const finalJournal = {
    ...journal,
    status,
    finishedAt: effectiveFinishedAt,
    failureReason: applyResult.failureReason
  };

  return {
    contractName: ADOPTION_CONFIRMATION_CONTRACT_NAME,
    contractVersion: ADOPTION_BACKEND_CONTRACT_VERSION,
    goalId: preview.goal.goalId,
    taskId: preview.task.taskId,
    adoptionId: preview.adoptionId,
    status,
    planHash: preview.planHash,
    workerRunId: preview.workerEvidence.workerRunId,
    reviewerVerdictId: preview.reviewerEvidence.verdictId,
    patchFingerprint: preview.patchPlan.patchFingerprint,
    sourceFingerprint: preview.sourceFingerprint.current,
    revalidation,
    journal: finalJournal,
    applyRequest,
    applyResult,
    nextState: {
      adoptionApplied: status === 'applied',
      taskCompleted: false,
      mainVerified: false,
      gateDraftReady: false,
      releaseReady: false
    },
    confirmContext: {
      acceptedBodyFields: [...ADOPTION_CONFIRM_ALLOWED_FIELDS],
      samePreviewContextRequired: true,
      acceptedPlanHashFromPreview: true,
      journalWrittenBeforeApply: true,
      appliesFrozenPatchOnly: true,
      acceptsProviderCommand: false,
      acceptsRendererCommand: false,
      acceptsWorkspacePath: false
    },
    safety: {
      backendOwnedPreviewConfirm: true,
      providerInvocationAvailable: false,
      directTaskCompletionAvailable: false,
      mainVerificationAutoPassAvailable: false,
      gateRegistrationAvailable: false,
      gitMutationAvailable: false,
      githubReleaseAutomationAvailable: false,
      rawProviderOutputAvailable: false
    },
    boundaries: { ...ADOPTION_MAIN_VERIFICATION_BOUNDARIES }
  };
}

export function buildAdoptionApplyRequest({ preview }) {
  return {
    contractName: 'adoptionApplyRequest.v1',
    contractVersion: ADOPTION_BACKEND_CONTRACT_VERSION,
    goalId: preview.goal.goalId,
    taskId: preview.task.taskId,
    adoptionId: preview.adoptionId,
    planHash: preview.planHash,
    workerRunId: preview.workerEvidence.workerRunId,
    reviewerVerdictId: preview.reviewerEvidence.verdictId,
    patchRef: preview.patchPlan.patchRef,
    patchFingerprint: preview.patchPlan.patchFingerprint,
    sourceFingerprint: preview.sourceFingerprint.current,
    fileChanges: preview.patchPlan.fileChanges,
    rollback: {
      required: true,
      rollbackRef: `rollback-ref:${preview.adoptionId}`
    },
    boundaries: { ...ADOPTION_MAIN_VERIFICATION_BOUNDARIES }
  };
}

export function buildMainVerificationPreviewFromBackend({
  goalId = V68_ADOPTION_MAIN_VERIFICATION_GOAL_ID,
  taskId = 'pr-3-main-verification-preview-confirm',
  generatedAt = new Date().toISOString(),
  adoptionConfirmation = null,
  currentSourceFingerprint = null
} = {}) {
  const adoption = normalizeAdoptionForMainVerification(adoptionConfirmation);
  const sourceFingerprint = {
    expected: adoption?.sourceFingerprint ?? null,
    current: currentSourceFingerprint ?? adoption?.sourceFingerprint ?? null
  };
  const verificationSuite = buildMainVerificationCommandSuite();
  const blockedReasons = mainVerificationPreviewBlockers({
    adoption,
    sourceFingerprint
  });
  const state = blockedReasons.length === 0 ? 'ready' : 'blocked';
  const preview = {
    contractName: MAIN_VERIFICATION_PREVIEW_CONTRACT_NAME,
    contractVersion: ADOPTION_BACKEND_CONTRACT_VERSION,
    goal: {
      goalId,
      title: goalId,
      state: 'active',
      sourceContract: 'goal-next-action.v1',
      sourceRef: `goal-next-action:${goalId}`
    },
    task: {
      taskId,
      title: taskId,
      state: 'active',
      sourceContract: 'goal-next-action.v1',
      sourceRef: `goal-next-action:${goalId}:${taskId}`
    },
    generatedAt: new Date(millisOrNow(generatedAt)).toISOString(),
    state,
    blockedReasons,
    adoption,
    sourceFingerprint,
    verificationSuite,
    confirmation: {
      endpoint: {
        method: 'POST',
        route: `/api/goals/${goalId}/main-verification-confirm`
      },
      requiresPlanHash: true,
      requiredFields: [...MAIN_VERIFICATION_CONFIRM_ALLOWED_FIELDS],
      suiteId: MAIN_VERIFICATION_SUITE_ID,
      acceptsCommandInput: false
    },
    gateDraft: {
      status: 'not-ready',
      available: false,
      eventType: 'main.verification-passed',
      gate: 'main-verification',
      reason: 'requires-main-verification-confirm'
    },
    safety: {
      backendOwnedPreviewConfirm: true,
      fixedCommandSuite: true,
      arbitraryCommandInputAccepted: false,
      providerInvocationAvailable: false,
      rendererCommandAvailable: false,
      registersGate: false,
      successImpliesGatePassed: false,
      gitMutationAvailable: false,
      githubReleaseAutomationAvailable: false,
      rawProviderOutputAvailable: false
    },
    boundaries: { ...ADOPTION_MAIN_VERIFICATION_BOUNDARIES }
  };

  return {
    ...preview,
    planHash: computeMainVerificationPreviewPlanHash(preview)
  };
}

export function validateMainVerificationConfirmInput({
  preview,
  input
} = {}) {
  const errors = [];

  if (!isPlainObject(preview) || preview.contractName !== MAIN_VERIFICATION_PREVIEW_CONTRACT_NAME) {
    errors.push('main verification preview must be a valid preview contract');
  } else if (preview.state !== 'ready') {
    errors.push('main verification preview must be ready before confirm');
  }

  if (!isPlainObject(input)) {
    errors.push('main verification confirm input must be a plain object');
    return { ok: false, errors };
  }

  for (const field of Object.keys(input)) {
    if (!MAIN_VERIFICATION_CONFIRM_ALLOWED_FIELDS.has(field)) {
      errors.push(`${field} is not an allowed main verification confirm field`);
    }
  }

  requireHash(errors, input.planHash, 'planHash');
  requireSafeToken(errors, input.goalId, 'goalId');
  requireSafeToken(errors, input.taskId, 'taskId');
  requireSafeToken(errors, input.suiteId, 'suiteId');
  requireSafeToken(errors, input.adoptionId, 'adoptionId');
  requireHash(errors, input.adoptionPlanHash, 'adoptionPlanHash');
  requireHash(errors, input.sourceFingerprint, 'sourceFingerprint');

  if (isPlainObject(preview) && preview.contractName === MAIN_VERIFICATION_PREVIEW_CONTRACT_NAME) {
    if (input.planHash !== preview.planHash) {
      errors.push('planHash must match main verification preview');
    }

    if (input.goalId !== preview.goal?.goalId) {
      errors.push('goalId must match main verification preview');
    }

    if (input.taskId !== preview.task?.taskId) {
      errors.push('taskId must match main verification preview');
    }

    if (input.suiteId !== preview.verificationSuite?.suiteId) {
      errors.push('suiteId must match main verification preview');
    }

    if (input.adoptionId !== preview.adoption?.adoptionId) {
      errors.push('adoptionId must match main verification preview');
    }

    if (input.adoptionPlanHash !== preview.adoption?.planHash) {
      errors.push('adoptionPlanHash must match main verification preview');
    }

    if (input.sourceFingerprint !== preview.sourceFingerprint?.current) {
      errors.push('sourceFingerprint must match main verification preview');
    }
  }

  return {
    ok: errors.length === 0,
    errors
  };
}

export async function confirmMainVerificationPreview({
  preview,
  input,
  runCommand,
  writeOperationStart = null,
  startedAt = new Date().toISOString(),
  finishedAt = null
} = {}) {
  const validation = validateMainVerificationConfirmInput({
    preview,
    input
  });

  if (!validation.ok) {
    throw new AdoptionBackendError(
      'invalid-main-verification-confirm-request',
      'Main verification confirm request is invalid.',
      { errors: validation.errors }
    );
  }

  if (typeof runCommand !== 'function') {
    throw new AdoptionBackendError(
      'missing-main-verification-runner',
      'Main verification confirm requires a backend-owned fixed-suite runner.',
      { runner: 'missing' }
    );
  }

  const operationId = `main-verification-${shortHash({
    goalId: preview.goal.goalId,
    taskId: preview.task.taskId,
    planHash: preview.planHash,
    adoptionId: preview.adoption.adoptionId
  })}`;
  const startedIso = new Date(millisOrNow(startedAt)).toISOString();
  const operationStart = buildMainVerificationOperationStart({
    preview,
    operationId,
    startedAt: startedIso
  });

  if (typeof writeOperationStart === 'function') {
    await writeOperationStart(structuredClone(operationStart));
  }

  const commandResults = [];

  for (const command of preview.verificationSuite.commands) {
    const commandStartedAt = new Date().toISOString();
    let result;

    try {
      result = await runCommand({
        commandId: command.id,
        executable: command.executable,
        args: [...command.args]
      });
    } catch (error) {
      result = {
        exitCode: null,
        signal: null,
        stdout: '',
        stderr: error.message,
        durationMs: null,
        timedOut: false,
        stalled: false
      };
    }

    commandResults.push(normalizeMainVerificationCommandResult({
      command,
      result,
      startedAt: commandStartedAt,
      completedAt: new Date().toISOString()
    }));
  }

  const failed = commandResults.filter((result) => result.status !== 'passed');
  const status = failed.length === 0 ? 'passed' : 'failed';
  const finishedIso = new Date(millisOrNow(finishedAt ?? new Date().toISOString())).toISOString();
  const gateDraft = buildMainVerificationGateDraft({
    preview,
    operationId,
    status
  });

  return {
    contractName: MAIN_VERIFICATION_CONFIRMATION_CONTRACT_NAME,
    contractVersion: ADOPTION_BACKEND_CONTRACT_VERSION,
    goalId: preview.goal.goalId,
    taskId: preview.task.taskId,
    operationId,
    mode: 'confirm',
    status,
    suiteId: preview.verificationSuite.suiteId,
    planHash: preview.planHash,
    adoptionId: preview.adoption.adoptionId,
    adoptionPlanHash: preview.adoption.planHash,
    sourceFingerprint: preview.sourceFingerprint.current,
    startedAt: startedIso,
    finishedAt: finishedIso,
    commandResults,
    runResult: {
      operationId,
      suiteId: preview.verificationSuite.suiteId,
      status,
      commandCount: commandResults.length,
      failedCommandCount: failed.length,
      gatePassed: false,
      commandResults
    },
    output: {
      stdout: buildMainVerificationOutputSummary(commandResults),
      stderr: buildMainVerificationErrorSummary(commandResults),
      exitCode: status === 'passed' ? 0 : failed.find((result) => Number.isInteger(result.exitCode))?.exitCode ?? 1
    },
    artifactRefs: [{
      kind: 'operation-registry',
      ref: `goal-operation-runs:${operationId}`,
      title: 'Main verification operation registry entry',
      status: 'available'
    }, ...(gateDraft.status === 'ready' ? [{
      kind: 'main-verification-gate-draft',
      ref: gateDraft.planHash,
      title: 'main.verification-passed gate draft',
      status: 'draft-ready'
    }] : [])],
    gateDraft,
    nextState: {
      verificationEvidenceReady: status === 'passed',
      mainVerified: false,
      gateDraftReady: gateDraft.status === 'ready',
      releaseReady: false
    },
    safety: {
      fixedCommandSuite: true,
      arbitraryCommandInputAccepted: false,
      providerInvocationAvailable: false,
      rendererCommandAvailable: false,
      registersGate: false,
      successImpliesGatePassed: false,
      mergeAvailable: false,
      pushAvailable: false,
      tagAvailable: false,
      githubReleaseAutomationAvailable: false,
      rawProviderOutputAvailable: false
    },
    boundaries: { ...ADOPTION_MAIN_VERIFICATION_BOUNDARIES }
  };
}

function buildAdoptionJournal({ preview, startedAt, status }) {
  return {
    contractName: 'adoptionJournal.v1',
    contractVersion: ADOPTION_BACKEND_CONTRACT_VERSION,
    journalId: `adoption-journal-${shortHash({
      adoptionId: preview.adoptionId,
      planHash: preview.planHash,
      startedAt
    })}`,
    adoptionId: preview.adoptionId,
    status,
    startedAt: new Date(millisOrNow(startedAt)).toISOString(),
    finishedAt: null,
    planHash: preview.planHash,
    workerRunId: preview.workerEvidence.workerRunId,
    reviewerVerdictId: preview.reviewerEvidence.verdictId,
    patchFingerprint: preview.patchPlan.patchFingerprint,
    sourceFingerprint: preview.sourceFingerprint.current,
    rollbackRef: `rollback-ref:${preview.adoptionId}`,
    failureReason: null
  };
}

function revalidatePreviewBeforeApply({
  preview,
  currentSourceFingerprint
}) {
  const errors = [];

  if (currentSourceFingerprint !== preview.sourceFingerprint.current) {
    errors.push('current source fingerprint must match adoption preview');
  }

  if (preview.patchPlan.appliesToFingerprint !== preview.sourceFingerprint.current) {
    errors.push('patch appliesToFingerprint must match adoption preview source fingerprint');
  }

  if (preview.patchPlan.patchFingerprint !== preview.confirmation.patchFingerprint) {
    errors.push('patch fingerprint must match adoption confirmation binding');
  }

  return {
    ok: errors.length === 0,
    errors,
    sourceFingerprint: currentSourceFingerprint,
    patchFingerprint: preview.patchPlan.patchFingerprint,
    planHash: preview.planHash
  };
}

async function fakeAdoptionApplicator(request) {
  return {
    status: 'applied',
    appliedPatchRef: request.patchRef,
    changedFiles: request.fileChanges.map((change) => change.path),
    journalAppendRequired: true,
    verifierStatus: 'not-run',
    mainVerified: false,
    gateDraftReady: false,
    releaseReady: false
  };
}

function normalizeApplyResult(result) {
  const source = isPlainObject(result) ? result : {};
  const applied = source.status === 'applied' || source.applied === true;

  return {
    status: applied ? 'applied' : 'failed',
    appliedPatchRef: safeRef(source.appliedPatchRef) ?? null,
    changedFiles: safeStringArray(source.changedFiles),
    journalAppendRequired: source.journalAppendRequired !== false,
    verifierStatus: 'not-run',
    mainVerified: false,
    gateDraftReady: false,
    releaseReady: false,
    failureReason: applied ? null : firstNonEmptyString(source.failureReason, 'Adoption applicator failed.')
  };
}

function normalizeAdoptionForMainVerification(confirmation) {
  if (!isPlainObject(confirmation) || confirmation.contractName !== ADOPTION_CONFIRMATION_CONTRACT_NAME) {
    return null;
  }

  return {
    adoptionId: safeTokenOrNull(confirmation.adoptionId),
    status: confirmation.status === 'applied' ? 'applied' : 'failed',
    planHash: HASH_PATTERN.test(confirmation.planHash) ? confirmation.planHash : null,
    workerRunId: safeTokenOrNull(confirmation.workerRunId),
    reviewerVerdictId: safeTokenOrNull(confirmation.reviewerVerdictId),
    patchFingerprint: HASH_PATTERN.test(confirmation.patchFingerprint) ? confirmation.patchFingerprint : null,
    sourceFingerprint: HASH_PATTERN.test(confirmation.sourceFingerprint) ? confirmation.sourceFingerprint : null,
    adoptionApplied: confirmation.nextState?.adoptionApplied === true,
    taskCompleted: confirmation.nextState?.taskCompleted === true,
    mainVerified: confirmation.nextState?.mainVerified === true,
    gateDraftReady: confirmation.nextState?.gateDraftReady === true,
    releaseReady: confirmation.nextState?.releaseReady === true,
    journalId: safeTokenOrNull(confirmation.journal?.journalId),
    applyStatus: confirmation.applyResult?.status === 'applied' ? 'applied' : 'failed'
  };
}

function mainVerificationPreviewBlockers({
  adoption,
  sourceFingerprint
}) {
  const blockers = [];

  if (adoption === null) {
    return ['missing-adoption-confirmation'];
  }

  if (!isNonEmptySafeToken(adoption.adoptionId)) {
    blockers.push('invalid-adoption-id');
  }

  if (!HASH_PATTERN.test(adoption.planHash ?? '')) {
    blockers.push('invalid-adoption-plan-hash');
  }

  if (!HASH_PATTERN.test(adoption.sourceFingerprint ?? '')) {
    blockers.push('invalid-adoption-source-fingerprint');
  }

  if (adoption.status !== 'applied' || adoption.applyStatus !== 'applied' || adoption.adoptionApplied !== true) {
    blockers.push('adoption-not-applied');
  }

  if (adoption.taskCompleted || adoption.mainVerified || adoption.gateDraftReady || adoption.releaseReady) {
    blockers.push('adoption-output-claims-downstream-state');
  }

  if (sourceFingerprint.current !== null && sourceFingerprint.expected !== null && sourceFingerprint.current !== sourceFingerprint.expected) {
    blockers.push('source-fingerprint-mismatch');
  }

  return blockers;
}

function buildMainVerificationCommandSuite() {
  return {
    suiteId: MAIN_VERIFICATION_SUITE_ID,
    fixed: true,
    commands: MAIN_VERIFICATION_FIXED_COMMANDS.map((command, index) => ({
      id: `main-verification-command-${index + 1}`,
      command,
      ...mainVerificationInvocation(command)
    }))
  };
}

function mainVerificationInvocation(command) {
  switch (command) {
    case 'node --test tests/v68-adoption-main-verification-loop.test.js':
      return { executable: 'node', args: ['--test', 'tests/v68-adoption-main-verification-loop.test.js'] };
    case 'node --test tests/v67-claude-code-reviewer-lane.test.js':
      return { executable: 'node', args: ['--test', 'tests/v67-claude-code-reviewer-lane.test.js'] };
    case 'node --test tests/v66-controlled-codex-worker-execution.test.js':
      return { executable: 'node', args: ['--test', 'tests/v66-controlled-codex-worker-execution.test.js'] };
    case 'pnpm check':
      return { executable: 'pnpm', args: ['check'] };
    case 'git diff --check':
      return { executable: 'git', args: ['diff', '--check'] };
    default:
      throw new AdoptionBackendError(
        'invalid-main-verification-command',
        'Main verification suite contains a command outside the fixed allowlist.',
        { command }
      );
  }
}

function computeMainVerificationPreviewPlanHash(preview) {
  const copy = structuredClone(preview);
  delete copy.planHash;
  delete copy.generatedAt;
  return `sha256:${createHash('sha256').update(stableJson(copy)).digest('hex')}`;
}

function buildMainVerificationOperationStart({
  preview,
  operationId,
  startedAt
}) {
  return {
    contractName: 'mainVerificationOperationJournal.v1',
    contractVersion: ADOPTION_BACKEND_CONTRACT_VERSION,
    operationId,
    goalId: preview.goal.goalId,
    taskId: preview.task.taskId,
    status: 'running',
    suiteId: preview.verificationSuite.suiteId,
    planHash: preview.planHash,
    adoptionId: preview.adoption.adoptionId,
    adoptionPlanHash: preview.adoption.planHash,
    sourceFingerprint: preview.sourceFingerprint.current,
    startedAt,
    gatePassed: false,
    releaseReady: false
  };
}

function normalizeMainVerificationCommandResult({
  command,
  result,
  startedAt,
  completedAt
}) {
  const source = isPlainObject(result) ? result : {};
  const exitCode = Number.isInteger(source.exitCode) ? source.exitCode : null;
  const status = exitCode === 0 ? 'passed' : 'failed';

  return {
    id: command.id,
    command: command.command,
    executable: command.executable,
    args: [...command.args],
    status,
    exitCode,
    signal: typeof source.signal === 'string' ? source.signal : null,
    durationMs: Number.isFinite(source.durationMs) ? source.durationMs : null,
    timedOut: source.timedOut === true,
    stalled: source.stalled === true,
    stdoutSummary: summarizeVerificationOutput(source.stdout ?? ''),
    stderrSummary: summarizeVerificationOutput(source.stderr ?? ''),
    startedAt,
    completedAt
  };
}

function buildMainVerificationGateDraft({
  preview,
  operationId,
  status
}) {
  if (status !== 'passed') {
    return {
      contractName: MAIN_VERIFICATION_GATE_DRAFT_CONTRACT_NAME,
      contractVersion: ADOPTION_BACKEND_CONTRACT_VERSION,
      status: 'blocked',
      goalId: preview.goal.goalId,
      taskId: preview.task.taskId,
      eventType: 'main.verification-passed',
      gate: 'main-verification',
      reason: 'main-verification-suite-failed',
      mutationPerformed: false
    };
  }

  const evidenceRef = `goal-operation-runs:${operationId}`;
  const verifierId = 'main-verifier-v68';
  const draftCore = {
    goalId: preview.goal.goalId,
    taskId: preview.task.taskId,
    eventType: 'main.verification-passed',
    gate: 'main-verification',
    gateStatus: 'passed',
    verifierId,
    evidenceRef,
    operationId,
    verificationPlanHash: preview.planHash
  };
  const planHash = `sha256:${createHash('sha256').update(stableJson(draftCore)).digest('hex')}`;

  return {
    contractName: MAIN_VERIFICATION_GATE_DRAFT_CONTRACT_NAME,
    contractVersion: ADOPTION_BACKEND_CONTRACT_VERSION,
    status: 'ready',
    ...draftCore,
    planHash,
    mutationPerformed: false,
    confirm: {
      requiresSeparatePlanHash: true,
      previewRoute: `/api/goals/${preview.goal.goalId}/event-plan-preview`,
      confirmRoute: `/api/goals/${preview.goal.goalId}/event-plan-confirm`,
      requiredFields: ['command', 'task', 'gate', 'status', 'verifier', 'evidenceRef', 'planHash']
    },
    previewParams: {
      command: 'gate',
      task: preview.task.taskId,
      gate: 'main-verification',
      status: 'passed',
      verifier: verifierId,
      evidenceRef
    }
  };
}

function buildMainVerificationOutputSummary(commandResults) {
  return commandResults.map((result) => [
    `command=${result.command}`,
    `status=${result.status}`,
    `exitCode=${result.exitCode ?? 'null'}`,
    `stdout=${result.stdoutSummary || ''}`
  ].join('\n')).join('\n---\n');
}

function buildMainVerificationErrorSummary(commandResults) {
  return commandResults
    .filter((result) => result.stderrSummary)
    .map((result) => `${result.command}\n${result.stderrSummary}`)
    .join('\n---\n');
}

function summarizeVerificationOutput(output) {
  const lines = String(output ?? '')
    .replace(/\/Users\/[^\s]*/gu, '[redacted-path]')
    .split(/\r?\n/u)
    .map((line) => line.trimEnd())
    .filter((line) => line.trim() !== '');
  const selected = lines.length > 12
    ? [...lines.slice(0, 6), '[truncated]', ...lines.slice(-6)]
    : lines;

  return selected.join('\n').slice(0, 1200);
}

function defaultWorkerEvidence({ taskId }) {
  return {
    sourceContract: 'workerRunResult.v1',
    sourceRef: 'fixtures/contracts/worker-run/result.sanitized-success.v1.json',
    workerRunId: `worker-run-v66-${taskId}`,
    taskId,
    providerId: 'codex-cli',
    role: 'worker',
    status: 'needs-review',
    nextState: {
      taskState: 'needs-review',
      reviewRequired: true,
      taskCompleted: false,
      reviewApproved: false,
      mainVerified: false,
      releaseReady: false
    },
    sanitizedResult: {
      changedFiles: ['src/symphony/adoption-main-verification-loop-contracts.js'],
      validationCommands: ['node --test tests/v68-adoption-main-verification-loop.test.js']
    },
    evidenceRefs: [{
      kind: 'repo-doc',
      ref: 'docs/qa/v66-controlled-codex-worker-execution-acceptance.md',
      label: 'v66 worker evidence'
    }]
  };
}

function defaultReviewerVerdict({ taskId }) {
  return {
    sourceContract: 'reviewerRunVerdict.v1',
    sourceRef: 'fixtures/contracts/reviewer-run/verdict.approved.v1.json',
    verdictId: `reviewer-verdict-v67-${taskId}`,
    status: 'approved',
    reviewedWorkerRunId: `worker-run-v66-${taskId}`,
    reviewerActorId: 'claude-reviewer-v67',
    workerActorId: 'codex-worker-v66',
    nextState: {
      reviewApproved: true,
      revisionRequired: false,
      taskCompleted: false,
      adoptionReady: false,
      mainVerified: false,
      releaseReady: false
    },
    evidenceRefs: [{
      kind: 'repo-doc',
      ref: 'docs/qa/v67-claude-code-reviewer-lane-acceptance.md',
      label: 'v67 reviewer evidence'
    }]
  };
}

function defaultWorktreeState() {
  return {
    state: 'clean',
    branch: 'main',
    dirty: false,
    expectedMainWorktree: true,
    sourceRef: 'backend-worktree-state:v68-clean'
  };
}

function defaultSourceFingerprint() {
  const fingerprint = 'sha256:1111111111111111111111111111111111111111111111111111111111111111';

  return {
    expected: fingerprint,
    current: fingerprint,
    workerRecorded: fingerprint,
    reviewerRecorded: fingerprint
  };
}

function defaultPatchPlan() {
  const sourceFingerprint = 'sha256:1111111111111111111111111111111111111111111111111111111111111111';
  const patchFingerprint = 'sha256:2222222222222222222222222222222222222222222222222222222222222222';

  return {
    patchId: 'patch-v68-backend-ready',
    patchRef: 'artifact-ref:v68:backend-ready-patch',
    patchFingerprint,
    expectedPatchFingerprint: patchFingerprint,
    appliesToFingerprint: sourceFingerprint,
    applyCheck: 'passed',
    fileChanges: [{
      path: 'src/symphony/adoption-main-verification-loop-backend.js',
      operation: 'modify',
      fingerprintBefore: sourceFingerprint,
      fingerprintAfter: patchFingerprint
    }]
  };
}

function defaultArtifactRefs() {
  return [{
    kind: 'artifact-ref',
    ref: 'artifact-ref:v68:backend-ready-patch',
    label: 'bounded adoption patch'
  }];
}

function requireSafeToken(errors, value, field) {
  if (typeof value !== 'string' || !SAFE_TOKEN_PATTERN.test(value)) {
    errors.push(`${field} must be a safe token`);
  }
}

function requireHash(errors, value, field) {
  if (typeof value !== 'string' || !HASH_PATTERN.test(value)) {
    errors.push(`${field} must be a sha256 hash`);
  }
}

function safeRef(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();

  if (trimmed === '' || trimmed.includes('..') || /(?:^|[/.])(?:\.codex|\.claude|\.git|\.symphony)(?:[/]|$)|\/Users\/|\.jsonl(?:$|[/\s])/iu.test(trimmed)) {
    return null;
  }

  return trimmed;
}

function safeTokenOrNull(value) {
  return isNonEmptySafeToken(value) ? value : null;
}

function isNonEmptySafeToken(value) {
  return typeof value === 'string' && SAFE_TOKEN_PATTERN.test(value);
}

function safeStringArray(values) {
  const source = Array.isArray(values) ? values : [];

  return source
    .filter((value) => typeof value === 'string')
    .map((value) => value.trim())
    .filter((value) => value !== '' && safeRef(value) !== null);
}

function firstNonEmptyString(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim() !== '') {
      return value.trim();
    }
  }

  return '';
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function millisOrNow(value) {
  const millis = Date.parse(value);

  return Number.isNaN(millis) ? Date.now() : millis;
}

function shortHash(value) {
  const text = JSON.stringify(value, Object.keys(value).sort());
  let hash = 0;

  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) - hash + text.charCodeAt(index)) | 0;
  }

  return Math.abs(hash).toString(16).padStart(8, '0');
}

function stableJson(value) {
  return JSON.stringify(sortStable(value));
}

function sortStable(value) {
  if (Array.isArray(value)) {
    return value.map(sortStable);
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, sortStable(value[key])])
    );
  }

  return value;
}
