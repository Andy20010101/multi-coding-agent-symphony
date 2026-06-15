# v72 One-week Dogfood Stabilization protocol

Date: 2026-06-15
Timezone: Asia/Shanghai
Goal: `v72-one-week-dogfood-stabilization`
Baseline: `origin/main` at `45c639c1e60ad4dd70fa8a306a674503d500c0d0`

## Start Gate

| Check | Evidence |
| --- | --- |
| v71 closeout merged | `origin/main` is `45c639c1e60ad4dd70fa8a306a674503d500c0d0`, the merge commit for PR #178. |
| v71 tag is annotated | `refs/tags/v71` is tag object `8a618d71705e2e1ac3a7d86601a3f8a7f68ee5cf`; `refs/tags/v71^{}` dereferences to `45c639c1e60ad4dd70fa8a306a674503d500c0d0`. |
| v71 GitHub Release exists | `https://github.com/Andy20010101/multi-coding-agent-symphony/releases/tag/v71`, non-draft, non-prerelease, no assets, `targetCommitish` `main`. |
| v71 package/open smoke exists | `docs/qa/v71-native-packaging-personal-use-acceptance.md` records package build, direct binary launch, app `open -n`, `pnpm desktop:shell:smoke`, and browser fallback. |
| v72 tag/release absent at start | `gh release view v72` returned `release not found`; `git tag --list 'v72'` returned no tag. |

## Session Record Definition

A v72 session record counts only when it describes a real operator task session. A build-only or docs-only check can be evidence for a session, but it is not a session by itself unless it was the actual operator task.

Each counted session must include:

- session id;
- date;
- local time and timezone;
- project path or repo;
- task or goal;
- entry path: packaged app, browser fallback, Workbench route, package build, or controller terminal;
- worker provider status: `codex-cli`, `claude-code-cli`, `operator`, `not used`, or `unknown`;
- reviewer provider status: `claude-code-cli`, `operator`, `not used`, or `unknown`;
- adoption status: `observed`, `not observed`, `not applicable`, or `unknown`;
- verification status: `passed`, `failed`, `blocked`, `not run`, or `unknown`;
- blocker state;
- recovery action;
- manual terminal escapes count;
- friction notes, including uncomfortable or unresolved items;
- evidence refs that point to repo docs, commands, PRs, commits, tags, releases, or screenshots committed under `docs/qa/evidence/`;
- metrics with `observed`, `not observed`, or `unknown` values.

Evidence refs must not point to local provider session files, raw transcript paths, `.jsonl` files, `.codex`, `.claude`, `.symphony`, secret values, raw provider output, or uncommitted local-only files.

## Metrics Contract

Session metrics use these fields:

| Field | Required value rule |
| --- | --- |
| `success` | `observed`, `not observed`, or `unknown`; explain blocked or partial states. |
| `blocked` | `observed`, `not observed`, or `unknown`; include blocker label when observed. |
| `reviewLoopCount` | integer when observed, otherwise `unknown`. |
| `recoveryCount` | integer when observed, otherwise `unknown`. |
| `manualTerminalEscapeCount` | integer when observed, otherwise `unknown`. |
| `elapsedTimeMinutes` | number when measured, otherwise `unknown` or `not observed`. |
| `cost` | observed value with source, otherwise `unknown` or `not observed`. |

Derived summaries must use only counted session records. If a value is not recorded in the session, the summary must use `unknown` or `not observed`.

## Closeout Gate

v72 closeout stays blocked until:

1. at least five counted session records exist;
2. every counted session has evidence refs that are safe to publish in the repo;
3. repeated or severe blockers are either fixed in a targeted PR or explicitly deferred with a reason and next action;
4. same-day evidence is described as same-day dogfood, not one-week stability;
5. the closeout validation commands in the runbook have been run on the final PR-5 branch;
6. `pnpm test` has passed on the final `origin/main` commit before tagging, unless the closeout snapshot records and accepts a narrower suite.

## Current Session Evidence State

No v72 dogfood session records are counted in this PR. PR-0 only defines the protocol and runbook boundary.

`BLOCKED_REAL_DOGFOOD_EVIDENCE` applies until at least five valid session records are added in later PRs.
