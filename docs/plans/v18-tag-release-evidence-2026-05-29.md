# v18 tag release evidence

日期：2026-05-29
工作树：`main`
目标：create and publish annotated `v18` tag and GitHub release

## scope

This task creates the `v18` release tag for the Goal Event Journal + Evidence Recorder release.

The release includes:

- `goal-event-log.v1` and `goal-update-plan.v1`.
- `symphony goal update`, `symphony goal review`, and `symphony goal gate` dry-run / confirm flows.
- Append-only managed goal event journal writes with plan-hash confirmation.
- Event-backed `goal-progress-ledger.v1` resolution with the v17 planned/unknown fallback when no events exist.
- Read-only `GET /api/goals/latest/events` and `GET /api/goals/<goal-id>/events`.
- Workbench Goal Events Timeline and Evidence Matrix panels.
- Route smoke and safety boundary coverage for the v18 events API and Workbench display.
- README, operator guide, task evidence index, release evidence, and final closure evidence.

The release does not include Autopilot, Workbench execution, browser terminal, artifact download, open local file, arbitrary path preview, model invocation, automatic merge, or automatic tag. Workbench remains read-only / display-only / copy-only.

## pre-tag checks

Checks run before this tag bookkeeping commit:

| Check | Result |
|---|---|
| `git status -sb` | `## main...origin/main` |
| `git tag --list 'v18'` | No local `v18` tag. |
| `git ls-remote --tags origin 'refs/tags/v18'` | No remote `v18` tag. |
| `gh release view v18 --repo Andy20010101/multi-coding-agent-symphony` | Release not found. |
| `pnpm --silent symphony goal-status --goal v18-goal-event-journal-evidence-recorder --json` | `completedTasks: 10`, `needsRevisionTasks: 0`, `releaseReady: true`, source `goal-event-log.v1:evt_3714a444163c4583`. |

The final closeout gates are recorded in `docs/plans/v18-final-closure-evidence-2026-05-29.md`:

- `pnpm check`
- `pnpm test`
- `pnpm workbench:build`
- `pnpm audit --audit-level high`
- `git diff --check`
- `pnpm mcas doctor`
- `pnpm test:mutation:gate`

## tag plan

After this evidence and README update are committed and pushed to `origin/main`, create the release tag from the resulting `main` commit:

```bash
git tag -a v18 -m "v18 Goal Event Journal and Evidence Recorder release"
git push origin v18
gh release create v18 --title "v18 Goal Event Journal + Evidence Recorder" --latest
```

## post-tag evidence

Post-tag command output will be recorded after the tag and GitHub release are created. This post-tag evidence update will not move the already-pushed `v18` tag.
