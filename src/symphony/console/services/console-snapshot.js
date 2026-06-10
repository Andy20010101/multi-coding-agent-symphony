import {
  listAdoptionJournals,
  listAdoptionPlans,
  listRunStates,
  readLatestContext,
  readLatestRun
} from '../../state.js';
import {
  PRODUCT_JSON_CONTRACT,
  compactRunState
} from '../../contract.js';
import {
  buildStageCommandSummary
} from '../../stage.js';
import {
  buildArtifactStatus,
  buildSafeArtifactPreviewRefs
} from './safe-artifact-preview-service.js';

export const RUN_FILTERS = Object.freeze(['all', 'passed', 'failed', 'dry-run', 'real', 'scan', 'verify', 'adoption']);

const COMMAND_GROUP_ORDER = Object.freeze(['Inspect', 'Adoptions', 'Verify', 'Artifacts', 'Real-agent gates']);
const RISK_SEVERITY_RANK = Object.freeze({ high: 3, medium: 2, low: 1 });

export async function buildConsoleSnapshot({
  stateDir = '.symphony',
  generatedAt = new Date().toISOString()
} = {}) {
  const [latestContext, latestRun, runs, adoptionPlans, adoptionJournals, stageSummary] = await Promise.all([
    readLatestContext({ stateDir }),
    readLatestRun({ stateDir }),
    listRunStates({ stateDir }),
    listAdoptionPlans({ stateDir }),
    listAdoptionJournals({ stateDir }),
    buildStageCommandSummary({ stateDir })
  ]);

  const compactRuns = await decorateConsoleRuns(runs.map((run) => compactRunState(run)), { stateDir });
  const compactLatestRun = latestRun === null
    ? null
    : compactRuns.find((run) => run.runId === latestRun.runId)
      ?? await decorateConsoleRunWithDiagnostics(compactRunState(latestRun), { stateDir });
  const recommendedCommands = buildSnapshotRecommendedCommands({
    latestRun: compactLatestRun
  });
  const compactPlans = compactAdoptionPlans(adoptionPlans);
  const compactJournals = compactAdoptionJournals({
    journals: adoptionJournals,
    stateDir
  });
  const runStats = buildRunStats(compactRuns);
  const riskSummary = buildRunRiskSummary(compactRuns);
  const adoptionSummary = buildAdoptionSummary({
    runs: compactRuns,
    adoptionPlans: compactPlans,
    adoptionJournals: compactJournals
  });
  const overview = buildConsoleOverview({
    latestRun: compactLatestRun,
    runStats,
    riskSummary,
    adoptionSummary,
    stageSummary,
    nextAction: latestRun?.nextAction ?? 'symphony scan'
  });

  return {
    contractVersion: PRODUCT_JSON_CONTRACT.version,
    contractName: 'symphony.console-snapshot',
    contract: {
      ...PRODUCT_JSON_CONTRACT,
      name: 'symphony.console-snapshot'
    },
    generatedAt,
    stateDir,
    status: latestRun === null ? 'no-runs' : 'ready',
    overview,
    stageSummary,
    adoptionSummary,
    latestContext: compactContext(latestContext),
    latestRun: compactLatestRun,
    runs: compactRuns,
    adoptionPlans: compactPlans,
    adoptionJournals: compactJournals,
    runStats,
    riskSummary,
    recommendedCommands,
    commandGroups: groupCommands(recommendedCommands),
    action: {
      next: latestRun?.nextAction ?? 'symphony scan'
    }
  };
}

