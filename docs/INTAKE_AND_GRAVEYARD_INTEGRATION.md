# Intake and graveyard integration
Updated 2026-10-18. No operational account is connected.

## Current lifecycle — implemented
The existing app now uses **Clients.WorkflowStage**, a virtual calculation from client status and current-episode case statuses. Manual ClientStage instructions are superseded. See [Workflow fields and automatic phases](WORKFLOW_FIELDS_AND_AUTOMATIC_PHASES.md) and [Demo clients and phase transitions](DEMO_CLIENTS_AND_PHASE_TRANSITIONS.md).

- One durable client can be in Intake, Research, active Phase 3/4, or Graveyard exclusively.
- CaseStatus Ready to Refer appears in Request only for an active client and matching current EpisodeID.
- Decision in Progress and Follow Up - Approved/Denied appear in Follow Up. **A sent request enters Follow Up immediately.**
- Completing an individual case requires ClientNotifiedDate; unfinished siblings remain active. The last completed current case moves the client to Graveyard.
- Client Complete choices are withheld while any current case is unfinished; zero-case closure is explicit.
- New clients get CurrentEpisodeID = UNIQUEID(); new cases inherit it. ServiceEpisodes remains workbook-only; automatic audit rows and reopening actions are future work.
- ClientStage is hidden/derived as a legacy physical mirror and can be stale after a child-only edit. Do not use it as the phase authority. CasePhase is derived/read-only; queue filters use CaseStatus directly.
- Importers must set **ClientStatus = Kiddie Pool**, **DateFormSubmitted**, and **CurrentEpisodeID** for a new completed intake or a confirmed Phase 1 completion. Do not rely on AppSheet initial values/App formulas to run on external Sheet writes.
- Repeated intakes for active clients must be attached for review without regressing status or replacing CurrentEpisodeID.

## Integration proposal — not installed
The source scripts and operational account boundary below remain applicable. Any older “set ClientStage to Phase 2” wording means write the new structured intake/status fields above, not a manual stage control.

## Email intake: reuse parsing, replace delivery/replay handling
Reviewed repository file: `google-intake-form-auto-add`.
It searches unread emails with the Intake Form subject convention, parses HTML question/value cells with a plain-text fallback, splits names and addresses, writes a fixed-position Weekly Call Log row with template formatting, and then marks the message read. It flags possible prior clients using first/last name only. Do not change the existing production importer during prototype work.

Recommended adapter:
1. Time-driven Apps Script installed and authorized by the future operational mailbox account.
2. Configured sender/form identity plus subject filtering. Keep mailbox query, destination workbook IDs, and cutover/backfill date in private configuration rather than code.
3. Reuse reviewed field parsing; preserve raw submitted values privately where normalized values are uncertain. Validate dates and compound names; do not manufacture missing DOBs.
4. Use an IntakeImports staging/receipt table with stable SourceSubmissionID where available and Gmail MessageID as delivery identity. Track Received, Needs Review, Applied, Error plus ClientID and timestamps. Exclude email bodies and PII from execution logs.
5. Under a script lock, replay-safe import with stable identifiers: recover partially applied writes rather than appending another client. A read/unread flag is not a deduplication ledger. The current newer_than:3d window can miss mail during downtime and should not be the sole cursor.
6. Resolve an existing Phase 1 client conservatively. Name + DOB can propose a match; require review for ambiguous/conflicting identities. Phone/name alone must not silently merge clients.
7. For a new client, or confirmed matching Phase 1 client, store mapped intake fields, DateFormSubmitted, CurrentEpisodeID and ClientStatus = Kiddie Pool. Do not create a case until researched. Research then includes the client on sync.
8. Repeated submissions for an already active client must not reset their stage to Phase 2. Attach the new intake to the existing identity for review. Returning completed clients reopen through an explicit staff-reviewed episode so old cases and submission history persist.
9. Mark the import Applied only after all destination writes succeed. Keep the legacy output until a deliberate cutover. Do not install two ingestion paths writing duplicate clients.

Apps Script sheet writes do not invoke onEdit, and programmatic writes do not activate AppSheet's Sheets external-event add-on. Therefore write all required phase/receipt fields in the importer itself; do not assume an onEdit or AppSheet bot will finish the transaction. AppSheet sees source changes at sync. No email-triggered automation has been installed or tested yet.

## Graveyard: preserve source, expose structured history
Reviewed repository file: `repeat-case-check`.
Its graveyard check extracts case identifiers from the configured historical tab's case column and compares them to identifiers in the weekly log; it highlights matching cells red. It also has independent phone matching/name backfill. The whitelist is keyed to cell addresses such as K12. This is useful evidence discovery, not a submission ledger.

Recommended integration:
- Retain the operational graveyard workbook/tab as the authoritative legacy history, initially read-only from the new app integration. Do not rewrite or move it into the prototype.
- Derive HistoricalCaseIndex rows: stable HistoricalID, original/normalized case number, canonical court, CaseKey, source location/record, SubmissionHistoryStatus and verification information. Keep personal and legal records out of GitHub.
- Preserve all case formats; the current extractor supports only selected identifier patterns, is case-sensitive, and omits court from comparisons. Normalize conservatively and flag uncertain court/identifier matches. Matching by case number alone can collide across courts.
- Use court + case number for exact case matches. A name/phone match is a possible prior-client signal, not proof the current case was submitted.
- Show prior-record evidence in case details during Research; allow staff to open the original source. Use explicit status and source references rather than importing red fill as truth.
- Maintain separate states CONFIRMED SUBMITTED, RESEARCHED ONLY, UNKNOWN - VERIFY. A legacy row does not automatically mean submitted. Unknown requires verification before submission.
- Replace cell-address whitelists with stable CaseKey-linked review records including reason, reviewer, and time. A confirmed previous submission cannot be whitelisted into resubmission.
- Final submission must use an audited, concurrency-controlled submission ledger keyed by canonical case identity; a UI warning or AppSheet Valid_If alone is not a race-safe one-time-submission guarantee.
- Keep the Phase 5 completed-client queue separate from the all-history lookup. Active clients can have old graveyard records without appearing in both primary queues.

## Account connection recommendation
Finish and test with fictional records first. Then connect the operational account at a controlled integration step:
1. Confirm app ownership/data-source account, workbook access, individual staff sign-in, and intended app users.
2. Connect only the necessary workbook/tab, with read-only access for history where feasible.
3. Install/re-authorize the intake trigger as the intended mailbox account. Triggers run as their creator, so merely switching an app data-source connection does not move mailbox access.
4. Verify a synthetic intake message through that mailbox, replay it to test deduplication, test ambiguous matching, and confirm Research receives one client.
5. Verify history matches and no-match/unknown states against approved examples before processing real cases.
No operational mailbox, live graveyard, credential, or sharing permission was added in this session.

Official behavior references:
- https://developers.google.com/apps-script/guides/triggers/installable
- https://developers.google.com/apps-script/guides/triggers
- https://support.google.com/appsheet/answer/11520310
- https://support.google.com/appsheet/answer/10108301
