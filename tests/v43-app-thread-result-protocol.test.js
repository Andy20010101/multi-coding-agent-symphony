import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  ACCEPTED_TERMINAL_EVENTS_BY_ROLE,
  RESULT_BLOCK_END,
  RESULT_BLOCK_START,
  acceptedTerminalEventsForRole,
  consumeParsedResult,
  decideResultProtocolAction,
  parseChildResultBlock,
  readThreadThroughStableAdapter,
  recordThreadBinding,
  resolveActiveThreadResultTick
} from '../src/symphony/app-thread-result-protocol.js';

const EXPECTED = Object.freeze({
  goalId: 'v43-goal-supervisor-stabilization',
  taskId: 'task-1',
  role: 'worker',
  threadId: 'thread-task-1-worker',
  branch: 'v43-task-1-app-thread-result-protocol',
  worktree: '/Users/andy/.codex/worktrees/v43-task-1-app-thread-result-protocol'
});

describe('v43 app thread result protocol', () => {
  it('uses the stable readThread(threadId) call shape and records it for replay', async () => {
    const calls = [];
    const result = await readThreadThroughStableAdapter({
      threadId: EXPECTED.threadId,
      requestedAt: '2026-06-07T00:00:00.000Z',
      readThread: (...args) => {
        calls.push(args);
        return {
          status: 'readable',
          id: EXPECTED.threadId
        };
      }
    });

    assert.deepEqual(calls, [[EXPECTED.threadId]]);
    assert.equal(result.status, 'readable');
    assert.equal(result.readable, true);
    assert.deepEqual(result.capability.callShape, {
      threadId: EXPECTED.threadId
    });
    assert.deepEqual(result.capability.optionalParameters, []);
  });

  it('rejects duplicate record-thread bindings and unreadable thread ids before activation', () => {
    const binding = threadBinding();
    const readable = readableThread(EXPECTED.threadId);
    const first = recordThreadBinding({
      bindings: [],
      binding,
      readback: readable
    });
    const duplicate = recordThreadBinding({
      bindings: [first.record],
      binding: {
        ...binding,
        requestId: 'request-duplicate'
      },
      readback: readable
    });
    const unreadable = recordThreadBinding({
      bindings: [],
      binding: {
        ...binding,
        requestId: 'request-unreadable',
        threadId: 'thread-unreadable'
      },
      readback: {
        status: 'adapter-error',
        readable: false
      }
    });

    assert.equal(first.accepted, true);
    assert.equal(first.record.active, true);
    assert.equal(duplicate.accepted, false);
    assert.equal(duplicate.reason, 'duplicate-thread-binding');
    assert.equal(duplicate.active, false);
    assert.equal(unreadable.accepted, false);
    assert.equal(unreadable.reason, 'thread-readback-unreadable');
    assert.equal(unreadable.active, false);
  });

  it('rejects readable thread readbacks that are not bound to the requested thread identity', () => {
    const binding = threadBinding();
    const missingCapability = recordThreadBinding({
      bindings: [],
      binding,
      readback: {
        status: 'readable',
        readable: true,
        response: {
          id: EXPECTED.threadId
        }
      }
    });
    const mismatchedCapability = recordThreadBinding({
      bindings: [],
      binding,
      readback: readableThread('thread-from-another-capability', EXPECTED.threadId)
    });
    const mismatchedResponse = recordThreadBinding({
      bindings: [],
      binding,
      readback: readableThread(EXPECTED.threadId, 'thread-from-another-response')
    });

    assert.equal(missingCapability.accepted, false);
    assert.equal(missingCapability.active, false);
    assert.equal(missingCapability.reason, 'thread-readback-capability-mismatch');
    assert.equal(mismatchedCapability.accepted, false);
    assert.equal(mismatchedCapability.reason, 'thread-readback-capability-mismatch');
    assert.equal(mismatchedResponse.accepted, false);
    assert.equal(mismatchedResponse.reason, 'thread-readback-response-mismatch');
  });

  it('keeps app notLoaded as a non-mutating wait state', async () => {
    const readback = await readThreadThroughStableAdapter({
      threadId: EXPECTED.threadId,
      readThread: () => ({
        status: 'notLoaded'
      })
    });
    const binding = recordThreadBinding({
      bindings: [],
      binding: threadBinding(),
      readback
    });
    const tick = resolveActiveThreadResultTick({
      activeThreadReadback: readback
    });

    assert.equal(readback.status, 'notLoaded');
    assert.equal(readback.waitState, true);
    assert.equal(readback.mutatesState, false);
    assert.equal(binding.accepted, false);
    assert.equal(binding.reason, 'thread-readback-not-loaded');
    assert.equal(tick.state, 'waiting-active-child-not-loaded');
    assert.equal(tick.mutatesState, false);
  });

  it('consumes a pending valid recorded result before consulting the active thread reader', () => {
    const parsed = parseChildResultBlock({
      text: resultBlock(validPayload()),
      expected: EXPECTED
    });
    const tick = resolveActiveThreadResultTick({
      pendingResults: [parsed],
      activeThreadReadback: {
        status: 'notLoaded',
        readable: false
      }
    });

    assert.equal(parsed.valid, true);
    assert.equal(tick.state, 'pending-result-ready');
    assert.equal(tick.consultActiveThread, false);
    assert.equal(tick.action.kind, 'record-result');
  });

  it('parses valid result blocks, normalizes markdown fences, and rejects malformed or wrong-context blocks', () => {
    const valid = parseChildResultBlock({
      text: resultBlock(validPayload()),
      expected: EXPECTED
    });
    const fenced = parseChildResultBlock({
      text: `\`\`\`json\n${JSON.stringify(validPayload())}\n\`\`\``,
      expected: EXPECTED
    });
    const invalidJson = parseChildResultBlock({
      text: `${RESULT_BLOCK_START}\n{"goalId":\n${RESULT_BLOCK_END}`,
      expected: EXPECTED
    });
    const missingField = parseChildResultBlock({
      text: resultBlock({
        ...validPayload(),
        evidenceRef: undefined
      }),
      expected: EXPECTED
    });
    const wrongThread = parseChildResultBlock({
      text: resultBlock({
        ...validPayload(),
        threadId: 'thread-from-another-context'
      }),
      expected: EXPECTED
    });

    assert.equal(valid.valid, true);
    assert.equal(valid.record.eventToRegister, 'worker.evidence-recorded');
    assert.equal(fenced.valid, true);
    assert.equal(fenced.record.threadId, EXPECTED.threadId);
    assert.equal(invalidJson.valid, false);
    assert.equal(invalidJson.reason, 'invalid-json-result-block');
    assert.equal(invalidJson.correction.type, 'result-only-correction');
    assert.equal(missingField.valid, false);
    assert.equal(missingField.reason, 'missing-field:evidenceRef');
    assert.equal(wrongThread.valid, false);
    assert.equal(wrongThread.reason, 'context-mismatch:threadId');
  });

  it('bounds correction to one result-only prompt before manual recovery', () => {
    const missing = parseChildResultBlock({
      text: 'The implementation is done. Evidence is in docs/plans/v43-task-1-worker-evidence-2026-06-07.md.',
      expected: EXPECTED
    });
    const firstAction = decideResultProtocolAction({
      parseResult: missing,
      correctionAttempts: 0,
      correctionReachable: true
    });
    const repeatedInvalid = decideResultProtocolAction({
      parseResult: missing,
      correctionAttempts: 1,
      correctionReachable: true
    });
    const unreachable = decideResultProtocolAction({
      parseResult: missing,
      correctionAttempts: 0,
      correctionReachable: false
    });
    const queuedBehindActiveChild = decideResultProtocolAction({
      parseResult: missing,
      correctionAttempts: 0,
      correctionReachable: true,
      childActive: true
    });

    assert.equal(missing.valid, false);
    assert.equal(missing.reason, 'missing-result-block');
    assert.equal(firstAction.kind, 'send-correction');
    assert.match(firstAction.prompt, /Do not run commands/u);
    assert.equal(firstAction.audit.action, 'correction-prompt');
    assert.equal(firstAction.boundedRetry.maxAttempts, 1);
    assert.equal(repeatedInvalid.kind, 'manual-recovery');
    assert.equal(repeatedInvalid.reason, 'repeated-invalid-result-output');
    assert.equal(repeatedInvalid.audit.action, 'manual-recovery');
    assert.equal(unreachable.kind, 'manual-recovery');
    assert.equal(unreachable.reason, 'correction-unreachable');
    assert.equal(queuedBehindActiveChild.kind, 'manual-recovery');
    assert.equal(queuedBehindActiveChild.reason, 'result-only-prompt-queued-behind-active-child');
  });

  it('consumes parsed results append-only and idempotently', () => {
    const parsed = parseChildResultBlock({
      text: resultBlock(validPayload()),
      expected: EXPECTED
    });
    const first = consumeParsedResult({
      result: parsed
    });
    const second = consumeParsedResult({
      result: parsed,
      consumedResultIds: [first.recordId]
    });

    assert.equal(first.consumed, true);
    assert.equal(first.audit.appendOnly, true);
    assert.equal(first.event.eventToRegister, 'worker.evidence-recorded');
    assert.equal(second.consumed, false);
    assert.equal(second.idempotent, true);
    assert.equal(second.reason, 'result-already-consumed');
  });

  it('lists accepted terminal events for non-worker roles beyond success-only paths', () => {
    assert.deepEqual(acceptedTerminalEventsForRole('reviewer'), [
      'reviewer.approved',
      'reviewer.needs-revision',
      'reviewer.blocked'
    ]);
    assert.deepEqual(acceptedTerminalEventsForRole('main-verifier'), [
      'main.verification-passed',
      'main.verification-failed'
    ]);
    assert.deepEqual(acceptedTerminalEventsForRole('release-manager'), [
      'release.gate-passed',
      'release.gate-failed',
      'release.evidence-recorded',
      'release.ready-declared'
    ]);
    assert.equal(ACCEPTED_TERMINAL_EVENTS_BY_ROLE['release-manager'].includes('release.gate-failed'), true);
  });
});

