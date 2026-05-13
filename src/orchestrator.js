import { validateCommandSpec, validateTaskSpec } from './contracts.js';
import { buildContextPack } from './context-builder.js';
import { verifyEvidence } from './verifier.js';

export class Orchestrator {
  constructor({
    artifactStore,
    eventLog,
    workspaceManager,
    scheduler,
    adapters
  }) {
    this.artifactStore = requireMethod(artifactStore, 'writeArtifact', 'artifactStore');
    this.eventLog = requireMethod(eventLog, 'append', 'eventLog');
    this.workspaceManager = requireMethod(workspaceManager, 'allocate', 'workspaceManager');
    this.scheduler = requireMethod(scheduler, 'route', 'scheduler');
    this.adapters = adapters;
    this.eventSequence = 0;
  }

  async runCommand({ taskSpec, commandSpec, modelProfile }) {
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

    const workspace = this.workspaceManager.allocate({
      taskId: taskSpec.id,
      role: workspaceRoleFor(commandSpec.workspacePolicy),
      adapterId: route.adapterId
    });
    const priorEvents = typeof this.eventLog.readAll === 'function' ? await this.eventLog.readAll() : [];
    const contextPack = buildContextPack({
      taskSpec,
      commandName: commandSpec.name,
      events: priorEvents,
      artifactRefs: []
    });
    const handle = await adapter.start({
      commandSpec,
      contextPack,
      workspace: workspace.path,
      modelProfile: modelProfile ?? route.modelProfiles[0]
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
    await this.#appendEvent({
      type: 'command.finished',
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
      verification
    };
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

