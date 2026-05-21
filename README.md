# Multi Coding Agent Symphony

Multi Coding Agent Symphony is a prompt-driven orchestration CLI for scanning projects, routing work, recording evidence, and running multiple coding CLIs through stable task contracts.

Start with the product CLI:

```sh
symphony doctor
symphony scan
symphony do "inspect README"
symphony "修复失败的测试"
symphony status
```

The target CLIs are:

- Codex with GPT models.
- Claude Code connected to the DeepSeek API in the user's environment.
- Kiro CLI using Claude models.

The system should preserve each CLI's native harness instead of replacing it. The orchestrator owns task queueing, workspace isolation, routing, policy, verification, traces, and artifacts. Runtime adapters translate shared task contracts into the concrete CLI invocation, configuration, hooks, and output collection for each tool.

## Current Documents

- [Architecture](docs/architecture.md)
- [Core Contracts](docs/core-contracts.md)
- [Adapter Contract](docs/adapter-contract.md)
- [Module Plan](docs/module-plan.md)
- [BDD and TDD Workflow](docs/bdd-tdd-workflow.md)
- [Eval Replay Plugin](docs/eval-replay-plugin.md)
- [Real CLI Integration](docs/real-cli-integration.md)
- [Symphony Layer](docs/symphony-layer.md)
- [Operational Execution Order](docs/operational-execution-order.md)
- [Security Checklist](docs/security-checklist.md)
- [Release Checklist](docs/release-checklist.md)
- [Troubleshooting](docs/troubleshooting.md)
- [Harness Symphony Integration](docs/harness-symphony-integration.md)
- [Post v4 Next Steps](docs/post-v2-alpha-next-steps.md)
- [Project Completion Plan](docs/plans/project-completion-plan-2026-05-13.md)
- [V1 to V2 Evolution Plan](docs/plans/v1-to-v2-evolution-plan-2026-05-14.md)
- [ADR 0001: Use BDD and TDD](docs/adr/0001-use-bdd-tdd.md)
- [ADR 0002: Harness Protocol Bridge](docs/adr/0002-integrate-harness-through-protocol-bridge.md)

## Current Status

Implemented:

- Contract validation for task, command, adapter, model, evidence, policy, and routing objects.
- Durable artifacts, session events, queue state, workspace allocation, and workflow run records.
- Real adapter paths for Codex, Claude Code, and Kiro CLI with opt-in model smokes.
- User-facing `symphony` commands for doctor, dry-run work, native agent passthrough proof capture, Harness passthrough, and eval replay dispatch.
- User-facing `symphony intake` for read-only project scans that write reusable `project-context` and `intake-summary` artifacts without invoking real models.
- v8 product commands: `symphony scan`, `symphony do`, `symphony verify`, `symphony status`, `symphony artifacts`, `symphony continue`, `symphony new`, and deterministic prompt routing through `symphony "<prompt>"`.
- Product state pointers under `.symphony/context/latest.json`, `.symphony/runs/latest.json`, and `.symphony/runs/<run-id>.json`; canonical evidence and artifacts remain in `ArtifactStore` runtime directories.
- Curl-installable global `symphony` and `mcas` shims for use from any repository without `pnpm link --global`.
- Kernel/debug `pnpm mcas` commands for doctor, project intake, GitHub issue intake, manual queueing, task execution, smoke dispatch, Harness Bridge execution, and eval replay dispatch.
- V1.5 Harness Bridge dry-run execution across implemented TaskPacket modes, plus gated real CLI lanes from JSON TaskPackets into Symphony artifacts and Harness verification records.
- V2 ensemble flows for proposal-only, writer-reviewer, parallel-lanes, qa-swarm, and competitive-patch, with verifier-readable role, lane, QA, and candidate evidence.
- Continuation turns and stall detection in `orchestrator.runCommand`, including retryable verifier failures, activity tracking, and `stall-timeout` records.
- Security gates for redaction, path/shell/network policy, and adapter-local permission mapping.
- External eval replay plugin flow for stored artifacts, including workflow-mode comparison reports for linear, proposal-only, writer-reviewer, parallel-lanes, qa-swarm, and competitive-patch evidence.

Current baseline: `pnpm test` passes 42 test files; the targeted v7 intake and CLI Node suite covers 46 tests across 8 suites.

## Design Center

The central abstraction is `CommandSpec`, not a long prompt. A command such as `plan`, `implement`, `review`, `fix-ci`, or `qa` defines input schema, allowed tools, workspace policy, completion criteria, and evidence requirements.

CLI-specific behavior belongs in `AdapterMapping`. Model-specific behavior belongs in `ModelProfile`. Verification belongs in `Verifier` and should rely on evidence, not model self-report.

