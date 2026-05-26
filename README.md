# Multi Coding Agent Symphony

Multi Coding Agent Symphony is a prompt-driven orchestration CLI for scanning projects, routing work, recording evidence, and running multiple coding CLIs through stable task contracts.

Start with the product CLI:

```sh
symphony doctor
symphony scan
symphony do "inspect README"
symphony "修复失败的测试"
symphony status
symphony diagnose
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
- [Symphony Product JSON Contracts](docs/symphony-product-contracts.md)
- [Operational Execution Order](docs/operational-execution-order.md)
- [Security Checklist](docs/security-checklist.md)
- [Release Checklist](docs/release-checklist.md)
- [Troubleshooting](docs/troubleshooting.md)
- [Harness Symphony Integration](docs/harness-symphony-integration.md)
- [v10/v11 Release Evidence](docs/plans/v10-v11-release-evidence-2026-05-24.md)
- [v12 Verified Adoption Plan](docs/plans/v12-verified-adoption-plan-2026-05-24.md)
- [v12 Release Evidence](docs/plans/v12-release-evidence-2026-05-24.md)
- [v12 Execution Prompt](docs/plans/v12-execution-prompt-2026-05-24.md)
- [v13 Workbench Information Architecture Plan](docs/plans/v13-workbench-information-architecture-plan-2026-05-25.md)
- [v13 Release Evidence](docs/plans/v13-release-evidence-2026-05-25.md)
- [v13.1 Release Evidence](docs/plans/v13.1-release-evidence-2026-05-25.md)
- [v13 Execution Prompt](docs/plans/v13-execution-prompt-2026-05-25.md)
- [v14 Release Evidence](docs/plans/v14-release-evidence-2026-05-26.md)
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
- Stable product JSON contract fields for automation: `contractVersion`, `contractName`, `contract`, `identity`, `safety`, `workflow`, `artifactRefs`, `action`, and `timestamps`.
- Read-only local `symphony console` workbench for browsing latest runs, verifier status, readiness checks, copy-only next commands, timelines, risk summaries, run filters, recent-run diagnostics, and artifact pointers from `.symphony` state.
- Controlled diagnostics CLI `symphony diagnose` for terminal summaries, stable JSON reports, and redirectable static HTML reports without starting a browser server.
- v11 controlled kernel execution plans: `symphony do --write` creates an auditable isolated-workspace plan with the exact confirm command, and `symphony do --confirm-plan <plan-id>` executes only the frozen plan.
- v12 verified adoption: `symphony adopt --run <run-id>` freezes verifier-passing isolated workspace changes as a text-only patch plan, and `symphony adopt --confirm <adoption-id>` applies only that frozen patch after fingerprint and `git apply --check` validation.
- v12 adoption recovery visibility: confirmation writes a registered journal before `git apply`, and `symphony adopt --inspect <adoption-id> --json` reports plan refs, journal refs, latest confirmation state, and current worktree hash matches without writing files.
- v13 Workbench information architecture: the default console view is a compact Overview, with adoption recovery, runs, diagnostics, artifacts, and raw/debug detail behind dedicated read-only sections.
- v13.1 Workbench Chinese presentation layer: visible Workbench labels, empty states, status text, and command descriptions render in Chinese while JSON contracts, status enums, and copy-only commands remain stable.
- Curl-installable global `symphony` and `mcas` shims for use from any repository without `pnpm link --global`.
- Kernel/debug `pnpm mcas` commands for doctor, project intake, GitHub issue intake, manual queueing, task execution, smoke dispatch, Harness Bridge execution, and eval replay dispatch.
- V1.5 Harness Bridge dry-run execution across implemented TaskPacket modes, plus gated real CLI lanes from JSON TaskPackets into Symphony artifacts and Harness verification records.
- V2 ensemble flows for proposal-only, writer-reviewer, parallel-lanes, qa-swarm, and competitive-patch, with verifier-readable role, lane, QA, and candidate evidence.
- Continuation turns and stall detection in `orchestrator.runCommand`, including retryable verifier failures, activity tracking, and `stall-timeout` records.
- Security gates for redaction, path/shell/network policy, and adapter-local permission mapping.
- External eval replay plugin flow for stored artifacts, including workflow-mode comparison reports for linear, proposal-only, writer-reviewer, parallel-lanes, qa-swarm, and competitive-patch evidence.

Current released repository tag: `v14`. The `v8` tag remains the stable installer baseline, `v8.2` adds stable product JSON contracts and the local read-only console, `v9` adds the local read-only Workbench entry with readiness, timeline, and copy-only command guidance, v9.1 adds Workbench diagnostics and evidence polish, v10 adds the controlled diagnostics CLI, v11 adds controlled kernel execution plans, v12 adds verified adoption with confirmation recovery visibility, v13 adds the Workbench information architecture cut, v13.1 adds the Workbench Chinese presentation layer, and v14 adds the Stage Kernel Refactor wrapper around Stage Charter, Stage CLI, Stage-aware flows, and Stage blocker recovery. The `v7` tag remains available for historical installs.

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
pnpm --silent symphony do --write --json "inspect README"
pnpm --silent symphony do --confirm-plan <plan-id> --json
pnpm --silent symphony adopt --run <confirmed-run-id> --json
pnpm --silent symphony adopt --inspect <adoption-id> --json
pnpm --silent symphony adopt --confirm <adoption-id> --json
pnpm symphony verify --dry-run "inspect README"
pnpm symphony "扫描这个仓库"
pnpm symphony "审查当前改动"
pnpm symphony status
pnpm symphony console --snapshot --json
pnpm --silent symphony diagnose --json
pnpm --silent symphony diagnose --html > tmp/symphony-diagnostics.html
pnpm smoke:codex:help
pnpm smoke:claude:help
pnpm smoke:kiro:help
```

