# PR #19 execution status — 2026-10-20

Source specification: `docs/PHASE_TWO_IDENTITY_EXPORT_INTERACTIONS_2026-10-20.md`

## Completed in the connected fictional prototype workbook

- Created a pre-change backup before spreadsheet writes.
- Preserved every existing ClientID, CaseID, CaseNumber, and relationship; no key migration or deletion was performed.
- Repaired the missing fictional ServiceEpisodes row `a9e9b19d`, which was referenced by the three existing `DEMO-MULTI-*` cases.
- Confirmed the existing `ExportSelections` worksheet scaffold:
  `SelectionID, StaffEmail, CaseID, SelectedAt, ExportBatchID`.
- Added `Interactions.StaffName` without replacing `StaffEmail` or removing legacy contact fields.
- Added fictional Phase Two acceptance fixtures:
  - `DEMO-C200` / `DEMO-E200`: client with zero Cases rows.
  - `DEMO-C201` / `DEMO-E201`: client with three distinct Cases rows (`DEMO-CS200`–`DEMO-CS202`).
  - `DEMO-I200`: structured timestamped contact record.

## Verification results

- 12 Clients, 13 ServiceEpisodes, 18 Cases, and 8 Interactions.
- No duplicate ClientID, EpisodeID, CaseID, or CaseNumber values.
- No orphaned ClientID/EpisodeID references in ServiceEpisodes, Cases, or Interactions.
- `DEMO-C200` has exactly zero case rows.
- `DEMO-C201` has exactly three case rows with distinct CaseNumbers.
- `DEMO-C201` has one structured interaction fixture with StaffName.
- Existing validation/formatting was copied to each added row and read back after writing.

## Key migration preflight

Do not migrate keys yet.

- One fictional client currently lacks DOB, so the proposed name+DOB identity cannot be generated for every row.
- Current CaseNumbers are unique and nonblank, but expressions, slices, actions, bots, and all references to `CaseID` still require a complete AppSheet audit before retiring the technical key.
- Exact name+DOB values cannot guarantee uniqueness for future people; keep the opaque key until the collision policy receives an explicit business decision.

## Pending in the authenticated AppSheet editor

No AppSheet editor/API control surface was available in the execution session. These items remain unapplied and unverified in the live app:

1. Regenerate the Interactions schema and configure InteractionID as the immutable `UNIQUEID()` key; configure ClientID/EpisodeID refs and StaffName.
2. Retain Research Clients so zero-case clients remain visible.
3. Add Research Cases, filter to current-episode cases for Research clients, group on the ClientID Ref while displaying the client label, and show one row per CaseNumber.
4. Add the client-scoped Add Case action with ClientID/EpisodeID prefill.
5. Add case-scoped Add to Export / Remove from Export actions backed by ExportSelections; block authoritative historical submissions and keep export selection distinct from request submission.
6. Configure the New Contact action/form and newest-first inline interaction history.
7. Apply consistent ClientStatus/CaseStatus formatting without format-rule pictograms; retain the native renderer dot if AppSheet cannot remove it.
8. Re-test all five phases, independent case routing, Request grouping by Court, export idempotency, contact creation, and the one-submission-ever safeguard.

The spreadsheet fixtures are ready for these authenticated AppSheet acceptance tests.
