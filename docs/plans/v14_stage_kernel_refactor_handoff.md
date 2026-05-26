# v14 Stage Kernel Refactor Handoff

Date: 2026-05-26
Baseline: v12 verified adoption kernel + v13/v13.1 Workbench information architecture / Chinese presentation layer
Primary CLI: `symphony`
Execution owner: Codex writer in one context
Validation owner: independent Codex reviewer in a separate context

## 0. One-line objective

v14 upgrades Symphony from prompt/workflow/run-driven orchestration into a Stage-driven project progression kernel, while preserving the v12 verified-adoption safety model and the v13/v13.1 read-only Workbench principles.

## 1. Product constitution for this release

Symphony is a personal coding-agent operating system. It is not just a CLI and not just a multi-agent dispatcher. It helps a non-expert or semi-expert project owner continuously progress complex projects without losing direction by combining project understanding, Stage planning, real agent execution, independent review, evidence, controlled adoption, and a low-density Workbench state surface.

For v14, `Stage` becomes the highest-level control object:

```text
Stage -> Task -> CommandSpec -> Run -> Evidence -> Adoption summary
```

v14 is a wrapper-first release. It must make existing product flows Stage-aware, but it must not rewrite the adoption apply kernel.

## 2. Current baseline assumptions

The existing repository already contains:

- `symphony` as the product CLI.
- `mcas` as the kernel/debug CLI.
- v12 verified adoption behavior: frozen execution plans, isolated workspace execution, adoption plan, frozen patch, `git apply --check`, dirty worktree and fingerprint gates.
- v13/v13.1 Workbench information architecture and Chinese presentation layer.
- `.symphony` local state pointers and ArtifactStore evidence/artifact directories.

The original v8 direction introduced the idea that `.symphony/context/latest.json` and `.symphony/runs/latest.json` are user-facing pointers and summaries, not replacements for ArtifactStore. v14 must preserve that boundary.

## 3. v14 goals

1. Add Stage Charter as a committed project-level definition.
2. Add local Stage runtime state under `.symphony/stages/`.
3. Add Stage CLI commands:
   - `symphony stage`
   - `symphony stage --json`
   - `symphony stage create`
   - `symphony stage activate <stage-id>`
   - `symphony stage render <stage-id>`
   - `symphony stage render <stage-id> --write`
   - `symphony stage summary`
   - `symphony next`
4. Make product flows Stage-aware:
   - `do`
   - `review`
   - `verify`
   - `adopt` summary only
   - `diagnose`
   - `console`
5. Add Stage-aware run binding:
   - default bind to active Stage;
   - allow explicit `--stage <stage-id>`;
   - allow explicit `--no-stage`;
   - record `stageBinding` / `bindingSource` / boundary-check summary.
6. Add Stage Charter HTML/JSON consistency gate before new writes, execution, adoption confirm, auto-adopt, or autopilot-like continuation.
7. Add blocker / gate event / frozen blocked snapshot behavior when a pre-execution gate fails.
8. Add Workbench v14 Stage overview while preserving read-only / copy-only behavior.
9. Add v14 Stage-specific smoke tests and release evidence.

## 4. Non-goals

Do not implement these in v14:

- Do not rewrite v12 adoption apply logic.
- Do not rewrite verifier / policy / workspace safety internals except for additive Stage summaries if unavoidable.
- Do not implement full Autopilot Task Loop.
- Do not implement full Agent Capability Registry.
- Do not migrate Workbench to React/Vite in v14.
- Do not add browser write buttons, retry buttons, adopt-confirm buttons, rollback buttons, or arbitrary file reads.
- Do not turn Stage into an enterprise project-management system.
- Do not make `mcas` the daily user entrypoint again.
- Do not store full risk/adoption evidence only in `.symphony`.

React/Vite Workbench migration should be recorded as a future Stage Candidate, likely v15, not implemented in v14.

## 5. Stage Charter model

### 5.1 Committed Stage Charter files

Use two committed files per Stage:

```text
docs/stages/<stage-id>.stage.json
docs/stages/<stage-id>.html
```

JSON is the machine source of truth. HTML is the human display file.

### 5.2 Local Stage runtime files

Use local, non-committed state:

```text
.symphony/stages/latest.json
.symphony/stages/<stage-id>.json
```

These files store active Stage pointer, run refs, evidence refs, adoption summaries, blocker summaries, risk summaries, and next action. They are local runtime state, not canonical evidence.

### 5.3 Stage Charter JSON minimum fields

