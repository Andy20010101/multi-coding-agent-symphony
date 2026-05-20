# v5 Usability Release Plan

Date: 2026-05-19
Status: implemented, real-proofed, and ready for local v5 tag
Baseline: `v4` at `3ca2d93`
Release evidence: [v5-release-evidence-2026-05-19.md](v5-release-evidence-2026-05-19.md)

## Goal

Make the project usable as an agent-work CLI instead of requiring operators to call low-level `pnpm mcas harness run-taskpacket ...` commands directly.

The v5 release should preserve the existing Harness/Symphony evidence-first core, while adding a short product-facing command surface:

```sh
symphony work "fix the failing tests"
symphony agent claude /review
symphony doctor
```

`mcas` remains the low-level compatibility and debugging entrypoint.

## Principles

- `symphony` is the user CLI; `mcas` is the kernel CLI.
- Direct `symphony ...` usage is the target experience; `pnpm symphony ...` is only the development fallback.
- Simple tasks should feel lightweight; Harness, TaskPacket, runtime directories, and proof directories should be hidden by default.
- Real CLI execution stays opt-in through existing `MCAS_RUN_REAL_*` gates.
- All real execution still produces structured proof, evidence, verifier status, and artifact paths.
- No new dependencies for v5 unless explicitly approved.

## Stage 1: CLI Identity

Objective: make `symphony` a first-class command before building more UX on top of it.

Scope:

- Add `bin` entries in `package.json`:

```json
{
  "bin": {
    "symphony": "scripts/symphony.js",
    "mcas": "scripts/mcas.js"
  }
}
```

- Add `scripts/symphony.js` as the user-facing CLI wrapper.
- Keep `scripts/mcas.js` as the existing kernel CLI.
- Support direct commands:

```sh
symphony doctor
symphony replay ...
symphony harness ...
```

- `symphony doctor` should call the same health path as `mcas doctor`.
- `symphony harness ...` may passthrough to `mcas harness ...`, but docs should label it advanced.

Acceptance:

```sh
node scripts/symphony.js doctor
pnpm symphony doctor
symphony doctor
```

All return the same health summary once linked or installed.

Verification:

- Add CLI tests for `symphony doctor`.
- Add a package metadata test for `bin.symphony`.
- Run `pnpm check`, targeted CLI tests, `pnpm test`.

## Stage 2: `symphony work`

Objective: provide the default MCAS workflow entrypoint for real agent work.

Command shape:

```sh
symphony work "fix the failing tests"
symphony work --mode writer-reviewer "update README"
symphony work --mode competitive-patch --real codex "implement the feature"
symphony work --dry-run "show how this would execute"
```

Internal behavior:

- Read current repository context.
- Generate a minimal TaskPacket from the prompt.
- Pick default mode when not provided:
  - `writer-reviewer` for normal implementation.
  - `qa-swarm` for review/QA prompts.
  - `competitive-patch` when explicitly requested or when the task is high-risk.
- Create deterministic run directories under `tmp/symphony-work/<run-id>/`.
- Create Harness output under `tmp/symphony-work/<run-id>/harness/`.
- Use `tmp/real-cli-proofs/` for real CLI proof artifacts.
- Call the existing Harness Bridge instead of duplicating workflow logic.
- Print a concise result summary.

Default execution policy:

- `--dry-run` forces dry-run.
- `--real <adapter>` enables real execution for one adapter after the matching `MCAS_RUN_REAL_*` gate is present.
- Without `--real`, v5 may default to dry-run for safety. The default can later become configurable.

Suggested config file:

```json
{
  "defaultAdapter": "codex",
  "defaultMode": "writer-reviewer",
  "defaultExecution": "dry-run",
  "workDir": "tmp/symphony-work",
  "proofDir": "tmp/real-cli-proofs",
  "requireCleanWorktree": false
}
```

Result summary must include:

```text
status
runId
workflowMode
adapter
executionMode
verifierStatus
changedFiles
evidenceArtifactPath
harnessOutputPath
proofArtifactPath when real
nextAction
```

Acceptance:

```sh
symphony work --dry-run "inspect README"
MCAS_RUN_REAL_CODEX=1 symphony work --real codex "add a README smoke note"
```

