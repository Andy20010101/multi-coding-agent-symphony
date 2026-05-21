import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { validateEvidencePackage } from '../src/contracts.js';
import {
  collectFileInventory,
  readTextFileLimited
} from '../src/intake/file-inventory.js';
import {
  validateIntakeSummaryArtifact,
  validateProjectContextArtifact
} from '../src/intake/intake-contracts.js';
import { runProjectIntake } from '../src/intake/project-intake.js';

describe('v7 project intake contracts', () => {
  it('validates project context and summary artifacts without using EvidencePackage', () => {
    const context = validProjectContext();
    const summary = validIntakeSummary();

    assert.equal(validateProjectContextArtifact(context), context);
    assert.equal(validateIntakeSummaryArtifact(summary), summary);
    assert.throws(
      () => validateEvidencePackage(context),
      /EvidencePackage.command/
    );
  });

  it('rejects actionable invalid project context fields', () => {
    assert.throws(
      () => validateProjectContextArtifact({ ...validProjectContext(), kind: undefined }),
      /ProjectContextArtifact.kind/
    );
    assert.throws(
      () => validateProjectContextArtifact({
        ...validProjectContext(),
        project: { ...validProjectContext().project, root: ' ' }
      }),
      /project.root/
    );
    assert.throws(
      () => validateProjectContextArtifact({
        ...validProjectContext(),
        risks: [{ ...validProjectContext().risks[0], severity: 'urgent' }]
      }),
      /risks\[0\].severity/
    );
    assert.throws(
      () => validateProjectContextArtifact({
        ...validProjectContext(),
        workflowHints: { ...validProjectContext().workflowHints, recommendedMode: 'solo' }
      }),
      /workflowHints.recommendedMode/
    );
    assert.throws(
      () => validateProjectContextArtifact({ ...validProjectContext(), risks: {} }),
      /ProjectContextArtifact.risks/
    );
    assert.throws(
      () => validateProjectContextArtifact({
        ...validProjectContext(),
        provider: { name: 'builtin', status: 'completed' }
      }),
      /provider.modelInvocation/
    );
  });
});

