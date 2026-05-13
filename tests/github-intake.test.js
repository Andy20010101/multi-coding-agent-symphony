import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { validateTaskSpec } from '../src/contracts.js';
import {
  githubCheckRunsToCiStatusArtifact,
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
});
