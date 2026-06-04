export const SIDECAR_HOST_LIFECYCLE_CONTRACT_NAME = 'sidecar-host-lifecycle.v1';
export const SIDECAR_HOST_LIFECYCLE_CONTRACT_VERSION = 1;

const DEFAULT_ALLOWED_HOSTS = Object.freeze(['127.0.0.1', 'localhost']);
const DEFAULT_ALLOWED_PORT_RANGE = Object.freeze({ min: 1024, max: 65535 });
const DEFAULT_HEALTH_ROUTE = '/api/health';
const DEFAULT_LAUNCHER_COMMAND_ID = 'symphony.console.sidecar.launch';

export function buildSidecarHostLifecycle({
  generatedAt = new Date().toISOString(),
  pid = process.pid,
  attach = {},
  launcher = {}
} = {}) {
  const attachState = normalizeEnum(
    attach.state,
    ['attached', 'detached', 'unavailable'],
    'attached'
  );
  const launcherState = normalizeEnum(
    launcher.state,
    ['defined', 'launch-requested', 'unavailable'],
    'defined'
  );
  const attachHost = normalizeAllowedHost(attach.host);
  const attachPort = normalizeAllowedPort(attach.port);

  return assertSidecarHostLifecycleContract({
    contractName: SIDECAR_HOST_LIFECYCLE_CONTRACT_NAME,
    contractVersion: SIDECAR_HOST_LIFECYCLE_CONTRACT_VERSION,
    generatedAt,
    hostKind: 'tauri-native-host',
    sidecarKind: 'symphony-console-sidecar',
    lifecycle: attachState === 'attached' ? 'attached' : 'needs-attach',
    attach: {
      state: attachState,
      strategy: normalizeNonEmptyString(attach.strategy, 'current-runtime-health'),
      healthRoute: DEFAULT_HEALTH_ROUTE,
      endpoint: attachHost === null || attachPort === null
        ? DEFAULT_HEALTH_ROUTE
        : `http://${attachHost}:${attachPort}${DEFAULT_HEALTH_ROUTE}`,
      processId: normalizePositiveInteger(attach.processId, pid),
      sourceContract: 'local-runtime-health.v1'
    },
    launcher: {
      state: launcherState,
      commandId: normalizeNonEmptyString(launcher.commandId, DEFAULT_LAUNCHER_COMMAND_ID),
      nativeHostRequired: true,
      rendererLaunchAvailable: false,
      allowedHosts: DEFAULT_ALLOWED_HOSTS.slice(),
      allowedPortRange: { ...DEFAULT_ALLOWED_PORT_RANGE },
      stateDirScope: 'repo-local .symphony only',
      source: 'desktop/shell/src-tauri controlled command registry'
    },
    boundaries: {
      readOnlyHealth: true,
      rendererShellExecutionAvailable: false,
      genericShellRunnerAvailable: false,
      arbitraryCommandAvailable: false,
      arbitraryPathAvailable: false,
      modelInvocationAvailable: false,
      gitWriteAvailable: false,
      releaseWriteAvailable: false
    }
  });
}

export function validateSidecarHostLifecycleContract(lifecycle) {
  const errors = [];

  if (!isPlainObject(lifecycle)) {
    return {
      ok: false,
      errors: ['sidecar lifecycle must be a plain object']
    };
  }

  requireExact(errors, lifecycle.contractName, 'contractName', SIDECAR_HOST_LIFECYCLE_CONTRACT_NAME);
  requireExact(errors, lifecycle.contractVersion, 'contractVersion', SIDECAR_HOST_LIFECYCLE_CONTRACT_VERSION);
  requireIsoTimestamp(errors, lifecycle.generatedAt, 'generatedAt');
  requireExact(errors, lifecycle.hostKind, 'hostKind', 'tauri-native-host');
  requireExact(errors, lifecycle.sidecarKind, 'sidecarKind', 'symphony-console-sidecar');
  requireEnum(errors, lifecycle.lifecycle, 'lifecycle', ['attached', 'needs-attach']);
  validateAttach(errors, lifecycle.attach);
  validateLauncher(errors, lifecycle.launcher);
  validateBoundaries(errors, lifecycle.boundaries);

  return {
    ok: errors.length === 0,
    errors
  };
}

export function assertSidecarHostLifecycleContract(lifecycle) {
  const result = validateSidecarHostLifecycleContract(lifecycle);

  if (!result.ok) {
    throw new Error(`Invalid sidecar host lifecycle contract: ${result.errors.join('; ')}`);
  }

  return lifecycle;
}

