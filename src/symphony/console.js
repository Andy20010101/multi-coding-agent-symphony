import { createHash } from 'node:crypto';
import { join, resolve } from 'node:path';

import { NodeProcessRunner } from '../process-runner.js';
import { redactSecrets } from '../redaction.js';
import {
  atomicWriteJson,
  buildProjectFingerprint,
  listRunStates,
  readRunState,
  writeExecutionPlan
} from './state.js';
import {
  PRODUCT_JSON_CONTRACT,
  buildArtifactRefs,
  compactRunState
} from './contract.js';
import {
  buildAdoptionInspectionSummary,
  buildConsoleAdoptionInspectContract
} from './adoption-inspect.js';
import {
  GUIDED_GOAL_HANDOFF_REGISTERED_REF,
  buildGuidedGoalHandoffJson,
  buildGuidedGoalHandoffRefIndex,
  loadGuidedGoalHandoffFixture
} from './guided-goal-handoff-output.js';
import {
  buildCapabilitiesContract
} from './capabilities.js';
import {
  buildActionManifestContract
} from './action-manifest.js';
import {
  buildActionAvailabilityContract
} from './action-availability.js';
import {
  buildActionPreviewContract,
  isSafeActionPreviewId
} from './action-preview.js';
import {
  buildJobModelContract
} from './job-model-contract.js';
import {
  buildJobCreationContract
} from './job-creation-contract.js';
import {
  buildJobTimelineLogStreamContract
} from './job-timeline-contract.js';
import {
  buildJobRunControlContract
} from './job-run-control-contract.js';
import {
  buildDiagnosticsContract
} from './diagnostics.js';
import {
  buildEvidenceTimelineContract,
  buildReleaseBundleContract
} from './evidence-timeline-contract.js';
import { buildEvidenceBundle } from './evidence-bundle.js';
import {
  buildAppCoreBackupExport
} from './app-core-backup-export.js';
import {
  buildAppCoreDiagnosticsBundle
} from './app-core-diagnostics-bundle.js';
import {
  buildAppCoreReleaseManager
} from './app-core-release-manager.js';
import {
  buildAppCoreRestoreValidation
} from './app-core-restore-validation.js';
import {
  buildInstallStatus
} from './installer-upgrade-baseline.js';
import {
  buildGoalDraftHandoffContract
} from './goal-draft-handoff.js';
import {
  buildArtifactIndex
} from './artifact-indexer.js';
import {
  searchArtifactEntries,
  validateSearchFilters
} from './safe-preview-search.js';
import {
  buildLocalRuntimeHealth
} from './local-runtime-health.js';
import {
  buildAgentCliProviderHealthContract
} from './agent-cli-provider-health.js';
import {
  buildAgentCliCapabilityProfileContract
} from './agent-cli-capability-profile.js';
import {
  buildAgentCliLaneAssignmentPreviewContract
} from './agent-cli-lane-assignment-preview.js';
import {
  buildProviderReadinessProjection
} from './provider-readiness-contracts.js';
import {
  V66_WORKER_RUN_GOAL_ID,
  WorkerRunBackendError,
  buildWorkerRunPreviewFromBackend,
  confirmWorkerRunPreview
} from './worker-run-backend.js';
import {
  buildAppSchemaMigrationContract
} from './app-schema-migration.js';
import {
  buildWorkflowRouterCategoriesContract
} from './workflow-router-categories.js';
import {
  ControlledProviderRunnerError,
  V41_CONTROLLED_PROVIDER_RUNNER_GOAL_ID,
  buildControlledProviderRunnerPlanPreview,
  confirmControlledProviderRunnerPlan
} from './controlled-provider-runner.js';
import {
  buildAppStateSnapshot
} from './app-state-snapshot.js';
import {
  buildAppDataInventory
} from './app-data-inventory.js';
import {
  buildInboxCaptureContract
} from './inbox-capture-contract.js';
import {
  ProjectSelectionError,
  buildCurrentProjectBinding,
  buildRecentProjects,
  buildProjectRegistry,
  resolveCurrentProject,
  selectCurrentProjectBinding
} from './project-registry.js';
import {
  buildPersonalWorkbenchSettingsProjection
} from './personal-workbench-settings-contracts.js';
import {
  readGoalEventJournal
} from './goal-event-journal.js';
import {
  buildGoalNextAction
} from './goal-next-action-resolver.js';
import {
  buildGoalProgressLedger,
  getGoalProgressTemplate,
  listRegisteredGoals,
  V18_GOAL_EVENT_JOURNAL_GOAL_ID
} from './goal-progress-ledger.js';
import {
  GoalPromptPackError,
  buildGoalPromptPack
} from './goal-prompt-pack.js';
import {
  GoalCloseoutReportError,
  buildGoalCloseoutReport
} from './goal-closeout-report.js';
import {
  GoalRunbookContextError,
  loadGoalRunbookContext,
  resolveGoalRunbookGoalId
} from './goal-runbook-context.js';
import {
  GoalUpdateError,
  buildGoalUpdatePlan,
  confirmGoalUpdate
} from './goal-update.js';
import {
  GoalReviewError,
  buildGoalReviewPlan,
  confirmGoalReview
} from './goal-review.js';
import {
  GoalGateError,
  buildGoalGatePlan,
  confirmGoalGate
} from './goal-gate.js';
import {
  ResultIntakeContractError,
  buildPendingResultFromEscrow,
  buildResultEvidenceEscrow,
  buildResultIntakePreview,
  toSerializableResultIntakeContract,
  validateResultEscrowConfirmInput
} from './result-intake-contracts.js';
import {
  writeResultIntakeConfirmState
} from './result-intake-state.js';
import {
  GoalOperationRunRegistryError,
  readGoalOperationRuns,
  recordGoalOperationRun
} from './goal-operation-run-registry.js';
import {
  GoalEventPlanPreviewError,
  assertOnlySearchParams,
  groupSearchParamValues,
  hasSearchParams,
  isUnsafeArtifactRouteSegment,
  isUnsafeGoalRouteSegment,
  isUnsafeHandoffRef,
  isWorkbenchRoute,
  optionalSingleSearchParam,
  requiredSingleSearchParam,
  safeDecodePathSegment,
  writeApiErrorResponse,
  writeHtmlResponse,
  writeJsonResponse,
  writeWorkbenchStaticResponse
} from './console/index.js';
import { createConsoleRouteRegistry } from './console/route-registry.js';
import {
  createConsoleHttpServer,
  startConsoleHttpServer,
  writeConsoleMethodNotAllowedResponse
} from './console/server.js';
import { createGoalRoutes } from './console/routes/goals.js';
import { createReadinessRoutes } from './console/routes/readiness.js';
import { createSummaryRoutes } from './console/routes/summary.js';
import {
  buildAdoptionDiagnosticsRiskSummary,
  buildAdoptionSummary,
  buildConsoleOverview,
  buildConsoleSnapshot,
  decorateConsoleRunWithDiagnostics,
  decorateConsoleRuns,
  dedupeCommands,
  emptyRiskSummary,
  filterRuns,
  groupCommands,
  normalizeRunFilter,
  RUN_FILTERS,
  summarizeRiskItems
} from './console/services/console-snapshot.js';
import {
  buildConsoleReadiness
} from './console/services/console-readiness.js';
import {
  createGoalSupervisorService
} from './console/services/goal-supervisor-service.js';
import {
  BLOCKED_ARTIFACT_PREVIEW_STATUS,
  buildLegacyConsoleArtifactPreview,
  buildSafeArtifactPreview
} from './console/services/safe-artifact-preview-service.js';

const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = 8765;
const DEFAULT_READINESS_TIMEOUT_MS = 3000;
const GOAL_EVENT_CONFIRM_MAX_BODY_BYTES = 32 * 1024;
const RESULT_INTAKE_MAX_BODY_BYTES = 32 * 1024;
const PROJECT_SELECTION_MAX_BODY_BYTES = 4 * 1024;
const CONTROLLED_IMPLEMENTATION_PLAN_PREVIEW_CONTRACT_NAME = 'controlled-implementation-plan-preview.v1';
const CONTROLLED_IMPLEMENTATION_PLAN_PREVIEW_CONTRACT_VERSION = 1;
const CONTROLLED_IMPLEMENTATION_RUN_CONFIRMATION_CONTRACT_NAME = 'controlled-implementation-run-confirmation.v1';
const CONTROLLED_IMPLEMENTATION_RUN_CONFIRMATION_CONTRACT_VERSION = 1;
const CONTROLLED_ADOPTION_PLAN_FREEZE_CONTRACT_NAME = 'controlled-adoption-plan-freeze.v1';
const CONTROLLED_ADOPTION_PLAN_FREEZE_CONTRACT_VERSION = 1;
const CONTROLLED_ADOPTION_CONFIRM_CONTRACT_NAME = 'controlled-adoption-confirmation.v1';
const CONTROLLED_ADOPTION_CONFIRM_CONTRACT_VERSION = 1;
const CONTROLLED_VERIFICATION_RUN_CONFIRMATION_CONTRACT_NAME = 'controlled-verification-run-confirmation.v1';
const CONTROLLED_VERIFICATION_RUN_CONFIRMATION_CONTRACT_VERSION = 1;
const RELEASE_BASELINE_RESOLVER_CONTRACT_NAME = 'release-baseline-resolver.v1';
const RELEASE_BASELINE_RESOLVER_CONTRACT_VERSION = 1;
const CONTROLLED_VERIFICATION_SUITE_ID = 'v31-main-verification-command-suite';
const CONTROLLED_VERIFICATION_COMMAND_TIMEOUT_MS = 10 * 60 * 1000;
const RELEASE_BASELINE_GIT_TIMEOUT_MS = 10 * 1000;
export {
  buildConsoleReadiness,
  buildConsoleSnapshot
};

export async function buildConsoleDiagnosticsReport({
  stateDir = '.symphony',
  cwd = process.cwd(),
  env = process.env,
  runner = new NodeProcessRunner(),
  generatedAt = new Date().toISOString(),
  timeoutMs = DEFAULT_READINESS_TIMEOUT_MS
} = {}) {
  const [snapshot, readiness] = await Promise.all([
    buildConsoleSnapshot({
      stateDir,
      generatedAt
    }),
    buildConsoleReadiness({
      stateDir,
      cwd,
      env,
      runner,
      generatedAt,
      timeoutMs
    })
  ]);
  const risks = combineRiskSummaries([
    snapshot.riskSummary,
    readiness.riskSummary,
    buildAdoptionDiagnosticsRiskSummary({
      snapshot,
      readiness
    })
  ]);
  const commands = buildDiagnosticsCommands({
    snapshot,
    readiness
  });
  const status = diagnosticsStatus({
    snapshot,
    readiness,
    risks
  });
  const adoptionSummary = buildAdoptionSummary({
    runs: snapshot.runs,
    adoptionPlans: snapshot.adoptionPlans,
    adoptionJournals: snapshot.adoptionJournals,
    readiness,
    risks
  });
  const enrichedSnapshot = {
    ...snapshot,
    adoptionSummary,
    overview: buildConsoleOverview({
      latestRun: snapshot.latestRun,
      runStats: snapshot.runStats,
      riskSummary: risks,
      adoptionSummary,
      readiness,
      stageSummary: snapshot.stageSummary,
      nextAction: snapshot.action?.next ?? 'symphony scan'
    })
  };
  const report = {
    contractVersion: PRODUCT_JSON_CONTRACT.version,
    contractName: 'symphony.diagnostics-report',
    contract: {
      ...PRODUCT_JSON_CONTRACT,
      name: 'symphony.diagnostics-report'
    },
    generatedAt,
    stateDir,
    cwd,
    status,
    snapshot: enrichedSnapshot,
    readiness,
    risks,
    commands,
    action: buildDiagnosticsAction({
      status,
      snapshot: enrichedSnapshot,
      risks,
      commands
    })
  };

  return redactSecrets(report);
}

export function renderDiagnosticsText(report) {
  const safeReport = redactSecrets(report);
  const snapshot = safeReport.snapshot ?? {};
  const latestRun = snapshot.latestRun ?? null;
  const runStats = snapshot.runStats ?? {};
  const artifactStats = runStats.artifacts ?? {};
  const readiness = safeReport.readiness ?? {};
  const risks = safeReport.risks ?? emptyRiskSummary();
  const lines = [
    `Status: ${formatTextValue(safeReport.status)}`,
    `Generated: ${formatTextValue(safeReport.generatedAt)}`,
    `State dir: ${formatTextValue(safeReport.stateDir)}`,
    `Runs: ${formatTextValue(runStats.total ?? snapshot.runs?.length ?? 0)}`,
    `Latest run: ${latestRun === null ? 'none' : formatTextValue(latestRun.runId)}`,
    `Artifact health: ${formatTextValue(artifactStats.status ?? latestRun?.artifactStatus?.status ?? 'unknown')}`,
    `Readiness: ${formatTextValue(readiness.status ?? 'unknown')}`,
    `Risks: ${risks.total ?? 0} total / ${risks.counts?.high ?? 0} high / ${risks.counts?.medium ?? 0} medium / ${risks.counts?.low ?? 0} low`
  ];

  if (latestRun !== null) {
    lines.push(`Latest command: ${formatTextValue(latestRun.command ?? latestRun.semanticCommand ?? 'unknown')}`);
    lines.push(`Latest verifier: ${formatTextValue(latestRun.verifierStatus ?? 'unknown')}`);
  }

  const recentRuns = Array.isArray(runStats.recentRuns) ? runStats.recentRuns : [];

  if (recentRuns.length > 0) {
    lines.push('', 'Recent runs:');
    for (const run of recentRuns.slice(0, 5)) {
      lines.push(`- ${formatTextValue(run.runId)} / ${formatTextValue(run.status ?? 'unknown')} / verifier ${formatTextValue(run.verifierStatus ?? 'unknown')}`);
    }
  }

  lines.push('', 'Risk panel:');

  if (!Array.isArray(risks.items) || risks.items.length === 0) {
    lines.push('- No visible risks.');
  } else {
    for (const risk of risks.items.slice(0, 8)) {
      lines.push(`- [${formatTextValue(risk.severity)}] ${formatTextValue(risk.title)}${risk.runId ? ` (${formatTextValue(risk.runId)})` : ''}: ${formatTextValue(risk.detail)}`);
    }
  }

  const checks = Array.isArray(readiness.checks) ? readiness.checks : [];

  lines.push('', 'Readiness checks:');

  if (checks.length === 0) {
    lines.push('- No readiness checks available.');
  } else {
    for (const check of checks) {
      lines.push(`- ${formatTextValue(check.label)}: ${formatTextValue(check.status)}${check.detail ? ` - ${formatTextValue(check.detail)}` : ''}`);
    }
  }

  lines.push('', 'Commands:');
  appendTextCommandGroups(lines, safeReport.commands?.groups ?? safeReport.commands?.commandGroups ?? []);

  lines.push('', `Next: ${formatTextValue(safeReport.action?.next ?? 'symphony scan')}`);

  return `${lines.join('\n')}\n`;
}