function threadBinding() {
  return {
    goalId: EXPECTED.goalId,
    taskId: EXPECTED.taskId,
    role: EXPECTED.role,
    requestId: 'request-task-1-worker',
    threadId: EXPECTED.threadId,
    worktree: EXPECTED.worktree,
    baseCommit: '5e645c5c68c72c489ff938ffa076e33725bc05f9'
  };
}

function readableThread(capabilityThreadId, responseThreadId = capabilityThreadId) {
  return {
    status: 'readable',
    readable: true,
    capability: {
      contractName: 'app-thread-read-capability.v1',
      contractVersion: 1,
      adapter: 'codex-app',
      method: 'readThread',
      callShape: {
        threadId: capabilityThreadId
      },
      optionalParameters: [],
      requestedAt: null,
      replayable: true
    },
    response: {
      id: responseThreadId
    }
  };
}

function validPayload(overrides = {}) {
  return {
    goalId: EXPECTED.goalId,
    taskId: EXPECTED.taskId,
    role: EXPECTED.role,
    threadId: EXPECTED.threadId,
    branch: EXPECTED.branch,
    worktree: EXPECTED.worktree,
    baseCommit: '5e645c5c68c72c489ff938ffa076e33725bc05f9',
    headCommit: '5e645c5c68c72c489ff938ffa076e33725bc05f9',
    status: 'completed',
    eventToRegister: 'worker.evidence-recorded',
    evidenceRef: 'docs/plans/v43-task-1-worker-evidence-2026-06-07.md',
    filesChanged: [
      'src/symphony/app-thread-result-protocol.js',
      'tests/v43-app-thread-result-protocol.test.js'
    ],
    commandsRun: [
      {
        command: 'pnpm test',
        status: 'passed'
      }
    ],
    validation: 'focused replay tests passed',
    risks: [],
    blockers: [],
    nextSuggestedAction: 'reviewer',
    ...overrides
  };
}

function resultBlock(payload) {
  return [
    RESULT_BLOCK_START,
    JSON.stringify(payload, null, 2),
    RESULT_BLOCK_END
  ].join('\n');
}
