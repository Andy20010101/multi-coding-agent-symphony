import { createServer } from 'node:http';
import { open, readdir, stat } from 'node:fs/promises';

import { NodeProcessRunner } from '../process-runner.js';
import { redactSecrets } from '../redaction.js';
import { REAL_CLI_DOCTOR_ADAPTERS } from '../real-cli-doctor.js';
import {
  listRunStates,
  readLatestContext,
  readLatestRun,
  readRunState
} from './state.js';
import {
  PRODUCT_JSON_CONTRACT,
  compactRunState
} from './contract.js';

const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = 8765;
const MAX_ARTIFACT_PREVIEW_BYTES = 200 * 1024;
const DEFAULT_READINESS_TIMEOUT_MS = 3000;

export async function buildConsoleSnapshot({
  stateDir = '.symphony',
  generatedAt = new Date().toISOString()
} = {}) {
  const [latestContext, latestRun, runs] = await Promise.all([
    readLatestContext({ stateDir }),
    readLatestRun({ stateDir }),
    listRunStates({ stateDir })
  ]);

  const compactLatestRun = decorateConsoleRun(compactRunState(latestRun));
  const compactRuns = runs.map((run) => decorateConsoleRun(compactRunState(run)));

  return {
    contractVersion: PRODUCT_JSON_CONTRACT.version,
    contractName: 'symphony.console-snapshot',
    contract: {
      ...PRODUCT_JSON_CONTRACT,
      name: 'symphony.console-snapshot'
    },
    generatedAt,
    stateDir,
    status: latestRun === null ? 'no-runs' : 'ready',
    latestContext: compactContext(latestContext),
    latestRun: compactLatestRun,
    runs: compactRuns,
    recommendedCommands: buildSnapshotRecommendedCommands({
      latestRun: compactLatestRun
    }),
    action: {
      next: latestRun?.nextAction ?? 'symphony scan'
    }
  };
}

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
    recommendedCommands: buildReadinessRecommendedCommands()
  };
}

export function createSymphonyConsoleServer({
  stateDir = '.symphony',
  cwd = process.cwd(),
  env = process.env,
  runner = new NodeProcessRunner(),
  readinessTimeoutMs = DEFAULT_READINESS_TIMEOUT_MS
} = {}) {
  return createServer(async (request, response) => {
    try {
      if (request.method !== 'GET') {
        writeJsonResponse(response, 405, {
          status: 'error',
          message: 'console is read-only'
        });
        return;
      }

      const url = new URL(request.url ?? '/', 'http://localhost');

      if (url.pathname === '/') {
        writeHtmlResponse(response, renderConsoleHtml());
        return;
      }

      if (url.pathname === '/api/health') {
        writeJsonResponse(response, 200, {
          status: 'ok',
          readOnly: true
        });
        return;
      }

      if (url.pathname === '/api/summary') {
        writeJsonResponse(response, 200, await buildConsoleSnapshot({ stateDir }));
        return;
      }

      if (url.pathname === '/api/readiness') {
        writeJsonResponse(response, 200, await buildConsoleReadiness({
          stateDir,
          cwd,
          env,
          runner,
          timeoutMs: readinessTimeoutMs
        }));
        return;
      }

      if (url.pathname === '/api/runs') {
        const runs = await listRunStates({ stateDir });
        writeJsonResponse(response, 200, {
          contractVersion: PRODUCT_JSON_CONTRACT.version,
          contractName: 'symphony.console-runs',
          runs: runs.map((run) => decorateConsoleRun(compactRunState(run)))
        });
        return;
      }

      if (url.pathname === '/api/runs/latest') {
        await writeRunResponse({ response, stateDir, runId: 'latest' });
        return;
      }

      const timelineRequest = parseRunTimelineRequestPath(url.pathname);

      if (timelineRequest !== null) {
        await writeTimelineResponse({
          response,
          stateDir,
          runId: timelineRequest.runId
        });
        return;
      }

      const artifactRequest = parseArtifactRequestPath(url.pathname);

      if (artifactRequest !== null) {
        await writeArtifactResponse({
          response,
          stateDir,
          runId: artifactRequest.runId,
          artifactKind: artifactRequest.artifactKind
        });
        return;
      }

      if (url.pathname.startsWith('/api/runs/')) {
        const runId = decodeURIComponent(url.pathname.slice('/api/runs/'.length));
        await writeRunResponse({ response, stateDir, runId });
        return;
      }

      writeJsonResponse(response, 404, {
        status: 'error',
        message: 'not found'
      });
    } catch (error) {
      writeJsonResponse(response, error instanceof TypeError ? 400 : 500, {
        status: 'error',
        message: error.message
      });
    }
  });
}

