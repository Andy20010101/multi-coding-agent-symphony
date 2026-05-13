import { validateCommandSpec, validateTaskSpec } from './contracts.js';
import { buildContextPack } from './context-builder.js';
import { classifyFailure } from './failure-taxonomy.js';
import { verifyEvidence } from './verifier.js';

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

    await this.#appendEvent({
      type: 'route.selected',
      actor: 'orchestrator',
      payload: {
        taskId: taskSpec.id,
        command: commandSpec.name,
        adapterId: route.adapterId
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
      modelProfile: modelProfile ?? route.modelProfiles[0],
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

    const verification = verifyEvidence({ commandSpec, evidence });

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
      verificationStatus: verification.status,
      artifactRefs: structuredClone(artifactRefs)
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
      verification
    };
  }

  async runTaskWorkflow({
    taskSpec,
    commandSpecs,
    modelProfile,
    policyRequests = [],
    executionMode = 'dry-run',
    timeoutMs
  }) {
    validateTaskSpec(taskSpec);

    if (!Array.isArray(commandSpecs) || commandSpecs.length === 0) {
      throw new TypeError('commandSpecs must be a non-empty array');
    }

    const commands = [];
    const artifactRefs = [];
    let sourceWorkspaceId;

    for (const commandSpec of commandSpecs) {
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
      modelProfile,
      policyRequests,
      executionMode,
      timeoutMs
    });

    if (result.status === 'passed') {
      this.taskQueue.complete(leased.task.id, { now });
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

function requireMethod(value, method, field) {
  if (!value || typeof value[method] !== 'function') {
    throw new TypeError(`${field} must provide ${method}`);
  }

  return value;
}
