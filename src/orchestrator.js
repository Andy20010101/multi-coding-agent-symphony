import { validateCommandSpec, validateTaskSpec } from './contracts.js';
import { buildContextPack } from './context-builder.js';
import { classifyFailure } from './failure-taxonomy.js';
import { verifyEvidence } from './verifier.js';

const IMPLEMENT_COMMAND_SPEC = {
  name: 'implement',
  version: '1',
  allowedTools: ['read', 'write', 'shell', 'test'],
  workspacePolicy: 'primary-writer',
  doneCriteria: ['diff-created', 'tests-run', 'evidence-written'],
  evidenceSchema: 'implementation-evidence.v1'
};

const REVIEW_COMMAND_SPEC = {
  name: 'review',
  version: '1',
  allowedTools: ['read', 'shell', 'test'],
  workspacePolicy: 'review-only',
  doneCriteria: ['review-completed', 'evidence-written'],
  evidenceSchema: 'review-evidence.v1'
};

const QA_COMMAND_SPEC = {
  name: 'qa',
  version: '1',
  allowedTools: ['read', 'shell', 'test'],
  workspacePolicy: 'isolated',
  doneCriteria: ['checks-run', 'evidence-written'],
  evidenceSchema: 'qa-evidence.v1'
};

const STANDARD_COMMAND_SEQUENCE = [
  IMPLEMENT_COMMAND_SPEC,
  REVIEW_COMMAND_SPEC,
  QA_COMMAND_SPEC
];

const IMPLEMENT_ONLY_COMMAND_SEQUENCE = [
  IMPLEMENT_COMMAND_SPEC
];

const COMMAND_SEQUENCES = new Map([
  ['implement-only', IMPLEMENT_ONLY_COMMAND_SEQUENCE],
  ['standard', STANDARD_COMMAND_SEQUENCE]
]);

const DEFAULT_EXECUTION = Object.freeze({
  maxTurns: 5,
  turnTimeoutMs: 3600000,
  stallTimeoutMs: 300000
});

export class PolicyDeniedError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'PolicyDeniedError';
    this.category = 'permission-denied';
    this.details = details;
  }
}

export class Orchestrator {
  constructor({
    artifactStore,
    eventLog,
    workspaceManager,
    scheduler,
    taskQueue,
    policyEngine,
    adapters
  }) {
    this.artifactStore = requireMethod(artifactStore, 'writeArtifact', 'artifactStore');
    requireMethod(artifactStore, 'readArtifact', 'artifactStore');
    this.eventLog = requireMethod(eventLog, 'append', 'eventLog');
    this.workspaceManager = requireMethod(workspaceManager, 'allocate', 'workspaceManager');
    this.scheduler = requireMethod(scheduler, 'route', 'scheduler');
    this.taskQueue = taskQueue;
    this.policyEngine = policyEngine;
    this.adapters = adapters;
    this.eventSequence = 0;
  }

