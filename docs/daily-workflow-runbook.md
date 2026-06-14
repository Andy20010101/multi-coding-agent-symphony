# Daily Workbench Workflow

## Current Baseline

This runbook describes the local Workbench path after the v59 release and during v60 Stable Personal Workbench Release work. It is an operator workflow, not a new execution surface.

Current tagged release: `v59`. Current active version: `v60`. There is no `v60` tag or GitHub Release yet.

Start from a clean checkout:

```sh
git status --short --branch
pnpm workbench:build
pnpm symphony console --host 127.0.0.1 --port 8765
```

Open:

```text
http://127.0.0.1:8765/workbench/desktop/
```

Daily path:

```text
Project Launcher
-> App Home
-> Supervisor
-> Context Advisory
-> Result Intake
-> Event Preview / Confirm
-> Review / Gate
-> Closeout
-> Release Publication Evidence
```

## What To Check

Project Launcher:

- selected project id and name;
- current project binding source;
- route health and stale/missing state.

App Home and Supervisor:

- active goal id and task id;
- next action source;
- supervisor read model source and route provenance;
- command boundary state.

Context and handoff:

- Context Advisory state;
- thread continuation or handoff pack refs when present;
- copy-only commands when handoff is required.

Result intake and event registration:

- pending result state;
- preview state before confirm;
- confirm path bound to the dry-run `planHash`;
- evidence escrow refs after confirm.

Review and release gates:

- review gate state from explicit contract fields;
- main verification state from recorded evidence;
- release gate state from explicit release evidence;
- no readiness inferred from branch names, filenames, tests, or UI text.

Release closeout and publication evidence:

- v58 closeout handoff source refs;
- v59 tag evidence and GitHub Release evidence;
- target commit match;
- open PR count;
- manual release boundary.

## What Is Automated

- read-only API projection;
- Workbench static build;
- dry-run preview generation for supported goal events;
- plan-hash-bound confirm for supported goal event registration;
- evidence escrow for result intake;
- explicit contract validation and focused tests.

## What Remains Operator-Controlled

- worker/reviewer thread creation outside product code;
- merge decisions;
- tag creation and tag push;
- GitHub Release creation or editing;
- release note wording;
- next-version goal creation;
- deciding whether `pnpm test` is required before tagging when a runbook allows a focused suite.

## Hard Stops

Stop and reconcile before continuing when any of these appear:

- `main` and `origin/main` diverge;
- open PRs overlap the active version branch;
- Workbench exposes generic shell, terminal, tag, push, publish, or GitHub Release controls;
- provider claims are not backed by current tests and fixtures;
- frontend code reads local JSONL, session folders, provider folders, raw transcripts, raw model output, `.symphony` internals, or goal ledgers;
- release evidence target commit does not match the tag dereferenced commit;
- a release is draft, prerelease, missing, or has unexpected assets.

## Validation

Use the active runbook for the exact version. For v60 PR work, default to the focused commands listed in `docs/plans/v60-stable-personal-workbench-release-runbook-2026-06-14.md`, then run `pnpm check`, `git diff --check`, and `git diff --cached --check` before commit. Workbench source changes also require `pnpm workbench:build` and the Workbench tests named in the runbook.
