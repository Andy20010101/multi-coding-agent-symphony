import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  DOGFOOD_SESSION_BOUNDARIES,
  DOGFOOD_SESSION_CONTRACT_NAME,
  buildDogfoodSessionRecord,
  buildDogfoodSessionSummary,
  validateDogfoodSessionContract
} from '../src/symphony/dogfood-session-contracts.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');

describe('v72 one-week dogfood stabilization contracts', () => {
  it('builds a counted dogfood session from safe operator evidence', () => {
    const session = dogfoodSession({
      sessionId: 'v72-s01',
      date: '2026-06-15',
      localTime: '10:45',
      metrics: {
        success: 'observed',
        blocked: 'not observed',
        reviewLoopCount: 1,
        recoveryCount: 0,
        manualTerminalEscapeCount: 1,
        elapsedTimeMinutes: 24,
        cost: { state: 'unknown', value: null, source: null }
      }
    });

    assert.equal(session.contractName, DOGFOOD_SESSION_CONTRACT_NAME);
    assert.deepEqual(session.boundaries, DOGFOOD_SESSION_BOUNDARIES);
    assert.equal(session.readOnly, true);
    assert.equal(session.willMutate, false);
    assert.equal(validateDogfoodSessionContract(session).ok, true);
  });

  it('blocks unsafe evidence refs, raw provider output, local session paths, and release automation claims', () => {
    const unsafeRefs = [
      '/Users/andy/.codex/sessions/2026/06/15/raw.jsonl',
      'docs/qa/raw provider output pasted here',
      'gh release create v72 --notes raw'
    ];
    const safeSession = dogfoodSession();

    for (const ref of unsafeRefs) {
      const validation = validateDogfoodSessionContract({
        ...safeSession,
        evidenceRefs: [{
          kind: 'repo-doc',
          ref,
          label: 'unsafe evidence'
        }]
      });

      assert.equal(validation.ok, false, ref);
      assert.match(validation.errors.join('; '), /unsafe field or value/u);
    }
  });

  it('keeps closeout blocked before five counted sessions', () => {
    const summary = buildDogfoodSessionSummary({
      generatedAt: '2026-06-15T03:20:00.000Z',
      sessions: [
        dogfoodSession({ sessionId: 'v72-s01', date: '2026-06-15', localTime: '10:00' }),
        dogfoodSession({ sessionId: 'v72-s02', date: '2026-06-15', localTime: '11:00' })
      ]
    });

    assert.equal(summary.contractName, 'dogfoodSessionSummary.v1');
    assert.equal(summary.countedSessionCount, 2);
    assert.equal(summary.closeoutSessionGate, 'blocked');
    assert.deepEqual(summary.blockedReasons, ['dogfood-session-count-below-five']);
    assert.equal(summary.evidenceScope, 'same-day-dogfood');
    assert.equal(summary.oneWeekStabilityClaimAllowed, false);
  });

  it('allows five same-day sessions to satisfy the session count without allowing one-week stability claims', () => {
    const sessions = Array.from({ length: 5 }, (_, index) => dogfoodSession({
      sessionId: `v72-s0${index + 1}`,
      date: '2026-06-15',
      localTime: `1${index}:00`,
      metrics: {
        success: index < 4 ? 'observed' : 'unknown',
        blocked: index === 4 ? 'observed' : 'not observed',
        reviewLoopCount: index,
        recoveryCount: index === 4 ? 1 : 0,
        manualTerminalEscapeCount: index === 4 ? 2 : 1,
        elapsedTimeMinutes: 'unknown',
        cost: { state: 'unknown', value: null, source: null }
      }
    }));
    const summary = buildDogfoodSessionSummary({ sessions });

    assert.equal(summary.countedSessionCount, 5);
    assert.equal(summary.closeoutSessionGate, 'ready');
    assert.equal(summary.evidenceScope, 'same-day-dogfood');
    assert.equal(summary.oneWeekStabilityClaimAllowed, false);
    assert.equal(summary.metrics.successObservedCount, 4);
    assert.equal(summary.metrics.blockedObservedCount, 1);
    assert.equal(summary.metrics.recoveryCountObservedTotal, 1);
    assert.equal(summary.metrics.manualTerminalEscapeObservedTotal, 6);
    assert.deepEqual(summary.blockedReasons, []);
  });

  it('allows one-week stability claims only from five sessions spanning at least seven calendar days', () => {
    const dates = ['2026-06-15', '2026-06-16', '2026-06-17', '2026-06-18', '2026-06-21'];
    const summary = buildDogfoodSessionSummary({
      sessions: dates.map((date, index) => dogfoodSession({
        sessionId: `v72-week-${index + 1}`,
        date,
        localTime: '09:30'
      }))
    });

    assert.equal(summary.countedSessionCount, 5);
    assert.equal(summary.calendarDaySpan, 7);
    assert.equal(summary.evidenceScope, 'one-week-dogfood');
    assert.equal(summary.oneWeekStabilityClaimAllowed, true);
  });

  it('keeps docs explicit that template records are not counted dogfood evidence', () => {
    const template = readFileSync(join(REPO_ROOT, 'docs/dogfood/v72-session-log-template.md'), 'utf8');
    const protocol = readFileSync(join(REPO_ROOT, 'docs/qa/v72-one-week-dogfood-stabilization-protocol.md'), 'utf8');

    assert.match(template, /This file is a template only/u);
    assert.match(template, /Do not claim one-week stability from same-day records/u);
    assert.match(template, /BLOCKED_REAL_DOGFOOD_EVIDENCE/u);
    assert.match(template, /If a fresh worktree fails Workbench build or route tests because `node_modules` is missing/u);
    assert.match(template, /pnpm install/u);
    assert.match(protocol, /No v72 dogfood session records are counted in this PR/u);
    assert.match(template, /Do not use raw transcript paths, local provider session files, `\.jsonl` files/u);
    assert.doesNotMatch(template, /\/Users\//u);
  });
});

function dogfoodSession(overrides = {}) {
  return buildDogfoodSessionRecord({
    generatedAt: '2026-06-15T03:15:00.000Z',
    sessionId: 'v72-template-session',
    date: '2026-06-15',
    localTime: '10:30',
    timezone: 'Asia/Shanghai',
    project: '/repo/multi-coding-agent-symphony',
    goalOrTask: 'verify v72 dogfood session record contract',
    entryPath: 'controller terminal',
    providers: {
      worker: 'operator',
      reviewer: 'operator'
    },
    adoptionStatus: 'not applicable',
    verificationStatus: 'passed',
    blockerState: 'not observed',
    recoveryAction: 'not observed',
    frictionNotes: ['none observed in this contract fixture'],
    evidenceRefs: [{
      kind: 'repo-doc',
      ref: 'docs/qa/v72-one-week-dogfood-stabilization-protocol.md',
      label: 'v72 dogfood protocol'
    }],
    metrics: {
      success: 'unknown',
      blocked: 'unknown',
      reviewLoopCount: 'unknown',
      recoveryCount: 'unknown',
      manualTerminalEscapeCount: 'unknown',
      elapsedTimeMinutes: 'unknown',
      cost: { state: 'unknown', value: null, source: null }
    },
    ...overrides
  });
}
