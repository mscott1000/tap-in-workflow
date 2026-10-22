# ClientInstance migration handoff — 2026-10-22

## Authorization and scope
User authorized the coordinated prototype migration. This is the fictional Tap In Center AppSheet POC, not production deployment. Keep the existing Jotform, operational graveyard, court transmission and access cutover outside this change. User wants economical tool use and a task list if interrupted.

## Sources and checkpoint
- App: Tap In Center, AppSheet Prototype, visible in My Apps.
- Workbook: Tap In Center — AppSheet POC, https://docs.google.com/spreadsheets/d/1Yhol_3USiPmUNNhz6Mmyou2ArJ93WAlCdEKzNfi5TD8/edit
- Fresh backup made 2026-10-22: https://docs.google.com/spreadsheets/d/1KVVJs7mCEiCik4_iYJ_hw4i-kBw4TowzCLVnES_oWOk/edit
- Previous implementation record: docs/LIVE_IMPLEMENTATION_2026-10-21.md.
- Checkpoint was created before edits; current status is below. AppSheet preview was runnable after the key/relationship saves (version 1.000216), prior to the unsaved removal-action adjustment.
- Workbook tabs: Clients (sheetId 184718347), ServiceEpisodes (201000002), Cases (201000003), Interactions (201000004), HistoricalCaseIndex (201000005), ExportSelections (201000006).
- Current headers: ServiceEpisodes A:G = EpisodeID, ClientID, TICWeek, Phase, Status, AssignedTo, IntakeSourceID. Cases A:AH = CaseID, ClientID, EpisodeID, Court, CaseNumber, CaseKey, AttorneyStatus, ResearchStatus, Eligible, ResearchNotes, CasePhase, CaseStatus, ReasonMissingCourtCategory, ReasonMissingCourtText, NumberOfCounts, ChargeType, ChargeClass, ChargeText, ChargeCategory, BondAmount, AttorneyName, Division, WarrantIssueDate, PriorTICRecall, PAOnCall, PAConsent, WarrantRecalled, NextCourtDate, CaseLink, RequestSentDate, ClientNotifiedDate, NotificationMethod, NotificationNotes, ContactLog. ExportSelections A:E = SelectionID, StaffEmail, CaseID, SelectedAt, ExportBatchID.
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
- [x] Verified all 21 CaseIDs nonblank/unique and ExportSelections empty. Changed Cases key to CaseID, kept CaseNumber label, changed Add to Export to write [CaseID] into ExportSelections[CaseID]. Changed Remove Export Selection referenced-row comparison to [_THISROW].[CaseID] (pending final save/functional export test).
- [x] Added Cases!AI1 CurrentTask and regenerated schema. Set optional Enum choices Need to Text, Need to Call, Confirmation Pending; display name Current task. Still add form/detail/phase column order and format rules.
- [x] Added ServiceEpisodes as AppSheet table named ClientInstances, EpisodeID key with UNIQUEID() initial value, ClientID Ref to Clients; disabled ClientInstances deletes. Still define weekly display label and unique-week validation.
- [x] Converted Cases[EpisodeID] to Ref to ClientInstances with IsAPartOf; disabled Cases deletes. Still configure edit forms, phase-based creation restriction, and verify no cascade path remains.
- [ ] Migrate client/instance Add Case UI from detail to Edit while avoiding duplicate entry paths.
- [ ] Change phase slices and computed routing so each case follows its own lifecycle status, including jumps to Phase 5; group cases under ClientInstance. Retain Clients/instances with zero cases.
- [ ] Add CaseNumber match alert and review display, with historical match evidence; preserve submission guard, update export selections/action to new case key.
- [ ] Verify synthetic workflow: zero-case instance, add from Edit, move 1→5, sibling stays in other phase, each Current task retains phase, repeated case number flags, different week creates new instance without mixing old cases, export guard.
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
