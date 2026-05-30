# v19 tag release evidence

日期：2026-05-29
实际记录时间：2026-05-30，Asia/Shanghai
目标：`v19-goal-runbook-next-action`
仓库：`https://github.com/Andy20010101/multi-coding-agent-symphony.git`
tag：`v19`
GitHub release：`https://github.com/Andy20010101/multi-coding-agent-symphony/releases/tag/v19`

## checked scope

This evidence records the v19 tag and GitHub release state after `release.ready` was explicitly declared.

The checked scope covers:

- local and remote `v19` tag state
- GitHub release `v19`
- current `main` and release evidence commit relationship
- `goal-status` release-ready state
- remaining `release.tag-evidence` registration step

This file does not move an existing tag, force-push, create another release, or claim the tag contains evidence written after the tag was created.

## release-ready prerequisite

Before tag evidence was prepared, `release.ready` had already been declared through the explicit event:

- `goal-event-log.v1:evt_8548ed78978c304c`
- event type: `release.ready-declared`
- sequence: `51`
- evidence ref: `docs/plans/v19-final-closure-evidence-2026-05-29.md`

`pnpm --silent symphony goal-status --goal v19-goal-runbook-next-action --json` later reported:

- `releaseReady: true`
- `releaseReadySource: goal-event-log.v1:evt_8548ed78978c304c`
- `needsRevisionTasks: 0`
- task-1 through task-8: `release-ready`
- `releaseGates.tagEvidence: unknown`

## pre-tag checks

These checks were run before the tag and GitHub release were created.

| Command | Exit code | Result |
|---|---:|---|
| `git checkout main` | 0 | Already on `main`; `docs/plans/v19-final-closure-evidence-2026-05-29.md` was modified locally; branch was up to date with `origin/main`. |
| `git pull --ff-only` | 0 | `Already up to date.` |
| `git status -sb` | 0 | `## main...origin/main`; modified `docs/plans/v19-final-closure-evidence-2026-05-29.md`. |
| `git tag --list 'v19'` | 0 | No output. No local `v19` tag existed before creation. |
| `git ls-remote --tags origin 'refs/tags/v19'` | 0 | No output. No remote `v19` tag existed before creation. |
| `gh release view v19 --repo Andy20010101/multi-coding-agent-symphony` | 1 | `release not found`. |

## tag plan

The operator explicitly authorized and ran:

```bash
git tag -a v19 -m "v19 Goal Runbook and Next Action Control Center release"
git push origin v19
gh release create v19 --title "v19 Goal Runbook + Next Action Control Center" --latest
```

## tag and release creation evidence

| Command | Exit code | Result |
|---|---:|---|
| `git tag -a v19 -m "v19 Goal Runbook and Next Action Control Center release"` | 0 | Created annotated local tag `v19`. |
| `git push origin v19` | 0 | Pushed new tag: `v19 -> v19`. |
| `gh release create v19 --title "v19 Goal Runbook + Next Action Control Center" --latest` | 0 | Created release `https://github.com/Andy20010101/multi-coding-agent-symphony/releases/tag/v19`. |

The tag was created while `HEAD` was `e1140410be5c01f272b9800dedac783f80782496`, commit message `Approve v19 task8 review evidence`.

After the tag was created, a separate evidence commit was made:

- current `HEAD`: `075bd00bd6c1496df7a848d30006cd8407cb1989`
- commit message: `Record v19 release-ready evidence`
- local `main` status after that commit: `## main...origin/main [ahead 1]`

The current `v19` tag does not include commit `075bd00bd6c1496df7a848d30006cd8407cb1989`.

## post-tag checks

| Command | Exit code | Result |
|---|---:|---|
| `git tag --list 'v19'` | 0 | `v19`. |
| `git rev-parse v19^{tag}` | 0 | Annotated tag object `5cc9884780aa45b89a3b2aadfa3bbac2546c1373`. |
| `git rev-parse v19^{}` | 0 | Peeled commit `e1140410be5c01f272b9800dedac783f80782496`. |
| `git rev-list -n 1 v19` | 0 | `e1140410be5c01f272b9800dedac783f80782496`. |
| `git ls-remote --tags origin 'refs/tags/v19'` | 0 | Remote annotated tag object `5cc9884780aa45b89a3b2aadfa3bbac2546c1373`. |
| `git ls-remote --tags origin 'refs/tags/v19^{}'` | 0 | Remote peeled commit `e1140410be5c01f272b9800dedac783f80782496`. |
| `git show --no-patch --pretty=fuller v19` | 0 | Tagger `Andy <andy@AndydeMacBook-Air.local>`; tagger date `2026-05-30 11:52:07 +0800`; message `v19 Goal Runbook and Next Action Control Center release`; commit `e1140410be5c01f272b9800dedac783f80782496`. |
| `gh release view v19 --repo Andy20010101/multi-coding-agent-symphony --json tagName,name,url,isDraft,isPrerelease,createdAt,publishedAt,targetCommitish` | 0 | `tagName: v19`; `name: v19 Goal Runbook + Next Action Control Center`; `url: https://github.com/Andy20010101/multi-coding-agent-symphony/releases/tag/v19`; `isDraft: false`; `isPrerelease: false`; `targetCommitish: main`; `createdAt: 2026-05-30T03:52:07Z`; `publishedAt: 2026-05-30T03:52:11Z`. |

## current interpretation

`v19` exists locally and on origin as an annotated tag. The GitHub release exists and is published.

The release points at commit `e1140410be5c01f272b9800dedac783f80782496`. The later local evidence commit `075bd00bd6c1496df7a848d30006cd8407cb1989` is not included in that tag.

`release.tag-evidence` has not been registered yet in the goal event log at the time this file was written. This file is the evidence ref to use for that gate.

## remaining steps

Register tag evidence through dry-run and confirm:

```bash
pnpm --silent symphony goal gate \
  --goal v19-goal-runbook-next-action \
  --gate release.tag-evidence \
  --status passed \
  --verifier codex-v19-tag-verifier \
  --evidence-ref docs/plans/v19-tag-release-evidence-2026-05-29.md \
  --dry-run --json
```

Then confirm with the returned plan hash and verify:

```bash
pnpm --silent symphony goal-status --goal v19-goal-runbook-next-action --json
```

Expected after tag-evidence registration:

- `releaseReady: true`
- `needsRevisionTasks: 0`
- `releaseGates.tagEvidence: passed`