export function buildAdoptionSummary({
  runs = [],
  adoptionPlans = [],
  adoptionJournals = [],
  readiness,
  risks
} = {}) {
  const adoptionIds = new Set();

  for (const plan of adoptionPlans) {
    if (plan.adoptionPlanId) {
      adoptionIds.add(plan.adoptionPlanId);
    }
  }

  for (const run of runs) {
    if (run.adoptionPlanId) {
      adoptionIds.add(run.adoptionPlanId);
    }
  }

  for (const journal of adoptionJournals) {
    if (journal.adoptionPlanId) {
      adoptionIds.add(journal.adoptionPlanId);
    }
  }

  const latestConfirmations = latestAdoptionConfirmationRunsById(runs);
  const planningRuns = latestAdoptionPlanningRunsById(runs);
  const applyingJournalIds = new Set(
    adoptionJournals
      .filter((journal) => journal.status === 'applying' && journal.adoptionPlanId)
      .map((journal) => journal.adoptionPlanId)
  );

  let pendingCount = 0;
  let applyingCount = 0;
  let postApplyFailedCount = 0;
  let staleCount = 0;
  let completedCount = 0;

  for (const adoptionId of adoptionIds) {
    const confirmation = latestConfirmations.get(adoptionId);

    if (confirmation?.failurePhase === 'post-apply-evidence') {
      postApplyFailedCount += 1;
      continue;
    }

    if (confirmation?.status === 'applying' || applyingJournalIds.has(adoptionId)) {
      applyingCount += 1;
      continue;
    }

    if (confirmation?.failurePhase === 'adoption-confirmation-preflight'
      && /stale|fingerprint|HEAD/u.test(confirmation.failureMessage ?? '')) {
      staleCount += 1;
      continue;
    }

    if (confirmation?.status === 'passed') {
      completedCount += 1;
      continue;
    }

    if (planningRuns.has(adoptionId) || adoptionPlans.some((plan) => plan.adoptionPlanId === adoptionId)) {
      pendingCount += 1;
    }
  }

  const unsupportedCount = runs.filter((run) => run.failurePhase === 'adoption-planning'
    && Array.isArray(run.unsupportedChanges)
    && run.unsupportedChanges.length > 0).length;
  const dirtyBlocked = (pendingCount > 0 && readiness?.tools?.git?.dirty === true)
    || riskSummaryHasCategory(risks, 'dirty_worktree_blocks_adoption');
  const status = adoptionSummaryStatus({
    pendingCount,
    applyingCount,
    postApplyFailedCount,
    staleCount,
    unsupportedCount,
    dirtyBlocked
  });

  return {
    status,
    pendingCount,
    applyingCount,
    postApplyFailedCount,
    staleCount,
    unsupportedCount,
    completedCount,
    dirtyBlocked
  };
}

export function buildConsoleOverview({
  latestRun,
  runStats,
  riskSummary,
  adoptionSummary,
  stageSummary,
  readiness,
  nextAction
}) {
  const topRisks = topOverviewRisks([
    ...stageRisksForOverview(stageSummary),
    ...(riskSummary?.items ?? [])
  ]);
  const status = overviewStatus({
    latestRun,
    topRisks,
    adoptionSummary,
    stageSummary,
    readiness
  });

  return stripUndefined({
    status,
    headline: overviewHeadline({
      status,
      latestRun,
      topRisks,
      adoptionSummary,
      stageSummary,
      readiness
    }),
    latestRunId: latestRun?.runId,
    latestRun: latestRun === null || latestRun === undefined
      ? null
      : stripUndefined({
          runId: latestRun.runId,
          command: latestRun.command,
          status: latestRun.status,
          verifierStatus: latestRun.verifierStatus,
          updatedAt: latestRun.updatedAt
        }),
    runCount: runStats?.total,
    topRisks,
    stage: compactStageForOverview(stageSummary),
    nextAction: overviewNextAction({
      topRisks,
      latestRun,
      adoptionSummary,
      stageSummary,
      readiness,
      fallback: nextAction
    }),
    readiness: readiness === undefined ? undefined : compactReadinessForOverview(readiness),
    adoptionStatus: adoptionSummary?.status
  });
}

export async function decorateConsoleRuns(runs, { stateDir = '.symphony' } = {}) {
  return await Promise.all(
    runs
      .filter((run) => run !== null)
      .map((run) => decorateConsoleRunWithDiagnostics(run, { stateDir }))
  );
}

export async function decorateConsoleRunWithDiagnostics(run, { stateDir = '.symphony' } = {}) {
  if (run === null) {
    return null;
  }

  const decorated = decorateConsoleRun(run);
  const artifactStatus = await buildArtifactStatus(decorated);
  const artifactRefs = await buildSafeArtifactPreviewRefs(decorated, { stateDir });
  const riskSummary = buildRunRiskSummary([{ ...decorated, artifactRefs, artifactStatus }]);

  return stripUndefined({
    ...decorated,
    artifactRefs,
    artifactStatus,
    riskSummary
  });
}