  async runCommand({
    taskSpec,
    commandSpec,
    modelProfile,
    policyRequests = [],
    executionMode = 'dry-run',
    timeoutMs,
    artifactRefs = [],
    sourceWorkspaceId,
    artifactIdSuffix = '',
    agentId,
    checkTaskActive
  }) {
    validateTaskSpec(taskSpec);
    validateCommandSpec(commandSpec);
    assertOptionalFunction(checkTaskActive, 'checkTaskActive');
    const artifactKey = buildCommandArtifactKey(commandSpec.name, artifactIdSuffix);
    const artifactId = `${artifactKey}-evidence`;
    const execution = resolveExecutionConfig({ taskSpec, commandSpec, timeoutMs });

    await this.#appendEvent({
      type: 'command.queued',
      actor: 'orchestrator',
      payload: {
        taskId: taskSpec.id,
        command: commandSpec.name
      }
    });

    const policyDecisions = await this.#decidePolicy(policyRequests);
    const deniedDecision = policyDecisions.find((decision) => decision.decision === 'deny');

    if (deniedDecision) {
      throw new PolicyDeniedError('Policy denied command execution', {
        taskId: taskSpec.id,
        command: commandSpec.name,
        decision: deniedDecision
      });
    }

    const route = this.scheduler.route({ commandSpec });
    const adapter = this.adapters?.[route.adapterId];

    if (!adapter) {
      throw new Error(`No adapter instance registered for ${route.adapterId}`);
    }

    const routeDecisionArtifactId = `${artifactKey}-route-decision`;
    const routeDecision = buildRouteDecisionArtifact({
      taskId: taskSpec.id,
      commandSpec,
      route
    });

    await this.artifactStore.writeArtifact(taskSpec.id, routeDecisionArtifactId, routeDecision);
    await this.#appendEvent({
      type: 'artifact.written',
      actor: 'orchestrator',
      payload: {
        taskId: taskSpec.id,
        artifactId: routeDecisionArtifactId
      }
    });
    await this.#appendEvent({
      type: 'route.selected',
      actor: 'orchestrator',
      payload: {
        taskId: taskSpec.id,
        command: commandSpec.name,
        adapterId: route.adapterId,
        modelProfile: route.modelProfile ?? route.modelProfiles[0],
        routeDecision,
        routeDecisionArtifactId
      }
    });

    const workspaceRole = workspaceRoleFor(commandSpec.workspacePolicy);
    const workspace = sourceWorkspaceId && workspaceRole !== 'primary-writer' && typeof this.workspaceManager.cloneFrom === 'function'
      ? this.workspaceManager.cloneFrom({
        sourceWorkspaceId,
        role: workspaceRole,
        adapterId: route.adapterId
      })
      : this.workspaceManager.allocate({
        taskId: taskSpec.id,
        role: workspaceRole,
        adapterId: route.adapterId
      });
    const hydratedArtifacts = await this.#hydrateArtifactRefs(artifactRefs);
    const turns = [];
    let previousTurn;
    let finalEvidence;
    let finalVerification;
    let finalHandle;
    let finalTurnArtifactId;

    for (let attempt = 1; attempt <= execution.maxTurns; attempt += 1) {
      const isContinuation = attempt > 1;
      const continuation = isContinuation
        ? buildContinuationContext({ attempt, previousTurn })
        : undefined;
      const priorEvents = typeof this.eventLog.readAll === 'function' ? await this.eventLog.readAll() : [];
      const contextPack = buildContextPack({
        taskSpec: continuation
          ? buildContinuationTaskSpec({ taskSpec, continuation })
          : taskSpec,
        commandName: commandSpec.name,
        agentId,
        events: priorEvents,
        artifactRefs,
        hydratedArtifacts,
        continuation
      });
      const activityEvents = [];
      const startInput = {
        commandSpec,
        contextPack,
        workspace: workspace.path,
        ...(agentId ? { agentId } : {}),
        modelProfile: modelProfile ?? route.modelProfile ?? route.modelProfiles[0],
        policyDecisions,
        executionMode,
        timeoutMs: execution.turnTimeoutMs,
        stallTimeoutMs: execution.stallTimeoutMs,
        isContinuation,
        turn: attempt
      };

      if (executionMode === 'real') {
        startInput.onActivity = (activity) => {
          activityEvents.push(activity);
        };
      }

      const handle = await adapter.start(startInput);
      const streamResult = await this.#streamAdapterEvents({
        adapter,
        handle,
        stallTimeoutMs: execution.stallTimeoutMs,
        taskId: taskSpec.id,
        command: commandSpec.name,
        attempt
      });
      const evidence = await adapter.collectEvidence(handle);
      let turnArtifactId = attempt === 1
        ? artifactId
        : `${artifactKey}-turn-${attempt}-evidence`;

      await this.artifactStore.writeArtifact(taskSpec.id, turnArtifactId, evidence);
      await this.#appendEvent({
        type: 'artifact.written',
        actor: 'orchestrator',
        payload: {
          taskId: taskSpec.id,
          artifactId: turnArtifactId
        }
      });

      const verification = buildTurnVerification({
        commandSpec,
        evidence,
        workspace,
        handle,
        stalled: streamResult.stalled
      });
      const turn = {
        attempt,
        isContinuation,
        artifactId: turnArtifactId,
        verification,
        stalled: streamResult.stalled,
        activityCount: activityEvents.length
      };

      turns.push(turn);
      finalEvidence = evidence;
      finalVerification = verification;
      finalHandle = handle;
      finalTurnArtifactId = turnArtifactId;
      previousTurn = {
        ...turn,
        evidence
      };

      if (verification.status === 'passed' || isTerminalVerification(verification) || attempt === execution.maxTurns) {
        break;
      }

      if (checkTaskActive) {
        const active = await checkTaskActive({
          taskSpec: structuredClone(taskSpec),
          commandSpec: structuredClone(commandSpec),
          attempt,
          verification: structuredClone(verification),
          turns: structuredClone(turns)
        });

        if (active === false) {
          finalVerification = {
            status: 'failed',
            reason: 'task-cancelled',
            previousFailureReason: verification.reason
          };
          break;
        }
      }

      if (turnArtifactId === artifactId) {
        turnArtifactId = `${artifactKey}-turn-${attempt}-evidence`;
        await this.artifactStore.writeArtifact(taskSpec.id, turnArtifactId, evidence);
        await this.#appendEvent({
          type: 'artifact.written',
          actor: 'orchestrator',
          payload: {
            taskId: taskSpec.id,
            artifactId: turnArtifactId
          }
        });
        turn.artifactId = turnArtifactId;
        previousTurn.artifactId = turnArtifactId;
        finalTurnArtifactId = turnArtifactId;
      }
    }

    if (finalTurnArtifactId !== artifactId) {
      await this.artifactStore.writeArtifact(taskSpec.id, artifactId, finalEvidence);
      await this.#appendEvent({
        type: 'artifact.written',
        actor: 'orchestrator',
        payload: {
          taskId: taskSpec.id,
          artifactId
        }
      });
    }

    const adapterArtifactRefs = await this.#writeAdapterArtifacts({
      taskId: taskSpec.id,
      command: artifactKey,
      adapter,
      handle: finalHandle
    });

    await this.#appendEvent({
      type: 'verifier.result',
      actor: 'verifier',
      payload: finalVerification
    });
    const runArtifactId = `${artifactKey}-run`;
    const runRecord = {
      version: '1',
      taskId: taskSpec.id,
      command: commandSpec.name,
      adapterId: route.adapterId,
      workspaceId: workspace.workspaceId,
      evidenceArtifactId: artifactId,
      routeDecisionArtifactId,
      verificationStatus: finalVerification.status,
      artifactRefs: structuredClone(artifactRefs),
      ...(turns.length > 1 || turns.some((turn) => turn.stalled)
        ? { attempts: turns.length, turns: turns.map(summarizeTurn) }
        : {}),
      ...(adapterArtifactRefs.length > 0 ? { adapterArtifactRefs } : {})
    };

    await this.artifactStore.writeArtifact(taskSpec.id, runArtifactId, runRecord);
    await this.#appendEvent({
      type: 'artifact.written',
      actor: 'orchestrator',
      payload: {
        taskId: taskSpec.id,
        artifactId: runArtifactId
      }
    });
    await this.#appendEvent({
      type: finalVerification.status === 'passed' ? 'command.finished' : 'command.failed',
      actor: 'orchestrator',
      payload: {
        taskId: taskSpec.id,
        command: commandSpec.name,
        verificationStatus: finalVerification.status,
        verificationReason: finalVerification.reason,
        attempts: turns.length
      }
    });

    return {
      taskId: taskSpec.id,
      command: commandSpec.name,
      adapterId: route.adapterId,
      workspace,
      artifactId,
      runArtifactId,
      routeDecisionArtifactId,
      attempts: turns.length,
      turns: turns.map(summarizeTurn),
      ...(adapterArtifactRefs.length > 0 ? { adapterArtifactRefs } : {}),
      verification: finalVerification
    };
  }

  async runTaskWorkflow({
    taskSpec,
    commandSpecs,
    commandSequence,
    modelProfile,
    policyRequests = [],
    executionMode = 'dry-run',
    timeoutMs
  }) {
    validateTaskSpec(taskSpec);

    const resolvedCommandSpecs = resolveCommandSpecs({ commandSpecs, commandSequence });

    const commands = [];
    const artifactRefs = [];
    let sourceWorkspaceId;

    for (const commandSpec of resolvedCommandSpecs) {
      const result = await this.runCommand({
        taskSpec,
        commandSpec,
        modelProfile,
        policyRequests,
        executionMode,
        timeoutMs,
        artifactRefs,
        sourceWorkspaceId
      });

      commands.push(result);
      artifactRefs.push({
        taskId: taskSpec.id,
        artifactId: result.artifactId,
        command: result.command,
        verificationStatus: result.verification.status
      });

      if (result.workspace.writable === true) {
        sourceWorkspaceId = result.workspace.workspaceId;
      }

      if (result.verification.status !== 'passed') {
        const failure = classifyFailure(result.verification.reason);
        const retryPlan = this.scheduler.planRetry({ failure });

        await this.#appendEvent({
          type: 'failure.classified',
          actor: 'orchestrator',
          payload: {
            taskId: taskSpec.id,
            command: result.command,
            failure,
            retryPlan
          }
        });

        return {
          taskId: taskSpec.id,
          status: 'failed',
          failedCommand: result.command,
          commands,
          artifactRefs,
          failure,
          retryPlan
        };
      }
    }

    return {
      taskId: taskSpec.id,
      status: 'passed',
      commands,
      artifactRefs
    };
  }

  async runNextTask({
    commandSpecs,
    commandSequence,
    modelProfile,
    policyRequests = [],
    executionMode = 'dry-run',
    timeoutMs,
    leaseTimeoutMs,
    now
  }) {
    if (!this.taskQueue) {
      throw new Error('taskQueue is required to run the next task');
    }

    requireMethod(this.taskQueue, 'leaseNext', 'taskQueue');
    requireMethod(this.taskQueue, 'complete', 'taskQueue');
    requireMethod(this.taskQueue, 'fail', 'taskQueue');

    const leased = this.taskQueue.leaseNext({
      adapterId: 'orchestrator',
      command: 'workflow',
      leaseTimeoutMs,
      now
    });

    if (!leased) {
      return null;
    }

    const result = await this.runTaskWorkflow({
      taskSpec: leased.task,
      commandSpecs,
      commandSequence,
      modelProfile,
      policyRequests,
      executionMode,
      timeoutMs
    });

    if (result.status === 'passed') {
      this.taskQueue.complete(leased.task.id, { now });
    } else {
      this.taskQueue.fail(leased.task.id, {
        failure: result.failure,
        retryPlan: result.retryPlan,
        now
      });
    }

    return result;
  }

  async #streamAdapterEvents({
    adapter,
    handle,
    stallTimeoutMs,
    taskId,
    command,
    attempt
  }) {
    const iterator = adapter.streamEvents(handle)[Symbol.asyncIterator]();

    while (true) {
      const next = await nextAdapterEvent({ iterator, stallTimeoutMs });

      if (next.stalled) {
        const cancellation = typeof adapter.cancel === 'function'
          ? await adapter.cancel(handle)
          : null;

        await this.#appendEvent({
          type: 'command.stalled',
          actor: 'orchestrator',
          payload: {
            taskId,
            command,
            attempt,
            runId: handle.runId,
            reason: 'stall-timeout',
            stallTimeoutMs,
            ...(cancellation ? { cancellation } : {})
          }
        });

        return {
          stalled: true,
          cancellation
        };
      }

      if (next.result.done) {
        return {
          stalled: false
        };
      }

      await this.#appendEvent({
        type: next.result.value.type,
        actor: 'adapter',
        payload: next.result.value
      });
    }
  }

  async #appendEvent({ type, actor, payload }) {
    this.eventSequence += 1;

    return this.eventLog.append({
      id: `evt-${this.eventSequence}`,
      type,
      timestamp: new Date().toISOString(),
      actor,
      payload,
      version: '1'
    });
  }

  async #decidePolicy(policyRequests) {
    if (!Array.isArray(policyRequests)) {
      throw new TypeError('policyRequests must be an array');
    }

    if (!this.policyEngine) {
      return [];
    }

    const decisions = [];

    for (const request of policyRequests) {
      const decision = this.policyEngine.decide(request);
      decisions.push(decision);
      await this.#appendEvent({
        type: 'policy.decision',
        actor: 'policy',
        payload: {
          request,
          decision
        }
      });
    }

    return decisions;
  }

  async #hydrateArtifactRefs(artifactRefs) {
    const hydrated = [];

    for (const ref of artifactRefs) {
      hydrated.push({
        ref: structuredClone(ref),
        content: await this.artifactStore.readArtifact(ref.taskId, ref.artifactId)
      });
    }

    return hydrated;
  }

  async #writeAdapterArtifacts({ taskId, command, adapter, handle }) {
    if (typeof adapter.collectArtifacts !== 'function') {
      return [];
    }

    const artifacts = await adapter.collectArtifacts(handle);

    if (!Array.isArray(artifacts) || artifacts.length === 0) {
      return [];
    }

    const refs = [];

    for (const artifact of artifacts) {
      if (artifact === null || typeof artifact !== 'object' || Array.isArray(artifact)) {
        throw new TypeError('adapter artifacts must be objects');
      }

      if (typeof artifact.id !== 'string' || artifact.id.trim() === '') {
        throw new TypeError('adapter artifact id must be a non-empty string');
      }

      const artifactId = `${command}-${artifact.id}`;
      const { id, ...content } = artifact;

      await this.artifactStore.writeArtifact(taskId, artifactId, content);
      refs.push({
        taskId,
        artifactId,
        kind: content.kind ?? 'adapter-artifact'
      });
      await this.#appendEvent({
        type: 'artifact.written',
        actor: 'orchestrator',
        payload: {
          taskId,
          artifactId
        }
      });
    }

    return refs;
  }
}