Install the user CLI:

```sh
curl -fsSL https://raw.githubusercontent.com/Andy20010101/multi-coding-agent-symphony/v8/install.sh | sh
symphony doctor
```

The installer clones or updates the `v8` release under `~/.local/share/mcas`, writes `~/.local/bin/symphony` and `~/.local/bin/mcas` shims, installs dependencies with `pnpm install --frozen-lockfile`, and verifies the install with `symphony doctor`. The `v8` tag remains the stable installer baseline; set `MCAS_INSTALL_REF=v14` when you intentionally want the latest released build. Set `MCAS_INSTALL_REF=v7` only when you need the historical v7 CLI; `MCAS_INSTALL_DIR`, `MCAS_BIN_DIR`, `MCAS_REPO_SLUG`, and `MCAS_REPO_URL` override the other defaults.

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
symphony do --write "inspect README"
symphony do --confirm-plan <plan-id>
symphony adopt --run <confirmed-run-id>
symphony adopt --inspect <adoption-id> --json
symphony adopt --confirm <adoption-id>
symphony verify --dry-run "inspect README"
symphony "扫描这个仓库"
symphony "审查当前改动"
symphony "修复失败的测试"
symphony status
symphony artifacts
symphony console
symphony console --snapshot --json
symphony diagnose
symphony diagnose --json
symphony diagnose --html > report.html
symphony "创建一个新的 React 看板项目" --dry-run --json
symphony "创建一个新的 node cli 项目" --dry-run
```

`symphony scan` is the product name for the v7 intake/grill-me-docs capability. In default `auto` mode it tries optional `grill-me-docs` first, records provider attempts in JSON output, and falls back to the built-in provider when grill-me-docs is unavailable. Use `--builtin` for built-in-only scans and `--require-grill` for a hard failure when grill-me-docs is unavailable.
`symphony do` uses the latest scan context when its project fingerprint is fresh, and reruns scan when the context is missing or stale. `symphony review`, `symphony qa`, and `symphony verify` use the v8 product work path with qa-swarm workflow mode; `qa` is a product command alias for the `verify` semantic command. Prompt routing is deterministic and model-free; it matches rules for scan, work, review, verify, status, artifacts, continue, and new-project intents.
`symphony do --write` is controlled in v11: without `--confirm-plan` it only writes a `symphony.execution-plan` artifact under `.symphony/plans/` and records a planned run. The confirm command reloads that frozen plan, rejects prompt drift, verifies the project fingerprint, checks any required real-agent gate, and then runs the existing kernel workflow in a materialized isolated workspace. It does not apply patches to the main worktree; `mainWorktreeWrites` remains `false`.
`symphony adopt` is controlled in v12: `symphony adopt --run <confirmed-run-id>` only reads a passed v11 isolated-workspace run, verifies source evidence/workspace refs, rejects dirty non-Symphony main worktree changes, and writes `.symphony/adoptions/<adoption-id>.json` plus a registered patch artifact. `symphony adopt --confirm <adoption-id>` accepts no prompt text or execution flags; it rechecks project/git/source/patch fingerprints, runs `git apply --check`, writes `.symphony/adoptions/<adoption-id>-journal.json` plus an `applying` confirmation state, and then applies only the frozen text add/modify patch to the main worktree. `symphony adopt --inspect <adoption-id> --json` is read-only and reports plan refs, journal refs, latest confirmation state, and current worktree matches against `afterHash` and journal `beforeFiles`. Adoption does not invoke adapters, models, package installers, or external services.
New-project prompts produce a `scaffoldPlan` and a separate `scaffold-manifest` artifact. Framework-shaped requests such as React or Vite are reported as unsupported generator requests; Symphony does not run npm installs, framework generators, or dependency installation, and `--write` is still required before any files are created.
Every product `--json` response keeps its legacy top-level fields and adds a stable machine-readable envelope: `contractVersion`, `contractName`, `identity`, `safety`, `workflow`, `artifactRefs`, `action`, and `timestamps`. `symphony console --snapshot --json` returns the same read-only run model without starting a server; see [Symphony Product JSON Contracts](docs/symphony-product-contracts.md) for v8.2 and v9 contract examples.
`symphony console` starts a local read-only workbench on `127.0.0.1:8765` by default. It serves `/`, `/api/summary`, `/api/readiness`, `/api/runs`, `/api/runs/latest`, `/api/runs/<run-id>`, `/api/runs/<run-id>/timeline`, and `/api/runs/<run-id>/artifacts/<kind>`; all non-GET requests return `405`. The workbench shows readiness, latest run health, recent run diagnostics, run filters for `all`, `passed`, `failed`, `dry-run`, `real`, `scan`, and `verify`, a risk panel, run detail sections, registered artifacts, adoption plan refs, patch refs, changed files, and grouped copy-only commands. It does not add browser write, execute, retry, delete, apply, or arbitrary path-read controls. Artifact preview only reads paths already referenced by a run state and truncates file previews after 200 KiB.
`symphony diagnose` reads the same `.symphony` state and readiness probes without starting the Workbench. The default output is a compact terminal summary; `--json` emits the stable `symphony.diagnostics-report` contract; `--html` writes a single static, script-free HTML document to stdout so it can be redirected with `symphony diagnose --html > report.html`. `--json` and `--html` are mutually exclusive, `--state-dir <path>` selects an alternate state directory, and all suggested commands remain copy-only text. v12 diagnostics surface pending/stale adoption plans, unsupported adoption changes, dirty-worktree blockers with dirty path details, applying adoption journals, and post-apply evidence failures.

`.symphony/` stores local user-facing pointers and summaries. Add it to your local ignore rules if you do not want run pointers in source control. Full evidence, TaskPackets, Harness output, scaffold manifests, and intake artifacts stay in the runtime artifact directories written through `ArtifactStore`.

Advanced compatibility commands:

```sh
symphony intake
symphony intake --project-dir . --output-dir tmp/symphony-intake
symphony work --dry-run "inspect README"
symphony work --preflight-intake --dry-run "inspect README"
symphony work --intake-artifact tmp/symphony-intake/<run-id>/runtime/artifacts/project-intake/project-context.json --dry-run "inspect README"
symphony work --mode writer-reviewer --dry-run "update README"
symphony work --mode qa-swarm --dry-run "inspect README"
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

`symphony scan` scans a checkout in read-only mode, writes `project-context` and `intake-summary` JSON artifacts through `ArtifactStore` under task id `project-intake`, and writes latest context/run pointers under `.symphony/`. The built-in provider is deterministic and does not invoke models. Default `auto` and explicit `--grill` try the optional `grill-me-docs` adapter with builtin fallback; `--builtin` stays builtin-only; `--require-grill` fails when the provider is unavailable.
`symphony do` is the default product workflow entry. It creates a minimal Harness TaskPacket under `tmp/symphony-work/<run-id>/`, runs the existing Harness Bridge in dry-run mode by default, and prints intent, pipeline, safety mode, verifier status, artifact paths, and next action. Add `--real <codex|claude|kiro>` only with the matching `MCAS_RUN_REAL_*` gate.
`symphony intake` and `symphony work` remain advanced compatibility commands. Their default JSON behavior is preserved unless routed through the v8 aliases.
`symphony review` and `symphony qa` route through the v8 product work path; use `symphony work --mode qa-swarm` for the advanced legacy qa-swarm path.
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
symphony console  read-only local workbench
symphony diagnose read-only diagnostics report
symphony adopt    controlled verified adoption
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