Project implementation follows BDD plus TDD. Behavior scenarios are written before implementation, failing tests are written before production code, and module completion requires verifier-readable evidence.

## V1 Scope

V1 should prove a single-writer, multi-review flow:

- One issue has one primary writer workspace.
- Review and QA agents run in separate workspaces.
- Shared state is stored as artifacts, session events, traces, and evidence.
- The first tracker should be one of GitHub or Linear, not both.
- The first adapters should be Codex plus one of Claude Code or Kiro CLI.

## Development

This repository currently uses Node.js built-in tooling with no third-party runtime or test dependencies.

Run checks:

```sh
pnpm check
pnpm test
pnpm test:mutation:gate
git diff --check
pnpm mcas doctor
pnpm mcas intake --project-dir . --runtime-dir tmp/v7-intake-runtime
node scripts/symphony.js doctor
pnpm symphony doctor
pnpm symphony scan
pnpm symphony do --dry-run "inspect README"
pnpm symphony verify --dry-run "inspect README"
pnpm symphony "扫描这个仓库"
pnpm symphony "审查当前改动"
pnpm symphony status
pnpm smoke:codex:help
pnpm smoke:claude:help
pnpm smoke:kiro:help
```

Install the user CLI:

```sh
curl -fsSL https://raw.githubusercontent.com/Andy20010101/multi-coding-agent-symphony/v7/install.sh | sh
symphony doctor
```

The installer clones or updates the `v7` release under `~/.local/share/mcas`, writes `~/.local/bin/symphony` and `~/.local/bin/mcas` shims, installs dependencies with `pnpm install --frozen-lockfile`, and verifies the install with `symphony doctor`. Set `MCAS_INSTALL_DIR`, `MCAS_BIN_DIR`, `MCAS_INSTALL_REF`, `MCAS_REPO_SLUG`, or `MCAS_REPO_URL` to override the defaults.

Development fallback from a checkout:

```sh
pnpm install
pnpm symphony doctor
```

Run the user CLI:

```sh
symphony doctor
symphony scan
symphony do --dry-run "inspect README"
symphony verify --dry-run "inspect README"
symphony "扫描这个仓库"
symphony "审查当前改动"
symphony "修复失败的测试"
symphony status
symphony artifacts
symphony new tmp/v8-demo --template empty --dry-run
symphony "创建一个新的 node cli 项目" --dry-run
```

`symphony scan` is the product name for the v7 intake/grill-me-docs capability. `symphony do` uses the latest scan context when its project fingerprint is fresh, and reruns scan when the context is missing or stale. `symphony review` and `symphony verify` keep distinct product intent metadata even while they reuse the qa-swarm Harness path. Prompt routing is deterministic and model-free; it matches rules for scan, work, review, verify, status, artifacts, continue, and new-project intents.

`.symphony/` stores local user-facing pointers and summaries. Add it to your local ignore rules if you do not want run pointers in source control. Full evidence, TaskPackets, Harness output, scaffold manifests, and intake artifacts stay in the runtime artifact directories written through `ArtifactStore`.

Advanced compatibility commands:

```sh
symphony intake
symphony intake --project-dir . --output-dir tmp/symphony-intake
symphony work --dry-run "inspect README"
symphony work --preflight-intake --dry-run "inspect README"
symphony work --intake-artifact tmp/symphony-intake/<run-id>/runtime/artifacts/project-intake/project-context.json --dry-run "inspect README"
symphony work --mode writer-reviewer --dry-run "update README"
symphony review --dry-run "inspect README"
symphony qa --dry-run "inspect README"
symphony agent claude /review --dry-run
symphony replay --artifacts tmp/artifacts --events tmp/events --reason model-upgrade
```

Advanced kernel/debug commands remain under `pnpm mcas`:

```sh
pnpm mcas doctor
pnpm mcas doctor --real-cli --proof-dir tmp/real-cli-proofs
pnpm mcas intake --project-dir . --runtime-dir .mcas
pnpm mcas intake --project-dir . --provider grill-me-docs --provider-command grill-me-docs
pnpm mcas github issue --repo OWNER/REPO --number 123
pnpm mcas queue manual --state-file .mcas/queue.json --id task-1 --repo OWNER/REPO --objective "Do the work" --acceptance "Verifier evidence is written"
pnpm mcas run-next --state-file .mcas/queue.json --runtime-dir .mcas
pnpm mcas run-task --task-file task.json --runtime-dir .mcas
pnpm mcas harness run-taskpacket --run-id fixture-run --taskpacket fixtures/harness/scaffold-taskpacket.json --runtime-dir tmp/harness-bridge
MCAS_RUN_REAL_CODEX=1 pnpm smoke:harness:codex:real
pnpm mcas smoke codex
pnpm mcas eval replay -- --artifacts tmp/artifacts --events tmp/events --reason model-upgrade
pnpm mcas eval replay -- --artifacts tmp/eval-replay-comparison-artifacts --workflow-comparison-fixture workflow-comparison --reason workflow-mode-comparison --compared-at 2026-05-16T00:00:00.000Z
```

