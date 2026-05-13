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
    outputFiles = {}
  }) {
    assertNonEmptyString(executable, 'executable');

    if (!Array.isArray(args)) {
      throw new TypeError('args must be an array');
    }

    const startedAt = Date.now();
    const child = spawn(executable, args, {
      cwd,
      env: {
        ...process.env,
        ...env
      },
      stdio: ['pipe', 'pipe', 'pipe']
    });
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let cancelled = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
    }, timeoutMs);

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });

    const result = new Promise((resolve, reject) => {
      child.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
      child.on('close', async (exitCode, signal) => {
        clearTimeout(timeout);
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
