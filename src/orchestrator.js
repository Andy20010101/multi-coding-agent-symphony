import { validateCommandSpec, validateTaskSpec } from './contracts.js';
import { buildContextPack } from './context-builder.js';
import { classifyFailure } from './failure-taxonomy.js';
import { verifyEvidence } from './verifier.js';

const STANDARD_COMMAND_SEQUENCE = [
  {
    name: 'implement',
    version: '1',
    allowedTools: ['read', 'write', 'shell', 'test'],
    workspacePolicy: 'primary-writer',
    doneCriteria: ['diff-created', 'tests-run', 'evidence-written'],
    evidenceSchema: 'implementation-evidence.v1'
  },
  {
    name: 'review',
    version: '1',
    allowedTools: ['read', 'shell', 'test'],
    workspacePolicy: 'review-only',
    doneCriteria: ['review-completed', 'evidence-written'],
    evidenceSchema: 'review-evidence.v1'
  },
  {
    name: 'qa',
    version: '1',
    allowedTools: ['read', 'shell', 'test'],
    workspacePolicy: 'isolated',
    doneCriteria: ['checks-run', 'evidence-written'],
    evidenceSchema: 'qa-evidence.v1'
  }
];

const COMMAND_SEQUENCES = new Map([
  ['standard', STANDARD_COMMAND_SEQUENCE]
]);

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
    sourceWorkspaceId
  }) {
    validateTaskSpec(taskSpec);
    validateCommandSpec(commandSpec);

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

    const routeDecisionArtifactId = `${commandSpec.name}-route-decision`;
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
    const priorEvents = typeof this.eventLog.readAll === 'function' ? await this.eventLog.readAll() : [];
    const hydratedArtifacts = await this.#hydrateArtifactRefs(artifactRefs);
    const contextPack = buildContextPack({
      taskSpec,
      commandName: commandSpec.name,
      events: priorEvents,
      artifactRefs,
      hydratedArtifacts
    });
    const handle = await adapter.start({
      commandSpec,
      contextPack,
      workspace: workspace.path,
      modelProfile: modelProfile ?? route.modelProfile ?? route.modelProfiles[0],
      policyDecisions,
      executionMode,
      timeoutMs
    });

    for await (const adapterEvent of adapter.streamEvents(handle)) {
      await this.#appendEvent({
        type: adapterEvent.type,
        actor: 'adapter',
        payload: adapterEvent
      });
    }

    const evidence = await adapter.collectEvidence(handle);
    const artifactId = `${commandSpec.name}-evidence`;

    await this.artifactStore.writeArtifact(taskSpec.id, artifactId, evidence);
    await this.#appendEvent({
      type: 'artifact.written',
      actor: 'orchestrator',
      payload: {
        taskId: taskSpec.id,
        artifactId
      }
    });

    const verification = verifyEvidence({
      commandSpec,
      evidence,
      workspaceManifest: workspace
    });
    const adapterArtifactRefs = await this.#writeAdapterArtifacts({
      taskId: taskSpec.id,
      command: commandSpec.name,
      adapter,
      handle
    });

    await this.#appendEvent({
      type: 'verifier.result',
      actor: 'verifier',
      payload: verification
    });
    const runArtifactId = `${commandSpec.name}-run`;
    const runRecord = {
      version: '1',
      taskId: taskSpec.id,
      command: commandSpec.name,
      adapterId: route.adapterId,
      workspaceId: workspace.workspaceId,
      evidenceArtifactId: artifactId,
      routeDecisionArtifactId,
      verificationStatus: verification.status,
      artifactRefs: structuredClone(artifactRefs),
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
      type: verification.status === 'passed' ? 'command.finished' : 'command.failed',
      actor: 'orchestrator',
      payload: {
        taskId: taskSpec.id,
        command: commandSpec.name,
        verificationStatus: verification.status
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
      verification
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

function requireMethod(value, method, field) {
  if (!value || typeof value[method] !== 'function') {
    throw new TypeError(`${field} must provide ${method}`);
  }

  return value;
}
