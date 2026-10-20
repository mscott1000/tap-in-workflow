# Workflow fields and automatic phases
Verified in the existing AppSheet app through 2026-10-20.

## Verified status availability and multi-court test — 2026-10-20

The saved AppSheet configuration now separates what staff may choose from what each queue displays:

| Staff edit context | Status choices | Queue membership |
| --- | --- | --- |
| Phase 1 Intake client | Sent Form; No Response - NPC; Just Browsing; all ten shared workflow statuses | Sent Form; No Response - NPC; Just Browsing |
| Phase 2 Research client | The ten shared workflow statuses | Check Cases; Need to Contact |
| Phase 3 Request case | The ten shared workflow statuses | Ready to Refer |
| Phase 4 Follow Up case | The ten shared workflow statuses | Decision in Progress; Follow Up - Approved; Follow Up - Denied |
| Phase 5 Graveyard client | The ten shared workflow statuses | Complete - Approved; Complete - Denied; Complete - Referred to City TIC; Complete - Ineligible |

The ten shared statuses are Check Cases, Need to Contact, Ready to Refer, Decision in Progress, Follow Up - Approved, Follow Up - Denied, Complete - Approved, Complete - Denied, Complete - Referred to City TIC, and Complete - Ineligible. The lists are saved as restricted dropdowns; arbitrary other values and auto-completion are disabled. Phase remains hidden, and the existing status-derived formulas move a record after staff saves a new status.

All client and case status format rules retain their configured text colors and have no pictogram icon selected. Live verification confirmed light-red `Need to Contact` text without the old car/cubes pictogram. AppSheet retains its native small color swatch beside color-formatted cells; that swatch is the preserved color indicator rather than a selected format-rule icon.

A new fictional test client, `Taylor Q Example`, is linked to three fictional cases in different jurisdictions. `DEMO-MULTI-CITY-001` is Ready to Refer in City of St. Louis Municipal and appears in Request. `DEMO-MULTI-FLORISSANT-002` is Decision in Progress in Florissant, while `DEMO-MULTI-COUNTY-003` is Follow Up - Approved in St. Louis County Circuit; both appear independently in Follow Up. The same `ClientID` and current `EpisodeID` link all three records, proving that phase movement is per case while identity remains shared. All test text is explicitly marked fictional.

## Authoritative staff-interface configuration — 2026-10-20

This section supersedes older field-order, phase-visibility, status-menu, quick-edit, and validation descriptions later in this file. The five existing views, source tables, IDs, relationships, and automatic phase formulas were retained.

### Status editing and phase movement

Status is displayed as ordinary text in a client or case detail. A staff member must choose **Edit** before the status becomes a dropdown. The dropdown is required. Research and later phases expose the same ten shared workflow choices; Intake adds Sent Form, No Response - NPC, and Just Browsing:

1. Check Cases
2. Need to Contact
3. Ready to Refer
4. Decision in Progress
5. Follow Up - Approved
6. Follow Up - Denied
7. Complete - Approved
8. Complete - Denied
9. Complete - Referred to City TIC
10. Complete - Ineligible

The saved status remains the phase trigger:

| Status | Resulting queue |
| --- | --- |
| Check Cases; Need to Contact | Phase 2 — Research |
| Ready to Refer | Phase 3 — Request |
| Decision in Progress; Follow Up - Approved; Follow Up - Denied | Phase 4 — Follow Up |
| Complete - Approved; Complete - Denied; Complete - Referred to City TIC; Complete - Ineligible | Phase 5 — Graveyard after all current-episode cases are terminal |

Legacy intake-only client statuses (Sent Form, No Response - NPC, and Just Browsing) continue to hold a client in Phase 1. The technical phase value is hidden in rows, details, and edit forms. Staff change the recorded status and save; the existing formulas recalculate queue membership. Cases remain independent children of the same client, so siblings can occupy Request and Follow Up simultaneously while the client exists in only the combined Phase 3/4 stage.

### Status colors