function workspaceRoleFor(workspacePolicy) {
  if (workspacePolicy === 'primary-writer') {
    return 'primary-writer';
  }

  if (workspacePolicy === 'parallel-writer') {
    return 'parallel-writer';
  }

  if (workspacePolicy === 'review-only') {
    return 'review';
  }

  return 'isolated';
}

function buildRouteDecisionArtifact({ taskId, commandSpec, route }) {
  const modelProfile = route.modelProfile ?? route.modelProfiles[0];

  return {
    ...(route.routeDecision ? structuredClone(route.routeDecision) : {}),
    taskId,
    command: commandSpec.name,
    adapterId: route.adapterId,
    modelProfile,
    reason: route.routeDecision?.reason ?? 'first-capable-adapter',
    version: '1'
  };
}

function resolveCommandSpecs({ commandSpecs, commandSequence }) {
  if (commandSpecs !== undefined) {
    if (!Array.isArray(commandSpecs) || commandSpecs.length === 0) {
      throw new TypeError('commandSpecs must be a non-empty array');
    }

    return structuredClone(commandSpecs);
  }

  const sequenceName = commandSequence ?? 'standard';
  const sequence = COMMAND_SEQUENCES.get(sequenceName);

  if (!sequence) {
    throw new Error(`Unknown command sequence: ${sequenceName}`);
  }

  return structuredClone(sequence);
}

