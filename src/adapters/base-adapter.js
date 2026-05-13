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
    `Acceptance: ${contextPack.task.acceptance.join('; ')}`,
    `Evidence schema: ${commandSpec.evidenceSchema}`,
    `Done criteria: ${commandSpec.doneCriteria.join('; ')}`
  ].join('\n');
}

