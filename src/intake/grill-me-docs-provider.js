import { basename } from 'node:path';

import { NodeProcessRunner } from '../process-runner.js';
import { redactSecrets } from '../redaction.js';
import { isRiskSeverity } from './intake-contracts.js';

const MAX_PROVIDER_NOTE_LENGTH = 2048;
const MAX_PROVIDER_ITEMS = 25;

export async function runGrillMeDocsProvider({
  projectDir,
  providerCommand = 'grill-me-docs',
  runner = new NodeProcessRunner()
}) {
  const discovery = await discoverProvider({
    providerCommand,
    projectDir,
    runner
  });

  if (discovery.status === 'unavailable') {
    return {
      name: 'grill-me-docs',
      status: 'unavailable',
      modelInvocation: false,
      risks: [],
      openQuestions: [],
      constraints: [],
      note: `Provider command not found: ${providerCommand}`
    };
  }

  try {
    const result = await runner.run({
      executable: discovery.executable,
      args: ['--project-dir', projectDir, '--format', 'json'],
      cwd: projectDir,
      timeoutMs: 30000
    });
    const normalized = normalizeProviderOutput(result.stdout);

    return {
      name: 'grill-me-docs',
      status: result.exitCode === 0 ? 'completed' : 'failed',
      modelInvocation: false,
      command: discovery.executable,
      exitCode: result.exitCode ?? 1,
      ...normalized
    };
  } catch (error) {
    return {
      name: 'grill-me-docs',
      status: 'failed',
      modelInvocation: false,
      risks: [],
      openQuestions: [],
      constraints: [],
      note: String(error.message ?? error).slice(0, MAX_PROVIDER_NOTE_LENGTH)
    };
  }
}

async function discoverProvider({ providerCommand, projectDir, runner }) {
  const discovery = await runner.run({
    executable: 'sh',
    args: ['-c', 'command -v "$1"', 'command-v', providerCommand],
    cwd: projectDir,
    timeoutMs: 10000
  });

  if (discovery.exitCode !== 0 || discovery.stdout.trim() === '') {
    return {
      status: 'unavailable'
    };
  }

  return {
    status: 'available',
    executable: discovery.stdout.trim().split(/\r?\n/u)[0]
  };
}

function normalizeProviderOutput(stdout) {
  const redacted = redactSecrets(stdout ?? '');
  const parsed = parseProviderJson(redacted);

  if (!parsed) {
    return {
      risks: [],
      openQuestions: [],
      constraints: [],
      note: redacted.slice(0, MAX_PROVIDER_NOTE_LENGTH)
    };
  }

  return {
    risks: normalizeRisks(parsed.risks),
    openQuestions: normalizeOpenQuestions(parsed.openQuestions),
    constraints: normalizeConstraints(parsed.constraints),
    ...(parsed.summary ? { note: String(parsed.summary).slice(0, MAX_PROVIDER_NOTE_LENGTH) } : {})
  };
}

function parseProviderJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function normalizeRisks(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.slice(0, MAX_PROVIDER_ITEMS).map((risk, index) => ({
    id: `provider-risk-${String(index + 1).padStart(3, '0')}`,
    severity: isRiskSeverity(risk?.severity) ? risk.severity : 'low',
    category: safeText(risk?.category, 'provider'),
    title: safeText(risk?.title, 'Provider finding'),
    evidence: safeStringArray(risk?.evidence),
    mitigation: safeText(risk?.mitigation, 'Review provider finding.')
  }));
}

function normalizeOpenQuestions(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.slice(0, MAX_PROVIDER_ITEMS).map((question, index) => ({
    id: `provider-question-${String(index + 1).padStart(3, '0')}`,
    severity: isRiskSeverity(question?.severity) ? question.severity : 'low',
    question: safeText(question?.question, 'Review provider question.'),
    source: 'grill-me-docs'
  }));
}

function normalizeConstraints(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.slice(0, MAX_PROVIDER_ITEMS).map((constraint, index) => ({
    id: `provider-constraint-${String(index + 1).padStart(3, '0')}`,
    source: 'grill-me-docs',
    path: safeProviderPath(constraint?.path),
    line: Number.isInteger(constraint?.line) && constraint.line > 0 ? constraint.line : 1,
    text: safeText(constraint?.text, 'Review provider constraint.'),
    confidence: 'medium'
  }));
}

function safeText(value, fallback) {
  if (typeof value !== 'string' || value.trim() === '') {
    return fallback;
  }

  return value.trim().replace(/\s+/gu, ' ').slice(0, 240);
}

function safeStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item) => typeof item === 'string')
    .map((item) => item.trim().replace(/\s+/gu, ' ').slice(0, 240))
    .filter(Boolean)
    .slice(0, 5);
}

function safeProviderPath(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    return 'provider-output';
  }

  return basename(value);
}
