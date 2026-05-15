import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { HarnessEvidenceSink } from '../src/integrations/harness-evidence-sink.js';

describe('HarnessEvidenceSink', () => {
  it('writes an evidence map, verification markdown, and summary for a Harness run', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-harness-sink-'));

    try {
      const sink = new HarnessEvidenceSink({
        rootDirectory: root,
        runId: 'fixture-run'
      });

      const paths = await sink.write({
        taskPacket: {
          id: 'task.scaffold',
          verification: {
            commands: ['pnpm test']
          }
        },
        taskSpec: {
          id: 'task.scaffold'
        },
        workflowResult: {
          status: 'passed',
          commands: [{
            command: 'implement',
            adapterId: 'codex',
            artifactId: 'implement-evidence',
            runArtifactId: 'implement-run',
            routeDecisionArtifactId: 'implement-route-decision',
            verification: {
              status: 'passed',
              reason: 'checks-passed'
            }
          }]
        },
        harnessVerification: {
          status: 'passed',
          reason: 'checks-passed',
          expectedChecks: ['pnpm test'],
          writeSetViolations: [],
          missingExpectedChecks: []
        },
        runtime: {
          artifactDirectory: '/tmp/mcas/artifacts',
          eventDirectory: '/tmp/mcas/events',
          workspaceDirectory: '/tmp/mcas/workspaces',
          sessionId: 'harness-session'
        },
        taskPacketPath: '/tmp/taskpacket.json'
      });

      const evidenceMap = JSON.parse(await readFile(paths.evidenceMapPath, 'utf8'));
      const summary = JSON.parse(await readFile(paths.summaryPath, 'utf8'));
      const verification = await readFile(paths.verificationPath, 'utf8');

      assert.deepEqual(paths, {
        evidenceMapPath: join(root, 'runs', 'fixture-run', 'evidence-map.json'),
        verificationPath: join(root, 'runs', 'fixture-run', 'verification.md'),
        summaryPath: join(root, 'runs', 'fixture-run', 'summary.json')
      });
      assert.equal(evidenceMap.version, '1');
      assert.equal(evidenceMap.runId, 'fixture-run');
      assert.equal(evidenceMap.taskId, 'task.scaffold');
      assert.deepEqual(evidenceMap.expectedChecks, ['pnpm test']);
      assert.deepEqual(evidenceMap.artifacts, [{
        command: 'implement',
        adapterId: 'codex',
        artifactId: 'implement-evidence',
        runArtifactId: 'implement-run',
        routeDecisionArtifactId: 'implement-route-decision',
        verificationStatus: 'passed'
      }]);
      assert.deepEqual(evidenceMap.stages, [{
        stage: 'implement',
        command: 'implement',
        adapterId: 'codex',
        artifactId: 'implement-evidence',
        runArtifactId: 'implement-run',
        routeDecisionArtifactId: 'implement-route-decision',
        verificationStatus: 'passed',
        verificationReason: 'checks-passed'
      }]);
      assert.deepEqual(evidenceMap.verificationMap, [{
        stage: 'implement',
        command: 'implement',
        artifactId: 'implement-evidence',
        verificationStatus: 'passed',
        verificationReason: 'checks-passed'
      }]);
      assert.equal(summary.status, 'passed');
      assert.deepEqual(summary.verificationMap, evidenceMap.verificationMap);
      assert.equal(summary.taskPacketPath, '/tmp/taskpacket.json');
      assert.match(verification, /Task: task.scaffold/);
      assert.match(verification, /Status: passed/);
      assert.match(verification, /Stage: implement/);
      assert.match(verification, /implement-evidence/);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
