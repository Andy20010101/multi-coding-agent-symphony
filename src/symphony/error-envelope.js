export const ERROR_ENVELOPE_CONTRACT_NAME = 'error-envelope.v1';
export const ERROR_ENVELOPE_CONTRACT_VERSION = 1;

const HTTP_METHODS = Object.freeze(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS', 'UNKNOWN']);

export function buildErrorEnvelope({
  code,
  message,
  status,
  route,
  method,
  safeDetails
}) {
  return assertErrorEnvelopeContract({
    contractName: ERROR_ENVELOPE_CONTRACT_NAME,
    contractVersion: ERROR_ENVELOPE_CONTRACT_VERSION,
    ok: false,
    error: {
      code: safeToken(code, 'unknown-error'),
      message: safeMessage(message),
      status,
      route: safeRoute(route),
      method: HTTP_METHODS.includes(method) ? method : 'UNKNOWN',
      ...(safeDetails === undefined ? {} : { safeDetails: sanitizeSafeDetails(safeDetails) })
    }
  });
}

export function validateErrorEnvelopeContract(envelope) {
  const errors = [];

  if (!isPlainObject(envelope)) {
    return {
      ok: false,
      errors: ['envelope must be a plain object']
    };
  }

  requireExact(errors, envelope.contractName, 'contractName', ERROR_ENVELOPE_CONTRACT_NAME);
  requireExact(errors, envelope.contractVersion, 'contractVersion', ERROR_ENVELOPE_CONTRACT_VERSION);
  requireExact(errors, envelope.ok, 'ok', false);

  if (!isPlainObject(envelope.error)) {
    errors.push('error must be a plain object');
    return {
      ok: false,
      errors
    };
  }

  requireNonEmptyString(errors, envelope.error.code, 'error.code');
  requireNonEmptyString(errors, envelope.error.message, 'error.message');
  requireHttpStatus(errors, envelope.error.status, 'error.status');
  requireSafeRoute(errors, envelope.error.route, 'error.route');
  requireEnum(errors, envelope.error.method, 'error.method', HTTP_METHODS);

  for (const [path, value] of [
    ['error.message', envelope.error.message],
    ['error.route', envelope.error.route],
    ...flattenSafeDetails(envelope.error.safeDetails, 'error.safeDetails')
  ]) {
    if (typeof value === 'string' && unsafeString(value)) {
      errors.push(`${path} must not contain stack traces, secrets, or absolute local paths`);
    }
  }

  return {
    ok: errors.length === 0,
    errors
  };
}

export function assertErrorEnvelopeContract(envelope) {
  const result = validateErrorEnvelopeContract(envelope);

  if (!result.ok) {
    throw new Error(`Invalid error envelope contract: ${result.errors.join('; ')}`);
  }

  return envelope;
}

function safeToken(value, fallback) {
  return typeof value === 'string' && /^[a-z0-9][a-z0-9._:-]*$/iu.test(value)
    ? value
    : fallback;
}

function safeMessage(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    return 'Request failed safely.';
  }

  return unsafeString(value) ? 'Request failed safely.' : value;
}

function safeRoute(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    return '/';
  }

  const route = value.split('?')[0].split('#')[0];

  if (!route.startsWith('/') || unsafeString(route)) {
    return '/';
  }

  return route;
}

function sanitizeSafeDetails(value) {
  if (!isPlainObject(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key, entry]) => /^[A-Za-z0-9._:-]+$/u.test(key) && isSafeDetailValue(entry))
      .map(([key, entry]) => [key, typeof entry === 'string' && unsafeString(entry) ? 'redacted' : entry])
  );
}

function isSafeDetailValue(value) {
  return value === null ||
    ['string', 'number', 'boolean'].includes(typeof value);
}

function flattenSafeDetails(value, path) {
  if (!isPlainObject(value)) {
    return [];
  }

  return Object.entries(value).map(([key, entry]) => [`${path}.${key}`, entry]);
}

function unsafeString(value) {
  return /\/Users\/|\/home\/|\/var\/|\/tmp\/|[A-Za-z]:\\|gh[pousr]_[A-Za-z0-9_]+|at .+ \(.+:\d+:\d+\)|\n\s*at /u.test(value);
}

function requireExact(errors, value, path, expected) {
  if (value !== expected) {
    errors.push(`${path} must be ${String(expected)}`);
  }
}

function requireNonEmptyString(errors, value, path) {
  if (typeof value !== 'string' || value.trim() === '') {
    errors.push(`${path} must be a non-empty string`);
  }
}

function requireHttpStatus(errors, value, path) {
  if (!Number.isInteger(value) || value < 400 || value > 599) {
    errors.push(`${path} must be an HTTP error status`);
  }
}

function requireSafeRoute(errors, value, path) {
  requireNonEmptyString(errors, value, path);

  if (typeof value !== 'string') {
    return;
  }

  if (!value.startsWith('/') || value.includes('\\')) {
    errors.push(`${path} must be an absolute route path`);
  }
}

function requireEnum(errors, value, path, values) {
  if (!values.includes(value)) {
    errors.push(`${path} must be one of ${values.join(', ')}`);
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
