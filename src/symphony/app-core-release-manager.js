import { basename, join } from 'node:path';

import { buildActionManifestContract } from './action-manifest.js';
import { buildAgentCliProviderHealthContract } from './agent-cli-provider-health.js';
import { buildAppCoreBackupExport } from './app-core-backup-export.js';
import { buildAppCoreDiagnosticsBundle } from './app-core-diagnostics-bundle.js';
import { buildAppCoreRestoreValidation } from './app-core-restore-validation.js';
import { buildAppDataInventory } from './app-data-inventory.js';
import { buildAppStateSnapshot } from './app-state-snapshot.js';
import { buildArtifactIndex } from './artifact-indexer.js';
import { buildGoalCloseoutReport } from './goal-closeout-report.js';
import { readGoalEventJournal } from './goal-event-journal.js';
import { buildGoalProgressLedger } from './goal-progress-ledger.js';
import { resolveGoalRunbookGoalId } from './goal-runbook-context.js';
import { buildJobModelContract } from './job-model-contract.js';
import { buildLocalRuntimeHealth } from './local-runtime-health.js';

export const APP_CORE_RELEASE_MANAGER_CONTRACT_NAME = 'app-core-release-manager.v1';
export const APP_CORE_RELEASE_MANAGER_CONTRACT_VERSION = 1;

const V40_GOAL_ID = 'v40-personal-workflow-router-app-core-release';
const DEFAULT_FINAL_EVIDENCE_REF = 'docs/plans/v40-release-evidence-2026-06-02.md';
const DEFAULT_TASK_ID = 'task-4';
const REQUIRED_SOURCE_CONTRACTS = Object.freeze([
  'goal-closeout-report.v1',
  'goal-progress-ledger.v1',
  'goal-event-log.v1',
  'app-state-snapshot.v1',
  'action-manifest.v1',
  'job-model.v1',
  'artifact-index.v1',
  'agent-cli-provider-health.v1',
  'app-data-inventory.v1',
  'app-core-backup-export.v1',
  'app-core-diagnostics-bundle.v1',
  'app-core-restore-validation.v1'
]);
const CAPABILITY_ROWS = Object.freeze([
  Object.freeze({
    version: 'v34',
    id: 'action-registry',
    label: 'Action Registry',
    sourceContract: 'action-manifest.v1',
    route: '/api/actions/manifest',
    acceptance: 'Declared actions and capability previews are available without renderer command execution.'
  }),
  Object.freeze({
    version: 'v35',
    id: 'job-queue',
    label: 'Job Queue',
    sourceContract: 'job-model.v1',
    route: '/api/jobs',
    acceptance: 'Controlled actions can be represented as recoverable job state.'
  }),
  Object.freeze({
    version: 'v36',
    id: 'artifact-evidence-index',
    label: 'Artifact / Evidence Index',
    sourceContract: 'artifact-index.v1',
    route: '/api/artifacts',
    acceptance: 'Evidence refs are browsable through derived index data while ArtifactStore remains canonical.'
  }),
  Object.freeze({
    version: 'v37',
    id: 'desktop-shell',
    label: 'Desktop Shell',
    sourceContract: 'app-state-snapshot.v1',
    route: '/api/runtime/snapshot',
    acceptance: 'Desktop shell can attach to sidecar state without bypassing the kernel.'
  }),
  Object.freeze({
    version: 'v38',
    id: 'provider-hub',
    label: 'Provider Hub',
    sourceContract: 'agent-cli-provider-health.v1',
    route: '/api/providers/health',
    acceptance: 'Provider availability and blockers are visible without model invocation or secret exposure.'
  }),
  Object.freeze({
    version: 'v39',
    id: 'backup-diagnostics-migration',
    label: 'Backup / Diagnostics / Migration',
    sourceContract: 'app-core-backup-export.v1 + app-core-diagnostics-bundle.v1 + app-core-restore-validation.v1',
    route: '/api/backup/export',
    acceptance: 'Backup, diagnostics, migration, and restore checks are read-only or dry-run by default.'
  })
]);
const FALSE_BOUNDARY_FIELDS = Object.freeze([
  'closeoutExecutionAvailable',
  'releaseReadyDeclarationAvailable',
  'releaseGateMutationAvailable',
  'shellExecutionAvailable',
  'modelInvocationAvailable',
  'arbitraryCommandExecutionAvailable',
  'arbitraryPathReadAvailable',
  'localFileOpenAvailable',
  'gitWriteAvailable',
  'mergeAvailable',
  'pushAvailable',
  'tagAvailable',
  'publishAvailable',
  'providerCliExecutionAvailable',
  'selfApprovalAvailable',
  'frontendStatusInferenceAvailable'
]);

