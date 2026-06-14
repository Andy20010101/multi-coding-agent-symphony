#!/usr/bin/env node

import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));
const repoRootUrl = pathToFileURL(repoRoot);
const checkedFiles = Object.freeze([
  'desktop/shell/src-tauri/tauri.conf.json',
  'desktop/shell/src-tauri/Cargo.toml',
  'desktop/shell/src-tauri/build.rs',
  'desktop/shell/src-tauri/src/lib.rs',
  'desktop/shell/src-tauri/src/main.rs',
  'desktop/shell/src-tauri/capabilities/default.json'
]);

async function main() {
  const [files, capabilityFiles] = await Promise.all([
    readCheckedFiles(),
    readdir(new URL('desktop/shell/src-tauri/capabilities/', repoRootUrl))
  ]);
  const config = JSON.parse(files['desktop/shell/src-tauri/tauri.conf.json']);
  const cargo = files['desktop/shell/src-tauri/Cargo.toml'];
  const lib = files['desktop/shell/src-tauri/src/lib.rs'];
  const capability = JSON.parse(files['desktop/shell/src-tauri/capabilities/default.json']);
  const build = files['desktop/shell/src-tauri/build.rs'];
  const mainRs = files['desktop/shell/src-tauri/src/main.rs'];

  assertEqual(config.productName, 'Symphony Desktop Shell', 'Tauri productName');
  assertEqual(config.identifier, 'dev.symphony.desktop-shell', 'Tauri identifier');
  assertEqual(config.build.devUrl, 'http://127.0.0.1:5173/workbench/desktop/', 'Tauri devUrl');
  assertEqual(config.build.beforeDevCommand, 'pnpm --dir ../../.. workbench:dev', 'Tauri beforeDevCommand');
  assertEqual(config.build.beforeBuildCommand, 'pnpm --dir ../../.. workbench:build', 'Tauri beforeBuildCommand');
  assertEqual(config.build.frontendDist, '../../../src/symphony/workbench-static', 'Tauri frontendDist');
  assertEqual(config.app.withGlobalTauri, false, 'global Tauri exposure');
  assertEqual(config.app.windows.length, 1, 'Tauri window count');
  assertEqual(config.app.windows[0].label, 'main', 'Tauri window label');
  assertEqual(config.app.windows[0].title, 'Symphony Desktop Shell', 'Tauri window title');
  assertEqual(config.app.windows[0].url, '/workbench/desktop/', 'Tauri window route');
  assertEqual(config.app.windows[0].resizable, true, 'Tauri window resizable boundary');
  assertEqual(config.app.windows[0].minWidth, 960, 'Tauri window minimum width');
  assertEqual(config.app.windows[0].minHeight, 640, 'Tauri window minimum height');
  assertEqual(config.app.security.csp, "default-src 'self'; connect-src 'self' http://127.0.0.1:* http://localhost:*; img-src 'self' data:; style-src 'self' 'unsafe-inline'", 'Tauri CSP boundary');
  assertEqual(config.bundle.active, false, 'bundle publishing boundary');
  assertEqual(Object.hasOwn(config, 'plugins'), false, 'Tauri plugin boundary');
  assertEqual(Object.hasOwn(config.bundle, 'externalBin'), false, 'Tauri external binary boundary');
  assertEqual(Object.hasOwn(config.bundle, 'resources'), false, 'Tauri bundled resources boundary');
  assertDeepEqual(config.bundle.targets, 'all', 'bundle target placeholder');
  assertDeepEqual(capabilityFiles, ['default.json'], 'capability file boundary');
  assertEqual(capability.identifier, 'desktop-shell', 'capability identifier');
  assertDeepEqual(capability.windows, ['main'], 'main window capability');
  assertDeepEqual(capability.permissions, ['core:default'], 'capability permission boundary');
  assertDoesNotHaveForbiddenKeys(config, [
    'active',
    'beforeBundleCommand',
    'certificateThumbprint',
    'certificateUrl',
    'createUpdaterArtifacts',
    'endpoint',
    'endpoints',
    'nsis',
    'plugins',
    'privateKey',
    'provider',
    'pubkey',
    'publishUrl',
    'publisher',
    'signCommand',
    'signature',
    'targets',
    'updater',
    'windows'
  ], new Set(['bundle.active', 'bundle.targets', 'app.windows']));

  const tauriCommandNames = [...lib.matchAll(/#\[tauri::command\]\s*fn\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/gu)]
    .map((match) => match[1]);
  assertDeepEqual(tauriCommandNames, ['attach_sidecar', 'launch_sidecar'], 'fixed Rust command surface');

  assertMatch(cargo, /^name\s*=\s*"symphony-desktop-shell"$/mu, 'Cargo package name');
  assertMatch(cargo, /tauri\s*=\s*\{\s*version\s*=\s*"2"/u, 'Cargo Tauri dependency');
  assertMatch(cargo, /tauri-build\s*=\s*\{\s*version\s*=\s*"2"/u, 'Cargo Tauri build dependency');
  assertMatch(cargo, /^publish\s*=\s*false$/mu, 'Cargo publish boundary');
  assertDeepEqual(readCargoDependencyNames(cargo, 'dependencies'), ['serde', 'tauri'], 'Cargo runtime dependency boundary');
  assertDeepEqual(readCargoDependencyNames(cargo, 'build-dependencies'), ['tauri-build'], 'Cargo build dependency boundary');
  assertMatch(lib, /#\[tauri::command\]\s*fn attach_sidecar/u, 'attach command');
  assertMatch(lib, /#\[tauri::command\]\s*fn launch_sidecar/u, 'launch command');
  assertMatch(lib, /tauri::generate_handler!\[\s*attach_sidecar\s*,\s*launch_sidecar\s*\]/u, 'fixed invoke handler');
  assertMatch(lib, /const LAUNCH_COMMAND_ID:\s*&str\s*=\s*"symphony\.console\.sidecar\.launch";/u, 'fixed launcher command id');
  assertMatch(lib, /const DEFAULT_HOST:\s*&str\s*=\s*"127\.0\.0\.1";/u, 'default loopback host');
  assertMatch(lib, /const DEFAULT_PORT:\s*u16\s*=\s*8765;/u, 'default sidecar port');
  assertMatch(lib, /const MIN_PORT:\s*u16\s*=\s*1024;/u, 'minimum allowed sidecar port');
  assertMatch(lib, /const MAX_PORT:\s*u16\s*=\s*65535;/u, 'maximum allowed sidecar port');
  assertMatch(lib, /Command::new\("pnpm"\)/u, 'fixed launcher program');
  assertMatch(
    lib,
    /Command::new\("pnpm"\)\s*\.args\(\[\s*"symphony",\s*"console",\s*"--host",\s*target\.host\.as_str\(\),\s*"--port",\s*port_text\.as_str\(\),\s*\]\)/u,
    'fixed sidecar launcher args'
  );
  assertMatch(lib, /\.current_dir\(repo_root\(\)\)/u, 'launcher repo-root working directory');
  assertMatch(lib, /\.stdin\(Stdio::null\(\)\)\s*\.stdout\(Stdio::null\(\)\)\s*\.stderr\(Stdio::null\(\)\)/u, 'launcher stdio boundary');
  assertMatch(lib, /sidecar host must be 127\.0\.0\.1 or localhost/u, 'loopback host guard');
  assertMatch(lib, /DEFAULT_HOST => DEFAULT_HOST\.to_string\(\),\s*"localhost" => "localhost"\.to_string\(\),\s*_ => return Err/u, 'fixed host allowlist');
  assertMatch(lib, /MIN_PORT\.\.=MAX_PORT/u, 'port range guard');
  assertMatch(lib, /renderer_launch_available:\s*false/u, 'renderer launch unavailable');
  assertMatch(lib, /renderer_shell_execution_available:\s*false/u, 'renderer shell execution unavailable');
  assertMatch(lib, /generic_shell_runner_available:\s*false/u, 'generic shell runner unavailable');
  assertMatch(lib, /arbitrary_command_available:\s*false/u, 'arbitrary command unavailable');
  assertMatch(lib, /arbitrary_path_available:\s*false/u, 'arbitrary path unavailable');
  assertMatch(lib, /model_invocation_available:\s*false/u, 'model invocation unavailable');
  assertMatch(lib, /git_write_available:\s*false/u, 'git write unavailable');
  assertMatch(lib, /release_write_available:\s*false/u, 'release write unavailable');
  assertEqual(countMatches(lib, /Command::new\(/gu), 1, 'native process spawn boundary');
  assertEqual(countMatches(lib, /\.spawn\(/gu), 1, 'native spawn call boundary');
  assertEqual(countMatches(lib, /#\[tauri::command\]/gu), 2, 'Tauri command macro count');
  assertDoesNotMatch(lib.replace(/Command::new\("pnpm"\)/gu, ''), /Command::new\(/u, 'no dynamic Command::new');
  assertMatch(build, /tauri_build::build\(\)/u, 'minimal Tauri build script');
  assertDoesNotMatch(build, /Command::new|before_bundle|sign|notariz|publish|release/iu, 'build script packaging boundary');
  assertMatch(mainRs, /symphony_desktop_shell_lib::run\(\);/u, 'minimal Tauri binary entry');
  assertDoesNotMatch(mainRs, /Command::new|std::env::args|tauri::command/u, 'binary entry boundary');
  assertDoesNotMatch(lib, /std::env::args|std::fs|File::open|fs::read_to_string|write_all\([^f]|open_file|open_path|open_url|plugin_shell|plugin_fs|plugin_opener|git\s+push|git\s+tag|release\.ready/u, 'forbidden native bridge surface');
  assertDoesNotMatch(cargo, /tauri-plugin-(shell|fs|opener|updater|process)/iu, 'forbidden Tauri plugin dependency boundary');
  assertDoesNotMatch(`${JSON.stringify(config)}\n${cargo}\n${lib}\n${build}\n${mainRs}`, /auto[-_]?update|tauri-plugin-updater|publishUrl|notariz|signing|codesign|provider\s*=|api[_-]?key|token|release[_-]?automation/iu, 'packaging and updater boundary');
  assertDoesNotMatch(Object.values(files).join('\n'), /electron/iu, 'Electron not introduced');

  process.stdout.write(`${JSON.stringify({
    contractName: 'desktop-shell-smoke.v1',
    contractVersion: 1,
    status: 'ok',
    checkedFiles,
    rendererRoute: '/workbench/desktop/',
    nativeHost: 'desktop/shell/src-tauri',
    localLaunch: {
      appHomeRoute: '/workbench/desktop/',
      devUrl: 'http://127.0.0.1:5173/workbench/desktop/',
      beforeDevCommand: 'pnpm --dir ../../.. workbench:dev',
      beforeBuildCommand: 'pnpm --dir ../../.. workbench:build',
      hostBuildCheckCommand: 'cargo check --manifest-path desktop/shell/src-tauri/Cargo.toml --target-dir tmp/tauri-target',
      fullNativeBundleRequiredForSmoke: false,
      expectedSidecarStates: [
        'attached',
        'launchable',
        'launching',
        'failed',
        'wrong-port',
        'stale',
        'unavailable'
      ]
    },
    bridge: {
      attachCommand: 'attach_sidecar',
      launchCommand: 'launch_sidecar',
      launchCommandId: 'symphony.console.sidecar.launch',
      launchShape: 'pnpm symphony console --host <loopback> --port <allowed-port>',
      allowedHosts: ['127.0.0.1', 'localhost'],
      allowedPortRange: { min: 1024, max: 65535 },
      arbitraryCommandAvailable: false,
      arbitraryPathAvailable: false,
      genericShellRunnerAvailable: false,
      gitWriteAvailable: false,
      modelInvocationAvailable: false,
      releaseWriteAvailable: false,
      rendererShellExecutionAvailable: false
    },
    capability: {
      files: capabilityFiles,
      windows: capability.windows,
      permissions: capability.permissions
    },
    packaging: {
      bundleActive: false,
      cargoPublish: false,
      autoUpdateAvailable: false,
      publishAvailable: false,
      signingClaimAvailable: false,
      notarizationClaimAvailable: false
    }
  }, null, 2)}\n`);
}

async function readCheckedFiles() {
  return Object.fromEntries(await Promise.all(
    checkedFiles.map(async (path) => [path, await readFile(new URL(path, repoRootUrl), 'utf8')])
  ));
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label} expected ${JSON.stringify(expected)} but received ${JSON.stringify(actual)}`);
  }
}

function assertDeepEqual(actual, expected, label) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${label} expected ${JSON.stringify(expected)} but received ${JSON.stringify(actual)}`);
  }
}

function assertMatch(text, pattern, label) {
  if (!pattern.test(text)) {
    throw new Error(`${label} was not found`);
  }
}

function assertDoesNotMatch(text, pattern, label) {
  if (pattern.test(text)) {
    throw new Error(`${label} failed`);
  }
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

function countMatches(text, pattern) {
  return [...text.matchAll(pattern)].length;
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error.message}\n`);
  process.exitCode = 1;
});
