# Tap In Center — AppSheet proof of concept: Work handoff
_Last updated: 2026-10-19. The latest verified configuration below is authoritative; historical sections are retained for context._




## Current verified configuration — 2026-10-19

This section supersedes older status-menu, phase-visibility, grouping, binary-choice, and Graveyard-layout descriptions below. The existing app, connected spreadsheet, five primary views, client/case keys, and fictional demonstration records were retained.

- **Phase and identity:** `Clients.WorkflowStage`, `Clients.ClientStage`, and `Cases.CasePhase` remain internal calculations and are hidden from staff rows and details. `_ComputedName` remains the internal full-name label for readable client references but has no standalone staff field. `ClientID` remains the hidden stable key; AppSheet creates it once with `UNIQUEID()` for a new client (the fictional `DEMO-...` keys were seeded). A client occupies one of Intake, Research, the combined Request/Follow Up stage, or Graveyard. Its current-episode cases can independently occupy Request or Follow Up; an unfinished Research case keeps that client in Research. All current-episode cases must be terminal for Graveyard.
- **Client and case statuses:** Intake choices remain Sent Form, No Response - NPC, Just Browsing. Research uses **Check Cases** and **Need to Contact** in place of Kiddie Pool/Deep Dive and Pool Rules. The legacy values remain only as migration aliases in the phase calculation. All case detail status dropdowns offer Check Cases; Need to Contact; Ready to Refer; Decision in Progress; Follow Up - Approved; Follow Up - Denied; Complete - Approved; Complete - Denied; Complete - Referred to City TIC; Complete - Ineligible. Changing an individual case status recalculates its phase; Request means Ready to Refer, while Decision in Progress and Follow Up outcomes enter Follow Up. The existing sheet's status validation and fictional rows were updated to the new labels.
- **Visibility and choices:** `PriorTICClient` is displayed as **Prior Client?** with **No/Yes** choices. The other Yes/No fields used in the client and case files also display No/Yes rather than N/Y. `ConsentToRequest` and `AddressConfirmed` are hidden from staff interfaces and no longer gate the client Ready to Refer choice. Date Form Submitted remains in the Research table/edit workflow but was removed from the expanded Research detail. Phone, email, and address remain text columns, without call/message/map UI actions. Jurisdiction (`Cases.Court`) is a dropdown limited to St. Louis County Circuit; St. Louis City Circuit; City of St. Louis Municipal; Florissant; Kirkwood; Manchester; Richmond Heights; University City; Webster Groves. The fictional cases' court names and case-key court prefixes were normalized to these values.
- **Case views:** Request is grouped by Court/Jurisdiction (verified with the fictional Florissant group). Case details in the general, Request, and Follow Up detail views use side-by-side layout and provide a quick-edit Status dropdown. The fictional case `DEMO-CS101` was changed Ready to Refer → Decision in Progress; the synced source row showed Phase 4 and it appeared in Follow Up. It was then restored to Ready to Refer; the synced source row showed Phase 3 again. Other cases for the same client were not moved.
- **Graveyard:** The staff table now has exactly this column order: TIC Week, First Name, Last Name, Middle, DOB, Eligible Cases, Ineligible Cases, Phone Number, Mailing Address, City, State, Zip Code, Email Address, Court Date Obtained, Primary Contact Method, Contact History, Notes, Online Form?, Location, Race, Gender, Referral Source. New physical client columns provide the previously absent fields. Phone Number, Mailing Address, Email Address, and Notes are physical formula-backed aliases of the existing contact/log columns, so existing fictional rows display their values without duplicating entry. Other new fields are blank until staff or a future operational import supplies them. The schema was regenerated and all 22 headings verified in the staff Graveyard view.

**Known validation gap:** AppSheet quick-editing Case Status to Decision in Progress succeeded on a fictional case even though `RequestSentDate` was blank. Earlier handoff language claiming this transition always requires a request date is therefore incorrect for this quick-edit path. The test change was reverted. Before relying on the app for operational case work, enforce the date condition on the status update path or replace quick edit with a validated transition action/form, then repeat the test. Direct Sheet/API writes also require their own validation.

**Remaining integration:** The production intake mailbox/form source and prior-record/graveyard history source are not connected. Keep using fictional data until the future account and access design are settled. The Primary Service “Other” choice still lacks a conditional free-text explanation field. Review the new Graveyard fields and backfill/import mapping when operational data is available.

## Verified display and field-layout update — 2026-10-19

