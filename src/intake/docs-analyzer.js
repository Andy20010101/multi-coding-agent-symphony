import { basename, dirname } from 'node:path';

import { readTextFileLimited } from './file-inventory.js';

const CONSTRAINT_PATTERN = /\b(must|required|do not|verify|test|security|workflow)\b/iu;

export async function analyzeDocs({ projectDir, inventory, runtime, ci }) {
  const readmePath = inventory.files.includes('README.md') ? 'README.md' : null;
  const agents = inventory.files
    .filter((file) => basename(file) === 'AGENTS.md')
    .map((path) => ({
      path,
      scope: dirname(path) === '.' ? '.' : dirname(path)
    }));
  const constraints = await extractConstraints({ projectDir, inventory });
  const risks = [];
  const openQuestions = [];

  if (!readmePath) {
    risks.push(risk('risk-001', 'high', 'documentation', 'README is missing', ['README.md missing'], 'Add setup and usage documentation.'));
    openQuestions.push(question('question-001', 'high', 'Where is the primary setup and usage documentation?', 'documentation'));
  }

  if (agents.length === 0) {
    risks.push(risk('risk-002', 'medium', 'workflow', 'AGENTS.md is missing', ['AGENTS.md missing'], 'Add repository-specific agent instructions.'));
    openQuestions.push(question('question-002', 'medium', 'Which repository constraints should agents follow?', 'documentation'));
  }

  if (!hasTests(inventory)) {
    risks.push(risk('risk-003', 'high', 'verification', 'Tests are not detected', ['tests/ directory or test script missing'], 'Add automated tests or document manual verification.'));
    openQuestions.push(question('question-003', 'high', 'What command proves changes are correct?', 'verification'));
  }

  if (ci.providers.length === 0) {
    risks.push(risk('risk-004', 'medium', 'ci', 'CI configuration is not detected', ['No common CI files found'], 'Add CI or document local-only verification.'));
    openQuestions.push(question('question-004', 'medium', 'Which CI gate should block release?', 'ci'));
  }

  if (runtime.verificationCommands.length === 0) {
    risks.push(risk('risk-005', 'medium', 'verification', 'Verification scripts are missing', ['No check/test/lint scripts detected'], 'Document a manual verification command.'));
    openQuestions.push(question('question-005', 'medium', 'Which verification commands should Symphony run?', 'verification'));
  }

  if (!hasInstallInstructions({ inventory, readmePath })) {
    openQuestions.push(question('question-006', 'low', 'How should a fresh checkout be installed?', 'documentation'));
  }

  return {
    documentation: {
      readme: {
        path: readmePath,
        present: readmePath !== null
      },
      agents,
      adrCount: inventory.files.filter((file) => /^docs\/adr\/.+\.md$/u.test(file)).length,
      planCount: inventory.files.filter((file) => /^(docs\/plans|\.omx\/plans)\/.+\.md$/u.test(file)).length,
      hasContributing: inventory.files.includes('CONTRIBUTING.md'),
      hasTroubleshooting: inventory.files.includes('docs/troubleshooting.md'),
      hasLicense: inventory.files.includes('LICENSE')
    },
    constraints,
    risks,
    openQuestions
  };
}

async function extractConstraints({ projectDir, inventory }) {
  const candidates = inventory.docs
    .filter((file) => basename(file) === 'AGENTS.md' || file === 'README.md' || file.startsWith('docs/'))
    .slice(0, 40);
  const constraints = [];

  for (const path of candidates) {
    const content = await readTextFileLimited(projectDir, path);
    const lines = content.split(/\r?\n/u);

    for (const [index, line] of lines.entries()) {
      const text = line.trim().replace(/\s+/gu, ' ');

      if (text === '' || !CONSTRAINT_PATTERN.test(text)) {
        continue;
      }

      constraints.push({
        id: `constraint-${String(constraints.length + 1).padStart(3, '0')}`,
        source: basename(path),
        path,
        line: index + 1,
        text: text.slice(0, 240),
        confidence: 'medium'
      });

      if (constraints.length >= 50) {
        return constraints;
      }
    }
  }

  return constraints;
}

function hasTests(inventory) {
  return inventory.sourceRoots.includes('tests') || inventory.files.some((file) => /^tests\/.+\.test\.[cm]?[jt]s$/u.test(file));
}

function hasInstallInstructions({ inventory, readmePath }) {
  if (!readmePath) {
    return false;
  }

  return inventory.configFiles.some((file) => ['package.json', 'pnpm-lock.yaml', 'package-lock.json', 'yarn.lock'].includes(file));
}

function risk(id, severity, category, title, evidence, mitigation) {
  return {
    id,
    severity,
    category,
    title,
    evidence,
    mitigation
  };
}

function question(id, severity, questionText, source) {
  return {
    id,
    severity,
    question: questionText,
    source
  };
}
