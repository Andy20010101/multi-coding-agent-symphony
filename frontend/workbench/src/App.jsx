import { useEffect, useState } from 'react';

import {
  confirmGoalEventPlan,
  fetchGoalEventPlanPreview,
  fetchWorkbenchContracts
} from './api/client.js';

const initialState = {
  phase: 'loading',
  model: null
};
const GOAL_EVENT_PLAN_PREVIEW_PATH_TEMPLATE = '/api/goals/<goal-id>/event-plan-preview';
const GOAL_EVENT_PLAN_CONFIRM_PATH_TEMPLATE = '/api/goals/<goal-id>/event-plan-confirm';

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

  const model = viewState.model;
  const routeCounts = routeStateCounts(model?.routeStates ?? []);

  return (
    <main className="workbench-shell" aria-labelledby="workbench-title">
      <header className="workbench-header">
        <div className="header-copy">
          <p className="eyebrow">v20 Active Goal Workbench</p>
          <h1 id="workbench-title">Symphony Workbench</h1>
          <p className="header-summary">
            展示 summary、readiness、runs、latest run、timeline、artifact refs、v16 handoff，
            以及 goal progress、goal events、ActiveGoalViewModel、capabilities、diagnostics 与安全 error envelope。
            浏览器端读取受控 routes；v21 event form 只能用 dry-run plan hash 确认 goal update/review/gate event append，不提供任意命令、下载、终端或执行动作。
          </p>
        </div>
        <div className="status-strip" aria-label="当前只读状态">
          <span>{phaseText(viewState.phase)}</span>
          <span>{routeCounts.ready}/{routeCounts.total} routes 已读取</span>
          <span>confirm 后会刷新 goal-status / events / next action</span>
        </div>
      </header>

      {viewState.phase === 'loading' ? <ShellState title="读取中" copy="正在读取 summary、readiness、runs 与 latest run 只读 contract。" /> : null}
      {viewState.phase === 'failed' ? <ShellState title="读取失败" copy="错误摘要：只读 contract 未暴露或不可用。刷新页面后会重新读取只读 API。" /> : null}

      {model === null ? null : (
        <>
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

          <section className="active-goal-grid" aria-label="v20 Active Goal supporting contracts">
            <NextActionCard
              nextAction={model.activeGoal.nextAction}
              route={findRoute(model.routeStates, 'goalNextAction')}
              onGoalEventConfirmed={refreshWorkbenchContracts}
            />
            <PromptPreviewDrawer promptPreview={model.activeGoal.promptPreview} route={findRoute(model.routeStates, 'goalPromptPack')} />
            <ActiveGoalViewModelPanel viewModel={model.activeGoal.viewModel} />
            <CloseoutGapsPanel closeoutGaps={model.activeGoal.closeoutGaps} route={findRoute(model.routeStates, 'goalCloseout')} />
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
      )}
    </main>
  );
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

function CloseoutGapsPanel({ closeoutGaps, route }) {
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

      <Subsection title="missing evidence and gates">
        <CloseoutMissingList missing={closeoutGaps.missing} />
      </Subsection>

      <Subsection title="release gates">
        <KeyValueList rows={closeoutGaps.releaseGates} nameKey="gate" valueKey="status" emptyCopy="release gates 未暴露。" />
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
    <article className="data-panel" aria-labelledby={`${id}-title`}>
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
    if (previewPath === null || missingRequired.length > 0) {
      setPreviewState({
        phase: 'failed',
        plan: null,
        error: `缺少字段：${missingRequired.join('、')}`,
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
              {field.options.state === 'available' && field.options.items.length > 0 ? (
                <select
                  value={values[field.id.value] ?? ''}
                  onChange={(event) => updateValue(field.id.value, event.target.value)}
                >
                  {field.options.items.map((option) => (
                    <option key={option.value} value={option.value}>{option.text}</option>
                  ))}
                </select>
              ) : (
                <input
                  value={values[field.id.value] ?? ''}
                  placeholder={field.placeholder.text}
                  readOnly={field.readOnly.value === true}
                  onChange={(event) => updateValue(field.id.value, event.target.value)}
                />
              )}
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
            ['planHash', textValue(previewState.plan.planHash)],
            ['command', textValue(previewState.plan.eventSummary.commandName)],
            ['eventType', textValue(previewState.plan.eventSummary.eventType)],
            ['taskId', textValue(previewState.plan.eventSummary.taskId)],
            ['actorRole', textValue(previewState.plan.eventSummary.actorRole)],
            ['actorId', textValue(previewState.plan.eventSummary.actorId)],
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
        <p className="empty-copy">正在确认 event append，并刷新 goal-status / events / next action。</p>
      ) : null}
      {confirmState.phase === 'ready' ? (
        <div className="goal-event-confirm-result">
          <FieldList rows={[
            ['status', textValue(confirmState.result.status)],
            ['written', textValue(confirmState.result.written)],
            ['eventType', textValue(confirmState.result.eventSummary.eventType)],
            ['sequence', textValue(confirmState.result.eventSummary.sequence)],
            ['eventId', textValue(confirmState.result.eventSummary.eventId)],
            ['eventHash', textValue(confirmState.result.eventSummary.eventHash)],
            ['refreshed.progress', textValue(confirmState.result.refreshed.progress?.contractName)],
            ['refreshed.events', textValue(confirmState.result.refreshed.events?.contractName)],
            ['refreshed.nextAction', textValue(confirmState.result.refreshed.nextAction?.contractName)]
          ]} />
        </div>
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

  for (const evidenceRef of String(values.evidenceRef ?? '').split(/\r?\n/u)) {
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

  const evidenceRefs = String(values.evidenceRef ?? '')
    .split(/\r?\n/u)
    .map((entry) => entry.trim())
    .filter((entry) => entry !== '');

  if (evidenceRefs.length > 0) {
    body.evidenceRef = evidenceRefs;
  }

  return body;
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
  if (items.state === 'missing') {
    return <EmptyBlock copy={emptyCopy} />;
  }

  if (items.items.length === 0) {
    return <EmptyBlock copy={emptyCopy} />;
  }

  return (
    <ul className="command-text-list" aria-label="copy-only text list">
      {items.items.map((item, index) => (
        <li key={`${item.text}-${index}`}>
          <code>{item.text}</code>
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
            ['title', prompt.title],
            ['format', prompt.format]
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
  return {
    state: text === '未暴露' || text === '' ? 'missing' : 'available',
    text,
    value: text
  };
}

function formatState(state) {
  if (state === null || state === undefined) {
    return '未暴露';
  }

  return state.text ?? String(state.value ?? '未暴露');
}
