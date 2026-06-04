# v37 GitHub Release evidence

Date: 2026-06-04

Goal id: `v37-desktop-shell-mvp`
Release tag: `v37`
Release name: `v37 Desktop Shell MVP`
Evidence path: `docs/plans/v37-github-release-evidence-2026-06-04.md`

## Release Published

GitHub Release `v37 Desktop Shell MVP` was published for the existing annotated `v37` tag.

| Field | Value |
| --- | --- |
| Release URL | `https://github.com/Andy20010101/multi-coding-agent-symphony/releases/tag/v37` |
| Tag | `v37` |
| Tag object | `cd106f3afbebd0ffc04569144974db747a57e541` |
| Peeled commit | `075990a0b67c334220bd33b95ff4eb4f88e274bd` |
| Release targetCommitish | `main` |
| Published at | `2026-06-04T09:29:49Z` |
| Draft | `false` |
| Prerelease | `false` |

The release was created after the `v37` annotated tag already existed and had already been pushed to `origin`.

## Release Notes Scope

The GitHub Release notes summarize:

- Tauri desktop shell workspace and Rust host compile smoke.
- Fixed sidecar host bridge commands: `attach_sidecar` and `launch_sidecar`.
- `sidecar-host-lifecycle.v1` through local runtime health and app-state snapshot.
- Workbench `/workbench/desktop/` command-center surface.
- Contract-backed project list, active goal, next action, task status, job/run state, artifact readiness, safe preview, evidence timeline, and release bundle state.
- Desktop shell smoke check covering native host and packaging-disabled boundaries.

The notes also record the known managed-goal lookup limitation:

```bash
pnpm --silent symphony goal-status --goal v37-desktop-shell-mvp --json
```

Result: exit 64 / `goal not found`.

## Validation Basis

The GitHub Release is based on the validation already recorded in:

- `docs/plans/v37-release-evidence-2026-06-04.md`
- `docs/plans/v37-tag-evidence-2026-06-04.md`
- `docs/plans/v37-final-integration-closeout-audit-2026-06-02.md`

Main evidence commit CI:

| Run | Result |
| --- | --- |
| GitHub Actions run `26939965007` on commit `075990a0b67c334220bd33b95ff4eb4f88e274bd` | Success. Included `pnpm check`, `pnpm test`, `pnpm test:mutation:gate`, `git diff --check`, and `pnpm mcas doctor`. |

Tag-triggered CI:

| Run | Status |
| --- | --- |
| GitHub Actions run `26942654497` on commit `075990a0b67c334220bd33b95ff4eb4f88e274bd` | In progress when this evidence was written. This run was triggered after the tag had already been pushed and was not treated as a pre-release blocker. |

## Commands

| Command | Result |
| --- | --- |
| `gh release view v37 --json tagName,name,isDraft,isPrerelease,publishedAt,url,targetCommitish` before release creation | Release not found. |
| `gh release create v37 --title "v37 Desktop Shell MVP" --notes-file -` | Exit 0. Returned `https://github.com/Andy20010101/multi-coding-agent-symphony/releases/tag/v37`. |
| `gh release view v37 --json tagName,name,isDraft,isPrerelease,publishedAt,url,targetCommitish` after release creation | Exit 0. `isDraft:false`, `isPrerelease:false`, `publishedAt:"2026-06-04T09:29:49Z"`. |
| `git ls-remote --tags origin 'refs/tags/v37*'` | Exit 0. Tag object `cd106f3afbebd0ffc04569144974db747a57e541`; peeled commit `075990a0b67c334220bd33b95ff4eb4f88e274bd`. |
| `git ls-remote origin refs/heads/main` | Exit 0. `origin/main` at `075990a0b67c334220bd33b95ff4eb4f88e274bd`. |

## Boundaries

This release step did not create a new tag, move an existing tag, create a new release branch, change Desktop Shell runtime boundaries, run release packaging distribution, enable auto-update, perform signing or notarization, start v38 work, or modify product code.