| Status | Saved color |
| --- | --- |
| Check Cases | Purple — #7E57C2 |
| Need to Contact | Light red — #EF9A9A |
| Ready to Refer | Light green — #81C784 |
| Decision in Progress | Light blue — #64B5F6 |
| Follow Up - Approved | Gold/dark yellow — #C9A227 |
| Follow Up - Denied | Light yellow — #FFF176 |
| Complete - Approved | Dark green — #2E7D32 |
| Complete - Denied | Dark grey — #616161 |
| Complete - Referred to City TIC | Dark blue — #1565C0 |
| Complete - Ineligible | Light grey — #BDBDBD |

Twenty format rules target the status columns specifically: one client rule and one case rule per status. Live verification confirmed the expected RGB styling for Ready to Refer and Need to Contact.

### Verified fields and layouts

- All five detail views use the side-by-side desktop layout.
- **TIC Staff** is a fixed dropdown in this order: Anna, Dylan, Kyle, Mason, Miranda, Tanya, None.
- **Eligible - Notes** and **Ineligible - Notes** are multiline LongText inputs.
- **Contact Log** is available in the requested phase tables and edit forms.
- **Middle** is present after Last Name in Intake and Research.
- Research excludes Primary Service, Date Form Submitted, ConsentToRequest, and AddressConfirmed from its staff edit form.
- Request begins with: Status, Case #, Name, Contact Log, Jurisdiction. It is grouped by Court/Jurisdiction and excludes Research Status, Eligible, ResearchNotes, Notification Notes, and the redundant Client column.
- Follow Up excludes Prior TIC Recall?. **Warrant Recalled?** is a required dropdown with Yes, No, N/A, Pending.
- Graveyard uses this table and form sequence: TIC Week; First Name; Last Name; Middle; Contact Log; DOB; Eligible Cases; Ineligible Cases; Phone Number; Mailing Address; City; State; Zip Code; Email Address; Court Date Obtained; Primary Contact Method; Contact History; Notes; Online Form?; Location; Race; Gender; Referral Source. Online Form? is Yes/No, Court Date Obtained is a date input, and Notes is editable multiline text.
- Technical IDs, the standalone computed-name field, and phase fields remain hidden. Names shown to staff are recognizable display values; hidden ClientID continues to provide the durable relationship key.
- Contact/map action icons and map features remain absent from these staff layouts.

### Verification performed

All checks used existing fictional records. Forms were opened to inspect control types, choices, required/clear behavior, and field order, then canceled; the records were not modified. The Request queue was verified grouped by jurisdiction with the required first five columns. Follow Up's Warrant Recalled? options and Graveyard's complete field order were verified live. AppSheet reported no configuration warnings after save.

### Remaining operational work

- Connect and validate the future operational mailbox/Jotform intake adapter under the final organizational Google account.
- Connect the historical Graveyard source and previous-record checker with conservative identity matching and explicit review states.
- Re-test and enforce evidence/date requirements for every status transition, including direct Sheet/API imports. The interface now uses Edit forms rather than quick-edit status controls, but AppSheet UI validation alone does not protect external writers.
- Implement an immutable interaction/audit trail, controlled court-request submission, notification evidence, and production permissions.
- Finish conditional free text for Primary Service = Other wherever that field remains operationally applicable.

No sensitive client data, credentials, or operational records are documented here.

## Current saved workflow — 2026-10-19

