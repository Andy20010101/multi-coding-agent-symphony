import { validateCommandSpec } from '../contracts.js';
import { classifyFailure } from '../failure-taxonomy.js';

const SUPPORTED_COMMANDS = ['plan', 'implement', 'review', 'fix-ci', 'qa'];

export class BaseAdapter {
  constructor({
    adapterId,
    cliName,
    cliVersion = 'unknown',
    executable,
    modelProfiles,
    workspaceIsolation,
    logStrategy
  }) {
    this.adapterId = adapterId;
    this.cliName = cliName;
    this.cliVersion = cliVersion;
    this.executable = executable;
    this.modelProfiles = modelProfiles;
    this.workspaceIsolation = workspaceIsolation;
    this.logStrategy = logStrategy;
    this.runs = new Map();
    this.runSequence = 0;
  }

  async probe() {
    return {
      adapterId: this.adapterId,
      cliName: this.cliName,
      cliVersion: this.cliVersion,
      supportedCommands: [...SUPPORTED_COMMANDS],
      modelProfiles: [...this.modelProfiles],
      supportsNonInteractive: true,
      supportsResume: true,
      supportsCancel: true,
      supportsHooks: true,
      supportsMcp: true,
      supportsStructuredOutput: true,
      workspaceIsolation: this.workspaceIsolation,
      logStrategy: this.logStrategy,
      version: '1'
    };
  }

  normalizeFailure(error) {
    if (error?.code === 'ESTALL' || error?.stalled === true) {
      return classifyFailure('stall-timeout');
    }

    if (error?.code === 'ETIMEDOUT' || error?.signal === 'SIGTERM') {
      return classifyFailure('cli-timeout');
    }

    if (error?.code === 'EACCES') {
      return classifyFailure('permission-denied');
    }

    if (typeof error?.message === 'string' && error.message.includes('verification')) {
      return classifyFailure('verification-insufficient');
    }

    return classifyFailure('adapter-crashed');
  }

  async start(input) {
    if (typeof this.prepare !== 'function') {
      throw new TypeError(`${this.adapterId} adapter must implement prepare`);
    }

    const preparedRun = await this.prepare(input);
    const runId = this.nextRunId(input.contextPack.task.id);
    const handle = {
      runId,
      adapterId: this.adapterId,
      status: 'completed',
      dryRun: true,
      preparedRun,
      command: input.commandSpec.name,
      taskId: input.contextPack.task.id,
      workspaceId: input.workspace
    };

    this.runs.set(runId, handle);
    return structuredClone(handle);
  }

  async *streamEvents(handle) {
    const stored = this.#getRun(handle.runId);

    yield {
      type: 'adapter.started',
      runId: stored.runId,
      adapterId: stored.adapterId,
      dryRun: stored.dryRun
    };
    yield {
      type: 'command.finished',
      runId: stored.runId,
      adapterId: stored.adapterId,
      status: stored.status
    };
  }

  async cancel(handle) {
    const stored = this.#getRun(handle.runId);
    stored.status = 'cancelled';
    this.runs.set(stored.runId, stored);

    return {
      runId: stored.runId,
      status: 'cancelled'
    };
  }

  async resume({ runId }) {
    return structuredClone(this.#getRun(runId));
  }

  async collectEvidence(handle) {
    const stored = this.#getRun(handle.runId);

    return {
      command: stored.command,
      taskId: stored.taskId,
      workspaceId: stored.workspaceId,
      changedFiles: [],
      checks: [],
      knownRisks: ['dry-run-only'],
      agentSummary: 'Dry-run command rendered but no CLI execution occurred.',
      version: '1'
    };
  }

  async cleanup(handle) {
    this.runs.delete(handle.runId);
  }

  nextRunId(taskId) {
    this.runSequence += 1;
    return `${this.adapterId}-${taskId}-${this.runSequence}`;
  }

  #getRun(runId) {
    if (typeof runId !== 'string' || runId.trim() === '' || !this.runs.has(runId)) {
      throw new Error(`Unknown run id: ${runId}`);
    }

    return this.runs.get(runId);
  }
}

export function validatePrepareInput(input) {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('prepare input must be an object');
  }

  validateCommandSpec(input.commandSpec);

  if (input.contextPack === null || typeof input.contextPack !== 'object' || Array.isArray(input.contextPack)) {
    throw new TypeError('contextPack must be an object');
  }

  if (typeof input.workspace !== 'string' || input.workspace.trim() === '') {
    throw new TypeError('workspace must be a non-empty string');
  }

  if (typeof input.modelProfile !== 'string' || input.modelProfile.trim() === '') {
    throw new TypeError('modelProfile must be a non-empty string');
  }
}

export function buildRunPrompt({ commandSpec, contextPack }) {
  return [
    `Command: ${commandSpec.name}`,
    `Task: ${contextPack.task.id}`,
    `Repository: ${contextPack.task.repository}`,
    `Objective: ${contextPack.task.objective}`,
    ...constraintLines(contextPack.task.constraints),
    `Acceptance: ${contextPack.task.acceptance.join('; ')}`,
    `Evidence schema: ${commandSpec.evidenceSchema}`,
    `Done criteria: ${commandSpec.doneCriteria.join('; ')}`,
    'Return an EvidencePackage JSON object with command, taskId, workspaceId, changedFiles, checks, knownRisks, agentSummary, and version.'
  ].join('\n');
}

function constraintLines(constraints = []) {
  if (!Array.isArray(constraints) || constraints.length === 0) {
    return [];
  }

  const verificationCommands = constraints
    .filter((constraint) => typeof constraint === 'string' && constraint.startsWith('verification_command:'))
    .map((constraint) => constraint.slice('verification_command:'.length))
    .filter((command) => command.trim() !== '');
  const otherConstraints = constraints.filter((constraint) => (
    typeof constraint === 'string' && !constraint.startsWith('verification_command:')
  ));
  const lines = otherConstraints.length > 0
    ? [`Constraints: ${otherConstraints.join('; ')}`]
    : [];

  if (verificationCommands.length > 0) {
    lines.push('Required verification commands:');
    lines.push(...verificationCommands.map((command) => `- ${command}`));
    lines.push('For each required verification command, run it and include one checks[] entry whose checks[].command exactly equals that command.');
  }

  return lines;
}
