# v62 Installer and Upgrade Baseline goal runbook

Date: 2026-06-14
Goal id: `v62-installer-upgrade-baseline`
Branch draft: `codex/v62-installer-upgrade-baseline`
Start condition: v61 closeout is merged and records verified v60/v61 release-state evidence.

> Scope note: These runbooks are written as repository-ready planning files for `multi-coding-agent-symphony`.
> They continue the current v60 boundary: browser/renderer surfaces must not become a generic terminal, local-file reader, provider-session reader, release publisher, or unsupported provider launcher.
> Primary model/tool line after v60: Codex + Claude Code only. Kiro remains historical compatibility. DeepSeek is only a Claude Code provider configuration detail, not a third Workbench provider.

## Version-start reconcile

v62 starts from the post-v61 `main` state.

Checked before v62 PR-0:

- `origin/main` resolves to `d2cfff816b0111140b3e5e11fb819f60cc0c4911`.
- `v61` is an annotated tag; `v61^{}` dereferences to `d2cfff816b0111140b3e5e11fb819f60cc0c4911`.
- GitHub Release `v61` exists at `https://github.com/Andy20010101/multi-coding-agent-symphony/releases/tag/v61`, is not a draft, is not a prerelease, has no assets, was published at `2026-06-14T17:31:02Z`, and targets `main`.
- Open PR state was `[]`.
- `v62` tag and GitHub Release were absent before v62 implementation.

## Objective

v62 should make the real installation and upgrade path explicit, testable, and safe. The user should no longer need to remember whether the stable installer points to v8, v59, v60, or a special ref.

## Target path

```text
v61 verified baseline
-> install ref strategy
-> install status contract
-> upgrade dry-run contract
-> rollback notes
-> v62 closeout and v63 handoff
```

## Boundary

Allowed work:

- record the installer stable-ref decision: fixed release tag, `latest-stable`, or explicit `MCAS_INSTALL_REF` policy
- add a read-only install status command or contract that reports current install dir, current ref, target ref, repo slug, binary dir, and doctor status
- add an upgrade dry-run plan that checks dirty install dir, Node version, pnpm availability, target ref existence, and rollback ref
- document clean install, upgrade, rollback, and development-checkout paths
- add tests for install/upgrade plan generation without network-dependent real installs
- keep actual upgrade confirmation terminal-owned or manual unless a dedicated later version proves it

Forbidden work:

- generic shell or terminal UI
- arbitrary renderer-side command execution
- frontend reads of local JSONL files, provider session folders, `.symphony` internals, goal ledgers, event logs, raw transcripts, or raw model output
- unsupported provider claims
- direct goal event append from provider output
- direct task completion from provider output
- automatic self-review
- automatic worktree creation
- automatic next-version goal creation
- git merge, push, tag, publish, or GitHub Release automation inside product code
- public distribution, notarization, or auto-update claims unless the version explicitly proves them
- silently changing a user's installed checkout
- network fetches from renderer UI
- unreviewed default installer ref changes without release-state evidence

## Expected deliverables

- `docs/install-guide.md`
- `docs/upgrade-guide.md`
- `docs/qa/v62-installer-upgrade-baseline-acceptance.md`
- `docs/plans/v62-installer-upgrade-baseline-closeout-snapshot-2026-06-14.md`
- `docs/plans/v63-mac-app-local-launch-mvp-runbook-2026-06-14.md`
- `tests/v62-installer-upgrade-baseline.test.js`

## PR breakdown

### PR-0: Runbook

Scope:
- Add v62 runbook.
- Record v61 release-state assumption.

Validation:
```sh
git diff --check
git diff --cached --check
```

### PR-1: Stable installer ref decision

Scope:
- Decide whether installer defaults remain conservative, move to `v60`/`v61`, or use a manually advanced `latest-stable` tag.
- Update README and install docs without overclaiming public distribution.
- Add a release note rule: installer ref changes require explicit release-state evidence.

Validation:
```sh
pnpm check
git diff --check
```

### PR-2: Install status and upgrade dry-run contract

Scope:
- Add `installStatus.v1` and `installUpgradePlan.v1` helpers.
- Add CLI surface such as `symphony install status --json` and `symphony install upgrade --target-ref <ref> --dry-run --json`, or a narrower equivalent that fits the existing CLI architecture.
- The dry-run must not checkout, fetch, install dependencies, or overwrite files.
- Include dirty install dir, current ref, target ref, rollback ref, Node/pnpm checks, and doctor command text.

Validation:
```sh
node --test tests/v62-installer-upgrade-baseline.test.js
pnpm check
git diff --check
```

### PR-3: Install / upgrade / rollback docs and Workbench copy-only surface

Scope:
- Add docs for clean install, development checkout, upgrade dry-run, manual upgrade, and rollback.
- Add a Workbench display-only card only if it reads backend status and shows copy-only commands.
- No renderer fetch to GitHub, no local arbitrary path reads, no automatic checkout.

Validation:
```sh
pnpm workbench:build
node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js
node --test tests/v62-installer-upgrade-baseline.test.js
pnpm check
git diff --check
```

### PR-4: Acceptance, closeout, and v63 handoff

Scope:
- Record install status examples.
- Record upgrade dry-run examples.
- Record rollback path.
- Hand off to v63 Mac App local launch.

Validation:
```sh
node --test tests/v62-installer-upgrade-baseline.test.js
pnpm check
git diff --check
git diff --cached --check
```

## Validation

Run the focused validation required by the PR, then run the version closeout validation before tagging or handing off:

```sh
node --test tests/v62-installer-upgrade-baseline.test.js
pnpm check
git diff --check
git diff --cached --check
```

Run `pnpm test` before tagging unless the closeout snapshot records why a narrower suite was selected and accepted for that version.

## Acceptance criteria

The version is acceptable only when:

1. the implemented surfaces are backed by explicit contracts, fixtures, tests, or written operator evidence;
2. Workbench text does not overclaim execution, provider support, release automation, public distribution, notarization, or auto-update;
3. every state transition that mutates managed state uses a backend-owned preview/confirm or explicitly manual controller path;
4. raw transcripts, raw provider output, local session refs, provider payloads, and secret values remain outside Workbench payloads;
5. closeout records validation commands, skipped gates, residual risks, rollback commits or files, and the next-version handoff.

## Rollback path

If installer docs or code point users to an unverified release, revert the installer-ref PR. If upgrade dry-run mutates any checkout, remove the mutation path and revert to docs-only manual upgrade. If Workbench exposes upgrade execution controls, revert the Workbench PR.

## Next-version handoff

v63 should make the local Mac shell usable as the primary launch surface while keeping packaging/distribution off.
