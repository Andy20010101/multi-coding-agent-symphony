import { open, readdir, readFile, stat } from 'node:fs/promises';
import { basename, dirname, extname, join, relative, sep } from 'node:path';

export const INTAKE_IGNORED_ROOTS = [
  '.git',
  'node_modules',
  '.pnpm-store',
  'tmp',
  '.mcas',
  '.omx/logs',
  'coverage',
  '.stryker-tmp'
];

export const DEFAULT_INTAKE_LIMITS = {
  maxFiles: 5000,
  maxBytesPerTextFile: 256 * 1024,
  maxDepth: 8
};

const DOC_FILENAMES = new Set([
  'README.md',
  'AGENTS.md',
  'CONTRIBUTING.md',
  'LICENSE'
]);
const CONFIG_FILENAMES = new Set([
  'package.json',
  'pnpm-lock.yaml',
  'package-lock.json',
  'yarn.lock',
  'bun.lockb',
  'tsconfig.json',
  'jsconfig.json',
  'mcas.config.json',
  'stryker.config.mjs'
]);
const SOURCE_ROOTS = new Set(['src', 'scripts', 'tests', 'docs', 'features', 'fixtures', 'plugins']);
const TEXT_EXTENSIONS = new Set([
  '.js',
  '.json',
  '.md',
  '.mjs',
  '.cjs',
  '.ts',
  '.tsx',
  '.jsx',
  '.yml',
  '.yaml',
  '.txt'
]);

export async function collectFileInventory({
  projectDir,
  limits = DEFAULT_INTAKE_LIMITS
}) {
  const files = [];
  const directories = new Set();
  const ignoredRoots = [...INTAKE_IGNORED_ROOTS];
  const normalizedLimits = {
    ...DEFAULT_INTAKE_LIMITS,
    ...limits
  };
  let truncated = false;

  async function visit(directory, depth) {
    if (files.length >= normalizedLimits.maxFiles) {
      truncated = true;
      return;
    }

    if (depth > normalizedLimits.maxDepth) {
      truncated = true;
      return;
    }

    let entries;

    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch {
      return;
    }

    entries.sort((left, right) => left.name.localeCompare(right.name));

    for (const entry of entries) {
      const absolutePath = join(directory, entry.name);
      const relativePath = normalizeRelativePath(relative(projectDir, absolutePath));

      if (shouldIgnore(relativePath)) {
        continue;
      }

      if (entry.isDirectory()) {
        directories.add(relativePath);
        await visit(absolutePath, depth + 1);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      files.push(relativePath);

      if (files.length >= normalizedLimits.maxFiles) {
        truncated = true;
        return;
      }
    }
  }

  await visit(projectDir, 0);

  return {
    files,
    directories: [...directories].sort(),
    docs: files.filter(isDocumentationFile),
    configFiles: files.filter(isConfigFile),
    ciFiles: files.filter(isCiFile),
    sourceRoots: [...SOURCE_ROOTS].filter((root) => directories.has(root) || files.some((file) => file.startsWith(`${root}/`))),
    ignoredRoots,
    truncated,
    limits: normalizedLimits
  };
}

export async function readTextFileLimited(projectDir, relativePath, maxBytes = DEFAULT_INTAKE_LIMITS.maxBytesPerTextFile) {
  if (!isLikelyTextPath(relativePath)) {
    return '';
  }

  const absolutePath = join(projectDir, relativePath);
  const fileStat = await stat(absolutePath);

  if (fileStat.size <= maxBytes) {
    return await readFile(absolutePath, 'utf8');
  }

  const handle = await open(absolutePath, 'r');

  try {
    const buffer = Buffer.alloc(maxBytes);
    const result = await handle.read(buffer, 0, maxBytes, 0);

    return buffer.subarray(0, result.bytesRead).toString('utf8');
  } finally {
    await handle.close();
  }
}

export function normalizeRelativePath(value) {
  return value.split(sep).join('/');
}

function shouldIgnore(relativePath) {
  return INTAKE_IGNORED_ROOTS.some((root) => relativePath === root || relativePath.startsWith(`${root}/`));
}

function isDocumentationFile(file) {
  const name = basename(file);

  return DOC_FILENAMES.has(name)
    || file.startsWith('docs/')
    || file.startsWith('.omx/plans/');
}

function isConfigFile(file) {
  const name = basename(file);

  return CONFIG_FILENAMES.has(name)
    || file.startsWith('.github/')
    || dirname(file) === 'config';
}

function isCiFile(file) {
  return /^\.github\/workflows\/[^/]+\.(ya?ml)$/u.test(file)
    || /^\.circleci\/config\.ya?ml$/u.test(file)
    || file === '.gitlab-ci.yml';
}

function isLikelyTextPath(file) {
  return TEXT_EXTENSIONS.has(extname(file))
    || DOC_FILENAMES.has(basename(file))
    || file === '.gitignore';
}