`symphony scan` scans a checkout in read-only mode, writes `project-context` and `intake-summary` JSON artifacts through `ArtifactStore` under task id `project-intake`, and writes latest context/run pointers under `.symphony/`. The built-in provider is deterministic and does not invoke models. `--grill` uses the optional `grill-me-docs` adapter with builtin fallback; `--require-grill` fails when the provider is unavailable.
`symphony do` is the default product workflow entry. It creates a minimal Harness TaskPacket under `tmp/symphony-work/<run-id>/`, runs the existing Harness Bridge in dry-run mode by default, and prints intent, pipeline, safety mode, verifier status, artifact paths, and next action. Add `--real <codex|claude|kiro>` only with the matching `MCAS_RUN_REAL_*` gate.
`symphony intake` and `symphony work` remain advanced compatibility commands. Their default JSON behavior is preserved unless routed through the v8 aliases.
`symphony review` and `symphony qa` are shortcuts for dry-run qa-swarm workflow execution through the same Harness Bridge path.
`symphony agent claude /review --dry-run` captures native command metadata and a proof artifact without invoking Claude. Add `--real` only with `MCAS_RUN_REAL_CLAUDE=1`.
`symphony harness ...` and `symphony replay ...` are compatibility passthroughs to the existing `mcas harness ...` and `mcas eval replay ...` paths.
`mcas` remains the advanced kernel/debug CLI for queueing, TaskSpec files, direct Harness TaskPackets, smokes, and low-level diagnostics.

Command hierarchy:

```text
symphony intake   read-only project context scan
symphony work     user workflow entry
symphony scan     product project scan alias
symphony do       product work alias
symphony verify   product verification alias
symphony status   latest run state
symphony artifacts artifact and evidence pointers
symphony new      limited dry-run/write project bootstrap
symphony agent    native CLI passthrough
symphony review   shortcut for review workflow
symphony qa       shortcut for QA workflow
symphony replay   eval replay reports
symphony doctor   environment and gate checks
mcas              advanced kernel/debug commands
```

`doctor --real-cli` preflights installed real CLI binaries, gate variables, configured model profiles, provider/auth alignment, and optional proof artifact writing without invoking a model.
`mcas intake` is the machine-facing project intake surface. It accepts `--project-dir`, `--runtime-dir`, `--artifact-dir`, `--event-dir`, `--session-id`, `--provider`, `--provider-command`, `--require-provider`, `--fail-on`, and `--format`. It writes `.mcas/artifacts/project-intake/project-context.json` and `.mcas/artifacts/project-intake/intake-summary.json` by default.
`github issue` is read-only issue intake. It calls `gh issue view`, converts the response into a validated `TaskSpec`, and does not invoke a model.
`queue manual` writes a validated manual `TaskSpec` into a persistent `TaskQueue` state file without invoking adapters.
`run-next` leases the next queued task and runs the existing standard dry-run workflow, returning verifier status and artifact ids.
`run-task` runs a TaskSpec JSON file through the same dry-run workflow without reading or writing queue state.
`harness run-taskpacket` converts a Harness JSON TaskPacket into Symphony artifacts and Harness verification records. Supported `workflow.mode` values are `linear`, `writer-reviewer`, `parallel-lanes`, `qa-swarm`, and `competitive-patch`; add `--real --adapter <codex|claude|claude-code|kiro|kiro-cli>` plus the matching `MCAS_RUN_REAL_*` gate to select a real CLI lane.
`smoke <codex|claude|kiro>` dispatches the existing package smoke scripts and propagates their exit codes; add `--real` only when the underlying real smoke gate is intended. Set `MCAS_REAL_CLI_PROOF_DIR=<dir>` during real smokes to persist release proof artifacts; Claude proof artifacts include requested and observed model profiles when the CLI reports an init model.
`eval replay` dispatches the existing eval replay package script and passes through all remaining arguments. Add `--workflow-comparison-file <json>` or `--workflow-comparison-fixture workflow-comparison` to write a verifier-first comparison report artifact without invoking real CLIs.

Workflow commands also accept `--config mcas.config.json`. The config file can provide `runtime.stateFile`, `runtime.artifactDirectory`, `runtime.eventDirectory`, `runtime.workspaceDirectory`, and `runtime.sessionId`; explicit command flags take precedence.
