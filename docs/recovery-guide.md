# Recovery Guide

## Purpose

Use this guide when the v60 Stable Personal Workbench Release path drifts from the expected local baseline. It covers repository, Workbench, provider-boundary, evidence, and release-boundary recovery.

## Repository Baseline Drift

Check:

```sh
git status --short --branch
git rev-list --left-right --count main...origin/main
gh pr list --state open --json number,title,headRefName,baseRefName,url,isDraft
```

Expected v60 start state after v59:

- `main` and `origin/main` are aligned;
- open PR list is empty before starting a new PR branch;
- `v59` exists and dereferences to the v59 release commit;
- `v60` tag and GitHub Release do not exist before v60 closeout.

Recovery:

- stop version work when `main` and `origin/main` diverge;
- identify any overlapping open PR before editing;
- do not create a next-version goal while v60 release validation is still open;
- do not tag or publish until closeout evidence records the target commit and validation.

## Workbench Build Drift

Symptoms:

- `/workbench/desktop/` is stale after source changes;
- generated static assets do not match `frontend/workbench/src`;
- route smoke fails after label or navigation changes.

Recovery:

```sh
pnpm workbench:build
node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js
pnpm check
git diff --check
```

If only docs changed, do not rebuild Workbench static assets.

## Provider Boundary Drift

Symptoms:

- a document or UI claims unsupported provider support;
- Workbench shows a provider launch path not covered by current tests;
- evidence includes raw provider output or local session refs.

Recovery:

- remove the unsupported claim or change it to a blocked state with source refs;
- keep Kiro, Gemini, DeepSeek-as-a-provider, and raw provider CLIs out of v60 active Workbench execution claims;
- rerun the focused provider and Workbench tests named in the v60 runbook when product code changes;
- reject any fixture that includes raw transcript, raw model output, provider payload, local JSONL, or `/Users/...` session paths.

## Evidence Drift

Symptoms:

- release evidence target commit differs from the tag dereferenced commit;
- GitHub Release is draft or prerelease;
- release assets appear when none were expected;
- open PR count is not zero during publication evidence.

Recovery:

```sh
git show-ref --tags -d | rg 'refs/tags/v59|refs/tags/v60'
gh release view v59 --json tagName,name,url,isDraft,isPrerelease,publishedAt,assets,targetCommitish
gh release view v60 --json tagName,name,url,isDraft,isPrerelease,publishedAt,assets,targetCommitish
```

For `v60`, a missing release is expected until manual publication. A draft, prerelease, target mismatch, or unexpected asset is a blocker before closeout is marked complete.

## Release Boundary Drift

Product code must not run:

- `git tag`;
- `git push`;
- `gh release create`;
- `gh release edit`;
- `gh release upload`;
- merge or branch cleanup automation;
- automatic next-version goal creation.

Recovery:

- remove the product control or route;
- replace UI text with copy-only manual guidance when needed;
- add or update a contract fixture that blocks release automation;
- rerun `tests/v60-stable-personal-workbench-release.test.js` after the contract exists.

## Closeout Recovery

Before v60 closeout, record:

- target commit;
- commands run and exit codes;
- whether `pnpm test` was run;
- if `pnpm test` was not run, the focused suite used and the reason;
- known skipped gates and residual risk;
- release note draft without public distribution, notarization, auto-update, generic shell execution, unsupported provider, or release automation claims.
