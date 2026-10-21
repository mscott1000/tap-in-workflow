# Live AppSheet implementation and verification — 2026-10-21

The approved 2026-10-20 Phase Two specification has now been applied to the existing Tap In Center AppSheet prototype and its fictional source workbook. This is an implementation record, not a production-release certification. Historical handoff sections describe earlier states and are superseded by this file.

## Saved app changes

- Research remains a Clients-based primary view so clients with zero cases remain visible. It now displays one computed **Name** column, with separate first/middle/last fields retained in client editing. The whitespace-safe _ComputedName is the sole client label and Name group/sort field.
- Added menu **Research Cases**, backed by Phase2_Cases: current-episode Phase 2 cases whose client remains in Research, grouped by the client's full name. Each row opens its own case details. Client details put the compact Related Cases list directly beneath the client header.
- **Add Case** opens Cases_Form with the existing ClientID and current EpisodeID prefilled and hidden, plus initial Check Cases status. ClientID must remain editable in the schema for LINKTOFORM-prefilled values to persist; it is hidden from staff input. Standalone Adds are disabled on Research Cases and Export Queue slices.
- CaseNumber is the Cases key and staff-visible Case #. Original preflight found 18 nonblank unique docket numbers, no cross-court/episode collisions, and no existing ExportSelections references. The physical legacy CaseID column is retained hidden for compatibility with existing expressions; it is no longer the key and is excluded from draft CSVs.
- Backed up the prototype workbook before migration. Migrated 11 complete fictional client identities and every Cases, ServiceEpisodes and Interactions client reference together. One client without DOB retains its provisional key. New ClientID uses an initial-value expression built from uppercased trimmed first/last/middle and ISO DOB, falling back to UNIQUEID() for incomplete identity. It is persisted, hidden and marked sensitive, not a recalculating App formula. Later identity corrections require an explicit coordinated reconciliation/rekey. No canonical identity values are recorded here.
- Added Interactions, read-only HistoricalCaseIndex, and ExportSelections as app tables. ServiceEpisodes remains a source tab, not an added app table; episode values are preserved text links.
- **New Contact** on clients and **New Contact from Case** open an add-only Interactions form with exactly **Method, Staff member, Notes**, in that order. ContactDate initializes automatically with NOW(), is hidden in the form, and is displayed in saved history. Methods: Call, Text, Voicemail, In person, Email. Staff uses the established roster; StaffName is stored separately because no authoritative name/email mapping exists. StaffEmail remains optional and hidden.
- Contact history displays newest first, with timestamp, staff, method and notes. Included in general and Research client details, Intake and Graveyard client details, general case details, and Request/Follow Up details. Research case auto-details also display it. Case entries are client-level contacts, not case-specific legal records.
- Both physical Client/Case ContactLog fields are preserved, read-only, and labeled **Legacy Contact Log**. Other historical notes are preserved. Internal Related ExportSelections is hidden from staff details.
- Existing 20 status rules target actual ClientStatus/CaseStatus cells; optional format pictograms were cleared in the earlier saved update. Added a blue-grey rule covering Sent Form, No Response - NPC and Just Browsing, bringing all 13 client and 10 case valid statuses under formatting. Native AppSheet color dots remain; their size was not changed.

## Draft export behavior

- **Add to Export** is case-scoped and creates an ExportSelections record for the signed-in staff member and CaseNumber. A deterministic staff/case selection key prevents adding the same active selection twice.
- The action requires Ready to Refer, eligible, verified research, no private attorney, a participating jurisdiction, no request date, and no known prior recall. It blocks known submission/research flags and HistoricalCaseIndex records marked CONFIRMED SUBMITTED or UNKNOWN - VERIFY for that CaseNumber. Matching is conservative by docket number across courts because legacy court aliases are not yet fully reconciled.
- **Remove Export Selection** removes only that staff member's unbatched selection while RequestSentDate is blank. It does not delete the case or alter its status.
- **Export Queue** is grouped by jurisdiction and includes only that staff member's eligible unbatched selections. **Export Draft CSV** uses AppSheet's native CSV export. Related contact/export reference lists and technical keys are excluded from the export slice.
- Selection, CSV generation and removal do not populate RequestSentDate, send a court request, notify a client, or advance a case.

