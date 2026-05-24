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
curl -fsSL https://raw.githubusercontent.com/Andy20010101/multi-coding-agent-symphony/v8/install.sh | sh
symphony doctor
```

The installer writes shims to `~/.local/bin` by default. If the curl command returns `404`, confirm the repository is public and the requested tag exists. If `symphony` still is not found, add `~/.local/bin` to `PATH` or rerun with `MCAS_BIN_DIR=<dir>` pointing at a directory already on `PATH`. The `v8` tag remains the stable installer baseline; use `MCAS_INSTALL_REF=v12` when you intentionally want the latest verified-adoption release.

Development fallback:

```sh
pnpm install
pnpm symphony doctor
```

Fix the package install or global shim path. `pnpm symphony doctor` is the development fallback; direct `symphony doctor` requires the installer-created shim or another package bin shim.

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

## Project Intake Provider Unavailable

Symptom: `symphony scan --grill` or `symphony intake --provider grill-me-docs` reports `providerStatus: "unavailable"`.

Check:

```sh
command -v grill-me-docs
pnpm symphony scan --grill --json
pnpm mcas intake --project-dir . --provider grill-me-docs --provider-command grill-me-docs
```

The built-in intake provider still writes `project-context` and `intake-summary` without `grill-me-docs`. `symphony scan --grill` falls back to builtin when the optional provider is unavailable. Add `--require-grill` or `--require-provider` only when the external provider must be present; that mode returns usage exit code `64` if discovery fails.

## Symphony Latest State Missing

Symptom: `symphony status` prints `Status: no runs yet`, or `symphony artifacts` has no paths.

Run:

```sh
pnpm symphony scan
pnpm symphony status
pnpm symphony artifacts
```

The `.symphony/context/latest.json` and `.symphony/runs/latest.json` files are product-layer pointers only. Full context, summary, evidence, TaskPacket, and Harness files remain in runtime artifact directories. Remove stale `.symphony/` pointers only after preserving any artifact paths you still need.

## Prompt Route Is Unexpected

Symptom: `symphony "<prompt>" --json` selects a safer route than expected.

Check the JSON `routeDecision.matchedSignals`, `intent`, `pipeline`, and `safetyMode`. The router is deterministic and model-free. Mixed prompts such as `跑测试并修复失败` verify first unless `--write`, `--real <adapter>`, or explicit write wording changes the safety mode.

## New Project Preview Did Not Create Files

Symptom: `symphony new my-app --template node-cli` or `symphony "创建一个新的 node cli 项目"` reports success but no target directory exists.

Default new-project mode is dry-run preview. Use explicit write mode:

```sh
pnpm symphony new my-app --template node-cli --write
```

v8 only supports `empty`, `node-cli`, and `web-app` placeholders. It does not run framework generators, install dependencies, or call the network.

## Project Intake Fail-On Gate

Symptom: `pnpm mcas intake --project-dir . --fail-on high` exits `70`.

Check the printed `contextArtifactPath` and inspect `risks`:

```sh
pnpm mcas intake --project-dir . --runtime-dir tmp/intake-debug
node -e "const fs=require('fs'); const p='tmp/intake-debug/artifacts/project-intake/project-context.json'; console.log(JSON.parse(fs.readFileSync(p,'utf8')).risks)"
```

Lower the gate only for exploratory scans, or fix the high/critical risk before using the artifact as work preflight evidence.

## Project Intake Scan Limits

Symptom: the `project-context` artifact has `inventory.truncated: true` or misses files from large/generated directories.

Current v7 limits are deterministic: 5000 files, 256 KiB per text file, depth 8, with `.git`, `node_modules`, `.pnpm-store`, `tmp`, `.mcas`, `.omx/logs`, `coverage`, and `.stryker-tmp` ignored. Move generated outputs outside the source tree or add the missing project facts to `README.md`, `AGENTS.md`, or docs before rerunning intake.

## Project Intake Missing Verification Scripts

Symptom: `verificationCommands` contains `manual verification required`.

Add a package script such as `check`, `test`, `lint`, or `test:mutation:gate`, or document the manual verification command in the project README. `symphony work --preflight-intake` copies detected verification commands into TaskPacket constraints so later workflow evidence can see them.

## Workspace Conflict

Symptom: primary writer allocation fails.

Cause: one task already has a primary writer workspace.

Use a new task id or clean the configured runtime workspace directory after preserving needed artifacts.