export function buildAdoptionDiagnosticsRiskSummary({ snapshot, readiness }) {
  const items = [];
  const pendingRuns = Array.isArray(snapshot.runs)
    ? snapshot.runs.filter((run) => run.status === 'adoption-planned')
    : [];
  const staleRuns = Array.isArray(snapshot.runs)
    ? snapshot.runs.filter((run) => run.failurePhase === 'adoption-confirmation-preflight'
      && /stale|fingerprint|HEAD/u.test(run.failureMessage ?? ''))
    : [];
  const applyingRuns = Array.isArray(snapshot.runs)
    ? snapshot.runs.filter((run) => run.status === 'applying'
      && run.adoptionPlanId !== undefined
      && Array.isArray(run.pipeline)
      && run.pipeline.includes('adopt-confirm'))
    : [];
  const applyingJournals = Array.isArray(snapshot.adoptionJournals)
    ? snapshot.adoptionJournals.filter((journal) => journal.status === 'applying')
    : [];

  if (pendingRuns.length > 0 && readiness.tools?.git?.dirty === true) {
    items.push(riskItem({
      id: 'dirty_worktree_blocks_adoption',
      category: 'dirty_worktree_blocks_adoption',
      severity: 'high',
      title: 'Dirty worktree blocks adoption',
      detail: `${pendingRuns.length} pending adoption plan(s) require a clean non-Symphony worktree before confirmation.`,
      command: 'git status --short'
    }));
    items.push(riskItem({
      id: 'adoption_dirty_file_details',
      category: 'adoption_dirty_file_details',
      severity: 'high',
      title: 'Adoption dirty file details',
      detail: `${pendingRuns.length} pending adoption plan(s) are blocked by ${readiness.tools.git.dirtyFilesCount ?? 0} dirty file(s).`,
      command: 'git status --short',
      dirtyPaths: readiness.tools.git.dirtyPaths,
      dirtyPathCount: readiness.tools.git.dirtyFilesCount
    }));
  }

  if (staleRuns.length > 0 && readiness.tools?.git?.dirty === true) {
    items.push(riskItem({
      id: 'adoption_dirty_file_details:stale',
      category: 'adoption_dirty_file_details',
      severity: 'high',
      title: 'Adoption dirty file details',
      detail: `${staleRuns.length} stale adoption confirmation run(s) are associated with ${readiness.tools.git.dirtyFilesCount ?? 0} dirty file(s).`,
      command: 'git status --short',
      dirtyPaths: readiness.tools.git.dirtyPaths,
      dirtyPathCount: readiness.tools.git.dirtyFilesCount
    }));
  }

  if (applyingRuns.length > 0 || applyingJournals.length > 0) {
    items.push(riskItem({
      id: 'adoption_apply_in_progress',
      category: 'adoption_apply_in_progress',
      severity: 'high',
      title: 'Adoption apply in progress',
      detail: `${applyingRuns.length} applying confirmation run(s), ${applyingJournals.length} applying journal(s).`,
      command: applyingRuns[0]?.adoptionPlanId
        ? `symphony adopt --inspect ${applyingRuns[0].adoptionPlanId} --json`
        : applyingJournals[0]?.adoptionPlanId
          ? `symphony adopt --inspect ${applyingJournals[0].adoptionPlanId} --json`
        : 'symphony status'
    }));
  }

  return summarizeRiskItems(items);
}

export function commandRecommendation({ id, label, command, description, group }) {
  return {
    id,
    label,
    command,
    description,
    group: group ?? commandGroupFor(command),
    mode: 'copy-only'
  };
}

export function dedupeCommands(commands) {
  const seen = new Set();
  const deduped = [];

  for (const command of commands) {
    if (command === null || seen.has(command.command)) {
      continue;
    }

    seen.add(command.command);
    deduped.push(command);
  }

  return deduped;
}

export function groupCommands(commands) {
  const grouped = new Map(COMMAND_GROUP_ORDER.map((group) => [group, []]));

  for (const command of dedupeCommands(commands)) {
    const group = command.group ?? commandGroupFor(command.command);

    if (!grouped.has(group)) {
      grouped.set(group, []);
    }

    grouped.get(group).push({
      ...command,
      group
    });
  }

  return [...grouped.entries()]
    .filter(([, groupCommands]) => groupCommands.length > 0)
    .map(([group, groupCommands]) => ({
      group,
      commands: groupCommands
    }));
}

export function normalizeRunFilter(filter) {
  return RUN_FILTERS.includes(filter) ? filter : 'all';
}

export function filterRuns(runs, filter) {
  const normalized = normalizeRunFilter(filter);

  if (normalized === 'all') {
    return runs;
  }

  return runs.filter((run) => runMatchesFilter(run, normalized));
}

export function summarizeRiskItems(items) {
  const counts = {
    high: items.filter((item) => item.severity === 'high').length,
    medium: items.filter((item) => item.severity === 'medium').length,
    low: items.filter((item) => item.severity === 'low').length
  };

  return {
    status: items.length === 0 ? 'ok' : 'attention',
    total: items.length,
    counts,
    items
  };
}

export function emptyRiskSummary() {
  return summarizeRiskItems([]);
}