function validateAttach(errors, attach) {
  if (!isPlainObject(attach)) {
    errors.push('attach must be a plain object');
    return;
  }

  requireEnum(errors, attach.state, 'attach.state', ['attached', 'detached', 'unavailable']);
  requireNonEmptyString(errors, attach.strategy, 'attach.strategy');
  requireExact(errors, attach.healthRoute, 'attach.healthRoute', DEFAULT_HEALTH_ROUTE);
  requireNonEmptyString(errors, attach.endpoint, 'attach.endpoint');
  requirePositiveInteger(errors, attach.processId, 'attach.processId');
  requireExact(errors, attach.sourceContract, 'attach.sourceContract', 'local-runtime-health.v1');
}

function validateLauncher(errors, launcher) {
  if (!isPlainObject(launcher)) {
    errors.push('launcher must be a plain object');
    return;
  }

  requireEnum(errors, launcher.state, 'launcher.state', ['defined', 'launch-requested', 'unavailable']);
  requireExact(errors, launcher.commandId, 'launcher.commandId', DEFAULT_LAUNCHER_COMMAND_ID);
  requireExact(errors, launcher.nativeHostRequired, 'launcher.nativeHostRequired', true);
  requireExact(errors, launcher.rendererLaunchAvailable, 'launcher.rendererLaunchAvailable', false);

  if (!Array.isArray(launcher.allowedHosts)) {
    errors.push('launcher.allowedHosts must be an array');
  } else {
    requireExact(
      errors,
      launcher.allowedHosts.join(','),
      'launcher.allowedHosts',
      DEFAULT_ALLOWED_HOSTS.join(',')
    );
  }

  if (!isPlainObject(launcher.allowedPortRange)) {
    errors.push('launcher.allowedPortRange must be a plain object');
  } else {
    requireExact(errors, launcher.allowedPortRange.min, 'launcher.allowedPortRange.min', DEFAULT_ALLOWED_PORT_RANGE.min);
    requireExact(errors, launcher.allowedPortRange.max, 'launcher.allowedPortRange.max', DEFAULT_ALLOWED_PORT_RANGE.max);
  }

  requireExact(errors, launcher.stateDirScope, 'launcher.stateDirScope', 'repo-local .symphony only');
  requireExact(errors, launcher.source, 'launcher.source', 'desktop/shell/src-tauri controlled command registry');
}

function validateBoundaries(errors, boundaries) {
  if (!isPlainObject(boundaries)) {
    errors.push('boundaries must be a plain object');
    return;
  }

  for (const [field, expected] of Object.entries({
    readOnlyHealth: true,
    rendererShellExecutionAvailable: false,
    genericShellRunnerAvailable: false,
    arbitraryCommandAvailable: false,
    arbitraryPathAvailable: false,
    modelInvocationAvailable: false,
    gitWriteAvailable: false,
    releaseWriteAvailable: false
  })) {
    requireExact(errors, boundaries[field], `boundaries.${field}`, expected);
  }
}

function normalizeEnum(value, values, fallback) {
  return values.includes(value) ? value : fallback;
}

function normalizeNonEmptyString(value, fallback) {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : fallback;
}

function normalizePositiveInteger(value, fallback) {
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

function normalizeAllowedHost(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  return DEFAULT_ALLOWED_HOSTS.includes(value) ? value : null;
}

function normalizeAllowedPort(value) {
  if (!Number.isInteger(value)) {
    return null;
  }

  return value >= DEFAULT_ALLOWED_PORT_RANGE.min && value <= DEFAULT_ALLOWED_PORT_RANGE.max
    ? value
    : null;
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function requireExact(errors, value, path, expected) {
  if (value !== expected) {
    errors.push(`${path} must be ${String(expected)}`);
  }
}

function requireEnum(errors, value, path, values) {
  if (!values.includes(value)) {
    errors.push(`${path} must be one of ${values.join(', ')}`);
  }
}

function requireNonEmptyString(errors, value, path) {
  if (typeof value !== 'string' || value.trim() === '') {
    errors.push(`${path} must be a non-empty string`);
  }
}

function requirePositiveInteger(errors, value, path) {
  if (!Number.isInteger(value) || value < 1) {
    errors.push(`${path} must be a positive integer`);
  }
}

function requireIsoTimestamp(errors, value, path) {
  requireNonEmptyString(errors, value, path);

  if (typeof value === 'string' && Number.isNaN(Date.parse(value))) {
    errors.push(`${path} must be an ISO timestamp`);
  }
}