export async function buildAppCoreReleaseManager({
  cwd = process.cwd(),
  stateDir = '.symphony',
  goalId = 'latest',
  taskId = DEFAULT_TASK_ID,
  generatedAt = new Date().toISOString(),
  startedAt = generatedAt,
  env = process.env,
  finalEvidenceRef = DEFAULT_FINAL_EVIDENCE_REF
} = {}) {
  assertSafeContextRef(goalId, 'goalId');
  assertSafeContextRef(taskId, 'taskId');

  const resolvedGoalId = await resolveReleaseManagerGoalId({ stateDir, goalId });
  const [
    closeout,
    ledger,
    eventLog,
    runtimeHealth,
    appState,
    actionManifest,
    jobModel,
    artifactIndex,
    providerHealth,
    dataInventory,
    backupExport,
    diagnosticsBundle,
    restoreValidation
  ] = await Promise.all([
    buildCloseoutOrNull({ stateDir, goalId: resolvedGoalId, generatedAt }),
    buildLedgerOrNull({ stateDir, goalId: resolvedGoalId, generatedAt }),
    readEventLogOrEmpty({ stateDir, goalId: resolvedGoalId }),
    buildLocalRuntimeHealth({ cwd, generatedAt, startedAt }),
    buildAppStateSnapshot({ cwd, stateDir, goalId: resolvedGoalId, generatedAt, startedAt }),
    buildActionManifestContract({ goalId: resolvedGoalId, taskId, generatedAt }),
    buildJobModelContract({ goalId: resolvedGoalId, taskId, generatedAt }),
    buildArtifactIndex({ artifactStoreDir: join(stateDir, 'artifacts'), stateDir, goalId: resolvedGoalId, taskId, generatedAt }),
    buildAgentCliProviderHealthContract({ generatedAt, env }),
    buildAppDataInventory({ cwd, stateDir, goalId: resolvedGoalId, taskId, generatedAt, startedAt, env }),
    buildAppCoreBackupExport({ cwd, stateDir, goalId: resolvedGoalId, taskId, generatedAt }),
    buildAppCoreDiagnosticsBundle({ cwd, stateDir, goalId: resolvedGoalId, taskId, generatedAt }),
    buildAppCoreRestoreValidation({ cwd, stateDir, goalId: resolvedGoalId, taskId, generatedAt })
  ]);
  const capabilityChecklist = buildCapabilityChecklist({
    actionManifest,
    jobModel,
    artifactIndex,
    providerHealth,
    appState,
    backupExport,
    diagnosticsBundle,
    restoreValidation
  });
  const closeoutStatus = buildCloseoutStatus({ closeout, ledger });
  const releaseReadiness = buildReleaseReadiness({
    closeout,
    capabilityChecklist
  });

  return assertAppCoreReleaseManagerContract({
    contractName: APP_CORE_RELEASE_MANAGER_CONTRACT_NAME,
    contractVersion: APP_CORE_RELEASE_MANAGER_CONTRACT_VERSION,
    generatedAt,
    readOnly: true,
    context: {
      goalId,
      resolvedGoalId,
      taskId,
      cwdRef: basename(cwd),
      stateSource: 'explicit-backend-contracts',
      sourceContracts: [...REQUIRED_SOURCE_CONTRACTS],
      managerRole: 'final-app-core-evidence-draft'
    },
    releaseReadiness,
    closeoutStatus,
    capabilityChecklist,
    finalEvidenceDraft: buildFinalEvidenceDraft({
      finalEvidenceRef,
      resolvedGoalId,
      taskId,
      releaseReadiness,
      closeoutStatus,
      capabilityChecklist,
      eventLog
    }),
    sourceSummary: {
      runtimeStatus: runtimeHealth.status,
      appStateContract: appState.contractName,
      providerState: providerHealth.summary.state,
      appDataDomainCount: dataInventory.summary.domainCount,
      evidenceRefCount: dataInventory.summary.evidenceRefCount,
      artifactEntryCount: artifactIndex.entries.length,
      goalEventCount: eventLog.events.length
    },
    boundaries: releaseManagerBoundaries(),
    note: 'App Core Release Manager收口v34-v39能力和final evidence draft。它不执行goal closeout，不登记release.ready，不运行命令，也不从前端状态、分支、文件名或任务标题推断发布状态。'
  });
}

