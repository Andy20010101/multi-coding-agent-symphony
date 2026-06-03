import {
  ARTIFACT_INDEX_CONTRACT_NAME,
  ARTIFACT_INDEX_CONTRACT_VERSION
} from './artifact-index-contract.js';

export const SAFE_PREVIEW_SEARCH_CONTRACT_NAME = 'safe-preview-search.v1';
export const SAFE_PREVIEW_SEARCH_CONTRACT_VERSION = 1;

export const ALLOWED_SEARCH_PARAMS = Object.freeze([
  'q',
  'kind',
  'goalId',
  'taskId',
  'evidenceKind'
]);

const ARTIFACT_KINDS = Object.freeze([
  'evidence',
  'plan',
  'runbook',
  'fixture',
  'log',
  'artifact',
  'bundle',
  'summary'
]);

const EVIDENCE_KINDS = Object.freeze([
  'worker',
  'reviewer',
  'main-verifier',
  'release-manager'
]);

const SAFE_PARAM_TOKEN_RE = /^[A-Za-z0-9][A-Za-z0-9._-]*$/u;

const SAFE_QUERY_TOKEN_RE = /^[A-Za-z0-9一-鿿　-〿＀-￯ .,;:!?()[\]{}=&_@#*+\-/<>'"|~`%^]+$/u;

const MAX_QUERY_LENGTH = 256;

export function validateSearchFilters(filters) {
  const errors = [];

  if (!isPlainObject(filters)) {
    return { ok: false, errors: ['filters must be a plain object'] };
  }

  const unexpectedKeys = Object.keys(filters).filter(
    (key) => !ALLOWED_SEARCH_PARAMS.includes(key)
  );

  if (unexpectedKeys.length > 0) {
    errors.push(`unexpected filter keys: ${unexpectedKeys.join(', ')}`);
  }

  if (Object.hasOwn(filters, 'q')) {
    if (typeof filters.q !== 'string' || filters.q.trim().length === 0) {
      errors.push('q must be a non-empty string');
    } else if (filters.q.length > MAX_QUERY_LENGTH) {
      errors.push(`q must not exceed ${MAX_QUERY_LENGTH} characters`);
    } else if (!SAFE_QUERY_TOKEN_RE.test(filters.q)) {
      errors.push('q contains unsafe characters');
    } else if (filters.q.includes('..') || /^file:/iu.test(filters.q) || filters.q.includes('\\')) {
      errors.push('q must not contain traversal or filesystem path syntax');
    }
  }

  if (Object.hasOwn(filters, 'kind')) {
    if (typeof filters.kind !== 'string') {
      errors.push('kind must be a string');
    } else if (!ARTIFACT_KINDS.includes(filters.kind)) {
      errors.push(`kind must be one of ${ARTIFACT_KINDS.join(', ')}`);
    }
  }

  if (Object.hasOwn(filters, 'goalId')) {
    if (typeof filters.goalId !== 'string' || !SAFE_PARAM_TOKEN_RE.test(filters.goalId)) {
      errors.push('goalId must be a safe ref');
    }
  }

  if (Object.hasOwn(filters, 'taskId')) {
    if (typeof filters.taskId !== 'string' || !SAFE_PARAM_TOKEN_RE.test(filters.taskId)) {
      errors.push('taskId must be a safe ref');
    }
  }

  if (Object.hasOwn(filters, 'evidenceKind')) {
    if (typeof filters.evidenceKind !== 'string') {
      errors.push('evidenceKind must be a string');
    } else if (!EVIDENCE_KINDS.includes(filters.evidenceKind)) {
      errors.push(`evidenceKind must be one of ${EVIDENCE_KINDS.join(', ')}`);
    }
  }

  return { ok: errors.length === 0, errors };
}

export function assertSearchFilters(filters) {
  const result = validateSearchFilters(filters);

  if (!result.ok) {
    throw new Error(`Invalid search filters: ${result.errors.join('; ')}`);
  }

  return filters;
}

export function searchArtifactEntries(entries, filters = {}) {
  if (!Array.isArray(entries)) {
    return [];
  }

  const validated = validateSearchFilters(filters);

  if (!validated.ok) {
    return [];
  }

  let results = entries;

  if (typeof filters.kind === 'string') {
    results = results.filter((entry) => entry.kind === filters.kind);
  }

  if (typeof filters.goalId === 'string') {
    results = results.filter((entry) => entry.goal_id === filters.goalId);
  }

  if (typeof filters.taskId === 'string') {
    results = results.filter((entry) => entry.task_id === filters.taskId);
  }

  if (typeof filters.evidenceKind === 'string') {
    results = results.filter((entry) => entry.evidence_kind === filters.evidenceKind);
  }

  if (typeof filters.q === 'string') {
    const normalized = filters.q.toLowerCase();

    results = results.filter((entry) =>
      safeTextField(entry.artifact_ref).includes(normalized)
      || safeTextField(entry.goal_id).includes(normalized)
      || safeTextField(entry.task_id).includes(normalized)
      || safeTextField(entry.kind).includes(normalized)
      || safeTextField(entry.evidence_kind).includes(normalized)
      || entry.labels.some((label) =>
        typeof label === 'string' && safeTextField(label).includes(normalized)
      )
    );
  }

  return results;
}

export function buildSearchResponse(entries, filters, options = {}) {
  const {
    generatedAt = new Date().toISOString(),
    goalId = null,
    taskId = null
  } = options;

  const validated = validateSearchFilters(filters);

  if (!validated.ok) {
    return {
      contractName: SAFE_PREVIEW_SEARCH_CONTRACT_NAME,
      contractVersion: SAFE_PREVIEW_SEARCH_CONTRACT_VERSION,
      generatedAt,
      ok: false,
      errors: validated.errors,
      total: 0,
      entries: [],
      filters: { applied: {}, rejected: validated.errors },
      boundaries: searchBoundaries()
    };
  }

  const results = searchArtifactEntries(entries, filters);

  return {
    contractName: SAFE_PREVIEW_SEARCH_CONTRACT_NAME,
    contractVersion: SAFE_PREVIEW_SEARCH_CONTRACT_VERSION,
    generatedAt,
    ok: true,
    errors: [],
    total: results.length,
    entries: results,
    filterCounts: {
      total: entries.length,
      matched: results.length,
      kind: typeof filters.kind === 'string' ? filters.kind : null,
      evidenceKind: typeof filters.evidenceKind === 'string' ? filters.evidenceKind : null,
      goalId: typeof filters.goalId === 'string' ? filters.goalId : null,
      taskId: typeof filters.taskId === 'string' ? filters.taskId : null,
      query: typeof filters.q === 'string' ? filters.q : null
    },
    filters: {
      applied: Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== undefined && v !== null)
      ),
      rejected: []
    },
    boundaries: searchBoundaries()
  };
}

function searchBoundaries() {
  return {
    readOnly: true,
    dataSource: 'derived-artifact-index-only',
    canonicalSource: 'ArtifactStore is canonical, index is derived cache only',
    shellExecutionAvailable: false,
    modelInvocationAvailable: false,
    arbitraryPathReadAvailable: false,
    arbitraryCommandExecutionAvailable: false,
    gitWriteAvailable: false,
    mergeAvailable: false,
    pushAvailable: false,
    tagAvailable: false,
    publishAvailable: false,
    downloadAvailable: false,
    localFileOpenAvailable: false,
    selfApprovalAvailable: false
  };
}

function safeTextField(value) {
  if (typeof value !== 'string') return '';
  return value.toLowerCase();
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
