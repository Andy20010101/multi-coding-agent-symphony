# Codex Writer Prompt: v14 Stage Kernel Refactor

You are the writer agent for `Andy20010101/multi-coding-agent-symphony`.

Your task is to implement v14 Stage Kernel Refactor according to `v14_stage_kernel_refactor_handoff.md`.

Important: you are the writer, not the final reviewer. You may run development checks to catch mistakes, but you must not claim final acceptance. Final acceptance must be performed by an independent reviewer in a separate context.

## Mission

Upgrade Symphony from prompt/workflow/run-driven orchestration into a Stage-aware wrapper kernel.

Implement v14 as wrapper-first:

- Add Stage Charter JSON + HTML support.
- Add local `.symphony/stages/*` runtime state.
- Add Stage CLI commands.
- Bind `do/review/verify` runs to active Stage.
- Add Stage-aware adoption summary only, without changing v12 adoption apply logic.
- Add Stage Charter consistency gate before new writes/executions/adoption confirm.
- Add Stage blocker + frozen blockedSnapshot behavior.
- Add Workbench Stage overview.
- Add tests and v14 release evidence.

## Must preserve

Do not break v12 verified adoption safety:

- isolated workspace;
- frozen execution plan;
- verifier gate;
- adoption plan;
- frozen patch;
- fingerprint checks;
- dirty worktree checks;
- `git apply --check`;
- confirmation journal behavior.

Do not add browser write controls.
Do not migrate Workbench to React/Vite in v14.
Do not implement full Autopilot or Agent Capability Registry.
Do not make `.symphony` replace ArtifactStore.

## Required implementation order

1. Read the repository current state and identify relevant modules.
2. Produce a short implementation plan before coding:
   - files likely to change;
   - behavior-level tasks;
   - risks;
   - tests to add.
3. Implement in small behavior-level tasks:
   - Stage Charter contract/render/check;
   - Stage local state;
   - Stage CLI commands;
   - Stage-aware run binding;
   - adoption wrapper summary;
   - consistency gate/blocker/blockedSnapshot;
   - Workbench Stage overview;
   - docs/evidence.
4. Run development checks.
5. Produce a writer report, not an approval.

## Required CLI commands

Implement at minimum:

```sh
symphony stage
symphony stage --json
symphony stage create
symphony stage activate <stage-id>
symphony stage render <stage-id>
symphony stage render <stage-id> --write
symphony stage summary
symphony next
```

`stage summary` and `next` are read-only/advisory in v14.

## Required Stage files

Add or generate:

```text
docs/stages/v14-stage-kernel-refactor.stage.json
docs/stages/v14-stage-kernel-refactor.html
```

JSON is machine source of truth. HTML is display only. HTML must be generated from JSON. Do not implement HTML -> JSON.

Local runtime state should be under:

```text
.symphony/stages/latest.json
.symphony/stages/<stage-id>.json
```

Do not commit local runtime state unless the repository convention already commits similar fixtures. Prefer fixtures under test directories for tests.

## Required Stage binding

When active Stage exists, `do/review/verify` should record `stageBinding` in run state / JSON output:

```json
{
  "stageBinding": {
    "stageId": "v14-stage-kernel-refactor",
    "bindingSource": "active-stage",
    "taskId": null,
    "boundaryCheck": {
      "status": "passed",
      "riskLevel": "low",
      "goalRelation": "serves-current-stage",
      "nonGoalViolations": [],
      "boundaryViolations": []
    }
  }
}
```

Support explicit `--stage <stage-id>` and `--no-stage` where practical.

## Required blocker behavior

Before new writes/executions/adoption confirm, run active Stage Charter consistency gate.

If gate fails:

- block the action;
- do not create a normal run;
- create gate event;
- update Stage blocker;
- create `charter-repair-plan` artifact;
- create `blockedSnapshot`;
- preserve read-only commands.

Recovery:

- no background retry;
- user must rerun the blocked action;
- gate must pass;
- frozen snapshot identity must match;
- high-risk actions require renewed confirmation.

## Required Workbench behavior

Workbench homepage default shows only:

- current Stage;
- Stage goal;
- Stage status;
- top 1-3 risks;
- blocker;
- next action.

Folded details may show run refs, evidence refs, adoption summary, gate events, blockedSnapshot, repair artifact ref, raw JSON.

Workbench must remain read-only/copy-only. No new POST/write/retry/adopt/delete/rollback/browser-execute controls.

## Required tests

Add tests for:

- Stage Charter JSON parsing/validation.
- JSON -> HTML render.
- HTML/JSON consistency mismatch detection.
- Stage activation writes local state.
- `symphony stage` and `symphony stage --json`.
- `stage render` behavior:
  - generate when HTML missing;
  - preview when HTML exists;
  - overwrite only with `--write`.
- `stage summary` and `next` are read-only.
- active Stage binding for `do/review/verify`.
- `--no-stage` behavior.
- adoption wrapper summary does not alter v12 adoption apply behavior.
- Charter mismatch blocks write/confirm/adopt but not read-only status/diagnose/console/stage.
- Gate failure creates blocker + repair artifact + blockedSnapshot and is not a normal run.
- Workbench overview includes Stage summary and remains read-only.

## Development checks to run

Run at least:

```sh
node --test tests/symphony-cli.test.js
pnpm check
pnpm test
git diff --check
```

If these fail, fix before handing off.

## Writer final report format

Return:

```text
Writer Report

Implemented:
- ...

Changed files:
- ...

Development checks run:
- command: result

Known risks / not implemented:
- ...

Reviewer must verify:
- v12 adoption apply logic unchanged
- release gate
- Stage-specific smoke
- Workbench read-only behavior
- blocker/frozen snapshot recovery
```

Do not say the release is accepted. The independent reviewer decides that.
