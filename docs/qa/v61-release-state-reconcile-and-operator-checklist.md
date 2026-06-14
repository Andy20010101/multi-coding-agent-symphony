# v61 release-state reconcile and operator checklist

Date: 2026-06-15
Timezone: Asia/Shanghai
Goal: `v61-workbench-operator-dry-run-evidence`
PR slot: PR-1 release-state reconcile and operator checklist
Branch: `codex/v61-release-state-operator-checklist`
Branch start commit: `19743eb5b3031bab650a2e7f40ab2f9f0804085e`

## Release-state reconcile

| Check | Result |
| --- | --- |
| `git rev-parse origin/main HEAD` | Both resolve to `19743eb5b3031bab650a2e7f40ab2f9f0804085e`, the merge commit for PR #121. |
| `gh pr list --state open --json number,title,headRefName,baseRefName,url,isDraft` | `[]`. |
| `git show-ref --tags -d \| rg 'refs/tags/v60\|refs/tags/v61'` | `v60` tag object `d410f55038071d41b58d25a71f36fb70dad66a2e`; `v60^{}` dereferences to `41a211ab30a5eb68c1c0cd04e688dabcf1ba8386`; no `v61` ref. |
| `gh release view v60 --json tagName,name,url,isDraft,isPrerelease,publishedAt,assets,targetCommitish` | `v60` exists at `https://github.com/Andy20010101/multi-coding-agent-symphony/releases/tag/v60`; name `v60: Stable Personal Workbench Baseline`; draft `false`; prerelease `false`; assets `[]`; published at `2026-06-14T06:47:50Z`; targetCommitish `main`. |
| `gh release view v61 --json tagName,name,url,isDraft,isPrerelease,publishedAt,assets,targetCommitish` | Failed with `release not found`; expected before v61 closeout. |

`origin/main` is ahead of the `v60` tag. The `v60` tag points to PR #119 merge commit `41a211ab30a5eb68c1c0cd04e688dabcf1ba8386`; current `origin/main` also includes PR #120 and PR #121. v61 starts from current `origin/main`, not from the `v60` tag.

## Operator checklist

Use this checklist when recording the v61 dry-run evidence for the released v60 stable baseline.

| Step | Evidence to record |
| --- | --- |
| Build and open Workbench | Run `pnpm workbench:build`; start `pnpm symphony console`; open `http://127.0.0.1:8765/workbench/desktop/` and `http://127.0.0.1:8765/workbench/`. |
| Find stable baseline lane | In `/workbench/desktop/`, confirm the `Stable Baseline` navigation target and the `Stable Workbench Release` panel after Release Publication Evidence. |
| Record source contract | Record `stableWorkbenchRelease.v1`, `goal-supervisor-app-read-model.v1`, and the displayed evidence refs. |
| Check release boundary | Confirm tag, push tag, GitHub Release, and release-ready operations are shown as manual controller actions with `not-run-by-product-code`. |
| Check disabled capabilities | Confirm provider launch, unsupported provider claims, generic shell, generic terminal, renderer command execution, frontend JSONL/session/provider folder reads, raw transcript exposure, raw model output exposure, direct goal event append, direct task completion, git write, GitHub Release creation, public distribution claim, automatic worktree creation, and automatic next-version goal are disabled. |
| Handle blocked source state | If a source contract is missing or blocked, record the missing contract and stop. Do not infer readiness from route rendering, file names, branch names, or command success. |
| Keep publication external | Tag creation, tag push, PR merge, and GitHub Release publication remain controller actions outside product code. |

## Boundary result

PR-1 records release state and operator checks only. It does not add provider execution, generic shell or terminal UI, renderer command execution, frontend local file/session reads, raw transcript exposure, raw model output exposure, direct event append, direct task completion, automatic self-review, automatic worktree creation, automatic next-version goal creation, product-level git write, product-level tag/push/publish, GitHub Release automation, public distribution, notarization, or auto-update.

## Validation

| Command | Result |
| --- | --- |
| `node --test tests/v60-stable-personal-workbench-release.test.js` | Passed on PR-1 branch. |
| `pnpm check` | Passed on PR-1 branch. |
| `git diff --check` | Passed on PR-1 branch. |
