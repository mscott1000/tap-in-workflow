# Current Tap In project

Updated: 2026-10-30, America/Chicago. Read [USER_SCOPE.md](USER_SCOPE.md) before status reports or edits and [INSTRUCTION_CLARITY.md](INSTRUCTION_CLARITY.md) before navigation/install instructions. They record explicit user requirements and supersede conflicting historical checklists.

## Verified repository state

| Item | Current evidence |
| --- | --- |
| Environment | The cloud environment is running. Environment creation is complete. |
| Required tests | Main requires `synthetic-checks`, bound to the GitHub Actions app (15368). The user restored this setting and Codex verified it through GitHub. Enforcement is `non_admins`; the automation never requests admin bypass. |
| Automatic merging | Installed through [PR #26](https://github.com/mscott1000/tap-in-workflow/pull/26), and demonstrated by [PR #28](https://github.com/mscott1000/tap-in-workflow/pull/28): `app/github-actions` enabled and performed its squash merge. [Enrollment run 41124337996](https://github.com/mscott1000/tap-in-workflow/actions/runs/41124337996) succeeded. No independent approval gate blocks this sole-owner workflow. |
| Durable project context | [PR #27](https://github.com/mscott1000/tap-in-workflow/pull/27) merged the exact uploaded source snapshots and user scope/instruction rules into main. The earlier closed PR #25 is not a current blocker. |
| Generator source | [PR #28](https://github.com/mscott1000/tap-in-workflow/pull/28) merged the generator-only mapping, dependency, warning, and retry fixes. Other working runtime files were preserved. Complete source/destination and configuration values are in [GENERATOR_INSTALLATION.md](GENERATOR_INSTALLATION.md). |
| Test evidence | Code baseline `77542212e659f79e0e50bcef448d57deb096e328` passed all seven synthetic suites and source/configuration checks locally. Its PR's [GitHub verification run 41124337950](https://github.com/mscott1000/tap-in-workflow/actions/runs/41124337950) also passed. Documentation-only commits may follow that code baseline. |

The exact four user uploads are permanently preserved under `integrations/source-snapshots/2026-10-30/`, with project/editor mappings and SHA-256 hashes. Consult these before requesting those files again. Archive provenance, maintained source, and independently verified live installation are different evidence states.

## Four-task recovery checklist

1. **Required synthetic checks — complete.** The required context is restored and verified; do not reopen the resolved setting as a pending task.
2. **Recover missing context and generator fixes — complete.** PRs #27 and #28 are merged into main.
3. **Reconcile status documentation — complete.** Status documents distinguish completed recovery from remaining application work; this follow-through records the user-confirmed working Voice call log.
4. **Google Voice implementation and activation — complete, user-confirmed live.** The user installed the source, connected the correct mailbox, verified a new call and duplicate prevention, created the one-minute timer, and confirmed scheduled operation. See [Voice live verification](VOICE_LIVE_VERIFICATION.md).

## Completed Voice call log

Google Voice → Communications is working with one-minute polling. Installed source is the PR #30 version at `10258ea42e994ca5d63f1073a7c1703aa55a74f7`. The user supplied a successful import log (`created=1, examined=1, more=false`), confirmed no duplicate on repeat, supplied the timer-creation log, and confirmed scheduled operation. This is user-reported live evidence, not an authenticated-screen inspection by Codex. Preserve the working baseline and timer. See [Voice live verification](VOICE_LIVE_VERIFICATION.md).

## Actual remaining work

- **Generator installation and app configuration:** repository source and the generator-only handoff are ready. No new evidence establishes live installation, saved generator-bot configuration, manual fallback/display configuration, or Request/Graveyard presentation. The confirmed existing form is **Case_Form**; no replacement form is needed. User-completed editor work must follow the exact source/destination and expressions in the handoff, without changing other working files or layouts.
- **Live verification:** repository checks and GitHub merges do not establish live operation. Identify an explicitly fictional fixture and agreed test scope before user-run generation and a repeated deduplication check. Operational records are not fixtures.

## Stable project rules and evidence boundaries

Preserve the existing app, Jotform, custom layouts, archives, keys, ownership, scripts, and triggers. Use Client rows and child Case rows linked by CLIENTROWID. Exact resources are in `config/project-registry.json` and physical headers in `config/live-schema.snapshot.json`. Preserve `reference/TERMINOLOGY_V1_2026-10-23.md` unchanged; latest explicit user instructions control. Advisory evidence never automatically decides eligibility, merges identities, or submits messages/requests.

The earlier narrowly scoped Sheet validation repair was completed and read back without record-value changes. This documentation reconciliation changes no live data, scripts, triggers, GitHub settings, or AppSheet configuration. GitHub merges do not install Apps Script or save AppSheet settings.

## Current task: Client-attached Cases

User authorized phase-free Cases and the **Create Cases** action. Generator source now leaves CASEPHASE blank on new rows, preserves the existing CASESTATUS default, and skips existing rows without resetting their progress. User-supplied editor recordings establish remaining legacy Case-phase dependencies, not completed removal. User owns AppSheet configuration. See [CLIENT_ATTACHED_CASES.md](CLIENT_ATTACHED_CASES.md). No live source installed, functions executed, or Sheet values changed for this task.