This section supersedes the older menus, phase visibility, Request grouping, and Graveyard field list below. See [the handoff](APPSHEET_WORK_HANDOFF.md#current-verified-configuration--2026-10-19) for the staff-app verification and remaining integration work.

| Scope | Current behavior |
| --- | --- |
| Client stage | Only Intake, Research, combined Request/Follow Up, or Graveyard at one time. A current-episode case still in Check Cases/Need to Contact holds the client in Research; after research, sibling cases can split between Request and Follow Up. All current cases terminal moves the client to Graveyard. |
| Client statuses | Sent Form, No Response - NPC, Just Browsing for Intake; Check Cases and Need to Contact for Research, with Ready to Refer as the handoff. Historical Kiddie Pool, Deep Dive, Pool Rules aliases remain in the stage formula for migration, but are absent from new menus. |
| Case Status | One dropdown in each case detail exposes Check Cases, Need to Contact, Ready to Refer, Decision in Progress, Follow Up - Approved, Follow Up - Denied, Complete - Approved, Complete - Denied, Complete - Referred to City TIC, Complete - Ineligible. Status sets the per-case phase, and a test case moved 3→4→3 after two saved changes. |
| Case court | `Cases.Court` is the Jurisdiction dropdown with the nine court names in the current handoff. Request rows group by Court. |
| Hidden technical fields | Phase calculations, client/case IDs, and standalone `_ComputedName` are hidden from staff rows/details. `ClientID` still uses `UNIQUEID()` as the initial value for AppSheet-created clients; `_ComputedName` still labels references internally. |
| Other UI changes | Prior TIC Client? is now Prior Client?, and binary client/case choices display No/Yes. ConsentToRequest and AddressConfirmed are hidden and removed from the Ready to Refer gate. Date Form Submitted is absent from the Research expanded detail but remains in its table/edit workflow. Case detail layout is side-by-side. |
| Graveyard | The exact 22-column order and alias/source mapping are in the current handoff. New source fields are blank in the fictional records unless an existing field is mirrored. |

**Validation finding:** The case detail quick-edit dropdown permitted Decision in Progress with a blank RequestSentDate. The fictional test case was restored to Ready to Refer. The older statement that every such transition is date-gated is superseded for this path. Add an enforced transition rule/action before operational use, and test the quick-edit path and direct imports. The live mailbox and historical graveyard source remain unconnected; no sensitive operational records were added.

## Saved display update — 2026-10-19

The live app's five existing views were retained. The staff-facing column titles and ordering now follow the 2026-10-19 section of [the handoff](APPSHEET_WORK_HANDOFF.md). Intake and Research show separate First Name and Last Name fields; Request and Follow Up show a single linked Name, and their expanded case files show client fields from read-only reference expressions. Phase is shown in Intake's listing and only in the expanded file for Research, Request and Follow Up. The technical IDs and standalone computed name are not displayed in those layouts. Phone, email and address display as text columns without generated contact/map actions. The ten Primary Service choices were verified in the edit form; the conditional free-text field for Other remains to implement.

Research's primary table is one row per client. Its Related Cases inline table provides the per-case data in the expanded client file, so case fields cannot each be represented as separate columns of a single client row when the client has multiple cases. ClientID is still a hidden stable key generated by UNIQUEID() on AppSheet creation; seeded fictional IDs are explicit. Phase movement continues to follow the saved status/evidence rules below. No fictional record was changed in this display update.

## Verified phase menus and file order — 2026-10-18

The final tables in the original staff workflow govern these choices. An edit menu includes a current status and relevant forward statuses so a staff member can make the transition by recording the event and saving. Other phases' statuses are not offered.

| File / current phase | Choices available | Ordered fields in the record |
| --- | --- | --- |
| Intake client (1) | Sent Form; No Response - NPC; Just Browsing; Kiddie Pool for completed intake; Complete - Ineligible if no open current case | ClientStatus, FirstContactDate, FirstName, LastName, MiddleName, DOB, Phone, Email, TICStaff, PriorTICClient, PriorTICClientReason, Log, DateFormSubmitted, WorkflowStage |
| Research client (2) | Kiddie Pool; Pool Rules; Deep Dive; Ready to Refer when intake, consent, address and all current-case research pass the gate; Complete - Ineligible if no open current case | ClientStatus, TICWeek, FirstName, LastName, MiddleName, DOB, Phone, Address, Email, PrimaryService, TICStaff, EligibleNotes, IneligibleNotes, PriorTICClient, PriorTICClientReason, Related Cases (detail only), ReferToTBP, ReferToHolland, DateFormSubmitted, ConsentToRequest, AddressConfirmed, Log, WorkflowStage |
| Request case (3) | Ready to Refer; Decision in Progress; Complete - Referred to City TIC | CaseStatus, Client (reference), CaseNumber, Court, ReasonMissingCourtCategory, ReasonMissingCourtText, NumberOfCounts, ChargeType, ChargeClass, ChargeText, ChargeCategory, BondAmount, AttorneyStatus, AttorneyName, Division, WarrantIssueDate, PriorTICRecall, RequestSentDate, ClientNotifiedDate, NotificationMethod, NotificationNotes, CaseLink, CasePhase |
| Follow Up case (4) | Decision in Progress; Follow Up - Approved; Follow Up - Denied; Complete - Approved; Complete - Denied | Request case identity/reason/charge/attorney fields, then PAOnCall, PAConsent, WarrantRecalled, NextCourtDate, RequestSentDate, ClientNotifiedDate, NotificationMethod, NotificationNotes, CaseLink, CasePhase |
| Graveyard client (5) | Complete - Approved; Complete - Denied; Complete - Referred to City TIC; Complete - Ineligible | Status first, then existing historical client/contact/service fields and Related Cases. The source has no separate Phase 5 ordering table. |

Name components are editable in the client file, while the **Name** queue column and linked references show a single full-name label. The virtual `_ComputedName` is still the internal label expression but is excluded as a duplicate standalone file field. `ClientID` is the hidden stable key; its initial value is `UNIQUEID()` for AppSheet-created clients. Seeded demo IDs are explicit and remain unchanged. `CaseID` and `CaseKey` are also hidden; CaseNumber labels case files. This avoids displaying technical identifiers without breaking client–case links.

The standard Cases detail/form also keeps ResearchStatus, Eligible and ResearchNotes between PriorTICRecall and PAOnCall for Phase 2 research. The Phase 3 and Phase 4 files omit those research-only fields in their explicit ordering. DateFormSubmitted is required for active Research/Request client statuses, and direct first-contact Complete - Ineligible does not demand a fictitious intake date. RequestSentDate is required on a sent request; ClientNotifiedDate is required for terminal cases.

The menus and representative detail/form order were checked in the saved staff app with fictional records in every phase. A Quinn case moved 3→4 only after RequestSentDate was entered; its original Ready to Refer status, blank date and Phase 3 were then restored and synced. The final five queues match the handoff. These are AppSheet UI validations; direct Sheet/API imports must independently enforce the same rules.

## Source and interpretation
The user's original five-phase staff workflow / Jotform transition document was read in full and used for field selection and status names. The newer requirement for one durable client with independent cases supersedes the original proposal to duplicate/delete form rows by court. One sentence in the original document calls Ready to Refer “Phase 5”; its Phase 3 section and overall workflow identify this as Request. This implementation treats Ready to Refer as Phase 3.

**Sending the request moves the case to Phase 4 (Decision in Progress).** Recording approval/denial is a further Phase 4 update. Earlier repository proposals that kept sent requests in Phase 3 until a court response are superseded.

No replacement application, operational mailbox/history connection, public deployment, or sharing change was made. All tests used fictional data.

## Fields installed and regenerated
All existing columns and five views remain. Clients has 29 physical columns (A:AC); Cases has 33 (A:AG). Both AppSheet table schemas were regenerated.

| Scope / phase | Available fields |
| --- | --- |
| Client identity, all phases | ClientID; FirstName; LastName; MiddleName; DOB; Phone; Email; Address. Existing computed full-name label and Related Cases retained. |
| Phase 1 first contact | ClientStatus; TICWeek; FirstContactDate; TICStaff; PriorTICClient; PriorTICClientReason; Log |
| Phase 2 intake / research | PrimaryService; EligibleNotes; IneligibleNotes; DateFormSubmitted; Race; Gender; Location; ReferralSource; ReferToTBP; ReferToHolland; ConsentToRequest; AddressConfirmed, plus the identity/contact/log fields |
| Per-case research, Phases 2/3 | CaseID; ClientID; EpisodeID; Court; CaseNumber; CaseKey; AttorneyStatus; ResearchStatus; Eligible; ResearchNotes; CaseStatus; ReasonMissingCourtCategory; ReasonMissingCourtText; NumberOfCounts; ChargeType; ChargeClass; ChargeText; ChargeCategory; BondAmount; AttorneyName; Division; WarrantIssueDate; PriorTICRecall; CaseLink |
| Phase 4 court request / response | RequestSentDate; PAOnCall; PAConsent; WarrantRecalled; NextCourtDate; CaseStatus |
| Completion / Phase 5 | ClientNotifiedDate; NotificationMethod; NotificationNotes; terminal CaseStatus; client Log and explicit terminal ClientStatus for a zero-case service |
| Internal workflow | Clients.CurrentEpisodeID; Clients.WorkflowStage (virtual); existing Clients.ClientStage (now hidden and derived); existing Cases.CasePhase (derived and read-only) |

Client and case forms expose these fields for their appropriate work; a queue's compact table/card is not the complete record. Intake's table shows recognizable name, DOB/contact actions, status, first-contact date, staff, prior-client information, log and calculated phase. Research uses an ordered table with status, TIC week, one Name column and contact/service fields. Request and Follow Up remain case tables grouped by ClientID, using client names. CaseStatus is first in both tables. Follow Up also displays warrant result, next court date, sent date, notification date/method. Full fields remain in detail/edit forms.

ClientStatus and CaseStatus use AppSheet list validation for selectable statuses. ConsentToRequest and AddressConfirmed offer Yes / No / Pending. Other categorical fields have source Sheet dropdown validation; many remain AppSheet Text inputs. Prior-client/prior-recall fields are presently Yes/No in AppSheet; they are not an authoritative submission-history check. Demographic fields do not drive eligibility.

## What staff save to trigger a phase change
Open a client or case, choose **Edit**, record the work actually done, select its status, then **Save**. Saving recalculates queue membership. Sync brings the result to other users. Free-text notes alone do not advance phases.

| Work completed | Staff record | Result |
| --- | --- | --- |
| First contact, intake outstanding | ClientStatus = Sent Form, No Response - NPC, or Just Browsing; contact/log fields | Phase 1 Intake |
| Intake completed or fully entered by staff | DateFormSubmitted and ClientStatus = Kiddie Pool | Client leaves Intake for Phase 2 Research |
| Client confirmation / detailed research | ClientStatus = Pool Rules or Deep Dive; update linked case research | Remains Phase 2 |
| Each case researched | Appropriate case fields; CaseStatus = Ready to Refer for cases ready for request, or a communicated terminal disposition for ineligible cases | Case is ready, but client remains Research until client-level readiness is saved |
| All current cases ready, client contacted, consent/address confirmed | ConsentToRequest = Yes; AddressConfirmed = Yes; completed intake date; ClientStatus = Ready to Refer | Client leaves Research; ready current cases appear in Phase 3 Request |
| Actual request sent through the separate court-report process | CaseStatus = Decision in Progress and RequestSentDate | Only that case moves to Phase 4 Follow Up |
| Court response received | CaseStatus = Follow Up - Approved or Follow Up - Denied; PA/recall/new-court-date fields and log | Remains Phase 4 until client informed |
| Outcome/explanation actually communicated | ClientNotifiedDate, NotificationMethod, NotificationNotes; CaseStatus = Complete - Approved, Complete - Denied, Complete - Referred to City TIC, or Complete - Ineligible | Case leaves active queues. Other unfinished cases stay active. |
| Last current case completed | Complete that final case as above | Whole client moves to Graveyard automatically |
| Research produces no eligible cases / no cases | Explain outcome/referrals; record client Log; set an appropriate Complete status on the client | Explicit no-case closure to Graveyard; no fake request needed |

To reach case work from Research, open the client and use **Related Cases > Add** or open an existing linked case. To edit client-level confirmation from a Request/Follow Up case, use **View Ref (ClientID)**.

### Installed validation and defaults
- ClientStatus is required. Intake Add defaults to Sent Form; other client forms, including Research Add, default to Kiddie Pool:
  `IF(CONTEXT("View") = "Phase1_Clients_Form", "Sent Form", "Kiddie Pool")`.
- DateFormSubmitted is required for Kiddie Pool, Pool Rules, Deep Dive and Ready to Refer. It starts blank; direct no-services Complete - Ineligible from Intake does not require a fabricated date.
- Ready to Refer is offered on the client only when DateFormSubmitted exists, consent/address are Yes, at least one current case exists, and no current case is Kiddie Pool / Pool Rules / Deep Dive.
- Client Complete choices are withheld while any current case lacks a Complete status.
- New cases default to Deep Dive. RequestSentDate is required for Decision in Progress / Follow Up - Approved / Follow Up - Denied.
- ClientNotifiedDate is required for every Complete case status, including ineligible/referral dispositions. Method and notes are available and should be recorded; they are not yet conditionally required.
- DOB, WarrantIssueDate, NextCourtDate, RequestSentDate, ClientNotifiedDate and intake completion date start blank rather than manufacturing today's date. FirstContactDate / TICWeek retain date defaults.
- New clients get CurrentEpisodeID = UNIQUEID(). New cases get EpisodeID = [ClientID].[CurrentEpisodeID]. Episode identifiers are hidden from normal forms.
- ClientStage is hidden and has app formula [WorkflowStage]. It is a legacy physical mirror, not the queue authority: child-only changes can leave its Sheet value stale until the client is updated. Do not use it in integrations as the live phase.
- CasePhase is read-only and calculated from CaseStatus. Queues use CaseStatus directly, so they do not depend on an old cached CasePhase value.

## Exact queue rules
Client slices:
```appsheet
-- Phase1_Clients
[WorkflowStage] = "Phase 1"
-- Phase2_Clients
[WorkflowStage] = "Phase 2"
-- Phase5_Clients
[WorkflowStage] = "Phase 5"
```

Case slices:
```appsheet
-- Phase3_Cases
AND(
  [ClientID].[WorkflowStage] = "Phase 3/4",
  [EpisodeID] = [ClientID].[CurrentEpisodeID],
  [CaseStatus] = "Ready to Refer"
)
-- Phase4_Cases
AND(
  [ClientID].[WorkflowStage] = "Phase 3/4",
  [EpisodeID] = [ClientID].[CurrentEpisodeID],
  IN([CaseStatus], LIST(
    "Decision in Progress", "Follow Up - Approved", "Follow Up - Denied"
  ))
)
```

Cases.CasePhase app formula:
```appsheet
IFS(
  STARTSWITH([CaseStatus], "Complete -"), "Phase 5",
  IN([CaseStatus], LIST(
    "Decision in Progress", "Follow Up - Approved", "Follow Up - Denied"
  )), "Phase 4",
  [CaseStatus] = "Ready to Refer", "Phase 3",
  TRUE, "Phase 2"
)
```

Clients.WorkflowStage virtual app formula:
```appsheet
IFS(
  IN([ClientStatus], LIST("Sent Form", "No Response - NPC", "Just Browsing")), "Phase 1",
  IN([ClientStatus], LIST("Kiddie Pool", "Pool Rules", "Deep Dive")), "Phase 2",
  AND(
    COUNT(SELECT(Cases[CaseID], AND(
      [ClientID] = [_THISROW].[ClientID],
      [EpisodeID] = [_THISROW].[CurrentEpisodeID]
    ))) > 0,
    COUNT(SELECT(Cases[CaseID], AND(
      [ClientID] = [_THISROW].[ClientID],
      [EpisodeID] = [_THISROW].[CurrentEpisodeID],
      NOT(STARTSWITH([CaseStatus], "Complete -"))
    ))) = 0
  ), "Phase 5",
  AND(
    STARTSWITH([ClientStatus], "Complete -"),
    COUNT(SELECT(Cases[CaseID], AND(
      [ClientID] = [_THISROW].[ClientID],
      [EpisodeID] = [_THISROW].[CurrentEpisodeID],
      NOT(STARTSWITH([CaseStatus], "Complete -"))
    ))) = 0
  ), "Phase 5",
  COUNT(SELECT(Cases[CaseID], AND(
    [ClientID] = [_THISROW].[ClientID],
    [EpisodeID] = [_THISROW].[CurrentEpisodeID],
    IN([CaseStatus], LIST("Kiddie Pool", "Pool Rules", "Deep Dive"))
  ))) > 0, "Phase 2",
  OR(
    [ClientStatus] = "Ready to Refer",
    STARTSWITH([ClientStatus], "Complete -")
  ), "Phase 3/4",
  TRUE, "Phase 1"
)
```

The virtual client calculation handles child-case saves without requiring a separate client edit. It has one exclusive client result: Phase 1, Phase 2, Phase 3/4, or Phase 5. Only Phase 3/4 can yield two primary queues. CurrentEpisodeID scopes case queues and completion; old case history stays linked but cannot prematurely complete/block the current episode. ServiceEpisodes is still a separate workbook tab, not an AppSheet table or current phase controller; generated episode tokens do not yet create episode audit rows.

## Verified tests in the saved app
1. Intake Add: Sent Form / Phase 1, blank DOB and completion date; canceled. Research Add: Kiddie Pool / Phase 2, blank completion date; canceled.
2. Casey: Kiddie Pool without DateFormSubmitted failed “This entry is required.” Adding the date and saving removed Casey from Intake and placed the same ClientID in Research.
3. Jordan: after preparing both fictional cases as researched/ready, client Ready to Refer became available with consent/address Yes. Saving removed Jordan from Research and displayed both cases in Request. Restored Deep Dive and the uncertain sibling case.
4. Quinn: Decision in Progress without RequestSentDate failed required validation. Adding the date and saving moved that case from Request to Follow Up, with calculated CasePhase 4.
5. Alex: Complete - Denied without ClientNotifiedDate failed. Completing that case with date/method/notes left the sibling Ready to Refer request unchanged. Alex was absent from Graveyard; client Complete statuses were not offered.
6. Completing Alex's final case via the ineligible/explanation path moved the whole client to Graveyard automatically. Restored both cases to the split Phase 3/4 scenario afterward.
7. Riley, initially no cases: stayed Research until explicit Complete - Ineligible plus log explanation; then appeared in Graveyard. Ready to Refer was not offered. Restored Research afterward.
8. Added DEMO-CS106 through Riley's Related Cases form: default Deep Dive / Phase 2; blank evidence dates. Verified the actual new Sheet row has ClientID DEMO-C102 and EpisodeID DEMO-E102. Retained as the Research example.
9. Restored all temporary changes, synced and inspected all five queues; original client and case keys retained.

## Remaining work before operational use
- Future mailbox/Jotform adapter is not installed. It must map completed intake to ClientStatus Kiddie Pool, supply CurrentEpisodeID and completion date, use stable import receipts, resolve identities conservatively, and not regress active clients. Programmatic Sheet writers must supply/validate required fields themselves; UI Valid_If and initial values do not guard direct API writes.
- Operational graveyard and previous-record checker are still unconnected. Distinguish confirmed submission, research only, unknown. PriorTICRecall is not a submission ledger; no concurrency-safe one-submission-per-case enforcement exists.
- Statuses are explicit staff assertions. Choosing Decision in Progress sends no report; choosing Complete sends no message and does not prove a court outcome. Actual sending, delivery verification, immutable timestamps/staff audit and controlled report submission remain separate work.
- Eligibility, participating courts, private-attorney exclusion and verified historical submission must be checked before any actual request. A Ready status does not itself enforce all of those rules.
- Structured Interactions remains a workbook-only table; client Log / notification fields are available, but per-interaction audit forms, immutable change history and notification evidence remain to implement.
- Review binary prior-client/prior-recall and Eligible inputs for explicit unknown/review states, required fields by service/court, and all original categorical options before real-data rollout. The original uncertain Eligible = REVIEW fixture is not a proper tri-state AppSheet type.
- Reopening a returning client needs a guided episode action and archive/history records; do not overwrite a current episode by a repeated intake.
- No bots, actual messaging, court report transmission, external-event add-on, operational account transfer or deployment were added. Review ownership, individual staff identity and permissions before cutover.