export function renderDiagnosticsHtml(report) {
  const safeReport = redactSecrets(report);
  const snapshot = safeReport.snapshot ?? {};
  const latestRun = snapshot.latestRun ?? null;
  const runStats = snapshot.runStats ?? {};
  const readiness = safeReport.readiness ?? {};
  const risks = safeReport.risks ?? emptyRiskSummary();
  const commandGroups = safeReport.commands?.groups ?? safeReport.commands?.commandGroups ?? [];

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Symphony Diagnostics Report</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f6f7f9;
      --panel: #ffffff;
      --text: #1f252d;
      --muted: #626d7a;
      --line: #d9dee6;
      --ok: #176b4d;
      --ok-bg: #e4f3ec;
      --warn: #936419;
      --warn-bg: #fff4d8;
      --danger: #a33a2a;
      --danger-bg: #fae8e4;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font-size: 14px;
      letter-spacing: 0;
    }

    header,
    main {
      width: min(1120px, calc(100% - 32px));
      margin: 0 auto;
    }

    header {
      padding: 28px 0 18px;
    }

    h1,
    h2,
    h3,
    p {
      margin: 0;
    }

    h1 {
      font-size: 24px;
      font-weight: 700;
    }

    h2 {
      margin-bottom: 10px;
      font-size: 16px;
      font-weight: 700;
    }

    h3 {
      margin-bottom: 8px;
      color: var(--muted);
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
    }

    main {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(280px, 360px);
      gap: 16px;
      padding-bottom: 32px;
    }

    section,
    aside {
      min-width: 0;
    }

    .stack {
      display: grid;
      gap: 16px;
    }

    .panel,
    .metric,
    .risk,
    .command,
    .run-row,
    .check-row {
      border: 1px solid var(--line);
      border-radius: 6px;
      background: var(--panel);
    }

    .panel {
      padding: 16px;
    }

    .subtitle {
      margin-top: 4px;
      color: var(--muted);
    }

    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 14px;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      min-height: 26px;
      border: 1px solid var(--line);
      border-radius: 999px;
      padding: 0 10px;
      background: var(--panel);
      color: var(--muted);
      font-size: 12px;
      overflow-wrap: anywhere;
    }

    .badge.ready,
    .badge.ok,
    .badge.passed {
      border-color: var(--ok);
      background: var(--ok-bg);
      color: var(--ok);
    }

    .badge.attention,
    .badge.no-runs,
    .badge.optional,
    .badge.preview {
      border-color: var(--warn);
      background: var(--warn-bg);
      color: var(--warn);
    }

    .badge.failed,
    .badge.high {
      border-color: var(--danger);
      background: var(--danger-bg);
      color: var(--danger);
    }

    .metric-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 10px;
    }

    .metric {
      min-width: 0;
      padding: 12px;
    }

    .label {
      color: var(--muted);
      font-size: 12px;
    }

    .value {
      margin-top: 4px;
      font-weight: 700;
      overflow-wrap: anywhere;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid var(--line);
      background: var(--panel);
    }

    th,
    td {
      padding: 10px 12px;
      border-bottom: 1px solid var(--line);
      text-align: left;
      vertical-align: top;
      overflow-wrap: anywhere;
    }

    th {
      color: var(--muted);
      font-size: 12px;
      font-weight: 700;
      background: #eef1f5;
    }

    code {
      font: 12px/1.45 ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
      overflow-wrap: anywhere;
    }

    .risk-list,
    .command-list,
    .check-list,
    .run-list {
      display: grid;
      gap: 8px;
    }

    .risk,
    .command,
    .check-row,
    .run-row {
      padding: 10px;
      overflow-wrap: anywhere;
    }

    .risk.high {
      border-color: var(--danger);
      background: var(--danger-bg);
    }

    .risk.medium {
      border-color: var(--warn);
      background: var(--warn-bg);
    }

    .muted {
      color: var(--muted);
    }

    .command-title,
    .risk-title,
    .run-title {
      font-weight: 700;
    }

    .command-code {
      display: block;
      margin-top: 5px;
      color: #364253;
    }

    .empty {
      padding: 12px;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: var(--panel);
      color: var(--muted);
      overflow-wrap: anywhere;
    }

    @media (max-width: 840px) {
      main,
      .metric-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <header>
    <h1>Symphony Diagnostics Report</h1>
    <p class="subtitle">Static read-only diagnostics generated from local Symphony state.</p>
    <div class="meta">
      ${statusBadge(safeReport.status)}
      ${statusBadge(`readiness:${readiness.status ?? 'unknown'}`)}
      <span class="badge">copy-only commands</span>
      <span class="badge">${escapeHtml(safeReport.generatedAt)}</span>
    </div>
  </header>
  <main>
    <section class="stack">
      <div class="panel">
        <h2>Overall Status</h2>
        ${metricsGrid([
          ['Status', safeReport.status],
          ['Runs', runStats.total ?? snapshot.runs?.length ?? 0],
          ['Failed runs', runStats.failedCount ?? 0],
          ['Risks', `${risks.total ?? 0} total`],
          ['State dir', safeReport.stateDir],
          ['CWD', safeReport.cwd],
          ['Next', safeReport.action?.next ?? 'symphony scan'],
          ['Artifacts', artifactStatusLabel(runStats, latestRun)]
        ])}
      </div>
      <div class="panel">
        <h2>Latest Run</h2>
        ${renderLatestRun(latestRun)}
      </div>
      <div class="panel">
        <h2>Recent Runs</h2>
        ${renderRecentRuns(runStats.recentRuns ?? [])}
      </div>
      <div class="panel">
        <h2>Artifact Health</h2>
        ${renderArtifactHealth(runStats, latestRun)}
      </div>
    </section>
    <aside class="stack">
      <div class="panel">
        <h2>Risk Panel</h2>
        ${renderRiskList(risks.items ?? [])}
      </div>
      <div class="panel">
        <h2>Readiness</h2>
        ${renderReadinessChecks(readiness.checks ?? [])}
      </div>
      <div class="panel">
        <h2>Copy-Only Commands</h2>
        ${renderCommandGroups(commandGroups)}
      </div>
    </aside>
  </main>
</body>
</html>
`;
}

export function createSymphonyConsoleServer({
  stateDir = '.symphony',
  cwd = process.cwd(),
  env = process.env,
  runner = new NodeProcessRunner(),
  mcasRunner,
  workerRunProviderReadiness = null,
  workerRunExecutor = null,
  readinessTimeoutMs = DEFAULT_READINESS_TIMEOUT_MS,
  runtimeStartedAt = new Date().toISOString()
} = {}) {
  const goalSupervisorService = createGoalSupervisorService();
  const appRouteRegistry = createConsoleRouteRegistry({
    routes: [
      createSummaryRoutes({
        buildConsoleSnapshot
      }),
      createReadinessRoutes({
        buildConsoleReadiness,
        buildLocalRuntimeHealth
      }),
      createGoalRoutes({
        goalSupervisorService
      })
    ]
  });

  return createConsoleHttpServer(async (request, response) => {
    const url = new URL(request.url ?? '/', 'http://localhost');
    const method = request.method ?? 'UNKNOWN';

    try {
      const appRouteHandled = await appRouteRegistry.handle({
        response,
        url,
        method,
        stateDir,
        cwd,
        env,
        runner,
        readinessTimeoutMs,
        runtimeStartedAt
      });

      if (appRouteHandled) {
        return;
      }

      if (method === 'POST') {
        if (url.pathname === '/api/projects/current-binding/select') {
          if (hasSearchParams(url.searchParams)) {
            writeApiErrorResponse(response, {
              status: 400,
              code: 'invalid-project-selection-request',
              message: 'Project selection does not accept query parameters.',
              route: url.pathname,
              method
            });
            return;
          }

          try {
            const body = await readProjectSelectionRequestBody(request);

            writeJsonResponse(response, 200, await selectCurrentProjectBinding({
              cwd,
              stateDir,
              body
            }));
          } catch (error) {
            if (error instanceof ProjectSelectionError) {
              writeApiErrorResponse(response, {
                status: 400,
                code: error.code,
                message: error.message,
                route: url.pathname,
                method
              });
              return;
            }

            throw error;
          }
          return;
        }

        const resultIntakePreviewRequest = parseResultIntakePreviewRequestPath(url.pathname, url.searchParams);

        if (resultIntakePreviewRequest !== null) {
          await writeResultIntakePreviewResponse({
            requestMessage: request,
            response,
            stateDir,
            request: resultIntakePreviewRequest,
            route: url.pathname,
            method
          });
          return;
        }

        const resultIntakeConfirmRequest = parseResultIntakeConfirmRequestPath(url.pathname, url.searchParams);

        if (resultIntakeConfirmRequest !== null) {
          await writeResultIntakeConfirmResponse({
            requestMessage: request,
            response,
            stateDir,
            request: resultIntakeConfirmRequest,
            route: url.pathname,
            method
          });
          return;
        }

        const controlledProviderRunnerConfirmRequest = parseControlledProviderRunnerConfirmRequestPath(url.pathname, url.searchParams);

        if (controlledProviderRunnerConfirmRequest !== null) {
          await writeControlledProviderRunnerConfirmResponse({
            requestMessage: request,
            response,
            stateDir,
            cwd,
            runner,
            request: controlledProviderRunnerConfirmRequest,
            route: url.pathname,
            method
          });
          return;
        }

        const workerRunConfirmRequest = parseWorkerRunConfirmRequestPath(url.pathname, url.searchParams);

        if (workerRunConfirmRequest !== null) {
          await writeWorkerRunConfirmResponse({
            requestMessage: request,
            response,
            stateDir,
            env,
            workerRunProviderReadiness,
            workerRunExecutor,
            request: workerRunConfirmRequest,
            route: url.pathname,
            method
          });
          return;
        }

        const controlledVerificationRunConfirmRequest = parseControlledVerificationRunConfirmRequestPath(url.pathname, url.searchParams);

        if (controlledVerificationRunConfirmRequest !== null) {
          await writeControlledVerificationRunConfirmResponse({
            requestMessage: request,
            response,
            stateDir,
            cwd,
            env,
            runner,
            request: controlledVerificationRunConfirmRequest,
            route: url.pathname,
            method
          });
          return;
        }

        const controlledAdoptionConfirmRequest = parseControlledAdoptionConfirmRequestPath(url.pathname, url.searchParams);

        if (controlledAdoptionConfirmRequest !== null) {
          await writeControlledAdoptionConfirmResponse({
            requestMessage: request,
            response,
            stateDir,
            runner,
            request: controlledAdoptionConfirmRequest,
            route: url.pathname,
            method
          });
          return;
        }

        const controlledAdoptionPlanFreezeRequest = parseControlledAdoptionPlanFreezeRequestPath(url.pathname, url.searchParams);

        if (controlledAdoptionPlanFreezeRequest !== null) {
          await writeControlledAdoptionPlanFreezeResponse({
            requestMessage: request,
            response,
            stateDir,
            runner,
            request: controlledAdoptionPlanFreezeRequest,
            route: url.pathname,
            method
          });
          return;
        }

        const controlledImplementationRunConfirmRequest = parseControlledImplementationRunConfirmRequestPath(url.pathname, url.searchParams);

        if (controlledImplementationRunConfirmRequest !== null) {
          await writeControlledImplementationRunConfirmResponse({
            requestMessage: request,
            response,
            stateDir,
            cwd,
            env,
            runner,
            mcasRunner,
            request: controlledImplementationRunConfirmRequest,
            route: url.pathname,
            method
          });
          return;
        }

        const confirmRequest = parseGoalEventPlanConfirmRequestPath(url.pathname, url.searchParams);

        if (confirmRequest !== null) {
          await writeGoalEventPlanConfirmResponse({
            requestMessage: request,
            response,
            stateDir,
            request: confirmRequest,
            route: url.pathname,
            method
          });
          return;
        }

        writeConsoleMethodNotAllowedResponse({
          response,
          route: url.pathname,
          method
        });
        return;
      }

      if (method !== 'GET') {
        writeConsoleMethodNotAllowedResponse({
          response,
          route: url.pathname,
          method
        });
        return;
      }

      if (
        parseResultIntakePreviewRequestPath(url.pathname, url.searchParams) !== null ||
        parseResultIntakeConfirmRequestPath(url.pathname, url.searchParams) !== null
      ) {
        writeConsoleMethodNotAllowedResponse({
          response,
          route: url.pathname,
          method
        });
        return;
      }

      if (url.pathname === '/') {
        writeHtmlResponse(response, renderConsoleHtml());
        return;
      }

      if (url.pathname === '/api/providers/health') {
        if (hasSearchParams(url.searchParams)) {
          writeApiErrorResponse(response, {
            status: 400,
            code: 'invalid-provider-health-request',
            message: 'Provider health does not accept query parameters.',
            route: url.pathname,
            method
          });
          return;
        }

        writeJsonResponse(response, 200, buildAgentCliProviderHealthContract({
          env
        }));
        return;
      }

      if (url.pathname === '/api/providers/capabilities') {
        if (hasSearchParams(url.searchParams)) {
          writeApiErrorResponse(response, {
            status: 400,
            code: 'invalid-provider-capabilities-request',
            message: 'Provider capabilities do not accept query parameters.',
            route: url.pathname,
            method
          });
          return;
        }

        writeJsonResponse(response, 200, buildAgentCliCapabilityProfileContract({
          env
        }));
        return;
      }

      if (url.pathname === '/api/providers/lane-preview') {
        if (hasSearchParams(url.searchParams)) {
          writeApiErrorResponse(response, {
            status: 400,
            code: 'invalid-provider-lane-preview-request',
            message: 'Provider lane preview does not accept query parameters.',
            route: url.pathname,
            method
          });
          return;
        }

        writeJsonResponse(response, 200, buildAgentCliLaneAssignmentPreviewContract({
          env
        }));
        return;
      }

      if (url.pathname === '/api/providers/readiness') {
        if (hasSearchParams(url.searchParams)) {
          writeApiErrorResponse(response, {
            status: 400,
            code: 'invalid-provider-readiness-request',
            message: 'Provider readiness does not accept query parameters.',
            route: url.pathname,
            method
          });
          return;
        }

        writeJsonResponse(response, 200, buildProviderReadinessProjection({
          env
        }));
        return;
      }

      const controlledProviderRunnerPreviewRequest = parseControlledProviderRunnerPreviewRequestPath(url.pathname, url.searchParams);

      if (controlledProviderRunnerPreviewRequest !== null) {
        await writeControlledProviderRunnerPreviewResponse({
          response,
          stateDir,
          cwd,
          request: controlledProviderRunnerPreviewRequest,
          route: url.pathname,
          method
        });
        return;
      }

      const workerRunPreviewRequest = parseWorkerRunPreviewRequestPath(url.pathname, url.searchParams);

      if (workerRunPreviewRequest !== null) {
        await writeWorkerRunPreviewResponse({
          response,
          stateDir,
          env,
          workerRunProviderReadiness,
          request: workerRunPreviewRequest,
          route: url.pathname,
          method
        });
        return;
      }

      if (url.pathname === '/api/app-data/migration') {
        if (hasSearchParams(url.searchParams)) {
          writeApiErrorResponse(response, {
            status: 400,
            code: 'invalid-app-schema-migration-request',
            message: 'App schema migration preview does not accept query parameters.',
            route: url.pathname,
            method
          });
          return;
        }

        writeJsonResponse(response, 200, buildAppSchemaMigrationContract());
        return;
      }

      if (url.pathname === '/api/workflow/router-categories') {
        if (hasSearchParams(url.searchParams)) {
          writeApiErrorResponse(response, {
            status: 400,
            code: 'invalid-workflow-router-categories-request',
            message: 'Workflow router categories do not accept query parameters.',
            route: url.pathname,
            method
          });
          return;
        }

        writeJsonResponse(response, 200, buildWorkflowRouterCategoriesContract());
        return;
      }

      if (url.pathname === '/api/projects') {
        if (hasSearchParams(url.searchParams)) {
          writeApiErrorResponse(response, {
            status: 400,
            code: 'invalid-project-registry-request',
            message: 'Project registry does not accept query parameters.',
            route: url.pathname,
            method
          });
          return;
        }

        writeJsonResponse(response, 200, await buildProjectRegistry({
          cwd,
          stateDir
        }));
        return;
      }

      if (url.pathname === '/api/projects/recent') {
        if (hasSearchParams(url.searchParams)) {
          writeApiErrorResponse(response, {
            status: 400,
            code: 'invalid-recent-projects-request',
            message: 'Recent projects does not accept query parameters.',
            route: url.pathname,
            method
          });
          return;
        }

        writeJsonResponse(response, 200, await buildRecentProjects({
          cwd,
          stateDir
        }));
        return;
      }

      if (url.pathname === '/api/projects/current-binding') {
        if (hasSearchParams(url.searchParams)) {
          writeApiErrorResponse(response, {
            status: 400,
            code: 'invalid-current-project-binding-request',
            message: 'Current project binding does not accept query parameters.',
            route: url.pathname,
            method
          });
          return;
        }

        writeJsonResponse(response, 200, await buildCurrentProjectBinding({
          cwd,
          stateDir
        }));
        return;
      }

      if (url.pathname === '/api/settings/personal-workbench') {
        if (hasSearchParams(url.searchParams)) {
          writeApiErrorResponse(response, {
            status: 400,
            code: 'invalid-personal-workbench-settings-request',
            message: 'Personal Workbench settings does not accept query parameters.',
            route: url.pathname,
            method
          });
          return;
        }

        writeJsonResponse(response, 200, await buildPersonalWorkbenchSettingsProjection({
          cwd,
          stateDir
        }));
        return;
      }

      if (url.pathname === '/api/projects/current') {
        const unsupportedParams = [...url.searchParams.keys()].filter((key) => key !== 'repoPath');

        if (unsupportedParams.length > 0) {
          writeApiErrorResponse(response, {
            status: 400,
            code: 'invalid-current-project-request',
            message: 'Current project resolver accepts only repoPath query parameter.',
            route: url.pathname,
            method
          });
          return;
        }

        writeJsonResponse(response, 200, await resolveCurrentProject({
          cwd,
          repoPath: url.searchParams.get('repoPath') ?? undefined,
          stateDir
        }));
        return;
      }

      if (url.pathname === '/api/runtime/snapshot') {
        const unsupportedParams = [...url.searchParams.keys()].filter((key) => key !== 'repoPath' && key !== 'goal');

        if (unsupportedParams.length > 0) {
          writeApiErrorResponse(response, {
            status: 400,
            code: 'invalid-runtime-snapshot-request',
            message: 'Runtime snapshot accepts only repoPath and goal query parameters.',
            route: url.pathname,
            method
          });
          return;
        }

        writeJsonResponse(response, 200, await buildAppStateSnapshot({
          cwd,
          repoPath: url.searchParams.get('repoPath') ?? undefined,
          goalId: url.searchParams.get('goal') ?? undefined,
          stateDir,
          startedAt: runtimeStartedAt
        }));
        return;
      }

      if (url.pathname === '/api/app/data-inventory') {
        const allowedParams = new Set(['goal', 'task']);
        const unsupportedParams = Array.from(url.searchParams.keys()).filter((key) => !allowedParams.has(key));
        const goalId = url.searchParams.get('goal') ?? 'latest';
        const taskId = url.searchParams.get('task');

        if (unsupportedParams.length > 0) {
          writeApiErrorResponse(response, {
            status: 400,
            code: 'invalid-app-data-inventory-request',
            message: 'App data inventory route accepts only goal and task query parameters.',
            route: url.pathname,
            method
          });
          return;
        }

        if (
          isUnsafeGoalRouteSegment(goalId)
          || (taskId !== null && isUnsafeGoalRouteSegment(taskId))
        ) {
          writeApiErrorResponse(response, {
            status: 400,
            code: 'invalid-app-data-inventory-request',
            message: 'App data inventory goal and task query values must be safe refs.',
            route: url.pathname,
            method
          });
          return;
        }

        writeJsonResponse(response, 200, await buildAppDataInventory({
          cwd,
          stateDir,
          goalId,
          taskId,
          startedAt: runtimeStartedAt,
          env,
          artifactStoreDir: join(stateDir, 'artifacts')
        }));
        return;
      }

      if (url.pathname === '/api/inbox/capture') {
        const allowedParams = new Set(['goal', 'task']);
        const unsupportedParams = Array.from(url.searchParams.keys()).filter((key) => !allowedParams.has(key));
        const goalId = url.searchParams.get('goal') ?? 'latest';
        const taskId = url.searchParams.get('task');

        if (unsupportedParams.length > 0) {
          writeApiErrorResponse(response, {
            status: 400,
            code: 'invalid-inbox-capture-request',
            message: 'Inbox capture route accepts only goal and task query parameters.',
            route: url.pathname,
            method
          });
          return;
        }

        if (
          isUnsafeGoalRouteSegment(goalId)
          || (taskId !== null && isUnsafeGoalRouteSegment(taskId))
        ) {
          writeApiErrorResponse(response, {
            status: 400,
            code: 'invalid-inbox-capture-request',
            message: 'Inbox capture goal and task query values must be safe refs.',
            route: url.pathname,
            method
          });
          return;
        }

        writeJsonResponse(response, 200, buildInboxCaptureContract({
          goalId,
          taskId
        }));
        return;
      }

      if (url.pathname === '/api/workflows/goal-draft-handoff') {
        const allowedParams = new Set(['goal', 'task']);
        const unsupportedParams = Array.from(url.searchParams.keys()).filter((key) => !allowedParams.has(key));
        const goalId = url.searchParams.get('goal') ?? 'latest';
        const taskId = url.searchParams.get('task');

        if (unsupportedParams.length > 0) {
          writeApiErrorResponse(response, {
            status: 400,
            code: 'invalid-goal-draft-handoff-request',
            message: 'Goal draft handoff route accepts only goal and task query parameters.',
            route: url.pathname,
            method
          });
          return;
        }

        if (isUnsafeGoalRouteSegment(goalId) || (taskId !== null && isUnsafeGoalRouteSegment(taskId))) {
          writeApiErrorResponse(response, {
            status: 400,
            code: 'invalid-goal-draft-handoff-request',
            message: 'Goal draft handoff goal and task query values must be safe refs.',
            route: url.pathname,
            method
          });
          return;
        }

        writeJsonResponse(response, 200, await buildGoalDraftHandoffContract({
          stateDir,
          goalId,
          taskId
        }));
        return;
      }

      if (url.pathname === '/api/goals') {
        if (hasSearchParams(url.searchParams)) {
          writeApiErrorResponse(response, {
            status: 400,
            code: 'invalid-goal-request',
            message: 'Goal index does not accept query parameters.',
            route: url.pathname,
            method
          });
          return;
        }

        writeJsonResponse(response, 200, {
          contractName: 'symphony.goals-index',
          contractVersion: 1,
          readOnly: true,
          goals: listRegisteredGoals()
        });
        return;
      }

      const goalProgressRequest = parseGoalProgressRequestPath(url.pathname, url.searchParams);

      if (goalProgressRequest !== null) {
        await writeGoalProgressResponse({
          response,
          stateDir,
          request: goalProgressRequest,
          route: url.pathname,
          method
        });
        return;
      }

      const goalEventsRequest = parseGoalEventsRequestPath(url.pathname, url.searchParams);

      if (goalEventsRequest !== null) {
        await writeGoalEventsResponse({
          response,
          stateDir,
          request: goalEventsRequest,
          route: url.pathname,
          method
        });
        return;
      }

      const goalOperationsRequest = parseGoalOperationsRequestPath(url.pathname, url.searchParams);

      if (goalOperationsRequest !== null) {
        await writeGoalOperationsResponse({
          response,
          stateDir,
          request: goalOperationsRequest,
          route: url.pathname,
          method
        });
        return;
      }

      const goalEventPlanPreviewRequest = parseGoalEventPlanPreviewRequestPath(url.pathname, url.searchParams);

      if (goalEventPlanPreviewRequest !== null) {
        await writeGoalEventPlanPreviewResponse({
          response,
          stateDir,
          request: goalEventPlanPreviewRequest,
          route: url.pathname,
          method
        });
        return;
      }

      const controlledImplementationPlanPreviewRequest = parseControlledImplementationPlanPreviewRequestPath(url.pathname, url.searchParams);

      if (controlledImplementationPlanPreviewRequest !== null) {
        await writeControlledImplementationPlanPreviewResponse({
          response,
          stateDir,
          request: controlledImplementationPlanPreviewRequest,
          route: url.pathname,
          method
        });
        return;
      }

      const releaseBaselineRequest = parseReleaseBaselineRequestPath(url.pathname, url.searchParams);

      if (releaseBaselineRequest !== null) {
        await writeReleaseBaselineResponse({
          response,
          stateDir,
          cwd,
          env,
          runner,
          request: releaseBaselineRequest,
          route: url.pathname,
          method
        });
        return;
      }

      const goalRunbookRequest = parseGoalRunbookRequestPath(url.pathname, url.searchParams);

      if (goalRunbookRequest !== null) {
        await writeGoalRunbookResponse({
          response,
          stateDir,
          request: goalRunbookRequest,
          route: url.pathname,
          method
        });
        return;
      }

      const goalNextActionRequest = parseGoalNextActionRequestPath(url.pathname, url.searchParams);

      if (goalNextActionRequest !== null) {
        await writeGoalNextActionResponse({
          response,
          stateDir,
          request: goalNextActionRequest,
          route: url.pathname,
          method
        });
        return;
      }

      const goalPromptPackRequest = parseGoalPromptPackRequestPath(url.pathname, url.searchParams);

      if (goalPromptPackRequest !== null) {
        await writeGoalPromptPackResponse({
          response,
          stateDir,
          request: goalPromptPackRequest,
          route: url.pathname,
          method
        });
        return;
      }

      const goalCloseoutRequest = parseGoalCloseoutRequestPath(url.pathname, url.searchParams);

      if (goalCloseoutRequest !== null) {
        await writeGoalCloseoutResponse({
          response,
          stateDir,
          request: goalCloseoutRequest,
          route: url.pathname,
          method
        });
        return;
      }

      if (url.pathname === '/api/capabilities') {
        if (hasSearchParams(url.searchParams)) {
          writeApiErrorResponse(response, {
            status: 400,
            code: 'invalid-capabilities-request',
            message: 'Capabilities route does not accept query parameters.',
            route: url.pathname,
            method
          });
          return;
        }

        writeJsonResponse(response, 200, buildCapabilitiesContract());
        return;
      }

      if (url.pathname === '/api/actions/manifest') {
        const allowedParams = new Set(['goal', 'task']);
        const unsupportedParams = Array.from(url.searchParams.keys()).filter((key) => !allowedParams.has(key));
        const goalId = url.searchParams.get('goal') ?? 'latest';
        const taskId = url.searchParams.get('task');

        if (unsupportedParams.length > 0) {
          writeApiErrorResponse(response, {
            status: 400,
            code: 'invalid-action-manifest-request',
            message: 'Action manifest route accepts only goal and task query parameters.',
            route: url.pathname,
            method
          });
          return;
        }

        if (isUnsafeGoalRouteSegment(goalId) || (taskId !== null && isUnsafeGoalRouteSegment(taskId))) {
          writeApiErrorResponse(response, {
            status: 400,
            code: 'invalid-action-manifest-request',
            message: 'Action manifest goal and task query values must be safe route segments.',
            route: url.pathname,
            method
          });
          return;
        }

        writeJsonResponse(response, 200, buildActionManifestContract({
          goalId,
          taskId
        }));
        return;
      }

      if (url.pathname === '/api/actions/availability') {
        const allowedParams = new Set(['goal', 'task']);
        const unsupportedParams = Array.from(url.searchParams.keys()).filter((key) => !allowedParams.has(key));
        const goalId = url.searchParams.get('goal') ?? 'latest';
        const taskId = url.searchParams.get('task');

        if (unsupportedParams.length > 0) {
          writeApiErrorResponse(response, {
            status: 400,
            code: 'invalid-action-availability-request',
            message: 'Action availability route accepts only goal and task query parameters.',
            route: url.pathname,
            method
          });
          return;
        }

        if (isUnsafeGoalRouteSegment(goalId) || (taskId !== null && isUnsafeGoalRouteSegment(taskId))) {
          writeApiErrorResponse(response, {
            status: 400,
            code: 'invalid-action-availability-request',
            message: 'Action availability goal and task query values must be safe route segments.',
            route: url.pathname,
            method
          });
          return;
        }

        writeJsonResponse(response, 200, await buildActionAvailabilityContract({
          stateDir,
          goalId,
          taskId
        }));
        return;
      }

      if (url.pathname === '/api/actions/preview') {
        const allowedParams = new Set(['goal', 'task', 'action']);
        const unsupportedParams = Array.from(url.searchParams.keys()).filter((key) => !allowedParams.has(key));
        const goalId = url.searchParams.get('goal') ?? 'latest';
        const taskId = url.searchParams.get('task');
        const actionId = url.searchParams.get('action');

        if (unsupportedParams.length > 0) {
          writeApiErrorResponse(response, {
            status: 400,
            code: 'invalid-action-preview-request',
            message: 'Action preview route accepts only goal, task, and action query parameters.',
            route: url.pathname,
            method
          });
          return;
        }

        if (
          isUnsafeGoalRouteSegment(goalId)
          || (taskId !== null && isUnsafeGoalRouteSegment(taskId))
          || !isSafeActionPreviewId(actionId)
        ) {
          writeApiErrorResponse(response, {
            status: 400,
            code: 'invalid-action-preview-request',
            message: 'Action preview goal, task, and action query values must be safe refs.',
            route: url.pathname,
            method
          });
          return;
        }

        writeJsonResponse(response, 200, await buildActionPreviewContract({
          stateDir,
          goalId,
          taskId,
          actionId
        }));
        return;
      }

      if (url.pathname === '/api/jobs') {
        const allowedParams = new Set(['goal', 'task']);
        const unsupportedParams = Array.from(url.searchParams.keys()).filter((key) => !allowedParams.has(key));
        const goalId = url.searchParams.get('goal') ?? 'latest';
        const taskId = url.searchParams.get('task');

        if (unsupportedParams.length > 0) {
          writeApiErrorResponse(response, {
            status: 400,
            code: 'invalid-job-model-request',
            message: 'Job model route accepts only goal and task query parameters.',
            route: url.pathname,
            method
          });
          return;
        }

        if (
          isUnsafeGoalRouteSegment(goalId)
          || (taskId !== null && isUnsafeGoalRouteSegment(taskId))
        ) {
          writeApiErrorResponse(response, {
            status: 400,
            code: 'invalid-job-model-request',
            message: 'Job model goal and task query values must be safe refs.',
            route: url.pathname,
            method
          });
          return;
        }

        writeJsonResponse(response, 200, await buildJobModelContract({
          goalId,
          taskId
        }));
        return;
      }

      if (url.pathname === '/api/jobs/create') {
        const allowedParams = new Set(['goal', 'task', 'action']);
        const unsupportedParams = Array.from(url.searchParams.keys()).filter((key) => !allowedParams.has(key));
        const goalId = url.searchParams.get('goal') ?? 'latest';
        const taskId = url.searchParams.get('task');
        const actionId = url.searchParams.get('action');

        if (unsupportedParams.length > 0) {
          writeApiErrorResponse(response, {
            status: 400,
            code: 'invalid-job-creation-request',
            message: 'Job creation route accepts only goal, task, and action query parameters.',
            route: url.pathname,
            method
          });
          return;
        }

        if (actionId === null) {
          writeApiErrorResponse(response, {
            status: 400,
            code: 'invalid-job-creation-request',
            message: 'Job creation requires an action query parameter.',
            route: url.pathname,
            method
          });
          return;
        }

        if (
          isUnsafeGoalRouteSegment(goalId)
          || (taskId !== null && isUnsafeGoalRouteSegment(taskId))
          || !isSafeActionPreviewId(actionId)
        ) {
          writeApiErrorResponse(response, {
            status: 400,
            code: 'invalid-job-creation-request',
            message: 'Job creation goal, task, and action query values must be safe refs.',
            route: url.pathname,
            method
          });
          return;
        }

        writeJsonResponse(response, 200, await buildJobCreationContract({
          stateDir,
          goalId,
          taskId,
          actionId
        }));
        return;
      }

      if (url.pathname === '/api/jobs/timeline') {
        const allowedParams = new Set(['job_id', 'goal', 'task']);
        const unsupportedParams = Array.from(url.searchParams.keys()).filter((key) => !allowedParams.has(key));
        const jobId = url.searchParams.get('job_id');
        const goalId = url.searchParams.get('goal') ?? 'latest';
        const taskId = url.searchParams.get('task');

        if (unsupportedParams.length > 0) {
          writeApiErrorResponse(response, {
            status: 400,
            code: 'invalid-job-timeline-request',
            message: 'Job timeline route accepts only job_id, goal, and task query parameters.',
            route: url.pathname,
            method
          });
          return;
        }

        if (
          (jobId !== null && isUnsafeGoalRouteSegment(jobId))
          || isUnsafeGoalRouteSegment(goalId)
          || (taskId !== null && isUnsafeGoalRouteSegment(taskId))
        ) {
          writeApiErrorResponse(response, {
            status: 400,
            code: 'invalid-job-timeline-request',
            message: 'Job timeline query values must be safe refs.',
            route: url.pathname,
            method
          });
          return;
        }

        writeJsonResponse(response, 200, await buildJobTimelineLogStreamContract({
          jobId,
          goalId,
          taskId
        }));
        return;
      }

      if (url.pathname === '/api/jobs/control') {
        const allowedParams = new Set(['job_id', 'goal', 'task', 'state']);
        const unsupportedParams = Array.from(url.searchParams.keys()).filter((key) => !allowedParams.has(key));
        const jobId = url.searchParams.get('job_id');
        const goalId = url.searchParams.get('goal') ?? 'latest';
        const taskId = url.searchParams.get('task');
        const stateParam = url.searchParams.get('state');

        if (unsupportedParams.length > 0) {
          writeApiErrorResponse(response, {
            status: 400,
            code: 'invalid-job-run-control-request',
            message: 'Job run control route accepts only job_id, goal, task, and state query parameters.',
            route: url.pathname,
            method
          });
          return;
        }

        if (
          (jobId !== null && isUnsafeGoalRouteSegment(jobId))
          || isUnsafeGoalRouteSegment(goalId)
          || (taskId !== null && isUnsafeGoalRouteSegment(taskId))
        ) {
          writeApiErrorResponse(response, {
            status: 400,
            code: 'invalid-job-run-control-request',
            message: 'Job run control query values must be safe refs.',
            route: url.pathname,
            method
          });
          return;
        }

        const validStates = new Set(['queued', 'running', 'blocked', 'failed', 'passed', 'cancelled']);

        if (stateParam !== null && !validStates.has(stateParam)) {
          writeApiErrorResponse(response, {
            status: 400,
            code: 'invalid-job-run-control-request',
            message: 'Job run control state parameter must be a valid job status.',
            route: url.pathname,
            method
          });
          return;
        }

        writeJsonResponse(response, 200, buildJobRunControlContract({
          jobId,
          goalId,
          taskId,
          currentState: stateParam
        }));
        return;
      }

      if (url.pathname === '/api/diagnostics') {
        if (hasSearchParams(url.searchParams)) {
          writeApiErrorResponse(response, {
            status: 400,
            code: 'invalid-diagnostics-request',
            message: 'Diagnostics route does not accept query parameters.',
            route: url.pathname,
            method
          });
          return;
        }

        writeJsonResponse(response, 200, await buildDiagnosticsContract({ stateDir }));
        return;
      }

      if (url.pathname === '/api/diagnostics/bundle') {
        const allowedParams = new Set(['goal', 'task']);
        const unsupportedParams = Array.from(url.searchParams.keys()).filter((key) => !allowedParams.has(key));
        const diagnosticsGoalId = url.searchParams.get('goal') ?? 'latest';
        const diagnosticsTaskId = url.searchParams.get('task') ?? null;

        if (unsupportedParams.length > 0) {
          writeApiErrorResponse(response, {
            status: 400,
            code: 'invalid-diagnostics-bundle-request',
            message: 'Diagnostics bundle route accepts only goal and task query parameters.',
            route: url.pathname,
            method
          });
          return;
        }

        if (
          isUnsafeGoalRouteSegment(diagnosticsGoalId)
          || (diagnosticsTaskId !== null && isUnsafeGoalRouteSegment(diagnosticsTaskId))
        ) {
          writeApiErrorResponse(response, {
            status: 400,
            code: 'invalid-diagnostics-bundle-request',
            message: 'Diagnostics bundle goal and task query values must be safe refs.',
            route: url.pathname,
            method
          });
          return;
        }

        writeJsonResponse(response, 200, await buildAppCoreDiagnosticsBundle({
          cwd,
          stateDir,
          goalId: diagnosticsGoalId,
          taskId: diagnosticsTaskId
        }));
        return;
      }

      if (url.pathname === '/api/artifacts') {
        const allowedParams = new Set(['goal', 'task', 'kind', 'q']);
        const unsupportedParams = Array.from(url.searchParams.keys()).filter((key) => !allowedParams.has(key));
        const goalId = url.searchParams.get('goal') ?? 'latest';
        const taskId = url.searchParams.get('task');
        const kind = url.searchParams.get('kind');
        const query = url.searchParams.get('q');

        if (unsupportedParams.length > 0) {
          writeApiErrorResponse(response, {
            status: 400,
            code: 'invalid-artifact-index-request',
            message: 'Artifact index route accepts only goal, task, kind, and q query parameters.',
            route: url.pathname,
            method
          });
          return;
        }

        if (
          isUnsafeGoalRouteSegment(goalId)
          || (taskId !== null && isUnsafeGoalRouteSegment(taskId))
          || (kind !== null && isUnsafeGoalRouteSegment(kind))
        ) {
          writeApiErrorResponse(response, {
            status: 400,
            code: 'invalid-artifact-index-request',
            message: 'Artifact index query values must be safe refs.',
            route: url.pathname,
            method
          });
          return;
        }

        if (query !== null) {
          const searchValidation = validateSearchFilters({ q: query });
          if (!searchValidation.ok) {
            writeApiErrorResponse(response, {
              status: 400,
              code: 'invalid-artifact-index-request',
              message: `Invalid search query: ${searchValidation.errors.join('; ')}`,
              route: url.pathname,
              method
            });
            return;
          }
        }

        const artifactStoreDir = join(stateDir, 'artifacts');
        const artifactIndex = await buildArtifactIndex({
          artifactStoreDir,
          stateDir,
          goalId,
          taskId
        });

        if (kind !== null || query !== null) {
          const filters = {
            ...(kind !== null ? { kind } : {}),
            ...(query !== null ? { q: query } : {})
          };

          artifactIndex.entries = searchArtifactEntries(
            artifactIndex.entries,
            filters
          );

          if (kind !== null) {
            artifactIndex.context.kindFilter = kind;
          }

          if (query !== null) {
            artifactIndex.context.searchQuery = query;
          }
        }

        writeJsonResponse(response, 200, artifactIndex);
        return;
      }

      if (url.pathname === '/api/evidence/timeline') {
        const allowedParams = new Set(['goal', 'task']);
        const unsupportedParams = Array.from(url.searchParams.keys()).filter((key) => !allowedParams.has(key));
        const goalId = url.searchParams.get('goal') ?? 'latest';
        const taskId = url.searchParams.get('task');

        if (unsupportedParams.length > 0) {
          writeApiErrorResponse(response, {
            status: 400,
            code: 'invalid-evidence-timeline-request',
            message: 'Evidence timeline route accepts only goal and task query parameters.',
            route: url.pathname,
            method
          });
          return;
        }

        if (
          isUnsafeGoalRouteSegment(goalId)
          || (taskId !== null && isUnsafeGoalRouteSegment(taskId))
        ) {
          writeApiErrorResponse(response, {
            status: 400,
            code: 'invalid-evidence-timeline-request',
            message: 'Evidence timeline goal and task query values must be safe refs.',
            route: url.pathname,
            method
          });
          return;
        }

        const resolvedGoal = await resolveGoalEventsGoal({
          stateDir,
          goalId
        });

        let goalEventsData = { events: [] };
        if (resolvedGoal !== null) {
          try {
            const eventLog = await readGoalEventJournal({
              stateDir,
              goalId: resolvedGoal.goalId,
              goalTitle: resolvedGoal.goalTitle,
              baseline: resolvedGoal.baseline
            });
            goalEventsData = eventLog;
          } catch {
            goalEventsData = { events: [] };
          }
        }

        const artifactStoreDir = join(stateDir, 'artifacts');
        const artifactIndex = await buildArtifactIndex({
          artifactStoreDir,
          stateDir,
          goalId,
          taskId
        });

        writeJsonResponse(response, 200, buildEvidenceTimelineContract({
          goalId,
          taskId,
          entries: artifactIndex.entries,
          goalEvents: Array.isArray(goalEventsData.events) ? goalEventsData.events : []
        }));
        return;
      }

      if (url.pathname === '/api/release/bundle') {
        const allowedParams = new Set(['goal']);
        const unsupportedParams = Array.from(url.searchParams.keys()).filter((key) => !allowedParams.has(key));
        const goalId = url.searchParams.get('goal') ?? 'latest';

        if (unsupportedParams.length > 0) {
          writeApiErrorResponse(response, {
            status: 400,
            code: 'invalid-release-bundle-request',
            message: 'Release bundle route accepts only goal query parameter.',
            route: url.pathname,
            method
          });
          return;
        }

        if (isUnsafeGoalRouteSegment(goalId)) {
          writeApiErrorResponse(response, {
            status: 400,
            code: 'invalid-release-bundle-request',
            message: 'Release bundle goal query value must be a safe ref.',
            route: url.pathname,
            method
          });
          return;
        }

        const resolvedBundleGoal = await resolveGoalEventsGoal({
          stateDir,
          goalId
        });

        let bundleGoalEvents = { events: [] };
        let goalProgress = null;
        if (resolvedBundleGoal !== null) {
          try {
            const eventLog = await readGoalEventJournal({
              stateDir,
              goalId: resolvedBundleGoal.goalId,
              goalTitle: resolvedBundleGoal.goalTitle,
              baseline: resolvedBundleGoal.baseline
            });
            bundleGoalEvents = eventLog;
          } catch {
            bundleGoalEvents = { events: [] };
          }

          try {
            goalProgress = await buildGoalProgressLedger({
              stateDir,
              goalId: resolvedBundleGoal.goalId
            });
          } catch {
            goalProgress = null;
          }
        }

        const bundleArtifactStoreDir = join(stateDir, 'artifacts');
        const bundleArtifactIndex = await buildArtifactIndex({
          artifactStoreDir: bundleArtifactStoreDir,
          stateDir,
          goalId
        });

        writeJsonResponse(response, 200, buildReleaseBundleContract({
          goalId,
          entries: bundleArtifactIndex.entries,
          goalEvents: Array.isArray(bundleGoalEvents.events) ? bundleGoalEvents.events : [],
          goalProgress
        }));
        return;
      }

      if (url.pathname === '/api/release/app-core-manager') {
        const allowedParams = new Set(['goal', 'task']);
        const unsupportedParams = Array.from(url.searchParams.keys()).filter((key) => !allowedParams.has(key));
        const releaseManagerGoalId = url.searchParams.get('goal') ?? 'latest';
        const releaseManagerTaskId = url.searchParams.get('task') ?? 'task-4';

        if (unsupportedParams.length > 0) {
          writeApiErrorResponse(response, {
            status: 400,
            code: 'invalid-app-core-release-manager-request',
            message: 'App core release manager route accepts only goal and task query parameters.',
            route: url.pathname,
            method
          });
          return;
        }

        if (
          isUnsafeGoalRouteSegment(releaseManagerGoalId)
          || isUnsafeGoalRouteSegment(releaseManagerTaskId)
        ) {
          writeApiErrorResponse(response, {
            status: 400,
            code: 'invalid-app-core-release-manager-request',
            message: 'App core release manager goal and task query values must be safe refs.',
            route: url.pathname,
            method
          });
          return;
        }

        writeJsonResponse(response, 200, await buildAppCoreReleaseManager({
          cwd,
          stateDir,
          goalId: releaseManagerGoalId,
          taskId: releaseManagerTaskId,
          env
        }));
        return;
      }

      if (url.pathname === '/api/backup/export') {
        const allowedParams = new Set(['goal', 'task']);
        const unsupportedParams = Array.from(url.searchParams.keys()).filter((key) => !allowedParams.has(key));
        const backupGoalId = url.searchParams.get('goal') ?? 'latest';
        const backupTaskId = url.searchParams.get('task') ?? null;

        if (unsupportedParams.length > 0) {
          writeApiErrorResponse(response, {
            status: 400,
            code: 'invalid-backup-export-request',
            message: 'Backup export route accepts only goal and task query parameters.',
            route: url.pathname,
            method
          });
          return;
        }

        if (
          isUnsafeGoalRouteSegment(backupGoalId)
          || (backupTaskId !== null && isUnsafeGoalRouteSegment(backupTaskId))
        ) {
          writeApiErrorResponse(response, {
            status: 400,
            code: 'invalid-backup-export-request',
            message: 'Backup export goal and task query values must be safe refs.',
            route: url.pathname,
            method
          });
          return;
        }

        writeJsonResponse(response, 200, await buildAppCoreBackupExport({
          cwd,
          stateDir,
          goalId: backupGoalId,
          taskId: backupTaskId
        }));
        return;
      }

      if (url.pathname === '/api/restore/validate') {
        const allowedParams = new Set(['goal', 'task']);
        const unsupportedParams = Array.from(url.searchParams.keys()).filter((key) => !allowedParams.has(key));
        const restoreGoalId = url.searchParams.get('goal') ?? 'latest';
        const restoreTaskId = url.searchParams.get('task') ?? null;

        if (unsupportedParams.length > 0) {
          writeApiErrorResponse(response, {
            status: 400,
            code: 'invalid-restore-validation-request',
            message: 'Restore validation route accepts only goal and task query parameters.',
            route: url.pathname,
            method
          });
          return;
        }

        if (
          isUnsafeGoalRouteSegment(restoreGoalId)
          || (restoreTaskId !== null && isUnsafeGoalRouteSegment(restoreTaskId))
        ) {
          writeApiErrorResponse(response, {
            status: 400,
            code: 'invalid-restore-validation-request',
            message: 'Restore validation goal and task query values must be safe refs.',
            route: url.pathname,
            method
          });
          return;
        }

        writeJsonResponse(response, 200, await buildAppCoreRestoreValidation({
          cwd,
          stateDir,
          goalId: restoreGoalId,
          taskId: restoreTaskId
        }));
        return;
      }

      if (url.pathname === '/api/install/status') {
        if (hasSearchParams(url.searchParams)) {
          writeApiErrorResponse(response, {
            status: 400,
            code: 'invalid-install-status-request',
            message: 'Install status route does not accept query parameters.',
            route: url.pathname,
            method
          });
          return;
        }

        writeJsonResponse(response, 200, buildInstallStatus({ env }));
        return;
      }

      if (url.pathname === '/api/bundle') {
        const allowedParams = new Set(['goal', 'task']);
        const unsupportedParams = Array.from(url.searchParams.keys()).filter((key) => !allowedParams.has(key));
        const bundleGoalId = url.searchParams.get('goal') ?? 'latest';
        const bundleTaskId = url.searchParams.get('task') ?? null;

        if (unsupportedParams.length > 0) {
          writeApiErrorResponse(response, {
            status: 400,
            code: 'invalid-bundle-request',
            message: 'Bundle route accepts only goal and task query parameters.',
            route: url.pathname,
            method
          });
          return;
        }

        if (isUnsafeGoalRouteSegment(bundleGoalId)) {
          writeApiErrorResponse(response, {
            status: 400,
            code: 'invalid-bundle-request',
            message: 'Bundle goal query value must be a safe ref.',
            route: url.pathname,
            method
          });
          return;
        }

        if (bundleTaskId !== null && isUnsafeGoalRouteSegment(bundleTaskId)) {
          writeApiErrorResponse(response, {
            status: 400,
            code: 'invalid-bundle-request',
            message: 'Bundle task query value must be a safe ref.',
            route: url.pathname,
            method
          });
          return;
        }

        const resolvedBundleGoal = await resolveGoalEventsGoal({
          stateDir,
          goalId: bundleGoalId
        });

        const resolvedBundleGoalId = resolvedBundleGoal?.goalId ?? bundleGoalId;

        const bundle = await buildEvidenceBundle({
          stateDir,
          goalId: resolvedBundleGoalId,
          taskId: bundleTaskId
        });

        writeJsonResponse(response, 200, bundle);
        return;
      }

      const handoffRequest = parseHandoffRequestPath(url.pathname, url.searchParams);

      if (handoffRequest !== null) {
        await writeHandoffResponse({
          response,
          request: handoffRequest,
          route: url.pathname,
          method
        });
        return;
      }

      const adoptionInspectRequest = parseAdoptionInspectRequestPath(url.pathname, url.searchParams);

      if (adoptionInspectRequest !== null) {
        if (adoptionInspectRequest.kind === 'invalid') {
          writeApiErrorResponse(response, {
            status: 400,
            code: 'invalid-adoption-inspect-ref',
            message: 'Adoption inspect ref is invalid.',
            route: url.pathname,
            method,
            safeDetails: {
              reason: adoptionInspectRequest.reason
            }
          });
          return;
        }

        await writeAdoptionInspectResponse({
          response,
          stateDir,
          adoptionId: adoptionInspectRequest.adoptionId
        });
        return;
      }

      if (url.pathname === '/api/runs') {
        const runs = await decorateConsoleRuns(
          (await listRunStates({ stateDir })).map((run) => compactRunState(run)),
          { stateDir }
        );
        const filter = normalizeRunFilter(url.searchParams.get('filter'));
        writeJsonResponse(response, 200, {
          contractVersion: PRODUCT_JSON_CONTRACT.version,
          contractName: 'symphony.console-runs',
          filter,
          availableFilters: [...RUN_FILTERS],
          runs: filterRuns(runs, filter)
        });
        return;
      }

      if (url.pathname === '/api/runs/latest') {
        await writeRunResponse({ response, stateDir, runId: 'latest' });
        return;
      }

      const timelineRequest = parseRunTimelineRequestPath(url.pathname);

      if (timelineRequest !== null) {
        await writeTimelineResponse({
          response,
          stateDir,
          runId: timelineRequest.runId
        });
        return;
      }

      const artifactRequest = parseArtifactRequestPath(url.pathname, url.searchParams);

      if (artifactRequest !== null) {
        if (artifactRequest.kind === 'invalid') {
          writeApiErrorResponse(response, {
            status: 400,
            code: 'invalid-artifact-ref',
            message: 'Artifact preview ref is invalid.',
            route: url.pathname,
            method,
            safeDetails: {
              reason: 'invalid-route-segment'
            }
          });
          return;
        }

        await writeArtifactResponse({
          response,
          stateDir,
          runId: artifactRequest.runId,
          artifactKind: artifactRequest.artifactKind,
          safePreview: artifactRequest.safePreview,
          route: url.pathname,
          method
        });
        return;
      }

      if (url.pathname.startsWith('/api/runs/')) {
        const runId = decodeURIComponent(url.pathname.slice('/api/runs/'.length));
        await writeRunResponse({ response, stateDir, runId });
        return;
      }

      if (isWorkbenchRoute(url.pathname)) {
        await writeWorkbenchStaticResponse({ response, pathname: url.pathname });
        return;
      }

      writeApiErrorResponse(response, {
        status: 404,
        code: 'not-found',
        message: 'Route not found.',
        route: url.pathname,
        method
      });
    } catch (error) {
      writeApiErrorResponse(response, {
        status: error instanceof TypeError ? 400 : 500,
        code: error instanceof TypeError ? 'bad-request' : 'internal-error',
        message: error instanceof TypeError ? 'Request is invalid.' : 'Console request failed safely.',
        route: url.pathname,
        method
      });
    }
  });
}

export async function startSymphonyConsoleServer({
  stateDir = '.symphony',
  host = DEFAULT_HOST,
  port = DEFAULT_PORT,
  cwd = process.cwd(),
  env = process.env,
  runner = new NodeProcessRunner(),
  mcasRunner,
  readinessTimeoutMs = DEFAULT_READINESS_TIMEOUT_MS
} = {}) {
  const server = createSymphonyConsoleServer({
    stateDir,
    cwd,
    env,
    runner,
    mcasRunner,
    readinessTimeoutMs
  });

  return await startConsoleHttpServer({
    server,
    host,
    port
  });
}

async function writeGoalProgressResponse({ response, stateDir, request, route, method }) {
  if (request.kind === 'invalid') {
    writeApiErrorResponse(response, {
      status: 400,
      code: 'invalid-goal-ref',
      message: 'Goal progress ref is invalid.',
      route,
      method,
      safeDetails: {
        reason: 'invalid-route-segment'
      }
    });
    return;
  }

  const ledger = await buildGoalProgressLedger({
    stateDir,
    goalId: request.goalId
  });

  if (ledger === null) {
    writeApiErrorResponse(response, {
      status: 404,
      code: 'goal-not-found',
      message: 'Goal progress ledger was not found.',
      route,
      method
    });
    return;
  }

  writeJsonResponse(response, 200, ledger);
}

async function writeGoalEventsResponse({ response, stateDir, request, route, method }) {
  if (request.kind === 'invalid') {
    writeApiErrorResponse(response, {
      status: 400,
      code: 'invalid-goal-ref',
      message: 'Goal events ref is invalid.',
      route,
      method,
      safeDetails: {
        reason: 'invalid-route-segment'
      }
    });
    return;
  }

  let goal;

  try {
    goal = await resolveGoalEventsGoal({
      stateDir,
      goalId: request.goalId
    });
  } catch (error) {
    if (error instanceof GoalRunbookContextError) {
      writeApiErrorResponse(response, {
        status: 400,
        code: error.code,
        message: error.message,
        route,
        method,
        safeDetails: error.safeDetails
      });
      return;
    }

    throw error;
  }

  if (goal === null) {
    writeApiErrorResponse(response, {
      status: 404,
      code: 'goal-not-found',
      message: 'Goal event log was not found.',
      route,
      method
    });
    return;
  }

  const eventLog = await readGoalEventJournal({
    stateDir,
    goalId: goal.goalId,
    goalTitle: goal.goalTitle,
    baseline: goal.baseline
  });

  writeJsonResponse(response, 200, eventLog);
}

async function writeGoalOperationsResponse({ response, stateDir, request, route, method }) {
  if (request.kind === 'invalid') {
    writeApiErrorResponse(response, {
      status: 400,
      code: 'invalid-goal-ref',
      message: 'Goal operation runs ref is invalid.',
      route,
      method,
      safeDetails: {
        reason: 'invalid-route-segment'
      }
    });
    return;
  }

  let resolvedGoalId;

  try {
    resolvedGoalId = await resolveGoalEventPlanPreviewGoalId({
      stateDir,
      goalId: request.goalId
    });
  } catch (error) {
    if (error instanceof GoalRunbookContextError) {
      writeApiErrorResponse(response, {
        status: 400,
        code: error.code,
        message: error.message,
        route,
        method,
        safeDetails: error.safeDetails
      });
      return;
    }

    throw error;
  }

  if (resolvedGoalId === null) {
    writeApiErrorResponse(response, {
      status: 404,
      code: 'goal-not-found',
      message: 'Goal operation run registry was not found.',
      route,
      method
    });
    return;
  }

  try {
    writeJsonResponse(response, 200, await readGoalOperationRuns({
      stateDir,
      goalId: resolvedGoalId
    }));
  } catch (error) {
    if (error instanceof GoalOperationRunRegistryError) {
      writeApiErrorResponse(response, {
        status: 400,
        code: error.code,
        message: error.message,
        route,
        method,
        safeDetails: error.safeDetails
      });
      return;
    }

    throw error;
  }
}

async function writeGoalEventPlanPreviewResponse({ response, stateDir, request, route, method }) {
  if (request.kind === 'invalid') {
    writeApiErrorResponse(response, {
      status: 400,
      code: 'invalid-goal-ref',
      message: 'Goal event plan preview ref is invalid.',
      route,
      method,
      safeDetails: {
        reason: request.reason
      }
    });
    return;
  }

  let resolvedGoalId;

  try {
    resolvedGoalId = await resolveGoalEventPlanPreviewGoalId({
      stateDir,
      goalId: request.goalId
    });
  } catch (error) {
    if (error instanceof GoalRunbookContextError) {
      writeApiErrorResponse(response, {
        status: 400,
        code: error.code,
        message: error.message,
        route,
        method,
        safeDetails: error.safeDetails
      });
      return;
    }

    throw error;
  }

  if (resolvedGoalId === null) {
    writeApiErrorResponse(response, {
      status: 404,
      code: 'goal-not-found',
      message: 'Goal for event plan preview was not found.',
      route,
      method
    });
    return;
  }

  try {
    const plan = await buildGoalEventPlanPreview({
      stateDir,
      goalId: resolvedGoalId,
      searchParams: request.searchParams
    });
    const operationRun = await recordGoalOperationRunFromPlan({
      stateDir,
      goalId: resolvedGoalId,
      plan,
      status: 'dry-run-planned',
      source: 'workbench.event-plan-preview'
    });

    writeJsonResponse(response, 200, addGoalEventPlanPreviewSummary(plan, operationRun));
  } catch (error) {
    if (
      error instanceof GoalUpdateError ||
      error instanceof GoalReviewError ||
      error instanceof GoalGateError ||
      error instanceof GoalEventPlanPreviewError ||
      error instanceof GoalOperationRunRegistryError
    ) {
      writeApiErrorResponse(response, {
        status: 400,
        code: error.code,
        message: error.message,
        route,
        method,
        safeDetails: error.safeDetails
      });
      return;
    }

    throw error;
  }
}

async function writeGoalEventPlanConfirmResponse({
  requestMessage,
  response,
  stateDir,
  request,
  route,
  method
}) {
  if (request.kind === 'invalid') {
    writeApiErrorResponse(response, {
      status: 400,
      code: 'invalid-goal-ref',
      message: 'Goal event plan confirm ref is invalid.',
      route,
      method,
      safeDetails: {
        reason: request.reason
      }
    });
    return;
  }

  let resolvedGoalId;

  try {
    resolvedGoalId = await resolveGoalEventPlanPreviewGoalId({
      stateDir,
      goalId: request.goalId
    });
  } catch (error) {
    if (error instanceof GoalRunbookContextError) {
      writeApiErrorResponse(response, {
        status: 400,
        code: error.code,
        message: error.message,
        route,
        method,
        safeDetails: error.safeDetails
      });
      return;
    }

    throw error;
  }

  if (resolvedGoalId === null) {
    writeApiErrorResponse(response, {
      status: 404,
      code: 'goal-not-found',
      message: 'Goal for event plan confirm was not found.',
      route,
      method
    });
    return;
  }

  try {
    const body = await readGoalEventConfirmRequestBody(requestMessage);
    const result = await confirmGoalEventPlan({
      stateDir,
      goalId: resolvedGoalId,
      body
    });
    const operationRun = await recordGoalOperationRunFromConfirmResult({
      stateDir,
      goalId: resolvedGoalId,
      result
    });

    writeJsonResponse(response, 200, await buildGoalEventPlanConfirmResponse({
      stateDir,
      goalId: resolvedGoalId,
      result,
      operationRun
    }));
  } catch (error) {
    if (
      error instanceof GoalUpdateError ||
      error instanceof GoalReviewError ||
      error instanceof GoalGateError ||
      error instanceof GoalEventPlanPreviewError ||
      error instanceof GoalOperationRunRegistryError
    ) {
      writeApiErrorResponse(response, {
        status: 400,
        code: error.code,
        message: error.message,
        route,
        method,
        safeDetails: error.safeDetails
      });
      return;
    }

    throw error;
  }
}

async function writeResultIntakePreviewResponse({
  requestMessage,
  response,
  stateDir,
  request,
  route,
  method
}) {
  if (request.kind === 'invalid') {
    writeApiErrorResponse(response, {
      status: 400,
      code: 'invalid-result-intake-preview-request',
      message: 'Result intake preview request is invalid.',
      route,
      method,
      safeDetails: {
        reason: request.reason
      }
    });
    return;
  }

  let resolvedGoalId;

  try {
    resolvedGoalId = await resolveGoalEventPlanPreviewGoalId({
      stateDir,
      goalId: request.goalId
    });
  } catch (error) {
    if (error instanceof GoalRunbookContextError) {
      writeApiErrorResponse(response, {
        status: 400,
        code: error.code,
        message: error.message,
        route,
        method,
        safeDetails: error.safeDetails
      });
      return;
    }

    throw error;
  }

  if (resolvedGoalId === null) {
    writeApiErrorResponse(response, {
      status: 404,
      code: 'goal-not-found',
      message: 'Goal for result intake preview was not found.',
      route,
      method
    });
    return;
  }

  try {
    const body = await readResultIntakeRequestBody(requestMessage, {
      code: 'invalid-result-intake-preview-request',
      label: 'Result intake preview'
    });

    assertResultIntakeRequestEnvelope(body, {
      code: 'invalid-result-intake-preview-request'
    });
    assertResultIntakeRouteGoal({
      routeGoalId: resolvedGoalId,
      request: body,
      code: 'invalid-result-intake-preview-request'
    });

    const preview = buildResultIntakePreview(body);

    writeJsonResponse(response, 200, toSerializableResultIntakeContract({
      ...preview,
      previewEndpoint: {
        method: 'POST',
        route: `/api/goals/${encodeURIComponent(resolvedGoalId)}/result-intake-preview`,
        acceptsQueryParameters: false,
        writesOnPreview: false,
        writesGoalEventLog: false,
        writesOperationRegistry: false
      }
    }));
  } catch (error) {
    if (error instanceof ResultIntakeContractError || error instanceof GoalEventPlanPreviewError) {
      writeApiErrorResponse(response, {
        status: 400,
        code: error.code,
        message: error.message,
        route,
        method,
        safeDetails: safeResultIntakeErrorDetails(error)
      });
      return;
    }

    throw error;
  }
}

async function writeResultIntakeConfirmResponse({
  requestMessage,
  response,
  stateDir,
  request,
  route,
  method
}) {
  if (request.kind === 'invalid') {
    writeApiErrorResponse(response, {
      status: 400,
      code: 'invalid-result-intake-confirm-request',
      message: 'Result intake confirm request is invalid.',
      route,
      method,
      safeDetails: {
        reason: request.reason
      }
    });
    return;
  }

  let resolvedGoalId;

  try {
    resolvedGoalId = await resolveGoalEventPlanPreviewGoalId({
      stateDir,
      goalId: request.goalId
    });
  } catch (error) {
    if (error instanceof GoalRunbookContextError) {
      writeApiErrorResponse(response, {
        status: 400,
        code: error.code,
        message: error.message,
        route,
        method,
        safeDetails: error.safeDetails
      });
      return;
    }

    throw error;
  }

  if (resolvedGoalId === null) {
    writeApiErrorResponse(response, {
      status: 404,
      code: 'goal-not-found',
      message: 'Goal for result intake confirm was not found.',
      route,
      method
    });
    return;
  }

  try {
    const body = await readResultIntakeRequestBody(requestMessage, {
      code: 'invalid-result-intake-confirm-request',
      label: 'Result intake confirm'
    });
    const input = normalizeResultIntakeConfirmBody(body);

    assertResultIntakeRouteGoal({
      routeGoalId: resolvedGoalId,
      request: input.resultIntakeRequest,
      preview: input.resultIntakePreview,
      code: 'invalid-result-intake-confirm-request'
    });
    assertResultIntakePreviewMatchesRequest(input);

    const now = new Date().toISOString();
    const validation = validateResultEscrowConfirmInput({
      preview: input.resultIntakePreview,
      planHash: input.planHash,
      now
    });

    if (!validation.ok) {
      throw new GoalEventPlanPreviewError(
        'invalid-result-intake-confirm-request',
        'Result intake confirm request is invalid.',
        {
          reason: validation.errors[0]
        }
      );
    }

    const escrow = buildResultEvidenceEscrow(input.resultIntakePreview, {
      planHash: input.planHash,
      createdAt: now,
      now
    });
    const pendingResult = buildPendingResultFromEscrow(escrow, {
      createdAt: now
    });
    const writeResult = await writeResultIntakeConfirmState({
      stateDir,
      escrow,
      pendingResult
    });

    writeJsonResponse(response, 200, toSerializableResultIntakeContract({
      contractName: 'result-intake-confirmation.v1',
      contractVersion: 1,
      goalId: resolvedGoalId,
      taskId: pendingResult.taskId,
      mode: 'confirm',
      status: 'confirmed',
      written: true,
      planHash: input.planHash,
      resultEvidenceEscrow: escrow,
      pendingResult,
      refs: {
        escrowRef: writeResult.escrowRef,
        pendingResultRef: writeResult.pendingResultRef
      },
      refreshed: {
        supervisor: {
          method: 'GET',
          route: `/api/goals/${encodeURIComponent(resolvedGoalId)}/supervisor`,
          pendingResultProjectionAvailable: true,
          projectionPr: 'PR-3'
        }
      },
      confirmEndpoint: {
        method: 'POST',
        route: `/api/goals/${encodeURIComponent(resolvedGoalId)}/result-intake-confirm`,
        acceptsQueryParameters: false,
        confirmUsesPlanHash: true,
        writes: [
          'resultEvidenceEscrow.v1',
          'pendingResult.v1'
        ]
      },
      safety: {
        writesResultEvidenceEscrow: true,
        writesPendingResult: true,
        writesGoalEventLog: false,
        writesOperationRegistry: false,
        reviewerMutationAvailable: false,
        mainVerificationMutationAvailable: false,
        releaseGateMutationAvailable: false,
        providerExecutionAvailable: false,
        childDispatchAvailable: false,
        gitMutationAvailable: false,
        githubReleaseAutomationAvailable: false
      }
    }));
  } catch (error) {
    if (error instanceof ResultIntakeContractError || error instanceof GoalEventPlanPreviewError) {
      writeApiErrorResponse(response, {
        status: 400,
        code: error.code,
        message: error.message,
        route,
        method,
        safeDetails: safeResultIntakeErrorDetails(error)
      });
      return;
    }

    throw error;
  }
}

async function writeControlledImplementationPlanPreviewResponse({ response, stateDir, request, route, method }) {
  if (request.kind === 'invalid') {
    writeApiErrorResponse(response, {
      status: 400,
      code: 'invalid-controlled-implementation-preview-request',
      message: 'Controlled implementation plan preview request is invalid.',
      route,
      method,
      safeDetails: {
        reason: request.reason
      }
    });
    return;
  }

  let resolvedGoalId;

  try {
    resolvedGoalId = await resolveGoalEventPlanPreviewGoalId({
      stateDir,
      goalId: request.goalId
    });
  } catch (error) {
    if (error instanceof GoalRunbookContextError) {
      writeApiErrorResponse(response, {
        status: 400,
        code: error.code,
        message: error.message,
        route,
        method,
        safeDetails: error.safeDetails
      });
      return;
    }

    throw error;
  }

  if (resolvedGoalId === null) {
    writeApiErrorResponse(response, {
      status: 404,
      code: 'goal-not-found',
      message: 'Goal for controlled implementation plan preview was not found.',
      route,
      method
    });
    return;
  }

  try {
    writeJsonResponse(response, 200, await buildControlledImplementationPlanPreview({
      stateDir,
      goalId: resolvedGoalId,
      searchParams: request.searchParams
    }));
  } catch (error) {
    if (
      error instanceof GoalEventPlanPreviewError ||
      error instanceof GoalRunbookContextError ||
      error instanceof GoalPromptPackError
    ) {
      writeApiErrorResponse(response, {
        status: 400,
        code: error.code,
        message: error.message,
        route,
        method,
        safeDetails: error.safeDetails
      });
      return;
    }

    throw error;
  }
}

async function writeControlledImplementationRunConfirmResponse({
  requestMessage,
  response,
  stateDir,
  cwd,
  env,
  runner,
  mcasRunner,
  request,
  route,
  method
}) {
  if (request.kind === 'invalid') {
    writeApiErrorResponse(response, {
      status: 400,
      code: 'invalid-controlled-implementation-confirm-request',
      message: 'Controlled implementation run confirm request is invalid.',
      route,
      method,
      safeDetails: {
        reason: request.reason
      }
    });
    return;
  }

  let resolvedGoalId;

  try {
    resolvedGoalId = await resolveGoalEventPlanPreviewGoalId({
      stateDir,
      goalId: request.goalId
    });
  } catch (error) {
    if (error instanceof GoalRunbookContextError) {
      writeApiErrorResponse(response, {
        status: 400,
        code: error.code,
        message: error.message,
        route,
        method,
        safeDetails: error.safeDetails
      });
      return;
    }

    throw error;
  }

  if (resolvedGoalId === null) {
    writeApiErrorResponse(response, {
      status: 404,
      code: 'goal-not-found',
      message: 'Goal for controlled implementation run confirm was not found.',
      route,
      method
    });
    return;
  }

  try {
    const body = await readControlledImplementationRunConfirmRequestBody(requestMessage);
    const confirmation = await confirmControlledImplementationRunPlan({
      stateDir,
      cwd,
      env,
      runner,
      mcasRunner,
      routeGoalId: resolvedGoalId,
      body
    });
    const operationRun = await recordControlledImplementationOperationRunFromConfirmation({
      stateDir,
      goalId: resolvedGoalId,
      confirmation
    });

    writeJsonResponse(response, 200, {
      ...confirmation,
      operationRun,
      refreshed: {
        operations: await readGoalOperationRuns({
          stateDir,
          goalId: resolvedGoalId
        })
      }
    });
  } catch (error) {
    if (
      error instanceof GoalEventPlanPreviewError ||
      error instanceof GoalRunbookContextError ||
      error instanceof GoalPromptPackError ||
      error instanceof GoalOperationRunRegistryError
    ) {
      writeApiErrorResponse(response, {
        status: 400,
        code: error.code,
        message: error.message,
        route,
        method,
        safeDetails: error.safeDetails
      });
      return;
    }

    throw error;
  }
}

async function writeControlledProviderRunnerPreviewResponse({ response, stateDir, cwd, request, route, method }) {
  if (request.kind === 'invalid') {
    writeApiErrorResponse(response, {
      status: 400,
      code: 'invalid-controlled-provider-runner-preview-request',
      message: 'Controlled provider runner preview request is invalid.',
      route,
      method,
      safeDetails: {
        reason: request.reason
      }
    });
    return;
  }

  let resolvedGoalId;

  try {
    resolvedGoalId = await resolveGoalEventPlanPreviewGoalId({
      stateDir,
      goalId: request.goalId
    });
  } catch (error) {
    if (error instanceof GoalRunbookContextError) {
      writeApiErrorResponse(response, {
        status: 400,
        code: error.code,
        message: error.message,
        route,
        method,
        safeDetails: error.safeDetails
      });
      return;
    }

    throw error;
  }

  if (resolvedGoalId === null) {
    if (request.goalId === V41_CONTROLLED_PROVIDER_RUNNER_GOAL_ID) {
      resolvedGoalId = V41_CONTROLLED_PROVIDER_RUNNER_GOAL_ID;
    } else {
      writeApiErrorResponse(response, {
        status: 404,
        code: 'goal-not-found',
        message: 'Goal for controlled provider runner preview was not found.',
        route,
        method
      });
      return;
    }
  }

  try {
    writeJsonResponse(response, 200, buildControlledProviderRunnerPlanPreview(
      buildControlledProviderRunnerRequestFromSearchParams({
        goalId: resolvedGoalId,
        searchParams: request.searchParams
      }),
      {
        workspaceRoot: cwd,
        allowedWorkspaceRoots: [cwd]
      }
    ));
  } catch (error) {
    if (error instanceof ControlledProviderRunnerError || error instanceof GoalEventPlanPreviewError) {
      writeApiErrorResponse(response, {
        status: 400,
        code: 'invalid-controlled-provider-runner-preview-request',
        message: error.message,
        route,
        method,
        safeDetails: error.safeDetails ?? {
          failureLayer: error.failureLayer,
          errors: error.errors
        }
      });
      return;
    }

    throw error;
  }
}

async function writeControlledProviderRunnerConfirmResponse({
  requestMessage,
  response,
  stateDir,
  cwd,
  runner,
  request,
  route,
  method
}) {
  if (request.kind === 'invalid') {
    writeApiErrorResponse(response, {
      status: 400,
      code: 'invalid-controlled-provider-runner-confirm-request',
      message: 'Controlled provider runner confirm request is invalid.',
      route,
      method,
      safeDetails: {
        reason: request.reason
      }
    });
    return;
  }

  let resolvedGoalId;

  try {
    resolvedGoalId = await resolveGoalEventPlanPreviewGoalId({
      stateDir,
      goalId: request.goalId
    });
  } catch (error) {
    if (error instanceof GoalRunbookContextError) {
      writeApiErrorResponse(response, {
        status: 400,
        code: error.code,
        message: error.message,
        route,
        method,
        safeDetails: error.safeDetails
      });
      return;
    }

    throw error;
  }

  if (resolvedGoalId === null) {
    if (request.goalId === V41_CONTROLLED_PROVIDER_RUNNER_GOAL_ID) {
      resolvedGoalId = V41_CONTROLLED_PROVIDER_RUNNER_GOAL_ID;
    } else {
      writeApiErrorResponse(response, {
        status: 404,
        code: 'goal-not-found',
        message: 'Goal for controlled provider runner confirm was not found.',
        route,
        method
      });
      return;
    }
  }

  try {
    const body = await readControlledProviderRunnerConfirmRequestBody(requestMessage);

    if (body.goalId !== resolvedGoalId) {
      throw new ControlledProviderRunnerError(
        'Controlled provider runner confirm requires the same goal context returned by preview.',
        {
          failureLayer: 'schema',
          errors: [`routeGoalId=${resolvedGoalId}`, `bodyGoalId=${body.goalId}`]
        }
      );
    }

    const confirmation = await confirmControlledProviderRunnerPlan(body, {
      stateDir,
      workspaceRoot: cwd,
      allowedWorkspaceRoots: [cwd],
      processRunner: runner
    });

    writeJsonResponse(response, 200, {
      ...confirmation,
      refreshed: {
        operations: await readGoalOperationRuns({
          stateDir,
          goalId: resolvedGoalId
        })
      }
    });
  } catch (error) {
    if (error instanceof ControlledProviderRunnerError || error instanceof GoalOperationRunRegistryError) {
      writeApiErrorResponse(response, {
        status: 400,
        code: 'invalid-controlled-provider-runner-confirm-request',
        message: error.message,
        route,
        method,
        safeDetails: error.safeDetails ?? {
          failureLayer: error.failureLayer,
          errors: error.errors
        }
      });
      return;
    }

    throw error;
  }
}

async function writeWorkerRunPreviewResponse({
  response,
  stateDir,
  env,
  workerRunProviderReadiness,
  request,
  route,
  method
}) {
  if (request.kind === 'invalid') {
    writeApiErrorResponse(response, {
      status: 400,
      code: 'invalid-worker-run-preview-request',
      message: 'Worker run preview request is invalid.',
      route,
      method,
      safeDetails: {
        reason: request.reason
      }
    });
    return;
  }

  const resolvedGoalId = await resolveWorkerRunGoalId({
    stateDir,
    goalId: request.goalId,
    route,
    method,
    response
  });

  if (resolvedGoalId === null) {
    return;
  }

  try {
    writeJsonResponse(response, 200, buildWorkerRunPreviewFromBackend({
      ...buildWorkerRunPreviewRequestFromSearchParams({
        goalId: resolvedGoalId,
        searchParams: request.searchParams
      }),
      providerReadiness: workerRunProviderReadiness ?? buildProviderReadinessProjection({ env })
    }));
  } catch (error) {
    if (error instanceof WorkerRunBackendError || error instanceof GoalEventPlanPreviewError) {
      writeApiErrorResponse(response, {
        status: 400,
        code: 'invalid-worker-run-preview-request',
        message: error.message,
        route,
        method,
        safeDetails: error.safeDetails
      });
      return;
    }

    throw error;
  }
}

async function writeWorkerRunConfirmResponse({
  requestMessage,
  response,
  stateDir,
  env,
  workerRunProviderReadiness,
  workerRunExecutor,
  request,
  route,
  method
}) {
  if (request.kind === 'invalid') {
    writeApiErrorResponse(response, {
      status: 400,
      code: 'invalid-worker-run-confirm-request',
      message: 'Worker run confirm request is invalid.',
      route,
      method,
      safeDetails: {
        reason: request.reason
      }
    });
    return;
  }

  const resolvedGoalId = await resolveWorkerRunGoalId({
    stateDir,
    goalId: request.goalId,
    route,
    method,
    response
  });

  if (resolvedGoalId === null) {
    return;
  }

  try {
    const body = await readWorkerRunConfirmRequestBody(requestMessage);
    const preview = buildWorkerRunPreviewFromBackend({
      goalId: resolvedGoalId,
      taskId: requiredWorkerRunBodyString(body, 'taskId'),
      providerReadiness: workerRunProviderReadiness ?? buildProviderReadinessProjection({ env })
    });
    const confirmation = await confirmWorkerRunPreview({
      preview,
      input: body,
      ...(typeof workerRunExecutor === 'function' ? { executeWorker: workerRunExecutor } : {})
    });
    const operationRun = await recordWorkerRunOperationRunFromConfirmation({
      stateDir,
      goalId: resolvedGoalId,
      confirmation
    });

    writeJsonResponse(response, 200, {
      ...confirmation,
      operationRun,
      refreshed: {
        operations: await readGoalOperationRuns({
          stateDir,
          goalId: resolvedGoalId
        })
      }
    });
  } catch (error) {
    if (
      error instanceof WorkerRunBackendError ||
      error instanceof GoalEventPlanPreviewError ||
      error instanceof GoalOperationRunRegistryError
    ) {
      writeApiErrorResponse(response, {
        status: 400,
        code: 'invalid-worker-run-confirm-request',
        message: error.message,
        route,
        method,
        safeDetails: error.safeDetails
      });
      return;
    }

    throw error;
  }
}

async function resolveWorkerRunGoalId({
  stateDir,
  goalId,
  route,
  method,
  response
}) {
  let resolvedGoalId;

  try {
    resolvedGoalId = await resolveGoalEventPlanPreviewGoalId({
      stateDir,
      goalId
    });
  } catch (error) {
    if (error instanceof GoalRunbookContextError) {
      writeApiErrorResponse(response, {
        status: 400,
        code: error.code,
        message: error.message,
        route,
        method,
        safeDetails: error.safeDetails
      });
      return null;
    }

    throw error;
  }

  if (resolvedGoalId === null) {
    if (goalId === V66_WORKER_RUN_GOAL_ID) {
      return V66_WORKER_RUN_GOAL_ID;
    }

    writeApiErrorResponse(response, {
      status: 404,
      code: 'goal-not-found',
      message: 'Goal for worker run preview/confirm was not found.',
      route,
      method
    });
    return null;
  }

  return resolvedGoalId;
}

async function writeControlledVerificationRunConfirmResponse({
  requestMessage,
  response,
  stateDir,
  cwd,
  env,
  runner,
  request,
  route,
  method
}) {
  if (request.kind === 'invalid') {
    writeApiErrorResponse(response, {
      status: 400,
      code: 'invalid-controlled-verification-confirm-request',
      message: 'Controlled verification run confirm request is invalid.',
      route,
      method,
      safeDetails: {
        reason: request.reason
      }
    });
    return;
  }

  let resolvedGoalId;

  try {
    resolvedGoalId = await resolveGoalEventPlanPreviewGoalId({
      stateDir,
      goalId: request.goalId
    });
  } catch (error) {
    if (error instanceof GoalRunbookContextError) {
      writeApiErrorResponse(response, {
        status: 400,
        code: error.code,
        message: error.message,
        route,
        method,
        safeDetails: error.safeDetails
      });
      return;
    }

    throw error;
  }

  if (resolvedGoalId === null) {
    writeApiErrorResponse(response, {
      status: 404,
      code: 'goal-not-found',
      message: 'Goal for controlled verification run confirm was not found.',
      route,
      method
    });
    return;
  }

  try {
    const body = await readControlledVerificationRunConfirmRequestBody(requestMessage);
    const confirmation = await confirmControlledVerificationRunPlan({
      stateDir,
      cwd,
      env,
      runner,
      routeGoalId: resolvedGoalId,
      body
    });

    writeJsonResponse(response, 200, {
      ...confirmation,
      refreshed: {
        operations: await readGoalOperationRuns({
          stateDir,
          goalId: resolvedGoalId
        })
      }
    });
  } catch (error) {
    if (
      error instanceof GoalEventPlanPreviewError ||
      error instanceof GoalRunbookContextError ||
      error instanceof GoalOperationRunRegistryError
    ) {
      writeApiErrorResponse(response, {
        status: 400,
        code: error.code,
        message: error.message,
        route,
        method,
        safeDetails: error.safeDetails
      });
      return;
    }

    throw error;
  }
}

async function writeControlledAdoptionPlanFreezeResponse({
  requestMessage,
  response,
  stateDir,
  runner,
  request,
  route,
  method
}) {
  if (request.kind === 'invalid') {
    writeApiErrorResponse(response, {
      status: 400,
      code: 'invalid-controlled-adoption-freeze-request',
      message: 'Controlled adoption plan freeze request is invalid.',
      route,
      method,
      safeDetails: {
        reason: request.reason
      }
    });
    return;
  }

  let resolvedGoalId;

  try {
    resolvedGoalId = await resolveGoalEventPlanPreviewGoalId({
      stateDir,
      goalId: request.goalId
    });
  } catch (error) {
    if (error instanceof GoalRunbookContextError) {
      writeApiErrorResponse(response, {
        status: 400,
        code: error.code,
        message: error.message,
        route,
        method,
        safeDetails: error.safeDetails
      });
      return;
    }

    throw error;
  }

  if (resolvedGoalId === null) {
    writeApiErrorResponse(response, {
      status: 404,
      code: 'goal-not-found',
      message: 'Goal for controlled adoption plan freeze was not found.',
      route,
      method
    });
    return;
  }

  try {
    const body = await readControlledAdoptionPlanFreezeRequestBody(requestMessage);
    const freeze = await confirmControlledAdoptionPlanFreeze({
      stateDir,
      runner,
      routeGoalId: resolvedGoalId,
      body
    });
    const operationRun = await recordControlledAdoptionOperationRunFromFreeze({
      stateDir,
      goalId: resolvedGoalId,
      freeze
    });

    writeJsonResponse(response, 200, {
      ...freeze,
      operationRun,
      refreshed: {
        operations: await readGoalOperationRuns({
          stateDir,
          goalId: resolvedGoalId
        })
      }
    });
  } catch (error) {
    if (
      error instanceof GoalEventPlanPreviewError ||
      error instanceof GoalRunbookContextError ||
      error instanceof GoalOperationRunRegistryError
    ) {
      writeApiErrorResponse(response, {
        status: 400,
        code: error.code,
        message: error.message,
        route,
        method,
        safeDetails: error.safeDetails
      });
      return;
    }

    throw error;
  }
}

async function writeControlledAdoptionConfirmResponse({
  requestMessage,
  response,
  stateDir,
  runner,
  request,
  route,
  method
}) {
  if (request.kind === 'invalid') {
    writeApiErrorResponse(response, {
      status: 400,
      code: 'invalid-controlled-adoption-confirm-request',
      message: 'Controlled adoption confirm request is invalid.',
      route,
      method,
      safeDetails: {
        reason: request.reason
      }
    });
    return;
  }

  let resolvedGoalId;

  try {
    resolvedGoalId = await resolveGoalEventPlanPreviewGoalId({
      stateDir,
      goalId: request.goalId
    });
  } catch (error) {
    if (error instanceof GoalRunbookContextError) {
      writeApiErrorResponse(response, {
        status: 400,
        code: error.code,
        message: error.message,
        route,
        method,
        safeDetails: error.safeDetails
      });
      return;
    }

    throw error;
  }

  if (resolvedGoalId === null) {
    writeApiErrorResponse(response, {
      status: 404,
      code: 'goal-not-found',
      message: 'Goal for controlled adoption confirm was not found.',
      route,
      method
    });
    return;
  }

  try {
    const body = await readControlledAdoptionConfirmRequestBody(requestMessage);
    const confirmation = await confirmControlledAdoptionPlan({
      stateDir,
      runner,
      routeGoalId: resolvedGoalId,
      body
    });
    const operationRun = await recordControlledAdoptionOperationRunFromConfirmation({
      stateDir,
      goalId: resolvedGoalId,
      confirmation
    });

    writeJsonResponse(response, 200, await buildControlledAdoptionConfirmResponse({
      stateDir,
      goalId: resolvedGoalId,
      confirmation,
      operationRun
    }));
  } catch (error) {
    if (
      error instanceof GoalEventPlanPreviewError ||
      error instanceof GoalRunbookContextError ||
      error instanceof GoalOperationRunRegistryError
    ) {
      writeApiErrorResponse(response, {
        status: 400,
        code: error.code,
        message: error.message,
        route,
        method,
        safeDetails: error.safeDetails
      });
      return;
    }

    throw error;
  }
}

async function writeGoalRunbookResponse({ response, stateDir, request, route, method }) {
  if (request.kind === 'invalid') {
    writeInvalidGoalRunbookControlResponse({ response, route, method });
    return;
  }

  try {
    const context = await loadGoalRunbookContext({
      stateDir,
      goalId: request.goalId,
      allowControlledFixtureFallback: true
    });

    if (context === null) {
      writeApiErrorResponse(response, {
        status: 404,
        code: 'goal-runbook-not-found',
        message: 'Goal runbook was not found.',
        route,
        method
      });
      return;
    }

    writeJsonResponse(response, 200, context.runbook);
  } catch (error) {
    if (error instanceof GoalRunbookContextError) {
      writeApiErrorResponse(response, {
        status: 400,
        code: error.code,
        message: error.message,
        route,
        method,
        safeDetails: error.safeDetails
      });
      return;
    }

    throw error;
  }
}

async function writeGoalNextActionResponse({ response, stateDir, request, route, method }) {
  if (request.kind === 'invalid') {
    writeInvalidGoalRunbookControlResponse({ response, route, method });
    return;
  }

  writeJsonResponse(response, 200, await buildGoalNextAction({
    stateDir,
    goalId: request.goalId
  }));
}

async function writeGoalPromptPackResponse({ response, stateDir, request, route, method }) {
  if (request.kind === 'invalid') {
    if (request.reason === 'invalid-route-segment') {
      writeInvalidGoalRunbookControlResponse({ response, route, method });
      return;
    }

    writeInvalidGoalPromptPackRequestResponse({ response, route, method, reason: request.reason });
    return;
  }

  try {
    writeJsonResponse(response, 200, await buildGoalPromptPack({
      stateDir,
      goalId: request.goalId,
      taskId: request.taskId,
      role: request.role,
      next: request.next,
      promptFormat: 'markdown'
    }));
  } catch (error) {
    if (error instanceof GoalPromptPackError) {
      writeApiErrorResponse(response, {
        status: 404,
        code: error.code,
        message: error.message,
        route,
        method,
        safeDetails: error.safeDetails
      });
      return;
    }

    throw error;
  }
}

async function writeGoalCloseoutResponse({ response, stateDir, request, route, method }) {
  if (request.kind === 'invalid') {
    writeInvalidGoalRunbookControlResponse({ response, route, method });
    return;
  }

  try {
    writeJsonResponse(response, 200, await buildGoalCloseoutReport({
      stateDir,
      goalId: request.goalId
    }));
  } catch (error) {
    if (error instanceof GoalCloseoutReportError) {
      writeApiErrorResponse(response, {
        status: 404,
        code: error.code,
        message: error.message,
        route,
        method,
        safeDetails: error.safeDetails
      });
      return;
    }

    throw error;
  }
}

async function writeReleaseBaselineResponse({ response, stateDir, cwd, env, runner, request, route, method }) {
  if (request.kind === 'invalid') {
    writeInvalidGoalRunbookControlResponse({ response, route, method });
    return;
  }

  let resolvedGoalId;

  try {
    resolvedGoalId = await resolveGoalRunbookGoalId({
      stateDir,
      goalId: request.goalId
    });
  } catch (error) {
    if (error instanceof GoalRunbookContextError) {
      writeApiErrorResponse(response, {
        status: 400,
        code: error.code,
        message: error.message,
        route,
        method,
        safeDetails: error.safeDetails
      });
      return;
    }

    throw error;
  }

  if (!isNonEmptyString(resolvedGoalId)) {
    writeApiErrorResponse(response, {
      status: 404,
      code: 'goal-runbook-not-found',
      message: 'Release baseline resolver requires a managed goal runbook.',
      route,
      method
    });
    return;
  }

  try {
    writeJsonResponse(response, 200, await buildReleaseBaselineResolver({
      stateDir,
      goalId: resolvedGoalId,
      cwd,
      env,
      runner
    }));
  } catch (error) {
    if (error instanceof GoalRunbookContextError) {
      writeApiErrorResponse(response, {
        status: 400,
        code: error.code,
        message: error.message,
        route,
        method,
        safeDetails: error.safeDetails
      });
      return;
    }

    throw error;
  }
}

async function buildReleaseBaselineResolver({
  stateDir,
  goalId,
  cwd,
  env,
  runner
}) {
  const [context, nextAction] = await Promise.all([
    loadGoalRunbookContext({
      stateDir,
      goalId,
      allowControlledFixtureFallback: false
    }),
    buildGoalNextAction({
      stateDir,
      goalId
    })
  ]);

  if (context === null) {
    throw new GoalRunbookContextError(
      'goal-runbook-not-found',
      'Release baseline resolver requires a managed goal runbook.',
      { goalId }
    );
  }

  const activeTaskId = nextAction.next?.taskId ?? null;
  const activeTask = isNonEmptyString(activeTaskId)
    ? context.runbook.tasks.find((task) => task?.taskId === activeTaskId) ?? null
    : null;
  const [
    currentBranchResult,
    currentHeadResult,
    mainHeadResult,
    originMainResult,
    worktreeResult
  ] = await Promise.all([
    runReleaseBaselineGitCommand({ runner, cwd, id: 'current-branch', args: ['rev-parse', '--abbrev-ref', 'HEAD'] }),
    runReleaseBaselineGitCommand({ runner, cwd, id: 'current-head', args: ['rev-parse', 'HEAD'] }),
    runReleaseBaselineGitCommand({ runner, cwd, id: 'main-head', args: ['rev-parse', 'main'] }),
    runReleaseBaselineGitCommand({ runner, cwd, id: 'origin-main', args: ['rev-parse', 'origin/main'] }),
    runReleaseBaselineGitCommand({ runner, cwd, id: 'worktree-status', args: ['status', '--porcelain=v1'] })
  ]);
  const currentBranch = releaseBaselineTrimmedStdout(currentBranchResult);
  const currentHead = releaseBaselineTrimmedStdout(currentHeadResult);
  const mainHead = releaseBaselineTrimmedStdout(mainHeadResult);
  const originMain = releaseBaselineTrimmedStdout(originMainResult);
  const dirtyPaths = worktreeResult.exitCode === 0
    ? worktreeResult.stdout.split(/\r?\n/u).map((line) => line.trim()).filter((line) => line !== '')
    : [];
  const worktreeClean = worktreeResult.exitCode === 0 && dirtyPaths.length === 0;
  const blockers = buildReleaseBaselineBlockers({
    currentBranch,
    mainHead,
    originMain,
    worktreeClean,
    commandResults: [
      currentBranchResult,
      currentHeadResult,
      mainHeadResult,
      originMainResult,
      worktreeResult
    ]
  });
  const status = blockers.length === 0 ? 'ready' : 'stopped';

  return {
    contractName: RELEASE_BASELINE_RESOLVER_CONTRACT_NAME,
    contractVersion: RELEASE_BASELINE_RESOLVER_CONTRACT_VERSION,
    generatedAt: new Date().toISOString(),
    goalId,
    taskId: activeTaskId,
    role: nextAction.next?.role ?? null,
    phase: nextAction.next?.phase ?? null,
    reason: nextAction.reason ?? nextAction.next?.reason ?? null,
    status,
    decision: status === 'ready'
      ? 'clean-main-baseline'
      : 'stop-fix-guidance-only',
    releaseBaseline: {
      currentBranch,
      currentHead,
      mainHead,
      originMain,
      worktreeClean,
      dirtyFileCount: dirtyPaths.length,
      dirtyPaths,
      prCiRef: buildReleaseBaselineCiRef(env)
    },
    activeContext: stripUndefined({
      goalTitle: context.runbook.goalTitle,
      baselineTag: context.runbook.baseline?.tag,
      baselineCommit: context.runbook.baseline?.commit,
      baselineEvidenceRef: context.runbook.baseline?.evidenceRef,
      activeTaskTitle: activeTask?.title,
      activeTaskBranch: activeTask?.branch,
      activeTaskExpectedWorkerEvent: activeTask?.expectedEvidence?.worker,
      currentWorkerEvidenceRef: nextAction.evidenceState?.workerEvidenceRef,
      currentReviewEvidenceRef: nextAction.evidenceState?.reviewEvidenceRef,
      currentMainVerificationRef: nextAction.evidenceState?.mainVerificationRef,
      copyOnlyCommands: nextAction.copyOnlyCommands
    }),
    commandOutputs: [
      currentBranchResult,
      currentHeadResult,
      mainHeadResult,
      originMainResult,
      worktreeResult
    ],
    blockers,
    fixGuidance: releaseBaselineFixGuidance(blockers),
    safety: {
      readOnly: true,
      copyOnly: true,
      fixedGitCommandsOnly: true,
      genericShellRunner: false,
      arbitraryCommandInputAccepted: false,
      browserExecutionAvailable: false,
      modelInvocationAvailable: false,
      arbitraryPathReadAvailable: false,
      mergeAvailable: false,
      pushAvailable: false,
      tagAvailable: false,
      releaseReadyDeclared: false,
      dirtyOrNonMainIsFinalReadiness: false
    },
    note: status === 'ready'
      ? 'Release baseline resolver found a clean main checkout with matching main and origin/main refs. Release gates still require explicit evidence and release.ready remains separate.'
      : 'Release baseline resolver is stopped. Dirty, non-main, missing, or mismatched refs are guidance-only and must not be treated as final release readiness.'
  };
}

async function runReleaseBaselineGitCommand({ runner, cwd, id, args }) {
  const command = `git ${args.join(' ')}`;

  try {
    const result = await runner.run({
      executable: 'git',
      args,
      cwd,
      timeoutMs: RELEASE_BASELINE_GIT_TIMEOUT_MS
    });

    return {
      id,
      command,
      exitCode: Number.isInteger(result.exitCode) ? result.exitCode : null,
      status: result.exitCode === 0 ? 'passed' : 'failed',
      stdout: summarizeCommandOutput(result.stdout ?? ''),
      stderr: summarizeCommandOutput(result.stderr ?? '')
    };
  } catch (error) {
    return {
      id,
      command,
      exitCode: null,
      status: 'failed',
      stdout: '',
      stderr: summarizeCommandOutput(error.message)
    };
  }
}

function releaseBaselineTrimmedStdout(result) {
  return result.exitCode === 0 && isNonEmptyString(result.stdout)
    ? result.stdout.trim()
    : null;
}

function buildReleaseBaselineBlockers({
  currentBranch,
  mainHead,
  originMain,
  worktreeClean,
  commandResults
}) {
  const blockers = [];
  const failedCommand = commandResults.find((result) => result.status !== 'passed');

  if (failedCommand !== undefined) {
    blockers.push({
      id: 'git-command-failed',
      status: 'stop',
      detail: `${failedCommand.command} exited ${failedCommand.exitCode ?? 'without exit code'}`
    });
  }

  if (currentBranch !== 'main') {
    blockers.push({
      id: 'non-main-branch',
      status: 'stop',
      detail: `current branch is ${currentBranch ?? 'unknown'}, not main`
    });
  }

  if (worktreeClean !== true) {
    blockers.push({
      id: 'dirty-worktree',
      status: 'stop',
      detail: 'worktree has uncommitted or untracked changes'
    });
  }

  if (isNonEmptyString(mainHead) && isNonEmptyString(originMain) && mainHead !== originMain) {
    blockers.push({
      id: 'main-origin-mismatch',
      status: 'stop',
      detail: 'main HEAD differs from origin/main'
    });
  }

  return blockers;
}

function releaseBaselineFixGuidance(blockers) {
  if (blockers.length === 0) {
    return [
      'Continue with release checklist recording from explicit release gate evidence.',
      'Do not declare release.ready until the release manager records the controlled gate with evidence.'
    ];
  }

  return [
    'Stop release readiness judgment in Workbench for this checkout.',
    'Use terminal Git commands outside Workbench to inspect the branch, update refs, and resolve or set aside dirty files.',
    'Rerun the release baseline resolver after the checkout is clean on main and main matches origin/main.',
    'Do not merge, push, tag, publish, or declare release.ready from this stopped baseline.'
  ];
}

function buildReleaseBaselineCiRef(env) {
  const refName = firstNonEmptyString(env?.GITHUB_HEAD_REF, env?.GITHUB_REF_NAME, env?.CI_COMMIT_REF_NAME, env?.BRANCH_NAME);
  const fullRef = firstNonEmptyString(env?.GITHUB_REF, env?.CI_COMMIT_REF, env?.BUILD_SOURCEBRANCH);
  const sha = firstNonEmptyString(env?.GITHUB_SHA, env?.CI_COMMIT_SHA, env?.BUILD_SOURCEVERSION);

  return {
    state: isNonEmptyString(refName) || isNonEmptyString(fullRef) || isNonEmptyString(sha) ? 'available' : 'missing',
    refName: refName ?? null,
    fullRef: fullRef ?? null,
    sha: sha ?? null,
    source: 'environment'
  };
}

function writeInvalidGoalRunbookControlResponse({ response, route, method }) {
  writeApiErrorResponse(response, {
    status: 400,
    code: 'invalid-goal-ref',
    message: 'Goal runbook control ref is invalid.',
    route,
    method,
    safeDetails: {
      reason: 'invalid-route-segment'
    }
  });
}

function writeInvalidGoalPromptPackRequestResponse({ response, route, method, reason = 'invalid-route-segment' }) {
  writeApiErrorResponse(response, {
    status: 400,
    code: 'invalid-goal-prompt-request',
    message: 'Goal prompt request is invalid.',
    route,
    method,
    safeDetails: {
      reason
    }
  });
}

async function writeRunResponse({ response, stateDir, runId }) {
  const runState = await readRunState({ stateDir, runId });

  if (runState === null) {
    writeJsonResponse(response, 404, {
      status: 'missing',
      runId
    });
    return;
  }

  writeJsonResponse(response, 200, {
    contractVersion: PRODUCT_JSON_CONTRACT.version,
    contractName: 'symphony.console-run',
    run: await decorateConsoleRunWithDiagnostics(compactRunState(runState), { stateDir }),
    rawRunState: runState
  });
}

async function writeTimelineResponse({ response, stateDir, runId }) {
  const runState = await readRunState({ stateDir, runId });

  if (runState === null) {
    writeJsonResponse(response, 404, {
      status: 'missing',
      runId
    });
    return;
  }

  const run = await decorateConsoleRunWithDiagnostics(compactRunState(runState), { stateDir });

  writeJsonResponse(response, 200, {
    contractVersion: PRODUCT_JSON_CONTRACT.version,
    contractName: 'symphony.console-run-timeline',
    runId: run.runId,
    timeline: run.timeline,
    recommendedCommands: run.recommendedCommands
  });
}

async function writeArtifactResponse({ response, stateDir, runId, artifactKind, safePreview = false, route, method }) {
  const runState = await readRunState({ stateDir, runId });

  if (runState === null) {
    if (safePreview) {
      writeApiErrorResponse(response, {
        status: 404,
        code: 'run-not-found',
        message: 'Run was not found.',
        route,
        method
      });
      return;
    }

    writeJsonResponse(response, 404, {
      status: 'missing',
      runId
    });
    return;
  }

  const compact = compactRunState(runState);
  const artifactRef = compact.artifactRefs.find((artifact) => artifact.kind === artifactKind);

  if (artifactRef === undefined) {
    if (safePreview) {
      writeApiErrorResponse(response, {
        status: 404,
        code: 'artifact-ref-not-found',
        message: 'Registered artifact ref was not found.',
        route,
        method
      });
      return;
    }

    writeJsonResponse(response, 404, {
      contractVersion: PRODUCT_JSON_CONTRACT.version,
      contractName: 'symphony.console-artifact',
      status: 'missing',
      runId: compact.runId,
      artifactKind
    });
    return;
  }

  const preview = await buildSafeArtifactPreview({
    runId: compact.runId,
    artifactRef,
    stateDir
  });
  const statusCode = preview.status === 'missing-artifact'
    ? 404
    : preview.status === BLOCKED_ARTIFACT_PREVIEW_STATUS
      ? 403
      : 200;

  if (safePreview) {
    if (statusCode >= 400) {
      writeApiErrorResponse(response, {
        status: statusCode,
        code: preview.status ?? 'artifact-preview-unavailable',
        message: preview.status === BLOCKED_ARTIFACT_PREVIEW_STATUS
          ? 'Artifact preview is blocked by safety policy.'
          : 'Artifact preview is unavailable.',
        route,
        method,
        safeDetails: {
          reason: preview.status ?? 'preview-unavailable'
        }
      });
      return;
    }

    writeJsonResponse(response, statusCode, preview);
    return;
  }

  writeJsonResponse(response, statusCode, {
    contractVersion: PRODUCT_JSON_CONTRACT.version,
    contractName: 'symphony.console-artifact',
    runId: compact.runId,
    ...(preview.status ? { status: preview.status } : {}),
    artifact: buildLegacyConsoleArtifactPreview({
      artifactRef,
      preview
    })
  });
}

async function writeAdoptionInspectResponse({ response, stateDir, adoptionId }) {
  let summary;

  try {
    summary = await buildAdoptionInspectionSummary({
      stateDir,
      adoptionId
    });
  } catch (error) {
    if (/adoption plan not found/u.test(error.message)) {
      writeJsonResponse(response, 404, {
        status: 'missing',
        message: error.message
      });
      return;
    }

    throw error;
  }

  writeJsonResponse(response, 200, buildConsoleAdoptionInspectContract(summary));
}

async function writeHandoffResponse({ response, request, route, method }) {
  if (request.kind === 'index') {
    writeJsonResponse(response, 200, buildGuidedGoalHandoffRefIndex());
    return;
  }

  if (request.kind === 'invalid') {
    writeApiErrorResponse(response, {
      status: 400,
      code: 'invalid-handoff-ref',
      message: 'Handoff ref is invalid.',
      route,
      method,
      safeDetails: {
        reason: 'invalid-route-segment'
      }
    });
    return;
  }

  if (request.kind === 'missing') {
    writeApiErrorResponse(response, {
      status: 404,
      code: 'handoff-ref-not-found',
      message: 'Handoff ref was not found.',
      route,
      method
    });
    return;
  }

  const handoff = await loadGuidedGoalHandoffFixture();

  writeJsonResponse(response, 200, buildGuidedGoalHandoffJson(handoff));
}


function parseArtifactRequestPath(pathname, searchParams = new URLSearchParams()) {
  const previewMatch = /^\/api\/runs\/([^/]+)\/artifacts\/([^/]+)\/preview$/u.exec(pathname);

  if (previewMatch !== null) {
    return parseArtifactRequestMatch({
      match: previewMatch,
      safePreview: true,
      searchParams,
      ref: pathname
    });
  }

  const match = /^\/api\/runs\/([^/]+)\/artifacts\/([^/]+)$/u.exec(pathname);

  if (match === null) {
    return null;
  }

  return parseArtifactRequestMatch({
    match,
    safePreview: false,
    searchParams,
    ref: pathname
  });
}

function parseArtifactRequestMatch({ match, safePreview, searchParams, ref }) {
  if (hasSearchParams(searchParams)) {
    return {
      kind: 'invalid',
      ref
    };
  }

  const decodedRunId = safeDecodePathSegment(match[1]);
  const decodedArtifactKind = safeDecodePathSegment(match[2]);

  if (
    decodedRunId.ok === false ||
    decodedArtifactKind.ok === false ||
    isUnsafeArtifactRouteSegment(decodedRunId.value) ||
    isUnsafeArtifactRouteSegment(decodedArtifactKind.value)
  ) {
    return {
      kind: 'invalid',
      ref
    };
  }

  return {
    kind: 'artifact',
    runId: decodedRunId.value,
    artifactKind: decodedArtifactKind.value,
    safePreview
  };
}

function parseGoalProgressRequestPath(pathname, searchParams = new URLSearchParams()) {
  if (hasSearchParams(searchParams)) {
    if (pathname === '/api/goals/latest/progress' || /^\/api\/goals\/[^/]+\/progress$/u.test(pathname)) {
      return {
        kind: 'invalid',
        goalId: null
      };
    }

    return null;
  }

  if (pathname === '/api/goals/latest/progress') {
    return {
      kind: 'goal-progress',
      goalId: 'latest'
    };
  }

  const match = /^\/api\/goals\/([^/]+)\/progress$/u.exec(pathname);

  if (match === null) {
    return null;
  }

  const decoded = safeDecodePathSegment(match[1]);

  if (decoded.ok === false || isUnsafeGoalRouteSegment(decoded.value)) {
    return {
      kind: 'invalid',
      goalId: null
    };
  }

  return {
    kind: 'goal-progress',
    goalId: decoded.value
  };
}

function parseGoalEventsRequestPath(pathname, searchParams = new URLSearchParams()) {
  if (hasSearchParams(searchParams)) {
    if (pathname === '/api/goals/latest/events' || /^\/api\/goals\/[^/]+\/events$/u.test(pathname)) {
      return {
        kind: 'invalid',
        goalId: null
      };
    }

    return null;
  }

  if (pathname === '/api/goals/latest/events') {
    return {
      kind: 'goal-events',
      goalId: 'latest'
    };
  }

  const match = /^\/api\/goals\/([^/]+)\/events$/u.exec(pathname);

  if (match === null) {
    return null;
  }

  const decoded = safeDecodePathSegment(match[1]);

  if (decoded.ok === false || isUnsafeGoalRouteSegment(decoded.value)) {
    return {
      kind: 'invalid',
      goalId: null
    };
  }

  return {
    kind: 'goal-events',
    goalId: decoded.value
  };
}

function parseGoalOperationsRequestPath(pathname, searchParams = new URLSearchParams()) {
  if (hasSearchParams(searchParams)) {
    if (pathname === '/api/goals/latest/operations' || /^\/api\/goals\/[^/]+\/operations$/u.test(pathname)) {
      return {
        kind: 'invalid',
        goalId: null
      };
    }

    return null;
  }

  if (pathname === '/api/goals/latest/operations') {
    return {
      kind: 'goal-operations',
      goalId: 'latest'
    };
  }

  const match = /^\/api\/goals\/([^/]+)\/operations$/u.exec(pathname);

  if (match === null) {
    return null;
  }

  const decoded = safeDecodePathSegment(match[1]);

  if (decoded.ok === false || isUnsafeGoalRouteSegment(decoded.value)) {
    return {
      kind: 'invalid',
      goalId: null
    };
  }

  return {
    kind: 'goal-operations',
    goalId: decoded.value
  };
}

function parseGoalEventPlanPreviewRequestPath(pathname, searchParams = new URLSearchParams()) {
  const latestPath = '/api/goals/latest/event-plan-preview';

  if (pathname === latestPath) {
    return {
      kind: hasSearchParams(searchParams) ? 'goal-event-plan-preview' : 'invalid',
      goalId: 'latest',
      searchParams,
      reason: 'missing-query-parameters'
    };
  }

  const match = /^\/api\/goals\/([^/]+)\/event-plan-preview$/u.exec(pathname);

  if (match === null) {
    return null;
  }

  const decoded = safeDecodePathSegment(match[1]);

  if (decoded.ok === false || isUnsafeGoalRouteSegment(decoded.value)) {
    return {
      kind: 'invalid',
      goalId: null,
      searchParams,
      reason: 'invalid-route-segment'
    };
  }

  return {
    kind: hasSearchParams(searchParams) ? 'goal-event-plan-preview' : 'invalid',
    goalId: decoded.value,
    searchParams,
    reason: 'missing-query-parameters'
  };
}

function parseGoalEventPlanConfirmRequestPath(pathname, searchParams = new URLSearchParams()) {
  const latestPath = '/api/goals/latest/event-plan-confirm';

  if (pathname === latestPath) {
    return {
      kind: hasSearchParams(searchParams) ? 'invalid' : 'goal-event-plan-confirm',
      goalId: 'latest',
      reason: 'query-parameters-not-supported'
    };
  }

  const match = /^\/api\/goals\/([^/]+)\/event-plan-confirm$/u.exec(pathname);

  if (match === null) {
    return null;
  }

  const decoded = safeDecodePathSegment(match[1]);

  if (decoded.ok === false || isUnsafeGoalRouteSegment(decoded.value)) {
    return {
      kind: 'invalid',
      goalId: null,
      reason: 'invalid-route-segment'
    };
  }

  return {
    kind: hasSearchParams(searchParams) ? 'invalid' : 'goal-event-plan-confirm',
    goalId: decoded.value,
    reason: 'query-parameters-not-supported'
  };
}

function parseResultIntakePreviewRequestPath(pathname, searchParams = new URLSearchParams()) {
  return parseResultIntakeRequestPath({
    pathname,
    searchParams,
    suffix: 'result-intake-preview',
    kind: 'result-intake-preview'
  });
}

function parseResultIntakeConfirmRequestPath(pathname, searchParams = new URLSearchParams()) {
  return parseResultIntakeRequestPath({
    pathname,
    searchParams,
    suffix: 'result-intake-confirm',
    kind: 'result-intake-confirm'
  });
}

function parseResultIntakeRequestPath({
  pathname,
  searchParams = new URLSearchParams(),
  suffix,
  kind
}) {
  const latestPath = `/api/goals/latest/${suffix}`;

  if (pathname === latestPath) {
    return {
      kind: hasSearchParams(searchParams) ? 'invalid' : kind,
      goalId: 'latest',
      reason: 'query-parameters-not-supported'
    };
  }

  const match = new RegExp(`^/api/goals/([^/]+)/${suffix}$`, 'u').exec(pathname);

  if (match === null) {
    return null;
  }

  const decoded = safeDecodePathSegment(match[1]);

  if (decoded.ok === false || isUnsafeGoalRouteSegment(decoded.value)) {
    return {
      kind: 'invalid',
      goalId: null,
      reason: 'invalid-route-segment'
    };
  }

  return {
    kind: hasSearchParams(searchParams) ? 'invalid' : kind,
    goalId: decoded.value,
    reason: 'query-parameters-not-supported'
  };
}

function parseControlledImplementationPlanPreviewRequestPath(pathname, searchParams = new URLSearchParams()) {
  const latestPath = '/api/goals/latest/implementation-plan-preview';

  if (pathname === latestPath) {
    return {
      kind: hasSearchParams(searchParams) ? 'controlled-implementation-plan-preview' : 'invalid',
      goalId: 'latest',
      searchParams,
      reason: 'missing-query-parameters'
    };
  }

  const match = /^\/api\/goals\/([^/]+)\/implementation-plan-preview$/u.exec(pathname);

  if (match === null) {
    return null;
  }

  const decoded = safeDecodePathSegment(match[1]);

  if (decoded.ok === false || isUnsafeGoalRouteSegment(decoded.value)) {
    return {
      kind: 'invalid',
      goalId: null,
      searchParams,
      reason: 'invalid-route-segment'
    };
  }

  return {
    kind: hasSearchParams(searchParams) ? 'controlled-implementation-plan-preview' : 'invalid',
    goalId: decoded.value,
    searchParams,
    reason: 'missing-query-parameters'
  };
}

function parseControlledImplementationRunConfirmRequestPath(pathname, searchParams = new URLSearchParams()) {
  const latestPath = '/api/goals/latest/implementation-run-confirm';

  if (pathname === latestPath) {
    return {
      kind: hasSearchParams(searchParams) ? 'invalid' : 'controlled-implementation-run-confirm',
      goalId: 'latest',
      reason: 'query-parameters-not-supported'
    };
  }

  const match = /^\/api\/goals\/([^/]+)\/implementation-run-confirm$/u.exec(pathname);

  if (match === null) {
    return null;
  }

  const decoded = safeDecodePathSegment(match[1]);

  if (decoded.ok === false || isUnsafeGoalRouteSegment(decoded.value)) {
    return {
      kind: 'invalid',
      goalId: null,
      reason: 'invalid-route-segment'
    };
  }

  return {
    kind: hasSearchParams(searchParams) ? 'invalid' : 'controlled-implementation-run-confirm',
    goalId: decoded.value,
    reason: 'query-parameters-not-supported'
  };
}

function parseControlledProviderRunnerPreviewRequestPath(pathname, searchParams = new URLSearchParams()) {
  const latestPath = '/api/goals/latest/provider-runner-preview';

  if (pathname === latestPath) {
    return {
      kind: hasSearchParams(searchParams) ? 'controlled-provider-runner-preview' : 'invalid',
      goalId: 'latest',
      searchParams,
      reason: 'missing-query-parameters'
    };
  }

  const match = /^\/api\/goals\/([^/]+)\/provider-runner-preview$/u.exec(pathname);

  if (match === null) {
    return null;
  }

  const decoded = safeDecodePathSegment(match[1]);

  if (decoded.ok === false || isUnsafeGoalRouteSegment(decoded.value)) {
    return {
      kind: 'invalid',
      goalId: null,
      searchParams,
      reason: 'invalid-route-segment'
    };
  }

  return {
    kind: hasSearchParams(searchParams) ? 'controlled-provider-runner-preview' : 'invalid',
    goalId: decoded.value,
    searchParams,
    reason: 'missing-query-parameters'
  };
}

function parseControlledProviderRunnerConfirmRequestPath(pathname, searchParams = new URLSearchParams()) {
  const latestPath = '/api/goals/latest/provider-runner-confirm';

  if (pathname === latestPath) {
    return {
      kind: hasSearchParams(searchParams) ? 'invalid' : 'controlled-provider-runner-confirm',
      goalId: 'latest',
      reason: 'query-parameters-not-supported'
    };
  }

  const match = /^\/api\/goals\/([^/]+)\/provider-runner-confirm$/u.exec(pathname);

  if (match === null) {
    return null;
  }

  const decoded = safeDecodePathSegment(match[1]);

  if (decoded.ok === false || isUnsafeGoalRouteSegment(decoded.value)) {
    return {
      kind: 'invalid',
      goalId: null,
      reason: 'invalid-route-segment'
    };
  }

  return {
    kind: hasSearchParams(searchParams) ? 'invalid' : 'controlled-provider-runner-confirm',
    goalId: decoded.value,
    reason: 'query-parameters-not-supported'
  };
}

function parseWorkerRunPreviewRequestPath(pathname, searchParams = new URLSearchParams()) {
  const latestPath = '/api/goals/latest/worker-run-preview';

  if (pathname === latestPath) {
    return {
      kind: hasSearchParams(searchParams) ? 'worker-run-preview' : 'invalid',
      goalId: 'latest',
      searchParams,
      reason: 'missing-query-parameters'
    };
  }

  const match = /^\/api\/goals\/([^/]+)\/worker-run-preview$/u.exec(pathname);

  if (match === null) {
    return null;
  }

  const decoded = safeDecodePathSegment(match[1]);

  if (decoded.ok === false || isUnsafeGoalRouteSegment(decoded.value)) {
    return {
      kind: 'invalid',
      goalId: null,
      searchParams,
      reason: 'invalid-route-segment'
    };
  }

  return {
    kind: hasSearchParams(searchParams) ? 'worker-run-preview' : 'invalid',
    goalId: decoded.value,
    searchParams,
    reason: 'missing-query-parameters'
  };
}

function parseWorkerRunConfirmRequestPath(pathname, searchParams = new URLSearchParams()) {
  const latestPath = '/api/goals/latest/worker-run-confirm';

  if (pathname === latestPath) {
    return {
      kind: hasSearchParams(searchParams) ? 'invalid' : 'worker-run-confirm',
      goalId: 'latest',
      reason: 'query-parameters-not-supported'
    };
  }

  const match = /^\/api\/goals\/([^/]+)\/worker-run-confirm$/u.exec(pathname);

  if (match === null) {
    return null;
  }

  const decoded = safeDecodePathSegment(match[1]);

  if (decoded.ok === false || isUnsafeGoalRouteSegment(decoded.value)) {
    return {
      kind: 'invalid',
      goalId: null,
      reason: 'invalid-route-segment'
    };
  }

  return {
    kind: hasSearchParams(searchParams) ? 'invalid' : 'worker-run-confirm',
    goalId: decoded.value,
    reason: 'query-parameters-not-supported'
  };
}

function parseControlledVerificationRunConfirmRequestPath(pathname, searchParams = new URLSearchParams()) {
  const latestPath = '/api/goals/latest/verification-run-confirm';

  if (pathname === latestPath) {
    return {
      kind: hasSearchParams(searchParams) ? 'invalid' : 'controlled-verification-run-confirm',
      goalId: 'latest',
      reason: 'query-parameters-not-supported'
    };
  }

  const match = /^\/api\/goals\/([^/]+)\/verification-run-confirm$/u.exec(pathname);

  if (match === null) {
    return null;
  }

  const decoded = safeDecodePathSegment(match[1]);

  if (decoded.ok === false || isUnsafeGoalRouteSegment(decoded.value)) {
    return {
      kind: 'invalid',
      goalId: null,
      reason: 'invalid-route-segment'
    };
  }

  return {
    kind: hasSearchParams(searchParams) ? 'invalid' : 'controlled-verification-run-confirm',
    goalId: decoded.value,
    reason: 'query-parameters-not-supported'
  };
}

function parseControlledAdoptionPlanFreezeRequestPath(pathname, searchParams = new URLSearchParams()) {
  const latestPath = '/api/goals/latest/adoption-plan-freeze';

  if (pathname === latestPath) {
    return {
      kind: hasSearchParams(searchParams) ? 'invalid' : 'controlled-adoption-plan-freeze',
      goalId: 'latest',
      reason: 'query-parameters-not-supported'
    };
  }

  const match = /^\/api\/goals\/([^/]+)\/adoption-plan-freeze$/u.exec(pathname);

  if (match === null) {
    return null;
  }

  const decoded = safeDecodePathSegment(match[1]);

  if (decoded.ok === false || isUnsafeGoalRouteSegment(decoded.value)) {
    return {
      kind: 'invalid',
      goalId: null,
      reason: 'invalid-route-segment'
    };
  }

  return {
    kind: hasSearchParams(searchParams) ? 'invalid' : 'controlled-adoption-plan-freeze',
    goalId: decoded.value,
    reason: 'query-parameters-not-supported'
  };
}

function parseControlledAdoptionConfirmRequestPath(pathname, searchParams = new URLSearchParams()) {
  const latestPath = '/api/goals/latest/adoption-confirm';

  if (pathname === latestPath) {
    return {
      kind: hasSearchParams(searchParams) ? 'invalid' : 'controlled-adoption-confirm',
      goalId: 'latest',
      reason: 'query-parameters-not-supported'
    };
  }

  const match = /^\/api\/goals\/([^/]+)\/adoption-confirm$/u.exec(pathname);

  if (match === null) {
    return null;
  }

  const decoded = safeDecodePathSegment(match[1]);

  if (decoded.ok === false || isUnsafeGoalRouteSegment(decoded.value)) {
    return {
      kind: 'invalid',
      goalId: null,
      reason: 'invalid-route-segment'
    };
  }

  return {
    kind: hasSearchParams(searchParams) ? 'invalid' : 'controlled-adoption-confirm',
    goalId: decoded.value,
    reason: 'query-parameters-not-supported'
  };
}

function parseGoalRunbookRequestPath(pathname, searchParams = new URLSearchParams()) {
  return parseGoalRunbookControlRequestPath({
    pathname,
    searchParams,
    suffix: 'runbook'
  });
}

function parseGoalNextActionRequestPath(pathname, searchParams = new URLSearchParams()) {
  return parseGoalRunbookControlRequestPath({
    pathname,
    searchParams,
    suffix: 'next'
  });
}

function parseGoalPromptPackRequestPath(pathname, searchParams = new URLSearchParams()) {
  const latestPath = '/api/goals/latest/prompt';
  const explicitPattern = /^\/api\/goals\/([^/]+)\/prompt$/u;
  const routeMatches = pathname === latestPath || explicitPattern.test(pathname);

  if (!routeMatches) {
    return null;
  }

  const goalId = pathname === latestPath
    ? 'latest'
    : safeGoalIdFromPromptPath(pathname, explicitPattern);

  if (goalId === null) {
    return {
      kind: 'invalid',
      goalId: null,
      reason: 'invalid-route-segment'
    };
  }

  if (!hasSearchParams(searchParams)) {
    return {
      kind: 'goal-prompt-pack',
      goalId,
      next: true,
      taskId: undefined,
      role: undefined
    };
  }

  const unsupported = Array.from(searchParams.keys())
    .filter((key) => key !== 'task' && key !== 'role');

  if (unsupported.length > 0) {
    return {
      kind: 'invalid',
      goalId,
      reason: 'unsupported-query-parameter'
    };
  }

  const taskId = singlePromptPackSearchParam(searchParams, 'task');
  const role = singlePromptPackSearchParam(searchParams, 'role');

  if (taskId === null || role === null) {
    return {
      kind: 'invalid',
      goalId,
      reason: 'missing-or-repeated-query-parameter'
    };
  }

  return {
    kind: 'goal-prompt-pack',
    goalId,
    next: false,
    taskId,
    role
  };
}

function parseGoalCloseoutRequestPath(pathname, searchParams = new URLSearchParams()) {
  return parseGoalRunbookControlRequestPath({
    pathname,
    searchParams,
    suffix: 'closeout'
  });
}

function parseReleaseBaselineRequestPath(pathname, searchParams = new URLSearchParams()) {
  return parseGoalRunbookControlRequestPath({
    pathname,
    searchParams,
    suffix: 'release-baseline'
  });
}

function parseGoalRunbookControlRequestPath({ pathname, searchParams, suffix }) {
  const latestPath = `/api/goals/latest/${suffix}`;
  const explicitPattern = new RegExp(`^/api/goals/([^/]+)/${suffix}$`, 'u');

  if (hasSearchParams(searchParams)) {
    if (pathname === latestPath || explicitPattern.test(pathname)) {
      return {
        kind: 'invalid',
        goalId: null
      };
    }

    return null;
  }

  if (pathname === latestPath) {
    return {
      kind: 'goal-runbook-control',
      goalId: 'latest'
    };
  }

  const match = explicitPattern.exec(pathname);

  if (match === null) {
    return null;
  }

  const decoded = safeDecodePathSegment(match[1]);

  if (decoded.ok === false || isUnsafeGoalRouteSegment(decoded.value)) {
    return {
      kind: 'invalid',
      goalId: null
    };
  }

  return {
    kind: 'goal-runbook-control',
    goalId: decoded.value
  };
}

function safeGoalIdFromPromptPath(pathname, explicitPattern) {
  const match = explicitPattern.exec(pathname);

  if (match === null) {
    return null;
  }

  const decoded = safeDecodePathSegment(match[1]);

  if (decoded.ok === false || isUnsafeGoalRouteSegment(decoded.value)) {
    return null;
  }

  return decoded.value;
}

function singlePromptPackSearchParam(searchParams, key) {
  const values = searchParams.getAll(key);

  if (values.length !== 1) {
    return null;
  }

  const trimmed = values[0].trim();

  return trimmed === '' ? null : trimmed;
}

async function resolveGoalEventsGoal({ stateDir, goalId }) {
  const resolvedGoalId = goalId === undefined || goalId === null || goalId === 'latest'
    ? V18_GOAL_EVENT_JOURNAL_GOAL_ID
    : goalId;

  if (goalId !== undefined && goalId !== null && goalId !== 'latest') {
    const managedContext = await loadGoalRunbookContext({
      stateDir,
      goalId: resolvedGoalId,
      allowControlledFixtureFallback: false
    });

    if (managedContext !== null) {
      return {
        goalId: managedContext.runbook.goalId,
        goalTitle: managedContext.runbook.goalTitle,
        baseline: managedContext.runbook.baseline
      };
    }
  }

  const template = getGoalProgressTemplate(resolvedGoalId);

  if (template === null) {
    return null;
  }

  return {
    goalId: template.goalId,
    goalTitle: template.goalTitle,
    baseline: template.baseline
  };
}

async function resolveGoalEventPlanPreviewGoalId({ stateDir, goalId }) {
  if (goalId === 'latest') {
    return await resolveGoalRunbookGoalId({
      stateDir,
      goalId: 'latest'
    });
  }

  const managedContext = await loadGoalRunbookContext({
    stateDir,
    goalId,
    allowControlledFixtureFallback: false
  });

  if (managedContext !== null) {
    return managedContext.runbook.goalId;
  }

  return getGoalProgressTemplate(goalId) === null ? null : goalId;
}

async function buildGoalEventPlanPreview({ stateDir, goalId, searchParams }) {
  const command = requiredSingleSearchParam(searchParams, 'command');

  switch (command) {
    case 'update':
      assertOnlySearchParams(searchParams, [
        'command',
        'task',
        'event',
        'actor',
        'evidenceRef',
        'statement',
        'branch',
        'commit',
        'blockerId',
        'blockerReason',
        'blockerSeverity'
      ]);

      return buildGoalUpdatePlan({
        stateDir,
        goalId,
        taskId: requiredSingleSearchParam(searchParams, 'task'),
        eventType: requiredSingleSearchParam(searchParams, 'event'),
        actorId: requiredSingleSearchParam(searchParams, 'actor'),
        evidenceRefs: searchParams.getAll('evidenceRef'),
        statement: optionalSingleSearchParam(searchParams, 'statement'),
        branch: optionalSingleSearchParam(searchParams, 'branch'),
        commit: optionalSingleSearchParam(searchParams, 'commit'),
        blocker: buildPreviewBlocker(searchParams)
      });
    case 'review':
      assertOnlySearchParams(searchParams, [
        'command',
        'task',
        'reviewer',
        'verdict',
        'evidenceRef',
        'failedCommand',
        'statement',
        'branch',
        'commit'
      ]);

      return await buildGoalReviewPlan({
        stateDir,
        goalId,
        taskId: requiredSingleSearchParam(searchParams, 'task'),
        reviewerId: requiredSingleSearchParam(searchParams, 'reviewer'),
        verdict: requiredSingleSearchParam(searchParams, 'verdict'),
        evidenceRefs: searchParams.getAll('evidenceRef'),
        failedCommands: searchParams.getAll('failedCommand'),
        statement: optionalSingleSearchParam(searchParams, 'statement'),
        branch: optionalSingleSearchParam(searchParams, 'branch'),
        commit: optionalSingleSearchParam(searchParams, 'commit')
      });
    case 'gate':
      assertOnlySearchParams(searchParams, [
        'command',
        'task',
        'gate',
        'status',
        'verifier',
        'evidenceRef',
        'failedCommand',
        'statement',
        'branch',
        'commit'
      ]);

      return buildGoalGatePlan({
        stateDir,
        goalId,
        taskId: optionalSingleSearchParam(searchParams, 'task'),
        gateName: requiredSingleSearchParam(searchParams, 'gate'),
        status: requiredSingleSearchParam(searchParams, 'status'),
        verifierId: requiredSingleSearchParam(searchParams, 'verifier'),
        evidenceRefs: searchParams.getAll('evidenceRef'),
        failedCommands: searchParams.getAll('failedCommand'),
        statement: optionalSingleSearchParam(searchParams, 'statement'),
        branch: optionalSingleSearchParam(searchParams, 'branch'),
        commit: optionalSingleSearchParam(searchParams, 'commit')
      });
    default:
      throw new GoalEventPlanPreviewError(
        'unsupported-goal-preview-command',
        'Goal event plan preview supports only update, review, or gate dry-runs.',
        { command }
      );
  }
}

async function buildControlledImplementationPlanPreview({ stateDir, goalId, searchParams }) {
  assertOnlyControlledImplementationPreviewSearchParams(searchParams);

  const taskId = requiredSingleSearchParam(searchParams, 'task');
  const [context, nextAction, promptPack, eventLog] = await Promise.all([
    loadGoalRunbookContext({
      stateDir,
      goalId,
      allowControlledFixtureFallback: false
    }),
    buildGoalNextAction({
      stateDir,
      goalId
    }),
    buildGoalPromptPack({
      stateDir,
      goalId,
      taskId,
      role: 'worker',
      promptFormat: 'markdown'
    }),
    readGoalEventJournal({
      stateDir,
      goalId
    })
  ]);

  if (context === null) {
    throw new GoalEventPlanPreviewError(
      'goal-not-found',
      'Controlled implementation plan preview requires a managed goal runbook.',
      { goalId }
    );
  }

  const task = context.runbook.tasks.find((candidate) => candidate?.taskId === taskId);

  if (task === undefined) {
    throw new GoalEventPlanPreviewError(
      'invalid-controlled-implementation-preview-request',
      'Controlled implementation plan preview task must exist in the active goal runbook.',
      { taskId }
    );
  }

  const next = nextAction.next ?? {};

  if (nextAction.status !== 'action-required' || next.taskId !== taskId || next.role !== 'worker' || !['implement', 'implementation', 'revision'].includes(next.phase) || next.blocked === true) {
    throw new GoalEventPlanPreviewError(
      'controlled-implementation-preview-not-eligible',
      'Controlled implementation plan preview requires goal next to assign the same task to the worker implementation role.',
      {
        taskId,
        nextTaskId: next.taskId,
        nextRole: next.role,
        nextPhase: next.phase
      }
    );
  }

  const taskEvents = Array.isArray(eventLog.events)
    ? eventLog.events.filter((event) => event?.taskId === taskId)
    : [];
  const latestBlockerOpened = latestGoalEventOfTypes(taskEvents, ['blocker.opened']);
  const latestBlockerResolved = latestGoalEventOfTypes(taskEvents, ['blocker.resolved']);
  const hasOpenBlocker = latestBlockerOpened !== null && !goalEventRecordIsAfter(latestBlockerResolved, latestBlockerOpened);

  if (hasOpenBlocker) {
    throw new GoalEventPlanPreviewError(
      'controlled-implementation-preview-blocked',
      'Controlled implementation plan preview is blocked by an unresolved explicit blocker event.',
      {
        taskId,
        blockerEventId: latestBlockerOpened.eventId
      }
    );
  }

  const workerPrompt = promptPack.prompts[0] ?? null;
  const allowedPreview = buildControlledImplementationAllowedPreview({
    runbook: context.runbook,
    task,
    nextAction,
    prompt: workerPrompt,
    eventLog
  });
  const planHash = computeControlledImplementationPlanHash(allowedPreview);
  const planId = `controlled-implementation-plan-${safeIdPart(`${goalId}-${taskId}`)}-${shortHash(planHash)}`;

  return {
    contractName: CONTROLLED_IMPLEMENTATION_PLAN_PREVIEW_CONTRACT_NAME,
    contractVersion: CONTROLLED_IMPLEMENTATION_PLAN_PREVIEW_CONTRACT_VERSION,
    goalId,
    taskId,
    mode: 'dry-run',
    status: 'planned',
    planId,
    planHash,
    command: {
      name: 'symphony do',
      semanticCommand: 'do',
      previewOf: 'symphony do --write --json',
      intent: 'work',
      confirmRequired: true
    },
    writeSemantics: {
      safetyMode: 'write',
      writeBoundary: 'isolated-workspace',
      projectWrites: true,
      mainWorktreeWrites: false,
      workspaceWrites: true,
      runtimeWrites: true,
      destructiveWrites: false
    },
    allowedPreview,
    confirm: {
      available: true,
      enabledByTask: 'task-3',
      requiredContext: ['goalId', 'taskId', 'planId', 'planHash'],
      copyOnlyCommand: `symphony do --confirm-plan ${planId} --json`,
      endpoint: {
        route: `/api/goals/${goalId}/implementation-run-confirm`,
        method: 'POST',
        allowedBodyFields: ['goalId', 'taskId', 'planId', 'planHash'],
        requiresSameGoalTaskContext: true,
        confirmUsesPlanHash: true
      }
    },
    previewEndpoint: {
      route: `/api/goals/${goalId}/implementation-plan-preview?task=${encodeURIComponent(taskId)}`,
      method: 'GET',
      allowedQueryFields: ['task'],
      rejectsPromptInput: true,
      rejectsPlanHashInput: true,
      rejectsConfirmInput: true,
      genericShellRunner: false,
      dryRunOnly: true,
      writesInDryRun: false
    },
    safety: {
      readOnly: true,
      copyOnly: true,
      workbenchWriteAvailable: false,
      browserExecutionAvailable: false,
      modelInvocationAvailable: false,
      genericShellRunner: false,
      arbitraryPathReadAvailable: false,
      implementationRunStarted: false,
      mergeAvailable: false,
      pushAvailable: false,
      tagAvailable: false,
      approvalReadinessSource: 'explicit goal events only',
      unsupportedInferenceSources: ['branch', 'filename', 'commit-message', 'prompt-text', 'task-title', 'frontend-heuristic']
    }
  };
}

function buildControlledImplementationAllowedPreview({ runbook, task, nextAction, prompt, eventLog }) {
  const taskEvents = Array.isArray(eventLog?.events)
    ? eventLog.events.filter((event) => event?.taskId === task.taskId)
    : [];
  const evidenceRefs = taskEvents.flatMap((event) => (
    Array.isArray(event?.evidenceRefs)
      ? event.evidenceRefs.map((entry) => stripUndefined({
          kind: entry.kind,
          ref: entry.ref,
          label: entry.label,
          eventId: event.eventId,
          eventType: event.eventType
        }))
      : []
  ));

  return {
    goal: stripUndefined({
      goalId: runbook.goalId,
      goalTitle: runbook.goalTitle,
      baselineTag: runbook.baseline?.tag,
      baselineEvidenceRef: runbook.baseline?.evidenceRef
    }),
    task: stripUndefined({
      taskId: task.taskId,
      title: task.title,
      branch: task.branch,
      roleOrder: Array.isArray(task.roleOrder) ? [...task.roleOrder] : undefined,
      acceptance: Array.isArray(task.acceptance) ? [...task.acceptance] : [],
      expectedWorkerEvidence: task.expectedEvidence?.worker,
      copyOnlyCommands: Array.isArray(task.copyOnlyCommands) ? [...task.copyOnlyCommands] : []
    }),
    nextAction: stripUndefined({
      status: nextAction.status,
      role: nextAction.next?.role,
      phase: nextAction.next?.phase,
      reason: nextAction.reason ?? nextAction.next?.reason,
      blocked: nextAction.next?.blocked === true,
      registerWith: nextAction.afterCompletion?.registerWith,
      allowedEvents: Array.isArray(nextAction.afterCompletion?.allowedEvents)
        ? [...nextAction.afterCompletion.allowedEvents]
        : undefined
    }),
    workerPrompt: stripUndefined({
      available: prompt?.copyOnly === true || isNonEmptyString(prompt?.text),
      format: prompt?.format,
      role: prompt?.role,
      taskId: prompt?.taskId,
      copyOnly: prompt?.copyOnly === true,
      text: prompt?.text
    }),
    evidenceRefs: {
      currentWorkerEvidenceRef: nextAction.evidenceState?.workerEvidenceRef ?? null,
      currentReviewEvidenceRef: nextAction.evidenceState?.reviewEvidenceRef ?? null,
      currentMainVerificationRef: nextAction.evidenceState?.mainVerificationRef ?? null,
      explicitEventEvidenceRefs: evidenceRefs
    }
  };
}

function computeControlledImplementationPlanHash(allowedPreview) {
  return `sha256:${createHash('sha256')
    .update(JSON.stringify(allowedPreview))
    .digest('hex')}`;
}

async function readControlledImplementationRunConfirmRequestBody(request) {
  const contentType = request.headers['content-type'] ?? '';

  if (!String(contentType).toLowerCase().includes('application/json')) {
    throw new GoalEventPlanPreviewError(
      'invalid-controlled-implementation-confirm-request',
      'Controlled implementation run confirm requires application/json.',
      { reason: 'invalid-content-type' }
    );
  }

  let size = 0;
  let content = '';

  for await (const chunk of request) {
    size += chunk.length;

    if (size > GOAL_EVENT_CONFIRM_MAX_BODY_BYTES) {
      throw new GoalEventPlanPreviewError(
        'invalid-controlled-implementation-confirm-request',
        'Controlled implementation run confirm request body is too large.',
        { reason: 'body-too-large' }
      );
    }

    content += chunk.toString('utf8');
  }

  let body;

  try {
    body = JSON.parse(content);
  } catch {
    throw new GoalEventPlanPreviewError(
      'invalid-controlled-implementation-confirm-request',
      'Controlled implementation run confirm requires a valid JSON object.',
      { reason: 'invalid-json' }
    );
  }

  if (!isPlainObject(body)) {
    throw new GoalEventPlanPreviewError(
      'invalid-controlled-implementation-confirm-request',
      'Controlled implementation run confirm requires a valid JSON object.',
      { reason: 'invalid-json-body' }
    );
  }

  return body;
}

async function readControlledProviderRunnerConfirmRequestBody(request) {
  const contentType = request.headers['content-type'] ?? '';

  if (!String(contentType).toLowerCase().includes('application/json')) {
    throw new ControlledProviderRunnerError('Controlled provider runner confirm requires application/json.', {
      failureLayer: 'schema',
      errors: ['invalid-content-type']
    });
  }

  let size = 0;
  let content = '';

  for await (const chunk of request) {
    size += chunk.length;

    if (size > GOAL_EVENT_CONFIRM_MAX_BODY_BYTES) {
      throw new ControlledProviderRunnerError('Controlled provider runner confirm request body is too large.', {
        failureLayer: 'schema',
        errors: ['body-too-large']
      });
    }

    content += chunk.toString('utf8');
  }

  try {
    const body = JSON.parse(content);

    if (!isPlainObject(body)) {
      throw new ControlledProviderRunnerError('Controlled provider runner confirm requires a valid JSON object.', {
        failureLayer: 'schema',
        errors: ['invalid-json-body']
      });
    }

    return body;
  } catch (error) {
    if (error instanceof ControlledProviderRunnerError) {
      throw error;
    }

    throw new ControlledProviderRunnerError('Controlled provider runner confirm requires a valid JSON object.', {
      failureLayer: 'schema',
      errors: ['invalid-json']
    });
  }
}

async function readWorkerRunConfirmRequestBody(request) {
  const contentType = request.headers['content-type'] ?? '';

  if (!String(contentType).toLowerCase().includes('application/json')) {
    throw new WorkerRunBackendError(
      'invalid-worker-run-confirm-request',
      'Worker run confirm requires application/json.',
      { reason: 'invalid-content-type' }
    );
  }

  let size = 0;
  let content = '';

  for await (const chunk of request) {
    size += chunk.length;

    if (size > GOAL_EVENT_CONFIRM_MAX_BODY_BYTES) {
      throw new WorkerRunBackendError(
        'invalid-worker-run-confirm-request',
        'Worker run confirm request body is too large.',
        { reason: 'body-too-large' }
      );
    }

    content += chunk.toString('utf8');
  }

  try {
    const body = JSON.parse(content);

    if (!isPlainObject(body)) {
      throw new WorkerRunBackendError(
        'invalid-worker-run-confirm-request',
        'Worker run confirm requires a valid JSON object.',
        { reason: 'invalid-json-body' }
      );
    }

    return body;
  } catch (error) {
    if (error instanceof WorkerRunBackendError) {
      throw error;
    }

    throw new WorkerRunBackendError(
      'invalid-worker-run-confirm-request',
      'Worker run confirm requires a valid JSON object.',
      { reason: 'invalid-json' }
    );
  }
}

function buildControlledProviderRunnerRequestFromSearchParams({ goalId, searchParams }) {
  assertOnlySearchParams(searchParams, [
    'task',
    'role',
    'provider',
    'mode',
    'promptRef',
    'evidenceRef',
    'handoffRef'
  ]);

  return {
    providerId: requiredSingleSearchParam(searchParams, 'provider'),
    goalId,
    taskId: requiredSingleSearchParam(searchParams, 'task'),
    role: requiredSingleSearchParam(searchParams, 'role'),
    mode: optionalSingleSearchParam(searchParams, 'mode') ?? 'reviewed-prompt',
    promptRef: optionalSingleSearchParam(searchParams, 'promptRef'),
    evidenceRef: optionalSingleSearchParam(searchParams, 'evidenceRef'),
    handoffRef: optionalSingleSearchParam(searchParams, 'handoffRef')
  };
}

function buildWorkerRunPreviewRequestFromSearchParams({ goalId, searchParams }) {
  assertOnlySearchParams(searchParams, ['task']);

  return {
    goalId,
    taskId: requiredSingleSearchParam(searchParams, 'task')
  };
}

function requiredWorkerRunBodyString(body, field) {
  const value = body?.[field];

  if (!isNonEmptyString(value)) {
    throw new WorkerRunBackendError(
      'invalid-worker-run-confirm-request',
      `Worker run confirm requires ${field}.`,
      { field }
    );
  }

  return value;
}

async function confirmControlledImplementationRunPlan({
  stateDir,
  cwd,
  env,
  runner,
  mcasRunner,
  routeGoalId,
  body
}) {
  assertOnlyControlledImplementationConfirmBodyKeys(body);

  const goalId = requiredControlledImplementationConfirmBodyString(body, 'goalId');
  const taskId = requiredControlledImplementationConfirmBodyString(body, 'taskId');
  const planId = requiredControlledImplementationConfirmBodyString(body, 'planId');
  const planHash = requiredControlledImplementationConfirmBodyString(body, 'planHash');

  if (goalId !== routeGoalId) {
    throw new GoalEventPlanPreviewError(
      'controlled-implementation-confirm-context-mismatch',
      'Controlled implementation run confirm requires the same goal context returned by preview.',
      { routeGoalId, bodyGoalId: goalId }
    );
  }

  const searchParams = new URLSearchParams();
  searchParams.set('task', taskId);

  const preview = await buildControlledImplementationPlanPreview({
    stateDir,
    goalId,
    searchParams
  });

  if (preview.planId !== planId || preview.planHash !== planHash) {
    throw new GoalEventPlanPreviewError(
      'controlled-implementation-confirm-plan-mismatch',
      'Controlled implementation run confirm requires the exact plan id and plan hash returned by preview.',
      {
        taskId,
        planIdMatches: preview.planId === planId,
        planHashMatches: preview.planHash === planHash
      }
    );
  }

  await materializeControlledImplementationExecutionPlan({
    stateDir,
    cwd,
    preview
  });

  const confirmedResult = await runExistingConfirmPlanCommand({
    stateDir,
    planId,
    env,
    runner,
    mcasRunner
  });
  const confirmed = confirmedResult.summary;

  return {
    contractName: CONTROLLED_IMPLEMENTATION_RUN_CONFIRMATION_CONTRACT_NAME,
    contractVersion: CONTROLLED_IMPLEMENTATION_RUN_CONFIRMATION_CONTRACT_VERSION,
    goalId,
    taskId,
    mode: 'confirm',
    status: confirmed.status,
    planId,
    planHash,
    command: {
      name: 'symphony do',
      confirmedCommand: 'symphony do --confirm-plan <plan-id> --json',
      semanticCommand: 'do',
      intent: 'work'
    },
    confirmedRun: stripUndefined({
      runId: confirmed.runId,
      plannedRunId: confirmed.plannedRunId,
      executionPlanId: confirmed.executionPlanId,
      status: confirmed.status,
      exitCode: confirmed.exitCode,
      verifierStatus: confirmed.verifierStatus,
      writeBoundary: confirmed.writeBoundary,
      mainWorktreeWrites: confirmed.mainWorktreeWrites,
      workspaceWrites: confirmed.workspaceWrites,
      runtimeWrites: confirmed.runtimeWrites,
      destructiveWrites: confirmed.destructiveWrites,
      sourceWorkspacePath: confirmed.sourceWorkspacePath,
      sourceWorkspaceManifestPath: confirmed.sourceWorkspaceManifestPath,
      evidenceArtifactPath: confirmed.evidenceArtifactPath,
      harnessOutputPath: confirmed.harnessOutputPath,
      taskPacketPath: confirmed.taskPacketPath,
      artifactRefs: Array.isArray(confirmed.artifactRefs) ? confirmed.artifactRefs : buildArtifactRefs(confirmed),
      changedFiles: confirmed.changedFiles,
      failurePhase: confirmed.failurePhase,
      failureMessage: confirmed.failureMessage
    }),
    output: stripUndefined({
      stdout: buildControlledImplementationOutputSummary(confirmed),
      stderr: confirmedResult.stderr,
      exitCode: confirmedResult.exitCode
    }),
    confirmContext: {
      acceptedBodyFields: ['goalId', 'taskId', 'planId', 'planHash'],
      sameGoalTaskContextRequired: true,
      acceptedPlanIdFromPreview: true,
      acceptedPlanHashFromPreview: true
    },
    safety: {
      mappedToExistingConfirmPlan: true,
      genericShellRunner: false,
      arbitraryPathReadAvailable: false,
      browserExecutionAvailable: false,
      modelInvocationAvailable: false,
      mainWorktreeWrites: confirmed.mainWorktreeWrites === true,
      workspaceWrites: confirmed.workspaceWrites === true,
      mergeAvailable: false,
      pushAvailable: false,
      tagAvailable: false,
      selfApprovalAvailable: false,
      readinessInferenceAvailable: false
    }
  };
}

async function recordControlledImplementationOperationRunFromConfirmation({
  stateDir,
  goalId,
  confirmation
}) {
  const confirmedRun = confirmation.confirmedRun ?? {};
  const status = confirmedRun.status === 'failed' || confirmedRun.verifierStatus === 'failed'
    ? 'failed'
    : 'confirmed';

  return await recordGoalOperationRun({
    stateDir,
    operationId: confirmation.operationId,
    goalId,
    taskId: confirmation.taskId,
    role: 'worker',
    commandKind: 'implementation',
    commandName: 'symphony do --confirm-plan',
    status,
    planHash: confirmation.planHash,
    source: 'workbench.implementation-run-confirm',
    output: confirmation.output,
    runResult: confirmedRun,
    artifactRefs: Array.isArray(confirmedRun.artifactRefs)
      ? confirmedRun.artifactRefs
      : buildArtifactRefs(confirmedRun),
    verifierSummary: buildControlledImplementationVerifierSummary(confirmedRun),
    failureReason: controlledImplementationFailureReason(confirmedRun)
  });
}

function buildControlledImplementationVerifierSummary(run) {
  const verifierStatus = run?.verifierStatus;
  const runStatus = run?.status;
  const failureReason = controlledImplementationFailureReason(run);

  return stripUndefined({
    status: verifierStatus ?? runStatus,
    runStatus,
    passed: verifierStatus === 'passed' || runStatus === 'passed',
    sourceRunId: run?.runId,
    executionPlanId: run?.executionPlanId,
    changedFileCount: Array.isArray(run?.changedFiles) ? run.changedFiles.length : undefined,
    artifactCount: Array.isArray(run?.artifactRefs) ? run.artifactRefs.length : undefined,
    failureReason
  });
}

function buildControlledImplementationOutputSummary(run) {
  const lines = [
    `runId=${run?.runId ?? 'unknown'}`,
    `status=${run?.status ?? 'unknown'}`,
    `verifierStatus=${run?.verifierStatus ?? 'unknown'}`,
    `exitCode=${run?.exitCode ?? 'unknown'}`,
    `executionPlanId=${run?.executionPlanId ?? 'unknown'}`,
    `writeBoundary=${run?.writeBoundary ?? 'unknown'}`,
    `mainWorktreeWrites=${String(run?.mainWorktreeWrites === true)}`,
    `workspaceWrites=${String(run?.workspaceWrites === true)}`,
    `artifactRefs=${Array.isArray(run?.artifactRefs) ? run.artifactRefs.length : buildArtifactRefs(run).length}`,
    `changedFiles=${Array.isArray(run?.changedFiles) ? run.changedFiles.length : 0}`
  ];
  const failureReason = controlledImplementationFailureReason(run);

  if (failureReason !== null) {
    lines.push(`failureReason=${failureReason}`);
  }

  return lines.join('\n');
}

function controlledImplementationFailureReason(run) {
  const message = firstNonEmptyString(run?.failureMessage, run?.reason);
  const phase = firstNonEmptyString(run?.failurePhase);

  if (!isNonEmptyString(message) && !isNonEmptyString(phase)) {
    return null;
  }

  return [phase, message].filter(isNonEmptyString).join(': ');
}

async function materializeControlledImplementationExecutionPlan({ stateDir, cwd, preview }) {
  const projectRoot = resolve(cwd);
  const workDir = 'tmp/symphony-work';
  const now = new Date().toISOString();
  const contextArtifactPath = join(stateDir, 'controlled-implementation-context', `${preview.planId}-project-context.json`);
  const summaryArtifactPath = join(stateDir, 'controlled-implementation-context', `${preview.planId}-intake-summary.json`);
  const projectFingerprint = await buildProjectFingerprint({
    projectDir: projectRoot,
    ignoredPaths: [stateDir, workDir]
  });
  const verificationCommands = Array.isArray(preview.allowedPreview?.task?.copyOnlyCommands)
    ? preview.allowedPreview.task.copyOnlyCommands.filter((command) => typeof command === 'string' && command.trim() !== '')
    : [];
  const prompt = preview.allowedPreview?.workerPrompt?.text ?? preview.allowedPreview?.task?.title ?? `${preview.goalId} ${preview.taskId}`;

  await atomicWriteJson(contextArtifactPath, {
    version: '1',
    kind: 'project-context',
    schema: 'project-context.v1',
    generatedAt: now,
    project: {
      root: projectRoot,
      name: safeIdPart(preview.goalId),
      git: {
        isRepository: true
      }
    },
    inventory: {
      docs: [],
      configFiles: [],
      ciFiles: [],
      sourceRoots: [],
      ignoredRoots: [stateDir, workDir]
    },
    documentation: {
      readme: {
        path: 'README.md',
        present: false
      },
      agents: [],
      adrCount: 0,
      planCount: 0,
      hasContributing: false,
      hasTroubleshooting: false,
      hasLicense: false
    },
    runtime: {
      packageManager: 'pnpm',
      scripts: {},
      bins: ['symphony'],
      verificationCommands
    },
    ci: {
      providers: [],
      workflows: []
    },
    constraints: [{
      id: 'controlled-implementation-plan-context',
      source: 'controlled-implementation-plan-preview.v1',
      path: `/api/goals/${preview.goalId}/implementation-plan-preview?task=${encodeURIComponent(preview.taskId)}`,
      line: 1,
      text: 'Execute only the frozen active goal/task implementation plan in an isolated workspace.',
      confidence: 'high'
    }],
    risks: [],
    openQuestions: [],
    workflowHints: {
      recommendedMode: 'writer-reviewer',
      recommendedAdapter: 'codex',
      verificationCommands: verificationCommands.length > 0 ? verificationCommands : ['pnpm test'],
      writeSetHints: [],
      preflightSummary: 'Controlled implementation confirm from Workbench task context.'
    },
    provider: {
      name: 'workbench-controlled-implementation',
      status: 'completed',
      modelInvocation: false
    }
  });

  await atomicWriteJson(summaryArtifactPath, {
    version: '1',
    kind: 'intake-summary',
    schema: 'intake-summary.v1',
    status: 'completed',
    riskCounts: {
      high: 0,
      medium: 0,
      low: 0
    },
    openQuestionCount: 0,
    recommendedWorkflow: 'writer-reviewer',
    verificationCommands: verificationCommands.length > 0 ? verificationCommands : ['pnpm test'],
    modelInvocation: false,
    providerStatus: 'completed'
  });

  await writeExecutionPlan({
    stateDir,
    plan: {
      version: '1',
      kind: 'symphony.execution-plan',
      contractVersion: '1',
      contractName: 'symphony.execution-plan',
      planId: preview.planId,
      command: 'symphony do',
      intent: 'work',
      semanticCommand: 'do',
      prompt,
      pipeline: ['scan-if-needed', 'do'],
      routeDecision: {
        intent: 'work',
        safetyMode: 'write',
        adapter: 'codex',
        requiresGate: null,
        requiresConfirmation: true,
        pipeline: ['scan-if-needed', 'do'],
        matchedSignals: ['workbench-controlled-implementation-confirm']
      },
      matchedSignals: ['workbench-controlled-implementation-confirm'],
      safetyMode: 'write',
      projectWrites: true,
      mainWorktreeWrites: false,
      workspaceWrites: true,
      runtimeWrites: true,
      externalCalls: false,
      destructiveWrites: false,
      writeBoundary: 'isolated-workspace',
      projectRoot,
      projectFingerprint,
      contextReused: false,
      contextArtifactPath,
      summaryArtifactPath,
      workflowMode: 'writer-reviewer',
      adapter: 'codex',
      executionMode: 'dry-run',
      workDir,
      requiresGate: null,
      confirmationCommand: `symphony do --confirm-plan ${preview.planId} --json`,
      controlledImplementationContext: {
        goalId: preview.goalId,
        taskId: preview.taskId,
        planHash: preview.planHash,
        previewContract: CONTROLLED_IMPLEMENTATION_PLAN_PREVIEW_CONTRACT_NAME
      },
      createdAt: now
    }
  });
}

async function runExistingConfirmPlanCommand({ stateDir, planId, env, runner, mcasRunner }) {
  const { runSymphonyCli } = await import('../../scripts/symphony.js');
  const stdout = createConsoleBuffer();
  const stderr = createConsoleBuffer();
  const exitCode = await runSymphonyCli({
    argv: ['do', '--state-dir', stateDir, '--confirm-plan', planId, '--json'],
    stdout,
    stderr,
    runner,
    env,
    ...(typeof mcasRunner === 'function' ? { mcasRunner } : {})
  });

  let summary;

  try {
    summary = JSON.parse(stdout.text());
  } catch {
    throw new GoalEventPlanPreviewError(
      'controlled-implementation-confirm-failed',
      'Existing symphony do confirm-plan command did not return JSON.',
      { exitCode }
    );
  }

  if (exitCode !== 0 && summary?.runId === undefined) {
    throw new GoalEventPlanPreviewError(
      'controlled-implementation-confirm-failed',
      'Existing symphony do confirm-plan command failed before a controlled run was confirmed.',
      { exitCode }
    );
  }

  return {
    summary,
    stdout: stdout.text(),
    stderr: stderr.text(),
    exitCode
  };
}

async function readControlledVerificationRunConfirmRequestBody(request) {
  const contentType = request.headers['content-type'] ?? '';

  if (!String(contentType).toLowerCase().includes('application/json')) {
    throw new GoalEventPlanPreviewError(
      'invalid-controlled-verification-confirm-request',
      'Controlled verification run confirm requires application/json.',
      { reason: 'invalid-content-type' }
    );
  }

  let size = 0;
  let text = '';

  for await (const chunk of request) {
    size += chunk.length;

    if (size > GOAL_EVENT_CONFIRM_MAX_BODY_BYTES) {
      throw new GoalEventPlanPreviewError(
        'invalid-controlled-verification-confirm-request',
        'Controlled verification run confirm request body is too large.',
        { reason: 'body-too-large' }
      );
    }

    text += chunk.toString('utf8');
  }

  let body;

  try {
    body = JSON.parse(text);
  } catch {
    throw new GoalEventPlanPreviewError(
      'invalid-controlled-verification-confirm-request',
      'Controlled verification run confirm requires a valid JSON object.',
      { reason: 'invalid-json' }
    );
  }

  if (!isPlainObject(body)) {
    throw new GoalEventPlanPreviewError(
      'invalid-controlled-verification-confirm-request',
      'Controlled verification run confirm requires a valid JSON object.',
      { reason: 'invalid-json-body' }
    );
  }

  return body;
}

async function confirmControlledVerificationRunPlan({
  stateDir,
  cwd,
  env,
  runner,
  routeGoalId,
  body
}) {
  assertOnlyControlledVerificationConfirmBodyKeys(body);

  const goalId = requiredControlledVerificationConfirmBodyString(body, 'goalId');
  const taskId = requiredControlledVerificationConfirmBodyString(body, 'taskId');
  const suiteId = requiredControlledVerificationConfirmBodyString(body, 'suiteId');

  if (goalId !== routeGoalId) {
    throw new GoalEventPlanPreviewError(
      'controlled-verification-confirm-context-mismatch',
      'Controlled verification run confirm requires the same goal context shown in Workbench.',
      { routeGoalId, bodyGoalId: goalId }
    );
  }

  if (suiteId !== CONTROLLED_VERIFICATION_SUITE_ID) {
    throw new GoalEventPlanPreviewError(
      'invalid-controlled-verification-confirm-request',
      'Controlled verification run confirm accepts only the fixed main verification suite.',
      { suiteId }
    );
  }

  const suite = await buildControlledVerificationCommandSuite({
    stateDir,
    goalId,
    taskId
  });
  const operationRun = await recordGoalOperationRun({
    stateDir,
    operationId: suite.operationId,
    goalId,
    taskId,
    role: 'main-verifier',
    commandKind: 'verification',
    commandName: 'controlled main verification suite',
    status: 'running',
    planHash: suite.planHash,
    source: 'workbench.verification-run-confirm',
    output: {
      stdout: `status=running\nsuiteId=${suite.suiteId}\ncommandCount=${suite.commands.length}`,
      stderr: '',
      exitCode: null
    },
    runResult: {
      runId: suite.runId,
      suiteId: suite.suiteId,
      status: 'running',
      commandCount: suite.commands.length,
      gatePassed: false
    },
    artifactRefs: controlledVerificationArtifactRefs({ goalId, operationId: suite.operationId })
  });
  const completed = await runControlledVerificationCommandSuite({
    cwd,
    env,
    runner,
    suite: {
      ...suite,
      operationId: operationRun.operationId
    }
  });
  const completedOperationRun = await recordControlledVerificationOperationRunFromConfirmation({
    stateDir,
    goalId,
    confirmation: completed
  });

  return {
    ...completed,
    operationRun: completedOperationRun
  };
}

async function buildControlledVerificationCommandSuite({ stateDir, goalId, taskId }) {
  const context = await loadGoalRunbookContext({
    stateDir,
    goalId,
    allowControlledFixtureFallback: false
  });

  if (context === null) {
    throw new GoalEventPlanPreviewError(
      'goal-not-found',
      'Controlled verification run confirm requires a managed goal runbook.',
      { goalId }
    );
  }

  const task = context.runbook.tasks.find((candidate) => candidate?.taskId === taskId);

  if (task === undefined) {
    throw new GoalEventPlanPreviewError(
      'invalid-controlled-verification-confirm-request',
      'Controlled verification run confirm task must exist in the active goal runbook.',
      { taskId }
    );
  }

  const commands = controlledVerificationCommandsForTask({
    goalId,
    copyOnlyCommands: task.copyOnlyCommands
  });
  const planHash = computeControlledVerificationPlanHash({
    goalId,
    taskId,
    suiteId: CONTROLLED_VERIFICATION_SUITE_ID,
    commands
  });
  const operationId = `op_${shortHash({
    goalId,
    taskId,
    suiteId: CONTROLLED_VERIFICATION_SUITE_ID,
    planHash
  })}`;

  return {
    goalId,
    taskId,
    suiteId: CONTROLLED_VERIFICATION_SUITE_ID,
    runId: `verification-${safeIdPart(`${goalId}-${taskId}`)}-${shortHash(planHash)}`,
    operationId,
    planHash,
    commands
  };
}

function controlledVerificationCommandsForTask({ goalId, copyOnlyCommands }) {
  const fixedCommands = [
    'pnpm check',
    'pnpm test',
    'pnpm workbench:build',
    'git diff --check'
  ];
  const taskCommands = Array.isArray(copyOnlyCommands)
    ? copyOnlyCommands.filter((command) => typeof command === 'string' && command.trim() !== '')
    : [];
  const controlledContextCommands = taskCommands.filter((command) => (
    command === `pnpm --silent symphony goal-status --goal ${goalId} --json` ||
    command === `pnpm --silent symphony goal next --goal ${goalId} --json`
  ));

  return [...new Set([...fixedCommands, ...controlledContextCommands])]
    .map((command, index) => ({
      id: `verification-command-${index + 1}`,
      command,
      ...controlledVerificationInvocation(command, goalId)
    }));
}

function controlledVerificationInvocation(command, goalId) {
  switch (command) {
    case 'pnpm check':
      return { executable: 'pnpm', args: ['check'] };
    case 'pnpm test':
      return { executable: 'pnpm', args: ['test'] };
    case 'pnpm workbench:build':
      return { executable: 'pnpm', args: ['workbench:build'] };
    case 'git diff --check':
      return { executable: 'git', args: ['diff', '--check'] };
    case `pnpm --silent symphony goal-status --goal ${goalId} --json`:
      return { executable: 'pnpm', args: ['--silent', 'symphony', 'goal-status', '--goal', goalId, '--json'] };
    case `pnpm --silent symphony goal next --goal ${goalId} --json`:
      return { executable: 'pnpm', args: ['--silent', 'symphony', 'goal', 'next', '--goal', goalId, '--json'] };
    default:
      throw new GoalEventPlanPreviewError(
        'invalid-controlled-verification-command',
        'Controlled verification suite contains a command outside the fixed allowlist.',
        { command }
      );
  }
}

function computeControlledVerificationPlanHash(plan) {
  return `sha256:${createHash('sha256')
    .update(JSON.stringify(plan))
    .digest('hex')}`;
}

async function runControlledVerificationCommandSuite({
  cwd,
  env,
  runner,
  suite
}) {
  const commandResults = [];

  for (const command of suite.commands) {
    const startedAt = new Date().toISOString();
    let result;

    try {
      result = await runner.run({
        executable: command.executable,
        args: command.args,
        cwd,
        env,
        timeoutMs: CONTROLLED_VERIFICATION_COMMAND_TIMEOUT_MS
      });
    } catch (error) {
      result = {
        exitCode: null,
        stdout: '',
        stderr: error.message,
        durationMs: null,
        error: {
          code: error.code,
          message: error.message
        }
      };
    }

    const completedAt = new Date().toISOString();
    const exitCode = Number.isInteger(result.exitCode) ? result.exitCode : null;
    const status = exitCode === 0 ? 'passed' : 'failed';

    commandResults.push(stripUndefined({
      id: command.id,
      command: command.command,
      executable: command.executable,
      args: command.args,
      status,
      exitCode,
      signal: result.signal,
      durationMs: result.durationMs,
      timedOut: result.timedOut === true,
      stalled: result.stalled === true,
      stdoutSummary: summarizeCommandOutput(result.stdout ?? ''),
      stderrSummary: summarizeCommandOutput(result.stderr ?? ''),
      startedAt,
      completedAt
    }));
  }

  const failedCommands = commandResults.filter((result) => result.status !== 'passed');
  const status = failedCommands.length === 0 ? 'passed' : 'failed';
  const exitCode = failedCommands.length === 0
    ? 0
    : failedCommands.find((result) => Number.isInteger(result.exitCode))?.exitCode ?? 1;
  const runResult = {
    runId: suite.runId,
    operationId: suite.operationId,
    suiteId: suite.suiteId,
    status,
    exitCode,
    commandCount: commandResults.length,
    failedCommandCount: failedCommands.length,
    gatePassed: false,
    commandResults
  };

  return {
    contractName: CONTROLLED_VERIFICATION_RUN_CONFIRMATION_CONTRACT_NAME,
    contractVersion: CONTROLLED_VERIFICATION_RUN_CONFIRMATION_CONTRACT_VERSION,
    goalId: suite.goalId,
    taskId: suite.taskId,
    mode: 'confirm',
    status,
    suiteId: suite.suiteId,
    operationId: suite.operationId,
    planHash: suite.planHash,
    command: {
      name: 'controlled main verification suite',
      semanticCommand: 'verification',
      intent: 'main-verification-command-suite'
    },
    commandResults,
    runResult,
    output: {
      stdout: buildControlledVerificationOutputSummary(commandResults),
      stderr: buildControlledVerificationErrorSummary(commandResults),
      exitCode
    },
    artifactRefs: controlledVerificationArtifactRefs({
      goalId: suite.goalId,
      operationId: suite.operationId
    }),
    safety: {
      fixedCommandSuite: true,
      genericShellRunner: false,
      arbitraryCommandInputAccepted: false,
      browserExecutionAvailable: false,
      modelInvocationAvailable: false,
      mergeAvailable: false,
      pushAvailable: false,
      tagAvailable: false,
      selfApprovalAvailable: false,
      registersGates: false,
      successImpliesGatePassed: false
    }
  };
}

async function recordControlledVerificationOperationRunFromConfirmation({
  stateDir,
  goalId,
  confirmation
}) {
  return await recordGoalOperationRun({
    stateDir,
    operationId: confirmation.operationId,
    goalId,
    taskId: confirmation.taskId,
    role: 'main-verifier',
    commandKind: 'verification',
    commandName: 'controlled main verification suite',
    status: confirmation.status === 'passed' ? 'confirmed' : 'failed',
    planHash: confirmation.planHash,
    source: 'workbench.verification-run-confirm',
    output: confirmation.output,
    runResult: confirmation.runResult,
    artifactRefs: confirmation.artifactRefs,
    verifierSummary: buildControlledVerificationVerifierSummary(confirmation),
    failureReason: controlledVerificationFailureReason(confirmation)
  });
}

function buildControlledVerificationVerifierSummary(confirmation) {
  return {
    status: confirmation.status,
    runStatus: confirmation.runResult?.status,
    passed: confirmation.status === 'passed',
    commandCount: confirmation.commandResults.length,
    failedCommandCount: confirmation.commandResults.filter((result) => result.status !== 'passed').length,
    artifactCount: confirmation.artifactRefs.length,
    failureReason: controlledVerificationFailureReason(confirmation),
    gatePassed: false
  };
}

function controlledVerificationFailureReason(confirmation) {
  const failed = confirmation.commandResults.find((result) => result.status !== 'passed');

  if (failed === undefined) {
    return null;
  }

  return `${failed.command} exited ${failed.exitCode ?? 'without exit code'}`;
}

function controlledVerificationArtifactRefs({ goalId, operationId }) {
  return [{
    kind: 'operation-registry',
    ref: `goal-operation-runs:${operationId}`,
    uri: `/api/goals/${goalId}/operations`,
    title: 'Goal operation registry entry',
    status: 'available'
  }];
}

function buildControlledVerificationOutputSummary(commandResults) {
  return commandResults.map((result) => [
    `command=${result.command}`,
    `status=${result.status}`,
    `exitCode=${result.exitCode ?? 'null'}`,
    `stdout=${result.stdoutSummary || ''}`
  ].join('\n')).join('\n---\n');
}

function buildControlledVerificationErrorSummary(commandResults) {
  return commandResults
    .filter((result) => result.stderrSummary)
    .map((result) => `${result.command}\n${result.stderrSummary}`)
    .join('\n---\n');
}

function summarizeCommandOutput(output) {
  const redacted = redactSecrets(String(output ?? ''));
  const lines = redacted.split(/\r?\n/u)
    .map((line) => line.trimEnd())
    .filter((line) => line.trim() !== '');
  const selected = lines.length > 24
    ? [...lines.slice(0, 12), '[truncated]', ...lines.slice(-12)]
    : lines;

  return selected.join('\n').slice(0, 4000);
}

function assertOnlyControlledVerificationConfirmBodyKeys(body) {
  const allowed = new Set(['goalId', 'taskId', 'suiteId']);
  const unsupported = Object.keys(body).filter((key) => !allowed.has(key));

  if (unsupported.length > 0) {
    throw new GoalEventPlanPreviewError(
      'invalid-controlled-verification-confirm-request',
      'Controlled verification run confirm body contains unsupported fields.',
      { unsupportedFields: unsupported.join(',') }
    );
  }
}

function requiredControlledVerificationConfirmBodyString(body, field) {
  const value = body[field];

  if (typeof value !== 'string' || value.trim() === '') {
    throw new GoalEventPlanPreviewError(
      'invalid-controlled-verification-confirm-request',
      `Controlled verification run confirm requires body.${field}.`,
      { field }
    );
  }

  return value.trim();
}

async function readControlledAdoptionPlanFreezeRequestBody(request) {
  const contentType = request.headers['content-type'] ?? '';

  if (!String(contentType).toLowerCase().includes('application/json')) {
    throw new GoalEventPlanPreviewError(
      'invalid-controlled-adoption-freeze-request',
      'Controlled adoption plan freeze requires application/json.',
      { reason: 'invalid-content-type' }
    );
  }

  let size = 0;
  let text = '';

  for await (const chunk of request) {
    size += chunk.length;

    if (size > GOAL_EVENT_CONFIRM_MAX_BODY_BYTES) {
      throw new GoalEventPlanPreviewError(
        'invalid-controlled-adoption-freeze-request',
        'Controlled adoption plan freeze request body is too large.',
        { reason: 'body-too-large' }
      );
    }

    text += chunk.toString('utf8');
  }
  let body;

  try {
    body = JSON.parse(text);
  } catch {
    throw new GoalEventPlanPreviewError(
      'invalid-controlled-adoption-freeze-request',
      'Controlled adoption plan freeze body must be valid JSON.',
      { reason: 'invalid-json' }
    );
  }

  if (!isPlainObject(body)) {
    throw new GoalEventPlanPreviewError(
      'invalid-controlled-adoption-freeze-request',
      'Controlled adoption plan freeze body must be an object.',
      { reason: 'invalid-body' }
    );
  }

  return body;
}

async function readControlledAdoptionConfirmRequestBody(request) {
  const contentType = request.headers['content-type'] ?? '';

  if (!String(contentType).toLowerCase().includes('application/json')) {
    throw new GoalEventPlanPreviewError(
      'invalid-controlled-adoption-confirm-request',
      'Controlled adoption confirm requires application/json.',
      { reason: 'invalid-content-type' }
    );
  }

  let size = 0;
  let text = '';

  for await (const chunk of request) {
    size += chunk.length;

    if (size > GOAL_EVENT_CONFIRM_MAX_BODY_BYTES) {
      throw new GoalEventPlanPreviewError(
        'invalid-controlled-adoption-confirm-request',
        'Controlled adoption confirm request body is too large.',
        { reason: 'body-too-large' }
      );
    }

    text += chunk.toString('utf8');
  }
  let body;

  try {
    body = JSON.parse(text);
  } catch {
    throw new GoalEventPlanPreviewError(
      'invalid-controlled-adoption-confirm-request',
      'Controlled adoption confirm body must be valid JSON.',
      { reason: 'invalid-json' }
    );
  }

  if (!isPlainObject(body)) {
    throw new GoalEventPlanPreviewError(
      'invalid-controlled-adoption-confirm-request',
      'Controlled adoption confirm body must be an object.',
      { reason: 'invalid-body' }
    );
  }

  return body;
}

async function confirmControlledAdoptionPlanFreeze({
  stateDir,
  runner,
  routeGoalId,
  body
}) {
  assertOnlyControlledAdoptionFreezeBodyKeys(body);

  const goalId = requiredControlledAdoptionFreezeBodyString(body, 'goalId');
  const taskId = requiredControlledAdoptionFreezeBodyString(body, 'taskId');
  const sourceRunId = requiredControlledAdoptionFreezeBodyString(body, 'sourceRunId');
  const operationId = requiredControlledAdoptionFreezeBodyString(body, 'operationId');

  if (goalId !== routeGoalId) {
    throw new GoalEventPlanPreviewError(
      'controlled-adoption-freeze-context-mismatch',
      'Controlled adoption plan freeze requires the same goal context returned by Workbench.',
      { routeGoalId, bodyGoalId: goalId }
    );
  }

  const sourceOperation = await findAdoptableImplementationOperation({
    stateDir,
    goalId,
    taskId,
    sourceRunId,
    operationId
  });
  const plannedResult = await runExistingAdoptionPlanCommand({
    stateDir,
    sourceRunId,
    runner
  });
  const planned = plannedResult.summary;
  const planHash = computeControlledAdoptionFreezeHash({
    goalId,
    taskId,
    sourceRunId,
    operationId,
    planned
  });

  return {
    contractName: CONTROLLED_ADOPTION_PLAN_FREEZE_CONTRACT_NAME,
    contractVersion: CONTROLLED_ADOPTION_PLAN_FREEZE_CONTRACT_VERSION,
    goalId,
    taskId,
    mode: 'freeze',
    status: planned.status,
    sourceRunId,
    sourceOperationId: operationId,
    planHash,
    command: {
      name: 'symphony adopt',
      confirmedCommand: 'symphony adopt --run <confirmed-run-id> --json',
      semanticCommand: 'adopt',
      intent: 'adopt'
    },
    adoptionPlan: stripUndefined({
      adoptionPlanId: planned.adoptionPlanId,
      adoptionPlanArtifactPath: planned.adoptionPlanArtifactPath,
      patchArtifactPath: planned.patchArtifactPath,
      patchHash: planned.patchHash,
      confirmationCommand: planned.confirmationCommand,
      status: planned.status,
      sourceRunId: planned.sourceRunId,
      sourceRunArtifactPath: planned.sourceRunArtifactPath,
      sourceOperationId: operationId,
      executionPlanId: planned.executionPlanId,
      sourceWorkspacePath: planned.sourceWorkspacePath,
      sourceWorkspaceManifestPath: planned.sourceWorkspaceManifestPath,
      sourceWorkspaceFingerprint: planned.sourceWorkspaceFingerprint,
      sourceEvidenceArtifactPath: planned.sourceEvidenceArtifactPath,
      sourceVerifierStatus: planned.sourceVerifierStatus,
      projectFingerprint: planned.projectFingerprint,
      gitHead: planned.gitHead,
      gitStatusFingerprint: planned.gitStatusFingerprint,
      changedFiles: planned.changedFiles,
      fileOperations: planned.fileOperations,
      mainWorktreeWrites: planned.mainWorktreeWrites,
      workspaceWrites: planned.workspaceWrites,
      runtimeWrites: planned.runtimeWrites,
      writeBoundary: planned.writeBoundary
    }),
    patchSummary: {
      changedFileCount: Array.isArray(planned.changedFiles) ? planned.changedFiles.length : 0,
      fileOperationCount: Array.isArray(planned.fileOperations) ? planned.fileOperations.length : 0,
      changedFiles: Array.isArray(planned.changedFiles) ? planned.changedFiles : [],
      fileOperations: Array.isArray(planned.fileOperations) ? planned.fileOperations : []
    },
    fingerprints: stripUndefined({
      patchHash: planned.patchHash,
      sourceWorkspaceFingerprint: planned.sourceWorkspaceFingerprint,
      projectFingerprint: planned.projectFingerprint,
      gitHead: planned.gitHead,
      gitStatusFingerprint: planned.gitStatusFingerprint
    }),
    recoveryNotes: {
      planFrozen: true,
      mainWorktreeUnchanged: planned.mainWorktreeWrites === false,
      inspectCommand: isNonEmptyString(planned.adoptionPlanId)
        ? `symphony adopt --inspect ${planned.adoptionPlanId} --json`
        : null,
      confirmCommand: planned.confirmationCommand ?? null,
      failureRecovery: 'Use adopt inspect to read plan and journal state before any confirm step.'
    },
    sourceCandidate: stripUndefined({
      operationId: sourceOperation.operationId,
      operationStatus: sourceOperation.status,
      commandKind: sourceOperation.commandKind,
      runStatus: sourceOperation.runResult?.status,
      verifierStatus: sourceOperation.runResult?.verifierStatus ?? sourceOperation.verifierSummary?.status,
      sourceWorkspaceFingerprint: sourceOperation.runResult?.sourceWorkspaceFingerprint
    }),
    output: stripUndefined({
      stdout: buildControlledAdoptionOutputSummary(planned),
      stderr: plannedResult.stderr,
      exitCode: plannedResult.exitCode
    }),
    confirmContext: {
      acceptedBodyFields: ['goalId', 'taskId', 'sourceRunId', 'operationId'],
      sameGoalTaskContextRequired: true,
      sourceRunMustBeAdoptableCandidate: true
    },
    safety: {
      mappedToExistingAdoptRun: true,
      genericShellRunner: false,
      arbitraryPathReadAvailable: false,
      browserExecutionAvailable: false,
      modelInvocationAvailable: false,
      mainWorktreeWrites: planned.mainWorktreeWrites === true,
      workspaceWrites: planned.workspaceWrites === true,
      adoptionConfirmAvailable: false,
      mergeAvailable: false,
      pushAvailable: false,
      tagAvailable: false,
      selfApprovalAvailable: false,
      readinessInferenceAvailable: false
    }
  };
}

async function findAdoptableImplementationOperation({
  stateDir,
  goalId,
  taskId,
  sourceRunId,
  operationId
}) {
  const operations = await readGoalOperationRuns({
    stateDir,
    goalId
  });
  const operation = operations.runs.find((candidate) => (
    candidate.operationId === operationId
    && candidate.goalId === goalId
    && candidate.taskId === taskId
    && candidate.commandKind === 'implementation'
    && candidate.runResult?.runId === sourceRunId
  ));

  if (operation === undefined) {
    throw new GoalEventPlanPreviewError(
      'controlled-adoption-source-run-not-found',
      'Controlled adoption plan freeze requires a selected implementation operation for the same goal and task.',
      { goalId, taskId, sourceRunId, operationId }
    );
  }

  const reasons = implementationOperationAdoptionBlockers(operation);

  if (reasons.length > 0) {
    throw new GoalEventPlanPreviewError(
      'controlled-adoption-source-run-blocked',
      'Controlled adoption plan freeze requires an adoptable implementation run.',
      { goalId, taskId, sourceRunId, operationId, reasons }
    );
  }

  return operation;
}

function implementationOperationAdoptionBlockers(operation) {
  const run = operation?.runResult ?? {};
  const verifierStatus = run.verifierStatus ?? operation?.verifierSummary?.status;
  const verifierPassed = verifierStatus === 'passed' || operation?.verifierSummary?.passed === true;
  const reasons = [];

  if (operation?.status !== 'confirmed') {
    reasons.push('implementation operation is not confirmed');
  }

  if (run.status !== 'passed') {
    reasons.push('run status is not passed');
  }

  if (!verifierPassed) {
    reasons.push('verifier status is not passed');
  }

  if (!(run.workspaceWrites === true || run.writeBoundary === 'isolated-workspace')) {
    reasons.push('isolated workspace write boundary is not confirmed');
  }

  if (run.mainWorktreeWrites !== false) {
    reasons.push('mainWorktreeWrites is not false');
  }

  if (!isNonEmptyString(run.sourceWorkspacePath) || !isNonEmptyString(run.sourceWorkspaceManifestPath)) {
    reasons.push('workspace refs are incomplete');
  }

  if (!isNonEmptyString(run.sourceWorkspaceFingerprint)) {
    reasons.push('source workspace fingerprint is missing');
  }

  const artifactRefs = Array.isArray(operation?.artifactRefs)
    ? operation.artifactRefs
    : Array.isArray(run.artifactRefs) ? run.artifactRefs : [];
  const hasEvidenceRef = artifactRefs.some((artifact) => artifact?.kind === 'evidence' || artifact?.artifactKind === 'evidence')
    || isNonEmptyString(run.evidenceArtifactPath);

  if (!hasEvidenceRef) {
    reasons.push('managed evidence artifact ref is missing');
  }

  return reasons;
}

async function runExistingAdoptionPlanCommand({ stateDir, sourceRunId, runner }) {
  const { runSymphonyCli } = await import('../../scripts/symphony.js');
  const stdout = createConsoleBuffer();
  const stderr = createConsoleBuffer();
  const exitCode = await runSymphonyCli({
    argv: ['adopt', '--state-dir', stateDir, '--run', sourceRunId, '--json'],
    stdout,
    stderr,
    runner
  });

  let summary;

  try {
    summary = JSON.parse(stdout.text());
  } catch {
    throw new GoalEventPlanPreviewError(
      'controlled-adoption-freeze-failed',
      'Existing symphony adopt --run command did not return JSON.',
      { exitCode }
    );
  }

  if (exitCode !== 0 || summary?.status !== 'adoption-planned') {
    throw new GoalEventPlanPreviewError(
      'controlled-adoption-freeze-failed',
      'Existing symphony adopt --run command failed before freezing an adoption plan.',
      { exitCode, status: summary?.status }
    );
  }

  return {
    summary,
    stdout: stdout.text(),
    stderr: stderr.text(),
    exitCode
  };
}

async function recordControlledAdoptionOperationRunFromFreeze({
  stateDir,
  goalId,
  freeze
}) {
  const adoptionPlan = freeze.adoptionPlan ?? {};

  return await recordGoalOperationRun({
    stateDir,
    goalId,
    taskId: freeze.taskId,
    role: 'worker',
    commandKind: 'adoption-plan',
    commandName: 'symphony adopt --run',
    status: 'confirmed',
    planHash: freeze.planHash,
    source: 'workbench.adoption-plan-freeze',
    output: freeze.output,
    runResult: adoptionPlan,
    artifactRefs: buildArtifactRefs({
      adoptionPlanArtifactPath: adoptionPlan.adoptionPlanArtifactPath,
      patchArtifactPath: adoptionPlan.patchArtifactPath
    }),
    verifierSummary: {
      status: adoptionPlan.sourceVerifierStatus,
      passed: adoptionPlan.sourceVerifierStatus === 'passed',
      sourceRunId: freeze.sourceRunId,
      changedFileCount: freeze.patchSummary.changedFileCount,
      artifactCount: 2
    }
  });
}

async function confirmControlledAdoptionPlan({
  stateDir,
  runner,
  routeGoalId,
  body
}) {
  assertOnlyControlledAdoptionConfirmBodyKeys(body);

  const goalId = requiredControlledAdoptionConfirmBodyString(body, 'goalId');
  const taskId = requiredControlledAdoptionConfirmBodyString(body, 'taskId');
  const adoptionPlanId = requiredControlledAdoptionConfirmBodyString(body, 'adoptionPlanId');
  const operationId = requiredControlledAdoptionConfirmBodyString(body, 'operationId');

  if (goalId !== routeGoalId) {
    throw new GoalEventPlanPreviewError(
      'controlled-adoption-confirm-context-mismatch',
      'Controlled adoption confirm requires the same goal context returned by Workbench.',
      { routeGoalId, bodyGoalId: goalId }
    );
  }

  const frozenOperation = await findFrozenAdoptionPlanOperation({
    stateDir,
    goalId,
    taskId,
    adoptionPlanId,
    operationId
  });
  const confirmedResult = await runExistingAdoptionConfirmCommand({
    stateDir,
    adoptionPlanId,
    runner
  });
  const confirmed = confirmedResult.summary;

  return {
    contractName: CONTROLLED_ADOPTION_CONFIRM_CONTRACT_NAME,
    contractVersion: CONTROLLED_ADOPTION_CONFIRM_CONTRACT_VERSION,
    goalId,
    taskId,
    mode: 'confirm',
    status: confirmed.status,
    adoptionPlanId,
    sourceOperationId: operationId,
    command: {
      name: 'symphony adopt',
      confirmedCommand: 'symphony adopt --confirm <adoption-id> --json',
      semanticCommand: 'adopt',
      intent: 'adopt'
    },
    confirmedRun: stripUndefined({
      runId: confirmed.runId,
      status: confirmed.status,
      exitCode: confirmed.exitCode,
      verifierStatus: confirmed.verifierStatus,
      adoptionPlanId: confirmed.adoptionPlanId,
      adoptionPlanArtifactPath: confirmed.adoptionPlanArtifactPath,
      adoptionJournalArtifactPath: confirmed.adoptionJournalArtifactPath,
      evidenceArtifactPath: confirmed.evidenceArtifactPath,
      sourceRunId: confirmed.sourceRunId,
      sourceRunArtifactPath: confirmed.sourceRunArtifactPath,
      executionPlanId: confirmed.executionPlanId,
      executionPlanArtifactPath: confirmed.executionPlanArtifactPath,
      patchArtifactPath: confirmed.patchArtifactPath,
      patchHash: confirmed.patchHash,
      changedFiles: confirmed.changedFiles,
      fileOperations: confirmed.fileOperations,
      projectRoot: confirmed.projectRoot,
      projectFingerprint: confirmed.projectFingerprint,
      sourceWorkspacePath: confirmed.sourceWorkspacePath,
      sourceWorkspaceManifestPath: confirmed.sourceWorkspaceManifestPath,
      sourceWorkspaceFingerprint: confirmed.sourceWorkspaceFingerprint,
      sourceEvidenceArtifactPath: confirmed.sourceEvidenceArtifactPath,
      sourceVerifierStatus: confirmed.sourceVerifierStatus,
      gitHead: confirmed.gitHead,
      gitStatusFingerprint: confirmed.gitStatusFingerprint,
      mainWorktreeWrites: confirmed.mainWorktreeWrites,
      workspaceWrites: confirmed.workspaceWrites,
      runtimeWrites: confirmed.runtimeWrites,
      writeBoundary: confirmed.writeBoundary,
      nextAction: confirmed.nextAction
    }),
    frozenPlan: stripUndefined({
      operationId: frozenOperation.operationId,
      operationStatus: frozenOperation.status,
      adoptionPlanId: frozenOperation.runResult?.adoptionPlanId,
      patchHash: frozenOperation.runResult?.patchHash,
      sourceRunId: frozenOperation.runResult?.sourceRunId,
      sourceWorkspaceFingerprint: frozenOperation.runResult?.sourceWorkspaceFingerprint
    }),
    output: stripUndefined({
      stdout: buildControlledAdoptionConfirmOutputSummary(confirmed),
      stderr: confirmedResult.stderr,
      exitCode: confirmedResult.exitCode
    }),
    confirmContext: {
      acceptedBodyFields: ['goalId', 'taskId', 'adoptionPlanId', 'operationId'],
      sameGoalTaskContextRequired: true,
      frozenPlanOperationRequired: true
    },
    safety: {
      mappedToExistingAdoptConfirm: true,
      genericShellRunner: false,
      arbitraryPathReadAvailable: false,
      browserExecutionAvailable: false,
      modelInvocationAvailable: false,
      mainWorktreeWrites: confirmed.mainWorktreeWrites === true,
      workspaceWrites: confirmed.workspaceWrites === true,
      mergeAvailable: false,
      pushAvailable: false,
      tagAvailable: false,
      publishAvailable: false,
      selfApprovalAvailable: false,
      reviewerEventRegistered: false,
      mainVerificationEventRegistered: false,
      releaseReadinessRegistered: false
    }
  };
}

async function findFrozenAdoptionPlanOperation({
  stateDir,
  goalId,
  taskId,
  adoptionPlanId,
  operationId
}) {
  const operations = await readGoalOperationRuns({
    stateDir,
    goalId
  });
  const operation = operations.runs.find((candidate) => (
    candidate.operationId === operationId
    && candidate.goalId === goalId
    && candidate.taskId === taskId
    && candidate.commandKind === 'adoption-plan'
    && candidate.status === 'confirmed'
    && candidate.runResult?.adoptionPlanId === adoptionPlanId
  ));

  if (operation === undefined) {
    throw new GoalEventPlanPreviewError(
      'controlled-adoption-plan-not-found',
      'Controlled adoption confirm requires a frozen adoption plan operation for the same goal and task.',
      { goalId, taskId, adoptionPlanId, operationId }
    );
  }

  if (!isNonEmptyString(operation.runResult?.patchHash)
    || !isNonEmptyString(operation.runResult?.adoptionPlanArtifactPath)
    || !isNonEmptyString(operation.runResult?.patchArtifactPath)) {
    throw new GoalEventPlanPreviewError(
      'controlled-adoption-plan-incomplete',
      'Controlled adoption confirm requires frozen adoption patch and plan refs.',
      { goalId, taskId, adoptionPlanId, operationId }
    );
  }

  return operation;
}

async function runExistingAdoptionConfirmCommand({ stateDir, adoptionPlanId, runner }) {
  const { runSymphonyCli } = await import('../../scripts/symphony.js');
  const stdout = createConsoleBuffer();
  const stderr = createConsoleBuffer();
  const exitCode = await runSymphonyCli({
    argv: ['adopt', '--state-dir', stateDir, '--confirm', adoptionPlanId, '--json'],
    stdout,
    stderr,
    runner
  });

  let summary;

  try {
    summary = JSON.parse(stdout.text());
  } catch {
    throw new GoalEventPlanPreviewError(
      'controlled-adoption-confirm-failed',
      'Existing symphony adopt --confirm command did not return JSON.',
      { exitCode }
    );
  }

  if (exitCode !== 0 || summary?.status !== 'passed' || summary?.adoptionPlanId !== adoptionPlanId) {
    throw new GoalEventPlanPreviewError(
      'controlled-adoption-confirm-failed',
      'Existing symphony adopt --confirm command failed before completing adoption.',
      { exitCode, status: summary?.status, adoptionPlanId: summary?.adoptionPlanId }
    );
  }

  return {
    summary,
    stdout: stdout.text(),
    stderr: stderr.text(),
    exitCode
  };
}

async function recordControlledAdoptionOperationRunFromConfirmation({
  stateDir,
  goalId,
  confirmation
}) {
  const confirmedRun = confirmation.confirmedRun ?? {};

  return await recordGoalOperationRun({
    stateDir,
    goalId,
    taskId: confirmation.taskId,
    role: 'worker',
    commandKind: 'adoption-confirm',
    commandName: 'symphony adopt --confirm',
    status: 'confirmed',
    planHash: confirmedRun.patchHash,
    source: 'workbench.adoption-confirm',
    output: confirmation.output,
    runResult: confirmedRun,
    artifactRefs: buildArtifactRefs({
      adoptionPlanArtifactPath: confirmedRun.adoptionPlanArtifactPath,
      adoptionJournalArtifactPath: confirmedRun.adoptionJournalArtifactPath,
      evidenceArtifactPath: confirmedRun.evidenceArtifactPath,
      patchArtifactPath: confirmedRun.patchArtifactPath
    }),
    verifierSummary: {
      status: confirmedRun.verifierStatus,
      passed: confirmedRun.verifierStatus === 'passed',
      sourceRunId: confirmedRun.sourceRunId,
      changedFileCount: Array.isArray(confirmedRun.changedFiles) ? confirmedRun.changedFiles.length : 0,
      artifactCount: 3
    }
  });
}

async function buildControlledAdoptionConfirmResponse({
  stateDir,
  goalId,
  confirmation,
  operationRun
}) {
  const runs = await decorateConsoleRuns(
    (await listRunStates({ stateDir })).map((run) => compactRunState(run)),
    { stateDir }
  );

  return {
    ...confirmation,
    operationRun,
    refreshed: {
      activeGoal: await buildGoalProgressLedger({
        stateDir,
        goalId
      }),
      events: await readGoalEventJournal({
        stateDir,
        goalId
      }),
      operations: await readGoalOperationRuns({
        stateDir,
        goalId
      }),
      runs: {
        contractVersion: PRODUCT_JSON_CONTRACT.version,
        contractName: 'symphony.console-runs',
        filter: 'all',
        availableFilters: [...RUN_FILTERS],
        runs
      },
      nextAction: await buildGoalNextAction({
        stateDir,
        goalId
      })
    }
  };
}

function computeControlledAdoptionFreezeHash({ goalId, taskId, sourceRunId, operationId, planned }) {
  return `sha256:${createHash('sha256')
    .update(JSON.stringify({
      goalId,
      taskId,
      sourceRunId,
      operationId,
      adoptionPlanId: planned?.adoptionPlanId,
      patchHash: planned?.patchHash,
      sourceWorkspaceFingerprint: planned?.sourceWorkspaceFingerprint
    }))
    .digest('hex')}`;
}

function buildControlledAdoptionConfirmOutputSummary(run) {
  return [
    `adoptionPlanId=${run?.adoptionPlanId ?? 'unknown'}`,
    `runId=${run?.runId ?? 'unknown'}`,
    `status=${run?.status ?? 'unknown'}`,
    `verifierStatus=${run?.verifierStatus ?? 'unknown'}`,
    `patchHash=${run?.patchHash ?? 'unknown'}`,
    `changedFiles=${Array.isArray(run?.changedFiles) ? run.changedFiles.length : 0}`,
    `mainWorktreeWrites=${String(run?.mainWorktreeWrites === true)}`,
    `nextAction=${run?.nextAction ?? 'unknown'}`
  ].join('\n');
}

function buildControlledAdoptionOutputSummary(plan) {
  return [
    `adoptionPlanId=${plan?.adoptionPlanId ?? 'unknown'}`,
    `status=${plan?.status ?? 'unknown'}`,
    `sourceRunId=${plan?.sourceRunId ?? 'unknown'}`,
    `patchHash=${plan?.patchHash ?? 'unknown'}`,
    `changedFiles=${Array.isArray(plan?.changedFiles) ? plan.changedFiles.length : 0}`,
    `fileOperations=${Array.isArray(plan?.fileOperations) ? plan.fileOperations.length : 0}`,
    `sourceWorkspaceFingerprint=${plan?.sourceWorkspaceFingerprint ?? 'unknown'}`,
    `mainWorktreeWrites=${String(plan?.mainWorktreeWrites === true)}`,
    `workspaceWrites=${String(plan?.workspaceWrites === true)}`
  ].join('\n');
}

function assertOnlyControlledAdoptionConfirmBodyKeys(body) {
  const allowed = new Set(['goalId', 'taskId', 'adoptionPlanId', 'operationId']);
  const unsupported = Object.keys(body).filter((key) => !allowed.has(key));

  if (unsupported.length > 0) {
    throw new GoalEventPlanPreviewError(
      'invalid-controlled-adoption-confirm-request',
      'Controlled adoption confirm received unsupported fields.',
      { field: unsupported[0] }
    );
  }
}

function requiredControlledAdoptionConfirmBodyString(body, key) {
  const value = body?.[key];

  if (!isNonEmptyString(value)) {
    throw new GoalEventPlanPreviewError(
      'invalid-controlled-adoption-confirm-request',
      `Controlled adoption confirm requires ${key}.`,
      { field: key }
    );
  }

  if (isUnsafeGoalRouteSegment(value)) {
    throw new GoalEventPlanPreviewError(
      'invalid-controlled-adoption-confirm-request',
      `Controlled adoption confirm ${key} must be a safe token.`,
      { field: key }
    );
  }

  return value;
}

function assertOnlyControlledAdoptionFreezeBodyKeys(body) {
  const allowed = new Set(['goalId', 'taskId', 'sourceRunId', 'operationId']);
  const unsupported = Object.keys(body).filter((key) => !allowed.has(key));

  if (unsupported.length > 0) {
    throw new GoalEventPlanPreviewError(
      'invalid-controlled-adoption-freeze-request',
      'Controlled adoption plan freeze received unsupported fields.',
      { field: unsupported[0] }
    );
  }
}

function requiredControlledAdoptionFreezeBodyString(body, key) {
  const value = body?.[key];

  if (!isNonEmptyString(value)) {
    throw new GoalEventPlanPreviewError(
      'invalid-controlled-adoption-freeze-request',
      `Controlled adoption plan freeze requires ${key}.`,
      { field: key }
    );
  }

  if (isUnsafeGoalRouteSegment(value)) {
    throw new GoalEventPlanPreviewError(
      'invalid-controlled-adoption-freeze-request',
      `Controlled adoption plan freeze ${key} must be a safe token.`,
      { field: key }
    );
  }

  return value;
}

function createConsoleBuffer() {
  const chunks = [];

  return {
    write(chunk) {
      chunks.push(String(chunk));
    },
    text() {
      return chunks.join('');
    }
  };
}

function assertOnlyControlledImplementationConfirmBodyKeys(body) {
  const allowed = new Set(['goalId', 'taskId', 'planId', 'planHash']);
  const unsupported = Object.keys(body).filter((key) => !allowed.has(key));

  if (unsupported.length > 0) {
    throw new GoalEventPlanPreviewError(
      'invalid-controlled-implementation-confirm-request',
      'Controlled implementation run confirm received unsupported fields.',
      { field: unsupported[0] }
    );
  }
}

function requiredControlledImplementationConfirmBodyString(body, key) {
  const value = body[key];

  if (typeof value !== 'string' || value.trim() === '') {
    throw new GoalEventPlanPreviewError(
      'invalid-controlled-implementation-confirm-request',
      'Controlled implementation run confirm fields must be non-empty strings.',
      { field: key }
    );
  }

  return value.trim();
}

function latestGoalEventOfTypes(events, types) {
  const wantedTypes = new Set(types);

  return events
    .filter((event) => wantedTypes.has(event?.eventType))
    .sort(compareGoalEventRecords)
    .at(-1) ?? null;
}

function goalEventRecordIsAfter(candidate, reference) {
  if (candidate === null || reference === null) {
    return false;
  }

  return compareGoalEventRecords(candidate, reference) > 0;
}

function compareGoalEventRecords(left, right) {
  const leftSequence = Number.isInteger(left?.sequence) ? left.sequence : null;
  const rightSequence = Number.isInteger(right?.sequence) ? right.sequence : null;

  if (leftSequence !== null && rightSequence !== null && leftSequence !== rightSequence) {
    return leftSequence - rightSequence;
  }

  const leftTime = Date.parse(left?.recordedAt ?? left?.occurredAt ?? '');
  const rightTime = Date.parse(right?.recordedAt ?? right?.occurredAt ?? '');

  if (Number.isFinite(leftTime) && Number.isFinite(rightTime) && leftTime !== rightTime) {
    return leftTime - rightTime;
  }

  return String(left?.eventId ?? '').localeCompare(String(right?.eventId ?? ''));
}

function assertOnlyControlledImplementationPreviewSearchParams(searchParams) {
  const allowed = new Set(['task']);
  const unsupported = Array.from(searchParams.keys()).filter((key) => !allowed.has(key));

  if (unsupported.length > 0) {
    throw new GoalEventPlanPreviewError(
      'invalid-controlled-implementation-preview-request',
      'Controlled implementation plan preview received unsupported query parameters.',
      { parameter: unsupported[0] }
    );
  }

  for (const [key, values] of groupSearchParamValues(searchParams)) {
    if (values.length > 1) {
      throw new GoalEventPlanPreviewError(
        'invalid-controlled-implementation-preview-request',
        'Controlled implementation plan preview accepts only single-value query parameters.',
        { parameter: key }
      );
    }
  }

  for (const blockedKey of ['prompt', 'path', 'command', 'confirm', 'planHash', 'plan-hash', 'dryRun', 'dry-run']) {
    if (searchParams.has(blockedKey)) {
      throw new GoalEventPlanPreviewError(
        'invalid-controlled-implementation-preview-request',
        'Controlled implementation plan preview does not accept prompt, path, command, confirm, or plan hash parameters.',
        { parameter: blockedKey }
      );
    }
  }
}

function safeIdPart(value) {
  const normalized = String(value).toLowerCase().replace(/[^a-z0-9_-]+/gu, '-').replace(/^-+|-+$/gu, '');

  return normalized === '' ? 'item' : normalized.slice(0, 80);
}

function shortHash(value) {
  return createHash('sha256').update(String(value)).digest('hex').slice(0, 12);
}

async function readGoalEventConfirmRequestBody(request) {
  const contentType = request.headers['content-type'] ?? '';

  if (!String(contentType).toLowerCase().includes('application/json')) {
    throw new GoalEventPlanPreviewError(
      'invalid-goal-confirm-request',
      'Goal event plan confirm requires application/json.',
      { reason: 'invalid-content-type' }
    );
  }

  let size = 0;
  let content = '';

  for await (const chunk of request) {
    size += chunk.length;

    if (size > GOAL_EVENT_CONFIRM_MAX_BODY_BYTES) {
      throw new GoalEventPlanPreviewError(
        'invalid-goal-confirm-request',
        'Goal event plan confirm request body is too large.',
        { reason: 'body-too-large' }
      );
    }

    content += chunk.toString('utf8');
  }

  let body;

  try {
    body = JSON.parse(content);
  } catch {
    throw new GoalEventPlanPreviewError(
      'invalid-goal-confirm-request',
      'Goal event plan confirm requires a valid JSON object.',
      { reason: 'invalid-json' }
    );
  }

  if (!isPlainObject(body)) {
    throw new GoalEventPlanPreviewError(
      'invalid-goal-confirm-request',
      'Goal event plan confirm requires a valid JSON object.',
      { reason: 'invalid-json-body' }
    );
  }

  return body;
}

async function readResultIntakeRequestBody(request, {
  code,
  label
}) {
  const contentType = request.headers['content-type'] ?? '';

  if (!String(contentType).toLowerCase().includes('application/json')) {
    throw new GoalEventPlanPreviewError(
      code,
      `${label} requires application/json.`,
      { reason: 'invalid-content-type' }
    );
  }

  let size = 0;
  let content = '';

  for await (const chunk of request) {
    size += chunk.length;

    if (size > RESULT_INTAKE_MAX_BODY_BYTES) {
      throw new GoalEventPlanPreviewError(
        code,
        `${label} request body is too large.`,
        { reason: 'body-too-large' }
      );
    }

    content += chunk.toString('utf8');
  }

  let body;

  try {
    body = JSON.parse(content);
  } catch {
    throw new GoalEventPlanPreviewError(
      code,
      `${label} requires a valid JSON object.`,
      { reason: 'invalid-json' }
    );
  }

  if (!isPlainObject(body)) {
    throw new GoalEventPlanPreviewError(
      code,
      `${label} requires a valid JSON object.`,
      { reason: 'invalid-json-body' }
    );
  }

  return body;
}

async function readProjectSelectionRequestBody(request) {
  const contentType = request.headers['content-type'] ?? '';

  if (!String(contentType).toLowerCase().includes('application/json')) {
    throw new ProjectSelectionError(
      'invalid-project-selection-request',
      'Project selection requires application/json.'
    );
  }

  let size = 0;
  let content = '';

  for await (const chunk of request) {
    size += chunk.length;

    if (size > PROJECT_SELECTION_MAX_BODY_BYTES) {
      throw new ProjectSelectionError(
        'invalid-project-selection-request',
        'Project selection request body is too large.'
      );
    }

    content += chunk.toString('utf8');
  }

  let body;

  try {
    body = JSON.parse(content);
  } catch {
    throw new ProjectSelectionError(
      'invalid-project-selection-request',
      'Project selection requires a valid JSON object.'
    );
  }

  if (!isPlainObject(body)) {
    throw new ProjectSelectionError(
      'invalid-project-selection-request',
      'Project selection requires a valid JSON object.'
    );
  }

  return body;
}

function normalizeResultIntakeConfirmBody(body) {
  assertOnlyResultIntakeBodyKeys(body, [
    'resultIntakeRequest',
    'resultIntakePreview',
    'planHash'
  ], {
    code: 'invalid-result-intake-confirm-request'
  });

  const resultIntakeRequest = body.resultIntakeRequest;
  const resultIntakePreview = body.resultIntakePreview;
  const planHash = body.planHash;

  if (!isPlainObject(resultIntakeRequest)) {
    throw new GoalEventPlanPreviewError(
      'invalid-result-intake-confirm-request',
      'Result intake confirm requires resultIntakeRequest.',
      { field: 'resultIntakeRequest' }
    );
  }

  if (!isPlainObject(resultIntakePreview)) {
    throw new GoalEventPlanPreviewError(
      'invalid-result-intake-confirm-request',
      'Result intake confirm requires resultIntakePreview.',
      { field: 'resultIntakePreview' }
    );
  }

  if (!isNonEmptyString(planHash)) {
    throw new GoalEventPlanPreviewError(
      'invalid-result-intake-confirm-request',
      'Result intake confirm requires planHash.',
      { field: 'planHash' }
    );
  }

  assertResultIntakeRequestEnvelope(resultIntakeRequest, {
    code: 'invalid-result-intake-confirm-request'
  });
  assertNoUnsafeResultIntakeLocalRefs(resultIntakePreview, {
    code: 'invalid-result-intake-confirm-request',
    path: 'resultIntakePreview'
  });

  return {
    resultIntakeRequest,
    resultIntakePreview,
    planHash
  };
}

function assertResultIntakeRequestEnvelope(request, { code }) {
  assertOnlyResultIntakeBodyKeys(request, [
    'contractName',
    'contractVersion',
    'goalId',
    'taskId',
    'workerRole',
    'source',
    'submittedAt',
    'resultBlock',
    'evidenceRefs',
    'requestedEvent',
    'boundaries'
  ], {
    code
  });
  assertNoUnsafeResultIntakeLocalRefs(request, {
    code,
    path: 'resultIntakeRequest'
  });
}

function assertOnlyResultIntakeBodyKeys(body, allowedKeys, { code }) {
  const allowed = new Set(allowedKeys);
  const unsupported = Object.keys(body).filter((key) => !allowed.has(key));

  if (unsupported.length > 0) {
    throw new GoalEventPlanPreviewError(
      code,
      'Result intake request received unsupported fields.',
      { field: unsupported[0] }
    );
  }
}

function assertNoUnsafeResultIntakeLocalRefs(value, {
  code,
  path
}) {
  const unsafePath = findUnsafeResultIntakeLocalRef(value, path);

  if (unsafePath !== null) {
    throw new GoalEventPlanPreviewError(
      code,
      'Result intake request contains an unsupported local path or session reference.',
      {
        field: unsafePath
      }
    );
  }
}

function findUnsafeResultIntakeLocalRef(value, path) {
  if (Array.isArray(value)) {
    for (const [index, entry] of value.entries()) {
      const unsafe = findUnsafeResultIntakeLocalRef(entry, `${path}[${index}]`);

      if (unsafe !== null) {
        return unsafe;
      }
    }

    return null;
  }

  if (isPlainObject(value)) {
    for (const [key, entry] of Object.entries(value)) {
      const fieldPath = `${path}.${key}`;

      if (
        isPotentialLocalPathField(key) &&
        typeof entry === 'string' &&
        isUnsafeResultIntakeLocalRef(entry)
      ) {
        return fieldPath;
      }

      const unsafe = findUnsafeResultIntakeLocalRef(entry, fieldPath);

      if (unsafe !== null) {
        return unsafe;
      }
    }
  }

  return null;
}

function isPotentialLocalPathField(key) {
  return /(?:path|file|jsonl|session|transcript|local|absolute)/iu.test(key);
}

function isUnsafeResultIntakeLocalRef(value) {
  if (!isNonEmptyString(value)) {
    return false;
  }

  return value.startsWith('/') ||
    value.includes('\\') ||
    /(?:^|\/)\.\.(?:\/|$)/u.test(value) ||
    /(?:^|\/)\.(?:codex|claude|git|symphony)(?:\/|$)/iu.test(value) ||
    /\.jsonl(?:$|[?#])/iu.test(value);
}

function assertResultIntakeRouteGoal({
  routeGoalId,
  request,
  preview,
  code
}) {
  if (request.goalId !== routeGoalId) {
    throw new GoalEventPlanPreviewError(
      code,
      'Result intake request goalId must match the route goal.',
      {
        reason: 'goal-mismatch'
      }
    );
  }

  if (preview === undefined) {
    return;
  }

  if (preview.goalId !== request.goalId || preview.taskId !== request.taskId) {
    throw new GoalEventPlanPreviewError(
      code,
      'Result intake preview must match the request goal and task.',
      {
        reason: 'preview-context-mismatch'
      }
    );
  }
}

function assertResultIntakePreviewMatchesRequest({
  resultIntakeRequest,
  resultIntakePreview
}) {
  const regenerated = buildResultIntakePreview(resultIntakeRequest, {
    generatedAt: resultIntakePreview.generatedAt,
    expiresAt: resultIntakePreview.expiresAt
  });

  if (regenerated.planHash !== resultIntakePreview.planHash) {
    throw new GoalEventPlanPreviewError(
      'invalid-result-intake-confirm-request',
      'Result intake preview is stale for the submitted request.',
      {
        reason: 'stale-preview'
      }
    );
  }
}

function safeResultIntakeErrorDetails(error) {
  const details = error.safeDetails ?? error.details;

  if (!isPlainObject(details)) {
    return details;
  }

  const serialized = JSON.stringify(details);

  if (/(?:rawTranscript|rawModelOutput|raw transcript|raw model output|\.jsonl|\.codex|\.claude)/iu.test(serialized)) {
    return {
      reason: 'unsafe-result-intake-content'
    };
  }

  return details;
}

async function confirmGoalEventPlan({ stateDir, goalId, body }) {
  const command = requiredBodyString(body, 'command');

  switch (command) {
    case 'update':
      assertOnlyBodyKeys(body, [
        'command',
        'planHash',
        'task',
        'event',
        'actor',
        'evidenceRef',
        'evidenceRefs',
        'statement',
        'branch',
        'commit',
        'blockerId',
        'blockerReason',
        'blockerSeverity'
      ]);

      const updatePlanHash = requiredBodyString(body, 'planHash');

      return {
        ...await confirmGoalUpdate({
          stateDir,
          goalId,
          taskId: requiredBodyString(body, 'task'),
          eventType: requiredBodyString(body, 'event'),
          actorId: requiredBodyString(body, 'actor'),
          evidenceRefs: bodyEvidenceRefs(body),
          statement: optionalBodyString(body, 'statement'),
          branch: optionalBodyString(body, 'branch'),
          commit: optionalBodyString(body, 'commit'),
          blocker: buildConfirmBlocker(body),
          planHash: updatePlanHash
        }),
        planHash: updatePlanHash
      };
    case 'review':
      assertOnlyBodyKeys(body, [
        'command',
        'planHash',
        'task',
        'reviewer',
        'verdict',
        'evidenceRef',
        'evidenceRefs',
        'failedCommand',
        'failedCommands',
        'statement',
        'branch',
        'commit'
      ]);

      const reviewPlanHash = requiredBodyString(body, 'planHash');

      return {
        ...await confirmGoalReview({
          stateDir,
          goalId,
          taskId: requiredBodyString(body, 'task'),
          reviewerId: requiredBodyString(body, 'reviewer'),
          verdict: requiredBodyString(body, 'verdict'),
          evidenceRefs: bodyEvidenceRefs(body),
          failedCommands: bodyFailedCommands(body),
          statement: optionalBodyString(body, 'statement'),
          branch: optionalBodyString(body, 'branch'),
          commit: optionalBodyString(body, 'commit'),
          planHash: reviewPlanHash
        }),
        planHash: reviewPlanHash
      };
    case 'gate':
      assertOnlyBodyKeys(body, [
        'command',
        'planHash',
        'task',
        'gate',
        'status',
        'verifier',
        'evidenceRef',
        'evidenceRefs',
        'failedCommand',
        'failedCommands',
        'statement',
        'branch',
        'commit'
      ]);

      const gatePlanHash = requiredBodyString(body, 'planHash');

      return {
        ...await confirmGoalGate({
          stateDir,
          goalId,
          taskId: optionalBodyString(body, 'task'),
          gateName: requiredBodyString(body, 'gate'),
          status: requiredBodyString(body, 'status'),
          verifierId: requiredBodyString(body, 'verifier'),
          evidenceRefs: bodyEvidenceRefs(body),
          failedCommands: bodyFailedCommands(body),
          statement: optionalBodyString(body, 'statement'),
          branch: optionalBodyString(body, 'branch'),
          commit: optionalBodyString(body, 'commit'),
          planHash: gatePlanHash
        }),
        planHash: gatePlanHash
      };
    default:
      throw new GoalEventPlanPreviewError(
        'unsupported-goal-confirm-command',
        'Goal event plan confirm supports only update, review, or gate confirms.',
        { command }
      );
  }
}

async function buildGoalEventPlanConfirmResponse({ stateDir, goalId, result, operationRun }) {
  const [progress, events, nextAction, closeout] = await Promise.all([
    buildGoalProgressLedger({
      stateDir,
      goalId
    }),
    buildRefreshedGoalEventLog({
      stateDir,
      goalId
    }),
    buildGoalNextAction({
      stateDir,
      goalId
    }),
    buildGoalCloseoutReport({
      stateDir,
      goalId
    })
  ]);

  return {
    contractName: 'goal-event-confirmation.v1',
    contractVersion: 1,
    goalId,
    mode: 'confirm',
    status: result.status,
    written: result.written,
    appendOnly: result.appendOnly,
    planHash: result.planHash,
    command: commandKeyFromConfirmResult(result),
    operationRun,
    eventSummary: stripUndefined({
      eventId: result.event?.eventId,
      sequence: result.event?.sequence,
      eventType: result.eventType,
      taskId: result.taskId ?? null,
      actorRole: result.event?.actor?.role,
      actorId: result.event?.actor?.id,
      evidenceRefs: result.event?.evidenceRefs ?? [],
      verdict: result.event?.review?.verdict,
      gate: result.gate,
      gateStatus: result.gateStatus,
      failedCommands: Array.isArray(result.event?.metadata?.failedCommands)
        ? [...result.event.metadata.failedCommands]
        : undefined,
      eventHash: result.event?.eventHash
    }),
    refreshed: {
      progress,
      events,
      nextAction,
      closeout
    },
    confirmEndpoint: {
      constrainedCommands: ['update', 'review', 'gate'],
      genericShellRunner: false,
      confirmUsesPlanHash: true,
      refreshes: [
        'goal-progress-ledger.v1',
        'goal-event-log.v1',
        'goal-next-action.v1',
        'goal-closeout-report.v1'
      ]
    },
    safety: {
      confirmWritesAppendOnly: true,
      genericShellRunner: false,
      browserExecutionAvailable: false,
      modelInvocationAvailable: false,
      arbitraryPathReadAvailable: false
    }
  };
}

async function recordGoalOperationRunFromPlan({
  stateDir,
  goalId,
  plan,
  status,
  source
}) {
  const proposedEvent = plan.proposedEvents[0] ?? {};

  return await recordGoalOperationRun({
    stateDir,
    goalId,
    taskId: proposedEvent.taskId ?? null,
    role: plan.actor.role,
    commandKind: commandKeyFromPlan(plan),
    commandName: plan.command.name,
    status,
    planHash: plan.planHash,
    eventIds: [],
    source
  });
}

async function recordGoalOperationRunFromConfirmResult({
  stateDir,
  goalId,
  result
}) {
  return await recordGoalOperationRun({
    stateDir,
    goalId,
    taskId: result.taskId ?? null,
    role: result.event.actor.role,
    commandKind: commandKeyFromConfirmResult(result),
    commandName: result.event.metadata?.sourceCommand,
    status: 'confirmed',
    planHash: result.planHash,
    eventIds: [result.event.eventId],
    source: 'workbench.event-plan-confirm'
  });
}

async function recordWorkerRunOperationRunFromConfirmation({
  stateDir,
  goalId,
  confirmation
}) {
  const result = confirmation.result;
  const status = result.status === 'needs-review' ? 'confirmed' : 'failed';

  return await recordGoalOperationRun({
    stateDir,
    operationId: confirmation.runId,
    goalId,
    taskId: confirmation.taskId,
    role: 'worker',
    commandKind: 'provider-runner',
    commandName: 'worker run preview/confirm',
    status,
    planHash: confirmation.planHash,
    source: 'workbench.worker-run-confirm',
    output: {
      stdout: `status=${result.status}\nproviderId=${confirmation.providerId}\ncommandTemplateId=${confirmation.commandTemplateId}`,
      stderr: '',
      rawProviderOutputAvailable: false
    },
    runResult: result,
    artifactRefs: workerRunArtifactRefs(result),
    verifierSummary: {
      status: result.verifier.state,
      workerRunStatus: result.status,
      failureLayer: result.failureLayer.kind,
      taskState: result.nextState.taskState,
      taskCompleted: false,
      reviewerApproved: false,
      mainVerified: false,
      releaseReady: false
    },
    failureReason: result.failureLayer.reason
  });
}

function workerRunArtifactRefs(result) {
  return [
    ...result.sanitizedResult.artifactRefs.map((ref) => ({
      kind: 'worker-run-artifact',
      ref,
      title: 'Worker run artifact ref',
      sourceRunId: result.runId,
      status: result.status
    })),
    ...result.evidenceRefs.map((entry) => ({
      kind: entry.kind,
      ref: entry.ref,
      title: entry.label,
      sourceRunId: result.runId,
      status: result.status
    }))
  ];
}

async function buildRefreshedGoalEventLog({ stateDir, goalId }) {
  const goal = await resolveGoalEventsGoal({
    stateDir,
    goalId
  });

  if (goal === null) {
    return null;
  }

  return await readGoalEventJournal({
    stateDir,
    goalId: goal.goalId,
    goalTitle: goal.goalTitle,
    baseline: goal.baseline
  });
}

function commandKeyFromConfirmResult(result) {
  if (typeof result.verdict === 'string') {
    return 'review';
  }

  if (typeof result.gate === 'string') {
    return 'gate';
  }

  return 'update';
}

function commandKeyFromPlan(plan) {
  if (plan.command.name === 'symphony goal review') {
    return 'review';
  }

  if (plan.command.name === 'symphony goal gate') {
    return 'gate';
  }

  return 'update';
}

function assertOnlyBodyKeys(body, allowedKeys) {
  const allowed = new Set(allowedKeys);
  const unsupported = Object.keys(body).filter((key) => !allowed.has(key));

  if (unsupported.length > 0) {
    throw new GoalEventPlanPreviewError(
      'invalid-goal-confirm-request',
      'Goal event plan confirm received unsupported fields.',
      { field: unsupported[0] }
    );
  }
}

function requiredBodyString(body, key) {
  const value = optionalBodyString(body, key);

  if (value === undefined) {
    throw new GoalEventPlanPreviewError(
      'invalid-goal-confirm-request',
      `Goal event plan confirm requires ${key}.`,
      { field: key }
    );
  }

  return value;
}

function optionalBodyString(body, key) {
  const value = body[key];

  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new GoalEventPlanPreviewError(
      'invalid-goal-confirm-request',
      'Goal event plan confirm fields must be strings.',
      { field: key }
    );
  }

  const trimmed = value.trim();

  if (trimmed === '') {
    throw new GoalEventPlanPreviewError(
      'invalid-goal-confirm-request',
      'Goal event plan confirm fields must be non-empty.',
      { field: key }
    );
  }

  return trimmed;
}

function bodyEvidenceRefs(body) {
  const refs = [];

  if (body.evidenceRef !== undefined) {
    if (typeof body.evidenceRef === 'string') {
      refs.push(body.evidenceRef);
    } else if (Array.isArray(body.evidenceRef)) {
      refs.push(...body.evidenceRef);
    } else {
      throw new GoalEventPlanPreviewError(
        'invalid-goal-confirm-request',
        'Goal event plan confirm evidenceRef must be a string or string array.',
        { field: 'evidenceRef' }
      );
    }
  }

  if (body.evidenceRefs !== undefined) {
    if (!Array.isArray(body.evidenceRefs)) {
      throw new GoalEventPlanPreviewError(
        'invalid-goal-confirm-request',
        'Goal event plan confirm evidenceRefs must be a string array.',
        { field: 'evidenceRefs' }
      );
    }

    refs.push(...body.evidenceRefs);
  }

  return refs.map((entry, index) => {
    if (typeof entry !== 'string' || entry.trim() === '') {
      throw new GoalEventPlanPreviewError(
        'invalid-goal-confirm-request',
        'Goal event plan confirm evidence refs must be non-empty strings.',
        { field: `evidenceRef[${index}]` }
      );
    }

    return entry.trim();
  });
}

function bodyFailedCommands(body) {
  const commands = [];

  if (body.failedCommand !== undefined) {
    if (typeof body.failedCommand === 'string') {
      commands.push(body.failedCommand);
    } else if (Array.isArray(body.failedCommand)) {
      commands.push(...body.failedCommand);
    } else {
      throw new GoalEventPlanPreviewError(
        'invalid-goal-confirm-request',
        'Goal event plan confirm failedCommand must be a string or string array.',
        { field: 'failedCommand' }
      );
    }
  }

  if (body.failedCommands !== undefined) {
    if (!Array.isArray(body.failedCommands)) {
      throw new GoalEventPlanPreviewError(
        'invalid-goal-confirm-request',
        'Goal event plan confirm failedCommands must be a string array.',
        { field: 'failedCommands' }
      );
    }

    commands.push(...body.failedCommands);
  }

  const normalized = [];

  commands.forEach((entry, index) => {
    if (typeof entry !== 'string' || entry.trim() === '') {
      throw new GoalEventPlanPreviewError(
        'invalid-goal-confirm-request',
        'Goal event plan confirm failed commands must be non-empty strings.',
        { field: `failedCommand[${index}]` }
      );
    }

    const command = entry.trim();

    if (!normalized.includes(command)) {
      normalized.push(command);
    }
  });

  return normalized;
}

function buildConfirmBlocker(body) {
  const blockerId = optionalBodyString(body, 'blockerId');
  const reason = optionalBodyString(body, 'blockerReason');
  const severity = optionalBodyString(body, 'blockerSeverity');

  if (blockerId === undefined && reason === undefined && severity === undefined) {
    return undefined;
  }

  return stripUndefined({
    blockerId,
    reason,
    severity
  });
}

function addGoalEventPlanPreviewSummary(plan, operationRun) {
  const proposedEvent = plan.proposedEvents[0] ?? {};

  return {
    ...plan,
    operationRun,
    eventSummary: stripUndefined({
      commandName: plan.command.name,
      commandIntent: plan.command.intent,
      eventType: proposedEvent.eventType,
      taskId: proposedEvent.taskId ?? null,
      phase: proposedEvent.phase,
      actorRole: plan.actor.role,
      actorId: plan.actor.id,
      evidenceRefs: Array.isArray(proposedEvent.evidenceRefs)
        ? proposedEvent.evidenceRefs.map((entry) => stripUndefined({
            kind: entry.kind,
            ref: entry.ref,
            label: entry.label
          }))
        : [],
      statement: proposedEvent.statement ?? null,
      verdict: proposedEvent.review?.verdict,
      gate: proposedEvent.gate?.name,
      gateStatus: proposedEvent.gate?.status,
      failedCommands: Array.isArray(proposedEvent.metadata?.failedCommands)
        ? [...proposedEvent.metadata.failedCommands]
        : undefined,
      branch: proposedEvent.branch ?? null,
      commit: proposedEvent.commit ?? null,
      blocker: proposedEvent.blocker,
      planHash: plan.planHash,
      wouldAppendTo: plan.wouldAppend.target,
      writesInDryRun: plan.wouldAppend.writesInDryRun
    }),
    previewEndpoint: {
      dryRunOnly: true,
      constrainedCommands: ['update', 'review', 'gate'],
      genericShellRunner: false,
      confirmAvailable: false
    }
  };
}

function buildPreviewBlocker(searchParams) {
  const blockerId = optionalSingleSearchParam(searchParams, 'blockerId');
  const reason = optionalSingleSearchParam(searchParams, 'blockerReason');
  const severity = optionalSingleSearchParam(searchParams, 'blockerSeverity');

  if (blockerId === undefined && reason === undefined && severity === undefined) {
    return undefined;
  }

  return stripUndefined({
    blockerId,
    reason,
    severity
  });
}

function parseHandoffRequestPath(pathname, searchParams = new URLSearchParams()) {
  if (pathname === '/api/handoff' || pathname === '/api/handoff/') {
    if (hasSearchParams(searchParams)) {
      return {
        kind: 'invalid',
        ref: pathname
      };
    }

    return {
      kind: 'index'
    };
  }

  if (!pathname.startsWith('/api/handoff/')) {
    return null;
  }

  if (hasSearchParams(searchParams)) {
    return {
      kind: 'invalid',
      ref: pathname
    };
  }

  const decoded = safeDecodePathSegment(pathname.slice('/api/handoff/'.length));

  if (decoded.ok === false || isUnsafeHandoffRef(decoded.value)) {
    return {
      kind: 'invalid',
      ref: decoded.value
    };
  }

  if (decoded.value !== GUIDED_GOAL_HANDOFF_REGISTERED_REF) {
    return {
      kind: 'missing',
      ref: decoded.value
    };
  }

  return {
    kind: 'contract',
    ref: decoded.value
  };
}

function parseAdoptionInspectRequestPath(pathname, searchParams = new URLSearchParams()) {
  const match = /^\/api\/adoptions\/([^/]+)\/inspect$/u.exec(pathname);

  if (match === null) {
    return null;
  }

  const decoded = safeDecodePathSegment(match[1]);

  if (hasSearchParams(searchParams)) {
    return {
      kind: 'invalid',
      adoptionId: null,
      reason: 'query-parameters-not-supported'
    };
  }

  if (decoded.ok === false || isUnsafeGoalRouteSegment(decoded.value)) {
    return {
      kind: 'invalid',
      adoptionId: null,
      reason: 'invalid-route-segment'
    };
  }

  return {
    kind: 'inspect',
    adoptionId: decoded.value
  };
}

function parseRunTimelineRequestPath(pathname) {
  const match = /^\/api\/runs\/([^/]+)\/timeline$/u.exec(pathname);

  if (match === null) {
    return null;
  }

  return {
    runId: decodeURIComponent(match[1])
  };
}



function stripUndefined(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined)
  );
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function firstNonEmptyString(...values) {
  return values.find((value) => isNonEmptyString(value)) ?? null;
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function buildDiagnosticsCommands({ snapshot, readiness }) {
  const items = dedupeCommands([
    ...(snapshot.recommendedCommands ?? []),
    ...(readiness.recommendedCommands ?? [])
  ]);
  const groups = groupCommands(items);

  return {
    mode: 'copy-only',
    items,
    groups,
    commandGroups: groups
  };
}

function combineRiskSummaries(summaries) {
  const seen = new Set();
  const items = [];

  for (const summary of summaries) {
    for (const item of summary?.items ?? []) {
      const key = [
        item.id,
        item.runId ?? '',
        item.title ?? '',
        item.detail ?? ''
      ].join('\0');

      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      items.push(item);
    }
  }

  return summarizeRiskItems(items);
}


function diagnosticsStatus({ snapshot, readiness, risks }) {
  if ((snapshot.runStats?.total ?? snapshot.runs?.length ?? 0) === 0) {
    return 'no-runs';
  }

  if ((risks.counts?.high ?? 0) > 0 || requiredReadinessMissing(readiness)) {
    return 'attention';
  }

  return 'ready';
}

function requiredReadinessMissing(readiness) {
  return readiness.tools?.packageManager?.status !== 'available'
    || readiness.tools?.git?.status !== 'available';
}

function buildDiagnosticsAction({ status, snapshot, risks, commands }) {
  if (status === 'no-runs') {
    return {
      next: 'symphony scan',
      mode: 'copy-only'
    };
  }

  const highRiskCommand = risks.items
    ?.find((risk) => risk.severity === 'high' && isNonEmptyString(risk.command?.command))
    ?.command
    ?.command;

  return {
    next: highRiskCommand
      ?? snapshot.action?.next
      ?? commands.items?.[0]?.command
      ?? 'symphony status',
    mode: 'copy-only'
  };
}

function appendTextCommandGroups(lines, commandGroups) {
  if (!Array.isArray(commandGroups) || commandGroups.length === 0) {
    lines.push('- No commands available.');
    return;
  }

  for (const group of commandGroups) {
    lines.push(`${formatTextValue(group.group)}:`);
    for (const command of group.commands ?? []) {
      lines.push(`- ${formatTextValue(command.label ?? 'Command')}: ${formatTextValue(command.command)} (${formatTextValue(command.mode ?? 'copy-only')})`);
    }
  }
}

function formatTextValue(value) {
  if (value === undefined || value === null || value === '') {
    return 'unknown';
  }

  return String(redactSecrets(value));
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function statusBadge(value) {
  const text = String(value ?? 'unknown');
  const statusClass = text.includes(':') ? text.split(':').at(-1) : text;

  return `<span class="badge ${escapeHtml(statusClass)}">${escapeHtml(text)}</span>`;
}

function metricsGrid(metrics) {
  return `<div class="metric-grid">${metrics.map(([label, value]) => `
    <div class="metric">
      <div class="label">${escapeHtml(label)}</div>
      <div class="value">${escapeHtml(value ?? 'unknown')}</div>
    </div>`).join('')}
  </div>`;
}

function renderLatestRun(run) {
  if (run === null) {
    return '<div class="empty">No run states found yet. Copy symphony scan to create the first read-only project context.</div>';
  }

  return `
    ${metricsGrid([
      ['Run ID', run.runId],
      ['Command', run.command ?? run.semanticCommand],
      ['Status', run.status],
      ['Verifier', run.verifierStatus ?? 'unknown'],
      ['Safety', run.safetyMode ?? 'unknown'],
      ['Execution', run.executionMode ?? 'unknown'],
      ['Artifacts', artifactStatusLabel({}, run)],
      ['Updated', run.updatedAt ?? run.createdAt ?? 'unknown']
    ])}`;
}

function renderRecentRuns(runs) {
  if (!Array.isArray(runs) || runs.length === 0) {
    return '<div class="empty">No recent runs are available.</div>';
  }

  return `<table>
    <thead>
      <tr>
        <th>Run</th>
        <th>Status</th>
        <th>Verifier</th>
        <th>Artifacts</th>
        <th>Updated</th>
      </tr>
    </thead>
    <tbody>
      ${runs.map((run) => `<tr>
        <td>${escapeHtml(run.runId)}</td>
        <td>${escapeHtml(run.status ?? 'unknown')}</td>
        <td>${escapeHtml(run.verifierStatus ?? 'unknown')}</td>
        <td>${escapeHtml(run.artifactStatus ?? 'unknown')}</td>
        <td>${escapeHtml(run.updatedAt ?? 'unknown')}</td>
      </tr>`).join('')}
    </tbody>
  </table>`;
}

function renderArtifactHealth(runStats, latestRun) {
  const artifacts = runStats.artifacts ?? {};
  const latestArtifactStatus = latestRun?.artifactStatus;

  return metricsGrid([
    ['Overall', artifactStatusLabel(runStats, latestRun)],
    ['Registered', artifacts.registered ?? latestRun?.artifactHealth?.total ?? 0],
    ['Missing', artifacts.missing ?? latestArtifactStatus?.missing ?? 0],
    ['Runs with missing', artifacts.runsWithMissing ?? ((latestArtifactStatus?.missing ?? 0) > 0 ? 1 : 0)]
  ]);
}

function artifactStatusLabel(runStats, latestRun) {
  return runStats.artifacts?.status
    ?? latestRun?.artifactStatus?.status
    ?? latestRun?.artifactHealth?.status
    ?? 'empty';
}

function renderRiskList(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return '<div class="empty">No visible risks in this diagnostics report.</div>';
  }

  return `<div class="risk-list">${items.map((risk) => `
    <div class="risk ${escapeHtml(risk.severity ?? 'low')}">
      <div class="risk-title">${escapeHtml(risk.title)} ${statusBadge(risk.severity ?? 'low')}</div>
      <div class="muted">${escapeHtml([risk.runId, risk.detail].filter(Boolean).join(': '))}</div>
      ${risk.command?.command ? `<code class="command-code">${escapeHtml(risk.command.command)}</code>` : ''}
    </div>`).join('')}
  </div>`;
}

function renderReadinessChecks(checks) {
  if (!Array.isArray(checks) || checks.length === 0) {
    return '<div class="empty">Readiness checks are unavailable.</div>';
  }

  return `<div class="check-list">${checks.map((check) => `
    <div class="check-row">
      <div class="command-title">${escapeHtml(check.label)} ${statusBadge(check.status ?? 'unknown')}</div>
      <div class="muted">${escapeHtml(check.detail ?? '')}</div>
    </div>`).join('')}
  </div>`;
}

function renderCommandGroups(commandGroups) {
  if (!Array.isArray(commandGroups) || commandGroups.length === 0) {
    return '<div class="empty">No copy-only commands are available.</div>';
  }

  return `<div class="command-list">${commandGroups.map((group) => `
    <div>
      <h3>${escapeHtml(group.group)}</h3>
      ${(group.commands ?? []).map((command) => `
        <div class="command">
          <div class="command-title">${escapeHtml(command.label ?? 'Command')}</div>
          <code class="command-code">${escapeHtml(command.command)}</code>
          <div class="muted">${escapeHtml(command.description ?? command.mode ?? 'copy-only')}</div>
        </div>`).join('')}
    </div>`).join('')}
  </div>`;
}

function renderConsoleHtml() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Symphony Workbench</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f5f7fa;
      --panel: #ffffff;
      --text: #20242c;
      --muted: #5f6b7a;
      --line: #d9dee7;
      --accent: #0d6b57;
      --accent-soft: #e5f3ee;
      --warn: #9b6b1f;
      --warn-soft: #fff5dc;
      --danger: #a53d2d;
      --danger-soft: #fae8e4;
      --ok: #1f7a4f;
      --ok-soft: #e3f4ec;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font-size: 14px;
      letter-spacing: 0;
    }

    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      min-height: 64px;
      padding: 14px 24px;
      background: var(--panel);
      border-bottom: 1px solid var(--line);
    }

    h1 {
      margin: 0;
      font-size: 18px;
      font-weight: 650;
    }

    .subtitle {
      margin: 3px 0 0;
      color: var(--muted);
      font-size: 12px;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    main {
      display: grid;
      grid-template-columns: 220px minmax(0, 1fr);
      gap: 0;
      min-height: calc(100vh - 64px);
    }

    aside {
      border-right: 1px solid var(--line);
      background: #eef2f5;
      padding: 16px;
      overflow: auto;
    }

    section {
      padding: 20px 24px;
      overflow: auto;
    }

    .view-tabs {
      display: grid;
      gap: 8px;
      margin-bottom: 16px;
    }

    .view-tab {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      text-align: left;
      min-height: 38px;
    }

    .view-tab[aria-current="true"] {
      background: var(--accent-soft);
    }

    .view {
      display: none;
    }

    .view.active {
      display: block;
    }

    .view-header {
      display: flex;
      align-items: start;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 16px;
    }

    .view-title {
      margin: 0;
      font-size: 22px;
      font-weight: 680;
    }

    .overview-grid,
    .split-grid {
      display: grid;
      grid-template-columns: minmax(0, 1.05fr) minmax(280px, 0.95fr);
      gap: 16px;
      align-items: start;
    }

    .compact-panel {
      border: 1px solid var(--line);
      border-radius: 6px;
      background: var(--panel);
      padding: 14px;
      margin-bottom: 16px;
    }

    .compact-panel h2 {
      margin-bottom: 12px;
    }

    #side-summary dl {
      grid-template-columns: 1fr;
      gap: 4px;
      margin-bottom: 0;
    }

    #side-summary dd {
      font-weight: 650;
    }

    button {
      min-height: 34px;
      border: 1px solid var(--line);
      background: var(--panel);
      color: var(--text);
      border-radius: 6px;
      padding: 0 10px;
      cursor: pointer;
      font: inherit;
    }

    button:hover,
    button[aria-current="true"] {
      border-color: var(--accent);
      color: var(--accent);
    }

    .badge {
      display: inline-flex;
      align-items: center;
      min-height: 26px;
      border: 1px solid var(--line);
      border-radius: 999px;
      padding: 0 10px;
      background: var(--panel);
      color: var(--muted);
      font-size: 12px;
      white-space: nowrap;
    }

    .dashboard {
      display: grid;
      gap: 10px;
      margin-bottom: 18px;
    }

    .metric-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
    }

    .metric {
      min-width: 0;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: var(--panel);
      padding: 10px;
    }

    .metric-label {
      color: var(--muted);
      font-size: 12px;
    }

    .metric-value {
      margin-top: 4px;
      font-weight: 650;
      overflow-wrap: anywhere;
    }

    .command-list {
      display: grid;
      gap: 8px;
      margin: 0 0 18px;
    }

    .command-group {
      display: grid;
      gap: 8px;
    }

    .command-group h3,
    .detail-section h3 {
      margin: 0;
      color: var(--muted);
      font-size: 12px;
      font-weight: 650;
      text-transform: uppercase;
    }

    .command-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 8px;
      align-items: start;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: var(--panel);
      padding: 10px;
    }

    .command-title {
      font-weight: 650;
    }

    .command-code {
      display: block;
      margin-top: 4px;
      color: #354052;
      font: 12px/1.45 ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
      overflow-wrap: anywhere;
    }

    .run-list {
      display: grid;
      gap: 8px;
    }

    .adoption-list {
      display: grid;
      gap: 8px;
    }

    .filter-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin: 0 0 12px;
    }

    .filter-list button {
      min-height: 30px;
      font-size: 12px;
    }

    .run-button {
      width: 100%;
      display: grid;
      gap: 4px;
      text-align: left;
      padding: 10px;
    }

    .adoption-button {
      width: 100%;
      display: grid;
      gap: 4px;
      text-align: left;
      padding: 10px;
    }

    .run-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      color: var(--muted);
      font-size: 12px;
    }

    .empty-state {
      padding: 12px;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: var(--panel);
      overflow-wrap: anywhere;
    }

    .stack {
      display: grid;
      gap: 12px;
      margin: 0 0 18px;
    }

    .risk-list {
      display: grid;
      gap: 8px;
      margin: 0 0 18px;
    }

    .risk-row {
      border: 1px solid var(--line);
      border-radius: 6px;
      background: var(--panel);
      padding: 10px;
      overflow-wrap: anywhere;
    }

    .risk-row.high {
      border-color: var(--danger);
      background: var(--danger-soft);
    }

    .risk-row.medium {
      border-color: var(--warn);
      background: var(--warn-soft);
    }

    .risk-row.low {
      border-color: var(--line);
      background: var(--panel);
    }

    .preview-panel {
      margin-top: 18px;
    }

    .section-block {
      margin: 0 0 18px;
    }

    .detail-section {
      margin: 0 0 22px;
    }

    h2 {
      margin: 0 0 10px;
      font-size: 14px;
      font-weight: 650;
    }

    .muted {
      color: var(--muted);
    }

    .status {
      font-weight: 650;
    }

    .ok,
    .done,
    .passed {
      color: var(--ok);
    }

    .attention,
    .pending,
    .optional {
      color: var(--warn);
    }

    .failed,
    .error {
      color: var(--danger);
    }

    .timeline {
      display: grid;
      gap: 8px;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .timeline li {
      display: grid;
      grid-template-columns: 12px minmax(0, 1fr);
      gap: 10px;
      align-items: start;
    }

    .timeline-marker {
      width: 10px;
      height: 10px;
      margin-top: 5px;
      border-radius: 999px;
      background: var(--line);
    }

    .timeline-marker.done {
      background: var(--ok);
    }

    .timeline-marker.failed {
      background: var(--danger);
    }

    .timeline-marker.pending {
      background: var(--warn);
    }

    .inline {
      min-height: 28px;
      padding: 0 8px;
    }

    pre {
      margin: 18px 0 0;
      max-height: 46vh;
      overflow: auto;
      padding: 14px;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: #151a21;
      color: #e7edf6;
      font: 12px/1.5 ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }

    dl {
      display: grid;
      grid-template-columns: 150px minmax(0, 1fr);
      gap: 10px 14px;
      margin: 0 0 22px;
    }

    dt {
      color: var(--muted);
    }

    dd {
      margin: 0;
      min-width: 0;
      overflow-wrap: anywhere;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      background: var(--panel);
      border: 1px solid var(--line);
    }

    th,
    td {
      text-align: left;
      padding: 10px 12px;
      border-bottom: 1px solid var(--line);
      vertical-align: top;
      overflow-wrap: anywhere;
    }

    th {
      color: var(--muted);
      font-weight: 600;
      background: #f0f3f8;
    }

    tr[aria-current="true"] {
      background: #edf7f3;
    }

    .file-list {
      margin: 0;
      padding: 0;
      list-style: none;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: var(--panel);
    }

    .file-list li {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      padding: 9px 12px;
      border-bottom: 1px solid var(--line);
      overflow-wrap: anywhere;
    }

    .file-list li:last-child {
      border-bottom: 0;
    }

    @media (max-width: 780px) {
      main {
        grid-template-columns: 1fr;
      }

      aside {
        border-right: 0;
        border-bottom: 1px solid var(--line);
      }

      dl {
        grid-template-columns: 1fr;
      }

      .overview-grid,
      .split-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>Symphony Workbench</h1>
      <p class="subtitle">本地只读控制台，用于查看运行、产物、就绪状态和下一步命令。</p>
    </div>
    <div class="header-actions">
      <span class="badge">只读</span>
      <button id="refresh" type="button">刷新</button>
    </div>
  </header>
  <main>
    <aside>
      <nav id="view-tabs" class="view-tabs" aria-label="Workbench 分区">
        <button class="view-tab" type="button" data-view="overview">总览</button>
        <button class="view-tab" type="button" data-view="adoptions">采纳</button>
        <button class="view-tab" type="button" data-view="runs">运行</button>
        <button class="view-tab" type="button" data-view="diagnostics">诊断</button>
        <button class="view-tab" type="button" data-view="artifacts">产物</button>
      </nav>
      <div id="side-summary" class="stack"></div>
    </aside>
    <section>
      <div id="overview-view" class="view active">
        <div class="view-header">
          <div>
            <h2 class="view-title">总览</h2>
            <div id="overview-headline" class="muted">正在加载总览...</div>
          </div>
          <span id="overview-status" class="badge">加载中</span>
        </div>
        <div class="overview-grid">
          <div>
            <div class="compact-panel">
              <h2>当前 Stage</h2>
              <div id="stage-overview" class="stack"></div>
            </div>
            <div class="compact-panel">
              <h2>最新状态</h2>
              <div id="dashboard" class="dashboard">正在加载...</div>
            </div>
            <div class="compact-panel">
              <h2>当前下一步</h2>
              <div id="commands" class="command-list"></div>
            </div>
          </div>
          <div>
            <div class="compact-panel" id="adoption-banner"></div>
            <div class="compact-panel">
              <h2>前三风险</h2>
              <div id="risk-panel" class="risk-list"></div>
            </div>
          </div>
        </div>
      </div>
      <div id="adoptions-view" class="view">
        <div class="view-header">
          <div>
            <h2 class="view-title">采纳</h2>
            <div class="muted">已冻结补丁计划、日志、恢复状态和仅复制命令。</div>
          </div>
        </div>
        <div class="split-grid">
          <div id="adoptions" class="adoption-list"></div>
          <div id="adoption-detail"></div>
        </div>
      </div>
      <div id="runs-view" class="view">
        <div class="view-header">
          <div>
            <h2 class="view-title">运行记录</h2>
            <div class="muted">历史运行状态和所选运行详情。</div>
          </div>
        </div>
        <div class="split-grid">
          <div>
            <div id="run-filters" class="filter-list"></div>
            <div id="runs" class="run-list"></div>
          </div>
          <div id="details" class="muted">正在加载运行详情...</div>
        </div>
      </div>
      <div id="diagnostics-view" class="view">
        <div class="view-header">
          <div>
            <h2 class="view-title">诊断</h2>
            <div class="muted">完整本地健康模型、就绪状态、风险和仅复制命令分组。</div>
          </div>
        </div>
        <div id="diagnostics"></div>
      </div>
      <div id="artifacts-view" class="view">
        <div class="view-header">
          <div>
            <h2 class="view-title">产物</h2>
            <div class="muted">已登记产物引用和有边界预览。</div>
          </div>
        </div>
        <div id="artifact-workspace"></div>
      </div>
    </section>
  </main>
  <script>
    const state = {
      snapshot: null,
      readiness: null,
      activeView: 'overview',
      selectedRunId: null,
      selectedAdoptionId: null,
      selectedArtifactKind: null,
      artifactPreview: null,
      adoptionInspection: null,
      runFilter: 'all'
    };

    document.getElementById('refresh').addEventListener('click', () => loadSnapshot());
    document.querySelectorAll('[data-view]').forEach((button) => {
      button.addEventListener('click', () => {
        state.activeView = button.dataset.view;
        render();
      });
    });
    loadSnapshot();

    async function loadSnapshot() {
      const responses = await Promise.all([
        fetch('/api/summary', { cache: 'no-store' }),
        fetch('/api/readiness', { cache: 'no-store' })
      ]);
      state.snapshot = await responses[0].json();
      state.readiness = responses[1].ok
        ? await responses[1].json()
        : {
            status: 'attention',
            checks: [],
            recommendedCommands: []
          };
      const selectedExists = state.snapshot.runs.some((run) => run.runId === state.selectedRunId);
      if (!selectedExists) {
        state.selectedRunId = state.snapshot.latestRun?.runId || null;
        state.selectedArtifactKind = null;
        state.artifactPreview = null;
      }
      const selectedAdoptionExists = (state.snapshot.adoptionPlans || [])
        .some((plan) => plan.adoptionPlanId === state.selectedAdoptionId);
      if (!selectedAdoptionExists) {
        state.selectedAdoptionId = (state.snapshot.adoptionPlans || [])[0]?.adoptionPlanId || null;
        state.adoptionInspection = null;
      }
      if (state.selectedAdoptionId) {
        await loadAdoptionInspection(state.selectedAdoptionId, { renderAfter: false });
      }
      enrichSnapshotWithReadiness();
      render();
    }

    function render() {
      renderNavigation();
      renderSideSummary();
      renderViewVisibility();
      renderStageOverview();
      renderDashboard();
      renderAdoptionBanner();
      renderRiskPanel();
      renderCommands();
      renderAdoptions();
      renderRunFilters();
      renderRuns();
      renderDetails();
      renderDiagnosticsView();
      renderArtifactWorkspace();
    }

    function renderNavigation() {
      document.querySelectorAll('[data-view]').forEach((button) => {
        button.setAttribute('aria-current', String(button.dataset.view === state.activeView));
      });
    }

    function renderViewVisibility() {
      document.querySelectorAll('.view').forEach((view) => {
        view.classList.toggle('active', view.id === state.activeView + '-view');
      });
    }

    function renderSideSummary() {
      const side = document.getElementById('side-summary');
      const overview = state.snapshot?.overview || {};
      const adoption = state.snapshot?.adoptionSummary || {};
      const stage = state.snapshot?.stageSummary || {};
      const readiness = state.readiness || {};
      side.replaceChildren(
        compactSummaryBlock('状态', [
          ['Stage', stage.active ? stage.stageId + ' / ' + (stage.status || 'unknown') : 'none'],
          ['总体', overview.status || state.snapshot?.status],
          ['采纳', adoption.status || 'clear'],
          ['就绪状态', readiness.status || 'unknown']
        ]),
        compactSummaryBlock('仅复制', [
          ['下一步', overview.nextAction || state.snapshot?.action?.next || 'symphony scan']
        ])
      );
    }

    function compactSummaryBlock(title, rows) {
      const block = document.createElement('div');
      block.className = 'compact-panel';
      const heading = document.createElement('h2');
      heading.textContent = title;
      block.append(heading, definitionList(rows));
      return block;
    }

    function enrichSnapshotWithReadiness() {
      const adoption = {
        ...(state.snapshot.adoptionSummary || {})
      };
      const pendingCount = adoption.pendingCount || 0;
      const gitDirty = state.readiness?.tools?.git?.dirty === true;

      if (pendingCount > 0 && gitDirty) {
        adoption.dirtyBlocked = true;
        adoption.status = 'dirty-blocked';
      }

      state.snapshot.adoptionSummary = adoption;

      const overview = {
        ...(state.snapshot.overview || {})
      };
      const dirtyRisk = adoption.dirtyBlocked
        ? {
            id: 'dirty_worktree_blocks_adoption',
            category: 'dirty_worktree_blocks_adoption',
            severity: 'high',
            title: '脏工作区阻塞采纳',
            detail: '待采纳内容需要先清理非 Symphony 工作区变更，再执行确认。',
            command: {
              command: 'git status --short',
              mode: 'copy-only'
            }
          }
        : null;
      const risks = dirtyRisk
        ? dedupeRisks([dirtyRisk, ...(overview.topRisks || [])]).slice(0, 3)
        : (overview.topRisks || []).slice(0, 3);

      state.snapshot.overview = {
        ...overview,
        status: adoption.dirtyBlocked ? 'blocked' : overview.status,
        headline: adoption.dirtyBlocked ? '脏工作区阻塞采纳。' : overview.headline,
        topRisks: risks,
        nextAction: adoption.dirtyBlocked ? 'git status --short' : overview.nextAction
      };
    }

    function renderStageOverview() {
      const container = document.getElementById('stage-overview');
      const stage = state.snapshot?.stageSummary;

      if (!stage || !stage.stageId || stage.active !== true || stage.status === 'missing') {
        container.replaceChildren(emptyState('当前没有激活的 Stage。'));
        return;
      }

      const rows = [
        ['Stage', stage.stageId],
        ['目标', stage.goal],
        ['状态', stage.status],
        ['阻塞', stage.blocker?.reason || 'none']
      ];
      const risks = stage.topRisks || [];
      const riskList = document.createElement('div');
      riskList.className = 'risk-list';

      if (risks.length === 0) {
        riskList.append(emptyState('当前 Stage 没有登记风险。'));
      } else {
        riskList.append(...risks.slice(0, 3).map((risk) => riskRow({
          severity: risk.severity,
          title: risk.title,
          detail: risk.detail,
          command: {
            command: 'symphony stage summary',
            mode: 'copy-only'
          }
        })));
      }

      const next = stage.nextAction
        ? commandRow({
            id: 'stage-next',
            label: 'Stage next action',
            command: stage.nextAction,
            description: 'Copy-only Stage advisory command.',
            mode: 'copy-only'
          })
        : emptyState('当前 Stage 没有下一步命令。');

      container.replaceChildren(definitionList(rows), riskList, next);
    }

    function renderDashboard() {
      const dashboard = document.getElementById('dashboard');
      const snapshot = state.snapshot;
      const readiness = state.readiness;
      const latest = snapshot.latestRun;
      const overview = snapshot.overview || {};
      const stats = snapshot.runStats || {};
      const overviewStatus = document.getElementById('overview-status');
      const overviewHeadline = document.getElementById('overview-headline');
      overviewStatus.textContent = formatValue(overview.status || snapshot.status);
      overviewStatus.className = 'badge ' + (overview.status || '');
      overviewHeadline.textContent = headlineLabel(overview.headline) || '当前暂无总览。';
      const metrics = [
        ['状态', overview.status || snapshot.status],
        ['最新运行', latest?.runId || 'none'],
        ['最新状态', latest?.status || 'none'],
        ['运行数', stats.total ?? snapshot.runs.length],
        ['风险数', (overview.topRisks || []).length],
        ['就绪状态', readiness?.status || 'loading'],
        ['Git', readiness?.tools?.git?.status === 'available'
          ? readiness.tools.git.branch + (readiness.tools.git.dirty ? ' 有未提交变更' : ' 干净')
          : readiness?.tools?.git?.status || 'unknown']
      ];

      dashboard.replaceChildren(metricGrid(metrics), latestRunOverview(latest), compactReadinessChecks(readiness));
    }

    function metricGrid(metrics) {
      const grid = document.createElement('div');
      grid.className = 'metric-grid';
      for (const [label, value] of metrics) {
        const metric = document.createElement('div');
        metric.className = 'metric';
        const metricLabel = document.createElement('div');
        metricLabel.className = 'metric-label';
        metricLabel.textContent = label;
        const metricValue = document.createElement('div');
        metricValue.className = 'metric-value';
        metricValue.textContent = formatValue(value);
        metric.append(metricLabel, metricValue);
        grid.append(metric);
      }
      return grid;
    }

    function latestRunOverview(run) {
      if (!run) {
        return emptyState('这个状态目录里还没有最新运行。');
      }

      return definitionList([
        ['命令', run.command],
        ['验证器', run.verifierStatus],
        ['更新时间', run.updatedAt],
        ['下一步', run.nextAction]
      ]);
    }

    function compactReadinessChecks(readiness) {
      if (!readiness) {
        return emptyState('就绪检查不可用。');
      }

      return definitionList([
        ['包管理器', readiness.tools?.packageManager?.status],
        ['Git 未提交变更', formatValue(readiness.tools?.git?.dirty)],
        ['未提交文件数', readiness.tools?.git?.dirtyFilesCount],
        ['GitHub', readiness.tools?.github?.status],
        ['真实 CLI', readiness.tools?.realCli?.status]
      ]);
    }

    function renderRiskPanel() {
      const riskPanel = document.getElementById('risk-panel');
      const dedupedRisks = state.snapshot?.overview?.topRisks || [];

      if (dedupedRisks.length === 0) {
        riskPanel.replaceChildren(emptyState('当前总览中没有可见的高优先级风险。'));
        return;
      }

      riskPanel.replaceChildren(...dedupedRisks.map(riskRow));
    }

    function riskRow(risk) {
      const row = document.createElement('div');
      row.className = 'risk-row ' + (risk.severity || 'low');
      const title = document.createElement('div');
      title.className = 'command-title';
      title.textContent = [riskTitleLabel(risk), severityLabel(risk.severity)].filter(Boolean).join(' / ');
      const detail = document.createElement('div');
      detail.className = 'muted';
      detail.textContent = [risk.runId, riskDetailLabel(risk)].filter(Boolean).join(': ');
      row.append(title, detail);

      if (risk.command?.command) {
        const code = document.createElement('code');
        code.className = 'command-code';
        code.textContent = risk.command.command;
        row.append(code);
      }

      return row;
    }

    function renderCommands() {
      const commands = document.getElementById('commands');
      const nextAction = state.snapshot.overview?.nextAction || state.snapshot.action?.next;
      const allCommands = nextAction
        ? [{
            id: 'overview-next-action',
            label: 'Current next action',
            command: nextAction,
            description: 'Copy-only command from the current local state.',
            mode: 'copy-only'
          }]
        : [];

      if (allCommands.length === 0) {
        commands.replaceChildren(emptyState('当前没有推荐命令。'));
        return;
      }

      commands.replaceChildren(...groupCommands(allCommands).map(commandGroupBlock));
    }

    function commandGroupBlock(group) {
      const wrapper = document.createElement('div');
      wrapper.className = 'command-group';
      const heading = document.createElement('h3');
      heading.textContent = commandGroupLabel(group.group);
      wrapper.append(heading, ...group.commands.map(commandRow));
      return wrapper;
    }

    function commandRow(command) {
      const row = document.createElement('div');
      row.className = 'command-row';
      const body = document.createElement('div');
      const title = document.createElement('div');
      title.className = 'command-title';
      title.textContent = commandLabel(command.label) || '命令';
      const code = document.createElement('code');
      code.className = 'command-code';
      code.textContent = command.command;
      const description = document.createElement('div');
      description.className = 'muted';
      description.textContent = commandDescription(command.description || command.mode || 'copy-only');
      body.append(title, code, description);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'inline';
      button.textContent = '复制';
      button.addEventListener('click', () => copyCommand(command.command, button));
      row.append(body, button);
      return row;
    }

    function renderAdoptionBanner() {
      const banner = document.getElementById('adoption-banner');
      const summary = state.snapshot.adoptionSummary || {};
      const title = document.createElement('h2');
      title.textContent = '采纳摘要';
      const message = document.createElement('div');
      message.className = 'command-title ' + adoptionStatusClass(summary.status);
      message.textContent = adoptionStatusLabel(summary.status);
      banner.replaceChildren(
        title,
        message,
        definitionList([
          ['待确认', summary.pendingCount ?? 0],
          ['应用中', summary.applyingCount ?? 0],
          ['应用后证据失败', summary.postApplyFailedCount ?? 0],
          ['已过期', summary.staleCount ?? 0],
          ['被脏工作区阻塞', formatValue(summary.dirtyBlocked)]
        ])
      );
    }

    function renderAdoptions() {
      const list = document.getElementById('adoptions');
      const detail = document.getElementById('adoption-detail');
      const plans = state.snapshot.adoptionPlans || [];

      if (plans.length === 0) {
        list.replaceChildren(emptyState('这个状态目录里还没有采纳计划。'));
        detail.replaceChildren(emptyState('生成采纳计划后，这里会显示采纳详情。'));
        return;
      }

      list.replaceChildren(...plans.map((plan) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'adoption-button';
        button.setAttribute('aria-current', String(plan.adoptionPlanId === state.selectedAdoptionId));
        button.addEventListener('click', async () => {
          state.selectedAdoptionId = plan.adoptionPlanId;
          await loadAdoptionInspection(plan.adoptionPlanId);
        });
        button.append(text(plan.adoptionPlanId));
        const meta = document.createElement('span');
        meta.className = 'run-meta';
        meta.textContent = [
          formatValue(adoptionStatusForPlan(plan)),
          plan.sourceRunId,
          (plan.changedFiles || []).length + ' 个文件'
        ].filter(Boolean).join(' / ');
        button.append(meta);
        return button;
      }));

      const plan = selectedAdoptionPlan();
      const journal = selectedAdoptionJournal();
      const confirmation = latestConfirmationForAdoption(plan?.adoptionPlanId);
      const inspection = state.adoptionInspection?.adoptionPlanId === plan?.adoptionPlanId
        ? state.adoptionInspection
        : null;

      if (!plan) {
        detail.replaceChildren(emptyState('选择一个采纳计划查看详情。'));
        return;
      }

      detail.replaceChildren(
        detailSection('计划',
          definitionList([
            ['采纳 ID', plan.adoptionPlanId],
            ['状态', adoptionStatusForPlan(plan)],
            ['来源运行', plan.sourceRunId],
            ['执行计划', plan.executionPlanId],
            ['变更文件数', (plan.changedFiles || []).length],
            ['补丁哈希', plan.patchHash],
            ['补丁', plan.patchArtifactPath],
            ['创建时间', plan.createdAt]
          ])
        ),
        detailSection('恢复',
          definitionList([
            ['日志', journal?.adoptionJournalArtifactPath],
            ['日志状态', journal?.status],
            ['最近确认运行', confirmation?.runId],
            ['确认状态', confirmation?.status],
            ['失败阶段', confirmation?.failurePhase],
            ['工作区匹配已采纳文件', matchLabel(inspection?.currentWorktreeMatchesAfterHash)],
            ['工作区不再匹配应用前日志', inverseMatchLabel(inspection?.currentWorktreeMatchesJournalBeforeFiles)]
          ]),
          inspection?.currentWorktreeMatchesAfterHashDetails
            ? jsonBlock('已采纳文件匹配详情', inspection.currentWorktreeMatchesAfterHashDetails)
            : emptyState('这个采纳计划暂无检查数据。可以复制下方 inspect 命令查看。')
        ),
        detailSection('仅复制命令',
          ...adoptionCommands(plan, inspection).map(commandRow)
        )
      );
    }

    async function loadAdoptionInspection(adoptionId, { renderAfter = true } = {}) {
      if (!adoptionId) return;

      const response = await fetch('/api/adoptions/' + encodeURIComponent(adoptionId) + '/inspect', { cache: 'no-store' });
      state.adoptionInspection = await response.json();

      if (renderAfter) {
        render();
      }
    }

    function adoptionCommands(plan, inspection) {
      const commands = inspection?.recommendedCommands || [];

      return dedupeCommands([
        ...commands,
        {
          id: 'inspect-adoption',
          label: 'Inspect adoption',
          command: 'symphony adopt --inspect ' + plan.adoptionPlanId + ' --json',
          description: 'Read-only inspect from the terminal.',
          mode: 'copy-only'
        },
        {
          id: 'confirm-adoption',
          label: 'Confirm adoption',
          command: plan.confirmationCommand,
          description: 'Copy-only terminal command; the browser never runs it.',
          mode: 'copy-only'
        },
        {
          id: 'diagnose',
          label: 'Diagnose',
          command: 'symphony diagnose --json',
          description: 'Show all local diagnostics.',
          mode: 'copy-only'
        },
        {
          id: 'git-status',
          label: 'Git status',
          command: 'git status --short',
          description: 'Inspect dirty worktree blockers.',
          mode: 'copy-only'
        }
      ]);
    }

    function selectedAdoptionPlan() {
      return (state.snapshot.adoptionPlans || [])
        .find((plan) => plan.adoptionPlanId === state.selectedAdoptionId)
        || (state.snapshot.adoptionPlans || [])[0]
        || null;
    }

    function selectedAdoptionJournal() {
      const plan = selectedAdoptionPlan();
      return (state.snapshot.adoptionJournals || [])
        .find((journal) => journal.adoptionPlanId === plan?.adoptionPlanId)
        || null;
    }

    function latestConfirmationForAdoption(adoptionId) {
      if (!adoptionId) return null;

      return (state.snapshot.runs || []).find((run) => run.adoptionPlanId === adoptionId
        && Array.isArray(run.pipeline)
        && run.pipeline.includes('adopt-confirm')) || null;
    }

    function adoptionStatusForPlan(plan) {
      const confirmation = latestConfirmationForAdoption(plan.adoptionPlanId);
      const journal = (state.snapshot.adoptionJournals || [])
        .find((candidate) => candidate.adoptionPlanId === plan.adoptionPlanId);

      if (confirmation?.failurePhase === 'post-apply-evidence') return 'post-apply-failed';
      if (confirmation?.status === 'applying' || journal?.status === 'applying') return 'applying';
      if (confirmation?.failurePhase === 'adoption-confirmation-preflight') return 'stale';
      if (confirmation?.status === 'passed') return 'passed';
      return 'pending';
    }

    function adoptionStatusLabel(status) {
      if (status === 'post-apply-failed') return '补丁已应用，但证据失败';
      if (status === 'applying') return '正在应用采纳';
      if (status === 'dirty-blocked') return '脏工作区阻塞采纳';
      if (status === 'stale') return '采纳计划已过期';
      if (status === 'unsupported') return '采纳变更不受支持';
      if (status === 'pending') return '采纳待确认';
      return '没有待处理采纳';
    }

    function adoptionStatusClass(status) {
      if (status === 'clear') return 'passed';
      if (status === 'pending' || status === 'unsupported') return 'attention';
      return 'failed';
    }

    function matchLabel(value) {
      if (value === true) return '工作区匹配已采纳文件';
      if (value === false) return '工作区不匹配已采纳文件';
      return '未检查';
    }

    function inverseMatchLabel(value) {
      if (value === true) return '工作区仍匹配应用前日志';
      if (value === false) return '工作区已不再匹配应用前日志';
      return '未检查';
    }

    function renderRunFilters() {
      const filters = document.getElementById('run-filters');
      const filterStats = state.snapshot.runStats?.filters || [
        { id: 'all', count: state.snapshot.runs.length },
        { id: 'passed', count: filterRuns(state.snapshot.runs, 'passed').length },
        { id: 'failed', count: filterRuns(state.snapshot.runs, 'failed').length },
        { id: 'dry-run', count: filterRuns(state.snapshot.runs, 'dry-run').length },
        { id: 'real', count: filterRuns(state.snapshot.runs, 'real').length },
        { id: 'scan', count: filterRuns(state.snapshot.runs, 'scan').length },
        { id: 'verify', count: filterRuns(state.snapshot.runs, 'verify').length },
        { id: 'adoption', count: filterRuns(state.snapshot.runs, 'adoption').length }
      ];

      filters.replaceChildren(...filterStats.map((filter) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.setAttribute('aria-current', String(filter.id === state.runFilter));
        button.textContent = filterLabel(filter.id) + ' ' + filter.count;
        button.addEventListener('click', () => {
          state.runFilter = filter.id;
          const visibleRuns = filteredRuns();
          if (!visibleRuns.some((run) => run.runId === state.selectedRunId)) {
            state.selectedRunId = visibleRuns[0]?.runId || state.snapshot.latestRun?.runId || null;
            state.selectedArtifactKind = null;
            state.artifactPreview = null;
          }
          render();
        });
        return button;
      }));
    }

    function renderRuns() {
      const runs = document.getElementById('runs');
      const visibleRuns = filteredRuns();

      if (state.snapshot.runs.length === 0) {
        runs.replaceChildren(emptyState('这个 Symphony 状态目录里还没有运行状态。'));
        return;
      }

      if (visibleRuns.length === 0) {
        runs.replaceChildren(emptyState('没有运行匹配当前筛选：' + filterLabel(state.runFilter)));
        return;
      }

      runs.replaceChildren(...visibleRuns.map((run) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'run-button';
        button.setAttribute('aria-current', String(run.runId === state.selectedRunId));
        button.addEventListener('click', () => {
          state.selectedRunId = run.runId;
          state.selectedArtifactKind = null;
          state.artifactPreview = null;
          render();
        });
        button.append(text(run.command || '运行'));
        const meta = document.createElement('span');
        meta.className = 'run-meta';
        meta.textContent = [run.runId, formatValue(run.status), formatValue(run.verifierStatus)].filter(Boolean).join(' / ');
        button.append(meta);
        return button;
      }));
    }

    function filteredRuns() {
      return filterRuns(state.snapshot.runs || [], state.runFilter);
    }

    function selectedRun() {
      return state.snapshot.runs.find((candidate) => candidate.runId === state.selectedRunId) || state.snapshot.latestRun;
    }

    function renderDetails() {
      const details = document.getElementById('details');
      const run = selectedRun();

      if (!run) {
        details.replaceChildren(emptyState('这个状态目录里还没有最新运行。'));
        return;
      }

      const statusClass = run.status === 'passed' ? 'passed' : run.status === 'failed' ? 'failed' : '';
      details.replaceChildren(
        detailSection('意图',
          definitionList([
            ['运行 ID', run.runId],
            ['命令', run.command],
            ['意图', run.intent],
            ['语义命令', run.semanticCommand],
            ['流水线', formatValue(run.pipeline)],
            ['项目', run.projectRoot],
            ['目标目录', run.targetDir],
            ['模板', run.template],
            ['下一步', run.nextAction]
          ])
        ),
        detailSection('路由',
          definitionList([
            ['提供方模式', run.providerMode],
            ['提供方', run.provider],
            ['提供方状态', run.providerStatus],
            ['复用上下文', formatValue(run.contextReused)]
          ]),
          jsonBlock('路由决策', run.routeDecision),
          jsonBlock('提供方回退', run.providerFallback),
          jsonBlock('匹配信号', run.matchedSignals)
        ),
        detailSection('安全',
          definitionList([
            ['安全模式', run.safetyMode],
            ['项目写入', formatValue(run.projectWrites)],
            ['主工作区写入', formatValue(run.mainWorktreeWrites)],
            ['工作空间写入', formatValue(run.workspaceWrites)],
            ['写入边界', run.writeBoundary],
            ['运行时写入', formatValue(run.runtimeWrites)],
            ['外部调用', formatValue(run.externalCalls)],
            ['破坏性写入', formatValue(run.destructiveWrites)],
            ['需要闸门', run.requiresGate],
            ['模型调用', formatValue(run.modelInvocation)]
          ]),
          jsonBlock('不支持的请求', run.unsupportedRequests)
        ),
        detailSection('执行',
          definitionList([
            ['状态', run.status, statusClass],
            ['工作流模式', run.workflowMode],
            ['适配器', run.adapter],
            ['执行模式', run.executionMode],
            ['执行计划', run.executionPlanId],
            ['计划运行', run.plannedRunId],
            ['采纳计划', run.adoptionPlanId],
            ['来源运行', run.sourceRunId],
            ['补丁', run.patchArtifactPath],
            ['补丁哈希', run.patchHash],
            ['日志', run.adoptionJournalArtifactPath],
            ['确认命令', run.confirmationCommand],
            ['创建时间', run.createdAt],
            ['更新时间', run.updatedAt]
          ])
        ),
        detailSection('验证',
          definitionList([
            ['验证器', run.verifierStatus],
            ['推荐工作流', run.recommendedWorkflow],
            ['验证命令', formatValue(run.verificationCommands)]
          ]),
          timelineBlock(run),
          commandBlock(run)
        ),
        detailSection('产物',
          definitionList([
            ['产物健康', run.artifactHealth?.status],
            ['产物状态', run.artifactStatus?.status],
            ['缺失产物数', run.artifactStatus?.missing]
          ]),
          artifactTable(run),
          artifactPreviewBlock()
        ),
        detailSection('变更',
          jsonBlock('变更文件', run.changedFiles),
          jsonBlock('文件操作', run.fileOperations),
          jsonBlock('不支持的采纳变更', run.unsupportedChanges),
          jsonBlock('创建文件', run.createdFiles),
          jsonBlock('脚手架计划', run.scaffoldPlan)
        )
      );
    }

    function renderDiagnosticsView() {
      const diagnostics = document.getElementById('diagnostics');
      const risks = combinedDiagnosticRisks();

      diagnostics.replaceChildren(
        detailSection('风险列表',
          risks.length === 0
            ? emptyState('当前状态没有可见诊断风险。')
            : (() => {
                const list = document.createElement('div');
                list.className = 'risk-list';
                list.replaceChildren(...risks.map(riskRow));
                return list;
              })()
        ),
        detailSection('就绪详情',
          readinessDetailsBlock()
        ),
        detailSection('仅复制命令',
          ...dedupeCommands([
            ...(state.snapshot.recommendedCommands || []),
            ...(state.readiness?.recommendedCommands || []),
            ...(selectedRun()?.recommendedCommands || [])
          ]).map(commandRow)
        ),
        detailSection('原始快照',
          jsonBlock('控制台快照', state.snapshot),
          jsonBlock('就绪状态', state.readiness)
        )
      );
    }

    function renderArtifactWorkspace() {
      const workspace = document.getElementById('artifact-workspace');
      const run = selectedRun();

      if (!run) {
        workspace.replaceChildren(emptyState('还没有选择用于预览产物的运行。'));
        return;
      }

      workspace.replaceChildren(
        detailSection('已选运行',
          definitionList([
            ['运行 ID', run.runId],
            ['产物健康', run.artifactHealth?.status],
            ['产物状态', run.artifactStatus?.status],
            ['登记引用数', (run.artifactRefs || []).length]
          ])
        ),
        detailSection('已登记产物引用',
          artifactTable(run),
          artifactPreviewBlock()
        )
      );
    }

    function combinedDiagnosticRisks() {
      const risks = [
        ...(state.snapshot?.riskSummary?.items || []),
        ...(selectedRun()?.riskSummary?.items || []),
        ...(state.readiness?.riskSummary?.items || [])
      ];
      const adoption = state.snapshot?.adoptionSummary || {};

      if (adoption.dirtyBlocked === true) {
        risks.push({
          id: 'dirty_worktree_blocks_adoption',
          category: 'dirty_worktree_blocks_adoption',
          severity: 'high',
          title: '脏工作区阻塞采纳',
          detail: '待采纳内容需要先清理非 Symphony 工作区变更，再执行确认。',
          command: {
            command: 'git status --short',
            mode: 'copy-only'
          }
        });
        risks.push({
          id: 'adoption_dirty_file_details',
          category: 'adoption_dirty_file_details',
          severity: 'high',
          title: '采纳阻塞文件详情',
          detail: (state.readiness?.tools?.git?.dirtyFilesCount ?? 0) + ' 个未提交文件会阻塞采纳确认。',
          dirtyPaths: state.readiness?.tools?.git?.dirtyPaths,
          dirtyPathCount: state.readiness?.tools?.git?.dirtyFilesCount,
          command: {
            command: 'git status --short',
            mode: 'copy-only'
          }
        });
      }

      return dedupeRisks(risks);
    }

    function readinessDetailsBlock() {
      if (!state.readiness) {
        return emptyState('就绪状态不可用。');
      }

      const wrapper = document.createElement('div');
      wrapper.className = 'stack';
      wrapper.append(...[
        definitionList([
          ['状态', state.readiness.status],
          ['只读', formatValue(state.readiness.readOnly)],
          ['模型调用', formatValue(state.readiness.modelInvocation)],
          ['Git 未提交路径', formatValue(state.readiness.tools?.git?.dirtyPaths)]
        ]),
        jsonBlock('就绪检查', state.readiness.checks),
        jsonBlock('就绪工具', state.readiness.tools)
      ].filter(Boolean));
      return wrapper;
    }

    function detailSection(title, ...children) {
      const wrapper = document.createElement('div');
      wrapper.className = 'detail-section';
      const heading = document.createElement('h2');
      heading.textContent = title;
      wrapper.append(heading, ...children.filter(Boolean));
      return wrapper;
    }

    function definitionList(rows) {
      const list = document.createElement('dl');
      for (const [label, value, className] of rows) {
        if (value === undefined || value === null) continue;
        const term = document.createElement('dt');
        term.textContent = label;
        const data = document.createElement('dd');
        data.textContent = formatValue(value);
        if (className) data.className = 'status ' + className;
        list.append(term, data);
      }
      return list;
    }

    function timelineBlock(run) {
      if (!Array.isArray(run.timeline) || run.timeline.length === 0) {
        return emptyState('这个运行没有时间线。');
      }

      const wrapper = document.createElement('div');
      wrapper.className = 'section-block';
      const heading = document.createElement('h2');
      heading.textContent = '时间线';
      const list = document.createElement('ul');
      list.className = 'timeline';
      for (const event of run.timeline) {
        const item = document.createElement('li');
        const marker = document.createElement('span');
        marker.className = 'timeline-marker ' + (event.status || '');
        const body = document.createElement('div');
        const title = document.createElement('div');
        title.className = 'command-title ' + (event.status || '');
        title.textContent = timelineLabel(event.label) + ': ' + formatValue(event.status);
        const detail = document.createElement('div');
        detail.className = 'muted';
        const eventDetail = event.detail === undefined || event.detail === null ? '' : formatValue(event.detail);
        detail.textContent = [eventDetail, event.at].filter(Boolean).join(' / ');
        body.append(title, detail);
        item.append(marker, body);
        list.append(item);
      }
      wrapper.append(heading, list);
      return wrapper;
    }

    function commandBlock(run) {
      if (!Array.isArray(run.recommendedCommands) || run.recommendedCommands.length === 0) {
        return emptyState('这个运行没有专属命令。');
      }

      const wrapper = document.createElement('div');
      wrapper.className = 'section-block';
      const heading = document.createElement('h2');
      heading.textContent = '运行命令';
      const list = document.createElement('div');
      list.className = 'command-list';
      list.replaceChildren(...run.recommendedCommands.map(commandRow));
      wrapper.append(heading, list);
      return wrapper;
    }

    function jsonBlock(title, value) {
      if (value === undefined || value === null) return null;
      if (Array.isArray(value) && value.length === 0) return null;

      const wrapper = document.createElement('div');
      wrapper.className = 'stack';
      const heading = document.createElement('h3');
      heading.textContent = title;
      wrapper.append(heading, codeBlock(JSON.stringify(value, null, 2)));
      return wrapper;
    }

    function artifactTable(run) {
      const artifactRefs = run.artifactRefs || [];

      if (artifactRefs.length === 0) {
        return emptyState('这个运行没有登记产物引用。');
      }

      const table = document.createElement('table');
      const head = document.createElement('thead');
      head.innerHTML = '<tr><th>产物</th><th>路径</th><th>预览</th></tr>';
      const body = document.createElement('tbody');
      for (const artifact of artifactRefs) {
        const row = document.createElement('tr');
        const kind = document.createElement('td');
        const path = document.createElement('td');
        const action = document.createElement('td');
        const button = document.createElement('button');
        row.setAttribute('aria-current', String(artifact.kind === state.selectedArtifactKind));
        kind.textContent = artifact.kind;
        path.textContent = artifact.path;
        button.type = 'button';
        button.className = 'inline';
        button.setAttribute('aria-current', String(artifact.kind === state.selectedArtifactKind));
        button.textContent = artifact.kind === state.selectedArtifactKind ? '已选' : '预览';
        button.addEventListener('click', () => loadArtifact(run.runId, artifact.kind));
        action.append(button);
        row.append(kind, path, action);
        body.append(row);
      }
      table.append(head, body);
      return table;
    }

    async function loadArtifact(runId, kind) {
      const response = await fetch('/api/runs/' + encodeURIComponent(runId) + '/artifacts/' + encodeURIComponent(kind), { cache: 'no-store' });
      state.artifactPreview = await response.json();
      state.selectedArtifactKind = kind;
      renderDetails();
      renderArtifactWorkspace();
    }

    function artifactPreviewBlock() {
      if (!state.artifactPreview) {
        const empty = document.createElement('div');
        empty.className = 'muted';
        empty.textContent = '选择一个产物后，会在这里显示预览。';
        return empty;
      }

      const artifact = state.artifactPreview.artifact;
      const panel = document.createElement('div');
      panel.className = 'preview-panel';

      if (!artifact) {
        panel.append(codeBlock(JSON.stringify(state.artifactPreview, null, 2)));
        return panel;
      }

      const heading = document.createElement('h2');
      heading.textContent = '产物预览：' + artifact.kind;
      panel.append(heading);

      if (artifact.type === 'missing') {
        panel.append(emptyState('产物已登记，但文件缺失：' + artifact.path, 'error'));
        return panel;
      }

      if (artifact.type === 'directory') {
        panel.append(emptyState('目录预览最多显示 ' + (artifact.limit || 100) + ' 项；总数：' + (artifact.entryCount ?? '未知') + '。'));
        const list = document.createElement('ul');
        list.className = 'file-list';
        for (const entry of artifact.entries || []) {
          const item = document.createElement('li');
          const name = document.createElement('span');
          const type = document.createElement('span');
          name.textContent = entry.name;
          type.className = 'muted';
          type.textContent = formatValue(entry.type);
          item.append(name, type);
          list.append(item);
        }
        panel.append(list);
        if (artifact.truncated) {
          panel.append(emptyState('目录预览已截断到 ' + (artifact.limit || 100) + ' 项。'));
        }
        return panel;
      }

      if (artifact.format === 'malformed-json') {
        panel.append(emptyState('JSON 产物格式异常。' + (artifact.parseError || '原始内容显示如下。'), 'error'));
        panel.append(codeBlock(artifact.content || ''));
        return panel;
      }

      const block = codeBlock(artifact.format === 'json'
        ? JSON.stringify(artifact.json, null, 2)
        : artifact.content);

      if (artifact.truncated) {
        block.textContent += '\\n\\n[预览已截断：' + formatBytes(artifact.previewLimitBytes) + ' / ' + formatBytes(artifact.size) + ']';
      }

      panel.append(block);
      return panel;
    }

    function emptyState(message, className = 'muted') {
      const empty = document.createElement('div');
      empty.className = 'empty-state ' + className;
      empty.textContent = message;
      return empty;
    }

    function codeBlock(value) {
      const block = document.createElement('pre');
      block.textContent = value;
      return block;
    }

    function formatValue(value) {
      if (value === undefined || value === null) return '无';
      if (Array.isArray(value)) return value.length === 0 ? '无' : value.map(formatValue).join(', ');
      if (typeof value === 'boolean') return value ? '是' : '否';
      if (typeof value === 'object' && value !== null) return JSON.stringify(value);
      return valueLabel(String(value));
    }

    function formatPercent(value) {
      if (typeof value !== 'number') return '无';
      return Math.round(value * 100) + '%';
    }

    function formatBytes(value) {
      if (typeof value !== 'number') return '大小未知';
      if (value >= 1024 * 1024) return Math.round(value / (1024 * 1024)) + ' MiB';
      if (value >= 1024) return Math.round(value / 1024) + ' KiB';
      return value + ' B';
    }

    function valueLabel(value) {
      const labels = {
        'adopt': '采纳',
        'adoption': '采纳',
        'adoption-planned': '采纳已计划',
        'applying': '应用中',
        'attention': '需关注',
        'authenticated': '已认证',
        'available': '可用',
        'blocked': '已阻塞',
        'builtin': '内置',
        'clean': '干净',
        'clear': '无待处理采纳',
        'copy-only': '仅复制',
        'dirty': '有未提交变更',
        'dirty-blocked': '脏工作区阻塞',
        'done': '完成',
        'dry-run': '演练',
        'failed': '失败',
        'file': '文件',
        'directory': '目录',
        'high': '高',
        'inspected': '已检查',
        'low': '低',
        'medium': '中',
        'loading': '加载中',
        'missing': '缺失',
        'no-runs': '暂无运行',
        'none': '无',
        'not-run': '未运行',
        'ok': '正常',
        'passed': '通过',
        'pending': '待确认',
        'post-apply-failed': '应用后证据失败',
        'read-only': '只读',
        'ready': '就绪',
        'real': '真实执行',
        'scan': '扫描',
        'skipped': '已跳过',
        'stale': '已过期',
        'true': '是',
        'unknown': '未知',
        'unavailable': '不可用',
        'unsupported': '不支持',
        'verify': '验证',
        'write': '写入'
      };

      return labels[value] || value;
    }

    function headlineLabel(value) {
      if (!value) return '';

      const labels = {
        'No Symphony runs found yet.': '还没有找到 Symphony 运行。',
        'Patch applied, evidence failed.': '补丁已应用，但证据失败。',
        'Adoption apply is in progress or needs recovery inspection.': '采纳应用正在进行，或需要恢复检查。',
        'Dirty worktree blocks adoption.': '脏工作区阻塞采纳。',
        '脏工作区阻塞采纳。': '脏工作区阻塞采纳。',
        'Adoption plan is stale and needs inspection.': '采纳计划已过期，需要检查。',
        'Pending adoption is ready for review.': '待采纳内容已准备好评审。',
        'Readiness needs attention before the next run.': '下一次运行前需要处理就绪状态。',
        'Latest run passed and no high-priority risks are visible.': '最新运行已通过，当前没有高优先级风险。'
      };
      if (labels[value]) return labels[value];

      const latestRunMatch = /^Latest run is (.+)\\.$/u.exec(value);
      if (latestRunMatch) {
        return '最新运行状态：' + formatValue(latestRunMatch[1]) + '。';
      }

      return riskTitleLabel({ title: value });
    }

    function severityLabel(value) {
      if (!value) return '';
      return valueLabel(value) + '风险';
    }

    function riskTitleLabel(risk) {
      const labels = {
        'Run failed': '运行失败',
        'Verifier failed': '验证器失败',
        'Unsupported requests': '不支持的请求',
        'External calls': '外部调用',
        'Project writes': '项目写入',
        'Runtime writes': '运行时写入',
        'Missing artifacts': '产物缺失',
        'Pending adoption': '采纳待确认',
        'Unsupported adoption changes': '不支持的采纳变更',
        'Stale adoption': '采纳已过期',
        'Adoption apply in progress': '采纳应用中',
        'Adoption post-apply evidence failed': '采纳应用后证据失败',
        'Dirty worktree blocks adoption': '脏工作区阻塞采纳',
        '脏工作区阻塞采纳': '脏工作区阻塞采纳',
        'Adoption dirty file details': '采纳阻塞文件详情',
        '采纳阻塞文件详情': '采纳阻塞文件详情',
        'pnpm unavailable': 'pnpm 不可用',
        'Git unavailable': 'Git 不可用',
        'Dirty git worktree': 'Git 工作区有未提交变更',
        'GitHub auth unavailable': 'GitHub 认证不可用',
        'GitHub CI unavailable': 'GitHub CI 不可用'
      };

      if (labels[risk?.title]) return labels[risk.title];

      const unavailableMatch = /^(.+) unavailable$/u.exec(risk?.title || '');
      if (unavailableMatch) return unavailableMatch[1] + ' 不可用';

      return risk?.title || risk?.category || '';
    }

    function riskDetailLabel(risk) {
      if (!risk?.detail) return '';

      const labels = {
        'Pending adoption requires a clean non-Symphony worktree before confirmation.': '待采纳内容需要先清理非 Symphony 工作区变更，再执行确认。',
        '待采纳内容需要先清理非 Symphony 工作区变更，再执行确认。': '待采纳内容需要先清理非 Symphony 工作区变更，再执行确认。'
      };
      if (labels[risk.detail]) return labels[risk.detail];

      const patterns = [
        [/^(.+) ended with status failed\\.$/u, (match) => match[1] + ' 结束时状态为失败。'],
        [/^(.+) has verifierStatus=failed\\.$/u, (match) => match[1] + ' 的验证器状态为失败。'],
        [/^(\\d+) unsupported request\\(s\\) were recorded\\.$/u, (match) => '记录了 ' + match[1] + ' 个不支持的请求。'],
        [/^(.+) recorded externalCalls=true\\.$/u, () => '记录了外部调用。'],
        [/^(.+) recorded projectWrites=true\\.$/u, () => '记录了项目写入。'],
        [/^(.+) wrote Symphony runtime artifacts\\.$/u, () => '写入了 Symphony 运行时产物。'],
        [/^(\\d+) registered artifact\\(s\\) are missing\\.$/u, (match) => '缺失 ' + match[1] + ' 个已登记产物。'],
        [/^(.+) has a frozen adoption plan waiting for confirmation\\.$/u, () => '有一个已冻结采纳计划正在等待确认。'],
        [/^(\\d+) unsupported source change\\(s\\) blocked adoption planning\\.$/u, (match) => match[1] + ' 个不支持的来源变更阻塞了采纳计划。'],
        [/^(.+) reached the main-worktree apply phase\\.$/u, () => '已进入主工作区应用阶段。'],
        [/^(\\d+) dirty file\\(s\\) may affect run trust\\.$/u, (match) => match[1] + ' 个未提交文件可能影响运行可信度。'],
        [/^(.+) was not available for optional real-agent checks\\.$/u, (match) => match[1] + ' 不可用，无法执行可选真实代理检查。']
      ];

      for (const [pattern, format] of patterns) {
        const match = pattern.exec(risk.detail);
        if (match) return format(match);
      }

      return formatValue(risk.detail);
    }

    function commandLabel(label) {
      const labels = {
        'Check CI': '检查 CI',
        'Check GitHub auth': '检查 GitHub 认证',
        'Check environment': '检查环境',
        'Check git': '检查 Git',
        'Check pnpm': '检查 pnpm',
        'Confirm adoption': '确认采纳',
        'Continue safely': '安全继续',
        'Current next action': '当前下一步',
        'Diagnose': '诊断',
        'Diff summary': '差异摘要',
        'Doctor': '环境体检',
        'Dry-run work': '演练工作',
        'Enable pnpm': '启用 pnpm',
        'Git status': 'Git 状态',
        'GitHub login': 'GitHub 登录',
        'Inspect adoption': '检查采纳',
        'Inspect dirty git': '查看 Git 未提交变更',
        'Open workbench': '打开 Workbench',
        'Real Claude gate': '真实 Claude 闸门',
        'Real Codex gate': '真实 Codex 闸门',
        'Real Kiro gate': '真实 Kiro 闸门',
        'Scan project': '扫描项目',
        'Static check': '静态检查',
        'Status': '状态',
        'Suggested next': '建议下一步',
        'Tests': '测试',
        'Artifacts': '产物'
      };

      return labels[label] || label;
    }

    function commandDescription(description) {
      const labels = {
        'Check the base CLI environment.': '检查基础 CLI 环境。',
        'Apply the frozen adoption patch from the terminal after reviewing it.': '评审后，从终端应用已冻结的采纳补丁。',
        'Confirm pnpm is available on PATH.': '确认 PATH 上可以使用 pnpm。',
        'Confirm the console is running inside a git worktree.': '确认控制台运行在 Git 工作区内。',
        'Confirm whether this optional real CLI is installed.': '确认这个可选真实 CLI 是否已安装。',
        'Copy the next action recorded by the latest run.': '复制最新运行记录的下一步命令。',
        'Copy-only command from the current local state.': '来自当前本地状态的仅复制命令。',
        'Copy-only terminal command; the browser never runs it.': '仅复制终端命令，浏览器不会执行。',
        'Create the first read-only project context.': '创建第一个只读项目上下文。',
        'Exercise the work path without project writes.': '在不写入项目的情况下演练工作路径。',
        'External execution example; copy only and run intentionally.': '外部执行示例；只复制，并在确认后自行运行。',
        'Inspect all Workbench diagnostics as JSON.': '以 JSON 查看全部 Workbench 诊断。',
        'Inspect dirty worktree blockers.': '查看阻塞采纳的工作区变更。',
        'Inspect GitHub CLI auth without exposing tokens.': '检查 GitHub CLI 认证，不暴露令牌。',
        'Inspect recent GitHub Actions runs.': '查看最近的 GitHub Actions 运行。',
        'Make the package manager shim available before rechecking.': '重新检查前启用包管理器 shim。',
        'Print registered artifact references for this run.': '打印这个运行登记的产物引用。',
        'Print the latest Symphony run state.': '打印最新 Symphony 运行状态。',
        'Read adoption plan, journal, and current worktree match status.': '读取采纳计划、日志和当前工作区匹配状态。',
        'Read-only inspect from the terminal.': '在终端执行只读检查。',
        'Read the latest product state.': '读取最新产品状态。',
        'Return to this read-only dashboard.': '返回这个只读看板。',
        'Review uncommitted files before trusting run evidence.': '信任运行证据前查看未提交文件。',
        'Run repository syntax checks.': '运行仓库语法检查。',
        'Run the repository test suite.': '运行仓库测试套件。',
        'See the shape of unstaged changes.': '查看未暂存变更概览。',
        'Show all local diagnostics.': '显示全部本地诊断。',
        'Start GitHub CLI authentication if needed.': '需要时启动 GitHub CLI 认证。',
        'Start this local read-only workbench.': '启动这个本地只读 Workbench。',
        'copy-only': '仅复制'
      };

      return labels[description] || riskDetailLabel({ detail: description }) || formatValue(description);
    }

    function commandGroupLabel(group) {
      const labels = {
        'Adoptions': '采纳',
        'Artifacts': '产物',
        'Inspect': '检查',
        'Real-agent gates': '真实代理闸门',
        'Verify': '验证'
      };

      return labels[group] || group;
    }

    function filterLabel(filter) {
      const labels = {
        all: '全部',
        passed: '通过',
        failed: '失败',
        'dry-run': '演练',
        real: '真实执行',
        scan: '扫描',
        verify: '验证',
        adoption: '采纳'
      };

      return labels[filter] || filter;
    }

    function timelineLabel(label) {
      const labels = {
        'Run created': '运行创建',
        'Route decision': '路由决策',
        'Safety boundary': '安全边界',
        'Execution': '执行',
        'Verifier': '验证器',
        'Artifacts': '产物'
      };

      return labels[label] || label;
    }

    function dedupeCommands(commands) {
      const seen = new Set();
      const deduped = [];

      for (const command of commands) {
        if (!command || !command.command || seen.has(command.command)) continue;
        seen.add(command.command);
        deduped.push(command);
      }

      return deduped;
    }

    function groupCommands(commands) {
      const order = ['Inspect', 'Adoptions', 'Verify', 'Artifacts', 'Real-agent gates'];
      const groups = new Map(order.map((group) => [group, []]));

      for (const command of dedupeCommands(commands)) {
        const group = command.group || commandGroupFor(command.command);
        if (!groups.has(group)) groups.set(group, []);
        groups.get(group).push({ ...command, group });
      }

      return [...groups.entries()]
        .filter(([, groupCommands]) => groupCommands.length > 0)
        .map(([group, groupCommands]) => ({ group, commands: groupCommands }));
    }

    function commandGroupFor(command) {
      const value = String(command || '');
      if (/MCAS_RUN_REAL_|--real/u.test(value)) return 'Real-agent gates';
      if (/\\badopt\\b/u.test(value)) return 'Adoptions';
      if (/artifacts?/u.test(value)) return 'Artifacts';
      if (/\\b(check|test|verify|audit|diff --check)\\b/u.test(value)) return 'Verify';
      return 'Inspect';
    }

    function filterRuns(runs, filter) {
      if (filter === 'all') return runs;
      return runs.filter((run) => runMatchesFilter(run, filter));
    }

    function runMatchesFilter(run, filter) {
      if (filter === 'passed') return run.status === 'passed' || run.verifierStatus === 'passed';
      if (filter === 'failed') return run.status === 'failed' || run.verifierStatus === 'failed';
      if (filter === 'dry-run') return run.safetyMode === 'dry-run' || run.executionMode === 'dry-run';
      if (filter === 'real') return run.executionMode === 'real';
      if (filter === 'scan') return run.semanticCommand === 'scan' || run.intent === 'scan-project' || /\\bscan\\b/u.test(run.command || '');
      if (filter === 'verify') return run.semanticCommand === 'verify' || run.intent === 'verify' || /\\b(verify|qa)\\b/u.test(run.command || '');
      if (filter === 'adoption') return run.semanticCommand === 'adopt'
        || run.intent === 'adopt'
        || run.adoptionPlanId !== undefined
        || run.adoptionJournalArtifactPath !== undefined
        || (Array.isArray(run.pipeline) && run.pipeline.some((step) => /^adopt/u.test(step)));
      return true;
    }

    function dedupeRisks(risks) {
      const seen = new Set();
      const deduped = [];

      for (const risk of risks) {
        const key = risk.id || [risk.title, risk.runId, risk.detail].join(':');
        if (seen.has(key)) continue;
        seen.add(key);
        deduped.push(risk);
      }

      return deduped;
    }

    async function copyCommand(command, button) {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(command);
        button.textContent = '已复制';
        setTimeout(() => {
          button.textContent = '复制';
        }, 1200);
        return;
      }

      window.prompt('复制命令', command);
    }

    function text(value) {
      return document.createTextNode(value);
    }
  </script>
</body>
</html>`;
}