The existing AppSheet app and its five primary navigation views remain in place. Saved editor changes were reloaded and checked in the staff app with fictional records. This section supersedes the 2026-10-18 **visible layout** descriptions below; the phase/status rules there still apply.

- **Intake (Phase 1)** table order: Status, Initial Contact, First Name, Last Name, DOB, Phone #, Email, TIC Staff, Prior TIC Client?, Log, Phase. Its expanded client file has the same relevant client fields and Log, with Phase omitted. PriorTICClientReason, MiddleName and the standalone computed-name display were removed from this phase's layouts. Date Form Submitted remains available in the edit/detail flow to trigger Research.
- **Research (Phase 2)** table order: Status, TIC Week, First Name, Last Name, DOB, Phone #, Address, Email, Primary Service, TIC Staff, Eligible - Notes, Ineligible - Notes, Prior TIC Client?, Prior TIC Client Reason, Related Cases, Refer to TBP?, Refer to Holland?, Date Form Submitted, Log. Phase appears in the expanded detail only. The linked Related Cases table exposes case Status, Case #, Jurisdiction, reason, counts, charges, bond, attorney, division, warrant date, prior recall, Case Link and Phase. The primary Research row is still one **client** row, so it cannot show a distinct set of per-case columns for each of multiple child cases; open Related Cases for those fields. ConsentToRequest and AddressConfirmed remain in the edit form for the readiness gate.
- **Request (Phase 3)** table and expanded case file order: Status, TIC Week, Name, DOB, Phone #, Address, Email, Primary Service, TIC Staff, Case #, Jurisdiction, Reason Category, Reason for Missing Court, # of Counts, Charge Type, Charge Class, Charge Text, Charge Category, Bond Amount, Attorney Status, Attorney Name, Division, Warrant Issue Date, Prior TIC Recall?, Refer to TBP?, Refer to Holland?, Log, Case Link. Phase is in the expanded file only. Client details are read-only references to the one linked client; cases remain independently editable.
- **Follow Up (Phase 4)** has the same identity, reason, charge and attorney order, then Prior TIC Recall?, Refer to TBP?, PA On Call, PA Consent, Warrant Recalled, Next Court Date, Log, Case Link. Phase is in the expanded file only. Grouping in both case queues is by the client reference, which displays the recognizable name.
- Clients.Phone, Clients.Email and Clients.Address are displayed as text fields, removing generated call/message/map affordances. No map view was added. Technical ClientID and standalone _ComputedName are excluded from these visible layouts; ClientID remains the stable hidden key with AppSheet-created values from UNIQUEID().
- Primary Service is a dropdown with the requested ten values: Case Inquiry; Muni Warrant Recall; Misdemeanor Warrant Recall; Felony Warrant Recall; Refer to City TIC - State Case Warrant Recall; Refer to City TIC - Muni Warrant Recall; No Warrant - Needs NCD; TIC Follow Up; Other Legal Inquiry; Other. The ten values were verified in the staff edit form. **Selecting Other does not yet reveal a separate free-text explanation box.** Add a physical Other-detail field and conditional Show_If when the production schema is extended.
- The source schema has ReasonMissingCourtCategory and ReasonMissingCourtText, shown as Reason Category and Reason for Missing Court. There is no separate third “Reason” column. AttorneyStatus appears as Attorney Status to distinguish it from the workflow Status.

Verification: Intake showed fictional Casey with separate names and no contact icons; Research showed Jordan and Riley and Jordan's two linked cases; Request showed Alex's DEMO-ONLY-SPLIT-104 while Follow Up showed Alex's independent DEMO-ONLY-SPLIT-105, grouped under Alex Parker. Request and Follow Up expanded files showed linked client information and Phase 3/4 respectively. The editor was reloaded after each detail-view save to confirm persistence. The fictional records were inspected without modifying them during this update. The app remains a prototype, not deployed for operational data.

## Latest verified configuration — workflow statuses and file layout (2026-10-18)

The original staff workflow/Jotform-transition document's final phase tables were reread. This section supersedes older field-order and menu descriptions below. The existing app, data keys and five primary views were preserved.

