const CANONICAL_BLOCKED_MUTATION_FAMILIES = Object.freeze([
  'daemon-control',
  'provider-cli',
  'real-cli',
  'release-closeout',
  'git-tag'
]);

const DEFAULT_HEALTH = Object.freeze({
  state: 'healthy',
  observedOnly: true,
  daemonState: 'observed only',
  contextState: 'fresh',
  gateState: 'frontend baseline',
  duplicateDispatchAllowed: false,
  reason: 'local read-only sample'
});

export const SUPERVISOR_WORKBENCH_VIEW = Object.freeze({
  contractName: 'supervisor-dashboard-state.v46',
  contractVersion: 1,
  source: 'local-sample-fallback',
  routeSource: 'frontend/workbench/src/v46SupervisorWorkbench.jsx',
  goalId: 'v45-backend-entrypoint-decomposition',
  generatedAt: '2026-06-10T13:24:00+08:00',
  readOnly: true,
  willMutate: false,
  activeTask: 'v46 frontend baseline planning',
  activeRole: 'supervisor-monitor',
  health: DEFAULT_HEALTH,
  currentGate: Object.freeze({
    gate: 'frontend baseline',
    condition: 'OpenDesign focused-v2 handoff accepted as visual baseline',
    nextArtifact: 'v46 Workbench frontend runbook implementation slice'
  }),
  recommendedNextAction: Object.freeze({
    status: 'confirm-required',
    text: 'Draft v46 Workbench frontend runbook after OpenDesign exploration.'
  }),
  activeLease: Object.freeze({
    leaseId: 'lease-v46-ui-prototype-004',
    threadId: '019eb1-ui-prototype-claude-warm-v4',
    health: 'healthy'
  }),
  context: Object.freeze({
    utilizationPercent: 62,
    chips: Object.freeze([
      'focused-v2 handoff loaded',
      'static model',
      'no network reads',
      'copyOnly boundary'
    ])
  }),
  pendingResult: Object.freeze({
    label: 'none / NULL',
    output: null,
    contract: '[ EMPTY ]',
    reason: 'NULL'
  }),
  commandBoundary: Object.freeze({
    state: 'disabled',
    executionAvailable: false,
    copyOnly: true,
    blockedCommandFamilies: Object.freeze([
      'provider-cli',
      'real-cli',
      'child-dispatch',
      'event-log-write',
      'tag',
      'release-closeout'
    ]),
    blockedMutationFamilies: Object.freeze([
      ...CANONICAL_BLOCKED_MUTATION_FAMILIES
    ])
  }),
  timeline: Object.freeze([
    Object.freeze({
      index: '01',
      title: 'OpenDesign artifact received',
      copy: 'Focused v2 package defines the static supervisor workbench baseline and read-only constraints.'
    }),
    Object.freeze({
      index: '02',
      title: 'Preflight completed',
      copy: 'Repository commands, Vite entry point, and existing workbench supervisor route were inspected before implementation.'
    }),
    Object.freeze({
      index: '03',
      title: 'Static model attached',
      copy: 'The supervisor path now renders from an immutable local view model before any live state connection.'
    }),
    Object.freeze({
      index: '04',
      title: 'Next integration remains separate',
      copy: 'Real supervisor state can replace the local model after route contracts define the same fields.'
    })
  ]),
  ownership: Object.freeze([
    Object.freeze({
      name: 'daemon',
      responsibility: 'Owns background observation and lease projection outside the browser.'
    }),
    Object.freeze({
      name: 'controller',
      responsibility: 'Owns implementation sequencing, verification, and recovery decisions.'
    }),
    Object.freeze({
      name: 'supervisor-monitor',
      responsibility: 'Owns this read-only view and does not write state.'
    })
  ])
});

