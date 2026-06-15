#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { access, stat } from 'node:fs/promises';
import { constants } from 'node:fs';
import { fileURLToPath } from 'node:url';

const srcTauriDir = fileURLToPath(new URL('../desktop/shell/src-tauri/', import.meta.url));
const appArtifactPath = 'desktop/shell/src-tauri/target/release/bundle/macos/Symphony Desktop Shell.app';
const localBuildCommand = Object.freeze([
  'pnpm',
  '--dir',
  '../../..',
  'exec',
  'tauri',
  'build',
  '--bundles',
  'app',
  '--ci',
  '--no-sign'
]);

async function main() {
  const args = process.argv.slice(2);
  if (args.length > 1 || (args.length === 1 && args[0] !== '--dry-run')) {
    throw new Error('desktop-shell local build accepts only --dry-run');
  }

  const report = buildReport(args.includes('--dry-run') ? 'dry-run' : 'build');

  if (report.mode === 'dry-run') {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    return;
  }

  await assertPrerequisites();
  await runLocalBuild();
  const artifact = await stat(new URL(`../${appArtifactPath}`, import.meta.url));
  if (!artifact.isDirectory()) {
    throw new Error(`${appArtifactPath} is not a directory`);
  }
  process.stdout.write(`${JSON.stringify({
    ...report,
    status: 'ok',
    artifact: {
      ...report.artifact,
      exists: true
    }
  }, null, 2)}\n`);
}

function buildReport(mode) {
  return {
    contractName: 'desktop-shell-local-package-build.v1',
    contractVersion: 1,
    mode,
    status: mode === 'dry-run' ? 'ready' : 'running',
    command: {
      cwd: 'desktop/shell/src-tauri',
      argv: localBuildCommand
    },
    artifact: {
      type: 'macos-app-bundle',
      path: appArtifactPath,
      exists: false
    },
    prerequisites: [
      'macOS host',
      'Node.js and pnpm',
      'Rust toolchain with cargo',
      '@tauri-apps/cli from repo devDependencies'
    ],
    boundaries: {
      localPersonalUseOnly: true,
      bundleTarget: 'app',
      noDmg: true,
      noNotarization: true,
      noAutoUpdate: true,
      noReleaseAssets: true,
      noSigningSecrets: true
    }
  };
}

async function assertPrerequisites() {
  if (process.platform !== 'darwin') {
    throw new Error('desktop-shell local package build requires macOS for the .app bundle');
  }
  await access(new URL('../node_modules/.bin/tauri', import.meta.url), constants.X_OK);
  await access(new URL('../desktop/shell/src-tauri/Cargo.toml', import.meta.url), constants.R_OK);
}

async function runLocalBuild() {
  await new Promise((resolve, reject) => {
    const child = spawn(localBuildCommand[0], localBuildCommand.slice(1), {
      cwd: srcTauriDir,
      stdio: 'inherit',
      env: {
        ...process.env,
        CI: '1'
      }
    });
    child.on('error', reject);
    child.on('exit', (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`desktop-shell local build failed with ${signal ?? `exit code ${code}`}`));
    });
  });
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error.message}\n`);
  process.exitCode = 1;
});