- **Phase 1 Intake:** client choices are Sent Form, No Response - NPC, Just Browsing. Kiddie Pool is a forward choice once intake is actually completed; Complete - Ineligible is offered only when there are no unfinished current cases, including the direct first-contact no-services path. The Phase 1 detail and edit form order is status, first-contact date, first/last/middle name, DOB, phone, email, staff, prior-client flag/reason, log, intake-completion date, calculated phase. The Intake queue shows status, first-contact date, one full-name column, DOB, phone, email, staff, prior-client flag/reason, log, phase.
- **Phase 2 Research:** client choices are Kiddie Pool, Pool Rules, Deep Dive. Ready to Refer appears only with a completed intake date, consent and address confirmation Yes, at least one current case, and no current case left in a research status. Complete - Ineligible is offered only when no current case is unfinished. Client detail/edit begins with status, TIC week, name components, DOB, phone, address, email, primary service, staff, eligibility/ineligibility notes, prior-client flag/reason, followed by linked cases (detail only), referrals to TBP/Holland, intake date, consent, address confirmation, log and calculated phase. The Research table shows status, TIC week, **Name** once, then the corresponding contact/service/decision fields and phase.
- **Phase 3 Request:** case choices are Ready to Refer, Decision in Progress, Complete - Referred to City TIC. Detail/edit begins with case status, named client, case number, court, reason for missed court, counts/charges, bond, attorney, division, warrant/prior-recall, request sent date, client notification date/method/notes, case link, calculated phase. Choosing Decision in Progress requires RequestSentDate and moves only that case to Phase 4.
- **Phase 4 Follow Up:** case choices are Decision in Progress, Follow Up - Approved, Follow Up - Denied, Complete - Approved, Complete - Denied. Its case file uses the same case identity/research order, followed by PA on call/consent, warrant recalled, next court date, request date, client notification fields, case link and phase. Completion requires ClientNotifiedDate. The client reaches Phase 5 only after all current cases are complete.
- **Phase 5 Graveyard:** client choices are Complete - Approved, Complete - Denied, Complete - Referred to City TIC, Complete - Ineligible. The source workflow did not give a separate Phase 5 field-order table, so the existing historical fields and linked cases remain, with status first and the redundant full-name field omitted.
- **Internal IDs and labels:** Clients.ClientID remains the Clients key and has initial value `UNIQUEID()` for new clients created through AppSheet. It is generated once and remains stable; it is not calculated from a person's name, DOB or status. The synthetic `DEMO-C...` IDs were seeded explicitly. ClientID is hidden from client detail/forms and queues; Cases.CaseID and CaseKey are hidden too. The linked case's Client reference displays the recognizable full name, and CaseNumber is its label. The virtual `_ComputedName` expression remains as the full-name label needed for readable references and queue grouping, but its redundant standalone entry was removed from explicit file layouts; the UI calls the one queue column **Name**. Removing the underlying label expression would regress linked names.
- Explicit case and client form/detail ordering was saved in the existing views. Case data live in individually editable linked case files; the client identity/service fields are stored once on the client. No production mailbox or graveyard source was connected.
- Verified in the synced staff app with fictional Casey, Riley, Quinn, Sam and Robin: Phase 1, 2, 3, 4 and 5 menus respectively showed the choices above, including guarded forward choices. Quinn's request required a sent date to transition to Follow Up; that temporary test edit was restored and a final sync again showed Request Alex/Avery/Quinn, Follow Up Alex/Sam/Taylor, Intake Casey, Research Jordan/Riley and Graveyard Robin. No live messages or court requests were sent.

See [Workflow fields and automatic phases](WORKFLOW_FIELDS_AND_AUTOMATIC_PHASES.md) for the detailed field-order and transition rules.

## Latest verified configuration — automatic phases (2026-10-18)

**This section and [Workflow fields and automatic phases](WORKFLOW_FIELDS_AND_AUTOMATIC_PHASES.md) supersede all manual-phase controls and proposed transition rules below.** Older sections are retained as implementation history.