function buildCommandArtifactKey(commandName, artifactIdSuffix) {
  if (artifactIdSuffix === undefined || artifactIdSuffix === null || artifactIdSuffix === '') {
    return commandName;
  }

  if (typeof artifactIdSuffix !== 'string' ||
    artifactIdSuffix.trim() === '' ||
    artifactIdSuffix.includes('/') ||
    artifactIdSuffix.includes('..')) {
    throw new TypeError('artifactIdSuffix must be a safe artifact id segment');
  }

  return `${commandName}-${artifactIdSuffix}`;
}

function resolveExecutionConfig({ taskSpec, commandSpec, timeoutMs }) {
  const execution = {
    ...DEFAULT_EXECUTION,
    ...(taskSpec.execution ?? {}),
    ...(commandSpec.execution ?? {})
  };

  if (timeoutMs !== undefined) {
    execution.turnTimeoutMs = timeoutMs;
  }

  assertPositiveInteger(execution.maxTurns, 'execution.maxTurns');
  assertPositiveInteger(execution.turnTimeoutMs, 'execution.turnTimeoutMs');
  assertNonNegativeInteger(execution.stallTimeoutMs, 'execution.stallTimeoutMs');

  return execution;
}

function buildTurnVerification({ commandSpec, evidence, workspace, handle, stalled }) {
  if (stalled) {
    return {
      status: 'failed',
      reason: 'stall-timeout',
      failure: classifyFailure('stall-timeout')
    };
  }

  if (handle.failure?.category) {
    return {
      status: 'failed',
      reason: handle.failure.category,
      failure: structuredClone(handle.failure)
    };
  }

  return verifyEvidence({
    commandSpec,
    evidence,
    workspaceManifest: workspace
  });
}

