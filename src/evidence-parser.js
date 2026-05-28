import { validateEvidencePackage } from './contracts.js';

export function extractEvidencePackageFromSources({
  sources,
  command,
  taskId,
  workspaceId
}) {
  if (!Array.isArray(sources)) {
    throw new TypeError('sources must be an array');
  }

  for (const source of sources) {
    const candidate = findEvidenceCandidate(source);
    const evidence = normalizeEvidenceCandidate(candidate, {
      command,
      taskId,
      workspaceId
    });

    if (evidence) {
      return evidence;
    }
  }

  return null;
}

function normalizeEvidenceCandidate(candidate, metadata) {
  if (!isPlainObject(candidate)) {
    return null;
  }

  const evidence = {
    ...candidate,
    command: metadata.command,
    taskId: metadata.taskId,
    workspaceId: metadata.workspaceId,
    diffSummary: Array.isArray(candidate.diffSummary) ? candidate.diffSummary : [],
    changedFiles: Array.isArray(candidate.changedFiles) ? candidate.changedFiles : [],
    knownRisks: Array.isArray(candidate.knownRisks) ? candidate.knownRisks : [],
    agentSummary: typeof candidate.agentSummary === 'string' && candidate.agentSummary.trim() !== ''
      ? candidate.agentSummary
      : 'Structured evidence extracted from CLI output.',
    version: typeof candidate.version === 'string' && candidate.version.trim() !== ''
      ? candidate.version
      : typeof candidate.schema === 'string' && candidate.schema.trim() !== ''
        ? candidate.schema
        : '1'
  };
  const normalized = stripNullOptionalEvidenceFields(evidence);

  try {
    validateEvidencePackage(normalized);
  } catch {
    return null;
  }

  return structuredClone(normalized);
}

function stripNullOptionalEvidenceFields(evidence) {
  const normalized = structuredClone(evidence);
  const optionalEvidenceFields = [
    'noOpRationale',
    'findings',
    'noFindingRationale',
    'resourceProfile'
  ];

  for (const field of optionalEvidenceFields) {
    if (normalized[field] === null) {
      delete normalized[field];
    }
  }

  if (Array.isArray(normalized.checks)) {
    normalized.checks = normalized.checks.map((check) => {
      if (!isPlainObject(check)) {
        return check;
      }

      const normalizedCheck = structuredClone(check);

      for (const field of ['command', 'exitCode', 'output', 'artifactId', 'startedAt', 'finishedAt']) {
        if (normalizedCheck[field] === null) {
          delete normalizedCheck[field];
        }
      }

      if (normalizedCheck.output === undefined &&
        typeof normalizedCheck.message === 'string' &&
        normalizedCheck.message.trim() !== '') {
        normalizedCheck.output = normalizedCheck.message;
      }

      if (normalizedCheck.output === undefined &&
        typeof normalizedCheck.detail === 'string' &&
        normalizedCheck.detail.trim() !== '') {
        normalizedCheck.output = normalizedCheck.detail;
      }

      if (normalizedCheck.output === undefined &&
        isPlainObject(normalizedCheck.evidence)) {
        normalizedCheck.output = 'Structured check evidence provided.';
      }

      if (normalizedCheck.output === undefined &&
        isPlainObject(normalizedCheck.details)) {
        normalizedCheck.output = 'Structured check details provided.';
      }

      if (normalizedCheck.output === undefined &&
        normalizedCheck.artifactId === undefined &&
        typeof normalizedCheck.command === 'string' &&
        Number.isInteger(normalizedCheck.exitCode)) {
        normalizedCheck.output = `Command exited with code ${normalizedCheck.exitCode}.`;
      }

      return normalizedCheck;
    });
  }

  return normalized;
}

function findEvidenceCandidate(value, depth = 0) {
  if (depth > 8 || value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'string') {
    return findEvidenceCandidate(parseJsonText(value), depth + 1);
  }

  if (Array.isArray(value)) {
    for (const item of [...value].reverse()) {
      const candidate = findEvidenceCandidate(item, depth + 1);

      if (candidate) {
        return candidate;
      }
    }

    return null;
  }

  if (!isPlainObject(value)) {
    return null;
  }

  if (looksLikeEvidence(value)) {
    return value;
  }

  const priorityKeys = ['evidence', 'payload', 'message', 'content', 'final', 'output', 'result', 'data'];
  const values = [];

  for (const key of priorityKeys) {
    if (Object.hasOwn(value, key)) {
      values.push(value[key]);
    }
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    if (!priorityKeys.includes(key)) {
      values.push(nestedValue);
    }
  }

  return findEvidenceCandidate(values, depth + 1);
}

function looksLikeEvidence(value) {
  return isPlainObject(value)
    && Array.isArray(value.checks)
    && value.checks.some(looksLikeCheck)
    && (Array.isArray(value.changedFiles) ||
      typeof value.agentSummary === 'string' ||
      typeof value.schema === 'string' ||
      value.doneCriteria !== undefined);
}

function looksLikeCheck(value) {
  return isPlainObject(value) &&
    typeof value.name === 'string' &&
    typeof value.status === 'string';
}

function parseJsonText(text) {
  const trimmed = stripAnsi(text).trim();

  if (trimmed === '') {
    return null;
  }

  for (const candidate of jsonTextCandidates(trimmed)) {
    try {
      return JSON.parse(candidate);
    } catch {
      // Keep trying lower-confidence candidates.
    }
  }

  return null;
}

function jsonTextCandidates(text) {
  const candidates = [text];
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);

  if (fenced) {
    candidates.push(fenced[1].trim());
  }

  const objectStart = text.indexOf('{');
  const objectEnd = text.lastIndexOf('}');

  if (objectStart >= 0 && objectEnd > objectStart) {
    candidates.push(text.slice(objectStart, objectEnd + 1));
  }

  candidates.push(...balancedJsonObjectCandidates(text).reverse());

  return candidates;
}

function balancedJsonObjectCandidates(text) {
  const candidates = [];
  let depth = 0;
  let start = -1;
  let inString = false;
  let escaped = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }

      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === '{') {
      if (depth === 0) {
        start = index;
      }

      depth += 1;
      continue;
    }

    if (char !== '}' || depth === 0) {
      continue;
    }

    depth -= 1;

    if (depth === 0 && start >= 0) {
      candidates.push(text.slice(start, index + 1));
      start = -1;
    }
  }

  return candidates;
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function stripAnsi(text) {
  return text.replace(/\u001B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g, '');
}
