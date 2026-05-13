import { validateTaskSpec } from '../contracts.js';
import { NodeProcessRunner } from '../process-runner.js';

const ISSUE_JSON_FIELDS = 'number,title,body,labels,createdAt';
const PR_JSON_FIELDS = 'number,title,body,labels,createdAt,baseRefName,headRefName,headRefOid';

export async function fetchGitHubIssueTaskSpec({
  repository,
  issueNumber,
  runner = new NodeProcessRunner()
}) {
  assertNonEmptyString(repository, 'repository');
  assertPositiveInteger(issueNumber, 'issueNumber');

  if (!runner || typeof runner.run !== 'function') {
    throw new TypeError('runner must provide run');
  }

  const result = await runner.run({
    executable: 'gh',
    args: [
      'issue',
      'view',
      String(issueNumber),
      '--repo',
      repository,
      '--json',
      ISSUE_JSON_FIELDS
    ]
  });

  if (result.exitCode !== 0) {
    throw new Error(`gh issue view failed with exit code ${result.exitCode}: ${result.stderr ?? ''}`);
  }

  return githubIssueToTaskSpec({
    repository,
    issue: parseJson(result.stdout, 'gh issue view stdout')
  });
}

export async function fetchGitHubPullRequestTaskSpec({
  repository,
  pullRequestNumber,
  runner = new NodeProcessRunner()
}) {
  assertNonEmptyString(repository, 'repository');
  assertPositiveInteger(pullRequestNumber, 'pullRequestNumber');

  if (!runner || typeof runner.run !== 'function') {
    throw new TypeError('runner must provide run');
  }

  const result = await runner.run({
    executable: 'gh',
    args: [
      'pr',
      'view',
      String(pullRequestNumber),
      '--repo',
      repository,
      '--json',
      PR_JSON_FIELDS
    ]
  });

  if (result.exitCode !== 0) {
    throw new Error(`gh pr view failed with exit code ${result.exitCode}: ${result.stderr ?? ''}`);
  }

  return githubPullRequestToTaskSpec({
    repository,
    pullRequest: parseJson(result.stdout, 'gh pr view stdout')
  });
}

export async function fetchGitHubPullRequestCiStatusArtifact({
  repository,
  ref,
  sha,
  runner = new NodeProcessRunner()
}) {
  assertNonEmptyString(repository, 'repository');
  assertNonEmptyString(ref, 'ref');
  assertNonEmptyString(sha, 'sha');

  if (!runner || typeof runner.run !== 'function') {
    throw new TypeError('runner must provide run');
  }

  const result = await runner.run({
    executable: 'gh',
    args: [
      'api',
      `repos/${repository}/commits/${sha}/check-runs`,
      '--jq',
      '.check_runs'
    ]
  });

  if (result.exitCode !== 0) {
    throw new Error(`gh api check-runs failed with exit code ${result.exitCode}: ${result.stderr ?? ''}`);
  }

  return githubCheckRunsToCiStatusArtifact({
    repository,
    ref,
    sha,
    checkRuns: parseJson(result.stdout, 'gh api check-runs stdout')
  });
}

