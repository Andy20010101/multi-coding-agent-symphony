import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { readFile, readdir } from 'node:fs/promises';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const FILES = Object.freeze({
  config: 'desktop/shell/src-tauri/tauri.conf.json',
  cargo: 'desktop/shell/src-tauri/Cargo.toml',
  capability: 'desktop/shell/src-tauri/capabilities/default.json',
  lib: 'desktop/shell/src-tauri/src/lib.rs',
  readme: 'desktop/shell/README.md',
  smoke: 'scripts/desktop-shell-smoke.js'
});

describe('v71 native packaging for personal use', () => {
  it('keeps Tauri packaging scoped to local personal use', async () => {
    const config = JSON.parse(await readFile(FILES.config, 'utf8'));
    const serializedConfig = JSON.stringify(config);

    assert.equal(config.productName, 'Symphony Desktop Shell');
    assert.equal(config.version, '0.1.0');
    assert.equal(config.identifier, 'dev.symphony.desktop-shell');
    assert.equal(config.build.beforeBuildCommand, 'pnpm --dir ../../.. workbench:build');
    assert.equal(config.build.frontendDist, '../../../src/symphony/workbench-static');
    assert.equal(config.app.windows.length, 1);
    assert.equal(config.app.windows[0].url, '/workbench/desktop/');
    assert.equal(config.app.withGlobalTauri, false);
    assertLocalPersonalUseBundle(config.bundle);

    assert.equal(Object.hasOwn(config, 'plugins'), false);
    assert.equal(Object.hasOwn(config.bundle, 'externalBin'), false);
    assert.equal(Object.hasOwn(config.bundle, 'resources'), false);
    assertDoesNotHaveForbiddenKeys(config, [
      'active',
      'beforeBundleCommand',
      'certificateThumbprint',
      'certificateUrl',
      'createUpdaterArtifacts',
      'dmg',
      'endpoint',
      'endpoints',
      'entitlements',
      'externalBin',
      'licenseFile',
      'macOS',
      'minimumSystemVersion',
      'nsis',
      'plugins',
      'privateKey',
      'provider',
      'pubkey',
      'publishUrl',
      'publisher',
      'resources',
      'signCommand',
      'signature',
      'targets',
      'updater',
      'windows'
    ], new Set(['bundle.active', 'bundle.targets', 'app.windows']));
    assert.doesNotMatch(serializedConfig, /auto[-_]?update|notariz|publishUrl|privateKey|pubkey|certificate|signCommand|signature/iu);
  });

  it('keeps native capabilities and Rust commands narrow', async () => {
    const [capabilityFiles, capabilityText, cargo, lib] = await Promise.all([
      readdir('desktop/shell/src-tauri/capabilities/'),
      readFile(FILES.capability, 'utf8'),
      readFile(FILES.cargo, 'utf8'),
      readFile(FILES.lib, 'utf8')
    ]);
    const capability = JSON.parse(capabilityText);
    const commandNames = [...lib.matchAll(/#\[tauri::command\]\s*fn\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/gu)]
      .map((match) => match[1]);

    assert.deepEqual(capabilityFiles.sort(), ['default.json']);
    assert.deepEqual(capability.windows, ['main']);
    assert.deepEqual(capability.permissions, ['core:default']);
    assert.deepEqual(commandNames, ['attach_sidecar', 'launch_sidecar']);
    assert.match(lib, /tauri::generate_handler!\[\s*attach_sidecar\s*,\s*launch_sidecar\s*\]/u);
    assert.match(lib, /Command::new\("pnpm"\)\s*\.args\(\[\s*"symphony",\s*"console",\s*"--host",\s*target\.host\.as_str\(\),\s*"--port",\s*port_text\.as_str\(\),\s*\]\)/u);
    assert.equal([...lib.matchAll(/Command::new\(/gu)].length, 1);
    assert.equal([...lib.matchAll(/\.spawn\(/gu)].length, 1);
    assert.doesNotMatch(lib.replace(/Command::new\("pnpm"\)/gu, ''), /Command::new\(/u);
    assert.doesNotMatch(lib, /std::env::args|std::fs|File::open|open_path|open_url|plugin_shell|plugin_fs|plugin_opener|git\s+push|git\s+tag|release[_-]?automation/iu);
    assert.match(cargo, /^publish\s*=\s*false$/mu);
    assert.deepEqual(readCargoDependencyNames(cargo, 'dependencies'), ['serde', 'tauri']);
    assert.deepEqual(readCargoDependencyNames(cargo, 'build-dependencies'), ['tauri-build']);
    assert.doesNotMatch(cargo, /tauri-plugin-(shell|fs|opener|updater|process)/iu);
  });

  it('reports personal-use packaging boundaries from the shell smoke command', async () => {
    const { stdout } = await execFileAsync('node', ['scripts/desktop-shell-smoke.js']);
    const report = JSON.parse(stdout);

    assert.equal(report.contractName, 'desktop-shell-smoke.v1');
    assert.equal(report.status, 'ok');
    assert.equal(report.packaging.localPersonalUseOnly, true);
    assert.equal(report.packaging.autoUpdateAvailable, false);
    assert.equal(report.packaging.publishAvailable, false);
    assert.equal(report.packaging.signingClaimAvailable, false);
    assert.equal(report.packaging.notarizationClaimAvailable, false);
    assert.equal(report.bridge.arbitraryCommandAvailable, false);
    assert.equal(report.bridge.arbitraryPathAvailable, false);
    assert.equal(report.bridge.genericShellRunnerAvailable, false);
    assert.equal(report.bridge.gitWriteAvailable, false);
    assert.equal(report.bridge.releaseWriteAvailable, false);
  });

  it('keeps operator docs explicit about non-distribution scope', async () => {
    const [readme, smoke] = await Promise.all([
      readFile(FILES.readme, 'utf8'),
      readFile(FILES.smoke, 'utf8')
    ]);

    assert.match(readme, /Distribution packaging remains off/u);
    assert.match(readme, /not produce or validate a signed app, notarized app, auto-update channel, publish endpoint, or release automation/u);
    assert.match(smoke, /localPersonalUseOnly/u);
    assert.doesNotMatch(readme, /GitHub Release asset upload is enabled|public DMG is supported|notarized distribution is ready|auto-update channel is ready/iu);
  });
});

function assertLocalPersonalUseBundle(bundle) {
  assert.ok(bundle && typeof bundle === 'object', 'bundle config is required');
  if (bundle.active === false) {
    assert.deepEqual(bundle.targets, 'all');
    return;
  }

  assert.equal(bundle.active, true);
  assert.deepEqual(bundle.targets, ['app']);
}

function assertDoesNotHaveForbiddenKeys(value, forbiddenKeys, allowedPaths, path = '') {
  if (value === null || typeof value !== 'object') {
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    const childPath = path ? `${path}.${key}` : key;
    if (forbiddenKeys.includes(key) && !allowedPaths.has(childPath)) {
      throw new Error(`forbidden Tauri config key ${childPath} was found`);
    }
    assertDoesNotHaveForbiddenKeys(child, forbiddenKeys, allowedPaths, childPath);
  }
}

function readCargoDependencyNames(cargo, sectionName) {
  const sectionPattern = new RegExp(`(?:^|\\n)\\[${sectionName}\\]\\n(?<body>[\\s\\S]*?)(?=\\n\\[|$)`, 'u');
  const match = sectionPattern.exec(cargo);
  if (!match?.groups?.body) {
    throw new Error(`Cargo ${sectionName} section was not found`);
  }
  return match.groups.body
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => line.split('=')[0].trim())
    .sort();
}
