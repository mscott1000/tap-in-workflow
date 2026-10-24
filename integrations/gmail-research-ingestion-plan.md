# Gmail intake → Research Client rows (staged integration)

Status: design staged; **not deployed**. Authoritative terminology: `TAP_IN_APP_SCHEMA_SOURCE_OF_TRUTH.md` (2026-10-23). No operational client data in this repository.

## Existing implementation confirmed
- Uploaded 2026-10-22 Apps Script `runIngest()` reads unread Gmail messages matching `subject:"Intake Form -"` and writes to `Weekly Call Log` in the Intake 2026 workbook.
- The script extracts name, DOB, phone, email, address, gender, race, warrant jurisdiction, referral source and missed-court-date explanation. It currently uses a name-only historical check, which is **not** authoritative identity resolution.
- The AppSheet workbook contains `ClientIdentities`, `Clients`, `Cases`, `IdentityCandidates` and `HistoricalCaseIndex`. A test Client row has phase `Research` and status `Check Cases`.

## Required safe adapter
1. Preserve `runIngest()` and its existing Weekly Call Log output. Build a separate, idempotent Research importer, initially disabled.
2. Read structured parsed intake fields from the existing parser or a staging sheet. Persist the Gmail message ID in an import ledger; check ledger before any write, and record success only after all required writes succeed. Use a script lock to serialize imports.
3. Resolve `CLIENTID` against `ClientIdentities`: only confirmed exact identity reuse; uncertain matches create an `IdentityCandidates` review record and must **not** silently merge. Ensure the client can still be seen in Research pending review.
4. Compute `TICWEEK` from the established TIC week convention, not an assumed calendar week. Enforce one `Clients` row per (`CLIENTID`, `TICWEEK`). A second legitimate intake in the same TIC week updates or attaches to the existing Client row rather than creating another.
5. For a new Client row, assign an opaque `CLIENTROWID`, `CLIENTPHASE = Research`, `CLIENTSTATUS = Check Cases`; populate available intake fields, preserving original values for audit. Do **not** create any Case rows from the email.
6. Show `Prior Cases` by verified `CLIENTID` without copying historical Case rows. Historical records are read-only in the new Client context.
7. Verify AppSheet keys, Ref types, column names, phase view source, sync behavior and access controls before enabling the importer. Script writes do not inherently fire AppSheet bots.
8. Test with fictional inputs: new client, same email replay, returning client next TIC week, second intake same week, ambiguous identity, malformed form, partial write/retry, and no-case Research visibility.

## Initial field mapping (verify against live schema)
`Your Name` → `FIRSTNAME`, `MIDDLENAME`, `LASTNAME`;
`Date of Birth` → `DOB`;
`Phone Number` → `PHONE`;
`Email Address` → `EMAIL`;
`Current Address` → address fields;
`What gender do you identify as?` → `GENDER`;
`What is your race?` → `RACE`;
`How did you hear about the Tap In Center` → `REFERRALSOURCE`;
`What county or city was the warrant issued in?` and missed-court-date explanation → client research notes pending approved field mapping.

## Blocking confirmations before enabling
- Exact live AppSheet schema and Research slice/view criteria; current workbook header capitalization differs from canonical specification.
- TIC week calculation and policy for multiple legitimate forms within one week.
- Identity matching review workflow and storage for import ledger.
- Which form fields should become structured columns versus research notes.

Do not deploy, modify the operational Apps Script, or mark historical cases as submitted based only on a name/number match.
