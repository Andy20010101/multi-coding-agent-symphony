import { validateTaskSpec } from '../contracts.js';

export function githubIssueToTaskSpec({ repository, issue }) {
  assertNonEmptyString(repository, 'repository');

  if (issue === null || typeof issue !== 'object' || Array.isArray(issue)) {
    throw new TypeError('issue must be an object');
  }

  const task = {
    id: `github-issue-${issue.number}`,
    source: 'github',
    repository,
    objective: buildObjective(issue),
    acceptance: extractAcceptance(issue.body),
    priority: extractPriority(issue.labels),
    createdAt: issue.createdAt ?? issue.created_at,
    version: '1'
  };

  validateTaskSpec(task);

  return task;
}

function buildObjective(issue) {
  assertNonEmptyString(issue.title, 'issue.title');

  const body = typeof issue.body === 'string' ? issue.body.trim() : '';

  return [issue.title.trim(), body].filter(Boolean).join('\n\n');
}

function extractAcceptance(body) {
  if (typeof body !== 'string') {
    return ['Issue is resolved and verifier evidence is written'];
  }

  const acceptance = body
    .split(/\r?\n/)
    .map((line) => line.match(/^\s*-\s*\[[ xX]\]\s+(.+?)\s*$/)?.[1])
    .filter((item) => typeof item === 'string' && item.trim() !== '')
    .map((item) => item.trim());

  return acceptance.length > 0
    ? acceptance
    : ['Issue is resolved and verifier evidence is written'];
}

function extractPriority(labels) {
  if (!Array.isArray(labels)) {
    return 'normal';
  }

  const names = labels
    .map((label) => typeof label === 'string' ? label : label?.name)
    .filter((name) => typeof name === 'string')
    .map((name) => name.toLowerCase());

  if (names.includes('priority:high') || names.includes('priority/high')) {
    return 'high';
  }

  if (names.includes('priority:low') || names.includes('priority/low')) {
    return 'low';
  }

  return 'normal';
}

function assertNonEmptyString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${field} must be a non-empty string`);
  }
}
