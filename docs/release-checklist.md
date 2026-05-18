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
```

Expected result: every command exits with code `0`. The mutation gate runs Stryker against the hardened core modules and must stay above its configured break threshold.

For a scoped closeout, an operator may explicitly approve an incremental Stryker gate. Record the exact mutation ranges, test files, score, and break threshold. Before tagging a release, prefer the full `pnpm test:mutation:gate` unless the release owner accepts the recorded incremental gate as sufficient evidence.

## Required Harness Dry-Run Proof

Run from the repository root:

```sh
pnpm mcas harness run-taskpacket --run-id fixture-run --taskpacket fixtures/harness/scaffold-taskpacket.json --runtime-dir tmp/harness-bridge
pnpm mcas harness run-taskpacket --run-id fixture-writer-reviewer --taskpacket fixtures/harness/writer-reviewer-taskpacket.json --runtime-dir tmp/harness-writer-reviewer --harness-dir tmp/harness-writer-reviewer-output
pnpm mcas harness run-taskpacket --run-id fixture-parallel-lanes --taskpacket fixtures/harness/parallel-lanes-taskpacket.json --runtime-dir tmp/harness-parallel-lanes --harness-dir tmp/harness-parallel-lanes-output
pnpm mcas harness run-taskpacket --run-id fixture-qa-swarm --taskpacket fixtures/harness/qa-swarm-taskpacket.json --runtime-dir tmp/harness-qa-swarm --harness-dir tmp/harness-qa-swarm-output
pnpm mcas harness run-taskpacket --run-id fixture-competitive-patch --taskpacket fixtures/harness/competitive-patch-taskpacket.json --runtime-dir tmp/harness-competitive-patch --harness-dir tmp/harness-competitive-patch-output
```

Expected result:

- All five commands return verifier status `passed` and write Harness evidence.
- Writer-reviewer links writer and reviewer artifacts.
- Parallel-lanes preserves disjoint write-set ownership.
- Qa-swarm preserves findings, missing-evidence artifacts, no-finding rationale, and verifier authority.
- Competitive-patch preserves candidate patch artifacts and exactly one verifier-selected candidate.

## Required Eval Replay Comparison Proof

Run from the repository root:

```sh
pnpm mcas eval replay -- --artifacts tmp/eval-replay-comparison-artifacts --workflow-comparison-fixture workflow-comparison --reason workflow-mode-comparison --compared-at 2026-05-16T00:00:00.000Z
```

Expected result:

- The command writes an eval report artifact.
- The report compares linear, proposal-only, writer-reviewer, parallel-lanes, qa-swarm, and competitive-patch.
- The report preserves verifier status, workflow-specific evidence fields, and explicit unknown cost/resource profiles.

## Optional Local CLI Help Smokes

Run these only when validating installed CLI binaries:

```sh
pnpm smoke:codex:help
pnpm smoke:claude:help
pnpm smoke:kiro:help
```

Expected result: help smokes verify local binaries only and must not invoke model APIs.

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
Set `MCAS_CLAUDE_MODEL=<provider-model>` for Claude Code providers that do not map the default `deepseek-claude-code` profile.
The Harness smoke must execute the standard `implement -> review -> qa` chain and write `diagnosticLayer` on failure so the failing layer is one of `schema`, `prompt`, `workspace`, or `expected-check`.

## Optional CI Gate

The default GitHub Actions workflow runs repository-local checks only: `pnpm check`, `pnpm test`, `pnpm test:mutation:gate`, `git diff --check`, and `pnpm mcas doctor`. It does not require local coding CLIs and does not call real model CLIs.

To enable the Codex Harness smoke in CI, set the repository variable `MCAS_RUN_REAL_CODEX` to `1` or run the workflow manually with `run_real_codex=true`. The real step uses `pnpm smoke:harness:codex:real`.

## Release Evidence

Record:

- Git commit SHA.
- Commands run and exit codes.
- Eval replay comparison report reference.
- Real smoke environment variables used, or `not run`.
- Known risks and skipped gates.
- Links to changed docs, tests, and artifacts.
