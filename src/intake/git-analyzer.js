import { NodeProcessRunner } from '../process-runner.js';

export async function analyzeGit({ projectDir, runner = new NodeProcessRunner() }) {
  try {
    const inside = await runner.run({
      executable: 'git',
      args: ['rev-parse', '--is-inside-work-tree'],
      cwd: projectDir,
      timeoutMs: 10000
    });

    if (inside.exitCode !== 0 || inside.stdout.trim() !== 'true') {
      return {
        isRepository: false
      };
    }

    const [branch, head, status] = await Promise.all([
      runGit(runner, projectDir, ['branch', '--show-current']),
      runGit(runner, projectDir, ['rev-parse', '--short', 'HEAD']),
      runGit(runner, projectDir, ['status', '--porcelain'])
    ]);

    return {
      isRepository: true,
      branch: branch.stdout.trim() || 'HEAD',
      head: head.stdout.trim(),
      dirty: status.stdout.trim() !== ''
    };
  } catch {
    return {
      isRepository: false
    };
  }
}

function runGit(runner, cwd, args) {
  return runner.run({
    executable: 'git',
    args,
    cwd,
    timeoutMs: 10000
  });
}
