# v43+ Local Goal Supervisor Latest Commands

Date: 2026-06-08

Goal id: `v43-plus-local-goal-supervisor-stability`

## Command Spine

Use the existing goal workflow:

```text
goal-status -> goal next -> goal prompt -> goal update/review/gate -> goal closeout
```

The temporary external daemon is the only state writer for child results. Child threads implement, review, or verify one phase, then return one bounded result block.

## Implementation Boundary

Implementation may touch this project-external runner only when the active task explicitly asks for local goal supervisor runner changes:

```text
/Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs
```

Repository evidence must be written inside the assigned repo worktree.

## Provider Boundary

Active providers remain:

```text
claude-code-cli
codex-cli
```

Do not add Gemini CLI, Kiro CLI, DeepSeek, raw provider CLI execution, browser terminal automation, tag/push/publish automation, or a generic shell runner.

## Default Checks

```sh
node --check /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs
node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs selftest
git diff --check
pnpm --silent symphony goal-status --goal v43-plus-local-goal-supervisor-stability --json
```

Run `pnpm check`, `pnpm test`, and `pnpm workbench:build` when repository source changes or when main verification chooses full default gates.

## Register Worker Evidence

```sh
pnpm --silent symphony goal update \
  --goal v43-plus-local-goal-supervisor-stability \
  --task <task-id> \
  --event worker.evidence-recorded \
  --actor local-goal-supervisor-worker \
  --evidence-ref docs/plans/controller/<evidence-file>.md \
  --dry-run --json
```

## Register Review

```sh
pnpm --silent symphony goal review \
  --goal v43-plus-local-goal-supervisor-stability \
  --task <task-id> \
  --verdict approved \
  --reviewer local-goal-supervisor-reviewer \
  --evidence-ref docs/plans/controller/<review-evidence-file>.md \
  --dry-run --json
```

## Register Main Verification

```sh
pnpm --silent symphony goal gate \
  --goal v43-plus-local-goal-supervisor-stability \
  --gate main-verification \
  --task <task-id> \
  --status passed \
  --verifier local-goal-supervisor-main-verifier \
  --evidence-ref docs/plans/controller/<main-verification-evidence-file>.md \
  --dry-run --json
```
