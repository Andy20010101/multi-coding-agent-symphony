const REDACTED_TOKEN = '[REDACTED_TOKEN]';
const REDACTED_PATH = '[REDACTED_PATH]';

const TOKEN_PATTERNS = [
  /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/g,
  /\bsk-[A-Za-z0-9_-]{20,}\b/g,
  /\bBearer\s+[A-Za-z0-9._~+/=-]{12,}\b/gi
];

const SECRET_ASSIGNMENT_PATTERN = /\b([A-Z0-9_]*(?:TOKEN|SECRET|PASSWORD|API_KEY)[A-Z0-9_]*)=("[^"]+"|'[^']+'|[^\s"']+)/gi;
const ENV_PATH_PATTERN = /(^|[\s"'])([^"'\s]*\.env(?:\.[A-Za-z0-9_-]+)?)/g;
const AUTH_PATH_PATTERN = /(^|[\s"'])([^"'\s]*(?:\.npmrc|\.netrc|\.ssh\/id_[A-Za-z0-9_-]+))/g;

export function redactSecrets(value) {
  if (typeof value === 'string') {
    return redactString(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactSecrets(item));
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, redactSecrets(item)])
    );
  }

  return value;
}

function redactString(value) {
  let redacted = value.replace(SECRET_ASSIGNMENT_PATTERN, `$1=${REDACTED_TOKEN}`);

  for (const pattern of TOKEN_PATTERNS) {
    redacted = redacted.replace(pattern, (match) => (
      match.toLowerCase().startsWith('bearer ')
        ? `Bearer ${REDACTED_TOKEN}`
        : REDACTED_TOKEN
    ));
  }

  redacted = redacted.replace(ENV_PATH_PATTERN, `$1${REDACTED_PATH}`);
  redacted = redacted.replace(AUTH_PATH_PATTERN, `$1${REDACTED_PATH}`);

  return redacted;
}

function isPlainObject(value) {
  if (value === null || typeof value !== 'object') {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
