# ClientInstance migration handoff — 2026-10-22

## Revised target — user clarification, 2026-10-22

This section supersedes conflicting design decisions and continuation tasks below. No live editor changes were made for this revision yet.

- ClientInstance is the editable parent for one client in one TIC week. It supplies shared name, DOB, contact information and instance-specific staff notes to every linked case. Case rows are the principal work items from Phase 2 through Phase 5. Prefer dereferenced parent values rather than duplicate editable copies on six cases.
- Phase 1 has only ClientInstance rows and no case rows. Phase 1 is intake/contact sorting. The existing Cases[EpisodeID] ValidIf still allows Phase 1 and must be changed; the Phase1_Clients view must be replaced with a ClientInstances-based view. Establish how an instance moves from Phase 1 to Phase 2 before its first case.
- A case created from a Phase 2 ClientInstance must retain Cases[EpisodeID] → ClientInstances[EpisodeID]; this Ref/IsAPartOf and an inline New control in the parent Edit form already exist, but a saved-row test is pending. The parent Edit form's Related Cases Show_If currently allows Phase 1/2; revise to Phase 2–5 if creation is intended at every later phase.
- In Phase 2–5, show an actual selectable/editable ClientInstance parent row above its phase-filtered case rows, not merely a Group by header. The existing main Research view is Phase2_Clients and Graveyard is a Cases table grouped by week/name; neither fulfills the full nested-parent requirement. Request and Follow Up are case tables, also without a true parent row. Investigate a ClientInstances deck with phase-specific nested Ref lists or a dashboard, and verify interactions on mobile/desktop before replacing views.
- If one ClientInstance has cases in multiple phases, display the same parent in each relevant phase while cases remain only in their own phase. The parent's Phase field must not be the sole filter after research starts.
- The user asked for Add Case inside the Edit form of any case in Phases 2–5. AppSheet does not display custom actions inside forms. Recommend the supported parent Edit → Related Cases → New control, plus an Add sibling case action on the case **detail/row** (outside Edit) prefilled with the same EpisodeID. Explain and validate the interaction with the user before treating it as equivalent to a button inside child Edit.
- ClientInstances currently has only EpisodeID, ClientID, TICWeek, Phase, Status, AssignedTo, IntakeSourceID as physical fields. Name/DOB/contact may come from Clients via ClientID, but instance-specific contact and notes need an explicit source-of-truth design and new columns. Verify current Cases client display formulas before promising live propagation. Do not copy editable values into each case.

Revised implementation order: (1) add/shared parent fields and verify dereferences; (2) Phase 1 ClientInstances-only view and Phase 2 gate for case creation; (3) phase-specific parent-plus-case nested views for 2–5; (4) add sibling action on case Detail and parent Edit inline New; (5) synthetic tests including six cases/one parent across phases and edits propagating; (6) export/once-ever submission controls and production dependencies already listed below.

## Authorization and scope
User authorized the coordinated prototype migration. This is the fictional Tap In Center AppSheet POC, not production deployment. Keep the existing Jotform, operational graveyard, court transmission and access cutover outside this change. User wants economical tool use and a task list if interrupted.

## Sources and checkpoint
- App: Tap In Center, AppSheet Prototype, visible in My Apps.
- Workbook: Tap In Center — AppSheet POC, https://docs.google.com/spreadsheets/d/1Yhol_3USiPmUNNhz6Mmyou2ArJ93WAlCdEKzNfi5TD8/edit
- Fresh backup made 2026-10-22: https://docs.google.com/spreadsheets/d/1KVVJs7mCEiCik4_iYJ_hw4i-kBw4TowzCLVnES_oWOk/edit
- Previous implementation record: docs/LIVE_IMPLEMENTATION_2026-10-21.md.
- Checkpoint was created before edits; current status is below. AppSheet preview is runnable after saved changes through version 1.000229; the Graveyard case grouping and ClientInstance Edit form were observed in preview.
- Workbook tabs: Clients (sheetId 184718347), ServiceEpisodes (201000002), Cases (201000003), Interactions (201000004), HistoricalCaseIndex (201000005), ExportSelections (201000006).
- Current headers: ServiceEpisodes A:G = EpisodeID, ClientID, TICWeek, Phase, Status, AssignedTo, IntakeSourceID. Cases A:AI = CaseID, ClientID, EpisodeID, Jurisdiction, CaseNumber, CaseKey, AttorneyStatus, ResearchStatus, Eligible, ResearchNotes, CasePhase, CaseStatus, ReasonMissingCourtCategory, ReasonMissingCourtText, NumberOfCounts, ChargeType, ChargeClass, ChargeText, ChargeCategory, BondAmount, AttorneyName, Division, WarrantIssueDate, PriorTICRecall, PAOnCall, PAConsent, WarrantRecalled, NextCourtDate, CaseLink, RequestSentDate, ClientNotifiedDate, NotificationMethod, NotificationNotes, ContactLog, CurrentTask. ExportSelections A:E = SelectionID, StaffEmail, CaseID, SelectedAt, ExportBatchID.
- Cases had 21 populated, unique CaseID values, including one recently added fictional row; ExportSelections had zero data rows. AppSheet Cases key has now changed to CaseID, with CaseNumber retained as label.
- Existing ServiceEpisodes source tab may remain physically named that; app-facing label is ClientInstance. EpisodeID may remain internal key.
- Existing Add Case is a Clients detail action, prefilled via LINKTOFORM; current primary Research is Clients based; Research Cases view is case based.