export function validateAppCoreReleaseManagerContract(contract) {
  const errors = [];

  if (!isPlainObject(contract)) {
    return { ok: false, errors: ['contract must be a plain object'] };
  }

  requireExact(errors, contract.contractName, 'contractName', APP_CORE_RELEASE_MANAGER_CONTRACT_NAME);
  requireExact(errors, contract.contractVersion, 'contractVersion', APP_CORE_RELEASE_MANAGER_CONTRACT_VERSION);
  requireIsoTimestamp(errors, contract.generatedAt, 'generatedAt');
  requireExact(errors, contract.readOnly, 'readOnly', true);
  validateContext(errors, contract.context);
  validateReleaseReadiness(errors, contract.releaseReadiness);
  validateCloseoutStatus(errors, contract.closeoutStatus);
  validateCapabilityChecklist(errors, contract.capabilityChecklist);
  validateFinalEvidenceDraft(errors, contract.finalEvidenceDraft);
  validateSourceSummary(errors, contract.sourceSummary);
  validateBoundaries(errors, contract.boundaries);

  return { ok: errors.length === 0, errors };
}

export function assertAppCoreReleaseManagerContract(contract) {
  const result = validateAppCoreReleaseManagerContract(contract);

  if (!result.ok) {
    throw new Error(`Invalid app core release manager contract: ${result.errors.join('; ')}`);
  }

  return contract;
}

export function renderAppCoreReleaseManagerText(contract) {
  return [
    `App core release manager: ${contract.context?.goalId ?? 'unknown'}`,
    `resolved goal: ${contract.context?.resolvedGoalId ?? 'unknown'}`,
    `readiness: ${contract.releaseReadiness?.state ?? 'unknown'}`,
    `capabilities passed: ${contract.capabilityChecklist?.passedCount ?? 0}/${contract.capabilityChecklist?.totalCount ?? 0}`,
    `closeout missing: ${contract.closeoutStatus?.missingCount ?? 'unknown'}`,
    `final evidence ref: ${contract.finalEvidenceDraft?.evidenceRef ?? 'missing'}`,
    'boundary: read-only release manager; no release.ready declaration, tag, push, publish, or shell execution'
  ].join('\n') + '\n';
}

async function resolveReleaseManagerGoalId({ stateDir, goalId }) {
  if (goalId !== 'latest') {
    return goalId;
  }

  try {
    return await resolveGoalRunbookGoalId({ stateDir, goalId }) ?? V40_GOAL_ID;
  } catch {
    return V40_GOAL_ID;
  }
}

async function buildCloseoutOrNull({ stateDir, goalId, generatedAt }) {
  try {
    return await buildGoalCloseoutReport({ stateDir, goalId, generatedAt });
  } catch {
    return null;
  }
}

async function buildLedgerOrNull({ stateDir, goalId, generatedAt }) {
  try {
    return await buildGoalProgressLedger({ stateDir, goalId, generatedAt });
  } catch {
    return null;
  }
}

async function readEventLogOrEmpty({ stateDir, goalId }) {
  try {
    return await readGoalEventJournal({ stateDir, goalId });
  } catch {
    return { events: [] };
  }
}

function buildCapabilityChecklist({
  actionManifest,
  jobModel,
  artifactIndex,
  providerHealth,
  appState,
  backupExport,
  diagnosticsBundle,
  restoreValidation
}) {
  const sourceMap = {
    'action-registry': actionCapabilityStatus(actionManifest),
    'job-queue': jobCapabilityStatus(jobModel),
    'artifact-evidence-index': artifactCapabilityStatus(artifactIndex),
    'desktop-shell': desktopCapabilityStatus(appState),
    'provider-hub': providerCapabilityStatus(providerHealth),
    'backup-diagnostics-migration': backupDiagnosticsCapabilityStatus({
      backupExport,
      diagnosticsBundle,
      restoreValidation
    })
  };
  const items = CAPABILITY_ROWS.map((row) => ({
    ...row,
    ...sourceMap[row.id]
  }));
  const passedCount = items.filter((item) => item.status === 'passed').length;
  const blockedCount = items.filter((item) => item.status === 'blocked').length;
  const warningCount = items.filter((item) => item.status === 'warning').length;

  return {
    totalCount: items.length,
    passedCount,
    warningCount,
    blockedCount,
    items,
    sourcePolicy: 'v34-v39 backend contracts only'
  };
}