```json
{
  "contractName": "symphony.stage-charter",
  "contractVersion": "1.0",
  "stageId": "v14-stage-kernel-refactor",
  "title": "v14 Stage Kernel Refactor",
  "status": "draft",
  "goals": [],
  "nonGoals": [],
  "boundaries": [],
  "verificationProfile": {
    "developmentGate": [],
    "releaseGate": [],
    "stageSmoke": []
  },
  "riskPolicy": {
    "stageRequiredAreas": [],
    "autoAdoptAllowedAreas": [],
    "autoAdoptForbiddenAreas": []
  },
  "createdAt": "",
  "updatedAt": "",
  "charterHash": "sha256:..."
}
```

### 5.4 v14 Stage Charter content

Stage ID:

```text
v14-stage-kernel-refactor
```

Goal:

```text
把 Symphony 从 prompt / workflow / run 驱动，升级成 Stage 驱动的项目推进内核。
```

Non-goals:

- 不重写 v12 adoption 安全模型。
- 不重写 v13/v13.1 Workbench 前端。
- 不迁移 React/Vite。
- 不实现完整 Autopilot Task Loop。
- 不实现完整 Agent Capability Registry。
- 不把 `mcas` 重新变成日常主入口。

Boundaries:

- 保留 v12 safety invariants: isolated workspace, frozen execution plan, verifier, adoption plan, frozen patch, fingerprint, dirty worktree check, `git apply --check`.
- Stage is a wrapper/control object in v14, not a replacement for ArtifactStore or the adoption kernel.
- Workbench remains read-only / copy-only / Chinese-first / low-density.
- Stage Charter JSON is machine truth; HTML is display only.
- Full Risk-aware and Adoption-aware evidence must live in ArtifactStore; `.symphony` may store summaries and refs.

## 6. CLI requirements

### 6.1 `symphony stage`

Default: read-only compact display.

Must show:

- active Stage id/title;
- state;
- goal;
- blocker if present;
- next action.

`--json` must return stable machine-readable output with at least:

```json
{
  "contractName": "symphony.stage-status",
  "contractVersion": "1.0",
  "activeStage": {},
  "blocker": null,
  "nextAction": ""
}
```

### 6.2 `symphony stage create`

Creates Stage Charter draft files.

Acceptable v14 behavior:

- allow arguments or safe defaults;
- generate `.stage.json` and `.html` for a draft;
- do not activate automatically unless explicitly requested;
- do not require the user to fill a long contract manually.

### 6.3 `symphony stage activate <stage-id>`

Must:

- read `docs/stages/<stage-id>.stage.json`;
- verify the matching HTML exists or is renderable;
- verify JSON/HTML metadata consistency if HTML exists;
- write active local state under `.symphony/stages/latest.json` and `.symphony/stages/<stage-id>.json`;
- not invoke models;
- not execute writes beyond Stage local state.

### 6.4 `symphony stage render <stage-id>`

Rules:

- JSON -> HTML only.
- Never HTML -> JSON.
- If HTML does not exist, generate it directly.
- If HTML exists, default to preview/diff only.
- `--write` is required to overwrite existing HTML.

### 6.5 `symphony stage summary`

Read-only summary of current Stage:

- goal;
- non-goals;
- boundaries;
- state;
- run refs summary;
- evidence refs summary;
- adoption wrapper summary;
- blocker;
- top risks;
- next action.

### 6.6 `symphony next`

Read-only advisory command.

It must not call agents or execute tasks in v14.

It should recommend one next action based on:

- active Stage exists or not;
- charter consistency;
- blocker state;
- latest run status;
- adoption summary;
- risk summary.

## 7. Stage-aware execution binding

### 7.1 Default binding

If an active Stage exists, these commands default to binding their run/state to active Stage:

```text
do
review
verify
```

Add or support:

```text
--stage <stage-id>
--no-stage
```

### 7.2 Stage binding shape

Each bound run should include:

```json
{
  "stageBinding": {
    "stageId": "v14-stage-kernel-refactor",
    "bindingSource": "active-stage | explicit-stage | no-stage | no-active-stage",
    "taskId": null,
    "boundaryCheck": {
      "status": "passed | warning | failed | not-run",
      "riskLevel": "low | medium | high",
      "goalRelation": "serves-current-stage | unrelated | unknown",
      "nonGoalViolations": [],
      "boundaryViolations": []
    }
  }
}
```

### 7.3 No active Stage behavior

Without an active Stage:

- read-only commands are allowed;
- low-risk maintenance writes may be allowed under existing write safety rules;
- production code / core module / Stage kernel / adoption / verifier / policy / workspace / adapter / dependency / deletion / rename / main-worktree-write changes should require Stage or manual confirmation.

For v14, implement conservative classification. Do not build an over-complex risk engine.

## 8. Adoption wrapper summary