- Read the original staff workflow / Jotform-transition document in full. Added its client intake/contact/research/referral fields and case research/court-response fields, plus explicit request and notification dates/details.
- Updated the existing app in place and regenerated both existing tables: Clients 29 physical columns; Cases 33. All original keys, data tabs and five views retained. No replacement, deployment, sharing change, live mailbox or operational graveyard connection.
- Staff now edit **ClientStatus** or **CaseStatus**, record required evidence fields, and **Save**. Queue membership recalculates automatically; arbitrary note text alone does not advance a record.
- **Clients.WorkflowStage** is a virtual, exclusive client-stage calculation. It considers statuses and current-episode case completion, including child-case saves. **ClientStage is now hidden and derived**, and must not be used as queue authority or assumed current in the Sheet after child-only changes.
- Client slices use WorkflowStage = Phase 1 / Phase 2 / Phase 5. Case slices require client WorkflowStage = Phase 3/4, matching current EpisodeID, and the appropriate CaseStatus.
- Ready to Refer cases → Phase 3 Request. **Decision in Progress / Follow Up - Approved / Follow Up - Denied → Phase 4 Follow Up. Sending a request moves it to Phase 4**, rather than waiting for a court response.
- CasePhase is now derived/read-only. One case's completion leaves sibling cases active; completing the last current case moves the client to Graveyard. Old episodes do not count. A zero-case client requires explicit completion.
- Ready to Refer is offered on a client only after completed intake date, consent/address Yes, at least one current case and no current cases still in research. Whole-client Complete choices are withheld while current cases are unfinished.
- Required evidence: DateFormSubmitted for active Phase 2/3 client statuses (direct no-services closure is exempt); RequestSentDate for sent/response statuses; ClientNotifiedDate for terminal case statuses. Evidence dates start blank. Method/notes are available; stricter service/court-specific validation and audit remain future work.
- New client status defaults: Sent Form from Intake Add; Kiddie Pool elsewhere. CurrentEpisodeID defaults UNIQUEID(); new Cases.EpisodeID defaults [ClientID].[CurrentEpisodeID]. Internal episode identifiers are hidden.
- Request/Follow Up remain tables grouped by human-readable ClientID. CaseStatus is first; Follow Up additionally exposes result/date/notification fields. Intake has a concise first-contact table; Research cards show status. Full record fields remain available in forms/details.
- Verified through the staff app: intake completion validation and 1→2; researched/confirmed client 2→3; required request date and 3→4; required notification date; partial sibling completion; blocked premature client completion; final-case 3/4→5; explicit no-case closure. Temporary state changes restored.
- Added one additional fictional research case, DEMO-CS106, through Riley's Related Cases form. Verified Cases!A13:AG13 includes DEMO-C102 / DEMO-E102, Deep Dive / Phase 2 and blank event dates. Nine fictional clients and twelve cases now remain.
- Final synced queues: Intake Casey; Research Jordan/Riley; Request Alex/Avery/Quinn; Follow Up Alex/Sam/Taylor; Graveyard Robin. Alex's two cases remain independently linked to the same client.
- Jotform/email intake auto-population, operational graveyard lookup, one-submission ledger, controlled report sending, structured interaction audit, returning-client reopening, permissions/account cutover and production deployment remain unfinished. Status changes do not send messages or court reports and are not independent proof of eligibility or delivery.

See [Demo clients and phase transitions](DEMO_CLIENTS_AND_PHASE_TRANSITIONS.md) for staff instructions and [Intake and graveyard integration](INTAKE_AND_GRAVEYARD_INTEGRATION.md) for the future account integration boundary.

## Historical configuration and prior implementation notes

## Demo clients added — 2026-10-17
See [Demo clients and phase transitions](DEMO_CLIENTS_AND_PHASE_TRANSITIONS.md).
- Added six fictional clients DEMO-C101–DEMO-C106, six matching service episodes, five fictional cases DEMO-CS101–DEMO-CS105. Original data preserved.
- Verified in synced app: Casey Rivera → Intake; Riley Chen → Research; Quinn Patel → Request; Sam Ellis → Follow Up; Robin Hayes → Graveyard; Alex Parker → both Request and Follow Up with separate cases.
- Example rows: Clients!A5:I10, ServiceEpisodes!A6:G11, Cases!A8:K12. All examples are fictional.
- The earlier statement that Follow Up has no example cases is superseded: it now has Sam and Alex.
- User's target behavior is event-driven progression: staff record intake/research/confirmation, court response, and actual notification events; phases should derive automatically. This is now specified in the linked guide but **not implemented**. Current ClientStage/CasePhase manual controls remain in place.
- Next work must support current-episode closure, no eligible/no-case paths, and partial sibling-case completion without duplicate client queue membership.

## Latest verified change — exclusive client lifecycle (2026-10-17)

This section supersedes the case-only filters and unrestricted client views documented in the earlier implementation below. See [Intake and graveyard integration](INTAKE_AND_GRAVEYARD_INTEGRATION.md) for the reviewed source scripts and integration design.

