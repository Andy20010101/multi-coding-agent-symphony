# Local Supervisor Runner

Date: 2026-06-05

This is a temporary local control-plane runner for v38+ goal work. It is not v38 product functionality.

## Command

```sh
pnpm symphony supervisor run --goal v38-provider-hub-capability-profiles --max-cycles 20 --json
```

The current MVP is dry-run only. It reconciles managed goal state and returns the next controller action without creating Codex threads, running tests, registering events, or reading long artifacts.

## State Machine

```text
reconcile
  -> next-phase-ready
  -> result-ready
  -> controller-active
  -> subagent-active
  -> blocked
  -> done
```

The runner may loop locally in future adapter-backed mode. Chat controllers must not loop.

## Action Planning

The runner maps `goal-next-action.v1` to fresh controller commands:

```text
worker        -> /goal dispatch <task-id> worker --fresh-controller
reviewer      -> /goal review <task-id> --fresh-controller
main-verifier -> /goal verify <task-id> --fresh-controller
release       -> /goal closeout --fresh-controller --allow-closeout
```

Release closeout is blocked unless `--allow-closeout` is supplied.

When a completed thread result is supplied:

```sh
pnpm symphony supervisor run \
  --goal v38-provider-hub-capability-profiles \
  --completed-thread 019e955c-683a-7831-8851-7855ce7780ba \
  --task task-5 \
  --role main-verifier \
  --result-event main.verification-passed \
  --evidence-ref docs/plans/v38-task-5-main-verification-evidence-2026-06-02.md \
  --json
```

the runner validates that the completed result matches the current ledger next action before planning a fresh controller to consume it.

## Boundaries

The runner does not:

- call model/provider CLIs;
- create Codex threads in dry-run mode;
- run tests or builds;
- register goal events;
- read evidence bodies, implementation files, full diffs, or long logs;
- continue a compacted controller.

Those actions belong to fresh controllers or subagents with explicit phase leases.
