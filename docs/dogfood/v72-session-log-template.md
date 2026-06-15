# v72 Dogfood session log template

Date created: 2026-06-15
Goal: `v72-one-week-dogfood-stabilization`
Contract: `dogfoodSession.v1`

This file is a template only. It contains no counted v72 session records.

## Counted Session Fields

Each counted session must include:

- session id;
- date;
- local time and timezone;
- project path or repo;
- goal or task;
- entry path: packaged app, browser fallback, Workbench route, package build, or controller terminal;
- worker provider status: `codex-cli`, `claude-code-cli`, `operator`, `not used`, or `unknown`;
- reviewer provider status: `claude-code-cli`, `operator`, `not used`, or `unknown`;
- adoption status: `observed`, `not observed`, `not applicable`, or `unknown`;
- verification status: `passed`, `failed`, `blocked`, `not run`, or `unknown`;
- blocker state;
- recovery action;
- manual terminal escape count;
- friction notes;
- safe evidence refs;
- metrics marked `observed`, `not observed`, or `unknown`.

## Session Record Template

```md
## Session v72-sNN

| Field | Value |
| --- | --- |
| Date | YYYY-MM-DD |
| Local time | HH:MM Asia/Shanghai |
| Project | repo or project path |
| Goal/task | concrete operator task |
| Entry path | packaged app / browser fallback / Workbench route / package build / controller terminal |
| Worker provider | codex-cli / claude-code-cli / operator / not used / unknown |
| Reviewer provider | claude-code-cli / operator / not used / unknown |
| Adoption status | observed / not observed / not applicable / unknown |
| Verification status | passed / failed / blocked / not run / unknown |
| Blocker state | not observed, or blocker label and details |
| Recovery action | not observed, or action taken |
| Manual terminal escapes | integer or unknown |

### Task Steps

- Step 1:
- Step 2:
- Step 3:

### Friction Notes

- Preserve unclear, slow, missing, or uncomfortable parts.
- Use `none observed` only when that was checked during the session.

### Evidence Refs

| Kind | Ref | Label |
| --- | --- | --- |
| repo-doc | docs/... | acceptance, protocol, or evidence doc |
| command-evidence | command name and result in repo doc | validation command |
| github-pr | https://github.com/.../pull/NNN | PR evidence |

### Metrics

| Metric | Value |
| --- | --- |
| success | observed / not observed / unknown |
| blocked | observed / not observed / unknown |
| reviewLoopCount | integer / unknown |
| recoveryCount | integer / unknown |
| manualTerminalEscapeCount | integer / unknown |
| elapsedTimeMinutes | number / not observed / unknown |
| cost | observed value with source / not observed / unknown |
```

## Summary Rules

- Count only real operator task sessions.
- Do not count this template as a session.
- Do not use raw transcript paths, local provider session files, `.jsonl` files, `.codex`, `.claude`, `.symphony`, secret values, raw model output, or raw provider output as evidence refs.
- Use `unknown` or `not observed` when a value was not recorded.
- Do not claim one-week stability from same-day records.
- Keep `BLOCKED_REAL_DOGFOOD_EVIDENCE` until at least five valid session records exist.

## Dependency Recovery Note

If a fresh worktree fails Workbench build or route tests because `node_modules` is missing, record that as dogfood friction and run:

```sh
pnpm install
```

Then rerun the failed validation command. Do not record missing local dependencies as a product blocker unless the install or rerun also fails.
