import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export async function analyzePackage({ projectDir, inventory }) {
  const packagePath = join(projectDir, 'package.json');
  let packageJson;

  try {
    packageJson = JSON.parse(await readFile(packagePath, 'utf8'));
  } catch {
    packageJson = null;
  }

  const packageManager = detectPackageManager({ packageJson, files: inventory.files });
  const scripts = plainStringMap(packageJson?.scripts);
  const bins = detectBins(packageJson?.bin);
  const verificationCommands = detectVerificationCommands({
    packageManager,
    scripts
  });

  return {
    packageJson,
    runtime: {
      packageManager,
      nodeEngine: typeof packageJson?.engines?.node === 'string' ? packageJson.engines.node : null,
      scripts,
      bins,
      verificationCommands
    }
  };
}

function detectPackageManager({ packageJson, files }) {
  if (typeof packageJson?.packageManager === 'string' && packageJson.packageManager.trim() !== '') {
    return packageJson.packageManager;
  }

  if (files.includes('pnpm-lock.yaml')) {
    return 'pnpm';
  }

  if (files.includes('package-lock.json')) {
    return 'npm';
  }

  if (files.includes('yarn.lock')) {
    return 'yarn';
  }

  if (files.includes('bun.lockb')) {
    return 'bun';
  }

  return packageJson ? 'npm' : null;
}

function detectBins(bin) {
  if (typeof bin === 'string') {
    return ['package'];
  }

  if (bin && typeof bin === 'object' && !Array.isArray(bin)) {
    return Object.keys(bin).sort();
  }

  return [];
}

function plainStringMap(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([, script]) => typeof script === 'string')
      .sort(([left], [right]) => left.localeCompare(right))
  );
}

function detectVerificationCommands({ packageManager, scripts }) {
  const runner = commandRunner(packageManager);
  const preferred = [
    'check',
    'lint',
    'typecheck',
    'test',
    'test:unit',
    'test:mutation:gate'
  ];
  const commands = [];

  for (const script of preferred) {
    if (scripts[script] !== undefined) {
      commands.push(`${runner} ${script}`);
    }
  }

  return [...new Set(commands)];
}

function commandRunner(packageManager) {
  if (typeof packageManager !== 'string') {
    return 'npm run';
  }

  if (packageManager.startsWith('pnpm')) {
    return 'pnpm';
  }

  if (packageManager.startsWith('yarn')) {
    return 'yarn';
  }

  if (packageManager.startsWith('bun')) {
    return 'bun run';
  }

  return 'npm run';
}
