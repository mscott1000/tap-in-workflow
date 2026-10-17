# Tap In Center — AppSheet proof of concept: Work handoff
_Last updated: 2026-10-17. This document is the source-of-truth handoff for a new ChatGPT Work session. Do not infer that AppSheet editor settings have been deployed merely because Google Sheet columns exist._


## Verified implementation — 2026-10-17

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
- Intake, Research and Graveyard were preserved; their phase-filtering behavior has not been implemented or validated in this change.
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