- Added **Clients!I1:I4**: physical `ClientStage` column plus Phase 3/4 for all three existing fictional clients. Strict Sheet dropdown and required editable AppSheet Enum: Phase 1, Phase 2, Phase 3/4, Phase 5. Regenerated Clients successfully. ClientID and all case phases are unchanged.
- Existing views use exclusive slices:
  - Intake → Phase1_Clients: `[ClientStage] = "Phase 1"`
  - Research → Phase2_Clients: `[ClientStage] = "Phase 2"`
  - Graveyard → Phase5_Clients: `[ClientStage] = "Phase 5"`
  - Request → Phase3_Cases: `AND([ClientID].[ClientStage] = "Phase 3/4", [CasePhase] = "Phase 3")`
  - Follow Up → Phase4_Cases: `AND([ClientID].[ClientStage] = "Phase 3/4", [CasePhase] = "Phase 4")`
- Request/Follow Up retain their case tables and readable ClientID grouping. All five existing views remain.
- ClientStage initial value: `IF(CONTEXT("View") = "Phase1_Clients_Form", "Phase 1", "Phase 2")`. Tested Intake Add defaults to Phase 1 and Research Add defaults to Phase 2; canceled both unsaved test forms.
- Removed the existing DOB TODAY() initial value and made DOB, Phone, Email optional so incomplete first contacts can be recorded. Verified blank DOB in new Intake form.
- Staff currently move an existing client by editing ClientStage on the client record; case edits still affect only that case. Set Phase 2 once intake is completed/manually entered; set Phase 3/4 after research and client contact; set Phase 5 only after all current decisions are communicated. Changing a case phase alone does not change client stage.
- Verified exclusion by temporarily setting Avery to Phase 1, Jordan to Phase 2, Taylor to Phase 5 and syncing: Intake showed Avery, Research showed Jordan, Graveyard showed Taylor, Request had no cases despite their stored Phase 3 cases, Follow Up had no cases. Restored all three ClientStage values to Phase 3/4 and synced; Request again showed its original three cases.
- Editor reported no issues and Save disabled after final save. No replacement app, live account connection, sharing change, or deployment.

### Current boundaries
- Queue exclusivity is implemented. Completion checks and guided transition actions are not yet implemented; ClientStage is currently a staff assertion.
- Stored old case phases and historical records remain available through Related Cases without causing duplicate primary queue membership. When promoting a client to Phase 3/4, staff must assign the current cases their appropriate case phases; there is no bulk phase transition action yet. Fictional Jordan retains a Phase 2 sibling case from the original fixture, visible through Related Cases.
- Email intake auto-population is **designed, not installed**: future mailbox importer should upsert one client into Phase 2, use stable submission/message receipt IDs, review ambiguous identity matches, and avoid resetting active clients on repeated intake.
- Reviewed repository `google-intake-form-auto-add` and `repeat-case-check`; original scripts were not modified. They now exist at repository root; the old statement below that the scripts were not stored is superseded.
- Operational graveyard remains unconnected. Plan a read-only source/history index and explicit prior-submission evidence; never equate any historical row with confirmed submission.
- The separate ServiceEpisodes Phase field remains legacy fixture data and is not the current queue authority. Only Clients.ClientStage controls client queues. Integrate episode history deliberately later.
- No production one-time-submission ledger or notification completion checks exist yet. Preserve the operational scripts and finish synthetic testing before connecting the operational account.

## Earlier verified implementation — 2026-10-17

This section supersedes the earlier "not yet configured" status and edit sequence below.

- Edited and saved the existing **Tap In Center Clients** app in place; saved preview version **1.000009**. All five primary views remain: Intake, Research, Request, Follow Up, Graveyard. No replacement app, sharing change, or deployment was made.
- App ID: `4f5da70c-4818-4b2d-82cf-3a668bd8276e`.
- Editor: https://www.appsheet.com/template/AppDef?appName=TapInCenter%E2%80%94AppSheetPOC-851545109&appId=4f5da70c-4818-4b2d-82cf-3a668bd8276e&quickStart=False
- Confirmed `Cases[CaseID]` is the key and `CasePhase` is an editable Enum with Phase 1 through Phase 5.
- Changed `Cases[ClientID]` from Text to **Ref → Clients**. Left **Is a part of?** unchecked. Stable client and case keys were preserved.
- Existing Clients key is `ClientID`; existing label `_ComputedName` uses `CONCATENATE([FirstName]," ",[MiddleName]," ",[LastName])`. Reused it rather than adding another name field. AppSheet generated the reverse Related Cases relationship.
- Added editable Cases slices containing all source columns:
  - `Phase3_Cases`: `[CasePhase] = "Phase 3"`
  - `Phase4_Cases`: `[CasePhase] = "Phase 4"`
