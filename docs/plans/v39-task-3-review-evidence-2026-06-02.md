# v39 task-3 review evidence

Goal id: `v39-backup-diagnostics-migration-workspace`
Task id: `task-3`
Branch: `v39-task-3-backup-export-bundle`
Worker evidence reviewed: `docs/plans/v39-task-3-worker-evidence-2026-06-02.md`
Reviewer: `019e96aa-4494-71e2-b842-f45694b93e0a`
Verdict: `APPROVED`

## Review scope

Reviewed the worker worktree at `/Users/andy/.codex/worktrees/15b8/multi-coding-agent-symphony` against base commit `036d2f6694f62960b1b05dbca04dd0c17699fb6d` and worker head commit `cd58ec2973748062ccc317859caf0f1ff7f1b9ca`.

Checked the v39 task-3 runbook scope: export app core state manifest, hashes, and refs without copying excluded repo content.

## Findings

No blocking findings.

The implementation adds `app-core-backup-export.v1`, exposes it through `symphony backup export` and `GET /api/backup/export`, and renders it in Workbench as a read-only panel. The route accepts only `goal` and `task`, rejects unsafe refs and unsupported params, and does not expose a browser shell, local file opener, model invocation path, merge, push, tag, publish, or self-approval path.

The manifest includes managed `.symphony` state refs with hashes, ArtifactStore refs with hashes, and explicit excluded repo content. It does not include repo source, docs, tests, `.git`, package manifests, lockfiles, artifact payloads, or arbitrary local paths as backup payload.

## Commands run

All commands were run from `/Users/andy/.codex/worktrees/15b8/multi-coding-agent-symphony`.

- `pnpm check`: passed, exit code 0.
- `pnpm exec node --test tests/v39-backup-export-bundle.test.js tests/workbench-api-client.test.js tests/workbench-shell.test.js`: passed, 81 tests, 4 suites, exit code 0.
- `git diff --check 036d2f6694f62960b1b05dbca04dd0c17699fb6d..cd58ec2973748062ccc317859caf0f1ff7f1b9ca`: passed, exit code 0.
- `pnpm test`: passed, 1022 tests, 159 suites, exit code 0.
- `pnpm workbench:build`: passed, exit code 0.

## Boundary notes

- UI consumes backend contract data only.
- The backup route is GET-only for Workbench and rejects unsupported query parameters.
- CLI output is stdout-only for the backup export path; `--output` is rejected by the parser.
- No reviewer approval, main verification, release gate, release-ready state, tag, push, publish, or provider CLI command was registered or run by this review.

## Verdict

`APPROVED`