function actionCapabilityStatus(actionManifest) {
  const actions = Array.isArray(actionManifest?.actions) ? actionManifest.actions : [];
  const unsafe = actionManifest?.boundaries?.arbitraryCommandExecutionAvailable === true ||
    actionManifest?.boundaries?.rendererExecutionAvailable === true;

  return {
    status: actions.length > 0 && unsafe === false ? 'passed' : 'blocked',
    evidence: `${actions.length} declared actions; arbitrary command execution=${String(actionManifest?.boundaries?.arbitraryCommandExecutionAvailable ?? false)}`,
    blocker: unsafe ? 'Action manifest exposes an execution boundary.' : null
  };
}

function jobCapabilityStatus(jobModel) {
  const status = typeof jobModel?.job?.status === 'string' ? jobModel.job.status : null;
  const safe = jobModel?.boundaries?.arbitraryCommandExecutionAvailable === false &&
    jobModel?.boundaries?.jobExecutionAvailable === false;

  return {
    status: status !== null && safe ? 'passed' : 'blocked',
    evidence: `job=${jobModel?.job?.job_id ?? 'missing'} status=${status ?? 'missing'}`,
    blocker: safe ? null : 'Job model boundary allows execution from this read-only path.'
  };
}

function artifactCapabilityStatus(artifactIndex) {
  const readOnly = artifactIndex?.boundaries?.readOnly === true;
  const canonical = artifactIndex?.context?.canonicalSource === 'ArtifactStore';

  return {
    status: readOnly && canonical ? 'passed' : 'blocked',
    evidence: `${artifactIndex?.entries?.length ?? 0} indexed entries; canonical=${artifactIndex?.context?.canonicalSource ?? 'missing'}`,
    blocker: readOnly && canonical ? null : 'Artifact index is not a read-only ArtifactStore-derived cache.'
  };
}

function desktopCapabilityStatus(appState) {
  const sidecarState = appState?.runtime_health?.sidecarHost?.attach?.state;
  const shellSafe = appState?.runtime_health?.sidecarHost?.launcher?.rendererLaunchAvailable === false &&
    appState?.boundaries?.shellExecutionAvailable !== true;

  return {
    status: sidecarState === 'attached' && shellSafe ? 'passed' : 'warning',
    evidence: `sidecar attach=${sidecarState ?? 'missing'} rendererLaunch=${String(appState?.runtime_health?.sidecarHost?.launcher?.rendererLaunchAvailable ?? false)}`,
    blocker: shellSafe ? null : 'Desktop shell boundary exposes renderer launch or shell execution.'
  };
}

function providerCapabilityStatus(providerHealth) {
  const providers = Array.isArray(providerHealth?.providers) ? providerHealth.providers : [];
  const safe = providerHealth?.boundaries?.secretValueExposureAvailable === false &&
    providerHealth?.boundaries?.modelInvocationAvailable === false;

  return {
    status: providers.length > 0 && safe ? 'passed' : 'warning',
    evidence: `${providers.length} provider profiles; health=${providerHealth?.summary?.state ?? 'missing'}`,
    blocker: safe ? null : 'Provider hub boundary exposes secrets or model invocation.'
  };
}

function backupDiagnosticsCapabilityStatus({
  backupExport,
  diagnosticsBundle,
  restoreValidation
}) {
  const safe = backupExport?.boundaries?.writesBundleFile === false &&
    diagnosticsBundle?.boundaries?.includesSecretValues === false &&
    restoreValidation?.boundaries?.validationOnly === true &&
    restoreValidation?.boundaries?.appliesRestore === false;

  return {
    status: safe ? 'passed' : 'blocked',
    evidence: `backup=${backupExport?.manifest?.managedStateEntryCount ?? 0} managed entries; diagnostics=${diagnosticsBundle?.health?.status ?? 'missing'}; restore=${restoreValidation?.status ?? 'missing'}`,
    blocker: safe ? null : 'Backup, diagnostics, or restore validation boundary allows writes or unsafe payloads.'
  };
}

