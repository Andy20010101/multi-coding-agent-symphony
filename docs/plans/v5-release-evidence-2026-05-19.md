# v5 Release Evidence

Date: 2026-05-19
Base tag: `v4`
Scope: v5 usability CLI, direct `symphony` entrypoint, review/QA shortcuts, real CLI proof closure.

## Local Gates

All commands exited `0`:

```sh
pnpm check
pnpm test
git diff --check
pnpm mcas doctor
node --test tests/security-policy.test.js tests/phase3.test.js
```

`pnpm test` result: 40 test files passed.

Mutation gate:

```sh
pnpm test:mutation:gate
```

Result: passed. Final mutation score `74.18`; break threshold `60`; killed `1762`; timed out `5`; survived `494`; no errors.

## Harness And Eval Proofs

All Harness dry-run release fixtures returned `status: passed` and `verifierStatus: passed`:

```sh
pnpm mcas harness run-taskpacket --run-id fixture-run --taskpacket fixtures/harness/scaffold-taskpacket.json --runtime-dir tmp/harness-bridge
pnpm mcas harness run-taskpacket --run-id fixture-writer-reviewer --taskpacket fixtures/harness/writer-reviewer-taskpacket.json --runtime-dir tmp/harness-writer-reviewer --harness-dir tmp/harness-writer-reviewer-output
pnpm mcas harness run-taskpacket --run-id fixture-parallel-lanes --taskpacket fixtures/harness/parallel-lanes-taskpacket.json --runtime-dir tmp/harness-parallel-lanes --harness-dir tmp/harness-parallel-lanes-output
pnpm mcas harness run-taskpacket --run-id fixture-qa-swarm --taskpacket fixtures/harness/qa-swarm-taskpacket.json --runtime-dir tmp/harness-qa-swarm --harness-dir tmp/harness-qa-swarm-output
pnpm mcas harness run-taskpacket --run-id fixture-competitive-patch --taskpacket fixtures/harness/competitive-patch-taskpacket.json --runtime-dir tmp/harness-competitive-patch --harness-dir tmp/harness-competitive-patch-output
```

Eval replay comparison:

```sh
pnpm mcas eval replay -- --artifacts tmp/eval-replay-comparison-artifacts --workflow-comparison-fixture workflow-comparison --reason workflow-mode-comparison --compared-at 2026-05-16T00:00:00.000Z
```

Report path: `tmp/eval-replay-comparison-artifacts/eval-reports/eval-workflow-comparison-workflow-mode-comparison-workflow-comparison.json`.

## Real CLI Proofs

Real CLI preflight:

```sh
MCAS_RUN_REAL_CODEX=1 MCAS_RUN_REAL_CLAUDE=1 MCAS_RUN_REAL_KIRO=1 pnpm mcas doctor --real-cli --require-gates --proof-dir tmp/real-cli-proofs
```

Result: `status: ok`; proof path `tmp/real-cli-proofs/real-cli-doctor-proof.json`.

Real model smokes:

```sh
MCAS_RUN_REAL_CODEX=1 MCAS_REAL_CLI_PROOF_DIR=tmp/real-cli-proofs pnpm smoke:codex:real
MCAS_RUN_REAL_CLAUDE=1 MCAS_REAL_CLI_PROOF_DIR=tmp/real-cli-proofs pnpm smoke:claude:real
MCAS_RUN_REAL_KIRO=1 MCAS_REAL_CLI_PROOF_DIR=tmp/real-cli-proofs pnpm smoke:kiro:real
MCAS_RUN_REAL_CODEX=1 MCAS_REAL_CLI_PROOF_DIR=tmp/real-cli-proofs pnpm smoke:harness:codex:real
```

Passing proof paths:

- Codex smoke: `tmp/real-cli-proofs/2026-05-19T09-28-42-855Z-codex-real-cli-proof.json`
- Claude Code smoke: `tmp/real-cli-proofs/2026-05-19T09-30-48-451Z-claude-code-real-cli-proof.json`
- Kiro smoke: `tmp/real-cli-proofs/2026-05-19T09-35-07-915Z-kiro-cli-real-cli-proof.json`
- Codex Harness standard chain: `tmp/real-cli-proofs/2026-05-19T09-40-04-898Z-codex-real-cli-proof.json`

Direct v5 CLI real proofs:

```sh
MCAS_RUN_REAL_CODEX=1 symphony work --real codex --timeout-ms 240000 "inspect README"
MCAS_RUN_REAL_CLAUDE=1 symphony agent claude /review --real --timeout-ms 180000
```

Results:

- `symphony work`: passed with workflow mode `qa-swarm`, verifier status `passed`, changed files `[]`, proof path `tmp/real-cli-proofs/symphony-work-qa-swarm-0b715eb7922b-work-proof.json`.
- `symphony agent`: passed with native command `claude -p /review`, proof path `tmp/symphony-agent/symphony-agent-claude-review-e3b0c44298fc/proof/native-agent-proof.json`; native passthrough remains `verifierStatus: unverified` by design.

## Fixes Found During Release Closure

- Kiro CLI can emit ANSI-styled JSON and `detail` check fields. `src/evidence-parser.js` now strips ANSI control sequences before JSON parsing and normalizes check `detail` into verifier-readable `output`.
- `symphony agent claude /review --real` originally launched interactive `claude /review` and timed out after 180 seconds. It now launches non-interactive `claude -p /review`.

## Known Release Notes

- GitHub Actions CI was not run locally.
- No remote push was performed during local release closure.
- Real proof artifacts live under ignored `tmp/` paths and should be copied or archived separately if the release owner needs durable off-repo evidence.