Both commands should complete without the user writing a TaskPacket by hand.

Verification:

- Unit test prompt-to-TaskPacket generation.
- CLI test `symphony work --dry-run`.
- Real smoke test can be gated and optional.
- Existing Harness tests must remain unchanged.

## Stage 3: Native Agent Command Passthrough

Objective: allow direct use of native agent CLI commands while still capturing MCAS proof and artifacts.

Command shape:

```sh
symphony agent claude /review
symphony agent claude /team "implement this feature"
symphony agent codex exec "fix tests"
symphony agent kiro chat "inspect this module"
```

Execution levels:

```text
Level 1: passthrough
  Call native CLI, capture stdout, stderr, exitCode, duration, and proof path.

Level 2: passthrough + evidence
  Add evidence instructions, attempt EvidencePackage extraction, run verifier.

Level 3: workflow upgrade
  Route into `symphony work` when the user asks for MCAS workflow behavior.
```

Initial scope:

- Implement `symphony agent claude /review --dry-run`.
- Implement `symphony agent claude /review --real` behind `MCAS_RUN_REAL_CLAUDE=1`.
- Capture proof artifact with:
  - adapter id
  - native command
  - prompt
  - exit code
  - stdout/stderr artifact ids or paths
  - verifier status or `unverified`
  - resource profile when known

Non-goal for v5:

- Do not fully reimplement Claude `/team` semantics inside MCAS.
- Do not require every native command to emit a valid EvidencePackage in Level 1.
- Do not bypass native CLI permission models.

Acceptance:

```sh
symphony agent claude /review --dry-run
MCAS_RUN_REAL_CLAUDE=1 symphony agent claude /review --real
```

Both commands return structured MCAS summaries and proof artifact paths.

Verification:

- Fake process-runner tests for passthrough invocation.
- Proof artifact tests for native command metadata.
- Redaction tests for captured stdout/stderr.

## Stage 4: Release Polish

Objective: make v5 installable and explainable.

Scope:

- README quick start should start with `symphony`, not `pnpm mcas`.
- Add install/link instructions:

```sh
pnpm install
pnpm link --global
symphony doctor
```

- Document command hierarchy:

```text
symphony work     user workflow entry
symphony agent    native CLI passthrough
symphony review   shortcut for review workflow
symphony qa       shortcut for QA workflow
symphony replay   eval replay reports
symphony doctor   environment and gate checks
mcas              advanced kernel/debug commands
```

- Add troubleshooting for:
  - `symphony` not found.
  - missing real CLI gate.
  - native CLI unavailable.
  - proof artifact unverified.

Acceptance:

- A new user can run `symphony doctor` after link/install.
- A new user can run one dry-run work command without editing fixtures.
- Docs explain when to use `symphony work` versus `symphony agent`.

## v5 Release Criteria

Required local gates:

```sh
pnpm check
pnpm test
pnpm test:mutation:gate
git diff --check
pnpm mcas doctor
node scripts/symphony.js doctor
```

Required usability proofs:

```sh
symphony doctor
symphony work --dry-run "inspect README"
symphony agent claude /review --dry-run
```

Optional gated real proof:

```sh
MCAS_RUN_REAL_CODEX=1 symphony work --real codex "add a README smoke note"
MCAS_RUN_REAL_CLAUDE=1 symphony agent claude /review --real
```

CI proof:

- GitHub Actions `CI / verify` passes on the release commit.
- Optional real CLI CI lanes remain gated and may be skipped unless explicitly enabled.

## Risks

- UX scope creep: keep v5 focused on entrypoints, not new workflow modes.
- Native command variability: start with Claude `/review` before broader `/team` support.
- Real execution safety: retain existing gates and policy boundaries.
- Duplicate logic: `symphony` should call existing MCAS modules rather than fork Harness behavior.
- Test runtime: mutation gate remains expensive; keep targeted tests fast for iteration.

## Handoff

Start implementation with Stage 1. Do not implement Stage 2 until `symphony doctor` is tested and documented.

Recommended first files:

- `package.json`
- `scripts/symphony.js`
- `tests/symphony-cli.test.js`
- `README.md`
- `docs/troubleshooting.md`