v14 must not modify adoption apply logic.

Stage-aware adoption may read and summarize:

- adoption plan refs;
- patch refs;
- confirmation state;
- journal refs;
- source run refs;
- blocker/risk summary.

It must not alter:

- adoption plan generation semantics;
- patch freezing semantics;
- fingerprint checks;
- dirty worktree checks;
- `git apply --check`;
- confirmation journal behavior;
- main worktree patch application semantics.

## 9. Stage Charter consistency gate

### 9.1 Trigger

Before any new write/execution/adoption/auto-continue action, check active Stage Charter consistency:

- `do --write`;
- `do --confirm-plan`;
- real agent run;
- `adopt --confirm`;
- auto-adopt;
- future autopilot continue.

Read-only commands do not need to clear blockers.

### 9.2 Failure behavior

If gate fails:

- block the action;
- do not create a run;
- create gate event;
- update Stage blocker;
- create `charter-repair-plan` artifact;
- create or update `blockedSnapshot` according to risk level;
- Workbench may show this as a timeline event, but it must not appear as an execution run.

### 9.3 Repair direction

Only JSON -> HTML repair is allowed.

Do not infer JSON from HTML.

### 9.4 Blocked snapshot

When blocked, freeze a snapshot. Ordinary snapshots may be stored in `.symphony`; high-risk snapshots must be stored in ArtifactStore. All frozen refs to plans, patches, risk overrides, workspace refs, repair plans, and fingerprint evidence must point to ArtifactStore.

Minimum frozen snapshot fields:

```json
{
  "gateId": "",
  "stageId": "",
  "stageCharterJsonHash": "sha256:...",
  "stageCharterHtmlHashAtBlock": "sha256:...",
  "blockedAction": {
    "type": "confirm-plan | adopt-confirm | do-write | real-run",
    "targetId": "",
    "commandDigest": "sha256:..."
  },
  "projectState": {
    "gitHead": "",
    "projectFingerprint": "sha256:...",
    "dirtyWorktreeHash": "sha256:..."
  },
  "frozenRefs": {
    "executionPlanHash": null,
    "adoptionPatchHash": null,
    "riskOverrideId": null,
    "repairPlanRef": "artifact://..."
  },
  "blockedReason": "stage-charter-consistency-mismatch",
  "createdAt": ""
}
```

### 9.5 Recovery

On the next write/execution/adoption action:

- rerun the consistency gate;
- verify JSON hash did not silently change;
- verify HTML is now consistent with JSON;
- verify the current action matches frozen blocked action identity;
- verify project fingerprint and relevant frozen refs still match;
- clear blocker only if all relevant checks pass;
- record resolved gate event;
- continue only the current user-triggered command;
- never perform background retry.

High-risk actions must require renewed confirmation and must not reuse stale confirmation.

## 10. Evidence storage

Stage-aware evidence may live in `.symphony` when it is only a light relationship summary.

Risk-aware / Adoption-aware evidence must live in ArtifactStore, with `.symphony` storing only summary + refs.

A `charter-repair-plan` created because an execution gate blocked an action must be stored fully in ArtifactStore; `.symphony` stores summary, artifact ref, blocked action, gate id, and next action.

## 11. Workbench v14 requirements

Workbench remains read-only and copy-only.

Homepage default should show only:

- current Stage;
- Stage goal;
- Stage status;
- top 1-3 risks;
- blocker;
- next action.

Folded detail may show:

- run refs;
- evidence refs;
- adoption summary;
- gate events;
- blockedSnapshot summary;
- charter-repair-plan ref;
- raw JSON.

No browser write buttons, retry buttons, adopt buttons, rollback buttons, model invocation, package installation, arbitrary path reads, or delete controls.

## 12. Future Stage Candidate

Record, but do not implement in v14:

```text
v15 Workbench React/Vite Migration
```

Goal:

```text
Migrate Workbench display to React/Vite for maintainable Stage / Task / Evidence / Blocker / Adoption UI.
```

Non-goals:

- no browser write controls;
- no v12 adoption kernel changes;
- no Stage kernel rewrite during migration.

## 13. Implementation sequence

### Task 1: Stage Charter contracts and fixture

Behavior:

- Add Stage Charter JSON schema/validation helpers.
- Add v14 Stage Charter JSON fixture.
- Add HTML render helper.
- Add consistency metadata extraction/check.

Acceptance:

- JSON can be parsed and validated.
- HTML can be generated from JSON.
- HTML/JSON mismatch is detectable.

### Task 2: Stage local state

Behavior:

- Add `.symphony/stages/latest.json` and `.symphony/stages/<stage-id>.json` writer/reader.
- Preserve `.symphony` as pointer/summary state.

