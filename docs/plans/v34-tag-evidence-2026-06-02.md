# v34 tag evidence

Date: 2026-06-02

Goal id: `v34-action-registry-workspace`
Release tag: `v34`
Release name: `v34 Action Registry Workspace`
Evidence path: `docs/plans/v34-tag-evidence-2026-06-02.md`

## Tag Scope

The `v34` tag marks the local `main` release commit for the Action Registry Workspace after:

- all five v34 tasks are main-verified,
- release validation commands pass,
- release evidence is committed,
- tag evidence is committed,
- release gates are registered through `symphony goal gate`,
- `release.ready` is declared through `symphony goal gate`.

## Tag Command

The tag command is:

```bash
git tag -a v34 HEAD -m "v34 Action Registry Workspace"
```

The target is the current `main` `HEAD` immediately before running the command. The tag object records the concrete commit hash.

## Validation Basis

Release validation basis is recorded in `docs/plans/v34-release-evidence-2026-06-02.md`:

- `pnpm check`: passed.
- `pnpm test`: passed, 790 tests, 123 suites.
- `pnpm workbench:build`: passed.
- `git diff --check`: passed.
- `pnpm --silent symphony goal-status --goal v34-action-registry-workspace --json`: passed.

## Boundaries

Creating the local annotated tag does not push the tag, publish a release, create v35 state, start jobs, execute actions, invoke models, merge branches, or alter the release evidence.