function buildCloseoutStatus({ closeout, ledger }) {
  if (closeout === null) {
    return {
      state: 'missing',
      totalTasks: 0,
      workerEvidenceComplete: false,
      reviewEvidenceComplete: false,
      mainVerificationComplete: false,
      releaseReady: false,
      releaseReadySource: null,
      missingCount: null,
      releaseGateStatuses: {},
      sourceContract: null,
      blocker: 'goal-closeout-report.v1 is unavailable for the selected goal.'
    };
  }

  return {
    state: closeout.summary.releaseReady === true ? 'release-ready-declared' : closeout.missing.length === 0 ? 'ready-for-release-ready-event' : 'pending-evidence',
    totalTasks: closeout.summary.totalTasks,
    workerEvidenceComplete: closeout.summary.workerEvidenceComplete,
    reviewEvidenceComplete: closeout.summary.reviewEvidenceComplete,
    mainVerificationComplete: closeout.summary.mainVerificationComplete,
    releaseReady: closeout.summary.releaseReady,
    releaseReadySource: closeout.summary.releaseReadySource,
    missingCount: closeout.missing.length,
    releaseGateStatuses: closeout.releaseGates,
    sourceContract: closeout.contractName,
    goalStatusSource: ledger?.contractName ?? null,
    blocker: closeout.missing.length === 0 ? null : `${closeout.missing.length} closeout items remain.`
  };
}

function buildReleaseReadiness({ closeout, capabilityChecklist }) {
  const capabilitiesPassed = capabilityChecklist.blockedCount === 0;

  if (closeout === null) {
    return {
      state: 'blocked',
      reason: 'No goal closeout report is available.',
      releaseReadyDeclared: false,
      releaseReadySource: null,
      declarationAuthorized: false,
      declarationCommandAvailable: false,
      readyEventRequired: true,
      capabilitiesPassed
    };
  }

  const releaseReadyDeclared = closeout.summary.releaseReady === true;
  const closeoutMissingCount = closeout.missing.length;
  const state = releaseReadyDeclared
    ? 'declared'
    : closeoutMissingCount === 0 && capabilitiesPassed ? 'pending-release-ready-event' : 'blocked';
  const reason = releaseReadyDeclared
    ? 'release.ready-declared is present in the goal event log.'
    : closeoutMissingCount === 0 && capabilitiesPassed
      ? 'All checklist inputs are present; release.ready still requires an explicit release-manager gate outside this worker phase.'
      : 'Closeout gaps or capability blockers remain.';

  return {
    state,
    reason,
    releaseReadyDeclared,
    releaseReadySource: closeout.summary.releaseReadySource,
    declarationAuthorized: false,
    declarationCommandAvailable: false,
    readyEventRequired: releaseReadyDeclared !== true,
    capabilitiesPassed
  };
}

function buildFinalEvidenceDraft({
  finalEvidenceRef,
  resolvedGoalId,
  taskId,
  releaseReadiness,
  closeoutStatus,
  capabilityChecklist,
  eventLog
}) {
  return {
    state: releaseReadiness.state === 'blocked' ? 'blocked' : 'draft-ready',
    evidenceRef: finalEvidenceRef,
    requiredSections: [
      'Goal id / release name / baseline',
      'v34-v39 capability checklist with source contracts',
      'Task worker/reviewer/main verification evidence refs',
      'Release gate evidence refs and command results',
      'Release.ready declaration source after authorized closeout',
      'Native UX / distribution handoff pointer'
    ],
    sourceEventCount: eventLog.events.length,
    suggestedTitle: 'v40 App Core Release Evidence',
    goalId: resolvedGoalId,
    taskId,
    blockerCount: closeoutStatus.missingCount === null
      ? 1 + capabilityChecklist.blockedCount
      : closeoutStatus.missingCount + capabilityChecklist.blockedCount,
    releaseReadyDeclarationIncluded: false,
    note: 'Draft only. The release.ready gate remains separate and requires explicit authorization plus evidence.'
  };
}

function releaseManagerBoundaries() {
  const boundaries = {
    readOnly: true,
    writesEvidenceFile: false,
    emitsGoalEvent: false,
    statusSource: 'explicit-backend-contracts-and-goal-events',
    evidencePolicy: 'draft-ref-and-section-list-only'
  };

  for (const field of FALSE_BOUNDARY_FIELDS) {
    boundaries[field] = false;
  }

  return boundaries;
}

