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

## Script uploads received 2026-10-30

Four user-supplied AppSheet Intake scripts are permanently preserved, byte-for-byte, in [the dated source snapshot](../integrations/source-snapshots/2026-10-30/README.md), with exact editor names, maintained-file mappings, and SHA-256 hashes in manifest.json. Consult these before asking the user for scripts again. They include newer/different history wording, GMT date reads, and checkpoint-based Voice ingestion. Maintained files have not yet been reconciled. User identifies the uploads as connected Google Drive scripts; current installed Apps Script equality remains unverified. No generator was supplied. Next source-reconciliation work must compare these snapshots with maintained code and review AppSheet status compatibility and date handling. No installation or live data changes occurred.
