import { GoalEventPlanPreviewError } from './errors.js';

export function assertOnlySearchParams(searchParams, allowedKeys) {
  const allowed = new Set(allowedKeys);
  const unsupported = Array.from(searchParams.keys()).filter((key) => !allowed.has(key));

  if (unsupported.length > 0) {
    throw new GoalEventPlanPreviewError(
      'invalid-goal-preview-request',
      'Goal event plan preview received unsupported query parameters.',
      { parameter: unsupported[0] }
    );
  }

  for (const [key, values] of groupSearchParamValues(searchParams)) {
    if (key !== 'evidenceRef' && values.length > 1) {
      throw new GoalEventPlanPreviewError(
        'invalid-goal-preview-request',
        'Goal event plan preview accepts repeated values only for evidenceRef.',
        { parameter: key }
      );
    }
  }

  for (const blockedKey of ['confirm', 'planHash', 'plan-hash', 'dryRun', 'dry-run']) {
    if (searchParams.has(blockedKey)) {
      throw new GoalEventPlanPreviewError(
        'invalid-goal-preview-request',
        'Goal event plan preview is dry-run only and does not accept confirm or plan hash parameters.',
        { parameter: blockedKey }
      );
    }
  }
}

export function requiredSingleSearchParam(searchParams, key) {
  const value = optionalSingleSearchParam(searchParams, key);

  if (value === undefined) {
    throw new GoalEventPlanPreviewError(
      'invalid-goal-preview-request',
      `Goal event plan preview requires ${key}.`,
      { parameter: key }
    );
  }

  return value;
}

export function optionalSingleSearchParam(searchParams, key) {
  const values = searchParams.getAll(key);

  if (values.length === 0) {
    return undefined;
  }

  if (values.length > 1) {
    throw new GoalEventPlanPreviewError(
      'invalid-goal-preview-request',
      'Goal event plan preview received repeated single-value query parameters.',
      { parameter: key }
    );
  }

  const trimmed = values[0].trim();

  if (trimmed === '') {
    throw new GoalEventPlanPreviewError(
      'invalid-goal-preview-request',
      'Goal event plan preview query parameters must be non-empty.',
      { parameter: key }
    );
  }

  return trimmed;
}

export function groupSearchParamValues(searchParams) {
  const groups = new Map();

  for (const [key, value] of searchParams.entries()) {
    groups.set(key, [...(groups.get(key) ?? []), value]);
  }

  return groups.entries();
}

export function safeDecodePathSegment(value) {
  try {
    return {
      ok: true,
      value: decodeURIComponent(value)
    };
  } catch {
    return {
      ok: false,
      value
    };
  }
}

export function isUnsafeGoalRouteSegment(value) {
  return value === '' || value.includes('/') || value.includes('\\') || value.includes('..');
}

export function isUnsafeArtifactRouteSegment(value) {
  return value === '' || value.includes('/') || value.includes('\\') || value.includes('..');
}

export function isUnsafeHandoffRef(ref) {
  return ref === '' || ref.includes('/') || ref.includes('\\') || ref.includes('..');
}

export function hasSearchParams(searchParams) {
  return Array.from(searchParams.keys()).length > 0;
}
