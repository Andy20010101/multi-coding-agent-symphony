# v36 tag evidence

Date: 2026-06-03

Goal id: `v36-artifact-evidence-index-workspace`
Release tag: `v36`
Release name: `v36 Artifact/Evidence Index Workspace`
Evidence path: `docs/plans/v36-tag-evidence-2026-06-03.md`

## Tag Scope

The `v36` tag marks the local `main` release commit for the Artifact/Evidence Index Workspace after:

- all five v36 tasks are main-verified,
- release validation commands pass,
- release evidence is committed,
- tag evidence is committed,
- release gates are registered through `symphony goal gate`,
- `release.ready` is declared through `symphony goal gate`.

## Tag Command

The tag command is:

```bash
git tag -a v36 HEAD -m "v36 Artifact/Evidence Index Workspace"
```

The target is the current `main` `HEAD` immediately before running the command. The tag object records the concrete commit hash.

## Validation Basis

Release validation basis is recorded in `docs/plans/v36-release-evidence-2026-06-03.md`:

- `pnpm check`: passed.
- v36 targeted tests: passed, 119 tests.
- `pnpm test`: passed, 987 tests, 152 suites.
- `pnpm workbench:build`: passed.
- `git diff --check`: passed.
- `pnpm --silent symphony goal-status --goal v36-artifact-evidence-index-workspace --json`: passed.

## Boundaries

Creating the local annotated tag does not push the tag, publish a release, create v37 state, start jobs, execute actions, invoke models, merge branches, or alter the release evidence.