## Design decisions
1. Client = person; ClientInstance = one client in one TIC Week. Existing ClientID is persisted identity, not automatically recalculated on edits. Match name + DOB as candidate with human corroboration.
2. Add Case on ClientInstance Edit form in Phases 1 and 2. Cases[EpisodeID] Ref to ClientInstances, IsAPartOf; generated related cases inline on parent form. Disable deletes to avoid cascading deletion. Keep Clients[ClientID] and Cases[ClientID] consistent with the parent.
3. Cases route independently by lifecycle CaseStatus, not client-wide stage gate. Group by ClientInstance. Preserve zero-case parent visibility.
4. Add optional CurrentTask / Current task enum: Need to Text, Need to Call, Confirmation Pending. These do not change phase. Display/format in all phases.
5. Repeat CaseNumber generates a match alert across current cases and historical index, with context and review. Confirmed prior submission blocks export regardless of week. Use an immutable case row key so repeats can be recorded; migrate all references and actions together.
6. One ClientInstance per ClientID + standardized TICWeek via app form check, plus eventual server/import enforcement. No production ledger is connected.

## Ordered implementation checklist
- [x] Read previous implementation record and live workbook metadata/headers.
- [x] Make fresh source workbook backup (link above).
- [ ] Inspect the AppSheet editor state, tables, columns, actions, views, slices, formulas and all CaseNumber references.
- [x] Verified all 21 CaseIDs nonblank/unique and ExportSelections empty. Changed Cases key to CaseID, kept CaseNumber label, changed Add to Export to write [CaseID] into ExportSelections[CaseID]. Changed Remove Export Selection referenced-row comparison to [_THISROW].[CaseID] (saved; functional export test pending).
- [x] Added Cases!AI1 CurrentTask and regenerated schema. Set optional Enum choices Need to Text, Need to Call, Confirmation Pending; display name Current task. Added CurrentTask to Cases_Form manual column order; still add phase detail/table display and format rules.
- [x] Added ServiceEpisodes as AppSheet table named ClientInstances, EpisodeID key with UNIQUEID() initial value, ClientID Ref to Clients; disabled ClientInstances deletes. Added InstanceLabel as label and app-form unique-week validation; direct Sheet writes need separate enforcement.
- [x] Converted Cases[EpisodeID] to Ref to ClientInstances with IsAPartOf; disabled Cases deletes. Added parent Phase 1/2 creation validation and verified a Phase 2 ClientInstance Edit form shows Related Cases → New; actual save and cascade checks remain.
- [x] ClientInstances system ServiceEpisodes_Form automatic column order includes Related Cases; Related Cases Show_If is IN(UPPER([Phase]), LIST("PHASE 1", "PHASE 2")), so inline section is restricted to early phases. Added menu view Client Instances over ClientInstances; hid obsolete Clients detail Add Case action. Verified Phase 2 edit-form navigation to a new case form; no test case saved yet.
- [x] Phase2_Cases, Phase3_Cases, Phase4_Cases row filters now use their own CasePhase and latest ClientInstances[TICWeek] for matching ClientID rather than client-wide WorkflowStage/CurrentEpisodeID. Built Phase5_Cases and wired Graveyard to it. Direct non-linear movement and zero-case visibility need testing.
- [x] Added Cases virtual RepeatCaseAlert that checks normalized CaseNumber against other Cases and HistoricalCaseIndex and displays a review warning; Add to Export writes CaseID key and Remove Export Selection matches CaseID. Added RepeatCaseAlert to Cases_Form manual column order; still verify live warning, add useful match context, and test export guard.
- [ ] End-to-end synthetic workflow remains untested. App preview was runnable after saves through version 1.000229. The ClientInstance Edit → Related Cases → New flow and completed case grouping were inspected; no new case has been saved.
- [x] Updated checkpoint after initial saved edits. Continue to update after remaining work.

## Manual continuation in AppSheet
- Data → Tables: add ServiceEpisodes; Data → Columns: set EpisodeID key, ClientID Ref, Cases EpisodeID Ref/IsAPartOf; regenerate after source header addition.
- UX → Views: edit form column order for related cases in early phases; edit case slices and Group by.
- Behavior → Actions: examine current Add Case and Add to Export, update key-sensitive expressions.
- UX → Format rules: add Current task colors/icons.
- Test in preview with fictional records. Do not change live submission eligibility based only on UI slices or ValidIf; direct Sheet/API writes need their own enforcement.

## Open production dependencies
Operational graveyard import/index, immutable once-ever submission ledger and enforcement for every write path, Jotform/mailbox adapter, staff access and rollout, final court report/receipts. No real court submission or client communication authorized by this prototype task.

