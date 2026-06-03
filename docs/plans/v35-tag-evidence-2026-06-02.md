# v35 tag evidence

Date: 2026-06-03

Goal id: `v35-job-queue-run-control-workspace`
Release tag: `v35`
Release name: `v35 Job Queue + Run Control Workspace`
Evidence path: `docs/plans/v35-tag-evidence-2026-06-02.md`

## Tag Scope

The `v35` tag marks the local `main` release commit for the Job Queue + Run Control Workspace after:

- all five v35 tasks are main-verified,
- release validation commands pass,
- release evidence is committed,
- tag evidence is committed,
- release gates are registered through `symphony goal gate`,
- `release.ready` is declared through `symphony goal gate`.

## Tag Command

The tag command is:

```bash
git tag -a v35 HEAD -m "v35 Job Queue + Run Control Workspace"
```

The target is the current `main` `HEAD` immediately before running the command. The tag object records the concrete commit hash.

## Validation Basis

Release validation basis is recorded in `docs/plans/v35-release-evidence-2026-06-02.md`:

- `pnpm check`: passed.
- `pnpm test`: passed, 868 tests, 128 suites.
- `pnpm workbench:build`: passed.
- `git diff --check`: passed.
- `pnpm --silent symphony goal-status --goal v35-job-queue-run-control-workspace --json`: passed.

## Boundaries

Creating the local annotated tag does not push the tag, publish a release, create v36 state, start jobs, execute actions, invoke models, merge branches, or alter the release evidence.
