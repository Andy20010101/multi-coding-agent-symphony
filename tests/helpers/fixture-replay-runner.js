import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const helperDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(helperDir, '../..');

export class FixtureReplayProcessRunner {
  constructor(recording) {
    if (recording === null || typeof recording !== 'object' || Array.isArray(recording)) {
      throw new TypeError('recording must be an object');
    }

    if (recording.processResult === null || typeof recording.processResult !== 'object') {
      throw new TypeError('recording.processResult must be an object');
    }

    this.recording = structuredClone(recording);
  }

  static async fromFixture(path) {
    const fixturePath = resolve(repoRoot, path);
    const recording = JSON.parse(await readFile(fixturePath, 'utf8'));

    return new FixtureReplayProcessRunner(recording);
  }

  async run() {
    return replayResult(this.recording.processResult);
  }
}

function replayResult(processResult) {
  return {
    exitCode: processResult.exitCode,
    ...(Object.hasOwn(processResult, 'signal') ? { signal: processResult.signal } : {}),
    stdout: processResult.stdout ?? '',
    stderr: processResult.stderr ?? '',
    durationMs: processResult.durationMs ?? 0,
    timedOut: processResult.timedOut ?? false,
    ...(Object.hasOwn(processResult, 'cancelled') ? { cancelled: processResult.cancelled } : {}),
    ...(processResult.outputFiles ? { outputFiles: structuredClone(processResult.outputFiles) } : {})
  };
}