function compactContext(context) {
  if (context === null) {
    return null;
  }

  return stripUndefined({
    runId: context.runId,
    projectRoot: context.projectRoot,
    projectFingerprint: context.projectFingerprint,
    contextArtifactPath: context.contextArtifactPath,
    summaryArtifactPath: context.summaryArtifactPath,
    recommendedWorkflow: context.recommendedWorkflow,
    verificationCommands: context.verificationCommands,
    createdAt: context.createdAt
  });
}

function compactAdoptionPlans(plans) {
  return plans.map((plan) => stripUndefined({
    adoptionPlanId: plan.adoptionId,
    sourceRunId: plan.sourceRunId,
    executionPlanId: plan.executionPlanId,
    plannedRunId: plan.plannedRunId,
    status: 'adoption-planned',
    patchArtifactPath: plan.patchArtifactPath,
    patchHash: plan.patchHash,
    changedFiles: Array.isArray(plan.changedFiles) ? [...plan.changedFiles] : undefined,
    fileOperations: plan.fileOperations === undefined ? undefined : structuredClone(plan.fileOperations),
    confirmationCommand: plan.confirmationCommand,
    createdAt: plan.createdAt
  }));
}

function compactAdoptionJournals({ journals, stateDir }) {
  return journals.map((journal) => stripUndefined({
    adoptionPlanId: journal.adoptionPlanId,
    confirmationRunId: journal.confirmationRunId,
    sourceRunId: journal.sourceRunId,
    executionPlanId: journal.executionPlanId,
    status: journal.status,
    patchArtifactPath: journal.patchArtifactPath,
    patchHash: journal.patchHash,
    changedFiles: Array.isArray(journal.changedFiles) ? [...journal.changedFiles] : undefined,
    fileOperations: journal.fileOperations === undefined ? undefined : structuredClone(journal.fileOperations),
    beforeFiles: journal.beforeFiles === undefined ? undefined : structuredClone(journal.beforeFiles),
    adoptionJournalArtifactPath: journal.adoptionPlanId
      ? `${stateDir}/adoptions/${journal.adoptionPlanId}-journal.json`
      : undefined,
    createdAt: journal.createdAt
  }));
}

function latestAdoptionConfirmationRunsById(runs) {
  const latest = new Map();

  for (const run of runs) {
    if (!run.adoptionPlanId
      || !Array.isArray(run.pipeline)
      || !run.pipeline.includes('adopt-confirm')
      || latest.has(run.adoptionPlanId)) {
      continue;
    }

    latest.set(run.adoptionPlanId, run);
  }

  return latest;
}

function latestAdoptionPlanningRunsById(runs) {
  const latest = new Map();

  for (const run of runs) {
    if (!run.adoptionPlanId || run.status !== 'adoption-planned' || latest.has(run.adoptionPlanId)) {
      continue;
    }

    latest.set(run.adoptionPlanId, run);
  }

  return latest;
}

function adoptionSummaryStatus({
  pendingCount,
  applyingCount,
  postApplyFailedCount,
  staleCount,
  unsupportedCount,
  dirtyBlocked
}) {
  if (postApplyFailedCount > 0) return 'post-apply-failed';
  if (applyingCount > 0) return 'applying';
  if (dirtyBlocked) return 'dirty-blocked';
  if (staleCount > 0) return 'stale';
  if (unsupportedCount > 0) return 'unsupported';
  if (pendingCount > 0) return 'pending';
  return 'clear';
}

function compactStageForOverview(stageSummary) {
  if (stageSummary === null || stageSummary === undefined || stageSummary.active !== true) {
    return undefined;
  }

  return stripUndefined({
    stageId: stageSummary.stageId,
    status: stageSummary.status,
    goal: stageSummary.goal,
    topRisks: stageSummary.topRisks,
    blocker: stageSummary.blocker,
    nextAction: stageSummary.nextAction,
    active: stageSummary.active
  });
}

function stageRisksForOverview(stageSummary) {
  if (stageSummary?.active !== true) {
    return [];
  }

  if (stageSummary?.blocker) {
    return [{
      id: `stage:${stageSummary.stageId}:blocker`,
      category: 'stage_blocker',
      severity: 'high',
      title: 'Stage blocker',
      detail: stageSummary.blocker.reason ?? 'Active Stage is blocked.',
      command: stageOverviewCommand('stage-blocker', 'Stage blocker', 'symphony stage summary')
    }];
  }

  if (stageSummary?.consistency?.status === 'failed') {
    return [{
      id: `stage:${stageSummary.stageId}:charter_inconsistent`,
      category: 'stage_charter_inconsistent',
      severity: 'high',
      title: 'Stage Charter inconsistent',
      detail: 'Stage JSON and generated HTML are not consistent.',
      command: stageOverviewCommand(
        'stage-charter-inconsistent',
        'Stage Charter inconsistent',
        `symphony stage render ${stageSummary.stageId} --write`
      )
    }];
  }

  return [];
}

