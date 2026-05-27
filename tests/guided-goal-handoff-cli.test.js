import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { runSymphonyCli } from '../scripts/symphony.js';
import {
  loadGuidedGoalHandoffFixture,
  renderGuidedGoalHandoffMarkdown
} from '../src/symphony/guided-goal-handoff-output.js';
import {
  validateGuidedGoalHandoffContract
} from '../src/symphony/guided-goal-handoff.js';

describe('v16 guided goal handoff CLI', () => {
  it('prints the fixture JSON without invoking runners or models', async () => {
    const output = createOutput();
    const fixture = await loadGuidedGoalHandoffFixture();
    const exitCode = await runSymphonyCli({
      argv: ['handoff', '--json'],
      stdout: output.stdout,
      stderr: output.stderr,
      runner: explodingRunner(),
      mcasRunner: explodingMcasRunner
    });

    assert.equal(exitCode, 0);
    assert.equal(output.stderrText(), '');
    assert.equal(output.stdoutText(), `${JSON.stringify(fixture, null, 2)}\n`);

    const handoff = JSON.parse(output.stdoutText());
    assert.deepEqual(validateGuidedGoalHandoffContract(handoff), {
      ok: true,
      errors: []
    });
    assert.equal(handoff.commands.copyOnly, true);
    assert.equal(handoff.tasks.find((task) => task.id === 'task-3').evidencePath, 'docs/plans/v16-task3-cli-handoff-generation-evidence-2026-05-27.md');
  });

  it('prints stable Markdown with copy-only command blocks', async () => {
    const output = createOutput();
    const fixture = await loadGuidedGoalHandoffFixture();
    const exitCode = await runSymphonyCli({
      argv: ['handoff', '--markdown'],
      stdout: output.stdout,
      stderr: output.stderr,
      runner: explodingRunner(),
      mcasRunner: explodingMcasRunner
    });

    assert.equal(exitCode, 0);
    assert.equal(output.stderrText(), '');
    assert.equal(output.stdoutText(), `${renderGuidedGoalHandoffMarkdown(fixture)}\n`);

    const markdown = output.stdoutText();

    assert.match(markdown, /^# .+/u);
    assert.match(markdown, /Mode: copy-only manual/u);
    assert.match(markdown, /does not run commands, call models, write files, create branches, commit, push, or merge/u);
    assert.match(markdown, /```bash\ngit checkout main\ngit pull/u);
    assert.match(markdown, /git merge --ff-only <v16-task-branch>/u);
    assert.doesNotMatch(markdown, /\b(curl|fetch)\b.*\/api\//iu);
    assert.doesNotMatch(markdown, /\b(POST|PUT|PATCH|DELETE)\b/u);
    assert.deepEqual(
      markdown.split('\n').filter((line) => line.startsWith('| task-')).slice(0, 3),
      [
        '| task-1 | plan approval and baseline freeze | planner | none | docs/plans/v16-task1-plan-approval-evidence-2026-05-27.md |',
        '| task-2 | handoff contract fixtures | worker | task-1 | docs/plans/v16-task2-handoff-contract-fixtures-evidence-2026-05-27.md |',
        '| task-3 | CLI handoff generation | worker | task-2 | docs/plans/v16-task3-cli-handoff-generation-evidence-2026-05-27.md |'
      ]
    );
  });

  it('rejects file output, invalid formats, and positional arguments', async () => {
    for (const [argv, message] of [
      [['handoff', '--output', 'tmp/v16-handoff.md'], /does not write files/u],
      [['handoff', '--format', 'text'], /format must be json or markdown/u],
      [['handoff', 'task-3'], /unexpected handoff argument/u],
      [['handoff', '--json', '--markdown'], /only one output format/u]
    ]) {
      const output = createOutput();
      const exitCode = await runSymphonyCli({
        argv,
        stdout: output.stdout,
        stderr: output.stderr,
        runner: explodingRunner(),
        mcasRunner: explodingMcasRunner
      });

      assert.equal(exitCode, 64);
      assert.equal(output.stdoutText(), '');
      assert.match(JSON.parse(output.stderrText()).message, message);
    }
  });
});

function createOutput() {
  const stdout = [];
  const stderr = [];

  return {
    stdout: {
      write(chunk) {
        stdout.push(String(chunk));
      }
    },
    stderr: {
      write(chunk) {
        stderr.push(String(chunk));
      }
    },
    stdoutText() {
      return stdout.join('');
    },
    stderrText() {
      return stderr.join('');
    }
  };
}

function explodingRunner() {
  return new Proxy({}, {
    get() {
      throw new Error('handoff must not touch the process runner');
    }
  });
}

async function explodingMcasRunner() {
  throw new Error('handoff must not call the mcas runner');
}