export async function startSymphonyConsoleServer({
  stateDir = '.symphony',
  host = DEFAULT_HOST,
  port = DEFAULT_PORT,
  cwd = process.cwd(),
  env = process.env,
  runner = new NodeProcessRunner(),
  readinessTimeoutMs = DEFAULT_READINESS_TIMEOUT_MS
} = {}) {
  const server = createSymphonyConsoleServer({
    stateDir,
    cwd,
    env,
    runner,
    readinessTimeoutMs
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => {
      server.off('error', reject);
      resolve();
    });
  });

  const address = server.address();
  const actualPort = typeof address === 'object' && address !== null ? address.port : port;

  return {
    server,
    host,
    port: actualPort,
    url: `http://${host}:${actualPort}/`
  };
}

async function writeRunResponse({ response, stateDir, runId }) {
  const runState = await readRunState({ stateDir, runId });

  if (runState === null) {
    writeJsonResponse(response, 404, {
      status: 'missing',
      runId
    });
    return;
  }

  writeJsonResponse(response, 200, {
    contractVersion: PRODUCT_JSON_CONTRACT.version,
    contractName: 'symphony.console-run',
    run: decorateConsoleRun(compactRunState(runState)),
    rawRunState: runState
  });
}

async function writeTimelineResponse({ response, stateDir, runId }) {
  const runState = await readRunState({ stateDir, runId });

  if (runState === null) {
    writeJsonResponse(response, 404, {
      status: 'missing',
      runId
    });
    return;
  }

  const run = decorateConsoleRun(compactRunState(runState));

  writeJsonResponse(response, 200, {
    contractVersion: PRODUCT_JSON_CONTRACT.version,
    contractName: 'symphony.console-run-timeline',
    runId: run.runId,
    timeline: run.timeline,
    recommendedCommands: run.recommendedCommands
  });
}

async function writeArtifactResponse({ response, stateDir, runId, artifactKind }) {
  const runState = await readRunState({ stateDir, runId });

  if (runState === null) {
    writeJsonResponse(response, 404, {
      status: 'missing',
      runId
    });
    return;
  }

  const compact = compactRunState(runState);
  const artifactRef = compact.artifactRefs.find((artifact) => artifact.kind === artifactKind);

  if (artifactRef === undefined) {
    writeJsonResponse(response, 404, {
      contractVersion: PRODUCT_JSON_CONTRACT.version,
      contractName: 'symphony.console-artifact',
      status: 'missing',
      runId: compact.runId,
      artifactKind
    });
    return;
  }

  let artifact;

  try {
    artifact = await previewArtifact(artifactRef);
  } catch (error) {
    if (isMissingFileError(error)) {
      writeJsonResponse(response, 404, {
        contractVersion: PRODUCT_JSON_CONTRACT.version,
        contractName: 'symphony.console-artifact',
        status: 'missing-artifact',
        runId: compact.runId,
        artifact: {
          ...artifactRef,
          type: 'missing',
          message: 'artifact file is missing'
        }
      });
      return;
    }

    throw error;
  }

  writeJsonResponse(response, 200, {
    contractVersion: PRODUCT_JSON_CONTRACT.version,
    contractName: 'symphony.console-artifact',
    runId: compact.runId,
    artifact
  });
}

async function previewArtifact(artifactRef) {
  const metadata = await stat(artifactRef.path);

  if (metadata.isDirectory()) {
    const entries = await readdir(artifactRef.path, { withFileTypes: true });

    return {
      ...artifactRef,
      type: 'directory',
      entries: entries.slice(0, 100).map((entry) => ({
        name: entry.name,
        type: entry.isDirectory() ? 'directory' : 'file'
      })),
      truncated: entries.length > 100
    };
  }

  const size = metadata.size;
  const length = Math.min(size, MAX_ARTIFACT_PREVIEW_BYTES);
  const handle = await open(artifactRef.path, 'r');

  try {
    const buffer = Buffer.alloc(length);
    await handle.read(buffer, 0, length, 0);
    const content = buffer.toString('utf8');
    const json = parseJsonPreview(content);
    const truncated = size > MAX_ARTIFACT_PREVIEW_BYTES;
    const malformedJson = !truncated && json === null && isJsonArtifact({ artifactRef, content });

    return {
      ...artifactRef,
      type: 'file',
      size,
      truncated,
      format: malformedJson ? 'malformed-json' : json === null ? 'text' : 'json',
      content,
      ...(malformedJson ? { parseError: 'invalid JSON artifact preview' } : {}),
      ...(json === null ? {} : { json })
    };
  } finally {
    await handle.close();
  }
}

function isMissingFileError(error) {
  return error?.code === 'ENOENT' || error?.code === 'ENOTDIR';
}

function isJsonArtifact({ artifactRef, content }) {
  const trimmed = content.trimStart();

  return artifactRef.path.endsWith('.json') || trimmed.startsWith('{') || trimmed.startsWith('[');
}