export function githubIssueToTaskSpec({ repository, issue }) {
  assertNonEmptyString(repository, 'repository');

  if (issue === null || typeof issue !== 'object' || Array.isArray(issue)) {
    throw new TypeError('issue must be an object');
  }

  assertPositiveInteger(issue.number, 'issue.number');

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

export function githubPullRequestToTaskSpec({ repository, pullRequest }) {
  assertNonEmptyString(repository, 'repository');

  if (pullRequest === null || typeof pullRequest !== 'object' || Array.isArray(pullRequest)) {
    throw new TypeError('pullRequest must be an object');
  }

  assertPositiveInteger(pullRequest.number, 'pullRequest.number');

  const baseRef = pullRequest.baseRefName ?? pullRequest.base?.ref;
  const headRef = pullRequest.headRefName ?? pullRequest.head?.ref;
  const task = {
    id: `github-pr-${pullRequest.number}`,
    source: 'github',
    repository,
    objective: buildPullRequestObjective(pullRequest),
    constraints: [
      'mode:read-only-pr-review',
      `pr:${pullRequest.number}`,
      `base:${baseRef}`,
      `head:${headRef}`
    ],
    acceptance: extractAcceptance(pullRequest.body),
    priority: extractPriority(pullRequest.labels),
    createdAt: pullRequest.createdAt ?? pullRequest.created_at,
    version: '1'
  };

  assertNonEmptyString(baseRef, 'pullRequest.baseRefName');
  assertNonEmptyString(headRef, 'pullRequest.headRefName');
  validateTaskSpec(task);

  return task;
}

export function githubCheckRunsToCiStatusArtifact({
  repository,
  ref,
  sha,
  checkRuns
}) {
  assertNonEmptyString(repository, 'repository');
  assertNonEmptyString(ref, 'ref');
  assertNonEmptyString(sha, 'sha');

  if (!Array.isArray(checkRuns)) {
    throw new TypeError('checkRuns must be an array');
  }

  const checks = checkRuns.map(normalizeCheckRun);
  const failingChecks = checks
    .filter((check) => check.conclusion === 'failure')
    .map((check) => check.name);
  const pending = checks.filter((check) => check.conclusion === 'pending').length;
  const failed = failingChecks.length;
  const passed = checks.filter((check) => check.conclusion === 'success').length;

  return {
    version: '1',
    provider: 'github',
    repository,
    ref,
    sha,
    status: failed > 0 ? 'failed' : pending > 0 ? 'pending' : 'passed',
    conclusion: failed > 0 ? 'failure' : pending > 0 ? 'pending' : 'success',
    summary: {
      total: checks.length,
      passed,
      failed,
      pending
    },
    failingChecks,
    checks
  };
}

function buildObjective(issue) {
  assertNonEmptyString(issue.title, 'issue.title');

  const body = typeof issue.body === 'string' ? issue.body.trim() : '';

  return [issue.title.trim(), body].filter(Boolean).join('\n\n');
}

function buildPullRequestObjective(pullRequest) {
  assertNonEmptyString(pullRequest.title, 'pullRequest.title');

  const body = typeof pullRequest.body === 'string' ? pullRequest.body.trim() : '';

  return [`Review PR #${pullRequest.number}: ${pullRequest.title.trim()}`, body].filter(Boolean).join('\n\n');
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

function normalizeCheckRun(checkRun) {
  if (checkRun === null || typeof checkRun !== 'object' || Array.isArray(checkRun)) {
    throw new TypeError('checkRun must be an object');
  }

  assertNonEmptyString(checkRun.name, 'checkRun.name');
  assertNonEmptyString(checkRun.status, 'checkRun.status');

  const url = checkRun.detailsUrl ?? checkRun.details_url ?? checkRun.htmlUrl ?? checkRun.html_url;

  assertNonEmptyString(url, 'checkRun.url');

  const normalized = {
    name: checkRun.name,
    status: checkRun.status,
    conclusion: normalizeConclusion(checkRun),
    url
  };

  if (checkRun.startedAt ?? checkRun.started_at) {
    normalized.startedAt = checkRun.startedAt ?? checkRun.started_at;
  }

  if (checkRun.completedAt ?? checkRun.completed_at) {
    normalized.completedAt = checkRun.completedAt ?? checkRun.completed_at;
  }

  return normalized;
}

function normalizeConclusion(checkRun) {
  if (typeof checkRun.conclusion === 'string' && checkRun.conclusion.trim() !== '') {
    return checkRun.conclusion;
  }

  return checkRun.status === 'completed' ? 'success' : 'pending';
}

function parseJson(value, field) {
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new TypeError(`${field} must be valid JSON: ${error.message}`);
  }
}

function assertNonEmptyString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${field} must be a non-empty string`);
  }
}

function assertPositiveInteger(value, field) {
  if (!Number.isInteger(value) || value < 1) {
    throw new TypeError(`${field} must be a positive integer`);
  }
}