function isTerminalVerification(verification) {
  if (verification.status === 'passed') {
    return true;
  }

  return classifyFailure(verification.reason).retryable === false;
}

function buildContinuationContext({ attempt, previousTurn }) {
  return {
    isContinuation: true,
    attempt,
    previousAttempt: previousTurn.attempt,
    previousFailureReason: previousTurn.verification.reason,
    previousEvidenceArtifactId: previousTurn.artifactId,
    previousEvidenceSummary: summarizeEvidence(previousTurn.evidence)
  };
}

function buildContinuationTaskSpec({ taskSpec, continuation }) {
  return {
    ...structuredClone(taskSpec),
    objective: [
      `Previous attempt failed: ${continuation.previousFailureReason}`,
      `Evidence: ${continuation.previousEvidenceSummary}`,
      'Continue from the current workspace state and resolve the failure.'
    ].join('\n')
  };
}

function summarizeEvidence(evidence) {
  const checks = Array.isArray(evidence?.checks) ? evidence.checks : [];
  const changedFiles = Array.isArray(evidence?.changedFiles) ? evidence.changedFiles : [];
  const failedChecks = checks
    .filter((check) => check?.status !== 'passed')
    .map((check) => check.name)
    .filter(Boolean);
  const summaryParts = [];

  if (typeof evidence?.agentSummary === 'string' && evidence.agentSummary.trim() !== '') {
    summaryParts.push(evidence.agentSummary.trim());
  }

  summaryParts.push(`changedFiles=${changedFiles.length}`);
  summaryParts.push(`checks=${checks.length}`);

  if (failedChecks.length > 0) {
    summaryParts.push(`failedChecks=${failedChecks.join(', ')}`);
  }

  return summaryParts.join('; ');
}

