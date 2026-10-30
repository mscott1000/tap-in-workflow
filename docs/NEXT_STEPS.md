# Remaining steps

## Environment setup

Create and publish **Tap In** following USER_SETUP.md. Repository preparation is complete; publication is a user action and has not been verified.
No Apps Script installation, Google deployment credentials, or Sheet changes are required to create the environment.
Verify Google Drive access in a new task; connection availability is separate from GitHub.

## Existing app work — not completed by environment setup

1. Finish the case generator's CHARGECLASS mapping, court names, history-check integration, and manual Add Case fallback in repository code.
2. Apply any approved source-Sheet corrections directly through connected tools. Inspect current values first; no schema reset.
3. Supply only the changed complete script files ready for user copy/paste, after confirming newer live edits are not lost.
4. Prepare exact AppSheet steps to save the generator bot and verify Client-row presentation in Request and Graveyard without resetting layouts.
5. Use an explicitly agreed test fixture for live checks and deduplication. Do not run against operational records as a setup test.

These are future app-change tasks, not instructions to install all existing candidate code now.
After each task, replace this list with only the actual remaining user steps and unresolved work.

## GitHub auto-merge installation — 2026-10-30

User authorized the repository auto-merge workflow. See [AUTO_MERGE.md](AUTO_MERGE.md). GitHub currently enables auto-merge/squash and main requires synthetic-checks. Bootstrap [PR #26](https://github.com/mscott1000/tap-in-workflow/pull/26) passes its required synthetic-checks job and has native squash auto-merge enabled. Installation is blocked by GitHub reviewDecision REVIEW_REQUIRED: main requires an independent approving review. The connection acts as the PR author and cannot approve its own PR. The workflow is not on main or active yet; it will be installed when GitHub merges the approved PR. No review requirement was removed or bypassed. No external app or Sheet records changed.
