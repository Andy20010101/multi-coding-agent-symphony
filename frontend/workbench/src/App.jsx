import { useEffect, useState } from 'react';

import {
  confirmControlledAdoptionPlan,
  confirmControlledAdoptionPlanFreeze,
  confirmControlledImplementationRunPlan,
  confirmControlledVerificationRun,
  confirmGoalEventPlan,
  fetchAdoptionInspection,
  fetchGoalEventPlanPreview,
  fetchPromptWorkspaceHandoffBoard,
  fetchPromptWorkspacePromptPack,
  fetchPromptWorkspaceRunbook,
  fetchWorkbenchContracts
} from './api/client.js';

const initialState = {
  phase: 'loading',
  model: null
};
const GOAL_EVENT_PLAN_PREVIEW_PATH_TEMPLATE = '/api/goals/<goal-id>/event-plan-preview';
const GOAL_EVENT_PLAN_CONFIRM_PATH_TEMPLATE = '/api/goals/<goal-id>/event-plan-confirm';
const GOAL_OPERATION_POLL_INTERVAL_MS = 2500;
const WORKBENCH_NAV_ITEMS = Object.freeze([
  Object.freeze({ id: 'active-goal', label: 'Active Goal', targetId: 'active-goal-runbook-panel' }),
  Object.freeze({ id: 'prompt-handoff', label: 'Prompt Handoff', route: '/workbench/prompts/' }),
  Object.freeze({ id: 'operations', label: 'Operations', targetId: 'goal-operation-console-panel' }),
  Object.freeze({ id: 'implementation', label: 'Implementation', targetId: 'next-action-card-panel' }),
  Object.freeze({ id: 'adoption', label: 'Adoption', targetId: 'adoption-candidate-panel' }),
  Object.freeze({ id: 'review', label: 'Review', targetId: 'review-workspace-panel' }),
  Object.freeze({ id: 'verification', label: 'Verification', targetId: 'main-verification-readiness-panel' }),
  Object.freeze({ id: 'release', label: 'Release', targetId: 'closeout-gaps-panel' }),
  Object.freeze({ id: 'closeout', label: 'Closeout', targetId: 'closeout-gaps-panel' })
]);

