import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';

export class NodeProcessRunner {
  start({
    executable,
    args = [],
    cwd,
    stdin = '',
    env = {},
    timeoutMs = 300000,
    timeoutKillDelayMs = 5000,
    stallTimeoutMs = 0,
    onActivity,
    outputFiles = {}
  }) {
    assertNonEmptyString(executable, 'executable');

    if (!Array.isArray(args)) {
      throw new TypeError('args must be an array');
    }

    const startedAt = Date.now();
    const child = spawn(executable, args, {
      cwd,
      env: childProcessEnvironment(env),
      stdio: ['pipe', 'pipe', 'pipe']
    });
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let cancelled = false;
    let stalled = false;
    let killedAfterTimeout = false;
    let killTimeout;
    let stallCheck;
    let lastActivityAt = startedAt;
    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
      killTimeout = setTimeout(() => {
        killedAfterTimeout = true;
        child.kill('SIGKILL');
      }, timeoutKillDelayMs);
    }, timeoutMs);

    if (stallTimeoutMs > 0) {
      const intervalMs = Math.min(Math.max(Math.floor(stallTimeoutMs / 3), 1), 60000);

      stallCheck = setInterval(() => {
        if (Date.now() - lastActivityAt <= stallTimeoutMs) {
          return;
        }

        stalled = true;
        child.kill('SIGTERM');
        clearInterval(stallCheck);
        killTimeout = setTimeout(() => {
          killedAfterTimeout = true;
          child.kill('SIGKILL');
        }, timeoutKillDelayMs);
      }, intervalMs);
    }

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
      lastActivityAt = Date.now();
      emitActivity({ onActivity, type: 'stdout', chunk, timestamp: lastActivityAt });
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
      lastActivityAt = Date.now();
      emitActivity({ onActivity, type: 'stderr', chunk, timestamp: lastActivityAt });
    });

    const result = new Promise((resolve, reject) => {
      child.on('error', (error) => {
        clearTimeout(timeout);
        clearInterval(stallCheck);
        clearTimeout(killTimeout);
        reject(error);
      });
      child.on('close', async (exitCode, signal) => {
        clearTimeout(timeout);
        clearInterval(stallCheck);
        clearTimeout(killTimeout);
        let capturedOutputFiles;

        try {
          capturedOutputFiles = await readOutputFiles(outputFiles);
        } catch (error) {
          reject(error);
          return;
        }

        resolve({
          exitCode,
          signal,
          stdout,
          stderr,
          durationMs: Date.now() - startedAt,
          timedOut,
          cancelled,
          stalled,
          killedAfterTimeout,
          outputFiles: capturedOutputFiles
        });
      });
    });

    child.stdin.end(stdin);

    return {
      pid: child.pid,
      result,
      cancel(signal = 'SIGTERM') {
        cancelled = true;
        clearInterval(stallCheck);
        child.kill(signal);

        return {
          status: 'cancelled',
          signal
        };
      }
    };
  }

  async run(invocation) {
    return this.start(invocation).result;
  }
}

function childProcessEnvironment(overrides) {
  const childEnv = { ...process.env };

  delete childEnv.NODE_TEST_CONTEXT;

  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) {
      delete childEnv[key];
    } else {
      childEnv[key] = value;
    }
  }

  return childEnv;
}

function emitActivity({ onActivity, type, chunk, timestamp }) {
  if (typeof onActivity !== 'function') {
    return;
  }

  onActivity({
    type,
    chunk,
    timestamp: new Date(timestamp).toISOString()
  });
}

async function readOutputFiles(outputFiles) {
  if (outputFiles === null || typeof outputFiles !== 'object' || Array.isArray(outputFiles)) {
    throw new TypeError('outputFiles must be an object');
  }

  const captured = {};

  for (const [name, path] of Object.entries(outputFiles)) {
    if (typeof path !== 'string' || path.trim() === '') {
      continue;
    }

    try {
      captured[name] = {
        path,
        content: await readFile(path, 'utf8')
      };
    } catch (error) {
      captured[name] = {
        path,
        error: error.message
      };
    }
  }

  return captured;
}

function assertNonEmptyString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${field} must be a non-empty string`);
  }
}