- Existing **Request** view now uses Phase3_Cases, Table view, grouped by ClientID ascending.
- Existing **Follow Up** view now uses Phase4_Cases, Table view, grouped by ClientID ascending.
- Both views display these columns in order: Court, CaseNumber, AttorneyStatus, ResearchStatus, Eligible, CasePhase. Other fields remain available in case details/forms. QuickEdit remains off; individual case edit forms work.

### Verified fictional-record tests

1. Initial Request contained only DEMO-CS001, DEMO-CS003, DEMO-CS004, under readable client names. Follow Up had no items.
2. Edited only DEMO-CS003 in the preview from Phase 3 to Phase 4. It appeared in Follow Up under Jordan Lee. Jordan's linked client detail still showed DEMO-CS006 in Phase 2: sibling case was unchanged.
3. Temporarily changed DEMO-CS006 from Phase 2 to Phase 3. Request showed Jordan Lee with Webster Groves / DEMO-WG-006; Follow Up showed the same Jordan Lee client with University City / DEMO-UC-003. No duplicate client was created.
4. Restored DEMO-CS003 to Phase 3 and DEMO-CS006 to Phase 2 through the case forms. Final preview: Request has the original three cases; Follow Up has no items. Other case fields were left unchanged.

### Remaining work / limits

- Only Cases and Clients are currently added as AppSheet tables. The other workbook tabs are not yet app tables; EpisodeID remains Text. Add further relationships only when implementing their workflows.
- Intake, Research and Graveyard were initially preserved; their filters were subsequently implemented in the latest change above.
- The existing full-name label can produce doubled spaces for blank middle names; optional display cleanup remains.
- Phase membership is not an eligibility decision or evidence of submission. The test temporarily put a NEEDS VERIFICATION case in Request solely to test filtering, then restored it.
- No production-safe one-time-submission ledger, historical-match enforcement, court report transmission, or notification automation was implemented. The security/accountability review remains required before real-data deployment.
- Continue with synthetic data and retain the existing Jotform, scripts, and historical graveyard.

## 1. Immediate objective (original request; completed above)

Using a signed-in browser session, edit the **existing** Tap In Center AppSheet application (do not create another app) to make cases move independently through workflow phases while retaining one client identity. The user has already created five AppSheet views, corresponding to five phases. The Cases data table has already been regenerated after a new `CasePhase` column was added to its Google Sheets source.

**First requested change:**
- Configure existing Phase 3 / Request view to show **only** Cases with `[CasePhase] = "Phase 3"`.
- Configure existing Phase 4 / Follow Up view to show **only** Cases with `[CasePhase] = "Phase 4"`.
- Group visible case rows under the linked client (human-readable first/last name, not the ClientID code). Keep each case independently editable.
- Preserve existing five views, client/case records, and all other settings unless needed for these changes.
- Demonstrate that one client may appear in both phases simultaneously when different cases have different phases.
- Verify in the preview that updating one case's phase does not modify the client's other cases.
- AppSheet cannot be configured through the connected Google Drive/Sheets API; these changes require editor access through Work's interactive browser. The user must sign into their AppSheet account and supply its *editor URL*. Do not request passwords or API tokens. Seek approval before any changes to sharing/deployment or involving real client data.

## 2. Existing project resources

- **Prototype Google Sheet (verified native Sheet):** https://docs.google.com/spreadsheets/d/1Yhol_3USiPmUNNhz6Mmyou2ArJ93WAlCdEKzNfi5TD8/edit
- **Private project repository:** https://github.com/mscott1000/tap-in-workflow
- **Separate existing research utility (public):** https://github.com/mscott1000/ICBiNCn
- **AppSheet app editor URL:** verified in the implementation section above.
- The original five-phase Jotform-transition proposal and seven existing Apps Script/Tampermonkey code files were shared as attachments in the earlier ChatGPT conversation. They are **not** stored in this repository by this handoff; ask for them only when a specific implementation requires reading the original code. Avoid copying any embedded credentials.

## 3. What Tap In Center actually does

Tap In Center is a free, court-connected warrant-assistance service in the St. Louis region. Staff are administrative coordinators, **not legal decision-makers**.

