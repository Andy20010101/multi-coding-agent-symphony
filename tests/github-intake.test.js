import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { validateTaskSpec } from '../src/contracts.js';
import { githubIssueToTaskSpec } from '../src/trackers/github-intake.js';

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
});
