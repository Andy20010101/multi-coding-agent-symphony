import {
  buildGoalLedgerForRunbook,
  loadGoalRunbookContext,
  readGoalEventLogForRunbook
} from '../goal-runbook-context.js';
import { buildGoalNextAction } from '../goal-next-action-resolver.js';
import {
  GOAL_PROGRESS_LEDGER_CONTRACT_NAME
} from '../goal-progress-ledger.js';
import {
  GOAL_NEXT_ACTION_CONTRACT_NAME,
  GOAL_RUNBOOK_CONTRACT_NAME
} from '../goal-runbook-contracts.js';
import {
  GOAL_EVENT_LOG_CONTRACT_NAME
} from '../goal-event-contracts.js';
import {
  SUPERVISOR_OBSERVABILITY_CONTRACT_NAME,
  buildSupervisorObservability
} from '../supervisor-runner.js';
import {
  GOAL_SUPERVISOR_CORE_PROJECTION_CONTRACT_NAME,
  buildGoalSupervisorCoreProjection
} from './core-projection.js';
import {
  buildGoalSupervisorAppReadModel
} from './app-read-model.js';
import {
  SESSION_CONTEXT_CONTRACT_NAME,
  buildSessionContext
} from './session-context.js';

export async function buildGoalSupervisorAppReadModelFromContracts({
  stateDir = '.symphony',
  goalId = 'latest',
  generatedAt = new Date().toISOString(),
  supervisorObservability = null,
  sessionContext = null,
  sessionHookOptions = {}
} = {}) {
  const nowMs = Date.parse(generatedAt);
  const effectiveNowMs = Number.isFinite(nowMs) ? nowMs : Date.now();
  const goalNext = await buildGoalNextAction({
    stateDir,
    goalId,
    generatedAt
  });
  const context = await loadGoalRunbookContext({
    stateDir,
    goalId,
    allowControlledFixtureFallback: true
  });
  const eventLog = context === null
    ? null
    : await readGoalEventLogForRunbook({
        stateDir,
        runbook: context.runbook
      });
  const ledger = context === null
    ? null
    : await buildGoalLedgerForRunbook({
        stateDir,
        runbook: context.runbook,
        eventLog,
        generatedAt
      });
  const observability = supervisorObservability ?? buildSupervisorObservability({
    goalId: goalNext.goalId ?? context?.goalId ?? goalId,
    generatedAt
  });
  const active = activeLeaseFromObservability(observability);
  const normalizedSessionContext = sessionContext ?? await buildSessionContext({
    threadId: active?.threadId ?? null,
    generatedAt,
    ...sessionHookOptions
  });
  const state = {
    goalId: goalNext.goalId ?? context?.goalId ?? goalId,
    active,
    results: []
  };
  const coreProjection = buildGoalSupervisorCoreProjection({
    state,
    goalNext,
    active,
    releaseGates: context?.runbook?.releaseGates ?? [],
    allowCloseout: false,
    nowMs: effectiveNowMs
  });

  return buildGoalSupervisorAppReadModel({
    goalId: context?.runbook?.goalId ?? goalNext.goalId ?? goalId,
    title: context?.runbook?.goalTitle ?? null,
    tasks: tasksFromContracts({ runbook: context?.runbook ?? null, ledger }),
    sourceContracts: sourceContractsFor({ context, eventLog, ledger, goalNext, observability, coreProjection, sessionContext: normalizedSessionContext }),
    timelineEvents: timelineEventsFromEventLog(eventLog),
    state,
    goalNext,
    active,
    releaseGates: context?.runbook?.releaseGates ?? [],
    nowMs: effectiveNowMs,
    coreProjection,
    sessionContext: normalizedSessionContext,
    ownership: {
      daemonState: observability.daemon?.state ?? 'external-orchestration-owner'
    },
    branch: branchFromRunbook(context?.runbook ?? null)
  });
}

function tasksFromContracts({ runbook, ledger }) {
  const ledgerTasksById = new Map(
    (Array.isArray(ledger?.tasks) ? ledger.tasks : [])
      .filter(isPlainObject)
      .map((task) => [task.taskId, task])
  );

  return (Array.isArray(runbook?.tasks) ? runbook.tasks : [])
    .filter(isPlainObject)
    .map((task) => {
      const ledgerTask = ledgerTasksById.get(task.taskId);

      return {
        taskId: task.taskId,
        title: task.title ?? null,
        status: ledgerTask?.status ?? 'unknown',
        evidenceRef: ledgerTask?.evidenceRef ?? null
      };
    });
}

function timelineEventsFromEventLog(eventLog) {
  return (Array.isArray(eventLog?.events) ? eventLog.events : [])
    .filter(isPlainObject)
    .map((event, index) => ({
      eventId: event.eventId ?? event.id ?? `event-log-${index}`,
      taskId: event.taskId ?? null,
      role: event.actorRole ?? event.role ?? null,
      status: event.eventType ?? null,
      evidenceRef: event.evidenceRef ?? null,
      hashChainState: event.hashChainState ?? null,
      occurredAt: event.occurredAt ?? event.recordedAt ?? event.timestamp ?? null
    }));
}

function sourceContractsFor({ context, eventLog, ledger, goalNext, observability, coreProjection, sessionContext }) {
  const contracts = [
    context === null ? null : GOAL_RUNBOOK_CONTRACT_NAME,
    eventLog === null ? null : GOAL_EVENT_LOG_CONTRACT_NAME,
    ledger === null ? null : GOAL_PROGRESS_LEDGER_CONTRACT_NAME,
    goalNext?.contractName ?? GOAL_NEXT_ACTION_CONTRACT_NAME,
    coreProjection?.contractName ?? GOAL_SUPERVISOR_CORE_PROJECTION_CONTRACT_NAME,
    observability?.contractName ?? SUPERVISOR_OBSERVABILITY_CONTRACT_NAME,
    sessionContext?.contractName ?? SESSION_CONTEXT_CONTRACT_NAME
  ];

  return [...new Set(contracts.filter(nonEmptyString))];
}

function activeLeaseFromObservability(observability) {
  const activeChild = observability?.activeChild;

  if (!isPlainObject(activeChild) || activeChild.state !== 'active-child-present') {
    return null;
  }

  return {
    leaseId: activeChild.leaseId ?? null,
    threadId: activeChild.threadId ?? null,
    status: 'thread-active',
    startedAt: activeChild.startedAt ?? null,
    updatedAt: observability.generatedAt ?? null
  };
}

function branchFromRunbook(runbook) {
  const firstTask = Array.isArray(runbook?.tasks) ? runbook.tasks.find(isPlainObject) : null;

  return firstTask?.branch ?? null;
}

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function isPlainObject(value) {
  return value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value);
}
