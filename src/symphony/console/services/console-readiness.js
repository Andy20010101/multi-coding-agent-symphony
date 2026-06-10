import { NodeProcessRunner } from '../../../process-runner.js';
import { redactSecrets } from '../../../redaction.js';
import { REAL_CLI_DOCTOR_ADAPTERS } from '../../../real-cli-doctor.js';
import {
  PRODUCT_JSON_CONTRACT
} from '../../contract.js';
import {
  commandRecommendation,
  dedupeCommands,
  groupCommands,
  summarizeRiskItems
} from './console-snapshot.js';

const DEFAULT_READINESS_TIMEOUT_MS = 3000;

export async function buildConsoleReadiness({
  stateDir = '.symphony',
  cwd = process.cwd(),
  env = process.env,
  runner = new NodeProcessRunner(),
  generatedAt = new Date().toISOString(),
  timeoutMs = DEFAULT_READINESS_TIMEOUT_MS
} = {}) {
  const [packageManager, git, github, realCli] = await Promise.all([
    buildPackageManagerReadiness({ runner, cwd, env, timeoutMs }),
    buildGitReadiness({ runner, cwd, timeoutMs }),
    buildGithubReadiness({ runner, cwd, env, timeoutMs }),
    buildRealCliReadiness({ runner, cwd, env, timeoutMs })
  ]);
  const node = {
    status: 'available',
    version: process.version,
    executable: process.execPath
  };
  const status = node.status === 'available'
    && packageManager.status === 'available'
    && git.status === 'available'
    ? 'ready'
    : 'attention';
  const recommendedCommands = buildReadinessRecommendedCommands({
    packageManager,
    git,
    github,
    realCli
  });

  return {
    contractVersion: PRODUCT_JSON_CONTRACT.version,
    contractName: 'symphony.console-readiness',
    contract: {
      ...PRODUCT_JSON_CONTRACT,
      name: 'symphony.console-readiness'
    },
    generatedAt,
    stateDir,
    cwd,
    status,
    readOnly: true,
    modelInvocation: false,
    tools: {
      node,
      packageManager,
      git,
      github,
      realCli
    },
    checks: buildReadinessChecks({
      node,
      packageManager,
      git,
      github,
      realCli
    }),
    riskSummary: buildReadinessRiskSummary({
      packageManager,
      git,
      github,
      realCli
    }),
    recommendedCommands,
    commandGroups: groupCommands(recommendedCommands)
  };
}

