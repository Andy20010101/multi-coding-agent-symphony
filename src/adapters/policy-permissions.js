const SHELL_DENY_REASONS = new Set([
  'command-not-allowed',
  'denied-command',
  'denied-command-pattern',
  'invalid-command'
]);
const NETWORK_DENY_REASONS = new Set([
  'network-denied',
  'invalid-network-target',
  'invalid-network-policy'
]);

export function deniedPathRules(policyDecisions = []) {
  return deniedDecisions(policyDecisions)
    .filter((decision) => decision.reason === 'sensitive-path')
    .map((decision) => decision.matchedRule)
    .filter((matchedRule) => typeof matchedRule === 'string' && matchedRule.trim() !== '');
}

export function hasDeniedPath(policyDecisions = []) {
  return deniedPathRules(policyDecisions).length > 0;
}

export function hasDeniedShell(policyDecisions = []) {
  return deniedDecisions(policyDecisions).some((decision) => {
    return SHELL_DENY_REASONS.has(decision.reason) || decisionHasAnyValue(decision, ['shell', 'test']);
  });
}

export function hasDeniedNetwork(policyDecisions = []) {
  return deniedDecisions(policyDecisions).some((decision) => {
    return NETWORK_DENY_REASONS.has(decision.reason) || decisionHasAnyValue(decision, ['network']);
  });
}

export function policyRestrictionLines(policyDecisions = []) {
  const lines = [];
  const pathRules = deniedPathRules(policyDecisions);

  if (pathRules.length > 0) {
    lines.push(`Do not read or write paths matching: ${pathRules.join(', ')}`);
  }

  if (hasDeniedShell(policyDecisions)) {
    lines.push('Do not run shell commands.');
  }

  if (hasDeniedNetwork(policyDecisions)) {
    lines.push('Do not access the network.');
  }

  return lines;
}

function deniedDecisions(policyDecisions) {
  if (!Array.isArray(policyDecisions)) {
    return [];
  }

  return policyDecisions.filter((decision) => decision?.decision === 'deny');
}

function decisionHasAnyValue(decision, values) {
  const normalizedValues = new Set(values);
  const candidates = [
    decision.action,
    decision.tool,
    decision.toolName,
    decision.requestedTool,
    decision.matchedRule
  ];

  return candidates.some((candidate) => normalizedValues.has(candidate));
}