function stageOverviewCommand(id, label, command) {
  return {
    id,
    label,
    command,
    description: 'Inspect the current Stage state.',
    mode: 'copy-only',
    group: 'Inspect'
  };
}

function topOverviewRisks(items) {
  return [...items]
    .sort((left, right) => (RISK_SEVERITY_RANK[right.severity] ?? 0) - (RISK_SEVERITY_RANK[left.severity] ?? 0))
    .slice(0, 3)
    .map((risk) => stripUndefined({
      id: risk.id,
      category: risk.category,
      severity: risk.severity,
      title: risk.title,
      detail: risk.detail,
      runId: risk.runId,
      command: risk.command
    }));
}

function overviewStatus({ latestRun, topRisks, adoptionSummary, stageSummary, readiness }) {
  if (stageSummary?.active === true && (stageSummary.blocker || stageSummary.status === 'blocked')) {
    return 'blocked';
  }

  if (latestRun === null || latestRun === undefined) {
    return stageSummary?.active === true && stageSummary?.stageId ? 'ready' : 'no-runs';
  }

  if (adoptionSummary?.status === 'dirty-blocked'
    || adoptionSummary?.status === 'applying'
    || adoptionSummary?.status === 'post-apply-failed'
    || adoptionSummary?.status === 'stale'
    || topRisks.some((risk) => risk.severity === 'high')) {
    return 'blocked';
  }

  if (adoptionSummary?.status !== undefined && adoptionSummary.status !== 'clear') {
    return 'attention';
  }

  if (readiness?.status === 'attention' || topRisks.some((risk) => risk.severity === 'medium')) {
    return 'attention';
  }

  return 'ready';
}

function overviewHeadline({ status, latestRun, topRisks, adoptionSummary, stageSummary, readiness }) {
  if (stageSummary?.active === true && stageSummary?.stageId && stageSummary.goal) {
    return stageSummary.goal;
  }

  if (status === 'no-runs') {
    return 'No Symphony runs found yet.';
  }

  if (adoptionSummary?.status === 'post-apply-failed') {
    return 'Patch applied, evidence failed.';
  }

  if (adoptionSummary?.status === 'applying') {
    return 'Adoption apply is in progress or needs recovery inspection.';
  }

  if (adoptionSummary?.status === 'dirty-blocked') {
    return 'Dirty worktree blocks adoption.';
  }

  if (adoptionSummary?.status === 'stale') {
    return 'Adoption plan is stale and needs inspection.';
  }

  if (adoptionSummary?.status === 'pending') {
    return 'Pending adoption is ready for review.';
  }

  const actionableRisk = topRisks.find((risk) => risk.severity !== 'low');

  if (actionableRisk !== undefined) {
    return actionableRisk.title;
  }

  if (readiness?.status === 'attention') {
    return 'Readiness needs attention before the next run.';
  }

  return latestRun?.status === 'passed'
    ? 'Latest run passed and no high-priority risks are visible.'
    : `Latest run is ${latestRun?.status ?? 'available'}.`;
}

function overviewNextAction({ topRisks, latestRun, adoptionSummary, stageSummary, readiness, fallback }) {
  if (stageSummary?.active === true && stageSummary?.blocker) {
    return stageSummary.nextAction ?? 'symphony stage summary';
  }

  if (adoptionSummary?.dirtyBlocked === true || readiness?.tools?.git?.dirty === true) {
    return 'git status --short';
  }

  const riskCommand = topRisks.find((risk) => risk.command?.command)?.command?.command;

  if (riskCommand) {
    return riskCommand;
  }

  return stageSummary?.active === true
    ? stageSummary.nextAction ?? latestRun?.nextAction ?? fallback ?? 'symphony scan'
    : latestRun?.nextAction ?? fallback ?? 'symphony scan';
}

function compactReadinessForOverview(readiness) {
  return stripUndefined({
    status: readiness.status,
    git: readiness.tools?.git === undefined
      ? undefined
      : stripUndefined({
          status: readiness.tools.git.status,
          branch: readiness.tools.git.branch,
          dirty: readiness.tools.git.dirty,
          dirtyFilesCount: readiness.tools.git.dirtyFilesCount
        }),
    packageManager: readiness.tools?.packageManager === undefined
      ? undefined
      : stripUndefined({
          status: readiness.tools.packageManager.status,
          name: readiness.tools.packageManager.name,
          version: readiness.tools.packageManager.version
        }),
    github: readiness.tools?.github === undefined
      ? undefined
      : stripUndefined({
          status: readiness.tools.github.status,
          authenticated: readiness.tools.github.authenticated
        }),
    realCli: readiness.tools?.realCli === undefined
      ? undefined
      : stripUndefined({
          status: readiness.tools.realCli.status,
          available: readiness.tools.realCli.available
        })
  });
}