function buildReadinessRecommendedCommands({ packageManager, git, github, realCli }) {
  return dedupeCommands([
    commandRecommendation({
      id: 'doctor',
      label: 'Doctor',
      command: 'symphony doctor',
      description: 'Check the base CLI environment.',
      group: 'Inspect'
    }),
    packageManager.status !== 'available'
      ? commandRecommendation({
          id: 'enable-pnpm',
          label: 'Enable pnpm',
          command: 'corepack enable',
          description: 'Make the package manager shim available before rechecking.',
          group: 'Inspect'
        })
      : null,
    packageManager.status !== 'available'
      ? commandRecommendation({
          id: 'check-pnpm',
          label: 'Check pnpm',
          command: 'pnpm --version',
          description: 'Confirm pnpm is available on PATH.',
          group: 'Inspect'
        })
      : null,
    git.status !== 'available'
      ? commandRecommendation({
          id: 'check-git-worktree',
          label: 'Check git',
          command: 'git rev-parse --is-inside-work-tree',
          description: 'Confirm the console is running inside a git worktree.',
          group: 'Inspect'
        })
      : null,
    git.status === 'available' && git.dirty
      ? commandRecommendation({
          id: 'git-status',
          label: 'Inspect dirty git',
          command: 'git status --short',
          description: 'Review uncommitted files before trusting run evidence.',
          group: 'Inspect'
        })
      : null,
    git.status === 'available' && git.dirty
      ? commandRecommendation({
          id: 'git-diff-stat',
          label: 'Diff summary',
          command: 'git diff --stat',
          description: 'See the shape of unstaged changes.',
          group: 'Inspect'
        })
      : null,
    github.status !== 'authenticated'
      ? commandRecommendation({
          id: 'gh-auth-status',
          label: 'Check GitHub auth',
          command: 'gh auth status',
          description: 'Inspect GitHub CLI auth without exposing tokens.',
          group: 'Inspect'
        })
      : null,
    github.status !== 'authenticated'
      ? commandRecommendation({
          id: 'gh-auth-login',
          label: 'GitHub login',
          command: 'gh auth login',
          description: 'Start GitHub CLI authentication if needed.',
          group: 'Inspect'
        })
      : null,
    github.status === 'authenticated' && github.ci?.status !== 'available'
      ? commandRecommendation({
          id: 'gh-run-list',
          label: 'Check CI',
          command: 'gh run list --limit 5',
          description: 'Inspect recent GitHub Actions runs.',
          group: 'Verify'
        })
      : null,
    commandRecommendation({
      id: 'check',
      label: 'Static check',
      command: 'pnpm check',
      description: 'Run repository syntax checks.',
      group: 'Verify'
    }),
    commandRecommendation({
      id: 'test',
      label: 'Tests',
      command: 'pnpm test',
      description: 'Run the repository test suite.',
      group: 'Verify'
    }),
    ...realCli.adapters
      .filter((adapter) => adapter.status !== 'available')
      .map((adapter) => commandRecommendation({
        id: `check-${adapter.adapterId}`,
        label: `Check ${adapter.displayName}`,
        command: adapter.command,
        description: 'Confirm whether this optional real CLI is installed.',
        group: 'Real-agent gates'
      })),
    commandRecommendation({
      id: 'real-codex',
      label: 'Real Codex gate',
      command: 'MCAS_RUN_REAL_CODEX=1 symphony do --real codex "inspect README"',
      description: 'External execution example; copy only and run intentionally.',
      group: 'Real-agent gates'
    }),
    commandRecommendation({
      id: 'real-claude',
      label: 'Real Claude gate',
      command: 'MCAS_RUN_REAL_CLAUDE=1 symphony do --real claude "inspect README"',
      description: 'External execution example; copy only and run intentionally.',
      group: 'Real-agent gates'
    }),
    commandRecommendation({
      id: 'real-kiro',
      label: 'Real Kiro gate',
      command: 'MCAS_RUN_REAL_KIRO=1 symphony do --real kiro "inspect README"',
      description: 'External execution example; copy only and run intentionally.',
      group: 'Real-agent gates'
    })
  ]);
}

async function buildPackageManagerReadiness({ runner, cwd, env, timeoutMs }) {
  const check = await runFirstReadinessCommand({
    runner,
    candidates: executableCandidates({
      executable: 'pnpm',
      env
    }),
    args: ['--version'],
    cwd,
    timeoutMs
  });

  return stripUndefined({
    name: 'pnpm',
    status: check.status === 'passed' ? 'available' : 'unavailable',
    version: check.status === 'passed' ? firstOutputLine(check) : undefined,
    command: 'pnpm --version',
    message: check.status === 'passed' ? undefined : commandFailureMessage(check)
  });
}

