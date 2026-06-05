# v41 Controlled CLI Provider Runner + Backend Completion Plan

Date: 2026-06-06

Goal id: `v41-controlled-cli-provider-runner-backend-completion`

Release name: `v41 Controlled CLI Provider Runner + Backend Completion`

Baseline: `v40 Personal Workflow Router + App Core Release Closeout`

Baseline evidence:

- v40 release evidence: `docs/plans/v40-release-evidence-2026-06-02.md`
- v40 runbook: `docs/plans/app-core-v34-v40-goal-runbooks/v40_personal-workflow-router-app-core-release_goal_runbook_latest.md`
- v40 fixture: `fixtures/contracts/goal-runbook.v40-personal-workflow-router-app-core-release.v1.json`
- v40 peeled tag commit: `5ab2d72dd89c2db191d8aee769ef5ccb73ef6d8e`
- v40 GitHub Release: `https://github.com/Andy20010101/multi-coding-agent-symphony/releases/tag/v40`

## Reconciliation

The v41 bootstrap started from a clean `main` checkout after `git fetch origin --prune`.

- `HEAD`, `main`, and `origin/main` resolved to `5ab2d72dd89c2db191d8aee769ef5ccb73ef6d8e`.
- Local tag `v40` exists.
- Remote annotated tag `refs/tags/v40` peels to `5ab2d72dd89c2db191d8aee769ef5ccb73ef6d8e`.
- GitHub Release `v40` is published and not a draft or prerelease.
- `pnpm --silent symphony goal-status --goal v41-controlled-cli-provider-runner-backend-completion --json` returned `goal not found` before bootstrap.

## Product Purpose

v41 finishes the backend path that lets the App run real provider CLIs only through a controlled provider runner. The runner is provider-specific, backend-owned, task-scoped, and evidence-producing. It is not a shell surface.

## Product Spine

```text
provider allowlist -> runner contract -> backend execution adapter -> operation/evidence capture -> Workbench controlled preview and confirm
```

## Active Provider Boundary

v41 active providers are exactly:

- `claude-code-cli`
- `codex-cli`

The runner may map only these provider ids to backend-owned command templates. Workbench, Desktop Shell, renderer code, and browser routes must not execute `claude`, `codex`, or any provider CLI directly.

Gemini CLI, Kiro CLI, and DeepSeek are not v41 active providers. DeepSeek can appear only as a later sanitized backend profile reference; it is not a runnable v41 provider and not a v41 release gate.

## Scope

- Define a controlled provider runner contract for `claude-code-cli` and `codex-cli`.
- Add backend runner code that accepts only provider id, active goal id, task id, role, reviewed prompt refs, and controlled execution mode.
- Keep command construction inside backend code. No API, UI component, fixture, or task prompt can pass arbitrary shell text.
- Capture sanitized runner operation results with exit code, timing, provider id, task context, transcript/artifact refs, redaction status, and failure layer.
- Bind Workbench to preview/confirm runner operations through the existing plan-hash pattern.
- Keep reviewer, main-verifier, release gate, and release-ready semantics event-backed.

## Non-goals

- No generic shell runner, browser terminal, arbitrary command palette, or renderer-side provider invocation.
- No active Gemini, Kiro, or DeepSeek provider.
- No automatic provider install, OAuth login, credential file read, or secret value exposure.
- No frontend-built provider command, prompt dispatch, model invocation, merge, push, tag, release publication, or self-approval.
- No status inference from branch names, filenames, task titles, prompt text, command text, or frontend state.
- No v42 implementation inside v41.

## Tasks

1. `task-1`: Controlled runner contract and provider allowlist
   - Define the v41 runner contract and fixtures.
   - Active provider ids must be exactly `claude-code-cli` and `codex-cli`.
   - Reuse v38 provider hub contracts as read-only source context.

2. `task-2`: Backend runner execution adapter
   - Implement provider-specific backend runner paths.
   - Command templates live in backend code and reject arbitrary shell input.
   - Direct UI/renderer provider execution remains unavailable.

3. `task-3`: Runner operation registry and sanitized evidence
   - Store runner operation status, provider id, task context, exit code, timing, artifact refs, redaction status, and failure layer.
   - Evidence can point to sanitized transcript summaries or artifacts, not raw secrets or credential material.

4. `task-4`: Workbench preview and confirm binding
   - Add controlled Workbench/App projection for runner preview and confirm.
   - Confirm accepts only the reviewed plan context and plan hash.
   - The UI displays status and copyable context, not raw provider command controls.

5. `task-5`: Backend completion closeout and controlled real CLI evidence
   - Verify the backend runner path end to end for `claude-code-cli` and `codex-cli`.
   - If real provider CLI execution is required, run it only through the controlled backend runner implemented in v41.
   - Record unavailable CLI, missing env, failed preflight, or failed provider execution as explicit evidence instead of falling back to raw shell.

## Release Gates

The v41 fixture uses the scoped v37-v41 closeout gates:

- `release.pnpm-check`
- `release.pnpm-test`
- `release.workbench-build`
- `release.diff-check`
- `release.docs-updated`

Default local evidence commands:

```sh
pnpm check
pnpm test
pnpm workbench:build
git diff --check
```

Docs-updated evidence must cite the v41 plan, runbook, fixture, task evidence, and any provider-boundary documentation changes. Mutation, audit, doctor, tag, publish, and raw provider CLI smokes are not default v41 scoped closeout gates.

## v42 Boundary

v42 is `Goal Supervisor Runtime Context Loop`.

The v42 target is to productize the current temporary coding system around supervisor runtime context, leases, handoff, dispatch, compact durable state, and fresh-controller loop control. v41 may reference v42 as the next module and may preserve data needed by v42. v41 must not implement the v42 supervisor runtime loop, daemon write semantics, thread creation adapter, or controller lifecycle product UI.

## Managed Goal Registration

Register the v41 goal from the fixture:

```sh
pnpm --silent symphony goal init \
  --from-json fixtures/contracts/goal-runbook.v41-controlled-cli-provider-runner-backend-completion.v1.json \
  --goal v41-controlled-cli-provider-runner-backend-completion \
  --dry-run --json

pnpm --silent symphony goal init \
  --from-json fixtures/contracts/goal-runbook.v41-controlled-cli-provider-runner-backend-completion.v1.json \
  --goal v41-controlled-cli-provider-runner-backend-completion \
  --confirm \
  --plan-hash sha256:<PLAN_HASH> \
  --json

pnpm --silent symphony goal-status --goal v41-controlled-cli-provider-runner-backend-completion --json
pnpm --silent symphony goal next --goal v41-controlled-cli-provider-runner-backend-completion --json
```

## Supervisor Handoff

After bootstrap registration, hand control to the external local goal supervisor with:

```sh
pnpm symphony supervisor run --goal v41-controlled-cli-provider-runner-backend-completion --max-cycles 20 --json
```

The current supervisor runner is dry-run planning only. A fresh controller or external daemon must own worker dispatch, review, verification, event registration, and any controlled real CLI execution required by the v41 task runbook.
