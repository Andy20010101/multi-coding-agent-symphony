import { spawnSync } from 'node:child_process';
import { constants } from 'node:fs';
import { access, chmod, mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('v7 curl installer', () => {
  it('documents a curl-installable POSIX shell entrypoint', async () => {
    const installerPath = resolve('install.sh');
    const installer = await readFile(installerPath, 'utf8');
    const installerStat = await stat(installerPath);

    assert.match(installer, /^#!\/bin\/sh/);
    assert.match(installer, /MCAS_INSTALL_REF:-v7/);
    assert.match(installer, /MCAS_REPO_SLUG/);
    assert.match(installer, /MCAS_INSTALL_DIR/);
    assert.match(installer, /MCAS_BIN_DIR/);
    assert.match(installer, /gh repo clone/);
    assert.match(installer, /symphony scripts\/symphony\.js/);
    assert.match(installer, /mcas scripts\/mcas\.js/);
    assert.doesNotMatch(installer, /pnpm link --global/);
    assert.notEqual(installerStat.mode & constants.S_IXUSR, 0);
  });

  it('installs shims into an isolated bin dir and runs from another project', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-installer-'));
    const repoDir = join(root, 'fixture-repo');
    const installDir = join(root, 'share', 'mcas');
    const binDir = join(root, 'bin');
    const projectDir = join(root, 'target-project');
    const symphonyMarkerPath = join(root, 'symphony-doctor-marker.json');
    const mcasMarkerPath = join(root, 'mcas-doctor-marker.json');

    try {
      await createFixtureRepo(repoDir);
      await mkdir(projectDir, { recursive: true });

      const install = spawnSync('sh', ['install.sh'], {
        cwd: process.cwd(),
        env: {
          ...process.env,
          MCAS_REPO_URL: repoDir,
          MCAS_INSTALL_REF: 'main',
          MCAS_INSTALL_DIR: installDir,
          MCAS_BIN_DIR: binDir,
          MCAS_SKIP_INSTALL: '1',
          MCAS_SKIP_DOCTOR: '1'
        },
        encoding: 'utf8'
      });

      assert.equal(install.status, 0, install.stderr || install.stdout);

      const symphony = join(binDir, 'symphony');
      const mcas = join(binDir, 'mcas');

      await access(symphony, constants.X_OK);
      await access(mcas, constants.X_OK);

      assert.match(await readFile(symphony, 'utf8'), /scripts\/symphony\.js/);
      assert.match(await readFile(mcas, 'utf8'), /scripts\/mcas\.js/);

      const doctor = spawnSync(symphony, ['doctor'], {
        cwd: projectDir,
        env: {
          ...process.env,
          MCAS_INSTALLER_DOCTOR_MARKER: symphonyMarkerPath,
          PATH: `${binDir}:${process.env.PATH ?? ''}`
        },
        encoding: 'utf8'
      });

      assert.equal(doctor.status, 0, doctor.stderr || doctor.stdout);

      const symphonyMarker = JSON.parse(await readFile(symphonyMarkerPath, 'utf8'));
      assert.equal(symphonyMarker.status, 'ok');
      assert.equal(symphonyMarker.cwd, projectDir);
      assert.deepEqual(symphonyMarker.argv, ['doctor']);

      if (doctor.stdout.trim() !== '') {
        assert.equal(JSON.parse(doctor.stdout).status, 'ok');
      }

      const mcasDoctor = spawnSync(mcas, ['doctor'], {
        cwd: projectDir,
        env: {
          ...process.env,
          MCAS_INSTALLER_DOCTOR_MARKER: mcasMarkerPath,
          PATH: `${binDir}:${process.env.PATH ?? ''}`
        },
        encoding: 'utf8'
      });

      assert.equal(mcasDoctor.status, 0, mcasDoctor.stderr || mcasDoctor.stdout);

      const mcasMarker = JSON.parse(await readFile(mcasMarkerPath, 'utf8'));
      assert.equal(mcasMarker.status, 'ok');
      assert.equal(mcasMarker.cwd, projectDir);
      assert.deepEqual(mcasMarker.argv, ['doctor']);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});

async function createFixtureRepo(repoDir) {
  await mkdir(join(repoDir, 'scripts'), { recursive: true });
  await writeFile(join(repoDir, 'scripts', 'symphony.js'), [
    '#!/usr/bin/env node',
    'const { writeFileSync } = require("node:fs");',
    'if (process.argv[2] === "doctor") {',
    '  if (process.env.MCAS_INSTALLER_DOCTOR_MARKER) {',
    '    writeFileSync(process.env.MCAS_INSTALLER_DOCTOR_MARKER, JSON.stringify({ cwd: process.cwd(), argv: process.argv.slice(2), status: "ok" }));',
    '  }',
    '  console.log(JSON.stringify({ version: "1", status: "ok" }));',
    '  process.exit(0);',
    '}',
    'process.exit(64);',
    ''
  ].join('\n'));
  await writeFile(join(repoDir, 'scripts', 'mcas.js'), [
    '#!/usr/bin/env node',
    'const { writeFileSync } = require("node:fs");',
    'if (process.argv[2] === "doctor") {',
    '  if (process.env.MCAS_INSTALLER_DOCTOR_MARKER) {',
    '    writeFileSync(process.env.MCAS_INSTALLER_DOCTOR_MARKER, JSON.stringify({ cwd: process.cwd(), argv: process.argv.slice(2), status: "ok" }));',
    '  }',
    '  console.log(JSON.stringify({ version: "1", status: "ok" }));',
    '  process.exit(0);',
    '}',
    'process.exit(64);',
    ''
  ].join('\n'));
  await chmod(join(repoDir, 'scripts', 'symphony.js'), 0o755);
  await chmod(join(repoDir, 'scripts', 'mcas.js'), 0o755);

  runGit(['init'], repoDir);
  runGit(['checkout', '-b', 'main'], repoDir);
  runGit(['add', '.'], repoDir);
  runGit([
    '-c',
    'user.name=Installer Test',
    '-c',
    'user.email=installer-test@example.invalid',
    '-c',
    'commit.gpgsign=false',
    'commit',
    '-m',
    'fixture'
  ], repoDir);
}

function runGit(args, cwd) {
  const result = spawnSync('git', args, {
    cwd,
    encoding: 'utf8'
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
}
