import { BaseAdapter, buildRunPrompt, validatePrepareInput } from './base-adapter.js';

export class ClaudeCodeAdapter extends BaseAdapter {
  constructor({ cliVersion = 'unknown', executable = 'claude' } = {}) {
    super({
      adapterId: 'claude-code',
      cliName: 'claude',
      cliVersion,
      executable,
      modelProfiles: ['deepseek-claude-code'],
      workspaceIsolation: 'external-workspace',
      logStrategy: 'stream-json-stdout'
    });
  }

  async prepare(input) {
    validatePrepareInput(input);

    const args = [
      '-p',
      '--output-format',
      'stream-json',
      '--add-dir',
      input.workspace,
      '--model',
      input.modelProfile,
      '--permission-mode',
      permissionModeFor(input.commandSpec.workspacePolicy)
    ];

    const disallowedTools = disallowedToolsFrom(input.policyDecisions ?? []);

    if (disallowedTools.length > 0) {
      args.push('--disallowedTools', ...disallowedTools);
    }

    return {
      adapterId: this.adapterId,
      dryRun: true,
      executable: this.executable,
      args,
      cwd: input.workspace,
      prompt: buildRunPrompt(input),
      environment: {}
    };
  }
}

function permissionModeFor(workspacePolicy) {
  if (workspacePolicy === 'review-only') {
    return 'plan';
  }

  return 'default';
}

function disallowedToolsFrom(policyDecisions) {
  return policyDecisions
    .filter((decision) => decision.decision === 'deny' && decision.reason === 'sensitive-path')
    .map((decision) => `Read(${decision.matchedRule})`);
}

