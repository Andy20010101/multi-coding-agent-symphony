# Release Checklist

Use this checklist before tagging a release or handing the repo to a new operator.

## Required Local Gates

Run from the repository root:

```sh
pnpm check
pnpm test
pnpm test:mutation:gate
git diff --check
pnpm mcas doctor
pnpm smoke:codex:help
pnpm smoke:claude:help
pnpm smoke:kiro:help
```

Expected result: every command exits with code `0`. Help smokes verify local binaries only and must not invoke model APIs. The mutation gate runs Stryker against the hardened core modules and must stay above its configured break threshold.

## Security Gates

Run the checks in [Security Checklist](security-checklist.md). At minimum:

```sh
node --test tests/security-policy.test.js
node --test tests/phase3.test.js
```

Expected result: redaction, policy enforcement, and adapter permission mapping tests pass.

## Optional Real Model Gates

Real model smokes are opt-in and must stay disabled unless the operator intentionally exports the gate variable:

```sh
MCAS_RUN_REAL_CODEX=1 pnpm smoke:codex:real
MCAS_RUN_REAL_CLAUDE=1 pnpm smoke:claude:real
MCAS_RUN_REAL_KIRO=1 pnpm smoke:kiro:real
MCAS_RUN_REAL_CODEX=1 pnpm smoke:harness:codex:real
```

Expected result: each enabled smoke returns verifier status `passed` and writes no raw secrets to artifacts.
The Harness smoke must execute the standard `implement -> review -> qa` chain and write `diagnosticLayer` on failure so the failing layer is one of `schema`, `prompt`, `workspace`, or `expected-check`.

## Optional CI Gate

The default GitHub Actions workflow runs repository-local checks only: `pnpm check`, `pnpm test`, `pnpm test:mutation:gate`, `git diff --check`, and `pnpm mcas doctor`. It does not require local coding CLIs and does not call real model CLIs.

To enable the Codex Harness smoke in CI, set the repository variable `MCAS_RUN_REAL_CODEX` to `1` or run the workflow manually with `run_real_codex=true`. The real step uses `pnpm smoke:harness:codex:real`.

## Release Evidence

Record:

- Git commit SHA.
- Commands run and exit codes.
- Real smoke environment variables used, or `not run`.
- Known risks and skipped gates.
- Links to changed docs, tests, and artifacts.
