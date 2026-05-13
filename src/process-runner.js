import { spawn } from 'node:child_process';

export class NodeProcessRunner {
  async run({
    executable,
    args = [],
    cwd,
    stdin = '',
    env = {},
    timeoutMs = 300000
  }) {
    assertNonEmptyString(executable, 'executable');

    if (!Array.isArray(args)) {
      throw new TypeError('args must be an array');
    }

    return new Promise((resolve, reject) => {
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
      child.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
      child.on('close', (exitCode, signal) => {
        clearTimeout(timeout);
        resolve({
          exitCode,
          signal,
          stdout,
          stderr,
          durationMs: Date.now() - startedAt,
          timedOut
        });
      });

      child.stdin.end(stdin);
    });
  }
}

function assertNonEmptyString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${field} must be a non-empty string`);
  }
}