## Verified with fictional records

| Check | Observed result |
| --- | --- |
| Zero-case visibility and first case | Zero-case fixture was visible before case creation; Add Case worked. |
| Three independent research rows | One full-name group contains three individually clickable cases. |
| Prefilled links persist | A second Add Case test persisted the correct existing client and current episode without staff choosing them. |
| Independent case edits | DEMO-ENTRY-203 became Ready to Refer; sibling DEMO-ENTRY-204 stayed Check Cases. |
| New contact persistence | One new Interactions row contains an automatic timestamp, Call, Mason, notes, and correct client/episode references; visible in client and case history. |
| Contact form after final save | Exactly Method, Staff member, Notes; no extra date picker. Opened for verification and cancelled without another contact. |
| Case-only export selection | Only DEMO-ENTRY-203 entered the queue; Add to Export disappeared and Remove Export Selection appeared. |
| Draft CSV | Download succeeded with one selected case; headers contain no ClientID, CaseID, EpisodeID, CaseKey or related-list reference columns. Native export includes 40 named fields plus a trailing blank CSV field. |
| Reversible draft | Remove Export Selection emptied both source selections and live queue; Export Draft CSV disappeared. Case remains Ready to Refer with blank request date. |
| Migration integrity after tests | 12 unique clients, 20 unique/nonblank CaseNumbers, 13 episodes, 9 interactions; zero orphan client references or episode/client mismatches. |
| Final reload | Research shows one Name column; Research Cases shows grouped rows; standalone case Add buttons absent from Research Cases/Export Queue; editor save completed. |

Two newly created fictional case rows and one fictional contact remain for review. The zero-case fixture's original narrative still describes its pre-test state; it now has two test cases. One early case creation exposed AppSheet's hidden/non-editable-prefill issue: its blank client link was explicitly repaired, the schema setting was corrected, and a second creation verified automatic persistence. No records are claimed as real client interactions or submissions.

## Remaining limits and operational work

1. Production mailbox/Jotform adapter, operational graveyard history, individual account/access cutover, and deployment remain unconnected. Existing production scripts were not changed.
2. This is a reversible **draft CSV** workflow. Court-specific final report templates, actual transmission receipts, batch finalization and an immutable one-request-ever submission ledger are not implemented. The historical guards use only the connected fictional prototype index, not authoritative production history.
3. App actions and slice filters are not enforcement for direct Sheet/API writes. Production request-date, notification-evidence, immutable-history and duplicate-submission validation still need to cover every write path.
4. Existing phase formulas were preserved. A research sibling keeps its client in Research, so a Ready to Refer sibling can be selected for the independent Export Queue but may remain outside the primary Request slice until the client's existing stage gate clears.
5. Identity migration checked the current populated fictional data. Cross-system normalization, alias/full-middle-name review, new identical-name/DOB collisions, missing-DOB reconciliation and transactional identity correction need an operational process. No automatic identity-match decision or separate recalculating fingerprint was added.
6. Existing legal case numbers are unique in this prototype; production cross-court/episode uniqueness must be rechecked before using CaseNumber as a production key. Never invent a docket number to resolve a collision.
7. All valid status conditions have formatting rules, and representative colors were visually verified. An exhaustive final record-by-record rendering test of every allowed status in every phase was not performed.
8. Primary Service Other still needs its conditional explanation field from earlier work. Timestamp NOW() is initialized when the contact form is created, rather than a trusted server commit-time audit timestamp.

No court request, client notification, new sharing permission, account cutover, or deployment occurred.
