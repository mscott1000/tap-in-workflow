# Current Tap In project

Updated: 2026-10-29, America/Chicago. Recheck dated observations before new writes.

## Scope and authority

Improve the existing AppSheet app and sheet. Preserve Jotform, staff layouts, archives, record links, and ownership.
The latest explicit user request controls. This record separates desired behavior from verified state. Older docs are historical.
GitHub is the source of truth for maintained script code. Existing copies still need comparison with any newer live edits before replacement. Code is installed by user copy/paste, never automated publishing.

## Terms and current directions

- Client row: parent work record for a person during a TIC week; table `Clients`.
- Case row: court case linked to its parent by CLIENTROWID; table `Cases`.
- CLIENTID connects identity across weeks; CLIENTROWID identifies a Client row; CASEID identifies a Case.
- `ClientIdentities` is hidden identity support, not a second staff queue.
- Detail sections: **Cases for this TIC Week**, **Prior Cases**.
- Returning people get a new Client row for a different TIC week. No automatic identity confirmation/merging.
- Preserve reference/TERMINOLOGY_V1_2026-10-23.md unchanged. Later decisions are recorded here, not silently written into that agreement.
- Phase titles: Intake, Research, Request, Follow Up, Graveyard. Do not route using numbered aliases.
- Client rows may appear in multiple phases when linked Cases occupy those phases. Do not restore the older global one-phase-only design.
- Latest direction makes Request Client-row-based like Research, Follow Up, Graveyard. Column order is user-managed. Requested does not mean installed.
- Cases move independently. Need to Text, Need to Call, Confirmation Pending preserve CASEPHASE.
- Outreach normally has no Cases; do not enforce restrictions that hide typo/error records.

## Resources and account boundaries

Exact IDs: ../config/project-registry.json. Physical headers: ../config/live-schema.snapshot.json.
The working sheet **Tap In Center — AppSheet System** may contain operational personal/legal data. It is not a fictional test database.
Historical workbook **Intake 2026** stays read-only. Relevant submitted cases: **TIC Graveyard**, F only. Phone sources: H there and C:S in **Completed Call Log**, including row 1.
Keep mailbox operation under the Tap In account. Never recreate its scheduled importer under a personal account when copying code.

## Last observed live state: 2026-10-29

| Area | Observation | Remaining work |
| --- | --- | --- |
| AppSheet | Saved version 1.000584. Saved bots: Intake Receiver - Phase 2; Update CLIENTPHASE when CLIENTSTATUS changes | Reinspect before edits |
| Generate Cases action | On Clients; updates CASEGENERATIONREQUESTEDAT | Inspect full Add Case fallback |
| Generator bot | Unsaved draft only; no saved live generator bot verified | Bind, save, and test after user auth |
| AppSheet Intake project | Four files: appsheet-intake-forms, history-match-core, history-match-adapter, voice-communications. No generator | Reconcile exact live source |
| Tap In Workflow project | eligible-cases-install contains createEligibleCasesForClient(clientRowId) | Its history-check dependency is in the other project |
| CHARGECLASS | AppSheet Enum A, B, C, D, E, O; other values disabled | Generator returns raw class text; resolve mapping |
| Source CASEPHASE validation | Numbered names remain while routing map uses phase titles | Narrow repair after inspection; no schema reset |
| Graveyard | Earlier view observation: Phase5_Cases; Phase5_Clients already has Client-or-child-case filter | User wants Client rows; recheck current view |
| Consent | Email sharing approved; broad Gmail/Sheets/background consent not completed | User handles any required runtime consent; no deployment credential setup |

## Candidate code and tests

This setup preserves available workspace copies of the communication importer and case parser/adapter/tests. They are **reconciliation candidates**, not newly deployed code.
The combined generator has the structure inspected in Tap In Workflow; byte-for-byte equality to current live source is not claimed.
Known generator gaps: CHARGECLASS mapping, court-name normalization, missing co-located history checker, and fallback that cannot navigate the staff browser to a manual form.
Preparing the Codex environment does not repair these functional defects.
Synthetic tests prove behavior under mocks, not live permissions, scheduled execution, valid AppSheet rows, or end-to-end operation.

## Standard editing workflow

The user's latest instruction replaces the automated publisher setup:

1. Read context, inspect relevant live Sheet ranges, and propose the specific change once.
2. After approval, complete every relevant edit supported by connected Google Drive/Sheets. Read back results; do not hand those edits back to the user.
3. Maintain/test complete changed Apps Script files in this repository as the source of truth.
4. Leave only user-completed Apps Script copy/paste and AppSheet editor steps, with exact file links, expressions, buttons, and checks.
5. Report completed, prepared, installed, and live-verified separately.

No automated logins, custom OAuth setup, Google deployment secrets, or automated script publishing.
Code installation is a user action. No operational scripts are run as repository setup tests.
Task approval covers the stated change, not unrelated cleanup, data deletion, or layout resets.

## Connected access checked in this setup: 2026-10-29

Connected Google Drive successfully read the working spreadsheet's tab metadata and exact headers:
Clients A1:AM1 (39 headers), Cases A1:AJ1 (35 populated headers), Communications A1:O1 (15 headers).
These matched the stored snapshot. No client records were read, and no live cells were written.
This proves read access in this chat, not write access or availability of the connection in every future Codex task.
At task start, check tool availability and exact-file access. If absent, finish repository work and name the missing connection; no token workaround.

## Remaining app work

1. Resolve generator mappings, history integration, manual Add Case fallback, and field warnings/repeat-check display. No draft-row type.
2. Perform approved source-Sheet repairs through connected tools after re-reading current values.
3. Give the user ready changed script files with exact copy destinations; do not install unresolved candidates.
4. Give exact AppSheet steps to save the timestamp-change bot passing CLIENTROWID to the correct function.
5. Verify Client-row presentation in Request/Graveyard without resetting custom columns.
6. Run only an explicitly agreed live test, then repeat it to prove deduplication. No operational records as fixtures.

## Environment preparation

Prepared: repository rules, direct-Sheet editing requirement, user-copy/paste source map, browser-first Codex setup, handoff template, and remaining-user-step checklist.
Removed: automated Apps Script publishing workflow, token-based publishing code/configuration, and its obsolete tests. Prior Git commits retain that history.
Preserved: all integration source/tests, historical terminology, custom layouts, script projects, triggers, archive, and live records.
The new fifth test suite checks the copy map, offline setup, and absence of the removed publisher.
The environment itself must still be created and published by the user through USER_SETUP.md; this repository commit does not do that.
No live scripts installed/run, AppSheet saves, trigger changes, or Sheet data edits were performed for environment preparation.

Verification for this revision: npm run setup passed all five synthetic suites and source/configuration checks. Live Sheet verification was limited to metadata and the three header rows above. No runtime or AppSheet verification is claimed.

## GitHub auto-merge installation — 2026-10-30

User authorized the repository auto-merge workflow. See [AUTO_MERGE.md](AUTO_MERGE.md). GitHub currently enables auto-merge/squash and main requires synthetic-checks. Bootstrap [PR #26](https://github.com/mscott1000/tap-in-workflow/pull/26) passes its required synthetic-checks job and has native squash auto-merge enabled. Installation is blocked by GitHub reviewDecision REVIEW_REQUIRED: main requires an independent approving review. The connection acts as the PR author and cannot approve its own PR. The workflow is not on main or active yet; it will be installed when GitHub merges the approved PR. No review requirement was removed or bypassed. No external app or Sheet records changed.
