# v41 GitHub Release evidence

Date: 2026-06-06

Goal id: `v41-controlled-cli-provider-runner-backend-completion`
Release tag: `v41`
Release name: `v41 Controlled CLI Provider Runner + Backend Completion`
Evidence path: `docs/plans/v41-github-release-evidence-2026-06-06.md`

## Release Published

GitHub Release `v41 Controlled CLI Provider Runner + Backend Completion` was published for the annotated `v41` tag.

| Field | Value |
| --- | --- |
| Release URL | `https://github.com/Andy20010101/multi-coding-agent-symphony/releases/tag/v41` |
| Tag | `v41` |
| Tag object | `68c8e62afa3bc29ae32b0058fe8c7349e9804f73` |
| Peeled commit | `00387489fffa843ed5e694ede7b2c55951061323` |
| Release targetCommitish | `main` |
| Published at | `2026-06-06T05:05:58Z` |
| Draft | `false` |
| Prerelease | `false` |

The release was created after `main` and the annotated `v41` tag were pushed to `origin`.

## Release Notes Scope

The GitHub Release notes summarize:

- controlled backend provider runner support for `claude-code-cli` and `codex-cli`,
- strict runner and operation contracts,
- backend preview/confirm binding,
- sanitized provider operation evidence,
- Workbench read-only preview/confirm surfaces,
- v41 task evidence and release closeout evidence,
- boundaries around inactive providers and raw CLI execution.

The notes explicitly state that task-5 controlled real CLI evidence is timeout/failure evidence from the backend runner, not successful provider task completion.

## Validation Basis

The GitHub Release is based on validation recorded in:

- `docs/plans/v41-release-evidence-2026-06-06.md`
- `docs/plans/v41-task-1-worker-evidence-2026-06-06.md`
- `docs/plans/v41-task-1-review-evidence-2026-06-06.md`
- `docs/plans/v41-task-1-main-verification-evidence-2026-06-06.md`
- `docs/plans/v41-task-2-worker-evidence-2026-06-06.md`
- `docs/plans/v41-task-2-review-evidence-2026-06-06.md`
- `docs/plans/v41-task-2-main-verification-evidence-2026-06-06.md`
- `docs/plans/v41-task-3-worker-evidence-2026-06-06.md`
- `docs/plans/v41-task-3-review-evidence-2026-06-06.md`
- `docs/plans/v41-task-3-main-verification-evidence-2026-06-06.md`
- `docs/plans/v41-task-4-worker-evidence-2026-06-06.md`
- `docs/plans/v41-task-4-review-evidence-2026-06-06.md`
- `docs/plans/v41-task-4-main-verification-evidence-2026-06-06.md`
- `docs/plans/v41-task-5-worker-evidence-2026-06-06.md`
- `docs/plans/v41-task-5-review-evidence-2026-06-06.md`
- `docs/plans/v41-task-5-main-verification-evidence-2026-06-06.md`

Tag target local validation:

| Command | Result |
| --- | --- |
| `pnpm check` | Exit 0. |
| `pnpm test` | Exit 0. 1085 tests, 169 suites, 1085 pass, 0 fail. |
| `pnpm workbench:build` | Exit 0. |
| `pnpm test:mutation:gate` | Exit 0. Mutation score 74.22, break threshold 60. |
| `pnpm audit --audit-level high` | Exit 0. One moderate vulnerability, no high or critical vulnerability. |
| `git diff --check` | Exit 0. |
| `pnpm mcas doctor` | Exit 0. Returned `status: ok`. |

Main push CI:

| Run | Status |
| --- | --- |
| GitHub Actions run `27053272565` on commit `00387489fffa843ed5e694ede7b2c55951061323` | In progress when this evidence was written. |

The main push CI run was triggered after local full release validation and was not treated as a pre-release blocker.

## Commands

| Command | Result |
| --- | --- |
| `git push origin main` | Exit 0. Pushed `main` from `5ab2d72dd89c2db191d8aee769ef5ccb73ef6d8e` to `00387489fffa843ed5e694ede7b2c55951061323`. |
| `git push origin v41` | Exit 0. Pushed new tag `v41`. |
| `gh release view v41 --json tagName,name,isDraft,isPrerelease,publishedAt,url,targetCommitish` before release creation | Release not found. |
| `gh release create v41 --title "v41 Controlled CLI Provider Runner + Backend Completion" --notes-file -` | First attempt failed with TLS handshake timeout before creating the release. Retry exited 0 and returned `https://github.com/Andy20010101/multi-coding-agent-symphony/releases/tag/v41`. |
| `gh release view v41 --json tagName,name,isDraft,isPrerelease,publishedAt,url,targetCommitish` after release creation | Exit 0. `isDraft:false`, `isPrerelease:false`, `publishedAt:"2026-06-06T05:05:58Z`. |
| `git ls-remote --tags origin 'refs/tags/v41*'` | Exit 0. Tag object `68c8e62afa3bc29ae32b0058fe8c7349e9804f73`; peeled commit `00387489fffa843ed5e694ede7b2c55951061323`. |
| `git ls-remote origin refs/heads/main` | Exit 0. `origin/main` at `00387489fffa843ed5e694ede7b2c55951061323`. |

## Boundaries

This release step did not move an existing tag, start v42 implementation, promote Gemini CLI or Kiro CLI into the active provider set, use DeepSeek as an active agent CLI provider, run raw provider CLI commands outside the controlled backend runner, or publish release artifacts beyond the GitHub Release entry.