1. Receive incoming contacts via telephone, text, email, in person, and the existing Jotform intake embedded on the organization's website.
2. Direct clients to complete the existing Jotform; staff assist if necessary. **Do not build or replace the intake form.**
3. Once identifying information is available, research public court records using Case.net, Municourt and existing tools, particularly ICBiNCn.
4. Contact clients to confirm research matches their understanding of their cases.
5. Apply fixed, non-discretionary submission criteria: participating court, no private attorney entered on the case, and no **previous Tap In submission of that same case**. Capture client consent and any court-required additional information.
6. Compile and transmit **weekly court-partner reports** requesting recall of warrants on qualifying cases.
7. Explain eligible and ineligible matters to clients and refer them to available public resources for matters Tap In cannot address.
8. On partner response, record the court's determination; inform the client and, if granted and confirmed, communicate warrant recall and new court date.
9. Log **every** client interaction, including date, channel (call, text, voicemail, email, in-person), staff notes and next steps.

**Absolute constraint:** Tap In can request a recall **only once per individual case**, whether the court grants or denies it. The historical Google Sheets “graveyard” exists mainly to prevent repeat submissions. A historical case record does not automatically prove it was actually submitted; distinguish `CONFIRMED SUBMITTED`, `RESEARCHED ONLY`, and `UNKNOWN - VERIFY`. Ambiguous cases must be verified before an actual submission. Do not assume a UI warning alone guarantees safety. Final submissions need a controlled audit/ledger mechanism; the current proof of concept does not yet implement a production-safe one.

## 4. Five phases and the case/client distinction

The original proposal's five stages (keep the user's AppSheet view names if they differ):
1. **Lobby** — first contact / form outstanding. No case record may exist.
2. **Pool** — initial research (“Kiddie Pool”), client confirmation (“Pool Rules”), detailed case research (“Deep Dive”).
3. **Request** — cases ready for or awaiting handling through weekly court-partner request workflow. Avoid conflating draft with actually submitted.
4. **Follow Up** (original planning term “Purgatory”) — court response / client follow-up.
5. **Graveyard** — historical/completed records, including previously submitted cases.

**New design choice (agreed 2026-10-17):** one durable client record; separate case records, each with independent `CasePhase`; AppSheet phase views use slices filtered on Cases and group results by linked client. **Do not duplicate a client record per court.** Example: two cases for Avery Morgan, one University City and one Florissant. Initially both in Request. When the University City partner responds, ONLY that case moves to Follow Up; Florissant remains Request. Avery appears under both views with the relevant case only. Phase 1 may need a client/contact-based queue because cases have not been identified yet.

## 5. Google Sheets prototype state — verified in prior conversation

Workbook tabs and their original columns:
- `Clients`: `ClientID, FirstName, LastName, MiddleName, DOB, Phone, Email, Address`
- `ServiceEpisodes`: `EpisodeID, ClientID, TICWeek, Phase, Status, AssignedTo, IntakeSourceID`
- `Cases`: `CaseID, ClientID, EpisodeID, Court, CaseNumber, CaseKey, AttorneyStatus, ResearchStatus, Eligible, ResearchNotes, CasePhase`
- `Interactions`: `InteractionID, ClientID, EpisodeID, ContactDate, ContactMethod, StaffEmail, Notes, NextSteps`
- `HistoricalCaseIndex`: `HistoricalID, CaseKey, CaseNumber, Court, SourceTab, SourceRecord, SubmissionHistoryStatus`

On 2026-10-17 a new `CasePhase` column was added at **Cases!K1:K7**, using a strict dropdown with values `Phase 1` to `Phase 5`. Verified values for synthetic rows:
- `DEMO-CS001` Florissant / Avery: Phase 3
- `DEMO-CS002` St. Louis County / Avery / private attorney: Phase 5
- `DEMO-CS003` University City / Jordan: Phase 3
- `DEMO-CS004` Kirkwood / Taylor / already submitted: Phase 3
- `DEMO-CS005` Florissant / Avery / historically submitted: Phase 5
- `DEMO-CS006` Webster Groves / Jordan / uncertain: Phase 2

**No example case currently has Phase 4**, so to verify that view, temporarily update **one synthetic case only**, then confirm it moves from Request to Follow Up without moving sibling cases. Only use test records; avoid affecting any operational sheet.

The user confirmed they completed **Regenerate schema** for the Cases table in AppSheet. The user also stated they independently created five AppSheet views. It is **not confirmed** that all Ref columns, labels, keys or security settings have been configured correctly. Inspect current editor state before changes.

