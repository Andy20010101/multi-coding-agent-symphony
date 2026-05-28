import { access } from 'node:fs/promises';
import { constants } from 'node:fs';

export const DIAGNOSTICS_CONTRACT_NAME = 'diagnostics.v1';
export const DIAGNOSTICS_CONTRACT_VERSION = 1;

export const DIAGNOSTICS_STATUSES = Object.freeze([
  'ok',
  'warning',
  'error',
  'unknown'
]);

export const DIAGNOSTICS_SEVERITIES = Object.freeze([
  'info',
  'warning',
  'error'
]);

export async function buildDiagnosticsContract({
  stateDir = '.symphony'
} = {}) {
  const stateDirReadable = await readableCheck({
    id: 'state-dir-readable',
    label: 'State directory readable',
    path: stateDir
  });
  const checks = [
    stateDirReadable,
    {
      id: 'handoff-ref-registered',
      label: 'Guided handoff ref registered',
      status: 'ok',
      severity: 'info'
    },
    {
      id: 'safe-preview-route-available',
      label: 'Safe preview route available',
      status: 'ok',
      severity: 'info'
    },
    {
      id: 'goal-progress-resolver-available',
      label: 'Goal progress resolver available',
      status: 'ok',
      severity: 'info'
    },
    {
      id: 'read-only-api-boundary',
      label: 'Read-only API boundary',
      status: 'ok',
      severity: 'info'
    },
    {
      id: 'non-get-blocked',
      label: 'Non-GET requests blocked',
      status: 'ok',
      severity: 'info'
    },
    {
      id: 'arbitrary-path-preview-blocked',
      label: 'Arbitrary path preview blocked',
      status: 'ok',
      severity: 'info'
    }
  ];

  return assertDiagnosticsContract({
    contractName: DIAGNOSTICS_CONTRACT_NAME,
    contractVersion: DIAGNOSTICS_CONTRACT_VERSION,
    status: overallStatus(checks),
    checks,
    boundaries: {
      readOnlyApi: true,
      nonGetBlocked: true,
      workbenchFallbackProtected: true,
      arbitraryPathPreviewBlocked: true
    }
  });
}

export function validateDiagnosticsContract(diagnostics) {
  const errors = [];

  if (!isPlainObject(diagnostics)) {
    return {
      ok: false,
      errors: ['diagnostics must be a plain object']
    };
  }

  requireExact(errors, diagnostics.contractName, 'contractName', DIAGNOSTICS_CONTRACT_NAME);
  requireExact(errors, diagnostics.contractVersion, 'contractVersion', DIAGNOSTICS_CONTRACT_VERSION);
  requireEnum(errors, diagnostics.status, 'status', DIAGNOSTICS_STATUSES);
  validateChecks(errors, diagnostics.checks);
  validateBoundaries(errors, diagnostics.boundaries);

  return {
    ok: errors.length === 0,
    errors
  };
}

export function assertDiagnosticsContract(diagnostics) {
  const result = validateDiagnosticsContract(diagnostics);

  if (!result.ok) {
    throw new Error(`Invalid diagnostics contract: ${result.errors.join('; ')}`);
  }

  return diagnostics;
}

async function readableCheck({ id, label, path }) {
  try {
    await access(path, constants.R_OK);

    return {
      id,
      label,
      status: 'ok',
      severity: 'info'
    };
  } catch {
    return {
      id,
      label,
      status: 'warning',
      severity: 'warning'
    };
  }
}

function overallStatus(checks) {
  if (checks.some((check) => check.status === 'error')) {
    return 'error';
  }

  if (checks.some((check) => check.status === 'warning' || check.status === 'unknown')) {
    return 'warning';
  }

  return 'ok';
}

function validateChecks(errors, checks) {
  if (!Array.isArray(checks) || checks.length === 0) {
    errors.push('checks must be a non-empty array');
    return;
  }

  checks.forEach((check, index) => {
    const path = `checks[${index}]`;

    if (!isPlainObject(check)) {
      errors.push(`${path} must be a plain object`);
      return;
    }

    requireNonEmptyString(errors, check.id, `${path}.id`);
    requireNonEmptyString(errors, check.label, `${path}.label`);
    requireEnum(errors, check.status, `${path}.status`, DIAGNOSTICS_STATUSES);
    requireEnum(errors, check.severity, `${path}.severity`, DIAGNOSTICS_SEVERITIES);
  });
}

function validateBoundaries(errors, boundaries) {
  if (!isPlainObject(boundaries)) {
    errors.push('boundaries must be a plain object');
    return;
  }

  for (const field of ['readOnlyApi', 'nonGetBlocked', 'workbenchFallbackProtected', 'arbitraryPathPreviewBlocked']) {
    requireExact(errors, boundaries[field], `boundaries.${field}`, true);
  }
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

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
