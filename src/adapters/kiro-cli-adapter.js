import { BaseAdapter, buildRunPrompt, validatePrepareInput } from './base-adapter.js';

export class KiroCliAdapter extends BaseAdapter {
  constructor({ cliVersion = 'unknown', executable = 'kiro-cli' } = {}) {
    super({
      adapterId: 'kiro-cli',
      cliName: 'kiro-cli',
      cliVersion,
      executable,
      modelProfiles: ['claude-kiro-default'],
      workspaceIsolation: 'external-workspace',
      logStrategy: 'stdout'
    });
  }

  async prepare(input) {
    validatePrepareInput(input);

    const trustTools = trustToolsFor(input.commandSpec.allowedTools);
    const args = [
      'chat',
      '--no-interactive',
      `--trust-tools=${trustTools.join(',')}`
    ];

    if (input.requireMcpStartup) {
      args.push('--require-mcp-startup');
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

function trustToolsFor(allowedTools) {
  const categories = new Set();

  for (const tool of allowedTools) {
    if (tool === 'read') {
      categories.add('read');
      categories.add('grep');
    }

    if (tool === 'write') {
      categories.add('write');
    }

    if (tool === 'shell' || tool === 'test') {
      categories.add('bash');
    }
  }

  return Array.from(categories);
}