async function buildGitReadiness({ runner, cwd, timeoutMs }) {
  const inside = await runReadinessCommand({
    runner,
    executable: 'git',
    args: ['rev-parse', '--is-inside-work-tree'],
    cwd,
    timeoutMs
  });

  if (inside.status !== 'passed' || firstOutputLine(inside) !== 'true') {
    return {
      status: 'unavailable',
      message: commandFailureMessage(inside) ?? 'not inside a git worktree'
    };
  }

  const [branch, head, currentHead, mainHead, originMainHead, status] = await Promise.all([
    runReadinessCommand({
      runner,
      executable: 'git',
      args: ['branch', '--show-current'],
      cwd,
      timeoutMs
    }),
    runReadinessCommand({
      runner,
      executable: 'git',
      args: ['rev-parse', '--short', 'HEAD'],
      cwd,
      timeoutMs
    }),
    runReadinessCommand({
      runner,
      executable: 'git',
      args: ['rev-parse', 'HEAD'],
      cwd,
      timeoutMs
    }),
    runReadinessCommand({
      runner,
      executable: 'git',
      args: ['rev-parse', '--short', 'main'],
      cwd,
      timeoutMs
    }),
    runReadinessCommand({
      runner,
      executable: 'git',
      args: ['rev-parse', '--short', 'origin/main'],
      cwd,
      timeoutMs
    }),
    runReadinessCommand({
      runner,
      executable: 'git',
      args: ['status', '--porcelain'],
      cwd,
      timeoutMs
    })
  ]);
  const dirtyPaths = parseGitStatusDirtyPaths(status.stdout);
  const dirtyFilesCount = dirtyPaths.length;

  return stripUndefined({
    status: 'available',
    branch: firstOutputLine(branch) || 'detached',
    head: firstOutputLine(head) || undefined,
    currentHead: firstPassedOutputLine(currentHead),
    mainHead: firstPassedOutputLine(mainHead),
    originMainHead: firstPassedOutputLine(originMainHead),
    dirty: dirtyFilesCount > 0,
    dirtyFilesCount,
    dirtyPaths,
    command: 'git status --short',
    commands: {
      branch: 'git branch --show-current',
      head: 'git rev-parse --short HEAD',
      currentHead: 'git rev-parse HEAD',
      mainHead: 'git rev-parse --short main',
      originMainHead: 'git rev-parse --short origin/main',
      worktreeStatus: 'git status --short'
    }
  });
}

async function buildGithubReadiness({ runner, cwd, env, timeoutMs }) {
  const auth = await runFirstReadinessCommand({
    runner,
    candidates: executableCandidates({
      executable: 'gh',
      env
    }),
    args: ['auth', 'status'],
    cwd,
    timeoutMs
  });
  const authOutput = commandOutput(auth);

  if (auth.status !== 'passed') {
    return stripUndefined({
      status: auth.error?.code === 'ENOENT' ? 'unavailable' : 'unauthenticated',
      account: parseGithubAccount(authOutput),
      authStatus: auth.status,
      message: commandFailureMessage(auth),
      ci: {
        status: 'skipped',
        reason: 'GitHub auth is not available'
      }
    });
  }

  const ci = await runFirstReadinessCommand({
    runner,
    candidates: [auth.executable],
    args: [
      'run',
      'list',
      '--limit',
      '1',
      '--json',
      'status,conclusion,workflowName,displayTitle,headBranch,headSha,createdAt,databaseId'
    ],
    cwd,
    timeoutMs
  });

  return stripUndefined({
    status: 'authenticated',
    account: parseGithubAccount(authOutput),
    authStatus: 'passed',
    ci: buildGithubCiReadiness(ci)
  });
}

function buildGithubCiReadiness(check) {
  if (check.status !== 'passed') {
    return {
      status: 'unavailable',
      message: commandFailureMessage(check)
    };
  }

  const parsed = parseJsonPreview(check.stdout);
  const latest = Array.isArray(parsed) ? parsed[0] : undefined;

  if (latest === undefined) {
    return {
      status: 'empty',
      latest: null
    };
  }

  return {
    status: 'available',
    latest: stripUndefined({
      databaseId: latest.databaseId,
      workflowName: latest.workflowName,
      displayTitle: latest.displayTitle,
      status: latest.status,
      conclusion: latest.conclusion,
      headBranch: latest.headBranch,
      headSha: latest.headSha,
      createdAt: latest.createdAt
    })
  };
}

