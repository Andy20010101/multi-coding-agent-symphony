import { NodeProcessRunner } from './process-runner.js';
import {
  readRealCliReleaseConfig,
  resolveRealCliModelProfile,
  resolveRealCliProvider
} from './real-cli-config.js';
import { writeRealCliDoctorProofArtifact } from './real-cli-proof.js';

export const REAL_CLI_DOCTOR_ADAPTERS = Object.freeze([
  {
    adapterId: 'codex',
    displayName: 'Codex CLI',
    executable: 'codex',
    versionArgs: ['--version'],
    helpArgs: ['exec', '--help'],
    gateEnv: 'MCAS_RUN_REAL_CODEX'
  },
  {
    adapterId: 'claude-code',
    displayName: 'Claude Code CLI',
    executable: 'claude',
    versionArgs: ['--version'],
    helpArgs: ['--help'],
    authArgs: ['auth', 'status'],
    gateEnv: 'MCAS_RUN_REAL_CLAUDE'
  },
  {
    adapterId: 'kiro-cli',
    displayName: 'Kiro CLI',
    executable: 'kiro-cli',
    versionArgs: ['--version'],
    helpArgs: ['--help'],
    gateEnv: 'MCAS_RUN_REAL_KIRO'
  }
]);

export async function runRealCliDoctor({
  runner = new NodeProcessRunner(),
  env = process.env,
  cwd = process.cwd(),
  configFile,
  adapterIds = REAL_CLI_DOCTOR_ADAPTERS.map((adapter) => adapter.adapterId),
  requireGates = false,
  proofDirectory,
  timeoutMs = 15000
} = {}) {
  const releaseConfig = readRealCliReleaseConfig({
    configFile,
    env,
    cwd
  });
  const selectedAdapters = REAL_CLI_DOCTOR_ADAPTERS.filter((adapter) => adapterIds.includes(adapter.adapterId));
  const adapters = [];

  for (const definition of selectedAdapters) {
    adapters.push(await preflightAdapter({
      definition,
      runner,
      env,
      releaseConfig: releaseConfig.config,
      requireGates,
      timeoutMs
    }));
  }

  const status = adapters.every((adapter) => adapter.status === 'ok') ? 'ok' : 'failed';
  const report = {
    version: '1',
    command: 'doctor',
    status,
    realCli: {
      version: '1',
      status,
      modelInvocation: false,
      authStatus: 'checked-where-supported',
      authNote: 'doctor --real-cli checks executable, help, version, gates, model configuration, supported CLI auth status commands, and release proof wiring without invoking a model; gated smoke commands verify model execution.',
      releaseConfig: {
        path: releaseConfig.path,
        exists: releaseConfig.exists
      },
      adapters
    }
  };
  const proofArtifactPath = await writeRealCliDoctorProofArtifact({
    outputDirectory: proofDirectory,
    report
  });

  if (proofArtifactPath) {
    report.realCli.proofArtifactPath = proofArtifactPath;
  }

  return report;
}

export function normalizeRealCliDoctorAdapter(value) {
  if (value === undefined || value === 'all') {
    return REAL_CLI_DOCTOR_ADAPTERS.map((adapter) => adapter.adapterId);
  }

  if (value === 'codex') {
    return ['codex'];
  }

  if (value === 'claude' || value === 'claude-code') {
    return ['claude-code'];
  }

  if (value === 'kiro' || value === 'kiro-cli') {
    return ['kiro-cli'];
  }

  throw new Error('real CLI doctor adapter must be one of: all, codex, claude, claude-code, kiro, kiro-cli');
}

async function preflightAdapter({
  definition,
  runner,
  env,
  releaseConfig,
  requireGates,
  timeoutMs
}) {
  const versionCheck = await runCliCheck({
    runner,
    executable: definition.executable,
    args: definition.versionArgs,
    env,
    timeoutMs
  });
  const helpCheck = await runCliCheck({
    runner,
    executable: definition.executable,
    args: definition.helpArgs,
    env,
    timeoutMs
  });
  const gateEnabled = env[definition.gateEnv] === '1';
  const model = buildModelCheck({
    definition,
    env,
    releaseConfig
  });
  const provider = resolveRealCliProvider({
    adapterId: definition.adapterId,
    env,
    config: releaseConfig
  });
  const auth = definition.authArgs
    ? await runAuthCheck({
      definition,
      runner,
      provider,
      env,
      timeoutMs
    })
    : {
      status: 'not-supported',
      proofCommand: realSmokeCommandFor(definition.adapterId)
    };
  const gate = {
    envName: definition.gateEnv,
    status: gateEnabled ? 'enabled' : 'not-enabled',
    ...(gateEnabled
      ? {}
      : { recommendation: `Set ${definition.gateEnv}=1 before invoking the real ${definition.adapterId} lane.` })
  };
  const cliStatus = helpCheck.status === 'passed' ? 'available' : 'failed';
  const status = cliStatus === 'available'
    && model.status !== 'failed'
    && auth.status !== 'failed'
    && (!requireGates || gate.status === 'enabled')
    ? 'ok'
    : 'failed';

  return {
    adapterId: definition.adapterId,
    displayName: definition.displayName,
    status,
    cli: {
      executable: definition.executable,
      status: cliStatus,
      version: versionCheck.status === 'passed' ? firstOutputLine(versionCheck) : 'unknown',
      versionCheck,
      helpCheck
    },
    gate,
    model,
    provider,
    auth
  };
}