function summarizeTurn(turn) {
  return {
    attempt: turn.attempt,
    isContinuation: turn.isContinuation,
    artifactId: turn.artifactId,
    verification: structuredClone(turn.verification),
    ...(turn.stalled ? { stalled: true } : {}),
    activityCount: turn.activityCount
  };
}

function nextAdapterEvent({ iterator, stallTimeoutMs }) {
  if (stallTimeoutMs === 0) {
    return iterator.next().then((result) => ({ result }));
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      settled = true;
      resolve({ stalled: true });
    }, stallTimeoutMs);

    iterator.next().then(
      (result) => {
        if (settled) {
          return;
        }

        settled = true;
        clearTimeout(timer);
        resolve({ result });
      },
      (error) => {
        if (settled) {
          return;
        }

        settled = true;
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

function assertPositiveInteger(value, field) {
  if (!Number.isInteger(value) || value < 1) {
    throw new TypeError(`${field} must be a positive integer`);
  }
}

function assertNonNegativeInteger(value, field) {
  if (!Number.isInteger(value) || value < 0) {
    throw new TypeError(`${field} must be a non-negative integer`);
  }
}

function assertOptionalFunction(value, field) {
  if (value !== undefined && typeof value !== 'function') {
    throw new TypeError(`${field} must be a function`);
  }
}

function requireMethod(value, method, field) {
  if (!value || typeof value[method] !== 'function') {
    throw new TypeError(`${field} must provide ${method}`);
  }

  return value;
}
