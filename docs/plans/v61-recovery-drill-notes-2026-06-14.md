# v61 recovery drill notes

Date: 2026-06-15
Timezone: Asia/Shanghai
Goal: `v61-workbench-operator-dry-run-evidence`
PR slot: PR-3 recovery drill notes
Branch: `codex/v61-recovery-drill-notes`
Branch start commit: `1b2718ad092ae079156eb229192f8a3cd8fc2b1e`

## Scope

These drills cover recovery for the released v60 Stable Personal Workbench baseline during the v61 operator dry run. They are manual controller procedures. They do not add product execution, release automation, provider launch, local file browsing, transcript reading, or automatic next-version goal creation.

## Missing stable baseline source contracts

Symptoms:

- `Stable Workbench Release` panel is missing or shows blocked state.
- `stableWorkbenchRelease.v1` is absent from the goal supervisor app read model.
- A required surface in the Surface Matrix is `missing`, `blocked`, or lacks a source ref.

Checks:

```sh
node --test tests/v60-stable-personal-workbench-release.test.js
node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js
pnpm check
```

Recovery:

1. Record the missing contract name and source ref in the v61 acceptance evidence.
2. Stop the dry-run pass for that surface.
3. Do not infer readiness from route rendering, branch names, filenames, prompt text, or command success.
4. If the missing source is a docs or fixture regression, revert the last docs/fixture PR that changed the source ref and rerun the focused tests.
5. If the missing source is backend projection drift, use a dedicated fix PR with contract tests before continuing v61 closeout.

Pass condition:

- `stableWorkbenchRelease.v1` is present, read-only, and validates through `tests/v60-stable-personal-workbench-release.test.js`.
- Workbench renders the stable baseline lane without execution controls.

## Blocked release boundary state

Symptoms:

- `v60` tag is missing or dereferences to an unexpected commit.
- v60 GitHub Release is missing, draft, prerelease, has unexpected assets, or points at an unexpected target.
- `v61` tag or GitHub Release exists before v61 closeout.
- Open PRs remain before tagging.

Checks:

```sh
git show-ref --tags -d | rg 'refs/tags/v60|refs/tags/v61'
gh release view v60 --json tagName,name,url,isDraft,isPrerelease,publishedAt,assets,targetCommitish
gh release view v61 --json tagName,name,url,isDraft,isPrerelease,publishedAt,assets,targetCommitish
gh pr list --state open --json number,title,headRefName,baseRefName,url,isDraft
```

Recovery:

1. Stop release closeout until tag, release, and open PR state are reconciled.
2. For v60 mismatch, compare `refs/tags/v60^{}` against the recorded v60 closeout and release evidence.
3. For an unexpected v61 tag or release, do not overwrite it. Record the object, release URL, creator-visible facts, and stop for operator review.
4. For open PRs, merge or close only the PRs that belong to the v61 chain and have green checks. Leave unrelated PRs untouched and record the blocker.
5. Keep tag creation, tag push, PR merge, and GitHub Release publication as controller actions outside product code.

Pass condition:

- v60 tag/release facts match the v61 release-state reconcile.
- v61 tag/release are absent until final v61 closeout publication.
- Open PR list is empty before v61 tagging.

## Unavailable Workbench server

Symptoms:

- `http://127.0.0.1:8765/workbench/desktop/` does not load.
- `pnpm symphony console` exits before listening.
- Another process is using the requested port.
- A fresh worktree lacks `node_modules` and `vite` is not found.

Checks:

```sh
pnpm install --frozen-lockfile
pnpm workbench:build
pnpm symphony console --host 127.0.0.1 --port 8765
```

Recovery:

1. If dependencies are missing, run `pnpm install --frozen-lockfile` in the current checkout and retry.
2. If port `8765` is busy, choose another loopback port with `--port <port>` and record the actual URL in evidence.
3. If the console exits, run `pnpm check` and the focused Workbench tests before changing code.
4. Do not expose a browser terminal, local shell control, arbitrary path input, or local file picker to recover from server failure.

Pass condition:

- `/workbench/desktop/` and `/workbench/` return `200`, `text/html; charset=utf-8`, `cache-control: no-store`, and `x-content-type-options: nosniff`.

## Stale static assets or route source mismatch

Symptoms:

- `/workbench/desktop/` loads but does not show `Stable Baseline`.
- Workbench source has changed but `src/symphony/workbench-static/` was not rebuilt.
- Generated asset names or content differ from the source route expected by tests.

Checks:

```sh
pnpm workbench:build
node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js
git status --short
git diff --check
```

Recovery:

1. Rebuild Workbench static assets only when `frontend/workbench/` source changed.
2. If docs-only changes produce static asset diffs, stop and inspect before staging.
3. If route smoke fails after a source change, fix the source or assertion in the same scoped PR and rebuild.
4. If the source route differs from the served route, record the mismatch and avoid closeout until the route smoke passes.

Pass condition:

- Route smoke tests pass.
- Static assets are either unchanged for docs-only work or intentionally rebuilt from matching frontend source changes.

## Validation

| Command | Result |
| --- | --- |
| `node --test tests/v60-stable-personal-workbench-release.test.js` | Passed on PR-3 branch. |
| `pnpm check` | Passed on PR-3 branch. |
| `git diff --check` | Passed on PR-3 branch. |
