import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { validateTaskSpec } from '../src/contracts.js';
import {
  buildGitHubPullRequestSummary,
  fetchGitHubPullRequestCiStatusArtifact,
  fetchGitHubPullRequestTaskSpec,
  fetchGitHubIssueTaskSpec,
  githubCheckRunsToCiStatusArtifact,
  githubPullRequestBranchWorkspacePolicy,
  githubIssueToTaskSpec,
  githubPullRequestToTaskSpec
} from '../src/trackers/github-intake.js';

describe('Phase 7 GitHub intake and CI feedback', () => {
  it('converts GitHub issue metadata into a valid TaskSpec', () => {
    const task = githubIssueToTaskSpec({
      repository: 'Andy20010101/multi-coding-agent-symphony',
      issue: {
        number: 42,
        title: 'Add release checklist',
        body: [
          'Create a release checklist for V1.',
          '',
          'Acceptance:',
          '- [ ] README links the checklist',
          '- [ ] smoke gates are documented'
        ].join('\n'),
        labels: [
          { name: 'priority:high' },
          { name: 'documentation' }
        ],
        createdAt: '2026-05-13T12:00:00.000Z'
      }
    });

    assert.equal(validateTaskSpec(task), task);
    assert.deepEqual(task, {
      id: 'github-issue-42',
      source: 'github',
      repository: 'Andy20010101/multi-coding-agent-symphony',
      objective: [
        'Add release checklist',
        '',
        'Create a release checklist for V1.',
        '',
        'Acceptance:',
        '- [ ] README links the checklist',
        '- [ ] smoke gates are documented'
      ].join('\n'),
      acceptance: [
        'README links the checklist',
        'smoke gates are documented'
      ],
      priority: 'high',
      createdAt: '2026-05-13T12:00:00.000Z',
      version: '1'
    });
  });

  it('converts GitHub pull request metadata into a read-only review TaskSpec', () => {
    const task = githubPullRequestToTaskSpec({
      repository: 'Andy20010101/multi-coding-agent-symphony',
      pullRequest: {
        number: 17,
        title: 'Document real CLI setup',
        body: [
          'Adds setup notes for Codex, Claude Code, and Kiro.',
          '',
          '- [x] docs mention smoke gates',
          '- [ ] reviewer verifies read-only flow'
        ].join('\n'),
        baseRefName: 'main',
        headRefName: 'docs/real-cli-setup',
        labels: ['priority:normal'],
        createdAt: '2026-05-13T13:00:00.000Z'
      }
    });

    assert.equal(validateTaskSpec(task), task);
    assert.deepEqual(task, {
      id: 'github-pr-17',
      source: 'github',
      repository: 'Andy20010101/multi-coding-agent-symphony',
      objective: [
        'Review PR #17: Document real CLI setup',
        '',
        'Adds setup notes for Codex, Claude Code, and Kiro.',
        '',
        '- [x] docs mention smoke gates',
        '- [ ] reviewer verifies read-only flow'
      ].join('\n'),
      constraints: [
        'mode:read-only-pr-review',
        'pr:17',
        'base:main',
        'head:docs/real-cli-setup'
      ],
      acceptance: [
        'docs mention smoke gates',
        'reviewer verifies read-only flow'
      ],
      priority: 'normal',
      createdAt: '2026-05-13T13:00:00.000Z',
      version: '1'
    });
  });

  it('normalizes GitHub check runs into a CI status artifact', () => {
    const artifact = githubCheckRunsToCiStatusArtifact({
      repository: 'Andy20010101/multi-coding-agent-symphony',
      ref: 'refs/pull/17/head',
      sha: 'abc123',
      checkRuns: [
        {
          name: 'test',
          status: 'completed',
          conclusion: 'success',
          detailsUrl: 'https://github.com/example/checks/1',
          startedAt: '2026-05-13T13:01:00.000Z',
          completedAt: '2026-05-13T13:02:00.000Z'
        },
        {
          name: 'lint',
          status: 'completed',
          conclusion: 'failure',
          htmlUrl: 'https://github.com/example/checks/2'
        },
        {
          name: 'deploy',
          status: 'queued',
          conclusion: null,
          detailsUrl: 'https://github.com/example/checks/3'
        }
      ]
    });

    assert.deepEqual(artifact, {
      version: '1',
      provider: 'github',
      repository: 'Andy20010101/multi-coding-agent-symphony',
      ref: 'refs/pull/17/head',
      sha: 'abc123',
      status: 'failed',
      conclusion: 'failure',
      summary: {
        total: 3,
        passed: 1,
        failed: 1,
        pending: 1
      },
      failingChecks: ['lint'],
      checks: [
        {
          name: 'test',
          status: 'completed',
          conclusion: 'success',
          url: 'https://github.com/example/checks/1',
          startedAt: '2026-05-13T13:01:00.000Z',
          completedAt: '2026-05-13T13:02:00.000Z'
        },
        {
          name: 'lint',
          status: 'completed',
          conclusion: 'failure',
          url: 'https://github.com/example/checks/2'
        },
        {
          name: 'deploy',
          status: 'queued',
          conclusion: 'pending',
          url: 'https://github.com/example/checks/3'
        }
      ]
    });
  });

  it('fetches a GitHub issue through an injected gh runner', async () => {
    const runner = new FakeRunner({
      exitCode: 0,
      stdout: JSON.stringify({
        number: 42,
        title: 'Add release checklist',
        body: '- [ ] release checklist exists',
        labels: [{ name: 'priority:high' }],
        createdAt: '2026-05-13T12:00:00.000Z'
      })
    });
    const task = await fetchGitHubIssueTaskSpec({
      repository: 'Andy20010101/multi-coding-agent-symphony',
      issueNumber: 42,
      runner
    });

    assert.deepEqual(runner.calls, [{
      executable: 'gh',
      args: [
        'issue',
        'view',
        '42',
        '--repo',
        'Andy20010101/multi-coding-agent-symphony',
        '--json',
        'number,title,body,labels,createdAt'
      ]
    }]);
    assert.equal(task.id, 'github-issue-42');
    assert.equal(task.priority, 'high');
    assert.deepEqual(task.acceptance, ['release checklist exists']);
  });

  it('fetches a GitHub pull request and CI status through an injected gh runner', async () => {
    const runner = new QueueRunner([
      {
        exitCode: 0,
        stdout: JSON.stringify({
          number: 17,
          title: 'Document real CLI setup',
          body: '- [ ] reviewer verifies read-only flow',
          baseRefName: 'main',
          headRefName: 'docs/real-cli-setup',
          headRefOid: 'abc123',
          labels: [{ name: 'priority:normal' }],
          createdAt: '2026-05-13T13:00:00.000Z'
        })
      },
      {
        exitCode: 0,
        stdout: JSON.stringify([
          {
            name: 'test',
            status: 'completed',
            conclusion: 'success',
            detailsUrl: 'https://github.com/example/checks/1'
          }
        ])
      }
    ]);

    const task = await fetchGitHubPullRequestTaskSpec({
      repository: 'Andy20010101/multi-coding-agent-symphony',
      pullRequestNumber: 17,
      runner
    });
    const ciStatus = await fetchGitHubPullRequestCiStatusArtifact({
      repository: 'Andy20010101/multi-coding-agent-symphony',
      ref: 'refs/pull/17/head',
      sha: 'abc123',
      runner
    });

    assert.deepEqual(runner.calls, [
      {
        executable: 'gh',
        args: [
          'pr',
          'view',
          '17',
          '--repo',
          'Andy20010101/multi-coding-agent-symphony',
          '--json',
          'number,title,body,labels,createdAt,baseRefName,headRefName,headRefOid'
        ]
      },
      {
        executable: 'gh',
        args: [
          'api',
          'repos/Andy20010101/multi-coding-agent-symphony/commits/abc123/check-runs',
          '--jq',
          '.check_runs'
        ]
      }
    ]);
    assert.equal(task.id, 'github-pr-17');
    assert.equal(ciStatus.status, 'passed');
    assert.equal(ciStatus.sha, 'abc123');
  });

  it('builds a PR summary artifact with task, CI status, and artifact refs', () => {
    const task = githubPullRequestToTaskSpec({
      repository: 'Andy20010101/multi-coding-agent-symphony',
      pullRequest: {
        number: 17,
        title: 'Document real CLI setup',
        body: '- [ ] reviewer verifies read-only flow',
        baseRefName: 'main',
        headRefName: 'docs/real-cli-setup',
        labels: [{ name: 'priority:normal' }],
        createdAt: '2026-05-13T13:00:00.000Z'
      }
    });
    const ciStatus = githubCheckRunsToCiStatusArtifact({
      repository: 'Andy20010101/multi-coding-agent-symphony',
      ref: 'refs/pull/17/head',
      sha: 'abc123',
      checkRuns: [
        {
          name: 'test',
          status: 'completed',
          conclusion: 'success',
          detailsUrl: 'https://github.com/example/checks/1'
        },
        {
          name: 'lint',
          status: 'completed',
          conclusion: 'failure',
          detailsUrl: 'https://github.com/example/checks/2'
        }
      ]
    });

    const summary = buildGitHubPullRequestSummary({
      taskSpec: task,
      ciStatusArtifact: ciStatus,
      artifactRefs: [
        {
          taskId: 'github-pr-17',
          artifactId: 'pr-ci-status',
          label: 'CI status'
        },
        {
          taskId: 'github-pr-17',
          artifactId: 'review-evidence',
          label: 'Review evidence'
        }
      ]
    });

    assert.deepEqual(summary, {
      version: '1',
      provider: 'github',
      repository: 'Andy20010101/multi-coding-agent-symphony',
      pullRequestNumber: 17,
      task: {
        id: 'github-pr-17',
        objective: 'Review PR #17: Document real CLI setup\n\n- [ ] reviewer verifies read-only flow',
        acceptance: ['reviewer verifies read-only flow'],
        constraints: [
          'mode:read-only-pr-review',
          'pr:17',
          'base:main',
          'head:docs/real-cli-setup'
        ]
      },
      ci: {
        status: 'failed',
        conclusion: 'failure',
        sha: 'abc123',
        summary: {
          total: 2,
          passed: 1,
          failed: 1,
          pending: 0
        },
        failingChecks: ['lint']
      },
      artifactRefs: [
        {
          taskId: 'github-pr-17',
          artifactId: 'pr-ci-status',
          label: 'CI status'
        },
        {
          taskId: 'github-pr-17',
          artifactId: 'review-evidence',
          label: 'Review evidence'
        }
      ],
      markdown: [
        'Task: github-pr-17',
        'CI: failed (failure)',
        'Failing checks: lint',
        'Artifacts: github-pr-17/pr-ci-status, github-pr-17/review-evidence'
      ].join('\n')
    });
  });

  it('builds deterministic safe PR branch and workspace names', () => {
    const policy = githubPullRequestBranchWorkspacePolicy({
      repository: 'Andy20010101/Multi-Coding-Agent-Symphony',
      pullRequestNumber: 17,
      headRefName: 'Feature/Fix CI Review..'
    });

    assert.deepEqual(policy, {
      version: '1',
      provider: 'github',
      repository: 'Andy20010101/Multi-Coding-Agent-Symphony',
      pullRequestNumber: 17,
      repositorySegment: 'andy20010101-multi-coding-agent-symphony',
      headRefSegment: 'feature-fix-ci-review',
      branchName: 'mcas-pr-17-feature-fix-ci-review',
      workspaceName: 'andy20010101-multi-coding-agent-symphony-github-pr-17-feature-fix-ci-review'
    });
    assert.doesNotMatch(policy.branchName, /[/.]/);
    assert.doesNotMatch(policy.workspaceName, /[/.]/);
  });
});

class FakeRunner {
  constructor(result) {
    this.result = result;
    this.calls = [];
  }

  async run(invocation) {
    this.calls.push(invocation);
    return this.result;
  }
}

class QueueRunner {
  constructor(results) {
    this.results = [...results];
    this.calls = [];
  }

  async run(invocation) {
    this.calls.push(invocation);
    return this.results.shift();
  }
}