export function projectSupervisorDashboardToWorkbenchView(dashboard, routeState = null) {
  if (dashboard === null || typeof dashboard !== 'object') {
    return SUPERVISOR_WORKBENCH_VIEW;
  }

  if (isLiveSupervisorDashboard(dashboard, routeState) && !hasReadOnlySafety(dashboard)) {
    return rejectedLiveSupervisorView(dashboard, routeState);
  }

  const goalSnapshot = objectValue(dashboard.goalSnapshot);
  const currentGate = objectValue(dashboard.currentGate);
  const nextAction = objectValue(dashboard.recommendedNextAction);
  const activeLease = objectValue(dashboard.activeLease);
  const contextStatus = objectValue(dashboard.contextStatus);
  const pendingResult = objectValue(dashboard.pendingResult);
  const commandBoundary = objectValue(dashboard.commandBoundary);
  const ownership = objectValue(dashboard.ownership);
  const timeline = Array.isArray(dashboard.goalTimeline) ? dashboard.goalTimeline : [];

  return Object.freeze({
    contractName: 'supervisor-dashboard-state.v46',
    contractVersion: 1,
    source: textValue(dashboard.contractName ?? dashboard.sourceMode ?? dashboard.source ?? 'goal-supervisor-app-read-model.v1'),
    routeSource: textValue(routeState?.source ?? dashboard.route?.path ?? dashboard.source ?? 'goal supervisor route'),
    goalId: textValue(goalSnapshot.goalId ?? dashboard.goalId ?? SUPERVISOR_WORKBENCH_VIEW.goalId),
    generatedAt: textValue(dashboard.generatedAt ?? goalSnapshot.generatedAt ?? SUPERVISOR_WORKBENCH_VIEW.generatedAt),
    readOnly: true,
    willMutate: false,
    activeTask: textValue(goalSnapshot.activeTask ?? 'NULL'),
    activeRole: textValue(goalSnapshot.activeRole ?? ownership.orchestrationOwner ?? 'supervisor-monitor'),
    health: supervisorHealth(dashboard, activeLease, contextStatus, currentGate, ownership),
    currentGate: Object.freeze({
      gate: textValue(currentGate.gateId ?? currentGate.status ?? 'unknown'),
      condition: textValue(currentGate.blockingReason ?? currentGate.evidenceRequirement ?? routeState?.state ?? 'observed from supervisor read model'),
      nextArtifact: textValue(nextAction.label ?? nextAction.actionId ?? 'pendingResult.output')
    }),
    recommendedNextAction: Object.freeze({
      status: textValue(nextAction.state ?? nextAction.actionId ?? 'confirm-required'),
      text: textValue(nextAction.reason ?? nextAction.label ?? SUPERVISOR_WORKBENCH_VIEW.recommendedNextAction.text)
    }),
    activeLease: Object.freeze({
      leaseId: textValue(activeLease.leaseId ?? 'NULL'),
      threadId: textValue(activeLease.threadId ?? 'NULL'),
      health: textValue(activeLease.status ?? activeLease.phase ?? 'observed-only')
    }),
    context: Object.freeze({
      utilizationPercent: utilizationPercent(contextStatus.utilization),
      chips: Object.freeze(contextChips(contextStatus))
    }),
    pendingResult: Object.freeze({
      label: textValue(pendingResult.status ?? 'none / NULL'),
      output: null,
      contract: textValue(pendingResult.eventToRegister ?? pendingResult.evidenceRef ?? '[ EMPTY ]'),
      reason: textValue(pendingResult.parserReason ?? pendingResult.source ?? 'NULL')
    }),
    commandBoundary: commandBoundaryView(commandBoundary),
    timeline: Object.freeze(timeline.length > 0
      ? timeline.map((event, index) => Object.freeze({
        index: textValue(event.index ?? event.eventId ?? `T-${String(index + 1).padStart(2, '0')}`),
        title: textValue(event.status ?? event.title ?? 'observed event'),
        copy: textValue(event.evidenceRef ?? event.copy ?? event.timestamp ?? 'event projected from supervisor read model')
      }))
      : SUPERVISOR_WORKBENCH_VIEW.timeline),
    ownership: Object.freeze([
      Object.freeze({
        name: 'daemon',
        responsibility: textValue(ownership.daemonState ?? 'Owns background observation and lease projection outside the browser.')
      }),
      Object.freeze({
        name: 'controller',
        responsibility: textValue(ownership.deliveryBoundary ?? ownership.controllerInterventionReason ?? 'Owns implementation sequencing, verification, and recovery decisions.')
      }),
      Object.freeze({
        name: 'supervisor-monitor',
        responsibility: textValue(ownership.orchestrationOwner ?? 'Owns this read-only view and does not write state.')
      })
    ])
  });
}

