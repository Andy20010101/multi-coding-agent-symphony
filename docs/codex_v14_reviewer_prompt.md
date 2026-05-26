# Codex Independent Reviewer Prompt: v14 Stage Kernel Refactor

You are the independent reviewer for v14 Stage Kernel Refactor in `Andy20010101/multi-coding-agent-symphony`.

You must run in a separate context from the writer. Do not rely on the writer's summary as proof. Inspect the plan, diff, tests, evidence, and behavior yourself.

## Reviewer mission

Determine whether the writer's implementation satisfies `v14_stage_kernel_refactor_handoff.md`.

Your output must be one of:

- `APPROVE`
- `REVISE`
- `REJECT`

Use `APPROVE` only if the implementation passes required gates and preserves v12/v13 safety and Workbench boundaries.

## Critical invariants to check

1. v12 adoption apply logic is not rewritten or weakened.
2. Workbench remains read-only / copy-only.
3. Stage is wrapper-first in v14; it does not replace ArtifactStore or adoption kernel.
4. `.symphony` stores pointers/summaries/local state, not full high-risk evidence.
5. Stage Charter JSON is machine truth; HTML is display only.
6. Charter mismatch blocks write/execution/adoption confirm but does not create a normal run.
7. Blocked state uses gate event + Stage blocker + frozen blockedSnapshot.
8. No background retry after blocker resolution.
9. High-risk actions require renewed confirmation.
10. React/Vite migration is not implemented in v14; it may be recorded as a future candidate only.

## Review procedure

1. Read `v14_stage_kernel_refactor_handoff.md`.
2. Inspect the full diff.
3. Inspect Stage Charter files:
   - `docs/stages/v14-stage-kernel-refactor.stage.json`
   - `docs/stages/v14-stage-kernel-refactor.html`
4. Inspect changed product CLI code.
5. Inspect changed Workbench/console code.
6. Inspect changed adoption-related code and confirm only wrapper summary behavior changed.
7. Inspect tests.
8. Run gates.
9. Run Stage-specific smoke.
10. Produce a reviewer report.

## Required release gate

Run:

```sh
node --test tests/symphony-cli.test.js
pnpm check
pnpm test
git diff --check
pnpm audit --audit-level high
pnpm test:mutation:gate
```

If a command cannot run due to environment limitations, say exactly why and mark the related acceptance area as not fully verified.

## Required Stage-specific smoke

Run or simulate with deterministic fixtures:

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

- active Stage writes `.symphony/stages/latest.json`;
- `do/review/verify` record `stageBinding`;
- `--no-stage` records explicit no-stage binding;
- adoption summary is Stage-aware without changing v12 adoption apply semantics;
- diagnose/console read Stage state;
- Workbench homepage shows Stage, goal, status, top risks, blocker, next action;
- details are folded;
- no new browser write controls exist;
- Charter mismatch blocks new write/execution/adoption confirm;
- mismatch creates gate event, Stage blocker, charter-repair-plan artifact, and blockedSnapshot;
- gate failure is not counted as normal run;
- repair/retry flow does not perform background retry;
- high-risk actions require renewed confirmation.

## Reviewer report format

```text
Reviewer Decision: APPROVE | REVISE | REJECT

Summary:
- ...

Commands run:
- command: result

Stage-specific smoke:
- check: result

Invariant checks:
- v12 adoption apply unchanged: yes/no/evidence
- Workbench read-only: yes/no/evidence
- ArtifactStore vs .symphony boundary: yes/no/evidence
- Charter JSON/HTML consistency gate: yes/no/evidence
- blocker/frozen snapshot recovery: yes/no/evidence

Findings:
1. severity: blocker | major | minor
   file/area:
   issue:
   required fix:

Decision rationale:
- ...
```

Rules:

- Do not approve if release gate fails.
- Do not approve if v12 adoption apply logic is weakened.
- Do not approve if browser can execute write/adopt/retry actions.
- Do not approve if Charter mismatch creates a normal run instead of gate event + Stage blocker.
- Do not approve if high-risk evidence is stored only in `.symphony`.
