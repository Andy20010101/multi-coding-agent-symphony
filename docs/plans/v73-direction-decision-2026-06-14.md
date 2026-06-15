# v73 Direction decision

Date: 2026-06-15
Source goal: `v72-one-week-dogfood-stabilization`
Evidence scope: five same-day operator sessions on 2026-06-15

## Decision

v73 should continue stabilization.

Do not start internal distribution, public distribution, deeper automation, or provider expansion from v72 alone.

## Evidence Used

| Evidence | Result |
| --- | --- |
| Five v72 operator sessions | Completed on 2026-06-15. |
| Local `.app` package build | Passed through `pnpm desktop:shell:build:local`. |
| Local app open/quit smoke | Passed through `open -n`, process check, and `osascript` quit. |
| Browser fallback | Passed through read-only console and `GET /workbench/desktop/`. |
| Fresh worktree dependency recovery | Observed once; recovered with `pnpm install`. |
| Repeated product blocker | Not observed. |
| One-week stability | Not proven. |

## Why Continued Stabilization

The app path worked on this host, but the evidence is same-day. That is enough to keep using the local package and browser fallback for personal work. It is not enough to widen the release boundary.

The next version should collect multi-day use, keep friction visible, and simplify the daily path where real sessions show repeated drag.

## v73 Scope

Recommended v73 scope:

- continue same local personal-use boundary;
- run more sessions over multiple days;
- keep package build/open and browser fallback evidence current;
- track repeated blockers separately from one-off environment setup;
- simplify docs or UI only when repeated session friction justifies it;
- keep rollback commands current.

Do not include:

- public distribution;
- notarization;
- auto-update;
- DMG release;
- GitHub Release assets;
- colleague or customer rollout;
- provider expansion;
- generic shell or terminal UI;
- renderer arbitrary command execution;
- frontend local session, provider folder, raw transcript, raw model output, or raw provider output reads;
- product-owned git merge, push, tag, publish, or GitHub Release automation;
- automatic self-review, worktree creation, or next-version goal creation.

## Historical Compatibility to Simplify

Future stabilization can reduce visible historical compatibility only when a session shows it is causing current friction. Candidates to keep in review:

- old provider labels that make Codex worker and Claude reviewer status harder to scan;
- docs that describe historical release paths before the current local personal-use path;
- fallback wording that looks like distribution readiness.

No cut is accepted by this memo alone. Each cut still needs a scoped PR and validation.
