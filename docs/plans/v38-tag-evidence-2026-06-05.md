# v38 tag evidence

Date: 2026-06-05

Goal id: `v38-provider-hub-capability-profiles`
Release tag: `v38`
Release name: `v38 Agent CLI Provider Hub MVP`
Evidence path: `docs/plans/v38-tag-evidence-2026-06-05.md`

## Tag Scope

The `v38` tag marks the `main` release commit for the Agent CLI Provider Hub MVP after:

- all five v38 tasks are main-verified,
- runbook release gates are passed,
- `release.ready-declared` is recorded,
- v38 is merged into `main`,
- local repository tag/full release gates pass,
- mainline CI passes on merge commit `64ab57e40e24ab7e07e14d2126a265731eb73463`,
- release evidence is committed,
- tag evidence is committed.

## Tag Command

The tag command is:

```bash
git tag -a v38 HEAD -m "v38 Agent CLI Provider Hub MVP"
```

The target is the current `main` `HEAD` immediately before running the command. The tag object records the concrete commit hash.

## Validation Basis

Release validation basis is recorded in `docs/plans/v38-release-evidence-2026-06-05.md`:

- `pnpm check`: passed.
- `pnpm test`: passed, `1018` tests, `158` suites.
- `pnpm workbench:build`: passed.
- `pnpm test:mutation:gate`: passed, mutation score `74.22`, break threshold `60`.
- `pnpm audit --audit-level high`: passed; one moderate vulnerability reported.
- `git diff --check`: passed.
- `pnpm mcas doctor`: passed.
- GitHub Actions `CI` on merge commit `64ab57e40e24ab7e07e14d2126a265731eb73463`: passed, including `pnpm test:mutation:gate`.

Managed goal release readiness:

- `release.ready-declared`: `evt_32261d4927aea700`
- Evidence: `docs/plans/v38-release-gates-evidence-2026-06-05.md`

## Boundaries

Creating and pushing the annotated tag does not publish a GitHub Release, create v39 state, start jobs, execute provider CLIs, invoke models, merge branches, move an existing tag, or change v38 runtime boundaries.