function riskSummaryHasCategory(risks, category) {
  return Array.isArray(risks?.items) && risks.items.some((risk) => risk.category === category);
}

function decorateConsoleRun(run) {
  if (run === null) {
    return null;
  }

  const recommendedCommands = buildRunRecommendedCommands(run);

  return stripUndefined({
    ...run,
    artifactHealth: buildArtifactHealth(run),
    timeline: buildRunTimeline(run),
    recommendedCommands,
    commandGroups: groupCommands(recommendedCommands)
  });
}

function buildArtifactHealth(run) {
  const artifactRefs = Array.isArray(run.artifactRefs) ? run.artifactRefs : [];

  return {
    status: artifactRefs.length === 0 ? 'empty' : 'registered',
    total: artifactRefs.length,
    kinds: artifactRefs.map((artifact) => artifact.kind)
  };
}

function buildRunStats(runs) {
  const verifierRuns = runs.filter((run) => isNonEmptyString(run.verifierStatus));
  const verifierPassed = verifierRuns.filter((run) => run.verifierStatus === 'passed').length;
  const artifactMissingCount = runs.reduce((total, run) => total + (run.artifactStatus?.missing ?? 0), 0);
  const artifactRegisteredCount = runs.reduce((total, run) => total + (run.artifactStatus?.total ?? 0), 0);

  return {
    total: runs.length,
    recentRuns: runs.slice(0, 5).map((run) => stripUndefined({
      runId: run.runId,
      command: run.command,
      status: run.status,
      verifierStatus: run.verifierStatus,
      semanticCommand: run.semanticCommand,
      safetyMode: run.safetyMode,
      executionMode: run.executionMode,
      artifactStatus: run.artifactStatus?.status,
      updatedAt: run.updatedAt ?? run.createdAt
    })),
    failedCount: runs.filter((run) => run.status === 'failed' || run.verifierStatus === 'failed').length,
    verifier: {
      total: verifierRuns.length,
      passed: verifierPassed,
      failed: verifierRuns.filter((run) => run.verifierStatus === 'failed').length,
      passRate: verifierRuns.length === 0 ? null : verifierPassed / verifierRuns.length
    },
    artifacts: {
      status: artifactMissingCount > 0 ? 'missing' : artifactRegisteredCount === 0 ? 'empty' : 'ok',
      registered: artifactRegisteredCount,
      missing: artifactMissingCount,
      runsWithMissing: runs.filter((run) => (run.artifactStatus?.missing ?? 0) > 0).length
    },
    filters: RUN_FILTERS.map((filter) => ({
      id: filter,
      count: filterRuns(runs, filter).length
    }))
  };
}

