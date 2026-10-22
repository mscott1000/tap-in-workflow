# Identity and case review integration (prototype)

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