function validateContext(errors, context) {
  if (!isPlainObject(context)) {
    errors.push('context must be a plain object');
    return;
  }

  requireNonEmptyString(errors, context.goalId, 'context.goalId');
  requireNonEmptyString(errors, context.resolvedGoalId, 'context.resolvedGoalId');
  requireNonEmptyString(errors, context.taskId, 'context.taskId');
  requireNonEmptyString(errors, context.cwdRef, 'context.cwdRef');
  requireExact(errors, context.stateSource, 'context.stateSource', 'explicit-backend-contracts');
  requireExact(errors, context.managerRole, 'context.managerRole', 'final-app-core-evidence-draft');
  if (!Array.isArray(context.sourceContracts) || context.sourceContracts.length === 0) {
    errors.push('context.sourceContracts must be a non-empty array');
  }
}

function validateReleaseReadiness(errors, readiness) {
  if (!isPlainObject(readiness)) {
    errors.push('releaseReadiness must be a plain object');
    return;
  }

  requireEnum(errors, readiness.state, 'releaseReadiness.state', ['blocked', 'pending-release-ready-event', 'declared']);
  requireNonEmptyString(errors, readiness.reason, 'releaseReadiness.reason');
  requireBoolean(errors, readiness.releaseReadyDeclared, 'releaseReadiness.releaseReadyDeclared');
  requireBoolean(errors, readiness.declarationAuthorized, 'releaseReadiness.declarationAuthorized');
  requireExact(errors, readiness.declarationAuthorized, 'releaseReadiness.declarationAuthorized', false);
  requireBoolean(errors, readiness.declarationCommandAvailable, 'releaseReadiness.declarationCommandAvailable');
  requireExact(errors, readiness.declarationCommandAvailable, 'releaseReadiness.declarationCommandAvailable', false);
  requireBoolean(errors, readiness.readyEventRequired, 'releaseReadiness.readyEventRequired');
  requireBoolean(errors, readiness.capabilitiesPassed, 'releaseReadiness.capabilitiesPassed');
}

function validateCloseoutStatus(errors, closeout) {
  if (!isPlainObject(closeout)) {
    errors.push('closeoutStatus must be a plain object');
    return;
  }

  requireEnum(errors, closeout.state, 'closeoutStatus.state', ['missing', 'pending-evidence', 'ready-for-release-ready-event', 'release-ready-declared']);
  requireBoolean(errors, closeout.workerEvidenceComplete, 'closeoutStatus.workerEvidenceComplete');
  requireBoolean(errors, closeout.reviewEvidenceComplete, 'closeoutStatus.reviewEvidenceComplete');
  requireBoolean(errors, closeout.mainVerificationComplete, 'closeoutStatus.mainVerificationComplete');
  requireBoolean(errors, closeout.releaseReady, 'closeoutStatus.releaseReady');
  if (!Number.isInteger(closeout.totalTasks) || closeout.totalTasks < 0) {
    errors.push('closeoutStatus.totalTasks must be a non-negative integer');
  }
  if (closeout.missingCount !== null && (!Number.isInteger(closeout.missingCount) || closeout.missingCount < 0)) {
    errors.push('closeoutStatus.missingCount must be null or a non-negative integer');
  }
  if (!isPlainObject(closeout.releaseGateStatuses)) {
    errors.push('closeoutStatus.releaseGateStatuses must be a plain object');
  }
}

function validateCapabilityChecklist(errors, checklist) {
  if (!isPlainObject(checklist)) {
    errors.push('capabilityChecklist must be a plain object');
    return;
  }

  for (const field of ['totalCount', 'passedCount', 'warningCount', 'blockedCount']) {
    if (!Number.isInteger(checklist[field]) || checklist[field] < 0) {
      errors.push(`capabilityChecklist.${field} must be a non-negative integer`);
    }
  }
  if (!Array.isArray(checklist.items) || checklist.items.length === 0) {
    errors.push('capabilityChecklist.items must be a non-empty array');
    return;
  }
  for (const [index, item] of checklist.items.entries()) {
    requireNonEmptyString(errors, item.version, `capabilityChecklist.items[${index}].version`);
    requireNonEmptyString(errors, item.id, `capabilityChecklist.items[${index}].id`);
    requireNonEmptyString(errors, item.label, `capabilityChecklist.items[${index}].label`);
    requireEnum(errors, item.status, `capabilityChecklist.items[${index}].status`, ['passed', 'warning', 'blocked']);
    requireNonEmptyString(errors, item.sourceContract, `capabilityChecklist.items[${index}].sourceContract`);
    requireNonEmptyString(errors, item.route, `capabilityChecklist.items[${index}].route`);
    requireNonEmptyString(errors, item.acceptance, `capabilityChecklist.items[${index}].acceptance`);
    requireNonEmptyString(errors, item.evidence, `capabilityChecklist.items[${index}].evidence`);
  }
}