function parseArtifactRequestPath(pathname) {
  const match = /^\/api\/runs\/([^/]+)\/artifacts\/([^/]+)$/u.exec(pathname);

  if (match === null) {
    return null;
  }

  return {
    runId: decodeURIComponent(match[1]),
    artifactKind: decodeURIComponent(match[2])
  };
}

function parseRunTimelineRequestPath(pathname) {
  const match = /^\/api\/runs\/([^/]+)\/timeline$/u.exec(pathname);

  if (match === null) {
    return null;
  }

  return {
    runId: decodeURIComponent(match[1])
  };
}

function parseJsonPreview(content) {
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function compactContext(context) {
  if (context === null) {
    return null;
  }

  return stripUndefined({
    runId: context.runId,
    projectRoot: context.projectRoot,
    projectFingerprint: context.projectFingerprint,
    contextArtifactPath: context.contextArtifactPath,
    summaryArtifactPath: context.summaryArtifactPath,
    recommendedWorkflow: context.recommendedWorkflow,
    verificationCommands: context.verificationCommands,
    createdAt: context.createdAt
  });
}

function decorateConsoleRun(run) {
  if (run === null) {
    return null;
  }

  return stripUndefined({
    ...run,
    artifactHealth: buildArtifactHealth(run),
    timeline: buildRunTimeline(run),
    recommendedCommands: buildRunRecommendedCommands(run)
  });
}

function buildArtifactHealth(run) {
  const artifactRefs = Array.isArray(run.artifactRefs) ? run.artifactRefs : [];

  return {
    status: artifactRefs.length === 0 ? 'empty' : 'registered',
    total: artifactRefs.length,
    kinds: artifactRefs.map((artifact) => artifact.kind)
  };
}

function buildRunTimeline(run) {
  return [
    timelineEvent({
      id: 'created',
      label: 'Run created',
      status: run.createdAt || run.updatedAt ? 'done' : 'missing',
      at: run.createdAt,
      detail: run.runId
    }),
    timelineEvent({
      id: 'route',
      label: 'Route decision',
      status: run.routeDecision || run.semanticCommand || run.intent ? 'done' : 'missing',
      detail: run.semanticCommand ?? run.intent
    }),
    timelineEvent({
      id: 'safety',
      label: 'Safety boundary',
      status: run.safetyMode ? 'done' : 'missing',
      detail: run.safetyMode
    }),
    timelineEvent({
      id: 'execution',
      label: 'Execution',
      status: run.status === 'failed' ? 'failed' : run.status ? 'done' : 'missing',
      detail: run.executionMode ?? run.providerStatus ?? run.status
    }),
    timelineEvent({
      id: 'verification',
      label: 'Verifier',
      status: verifierTimelineStatus(run.verifierStatus),
      detail: run.verifierStatus
    }),
    timelineEvent({
      id: 'artifacts',
      label: 'Artifacts',
      status: Array.isArray(run.artifactRefs) && run.artifactRefs.length > 0 ? 'done' : 'missing',
      detail: Array.isArray(run.artifactRefs) ? `${run.artifactRefs.length} registered` : 'none'
    })
  ];
}

function timelineEvent({ id, label, status, detail, at }) {
  return stripUndefined({
    id,
    label,
    status,
    detail,
    at
  });
}

function verifierTimelineStatus(verifierStatus) {
  if (verifierStatus === 'passed') {
    return 'done';
  }

  if (verifierStatus === 'failed') {
    return 'failed';
  }

  if (verifierStatus === undefined || verifierStatus === null) {
    return 'missing';
  }

  return 'pending';
}

function buildSnapshotRecommendedCommands({ latestRun }) {
  if (latestRun === null) {
    return [
      commandRecommendation({
        id: 'scan',
        label: 'Scan project',
        command: 'symphony scan',
        description: 'Create the first read-only project context.'
      }),
      commandRecommendation({
        id: 'doctor',
        label: 'Check environment',
        command: 'symphony doctor',
        description: 'Verify the local CLI setup.'
      }),
      commandRecommendation({
        id: 'console',
        label: 'Open workbench',
        command: 'symphony console',
        description: 'Start this local read-only workbench.'
      })
    ];
  }

  return dedupeCommands([
    ...buildRunRecommendedCommands(latestRun),
    commandRecommendation({
      id: 'console',
      label: 'Open workbench',
      command: 'symphony console',
      description: 'Return to this read-only dashboard.'
    })
  ]);
}

function buildRunRecommendedCommands(run) {
  return dedupeCommands([
    run.nextAction
      ? commandRecommendation({
          id: 'next',
          label: 'Suggested next',
          command: run.nextAction,
          description: 'Copy the next action recorded by the latest run.'
        })
      : null,
    commandRecommendation({
      id: 'status',
      label: 'Status',
      command: 'symphony status',
      description: 'Read the latest product state.'
    }),
    commandRecommendation({
      id: 'artifacts',
      label: 'Artifacts',
      command: run.runId ? `symphony artifacts ${run.runId}` : 'symphony artifacts',
      description: 'Print registered artifact references for this run.'
    }),
    run.semanticCommand === 'scan'
      ? commandRecommendation({
          id: 'dry-run-work',
          label: 'Dry-run work',
          command: 'symphony do --dry-run "inspect README"',
          description: 'Exercise the work path without project writes.'
        })
      : null,
    run.status && run.status !== 'passed'
      ? commandRecommendation({
          id: 'continue',
          label: 'Continue safely',
          command: 'symphony continue',
          description: 'Ask Symphony what can be continued from state.'
        })
      : null
  ]);
}

function buildReadinessRecommendedCommands() {
  return [
    commandRecommendation({
      id: 'doctor',
      label: 'Doctor',
      command: 'symphony doctor',
      description: 'Check the base CLI environment.'
    }),
    commandRecommendation({
      id: 'check',
      label: 'Static check',
      command: 'pnpm check',
      description: 'Run repository syntax checks.'
    }),
    commandRecommendation({
      id: 'test',
      label: 'Tests',
      command: 'pnpm test',
      description: 'Run the repository test suite.'
    }),
    commandRecommendation({
      id: 'real-codex',
      label: 'Real Codex gate',
      command: 'MCAS_RUN_REAL_CODEX=1 symphony do --real codex "inspect README"',
      description: 'External execution example; copy only and run intentionally.'
    }),
    commandRecommendation({
      id: 'real-claude',
      label: 'Real Claude gate',
      command: 'MCAS_RUN_REAL_CLAUDE=1 symphony do --real claude "inspect README"',
      description: 'External execution example; copy only and run intentionally.'
    }),
    commandRecommendation({
      id: 'real-kiro',
      label: 'Real Kiro gate',
      command: 'MCAS_RUN_REAL_KIRO=1 symphony do --real kiro "inspect README"',
      description: 'External execution example; copy only and run intentionally.'
    })
  ];
}

function commandRecommendation({ id, label, command, description }) {
  return {
    id,
    label,
    command,
    description,
    mode: 'copy-only'
  };
}

function dedupeCommands(commands) {
  const seen = new Set();
  const deduped = [];

  for (const command of commands) {
    if (command === null || seen.has(command.command)) {
      continue;
    }

    seen.add(command.command);
    deduped.push(command);
  }

  return deduped;
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

  const [branch, head, status] = await Promise.all([
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
      args: ['status', '--porcelain'],
      cwd,
      timeoutMs
    })
  ]);
  const dirtyFilesCount = checkOutputLines(status).length;

  return stripUndefined({
    status: 'available',
    branch: firstOutputLine(branch) || 'detached',
    head: firstOutputLine(head) || undefined,
    dirty: dirtyFilesCount > 0,
    dirtyFilesCount,
    command: 'git status --short'
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
      status: git.status === 'available' ? 'ok' : 'attention',
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

function checkOutputLines(check) {
  return commandOutput(check)
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '');
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

function writeHtmlResponse(response, html) {
  response.writeHead(200, {
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'no-store'
  });
  response.end(html);
}

function writeJsonResponse(response, statusCode, value) {
  response.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store'
  });
  response.end(`${JSON.stringify(value, null, 2)}\n`);
}

