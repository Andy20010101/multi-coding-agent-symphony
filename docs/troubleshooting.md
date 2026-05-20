# Troubleshooting

## CLI Binary Missing

Symptom: `pnpm smoke:<adapter>:help` fails with command not found.

Check:

```sh
codex exec --help
claude --help
kiro-cli --help
```

Fix the local CLI installation or PATH, then rerun the matching help smoke.

## Symphony Command Missing

Symptom: `symphony doctor` is not found after checkout.

Check:

```sh
pnpm install
pnpm symphony doctor
pnpm link --global
symphony doctor
```

Fix the package install or global link path. `pnpm symphony doctor` is the development fallback; direct `symphony doctor` requires the package bin shim from install/link.

## Native CLI Unavailable

Symptom: `symphony agent claude /review --real` cannot start the native CLI.

Check:

```sh
claude --help
MCAS_RUN_REAL_CLAUDE=1 symphony agent claude /review --real
```

Fix the native CLI installation or PATH. Dry-run agent passthrough writes proof metadata without invoking Claude; real passthrough still requires the native CLI binary.

## Real Smoke Skipped

Symptom: real smoke output says the run was skipped.

Cause: real model calls are gated by environment variables.

Enable only the intended gate:

```sh
MCAS_RUN_REAL_CODEX=1 pnpm mcas doctor --real-cli --adapter codex --require-gates --proof-dir tmp/real-cli-proofs
MCAS_RUN_REAL_CODEX=1 MCAS_REAL_CLI_PROOF_DIR=tmp/real-cli-proofs pnpm smoke:codex:real
MCAS_RUN_REAL_CLAUDE=1 MCAS_REAL_CLI_PROOF_DIR=tmp/real-cli-proofs pnpm smoke:claude:real
MCAS_RUN_REAL_KIRO=1 MCAS_REAL_CLI_PROOF_DIR=tmp/real-cli-proofs pnpm smoke:kiro:real
MCAS_RUN_REAL_CODEX=1 symphony work --real codex "inspect README"
MCAS_RUN_REAL_CLAUDE=1 symphony agent claude /review --real
```

For Claude provider/model mismatches, set `MCAS_CLAUDE_MODEL=<provider-model>` or update `config/real-cli-release.json`. If `claude auth status` reports a different provider than the release config, align `MCAS_CLAUDE_PROVIDER`, the release config provider, or the Claude CLI auth provider before running real smoke. `doctor --real-cli` fails fast when Claude would fall back to the adapter default profile or the auth provider is inconsistent.

## Claude Real Smoke Model Mismatch

Symptom: Claude smoke proof shows `modelProfileStatus: "mismatched"` or evidence `knownRisks` contains `real-cli-model-profile-mismatch`.

Cause: the requested `--model` was accepted by the wrapper, but Claude Code reported a different model in its stream `system/init` event. Check `requestedModelProfile`, `observedModelProfile`, `modelProfileMismatch`, and the local Claude settings that define `ANTHROPIC_MODEL`, provider base URL, or provider aliases.

Fix the release config, `MCAS_CLAUDE_MODEL`, `MCAS_CLAUDE_PROVIDER`, or the local Claude provider settings so `doctor --real-cli --adapter claude --require-gates` passes and the next proof artifact reports `modelProfileStatus: "matched"`.

## Structured Output Schema Failure

Symptom: verifier reports missing checks, invalid evidence, or `real-cli-output-unverified`.

Check:

- The adapter raw stdout/stderr artifacts.
- `schemas/evidence-package.schema.json` for strict object fields.
- The final message artifact for Codex real runs.
- The relevant adapter test: `node --test tests/codex-real-cli.test.js`, `node --test tests/claude-real-cli.test.js`, or `node --test tests/kiro-real-cli.test.js`.

## Proof Artifact Unverified

Symptom: `symphony agent ...` summary reports `verifierStatus: "unverified"`.

Check the proof artifact path from the summary, plus any stdout/stderr artifact paths. Level 1 native passthrough captures command metadata and redacted process output; it does not prove Harness verifier completion. Use `symphony work` when a verifier-passed Harness workflow is required.

## Policy Denied Before Adapter Start

Symptom: `PolicyDeniedError` appears and no adapter run starts.

Check the `policy.decision` event. Common causes:

- Sensitive path request matched `.env`, `.env.*`, `.ssh`, `.npmrc`, `.netrc`, or `secrets`.
- Shell command did not match `allowedCommands` or `allowedCommandPatterns`.
- Network policy is `disabled` or `restricted` without a matching `allowedNetworkHosts` entry.

Run:

```sh
node --test tests/security-policy.test.js
```

## GitHub Intake Fails

Symptom: `pnpm mcas github issue ...` cannot fetch an issue.

Check:

```sh
gh auth status
gh issue view 123 --repo OWNER/REPO --json number,title,body,url,state,labels,assignees,milestone
```

The MCAS CLI uses `gh issue view` for read-only intake and does not invoke a model.

## Workspace Conflict

Symptom: primary writer allocation fails.

Cause: one task already has a primary writer workspace.

Use a new task id or clean the configured runtime workspace directory after preserving needed artifacts.
