#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
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
  const files = Object.fromEntries(await Promise.all(
    checkedFiles.map(async (path) => [path, await readFile(new URL(path, repoRootUrl), 'utf8')])
  ));
  const config = JSON.parse(files['desktop/shell/src-tauri/tauri.conf.json']);
  const cargo = files['desktop/shell/src-tauri/Cargo.toml'];
  const lib = files['desktop/shell/src-tauri/src/lib.rs'];
  const capability = JSON.parse(files['desktop/shell/src-tauri/capabilities/default.json']);

  assertEqual(config.productName, 'Symphony Desktop Shell', 'Tauri productName');
  assertEqual(config.identifier, 'dev.symphony.desktop-shell', 'Tauri identifier');
  assertEqual(config.build.devUrl, 'http://127.0.0.1:5173/workbench/desktop/', 'Tauri devUrl');
  assertEqual(config.build.frontendDist, '../../../src/symphony/workbench-static', 'Tauri frontendDist');
  assertEqual(config.app.withGlobalTauri, false, 'global Tauri exposure');
  assertEqual(config.app.windows[0].url, '/workbench/desktop/', 'Tauri window route');
  assertEqual(config.bundle.active, false, 'bundle publishing boundary');
  assertEqual(Object.hasOwn(config, 'plugins'), false, 'Tauri plugin boundary');
  assertEqual(capability.windows.includes('main'), true, 'main window capability');

  const tauriCommandNames = [...lib.matchAll(/#\[tauri::command\]\s*fn\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/gu)]
    .map((match) => match[1]);
  assertDeepEqual(tauriCommandNames, ['attach_sidecar', 'launch_sidecar'], 'fixed Rust command surface');

  assertMatch(cargo, /tauri\s*=\s*\{\s*version\s*=\s*"2"/u, 'Cargo Tauri dependency');
  assertMatch(cargo, /tauri-build\s*=\s*\{\s*version\s*=\s*"2"/u, 'Cargo Tauri build dependency');
  assertMatch(cargo, /^publish\s*=\s*false$/mu, 'Cargo publish boundary');
  assertMatch(lib, /#\[tauri::command\]\s*fn attach_sidecar/u, 'attach command');
  assertMatch(lib, /#\[tauri::command\]\s*fn launch_sidecar/u, 'launch command');
  assertMatch(lib, /tauri::generate_handler!\[\s*attach_sidecar\s*,\s*launch_sidecar\s*\]/u, 'fixed invoke handler');
  assertMatch(lib, /const LAUNCH_COMMAND_ID:\s*&str\s*=\s*"symphony\.console\.sidecar\.launch";/u, 'fixed launcher command id');
  assertMatch(lib, /Command::new\("pnpm"\)/u, 'fixed launcher program');
  assertMatch(lib, /"symphony",\s*"console",\s*"--host"/u, 'fixed sidecar launcher args');
  assertMatch(lib, /sidecar host must be 127\.0\.0\.1 or localhost/u, 'loopback host guard');
  assertMatch(lib, /MIN_PORT\.\.=MAX_PORT/u, 'port range guard');
  assertMatch(lib, /renderer_shell_execution_available:\s*false/u, 'renderer shell execution unavailable');
  assertMatch(lib, /arbitrary_command_available:\s*false/u, 'arbitrary command unavailable');
  assertMatch(lib, /arbitrary_path_available:\s*false/u, 'arbitrary path unavailable');
  assertDoesNotMatch(lib.replace(/Command::new\("pnpm"\)/gu, ''), /Command::new\(/u, 'no dynamic Command::new');
  assertDoesNotMatch(lib, /std::env::args|open_file|open_path|git\s+push|git\s+tag|release\.ready/u, 'forbidden native bridge surface');
  assertDoesNotMatch(`${JSON.stringify(config)}\n${cargo}\n${lib}`, /auto[-_]?update|tauri-plugin-updater|publishUrl|notariz|signing|codesign/iu, 'packaging and updater boundary');
  assertDoesNotMatch(Object.values(files).join('\n'), /electron/iu, 'Electron not introduced');

  process.stdout.write(`${JSON.stringify({
    contractName: 'desktop-shell-smoke.v1',
    contractVersion: 1,
    status: 'ok',
    checkedFiles,
    rendererRoute: '/workbench/desktop/',
    nativeHost: 'desktop/shell/src-tauri',
    bridge: {
      attachCommand: 'attach_sidecar',
      launchCommand: 'launch_sidecar',
      launchCommandId: 'symphony.console.sidecar.launch',
      arbitraryCommandAvailable: false,
      arbitraryPathAvailable: false,
      rendererShellExecutionAvailable: false
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

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error.message}\n`);
  process.exitCode = 1;
});