function isLiveSupervisorDashboard(dashboard, routeState) {
  const apiPrefix = `/${'api'}`;

  return dashboard.sourceMode === 'live' || textValue(routeState?.source ?? '').startsWith(apiPrefix);
}

function hasReadOnlySafety(dashboard) {
  return dashboard.readOnly === true && dashboard.willMutate === false;
}

function rejectedLiveSupervisorView(dashboard, routeState) {
  const goalSnapshot = objectValue(dashboard.goalSnapshot);
  const activeLease = objectValue(dashboard.activeLease);

  return Object.freeze({
    ...SUPERVISOR_WORKBENCH_VIEW,
    source: textValue(dashboard.contractName ?? dashboard.source ?? 'goal-supervisor-app-read-model.v1'),
    routeSource: textValue(routeState?.source ?? dashboard.route?.path ?? dashboard.source ?? 'goal supervisor route'),
    goalId: textValue(goalSnapshot.goalId ?? dashboard.goalId ?? SUPERVISOR_WORKBENCH_VIEW.goalId),
    generatedAt: textValue(dashboard.generatedAt ?? goalSnapshot.generatedAt ?? SUPERVISOR_WORKBENCH_VIEW.generatedAt),
    activeTask: textValue(goalSnapshot.activeTask ?? 'NULL'),
    activeRole: textValue(goalSnapshot.activeRole ?? 'supervisor-monitor'),
    health: Object.freeze({
      state: 'blocked',
      observedOnly: true,
      daemonState: 'not accepted by UI adapter',
      contextState: 'unknown',
      gateState: 'safety contract failed',
      duplicateDispatchAllowed: false,
      reason: 'invalid live safety contract; readOnly must be true and willMutate must be false'
    }),
    currentGate: Object.freeze({
      gate: 'safety contract failed',
      condition: 'Live supervisor state did not satisfy the v46 read-only acceptance gate',
      nextArtifact: 'quarantined supervisor state evidence'
    }),
    recommendedNextAction: Object.freeze({
      status: 'blocked',
      text: 'Keep the supervisor workbench in local read-only fallback until the live state satisfies readOnly=true and willMutate=false.'
    }),
    activeLease: Object.freeze({
      leaseId: textValue(activeLease.leaseId ?? 'NULL'),
      threadId: textValue(activeLease.threadId ?? 'NULL'),
      health: 'not accepted'
    }),
    pendingResult: Object.freeze({
      label: 'invalid live safety contract',
      output: null,
      contract: '[ EMPTY ]',
      reason: 'readOnly/willMutate rejected'
    }),
    commandBoundary: defaultCommandBoundary()
  });
}

function objectValue(value) {
  return value !== null && typeof value === 'object' ? value : {};
}

function textValue(value) {
  if (value === null || value === undefined || value === '') {
    return 'NULL';
  }

  if (Array.isArray(value)) {
    return value.length === 0 ? '[ EMPTY ]' : value.join(', ');
  }

  return String(value);
}

