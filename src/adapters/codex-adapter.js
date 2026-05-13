import { BaseAdapter, buildRunPrompt, validatePrepareInput } from './base-adapter.js';

export class CodexAdapter extends BaseAdapter {
  constructor({ cliVersion = 'unknown', executable = 'codex' } = {}) {
    super({
      adapterId: 'codex',
      cliName: 'codex',
      cliVersion,
      executable,
      modelProfiles: ['gpt-codex-default'],
      workspaceIsolation: 'external-workspace',
      logStrategy: 'jsonl-stdout'
    });
  }

  async prepare(input) {
    validatePrepareInput(input);

    const args = [
      'exec',
      '--json',
      '--cd',
      input.workspace,
      '--sandbox',
      sandboxFor(input.commandSpec.workspacePolicy),
      '--model',
      input.modelProfile
    ];

    if (input.outputSchemaPath) {
      args.push('--output-schema', input.outputSchemaPath);
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

function sandboxFor(workspacePolicy) {
  if (workspacePolicy === 'review-only') {
    return 'read-only';
  }

  if (workspacePolicy === 'primary-writer' || workspacePolicy === 'isolated') {
    return 'workspace-write';
  }

  return 'read-only';
}

