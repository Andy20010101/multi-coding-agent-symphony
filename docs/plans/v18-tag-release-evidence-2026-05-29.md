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

After this evidence and README update were committed and pushed to `origin/main`, the release tag was created from the resulting `main` commit:

```bash
git tag -a v18 -m "v18 Goal Event Journal and Evidence Recorder release"
git push origin v18
gh release create v18 --title "v18 Goal Event Journal + Evidence Recorder" --latest
```

## post-tag evidence

Commands run after creating the tag and GitHub release:

| Command | Result |
|---|---|
| `git show v18 --no-patch --decorate` | Shows annotated tag `v18`, message `v18 Goal Event Journal and Evidence Recorder release`, pointing to commit `a9c05f0f72cfbf341e4b2832e592b8a1c5eacafb`. |
| `git ls-remote --tags origin refs/tags/v18 'refs/tags/v18^{}'` | Remote tag object `5b68630aded51007416cbf357546acad3b6a1f2e`; peeled commit `a9c05f0f72cfbf341e4b2832e592b8a1c5eacafb`. |
| `gh release view v18 --repo Andy20010101/multi-coding-agent-symphony --json tagName,name,url,isDraft,isPrerelease,publishedAt,targetCommitish` | Release exists. `tagName: v18`, `name: v18 Goal Event Journal + Evidence Recorder`, `isDraft: false`, `isPrerelease: false`, `publishedAt: 2026-05-29T01:35:51Z`, `targetCommitish: main`. |
| `pnpm --silent symphony goal gate --goal v18-goal-event-journal-evidence-recorder --gate release.tag-evidence --status passed --verifier codex-v18-tag-verifier --evidence-ref docs/plans/v18-tag-release-evidence-2026-05-29.md --confirm --plan-hash sha256:9bc6d6a643bb9fc9976ad968aef8a976c0f08029c3ce003e436982ba7401a247` | Appended `goal-event-log.v1:evt_628cf503346e4df2`, gate `release.tag-evidence`, status `passed`. |
| `pnpm --silent symphony goal-status --goal v18-goal-event-journal-evidence-recorder --json` | `completedTasks: 10`, `needsRevisionTasks: 0`, `releaseReady: true`, `releaseGates.tagEvidence: passed`. |

GitHub release:

- https://github.com/Andy20010101/multi-coding-agent-symphony/releases/tag/v18

This post-tag evidence update does not move the already-pushed `v18` tag. The tag remains on commit `a9c05f0f72cfbf341e4b2832e592b8a1c5eacafb`.