export default function App() {
  const [viewState, setViewState] = useState(initialState);

  async function refreshWorkbenchContracts() {
    setViewState((current) => ({
      phase: 'loading',
      model: current.model
    }));

    try {
      const model = await fetchWorkbenchContracts();

      setViewState({
        phase: 'ready',
        model
      });
    } catch {
      setViewState({
        phase: 'failed',
        model: null
      });
    }
  }

  useEffect(() => {
    let cancelled = false;

    fetchWorkbenchContracts().then((model) => {
      if (!cancelled) {
        setViewState({
          phase: 'ready',
          model
        });
      }
    }).catch(() => {
      if (!cancelled) {
        setViewState({
          phase: 'failed',
          model: null
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (goalOperationPollingEnabled(viewState.model) !== true) {
      return undefined;
    }

    let cancelled = false;
    let requestInFlight = false;

    async function pollGoalOperationConsole() {
      if (requestInFlight) {
        return;
      }

      requestInFlight = true;

      try {
        const model = await fetchWorkbenchContracts();

        if (!cancelled) {
          setViewState({
            phase: 'ready',
            model
          });
        }
      } catch {
        if (!cancelled) {
          setViewState((current) => ({
            phase: current.model === null ? 'failed' : 'ready',
            model: current.model
          }));
        }
      } finally {
        requestInFlight = false;
      }
    }

    const timerId = window.setInterval(pollGoalOperationConsole, GOAL_OPERATION_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(timerId);
    };
  }, [viewState.model?.activeGoal?.operationConsole?.polling?.enabled?.value]);

  return (
    <WorkbenchShell
      viewState={viewState}
      onRefreshWorkbenchContracts={refreshWorkbenchContracts}
    />
  );
}

export function WorkbenchShell({
  viewState,
  onRefreshWorkbenchContracts = () => undefined
}) {
  const model = viewState.model;
  const routeCounts = routeStateCounts(model?.routeStates ?? []);
  const workbenchRoute = currentWorkbenchRoute();
  const routeContext = model?.routeContext ?? null;
  const stateHeader = buildWorkbenchStateHeader({
    model,
    phase: viewState.phase,
    routeCounts,
    routeContext
  });

  return (
    <main className="workbench-shell" aria-labelledby="workbench-title">
      <header className="workbench-header">
        <div className="header-copy">
          <p className="eyebrow">v28 Workbench v1</p>
          <h1 id="workbench-title">Symphony Workbench</h1>
          <p className="header-summary">
            围绕 active goal、next action、prompt handoff、event registration、review、verification 和 closeout 展开。
            顶层路径使用 goal-status、goal next、goal prompt、goal update/review/gate、goal closeout 和 scoped operations contracts。
          </p>
        </div>
        <div className="status-strip" aria-label="当前只读状态">
          <span>{phaseText(viewState.phase)}</span>
          <span>{routeCounts.ready}/{routeCounts.total} routes 已读取</span>
          <span>confirm 后会刷新 goal-status / events / next action</span>
        </div>
      </header>

      <WorkbenchStateHeader header={stateHeader} />
      <WorkbenchNavigation currentRoute={workbenchRoute} routeContext={routeContext} />
      <WorkbenchRouteContextBar context={routeContext} />

      {viewState.phase === 'loading' ? <ShellState title="读取中" copy="正在读取 summary、readiness、runs 与 latest run 只读 contract。" /> : null}
      {viewState.phase === 'failed' ? <ShellState title="读取失败" copy="错误摘要：只读 contract 未暴露或不可用。刷新页面后会重新读取只读 API。" /> : null}

      {model === null ? null : (
        workbenchRoute === 'prompts' ? (
          <PromptWorkspaceRoute
            model={model}
            routeContext={routeContext}
            onWorkbenchContextChanged={onRefreshWorkbenchContracts}
          />
        ) : (
          <>
          <section className="golden-path-grid" aria-label="v28 golden path">
            <GoldenPathPanel goldenPath={model.goldenPath} />
          </section>

          <section className="primary-active-goal-grid" aria-label="v20 primary active goal workflow">
            <ActiveGoalRunbookPanel
              runbook={model.activeGoal.runbook}
              route={findRoute(model.routeStates, 'goalRunbook')}
              progressRoute={findRoute(model.routeStates, 'activeGoalProgress')}
              eventsRoute={findRoute(model.routeStates, 'activeGoalEvents')}
            />
            <ActiveGoalTaskQueuePanel
              taskQueue={model.activeGoal.taskQueue}
              route={findRoute(model.routeStates, 'goalRunbook')}
              progressRoute={findRoute(model.routeStates, 'activeGoalProgress')}
              eventsRoute={findRoute(model.routeStates, 'activeGoalEvents')}
              nextRoute={findRoute(model.routeStates, 'goalNextAction')}
            />
          </section>

          <section className="implementation-eligibility-grid" aria-label="v29 active task implementation eligibility">
            <ActiveTaskImplementationEligibilityPanel eligibility={model.activeGoal.activeTaskImplementationEligibility} />
          </section>

          <section className="implementation-plan-preview-grid" aria-label="v29 controlled implementation plan preview">
            <ControlledImplementationPlanPreviewPanel
              preview={model.activeGoal.controlledImplementationPlanPreview}
              onControlledImplementationConfirmed={onRefreshWorkbenchContracts}
            />
          </section>

          <section className="main-verification-readiness-grid" aria-label="v24 main verification readiness">
            <MainVerificationReadinessPanel
              readiness={model.activeGoal.mainVerificationReadiness}
              onVerificationRunConfirmed={onRefreshWorkbenchContracts}
            />
            <MainVerificationEvidenceDraftPanel draft={model.activeGoal.mainVerificationEvidenceDraft} />
            <MainVerificationGateRegistrationPanel
              registration={model.activeGoal.mainVerificationGateRegistration}
              onGoalEventConfirmed={onRefreshWorkbenchContracts}
            />
          </section>

          <section className="adoption-candidate-grid" aria-label="v30 adoption candidate normalization">
            <AdoptionCandidatePanel candidates={model.adoptionCandidates} />
          </section>

          <section className="adoption-plan-preview-grid" aria-label="v30 adoption plan preview workspace">
            <AdoptionPlanPreviewWorkspacePanel
              workspace={model.adoptionPlanPreviewWorkspace}
              onAdoptionPlanFrozen={onRefreshWorkbenchContracts}
            />
          </section>

          <section className="adoption-inspect-grid" aria-label="v30 adoption inspect and recovery view">
            <AdoptionInspectRecoveryPanel
              workspace={model.adoptionInspectRecoveryWorkspace}
              onAdoptionConfirmed={onRefreshWorkbenchContracts}
            />
          </section>

          <section className="active-goal-grid" aria-label="v20 Active Goal supporting contracts">
            <NextActionCard
              nextAction={model.activeGoal.nextAction}
              route={findRoute(model.routeStates, 'goalNextAction')}
              onGoalEventConfirmed={onRefreshWorkbenchContracts}
            />
            <PromptPreviewDrawer promptPreview={model.activeGoal.promptPreview} route={findRoute(model.routeStates, 'goalPromptPack')} />
            <ReviewWorkspacePanel
              workspace={model.activeGoal.reviewWorkspace}
              onGoalEventConfirmed={onRefreshWorkbenchContracts}
            />
            <ActiveGoalViewModelPanel viewModel={model.activeGoal.viewModel} />
            <CloseoutGapsPanel
              closeoutGaps={model.activeGoal.closeoutGaps}
              route={findRoute(model.routeStates, 'goalCloseout')}
              onGoalEventConfirmed={onRefreshWorkbenchContracts}
            />
            <GoalOperationConsolePanel
              operationConsole={model.activeGoal.operationConsole}
              route={findRoute(model.routeStates, 'activeGoalOperations')}
            />
          </section>

          <section className="panel-grid" aria-label="Workbench 只读 panels">
            <SummaryPanel summary={model.summary} route={findRoute(model.routeStates, 'summary')} />
            <ReadinessPanel readiness={model.readiness} route={findRoute(model.routeStates, 'readiness')} />
            <RunsPanel runs={model.runs} route={findRoute(model.routeStates, 'runs')} />
            <LatestRunPanel latestRun={model.latestRun} route={findRoute(model.routeStates, 'latestRun')} />
          </section>

          <section className="detail-grid" aria-label="Task 7 只读扩展 panels">
            <TimelinePanel timeline={model.latestRunTimeline} route={findRoute(model.routeStates, 'latestRunTimeline')} />
            <ArtifactListPanel artifactRefs={model.artifactRefs} />
            <AdoptionSummaryPanel adoption={model.adoption} />
          </section>

          <section className="handoff-grid" aria-label="v16 handoff 只读 panel">
            <HandoffPanel
              handoff={model.handoff}
              indexRoute={findRoute(model.routeStates, 'handoffRefs')}
              route={findRoute(model.routeStates, 'guidedGoalHandoff')}
            />
          </section>

          <section className="goal-grid" aria-label="v17 goal progress 与 console contract panels">
            <GoalProgressPanel progress={model.goalProgress} route={findRoute(model.routeStates, 'goalProgress')} />
            <CapabilitiesPanel capabilities={model.capabilities} route={findRoute(model.routeStates, 'capabilities')} />
            <DiagnosticsV1Panel diagnostics={model.diagnosticsV1} route={findRoute(model.routeStates, 'diagnostics')} />
          </section>

          <section className="event-grid" aria-label="v18 goal events 只读 panels">
            <GoalEventsTimelinePanel events={model.goalEvents} route={findRoute(model.routeStates, 'goalEvents')} />
            <EvidenceMatrixPanel matrix={model.goalEvents.evidenceMatrix} route={findRoute(model.routeStates, 'goalEvents')} />
          </section>

          <section className="support-grid" aria-label="只读 contract 支撑信息">
            <RoutePanel routes={model.routeStates} />
            <ContractGapPanel gaps={model.deferredGaps} />
          </section>
          </>
        )
      )}
    </main>
  );
}

function GoldenPathPanel({ goldenPath }) {
  return (
    <DataPanel
      id="golden-path-panel"
      kicker="v28 acceptance path"
      title="Golden Path"
      state={goldenPath?.state ?? 'missing'}
    >
      <FieldList rows={[
        ['goalId', goldenPath?.goalId],
        ['taskId', goldenPath?.taskId],
        ['role', goldenPath?.role],
        ['step count', goldenPath?.steps?.count],
        ['source policy', goldenPath?.sourcePolicy],
        ['copyOnlyCommands', goldenPath?.safety?.copyOnlyCommands],
        ['controlledConfirmOnly', goldenPath?.safety?.controlledConfirmOnly],
        ['browserExecutionAvailable', goldenPath?.safety?.browserExecutionAvailable],
        ['genericShellRunner', goldenPath?.safety?.genericShellRunner],
        ['workerCanApproveOwnTask', goldenPath?.safety?.workerCanApproveOwnTask],
        ['infersReadinessFromFilename', goldenPath?.safety?.infersReadinessFromFilename]
      ]} />

      <Subsection title="goal init/status -> closeout gaps">
        <GoldenPathStepList steps={goldenPath?.steps} />
      </Subsection>

      <p className="panel-note">{goldenPath?.note ?? 'Golden Path is unavailable until active goal contracts load.'}</p>
    </DataPanel>
  );
}

function GoldenPathStepList({ steps }) {
  const items = steps?.items ?? [];

  if (items.length === 0) {
    return <EmptyBlock copy="Golden Path steps 未暴露。" />;
  }

  return (
    <ol className="golden-path-step-list">
      {items.map((step) => (
        <li key={step.id.text}>
          <div className="run-row-header">
            <h3>{step.label.text}</h3>
            <span className="state-pill">{step.status.text}</span>
          </div>
          <FieldList rows={[
            ['source', step.source],
            ['route', step.route],
            ['routeState', step.routeState],
            ['detail', step.detail]
          ]} />
          <pre><code>{step.command.text}</code></pre>
        </li>
      ))}
    </ol>
  );
}

function WorkbenchStateHeader({ header }) {
  return (
    <section className="workbench-state-header" aria-label="Workbench goal state header">
      <div className="state-header-main">
        <p className="section-kicker">goal contracts</p>
        <h2>Current Workbench State</h2>
      </div>
      <dl className="state-header-grid">
        {header.items.map((item) => (
          <div key={item.id} className="state-header-item">
            <dt>{item.label}</dt>
            <dd>{item.value}</dd>
            <span>{item.source}</span>
          </div>
        ))}
      </dl>
    </section>
  );
}

function WorkbenchNavigation({ currentRoute, routeContext }) {
  return (
    <nav className="workbench-nav" aria-label="Workbench v1 sections">
      <ul>
        {WORKBENCH_NAV_ITEMS.map((item) => (
          <li key={item.id}>
            <a
              className={workbenchNavItemClassName(item, currentRoute)}
              href={workbenchNavHref(item, routeContext)}
              aria-current={workbenchNavItemActive(item, currentRoute) ? 'page' : undefined}
            >
              <span>{item.label}</span>
              <code>{workbenchNavHref(item, routeContext)}</code>
            </a>
          </li>
        ))}
      </ul>
      <p className="panel-note">Navigation follows the latest goal/runbook/next-action workflow. It is not the v8 scan/do/review/verify/status/continue/artifacts command surface.</p>
    </nav>
  );
}

function WorkbenchRouteContextBar({ context }) {
  const evidenceRefs = context?.evidenceRefs?.items ?? [];

  return (
    <section className="workbench-route-context" aria-label="Unified Workbench route context">
      <div>
        <p className="section-kicker">route context</p>
        <h2>Goal / Task / Run / Evidence Context</h2>
      </div>
      <FieldList rows={[
        ['goalId', context?.goalId],
        ['taskId', context?.taskId],
        ['operationId', context?.operationId],
        ['runId', context?.runId],
        ['evidence refs', textValue(evidenceRefs.map((item) => item.ref.text).join('、') || '未暴露')],
        ['source policy', context?.sourcePolicy]
      ]} />
      <Subsection title="evidence refs">
        <WorkbenchRouteEvidenceList evidenceRefs={context?.evidenceRefs} />
      </Subsection>
      <p className="panel-note">{context?.note ?? 'Route context unavailable.'}</p>
    </section>
  );
}

function WorkbenchRouteEvidenceList({ evidenceRefs }) {
  if (evidenceRefs?.state !== 'available') {
    return <EmptyBlock copy="当前 context 没有 evidence refs。" />;
  }

  return (
    <ul className="workbench-context-evidence-list">
      {evidenceRefs.items.map((item, index) => (
        <li key={`${item.ref.text}-${index}`}>
          <FieldList rows={[
            ['ref', item.ref],
            ['kind', item.kind],
            ['taskId', item.taskId],
            ['label', item.label],
            ['source', item.source]
          ]} />
        </li>
      ))}
    </ul>
  );
}

function PromptWorkspaceRoute({
  model,
  routeContext,
  onWorkbenchContextChanged = () => undefined
}) {
  const goalOptions = promptWorkspaceGoalOptions(model);
  const routeSelection = promptWorkspaceRouteSelection(routeContext);
  const initialGoalId = promptWorkspaceInitialGoalId(model, goalOptions, routeSelection.goalId);
  const [selectedGoalId, setSelectedGoalId] = useState(initialGoalId);
  const [selectedRole, setSelectedRole] = useState(routeSelection.role);
  const [selectedTaskId, setSelectedTaskId] = useState(routeSelection.taskId);
  const [runbookState, setRunbookState] = useState({
    phase: initialGoalId === '' ? 'empty' : 'loading',
    runbook: null,
    error: null,
    route: null
  });
  const [promptState, setPromptState] = useState({
    phase: 'idle',
    promptPack: null,
    error: null,
    route: null
  });
  const [handoffState, setHandoffState] = useState({
    phase: initialGoalId === '' ? 'empty' : 'loading',
    board: null,
    error: null
  });
  const [handoffRefreshToken, setHandoffRefreshToken] = useState(0);

  useEffect(() => {
    if (selectedGoalId === '') {
      setRunbookState({
        phase: 'empty',
        runbook: null,
        error: null,
        route: null
      });
      return;
    }

    let cancelled = false;

    setRunbookState({
      phase: 'loading',
      runbook: null,
      error: null,
      route: null
    });

    fetchPromptWorkspaceRunbook(selectedGoalId).then((result) => {
      if (cancelled) {
        return;
      }

      if (result.ok) {
        setRunbookState({
          phase: 'ready',
          runbook: result.data,
          error: null,
          route: result.route
        });
        return;
      }

      setRunbookState({
        phase: 'failed',
        runbook: null,
        error: promptWorkspaceErrorText(result),
        route: result.route
      });
    });

    return () => {
      cancelled = true;
    };
  }, [selectedGoalId]);

  useEffect(() => {
    if (selectedGoalId === '') {
      setHandoffState({
        phase: 'empty',
        board: null,
        error: null
      });
      return;
    }

    let cancelled = false;

    setHandoffState({
      phase: 'loading',
      board: null,
      error: null
    });

    fetchPromptWorkspaceHandoffBoard(selectedGoalId).then((result) => {
      if (cancelled) {
        return;
      }

      setHandoffState({
        phase: result.ok ? 'ready' : 'partial',
        board: result.board,
        error: result.ok ? null : 'handoff source route 未全部 ready'
      });
    }).catch(() => {
      if (!cancelled) {
        setHandoffState({
          phase: 'failed',
          board: null,
          error: 'handoff source route 不可用'
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [selectedGoalId, handoffRefreshToken]);

  const taskOptions = promptWorkspaceTaskOptions(runbookState.runbook, selectedRole);

  useEffect(() => {
    if (runbookState.phase !== 'ready') {
      return;
    }

    if (taskOptions.length === 0) {
      if (selectedTaskId !== '') {
        setSelectedTaskId('');
      }
      return;
    }

    if (!taskOptions.some((task) => task.taskId === selectedTaskId)) {
      setSelectedTaskId(taskOptions[0].taskId);
    }
  }, [runbookState.phase, selectedTaskId, taskOptions]);

  useEffect(() => {
    if (selectedGoalId === '' || selectedTaskId === '' || selectedRole === '') {
      setPromptState({
        phase: 'idle',
        promptPack: null,
        error: null,
        route: null
      });
      return;
    }

    let cancelled = false;

    setPromptState({
      phase: 'loading',
      promptPack: null,
      error: null,
      route: null
    });

    fetchPromptWorkspacePromptPack({
      goalId: selectedGoalId,
      taskId: selectedTaskId,
      role: selectedRole
    }).then((result) => {
      if (cancelled) {
        return;
      }

      if (result.ok) {
        setPromptState({
          phase: 'ready',
          promptPack: result.data,
          error: null,
          route: result.route
        });
        return;
      }

      setPromptState({
        phase: 'failed',
        promptPack: null,
        error: promptWorkspaceErrorText(result),
        route: result.route
      });
    });

    return () => {
      cancelled = true;
    };
  }, [selectedGoalId, selectedTaskId, selectedRole]);

  function updateGoal(goalId) {
    setSelectedGoalId(goalId);
    setSelectedTaskId('');
  }

  function updateRole(role) {
    setSelectedRole(role);
    setSelectedTaskId('');
  }

  async function refreshPromptWorkspaceHandoff() {
    setHandoffRefreshToken((current) => current + 1);
    await onWorkbenchContextChanged();
  }

  return (
    <section className="prompt-workspace-route" aria-label="Prompt Handoff Workspace">
      <aside className="prompt-workspace-selector" aria-labelledby="prompt-workspace-selector-title">
        <header className="panel-header">
          <div>
            <p className="section-kicker">v22 prompt workspace</p>
            <h2 id="prompt-workspace-selector-title">Prompt Handoff Workspace</h2>
          </div>
          <span className="panel-state">{promptWorkspacePhaseText(promptState.phase)}</span>
        </header>

        <div className="prompt-selector-stack">
          <label>
            <span>goal</span>
            <select value={selectedGoalId} onChange={(event) => updateGoal(event.target.value)}>
              {goalOptions.length === 0 ? <option value="">No managed goals</option> : null}
              {goalOptions.map((goal) => (
                <option key={goal.goalId} value={goal.goalId}>{goal.goalId}</option>
              ))}
            </select>
          </label>

          <label>
            <span>role</span>
            <select value={selectedRole} onChange={(event) => updateRole(event.target.value)}>
              {PROMPT_WORKSPACE_ROLES.map((role) => (
                <option key={role.id} value={role.id}>{role.label}</option>
              ))}
            </select>
          </label>

          <label>
            <span>task</span>
            <select
              value={selectedTaskId}
              disabled={taskOptions.length === 0}
              onChange={(event) => setSelectedTaskId(event.target.value)}
            >
              {taskOptions.length === 0 ? <option value="">No task for role</option> : null}
              {taskOptions.map((task) => (
                <option key={task.taskId} value={task.taskId}>{task.taskId}</option>
              ))}
            </select>
          </label>
        </div>

        <FieldList rows={[
          ['runbook route', textValue(runbookState.route ?? '未暴露')],
          ['runbook state', textValue(promptWorkspacePhaseText(runbookState.phase))],
          ['selected goal', textValue(selectedGoalId)],
          ['selected task', textValue(selectedTaskId)],
          ['selected role', textValue(selectedRole)],
          ['prompt route', textValue(promptState.route ?? '未暴露')],
          ['context operation', routeContext?.operationId],
          ['context run', routeContext?.runId],
          ['context evidence refs', textValue((routeContext?.evidenceRefs?.items ?? []).map((item) => item.ref.text).join('、') || '未暴露')]
        ]} />

        {runbookState.phase === 'failed' ? <p className="error-copy">错误摘要：{runbookState.error}</p> : null}
        {taskOptions.length === 0 && runbookState.phase === 'ready' ? (
          <EmptyBlock copy="当前 runbook 没有可用于该 role 的 task。" />
        ) : null}
        <p className="panel-note">左侧只选择 managed goal、runbook task 和 prompt role；状态仍来自 goal-status、goal next、goal prompt、goal update/review/gate、goal closeout 这组 goal contract。</p>
      </aside>

      <article className="data-panel prompt-workspace-output" aria-labelledby="prompt-workspace-output-title">
        <header className="panel-header">
          <div>
            <p className="section-kicker">goal-prompt-pack.v1</p>
            <h2 id="prompt-workspace-output-title">Generated Prompt Pack</h2>
          </div>
          <span className="panel-state">{promptWorkspacePhaseText(promptState.phase)}</span>
        </header>

        {promptState.phase === 'loading' ? <EmptyBlock copy="正在生成 prompt pack。" /> : null}
        {promptState.phase === 'failed' ? <p className="error-copy">错误摘要：{promptState.error}</p> : null}
        {promptState.phase === 'ready' ? (
          <PromptWorkspacePromptPack promptPack={promptState.promptPack} />
        ) : null}
      </article>

      <PromptWorkspaceHandoffBoardPanel handoffState={handoffState} />

      <PromptWorkspaceEventShortcuts
        selectedGoalId={selectedGoalId}
        selectedTaskId={selectedTaskId}
        selectedRole={selectedRole}
        onGoalEventConfirmed={refreshPromptWorkspaceHandoff}
      />
    </section>
  );
}

const PROMPT_WORKSPACE_ROLES = Object.freeze([
  Object.freeze({ id: 'worker', label: 'worker' }),
  Object.freeze({ id: 'reviewer', label: 'reviewer' }),
  Object.freeze({ id: 'main-verifier', label: 'main-verifier' }),
  Object.freeze({ id: 'release-manager', label: 'release-manager' })
]);

function PromptWorkspacePromptPack({ promptPack }) {
  const prompts = Array.isArray(promptPack?.prompts) ? promptPack.prompts : [];

  return (
    <>
      <FieldList rows={[
        ['contractName', textValue(promptPack?.contractName)],
        ['contractVersion', textValue(promptPack?.contractVersion)],
        ['goalId', textValue(promptPack?.goalId)],
        ['generatedAt', textValue(promptPack?.generatedAt)],
        ['prompt count', textValue(prompts.length)],
        ['readOnly', textValue(promptPack?.safety?.readOnly)],
        ['copyOnly', textValue(promptPack?.safety?.copyOnly)],
        ['workbenchWriteAvailable', textValue(promptPack?.safety?.workbenchWriteAvailable)],
        ['browserExecutionAvailable', textValue(promptPack?.safety?.browserExecutionAvailable)],
        ['modelInvocationAvailable', textValue(promptPack?.safety?.modelInvocationAvailable)]
      ]} />

      {prompts.length === 0 ? (
        <EmptyBlock copy="prompt pack 没有返回 prompts。" />
      ) : (
        <ul className="prompt-preview-list">
          {prompts.map((prompt, index) => (
            <li key={`${prompt?.taskId ?? 'task'}-${prompt?.role ?? 'role'}-${index}`}>
              <FieldList rows={[
                ['taskId', textValue(prompt?.taskId)],
                ['role', textValue(prompt?.role)],
                ['title', textValue(prompt?.title)],
                ['format', textValue(prompt?.format)],
                ['copyOnly', textValue(prompt?.copyOnly)],
                ['role label', textValue(prompt?.roleGuidance?.label)],
                ['phase', textValue(prompt?.roleGuidance?.phase)],
                ['evidenceFile', textValue(prompt?.evidenceFile)],
                ['validationCommands', textValue(Array.isArray(prompt?.validationCommands) ? prompt.validationCommands.join(' / ') : undefined)]
              ]} />
              <PromptRoleGuidance guidance={prompt?.roleGuidance} />
              <pre className="prompt-preview-text"><code>{prompt?.text ?? ''}</code></pre>
            </li>
          ))}
        </ul>
      )}

      <p className="panel-note">Prompt Workspace 只展示 goal prompt 生成的 copy-only prompt pack；不会启动 subagent、运行 shell、登记 approval 或判断任务完成。</p>
    </>
  );
}

function PromptRoleGuidance({ guidance }) {
  if (guidance === null || typeof guidance !== 'object') {
    return null;
  }

  return (
    <div className="prompt-role-guidance" aria-label="role boundary and evidence checklist">
      <Subsection title="role boundary">
        <CompactList items={guidance.boundary} />
      </Subsection>
      <Subsection title="evidence requirements">
        <CompactList items={guidance.evidenceRequirements} />
      </Subsection>
      <Subsection title="handoff checklist">
        <CompactList items={guidance.handoffChecklist} />
      </Subsection>
    </div>
  );
}

function PromptWorkspaceHandoffBoardPanel({ handoffState }) {
  const board = handoffState.board;

  return (
    <article className="data-panel prompt-workspace-handoff" aria-labelledby="prompt-workspace-handoff-title">
      <header className="panel-header">
        <div>
          <p className="section-kicker">goal handoff board</p>
          <h2 id="prompt-workspace-handoff-title">Subagent Handoff Board</h2>
        </div>
        <span className="panel-state">{promptWorkspaceHandoffPhaseText(handoffState.phase)}</span>
      </header>

      {handoffState.phase === 'loading' ? <EmptyBlock copy="正在读取 handoff source contracts。" /> : null}
      {handoffState.phase === 'failed' ? <p className="error-copy">错误摘要：{handoffState.error}</p> : null}
      {handoffState.phase === 'partial' ? <p className="error-copy">错误摘要：{handoffState.error}</p> : null}

      {board === null ? null : (
        <>
          <FieldList rows={[
            ['goalId', board.goalId],
            ['goalTitle', board.goalTitle],
            ['task count', board.taskCount],
            ['next.taskId', board.next.taskId],
            ['next.role', board.next.role],
            ['next.phase', board.next.phase],
            ['next.reason', board.next.reason],
            ['goal-status route', board.routeStates.goalStatus],
            ['events route', board.routeStates.eventLog],
            ['goal next route', board.routeStates.goalNext],
            ['goal closeout route', board.routeStates.goalCloseout],
            ['closeout missing count', board.closeout.missingCount],
            ['source policy', board.sourcePolicy]
          ]} />

          <Subsection title="subagent handoff by task">
            <SubagentHandoffTaskList board={board} />
          </Subsection>

          <p className="panel-note">{board.note}</p>
        </>
      )}
    </article>
  );
}

function PromptWorkspaceEventShortcuts({
  selectedGoalId,
  selectedTaskId,
  selectedRole,
  onGoalEventConfirmed
}) {
  const forms = createPromptWorkspaceWorkerEventShortcutForms({
    goalId: selectedGoalId,
    taskId: selectedTaskId
  });
  const shortcutsReady = selectedRole === 'worker' && forms.length > 0;

  return (
    <article className="data-panel prompt-workspace-event-shortcuts" aria-labelledby="prompt-workspace-event-shortcuts-title">
      <header className="panel-header">
        <div>
          <p className="section-kicker">goal update shortcuts</p>
          <h2 id="prompt-workspace-event-shortcuts-title">Worker Event Registration</h2>
        </div>
        <span className="panel-state">{shortcutsReady ? 'dry-run / confirm' : '等待 worker task'}</span>
      </header>

      <FieldList rows={[
        ['goalId', textValue(selectedGoalId)],
        ['taskId', textValue(selectedTaskId)],
        ['role', textValue(selectedRole)],
        ['supported events', textValue('worker.started、worker.evidence-recorded')],
        ['command surface', textValue('symphony goal update')],
        ['confirm required', textValue(true)]
      ]} />

      {selectedRole !== 'worker' ? (
        <EmptyBlock copy="当前 role 不生成 worker.started 或 worker.evidence-recorded 登记表单。" />
      ) : null}
      {selectedRole === 'worker' && forms.length === 0 ? (
        <EmptyBlock copy="选择 goal 和 task 后可生成 worker event 登记表单。" />
      ) : null}
      {shortcutsReady ? (
        <ul className="goal-event-form-list prompt-event-shortcut-list">
          {forms.map((form) => {
            const shortcutKey = promptWorkspaceWorkerEventShortcutKey({
              goalId: selectedGoalId,
              taskId: selectedTaskId,
              eventType: form.eventType.value
            });

            return (
              <li key={shortcutKey}>
                <FieldList rows={[
                  ['formId', form.formId],
                  ['eventType', form.eventType],
                  ['commandName', form.commandName],
                  ['actorRole', form.actorRole],
                  ['phase', form.phase],
                  ['requiresEvidence', form.requiresEvidence],
                  ['confirmRequiresPlanHash', form.confirmRequiresPlanHash],
                  ['planPreviewContract', form.planPreviewContract]
                ]} />
                <GoalEventFormFieldList fields={form.fields} />
                <GoalEventPlanPreview key={shortcutKey} form={form} onGoalEventConfirmed={onGoalEventConfirmed} />
              </li>
            );
          })}
        </ul>
      ) : null}

      <p className="panel-note">这些快捷入口只调用受控 goal update dry-run preview 和 plan-hash confirm；不会启动 subagent、运行 shell、登记 review/main/release 事件，或从文件名、分支、commit 文本推断任务状态。</p>
    </article>
  );
}

function promptWorkspaceWorkerEventShortcutKey({ goalId, taskId, eventType }) {
  return [goalId, taskId, eventType]
    .map((part) => String(part ?? '').trim())
    .join('::');
}

function createPromptWorkspaceWorkerEventShortcutForms({ goalId, taskId }) {
  if (!isNonEmptyText(goalId) || !isNonEmptyText(taskId)) {
    return [];
  }

  return [
    createPromptWorkspaceWorkerEventShortcutForm({
      goalId,
      taskId,
      eventType: 'worker.started',
      formId: 'prompt-workspace-worker-started',
      requiresEvidence: false,
      fields: ['goalId', 'taskId', 'eventType', 'workerActor', 'statement', 'branch', 'commit']
    }),
    createPromptWorkspaceWorkerEventShortcutForm({
      goalId,
      taskId,
      eventType: 'worker.evidence-recorded',
      formId: 'prompt-workspace-worker-evidence-recorded',
      requiresEvidence: true,
      fields: ['goalId', 'taskId', 'eventType', 'workerActor', 'evidenceRef', 'statement', 'branch', 'commit']
    })
  ];
}

function createPromptWorkspaceWorkerEventShortcutForm({
  goalId,
  taskId,
  eventType,
  formId,
  requiresEvidence,
  fields
}) {
  return {
    formId: textValue(formId),
    eventType: textValue(eventType),
    eventFamily: textValue('worker'),
    commandName: textValue('symphony goal update'),
    commandIntent: textValue('prompt-workspace-worker-event-shortcut'),
    actorRole: textValue('worker'),
    actorFlag: textValue('--actor'),
    phase: textValue('implement'),
    recommended: textValue(true),
    availableForCurrentNextAction: textValue(false),
    requiresTask: textValue(true),
    requiresEvidence: textValue(requiresEvidence),
    confirmRequiresPlanHash: textValue(true),
    planPreviewContract: textValue('goal-update-plan.v1'),
    evidenceRefHelper: createEmptyPromptWorkspaceEvidenceRefHelper(),
    fields: {
      state: 'available',
      count: textValue(fields.length),
      items: fields.map((fieldId) => createPromptWorkspaceWorkerEventField({
        fieldId,
        goalId,
        taskId,
        eventType,
        requiresEvidence
      }))
    }
  };
}

function createPromptWorkspaceWorkerEventField({
  fieldId,
  goalId,
  taskId,
  eventType,
  requiresEvidence
}) {
  const common = {
    id: fieldId,
    label: fieldId,
    flag: null,
    required: false,
    readOnly: false,
    value: undefined,
    placeholder: undefined,
    source: 'operator-input',
    options: []
  };
  const field = (() => {
    if (fieldId === 'goalId') {
      return {
        ...common,
        label: 'goal id',
        flag: '--goal',
        required: true,
        readOnly: true,
        value: goalId,
        source: 'prompt-workspace-selection'
      };
    }

    if (fieldId === 'taskId') {
      return {
        ...common,
        label: 'task id',
        flag: '--task',
        required: true,
        readOnly: true,
        value: taskId,
        source: 'prompt-workspace-selection'
      };
    }

    if (fieldId === 'eventType') {
      return {
        ...common,
        label: 'event',
        flag: '--event',
        required: true,
        readOnly: true,
        value: eventType,
        source: 'prompt-workspace-shortcut',
        options: [eventType]
      };
    }

    if (fieldId === 'workerActor') {
      return {
        ...common,
        id: 'actorId',
        label: 'worker actor id',
        flag: '--actor',
        required: true,
        placeholder: 'codex-worker-task-id'
      };
    }

    if (fieldId === 'evidenceRef') {
      return {
        ...common,
        label: 'evidence ref',
        flag: '--evidence-ref',
        required: requiresEvidence,
        placeholder: 'docs/plans/<evidence>.md or artifact:run:kind'
      };
    }

    if (fieldId === 'statement') {
      return {
        ...common,
        label: 'statement',
        flag: '--statement',
        placeholder: 'short event statement'
      };
    }

    if (fieldId === 'branch') {
      return {
        ...common,
        label: 'branch',
        flag: '--branch',
        placeholder: 'current branch'
      };
    }

    if (fieldId === 'commit') {
      return {
        ...common,
        label: 'commit',
        flag: '--commit',
        placeholder: 'commit sha or null'
      };
    }

    return common;
  })();

  return {
    id: textValue(field.id),
    label: textValue(field.label),
    flag: textValue(field.flag),
    inputType: textValue(field.options.length > 0 ? 'select' : 'text'),
    required: textValue(field.required),
    readOnly: textValue(field.readOnly),
    value: textValue(field.value),
    placeholder: textValue(field.placeholder),
    source: textValue(field.source),
    options: {
      state: field.options.length === 0 ? 'empty' : 'available',
      count: textValue(field.options.length),
      items: field.options.map((option) => textValue(option))
    }
  };
}

function createEmptyPromptWorkspaceEvidenceRefHelper() {
  return {
    state: 'empty',
    recentRefs: {
      state: 'empty',
      count: textValue(0),
      items: []
    },
    note: 'Prompt Workspace shortcut accepts typed controlled docs/plans refs or managed artifact refs.'
  };
}

function SubagentHandoffTaskList({ board }) {
  if (board.state === 'missing') {
    return <EmptyBlock copy="goal-status tasks 未暴露。" />;
  }

  if (board.items.length === 0) {
    return <EmptyBlock copy="当前 goal 没有 task。" />;
  }

  return (
    <ol className="subagent-handoff-list">
      {board.items.map((task, index) => (
        <li key={`${task.taskId.text}-${index}`} className={task.currentHandoff.active.value === true ? 'current-handoff-task' : ''}>
          <div className="run-row-header">
            <h3>{task.taskId.text} · {task.title.text}</h3>
            <span className="state-pill">{task.currentHandoff.active.value === true ? `handoff: ${task.currentHandoff.role.text}` : 'not current next'}</span>
          </div>
          <FieldList rows={[
            ['ledgerStatus', task.ledgerStatus],
            ['statusSource', task.statusSource],
            ['current role', task.currentHandoff.role],
            ['current phase', task.currentHandoff.phase],
            ['current reason', task.currentHandoff.reason],
            ['current source', task.currentHandoff.source],
            ['closeout missing', task.closeoutMissingKinds]
          ]} />
          <div className="subagent-handoff-steps">
            <SubagentHandoffStep title="worker started" cell={task.workerStarted} />
            <SubagentHandoffStep title="evidence recorded" cell={task.workerEvidence} />
            <SubagentHandoffStep title="reviewer verdict" cell={task.reviewerVerdict} />
            <SubagentHandoffStep title="main verification" cell={task.mainVerification} />
          </div>
        </li>
      ))}
    </ol>
  );
}

function SubagentHandoffStep({ title, cell }) {
  return (
    <section className="subagent-handoff-step" aria-label={title}>
      <h3>{title}</h3>
      <FieldList rows={[
        ['status', cell.status],
        ['source', cell.source],
        ['eventId', cell.eventId],
        ['eventType', cell.eventType],
        ['evidenceRef', cell.evidenceRef],
        ['actor', cell.actor],
        ['recordedAt', cell.recordedAt],
        ['verdict', cell.verdict]
      ].filter(([, state]) => state !== undefined)} />
    </section>
  );
}

function promptWorkspaceHandoffPhaseText(phase) {
  if (phase === 'ready') {
    return '已读取';
  }

  if (phase === 'partial') {
    return '部分可用';
  }

  if (phase === 'loading') {
    return '读取中';
  }

  if (phase === 'failed') {
    return '不可用';
  }

  return '无 goal';
}

function promptWorkspaceGoalOptions(model) {
  const options = [];

  addPromptWorkspaceGoalOption(options, model?.activeGoal?.runbook?.goalId?.value);
  addPromptWorkspaceGoalOption(options, model?.activeGoal?.viewModel?.goalId?.value);

  for (const goal of model?.goals?.items ?? []) {
    addPromptWorkspaceGoalOption(options, goal.goalId?.value);
  }

  return options;
}

function addPromptWorkspaceGoalOption(options, goalId) {
  if (typeof goalId !== 'string' || goalId.trim() === '') {
    return;
  }

  if (options.some((option) => option.goalId === goalId)) {
    return;
  }

  options.push({ goalId });
}

function promptWorkspaceInitialGoalId(model, goalOptions, routeGoalId) {
  if (typeof routeGoalId === 'string' && routeGoalId.trim() !== '') {
    return routeGoalId;
  }

  const activeGoalId = model?.activeGoal?.runbook?.goalId?.value
    ?? model?.activeGoal?.viewModel?.goalId?.value;

  if (typeof activeGoalId === 'string' && activeGoalId.trim() !== '') {
    return activeGoalId;
  }

  return goalOptions[0]?.goalId ?? '';
}

function promptWorkspaceRouteSelection(routeContext) {
  const query = currentWorkbenchSearchParams();
  const queryGoal = safeRouteContextToken(query.get('goal'));
  const queryTask = safeRouteContextToken(query.get('task'));
  const queryRole = safePromptWorkspaceRole(query.get('role'));

  return {
    goalId: queryGoal ?? stringValue(routeContext?.goalId?.value),
    taskId: queryTask ?? stringValue(routeContext?.taskId?.value),
    role: queryRole ?? roleForRouteContext(routeContext)
  };
}

function roleForRouteContext(routeContext) {
  const activeRole = stringValue(routeContext?.activeRole?.value);

  if (safePromptWorkspaceRole(activeRole) !== null) {
    return activeRole;
  }

  return 'worker';
}

function promptWorkspaceTaskOptions(runbook, role) {
  if (role === 'release-manager') {
    return [{ taskId: 'release', title: 'release closeout' }];
  }

  const tasks = Array.isArray(runbook?.tasks) ? runbook.tasks : [];

  return tasks
    .filter((task) => Array.isArray(task?.roleOrder) && task.roleOrder.includes(role))
    .map((task) => ({
      taskId: task.taskId,
      title: task.title
    }))
    .filter((task) => typeof task.taskId === 'string' && task.taskId.trim() !== '');
}

function promptWorkspaceErrorText(result) {
  if (result?.errorEnvelope?.error?.code && result?.errorEnvelope?.error?.message) {
    return `${result.errorEnvelope.error.code} / ${result.errorEnvelope.error.message}`;
  }

  return result?.message ?? 'route unavailable';
}

function promptWorkspacePhaseText(phase) {
  if (phase === 'ready') {
    return '已生成';
  }

  if (phase === 'loading') {
    return '读取中';
  }

  if (phase === 'failed') {
    return '不可用';
  }

  if (phase === 'empty') {
    return '无 goal';
  }

  return '等待选择';
}

function GoalProgressPanel({ progress, route }) {
  return (
    <DataPanel
      id="goal-progress-panel"
      kicker="v17 goal progress"
      title="Goal Progress Ledger"
      state={goalProgressStateText(progress, route)}
      route={route}
    >
      {progress.state === 'unavailable' && progress.errorEnvelope.state === 'available' ? (
        <p className="error-copy">错误摘要：{progress.errorEnvelope.code.text} / {progress.errorEnvelope.message.text}</p>
      ) : null}

      <FieldList rows={[
        ['contractName', progress.contractName],
        ['contractVersion', progress.contractVersion],
        ['goalId', progress.goalId],
        ['goalTitle', progress.goalTitle],
        ['baseline.tag', progress.baselineTag],
        ['baseline.commit', progress.baselineCommit],
        ['baseline.evidenceRef', progress.baselineEvidenceRef],
        ['summary.totalTasks', progress.summary.totalTasks],
        ['summary.completedTasks', progress.summary.completedTasks],
        ['summary.blockedTasks', progress.summary.blockedTasks],
        ['summary.needsReviewTasks', progress.summary.needsReviewTasks],
        ['summary.needsRevisionTasks', progress.summary.needsRevisionTasks],
        ['summary.releaseReady', progress.summary.releaseReady],
        ['summary.releaseReadySource', progress.summary.releaseReadySource]
      ]} />

      <Subsection title="tasks / evidence">
        <GoalTaskList tasks={progress.tasks} />
      </Subsection>

      <Subsection title="release gates">
        <KeyValueList rows={progress.releaseGates} nameKey="gate" valueKey="status" emptyCopy="releaseGates 未暴露。" />
      </Subsection>

      <Subsection title="blockers">
        <BlockerList blockers={progress.blockers} />
      </Subsection>

      <Subsection title="next copy-only commands">
        <NextActionList actions={progress.nextActions} />
      </Subsection>

      <Subsection title="safety">
        <FieldList rows={[
          ['readOnly', progress.safety.readOnly],
          ['copyOnly', progress.safety.copyOnly],
          ['browserExecutionAvailable', progress.safety.browserExecutionAvailable],
          ['modelInvocationAvailable', progress.safety.modelInvocationAvailable]
        ]} />
      </Subsection>

      <p className="panel-note">{progress.note}</p>
    </DataPanel>
  );
}

function GoalEventsTimelinePanel({ events, route }) {
  return (
    <DataPanel
      id="goal-events-timeline-panel"
      kicker="v18 goal events"
      title="Goal Events Timeline"
      state={goalEventsStateText(events, route)}
      route={route}
    >
      {events.state === 'unavailable' && events.errorEnvelope.state === 'available' ? (
        <p className="error-copy">错误摘要：{events.errorEnvelope.code.text} / {events.errorEnvelope.message.text}</p>
      ) : null}

      <FieldList rows={[
        ['contractName', events.contractName],
        ['contractVersion', events.contractVersion],
        ['goalId', events.goalId],
        ['goalTitle', events.goalTitle],
        ['baseline.tag', events.baselineTag],
        ['baseline.commit', events.baselineCommit],
        ['baseline.evidenceRef', events.baselineEvidenceRef],
        ['log.appendOnly', events.log.appendOnly],
        ['log.storage', events.log.storage],
        ['log.eventCount', events.log.eventCount],
        ['log.firstSequence', events.log.firstSequence],
        ['log.lastSequence', events.log.lastSequence],
        ['log.lastEventId', events.log.lastEventId],
        ['log.lastEventHash', events.log.lastEventHash]
      ]} />

      <Subsection title="timeline / hash chain">
        <GoalEventTimelineList timeline={events.timeline} />
      </Subsection>

      <p className="panel-note">{events.note}</p>
    </DataPanel>
  );
}

function EvidenceMatrixPanel({ matrix, route }) {
  return (
    <DataPanel
      id="evidence-matrix-panel"
      kicker="v18 evidence"
      title="Evidence Matrix"
      state={routeStateText(route)}
      route={route}
    >
      <FieldList rows={[
        ['task count', matrix.tasks.count],
        ['release gate count', matrix.releaseGates.count],
        ['release-ready status', matrix.releaseReady.status],
        ['release-ready eventId', matrix.releaseReady.eventId]
      ]} />

      <Subsection title="tasks">
        <EvidenceMatrixTaskList tasks={matrix.tasks} />
      </Subsection>

      <Subsection title="release gates">
        <ReleaseGateMatrixList releaseGates={matrix.releaseGates} />
      </Subsection>

      <Subsection title="release-ready evidence">
        <EvidenceRefList evidenceRefs={matrix.releaseReady.evidenceRefs} />
      </Subsection>

      <p className="panel-note">Evidence Matrix 只使用 reviewer/main/release 的显式 event；approved、main-verified 和 release-ready 不由 ledger status、分支、文件名或命令文本推断。</p>
    </DataPanel>
  );
}

function ActiveGoalViewModelPanel({ viewModel }) {
  return (
    <DataPanel
      id="active-goal-view-model-panel"
      kicker="v20 active goal"
      title="ActiveGoalViewModel"
      state={activeGoalViewModelStateText(viewModel)}
    >
      <FieldList rows={[
        ['modelName', viewModel.modelName],
        ['goalId', viewModel.goalId],
        ['goalTitle', viewModel.goalTitle],
        ['baseline', viewModel.baseline],
        ['command count', viewModel.commandCount],
        ['unavailable command count', viewModel.unavailableCommandCount],
        ['goal-status contract', viewModel.status.contractName],
        ['goal-status route', viewModel.status.routeState],
        ['goal next contract', viewModel.next.contractName],
        ['goal next route', viewModel.next.routeState],
        ['goal prompt contract', viewModel.prompt.contractName],
        ['goal prompt route', viewModel.prompt.routeState],
        ['goal closeout contract', viewModel.closeout.contractName],
        ['goal closeout route', viewModel.closeout.routeState],
        ['next.taskId', viewModel.next.taskId],
        ['next.role', viewModel.next.role],
        ['next.phase', viewModel.next.phase],
        ['next.reason', viewModel.next.reason],
        ['prompt copyOnly count', viewModel.prompt.copyOnlyCount],
        ['closeout missing count', viewModel.closeout.missingCount],
        ['releaseReady', viewModel.closeout.releaseReady]
      ]} />

      <Subsection title="command-backed sources">
        <ActiveGoalCommandInventoryList inventory={viewModel.commandInventory} />
      </Subsection>

      <p className="panel-note">{viewModel.note}</p>
    </DataPanel>
  );
}

function MainVerificationReadinessPanel({
  readiness,
  onVerificationRunConfirmed = () => undefined
}) {
  return (
    <DataPanel
      id="main-verification-readiness-panel"
      kicker="v31 main verification"
      title="Main Verification Readiness"
      state={readiness.state}
      route={null}
    >
      <FieldList rows={[
        ['goalId', readiness.goalId],
        ['taskId', readiness.taskId],
        ['title', readiness.title],
        ['canEnterMainVerification', readiness.readiness.canEnterMainVerification],
        ['reason', readiness.readiness.reason],
        ['currentNext.role', readiness.readiness.currentNextRole],
        ['currentNext.phase', readiness.readiness.currentNextPhase],
        ['closeout missing', readiness.readiness.closeoutMissingKinds],
        ['source policy', readiness.sourcePolicy]
      ]} />
      <TextItemList items={readiness.readiness.blockers} emptyCopy="readiness blockers 未暴露。" />

      <Subsection title="reviewer.approved">
        <FieldList rows={[
          ['status', readiness.reviewerApproval.status],
          ['approved', readiness.reviewerApproval.approved],
          ['eventType', readiness.reviewerApproval.eventType],
          ['evidenceRef', readiness.reviewerApproval.evidenceRef],
          ['eventId', readiness.reviewerApproval.eventId],
          ['actor', readiness.reviewerApproval.actor],
          ['recordedAt', readiness.reviewerApproval.recordedAt],
          ['source', readiness.reviewerApproval.source]
        ]} />
      </Subsection>

      <Subsection title="adoption state">
        <FieldList rows={[
          ['status', readiness.adoptionState.status],
          ['required', readiness.adoptionState.required],
          ['applied', readiness.adoptionState.applied],
          ['adoptionPlanId', readiness.adoptionState.adoptionPlanId],
          ['planOperationId', readiness.adoptionState.planOperationId],
          ['planOperationStatus', readiness.adoptionState.planOperationStatus],
          ['confirmOperationId', readiness.adoptionState.confirmOperationId],
          ['confirmOperationStatus', readiness.adoptionState.confirmOperationStatus],
          ['confirmationRunStatus', readiness.adoptionState.confirmationRunStatus],
          ['inspectRouteState', readiness.adoptionState.inspectRouteState],
          ['inspectStatus', readiness.adoptionState.inspectStatus],
          ['journalStatus', readiness.adoptionState.journalStatus],
          ['currentWorktreeMatchesAfterHash', readiness.adoptionState.currentWorktreeMatchesAfterHash],
          ['currentWorktreeMatchesJournalBeforeFiles', readiness.adoptionState.currentWorktreeMatchesJournalBeforeFiles],
          ['source', readiness.adoptionState.source],
          ['note', readiness.adoptionState.note]
        ]} />
      </Subsection>

      <Subsection title="ff-only merge guidance">
        <FieldList rows={[
          ['guidance', readiness.ffOnlyMerge.guidance]
        ]} />
        <TextItemList items={readiness.ffOnlyMerge.commands} emptyCopy="ff-only merge commands 未暴露。" />
      </Subsection>

      <Subsection title="required verification commands">
        <TextItemList items={readiness.verificationCommands} emptyCopy="required verification commands 未暴露。" />
      </Subsection>

      <Subsection title="allowlisted verification plan preview">
        <AllowlistedVerificationPlanPreview
          preview={readiness.verificationPlanPreview}
          onVerificationRunConfirmed={onVerificationRunConfirmed}
        />
      </Subsection>

      <Subsection title="evidence path">
        <FieldList rows={[
          ['path', readiness.evidence.path],
          ['expectedEvent', readiness.evidence.expectedEvent],
          ['existingMainVerificationRef', readiness.evidence.existingMainVerificationRef],
          ['copy-only gate dry-run', readiness.evidence.gateCommand]
        ]} />
      </Subsection>

      <Subsection title="explicit state sources">
        <TextItemList items={readiness.explicitStateSources} emptyCopy="explicit state sources 未暴露。" />
      </Subsection>

      <Subsection title="ignored inference sources">
        <TextItemList items={readiness.ignoredInferenceSources} emptyCopy="ignored inference sources 未暴露。" />
      </Subsection>

      <Subsection title="safety">
        <FieldList rows={[
          ['readOnly', readiness.safety.readOnly],
          ['copyOnly', readiness.safety.copyOnly],
          ['browserExecutionAvailable', readiness.safety.browserExecutionAvailable],
          ['modelInvocationAvailable', readiness.safety.modelInvocationAvailable],
          ['approvalReadinessSource', readiness.safety.approvalReadinessSource],
          ['adoptionReadinessSource', readiness.safety.adoptionReadinessSource],
          ['unsupportedInferenceSources', readiness.safety.unsupportedInferenceSources]
        ]} />
      </Subsection>

      <p className="panel-note">{readiness.note}</p>
    </DataPanel>
  );
}

function AllowlistedVerificationPlanPreview({
  preview,
  onVerificationRunConfirmed = () => undefined
}) {
  const [runState, setRunState] = useState({
    phase: 'idle',
    result: null,
    error: null
  });

  if (preview?.state === 'missing' || preview === undefined || preview === null) {
    return <EmptyBlock copy="allowlisted verification plan preview 未暴露。" />;
  }

  const startRoute = preview.operationStart?.endpoint?.route?.value;
  const startBody = buildControlledVerificationRunBody(preview);
  const startAvailable = preview.operationStart?.available?.value === true
    && typeof startRoute === 'string'
    && startRoute.trim() !== ''
    && startBody !== null;

  async function handleConfirm() {
    if (!startAvailable) {
      setRunState({
        phase: 'failed',
        result: null,
        error: 'verification run endpoint unavailable'
      });
      return;
    }

    setRunState({
      phase: 'loading',
      result: null,
      error: null
    });

    const result = await confirmControlledVerificationRun(startRoute, startBody);

    if (result.ok) {
      setRunState({
        phase: 'ready',
        result: result.data,
        error: null
      });

      if (typeof onVerificationRunConfirmed === 'function') {
        await onVerificationRunConfirmed(result.data);
      }
      return;
    }

    setRunState({
      phase: 'failed',
      result: null,
      error: result.errorEnvelope === null
        ? result.message
        : `${result.errorEnvelope.error.code} / ${result.errorEnvelope.error.message}`
    });
  }

  return (
    <div className="verification-plan-preview">
      <FieldList rows={[
        ['modelName', preview.modelName],
        ['goalId', preview.goalId],
        ['taskId', preview.taskId],
        ['title', preview.title],
        ['command count', preview.commandCount],
        ['rejected task command count', preview.rejectedTaskCommandCount],
        ['source policy', preview.sourcePolicy]
      ]} />
      <Subsection title="active goal/task/run/evidence context">
        <FieldList rows={[
          ['context source', preview.context.sourcePolicy],
          ['activeGoalId', preview.context.activeGoalId],
          ['activeTaskId', preview.context.activeTaskId],
          ['latestRunId', preview.context.latestRunId],
          ['latestRunStatus', preview.context.latestRunStatus],
          ['workerEvidenceRef', preview.context.workerEvidenceRef],
          ['reviewEvidenceRef', preview.context.reviewEvidenceRef],
          ['adoptionPlanOperationId', preview.context.adoptionPlanOperationId],
          ['adoptionConfirmOperationId', preview.context.adoptionConfirmOperationId],
          ['existingMainVerificationRef', preview.context.existingMainVerificationRef],
          ['existingMainVerificationEventId', preview.context.existingMainVerificationEventId]
        ]} />
      </Subsection>
      <VerificationPlanCommandList commands={preview.commands} />
      <Subsection title="controlled verification operation">
        <FieldList rows={[
          ['available', preview.operationStart?.available],
          ['suiteId', preview.operationStart?.suiteId],
          ['endpoint.method', preview.operationStart?.endpoint?.method],
          ['endpoint.route', preview.operationStart?.endpoint?.route],
          ['endpoint.allowedBodyFields', preview.operationStart?.endpoint?.allowedBodyFields],
          ['resultContract', preview.operationStart?.resultContract],
          ['operationKind', preview.operationStart?.operationKind],
          ['operationRegistryContract', preview.operationStart?.operationRegistryContract]
        ]} />
        <div className="goal-event-confirm-actions">
          <button type="button" onClick={handleConfirm} disabled={!startAvailable || runState.phase === 'loading'}>
            Start controlled verification run
          </button>
          <code>{startRoute ?? 'verification run route unavailable'}</code>
        </div>
        {runState.phase === 'failed' ? (
          <p className="error-copy">verification 错误摘要：{runState.error}</p>
        ) : null}
        {runState.phase === 'loading' ? (
          <p className="empty-copy">正在运行固定 verification command suite。Operation Console 会从 registry 刷新状态和输出摘要。</p>
        ) : null}
        {runState.phase === 'ready' ? (
          <div className="goal-event-confirm-result">
            <FieldList rows={[
              ['contractName', textValue(runState.result.contractName)],
              ['status', textValue(runState.result.status)],
              ['suiteId', textValue(runState.result.suiteId)],
              ['operationId', textValue(runState.result.operationRun?.operationId)],
              ['operationStatus', textValue(runState.result.operationRun?.status)],
              ['exitCode', textValue(runState.result.output?.exitCode)],
              ['commandCount', textValue(runState.result.runResult?.commandCount)],
              ['failedCommandCount', textValue(runState.result.runResult?.failedCommandCount)],
              ['successImpliesGatePassed', textValue(runState.result.safety?.successImpliesGatePassed)]
            ]} />
          </div>
        ) : null}
      </Subsection>
      <Subsection title="fixed verification allowlist">
        <TextItemList items={preview.requiredVerificationCommands} emptyCopy="fixed verification allowlist 未暴露。" />
      </Subsection>
      <Subsection title="task-scoped controlled commands">
        <TextItemList items={preview.taskScopedControlledCommands} emptyCopy="task-scoped controlled commands 未暴露。" />
      </Subsection>
      <Subsection title="safety">
        <FieldList rows={[
          ['copyOnly', preview.safety.copyOnly],
          ['commandInputAccepted', preview.safety.commandInputAccepted],
          ['arbitraryShellAccepted', preview.safety.arbitraryShellAccepted],
          ['browserExecutionAvailable', preview.safety.browserExecutionAvailable],
          ['modelInvocationAvailable', preview.safety.modelInvocationAvailable],
          ['genericShellRunner', preview.safety.genericShellRunner],
          ['controlledOperationStartAvailable', preview.safety.controlledOperationStartAvailable],
          ['writesGoalEvents', preview.safety.writesGoalEvents],
          ['registersGates', preview.safety.registersGates]
        ]} />
      </Subsection>
      <Subsection title="explicit contracts">
        <TextItemList items={preview.explicitContracts} emptyCopy="explicit contracts 未暴露。" />
      </Subsection>
      <Subsection title="ignored inference sources">
        <TextItemList items={preview.ignoredInferenceSources} emptyCopy="ignored inference sources 未暴露。" />
      </Subsection>
      <p className="panel-note">{preview.note}</p>
    </div>
  );
}

function VerificationPlanCommandList({ commands }) {
  if (commands?.state === 'missing' || commands === undefined || commands === null) {
    return <EmptyBlock copy="verification plan commands 未暴露。" />;
  }

  if (!Array.isArray(commands.items) || commands.items.length === 0) {
    return <EmptyBlock copy="verification plan commands 为空。" />;
  }

  return (
    <ol className="verification-plan-command-list" aria-label="allowlisted verification commands">
      {commands.items.map((item) => (
        <li key={`${item.index.text}-${item.command.text}`}>
          <code>{item.command.text}</code>
          <FieldList rows={[
            ['kind', item.kind],
            ['source', item.source],
            ['copyOnly', item.copyOnly],
            ['browserExecutionAvailable', item.browserExecutionAvailable],
            ['acceptsArbitraryInput', item.acceptsArbitraryInput]
          ]} />
        </li>
      ))}
    </ol>
  );
}

function MainVerificationEvidenceDraftPanel({ draft }) {
  return (
    <DataPanel
      id="main-verification-evidence-draft-panel"
      kicker="v31 main verification"
      title="Main Verification Evidence Draft"
      state={draft?.state ?? 'missing'}
      route={null}
    >
      <FieldList rows={[
        ['modelName', draft?.modelName],
        ['goalId', draft?.goalId],
        ['taskId', draft?.taskId],
        ['title', draft?.title],
        ['targetEvidenceRef', draft?.targetEvidenceRef],
        ['status', draft?.status],
        ['copy-only gate dry-run', draft?.copyOnlyGateDryRun],
        ['sourcePolicy', draft?.sourcePolicy]
      ]} />

      <Subsection title="missing inputs / blockers">
        <TextItemList items={draft?.missingInputs} emptyCopy="draft blocker 为空。" />
      </Subsection>

      <Subsection title="verification operation refs">
        <FieldList rows={[
          ['operationId', draft?.verification?.operationId],
          ['operationStatus', draft?.verification?.operationStatus],
          ['source', draft?.verification?.source],
          ['runId', draft?.verification?.runId],
          ['suiteId', draft?.verification?.suiteId],
          ['runStatus', draft?.verification?.runStatus],
          ['exitCode', draft?.verification?.exitCode],
          ['commandCount', draft?.verification?.commandCount],
          ['failedCommandCount', draft?.verification?.failedCommandCount],
          ['gatePassed', draft?.verification?.gatePassed],
          ['planHash', draft?.verification?.planHash],
          ['failureReason', draft?.verification?.failureReason]
        ]} />
      </Subsection>

      <Subsection title="verification command results">
        <MainVerificationDraftCommandResultList commandResults={draft?.commandResults} />
      </Subsection>

      <Subsection title="review evidence and run refs">
        <FieldList rows={[
          ['workerEvidenceRef', draft?.refs?.workerEvidenceRef],
          ['reviewEvidenceRef', draft?.refs?.reviewEvidenceRef],
          ['latestRunId', draft?.refs?.latestRunId],
          ['existingMainVerificationRef', draft?.refs?.existingMainVerificationRef],
          ['existingMainVerificationEventId', draft?.refs?.existingMainVerificationEventId]
        ]} />
      </Subsection>

      <Subsection title="adoption refs">
        <FieldList rows={[
          ['adoptionPlanId', draft?.adoptionRefs?.adoptionPlanId],
          ['adoptionPlanOperationId', draft?.adoptionRefs?.adoptionPlanOperationId],
          ['adoptionPlanArtifactPath', draft?.adoptionRefs?.adoptionPlanArtifactPath],
          ['adoptionConfirmOperationId', draft?.adoptionRefs?.adoptionConfirmOperationId],
          ['adoptionConfirmStatus', draft?.adoptionRefs?.adoptionConfirmStatus],
          ['latestConfirmationRunId', draft?.adoptionRefs?.latestConfirmationRunId],
          ['latestConfirmationEvidenceArtifactPath', draft?.adoptionRefs?.latestConfirmationEvidenceArtifactPath],
          ['journalStatus', draft?.adoptionRefs?.journalStatus]
        ]} />
      </Subsection>

      <Subsection title="draft needing operator / reviewer check">
        <FieldList rows={[
          ['draft markdown', draft?.markdown],
          ['draftOnly', draft?.safety?.draftOnly],
          ['needsOperatorReview', draft?.safety?.needsOperatorReview],
          ['requiresOperatorReview', draft?.safety?.requiresOperatorReview],
          ['declaresPassed', draft?.safety?.declaresPassed],
          ['registersGates', draft?.safety?.registersGates],
          ['writesEvidenceFile', draft?.safety?.writesEvidenceFile],
          ['writesFiles', draft?.safety?.writesFiles]
        ]} />
        <pre className="prompt-preview-text"><code>{draft?.markdown?.text ?? ''}</code></pre>
      </Subsection>

      <Subsection title="safety">
        <FieldList rows={[
          ['readsEvidenceBodies', draft?.safety?.readsEvidenceBodies],
          ['writesFiles', draft?.safety?.writesFiles],
          ['registersGates', draft?.safety?.registersGates],
          ['browserExecutionAvailable', draft?.safety?.browserExecutionAvailable],
          ['arbitraryShellAccepted', draft?.safety?.arbitraryShellAccepted],
          ['modelInvocationAvailable', draft?.safety?.modelInvocationAvailable],
          ['declaresPassed', draft?.safety?.declaresPassed],
          ['successImpliesGatePassed', draft?.safety?.successImpliesGatePassed],
          ['selfApprovalAvailable', draft?.safety?.selfApprovalAvailable]
        ]} />
      </Subsection>

      <p className="panel-note">{draft?.note ?? 'Main verification evidence draft is unavailable until explicit goal and verification contracts load.'}</p>
    </DataPanel>
  );
}

function MainVerificationDraftCommandResultList({ commandResults }) {
  const items = commandResults?.items ?? [];

  if (items.length === 0) {
    return <EmptyBlock copy="verification command results 未暴露。" />;
  }

  return (
    <ol className="verification-plan-command-list" aria-label="main verification evidence draft command results">
      {items.map((item, index) => (
        <li key={`${item.command.text}-${index}`}>
          <code>{item.command.text}</code>
          <FieldList rows={[
            ['status', item.status],
            ['exitCode', item.exitCode],
            ['stdoutSummary', item.stdoutSummary],
            ['stderrSummary', item.stderrSummary],
            ['startedAt', item.startedAt],
            ['completedAt', item.completedAt]
          ]} />
        </li>
      ))}
    </ol>
  );
}

function MainVerificationGateRegistrationPanel({
  registration,
  onGoalEventConfirmed
}) {
  return (
    <DataPanel
      id="main-verification-gate-registration-panel"
      kicker="v31 main verification"
      title="Main Verification Gate Registration"
      state={registration?.state ?? 'missing'}
      route={null}
    >
      <FieldList rows={[
        ['modelName', registration?.modelName],
        ['goalId', registration?.goalId],
        ['taskId', registration?.taskId],
        ['title', registration?.title],
        ['targetEvidenceRef', registration?.targetEvidenceRef],
        ['existingMainVerificationRef', registration?.existingMainVerificationRef],
        ['existingMainVerificationEventId', registration?.existingMainVerificationEventId],
        ['verificationOperationId', registration?.verificationOperationId],
        ['verificationRunId', registration?.verificationRunId],
        ['readinessState', registration?.readinessState],
        ['draftState', registration?.draftState],
        ['dryRunCommand', registration?.dryRunCommand],
        ['confirmCommandPattern', registration?.confirmCommandPattern],
        ['sourcePolicy', registration?.sourcePolicy]
      ]} />

      <Subsection title="registration blockers">
        <TextItemList items={registration?.missingInputs} emptyCopy="registration blockers 为空。" />
      </Subsection>

      <Subsection title="main-verification gate form">
        <GoalEventFormList
          forms={{
            state: registration?.form === null || registration?.form === undefined ? 'empty' : 'available',
            count: textValue(registration?.form === null || registration?.form === undefined ? 0 : 1),
            items: registration?.form === null || registration?.form === undefined ? [] : [registration.form]
          }}
          emptyCopy="main-verification gate form 不可用。"
          onGoalEventConfirmed={onGoalEventConfirmed}
        />
      </Subsection>

      <Subsection title="safety">
        <FieldList rows={[
          ['confirmRequiresPlanHash', registration?.safety?.confirmRequiresPlanHash],
          ['appendOnlyOnConfirm', registration?.safety?.appendOnlyOnConfirm],
          ['workbenchWriteAvailable', registration?.safety?.workbenchWriteAvailable],
          ['usesGoalGateOnly', registration?.safety?.usesGoalGateOnly],
          ['requiresMainVerifierInput', registration?.safety?.requiresMainVerifierInput],
          ['readsEvidenceBodies', registration?.safety?.readsEvidenceBodies],
          ['writesEvidenceFile', registration?.safety?.writesEvidenceFile],
          ['browserExecutionAvailable', registration?.safety?.browserExecutionAvailable],
          ['arbitraryShellAccepted', registration?.safety?.arbitraryShellAccepted],
          ['modelInvocationAvailable', registration?.safety?.modelInvocationAvailable],
          ['mergeAvailable', registration?.safety?.mergeAvailable],
          ['pushAvailable', registration?.safety?.pushAvailable],
          ['tagAvailable', registration?.safety?.tagAvailable],
          ['releaseReadyAvailable', registration?.safety?.releaseReadyAvailable],
          ['selfApprovalAvailable', registration?.safety?.selfApprovalAvailable],
          ['successImpliesGatePassed', registration?.safety?.successImpliesGatePassed]
        ]} />
      </Subsection>

      <p className="panel-note">{registration?.note?.text ?? registration?.note}</p>
    </DataPanel>
  );
}

function ActiveGoalRunbookPanel({ runbook, route, progressRoute, eventsRoute }) {
  return (
    <DataPanel
      id="active-goal-runbook-panel"
      kicker="v20 primary workflow"
      title="Active Goal Runbook"
      state={activeGoalStateText(runbook, route)}
      route={route}
    >
      {runbook.state === 'unavailable' && runbook.errorEnvelope.state === 'available' ? (
        <p className="error-copy">错误摘要：{runbook.errorEnvelope.code.text} / {runbook.errorEnvelope.message.text}</p>
      ) : null}

      <FieldList rows={[
        ['contractName', runbook.contractName],
        ['contractVersion', runbook.contractVersion],
        ['goalId', runbook.goalId],
        ['goalTitle', runbook.goalTitle],
        ['baseline.tag', runbook.baselineTag],
        ['baseline.commit', runbook.baselineCommit],
        ['baseline.evidenceRef', runbook.baselineEvidenceRef],
        ['task count', runbook.taskCount],
        ['release gate count', runbook.releaseGateCount],
        ['active progress route', textValue(routeStateText(progressRoute))],
        ['active events route', textValue(routeStateText(eventsRoute))]
      ]} />

      <Subsection title="tasks / expected evidence">
        <GoalRunbookTaskList tasks={runbook.tasks} />
      </Subsection>

      <Subsection title="release gates">
        <KeyValueList rows={runbook.releaseGates} nameKey="gate" valueKey="status" emptyCopy="release gates 未暴露。" />
      </Subsection>

      <Subsection title="role policy">
        <KeyValueList rows={runbook.rolePolicy} nameKey="policy" valueKey="enabled" emptyCopy="role policy 未暴露。" />
      </Subsection>

      <p className="panel-note">{runbook.note}</p>
    </DataPanel>
  );
}

function ActiveGoalTaskQueuePanel({ taskQueue, route, progressRoute, eventsRoute, nextRoute }) {
  return (
    <DataPanel
      id="active-goal-task-queue-panel"
      kicker="v20 primary workflow"
      title="Active Goal Task Queue"
      state={activeGoalTaskQueueStateText(taskQueue, route)}
      route={route}
    >
      <FieldList rows={[
        ['goalId', taskQueue.goalId],
        ['goalTitle', taskQueue.goalTitle],
        ['task count', taskQueue.totalTasks],
        ['completedTasks', taskQueue.completedTasks],
        ['blockedTasks', taskQueue.blockedTasks],
        ['needsReviewTasks', taskQueue.needsReviewTasks],
        ['needsRevisionTasks', taskQueue.needsRevisionTasks],
        ['next.taskId', taskQueue.nextTaskId],
        ['next.role', taskQueue.nextRole],
        ['next.phase', taskQueue.nextPhase],
        ['next.reason', taskQueue.nextReason],
        ['runbook route', textValue(routeStateText(route))],
        ['progress route', textValue(routeStateText(progressRoute))],
        ['events route', textValue(routeStateText(eventsRoute))],
        ['next route', textValue(routeStateText(nextRoute))],
        ['source policy', taskQueue.sourcePolicy]
      ]} />

      <Subsection title="task queue">
        <ActiveGoalTaskQueueList taskQueue={taskQueue} />
      </Subsection>

      <p className="panel-note">{taskQueue.note}</p>
    </DataPanel>
  );
}

function ActiveTaskImplementationEligibilityPanel({ eligibility }) {
  return (
    <DataPanel
      id="active-task-implementation-eligibility-panel"
      kicker="v29 active task"
      title="Active Task Implementation Eligibility"
      state={implementationEligibilityStateText(eligibility)}
    >
      <FieldList rows={[
        ['modelName', eligibility.modelName],
        ['goalId', eligibility.goalId],
        ['taskId', eligibility.taskId],
        ['title', eligibility.title],
        ['canEnterControlledImplementation', eligibility.canEnterControlledImplementation],
        ['decision.status', eligibility.decision.status],
        ['decision.reason', eligibility.decision.reason],
        ['currentNextRole', eligibility.decision.currentNextRole],
        ['currentNextPhase', eligibility.decision.currentNextPhase],
        ['currentNextStatus', eligibility.decision.currentNextStatus],
        ['currentNextBlocked', eligibility.decision.currentNextBlocked],
        ['sourcePolicy', eligibility.sourcePolicy]
      ]} />

      <Subsection title="route context">
        <FieldList rows={[
          ['route.goalId', eligibility.routeContext.goalId],
          ['route.taskId', eligibility.routeContext.taskId],
          ['route.activeRole', eligibility.routeContext.activeRole],
          ['route.activePhase', eligibility.routeContext.activePhase],
          ['route.operationId', eligibility.routeContext.operationId],
          ['route.goalMatches', eligibility.routeContext.goalMatches],
          ['route.taskMatches', eligibility.routeContext.taskMatches]
        ]} />
      </Subsection>

      <Subsection title="required contracts">
        <FieldList rows={[
          ['goal-status route', eligibility.requiredContracts.goalStatusRoute],
          ['goal next route', eligibility.requiredContracts.goalNextRoute],
          ['runbook route', eligibility.requiredContracts.runbookRoute],
          ['events route', eligibility.requiredContracts.eventsRoute],
          ['operations route', eligibility.requiredContracts.operationsRoute],
          ['goalStatusTaskPresent', eligibility.requiredContracts.goalStatusTaskPresent],
          ['runbookTaskPresent', eligibility.requiredContracts.runbookTaskPresent],
          ['scopedEventLogPresent', eligibility.requiredContracts.scopedEventLogPresent]
        ]} />
      </Subsection>

      <Subsection title="goal-status task">
        <FieldList rows={[
          ['status', eligibility.goalStatusTask.status],
          ['statusSource', eligibility.goalStatusTask.statusSource],
          ['eventBacked', eligibility.goalStatusTask.eventBacked],
          ['workerEvidenceRef', eligibility.goalStatusTask.workerEvidenceRef],
          ['reviewEvidenceRef', eligibility.goalStatusTask.reviewEvidenceRef],
          ['reviewVerdict', eligibility.goalStatusTask.reviewVerdict],
          ['mainVerificationRef', eligibility.goalStatusTask.mainVerificationRef]
        ]} />
      </Subsection>

      <Subsection title="explicit events">
        <FieldList rows={[
          ['task event count', eligibility.explicitEvents.count],
          ['hasOpenBlocker', eligibility.explicitEvents.hasOpenBlocker],
          ['workerStarted.eventId', eligibility.explicitEvents.latestWorkerStarted.eventId],
          ['workerEvidence.eventId', eligibility.explicitEvents.latestWorkerEvidence.eventId],
          ['workerEvidence.evidenceRef', eligibility.explicitEvents.latestWorkerEvidence.evidenceRef],
          ['review.eventId', eligibility.explicitEvents.latestReview.eventId],
          ['review.eventType', eligibility.explicitEvents.latestReview.eventType],
          ['mainVerification.eventId', eligibility.explicitEvents.latestMainVerification.eventId],
          ['blockerOpened.eventId', eligibility.explicitEvents.latestBlockerOpened.eventId],
          ['blockerResolved.eventId', eligibility.explicitEvents.latestBlockerResolved.eventId]
        ]} />
      </Subsection>

      <Subsection title="runbook task">
        <FieldList rows={[
          ['branch', eligibility.runbookTask.branch],
          ['roleOrder', eligibility.runbookTask.roleOrder],
          ['expectedWorker', eligibility.runbookTask.expectedWorker]
        ]} />
        <h4>acceptance</h4>
        <TextItemList items={eligibility.runbookTask.acceptance} emptyCopy="acceptance 未暴露。" />
        <h4>copy-only commands</h4>
        <TextItemList items={eligibility.runbookTask.copyOnlyCommands} emptyCopy="copy-only commands 未暴露。" />
      </Subsection>

      <Subsection title="next action">
        <FieldList rows={[
          ['reason', eligibility.nextAction.reason],
          ['registerWith', eligibility.nextAction.registerWith],
          ['allowedEvents', eligibility.nextAction.allowedEvents],
          ['copyOnlyPromptAvailable', eligibility.nextAction.copyOnlyPromptAvailable],
          ['workerEvidenceRef', eligibility.nextAction.workerEvidenceRef]
        ]} />
      </Subsection>

      <Subsection title="operation context">
        <FieldList rows={[
          ['operations route', eligibility.operationContext.routeState],
          ['latestOperationId', eligibility.operationContext.latestOperationId],
          ['latestStatus', eligibility.operationContext.latestStatus],
          ['latestSource', eligibility.operationContext.latestSource],
          ['latestCommandKind', eligibility.operationContext.latestCommandKind],
          ['latestPlanHash', eligibility.operationContext.latestPlanHash]
        ]} />
      </Subsection>

      <Subsection title="blocking reasons">
        <TextItemList items={eligibility.decision.blockingReasons} emptyCopy="blocking reasons 为空。" />
      </Subsection>

      <Subsection title="recovery steps">
        <TextItemList items={eligibility.recoverySteps} emptyCopy="recovery steps 未暴露。" />
      </Subsection>

      <Subsection title="safety">
        <FieldList rows={[
          ['readOnly', eligibility.safety.readOnly],
          ['copyOnly', eligibility.safety.copyOnly],
          ['workbenchWriteAvailable', eligibility.safety.workbenchWriteAvailable],
          ['controlledImplementationStartsRun', eligibility.safety.controlledImplementationStartsRun],
          ['browserExecutionAvailable', eligibility.safety.browserExecutionAvailable],
          ['modelInvocationAvailable', eligibility.safety.modelInvocationAvailable],
          ['genericShellRunner', eligibility.safety.genericShellRunner],
          ['approvalReadinessSource', eligibility.safety.approvalReadinessSource],
          ['unsupportedInferenceSources', eligibility.safety.unsupportedInferenceSources]
        ]} />
      </Subsection>

      <p className="panel-note">{eligibility.note}</p>
    </DataPanel>
  );
}

function ControlledImplementationPlanPreviewPanel({
  preview,
  onControlledImplementationConfirmed = () => undefined
}) {
  const [confirmState, setConfirmState] = useState({
    phase: 'idle',
    result: null,
    error: null
  });
  const confirmRoute = preview?.confirm?.endpoint?.route?.value;
  const confirmBody = buildControlledImplementationConfirmBody(preview);
  const confirmAvailable = preview?.state === 'preview-ready'
    && preview?.confirm?.available?.value === true
    && typeof confirmRoute === 'string'
    && confirmRoute.trim() !== ''
    && confirmBody !== null;

  async function handleConfirm() {
    if (!confirmAvailable) {
      setConfirmState({
        phase: 'failed',
        result: null,
        error: 'confirm route unavailable'
      });
      return;
    }

    setConfirmState({
      phase: 'loading',
      result: null,
      error: null
    });

    const result = await confirmControlledImplementationRunPlan(confirmRoute, confirmBody);

    if (result.ok) {
      setConfirmState({
        phase: 'ready',
        result: result.data,
        error: null
      });

      if (typeof onControlledImplementationConfirmed === 'function') {
        await onControlledImplementationConfirmed(result.data);
      }
      return;
    }

    setConfirmState({
      phase: 'failed',
      result: null,
      error: result.errorEnvelope === null
        ? result.message
        : `${result.errorEnvelope.error.code} / ${result.errorEnvelope.error.message}`
    });
  }

  return (
    <DataPanel
      id="controlled-implementation-plan-preview-panel"
      kicker="v29 active task"
      title="Controlled Implementation Plan Preview"
      state={preview?.state ?? 'unavailable'}
    >
      <FieldList rows={[
        ['modelName', preview?.modelName],
        ['routeState', preview?.routeState],
        ['goalId', preview?.goalId],
        ['taskId', preview?.taskId],
        ['canPreview', preview?.canPreview],
        ['reason', preview?.reason],
        ['planId', preview?.plan?.planId],
        ['planHash', preview?.plan?.planHash],
        ['mode', preview?.plan?.mode],
        ['status', preview?.plan?.status],
        ['commandName', preview?.plan?.commandName],
        ['previewOf', preview?.plan?.previewOf],
        ['confirmRequired', preview?.plan?.confirmRequired]
      ]} />

      <Subsection title="write semantics">
        <FieldList rows={[
          ['safetyMode', preview?.writeSemantics?.safetyMode],
          ['writeBoundary', preview?.writeSemantics?.writeBoundary],
          ['mainWorktreeWrites', preview?.writeSemantics?.mainWorktreeWrites],
          ['workspaceWrites', preview?.writeSemantics?.workspaceWrites],
          ['runtimeWrites', preview?.writeSemantics?.runtimeWrites],
          ['destructiveWrites', preview?.writeSemantics?.destructiveWrites]
        ]} />
      </Subsection>

      <Subsection title="active task constraints">
        <FieldList rows={[
          ['title', preview?.activeTaskConstraints?.title],
          ['branch', preview?.activeTaskConstraints?.branch],
          ['roleOrder', preview?.activeTaskConstraints?.roleOrder],
          ['expectedWorkerEvidence', preview?.activeTaskConstraints?.expectedWorkerEvidence]
        ]} />
        <h4>acceptance</h4>
        <TextItemList items={preview?.activeTaskConstraints?.acceptance} emptyCopy="acceptance 未暴露。" />
        <h4>copy-only commands</h4>
        <TextItemList items={preview?.activeTaskConstraints?.copyOnlyCommands} emptyCopy="copy-only commands 未暴露。" />
      </Subsection>

      <Subsection title="worker prompt">
        <FieldList rows={[
          ['available', preview?.workerPrompt?.available],
          ['copyOnly', preview?.workerPrompt?.copyOnly],
          ['format', preview?.workerPrompt?.format],
          ['role', preview?.workerPrompt?.role]
        ]} />
        <CopyBlock value={preview?.workerPrompt?.text?.value} emptyCopy="worker prompt 未暴露。" />
      </Subsection>

      <Subsection title="goal/task/evidence refs">
        <FieldList rows={[
          ['currentWorkerEvidenceRef', preview?.evidenceRefs?.currentWorkerEvidenceRef],
          ['currentReviewEvidenceRef', preview?.evidenceRefs?.currentReviewEvidenceRef],
          ['currentMainVerificationRef', preview?.evidenceRefs?.currentMainVerificationRef]
        ]} />
        <EvidenceRefItemList refs={preview?.evidenceRefs?.explicitEventEvidenceRefs} />
      </Subsection>

      <Subsection title="confirm handoff">
        <FieldList rows={[
          ['available', preview?.confirm?.available],
          ['enabledByTask', preview?.confirm?.enabledByTask],
          ['requiredContext', preview?.confirm?.requiredContext],
          ['copyOnlyCommand', preview?.confirm?.copyOnlyCommand],
          ['endpoint.method', preview?.confirm?.endpoint?.method],
          ['endpoint.route', preview?.confirm?.endpoint?.route],
          ['endpoint.allowedBodyFields', preview?.confirm?.endpoint?.allowedBodyFields],
          ['endpoint.requiresSameGoalTaskContext', preview?.confirm?.endpoint?.requiresSameGoalTaskContext],
          ['endpoint.confirmUsesPlanHash', preview?.confirm?.endpoint?.confirmUsesPlanHash]
        ]} />
        <div className="goal-event-confirm-actions">
          <button type="button" onClick={handleConfirm} disabled={!confirmAvailable || confirmState.phase === 'loading'}>
            Confirm isolated workspace run
          </button>
          <code>{confirmRoute ?? 'confirm route unavailable'}</code>
        </div>
        {confirmState.phase === 'failed' ? (
          <p className="error-copy">confirm 错误摘要：{confirmState.error}</p>
        ) : null}
        {confirmState.phase === 'loading' ? (
          <p className="empty-copy">正在确认 frozen implementation plan，并启动 isolated workspace run path。</p>
        ) : null}
        {confirmState.phase === 'ready' ? (
          <div className="goal-event-confirm-result">
            <FieldList rows={[
              ['contractName', textValue(confirmState.result.contractName)],
              ['status', textValue(confirmState.result.status)],
              ['planId', textValue(confirmState.result.planId)],
              ['planHash', textValue(confirmState.result.planHash)],
              ['runId', textValue(confirmState.result.confirmedRun?.runId)],
              ['executionPlanId', textValue(confirmState.result.confirmedRun?.executionPlanId)],
              ['writeBoundary', textValue(confirmState.result.confirmedRun?.writeBoundary)],
              ['mainWorktreeWrites', textValue(confirmState.result.confirmedRun?.mainWorktreeWrites)],
              ['workspaceWrites', textValue(confirmState.result.confirmedRun?.workspaceWrites)],
              ['verifierStatus', textValue(confirmState.result.confirmedRun?.verifierStatus)]
            ]} />
          </div>
        ) : null}
      </Subsection>

      <Subsection title="run result bridge">
        <FieldList rows={[
          ['state', textValue(preview?.runResultBridge?.state)],
          ['sourceContract', preview?.runResultBridge?.sourceContract],
          ['operationId', preview?.runResultBridge?.operationId],
          ['operationStatus', preview?.runResultBridge?.operationStatus],
          ['commandKind', preview?.runResultBridge?.commandKind],
          ['runId', preview?.runResultBridge?.run?.runId],
          ['executionPlanId', preview?.runResultBridge?.run?.executionPlanId],
          ['run.status', preview?.runResultBridge?.run?.status],
          ['run.exitCode', preview?.runResultBridge?.run?.exitCode],
          ['verifierStatus', preview?.runResultBridge?.run?.verifierStatus],
          ['writeBoundary', preview?.runResultBridge?.run?.writeBoundary],
          ['mainWorktreeWrites', preview?.runResultBridge?.run?.mainWorktreeWrites],
          ['workspaceWrites', preview?.runResultBridge?.run?.workspaceWrites],
          ['evidenceArtifactPath', preview?.runResultBridge?.run?.evidenceArtifactPath],
          ['sourceWorkspacePath', preview?.runResultBridge?.run?.sourceWorkspacePath],
          ['artifact count', preview?.runResultBridge?.artifactRefs?.count],
          ['changed files', textValue(preview?.runResultBridge?.changedFiles?.items?.length ?? 0)],
          ['failureReason', preview?.runResultBridge?.run?.failureReason]
        ]} />
        <h4>artifact refs</h4>
        <OperationArtifactRefList artifactRefs={preview?.runResultBridge?.artifactRefs} />
        <h4>verifier summary</h4>
        <FieldList rows={[
          ['status', preview?.runResultBridge?.verifierSummary?.status],
          ['runStatus', preview?.runResultBridge?.verifierSummary?.runStatus],
          ['passed', preview?.runResultBridge?.verifierSummary?.passed],
          ['changedFileCount', preview?.runResultBridge?.verifierSummary?.changedFileCount],
          ['artifactCount', preview?.runResultBridge?.verifierSummary?.artifactCount],
          ['failureReason', preview?.runResultBridge?.verifierSummary?.failureReason]
        ]} />
        <h4>output summary</h4>
        <div className="operation-console-streams" aria-label="implementation run output summary">
          <label>
            <span>stdout</span>
            <pre><code>{preview?.runResultBridge?.outputSummary?.stdout?.text}</code></pre>
          </label>
          <label>
            <span>stderr</span>
            <pre><code>{preview?.runResultBridge?.outputSummary?.stderr?.text}</code></pre>
          </label>
        </div>
        <p className="panel-note">{preview?.runResultBridge?.note}</p>
      </Subsection>

      <Subsection title="endpoint">
        <FieldList rows={[
          ['method', preview?.endpoint?.method],
          ['route', preview?.endpoint?.route],
          ['allowedQueryFields', preview?.endpoint?.allowedQueryFields],
          ['rejectsPromptInput', preview?.endpoint?.rejectsPromptInput],
          ['rejectsPlanHashInput', preview?.endpoint?.rejectsPlanHashInput],
          ['rejectsConfirmInput', preview?.endpoint?.rejectsConfirmInput],
          ['writesInDryRun', preview?.endpoint?.writesInDryRun],
          ['genericShellRunner', preview?.endpoint?.genericShellRunner]
        ]} />
      </Subsection>

      <Subsection title="safety">
        <FieldList rows={[
          ['readOnly', preview?.safety?.readOnly],
          ['copyOnly', preview?.safety?.copyOnly],
          ['workbenchWriteAvailable', preview?.safety?.workbenchWriteAvailable],
          ['browserExecutionAvailable', preview?.safety?.browserExecutionAvailable],
          ['modelInvocationAvailable', preview?.safety?.modelInvocationAvailable],
          ['genericShellRunner', preview?.safety?.genericShellRunner],
          ['arbitraryPathReadAvailable', preview?.safety?.arbitraryPathReadAvailable],
          ['implementationRunStarted', preview?.safety?.implementationRunStarted],
          ['approvalReadinessSource', preview?.safety?.approvalReadinessSource],
          ['unsupportedInferenceSources', preview?.safety?.unsupportedInferenceSources]
        ]} />
      </Subsection>

      <p className="panel-note">{preview?.note}</p>
    </DataPanel>
  );
}

function buildControlledImplementationConfirmBody(preview) {
  const goalId = preview?.goalId?.value;
  const taskId = preview?.taskId?.value;
  const planId = preview?.plan?.planId?.value;
  const planHash = preview?.plan?.planHash?.value;

  if (![goalId, taskId, planId, planHash].every((value) => typeof value === 'string' && value.trim() !== '')) {
    return null;
  }

  return {
    goalId,
    taskId,
    planId,
    planHash
  };
}

function buildControlledVerificationRunBody(preview) {
  const goalId = preview?.goalId?.value;
  const taskId = preview?.taskId?.value;
  const suiteId = preview?.operationStart?.suiteId?.value;

  if (![goalId, taskId, suiteId].every((value) => typeof value === 'string' && value.trim() !== '')) {
    return null;
  }

  return {
    goalId,
    taskId,
    suiteId
  };
}

function NextActionCard({ nextAction, route, onGoalEventConfirmed }) {
  return (
    <DataPanel
      id="next-action-card-panel"
      kicker="v19 active goal"
      title="Next Action Card"
      state={activeGoalStateText(nextAction, route)}
      route={route}
    >
      {nextAction.state === 'unavailable' && nextAction.errorEnvelope.state === 'available' ? (
        <p className="error-copy">错误摘要：{nextAction.errorEnvelope.code.text} / {nextAction.errorEnvelope.message.text}</p>
      ) : null}

      <FieldList rows={[
        ['contractName', nextAction.contractName],
        ['contractVersion', nextAction.contractVersion],
        ['goalId', nextAction.goalId],
        ['status', nextAction.status],
        ['reason', nextAction.reason],
        ['next.taskId', nextAction.next.taskId],
        ['next.role', nextAction.next.role],
        ['next.phase', nextAction.next.phase],
        ['next.blocked', nextAction.next.blocked],
        ['workerEvidenceRef', nextAction.evidenceState.workerEvidenceRef],
        ['reviewEvidenceRef', nextAction.evidenceState.reviewEvidenceRef],
        ['mainVerificationRef', nextAction.evidenceState.mainVerificationRef],
        ['afterCompletion.registrationCommand', nextAction.afterCompletion.registrationCommand],
        ['afterCompletion.registerWith', nextAction.afterCompletion.registerWith],
        ['afterCompletion.allowedEvents', nextAction.afterCompletion.allowedEvents],
        ['copyOnlyPrompt.available', nextAction.copyOnlyPrompt.available],
        ['copyOnlyPrompt.format', nextAction.copyOnlyPrompt.format],
        ['copyOnlyPrompt.textAvailable', nextAction.copyOnlyPrompt.textAvailable]
      ]} />

      <Subsection title="copy-only commands">
        <TextItemList items={nextAction.copyOnlyCommands} emptyCopy="copyOnlyCommands 为空或未暴露。" />
      </Subsection>

      <Subsection title="event registration forms">
        <GoalEventFormModelView formModel={nextAction.eventForms} onGoalEventConfirmed={onGoalEventConfirmed} />
      </Subsection>

      <Subsection title="safety">
        <FieldList rows={[
          ['readOnly', nextAction.safety.readOnly],
          ['copyOnly', nextAction.safety.copyOnly],
          ['workbenchWriteAvailable', nextAction.safety.workbenchWriteAvailable],
          ['browserExecutionAvailable', nextAction.safety.browserExecutionAvailable],
          ['modelInvocationAvailable', nextAction.safety.modelInvocationAvailable]
        ]} />
      </Subsection>

      <p className="panel-note">{nextAction.note}</p>
    </DataPanel>
  );
}

function PromptPreviewDrawer({ promptPreview, route }) {
  return (
    <aside className="data-panel prompt-preview-drawer" aria-labelledby="prompt-preview-drawer-title">
      <header className="panel-header">
        <div>
          <p className="section-kicker">v19 active goal</p>
          <h2 id="prompt-preview-drawer-title">Prompt Preview Drawer</h2>
        </div>
        <span className="panel-state">{promptPreviewStateText(promptPreview, route)}</span>
      </header>
      {route?.state === 'failed' ? (
        <p className="error-copy">错误摘要：{route.error}。刷新页面后会重新读取只读 API。</p>
      ) : null}
      {promptPreview.state === 'unavailable' && promptPreview.errorEnvelope.state === 'available' ? (
        <p className="error-copy">错误摘要：{promptPreview.errorEnvelope.code.text} / {promptPreview.errorEnvelope.message.text}</p>
      ) : null}

      <FieldList rows={[
        ['contractName', promptPreview.contractName],
        ['contractVersion', promptPreview.contractVersion],
        ['goalId', promptPreview.goalId],
        ['prompt count', promptPreview.promptCount],
        ['visible copy-only prompts', promptPreview.visibleCount],
        ['hidden non-copy-only prompts', promptPreview.hiddenCount],
        ['readOnly', promptPreview.safety.readOnly],
        ['copyOnly', promptPreview.safety.copyOnly],
        ['workbenchWriteAvailable', promptPreview.safety.workbenchWriteAvailable],
        ['browserExecutionAvailable', promptPreview.safety.browserExecutionAvailable],
        ['modelInvocationAvailable', promptPreview.safety.modelInvocationAvailable]
      ]} />

      <Subsection title="copy-only prompt drawer">
        <PromptPreviewList prompts={promptPreview.items} />
      </Subsection>

      <p className="panel-note">{promptPreview.note}</p>
    </aside>
  );
}

function ReviewWorkspacePanel({ workspace, onGoalEventConfirmed }) {
  return (
    <DataPanel
      id="review-workspace-panel"
      kicker="v27 review workspace"
      title="Review Workspace"
      state={workspace.state}
    >
      <FieldList rows={[
        ['modelName', workspace.modelName],
        ['goalId', workspace.goalId],
        ['taskId', workspace.taskId],
        ['title', workspace.title],
        ['active next role', workspace.activeNext.role],
        ['active next phase', workspace.activeNext.phase],
        ['active next reason', workspace.activeNext.reason],
        ['source policy', workspace.sourcePolicy]
      ]} />

      <Subsection title="source run">
        <FieldList rows={[
          ['source run', workspace.sourceRun.runId],
          ['status', workspace.sourceRun.status],
          ['verifierStatus', workspace.sourceRun.verifierStatus],
          ['executionPlanId', workspace.sourceRun.executionPlanId],
          ['sourceWorkspacePath', workspace.sourceRun.sourceWorkspacePath],
          ['sourceWorkspaceManifestPath', workspace.sourceRun.sourceWorkspaceManifestPath],
          ['evidenceArtifactPath', workspace.sourceRun.evidenceArtifactPath],
          ['evidenceRef', workspace.sourceRun.evidenceRef],
          ['workspaceWrites', workspace.sourceRun.workspaceWrites],
          ['mainWorktreeWrites', workspace.sourceRun.mainWorktreeWrites],
          ['updatedAt', workspace.sourceRun.updatedAt]
        ]} />
      </Subsection>

      <Subsection title="changed files">
        <TextItemList items={workspace.changedFiles} emptyCopy="changed files 未暴露。" />
      </Subsection>

      <Subsection title="worker evidence">
        <FieldList rows={[
          ['worker evidence', workspace.workerEvidence.ref],
          ['ledger ref', workspace.workerEvidence.ledgerRef],
          ['event ref', workspace.workerEvidence.eventRef],
          ['eventId', workspace.workerEvidence.eventId],
          ['eventType', workspace.workerEvidence.eventType],
          ['source', workspace.workerEvidence.source]
        ]} />
      </Subsection>

      <Subsection title="review prompt">
        <FieldList rows={[
          ['sourceContract', workspace.reviewPrompt.sourceContract],
          ['taskId', workspace.reviewPrompt.taskId],
          ['role', workspace.reviewPrompt.role],
          ['title', workspace.reviewPrompt.title],
          ['format', workspace.reviewPrompt.format],
          ['evidenceFile', workspace.reviewPrompt.evidenceFile],
          ['textAvailable', workspace.reviewPrompt.textAvailable]
        ]} />
        {workspace.reviewPrompt.textAvailable.value === true ? (
          <pre className="prompt-preview-text review-workspace-prompt"><code>{workspace.reviewPrompt.text.text}</code></pre>
        ) : (
          <EmptyBlock copy="review prompt 未暴露；请从 Prompt Workspace 选择 reviewer role 后读取 prompt pack。" />
        )}
      </Subsection>

      <Subsection title="reviewer handoff">
        <FieldList rows={[
          ['handoff state', workspace.reviewerHandoff.state],
          ['sourceContract', workspace.reviewerHandoff.sourceContract],
          ['promptGeneratedFrom', workspace.reviewerHandoff.promptGeneratedFrom],
          ['promptRoute', workspace.reviewerHandoff.promptRoute],
          ['promptCommand', workspace.reviewerHandoff.promptCommand],
          ['reviewer evidence path', workspace.reviewerHandoff.reviewerEvidencePath],
          ['latest worker actor', workspace.reviewerHandoff.latestWorkerActor],
          ['separationRequired', workspace.reviewerHandoff.separationRequired],
          ['reviewerActorMustDifferFromLatestWorker', workspace.reviewerHandoff.reviewerActorMustDifferFromLatestWorker],
          ['workerCanReviewOwnTask', workspace.reviewerHandoff.workerCanReviewOwnTask],
          ['workerCanApproveOwnTask', workspace.reviewerHandoff.workerCanApproveOwnTask]
        ]} />
        <h4>separation enforcement</h4>
        <TextItemList items={workspace.reviewerHandoff.enforcedBy} emptyCopy="reviewer/worker separation 未暴露。" />
        <h4>handoff checklist</h4>
        <TextItemList items={workspace.reviewerHandoff.handoffChecklist} emptyCopy="reviewer handoff checklist 未暴露。" />
      </Subsection>

      <Subsection title="review checklist">
        <FieldList rows={[
          ['role label', workspace.reviewPrompt.roleGuidance.label],
          ['role phase', workspace.reviewPrompt.roleGuidance.phase]
        ]} />
        <h4>acceptance</h4>
        <TextItemList items={workspace.reviewChecklist.acceptance} emptyCopy="acceptance 未暴露。" />
        <h4>validation commands</h4>
        <TextItemList items={workspace.reviewChecklist.validationCommands} emptyCopy="validation commands 未暴露。" />
        <h4>role boundary</h4>
        <TextItemList items={workspace.reviewChecklist.roleBoundary} emptyCopy="role boundary 未暴露。" />
        <h4>evidence requirements</h4>
        <TextItemList items={workspace.reviewChecklist.evidenceRequirements} emptyCopy="evidence requirements 未暴露。" />
        <h4>handoff checklist</h4>
        <TextItemList items={workspace.reviewChecklist.handoffChecklist} emptyCopy="handoff checklist 未暴露。" />
        <h4>required context</h4>
        <TextItemList items={workspace.reviewChecklist.requiredContext} emptyCopy="required context 未暴露。" />
      </Subsection>

      <Subsection title="expected verdict event">
        <FieldList rows={[
          ['registerWith', workspace.expectedVerdict.registerWith],
          ['expectedEvidence', workspace.expectedVerdict.expectedEvidence],
          ['confirmRequiresPlanHash', workspace.expectedVerdict.confirmRequiresPlanHash],
          ['writesInDryRun', workspace.expectedVerdict.writesInDryRun]
        ]} />
        <TextItemList items={workspace.expectedVerdict.allowedEvents} emptyCopy="expected reviewer verdict events 未暴露。" />
        <FieldList rows={[
          ['dryRunCommand', workspace.expectedVerdict.dryRunCommand]
        ]} />
      </Subsection>

      <Subsection title="review verdict registration">
        <ReviewVerdictRegistration
          registration={workspace.reviewVerdictRegistration}
          onGoalEventConfirmed={onGoalEventConfirmed}
        />
      </Subsection>

      <Subsection title="existing review">
        <FieldList rows={[
          ['verdict', workspace.existingReview.verdict],
          ['evidenceRef', workspace.existingReview.evidenceRef],
          ['eventId', workspace.existingReview.eventId],
          ['eventType', workspace.existingReview.eventType],
          ['source', workspace.existingReview.source]
        ]} />
      </Subsection>

      <Subsection title="safety">
        <FieldList rows={[
          ['readOnly', workspace.safety.readOnly],
          ['copyOnly', workspace.safety.copyOnly],
          ['workbenchWriteAvailable', workspace.safety.workbenchWriteAvailable],
          ['browserExecutionAvailable', workspace.safety.browserExecutionAvailable],
          ['modelInvocationAvailable', workspace.safety.modelInvocationAvailable],
          ['genericShellRunner', workspace.safety.genericShellRunner],
          ['workerCanApproveOwnTask', workspace.safety.workerCanApproveOwnTask],
          ['reviewerActorMustDifferFromLatestWorker', workspace.safety.reviewerActorMustDifferFromLatestWorker],
          ['approvalReadinessSource', workspace.safety.approvalReadinessSource],
          ['unsupportedInferenceSources', workspace.safety.unsupportedInferenceSources]
        ]} />
      </Subsection>

      <p className="panel-note">{workspace.note}</p>
    </DataPanel>
  );
}

function ReviewVerdictRegistration({ registration, onGoalEventConfirmed }) {
  if (registration === null || registration === undefined || registration.state === 'missing') {
    return <EmptyBlock copy="review verdict registration 未暴露。" />;
  }

  return (
    <div className="review-verdict-registration">
      <FieldList rows={[
        ['modelName', registration.modelName],
        ['sourceContract', registration.sourceContract],
        ['goalId', registration.goalId],
        ['taskId', registration.taskId],
        ['registerWith', registration.registerWith],
        ['defaultFormId', registration.defaultFormId],
        ['latestWorkerActor', registration.latestWorkerActor],
        ['reviewerEvidenceRef', registration.reviewerEvidenceRef],
        ['reviewerActorMustDifferFromLatestWorker', registration.policy.reviewerActorMustDifferFromLatestWorker],
        ['workerCanApproveOwnTask', registration.policy.workerCanApproveOwnTask],
        ['approvalReadinessSource', registration.policy.approvalReadinessSource],
        ['dryRunWrites', registration.safety.dryRunWrites],
        ['confirmRequiresPlanHash', registration.safety.confirmRequiresPlanHash],
        ['workbenchWriteAvailable', registration.safety.workbenchWriteAvailable],
        ['genericShellRunner', registration.safety.genericShellRunner]
      ]} />
      <h4>allowed verdict events</h4>
      <TextItemList items={registration.allowedEvents} emptyCopy="allowed reviewer verdict events 未暴露。" />
      <GoalEventFormList
        forms={registration.forms}
        emptyCopy="当前任务没有可登记的 reviewer verdict 表单。"
        onGoalEventConfirmed={onGoalEventConfirmed}
      />
      <p className="panel-note">{registration.note}</p>
    </div>
  );
}

function CloseoutGapsPanel({
  closeoutGaps,
  route,
  onGoalEventConfirmed = () => undefined
}) {
  return (
    <DataPanel
      id="closeout-gaps-panel"
      kicker="v19 active goal"
      title="Closeout Gaps"
      state={activeGoalStateText(closeoutGaps, route)}
      route={route}
    >
      {closeoutGaps.state === 'unavailable' && closeoutGaps.errorEnvelope.state === 'available' ? (
        <p className="error-copy">错误摘要：{closeoutGaps.errorEnvelope.code.text} / {closeoutGaps.errorEnvelope.message.text}</p>
      ) : null}

      <FieldList rows={[
        ['contractName', closeoutGaps.contractName],
        ['modelName', closeoutGaps.modelName],
        ['contractVersion', closeoutGaps.contractVersion],
        ['goalId', closeoutGaps.goalId],
        ['generatedAt', closeoutGaps.generatedAt],
        ['summary.totalTasks', closeoutGaps.summary.totalTasks],
        ['workerEvidenceComplete', closeoutGaps.summary.workerEvidenceComplete],
        ['reviewEvidenceComplete', closeoutGaps.summary.reviewEvidenceComplete],
        ['mainVerificationComplete', closeoutGaps.summary.mainVerificationComplete],
        ['releaseReady', closeoutGaps.summary.releaseReady],
        ['releaseReadySource', closeoutGaps.summary.releaseReadySource],
        ['missing count', closeoutGaps.missing.count],
        ['nextAction', closeoutGaps.nextAction]
      ]} />

      <Subsection title="release baseline resolver">
        <ReleaseBaselineResolver baseline={closeoutGaps.releaseBaseline} />
      </Subsection>

      <Subsection title="missing evidence and gates">
        <CloseoutMissingList missing={closeoutGaps.missing} />
      </Subsection>

      <Subsection title="release gates">
        <KeyValueList rows={closeoutGaps.releaseGates} nameKey="gate" valueKey="status" emptyCopy="release gates 未暴露。" />
      </Subsection>

      <Subsection title="release verification checklist">
        <ReleaseVerificationChecklist
          checklist={closeoutGaps.verificationChecklist}
          onGoalEventConfirmed={onGoalEventConfirmed}
        />
      </Subsection>

      <Subsection title="release.ready gate registration">
        <ReleaseReadyGateRegistration
          registration={closeoutGaps.releaseReadyGate}
          onGoalEventConfirmed={onGoalEventConfirmed}
        />
      </Subsection>

      <Subsection title="release evidence draft">
        <ReleaseEvidenceDraft draft={closeoutGaps.releaseEvidenceDraft} />
      </Subsection>

      <Subsection title="tag evidence draft / prompt">
        <TagEvidencePrompt prompt={closeoutGaps.tagEvidencePrompt} />
      </Subsection>

      <Subsection title="next-version handoff draft">
        <NextVersionHandoffDraft draft={closeoutGaps.nextVersionHandoffDraft} />
      </Subsection>

      <Subsection title="safety">
        <FieldList rows={[
          ['readOnly', closeoutGaps.safety.readOnly],
          ['copyOnly', closeoutGaps.safety.copyOnly],
          ['workbenchWriteAvailable', closeoutGaps.safety.workbenchWriteAvailable],
          ['browserExecutionAvailable', closeoutGaps.safety.browserExecutionAvailable],
          ['modelInvocationAvailable', closeoutGaps.safety.modelInvocationAvailable],
          ['writesInDryRun', closeoutGaps.safety.writesInDryRun],
          ['confirmRequiredForWrites', closeoutGaps.safety.confirmRequiredForWrites],
          ['releaseReadyRequiresEvidence', closeoutGaps.safety.releaseReadyRequiresEvidence]
        ]} />
      </Subsection>

      <p className="panel-note">{closeoutGaps.note}</p>
    </DataPanel>
  );
}

function ReleaseBaselineResolver({ baseline }) {
  if (baseline?.state === 'missing' || baseline === undefined || baseline === null) {
    return <EmptyBlock copy="release baseline resolver 未暴露。" />;
  }

  return (
    <div className="release-baseline-resolver">
      <FieldList rows={[
        ['modelName', baseline.modelName],
        ['state', textValue(baseline.state)],
        ['sourcePolicy', baseline.sourcePolicy],
        ['goalId', baseline.goalId],
        ['taskId', baseline.taskId],
        ['role', baseline.role],
        ['phase', baseline.phase],
        ['reason', baseline.reason],
        ['activeTaskTitle', baseline.activeTaskTitle],
        ['activeTaskBranch', baseline.activeTaskBranch],
        ['expectedWorkerEvent', baseline.activeTaskExpectedWorkerEvent],
        ['workerEvidenceRef', baseline.currentWorkerEvidenceRef],
        ['currentBranch', baseline.currentBranch],
        ['currentHead', baseline.currentHead],
        ['mainHead', baseline.mainHead],
        ['originMainHead', baseline.originMainHead],
        ['worktree.clean', baseline.worktree?.clean],
        ['worktree.dirty', baseline.worktree?.dirty],
        ['worktree.dirtyFilesCount', baseline.worktree?.dirtyFilesCount],
        ['releaseReadinessAllowed', baseline.judgment?.releaseReadinessAllowed],
        ['stopReason', baseline.judgment?.stopReason],
        ['finalJudgmentFromFallbackCheckout', baseline.judgment?.finalJudgmentFromFallbackCheckout],
        ['mainVerifiedTaskCount', baseline.judgment?.mainVerifiedTaskCount],
        ['explicitEventCount', baseline.judgment?.explicitEventCount]
      ]} />
      <Subsection title="PR / CI ref">
        <FieldList rows={[
          ['status', baseline.prCiRef?.status],
          ['workflowName', baseline.prCiRef?.workflowName],
          ['displayTitle', baseline.prCiRef?.displayTitle],
          ['headBranch', baseline.prCiRef?.headBranch],
          ['headSha', baseline.prCiRef?.headSha],
          ['conclusion', baseline.prCiRef?.conclusion],
          ['createdAt', baseline.prCiRef?.createdAt],
          ['source', baseline.prCiRef?.source]
        ]} />
      </Subsection>
      <Subsection title="dirty paths">
        <TextItemList items={baseline.worktree?.dirtyPaths} emptyCopy="dirty paths 为空。" />
      </Subsection>
      <Subsection title="stop / fix guidance">
        <TextItemList items={baseline.fixGuidance} emptyCopy="stop / fix guidance 为空。" />
      </Subsection>
      <Subsection title="fixed command outputs">
        <ReleaseBaselineCommandOutputList outputs={baseline.commandOutputs} />
      </Subsection>
      <Subsection title="copy-only baseline commands">
        <TextItemList items={baseline.copyOnlyCommands} emptyCopy="baseline commands 未暴露。" />
      </Subsection>
      <Subsection title="safety">
        <FieldList rows={[
          ['readOnly', baseline.safety?.readOnly],
          ['copyOnly', baseline.safety?.copyOnly],
          ['browserExecutionAvailable', baseline.safety?.browserExecutionAvailable],
          ['genericShellRunner', baseline.safety?.genericShellRunner],
          ['modelInvocationAvailable', baseline.safety?.modelInvocationAvailable],
          ['releaseReadyBlockedWhenDirtyOrNonMain', baseline.safety?.releaseReadyBlockedWhenDirtyOrNonMain],
          ['infersReadinessFromBranchName', baseline.safety?.infersReadinessFromBranchName],
          ['infersReadinessFromCommandText', baseline.safety?.infersReadinessFromCommandText]
        ]} />
      </Subsection>
      <p className="panel-note">{baseline.note?.text}</p>
    </div>
  );
}

function ReleaseBaselineCommandOutputList({ outputs }) {
  if (outputs?.state === 'missing' || outputs === undefined || outputs === null) {
    return <EmptyBlock copy="fixed command outputs 未暴露。" />;
  }

  if (!Array.isArray(outputs.items) || outputs.items.length === 0) {
    return <EmptyBlock copy="fixed command outputs 为空。" />;
  }

  return (
    <ul className="release-baseline-command-output-list">
      {outputs.items.map((output, index) => (
        <li key={`${output.id.text}-${index}`}>
          <FieldList rows={[
            ['id', output.id],
            ['command', output.command],
            ['status', output.status],
            ['exitCode', output.exitCode],
            ['stdout', output.stdout],
            ['stderr', output.stderr]
          ]} />
        </li>
      ))}
    </ul>
  );
}

function ReleaseVerificationChecklist({
  checklist,
  onGoalEventConfirmed
}) {
  if (checklist?.state === 'missing') {
    return <EmptyBlock copy="release verification checklist 未暴露。" />;
  }

  return (
    <div className="release-verification-checklist">
      <FieldList rows={[
        ['sourceContract', checklist.sourceContract],
        ['closeoutCommand', checklist.closeoutCommand],
        ['totalCount', checklist.totalCount],
        ['passedCount', checklist.passedCount],
        ['pendingCount', checklist.pendingCount],
        ['copyOnlyCommands', checklist.safety.copyOnlyCommands],
        ['goalGatePreviewAvailable', checklist.safety.goalGatePreviewAvailable],
        ['confirmRequiresPlanHash', checklist.safety.confirmRequiresPlanHash],
        ['appendOnlyOnConfirm', checklist.safety.appendOnlyOnConfirm],
        ['genericShellRunner', checklist.safety.genericShellRunner],
        ['modelInvocationAvailable', checklist.safety.modelInvocationAvailable],
        ['releaseReadyInferredFromCommands', checklist.safety.releaseReadyInferredFromCommands]
      ]} />
      {checklist.items.length === 0 ? (
        <EmptyBlock copy="release checklist rows 为空。" />
      ) : (
        <ul className="release-checklist-list">
          {checklist.items.map((item) => (
            <li key={item.id.text}>
              <FieldList rows={[
                ['label', item.label],
                ['gate', item.gate],
                ['gateId', item.gateId],
                ['status', item.status],
                ['eventBackedStatus', item.eventBackedStatus],
                ['latestEventId', item.latestEventId],
                ['latestEventType', item.latestEventType],
                ['latestRecordedAt', item.latestRecordedAt],
                ['latestVerifier', item.latestVerifier],
                ['command', item.command],
                ['registrationCommand', item.registrationCommand],
                ['dryRunCommand', item.dryRunCommand],
                ['confirmCommandPattern', item.confirmCommandPattern],
                ['needsEvidence', item.needsEvidence]
              ]} />
              <Subsection title="release gate evidence refs">
                <EvidenceRefList evidenceRefs={item.evidenceRefs} />
              </Subsection>
              <Subsection title="release gate registration">
                <ReleaseGateRegistration
                  registration={item.registration}
                  onGoalEventConfirmed={onGoalEventConfirmed}
                />
              </Subsection>
            </li>
          ))}
        </ul>
      )}
      <p className="panel-note">{checklist.note.text}</p>
    </div>
  );
}

function ReleaseGateRegistration({
  registration,
  onGoalEventConfirmed
}) {
  if (registration?.state === 'missing') {
    return <EmptyBlock copy="release gate registration form 未暴露。" />;
  }

  return (
    <div className="release-gate-registration">
      <FieldList rows={[
        ['state', textValue(registration.state)],
        ['sourcePolicy', registration.sourcePolicy],
        ['currentStatus', registration.currentStatus],
        ['latestEventId', registration.latestEventId],
        ['latestEventType', registration.latestEventType],
        ['releaseGateEvidencePath', registration.releaseGateEvidencePath],
        ['dryRunCommand', registration.dryRunCommand],
        ['confirmCommandPattern', registration.confirmCommandPattern],
        ['confirmRequiresPlanHash', registration.safety.confirmRequiresPlanHash],
        ['appendOnlyOnConfirm', registration.safety.appendOnlyOnConfirm],
        ['workbenchWriteAvailable', registration.safety.workbenchWriteAvailable],
        ['usesGoalGateOnly', registration.safety.usesGoalGateOnly],
        ['browserExecutionAvailable', registration.safety.browserExecutionAvailable],
        ['modelInvocationAvailable', registration.safety.modelInvocationAvailable],
        ['arbitraryShellAccepted', registration.safety.arbitraryShellAccepted],
        ['releaseReadyAvailable', registration.safety.releaseReadyAvailable],
        ['commandSuccessImpliesGatePassed', registration.safety.commandSuccessImpliesGatePassed]
      ]} />
      <EvidenceRefList evidenceRefs={registration.latestEvidenceRefs} />
      <GoalEventFormList
        forms={registration.forms}
        emptyCopy="release gate forms 不可用。"
        onGoalEventConfirmed={onGoalEventConfirmed}
      />
      <p className="panel-note">{registration.note.text}</p>
    </div>
  );
}

function ReleaseReadyGateRegistration({
  registration,
  onGoalEventConfirmed
}) {
  if (registration?.state === 'missing') {
    return <EmptyBlock copy="release.ready gate registration form 未暴露。" />;
  }

  return (
    <div className="release-ready-registration">
      <FieldList rows={[
        ['state', textValue(registration.state)],
        ['sourcePolicy', registration.sourcePolicy],
        ['baselineState', registration.baselineState],
        ['baselineStopReason', registration.baselineStopReason],
        ['baselineReleaseReadinessAllowed', registration.baselineReleaseReadinessAllowed],
        ['missingReleaseReady', registration.missingReleaseReady],
        ['closeoutMissingCount', registration.closeoutMissingCount],
        ['closeoutBlockingGapCount', registration.closeoutBlockingGapCount],
        ['requiredReleaseGatesPassed', registration.requiredReleaseGatesPassed],
        ['releaseEvidencePath', registration.releaseEvidencePath],
        ['dryRunCommand', registration.dryRunCommand],
        ['confirmCommandPattern', registration.confirmCommandPattern],
        ['confirmRequiresPlanHash', registration.safety.confirmRequiresPlanHash],
        ['appendOnlyOnConfirm', registration.safety.appendOnlyOnConfirm],
        ['workbenchWriteAvailable', registration.safety.workbenchWriteAvailable],
        ['declaresReleaseReadyOnlyOnConfirm', registration.safety.declaresReleaseReadyOnlyOnConfirm],
        ['dirtyOrNonMainBlocksFinalJudgment', registration.safety.dirtyOrNonMainBlocksFinalJudgment],
        ['closeoutGapsBlockConfirm', registration.safety.closeoutGapsBlockConfirm],
        ['unknownOrMissingReleaseGatesBlockConfirm', registration.safety.unknownOrMissingReleaseGatesBlockConfirm],
        ['frontendInferenceAvailable', registration.safety.frontendInferenceAvailable]
      ]} />
      <Subsection title="pending required release gates">
        <TextItemList items={registration.pendingRequiredReleaseGateIds} emptyCopy="required release gates 已全部 passed。" />
      </Subsection>
      {registration.form === null ? (
        <Subsection title="stop / fix guidance">
          <TextItemList items={registration.stopGuidance} emptyCopy="stop / fix guidance 未暴露。" />
        </Subsection>
      ) : (
        <GoalEventFormList
          forms={{
            state: 'available',
            items: [registration.form]
          }}
          emptyCopy="release.ready gate form 不可用。"
          onGoalEventConfirmed={onGoalEventConfirmed}
        />
      )}
      <p className="panel-note">{registration.note.text}</p>
    </div>
  );
}

function ReleaseEvidenceDraft({ draft }) {
  if (draft?.state === 'missing') {
    return <EmptyBlock copy="release evidence draft 未暴露。" />;
  }

  return (
    <div className="release-evidence-draft">
      <FieldList rows={[
        ['modelName', draft.modelName],
        ['sourcePolicy', draft.sourcePolicy],
        ['goalId', draft.goalId],
        ['releaseName', draft.releaseName],
        ['evidencePath', draft.evidencePath],
        ['tagEvidencePath', draft.tagEvidencePath],
        ['targetCommit', draft.targetCommit],
        ['targetCommitSource', draft.targetCommitSource],
        ['copyOnly', draft.safety.copyOnly],
        ['writesEvidenceFile', draft.safety.writesEvidenceFile],
        ['runsShell', draft.safety.runsShell],
        ['declaresReleaseReady', draft.safety.declaresReleaseReady],
        ['createsTag', draft.safety.createsTag],
        ['pushesTag', draft.safety.pushesTag],
        ['publishesRelease', draft.safety.publishesRelease],
        ['infersStatusFromFilenames', draft.safety.infersStatusFromFilenames]
      ]} />
      <Subsection title="release notes summary">
        <TextItemList items={draft.releaseNotesSummary} emptyCopy="release notes summary 为空。" />
      </Subsection>
      <Subsection title="command result fields">
        <ReleaseEvidenceCommandResultList commandResults={draft.commandResults} />
      </Subsection>
      <pre className="prompt-preview-text"><code>{draft.markdown.text}</code></pre>
      <p className="panel-note">{draft.boundaryText.text}</p>
    </div>
  );
}

function ReleaseEvidenceCommandResultList({ commandResults }) {
  if (commandResults?.state === 'missing' || commandResults === undefined || commandResults === null) {
    return <EmptyBlock copy="command result fields 未暴露。" />;
  }

  if (!Array.isArray(commandResults.items) || commandResults.items.length === 0) {
    return <EmptyBlock copy="command result fields 为空。" />;
  }

  return (
    <ul className="release-command-result-list">
      {commandResults.items.map((item, index) => (
        <li key={`${item.gate.text}-${index}`}>
          <FieldList rows={[
            ['gate', item.gate],
            ['label', item.label],
            ['command', item.command],
            ['resultStatus', item.resultStatus],
            ['latestEventId', item.latestEventId],
            ['latestVerifier', item.latestVerifier],
            ['latestEvidenceRef', item.latestEvidenceRef],
            ['commandOutputRequired', item.commandOutputRequired]
          ]} />
        </li>
      ))}
    </ul>
  );
}

function TagEvidencePrompt({ prompt }) {
  if (prompt?.state === 'missing') {
    return <EmptyBlock copy="tag evidence draft 未暴露。" />;
  }

  return (
    <div className="tag-evidence-prompt">
      <FieldList rows={[
        ['modelName', prompt.modelName],
        ['sourceContract', prompt.sourceContract],
        ['sourcePolicy', prompt.sourcePolicy],
        ['evidencePath', prompt.evidencePath],
        ['releaseEvidencePath', prompt.releaseEvidencePath],
        ['tagRecommendation', prompt.tagRecommendation],
        ['targetCommit', prompt.targetCommit],
        ['targetCommitSource', prompt.targetCommitSource],
        ['copyOnlyTagCommand', prompt.copyOnlyTagCommand],
        ['latestTagGateEventId', prompt.latestTagGateEventId],
        ['latestTagGateStatus', prompt.latestTagGateStatus],
        ['promptFormat', prompt.promptFormat],
        ['copyOnly', prompt.safety.copyOnly],
        ['createsTag', prompt.safety.createsTag],
        ['tagExecutionAvailable', prompt.safety.tagExecutionAvailable],
        ['pushesTag', prompt.safety.pushesTag],
        ['publishesRelease', prompt.safety.publishesRelease],
        ['mergeAvailable', prompt.safety.mergeAvailable],
        ['declaresReleaseReady', prompt.safety.declaresReleaseReady],
        ['runsShell', prompt.safety.runsShell],
        ['opensLocalFiles', prompt.safety.opensLocalFiles],
        ['downloadsArtifacts', prompt.safety.downloadsArtifacts]
      ]} />
      <Subsection title="release notes summary">
        <TextItemList items={prompt.releaseNotesSummary} emptyCopy="release notes summary 为空。" />
      </Subsection>
      <Subsection title="tag command result fields">
        <FieldList rows={[
          ['command', prompt.commandResultFields?.command],
          ['result', prompt.commandResultFields?.result],
          ['exitCode', prompt.commandResultFields?.exitCode],
          ['stdout', prompt.commandResultFields?.stdout],
          ['stderr', prompt.commandResultFields?.stderr],
          ['evidenceRef', prompt.commandResultFields?.evidenceRef]
        ]} />
      </Subsection>
      <Subsection title="tag evidence gate refs">
        <EvidenceRefList evidenceRefs={prompt.latestTagEvidenceRefs} />
      </Subsection>
      <pre className="prompt-preview-text"><code>{prompt.text.text}</code></pre>
      <p className="panel-note">{prompt.boundaryText.text}</p>
    </div>
  );
}

function NextVersionHandoffDraft({ draft }) {
  if (draft?.state === 'missing') {
    return <EmptyBlock copy="next-version handoff draft 未暴露。" />;
  }

  return (
    <div className="next-version-handoff-draft">
      <FieldList rows={[
        ['modelName', draft.modelName],
        ['sourcePolicy', draft.sourcePolicy],
        ['goalId', draft.goalId],
        ['releaseName', draft.releaseName],
        ['currentVersion', draft.currentVersion],
        ['nextVersion', draft.nextVersion],
        ['targetCommit', draft.targetCommit],
        ['targetCommitSource', draft.targetCommitSource],
        ['latestRunId', draft.latestRunId],
        ['releaseReady', draft.releaseReady],
        ['releaseReadySource', draft.releaseReadySource],
        ['releaseReadyEventId', draft.releaseReadyEventId],
        ['closeoutMissingCount', draft.closeoutMissingCount]
      ]} />
      <Subsection title="source refs">
        <TextItemList items={draft.sourceRefs} emptyCopy="source refs 未暴露。" />
      </Subsection>
      <Subsection title="evidence anchors">
        <EvidenceRefList evidenceRefs={draft.evidenceRefs} />
      </Subsection>
      <Subsection title="task anchors">
        <NextVersionTaskAnchorList anchors={draft.taskAnchors} />
      </Subsection>
      <Subsection title="release gate anchors">
        <NextVersionReleaseGateAnchorList anchors={draft.releaseGateAnchors} />
      </Subsection>
      <Subsection title="implemented capabilities">
        <NextVersionCapabilityList capabilities={draft.implementedCapabilities} />
      </Subsection>
      <Subsection title="copy-only context commands">
        <TextItemList items={draft.copyOnlyCommands} emptyCopy="copy-only context commands 未暴露。" />
      </Subsection>
      <Subsection title="safety">
        <FieldList rows={[
          ['copyOnly', draft.safety.copyOnly],
          ['createsManagedGoal', draft.safety.createsManagedGoal],
          ['entersNextVersion', draft.safety.entersNextVersion],
          ['runsShell', draft.safety.runsShell],
          ['invokesModel', draft.safety.invokesModel],
          ['readsEvidenceBodies', draft.safety.readsEvidenceBodies],
          ['opensLocalFiles', draft.safety.opensLocalFiles],
          ['downloadsArtifacts', draft.safety.downloadsArtifacts],
          ['mergesBranches', draft.safety.mergesBranches],
          ['pushesBranchesOrTags', draft.safety.pushesBranchesOrTags],
          ['createsTag', draft.safety.createsTag],
          ['publishesRelease', draft.safety.publishesRelease],
          ['declaresReleaseReady', draft.safety.declaresReleaseReady],
          ['selfApprovalAvailable', draft.safety.selfApprovalAvailable],
          ['v8TopLevelModel', draft.safety.v8TopLevelModel],
          ['infersStateFromFilenames', draft.safety.infersStateFromFilenames],
          ['infersStateFromBranches', draft.safety.infersStateFromBranches],
          ['infersStateFromPrompts', draft.safety.infersStateFromPrompts]
        ]} />
      </Subsection>
      <pre className="prompt-preview-text"><code>{draft.markdown.text}</code></pre>
      <p className="panel-note">{draft.boundaryText.text}</p>
    </div>
  );
}

function NextVersionTaskAnchorList({ anchors }) {
  if (anchors?.state === 'missing' || anchors === undefined || anchors === null) {
    return <EmptyBlock copy="task anchors 未暴露。" />;
  }

  if (!Array.isArray(anchors.items) || anchors.items.length === 0) {
    return <EmptyBlock copy="task anchors 为空。" />;
  }

  return (
    <ul className="next-version-anchor-list">
      {anchors.items.map((item, index) => (
        <li key={`${item.taskId.text}-${index}`}>
          <FieldList rows={[
            ['taskId', item.taskId],
            ['title', item.title],
            ['status', item.status],
            ['workerEvidenceRef', item.workerEvidenceRef],
            ['reviewEvidenceRef', item.reviewEvidenceRef],
            ['reviewVerdict', item.reviewVerdict],
            ['mainVerificationRef', item.mainVerificationRef],
            ['statusSource', item.statusSource]
          ]} />
        </li>
      ))}
    </ul>
  );
}

function NextVersionReleaseGateAnchorList({ anchors }) {
  if (anchors?.state === 'missing' || anchors === undefined || anchors === null) {
    return <EmptyBlock copy="release gate anchors 未暴露。" />;
  }

  if (!Array.isArray(anchors.items) || anchors.items.length === 0) {
    return <EmptyBlock copy="release gate anchors 为空。" />;
  }

  return (
    <ul className="next-version-anchor-list">
      {anchors.items.map((item, index) => (
        <li key={`${item.gate.text}-${index}`}>
          <FieldList rows={[
            ['gate', item.gate],
            ['label', item.label],
            ['status', item.status],
            ['latestEventId', item.latestEventId],
            ['latestEvidenceRef', item.latestEvidenceRef],
            ['command', item.command]
          ]} />
        </li>
      ))}
    </ul>
  );
}

function NextVersionCapabilityList({ capabilities }) {
  if (capabilities?.state === 'missing' || capabilities === undefined || capabilities === null) {
    return <EmptyBlock copy="implemented capabilities 未暴露。" />;
  }

  if (!Array.isArray(capabilities.items) || capabilities.items.length === 0) {
    return <EmptyBlock copy="implemented capabilities 为空。" />;
  }

  return (
    <ul className="next-version-capability-list">
      {capabilities.items.map((item, index) => (
        <li key={`${item.name.text}-${index}`}>
          <FieldList rows={[
            ['name', item.name],
            ['state', item.state],
            ['source', item.source]
          ]} />
        </li>
      ))}
    </ul>
  );
}

function GoalOperationConsolePanel({ operationConsole, route }) {
  return (
    <DataPanel
      id="goal-operation-console-panel"
      kicker="v23 goal operations"
      title="Goal Operation Console"
      state={goalOperationConsoleStateText(operationConsole, route)}
      route={route}
    >
      {route?.state === 'failed' ? (
        <p className="error-copy">错误摘要：{route.error}。刷新页面后会重新读取 operation registry。</p>
      ) : null}

      <FieldList rows={[
        ['contractName', operationConsole.contractName],
        ['contractVersion', operationConsole.contractVersion],
        ['goalId', operationConsole.goalId],
        ['storage', operationConsole.storage],
        ['operation count', operationConsole.operationCount],
        ['latestOperationId', operationConsole.latestOperationId],
        ['polling.enabled', operationConsole.polling.enabled],
        ['polling.intervalMs', operationConsole.polling.intervalMs],
        ['polling.route', operationConsole.polling.route],
        ['polling.reason', operationConsole.polling.reason],
        ['next.taskId', operationConsole.nextAction.taskId],
        ['next.role', operationConsole.nextAction.role],
        ['next.phase', operationConsole.nextAction.phase],
        ['next.status', operationConsole.nextAction.status],
        ['next.reason', operationConsole.nextAction.reason]
      ]} />

      <Subsection title="latest operation">
        <OperationConsoleRunCard run={operationConsole.latest} />
      </Subsection>

      <Subsection title="operation history">
        <OperationConsoleRunList runs={operationConsole.items} />
      </Subsection>

      <p className="panel-note">{operationConsole.note}</p>
    </DataPanel>
  );
}

function goalOperationPollingEnabled(model) {
  return model?.activeGoal?.operationConsole?.polling?.enabled?.value === true;
}

function OperationConsoleRunCard({ run }) {
  if (run.state !== 'available') {
    return <EmptyBlock copy="当前没有 Workbench goal operation run。" />;
  }

  return (
    <div className="operation-console-run">
      <FieldList rows={[
        ['operationId', run.operationId],
        ['status', run.status],
        ['commandName', run.commandName],
        ['commandKind', run.commandKind],
        ['taskId', run.taskId],
        ['role', run.role],
        ['exitCode', run.exitCode],
        ['planHash', run.planHash],
        ['eventIds', run.eventIds],
          ['runId', run.runResult.runId],
          ['suiteId', run.runResult.suiteId],
          ['run.status', run.runResult.status],
          ['commandCount', run.runResult.commandCount],
          ['failedCommandCount', run.runResult.failedCommandCount],
          ['gatePassed', run.runResult.gatePassed],
          ['verifierStatus', run.runResult.verifierStatus],
        ['artifact count', run.artifactRefs.count],
        ['failureReason', run.failureReason],
        ['startedAt', run.startedAt],
        ['updatedAt', run.updatedAt],
        ['completedAt', run.completedAt]
      ]} />
      <Subsection title="run result">
        <FieldList rows={[
          ['plannedRunId', run.runResult.plannedRunId],
          ['executionPlanId', run.runResult.executionPlanId],
          ['exitCode', run.runResult.exitCode],
          ['writeBoundary', run.runResult.writeBoundary],
          ['mainWorktreeWrites', run.runResult.mainWorktreeWrites],
          ['workspaceWrites', run.runResult.workspaceWrites],
          ['sourceWorkspacePath', run.runResult.sourceWorkspacePath],
          ['sourceWorkspaceManifestPath', run.runResult.sourceWorkspaceManifestPath],
          ['evidenceArtifactPath', run.runResult.evidenceArtifactPath]
        ]} />
      </Subsection>
      <Subsection title="artifact refs / verifier summary">
        <OperationArtifactRefList artifactRefs={run.artifactRefs} />
        <FieldList rows={[
          ['verifier.status', run.verifierSummary.status],
          ['verifier.runStatus', run.verifierSummary.runStatus],
          ['verifier.passed', run.verifierSummary.passed],
          ['verifier.changedFileCount', run.verifierSummary.changedFileCount],
          ['verifier.artifactCount', run.verifierSummary.artifactCount],
          ['verifier.failureReason', run.verifierSummary.failureReason]
        ]} />
      </Subsection>
      <div className="operation-console-streams" aria-label="operation console output">
        <label>
          <span>command preview</span>
          <pre><code>{run.commandPreview.text}</code></pre>
        </label>
        <label>
          <span>stdout</span>
          <pre><code>{run.stdout.text}</code></pre>
        </label>
        <label>
          <span>stderr</span>
          <pre><code>{run.stderr.text}</code></pre>
        </label>
      </div>
    </div>
  );
}

function OperationArtifactRefList({ artifactRefs }) {
  const items = Array.isArray(artifactRefs?.items) ? artifactRefs.items : [];

  if (items.length === 0) {
    return <EmptyBlock copy="artifact refs 未暴露。" />;
  }

  return (
    <ul className="operation-artifact-ref-list">
      {items.map((artifact, index) => (
        <li key={`${artifact.kind.text}-${artifact.path.text}-${index}`}>
          <FieldList rows={[
            ['kind', artifact.kind],
            ['path', artifact.path],
            ['ref', artifact.ref],
            ['uri', artifact.uri],
            ['status', artifact.status]
          ]} />
        </li>
      ))}
    </ul>
  );
}

function OperationConsoleRunList({ runs }) {
  if (!Array.isArray(runs) || runs.length === 0) {
    return <EmptyBlock copy="operation history 为空。" />;
  }

  return (
    <ul className="operation-console-list">
      {runs.slice().reverse().map((run) => (
        <li key={run.operationId.text}>
          <OperationConsoleRunCard run={run} />
        </li>
      ))}
    </ul>
  );
}

function CapabilitiesPanel({ capabilities, route }) {
  return (
    <DataPanel
      id="capabilities-panel"
      kicker="v17 capabilities"
      title="Capabilities Contract"
      state={routeStateText(route)}
      route={route}
    >
      <FieldList rows={[
        ['contractName', capabilities.contractName],
        ['contractVersion', capabilities.contractVersion],
        ['readOnly', capabilities.readOnly],
        ['displayOnly', capabilities.displayOnly],
        ['copyOnly', capabilities.copyOnly],
        ['mutationAvailable', capabilities.mutationAvailable],
        ['browserExecutionAvailable', capabilities.browserExecutionAvailable],
        ['modelInvocationAvailable', capabilities.modelInvocationAvailable],
        ['artifactDownloadAvailable', capabilities.artifactDownloadAvailable],
        ['safePreview.available', capabilities.safePreview.available],
        ['safePreview.inlineModes', capabilities.safePreview.inlineModes],
        ['rawHtmlInlineAvailable', capabilities.safePreview.rawHtmlInlineAvailable],
        ['svgInlineAvailable', capabilities.safePreview.svgInlineAvailable],
        ['javascriptInlineAvailable', capabilities.safePreview.javascriptInlineAvailable],
        ['binaryInlineAvailable', capabilities.safePreview.binaryInlineAvailable]
      ]} />

      <Subsection title="routes">
        <KeyValueList rows={capabilities.routes} nameKey="route" valueKey="available" emptyCopy="routes 未暴露。" />
      </Subsection>

      <p className="panel-note">{capabilities.note}</p>
    </DataPanel>
  );
}

function DiagnosticsV1Panel({ diagnostics, route }) {
  return (
    <DataPanel
      id="diagnostics-v1-panel"
      kicker="v17 diagnostics"
      title="Diagnostics Contract"
      state={routeStateText(route)}
      route={route}
    >
      <FieldList rows={[
        ['contractName', diagnostics.contractName],
        ['contractVersion', diagnostics.contractVersion],
        ['status', diagnostics.status],
        ['check count', diagnostics.checks.count]
      ]} />

      <Subsection title="checks">
        <DiagnosticsCheckList checks={diagnostics.checks} />
      </Subsection>

      <Subsection title="boundaries">
        <KeyValueList rows={diagnostics.boundaries} nameKey="boundary" valueKey="available" emptyCopy="boundaries 未暴露。" />
      </Subsection>

      <p className="panel-note">{diagnostics.note}</p>
    </DataPanel>
  );
}

function SummaryPanel({ summary, route }) {
  return (
    <DataPanel
      id="summary-panel"
      kicker="Summary panel"
      title="Summary 只读摘要"
      state={routeStateText(route)}
      route={route}
    >
      <FieldList rows={[
        ['contractName', summary.contractName],
        ['contractVersion', summary.contractVersion],
        ['status', summary.status],
        ['generatedAt', summary.generatedAt],
        ['readOnly', summary.readOnly],
        ['modelInvocation', summary.modelInvocation],
        ['capabilities', summary.capabilities],
        ['overview.status', summary.overviewStatus],
        ['stageSummary.stageId', summary.stageId],
        ['stageSummary.status', summary.stageStatus],
        ['runStats.total', summary.runCount]
      ]} />

      <Subsection title="latestRun 简要信息">
        <FieldList rows={[
          ['runId', summary.latestRun.runId],
          ['status', summary.latestRun.status],
          ['verifierStatus', summary.latestRun.verifierStatus],
          ['updatedAt', summary.latestRun.updatedAt]
        ]} />
      </Subsection>

      <Subsection title="adoptionSummary">
        <FieldList rows={[
          ['status', summary.adoptionSummary.status],
          ['pendingCount', summary.adoptionSummary.pendingCount],
          ['dirtyBlocked', summary.adoptionSummary.dirtyBlocked]
        ]} />
      </Subsection>

      <p className="panel-note">{summary.readonlyNote}</p>
    </DataPanel>
  );
}

function ReadinessPanel({ readiness, route }) {
  return (
    <DataPanel
      id="readiness-panel"
      kicker="Readiness panel"
      title="Readiness 只读诊断"
      state={routeStateText(route)}
      route={route}
    >
      <FieldList rows={[
        ['contractName', readiness.contractName],
        ['contractVersion', readiness.contractVersion],
        ['status', readiness.status],
        ['readOnly', readiness.readOnly],
        ['modelInvocation', readiness.modelInvocation],
        ['capabilities', readiness.capabilities],
        ['tools.git.dirty', readiness.gitDirty],
        ['tools.git.dirtyFilesCount', readiness.dirtyFilesCount],
        ['tools.packageManager.status', readiness.packageManagerStatus]
      ]} />

      <Subsection title="checks">
        <CheckList checks={readiness.checks} />
      </Subsection>

      <Subsection title="diagnostics / attention items">
        <RiskList riskSummary={readiness.diagnostics} />
      </Subsection>

      <Subsection title="Stage 与 artifact 状态">
        <FieldList rows={[
          ['stage status', readiness.signals.stageStatus],
          ['blocked Stage', readiness.signals.stageBlockerStatus],
          ['blocker title', readiness.signals.stageBlockerTitle],
          ['Charter consistency', readiness.signals.charterConsistencyStatus],
          ['artifact status', readiness.signals.artifactStatus],
          ['missing artifact count', readiness.signals.missingArtifactCount]
        ]} />
      </Subsection>

      <p className="panel-note">{readiness.signals.note}</p>
      <p className="panel-note">{readiness.readonlyNote}</p>
    </DataPanel>
  );
}

function RunsPanel({ runs, route }) {
  return (
    <DataPanel
      id="runs-panel"
      kicker="Runs panel"
      title="Runs 只读列表"
      state={routeStateText(route)}
      route={route}
    >
      <FieldList rows={[
        ['contractName', runs.contractName],
        ['contractVersion', runs.contractVersion],
        ['filter', runs.filter],
        ['route count', runs.count],
        ['summary count', runs.summaryCount],
        ['availableFilters', textValue(runs.availableFilters.join('、') || '未暴露')]
      ]} />

      {runs.state === 'missing' ? <EmptyBlock copy="runs list 未暴露或不可用。" /> : null}
      {runs.state === 'empty' ? <EmptyBlock copy="当前没有运行记录。" /> : null}
      {runs.state === 'available' ? <RunList runs={runs.items} /> : null}

      <p className="panel-note">Runs panel 只展示本地只读列表；latest 标识来自 summary/latestRun 已暴露 id，对浏览器端没有写入含义。</p>
    </DataPanel>
  );
}

function LatestRunPanel({ latestRun, route }) {
  return (
    <DataPanel
      id="latest-run-panel"
      kicker="Latest run panel"
      title="Latest run 只读详情"
      state={latestRunStateText(latestRun, route)}
      route={route}
    >
      {latestRun.state === 'unavailable' ? <EmptyBlock copy={`错误摘要：${latestRun.error}`} /> : null}
      {latestRun.state === 'empty' ? <EmptyBlock copy="当前没有 latest run；artifactRefs 与 timeline 不适用。" /> : null}

      <FieldList rows={[
        ['runId', latestRun.runId],
        ['status', latestRun.status],
        ['verifierStatus', latestRun.verifierStatus],
        ['modelInvocation', latestRun.modelInvocation],
        ['executionPlanId', latestRun.executionPlanId],
        ['adoptionPlanId', latestRun.adoptionPlanId],
        ['evidenceArtifactPath', latestRun.evidenceArtifactPath],
        ['sourceWorkspacePath', latestRun.sourceWorkspacePath],
        ['createdAt', latestRun.createdAt],
        ['updatedAt', latestRun.updatedAt],
        ['artifactRefs count', latestRun.artifactRefsCount],
        ['timeline', textValue(latestRun.timeline.text)]
      ]} />

      <Subsection title="artifactRefs 只读列表">
        <ArtifactRefList artifactRefs={latestRun.artifactRefs} />
      </Subsection>

      <p className="panel-note">Latest run panel 只展示后端已暴露 artifact refs 与 safe preview 字段；React 端不根据 kind、路径、扩展名或内容决定 inline preview。</p>
    </DataPanel>
  );
}

function TimelinePanel({ timeline, route }) {
  return (
    <DataPanel
      id="timeline-panel"
      kicker="Timeline panel"
      title="Latest run timeline"
      state={timelineStateText(timeline, route)}
      route={route}
    >
      <FieldList rows={[
        ['contractName', timeline.contractName],
        ['contractVersion', timeline.contractVersion],
        ['runId', timeline.runId],
        ['event count', timeline.count]
      ]} />

      <Subsection title="timeline entries">
        <TimelineList timeline={timeline} />
      </Subsection>

      <p className="panel-note">{timeline.note}</p>
    </DataPanel>
  );
}

function ArtifactListPanel({ artifactRefs }) {
  return (
    <DataPanel
      id="artifact-list-panel"
      kicker="Artifact refs/list panel"
      title="Artifact refs 只读列表"
      state={artifactRefs.state === 'missing' ? '未暴露' : '只读'}
    >
      <FieldList rows={[
        ['registered refs', textValue(artifactRefs.label)],
        ['artifactStatus.status', artifactRefs.status.status],
        ['artifactStatus.total', artifactRefs.status.total],
        ['artifactStatus.available', artifactRefs.status.available],
        ['artifactStatus.missing', artifactRefs.status.missing],
        ['artifactStatus.unknown', artifactRefs.status.unknown],
        ['missingKinds', artifactRefs.status.missingKinds],
        ['safe preview routes', textValue(artifactRefs.previewRoutes.label)],
        ['unregistered kind route', artifactRefs.unregistered]
      ]} />

      <Subsection title="artifact refs/list">
        <ArtifactRefList artifactRefs={artifactRefs} />
      </Subsection>

      <p className="panel-note">Artifact panel 只使用 latest run 已暴露 uri 调用后端 safe preview route；不读取本地文件，不拼接 /@fs/ URL，不根据文件类型推断安全性。</p>
    </DataPanel>
  );
}

function AdoptionSummaryPanel({ adoption }) {
  return (
    <DataPanel
      id="adoption-summary-panel"
      kicker="Adoption summary panel"
      title="Adoption summary 只读状态"
      state="只读"
    >
      <FieldList rows={[
        ['status', adoption.status],
        ['pendingCount', adoption.pendingCount],
        ['dirtyBlocked', adoption.dirtyBlocked],
        ['Git dirty readiness', adoption.gitDirtyReadiness]
      ]} />

      <p className="panel-note">{adoption.note}</p>
    </DataPanel>
  );
}

function AdoptionCandidatePanel({ candidates }) {
  return (
    <DataPanel
      id="adoption-candidate-panel"
      kicker="v30 adoption candidates"
      title="Adoption candidate normalization"
      state={candidates.state === 'available' ? `${candidates.count.text} candidates / ${candidates.blockedCount.text} blocked` : candidates.state}
    >
      <FieldList rows={[
        ['goalId', candidates.goalId],
        ['taskId', candidates.taskId],
        ['sourceContract', candidates.sourceContract],
        ['routeState', candidates.routeState],
        ['route', candidates.route],
        ['candidate count', candidates.count],
        ['blocked count', candidates.blockedCount],
        ['total runs scanned', candidates.totalRunsScanned],
        ['status criterion', candidates.criteria.status],
        ['verifier criterion', candidates.criteria.verifierStatus],
        ['artifactRefs criterion', candidates.criteria.artifactRefs],
        ['workspace criterion', candidates.criteria.workspace],
        ['fingerprint criterion', candidates.criteria.fingerprint],
        ['mainWorktreeWrites criterion', candidates.criteria.mainWorktreeWrites],
        ['genericShellRunner', candidates.safety.genericShellRunner],
        ['workerCanApproveOwnTask', candidates.safety.workerCanApproveOwnTask]
      ]} />

      {candidates.state === 'missing' ? <EmptyBlock copy="operation/runs contract 未暴露，无法列出 adoption candidates。" /> : null}
      {candidates.state === 'empty' ? <EmptyBlock copy="当前没有 implementation run 可归一化。" /> : null}
      {candidates.state === 'available' ? (
        <>
          <Subsection title="adoptable runs">
            <AdoptionCandidateList candidates={candidates.items} emptyCopy="当前没有满足条件的 adoption candidate。" />
          </Subsection>
          <Subsection title="blocked runs">
            <AdoptionCandidateList candidates={candidates.blockedItems} emptyCopy="当前没有 blocked implementation run。" />
          </Subsection>
        </>
      ) : null}

      <p className="panel-note">{candidates.note}</p>
    </DataPanel>
  );
}

function AdoptionCandidateList({ candidates, emptyCopy }) {
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return <EmptyBlock copy={emptyCopy} />;
  }

  return (
    <ul className="adoption-candidate-list">
      {candidates.map((candidate) => (
        <li key={`${candidate.sourceRunId.text}-${candidate.operationId.text}`}>
          <div className="run-row-header">
            <h3>{candidate.sourceRunId.text}</h3>
            <span className="state-pill">{candidate.adoptionStatus.text}</span>
          </div>
          <FieldList rows={[
            ['adoption status', candidate.adoptionStatus],
            ['blocking reasons', candidate.blockingReasons],
            ['source run', candidate.sourceRunId],
            ['source contract', candidate.sourceContract],
            ['operationId', candidate.operationId],
            ['operationStatus', candidate.operationStatus],
            ['goalId', candidate.goalId],
            ['taskId', candidate.taskId],
            ['workspace', candidate.workspace.path],
            ['workspace manifest', candidate.workspace.manifestPath],
            ['workspace fingerprint', candidate.workspace.fingerprint],
            ['evidenceArtifactPath', candidate.evidence.artifactPath],
            ['evidenceRef', candidate.evidence.ref],
            ['artifact count', candidate.evidence.artifactCount],
            ['changed file count', candidate.changedFiles.count],
            ['changed files', candidate.changedFiles.text],
            ['verifierStatus', candidate.verifierStatus],
            ['verifier passed', candidate.verifier.passed],
            ['status', candidate.status],
            ['writeBoundary', candidate.writeBoundary],
            ['workspaceWrites', candidate.workspaceWrites],
            ['mainWorktreeWrites', candidate.mainWorktreeWrites],
            ['updatedAt', candidate.updatedAt]
          ]} />
        </li>
      ))}
    </ul>
  );
}

function AdoptionPlanPreviewWorkspacePanel({
  workspace,
  onAdoptionPlanFrozen = () => undefined
}) {
  const [freezeState, setFreezeState] = useState({
    phase: 'idle',
    result: null,
    error: null
  });

  async function handleConfirm(event) {
    const candidateIndex = Number.parseInt(event.currentTarget.dataset.freezeIndex ?? '-1', 10);
    const candidate = Array.isArray(workspace?.candidates?.items)
      ? workspace.candidates.items[candidateIndex]
      : null;
    const route = candidate?.freeze?.endpointRoute?.value;
    const body = candidate?.freeze?.requestPayload;

    if (candidate?.freeze?.available?.value !== true || typeof route !== 'string' || body === null) {
      setFreezeState({
        phase: 'failed',
        result: null,
        error: 'freeze route unavailable'
      });
      return;
    }

    setFreezeState({
      phase: 'loading',
      result: null,
      error: null
    });

    const result = await confirmControlledAdoptionPlanFreeze(route, body);

    if (result.ok) {
      setFreezeState({
        phase: 'ready',
        result: result.data,
        error: null
      });

      if (typeof onAdoptionPlanFrozen === 'function') {
        await onAdoptionPlanFrozen(result.data);
      }
      return;
    }

    setFreezeState({
      phase: 'failed',
      result: null,
      error: result.errorEnvelope === null
        ? result.message
        : `${result.errorEnvelope.error.code} / ${result.errorEnvelope.error.message}`
    });
  }

  return (
    <DataPanel
      id="adoption-plan-preview-workspace-panel"
      kicker="v30 adoption plan"
      title="Adoption plan preview workspace"
      state={workspace?.state ?? 'unavailable'}
    >
      <FieldList rows={[
        ['modelName', workspace?.modelName],
        ['contractName', workspace?.contractName],
        ['goalId', workspace?.goalId],
        ['taskId', workspace?.taskId],
        ['freeze route', workspace?.freezeEndpoint?.route],
        ['method', workspace?.freezeEndpoint?.method],
        ['allowedBodyFields', workspace?.freezeEndpoint?.allowedBodyFields],
        ['requiresSameGoalTaskContext', workspace?.freezeEndpoint?.requiresSameGoalTaskContext],
        ['requiresAdoptableCandidate', workspace?.freezeEndpoint?.requiresAdoptableCandidate],
        ['rejectsPromptInput', workspace?.freezeEndpoint?.rejectsPromptInput],
        ['rejectsConfirmAdoptionInput', workspace?.freezeEndpoint?.rejectsConfirmAdoptionInput]
      ]} />

      <Subsection title="freeze candidates">
        <AdoptionFreezeCandidateList
          candidates={workspace?.candidates?.items}
          busy={freezeState.phase === 'loading'}
          handleConfirm={handleConfirm}
        />
      </Subsection>

      {freezeState.phase === 'failed' ? (
        <p className="error-copy">freeze 错误摘要：{freezeState.error}</p>
      ) : null}
      {freezeState.phase === 'loading' ? (
        <p className="empty-copy">正在冻结 adoption plan，main worktree 保持不变。</p>
      ) : null}
      {freezeState.phase === 'ready' ? (
        <Subsection title="latest freeze result">
          <AdoptionFreezeResult result={freezeState.result} />
        </Subsection>
      ) : null}

      <Subsection title="frozen plan from operations">
        <FrozenAdoptionPlanView plan={workspace?.frozenPlan} />
      </Subsection>

      <Subsection title="recovery notes">
        <FieldList rows={[
          ['inspect command pattern', workspace?.recoveryNotes?.inspectCommandPattern],
          ['confirm command source', workspace?.recoveryNotes?.confirmCommandSource],
          ['failure recovery', workspace?.recoveryNotes?.failureRecovery]
        ]} />
      </Subsection>

      <Subsection title="safety">
        <FieldList rows={[
          ['workbenchWriteAvailable', workspace?.safety?.workbenchWriteAvailable],
          ['writeScope', workspace?.safety?.writeScope],
          ['mappedToExistingAdoptRun', workspace?.safety?.mappedToExistingAdoptRun],
          ['mainWorktreeWrites', workspace?.safety?.mainWorktreeWrites],
          ['adoptionConfirmAvailable', workspace?.safety?.adoptionConfirmAvailable],
          ['browserExecutionAvailable', workspace?.safety?.browserExecutionAvailable],
          ['modelInvocationAvailable', workspace?.safety?.modelInvocationAvailable],
          ['genericShellRunner', workspace?.safety?.genericShellRunner],
          ['arbitraryPathReadAvailable', workspace?.safety?.arbitraryPathReadAvailable],
          ['mergeAvailable', workspace?.safety?.mergeAvailable],
          ['pushAvailable', workspace?.safety?.pushAvailable],
          ['tagAvailable', workspace?.safety?.tagAvailable],
          ['selfApprovalAvailable', workspace?.safety?.selfApprovalAvailable],
          ['unsupportedInferenceSources', workspace?.safety?.unsupportedInferenceSources]
        ]} />
      </Subsection>

      <p className="panel-note">{workspace?.note}</p>
    </DataPanel>
  );
}

function AdoptionFreezeCandidateList({ candidates, busy, handleConfirm }) {
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return <EmptyBlock copy="当前没有可冻结的 adoption candidate。" />;
  }

  return (
    <ul className="adoption-candidate-list">
      {candidates.map((candidate, index) => (
        <li key={`${candidate.sourceRunId.text}-${candidate.operationId.text}-freeze`}>
          <div className="run-row-header">
            <h3>{candidate.sourceRunId.text}</h3>
            <button
              type="button"
              data-freeze-index={index}
              onClick={handleConfirm}
              disabled={busy || candidate.freeze.available.value !== true}
            >
              Freeze adoption plan
            </button>
          </div>
          <FieldList rows={[
            ['operationId', candidate.operationId],
            ['workspace fingerprint', candidate.sourceWorkspaceFingerprint],
            ['changed files', candidate.changedFiles.text],
            ['verifierStatus', candidate.verifierStatus],
            ['evidenceRef', candidate.evidence.ref],
            ['freeze route', candidate.freeze.endpointRoute]
          ]} />
        </li>
      ))}
    </ul>
  );
}

function AdoptionFreezeResult({ result }) {
  return (
    <>
      <FieldList rows={[
        ['contractName', textValue(result?.contractName)],
        ['status', textValue(result?.status)],
        ['sourceRunId', textValue(result?.sourceRunId)],
        ['sourceOperationId', textValue(result?.sourceOperationId)],
        ['adoptionPlanId', textValue(result?.adoptionPlan?.adoptionPlanId)],
        ['adoptionPlanArtifactPath', textValue(result?.adoptionPlan?.adoptionPlanArtifactPath)],
        ['patchArtifactPath', textValue(result?.adoptionPlan?.patchArtifactPath)],
        ['patchHash', textValue(result?.adoptionPlan?.patchHash)],
        ['changedFileCount', textValue(result?.patchSummary?.changedFileCount)],
        ['fileOperationCount', textValue(result?.patchSummary?.fileOperationCount)],
        ['sourceWorkspaceFingerprint', textValue(result?.fingerprints?.sourceWorkspaceFingerprint)],
        ['projectFingerprint', textValue(result?.fingerprints?.projectFingerprint)],
        ['gitHead', textValue(result?.fingerprints?.gitHead)],
        ['gitStatusFingerprint', textValue(result?.fingerprints?.gitStatusFingerprint)],
        ['inspectCommand', textValue(result?.recoveryNotes?.inspectCommand)],
        ['confirmCommand', textValue(result?.recoveryNotes?.confirmCommand)],
        ['mainWorktreeUnchanged', textValue(result?.recoveryNotes?.mainWorktreeUnchanged)]
      ]} />
      <h4>affected files</h4>
      <TextItemList
        items={{
          state: 'available',
          items: (result?.patchSummary?.changedFiles ?? []).map((file) => textValue(file))
        }}
        emptyCopy="affected files 未暴露。"
      />
    </>
  );
}

function FrozenAdoptionPlanView({ plan }) {
  return (
    <>
      <FieldList rows={[
        ['state', textValue(plan?.state)],
        ['sourceContract', plan?.sourceContract],
        ['operationId', plan?.operationId],
        ['operationStatus', plan?.operationStatus],
        ['commandKind', plan?.commandKind],
        ['adoptionPlanId', plan?.adoptionPlanId],
        ['adoptionPlanArtifactPath', plan?.adoptionPlanArtifactPath],
        ['patchArtifactPath', plan?.patchArtifactPath],
        ['patchHash', plan?.patchHash],
        ['sourceRunId', plan?.sourceRunId],
        ['sourceOperationId', plan?.sourceOperationId],
        ['sourceWorkspacePath', plan?.sourceWorkspacePath],
        ['sourceWorkspaceManifestPath', plan?.sourceWorkspaceManifestPath],
        ['changedFileCount', plan?.changedFiles?.count],
        ['fileOperationCount', plan?.fileOperations?.count],
        ['sourceWorkspaceFingerprint', plan?.fingerprints?.sourceWorkspaceFingerprint],
        ['projectFingerprint', plan?.fingerprints?.projectFingerprint],
        ['gitHead', plan?.fingerprints?.gitHead],
        ['gitStatusFingerprint', plan?.fingerprints?.gitStatusFingerprint],
        ['inspectCommand', plan?.recoveryNotes?.inspectCommand],
        ['confirmCommand', plan?.recoveryNotes?.confirmCommand],
        ['failureRecovery', plan?.recoveryNotes?.failureRecovery]
      ]} />
      <h4>affected files</h4>
      <TextItemList items={plan?.changedFiles?.items} emptyCopy="affected files 未暴露。" />
      <h4>file operations</h4>
      <KeyValueList
        rows={plan?.fileOperations?.items ?? []}
        nameKey="path"
        valueKey="operation"
        emptyCopy="file operations 未暴露。"
      />
    </>
  );
}

function AdoptionInspectRecoveryPanel({
  workspace,
  onAdoptionConfirmed = () => undefined
}) {
  const [inspectState, setInspectState] = useState({
    phase: 'idle',
    result: null,
    error: null
  });
  const [confirmState, setConfirmState] = useState({
    phase: 'idle',
    result: null,
    error: null
  });
  const projectedInspection = inspectState.phase === 'ready' ? null : workspace?.inspection;

  async function handlePreview() {
    const route = workspace?.inspectEndpoint?.route?.value;

    if (!['available', 'inspected'].includes(workspace?.state) || typeof route !== 'string' || route.trim() === '') {
      setInspectState({
        phase: 'failed',
        result: null,
        error: 'inspect route unavailable'
      });
      return;
    }

    setInspectState({
      phase: 'loading',
      result: null,
      error: null
    });

    const result = await fetchAdoptionInspection(route);

    if (result.ok) {
      setInspectState({
        phase: 'ready',
        result: result.data,
        error: null
      });
      return;
    }

    setInspectState({
      phase: 'failed',
      result: null,
      error: result.errorEnvelope === null
        ? result.message
        : `${result.errorEnvelope.error.code} / ${result.errorEnvelope.error.message}`
    });
  }

  async function handleConfirm() {
    const route = workspace?.confirmEndpoint?.route?.value;
    const body = workspace?.confirmEndpoint?.requestPayload;

    if (workspace?.safety?.adoptionConfirmAvailable?.value !== true || typeof route !== 'string' || body === null) {
      setConfirmState({
        phase: 'failed',
        result: null,
        error: 'adoption confirm route unavailable'
      });
      return;
    }

    setConfirmState({
      phase: 'loading',
      result: null,
      error: null
    });

    const result = await confirmControlledAdoptionPlan(route, body);

    if (result.ok) {
      setConfirmState({
        phase: 'ready',
        result: result.data,
        error: null
      });

      if (typeof onAdoptionConfirmed === 'function') {
        await onAdoptionConfirmed(result.data);
      }
      return;
    }

    setConfirmState({
      phase: 'failed',
      result: null,
      error: result.errorEnvelope === null
        ? result.message
        : `${result.errorEnvelope.error.code} / ${result.errorEnvelope.error.message}`
    });
  }

  return (
    <DataPanel
      id="adoption-inspect-recovery-panel"
      kicker="v30 adoption inspect"
      title="Adoption inspect and recovery view"
      state={workspace?.state ?? 'unavailable'}
    >
      <FieldList rows={[
        ['modelName', workspace?.modelName],
        ['contractName', workspace?.contractName],
        ['goalId', workspace?.goalId],
        ['taskId', workspace?.taskId],
        ['adoptionPlanId', workspace?.selectedFrozenPlan?.adoptionPlanId],
        ['operationId', workspace?.selectedFrozenPlan?.operationId],
        ['patchHash', workspace?.selectedFrozenPlan?.patchHash],
        ['inspect route', workspace?.inspectEndpoint?.route],
        ['method', workspace?.inspectEndpoint?.method],
        ['adoptionIdSource', workspace?.inspectEndpoint?.adoptionIdSource],
        ['acceptsUserPathInput', workspace?.inspectEndpoint?.acceptsUserPathInput],
        ['acceptsConfirmInput', workspace?.inspectEndpoint?.acceptsConfirmInput]
      ]} />

      <div className="panel-actions">
        <button
          type="button"
          onClick={handlePreview}
          disabled={inspectState.phase === 'loading' || !['available', 'inspected'].includes(workspace?.state)}
        >
          Inspect recovery state
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={confirmState.phase === 'loading' || workspace?.safety?.adoptionConfirmAvailable?.value !== true}
        >
          Confirm adoption
        </button>
      </div>

      {inspectState.phase === 'failed' ? (
        <p className="error-copy">inspect 错误摘要：{inspectState.error}</p>
      ) : null}
      {inspectState.phase === 'loading' ? (
        <p className="empty-copy">正在读取 adoption inspect 输出，不确认采纳也不应用 patch。</p>
      ) : null}
      {inspectState.phase === 'ready' ? (
        <Subsection title="inspect output">
          <AdoptionInspectResult result={inspectState.result} />
        </Subsection>
      ) : null}
      {inspectState.phase !== 'ready' && projectedInspection?.state === 'available' ? (
        <Subsection title="inspect output">
          <ProjectedAdoptionInspectResult inspection={projectedInspection} />
        </Subsection>
      ) : null}
      {inspectState.phase !== 'ready' && workspace?.inspection?.state === 'available' ? (
        <Subsection title="inspect output from route">
          <ProjectedAdoptionInspectOutput inspection={workspace.inspection} />
        </Subsection>
      ) : null}
      {confirmState.phase === 'failed' ? (
        <p className="error-copy">confirm 错误摘要：{confirmState.error}</p>
      ) : null}
      {confirmState.phase === 'loading' ? (
        <p className="empty-copy">正在确认 frozen adoption plan。不会 merge、push、tag、publish 或登记审批事件。</p>
      ) : null}
      {confirmState.phase === 'ready' ? (
        <Subsection title="confirm result">
          <AdoptionConfirmResult result={confirmState.result} />
        </Subsection>
      ) : null}

      <Subsection title="confirm endpoint">
        <FieldList rows={[
          ['route', workspace?.confirmEndpoint?.route],
          ['method', workspace?.confirmEndpoint?.method],
          ['adoptionIdSource', workspace?.confirmEndpoint?.adoptionIdSource],
          ['allowedBodyFields', workspace?.confirmEndpoint?.allowedBodyFields],
          ['requiresFrozenPlanOperation', workspace?.confirmEndpoint?.requiresFrozenPlanOperation],
          ['refreshesAfterConfirm', workspace?.confirmEndpoint?.refreshesAfterConfirm],
          ['acceptsUserPathInput', workspace?.confirmEndpoint?.acceptsUserPathInput],
          ['acceptsPlanHashInput', workspace?.confirmEndpoint?.acceptsPlanHashInput],
          ['acceptsShellCommandInput', workspace?.confirmEndpoint?.acceptsShellCommandInput]
        ]} />
      </Subsection>

      <Subsection title="patch refs">
        <FieldList rows={[
          ['adoptionPlanArtifactPath', workspace?.patchRefs?.adoptionPlanArtifactPath],
          ['patchArtifactPath', workspace?.patchRefs?.patchArtifactPath],
          ['patchHash', workspace?.patchRefs?.patchHash],
          ['fileOperationCount', workspace?.patchRefs?.fileOperations?.count]
        ]} />
      </Subsection>

      <Subsection title="evidence context">
        <FieldList rows={[
          ['sourceRunId', workspace?.evidenceContext?.sourceRunId],
          ['sourceRunArtifactPath', workspace?.evidenceContext?.sourceRunArtifactPath],
          ['sourceEvidenceArtifactPath', workspace?.evidenceContext?.sourceEvidenceArtifactPath],
          ['sourceVerifierStatus', workspace?.evidenceContext?.sourceVerifierStatus],
          ['latestConfirmationEvidenceArtifactPath', workspace?.evidenceContext?.latestConfirmationEvidenceArtifactPath]
        ]} />
      </Subsection>

      <Subsection title="recovery context">
        <FieldList rows={[
          ['journalStateSource', workspace?.recoveryContext?.journalStateSource],
          ['beforeHashSource', workspace?.recoveryContext?.beforeHashSource],
          ['afterHashSource', workspace?.recoveryContext?.afterHashSource],
          ['currentWorktreeMatchSource', workspace?.recoveryContext?.currentWorktreeMatchSource],
          ['copyOnlyInspectCommand', workspace?.recoveryContext?.copyOnlyInspectCommand]
        ]} />
      </Subsection>

      <Subsection title="safety">
        <FieldList rows={[
          ['readOnly', workspace?.safety?.readOnly],
          ['workbenchWriteAvailable', workspace?.safety?.workbenchWriteAvailable],
          ['writeScope', workspace?.safety?.writeScope],
          ['adoptionConfirmAvailable', workspace?.safety?.adoptionConfirmAvailable],
          ['applyPatchAvailable', workspace?.safety?.applyPatchAvailable],
          ['browserExecutionAvailable', workspace?.safety?.browserExecutionAvailable],
          ['modelInvocationAvailable', workspace?.safety?.modelInvocationAvailable],
          ['genericShellRunner', workspace?.safety?.genericShellRunner],
          ['arbitraryPathReadAvailable', workspace?.safety?.arbitraryPathReadAvailable],
          ['mergeAvailable', workspace?.safety?.mergeAvailable],
          ['pushAvailable', workspace?.safety?.pushAvailable],
          ['tagAvailable', workspace?.safety?.tagAvailable],
          ['selfApprovalAvailable', workspace?.safety?.selfApprovalAvailable],
          ['readinessInferenceAvailable', workspace?.safety?.readinessInferenceAvailable],
          ['unsupportedInferenceSources', workspace?.safety?.unsupportedInferenceSources]
        ]} />
      </Subsection>

      <p className="panel-note">{workspace?.note}</p>
    </DataPanel>
  );
}

function AdoptionConfirmResult({ result }) {
  return (
    <>
      <FieldList rows={[
        ['contractName', textValue(result?.contractName)],
        ['status', textValue(result?.status)],
        ['goalId', textValue(result?.goalId)],
        ['taskId', textValue(result?.taskId)],
        ['adoptionPlanId', textValue(result?.adoptionPlanId)],
        ['confirmationRunId', textValue(result?.confirmedRun?.runId)],
        ['confirmationStatus', textValue(result?.confirmedRun?.status)],
        ['verifierStatus', textValue(result?.confirmedRun?.verifierStatus)],
        ['mainWorktreeWrites', textValue(result?.confirmedRun?.mainWorktreeWrites)],
        ['adoptionJournalArtifactPath', textValue(result?.confirmedRun?.adoptionJournalArtifactPath)],
        ['evidenceArtifactPath', textValue(result?.confirmedRun?.evidenceArtifactPath)],
        ['operationId', textValue(result?.operationRun?.operationId)],
        ['operationStatus', textValue(result?.operationRun?.status)],
        ['nextActionStatus', textValue(result?.refreshed?.nextAction?.status)],
        ['nextTask', textValue(result?.refreshed?.nextAction?.next?.taskId)],
        ['nextRole', textValue(result?.refreshed?.nextAction?.next?.role)],
        ['genericShellRunner', textValue(result?.safety?.genericShellRunner)],
        ['modelInvocationAvailable', textValue(result?.safety?.modelInvocationAvailable)],
        ['reviewerEventRegistered', textValue(result?.safety?.reviewerEventRegistered)],
        ['mainVerificationEventRegistered', textValue(result?.safety?.mainVerificationEventRegistered)],
        ['releaseReadinessRegistered', textValue(result?.safety?.releaseReadinessRegistered)],
        ['mergeAvailable', textValue(result?.safety?.mergeAvailable)],
        ['pushAvailable', textValue(result?.safety?.pushAvailable)],
        ['tagAvailable', textValue(result?.safety?.tagAvailable)],
        ['publishAvailable', textValue(result?.safety?.publishAvailable)]
      ]} />
      <h4>changed files</h4>
      <TextItemList
        items={{
          state: 'available',
          items: (result?.confirmedRun?.changedFiles ?? []).map((file) => textValue(file))
        }}
        emptyCopy="confirmed changed files 未暴露。"
      />
    </>
  );
}

function ProjectedAdoptionInspectOutput({ inspection }) {
  return (
    <>
      <FieldList rows={[
        ['contractName', inspection?.contractName],
        ['status', inspection?.status],
        ['adoptionPlanId', inspection?.adoptionPlanId],
        ['journalStatus', inspection?.journal?.status],
        ['journalArtifactPath', inspection?.journal?.artifactPath],
        ['latestConfirmationRunId', inspection?.latestConfirmationRun?.runId],
        ['latestConfirmationStatus', inspection?.latestConfirmationRun?.status],
        ['latestConfirmationEvidenceArtifactPath', inspection?.latestConfirmationRun?.evidenceArtifactPath],
        ['patchHash', inspection?.hashes?.patchHash],
        ['currentWorktreeMatchesAfterHash', inspection?.hashes?.currentWorktreeMatchesAfterHash],
        ['currentWorktreeMatchesJournalBeforeFiles', inspection?.hashes?.currentWorktreeMatchesJournalBeforeFiles],
        ['recommendedCommandCount', inspection?.recommendedCommands?.count]
      ]} />
      <h4>after hash match</h4>
      <AdoptionInspectProjectedHashFiles files={inspection?.afterHashFiles} />
      <h4>before journal match</h4>
      <AdoptionInspectProjectedHashFiles files={inspection?.beforeJournalFiles} />
    </>
  );
}

function AdoptionInspectProjectedHashFiles({ files }) {
  if (!Array.isArray(files?.items) || files.items.length === 0) {
    return (
      <FieldList rows={[
        ['matches', files?.matches],
        ['reason', files?.reason]
      ]} />
    );
  }

  return (
    <KeyValueList
      rows={files.items.map((file) => ({
        path: file.path,
        state: textValue(`matches ${file.matches.text} / expected ${file.expectedHash.text} / actual ${file.actualHash.text}`)
      }))}
      nameKey="path"
      valueKey="state"
      emptyCopy="match file details 未暴露。"
    />
  );
}

function ProjectedAdoptionInspectResult({ inspection }) {
  return (
    <>
      <FieldList rows={[
        ['routeState', inspection?.routeState],
        ['httpStatus', inspection?.httpStatus],
        ['contractName', inspection?.contractName],
        ['status', inspection?.status],
        ['adoptionPlanId', inspection?.adoptionPlanId],
        ['journalStatus', inspection?.journal?.status],
        ['journalArtifactPath', inspection?.journal?.artifactPath],
        ['latestConfirmationRunId', inspection?.latestConfirmationRun?.runId],
        ['latestConfirmationStatus', inspection?.latestConfirmationRun?.status],
        ['latestConfirmationEvidenceArtifactPath', inspection?.latestConfirmationRun?.evidenceArtifactPath],
        ['patchHash', inspection?.hashes?.patchHash],
        ['currentWorktreeMatchesAfterHash', inspection?.hashes?.currentWorktreeMatchesAfterHash],
        ['currentWorktreeMatchesJournalBeforeFiles', inspection?.hashes?.currentWorktreeMatchesJournalBeforeFiles],
        ['recommendedCommandCount', inspection?.recommendedCommands?.count]
      ]} />
      <h4>after hash match</h4>
      <KeyValueList
        rows={(inspection?.afterHashFiles?.items ?? []).map((file) => ({
          path: file.path,
          state: textValue(`matches ${file.matches.text} / expected ${file.expectedHash.text} / actual ${file.actualHash.text}`)
        }))}
        nameKey="path"
        valueKey="state"
        emptyCopy="after hash match details 未暴露。"
      />
      <h4>before journal match</h4>
      <KeyValueList
        rows={(inspection?.beforeJournalFiles?.items ?? []).map((file) => ({
          path: file.path,
          state: textValue(`matches ${file.matches.text} / expected ${file.expectedHash.text} / actual ${file.actualHash.text}`)
        }))}
        nameKey="path"
        valueKey="state"
        emptyCopy="before journal match details 未暴露。"
      />
    </>
  );
}

function AdoptionInspectResult({ result }) {
  const afterDetails = result?.currentWorktreeMatchesAfterHashDetails;
  const beforeDetails = result?.currentWorktreeMatchesJournalBeforeFilesDetails;

  return (
    <>
      <FieldList rows={[
        ['contractName', textValue(result?.contractName)],
        ['status', textValue(result?.status)],
        ['adoptionPlanId', textValue(result?.adoptionPlanId)],
        ['sourceRunId', textValue(result?.sourceRunId)],
        ['journalStatus', textValue(result?.journal?.status ?? 'missing')],
        ['journalArtifactPath', textValue(result?.journal?.artifactPath)],
        ['latestConfirmationRunId', textValue(result?.latestConfirmationRun?.runId)],
        ['latestConfirmationStatus', textValue(result?.latestConfirmationRun?.status)],
        ['latestConfirmationEvidenceArtifactPath', textValue(result?.latestConfirmationRun?.evidenceArtifactPath)],
        ['patchArtifactPath', textValue(result?.adoptionPlanRefs?.patchArtifactPath)],
        ['patchHash', textValue(result?.patchHash)],
        ['currentWorktreeMatchesAfterHash', textValue(result?.currentWorktreeMatchesAfterHash)],
        ['currentWorktreeMatchesJournalBeforeFiles', textValue(result?.currentWorktreeMatchesJournalBeforeFiles)],
        ['nextAction', textValue(result?.nextAction)]
      ]} />
      <h4>file operation hashes</h4>
      <KeyValueList
        rows={(result?.fileOperations ?? []).map((operation) => ({
          path: textValue(operation?.path),
          operation: textValue(`${operation?.operation ?? 'unknown'} / before ${operation?.beforeHash ?? 'missing'} / after ${operation?.afterHash ?? 'missing'}`)
        }))}
        nameKey="path"
        valueKey="operation"
        emptyCopy="file operation hash 未暴露。"
      />
      <h4>after hash match</h4>
      <AdoptionInspectMatchDetails details={afterDetails} />
      <h4>before journal match</h4>
      <AdoptionInspectMatchDetails details={beforeDetails} />
    </>
  );
}

function AdoptionInspectMatchDetails({ details }) {
  if (details === null || details === undefined) {
    return <EmptyBlock copy="match details 未暴露。" />;
  }

  if (Array.isArray(details.files) && details.files.length > 0) {
    return (
      <KeyValueList
        rows={details.files.map((file) => ({
          path: textValue(file?.path),
          state: textValue(`matches ${String(file?.matches)} / expected ${file?.expected?.hash ?? 'missing'} / actual ${file?.actual?.hash ?? 'missing'}`)
        }))}
        nameKey="path"
        valueKey="state"
        emptyCopy="match file details 未暴露。"
      />
    );
  }

  return (
    <FieldList rows={[
      ['matches', textValue(details.matches)],
      ['reason', textValue(details.reason)]
    ]} />
  );
}

function HandoffPanel({ handoff, indexRoute, route }) {
  return (
    <DataPanel
      id="handoff-panel"
      kicker="v16 handoff panel"
      title="Guided Goal Handoff"
      state={handoffStateText(handoff, route)}
      route={route}
    >
      {indexRoute?.state === 'failed' ? (
        <p className="error-copy">错误摘要：{indexRoute.error}。handoff refs route 未暴露或不可用。</p>
      ) : null}

      <FieldList rows={[
        ['refs.contractName', handoff.refs.contractName],
        ['refs.readOnly', handoff.refs.readOnly],
        ['refs.arbitraryPathReads', handoff.refs.arbitraryPathReads],
        ['refs.count', handoff.refs.count],
        ['contractName', handoff.contractName],
        ['contractVersion', handoff.contractVersion],
        ['goalId', handoff.goalId],
        ['titleZh', handoff.titleZh],
        ['baseline.releaseTag', handoff.baselineReleaseTag],
        ['baseline.approvalCommit', handoff.baselineApprovalCommit],
        ['role count', handoff.roleCount],
        ['task count', handoff.taskCount],
        ['command block count', handoff.commandBlockCount],
        ['commands.copyOnly', handoff.commandBlocks.copyOnly],
        ['reviewModel.contextIsolation', handoff.reviewContextIsolation],
        ['reviewModel.workerSelfCheckIsFinal', handoff.workerSelfCheckIsFinal]
      ]} />

      <Subsection title="registered refs">
        <HandoffRefList refs={handoff.refs} />
      </Subsection>

      <Subsection title="phase / copy-only commands">
        <CommandBlockList commandBlocks={handoff.commandBlocks} />
      </Subsection>

      <Subsection title="roles">
        <HandoffRoleList roles={handoff.roles} />
      </Subsection>

      <Subsection title="tasks / evidence / review gate">
        <HandoffTaskList tasks={handoff.tasks} />
      </Subsection>

      <p className="panel-note">{handoff.note}</p>
    </DataPanel>
  );
}

function RoutePanel({ routes }) {
  return (
    <DataPanel
      id="routes-panel"
      kicker="API contract 使用范围"
      title="固定 GET routes"
      state="只读"
    >
      <dl className="route-list">
        {routes.map((route) => (
          <div className="route-row" key={route.id}>
            <dt>{route.method} {route.path}</dt>
            <dd>
              <span className={`state-pill ${route.state}`}>{routeStateText(route)}</span>
              <span>{route.contractName.text}</span>
              <span>version {route.contractVersion.text}</span>
            </dd>
          </div>
        ))}
      </dl>
      <p className="panel-note">API client 只绑定 /api/summary、/api/readiness、/api/handoff、/api/runs、/api/runs/latest、注册 handoff ref、latest run id 派生的 timeline GET route，以及后端 artifact uri 暴露的 safe preview GET route。</p>
    </DataPanel>
  );
}

function ContractGapPanel({ gaps }) {
  return (
    <DataPanel
      id="contract-gap-panel"
      kicker="Contract gaps"
      title="等待 API contract 补充"
      state="不由前端推断"
    >
      <ul className="gap-list">
        {gaps.map((gap) => (
          <li key={gap.label}>
            <span>{gap.label}</span>
            <strong>{gap.status}</strong>
          </li>
        ))}
      </ul>
      <p className="panel-note">这些 gap 继续作为 API contract 问题处理；React 端不会伪造字段。</p>
    </DataPanel>
  );
}

function DataPanel({ id, kicker, title, state, route, children }) {
  return (
    <article id={id} className="data-panel" aria-labelledby={`${id}-title`}>
      <header className="panel-header">
        <div>
          <p className="section-kicker">{kicker}</p>
          <h2 id={`${id}-title`}>{title}</h2>
        </div>
        <span className="panel-state">{state}</span>
      </header>
      {route?.state === 'failed' ? (
        <p className="error-copy">错误摘要：{route.error}。刷新页面后会重新读取只读 API。</p>
      ) : null}
      {children}
    </article>
  );
}

function Subsection({ title, children }) {
  return (
    <section className="panel-subsection" aria-label={title}>
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function FieldList({ rows }) {
  return (
    <dl className="field-list">
      {rows.map(([label, state]) => (
        <div className="field-row" key={label}>
          <dt>{label}</dt>
          <dd className={state?.state === 'missing' ? 'missing-value' : ''}>{formatState(state)}</dd>
        </div>
      ))}
    </dl>
  );
}

function CompactList({ items }) {
  const normalizedItems = Array.isArray(items)
    ? items.filter((item) => typeof item === 'string' && item.trim() !== '')
    : [];

  if (normalizedItems.length === 0) {
    return <EmptyBlock copy="未暴露。" />;
  }

  return (
    <ul className="compact-list">
      {normalizedItems.map((item) => (
        <li key={item}>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function CheckList({ checks }) {
  if (checks.state === 'missing') {
    return <EmptyBlock copy="checks 未暴露。" />;
  }

  if (checks.items.length === 0) {
    return <EmptyBlock copy="checks 为空。" />;
  }

  return (
    <ul className="compact-list">
      {checks.items.map((check) => (
        <li key={check.id.text}>
          <strong>{check.label.text}</strong>
          <span>{check.status.text}</span>
          <span>{check.detail.text}</span>
        </li>
      ))}
    </ul>
  );
}

function RiskList({ riskSummary }) {
  if (riskSummary.state === 'missing') {
    return <EmptyBlock copy="riskSummary 未暴露。" />;
  }

  if (riskSummary.items.length === 0) {
    return <EmptyBlock copy="没有已暴露的 attention items。" />;
  }

  return (
    <ul className="compact-list">
      {riskSummary.items.map((risk) => (
        <li key={`${risk.id.text}-${risk.title.text}`}>
          <strong>{risk.title.text}</strong>
          <span>{risk.severity.text}</span>
          <span>{risk.category.text}</span>
          <span>{risk.detail.text}</span>
        </li>
      ))}
    </ul>
  );
}

function TimelineList({ timeline }) {
  if (timeline.state === 'unavailable') {
    return <EmptyBlock copy={`timeline 不可用：${timeline.error}`} />;
  }

  if (timeline.state === 'missing') {
    return <EmptyBlock copy="timeline 未暴露。" />;
  }

  if (timeline.items.length === 0) {
    return <EmptyBlock copy="暂无 timeline。" />;
  }

  return (
    <ul className="timeline-list">
      {timeline.items.map((event, index) => (
        <li key={`${event.id.text}-${index}`}>
          <FieldList rows={[
            ['id', event.id],
            ['label', event.label],
            ['status', event.status],
            ['detail', event.detail],
            ['at', event.at]
          ]} />
        </li>
      ))}
    </ul>
  );
}

function RunList({ runs }) {
  return (
    <div className="run-list">
      {runs.map((run) => (
        <article className="run-row" key={run.runId.text}>
          <div className="run-row-header">
            <h3>{run.runId.text}</h3>
            <span className="state-pill">{run.isLatest.value === true ? 'latest' : 'history'}</span>
          </div>
          <FieldList rows={[
            ['status', run.status],
            ['verifierStatus', run.verifierStatus],
            ['intent', run.intent],
            ['command', run.command],
            ['semanticCommand', run.semanticCommand],
            ['route key', run.routeKey],
            ['route intent', run.routeDecisionIntent],
            ['route reason', run.routeDecisionReason],
            ['createdAt', run.createdAt],
            ['updatedAt', run.updatedAt],
            ['artifactRefs', textValue(run.artifactRefs.label)]
          ]} />
        </article>
      ))}
    </div>
  );
}

function ArtifactRefList({ artifactRefs }) {
  if (artifactRefs.state === 'missing') {
    return <EmptyBlock copy="artifactRefs 未暴露或不可用。" />;
  }

  if (artifactRefs.items.length === 0) {
    return <EmptyBlock copy="artifactRefs 为空。" />;
  }

  return (
    <ul className="artifact-list">
      {artifactRefs.items.map((artifact, index) => (
        <li key={`${artifact.kind.text}-${index}`}>
          <FieldList rows={[
            ['kind', artifact.kind],
            ['status', artifact.status],
            ['path', artifact.path],
            ['ref', artifact.ref],
            ['uri', artifact.uri],
            ['preview fields', textValue(artifact.previewFields.map((field) => `${field.label}:${field.text}`).join(' / '))]
          ]} />
          <SafePreviewBlock preview={artifact.preview} />
        </li>
      ))}
    </ul>
  );
}

function SafePreviewBlock({ preview }) {
  if (preview.state === 'missing') {
    return <EmptyBlock copy={`safe preview 未读取：${preview.inline.reason}`} />;
  }

  if (preview.state === 'unavailable') {
    return <p className="error-copy">safe preview route 不可用：{preview.inline.reason}</p>;
  }

  return (
    <section className="safe-preview-block" aria-label="safe artifact preview">
      <FieldList rows={[
        ['preview.route', preview.route],
        ['preview.httpStatus', preview.httpStatus],
        ['preview.contractName', preview.contractName],
        ['preview.contractVersion', preview.contractVersion],
        ['preview.status', preview.status],
        ['preview.mime', preview.mime],
        ['preview.displayTitle', preview.displayTitle],
        ['preview.artifactKind', preview.artifactKind],
        ['preview.sourceRunId', preview.sourceRunId],
        ['preview.sizeBytes', preview.sizeBytes],
        ['preview.maxPreviewBytes', preview.maxPreviewBytes],
        ['preview.previewAvailable', preview.previewAvailable],
        ['preview.safeToRenderInline', preview.safeToRenderInline],
        ['preview.truncated', preview.truncated],
        ['preview.truncationReason', preview.truncationReason],
        ['preview.downloadAvailable', preview.downloadAvailable]
      ]} />

      {preview.inline.state === 'available' ? (
        <pre className="safe-preview-text"><code>{preview.inline.text}</code></pre>
      ) : (
        <EmptyBlock copy={`未展示 inline preview：${preview.inline.reason}`} />
      )}
    </section>
  );
}

function HandoffRefList({ refs }) {
  if (refs.state === 'missing') {
    return <EmptyBlock copy="handoff refs 未暴露或不可用。" />;
  }

  if (refs.items.length === 0) {
    return <EmptyBlock copy="handoff refs 为空。" />;
  }

  return (
    <ul className="compact-list">
      {refs.items.map((ref, index) => (
        <li key={`${ref.ref.text}-${index}`}>
          <FieldList rows={[
            ['ref', ref.ref],
            ['contractName', ref.contractName],
            ['contractVersion', ref.contractVersion],
            ['href', ref.href]
          ]} />
        </li>
      ))}
    </ul>
  );
}

function CommandBlockList({ commandBlocks }) {
  if (commandBlocks.state === 'missing') {
    return <EmptyBlock copy="copy-only command blocks 未暴露。" />;
  }

  if (commandBlocks.items.length === 0) {
    return <EmptyBlock copy="copy-only command blocks 为空。" />;
  }

  return (
    <ul className="command-block-list">
      {commandBlocks.items.map((block, index) => (
        <li key={`${block.id.text}-${index}`}>
          <FieldList rows={[
            ['phase id', block.id],
            ['title', block.title],
            ['copyOnly', block.copyOnly]
          ]} />
          {block.commands.length === 0 ? (
            <EmptyBlock copy="commands 未暴露。" />
          ) : (
            <ul className="command-text-list" aria-label={`${block.title.text} command text`}>
              {block.commands.map((command, commandIndex) => (
                <li key={`${block.id.text}-${commandIndex}`}>
                  <code>{command.text}</code>
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}

function HandoffRoleList({ roles }) {
  if (roles.state === 'missing') {
    return <EmptyBlock copy="roles 未暴露。" />;
  }

  if (roles.items.length === 0) {
    return <EmptyBlock copy="roles 为空。" />;
  }

  return (
    <ul className="handoff-role-list">
      {roles.items.map((role, index) => (
        <li key={`${role.id.text}-${index}`}>
          <FieldList rows={[
            ['role id', role.id],
            ['description', role.description],
            ['inputs', role.inputs],
            ['outputs', role.outputs],
            ['prohibited', role.prohibited]
          ]} />
        </li>
      ))}
    </ul>
  );
}

function HandoffTaskList({ tasks }) {
  if (tasks.state === 'missing') {
    return <EmptyBlock copy="tasks 未暴露。" />;
  }

  if (tasks.items.length === 0) {
    return <EmptyBlock copy="tasks 为空。" />;
  }

  return (
    <ul className="handoff-task-list">
      {tasks.items.map((task, index) => (
        <li key={`${task.id.text}-${index}`}>
          <FieldList rows={[
            ['task id', task.id],
            ['titleZh', task.titleZh],
            ['name', task.name],
            ['phase', task.phase],
            ['status', task.status],
            ['role', task.role],
            ['dependsOn', task.dependsOn],
            ['evidencePath', task.evidencePath],
            ['reviewGate', task.reviewGate]
          ]} />
        </li>
      ))}
    </ul>
  );
}

function GoalTaskList({ tasks }) {
  if (tasks.state === 'missing') {
    return <EmptyBlock copy="tasks 未暴露。" />;
  }

  if (tasks.items.length === 0) {
    return <EmptyBlock copy="tasks 为空。" />;
  }

  return (
    <ul className="goal-task-list">
      {tasks.items.map((task, index) => (
        <li key={`${task.taskId.text}-${index}`}>
          <FieldList rows={[
            ['taskId', task.taskId],
            ['title', task.title],
            ['status', task.status],
            ['statusSource', task.statusSource],
            ['branch', task.branch],
            ['commit', task.commit],
            ['workerEvidenceRef', task.workerEvidenceRef],
            ['reviewEvidenceRef', task.reviewEvidenceRef],
            ['reviewVerdict', task.reviewVerdict],
            ['mainVerificationRef', task.mainVerificationRef],
            ['nextCopyOnlyCommand', task.nextCopyOnlyCommand]
          ]} />
          <BlockerList blockers={task.blockers} />
        </li>
      ))}
    </ul>
  );
}

function GoalRunbookTaskList({ tasks }) {
  if (tasks.state === 'missing') {
    return <EmptyBlock copy="runbook tasks 未暴露。" />;
  }

  if (tasks.items.length === 0) {
    return <EmptyBlock copy="runbook tasks 为空。" />;
  }

  return (
    <ul className="goal-runbook-task-list">
      {tasks.items.map((task, index) => (
        <li key={`${task.taskId.text}-${index}`}>
          <FieldList rows={[
            ['taskId', task.taskId],
            ['title', task.title],
            ['branch', task.branch],
            ['roleOrder', task.roleOrder],
            ['acceptance', task.acceptance],
            ['expected worker', task.expectedWorker],
            ['expected reviewer', task.expectedReviewer],
            ['expected main verifier', task.expectedMainVerifier],
            ['ledger status', task.status],
            ['statusSource', task.statusSource],
            ['workerEvidenceRef', task.workerEvidenceRef],
            ['reviewEvidenceRef', task.reviewEvidenceRef],
            ['reviewVerdict', task.reviewVerdict],
            ['mainVerificationRef', task.mainVerificationRef],
            ['event backed', task.eventBacked],
            ['copyOnlyCommands', task.copyOnlyCommands]
          ]} />
          <BlockerList blockers={task.blockers} />
        </li>
      ))}
    </ul>
  );
}

function ActiveGoalTaskQueueList({ taskQueue }) {
  if (taskQueue.state === 'missing') {
    return <EmptyBlock copy="active goal task queue 未暴露。" />;
  }

  if (taskQueue.items.length === 0) {
    return <EmptyBlock copy="active goal task queue 为空。" />;
  }

  return (
    <ol className="active-goal-task-queue-list">
      {taskQueue.items.map((task, index) => (
        <li key={`${task.taskId.text}-${index}`}>
          <FieldList rows={[
            ['position', task.position],
            ['taskId', task.taskId],
            ['title', task.title],
            ['status', task.status],
            ['statusSource', task.statusSource],
            ['progressSource', task.progressSource],
            ['eventBacked', task.eventBacked],
            ['latestEventId', task.latestEventId],
            ['latestEventType', task.latestEventType],
            ['latestEventSequence', task.latestEventSequence],
            ['next.role', task.nextRole],
            ['next.phase', task.nextPhase],
            ['workerEvidenceRef', task.workerEvidenceRef],
            ['reviewEvidenceRef', task.reviewEvidenceRef],
            ['reviewVerdict', task.reviewVerdict],
            ['mainVerificationRef', task.mainVerificationRef],
            ['expected worker', task.expectedWorker],
            ['expected reviewer', task.expectedReviewer],
            ['expected main verifier', task.expectedMainVerifier],
            ['roleOrder', task.roleOrder],
            ['acceptance', task.acceptance]
          ]} />
          <BlockerList blockers={task.blockers} />
        </li>
      ))}
    </ol>
  );
}

function GoalEventTimelineList({ timeline }) {
  if (timeline.state === 'missing') {
    return <EmptyBlock copy="events 未暴露。" />;
  }

  if (timeline.state === 'empty') {
    return <EmptyBlock copy="未登记事件；timeline empty。" />;
  }

  return (
    <ul className="goal-event-timeline-list">
      {timeline.items.map((event, index) => (
        <li key={`${event.eventId.text}-${index}`}>
          <FieldList rows={[
            ['sequence', event.sequence],
            ['eventId', event.eventId],
            ['eventType', event.eventType],
            ['phase', event.phase],
            ['taskId', event.taskId],
            ['actor', event.actor],
            ['recordedAt', event.recordedAt],
            ['review verdict', event.reviewVerdict],
            ['gate status', event.gateStatus],
            ['previousEventHash', event.previousEventHash],
            ['eventHash', event.eventHash],
            ['hash chain status', event.hashChainStatus]
          ]} />
          <EvidenceRefList evidenceRefs={event.evidenceRefs} />
        </li>
      ))}
    </ul>
  );
}

function ActiveGoalCommandInventoryList({ inventory }) {
  if (inventory.state === 'missing') {
    return <EmptyBlock copy="Active Goal command inventory 未暴露。" />;
  }

  if (inventory.items.length === 0) {
    return <EmptyBlock copy="Active Goal command inventory 为空。" />;
  }

  return (
    <ul className="command-text-list" aria-label="Active Goal command-backed sources">
      {inventory.items.map((item) => (
        <li key={item.id.text}>
          <FieldList rows={[
            ['command', item.label],
            ['contractName', item.contractName],
            ['routeId', item.routeId],
            ['route', item.route],
            ['routeState', item.routeState],
            ['httpStatus', item.httpStatus]
          ]} />
          <code>{item.command.text}</code>
        </li>
      ))}
    </ul>
  );
}

function GoalEventFormModelView({ formModel, onGoalEventConfirmed }) {
  if (formModel.state === 'missing') {
    return <EmptyBlock copy="event form model 未暴露。" />;
  }

  return (
    <div className="event-form-model">
      <FieldList rows={[
        ['modelName', formModel.modelName],
        ['sourceContract', formModel.sourceContract],
        ['goalId', formModel.goalId],
        ['taskId', formModel.taskId],
        ['role', formModel.role],
        ['phase', formModel.phase],
        ['registerWith', formModel.registerWith],
        ['allowedEvents', formModel.allowedEvents],
        ['unsupportedAllowedEvents', formModel.unsupportedAllowedEvents],
        ['defaultFormId', formModel.defaultFormId],
        ['workerCannotApproveOwnTask', formModel.policy.workerCannotApproveOwnTask],
        ['approvalReadinessSource', formModel.policy.approvalReadinessSource],
        ['dryRunOnly', formModel.safety.dryRunOnly],
        ['confirmAvailableInTask1', formModel.safety.confirmAvailableInTask1],
        ['confirmAvailableInTask3', formModel.safety.confirmAvailableInTask3],
        ['workbenchWriteAvailable', formModel.safety.workbenchWriteAvailable]
      ]} />

      <Subsection title="recommended forms">
        <GoalEventFormList
          forms={formModel.recommendedForms}
          emptyCopy="当前 next action 没有可推荐的登记表单。"
          onGoalEventConfirmed={onGoalEventConfirmed}
        />
      </Subsection>

      <Subsection title="worker evidence handoff">
        <WorkerEvidenceHandoffView handoff={formModel.workerEvidenceHandoff} onGoalEventConfirmed={onGoalEventConfirmed} />
      </Subsection>

      <Subsection title="supported form catalog">
        <GoalEventFormList
          forms={formModel.supportedForms}
          emptyCopy="supported form catalog 为空。"
          onGoalEventConfirmed={onGoalEventConfirmed}
        />
      </Subsection>

      <p className="panel-note">{formModel.note}</p>
    </div>
  );
}

function WorkerEvidenceHandoffView({ handoff, onGoalEventConfirmed }) {
  if (handoff?.state !== 'available' || handoff.registrationForm === null) {
    return <EmptyBlock copy="没有可登记的 confirmed isolated workspace worker evidence。" />;
  }

  return (
    <div className="worker-evidence-handoff">
      <FieldList rows={[
        ['goalId', handoff.goalId],
        ['taskId', handoff.taskId],
        ['sourceContract', handoff.sourceContract],
        ['sourceOperationId', handoff.sourceOperationId],
        ['sourceRunId', handoff.sourceRunId],
        ['executionPlanId', handoff.executionPlanId],
        ['runStatus', handoff.runStatus],
        ['verifierStatus', handoff.verifierStatus],
        ['evidenceArtifactPath', handoff.evidenceArtifactPath],
        ['sourceWorkspacePath', handoff.sourceWorkspacePath],
        ['evidenceRef', handoff.evidenceRef],
        ['prompt.available', handoff.promptHandoff.available],
        ['v25Only', handoff.safety.v25Only],
        ['genericShellRunner', handoff.safety.genericShellRunner],
        ['workerCanApproveOwnTask', handoff.safety.workerCanApproveOwnTask]
      ]} />

      <Subsection title="prompt handoff">
        <pre><code>{handoff.promptHandoff.text.text}</code></pre>
      </Subsection>

      <Subsection title="registration form">
        <ul className="goal-event-form-list worker-evidence-registration-form">
          <li>
            <FieldList rows={[
              ['formId', handoff.registrationForm.formId],
              ['eventType', handoff.registrationForm.eventType],
              ['commandName', handoff.registrationForm.commandName],
              ['actorRole', handoff.registrationForm.actorRole],
              ['requiresEvidence', handoff.registrationForm.requiresEvidence],
              ['confirmRequiresPlanHash', handoff.registrationForm.confirmRequiresPlanHash]
            ]} />
            <GoalEventFormFieldList fields={handoff.registrationForm.fields} />
            <GoalEventPlanPreview form={handoff.registrationForm} onGoalEventConfirmed={onGoalEventConfirmed} />
          </li>
        </ul>
      </Subsection>

      <p className="panel-note">{handoff.note}</p>
    </div>
  );
}

function GoalEventFormList({ forms, emptyCopy, onGoalEventConfirmed }) {
  if (forms.state === 'missing' || forms.items.length === 0) {
    return <EmptyBlock copy={emptyCopy} />;
  }

  return (
    <ul className="goal-event-form-list">
      {forms.items.map((form, index) => (
        <li key={`${form.formId.text}-${index}`}>
          <FieldList rows={[
            ['formId', form.formId],
            ['eventType', form.eventType],
            ['eventFamily', form.eventFamily],
            ['commandName', form.commandName],
            ['commandIntent', form.commandIntent],
            ['actorRole', form.actorRole],
            ['actorFlag', form.actorFlag],
            ['phase', form.phase],
            ['recommended', form.recommended],
            ['availableForCurrentNextAction', form.availableForCurrentNextAction],
            ['requiresTask', form.requiresTask],
            ['requiresEvidence', form.requiresEvidence],
            ['confirmRequiresPlanHash', form.confirmRequiresPlanHash],
            ['planPreviewContract', form.planPreviewContract]
          ]} />
          <GoalEventFormFieldList fields={form.fields} />
          <GoalEventPlanPreview form={form} onGoalEventConfirmed={onGoalEventConfirmed} />
        </li>
      ))}
    </ul>
  );
}

function GoalEventPlanPreview({ form, onGoalEventConfirmed }) {
  const [values, setValues] = useState(() => initialGoalEventPreviewValues(form));
  const [previewState, setPreviewState] = useState({
    phase: 'idle',
    plan: null,
    error: null,
    values: null
  });
  const [confirmState, setConfirmState] = useState({
    phase: 'idle',
    result: null,
    error: null
  });
  const formIdentity = goalEventFormIdentity(form);

  useEffect(() => {
    setValues(initialGoalEventPreviewValues(form));
    setPreviewState({
      phase: 'idle',
      plan: null,
      error: null,
      values: null
    });
    setConfirmState({
      phase: 'idle',
      result: null,
      error: null
    });
  }, [formIdentity]);

  const evidenceRefValidation = validateGoalEventEvidenceRefInput(form, values.evidenceRef);
  const previewPath = buildGoalEventPreviewPath(form, values);
  const missingRequired = missingRequiredGoalEventFields(form, values);

  function updateValue(fieldId, value) {
    setValues({
      ...values,
      [fieldId]: value
    });
    setPreviewState({
      phase: 'idle',
      plan: null,
      error: null,
      values: null
    });
    setConfirmState({
      phase: 'idle',
      result: null,
      error: null
    });
  }

  async function handlePreview() {
    if (previewPath === null || missingRequired.length > 0 || evidenceRefValidation.errors.length > 0) {
      const missingCopy = missingRequired.length === 0
        ? '无'
        : missingRequired.join('、');
      const evidenceErrors = evidenceRefValidation.errors.length === 0
        ? ''
        : `；evidence ref 错误：${evidenceRefValidation.errors.join('；')}`;

      setPreviewState({
        phase: 'failed',
        plan: null,
        error: `缺少字段：${missingCopy}${evidenceErrors}`,
        values: null
      });
      return;
    }

    setPreviewState({
      phase: 'loading',
      plan: null,
      error: null,
      values: null
    });
    setConfirmState({
      phase: 'idle',
      result: null,
      error: null
    });

    const result = await fetchGoalEventPlanPreview(previewPath);

    if (result.ok) {
      setPreviewState({
        phase: 'ready',
        plan: result.data,
        error: null,
        values: { ...values }
      });
      return;
    }

    setPreviewState({
      phase: 'failed',
      plan: null,
      error: result.errorEnvelope === null
        ? result.message
        : `${result.errorEnvelope.error.code} / ${result.errorEnvelope.error.message}`,
      values: null
    });
  }

  async function handleConfirm() {
    if (previewState.phase !== 'ready' || previewState.plan === null || previewState.values === null) {
      setConfirmState({
        phase: 'failed',
        result: null,
        error: '需要先生成 dry-run plan preview。'
      });
      return;
    }

    const confirmPath = buildGoalEventConfirmPath(previewState.values);
    const confirmBody = buildGoalEventConfirmBody(form, previewState.values, previewState.plan.planHash);

    if (confirmPath === null || confirmBody === null) {
      setConfirmState({
        phase: 'failed',
        result: null,
        error: 'confirm route unavailable'
      });
      return;
    }

    setConfirmState({
      phase: 'loading',
      result: null,
      error: null
    });

    const result = await confirmGoalEventPlan(confirmPath, confirmBody);

    if (result.ok) {
      setConfirmState({
        phase: 'ready',
        result: result.data,
        error: null
      });

      if (typeof onGoalEventConfirmed === 'function') {
        await onGoalEventConfirmed(result.data);
      }
      return;
    }

    setConfirmState({
      phase: 'failed',
      result: null,
      error: result.errorEnvelope === null
        ? result.message
        : `${result.errorEnvelope.error.code} / ${result.errorEnvelope.error.message}`
    });
  }

  return (
    <div className="goal-event-plan-preview">
      <h3>dry-run preview / confirm</h3>
      <div className="goal-event-preview-fields">
        {form.fields.items
          .filter((field) => shouldRenderGoalEventPreviewInput(field))
          .map((field) => (
            <label key={field.id.text}>
              <span>{field.label.text}</span>
              <GoalEventPreviewInput
                field={field}
                value={values[field.id.value] ?? ''}
                form={form}
                evidenceRefValidation={evidenceRefValidation}
                onChange={(value) => updateValue(field.id.value, value)}
              />
            </label>
          ))}
      </div>
      <div className="goal-event-preview-actions">
        <button type="button" onClick={handlePreview}>Preview dry-run plan</button>
        <code>{previewPath ?? 'preview route unavailable'}</code>
      </div>
      {previewState.phase === 'failed' ? (
        <p className="error-copy">错误摘要：{previewState.error}</p>
      ) : null}
      {previewState.phase === 'loading' ? (
        <p className="empty-copy">正在读取 dry-run plan preview。</p>
      ) : null}
      {previewState.phase === 'ready' ? (
        <div className="goal-event-preview-result">
          <FieldList rows={[
            ['operationId', textValue(previewState.plan.operationRun?.operationId)],
            ['operationStatus', textValue(previewState.plan.operationRun?.status)],
            ['planHash', textValue(previewState.plan.planHash)],
            ['command', textValue(previewState.plan.eventSummary.commandName)],
            ['eventType', textValue(previewState.plan.eventSummary.eventType)],
            ['taskId', textValue(previewState.plan.eventSummary.taskId)],
            ['actorRole', textValue(previewState.plan.eventSummary.actorRole)],
            ['actorId', textValue(previewState.plan.eventSummary.actorId)],
            ['operationStartedAt', textValue(previewState.plan.operationRun?.timestamps?.startedAt)],
            ['writesInDryRun', textValue(previewState.plan.eventSummary.writesInDryRun)],
            ['confirmAvailable', textValue(previewState.plan.previewEndpoint.confirmAvailable)]
          ]} />
          <code>{previewState.plan.confirm.copyOnlyCommand}</code>
          <div className="goal-event-confirm-actions">
            <button type="button" onClick={handleConfirm}>Confirm event append</button>
            <code>{buildGoalEventConfirmPath(previewState.values) ?? 'confirm route unavailable'}</code>
          </div>
        </div>
      ) : null}
      {confirmState.phase === 'failed' ? (
        <p className="error-copy">confirm 错误摘要：{confirmState.error}</p>
      ) : null}
      {confirmState.phase === 'loading' ? (
        <p className="empty-copy">正在确认 event append，并刷新 goal-status / events / next action / closeout。</p>
      ) : null}
      {confirmState.phase === 'ready' ? (
        <div className="goal-event-confirm-result">
          <FieldList rows={[
            ['operationId', textValue(confirmState.result.operationRun?.operationId)],
            ['operationStatus', textValue(confirmState.result.operationRun?.status)],
            ['status', textValue(confirmState.result.status)],
            ['written', textValue(confirmState.result.written)],
            ['eventType', textValue(confirmState.result.eventSummary.eventType)],
            ['sequence', textValue(confirmState.result.eventSummary.sequence)],
            ['eventId', textValue(confirmState.result.eventSummary.eventId)],
            ['eventHash', textValue(confirmState.result.eventSummary.eventHash)],
            ['operationCompletedAt', textValue(confirmState.result.operationRun?.timestamps?.completedAt)],
            ['refreshed.progress', textValue(confirmState.result.refreshed.progress?.contractName)],
            ['refreshed.events', textValue(confirmState.result.refreshed.events?.contractName)],
            ['refreshed.nextAction', textValue(confirmState.result.refreshed.nextAction?.contractName)],
            ['refreshed.closeout', textValue(confirmState.result.refreshed.closeout?.contractName)],
            ['refreshed.closeout.missingCount', textValue(confirmState.result.refreshed.closeout?.missing?.length)],
            ['refreshed.closeout.releaseReady', textValue(confirmState.result.refreshed.closeout?.summary?.releaseReady)]
          ]} />
        </div>
      ) : null}
      <GoalOperationInlineConsole
        form={form}
        values={values}
        previewPath={previewPath}
        previewState={previewState}
        confirmState={confirmState}
      />
    </div>
  );
}

function GoalOperationInlineConsole({
  form,
  values,
  previewPath,
  previewState,
  confirmState
}) {
  const transcript = buildGoalOperationInlineTranscript({
    previewPath,
    previewState,
    confirmState
  });
  const failureRecovery = buildGoalOperationFailureRecovery({
    form,
    values,
    previewPath,
    previewState,
    confirmState,
    transcript
  });

  return (
    <div className="goal-operation-inline-console" aria-label="goal operation console">
      <h4>operation console</h4>
      <FieldList rows={[
        ['command preview', transcript.commandPreview],
        ['exitCode', transcript.exitCode],
        ['planHash', transcript.planHash],
        ['eventId', transcript.eventId],
        ['nextAction', transcript.nextAction]
      ]} />
      <div className="operation-console-streams">
        <label>
          <span>stdout</span>
          <pre><code>{transcript.stdout.text}</code></pre>
        </label>
        <label>
          <span>stderr</span>
          <pre><code>{transcript.stderr.text}</code></pre>
        </label>
      </div>
      <GoalOperationFailureRecovery recovery={failureRecovery} />
    </div>
  );
}

function GoalOperationFailureRecovery({ recovery }) {
  if (recovery.available.value !== true) {
    return null;
  }

  return (
    <div className="operation-recovery-shortcuts" aria-label="failure recovery shortcuts">
      <h5>failure recovery</h5>
      <FieldList rows={[
        ['failedStep', recovery.failedStep],
        ['copyOnly', recovery.copyOnly],
        ['browserExecutionAvailable', recovery.browserExecutionAvailable]
      ]} />
      <ul>
        {recovery.items.map((item) => (
          <li key={item.id.text}>
            <strong>{item.label.text}</strong>
            <pre><code>{item.text.text}</code></pre>
          </li>
        ))}
      </ul>
    </div>
  );
}

function buildGoalOperationFailureRecovery({
  form,
  values,
  previewPath,
  previewState,
  confirmState,
  transcript
}) {
  const failedStep = confirmState.phase === 'failed'
    ? 'confirm'
    : previewState.phase === 'failed' ? 'dry-run-preview' : null;

  if (failedStep === null) {
    return {
      available: textValue(false),
      failedStep: textValue(undefined),
      copyOnly: textValue(true),
      browserExecutionAvailable: textValue(false),
      items: []
    };
  }

  const dryRunCommand = buildGoalEventDryRunCopyCommand(form, values);
  const command = confirmState.phase === 'failed'
    ? previewState.plan?.confirm?.copyOnlyCommand ?? dryRunCommand
    : dryRunCommand;
  const failure = transcript.stderr.text || 'failure details unavailable';
  const goalId = stringValue(values?.goalId);
  const taskId = stringValue(values?.taskId);
  const eventType = stringValue(values?.eventType ?? form?.eventType?.value);
  const actor = firstNonEmptyText(
    stringValue(values?.actorId),
    stringValue(values?.reviewerId),
    stringValue(values?.verifierId)
  );
  const hasPreviewOnlyFields = [
    values?.blockerId,
    values?.blockerReason,
    values?.blockerSeverity
  ].some((value) => stringValue(value) !== '');
  const retryDryRun = hasPreviewOnlyFields
    ? previewPath ?? dryRunCommand ?? 'dry-run preview route unavailable'
    : dryRunCommand ?? previewPath ?? 'dry-run preview route unavailable';
  const copyCommand = command ?? previewPath ?? 'command unavailable';

  return {
    available: textValue(true),
    failedStep: textValue(failedStep),
    copyOnly: textValue(true),
    browserExecutionAvailable: textValue(false),
    items: [{
      id: textValue('retry-dry-run'),
      label: textValue('retry dry-run'),
      text: textValue(retryDryRun)
    }, {
      id: textValue('copy-command'),
      label: textValue('copy command'),
      text: textValue(copyCommand)
    }, {
      id: textValue('copy-reviewer-prompt'),
      label: textValue('copy reviewer prompt'),
      text: textValue([
        '/goal',
        `Review the failed Workbench goal operation for ${goalId || '<goal-id>'}.`,
        `Task: ${taskId || '<task-id>'}`,
        `Event/form: ${eventType || '<event-type>'}`,
        `Actor: ${actor || '<actor-id>'}`,
        `Failed step: ${failedStep}`,
        `Failure: ${failure}`,
        `Command to inspect: ${copyCommand}`,
        'Check the input, plan hash, evidence ref, and role boundary. Do not approve or verify from this prompt alone.'
      ].join('\n'))
    }, {
      id: textValue('copy-issue-prompt'),
      label: textValue('copy issue prompt'),
      text: textValue([
        '/goal',
        `Open or update an issue for the failed Workbench goal operation on ${goalId || '<goal-id>'}.`,
        `Task: ${taskId || '<task-id>'}`,
        `Failed step: ${failedStep}`,
        `Failure: ${failure}`,
        `Retry dry-run: ${retryDryRun}`,
        'Include the observed error, the copied command, and the next owner. Keep this as tracking text; it is not evidence of completion.'
      ].join('\n'))
    }]
  };
}

function buildGoalOperationInlineTranscript({
  previewPath,
  previewState,
  confirmState
}) {
  const confirmResult = confirmState.result;
  const previewPlan = previewState.plan;
  const failure = confirmState.phase === 'failed'
    ? confirmState.error
    : previewState.phase === 'failed'
      ? previewState.error
      : null;
  const successResult = confirmState.phase === 'ready'
    ? confirmResult
    : previewState.phase === 'ready'
      ? previewPlan
      : null;
  const exitCode = failure !== null
    ? 1
    : successResult === null ? undefined : 0;
  const planHash = confirmResult?.planHash ?? previewPlan?.planHash;
  const eventId = confirmResult?.eventSummary?.eventId;
  const nextAction = confirmResult?.refreshed?.nextAction?.next;
  const commandPreview = previewPlan?.confirm?.copyOnlyCommand ?? previewPath;
  const stdout = successResult === null
    ? ''
    : [
        `operationStatus=${confirmResult?.operationRun?.status ?? previewPlan?.operationRun?.status ?? 'ready'}`,
        `planHash=${planHash ?? 'missing'}`,
        eventId === undefined ? 'eventId=none' : `eventId=${eventId}`,
        nextAction === undefined
          ? 'nextAction=not-refreshed'
          : `nextAction=${nextAction.taskId ?? 'missing'}:${nextAction.role ?? 'missing'}:${nextAction.phase ?? 'missing'}`
      ].join('\n');

  return {
    commandPreview: textValue(commandPreview),
    stdout: textValue(stdout),
    stderr: textValue(failure ?? ''),
    exitCode: textValue(exitCode),
    planHash: textValue(planHash),
    eventId: textValue(eventId),
    nextAction: textValue(nextAction === undefined
      ? undefined
      : `${nextAction.taskId ?? '未暴露'} / ${nextAction.role ?? '未暴露'} / ${nextAction.phase ?? '未暴露'}`)
  };
}

function GoalEventPreviewInput({
  field,
  value,
  form,
  evidenceRefValidation,
  onChange
}) {
  if (field.options.state === 'available' && field.options.items.length > 0) {
    return (
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {field.options.items.map((option) => (
          <option key={option.value} value={option.value}>{option.text}</option>
        ))}
      </select>
    );
  }

  if (field.id.value === 'evidenceRef') {
    return (
      <EvidenceRefInput
        value={value}
        placeholder={field.placeholder.text}
        readOnly={field.readOnly.value === true}
        helper={form.evidenceRefHelper}
        validation={evidenceRefValidation}
        onChange={onChange}
      />
    );
  }

  return (
    <input
      value={value}
      placeholder={field.placeholder.text}
      readOnly={field.readOnly.value === true}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function EvidenceRefInput({
  value,
  placeholder,
  readOnly,
  helper,
  validation,
  onChange
}) {
  const recentRefs = helper?.recentRefs?.items ?? [];

  function useEvidenceRef(ref) {
    if (String(ref ?? '').trim() === '') {
      return;
    }

    const currentRefs = String(value ?? '')
      .split(/[\r\n,]+/u)
      .map((entry) => entry.trim())
      .filter((entry) => entry !== '');

    if (currentRefs.includes(ref)) {
      return;
    }

    onChange([...currentRefs, ref].join(', '));
  }

  return (
    <div className="evidence-ref-helper">
      <input
        value={value}
        placeholder={placeholder}
        readOnly={readOnly}
        onChange={(event) => onChange(event.target.value)}
      />
      {recentRefs.length > 0 ? (
        <select
          className="evidence-ref-choice-select"
          aria-label="Recent evidence refs"
          value=""
          onChange={(event) => useEvidenceRef(event.target.value)}
        >
          <option value="">Recent evidence refs</option>
          {recentRefs.map((candidate, index) => (
            <option key={`${candidate.ref.value}-${index}`} value={candidate.ref.value}>
              {candidate.ref.text}
            </option>
          ))}
        </select>
      ) : null}
      {validation.errors.length > 0 ? (
        <ul className="evidence-ref-error-list" aria-label="Evidence ref errors">
          {validation.errors.map((error, index) => (
            <li key={`${error}-${index}`}>{error}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function initialGoalEventPreviewValues(form) {
  return Object.fromEntries(form.fields.items.map((field) => [
    field.id.value,
    field.value.state === 'available' ? String(field.value.value) : ''
  ]));
}

function goalEventFormIdentity(form) {
  const goalId = form.fields.items.find((field) => field.id.value === 'goalId')?.value.value;
  const taskId = form.fields.items.find((field) => field.id.value === 'taskId')?.value.value;

  return [goalId, taskId, form.eventType.value]
    .map((part) => String(part ?? '').trim())
    .join('::');
}

function shouldRenderGoalEventPreviewInput(field) {
  return [
    'goalId',
    'taskId',
    'eventType',
    'actorId',
    'reviewerId',
    'verifierId',
    'verdict',
    'gateName',
    'gateStatus',
    'evidenceRef',
    'failedCommand',
    'statement',
    'branch',
    'commit',
    'blockerId',
    'blockerReason',
    'blockerSeverity'
  ].includes(field.id.value);
}

function missingRequiredGoalEventFields(form, values) {
  return form.fields.items
    .filter((field) => shouldRenderGoalEventPreviewInput(field) && field.required.value === true)
    .filter((field) => String(values[field.id.value] ?? '').trim() === '')
    .map((field) => field.label.text);
}

function buildGoalEventPreviewPath(form, values) {
  const goalId = String(values.goalId ?? '').trim();

  if (goalId === '') {
    return null;
  }

  const searchParams = new URLSearchParams();
  const commandName = form.commandName.value;

  if (commandName === 'symphony goal update') {
    searchParams.set('command', 'update');
    appendSearchParam(searchParams, 'task', values.taskId);
    appendSearchParam(searchParams, 'event', values.eventType);
    appendSearchParam(searchParams, 'actor', values.actorId);
  } else if (commandName === 'symphony goal review') {
    searchParams.set('command', 'review');
    appendSearchParam(searchParams, 'task', values.taskId);
    appendSearchParam(searchParams, 'reviewer', values.reviewerId);
    appendSearchParam(searchParams, 'verdict', values.verdict);
  } else if (commandName === 'symphony goal gate') {
    searchParams.set('command', 'gate');
    appendSearchParam(searchParams, 'task', values.taskId);
    appendSearchParam(searchParams, 'gate', values.gateName);
    appendSearchParam(searchParams, 'status', values.gateStatus);
    appendSearchParam(searchParams, 'verifier', values.verifierId);
  } else {
    return null;
  }

  appendSearchParam(searchParams, 'statement', values.statement);
  appendSearchParam(searchParams, 'branch', values.branch);
  appendSearchParam(searchParams, 'commit', values.commit);
  appendSearchParam(searchParams, 'blockerId', values.blockerId);
  appendSearchParam(searchParams, 'blockerReason', values.blockerReason);
  appendSearchParam(searchParams, 'blockerSeverity', values.blockerSeverity);

  for (const failedCommand of parseGoalEventListInput(values.failedCommand).items) {
    appendSearchParam(searchParams, 'failedCommand', failedCommand);
  }

  for (const evidenceRef of parseGoalEventEvidenceRefs(values.evidenceRef).refs) {
    appendSearchParam(searchParams, 'evidenceRef', evidenceRef);
  }

  const previewPath = GOAL_EVENT_PLAN_PREVIEW_PATH_TEMPLATE.replace('<goal-id>', encodeURIComponent(goalId));

  return `${previewPath}?${searchParams.toString()}`;
}

function buildGoalEventConfirmPath(values) {
  const goalId = String(values?.goalId ?? '').trim();

  if (goalId === '') {
    return null;
  }

  return GOAL_EVENT_PLAN_CONFIRM_PATH_TEMPLATE.replace('<goal-id>', encodeURIComponent(goalId));
}

function buildGoalEventConfirmBody(form, values, planHash) {
  const commandName = form.commandName.value;
  const body = {
    planHash
  };

  if (commandName === 'symphony goal update') {
    body.command = 'update';
    assignBodyValue(body, 'task', values.taskId);
    assignBodyValue(body, 'event', values.eventType);
    assignBodyValue(body, 'actor', values.actorId);
  } else if (commandName === 'symphony goal review') {
    body.command = 'review';
    assignBodyValue(body, 'task', values.taskId);
    assignBodyValue(body, 'reviewer', values.reviewerId);
    assignBodyValue(body, 'verdict', values.verdict);
  } else if (commandName === 'symphony goal gate') {
    body.command = 'gate';
    assignBodyValue(body, 'task', values.taskId);
    assignBodyValue(body, 'gate', values.gateName);
    assignBodyValue(body, 'status', values.gateStatus);
    assignBodyValue(body, 'verifier', values.verifierId);
  } else {
    return null;
  }

  assignBodyValue(body, 'statement', values.statement);
  assignBodyValue(body, 'branch', values.branch);
  assignBodyValue(body, 'commit', values.commit);
  assignBodyValue(body, 'blockerId', values.blockerId);
  assignBodyValue(body, 'blockerReason', values.blockerReason);
  assignBodyValue(body, 'blockerSeverity', values.blockerSeverity);

  const failedCommands = parseGoalEventListInput(values.failedCommand).items;

  if (failedCommands.length > 0) {
    body.failedCommand = failedCommands;
  }

  const evidenceRefs = parseGoalEventEvidenceRefs(values.evidenceRef).refs;

  if (evidenceRefs.length > 0) {
    body.evidenceRef = evidenceRefs;
  }

  return body;
}

function buildGoalEventDryRunCopyCommand(form, values) {
  const commandName = form?.commandName?.value;
  const parts = ['pnpm', '--silent', 'symphony'];

  if (commandName === 'symphony goal update') {
    parts.push('goal', 'update');
    appendCommandFlag(parts, '--goal', values?.goalId);
    appendCommandFlag(parts, '--task', values?.taskId);
    appendCommandFlag(parts, '--event', values?.eventType);
    appendCommandFlag(parts, '--actor', values?.actorId);
  } else if (commandName === 'symphony goal review') {
    parts.push('goal', 'review');
    appendCommandFlag(parts, '--goal', values?.goalId);
    appendCommandFlag(parts, '--task', values?.taskId);
    appendCommandFlag(parts, '--reviewer', values?.reviewerId);
    appendCommandFlag(parts, '--verdict', values?.verdict);
  } else if (commandName === 'symphony goal gate') {
    parts.push('goal', 'gate');
    appendCommandFlag(parts, '--goal', values?.goalId);
    appendCommandFlag(parts, '--task', values?.taskId);
    appendCommandFlag(parts, '--gate', values?.gateName);
    appendCommandFlag(parts, '--status', values?.gateStatus);
    appendCommandFlag(parts, '--verifier', values?.verifierId);
  } else {
    return null;
  }

  appendCommandFlag(parts, '--statement', values?.statement);
  appendCommandFlag(parts, '--branch', values?.branch);
  appendCommandFlag(parts, '--commit', values?.commit);

  for (const failedCommand of parseGoalEventListInput(values?.failedCommand).items) {
    appendCommandFlag(parts, '--failed-command', failedCommand);
  }

  for (const evidenceRef of parseGoalEventEvidenceRefs(values?.evidenceRef).refs) {
    appendCommandFlag(parts, '--evidence-ref', evidenceRef);
  }

  parts.push('--dry-run', '--json');

  return parts.map(shellToken).join(' ');
}

function appendCommandFlag(parts, flag, value) {
  const normalized = String(value ?? '').trim();

  if (normalized !== '') {
    parts.push(flag, normalized);
  }
}

function shellToken(value) {
  const text = String(value);

  if (/^[A-Za-z0-9_./:=@+-]+$/u.test(text)) {
    return text;
  }

  return `'${text.replaceAll("'", "'\\''")}'`;
}

function assignBodyValue(body, key, value) {
  const normalized = String(value ?? '').trim();

  if (normalized !== '') {
    body[key] = normalized;
  }
}

function appendSearchParam(searchParams, key, value) {
  const normalized = String(value ?? '').trim();

  if (normalized !== '') {
    searchParams.append(key, normalized);
  }
}

function validateGoalEventEvidenceRefInput(form, value) {
  const evidenceField = form.fields.items.find((field) => field.id.value === 'evidenceRef');
  const required = evidenceField?.required.value === true;
  const parsed = parseGoalEventEvidenceRefs(value);
  const errors = [...parsed.errors];

  if (required && parsed.refs.length === 0) {
    errors.unshift('required evidence ref is missing');
  }

  return {
    refs: parsed.refs,
    errors
  };
}

function parseGoalEventEvidenceRefs(value) {
  const refs = [];
  const errors = [];
  const entries = String(value ?? '')
    .split(/[\r\n,]+/u)
    .map((entry) => entry.trim())
    .filter((entry) => entry !== '');

  entries.forEach((entry, index) => {
    const normalized = normalizeGoalEventEvidenceRef(entry);

    if (normalized === null) {
      errors.push(`line ${index + 1} must be docs/plans/<file> or a managed artifact ref`);
      return;
    }

    if (!refs.includes(normalized)) {
      refs.push(normalized);
    }
  });

  return {
    refs,
    errors
  };
}

function parseGoalEventListInput(value) {
  const items = [];
  const entries = String(value ?? '')
    .split(/[\r\n]+/u)
    .map((entry) => entry.trim())
    .filter((entry) => entry !== '');

  for (const entry of entries) {
    if (!items.includes(entry)) {
      items.push(entry);
    }
  }

  return {
    items
  };
}

function normalizeGoalEventEvidenceRef(value) {
  const ref = String(value ?? '').trim();

  if (ref === '' || hasUnsafeGoalEventEvidenceRefInput(ref)) {
    return null;
  }

  if (ref.startsWith('repo-doc:')) {
    const repoDocRef = ref.slice('repo-doc:'.length);

    return repoDocRef.startsWith('docs/plans/') && !hasUnsafeGoalEventEvidenceRefInput(repoDocRef)
      ? repoDocRef
      : null;
  }

  if (ref.startsWith('docs/plans/')) {
    return ref;
  }

  if (ref.startsWith('artifact-ref:')) {
    return ref.slice('artifact-ref:'.length).trim() === '' ? null : ref;
  }

  if (ref.startsWith('artifact:') || ref.startsWith('artifacts/') || ref.startsWith('managed-artifact:')) {
    return `artifact-ref:${ref}`;
  }

  return null;
}

function hasUnsafeGoalEventEvidenceRefInput(ref) {
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

    return decoded !== ref && hasUnsafeGoalEventEvidenceRefInput(decoded);
  } catch {
    return true;
  }
}

function GoalEventFormFieldList({ fields }) {
  if (fields.state === 'missing' || fields.items.length === 0) {
    return <EmptyBlock copy="form fields 为空。" />;
  }

  return (
    <ul className="goal-event-form-field-list">
      {fields.items.map((field, index) => (
        <li key={`${field.id.text}-${index}`}>
          <FieldList rows={[
            ['id', field.id],
            ['label', field.label],
            ['flag', field.flag],
            ['inputType', field.inputType],
            ['required', field.required],
            ['readOnly', field.readOnly],
            ['value', field.value],
            ['placeholder', field.placeholder],
            ['source', field.source]
          ]} />
          <GoalEventFormFieldOptions options={field.options} />
        </li>
      ))}
    </ul>
  );
}

function GoalEventFormFieldOptions({ options }) {
  if (options.state !== 'available') {
    return null;
  }

  return (
    <div className="field-options">
      {options.items.map((option, index) => (
        <span key={`${option.text}-${index}`}>{option.text}</span>
      ))}
    </div>
  );
}

function TextItemList({ items, emptyCopy }) {
  if (items?.state === 'missing' || items === undefined || items === null) {
    return <EmptyBlock copy={emptyCopy} />;
  }

  const normalizedItems = Array.isArray(items) ? items : items.items;

  if (!Array.isArray(normalizedItems) || normalizedItems.length === 0) {
    return <EmptyBlock copy={emptyCopy} />;
  }

  return (
    <ul className="command-text-list" aria-label="copy-only text list">
      {normalizedItems.map((item, index) => (
        <li key={`${item.text}-${index}`}>
          <code>{item.text}</code>
        </li>
      ))}
    </ul>
  );
}

function CopyBlock({ value, emptyCopy }) {
  if (typeof value !== 'string' || value.length === 0) {
    return <EmptyBlock copy={emptyCopy} />;
  }

  return (
    <pre className="copy-block"><code>{value}</code></pre>
  );
}

function EvidenceRefItemList({ refs }) {
  const items = refs?.items ?? [];

  if (items.length === 0) {
    return <EmptyBlock copy="explicit event evidence refs 为空。" />;
  }

  return (
    <ul className="evidence-ref-list">
      {items.map((item, index) => (
        <li key={`${item.ref.text}-${index}`}>
          <FieldList rows={[
            ['kind', item.kind],
            ['ref', item.ref],
            ['label', item.label],
            ['eventId', item.eventId],
            ['eventType', item.eventType]
          ]} />
        </li>
      ))}
    </ul>
  );
}

function PromptPreviewList({ prompts }) {
  if (!Array.isArray(prompts) || prompts.length === 0) {
    return <EmptyBlock copy="copy-only prompt text 未暴露或为空。" />;
  }

  return (
    <ul className="prompt-preview-list">
      {prompts.map((prompt, index) => (
        <li key={`${prompt.taskId.text}-${prompt.role.text}-${index}`}>
          <FieldList rows={[
            ['source', prompt.sourceContract],
            ['taskId', prompt.taskId],
            ['role', prompt.role],
            ['phase', prompt.phase],
            ['title', prompt.title],
            ['format', prompt.format],
            ['revision trigger', prompt.revisionContext.triggerEventType],
            ['revision blockers', prompt.revisionContext.blockerCount],
            ['revision failed commands', prompt.revisionContext.recordedFailedCommandCount],
            ['revision rerun commands', prompt.revisionContext.rerunCommandCount],
            ['revision changed files', prompt.revisionContext.changedFileCount],
            ['revision acceptance delta', prompt.revisionContext.acceptanceDeltaCount]
          ]} />
          <pre className="prompt-preview-text"><code>{prompt.text.text}</code></pre>
        </li>
      ))}
    </ul>
  );
}

function CloseoutMissingList({ missing }) {
  if (missing.state === 'missing') {
    return <EmptyBlock copy="missing items 未暴露。" />;
  }

  if (missing.items.length === 0) {
    return <EmptyBlock copy="closeout gaps 为空。" />;
  }

  return (
    <ul className="closeout-missing-list">
      {missing.items.map((item, index) => (
        <li key={`${item.kind.text}-${item.taskId.text}-${item.gateId.text}-${index}`}>
          <FieldList rows={[
            ['kind', item.kind],
            ['taskId', item.taskId],
            ['expectedEvent', item.expectedEvent],
            ['gate', item.gate],
            ['gateId', item.gateId],
            ['status', item.status]
          ]} />
        </li>
      ))}
    </ul>
  );
}

function EvidenceRefList({ evidenceRefs }) {
  if (evidenceRefs.state === 'missing') {
    return <EmptyBlock copy="evidence refs missing。" />;
  }

  if (evidenceRefs.items.length === 0) {
    return <EmptyBlock copy="evidence refs empty。" />;
  }

  return (
    <ul className="evidence-ref-list">
      {evidenceRefs.items.map((ref, index) => (
        <li key={`${ref.ref.text}-${index}`}>
          <FieldList rows={[
            ['kind', ref.kind],
            ['label', ref.label],
            ['ref', ref.ref]
          ]} />
        </li>
      ))}
    </ul>
  );
}

function EvidenceMatrixTaskList({ tasks }) {
  if (tasks.state === 'empty') {
    return <EmptyBlock copy="task evidence matrix empty。" />;
  }

  return (
    <ul className="evidence-matrix-task-list">
      {tasks.items.map((task, index) => (
        <li key={`${task.taskId.text}-${index}`}>
          <FieldList rows={[
            ['taskId', task.taskId],
            ['title', task.title],
            ['ledgerStatus', task.ledgerStatus],
            ['worker evidence', task.workerEvidence],
            ['review verdict', task.reviewVerdict],
            ['review evidence', task.reviewEvidence],
            ['main verification', task.mainVerification],
            ['blocker', task.blocker],
            ['release gate coverage', task.releaseGateCoverage]
          ]} />
        </li>
      ))}
    </ul>
  );
}

function ReleaseGateMatrixList({ releaseGates }) {
  if (releaseGates.state === 'empty') {
    return <EmptyBlock copy="release gate coverage unknown。" />;
  }

  return (
    <ul className="release-gate-matrix-list">
      {releaseGates.items.map((gate, index) => (
        <li key={`${gate.gate.text}-${index}`}>
          <FieldList rows={[
            ['gate', gate.gate],
            ['status', gate.status],
            ['eventType', gate.eventType]
          ]} />
          <EvidenceRefList evidenceRefs={gate.evidenceRefs} />
        </li>
      ))}
    </ul>
  );
}

function KeyValueList({ rows, nameKey, valueKey, emptyCopy }) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return <EmptyBlock copy={emptyCopy} />;
  }

  return (
    <ul className="compact-list">
      {rows.map((row, index) => (
        <li key={`${row[nameKey].text}-${index}`}>
          <strong>{row[nameKey].text}</strong>
          <span>{row[valueKey].text}</span>
        </li>
      ))}
    </ul>
  );
}

function BlockerList({ blockers }) {
  if (!Array.isArray(blockers) || blockers.length === 0) {
    return <EmptyBlock copy="无已暴露 blocker。" />;
  }

  return (
    <ul className="compact-list">
      {blockers.map((blocker, index) => (
        <li key={`${blocker.id.text}-${index}`}>
          <strong>{blocker.reason.text}</strong>
          <span>{blocker.taskId.text}</span>
          <span>{blocker.severity.text}</span>
        </li>
      ))}
    </ul>
  );
}

function NextActionList({ actions }) {
  if (!Array.isArray(actions) || actions.length === 0) {
    return <EmptyBlock copy="nextActions 未暴露。" />;
  }

  return (
    <ul className="command-text-list" aria-label="next copy-only command text">
      {actions.map((action, index) => (
        <li key={`${action.label.text}-${index}`}>
          <FieldList rows={[
            ['kind', action.kind],
            ['label', action.label]
          ]} />
          <code>{action.command.text}</code>
        </li>
      ))}
    </ul>
  );
}

function DiagnosticsCheckList({ checks }) {
  if (checks.state === 'missing') {
    return <EmptyBlock copy="checks 未暴露。" />;
  }

  if (checks.items.length === 0) {
    return <EmptyBlock copy="checks 为空。" />;
  }

  return (
    <ul className="compact-list">
      {checks.items.map((check) => (
        <li key={check.id.text}>
          <strong>{check.label.text}</strong>
          <span>{check.status.text}</span>
          <span>{check.severity.text}</span>
        </li>
      ))}
    </ul>
  );
}

function ShellState({ title, copy }) {
  return (
    <section className="shell-state" aria-label={title}>
      <h2>{title}</h2>
      <p>{copy}</p>
    </section>
  );
}

function EmptyBlock({ copy }) {
  return <p className="empty-copy">{copy}</p>;
}

function findRoute(routes, id) {
  return routes.find((route) => route.id === id) ?? null;
}

function currentWorkbenchRoute() {
  const pathname = typeof globalThis.location?.pathname === 'string'
    ? globalThis.location.pathname
    : '/workbench/';
  const normalized = pathname.endsWith('/') ? pathname : `${pathname}/`;

  if (normalized === '/workbench/prompts/') {
    return 'prompts';
  }

  return 'home';
}

function buildWorkbenchStateHeader({ model, phase, routeCounts, routeContext }) {
  const activeGoal = model?.activeGoal;
  const viewModel = activeGoal?.viewModel;
  const nextAction = activeGoal?.nextAction;
  const operationConsole = activeGoal?.operationConsole;
  const latestOperation = operationConsole?.latest;
  const evidenceCount = routeContext?.evidenceRefs?.count?.value;
  const nextTask = firstText(
    nextAction?.next?.taskId,
    viewModel?.next?.taskId,
    activeGoal?.taskQueue?.nextTaskId
  );
  const nextRole = firstText(nextAction?.next?.role, viewModel?.next?.role, activeGoal?.taskQueue?.nextRole);
  const nextPhase = firstText(nextAction?.next?.phase, viewModel?.next?.phase, activeGoal?.taskQueue?.nextPhase);
  const nextStatus = firstText(nextAction?.status);
  const latestOperationText = latestOperation?.state === 'available'
    ? [
        textValueFromState(latestOperation.operationId),
        textValueFromState(latestOperation.status)
      ].filter((value) => value !== '').join(' / ')
    : firstText(operationConsole?.latestOperationId);

  return {
    items: [
      {
        id: 'goal',
        label: 'goal',
        value: firstText(routeContext?.goalId, viewModel?.goalId, nextAction?.goalId, activeGoal?.taskQueue?.goalId, '未暴露'),
        source: 'route context / goal-status'
      },
      {
        id: 'task',
        label: 'task',
        value: firstText(routeContext?.taskId, nextTask, '未暴露'),
        source: 'route context / goal-next-action'
      },
      {
        id: 'next-action',
        label: 'next action',
        value: [firstText(routeContext?.activeRole, nextRole), firstText(routeContext?.activePhase, nextPhase), nextStatus].filter((value) => value !== '').join(' / ') || '未暴露',
        source: 'goal next'
      },
      {
        id: 'latest-operation',
        label: 'latest operation',
        value: firstText(routeContext?.operationId, latestOperationText, '暂无 operation'),
        source: 'route context / goal-operation-runs'
      },
      {
        id: 'evidence',
        label: 'evidence refs',
        value: typeof evidenceCount === 'number' ? `${evidenceCount} refs` : '暂无 evidence refs',
        source: 'events / ledger / latest run'
      },
      {
        id: 'routes',
        label: 'routes',
        value: phase === 'ready' ? `${routeCounts.ready}/${routeCounts.total} ready` : phaseText(phase),
        source: 'console API'
      }
    ]
  };
}

function workbenchNavItemClassName(item, currentRoute) {
  return workbenchNavItemActive(item, currentRoute) ? 'workbench-nav-item active' : 'workbench-nav-item';
}

function workbenchNavItemActive(item, currentRoute) {
  return item.route === '/workbench/prompts/'
    ? currentRoute === 'prompts'
    : currentRoute === 'home' && item.id === 'active-goal';
}

function workbenchNavHref(item, routeContext) {
  const query = workbenchContextQuery(routeContext);

  if (item.route) {
    return `${item.route}${query}`;
  }

  return `/workbench/${query}#${item.targetId}`;
}

function workbenchContextQuery(routeContext) {
  const searchParams = new URLSearchParams();

  appendRouteContextParam(searchParams, 'goal', routeContext?.goalId?.value);
  appendRouteContextParam(searchParams, 'task', routeContext?.taskId?.value);
  appendRouteContextParam(searchParams, 'role', routeContext?.activeRole?.value);
  appendRouteContextParam(searchParams, 'operation', routeContext?.operationId?.value);
  appendRouteContextParam(searchParams, 'run', routeContext?.runId?.value);

  for (const evidenceRef of routeContext?.evidenceRefs?.items ?? []) {
    appendRouteContextParam(searchParams, 'evidence', evidenceRef.ref.value);
  }

  const query = searchParams.toString();

  return query === '' ? '' : `?${query}`;
}

function appendRouteContextParam(searchParams, key, value) {
  const normalized = stringValue(value);

  if (normalized !== '') {
    searchParams.append(key, normalized);
  }
}

function currentWorkbenchSearchParams() {
  const search = typeof globalThis.location?.search === 'string'
    ? globalThis.location.search
    : '';

  return new URLSearchParams(search);
}

function safeRouteContextToken(value) {
  const token = stringValue(value);

  return /^[A-Za-z0-9][A-Za-z0-9._-]*$/u.test(token) ? token : null;
}

function safePromptWorkspaceRole(value) {
  const role = stringValue(value);

  return PROMPT_WORKSPACE_ROLES.some((candidate) => candidate.id === role) ? role : null;
}

function firstText(...values) {
  for (const value of values) {
    const text = textValueFromState(value);

    if (text !== '') {
      return text;
    }
  }

  return '';
}

function textValueFromState(value) {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'object' && 'text' in value) {
    return String(value.text ?? '').trim();
  }

  return String(value).trim();
}

function routeStateCounts(routes) {
  return {
    total: routes.length,
    ready: routes.filter((route) => route.state === 'ready').length
  };
}

function routeStateText(route) {
  if (route === null || route === undefined) {
    return '等待读取';
  }

  if (route.state === 'ready') {
    return '已读取';
  }

  if (route.state === 'skipped') {
    return '不适用';
  }

  return '不可用';
}

function latestRunStateText(latestRun, route) {
  if (latestRun.state === 'empty') {
    return '无运行记录';
  }

  if (latestRun.state === 'unavailable') {
    return '不可用';
  }

  return routeStateText(route);
}

function timelineStateText(timeline, route) {
  if (timeline.state === 'empty') {
    return '暂无 timeline';
  }

  if (timeline.state === 'missing') {
    return '未暴露';
  }

  if (timeline.state === 'unavailable') {
    return '不可用';
  }

  return routeStateText(route);
}

function handoffStateText(handoff, route) {
  if (handoff.state === 'missing') {
    return '未暴露';
  }

  if (handoff.state === 'unavailable') {
    return '不可用';
  }

  return routeStateText(route);
}

function goalProgressStateText(progress, route) {
  if (progress.state === 'missing') {
    return '未暴露';
  }

  if (progress.state === 'unavailable') {
    return '不可用';
  }

  return routeStateText(route);
}

function goalEventsStateText(events, route) {
  if (events.state === 'missing') {
    return '未暴露';
  }

  if (events.state === 'unavailable') {
    return '不可用';
  }

  if (events.timeline.state === 'empty') {
    return '未登记事件';
  }

  return routeStateText(route);
}

function activeGoalStateText(value, route) {
  if (value.state === 'missing') {
    return '未暴露';
  }

  if (value.state === 'unavailable') {
    return '不可用';
  }

  if (value.state === 'empty') {
    return '空';
  }

  return routeStateText(route);
}

function activeGoalTaskQueueStateText(taskQueue, route) {
  if (taskQueue.state === 'empty') {
    return '无任务';
  }

  return activeGoalStateText(taskQueue, route);
}

function implementationEligibilityStateText(eligibility) {
  if (eligibility?.state === 'eligible') {
    return '可进入 controlled implementation';
  }

  if (eligibility?.state === 'blocked') {
    return '被显式 blocker 阻止';
  }

  if (eligibility?.state === 'waiting') {
    return '等待 goal next';
  }

  if (eligibility?.state === 'unavailable') {
    return '不可用';
  }

  return '未暴露';
}

function goalOperationConsoleStateText(operationConsole, route) {
  if (operationConsole.state === 'empty') {
    return '暂无 operation';
  }

  return activeGoalStateText(operationConsole, route);
}

function activeGoalViewModelStateText(viewModel) {
  if (viewModel.state === 'missing') {
    return '未暴露';
  }

  if (viewModel.state === 'partial') {
    return '部分可用';
  }

  return '只读';
}

function promptPreviewStateText(promptPreview, route) {
  if (promptPreview.state === 'empty') {
    return '无 copy-only 文本';
  }

  return activeGoalStateText(promptPreview, route);
}

function phaseText(phase) {
  if (phase === 'loading') {
    return '读取中';
  }

  if (phase === 'failed') {
    return '读取失败';
  }

  return '只读展示';
}

function textValue(text) {
  const normalized = text === null || text === undefined ? '' : String(text);

  return {
    state: normalized === '未暴露' || normalized === '' ? 'missing' : 'available',
    text: normalized,
    value: text
  };
}

function stringValue(value) {
  return String(value ?? '').trim();
}

function isNonEmptyText(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function firstNonEmptyText(...values) {
  return values.find((value) => isNonEmptyText(value)) ?? '';
}

function formatState(state) {
  if (state === null || state === undefined) {
    return '未暴露';
  }

  return state.text ?? String(state.value ?? '未暴露');
}