function buildRunRiskSummary(runs) {
  const items = [];

  for (const run of runs) {
    if (run.status === 'failed') {
      items.push(runRisk({
        run,
        id: 'run_failed',
        severity: 'high',
        title: 'Run failed',
        detail: `${run.command ?? run.runId} ended with status failed.`
      }));
    }

    if (run.verifierStatus === 'failed') {
      items.push(runRisk({
        run,
        id: 'verifier_failed',
        severity: 'high',
        title: 'Verifier failed',
        detail: `${run.runId} has verifierStatus=failed.`
      }));
    }

    if (Array.isArray(run.unsupportedRequests) && run.unsupportedRequests.length > 0) {
      items.push(runRisk({
        run,
        id: 'unsupported_requests',
        severity: 'medium',
        title: 'Unsupported requests',
        detail: `${run.unsupportedRequests.length} unsupported request(s) were recorded.`
      }));
    }

    if (run.externalCalls === true) {
      items.push(runRisk({
        run,
        id: 'external_calls',
        severity: 'medium',
        title: 'External calls',
        detail: `${run.runId} recorded externalCalls=true.`
      }));
    }

    if (run.projectWrites === true) {
      items.push(runRisk({
        run,
        id: 'project_writes',
        severity: 'medium',
        title: 'Project writes',
        detail: `${run.runId} recorded projectWrites=true.`
      }));
    }

    if (run.runtimeWrites === true) {
      items.push(runRisk({
        run,
        id: 'runtime_writes',
        severity: 'low',
        title: 'Runtime writes',
        detail: `${run.runId} wrote Symphony runtime artifacts.`
      }));
    }

    if ((run.artifactStatus?.missing ?? 0) > 0) {
      items.push(runRisk({
        run,
        id: 'missing_artifacts',
        severity: 'high',
        title: 'Missing artifacts',
        detail: `${run.artifactStatus.missing} registered artifact(s) are missing.`,
        command: run.runId ? `symphony artifacts ${run.runId}` : 'symphony artifacts'
      }));
    }

    if (run.status === 'adoption-planned') {
      items.push(runRisk({
        run,
        id: 'pending_adoption',
        severity: 'medium',
        title: 'Pending adoption',
        detail: `${run.runId} has a frozen adoption plan waiting for confirmation.`,
        command: run.confirmationCommand ?? 'symphony status'
      }));
    }

    if (run.failurePhase === 'adoption-planning' && Array.isArray(run.unsupportedChanges) && run.unsupportedChanges.length > 0) {
      items.push(runRisk({
        run,
        id: 'unsupported_adoption_changes',
        severity: 'high',
        title: 'Unsupported adoption changes',
        detail: `${run.unsupportedChanges.length} unsupported source change(s) blocked adoption planning.`
      }));
    }

    if (run.failurePhase === 'adoption-confirmation-preflight' && /stale|fingerprint|HEAD/u.test(run.failureMessage ?? '')) {
      items.push(runRisk({
        run,
        id: 'stale_adoption',
        severity: 'high',
        title: 'Stale adoption',
        detail: run.failureMessage ?? 'Adoption confirmation preflight detected stale state.'
      }));
    }

    if (run.status === 'applying'
      && run.adoptionPlanId !== undefined
      && Array.isArray(run.pipeline)
      && run.pipeline.includes('adopt-confirm')) {
      items.push(runRisk({
        run,
        id: 'adoption_apply_in_progress',
        severity: 'high',
        title: 'Adoption apply in progress',
        detail: `${run.runId} reached the main-worktree apply phase.`,
        command: `symphony adopt --inspect ${run.adoptionPlanId} --json`
      }));
    }

    if (run.failurePhase === 'post-apply-evidence') {
      items.push(runRisk({
        run,
        id: 'adoption_post_apply_failed',
        severity: 'high',
        title: 'Adoption post-apply evidence failed',
        detail: run.failureMessage ?? 'Patch application succeeded but evidence or final state persistence failed.',
        command: `symphony adopt --inspect ${run.adoptionPlanId ?? ''} --json`.trim()
      }));
    }
  }

  return summarizeRiskItems(items);
}

function runRisk({ run, id, severity, title, detail, command }) {
  return riskItem({
    id: `${run.runId ?? 'unknown'}:${id}`,
    category: id,
    severity,
    title,
    detail,
    runId: run.runId,
    command: command ?? 'symphony status'
  });
}

function buildRunTimeline(run) {
  return [
    timelineEvent({
      id: 'created',
      label: 'Run created',
      status: run.createdAt || run.updatedAt ? 'done' : 'missing',
      at: run.createdAt,
      detail: run.runId
    }),
    timelineEvent({
      id: 'route',
      label: 'Route decision',
      status: run.routeDecision || run.semanticCommand || run.intent ? 'done' : 'missing',
      detail: run.semanticCommand ?? run.intent
    }),
    timelineEvent({
      id: 'safety',
      label: 'Safety boundary',
      status: run.safetyMode ? 'done' : 'missing',
      detail: run.safetyMode
    }),
    timelineEvent({
      id: 'execution',
      label: 'Execution',
      status: run.status === 'failed' ? 'failed' : run.status ? 'done' : 'missing',
      detail: run.executionMode ?? run.providerStatus ?? run.status
    }),
    timelineEvent({
      id: 'verification',
      label: 'Verifier',
      status: verifierTimelineStatus(run.verifierStatus),
      detail: run.verifierStatus
    }),
    timelineEvent({
      id: 'artifacts',
      label: 'Artifacts',
      status: Array.isArray(run.artifactRefs) && run.artifactRefs.length > 0 ? 'done' : 'missing',
      detail: Array.isArray(run.artifactRefs) ? `${run.artifactRefs.length} registered` : 'none'
    })
  ];
}

function timelineEvent({ id, label, status, detail, at }) {
  return stripUndefined({
    id,
    label,
    status,
    detail,
    at
  });
}