function validateFinalEvidenceDraft(errors, draft) {
  if (!isPlainObject(draft)) {
    errors.push('finalEvidenceDraft must be a plain object');
    return;
  }

  requireEnum(errors, draft.state, 'finalEvidenceDraft.state', ['blocked', 'draft-ready']);
  requireNonEmptyString(errors, draft.evidenceRef, 'finalEvidenceDraft.evidenceRef');
  requireNonEmptyString(errors, draft.suggestedTitle, 'finalEvidenceDraft.suggestedTitle');
  requireNonEmptyString(errors, draft.goalId, 'finalEvidenceDraft.goalId');
  requireNonEmptyString(errors, draft.taskId, 'finalEvidenceDraft.taskId');
  requireExact(errors, draft.releaseReadyDeclarationIncluded, 'finalEvidenceDraft.releaseReadyDeclarationIncluded', false);
  if (!Array.isArray(draft.requiredSections) || draft.requiredSections.length === 0) {
    errors.push('finalEvidenceDraft.requiredSections must be a non-empty array');
  }
  if (!Number.isInteger(draft.sourceEventCount) || draft.sourceEventCount < 0) {
    errors.push('finalEvidenceDraft.sourceEventCount must be a non-negative integer');
  }
  if (!Number.isInteger(draft.blockerCount) || draft.blockerCount < 0) {
    errors.push('finalEvidenceDraft.blockerCount must be a non-negative integer');
  }
}

function validateSourceSummary(errors, summary) {
  if (!isPlainObject(summary)) {
    errors.push('sourceSummary must be a plain object');
    return;
  }

  for (const field of ['runtimeStatus', 'appStateContract', 'providerState']) {
    requireNonEmptyString(errors, summary[field], `sourceSummary.${field}`);
  }
  for (const field of ['appDataDomainCount', 'evidenceRefCount', 'artifactEntryCount', 'goalEventCount']) {
    if (!Number.isInteger(summary[field]) || summary[field] < 0) {
      errors.push(`sourceSummary.${field} must be a non-negative integer`);
    }
  }
}

function validateBoundaries(errors, boundaries) {
  if (!isPlainObject(boundaries)) {
    errors.push('boundaries must be a plain object');
    return;
  }

  requireExact(errors, boundaries.readOnly, 'boundaries.readOnly', true);
  requireExact(errors, boundaries.writesEvidenceFile, 'boundaries.writesEvidenceFile', false);
  requireExact(errors, boundaries.emitsGoalEvent, 'boundaries.emitsGoalEvent', false);
  requireExact(errors, boundaries.statusSource, 'boundaries.statusSource', 'explicit-backend-contracts-and-goal-events');
  requireExact(errors, boundaries.evidencePolicy, 'boundaries.evidencePolicy', 'draft-ref-and-section-list-only');
  for (const field of FALSE_BOUNDARY_FIELDS) {
    requireExact(errors, boundaries[field], `boundaries.${field}`, false);
  }
}

function requireExact(errors, value, path, expected) {
  if (value !== expected) {
    errors.push(`${path} must be ${String(expected)}`);
  }
}

function requireNonEmptyString(errors, value, path) {
  if (typeof value !== 'string' || value.trim() === '') {
    errors.push(`${path} must be a non-empty string`);
  }
}

function requireIsoTimestamp(errors, value, path) {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    errors.push(`${path} must be an ISO timestamp`);
  }
}

function requireBoolean(errors, value, path) {
  if (typeof value !== 'boolean') {
    errors.push(`${path} must be a boolean`);
  }
}

function requireEnum(errors, value, path, accepted) {
  if (!accepted.includes(value)) {
    errors.push(`${path} must be one of ${accepted.join(', ')}`);
  }
}

function isPlainObject(value) {
  return value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
}

function assertSafeContextRef(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${field} must be a non-empty string`);
  }
  if (value.includes('/') || value.includes('\\') || value.includes('..') || value.includes('\0')) {
    throw new Error(`${field} must be a safe context ref`);
  }
}