Acceptance:

- Stage can be activated.
- `symphony stage --json` can read active Stage.

### Task 3: Stage CLI commands

Behavior:

- Implement `stage`, `stage --json`, `stage create`, `stage activate`, `stage render`, `stage render --write`, `stage summary`, `next`.

Acceptance:

- Commands work read-only unless explicitly rendering/writing allowed files.
- `next` does not invoke models or execute tasks.

### Task 4: Stage-aware run binding

Behavior:

- Add default active Stage binding to `do/review/verify` product paths.
- Add `--stage` and `--no-stage` where practical.
- Record `stageBinding` in run state and JSON output.

Acceptance:

- Active Stage run includes `stageBinding.stageId`.
- `--no-stage` records `bindingSource: no-stage`.
- No active Stage low-risk run records `bindingSource: no-active-stage`.

### Task 5: Stage-aware adoption summary wrapper

Behavior:

- Add Stage summary links to adoption refs and confirmation state.
- Do not change v12 adoption apply logic.

Acceptance:

- Stage summary can show adoption plan/patch/confirmation refs.
- Existing adoption tests still pass.

### Task 6: Charter consistency gate and blocker

Behavior:

- Before new write/execution/adoption confirm, run active Stage consistency gate.
- On failure, block action without creating run.
- Write gate event, Stage blocker, charter-repair-plan artifact, blockedSnapshot according to risk.
- On subsequent matching action and successful gate, clear blocker and write resolved gate event.

Acceptance:

- Charter mismatch blocks write/confirm/adopt actions.
- It does not block `status/diagnose/console/stage` reads.
- It creates repair artifact and Stage blocker.
- It does not appear as normal run.

### Task 7: Workbench Stage overview

Behavior:

- Add current Stage summary to Workbench overview.
- Default homepage shows Stage/goal/status/top risks/blocker/next action.
- Run/evidence/adoption/gate details are folded.

Acceptance:

- Workbench remains read-only/copy-only.
- Existing non-GET rejection behavior remains unchanged.

### Task 8: Docs and release evidence

Behavior:

- Add v14 plan/release evidence docs.
- Add future Stage Candidate for React/Vite Workbench migration.
- Update README minimally to mention Stage if appropriate.

Acceptance:

- Docs distinguish v14 Stage kernel from v15 React/Vite candidate.

## 14. Testing and verification

### 14.1 Development gate

Writer should run during implementation:

```sh
node --test tests/symphony-cli.test.js
pnpm check
pnpm test
git diff --check
```

Writer may use these to catch errors, but writer must not claim final acceptance.

### 14.2 Release gate

Independent reviewer must run before acceptance:

```sh
node --test tests/symphony-cli.test.js
pnpm check
pnpm test
git diff --check
pnpm audit --audit-level high
pnpm test:mutation:gate
```

### 14.3 v14 Stage-specific smoke

Independent reviewer must also run or simulate with deterministic fixtures:

```sh
pnpm symphony stage
pnpm symphony stage --json
pnpm symphony stage create --help
pnpm symphony stage activate v14-stage-kernel-refactor
pnpm symphony stage render v14-stage-kernel-refactor
pnpm symphony stage render v14-stage-kernel-refactor --write
pnpm symphony stage summary
pnpm symphony next
```

Also verify:

1. Stage Charter JSON/HTML can be created, rendered, activated.
2. Active Stage writes `.symphony/stages/latest.json`.
3. `do/review/verify` bind active Stage and record `stageBinding`.
4. `--no-stage` bypasses binding with explicit record.
5. `adopt` summary is Stage-aware but v12 adoption apply code remains semantically unchanged.
6. `diagnose` and `console` read Stage state.
7. Workbench homepage shows Stage, goal, status, top risks, blocker, next action.
8. Details are folded; no browser write controls are added.
9. Charter mismatch blocks new write/execution/adoption confirm/auto-adopt.
10. Charter mismatch creates gate event, Stage blocker, repair artifact, and blockedSnapshot.
11. Gate failure is not counted as a normal run.
12. After repair, matching user-triggered action can clear blocker and continue; no background retry happens.
13. High-risk blocked action requires renewed confirmation.

## 15. Independent reviewer rule

Writer may implement and run development checks, but acceptance must come from a separate Codex context using the reviewer prompt.

Reviewer must:

- read this plan;
- inspect the diff;
- inspect generated Stage Charter files;
- check that v12 adoption apply logic is not rewritten;
- run release gate and Stage-specific smoke;
- verify evidence and Workbench behavior;
- report findings as `approve`, `revise`, or `reject`.

Writer must not approve its own work.
