import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { ArtifactStore } from '../src/artifact-store.js';
import { SessionEventLog } from '../src/session-event-log.js';

describe('Phase 9 security, redaction, and policy enforcement', () => {
  it('redacts secret-looking artifact output before persistence', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-security-artifacts-'));

    try {
      const store = new ArtifactStore(root);
      const artifact = {
        command: 'qa',
        stdout: 'GITHUB_TOKEN=ghp_abcdefghijklmnopqrstuvwxyz1234567890 read /repo/.env.local',
        nested: {
          auth: 'Authorization: Bearer sk-abcdefghijklmnopqrstuvwxyz123456'
        },
        version: '1'
      };

      await store.writeArtifact('task-123', 'qa-evidence', artifact);

      const raw = await readFile(join(root, 'task-123', 'qa-evidence.json'), 'utf8');
      const stored = await store.readArtifact('task-123', 'qa-evidence');

      assert.doesNotMatch(raw, /ghp_abcdefghijklmnopqrstuvwxyz1234567890/);
      assert.doesNotMatch(raw, /sk-abcdefghijklmnopqrstuvwxyz123456/);
      assert.doesNotMatch(raw, /\.env/);
      assert.match(raw, /\[REDACTED_TOKEN\]/);
      assert.match(raw, /\[REDACTED_PATH\]/);
      assert.equal(stored.stdout, 'GITHUB_TOKEN=[REDACTED_TOKEN] read [REDACTED_PATH]');
      assert.equal(stored.nested.auth, 'Authorization: Bearer [REDACTED_TOKEN]');
      assert.equal(
        artifact.stdout,
        'GITHUB_TOKEN=ghp_abcdefghijklmnopqrstuvwxyz1234567890 read /repo/.env.local'
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('redacts secret-looking session event payloads before persistence', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-security-events-'));

    try {
      const log = new SessionEventLog(root, 'session-123');
      const appended = await log.append({
        id: 'evt-1',
        type: 'tool.observed',
        timestamp: '2026-05-13T00:00:00.000Z',
        actor: 'adapter',
        payload: {
          output: 'curl -H "Authorization: Bearer sk-abcdefghijklmnopqrstuvwxyz123456" /tmp/project/.env',
          files: ['/tmp/project/.env', 'src/index.js']
        },
        version: '1'
      });
      const raw = await readFile(join(root, 'session-123.json'), 'utf8');
      const events = await log.readAll();

      assert.doesNotMatch(raw, /sk-abcdefghijklmnopqrstuvwxyz123456/);
      assert.doesNotMatch(raw, /\.env/);
      assert.equal(
        appended.payload.output,
        'curl -H "Authorization: Bearer [REDACTED_TOKEN]" [REDACTED_PATH]'
      );
      assert.deepEqual(events[0].payload.files, ['[REDACTED_PATH]', 'src/index.js']);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
