# v49 Context Session Observability and Supervisor Advisory release prep

Date: 2026-06-12
Timezone: Asia/Shanghai
Prepared from branch: `codex/v49-closeout-tag-prep`
Implementation head before PR-5: `9bd2f72f944591394b54a5d4cef4b958916c4d12`

## Release state

`v48` exists and is already published as `v48: Project Launcher and Recent Projects` at `https://github.com/Andy20010101/multi-coding-agent-symphony/releases/tag/v48`. The release is not a draft, not a prerelease, and has no assets. The local `v48` tag resolves to commit `e07f7bd2c3d80e53cdfff3a65f5cccdf9fa16cad`.

Open PR reconciliation before PR-5 edits returned `[]`. PR #56 through PR #60 are merged into `main`, ending at #60 merge commit `9bd2f72f944591394b54a5d4cef4b958916c4d12`.

PR-5 does not create a tag, create a GitHub Release, publish, merge itself, or run release automation.

## Suggested tag

Suggested tag name: `v49`

Tag target: the `main` commit after the PR-5 closeout PR merges. Do not tag the pre-merge branch commit unless the release manager intentionally chooses that target and records why.

## Release notes draft

```text
v49: Context Session Observability and Supervisor Advisory

- Adds backend-owned `sessionSourceInventory.v1` for bounded Codex and Claude session source availability.
- Adds `contextAdvisory.v1` for normalized transcript availability, token usage, context utilization, latest tool call, latest turn state, result-block evidence, blocked fields, and degraded reasons.
- Adds `threadContinuationDecision.v1` for advisory continue, compact, new-thread, wait, blocked, checkpoint, and recover-drift recommendations.
- Projects the v49 contracts into the goal supervisor app read model.
- Displays session source inventory, context advisory, thread continuation decision, and disabled/copy-only command boundary in the Workbench supervisor route.
- Boundaries remain closed for child dispatch, transcript compaction, thread creation, result registration, result consumption, provider launch, terminal actions, frontend JSONL reads, provider folder scans from the frontend, goal state writes, ledgers, event logs, `.symphony`, git writes, tags, publish, GitHub Release creation, and release automation.
```

## Pre-tag checklist

- PR #56 is merged into `main` at `2c58280c07e22f4ae4e0e0fbf6024b1b766d8c96`.
- PR #57 is merged into `main` at `4da45f142895a0b22568ca48bf782beee2d97cc3`.
- PR #58 is merged into `main` at `836b778817a076a060c1954541cd5947112292a3`.
- PR #59 is merged into `main` at `0c2cfc6bafb47c86d356efa329ee94a0909936a3`.
- PR #60 is merged into `main` at `9bd2f72f944591394b54a5d4cef4b958916c4d12`.
- PR-5 closeout and tag-prep PR is merged into `main`.
- Fetch `origin main --tags --prune` after the PR-5 merge.
- Confirm `main` and `origin/main` are synchronized before tagging.
- Confirm no open PR changes are expected in the v49 release boundary.
- Run `node --test tests/v44-3-goal-supervisor-session-context.test.js`.
- Run `node --test tests/v44-goal-supervisor-app-read-model.test.js`.
- Run `node --test tests/workbench-shell.test.js tests/workbench-api-client.test.js`.
- Run `pnpm check`.
- Run `git diff --check`.
- Confirm the v49 Workbench surface has no dispatch, compact, new-thread creation, register, consume, provider launch, terminal, git, tag, publish, release, file picker, directory picker, or frontend session file read controls.
- Confirm the release note does not claim signed distribution, packaged desktop release, provider runtime, goal mutation, release automation, or GitHub Release creation.

## Tag and release not performed

This PR does not run `git tag`, `git push --tags`, `gh release create`, `gh release edit`, or any publish command. Those actions remain manual release-manager work after the PR-5 closeout PR lands on `main`.