describe('v7 built-in project intake', () => {
  it('returns useful risks for an empty directory and writes both artifacts', async () => {
    const root = await mkdtemp(join(tmpdir(), 'intake-empty-'));

    try {
      const artifactDirectory = join(root, 'artifacts');
      const result = await runProjectIntake({
        projectDir: root,
        artifactDirectory,
        eventDirectory: join(root, 'events'),
        runner: new MissingToolRunner()
      });

      assert.equal(result.exitCode, 0);
      assert.equal(result.output.status, 'passed');
      assert.equal(result.output.taskId, 'project-intake');
      assert.equal(result.output.contextArtifactId, 'project-context');
      assert.equal(result.output.summaryArtifactId, 'intake-summary');
      assert.equal(result.output.modelInvocation, false);
      assert.equal(result.output.riskCounts.high >= 1, true);
      assert.equal(result.context.project.git.isRepository, false);
      assert.equal(existsSync(result.output.contextArtifactPath), true);
      assert.equal(existsSync(result.output.summaryArtifactPath), true);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('detects a minimal JavaScript repository shape deterministically', async () => {
    const root = await mkdtemp(join(tmpdir(), 'intake-js-'));

    try {
      await writeFile(join(root, 'README.md'), '# Fixture\n\nRun `pnpm test`.\n', 'utf8');
      await writeFile(join(root, 'AGENTS.md'), 'You must verify changes with tests.\n', 'utf8');
      await mkdir(join(root, 'tests'));
      await writeFile(join(root, 'tests', 'fixture.test.js'), 'export const ok = true;\n', 'utf8');
      await writeFile(join(root, 'package.json'), `${JSON.stringify({
        name: 'fixture',
        packageManager: 'pnpm@10.30.3',
        scripts: {
          check: 'node --check index.js',
          test: 'node --test'
        },
        bin: {
          fixture: 'index.js'
        },
        engines: {
          node: '>=20'
        }
      }, null, 2)}\n`, 'utf8');

      const result = await runProjectIntake({
        projectDir: root,
        artifactDirectory: join(root, 'artifacts'),
        eventDirectory: join(root, 'events'),
        runner: new MissingToolRunner()
      });

      assert.equal(result.context.documentation.readme.present, true);
      assert.deepEqual(result.context.runtime.bins, ['fixture']);
      assert.equal(result.context.runtime.packageManager, 'pnpm@10.30.3');
      assert.deepEqual(result.context.runtime.verificationCommands, ['pnpm check', 'pnpm test']);
      assert.equal(result.context.workflowHints.recommendedMode, 'writer-reviewer');
      assert.equal(result.context.constraints[0].path, 'AGENTS.md');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('detects this repository bins and CI while respecting ignored roots', async () => {
    const root = await mkdtemp(join(tmpdir(), 'intake-this-repo-'));

    try {
      const result = await runProjectIntake({
        projectDir: '.',
        artifactDirectory: join(root, 'artifacts'),
        eventDirectory: join(root, 'events'),
        runner: new MissingToolRunner()
      });

      assert.deepEqual(result.context.runtime.bins, ['mcas', 'symphony']);
      assert.equal(result.context.runtime.packageManager, 'pnpm@10.30.3');
      assert.equal(result.context.ci.providers.includes('github-actions'), true);
      assert.equal(result.context.inventory.ignoredRoots.includes('node_modules'), true);
      assert.equal(result.context.inventory.ignoredRoots.includes('.git'), true);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('excludes node_modules, git, and temp directories from the inventory', async () => {
    const root = await mkdtemp(join(tmpdir(), 'intake-ignore-'));

    try {
      await mkdir(join(root, 'node_modules', 'pkg'), { recursive: true });
      await mkdir(join(root, '.git', 'objects'), { recursive: true });
      await mkdir(join(root, 'tmp'), { recursive: true });
      await writeFile(join(root, 'README.md'), '# Fixture\n', 'utf8');
      await writeFile(join(root, 'node_modules', 'pkg', 'index.js'), 'module.exports = 1;\n', 'utf8');
      await writeFile(join(root, '.git', 'HEAD'), 'ref: refs/heads/main\n', 'utf8');
      await writeFile(join(root, 'tmp', 'scratch.txt'), 'scratch\n', 'utf8');

      const inventory = await collectFileInventory({ projectDir: root });

      assert.deepEqual(inventory.files, ['README.md']);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('bounds text reads to the requested byte limit', async () => {
    const root = await mkdtemp(join(tmpdir(), 'intake-read-limit-'));

    try {
      await writeFile(join(root, 'README.md'), `${'a'.repeat(1024)}tail`, 'utf8');

      const content = await readTextFileLimited(root, 'README.md', 128);

      assert.equal(Buffer.byteLength(content), 128);
      assert.equal(content.includes('tail'), false);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});

describe('v7 optional grill-me-docs provider', () => {
  it('marks a missing provider unavailable without failing by default', async () => {
    const root = await mkdtemp(join(tmpdir(), 'intake-provider-missing-'));

    try {
      const result = await runProjectIntake({
        projectDir: root,
        artifactDirectory: join(root, 'artifacts'),
        eventDirectory: join(root, 'events'),
        provider: 'grill-me-docs',
        runner: new MissingToolRunner()
      });

      assert.equal(result.exitCode, 0);
      assert.equal(result.output.providerStatus, 'unavailable');
      assert.equal(result.context.provider.status, 'unavailable');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('merges fake provider JSON findings into bounded normalized artifacts', async () => {
    const root = await mkdtemp(join(tmpdir(), 'intake-provider-json-'));

    try {
      const runner = new ProviderRunner(JSON.stringify({
        risks: [{
          severity: 'medium',
          category: 'docs',
          title: 'Provider risk',
          evidence: ['Provider evidence'],
          mitigation: 'Handle provider risk.'
        }],
        openQuestions: [{
          severity: 'low',
          question: 'Provider question?'
        }],
        constraints: [{
          path: '/outside/project/AGENTS.md',
          line: 7,
          text: 'Provider says tests are required.'
        }]
      }));
      const result = await runProjectIntake({
        projectDir: root,
        artifactDirectory: join(root, 'artifacts'),
        eventDirectory: join(root, 'events'),
        provider: 'grill-me-docs',
        runner
      });

      assert.equal(result.output.providerStatus, 'completed');
      assert.equal(result.context.risks.some((risk) => risk.title === 'Provider risk'), true);
      assert.equal(result.context.openQuestions.some((question) => question.question === 'Provider question?'), true);
      assert.equal(result.context.constraints.some((constraint) => constraint.path === 'AGENTS.md'), true);
      assert.deepEqual(runner.calls.map((call) => [call.executable, call.args]), [
        ['git', ['rev-parse', '--is-inside-work-tree']],
        ['sh', ['-c', 'command -v "$1"', 'command-v', 'grill-me-docs']],
        ['/fake/grill-me-docs', ['--project-dir', root, '--format', 'json']]
      ]);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('captures non-JSON provider output as a bounded note without crashing', async () => {
    const root = await mkdtemp(join(tmpdir(), 'intake-provider-text-'));

    try {
      const result = await runProjectIntake({
        projectDir: root,
        artifactDirectory: join(root, 'artifacts'),
        eventDirectory: join(root, 'events'),
        provider: 'grill-me-docs',
        runner: new ProviderRunner('plain text provider note')
      });
      const context = JSON.parse(await readFile(result.output.contextArtifactPath, 'utf8'));

      assert.equal(result.output.providerStatus, 'completed');
      assert.equal(context.provider.note, 'plain text provider note');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});

function validProjectContext() {
  return {
    version: '1',
    kind: 'project-context',
    schema: 'project-context.v1',
    generatedAt: '2026-05-20T00:00:00.000Z',
    project: {
      root: '/tmp/project',
      name: 'project',
      git: {
        isRepository: false
      }
    },
    inventory: {
      docs: ['README.md'],
      configFiles: ['package.json'],
      ciFiles: [],
      sourceRoots: ['src'],
      ignoredRoots: ['.git']
    },
    documentation: {
      readme: {
        path: 'README.md',
        present: true
      },
      agents: [],
      adrCount: 0,
      planCount: 0,
      hasContributing: false,
      hasTroubleshooting: false,
      hasLicense: false
    },
    runtime: {
      packageManager: 'pnpm@10.30.3',
      nodeEngine: '>=20',
      scripts: {
        test: 'node --test'
      },
      bins: ['symphony'],
      verificationCommands: ['pnpm test']
    },
    ci: {
      providers: [],
      workflows: []
    },
    constraints: [{
      id: 'constraint-001',
      source: 'AGENTS.md',
      path: 'AGENTS.md',
      line: 1,
      text: 'Verify before claiming completion.',
      confidence: 'high'
    }],
    risks: [{
      id: 'risk-001',
      severity: 'medium',
      category: 'documentation',
      title: 'Missing docs',
      evidence: ['docs/api.md missing'],
      mitigation: 'Add docs.'
    }],
    openQuestions: [{
      id: 'question-001',
      severity: 'low',
      question: 'Which docs are required?',
      source: 'documentation'
    }],
    workflowHints: {
      recommendedMode: 'writer-reviewer',
      recommendedAdapter: 'codex',
      verificationCommands: ['pnpm test'],
      writeSetHints: ['src/**'],
      preflightSummary: 'Run tests.'
    },
    provider: {
      name: 'builtin',
      status: 'completed',
      modelInvocation: false
    }
  };
}

function validIntakeSummary() {
  return {
    version: '1',
    kind: 'intake-summary',
    schema: 'intake-summary.v1',
    status: 'passed',
    riskCounts: {
      critical: 0,
      high: 0,
      medium: 1,
      low: 0
    },
    openQuestionCount: 1,
    recommendedWorkflow: 'writer-reviewer',
    verificationCommands: ['pnpm test'],
    modelInvocation: false,
    providerStatus: 'builtin'
  };
}

class MissingToolRunner {
  constructor() {
    this.calls = [];
  }

  async run(invocation) {
    this.calls.push(invocation);
    return {
      exitCode: 1,
      stdout: '',
      stderr: 'missing'
    };
  }
}

class ProviderRunner {
  constructor(providerStdout) {
    this.providerStdout = providerStdout;
    this.calls = [];
  }

  async run(invocation) {
    this.calls.push({
      executable: invocation.executable,
      args: invocation.args
    });

    if (invocation.executable === 'sh') {
      return {
        exitCode: 0,
        stdout: '/fake/grill-me-docs\n',
        stderr: ''
      };
    }

    if (invocation.executable === '/fake/grill-me-docs') {
      return {
        exitCode: 0,
        stdout: this.providerStdout,
        stderr: ''
      };
    }

    return {
      exitCode: 1,
      stdout: '',
      stderr: 'not a git repository'
    };
  }
}