function stripUndefined(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined)
  );
}

function renderConsoleHtml() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Symphony Workbench</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f5f7fa;
      --panel: #ffffff;
      --text: #20242c;
      --muted: #5f6b7a;
      --line: #d9dee7;
      --accent: #0d6b57;
      --accent-soft: #e5f3ee;
      --warn: #9b6b1f;
      --warn-soft: #fff5dc;
      --danger: #a53d2d;
      --danger-soft: #fae8e4;
      --ok: #1f7a4f;
      --ok-soft: #e3f4ec;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font-size: 14px;
      letter-spacing: 0;
    }

    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      min-height: 64px;
      padding: 14px 24px;
      background: var(--panel);
      border-bottom: 1px solid var(--line);
    }

    h1 {
      margin: 0;
      font-size: 18px;
      font-weight: 650;
    }

    .subtitle {
      margin: 3px 0 0;
      color: var(--muted);
      font-size: 12px;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    main {
      display: grid;
      grid-template-columns: minmax(300px, 420px) minmax(0, 1fr);
      gap: 0;
      min-height: calc(100vh - 64px);
    }

    aside {
      border-right: 1px solid var(--line);
      background: #eef2f5;
      padding: 16px;
      overflow: auto;
    }

    section {
      padding: 20px 24px;
      overflow: auto;
    }

    button {
      min-height: 34px;
      border: 1px solid var(--line);
      background: var(--panel);
      color: var(--text);
      border-radius: 6px;
      padding: 0 10px;
      cursor: pointer;
      font: inherit;
    }

    button:hover,
    button[aria-current="true"] {
      border-color: var(--accent);
      color: var(--accent);
    }

    .badge {
      display: inline-flex;
      align-items: center;
      min-height: 26px;
      border: 1px solid var(--line);
      border-radius: 999px;
      padding: 0 10px;
      background: var(--panel);
      color: var(--muted);
      font-size: 12px;
      white-space: nowrap;
    }

    .dashboard {
      display: grid;
      gap: 10px;
      margin-bottom: 18px;
    }

    .metric-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
    }

    .metric {
      min-width: 0;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: var(--panel);
      padding: 10px;
    }

    .metric-label {
      color: var(--muted);
      font-size: 12px;
    }

    .metric-value {
      margin-top: 4px;
      font-weight: 650;
      overflow-wrap: anywhere;
    }

    .command-list {
      display: grid;
      gap: 8px;
      margin: 0 0 18px;
    }

    .command-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 8px;
      align-items: start;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: var(--panel);
      padding: 10px;
    }

    .command-title {
      font-weight: 650;
    }

    .command-code {
      display: block;
      margin-top: 4px;
      color: #354052;
      font: 12px/1.45 ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
      overflow-wrap: anywhere;
    }

    .run-list {
      display: grid;
      gap: 8px;
    }

    .run-button {
      width: 100%;
      display: grid;
      gap: 4px;
      text-align: left;
      padding: 10px;
    }

    .run-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      color: var(--muted);
      font-size: 12px;
    }

    .empty-state {
      padding: 12px;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: var(--panel);
      overflow-wrap: anywhere;
    }

    .stack {
      display: grid;
      gap: 12px;
      margin: 0 0 18px;
    }

    .preview-panel {
      margin-top: 18px;
    }

    .section-block {
      margin: 0 0 18px;
    }

    h2 {
      margin: 0 0 10px;
      font-size: 14px;
      font-weight: 650;
    }

    .muted {
      color: var(--muted);
    }

    .status {
      font-weight: 650;
    }

    .ok,
    .done,
    .passed {
      color: var(--ok);
    }

    .attention,
    .pending,
    .optional {
      color: var(--warn);
    }

    .failed,
    .error {
      color: var(--danger);
    }

    .timeline {
      display: grid;
      gap: 8px;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .timeline li {
      display: grid;
      grid-template-columns: 12px minmax(0, 1fr);
      gap: 10px;
      align-items: start;
    }

    .timeline-marker {
      width: 10px;
      height: 10px;
      margin-top: 5px;
      border-radius: 999px;
      background: var(--line);
    }

    .timeline-marker.done {
      background: var(--ok);
    }

    .timeline-marker.failed {
      background: var(--danger);
    }

    .timeline-marker.pending {
      background: var(--warn);
    }

    .inline {
      min-height: 28px;
      padding: 0 8px;
    }

    pre {
      margin: 18px 0 0;
      max-height: 46vh;
      overflow: auto;
      padding: 14px;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: #151a21;
      color: #e7edf6;
      font: 12px/1.5 ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }

    dl {
      display: grid;
      grid-template-columns: 150px minmax(0, 1fr);
      gap: 10px 14px;
      margin: 0 0 22px;
    }

    dt {
      color: var(--muted);
    }

    dd {
      margin: 0;
      min-width: 0;
      overflow-wrap: anywhere;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      background: var(--panel);
      border: 1px solid var(--line);
    }

    th,
    td {
      text-align: left;
      padding: 10px 12px;
      border-bottom: 1px solid var(--line);
      vertical-align: top;
      overflow-wrap: anywhere;
    }

    th {
      color: var(--muted);
      font-weight: 600;
      background: #f0f3f8;
    }

    tr[aria-current="true"] {
      background: #edf7f3;
    }

    .file-list {
      margin: 0;
      padding: 0;
      list-style: none;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: var(--panel);
    }

    .file-list li {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      padding: 9px 12px;
      border-bottom: 1px solid var(--line);
      overflow-wrap: anywhere;
    }

    .file-list li:last-child {
      border-bottom: 0;
    }

    @media (max-width: 780px) {
      main {
        grid-template-columns: 1fr;
      }

      aside {
        border-right: 0;
        border-bottom: 1px solid var(--line);
      }

      dl {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>Symphony Workbench</h1>
      <p class="subtitle">Read-only local console for runs, artifacts, readiness, and next commands.</p>
    </div>
    <div class="header-actions">
      <span class="badge">Read-only</span>
      <button id="refresh" type="button">Refresh</button>
    </div>
  </header>
  <main>
    <aside>
      <div id="dashboard" class="dashboard">Loading...</div>
      <h2>Next Commands</h2>
      <div id="commands" class="command-list"></div>
      <h2>Runs</h2>
      <div id="runs" class="run-list"></div>
    </aside>
    <section>
      <div id="details" class="muted">Loading run details...</div>
    </section>
  </main>
  <script>
    const state = {
      snapshot: null,
      readiness: null,
      selectedRunId: null,
      selectedArtifactKind: null,
      artifactPreview: null
    };

    document.getElementById('refresh').addEventListener('click', () => loadSnapshot());
    loadSnapshot();

    async function loadSnapshot() {
      const responses = await Promise.all([
        fetch('/api/summary', { cache: 'no-store' }),
        fetch('/api/readiness', { cache: 'no-store' })
      ]);
      state.snapshot = await responses[0].json();
      state.readiness = responses[1].ok
        ? await responses[1].json()
        : {
            status: 'attention',
            checks: [],
            recommendedCommands: []
          };
      const selectedExists = state.snapshot.runs.some((run) => run.runId === state.selectedRunId);
      if (!selectedExists) {
        state.selectedRunId = state.snapshot.latestRun?.runId || null;
        state.selectedArtifactKind = null;
        state.artifactPreview = null;
      }
      render();
    }

    function render() {
      renderDashboard();
      renderCommands();
      renderRuns();
      renderDetails();
    }

    function renderDashboard() {
      const dashboard = document.getElementById('dashboard');
      const snapshot = state.snapshot;
      const readiness = state.readiness;
      const latest = snapshot.latestRun;
      const metrics = [
        ['State', snapshot.status],
        ['Latest run', latest ? latest.status : 'none'],
        ['Verifier', latest?.verifierStatus || 'none'],
        ['Artifacts', latest?.artifactHealth ? latest.artifactHealth.total + ' registered' : 'none'],
        ['Readiness', readiness?.status || 'loading'],
        ['Git', readiness?.tools?.git?.status === 'available'
          ? readiness.tools.git.branch + (readiness.tools.git.dirty ? ' dirty' : ' clean')
          : readiness?.tools?.git?.status || 'unknown']
      ];

      dashboard.replaceChildren(metricGrid(metrics), readinessChecks(readiness));
    }

    function metricGrid(metrics) {
      const grid = document.createElement('div');
      grid.className = 'metric-grid';
      for (const [label, value] of metrics) {
        const metric = document.createElement('div');
        metric.className = 'metric';
        const metricLabel = document.createElement('div');
        metricLabel.className = 'metric-label';
        metricLabel.textContent = label;
        const metricValue = document.createElement('div');
        metricValue.className = 'metric-value';
        metricValue.textContent = formatValue(value);
        metric.append(metricLabel, metricValue);
        grid.append(metric);
      }
      return grid;
    }

    function readinessChecks(readiness) {
      if (!readiness || !Array.isArray(readiness.checks) || readiness.checks.length === 0) {
        return emptyState('Readiness checks are unavailable.');
      }

      const list = document.createElement('div');
      list.className = 'command-list';
      for (const check of readiness.checks) {
        const row = document.createElement('div');
        row.className = 'command-row';
        const body = document.createElement('div');
        const title = document.createElement('div');
        title.className = 'command-title ' + (check.status || '');
        title.textContent = check.label + ': ' + check.status;
        const detail = document.createElement('span');
        detail.className = 'command-code';
        detail.textContent = check.detail || '';
        body.append(title, detail);
        row.append(body);
        list.append(row);
      }
      return list;
    }

    function renderCommands() {
      const commands = document.getElementById('commands');
      const run = selectedRun();
      const allCommands = dedupeCommands([
        ...(state.snapshot.recommendedCommands || []),
        ...(run?.recommendedCommands || []),
        ...(state.readiness?.recommendedCommands || [])
      ]).slice(0, 8);

      if (allCommands.length === 0) {
        commands.replaceChildren(emptyState('No recommended commands are available.'));
        return;
      }

      commands.replaceChildren(...allCommands.map(commandRow));
    }

    function commandRow(command) {
      const row = document.createElement('div');
      row.className = 'command-row';
      const body = document.createElement('div');
      const title = document.createElement('div');
      title.className = 'command-title';
      title.textContent = command.label || 'Command';
      const code = document.createElement('code');
      code.className = 'command-code';
      code.textContent = command.command;
      const description = document.createElement('div');
      description.className = 'muted';
      description.textContent = command.description || command.mode || 'copy-only';
      body.append(title, code, description);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'inline';
      button.textContent = 'Copy';
      button.addEventListener('click', () => copyCommand(command.command, button));
      row.append(body, button);
      return row;
    }

    function renderRuns() {
      const runs = document.getElementById('runs');
      if (state.snapshot.runs.length === 0) {
        runs.replaceChildren(emptyState('No run states found in this Symphony state directory.'));
        return;
      }

      runs.replaceChildren(...state.snapshot.runs.map((run) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'run-button';
        button.setAttribute('aria-current', String(run.runId === state.selectedRunId));
        button.addEventListener('click', () => {
          state.selectedRunId = run.runId;
          state.selectedArtifactKind = null;
          state.artifactPreview = null;
          render();
        });
        button.append(text(run.command || 'run'));
        const meta = document.createElement('span');
        meta.className = 'run-meta';
        meta.textContent = [run.runId, run.status, run.verifierStatus].filter(Boolean).join(' / ');
        button.append(meta);
        return button;
      }));
    }

    function selectedRun() {
      return state.snapshot.runs.find((candidate) => candidate.runId === state.selectedRunId) || state.snapshot.latestRun;
    }

    function renderDetails() {
      const details = document.getElementById('details');
      const run = selectedRun();

      if (!run) {
        details.replaceChildren(emptyState('No latest run is available for this state directory.'));
        return;
      }

      const statusClass = run.status === 'passed' ? 'passed' : run.status === 'failed' ? 'failed' : '';
      details.replaceChildren(
        definitionList([
          ['Run', run.runId],
          ['Command', run.command],
          ['Intent', run.intent],
          ['Semantic', run.semanticCommand],
          ['Pipeline', formatValue(run.pipeline)],
          ['Status', run.status, statusClass],
          ['Verifier', run.verifierStatus],
          ['Safety', run.safetyMode],
          ['Project writes', formatValue(run.projectWrites)],
          ['Runtime writes', formatValue(run.runtimeWrites)],
          ['External calls', formatValue(run.externalCalls)],
          ['Workflow mode', run.workflowMode],
          ['Adapter', run.adapter],
          ['Execution', run.executionMode],
          ['Provider mode', run.providerMode],
          ['Provider', run.provider],
          ['Provider status', run.providerStatus],
          ['Project', run.projectRoot],
          ['Target', run.targetDir],
          ['Template', run.template],
          ['Artifact health', run.artifactHealth?.status],
          ['Next', run.nextAction]
        ]),
        timelineBlock(run),
        commandBlock(run),
        ...structuredRunBlocks(run),
        artifactTable(run),
        artifactPreviewBlock()
      );
    }

    function definitionList(rows) {
      const list = document.createElement('dl');
      for (const [label, value, className] of rows) {
        if (value === undefined || value === null) continue;
        const term = document.createElement('dt');
        term.textContent = label;
        const data = document.createElement('dd');
        data.textContent = formatValue(value);
        if (className) data.className = 'status ' + className;
        list.append(term, data);
      }
      return list;
    }

    function structuredRunBlocks(run) {
      return [
        structuredBlock('Route decision', run.routeDecision),
        structuredBlock('Provider fallback', run.providerFallback),
        structuredBlock('Unsupported requests', run.unsupportedRequests),
        structuredBlock('Scaffold plan', run.scaffoldPlan),
        structuredBlock('Changed files', run.changedFiles),
        structuredBlock('Created files', run.createdFiles)
      ].filter(Boolean);
    }

    function timelineBlock(run) {
      if (!Array.isArray(run.timeline) || run.timeline.length === 0) {
        return emptyState('No timeline is available for this run.');
      }

      const wrapper = document.createElement('div');
      wrapper.className = 'section-block';
      const heading = document.createElement('h2');
      heading.textContent = 'Timeline';
      const list = document.createElement('ul');
      list.className = 'timeline';
      for (const event of run.timeline) {
        const item = document.createElement('li');
        const marker = document.createElement('span');
        marker.className = 'timeline-marker ' + (event.status || '');
        const body = document.createElement('div');
        const title = document.createElement('div');
        title.className = 'command-title ' + (event.status || '');
        title.textContent = event.label + ': ' + event.status;
        const detail = document.createElement('div');
        detail.className = 'muted';
        detail.textContent = [event.detail, event.at].filter(Boolean).join(' / ');
        body.append(title, detail);
        item.append(marker, body);
        list.append(item);
      }
      wrapper.append(heading, list);
      return wrapper;
    }

    function commandBlock(run) {
      if (!Array.isArray(run.recommendedCommands) || run.recommendedCommands.length === 0) {
        return emptyState('No run-specific commands are available.');
      }

      const wrapper = document.createElement('div');
      wrapper.className = 'section-block';
      const heading = document.createElement('h2');
      heading.textContent = 'Run Commands';
      const list = document.createElement('div');
      list.className = 'command-list';
      list.replaceChildren(...run.recommendedCommands.map(commandRow));
      wrapper.append(heading, list);
      return wrapper;
    }

    function structuredBlock(title, value) {
      if (value === undefined || value === null) return null;
      if (Array.isArray(value) && value.length === 0) return null;

      const wrapper = document.createElement('div');
      wrapper.className = 'stack';
      const heading = document.createElement('h2');
      heading.textContent = title;
      wrapper.append(heading, codeBlock(JSON.stringify(value, null, 2)));
      return wrapper;
    }

    function artifactTable(run) {
      const artifactRefs = run.artifactRefs || [];

      if (artifactRefs.length === 0) {
        return emptyState('No artifact references recorded for this run.');
      }

      const table = document.createElement('table');
      const head = document.createElement('thead');
      head.innerHTML = '<tr><th>Artifact</th><th>Path</th><th>Preview</th></tr>';
      const body = document.createElement('tbody');
      for (const artifact of artifactRefs) {
        const row = document.createElement('tr');
        const kind = document.createElement('td');
        const path = document.createElement('td');
        const action = document.createElement('td');
        const button = document.createElement('button');
        row.setAttribute('aria-current', String(artifact.kind === state.selectedArtifactKind));
        kind.textContent = artifact.kind;
        path.textContent = artifact.path;
        button.type = 'button';
        button.className = 'inline';
        button.setAttribute('aria-current', String(artifact.kind === state.selectedArtifactKind));
        button.textContent = artifact.kind === state.selectedArtifactKind ? 'Selected' : 'Preview';
        button.addEventListener('click', () => loadArtifact(run.runId, artifact.kind));
        action.append(button);
        row.append(kind, path, action);
        body.append(row);
      }
      table.append(head, body);
      return table;
    }

    async function loadArtifact(runId, kind) {
      const response = await fetch('/api/runs/' + encodeURIComponent(runId) + '/artifacts/' + encodeURIComponent(kind), { cache: 'no-store' });
      state.artifactPreview = await response.json();
      state.selectedArtifactKind = kind;
      renderDetails();
    }

    function artifactPreviewBlock() {
      if (!state.artifactPreview) {
        const empty = document.createElement('div');
        empty.className = 'muted';
        empty.textContent = 'Select an artifact to preview it here.';
        return empty;
      }

      const artifact = state.artifactPreview.artifact;
      const panel = document.createElement('div');
      panel.className = 'preview-panel';

      if (!artifact) {
        panel.append(codeBlock(JSON.stringify(state.artifactPreview, null, 2)));
        return panel;
      }

      const heading = document.createElement('h2');
      heading.textContent = 'Artifact preview: ' + artifact.kind;
      panel.append(heading);

      if (artifact.type === 'missing') {
        panel.append(emptyState(artifact.message + ': ' + artifact.path, 'error'));
        return panel;
      }

      if (artifact.type === 'directory') {
        const list = document.createElement('ul');
        list.className = 'file-list';
        for (const entry of artifact.entries || []) {
          const item = document.createElement('li');
          const name = document.createElement('span');
          const type = document.createElement('span');
          name.textContent = entry.name;
          type.className = 'muted';
          type.textContent = entry.type;
          item.append(name, type);
          list.append(item);
        }
        panel.append(list);
        if (artifact.truncated) {
          panel.append(emptyState('Directory preview truncated to 100 entries.'));
        }
        return panel;
      }

      if (artifact.format === 'malformed-json') {
        panel.append(emptyState('Malformed JSON artifact. Raw content is shown below.', 'error'));
        panel.append(codeBlock(artifact.content || ''));
        return panel;
      }

      const block = codeBlock(artifact.format === 'json'
        ? JSON.stringify(artifact.json, null, 2)
        : artifact.content);

      if (artifact.truncated) {
        block.textContent += '\\n\\n[Preview truncated]';
      }

      panel.append(block);
      return panel;
    }

    function emptyState(message, className = 'muted') {
      const empty = document.createElement('div');
      empty.className = 'empty-state ' + className;
      empty.textContent = message;
      return empty;
    }

    function codeBlock(value) {
      const block = document.createElement('pre');
      block.textContent = value;
      return block;
    }

    function formatValue(value) {
      if (Array.isArray(value)) return value.length === 0 ? 'none' : value.join(', ');
      if (typeof value === 'boolean') return value ? 'true' : 'false';
      if (typeof value === 'object' && value !== null) return JSON.stringify(value);
      return String(value);
    }

    function dedupeCommands(commands) {
      const seen = new Set();
      const deduped = [];

      for (const command of commands) {
        if (!command || !command.command || seen.has(command.command)) continue;
        seen.add(command.command);
        deduped.push(command);
      }

      return deduped;
    }

    async function copyCommand(command, button) {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(command);
        button.textContent = 'Copied';
        setTimeout(() => {
          button.textContent = 'Copy';
        }, 1200);
        return;
      }

      window.prompt('Copy command', command);
    }

    function text(value) {
      return document.createTextNode(value);
    }
  </script>
</body>
</html>`;
}