async function runAuthCheck({
  definition,
  runner,
  provider,
  env,
  timeoutMs
}) {
  const authCheck = await runCliCheck({
    runner,
    executable: definition.executable,
    args: definition.authArgs,
    env,
    timeoutMs
  });
  const parsed = parseOptionalJson(authCheck.stdout);
  const effectiveApiProvider = effectiveAuthProvider({
    adapterId: definition.adapterId,
    apiProvider: parsed?.apiProvider,
    env
  });
  const auth = {
    status: authCheck.status === 'passed' ? 'checked' : 'failed',
    check: authCheck,
    proofCommand: realSmokeCommandFor(definition.adapterId),
    ...(parsed?.loggedIn !== undefined ? { loggedIn: parsed.loggedIn } : {}),
    ...(parsed?.authMethod ? { authMethod: parsed.authMethod } : {}),
    ...(parsed?.apiProvider ? { apiProvider: parsed.apiProvider } : {}),
    ...(effectiveApiProvider ? { effectiveApiProvider } : {})
  };

  if (auth.status === 'failed') {
    auth.recommendation = `${definition.executable} ${definition.authArgs.join(' ')} must pass before release real CLI gates.`;
    return auth;
  }

  const comparableApiProvider = auth.effectiveApiProvider ?? auth.apiProvider;

  if (provider.name !== 'unknown' && comparableApiProvider && provider.name !== comparableApiProvider) {
    return {
      ...auth,
      status: 'failed',
      recommendation: `Release config provider is ${provider.name}, but ${definition.executable} auth status reports ${comparableApiProvider}. Align ${provider.envName} or the CLI auth provider before real smoke.`
    };
  }

  return auth;
}

function buildModelCheck({ definition, env, releaseConfig }) {
  const resolved = resolveRealCliModelProfile({
    adapterId: definition.adapterId,
    env,
    config: releaseConfig
  });

  if (definition.adapterId === 'claude-code' && resolved.source === 'adapter-default') {
    return {
      ...resolved,
      status: 'failed',
      recommendation: `Set ${resolved.envName}=<provider-model> or configure models["claude-code"] in config/real-cli-release.json; the adapter default ${resolved.profile} is not a release gate proof.`
    };
  }

  return {
    ...resolved,
    status: 'configured'
  };
}

async function runCliCheck({
  runner,
  executable,
  args,
  env,
  timeoutMs
}) {
  try {
    const result = await runner.run({
      executable,
      args,
      env,
      timeoutMs
    });

    return {
      status: result.exitCode === 0 ? 'passed' : 'failed',
      exitCode: result.exitCode,
      stdout: previewOutput(result.stdout),
      stderr: previewOutput(result.stderr),
      stdoutBytes: Buffer.byteLength(result.stdout ?? '', 'utf8'),
      stderrBytes: Buffer.byteLength(result.stderr ?? '', 'utf8')
    };
  } catch (error) {
    return {
      status: 'failed',
      exitCode: null,
      stdout: '',
      stderr: '',
      error: error.message
    };
  }
}

function previewOutput(value) {
  const output = value ?? '';

  if (output.length <= 500) {
    return output;
  }

  return `${output.slice(0, 500)}\n[truncated ${output.length - 500} chars]`;
}

function firstOutputLine(check) {
  const line = `${check.stdout}\n${check.stderr}`
    .split('\n')
    .map((entry) => entry.trim())
    .find((entry) => entry !== '');

  return line ?? 'unknown';
}

function parseOptionalJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function effectiveAuthProvider({ adapterId, apiProvider, env = process.env }) {
  if (adapterId !== 'claude-code') {
    return null;
  }

  const baseUrl = nonEmptyString(env.ANTHROPIC_BASE_URL);

  if (!baseUrl) {
    return null;
  }

  let hostname;

  try {
    hostname = new URL(baseUrl).hostname.toLowerCase();
  } catch {
    return null;
  }

  if (hostname === 'api.deepseek.com' || hostname.endsWith('.deepseek.com')) {
    return 'deepseek';
  }

  return apiProvider ?? null;
}

function nonEmptyString(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    return undefined;
  }

  return value.trim();
}

function realSmokeCommandFor(adapterId) {
  if (adapterId === 'codex') {
    return 'MCAS_RUN_REAL_CODEX=1 pnpm smoke:codex:real';
  }

  if (adapterId === 'claude-code') {
    return 'MCAS_RUN_REAL_CLAUDE=1 pnpm smoke:claude:real';
  }

  return 'MCAS_RUN_REAL_KIRO=1 pnpm smoke:kiro:real';
}