async function buildRealCliReadiness({ runner, cwd, env, timeoutMs }) {
  const adapters = await Promise.all(REAL_CLI_DOCTOR_ADAPTERS.map(async (definition) => {
    const version = await runReadinessCommand({
      runner,
      executable: definition.executable,
      args: definition.versionArgs,
      cwd,
      timeoutMs
    });
    const available = version.status === 'passed';
    const gateEnabled = env[definition.gateEnv] === '1';

    return stripUndefined({
      adapterId: definition.adapterId,
      displayName: definition.displayName,
      executable: definition.executable,
      status: available ? 'available' : 'unavailable',
      version: available ? firstOutputLine(version) : undefined,
      gate: {
        envName: definition.gateEnv,
        status: gateEnabled ? 'enabled' : 'not-enabled'
      },
      modelInvocation: false,
      command: `${definition.executable} ${definition.versionArgs.join(' ')}`
    });
  }));

  return {
    status: adapters.some((adapter) => adapter.status === 'available') ? 'available' : 'unavailable',
    adapters
  };
}

function buildReadinessChecks({ node, packageManager, git, github, realCli }) {
  return [
    readinessCheck({
      id: 'node',
      label: 'Node.js',
      status: node.status === 'available' ? 'ok' : 'attention',
      detail: node.version
    }),
    readinessCheck({
      id: 'pnpm',
      label: 'pnpm',
      status: packageManager.status === 'available' ? 'ok' : 'attention',
      detail: packageManager.version ?? packageManager.message
    }),
    readinessCheck({
      id: 'git',
      label: 'Git worktree',
      status: git.status === 'available' && !git.dirty ? 'ok' : 'attention',
      detail: git.status === 'available'
        ? `${git.branch} @ ${git.head ?? 'unknown'}${git.dirty ? `, ${git.dirtyFilesCount} dirty` : ', clean'}`
        : git.message
    }),
    readinessCheck({
      id: 'github',
      label: 'GitHub',
      status: github.status === 'authenticated' ? 'ok' : 'optional',
      detail: github.account ?? github.message ?? github.status
    }),
    readinessCheck({
      id: 'real-cli',
      label: 'Real CLI gates',
      status: realCli.adapters.some((adapter) => adapter.gate.status === 'enabled') ? 'ok' : 'optional',
      detail: `${realCli.adapters.filter((adapter) => adapter.status === 'available').length}/${realCli.adapters.length} available`
    })
  ];
}

function readinessCheck({ id, label, status, detail }) {
  return stripUndefined({
    id,
    label,
    status,
    detail
  });
}

function buildReadinessRiskSummary({ packageManager, git, github, realCli }) {
  const items = [];

  if (packageManager.status !== 'available') {
    items.push(readinessRiskItem({
      id: 'missing_tool:pnpm',
      category: 'missing_tools',
      severity: 'high',
      title: 'pnpm unavailable',
      detail: packageManager.message ?? 'pnpm could not be executed.',
      command: 'corepack enable'
    }));
  }

  if (git.status !== 'available') {
    items.push(readinessRiskItem({
      id: 'missing_tool:git',
      category: 'missing_tools',
      severity: 'high',
      title: 'Git unavailable',
      detail: git.message ?? 'git worktree status could not be read.',
      command: 'git rev-parse --is-inside-work-tree'
    }));
  }

  if (git.status === 'available' && git.dirty) {
    items.push(readinessRiskItem({
      id: 'dirty_git',
      category: 'dirty_git',
      severity: 'medium',
      title: 'Dirty git worktree',
      detail: `${git.dirtyFilesCount} dirty file(s) may affect run trust.`,
      command: 'git status --short'
    }));
  }

  if (github.status !== 'authenticated') {
    items.push(readinessRiskItem({
      id: 'github_auth',
      category: 'missing_tools',
      severity: 'low',
      title: 'GitHub auth unavailable',
      detail: github.message ?? github.status,
      command: 'gh auth status'
    }));
  }

  if (github.status === 'authenticated' && github.ci?.status === 'unavailable') {
    items.push(readinessRiskItem({
      id: 'github_ci',
      category: 'missing_tools',
      severity: 'medium',
      title: 'GitHub CI unavailable',
      detail: github.ci.message ?? 'recent workflow status could not be read.',
      command: 'gh run list --limit 5'
    }));
  }

  for (const adapter of realCli.adapters) {
    if (adapter.status !== 'available') {
      items.push(readinessRiskItem({
        id: `missing_tool:${adapter.adapterId}`,
        category: 'missing_tools',
        severity: 'low',
        title: `${adapter.displayName} unavailable`,
        detail: `${adapter.executable} was not available for optional real-agent checks.`,
        command: adapter.command
      }));
    }
  }

  return summarizeRiskItems(items);
}