function verifierTimelineStatus(verifierStatus) {
  if (verifierStatus === 'passed') {
    return 'done';
  }

  if (verifierStatus === 'failed') {
    return 'failed';
  }

  if (verifierStatus === undefined || verifierStatus === null) {
    return 'missing';
  }

  return 'pending';
}

function buildSnapshotRecommendedCommands({ latestRun }) {
  if (latestRun === null) {
    return [
      commandRecommendation({
        id: 'scan',
        label: 'Scan project',
        command: 'symphony scan',
        description: 'Create the first read-only project context.',
        group: 'Inspect'
      }),
      commandRecommendation({
        id: 'doctor',
        label: 'Check environment',
        command: 'symphony doctor',
        description: 'Verify the local CLI setup.',
        group: 'Inspect'
      }),
      commandRecommendation({
        id: 'console',
        label: 'Open workbench',
        command: 'symphony console',
        description: 'Start this local read-only workbench.',
        group: 'Inspect'
      })
    ];
  }

  return dedupeCommands([
    ...buildRunRecommendedCommands(latestRun),
    commandRecommendation({
      id: 'console',
      label: 'Open workbench',
      command: 'symphony console',
      description: 'Return to this read-only dashboard.',
      group: 'Inspect'
    })
  ]);
}

function buildRunRecommendedCommands(run) {
  return dedupeCommands([
    run.nextAction
      ? commandRecommendation({
          id: 'next',
          label: 'Suggested next',
          command: run.nextAction,
          description: 'Copy the next action recorded by the latest run.',
          group: commandGroupFor(run.nextAction)
        })
      : null,
    commandRecommendation({
      id: 'status',
      label: 'Status',
      command: 'symphony status',
      description: 'Read the latest product state.',
      group: 'Inspect'
    }),
    commandRecommendation({
      id: 'artifacts',
      label: 'Artifacts',
      command: run.runId ? `symphony artifacts ${run.runId}` : 'symphony artifacts',
      description: 'Print registered artifact references for this run.',
      group: 'Artifacts'
    }),
    run.semanticCommand === 'scan'
      ? commandRecommendation({
          id: 'dry-run-work',
          label: 'Dry-run work',
          command: 'symphony do --dry-run "inspect README"',
          description: 'Exercise the work path without project writes.',
          group: 'Verify'
        })
      : null,
    run.status && run.status !== 'passed'
      ? commandRecommendation({
          id: 'continue',
          label: 'Continue safely',
          command: 'symphony continue',
          description: 'Ask Symphony what can be continued from state.',
          group: 'Inspect'
        })
      : null
  ]);
}

function commandGroupFor(command) {
  const value = String(command ?? '');

  if (/MCAS_RUN_REAL_|--real/u.test(value)) {
    return 'Real-agent gates';
  }

  if (/\badopt\b/u.test(value)) {
    return 'Adoptions';
  }

  if (/artifacts?/u.test(value)) {
    return 'Artifacts';
  }

  if (/\b(check|test|verify|audit|diff --check)\b/u.test(value)) {
    return 'Verify';
  }

  return 'Inspect';
}

function runMatchesFilter(run, filter) {
  if (filter === 'passed') {
    return run.status === 'passed' || run.verifierStatus === 'passed';
  }

  if (filter === 'failed') {
    return run.status === 'failed' || run.verifierStatus === 'failed';
  }

  if (filter === 'dry-run') {
    return run.safetyMode === 'dry-run' || run.executionMode === 'dry-run';
  }

  if (filter === 'real') {
    return run.executionMode === 'real';
  }

  if (filter === 'scan') {
    return run.semanticCommand === 'scan' || run.intent === 'scan-project' || /\bscan\b/u.test(run.command ?? '');
  }

  if (filter === 'verify') {
    return run.semanticCommand === 'verify' || run.intent === 'verify' || /\b(verify|qa)\b/u.test(run.command ?? '');
  }

  if (filter === 'adoption') {
    return run.semanticCommand === 'adopt'
      || run.intent === 'adopt'
      || run.adoptionPlanId !== undefined
      || run.adoptionJournalArtifactPath !== undefined
      || (Array.isArray(run.pipeline) && run.pipeline.some((step) => /^adopt/u.test(step)));
  }

  return true;
}

function riskItem({ id, category, severity, title, detail, command, runId, dirtyPaths, dirtyPathCount }) {
  return stripUndefined({
    id,
    category,
    severity,
    title,
    detail,
    dirtyPaths,
    dirtyPathCount,
    command: commandRecommendation({
      id,
      label: title,
      command,
      description: detail,
      group: commandGroupFor(command)
    }),
    runId
  });
}

function stripUndefined(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined)
  );
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}
