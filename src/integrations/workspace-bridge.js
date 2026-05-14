export function buildWorkspaceConstraints({ runId, writeSet }) {
  const constraints = [];

  if (typeof runId === 'string' && runId.trim() !== '') {
    constraints.push(`harness.run_id:${runId}`);
  }

  for (const pattern of normalizeWriteSet(writeSet)) {
    constraints.push(`write_set:${pattern}`);
  }

  return constraints;
}

export function normalizeWriteSet(writeSet) {
  assertNonEmptyStringArray(writeSet, 'TaskPacket.write_set');
  return writeSet.map((pattern, index) => normalizePattern(pattern, `TaskPacket.write_set[${index}]`));
}

export function findWriteSetViolations({ changedFiles, writeSet }) {
  if (!Array.isArray(changedFiles) || changedFiles.length === 0) {
    return [];
  }

  const normalizedWriteSet = normalizeWriteSet(writeSet);

  return changedFiles
    .map((changedFile) => normalizeChangedFile(changedFile))
    .filter((changedFile) => changedFile !== null)
    .filter((changedFile) => !matchesAnyPattern(changedFile, normalizedWriteSet));
}

function matchesAnyPattern(changedFile, patterns) {
  return patterns.some((pattern) => patternToRegExp(pattern).test(changedFile));
}

function patternToRegExp(pattern) {
  let source = '^';

  for (let index = 0; index < pattern.length; index += 1) {
    const char = pattern[index];
    const next = pattern[index + 1];

    if (char === '*' && next === '*') {
      source += '.*';
      index += 1;
      continue;
    }

    if (char === '*') {
      source += '[^/]*';
      continue;
    }

    source += escapeRegExp(char);
  }

  return new RegExp(`${source}$`);
}

function normalizePattern(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${field} must be a non-empty string`);
  }

  const normalized = normalizePortablePath(value);

  if (normalized.startsWith('/') ||
    normalized === '..' ||
    normalized.startsWith('../') ||
    normalized.includes('/../')) {
    throw new TypeError(`${field} must be a relative write-set pattern`);
  }

  return normalized;
}

function normalizeChangedFile(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    return null;
  }

  const normalized = normalizePortablePath(value);

  if (normalized.startsWith('/') ||
    normalized === '..' ||
    normalized.startsWith('../') ||
    normalized.includes('/../')) {
    return normalized;
  }

  return normalized;
}

function normalizePortablePath(value) {
  return value
    .trim()
    .replaceAll('\\', '/')
    .replace(/\/+/g, '/')
    .replace(/^\.\//, '');
}

function assertNonEmptyStringArray(value, field) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new TypeError(`${field} must be a non-empty string array`);
  }

  for (const [index, item] of value.entries()) {
    if (typeof item !== 'string' || item.trim() === '') {
      throw new TypeError(`${field}[${index}] must be a non-empty string`);
    }
  }
}

function escapeRegExp(value) {
  return value.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
}