Proposed Ref relationships if not yet present:
- `ServiceEpisodes[ClientID]` -> `Clients`
- `Cases[ClientID]` -> `Clients`
- `Cases[EpisodeID]` -> `ServiceEpisodes`
- `Interactions[ClientID]` -> `Clients`
- `Interactions[EpisodeID]` -> `ServiceEpisodes`

Use stable ID text columns as keys; ensure AppSheet row identity is correct. Configure a readable label for client records; use a virtual full-name column if necessary. `HistoricalCaseIndex` remains a stand-alone searchable source pending matching/ledger implementation.

## 6. The smallest safe AppSheet edit sequence

1. Open existing app in editor, inspect **Data > Cases**, its `CasePhase` column, `ClientID` type/Ref, and **Data > Clients** key/label behavior.
2. If needed, set `Cases[ClientID]` to Ref -> `Clients`, and create/set a human-readable client display label (do not change stable keys).
3. Make a Cases slice named `Phase3_Cases` with row filter `[CasePhase] = "Phase 3"`. Include all necessary columns for editing and relationship display.
4. Make a Cases slice named `Phase4_Cases` with row filter `[CasePhase] = "Phase 4"`.
5. Configure the **existing** Request view's `For this data` as `Phase3_Cases`, view type `Table` (or `Deck` if better after testing), `Group by` `ClientID`, and useful visible fields (Court, CaseNumber, relevant status).
6. Configure the **existing** Follow Up view analogously with `Phase4_Cases`; group by `ClientID`.
7. Save, sync/preview, verify counts; move a synthetic case temporarily between phases and observe independent behavior. Preserve the user's existing naming and any custom navigation.
8. Report exact modifications, evidence of success, and any editor limitations. Do not claim AppSheet settings were changed if only the Sheet was edited.

`CasePhase` is a case-level workflow label, **not** proof of eligibility or a previous court submission. No live one-time-submission protection exists yet.

## 7. Existing automations, integration boundaries, and next milestones

Existing scripts supplied in the prior chat:
- Jotform notification email -> Apps Script -> Weekly Call Log (Gmail subject convention).
- Google Voice missed-call / voicemail notification ingestion into Weekly Call Log with contact matching.
- Weekly marker-copy tool to weekly Intake tabs.
- Weekly Intake -> graveyard importer plus cell-note extraction.
- Phone and case matching / graveyard highlighting with a whitelist.
- ICBiNCn Tampermonkey research interface for Case.net/Municourt; output is not yet a structured AppSheet import.
- Track This Case verification email queue and verifier.

**Do not break these existing production workflows.** Build the app first around synthetic data. Long-term opportunities: structured ICBiNCn import; read-only indexed graveyard lookup; client interaction log; court-specific weekly report draft generation; controlled submission ledger; court decision and notification queues.

## 8. Security and scope

- The prototype workbook contains fictional examples; **never mix real client personal/legal data into a public repository or ChatGPT prompt**.
- Keep GitHub repo private and limited to code, schemas, non-sensitive examples, instructions and architecture decisions. Do not commit real client records, Gmail exports, tokens, spreadsheet exports containing actual data, or unreviewed scripts. An existing TTC script contained a hard-coded access token; do not reproduce it here and rotate/restrict it before reuse.
- AppSheet/Google sign-in permissions and app user authorization must be reviewed prior to live deployment. The prior reliance on a shared Google account does not provide individual accountability. Do not invite outside users or deploy the app publicly without authorization.
- Google Sheets `onEdit` triggers are generally not invoked by AppSheet writes; do not rely on them as submission safeguards.
- Keep Jotform as the existing intake. Keep Google Sheets graveyard as the source history for now.
- Do not use the terminal or require local downloads when a browser-based method works.

## 9. Operating protocol for future Work chats

- Treat this file and current verified Sheet/editor state as project context. Inspect the actual browser editor before action: prior chat instructions may not match current UI.
- Prefer making changes in-place to the established AppSheet application; do not create an unrelated replacement.
- Take small reversible steps and verify each in the preview.
- Keep a short change log in the repo for implemented settings (views, slices, Ref/Label configuration, and validation tests).
- If you cannot interact with AppSheet's editor, say so explicitly; do not claim deployment.
- Ask the user for the AppSheet editor URL or sign-in **only when needed**; never request passwords or client records.