async function runFirstReadinessCommand({
  runner,
  candidates,
  args,
  cwd,
  timeoutMs
}) {
  let lastCheck;

  for (const executable of candidates) {
    const check = await runReadinessCommand({
      runner,
      executable,
      args,
      cwd,
      timeoutMs
    });

    lastCheck = {
      ...check,
      executable
    };

    if (check.status === 'passed' || !isMissingExecutable(check)) {
      return lastCheck;
    }
  }

  return lastCheck;
}

function executableCandidates({ executable, env }) {
  const home = env.HOME;
  const candidates = [executable];

  if (executable === 'pnpm') {
    candidates.push(
      ...[
        env.PNPM_HOME ? `${env.PNPM_HOME}/pnpm` : undefined,
        home ? `${home}/Library/pnpm/pnpm` : undefined,
        home ? `${home}/.local/bin/pnpm` : undefined
      ].filter(Boolean)
    );
  }

  if (executable === 'gh') {
    candidates.push(
      ...[
        home ? `${home}/.local/bin/gh` : undefined,
        '/opt/homebrew/bin/gh',
        '/usr/local/bin/gh'
      ].filter(Boolean)
    );
  }

  return [...new Set(candidates)];
}

async function runReadinessCommand({
  runner,
  executable,
  args,
  cwd,
  timeoutMs
}) {
  try {
    const result = await runner.run({
      executable,
      args,
      cwd,
      timeoutMs
    });

    return {
      status: result.exitCode === 0 ? 'passed' : 'failed',
      exitCode: result.exitCode,
      stdout: redactSecrets(result.stdout ?? ''),
      stderr: redactSecrets(result.stderr ?? '')
    };
  } catch (error) {
    return {
      status: 'failed',
      exitCode: null,
      stdout: '',
      stderr: '',
      error: {
        code: error.code,
        message: redactSecrets(error.message)
      }
    };
  }
}

function isMissingExecutable(check) {
  return check.error?.code === 'ENOENT' || /ENOENT/u.test(check.error?.message ?? '');
}

function commandFailureMessage(check) {
  if (check.error?.message) {
    return check.error.message;
  }

  return firstOutputLine(check) || undefined;
}

function firstOutputLine(check) {
  return checkOutputLines(check)[0] ?? '';
}

function firstPassedOutputLine(check) {
  return check?.status === 'passed'
    ? firstOutputLine(check) || undefined
    : undefined;
}

function checkOutputLines(check) {
  return commandOutput(check)
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '');
}

function parseGitStatusDirtyPaths(output) {
  return [...new Set(String(output ?? '')
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line !== '')
    .flatMap((line) => {
      const pathPart = line.slice(3).trim();

      if (pathPart.includes(' -> ')) {
        return pathPart.split(' -> ').map((path) => path.trim()).filter(Boolean);
      }

      return pathPart === '' ? [] : [pathPart];
    }))]
    .sort();
}

function commandOutput(check) {
  return redactSecrets(`${check.stdout ?? ''}\n${check.stderr ?? ''}`);
}

function parseGithubAccount(output) {
  const accountMatch = /account\s+([^\s]+)/iu.exec(output);

  if (accountMatch !== null) {
    return accountMatch[1];
  }

  const loggedInMatch = /Logged in to [^\s]+ as ([^\s]+)/iu.exec(output);

  return loggedInMatch?.[1];
}

function readinessRiskItem({ id, category, severity, title, detail, command }) {
  return stripUndefined({
    id,
    category,
    severity,
    title,
    detail,
    command: commandRecommendation({
      id,
      label: title,
      command,
      description: detail
    })
  });
}

function parseJsonPreview(content) {
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function stripUndefined(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined)
  );
}
