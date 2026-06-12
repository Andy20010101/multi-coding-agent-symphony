# v50 Supervisor Controlled Event Registration release prep

Date: 2026-06-12
Timezone: Asia/Shanghai
Prepared from branch: `codex/v50-supervisor-controlled-event-registration-closeout`
Implementation head before PR-5: `4df2c8ecd0f2709f5d0e50737033436d65144191`

## Release State

`v49` exists and is already published as `v49: Context Session Observability and Supervisor Advisory` at `https://github.com/Andy20010101/multi-coding-agent-symphony/releases/tag/v49`. The release is not a draft, not a prerelease, and has no assets. The local `v49` tag resolves to `9dafad52288c9268558da2a4f65df9b4314659d3`.

Open PR reconciliation before PR-5 edits returned `[]`. PR #62 through PR #66 are merged into `main`, ending at #66 merge commit `4df2c8ecd0f2709f5d0e50737033436d65144191`.

PR-5 does not create a tag, create a GitHub Release, publish, merge itself, or run release automation.

## Suggested Tag

Suggested tag name: `v50`

Tag target: the `main` commit after the PR-5 closeout PR merges. Do not tag the PR-5 branch commit unless the release manager intentionally chooses that target and records why.

## Release Notes Draft

```text
v50: Supervisor Controlled Event Registration

- Adds backend-owned `supervisorEventRegistrationEligibility.v1` for worker/blocker event registration eligibility from supervisor contracts, pending result state, and goal event routing rules.
- Adds a Workbench supervisor dry-run lane that previews eligible event registration through `GET /api/goals/<goal-id>/event-plan-preview`.
- Adds a Workbench supervisor confirm lane that submits the preview `planHash` through `POST /api/goals/<goal-id>/event-plan-confirm`.
- Shows `goal-update-plan.v1` preview details, `goal-event-confirmation.v1` append result details, and refreshed progress/events/next-action/closeout contract names.
- Keeps reviewer verdicts behind `symphony goal review`; keeps main verification and release gate events behind `symphony goal gate`.
- Adds `Refresh Supervisor State` so the Workbench supervisor route can reread backend contracts after preview or confirm work.
- Refreshes Workbench static assets from the PR #66 source changes.
- Boundaries remain closed for provider execution, child dispatch, transcript compaction, new thread creation, generic shell or terminal UI, frontend JSONL/session reads, git writes, tags, publish, GitHub Release creation, and release automation.
```

## Pre-Tag Checklist

- PR #62 is merged into `main` at `ea50f56f8fc51b08b938e3c601dbbafbf013f5d7`.
- PR #63 is merged into `main` at `3b817e5035de064cd7af3e1d67433f176cab072f`.
- PR #64 is merged into `main` at `07ed0fd23626674389a891c3a185c305e30f53bb`.
- PR #65 is merged into `main` at `542501d9650213273017ff11ab20deadb494ab16`.
- PR #66 is merged into `main` at `4df2c8ecd0f2709f5d0e50737033436d65144191`.
- PR-5 closeout and release-prep PR is merged into `main`.
- Fetch `origin main --tags --prune` after the PR-5 merge.
- Confirm `main` and `origin/main` are synchronized before tagging.
- Confirm no open PR changes are expected in the v50 release boundary.
- Run `node --test tests/v50-supervisor-event-registration-eligibility.test.js tests/v44-goal-supervisor-app-read-model.test.js`.
- Run `node --test tests/v21-goal-plan-preview-api.test.js tests/v23-goal-operation-console-api.test.js`.
- Run `node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js`.
- Run `pnpm check`.
- Run `git diff --check`.
- Confirm `src/symphony/workbench-static/index.html` points at the PR #66 generated asset names.
- Confirm the Workbench supervisor route has only `Preview Event Plan`, `Confirm Event Append`, and `Refresh Supervisor State` for this lane.
- Confirm the release note does not claim provider runtime, child dispatch, transcript compact, new thread creation, generic shell, terminal, frontend local JSONL/session reads, release automation, tag automation, or GitHub Release creation.

## Tag And Release Not Performed

This PR does not run `git tag`, `git push --tags`, `gh release create`, `gh release edit`, or any publish command. Those actions remain manual release-manager work after the PR-5 closeout PR lands on `main`.

## Provider And Cost Record

Execution record requested for PR-5: Codex `gpt-5.5` with reasoning effort `xhigh`.

The local tool outputs did not return token usage or cost. No token or cost number is recorded.
