const MISSING_TEXT = '未暴露';
const UNAVAILABLE_TEXT = '不可用';
const NOT_APPLICABLE_TEXT = '不适用';
const HANDOFF_API_BASE = '/api/handoff';
const GUIDED_GOAL_HANDOFF_CONTRACT_NAME = 'guided-goal-handoff.v1';
const SAFE_ARTIFACT_PREVIEW_CONTRACT_NAME = 'safe-artifact-preview.v1';
const GOAL_PROGRESS_LEDGER_CONTRACT_NAME = 'goal-progress-ledger.v1';
const GOAL_EVENT_LOG_CONTRACT_NAME = 'goal-event-log.v1';
const GOAL_OPERATION_RUNS_CONTRACT_NAME = 'goal-operation-runs.v1';
const GOAL_UPDATE_PLAN_CONTRACT_NAME = 'goal-update-plan.v1';
const GOAL_RUNBOOK_CONTRACT_NAME = 'goal-runbook.v1';
const GOAL_NEXT_ACTION_CONTRACT_NAME = 'goal-next-action.v1';
const GOAL_SUPERVISOR_APP_READ_MODEL_CONTRACT_NAME = 'goal-supervisor-app-read-model.v1';
const GOAL_PROMPT_PACK_CONTRACT_NAME = 'goal-prompt-pack.v1';
const GOAL_CLOSEOUT_REPORT_CONTRACT_NAME = 'goal-closeout-report.v1';
const CONTROLLED_IMPLEMENTATION_PLAN_PREVIEW_CONTRACT_NAME = 'controlled-implementation-plan-preview.v1';
const CONTROLLED_IMPLEMENTATION_RUN_CONFIRMATION_CONTRACT_NAME = 'controlled-implementation-run-confirmation.v1';
const CONTROLLED_PROVIDER_RUNNER_PLAN_PREVIEW_CONTRACT_NAME = 'controlled-provider-runner-plan-preview.v1';
const CONTROLLED_PROVIDER_RUNNER_CONFIRMATION_CONTRACT_NAME = 'controlled-provider-runner-confirmation.v1';
const CONTROLLED_ADOPTION_PLAN_FREEZE_CONTRACT_NAME = 'controlled-adoption-plan-freeze.v1';
const CONTROLLED_ADOPTION_CONFIRM_CONTRACT_NAME = 'controlled-adoption-confirmation.v1';
const CONSOLE_ADOPTION_INSPECT_CONTRACT_NAME = 'symphony.console-adoption-inspect';
const RELEASE_BASELINE_RESOLVER_CONTRACT_NAME = 'release-baseline-resolver.v1';
const APP_STATE_SNAPSHOT_CONTRACT_NAME = 'app-state-snapshot.v1';
const APP_DATA_INVENTORY_CONTRACT_NAME = 'app-data-inventory.v1';
const INBOX_CAPTURE_CONTRACT_NAME = 'inbox-capture.v1';
const CAPABILITIES_CONTRACT_NAME = 'capabilities.v1';
const ACTION_MANIFEST_CONTRACT_NAME = 'action-manifest.v1';
const ACTION_AVAILABILITY_CONTRACT_NAME = 'action-availability.v1';
const ACTION_PREVIEW_CONTRACT_NAME = 'action-preview.v1';
const GOAL_DRAFT_HANDOFF_CONTRACT_NAME = 'goal-draft-handoff.v1';
const AGENT_CLI_PROVIDER_HEALTH_CONTRACT_NAME = 'agent-cli-provider-health.v1';
const AGENT_CLI_CAPABILITY_PROFILE_CONTRACT_NAME = 'agent-cli-capability-profile.v1';
const AGENT_CLI_LANE_ASSIGNMENT_PREVIEW_CONTRACT_NAME = 'agent-cli-lane-assignment-preview.v1';
const APP_SCHEMA_MIGRATION_CONTRACT_NAME = 'app-schema-migration.v1';
const WORKFLOW_ROUTER_CATEGORIES_CONTRACT_NAME = 'workflow-router-categories.v1';
const JOB_MODEL_CONTRACT_NAME = 'job-model.v1';
const JOB_CREATION_CONTRACT_NAME = 'job-creation.v1';
const JOB_TIMELINE_LOG_STREAM_CONTRACT_NAME = 'job-timeline-log-stream.v1';
const JOB_RUN_CONTROL_CONTRACT_NAME = 'job-run-control.v1';
const DIAGNOSTICS_CONTRACT_NAME = 'diagnostics.v1';
const APP_CORE_DIAGNOSTICS_BUNDLE_CONTRACT_NAME = 'app-core-diagnostics-bundle.v1';
const APP_CORE_RESTORE_VALIDATION_CONTRACT_NAME = 'app-core-restore-validation.v1';
const ARTIFACT_INDEX_CONTRACT_NAME = 'artifact-index.v1';
const EVIDENCE_TIMELINE_CONTRACT_NAME = 'evidence-timeline.v1';
const RELEASE_BUNDLE_CONTRACT_NAME = 'release-bundle.v1';
const EVIDENCE_BUNDLE_CONTRACT_NAME = 'evidence-bundle.v1';
const APP_CORE_BACKUP_EXPORT_CONTRACT_NAME = 'app-core-backup-export.v1';
const APP_CORE_RELEASE_MANAGER_CONTRACT_NAME = 'app-core-release-manager.v1';
const PROJECT_REGISTRY_CONTRACT_NAME = 'project-registry.v1';
const RECENT_PROJECTS_CONTRACT_NAME = 'recent-projects.v1';
const CURRENT_PROJECT_BINDING_CONTRACT_NAME = 'current-project-binding.v1';
const ERROR_ENVELOPE_CONTRACT_NAME = 'error-envelope.v1';
const MATRIX_MISSING_TEXT = 'missing';
const MATRIX_UNKNOWN_TEXT = 'unknown';
const ACTIVE_GOAL_VIEW_MODEL_NAME = 'ActiveGoalViewModel';
const ACTION_REGISTRY_PANEL_MODEL_NAME = 'ActionRegistryPanel';
const ACTIVE_TASK_IMPLEMENTATION_ELIGIBILITY_MODEL_NAME = 'ActiveTaskImplementationEligibility';
const GOAL_EVENT_FORM_MODEL_NAME = 'GoalEventRegistrationFormModel';
const REVIEW_WORKSPACE_MODEL_NAME = 'ReviewWorkspaceContextModel';
const MAIN_VERIFICATION_EVIDENCE_DRAFT_MODEL_NAME = 'MainVerificationEvidenceDraftWriter';
const RELEASE_CLOSEOUT_WORKSPACE_MODEL_NAME = 'ReleaseCloseoutWorkspaceModel';
const RELEASE_BASELINE_RESOLVER_MODEL_NAME = 'ReleaseBaselineResolver';
const RELEASE_EVIDENCE_DRAFT_MODEL_NAME = 'ReleaseEvidenceDraftWriter';
const TAG_EVIDENCE_DRAFT_MODEL_NAME = 'TagEvidenceDraftWriter';
const NEXT_VERSION_HANDOFF_DRAFT_MODEL_NAME = 'NextVersionHandoffDraft';
const EVIDENCE_REF_HELPER_NAME = 'EvidenceRefHelper';
const PROVIDER_HUB_PANEL_MODEL_NAME = 'ProviderHubPanel';
const V25_CONTROLLED_IMPLEMENTATION_GOAL_ID = 'v25-controlled-implementation-lane';
const V41_CONTROLLED_PROVIDER_RUNNER_GOAL_ID = 'v41-controlled-cli-provider-runner-backend-completion';
const V30_VERIFIED_ADOPTION_GOAL_ID = 'v30-verified-adoption-workspace-v2';
const EVIDENCE_REF_HELPER_RECENT_LIMIT = 8;
const EVIDENCE_REF_ACCEPTED_PATTERNS = Object.freeze([
  'docs/plans/<file>',
  'repo-doc:docs/plans/<file>',
  'artifact-ref:<managed-artifact-ref>',
  'artifact:<run-id>:<artifact-kind>',
  'artifacts/<managed-ref>',
  'managed-artifact:<managed-ref>'
]);
const NATIVE_UX_HANDOFF_SCOPE = Object.freeze([
  'Menu bar companion: active goal, next action, job state, provider gates, and evidence refs.',
  'Notch companion: glanceable running or blocked state, next operator action, and latest safe evidence anchor.',
  'Native distribution: desktop packaging, signed build evidence, update boundary, and colleague install notes.',
  'UX polish: capture-to-router entry, goal draft handoff, closeout state, and safe preview continuity across Web/Desktop/Menu Bar.'
]);
const NATIVE_UX_DISTRIBUTION_CHANNELS = Object.freeze([
  'Local developer install with explicit sidecar health check.',
  'Internal colleague build with release evidence and rollback instructions.',
  'Unsigned dry-run package for QA only; signing and notarization require separate release gates.',
  'No auto-update, cloud sync, provider invocation, tag, push, or publish from the handoff draft.'
]);
const NATIVE_UX_STARTER_WORK_PACKAGES = Object.freeze([
  Object.freeze({
    id: 'native-shell-entry',
    title: 'Native shell entry points',
    outcome: 'Menu bar and notch surfaces read the same App kernel state used by Web Workbench.',
    source: 'v37 desktop shell + v40 router closeout'
  }),
  Object.freeze({
    id: 'native-router-capture',
    title: 'Capture and router UX',
    outcome: 'Inbox items can remain direct answers, skill runs, automation, research, skipped items, or Workbench goal drafts.',
    source: 'v40 task-1/task-2/task-3 contracts'
  }),
  Object.freeze({
    id: 'distribution-evidence',
    title: 'Distribution evidence pack',
    outcome: 'Build, signing, install, rollback, and colleague handoff evidence use explicit release gates.',
    source: 'v39 backup/diagnostics + v40 release closeout'
  })
]);

const GOAL_EVENT_FORM_DEFINITIONS = Object.freeze([
  Object.freeze({
    eventType: 'worker.started',
    formId: 'goal-update-worker-started',
    eventFamily: 'worker',
    commandName: 'symphony goal update',
    commandIntent: 'record-worker-task-event',
    actorFlag: '--actor',
    actorRole: 'worker',
    phase: 'implement',
    requiresEvidence: false,
    fields: ['goalId', 'taskId', 'eventType', 'workerActor', 'statement', 'branch', 'commit']
  }),
  Object.freeze({
    eventType: 'worker.evidence-recorded',
    formId: 'goal-update-worker-evidence-recorded',
    eventFamily: 'worker',
    commandName: 'symphony goal update',
    commandIntent: 'record-worker-task-event',
    actorFlag: '--actor',
    actorRole: 'worker',
    phase: 'implement',
    requiresEvidence: true,
    fields: ['goalId', 'taskId', 'eventType', 'workerActor', 'evidenceRef', 'statement', 'branch', 'commit']
  }),
  Object.freeze({
    eventType: 'worker.self-check-passed',
    formId: 'goal-update-worker-self-check-passed',
    eventFamily: 'worker',
    commandName: 'symphony goal update',
    commandIntent: 'record-worker-task-event',
    actorFlag: '--actor',
    actorRole: 'worker',
    phase: 'implement',
    requiresEvidence: true,
    fields: ['goalId', 'taskId', 'eventType', 'workerActor', 'evidenceRef', 'statement', 'branch', 'commit']
  }),
  Object.freeze({
    eventType: 'worker.self-check-failed',
    formId: 'goal-update-worker-self-check-failed',
    eventFamily: 'worker',
    commandName: 'symphony goal update',
    commandIntent: 'record-worker-task-event',
    actorFlag: '--actor',
    actorRole: 'worker',
    phase: 'implement',
    requiresEvidence: true,
    fields: ['goalId', 'taskId', 'eventType', 'workerActor', 'evidenceRef', 'statement', 'branch', 'commit']
  }),
  Object.freeze({
    eventType: 'blocker.opened',
    formId: 'goal-update-blocker-opened',
    eventFamily: 'blocker',
    commandName: 'symphony goal update',
    commandIntent: 'record-task-blocker-event',
    actorFlag: '--actor',
    actorRole: 'worker',
    phase: 'implement',
    requiresEvidence: false,
    fields: ['goalId', 'taskId', 'eventType', 'workerActor', 'blockerId', 'blockerReason', 'blockerSeverity', 'statement', 'branch', 'commit']
  }),
  Object.freeze({
    eventType: 'blocker.resolved',
    formId: 'goal-update-blocker-resolved',
    eventFamily: 'blocker',
    commandName: 'symphony goal update',
    commandIntent: 'record-task-blocker-event',
    actorFlag: '--actor',
    actorRole: 'worker',
    phase: 'implement',
    requiresEvidence: false,
    fields: ['goalId', 'taskId', 'eventType', 'workerActor', 'blockerId', 'statement', 'branch', 'commit']
  }),
  Object.freeze({
    eventType: 'reviewer.approved',
    formId: 'goal-review-approved',
    eventFamily: 'reviewer-verdict',
    commandName: 'symphony goal review',
    commandIntent: 'record-review-verdict',
    actorFlag: '--reviewer',
    actorRole: 'reviewer',
    phase: 'review',
    requiresEvidence: true,
    verdict: 'approved',
    fields: ['goalId', 'taskId', 'reviewerId', 'verdict', 'evidenceRef', 'statement', 'branch', 'commit']
  }),
  Object.freeze({
    eventType: 'reviewer.needs-revision',
    formId: 'goal-review-needs-revision',
    eventFamily: 'reviewer-verdict',
    commandName: 'symphony goal review',
    commandIntent: 'record-review-verdict',
    actorFlag: '--reviewer',
    actorRole: 'reviewer',
    phase: 'review',
    requiresEvidence: true,
    verdict: 'needs-revision',
    fields: ['goalId', 'taskId', 'reviewerId', 'verdict', 'evidenceRef', 'failedCommand', 'statement', 'branch', 'commit']
  }),
  Object.freeze({
    eventType: 'main.verification-passed',
    formId: 'goal-gate-main-verification-passed',
    eventFamily: 'main-verification',
    commandName: 'symphony goal gate',
    commandIntent: 'record-goal-gate',
    actorFlag: '--verifier',
    actorRole: 'main-verifier',
    phase: 'main-verification',
    requiresEvidence: true,
    gate: 'main-verification',
    gateStatus: 'passed',
    fields: ['goalId', 'taskId', 'gateName', 'gateStatus', 'verifierId', 'evidenceRef', 'statement', 'branch', 'commit']
  }),
  Object.freeze({
    eventType: 'main.verification-failed',
    formId: 'goal-gate-main-verification-failed',
    eventFamily: 'main-verification',
    commandName: 'symphony goal gate',
    commandIntent: 'record-goal-gate',
    actorFlag: '--verifier',
    actorRole: 'main-verifier',
    phase: 'main-verification',
    requiresEvidence: true,
    gate: 'main-verification',
    gateStatus: 'failed',
    fields: ['goalId', 'taskId', 'gateName', 'gateStatus', 'verifierId', 'evidenceRef', 'failedCommand', 'statement', 'branch', 'commit']
  }),
  Object.freeze({
    eventType: 'release.gate-passed',
    formId: 'goal-gate-release-gate-passed',
    eventFamily: 'release',
    commandName: 'symphony goal gate',
    commandIntent: 'record-release-gate',
    actorFlag: '--verifier',
    actorRole: 'release-verifier',
    phase: 'release-gate',
    requiresEvidence: true,
    gate: 'release.<gate>',
    gateStatus: 'passed',
    fields: ['goalId', 'gateName', 'gateStatus', 'verifierId', 'evidenceRef', 'statement', 'branch', 'commit']
  }),
  Object.freeze({
    eventType: 'release.gate-failed',
    formId: 'goal-gate-release-gate-failed',
    eventFamily: 'release',
    commandName: 'symphony goal gate',
    commandIntent: 'record-release-gate',
    actorFlag: '--verifier',
    actorRole: 'release-verifier',
    phase: 'release-gate',
    requiresEvidence: true,
    gate: 'release.<gate>',
    gateStatus: 'failed',
    fields: ['goalId', 'gateName', 'gateStatus', 'verifierId', 'evidenceRef', 'statement', 'branch', 'commit']
  }),
  Object.freeze({
    eventType: 'release.ready-declared',
    formId: 'goal-gate-release-ready-declared',
    eventFamily: 'release',
    commandName: 'symphony goal gate',
    commandIntent: 'record-release-ready-gate',
    actorFlag: '--verifier',
    actorRole: 'release-manager',
    phase: 'release-prep',
    requiresEvidence: true,
    gate: 'release.ready',
    gateStatus: 'declared',
    fields: ['goalId', 'gateName', 'gateStatus', 'verifierId', 'evidenceRef', 'statement', 'branch', 'commit']
  })
]);

const ACTIVE_GOAL_COMMAND_BASELINE = Object.freeze([
  Object.freeze({
    id: 'goalStatus',
    label: 'goal-status',
    contractName: GOAL_PROGRESS_LEDGER_CONTRACT_NAME,
    routeId: 'activeGoalProgress',
    command: 'pnpm --silent symphony goal-status --goal <goal-id> --json'
  }),
  Object.freeze({
    id: 'goalNext',
    label: 'goal next',
    contractName: GOAL_NEXT_ACTION_CONTRACT_NAME,
    routeId: 'goalNextAction',
    command: 'pnpm --silent symphony goal next --goal <goal-id> --json'
  }),
  Object.freeze({
    id: 'goalPrompt',
    label: 'goal prompt',
    contractName: GOAL_PROMPT_PACK_CONTRACT_NAME,
    routeId: 'goalPromptPack',
    command: 'pnpm --silent symphony goal prompt --goal <goal-id> --next --markdown'
  }),
  Object.freeze({
    id: 'goalCloseout',
    label: 'goal closeout',
    contractName: GOAL_CLOSEOUT_REPORT_CONTRACT_NAME,
    routeId: 'goalCloseout',
    command: 'pnpm --silent symphony goal closeout --goal <goal-id> --markdown'
  })
]);

const RELEASE_VERIFICATION_CHECKLIST = Object.freeze([
  Object.freeze({
    id: 'pnpm-check',
    label: 'pnpm check',
    gate: 'release.pnpm-check',
    gateId: 'pnpmCheck',
    command: 'pnpm check'
  }),
  Object.freeze({
    id: 'pnpm-test',
    label: 'pnpm test',
    gate: 'release.pnpm-test',
    gateId: 'pnpmTest',
    command: 'pnpm test'
  }),
  Object.freeze({
    id: 'workbench-build',
    label: 'Workbench build',
    gate: 'release.workbench-build',
    gateId: 'workbenchBuild',
    command: 'pnpm workbench:build'
  }),
  Object.freeze({
    id: 'mutation-gate',
    label: 'mutation gate',
    gate: 'release.mutation-gate',
    gateId: 'mutationGate',
    command: 'pnpm test:mutation:gate'
  }),
  Object.freeze({
    id: 'audit-high',
    label: 'high audit',
    gate: 'release.audit-high',
    gateId: 'auditHigh',
    command: 'pnpm audit --audit-level high'
  }),
  Object.freeze({
    id: 'diff-check',
    label: 'diff check',
    gate: 'release.diff-check',
    gateId: 'diffCheck',
    command: 'git diff --check'
  }),
  Object.freeze({
    id: 'mcas-doctor',
    label: 'mcas doctor',
    gate: 'release.mcas-doctor',
    gateId: 'mcasDoctor',
    command: 'pnpm mcas doctor'
  }),
  Object.freeze({
    id: 'docs-updated',
    label: 'docs updated',
    gate: 'release.docs-updated',
    gateId: 'docsUpdated',
    command: 'review docs/workbench-operator-guide.md docs/symphony-product-contracts.md docs/release-checklist.md'
  }),
  Object.freeze({
    id: 'tag-evidence',
    label: 'tag evidence',
    gate: 'release.tag-evidence',
    gateId: 'tagEvidence',
    command: 'write tag evidence prompt output before any tag is created'
  })
]);

const MAIN_VERIFICATION_COMMAND_ALLOWLIST = Object.freeze([
  'pnpm check',
  'pnpm test',
  'pnpm workbench:build',
  'git diff --check'
]);

const CONTROLLED_VERIFICATION_CONTEXT_COMMANDS = Object.freeze([
  Object.freeze({
    id: 'goal-status',
    contractName: GOAL_PROGRESS_LEDGER_CONTRACT_NAME,
    command: (goalId) => `pnpm --silent symphony goal-status --goal ${goalId} --json`
  }),
  Object.freeze({
    id: 'goal-next',
    contractName: GOAL_NEXT_ACTION_CONTRACT_NAME,
    command: (goalId) => `pnpm --silent symphony goal next --goal ${goalId} --json`
  })
]);

export const READONLY_API_ROUTES = Object.freeze([
  Object.freeze({
    id: 'summary',
    label: 'Summary',
    path: '/api/summary',
    method: 'GET',
    contractName: 'symphony.console-snapshot'
  }),
  Object.freeze({
    id: 'projectRegistry',
    label: 'Project Registry',
    path: '/api/projects',
    method: 'GET',
    contractName: PROJECT_REGISTRY_CONTRACT_NAME
  }),
  Object.freeze({
    id: 'recentProjects',
    label: 'Recent Projects',
    path: '/api/projects/recent',
    method: 'GET',
    contractName: RECENT_PROJECTS_CONTRACT_NAME
  }),
  Object.freeze({
    id: 'currentProjectBinding',
    label: 'Current Project Binding',
    path: '/api/projects/current-binding',
    method: 'GET',
    contractName: CURRENT_PROJECT_BINDING_CONTRACT_NAME
  }),
  Object.freeze({
    id: 'runtimeSnapshot',
    label: 'Runtime Snapshot',
    path: '/api/runtime/snapshot',
    method: 'GET',
    contractName: APP_STATE_SNAPSHOT_CONTRACT_NAME
  }),
  Object.freeze({
    id: 'appDataInventory',
    label: 'App Data Inventory',
    path: '/api/app/data-inventory',
    method: 'GET',
    contractName: APP_DATA_INVENTORY_CONTRACT_NAME
  }),
  Object.freeze({
    id: 'inboxCapture',
    label: 'Inbox Capture',
    path: '/api/inbox/capture',
    method: 'GET',
    contractName: INBOX_CAPTURE_CONTRACT_NAME
  }),
  Object.freeze({
    id: 'readiness',
    label: 'Readiness',
    path: '/api/readiness',
    method: 'GET',
    contractName: 'symphony.console-readiness'
  }),
  Object.freeze({
    id: 'handoffRefs',
    label: 'Handoff Refs',
    path: HANDOFF_API_BASE,
    method: 'GET',
    contractName: 'symphony.handoff-refs'
  }),
  Object.freeze({
    id: 'runs',
    label: 'Runs',
    path: '/api/runs',
    method: 'GET',
    contractName: 'symphony.console-runs'
  }),
  Object.freeze({
    id: 'latestRun',
    label: 'Latest Run',
    path: '/api/runs/latest',
    method: 'GET',
    contractName: 'symphony.console-run'
  }),
  Object.freeze({
    id: 'goals',
    label: 'Goals',
    path: '/api/goals',
    method: 'GET',
    contractName: 'symphony.goals-index'
  }),
  Object.freeze({
    id: 'goalProgress',
    label: 'Goal Progress',
    path: '/api/goals/latest/progress',
    method: 'GET',
    contractName: GOAL_PROGRESS_LEDGER_CONTRACT_NAME
  }),
  Object.freeze({
    id: 'goalEvents',
    label: 'Goal Events',
    path: '/api/goals/latest/events',
    method: 'GET',
    contractName: GOAL_EVENT_LOG_CONTRACT_NAME
  }),
  Object.freeze({
    id: 'goalOperations',
    label: 'Goal Operations',
    path: '/api/goals/latest/operations',
    method: 'GET',
    contractName: GOAL_OPERATION_RUNS_CONTRACT_NAME,
    acceptErrorContract: true
  }),
  Object.freeze({
    id: 'goalRunbook',
    label: 'Goal Runbook',
    path: '/api/goals/latest/runbook',
    method: 'GET',
    contractName: GOAL_RUNBOOK_CONTRACT_NAME,
    acceptErrorContract: true
  }),
  Object.freeze({
    id: 'goalNextAction',
    label: 'Goal Next Action',
    path: '/api/goals/latest/next',
    method: 'GET',
    contractName: GOAL_NEXT_ACTION_CONTRACT_NAME
  }),
  Object.freeze({
    id: 'goalSupervisor',
    label: 'Goal Supervisor',
    path: '/api/goals/latest/supervisor',
    method: 'GET',
    contractName: GOAL_SUPERVISOR_APP_READ_MODEL_CONTRACT_NAME
  }),
  Object.freeze({
    id: 'goalPromptPack',
    label: 'Goal Prompt Pack',
    path: '/api/goals/latest/prompt',
    method: 'GET',
    contractName: GOAL_PROMPT_PACK_CONTRACT_NAME,
    acceptErrorContract: true
  }),
  Object.freeze({
    id: 'goalCloseout',
    label: 'Goal Closeout',
    path: '/api/goals/latest/closeout',
    method: 'GET',
    contractName: GOAL_CLOSEOUT_REPORT_CONTRACT_NAME,
    acceptErrorContract: true
  }),
  Object.freeze({
    id: 'releaseBaseline',
    label: 'Release Baseline',
    path: '/api/goals/latest/release-baseline',
    method: 'GET',
    contractName: RELEASE_BASELINE_RESOLVER_CONTRACT_NAME,
    acceptErrorContract: true
  }),
  Object.freeze({
    id: 'capabilities',
    label: 'Capabilities',
    path: '/api/capabilities',
    method: 'GET',
    contractName: CAPABILITIES_CONTRACT_NAME
  }),
  Object.freeze({
    id: 'actionManifest',
    label: 'Action Manifest',
    path: '/api/actions/manifest',
    method: 'GET',
    contractName: ACTION_MANIFEST_CONTRACT_NAME
  }),
  Object.freeze({
    id: 'actionAvailability',
    label: 'Action Availability',
    path: '/api/actions/availability',
    method: 'GET',
    contractName: ACTION_AVAILABILITY_CONTRACT_NAME
  }),
  Object.freeze({
    id: 'actionPreview',
    label: 'Action Preview',
    path: '/api/actions/preview',
    method: 'GET',
    contractName: ACTION_PREVIEW_CONTRACT_NAME
  }),
  Object.freeze({
    id: 'goalDraftHandoff',
    label: 'Goal Draft Handoff',
    path: '/api/workflows/goal-draft-handoff',
    method: 'GET',
    contractName: GOAL_DRAFT_HANDOFF_CONTRACT_NAME
  }),
  Object.freeze({
    id: 'providerHealth',
    label: 'Provider Health',
    path: '/api/providers/health',
    method: 'GET',
    contractName: AGENT_CLI_PROVIDER_HEALTH_CONTRACT_NAME
  }),
  Object.freeze({
    id: 'providerCapabilities',
    label: 'Provider Capabilities',
    path: '/api/providers/capabilities',
    method: 'GET',
    contractName: AGENT_CLI_CAPABILITY_PROFILE_CONTRACT_NAME
  }),
  Object.freeze({
    id: 'providerLanePreview',
    label: 'Provider Lane Preview',
    path: '/api/providers/lane-preview',
    method: 'GET',
    contractName: AGENT_CLI_LANE_ASSIGNMENT_PREVIEW_CONTRACT_NAME
  }),
  Object.freeze({
    id: 'appSchemaMigration',
    label: 'App Schema Migration',
    path: '/api/app-data/migration',
    method: 'GET',
    contractName: APP_SCHEMA_MIGRATION_CONTRACT_NAME
  }),
  Object.freeze({
    id: 'workflowRouterCategories',
    label: 'Workflow Router Categories',
    path: '/api/workflow/router-categories',
    method: 'GET',
    contractName: WORKFLOW_ROUTER_CATEGORIES_CONTRACT_NAME
  }),
  Object.freeze({
    id: 'jobModel',
    label: 'Job Model',
    path: '/api/jobs',
    method: 'GET',
    contractName: JOB_MODEL_CONTRACT_NAME
  }),
  Object.freeze({
    id: 'jobCreation',
    label: 'Job Creation',
    path: '/api/jobs/create',
    method: 'GET',
    contractName: JOB_CREATION_CONTRACT_NAME
  }),
  Object.freeze({
    id: 'jobTimeline',
    label: 'Job Timeline',
    path: '/api/jobs/timeline',
    method: 'GET',
    contractName: JOB_TIMELINE_LOG_STREAM_CONTRACT_NAME
  }),
  Object.freeze({
    id: 'jobRunControl',
    label: 'Job Run Control',
    path: '/api/jobs/control',
    method: 'GET',
    contractName: JOB_RUN_CONTROL_CONTRACT_NAME
  }),
  Object.freeze({
    id: 'diagnostics',
    label: 'Diagnostics',
    path: '/api/diagnostics',
    method: 'GET',
    contractName: DIAGNOSTICS_CONTRACT_NAME
  }),
  Object.freeze({
    id: 'diagnosticsBundle',
    label: 'Diagnostics Bundle',
    path: '/api/diagnostics/bundle',
    method: 'GET',
    contractName: APP_CORE_DIAGNOSTICS_BUNDLE_CONTRACT_NAME
  }),
  Object.freeze({
    id: 'artifactIndex',
    label: 'Artifact Index',
    path: '/api/artifacts',
    method: 'GET',
    contractName: ARTIFACT_INDEX_CONTRACT_NAME
  }),
  Object.freeze({
    id: 'evidenceTimeline',
    label: 'Evidence Timeline',
    path: '/api/evidence/timeline',
    method: 'GET',
    contractName: EVIDENCE_TIMELINE_CONTRACT_NAME
  }),
  Object.freeze({
    id: 'releaseBundle',
    label: 'Release Bundle',
    path: '/api/release/bundle',
    method: 'GET',
    contractName: RELEASE_BUNDLE_CONTRACT_NAME
  }),
  Object.freeze({
    id: 'appCoreReleaseManager',
    label: 'App Core Release Manager',
    path: '/api/release/app-core-manager',
    method: 'GET',
    contractName: APP_CORE_RELEASE_MANAGER_CONTRACT_NAME
  }),
  Object.freeze({
    id: 'evidenceBundle',
    label: 'Evidence Bundle',
    path: '/api/bundle',
    method: 'GET',
    contractName: EVIDENCE_BUNDLE_CONTRACT_NAME
  }),
  Object.freeze({
    id: 'backupExport',
    label: 'Backup Export',
    path: '/api/backup/export',
    method: 'GET',
    contractName: APP_CORE_BACKUP_EXPORT_CONTRACT_NAME
  }),
  Object.freeze({
    id: 'restoreValidation',
    label: 'Restore Validation',
    path: '/api/restore/validate',
    method: 'GET',
    contractName: APP_CORE_RESTORE_VALIDATION_CONTRACT_NAME
  })
]);

export const GUIDED_GOAL_HANDOFF_ROUTE_TEMPLATE = Object.freeze({
  id: 'guidedGoalHandoff',
  label: 'Guided Goal Handoff',
  path: '/api/handoff/<ref>',
  method: 'GET',
  contractName: GUIDED_GOAL_HANDOFF_CONTRACT_NAME
});

export const RUN_TIMELINE_ROUTE_TEMPLATE = Object.freeze({
  id: 'latestRunTimeline',
  label: 'Latest Run Timeline',
  path: '/api/runs/<run-id>/timeline',
  method: 'GET',
  contractName: 'symphony.console-run-timeline'
});

export const SAFE_ARTIFACT_PREVIEW_ROUTE_TEMPLATE = Object.freeze({
  id: 'safeArtifactPreview',
  label: 'Safe Artifact Preview',
  path: '/api/runs/<run-id>/artifacts/<artifact-kind>/preview',
  method: 'GET',
  contractName: SAFE_ARTIFACT_PREVIEW_CONTRACT_NAME,
  acceptErrorContract: true
});

export const GOAL_PROGRESS_ROUTE_TEMPLATE = Object.freeze({
  id: 'goalProgressById',
  label: 'Goal Progress By Id',
  path: '/api/goals/<goal-id>/progress',
  method: 'GET',
  contractName: GOAL_PROGRESS_LEDGER_CONTRACT_NAME,
  acceptErrorContract: true
});

export const GOAL_EVENTS_ROUTE_TEMPLATE = Object.freeze({
  id: 'goalEventsById',
  label: 'Goal Events By Id',
  path: '/api/goals/<goal-id>/events',
  method: 'GET',
  contractName: GOAL_EVENT_LOG_CONTRACT_NAME,
  acceptErrorContract: true
});

export const GOAL_OPERATIONS_ROUTE_TEMPLATE = Object.freeze({
  id: 'goalOperationsById',
  label: 'Goal Operations By Id',
  path: '/api/goals/<goal-id>/operations',
  method: 'GET',
  contractName: GOAL_OPERATION_RUNS_CONTRACT_NAME,
  acceptErrorContract: true
});

export const GOAL_RUNBOOK_ROUTE_TEMPLATE = Object.freeze({
  id: 'goalRunbookById',
  label: 'Goal Runbook By Id',
  path: '/api/goals/<goal-id>/runbook',
  method: 'GET',
  contractName: GOAL_RUNBOOK_CONTRACT_NAME,
  acceptErrorContract: true
});

export const GOAL_NEXT_ACTION_ROUTE_TEMPLATE = Object.freeze({
  id: 'goalNextActionById',
  label: 'Goal Next Action By Id',
  path: '/api/goals/<goal-id>/next',
  method: 'GET',
  contractName: GOAL_NEXT_ACTION_CONTRACT_NAME,
  acceptErrorContract: true
});

export const GOAL_SUPERVISOR_ROUTE_TEMPLATE = Object.freeze({
  id: 'goalSupervisorById',
  label: 'Goal Supervisor By Id',
  path: '/api/goals/<goal-id>/supervisor',
  method: 'GET',
  contractName: GOAL_SUPERVISOR_APP_READ_MODEL_CONTRACT_NAME,
  acceptErrorContract: true
});

export const GOAL_PROMPT_PACK_ROUTE_TEMPLATE = Object.freeze({
  id: 'goalPromptPackById',
  label: 'Goal Prompt Pack By Id',
  path: '/api/goals/<goal-id>/prompt',
  method: 'GET',
  contractName: GOAL_PROMPT_PACK_CONTRACT_NAME,
  acceptErrorContract: true
});

export const GOAL_CLOSEOUT_ROUTE_TEMPLATE = Object.freeze({
  id: 'goalCloseoutById',
  label: 'Goal Closeout By Id',
  path: '/api/goals/<goal-id>/closeout',
  method: 'GET',
  contractName: GOAL_CLOSEOUT_REPORT_CONTRACT_NAME,
  acceptErrorContract: true
});

export const RELEASE_BASELINE_ROUTE_TEMPLATE = Object.freeze({
  id: 'releaseBaselineById',
  label: 'Release Baseline By Id',
  path: '/api/goals/<goal-id>/release-baseline',
  method: 'GET',
  contractName: RELEASE_BASELINE_RESOLVER_CONTRACT_NAME,
  acceptErrorContract: true
});

export const CONTROLLED_IMPLEMENTATION_PLAN_PREVIEW_ROUTE_TEMPLATE = Object.freeze({
  id: 'controlledImplementationPlanPreview',
  label: 'Controlled Implementation Plan Preview',
  path: '/api/goals/<goal-id>/implementation-plan-preview',
  method: 'GET',
  contractName: CONTROLLED_IMPLEMENTATION_PLAN_PREVIEW_CONTRACT_NAME,
  acceptErrorContract: true
});

export const CONTROLLED_PROVIDER_RUNNER_PREVIEW_ROUTE_TEMPLATE = Object.freeze({
  id: 'controlledProviderRunnerPreview',
  label: 'Controlled Provider Runner Preview',
  path: '/api/goals/<goal-id>/provider-runner-preview',
  method: 'GET',
  contractName: CONTROLLED_PROVIDER_RUNNER_PLAN_PREVIEW_CONTRACT_NAME,
  acceptErrorContract: true
});

export const CONTROLLED_ADOPTION_PLAN_FREEZE_ROUTE_TEMPLATE = Object.freeze({
  id: 'controlledAdoptionPlanFreeze',
  label: 'Controlled Adoption Plan Freeze',
  path: '/api/goals/<goal-id>/adoption-plan-freeze',
  contractName: CONTROLLED_ADOPTION_PLAN_FREEZE_CONTRACT_NAME,
  acceptErrorContract: true
});

export const CONTROLLED_ADOPTION_CONFIRM_ROUTE_TEMPLATE = Object.freeze({
  id: 'controlledAdoptionConfirm',
  label: 'Controlled Adoption Confirm',
  path: '/api/goals/<goal-id>/adoption-confirm',
  contractName: CONTROLLED_ADOPTION_CONFIRM_CONTRACT_NAME,
  acceptErrorContract: true
});

export const ADOPTION_INSPECT_ROUTE_TEMPLATE = Object.freeze({
  id: 'adoptionInspect',
  label: 'Adoption Inspect',
  path: '/api/adoptions/<adoption-id>/inspect',
  method: 'GET',
  contractName: CONSOLE_ADOPTION_INSPECT_CONTRACT_NAME,
  acceptErrorContract: true
});

export const READONLY_API_ROUTE_ALLOWLIST = Object.freeze([
  ...READONLY_API_ROUTES,
  ADOPTION_INSPECT_ROUTE_TEMPLATE,
  GOAL_EVENTS_ROUTE_TEMPLATE,
  GOAL_OPERATIONS_ROUTE_TEMPLATE,
  GOAL_PROGRESS_ROUTE_TEMPLATE,
  GOAL_RUNBOOK_ROUTE_TEMPLATE,
  GOAL_NEXT_ACTION_ROUTE_TEMPLATE,
  GOAL_SUPERVISOR_ROUTE_TEMPLATE,
  GOAL_PROMPT_PACK_ROUTE_TEMPLATE,
  GOAL_CLOSEOUT_ROUTE_TEMPLATE,
  RELEASE_BASELINE_ROUTE_TEMPLATE,
  CONTROLLED_IMPLEMENTATION_PLAN_PREVIEW_ROUTE_TEMPLATE,
  CONTROLLED_PROVIDER_RUNNER_PREVIEW_ROUTE_TEMPLATE,
  GUIDED_GOAL_HANDOFF_ROUTE_TEMPLATE,
  RUN_TIMELINE_ROUTE_TEMPLATE,
  SAFE_ARTIFACT_PREVIEW_ROUTE_TEMPLATE
]);

export const READONLY_API_ROUTE_IDS = Object.freeze(
  READONLY_API_ROUTE_ALLOWLIST.map((route) => route.id)
);

const RUN_API_BASE = ['', 'api', 'runs'].join('/');
const TIMELINE_SEGMENT = 'timeline';
const OPTIONAL_ROUTE_IDS = new Set([
  'latestRun',
  'latestRunTimeline',
  'goalRunbook',
  'goalNextAction',
  'goalPromptPack',
  'goalReviewerPromptPack',
  'goalCloseout',
  'releaseBaseline',
  'activeReleaseBaseline',
  'activeGoalProgress',
  'activeGoalEvents',
  'activeGoalOperations',
  'controlledImplementationPlanPreview',
  'controlledProviderRunnerPreview',
  'adoptionInspect'
]);

export const DEFERRED_CONTRACT_GAPS = Object.freeze([
  'dirty adoption 当前仍由 pending adoption 与 Git readiness 分别暴露'
]);

const ARTIFACT_PREVIEW_FIELD_GROUPS = Object.freeze([
  Object.freeze({
    label: 'uri/ref',
    fields: Object.freeze(['uri', 'ref'])
  }),
  Object.freeze({
    label: 'mime',
    fields: Object.freeze(['mime'])
  }),
  Object.freeze({
    label: 'title/displayTitle',
    fields: Object.freeze(['title', 'displayTitle'])
  }),
  Object.freeze({
    label: 'safeToRenderInline',
    fields: Object.freeze(['safeToRenderInline'])
  }),
  Object.freeze({
    label: 'sourceRunId',
    fields: Object.freeze(['sourceRunId'])
  }),
  Object.freeze({
    label: 'artifactKind',
    fields: Object.freeze(['artifactKind'])
  }),
  Object.freeze({
    label: 'previewAvailable',
    fields: Object.freeze(['previewAvailable'])
  }),
  Object.freeze({
    label: 'sizeBytes',
    fields: Object.freeze(['sizeBytes'])
  })
]);

export function projectWorkbenchContracts(results) {
  const summaryData = dataFrom(results.summary);
  const projectRegistryData = dataFrom(results.projectRegistry);
  const recentProjectsData = dataFrom(results.recentProjects);
  const currentProjectBindingData = dataFrom(results.currentProjectBinding);
  const runtimeSnapshotData = dataFrom(results.runtimeSnapshot);
  const appDataInventoryData = dataFrom(results.appDataInventory);
  const inboxCaptureData = dataFrom(results.inboxCapture);
  const readinessData = dataFrom(results.readiness);
  const handoffRefsData = dataFrom(results.handoffRefs);
  const guidedGoalHandoffData = dataFrom(results.guidedGoalHandoff);
  const runsData = dataFrom(results.runs);
  const latestRunData = dataFrom(results.latestRun);
  const goalsData = dataFrom(results.goals);
  const goalProgressData = dataFrom(results.goalProgress);
  const goalEventsData = dataFrom(results.goalEvents);
  const goalOperationsData = dataFrom(results.goalOperations);
  const goalRunbookData = dataFrom(results.goalRunbook);
  const goalNextActionData = dataFrom(results.goalNextAction);
  const goalSupervisorData = dataFrom(results.goalSupervisor);
  const goalPromptPackData = dataFrom(results.goalPromptPack);
  const goalReviewerPromptPackData = dataFrom(results.goalReviewerPromptPack);
  const goalCloseoutData = dataFrom(results.goalCloseout);
  const activeGoalProgressData = dataFrom(results.activeGoalProgress);
  const activeGoalEventsData = dataFrom(results.activeGoalEvents);
  const activeGoalOperationsData = dataFrom(results.activeGoalOperations);
  const activeReleaseBaselineData = dataFrom(results.activeReleaseBaseline);
  const adoptionInspectData = dataFrom(results.adoptionInspect);
  const controlledImplementationPlanPreviewData = dataFrom(results.controlledImplementationPlanPreview);
  const controlledProviderRunnerPreviewData = dataFrom(results.controlledProviderRunnerPreview);
  const capabilitiesData = dataFrom(results.capabilities);
  const actionManifestData = dataFrom(results.actionManifest);
  const actionAvailabilityData = dataFrom(results.actionAvailability);
  const actionPreviewData = dataFrom(results.actionPreview);
  const goalDraftHandoffData = dataFrom(results.goalDraftHandoff);
  const providerHealthData = dataFrom(results.providerHealth);
  const providerCapabilitiesData = dataFrom(results.providerCapabilities);
  const providerLanePreviewData = dataFrom(results.providerLanePreview);
  const appSchemaMigrationData = dataFrom(results.appSchemaMigration);
  const workflowRouterCategoriesData = dataFrom(results.workflowRouterCategories);
  const diagnosticsData = dataFrom(results.diagnostics);
  const diagnosticsBundleData = dataFrom(results.diagnosticsBundle);
  const jobModelData = dataFrom(results.jobModel);
  const jobCreationData = dataFrom(results.jobCreation);
  const jobTimelineData = dataFrom(results.jobTimeline);
  const jobRunControlData = dataFrom(results.jobRunControl);
  const artifactIndexData = dataFrom(results.artifactIndex);
  const evidenceTimelineData = dataFrom(results.evidenceTimeline);
  const releaseBundleData = dataFrom(results.releaseBundle);
  const appCoreReleaseManagerData = dataFrom(results.appCoreReleaseManager);
  const backupExportData = dataFrom(results.backupExport);
  const restoreValidationData = dataFrom(results.restoreValidation);
  const latestRun = latestRunData?.run ?? null;
  const safeArtifactPreviewResults = Array.isArray(results.safeArtifactPreviews)
    ? results.safeArtifactPreviews
    : [];
  const routeStates = [
    ...READONLY_API_ROUTES.map((route) => projectRouteState(route, results[route.id])),
    projectRouteState(
      results.guidedGoalHandoff?.routeDescriptor ?? GUIDED_GOAL_HANDOFF_ROUTE_TEMPLATE,
      results.guidedGoalHandoff
    ),
    projectRouteState(
      results.latestRunTimeline?.routeDescriptor ?? RUN_TIMELINE_ROUTE_TEMPLATE,
      results.latestRunTimeline
    ),
    projectRouteState(
      results.activeGoalProgress?.routeDescriptor ?? GOAL_PROGRESS_ROUTE_TEMPLATE,
      results.activeGoalProgress
    ),
    projectRouteState(
      results.activeGoalEvents?.routeDescriptor ?? GOAL_EVENTS_ROUTE_TEMPLATE,
      results.activeGoalEvents
    ),
    projectRouteState(
      results.activeGoalOperations?.routeDescriptor ?? GOAL_OPERATIONS_ROUTE_TEMPLATE,
      results.activeGoalOperations
    ),
    projectRouteState(
      results.activeReleaseBaseline?.routeDescriptor ?? RELEASE_BASELINE_ROUTE_TEMPLATE,
      results.activeReleaseBaseline
    ),
    projectRouteState(
      results.controlledImplementationPlanPreview?.routeDescriptor ?? CONTROLLED_IMPLEMENTATION_PLAN_PREVIEW_ROUTE_TEMPLATE,
      results.controlledImplementationPlanPreview
    ),
    projectRouteState(
      results.controlledProviderRunnerPreview?.routeDescriptor ?? CONTROLLED_PROVIDER_RUNNER_PREVIEW_ROUTE_TEMPLATE,
      results.controlledProviderRunnerPreview
    ),
    projectRouteState(
      results.adoptionInspect?.routeDescriptor ?? ADOPTION_INSPECT_ROUTE_TEMPLATE,
      results.adoptionInspect
    ),
    projectRouteState(
      results.goalReviewerPromptPack?.routeDescriptor ?? GOAL_PROMPT_PACK_ROUTE_TEMPLATE,
      results.goalReviewerPromptPack
    ),
    ...safeArtifactPreviewResults.map((result) => projectRouteState(
      result?.routeDescriptor ?? SAFE_ARTIFACT_PREVIEW_ROUTE_TEMPLATE,
      result
    ))
  ];
  const failedRequiredRoutes = routeStates.filter((route) => (
    route.state === 'failed' && !OPTIONAL_ROUTE_IDS.has(route.id)
  ));
  const hasNoRuns = summaryData?.latestRun === null || summaryData?.status === 'no-runs';
  const projectedLatestRun = projectLatestRun({
    result: results.latestRun,
    run: latestRun,
    hasNoRuns,
    safeArtifactPreviewResults
  });
  const activeGoalControl = projectActiveGoalControl({
    statusResult: results.goalProgress,
    status: goalProgressData,
    readiness: readinessData,
    runbookResult: results.goalRunbook,
    runbook: goalRunbookData,
    nextActionResult: results.goalNextAction,
    nextAction: goalNextActionData,
    promptPackResult: results.goalPromptPack,
    promptPack: goalPromptPackData,
    reviewerPromptPackResult: results.goalReviewerPromptPack,
    reviewerPromptPack: goalReviewerPromptPackData,
    closeoutResult: results.goalCloseout,
    closeout: goalCloseoutData,
    releaseBaselineResult: results.activeReleaseBaseline,
    releaseBaseline: activeReleaseBaselineData,
    activeLedgerResult: results.activeGoalProgress,
    activeLedger: activeGoalProgressData,
    activeEventLogResult: results.activeGoalEvents,
    activeEventLog: activeGoalEventsData,
    activeOperationsResult: results.activeGoalOperations,
    activeOperations: activeGoalOperationsData,
    adoptionInspectResult: results.adoptionInspect,
    adoptionInspect: adoptionInspectData,
    latestRun
  });
  activeGoalControl.actionRegistry = projectActionRegistryPanel({
    manifestResult: results.actionManifest,
    manifest: actionManifestData,
    availabilityResult: results.actionAvailability,
    availability: actionAvailabilityData,
    previewResult: results.actionPreview,
    preview: actionPreviewData,
    nextAction: goalNextActionData
  });
  activeGoalControl.goalDraftHandoff = projectGoalDraftHandoffPanel({
    result: results.goalDraftHandoff,
    handoff: goalDraftHandoffData,
    nextAction: goalNextActionData
  });
  const routeContext = projectWorkbenchRouteContext({
    activeGoal: activeGoalControl,
    latestRun: projectedLatestRun
  });
  const activeGoalLedger = activeGoalProgressData?.goalId === goalRunbookData?.goalId
    ? activeGoalProgressData
    : goalProgressData?.goalId === goalRunbookData?.goalId ? goalProgressData : null;
  const activeGoalEventLog = activeGoalEventsData?.goalId === goalRunbookData?.goalId ? activeGoalEventsData : null;
  const activeGoalOperations = activeGoalOperationsData?.goalId === goalRunbookData?.goalId ? activeGoalOperationsData : null;

  activeGoalControl.activeTaskImplementationEligibility = projectActiveTaskImplementationEligibility({
    statusResult: activeGoalLedger === activeGoalProgressData ? results.activeGoalProgress : results.goalProgress,
    ledger: activeGoalLedger,
    nextActionResult: results.goalNextAction,
    nextAction: goalNextActionData,
    runbookResult: results.goalRunbook,
    runbook: goalRunbookData,
    eventLogResult: results.activeGoalEvents,
    eventLog: activeGoalEventLog,
    operationsResult: results.activeGoalOperations,
    operations: activeGoalOperations,
    routeContext
  });
  activeGoalControl.controlledImplementationPlanPreview = projectControlledImplementationPlanPreview({
    result: results.controlledImplementationPlanPreview,
    preview: controlledImplementationPlanPreviewData,
    eligibility: activeGoalControl.activeTaskImplementationEligibility,
    operations: activeGoalOperations
  });
  activeGoalControl.controlledProviderRunnerPreview = projectControlledProviderRunnerPreview({
    result: results.controlledProviderRunnerPreview,
    preview: controlledProviderRunnerPreviewData,
    operations: activeGoalOperations,
    activeGoal: activeGoalControl
  });
  const projectedRuntimeSnapshot = projectRuntimeSnapshot({
    result: results.runtimeSnapshot,
    snapshot: runtimeSnapshotData
  });
  const projectedProjectRegistry = projectProjectRegistry({
    result: results.projectRegistry,
    registry: projectRegistryData
  });
  const projectedRecentProjects = projectRecentProjects({
    result: results.recentProjects,
    recentProjects: recentProjectsData
  });
  const projectedCurrentProjectBinding = projectCurrentProjectBinding({
    result: results.currentProjectBinding,
    binding: currentProjectBindingData
  });
  const projectedArtifactRefs = projectArtifactRefs(
    latestRun?.artifactRefs,
    latestRun?.artifactStatus,
    safeArtifactPreviewResults
  );
  const projectedArtifactIndex = projectArtifactIndex({
    result: results.artifactIndex,
    index: artifactIndexData
  });
  const projectedJobConsole = projectJobConsole({
    jobModelResult: results.jobModel,
    jobModel: jobModelData,
    jobCreationResult: results.jobCreation,
    jobCreation: jobCreationData,
    jobTimelineResult: results.jobTimeline,
    jobTimeline: jobTimelineData,
    jobRunControlResult: results.jobRunControl,
    jobRunControl: jobRunControlData
  });
  const projectedEvidenceTimeline = projectEvidenceTimeline({
    result: results.evidenceTimeline,
    timeline: evidenceTimelineData
  });
  const projectedReleaseBundle = projectReleaseBundle({
    result: results.releaseBundle,
    bundle: releaseBundleData
  });
  const projectedAppCoreReleaseManager = projectAppCoreReleaseManager({
    result: results.appCoreReleaseManager,
    releaseManager: appCoreReleaseManagerData
  });
  const projectedBackupExport = projectBackupExport({
    result: results.backupExport,
    backupExport: backupExportData
  });
  const projectedRestoreValidation = projectRestoreValidation({
    result: results.restoreValidation,
    restoreValidation: restoreValidationData
  });
  const projectedDiagnosticsBundle = projectDiagnosticsBundle({
    result: results.diagnosticsBundle,
    diagnosticsBundle: diagnosticsBundleData
  });
  const projectedProviderLanePreview = projectProviderLanePreview({
    result: results.providerLanePreview,
    preview: providerLanePreviewData
  });
  const projectedProviderHub = projectProviderHubPanel({
    healthResult: results.providerHealth,
    health: providerHealthData,
    capabilityResult: results.providerCapabilities,
    capability: providerCapabilitiesData,
    laneResult: results.providerLanePreview,
    lanePreview: providerLanePreviewData,
    activeGoal: activeGoalControl
  });
  const projectedSupervisorDashboard = projectSupervisorDashboard({
    result: results.goalSupervisor,
    supervisor: goalSupervisorData
  });
  const projectedSystemGoldenPath = projectSystemGoldenPath({
    contract: goalSupervisorData?.systemGoldenPath,
    supervisorRoute: findProjectedRoute(routeStates, 'goalSupervisor')
  });
  const projectedChildDispatchPreview = projectChildDispatchPreview({
    contract: goalSupervisorData?.childDispatchPreview,
    supervisorRoute: findProjectedRoute(routeStates, 'goalSupervisor')
  });
  const projectedCodexProviderExecutionPreview = projectCodexProviderExecutionPreview({
    contract: goalSupervisorData?.codexProviderExecutionPreview,
    supervisorRoute: findProjectedRoute(routeStates, 'goalSupervisor')
  });
  const projectedCodexProviderRunRecovery = projectCodexProviderRunRecovery({
    contract: goalSupervisorData?.codexProviderRunRecovery,
    supervisorRoute: findProjectedRoute(routeStates, 'goalSupervisor')
  });
  const projectedReviewerHandoffPreview = projectReviewerHandoffPreview({
    contract: goalSupervisorData?.reviewerHandoffPreview,
    supervisorRoute: findProjectedRoute(routeStates, 'goalSupervisor')
  });
  const projectedThreadHandoffPack = projectThreadHandoffPack({
    contract: goalSupervisorData?.threadHandoffPack,
    supervisorRoute: findProjectedRoute(routeStates, 'goalSupervisor')
  });
  const projectedReviewGatePreview = projectReviewGatePreview({
    contract: goalSupervisorData?.reviewGatePreview,
    supervisorRoute: findProjectedRoute(routeStates, 'goalSupervisor')
  });
  const projectedReviewGateConfirmationState = projectReviewGateConfirmationState({
    contract: goalSupervisorData?.reviewGateConfirmationState,
    supervisorRoute: findProjectedRoute(routeStates, 'goalSupervisor')
  });
  const projectedReleaseCloseoutHandoffPack = projectReleaseCloseoutHandoffPack({
    contract: goalSupervisorData?.releaseCloseoutHandoffPack,
    supervisorRoute: findProjectedRoute(routeStates, 'goalSupervisor')
  });
  const projectedReleasePublicationEvidence = projectReleasePublicationEvidence({
    contract: goalSupervisorData?.releasePublicationEvidence,
    supervisorRoute: findProjectedRoute(routeStates, 'goalSupervisor')
  });
  const projectedStableWorkbenchRelease = projectStableWorkbenchRelease({
    contract: goalSupervisorData?.stableWorkbenchRelease,
    supervisorRoute: findProjectedRoute(routeStates, 'goalSupervisor')
  });

  const adoptionCandidates = projectAdoptionCandidates({
    runsResult: results.runs,
    runs: runsData,
    latestRun,
    operationsResult: results.activeGoalOperations,
    operations: activeGoalOperations,
    activeGoal: activeGoalControl
  });
  const adoptionPlanPreviewWorkspace = projectAdoptionPlanPreviewWorkspace({
    candidates: adoptionCandidates,
    operations: activeGoalOperations,
    activeGoal: activeGoalControl
  });

  return {
    state: failedRequiredRoutes.length > 0 ? 'partial' : 'ready',
    routeStates,
    routeContext,
    systemGoldenPath: projectedSystemGoldenPath,
    childDispatchPreview: projectedChildDispatchPreview,
    codexProviderExecutionPreview: projectedCodexProviderExecutionPreview,
    codexProviderRunRecovery: projectedCodexProviderRunRecovery,
    reviewerHandoffPreview: projectedReviewerHandoffPreview,
    threadHandoffPack: projectedThreadHandoffPack,
    reviewGatePreview: projectedReviewGatePreview,
    reviewGateConfirmationState: projectedReviewGateConfirmationState,
    releaseCloseoutHandoffPack: projectedReleaseCloseoutHandoffPack,
    releasePublicationEvidence: projectedReleasePublicationEvidence,
    stableWorkbenchRelease: projectedStableWorkbenchRelease,
    goldenPath: projectWorkbenchGoldenPath({
      activeGoal: activeGoalControl,
      routeStates
    }),
    desktopShell: projectDesktopShell({
      projectRegistry: projectedProjectRegistry,
      recentProjects: projectedRecentProjects,
      currentProjectBinding: projectedCurrentProjectBinding,
      runtimeSnapshot: projectedRuntimeSnapshot,
      activeGoal: activeGoalControl,
      jobConsole: projectedJobConsole,
      artifactRefs: projectedArtifactRefs,
      artifactIndex: projectedArtifactIndex,
      evidenceTimeline: projectedEvidenceTimeline,
      releaseBundle: projectedReleaseBundle,
      appCoreReleaseManager: projectedAppCoreReleaseManager,
      backupExport: projectedBackupExport,
      restoreValidation: projectedRestoreValidation,
      diagnosticsBundle: projectedDiagnosticsBundle,
      providerHub: projectedProviderHub,
      supervisorDashboard: projectedSupervisorDashboard,
      systemGoldenPath: projectedSystemGoldenPath,
      childDispatchPreview: projectedChildDispatchPreview,
      codexProviderExecutionPreview: projectedCodexProviderExecutionPreview,
      codexProviderRunRecovery: projectedCodexProviderRunRecovery,
      reviewerHandoffPreview: projectedReviewerHandoffPreview,
      threadHandoffPack: projectedThreadHandoffPack,
      reviewGatePreview: projectedReviewGatePreview,
      reviewGateConfirmationState: projectedReviewGateConfirmationState,
      releaseCloseoutHandoffPack: projectedReleaseCloseoutHandoffPack,
      releasePublicationEvidence: projectedReleasePublicationEvidence,
      stableWorkbenchRelease: projectedStableWorkbenchRelease,
      routeStates
    }),
    projectRegistry: projectedProjectRegistry,
    recentProjects: projectedRecentProjects,
    currentProjectBinding: projectedCurrentProjectBinding,
    runtimeSnapshot: projectedRuntimeSnapshot,
    appDataInventory: projectAppDataInventory({
      result: results.appDataInventory,
      inventory: appDataInventoryData
    }),
    inboxCapture: projectInboxCapture({
      result: results.inboxCapture,
      capture: inboxCaptureData
    }),
    summary: projectSummary(summaryData),
    readiness: projectReadiness(readinessData, summaryData),
    runs: projectRuns(runsData, summaryData),
    latestRun: projectedLatestRun,
    latestRunTimeline: projectLatestRunTimeline({
      result: results.latestRunTimeline,
      latestRun: projectedLatestRun
    }),
    handoff: projectGuidedGoalHandoff({
      indexResult: results.handoffRefs,
      handoffResult: results.guidedGoalHandoff,
      handoffIndex: handoffRefsData,
      handoff: guidedGoalHandoffData
    }),
    adoption: projectAdoption({
      summary: summaryData,
      readiness: readinessData
    }),
    adoptionCandidates,
    adoptionPlanPreviewWorkspace,
    adoptionInspectRecoveryWorkspace: projectAdoptionInspectRecoveryWorkspace({
      planPreviewWorkspace: adoptionPlanPreviewWorkspace,
      activeGoal: activeGoalControl,
      result: results.adoptionInspect,
      inspect: adoptionInspectData
    }),
    artifactRefs: projectedArtifactRefs,
    artifactIndex: projectedArtifactIndex,
    goals: projectGoals(goalsData),
    goalProgress: projectGoalProgress({
      result: results.goalProgress,
      ledger: goalProgressData
    }),
    goalEvents: projectGoalEvents({
      result: results.goalEvents,
      eventLog: goalEventsData,
      ledger: goalProgressData
    }),
    goalOperations: projectGoalOperationConsole({
      result: results.goalOperations,
      operations: goalOperationsData,
      nextAction: goalNextActionData
    }),
    supervisorDashboard: projectedSupervisorDashboard,
    activeGoal: activeGoalControl,
    goalDraftHandoff: activeGoalControl.goalDraftHandoff,
    capabilities: projectCapabilities(capabilitiesData),
    providerHub: projectedProviderHub,
    providerLanePreview: projectedProviderLanePreview,
    appSchemaMigration: projectAppSchemaMigration({
      result: results.appSchemaMigration,
      migration: appSchemaMigrationData
    }),
    workflowRouterCategories: projectWorkflowRouterCategories({
      result: results.workflowRouterCategories,
      router: workflowRouterCategoriesData,
      routeContext
    }),
    diagnosticsV1: projectDiagnostics(diagnosticsData),
    diagnosticsBundle: projectedDiagnosticsBundle,
    jobConsole: projectedJobConsole,
    evidenceTimeline: projectedEvidenceTimeline,
    releaseBundle: projectedReleaseBundle,
    appCoreReleaseManager: projectedAppCoreReleaseManager,
    backupExport: projectedBackupExport,
    restoreValidation: projectedRestoreValidation,
    deferredGaps: DEFERRED_CONTRACT_GAPS.map((gap) => ({
      label: gap,
      status: MISSING_TEXT
    }))
  };
}

function projectRuntimeSnapshot({ result, snapshot }) {
  const blockers = Array.isArray(snapshot?.known_blockers)
    ? snapshot.known_blockers
    : [];
  const releaseStatus = snapshot?.release_status ?? null;
  const missingGates = Array.isArray(releaseStatus?.missing_or_unknown_gates)
    ? releaseStatus.missing_or_unknown_gates
    : [];
  const evidenceRefs = Array.isArray(snapshot?.evidence_refs)
    ? snapshot.evidence_refs
    : [];
  const boundaries = snapshot?.boundaries ?? {};

  return {
    state: result?.ok === true ? snapshotRuntimeState(snapshot) : 'missing',
    contractName: valueState(snapshot?.contractName),
    contractVersion: valueState(snapshot?.contractVersion),
    generatedAt: valueState(snapshot?.generatedAt),
    readOnly: valueState(snapshot?.readOnly),
    freshness: {
      status: valueState(snapshot?.freshness?.status),
      ageMs: valueState(snapshot?.freshness?.age_ms),
      staleAfterMs: valueState(snapshot?.freshness?.stale_after_ms)
    },
    runtime: {
      status: valueState(snapshot?.runtime_health?.status),
      mode: valueState(snapshot?.runtime_health?.mode),
      version: valueState(snapshot?.runtime_health?.runtime?.version),
      kernel: valueState(snapshot?.runtime_health?.kernel?.version),
      cwd: valueState(snapshot?.runtime_health?.process?.cwd),
      repoPath: valueState(snapshot?.runtime_health?.process?.repoPath),
      sidecarHost: projectSidecarHostLifecycle(snapshot?.runtime_health?.sidecarHost)
    },
    project: {
      status: valueState(snapshot?.current_project?.resolution?.status),
      name: valueState(snapshot?.current_project?.currentProject?.project_name),
      id: valueState(snapshot?.current_project?.currentProject?.project_id),
      repoPath: valueState(snapshot?.current_project?.currentProject?.repo_path),
      defaultBranch: valueState(snapshot?.current_project?.currentProject?.default_branch),
      lastGoalId: valueState(snapshot?.current_project?.currentProject?.last_goal_id),
      lastRunId: valueState(snapshot?.current_project?.currentProject?.last_run_id)
    },
    activeGoal: {
      goalId: valueState(snapshot?.active_goal?.goal_id),
      title: valueState(snapshot?.active_goal?.goal_title),
      completedTasks: valueState(snapshot?.active_goal?.summary?.completedTasks),
      totalTasks: valueState(snapshot?.active_goal?.summary?.totalTasks),
      statusSource: valueState(snapshot?.active_goal?.status_source)
    },
    currentTask: {
      taskId: valueState(snapshot?.current_task?.task_id),
      title: valueState(snapshot?.current_task?.title),
      status: valueState(snapshot?.current_task?.status),
      role: valueState(snapshot?.current_task?.role),
      phase: valueState(snapshot?.current_task?.phase),
      blocked: valueState(snapshot?.current_task?.blocked)
    },
    nextAction: {
      status: valueState(snapshot?.next_action?.status),
      reason: valueState(snapshot?.next_action?.reason),
      registerWith: valueState(snapshot?.next_action?.afterCompletion?.registerWith),
      copyOnlyCommands: Array.isArray(snapshot?.next_action?.copyOnlyCommands)
        ? snapshot.next_action.copyOnlyCommands.map((command) => valueState(command))
        : []
    },
    review: {
      taskId: valueState(snapshot?.review_status?.task_id),
      verdict: valueState(snapshot?.review_status?.verdict),
      evidenceRef: valueState(snapshot?.review_status?.evidence_ref),
      statusSource: valueState(snapshot?.review_status?.status_source)
    },
    mainVerification: {
      taskId: valueState(snapshot?.main_verification_status?.task_id),
      status: valueState(snapshot?.main_verification_status?.status),
      evidenceRef: valueState(snapshot?.main_verification_status?.evidence_ref),
      statusSource: valueState(snapshot?.main_verification_status?.status_source)
    },
    release: {
      ready: valueState(releaseStatus?.release_ready),
      readySource: valueState(releaseStatus?.release_ready_source),
      statusSource: valueState(releaseStatus?.status_source),
      missingGates: missingGates.map((gate) => ({
        gateId: valueState(gate?.gate_id),
        status: valueState(gate?.status)
      }))
    },
    blockers: blockers.map((blocker) => ({
      id: valueState(blocker?.id),
      severity: valueState(blocker?.severity),
      source: valueState(blocker?.source),
      message: valueState(blocker?.message)
    })),
    evidenceRefs: evidenceRefs.map((ref) => ({
      kind: valueState(ref?.kind),
      taskId: valueState(ref?.task_id),
      ref: valueState(ref?.ref),
      source: valueState(ref?.source)
    })),
    boundaries: Object.entries({
      readOnly: boundaries.readOnly,
      writesInSnapshotPath: boundaries.writesInSnapshotPath,
      actionExecutionAvailable: boundaries.actionExecutionAvailable,
      jobQueueAvailable: boundaries.jobQueueAvailable,
      modelInvocationAvailable: boundaries.modelInvocationAvailable,
      gitWriteAvailable: boundaries.gitWriteAvailable,
      releaseWriteAvailable: boundaries.releaseWriteAvailable,
      arbitraryCommandExecutionAvailable: boundaries.arbitraryCommandExecutionAvailable,
      confirmCommandAvailable: boundaries.confirmCommandAvailable
    }).map(([boundary, available]) => ({
      boundary: valueState(boundary),
      available: valueState(available)
    })),
    note: 'Runtime snapshot is the shared read-only app state schema consumed by CLI and Workbench; it does not execute commands or infer approval, verification, or release readiness from frontend state.'
  };
}

function projectProjectRegistry({ result, registry }) {
  const projects = Array.isArray(registry?.projects)
    ? registry.projects
    : [];

  return {
    state: result?.ok === true ? (projects.length === 0 ? 'empty' : 'available') : 'missing',
    contractName: valueState(registry?.contractName),
    contractVersion: valueState(registry?.contractVersion),
    generatedAt: valueState(registry?.generatedAt),
    readOnly: valueState(registry?.readOnly),
    currentProjectId: valueState(registry?.currentProjectId),
    source: {
      kind: valueState(registry?.source?.kind),
      scanScope: valueState(registry?.source?.scanScope),
      writes: valueState(registry?.source?.writes)
    },
    projects: {
      state: projects.length === 0 ? 'empty' : 'available',
      count: valueState(projects.length),
      items: projects.map((project) => projectRegistryProject(project, registry?.currentProjectId))
    },
    resolution: {
      status: valueState(registry?.resolution?.status),
      strategy: valueState(registry?.resolution?.strategy),
      repoPath: valueState(registry?.resolution?.repoPath),
      stateDir: valueState(registry?.resolution?.stateDir)
    },
    boundaries: {
      readOnly: valueState(registry?.boundaries?.readOnly),
      diskScanScope: valueState(registry?.boundaries?.diskScanScope),
      registryDatabaseWritesAvailable: valueState(registry?.boundaries?.registryDatabaseWritesAvailable),
      actionExecutionAvailable: valueState(registry?.boundaries?.actionExecutionAvailable),
      modelInvocationAvailable: valueState(registry?.boundaries?.modelInvocationAvailable),
      gitWriteAvailable: valueState(registry?.boundaries?.gitWriteAvailable),
      releaseWriteAvailable: valueState(registry?.boundaries?.releaseWriteAvailable),
      arbitraryCommandExecutionAvailable: valueState(registry?.boundaries?.arbitraryCommandExecutionAvailable)
    },
    note: 'Project list comes from project-registry.v1. The route reads only cwd or an explicit repo path and does not scan the disk, run commands, write git state, or infer active goal status from frontend state.'
  };
}

function projectRecentProjects({ result, recentProjects }) {
  const items = Array.isArray(recentProjects?.items)
    ? recentProjects.items
    : [];
  const routeMissingState = result?.ok === true ? 'empty' : 'missing';

  return {
    state: result?.ok === true ? recentProjects?.state ?? (items.length === 0 ? 'empty' : 'available') : routeMissingState,
    contractName: valueState(recentProjects?.contractName),
    contractVersion: valueState(recentProjects?.contractVersion),
    generatedAt: valueState(recentProjects?.generatedAt),
    readOnly: valueState(recentProjects?.readOnly),
    source: {
      kind: valueState(recentProjects?.source?.kind),
      scanScope: valueState(recentProjects?.source?.scanScope),
      sourceContract: valueState(recentProjects?.source?.sourceContract),
      degradedReason: valueState(recentProjects?.source?.degradedReason)
    },
    items: {
      state: items.length === 0 ? 'empty' : 'available',
      count: valueState(items.length),
      items: items.map(projectRecentProjectItem)
    },
    boundaries: {
      readOnly: valueState(recentProjects?.boundaries?.readOnly),
      diskScanAvailable: valueState(recentProjects?.boundaries?.diskScanAvailable),
      scanScope: valueState(recentProjects?.boundaries?.scanScope),
      arbitraryPathReadAvailable: valueState(recentProjects?.boundaries?.arbitraryPathReadAvailable),
      commandExecutionAvailable: valueState(recentProjects?.boundaries?.commandExecutionAvailable),
      modelInvocationAvailable: valueState(recentProjects?.boundaries?.modelInvocationAvailable),
      gitWriteAvailable: valueState(recentProjects?.boundaries?.gitWriteAvailable),
      releaseWriteAvailable: valueState(recentProjects?.boundaries?.releaseWriteAvailable)
    },
    note: 'Recent projects come from recent-projects.v1, which wraps backend-known project-registry.v1 state. Source policy is known-projects-only; Workbench does not scan disk, accept arbitrary paths, run commands, invoke models, write git state, or write release state.'
  };
}

function projectCurrentProjectBinding({ result, binding }) {
  return {
    state: result?.ok === true ? binding?.state ?? 'missing' : 'missing',
    contractName: valueState(binding?.contractName),
    contractVersion: valueState(binding?.contractVersion),
    generatedAt: valueState(binding?.generatedAt),
    selectedProjectId: valueState(binding?.selectedProjectId),
    selectedProjectName: valueState(binding?.selectedProjectName),
    repoPath: valueState(binding?.repoPath),
    defaultBranch: valueState(binding?.defaultBranch),
    lastGoalId: valueState(binding?.lastGoalId),
    lastRunId: valueState(binding?.lastRunId),
    healthStatus: valueState(binding?.healthStatus),
    bindingSource: valueState(binding?.bindingSource),
    persisted: valueState(binding?.persisted),
    selectionUpdatedAt: valueState(binding?.selectionUpdatedAt),
    fallbackReason: valueState(binding?.fallbackReason),
    route: valueState(result?.routeDescriptor?.path ?? '/api/projects/current-binding'),
    routeState: valueState(result?.ok === true ? binding?.routeState ?? 'ready' : routeStateFromResult(result)),
    readOnly: valueState(binding?.readOnly),
    sourcePolicy: valueState(binding?.sourcePolicy ?? 'backend-known project id only; no frontend path input'),
    selectionControl: {
      state: valueState(binding?.selectionControl?.state),
      endpointId: valueState(binding?.selectionControl?.endpointId),
      disabledReason: valueState(binding?.selectionControl?.disabledReason)
    },
    boundaries: {
      selectionOnly: valueState(binding?.boundaries?.selectionOnly),
      acceptsProjectIdOnly: valueState(binding?.boundaries?.acceptsProjectIdOnly),
      arbitraryPathSubmissionAvailable: valueState(binding?.boundaries?.arbitraryPathSubmissionAvailable),
      frontendFilesystemScanAvailable: valueState(binding?.boundaries?.frontendFilesystemScanAvailable),
      frontendArbitraryPathReadAvailable: valueState(binding?.boundaries?.frontendArbitraryPathReadAvailable),
      commandExecutionAvailable: valueState(binding?.boundaries?.commandExecutionAvailable),
      providerLaunchAvailable: valueState(binding?.boundaries?.providerLaunchAvailable),
      goalMutationAvailable: valueState(binding?.boundaries?.goalMutationAvailable),
      childDispatchAvailable: valueState(binding?.boundaries?.childDispatchAvailable),
      jobExecutionAvailable: valueState(binding?.boundaries?.jobExecutionAvailable),
      gitWriteAvailable: valueState(binding?.boundaries?.gitWriteAvailable),
      releaseWriteAvailable: valueState(binding?.boundaries?.releaseWriteAvailable),
      rawTranscriptReadAvailable: valueState(binding?.boundaries?.rawTranscriptReadAvailable)
    },
    note: 'Current project binding comes from current-project-binding.v1. Selection accepts only a backend-known project id through the backend contract; Workbench does not accept paths, scan disk, mutate goals, launch providers, run jobs, or write git/release state.'
  };
}

function projectRecentProjectItem(item) {
  return {
    projectId: valueState(item?.projectId),
    displayName: valueState(item?.displayName),
    repoPath: valueState(item?.repoPath?.displayValue),
    defaultBranch: valueState(item?.defaultBranch),
    remote: valueState(item?.remote?.displayValue),
    pinned: valueState(item?.pinned),
    lastOpenedAt: valueState(item?.lastOpenedAt),
    lastGoalId: valueState(item?.lastGoalId),
    lastRunId: valueState(item?.lastRunId),
    healthSummary: {
      state: valueState(item?.healthSummary?.state),
      text: valueState(item?.healthSummary?.text)
    },
    degradedReason: valueState(item?.degradedReason)
  };
}

function projectRegistryProject(project, currentProjectId) {
  const isCurrentProject = project?.project_id === currentProjectId;

  return {
    projectId: valueState(project?.project_id),
    name: valueState(project?.project_name),
    repoPath: valueState(project?.repo_path),
    defaultBranch: valueState(project?.default_branch),
    remoteUrl: valueState(project?.remote_url),
    lastGoalId: valueState(project?.last_goal_id),
    lastRunId: valueState(project?.last_run_id),
    healthStatus: valueState(project?.health_status),
    lastOpenedAt: valueState(project?.last_opened_at),
    pinned: valueState(project?.pinned),
    current: valueState(isCurrentProject)
  };
}

function projectSidecarHostLifecycle(sidecarHost) {
  const attach = sidecarHost?.attach ?? {};
  const launcher = sidecarHost?.launcher ?? {};
  const boundaries = sidecarHost?.boundaries ?? {};

  return {
    contractName: valueState(sidecarHost?.contractName),
    contractVersion: valueState(sidecarHost?.contractVersion),
    lifecycle: valueState(sidecarHost?.lifecycle),
    hostKind: valueState(sidecarHost?.hostKind),
    sidecarKind: valueState(sidecarHost?.sidecarKind),
    attachState: valueState(attach.state),
    attachStrategy: valueState(attach.strategy),
    healthRoute: valueState(attach.healthRoute),
    endpoint: valueState(attach.endpoint),
    attachSourceContract: valueState(attach.sourceContract),
    launcherState: valueState(launcher.state),
    launcherCommandId: valueState(launcher.commandId),
    nativeHostRequired: valueState(launcher.nativeHostRequired),
    rendererLaunchAvailable: valueState(launcher.rendererLaunchAvailable),
    stateDirScope: valueState(launcher.stateDirScope),
    launcherSource: valueState(launcher.source),
    boundaries: {
      rendererShellExecutionAvailable: valueState(boundaries.rendererShellExecutionAvailable),
      genericShellRunnerAvailable: valueState(boundaries.genericShellRunnerAvailable),
      arbitraryCommandAvailable: valueState(boundaries.arbitraryCommandAvailable),
      arbitraryPathAvailable: valueState(boundaries.arbitraryPathAvailable)
    }
  };
}

function projectAppDataInventory({ result, inventory }) {
  const domains = Array.isArray(inventory?.domains) ? inventory.domains : [];
  const evidenceRefs = Array.isArray(inventory?.evidenceRefs) ? inventory.evidenceRefs : [];

  return {
    state: result?.ok === true ? (domains.length > 0 ? 'available' : 'empty') : 'missing',
    modelName: valueState('AppDataInventoryPanel'),
    contractName: valueState(inventory?.contractName),
    contractVersion: valueState(inventory?.contractVersion),
    generatedAt: valueState(inventory?.generatedAt),
    readOnly: valueState(inventory?.readOnly),
    goalId: valueState(inventory?.context?.goalId),
    taskId: valueState(inventory?.context?.taskId),
    sourcePolicy: valueState(inventory?.context?.stateSource),
    inventoryScope: valueState(inventory?.context?.inventoryScope),
    domainCount: valueState(inventory?.summary?.domainCount),
    availableDomainCount: valueState(inventory?.summary?.availableDomainCount),
    evidenceRefCount: valueState(inventory?.summary?.evidenceRefCount),
    persistedDataKinds: textState(Array.isArray(inventory?.summary?.persistedDataKinds)
      ? inventory.summary.persistedDataKinds.join(' / ')
      : undefined),
    settings: {
      stateDir: valueState(inventory?.settings?.stateDir),
      artifactStoreDir: valueState(inventory?.settings?.artifactStoreDir),
      repoPath: valueState(inventory?.settings?.repoPath),
      settingsWriteAvailable: valueState(inventory?.settings?.settingsWriteAvailable),
      secretValueExposureAvailable: valueState(inventory?.settings?.secretValueExposureAvailable)
    },
    domains: {
      state: domains.length > 0 ? 'available' : 'empty',
      count: valueState(domains.length),
      items: domains.map((domain) => ({
        domainId: valueState(domain.domainId),
        label: valueState(domain.label),
        contractName: valueState(domain.contractName),
        route: valueState(domain.route),
        storageKind: valueState(domain.storageKind),
        canonicalSource: valueState(domain.canonicalSource),
        state: valueState(domain.state),
        itemCount: valueState(domain.itemCount),
        refs: {
          state: Array.isArray(domain.refs) && domain.refs.length > 0 ? 'available' : 'empty',
          count: valueState(Array.isArray(domain.refs) ? domain.refs.length : 0),
          items: Array.isArray(domain.refs)
            ? domain.refs.map((ref) => ({
                kind: valueState(ref.kind),
                value: valueState(ref.value)
              }))
            : []
        },
        boundaries: boundaryListState(domain.boundaries)
      }))
    },
    evidenceRefs: {
      state: evidenceRefs.length > 0 ? 'available' : 'empty',
      count: valueState(evidenceRefs.length),
      items: evidenceRefs.map((ref) => ({
        kind: valueState(ref.kind),
        ref: valueState(ref.ref),
        source: valueState(ref.source)
      }))
    },
    boundaries: boundaryListState(inventory?.boundaries),
    note: 'App Data Inventory lists saved app data domains from backend contracts only. It does not read evidence bodies, execute shell commands, open local files, invoke models, mutate jobs, write git state, expose secrets, or declare release readiness.'
  };
}

function projectInboxCapture({ result, capture }) {
  const captureItemTypes = Array.isArray(capture?.captureItemTypes) ? capture.captureItemTypes : [];
  const allowedNextSteps = Array.isArray(capture?.handoff?.allowedNextSteps) ? capture.handoff.allowedNextSteps : [];
  const blockedInferenceSources = Array.isArray(capture?.handoff?.blockedInferenceSources)
    ? capture.handoff.blockedInferenceSources
    : [];

  return {
    state: result?.ok === true ? 'available' : 'missing',
    modelName: valueState('InboxCapturePanel'),
    contractName: valueState(capture?.contractName),
    contractVersion: valueState(capture?.contractVersion),
    generatedAt: valueState(capture?.generatedAt),
    readOnly: valueState(capture?.readOnly),
    goalId: valueState(capture?.context?.goalId),
    taskId: valueState(capture?.context?.taskId),
    sourcePolicy: valueState(capture?.context?.stateSource),
    appPath: valueState(capture?.context?.appPath),
    sourceContracts: projectTextItems(capture?.context?.sourceContracts),
    intakeSurface: {
      route: valueState(capture?.intakeSurface?.route),
      cliCommand: valueState(capture?.intakeSurface?.cliCommand),
      workbenchPanel: valueState(capture?.intakeSurface?.workbenchPanel),
      acceptsRawRequests: valueState(capture?.intakeSurface?.acceptsRawRequests),
      requiresActiveWorkbenchGoal: valueState(capture?.intakeSurface?.requiresActiveWorkbenchGoal),
      writesInPreview: valueState(capture?.intakeSurface?.writesInPreview)
    },
    captureDraft: {
      contractName: valueState(capture?.captureDraft?.contractName),
      persisted: valueState(capture?.captureDraft?.persisted),
      requiredFields: arrayTextState(capture?.captureDraft?.requiredFields),
      optionalFields: arrayTextState(capture?.captureDraft?.optionalFields),
      bodyReadAvailable: valueState(capture?.captureDraft?.bodyReadAvailable),
      validationSource: valueState(capture?.captureDraft?.validationSource),
      nextContract: valueState(capture?.captureDraft?.nextContract)
    },
    captureItemTypes: {
      state: captureItemTypes.length > 0 ? 'available' : 'empty',
      count: valueState(captureItemTypes.length),
      items: captureItemTypes.map((item) => ({
        itemType: valueState(item.itemType),
        label: valueState(item.label),
        summary: valueState(item.summary),
        requiresWorkbenchGoal: valueState(item.requiresWorkbenchGoal),
        routesImmediately: valueState(item.routesImmediately),
        allowedBeforeGoalExists: valueState(item.allowedBeforeGoalExists)
      }))
    },
    handoff: {
      routerContract: valueState(capture?.handoff?.routerContract),
      goalDraftContract: valueState(capture?.handoff?.goalDraftContract),
      workbenchGoalRequiredForCapture: valueState(capture?.handoff?.workbenchGoalRequiredForCapture),
      workbenchGoalRequiredForGoalDraft: valueState(capture?.handoff?.workbenchGoalRequiredForGoalDraft),
      allowedNextSteps: projectTextItems(allowedNextSteps),
      blockedInferenceSources: projectTextItems(blockedInferenceSources)
    },
    boundaries: boundaryListState(capture?.boundaries),
    note: 'Inbox Capture shows the app entry contract for raw requests, project clues, ideas, and faults before Workbench routing. It is read-only and does not execute shell commands, invoke models, persist capture items, create goals, self-approve, main-verify, or declare release readiness.'
  };
}

function boundaryListState(boundaries) {
  if (boundaries === null || boundaries === undefined || typeof boundaries !== 'object' || Array.isArray(boundaries)) {
    return { state: 'missing', count: valueState(undefined), items: [] };
  }

  const items = Object.entries(boundaries).map(([key, val]) => ({
    key: valueState(key),
    value: valueState(val)
  }));

  return {
    state: items.length === 0 ? 'empty' : 'available',
    count: valueState(items.length),
    items
  };
}

function snapshotRuntimeState(snapshot) {
  if (snapshot?.freshness?.status === 'stale') {
    return 'stale';
  }

  if (snapshot?.current_project?.currentProject === null || snapshot?.current_project?.resolution?.status !== 'resolved') {
    return 'empty';
  }

  if (snapshot?.active_goal === null) {
    return 'empty';
  }

  if (snapshot?.runtime_health?.status === 'blocked' || snapshot?.next_action?.next?.blocked === true || snapshot?.next_action?.status === 'blocked') {
    return 'blocked';
  }

  return 'healthy';
}

function projectDesktopShell({
  projectRegistry,
  recentProjects,
  currentProjectBinding,
  runtimeSnapshot,
  activeGoal,
  jobConsole,
  artifactRefs,
  artifactIndex,
  evidenceTimeline,
  releaseBundle,
  backupExport,
  restoreValidation,
  diagnosticsBundle,
  providerHub,
  supervisorDashboard,
  systemGoldenPath,
  childDispatchPreview,
  codexProviderExecutionPreview,
  codexProviderRunRecovery,
  reviewerHandoffPreview,
  threadHandoffPack,
  reviewGatePreview,
  reviewGateConfirmationState,
  releaseCloseoutHandoffPack,
  releasePublicationEvidence,
  stableWorkbenchRelease,
  routeStates
}) {
  const projectRoute = findProjectedRoute(routeStates, 'projectRegistry');
  const recentProjectsRoute = findProjectedRoute(routeStates, 'recentProjects');
  const currentProjectBindingRoute = findProjectedRoute(routeStates, 'currentProjectBinding');
  const runtimeRoute = findProjectedRoute(routeStates, 'runtimeSnapshot');
  const goalRoute = findProjectedRoute(routeStates, 'goalRunbook');
  const nextRoute = findProjectedRoute(routeStates, 'goalNextAction');
  const supervisorRoute = findProjectedRoute(routeStates, 'goalSupervisor');
  const jobRoute = findProjectedRoute(routeStates, 'jobModel');
  const jobCreationRoute = findProjectedRoute(routeStates, 'jobCreation');
  const jobTimelineRoute = findProjectedRoute(routeStates, 'jobTimeline');
  const jobRunControlRoute = findProjectedRoute(routeStates, 'jobRunControl');
  const artifactRoute = findProjectedRoute(routeStates, 'artifactIndex');
  const evidenceRoute = findProjectedRoute(routeStates, 'evidenceTimeline');
  const releaseBundleRoute = findProjectedRoute(routeStates, 'releaseBundle');
  const backupExportRoute = findProjectedRoute(routeStates, 'backupExport');
  const restoreValidationRoute = findProjectedRoute(routeStates, 'restoreValidation');
  const diagnosticsBundleRoute = findProjectedRoute(routeStates, 'diagnosticsBundle');
  const sidecarHost = runtimeSnapshot?.runtime?.sidecarHost;
  const currentProject = currentProjectFromRegistry(projectRegistry);
  const boundProject = currentProjectFromBinding(currentProjectBinding);
  const hasBoundProject = currentProjectBinding?.state === 'bound';
  const backendHealth = projectDesktopBackendHealth({
    runtimeSnapshot,
    runtimeRoute
  });
  const supervisorSummary = projectDesktopSupervisorSummary({
    supervisorDashboard,
    supervisorRoute
  });
  const routeProvenance = projectDesktopRouteProvenance({
    routeStates,
    runtimeSnapshot
  });
  const sidecarAttachState = firstValue(sidecarHost?.attachState);
  const sidecarState = sidecarAttachState === 'attached'
    ? 'attached'
    : sidecarAttachState === undefined
      ? 'missing'
      : runtimeSnapshot?.state === 'stale' ? 'stale' : 'needs-attention';
  const currentTaskText = [
    firstValue(activeGoal?.nextAction?.next?.taskId, runtimeSnapshot?.currentTask?.taskId),
    firstValue(activeGoal?.nextAction?.next?.role, runtimeSnapshot?.currentTask?.role),
    firstValue(activeGoal?.nextAction?.next?.phase, runtimeSnapshot?.currentTask?.phase)
  ].filter((value) => isNonEmptyString(value)).join(' / ');
  const runHealthText = [
    firstValue(jobConsole?.jobModel?.status),
    firstValue(jobConsole?.jobModel?.queueState)
  ].filter((value) => isNonEmptyString(value)).join(' / ');
  const firstRowCards = [
    {
      id: valueState('active-goal'),
      label: valueState('Active goal'),
      value: valueState(firstValue(activeGoal?.viewModel?.goalId, runtimeSnapshot?.activeGoal?.goalId)),
      detail: valueState(firstValue(activeGoal?.viewModel?.title, runtimeSnapshot?.activeGoal?.title)),
      state: valueState(activeGoal?.viewModel?.state ?? runtimeSnapshot?.state),
      source: valueState('app-state-snapshot.v1 + goal-runbook.v1 + goal-progress-ledger.v1')
    },
    {
      id: valueState('next-action'),
      label: valueState('Next action'),
      value: valueState(currentTaskText),
      detail: valueState(firstValue(activeGoal?.nextAction?.reason, runtimeSnapshot?.nextAction?.reason)),
      state: valueState(firstValue(activeGoal?.nextAction?.status, runtimeSnapshot?.nextAction?.status)),
      source: valueState('goal-next-action.v1')
    },
    {
      id: valueState('run-health'),
      label: valueState('Run health'),
      value: valueState(runHealthText),
      detail: valueState(`job routes ${routeStateFromRoute(jobRoute)}; evidence timeline ${evidenceTimeline?.state ?? 'missing'}`),
      state: valueState(jobConsole?.state),
      source: valueState('job-model.v1 + job-timeline-log-stream.v1')
    }
  ];
  const workspace = {
    state: valueState(firstValue(boundProject?.name, runtimeSnapshot?.project?.name, currentProject?.name) === undefined ? 'missing' : 'available'),
    project: valueState(firstValue(boundProject?.name, runtimeSnapshot?.project?.name, currentProject?.name)),
    projectId: valueState(firstValue(boundProject?.projectId, runtimeSnapshot?.project?.id, currentProject?.projectId)),
    repoPath: valueState(firstValue(boundProject?.repoPath, runtimeSnapshot?.project?.repoPath, currentProject?.repoPath)),
    repoPathSource: valueState(hasBoundProject && firstValue(boundProject?.repoPath) !== undefined
      ? 'current-project-binding.v1 selected project'
      : firstValue(runtimeSnapshot?.project?.repoPath) !== undefined
        ? 'app-state-snapshot.v1 current_project'
        : firstValue(currentProject?.repoPath) !== undefined ? 'project-registry.v1 current project' : undefined),
    defaultBranch: valueState(firstValue(boundProject?.defaultBranch, runtimeSnapshot?.project?.defaultBranch, currentProject?.defaultBranch)),
    lastGoalId: valueState(firstValue(boundProject?.lastGoalId, runtimeSnapshot?.project?.lastGoalId, currentProject?.lastGoalId)),
    lastRunId: valueState(firstValue(boundProject?.lastRunId, runtimeSnapshot?.project?.lastRunId, currentProject?.lastRunId)),
    resolutionStatus: valueState(firstValue(runtimeSnapshot?.project?.status, projectRegistry?.resolution?.status)),
    route: valueState(currentProjectBindingRoute?.path ?? projectRoute?.path),
    routeState: valueState(routeStateFromRoute(currentProjectBindingRoute ?? projectRoute)),
    sourcePolicy: valueState('current-project-binding.v1 + app-state-snapshot.v1 current_project + project-registry.v1')
  };
  const activeGoalStatus = {
    state: valueState(firstValue(activeGoal?.viewModel?.state, runtimeSnapshot?.state)),
    goalId: valueState(firstValue(activeGoal?.viewModel?.goalId, runtimeSnapshot?.activeGoal?.goalId)),
    title: valueState(firstValue(activeGoal?.viewModel?.title, runtimeSnapshot?.activeGoal?.title)),
    completedTasks: runtimeSnapshot?.activeGoal?.completedTasks,
    totalTasks: runtimeSnapshot?.activeGoal?.totalTasks,
    currentTaskId: valueState(firstValue(activeGoal?.taskQueue?.nextTaskId, runtimeSnapshot?.currentTask?.taskId)),
    currentTaskStatus: runtimeSnapshot?.currentTask?.status,
    currentTaskBlocked: runtimeSnapshot?.currentTask?.blocked,
    reviewVerdict: runtimeSnapshot?.review?.verdict,
    reviewEvidenceRef: runtimeSnapshot?.review?.evidenceRef,
    mainVerificationStatus: runtimeSnapshot?.mainVerification?.status,
    mainVerificationEvidenceRef: runtimeSnapshot?.mainVerification?.evidenceRef,
    releaseReady: runtimeSnapshot?.release?.ready,
    releaseReadySource: runtimeSnapshot?.release?.readySource,
    missingReleaseGates: valueState((runtimeSnapshot?.release?.missingGates ?? []).length),
    blockerCount: valueState((runtimeSnapshot?.blockers ?? []).length),
    route: valueState(goalRoute?.path),
    routeState: valueState(routeStateFromRoute(goalRoute)),
    sourcePolicy: valueState('app-state-snapshot.v1 + goal-progress-ledger.v1 + goal-event-log.v1')
  };
  const nextActionDetail = {
    state: valueState(firstValue(activeGoal?.nextAction?.status, runtimeSnapshot?.nextAction?.status)),
    taskId: valueState(firstValue(activeGoal?.nextAction?.next?.taskId, runtimeSnapshot?.currentTask?.taskId)),
    role: valueState(firstValue(activeGoal?.nextAction?.next?.role, runtimeSnapshot?.currentTask?.role)),
    phase: valueState(firstValue(activeGoal?.nextAction?.next?.phase, runtimeSnapshot?.currentTask?.phase)),
    reason: valueState(firstValue(activeGoal?.nextAction?.reason, runtimeSnapshot?.nextAction?.reason)),
    blocked: activeGoal?.nextAction?.next?.blocked ?? runtimeSnapshot?.currentTask?.blocked,
    registerWith: valueState(firstValue(activeGoal?.nextAction?.afterCompletion?.registerWith, runtimeSnapshot?.nextAction?.registerWith)),
    route: valueState(nextRoute?.path),
    routeState: valueState(routeStateFromRoute(nextRoute)),
    sourcePolicy: valueState('goal-next-action.v1')
  };
  const boundaries = projectDesktopBoundaryFlags();
  const projectHealth = projectDesktopProjectHealth({
    workspace,
    backendHealth,
    activeGoalStatus,
    supervisorSummary,
    jobConsole,
    artifactIndex,
    routeProvenance,
    currentProjectBinding
  });
  const selectedProject = projectDesktopSelectedProject({
    workspace,
    currentProjectBinding,
    projectHealth
  });
  const appStates = projectDesktopAppStateFlags({
    backendHealth,
    sidecarState,
    workspace,
    activeGoalStatus,
    supervisorSummary,
    runtimeSnapshot,
    routeProvenance,
    currentProjectBinding
  });

  return {
    state: runtimeSnapshot?.state === 'healthy' ? 'ready' : runtimeSnapshot?.state ?? 'missing',
    modelName: valueState('DesktopAppHomeViewModel'),
    route: {
      path: valueState('/workbench/desktop/'),
      routeState: valueState('client-rendered'),
      source: valueState('Workbench Vite route hosted by the local console sidecar')
    },
    appHome: {
      title: valueState('Symphony App Home'),
      state: valueState(appStates.routeFailed.value === true ? 'route-failed' : runtimeSnapshot?.state ?? 'missing'),
      routePath: valueState('/workbench/desktop/'),
      routeSource: valueState('Tauri window route / Workbench Vite renderer'),
      sourcePolicy: valueState('existing read-only Workbench contracts only')
    },
    shellDecision: {
      selected: valueState('Tauri-first desktop shell'),
      deferredAlternative: valueState('Electron deferred'),
      rationale: valueState('Tauri hosts the existing Workbench renderer and exposes only controlled sidecar attach/launch commands during v37 task-2.'),
      workspace: valueState('desktop/shell/src-tauri + /workbench/desktop/'),
      hostBridgeAvailable: valueState(sidecarHost?.launcherCommandId?.state === 'available'),
      nativeBuildAvailableNow: valueState(false)
    },
    sidecarHealth: {
      state: valueState(sidecarState),
      status: runtimeSnapshot?.runtime?.status,
      mode: runtimeSnapshot?.runtime?.mode,
      version: runtimeSnapshot?.runtime?.version,
      kernel: runtimeSnapshot?.runtime?.kernel,
      cwd: runtimeSnapshot?.runtime?.cwd,
      repoPath: runtimeSnapshot?.runtime?.repoPath,
      route: valueState(runtimeRoute?.path),
      routeState: valueState(routeStateFromRoute(runtimeRoute)),
      attachState: sidecarHost?.attachState,
      attachStrategy: sidecarHost?.attachStrategy,
      lifecycleContract: sidecarHost?.contractName,
      launcherState: sidecarHost?.launcherState,
      launcherCommandId: sidecarHost?.launcherCommandId,
      launcherAvailable: valueState(firstValue(sidecarHost?.launcherState) === 'defined'),
      rendererLaunchAvailable: sidecarHost?.rendererLaunchAvailable,
      fixedLauncherContract: valueState('attach_sidecar + launch_sidecar + symphony.console.sidecar.launch'),
      commandPreviewInert: valueState('pnpm symphony console --host <loopback> --port <allowed-port>'),
      launcherHandoff: valueState(firstValue(sidecarHost?.launcherCommandId) || 'native host bridge unavailable')
    },
    backendHealth,
    workspace,
    projectList: {
      state: projectRegistry?.state ?? 'missing',
      contractName: projectRegistry?.contractName,
      route: valueState(projectRoute?.path),
      routeState: valueState(routeStateFromRoute(projectRoute)),
      currentProjectId: projectRegistry?.currentProjectId,
      sourcePolicy: valueState('project-registry.v1 + current-project-resolver.v1'),
      scanScope: projectRegistry?.source?.scanScope,
      projects: projectRegistry?.projects ?? {
        state: 'missing',
        count: valueState(undefined),
        items: []
      }
    },
    currentProjectBinding,
    selectedProject,
    projectHealth,
    recentProjects: {
      state: recentProjects?.state ?? 'missing',
      contractName: recentProjects?.contractName,
      route: valueState(recentProjectsRoute?.path),
      routeState: valueState(routeStateFromRoute(recentProjectsRoute)),
      sourcePolicy: valueState('recent-projects.v1 wraps project-registry.v1; known-projects-only'),
      source: recentProjects?.source ?? {
        kind: valueState(undefined),
        scanScope: valueState(undefined),
        sourceContract: valueState(undefined),
        degradedReason: valueState(undefined)
      },
      items: recentProjects?.items ?? {
        state: 'missing',
        count: valueState(undefined),
        items: []
      },
      boundaries: recentProjects?.boundaries ?? {
        readOnly: valueState(undefined),
        diskScanAvailable: valueState(undefined),
        scanScope: valueState(undefined),
        arbitraryPathReadAvailable: valueState(undefined),
        commandExecutionAvailable: valueState(undefined),
        modelInvocationAvailable: valueState(undefined),
        gitWriteAvailable: valueState(undefined),
        releaseWriteAvailable: valueState(undefined)
      }
    },
    activeGoalStatus,
    nextActionDetail,
    supervisorSummary,
    firstRowCards: {
      state: firstRowCards.length === 0 ? 'empty' : 'available',
      items: firstRowCards
    },
    lifecycle: {
      state: activeGoal?.taskQueue?.state ?? 'missing',
      taskCount: activeGoal?.taskQueue?.totalTasks,
      nextTaskId: activeGoal?.taskQueue?.nextTaskId,
      nextRole: activeGoal?.taskQueue?.nextRole,
      nextPhase: activeGoal?.taskQueue?.nextPhase,
      route: valueState(goalRoute?.path),
      routeState: valueState(routeStateFromRoute(goalRoute)),
      tasks: {
        state: activeGoal?.taskQueue?.tasks?.state ?? activeGoal?.taskQueue?.state ?? 'missing',
        items: (activeGoal?.taskQueue?.items ?? []).slice(0, 5)
      }
    },
    jobRun: projectDesktopJobRun({
      jobConsole,
      jobRoute,
      jobCreationRoute,
      jobTimelineRoute,
      jobRunControlRoute
    }),
    artifactReadiness: projectDesktopArtifactReadiness({
      artifactRefs,
      artifactIndex,
      evidenceTimeline,
      releaseBundle,
      backupExport,
      restoreValidation,
      diagnosticsBundle,
      artifactRoute,
      evidenceRoute,
      releaseBundleRoute,
      backupExportRoute,
      restoreValidationRoute,
      diagnosticsBundleRoute
    }),
    providerHub,
    systemGoldenPath,
    childDispatchPreview,
    codexProviderExecutionPreview,
    codexProviderRunRecovery,
    reviewerHandoffPreview,
    threadHandoffPack,
    reviewGatePreview,
    reviewGateConfirmationState,
    releaseCloseoutHandoffPack,
    releasePublicationEvidence,
    stableWorkbenchRelease,
    routeProvenance,
    appStates,
    boundaries,
    note: 'App Home is a first-screen desktop surface over existing read-only local API contracts. It does not execute shell commands, start jobs, open files, call models, self-approve, mutate goals, push git state, or declare release completion.'
  };
}

function projectSystemGoldenPath({
  contract,
  supervisorRoute
}) {
  const hasContract = contract !== null && contract !== undefined && typeof contract === 'object' && !Array.isArray(contract);
  const steps = hasContract && Array.isArray(contract.steps) ? contract.steps : [];
  const sourceContracts = hasContract && Array.isArray(contract.sourceContracts) ? contract.sourceContracts : [];
  const blockedReasons = hasContract && Array.isArray(contract.blockedReasons) ? contract.blockedReasons : [];
  const manualActions = [
    contract?.nextSafeAction,
    ...steps.map((step) => step?.nextSafeAction)
  ].filter((action) => action?.kind === 'manual-cli-required');

  return {
    state: hasContract ? contract.overallState ?? 'available' : 'missing',
    contractName: valueState(contract?.contractName),
    contractVersion: valueState(contract?.contractVersion),
    generatedAt: valueState(contract?.generatedAt),
    overallState: valueState(contract?.overallState),
    project: {
      projectId: valueState(contract?.project?.projectId),
      selected: valueState(contract?.project?.selected),
      state: valueState(contract?.project?.state)
    },
    goal: {
      goalId: valueState(contract?.goal?.goalId),
      taskId: valueState(contract?.goal?.taskId),
      title: valueState(contract?.goal?.title)
    },
    nextSafeAction: projectSystemGoldenPathAction(contract?.nextSafeAction),
    blockedReasons: projectSystemGoldenPathTextItems(blockedReasons),
    manualRequired: projectSystemGoldenPathManualActions(manualActions),
    sourceContracts: {
      state: sourceContracts.length === 0 ? (hasContract ? 'empty' : 'missing') : 'available',
      count: valueState(hasContract ? sourceContracts.length : undefined),
      items: sourceContracts.map(projectSystemGoldenPathSourceContract)
    },
    steps: {
      state: steps.length === 0 ? (hasContract ? 'empty' : 'missing') : 'available',
      count: valueState(hasContract ? steps.length : undefined),
      items: steps.map(projectSystemGoldenPathStep)
    },
    routeProvenance: {
      source: valueState(contract?.routeProvenance?.source),
      readModelOwner: valueState(contract?.routeProvenance?.readModelOwner),
      workbenchSurface: valueState(contract?.routeProvenance?.workbenchSurface),
      refreshRouteTemplate: valueState(contract?.routeProvenance?.refreshRouteTemplate),
      refreshMethod: valueState(contract?.routeProvenance?.refreshMethod),
      frontendLocalFileReads: valueState(contract?.routeProvenance?.frontendLocalFileReads),
      mutationRoutes: projectSystemGoldenPathTextItems(contract?.routeProvenance?.mutationRoutes)
    },
    boundaries: Object.fromEntries(
      Object.entries(contract?.boundaries ?? {}).map(([key, value]) => [key, valueState(value)])
    ),
    route: {
      path: valueState(supervisorRoute?.path),
      routeState: valueState(routeStateFromRoute(supervisorRoute)),
      source: valueState('goal-supervisor-app-read-model.v1 systemGoldenPath projection')
    },
    note: hasContract
      ? 'System Golden Path is projected from backend-owned systemGoldenPath.v1. Workbench displays state only and refreshes through the existing contract loader.'
      : 'System Golden Path is unavailable until goal-supervisor-app-read-model.v1 exposes systemGoldenPath.v1.'
  };
}

function projectSystemGoldenPathStep(step) {
  return {
    id: valueState(step?.id),
    label: valueState(step?.label),
    state: valueState(step?.state),
    sourceContract: valueState(step?.sourceContract),
    sourceRef: projectSystemGoldenPathSourceRef(step?.sourceRef),
    blockedReasons: projectSystemGoldenPathTextItems(step?.blockedReasons),
    nextSafeAction: projectSystemGoldenPathAction(step?.nextSafeAction),
    willMutate: valueState(step?.willMutate)
  };
}

function projectSystemGoldenPathSourceContract(sourceContract) {
  return {
    contractName: valueState(sourceContract?.contractName),
    contractVersion: valueState(sourceContract?.contractVersion),
    readOnly: valueState(sourceContract?.readOnly),
    requiredFor: projectSystemGoldenPathTextItems(sourceContract?.requiredFor),
    sourceRef: projectSystemGoldenPathSourceRef(sourceContract?.sourceRef)
  };
}

function projectSystemGoldenPathSourceRef(sourceRef) {
  return {
    kind: valueState(sourceRef?.kind),
    ref: valueState(sourceRef?.ref)
  };
}

function projectChildDispatchPreview({
  contract,
  supervisorRoute
}) {
  const hasContract = contract !== null && contract !== undefined && typeof contract === 'object' && !Array.isArray(contract);
  const taskPack = hasContract && contract.taskPack !== null && typeof contract.taskPack === 'object' && !Array.isArray(contract.taskPack)
    ? contract.taskPack
    : null;
  const resultExpectation = hasContract && contract.resultExpectation !== null && typeof contract.resultExpectation === 'object' && !Array.isArray(contract.resultExpectation)
    ? contract.resultExpectation
    : null;
  const allowedProviders = Array.isArray(contract?.providerRecommendation?.allowedProviders)
    ? contract.providerRecommendation.allowedProviders
    : taskPack?.allowedProviders;

  return {
    state: hasContract ? contract.readiness?.state ?? 'available' : 'missing',
    contractName: valueState(contract?.contractName),
    contractVersion: valueState(contract?.contractVersion),
    generatedAt: valueState(contract?.generatedAt),
    goal: {
      goalId: valueState(contract?.goal?.goalId),
      title: valueState(contract?.goal?.title),
      state: valueState(contract?.goal?.state),
      sourceContract: valueState(contract?.goal?.sourceContract),
      sourceRef: projectSystemGoldenPathSourceRef(contract?.goal?.sourceRef)
    },
    task: {
      taskId: valueState(contract?.task?.taskId),
      title: valueState(contract?.task?.title),
      state: valueState(contract?.task?.state),
      sourceContract: valueState(contract?.task?.sourceContract),
      sourceRef: projectSystemGoldenPathSourceRef(contract?.task?.sourceRef)
    },
    requestedRole: valueState(contract?.requestedRole),
    providerRecommendation: {
      contractName: valueState(contract?.providerRecommendation?.contractName),
      providerId: valueState(contract?.providerRecommendation?.providerId),
      role: valueState(contract?.providerRecommendation?.role),
      allowedProviders: projectSystemGoldenPathTextItems(allowedProviders),
      rationale: valueState(contract?.providerRecommendation?.rationale),
      copyOnly: valueState(contract?.providerRecommendation?.copyOnly),
      providerExecutionAvailable: valueState(contract?.providerRecommendation?.providerExecutionAvailable),
      actualChildDispatchAvailable: valueState(contract?.providerRecommendation?.actualChildDispatchAvailable)
    },
    readiness: {
      state: valueState(contract?.readiness?.state),
      canPreview: valueState(contract?.readiness?.canPreview),
      copyAvailable: valueState(contract?.readiness?.copyAvailable),
      requiresManualCopy: valueState(contract?.readiness?.requiresManualCopy),
      providerExecutionAvailable: valueState(contract?.readiness?.providerExecutionAvailable),
      actualChildDispatchAvailable: valueState(contract?.readiness?.actualChildDispatchAvailable)
    },
    blockedReasons: projectSystemGoldenPathTextItems(contract?.blockedReasons),
    sourceContracts: {
      state: Array.isArray(contract?.sourceContracts) && contract.sourceContracts.length > 0 ? 'available' : hasContract ? 'empty' : 'missing',
      count: valueState(Array.isArray(contract?.sourceContracts) ? contract.sourceContracts.length : undefined),
      items: (Array.isArray(contract?.sourceContracts) ? contract.sourceContracts : []).map(projectChildDispatchSourceContract)
    },
    sourceRefs: {
      state: Array.isArray(contract?.sourceRefs) && contract.sourceRefs.length > 0 ? 'available' : hasContract ? 'empty' : 'missing',
      count: valueState(Array.isArray(contract?.sourceRefs) ? contract.sourceRefs.length : undefined),
      items: (Array.isArray(contract?.sourceRefs) ? contract.sourceRefs : []).map(projectSystemGoldenPathSourceRef)
    },
    taskPack: projectChildDispatchTaskPack(taskPack),
    resultExpectation: projectChildDispatchResultExpectation(resultExpectation),
    boundaries: projectChildDispatchBoundaries(contract?.boundaries),
    route: {
      path: valueState(supervisorRoute?.path),
      routeState: valueState(routeStateFromRoute(supervisorRoute)),
      source: valueState('goal-supervisor-app-read-model.v1 childDispatchPreview projection')
    },
    note: hasContract
      ? 'Child Dispatch Preview is copy-only and returns external results through v51 Result Intake.'
      : 'Child Dispatch Preview is unavailable until goal-supervisor-app-read-model.v1 exposes childDispatchPreview.v1.'
  };
}

function projectChildDispatchSourceContract(sourceContract) {
  return {
    contractName: valueState(sourceContract?.contractName),
    contractVersion: valueState(sourceContract?.contractVersion),
    readOnly: valueState(sourceContract?.readOnly),
    requiredFor: projectSystemGoldenPathTextItems(sourceContract?.requiredFor),
    sourceRef: projectSystemGoldenPathSourceRef(sourceContract?.sourceRef)
  };
}

function projectCodexProviderExecutionPreview({
  contract,
  supervisorRoute
}) {
  const hasContract = contract !== null && contract !== undefined && typeof contract === 'object' && !Array.isArray(contract);
  const blockedReasons = Array.isArray(contract?.blockedReasons) ? contract.blockedReasons : [];
  const ready = hasContract && blockedReasons.length === 0;

  return {
    state: hasContract ? (ready ? 'ready' : 'blocked') : 'missing',
    contractName: valueState(contract?.contractName),
    contractVersion: valueState(contract?.contractVersion),
    generatedAt: valueState(contract?.generatedAt),
    previewHash: valueState(contract?.previewHash),
    taskPackHash: valueState(contract?.taskPackHash),
    goal: {
      goalId: valueState(contract?.goal?.goalId),
      title: valueState(contract?.goal?.title),
      state: valueState(contract?.goal?.state),
      sourceContract: valueState(contract?.goal?.sourceContract),
      sourceRef: projectSystemGoldenPathSourceRef(contract?.goal?.sourceRef)
    },
    task: {
      taskId: valueState(contract?.task?.taskId),
      title: valueState(contract?.task?.title),
      state: valueState(contract?.task?.state),
      sourceContract: valueState(contract?.task?.sourceContract),
      sourceRef: projectSystemGoldenPathSourceRef(contract?.task?.sourceRef)
    },
    providerId: valueState(contract?.providerId),
    role: valueState(contract?.role),
    taskPackRef: projectSystemGoldenPathSourceRef(contract?.taskPackRef),
    inputSummary: projectCodexProviderExecutionInputSummary(contract?.inputSummary),
    executionPolicy: projectCodexProviderExecutionPolicy(contract?.executionPolicy),
    resultReturn: projectCodexProviderExecutionResultReturn(contract?.resultReturn),
    confirmation: {
      state: valueState(hasContract ? (ready ? 'ready' : 'blocked') : 'missing'),
      label: valueState('Confirm Codex Run'),
      previewHash: valueState(contract?.previewHash),
      providerId: valueState(contract?.providerId),
      goalId: valueState(contract?.goal?.goalId),
      taskId: valueState(contract?.task?.taskId),
      role: valueState(contract?.role),
      requiredFields: projectSystemGoldenPathTextItems(['previewHash', 'providerId', 'goalId', 'taskId', 'role', 'operatorId']),
      explicitOperatorConfirmationRequired: valueState(contract?.boundaries?.explicitOperatorConfirmationRequired),
      providerExecutionStartsOnPreview: valueState(contract?.boundaries?.providerExecutionStartsOnPreview),
      providerExecutionStartsWithoutConfirmation: valueState(contract?.boundaries?.providerExecutionStartsWithoutConfirmation),
      willMutate: valueState(false)
    },
    runStatus: {
      state: valueState(hasContract ? (ready ? 'not-started' : 'blocked') : 'missing'),
      label: valueState('Codex Run Status'),
      runnerContract: valueState('codexProviderExecutionRunnerResult.v1'),
      providerId: valueState(contract?.providerId),
      role: valueState(contract?.role),
      returnPath: valueState(contract?.resultReturn?.returnPath),
      resultIntakeContract: valueState(contract?.resultReturn?.resultIntakeContract),
      rawTranscriptAvailable: valueState(contract?.boundaries?.rawTranscriptAvailable),
      rawModelOutputAvailable: valueState(contract?.boundaries?.rawModelOutputAvailable),
      source: valueState('backend-owned run record after explicit confirmation')
    },
    blockedReasons: projectSystemGoldenPathTextItems(blockedReasons),
    sourceContracts: {
      state: Array.isArray(contract?.sourceContracts) && contract.sourceContracts.length > 0 ? 'available' : hasContract ? 'empty' : 'missing',
      count: valueState(Array.isArray(contract?.sourceContracts) ? contract.sourceContracts.length : undefined),
      items: (Array.isArray(contract?.sourceContracts) ? contract.sourceContracts : []).map(projectChildDispatchSourceContract)
    },
    boundaries: Object.fromEntries(
      Object.entries(contract?.boundaries ?? {}).map(([key, value]) => [key, valueState(value)])
    ),
    route: {
      path: valueState(supervisorRoute?.path),
      routeState: valueState(routeStateFromRoute(supervisorRoute)),
      source: valueState('goal-supervisor-app-read-model.v1 codexProviderExecutionPreview projection')
    },
    note: hasContract
      ? 'Codex provider execution preview is backend-owned state. Workbench shows readiness and Result Intake return state only.'
      : 'Codex provider execution preview is unavailable until goal-supervisor-app-read-model.v1 exposes codexProviderExecutionPreview.v1.'
  };
}

function projectCodexProviderExecutionInputSummary(inputSummary) {
  return {
    state: inputSummary !== null && inputSummary !== undefined && typeof inputSummary === 'object' && !Array.isArray(inputSummary) ? 'available' : 'missing',
    taskPackAvailable: valueState(inputSummary?.taskPackAvailable),
    taskPackSourceContract: valueState(inputSummary?.taskPackSourceContract),
    taskPromptSummary: valueState(inputSummary?.taskPromptSummary),
    providerPolicyReason: valueState(inputSummary?.providerPolicyReason),
    acceptanceCriteria: projectSystemGoldenPathTextItems(inputSummary?.acceptanceCriteria),
    evidenceRefs: projectChildDispatchEvidenceRefs(inputSummary?.evidenceRefs)
  };
}

function projectCodexProviderExecutionPolicy(executionPolicy) {
  return {
    state: executionPolicy !== null && executionPolicy !== undefined && typeof executionPolicy === 'object' && !Array.isArray(executionPolicy) ? 'available' : 'missing',
    providerId: valueState(executionPolicy?.providerId),
    role: valueState(executionPolicy?.role),
    allowedProviders: projectSystemGoldenPathTextItems(executionPolicy?.allowedProviders),
    allowedRoles: projectSystemGoldenPathTextItems(executionPolicy?.allowedRoles),
    requiresOperatorConfirmation: valueState(executionPolicy?.requiresOperatorConfirmation),
    requiresPreviewHash: valueState(executionPolicy?.requiresPreviewHash),
    startsOnPreview: valueState(executionPolicy?.startsOnPreview),
    arbitraryCommandAvailable: valueState(executionPolicy?.arbitraryCommandAvailable),
    genericShellAvailable: valueState(executionPolicy?.genericShellAvailable),
    rawTranscriptAvailable: valueState(executionPolicy?.rawTranscriptAvailable),
    rawModelOutputAvailable: valueState(executionPolicy?.rawModelOutputAvailable)
  };
}

function projectCodexProviderExecutionResultReturn(resultReturn) {
  return {
    state: resultReturn !== null && resultReturn !== undefined && typeof resultReturn === 'object' && !Array.isArray(resultReturn) ? 'available' : 'missing',
    returnPath: valueState(resultReturn?.returnPath),
    resultIntakeContract: valueState(resultReturn?.resultIntakeContract),
    resultIntakeRequestRequired: valueState(resultReturn?.resultIntakeRequestRequired),
    sanitizedResultRequired: valueState(resultReturn?.sanitizedResultRequired),
    directGoalEventAppendAvailable: valueState(resultReturn?.directGoalEventAppendAvailable),
    directTaskCompleteAvailable: valueState(resultReturn?.directTaskCompleteAvailable),
    reviewerMutationAvailable: valueState(resultReturn?.reviewerMutationAvailable),
    mainVerificationMutationAvailable: valueState(resultReturn?.mainVerificationMutationAvailable),
    releaseGateMutationAvailable: valueState(resultReturn?.releaseGateMutationAvailable),
    rawTranscriptAvailable: valueState(resultReturn?.rawTranscriptAvailable),
    rawModelOutputAvailable: valueState(resultReturn?.rawModelOutputAvailable)
  };
}

function projectCodexProviderRunRecovery({
  contract,
  supervisorRoute
}) {
  const hasContract = contract !== null && contract !== undefined && typeof contract === 'object' && !Array.isArray(contract);
  const blockedReasons = Array.isArray(contract?.blockedReasons) ? contract.blockedReasons : [];

  return {
    state: hasContract ? contract.recoveryState ?? 'available' : 'missing',
    contractName: valueState(contract?.contractName),
    contractVersion: valueState(contract?.contractVersion),
    generatedAt: valueState(contract?.generatedAt),
    goal: {
      goalId: valueState(contract?.goal?.goalId),
      title: valueState(contract?.goal?.title),
      state: valueState(contract?.goal?.state),
      sourceContract: valueState(contract?.goal?.sourceContract),
      sourceRef: projectSystemGoldenPathSourceRef(contract?.goal?.sourceRef)
    },
    task: {
      taskId: valueState(contract?.task?.taskId),
      title: valueState(contract?.task?.title),
      state: valueState(contract?.task?.state),
      sourceContract: valueState(contract?.task?.sourceContract),
      sourceRef: projectSystemGoldenPathSourceRef(contract?.task?.sourceRef)
    },
    runId: valueState(contract?.runId),
    providerId: valueState(contract?.providerId),
    role: valueState(contract?.role),
    previewHash: valueState(contract?.previewHash),
    taskPackHash: valueState(contract?.taskPackHash),
    runStatus: valueState(contract?.runStatus),
    recoveryState: valueState(contract?.recoveryState),
    resultIntake: projectCodexProviderRunRecoveryResultIntake(contract?.resultIntake),
    nextSafeAction: {
      actionId: valueState(contract?.nextSafeAction?.actionId),
      label: valueState(contract?.nextSafeAction?.label),
      copyOnly: valueState(contract?.nextSafeAction?.copyOnly),
      willMutate: valueState(contract?.nextSafeAction?.willMutate)
    },
    blockedReasons: projectSystemGoldenPathTextItems(blockedReasons),
    sourceContracts: {
      state: Array.isArray(contract?.sourceContracts) && contract.sourceContracts.length > 0 ? 'available' : hasContract ? 'empty' : 'missing',
      count: valueState(Array.isArray(contract?.sourceContracts) ? contract.sourceContracts.length : undefined),
      items: (Array.isArray(contract?.sourceContracts) ? contract.sourceContracts : []).map(projectChildDispatchSourceContract)
    },
    boundaries: Object.fromEntries(
      Object.entries(contract?.boundaries ?? {}).map(([key, value]) => [key, valueState(value)])
    ),
    route: {
      path: valueState(supervisorRoute?.path),
      routeState: valueState(routeStateFromRoute(supervisorRoute)),
      source: valueState('goal-supervisor-app-read-model.v1 codexProviderRunRecovery projection')
    },
    note: hasContract
      ? 'Codex run recovery is projected from backend-owned run records and pending result state. Workbench displays operator-safe recovery state only.'
      : 'Codex run recovery is unavailable until goal-supervisor-app-read-model.v1 exposes codexProviderRunRecovery.v1.'
  };
}

function projectCodexProviderRunRecoveryResultIntake(resultIntake) {
  const pendingResult = resultIntake?.pendingResult;

  return {
    state: resultIntake !== null && resultIntake !== undefined && typeof resultIntake === 'object' && !Array.isArray(resultIntake) ? 'available' : 'missing',
    contractName: valueState(resultIntake?.contractName),
    requestId: valueState(resultIntake?.requestId),
    requestState: valueState(resultIntake?.requestState),
    previewHash: valueState(resultIntake?.previewHash),
    planHash: valueState(resultIntake?.planHash),
    pendingResultState: valueState(pendingResult?.state),
    pendingResultEscrowRef: valueState(pendingResult?.escrowRef),
    blockedReasons: projectSystemGoldenPathTextItems(resultIntake?.blockedReasons),
    sourceRef: projectSystemGoldenPathSourceRef(resultIntake?.sourceRef)
  };
}

function projectReviewerHandoffPreview({
  contract,
  supervisorRoute
}) {
  const hasContract = contract !== null && contract !== undefined && typeof contract === 'object' && !Array.isArray(contract);
  const blockedReasons = Array.isArray(contract?.blockedReasons) ? contract.blockedReasons : [];
  const ready = hasContract && blockedReasons.length === 0;

  return {
    state: hasContract ? (ready ? 'ready' : 'blocked') : 'missing',
    contractName: valueState(contract?.contractName),
    contractVersion: valueState(contract?.contractVersion),
    generatedAt: valueState(contract?.generatedAt),
    goal: {
      goalId: valueState(contract?.goal?.goalId),
      title: valueState(contract?.goal?.title),
      state: valueState(contract?.goal?.state),
      sourceContract: valueState(contract?.goal?.sourceContract),
      sourceRef: projectSystemGoldenPathSourceRef(contract?.goal?.sourceRef)
    },
    workerTask: {
      taskId: valueState(contract?.workerTask?.taskId),
      title: valueState(contract?.workerTask?.title),
      state: valueState(contract?.workerTask?.state),
      sourceContract: valueState(contract?.workerTask?.sourceContract),
      sourceRef: projectSystemGoldenPathSourceRef(contract?.workerTask?.sourceRef)
    },
    reviewerTask: {
      taskId: valueState(contract?.reviewerTask?.taskId),
      title: valueState(contract?.reviewerTask?.title),
      state: valueState(contract?.reviewerTask?.state),
      sourceContract: valueState(contract?.reviewerTask?.sourceContract),
      sourceRef: projectSystemGoldenPathSourceRef(contract?.reviewerTask?.sourceRef)
    },
    pendingResultRef: {
      contractName: valueState(contract?.pendingResultRef?.contractName),
      state: valueState(contract?.pendingResultRef?.state),
      escrowRef: valueState(contract?.pendingResultRef?.escrowRef),
      blockedReasons: projectSystemGoldenPathTextItems(contract?.pendingResultRef?.blockedReasons),
      sourceRef: projectSystemGoldenPathSourceRef(contract?.pendingResultRef?.sourceRef)
    },
    acceptedResultSummary: projectReviewerHandoffResultSummary(contract?.acceptedResultSummary),
    handoffPack: projectReviewerHandoffPack(contract?.handoffPack),
    copyOnly: valueState(contract?.copyOnly),
    willMutate: valueState(contract?.willMutate),
    blockedReasons: projectSystemGoldenPathTextItems(blockedReasons),
    sourceContracts: {
      state: Array.isArray(contract?.sourceContracts) && contract.sourceContracts.length > 0 ? 'available' : hasContract ? 'empty' : 'missing',
      count: valueState(Array.isArray(contract?.sourceContracts) ? contract.sourceContracts.length : undefined),
      items: (Array.isArray(contract?.sourceContracts) ? contract.sourceContracts : []).map(projectChildDispatchSourceContract)
    },
    boundaries: Object.fromEntries(
      Object.entries(contract?.boundaries ?? {}).map(([key, value]) => [key, valueState(value)])
    ),
    route: {
      path: valueState(supervisorRoute?.path),
      routeState: valueState(routeStateFromRoute(supervisorRoute)),
      source: valueState('goal-supervisor-app-read-model.v1 reviewerHandoffPreview projection')
    },
    note: hasContract
      ? 'Reviewer handoff preview is copy-only. Workbench displays accepted pending result context without creating a reviewer verdict.'
      : 'Reviewer handoff preview is unavailable until goal-supervisor-app-read-model.v1 exposes reviewerHandoffPreview.v1.'
  };
}

function projectReviewerHandoffResultSummary(summary) {
  const hasSummary = summary !== null && summary !== undefined && typeof summary === 'object' && !Array.isArray(summary);

  return {
    state: hasSummary ? 'available' : 'missing',
    status: valueState(summary?.status),
    summary: valueState(summary?.summary),
    changedFiles: projectSystemGoldenPathTextItems(summary?.changedFiles),
    validationCommands: projectSystemGoldenPathTextItems(summary?.validationCommands),
    risks: projectSystemGoldenPathTextItems(summary?.risks),
    blockers: projectSystemGoldenPathTextItems(summary?.blockers),
    evidenceRefs: projectChildDispatchEvidenceRefs(summary?.evidenceRefs),
    blockerReason: valueState(summary?.blockerReason)
  };
}

function projectReviewerHandoffPack(handoffPack) {
  const hasPack = handoffPack !== null && handoffPack !== undefined && typeof handoffPack === 'object' && !Array.isArray(handoffPack);

  return {
    state: hasPack ? 'available' : 'missing',
    title: valueState(handoffPack?.title),
    handoffBody: valueState(handoffPack?.body),
    workerEvidenceRefs: projectChildDispatchEvidenceRefs(handoffPack?.workerEvidenceRefs),
    changedFiles: projectSystemGoldenPathTextItems(handoffPack?.changedFiles),
    validationCommands: projectSystemGoldenPathTextItems(handoffPack?.validationCommands),
    risks: projectSystemGoldenPathTextItems(handoffPack?.risks),
    blockers: projectSystemGoldenPathTextItems(handoffPack?.blockers),
    json: valueState(hasPack ? stableJsonText(handoffPack) : undefined)
  };
}

function projectThreadHandoffPack({
  contract,
  supervisorRoute
}) {
  const hasContract = contract !== null && contract !== undefined && typeof contract === 'object' && !Array.isArray(contract);
  const blockedReasons = Array.isArray(contract?.blockedReasons) ? contract.blockedReasons : [];

  return {
    state: hasContract ? (blockedReasons.length === 0 ? 'ready' : 'blocked') : 'missing',
    contractName: valueState(contract?.contractName),
    contractVersion: valueState(contract?.contractVersion),
    generatedAt: valueState(contract?.generatedAt),
    goal: {
      goalId: valueState(contract?.goal?.goalId),
      title: valueState(contract?.goal?.title),
      state: valueState(contract?.goal?.state),
      sourceContract: valueState(contract?.goal?.sourceContract),
      sourceRef: projectSystemGoldenPathSourceRef(contract?.goal?.sourceRef)
    },
    task: {
      taskId: valueState(contract?.task?.taskId),
      title: valueState(contract?.task?.title),
      state: valueState(contract?.task?.state),
      sourceContract: valueState(contract?.task?.sourceContract),
      sourceRef: projectSystemGoldenPathSourceRef(contract?.task?.sourceRef)
    },
    decision: valueState(contract?.decision),
    summary: valueState(contract?.summary),
    sourceRecovery: projectThreadHandoffSourceRecovery(contract?.sourceRecovery),
    sourceReviewerHandoff: projectThreadHandoffSourceReviewerHandoff(contract?.sourceReviewerHandoff),
    knownFacts: projectSystemGoldenPathTextItems(contract?.knownFacts),
    openRisks: projectSystemGoldenPathTextItems(contract?.openRisks),
    blockedReasons: projectSystemGoldenPathTextItems(blockedReasons),
    nextSafeAction: projectThreadHandoffNextSafeAction(contract?.nextSafeAction),
    requiredEvidenceRefs: projectChildDispatchEvidenceRefs(contract?.requiredEvidenceRefs),
    sourceContracts: {
      state: Array.isArray(contract?.sourceContracts) && contract.sourceContracts.length > 0 ? 'available' : hasContract ? 'empty' : 'missing',
      count: valueState(Array.isArray(contract?.sourceContracts) ? contract.sourceContracts.length : undefined),
      items: (Array.isArray(contract?.sourceContracts) ? contract.sourceContracts : []).map(projectThreadHandoffSourceContract)
    },
    copyBlocks: {
      state: Array.isArray(contract?.copyBlocks) && contract.copyBlocks.length > 0 ? 'available' : hasContract ? 'empty' : 'missing',
      count: valueState(Array.isArray(contract?.copyBlocks) ? contract.copyBlocks.length : undefined),
      items: (Array.isArray(contract?.copyBlocks) ? contract.copyBlocks : []).map(projectThreadHandoffCopyBlock)
    },
    checkpointRef: projectThreadHandoffCheckpointRef(contract?.checkpointRef),
    boundaries: Object.fromEntries(
      Object.entries(contract?.boundaries ?? {}).map(([key, value]) => [key, valueState(value)])
    ),
    copyOnly: valueState(contract?.copyOnly),
    willMutate: valueState(contract?.willMutate),
    route: {
      path: valueState(supervisorRoute?.path),
      routeState: valueState(routeStateFromRoute(supervisorRoute)),
      source: valueState('goal-supervisor-app-read-model.v1 threadHandoffPack projection')
    },
    note: hasContract
      ? 'Thread handoff pack is backend-owned, copy-only state. Workbench displays continuation and reviewer handoff text without creating threads, launching providers, or mutating goals.'
      : 'Thread handoff pack is unavailable until goal-supervisor-app-read-model.v1 exposes threadHandoffPack.v1.'
  };
}

function projectReviewGatePreview({
  contract,
  supervisorRoute
}) {
  const hasContract = contract !== null && contract !== undefined && typeof contract === 'object' && !Array.isArray(contract);
  const blockedReasons = Array.isArray(contract?.blockedReasons) ? contract.blockedReasons : [];
  const confirmationPreviews = Array.isArray(contract?.confirmationPreviews) ? contract.confirmationPreviews : [];

  return {
    state: hasContract ? (blockedReasons.length === 0 ? 'ready' : 'blocked') : 'missing',
    contractName: valueState(contract?.contractName),
    contractVersion: valueState(contract?.contractVersion),
    generatedAt: valueState(contract?.generatedAt),
    goal: {
      goalId: valueState(contract?.goal?.goalId),
      title: valueState(contract?.goal?.title),
      state: valueState(contract?.goal?.state),
      sourceContract: valueState(contract?.goal?.sourceContract),
      sourceRef: projectSystemGoldenPathSourceRef(contract?.goal?.sourceRef)
    },
    task: {
      taskId: valueState(contract?.task?.taskId),
      title: valueState(contract?.task?.title),
      state: valueState(contract?.task?.state),
      sourceContract: valueState(contract?.task?.sourceContract),
      sourceRef: projectSystemGoldenPathSourceRef(contract?.task?.sourceRef)
    },
    sourceThreadHandoffPack: projectReviewGateThreadHandoffSource(contract?.sourceThreadHandoffPack),
    reviewReadiness: projectReviewGateReadiness(contract?.reviewReadiness),
    mainGateReadiness: projectReviewGateReadiness(contract?.mainGateReadiness),
    releaseGateReadiness: projectReviewGateReadiness(contract?.releaseGateReadiness),
    blockedReasons: projectSystemGoldenPathTextItems(blockedReasons),
    requiredEvidenceRefs: projectChildDispatchEvidenceRefs(contract?.requiredEvidenceRefs),
    sourceContracts: {
      state: Array.isArray(contract?.sourceContracts) && contract.sourceContracts.length > 0 ? 'available' : hasContract ? 'empty' : 'missing',
      count: valueState(Array.isArray(contract?.sourceContracts) ? contract.sourceContracts.length : undefined),
      items: (Array.isArray(contract?.sourceContracts) ? contract.sourceContracts : []).map(projectThreadHandoffSourceContract)
    },
    sourceEvidence: projectReviewGateSourceEvidence(contract?.sourceEvidence),
    confirmationPreviews: {
      state: confirmationPreviews.length > 0 ? 'available' : hasContract ? 'empty' : 'missing',
      count: valueState(confirmationPreviews.length),
      items: confirmationPreviews.map(projectReviewGateConfirmationPreview)
    },
    nextSafeAction: projectThreadHandoffNextSafeAction(contract?.nextSafeAction),
    boundaryNotice: {
      contractName: valueState(contract?.boundaryNotice?.contractName),
      disabledCapabilities: projectSystemGoldenPathTextItems(contract?.boundaryNotice?.disabledCapabilities),
      readOnly: valueState(contract?.boundaryNotice?.readOnly),
      willMutate: valueState(contract?.boundaryNotice?.willMutate)
    },
    boundaries: Object.fromEntries(
      Object.entries(contract?.boundaries ?? {}).map(([key, value]) => [key, valueState(value)])
    ),
    readOnly: valueState(contract?.readOnly),
    willMutate: valueState(contract?.willMutate),
    route: {
      path: valueState(supervisorRoute?.path),
      routeState: valueState(routeStateFromRoute(supervisorRoute)),
      source: valueState('goal-supervisor-app-read-model.v1 reviewGatePreview projection')
    },
    note: hasContract
      ? 'Review gate preview is backend-owned read-only state from threadHandoffPack.v1 and bounded evidence refs. Workbench displays readiness and controlled confirmation metadata without approving review, mutating gates, or appending events.'
      : 'Review gate preview is unavailable until goal-supervisor-app-read-model.v1 exposes reviewGatePreview.v1.'
  };
}

function projectReviewGateThreadHandoffSource(source) {
  const hasSource = source !== null && source !== undefined && typeof source === 'object' && !Array.isArray(source);

  return {
    state: hasSource ? 'available' : 'missing',
    contractName: valueState(source?.contractName),
    contractVersion: valueState(source?.contractVersion),
    sourceState: valueState(source?.state),
    decision: valueState(source?.decision),
    goalId: valueState(source?.goalId),
    taskId: valueState(source?.taskId),
    copyOnly: valueState(source?.copyOnly),
    willMutate: valueState(source?.willMutate),
    blockedReasons: projectSystemGoldenPathTextItems(source?.blockedReasons),
    sourceRef: projectSystemGoldenPathSourceRef(source?.sourceRef)
  };
}

function projectReviewGateReadiness(readiness) {
  const hasReadiness = readiness !== null && readiness !== undefined && typeof readiness === 'object' && !Array.isArray(readiness);

  return {
    state: hasReadiness ? 'available' : 'missing',
    readinessState: valueState(readiness?.state),
    eventFamily: valueState(readiness?.eventFamily),
    eventType: valueState(readiness?.eventType),
    gateName: valueState(readiness?.gateName),
    planHash: valueState(readiness?.planHash),
    planHashState: valueState(readiness?.planHashState),
    previewHash: valueState(readiness?.previewHash),
    evidenceRefs: projectChildDispatchEvidenceRefs(readiness?.evidenceRefs),
    blockedReasons: projectSystemGoldenPathTextItems(readiness?.blockedReasons),
    sourceRef: projectSystemGoldenPathSourceRef(readiness?.sourceRef)
  };
}

function projectReviewGateSourceEvidence(sourceEvidence) {
  const hasSourceEvidence = sourceEvidence !== null && sourceEvidence !== undefined && typeof sourceEvidence === 'object' && !Array.isArray(sourceEvidence);

  return {
    state: hasSourceEvidence ? 'available' : 'missing',
    contractName: valueState(sourceEvidence?.contractName),
    generatedAt: valueState(sourceEvidence?.generatedAt),
    threadHandoffPackRef: projectSystemGoldenPathSourceRef(sourceEvidence?.threadHandoffPackRef),
    reviewerEvidenceRefs: projectChildDispatchEvidenceRefs(sourceEvidence?.reviewerEvidenceRefs),
    mainGateEvidenceRefs: projectChildDispatchEvidenceRefs(sourceEvidence?.mainGateEvidenceRefs),
    releaseGateEvidenceRefs: projectChildDispatchEvidenceRefs(sourceEvidence?.releaseGateEvidenceRefs),
    blockedReasons: projectSystemGoldenPathTextItems(sourceEvidence?.blockedReasons),
    readOnly: valueState(sourceEvidence?.readOnly),
    willMutate: valueState(sourceEvidence?.willMutate)
  };
}

function projectReviewGateConfirmationPreview(preview) {
  return {
    contractName: valueState(preview?.contractName),
    state: valueState(preview?.state),
    eventFamily: valueState(preview?.eventFamily),
    eventType: valueState(preview?.eventType),
    goalId: valueState(preview?.goalId),
    taskId: valueState(preview?.taskId),
    gateName: valueState(preview?.gateName),
    planHash: valueState(preview?.planHash),
    planHashState: valueState(preview?.planHashState),
    previewHash: valueState(preview?.previewHash),
    requiredEvidenceRefs: projectChildDispatchEvidenceRefs(preview?.requiredEvidenceRefs),
    confirmationMode: valueState(preview?.confirmationMode),
    requiresOperatorConfirmation: valueState(preview?.requiresOperatorConfirmation),
    providerSelfApprovalAvailable: valueState(preview?.providerSelfApprovalAvailable),
    automaticMutationAvailable: valueState(preview?.automaticMutationAvailable),
    directGoalEventAppendAvailable: valueState(preview?.directGoalEventAppendAvailable),
    controlledEventRegistrationAvailable: valueState(preview?.controlledEventRegistrationAvailable),
    readOnly: valueState(preview?.readOnly),
    willMutate: valueState(preview?.willMutate),
    blockedReasons: projectSystemGoldenPathTextItems(preview?.blockedReasons),
    boundaries: Object.fromEntries(
      Object.entries(preview?.boundaries ?? {}).map(([key, value]) => [key, valueState(value)])
    )
  };
}

function projectReviewGateConfirmationState({
  contract,
  supervisorRoute
}) {
  const hasContract = contract !== null && contract !== undefined && typeof contract === 'object' && !Array.isArray(contract);
  const blockedReasons = Array.isArray(contract?.blockedReasons) ? contract.blockedReasons : [];

  return {
    state: hasContract ? contract.state ?? (blockedReasons.length === 0 ? 'ready' : 'blocked') : 'missing',
    contractName: valueState(contract?.contractName),
    contractVersion: valueState(contract?.contractVersion),
    generatedAt: valueState(contract?.generatedAt),
    goalId: valueState(contract?.goalId),
    taskId: valueState(contract?.taskId),
    eventFamily: valueState(contract?.eventFamily),
    eventType: valueState(contract?.eventType),
    gateName: valueState(contract?.gateName),
    planHash: valueState(contract?.planHash),
    planHashState: valueState(contract?.planHashState),
    previewHash: valueState(contract?.previewHash),
    requiredEvidenceRefs: projectChildDispatchEvidenceRefs(contract?.requiredEvidenceRefs),
    operator: {
      required: valueState(contract?.operator?.required),
      operatorId: valueState(contract?.operator?.operatorId),
      state: valueState(contract?.operator?.state),
      providerOriginated: valueState(contract?.operator?.providerOriginated)
    },
    previewRequest: projectReviewGateControlledRequest(contract?.previewRequest),
    confirmRequestShape: projectReviewGateControlledRequest(contract?.confirmRequestShape),
    sourceConfirmationPreview: projectReviewGateConfirmationPreview(contract?.sourceConfirmationPreview),
    blockedReasons: projectSystemGoldenPathTextItems(blockedReasons),
    boundaries: Object.fromEntries(
      Object.entries(contract?.boundaries ?? {}).map(([key, value]) => [key, valueState(value)])
    ),
    readOnly: valueState(contract?.readOnly),
    willMutate: valueState(contract?.willMutate),
    route: {
      path: valueState(supervisorRoute?.path),
      routeState: valueState(routeStateFromRoute(supervisorRoute)),
      source: valueState('goal-supervisor-app-read-model.v1 reviewGateConfirmationState projection')
    },
    note: hasContract
      ? 'Controlled confirmation state is read-only. A ready state only describes the existing controlled event registration request shape and required plan hash; it does not submit confirmation.'
      : 'Controlled confirmation state is unavailable until goal-supervisor-app-read-model.v1 exposes reviewGateControlledConfirmationState.v1.'
  };
}

function projectReleaseCloseoutHandoffPack({
  contract,
  supervisorRoute
}) {
  const hasContract = contract !== null && contract !== undefined && typeof contract === 'object' && !Array.isArray(contract);
  const blockedReasons = Array.isArray(contract?.blockedReasons) ? contract.blockedReasons : [];

  return {
    state: hasContract ? contract.state ?? (blockedReasons.length === 0 ? 'ready' : 'blocked') : 'missing',
    contractName: valueState(contract?.contractName),
    contractVersion: valueState(contract?.contractVersion),
    generatedAt: valueState(contract?.generatedAt),
    goal: {
      goalId: valueState(contract?.goal?.goalId),
      title: valueState(contract?.goal?.title),
      state: valueState(contract?.goal?.state),
      sourceContract: valueState(contract?.goal?.sourceContract),
      sourceRef: projectSystemGoldenPathSourceRef(contract?.goal?.sourceRef)
    },
    reviewGateSource: projectReleaseCloseoutReviewGateSource(contract?.reviewGateSource),
    closeoutSource: projectReleaseCloseoutCloseoutSource(contract?.closeoutSource),
    releaseBaseline: projectReleaseCloseoutBaseline(contract?.releaseBaseline),
    targetCommit: projectReleaseCloseoutTargetCommit(contract?.targetCommit),
    evidenceRefs: projectChildDispatchEvidenceRefs(contract?.evidenceRefs),
    knownFacts: projectSystemGoldenPathTextItems(contract?.knownFacts),
    blockedReasons: projectSystemGoldenPathTextItems(blockedReasons),
    operatorChecklist: projectReleaseCloseoutChecklist(contract?.operatorChecklist),
    tagReleaseChecklist: projectReleaseCloseoutChecklist(contract?.tagReleaseChecklist),
    releaseEvidenceCarryoverRefs: {
      contractName: valueState(contract?.releaseEvidenceCarryoverRefs?.contractName),
      evidenceRefs: projectChildDispatchEvidenceRefs(contract?.releaseEvidenceCarryoverRefs?.evidenceRefs),
      sourceContracts: {
        state: Array.isArray(contract?.releaseEvidenceCarryoverRefs?.sourceContracts) && contract.releaseEvidenceCarryoverRefs.sourceContracts.length > 0 ? 'available' : hasContract ? 'empty' : 'missing',
        count: valueState(Array.isArray(contract?.releaseEvidenceCarryoverRefs?.sourceContracts) ? contract.releaseEvidenceCarryoverRefs.sourceContracts.length : undefined),
        items: (Array.isArray(contract?.releaseEvidenceCarryoverRefs?.sourceContracts) ? contract.releaseEvidenceCarryoverRefs.sourceContracts : []).map(projectThreadHandoffSourceContract)
      },
      readOnly: valueState(contract?.releaseEvidenceCarryoverRefs?.readOnly),
      willMutate: valueState(contract?.releaseEvidenceCarryoverRefs?.willMutate)
    },
    githubReleaseDraftNotice: {
      contractName: valueState(contract?.githubReleaseDraftNotice?.contractName),
      state: valueState(contract?.githubReleaseDraftNotice?.state),
      releaseUrl: valueState(contract?.githubReleaseDraftNotice?.releaseUrl),
      releaseUrlState: valueState(contract?.githubReleaseDraftNotice?.releaseUrlState),
      notesSourceRefs: projectChildDispatchEvidenceRefs(contract?.githubReleaseDraftNotice?.notesSourceRefs),
      assetsExpected: projectSystemGoldenPathTextItems(contract?.githubReleaseDraftNotice?.assetsExpected),
      readOnly: valueState(contract?.githubReleaseDraftNotice?.readOnly),
      willMutate: valueState(contract?.githubReleaseDraftNotice?.willMutate)
    },
    nextVersionContext: {
      contractName: valueState(contract?.nextVersionContext?.contractName),
      state: valueState(contract?.nextVersionContext?.state),
      nextVersion: valueState(contract?.nextVersionContext?.nextVersion),
      runbookRef: projectSystemGoldenPathSourceRef(contract?.nextVersionContext?.runbookRef),
      startAfterRelease: valueState(contract?.nextVersionContext?.startAfterRelease),
      createsGoal: valueState(contract?.nextVersionContext?.createsGoal),
      entersNextVersion: valueState(contract?.nextVersionContext?.entersNextVersion),
      readOnly: valueState(contract?.nextVersionContext?.readOnly),
      willMutate: valueState(contract?.nextVersionContext?.willMutate)
    },
    sourceContracts: {
      state: Array.isArray(contract?.sourceContracts) && contract.sourceContracts.length > 0 ? 'available' : hasContract ? 'empty' : 'missing',
      count: valueState(Array.isArray(contract?.sourceContracts) ? contract.sourceContracts.length : undefined),
      items: (Array.isArray(contract?.sourceContracts) ? contract.sourceContracts : []).map(projectThreadHandoffSourceContract)
    },
    boundaries: Object.fromEntries(
      Object.entries(contract?.boundaries ?? {}).map(([key, value]) => [key, valueState(value)])
    ),
    readOnly: valueState(contract?.readOnly),
    willMutate: valueState(contract?.willMutate),
    route: {
      path: valueState(supervisorRoute?.path),
      routeState: valueState(routeStateFromRoute(supervisorRoute)),
      source: valueState('goal-supervisor-app-read-model.v1 releaseCloseoutHandoffPack projection')
    },
    note: hasContract
      ? 'Release closeout handoff is backend-owned read-only state. Workbench displays evidence refs, target metadata, blockers, rollback refs, and next-version context without running tag or publication commands.'
      : 'Release closeout handoff is unavailable until goal-supervisor-app-read-model.v1 exposes releaseCloseoutHandoffPack.v1.'
  };
}

function projectReleasePublicationEvidence({
  contract,
  supervisorRoute
}) {
  const hasContract = contract !== null && contract !== undefined && typeof contract === 'object' && !Array.isArray(contract);
  const blockedReasons = Array.isArray(contract?.blockedReasons) ? contract.blockedReasons : [];

  return {
    state: hasContract ? contract.state ?? (blockedReasons.length === 0 ? 'ready' : 'blocked') : 'missing',
    contractName: valueState(contract?.contractName),
    contractVersion: valueState(contract?.contractVersion),
    generatedAt: valueState(contract?.generatedAt),
    goal: {
      goalId: valueState(contract?.goal?.goalId),
      title: valueState(contract?.goal?.title),
      state: valueState(contract?.goal?.state),
      sourceContract: valueState(contract?.goal?.sourceContract),
      sourceRef: projectSystemGoldenPathSourceRef(contract?.goal?.sourceRef)
    },
    sourceCloseoutHandoff: projectReleasePublicationSourceCloseout(contract?.sourceCloseoutHandoff),
    tagEvidence: projectReleasePublicationTagEvidence(contract?.tagEvidence),
    githubReleaseEvidence: projectReleasePublicationGithubReleaseEvidence(contract?.githubReleaseEvidence),
    targetCommit: projectReleasePublicationTargetCommit(contract?.targetCommit),
    knownFacts: projectSystemGoldenPathTextItems(contract?.knownFacts),
    blockedReasons: projectSystemGoldenPathTextItems(blockedReasons),
    nextVersionStartAudit: projectReleasePublicationNextStartAudit(contract?.nextVersionStartAudit),
    publicationEvidenceBoundaryNotice: {
      contractName: valueState(contract?.publicationEvidenceBoundaryNotice?.contractName),
      message: valueState(contract?.publicationEvidenceBoundaryNotice?.message),
      readOnly: valueState(contract?.publicationEvidenceBoundaryNotice?.readOnly),
      willMutate: valueState(contract?.publicationEvidenceBoundaryNotice?.willMutate)
    },
    boundaries: Object.fromEntries(
      Object.entries(contract?.boundaries ?? {}).map(([key, value]) => [key, valueState(value)])
    ),
    readOnly: valueState(contract?.readOnly),
    willMutate: valueState(contract?.willMutate),
    route: {
      path: valueState(supervisorRoute?.path),
      routeState: valueState(routeStateFromRoute(supervisorRoute)),
      source: valueState('goal-supervisor-app-read-model.v1 releasePublicationEvidence projection')
    },
    note: hasContract
      ? 'Release publication evidence is backend-owned read-only state. Workbench displays tag evidence, GitHub Release evidence, target checks, blockers, rollback refs, and next-start audit without write or runtime controls.'
      : 'Release publication evidence is unavailable until goal-supervisor-app-read-model.v1 exposes releasePublicationEvidence.v1.'
  };
}

function projectReleasePublicationSourceCloseout(source) {
  const hasSource = source !== null && source !== undefined && typeof source === 'object' && !Array.isArray(source);

  return {
    state: hasSource ? source.state ?? 'available' : 'missing',
    contractName: valueState(source?.contractName),
    goalId: valueState(source?.goalId),
    releaseTag: valueState(source?.releaseTag),
    targetCommit: valueState(source?.targetCommit),
    sourceRef: projectSystemGoldenPathSourceRef(source?.sourceRef),
    evidenceRefs: projectChildDispatchEvidenceRefs(source?.evidenceRefs),
    blockedReasons: projectSystemGoldenPathTextItems(source?.blockedReasons)
  };
}

function projectReleasePublicationTagEvidence(tagEvidence) {
  const hasEvidence = tagEvidence !== null && tagEvidence !== undefined && typeof tagEvidence === 'object' && !Array.isArray(tagEvidence);

  return {
    state: hasEvidence ? tagEvidence.state ?? 'available' : 'missing',
    contractName: valueState(tagEvidence?.contractName),
    tagName: valueState(tagEvidence?.tagName),
    tagObjectSha: valueState(tagEvidence?.tagObjectSha),
    dereferencedCommit: valueState(tagEvidence?.dereferencedCommit),
    targetCommit: valueState(tagEvidence?.targetCommit),
    annotated: valueState(tagEvidence?.annotated),
    sourceRefs: projectChildDispatchEvidenceRefs(tagEvidence?.sourceRefs),
    rollbackRefs: projectChildDispatchEvidenceRefs(tagEvidence?.rollbackRefs),
    blockedReasons: projectSystemGoldenPathTextItems(tagEvidence?.blockedReasons),
    readOnly: valueState(tagEvidence?.readOnly),
    willMutate: valueState(tagEvidence?.willMutate)
  };
}

function projectReleasePublicationGithubReleaseEvidence(releaseEvidence) {
  const hasEvidence = releaseEvidence !== null && releaseEvidence !== undefined && typeof releaseEvidence === 'object' && !Array.isArray(releaseEvidence);

  return {
    state: hasEvidence ? releaseEvidence.state ?? 'available' : 'missing',
    contractName: valueState(releaseEvidence?.contractName),
    tagName: valueState(releaseEvidence?.tagName),
    name: valueState(releaseEvidence?.name),
    url: valueState(releaseEvidence?.url),
    isDraft: valueState(releaseEvidence?.isDraft),
    isPrerelease: valueState(releaseEvidence?.isPrerelease),
    publishedAt: valueState(releaseEvidence?.publishedAt),
    assets: projectReleasePublicationAssets(releaseEvidence?.assets),
    targetCommitish: valueState(releaseEvidence?.targetCommitish),
    targetCommitMatches: valueState(releaseEvidence?.targetCommitMatches),
    sourceRefs: projectChildDispatchEvidenceRefs(releaseEvidence?.sourceRefs),
    blockedReasons: projectSystemGoldenPathTextItems(releaseEvidence?.blockedReasons),
    readOnly: valueState(releaseEvidence?.readOnly),
    willMutate: valueState(releaseEvidence?.willMutate)
  };
}

function projectReleasePublicationAssets(assets) {
  const items = (Array.isArray(assets) ? assets : []).map((asset) => ({
    name: valueState(asset?.name),
    label: valueState(asset?.label),
    url: valueState(asset?.url),
    size: valueState(asset?.size)
  }));

  return {
    state: Array.isArray(assets) && assets.length > 0 ? 'available' : Array.isArray(assets) ? 'empty' : 'missing',
    count: valueState(Array.isArray(assets) ? assets.length : undefined),
    items
  };
}

function projectReleasePublicationTargetCommit(targetCommit) {
  const hasTarget = targetCommit !== null && targetCommit !== undefined && typeof targetCommit === 'object' && !Array.isArray(targetCommit);

  return {
    state: hasTarget ? targetCommit.state ?? 'available' : 'missing',
    expectedCommit: valueState(targetCommit?.expectedCommit),
    tagDereferencedCommit: valueState(targetCommit?.tagDereferencedCommit),
    releaseTargetCommitish: valueState(targetCommit?.releaseTargetCommitish),
    matchesTag: valueState(targetCommit?.matchesTag),
    matchesReleaseTarget: valueState(targetCommit?.matchesReleaseTarget),
    blockedReasons: projectSystemGoldenPathTextItems(targetCommit?.blockedReasons)
  };
}

function projectReleasePublicationNextStartAudit(audit) {
  const hasAudit = audit !== null && audit !== undefined && typeof audit === 'object' && !Array.isArray(audit);

  return {
    state: hasAudit ? audit.state ?? 'available' : 'missing',
    contractName: valueState(audit?.contractName),
    currentVersion: valueState(audit?.currentVersion),
    nextVersion: valueState(audit?.nextVersion),
    nextRunbookRef: projectSystemGoldenPathSourceRef(audit?.nextRunbookRef),
    releaseEvidenceCommit: valueState(audit?.releaseEvidenceCommit),
    mainHead: valueState(audit?.mainHead),
    originMainHead: valueState(audit?.originMainHead),
    openPrCount: valueState(audit?.openPrCount),
    nextVersionGoalCreated: valueState(audit?.nextVersionGoalCreated),
    startAllowed: valueState(audit?.startAllowed),
    sourceRefs: projectChildDispatchEvidenceRefs(audit?.sourceRefs),
    blockedReasons: projectSystemGoldenPathTextItems(audit?.blockedReasons),
    readOnly: valueState(audit?.readOnly),
    willMutate: valueState(audit?.willMutate)
  };
}

function projectStableWorkbenchRelease({
  contract,
  supervisorRoute
}) {
  const hasContract = contract !== null && contract !== undefined && typeof contract === 'object' && !Array.isArray(contract);
  const surfaces = Array.isArray(contract?.surfaces) ? contract.surfaces : [];
  const blockedReasons = Array.isArray(contract?.blockedReasons) ? contract.blockedReasons : [];

  return {
    state: hasContract ? contract.state ?? (blockedReasons.length === 0 ? 'ready' : 'blocked') : 'missing',
    contractName: valueState(contract?.contractName),
    contractVersion: valueState(contract?.contractVersion),
    generatedAt: valueState(contract?.generatedAt),
    goal: {
      goalId: valueState(contract?.goal?.goalId),
      title: valueState(contract?.goal?.title),
      state: valueState(contract?.goal?.state),
      sourceRef: projectSystemGoldenPathSourceRef(contract?.goal?.sourceRef)
    },
    release: projectStableWorkbenchReleaseBoundary(contract?.release),
    surfaces: {
      state: surfaces.length > 0 ? 'available' : hasContract ? 'empty' : 'missing',
      count: valueState(surfaces.length),
      items: surfaces.map(projectStableWorkbenchSurface)
    },
    providerBoundary: projectStableWorkbenchProviderBoundary(contract?.providerBoundary),
    releaseBoundary: projectStableWorkbenchReleaseOperations(contract?.releaseBoundary),
    safety: projectStableWorkbenchSafety(contract?.safety),
    evidenceRefs: projectChildDispatchEvidenceRefs(contract?.evidenceRefs),
    knownFacts: projectSystemGoldenPathTextItems(contract?.knownFacts),
    blockedReasons: projectSystemGoldenPathTextItems(blockedReasons),
    boundaries: Object.fromEntries(
      Object.entries(contract?.boundaries ?? {}).map(([key, value]) => [key, valueState(value)])
    ),
    readOnly: valueState(contract?.readOnly),
    willMutate: valueState(contract?.willMutate),
    route: {
      path: valueState(supervisorRoute?.path),
      routeState: valueState(routeStateFromRoute(supervisorRoute)),
      source: valueState('goal-supervisor-app-read-model.v1 stableWorkbenchRelease projection')
    },
    note: hasContract
      ? 'Stable Workbench release baseline is backend-owned read-only state. Workbench displays surface readiness, provider limits, release boundaries, safety checks, and evidence refs without command execution or release automation.'
      : 'Stable Workbench release baseline is unavailable until goal-supervisor-app-read-model.v1 exposes stableWorkbenchRelease.v1.'
  };
}

function projectStableWorkbenchReleaseBoundary(release) {
  const hasRelease = release !== null && release !== undefined && typeof release === 'object' && !Array.isArray(release);

  return {
    state: hasRelease ? 'available' : 'missing',
    currentTaggedRelease: valueState(release?.currentTaggedRelease),
    activeVersion: valueState(release?.activeVersion),
    currentTagCommit: valueState(release?.currentTagCommit),
    activeTagExists: valueState(release?.activeTagExists),
    activeGithubReleaseExists: valueState(release?.activeGithubReleaseExists),
    sourceRefs: projectChildDispatchEvidenceRefs(release?.sourceRefs)
  };
}

function projectStableWorkbenchSurface(surface) {
  return {
    id: valueState(surface?.id),
    label: valueState(surface?.label),
    state: valueState(surface?.state),
    required: valueState(surface?.required),
    sourceContract: valueState(surface?.sourceContract),
    sourceRef: projectSystemGoldenPathSourceRef(surface?.sourceRef),
    evidenceRefs: projectChildDispatchEvidenceRefs(surface?.evidenceRefs),
    readOnly: valueState(surface?.readOnly),
    copyOnly: valueState(surface?.copyOnly),
    willMutate: valueState(surface?.willMutate),
    blockedReasons: projectSystemGoldenPathTextItems(surface?.blockedReasons)
  };
}

function projectStableWorkbenchProviderBoundary(providerBoundary) {
  const hasBoundary = providerBoundary !== null && providerBoundary !== undefined && typeof providerBoundary === 'object' && !Array.isArray(providerBoundary);
  const activeClaims = Array.isArray(providerBoundary?.activeWorkbenchProviderClaims)
    ? providerBoundary.activeWorkbenchProviderClaims
    : [];
  const unsupportedClaims = Array.isArray(providerBoundary?.unsupportedProviderClaims)
    ? providerBoundary.unsupportedProviderClaims
    : [];

  return {
    state: hasBoundary ? 'available' : 'missing',
    activeWorkbenchProviderClaims: {
      state: activeClaims.length > 0 ? 'available' : hasBoundary ? 'empty' : 'missing',
      count: valueState(activeClaims.length),
      items: activeClaims.map(projectStableWorkbenchProviderClaim)
    },
    unsupportedProviderClaims: {
      state: unsupportedClaims.length > 0 ? 'available' : hasBoundary ? 'empty' : 'missing',
      count: valueState(unsupportedClaims.length),
      items: unsupportedClaims.map(projectStableWorkbenchProviderClaim)
    },
    rawProviderCliEvidenceAllowed: valueState(providerBoundary?.rawProviderCliEvidenceAllowed),
    notes: projectSystemGoldenPathTextItems(providerBoundary?.notes)
  };
}

function projectStableWorkbenchProviderClaim(claim) {
  return {
    provider: valueState(claim?.provider),
    claim: valueState(claim?.claim),
    status: valueState(claim?.status),
    sourceContract: valueState(claim?.sourceContract),
    sourceRef: projectSystemGoldenPathSourceRef(claim?.sourceRef),
    blockedReasons: projectSystemGoldenPathTextItems(claim?.blockedReasons)
  };
}

function projectStableWorkbenchReleaseOperations(releaseBoundary) {
  const hasBoundary = releaseBoundary !== null && releaseBoundary !== undefined && typeof releaseBoundary === 'object' && !Array.isArray(releaseBoundary);

  return {
    state: hasBoundary ? 'available' : 'missing',
    tagOperation: projectStableWorkbenchReleaseOperation(releaseBoundary?.tagOperation),
    pushTagOperation: projectStableWorkbenchReleaseOperation(releaseBoundary?.pushTagOperation),
    githubReleaseOperation: projectStableWorkbenchReleaseOperation(releaseBoundary?.githubReleaseOperation),
    releaseReadyDeclaration: projectStableWorkbenchReleaseOperation(releaseBoundary?.releaseReadyDeclaration),
    manualControllerActionRequired: valueState(releaseBoundary?.manualControllerActionRequired),
    automationObserved: valueState(releaseBoundary?.automationObserved),
    blockedReasons: projectSystemGoldenPathTextItems(releaseBoundary?.blockedReasons)
  };
}

function projectStableWorkbenchReleaseOperation(operation) {
  const hasOperation = operation !== null && operation !== undefined && typeof operation === 'object' && !Array.isArray(operation);

  return {
    state: valueState(hasOperation ? operation.state ?? 'available' : undefined),
    commandResult: valueState(operation?.commandResult),
    copyOnly: valueState(operation?.copyOnly),
    willMutate: valueState(operation?.willMutate),
    sourceRef: projectSystemGoldenPathSourceRef(operation?.sourceRef)
  };
}

function projectStableWorkbenchSafety(safety) {
  const hasSafety = safety !== null && safety !== undefined && typeof safety === 'object' && !Array.isArray(safety);

  return {
    state: hasSafety ? 'available' : 'missing',
    rawTranscriptObserved: valueState(safety?.rawTranscriptObserved),
    rawModelOutputObserved: valueState(safety?.rawModelOutputObserved),
    frontendLocalJsonlReadObserved: valueState(safety?.frontendLocalJsonlReadObserved),
    frontendLocalSessionReadObserved: valueState(safety?.frontendLocalSessionReadObserved),
    frontendProviderFolderReadObserved: valueState(safety?.frontendProviderFolderReadObserved),
    rendererCommandExecutionObserved: valueState(safety?.rendererCommandExecutionObserved),
    genericShellObserved: valueState(safety?.genericShellObserved),
    genericTerminalObserved: valueState(safety?.genericTerminalObserved),
    directGoalEventAppendObserved: valueState(safety?.directGoalEventAppendObserved),
    directTaskCompletionObserved: valueState(safety?.directTaskCompletionObserved),
    automaticWorktreeCreationObserved: valueState(safety?.automaticWorktreeCreationObserved),
    automaticNextVersionGoalObserved: valueState(safety?.automaticNextVersionGoalObserved),
    blockedReasons: projectSystemGoldenPathTextItems(safety?.blockedReasons)
  };
}

function projectReleaseCloseoutReviewGateSource(source) {
  const hasSource = source !== null && source !== undefined && typeof source === 'object' && !Array.isArray(source);

  return {
    state: hasSource ? source.state ?? 'available' : 'missing',
    contractName: valueState(source?.contractName),
    reviewReadiness: projectReviewGateReadiness(source?.reviewReadiness),
    mainGateReadiness: projectReviewGateReadiness(source?.mainGateReadiness),
    releaseGateReadiness: projectReviewGateReadiness(source?.releaseGateReadiness),
    previewHash: valueState(source?.previewHash),
    planHash: valueState(source?.planHash),
    sourceRef: projectSystemGoldenPathSourceRef(source?.sourceRef),
    blockedReasons: projectSystemGoldenPathTextItems(source?.blockedReasons)
  };
}

function projectReleaseCloseoutCloseoutSource(source) {
  const hasSource = source !== null && source !== undefined && typeof source === 'object' && !Array.isArray(source);

  return {
    state: hasSource ? source.state ?? 'available' : 'missing',
    contractName: valueState(source?.contractName),
    missingCount: valueState(source?.missingCount),
    releaseReady: valueState(source?.releaseReady),
    releaseReadySource: valueState(source?.releaseReadySource),
    sourceRef: projectSystemGoldenPathSourceRef(source?.sourceRef),
    blockedReasons: projectSystemGoldenPathTextItems(source?.blockedReasons)
  };
}

function projectReleaseCloseoutBaseline(baseline) {
  const hasBaseline = baseline !== null && baseline !== undefined && typeof baseline === 'object' && !Array.isArray(baseline);

  return {
    state: hasBaseline ? baseline.state ?? 'available' : 'missing',
    contractName: valueState(baseline?.contractName),
    currentBranch: valueState(baseline?.currentBranch),
    currentHead: valueState(baseline?.currentHead),
    mainHead: valueState(baseline?.mainHead),
    originMainHead: valueState(baseline?.originMainHead),
    targetCommit: valueState(baseline?.targetCommit),
    clean: valueState(baseline?.clean),
    sourceRef: projectSystemGoldenPathSourceRef(baseline?.sourceRef),
    blockedReasons: projectSystemGoldenPathTextItems(baseline?.blockedReasons)
  };
}

function projectReleaseCloseoutTargetCommit(targetCommit) {
  const hasTarget = targetCommit !== null && targetCommit !== undefined && typeof targetCommit === 'object' && !Array.isArray(targetCommit);

  return {
    state: hasTarget ? targetCommit.state ?? 'available' : 'missing',
    commit: valueState(targetCommit?.commit),
    source: valueState(targetCommit?.source),
    expectedCommit: valueState(targetCommit?.expectedCommit),
    stale: valueState(targetCommit?.stale),
    blockedReasons: projectSystemGoldenPathTextItems(targetCommit?.blockedReasons)
  };
}

function projectReleaseCloseoutChecklist(checklist) {
  const hasChecklist = checklist !== null && checklist !== undefined && typeof checklist === 'object' && !Array.isArray(checklist);
  const steps = Array.isArray(checklist?.steps) ? checklist.steps : [];

  return {
    state: hasChecklist ? checklist.state ?? 'available' : 'missing',
    contractName: valueState(checklist?.contractName),
    targetTag: valueState(checklist?.targetTag),
    releaseTitle: valueState(checklist?.releaseTitle),
    targetCommit: valueState(checklist?.targetCommit),
    releaseNotesRefs: projectChildDispatchEvidenceRefs(checklist?.releaseNotesRefs),
    validationEvidenceRefs: projectChildDispatchEvidenceRefs(checklist?.validationEvidenceRefs),
    rollbackRefs: projectChildDispatchEvidenceRefs(checklist?.rollbackRefs),
    nextVersionRunbookRef: projectSystemGoldenPathSourceRef(checklist?.nextVersionRunbookRef),
    steps: {
      state: steps.length > 0 ? 'available' : hasChecklist ? 'empty' : 'missing',
      count: valueState(steps.length),
      items: steps.map((step) => ({
        stepId: valueState(step?.stepId),
        label: valueState(step?.label),
        status: valueState(step?.status),
        copyOnly: valueState(step?.copyOnly),
        willMutate: valueState(step?.willMutate)
      }))
    },
    commandResults: {
      tag: valueState(checklist?.commandResults?.tag),
      pushTag: valueState(checklist?.commandResults?.pushTag),
      githubRelease: valueState(checklist?.commandResults?.githubRelease),
      releaseReadyDeclaration: valueState(checklist?.commandResults?.releaseReadyDeclaration)
    },
    boundaries: Object.fromEntries(
      Object.entries(checklist?.boundaries ?? {}).map(([key, value]) => [key, valueState(value)])
    ),
    copyOnly: valueState(checklist?.copyOnly),
    readOnly: valueState(checklist?.readOnly),
    willMutate: valueState(checklist?.willMutate)
  };
}

function projectReviewGateControlledRequest(request) {
  const hasRequest = request !== null && request !== undefined && typeof request === 'object' && !Array.isArray(request);
  const query = request?.query !== null && request?.query !== undefined && typeof request.query === 'object' && !Array.isArray(request.query)
    ? request.query
    : {};

  return {
    state: hasRequest ? 'available' : 'missing',
    method: valueState(request?.method),
    route: valueState(request?.route),
    contentType: valueState(request?.contentType),
    query: {
      state: Object.keys(query).length > 0 ? 'available' : hasRequest ? 'empty' : 'missing',
      items: Object.entries(query).map(([key, value]) => ({
        key: valueState(key),
        value: valueState(Array.isArray(value) ? value.join('、') : value)
      }))
    },
    requiredBodyFields: projectSystemGoldenPathTextItems(request?.requiredBodyFields),
    confirmUsesPlanHash: valueState(request?.confirmUsesPlanHash),
    writesInPreview: valueState(request?.writesInPreview),
    willMutate: valueState(request?.willMutate)
  };
}

function projectThreadHandoffSourceRecovery(sourceRecovery) {
  const hasSource = sourceRecovery !== null && sourceRecovery !== undefined && typeof sourceRecovery === 'object' && !Array.isArray(sourceRecovery);

  return {
    state: hasSource ? 'available' : 'missing',
    contractName: valueState(sourceRecovery?.contractName),
    contractVersion: valueState(sourceRecovery?.contractVersion),
    recoveryState: valueState(sourceRecovery?.state),
    runId: valueState(sourceRecovery?.runId),
    previewHash: valueState(sourceRecovery?.previewHash),
    blockedReasons: projectSystemGoldenPathTextItems(sourceRecovery?.blockedReasons),
    sourceRef: projectSystemGoldenPathSourceRef(sourceRecovery?.sourceRef)
  };
}

function projectThreadHandoffSourceReviewerHandoff(sourceReviewerHandoff) {
  const hasSource = sourceReviewerHandoff !== null && sourceReviewerHandoff !== undefined && typeof sourceReviewerHandoff === 'object' && !Array.isArray(sourceReviewerHandoff);

  return {
    state: hasSource ? 'available' : 'missing',
    contractName: valueState(sourceReviewerHandoff?.contractName),
    contractVersion: valueState(sourceReviewerHandoff?.contractVersion),
    readiness: valueState(sourceReviewerHandoff?.readiness),
    pendingResultState: valueState(sourceReviewerHandoff?.pendingResultState),
    blockedReasons: projectSystemGoldenPathTextItems(sourceReviewerHandoff?.blockedReasons),
    sourceRef: projectSystemGoldenPathSourceRef(sourceReviewerHandoff?.sourceRef)
  };
}

function projectThreadHandoffNextSafeAction(nextSafeAction) {
  return {
    actionId: valueState(nextSafeAction?.actionId),
    label: valueState(nextSafeAction?.label),
    copyOnly: valueState(nextSafeAction?.copyOnly),
    willMutate: valueState(nextSafeAction?.willMutate)
  };
}

function projectThreadHandoffSourceContract(sourceContract) {
  return {
    contractName: valueState(sourceContract?.contractName),
    contractVersion: valueState(sourceContract?.contractVersion),
    generatedAt: valueState(sourceContract?.generatedAt),
    readOnly: valueState(sourceContract?.readOnly),
    requiredFor: projectSystemGoldenPathTextItems(sourceContract?.requiredFor),
    previewHash: valueState(sourceContract?.previewHash),
    sourceRef: projectSystemGoldenPathSourceRef(sourceContract?.sourceRef)
  };
}

function projectThreadHandoffCopyBlock(copyBlock) {
  const hasBlock = copyBlock !== null && copyBlock !== undefined && typeof copyBlock === 'object' && !Array.isArray(copyBlock);

  return {
    state: hasBlock ? 'available' : 'missing',
    contractName: valueState(copyBlock?.contractName),
    contractVersion: valueState(copyBlock?.contractVersion),
    generatedAt: valueState(copyBlock?.generatedAt),
    blockId: valueState(copyBlock?.blockId),
    blockType: valueState(copyBlock?.blockType),
    title: valueState(copyBlock?.title),
    copyText: valueState(copyBlock?.body),
    summary: valueState(copyBlock?.summary),
    nextSafeAction: projectThreadHandoffNextSafeAction(copyBlock?.nextSafeAction),
    requiredEvidenceRefs: projectChildDispatchEvidenceRefs(copyBlock?.requiredEvidenceRefs),
    blockedReasons: projectSystemGoldenPathTextItems(copyBlock?.blockedReasons),
    copyOnly: valueState(copyBlock?.copyOnly),
    willMutate: valueState(copyBlock?.willMutate),
    contextCarryoverRefs: projectThreadHandoffContextCarryoverRefs(copyBlock?.contextCarryoverRefs),
    threadBoundaryNotice: projectThreadBoundaryNotice(copyBlock?.threadBoundaryNotice),
    sourceContracts: {
      state: Array.isArray(copyBlock?.sourceContracts) && copyBlock.sourceContracts.length > 0 ? 'available' : hasBlock ? 'empty' : 'missing',
      count: valueState(Array.isArray(copyBlock?.sourceContracts) ? copyBlock.sourceContracts.length : undefined),
      items: (Array.isArray(copyBlock?.sourceContracts) ? copyBlock.sourceContracts : []).map(projectThreadHandoffSourceContract)
    }
  };
}

function projectThreadHandoffContextCarryoverRefs(contextCarryoverRefs) {
  const hasCarryover = contextCarryoverRefs !== null && contextCarryoverRefs !== undefined && typeof contextCarryoverRefs === 'object' && !Array.isArray(contextCarryoverRefs);

  return {
    state: hasCarryover ? 'available' : 'missing',
    contractName: valueState(contextCarryoverRefs?.contractName),
    contractVersion: valueState(contextCarryoverRefs?.contractVersion),
    generatedAt: valueState(contextCarryoverRefs?.generatedAt),
    copyOnly: valueState(contextCarryoverRefs?.copyOnly),
    willMutate: valueState(contextCarryoverRefs?.willMutate),
    goalId: valueState(contextCarryoverRefs?.goalId),
    taskId: valueState(contextCarryoverRefs?.taskId),
    contextRefs: {
      state: Array.isArray(contextCarryoverRefs?.contextRefs) && contextCarryoverRefs.contextRefs.length > 0 ? 'available' : hasCarryover ? 'empty' : 'missing',
      count: valueState(Array.isArray(contextCarryoverRefs?.contextRefs) ? contextCarryoverRefs.contextRefs.length : undefined),
      items: (Array.isArray(contextCarryoverRefs?.contextRefs) ? contextCarryoverRefs.contextRefs : []).map(projectSystemGoldenPathSourceRef)
    },
    evidenceRefs: projectChildDispatchEvidenceRefs(contextCarryoverRefs?.evidenceRefs),
    sourceContracts: {
      state: Array.isArray(contextCarryoverRefs?.sourceContracts) && contextCarryoverRefs.sourceContracts.length > 0 ? 'available' : hasCarryover ? 'empty' : 'missing',
      count: valueState(Array.isArray(contextCarryoverRefs?.sourceContracts) ? contextCarryoverRefs.sourceContracts.length : undefined),
      items: (Array.isArray(contextCarryoverRefs?.sourceContracts) ? contextCarryoverRefs.sourceContracts : []).map(projectThreadHandoffSourceContract)
    },
    knownFacts: projectSystemGoldenPathTextItems(contextCarryoverRefs?.knownFacts),
    blockedReasons: projectSystemGoldenPathTextItems(contextCarryoverRefs?.blockedReasons)
  };
}

function projectThreadBoundaryNotice(threadBoundaryNotice) {
  const hasNotice = threadBoundaryNotice !== null && threadBoundaryNotice !== undefined && typeof threadBoundaryNotice === 'object' && !Array.isArray(threadBoundaryNotice);

  return {
    state: hasNotice ? 'available' : 'missing',
    contractName: valueState(threadBoundaryNotice?.contractName),
    contractVersion: valueState(threadBoundaryNotice?.contractVersion),
    generatedAt: valueState(threadBoundaryNotice?.generatedAt),
    copyOnly: valueState(threadBoundaryNotice?.copyOnly),
    willMutate: valueState(threadBoundaryNotice?.willMutate),
    disabledCapabilities: projectSystemGoldenPathTextItems(threadBoundaryNotice?.disabledCapabilities),
    boundaries: Object.fromEntries(
      Object.entries(threadBoundaryNotice?.boundaries ?? {}).map(([key, value]) => [key, valueState(value)])
    )
  };
}

function projectThreadHandoffCheckpointRef(checkpointRef) {
  const hasCheckpoint = checkpointRef !== null && checkpointRef !== undefined && typeof checkpointRef === 'object' && !Array.isArray(checkpointRef);

  return {
    state: hasCheckpoint ? 'available' : 'missing',
    contractName: valueState(checkpointRef?.contractName),
    contractVersion: valueState(checkpointRef?.contractVersion),
    generatedAt: valueState(checkpointRef?.generatedAt),
    snapshotId: valueState(checkpointRef?.snapshotId),
    copyOnly: valueState(checkpointRef?.copyOnly),
    willMutate: valueState(checkpointRef?.willMutate),
    summary: valueState(checkpointRef?.summary),
    knownFacts: projectSystemGoldenPathTextItems(checkpointRef?.knownFacts),
    blockedReasons: projectSystemGoldenPathTextItems(checkpointRef?.blockedReasons),
    nextSafeAction: projectThreadHandoffNextSafeAction(checkpointRef?.nextSafeAction),
    requiredEvidenceRefs: projectChildDispatchEvidenceRefs(checkpointRef?.requiredEvidenceRefs),
    sourceContracts: {
      state: Array.isArray(checkpointRef?.sourceContracts) && checkpointRef.sourceContracts.length > 0 ? 'available' : hasCheckpoint ? 'empty' : 'missing',
      count: valueState(Array.isArray(checkpointRef?.sourceContracts) ? checkpointRef.sourceContracts.length : undefined),
      items: (Array.isArray(checkpointRef?.sourceContracts) ? checkpointRef.sourceContracts : []).map(projectThreadHandoffSourceContract)
    },
    boundaries: Object.fromEntries(
      Object.entries(checkpointRef?.boundaries ?? {}).map(([key, value]) => [key, valueState(value)])
    )
  };
}

function projectChildDispatchTaskPack(taskPack) {
  const available = taskPack !== null && taskPack !== undefined && typeof taskPack === 'object' && !Array.isArray(taskPack);

  return {
    state: available ? 'available' : 'missing',
    contractName: valueState(available ? 'childTaskPack.v1' : undefined),
    goalId: valueState(taskPack?.goalId),
    taskId: valueState(taskPack?.taskId),
    role: valueState(taskPack?.role),
    preferredProvider: valueState(taskPack?.preferredProvider),
    allowedProviders: projectSystemGoldenPathTextItems(taskPack?.allowedProviders),
    returnPath: valueState(taskPack?.returnPath),
    copyOnly: valueState(taskPack?.copyOnly),
    willMutate: valueState(taskPack?.willMutate),
    projectContextRefs: projectSystemGoldenPathTextItems(taskPack?.projectContextRefs),
    acceptanceCriteria: projectSystemGoldenPathTextItems(taskPack?.acceptanceCriteria),
    requiredEvidenceRefs: projectChildDispatchEvidenceRefs(taskPack?.requiredEvidenceRefs),
    taskPrompt: valueState(taskPack?.taskPrompt),
    json: valueState(available ? stableJsonText(taskPack) : undefined)
  };
}

function projectChildDispatchResultExpectation(resultExpectation) {
  const expectedResultBlock = resultExpectation?.expectedResultBlock;
  const hasExpectation = resultExpectation !== null &&
    resultExpectation !== undefined &&
    typeof resultExpectation === 'object' &&
    !Array.isArray(resultExpectation);
  const hasBlock = expectedResultBlock !== null &&
    expectedResultBlock !== undefined &&
    typeof expectedResultBlock === 'object' &&
    !Array.isArray(expectedResultBlock);

  return {
    state: hasExpectation ? 'available' : 'missing',
    contractName: valueState(resultExpectation?.contractName),
    returnPath: valueState(resultExpectation?.returnPath),
    resultIntakeContract: valueState(resultExpectation?.resultIntakeContract),
    directGoalEventAppendAvailable: valueState(resultExpectation?.directGoalEventAppendAvailable),
    directTaskCompleteAvailable: valueState(resultExpectation?.directTaskCompleteAvailable),
    reviewerMutationAvailable: valueState(resultExpectation?.reviewerMutationAvailable),
    mainVerificationMutationAvailable: valueState(resultExpectation?.mainVerificationMutationAvailable),
    releaseGateMutationAvailable: valueState(resultExpectation?.releaseGateMutationAvailable),
    requiredEvidenceRefs: projectChildDispatchEvidenceRefs(resultExpectation?.requiredEvidenceRefs),
    expectedResultBlock: {
      state: hasBlock ? 'available' : 'missing',
      contractName: valueState(expectedResultBlock?.contractName),
      goalId: valueState(expectedResultBlock?.goalId),
      taskId: valueState(expectedResultBlock?.taskId),
      workerRole: valueState(expectedResultBlock?.workerRole),
      source: valueState(expectedResultBlock?.source),
      requestedEvent: valueState(expectedResultBlock?.requestedEvent?.eventType),
      willAppendGoalEvent: valueState(expectedResultBlock?.willAppendGoalEvent),
      json: valueState(hasBlock ? stableJsonText(expectedResultBlock) : undefined)
    }
  };
}

function projectChildDispatchEvidenceRefs(evidenceRefs) {
  return {
    state: Array.isArray(evidenceRefs) && evidenceRefs.length > 0 ? 'available' : Array.isArray(evidenceRefs) ? 'empty' : 'missing',
    count: valueState(Array.isArray(evidenceRefs) ? evidenceRefs.length : undefined),
    items: (Array.isArray(evidenceRefs) ? evidenceRefs : []).map((evidenceRef) => ({
      kind: valueState(evidenceRef?.kind),
      ref: valueState(evidenceRef?.ref),
      label: valueState(evidenceRef?.label)
    }))
  };
}

function projectChildDispatchBoundaries(boundaries) {
  return {
    copyOnly: valueState(boundaries?.copyOnly),
    willMutate: valueState(boundaries?.willMutate),
    providerExecutionAvailable: valueState(boundaries?.providerExecutionAvailable),
    actualChildDispatchAvailable: valueState(boundaries?.actualChildDispatchAvailable),
    childProcessSpawnAvailable: valueState(boundaries?.childProcessSpawnAvailable),
    frontendLocalFileReadAvailable: valueState(boundaries?.frontendLocalFileReadAvailable),
    directGoalEventAppendAvailable: valueState(boundaries?.directGoalEventAppendAvailable),
    directTaskCompleteAvailable: valueState(boundaries?.directTaskCompleteAvailable),
    reviewerMutationAvailable: valueState(boundaries?.reviewerMutationAvailable),
    mainVerificationMutationAvailable: valueState(boundaries?.mainVerificationMutationAvailable),
    releaseGateMutationAvailable: valueState(boundaries?.releaseGateMutationAvailable),
    gitMutationAvailable: valueState(boundaries?.gitMutationAvailable),
    tagAutomationAvailable: valueState(boundaries?.tagAutomationAvailable),
    publishAutomationAvailable: valueState(boundaries?.publishAutomationAvailable),
    githubReleaseAutomationAvailable: valueState(boundaries?.githubReleaseAutomationAvailable)
  };
}

function stableJsonText(value) {
  return JSON.stringify(value, null, 2);
}

function projectSystemGoldenPathAction(action) {
  return {
    kind: valueState(action?.kind),
    label: valueState(action?.label),
    reason: valueState(action?.reason),
    commandName: valueState(action?.commandName),
    method: valueState(action?.method),
    routeTemplate: valueState(action?.routeTemplate),
    willMutate: valueState(action?.willMutate)
  };
}

function projectSystemGoldenPathManualActions(actions) {
  const items = actions.map((action) => ({
    label: valueState(action?.label),
    reason: valueState(action?.reason),
    commandName: valueState(action?.commandName),
    willMutate: valueState(action?.willMutate)
  }));

  return {
    state: items.length === 0 ? 'empty' : 'available',
    count: valueState(items.length),
    items
  };
}

function projectSystemGoldenPathTextItems(values) {
  if (!Array.isArray(values)) {
    return {
      state: 'missing',
      count: valueState(undefined),
      items: []
    };
  }

  return {
    state: values.length === 0 ? 'empty' : 'available',
    count: valueState(values.length),
    items: values.map((value) => valueState(value))
  };
}

function projectDesktopBackendHealth({
  runtimeSnapshot,
  runtimeRoute
}) {
  const routeState = routeStateFromRoute(runtimeRoute);
  const state = runtimeSnapshot?.state ?? (routeState === 'ready' ? 'available' : routeState);

  return {
    state: valueState(state),
    status: runtimeSnapshot?.runtime?.status,
    mode: runtimeSnapshot?.runtime?.mode,
    version: runtimeSnapshot?.runtime?.version,
    kernel: runtimeSnapshot?.runtime?.kernel,
    generatedAt: runtimeSnapshot?.generatedAt,
    freshness: runtimeSnapshot?.freshness?.status,
    ageMs: runtimeSnapshot?.freshness?.ageMs,
    staleAfterMs: runtimeSnapshot?.freshness?.staleAfterMs,
    cwd: runtimeSnapshot?.runtime?.cwd,
    repoPath: runtimeSnapshot?.runtime?.repoPath,
    route: valueState(runtimeRoute?.path),
    routeState: valueState(routeState),
    routeSource: valueState(desktopRouteSourceText(runtimeRoute, runtimeSnapshot?.state)),
    sourcePolicy: valueState('app-state-snapshot.v1 via /api/runtime/snapshot')
  };
}

function projectDesktopSupervisorSummary({
  supervisorDashboard,
  supervisorRoute
}) {
  const route = supervisorDashboard?.route ?? supervisorRoute;
  const available = supervisorDashboard?.state === 'available';
  const recommendedNextAction = supervisorDashboard?.recommendedNextAction ?? {};
  const goalSnapshot = supervisorDashboard?.goalSnapshot ?? {};
  const commandBoundary = supervisorDashboard?.commandBoundary ?? {};

  return {
    state: valueState(available ? 'available' : 'unavailable'),
    summary: valueState(supervisorDashboard?.summary),
    goalId: valueState(goalSnapshot.goalId),
    title: valueState(goalSnapshot.title),
    activeTask: valueState(goalSnapshot.activeTask),
    activeRole: valueState(goalSnapshot.activeRole),
    recommendedAction: valueState(recommendedNextAction.label ?? recommendedNextAction.actionId),
    actionReason: valueState(recommendedNextAction.reason),
    targetTask: valueState(recommendedNextAction.targetTask),
    targetRole: valueState(recommendedNextAction.targetRole),
    contextState: valueState(supervisorDashboard?.contextStatus?.state),
    pendingResult: valueState(supervisorDashboard?.pendingResult?.status),
    currentGate: valueState(supervisorDashboard?.currentGate?.gateId),
    gateStatus: valueState(supervisorDashboard?.currentGate?.status),
    ownership: valueState(supervisorDashboard?.ownership?.orchestrationOwner),
    commandBoundaryState: valueState(commandBoundary.state),
    commandExecutionAvailable: valueState(commandBoundary.executionAvailable === true),
    safePreview: valueState(recommendedNextAction.safePreview ?? commandBoundary.safePreview),
    readOnly: valueState(supervisorDashboard?.readOnly),
    willMutate: valueState(supervisorDashboard?.willMutate),
    route: valueState(route?.path),
    routeState: valueState(routeStateFromRoute(route)),
    routeSource: valueState(desktopRouteSourceText(route, available ? 'available' : 'missing')),
    sourceMode: valueState(supervisorDashboard?.sourceMode),
    sourcePolicy: valueState('goal-supervisor-app-read-model.v1')
  };
}

function projectDesktopRouteProvenance({
  routeStates,
  runtimeSnapshot
}) {
  const routeSpecs = [
    ['runtimeSnapshot', 'backend health', 'app-state-snapshot.v1'],
    ['projectRegistry', 'current project', 'project-registry.v1'],
    ['recentProjects', 'recent projects', RECENT_PROJECTS_CONTRACT_NAME],
    ['currentProjectBinding', 'selected project binding', CURRENT_PROJECT_BINDING_CONTRACT_NAME],
    ['goalRunbook', 'active goal', GOAL_RUNBOOK_CONTRACT_NAME],
    ['goalNextAction', 'next action', GOAL_NEXT_ACTION_CONTRACT_NAME],
    ['goalSupervisor', 'supervisor summary', GOAL_SUPERVISOR_APP_READ_MODEL_CONTRACT_NAME],
    ['jobModel', 'run health', JOB_MODEL_CONTRACT_NAME],
    ['artifactIndex', 'artifact readiness', ARTIFACT_INDEX_CONTRACT_NAME],
    ['evidenceTimeline', 'evidence refs', EVIDENCE_TIMELINE_CONTRACT_NAME]
  ];
  const items = routeSpecs.map(([id, label, sourceContract]) => {
    const route = findProjectedRoute(routeStates, id);
    const source = id === 'runtimeSnapshot'
      ? desktopRouteSourceText(route, runtimeSnapshot?.state)
      : desktopRouteSourceText(route);

    return {
      id: valueState(id),
      label: valueState(label),
      route: valueState(route?.path),
      routeState: valueState(routeStateFromRoute(route)),
      source: valueState(source),
      contractName: route?.contractName ?? valueState(sourceContract),
      contractVersion: route?.contractVersion ?? valueState(undefined),
      error: valueState(route?.error)
    };
  });
  const itemRouteStates = items.map((item) => item.routeState.value);

  return {
    state: valueState(itemRouteStates.includes('failed')
      ? 'failed'
      : itemRouteStates.some((state) => state !== 'ready')
        ? 'partial'
        : 'available'),
    items,
    sourcePolicy: valueState('route state projection from existing Workbench read-only API results')
  };
}

function projectDesktopSelectedProject({
  workspace,
  currentProjectBinding,
  projectHealth
}) {
  const bindingState = currentProjectBinding?.state ?? 'missing';
  const projectId = workspace?.projectId;
  const hasProject = projectId?.state === 'available';
  const appStates = [];

  if (bindingState === 'missing') {
    appStates.push('binding missing');
  }

  if (!hasProject) {
    appStates.push('project missing');
  }

  if (projectHealth?.activeGoal?.state?.value === 'missing') {
    appStates.push('active goal missing');
  }

  if (projectHealth?.supervisor?.state?.value !== 'available') {
    appStates.push('supervisor unavailable');
  }

  if (projectHealth?.backend?.state?.value === 'stale') {
    appStates.push('stale snapshot');
  }

  if (projectHealth?.routeProvenance?.state?.value === 'failed') {
    appStates.push('route failed');
  }

  const selectedState = bindingState === 'bound'
    ? 'selected'
    : bindingState === 'unbound' ? 'needs-selection' : bindingState;

  return {
    state: valueState(selectedState),
    projectId,
    displayName: workspace?.project,
    repoPath: workspace?.repoPath,
    healthState: projectHealth?.state,
    appStates: {
      state: valueState(appStates.length === 0 ? 'available' : 'degraded'),
      items: appStates.map((state) => valueState(state))
    },
    sourcePolicy: valueState('backend contracts only'),
    selectionControl: currentProjectBinding?.selectionControl ?? {
      state: valueState('unavailable'),
      disabledReason: valueState('current-project-binding.v1 missing'),
      endpointId: valueState('/api/projects/current-binding/select')
    }
  };
}

function projectDesktopProjectHealth({
  workspace,
  backendHealth,
  activeGoalStatus,
  supervisorSummary,
  jobConsole,
  artifactIndex,
  routeProvenance,
  currentProjectBinding
}) {
  const backendState = backendHealth?.state?.value;
  const activeGoalId = firstValue(activeGoalStatus?.goalId);
  const routeItems = routeProvenance?.items ?? [];
  const failedRoutes = routeItems.filter((item) => item.routeState.value === 'failed');
  const state = workspace?.projectId?.state !== 'available'
    ? 'missing'
    : failedRoutes.length > 0
      ? 'failed'
      : activeGoalId === undefined || supervisorSummary?.state?.value !== 'available'
        ? 'degraded'
        : backendState === 'stale' ? 'stale' : 'healthy';

  return {
    contractName: valueState('project-health-snapshot.v1'),
    projectId: workspace?.projectId,
    state: valueState(state),
    repo: {
      path: workspace?.repoPath,
      branch: workspace?.defaultBranch,
      remote: valueState(undefined),
      dirtyState: valueState(undefined)
    },
    backend: {
      state: backendHealth?.state,
      routeAvailability: backendHealth?.routeState,
      freshness: backendHealth?.freshness,
      sidecarCompatibility: backendHealth?.mode,
      contractFreshness: backendHealth?.generatedAt
    },
    activeGoal: {
      state: valueState(activeGoalId === undefined ? 'missing' : activeGoalStatus?.state?.value ?? 'available'),
      goalId: activeGoalStatus?.goalId,
      title: activeGoalStatus?.title,
      taskCount: activeGoalStatus?.totalTasks,
      nextTask: activeGoalStatus?.currentTaskId,
      missingReason: valueState(activeGoalId === undefined ? 'active goal missing for selected project' : null)
    },
    supervisor: {
      state: supervisorSummary?.state,
      pendingResult: supervisorSummary?.pendingResult,
      commandBoundaryState: supervisorSummary?.commandBoundaryState
    },
    runs: {
      latestRunId: workspace?.lastRunId,
      runHealth: valueState(jobConsole?.state),
      lastOpenedAt: currentProjectBinding?.selectionUpdatedAt
    },
    artifacts: {
      state: valueState(artifactIndex?.state),
      count: artifactIndex?.summary?.entryCount ?? valueState(undefined)
    },
    routeProvenance: {
      state: routeProvenance?.state,
      items: routeItems.map((item) => ({
        route: item.route,
        routeState: item.routeState,
        sourceContract: item.contractName,
        error: item.error
      }))
    },
    boundaries: valueState('no frontend file read, no command execution, no provider launch, no git write, no release write')
  };
}

function projectDesktopBoundaryFlags() {
  return {
    readOnly: valueState(true),
    willMutate: valueState(false),
    browserTerminalAvailable: valueState(false),
    genericShellRunnerAvailable: valueState(false),
    shellCommandExecutionAvailable: valueState(false),
    providerCliFromRendererAvailable: valueState(false),
    modelInvocationAvailable: valueState(false),
    daemonControlAvailable: valueState(false),
    childDispatchAvailable: valueState(false),
    goalEventRegistrationAvailable: valueState(false),
    arbitraryLocalFileOpenAvailable: valueState(false),
    gitWriteAvailable: valueState(false),
    gitReleaseActionAvailable: valueState(false),
    releaseReadyDeclared: valueState(false),
    signingNotarizationAutoUpdateAvailable: valueState(false),
    evidenceRefsAreInertText: valueState(true),
    commandPreviewsAreInertText: valueState(true),
    statusSource: valueState('explicit backend contracts only')
  };
}

function projectDesktopAppStateFlags({
  backendHealth,
  sidecarState,
  workspace,
  activeGoalStatus,
  supervisorSummary,
  runtimeSnapshot,
  routeProvenance,
  currentProjectBinding
}) {
  const backendRouteState = backendHealth?.routeState?.value ?? 'missing';
  const projectRouteState = workspace?.routeState?.value ?? 'missing';
  const activeGoalRouteState = activeGoalStatus?.routeState?.value ?? 'missing';
  const supervisorRouteState = supervisorSummary?.routeState?.value ?? 'missing';
  const failedRouteLabels = (routeProvenance?.items ?? [])
    .filter((item) => item.routeState.value === 'failed')
    .map((item) => item.label.value);
  const backendUnavailable = backendRouteState !== 'ready';
  const sidecarMissing = sidecarState === 'missing';
  const projectMissing = workspace?.project?.state === 'missing';
  const activeGoalMissing = activeGoalStatus?.goalId?.state === 'missing';
  const supervisorModelUnavailable = supervisorSummary?.state?.value !== 'available';
  const staleSnapshot = runtimeSnapshot?.state === 'stale' || backendHealth?.freshness?.value === 'stale';
  const routeFailed = failedRouteLabels.length > 0;
  const bindingMissing = currentProjectBinding?.state !== 'bound';

  return {
    bindingMissing: desktopAppStateFlag({
      value: bindingMissing,
      state: currentProjectBinding?.state === 'failed' ? 'failed' : 'missing',
      reason: bindingMissing ? `current project binding ${currentProjectBinding?.state ?? 'missing'}` : 'selected project binding exposed',
      source: CURRENT_PROJECT_BINDING_CONTRACT_NAME,
      routeState: currentProjectBinding?.routeState?.value ?? 'missing'
    }),
    backendUnavailable: desktopAppStateFlag({
      value: backendUnavailable,
      state: desktopUnavailableStateFromRoute(backendRouteState),
      reason: `runtime snapshot route ${backendRouteState}`,
      source: 'app-state-snapshot.v1 /api/runtime/snapshot',
      routeState: backendRouteState
    }),
    sidecarMissing: desktopAppStateFlag({
      value: sidecarMissing,
      state: 'missing',
      reason: sidecarMissing ? 'sidecar-host-lifecycle.v1 not exposed by runtime snapshot' : `sidecar ${sidecarState}`,
      source: 'sidecar-host-lifecycle.v1',
      routeState: backendRouteState
    }),
    projectMissing: desktopAppStateFlag({
      value: projectMissing,
      state: 'missing',
      reason: projectMissing ? `current project missing; project route ${projectRouteState}` : 'current project exposed',
      source: 'app-state-snapshot.v1 current_project + project-registry.v1',
      routeState: projectRouteState
    }),
    activeGoalMissing: desktopAppStateFlag({
      value: activeGoalMissing,
      state: 'missing',
      reason: activeGoalMissing ? `active goal id missing; goal route ${activeGoalRouteState}` : 'active goal id exposed',
      source: 'app-state-snapshot.v1 active_goal + goal-runbook.v1',
      routeState: activeGoalRouteState
    }),
    supervisorModelUnavailable: desktopAppStateFlag({
      value: supervisorModelUnavailable,
      state: supervisorRouteState === 'failed' ? 'failed' : 'unavailable',
      reason: supervisorModelUnavailable ? `supervisor model ${supervisorSummary?.state?.value ?? 'missing'}; route ${supervisorRouteState}` : 'supervisor model exposed',
      source: GOAL_SUPERVISOR_APP_READ_MODEL_CONTRACT_NAME,
      routeState: supervisorRouteState
    }),
    staleSnapshot: desktopAppStateFlag({
      value: staleSnapshot,
      state: 'stale',
      reason: staleSnapshot ? `runtime freshness ${backendHealth?.freshness?.value ?? runtimeSnapshot?.state}` : 'runtime snapshot current',
      source: 'app-state-snapshot.v1 freshness',
      routeState: backendRouteState
    }),
    routeFailed: desktopAppStateFlag({
      value: routeFailed,
      state: 'failed',
      reason: routeFailed ? failedRouteLabels.join(', ') : 'required desktop routes ready or non-failed',
      source: 'route state projection',
      routeState: routeProvenance?.state?.value ?? 'missing'
    }),
    sourcePolicy: valueState('visible App Home state flags derived from selected project binding, route states, and read-only projections')
  };
}

function desktopAppStateFlag({
  value,
  state,
  reason,
  source,
  routeState
}) {
  const active = value === true;
  const status = active ? state : 'ready';

  return {
    state: active ? status : 'available',
    text: active ? `true / ${status}` : 'false / ready',
    value: active,
    status: valueState(status),
    reason: valueState(reason),
    source: valueState(source),
    routeState: valueState(routeState)
  };
}

function desktopUnavailableStateFromRoute(routeState) {
  if (routeState === 'failed') {
    return 'failed';
  }

  if (routeState === 'skipped' || routeState === 'missing') {
    return 'missing';
  }

  return 'unavailable';
}

function desktopRouteSourceText(route, projectedState) {
  if (route?.state === 'ready' && projectedState === 'stale') {
    return 'stale snapshot';
  }

  if (route?.state === 'ready') {
    return 'live contract';
  }

  if (route?.state === 'skipped') {
    return 'skipped route';
  }

  if (route?.state === 'failed') {
    return 'failed route';
  }

  if (projectedState === 'missing') {
    return 'missing model';
  }

  return 'missing route';
}

function projectDesktopJobRun({
  jobConsole,
  jobRoute,
  jobCreationRoute,
  jobTimelineRoute,
  jobRunControlRoute
}) {
  const jobModel = jobConsole?.jobModel ?? {};
  const jobCreation = jobConsole?.jobCreation ?? {};
  const jobTimeline = jobConsole?.jobTimeline ?? {};
  const jobRunControl = jobConsole?.jobRunControl ?? {};

  return {
    state: valueState(jobConsole?.state),
    sourcePolicy: valueState('job-model.v1 + job-creation.v1 + job-timeline-log-stream.v1 + job-run-control.v1'),
    jobId: jobModel.jobId,
    status: jobModel.status,
    queueState: jobModel.queueState,
    actionId: jobModel.actionId,
    goalId: jobModel.goalId,
    taskId: jobModel.taskId,
    createdAt: jobModel.createdAt,
    leasedAt: jobModel.leasedAt,
    passedAt: jobModel.passedAt,
    failedAt: jobModel.failedAt,
    cancelledAt: jobModel.cancelledAt,
    blocker: jobModel.blocker ?? jobBlockerState(undefined),
    failure: jobModel.failure ?? jobFailureState(undefined),
    creation: {
      routeState: valueState(routeStateFromRoute(jobCreationRoute)),
      dryRun: jobCreation.plan?.dryRun,
      requiresConfirmation: jobCreation.plan?.requiresConfirmation,
      jobExecutionAvailable: jobCreation.plan?.jobExecutionAvailable,
      warnings: jobCreation.warnings ?? jobCreationWarningsState(undefined),
      blockers: jobCreation.blockers ?? jobCreationBlockersState(undefined)
    },
    timeline: {
      routeState: valueState(routeStateFromRoute(jobTimelineRoute)),
      eventCount: jobTimeline.eventCount,
      logRefCount: jobTimeline.logRefCount
    },
    runControl: {
      routeState: valueState(routeStateFromRoute(jobRunControlRoute)),
      currentState: jobRunControl.currentState,
      availableTransitions: jobRunControl.availableTransitions ?? jobTransitionsState(undefined),
      transitionTable: jobRunControl.transitionTable ?? jobTransitionTableState(undefined)
    },
    routes: {
      jobModel: valueState(routeStateFromRoute(jobRoute)),
      jobCreation: valueState(routeStateFromRoute(jobCreationRoute)),
      jobTimeline: valueState(routeStateFromRoute(jobTimelineRoute)),
      jobRunControl: valueState(routeStateFromRoute(jobRunControlRoute))
    },
    route: valueState(jobRoute?.path),
    routeState: valueState(routeStateFromRoute(jobRoute)),
    boundaries: {
      readOnly: jobModel.boundaries?.items?.find((item) => firstValue(item.key) === 'readOnly')?.value ?? valueState(true),
      jobExecutionAvailable: jobModel.boundaries?.items?.find((item) => firstValue(item.key) === 'jobExecutionAvailable')?.value ?? jobCreation.plan?.jobExecutionAvailable ?? valueState(false),
      actionExecutionAvailable: jobModel.boundaries?.items?.find((item) => firstValue(item.key) === 'actionExecutionAvailable')?.value ?? valueState(false),
      modelInvocationAvailable: jobModel.boundaries?.items?.find((item) => firstValue(item.key) === 'modelInvocationAvailable')?.value ?? valueState(false),
      arbitraryCommandExecutionAvailable: jobModel.boundaries?.items?.find((item) => firstValue(item.key) === 'arbitraryCommandExecutionAvailable')?.value ?? valueState(false)
    }
  };
}

function projectDesktopArtifactReadiness({
  artifactRefs,
  artifactIndex,
  evidenceTimeline,
  releaseBundle,
  backupExport,
  restoreValidation,
  diagnosticsBundle,
  artifactRoute,
  evidenceRoute,
  releaseBundleRoute,
  backupExportRoute,
  restoreValidationRoute,
  diagnosticsBundleRoute
}) {
  const previewItems = (artifactRefs?.items ?? []).map((artifact) => ({
    kind: artifact.kind,
    status: artifact.status,
    ref: artifact.ref,
    previewRoute: artifact.preview?.route,
    previewState: valueState(artifact.preview?.state),
    previewStatus: artifact.preview?.status,
    contractName: artifact.preview?.contractName,
    previewAvailable: artifact.preview?.previewAvailable,
    safeToRenderInline: artifact.preview?.safeToRenderInline,
    inlineState: valueState(artifact.preview?.inline?.state),
    inlineReason: valueState(artifact.preview?.inline?.reason),
    mime: artifact.preview?.mime
  }));
  const previewAvailableCount = previewItems.filter((item) => item.previewAvailable?.value === true).length;
  const safeInlineCount = previewItems.filter((item) => item.safeToRenderInline?.value === true).length;

  return {
    state: valueState(desktopArtifactReadinessState({
      artifactRefs,
      artifactIndex,
      evidenceTimeline,
      releaseBundle
    })),
    sourcePolicy: valueState('artifact-index.v1 + safe-artifact-preview.v1 + evidence-timeline.v1 + release-bundle.v1 + app-core-backup-export.v1 + app-core-restore-validation.v1 + app-core-diagnostics-bundle.v1'),
    registeredRefs: valueState(artifactRefs?.count),
    status: artifactRefs?.status?.status,
    missing: artifactRefs?.status?.missing,
    missingKinds: artifactRefs?.status?.missingKinds,
    safePreviewRoutes: valueState(artifactRefs?.previewRoutes?.count),
    previewAvailable: valueState(previewAvailableCount),
    safeInlineAvailable: valueState(safeInlineCount),
    missingPreviewFields: textState(Array.isArray(artifactRefs?.missingPreviewFields) && artifactRefs.missingPreviewFields.length > 0
      ? artifactRefs.missingPreviewFields.join('、')
      : '无'),
    previewItems: {
      state: previewItems.length === 0 ? 'empty' : 'available',
      count: valueState(previewItems.length),
      items: previewItems
    },
    artifactIndexState: valueState(artifactIndex?.state),
    artifactIndexEntries: artifactIndex?.entries?.count,
    artifactIndexCanonicalSource: artifactIndex?.context?.canonicalSource,
    artifactIndexRole: artifactIndex?.context?.indexRole,
    evidenceTimelineState: valueState(evidenceTimeline?.state),
    evidenceEntryCount: evidenceTimeline?.entryCount,
    evidenceCanonicalSource: evidenceTimeline?.context?.canonicalSource,
    releaseBundleState: valueState(releaseBundle?.state),
    releaseTaskCount: releaseBundle?.taskCount,
    releaseReady: releaseBundle?.releaseReady,
    releaseDecisionAvailable: releaseBundle?.boundaries?.releaseDecisionAvailable,
    backupExportState: valueState(backupExport?.state),
    backupManifestHash: backupExport?.manifestHash,
    backupManagedStateEntryCount: backupExport?.managedStateEntryCount,
    backupArtifactRefCount: backupExport?.artifactRefCount,
    backupRepoContentPolicy: backupExport?.boundaries?.repoContentPolicy,
    restoreValidationState: valueState(restoreValidation?.state),
    restoreValidationStatus: restoreValidation?.status,
    restoreIntegrityStatus: restoreValidation?.integrity?.status,
    restoreCompatibilityStatus: restoreValidation?.compatibility?.status,
    restoreOverwriteDefault: restoreValidation?.compatibility?.overwriteDefault,
    diagnosticsBundleState: valueState(diagnosticsBundle?.state),
    diagnosticsHealth: diagnosticsBundle?.health?.status,
    diagnosticsRecentFailures: diagnosticsBundle?.recentFailureCount,
    diagnosticsLogRefs: diagnosticsBundle?.sanitizedLogRefCount,
    route: valueState(artifactRoute?.path),
    routeState: valueState(routeStateFromRoute(artifactRoute)),
    evidenceRouteState: valueState(routeStateFromRoute(evidenceRoute)),
    releaseBundleRouteState: valueState(routeStateFromRoute(releaseBundleRoute)),
    backupExportRouteState: valueState(routeStateFromRoute(backupExportRoute)),
    restoreValidationRouteState: valueState(routeStateFromRoute(restoreValidationRoute)),
    diagnosticsBundleRouteState: valueState(routeStateFromRoute(diagnosticsBundleRoute)),
    boundaries: {
      readOnly: artifactIndex?.boundaries?.readOnly ?? valueState(true),
      canonicalSource: artifactIndex?.boundaries?.canonicalSource ?? valueState('ArtifactStore is canonical'),
      localFileOpenAvailable: artifactIndex?.boundaries?.localFileOpenAvailable ?? valueState(false),
      artifactDownloadAvailable: artifactIndex?.boundaries?.artifactDownloadAvailable ?? valueState(false),
      arbitraryPathReadAvailable: artifactIndex?.boundaries?.arbitraryPathReadAvailable ?? valueState(false)
    }
  };
}

function desktopArtifactReadinessState({
  artifactRefs,
  artifactIndex,
  evidenceTimeline,
  releaseBundle
}) {
  const states = [
    artifactRefs?.state,
    artifactIndex?.state,
    evidenceTimeline?.state,
    releaseBundle?.state
  ].filter((state) => typeof state === 'string');

  if (states.includes('unavailable')) {
    return 'unavailable';
  }

  if (states.includes('missing')) {
    return 'partial';
  }

  if (states.includes('available')) {
    return 'available';
  }

  if (states.includes('empty')) {
    return 'empty';
  }

  return 'missing';
}

function currentProjectFromRegistry(projectRegistry) {
  const projects = projectRegistry?.projects?.items ?? [];
  const currentProjectId = firstValue(projectRegistry?.currentProjectId);

  return projects.find((project) => firstValue(project.projectId) === currentProjectId) ?? projects[0] ?? null;
}

function currentProjectFromBinding(currentProjectBinding) {
  if (currentProjectBinding?.state === 'bound') {
    return {
      projectId: currentProjectBinding.selectedProjectId,
      name: currentProjectBinding.selectedProjectName,
      repoPath: currentProjectBinding.repoPath,
      defaultBranch: currentProjectBinding.defaultBranch,
      lastGoalId: currentProjectBinding.lastGoalId,
      lastRunId: currentProjectBinding.lastRunId
    };
  }

  return null;
}

function routeStateFromRoute(route) {
  if (route?.state === 'ready') {
    return 'ready';
  }

  if (route?.state === 'skipped') {
    return 'skipped';
  }

  return route?.state ?? 'unavailable';
}

function projectWorkbenchGoldenPath({ activeGoal, routeStates }) {
  const goalId = firstValue(
    activeGoal?.viewModel?.goalId,
    activeGoal?.runbook?.goalId,
    activeGoal?.nextAction?.goalId,
    activeGoal?.closeoutGaps?.goalId
  );
  const commandGoalId = isNonEmptyString(goalId) ? goalId : '<goal-id>';
  const nextTaskId = firstValue(
    activeGoal?.nextAction?.next?.taskId,
    activeGoal?.taskQueue?.nextTaskId,
    activeGoal?.reviewWorkspace?.taskId,
    activeGoal?.mainVerificationReadiness?.taskId
  );
  const nextRole = firstValue(
    activeGoal?.nextAction?.next?.role,
    activeGoal?.taskQueue?.nextRole,
    activeGoal?.reviewWorkspace?.activeNext?.role,
    activeGoal?.mainVerificationReadiness?.readiness?.currentNextRole
  );
  const workerEvidenceRef = firstValue(
    activeGoal?.nextAction?.evidenceState?.workerEvidenceRef,
    activeGoal?.reviewWorkspace?.workerEvidence?.ref
  );
  const reviewEvidenceRef = firstValue(
    activeGoal?.nextAction?.evidenceState?.reviewEvidenceRef,
    activeGoal?.reviewWorkspace?.existingReview?.evidenceRef,
    activeGoal?.mainVerificationReadiness?.reviewerApproval?.evidenceRef
  );
  const mainVerificationRef = firstValue(
    activeGoal?.nextAction?.evidenceState?.mainVerificationRef,
    activeGoal?.mainVerificationReadiness?.evidence?.existingMainVerificationRef
  );
  const missingCount = firstValue(activeGoal?.closeoutGaps?.missing?.count);
  const releaseReady = firstValue(activeGoal?.closeoutGaps?.summary?.releaseReady);
  const hasMainVerificationGap = activeGoal?.mainVerificationReadiness?.readiness?.canEnterMainVerification?.value === true &&
    !isNonEmptyString(mainVerificationRef);
  const goalStatusRoute = findProjectedRoute(routeStates, 'activeGoalProgress') ?? findProjectedRoute(routeStates, 'goalProgress');
  const nextRoute = findProjectedRoute(routeStates, 'goalNextAction');
  const promptRoute = findProjectedRoute(routeStates, 'goalPromptPack');
  const operationsRoute = findProjectedRoute(routeStates, 'activeGoalOperations') ?? findProjectedRoute(routeStates, 'goalOperations');
  const closeoutRoute = findProjectedRoute(routeStates, 'goalCloseout');
  const reviewForms = activeGoal?.reviewWorkspace?.reviewVerdictRegistration?.forms;
  const nextForms = activeGoal?.nextAction?.eventForms?.recommendedForms;

  const steps = [
    projectGoldenPathStep({
      id: 'goal-init-status',
      label: 'goal init/status',
      status: activeGoal?.runbook?.state === 'available' && routeValueStateReady(goalStatusRoute) ? 'ready' : 'needs-attention',
      source: 'goal-runbook.v1 + goal-progress-ledger.v1',
      route: goalStatusRoute,
      command: `pnpm --silent symphony goal-status --goal ${commandGoalId} --json`,
      detail: activeGoal?.runbook?.state === 'available'
        ? 'Managed runbook and active goal-status route are available.'
        : 'Register or expose the managed runbook before continuing.'
    }),
    projectGoldenPathStep({
      id: 'next-action',
      label: 'goal next',
      status: activeGoal?.nextAction?.state === 'available' ? 'ready' : 'needs-attention',
      source: GOAL_NEXT_ACTION_CONTRACT_NAME,
      route: nextRoute,
      command: `pnpm --silent symphony goal next --goal ${commandGoalId} --json`,
      detail: isNonEmptyString(nextTaskId)
        ? `${nextTaskId} / ${nextRole ?? MISSING_TEXT}`
        : 'No next task is exposed.'
    }),
    projectGoldenPathStep({
      id: 'prompt-handoff',
      label: 'goal prompt',
      status: activeGoal?.promptPreview?.state === 'available' || activeGoal?.reviewWorkspace?.reviewPrompt?.textAvailable?.value === true ? 'ready' : 'needs-attention',
      source: GOAL_PROMPT_PACK_CONTRACT_NAME,
      route: promptRoute,
      command: isNonEmptyString(nextTaskId) && isNonEmptyString(nextRole)
        ? `pnpm --silent symphony goal prompt --goal ${commandGoalId} --task ${nextTaskId} --role ${nextRole} --markdown`
        : `pnpm --silent symphony goal prompt --goal ${commandGoalId} --next --markdown`,
      detail: activeGoal?.promptPreview?.visibleCount?.value > 0
        ? `${activeGoal.promptPreview.visibleCount.value} copy-only prompt(s) available.`
        : 'Prompt must come from goal-prompt-pack.v1 or goal-next-action.v1 copy-only text.'
    }),
    projectGoldenPathStep({
      id: 'worker-event',
      label: 'worker event',
      status: isNonEmptyString(workerEvidenceRef)
        ? 'recorded'
        : nextForms?.items?.some((form) => form.eventType.value?.startsWith('worker.')) === true ? 'actionable' : 'waiting',
      source: 'goal-event-log.v1 + goal-update-plan.v1',
      route: operationsRoute,
      command: isNonEmptyString(nextTaskId)
        ? `pnpm --silent symphony goal update --goal ${commandGoalId} --task ${nextTaskId} --event worker.evidence-recorded --actor <worker-id> --evidence-ref <worker-evidence-ref> --dry-run --json`
        : `pnpm --silent symphony goal update --goal ${commandGoalId} --task <task-id> --event worker.evidence-recorded --actor <worker-id> --evidence-ref <worker-evidence-ref> --dry-run --json`,
      detail: isNonEmptyString(workerEvidenceRef)
        ? workerEvidenceRef
        : 'Workbench can preview and confirm worker events only through controlled goal update.'
    }),
    projectGoldenPathStep({
      id: 'review',
      label: 'review',
      status: isNonEmptyString(reviewEvidenceRef)
        ? 'recorded'
        : reviewForms?.state === 'available' ? 'actionable' : 'waiting',
      source: REVIEW_WORKSPACE_MODEL_NAME,
      route: promptRoute,
      command: isNonEmptyString(activeGoal?.reviewWorkspace?.taskId?.value)
        ? `pnpm --silent symphony goal review --goal ${commandGoalId} --task ${activeGoal.reviewWorkspace.taskId.value} --reviewer <reviewer-id> --verdict approved|needs-revision --evidence-ref <review-evidence-ref> --dry-run --json`
        : `pnpm --silent symphony goal review --goal ${commandGoalId} --task <task-id> --reviewer <reviewer-id> --verdict approved|needs-revision --evidence-ref <review-evidence-ref> --dry-run --json`,
      detail: isNonEmptyString(reviewEvidenceRef)
        ? reviewEvidenceRef
        : 'Reviewer verdict must be registered by a reviewer id that differs from the worker actor.'
    }),
    projectGoldenPathStep({
      id: 'main-verification',
      label: 'main verification',
      status: isNonEmptyString(mainVerificationRef)
        ? 'recorded'
        : activeGoal?.mainVerificationReadiness?.readiness?.canEnterMainVerification?.value === true ? 'ready' : 'waiting',
      source: 'goal-event-log.v1 + main-verification readiness',
      route: goalStatusRoute,
      command: activeGoal?.mainVerificationReadiness?.evidence?.gateCommand?.value
        ?? `pnpm --silent symphony goal gate --goal ${commandGoalId} --task <task-id> --gate main-verification --status passed --verifier <main-verifier-id> --evidence-ref <main-verification-evidence-ref> --dry-run --json`,
      detail: isNonEmptyString(mainVerificationRef)
        ? mainVerificationRef
        : activeGoal?.mainVerificationReadiness?.readiness?.reason?.value
    }),
    projectGoldenPathStep({
      id: 'closeout-gaps',
      label: 'closeout gaps',
      status: releaseReady === true
        ? 'clear'
        : Number(missingCount) > 0 || hasMainVerificationGap ? 'gaps' : activeGoal?.closeoutGaps?.state === 'available' ? 'ready' : 'needs-attention',
      source: GOAL_CLOSEOUT_REPORT_CONTRACT_NAME,
      route: closeoutRoute,
      command: `pnpm --silent symphony goal closeout --goal ${commandGoalId} --json`,
      detail: releaseReady === true
        ? 'Explicit closeout source reports releaseReady=true.'
        : hasMainVerificationGap
          ? 'Main verification is ready but not recorded; closeout remains open.'
          : `${missingCount ?? MISSING_TEXT} closeout gap(s) exposed.`
    })
  ];

  return {
    state: steps.some((step) => step.status.value === 'needs-attention') ? 'partial' : 'available',
    goalId: valueState(goalId),
    taskId: valueState(nextTaskId),
    role: valueState(nextRole),
    sourcePolicy: valueState('goal-runbook.v1 + goal-progress-ledger.v1 + goal-next-action.v1 + goal-prompt-pack.v1 + goal-event-log.v1 + goal-update-plan.v1 + goal-closeout-report.v1'),
    steps: {
      state: steps.length === 0 ? 'empty' : 'available',
      count: valueState(steps.length),
      items: steps
    },
    safety: {
      copyOnlyCommands: valueState(true),
      controlledConfirmOnly: valueState(true),
      browserExecutionAvailable: valueState(false),
      genericShellRunner: valueState(false),
      workerCanApproveOwnTask: valueState(false),
      infersReadinessFromFilename: valueState(false)
    },
    note: 'Golden Path stitches the existing Workbench contracts into one acceptance path. It shows commands and controlled forms, but it does not execute shell commands, self-approve, main-verify, or declare release readiness.'
  };
}

function projectGoldenPathStep({
  id,
  label,
  status,
  source,
  route,
  command,
  detail
}) {
  return {
    id: valueState(id),
    label: valueState(label),
    status: valueState(status),
    source: valueState(source),
    route: valueState(route?.path),
    routeState: valueState(route?.state),
    command: valueState(command),
    detail: valueState(detail)
  };
}

function findProjectedRoute(routeStates, id) {
  return Array.isArray(routeStates)
    ? routeStates.find((route) => route?.id === id) ?? null
    : null;
}

function routeValueStateReady(route) {
  return route?.state === 'ready';
}

export function createGuidedGoalHandoffRoute(handoffIndex) {
  const refs = Array.isArray(handoffIndex?.refs) ? handoffIndex.refs : [];
  const registeredRef = refs.find((candidate) => (
    candidate?.contractName === GUIDED_GOAL_HANDOFF_CONTRACT_NAME
  ));
  const ref = registeredRef?.ref;

  if (!isNonEmptyString(ref)) {
    return null;
  }

  return Object.freeze({
    ...GUIDED_GOAL_HANDOFF_ROUTE_TEMPLATE,
    path: `${HANDOFF_API_BASE}/${encodeURIComponent(ref)}`,
    ref,
    contractName: isNonEmptyString(registeredRef.contractName)
      ? registeredRef.contractName
      : GUIDED_GOAL_HANDOFF_CONTRACT_NAME
  });
}

export function createRunTimelineRoute(runId) {
  if (!isNonEmptyString(runId)) {
    return null;
  }

  return Object.freeze({
    ...RUN_TIMELINE_ROUTE_TEMPLATE,
    path: `${RUN_API_BASE}/${encodeURIComponent(runId)}/${TIMELINE_SEGMENT}`,
    runId
  });
}

export function createGoalProgressRoute(goalId) {
  return createGoalScopedRoute({
    template: GOAL_PROGRESS_ROUTE_TEMPLATE,
    goalId,
    suffix: 'progress',
    id: 'activeGoalProgress',
    label: 'Active Goal Progress'
  });
}

export function createGoalEventsRoute(goalId) {
  return createGoalScopedRoute({
    template: GOAL_EVENTS_ROUTE_TEMPLATE,
    goalId,
    suffix: 'events',
    id: 'activeGoalEvents',
    label: 'Active Goal Events'
  });
}

export function createGoalOperationsRoute(goalId) {
  return createGoalScopedRoute({
    template: GOAL_OPERATIONS_ROUTE_TEMPLATE,
    goalId,
    suffix: 'operations',
    id: 'activeGoalOperations',
    label: 'Active Goal Operations'
  });
}

export function createReleaseBaselineRoute(goalId) {
  return createGoalScopedRoute({
    template: RELEASE_BASELINE_ROUTE_TEMPLATE,
    goalId,
    suffix: 'release-baseline',
    id: 'activeReleaseBaseline',
    label: 'Active Release Baseline'
  });
}

export function createGoalReviewerPromptRoute(goalId, nextAction) {
  const taskId = nextAction?.next?.taskId;

  if (!isSafeGoalRouteSegment(goalId) || !isSafeGoalRouteSegment(taskId) || taskId === 'release') {
    return null;
  }

  return Object.freeze({
    ...GOAL_PROMPT_PACK_ROUTE_TEMPLATE,
    id: 'goalReviewerPromptPack',
    label: 'Goal Reviewer Prompt Pack',
    path: `${GOAL_PROMPT_PACK_ROUTE_TEMPLATE.path.replace('<goal-id>', encodeURIComponent(goalId))}?task=${encodeURIComponent(taskId)}&role=reviewer`,
    goalId,
    taskId,
    role: 'reviewer'
  });
}

export function createControlledImplementationPlanPreviewRoute(goalId, nextAction) {
  const taskId = nextAction?.next?.taskId;
  const role = nextAction?.next?.role;
  const phase = nextAction?.next?.phase;

  if (
    !isSafeGoalRouteSegment(goalId) ||
    !isSafeGoalRouteSegment(taskId) ||
    role !== 'worker' ||
    !['implement', 'implementation', 'revision'].includes(phase) ||
    nextAction?.next?.blocked === true
  ) {
    return null;
  }

  return Object.freeze({
    ...CONTROLLED_IMPLEMENTATION_PLAN_PREVIEW_ROUTE_TEMPLATE,
    path: `${CONTROLLED_IMPLEMENTATION_PLAN_PREVIEW_ROUTE_TEMPLATE.path.replace('<goal-id>', encodeURIComponent(goalId))}?task=${encodeURIComponent(taskId)}`,
    goalId,
    taskId
  });
}

export function createControlledProviderRunnerPreviewRoute(goalId, nextAction, providerId = 'codex-cli') {
  const taskId = nextAction?.next?.taskId;
  const role = nextAction?.next?.role;
  const phase = nextAction?.next?.phase;

  if (
    !isSafeGoalRouteSegment(goalId) ||
    goalId !== V41_CONTROLLED_PROVIDER_RUNNER_GOAL_ID ||
    !isSafeGoalRouteSegment(taskId) ||
    !['worker', 'reviewer'].includes(role) ||
    !['implement', 'implementation', 'revision', 'review'].includes(phase) ||
    nextAction?.next?.blocked === true ||
    !['claude-code-cli', 'codex-cli'].includes(providerId)
  ) {
    return null;
  }

  const query = new URLSearchParams({
    task: taskId,
    role,
    provider: providerId,
    mode: 'reviewed-prompt',
    handoffRef: `goal-prompt/${goalId}/${taskId}/${role}`
  });

  return Object.freeze({
    ...CONTROLLED_PROVIDER_RUNNER_PREVIEW_ROUTE_TEMPLATE,
    path: `${CONTROLLED_PROVIDER_RUNNER_PREVIEW_ROUTE_TEMPLATE.path.replace('<goal-id>', encodeURIComponent(goalId))}?${query.toString()}`,
    goalId,
    taskId,
    role,
    providerId
  });
}

export function createAdoptionInspectRoute(operations) {
  const operation = latestAdoptionPlanFreezeOperationForTask(operations, {
    goalId: operations?.goalId,
    taskId: null
  });
  const adoptionId = operation?.runResult?.adoptionPlanId;

  if (!isSafeGoalRouteSegment(adoptionId)) {
    return null;
  }

  return Object.freeze({
    ...ADOPTION_INSPECT_ROUTE_TEMPLATE,
    path: ADOPTION_INSPECT_ROUTE_TEMPLATE.path.replace('<adoption-id>', encodeURIComponent(adoptionId)),
    adoptionId,
    operationId: operation.operationId
  });
}

export function createSafeArtifactPreviewRoutes(artifactRefs) {
  if (!Array.isArray(artifactRefs)) {
    return [];
  }

  return artifactRefs
    .map((artifact, index) => {
      if (!isSafeArtifactPreviewRoutePath(artifact?.uri)) {
        return null;
      }

      const kind = isNonEmptyString(artifact?.kind) ? artifact.kind : `artifact-${index + 1}`;

      return Object.freeze({
        ...SAFE_ARTIFACT_PREVIEW_ROUTE_TEMPLATE,
        id: `safeArtifactPreview:${index}`,
        label: `Safe Artifact Preview ${kind}`,
        path: artifact.uri,
        artifactRef: artifact?.ref ?? null,
        registeredKind: artifact?.kind ?? null
      });
    })
    .filter((route) => route !== null);
}

function createGoalScopedRoute({ template, goalId, suffix, id, label }) {
  if (!isSafeGoalRouteSegment(goalId)) {
    return null;
  }

  return Object.freeze({
    ...template,
    id,
    label,
    path: ['', 'api', 'goals', encodeURIComponent(goalId), suffix].join('/'),
    goalId
  });
}

function projectArtifactIndex({ result, index }) {
  const entries = Array.isArray(index?.entries)
    ? index.entries
    : index?.indexEntry !== null && typeof index?.indexEntry === 'object' && !Array.isArray(index?.indexEntry)
      ? [index.indexEntry]
      : null;

  return {
    state: result?.ok === true
      ? entries === null ? 'missing' : entries.length === 0 ? 'empty' : 'available'
      : result ? 'unavailable' : 'missing',
    errorEnvelope: result?.errorEnvelope ?? null,
    contractName: valueState(index?.contractName),
    contractVersion: valueState(index?.contractVersion),
    generatedAt: valueState(index?.generatedAt),
    readOnly: valueState(index?.readOnly),
    context: {
      projectId: valueState(index?.context?.projectId),
      goalId: valueState(index?.context?.goalId),
      taskId: valueState(index?.context?.taskId),
      runId: valueState(index?.context?.runId),
      jobId: valueState(index?.context?.jobId),
      canonicalSource: valueState(index?.context?.canonicalSource),
      indexRole: valueState(index?.context?.indexRole),
      stateSource: valueState(index?.context?.stateSource),
      entryCount: valueState(index?.context?.entryCount ?? (entries === null ? undefined : entries.length))
    },
    entries: {
      state: entries === null ? 'missing' : entries.length === 0 ? 'empty' : 'available',
      count: valueState(entries === null ? undefined : entries.length),
      items: entries === null ? [] : entries.map((entry) => ({
        artifactRef: valueState(entry?.artifact_ref),
        kind: valueState(entry?.kind),
        evidenceKind: valueState(entry?.evidence_kind),
        goalId: valueState(entry?.goal_id),
        taskId: valueState(entry?.task_id),
        runId: valueState(entry?.run_id),
        jobId: valueState(entry?.job_id),
        createdAt: valueState(entry?.timestamps?.created_at),
        indexedAt: valueState(entry?.timestamps?.indexed_at)
      }))
    },
    boundaries: {
      readOnly: valueState(index?.boundaries?.readOnly),
      canonicalSource: valueState(index?.boundaries?.canonicalSource),
      localFileOpenAvailable: valueState(index?.boundaries?.localFileOpenAvailable),
      artifactDownloadAvailable: valueState(index?.boundaries?.artifactDownloadAvailable),
      arbitraryPathReadAvailable: valueState(index?.boundaries?.arbitraryPathReadAvailable)
    },
    note: 'Artifact index is a derived cache/search view over ArtifactStore. Desktop displays index readiness only and does not open local files.'
  };
}

export function projectArtifactRefs(artifactRefs, artifactStatus, safeArtifactPreviewResults = []) {
  const status = projectArtifactStatus(artifactStatus);

  if (!Array.isArray(artifactRefs)) {
    return {
      state: 'missing',
      count: null,
      label: MISSING_TEXT,
      status,
      items: [],
      unregistered: textState('未读取 / 不适用'),
      previewRoutes: {
        state: 'missing',
        count: 0,
        label: MISSING_TEXT
      },
      missingPreviewFields: ARTIFACT_PREVIEW_FIELD_GROUPS.map((group) => group.label)
    };
  }

  const items = artifactRefs.map((artifact) => {
    const previewFields = ARTIFACT_PREVIEW_FIELD_GROUPS.map((group) => {
      const exposed = group.fields.some((field) => hasOwn(artifact, field));

      return {
        label: group.label,
        status: exposed ? 'exposed' : 'missing',
        text: exposed ? '已暴露' : MISSING_TEXT
      };
    });

    return {
      kind: valueState(artifact.kind),
      status: valueState(projectArtifactRefStatus({
        artifact,
        artifactStatus
      })),
      path: valueState(artifact.path),
      ref: valueState(artifact.ref),
      uri: valueState(artifact.uri),
      previewFields,
      preview: projectSafeArtifactPreview({
        artifact,
        result: findSafeArtifactPreviewResult({
          artifact,
          results: safeArtifactPreviewResults
        })
      })
    };
  });

  return {
    state: 'available',
    count: artifactRefs.length,
    label: `${artifactRefs.length}`,
    status,
    items,
    unregistered: textState('未读取 / 不适用'),
    previewRoutes: {
      state: safeArtifactPreviewResults.length === 0 ? 'empty' : 'available',
      count: safeArtifactPreviewResults.length,
      label: `${safeArtifactPreviewResults.length}`
    },
    missingPreviewFields: unique(
      items.flatMap((item) => item.previewFields
        .filter((field) => field.status === 'missing')
        .map((field) => field.label))
    )
  };
}

function projectSafeArtifactPreview({ artifact, result }) {
  if (!isSafeArtifactPreviewRoutePath(artifact?.uri)) {
    return {
      state: 'missing',
      route: valueState(artifact?.uri),
      httpStatus: valueState(undefined),
      contractName: valueState(undefined),
      contractVersion: valueState(undefined),
      status: valueState(undefined),
      mime: valueState(undefined),
      displayTitle: valueState(undefined),
      artifactKind: valueState(undefined),
      sourceRunId: valueState(undefined),
      sizeBytes: valueState(undefined),
      maxPreviewBytes: valueState(undefined),
      previewAvailable: valueState(undefined),
      safeToRenderInline: valueState(undefined),
      truncated: valueState(undefined),
      truncationReason: valueState(undefined),
      downloadAvailable: valueState(undefined),
      inline: {
        state: 'missing',
        text: '',
        reason: 'preview uri 未暴露或不在受控 safe preview route 内'
      }
    };
  }

  if (result?.ok !== true) {
    const envelope = projectErrorEnvelope(result?.errorEnvelope);

    return {
      state: 'unavailable',
      route: valueState(artifact.uri),
      httpStatus: valueState(result?.httpStatus),
      contractName: valueState(envelope.contractName.value ?? SAFE_ARTIFACT_PREVIEW_CONTRACT_NAME),
      contractVersion: valueState(envelope.contractVersion.value),
      status: valueState(envelope.code.value),
      mime: valueState(undefined),
      displayTitle: valueState(undefined),
      artifactKind: valueState(undefined),
      sourceRunId: valueState(undefined),
      sizeBytes: valueState(undefined),
      maxPreviewBytes: valueState(undefined),
      previewAvailable: valueState(undefined),
      safeToRenderInline: valueState(undefined),
      truncated: valueState(undefined),
      truncationReason: valueState(undefined),
      downloadAvailable: valueState(undefined),
      inline: {
        state: 'unavailable',
        text: '',
        reason: envelope.message.value ?? result?.message ?? UNAVAILABLE_TEXT
      },
      errorEnvelope: envelope
    };
  }

  const preview = result.data;
  const inlineText = preview?.safeToRenderInline === true && typeof preview?.contentText === 'string'
    ? preview.contentText
    : preview?.safeToRenderInline === true && typeof preview?.previewText === 'string'
      ? preview.previewText
      : null;

  return {
    state: 'available',
    route: valueState(result.route),
    httpStatus: valueState(result.httpStatus),
    contractName: valueState(preview?.contractName),
    contractVersion: valueState(preview?.contractVersion),
    status: valueState(preview?.status ?? (preview?.previewAvailable === true ? 'preview-available' : 'not-previewable')),
    mime: valueState(preview?.mime),
    displayTitle: valueState(preview?.displayTitle),
    artifactKind: valueState(preview?.artifactKind),
    sourceRunId: valueState(preview?.sourceRunId),
    sizeBytes: valueState(preview?.sizeBytes),
    maxPreviewBytes: valueState(preview?.maxPreviewBytes),
    previewAvailable: valueState(preview?.previewAvailable),
    safeToRenderInline: valueState(preview?.safeToRenderInline),
    truncated: valueState(preview?.truncated),
    truncationReason: valueState(preview?.truncationReason),
    downloadAvailable: valueState(preview?.downloadAvailable),
    inline: inlineText === null
      ? {
          state: 'hidden',
          text: '',
          reason: preview?.safeToRenderInline === true
            ? '后端未提供 safe inline text'
            : '后端标记为不可 inline'
        }
      : {
          state: 'available',
          text: inlineText,
          reason: preview?.truncated === true ? '后端已截断 safe inline text' : '后端提供 safe inline text'
        }
  };
}

function projectGoals(goals) {
  const items = Array.isArray(goals?.goals) ? goals.goals : null;

  return {
    state: items === null ? 'missing' : items.length === 0 ? 'empty' : 'available',
    contractName: valueState(goals?.contractName),
    contractVersion: valueState(goals?.contractVersion),
    readOnly: valueState(goals?.readOnly),
    count: valueState(items === null ? undefined : items.length),
    items: items === null ? [] : items.map((goal) => ({
      goalId: valueState(goal?.goalId),
      goalTitle: valueState(goal?.goalTitle),
      baselineTag: valueState(goal?.baseline?.tag),
      taskCount: valueState(goal?.taskCount),
      readOnly: valueState(goal?.readOnly)
    }))
  };
}

function projectWorkbenchRouteContext({ activeGoal, latestRun }) {
  const goalId = firstValue(
    activeGoal?.viewModel?.goalId,
    activeGoal?.runbook?.goalId,
    activeGoal?.nextAction?.goalId,
    activeGoal?.taskQueue?.goalId,
    activeGoal?.reviewWorkspace?.goalId,
    activeGoal?.mainVerificationReadiness?.goalId,
    activeGoal?.closeoutGaps?.goalId
  );
  const taskId = firstValue(
    activeGoal?.nextAction?.next?.taskId,
    activeGoal?.taskQueue?.nextTaskId,
    activeGoal?.reviewWorkspace?.taskId,
    activeGoal?.mainVerificationReadiness?.taskId
  );
  const operationId = firstValue(
    activeGoal?.operationConsole?.latest?.operationId,
    activeGoal?.operationConsole?.latestOperationId
  );
  const activeRole = firstValue(
    activeGoal?.nextAction?.next?.role,
    activeGoal?.taskQueue?.nextRole,
    activeGoal?.reviewWorkspace?.activeNext?.role,
    activeGoal?.mainVerificationReadiness?.readiness?.currentNextRole
  );
  const activePhase = firstValue(
    activeGoal?.nextAction?.next?.phase,
    activeGoal?.taskQueue?.nextPhase,
    activeGoal?.reviewWorkspace?.activeNext?.phase,
    activeGoal?.mainVerificationReadiness?.readiness?.currentNextPhase
  );
  const runId = firstValue(
    latestRun?.runId,
    activeGoal?.reviewWorkspace?.sourceRun?.runId,
    activeGoal?.nextAction?.eventForms?.workerEvidenceHandoff?.sourceRunId
  );
  const evidenceRefs = collectWorkbenchContextEvidenceRefs(activeGoal);

  return {
    state: goalId === undefined && taskId === undefined && operationId === undefined && evidenceRefs.length === 0
      ? 'missing'
      : 'available',
    goalId: valueState(goalId),
    taskId: valueState(taskId),
    activeRole: valueState(activeRole),
    activePhase: valueState(activePhase),
    operationId: valueState(operationId),
    runId: valueState(runId),
    evidenceRefs: {
      state: evidenceRefs.length === 0 ? 'empty' : 'available',
      count: valueState(evidenceRefs.length),
      items: evidenceRefs
    },
    sourcePolicy: valueState('goal-runbook.v1 + goal-next-action.v1 + goal-operation-runs.v1 + goal-event-log.v1 + symphony.console-run'),
    safety: {
      readsEvidenceBodies: valueState(false),
      infersStatusFromEvidenceRef: valueState(false),
      infersApprovalFromRoute: valueState(false),
      browserExecutionAvailable: valueState(false)
    },
    note: 'Route context carries identifiers across Workbench modules. Evidence refs remain identifiers only and do not imply approval, main verification, or release readiness.'
  };
}

function collectWorkbenchContextEvidenceRefs(activeGoal) {
  const refs = [];

  addWorkbenchContextEvidenceRef(refs, activeGoal?.nextAction?.evidenceState?.workerEvidenceRef, {
    source: GOAL_NEXT_ACTION_CONTRACT_NAME,
    label: 'next worker evidence',
    taskId: firstValue(activeGoal?.nextAction?.next?.taskId)
  });
  addWorkbenchContextEvidenceRef(refs, activeGoal?.nextAction?.evidenceState?.reviewEvidenceRef, {
    source: GOAL_NEXT_ACTION_CONTRACT_NAME,
    label: 'next review evidence',
    taskId: firstValue(activeGoal?.nextAction?.next?.taskId)
  });
  addWorkbenchContextEvidenceRef(refs, activeGoal?.nextAction?.evidenceState?.mainVerificationRef, {
    source: GOAL_NEXT_ACTION_CONTRACT_NAME,
    label: 'next main verification evidence',
    taskId: firstValue(activeGoal?.nextAction?.next?.taskId)
  });
  addWorkbenchContextEvidenceRef(refs, activeGoal?.reviewWorkspace?.workerEvidence?.ref, {
    source: REVIEW_WORKSPACE_MODEL_NAME,
    label: 'review worker evidence',
    taskId: firstValue(activeGoal?.reviewWorkspace?.taskId)
  });
  addWorkbenchContextEvidenceRef(refs, activeGoal?.reviewWorkspace?.reviewPrompt?.evidenceFile, {
    source: GOAL_PROMPT_PACK_CONTRACT_NAME,
    label: 'review evidence path',
    taskId: firstValue(activeGoal?.reviewWorkspace?.taskId)
  });
  addWorkbenchContextEvidenceRef(refs, activeGoal?.reviewWorkspace?.sourceRun?.evidenceRef, {
    source: 'symphony.console-run',
    label: 'source run evidence',
    taskId: firstValue(activeGoal?.reviewWorkspace?.taskId)
  });
  addWorkbenchContextEvidenceRef(refs, activeGoal?.nextAction?.eventForms?.workerEvidenceHandoff?.evidenceRef, {
    source: GOAL_OPERATION_RUNS_CONTRACT_NAME,
    label: 'implementation worker evidence handoff',
    taskId: firstValue(activeGoal?.nextAction?.eventForms?.workerEvidenceHandoff?.taskId),
    kind: 'artifact-ref'
  });
  addWorkbenchContextEvidenceRef(refs, activeGoal?.mainVerificationReadiness?.evidence?.path, {
    source: 'main-verification readiness',
    label: 'main verification evidence path',
    taskId: firstValue(activeGoal?.mainVerificationReadiness?.taskId)
  });
  addWorkbenchContextEvidenceRef(refs, activeGoal?.mainVerificationReadiness?.evidence?.existingMainVerificationRef, {
    source: GOAL_PROGRESS_LEDGER_CONTRACT_NAME,
    label: 'existing main verification evidence',
    taskId: firstValue(activeGoal?.mainVerificationReadiness?.taskId)
  });

  for (const task of activeGoal?.taskQueue?.items ?? []) {
    addWorkbenchContextEvidenceRef(refs, task?.workerEvidenceRef, {
      source: GOAL_PROGRESS_LEDGER_CONTRACT_NAME,
      label: 'task worker evidence',
      taskId: firstValue(task?.taskId)
    });
    addWorkbenchContextEvidenceRef(refs, task?.reviewEvidenceRef, {
      source: GOAL_PROGRESS_LEDGER_CONTRACT_NAME,
      label: 'task review evidence',
      taskId: firstValue(task?.taskId)
    });
    addWorkbenchContextEvidenceRef(refs, task?.mainVerificationRef, {
      source: GOAL_PROGRESS_LEDGER_CONTRACT_NAME,
      label: 'task main verification evidence',
      taskId: firstValue(task?.taskId)
    });
  }

  for (const candidate of activeGoal?.nextAction?.eventForms?.evidenceRefHelper?.recentRefs?.items ?? []) {
    addWorkbenchContextEvidenceRef(refs, candidate?.ref, {
      source: firstValue(candidate?.source) ?? EVIDENCE_REF_HELPER_NAME,
      label: firstValue(candidate?.label),
      taskId: firstValue(candidate?.taskId),
      kind: firstValue(candidate?.kind)
    });
  }

  return refs.slice(0, 10);
}

function addWorkbenchContextEvidenceRef(refs, refState, metadata = {}) {
  const ref = firstValue(refState);

  if (!isNonEmptyString(ref) || refs.some((item) => item.ref.value === ref)) {
    return;
  }

  refs.push({
    ref: valueState(ref),
    kind: valueState(metadata.kind ?? evidenceRefKindForInput(ref)),
    label: valueState(metadata.label),
    source: valueState(metadata.source),
    taskId: valueState(metadata.taskId)
  });
}

function projectActiveGoalControl({
  statusResult,
  status,
  readiness,
  runbookResult,
  runbook,
  nextActionResult,
  nextAction,
  promptPackResult,
  promptPack,
  reviewerPromptPackResult,
  reviewerPromptPack,
  closeoutResult,
  closeout,
  releaseBaselineResult,
  releaseBaseline,
  activeLedgerResult,
  activeLedger,
  activeEventLogResult,
  activeEventLog,
  activeOperationsResult,
  activeOperations,
  adoptionInspectResult,
  adoptionInspect,
  latestRun
}) {
  const ledger = activeLedger?.goalId === runbook?.goalId ? activeLedger : null;
  const eventLog = activeEventLog?.goalId === runbook?.goalId ? activeEventLog : null;
  const goalStatusLedger = ledger ?? (status?.goalId === runbook?.goalId ? status : null);
  const scopedOperations = activeOperations?.goalId === runbook?.goalId ? activeOperations : null;
  const mainVerificationReadiness = projectMainVerificationReadiness({
    runbook,
    ledger: goalStatusLedger,
    eventLog,
    operations: scopedOperations,
    adoptionInspectResult,
    adoptionInspect,
    nextAction,
    closeout,
    latestRun
  });
  const mainVerificationEvidenceDraft = projectMainVerificationEvidenceDraftWriter({
    runbook,
    ledger: goalStatusLedger,
    eventLog,
    operations: scopedOperations,
    adoptionInspectResult,
    adoptionInspect,
    nextAction,
    latestRun
  });

  return {
    viewModel: projectActiveGoalViewModel({
      statusResult: ledger === null ? statusResult : activeLedgerResult,
      status: goalStatusLedger,
      runbookResult,
      runbook,
      nextActionResult,
      nextAction,
      promptPackResult,
      promptPack,
      closeoutResult,
      closeout
    }),
    runbook: projectGoalRunbook({
      result: runbookResult,
      runbook,
      ledger: goalStatusLedger,
      eventLog,
      ledgerResult: activeLedgerResult,
      eventLogResult: activeEventLogResult
    }),
    taskQueue: projectActiveGoalTaskQueue({
      runbook,
      ledger: goalStatusLedger,
      eventLog,
      nextAction
    }),
    mainVerificationReadiness,
    mainVerificationEvidenceDraft,
    mainVerificationGateRegistration: projectMainVerificationGateRegistration({
      runbook,
      ledger: goalStatusLedger,
      eventLog,
      nextAction,
      latestRun,
      readiness: mainVerificationReadiness,
      evidenceDraft: mainVerificationEvidenceDraft
    }),
    reviewWorkspace: projectReviewWorkspace({
      runbook,
      ledger: goalStatusLedger,
      eventLog,
      nextAction,
      promptPack,
      reviewerPromptPack,
      latestRun
    }),
    subagentHandoffBoard: projectSubagentHandoffBoard({
      progressResult: ledger === null ? statusResult : activeLedgerResult,
      progress: goalStatusLedger,
      eventsResult: activeEventLogResult,
      eventLog,
      nextResult: nextActionResult,
      nextAction,
      closeoutResult,
      closeout
    }),
    nextAction: projectGoalNextAction({
      result: nextActionResult,
      nextAction,
      runbook,
      ledger: goalStatusLedger,
      eventLog,
      latestRun,
      operations: scopedOperations
    }),
    promptPreview: projectGoalPromptPreview({
      result: promptPackResult,
      promptPack,
      nextAction
    }),
    closeoutGaps: projectGoalCloseoutGaps({
      result: closeoutResult,
      closeout,
      releaseBaselineResult,
      releaseBaseline,
      runbook,
      ledger: goalStatusLedger,
      eventLog,
      latestRun,
      readiness
    }),
    releaseBaseline: projectReleaseBaselineResolver({
      result: releaseBaselineResult,
      releaseBaseline,
      runbook,
      nextAction
    }),
    operationConsole: projectGoalOperationConsole({
      result: activeOperationsResult,
      operations: activeOperations?.goalId === runbook?.goalId ? activeOperations : null,
      nextAction
    })
  };
}

function projectActiveTaskImplementationEligibility({
  statusResult,
  ledger,
  nextActionResult,
  nextAction,
  runbookResult,
  runbook,
  eventLogResult,
  eventLog,
  operationsResult,
  operations,
  routeContext
}) {
  const routeGoalId = firstValue(routeContext?.goalId);
  const routeTaskId = firstValue(routeContext?.taskId);
  const goalId = firstNonEmptyString(runbook?.goalId, nextAction?.goalId, ledger?.goalId, eventLog?.goalId, routeGoalId);
  const taskId = firstNonEmptyString(nextAction?.next?.taskId, routeTaskId);
  const runbookTasks = Array.isArray(runbook?.tasks) ? runbook.tasks : [];
  const task = runbookTasks.find((candidate) => candidate?.taskId === taskId) ?? null;
  const ledgerTask = findLedgerTask(ledger, taskId);
  const events = Array.isArray(eventLog?.events) ? eventLog.events : [];
  const taskEvents = events.filter((event) => event?.goalId === goalId && event?.taskId === taskId);
  const latestWorkerEvidence = latestEventOfTypes(taskEvents, ['worker.evidence-recorded']);
  const latestWorkerStarted = latestEventOfTypes(taskEvents, ['worker.started']);
  const latestReview = latestEventOfTypes(taskEvents, ['reviewer.approved', 'reviewer.needs-revision']);
  const latestMainVerification = latestEventOfTypes(taskEvents, ['main.verification-passed', 'main.verification-failed']);
  const latestBlockerOpened = latestEventOfTypes(taskEvents, ['blocker.opened']);
  const latestBlockerResolved = latestEventOfTypes(taskEvents, ['blocker.resolved']);
  const hasOpenBlocker = latestBlockerOpened !== null && !goalEventIsAfter(latestBlockerResolved, latestBlockerOpened);
  const routeGoalMatches = !isNonEmptyString(routeGoalId) || routeGoalId === goalId;
  const routeTaskMatches = !isNonEmptyString(routeTaskId) || routeTaskId === taskId;
  const nextRole = nextAction?.next?.role;
  const nextPhase = nextAction?.next?.phase;
  const nextStatus = nextAction?.status;
  const nextBlocked = nextAction?.next?.blocked === true;
  const nextActionAllowsImplementation = nextStatus === 'action-required'
    && nextRole === 'worker'
    && ['implement', 'implementation', 'revision'].includes(nextPhase)
    && nextBlocked !== true;
  const requiredContractsReady = runbookResult?.ok === true
    && statusResult?.ok === true
    && nextActionResult?.ok === true
    && eventLogResult?.ok === true;
  const hasScopedEventLog = eventLog?.goalId === goalId && Array.isArray(eventLog?.events);
  const hasScopedGoalStatus = ledger?.goalId === goalId && ledgerTask !== null;
  const hasScopedRunbookTask = runbook?.goalId === goalId && task !== null;
  const routeContextMatches = routeGoalMatches && routeTaskMatches;
  const canEnterControlledImplementation = requiredContractsReady
    && hasScopedRunbookTask
    && hasScopedGoalStatus
    && hasScopedEventLog
    && routeContextMatches
    && nextActionAllowsImplementation
    && !hasOpenBlocker;
  const blockingReasons = [];

  if (!requiredContractsReady) {
    blockingReasons.push('required goal contracts are not all ready');
  }
  if (!hasScopedRunbookTask) {
    blockingReasons.push('active task is not present in goal-runbook.v1');
  }
  if (!hasScopedGoalStatus) {
    blockingReasons.push('active task is not present in goal-status task ledger');
  }
  if (!hasScopedEventLog) {
    blockingReasons.push('scoped goal-event-log.v1 is not available');
  }
  if (!routeContextMatches) {
    blockingReasons.push('Workbench route context does not match the active goal/task');
  }
  if (!nextActionAllowsImplementation) {
    blockingReasons.push('goal-next-action.v1 does not hand this task to the worker implementation role');
  }
  if (hasOpenBlocker) {
    blockingReasons.push('latest explicit blocker.opened event is not resolved');
  }

  const latestOperation = latestGoalOperationForTask(operations, taskId);
  const state = !requiredContractsReady || !hasScopedRunbookTask || !hasScopedGoalStatus || !hasScopedEventLog
    ? 'unavailable'
    : canEnterControlledImplementation ? 'eligible' : hasOpenBlocker ? 'blocked' : 'waiting';

  return {
    state,
    modelName: valueState(ACTIVE_TASK_IMPLEMENTATION_ELIGIBILITY_MODEL_NAME),
    sourcePolicy: valueState('goal-status command output + goal-next-action.v1 + goal-runbook.v1 + goal-event-log.v1 explicit events + Workbench route context'),
    goalId: valueState(goalId),
    taskId: valueState(taskId),
    title: valueState(task?.title ?? ledgerTask?.title),
    canEnterControlledImplementation: valueState(canEnterControlledImplementation),
    decision: {
      status: valueState(canEnterControlledImplementation ? 'eligible' : state),
      reason: valueState(canEnterControlledImplementation
        ? 'goal next assigns the active task to worker implementation and no unresolved blocker event is recorded'
        : blockingReasons.join('; ')),
      currentNextRole: valueState(nextRole),
      currentNextPhase: valueState(nextPhase),
      currentNextStatus: valueState(nextStatus),
      currentNextBlocked: valueState(nextBlocked),
      allowedImplementationPhases: arrayTextState(['implement', 'implementation', 'revision']),
      blockingReasons: projectTextItems(blockingReasons)
    },
    routeContext: {
      goalId: valueState(routeGoalId),
      taskId: valueState(routeTaskId),
      activeRole: valueState(firstValue(routeContext?.activeRole)),
      activePhase: valueState(firstValue(routeContext?.activePhase)),
      operationId: valueState(firstValue(routeContext?.operationId)),
      goalMatches: valueState(routeGoalMatches),
      taskMatches: valueState(routeTaskMatches)
    },
    requiredContracts: {
      goalStatusRoute: valueState(routeStateFromResult(statusResult)),
      goalNextRoute: valueState(routeStateFromResult(nextActionResult)),
      runbookRoute: valueState(routeStateFromResult(runbookResult)),
      eventsRoute: valueState(routeStateFromResult(eventLogResult)),
      operationsRoute: valueState(routeStateFromResult(operationsResult)),
      goalStatusTaskPresent: valueState(hasScopedGoalStatus),
      runbookTaskPresent: valueState(hasScopedRunbookTask),
      scopedEventLogPresent: valueState(hasScopedEventLog)
    },
    goalStatusTask: {
      status: valueState(ledgerTask?.status),
      statusSource: valueState(ledgerTask?.statusSource),
      eventBacked: valueState(isGoalEventStatusSource(ledgerTask?.statusSource)),
      workerEvidenceRef: valueState(ledgerTask?.workerEvidenceRef),
      reviewEvidenceRef: valueState(ledgerTask?.reviewEvidenceRef),
      reviewVerdict: valueState(ledgerTask?.reviewVerdict),
      mainVerificationRef: valueState(ledgerTask?.mainVerificationRef)
    },
    explicitEvents: {
      count: valueState(taskEvents.length),
      latestWorkerStarted: projectEligibilityEventState(latestWorkerStarted),
      latestWorkerEvidence: projectEligibilityEventState(latestWorkerEvidence),
      latestReview: projectEligibilityEventState(latestReview),
      latestMainVerification: projectEligibilityEventState(latestMainVerification),
      latestBlockerOpened: projectEligibilityEventState(latestBlockerOpened),
      latestBlockerResolved: projectEligibilityEventState(latestBlockerResolved),
      hasOpenBlocker: valueState(hasOpenBlocker)
    },
    runbookTask: {
      branch: valueState(task?.branch),
      roleOrder: arrayTextState(task?.roleOrder),
      expectedWorker: expectedEvidenceState(task?.expectedEvidence?.worker),
      acceptance: projectTextItems(task?.acceptance),
      copyOnlyCommands: projectTextItems(task?.copyOnlyCommands)
    },
    nextAction: {
      reason: valueState(nextAction?.reason ?? nextAction?.next?.reason),
      registerWith: valueState(nextAction?.afterCompletion?.registerWith),
      allowedEvents: arrayTextState(nextAction?.afterCompletion?.allowedEvents),
      copyOnlyPromptAvailable: valueState(nextAction?.copyOnlyPrompt?.available === true),
      workerEvidenceRef: valueState(nextAction?.evidenceState?.workerEvidenceRef)
    },
    operationContext: {
      routeState: valueState(routeStateFromResult(operationsResult)),
      latestOperationId: valueState(latestOperation?.operationId ?? operations?.latestOperationId),
      latestStatus: valueState(latestOperation?.status),
      latestSource: valueState(latestOperation?.source),
      latestCommandKind: valueState(latestOperation?.commandKind),
      latestPlanHash: valueState(latestOperation?.planHash)
    },
    recoverySteps: projectTextItems(canEnterControlledImplementation ? [
      'Open the controlled implementation plan preview for the same active goal/task context.',
      'If preview fields are missing, refresh goal-status, goal next, runbook, events, and operations routes before starting implementation.'
    ] : [
      'Run goal-status and goal next for the active goal.',
      'Inspect goal-event-log.v1 for blocker, worker evidence, review, or main verification events.',
      'Do not use branch names, filenames, prompt text, task titles, or frontend state to override this decision.'
    ]),
    safety: {
      readOnly: valueState(true),
      copyOnly: valueState(true),
      workbenchWriteAvailable: valueState(false),
      controlledImplementationStartsRun: valueState(false),
      browserExecutionAvailable: valueState(false),
      modelInvocationAvailable: valueState(false),
      genericShellRunner: valueState(false),
      approvalReadinessSource: valueState('explicit goal events only'),
      unsupportedInferenceSources: arrayTextState(['branch', 'filename', 'commit-message', 'prompt-text', 'task-title', 'frontend-heuristic'])
    },
    note: 'ActiveTaskImplementationEligibility only answers whether the active task may proceed to the controlled implementation preview path. It does not execute symphony do, invoke a model, open files, merge, push, tag, approve review, or declare main verification.'
  };
}

function projectEligibilityEventState(event) {
  return {
    eventId: valueState(event?.eventId),
    eventType: valueState(event?.eventType),
    sequence: valueState(event?.sequence),
    actor: valueState(goalEventActorText(event?.actor)),
    evidenceRef: valueState(firstGoalEvidenceRef(event)),
    recordedAt: valueState(event?.recordedAt),
    source: valueState(event === null || event === undefined ? undefined : GOAL_EVENT_LOG_CONTRACT_NAME)
  };
}

function latestGoalOperationForTask(operations, taskId) {
  if (!Array.isArray(operations?.runs) || !isNonEmptyString(taskId)) {
    return null;
  }

  for (let index = operations.runs.length - 1; index >= 0; index -= 1) {
    if (operations.runs[index]?.taskId === taskId) {
      return operations.runs[index];
    }
  }

  return null;
}

function projectControlledImplementationPlanPreview({ result, preview, eligibility, operations }) {
  const routeState = routeStateFromResult(result);
  const runResultBridge = projectImplementationRunResultBridge({
    operations,
    goalId: firstValue(eligibility?.goalId),
    taskId: firstValue(eligibility?.taskId)
  });

  if (result?.ok !== true || preview?.contractName !== CONTROLLED_IMPLEMENTATION_PLAN_PREVIEW_CONTRACT_NAME) {
    return {
      state: 'unavailable',
      modelName: valueState('ControlledImplementationPlanPreview'),
      routeState: valueState(routeState),
      goalId: valueState(firstValue(eligibility?.goalId)),
      taskId: valueState(firstValue(eligibility?.taskId)),
      canPreview: valueState(false),
      reason: valueState(result?.message ?? 'controlled implementation plan preview route is unavailable'),
      plan: {
        planId: valueState(null),
        planHash: valueState(null),
        status: valueState(null)
      },
      safety: {
        readOnly: valueState(true),
        workbenchWriteAvailable: valueState(false),
        browserExecutionAvailable: valueState(false),
        modelInvocationAvailable: valueState(false),
        genericShellRunner: valueState(false),
        implementationRunStarted: valueState(false)
      },
      runResultBridge,
      note: 'Controlled implementation plan preview is unavailable until the backend returns controlled-implementation-plan-preview.v1 for the active goal/task.'
    };
  }

  const scopedRunResultBridge = projectImplementationRunResultBridge({
    operations,
    goalId: preview.goalId,
    taskId: preview.taskId
  });

  return {
    state: 'preview-ready',
    modelName: valueState('ControlledImplementationPlanPreview'),
    routeState: valueState(routeState),
    goalId: valueState(preview.goalId),
    taskId: valueState(preview.taskId),
    canPreview: valueState(true),
    reason: valueState(preview.allowedPreview?.nextAction?.reason),
    plan: {
      planId: valueState(preview.planId),
      planHash: valueState(preview.planHash),
      mode: valueState(preview.mode),
      status: valueState(preview.status),
      commandName: valueState(preview.command?.name),
      previewOf: valueState(preview.command?.previewOf),
      confirmRequired: valueState(preview.command?.confirmRequired === true)
    },
    writeSemantics: {
      safetyMode: valueState(preview.writeSemantics?.safetyMode),
      writeBoundary: valueState(preview.writeSemantics?.writeBoundary),
      mainWorktreeWrites: valueState(preview.writeSemantics?.mainWorktreeWrites === true),
      workspaceWrites: valueState(preview.writeSemantics?.workspaceWrites === true),
      runtimeWrites: valueState(preview.writeSemantics?.runtimeWrites === true),
      destructiveWrites: valueState(preview.writeSemantics?.destructiveWrites === true)
    },
    activeTaskConstraints: {
      title: valueState(preview.allowedPreview?.task?.title),
      branch: valueState(preview.allowedPreview?.task?.branch),
      roleOrder: arrayTextState(preview.allowedPreview?.task?.roleOrder),
      acceptance: projectTextItems(preview.allowedPreview?.task?.acceptance),
      expectedWorkerEvidence: valueState(preview.allowedPreview?.task?.expectedWorkerEvidence),
      copyOnlyCommands: projectTextItems(preview.allowedPreview?.task?.copyOnlyCommands)
    },
    workerPrompt: {
      available: valueState(preview.allowedPreview?.workerPrompt?.available === true),
      copyOnly: valueState(preview.allowedPreview?.workerPrompt?.copyOnly === true),
      format: valueState(preview.allowedPreview?.workerPrompt?.format),
      role: valueState(preview.allowedPreview?.workerPrompt?.role),
      text: valueState(preview.allowedPreview?.workerPrompt?.text)
    },
    evidenceRefs: {
      currentWorkerEvidenceRef: valueState(preview.allowedPreview?.evidenceRefs?.currentWorkerEvidenceRef),
      currentReviewEvidenceRef: valueState(preview.allowedPreview?.evidenceRefs?.currentReviewEvidenceRef),
      currentMainVerificationRef: valueState(preview.allowedPreview?.evidenceRefs?.currentMainVerificationRef),
      explicitEventEvidenceRefs: projectEvidenceRefItems(preview.allowedPreview?.evidenceRefs?.explicitEventEvidenceRefs)
    },
    confirm: {
      available: valueState(preview.confirm?.available === true),
      enabledByTask: valueState(preview.confirm?.enabledByTask),
      requiredContext: arrayTextState(preview.confirm?.requiredContext),
      copyOnlyCommand: valueState(preview.confirm?.copyOnlyCommand),
      endpoint: {
        method: valueState(preview.confirm?.endpoint?.method),
        route: valueState(preview.confirm?.endpoint?.route),
        allowedBodyFields: arrayTextState(preview.confirm?.endpoint?.allowedBodyFields),
        requiresSameGoalTaskContext: valueState(preview.confirm?.endpoint?.requiresSameGoalTaskContext === true),
        confirmUsesPlanHash: valueState(preview.confirm?.endpoint?.confirmUsesPlanHash === true)
      }
    },
    endpoint: {
      method: valueState(preview.previewEndpoint?.method),
      route: valueState(preview.previewEndpoint?.route),
      allowedQueryFields: arrayTextState(preview.previewEndpoint?.allowedQueryFields),
      rejectsPromptInput: valueState(preview.previewEndpoint?.rejectsPromptInput === true),
      rejectsPlanHashInput: valueState(preview.previewEndpoint?.rejectsPlanHashInput === true),
      rejectsConfirmInput: valueState(preview.previewEndpoint?.rejectsConfirmInput === true),
      writesInDryRun: valueState(preview.previewEndpoint?.writesInDryRun === true),
      genericShellRunner: valueState(preview.previewEndpoint?.genericShellRunner === true)
    },
    safety: {
      readOnly: valueState(preview.safety?.readOnly === true),
      copyOnly: valueState(preview.safety?.copyOnly === true),
      workbenchWriteAvailable: valueState(preview.safety?.workbenchWriteAvailable === true),
      browserExecutionAvailable: valueState(preview.safety?.browserExecutionAvailable === true),
      modelInvocationAvailable: valueState(preview.safety?.modelInvocationAvailable === true),
      genericShellRunner: valueState(preview.safety?.genericShellRunner === true),
      arbitraryPathReadAvailable: valueState(preview.safety?.arbitraryPathReadAvailable === true),
      implementationRunStarted: valueState(preview.safety?.implementationRunStarted === true),
      approvalReadinessSource: valueState(preview.safety?.approvalReadinessSource),
      unsupportedInferenceSources: arrayTextState(preview.safety?.unsupportedInferenceSources)
    },
    runResultBridge: scopedRunResultBridge,
    note: 'This preview is generated from active goal/task contracts and the worker prompt. It does not execute symphony do, call a model, open files, merge, push, tag, approve review, or declare readiness.'
  };
}

function projectControlledProviderRunnerPreview({ result, preview, operations, activeGoal }) {
  const routeState = routeStateFromResult(result);
  const operation = latestProviderRunnerOperationForTask(operations, {
    goalId: preview?.goalId ?? firstValue(activeGoal?.taskQueue?.goalId),
    taskId: preview?.taskId ?? firstValue(activeGoal?.nextAction?.taskId)
  });
  const artifactRefs = Array.isArray(preview?.expectedArtifacts) ? preview.expectedArtifacts : [];

  if (result?.ok !== true || preview?.contractName !== CONTROLLED_PROVIDER_RUNNER_PLAN_PREVIEW_CONTRACT_NAME) {
    return {
      state: 'unavailable',
      modelName: valueState('ControlledProviderRunnerPreview'),
      routeState: valueState(routeState),
      goalId: valueState(firstValue(activeGoal?.taskQueue?.goalId)),
      taskId: valueState(firstValue(activeGoal?.nextAction?.taskId)),
      providerId: valueState(null),
      canPreview: valueState(false),
      reason: valueState(result?.message ?? 'controlled provider runner preview route is unavailable'),
      plan: {
        planId: valueState(null),
        planHash: valueState(null),
        status: valueState(null)
      },
      safety: {
        backendOwnedCommandTemplate: valueState(true),
        planHashRequired: valueState(true),
        arbitraryCommandInputAvailable: valueState(false),
        rendererProviderInvocationAvailable: valueState(false),
        genericShellRunnerAvailable: valueState(false),
        reviewerApprovalInferenceAvailable: valueState(false),
        mainVerificationInferenceAvailable: valueState(false),
        releaseReadinessInferenceAvailable: valueState(false)
      },
      operationStatus: projectControlledProviderRunnerOperation(operation),
      note: 'Controlled provider runner preview is unavailable until the backend returns controlled-provider-runner-plan-preview.v1 for the active goal/task.'
    };
  }

  return {
    state: 'preview-ready',
    modelName: valueState('ControlledProviderRunnerPreview'),
    routeState: valueState(routeState),
    goalId: valueState(preview.goalId),
    taskId: valueState(preview.taskId),
    role: valueState(preview.role),
    providerId: valueState(preview.providerId),
    mode: valueState(preview.mode),
    canPreview: valueState(true),
    plan: {
      planId: valueState(preview.planId),
      planHash: valueState(preview.planHash),
      status: valueState(preview.status),
      commandTemplateId: valueState(preview.commandTemplateId),
      adapterId: valueState(preview.adapterId)
    },
    reviewedContext: {
      promptRef: valueState(preview.reviewedContext?.promptRef),
      evidenceRef: valueState(preview.reviewedContext?.evidenceRef),
      handoffRef: valueState(preview.reviewedContext?.handoffRef),
      cwdPolicy: valueState(preview.reviewedContext?.execution?.cwdPolicy),
      cwdRef: valueState(preview.reviewedContext?.execution?.cwdRef),
      timeoutMs: valueState(preview.reviewedContext?.execution?.timeoutMs),
      failureLayers: arrayTextState(preview.reviewedContext?.failureLayers)
    },
    expectedArtifacts: {
      state: artifactRefs.length > 0 ? 'available' : 'missing',
      count: valueState(artifactRefs.length),
      items: artifactRefs.map((artifact) => ({
        kind: valueState(artifact?.kind),
        ref: valueState(artifact?.ref),
        title: valueState(artifact?.title),
        status: valueState(artifact?.status)
      }))
    },
    confirm: {
      available: valueState(preview.confirm?.available === true),
      endpoint: {
        method: valueState(preview.confirm?.endpoint?.method),
        route: valueState(preview.confirm?.endpoint?.route),
        allowedBodyFields: arrayTextState(preview.confirm?.endpoint?.allowedBodyFields),
        requiresSamePreviewContext: valueState(preview.confirm?.endpoint?.requiresSamePreviewContext === true),
        confirmUsesPlanHash: valueState(preview.confirm?.endpoint?.confirmUsesPlanHash === true)
      }
    },
    endpoint: {
      method: valueState(preview.previewEndpoint?.method),
      route: valueState(preview.previewEndpoint?.route),
      allowedQueryFields: arrayTextState(preview.previewEndpoint?.allowedQueryFields),
      rejectsArbitraryCommand: valueState(preview.previewEndpoint?.rejectsArbitraryCommand === true),
      rejectsProviderBinary: valueState(preview.previewEndpoint?.rejectsProviderBinary === true),
      rejectsCwdPath: valueState(preview.previewEndpoint?.rejectsCwdPath === true),
      rejectsPromptText: valueState(preview.previewEndpoint?.rejectsPromptText === true),
      rejectsSecrets: valueState(preview.previewEndpoint?.rejectsSecrets === true),
      rejectsInactiveProviders: valueState(preview.previewEndpoint?.rejectsInactiveProviders === true),
      writesInPreview: valueState(preview.previewEndpoint?.writesInPreview === true)
    },
    safety: {
      backendOwnedCommandTemplate: valueState(preview.safety?.backendOwnedCommandTemplate === true),
      planHashRequired: valueState(preview.safety?.planHashRequired === true),
      arbitraryCommandInputAvailable: valueState(preview.safety?.arbitraryCommandInputAvailable === true),
      providerBinaryInputAvailable: valueState(preview.safety?.providerBinaryInputAvailable === true),
      arbitraryCwdInputAvailable: valueState(preview.safety?.arbitraryCwdInputAvailable === true),
      promptTextInputAvailable: valueState(preview.safety?.promptTextInputAvailable === true),
      secretInputAvailable: valueState(preview.safety?.secretInputAvailable === true),
      rendererProviderInvocationAvailable: valueState(preview.safety?.rendererProviderInvocationAvailable === true),
      genericShellRunnerAvailable: valueState(preview.safety?.genericShellRunnerAvailable === true),
      reviewerApprovalInferenceAvailable: valueState(preview.safety?.reviewerApprovalInferenceAvailable === true),
      mainVerificationInferenceAvailable: valueState(preview.safety?.mainVerificationInferenceAvailable === true),
      releaseReadinessInferenceAvailable: valueState(preview.safety?.releaseReadinessInferenceAvailable === true)
    },
    operationStatus: projectControlledProviderRunnerOperation(operation),
    note: 'Controlled provider runner preview is built from backend contracts and plan hash context. Workbench displays status and refs only; it does not accept command text, invoke provider binaries directly, approve review, pass main verification, or declare release readiness.'
  };
}

function projectControlledProviderRunnerOperation(operation) {
  const runResult = operation?.runResult ?? {};
  const verifierSummary = operation?.verifierSummary ?? {};

  return {
    state: operation === null ? 'waiting-for-confirm' : operation.status ?? 'available',
    sourceContract: valueState(GOAL_OPERATION_RUNS_CONTRACT_NAME),
    operationId: valueState(operation?.operationId),
    commandKind: valueState(operation?.commandKind),
    status: valueState(operation?.status),
    providerId: valueState(verifierSummary.providerId ?? runResult.providerId),
    commandTemplateId: valueState(verifierSummary.commandTemplateId ?? runResult.commandTemplateId),
    redactionStatus: valueState(verifierSummary.redactionStatus ?? runResult.redaction?.status),
    failureLayer: valueState(verifierSummary.failureLayer ?? runResult.failureLayer),
    reviewerApproved: valueState(verifierSummary.reviewerApproved === true),
    mainVerified: valueState(verifierSummary.mainVerified === true),
    releaseReady: valueState(verifierSummary.releaseReady === true),
    artifactRefs: {
      count: valueState(Array.isArray(operation?.artifactRefs) ? operation.artifactRefs.length : 0),
      items: (Array.isArray(operation?.artifactRefs) ? operation.artifactRefs : []).map((artifact) => ({
        kind: valueState(artifact?.kind),
        ref: valueState(artifact?.ref),
        status: valueState(artifact?.status)
      }))
    }
  };
}

function projectImplementationRunResultBridge({ operations, goalId, taskId }) {
  const operation = latestImplementationOperationForTask(operations, {
    goalId,
    taskId
  });
  const runResult = operation?.runResult ?? null;
  const artifactRefs = Array.isArray(operation?.artifactRefs)
    ? operation.artifactRefs
    : Array.isArray(runResult?.artifactRefs) ? runResult.artifactRefs : [];
  const changedFiles = Array.isArray(runResult?.changedFiles) ? runResult.changedFiles : [];
  const verifierSummary = operation?.verifierSummary ?? {};
  const state = operation === null
    ? 'waiting-for-confirmed-run'
    : operation.status === 'failed' || runResult?.status === 'failed' || runResult?.verifierStatus === 'failed'
      ? 'failed'
      : 'available';

  return {
    state,
    sourceContract: valueState(GOAL_OPERATION_RUNS_CONTRACT_NAME),
    operationId: valueState(operation?.operationId),
    operationStatus: valueState(operation?.status),
    operationSource: valueState(operation?.source),
    commandName: valueState(operation?.commandName),
    commandKind: valueState(operation?.commandKind),
    planHash: valueState(operation?.planHash),
    run: {
      runId: valueState(runResult?.runId),
      plannedRunId: valueState(runResult?.plannedRunId),
      executionPlanId: valueState(runResult?.executionPlanId),
      status: valueState(runResult?.status),
      exitCode: valueState(runResult?.exitCode),
      verifierStatus: valueState(runResult?.verifierStatus),
      writeBoundary: valueState(runResult?.writeBoundary),
      mainWorktreeWrites: valueState(runResult?.mainWorktreeWrites),
      workspaceWrites: valueState(runResult?.workspaceWrites),
      sourceWorkspacePath: valueState(runResult?.sourceWorkspacePath),
      sourceWorkspaceManifestPath: valueState(runResult?.sourceWorkspaceManifestPath),
      evidenceArtifactPath: valueState(runResult?.evidenceArtifactPath),
      failureReason: valueState(operation?.failureReason)
    },
    verifierSummary: {
      status: valueState(verifierSummary.status),
      runStatus: valueState(verifierSummary.runStatus),
      passed: valueState(verifierSummary.passed === true),
      changedFileCount: valueState(verifierSummary.changedFileCount),
      artifactCount: valueState(verifierSummary.artifactCount),
      failureReason: valueState(verifierSummary.failureReason)
    },
    artifactRefs: {
      count: valueState(artifactRefs.length),
      text: textState(artifactRefs.length === 0 ? MISSING_TEXT : artifactRefs.map((artifact) => artifact.kind ?? artifact.path ?? artifact.ref).join('、')),
      items: artifactRefs.map((artifact) => ({
        kind: valueState(artifact?.kind),
        path: valueState(artifact?.path),
        ref: valueState(artifact?.ref),
        uri: valueState(artifact?.uri),
        status: valueState(artifact?.status)
      }))
    },
    changedFiles: projectTextItems(changedFiles),
    outputSummary: {
      stdout: textState(operation?.output?.stdout ?? MISSING_TEXT),
      stderr: textState(operation?.output?.stderr ?? ''),
      exitCode: valueState(operation?.output?.exitCode)
    },
    note: 'Run result bridge reads confirmed implementation output from goal-operation-runs.v1. It does not inspect arbitrary paths, start agents, approve review, or infer readiness.'
  };
}

function latestProviderRunnerOperationForTask(operations, { goalId, taskId }) {
  if (!Array.isArray(operations?.runs) || !isNonEmptyString(goalId) || !isNonEmptyString(taskId)) {
    return null;
  }

  for (let index = operations.runs.length - 1; index >= 0; index -= 1) {
    const operation = operations.runs[index];

    if (operation?.goalId === goalId && operation?.taskId === taskId && operation?.commandKind === 'provider-runner') {
      return operation;
    }
  }

  return null;
}

function latestImplementationOperationForTask(operations, { goalId, taskId }) {
  if (!Array.isArray(operations?.runs)) {
    return null;
  }

  for (let index = operations.runs.length - 1; index >= 0; index -= 1) {
    const run = operations.runs[index];

    if (
      run?.commandKind === 'implementation' &&
      (!isNonEmptyString(goalId) || run.goalId === goalId) &&
      (!isNonEmptyString(taskId) || run.taskId === taskId)
    ) {
      return run;
    }
  }

  return null;
}

function projectEvidenceRefItems(refs) {
  const items = Array.isArray(refs) ? refs : [];

  return {
    count: valueState(items.length),
    items: items.map((entry) => ({
      kind: valueState(entry?.kind),
      ref: valueState(entry?.ref),
      label: valueState(entry?.label),
      eventId: valueState(entry?.eventId),
      eventType: valueState(entry?.eventType)
    }))
  };
}

function projectReviewWorkspace({
  runbook,
  ledger,
  eventLog,
  nextAction,
  promptPack,
  reviewerPromptPack,
  latestRun
}) {
  const runbookTasks = Array.isArray(runbook?.tasks) ? runbook.tasks : [];
  const ledgerTasks = new Map(
    (Array.isArray(ledger?.tasks) ? ledger.tasks : [])
      .map((task) => [task.taskId, task])
  );
  const events = Array.isArray(eventLog?.events) ? eventLog.events : [];
  const targetTask = selectReviewWorkspaceTask({
    runbookTasks,
    ledgerTasks,
    events,
    nextAction
  });
  const taskId = targetTask?.taskId;
  const ledgerTask = isNonEmptyString(taskId) ? ledgerTasks.get(taskId) ?? null : null;
  const taskEvents = events.filter((event) => event?.taskId === taskId);
  const workerEvidenceEvent = latestEventOfTypes(taskEvents, [
    'worker.evidence-recorded',
    'worker.self-check-passed',
    'worker.self-check-failed'
  ]);
  const reviewEvent = latestEventOfTypes(taskEvents, ['reviewer.approved', 'reviewer.needs-revision']);
  const workerEvidenceRef = firstNonEmptyString(
    nextAction?.evidenceState?.workerEvidenceRef,
    ledgerTask?.workerEvidenceRef,
    firstGoalEvidenceRef(workerEvidenceEvent),
    latestRunEvidenceRefByKind(latestRun, 'evidence')
  );
  const reviewPrompt = projectReviewWorkspacePrompt({
    promptPack,
    reviewerPromptPack,
    nextAction,
    taskId
  });
  const changedFiles = adoptionCandidateChangedFiles(latestRun);
  const validationCommands = reviewPrompt.validationCommands.state === 'available'
    ? reviewPrompt.validationCommands.items.map((item) => item.value)
    : Array.isArray(targetTask?.copyOnlyCommands)
      ? targetTask.copyOnlyCommands
      : Array.isArray(nextAction?.copyOnlyCommands) ? nextAction.copyOnlyCommands : [];
  const expectedVerdict = projectReviewWorkspaceExpectedVerdict({
    goalId: runbook?.goalId ?? nextAction?.goalId ?? ledger?.goalId,
    taskId,
    targetTask,
    nextAction
  });
  const hasWorkerEvidence = isNonEmptyString(workerEvidenceRef);
  const state = targetTask === null || targetTask === undefined
    ? 'missing'
    : hasWorkerEvidence && reviewPrompt.textAvailable.value === true
      ? 'available'
      : hasWorkerEvidence ? 'partial' : 'waiting-worker-evidence';

  return {
    state,
    modelName: valueState(REVIEW_WORKSPACE_MODEL_NAME),
    sourcePolicy: valueState('goal-runbook.v1 + goal-progress-ledger.v1 + goal-event-log.v1 + goal-next-action.v1 + goal-prompt-pack.v1 + symphony.console-run'),
    goalId: valueState(runbook?.goalId ?? nextAction?.goalId ?? ledger?.goalId),
    taskId: valueState(taskId),
    title: valueState(targetTask?.title ?? ledgerTask?.title),
    activeNext: {
      taskId: valueState(nextAction?.next?.taskId),
      role: valueState(nextAction?.next?.role),
      phase: valueState(nextAction?.next?.phase),
      reason: valueState(nextAction?.reason ?? nextAction?.next?.reason)
    },
    sourceRun: projectReviewWorkspaceSourceRun(latestRun),
    changedFiles: projectTextItems(changedFiles),
    workerEvidence: {
      ref: valueState(workerEvidenceRef),
      ledgerRef: valueState(ledgerTask?.workerEvidenceRef),
      eventRef: valueState(firstGoalEvidenceRef(workerEvidenceEvent)),
      eventId: valueState(workerEvidenceEvent?.eventId),
      eventType: valueState(workerEvidenceEvent?.eventType),
      source: valueState(isNonEmptyString(ledgerTask?.workerEvidenceRef)
        ? GOAL_PROGRESS_LEDGER_CONTRACT_NAME
        : workerEvidenceEvent !== null
          ? GOAL_EVENT_LOG_CONTRACT_NAME
          : isNonEmptyString(latestRun?.runId) ? 'symphony.console-run' : GOAL_PROGRESS_LEDGER_CONTRACT_NAME)
    },
    reviewPrompt,
    reviewerHandoff: projectReviewerHandoff({
      goalId: runbook?.goalId ?? nextAction?.goalId ?? ledger?.goalId,
      taskId,
      reviewPrompt,
      workerEvidenceEvent
    }),
    reviewChecklist: {
      acceptance: projectTextItems(targetTask?.acceptance),
      validationCommands: projectTextItems(validationCommands),
      roleBoundary: reviewPrompt.roleGuidance.boundary,
      evidenceRequirements: reviewPrompt.roleGuidance.evidenceRequirements,
      handoffChecklist: reviewPrompt.roleGuidance.handoffChecklist,
      requiredContext: projectTextItems([
        'changed files from latest exposed run',
        'source run id and workspace fields from symphony.console-run',
        'worker evidence ref from goal-status/events/latest run',
        'copy-only reviewer prompt from goal-prompt-pack.v1',
        'expected reviewer.approved or reviewer.needs-revision event'
      ])
    },
    expectedVerdict,
    reviewVerdictRegistration: projectReviewVerdictRegistration({
      goalId: runbook?.goalId ?? nextAction?.goalId ?? ledger?.goalId,
      taskId,
      expectedVerdict,
      reviewPrompt,
      workerEvidenceEvent,
      runbook,
      ledger,
      eventLog,
      latestRun
    }),
    existingReview: {
      verdict: valueState(normalizedReviewVerdict(ledgerTask?.reviewVerdict) ?? explicitReviewVerdictState(reviewEvent).value),
      evidenceRef: valueState(ledgerTask?.reviewEvidenceRef ?? firstGoalEvidenceRef(reviewEvent)),
      eventId: valueState(reviewEvent?.eventId),
      eventType: valueState(reviewEvent?.eventType),
      source: valueState(reviewEvent !== null ? GOAL_EVENT_LOG_CONTRACT_NAME : GOAL_PROGRESS_LEDGER_CONTRACT_NAME)
    },
    safety: {
      readOnly: valueState(true),
      copyOnly: valueState(true),
      workbenchWriteAvailable: valueState(true),
      browserExecutionAvailable: valueState(false),
      modelInvocationAvailable: valueState(false),
      genericShellRunner: valueState(false),
      workerCanApproveOwnTask: valueState(false),
      reviewerActorMustDifferFromLatestWorker: valueState(true),
      approvalReadinessSource: valueState('explicit goal review event only'),
      unsupportedInferenceSources: arrayTextState(['file-name', 'branch', 'commit-message', 'frontend-heuristic'])
    },
    note: 'Review Workspace gives the independent reviewer the active task context already exposed by Workbench. It can register reviewer verdicts only through the controlled goal review dry-run and plan-hash confirm path; it does not read evidence bodies, open workspaces, run shell commands, start agents, or infer approval from source run metadata.'
  };
}

function projectReviewerHandoff({
  goalId,
  taskId,
  reviewPrompt,
  workerEvidenceEvent
}) {
  const promptAvailable = reviewPrompt?.textAvailable?.value === true;
  const reviewerEvidencePath = reviewPrompt?.evidenceFile?.value;
  const latestWorkerActor = isNonEmptyString(workerEvidenceEvent?.actor?.id)
    ? workerEvidenceEvent.actor.id
    : undefined;
  const promptRoute = isNonEmptyString(goalId) && isNonEmptyString(taskId)
    ? `${GOAL_PROMPT_PACK_ROUTE_TEMPLATE.path.replace('<goal-id>', encodeURIComponent(goalId))}?task=${encodeURIComponent(taskId)}&role=reviewer`
    : undefined;
  const promptCommand = isNonEmptyString(goalId) && isNonEmptyString(taskId)
    ? `pnpm --silent symphony goal prompt --goal ${goalId} --task ${taskId} --role reviewer --markdown`
    : undefined;
  const ready = promptAvailable && isNonEmptyString(reviewerEvidencePath);

  return {
    state: valueState(ready ? 'ready' : promptAvailable ? 'missing-reviewer-evidence-path' : 'missing-reviewer-prompt'),
    sourceContract: reviewPrompt?.sourceContract ?? valueState(GOAL_PROMPT_PACK_CONTRACT_NAME),
    promptGeneratedFrom: valueState('symphony goal prompt'),
    promptRoute: valueState(promptRoute),
    promptCommand: valueState(promptCommand),
    reviewerEvidencePath: valueState(reviewerEvidencePath),
    latestWorkerActor: valueState(latestWorkerActor),
    separationRequired: valueState(true),
    reviewerActorMustDifferFromLatestWorker: valueState(true),
    workerCanReviewOwnTask: valueState(false),
    workerCanApproveOwnTask: valueState(false),
    enforcedBy: projectTextItems([
      'goal-prompt-pack.v1 reviewer role boundary',
      'symphony goal review reviewer-is-not-worker precondition',
      'Workbench display does not register reviewer verdicts from prompt text'
    ]),
    handoffChecklist: projectTextItems([
      'Generate the reviewer prompt with goal prompt for this task and role.',
      'Use a reviewer id that differs from the latest worker actor id.',
      'Write review evidence at the reviewer evidence path before registering a verdict.'
    ])
  };
}

function selectReviewWorkspaceTask({
  runbookTasks,
  ledgerTasks,
  events,
  nextAction
}) {
  const nextTaskId = nextAction?.next?.taskId;
  const activeTask = isNonEmptyString(nextTaskId)
    ? runbookTasks.find((task) => task?.taskId === nextTaskId)
    : undefined;

  if (activeTask !== undefined) {
    return activeTask;
  }

  const taskWithWorkerEvidence = runbookTasks.find((task) => {
    const ledgerTask = ledgerTasks.get(task?.taskId);
    const taskEvents = events.filter((event) => event?.taskId === task?.taskId);
    const latestWorkerEvidence = latestEventOfTypes(taskEvents, ['worker.evidence-recorded']);
    const latestReview = latestEventOfTypes(taskEvents, ['reviewer.approved', 'reviewer.needs-revision']);

    return (isNonEmptyString(ledgerTask?.workerEvidenceRef) || latestWorkerEvidence !== null) &&
      (latestReview === null || goalEventIsAfter(latestWorkerEvidence, latestReview));
  });

  return taskWithWorkerEvidence ?? runbookTasks[0] ?? null;
}

function projectReviewWorkspaceSourceRun(latestRun) {
  const evidenceArtifactPath = firstNonEmptyString(
    latestRun?.evidenceArtifactPath,
    latestRunArtifactPathByKind(latestRun, 'evidence')
  );

  return {
    state: latestRun === null || latestRun === undefined ? 'missing' : 'available',
    runId: valueState(latestRun?.runId),
    status: valueState(latestRun?.status),
    verifierStatus: valueState(latestRun?.verifierStatus),
    executionPlanId: valueState(latestRun?.executionPlanId),
    sourceWorkspacePath: valueState(latestRun?.sourceWorkspacePath),
    sourceWorkspaceManifestPath: valueState(latestRun?.sourceWorkspaceManifestPath),
    evidenceArtifactPath: valueState(evidenceArtifactPath),
    evidenceRef: valueState(latestRunEvidenceRefByKind(latestRun, 'evidence')),
    writeBoundary: valueState(latestRun?.writeBoundary),
    workspaceWrites: valueState(latestRun?.workspaceWrites),
    mainWorktreeWrites: valueState(latestRun?.mainWorktreeWrites),
    updatedAt: valueState(latestRun?.updatedAt)
  };
}

function projectReviewWorkspacePrompt({
  promptPack,
  reviewerPromptPack,
  nextAction,
  taskId
}) {
  const reviewerPrompts = Array.isArray(reviewerPromptPack?.prompts) ? reviewerPromptPack.prompts : [];
  const prompts = Array.isArray(promptPack?.prompts) ? promptPack.prompts : [];
  const reviewerPrompt = prompts.find((prompt) => (
    prompt?.taskId === taskId &&
    prompt?.role === 'reviewer' &&
    prompt?.copyOnly === true &&
    isNonEmptyString(prompt?.text)
  )) ?? reviewerPrompts.find((prompt) => (
    prompt?.taskId === taskId &&
    prompt?.role === 'reviewer' &&
    prompt?.copyOnly === true &&
    isNonEmptyString(prompt?.text)
  )) ?? null;
  const fallbackText = nextAction?.next?.taskId === taskId &&
    nextAction?.next?.role === 'reviewer' &&
    nextAction?.copyOnlyPrompt?.available === true &&
    isNonEmptyString(nextAction?.copyOnlyPrompt?.text)
      ? nextAction.copyOnlyPrompt.text
      : undefined;
  const text = reviewerPrompt?.text ?? fallbackText;
  const roleGuidance = reviewerPrompt?.roleGuidance;

  return {
    state: isNonEmptyString(text) ? 'available' : 'missing',
    sourceContract: valueState(reviewerPrompt === null && isNonEmptyString(fallbackText)
      ? GOAL_NEXT_ACTION_CONTRACT_NAME
      : GOAL_PROMPT_PACK_CONTRACT_NAME),
    taskId: valueState(reviewerPrompt?.taskId ?? taskId),
    role: valueState(reviewerPrompt?.role ?? 'reviewer'),
    title: valueState(reviewerPrompt?.title),
    evidenceFile: valueState(reviewerPrompt?.evidenceFile),
    format: valueState(reviewerPrompt?.format ?? nextAction?.copyOnlyPrompt?.format),
    textAvailable: valueState(isNonEmptyString(text)),
    text: valueState(text),
    validationCommands: projectTextItems(reviewerPrompt?.validationCommands),
    roleGuidance: {
      label: valueState(roleGuidance?.label),
      phase: valueState(roleGuidance?.phase),
      boundary: projectTextItems(roleGuidance?.boundary),
      evidenceRequirements: projectTextItems(roleGuidance?.evidenceRequirements),
      handoffChecklist: projectTextItems(roleGuidance?.handoffChecklist)
    }
  };
}

function projectReviewWorkspaceExpectedVerdict({
  goalId,
  taskId,
  targetTask,
  nextAction
}) {
  const nextIsReviewer = nextAction?.next?.taskId === taskId && nextAction?.next?.role === 'reviewer';
  const runbookReviewerEvents = Array.isArray(targetTask?.expectedEvidence?.reviewer)
    ? targetTask.expectedEvidence.reviewer
    : isNonEmptyString(targetTask?.expectedEvidence?.reviewer) ? [targetTask.expectedEvidence.reviewer] : [];
  const nextAllowedEvents = nextIsReviewer && Array.isArray(nextAction?.afterCompletion?.allowedEvents)
    ? nextAction.afterCompletion.allowedEvents
    : [];
  const allowedEvents = (nextAllowedEvents.length > 0 ? nextAllowedEvents : runbookReviewerEvents)
    .filter((eventType) => eventType === 'reviewer.approved' || eventType === 'reviewer.needs-revision');

  return {
    registerWith: valueState(nextIsReviewer ? nextAction?.afterCompletion?.registerWith : 'symphony goal review'),
    allowedEvents: projectTextItems(allowedEvents),
    expectedEvidence: expectedEvidenceState(targetTask?.expectedEvidence?.reviewer),
    verdicts: projectTextItems(['approved', 'needs-revision']),
    dryRunCommand: valueState(isNonEmptyString(goalId) && isNonEmptyString(taskId)
      ? `pnpm --silent symphony goal review --goal ${goalId} --task ${taskId} --reviewer <reviewer-id> --verdict approved|needs-revision --evidence-ref <review-evidence-ref> --dry-run --json`
      : undefined),
    confirmRequiresPlanHash: valueState(true),
    writesInDryRun: valueState(false)
  };
}

function projectReviewVerdictRegistration({
  goalId,
  taskId,
  expectedVerdict,
  reviewPrompt,
  workerEvidenceEvent,
  runbook,
  ledger,
  eventLog,
  latestRun
}) {
  const allowedEvents = (expectedVerdict?.allowedEvents?.items ?? [])
    .map((item) => item.value)
    .filter((eventType) => eventType === 'reviewer.approved' || eventType === 'reviewer.needs-revision');
  const definitions = allowedEvents
    .map((eventType) => GOAL_EVENT_FORM_DEFINITIONS.find((definition) => definition.eventType === eventType))
    .filter((definition) => definition !== undefined);
  const evidenceRef = controlledReviewEvidenceRef(reviewPrompt?.evidenceFile?.value);
  const latestWorkerActor = isNonEmptyString(workerEvidenceEvent?.actor?.id)
    ? workerEvidenceEvent.actor.id
    : undefined;
  const evidenceRefHelper = projectEvidenceRefHelper({
    runbook,
    ledger,
    eventLog,
    latestRun
  });
  const nextActionForReview = isNonEmptyString(goalId) && isNonEmptyString(taskId)
    ? {
        goalId,
        next: {
          taskId,
          role: 'reviewer',
          phase: 'review'
        },
        afterCompletion: {
          registerWith: 'symphony goal review',
          allowedEvents
        }
      }
    : null;
  const fieldOverrides = {
    goalId: {
      source: REVIEW_WORKSPACE_MODEL_NAME
    },
    taskId: {
      source: REVIEW_WORKSPACE_MODEL_NAME
    },
    reviewerId: {
      placeholder: isNonEmptyString(latestWorkerActor)
        ? `reviewer id, not ${latestWorkerActor}`
        : 'codex-reviewer-task-id'
    },
    evidenceRef: isNonEmptyString(evidenceRef)
      ? {
          value: evidenceRef,
          source: 'goal-prompt-pack.v1 evidenceFile'
        }
      : {
          placeholder: 'docs/plans/<review-evidence>.md or artifact:run:review'
        }
  };
  const forms = nextActionForReview === null
    ? []
    : definitions.map((definition) => projectGoalEventFormSpec({
        definition,
        nextAction: nextActionForReview,
        recommended: true,
        evidenceRefHelper,
        fieldOverrides
      }));

  return {
    state: nextActionForReview === null ? 'missing' : forms.length === 0 ? 'empty' : 'available',
    modelName: valueState(GOAL_EVENT_FORM_MODEL_NAME),
    sourceContract: valueState(`${REVIEW_WORKSPACE_MODEL_NAME} + ${GOAL_UPDATE_PLAN_CONTRACT_NAME}`),
    goalId: valueState(goalId),
    taskId: valueState(taskId),
    registerWith: valueState('symphony goal review'),
    allowedEvents: projectTextItems(allowedEvents),
    defaultFormId: valueState(forms[0]?.formId.value),
    latestWorkerActor: valueState(latestWorkerActor),
    reviewerEvidenceRef: valueState(evidenceRef),
    forms: {
      state: forms.length === 0 ? 'empty' : 'available',
      count: valueState(forms.length),
      items: forms
    },
    policy: {
      reviewerActorMustDifferFromLatestWorker: valueState(true),
      workerCanApproveOwnTask: valueState(false),
      approvalReadinessSource: valueState('explicit goal review event only'),
      unsupportedInferenceSources: arrayTextState(['file-name', 'branch', 'commit-message', 'frontend-heuristic'])
    },
    safety: {
      dryRunWrites: valueState(false),
      confirmRequiresPlanHash: valueState(true),
      workbenchWriteAvailable: valueState(true),
      browserExecutionAvailable: valueState(false),
      modelInvocationAvailable: valueState(false),
      genericShellRunner: valueState(false)
    },
    note: 'Review verdict registration reuses symphony goal review dry-run preview and plan-hash confirm for approved or needs-revision. Successful confirm refreshes goal progress, events, next action, and operation state.'
  };
}

function controlledReviewEvidenceRef(value) {
  if (!isControlledEvidenceRefInput(value)) {
    return undefined;
  }

  return normalizeEvidenceRefInput(value);
}

function projectMainVerificationReadiness({
  runbook,
  ledger,
  eventLog,
  operations,
  adoptionInspectResult,
  adoptionInspect,
  nextAction,
  closeout,
  latestRun
}) {
  const runbookTasks = Array.isArray(runbook?.tasks) ? runbook.tasks : [];
  const ledgerTasks = new Map(
    (Array.isArray(ledger?.tasks) ? ledger.tasks : [])
      .map((task) => [task.taskId, task])
  );
  const events = Array.isArray(eventLog?.events) ? eventLog.events : [];
  const targetTask = selectMainVerificationReadinessTask({
    runbookTasks,
    ledgerTasks,
    nextAction
  });
  const taskId = targetTask?.taskId;
  const ledgerTask = isNonEmptyString(taskId) ? ledgerTasks.get(taskId) ?? null : null;
  const taskEvents = events.filter((event) => event?.taskId === taskId);
  const reviewEvent = latestEventOfTypes(taskEvents, ['reviewer.approved', 'reviewer.needs-revision']);
  const mainVerificationEvent = latestEventOfTypes(taskEvents, ['main.verification-passed', 'main.verification-failed']);
  const reviewerApproval = projectReviewerApprovalReadiness({
    reviewEvent,
    ledgerTask
  });
  const adoptionState = projectMainVerificationAdoptionState({
    operations,
    adoptionInspectResult,
    adoptionInspect,
    goalId: runbook?.goalId ?? ledger?.goalId ?? nextAction?.goalId,
    taskId
  });
  const requiredCommands = Array.isArray(targetTask?.copyOnlyCommands)
    ? targetTask.copyOnlyCommands
    : [];
  const missingCloseoutKinds = Array.isArray(closeout?.missing)
    ? closeout.missing
      .filter((item) => item?.taskId === taskId)
      .map((item) => item?.kind)
      .filter((kind) => isNonEmptyString(kind))
    : [];
  const blockerReasons = mainVerificationBlockerReasons({
    reviewerApproval,
    adoptionState,
    mainVerificationEvent,
    missingCloseoutKinds
  });
  const canEnter = blockerReasons.length === 0;
  const state = runbookTasks.length === 0
    ? 'missing'
    : canEnter
      ? 'ready'
      : reviewerApproval.status.value === 'needs-revision'
        || adoptionState.status.value === 'needs-adoption'
        || adoptionState.status.value === 'adoption-failed'
        || mainVerificationEvent?.eventType === 'main.verification-failed'
        ? 'blocked'
        : 'waiting';

  return {
    state,
    sourcePolicy: valueState('goal-progress-ledger.v1 + goal-event-log.v1 + goal-next-action.v1 + goal-closeout-report.v1 + goal-operation-runs.v1 + symphony.console-adoption-inspect'),
    goalId: valueState(runbook?.goalId ?? ledger?.goalId ?? nextAction?.goalId),
    taskId: valueState(taskId),
    title: valueState(targetTask?.title),
    readiness: {
      canEnterMainVerification: valueState(canEnter),
      reason: valueState(mainVerificationReadinessReason({
        targetTask,
        reviewerApproval,
        adoptionState,
        mainVerificationEvent,
        missingCloseoutKinds,
        blockerReasons
      })),
      currentNextRole: valueState(nextAction?.next?.role),
      currentNextPhase: valueState(nextAction?.next?.phase),
      closeoutMissingKinds: arrayTextState(missingCloseoutKinds),
      blockers: projectTextItems(blockerReasons)
    },
    reviewerApproval,
    adoptionState,
    explicitStateSources: projectTextItems([
      'goal-status task status, evidence refs, and reviewer verdict',
      'goal-event-log reviewer and main-verification events for the active task',
      'goal next role/phase and closeout missing kinds',
      'goal-operation-runs adoption-plan/adoption-confirm operations for the active task',
      'symphony.console-adoption-inspect journal, latest confirmation run, and worktree match fields when a frozen adoption plan exists'
    ]),
    ignoredInferenceSources: projectTextItems([
      'branch names',
      'file names',
      'commit messages',
      'prompt text',
      'task titles',
      'frontend component state',
      'copy-only command text'
    ]),
    ffOnlyMerge: {
      guidance: valueState('Run the ff-only main merge check from a terminal after explicit readiness is true; the browser only shows copy-only guidance.'),
      commands: projectTextItems(ffOnlyMergeCommands())
    },
    verificationCommands: projectTextItems(requiredCommands),
    verificationPlanPreview: projectAllowlistedVerificationPlanPreview({
      goalId: runbook?.goalId ?? ledger?.goalId ?? nextAction?.goalId,
      taskId,
      targetTask,
      nextAction,
      operations,
      ledgerTask,
      reviewerApproval,
      reviewEvent,
      adoptionState,
      mainVerificationEvent,
      latestRun
    }),
    evidence: {
      path: valueState(undefined),
      expectedEvent: valueState(targetTask?.expectedEvidence?.mainVerifier),
      existingMainVerificationRef: valueState(ledgerTask?.mainVerificationRef ?? firstGoalEvidenceRef(mainVerificationEvent)),
      gateCommand: valueState(isNonEmptyString(runbook?.goalId) && isNonEmptyString(taskId)
        ? `pnpm --silent symphony goal gate --goal ${runbook.goalId} --task ${taskId} --gate main-verification --status passed --verifier <main-verifier-id> --evidence-ref <main-verification-evidence-ref> --dry-run --json`
        : undefined)
    },
    safety: {
      readOnly: valueState(true),
      copyOnly: valueState(true),
      browserExecutionAvailable: valueState(false),
      modelInvocationAvailable: valueState(false),
      approvalReadinessSource: valueState('explicit reviewer.approved event or event-backed goal-status ledger'),
      adoptionReadinessSource: valueState('explicit goal-operation-runs adoption operations and adoption inspect output only'),
      unsupportedInferenceSources: valueState('file-name、branch、commit-message、prompt-text、task-title、frontend-heuristic')
    },
    note: 'Main Verification Readiness only displays whether main verification can start from explicit backend state. It does not execute merge, verification commands, evidence writing, or goal gate registration, and it does not infer approval or adoption state from branch names, file names, prompt text, task titles, command text, or frontend state.'
  };
}

function projectAllowlistedVerificationPlanPreview({
  goalId,
  taskId,
  targetTask,
  nextAction,
  operations,
  ledgerTask,
  reviewerApproval,
  reviewEvent,
  adoptionState,
  mainVerificationEvent,
  latestRun
}) {
  const scopedCommands = [
    ...commandsFromContract(targetTask?.copyOnlyCommands),
    ...commandsFromContract(nextAction?.copyOnlyCommands)
  ];
  const taskScopedControlledCommands = uniqueStrings(scopedCommands)
    .filter((command) => isControlledVerificationContextCommand(command, goalId));
  const allowedCommands = uniqueStrings([
    ...MAIN_VERIFICATION_COMMAND_ALLOWLIST,
    ...taskScopedControlledCommands
  ]);
  const rejectedTaskCommandCount = uniqueStrings(scopedCommands)
    .filter((command) => !isAllowlistedVerificationCommand(command, goalId))
    .length;

  return {
    state: isNonEmptyString(goalId) && isNonEmptyString(taskId) ? 'available' : 'missing',
    modelName: valueState('AllowlistedVerificationPlanPreview'),
    sourcePolicy: valueState('goal-runbook.v1 copyOnlyCommands + goal-next-action.v1 copyOnlyCommands + fixed v31 verification command allowlist'),
    goalId: valueState(goalId),
    taskId: valueState(taskId),
    title: valueState(targetTask?.title),
    context: {
      sourcePolicy: valueState('active goal/task/run/evidence refs from backend contracts'),
      activeGoalId: valueState(goalId),
      activeTaskId: valueState(taskId),
      latestRunId: valueState(latestRun?.runId),
      latestRunStatus: valueState(latestRun?.status),
      workerEvidenceRef: valueState(ledgerTask?.workerEvidenceRef ?? nextAction?.evidenceState?.workerEvidenceRef),
      reviewEvidenceRef: valueState(reviewerApproval?.evidenceRef?.value ?? ledgerTask?.reviewEvidenceRef ?? nextAction?.evidenceState?.reviewEvidenceRef),
      adoptionPlanOperationId: valueState(adoptionState?.planOperationId?.value),
      adoptionConfirmOperationId: valueState(adoptionState?.confirmOperationId?.value),
      existingMainVerificationRef: valueState(ledgerTask?.mainVerificationRef ?? firstGoalEvidenceRef(mainVerificationEvent) ?? nextAction?.evidenceState?.mainVerificationRef),
      existingMainVerificationEventId: valueState(mainVerificationEvent?.eventId)
    },
    commandCount: valueState(allowedCommands.length),
    commands: projectVerificationPlanCommandItems({
      commands: allowedCommands,
      goalId
    }),
    operationStart: {
      available: valueState(isNonEmptyString(goalId) && isNonEmptyString(taskId)),
      suiteId: valueState('v31-main-verification-command-suite'),
      endpoint: {
        route: valueState(isNonEmptyString(goalId) ? `/api/goals/${goalId}/verification-run-confirm` : undefined),
        method: valueState('POST'),
        allowedBodyFields: arrayTextState(['goalId', 'taskId', 'suiteId']),
        requiresSameGoalTaskContext: valueState(true)
      },
      resultContract: valueState('controlled-verification-run-confirmation.v1'),
      operationKind: valueState('verification'),
      operationRegistryContract: valueState(GOAL_OPERATION_RUNS_CONTRACT_NAME)
    },
    requiredVerificationCommands: projectTextItems(MAIN_VERIFICATION_COMMAND_ALLOWLIST),
    taskScopedControlledCommands: projectTextItems(taskScopedControlledCommands),
    rejectedTaskCommandCount: valueState(rejectedTaskCommandCount),
    explicitContracts: projectTextItems([
      'goal-runbook.v1',
      'goal-next-action.v1',
      GOAL_PROGRESS_LEDGER_CONTRACT_NAME
    ]),
    ignoredInferenceSources: projectTextItems([
      'browser command input',
      'free-form shell text',
      'branch names',
      'file names',
      'prompt text',
      'task titles',
      'frontend component state'
    ]),
    safety: {
      copyOnly: valueState(true),
      commandInputAccepted: valueState(false),
      arbitraryShellAccepted: valueState(false),
      browserExecutionAvailable: valueState(false),
      modelInvocationAvailable: valueState(false),
      genericShellRunner: valueState(false),
      controlledOperationStartAvailable: valueState(isNonEmptyString(goalId) && isNonEmptyString(taskId)),
      writesGoalEvents: valueState(false),
      registersGates: valueState(false)
    },
    evidenceDraft: projectMainVerificationEvidenceDraft({
      goalId,
      taskId,
      targetTask,
      operations,
      ledgerTask,
      reviewerApproval,
      reviewEvent,
      adoptionState,
      mainVerificationEvent,
      latestRun
    }),
    note: 'The preview lists only the fixed v31 verification commands plus task-scoped controlled goal context commands. It does not accept command text and does not execute commands in the browser.'
  };
}

function projectMainVerificationEvidenceDraft(options = {}) {
  let {
    goalId,
    taskId,
    targetTask,
    operations,
    ledgerTask,
    reviewerApproval,
    reviewEvent,
    adoptionState,
    mainVerificationEvent,
    latestRun
  } = options;

  if (Array.isArray(options.runbook?.tasks)) {
    const runbookTasks = options.runbook.tasks;
    const ledgerTasks = new Map(
      (Array.isArray(options.ledger?.tasks) ? options.ledger.tasks : [])
        .map((task) => [task.taskId, task])
    );
    const events = Array.isArray(options.eventLog?.events) ? options.eventLog.events : [];

    targetTask = selectMainVerificationReadinessTask({
      runbookTasks,
      ledgerTasks,
      nextAction: options.nextAction
    });
    goalId = firstNonEmptyString(options.runbook?.goalId, options.ledger?.goalId, options.eventLog?.goalId, options.nextAction?.goalId);
    taskId = targetTask?.taskId;
    ledgerTask = isNonEmptyString(taskId) ? ledgerTasks.get(taskId) ?? null : null;

    const taskEvents = events.filter((event) => event?.taskId === taskId);
    reviewEvent = latestEventOfTypes(taskEvents, ['reviewer.approved', 'reviewer.needs-revision']);
    mainVerificationEvent = latestEventOfTypes(taskEvents, ['main.verification-passed', 'main.verification-failed']);
    reviewerApproval = projectReviewerApprovalReadiness({
      reviewEvent,
      ledgerTask
    });
    adoptionState = projectMainVerificationAdoptionState({
      operations,
      adoptionInspectResult: null,
      adoptionInspect: options.adoptionInspect,
      goalId,
      taskId
    });
  }

  const verificationOperation = latestVerificationOperationForTask(operations, {
    goalId,
    taskId
  });
  const verificationRun = verificationOperation?.runResult ?? null;
  const targetEvidenceRef = expectedMainVerificationEvidenceRef(targetTask);
  const reviewEvidenceRef = firstNonEmptyString(
    reviewerApproval?.evidenceRef?.value,
    ledgerTask?.reviewEvidenceRef,
    firstGoalEvidenceRef(reviewEvent)
  );
  const workerEvidenceRef = firstNonEmptyString(ledgerTask?.workerEvidenceRef);
  const commandResults = Array.isArray(verificationRun?.commandResults)
    ? verificationRun.commandResults
    : [];
  const missingInputs = mainVerificationEvidenceDraftMissingInputs({
    goalId,
    taskId,
    workerEvidenceRef,
    reviewEvidenceRef,
    reviewVerdict: reviewerApproval?.status?.value,
    verificationOperation,
    verificationRun,
    commandResults
  });
  const available = missingInputs.length === 0;
  const markdown = missingInputs.length === 0
    ? buildMainVerificationEvidenceDraftMarkdown({
        goalId,
        taskId,
        taskTitle: targetTask?.title,
        draftPath: targetEvidenceRef,
        verificationOperation,
        commandResults,
        workerEvidenceRef,
        reviewEvidenceRef,
        reviewVerdict: reviewerApproval?.status?.value,
        adoptionRefs: {
          adoptionPlanId: adoptionState?.adoptionPlanId?.value,
          adoptionPlanOperationId: adoptionState?.planOperationId?.value,
          adoptionConfirmOperationId: adoptionState?.confirmOperationId?.value,
          adoptionConfirmStatus: adoptionState?.confirmOperationStatus?.value,
          latestConfirmationRunId: adoptionState?.confirmationRunId?.value,
          journalStatus: adoptionState?.journalStatus?.value
        },
        mainVerificationEvent
      })
    : MISSING_TEXT;
  const adoptionRefs = {
    adoptionPlanOperationId: adoptionState?.planOperationId?.value,
    adoptionConfirmOperationId: adoptionState?.confirmOperationId?.value,
    adoptionConfirmStatus: adoptionState?.confirmOperationStatus?.value,
    latestConfirmationRunId: adoptionState?.confirmationRunId?.value,
    journalStatus: adoptionState?.journalStatus?.value
  };
  const verificationOperationDraft = {
    operationId: valueState(verificationOperation?.operationId),
    status: valueState(verificationOperation?.status),
    commandKind: valueState(verificationOperation?.commandKind),
    suiteId: valueState(verificationRun?.suiteId),
    runId: valueState(verificationRun?.runId),
    runStatus: valueState(verificationRun?.status),
    exitCode: valueState(verificationRun?.exitCode),
    commandCount: valueState(verificationRun?.commandCount),
    failedCommandCount: valueState(verificationRun?.failedCommandCount),
    gatePassed: valueState(verificationRun?.gatePassed),
    artifactRefs: projectOperationConsoleArtifactRefs(verificationOperation?.artifactRefs),
    source: valueState(verificationOperation?.source),
    updatedAt: valueState(verificationOperation?.timestamps?.updatedAt)
  };

  return {
    state: !isNonEmptyString(goalId) || !isNonEmptyString(taskId)
      ? 'missing'
      : verificationOperation === null
        ? 'waiting-for-verification-run'
        : available ? 'available' : 'blocked',
    modelName: valueState('MainVerificationEvidenceDraft'),
    contractName: valueState('main-verification-evidence-draft.v1'),
    contractVersion: valueState(1),
    sourcePolicy: valueState('goal-operation-runs.v1 verification output + explicit goal/task/evidence/adoption refs'),
    goalId: valueState(goalId),
    taskId: valueState(taskId),
    title: valueState(targetTask?.title),
    draftPath: valueState(targetEvidenceRef),
    targetEvidenceRef: valueState(targetEvidenceRef),
    status: valueState(available ? 'draft-needs-operator-review' : 'missing-inputs'),
    missingInputs: projectTextItems(missingInputs),
    workerEvidenceRef: valueState(workerEvidenceRef),
    reviewEvidenceRef: valueState(reviewEvidenceRef),
    reviewVerdict: valueState(reviewerApproval?.status?.value),
    verification: {
      operationId: valueState(verificationOperation?.operationId),
      operationStatus: valueState(verificationOperation?.status),
      source: valueState(verificationOperation?.source),
      runId: valueState(verificationRun?.runId),
      suiteId: valueState(verificationRun?.suiteId),
      runStatus: valueState(verificationRun?.status),
      exitCode: valueState(verificationRun?.exitCode),
      commandCount: valueState(verificationRun?.commandCount),
      failedCommandCount: valueState(verificationRun?.failedCommandCount),
      gatePassed: valueState(verificationRun?.gatePassed),
      planHash: valueState(verificationOperation?.planHash),
      failureReason: valueState(verificationOperation?.failureReason)
    },
    verificationOperation: verificationOperationDraft,
    refs: {
      workerEvidenceRef: valueState(workerEvidenceRef),
      reviewEvidenceRef: valueState(reviewEvidenceRef),
      adoptionPlanOperationId: valueState(adoptionState?.planOperationId?.value),
      adoptionConfirmOperationId: valueState(adoptionState?.confirmOperationId?.value),
      latestRunId: valueState(latestRun?.runId),
      existingMainVerificationRef: valueState(ledgerTask?.mainVerificationRef ?? firstGoalEvidenceRef(mainVerificationEvent)),
      existingMainVerificationEventId: valueState(mainVerificationEvent?.eventId)
    },
    adoptionRefs: {
      adoptionPlanOperationId: valueState(adoptionRefs.adoptionPlanOperationId),
      adoptionConfirmOperationId: valueState(adoptionRefs.adoptionConfirmOperationId),
      adoptionConfirmStatus: valueState(adoptionRefs.adoptionConfirmStatus),
      latestConfirmationRunId: valueState(adoptionRefs.latestConfirmationRunId),
      journalStatus: valueState(adoptionRefs.journalStatus)
    },
    commandResults: projectMainVerificationDraftCommandResults(commandResults),
    markdown: textState(markdown),
    draft: {
      available: valueState(available),
      text: textState(markdown === MISSING_TEXT ? '' : markdown),
      needsOperatorReview: valueState(true),
      declaresPassed: valueState(false),
      registersGoalEvent: valueState(false),
      writesFile: valueState(false)
    },
    copyOnlyGateDryRun: valueState(isNonEmptyString(goalId) && isNonEmptyString(taskId)
      ? `pnpm --silent symphony goal gate --goal ${goalId} --task ${taskId} --gate main-verification --status passed --verifier <main-verifier-id> --evidence-ref ${targetEvidenceRef ?? '<main-verification-evidence-ref>'} --dry-run --json`
      : undefined),
    explicitStateSources: projectTextItems([
      'goal-operation-runs.v1 latest verification operation for the active goal/task',
      'goal-progress-ledger.v1 worker/review/main verification refs',
      'goal-event-log.v1 reviewer and main-verification events',
      'goal-operation-runs.v1 adoption operations and symphony.console-adoption-inspect fields when adoption exists',
      'symphony.console-run latest run id/status when exposed'
    ]),
    ignoredInferenceSources: projectTextItems([
      'branch names',
      'file names',
      'commit messages',
      'prompt text',
      'task titles',
      'command success as gate status',
      'frontend component state'
    ]),
    safety: {
      draftOnly: valueState(true),
      needsOperatorReview: valueState(true),
      requiresOperatorReview: valueState(true),
      readsEvidenceBodies: valueState(false),
      writesFiles: valueState(false),
      writesEvidenceFile: valueState(false),
      registersGates: valueState(false),
      declaresPassed: valueState(false),
      successImpliesGatePassed: valueState(false),
      browserExecutionAvailable: valueState(false),
      modelInvocationAvailable: valueState(false),
      arbitraryShellAccepted: valueState(false),
      opensLocalFiles: valueState(false),
      downloadsArtifacts: valueState(false),
      mergeAvailable: valueState(false),
      pushAvailable: valueState(false),
      tagAvailable: valueState(false),
      selfApprovalAvailable: valueState(false)
    },
    note: 'The draft is rendered from explicit Workbench contracts for operator/reviewer checking. Missing inputs are blockers, not inferred content. It does not write an evidence file, declare main verification passed, or register the main-verification gate.'
  };
}

function projectMainVerificationEvidenceDraftWriter({
  runbook,
  ledger,
  eventLog,
  operations,
  adoptionInspectResult,
  adoptionInspect,
  nextAction,
  latestRun
}) {
  const runbookTasks = Array.isArray(runbook?.tasks) ? runbook.tasks : [];
  const ledgerTasks = new Map(
    (Array.isArray(ledger?.tasks) ? ledger.tasks : [])
      .map((task) => [task.taskId, task])
  );
  const targetTask = selectMainVerificationReadinessTask({
    runbookTasks,
    ledgerTasks,
    nextAction
  });
  const goalId = runbook?.goalId ?? ledger?.goalId ?? nextAction?.goalId;
  const taskId = targetTask?.taskId;
  const ledgerTask = isNonEmptyString(taskId) ? ledgerTasks.get(taskId) ?? null : null;
  const events = Array.isArray(eventLog?.events) ? eventLog.events : [];
  const taskEvents = events.filter((event) => event?.taskId === taskId);
  const reviewEvent = latestEventOfTypes(taskEvents, ['reviewer.approved', 'reviewer.needs-revision']);
  const mainVerificationEvent = latestEventOfTypes(taskEvents, ['main.verification-passed', 'main.verification-failed']);
  const reviewerApproval = projectReviewerApprovalReadiness({
    reviewEvent,
    ledgerTask
  });
  const adoptionState = projectMainVerificationAdoptionState({
    operations,
    adoptionInspectResult,
    adoptionInspect,
    goalId,
    taskId
  });
  const draft = projectMainVerificationEvidenceDraft({
    goalId,
    taskId,
    targetTask,
    operations,
    ledgerTask,
    reviewerApproval,
    reviewEvent,
    adoptionState,
    mainVerificationEvent,
    latestRun
  });
  const draftPath = isNonEmptyString(taskId)
    ? `docs/plans/v31-${taskId}-main-verification-evidence-2026-06-01.md`
    : null;

  return {
    ...draft,
    state: draft.state === 'available' ? 'draft-ready' : draft.state,
    modelName: valueState(MAIN_VERIFICATION_EVIDENCE_DRAFT_MODEL_NAME),
    draftPath: valueState(draftPath),
    workerEvidenceRef: draft.workerEvidenceRef,
    reviewEvidenceRef: draft.reviewEvidenceRef,
    verificationOperation: draft.verificationOperation,
    verification: draft.verification,
    refs: draft.refs,
    adoptionRefs: {
      ...draft.adoptionRefs,
      adoptionPlanId: valueState(adoptionState?.adoptionPlanId?.value),
      adoptionPlanArtifactPath: valueState(undefined),
      latestConfirmationEvidenceArtifactPath: valueState(undefined)
    },
    markdown: draft.markdown,
    copyOnlyGateDryRun: draft.copyOnlyGateDryRun,
    draft: {
      available: valueState(draft.state === 'available'),
      text: draft.state === 'available' ? draft.markdown : textState(''),
      markdown: draft.markdown,
      needsOperatorReview: valueState(true),
      declaresPassed: valueState(false),
      writesFile: valueState(false),
      registersGoalEvent: valueState(false)
    },
    safety: {
      ...draft.safety,
      writesEvidenceFile: valueState(false),
      registersMainVerificationGate: valueState(false),
      declaresPassed: valueState(false),
      browserExecutionAvailable: valueState(false),
      modelInvocationAvailable: valueState(false),
      arbitraryShellAccepted: valueState(false)
    }
  };
}

function projectMainVerificationGateRegistration({
  runbook,
  ledger,
  eventLog,
  nextAction,
  latestRun,
  readiness,
  evidenceDraft
}) {
  const definition = GOAL_EVENT_FORM_DEFINITIONS.find((candidate) => (
    candidate.eventType === 'main.verification-passed'
  ));
  const runbookTasks = Array.isArray(runbook?.tasks) ? runbook.tasks : [];
  const ledgerTasks = new Map(
    (Array.isArray(ledger?.tasks) ? ledger.tasks : [])
      .map((task) => [task.taskId, task])
  );
  const targetTask = selectMainVerificationReadinessTask({
    runbookTasks,
    ledgerTasks,
    nextAction
  });
  const goalId = firstNonEmptyString(
    firstValue(readiness?.goalId),
    runbook?.goalId,
    ledger?.goalId,
    nextAction?.goalId
  );
  const taskId = firstNonEmptyString(
    firstValue(readiness?.taskId),
    targetTask?.taskId,
    nextAction?.next?.taskId
  );
  const ledgerTask = isNonEmptyString(taskId) ? ledgerTasks.get(taskId) ?? null : null;
  const events = Array.isArray(eventLog?.events) ? eventLog.events : [];
  const taskEvents = events.filter((event) => event?.taskId === taskId);
  const mainVerificationEvent = latestEventOfTypes(taskEvents, ['main.verification-passed', 'main.verification-failed']);
  const targetEvidenceRef = firstValue(evidenceDraft?.targetEvidenceRef);
  const verificationOperationId = firstValue(evidenceDraft?.verification?.operationId);
  const verificationRunId = firstValue(evidenceDraft?.verification?.runId);
  const existingMainVerificationRef = firstNonEmptyString(
    ledgerTask?.mainVerificationRef,
    firstValue(evidenceDraft?.refs?.existingMainVerificationRef),
    firstGoalEvidenceRef(mainVerificationEvent)
  );
  const missingInputs = mainVerificationGateRegistrationMissingInputs({
    definition,
    goalId,
    taskId,
    readiness,
    evidenceDraft,
    targetEvidenceRef,
    existingMainVerificationRef
  });
  const available = missingInputs.length === 0;
  const statement = isNonEmptyString(verificationOperationId)
    ? `Main verification gate registration uses confirmed verification operation ${verificationOperationId}.`
    : 'Main verification gate registration uses explicit Workbench verification evidence.';
  const form = definition === undefined
    ? null
    : projectGoalEventFormSpec({
        definition,
        nextAction: {
          goalId,
          next: {
            taskId,
            role: 'main-verifier',
            phase: 'main-verification'
          }
        },
        recommended: available,
        evidenceRefHelper: projectEvidenceRefHelper({
          runbook,
          ledger,
          eventLog,
          latestRun
        }),
        fieldOverrides: {
          gateName: {
            readOnly: true,
            value: 'main-verification',
            source: 'v31 main-verification gate registration',
            options: ['main-verification']
          },
          gateStatus: {
            readOnly: true,
            value: 'passed',
            source: 'v31 main-verification gate registration',
            options: ['passed']
          },
          evidenceRef: {
            value: targetEvidenceRef,
            source: 'main-verification-evidence-draft.v1 targetEvidenceRef'
          },
          statement: {
            value: statement,
            source: 'goal-operation-runs.v1 verification operation'
          }
        }
      });
  const commandGoalId = isNonEmptyString(goalId) ? goalId : '<goal-id>';
  const commandTaskId = isNonEmptyString(taskId) ? taskId : '<task-id>';
  const commandEvidenceRef = isNonEmptyString(targetEvidenceRef)
    ? targetEvidenceRef
    : '<main-verification-evidence-ref>';

  return {
    state: definition === undefined
      ? 'missing'
      : isNonEmptyString(existingMainVerificationRef) ? 'already-registered' : available ? 'available' : 'blocked',
    modelName: valueState('MainVerificationGateRegistration'),
    sourcePolicy: valueState('main-verification-evidence-draft.v1 + goal-operation-runs.v1 + goal-event-log.v1 + goal-update-plan.v1'),
    goalId: valueState(goalId),
    taskId: valueState(taskId),
    title: valueState(targetTask?.title),
    targetEvidenceRef: valueState(targetEvidenceRef),
    existingMainVerificationRef: valueState(existingMainVerificationRef),
    existingMainVerificationEventId: valueState(mainVerificationEvent?.eventId),
    verificationOperationId: valueState(verificationOperationId),
    verificationRunId: valueState(verificationRunId),
    readinessState: valueState(readiness?.state),
    draftState: valueState(evidenceDraft?.state),
    missingInputs: projectTextItems(missingInputs),
    dryRunCommand: valueState(`pnpm --silent symphony goal gate --goal ${commandGoalId} --task ${commandTaskId} --gate main-verification --status passed --verifier <main-verifier-id> --evidence-ref ${commandEvidenceRef} --dry-run --json`),
    confirmCommandPattern: valueState(`pnpm --silent symphony goal gate --goal ${commandGoalId} --task ${commandTaskId} --gate main-verification --status passed --verifier <main-verifier-id> --evidence-ref ${commandEvidenceRef} --confirm --plan-hash sha256:<PLAN_HASH>`),
    form: available ? form : null,
    safety: {
      confirmRequiresPlanHash: valueState(true),
      appendOnlyOnConfirm: valueState(true),
      workbenchWriteAvailable: valueState(available),
      usesGoalGateOnly: valueState(true),
      requiresMainVerifierInput: valueState(true),
      readsEvidenceBodies: valueState(false),
      writesEvidenceFile: valueState(false),
      browserExecutionAvailable: valueState(false),
      modelInvocationAvailable: valueState(false),
      arbitraryShellAccepted: valueState(false),
      mergeAvailable: valueState(false),
      pushAvailable: valueState(false),
      tagAvailable: valueState(false),
      releaseReadyAvailable: valueState(false),
      selfApprovalAvailable: valueState(false),
      successImpliesGatePassed: valueState(false)
    },
    note: valueState('This path registers main-verification only through the existing goal gate dry-run and plan-hash confirm flow. It requires explicit verification evidence context and does not run commands, write evidence, merge, push, tag, declare release readiness, or self-approve.')
  };
}

function mainVerificationGateRegistrationMissingInputs({
  definition,
  goalId,
  taskId,
  readiness,
  evidenceDraft,
  targetEvidenceRef,
  existingMainVerificationRef
}) {
  const missing = [];

  if (definition === undefined) {
    missing.push('main.verification-passed goal gate form definition is missing');
  }

  if (isNonEmptyString(existingMainVerificationRef)) {
    missing.push('main-verification is already registered for this task');
  }

  if (!isNonEmptyString(goalId)) {
    missing.push('goal id is missing from explicit contracts');
  }

  if (!isNonEmptyString(taskId)) {
    missing.push('task id is missing from explicit contracts');
  }

  if (readiness?.readiness?.canEnterMainVerification?.value !== true) {
    missing.push('main verification readiness is not true');
  }

  if (evidenceDraft?.state !== 'draft-ready') {
    missing.push('main verification evidence draft is not ready');
  }

  if (!isNonEmptyString(targetEvidenceRef)) {
    missing.push('main verification evidence ref is missing');
  }

  if (evidenceDraft?.verification?.runStatus?.value !== 'passed') {
    missing.push('controlled verification run did not pass');
  }

  if (evidenceDraft?.verification?.gatePassed?.value !== false) {
    missing.push('verification operation must not already declare gate passed');
  }

  if ((evidenceDraft?.commandResults?.count?.value ?? 0) <= 0) {
    missing.push('verification command results are missing');
  }

  return missing;
}

function mainVerificationEvidenceDraftMissingInputs({
  goalId,
  taskId,
  workerEvidenceRef,
  reviewEvidenceRef,
  reviewVerdict,
  verificationOperation,
  commandResults
}) {
  const missing = [];

  if (!isNonEmptyString(goalId)) {
    missing.push('goal id is missing from explicit contracts');
  }

  if (!isNonEmptyString(taskId)) {
    missing.push('task id is missing from explicit contracts');
  }

  if (!isNonEmptyString(workerEvidenceRef)) {
    missing.push('worker evidence ref is missing');
  }

  if (!isNonEmptyString(reviewEvidenceRef)) {
    missing.push('review evidence ref is missing');
  }

  if (reviewVerdict !== 'approved') {
    missing.push('reviewer.approved verdict is missing');
  }

  if (verificationOperation === null) {
    missing.push('controlled verification operation is missing for this goal/task');
  } else {
    if (verificationOperation.commandKind !== 'verification') {
      missing.push('latest operation is not a verification operation');
    }

    if (verificationOperation.status !== 'confirmed') {
      missing.push('controlled verification operation is not confirmed');
    }

    if (verificationOperation.runResult?.status !== 'passed') {
      missing.push('controlled verification command suite did not pass');
    }

    if (!Array.isArray(commandResults) || commandResults.length === 0) {
      missing.push('verification command results are missing');
    }
  }

  return missing;
}

function mainVerificationEvidenceDraftAdoptionRefs({
  adoptionPlanOperation,
  adoptionConfirmOperation,
  adoptionInspect
}) {
  return {
    adoptionPlanOperationId: adoptionPlanOperation?.operationId,
    adoptionPlanId: firstNonEmptyString(
      adoptionConfirmOperation?.runResult?.adoptionPlanId,
      adoptionPlanOperation?.runResult?.adoptionPlanId,
      adoptionInspect?.adoptionPlanId
    ),
    adoptionPlanArtifactPath: firstNonEmptyString(
      adoptionConfirmOperation?.runResult?.adoptionPlanArtifactPath,
      adoptionPlanOperation?.runResult?.adoptionPlanArtifactPath
    ),
    adoptionConfirmOperationId: adoptionConfirmOperation?.operationId,
    adoptionConfirmStatus: firstNonEmptyString(
      adoptionConfirmOperation?.runResult?.status,
      adoptionConfirmOperation?.status,
      adoptionInspect?.latestConfirmationRun?.status
    ),
    latestConfirmationRunId: adoptionInspect?.latestConfirmationRun?.runId,
    latestConfirmationEvidenceArtifactPath: adoptionInspect?.latestConfirmationRun?.evidenceArtifactPath,
    journalStatus: adoptionInspect?.journal?.status
  };
}

function projectMainVerificationDraftOperation(operation) {
  return {
    operationId: valueState(operation?.operationId),
    status: valueState(operation?.status),
    commandKind: valueState(operation?.commandKind),
    suiteId: valueState(operation?.runResult?.suiteId),
    runId: valueState(operation?.runResult?.runId),
    runStatus: valueState(operation?.runResult?.status),
    exitCode: valueState(operation?.runResult?.exitCode),
    commandCount: valueState(operation?.runResult?.commandCount),
    failedCommandCount: valueState(operation?.runResult?.failedCommandCount),
    gatePassed: valueState(operation?.runResult?.gatePassed),
    artifactRefs: projectOperationConsoleArtifactRefs(operation?.artifactRefs),
    source: valueState(operation?.source),
    updatedAt: valueState(operation?.timestamps?.updatedAt)
  };
}

function projectMainVerificationDraftCommandResults(commandResults) {
  if (!Array.isArray(commandResults)) {
    return {
      state: 'missing',
      count: valueState(undefined),
      items: []
    };
  }

  return {
    state: commandResults.length === 0 ? 'empty' : 'available',
    count: valueState(commandResults.length),
    items: commandResults.map((result) => ({
      command: valueState(result?.command),
      status: valueState(result?.status),
      exitCode: valueState(result?.exitCode),
      stdoutSummary: textState(result?.stdoutSummary ?? ''),
      stderrSummary: textState(result?.stderrSummary ?? ''),
      startedAt: valueState(result?.startedAt),
      completedAt: valueState(result?.completedAt)
    }))
  };
}

function latestVerificationOperationForTask(operations, { goalId, taskId }) {
  if (!Array.isArray(operations?.runs)) {
    return null;
  }

  for (const run of [...operations.runs].reverse()) {
    if (
      run?.commandKind === 'verification' &&
      (!isNonEmptyString(goalId) || run.goalId === goalId) &&
      (!isNonEmptyString(taskId) || run.taskId === taskId)
    ) {
      return run;
    }
  }

  return null;
}

function expectedMainVerificationEvidenceRef(task) {
  const acceptance = Array.isArray(task?.acceptance) ? task.acceptance : [];
  const match = acceptance
    .map((line) => String(line ?? '').trim().match(/^Main verification evidence path:\s*(docs\/plans\/[^.\s]+\.md)\.?$/u))
    .find((candidate) => candidate !== null);

  return match?.[1] ?? null;
}

function buildMainVerificationEvidenceDraftMarkdown({
  goalId,
  releaseName,
  taskId,
  taskTitle,
  draftPath,
  verificationOperation,
  commandResults,
  workerEvidenceRef,
  reviewEvidenceRef,
  reviewVerdict,
  adoptionRefs,
  mainVerificationEvent
}) {
  const lines = [
    `# v31 ${taskId} main verification evidence draft`,
    '',
    'Draft status: needs operator/reviewer check before any goal gate registration.',
    '',
    `Date: 2026-06-01`,
    `Goal id: \`${goalId}\``,
    `Release name: \`${releaseName ?? 'v31 Main Verification Runner + Evidence Writer'}\``,
    `Task id: \`${taskId}\``,
    `Task title: \`${taskTitle ?? 'unknown'}\``,
    `Draft evidence path: \`${draftPath ?? 'unknown'}\``,
    '',
    '## Explicit refs used',
    '',
    `- Worker evidence: \`${workerEvidenceRef}\`.`,
    `- Review evidence: \`${reviewEvidenceRef}\`.`,
    `- Review verdict: \`${reviewVerdict}\`.`,
    `- Verification operation: \`${verificationOperation.operationId}\`.`,
    `- Verification run: \`${verificationOperation.runResult?.runId ?? 'unknown'}\`.`,
    `- Operation artifact refs: ${formatDraftArtifactRefs(verificationOperation.artifactRefs)}.`,
    `- Existing main verification event: ${mainVerificationEvent?.eventId ?? 'none'}.`,
    '',
    '## Verification command results',
    ''
  ];

  for (const result of commandResults) {
    lines.push(`- \`${result.command}\` -> status \`${result.status}\`, exit code \`${result.exitCode ?? 'null'}\`.`);
  }

  lines.push(
    '',
    '## Adoption refs',
    '',
    `- Adoption plan id: \`${adoptionRefs.adoptionPlanId ?? 'not-present'}\`.`,
    `- Adoption plan operation: \`${adoptionRefs.adoptionPlanOperationId ?? 'not-present'}\`.`,
    `- Adoption confirm operation: \`${adoptionRefs.adoptionConfirmOperationId ?? 'not-present'}\`.`,
    `- Adoption confirm status: \`${adoptionRefs.adoptionConfirmStatus ?? 'not-present'}\`.`,
    `- Adoption journal status: \`${adoptionRefs.journalStatus ?? 'not-present'}\`.`,
    '',
    '## Boundary and recovery notes',
    '',
    '- This is a draft generated from explicit Workbench contracts only.',
    '- This draft does not declare main verification passed.',
    '- This draft does not register `main.verification-passed`, reviewer approval, release readiness, or any goal event/gate.',
    '- Operator/reviewer must check the refs, command results, and recovery notes before running any separate `symphony goal gate` dry-run/confirm.',
    ''
  );

  return lines.join('\n');
}

function projectMainVerificationDraftAdoptionRefs(refs) {
  return {
    adoptionPlanOperationId: valueState(refs.adoptionPlanOperationId),
    adoptionPlanId: valueState(refs.adoptionPlanId),
    adoptionPlanArtifactPath: valueState(refs.adoptionPlanArtifactPath),
    adoptionConfirmOperationId: valueState(refs.adoptionConfirmOperationId),
    adoptionConfirmStatus: valueState(refs.adoptionConfirmStatus),
    latestConfirmationRunId: valueState(refs.latestConfirmationRunId),
    latestConfirmationEvidenceArtifactPath: valueState(refs.latestConfirmationEvidenceArtifactPath),
    journalStatus: valueState(refs.journalStatus)
  };
}

function formatDraftArtifactRefs(artifactRefs) {
  const refs = Array.isArray(artifactRefs) ? artifactRefs : [];

  if (refs.length === 0) {
    return '`none`';
  }

  return refs
    .map((artifact) => `\`${artifact?.ref ?? artifact?.uri ?? artifact?.kind ?? 'unknown'}\``)
    .join(', ');
}

function commandsFromContract(commands) {
  return Array.isArray(commands)
    ? commands.filter((command) => isNonEmptyString(command))
    : [];
}

function uniqueStrings(values) {
  return [...new Set(values.filter((value) => isNonEmptyString(value)))];
}

function isAllowlistedVerificationCommand(command, goalId) {
  return MAIN_VERIFICATION_COMMAND_ALLOWLIST.includes(command)
    || isControlledVerificationContextCommand(command, goalId);
}

function isControlledVerificationContextCommand(command, goalId) {
  if (!isNonEmptyString(goalId)) {
    return false;
  }

  return CONTROLLED_VERIFICATION_CONTEXT_COMMANDS
    .some((definition) => command === definition.command(goalId));
}

function projectVerificationPlanCommandItems({ commands, goalId }) {
  if (!Array.isArray(commands)) {
    return {
      state: 'missing',
      count: valueState(undefined),
      items: []
    };
  }

  return {
    state: commands.length === 0 ? 'empty' : 'available',
    count: valueState(commands.length),
    items: commands.map((command, index) => ({
      index: valueState(index + 1),
      command: valueState(command),
      kind: valueState(MAIN_VERIFICATION_COMMAND_ALLOWLIST.includes(command) ? 'verification' : 'controlled-context'),
      source: valueState(MAIN_VERIFICATION_COMMAND_ALLOWLIST.includes(command)
        ? 'fixed v31 verification allowlist'
        : controlledVerificationContextSource(command, goalId)),
      copyOnly: valueState(true),
      browserExecutionAvailable: valueState(false),
      acceptsArbitraryInput: valueState(false)
    }))
  };
}

function controlledVerificationContextSource(command, goalId) {
  const definition = CONTROLLED_VERIFICATION_CONTEXT_COMMANDS
    .find((candidate) => isNonEmptyString(goalId) && command === candidate.command(goalId));

  return definition?.contractName ?? 'controlled contract command';
}

function selectMainVerificationReadinessTask({ runbookTasks, ledgerTasks, nextAction }) {
  const nextTaskId = nextAction?.next?.taskId;
  const nextRole = nextAction?.next?.role;
  const nextPhase = nextAction?.next?.phase;

  if ((nextRole === 'main-verifier' || nextPhase === 'main-verification') && isNonEmptyString(nextTaskId)) {
    return runbookTasks.find((task) => task?.taskId === nextTaskId) ?? null;
  }

  const approvedTask = runbookTasks.find((task) => {
    const ledgerTask = ledgerTasks.get(task?.taskId);

    return normalizedReviewVerdict(ledgerTask?.reviewVerdict) === 'approved' &&
      !isNonEmptyString(ledgerTask?.mainVerificationRef);
  });

  if (approvedTask !== undefined) {
    return approvedTask;
  }

  if (isNonEmptyString(nextTaskId)) {
    return runbookTasks.find((task) => task?.taskId === nextTaskId) ?? null;
  }

  return runbookTasks[0] ?? null;
}

function projectReviewerApprovalReadiness({ reviewEvent, ledgerTask }) {
  const eventVerdict = reviewEvent?.eventType === 'reviewer.approved'
    ? 'approved'
    : reviewEvent?.eventType === 'reviewer.needs-revision'
      ? 'needs-revision'
      : undefined;
  const ledgerVerdict = normalizedReviewVerdict(ledgerTask?.reviewVerdict);
  const status = eventVerdict ?? ledgerVerdict ?? 'missing';
  const source = eventVerdict !== undefined
    ? GOAL_EVENT_LOG_CONTRACT_NAME
    : ledgerVerdict !== undefined
      ? GOAL_PROGRESS_LEDGER_CONTRACT_NAME
      : GOAL_EVENT_LOG_CONTRACT_NAME;

  return {
    status: valueState(status),
    approved: valueState(status === 'approved'),
    eventType: valueState(reviewEvent?.eventType ?? (status === 'approved' ? 'reviewer.approved' : undefined)),
    evidenceRef: valueState(ledgerTask?.reviewEvidenceRef ?? firstGoalEvidenceRef(reviewEvent)),
    eventId: valueState(reviewEvent?.eventId),
    actor: valueState(goalEventActorText(reviewEvent?.actor)),
    recordedAt: valueState(reviewEvent?.recordedAt),
    source: valueState(source)
  };
}

function projectMainVerificationAdoptionState({
  operations,
  adoptionInspectResult,
  adoptionInspect,
  goalId,
  taskId
}) {
  const adoptionPlanOperation = latestAdoptionPlanFreezeOperationForTask(operations, {
    goalId,
    taskId
  });
  const adoptionConfirmOperation = latestAdoptionConfirmOperationForTask(operations, {
    goalId,
    taskId,
    adoptionPlanId: adoptionPlanOperation?.runResult?.adoptionPlanId
  });
  const adoptionPlanId = firstNonEmptyString(
    adoptionConfirmOperation?.runResult?.adoptionPlanId,
    adoptionPlanOperation?.runResult?.adoptionPlanId
  );
  const inspectMatchesPlan = isNonEmptyString(adoptionPlanId) && adoptionInspect?.adoptionPlanId === adoptionPlanId;
  const inspectLatestRun = inspectMatchesPlan ? adoptionInspect?.latestConfirmationRun ?? null : null;
  const confirmStatus = firstNonEmptyString(
    adoptionConfirmOperation?.runResult?.status,
    adoptionConfirmOperation?.status,
    inspectLatestRun?.status
  );
  const hasAdoptionPlan = adoptionPlanOperation !== null || isNonEmptyString(adoptionPlanId);
  const applied = confirmStatus === 'passed' || confirmStatus === 'confirmed';
  const failed = ['failed', 'error', 'blocked'].includes(confirmStatus);
  const required = hasAdoptionPlan && applied !== true;
  const status = hasAdoptionPlan === false
    ? 'not-required'
    : applied
      ? 'applied'
      : failed
        ? 'adoption-failed'
        : 'needs-adoption';

  return {
    status: valueState(status),
    required: valueState(required),
    applied: valueState(applied),
    adoptionPlanId: valueState(adoptionPlanId),
    planOperationId: valueState(adoptionPlanOperation?.operationId),
    planOperationStatus: valueState(adoptionPlanOperation?.status),
    confirmOperationId: valueState(adoptionConfirmOperation?.operationId),
    confirmOperationStatus: valueState(adoptionConfirmOperation?.status),
    confirmationRunStatus: valueState(confirmStatus),
    inspectRouteState: valueState(adoptionInspectResult?.ok === true ? 'ready' : adoptionInspectResult?.ok === false ? 'unavailable' : 'not-fetched'),
    inspectStatus: valueState(inspectMatchesPlan ? adoptionInspect?.status : undefined),
    journalStatus: valueState(inspectMatchesPlan ? adoptionInspect?.journal?.status ?? 'missing' : undefined),
    currentWorktreeMatchesAfterHash: valueState(inspectMatchesPlan ? adoptionInspect?.currentWorktreeMatchesAfterHash : undefined),
    currentWorktreeMatchesJournalBeforeFiles: valueState(inspectMatchesPlan ? adoptionInspect?.currentWorktreeMatchesJournalBeforeFiles : undefined),
    source: valueState(hasAdoptionPlan ? 'goal-operation-runs.v1 + symphony.console-adoption-inspect' : 'goal-operation-runs.v1'),
    note: valueState(hasAdoptionPlan
      ? 'A frozen adoption plan exists for this task; main verification waits until explicit adoption-confirm state is passed.'
      : 'No explicit adoption plan is registered for this task, so adoption does not block main verification readiness.')
  };
}

function normalizedReviewVerdict(value) {
  if (value === 'APPROVED' || value === 'approved') {
    return 'approved';
  }

  if (value === 'NEEDS_REVISION' || value === 'needs-revision') {
    return 'needs-revision';
  }

  return undefined;
}

function mainVerificationReadinessReason({
  targetTask,
  reviewerApproval,
  adoptionState,
  mainVerificationEvent,
  missingCloseoutKinds,
  blockerReasons
}) {
  if (targetTask === null || targetTask === undefined) {
    return 'No runbook task is available for main verification readiness.';
  }

  if (mainVerificationEvent?.eventType === 'main.verification-passed') {
    return `${targetTask.taskId} already has main.verification-passed.`;
  }

  if (blockerReasons.length > 0) {
    return `${targetTask.taskId} is not ready: ${blockerReasons.join('; ')}.`;
  }

  if (reviewerApproval.status.value === 'approved') {
    return `${targetTask.taskId} has reviewer.approved${adoptionState.status.value === 'applied' ? ' and adoption-confirm passed' : ''}; main verification can start after the terminal ff-only main merge check.`;
  }

  if (reviewerApproval.status.value === 'needs-revision') {
    return `${targetTask.taskId} has reviewer.needs-revision; main verification must wait.`;
  }

  if (missingCloseoutKinds.includes('review-evidence')) {
    return `${targetTask.taskId} is missing review evidence in goal closeout.`;
  }

  return `${targetTask.taskId} is waiting for explicit reviewer.approved evidence.`;
}

function mainVerificationBlockerReasons({
  reviewerApproval,
  adoptionState,
  mainVerificationEvent,
  missingCloseoutKinds
}) {
  const reasons = [];

  if (mainVerificationEvent?.eventType === 'main.verification-passed') {
    reasons.push('main.verification-passed is already recorded');
  }

  if (mainVerificationEvent?.eventType === 'main.verification-failed') {
    reasons.push('latest main verification event failed; worker revision is required');
  }

  if (reviewerApproval.status.value === 'needs-revision') {
    reasons.push('latest reviewer verdict is needs-revision');
  } else if (reviewerApproval.approved.value !== true) {
    reasons.push('reviewer.approved is missing');
  }

  if (adoptionState.status.value === 'needs-adoption') {
    reasons.push('a frozen adoption plan exists but adoption-confirm has not passed');
  }

  if (adoptionState.status.value === 'adoption-failed') {
    reasons.push('latest adoption-confirm state failed');
  }

  if (missingCloseoutKinds.includes('review-evidence') && reviewerApproval.approved.value !== true) {
    reasons.push('goal closeout still reports missing review evidence');
  }

  return reasons;
}

function ffOnlyMergeCommands() {
  return [
    'git checkout main',
    'git pull --ff-only',
    'git merge --ff-only <reviewed-task-branch>'
  ];
}

function projectGoalOperationConsole({ result, operations, nextAction }) {
  const runs = Array.isArray(operations?.runs) ? operations.runs : null;
  const latestRun = runs === null || runs.length === 0 ? null : runs.at(-1);
  const next = nextAction?.next;
  const polling = projectOperationConsolePolling({
    result,
    operations,
    latestRun
  });

  if (result?.ok !== true && operations === null) {
    return {
      state: 'unavailable',
      contractName: valueState(GOAL_OPERATION_RUNS_CONTRACT_NAME),
      contractVersion: valueState(undefined),
      goalId: valueState(undefined),
      storage: valueState(undefined),
      operationCount: valueState(undefined),
      latestOperationId: valueState(undefined),
      nextAction: projectOperationConsoleNextAction(nextAction),
      latest: projectOperationConsoleRun(null),
      items: [],
      polling,
      note: 'Goal Operation Console displays the managed operation registry and controlled goal command API results. It does not run shell commands, infer approvals, or mark release readiness.'
    };
  }

  return {
    state: runs === null ? 'missing' : runs.length === 0 ? 'empty' : 'available',
    contractName: valueState(operations?.contractName ?? GOAL_OPERATION_RUNS_CONTRACT_NAME),
    contractVersion: valueState(operations?.contractVersion),
    goalId: valueState(operations?.goalId),
    storage: valueState(operations?.storage),
    operationCount: valueState(operations?.operationCount ?? runs?.length),
    latestOperationId: valueState(operations?.latestOperationId),
    nextAction: {
      taskId: valueState(next?.taskId),
      role: valueState(next?.role),
      phase: valueState(next?.phase),
      status: valueState(nextAction?.status),
      reason: valueState(nextAction?.reason ?? next?.reason)
    },
    latest: projectOperationConsoleRun(latestRun),
    items: runs === null ? [] : runs.map((run) => projectOperationConsoleRun(run)),
    polling,
    note: 'Goal Operation Console shows command preview, controlled API stdout/stderr, exit code, plan hash, event ids, and the current goal next action. The output is derived from Workbench goal operation contracts and goal next; it is not a generic shell runner.'
  };
}

function projectOperationConsolePolling({ result, operations, latestRun }) {
  const routePath = isNonEmptyString(result?.routeDescriptor?.path)
    ? result.routeDescriptor.path
    : isNonEmptyString(result?.route)
      ? result.route
      : undefined;
  const routeReady = result?.ok === true && isNonEmptyString(routePath);
  const latestStatus = latestRun?.status;
  const reason = routeReady
    ? latestRun === null || latestRun === undefined
      ? 'near-live polling keeps the operation console ready for the next Workbench goal operation'
      : `near-live polling refreshes managed operation output after status ${latestStatus ?? MISSING_TEXT}`
    : 'operation polling waits until the scoped operations route is available';

  return {
    enabled: valueState(routeReady),
    route: valueState(routePath),
    intervalMs: valueState(routeReady ? 2500 : undefined),
    source: valueState('GET goal-operation-runs.v1'),
    latestStatus: valueState(latestStatus),
    operationCount: valueState(operations?.operationCount),
    reason: valueState(reason)
  };
}

function projectOperationConsoleRun(run) {
  if (run === null || run === undefined) {
    return {
      state: 'missing',
      operationId: valueState(undefined),
      commandPreview: valueState(undefined),
      stdout: textState(MISSING_TEXT),
      stderr: textState(MISSING_TEXT),
      exitCode: valueState(undefined),
      status: valueState(undefined),
      planHash: valueState(undefined),
      eventIds: textState(MISSING_TEXT),
      runResult: projectOperationConsoleRunResult(null),
      artifactRefs: projectOperationConsoleArtifactRefs([]),
      verifierSummary: projectOperationConsoleVerifierSummary(null),
      failureReason: valueState(undefined),
      updatedAt: valueState(undefined)
    };
  }

  const eventIds = Array.isArray(run.eventIds) ? run.eventIds : [];
  const commandPreview = operationRunCommandPreview(run);
  const fallbackStdout = [
    `status=${run.status ?? MISSING_TEXT}`,
    `planHash=${run.planHash ?? MISSING_TEXT}`,
    eventIds.length > 0 ? `eventIds=${eventIds.join(',')}` : 'eventIds=none'
  ].join('\n');
  const stdout = isNonEmptyString(run.output?.stdout) ? run.output.stdout : fallbackStdout;
  const stderr = typeof run.output?.stderr === 'string' ? run.output.stderr : '';
  const exitCode = Number.isInteger(run.output?.exitCode) ? run.output.exitCode : 0;

  return {
    state: 'available',
    operationId: valueState(run.operationId),
    commandPreview: valueState(commandPreview),
    stdout: textState(stdout),
    stderr: textState(stderr),
    exitCode: valueState(exitCode),
    goalId: valueState(run.goalId),
    taskId: valueState(run.taskId),
    role: valueState(run.role),
    commandKind: valueState(run.commandKind),
    commandName: valueState(run.commandName),
    status: valueState(run.status),
    planHash: valueState(run.planHash),
    eventIds: textState(eventIds.length > 0 ? eventIds.join('、') : '无'),
    runResult: projectOperationConsoleRunResult(run.runResult),
    artifactRefs: projectOperationConsoleArtifactRefs(run.artifactRefs),
    verifierSummary: projectOperationConsoleVerifierSummary(run.verifierSummary),
    failureReason: valueState(run.failureReason),
    source: valueState(run.source),
    startedAt: valueState(run.timestamps?.startedAt),
    updatedAt: valueState(run.timestamps?.updatedAt),
    completedAt: valueState(run.timestamps?.completedAt)
  };
}

function operationRunCommandPreview(run) {
  if (run?.commandKind === 'implementation') {
    const planId = firstNonEmptyString(
      run?.runResult?.executionPlanId,
      run?.runResult?.plannedRunId,
      '<plan-id>'
    );

    return `symphony do --confirm-plan ${planId} --json`;
  }

  if (run?.commandKind === 'verification') {
    return `controlled verification suite --goal ${run?.goalId ?? '<goal-id>'} --task ${run?.taskId ?? '<task-id>'}`;
  }

  const parts = [
    isNonEmptyString(run?.commandName) ? run.commandName : `symphony goal ${run?.commandKind ?? '<command>'}`,
    '--goal',
    run?.goalId ?? '<goal-id>'
  ];

  if (isNonEmptyString(run?.taskId)) {
    parts.push('--task', run.taskId);
  }

  if (run?.status === 'confirmed') {
    parts.push('--confirm');
  } else {
    parts.push('--dry-run');
  }

  if (isNonEmptyString(run?.planHash)) {
    parts.push('--plan-hash', run.planHash);
  }

  return parts.join(' ');
}

function projectOperationConsoleRunResult(runResult) {
  return {
    runId: valueState(runResult?.runId),
    suiteId: valueState(runResult?.suiteId),
    plannedRunId: valueState(runResult?.plannedRunId),
    executionPlanId: valueState(runResult?.executionPlanId),
    status: valueState(runResult?.status),
    exitCode: valueState(runResult?.exitCode),
    commandCount: valueState(runResult?.commandCount),
    failedCommandCount: valueState(runResult?.failedCommandCount),
    gatePassed: valueState(runResult?.gatePassed),
    verifierStatus: valueState(runResult?.verifierStatus),
    writeBoundary: valueState(runResult?.writeBoundary),
    mainWorktreeWrites: valueState(runResult?.mainWorktreeWrites),
    workspaceWrites: valueState(runResult?.workspaceWrites),
    sourceWorkspacePath: valueState(runResult?.sourceWorkspacePath),
    sourceWorkspaceManifestPath: valueState(runResult?.sourceWorkspaceManifestPath),
    evidenceArtifactPath: valueState(runResult?.evidenceArtifactPath)
  };
}

function projectOperationConsoleArtifactRefs(artifactRefs) {
  const refs = Array.isArray(artifactRefs) ? artifactRefs : [];

  return {
    count: valueState(refs.length),
    text: textState(refs.length === 0 ? MISSING_TEXT : refs.map((artifact) => artifact.kind ?? artifact.path ?? artifact.ref).join('、')),
    items: refs.map((artifact) => ({
      kind: valueState(artifact?.kind),
      path: valueState(artifact?.path),
      ref: valueState(artifact?.ref),
      uri: valueState(artifact?.uri),
      status: valueState(artifact?.status)
    }))
  };
}

function projectOperationConsoleVerifierSummary(summary) {
  return {
    status: valueState(summary?.status),
    runStatus: valueState(summary?.runStatus),
    passed: valueState(summary?.passed),
    changedFileCount: valueState(summary?.changedFileCount),
    artifactCount: valueState(summary?.artifactCount),
    failureReason: valueState(summary?.failureReason)
  };
}

function projectOperationConsoleNextAction(nextAction) {
  return {
    taskId: valueState(nextAction?.next?.taskId),
    role: valueState(nextAction?.next?.role),
    phase: valueState(nextAction?.next?.phase),
    status: valueState(nextAction?.status),
    reason: valueState(nextAction?.reason ?? nextAction?.next?.reason)
  };
}

function projectActiveGoalViewModel({
  statusResult,
  status,
  runbookResult,
  runbook,
  nextActionResult,
  nextAction,
  promptPackResult,
  promptPack,
  closeoutResult,
  closeout
}) {
  const goalId = firstNonEmptyString(
    runbook?.goalId,
    nextAction?.goalId,
    promptPack?.goalId,
    closeout?.goalId,
    status?.goalId
  );
  const goalTitle = firstNonEmptyString(runbook?.goalTitle, status?.goalTitle);
  const commandInventory = projectActiveGoalCommandInventory({
    goalId,
    sourceResults: {
      goalStatus: statusResult,
      goalNext: nextActionResult,
      goalPrompt: promptPackResult,
      goalCloseout: closeoutResult
    }
  });
  const unavailableCount = commandInventory.items.filter((item) => item.routeState.value !== 'ready').length;

  return {
    state: commandInventory.items.length === 0
      ? 'missing'
      : unavailableCount > 0 ? 'partial' : 'available',
    modelName: valueState(ACTIVE_GOAL_VIEW_MODEL_NAME),
    goalId: valueState(goalId),
    goalTitle: valueState(goalTitle),
    baseline: valueState('latest-goal-command-contracts'),
    commandCount: valueState(commandInventory.items.length),
    unavailableCommandCount: valueState(unavailableCount),
    status: {
      contractName: valueState(status?.contractName ?? GOAL_PROGRESS_LEDGER_CONTRACT_NAME),
      routeState: valueState(routeStateFromResult(statusResult)),
      summary: projectGoalProgressSummary(status?.summary),
      releaseReady: valueState(status?.summary?.releaseReady)
    },
    next: {
      contractName: valueState(nextAction?.contractName ?? GOAL_NEXT_ACTION_CONTRACT_NAME),
      routeState: valueState(routeStateFromResult(nextActionResult)),
      taskId: valueState(nextAction?.next?.taskId),
      role: valueState(nextAction?.next?.role),
      phase: valueState(nextAction?.next?.phase),
      reason: valueState(nextAction?.reason ?? nextAction?.next?.reason)
    },
    prompt: {
      contractName: valueState(promptPack?.contractName ?? GOAL_PROMPT_PACK_CONTRACT_NAME),
      routeState: valueState(routeStateFromResult(promptPackResult)),
      promptCount: valueState(Array.isArray(promptPack?.prompts) ? promptPack.prompts.length : undefined),
      copyOnlyCount: valueState(Array.isArray(promptPack?.prompts)
        ? promptPack.prompts.filter((prompt) => prompt?.copyOnly === true).length
        : undefined)
    },
    closeout: {
      contractName: valueState(closeout?.contractName ?? GOAL_CLOSEOUT_REPORT_CONTRACT_NAME),
      routeState: valueState(routeStateFromResult(closeoutResult)),
      missingCount: valueState(Array.isArray(closeout?.missing) ? closeout.missing.length : undefined),
      releaseReady: valueState(closeout?.summary?.releaseReady)
    },
    commandInventory,
    note: 'ActiveGoalViewModel 的主操作模型只来自 goal-status、goal next、goal prompt 和 goal closeout contracts；不把历史 command list 当 Workbench 顶层 action baseline。'
  };
}

function projectActiveGoalCommandInventory({ goalId, sourceResults }) {
  const commandGoalId = isNonEmptyString(goalId) ? goalId : '<goal-id>';
  const resultByCommandId = {
    goalStatus: sourceResults.goalStatus,
    goalNext: sourceResults.goalNext,
    goalPrompt: sourceResults.goalPrompt,
    goalCloseout: sourceResults.goalCloseout
  };

  return {
    state: 'available',
    count: valueState(ACTIVE_GOAL_COMMAND_BASELINE.length),
    items: ACTIVE_GOAL_COMMAND_BASELINE.map((command) => {
      const result = resultByCommandId[command.id];

      return {
        id: valueState(command.id),
        label: valueState(command.label),
        contractName: valueState(command.contractName),
        routeId: valueState(command.routeId),
        route: valueState(result?.route),
        routeState: valueState(routeStateFromResult(result)),
        httpStatus: valueState(result?.httpStatus),
        command: valueState(command.command.replace('<goal-id>', commandGoalId))
      };
    })
  };
}

function projectActionRegistryPanel({
  manifestResult,
  manifest,
  availabilityResult,
  availability,
  previewResult,
  preview,
  nextAction
}) {
  const manifestActions = Array.isArray(manifest?.actions) ? manifest.actions : [];
  const availabilityActions = Array.isArray(availability?.actions) ? availability.actions : [];
  const previewActions = Array.isArray(preview?.actions) ? preview.actions : [];
  const actionIds = uniqueNonEmptyStrings([
    ...manifestActions.map((action) => action?.action_id),
    ...availabilityActions.map((action) => action?.action_id),
    ...previewActions.map((action) => action?.action_id)
  ]);
  const routeStates = {
    manifest: valueState(routeStateFromResult(manifestResult)),
    availability: valueState(routeStateFromResult(availabilityResult)),
    preview: valueState(routeStateFromResult(previewResult))
  };
  const unavailableCount = actionIds.filter((actionId) => {
    const availabilityAction = availabilityActions.find((action) => action?.action_id === actionId);
    const previewAction = previewActions.find((action) => action?.action_id === actionId);
    const state = previewAction?.state ?? availabilityAction?.state;

    return state !== 'available';
  }).length;

  return {
    state: actionIds.length === 0
      ? 'missing'
      : unavailableCount > 0 ? 'partial' : 'available',
    modelName: valueState(ACTION_REGISTRY_PANEL_MODEL_NAME),
    goalId: valueState(firstNonEmptyString(preview?.context?.goalId, availability?.context?.goalId, manifest?.context?.goalId)),
    taskId: valueState(firstNonEmptyString(preview?.context?.taskId, availability?.context?.taskId, manifest?.context?.taskId, nextAction?.next?.taskId)),
    sourcePolicy: valueState('action-manifest.v1 + action-availability.v1 + action-preview.v1'),
    actionCount: valueState(actionIds.length),
    unavailableActionCount: valueState(unavailableCount),
    routeStates,
    endpoint: {
      method: valueState(preview?.endpoint?.method),
      route: valueState(preview?.endpoint?.route),
      allowedQueryFields: arrayTextState(preview?.endpoint?.allowedQueryFields),
      writesInPreview: valueState(preview?.endpoint?.writesInPreview),
      genericShellRunner: valueState(preview?.endpoint?.genericShellRunner)
    },
    boundaries: {
      actionExecutionAvailable: valueState(preview?.boundaries?.actionExecutionAvailable ?? availability?.boundaries?.actionExecutionAvailable ?? manifest?.boundaries?.actionExecutionAvailable),
      jobQueueAvailable: valueState(preview?.boundaries?.jobQueueAvailable ?? availability?.boundaries?.jobQueueAvailable ?? manifest?.boundaries?.jobQueueAvailable),
      arbitraryCommandExecutionAvailable: valueState(preview?.boundaries?.arbitraryCommandExecutionAvailable ?? availability?.boundaries?.arbitraryCommandExecutionAvailable ?? manifest?.boundaries?.arbitraryCommandExecutionAvailable),
      modelInvocationAvailable: valueState(preview?.boundaries?.modelInvocationAvailable ?? availability?.boundaries?.modelInvocationAvailable ?? manifest?.boundaries?.modelInvocationAvailable),
      gitWriteAvailable: valueState(preview?.boundaries?.gitWriteAvailable ?? availability?.boundaries?.gitWriteAvailable ?? manifest?.boundaries?.gitWriteAvailable),
      publishAvailable: valueState(preview?.boundaries?.publishAvailable ?? availability?.boundaries?.publishAvailable ?? manifest?.boundaries?.publishAvailable),
      selfApprovalAvailable: valueState(preview?.boundaries?.selfApprovalAvailable ?? availability?.boundaries?.selfApprovalAvailable ?? manifest?.boundaries?.selfApprovalAvailable)
    },
    actions: {
      state: actionIds.length === 0 ? 'empty' : 'available',
      items: actionIds.map((actionId) => projectActionRegistryItem({
        actionId,
        manifestAction: manifestActions.find((action) => action?.action_id === actionId),
        availabilityAction: availabilityActions.find((action) => action?.action_id === actionId),
        previewAction: previewActions.find((action) => action?.action_id === actionId)
      }))
    },
    blockers: Array.isArray(preview?.blockers)
      ? preview.blockers.map((blocker) => ({
          code: valueState(blocker?.code),
          message: valueState(blocker?.message),
          source: valueState(blocker?.source)
        }))
      : [],
    note: 'ActionRegistryPanel renders backend-declared actions from action-manifest, action-availability, and action-preview contracts only; it does not synthesize shell commands or attach execution handlers.'
  };
}

function projectActionRegistryItem({
  actionId,
  manifestAction,
  availabilityAction,
  previewAction
}) {
  const reasons = Array.isArray(previewAction?.reasons)
    ? previewAction.reasons
    : Array.isArray(availabilityAction?.reasons) ? availabilityAction.reasons : [];
  const requiredConfirmation = previewAction?.requiredConfirmation ?? {};
  const capability = previewAction?.capability ?? {};
  const impactPreview = previewAction?.impactPreview ?? {};

  return {
    actionId: valueState(actionId),
    label: valueState(previewAction?.label ?? availabilityAction?.label ?? manifestAction?.label),
    scope: valueState(previewAction?.scope ?? availabilityAction?.scope ?? manifestAction?.scope),
    role: valueState(previewAction?.role ?? availabilityAction?.role ?? manifestAction?.role),
    state: valueState(previewAction?.state ?? availabilityAction?.state ?? manifestAction?.availability?.defaultState),
    previewContract: valueState(capability.previewContract ?? manifestAction?.capabilityPreview?.contractName),
    confirmationContract: valueState(requiredConfirmation.confirmationContract ?? manifestAction?.eventMapping?.confirmationContract),
    commandName: valueState(requiredConfirmation.commandName ?? manifestAction?.eventMapping?.commandName),
    requiredInputs: arrayTextState(requiredConfirmation.requiredInputs ?? availabilityAction?.requiredInputs),
    missingContext: arrayTextState(previewAction?.missingContext ?? availabilityAction?.missingContext),
    eventTypes: arrayTextState(requiredConfirmation.eventTypes ?? [
      manifestAction?.eventMapping?.primaryEventType,
      ...(Array.isArray(manifestAction?.eventMapping?.alternateEventTypes) ? manifestAction.eventMapping.alternateEventTypes : [])
    ].filter((eventType) => eventType !== null && eventType !== undefined)),
    requiresPlanHash: valueState(requiredConfirmation.requiresPlanHash),
    writesInPreview: valueState(impactPreview.writesInPreview),
    writesGoalEventOnConfirm: valueState(impactPreview.writesGoalEventOnConfirm),
    executionAvailable: valueState(impactPreview.executionAvailable ?? manifestAction?.execution?.enabled),
    reasons: reasons.map((reason) => ({
      code: valueState(reason?.code),
      message: valueState(reason?.message),
      source: valueState(reason?.source)
    }))
  };
}

export function projectSubagentHandoffBoard({
  progressResult,
  progress,
  eventsResult,
  eventLog,
  nextResult,
  nextAction,
  closeoutResult,
  closeout
} = {}) {
  const progressTasks = Array.isArray(progress?.tasks) ? progress.tasks : null;
  const events = Array.isArray(eventLog?.events) ? eventLog.events : [];
  const closeoutMissing = Array.isArray(closeout?.missing) ? closeout.missing : [];
  const activeNext = nextAction?.next;

  return {
    state: progressTasks === null ? 'missing' : progressTasks.length === 0 ? 'empty' : 'available',
    goalId: valueState(firstNonEmptyString(progress?.goalId, eventLog?.goalId, nextAction?.goalId, closeout?.goalId)),
    goalTitle: valueState(firstNonEmptyString(progress?.goalTitle, eventLog?.goalTitle)),
    taskCount: valueState(progressTasks === null ? undefined : progressTasks.length),
    sourcePolicy: valueState('goal-event-log.v1 + goal-progress-ledger.v1 + goal-next-action.v1 + goal-closeout-report.v1'),
    routeStates: {
      goalStatus: valueState(routeStateFromResult(progressResult)),
      eventLog: valueState(routeStateFromResult(eventsResult)),
      goalNext: valueState(routeStateFromResult(nextResult)),
      goalCloseout: valueState(routeStateFromResult(closeoutResult))
    },
    next: {
      taskId: valueState(activeNext?.taskId),
      role: valueState(activeNext?.role),
      phase: valueState(activeNext?.phase),
      reason: valueState(nextAction?.reason ?? activeNext?.reason)
    },
    closeout: {
      missingCount: valueState(closeoutMissing.length),
      workerEvidenceComplete: valueState(closeout?.summary?.workerEvidenceComplete),
      reviewEvidenceComplete: valueState(closeout?.summary?.reviewEvidenceComplete),
      mainVerificationComplete: valueState(closeout?.summary?.mainVerificationComplete),
      releaseReady: valueState(closeout?.summary?.releaseReady)
    },
    items: progressTasks === null ? [] : progressTasks.map((task) => projectSubagentHandoffTask({
      task,
      events,
      activeNext,
      closeoutMissing
    })),
    note: 'Subagent Handoff Board uses goal events for worker started, goal-status/events for evidence and verdicts, goal next for the current handoff role, and goal closeout for missing handoff gaps. It does not read branch names, file names, commit messages, prompt text, or command text as task status.'
  };
}

function projectGoalDraftHandoffPanel({
  result,
  handoff,
  nextAction
}) {
  const blockers = Array.isArray(handoff?.blockers) ? handoff.blockers : [];
  const draftTasks = Array.isArray(handoff?.runbookDraft?.tasks) ? handoff.runbookDraft.tasks : [];

  return {
    state: result?.ok === true
      ? blockers.length > 0 ? 'blocked' : handoff?.goalDraft?.state ?? 'available'
      : 'missing',
    modelName: valueState('GoalDraftHandoffPanel'),
    contractName: valueState(handoff?.contractName ?? GOAL_DRAFT_HANDOFF_CONTRACT_NAME),
    contractVersion: valueState(handoff?.contractVersion),
    goalId: valueState(handoff?.context?.goalId),
    taskId: valueState(handoff?.context?.taskId ?? nextAction?.next?.taskId),
    routeState: valueState(routeStateFromResult(result)),
    sourcePolicy: valueState('goal-draft-handoff.v1 + goal-runbook.v1 + goal-next-action.v1 + goal-progress-ledger.v1 + goal-prompt-pack.v1'),
    routing: {
      category: valueState(handoff?.routing?.category),
      acceptedSignals: arrayTextState(handoff?.routing?.acceptedSignals),
      excludedCategories: arrayTextState(handoff?.routing?.excludedCategories)
    },
    goalDraft: {
      state: valueState(handoff?.goalDraft?.state),
      suggestedGoalId: valueState(handoff?.goalDraft?.suggestedGoalId),
      suggestedTitle: valueState(handoff?.goalDraft?.suggestedTitle),
      registrationState: valueState(handoff?.goalDraft?.registrationState),
      operatorReviewRequired: valueState(handoff?.goalDraft?.operatorReviewRequired),
      draftOnly: valueState(handoff?.goalDraft?.draftOnly)
    },
    runbookDraft: {
      contractName: valueState(handoff?.runbookDraft?.contractName),
      draftOnly: valueState(handoff?.runbookDraft?.draftOnly),
      autoRegister: valueState(handoff?.runbookDraft?.autoRegister),
      taskCount: valueState(draftTasks.length),
      releaseGates: arrayTextState(handoff?.runbookDraft?.releaseGates)
    },
    handoff: {
      markdown: valueState(handoff?.handoff?.markdown),
      checklist: {
        state: Array.isArray(handoff?.handoff?.checklist) && handoff.handoff.checklist.length > 0 ? 'available' : 'empty',
        items: Array.isArray(handoff?.handoff?.checklist)
          ? handoff.handoff.checklist.map((item) => textState(item))
          : []
      },
      copyOnlyCommands: {
        state: Array.isArray(handoff?.handoff?.copyOnlyCommands) && handoff.handoff.copyOnlyCommands.length > 0 ? 'available' : 'empty',
        items: Array.isArray(handoff?.handoff?.copyOnlyCommands)
          ? handoff.handoff.copyOnlyCommands.map((command) => textState(command))
          : []
      },
      nextRequiredAction: valueState(handoff?.handoff?.nextRequiredAction)
    },
    endpoint: {
      method: valueState(handoff?.endpoint?.method),
      route: valueState(handoff?.endpoint?.route),
      allowedQueryFields: arrayTextState(handoff?.endpoint?.allowedQueryFields),
      writesInPreview: valueState(handoff?.endpoint?.writesInPreview),
      registersGoal: valueState(handoff?.endpoint?.registersGoal)
    },
    boundaries: {
      readOnly: valueState(handoff?.boundaries?.readOnly),
      draftOnly: valueState(handoff?.boundaries?.draftOnly),
      writesFiles: valueState(handoff?.boundaries?.writesFiles),
      registersGoal: valueState(handoff?.boundaries?.registersGoal),
      runsGoalInit: valueState(handoff?.boundaries?.runsGoalInit),
      arbitraryCommandExecutionAvailable: valueState(handoff?.boundaries?.arbitraryCommandExecutionAvailable),
      modelInvocationAvailable: valueState(handoff?.boundaries?.modelInvocationAvailable),
      gitWriteAvailable: valueState(handoff?.boundaries?.gitWriteAvailable),
      selfApprovalAvailable: valueState(handoff?.boundaries?.selfApprovalAvailable),
      releaseReadyDeclared: valueState(handoff?.boundaries?.releaseReadyDeclared),
      statusSource: valueState(handoff?.boundaries?.statusSource)
    },
    blockers: blockers.map((blocker) => ({
      code: valueState(blocker?.code),
      message: valueState(blocker?.message),
      source: valueState(blocker?.source)
    })),
    note: 'Goal Draft Handoff is a display-only bridge from captured/project-scoped work to a reviewed goal/runbook draft. It does not register a goal, write files, run goal init, invoke models, or infer completion state.'
  };
}

function projectSubagentHandoffTask({
  task,
  events,
  activeNext,
  closeoutMissing
}) {
  const taskId = task?.taskId;
  const taskEvents = events.filter((event) => event?.taskId === taskId);
  const workerStartedEvent = latestEventOfTypes(taskEvents, ['worker.started']);
  const workerEvidenceEvent = latestEventOfTypes(taskEvents, ['worker.evidence-recorded']);
  const reviewEvent = latestEventOfTypes(taskEvents, ['reviewer.approved', 'reviewer.needs-revision']);
  const mainVerificationEvent = latestEventOfTypes(taskEvents, ['main.verification-passed', 'main.verification-failed']);
  const missingKinds = closeoutMissing
    .filter((item) => item?.taskId === taskId)
    .map((item) => item?.kind)
    .filter((kind) => isNonEmptyString(kind));
  const isCurrentNext = taskId === activeNext?.taskId;

  return {
    taskId: valueState(taskId),
    title: valueState(task?.title),
    ledgerStatus: valueState(task?.status),
    statusSource: valueState(task?.statusSource),
    currentHandoff: {
      active: valueState(isCurrentNext),
      role: isCurrentNext ? valueState(activeNext?.role) : valueState(undefined),
      phase: isCurrentNext ? valueState(activeNext?.phase) : valueState(undefined),
      reason: isCurrentNext ? valueState(activeNext?.reason) : valueState(undefined),
      source: valueState(isCurrentNext ? GOAL_NEXT_ACTION_CONTRACT_NAME : 'goal-next-action.v1:not-current-next')
    },
    workerStarted: projectHandoffEventCell({
      event: workerStartedEvent,
      completeText: 'started',
      missingText: 'missing',
      missingKind: null,
      sourceWhenMissing: GOAL_EVENT_LOG_CONTRACT_NAME
    }),
    workerEvidence: projectHandoffEvidenceCell({
      ledgerValue: task?.workerEvidenceRef,
      event: workerEvidenceEvent,
      completeText: 'recorded',
      missingText: 'missing',
      missingKind: 'worker-evidence',
      missingKinds
    }),
    reviewerVerdict: projectHandoffVerdictCell({
      ledgerValue: task?.reviewVerdict,
      event: reviewEvent,
      missingKind: 'review-evidence',
      missingKinds
    }),
    mainVerification: projectHandoffMainVerificationCell({
      ledgerValue: task?.mainVerificationRef,
      event: mainVerificationEvent,
      missingKind: 'main-verification',
      missingKinds
    }),
    closeoutMissingKinds: arrayTextState(missingKinds, '无')
  };
}

function projectHandoffEventCell({
  event,
  completeText,
  missingText,
  missingKind,
  missingKinds,
  sourceWhenMissing
}) {
  const closeoutMissing = missingKind !== null && Array.isArray(missingKinds) && missingKinds.includes(missingKind);

  return {
    status: valueState(event === null ? (closeoutMissing ? 'missing-closeout' : missingText) : completeText),
    eventId: valueState(event?.eventId),
    eventType: valueState(event?.eventType),
    actor: valueState(goalEventActorText(event?.actor)),
    recordedAt: valueState(event?.recordedAt),
    evidenceRef: valueState(firstGoalEvidenceRef(event)),
    source: valueState(event === null
      ? closeoutMissing ? GOAL_CLOSEOUT_REPORT_CONTRACT_NAME : sourceWhenMissing
      : GOAL_EVENT_LOG_CONTRACT_NAME)
  };
}

function projectHandoffEvidenceCell({
  ledgerValue,
  event,
  completeText,
  missingText,
  missingKind,
  missingKinds
}) {
  const eventEvidenceRef = firstGoalEvidenceRef(event);
  const evidenceRef = firstNonEmptyString(ledgerValue, eventEvidenceRef);
  const closeoutMissing = Array.isArray(missingKinds) && missingKinds.includes(missingKind);
  const source = isNonEmptyString(ledgerValue)
    ? GOAL_PROGRESS_LEDGER_CONTRACT_NAME
    : event !== null
      ? GOAL_EVENT_LOG_CONTRACT_NAME
      : closeoutMissing
        ? GOAL_CLOSEOUT_REPORT_CONTRACT_NAME
        : GOAL_PROGRESS_LEDGER_CONTRACT_NAME;

  return {
    status: valueState(evidenceRef === undefined ? (closeoutMissing ? 'missing-closeout' : missingText) : completeText),
    evidenceRef: valueState(evidenceRef),
    eventId: valueState(event?.eventId),
    eventType: valueState(event?.eventType),
    source: valueState(source)
  };
}

function projectHandoffVerdictCell({
  ledgerValue,
  event,
  missingKind,
  missingKinds
}) {
  const eventVerdict = explicitReviewVerdictState(event).value;
  const verdict = firstNonEmptyString(ledgerValue, eventVerdict === MATRIX_UNKNOWN_TEXT ? undefined : eventVerdict);
  const closeoutMissing = Array.isArray(missingKinds) && missingKinds.includes(missingKind);
  const source = isNonEmptyString(ledgerValue)
    ? GOAL_PROGRESS_LEDGER_CONTRACT_NAME
    : event !== null
      ? GOAL_EVENT_LOG_CONTRACT_NAME
      : closeoutMissing
        ? GOAL_CLOSEOUT_REPORT_CONTRACT_NAME
        : GOAL_PROGRESS_LEDGER_CONTRACT_NAME;

  return {
    status: valueState(verdict === undefined ? (closeoutMissing ? 'missing-closeout' : 'missing') : verdict),
    verdict: valueState(verdict),
    evidenceRef: valueState(firstGoalEvidenceRef(event)),
    eventId: valueState(event?.eventId),
    eventType: valueState(event?.eventType),
    source: valueState(source)
  };
}

function projectHandoffMainVerificationCell({
  ledgerValue,
  event,
  missingKind,
  missingKinds
}) {
  const eventStatus = explicitGateStatusState(event).value;
  const explicitEventStatus = eventStatus === MATRIX_UNKNOWN_TEXT ? undefined : eventStatus;
  const value = explicitEventStatus ?? (isNonEmptyString(ledgerValue) ? 'recorded' : undefined);
  const closeoutMissing = Array.isArray(missingKinds) && missingKinds.includes(missingKind);
  let source = GOAL_PROGRESS_LEDGER_CONTRACT_NAME;

  if (explicitEventStatus !== undefined) {
    source = GOAL_EVENT_LOG_CONTRACT_NAME;
  } else if (isNonEmptyString(ledgerValue)) {
    source = GOAL_PROGRESS_LEDGER_CONTRACT_NAME;
  } else if (event !== null) {
    source = GOAL_EVENT_LOG_CONTRACT_NAME;
  } else if (closeoutMissing) {
    source = GOAL_CLOSEOUT_REPORT_CONTRACT_NAME;
  }

  return {
    status: valueState(value === undefined ? (closeoutMissing ? 'missing-closeout' : 'missing') : value),
    evidenceRef: valueState(ledgerValue ?? firstGoalEvidenceRef(event)),
    eventId: valueState(event?.eventId),
    eventType: valueState(event?.eventType),
    source: valueState(source)
  };
}

function projectActiveGoalTaskQueue({
  runbook,
  ledger,
  eventLog,
  nextAction
}) {
  const runbookTasks = Array.isArray(runbook?.tasks) ? runbook.tasks : null;
  const ledgerTasks = new Map(
    (Array.isArray(ledger?.tasks) ? ledger.tasks : [])
      .map((task) => [task.taskId, task])
  );
  const events = Array.isArray(eventLog?.events) ? eventLog.events : [];
  const activeNext = nextAction?.next;

  return {
    state: runbookTasks === null ? 'missing' : runbookTasks.length === 0 ? 'empty' : 'available',
    goalId: valueState(runbook?.goalId ?? ledger?.goalId ?? nextAction?.goalId),
    goalTitle: valueState(runbook?.goalTitle ?? ledger?.goalTitle),
    totalTasks: valueState(runbookTasks === null ? undefined : runbookTasks.length),
    completedTasks: valueState(ledger?.summary?.completedTasks),
    blockedTasks: valueState(ledger?.summary?.blockedTasks),
    needsReviewTasks: valueState(ledger?.summary?.needsReviewTasks),
    needsRevisionTasks: valueState(ledger?.summary?.needsRevisionTasks),
    nextTaskId: valueState(activeNext?.taskId),
    nextRole: valueState(activeNext?.role),
    nextPhase: valueState(activeNext?.phase),
    nextReason: valueState(nextAction?.reason ?? activeNext?.reason),
    sourcePolicy: valueState('goal-runbook.v1 + goal-progress-ledger.v1 + goal-event-log.v1 + goal-next-action.v1'),
    items: runbookTasks === null ? [] : runbookTasks.map((task, index) => projectActiveGoalTaskQueueItem({
      task,
      index,
      ledgerTask: ledgerTasks.get(task?.taskId) ?? null,
      events,
      activeNext
    })),
    note: 'Task Queue 使用 runbook task 顺序、ledger status/statusSource、events timeline 和 goal-next-action；不根据 branch、文件名、task title、prompt 或 command text 判断任务状态。'
  };
}

function projectActiveGoalTaskQueueItem({
  task,
  index,
  ledgerTask,
  events,
  activeNext
}) {
  const latestEvent = latestGoalTaskEvent(events, task?.taskId);
  const progressSource = explicitTaskProgressSource(ledgerTask);

  return {
    position: valueState(index + 1),
    taskId: valueState(task?.taskId),
    title: valueState(task?.title),
    status: valueState(ledgerTask?.status),
    statusSource: valueState(ledgerTask?.statusSource),
    progressSource: valueState(progressSource),
    eventBacked: valueState(latestEvent !== null || isGoalEventStatusSource(ledgerTask?.statusSource)),
    latestEventId: valueState(latestEvent?.eventId),
    latestEventType: valueState(latestEvent?.eventType),
    latestEventSequence: valueState(latestEvent?.sequence),
    nextRole: task?.taskId === activeNext?.taskId ? valueState(activeNext?.role) : valueState(undefined),
    nextPhase: task?.taskId === activeNext?.taskId ? valueState(activeNext?.phase) : valueState(undefined),
    workerEvidenceRef: valueState(ledgerTask?.workerEvidenceRef),
    reviewEvidenceRef: valueState(ledgerTask?.reviewEvidenceRef),
    reviewVerdict: valueState(ledgerTask?.reviewVerdict),
    mainVerificationRef: valueState(ledgerTask?.mainVerificationRef),
    expectedWorker: expectedEvidenceState(task?.expectedEvidence?.worker),
    expectedReviewer: expectedEvidenceState(task?.expectedEvidence?.reviewer),
    expectedMainVerifier: expectedEvidenceState(task?.expectedEvidence?.mainVerifier),
    roleOrder: arrayTextState(task?.roleOrder),
    acceptance: arrayTextState(task?.acceptance),
    blockers: projectBlockers(ledgerTask?.blockers)
  };
}

function latestGoalTaskEvent(events, taskId) {
  if (!isNonEmptyString(taskId)) {
    return null;
  }

  for (let index = events.length - 1; index >= 0; index -= 1) {
    if (events[index]?.taskId === taskId) {
      return events[index];
    }
  }

  return null;
}

function explicitTaskProgressSource(ledgerTask) {
  if (ledgerTask === null || ledgerTask === undefined) {
    return MISSING_TEXT;
  }

  return isGoalEventStatusSource(ledgerTask.statusSource)
    ? 'event-backed goal-progress-ledger.v1'
    : 'goal-progress-ledger.v1';
}

function projectGoalRunbook({
  result,
  runbook,
  ledger,
  eventLog,
  ledgerResult,
  eventLogResult
}) {
  const tasks = Array.isArray(runbook?.tasks) ? runbook.tasks : null;
  const ledgerTasks = new Map(
    (Array.isArray(ledger?.tasks) ? ledger.tasks : [])
      .map((task) => [task.taskId, task])
  );
  const eventTaskIds = new Set(
    (Array.isArray(eventLog?.events) ? eventLog.events : [])
      .map((event) => event?.taskId)
      .filter((taskId) => isNonEmptyString(taskId))
  );

  if (result?.ok !== true) {
    return {
      state: 'unavailable',
      contractName: valueState(GOAL_RUNBOOK_CONTRACT_NAME),
      contractVersion: valueState(undefined),
      goalId: valueState(undefined),
      goalTitle: valueState(undefined),
      baselineTag: valueState(undefined),
      baselineCommit: valueState(undefined),
      baselineEvidenceRef: valueState(undefined),
      taskCount: valueState(undefined),
      releaseGateCount: valueState(undefined),
      ledgerRouteState: valueState(ledgerResult?.skipped === true ? 'skipped' : ledgerResult?.ok === true ? 'ready' : undefined),
      eventRouteState: valueState(eventLogResult?.skipped === true ? 'skipped' : eventLogResult?.ok === true ? 'ready' : undefined),
      tasks: {
        state: 'missing',
        count: valueState(undefined),
        items: []
      },
      releaseGates: [],
      rolePolicy: [],
      errorEnvelope: projectErrorEnvelope(result?.errorEnvelope),
      note: 'Active Goal Runbook panel 只展示 goal-runbook.v1 与 active goal ledger/events routes 已暴露字段；task status 缺失时保持未暴露。'
    };
  }

  return {
    state: runbook === null || runbook === undefined ? 'missing' : 'available',
    contractName: valueState(runbook?.contractName),
    contractVersion: valueState(runbook?.contractVersion),
    goalId: valueState(runbook?.goalId),
    goalTitle: valueState(runbook?.goalTitle),
    baselineTag: valueState(runbook?.baseline?.tag),
    baselineCommit: valueState(runbook?.baseline?.commit),
    baselineEvidenceRef: valueState(runbook?.baseline?.evidenceRef),
    taskCount: valueState(tasks === null ? undefined : tasks.length),
    releaseGateCount: valueState(Array.isArray(runbook?.releaseGates) ? runbook.releaseGates.length : undefined),
    ledgerRouteState: valueState(ledgerResult?.skipped === true ? 'skipped' : ledgerResult?.ok === true ? 'ready' : undefined),
    eventRouteState: valueState(eventLogResult?.skipped === true ? 'skipped' : eventLogResult?.ok === true ? 'ready' : undefined),
    tasks: {
      state: tasks === null ? 'missing' : tasks.length === 0 ? 'empty' : 'available',
      count: valueState(tasks === null ? undefined : tasks.length),
      items: tasks === null ? [] : tasks.map((task) => {
        const ledgerTask = ledgerTasks.get(task?.taskId) ?? null;

        return {
          taskId: valueState(task?.taskId),
          title: valueState(task?.title),
          branch: valueState(task?.branch),
          roleOrder: arrayTextState(task?.roleOrder),
          acceptance: arrayTextState(task?.acceptance),
          expectedWorker: expectedEvidenceState(task?.expectedEvidence?.worker),
          expectedReviewer: expectedEvidenceState(task?.expectedEvidence?.reviewer),
          expectedMainVerifier: expectedEvidenceState(task?.expectedEvidence?.mainVerifier),
          status: valueState(ledgerTask?.status),
          statusSource: valueState(ledgerTask?.statusSource),
          workerEvidenceRef: valueState(ledgerTask?.workerEvidenceRef),
          reviewEvidenceRef: valueState(ledgerTask?.reviewEvidenceRef),
          reviewVerdict: valueState(ledgerTask?.reviewVerdict),
          mainVerificationRef: valueState(ledgerTask?.mainVerificationRef),
          eventBacked: valueState(eventTaskIds.has(task?.taskId)),
          copyOnlyCommands: arrayTextState(task?.copyOnlyCommands),
          blockers: projectBlockers(ledgerTask?.blockers)
        };
      })
    },
    releaseGates: Array.isArray(runbook?.releaseGates)
      ? runbook.releaseGates.map((gate) => ({
          gate: valueState(gate),
          status: valueState('required')
        }))
      : [],
    rolePolicy: Object.entries(runbook?.rolePolicy ?? {}).map(([policy, enabled]) => ({
      policy: valueState(policy),
      enabled: valueState(enabled)
    })),
    errorEnvelope: projectErrorEnvelope(null),
    note: 'Task status、statusSource 和 evidence refs 来自 active goal progress/events routes；Workbench 不根据 prompt、branch、文件名或命令文本推断完成状态。'
  };
}

function projectGoalNextAction({
  result,
  nextAction,
  runbook,
  ledger,
  eventLog,
  latestRun,
  operations
}) {
  if (result?.ok !== true) {
    return {
      state: 'unavailable',
      contractName: valueState(GOAL_NEXT_ACTION_CONTRACT_NAME),
      contractVersion: valueState(undefined),
      goalId: valueState(undefined),
      status: valueState(undefined),
      reason: valueState(undefined),
      next: projectGoalNextDetails(undefined),
      evidenceState: projectGoalNextEvidenceState(undefined),
      copyOnlyPrompt: projectGoalNextCopyOnlyPrompt(undefined),
      copyOnlyCommands: projectTextItems(undefined),
      afterCompletion: projectAfterCompletion(undefined),
      eventForms: projectGoalEventFormModel(undefined),
      safety: projectGoalControlSafety(undefined),
      errorEnvelope: projectErrorEnvelope(result?.errorEnvelope),
      note: 'Next Action Card 只展示 goal-next-action.v1；route 不可用时不从其他文本推断下一步。'
    };
  }

  return {
    state: nextAction === null || nextAction === undefined ? 'missing' : 'available',
    contractName: valueState(nextAction?.contractName),
    contractVersion: valueState(nextAction?.contractVersion),
    goalId: valueState(nextAction?.goalId),
    status: valueState(nextAction?.status),
    reason: valueState(nextAction?.reason ?? nextAction?.next?.reason),
    next: projectGoalNextDetails(nextAction?.next),
    evidenceState: projectGoalNextEvidenceState(nextAction?.evidenceState),
    copyOnlyPrompt: projectGoalNextCopyOnlyPrompt(nextAction?.copyOnlyPrompt),
    copyOnlyCommands: projectTextItems(nextAction?.copyOnlyCommands),
    afterCompletion: projectAfterCompletion(nextAction?.afterCompletion),
    eventForms: projectGoalEventFormModel(nextAction, {
      runbook,
      ledger,
      eventLog,
      latestRun,
      operations
    }),
    safety: projectGoalControlSafety(nextAction?.safety),
    errorEnvelope: projectErrorEnvelope(null),
    note: 'Next Action Card 使用 resolver 输出的 task、role、phase、reason 和 afterCompletion；浏览器端不运行命令、不登记事件。'
  };
}

function projectGoalPromptPreview({ result, promptPack, nextAction }) {
  const prompts = Array.isArray(promptPack?.prompts) ? promptPack.prompts : null;
  const copyOnlyPrompts = prompts === null
    ? []
    : prompts.filter((prompt) => prompt?.copyOnly === true && isNonEmptyString(prompt?.text));
  const fallbackPrompt = nextAction?.copyOnlyPrompt?.available === true && isNonEmptyString(nextAction?.copyOnlyPrompt?.text)
    ? [{
        taskId: nextAction?.next?.taskId,
        role: nextAction?.next?.role,
        title: 'Copy-only prompt from goal-next-action.v1',
        format: nextAction.copyOnlyPrompt.format,
        text: nextAction.copyOnlyPrompt.text,
        sourceContract: GOAL_NEXT_ACTION_CONTRACT_NAME
      }]
    : [];
  const visiblePrompts = copyOnlyPrompts.length > 0
    ? copyOnlyPrompts.map((prompt) => ({
        ...prompt,
        sourceContract: GOAL_PROMPT_PACK_CONTRACT_NAME
      }))
    : fallbackPrompt;

  if (result?.ok !== true && fallbackPrompt.length === 0) {
    return {
      state: 'unavailable',
      contractName: valueState(GOAL_PROMPT_PACK_CONTRACT_NAME),
      contractVersion: valueState(undefined),
      goalId: valueState(undefined),
      promptCount: valueState(undefined),
      visibleCount: valueState(0),
      hiddenCount: valueState(undefined),
      safety: projectGoalControlSafety(undefined),
      items: [],
      errorEnvelope: projectErrorEnvelope(result?.errorEnvelope),
      note: 'Prompt Preview 只展示 copyOnly=true 的 prompt text；prompt pack 不可用时不拼接、不生成、不执行 prompt。'
    };
  }

  return {
    state: visiblePrompts.length === 0 ? 'empty' : 'available',
    contractName: valueState(promptPack?.contractName ?? (fallbackPrompt.length > 0 ? GOAL_NEXT_ACTION_CONTRACT_NAME : undefined)),
    contractVersion: valueState(promptPack?.contractVersion ?? (fallbackPrompt.length > 0 ? 1 : undefined)),
    goalId: valueState(promptPack?.goalId ?? nextAction?.goalId),
    promptCount: valueState(prompts === null ? undefined : prompts.length),
    visibleCount: valueState(visiblePrompts.length),
    hiddenCount: valueState(prompts === null ? undefined : prompts.length - copyOnlyPrompts.length),
    safety: projectGoalControlSafety(promptPack?.safety ?? nextAction?.safety),
    items: visiblePrompts.map((prompt) => ({
      taskId: valueState(prompt?.taskId),
      role: valueState(prompt?.role),
      phase: valueState(prompt?.phase ?? prompt?.roleGuidance?.phase),
      title: valueState(prompt?.title),
      format: valueState(prompt?.format),
      sourceContract: valueState(prompt?.sourceContract),
      text: valueState(prompt?.text),
      revisionContext: projectRevisionPromptContext(prompt?.revisionContext)
    })),
    errorEnvelope: projectErrorEnvelope(null),
    note: 'Prompt Preview 只把 copy-only text 放进可选择文本块；没有执行、confirm、下载、打开文件或模型调用入口。'
  };
}

function projectRevisionPromptContext(revisionContext) {
  const available = revisionContext !== null && typeof revisionContext === 'object';

  return {
    state: valueState(available ? revisionContext.state ?? 'available' : 'missing'),
    triggerEventType: valueState(revisionContext?.trigger?.eventType),
    triggerEventId: valueState(revisionContext?.trigger?.eventId),
    blockerCount: valueState(Array.isArray(revisionContext?.blockers) ? revisionContext.blockers.length : undefined),
    recordedFailedCommandCount: valueState(Array.isArray(revisionContext?.failedCommands?.recorded) ? revisionContext.failedCommands.recorded.length : undefined),
    rerunCommandCount: valueState(Array.isArray(revisionContext?.failedCommands?.rerun) ? revisionContext.failedCommands.rerun.length : undefined),
    changedFileCount: valueState(Array.isArray(revisionContext?.changedFiles?.items) ? revisionContext.changedFiles.items.length : undefined),
    acceptanceDeltaCount: valueState(Array.isArray(revisionContext?.acceptanceDelta) ? revisionContext.acceptanceDelta.length : undefined)
  };
}

function projectGoalCloseoutGaps({
  result,
  closeout,
  releaseBaselineResult,
  releaseBaseline,
  runbook,
  ledger,
  eventLog,
  latestRun,
  readiness
}) {
  const missing = Array.isArray(closeout?.missing) ? closeout.missing : null;
  const goalId = firstNonEmptyString(closeout?.goalId, runbook?.goalId, ledger?.goalId);
  const projectedReleaseBaseline = projectReleaseBaselineResolver({
    result: releaseBaselineResult,
    releaseBaseline,
    readiness,
    closeout,
    goalId,
    runbook,
    ledger,
    eventLog
  });

  if (result?.ok !== true) {
    return {
      state: 'unavailable',
      modelName: valueState(RELEASE_CLOSEOUT_WORKSPACE_MODEL_NAME),
      contractName: valueState(GOAL_CLOSEOUT_REPORT_CONTRACT_NAME),
      contractVersion: valueState(undefined),
      goalId: valueState(undefined),
      generatedAt: valueState(undefined),
      summary: projectCloseoutSummary(undefined),
      missing: {
        state: 'missing',
        count: valueState(undefined),
        items: []
      },
      releaseGates: [],
      releaseBaseline: projectedReleaseBaseline,
      verificationChecklist: projectReleaseVerificationChecklist({
        closeout: null,
        goalId,
        runbook,
        ledger,
        eventLog,
        latestRun
      }),
      releaseReadyGate: projectReleaseReadyGateRegistration({
        closeout: null,
        goalId,
        runbook,
        ledger,
        eventLog,
        latestRun,
        releaseBaseline: projectedReleaseBaseline
      }),
      releaseEvidenceDraft: projectReleaseEvidenceDraft({
        closeout: null,
        goalId,
        runbook,
        ledger,
        eventLog,
        releaseBaseline: projectedReleaseBaseline,
        verificationChecklist: null
      }),
      tagEvidencePrompt: projectTagEvidencePrompt({
        closeout: null,
        goalId,
        runbook,
        ledger,
        eventLog,
        releaseBaseline: projectedReleaseBaseline
      }),
      nextVersionHandoffDraft: projectNextVersionHandoffDraft({
        closeout: null,
        goalId,
        runbook,
        ledger,
        eventLog,
        latestRun,
        releaseBaseline: projectedReleaseBaseline,
        releaseEvidenceDraft: null,
        tagEvidencePrompt: null,
        verificationChecklist: null
      }),
      nextAction: valueState(undefined),
      safety: projectGoalCloseoutSafety(undefined),
      errorEnvelope: projectErrorEnvelope(result?.errorEnvelope),
      note: 'Closeout Gaps 只展示 goal-closeout-report.v1；route 不可用时不从 prompt 或路径推断 release 状态。'
    };
  }

  return {
    state: closeout === null || closeout === undefined ? 'missing' : 'available',
    modelName: valueState(RELEASE_CLOSEOUT_WORKSPACE_MODEL_NAME),
    contractName: valueState(closeout?.contractName),
    contractVersion: valueState(closeout?.contractVersion),
    goalId: valueState(closeout?.goalId),
    generatedAt: valueState(closeout?.generatedAt),
    summary: projectCloseoutSummary(closeout?.summary),
    missing: {
      state: missing === null ? 'missing' : missing.length === 0 ? 'empty' : 'available',
      count: valueState(missing === null ? undefined : missing.length),
      items: missing === null ? [] : missing.map((item) => ({
        kind: valueState(item?.kind),
        taskId: valueState(item?.taskId),
        expectedEvent: valueState(item?.expectedEvent),
        gate: valueState(item?.gate),
        gateId: valueState(item?.gateId),
        status: valueState(item?.status)
      }))
    },
    releaseGates: Object.entries(closeout?.releaseGates ?? {}).map(([gate, status]) => ({
      gate: valueState(gate),
      status: valueState(status)
    })),
    releaseBaseline: projectedReleaseBaseline,
    verificationChecklist: projectReleaseVerificationChecklist({
      closeout,
      goalId,
      runbook,
      ledger,
      eventLog,
      latestRun
    }),
    releaseReadyGate: projectReleaseReadyGateRegistration({
      closeout,
      goalId,
      runbook,
      ledger,
      eventLog,
      latestRun,
      releaseBaseline: projectedReleaseBaseline
    }),
    releaseEvidenceDraft: projectReleaseEvidenceDraft({
      closeout,
      goalId,
      runbook,
      ledger,
      eventLog,
      releaseBaseline: projectedReleaseBaseline,
      verificationChecklist: projectReleaseVerificationChecklist({
        closeout,
        goalId,
        runbook,
        ledger,
        eventLog,
        latestRun
      })
    }),
    tagEvidencePrompt: projectTagEvidencePrompt({
      closeout,
      goalId,
      runbook,
      ledger,
      eventLog,
      releaseBaseline: projectedReleaseBaseline
    }),
    nextVersionHandoffDraft: projectNextVersionHandoffDraft({
      closeout,
      goalId,
      runbook,
      ledger,
      eventLog,
      latestRun,
      releaseBaseline: projectedReleaseBaseline,
      verificationChecklist: projectReleaseVerificationChecklist({
        closeout,
        goalId,
        runbook,
        ledger,
        eventLog,
        latestRun
      }),
      releaseEvidenceDraft: projectReleaseEvidenceDraft({
        closeout,
        goalId,
        runbook,
        ledger,
        eventLog,
        releaseBaseline: projectedReleaseBaseline,
        verificationChecklist: projectReleaseVerificationChecklist({
          closeout,
          goalId,
          runbook,
          ledger,
          eventLog,
          latestRun
        })
      }),
      tagEvidencePrompt: projectTagEvidencePrompt({
        closeout,
        goalId,
        runbook,
        ledger,
        eventLog,
        releaseBaseline: projectedReleaseBaseline
      })
    }),
    nextAction: valueState(closeout?.nextAction),
    safety: projectGoalCloseoutSafety(closeout?.safety),
    errorEnvelope: projectErrorEnvelope(null),
    note: 'Closeout Gaps 使用 goal-closeout-report.v1 的 missing items、releaseGates、verification checklist、release.ready registration form、release evidence draft、tag evidence draft 和 next-version handoff draft；不从命令输出、prompt、branch 或路径推断 release 状态。'
  };
}

function projectReleaseBaselineResolver({
  result,
  releaseBaseline,
  readiness,
  closeout,
  goalId,
  runbook,
  ledger,
  eventLog
}) {
  if (releaseBaseline !== null && releaseBaseline !== undefined) {
    return projectCommandOutputReleaseBaselineResolver({
      result,
      releaseBaseline,
      goalId,
      ledger,
      eventLog
    });
  }

  const git = readiness?.tools?.git;
  const github = readiness?.tools?.github;
  const ciLatest = github?.ci?.latest;
  const commandGoalId = isNonEmptyString(goalId) ? goalId : '<goal-id>';
  const gitAvailable = git?.status === 'available';
  const currentBranch = git?.branch;
  const worktreeDirty = git?.dirty === true;
  const nonMainBranch = gitAvailable && currentBranch !== 'main';
  const refsDiverged = isNonEmptyString(git?.mainHead) &&
    isNonEmptyString(git?.originMainHead) &&
    git.mainHead !== git.originMainHead;
  const stopReasons = releaseBaselineStopReasons({
    gitAvailable,
    currentBranch,
    worktreeDirty,
    refsDiverged,
    git
  });
  const state = !gitAvailable
    ? git?.status === undefined ? 'missing' : 'blocked'
    : stopReasons.length > 0 ? 'blocked' : 'ready';
  const releaseReadinessAllowed = state === 'ready';
  const explicitEventCount = Array.isArray(eventLog?.events) ? eventLog.events.length : undefined;
  const mainVerifiedCount = Array.isArray(ledger?.tasks)
    ? ledger.tasks.filter((task) => isNonEmptyString(task?.mainVerificationRef)).length
    : undefined;

  return {
    state,
    modelName: valueState(RELEASE_BASELINE_RESOLVER_MODEL_NAME),
    sourcePolicy: valueState('symphony.console-readiness git/GitHub command output + goal-closeout-report.v1 + goal-progress-ledger.v1'),
    goalId: valueState(goalId),
    closeoutState: valueState(closeout === null || closeout === undefined ? undefined : 'available'),
    currentBranch: valueState(currentBranch),
    currentHead: valueState(git?.head),
    currentHeadFull: valueState(git?.currentHead),
    mainHead: valueState(git?.mainHead),
    originMainHead: valueState(git?.originMainHead),
    worktree: {
      clean: valueState(gitAvailable ? worktreeDirty !== true : undefined),
      dirty: valueState(git?.dirty),
      dirtyFilesCount: valueState(git?.dirtyFilesCount),
      dirtyPaths: projectTextItems(Array.isArray(git?.dirtyPaths) ? git.dirtyPaths : [])
    },
    prCiRef: {
      status: valueState(github?.ci?.status),
      workflowName: valueState(ciLatest?.workflowName),
      displayTitle: valueState(ciLatest?.displayTitle),
      headBranch: valueState(ciLatest?.headBranch),
      headSha: valueState(ciLatest?.headSha),
      conclusion: valueState(ciLatest?.conclusion),
      createdAt: valueState(ciLatest?.createdAt),
      source: valueState(github?.ci?.status === 'available'
        ? 'gh run list --limit 1 --json status,conclusion,workflowName,displayTitle,headBranch,headSha,createdAt,databaseId'
        : github?.ci?.reason ?? github?.ci?.message ?? github?.status)
    },
    judgment: {
      releaseReadinessAllowed: valueState(releaseReadinessAllowed),
      stopReason: valueState(stopReasons.length > 0 ? stopReasons.join('; ') : 'clean main baseline is available'),
      finalJudgmentFromFallbackCheckout: valueState(false),
      explicitEventCount: valueState(explicitEventCount),
      mainVerifiedTaskCount: valueState(mainVerifiedCount)
    },
    fixGuidance: projectTextItems(releaseBaselineFixGuidance({
      gitAvailable,
      worktreeDirty,
      nonMainBranch,
      refsDiverged,
      commandGoalId
    })),
    copyOnlyCommands: projectTextItems(releaseBaselineCopyOnlyCommands({
      gitAvailable,
      worktreeDirty,
      nonMainBranch,
      refsDiverged,
      commandGoalId
    })),
    safety: {
      readOnly: valueState(true),
      copyOnly: valueState(true),
      browserExecutionAvailable: valueState(false),
      genericShellRunner: valueState(false),
      modelInvocationAvailable: valueState(false),
      releaseReadyBlockedWhenDirtyOrNonMain: valueState(true),
      infersReadinessFromBranchName: valueState(false),
      infersReadinessFromCommandText: valueState(false)
    },
    note: valueState('Release Baseline Resolver shows backend git/GitHub command outputs before release closeout. Dirty, non-main, unavailable git, or diverged main/origin refs block release-ready registration and show stop/fix guidance only.')
  };
}

function projectCommandOutputReleaseBaselineResolver({
  result,
  releaseBaseline,
  goalId,
  ledger,
  eventLog
}) {
  const baseline = releaseBaseline?.releaseBaseline ?? {};
  const activeContext = releaseBaseline?.activeContext ?? {};
  const blockers = Array.isArray(releaseBaseline?.blockers) ? releaseBaseline.blockers : [];
  const commandOutputs = Array.isArray(releaseBaseline?.commandOutputs) ? releaseBaseline.commandOutputs : [];
  const dirtyPaths = Array.isArray(baseline.dirtyPaths) ? baseline.dirtyPaths : [];
  const explicitEventCount = Array.isArray(eventLog?.events) ? eventLog.events.length : undefined;
  const mainVerifiedCount = Array.isArray(ledger?.tasks)
    ? ledger.tasks.filter((task) => isNonEmptyString(task?.mainVerificationRef)).length
    : undefined;
  const releaseReadinessAllowed = releaseBaseline?.status === 'ready';
  const stopReason = blockers.length > 0
    ? blockers.map((blocker) => blocker?.detail).filter(isNonEmptyString).join('; ')
    : releaseReadinessAllowed ? 'clean main baseline is available' : releaseBaseline?.decision;

  return {
    state: releaseBaseline?.status === 'ready' ? 'ready' : releaseBaseline?.status === 'stopped' ? 'blocked' : result?.ok === true ? 'available' : 'missing',
    modelName: valueState(RELEASE_BASELINE_RESOLVER_MODEL_NAME),
    sourcePolicy: valueState('release-baseline-resolver.v1 fixed backend git command outputs + active goal context'),
    contractName: valueState(releaseBaseline?.contractName),
    contractVersion: valueState(releaseBaseline?.contractVersion),
    goalId: valueState(releaseBaseline?.goalId ?? goalId),
    taskId: valueState(releaseBaseline?.taskId),
    role: valueState(releaseBaseline?.role),
    phase: valueState(releaseBaseline?.phase),
    reason: valueState(releaseBaseline?.reason),
    activeTaskTitle: valueState(activeContext.activeTaskTitle),
    activeTaskBranch: valueState(activeContext.activeTaskBranch),
    activeTaskExpectedWorkerEvent: valueState(activeContext.activeTaskExpectedWorkerEvent),
    currentWorkerEvidenceRef: valueState(activeContext.currentWorkerEvidenceRef),
    currentReviewEvidenceRef: valueState(activeContext.currentReviewEvidenceRef),
    currentMainVerificationRef: valueState(activeContext.currentMainVerificationRef),
    currentBranch: valueState(baseline.currentBranch),
    currentHead: valueState(baseline.currentHead),
    currentHeadFull: valueState(baseline.currentHead),
    mainHead: valueState(baseline.mainHead),
    originMainHead: valueState(baseline.originMain),
    worktree: {
      clean: valueState(baseline.worktreeClean),
      dirty: valueState(baseline.worktreeClean === undefined ? undefined : baseline.worktreeClean !== true),
      dirtyFilesCount: valueState(baseline.dirtyFileCount),
      dirtyPaths: projectTextItems(dirtyPaths)
    },
    prCiRef: {
      status: valueState(baseline.prCiRef?.state),
      workflowName: valueState(undefined),
      displayTitle: valueState(baseline.prCiRef?.fullRef),
      headBranch: valueState(baseline.prCiRef?.refName),
      headSha: valueState(baseline.prCiRef?.sha),
      conclusion: valueState(undefined),
      createdAt: valueState(undefined),
      source: valueState(baseline.prCiRef?.source)
    },
    judgment: {
      releaseReadinessAllowed: valueState(releaseReadinessAllowed),
      stopReason: valueState(stopReason),
      finalJudgmentFromFallbackCheckout: valueState(false),
      explicitEventCount: valueState(explicitEventCount),
      mainVerifiedTaskCount: valueState(mainVerifiedCount)
    },
    blockers: {
      state: blockers.length === 0 ? 'empty' : 'available',
      count: valueState(blockers.length),
      items: blockers.map((blocker) => ({
        id: valueState(blocker?.id),
        status: valueState(blocker?.status),
        detail: valueState(blocker?.detail)
      }))
    },
    commandOutputs: {
      state: commandOutputs.length === 0 ? 'empty' : 'available',
      count: valueState(commandOutputs.length),
      items: commandOutputs.map((output) => ({
        id: valueState(output?.id),
        command: valueState(output?.command),
        status: valueState(output?.status),
        exitCode: valueState(output?.exitCode),
        stdout: valueState(output?.stdout),
        stderr: valueState(output?.stderr)
      }))
    },
    fixGuidance: projectTextItems(releaseBaseline?.fixGuidance),
    copyOnlyCommands: projectTextItems(activeContext.copyOnlyCommands),
    safety: {
      readOnly: valueState(releaseBaseline?.safety?.readOnly),
      copyOnly: valueState(releaseBaseline?.safety?.copyOnly),
      browserExecutionAvailable: valueState(releaseBaseline?.safety?.browserExecutionAvailable),
      genericShellRunner: valueState(releaseBaseline?.safety?.genericShellRunner),
      modelInvocationAvailable: valueState(releaseBaseline?.safety?.modelInvocationAvailable),
      releaseReadyBlockedWhenDirtyOrNonMain: valueState(releaseBaseline?.safety?.dirtyOrNonMainIsFinalReadiness === false),
      infersReadinessFromBranchName: valueState(false),
      infersReadinessFromCommandText: valueState(false)
    },
    note: valueState(releaseBaseline?.note)
  };
}

function releaseBaselineStopReasons({
  gitAvailable,
  currentBranch,
  worktreeDirty,
  refsDiverged,
  git
}) {
  const reasons = [];

  if (!gitAvailable) {
    reasons.push('git baseline command output is unavailable');
    return reasons;
  }

  if (currentBranch !== 'main') {
    reasons.push(`current branch is ${currentBranch ?? 'missing'}, not main`);
  }

  if (worktreeDirty) {
    reasons.push(`${git?.dirtyFilesCount ?? 0} dirty file(s) in worktree`);
  }

  if (refsDiverged) {
    reasons.push(`main ${git.mainHead} differs from origin/main ${git.originMainHead}`);
  }

  return reasons;
}

function releaseBaselineFixGuidance({
  gitAvailable,
  worktreeDirty,
  nonMainBranch,
  refsDiverged,
  commandGoalId
}) {
  if (!gitAvailable) {
    return [
      'Stop release judgment until git baseline commands are available.',
      'Run `git rev-parse --is-inside-work-tree` from the repository checkout and restart Workbench if needed.'
    ];
  }

  const guidance = [];

  if (worktreeDirty) {
    guidance.push('Stop release judgment. Review uncommitted files and decide whether to commit, move, or discard them outside Workbench.');
  }

  if (nonMainBranch) {
    guidance.push('Stop release judgment on this checkout. Switch to a clean `main` checkout and fast-forward before running release closeout.');
  }

  if (refsDiverged) {
    guidance.push('Stop release judgment until `main` and `origin/main` resolve to the same release baseline ref.');
  }

  if (guidance.length === 0) {
    guidance.push(`Clean main baseline is visible. Continue with \`pnpm --silent symphony goal closeout --goal ${commandGoalId} --markdown\` and explicit release gate evidence.`);
  }

  return guidance;
}

function releaseBaselineCopyOnlyCommands({
  gitAvailable,
  worktreeDirty,
  nonMainBranch,
  refsDiverged,
  commandGoalId
}) {
  if (!gitAvailable) {
    return ['git rev-parse --is-inside-work-tree'];
  }

  const commands = [
    'git branch --show-current',
    'git rev-parse --short HEAD',
    'git rev-parse --short main',
    'git rev-parse --short origin/main',
    'git status --short'
  ];

  if (worktreeDirty) {
    commands.push('git diff --stat');
  }

  if (nonMainBranch || refsDiverged) {
    commands.push('git fetch origin');
    commands.push('git pull --ff-only origin main');
  }

  commands.push('gh run list --limit 1 --json status,conclusion,workflowName,displayTitle,headBranch,headSha,createdAt,databaseId');
  commands.push(`pnpm --silent symphony goal closeout --goal ${commandGoalId} --markdown`);

  return uniqueStrings(commands);
}

function projectReleaseVerificationChecklist({
  closeout,
  goalId,
  runbook,
  ledger,
  eventLog,
  latestRun
}) {
  const commandGoalId = isNonEmptyString(goalId) ? goalId : '<goal-id>';
  const releaseGates = closeout?.releaseGates ?? {};
  const events = Array.isArray(eventLog?.events) ? eventLog.events : [];
  const evidenceRefHelper = projectEvidenceRefHelper({
    runbook,
    ledger,
    eventLog,
    latestRun
  });
  const items = RELEASE_VERIFICATION_CHECKLIST.map((item) => {
    const gateStatus = releaseGateStatusText(releaseGates[item.gateId]);
    const latestGateEvent = latestReleaseGateEventForGate(events, item.gate);
    const evidenceRefs = projectGoalEvidenceRefs(latestGateEvent?.evidenceRefs);
    const registration = projectReleaseGateRegistration({
      item,
      goalId,
      gateStatus,
      latestGateEvent,
      evidenceRefHelper
    });

    return {
      id: valueState(item.id),
      label: valueState(item.label),
      gate: valueState(item.gate),
      gateId: valueState(item.gateId),
      status: valueState(gateStatus),
      eventBackedStatus: valueState(latestGateEvent === null ? false : true),
      latestEventId: valueState(latestGateEvent?.eventId),
      latestEventType: valueState(latestGateEvent?.eventType),
      latestRecordedAt: valueState(latestGateEvent?.recordedAt),
      latestVerifier: valueState(latestGateEvent?.actor?.id),
      evidenceRefs,
      command: valueState(item.command),
      registrationCommand: valueState(registration.dryRunCommand.value),
      dryRunCommand: registration.dryRunCommand,
      confirmCommandPattern: registration.confirmCommandPattern,
      registration,
      needsEvidence: valueState(gateStatus !== 'passed')
    };
  });
  const pendingCount = items.filter((item) => item.status.value !== 'passed').length;

  return {
    state: closeout === null || closeout === undefined ? 'missing' : 'available',
    sourceContract: valueState(GOAL_CLOSEOUT_REPORT_CONTRACT_NAME),
    closeoutCommand: valueState(`pnpm --silent symphony goal closeout --goal ${commandGoalId} --markdown`),
    totalCount: valueState(items.length),
    pendingCount: valueState(pendingCount),
    passedCount: valueState(items.length - pendingCount),
    items,
    safety: {
      copyOnlyCommands: valueState(true),
      goalGatePreviewAvailable: valueState(true),
      confirmRequiresPlanHash: valueState(true),
      appendOnlyOnConfirm: valueState(true),
      browserExecutionAvailable: valueState(false),
      genericShellRunner: valueState(false),
      modelInvocationAvailable: valueState(false),
      releaseReadyInferredFromCommands: valueState(false)
    },
    note: valueState('Checklist rows show release gate status from goal-closeout-report.v1, latest matching goal-event-log.v1 evidence refs, and controlled goal gate preview/confirm forms. Workbench does not run these commands or convert command text into release readiness.')
  };
}

function projectReleaseGateRegistration({
  item,
  goalId,
  gateStatus,
  latestGateEvent,
  evidenceRefHelper
}) {
  const commandGoalId = isNonEmptyString(goalId) ? goalId : '<goal-id>';
  const evidenceRef = releaseEvidencePathForGoal(goalId);
  const statement = `Release gate ${item.gate} recorded from explicit command output evidence.`;
  const passedDefinition = GOAL_EVENT_FORM_DEFINITIONS.find((candidate) => (
    candidate.eventType === 'release.gate-passed'
  ));
  const failedDefinition = GOAL_EVENT_FORM_DEFINITIONS.find((candidate) => (
    candidate.eventType === 'release.gate-failed'
  ));
  const definitions = [passedDefinition, failedDefinition].filter((definition) => definition !== undefined);
  const forms = definitions.map((definition) => projectGoalEventFormSpec({
    definition,
    nextAction: {
      goalId,
      next: {
        taskId: null,
        role: 'release-verifier',
        phase: 'release-gate'
      }
    },
    recommended: gateStatus !== 'passed' && definition.eventType === 'release.gate-passed',
    evidenceRefHelper,
    fieldOverrides: {
      gateName: {
        readOnly: true,
        value: item.gate,
        source: 'release verification checklist',
        options: [item.gate]
      },
      gateStatus: {
        readOnly: true,
        value: definition.gateStatus,
        source: 'release verification checklist',
        options: [definition.gateStatus]
      },
      evidenceRef: {
        value: evidenceRef,
        source: 'release gate evidence path'
      },
      statement: {
        value: statement,
        source: 'release verification checklist'
      }
    }
  }));

  return {
    state: definitions.length === 0 ? 'missing' : 'available',
    sourcePolicy: valueState('goal-closeout-report.v1 + goal-event-log.v1 + goal-update-plan.v1 confirm flow'),
    currentStatus: valueState(gateStatus),
    latestEventId: valueState(latestGateEvent?.eventId),
    latestEventType: valueState(latestGateEvent?.eventType),
    latestEvidenceRefs: projectGoalEvidenceRefs(latestGateEvent?.evidenceRefs),
    releaseGateEvidencePath: valueState(evidenceRef),
    dryRunCommand: valueState(`pnpm --silent symphony goal gate --goal ${commandGoalId} --gate ${item.gate} --status passed --verifier <release-verifier-id> --evidence-ref ${evidenceRef} --dry-run --json`),
    confirmCommandPattern: valueState(`pnpm --silent symphony goal gate --goal ${commandGoalId} --gate ${item.gate} --status passed --verifier <release-verifier-id> --evidence-ref ${evidenceRef} --confirm --plan-hash sha256:<PLAN_HASH>`),
    forms: {
      state: forms.length === 0 ? 'empty' : 'available',
      count: valueState(forms.length),
      items: forms
    },
    safety: {
      confirmRequiresPlanHash: valueState(true),
      appendOnlyOnConfirm: valueState(true),
      workbenchWriteAvailable: valueState(isNonEmptyString(goalId)),
      usesGoalGateOnly: valueState(true),
      browserExecutionAvailable: valueState(false),
      modelInvocationAvailable: valueState(false),
      arbitraryShellAccepted: valueState(false),
      opensLocalFiles: valueState(false),
      downloadsArtifacts: valueState(false),
      mergeAvailable: valueState(false),
      pushAvailable: valueState(false),
      tagAvailable: valueState(false),
      releaseReadyAvailable: valueState(false),
      selfApprovalAvailable: valueState(false),
      commandSuccessImpliesGatePassed: valueState(false)
    },
    note: valueState('This path records a single release.<gate> result only through existing goal gate dry-run and plan-hash confirm. The evidence ref must point to a controlled docs/plans or managed artifact ref.')
  };
}

function latestReleaseGateEventForGate(events, gate) {
  if (!Array.isArray(events) || !isNonEmptyString(gate)) {
    return null;
  }

  return latestEventOfTypes(
    events.filter((event) => event?.gate?.id === gate || event?.gate?.name === gate),
    ['release.gate-passed', 'release.gate-failed']
  );
}

function projectReleaseReadyGateRegistration({
  closeout,
  goalId,
  runbook,
  ledger,
  eventLog,
  latestRun,
  releaseBaseline
}) {
  const definition = GOAL_EVENT_FORM_DEFINITIONS.find((candidate) => (
    candidate.eventType === 'release.ready-declared'
  ));
  const commandGoalId = isNonEmptyString(goalId) ? goalId : '<goal-id>';
  const releaseEvidencePath = releaseEvidencePathForGoal(goalId);
  const baselineBlocked = releaseBaseline?.state === 'blocked';
  const closeoutMissingItems = Array.isArray(closeout?.missing) ? closeout.missing : [];
  const missingReleaseReady = Array.isArray(closeout?.missing)
    ? closeout.missing.some((item) => item?.kind === 'release-ready' || item?.expectedEvent === 'release.ready-declared')
    : false;
  const closeoutBlockingGaps = closeoutMissingItems.filter((item) => (
    item?.kind !== 'release-ready' && item?.expectedEvent !== 'release.ready-declared'
  ));
  const pendingRequiredReleaseGateIds = pendingRequiredReleaseGateIdsForCloseout({
    closeout,
    runbook
  });
  const releaseReadyAlreadyDeclared = closeout?.summary?.releaseReady === true;
  const closeoutReadyForReleaseReady = closeout !== null &&
    closeout !== undefined &&
    missingReleaseReady &&
    closeoutBlockingGaps.length === 0 &&
    pendingRequiredReleaseGateIds.length === 0;
  const readyFormAvailable = definition !== undefined &&
    !baselineBlocked &&
    !releaseReadyAlreadyDeclared &&
    closeoutReadyForReleaseReady;
  const form = !readyFormAvailable
    ? null
    : projectGoalEventFormSpec({
        definition,
        nextAction: {
          goalId,
          next: {
            taskId: null,
            role: 'release-manager',
            phase: 'release-prep'
          }
        },
        recommended: closeout?.summary?.releaseReady !== true && missingReleaseReady,
        evidenceRefHelper: projectEvidenceRefHelper({
          runbook,
          ledger,
          eventLog,
          latestRun
        }),
        fieldOverrides: {
          evidenceRef: {
            value: releaseEvidencePath,
            source: 'release evidence path'
          },
          statement: {
            value: 'Release readiness declared from explicit closeout evidence.',
            source: 'release closeout workspace'
          }
        }
      });
  const state = definition === undefined
    ? 'missing'
    : releaseReadyAlreadyDeclared
      ? 'already-declared'
      : baselineBlocked || !closeoutReadyForReleaseReady
        ? 'blocked'
        : 'available';

  return {
    state,
    sourcePolicy: valueState('goal-closeout-report.v1 + release baseline resolver + goal-update-plan.v1 confirm flow'),
    baselineState: valueState(releaseBaseline?.state),
    baselineStopReason: valueState(releaseBaseline?.judgment?.stopReason?.value),
    baselineReleaseReadinessAllowed: valueState(releaseBaseline?.judgment?.releaseReadinessAllowed?.value),
    missingReleaseReady: valueState(missingReleaseReady),
    closeoutMissingCount: valueState(closeout === null || closeout === undefined ? undefined : closeoutMissingItems.length),
    closeoutBlockingGapCount: valueState(closeout === null || closeout === undefined ? undefined : closeoutBlockingGaps.length),
    requiredReleaseGatesPassed: valueState(pendingRequiredReleaseGateIds.length === 0),
    pendingRequiredReleaseGateIds: projectTextItems(pendingRequiredReleaseGateIds),
    releaseEvidencePath: valueState(releaseEvidencePath),
    dryRunCommand: valueState(`pnpm --silent symphony goal gate --goal ${commandGoalId} --gate release.ready --status declared --verifier <release-manager-id> --evidence-ref ${releaseEvidencePath} --dry-run --json`),
    confirmCommandPattern: valueState(`pnpm --silent symphony goal gate --goal ${commandGoalId} --gate release.ready --status declared --verifier <release-manager-id> --evidence-ref ${releaseEvidencePath} --confirm --plan-hash sha256:<PLAN_HASH>`),
    form,
    stopGuidance: releaseReadyStopGuidance({
      releaseBaseline,
      closeout,
      closeoutBlockingGaps,
      pendingRequiredReleaseGateIds,
      missingReleaseReady,
      releaseReadyAlreadyDeclared,
      commandGoalId
    }),
    safety: {
      confirmRequiresPlanHash: valueState(true),
      appendOnlyOnConfirm: valueState(true),
      workbenchWriteAvailable: valueState(readyFormAvailable),
      browserExecutionAvailable: valueState(false),
      modelInvocationAvailable: valueState(false),
      declaresReleaseReadyOnlyOnConfirm: valueState(true),
      dirtyOrNonMainBlocksFinalJudgment: valueState(true),
      closeoutGapsBlockConfirm: valueState(true),
      unknownOrMissingReleaseGatesBlockConfirm: valueState(true),
      frontendInferenceAvailable: valueState(false)
    },
    note: valueState(state === 'available'
      ? 'The release.ready path is a controlled goal gate dry-run and plan-hash confirm. The form is available only because closeout has no blocking gaps and all required release gates are passed; it does not tag, merge, run checks, or infer readiness.'
      : 'Release.ready registration is blocked until the release baseline is clean, all required release gates are passed, and goal closeout has no missing items other than the explicit release.ready event.')
  };
}

function pendingRequiredReleaseGateIdsForCloseout({
  closeout,
  runbook
}) {
  const closeoutReleaseGates = closeout?.releaseGates ?? {};
  const requiredGateIds = Array.isArray(runbook?.releaseGates) && runbook.releaseGates.length > 0
    ? runbook.releaseGates
        .map((gate) => RELEASE_VERIFICATION_CHECKLIST.find((item) => item.gate === gate)?.gateId)
        .filter(isNonEmptyString)
    : Object.keys(closeoutReleaseGates);

  return uniqueStrings(requiredGateIds).filter((gateId) => (
    releaseGateStatusText(closeoutReleaseGates[gateId]) !== 'passed'
  ));
}

function releaseReadyStopGuidance({
  releaseBaseline,
  closeout,
  closeoutBlockingGaps,
  pendingRequiredReleaseGateIds,
  missingReleaseReady,
  releaseReadyAlreadyDeclared,
  commandGoalId
}) {
  const guidance = [];

  if (releaseBaseline?.state === 'blocked') {
    guidance.push(...(releaseBaseline.fixGuidance?.items ?? []).map((item) => item.value).filter(isNonEmptyString));
  }

  if (closeout === null || closeout === undefined) {
    guidance.push(`Run \`pnpm --silent symphony goal closeout --goal ${commandGoalId} --markdown\` and wait for goal-closeout-report.v1 before declaring release.ready.`);
  }

  if (pendingRequiredReleaseGateIds.length > 0) {
    guidance.push(`Record passed release gate events for: ${pendingRequiredReleaseGateIds.join(', ')}.`);
  }

  if (closeoutBlockingGaps.length > 0) {
    guidance.push(`Resolve closeout gaps before release.ready: ${closeoutBlockingGaps.map(closeoutGapLabel).join(', ')}.`);
  }

  if (!missingReleaseReady && !releaseReadyAlreadyDeclared && closeout !== null && closeout !== undefined) {
    guidance.push('Wait for closeout to report only the release.ready declaration as the remaining item before using this form.');
  }

  if (releaseReadyAlreadyDeclared) {
    guidance.push('Release.ready is already declared by goal closeout; do not append another release.ready event.');
  }

  if (guidance.length === 0) {
    guidance.push('Run the release.ready dry-run preview, check the plan hash, then confirm with the same fields.');
  }

  return projectTextItems(uniqueStrings(guidance));
}

function closeoutGapLabel(item) {
  return [
    item?.kind,
    item?.taskId,
    item?.gateId ?? item?.gate,
    item?.status
  ].filter(isNonEmptyString).join(':') || 'unknown';
}

function projectReleaseEvidenceDraft({
  closeout,
  goalId,
  runbook,
  ledger,
  eventLog,
  releaseBaseline,
  verificationChecklist
}) {
  const commandGoalId = isNonEmptyString(goalId) ? goalId : '<goal-id>';
  const releaseEvidencePath = releaseEvidencePathForGoal(goalId);
  const tagEvidencePath = tagEvidencePathForGoal(goalId);
  const releaseName = releaseDisplayName({ goalId, runbook, ledger });
  const target = releaseTargetCommitFromBaseline(releaseBaseline);
  const gateItems = Array.isArray(verificationChecklist?.items) ? verificationChecklist.items : [];
  const commandResults = projectReleaseCommandResultFields(gateItems);
  const releaseNotesSummary = releaseNotesSummaryLines({
    closeout,
    goalId: commandGoalId,
    releaseName,
    targetCommit: target.commit,
    commandResults
  });
  const missingItems = Array.isArray(closeout?.missing) ? closeout.missing : [];
  const draftLines = [
    `# ${releaseName} release evidence draft`,
    '',
    `Goal id: ${commandGoalId}`,
    `Release evidence ref: ${releaseEvidencePath}`,
    `Tag evidence ref: ${tagEvidencePath}`,
    `Target commit: ${target.commit ?? '<target-commit-unavailable>'}`,
    `Target commit source: ${target.source ?? 'release baseline resolver unavailable'}`,
    '',
    'Release notes summary:',
    ...releaseNotesSummary.map((line) => `- ${line}`),
    '',
    'Command result fields:',
    ...commandResults.items.map((item) => (
      `- ${item.gate.value}: command=${item.command.value}; result=${item.resultStatus.value}; latestEvent=${item.latestEventId.value ?? 'missing'}; evidence=${item.latestEvidenceRef.value ?? 'missing'}`
    )),
    '',
    missingItems.length === 0
      ? 'Closeout gaps: none reported by goal-closeout-report.v1.'
      : `Closeout gaps: ${missingItems.map((item) => item?.kind ?? 'unknown').join(', ')}`,
    'Boundary: this draft does not write evidence files, run commands, declare release.ready, merge, push, publish, or create a tag.'
  ];

  return {
    state: closeout === null || closeout === undefined ? 'missing' : 'available',
    modelName: valueState(RELEASE_EVIDENCE_DRAFT_MODEL_NAME),
    sourcePolicy: valueState('goal-closeout-report.v1 + release-baseline-resolver.v1 + goal-event-log.v1'),
    goalId: valueState(commandGoalId),
    releaseName: valueState(releaseName),
    evidencePath: valueState(releaseEvidencePath),
    tagEvidencePath: valueState(tagEvidencePath),
    targetCommit: valueState(target.commit),
    targetCommitSource: valueState(target.source),
    releaseNotesSummary: projectTextItems(releaseNotesSummary),
    commandResults,
    markdown: valueState(draftLines.join('\n')),
    safety: {
      copyOnly: valueState(true),
      writesEvidenceFile: valueState(false),
      runsShell: valueState(false),
      declaresReleaseReady: valueState(false),
      createsTag: valueState(false),
      pushesTag: valueState(false),
      publishesRelease: valueState(false),
      infersStatusFromFilenames: valueState(false)
    },
    boundaryText: valueState('Release evidence draft is display-only. Command results must be copied from explicit terminal output or existing release gate events before a release manager records gates.')
  };
}

function projectReleaseCommandResultFields(gateItems) {
  const items = gateItems.map((item) => {
    const latestEvidenceRef = Array.isArray(item?.evidenceRefs?.items) && item.evidenceRefs.items.length > 0
      ? item.evidenceRefs.items[0]?.ref?.value
      : undefined;

    return {
      gate: valueState(item?.gate?.value),
      label: valueState(item?.label?.value),
      command: valueState(item?.command?.value),
      resultStatus: valueState(item?.status?.value),
      latestEventId: valueState(item?.latestEventId?.value),
      latestVerifier: valueState(item?.latestVerifier?.value),
      latestEvidenceRef: valueState(latestEvidenceRef),
      commandOutputRequired: valueState(item?.eventBackedStatus?.value !== true)
    };
  });

  return {
    state: items.length === 0 ? 'empty' : 'available',
    count: valueState(items.length),
    items
  };
}

function releaseNotesSummaryLines({
  closeout,
  goalId,
  releaseName,
  targetCommit,
  commandResults
}) {
  const lines = [
    `Release: ${releaseName}.`,
    `Goal: ${goalId}.`
  ];

  if (isNonEmptyString(targetCommit)) {
    lines.push(`Target commit: ${targetCommit}.`);
  }

  if (closeout?.summary !== undefined && closeout?.summary !== null) {
    lines.push(`Task coverage: worker evidence ${String(closeout.summary.workerEvidenceComplete)}, review evidence ${String(closeout.summary.reviewEvidenceComplete)}, main verification ${String(closeout.summary.mainVerificationComplete)}.`);
    lines.push(`Release ready: ${String(closeout.summary.releaseReady)} from ${closeout.summary.releaseReadySource ?? 'no release.ready event'}.`);
  }

  if (Array.isArray(commandResults?.items) && commandResults.items.length > 0) {
    lines.push(`Release gates: ${commandResults.items.map((item) => `${item.gate.value}=${item.resultStatus.value}`).join(', ')}.`);
  }

  return lines;
}

function releaseTargetCommitFromBaseline(releaseBaseline) {
  const candidates = [
    ['release baseline current HEAD', releaseBaseline?.currentHeadFull?.value],
    ['release baseline current HEAD', releaseBaseline?.currentHead?.value],
    ['release baseline main HEAD', releaseBaseline?.mainHead?.value],
    ['release baseline origin/main', releaseBaseline?.originMainHead?.value]
  ];

  const match = candidates.find(([, value]) => isNonEmptyString(value));

  return {
    commit: match?.[1],
    source: match?.[0]
  };
}

function releaseDisplayName({ goalId, runbook, ledger }) {
  const version = releaseVersionPrefix(goalId);
  const title = firstNonEmptyString(runbook?.goalTitle, ledger?.goalTitle, goalId);

  if (version !== null && isNonEmptyString(title) && !title.startsWith(version)) {
    return `${version} ${title}`;
  }

  return title ?? '<release-name>';
}

function tagNameForGoal(goalId) {
  return releaseVersionPrefix(goalId) ?? '<release-tag>';
}

function tagCommandForDraft({ tagName, targetCommit, releaseName }) {
  const commit = isNonEmptyString(targetCommit) ? targetCommit : '<target-commit>';
  const message = String(releaseName ?? '<release-name>').replaceAll('"', '\\"');

  return `git tag -a ${tagName} ${commit} -m "${message}"`;
}

function projectTagEvidencePrompt({
  closeout,
  goalId,
  runbook,
  ledger,
  eventLog,
  releaseBaseline
}) {
  const commandGoalId = isNonEmptyString(goalId) ? goalId : '<goal-id>';
  const tagEvidencePath = tagEvidencePathForGoal(goalId);
  const releaseEvidencePath = releaseEvidencePathForGoal(goalId);
  const releaseName = releaseDisplayName({ goalId, runbook, ledger });
  const tagRecommendation = tagNameForGoal(goalId);
  const target = releaseTargetCommitFromBaseline(releaseBaseline);
  const copyOnlyTagCommand = tagCommandForDraft({
    tagName: tagRecommendation,
    targetCommit: target.commit,
    releaseName
  });
  const events = Array.isArray(eventLog?.events) ? eventLog.events : [];
  const latestTagGateEvent = latestReleaseGateEventForGate(events, 'release.tag-evidence');
  const latestTagEvidenceRefs = projectGoalEvidenceRefs(latestTagGateEvent?.evidenceRefs);
  const releaseNotesSummary = releaseNotesSummaryLines({
    closeout,
    goalId: commandGoalId,
    releaseName,
    targetCommit: target.commit,
    commandResults: projectReleaseCommandResultFields(RELEASE_VERIFICATION_CHECKLIST.map((item) => ({
      gate: valueState(item.gate),
      label: valueState(item.label),
      command: valueState(item.command),
      status: valueState(releaseGateStatusText(closeout?.releaseGates?.[item.gateId])),
      latestEventId: valueState(undefined),
      latestVerifier: valueState(undefined),
      evidenceRefs: projectGoalEvidenceRefs(undefined),
      eventBackedStatus: valueState(false)
    })))
  });
  const checklistLines = RELEASE_VERIFICATION_CHECKLIST.map((item) => (
    `- ${item.label}: ${item.command}; gate ${item.gate}; closeout status ${releaseGateStatusText(closeout?.releaseGates?.[item.gateId])}`
  ));
  const promptLines = [
    '/goal',
    `Prepare tag evidence for ${commandGoalId}.`,
    '',
    `Read closeout: pnpm --silent symphony goal closeout --goal ${commandGoalId} --markdown`,
    `Release evidence path: ${releaseEvidencePath}`,
    `Tag evidence path: ${tagEvidencePath}`,
    `Tag recommendation: ${tagRecommendation}`,
    `Target commit: ${target.commit ?? '<target-commit-unavailable>'}`,
    `Copy-only tag command: ${copyOnlyTagCommand}`,
    '',
    'Release notes summary:',
    ...releaseNotesSummary.map((line) => `- ${line}`),
    '',
    'Check and record exact command results:',
    ...checklistLines,
    '',
    'Record remaining closeout gaps from goal-closeout-report.v1. If gaps remain, write blockers and stop.',
    'Do not create a tag, push tags, publish, merge branches, declare release.ready, or treat filenames, branches, commits, prompts, or command text as release proof.'
  ];

  return {
    state: closeout === null || closeout === undefined ? 'missing' : 'available',
    modelName: valueState(TAG_EVIDENCE_DRAFT_MODEL_NAME),
    sourceContract: valueState(GOAL_CLOSEOUT_REPORT_CONTRACT_NAME),
    sourcePolicy: valueState('goal-closeout-report.v1 + release-baseline-resolver.v1 + goal-event-log.v1'),
    evidencePath: valueState(tagEvidencePath),
    releaseEvidencePath: valueState(releaseEvidencePath),
    tagRecommendation: valueState(tagRecommendation),
    targetCommit: valueState(target.commit),
    targetCommitSource: valueState(target.source),
    releaseNotesSummary: projectTextItems(releaseNotesSummary),
    copyOnlyTagCommand: valueState(copyOnlyTagCommand),
    commandResultFields: {
      command: valueState(copyOnlyTagCommand),
      result: valueState('not-run-by-workbench'),
      exitCode: valueState('not-run-by-workbench'),
      stdout: valueState('not-run-by-workbench'),
      stderr: valueState('not-run-by-workbench'),
      evidenceRef: valueState(tagEvidencePath)
    },
    latestTagGateEventId: valueState(latestTagGateEvent?.eventId),
    latestTagGateStatus: valueState(latestTagGateEvent?.gate?.status),
    latestTagEvidenceRefs,
    promptFormat: valueState('markdown'),
    text: valueState(promptLines.join('\n')),
    boundaryText: valueState('The tag command is copy-only display text. Workbench does not run git tag, push tags, publish releases, or declare release.ready from this draft.'),
    safety: {
      copyOnly: valueState(true),
      createsTag: valueState(false),
      tagExecutionAvailable: valueState(false),
      pushesTag: valueState(false),
      publishesRelease: valueState(false),
      mergeAvailable: valueState(false),
      declaresReleaseReady: valueState(false),
      runsShell: valueState(false),
      opensLocalFiles: valueState(false),
      downloadsArtifacts: valueState(false)
    }
  };
}

function projectNextVersionHandoffDraft({
  closeout,
  goalId,
  runbook,
  ledger,
  eventLog,
  latestRun,
  releaseBaseline,
  verificationChecklist,
  releaseEvidenceDraft,
  tagEvidencePrompt
}) {
  const commandGoalId = isNonEmptyString(goalId) ? goalId : '<goal-id>';
  const releaseName = releaseDisplayName({ goalId, runbook, ledger });
  const currentVersion = releaseVersionPrefix(goalId);
  const nextVersion = nextReleaseVersionPrefix(currentVersion);
  const target = releaseTargetCommitFromBaseline(releaseBaseline);
  const closeoutMissingItems = Array.isArray(closeout?.missing) ? closeout.missing : [];
  const events = Array.isArray(eventLog?.events) ? eventLog.events : [];
  const releaseReadyEvent = latestEventOfTypes(events, ['release.ready-declared']);
  const taskAnchors = projectNextVersionTaskAnchors({ ledger, runbook });
  const releaseGateAnchors = projectNextVersionReleaseGateAnchors({ verificationChecklist, closeout });
  const evidenceRefs = projectNextVersionEvidenceRefs({
    taskAnchors,
    releaseGateAnchors,
    releaseReadyEvent,
    releaseEvidenceDraft,
    tagEvidencePrompt
  });
  const nativeUxHandoff = projectNativeUxHandoffDraft({
    nextVersion,
    commandGoalId,
    releaseName,
    target,
    releaseReady: closeout?.summary?.releaseReady,
    closeoutMissingCount: closeoutMissingItems.length,
    evidenceRefs
  });
  const implementedCapabilities = projectNextVersionImplementedCapabilities({
    releaseBaseline,
    verificationChecklist,
    releaseEvidenceDraft,
    tagEvidencePrompt,
    closeout
  });
  const copyOnlyCommands = [
    `pnpm --silent symphony goal-status --goal ${commandGoalId} --json`,
    `pnpm --silent symphony goal closeout --goal ${commandGoalId} --markdown`,
    'pnpm --silent symphony next --goal latest --json'
  ];
  const handoffLines = [
    `# ${nextVersion ?? '<next-version>'} start context draft`,
    '',
    `Current release: ${releaseName}`,
    `Current goal id: ${commandGoalId}`,
    `Next version label: ${nextVersion ?? '<next-version>'}`,
    `Target commit: ${target.commit ?? '<target-commit-unavailable>'}`,
    `Target commit source: ${target.source ?? 'release baseline resolver unavailable'}`,
    `Latest run id: ${latestRun?.runId ?? '<latest-run-unavailable>'}`,
    `Release ready: ${String(closeout?.summary?.releaseReady ?? false)} from ${closeout?.summary?.releaseReadySource ?? 'no release.ready event'}`,
    `Closeout missing count: ${closeoutMissingItems.length}`,
    '',
    'Evidence anchors:',
    ...evidenceRefs.items.map((item) => `- ${item.label.value}: ${item.ref.value}`),
    '',
    'Task anchors:',
    ...taskAnchors.items.map((item) => (
      `- ${item.taskId.value}: status=${item.status.value}; worker=${item.workerEvidenceRef.value ?? 'missing'}; review=${item.reviewEvidenceRef.value ?? 'missing'}; main=${item.mainVerificationRef.value ?? 'missing'}`
    )),
    '',
    'Release gate anchors:',
    ...releaseGateAnchors.items.map((item) => (
      `- ${item.gate.value}: status=${item.status.value}; event=${item.latestEventId.value ?? 'missing'}; evidence=${item.latestEvidenceRef.value ?? 'missing'}`
    )),
    '',
    'Implemented Workbench capabilities:',
    ...implementedCapabilities.items.map((item) => `- ${item.name.value}: ${item.state.value}`),
    '',
    'Native UX handoff scope:',
    ...nativeUxHandoff.scope.items.map((item) => `- ${item.value}`),
    '',
    'Distribution channels:',
    ...nativeUxHandoff.distributionChannels.items.map((item) => `- ${item.value}`),
    '',
    'Starter work packages:',
    ...nativeUxHandoff.starterWorkPackages.items.map((item) => (
      `- ${item.id.value}: ${item.title.value}; outcome=${item.outcome.value}; source=${item.source.value}`
    )),
    '',
    'Copy-only context commands:',
    ...copyOnlyCommands.map((command) => `- ${command}`),
    '',
    'Next-version starter notes:',
    '- Use this draft as starting context only after the current release closeout and explicit event refs are checked.',
    '- Do not create a managed next-version goal from Workbench. Run any future goal init manually through the existing dry-run and confirm flow.',
    '- Do not treat filenames, branch names, commit messages, task titles, prompt text, or copied commands as approval, main verification, or release readiness.',
    '',
    'Boundary: this draft is display-only and copy-only. It does not create a goal, enter the next version, run commands, invoke models, read evidence bodies, open files, download artifacts, merge, push, tag, publish, self-approve, or declare release.ready.'
  ];

  return {
    state: closeout === null || closeout === undefined ? 'missing' : 'available',
    modelName: valueState(NEXT_VERSION_HANDOFF_DRAFT_MODEL_NAME),
    sourcePolicy: valueState('goal-closeout-report.v1 + release-baseline-resolver.v1 + release evidence draft + tag evidence draft + goal-event-log.v1 + goal-progress-ledger.v1 + Workbench operator-guide capabilities'),
    goalId: valueState(commandGoalId),
    releaseName: valueState(releaseName),
    currentVersion: valueState(currentVersion),
    nextVersion: valueState(nextVersion),
    targetCommit: valueState(target.commit),
    targetCommitSource: valueState(target.source),
    latestRunId: valueState(latestRun?.runId),
    releaseReady: valueState(closeout?.summary?.releaseReady),
    releaseReadySource: valueState(closeout?.summary?.releaseReadySource),
    releaseReadyEventId: valueState(releaseReadyEvent?.eventId),
    closeoutMissingCount: valueState(closeout === null || closeout === undefined ? undefined : closeoutMissingItems.length),
    sourceRefs: projectTextItems([
      GOAL_CLOSEOUT_REPORT_CONTRACT_NAME,
      'release-baseline-resolver.v1',
      'goal-event-log.v1',
      'goal-progress-ledger.v1',
      'goal-operation-runs.v1',
      'docs/workbench-operator-guide.md',
      'docs/symphony-product-contracts.md'
    ]),
    evidenceRefs,
    taskAnchors,
    releaseGateAnchors,
    implementedCapabilities,
    nativeUxHandoff,
    copyOnlyCommands: projectTextItems(copyOnlyCommands),
    markdown: valueState(handoffLines.join('\n')),
    safety: {
      copyOnly: valueState(true),
      nativeUxHandoffOnly: valueState(true),
      createsManagedGoal: valueState(false),
      entersNextVersion: valueState(false),
      runsShell: valueState(false),
      invokesModel: valueState(false),
      readsEvidenceBodies: valueState(false),
      opensLocalFiles: valueState(false),
      downloadsArtifacts: valueState(false),
      mergesBranches: valueState(false),
      pushesBranchesOrTags: valueState(false),
      createsTag: valueState(false),
      publishesRelease: valueState(false),
      declaresReleaseReady: valueState(false),
      selfApprovalAvailable: valueState(false),
      v8TopLevelModel: valueState(false),
      infersStateFromFilenames: valueState(false),
      infersStateFromBranches: valueState(false),
      infersStateFromPrompts: valueState(false)
    },
    boundaryText: valueState(`Next-version handoff draft is a controlled preview generated from active goal closeout, release/event refs, run context, and implemented Workbench capability flags. It does not create ${nextVersion ?? 'the next version'} or move the operator into the next version.`)
  };
}

function projectNativeUxHandoffDraft({
  nextVersion,
  commandGoalId,
  releaseName,
  target,
  releaseReady,
  closeoutMissingCount,
  evidenceRefs
}) {
  return {
    state: nextVersion === null ? 'partial' : 'available',
    version: valueState(nextVersion),
    goalId: valueState(commandGoalId),
    releaseName: valueState(releaseName),
    targetCommit: valueState(target.commit),
    releaseReady: valueState(releaseReady),
    closeoutMissingCount: valueState(closeoutMissingCount),
    evidenceAnchorCount: valueState(evidenceRefs?.count?.value),
    scope: projectTextItems(NATIVE_UX_HANDOFF_SCOPE),
    distributionChannels: projectTextItems(NATIVE_UX_DISTRIBUTION_CHANNELS),
    starterWorkPackages: {
      state: 'available',
      count: valueState(NATIVE_UX_STARTER_WORK_PACKAGES.length),
      items: NATIVE_UX_STARTER_WORK_PACKAGES.map((item) => ({
        id: valueState(item.id),
        title: valueState(item.title),
        outcome: valueState(item.outcome),
        source: valueState(item.source)
      }))
    },
    safety: {
      copyOnly: valueState(true),
      generatesNativeBuild: valueState(false),
      createsInstaller: valueState(false),
      signsOrNotarizes: valueState(false),
      publishesDistribution: valueState(false),
      autoUpdatesAvailable: valueState(false),
      invokesProvider: valueState(false),
      opensLocalFiles: valueState(false)
    },
    note: valueState('Native UX handoff is generated from closeout projections and evidence anchors. Build, signing, notarization, packaging, and distribution remain future controlled work with separate evidence gates.')
  };
}

function projectNextVersionTaskAnchors({ ledger, runbook }) {
  const tasks = Array.isArray(ledger?.tasks)
    ? ledger.tasks
    : Array.isArray(runbook?.tasks) ? runbook.tasks : [];
  const items = tasks.map((task) => ({
    taskId: valueState(task?.taskId),
    title: valueState(task?.title),
    status: valueState(task?.status),
    workerEvidenceRef: valueState(task?.workerEvidenceRef),
    reviewEvidenceRef: valueState(task?.reviewEvidenceRef),
    reviewVerdict: valueState(task?.reviewVerdict),
    mainVerificationRef: valueState(task?.mainVerificationRef),
    statusSource: valueState(task?.statusSource)
  }));

  return {
    state: items.length === 0 ? 'empty' : 'available',
    count: valueState(items.length),
    items
  };
}

function projectNextVersionReleaseGateAnchors({ verificationChecklist, closeout }) {
  const checklistItems = Array.isArray(verificationChecklist?.items) ? verificationChecklist.items : [];
  const fallbackItems = RELEASE_VERIFICATION_CHECKLIST.map((item) => ({
    gate: valueState(item.gate),
    label: valueState(item.label),
    status: valueState(releaseGateStatusText(closeout?.releaseGates?.[item.gateId])),
    latestEventId: valueState(undefined),
    latestEvidenceRef: valueState(undefined)
  }));
  const sourceItems = checklistItems.length > 0 ? checklistItems : fallbackItems;
  const items = sourceItems.map((item) => {
    const latestEvidenceRef = Array.isArray(item?.evidenceRefs?.items) && item.evidenceRefs.items.length > 0
      ? item.evidenceRefs.items[0]?.ref?.value
      : firstValue(item?.latestEvidenceRef);

    return {
      gate: valueState(firstValue(item?.gate)),
      label: valueState(firstValue(item?.label)),
      status: valueState(firstValue(item?.status)),
      latestEventId: valueState(firstValue(item?.latestEventId)),
      latestEvidenceRef: valueState(latestEvidenceRef),
      command: valueState(firstValue(item?.command))
    };
  });

  return {
    state: items.length === 0 ? 'empty' : 'available',
    count: valueState(items.length),
    items
  };
}

function projectNextVersionEvidenceRefs({
  taskAnchors,
  releaseGateAnchors,
  releaseReadyEvent,
  releaseEvidenceDraft,
  tagEvidencePrompt
}) {
  const refs = [];

  addNextVersionEvidenceRef(refs, firstValue(releaseEvidenceDraft?.evidencePath, tagEvidencePrompt?.releaseEvidencePath), {
    label: 'release evidence ref',
    source: RELEASE_EVIDENCE_DRAFT_MODEL_NAME
  });
  addNextVersionEvidenceRef(refs, firstValue(releaseEvidenceDraft?.tagEvidencePath, tagEvidencePrompt?.evidencePath), {
    label: 'tag evidence ref',
    source: TAG_EVIDENCE_DRAFT_MODEL_NAME
  });

  for (const ref of releaseReadyEvent?.evidenceRefs ?? []) {
    addNextVersionEvidenceRef(refs, ref?.ref, {
      label: ref?.label ?? 'release.ready evidence',
      source: 'release.ready-declared'
    });
  }

  for (const task of taskAnchors?.items ?? []) {
    addNextVersionEvidenceRef(refs, task.workerEvidenceRef, {
      label: `${task.taskId.value ?? 'task'} worker evidence`,
      source: GOAL_PROGRESS_LEDGER_CONTRACT_NAME,
      taskId: task.taskId.value
    });
    addNextVersionEvidenceRef(refs, task.reviewEvidenceRef, {
      label: `${task.taskId.value ?? 'task'} review evidence`,
      source: GOAL_PROGRESS_LEDGER_CONTRACT_NAME,
      taskId: task.taskId.value
    });
    addNextVersionEvidenceRef(refs, task.mainVerificationRef, {
      label: `${task.taskId.value ?? 'task'} main verification evidence`,
      source: GOAL_PROGRESS_LEDGER_CONTRACT_NAME,
      taskId: task.taskId.value
    });
  }

  for (const gate of releaseGateAnchors?.items ?? []) {
    addNextVersionEvidenceRef(refs, gate.latestEvidenceRef, {
      label: `${gate.gate.value ?? 'release gate'} evidence`,
      source: 'release gate event'
    });
  }

  return {
    state: refs.length === 0 ? 'empty' : 'available',
    count: valueState(refs.length),
    items: refs.slice(0, 30)
  };
}

function addNextVersionEvidenceRef(refs, refState, metadata = {}) {
  const ref = firstValue(refState);

  if (!isNonEmptyString(ref) || refs.some((item) => item.ref.value === ref)) {
    return;
  }

  refs.push({
    ref: valueState(ref),
    kind: valueState(evidenceRefKindForInput(ref)),
    label: valueState(metadata.label),
    source: valueState(metadata.source),
    taskId: valueState(metadata.taskId)
  });
}

function projectNextVersionImplementedCapabilities({
  releaseBaseline,
  verificationChecklist,
  releaseEvidenceDraft,
  tagEvidencePrompt,
  closeout
}) {
  const items = [
    ['ReleaseBaselineResolver', releaseBaseline?.state],
    ['Release gate checklist recorder', verificationChecklist?.state],
    ['ReleaseEvidenceDraftWriter', releaseEvidenceDraft?.state],
    ['TagEvidenceDraftWriter', tagEvidencePrompt?.state],
    ['release.ready controlled gate registration', closeout?.summary?.releaseReady === true ? 'declared' : 'controlled-form-or-blocked'],
    ['NextVersionHandoffDraft', closeout === null || closeout === undefined ? 'missing' : 'available']
  ].map(([name, state]) => ({
    name: valueState(name),
    state: valueState(state),
    source: valueState('Workbench closeout projection')
  }));

  return {
    state: items.length === 0 ? 'empty' : 'available',
    count: valueState(items.length),
    items
  };
}

function nextReleaseVersionPrefix(version) {
  const match = String(version ?? '').match(/^v(\d+)$/u);

  if (match === null) {
    return null;
  }

  const major = Number.parseInt(match[1], 10);

  return Number.isInteger(major) ? `v${major + 1}` : null;
}

function releaseGateStatusText(status) {
  return ['unknown', 'missing', 'pending', 'passed', 'failed', 'blocked'].includes(status)
    ? status
    : 'unknown';
}

function releaseEvidencePathForGoal(goalId) {
  const version = releaseVersionPrefix(goalId);

  if (version !== null) {
    return `docs/plans/${version}-release-evidence-${releaseEvidenceDateForVersion(version)}.md`;
  }

  return isNonEmptyString(goalId)
    ? `docs/plans/${goalId}-release-evidence.md`
    : 'docs/plans/<release-evidence>.md';
}

function tagEvidencePathForGoal(goalId) {
  const version = releaseVersionPrefix(goalId);

  if (version !== null) {
    return `docs/plans/${version}-tag-evidence-${releaseEvidenceDateForVersion(version)}.md`;
  }

  return isNonEmptyString(goalId)
    ? `docs/plans/${goalId}-tag-evidence.md`
    : 'docs/plans/<tag-evidence>.md';
}

function releaseVersionPrefix(goalId) {
  const match = String(goalId ?? '').match(/^(v\d+)-/u);

  return match?.[1] ?? null;
}

function releaseEvidenceDateForVersion(version) {
  const match = String(version ?? '').match(/^v(\d+)$/u);
  const major = match === null ? null : Number.parseInt(match[1], 10);

  return Number.isInteger(major) && major >= 29
    ? '2026-06-01'
    : '2026-05-29';
}

function projectGoalNextDetails(next) {
  return {
    taskId: valueState(next?.taskId),
    role: valueState(next?.role),
    phase: valueState(next?.phase),
    reason: valueState(next?.reason),
    blocked: valueState(next?.blocked)
  };
}

function projectGoalNextEvidenceState(evidenceState) {
  return {
    workerEvidenceRef: valueState(evidenceState?.workerEvidenceRef),
    reviewEvidenceRef: valueState(evidenceState?.reviewEvidenceRef),
    mainVerificationRef: valueState(evidenceState?.mainVerificationRef)
  };
}

function projectGoalNextCopyOnlyPrompt(copyOnlyPrompt) {
  return {
    available: valueState(copyOnlyPrompt?.available),
    format: valueState(copyOnlyPrompt?.format),
    textAvailable: valueState(isNonEmptyString(copyOnlyPrompt?.text))
  };
}

function projectAfterCompletion(afterCompletion) {
  return {
    registerWith: valueState(afterCompletion?.registerWith),
    registrationCommand: valueState(afterCompletion?.registerWith),
    allowedEvents: arrayTextState(afterCompletion?.allowedEvents)
  };
}

function projectGoalEventFormModel(nextAction, evidenceRefContext = {}) {
  const allowedEvents = Array.isArray(nextAction?.afterCompletion?.allowedEvents)
    ? nextAction.afterCompletion.allowedEvents.filter((eventType) => isNonEmptyString(eventType))
    : [];
  const supportedDefinitions = GOAL_EVENT_FORM_DEFINITIONS.filter((definition) => definition.eventFamily !== 'release');
  const recommendedDefinitions = allowedEvents
    .map((eventType) => supportedDefinitions.find((definition) => definition.eventType === eventType))
    .filter((definition) => definition !== undefined);
  const evidenceRefHelper = projectEvidenceRefHelper(evidenceRefContext);
  const workerEvidenceHandoff = projectWorkerEvidenceHandoff({
    nextAction,
    latestRun: evidenceRefContext.latestRun,
    operations: evidenceRefContext.operations,
    evidenceRefHelper
  });
  const recommendedForms = recommendedDefinitions.map((definition) => projectGoalEventFormSpec({
    definition,
    nextAction,
    recommended: true,
    evidenceRefHelper
  }));
  const supportedForms = supportedDefinitions.map((definition) => projectGoalEventFormSpec({
    definition,
    nextAction,
    recommended: allowedEvents.includes(definition.eventType),
    evidenceRefHelper
  }));
  const unsupportedAllowedEvents = allowedEvents.filter((eventType) => (
    supportedDefinitions.every((definition) => definition.eventType !== eventType)
  ));

  return {
    state: nextAction === null || nextAction === undefined
      ? 'missing'
      : recommendedForms.length > 0 ? 'available' : 'empty',
    modelName: valueState(GOAL_EVENT_FORM_MODEL_NAME),
    sourceContract: valueState(GOAL_NEXT_ACTION_CONTRACT_NAME),
    goalId: valueState(nextAction?.goalId),
    taskId: valueState(nextAction?.next?.taskId),
    role: valueState(nextAction?.next?.role),
    phase: valueState(nextAction?.next?.phase),
    registerWith: valueState(nextAction?.afterCompletion?.registerWith),
    allowedEvents: arrayTextState(allowedEvents),
    unsupportedAllowedEvents: arrayTextState(unsupportedAllowedEvents),
    defaultFormId: valueState(recommendedForms[0]?.formId.value),
    evidenceRefHelper,
    workerEvidenceHandoff,
    recommendedForms: {
      state: recommendedForms.length === 0 ? 'empty' : 'available',
      count: valueState(recommendedForms.length),
      items: recommendedForms
    },
    supportedForms: {
      state: supportedForms.length === 0 ? 'empty' : 'available',
      count: valueState(supportedForms.length),
      items: supportedForms
    },
    policy: {
      workerCannotApproveOwnTask: valueState(true),
      reviewerActorMustDifferFromLatestWorker: valueState(true),
      approvalReadinessSource: valueState('explicit goal events only'),
      unsupportedInferenceSources: arrayTextState(['file-name', 'branch', 'commit-message', 'frontend-heuristic'])
    },
    safety: {
      readOnly: valueState(true),
      copyOnly: valueState(true),
      dryRunOnly: valueState(false),
      confirmAvailableInTask1: valueState(false),
      confirmAvailableInTask3: valueState(true),
      workbenchWriteAvailable: valueState(true),
      browserExecutionAvailable: valueState(false),
      modelInvocationAvailable: valueState(false)
    },
    note: 'Form model uses goal-next-action.v1 allowedEvents for recommended forms, recent evidence refs from exposed contracts, and a fixed goal update/review/gate catalog for supported forms; confirm is limited to the matching dry-run plan hash and does not run shell, model, merge, tag, or filename status inference.'
  };
}

function projectGoalEventFormSpec({
  definition,
  nextAction,
  recommended,
  evidenceRefHelper,
  fieldOverrides = {}
}) {
  const taskId = nextAction?.next?.taskId;
  const goalId = nextAction?.goalId;
  const taskRequired = definition.eventFamily !== 'release';

  return {
    formId: valueState(definition.formId),
    eventType: valueState(definition.eventType),
    eventFamily: valueState(definition.eventFamily),
    commandName: valueState(definition.commandName),
    commandIntent: valueState(definition.commandIntent),
    actorRole: valueState(definition.actorRole),
    actorFlag: valueState(definition.actorFlag),
    phase: valueState(definition.phase),
    recommended: valueState(recommended),
    availableForCurrentNextAction: valueState(recommended),
    requiresTask: valueState(taskRequired),
    requiresEvidence: valueState(definition.requiresEvidence),
    confirmRequiresPlanHash: valueState(true),
    planPreviewContract: valueState(GOAL_UPDATE_PLAN_CONTRACT_NAME),
    evidenceRefHelper,
    fields: {
      state: definition.fields.length === 0 ? 'empty' : 'available',
      count: valueState(definition.fields.length),
      items: definition.fields.map((fieldId) => projectGoalEventFormField({
        fieldId,
        definition,
        goalId,
        taskId,
        fieldOverrides
      }))
    }
  };
}

function projectWorkerEvidenceHandoff({
  nextAction,
  latestRun,
  operations,
  evidenceRefHelper
}) {
  const v29Handoff = projectV29WorkerEvidenceHandoff({
    nextAction,
    operations,
    evidenceRefHelper
  });

  if (v29Handoff.state === 'available') {
    return v29Handoff;
  }

  return projectV25WorkerEvidenceHandoff({
    nextAction,
    latestRun,
    evidenceRefHelper
  });
}

function projectV29WorkerEvidenceHandoff({
  nextAction,
  operations,
  evidenceRefHelper
}) {
  const goalId = nextAction?.goalId;
  const taskId = nextAction?.next?.taskId;
  const workerEvidenceDefinition = GOAL_EVENT_FORM_DEFINITIONS.find((definition) => (
    definition.eventType === 'worker.evidence-recorded'
  ));
  const allowedEvents = Array.isArray(nextAction?.afterCompletion?.allowedEvents)
    ? nextAction.afterCompletion.allowedEvents
    : [];
  const operation = latestConfirmedImplementationOperationForTask(operations, {
    goalId,
    taskId
  });
  const runResult = operation?.runResult ?? null;
  const evidenceArtifactPath = firstNonEmptyString(
    runResult?.evidenceArtifactPath,
    latestRunArtifactPathByKind(runResult, 'evidence')
  );
  const sourceWorkspacePath = runResult?.sourceWorkspacePath;
  const evidenceRef = latestRunEvidenceRefByKind(runResult, 'evidence');
  const available = workerEvidenceDefinition !== undefined
    && allowedEvents.includes('worker.evidence-recorded')
    && operationRunIsConfirmedIsolatedWorkspaceImplementation(operation)
    && isNonEmptyString(goalId)
    && isNonEmptyString(taskId)
    && isNonEmptyString(runResult?.runId)
    && isNonEmptyString(evidenceArtifactPath)
    && isNonEmptyString(evidenceRef);

  if (!available) {
    return {
      state: 'empty',
      goalId: valueState(goalId),
      taskId: valueState(taskId),
      sourceContract: valueState(GOAL_OPERATION_RUNS_CONTRACT_NAME),
      sourceOperationId: valueState(operation?.operationId),
      sourceRunId: valueState(runResult?.runId),
      executionPlanId: valueState(runResult?.executionPlanId),
      evidenceArtifactPath: valueState(evidenceArtifactPath),
      sourceWorkspacePath: valueState(sourceWorkspacePath),
      evidenceRef: valueState(evidenceRef),
      registrationForm: null,
      promptHandoff: {
        available: valueState(false),
        format: valueState('markdown'),
        text: textState(MISSING_TEXT)
      },
      safety: projectV29WorkerEvidenceHandoffSafety(),
      note: 'v29 worker evidence handoff appears after goal-operation-runs.v1 contains a confirmed implementation run for the active goal/task with a managed evidence artifact ref.'
    };
  }

  const actorId = `codex-v29-${taskId}-worker`;
  const statement = `Confirmed implementation run ${runResult.runId} produced worker evidence for ${goalId} ${taskId}.`;
  const registrationForm = projectGoalEventFormSpec({
    definition: workerEvidenceDefinition,
    nextAction,
    recommended: true,
    evidenceRefHelper,
    fieldOverrides: {
      workerActor: {
        value: actorId,
        source: 'v29 worker evidence handoff'
      },
      evidenceRef: {
        value: evidenceRef,
        source: 'goal-operation-runs.v1 implementation artifact'
      },
      statement: {
        value: statement,
        source: 'v29 worker evidence handoff'
      }
    }
  });

  return {
    state: 'available',
    goalId: valueState(goalId),
    taskId: valueState(taskId),
    sourceContract: valueState(GOAL_OPERATION_RUNS_CONTRACT_NAME),
    sourceOperationId: valueState(operation.operationId),
    sourceRunId: valueState(runResult.runId),
    executionPlanId: valueState(runResult.executionPlanId),
    evidenceArtifactPath: valueState(evidenceArtifactPath),
    sourceWorkspacePath: valueState(sourceWorkspacePath),
    evidenceRef: valueState(evidenceRef),
    runStatus: valueState(runResult.status),
    verifierStatus: valueState(runResult.verifierStatus),
    registrationForm,
    promptHandoff: {
      available: valueState(true),
      format: valueState('markdown'),
      text: textState(buildV29WorkerEvidencePrompt({
        goalId,
        taskId,
        operation,
        runResult,
        evidenceArtifactPath,
        sourceWorkspacePath,
        evidenceRef,
        actorId
      }))
    },
    safety: projectV29WorkerEvidenceHandoffSafety(),
    note: 'This v29 handoff turns the confirmed implementation operation into a worker.evidence-recorded dry-run and plan-hash confirm path. It does not read evidence bodies, run shell commands, approve review, verify main, merge, push, tag, or infer readiness.'
  };
}

function latestConfirmedImplementationOperationForTask(operations, { goalId, taskId }) {
  const operation = latestImplementationOperationForTask(operations, {
    goalId,
    taskId
  });

  return operation?.status === 'confirmed' ? operation : null;
}

function operationRunIsConfirmedIsolatedWorkspaceImplementation(operation) {
  const runResult = operation?.runResult ?? null;

  return operation?.commandKind === 'implementation'
    && operation?.status === 'confirmed'
    && runResult?.mainWorktreeWrites === false
    && (runResult?.workspaceWrites === true || runResult?.writeBoundary === 'isolated-workspace')
    && isNonEmptyString(runResult?.executionPlanId);
}

function projectV29WorkerEvidenceHandoffSafety() {
  return {
    v25Only: valueState(false),
    genericShellRunner: valueState(false),
    browserExecutionAvailable: valueState(false),
    modelInvocationAvailable: valueState(false),
    readsEvidenceBodies: valueState(false),
    opensLocalFiles: valueState(false),
    workerCanApproveOwnTask: valueState(false),
    requiresGoalEventConfirm: valueState(true),
    confirmRequiresPlanHash: valueState(true),
    approvalReadinessSource: valueState('goal-event-log.v1 only')
  };
}

function buildV29WorkerEvidencePrompt({
  goalId,
  taskId,
  operation,
  runResult,
  evidenceArtifactPath,
  sourceWorkspacePath,
  evidenceRef,
  actorId
}) {
  return [
    '/goal',
    `Record worker evidence for ${goalId} ${taskId}.`,
    '',
    'Use this confirmed implementation operation:',
    `- operationId: ${operation.operationId}`,
    `- runId: ${runResult.runId}`,
    `- executionPlanId: ${runResult.executionPlanId}`,
    `- runStatus: ${runResult.status ?? MISSING_TEXT}`,
    `- verifierStatus: ${runResult.verifierStatus ?? MISSING_TEXT}`,
    `- evidenceArtifactPath: ${evidenceArtifactPath}`,
    `- sourceWorkspacePath: ${sourceWorkspacePath ?? MISSING_TEXT}`,
    '',
    'Register this event through the controlled goal update flow:',
    '- event: worker.evidence-recorded',
    `- actor: ${actorId}`,
    `- evidenceRef: ${evidenceRef}`,
    '',
    'Run the goal update dry-run first, then confirm with the returned plan hash.',
    'Do not review, approve, run main verification, merge, push, tag, or treat this evidence ref as release readiness.'
  ].join('\n');
}

function projectV25WorkerEvidenceHandoff({
  nextAction,
  latestRun,
  evidenceRefHelper
}) {
  const goalId = nextAction?.goalId;
  const taskId = nextAction?.next?.taskId;
  const workerEvidenceDefinition = GOAL_EVENT_FORM_DEFINITIONS.find((definition) => (
    definition.eventType === 'worker.evidence-recorded'
  ));
  const evidenceArtifactPath = firstNonEmptyString(
    latestRun?.evidenceArtifactPath,
    latestRunArtifactPathByKind(latestRun, 'evidence')
  );
  const sourceWorkspacePath = latestRun?.sourceWorkspacePath;
  const evidenceRef = latestRunEvidenceRefByKind(latestRun, 'evidence');
  const available = goalId === V25_CONTROLLED_IMPLEMENTATION_GOAL_ID
    && workerEvidenceDefinition !== undefined
    && isNonEmptyString(taskId)
    && isNonEmptyString(latestRun?.runId)
    && isNonEmptyString(evidenceArtifactPath)
    && isNonEmptyString(sourceWorkspacePath)
    && isNonEmptyString(evidenceRef)
    && latestRunIsConfirmedIsolatedWorkspaceRun(latestRun);

  if (!available) {
    return {
      state: 'empty',
      goalId: valueState(goalId),
      taskId: valueState(taskId),
      sourceRunId: valueState(latestRun?.runId),
      executionPlanId: valueState(latestRun?.executionPlanId),
      evidenceArtifactPath: valueState(evidenceArtifactPath),
      sourceWorkspacePath: valueState(sourceWorkspacePath),
      evidenceRef: valueState(evidenceRef),
      registrationForm: null,
      promptHandoff: {
        available: valueState(false),
        format: valueState('markdown'),
        text: textState(MISSING_TEXT)
      },
      safety: projectV25WorkerEvidenceHandoffSafety(),
      note: 'v25 worker evidence handoff appears only after a confirmed isolated workspace run exposes evidenceArtifactPath, sourceWorkspacePath, and a managed evidence artifact ref.'
    };
  }

  const actorId = `codex-v25-${taskId}-worker`;
  const statement = `Confirmed isolated workspace run ${latestRun.runId} produced worker evidence.`;
  const registrationForm = projectGoalEventFormSpec({
    definition: workerEvidenceDefinition,
    nextAction,
    recommended: true,
    evidenceRefHelper,
    fieldOverrides: {
      workerActor: {
        value: actorId,
        source: 'v25 worker evidence handoff'
      },
      evidenceRef: {
        value: evidenceRef,
        source: 'latest run evidenceArtifactPath'
      },
      statement: {
        value: statement,
        source: 'v25 worker evidence handoff'
      }
    }
  });

  return {
    state: 'available',
    goalId: valueState(goalId),
    taskId: valueState(taskId),
    sourceRunId: valueState(latestRun.runId),
    executionPlanId: valueState(latestRun.executionPlanId),
    evidenceArtifactPath: valueState(evidenceArtifactPath),
    sourceWorkspacePath: valueState(sourceWorkspacePath),
    evidenceRef: valueState(evidenceRef),
    registrationForm,
    promptHandoff: {
      available: valueState(true),
      format: valueState('markdown'),
      text: textState(buildV25WorkerEvidencePrompt({
        goalId,
        taskId,
        latestRun,
        evidenceArtifactPath,
        sourceWorkspacePath,
        evidenceRef,
        actorId
      }))
    },
    safety: projectV25WorkerEvidenceHandoffSafety(),
    note: 'This v25 handoff turns the confirmed isolated workspace run output into a worker.evidence-recorded registration form. It does not infer approval, run a shell command, merge, tag, or let the worker review the task.'
  };
}

function latestRunIsConfirmedIsolatedWorkspaceRun(latestRun) {
  return latestRun?.workspaceWrites === true
    && latestRun?.mainWorktreeWrites === false
    && isNonEmptyString(latestRun?.executionPlanId)
    && Array.isArray(latestRun?.pipeline)
    && latestRun.pipeline.includes('implement');
}

function projectAdoptionCandidates({
  runsResult,
  runs,
  latestRun,
  operationsResult,
  operations,
  activeGoal
}) {
  const normalizedSources = buildAdoptionCandidateSources({
    runs,
    latestRun,
    operations
  });
  const routeRuns = Array.isArray(runs?.runs) ? runs.runs : null;
  const operationRuns = Array.isArray(operations?.runs)
    ? operations.runs.filter((run) => run?.commandKind === 'implementation')
    : null;
  const candidateRuns = normalizedSources.filter((source) => source.decision.ready === true);
  const blockedRuns = normalizedSources.filter((source) => source.decision.ready !== true);
  const latestRunId = latestRun?.runId;
  const sourceContract = operationRuns !== null && operationRuns.length > 0
    ? GOAL_OPERATION_RUNS_CONTRACT_NAME
    : 'symphony.console-runs';
  const sourceRouteResult = sourceContract === GOAL_OPERATION_RUNS_CONTRACT_NAME
    ? operationsResult
    : runsResult;

  return {
    state: normalizedSources.length === 0 ? routeRuns === null && operationRuns === null ? 'missing' : 'empty' : 'available',
    modelName: valueState('AdoptionCandidateProjectionV30'),
    goalId: valueState(firstValue(activeGoal?.viewModel?.goalId, activeGoal?.runbook?.goalId, activeGoal?.nextAction?.goalId)),
    taskId: valueState(firstValue(activeGoal?.nextAction?.next?.taskId, activeGoal?.taskQueue?.nextTaskId)),
    sourceContract: valueState(sourceContract),
    routeState: valueState(routeStateFromResult(sourceRouteResult)),
    route: valueState(sourceRouteResult?.route),
    fallbackSourceContract: valueState(sourceContract === GOAL_OPERATION_RUNS_CONTRACT_NAME ? 'not-used' : 'symphony.console-runs'),
    count: valueState(candidateRuns.length),
    blockedCount: valueState(blockedRuns.length),
    totalRunsScanned: valueState(normalizedSources.length),
    criteria: {
      status: valueState('run status is passed'),
      verifierStatus: valueState('verifier status is passed'),
      artifactRefs: valueState('managed artifactRefs include an evidence artifact or evidence ref'),
      workspace: valueState('isolated workspace refs include sourceWorkspacePath and sourceWorkspaceManifestPath'),
      fingerprint: valueState('sourceWorkspaceFingerprint is present'),
      mainWorktreeWrites: valueState(false),
      sourcePolicy: valueState('passed run + artifact refs + workspace refs + fingerprints + verifier status')
    },
    items: candidateRuns.map((run) => projectAdoptionCandidateRun({
      run,
      latestRunId
    })),
    blockedItems: blockedRuns.map((run) => projectAdoptionCandidateRun({
      run,
      latestRunId
    })),
    safety: {
      readOnly: valueState(true),
      copyOnly: valueState(true),
      browserExecutionAvailable: valueState(false),
      genericShellRunner: valueState(false),
      workerCanApproveOwnTask: valueState(false),
      approvalReadinessSource: valueState('goal-event-log.v1 only'),
      adoptionReadinessSource: valueState('backend operation/run fields only'),
      unsupportedInferenceSources: arrayTextState(['file-name', 'branch', 'commit-message', 'prompt-text', 'task-title', 'frontend-heuristic'])
    },
    note: 'Adoption Candidate Panel normalizes v29 implementation operations into adoptable and blocked rows from backend run status, artifact refs, workspace refs, fingerprints, and verifier status. It does not plan adoption, inspect patches, confirm adoption, merge, tag, or infer reviewer/main/release status.'
  };
}

function projectAdoptionCandidateRun({ run, latestRunId }) {
  const evidenceArtifactPath = firstNonEmptyString(run?.evidenceArtifactPath, run?.evidenceArtifact?.path);
  const evidenceRef = firstNonEmptyString(run?.evidenceRef, run?.evidenceArtifact?.ref);
  const changedFiles = adoptionCandidateChangedFiles(run);

  return {
    sourceRunId: valueState(run?.runId),
    sourceContract: valueState(run?.sourceContract),
    operationId: valueState(run?.operationId),
    operationStatus: valueState(run?.operationStatus),
    goalId: valueState(run?.goalId),
    taskId: valueState(run?.taskId),
    isLatest: valueState(Boolean(latestRunId && run?.runId === latestRunId)),
    adoptionStatus: valueState(run?.decision?.ready === true ? 'candidate' : 'blocked'),
    blockingReasons: projectTextItems(run?.decision?.reasons),
    status: valueState(run?.status),
    verifierStatus: valueState(run?.verifierStatus),
    workspace: {
      path: valueState(run?.sourceWorkspacePath),
      manifestPath: valueState(run?.sourceWorkspaceManifestPath),
      fingerprint: valueState(run?.sourceWorkspaceFingerprint)
    },
    evidence: {
      artifactPath: valueState(evidenceArtifactPath),
      ref: valueState(evidenceRef),
      artifactCount: valueState(run?.artifactRefs?.length),
      verifierStatus: valueState(run?.verifierStatus)
    },
    changedFiles: {
      count: valueState(changedFiles.length),
      text: textState(changedFiles.length === 0 ? '未暴露' : changedFiles.join('、')),
      items: changedFiles.map((file) => valueState(file))
    },
    verifier: {
      status: valueState(run?.verifierStatus),
      summaryStatus: valueState(run?.verifierSummary?.status),
      passed: valueState(run?.verifierSummary?.passed === true)
    },
    executionPlanId: valueState(run?.executionPlanId),
    writeBoundary: valueState(run?.writeBoundary),
    workspaceWrites: valueState(run?.workspaceWrites),
    mainWorktreeWrites: valueState(run?.mainWorktreeWrites),
    updatedAt: valueState(run?.updatedAt)
  };
}

function projectAdoptionPlanPreviewWorkspace({ candidates, operations, activeGoal }) {
  const goalId = firstValue(candidates?.goalId, activeGoal?.viewModel?.goalId, activeGoal?.runbook?.goalId);
  const taskId = firstValue(candidates?.taskId, activeGoal?.nextAction?.next?.taskId, activeGoal?.taskQueue?.nextTaskId);
  const freezeRoute = isNonEmptyString(goalId)
    ? CONTROLLED_ADOPTION_PLAN_FREEZE_ROUTE_TEMPLATE.path.replace('<goal-id>', encodeURIComponent(goalId))
    : null;
  const latestFreeze = latestAdoptionPlanFreezeOperationForTask(operations, {
    goalId,
    taskId
  });
  const candidateItems = Array.isArray(candidates?.items) ? candidates.items : [];

  return {
    state: candidateItems.length === 0 && latestFreeze === null ? 'waiting-for-candidate' : 'available',
    modelName: valueState('AdoptionPlanPreviewWorkspaceV30'),
    contractName: valueState(CONTROLLED_ADOPTION_PLAN_FREEZE_CONTRACT_NAME),
    goalId: valueState(goalId),
    taskId: valueState(taskId),
    freezeEndpoint: {
      route: valueState(freezeRoute),
      method: valueState('POST'),
      allowedBodyFields: arrayTextState(['goalId', 'taskId', 'sourceRunId', 'operationId']),
      requiresSameGoalTaskContext: valueState(true),
      requiresAdoptableCandidate: valueState(true),
      rejectsPromptInput: valueState(true),
      rejectsPlanHashInput: valueState(true),
      rejectsConfirmAdoptionInput: valueState(true)
    },
    candidates: {
      count: valueState(candidateItems.length),
      items: candidateItems.map((candidate) => projectAdoptionFreezeCandidate({
        candidate,
        goalId,
        taskId,
        freezeRoute
      }))
    },
    frozenPlan: projectFrozenAdoptionPlan(latestFreeze),
    safety: {
      workbenchWriteAvailable: valueState(true),
      writeScope: valueState('freeze adoption plan artifacts only'),
      mappedToExistingAdoptRun: valueState(true),
      mainWorktreeWrites: valueState(false),
      adoptionConfirmAvailable: valueState(false),
      browserExecutionAvailable: valueState(false),
      modelInvocationAvailable: valueState(false),
      genericShellRunner: valueState(false),
      arbitraryPathReadAvailable: valueState(false),
      mergeAvailable: valueState(false),
      pushAvailable: valueState(false),
      tagAvailable: valueState(false),
      selfApprovalAvailable: valueState(false),
      unsupportedInferenceSources: arrayTextState(['file-name', 'branch', 'commit-message', 'prompt-text', 'task-title', 'frontend-heuristic'])
    },
    recoveryNotes: {
      inspectCommandPattern: valueState('symphony adopt --inspect <adoption-id> --json'),
      confirmCommandSource: valueState('frozen adoption plan confirmationCommand'),
      failureRecovery: valueState('Inspect the frozen plan and journal before any confirm step.')
    },
    note: 'Adoption plan preview workspace freezes an adoption plan from an explicit adoptable implementation run through the backend adopt --run path. It shows patch summary, fingerprints, affected files, and recovery notes; it does not confirm adoption or apply patches.'
  };
}

function projectAdoptionInspectRecoveryWorkspace({ planPreviewWorkspace, activeGoal, result, inspect }) {
  const frozenPlan = planPreviewWorkspace?.frozenPlan;
  const adoptionPlanId = frozenPlan?.adoptionPlanId?.value;
  const goalId = firstValue(planPreviewWorkspace?.goalId, activeGoal?.viewModel?.goalId, activeGoal?.runbook?.goalId);
  const taskId = firstValue(planPreviewWorkspace?.taskId, activeGoal?.nextAction?.next?.taskId, activeGoal?.taskQueue?.nextTaskId);
  const inspectRoute = isNonEmptyString(adoptionPlanId)
    ? ADOPTION_INSPECT_ROUTE_TEMPLATE.path.replace('<adoption-id>', encodeURIComponent(adoptionPlanId))
    : null;
  const confirmRoute = isNonEmptyString(goalId)
    ? CONTROLLED_ADOPTION_CONFIRM_ROUTE_TEMPLATE.path.replace('<goal-id>', encodeURIComponent(goalId))
    : null;
  const confirmBodyAvailable = [goalId, taskId, adoptionPlanId, frozenPlan?.operationId?.value].every(isNonEmptyString);
  const inspectionAvailable = result?.ok === true && inspect?.adoptionPlanId === adoptionPlanId;
  const inspection = inspectionAvailable ? inspect : null;
  const latestConfirmationRun = inspection?.latestConfirmationRun ?? null;

  return {
    state: inspectionAvailable ? 'inspected' : isNonEmptyString(inspectRoute) ? 'available' : 'waiting-for-frozen-plan',
    modelName: valueState('AdoptionInspectRecoveryViewV30'),
    contractName: valueState(CONSOLE_ADOPTION_INSPECT_CONTRACT_NAME),
    goalId: valueState(goalId),
    taskId: valueState(taskId),
    selectedFrozenPlan: {
      sourceContract: frozenPlan?.sourceContract ?? valueState(GOAL_OPERATION_RUNS_CONTRACT_NAME),
      operationId: frozenPlan?.operationId ?? valueState(undefined),
      operationStatus: frozenPlan?.operationStatus ?? valueState(undefined),
      adoptionPlanId: frozenPlan?.adoptionPlanId ?? valueState(undefined),
      adoptionPlanArtifactPath: frozenPlan?.adoptionPlanArtifactPath ?? valueState(undefined),
      patchArtifactPath: frozenPlan?.patchArtifactPath ?? valueState(undefined),
      patchHash: frozenPlan?.patchHash ?? valueState(undefined),
      sourceRunId: frozenPlan?.sourceRunId ?? valueState(undefined),
      sourceOperationId: frozenPlan?.sourceOperationId ?? valueState(undefined),
      sourceWorkspaceFingerprint: frozenPlan?.fingerprints?.sourceWorkspaceFingerprint ?? valueState(undefined),
      changedFileCount: frozenPlan?.changedFiles?.count ?? valueState(0),
      fileOperationCount: frozenPlan?.fileOperations?.count ?? valueState(0)
    },
    inspectEndpoint: {
      route: valueState(inspectRoute),
      method: valueState('GET'),
      adoptionIdSource: valueState('goal-operation-runs.v1 adoption-plan runResult.adoptionPlanId'),
      acceptsUserPathInput: valueState(false),
      acceptsConfirmInput: valueState(false),
      readOnly: valueState(true)
    },
    confirmEndpoint: {
      route: valueState(confirmRoute),
      method: valueState('POST'),
      adoptionIdSource: valueState('goal-operation-runs.v1 adoption-plan runResult.adoptionPlanId'),
      allowedBodyFields: arrayTextState(['goalId', 'taskId', 'adoptionPlanId', 'operationId']),
      requestPayload: confirmBodyAvailable ? {
        goalId,
        taskId,
        adoptionPlanId,
        operationId: frozenPlan.operationId.value
      } : null,
      requiresFrozenPlanOperation: valueState(true),
      refreshesAfterConfirm: arrayTextState(['goal-status', 'goal-events', 'goal-operation-runs', 'runs', 'goal-next-action']),
      acceptsUserPathInput: valueState(false),
      acceptsPlanHashInput: valueState(false),
      acceptsShellCommandInput: valueState(false)
    },
    inspection: projectAdoptionInspectOutput(inspection, result),
    patchRefs: {
      adoptionPlanArtifactPath: frozenPlan?.adoptionPlanArtifactPath ?? valueState(undefined),
      patchArtifactPath: frozenPlan?.patchArtifactPath ?? valueState(undefined),
      patchHash: frozenPlan?.patchHash ?? valueState(undefined),
      fileOperations: frozenPlan?.fileOperations ?? { count: valueState(0), items: [] }
    },
    evidenceContext: {
      sourceRunId: frozenPlan?.sourceRunId ?? valueState(undefined),
      sourceRunArtifactPath: frozenPlan?.sourceRunArtifactPath ?? valueState(undefined),
      sourceEvidenceArtifactPath: frozenPlan?.sourceEvidenceArtifactPath ?? valueState(undefined),
      sourceVerifierStatus: frozenPlan?.sourceVerifierStatus ?? valueState(undefined),
      latestConfirmationEvidenceArtifactPath: valueState(latestConfirmationRun?.evidenceArtifactPath)
    },
    recoveryContext: {
      journalStateSource: valueState('adoption inspect journal.status'),
      beforeHashSource: valueState('adoption inspect currentWorktreeMatchesJournalBeforeFilesDetails.files[].expected.hash'),
      afterHashSource: valueState('adoption inspect currentWorktreeMatchesAfterHashDetails.files[].expected.hash'),
      currentWorktreeMatchSource: valueState('adoption inspect currentWorktreeMatchesAfterHash and currentWorktreeMatchesJournalBeforeFiles'),
      copyOnlyInspectCommand: frozenPlan?.recoveryNotes?.inspectCommand ?? valueState(undefined)
    },
    safety: {
      readOnly: valueState(false),
      workbenchWriteAvailable: valueState(true),
      writeScope: valueState('controlled symphony adopt --confirm <adoption-id> --json only'),
      adoptionConfirmAvailable: valueState(confirmBodyAvailable && isNonEmptyString(confirmRoute)),
      applyPatchAvailable: valueState(false),
      browserExecutionAvailable: valueState(false),
      modelInvocationAvailable: valueState(false),
      genericShellRunner: valueState(false),
      arbitraryPathReadAvailable: valueState(false),
      mergeAvailable: valueState(false),
      pushAvailable: valueState(false),
      tagAvailable: valueState(false),
      selfApprovalAvailable: valueState(false),
      readinessInferenceAvailable: valueState(false),
      unsupportedInferenceSources: arrayTextState(['file-name', 'branch', 'commit-message', 'prompt-text', 'task-title', 'frontend-heuristic'])
    },
    note: 'Adoption inspect and recovery view reads the frozen adoption id from the scoped active-goal adoption-plan operation, displays journal and hash context, and exposes a controlled confirm request mapped to existing symphony adopt --confirm semantics. Confirm refreshes active goal, events, runs, operations, and next action; it does not merge, push, tag, publish, self-approve, or register review/main/release events.'
  };
}

function projectAdoptionInspectOutput(inspect, result) {
  if (inspect === null || inspect === undefined) {
    return {
      state: result?.ok === false ? 'unavailable' : 'missing',
      routeState: valueState(result?.ok === false ? 'failed' : 'not-fetched'),
      httpStatus: valueState(result?.httpStatus),
      error: valueState(result?.message),
      contractName: valueState(undefined),
      adoptionPlanId: valueState(undefined),
      journal: {
        status: valueState(undefined),
        confirmationRunId: valueState(undefined),
        artifactPath: valueState(undefined),
        createdAt: valueState(undefined)
      },
      latestConfirmationRun: {
        runId: valueState(undefined),
        status: valueState(undefined),
        failurePhase: valueState(undefined),
        evidenceArtifactPath: valueState(undefined)
      },
      hashes: {
        patchHash: valueState(undefined),
        currentWorktreeMatchesAfterHash: valueState(undefined),
        currentWorktreeMatchesJournalBeforeFiles: valueState(undefined)
      },
      afterHashFiles: projectAdoptionInspectHashFiles(null),
      beforeJournalFiles: projectAdoptionInspectHashFiles(null),
      recommendedCommands: { count: valueState(0), items: [] }
    };
  }

  return {
    state: 'available',
    routeState: valueState('ready'),
    httpStatus: valueState(result?.httpStatus),
    error: valueState(undefined),
    contractName: valueState(inspect.contractName),
    adoptionPlanId: valueState(inspect.adoptionPlanId),
    status: valueState(inspect.status),
    journal: {
      status: valueState(inspect.journal?.status ?? 'missing'),
      confirmationRunId: valueState(inspect.journal?.confirmationRunId),
      artifactPath: valueState(inspect.journal?.artifactPath),
      createdAt: valueState(inspect.journal?.createdAt)
    },
    latestConfirmationRun: {
      runId: valueState(inspect.latestConfirmationRun?.runId),
      status: valueState(inspect.latestConfirmationRun?.status),
      failurePhase: valueState(inspect.latestConfirmationRun?.failurePhase),
      evidenceArtifactPath: valueState(inspect.latestConfirmationRun?.evidenceArtifactPath)
    },
    hashes: {
      patchHash: valueState(inspect.patchHash),
      currentWorktreeMatchesAfterHash: valueState(inspect.currentWorktreeMatchesAfterHash),
      currentWorktreeMatchesJournalBeforeFiles: valueState(inspect.currentWorktreeMatchesJournalBeforeFiles)
    },
    afterHashFiles: projectAdoptionInspectHashFiles(inspect.currentWorktreeMatchesAfterHashDetails),
    beforeJournalFiles: projectAdoptionInspectHashFiles(inspect.currentWorktreeMatchesJournalBeforeFilesDetails),
    recommendedCommands: {
      count: valueState(Array.isArray(inspect.recommendedCommands) ? inspect.recommendedCommands.length : 0),
      items: Array.isArray(inspect.recommendedCommands)
        ? inspect.recommendedCommands.map((command) => ({
            id: valueState(command?.id),
            label: valueState(command?.label),
            command: valueState(command?.command),
            mode: valueState(command?.mode)
          }))
        : []
    }
  };
}

function projectAdoptionInspectHashFiles(details) {
  const files = Array.isArray(details?.files) ? details.files : [];

  return {
    matches: valueState(details?.matches),
    reason: valueState(details?.reason),
    count: valueState(files.length),
    items: files.map((file) => ({
      path: valueState(file?.path),
      matches: valueState(file?.matches),
      expectedHash: valueState(file?.expected?.hash),
      actualHash: valueState(file?.actual?.hash),
      expectedSize: valueState(file?.expected?.size),
      actualSize: valueState(file?.actual?.size)
    }))
  };
}

function projectAdoptionFreezeCandidate({ candidate, goalId, taskId, freezeRoute }) {
  const sourceRunId = candidate?.sourceRunId?.value;
  const operationId = candidate?.operationId?.value;
  const bodyAvailable = [goalId, taskId, sourceRunId, operationId].every(isNonEmptyString);

  return {
    sourceRunId: candidate.sourceRunId,
    operationId: candidate.operationId,
    goalId: candidate.goalId,
    taskId: candidate.taskId,
    workspace: candidate.workspace,
    evidence: candidate.evidence,
    changedFiles: candidate.changedFiles,
    verifierStatus: candidate.verifierStatus,
    sourceWorkspaceFingerprint: candidate.workspace.fingerprint,
    freeze: {
      available: valueState(bodyAvailable && isNonEmptyString(freezeRoute)),
      endpointRoute: valueState(freezeRoute),
      requestPayload: bodyAvailable ? {
        goalId,
        taskId,
        sourceRunId,
        operationId
      } : null
    }
  };
}

function projectFrozenAdoptionPlan(operation) {
  if (operation === null) {
    return {
      state: 'missing',
      sourceContract: valueState(GOAL_OPERATION_RUNS_CONTRACT_NAME),
      operationId: valueState(undefined),
      adoptionPlanId: valueState(undefined),
      patchHash: valueState(undefined),
      changedFiles: { count: valueState(0), items: [] },
      fileOperations: { count: valueState(0), items: [] },
      fingerprints: {
        sourceWorkspaceFingerprint: valueState(undefined),
        projectFingerprint: valueState(undefined),
        gitHead: valueState(undefined),
        gitStatusFingerprint: valueState(undefined)
      },
      recoveryNotes: {
        inspectCommand: valueState(undefined),
        confirmCommand: valueState(undefined),
        failureRecovery: valueState(undefined)
      }
    };
  }

  const run = operation.runResult ?? {};
  const changedFiles = Array.isArray(run.changedFiles) ? run.changedFiles.filter(isNonEmptyString) : [];
  const fileOperations = Array.isArray(run.fileOperations) ? run.fileOperations : [];

  return {
    state: 'available',
    sourceContract: valueState(GOAL_OPERATION_RUNS_CONTRACT_NAME),
    operationId: valueState(operation.operationId),
    operationStatus: valueState(operation.status),
    commandKind: valueState(operation.commandKind),
    adoptionPlanId: valueState(run.adoptionPlanId),
    adoptionPlanArtifactPath: valueState(run.adoptionPlanArtifactPath),
    patchArtifactPath: valueState(run.patchArtifactPath),
    patchHash: valueState(run.patchHash),
    sourceRunId: valueState(run.sourceRunId),
    sourceRunArtifactPath: valueState(run.sourceRunArtifactPath),
    sourceOperationId: valueState(run.sourceOperationId),
    sourceEvidenceArtifactPath: valueState(run.sourceEvidenceArtifactPath),
    sourceVerifierStatus: valueState(run.sourceVerifierStatus),
    sourceWorkspacePath: valueState(run.sourceWorkspacePath),
    sourceWorkspaceManifestPath: valueState(run.sourceWorkspaceManifestPath),
    changedFiles: {
      count: valueState(changedFiles.length),
      items: changedFiles.map((file) => valueState(file))
    },
    fileOperations: {
      count: valueState(fileOperations.length),
      items: fileOperations.map((fileOperation) => ({
        path: valueState(fileOperation?.path),
        operation: valueState(fileOperation?.operation),
        beforeHash: valueState(fileOperation?.beforeHash),
        afterHash: valueState(fileOperation?.afterHash),
        size: valueState(fileOperation?.size)
      }))
    },
    fingerprints: {
      sourceWorkspaceFingerprint: valueState(run.sourceWorkspaceFingerprint),
      projectFingerprint: valueState(run.projectFingerprint),
      gitHead: valueState(run.gitHead),
      gitStatusFingerprint: valueState(run.gitStatusFingerprint),
      patchHash: valueState(run.patchHash)
    },
    recoveryNotes: {
      inspectCommand: valueState(isNonEmptyString(run.adoptionPlanId) ? `symphony adopt --inspect ${run.adoptionPlanId} --json` : undefined),
      confirmCommand: valueState(run.confirmationCommand),
      failureRecovery: valueState('Inspect the frozen plan and journal before any confirm step.')
    },
    outputSummary: {
      stdout: textState(operation.output?.stdout ?? ''),
      stderr: textState(operation.output?.stderr ?? '')
    }
  };
}

function latestAdoptionPlanFreezeOperationForTask(operations, { goalId, taskId }) {
  if (!Array.isArray(operations?.runs)) {
    return null;
  }

  for (const run of [...operations.runs].reverse()) {
    if (run?.goalId === goalId
      && (taskId === null || taskId === undefined || run?.taskId === taskId)
      && run?.commandKind === 'adoption-plan'
      && run?.status === 'confirmed') {
      return run;
    }
  }

  return null;
}

function latestAdoptionConfirmOperationForTask(operations, { goalId, taskId, adoptionPlanId }) {
  if (!Array.isArray(operations?.runs)) {
    return null;
  }

  for (const run of [...operations.runs].reverse()) {
    if (run?.goalId !== goalId
      || run?.taskId !== taskId
      || run?.commandKind !== 'adoption-confirm'
      || run?.status !== 'confirmed') {
      continue;
    }

    if (isNonEmptyString(adoptionPlanId) && run?.runResult?.adoptionPlanId !== adoptionPlanId) {
      continue;
    }

    return run;
  }

  return null;
}

function buildAdoptionCandidateSources({ runs, latestRun, operations }) {
  const operationRuns = Array.isArray(operations?.runs)
    ? operations.runs.filter((run) => run?.commandKind === 'implementation')
    : [];

  if (operationRuns.length > 0) {
    return operationRuns.map((operation) => normalizeAdoptionCandidateFromOperation(operation));
  }

  const routeRuns = Array.isArray(runs?.runs) ? runs.runs : [];
  const fallbackRuns = routeRuns.length > 0 ? routeRuns : latestRun !== null && latestRun !== undefined ? [latestRun] : [];

  return fallbackRuns.map((run) => normalizeAdoptionCandidateFromRun(run));
}

function normalizeAdoptionCandidateFromOperation(operation) {
  const runResult = operation?.runResult ?? {};
  const artifactRefs = Array.isArray(operation?.artifactRefs)
    ? operation.artifactRefs
    : Array.isArray(runResult?.artifactRefs) ? runResult.artifactRefs : [];
  const normalized = normalizeAdoptionCandidateRun({
    run: runResult,
    sourceContract: GOAL_OPERATION_RUNS_CONTRACT_NAME,
    operation,
    artifactRefs,
    verifierSummary: operation?.verifierSummary ?? runResult?.verifierSummary
  });

  return {
    ...normalized,
    goalId: operation?.goalId,
    taskId: operation?.taskId,
    operationId: operation?.operationId,
    operationStatus: operation?.status,
    updatedAt: firstNonEmptyString(operation?.timestamps?.updatedAt, runResult?.updatedAt)
  };
}

function normalizeAdoptionCandidateFromRun(run) {
  return normalizeAdoptionCandidateRun({
    run,
    sourceContract: 'symphony.console-runs',
    operation: null,
    artifactRefs: Array.isArray(run?.artifactRefs) ? run.artifactRefs : [],
    verifierSummary: run?.verifierSummary
  });
}

function normalizeAdoptionCandidateRun({
  run,
  sourceContract,
  operation,
  artifactRefs,
  verifierSummary
}) {
  const runId = firstNonEmptyString(run?.runId, run?.sourceRunId, operation?.runResult?.runId);
  const evidenceArtifact = findEvidenceArtifactRef(artifactRefs);
  const evidenceRef = normalizedManagedArtifactEvidenceRef(evidenceArtifact?.ref)
    ?? (isNonEmptyString(runId) && isNonEmptyString(evidenceArtifact?.kind)
      ? `artifact-ref:artifact:${runId}:${evidenceArtifact.kind}`
      : null);
  const normalized = {
    sourceContract,
    runId,
    status: run?.status,
    verifierStatus: firstNonEmptyString(run?.verifierStatus, verifierSummary?.status),
    verifierSummary,
    executionPlanId: run?.executionPlanId,
    writeBoundary: run?.writeBoundary,
    workspaceWrites: run?.workspaceWrites,
    mainWorktreeWrites: run?.mainWorktreeWrites,
    sourceWorkspacePath: run?.sourceWorkspacePath,
    sourceWorkspaceManifestPath: run?.sourceWorkspaceManifestPath,
    sourceWorkspaceFingerprint: run?.sourceWorkspaceFingerprint,
    evidenceArtifactPath: firstNonEmptyString(run?.evidenceArtifactPath, evidenceArtifact?.path),
    evidenceRef,
    evidenceArtifact,
    artifactRefs,
    changedFiles: Array.isArray(run?.changedFiles) ? run.changedFiles : [],
    fileOperations: Array.isArray(run?.fileOperations) ? run.fileOperations : [],
    updatedAt: run?.updatedAt,
    decision: null
  };

  normalized.decision = buildAdoptionCandidateDecision(normalized);

  return normalized;
}

function buildAdoptionCandidateDecision(run) {
  const reasons = [];
  const hasIsolatedWorkspace = run?.workspaceWrites === true || run?.writeBoundary === 'isolated-workspace';
  const verifierPassed = run?.verifierStatus === 'passed' || run?.verifierSummary?.passed === true;

  if (!isNonEmptyString(run?.runId)) {
    reasons.push('missing source run id');
  }

  if (run?.status !== 'passed') {
    reasons.push('run status is not passed');
  }

  if (!verifierPassed) {
    reasons.push('verifier status is not passed');
  }

  if (!hasIsolatedWorkspace) {
    reasons.push('isolated workspace write boundary is not confirmed');
  }

  if (run?.mainWorktreeWrites !== false) {
    reasons.push('mainWorktreeWrites is not false');
  }

  if (!isNonEmptyString(run?.sourceWorkspacePath) || !isNonEmptyString(run?.sourceWorkspaceManifestPath)) {
    reasons.push('workspace refs are incomplete');
  }

  if (!isNonEmptyString(run?.sourceWorkspaceFingerprint)) {
    reasons.push('source workspace fingerprint is missing');
  }

  if (!Array.isArray(run?.artifactRefs) || run.artifactRefs.length === 0 || !isNonEmptyString(run?.evidenceRef)) {
    reasons.push('managed evidence artifact ref is missing');
  }

  return {
    ready: reasons.length === 0,
    reasons
  };
}

function findEvidenceArtifactRef(artifactRefs) {
  if (!Array.isArray(artifactRefs)) {
    return null;
  }

  return artifactRefs.find((artifact) => artifact?.kind === 'evidence' || artifact?.artifactKind === 'evidence') ?? null;
}

function adoptionCandidateChangedFiles(run) {
  if (Array.isArray(run?.changedFiles)) {
    return run.changedFiles.filter((file) => isNonEmptyString(file));
  }

  if (!Array.isArray(run?.fileOperations)) {
    return [];
  }

  return unique(run.fileOperations
    .flatMap((operation) => [
      operation?.path,
      operation?.file,
      operation?.relativePath,
      operation?.targetPath,
      operation?.afterPath
    ])
    .filter((file) => isNonEmptyString(file)));
}

function latestRunEvidenceRefByKind(latestRun, kind) {
  if (!isNonEmptyString(kind)) {
    return null;
  }

  for (const artifact of Array.isArray(latestRun?.artifactRefs) ? latestRun.artifactRefs : []) {
    if (artifact?.kind !== kind) {
      continue;
    }

    const normalizedRef = normalizedManagedArtifactEvidenceRef(artifact?.ref);

    if (isNonEmptyString(normalizedRef)) {
      return normalizedRef;
    }
  }

  return isNonEmptyString(latestRun?.runId) ? `artifact-ref:artifact:${latestRun.runId}:${kind}` : null;
}

function latestRunArtifactPathByKind(latestRun, kind) {
  const artifact = Array.isArray(latestRun?.artifactRefs)
    ? latestRun.artifactRefs.find((candidate) => candidate?.kind === kind)
    : undefined;

  return artifact?.path;
}

function projectV25WorkerEvidenceHandoffSafety() {
  return {
    v25Only: valueState(true),
    genericShellRunner: valueState(false),
    browserExecutionAvailable: valueState(false),
    modelInvocationAvailable: valueState(false),
    workerCanApproveOwnTask: valueState(false),
    requiresGoalEventConfirm: valueState(true)
  };
}

function buildV25WorkerEvidencePrompt({
  goalId,
  taskId,
  latestRun,
  evidenceArtifactPath,
  sourceWorkspacePath,
  evidenceRef,
  actorId
}) {
  return [
    '/goal',
    `Record worker evidence for ${goalId} ${taskId}.`,
    '',
    'Use this confirmed isolated workspace run:',
    `- runId: ${latestRun.runId}`,
    `- executionPlanId: ${latestRun.executionPlanId}`,
    `- evidenceArtifactPath: ${evidenceArtifactPath}`,
    `- sourceWorkspacePath: ${sourceWorkspacePath}`,
    '',
    'Register this event in the goal ledger:',
    '- event: worker.evidence-recorded',
    `- actor: ${actorId}`,
    `- evidenceRef: ${evidenceRef}`,
    '',
    'Preview the goal update dry-run before confirming the event append.',
    'Do not review or approve this task from the worker role.'
  ].join('\n');
}

function projectEvidenceRefHelper({
  runbook,
  ledger,
  eventLog,
  latestRun,
  operations
}) {
  const recentRefs = collectRecentEvidenceRefs({
    runbook,
    ledger,
    eventLog,
    latestRun,
    operations
  });

  return {
    state: recentRefs.length === 0 ? 'empty' : 'available',
    helperName: valueState(EVIDENCE_REF_HELPER_NAME),
    inputMode: valueState('newline-separated-controlled-refs'),
    acceptedPatterns: arrayTextState(EVIDENCE_REF_ACCEPTED_PATTERNS),
    recentRefs: {
      state: recentRefs.length === 0 ? 'empty' : 'available',
      count: valueState(recentRefs.length),
      items: recentRefs
    },
    safety: {
      readsEvidenceBodies: valueState(false),
      opensLocalFiles: valueState(false),
      infersStatusFromFilename: valueState(false),
      infersStatusFromBranch: valueState(false)
    },
    note: 'Recent evidence refs are selectable identifiers from exposed runbook, ledger, events, and latest run artifact refs; they are not task status or approval signals.'
  };
}

function collectRecentEvidenceRefs({
  runbook,
  ledger,
  eventLog,
  latestRun,
  operations
}) {
  const refs = [];

  for (const run of [...(Array.isArray(operations?.runs) ? operations.runs : [])].reverse()) {
    if (run?.commandKind !== 'implementation' || run?.status !== 'confirmed') {
      continue;
    }

    const runResult = run.runResult ?? {};
    const sourceRunId = firstNonEmptyString(runResult.runId, run.operationId);
    const artifacts = Array.isArray(run.artifactRefs)
      ? run.artifactRefs
      : Array.isArray(runResult.artifactRefs) ? runResult.artifactRefs : [];

    for (const artifact of artifacts) {
      const artifactRef = normalizedManagedArtifactEvidenceRef(artifact?.ref)
        ?? (isNonEmptyString(sourceRunId) && isNonEmptyString(artifact?.kind)
          ? `artifact-ref:artifact:${sourceRunId}:${artifact.kind}`
          : null);

      addRecentEvidenceRef(refs, {
        ref: artifactRef,
        displayRef: artifact?.ref ?? artifact?.path,
        kind: 'artifact-ref',
        label: artifact?.kind,
        source: 'goal-operation-runs.v1 implementation artifactRefs',
        taskId: run?.taskId,
        artifactKind: artifact?.kind
      });
    }
  }

  for (const event of [...(Array.isArray(eventLog?.events) ? eventLog.events : [])].reverse()) {
    if (!Array.isArray(event?.evidenceRefs)) {
      continue;
    }

    for (const evidenceRef of event.evidenceRefs) {
      addRecentEvidenceRef(refs, {
        ref: evidenceRef?.kind === 'repo-doc' ? evidenceRef?.ref : `${evidenceRef?.kind}:${evidenceRef?.ref}`,
        displayRef: evidenceRef?.ref,
        kind: evidenceRef?.kind,
        label: evidenceRef?.label,
        source: 'goal-event-log.v1',
        taskId: event?.taskId,
        eventType: event?.eventType,
        sequence: event?.sequence
      });
    }
  }

  addRecentEvidenceRef(refs, {
    ref: ledger?.baseline?.evidenceRef,
    kind: 'repo-doc',
    label: 'Baseline evidence',
    source: 'goal-progress-ledger.v1 baseline'
  });

  addRecentEvidenceRef(refs, {
    ref: runbook?.baseline?.evidenceRef,
    kind: 'repo-doc',
    label: 'Runbook baseline evidence',
    source: 'goal-runbook.v1 baseline'
  });

  for (const task of Array.isArray(ledger?.tasks) ? ledger.tasks : []) {
    addRecentEvidenceRef(refs, {
      ref: task?.workerEvidenceRef,
      kind: 'repo-doc',
      label: 'Worker evidence',
      source: 'goal-progress-ledger.v1',
      taskId: task?.taskId
    });
    addRecentEvidenceRef(refs, {
      ref: task?.reviewEvidenceRef,
      kind: 'repo-doc',
      label: 'Review evidence',
      source: 'goal-progress-ledger.v1',
      taskId: task?.taskId
    });
    addRecentEvidenceRef(refs, {
      ref: task?.mainVerificationRef,
      kind: 'repo-doc',
      label: 'Main verification evidence',
      source: 'goal-progress-ledger.v1',
      taskId: task?.taskId
    });
  }

  for (const artifact of Array.isArray(latestRun?.artifactRefs) ? latestRun.artifactRefs : []) {
    const artifactRef = normalizedManagedArtifactEvidenceRef(artifact?.ref)
      ?? (isNonEmptyString(latestRun?.runId) && isNonEmptyString(artifact?.kind)
        ? `artifact-ref:artifact:${latestRun.runId}:${artifact.kind}`
        : null);

    addRecentEvidenceRef(refs, {
      ref: artifactRef,
      displayRef: artifact?.ref ?? artifact?.path,
      kind: 'artifact-ref',
      label: artifact?.kind,
      source: 'latest run artifactRefs',
      artifactKind: artifact?.kind
    });
  }

  return refs.slice(0, EVIDENCE_REF_HELPER_RECENT_LIMIT);
}

function addRecentEvidenceRef(refs, candidate) {
  if (!isNonEmptyString(candidate?.ref) || !isControlledEvidenceRefInput(candidate.ref)) {
    return;
  }

  const normalizedRef = normalizeEvidenceRefInput(candidate.ref);

  if (!isNonEmptyString(normalizedRef) || refs.some((item) => item.ref.value === normalizedRef)) {
    return;
  }

  refs.push({
    ref: valueState(normalizedRef),
    displayRef: valueState(candidate.displayRef ?? normalizedRef),
    kind: valueState(candidate.kind ?? evidenceRefKindForInput(normalizedRef)),
    label: valueState(candidate.label),
    source: valueState(candidate.source),
    taskId: valueState(candidate.taskId),
    eventType: valueState(candidate.eventType),
    sequence: valueState(candidate.sequence),
    artifactKind: valueState(candidate.artifactKind)
  });
}

function normalizedManagedArtifactEvidenceRef(value) {
  if (!isNonEmptyString(value)) {
    return null;
  }

  const ref = value.trim();

  if (ref.startsWith('artifact-ref:')) {
    return ref;
  }

  if (ref.startsWith('artifact:') || ref.startsWith('artifacts/') || ref.startsWith('managed-artifact:')) {
    return `artifact-ref:${ref}`;
  }

  return null;
}

function normalizeEvidenceRefInput(value) {
  const ref = String(value ?? '').trim();

  if (ref.startsWith('repo-doc:')) {
    return ref.slice('repo-doc:'.length);
  }

  return normalizedManagedArtifactEvidenceRef(ref) ?? ref;
}

function isControlledEvidenceRefInput(value) {
  const ref = normalizeEvidenceRefInput(value);

  if (!isNonEmptyString(ref) || isUnsafeControlledEvidenceRefInput(ref)) {
    return false;
  }

  return ref.startsWith('docs/plans/') || ref.startsWith('artifact-ref:');
}

function evidenceRefKindForInput(value) {
  return String(value ?? '').startsWith('artifact-ref:') ? 'artifact-ref' : 'repo-doc';
}

function isUnsafeControlledEvidenceRefInput(value) {
  const ref = String(value ?? '');
  const lower = ref.toLowerCase();

  if (
    ref.startsWith('/') ||
    ref.startsWith('file://') ||
    ref.startsWith('~/') ||
    ref.includes('\\') ||
    ref.includes('../') ||
    ref.includes('..\\') ||
    lower.includes('%2e') ||
    lower.includes('%2f') ||
    lower.includes('%5c')
  ) {
    return true;
  }

  try {
    const decoded = decodeURIComponent(ref);

    return decoded !== ref && isUnsafeControlledEvidenceRefInput(decoded);
  } catch {
    return true;
  }
}

function projectGoalEventFormField({
  fieldId,
  definition,
  goalId,
  taskId,
  fieldOverrides = {}
}) {
  const baseField = goalEventFieldDefinition({ fieldId, definition, goalId, taskId });
  const override = fieldOverrides[fieldId] ?? fieldOverrides[baseField.id] ?? {};
  const field = {
    ...baseField,
    ...override,
    id: baseField.id,
    options: override.options ?? baseField.options
  };

  return {
    id: valueState(field.id),
    label: valueState(field.label),
    flag: valueState(field.flag),
    inputType: valueState(field.inputType),
    required: valueState(field.required),
    readOnly: valueState(field.readOnly),
    value: valueState(field.value),
    placeholder: valueState(field.placeholder),
    source: valueState(field.source),
    options: projectGoalEventFieldOptions(field.options)
  };
}

function goalEventFieldDefinition({
  fieldId,
  definition,
  goalId,
  taskId
}) {
  const common = {
    id: fieldId,
    label: fieldId,
    flag: null,
    inputType: 'text',
    required: false,
    readOnly: false,
    value: undefined,
    placeholder: undefined,
    source: 'operator-input',
    options: []
  };

  switch (fieldId) {
    case 'goalId':
      return {
        ...common,
        label: 'goal id',
        flag: '--goal',
        required: true,
        readOnly: true,
        value: goalId,
        source: GOAL_NEXT_ACTION_CONTRACT_NAME
      };
    case 'taskId':
      return {
        ...common,
        label: 'task id',
        flag: '--task',
        required: true,
        readOnly: true,
        value: taskId,
        source: GOAL_NEXT_ACTION_CONTRACT_NAME
      };
    case 'eventType':
      return {
        ...common,
        label: 'event',
        flag: '--event',
        inputType: 'select',
        required: true,
        readOnly: definition.commandName !== 'symphony goal update',
        value: definition.eventType,
        source: 'form-catalog',
        options: [definition.eventType]
      };
    case 'workerActor':
      return {
        ...common,
        id: 'actorId',
        label: 'worker actor id',
        flag: '--actor',
        required: true,
        placeholder: 'codex-worker-task-id'
      };
    case 'reviewerId':
      return {
        ...common,
        label: 'reviewer id',
        flag: '--reviewer',
        required: true,
        placeholder: 'codex-reviewer-task-id'
      };
    case 'verifierId':
      return {
        ...common,
        label: 'verifier id',
        flag: '--verifier',
        required: true,
        placeholder: 'codex-main-verifier'
      };
    case 'verdict':
      return {
        ...common,
        label: 'verdict',
        flag: '--verdict',
        inputType: 'select',
        required: true,
        value: definition.verdict,
        source: 'form-catalog',
        options: ['approved', 'needs-revision']
      };
    case 'gateName':
      return {
        ...common,
        label: 'gate',
        flag: '--gate',
        inputType: 'select',
        required: true,
        readOnly: true,
        value: definition.gate,
        source: 'form-catalog',
        options: [definition.gate ?? 'main-verification']
      };
    case 'gateStatus':
      return {
        ...common,
        label: 'status',
        flag: '--status',
        inputType: 'select',
        required: true,
        value: definition.gateStatus,
        source: 'form-catalog',
        options: definition.gateStatus === 'declared' ? ['declared'] : ['passed', 'failed']
      };
    case 'evidenceRef':
      return {
        ...common,
        label: 'evidence ref',
        flag: '--evidence-ref',
        required: definition.requiresEvidence,
        placeholder: 'docs/plans/<evidence>.md or artifact:run:kind'
      };
    case 'failedCommand':
      return {
        ...common,
        label: 'failed command',
        flag: '--failed-command',
        placeholder: 'failed command line'
      };
    case 'statement':
      return {
        ...common,
        label: 'statement',
        flag: '--statement',
        placeholder: 'short event statement'
      };
    case 'branch':
      return {
        ...common,
        label: 'branch',
        flag: '--branch',
        placeholder: 'current branch'
      };
    case 'commit':
      return {
        ...common,
        label: 'commit',
        flag: '--commit',
        placeholder: 'commit sha or null'
      };
    case 'blockerId':
      return {
        ...common,
        label: 'blocker id',
        inputType: 'text',
        required: definition.eventType === 'blocker.resolved',
        placeholder: 'task-blocker-id'
      };
    case 'blockerReason':
      return {
        ...common,
        label: 'blocker reason',
        required: definition.eventType === 'blocker.opened',
        placeholder: 'what is blocking this task'
      };
    case 'blockerSeverity':
      return {
        ...common,
        label: 'blocker severity',
        inputType: 'select',
        value: 'warning',
        options: ['info', 'warning', 'error']
      };
    default:
      return common;
  }
}

function projectGoalEventFieldOptions(options) {
  if (!Array.isArray(options) || options.length === 0) {
    return {
      state: 'empty',
      count: valueState(0),
      items: []
    };
  }

  return {
    state: 'available',
    count: valueState(options.length),
    items: options.map((option) => valueState(option))
  };
}

function projectCloseoutSummary(summary) {
  return {
    totalTasks: valueState(summary?.totalTasks),
    workerEvidenceComplete: valueState(summary?.workerEvidenceComplete),
    reviewEvidenceComplete: valueState(summary?.reviewEvidenceComplete),
    mainVerificationComplete: valueState(summary?.mainVerificationComplete),
    releaseReady: valueState(summary?.releaseReady),
    releaseReadySource: valueState(summary?.releaseReadySource)
  };
}

function projectGoalControlSafety(safety) {
  return {
    readOnly: valueState(safety?.readOnly),
    copyOnly: valueState(safety?.copyOnly),
    workbenchWriteAvailable: valueState(safety?.workbenchWriteAvailable),
    browserExecutionAvailable: valueState(safety?.browserExecutionAvailable),
    modelInvocationAvailable: valueState(safety?.modelInvocationAvailable)
  };
}

function projectGoalCloseoutSafety(safety) {
  return {
    ...projectGoalControlSafety(safety),
    writesInDryRun: valueState(safety?.writesInDryRun),
    confirmRequiredForWrites: valueState(safety?.confirmRequiredForWrites),
    releaseReadyRequiresEvidence: valueState(safety?.releaseReadyRequiresEvidence)
  };
}

function projectTextItems(values) {
  if (!Array.isArray(values)) {
    return {
      state: 'missing',
      count: valueState(undefined),
      text: MISSING_TEXT,
      value: null,
      items: []
    };
  }

  const summary = arrayTextState(values);

  return {
    state: values.length === 0 ? 'empty' : 'available',
    count: valueState(values.length),
    text: summary.text,
    value: summary.value,
    items: values.map((value) => valueState(value))
  };
}

function expectedEvidenceState(value) {
  return Array.isArray(value) ? arrayTextState(value) : valueState(value);
}

function projectGoalProgress({ result, ledger }) {
  if (result?.ok !== true) {
    return {
      state: 'unavailable',
      contractName: valueState(GOAL_PROGRESS_LEDGER_CONTRACT_NAME),
      contractVersion: valueState(undefined),
      goalId: valueState(undefined),
      goalTitle: valueState(undefined),
      baselineTag: valueState(undefined),
      releaseReady: valueState(undefined),
      summary: projectGoalProgressSummary(undefined),
      tasks: {
        state: 'missing',
        count: valueState(undefined),
        items: []
      },
      releaseGates: [],
      blockers: [],
      nextActions: [],
      safety: projectGoalProgressSafety(undefined),
      errorEnvelope: projectErrorEnvelope(result?.errorEnvelope),
      note: 'Goal Progress panel 只展示后端 goal-progress-ledger.v1 字段；不可用时只显示 error-envelope.v1 的安全摘要。'
    };
  }

  const tasks = Array.isArray(ledger?.tasks) ? ledger.tasks : null;

  return {
    state: ledger === null || ledger === undefined ? 'missing' : 'available',
    contractName: valueState(ledger?.contractName),
    contractVersion: valueState(ledger?.contractVersion),
    goalId: valueState(ledger?.goalId),
    goalTitle: valueState(ledger?.goalTitle),
    baselineTag: valueState(ledger?.baseline?.tag),
    baselineCommit: valueState(ledger?.baseline?.commit),
    baselineEvidenceRef: valueState(ledger?.baseline?.evidenceRef),
    releaseReady: valueState(ledger?.summary?.releaseReady),
    summary: projectGoalProgressSummary(ledger?.summary),
    tasks: {
      state: tasks === null ? 'missing' : tasks.length === 0 ? 'empty' : 'available',
      count: valueState(tasks === null ? undefined : tasks.length),
      items: tasks === null ? [] : tasks.map((task) => ({
        taskId: valueState(task?.taskId),
        title: valueState(task?.title),
        status: valueState(task?.status),
        statusSource: valueState(task?.statusSource),
        branch: valueState(task?.branch),
        commit: valueState(task?.commit),
        workerEvidenceRef: valueState(task?.workerEvidenceRef),
        reviewEvidenceRef: valueState(task?.reviewEvidenceRef),
        reviewVerdict: valueState(task?.reviewVerdict),
        mainVerificationRef: valueState(task?.mainVerificationRef),
        blockers: projectBlockers(task?.blockers),
        nextCopyOnlyCommand: valueState(task?.nextCopyOnlyCommand)
      }))
    },
    releaseGates: Object.entries(ledger?.releaseGates ?? {}).map(([gate, status]) => ({
      gate: valueState(gate),
      status: valueState(status)
    })),
    blockers: projectBlockers(ledger?.blockers),
    nextActions: projectNextActions(ledger?.nextActions),
    safety: projectGoalProgressSafety(ledger?.safety),
    errorEnvelope: projectErrorEnvelope(null),
    note: 'Goal Progress panel 不根据 task id、branch、command 或文件名判断完成度；只展示后端 ledger status/statusSource/evidence refs。'
  };
}

function projectGoalProgressSummary(summary) {
  return {
    totalTasks: valueState(summary?.totalTasks),
    completedTasks: valueState(summary?.completedTasks),
    blockedTasks: valueState(summary?.blockedTasks),
    needsReviewTasks: valueState(summary?.needsReviewTasks),
    needsRevisionTasks: valueState(summary?.needsRevisionTasks),
    releaseReady: valueState(summary?.releaseReady),
    releaseReadySource: valueState(summary?.releaseReadySource)
  };
}

function projectGoalProgressSafety(safety) {
  return {
    readOnly: valueState(safety?.readOnly),
    copyOnly: valueState(safety?.copyOnly),
    browserExecutionAvailable: valueState(safety?.browserExecutionAvailable),
    modelInvocationAvailable: valueState(safety?.modelInvocationAvailable)
  };
}

function projectGoalEvents({ result, eventLog, ledger }) {
  if (result?.ok !== true) {
    return {
      state: 'unavailable',
      contractName: valueState(GOAL_EVENT_LOG_CONTRACT_NAME),
      contractVersion: valueState(undefined),
      goalId: valueState(undefined),
      goalTitle: valueState(undefined),
      baselineTag: valueState(undefined),
      baselineCommit: valueState(undefined),
      baselineEvidenceRef: valueState(undefined),
      log: projectGoalEventLogSummary(undefined),
      timeline: projectGoalEventTimeline(undefined),
      evidenceMatrix: projectGoalEvidenceMatrix({
        events: [],
        ledger
      }),
      errorEnvelope: projectErrorEnvelope(result?.errorEnvelope),
      note: 'Goal Events panels 只展示后端 goal-event-log.v1 与 goal-progress-ledger.v1 字段；不可用时不从 ledger 推断 event-backed 状态。'
    };
  }

  const events = Array.isArray(eventLog?.events) ? eventLog.events : null;

  return {
    state: eventLog === null || eventLog === undefined ? 'missing' : 'available',
    contractName: valueState(eventLog?.contractName),
    contractVersion: valueState(eventLog?.contractVersion),
    goalId: valueState(eventLog?.goalId),
    goalTitle: valueState(eventLog?.goalTitle),
    baselineTag: valueState(eventLog?.baseline?.tag),
    baselineCommit: valueState(eventLog?.baseline?.commit),
    baselineEvidenceRef: valueState(eventLog?.baseline?.evidenceRef),
    log: projectGoalEventLogSummary(eventLog?.log),
    timeline: projectGoalEventTimeline(events),
    evidenceMatrix: projectGoalEvidenceMatrix({
      events: events ?? [],
      ledger
    }),
    errorEnvelope: projectErrorEnvelope(null),
    note: 'Goal Events Timeline 与 Evidence Matrix 只展示 events API 和 ledger API 已暴露字段；evidence refs 不会触发正文读取、下载或本地打开。'
  };
}

function projectGoalEventLogSummary(log) {
  return {
    appendOnly: valueState(log?.appendOnly),
    storage: valueState(log?.storage),
    eventCount: valueState(log?.eventCount),
    firstSequence: valueState(log?.firstSequence),
    lastSequence: valueState(log?.lastSequence),
    lastEventId: valueState(log?.lastEventId),
    lastEventHash: valueState(log?.lastEventHash)
  };
}

function projectGoalEventTimeline(events) {
  if (!Array.isArray(events)) {
    return {
      state: 'missing',
      count: valueState(undefined),
      items: []
    };
  }

  return {
    state: events.length === 0 ? 'empty' : 'available',
    count: valueState(events.length),
    items: events.map((event, index) => projectGoalEventTimelineItem({
      event,
      previousEvent: index > 0 ? events[index - 1] : null
    }))
  };
}

function projectGoalEventTimelineItem({ event, previousEvent }) {
  return {
    sequence: valueState(event?.sequence),
    eventId: valueState(event?.eventId),
    eventType: valueState(event?.eventType),
    phase: valueState(event?.phase),
    taskId: valueState(event?.taskId),
    actor: valueState(goalEventActorText(event?.actor)),
    actorRole: valueState(event?.actor?.role),
    actorId: valueState(event?.actor?.id),
    recordedAt: valueState(event?.recordedAt),
    reviewVerdict: explicitReviewVerdictState(event),
    gateStatus: explicitGateStatusState(event),
    evidenceRefs: projectGoalEvidenceRefs(event?.evidenceRefs),
    previousEventHash: valueState(event?.previousEventHash),
    eventHash: valueState(event?.eventHash),
    hashChainStatus: matrixValueState(goalEventHashChainStatus({ event, previousEvent }))
  };
}

function projectGoalEvidenceMatrix({ events, ledger }) {
  const taskIds = goalEventMatrixTaskIds({ events, ledger });
  const releaseGateItems = projectGoalReleaseGateMatrix(events);
  const releaseReady = projectReleaseReadyState(events);

  return {
    state: taskIds.length === 0 && releaseGateItems.length === 0 && releaseReady.status.value === MATRIX_UNKNOWN_TEXT
      ? 'empty'
      : 'available',
    tasks: {
      state: taskIds.length === 0 ? 'empty' : 'available',
      count: valueState(taskIds.length),
      items: taskIds.map((taskId) => projectGoalEvidenceMatrixTask({
        taskId,
        events,
        ledgerTask: findLedgerTask(ledger, taskId),
        releaseGateCount: releaseGateItems.length
      }))
    },
    releaseGates: {
      state: releaseGateItems.length === 0 ? 'empty' : 'available',
      count: valueState(releaseGateItems.length),
      items: releaseGateItems
    },
    releaseReady
  };
}

function goalEventMatrixTaskIds({ events, ledger }) {
  const ids = [];

  if (Array.isArray(ledger?.tasks)) {
    for (const task of ledger.tasks) {
      if (isMatrixTaskId(task?.taskId) && !ids.includes(task.taskId)) {
        ids.push(task.taskId);
      }
    }
  }

  for (const event of events) {
    if (isMatrixTaskId(event?.taskId) && !ids.includes(event.taskId)) {
      ids.push(event.taskId);
    }
  }

  return ids;
}

function projectGoalEvidenceMatrixTask({
  taskId,
  events,
  ledgerTask,
  releaseGateCount
}) {
  const taskEvents = events.filter((event) => event?.taskId === taskId);
  const workerEvent = latestEventOfTypes(taskEvents, [
    'worker.evidence-recorded',
    'worker.self-check-passed',
    'worker.self-check-failed'
  ]);
  const reviewEvent = latestEventOfTypes(taskEvents, [
    'reviewer.approved',
    'reviewer.needs-revision'
  ]);
  const mainVerificationEvent = latestEventOfTypes(taskEvents, [
    'main.verification-passed',
    'main.verification-failed'
  ]);
  const blocker = latestOpenBlocker(taskEvents);

  return {
    taskId: valueState(taskId),
    title: valueState(ledgerTask?.title ?? taskId),
    ledgerStatus: valueState(ledgerTask?.status),
    workerEvidence: firstEvidenceRefDisplayState(workerEvent),
    reviewVerdict: reviewEvent === null ? matrixUnknownState() : explicitReviewVerdictState(reviewEvent),
    reviewEvidence: firstEvidenceRefDisplayState(reviewEvent),
    mainVerification: mainVerificationEvent === null
      ? matrixUnknownState()
      : mainVerificationDisplayState(mainVerificationEvent),
    blocker: blocker === null ? matrixMissingState() : matrixValueState(blocker),
    releaseGateCoverage: releaseGateCount > 0
      ? matrixValueState(`${releaseGateCount} explicit gate event${releaseGateCount === 1 ? '' : 's'}`)
      : matrixUnknownState()
  };
}

function projectGoalReleaseGateMatrix(events) {
  return events
    .filter((event) => event?.eventType === 'release.gate-passed' || event?.eventType === 'release.gate-failed')
    .map((event) => ({
      gate: valueState(goalGateId(event)),
      status: explicitGateStatusState(event),
      eventType: valueState(event?.eventType),
      evidenceRefs: projectGoalEvidenceRefs(event?.evidenceRefs)
    }));
}

function projectReleaseReadyState(events) {
  const readyEvent = latestEventOfTypes(events, ['release.ready-declared']);

  if (readyEvent === null) {
    return {
      status: matrixUnknownState(),
      eventId: matrixMissingState(),
      evidenceRefs: projectGoalEvidenceRefs(undefined)
    };
  }

  return {
    status: explicitGateStatusState(readyEvent),
    eventId: valueState(readyEvent?.eventId),
    evidenceRefs: projectGoalEvidenceRefs(readyEvent?.evidenceRefs)
  };
}

function projectGoalEvidenceRefs(evidenceRefs) {
  if (!Array.isArray(evidenceRefs)) {
    return {
      state: 'missing',
      count: valueState(undefined),
      items: []
    };
  }

  return {
    state: evidenceRefs.length === 0 ? 'empty' : 'available',
    count: valueState(evidenceRefs.length),
    items: evidenceRefs.map((ref) => ({
      kind: valueState(ref?.kind),
      ref: valueState(ref?.ref),
      label: valueState(ref?.label)
    }))
  };
}

function firstEvidenceRefDisplayState(event) {
  if (event === null || event === undefined) {
    return matrixMissingState();
  }

  const ref = firstGoalEvidenceRef(event);

  return ref === null ? matrixMissingState() : valueState(ref);
}

function mainVerificationDisplayState(event) {
  const ref = firstGoalEvidenceRef(event);

  if (ref !== null) {
    return valueState(ref);
  }

  if (event?.eventType === 'main.verification-passed') {
    return matrixValueState('passed');
  }

  if (event?.eventType === 'main.verification-failed') {
    return matrixValueState('failed');
  }

  return matrixUnknownState();
}

function explicitReviewVerdictState(event) {
  if (event?.review?.verdict === 'APPROVED' || event?.review?.verdict === 'NEEDS_REVISION') {
    return valueState(event.review.verdict);
  }

  if (event?.eventType === 'reviewer.approved') {
    return matrixValueState('APPROVED');
  }

  if (event?.eventType === 'reviewer.needs-revision') {
    return matrixValueState('NEEDS_REVISION');
  }

  return matrixUnknownState();
}

function explicitGateStatusState(event) {
  if (event?.gate?.status === 'passed' || event?.gate?.status === 'failed' || event?.gate?.status === 'declared') {
    return valueState(event.gate.status);
  }

  if (event?.eventType === 'main.verification-passed') {
    return matrixValueState('passed');
  }

  if (event?.eventType === 'main.verification-failed') {
    return matrixValueState('failed');
  }

  if (event?.eventType === 'release.gate-passed') {
    return matrixValueState('passed');
  }

  if (event?.eventType === 'release.gate-failed') {
    return matrixValueState('failed');
  }

  if (event?.eventType === 'release.ready-declared') {
    return matrixValueState('declared');
  }

  return matrixUnknownState();
}

function latestOpenBlocker(events) {
  const openBlockers = new Map();

  for (const event of events) {
    if (event?.eventType !== 'blocker.opened' && event?.eventType !== 'reviewer.blocked' && event?.eventType !== 'blocker.resolved') {
      continue;
    }

    const id = goalBlockerId(event);

    if (event.eventType === 'blocker.resolved') {
      openBlockers.delete(id);
      continue;
    }

    openBlockers.set(id, goalBlockerText(event));
  }

  return [...openBlockers.values()].at(-1) ?? null;
}

function goalBlockerId(event) {
  return isNonEmptyString(event?.blocker?.id) ? event.blocker.id : event?.eventId ?? 'unknown-blocker';
}

function goalBlockerText(event) {
  if (isNonEmptyString(event?.blocker?.reason)) {
    return event.blocker.reason;
  }

  if (isNonEmptyString(event?.statement)) {
    return event.statement;
  }

  return MATRIX_UNKNOWN_TEXT;
}

function latestEventOfTypes(events, eventTypes) {
  if (!Array.isArray(events)) {
    return null;
  }

  for (let index = events.length - 1; index >= 0; index -= 1) {
    if (eventTypes.includes(events[index]?.eventType)) {
      return events[index];
    }
  }

  return null;
}

function goalEventIsAfter(left, right) {
  if (left === null || left === undefined) {
    return false;
  }

  if (right === null || right === undefined) {
    return true;
  }

  if (Number.isFinite(left.sequence) && Number.isFinite(right.sequence)) {
    return left.sequence > right.sequence;
  }

  const leftTime = Date.parse(left.recordedAt ?? left.occurredAt ?? '');
  const rightTime = Date.parse(right.recordedAt ?? right.occurredAt ?? '');

  if (Number.isFinite(leftTime) && Number.isFinite(rightTime)) {
    return leftTime > rightTime;
  }

  return false;
}

function findLedgerTask(ledger, taskId) {
  if (!Array.isArray(ledger?.tasks)) {
    return null;
  }

  return ledger.tasks.find((task) => task?.taskId === taskId) ?? null;
}

function firstGoalEvidenceRef(event) {
  if (!Array.isArray(event?.evidenceRefs)) {
    return null;
  }

  const evidenceRef = event.evidenceRefs.find((entry) => isNonEmptyString(entry?.ref));

  return evidenceRef?.ref ?? null;
}

function goalEventActorText(actor) {
  if (!isNonEmptyString(actor?.role) && !isNonEmptyString(actor?.id)) {
    return null;
  }

  return `${actor?.role ?? MATRIX_UNKNOWN_TEXT}:${actor?.id ?? MATRIX_UNKNOWN_TEXT}`;
}

function goalGateId(event) {
  return event?.gate?.id ?? event?.gate?.name ?? MATRIX_UNKNOWN_TEXT;
}

function goalEventHashChainStatus({ event, previousEvent }) {
  if (!isNonEmptyString(event?.eventHash)) {
    return MATRIX_UNKNOWN_TEXT;
  }

  if (previousEvent === null) {
    return event?.previousEventHash === null ? 'genesis' : MATRIX_UNKNOWN_TEXT;
  }

  return event?.previousEventHash === previousEvent?.eventHash ? 'linked' : MATRIX_UNKNOWN_TEXT;
}

function isMatrixTaskId(value) {
  return isNonEmptyString(value) && value !== 'release';
}

function isGoalEventStatusSource(value) {
  return typeof value === 'string' && value.startsWith(`${GOAL_EVENT_LOG_CONTRACT_NAME}:`);
}

function matrixMissingState() {
  return {
    state: 'missing',
    text: MATRIX_MISSING_TEXT,
    value: MATRIX_MISSING_TEXT
  };
}

function matrixUnknownState() {
  return {
    state: 'unknown',
    text: MATRIX_UNKNOWN_TEXT,
    value: MATRIX_UNKNOWN_TEXT
  };
}

function matrixValueState(value) {
  if (value === undefined || value === null || value === '') {
    return matrixMissingState();
  }

  return {
    state: 'available',
    text: String(value),
    value
  };
}

function projectCapabilities(capabilities) {
  return {
    state: capabilities === null || capabilities === undefined ? 'missing' : 'available',
    contractName: valueState(capabilities?.contractName),
    contractVersion: valueState(capabilities?.contractVersion),
    readOnly: valueState(capabilities?.readOnly),
    displayOnly: valueState(capabilities?.displayOnly),
    copyOnly: valueState(capabilities?.copyOnly),
    mutationAvailable: valueState(capabilities?.mutationAvailable),
    browserExecutionAvailable: valueState(capabilities?.browserExecutionAvailable),
    modelInvocationAvailable: valueState(capabilities?.modelInvocationAvailable),
    artifactDownloadAvailable: valueState(capabilities?.artifactDownloadAvailable),
    safePreview: {
      available: valueState(capabilities?.safePreview?.available),
      inlineModes: arrayTextState(capabilities?.safePreview?.inlineModes),
      rawHtmlInlineAvailable: valueState(capabilities?.safePreview?.rawHtmlInlineAvailable),
      svgInlineAvailable: valueState(capabilities?.safePreview?.svgInlineAvailable),
      javascriptInlineAvailable: valueState(capabilities?.safePreview?.javascriptInlineAvailable),
      binaryInlineAvailable: valueState(capabilities?.safePreview?.binaryInlineAvailable)
    },
    routes: Object.entries(capabilities?.routes ?? {}).map(([route, available]) => ({
      route: valueState(route),
      available: valueState(available)
    })),
    note: 'Capabilities panel 只展示后端 capabilities.v1，不把 capability 字段转换成写入、执行或下载入口。'
  };
}

function projectProviderLanePreview({ result, preview }) {
  const lanes = Array.isArray(preview?.lanePreviews) ? preview.lanePreviews : [];
  const matrix = Array.isArray(preview?.assignmentMatrix) ? preview.assignmentMatrix : [];
  const boundaries = preview?.boundaries ?? {};

  return {
    state: preview === null || preview === undefined ? 'missing' : 'available',
    contractName: valueState(preview?.contractName),
    contractVersion: valueState(preview?.contractVersion),
    goalId: valueState(preview?.context?.goalId),
    taskId: valueState(preview?.context?.taskId),
    routeState: valueState(routeStateFromResult(result)),
    route: valueState(result?.route),
    sourcePolicy: valueState(preview?.context?.assignmentSource),
    activeProviderIds: arrayTextState(preview?.activeProviderIds),
    laneCount: valueState(preview?.summary?.laneCount),
    independentReviewRequired: valueState(preview?.summary?.independentReviewRequired),
    mainVerifierLaneOperatorControlled: valueState(preview?.summary?.mainVerifierLaneOperatorControlled),
    autoAssignmentAvailable: valueState(preview?.summary?.autoAssignmentAvailable),
    autoApprovalAvailable: valueState(preview?.summary?.autoApprovalAvailable),
    lanes: {
      state: lanes.length === 0 ? 'missing' : 'available',
      items: lanes.map((lane) => ({
        role: valueState(lane?.role),
        laneId: valueState(lane?.laneId),
        phase: valueState(lane?.phase),
        laneKind: valueState(lane?.laneKind),
        assignmentState: valueState(lane?.assignmentState),
        requiresDistinctActorFrom: arrayTextState(lane?.requiresDistinctActorFrom),
        eventTypes: arrayTextState(lane?.eventTypes),
        confirmationContract: valueState(lane?.confirmationContract),
        previewOnly: valueState(lane?.previewOnly),
        executionEnabled: valueState(lane?.executionEnabled),
        autoAssignAvailable: valueState(lane?.autoAssignAvailable),
        autoApprovalAvailable: valueState(lane?.autoApprovalAvailable),
        candidateProviders: {
          state: Array.isArray(lane?.candidateProviders) && lane.candidateProviders.length > 0 ? 'available' : 'empty',
          items: (Array.isArray(lane?.candidateProviders) ? lane.candidateProviders : []).map((provider) => ({
            providerId: valueState(provider?.providerId),
            displayName: valueState(provider?.displayName),
            healthState: valueState(provider?.healthState),
            assignableInV38: valueState(provider?.assignableInV38),
            unavailableReason: valueState(provider?.unavailableReason),
            selectionSource: valueState(provider?.selectionSource)
          }))
        },
        operatorLane: objectState(lane?.operatorLane),
        copyOnlyVerificationCommands: arrayTextState(lane?.copyOnlyVerificationCommands)
      }))
    },
    assignmentMatrix: {
      state: matrix.length === 0 ? 'missing' : 'available',
      items: matrix.map((row) => ({
        matrixId: valueState(row?.matrixId),
        state: valueState(row?.state),
        workerProviderId: valueState(row?.worker?.providerId),
        reviewerProviderId: valueState(row?.reviewer?.providerId),
        reviewerMustBeDifferentActorFrom: valueState(row?.reviewer?.mustBeDifferentActorFrom),
        mainVerifierLaneId: valueState(row?.mainVerifier?.laneId),
        mainVerifierOperatorControlled: valueState(row?.mainVerifier?.operatorControlled),
        blockers: arrayTextState(row?.blockers),
        previewOnly: valueState(row?.previewOnly),
        autoApprovalAvailable: valueState(row?.autoApprovalAvailable)
      }))
    },
    boundaries: Object.entries(boundaries).map(([boundary, available]) => ({
      boundary: valueState(boundary),
      available: valueState(available)
    })),
    note: 'Provider Lane Preview renders agent-cli-lane-assignment-preview.v1 only. It separates worker, reviewer, and main-verifier lanes without assigning agents, executing provider CLIs, registering review, or passing main verification.'
  };
}

function projectProviderHubPanel({
  healthResult,
  health,
  capabilityResult,
  capability,
  laneResult,
  lanePreview,
  activeGoal
}) {
  const providers = Array.isArray(health?.providers) ? health.providers : [];
  const providerGates = new Map(
    (Array.isArray(capability?.providerGates) ? capability.providerGates : [])
      .map((providerGate) => [providerGate?.providerId, providerGate])
  );
  const lanePreviews = Array.isArray(lanePreview?.lanePreviews) ? lanePreview.lanePreviews : [];
  const boundaries = projectProviderHubBoundaries({ health, capability, lanePreview });
  const evidenceAnchors = projectProviderHubEvidenceAnchors(activeGoal);
  const activeProviderIds = health?.boundaries?.activeProviderIds ?? lanePreview?.activeProviderIds ?? [];

  return {
    state: health === null && capability === null && lanePreview === null ? 'missing' : 'available',
    modelName: valueState(PROVIDER_HUB_PANEL_MODEL_NAME),
    sourcePolicy: valueState('agent-cli-provider-health.v1 + agent-cli-capability-profile.v1 + agent-cli-lane-assignment-preview.v1 + goal-progress-ledger.v1 + goal-event-log.v1'),
    goalId: valueState(firstNonEmptyString(
      health?.context?.goalId,
      capability?.context?.goalId,
      lanePreview?.context?.goalId,
      firstValue(activeGoal?.taskQueue?.goalId)
    )),
    routeStates: {
      health: valueState(routeStateFromResult(healthResult)),
      capabilities: valueState(routeStateFromResult(capabilityResult)),
      lanePreview: valueState(routeStateFromResult(laneResult))
    },
    contracts: {
      health: valueState(health?.contractName),
      capabilities: valueState(capability?.contractName),
      lanePreview: valueState(lanePreview?.contractName)
    },
    summary: {
      activeProviderIds: arrayTextState(activeProviderIds),
      activeProviderCount: valueState(health?.summary?.activeProviderCount ?? capability?.summary?.activeProviderCount ?? lanePreview?.summary?.activeProviderCount),
      configuredProviderCount: valueState(health?.summary?.configuredProviderCount),
      missingProviderCount: valueState(health?.summary?.missingProviderCount),
      healthState: valueState(health?.summary?.state),
      mappedRequirementCount: valueState(capability?.summary?.mappedRequirementCount),
      mappedActionCount: valueState(capability?.summary?.mappedActionCount),
      requiredRequirementIds: arrayTextState(capability?.summary?.requiredRequirementIds),
      testRunMode: valueState(capability?.summary?.testRunMode),
      laneCount: valueState(lanePreview?.summary?.laneCount),
      independentReviewRequired: valueState(lanePreview?.summary?.independentReviewRequired),
      mainVerifierLaneOperatorControlled: valueState(lanePreview?.summary?.mainVerifierLaneOperatorControlled)
    },
    providers: {
      state: providers.length === 0 ? 'missing' : 'available',
      count: valueState(providers.length),
      items: providers.map((provider) => projectProviderHubProvider({
        provider,
        gateProfile: providerGates.get(provider?.providerId),
        lanePreviews
      }))
    },
    requirementGates: {
      state: Array.isArray(capability?.requirements) && capability.requirements.length > 0 ? 'available' : 'missing',
      items: (Array.isArray(capability?.requirements) ? capability.requirements : []).map((requirement) => ({
        requirementId: valueState(requirement?.requirementId),
        state: valueState(requirement?.state),
        providerGateIds: arrayTextState(requirement?.providerGateIds),
        toolGateIds: arrayTextState(requirement?.toolGateIds),
        reason: valueState(requirement?.reason)
      }))
    },
    actionMappings: {
      state: Array.isArray(capability?.actionMappings) && capability.actionMappings.length > 0 ? 'available' : 'missing',
      count: valueState(Array.isArray(capability?.actionMappings) ? capability.actionMappings.length : undefined),
      items: (Array.isArray(capability?.actionMappings) ? capability.actionMappings : []).map((mapping) => ({
        actionId: valueState(mapping?.actionId ?? mapping?.action_id),
        requirementIds: arrayTextState(mapping?.requirementIds),
        confirmationContract: valueState(mapping?.confirmationContract),
        executionAvailable: valueState(mapping?.executionAvailable ?? mapping?.executionEnabled)
      }))
    },
    evidenceAnchors,
    boundaries,
    note: 'Provider Hub displays provider availability, blockers, capability gates, lane separation, and explicit evidence refs from backend contracts only. It does not expose secret values, execute provider CLIs, dispatch prompts, invoke models, assign agents, approve review, pass main verification, or declare release readiness.'
  };
}

function projectProviderHubProvider({ provider, gateProfile, lanePreviews }) {
  const requiredEnv = Array.isArray(provider?.backendProfile?.requiredEnv)
    ? provider.backendProfile.requiredEnv
    : [];
  const lanes = Array.isArray(provider?.lanes) ? provider.lanes : [];
  const gates = Array.isArray(gateProfile?.gates) ? gateProfile.gates : [];
  const laneCandidates = lanePreviews.flatMap((lane) => (
    Array.isArray(lane?.candidateProviders)
      ? lane.candidateProviders
          .filter((candidate) => candidate?.providerId === provider?.providerId)
          .map((candidate) => `${lane.role}: ${candidate.assignableInV38 === true ? 'assignable' : candidate.unavailableReason ?? 'blocked'}`)
      : []
  ));
  const blockedReasons = uniqueNonEmptyStrings([
    provider?.health?.blocker,
    ...lanes.map((lane) => lane?.unavailableReason),
    ...gates.filter((gate) => gate?.state === 'missing').map((gate) => gate?.gateId)
  ]);

  return {
    providerId: valueState(provider?.providerId),
    displayName: valueState(provider?.displayName),
    providerKind: valueState(provider?.providerKind),
    adapterId: valueState(provider?.adapterId),
    localCommand: valueState(provider?.localCommand?.command),
    healthState: valueState(provider?.health?.state),
    healthBlocker: valueState(provider?.health?.blocker),
    checkSource: valueState(provider?.health?.checkSource),
    backendProfileRef: valueState(provider?.backendProfile?.profileRef),
    backendProfileStatus: valueState(provider?.backendProfile?.status),
    backendProfileSanitized: valueState(provider?.backendProfile?.sanitized),
    requiredEnvPresence: {
      state: requiredEnv.length === 0 ? 'missing' : 'available',
      items: requiredEnv.map((entry) => ({
        name: valueState(entry?.name),
        present: valueState(entry?.present),
        valueAvailable: valueState(entry?.valueAvailable)
      }))
    },
    lanes: {
      state: lanes.length === 0 ? 'missing' : 'available',
      items: lanes.map((lane) => ({
        laneId: valueState(lane?.laneId),
        assignableInV38: valueState(lane?.assignableInV38),
        unavailableReason: valueState(lane?.unavailableReason)
      }))
    },
    capabilityGates: {
      state: gates.length === 0 ? 'missing' : 'available',
      disabledCount: valueState(gates.filter((gate) => gate?.state === 'disabled').length),
      missingCount: valueState(gates.filter((gate) => gate?.state === 'missing').length),
      items: gates.map((gate) => ({
        gateId: valueState(gate?.gateId),
        state: valueState(gate?.state),
        requirementIds: arrayTextState(gate?.requirementIds),
        sourceContract: valueState(gate?.sourceContract)
      }))
    },
    lanePreviewCandidates: arrayTextState(laneCandidates),
    blockedReasons: projectTextItems(blockedReasons),
    boundaries: Object.entries(gateProfile?.boundaries ?? {}).map(([boundary, available]) => ({
      boundary: valueState(boundary),
      available: valueState(available)
    }))
  };
}

function projectProviderHubBoundaries({ health, capability, lanePreview }) {
  const boundaryKeys = [
    'providerCliExecutionAvailable',
    'rendererProviderInvocationAvailable',
    'promptDispatchAvailable',
    'modelInvocationAvailable',
    'genericShellRunnerAvailable',
    'arbitraryCommandExecutionAvailable',
    'commandProbeAvailable',
    'capabilityProbeAvailable',
    'envValueExposureAvailable',
    'credentialMaterialAvailable',
    'rawProviderConfigAvailable',
    'automaticInstallAvailable',
    'automaticOauthAvailable',
    'actionExecutionAvailable',
    'repoWriteAvailable',
    'workspaceWritesAvailable',
    'gitWriteAvailable',
    'mergeAvailable',
    'pushAvailable',
    'tagAvailable',
    'publishAvailable',
    'selfApprovalAvailable',
    'reviewerApprovalInferenceAvailable',
    'mainVerificationInferenceAvailable'
  ];
  const sources = [health?.boundaries, capability?.boundaries, lanePreview?.boundaries]
    .filter((source) => source !== null && source !== undefined);

  return boundaryKeys.map((boundary) => {
    const source = sources.find((candidate) => Object.prototype.hasOwnProperty.call(candidate, boundary));

    return {
      boundary: valueState(boundary),
      available: valueState(source?.[boundary])
    };
  });
}

function projectProviderHubEvidenceAnchors(activeGoal) {
  const tasks = activeGoal?.taskQueue?.items ?? [];
  const items = tasks.map((task) => {
    const refs = [
      firstValue(task?.workerEvidenceRef),
      firstValue(task?.reviewEvidenceRef),
      firstValue(task?.mainVerificationRef)
    ].filter((ref) => isNonEmptyString(ref));

    return {
      taskId: task?.taskId ?? valueState(undefined),
      title: task?.title ?? valueState(undefined),
      status: task?.status ?? valueState(undefined),
      workerEvidenceRef: task?.workerEvidenceRef ?? valueState(undefined),
      reviewEvidenceRef: task?.reviewEvidenceRef ?? valueState(undefined),
      mainVerificationRef: task?.mainVerificationRef ?? valueState(undefined),
      evidenceRefCount: valueState(refs.length)
    };
  });
  const totalRefs = items.reduce((count, item) => count + (item.evidenceRefCount.value ?? 0), 0);

  return {
    state: items.length === 0 ? 'missing' : 'available',
    count: valueState(totalRefs),
    items,
    sourcePolicy: valueState('goal-progress-ledger.v1 task evidence refs; evidence bodies are not read by Workbench')
  };
}

function projectAppSchemaMigration({ result, migration }) {
  const boundaries = Object.entries(migration?.boundaries ?? {}).map(([boundary, available]) => ({
    boundary: valueState(boundary),
    available: valueState(available)
  }));
  const affectedAreas = Array.isArray(migration?.dryRun?.affectedAreas)
    ? migration.dryRun.affectedAreas.map((area) => ({
      area: valueState(area?.area),
      currentVersion: valueState(area?.currentVersion),
      targetVersion: valueState(area?.targetVersion),
      writeRequiredOnConfirm: valueState(area?.writeRequiredOnConfirm)
    }))
    : [];
  const steps = Array.isArray(migration?.dryRun?.steps)
    ? migration.dryRun.steps.map((step) => ({
      stepId: valueState(step?.stepId),
      status: valueState(step?.status),
      writesOnConfirm: valueState(step?.writesOnConfirm),
      description: valueState(step?.description)
    }))
    : [];

  return {
    state: result?.ok === true ? 'available' : result ? 'failed' : 'missing',
    contractName: valueState(migration?.contractName),
    contractVersion: valueState(migration?.contractVersion),
    generatedAt: valueState(migration?.generatedAt),
    schema: {
      currentVersion: valueState(migration?.schema?.currentVersion),
      targetVersion: valueState(migration?.schema?.targetVersion),
      versionField: valueState(migration?.schema?.versionField),
      migrationRequired: valueState(migration?.schema?.migrationRequired),
      versionSource: valueState(migration?.schema?.versionSource)
    },
    dryRun: {
      defaultMode: valueState(migration?.dryRun?.defaultMode),
      previewOnly: valueState(migration?.dryRun?.previewOnly),
      writesAttempted: valueState(migration?.dryRun?.writesAttempted),
      status: valueState(migration?.dryRun?.status),
      affectedAreas,
      steps
    },
    confirmation: {
      required: valueState(migration?.confirmation?.required),
      actionId: valueState(migration?.confirmation?.actionId),
      confirmationContract: valueState(migration?.confirmation?.confirmationContract),
      requiresPlanHash: valueState(migration?.confirmation?.requiresPlanHash),
      planHash: valueState(migration?.confirmation?.planHash),
      confirmAvailableFromBrowser: valueState(migration?.confirmation?.confirmAvailableFromBrowser)
    },
    boundaries,
    note: 'App schema migration panel shows the dry-run preview and confirm requirements only; the browser route does not execute the migration or write app data.'
  };
}

function projectWorkflowRouterCategories({ result, router, routeContext }) {
  const categories = Array.isArray(router?.categories) ? router.categories : [];
  const examples = Array.isArray(router?.examples) ? router.examples : [];
  const boundaries = Object.entries(router?.boundaries ?? {}).map(([boundary, available]) => ({
    boundary: valueState(boundary),
    available: valueState(available)
  }));

  return {
    state: result?.ok === true ? (categories.length === 0 ? 'empty' : 'available') : result ? 'failed' : 'missing',
    contractName: valueState(router?.contractName),
    contractVersion: valueState(router?.contractVersion),
    generatedAt: valueState(router?.generatedAt),
    readOnly: valueState(router?.readOnly),
    goalId: valueState(router?.context?.goalId),
    taskId: valueState(router?.context?.taskId),
    sourcePolicy: valueState(router?.context?.stateSource),
    scope: valueState(router?.context?.scope),
    routeContext: {
      goalId: valueState(firstValue(routeContext?.goalId)),
      taskId: valueState(firstValue(routeContext?.taskId)),
      activeRole: valueState(firstValue(routeContext?.activeRole)),
      activePhase: valueState(firstValue(routeContext?.activePhase))
    },
    sourceContracts: arrayTextState(router?.context?.sourceContracts),
    categoryCount: valueState(categories.length),
    categories: {
      state: categories.length === 0 ? 'empty' : 'available',
      items: categories.map((category) => ({
        categoryId: valueState(category?.categoryId),
        label: valueState(category?.label),
        routeKind: valueState(category?.routeKind),
        userPath: valueState(category?.userPath),
        requestSignals: arrayTextState(category?.requestSignals),
        nextStep: valueState(category?.nextStep),
        allowedContracts: arrayTextState(category?.allowedContracts),
        boundary: valueState(category?.boundary)
      }))
    },
    decisionPolicy: {
      defaultCategoryId: valueState(router?.decisionPolicy?.defaultCategoryId),
      confidenceSource: valueState(router?.decisionPolicy?.confidenceSource),
      requiresHumanConfirmationForGoalDraft: valueState(router?.decisionPolicy?.requiresHumanConfirmationForGoalDraft),
      writesRouteDecision: valueState(router?.decisionPolicy?.writesRouteDecision),
      modelInvocationRequired: valueState(router?.decisionPolicy?.modelInvocationRequired),
      fallbackCategoryId: valueState(router?.decisionPolicy?.fallbackCategoryId)
    },
    examples: {
      state: examples.length === 0 ? 'empty' : 'available',
      items: examples.map((example) => ({
        exampleId: valueState(example?.exampleId),
        inputKind: valueState(example?.inputKind),
        selectedCategoryId: valueState(example?.selectedCategoryId),
        reason: valueState(example?.reason),
        nextContract: valueState(example?.nextContract),
        writesState: valueState(example?.writesState)
      }))
    },
    boundaries,
    note: 'Workflow Router Categories shows the v40 routing categories and boundary decisions from workflow-router-categories.v1. It does not create goals, create jobs, execute actions, fetch research, invoke models, run shell commands, write git state, or register approval, verification, or release events.'
  };
}

function projectDiagnostics(diagnostics) {
  return {
    state: diagnostics === null || diagnostics === undefined ? 'missing' : 'available',
    contractName: valueState(diagnostics?.contractName),
    contractVersion: valueState(diagnostics?.contractVersion),
    status: valueState(diagnostics?.status),
    checks: projectDiagnosticChecks(diagnostics?.checks),
    boundaries: Object.entries(diagnostics?.boundaries ?? {}).map(([boundary, available]) => ({
      boundary: valueState(boundary),
      available: valueState(available)
    })),
    note: 'Diagnostics panel 只展示 diagnostics.v1 的安全健康字段；浏览器端不会运行 shell、测试、audit、mutation 或模型调用。'
  };
}

function projectDiagnosticsBundle({ result, diagnosticsBundle }) {
  if (diagnosticsBundle === null || diagnosticsBundle === undefined) {
    return {
      state: result?.ok === true ? 'empty' : 'unavailable',
      errorEnvelope: result?.errorEnvelope ?? null,
      contractName: valueState(undefined),
      contractVersion: valueState(undefined),
      generatedAt: valueState(undefined),
      readOnly: valueState(undefined),
      context: {},
      health: {
        status: valueState(undefined),
        runtimeStatus: valueState(undefined),
        runtimeVersion: valueState(undefined),
        kernelVersion: valueState(undefined),
        nodeVersion: valueState(undefined),
        checkStatus: valueState(undefined),
        checkTotal: valueState(0),
        warnings: valueState(0),
        errors: valueState(0)
      },
      gateStatus: {
        state: valueState('missing'),
        goalStatus: valueState('unknown'),
        releaseReady: valueState(false),
        taskCount: valueState(0),
        mainVerifiedCount: valueState(0),
        blockedCount: valueState(0),
        gates: valueState([])
      },
      recentFailureCount: valueState(0),
      recentFailures: valueState([]),
      sanitizedLogRefCount: valueState(0),
      sanitizedLogRefs: valueState([]),
      boundaries: {},
      note: 'Diagnostics bundle 未暴露 / 不可用。'
    };
  }

  const recentFailures = Array.isArray(diagnosticsBundle.recentFailures)
    ? diagnosticsBundle.recentFailures
    : [];
  const logRefs = Array.isArray(diagnosticsBundle.sanitizedLogs?.refs)
    ? diagnosticsBundle.sanitizedLogs.refs
    : [];
  const gates = Array.isArray(diagnosticsBundle.gateStatus?.gates)
    ? diagnosticsBundle.gateStatus.gates
    : [];

  return {
    state: diagnosticsBundle.health?.status ?? 'available',
    errorEnvelope: result?.errorEnvelope ?? null,
    contractName: valueState(diagnosticsBundle.contractName),
    contractVersion: valueState(diagnosticsBundle.contractVersion),
    generatedAt: valueState(diagnosticsBundle.generatedAt),
    readOnly: valueState(diagnosticsBundle.readOnly),
    context: {
      goalId: valueState(diagnosticsBundle.context?.goalId),
      resolvedGoalId: valueState(diagnosticsBundle.context?.resolvedGoalId),
      taskId: valueState(diagnosticsBundle.context?.taskId),
      diagnosticsRole: valueState(diagnosticsBundle.context?.diagnosticsRole),
      stateSource: valueState(diagnosticsBundle.context?.stateSource)
    },
    health: {
      status: valueState(diagnosticsBundle.health?.status),
      runtimeStatus: valueState(diagnosticsBundle.health?.runtime?.status),
      runtimeVersion: valueState(diagnosticsBundle.health?.runtime?.runtimeVersion),
      kernelVersion: valueState(diagnosticsBundle.health?.runtime?.kernelVersion),
      nodeVersion: valueState(diagnosticsBundle.health?.runtime?.nodeVersion),
      checkStatus: valueState(diagnosticsBundle.health?.checks?.status),
      checkTotal: valueState(diagnosticsBundle.health?.checks?.total ?? 0),
      warnings: valueState(diagnosticsBundle.health?.checks?.warnings ?? 0),
      errors: valueState(diagnosticsBundle.health?.checks?.errors ?? 0)
    },
    gateStatus: {
      state: valueState(diagnosticsBundle.gateStatus?.state),
      goalStatus: valueState(diagnosticsBundle.gateStatus?.goalStatus),
      releaseReady: valueState(diagnosticsBundle.gateStatus?.releaseReady),
      taskCount: valueState(diagnosticsBundle.gateStatus?.taskCount ?? 0),
      mainVerifiedCount: valueState(diagnosticsBundle.gateStatus?.mainVerifiedCount ?? 0),
      blockedCount: valueState(diagnosticsBundle.gateStatus?.blockedCount ?? 0),
      gates: valueState(gates)
    },
    recentFailureCount: valueState(recentFailures.length),
    recentFailures: valueState(recentFailures),
    sanitizedLogRefCount: valueState(logRefs.length),
    sanitizedLogRefs: valueState(logRefs),
    boundaries: {
      readOnly: valueState(diagnosticsBundle.boundaries?.readOnly),
      includesSecretValues: valueState(diagnosticsBundle.boundaries?.includesSecretValues),
      includesRawLogBodies: valueState(diagnosticsBundle.boundaries?.includesRawLogBodies),
      arbitraryPathReadAvailable: valueState(diagnosticsBundle.boundaries?.arbitraryPathReadAvailable),
      shellExecutionAvailable: valueState(diagnosticsBundle.boundaries?.shellExecutionAvailable),
      modelInvocationAvailable: valueState(diagnosticsBundle.boundaries?.modelInvocationAvailable),
      releaseDecisionAvailable: valueState(diagnosticsBundle.boundaries?.releaseDecisionAvailable),
      logPolicy: valueState(diagnosticsBundle.boundaries?.logPolicy),
      statusSource: valueState(diagnosticsBundle.boundaries?.statusSource)
    },
    note: 'Diagnostics Bundle 只展示 sanitized health、versions、recent failures、gate status 和 structured log refs。浏览器端不读取 raw logs、不执行 shell、不登记 gate。'
  };
}

function projectJobConsole({
  jobModelResult,
  jobModel,
  jobCreationResult,
  jobCreation,
  jobTimelineResult,
  jobTimeline,
  jobRunControlResult,
  jobRunControl
}) {
  const jobModelOk = jobModelResult?.ok === true;
  const jobCreationOk = jobCreationResult?.ok === true;
  const jobTimelineOk = jobTimelineResult?.ok === true;
  const jobRunControlOk = jobRunControlResult?.ok === true;
  const allOk = jobModelOk && jobCreationOk && jobTimelineOk && jobRunControlOk;
  const anyOk = jobModelOk || jobCreationOk || jobTimelineOk || jobRunControlOk;

  return {
    state: allOk ? 'available' : anyOk ? 'partial' : 'unavailable',
    jobModel: {
      state: jobModelOk ? 'ready' : jobModelResult ? 'failed' : 'missing',
      route: valueState(jobModelResult?.route),
      contractName: valueState(jobModel?.contractName),
      jobId: valueState(jobModel?.job?.job_id),
      goalId: valueState(jobModel?.job?.goal_id),
      taskId: valueState(jobModel?.job?.task_id),
      actionId: valueState(jobModel?.job?.action_id),
      status: valueState(jobModel?.job?.status),
      queueState: valueState(jobModel?.job?.queue_state),
      blocker: jobBlockerState(jobModel?.job?.blocker),
      failure: jobFailureState(jobModel?.job?.failure),
      createdAt: valueState(jobModel?.job?.timestamps?.created_at),
      leasedAt: valueState(jobModel?.job?.timestamps?.leased_at),
      passedAt: valueState(jobModel?.job?.timestamps?.passed_at),
      failedAt: valueState(jobModel?.job?.timestamps?.failed_at),
      cancelledAt: valueState(jobModel?.job?.timestamps?.cancelled_at),
      boundaries: jobBoundariesState(jobModel?.boundaries)
    },
    jobCreation: {
      state: jobCreationOk ? 'ready' : jobCreationResult ? 'failed' : 'missing',
      route: valueState(jobCreationResult?.route),
      contractName: valueState(jobCreation?.contractName),
      plan: {
        dryRun: valueState(jobCreation?.plan?.dryRun),
        requiresConfirmation: valueState(jobCreation?.plan?.requiresConfirmation),
        jobExecutionAvailable: valueState(jobCreation?.plan?.jobExecutionAvailable)
      },
      warnings: jobCreationWarningsState(jobCreation?.warnings),
      blockers: jobCreationBlockersState(jobCreation?.blockers)
    },
    jobTimeline: {
      state: jobTimelineOk ? 'ready' : jobTimelineResult ? 'failed' : 'missing',
      route: valueState(jobTimelineResult?.route),
      contractName: valueState(jobTimeline?.contractName),
      eventCount: valueState(Array.isArray(jobTimeline?.timeline) ? jobTimeline.timeline.length : undefined),
      logRefCount: valueState(Array.isArray(jobTimeline?.logRefs) ? jobTimeline.logRefs.length : undefined)
    },
    jobRunControl: {
      state: jobRunControlOk ? 'ready' : jobRunControlResult ? 'failed' : 'missing',
      route: valueState(jobRunControlResult?.route),
      contractName: valueState(jobRunControl?.contractName),
      currentState: valueState(jobRunControl?.currentState),
      availableTransitions: jobTransitionsState(jobRunControl?.availableTransitions),
      transitionTable: jobTransitionTableState(jobRunControl?.transitions)
    },
    note: 'Job Console panel 只展示 /api/jobs/* 已暴露的只读 contract 字段。不执行 shell、不 invoke 模型、不写入本地文件。不创建、不运行、不暂停、不取消、不恢复 job。状态变化来自显式 backend job 或 goal 事件。'
  };
}

function jobBlockerState(blocker) {
  if (blocker === null || blocker === undefined) {
    return { state: 'empty', reason: valueState(undefined), requires: valueState(undefined) };
  }

  return {
    state: 'blocked',
    reason: valueState(blocker.reason),
    requires: valueState(blocker.requires)
  };
}

function jobFailureState(failure) {
  if (failure === null || failure === undefined) {
    return { state: 'empty', code: valueState(undefined), message: valueState(undefined) };
  }

  return {
    state: 'failed',
    code: valueState(failure.code),
    message: valueState(failure.message)
  };
}

function jobBoundariesState(boundaries) {
  if (boundaries === null || boundaries === undefined || typeof boundaries !== 'object') {
    return { state: 'missing', items: [] };
  }

  const items = Object.entries(boundaries).map(([key, val]) => ({
    key: valueState(key),
    value: valueState(val)
  }));

  return { state: 'available', items };
}

function jobCreationWarningsState(warnings) {
  if (!Array.isArray(warnings)) {
    return { state: 'missing', count: valueState(undefined), items: [] };
  }

  return {
    state: warnings.length === 0 ? 'empty' : 'available',
    count: valueState(warnings.length),
    items: warnings.map((w) => ({
      code: valueState(w.code),
      message: valueState(w.message),
      source: valueState(w.source)
    }))
  };
}

function jobCreationBlockersState(blockers) {
  if (!Array.isArray(blockers)) {
    return { state: 'missing', count: valueState(undefined), items: [] };
  }

  return {
    state: blockers.length === 0 ? 'empty' : 'available',
    count: valueState(blockers.length),
    items: blockers.map((b) => ({
      code: valueState(b.code),
      message: valueState(b.message),
      source: valueState(b.source)
    }))
  };
}

function jobTransitionsState(available) {
  if (!Array.isArray(available)) {
    return { state: 'missing', count: valueState(undefined), items: [] };
  }

  return {
    state: available.length === 0 ? 'empty' : 'available',
    count: valueState(available.length),
    items: available.map((id) => valueState(id))
  };
}

function jobTransitionTableState(transitions) {
  if (!Array.isArray(transitions)) {
    return { state: 'missing', count: valueState(undefined), items: [] };
  }

  return {
    state: transitions.length === 0 ? 'empty' : 'available',
    count: valueState(transitions.length),
    items: transitions.map((t) => ({
      id: valueState(t.id),
      label: valueState(t.label),
      description: valueState(t.description),
      validFrom: valueState(Array.isArray(t.validFrom) ? t.validFrom.join(', ') : undefined),
      to: valueState(t.to),
      reversible: valueState(t.reversible),
      terminal: valueState(t.terminal)
    }))
  };
}

function projectDiagnosticChecks(checks) {
  if (!Array.isArray(checks)) {
    return {
      state: 'missing',
      count: valueState(undefined),
      items: []
    };
  }

  return {
    state: checks.length === 0 ? 'empty' : 'available',
    count: valueState(checks.length),
    items: checks.map((check) => ({
      id: valueState(check?.id),
      label: valueState(check?.label),
      status: valueState(check?.status),
      severity: valueState(check?.severity)
    }))
  };
}

function projectBlockers(blockers) {
  if (!Array.isArray(blockers)) {
    return [];
  }

  return blockers.map((blocker) => ({
    id: valueState(blocker?.id),
    taskId: valueState(blocker?.taskId),
    reason: valueState(blocker?.reason),
    severity: valueState(blocker?.severity)
  }));
}

function projectNextActions(nextActions) {
  if (!Array.isArray(nextActions)) {
    return [];
  }

  return nextActions.map((action) => ({
    kind: valueState(action?.kind),
    label: valueState(action?.label),
    command: valueState(action?.command)
  }));
}

function projectErrorEnvelope(envelope) {
  const error = envelope?.error;

  return {
    state: envelope?.contractName === ERROR_ENVELOPE_CONTRACT_NAME ? 'available' : 'missing',
    contractName: valueState(envelope?.contractName),
    contractVersion: valueState(envelope?.contractVersion),
    code: valueState(error?.code),
    message: valueState(error?.message),
    status: valueState(error?.status),
    route: valueState(error?.route),
    method: valueState(error?.method)
  };
}

function projectSupervisorDashboard({
  result,
  supervisor
}) {
  const route = projectRouteState(
    result?.routeDescriptor ?? READONLY_API_ROUTES.find((candidate) => candidate.id === 'goalSupervisor'),
    result
  );

  if (supervisor?.contractName !== GOAL_SUPERVISOR_APP_READ_MODEL_CONTRACT_NAME) {
    return {
      state: 'unavailable',
      summary: route.error ?? 'goal supervisor read model 未暴露 / 不可用',
      route
    };
  }

  const commandBoundary = projectSupervisorCommandBoundary(supervisor.commandBoundary);
  const sessionSourceInventory = projectSupervisorSessionSourceInventory(supervisor.sessionSourceInventory);
  const contextAdvisory = projectSupervisorContextAdvisory(supervisor.contextAdvisory);
  const threadContinuationDecision = projectSupervisorThreadContinuationDecision(
    supervisor.threadContinuationDecision,
    commandBoundary
  );

  return {
    state: 'available',
    id: 'live-supervisor',
    label: 'Live supervisor',
    summary: 'Live read-only supervisor state from the goal supervisor route.',
    sourceMode: 'live',
    source: route.path,
    route,
    contractName: supervisor.contractName,
    contractVersion: supervisor.contractVersion,
    generatedAt: supervisor.generatedAt,
    readOnly: supervisor.readOnly,
    willMutate: supervisor.willMutate,
    goalSnapshot: projectSupervisorGoalSnapshot(supervisor.goalSnapshot, supervisor.generatedAt),
    recommendedNextAction: projectSupervisorRecommendedNextAction(
      supervisor.recommendedNextAction,
      commandBoundary
    ),
    activeLease: projectSupervisorActiveLease(supervisor.activeLease),
    contextStatus: projectSupervisorContextStatus(supervisor.contextStatus),
    pendingResult: projectSupervisorPendingResult(supervisor.pendingResult),
    currentGate: projectSupervisorCurrentGate(supervisor.currentGate),
    ownership: projectSupervisorOwnership(supervisor.ownership),
    commandBoundary,
    sessionSourceInventory,
    contextAdvisory,
    threadContinuationDecision,
    supervisorEventRegistrationEligibility: supervisor.supervisorEventRegistrationEligibility ?? null,
    goalTimeline: projectSupervisorTimeline(supervisor.goalTimeline)
  };
}

function projectSupervisorGoalSnapshot(goalSnapshot, generatedAt) {
  const snapshot = goalSnapshot ?? {};

  return {
    goalId: snapshot.goalId ?? null,
    title: snapshot.title ?? null,
    activeTask: snapshot.activeTask ?? null,
    activeRole: snapshot.activeRole ?? null,
    completedTasks: snapshot.completedTasks ?? snapshot.completedCount ?? null,
    totalTasks: snapshot.totalTasks ?? snapshot.totalTaskCount ?? null,
    blockerCount: snapshot.blockerCount ?? null,
    releaseReadiness: snapshot.releaseReadiness ?? null,
    sourceContracts: Array.isArray(snapshot.sourceContracts) ? snapshot.sourceContracts : [],
    generatedAt: snapshot.generatedAt ?? generatedAt ?? null
  };
}

function projectSupervisorRecommendedNextAction(recommendedNextAction, commandBoundary) {
  const action = recommendedNextAction ?? {};

  return {
    actionId: action.actionId ?? null,
    label: action.label ?? null,
    reason: action.reason ?? null,
    targetRole: action.targetRole ?? null,
    targetTask: action.targetTask ?? action.taskId ?? null,
    state: action.state ?? action.actionId ?? null,
    checkpointRef: action.checkpointRef ?? null,
    waitPolicy: supervisorWaitPolicyText(action.waitPolicy ?? action.wait),
    staleThreshold: action.staleThreshold ?? supervisorStaleThresholdText(action.waitPolicy ?? action.wait),
    blockedFields: Array.isArray(action.blockedFields) ? action.blockedFields : [],
    requiredConfirmationFields: Array.isArray(action.requiredConfirmationFields)
      ? action.requiredConfirmationFields
      : [],
    mismatchList: Array.isArray(action.mismatchList) ? action.mismatchList : [],
    manualInterventionReason: action.manualInterventionReason ?? null,
    safePreview: action.safePreview ?? action.safeCommandPreview ?? commandBoundary.safePreview ?? null
  };
}

function projectSupervisorActiveLease(activeLease) {
  const lease = activeLease ?? {};

  return {
    leaseId: lease.leaseId ?? null,
    threadId: lease.threadId ?? null,
    taskId: lease.taskId ?? null,
    role: lease.role ?? null,
    phase: lease.phase ?? null,
    status: lease.status ?? null,
    startedAt: lease.startedAt ?? null,
    updatedAt: lease.updatedAt ?? null,
    age: supervisorAgeText(lease.age ?? lease.ageMs),
    duplicateDispatchGuard: supervisorDispatchGuardText(lease.duplicateDispatchGuard)
  };
}

function projectSupervisorContextStatus(contextStatus) {
  const context = contextStatus ?? {};

  return {
    state: supervisorContextState(context),
    providers: supervisorProviderSummaryTexts(
      context.sessionSourceSummaries
        ?? context.providerSummaries
        ?? context.providers
    ),
    transcriptAvailability: context.transcriptAvailability ?? null,
    exchangeCount: context.exchangeCount ?? null,
    latestTurn: supervisorObjectSummaryText(context.latestTurnState ?? context.latestTurn),
    latestToolCall: supervisorObjectSummaryText(context.latestToolCall),
    tokenUsage: supervisorTokenUsageText(context.tokenUsage ?? context.tokenState),
    utilization: supervisorContextUtilizationText(context.contextUtilization ?? context.utilization),
    transcriptState: supervisorTranscriptStateText(context),
    resultBlockEvidence: supervisorResultBlockEvidenceText(context.resultBlockEvidence),
    checkpointRef: context.checkpointRef ?? context.resultBlockEvidence?.checkpointRef ?? null,
    driftMarkers: Array.isArray(context.driftMarkers) && context.driftMarkers.length > 0
      ? context.driftMarkers
      : ['none']
  };
}

function projectSupervisorSessionSourceInventory(sessionSourceInventory) {
  const inventory = sessionSourceInventory ?? {};
  const summary = inventory.summary ?? {};
  const providers = Array.isArray(inventory.providers) ? inventory.providers : [];

  return {
    state: inventory.state ?? summary.state ?? (providers.length === 0 ? 'missing' : 'unknown'),
    contractName: inventory.contractName ?? 'sessionSourceInventory.v1',
    contractVersion: inventory.contractVersion ?? null,
    generatedAt: inventory.generatedAt ?? null,
    readOnly: inventory.readOnly === true,
    willMutate: inventory.willMutate === true ? true : false,
    scanScope: inventory.scanScope ?? 'bounded-provider-session-roots',
    summary: {
      providerCount: summary.providerCount ?? providers.length,
      availableProviderCount: summary.availableProviderCount ?? 0,
      missingProviderCount: summary.missingProviderCount ?? 0,
      degradedProviderCount: summary.degradedProviderCount ?? 0,
      failedProviderCount: summary.failedProviderCount ?? 0,
      state: summary.state ?? inventory.state ?? (providers.length === 0 ? 'missing' : 'unknown')
    },
    providers: providers.map(projectSupervisorInventoryProvider),
    degradedReasons: Array.isArray(inventory.degradedReasons) ? inventory.degradedReasons : []
  };
}

function projectSupervisorInventoryProvider(provider) {
  const sourceSummary = provider?.sourceSummary ?? {};

  return {
    provider: provider?.provider ?? 'unknown',
    state: provider?.state ?? sourceSummary.availability ?? 'unknown',
    availability: sourceSummary.availability ?? provider?.state ?? 'unknown',
    readState: sourceSummary.readState ?? 'unknown',
    candidateFileCount: sourceSummary.candidateFileCount ?? provider?.candidateFileCount ?? 'missing',
    scannedFileCount: sourceSummary.scannedFileCount ?? provider?.scannedFileCount ?? 'missing',
    readableFileCount: sourceSummary.readableFileCount ?? provider?.readableFileCount ?? 'missing',
    unreadableFileCount: sourceSummary.unreadableFileCount ?? provider?.unreadableFileCount ?? 'missing',
    latestModifiedAt: sourceSummary.latestModifiedAt ?? provider?.latestModifiedAt ?? null,
    stale: sourceSummary.stale === true,
    latestSessionRef: sourceSummary.latestSessionRef ?? provider?.latestSessionRef ?? null,
    failureReason: sourceSummary.failureReason ?? provider?.failureReason ?? null,
    degradedReasons: Array.isArray(provider?.degradedReasons) ? provider.degradedReasons : []
  };
}

function projectSupervisorContextAdvisory(contextAdvisory) {
  const advisory = contextAdvisory ?? {};

  return {
    state: supervisorContextAdvisoryState(advisory),
    contractName: advisory.contractName ?? 'contextAdvisory.v1',
    contractVersion: advisory.contractVersion ?? null,
    generatedAt: advisory.generatedAt ?? null,
    readOnly: advisory.readOnly === true,
    willMutate: advisory.willMutate === true ? true : false,
    sessionContextRef: supervisorContractRefText(advisory.sessionContextRef),
    inventoryRef: supervisorContractRefText(advisory.inventoryRef),
    transcriptAvailability: advisory.transcriptAvailability ?? 'missing',
    exchangeCount: advisory.exchangeCount ?? 'missing',
    latestToolCall: supervisorObjectSummaryText(advisory.latestToolCall),
    latestTurnState: supervisorObjectSummaryText(advisory.latestTurnState),
    tokenUsage: supervisorTokenUsageText(advisory.tokenUsage),
    contextUtilization: supervisorContextUtilizationText(advisory.contextUtilization),
    contextBand: advisory.contextBand ?? 'unknown',
    resultBlockEvidence: supervisorResultBlockEvidenceText(advisory.resultBlockEvidence),
    staleTranscriptState: supervisorTranscriptFlagText(advisory.staleTranscriptState, 'stale'),
    missingTranscriptState: supervisorTranscriptFlagText(advisory.missingTranscriptState, 'missing'),
    degradedReasons: Array.isArray(advisory.degradedReasons) ? advisory.degradedReasons : [],
    blockedFields: Array.isArray(advisory.blockedFields) ? advisory.blockedFields : [],
    policyInputs: {
      threadId: advisory.policyInputs?.threadId ?? null,
      transcriptAvailability: advisory.policyInputs?.transcriptAvailability ?? 'missing',
      sessionSourceSummaries: supervisorProviderSummaryTexts(advisory.policyInputs?.sessionSourceSummaries),
      inventorySourceSummaries: supervisorInventoryPolicySourceTexts(advisory.policyInputs?.inventorySourceSummaries)
    }
  };
}

function projectSupervisorThreadContinuationDecision(threadContinuationDecision, fallbackCommandBoundary) {
  const continuation = threadContinuationDecision ?? {};
  const commandBoundary = projectSupervisorDecisionCommandBoundary(
    continuation.commandBoundary,
    fallbackCommandBoundary
  );

  return {
    state: continuation.decision ?? 'unknown',
    contractName: continuation.contractName ?? 'threadContinuationDecision.v1',
    contractVersion: continuation.contractVersion ?? null,
    generatedAt: continuation.generatedAt ?? null,
    readOnly: continuation.readOnly === true,
    willMutate: continuation.willMutate === true ? true : false,
    decision: continuation.decision ?? 'unknown',
    reason: continuation.reason ?? null,
    confidence: continuation.confidence ?? 'unknown',
    targetRole: continuation.targetRole ?? null,
    taskId: continuation.taskId ?? null,
    threadId: continuation.threadId ?? null,
    checkpointRef: continuation.checkpointRef ?? null,
    waitPolicy: supervisorWaitPolicyText(continuation.waitPolicy),
    blockedFields: Array.isArray(continuation.blockedFields) ? continuation.blockedFields : [],
    mismatchList: Array.isArray(continuation.mismatchList) ? continuation.mismatchList : [],
    requiredEvidence: Array.isArray(continuation.requiredEvidence) ? continuation.requiredEvidence : [],
    sourceContracts: supervisorContractRefTexts(continuation.sourceContracts),
    commandBoundary
  };
}

function projectSupervisorDecisionCommandBoundary(commandBoundary, fallbackCommandBoundary) {
  const boundary = commandBoundary ?? {};

  return {
    state: boundary.state ?? fallbackCommandBoundary?.state ?? 'disabled',
    executionAvailable: false,
    copyOnly: true,
    readOnly: true,
    confirmationReady: boundary.confirmationReady === true,
    allowedFamilies: Array.isArray(boundary.allowedCommandFamilies) ? boundary.allowedCommandFamilies : [],
    blockedFamilies: Array.isArray(boundary.blockedCommandFamilies)
      ? boundary.blockedCommandFamilies
      : fallbackCommandBoundary?.blockedFamilies ?? [],
    confirmationFields: Array.isArray(boundary.confirmationFields)
      ? boundary.confirmationFields
      : fallbackCommandBoundary?.confirmationFields ?? []
  };
}

function projectSupervisorPendingResult(pendingResult) {
  const result = pendingResult ?? {};
  const missing = pendingResult === null || pendingResult === undefined || result.missing === true;
  const evidenceRefs = projectSupervisorResultEvidenceRefs(result.evidenceRefs);
  const eventCandidate = projectSupervisorResultEventCandidate(result.eventCandidate, evidenceRefs);
  const escrowRef = safeSupervisorResultText(result.escrowRef);
  const evidenceRef = safeSupervisorResultText(result.evidenceRef) ?? stringifySupervisorResultEvidenceRef(evidenceRefs[0]);

  return {
    contractName: result.contractName === 'pendingResult.v1' ? 'pendingResult.v1' : null,
    contractVersion: Number.isInteger(result.contractVersion) ? result.contractVersion : null,
    goalId: safeSupervisorResultToken(result.goalId),
    taskId: safeSupervisorResultToken(result.taskId),
    workerRole: safeSupervisorResultToken(result.workerRole),
    status: result.status ?? 'missing',
    state: safeSupervisorResultToken(result.state),
    source: safeSupervisorResultToken(result.source),
    escrowRef,
    sanitizedSummary: projectSupervisorResultSummary(result.sanitizedSummary),
    evidenceRefs,
    eventCandidate,
    eventToRegister: eventCandidate.eventType ?? safeSupervisorResultText(result.eventToRegister),
    evidenceRef,
    parserReason: safeSupervisorResultText(result.parserReason ?? eventCandidate.reason),
    blockedReasons: projectSupervisorResultTextList(result.blockedReasons),
    sourceContracts: projectSupervisorResultSourceContracts(result.sourceContracts),
    boundaries: projectSupervisorResultBoundaries(result.boundaries),
    staleMarker: result.staleMarker ?? (missing ? 'unknown' : result.stale === true ? 'stale' : 'fresh'),
    missingMarker: result.missingMarker ?? (missing ? 'pendingResult' : 'none')
  };
}

function projectSupervisorResultSummary(summary) {
  const source = summary ?? {};

  return {
    status: safeSupervisorResultText(source.status) ?? 'unknown',
    summary: safeSupervisorResultText(source.summary),
    changedFiles: projectSupervisorResultTextList(source.changedFiles),
    validationCommands: projectSupervisorResultTextList(source.validationCommands),
    evidenceRefs: projectSupervisorResultEvidenceRefs(source.evidenceRefs),
    blockerReason: safeSupervisorResultText(source.blockerReason),
    risks: projectSupervisorResultTextList(source.risks),
    blockers: projectSupervisorResultTextList(source.blockers)
  };
}

function projectSupervisorResultEventCandidate(candidate, fallbackEvidenceRefs = []) {
  const source = candidate ?? {};
  const evidenceRefs = projectSupervisorResultEvidenceRefs(source.evidenceRefs);

  return {
    eventType: safeSupervisorResultText(source.eventType),
    taskId: safeSupervisorResultToken(source.taskId),
    workerRole: safeSupervisorResultToken(source.workerRole),
    command: safeSupervisorResultToken(source.command),
    commandName: safeSupervisorResultText(source.commandName),
    requiresEvidence: source.requiresEvidence === true,
    evidenceRefs: evidenceRefs.length > 0 ? evidenceRefs : fallbackEvidenceRefs,
    blocker: projectSupervisorResultBlocker(source.blocker),
    willAppendGoalEvent: false,
    state: safeSupervisorResultToken(source.state),
    reason: safeSupervisorResultText(source.reason)
  };
}

function projectSupervisorResultBlocker(blocker) {
  const source = blocker ?? {};
  const normalized = {
    blockerId: safeSupervisorResultToken(source.blockerId),
    reason: safeSupervisorResultText(source.reason),
    severity: safeSupervisorResultText(source.severity)
  };

  return Object.values(normalized).some((value) => value !== null) ? normalized : null;
}

function projectSupervisorResultEvidenceRefs(evidenceRefs) {
  return (Array.isArray(evidenceRefs) ? evidenceRefs : [])
    .map((evidenceRef) => {
      const kind = safeSupervisorResultToken(evidenceRef?.kind);
      const ref = safeSupervisorResultText(evidenceRef?.ref);
      const label = safeSupervisorResultText(evidenceRef?.label);

      if (!['repo-doc', 'artifact-ref', 'commit', 'command-evidence', 'external-note'].includes(kind) ||
          ref === null ||
          label === null) {
        return null;
      }

      if (kind === 'repo-doc' && !ref.startsWith('docs/plans/')) {
        return null;
      }

      return { kind, ref, label };
    })
    .filter((evidenceRef) => evidenceRef !== null);
}

function stringifySupervisorResultEvidenceRef(evidenceRef) {
  if (evidenceRef === null || evidenceRef === undefined) {
    return null;
  }

  return evidenceRef.kind === 'artifact-ref' ? `artifact-ref:${evidenceRef.ref}` : evidenceRef.ref;
}

function projectSupervisorResultSourceContracts(sourceContracts) {
  return (Array.isArray(sourceContracts) ? sourceContracts : [])
    .map((contract) => {
      const contractName = safeSupervisorContractName(contract?.contractName);

      if (contractName === null) {
        return null;
      }

      return {
        contractName,
        contractVersion: Number.isInteger(contract.contractVersion) ? contract.contractVersion : null,
        escrowRef: safeSupervisorResultText(contract.escrowRef),
        previewPlanHash: safeSupervisorHash(contract.previewPlanHash),
        generatedAt: safeSupervisorResultText(contract.generatedAt),
        readOnly: true
      };
    })
    .filter((contract) => contract !== null);
}

function projectSupervisorResultBoundaries(boundaries) {
  return {
    providerExecutionAvailable: false,
    childDispatchAvailable: false,
    directGoalEventAppendAvailable: false,
    untrustedTranscriptProjectionAvailable: false,
    frontendLocalFileReadAvailable: false,
    reviewerMutationAvailable: false,
    mainVerificationMutationAvailable: false,
    releaseGateMutationAvailable: false,
    gitMutationAvailable: false,
    githubReleaseAutomationAvailable: false,
    projectionAppendsGoalEvent: false
  };
}

function projectSupervisorResultTextList(values) {
  return (Array.isArray(values) ? values : [])
    .map((value) => safeSupervisorResultText(value))
    .filter(isNonEmptyString);
}

function safeSupervisorResultText(value) {
  if (!isNonEmptyString(value)) {
    return null;
  }

  const text = String(value).trim();

  if (
    isUnsafeControlledEvidenceRefInput(text) ||
    /(?:^|\/)\.(?:codex|claude|git|symphony)(?:\/|$)/iu.test(text) ||
    /\.jsonl(?:$|[?#])/iu.test(text) ||
    /raw[\s_-]*transcript|raw[\s_-]*model[\s_-]*output|provider[\s_-]*session|session[\s_-]*log|model[\s_-]*output/iu.test(text)
  ) {
    return null;
  }

  return text;
}

function safeSupervisorResultToken(value) {
  const text = safeSupervisorResultText(value);

  return isNonEmptyString(text) && /^[A-Za-z0-9][A-Za-z0-9._:-]*$/u.test(text) ? text : null;
}

function safeSupervisorContractName(value) {
  const text = safeSupervisorResultText(value);

  return text === 'resultEvidenceEscrow.v1' ? text : null;
}

function safeSupervisorHash(value) {
  const text = safeSupervisorResultText(value);

  return isNonEmptyString(text) && /^sha256:[a-f0-9]{64}$/u.test(text) ? text : null;
}

function projectSupervisorCommandBoundary(commandBoundary) {
  const boundary = commandBoundary ?? {};

  return {
    state: boundary.state ?? 'disabled',
    executionAvailable: boundary.executionAvailable === true,
    copyOnly: boundary.copyOnly === true,
    allowedFamilies: Array.isArray(boundary.allowedFamilies)
      ? boundary.allowedFamilies
      : Array.isArray(boundary.allowedCommandFamilies) ? boundary.allowedCommandFamilies : [],
    blockedFamilies: Array.isArray(boundary.blockedFamilies)
      ? boundary.blockedFamilies
      : Array.isArray(boundary.blockedCommandFamilies) ? boundary.blockedCommandFamilies : [],
    confirmationFields: Array.isArray(boundary.confirmationFields)
      ? boundary.confirmationFields
      : Array.isArray(boundary.confirmation?.fields) ? boundary.confirmation.fields : [],
    safePreview: boundary.safePreview ?? boundary.safeCommandPreview ?? null
  };
}

function projectSupervisorCurrentGate(currentGate) {
  const gate = currentGate ?? {};

  return {
    gateId: gate.gateId ?? null,
    status: gate.status ?? null,
    requiredCommandFamily: gate.requiredCommandFamily ?? null,
    blockingReason: gate.blockingReason ?? null,
    evidenceRequirement: gate.evidenceRequirement ?? null,
    closeoutAuthorization: gate.closeoutAuthorization ?? gate.closeoutAuthorizationState ?? null
  };
}

function projectSupervisorOwnership(ownership) {
  const owner = ownership ?? {};

  return {
    orchestrationOwner: owner.orchestrationOwner ?? null,
    deliveryBoundary: owner.deliveryBoundary ?? null,
    activePr: owner.activePr ?? null,
    branch: owner.branch ?? null,
    rollbackBoundary: owner.rollbackBoundary ?? null,
    daemonState: owner.daemonState ?? null,
    controllerInterventionReason: owner.controllerInterventionReason ?? null
  };
}

function projectSupervisorTimeline(goalTimeline) {
  if (!Array.isArray(goalTimeline)) {
    return [];
  }

  return goalTimeline.map((event, index) => ({
    eventId: event?.eventId ?? `event-${index}`,
    taskId: event?.taskId ?? null,
    role: event?.role ?? null,
    status: event?.status ?? null,
    evidenceRef: event?.evidenceRef ?? null,
    timestamp: event?.timestamp ?? event?.occurredAt ?? null,
    hashState: event?.hashState ?? event?.hashChainState ?? null
  }));
}

function supervisorWaitPolicyText(waitPolicy) {
  if (waitPolicy === null || waitPolicy === undefined) {
    return null;
  }

  if (typeof waitPolicy !== 'object' || Array.isArray(waitPolicy)) {
    return String(waitPolicy);
  }

  return Object.entries(waitPolicy)
    .filter(([, value]) => value !== null && value !== undefined && value !== '')
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ') || null;
}

function supervisorStaleThresholdText(waitPolicy) {
  if (waitPolicy === null || waitPolicy === undefined || typeof waitPolicy !== 'object' || Array.isArray(waitPolicy)) {
    return null;
  }

  return supervisorDurationText(waitPolicy.staleThresholdMs);
}

function supervisorAgeText(age) {
  if (typeof age === 'string') {
    return age;
  }

  return supervisorDurationText(age);
}

function supervisorDurationText(value) {
  if (!Number.isFinite(value)) {
    return null;
  }

  if (value < 1000) {
    return `${value}ms`;
  }

  if (value < 60000) {
    return `${Math.round(value / 1000)}s`;
  }

  return `${Math.round(value / 60000)}m`;
}

function supervisorDispatchGuardText(duplicateDispatchGuard) {
  if (typeof duplicateDispatchGuard === 'string') {
    return duplicateDispatchGuard;
  }

  if (duplicateDispatchGuard === null || duplicateDispatchGuard === undefined || typeof duplicateDispatchGuard !== 'object') {
    return null;
  }

  const state = duplicateDispatchGuard.blocked === true ? 'blocked' : 'available';
  const reason = duplicateDispatchGuard.reason ?? null;

  return reason === null ? state : `${state}: ${reason}`;
}

function supervisorContextState(context) {
  if (context?.missingTranscriptState?.missing === true) {
    return 'missing';
  }

  if (context?.staleTranscriptState?.stale === true) {
    return 'stale';
  }

  if (context?.transcriptAvailability === undefined || context?.transcriptAvailability === null) {
    return 'missing';
  }

  return 'available';
}

function supervisorProviderSummaryTexts(providerSummaries) {
  if (!Array.isArray(providerSummaries)) {
    return [];
  }

  return providerSummaries.map((provider) => {
    if (typeof provider === 'string') {
      return provider;
    }

    return [
      provider?.provider,
      provider?.status,
      provider?.threadId
    ].filter(isNonEmptyString).join(': ');
  }).filter(isNonEmptyString);
}

function supervisorObjectSummaryText(value) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== 'object' || Array.isArray(value)) {
    return String(value);
  }

  return Object.entries(value)
    .filter(([, entryValue]) => entryValue !== null && entryValue !== undefined && entryValue !== '')
    .map(([key, entryValue]) => `${key}: ${entryValue}`)
    .join(', ') || null;
}

function supervisorTokenUsageText(tokenUsage) {
  if (tokenUsage === null || tokenUsage === undefined) {
    return null;
  }

  if (typeof tokenUsage !== 'object' || Array.isArray(tokenUsage)) {
    return String(tokenUsage);
  }

  const used = tokenUsage.usedTokens ?? tokenUsage.used ?? tokenUsage.inputTokens ?? null;
  const limit = tokenUsage.limitTokens ?? tokenUsage.limit ?? tokenUsage.contextWindow ?? null;

  if (used !== null && limit !== null) {
    return `${used} / ${limit}`;
  }

  return supervisorObjectSummaryText(tokenUsage);
}

function supervisorContextUtilizationText(contextUtilization) {
  if (contextUtilization === null || contextUtilization === undefined) {
    return null;
  }

  if (typeof contextUtilization !== 'object' || Array.isArray(contextUtilization)) {
    return String(contextUtilization);
  }

  if (Number.isFinite(contextUtilization.percent)) {
    return `${contextUtilization.percent}%`;
  }

  if (Number.isFinite(contextUtilization.ratio)) {
    return `${Math.round(contextUtilization.ratio * 100)}%`;
  }

  return supervisorObjectSummaryText(contextUtilization);
}

function supervisorTranscriptStateText(context) {
  if (context?.missingTranscriptState?.missing === true) {
    return `missing${context.missingTranscriptState.reason ? `: ${context.missingTranscriptState.reason}` : ''}`;
  }

  if (context?.staleTranscriptState?.stale === true) {
    return `stale${context.staleTranscriptState.reason ? `: ${context.staleTranscriptState.reason}` : ''}`;
  }

  return 'fresh';
}

function supervisorResultBlockEvidenceText(resultBlockEvidence) {
  if (resultBlockEvidence === null || resultBlockEvidence === undefined) {
    return null;
  }

  if (typeof resultBlockEvidence !== 'object' || Array.isArray(resultBlockEvidence)) {
    return String(resultBlockEvidence);
  }

  return firstNonEmptyString(
    resultBlockEvidence.evidenceRef,
    resultBlockEvidence.sourceRef,
    resultBlockEvidence.status
  );
}

function supervisorContextAdvisoryState(advisory) {
  if (advisory?.missingTranscriptState?.missing === true) {
    return 'missing';
  }

  if (advisory?.staleTranscriptState?.stale === true) {
    return 'stale';
  }

  if (Array.isArray(advisory?.blockedFields) && advisory.blockedFields.length > 0) {
    return 'blocked';
  }

  if (Array.isArray(advisory?.degradedReasons) && advisory.degradedReasons.length > 0) {
    return 'degraded';
  }

  if (advisory?.contextBand === 'unknown' || advisory?.transcriptAvailability === undefined) {
    return 'unknown';
  }

  return 'available';
}

function supervisorTranscriptFlagText(state, flag) {
  if (state === null || state === undefined || typeof state !== 'object' || Array.isArray(state)) {
    return flag === 'stale' ? 'stale: false' : 'missing: false';
  }

  const active = flag === 'stale' ? state.stale === true : state.missing === true;
  const reason = state.reason ?? null;

  return reason === null ? `${flag}: ${String(active)}` : `${flag}: ${String(active)} / ${reason}`;
}

function supervisorContractRefTexts(sourceContracts) {
  return (Array.isArray(sourceContracts) ? sourceContracts : [])
    .map(supervisorContractRefText)
    .filter(isNonEmptyString);
}

function supervisorContractRefText(contract) {
  if (typeof contract === 'string') {
    return contract;
  }

  if (contract === null || contract === undefined || typeof contract !== 'object' || Array.isArray(contract)) {
    return null;
  }

  const name = contract.contractName ?? null;

  if (!isNonEmptyString(name)) {
    return null;
  }

  return [
    name,
    contract.contractVersion === null || contract.contractVersion === undefined ? null : `v${contract.contractVersion}`,
    contract.generatedAt ?? null
  ].filter(isNonEmptyString).join(' / ');
}

function supervisorInventoryPolicySourceTexts(sources) {
  return (Array.isArray(sources) ? sources : [])
    .map((source) => {
      if (typeof source === 'string') {
        return source;
      }

      return [
        source?.provider,
        source?.state,
        source?.sourceSummary?.readState
      ].filter(isNonEmptyString).join(': ');
    })
    .filter(isNonEmptyString);
}

function projectRouteState(route, result) {
  if (result?.skipped === true) {
    return {
      id: route.id,
      label: route.label,
      path: route.path,
      method: route.method,
      state: 'skipped',
      contractName: valueState(route.contractName),
      contractVersion: valueState(undefined),
      error: result.message ?? '暂无 timeline / 未暴露 / 不可用',
      httpStatus: null
    };
  }

  if (result?.ok === true) {
    return {
      id: route.id,
      label: route.label,
      path: route.path,
      method: route.method,
      state: 'ready',
      contractName: valueState(result.data?.contractName),
      contractVersion: valueState(result.data?.contractVersion)
    };
  }

  return {
    id: route.id,
    label: route.label,
    path: route.path,
    method: route.method,
    state: 'failed',
    contractName: valueState(route.contractName),
    contractVersion: valueState(undefined),
    error: result?.message ?? '读取失败 / contract 未暴露 / 不可用',
    httpStatus: result?.httpStatus ?? null
  };
}

function projectSummary(summary) {
  const latestRun = summary?.latestRun ?? summary?.overview?.latestRun ?? null;
  const adoptionSummary = summary?.adoptionSummary;

  return {
    contractName: valueState(summary?.contractName),
    contractVersion: valueState(summary?.contractVersion),
    status: valueState(summary?.status),
    generatedAt: valueState(summary?.generatedAt),
    readOnly: valueState(summary?.readOnly),
    modelInvocation: valueState(summary?.modelInvocation),
    overviewStatus: valueState(summary?.overview?.status),
    headline: valueState(summary?.overview?.headline),
    stageId: valueState(summary?.stageSummary?.stageId ?? summary?.overview?.stage?.stageId),
    stageStatus: valueState(summary?.stageSummary?.status ?? summary?.overview?.stage?.status),
    nextAction: valueState(summary?.overview?.nextAction ?? summary?.action?.next),
    runCount: valueState(summary?.runStats?.total),
    latestRunId: valueState(latestRun?.runId ?? summary?.overview?.latestRunId),
    latestRun: {
      runId: valueState(latestRun?.runId ?? summary?.overview?.latestRunId),
      status: valueState(latestRun?.status),
      verifierStatus: valueState(latestRun?.verifierStatus),
      updatedAt: valueState(latestRun?.updatedAt)
    },
    adoptionSummary: {
      status: valueState(adoptionSummary?.status),
      pendingCount: valueState(adoptionSummary?.pendingCount),
      dirtyBlocked: valueState(adoptionSummary?.dirtyBlocked)
    },
    capabilities: objectState(summary?.capabilities),
    riskSummary: projectRiskSummary(summary?.riskSummary),
    readonlyNote: 'Summary panel 只展示 /api/summary 已暴露字段；readOnly、modelInvocation 与 capabilities 缺失时不由 React 端补值。',
    raw: summary ?? null
  };
}

function projectReadiness(readiness, summary) {
  return {
    contractName: valueState(readiness?.contractName),
    contractVersion: valueState(readiness?.contractVersion),
    status: valueState(readiness?.status),
    attention: readiness?.status === undefined ? null : readiness.status !== 'ready',
    readOnly: valueState(readiness?.readOnly),
    modelInvocation: valueState(readiness?.modelInvocation),
    capabilities: objectState(readiness?.capabilities),
    gitBranch: valueState(readiness?.tools?.git?.branch),
    gitHead: valueState(readiness?.tools?.git?.head),
    gitMainHead: valueState(readiness?.tools?.git?.mainHead),
    gitOriginMainHead: valueState(readiness?.tools?.git?.originMainHead),
    gitDirty: valueState(readiness?.tools?.git?.dirty),
    dirtyFilesCount: valueState(readiness?.tools?.git?.dirtyFilesCount),
    dirtyPaths: Array.isArray(readiness?.tools?.git?.dirtyPaths)
      ? readiness.tools.git.dirtyPaths.map((path) => valueState(path))
      : [],
    packageManagerStatus: valueState(readiness?.tools?.packageManager?.status),
    checks: projectChecks(readiness?.checks),
    diagnostics: projectRiskSummary(readiness?.riskSummary),
    signals: projectReadonlySignals(summary),
    readonlyNote: 'Readiness panel 只展示 checks、riskSummary 与 Git readiness 字段；attention 不会转换成浏览器操作入口。',
    raw: readiness ?? null
  };
}

function projectRuns(runs, summary) {
  const routeRuns = Array.isArray(runs?.runs) ? runs.runs : null;
  const latestRunId = summary?.latestRun?.runId ?? summary?.overview?.latestRunId;

  return {
    state: routeRuns === null ? 'missing' : routeRuns.length === 0 ? 'empty' : 'available',
    contractName: valueState(runs?.contractName),
    contractVersion: valueState(runs?.contractVersion),
    count: valueState(routeRuns === null ? undefined : routeRuns.length),
    summaryCount: valueState(summary?.runStats?.total),
    filter: valueState(runs?.filter),
    availableFilters: Array.isArray(runs?.availableFilters) ? [...runs.availableFilters] : [],
    items: routeRuns === null ? [] : routeRuns.map((run) => projectRunListItem(run, latestRunId)),
    raw: runs ?? null
  };
}

function projectLatestRun({ result, run, hasNoRuns, safeArtifactPreviewResults = [] }) {
  if (hasNoRuns || result?.httpStatus === 404) {
    return {
      state: 'empty',
      runId: valueState(undefined),
      status: valueState('无运行记录'),
      verifierStatus: valueState(undefined),
      modelInvocation: valueState(undefined),
      executionPlanId: valueState(undefined),
      adoptionPlanId: valueState(undefined),
      evidenceArtifactPath: valueState(undefined),
      sourceWorkspacePath: valueState(undefined),
      createdAt: valueState(undefined),
      updatedAt: valueState(undefined),
      timeline: {
        state: 'empty',
        text: NOT_APPLICABLE_TEXT,
        count: 0
      },
      artifactRefsCount: valueState(0),
      artifactStatus: projectArtifactStatus(undefined),
      artifactRefs: projectArtifactRefs([], undefined),
      raw: null
    };
  }

  if (result?.ok !== true) {
    return {
      state: 'unavailable',
      runId: valueState(undefined),
      status: valueState(undefined),
      verifierStatus: valueState(undefined),
      modelInvocation: valueState(undefined),
      executionPlanId: valueState(undefined),
      adoptionPlanId: valueState(undefined),
      evidenceArtifactPath: valueState(undefined),
      sourceWorkspacePath: valueState(undefined),
      createdAt: valueState(undefined),
      updatedAt: valueState(undefined),
      timeline: projectTimelineAvailability(undefined),
      artifactRefsCount: valueState(undefined),
      artifactStatus: projectArtifactStatus(undefined),
      artifactRefs: projectArtifactRefs(undefined, undefined),
      error: result?.message ?? UNAVAILABLE_TEXT,
      raw: null
    };
  }

  return {
    state: run === null || run === undefined ? 'missing' : 'available',
    runId: valueState(run?.runId),
    status: valueState(run?.status),
    verifierStatus: valueState(run?.verifierStatus),
    modelInvocation: valueState(run?.modelInvocation),
    executionPlanId: valueState(run?.executionPlanId),
    adoptionPlanId: valueState(run?.adoptionPlanId),
    evidenceArtifactPath: valueState(run?.evidenceArtifactPath),
    sourceWorkspacePath: valueState(run?.sourceWorkspacePath),
    createdAt: valueState(run?.createdAt),
    updatedAt: valueState(run?.updatedAt),
    timeline: projectTimelineAvailability(run?.timeline),
    artifactRefsCount: valueState(Array.isArray(run?.artifactRefs) ? run.artifactRefs.length : undefined),
    artifactStatus: projectArtifactStatus(run?.artifactStatus),
    artifactRefs: projectArtifactRefs(run?.artifactRefs, run?.artifactStatus, safeArtifactPreviewResults),
    raw: run ?? null
  };
}

function projectLatestRunTimeline({ result, latestRun }) {
  if (latestRun.state === 'empty') {
    return {
      state: 'empty',
      contractName: valueState(undefined),
      contractVersion: valueState(undefined),
      runId: valueState(undefined),
      count: valueState(0),
      items: [],
      note: '暂无 timeline；当前没有 latest run。'
    };
  }

  if (result?.skipped === true) {
    return {
      state: 'empty',
      contractName: valueState(RUN_TIMELINE_ROUTE_TEMPLATE.contractName),
      contractVersion: valueState(undefined),
      runId: latestRun.runId,
      count: valueState(0),
      items: [],
      note: '暂无 timeline / 未暴露 / 不可用。'
    };
  }

  if (result?.ok !== true) {
    return {
      state: 'unavailable',
      contractName: valueState(RUN_TIMELINE_ROUTE_TEMPLATE.contractName),
      contractVersion: valueState(undefined),
      runId: latestRun.runId,
      count: valueState(undefined),
      items: [],
      error: result?.message ?? UNAVAILABLE_TEXT,
      note: 'timeline route 未暴露或不可用；前端不从其他字段伪造 timeline。'
    };
  }

  const timeline = Array.isArray(result.data?.timeline) ? result.data.timeline : null;

  if (timeline === null) {
    return {
      state: 'missing',
      contractName: valueState(result.data?.contractName),
      contractVersion: valueState(result.data?.contractVersion),
      runId: valueState(result.data?.runId),
      count: valueState(undefined),
      items: [],
      note: 'timeline 字段未暴露。'
    };
  }

  return {
    state: timeline.length === 0 ? 'empty' : 'available',
    contractName: valueState(result.data?.contractName),
    contractVersion: valueState(result.data?.contractVersion),
    runId: valueState(result.data?.runId),
    count: valueState(timeline.length),
    items: timeline.map((event) => ({
      id: valueState(event?.id),
      label: valueState(event?.label),
      status: valueState(event?.status),
      detail: valueState(event?.detail),
      at: valueState(event?.at)
    })),
    note: 'Timeline panel 只展示 /api/runs/<run-id>/timeline 已暴露的只读事件字段。'
  };
}

function projectAdoption({ summary, readiness }) {
  const adoptionSummary = summary?.adoptionSummary;

  return {
    status: valueState(adoptionSummary?.status),
    pendingCount: valueState(adoptionSummary?.pendingCount),
    dirtyBlocked: valueState(adoptionSummary?.dirtyBlocked),
    gitDirtyReadiness: valueState(readiness?.tools?.git?.dirty),
    note: 'dirty adoption 不由 React 端合成，只展示 API 已暴露的 adoption summary 与 Git readiness 字段。'
  };
}

function projectGuidedGoalHandoff({ indexResult, handoffResult, handoffIndex, handoff }) {
  const roles = Array.isArray(handoff?.roles) ? handoff.roles : null;
  const tasks = Array.isArray(handoff?.tasks) ? handoff.tasks : null;
  const commandBlocks = projectHandoffCommandBlocks(handoff?.commands);

  return {
    state: projectHandoffState({ indexResult, handoffResult, handoff }),
    refs: projectHandoffRefs(handoffIndex),
    contractName: valueState(handoff?.contractName),
    contractVersion: valueState(handoff?.contractVersion),
    goalId: valueState(handoff?.goalId),
    title: valueState(handoff?.title),
    titleZh: valueState(handoff?.titleZh),
    baselineReleaseTag: valueState(handoff?.baseline?.releaseTag),
    baselineApprovalCommit: valueState(handoff?.baseline?.approvalCommit),
    taskCount: valueState(tasks === null ? undefined : tasks.length),
    roleCount: valueState(roles === null ? undefined : roles.length),
    commandBlockCount: valueState(commandBlocks.count),
    reviewContextIsolation: valueState(handoff?.reviewModel?.contextIsolation),
    workerSelfCheckIsFinal: valueState(handoff?.reviewModel?.workerSelfCheckIsFinal),
    roles: roles === null ? {
      state: 'missing',
      items: []
    } : {
      state: roles.length === 0 ? 'empty' : 'available',
      items: roles.map((role) => ({
        id: valueState(role?.id),
        description: valueState(role?.description),
        inputs: arrayTextState(role?.inputs),
        outputs: arrayTextState(role?.outputs),
        prohibited: arrayTextState(role?.prohibited)
      }))
    },
    tasks: tasks === null ? {
      state: 'missing',
      items: []
    } : {
      state: tasks.length === 0 ? 'empty' : 'available',
      items: tasks.map((task) => ({
        id: valueState(task?.id),
        name: valueState(task?.name),
        titleZh: valueState(task?.titleZh),
        phase: valueState(task?.phase),
        status: valueState(task?.status),
        role: valueState(task?.role),
        dependsOn: arrayTextState(task?.dependsOn),
        evidencePath: valueState(task?.evidencePath),
        reviewGate: valueState(task?.reviewGate)
      }))
    },
    commandBlocks,
    note: 'Handoff panel 只展示 /api/handoff 注册 ref 与 guided-goal-handoff.v1 contract 字段；task phase/status 缺失时保持未暴露，不由浏览器端推断。',
    error: handoffResult?.ok === true ? null : handoffResult?.message ?? null
  };
}

function projectHandoffState({ indexResult, handoffResult, handoff }) {
  if (indexResult?.ok !== true) {
    return 'unavailable';
  }

  if (handoffResult?.skipped === true) {
    return 'missing';
  }

  if (handoffResult?.ok !== true) {
    return 'unavailable';
  }

  if (handoff === null || handoff === undefined) {
    return 'missing';
  }

  return 'available';
}

function projectHandoffRefs(handoffIndex) {
  const refs = Array.isArray(handoffIndex?.refs) ? handoffIndex.refs : null;

  return {
    state: refs === null ? 'missing' : refs.length === 0 ? 'empty' : 'available',
    contractName: valueState(handoffIndex?.contractName),
    contractVersion: valueState(handoffIndex?.contractVersion),
    readOnly: valueState(handoffIndex?.readOnly),
    arbitraryPathReads: valueState(handoffIndex?.arbitraryPathReads),
    count: valueState(refs === null ? undefined : refs.length),
    items: refs === null ? [] : refs.map((ref) => ({
      ref: valueState(ref?.ref),
      contractName: valueState(ref?.contractName),
      contractVersion: valueState(ref?.contractVersion),
      href: valueState(ref?.href)
    }))
  };
}

function projectHandoffCommandBlocks(commands) {
  const blocks = Array.isArray(commands?.blocks) ? commands.blocks : null;

  return {
    state: blocks === null ? 'missing' : blocks.length === 0 ? 'empty' : 'available',
    copyOnly: valueState(commands?.copyOnly),
    count: blocks === null ? null : blocks.length,
    items: blocks === null ? [] : blocks.map((block) => ({
      id: valueState(block?.id),
      title: valueState(block?.title),
      copyOnly: valueState(block?.copyOnly),
      commands: Array.isArray(block?.commands)
        ? block.commands.map((command) => valueState(command))
        : []
    }))
  };
}

function projectRunListItem(run, latestRunId) {
  return {
    runId: valueState(run?.runId),
    status: valueState(run?.status),
    verifierStatus: valueState(run?.verifierStatus),
    intent: valueState(run?.intent),
    command: valueState(run?.command),
    semanticCommand: valueState(run?.semanticCommand),
    routeKey: valueState(run?.routeDecision?.routeKey),
    routeDecisionIntent: valueState(run?.routeDecision?.intent),
    routeDecisionReason: valueState(run?.routeDecision?.reason),
    createdAt: valueState(run?.createdAt),
    updatedAt: valueState(run?.updatedAt),
    artifactRefs: projectArtifactRefs(run?.artifactRefs, run?.artifactStatus),
    isLatest: valueState(Boolean(latestRunId && run?.runId === latestRunId))
  };
}

function projectArtifactStatus(artifactStatus) {
  if (artifactStatus === undefined || artifactStatus === null || typeof artifactStatus !== 'object') {
    return {
      state: 'missing',
      status: valueState(undefined),
      total: valueState(undefined),
      available: valueState(undefined),
      missing: valueState(undefined),
      unknown: valueState(undefined),
      missingKinds: textState(MISSING_TEXT)
    };
  }

  return {
    state: 'available',
    status: valueState(artifactStatus.status),
    total: valueState(artifactStatus.total),
    available: valueState(artifactStatus.available),
    missing: valueState(artifactStatus.missing),
    unknown: valueState(artifactStatus.unknown),
    missingKinds: textState(Array.isArray(artifactStatus.missingKinds) && artifactStatus.missingKinds.length > 0
      ? artifactStatus.missingKinds.join('、')
      : '无')
  };
}

function projectArtifactRefStatus({ artifact, artifactStatus }) {
  if (hasOwn(artifact, 'status')) {
    return artifact.status;
  }

  const missingRefs = Array.isArray(artifactStatus?.missingRefs) ? artifactStatus.missingRefs : [];
  const isMissing = missingRefs.some((missingRef) => (
    missingRef?.kind === artifact?.kind && missingRef?.path === artifact?.path
  ));

  if (isMissing) {
    return 'missing';
  }

  if (artifactStatus?.status === 'ok') {
    return 'available';
  }

  if (artifactStatus?.status === 'missing' && missingRefs.length > 0 && Number(artifactStatus?.unknown ?? 0) === 0) {
    return 'available';
  }

  if (artifactStatus?.status === 'unknown') {
    return UNAVAILABLE_TEXT;
  }

  return MISSING_TEXT;
}

function projectChecks(checks) {
  if (!Array.isArray(checks)) {
    return {
      state: 'missing',
      count: null,
      items: []
    };
  }

  return {
    state: checks.length === 0 ? 'empty' : 'available',
    count: checks.length,
    items: checks.map((check) => ({
      id: valueState(check?.id),
      label: valueState(check?.label),
      status: valueState(check?.status),
      detail: valueState(check?.detail)
    }))
  };
}

function projectRiskSummary(riskSummary) {
  if (riskSummary === undefined || riskSummary === null) {
    return {
      state: 'missing',
      status: valueState(undefined),
      total: valueState(undefined),
      items: []
    };
  }

  const items = Array.isArray(riskSummary.items) ? riskSummary.items : [];

  return {
    state: items.length === 0 ? 'empty' : 'available',
    status: valueState(riskSummary.status),
    total: valueState(riskSummary.total),
    items: items.map((item) => ({
      id: valueState(item?.id),
      category: valueState(item?.category),
      severity: valueState(item?.severity),
      title: valueState(item?.title),
      detail: valueState(item?.detail),
      runId: valueState(item?.runId)
    }))
  };
}

function projectReadonlySignals(summary) {
  const stageSummary = summary?.stageSummary;
  const artifactStats = summary?.runStats?.artifacts;

  return {
    stageStatus: valueState(stageSummary?.status),
    stageBlockerStatus: valueState(stageSummary?.blocker?.status ?? stageSummary?.blocker?.kind),
    stageBlockerTitle: valueState(stageSummary?.blocker?.title ?? stageSummary?.blocker?.message),
    charterConsistencyStatus: valueState(stageSummary?.consistency?.status),
    artifactStatus: valueState(artifactStats?.status),
    missingArtifactCount: valueState(artifactStats?.missing),
    note: 'Missing artifact、blocked Stage 与 Charter mismatch 只按 summary contract 已暴露字段呈现；React 端不推断原因或修复动作。'
  };
}

function projectTimelineAvailability(timeline) {
  if (!Array.isArray(timeline)) {
    return {
      state: 'missing',
      text: MISSING_TEXT,
      count: null
    };
  }

  return {
    state: timeline.length === 0 ? 'empty' : 'available',
    text: timeline.length === 0 ? '空 timeline' : `${timeline.length} 个事件`,
    count: timeline.length
  };
}

function dataFrom(result) {
  return result?.ok === true ? result.data : null;
}

function findSafeArtifactPreviewResult({ artifact, results }) {
  const uri = artifact?.uri;

  if (!isNonEmptyString(uri)) {
    return null;
  }

  return results.find((result) => result?.route === uri || result?.routeDescriptor?.path === uri) ?? null;
}

function isSafeArtifactPreviewRoutePath(value) {
  return isNonEmptyString(value) &&
    value.startsWith(`${RUN_API_BASE}/`) &&
    value.includes('/artifacts/') &&
    value.endsWith('/preview') &&
    !value.includes('?') &&
    !value.includes('#') &&
    !value.includes('\\') &&
    !value.includes('..');
}

function isSafeGoalRouteSegment(value) {
  return isNonEmptyString(value) &&
    !value.includes('/') &&
    !value.includes('\\') &&
    !value.includes('..') &&
    !value.includes('?') &&
    !value.includes('#');
}

function objectState(value) {
  if (value === undefined || value === null || typeof value !== 'object' || Array.isArray(value)) {
    return {
      state: 'missing',
      text: MISSING_TEXT,
      value: null
    };
  }

  return {
    state: 'available',
    text: '已暴露',
    value
  };
}

function valueState(value) {
  if (value === undefined || value === null || value === '') {
    return {
      state: 'missing',
      text: MISSING_TEXT,
      value: null
    };
  }

  return {
    state: 'available',
    text: String(value),
    value
  };
}

function textState(text) {
  return {
    state: text === MISSING_TEXT ? 'missing' : 'available',
    text,
    value: text
  };
}

function arrayTextState(values, emptyText = '无') {
  if (!Array.isArray(values)) {
    return textState(MISSING_TEXT);
  }

  return textState(values.length > 0 ? values.join('、') : emptyText);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function firstNonEmptyString(...values) {
  return values.find((value) => isNonEmptyString(value));
}

function uniqueNonEmptyStrings(values) {
  return Array.from(new Set(values.filter((value) => isNonEmptyString(value))));
}

function firstValue(...statesOrValues) {
  for (const candidate of statesOrValues) {
    const value = candidate !== null && typeof candidate === 'object' && 'value' in candidate
      ? candidate.value
      : candidate;

    if (isNonEmptyString(value)) {
      return value;
    }
  }

  return undefined;
}

function routeStateFromResult(result) {
  if (result?.ok === true) {
    return 'ready';
  }

  if (result?.skipped === true) {
    return 'skipped';
  }

  return 'unavailable';
}

function hasOwn(value, key) {
  return value !== null && typeof value === 'object' && Object.hasOwn(value, key);
}

function unique(values) {
  return [...new Set(values)];
}

function projectEvidenceTimeline({ result, timeline }) {
  if (timeline === null || timeline === undefined) {
    return {
      state: result?.ok === true ? 'empty' : 'unavailable',
      errorEnvelope: result?.errorEnvelope ?? null,
      contractName: valueState(undefined),
      contractVersion: valueState(undefined),
      generatedAt: valueState(undefined),
      readOnly: valueState(undefined),
      context: {},
      entryCount: valueState(0),
      entries: valueState([]),
      note: 'Evidence timeline 未暴露 / 不可用。'
    };
  }

  return {
    state: Array.isArray(timeline.timeline) && timeline.timeline.length > 0 ? 'available' : 'empty',
    errorEnvelope: result?.errorEnvelope ?? null,
    contractName: valueState(timeline.contractName),
    contractVersion: valueState(timeline.contractVersion),
    generatedAt: valueState(timeline.generatedAt),
    readOnly: valueState(timeline.readOnly),
    context: {
      goalId: valueState(timeline.context?.goalId),
      taskId: valueState(timeline.context?.taskId),
      entryCount: valueState(timeline.context?.entryCount),
      canonicalSource: valueState(timeline.context?.canonicalSource),
      timelineRole: valueState(timeline.context?.timelineRole)
    },
    entryCount: valueState(timeline.context?.entryCount ?? (Array.isArray(timeline.timeline) ? timeline.timeline.length : 0)),
    entries: valueState(Array.isArray(timeline.timeline) ? timeline.timeline : []),
    boundaries: {
      readOnly: valueState(timeline.boundaries?.readOnly),
      canonicalSource: valueState(timeline.boundaries?.canonicalSource)
    },
    note: 'Evidence Timeline 只展示 artifact index 和 goal events 的派生时间线数据。不执行 shell、不调用模型、不打开本地文件。'
  };
}

function projectReleaseBundle({ result, bundle }) {
  if (bundle === null || bundle === undefined) {
    return {
      state: result?.ok === true ? 'empty' : 'unavailable',
      errorEnvelope: result?.errorEnvelope ?? null,
      contractName: valueState(undefined),
      contractVersion: valueState(undefined),
      generatedAt: valueState(undefined),
      readOnly: valueState(undefined),
      context: {},
      taskCount: valueState(0),
      tasks: valueState([]),
      releaseGates: valueState([]),
      releaseReady: valueState(false),
      note: 'Release bundle 未暴露 / 不可用。'
    };
  }

  return {
    state: bundle.bundle?.tasks?.length > 0 ? 'available' : 'empty',
    errorEnvelope: result?.errorEnvelope ?? null,
    contractName: valueState(bundle.contractName),
    contractVersion: valueState(bundle.contractVersion),
    generatedAt: valueState(bundle.generatedAt),
    readOnly: valueState(bundle.readOnly),
    context: {
      goalId: valueState(bundle.context?.goalId),
      canonicalSource: valueState(bundle.context?.canonicalSource),
      bundleRole: valueState(bundle.context?.bundleRole)
    },
    taskCount: valueState(bundle.bundle?.taskCount ?? 0),
    tasks: valueState(bundle.bundle?.tasks ?? []),
    releaseGates: valueState(bundle.bundle?.releaseGates ?? []),
    releaseReady: valueState(bundle.bundle?.releaseReady ?? false),
    boundaries: {
      readOnly: valueState(bundle.boundaries?.readOnly),
      canonicalSource: valueState(bundle.boundaries?.canonicalSource),
      releaseDecisionAvailable: valueState(bundle.boundaries?.releaseDecisionAvailable)
    },
    note: 'Release Bundle 按 task 展示 worker/reviewer/main-verifier/release-manager evidence 分组。所有数据来自 ArtifactStore 和 goal events。此为只读视图，不是 release 授权。'
  };
}

function projectAppCoreReleaseManager({ result, releaseManager }) {
  if (releaseManager === null || releaseManager === undefined) {
    return {
      state: result?.ok === true ? 'empty' : 'unavailable',
      errorEnvelope: result?.errorEnvelope ?? null,
      contractName: valueState(undefined),
      contractVersion: valueState(undefined),
      generatedAt: valueState(undefined),
      readOnly: valueState(undefined),
      context: {},
      releaseReadiness: {},
      closeoutStatus: {},
      capabilityChecklist: {
        totalCount: valueState(0),
        passedCount: valueState(0),
        warningCount: valueState(0),
        blockedCount: valueState(0),
        items: valueState([])
      },
      finalEvidenceDraft: {},
      sourceSummary: {},
      boundaries: {},
      note: 'App Core Release Manager 未暴露 / 不可用。'
    };
  }

  return {
    state: releaseManager.releaseReadiness?.state ?? 'available',
    errorEnvelope: result?.errorEnvelope ?? null,
    contractName: valueState(releaseManager.contractName),
    contractVersion: valueState(releaseManager.contractVersion),
    generatedAt: valueState(releaseManager.generatedAt),
    readOnly: valueState(releaseManager.readOnly),
    context: {
      goalId: valueState(releaseManager.context?.goalId),
      resolvedGoalId: valueState(releaseManager.context?.resolvedGoalId),
      taskId: valueState(releaseManager.context?.taskId),
      managerRole: valueState(releaseManager.context?.managerRole),
      stateSource: valueState(releaseManager.context?.stateSource)
    },
    releaseReadiness: {
      state: valueState(releaseManager.releaseReadiness?.state),
      reason: valueState(releaseManager.releaseReadiness?.reason),
      releaseReadyDeclared: valueState(releaseManager.releaseReadiness?.releaseReadyDeclared),
      releaseReadySource: valueState(releaseManager.releaseReadiness?.releaseReadySource),
      declarationAuthorized: valueState(releaseManager.releaseReadiness?.declarationAuthorized),
      declarationCommandAvailable: valueState(releaseManager.releaseReadiness?.declarationCommandAvailable),
      readyEventRequired: valueState(releaseManager.releaseReadiness?.readyEventRequired),
      capabilitiesPassed: valueState(releaseManager.releaseReadiness?.capabilitiesPassed)
    },
    closeoutStatus: {
      state: valueState(releaseManager.closeoutStatus?.state),
      totalTasks: valueState(releaseManager.closeoutStatus?.totalTasks),
      workerEvidenceComplete: valueState(releaseManager.closeoutStatus?.workerEvidenceComplete),
      reviewEvidenceComplete: valueState(releaseManager.closeoutStatus?.reviewEvidenceComplete),
      mainVerificationComplete: valueState(releaseManager.closeoutStatus?.mainVerificationComplete),
      releaseReady: valueState(releaseManager.closeoutStatus?.releaseReady),
      releaseReadySource: valueState(releaseManager.closeoutStatus?.releaseReadySource),
      missingCount: valueState(releaseManager.closeoutStatus?.missingCount),
      blocker: valueState(releaseManager.closeoutStatus?.blocker),
      releaseGateStatuses: Object.entries(releaseManager.closeoutStatus?.releaseGateStatuses ?? {}).map(([gate, status]) => ({
        gate: valueState(gate),
        status: valueState(status)
      }))
    },
    capabilityChecklist: {
      totalCount: valueState(releaseManager.capabilityChecklist?.totalCount ?? 0),
      passedCount: valueState(releaseManager.capabilityChecklist?.passedCount ?? 0),
      warningCount: valueState(releaseManager.capabilityChecklist?.warningCount ?? 0),
      blockedCount: valueState(releaseManager.capabilityChecklist?.blockedCount ?? 0),
      sourcePolicy: valueState(releaseManager.capabilityChecklist?.sourcePolicy),
      items: valueState(Array.isArray(releaseManager.capabilityChecklist?.items) ? releaseManager.capabilityChecklist.items : [])
    },
    finalEvidenceDraft: {
      state: valueState(releaseManager.finalEvidenceDraft?.state),
      evidenceRef: valueState(releaseManager.finalEvidenceDraft?.evidenceRef),
      suggestedTitle: valueState(releaseManager.finalEvidenceDraft?.suggestedTitle),
      blockerCount: valueState(releaseManager.finalEvidenceDraft?.blockerCount),
      sourceEventCount: valueState(releaseManager.finalEvidenceDraft?.sourceEventCount),
      releaseReadyDeclarationIncluded: valueState(releaseManager.finalEvidenceDraft?.releaseReadyDeclarationIncluded),
      requiredSections: valueState(Array.isArray(releaseManager.finalEvidenceDraft?.requiredSections) ? releaseManager.finalEvidenceDraft.requiredSections : []),
      note: valueState(releaseManager.finalEvidenceDraft?.note)
    },
    sourceSummary: {
      runtimeStatus: valueState(releaseManager.sourceSummary?.runtimeStatus),
      appStateContract: valueState(releaseManager.sourceSummary?.appStateContract),
      providerState: valueState(releaseManager.sourceSummary?.providerState),
      appDataDomainCount: valueState(releaseManager.sourceSummary?.appDataDomainCount),
      evidenceRefCount: valueState(releaseManager.sourceSummary?.evidenceRefCount),
      artifactEntryCount: valueState(releaseManager.sourceSummary?.artifactEntryCount),
      goalEventCount: valueState(releaseManager.sourceSummary?.goalEventCount)
    },
    boundaries: {
      readOnly: valueState(releaseManager.boundaries?.readOnly),
      writesEvidenceFile: valueState(releaseManager.boundaries?.writesEvidenceFile),
      emitsGoalEvent: valueState(releaseManager.boundaries?.emitsGoalEvent),
      closeoutExecutionAvailable: valueState(releaseManager.boundaries?.closeoutExecutionAvailable),
      releaseReadyDeclarationAvailable: valueState(releaseManager.boundaries?.releaseReadyDeclarationAvailable),
      releaseGateMutationAvailable: valueState(releaseManager.boundaries?.releaseGateMutationAvailable),
      shellExecutionAvailable: valueState(releaseManager.boundaries?.shellExecutionAvailable),
      modelInvocationAvailable: valueState(releaseManager.boundaries?.modelInvocationAvailable),
      arbitraryCommandExecutionAvailable: valueState(releaseManager.boundaries?.arbitraryCommandExecutionAvailable),
      gitWriteAvailable: valueState(releaseManager.boundaries?.gitWriteAvailable),
      mergeAvailable: valueState(releaseManager.boundaries?.mergeAvailable),
      pushAvailable: valueState(releaseManager.boundaries?.pushAvailable),
      tagAvailable: valueState(releaseManager.boundaries?.tagAvailable),
      publishAvailable: valueState(releaseManager.boundaries?.publishAvailable),
      selfApprovalAvailable: valueState(releaseManager.boundaries?.selfApprovalAvailable),
      frontendStatusInferenceAvailable: valueState(releaseManager.boundaries?.frontendStatusInferenceAvailable),
      statusSource: valueState(releaseManager.boundaries?.statusSource),
      evidencePolicy: valueState(releaseManager.boundaries?.evidencePolicy)
    },
    note: releaseManager.note ?? 'App Core Release Manager 收口 v34-v39 checklist 和 final evidence draft。'
  };
}

function projectBackupExport({ result, backupExport }) {
  if (backupExport === null || backupExport === undefined) {
    return {
      state: result?.ok === true ? 'empty' : 'unavailable',
      errorEnvelope: result?.errorEnvelope ?? null,
      contractName: valueState(undefined),
      contractVersion: valueState(undefined),
      generatedAt: valueState(undefined),
      readOnly: valueState(undefined),
      context: {},
      manifestHash: valueState(undefined),
      managedStateEntryCount: valueState(0),
      artifactRefCount: valueState(0),
      includedByteCount: valueState(0),
      managedStateEntries: valueState([]),
      artifactRefs: valueState([]),
      excludedRepoContent: valueState([]),
      note: 'Backup export manifest 未暴露 / 不可用。'
    };
  }

  const managedStateEntries = Array.isArray(backupExport.manifest?.managedStateEntries)
    ? backupExport.manifest.managedStateEntries
    : [];
  const artifactRefs = Array.isArray(backupExport.manifest?.artifactRefs)
    ? backupExport.manifest.artifactRefs
    : [];

  return {
    state: backupExport.manifest?.manifestHash ? 'available' : 'empty',
    errorEnvelope: result?.errorEnvelope ?? null,
    contractName: valueState(backupExport.contractName),
    contractVersion: valueState(backupExport.contractVersion),
    generatedAt: valueState(backupExport.generatedAt),
    readOnly: valueState(backupExport.readOnly),
    context: {
      goalId: valueState(backupExport.context?.goalId),
      resolvedGoalId: valueState(backupExport.context?.resolvedGoalId),
      taskId: valueState(backupExport.context?.taskId),
      exportRole: valueState(backupExport.context?.exportRole),
      canonicalArtifactSource: valueState(backupExport.context?.canonicalArtifactSource)
    },
    manifestHash: valueState(backupExport.manifest?.manifestHash),
    managedStateEntryCount: valueState(backupExport.manifest?.managedStateEntryCount ?? managedStateEntries.length),
    artifactRefCount: valueState(backupExport.manifest?.artifactRefCount ?? artifactRefs.length),
    includedByteCount: valueState(backupExport.manifest?.includedByteCount ?? 0),
    managedStateEntries: valueState(managedStateEntries),
    artifactRefs: valueState(artifactRefs),
    excludedRepoContent: valueState(Array.isArray(backupExport.manifest?.excludedRepoContent) ? backupExport.manifest.excludedRepoContent : []),
    boundaries: {
      readOnly: valueState(backupExport.boundaries?.readOnly),
      writesBundleFile: valueState(backupExport.boundaries?.writesBundleFile),
      copiesRepoContent: valueState(backupExport.boundaries?.copiesRepoContent),
      includesRepoSourcePayloads: valueState(backupExport.boundaries?.includesRepoSourcePayloads),
      arbitraryPathReadAvailable: valueState(backupExport.boundaries?.arbitraryPathReadAvailable),
      repoContentPolicy: valueState(backupExport.boundaries?.repoContentPolicy),
      exportPayloadPolicy: valueState(backupExport.boundaries?.exportPayloadPolicy)
    },
    note: 'Backup Export 只展示 app core state manifest、hash 和 refs。它不复制 repo source、docs、tests、.git 或 artifact 内容。'
  };
}

function projectRestoreValidation({ result, restoreValidation }) {
  if (restoreValidation === null || restoreValidation === undefined) {
    return {
      state: result?.ok === true ? 'empty' : 'unavailable',
      errorEnvelope: result?.errorEnvelope ?? null,
      contractName: valueState(undefined),
      contractVersion: valueState(undefined),
      generatedAt: valueState(undefined),
      readOnly: valueState(undefined),
      status: valueState(undefined),
      context: {},
      sourceBundle: {},
      integrity: {},
      compatibility: {
        blockers: valueState([]),
        warnings: valueState([])
      },
      boundaries: {},
      note: 'Restore validation 未暴露 / 不可用。'
    };
  }

  return {
    state: restoreValidation.status ?? 'available',
    errorEnvelope: result?.errorEnvelope ?? null,
    contractName: valueState(restoreValidation.contractName),
    contractVersion: valueState(restoreValidation.contractVersion),
    generatedAt: valueState(restoreValidation.generatedAt),
    readOnly: valueState(restoreValidation.readOnly),
    status: valueState(restoreValidation.status),
    context: {
      goalId: valueState(restoreValidation.context?.goalId),
      resolvedGoalId: valueState(restoreValidation.context?.resolvedGoalId),
      taskId: valueState(restoreValidation.context?.taskId),
      restoreRole: valueState(restoreValidation.context?.restoreRole),
      stateSource: valueState(restoreValidation.context?.stateSource)
    },
    sourceBundle: {
      contractName: valueState(restoreValidation.sourceBundle?.contractName),
      contractVersion: valueState(restoreValidation.sourceBundle?.contractVersion),
      manifestHash: valueState(restoreValidation.sourceBundle?.manifestHash),
      managedStateEntryCount: valueState(restoreValidation.sourceBundle?.managedStateEntryCount ?? 0),
      artifactRefCount: valueState(restoreValidation.sourceBundle?.artifactRefCount ?? 0),
      exportPayloadPolicy: valueState(restoreValidation.sourceBundle?.exportPayloadPolicy),
      repoContentPolicy: valueState(restoreValidation.sourceBundle?.repoContentPolicy)
    },
    integrity: {
      status: valueState(restoreValidation.integrity?.status),
      manifestHashValid: valueState(restoreValidation.integrity?.manifestHashValid),
      backupContractValid: valueState(restoreValidation.integrity?.backupContractValid),
      managedStateEntryCount: valueState(restoreValidation.integrity?.managedStateEntryCount ?? 0),
      presentManagedStateCount: valueState(restoreValidation.integrity?.presentManagedStateCount ?? 0),
      missingManagedStateRefs: valueState(Array.isArray(restoreValidation.integrity?.missingManagedStateRefs) ? restoreValidation.integrity.missingManagedStateRefs : []),
      artifactRefsValid: valueState(restoreValidation.integrity?.artifactRefsValid),
      checks: valueState(Array.isArray(restoreValidation.integrity?.checks) ? restoreValidation.integrity.checks : [])
    },
    compatibility: {
      status: valueState(restoreValidation.compatibility?.status),
      compatibleRestorePath: valueState(restoreValidation.compatibility?.compatibleRestorePath),
      overwriteDefault: valueState(restoreValidation.compatibility?.overwriteDefault),
      blockers: valueState(Array.isArray(restoreValidation.compatibility?.blockers) ? restoreValidation.compatibility.blockers : []),
      warnings: valueState(Array.isArray(restoreValidation.compatibility?.warnings) ? restoreValidation.compatibility.warnings : [])
    },
    boundaries: {
      readOnly: valueState(restoreValidation.boundaries?.readOnly),
      validationOnly: valueState(restoreValidation.boundaries?.validationOnly),
      confirmRestoreAvailable: valueState(restoreValidation.boundaries?.confirmRestoreAvailable),
      overwritesExistingData: valueState(restoreValidation.boundaries?.overwritesExistingData),
      writesManagedState: valueState(restoreValidation.boundaries?.writesManagedState),
      appliesRestore: valueState(restoreValidation.boundaries?.appliesRestore),
      arbitraryPathReadAvailable: valueState(restoreValidation.boundaries?.arbitraryPathReadAvailable),
      restorePayloadPolicy: valueState(restoreValidation.boundaries?.restorePayloadPolicy),
      restoreMode: valueState(restoreValidation.boundaries?.restoreMode)
    },
    note: 'Restore Validation 只校验 backup manifest integrity 和兼容恢复路径。默认不覆盖现有数据，不读取任意 bundle path，不执行 restore apply。'
  };
}

export const CONTRACT_TEXT = Object.freeze({
  missing: MISSING_TEXT,
  unavailable: UNAVAILABLE_TEXT,
  notApplicable: NOT_APPLICABLE_TEXT
});
