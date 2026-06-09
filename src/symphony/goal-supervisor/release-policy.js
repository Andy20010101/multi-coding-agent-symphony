export const RELEASE_MANAGER_RESULT_EVENTS = Object.freeze([
  'release.gate-passed',
  'release.gate-failed',
  'release.evidence-recorded',
  'release.ready-declared'
]);

export const RELEASE_MANAGER_GATE_EVENTS = Object.freeze([
  'release.gate-passed',
  'release.gate-failed'
]);

export const RELEASE_READY_DECLARED_EVENT = 'release.ready-declared';

export const RELEASE_MANAGER_EVENTS_BY_PHASE = Object.freeze({
  'release-gate': RELEASE_MANAGER_GATE_EVENTS,
  'release-prep': Object.freeze([
    RELEASE_READY_DECLARED_EVENT
  ])
});

export const DEFAULT_RELEASE_GATES = Object.freeze([
  'release.pnpm-check',
  'release.pnpm-test',
  'release.workbench-build',
  'release.diff-check',
  'release.docs-updated'
]);

export const EXTERNAL_RELEASE_AUTOMATION_SURFACES = Object.freeze([
  'tag-push-publish-release-automation'
]);

export function acceptedReleaseManagerEventsForPhase(phase) {
  return [...(RELEASE_MANAGER_EVENTS_BY_PHASE[phase] ?? [])];
}

export function isReleaseManagerGateEvent(eventToRegister) {
  return RELEASE_MANAGER_GATE_EVENTS.includes(eventToRegister);
}

export function normalizeReleaseGates(value, {
  useDefault = false
} = {}) {
  if (!Array.isArray(value) || value.length === 0) {
    return useDefault ? [...DEFAULT_RELEASE_GATES] : [];
  }

  return value.filter(isNonEmptyString);
}

export function identifyReleaseGateForResult({
  result,
  releaseGates,
  useDefaultGates = false
}) {
  if (result?.role !== 'release-manager' || !isReleaseManagerGateEvent(result?.eventToRegister)) {
    return null;
  }

  const gates = normalizeReleaseGates(releaseGates, {
    useDefault: useDefaultGates
  });
  const basis = `${result.commandsRun ?? ''}\n${result.validation ?? ''}`;
  const matches = findReleaseGateMentions({
    text: basis,
    releaseGates: gates
  });

  return matches.length === 1 ? matches[0] : null;
}

export function findReleaseGateMentions({
  text,
  releaseGates,
  useDefaultGates = false
}) {
  const gates = normalizeReleaseGates(releaseGates, {
    useDefault: useDefaultGates
  });

  if (gates.length === 0) {
    return [];
  }

  return gates.filter((gate) => isNonEmptyString(gate) && String(text ?? '').includes(gate));
}

export function evaluateReleaseManagerResultBasis({
  payload,
  phase = null,
  releaseGates,
  basis
}) {
  if (payload?.role !== 'release-manager') {
    return allowPolicyDecision();
  }

  const gates = normalizeReleaseGates(releaseGates);
  const gateMentions = findReleaseGateMentions({
    text: basis,
    releaseGates: gates
  });
  const reasons = [];

  if (phase === 'release-gate' && isReleaseManagerGateEvent(payload.eventToRegister)) {
    if (gates.length > 0 && gateMentions.length !== 1) {
      reasons.push(`release-gate-result-must-cite-one-gate:${gateMentions.length}`);
    }
  }

  if (payload.eventToRegister === RELEASE_READY_DECLARED_EVENT && gateMentions.length > 0) {
    reasons.push(`release-prep-result-must-not-cite-gates:${gateMentions.join(',')}`);
  }

  return reasons.length === 0
    ? allowPolicyDecision()
    : denyPolicyDecision(reasons);
}

export function evaluateReleaseCloseoutAuthorization({
  subject,
  allowCloseout,
  closeoutEventOnly = false
}) {
  const releaseManagerSubject = subject?.role === 'release-manager';
  const closeoutEventSubject = subject?.eventToRegister === RELEASE_READY_DECLARED_EVENT;
  const requiresAuthorization = closeoutEventOnly
    ? releaseManagerSubject && closeoutEventSubject
    : releaseManagerSubject;

  if (!requiresAuthorization || allowCloseout === true) {
    return allowPolicyDecision();
  }

  return denyPolicyDecision(['release-closeout-requires-operator-authorization']);
}

export function evaluateReleaseRegistrarCloseoutAuthorization({
  result,
  allowCloseout
}) {
  const decision = evaluateReleaseCloseoutAuthorization({
    subject: result,
    allowCloseout,
    closeoutEventOnly: true
  });

  if (decision.allowed) {
    return decision;
  }

  return denyPolicyDecision(['release-closeout-not-authorized']);
}

export function projectReleasePolicyBoundaries() {
  return {
    releaseCloseoutWithoutOperatorAuthorization: false,
    tagPushPublishAutomation: false
  };
}

export function deniedExternalReleaseAutomationSurfaces() {
  return [...EXTERNAL_RELEASE_AUTOMATION_SURFACES];
}

function allowPolicyDecision() {
  return {
    allowed: true,
    denied: false,
    reason: null,
    reasons: []
  };
}

function denyPolicyDecision(reasons) {
  return {
    allowed: false,
    denied: true,
    reason: reasons[0],
    reasons
  };
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}