function supervisorHealth(dashboard, activeLease, contextStatus, currentGate, ownership) {
  const activeLeaseStatus = textValue(activeLease.status ?? activeLease.phase ?? 'observed-only');
  const contextState = contextStateValue(contextStatus);
  const gateState = textValue(currentGate.status ?? currentGate.gateId ?? 'unknown');
  const state = healthStateValue({
    dashboard,
    activeLease,
    activeLeaseStatus,
    contextStatus,
    contextState,
    currentGate
  });

  return Object.freeze({
    state,
    observedOnly: true,
    daemonState: textValue(ownership.daemonState ?? dashboard.daemonState ?? 'observed only'),
    contextState,
    gateState,
    duplicateDispatchAllowed: false,
    reason: healthReasonValue({
      state,
      activeLeaseStatus,
      contextStatus,
      currentGate
    })
  });
}

function healthStateValue({ dashboard, activeLease, activeLeaseStatus, contextStatus, contextState, currentGate }) {
  if (currentGate.status === 'blocked') {
    return 'blocked';
  }

  if (objectValue(contextStatus.staleTranscriptState).stale === true || contextState === 'stale') {
    return 'stale';
  }

  if (objectValue(contextStatus.missingTranscriptState).missing === true || contextState === 'missing') {
    return 'missing';
  }

  if (['healthy', 'active', 'available'].includes(activeLeaseStatus) || activeLease.status === 'healthy') {
    return 'healthy';
  }

  if (dashboard.readOnly === true && dashboard.willMutate === false) {
    return 'observed-only';
  }

  return 'unknown';
}

function contextStateValue(contextStatus) {
  if (typeof contextStatus.state === 'string') {
    if (contextStatus.state === 'available') {
      return 'fresh';
    }

    return contextStatus.state;
  }

  if (objectValue(contextStatus.staleTranscriptState).stale === true) {
    return 'stale';
  }

  if (objectValue(contextStatus.missingTranscriptState).missing === true) {
    return 'missing';
  }

  return 'unknown';
}

function healthReasonValue({ state, activeLeaseStatus, contextStatus, currentGate }) {
  if (currentGate.blockingReason) {
    return textValue(currentGate.blockingReason);
  }

  const staleReason = objectValue(contextStatus.staleTranscriptState).reason;
  if (staleReason) {
    return textValue(staleReason);
  }

  const missingReason = objectValue(contextStatus.missingTranscriptState).reason;
  if (missingReason) {
    return textValue(missingReason);
  }

  return `observed-only / ${state}; active lease ${activeLeaseStatus}`;
}

function healthLabel(health) {
  if (health === null || typeof health !== 'object') {
    return textValue(health);
  }

  return health.observedOnly === true ? `observed-only / ${textValue(health.state)}` : textValue(health.state);
}

function utilizationPercent(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.min(100, value));
  }

  const parsed = Number.parseInt(String(value ?? ''), 10);

  return Number.isFinite(parsed) ? Math.max(0, Math.min(100, parsed)) : 0;
}

function contextChips(contextStatus) {
  const chips = [
    contextStatus.state,
    contextStatus.transcriptAvailability,
    contextStatus.tokenUsage
  ].filter((value) => value !== null && value !== undefined && value !== '');

  return chips.length > 0 ? chips.map(textValue) : ['missing contract field: contextStatus.providerSummaries'];
}

function commandBoundaryView(commandBoundary) {
  const rawFamilies = rawBoundaryFamilies(commandBoundary);

  return Object.freeze({
    state: textValue(commandBoundary.state ?? 'disabled'),
    executionAvailable: false,
    copyOnly: true,
    blockedCommandFamilies: Object.freeze(rawFamilies),
    blockedMutationFamilies: Object.freeze(canonicalBoundaryFamilies(rawFamilies))
  });
}

function defaultCommandBoundary() {
  return Object.freeze({
    state: 'disabled',
    executionAvailable: false,
    copyOnly: true,
    blockedCommandFamilies: Object.freeze([]),
    blockedMutationFamilies: Object.freeze([...CANONICAL_BLOCKED_MUTATION_FAMILIES])
  });
}

