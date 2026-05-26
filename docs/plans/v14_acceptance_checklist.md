# v14 Acceptance Checklist

## Scope

v14 Stage Kernel Refactor is accepted only if it implements Stage wrapper-first behavior without weakening v12 adoption safety or v13/v13.1 Workbench read-only principles.

## Required artifacts

- `docs/stages/v14-stage-kernel-refactor.stage.json`
- `docs/stages/v14-stage-kernel-refactor.html`
- v14 plan / release evidence doc
- Codex writer report
- independent reviewer report

## Functional checks

- [ ] `symphony stage` displays active Stage compactly.
- [ ] `symphony stage --json` emits stable JSON.
- [ ] `symphony stage create` can create Stage Charter draft.
- [ ] `symphony stage activate <stage-id>` activates Stage and writes local state.
- [ ] `symphony stage render <stage-id>` generates HTML when missing.
- [ ] `symphony stage render <stage-id>` previews when HTML exists.
- [ ] `symphony stage render <stage-id> --write` overwrites existing HTML.
- [ ] `symphony stage summary` is read-only and summarizes Stage.
- [ ] `symphony next` is read-only/advisory and does not call agents.
- [ ] `do/review/verify` bind active Stage by default.
- [ ] `--stage <stage-id>` explicit binding works where implemented.
- [ ] `--no-stage` explicit no-stage record works where implemented.
- [ ] Adoption is Stage-aware only as wrapper summary.
- [ ] v12 adoption apply / fingerprint / dirty worktree / git apply check logic is not weakened.
- [ ] Diagnose/console read Stage status.
- [ ] Workbench homepage shows Stage, goal, status, top risks, blocker, next action.
- [ ] Workbench details are folded.
- [ ] Workbench remains read-only/copy-only.

## Gate / blocker checks

- [ ] Stage Charter HTML/JSON mismatch is detected.
- [ ] Mismatch blocks new writes/executions/adoption confirm.
- [ ] Mismatch does not block read-only status/diagnose/console/stage.
- [ ] Mismatch creates gate event.
- [ ] Mismatch creates Stage blocker.
- [ ] Mismatch creates `charter-repair-plan` artifact.
- [ ] Mismatch creates `blockedSnapshot`.
- [ ] Gate failure is not counted as normal run.
- [ ] Repair uses JSON -> HTML only.
- [ ] HTML -> JSON reverse update is not implemented.
- [ ] Blocker clears only after later write/execution/adoption gate passes.
- [ ] Resolved gate event is recorded.
- [ ] No background retry occurs after blocker clears.
- [ ] High-risk actions require renewed confirmation.

## Evidence/storage checks

- [ ] `.symphony` stores local pointers/summaries, not full high-risk evidence.
- [ ] Risk-aware/adoption-aware evidence goes to ArtifactStore.
- [ ] Full `charter-repair-plan` goes to ArtifactStore.
- [ ] `.symphony` stores repair artifact ref and gate summary only.
- [ ] High-risk `blockedSnapshot` goes to ArtifactStore.
- [ ] Frozen refs point to ArtifactStore.

## Development gate

Writer must run:

```sh
node --test tests/symphony-cli.test.js
pnpm check
pnpm test
git diff --check
```

## Release gate

Independent reviewer must run:

```sh
node --test tests/symphony-cli.test.js
pnpm check
pnpm test
git diff --check
pnpm audit --audit-level high
pnpm test:mutation:gate
```

## Reviewer-only acceptance

The writer cannot approve the release. Final acceptance requires an independent reviewer report in a separate context.