## Important migration discovery
Regenerating Cases restored source header Court, while existing app actions/views referred to Jurisdiction, temporarily making the preview unrunnable. Renamed Cases!D1 from Court to Jurisdiction in the source, regenerated again, and verified the preview recovered. Keep source and AppSheet column names aligned on future regeneration. AppSheet shows a pre-existing Google Sheet data-validation list length warning for Cases (>255 chars); it did not stop the preview. The current app remains a prototype, not deployed.

## Second checkpoint
- Added ClientInstances virtual InstanceLabel = CONCATENATE([ClientID].[_ComputedName], " — week of ", TEXT([TICWeek])); switched label from EpisodeID.
- ClientInstances[TICWeek] Valid If counts another instance with the same ClientID and TICWeek and blocks duplicates in the app form; direct Sheet writes still require separate checks.
- Cases[EpisodeID] Valid If allows new rows only when parent Phase is 1 or 2, but permits editing already stored CaseIDs in later phases. EpisodeID marked required.
- Cases[ClientID] Initial Value = [EpisodeID].[ClientID], so inline child from weekly parent inherits the person. This exposed a circular default with the legacy EpisodeID Initial Value = [ClientID].[CurrentEpisodeID]. Removed that old EpisodeID default, saved, and verified preview recovered. Do not restore the old default.
- No real data written or submission sent. The source Cases!D1 header was aligned to Jurisdiction; Cases!AI1 is CurrentTask. Some existing Google validation-list warning remains.
- Remaining immediate sequence: create Phase5_Cases and use it for Graveyard (or an additional completed-cases view); group phase case views by EpisodeID/InstanceLabel; include CurrentTask and RepeatCaseAlert in case form/detail column orders, apply formatting; disable Clients deletes; test inline add using fictional data and repeat-number warning, and ensure Export Draft CSV works. Verify new ClientInstance form navigation and CaseID link integrity. Consider whether historical/candidate matching should show detailed matches, not just alert.

## Third checkpoint — Graveyard and form
- Created `Phase5_Cases` slice over Cases, row filter `[CasePhase] = "Phase 5"`, across all TIC weeks. Slice Adds off; Updates on; Deletes off. This keeps completed cases in a stationary historical view while allowing corrections.
- Changed primary Graveyard table view source from Clients to Phase5_Cases. Group by ClientTICWeek descending, then ClientName ascending. Manual columns: Jurisdiction, CaseNumber, CaseStatus, CurrentTask, RepeatCaseAlert. Saved. Preview shows 10/20 and 10/13 weeks; selecting 10/20 shows Taylor Q Example header with three separate completed fictional case rows from different jurisdictions. This addresses visibility for direct completed status moves at the case level, though an actual Phase 1→5 transition has not been run.
- Client Instances menu view shows fictional ClientInstance cards, including current and older Avery Morgan weeks. On Phase 2 Avery instance Edit, Related Cases section shows existing DEMO-FLO-001 and New. New opens Cases_Form. Cancelled without creating data. Cases_Form had a manual column list that omitted CurrentTask and RepeatCaseAlert; added both and saved. Refreshed preview confirms Current task appears on Cases_Form and opens exactly Need to Text, Need to Call, Confirmation Pending. RepeatCaseAlert is in manual order but blank in a new case form; verify it after entering a duplicate number. Save a fictional child case and check EpisodeID/ClientID in the Sheet.
- Existing primary Research remains Clients based, and the Request/Follow Up case views have not yet been regrouped by ClientInstance. Some Client Instances card actions show a generic Add even for later phases; investigate its target and hide/restrict if it creates cases. The EpisodeID ValidIf protects new case saves in later phases but direct Sheet/API writes bypass app checks.

## Next tasks, in order
1. Run a small fictional end-to-end test from Client Instances → Phase 2 instance → Edit → Related Cases → New. Confirm EpisodeID and ClientID persist, CurrentTask choices appear, RepeatCaseAlert catches a repeated case number, and Phase 3/4/5 routing responds to CaseStatus. Clean up test records through the Sheet/backup as appropriate; Cases deletes are disabled in app.
2. Move current phase views to case slices where needed: Research currently shows Phase2_Clients, while Research Cases is a separate menu view. Group each case view under its client and TIC week, keeping zero-case instances discoverable in Client Instances. Preserve staff filters and existing column sets deliberately.
3. Configure CurrentTask colors/icons in UX → Format Rules, plus useful columns in phase views/detail. Add case number match context and a firm once-ever submission guard tied to an authoritative historical ledger; alert alone must not be treated as enforcement.
4. Verify Add to Export, Remove Export Selection, Export Draft CSV, and CaseID references after the key migration. Check historical matches and route a synthetic non-linear case directly to Phase 5.
5. Disable Clients deletes after checking related records and backfill. Standardize TICWeek and add import/direct-write duplicate enforcement. Build human review for name+DOB candidate matches. Connect operational graveyard and submission ledger only in a separately reviewed production migration.