function rawBoundaryFamilies(commandBoundary) {
  const blockedFamilies = Array.isArray(commandBoundary.blockedMutationFamilies)
    ? commandBoundary.blockedMutationFamilies
    : Array.isArray(commandBoundary.blockedCommandFamilies)
      ? commandBoundary.blockedCommandFamilies
      : Array.isArray(commandBoundary.blockedFamilies)
        ? commandBoundary.blockedFamilies
        : [];

  return uniqueTextValues(blockedFamilies);
}

function canonicalBoundaryFamilies(rawFamilies) {
  const mapped = rawFamilies
    .map(canonicalBoundaryFamily)
    .filter((family) => family !== null);
  const canonical = uniqueTextValues([
    ...mapped,
    ...CANONICAL_BLOCKED_MUTATION_FAMILIES
  ]);

  return CANONICAL_BLOCKED_MUTATION_FAMILIES.filter((family) => canonical.includes(family));
}

function canonicalBoundaryFamily(family) {
  const text = textValue(family).toLowerCase().replace(/_/gu, '-');
  const compact = text.replace(/\s+/gu, '-').replace(/^blocked-/u, '');

  if ([
    'daemon-control',
    'daemon-launch',
    'child-dispatch',
    'goal-ledger-write',
    'event-log-write',
    'event-registration',
    'mutation-gate',
    'audit'
  ].includes(compact)) {
    return 'daemon-control';
  }

  if (['provider-cli', 'provider-cli-control'].includes(compact)) {
    return 'provider-cli';
  }

  if (['real-cli', 'generic-shell', 'shell'].includes(compact)) {
    return 'real-cli';
  }

  if ([
    'release-closeout',
    'release-closeout-blocked',
    'push-release',
    'publish-release',
    'github-release',
    'publish',
    'closeout'
  ].includes(compact)) {
    return 'release-closeout';
  }

  if (['tag', 'git-tag'].includes(compact)) {
    return 'git-tag';
  }

  return null;
}

function uniqueTextValues(values) {
  return [...new Set(values.map(textValue).filter((value) => value !== 'NULL' && value !== '[ EMPTY ]'))];
}

function contractLabel(view) {
  const version = view.contractVersion === null || view.contractVersion === undefined
    ? 'unknown'
    : view.contractVersion;

  return version === 'unknown' ? view.contractName : `${view.contractName} / ${version}`;
}

function routeSourceLabel(view) {
  const routeSource = textValue(view.routeSource);
  const apiPrefix = `/${'api'}`;

  return routeSource.startsWith(apiPrefix) ? `source: ${routeSource}` : routeSource;
}

function sourceSummary(view) {
  return view.source;
}

function commandBoundarySummary(boundary) {
  if (boundary.executionAvailable === false && boundary.copyOnly === true) {
    return 'execution unavailable; copyOnly true';
  }

  return 'copyOnly true';
}

const SIDEBAR_ITEMS = Object.freeze([
  Object.freeze({ label: 'Overview', tone: 'selected' }),
  Object.freeze({ label: 'Active Lease', tone: 'observed' }),
  Object.freeze({ label: 'Current Gate', tone: 'neutral' }),
  Object.freeze({ label: 'Command Boundary', tone: 'warn' }),
  Object.freeze({ label: 'Context Status', tone: 'neutral' }),
  Object.freeze({ label: 'Timeline', tone: 'neutral' }),
  Object.freeze({ label: 'Ownership', tone: 'neutral' })
]);

export function SupervisorShell({ view = SUPERVISOR_WORKBENCH_VIEW }) {
  return (
    <main className="v46-supervisor-shell" aria-labelledby="v46-supervisor-title">
      <SupervisorSidebar items={SIDEBAR_ITEMS} />
      <section className="v46-supervisor-workspace" aria-label="Workbench Supervisor Dashboard">
        <StatusHeader view={view} />
        <div className="v46-dashboard-grid">
          <GoalSnapshotPanel view={view} />
          <ActiveLeasePanel lease={view.activeLease} />
          <CurrentGatePanel gate={view.currentGate} />
          <RecommendedNextActionBand action={view.recommendedNextAction} />
          <ContextStatusPanel context={view.context} />
          <CommandBoundaryPanel boundary={view.commandBoundary} />
          <PendingResultPanel pendingResult={view.pendingResult} />
          <GoalTimelinePanel timeline={view.timeline} />
          <OwnershipPanel ownership={view.ownership} />
        </div>
      </section>
    </main>
  );
}

