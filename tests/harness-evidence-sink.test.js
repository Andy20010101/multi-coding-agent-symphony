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
        adapterId: 'codex',
        artifactId: 'implement-evidence',
        runArtifactId: 'implement-run',
        routeDecisionArtifactId: 'implement-route-decision',
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

  it('preserves competitive-patch candidate evidence and verification maps', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-harness-sink-competitive-'));

    try {
      const sink = new HarnessEvidenceSink({
        rootDirectory: root,
        runId: 'fixture-competitive-patch'
      });

      const paths = await sink.write({
        taskPacket: {
          id: 'task.competitive-patch',
          verification: {
            commands: ['pnpm test']
          }
        },
        taskSpec: {
          id: 'task.competitive-patch'
        },
        workflowResult: {
          status: 'passed',
          mode: 'competitive-patch',
          completionGate: 'verifier',
          selectedCandidateId: 'candidate-b',
          commands: [
            competitiveCandidateCommand({
              candidateId: 'candidate-a',
              agentId: 'codex-candidate-a',
              verificationStatus: 'failed',
              verificationReason: 'check-failed',
              selected: false,
              rejectedReason: 'verifier failed: check-failed'
            }),
            competitiveCandidateCommand({
              candidateId: 'candidate-b',
              agentId: 'codex-candidate-b',
              verificationStatus: 'passed',
              verificationReason: 'checks-passed',
              selected: true
            })
          ]
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
        taskPacketPath: '/tmp/competitive-patch-taskpacket.json'
      });

      const evidenceMap = JSON.parse(await readFile(paths.evidenceMapPath, 'utf8'));
      const summary = JSON.parse(await readFile(paths.summaryPath, 'utf8'));
      const verification = await readFile(paths.verificationPath, 'utf8');

      assert.equal(evidenceMap.workflowMode, 'competitive-patch');
      assert.equal(evidenceMap.completionGate, 'verifier');
      assert.equal(evidenceMap.selectedCandidateId, 'candidate-b');
      assert.deepEqual(evidenceMap.artifacts, [
        {
          command: 'implement',
          adapterId: 'codex',
          candidateId: 'candidate-a',
          agentId: 'codex-candidate-a',
          artifactId: 'implement-candidate-a-evidence',
          patchArtifactId: 'competitive-patch-candidate-a-patch',
          commandArtifactId: 'implement-candidate-a-run',
          runArtifactId: 'implement-candidate-a-run',
          routeDecisionArtifactId: 'implement-candidate-a-route-decision',
          verificationStatus: 'failed',
          selected: false,
          rejectedReason: 'verifier failed: check-failed'
        },
        {
          command: 'implement',
          adapterId: 'codex',
          candidateId: 'candidate-b',
          agentId: 'codex-candidate-b',
          artifactId: 'implement-candidate-b-evidence',
          patchArtifactId: 'competitive-patch-candidate-b-patch',
          commandArtifactId: 'implement-candidate-b-run',
          runArtifactId: 'implement-candidate-b-run',
          routeDecisionArtifactId: 'implement-candidate-b-route-decision',
          verificationStatus: 'passed',
          selected: true
        }
      ]);
      assert.deepEqual(evidenceMap.stages.map((stage) => ({
        stage: stage.stage,
        role: stage.role,
        candidateId: stage.candidateId,
        agentId: stage.agentId,
        adapterId: stage.adapterId,
        patchArtifactId: stage.patchArtifactId,
        commandArtifactId: stage.commandArtifactId,
        routeDecisionArtifactId: stage.routeDecisionArtifactId,
        verificationStatus: stage.verificationStatus,
        verificationReason: stage.verificationReason,
        selected: stage.selected,
        rejectedReason: stage.rejectedReason
      })), [
        {
          stage: 'candidate:candidate-a',
          role: 'competitive-candidate',
          candidateId: 'candidate-a',
          agentId: 'codex-candidate-a',
          adapterId: 'codex',
          patchArtifactId: 'competitive-patch-candidate-a-patch',
          commandArtifactId: 'implement-candidate-a-run',
          routeDecisionArtifactId: 'implement-candidate-a-route-decision',
          verificationStatus: 'failed',
          verificationReason: 'check-failed',
          selected: false,
          rejectedReason: 'verifier failed: check-failed'
        },
        {
          stage: 'candidate:candidate-b',
          role: 'competitive-candidate',
          candidateId: 'candidate-b',
          agentId: 'codex-candidate-b',
          adapterId: 'codex',
          patchArtifactId: 'competitive-patch-candidate-b-patch',
          commandArtifactId: 'implement-candidate-b-run',
          routeDecisionArtifactId: 'implement-candidate-b-route-decision',
          verificationStatus: 'passed',
          verificationReason: 'checks-passed',
          selected: true,
          rejectedReason: undefined
        }
      ]);
      assert.deepEqual(evidenceMap.verificationMap.map(stripUndefinedForAssertion), evidenceMap.stages.map((stage) => stripUndefinedForAssertion({
        stage: stage.stage,
        candidateId: stage.candidateId,
        agentId: stage.agentId,
        command: stage.command,
        adapterId: stage.adapterId,
        patchArtifactId: stage.patchArtifactId,
        commandArtifactId: stage.commandArtifactId,
        artifactId: stage.artifactId,
        runArtifactId: stage.runArtifactId,
        routeDecisionArtifactId: stage.routeDecisionArtifactId,
        verificationStatus: stage.verificationStatus,
        verificationReason: stage.verificationReason,
        selected: stage.selected,
        rejectedReason: stage.rejectedReason
      })));
      assert.equal(summary.completionGate, 'verifier');
      assert.equal(summary.selectedCandidateId, 'candidate-b');
      assert.deepEqual(summary.expectedChecks, ['pnpm test']);
      assert.deepEqual(summary.verificationMap, evidenceMap.verificationMap);
      assert.match(verification, /Run fixture-competitive-patch/);
      assert.match(verification, /Expected checks: pnpm test/);
      assert.match(verification, /Workflow mode: competitive-patch/);
      assert.match(verification, /Completion gate: verifier/);
      assert.match(verification, /Stage: candidate:candidate-a/);
      assert.match(verification, /competitive-patch-candidate-a-patch/);
      assert.match(verification, /verifier failed: check-failed/);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});

function competitiveCandidateCommand({
  candidateId,
  agentId,
  verificationStatus,
  verificationReason,
  selected,
  rejectedReason
}) {
  return {
    stage: `candidate:${candidateId}`,
    role: 'competitive-candidate',
    candidateId,
    agentId,
    command: 'implement',
    adapterId: 'codex',
    artifactId: `implement-${candidateId}-evidence`,
    patchArtifactId: `competitive-patch-${candidateId}-patch`,
    commandArtifactId: `implement-${candidateId}-run`,
    runArtifactId: `implement-${candidateId}-run`,
    routeDecisionArtifactId: `implement-${candidateId}-route-decision`,
    selected,
    ...(rejectedReason ? { rejectedReason } : {}),
    verification: {
      status: verificationStatus,
      reason: verificationReason
    }
  };
}

function stripUndefinedForAssertion(value) {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined));
}
