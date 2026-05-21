import { mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

import { NodeProcessRunner } from '../process-runner.js';

export const SCAFFOLD_TEMPLATES = new Set(['empty', 'node-cli', 'web-app']);

export class ScaffoldError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ScaffoldError';
  }
}

export async function scaffoldProject({
  targetDir,
  template = 'empty',
  write = false,
  runner = new NodeProcessRunner()
} = {}) {
  assertNonEmptyString(targetDir, 'targetDir');
  assertTemplate(template);

  const resolvedTargetDir = resolve(targetDir);
  const files = filesForTemplate({ template, targetDir });
  const existingState = await inspectTargetDirectory(resolvedTargetDir);

  if (existingState.exists && !existingState.empty) {
    throw new ScaffoldError('target directory exists and is not empty');
  }

  const manifest = {
    version: '1',
    kind: 'symphony-scaffold-manifest',
    template,
    targetDir,
    resolvedTargetDir,
    projectWrites: write,
    createdFiles: files.map((file) => file.path),
    skippedFiles: [],
    gitInit: {
      attempted: false,
      status: 'skipped',
      exitCode: null
    }
  };

  if (!write) {
    return {
      status: 'passed',
      manifest
    };
  }

  for (const file of files) {
    const absolutePath = join(resolvedTargetDir, file.path);

    await mkdir(dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, file.content, 'utf8');
  }

  manifest.gitInit = await runGitInit({ targetDir: resolvedTargetDir, runner });

  return {
    status: 'passed',
    manifest
  };
}

export function normalizeTemplate(value) {
  if (value === undefined) {
    return 'empty';
  }

  if (!SCAFFOLD_TEMPLATES.has(value)) {
    throw new ScaffoldError('template must be one of: empty, node-cli, web-app');
  }

  return value;
}

function filesForTemplate({ template, targetDir }) {
  const projectName = basenameForProject(targetDir);
  const common = [
    {
      path: 'README.md',
      content: `# ${projectName}\n\nCreated by Symphony. Add project-specific setup and verification notes here.\n`
    },
    {
      path: 'AGENTS.md',
      content: [
        '# Agent Instructions',
        '',
        '- Keep changes small and reversible.',
        '- Run the documented verification commands before reporting completion.',
        ''
      ].join('\n')
    }
  ];

  if (template === 'empty') {
    return common;
  }

  if (template === 'node-cli') {
    return [
      ...common,
      {
        path: 'package.json',
        content: `${JSON.stringify({
          name: packageNameFor(projectName),
          version: '0.1.0',
          private: true,
          type: 'module',
          bin: {
            [packageNameFor(projectName)]: 'scripts/cli.js'
          },
          scripts: {
            check: 'node --check scripts/cli.js',
            test: 'node --test'
          }
        }, null, 2)}\n`
      },
      {
        path: join('scripts', 'cli.js'),
        content: '#!/usr/bin/env node\n\nconsole.log("hello from ' + projectName + '");\n'
      }
    ];
  }

  return [
    ...common,
    {
      path: 'package.json',
      content: `${JSON.stringify({
        name: packageNameFor(projectName),
        version: '0.1.0',
        private: true,
        type: 'module',
        scripts: {
          check: 'node --check src/main.js',
          test: 'node --test'
        }
      }, null, 2)}\n`
    },
    {
      path: join('src', 'main.js'),
      content: 'document.querySelector("#app").textContent = "Symphony web app";\n'
    },
    {
      path: 'index.html',
      content: [
        '<!doctype html>',
        '<html lang="en">',
        '<head>',
        '  <meta charset="utf-8">',
        '  <meta name="viewport" content="width=device-width, initial-scale=1">',
        `  <title>${projectName}</title>`,
        '</head>',
        '<body>',
        '  <main id="app"></main>',
        '  <script type="module" src="./src/main.js"></script>',
        '</body>',
        '</html>',
        ''
      ].join('\n')
    }
  ];
}

async function inspectTargetDirectory(targetDir) {
  try {
    const metadata = await stat(targetDir);

    if (!metadata.isDirectory()) {
      throw new ScaffoldError('target path exists and is not a directory');
    }

    return {
      exists: true,
      empty: (await readdir(targetDir)).length === 0
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return {
        exists: false,
        empty: true
      };
    }

    throw error;
  }
}

async function runGitInit({ targetDir, runner }) {
  try {
    const result = await runner.run({
      executable: 'git',
      args: ['init'],
      cwd: targetDir
    });

    return {
      attempted: true,
      status: result.exitCode === 0 ? 'passed' : 'failed',
      exitCode: result.exitCode,
      stderr: result.stderr ?? ''
    };
  } catch (error) {
    return {
      attempted: true,
      status: 'failed',
      exitCode: null,
      stderr: error.message
    };
  }
}

function assertTemplate(template) {
  if (!SCAFFOLD_TEMPLATES.has(template)) {
    throw new ScaffoldError('template must be one of: empty, node-cli, web-app');
  }
}

function basenameForProject(targetDir) {
  const parts = String(targetDir).split(/[\\/]+/u).filter(Boolean);

  return parts.at(-1) ?? 'symphony-project';
}

function packageNameFor(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'symphony-project';
}

function assertNonEmptyString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ScaffoldError(`${field} must be a non-empty string`);
  }
}
