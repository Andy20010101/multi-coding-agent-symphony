import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  findWriteSetOverlaps,
  findWriteSetSubsetViolations
} from '../src/integrations/workspace-bridge.js';

describe('Workspace bridge write-set checks', () => {
  it('does not report nested-directory overlap for single-segment globs', () => {
    assert.deepEqual(findWriteSetOverlaps([
      {
        owner: 'docs-root',
        writeSet: ['docs/*.md']
      },
      {
        owner: 'docs-guide',
        writeSet: ['docs/guide/*']
      }
    ]), []);
  });

  it('reports overlap when a globstar claim covers a nested lane', () => {
    assert.deepEqual(findWriteSetOverlaps([
      {
        owner: 'docs-all',
        writeSet: ['docs/**']
      },
      {
        owner: 'docs-guide',
        writeSet: ['docs/guide/*']
      }
    ]), [{
      firstOwner: 'docs-all',
      secondOwner: 'docs-guide',
      firstPattern: 'docs/**',
      secondPattern: 'docs/guide/*'
    }]);
  });

  it('reports lane write-set claims outside the task write set', () => {
    assert.deepEqual(findWriteSetSubsetViolations({
      allowedWriteSet: ['docs/allowed.md', 'src/**'],
      claimedWriteSet: ['docs/outside.md', 'src/inside.js']
    }), ['docs/outside.md']);
  });
});
