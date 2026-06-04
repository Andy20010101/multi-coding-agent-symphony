# v37 tag evidence

Date: 2026-06-04

Goal id: `v37-desktop-shell-mvp`
Release tag: `v37`
Release name: `v37 Desktop Shell MVP`
Evidence path: `docs/plans/v37-tag-evidence-2026-06-04.md`

## Tag Scope

The `v37` tag marks the `main` release commit for the Desktop Shell MVP after:

- all five v37 tasks are main-verified,
- final integration closeout audit passed,
- PR #8 was merged into `main`,
- mainline CI passed on merge commit `2346b6482b8caf15f07b2a48b062df7222485653`,
- release evidence is committed,
- tag evidence is committed.

## Tag Command

The tag command is:

```bash
git tag -a v37 HEAD -m "v37 Desktop Shell MVP"
```

The target is the current `main` `HEAD` immediately before running the command. The tag object records the concrete commit hash.

## Validation Basis

Release validation basis is recorded in `docs/plans/v37-release-evidence-2026-06-04.md`:

- `pnpm check`: passed.
- `pnpm test`: passed, 992 tests, 153 suites.
- `pnpm workbench:build`: passed.
- `pnpm desktop:shell:smoke`: passed.
- `cargo check --manifest-path desktop/shell/src-tauri/Cargo.toml --target-dir tmp/tauri-target`: passed.
- `cargo build --manifest-path desktop/shell/src-tauri/Cargo.toml --target-dir tmp/tauri-target`: passed.
- `git diff --check`: passed.
- GitHub Actions `CI` on merge commit `2346b6482b8caf15f07b2a48b062df7222485653`: passed, including `pnpm test:mutation:gate`.

Known limitation:

- `pnpm --silent symphony goal-status --goal v37-desktop-shell-mvp --json` returns exit 64 / `goal not found`.

## Boundaries

Creating and pushing the annotated tag does not publish a GitHub Release, create v38 state, start jobs, execute actions, invoke models, merge branches, alter release evidence after the tag target is chosen, or change Desktop Shell runtime boundaries.
