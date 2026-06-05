# v38 GitHub Release evidence

Date: 2026-06-05

Goal id: `v38-provider-hub-capability-profiles`
Release tag: `v38`
Release name: `v38 Agent CLI Provider Hub MVP`
Evidence path: `docs/plans/v38-github-release-evidence-2026-06-05.md`

## Release Published

GitHub Release `v38 Agent CLI Provider Hub MVP` was published for the annotated `v38` tag.

| Field | Value |
| --- | --- |
| Release URL | `https://github.com/Andy20010101/multi-coding-agent-symphony/releases/tag/v38` |
| Tag | `v38` |
| Tag object | `79f660035ef5a7bebe8cc29e0e97030ec32b5a18` |
| Peeled commit | `62304651f706df1a2de257b5deb3c047466cd2ae` |
| Release targetCommitish | `main` |
| Published at | `2026-06-05T03:18:12Z` |
| Draft | `false` |
| Prerelease | `false` |

The release was created after the `v38` annotated tag was created and pushed to `origin`.

## Release Notes Scope

The GitHub Release notes summarize:

- read-only Agent CLI provider contracts for `claude-code-cli` and `codex-cli`,
- sanitized provider health, capability profile mapping, and lane assignment preview contracts,
- Workbench Provider Hub and Desktop Shell provider availability surfaces,
- temporary controller/supervisor operating layer and dry-run supervisor runner,
- local and CI validation,
- v38 boundaries around provider CLI execution and future v41 runner scope.

## Validation Basis

The GitHub Release is based on validation recorded in:

- `docs/plans/v38-release-evidence-2026-06-05.md`
- `docs/plans/v38-tag-evidence-2026-06-05.md`
- `docs/plans/v38-release-gates-evidence-2026-06-05.md`

Main merge commit CI:

| Run | Result |
| --- | --- |
| GitHub Actions run `26991228821` on commit `64ab57e40e24ab7e07e14d2126a265731eb73463` | Success. Included `pnpm check`, `pnpm test`, `pnpm test:mutation:gate`, `git diff --check`, and `pnpm mcas doctor`. |

Tag target local validation:

| Command | Result |
| --- | --- |
| `pnpm check` on commit `62304651f706df1a2de257b5deb3c047466cd2ae` | Exit 0. |
| `git diff --check` on commit `62304651f706df1a2de257b5deb3c047466cd2ae` | Exit 0. |

Post-tag CI:

| Run | Status |
| --- | --- |
| GitHub Actions run `26993207536` on commit `62304651f706df1a2de257b5deb3c047466cd2ae` | In progress when this evidence was written. |
| GitHub Actions run `26993212745` on commit `62304651f706df1a2de257b5deb3c047466cd2ae` | In progress when this evidence was written. |

These post-tag runs were triggered after the release evidence commit and tag push and were not treated as pre-release blockers.

## Commands

| Command | Result |
| --- | --- |
| `git tag -a v38 HEAD -m "v38 Agent CLI Provider Hub MVP"` | Exit 0. Created annotated tag object `79f660035ef5a7bebe8cc29e0e97030ec32b5a18`. |
| `git push origin v38` | Exit 0. Pushed new tag `v38`. |
| `gh release create v38 --title "v38 Agent CLI Provider Hub MVP" --notes-file -` | Exit 0. Returned `https://github.com/Andy20010101/multi-coding-agent-symphony/releases/tag/v38`. |
| `gh release view v38 --json tagName,name,isDraft,isPrerelease,publishedAt,url,targetCommitish` | Exit 0. `isDraft:false`, `isPrerelease:false`, `publishedAt:"2026-06-05T03:18:12Z"`. |
| `git ls-remote --tags origin 'refs/tags/v38*'` | Exit 0. Tag object `79f660035ef5a7bebe8cc29e0e97030ec32b5a18`; peeled commit `62304651f706df1a2de257b5deb3c047466cd2ae`. |

## Boundaries

This release step did not move an existing tag, create v39 state, start provider CLI jobs, execute real provider CLIs, invoke models, add a real CLI runner, publish release artifacts beyond the GitHub Release entry, or change v41 runner scope.
