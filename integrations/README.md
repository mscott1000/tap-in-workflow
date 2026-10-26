# Identity and case review integration (prototype)

## Phase 2 Gmail intake importer (prepared 2026-10-26)

`gmail-phase-two-importer.gs` runs **alongside** the existing `google-intake-form-auto-add`. Install it in a **separate Apps Script project** owned and authorized by the intake mailbox account. Do not replace the old script, add this file to its project (the global names would conflict), or change its trigger. The AppSheet importer keeps its own `runIngest` handler and uses the existing Jotform email parser. For each accepted email, it writes a new `ClientIdentities` row and a linked `Clients` row in the AppSheet POC workbook, with `ClientPhase = Research` and `ClientStatus = Check Cases`. The same email ID supplies stable keys for retry safety. It does not create cases or automatically merge a returning person with an earlier identity. Staff identity review remains separate.

**Independent processing:** The AppSheet importer searches matching emails whether read or unread and never marks them read/unread, applies labels, archives, deletes, or sends them. It uses each message ID in `Clients[ClientRowID]` to recognize its own successful imports, independently of the old ingester. Whichever importer runs first, the old ingester's unread-email behavior is not changed by AppSheet. Search results are paged so previously imported threads do not block older pending messages; each run creates at most 50 new Client rows. An import is unique per message, not per person or TIC week.

**First-run caution:** The default search is `subject:"Intake Form -" newer_than:3d`. Unlike the old importer it includes already-read notifications, so a first run can import matching emails from the previous three days. Before the first manual run, restrict `GMAIL_QUERY` to one agreed fictional test notification while retaining the `Intake Form -` subject format. Do not enable its schedule until that test succeeds. Messages outside the three-day search window need a separately approved backfill.

**Installation status:** The revised code and synthetic tests are saved in this repository, not installed or live-tested. The mailbox Apps Script project could not be opened in the connected browser on October 26 because Google presented a verification block. When mailbox access is available, leave the original project untouched, create the separate AppSheet intake project, grant the mailbox account Editor access to the AppSheet workbook, install this file, authorize its Gmail and spreadsheet access, and manually run `runIngest` for the isolated fictional notification. Verify that both destinations receive the example and a second AppSheet run does not duplicate it. Then confirm/create `runIngest`'s time trigger in the **new** project (or call `setupTriggerOnce()` there). The direct sheet writes intentionally create both linked rows; they do not rely on the AppSheet `Intake Receiver - Phase 2` bot, which runs on AppSheet additions rather than script writes.

**Synthetic verification:** `node integrations/gmail-phase-two-importer.test.cjs` checks both importer orders, unchanged read state, linked-row mapping, duplicate prevention, interrupted writes, pagination beyond 50 threads, and new messages in an already-seen conversation. These are mocked tests, not evidence of Gmail authorization or live installation.

## Source findings, 2026-10-22

The supplied `Intake 2026` workbook contains a **TIC Graveyard** tab, not a separate workbook. Its visible headings include TIC Week, First Name, Last Name, DOB, Eligible Cases, Ineligible Cases, Phone Number, and Email Address. The supplied scripts do three different jobs:

- Gmail Jotform ingestion appends to Weekly Call Log; its prior-client check compares normalized first and last names only.
- Google Voice ingestion logs calls/voicemails and checks names and phones against Weekly Call Log and Completed Call Log.
- The sheet edit handler checks phone duplicates and extracts selected case-number formats from graveyard case text; a cell-address whitelist suppresses red coloring.

These scripts are useful inputs to a **candidate** workflow. None establishes a stable ClientID or proves a case was submitted. They rely on Sheet edits, which are not the trigger path for AppSheet additions or script writes.

## Prototype changes already made

The AppSheet POC workbook has nine new fields on `ServiceEpisodes` (the source of the `ClientInstances` app table): FirstName, LastName, MiddleName, DOB, Phone, Email, Address, StaffNotes, IdentityReviewStatus. The `IdentityCandidates` and `CaseMatchCandidates` tabs are empty review stores. Their AppSheet tables allow updates, but not adds or deletes. The `EpisodeID` / `CaseID` columns are references to the parent tables.

The ClientInstance detail has **Cases for this TIC Week** and **Prior Cases**. Prior Cases currently covers other POC cases with the same existing ClientID, not the operational Graveyard. Its source is `PriorCases_ReadOnly`, so staff cannot add from that list. The first section allows Add for Phase 2–5. Internal EpisodeID and ClientID are hidden from the detail.

## Code status

`identity-review-core.js` is pure matching logic. It proposes people when DOB and name/contact support a match, including limited typo tolerance and last-name change with DOB plus contact. It extracts the legacy case-number patterns and flags a repeat case number for review. It never merges people or marks a case as previously submitted. Synthetic checks are in `identity-review-core.test.js`.

`identity-review-adapter.gs` is a **prepared, not installed** Apps Script prototype. It reads the Graveyard and POC instance/case rows, and appends new candidate records without copying the full historical dataset. It needs both files in one Apps Script project, Script Properties `SOURCE_SPREADSHEET_ID` and `POC_SPREADSHEET_ID`, permission to read the former/write the latter, and a time-driven trigger or manual run. A linked operational importer should not be edited just to install this prototype.

## Remaining before live identity assignment

1. Complete the ClientInstance field migration and move the app's identity reference away from the old `Clients` row key, which encodes name and DOB. Existing fictional rows need a safe backfill. New ClientIDs should be opaque, automatic, and stable.
2. Define and build staff review decisions that link a confirmed historical person to an existing ClientID or keep a new one. A candidate alone must never cause a merge. Add a stable historical row identifier/fingerprint; legacy row numbers can shift.
3. Connect the review candidate list to an obvious action on the ClientInstance, show the source evidence, and protect non-decision fields from edits.
4. Tie linked historical case records to confirmed ClientIDs for **Prior Cases**. The current POC's `HistoricalCaseIndex` lacks person links; merely finding a matching number is not proof of submission.
5. Add an audited, serialized once-ever submission check by court and case number. Confirmed previous submission blocks export. The legacy whitelist must not bypass this.
6. Test intake by email, manual instance creation, manual Case creation, duplicate input, ambiguous match, and return in a later TIC week with fictional data before enabling an operational trigger.

No operational Graveyard rows, email bodies, names, DOBs, phone numbers, or case numbers are stored in this repository.