export function SupervisorSidebar({ items }) {
  return (
    <aside className="v46-sidebar" data-od-id="sidebar" aria-label="Supervisor sections">
      <div className="v46-sidebar-head">
        <strong>Workbench</strong>
        <span>supervisor monitor</span>
      </div>
      <div className="v46-sidebar-list">
        {items.map((item) => (
          <div key={item.label} className={`v46-sidebar-item ${item.tone}`}>
            <span className="v46-sidebar-icon" aria-hidden="true">
              <SidebarIcon label={item.label} />
            </span>
            <span className="v46-sidebar-label">{item.label}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}

function SidebarIcon({ label }) {
  if (label === 'Overview') {
    return (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3.5" y="3.5" width="7" height="7" />
        <rect x="13.5" y="3.5" width="7" height="7" />
        <rect x="3.5" y="13.5" width="7" height="7" />
        <rect x="13.5" y="13.5" width="7" height="7" />
      </svg>
    );
  }

  if (label === 'Active Lease') {
    return (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3.2 19 6v5.5c0 4.4-2.8 7.5-7 9.3-4.2-1.8-7-4.9-7-9.3V6l7-2.8Z" />
        <path d="m8.8 12.1 2.1 2.1 4.4-5" />
      </svg>
    );
  }

  if (label === 'Current Gate') {
    return (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 21V4" />
        <path d="M5 5h12l-2 4 2 4H5" />
      </svg>
    );
  }

  if (label === 'Command Boundary') {
    return (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 7H5v10h2" />
        <path d="M17 7h2v10h-2" />
        <path d="M10 12h4" />
        <path d="M12 9v6" />
      </svg>
    );
  }

  if (label === 'Context Status') {
    return (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.5 18a7.5 7.5 0 1 1 15 0" />
        <path d="m12 14 4-4" />
        <path d="M8 18h8" />
      </svg>
    );
  }

  if (label === 'Timeline') {
    return (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7.5V12l3 2" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="3" />
      <circle cx="16" cy="8" r="3" />
      <path d="M3.8 19c.7-3 2.3-4.5 4.2-4.5s3.5 1.5 4.2 4.5" />
      <path d="M11.8 19c.7-3 2.3-4.5 4.2-4.5s3.5 1.5 4.2 4.5" />
    </svg>
  );
}

export function StatusHeader({ view }) {
  return (
    <header className="v46-status-header" data-od-id="status-header">
      <div className="v46-goal-line">
        <span>Goal ID:</span>
        <h1 id="v46-supervisor-title">{view.goalId}</h1>
      </div>
      <dl className="v46-status-chips">
        <StatusChip label="generated" value={view.generatedAt} />
        <StatusChip label="readOnly" value={String(view.readOnly)} />
        <StatusChip label="willMutate" value={String(view.willMutate)} />
        <StatusChip label="role" value={view.activeRole} />
        <StatusChip label="contract" value={contractLabel(view)} />
        <StatusChip label="health" value={healthLabel(view.health)} />
      </dl>
    </header>
  );
}

function StatusChip({ label, value }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export function GoalSnapshotPanel({ view }) {
  return (
    <Panel className="v46-goal-panel" odId="goal-snapshot" title="Goal Snapshot" meta={sourceSummary(view)}>
      <KeyValues rows={[
        ['active task', view.activeTask],
        ['goal id', view.goalId],
        ['mutation', view.willMutate === false ? 'disabled by supervisor boundary' : 'unknown']
      ]} />
    </Panel>
  );
}

export function ActiveLeasePanel({ lease }) {
  return (
    <Panel className="v46-lease-panel" odId="active-lease" title="Active Lease" meta={lease.health}>
      <div className="v46-lease-id">{lease.leaseId}</div>
      <KeyValues rows={[
        ['thread id', lease.threadId],
        ['lease health', lease.health],
        ['telemetry', 'strong active lease observed']
      ]} />
    </Panel>
  );
}

export function CurrentGatePanel({ gate }) {
  return (
    <Panel className="v46-gate-panel" odId="current-gate" title="Current Gate" meta={gate.gate}>
      <KeyValues rows={[
        ['gate', gate.gate],
        ['condition', gate.condition],
        ['next artifact', gate.nextArtifact]
      ]} />
    </Panel>
  );
}

export function RecommendedNextActionBand({ action }) {
  return (
    <section className="v46-recommended-band" data-od-id="recommended-next-action" aria-label="Recommended Next Action">
      <div>
        <span>{action.status}</span>
        <h2>Recommended Next Action</h2>
      </div>
      <p>{action.text}</p>
    </section>
  );
}

export function ContextStatusPanel({ context }) {
  return (
    <Panel className="v46-context-panel" odId="context-status" title="Context Status" meta={`${context.utilizationPercent}%`}>
      <div className="v46-meter" aria-label={`Context utilization ${context.utilizationPercent}%`}>
        <span style={{ width: `${context.utilizationPercent}%` }} />
      </div>
      <ul className="v46-chip-list">
        {context.chips.map((chip) => (
          <li key={chip}>{chip}</li>
        ))}
      </ul>
    </Panel>
  );
}

export function PendingResultPanel({ pendingResult }) {
  return (
    <Panel className="v46-pending-panel" odId="pending-result" title="Pending Result" meta={pendingResult.label}>
      <KeyValues rows={[
        ['label', pendingResult.label],
        ['pendingResult.output', pendingResult.output === null ? 'NULL' : pendingResult.output],
        ['contract', pendingResult.contract],
        ['reason', pendingResult.reason]
      ]} />
    </Panel>
  );
}

export function CommandBoundaryPanel({ boundary }) {
  return (
    <Panel className="v46-command-panel" odId="command-boundary" title="Command Boundary" meta="copyOnly">
      <div className="v46-boundary-line" aria-hidden="true" />
      <KeyValues rows={[
        ['boundary state', commandBoundarySummary(boundary)],
        ['executionAvailable', String(boundary.executionAvailable)],
        ['copyOnly', String(boundary.copyOnly)]
      ]} />
      <ul className="v46-family-list">
        {boundary.blockedMutationFamilies.map((family) => (
          <li key={family}>{family}</li>
        ))}
      </ul>
    </Panel>
  );
}

export function GoalTimelinePanel({ timeline }) {
  return (
    <Panel className="v46-timeline-panel" odId="goal-timeline" title="Goal Timeline" meta="expanded">
      <ol className="v46-timeline">
        {timeline.map((event) => (
          <li key={event.index}>
            <span>{event.index}</span>
            <div>
              <h3>{event.title}</h3>
              <p>{event.copy}</p>
            </div>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

export function OwnershipPanel({ ownership }) {
  return (
    <Panel className="v46-ownership-panel" odId="ownership" title="Ownership" meta="responsibility split">
      <div className="v46-owner-grid">
        {ownership.map((owner) => (
          <article key={owner.name}>
            <h3>{owner.name}</h3>
            <p>{owner.responsibility}</p>
          </article>
        ))}
      </div>
    </Panel>
  );
}

function Panel({ className, odId, title, meta, children }) {
  return (
    <section className={`v46-panel ${className}`} data-od-id={odId} aria-label={title}>
      <header>
        <h2>{title}</h2>
        <span>{meta}</span>
      </header>
      {children}
    </section>
  );
}

function KeyValues({ rows }) {
  return (
    <dl className="v46-key-values">
      {rows.map(([key, value]) => (
        <div key={key}>
          <dt>{key}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
