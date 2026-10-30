# Case generation and remaining AppSheet work — 2026-10-30

## Completed and verified

- Working Sheet: `Cases!K2:K979` now has strict dropdown validation for Intake, Research, Request, Follow Up, Graveyard. All 978 rules were read back. No record values, formulas, widths, colors, or other validation were changed. No numbered CASEPHASE record values were present in the inspected range.
- Generator: Ordinance → CHARGECLASS O; recognized Class A–E text → A–E; unsupported/unclassified values remain blank with the source value in RESEARCHNOTES. This avoids sending Unclassified to the last observed AppSheet Enum, which allows only A, B, C, D, E, O. CHARGETYPE remains separate; a class letter alone does not establish felony/misdemeanor.
- Courts: output uses the nine literal current Sheet dropdown values. Known case/municipal/circuit aliases normalize to those values. Unknown courts remain blank with a warning rather than writing rejected text.
- Generator requires the history checker in the same project before appending Cases. It releases the shared lock before calling history. A repeat run skips already linked case numbers and retries history; missing history dependencies and missing output headers fail before writes. History source errors reject the bot task after preserving saved Cases; retrying does not duplicate them.
- Four user uploads are permanently preserved in `integrations/source-snapshots/2026-10-30/`. Maintained copies now incorporate the uploaded wording, Client status `Match - Awaiting Confirmation`, and checkpoint-based Voice importer. The duplicate-case reason no longer claims a same-week match because the checker does not filter TICWEEK. Working date reads use the workbook timezone, currently Etc/GMT, preserving the uploaded GMT behavior without hardcoding it.
- Synthetic checks cover generator creation/retry/history failures, mappings, unsupported courts/classes, linked keys, manual fallback without draft rows, literal text, history dates/statuses, and Voice checkpoint/cap/write-failure behavior. These are not live tests.

## What still requires your browser

Connected tools can edit Sheets, but cannot save AppSheet settings or install Apps Script. AGENTS.md rules 9–10 require user installation and prohibit automated login or live-script runs. No scripts or AppSheet settings were installed/saved by this task. The last independently observed AppSheet version remains 1.000584 from October 29.

The editor categories below identify AppSheet configuration objects. Current editor menu labels were not inspected in this task. Proposed new names below are deliberate new names, not claims about existing objects. Reuse an existing equivalent object if present; do not create a second timestamp-change bot.

### 1. Install only the three changed files

Open **AppSheet Intake**:
https://script.google.com/home/projects/12e-XiMzRPQvbJEZ9Xr24wwnvOPoKcqgO8hyRPCi45iiCoZyfnRvmJYkz/edit

Use the full files from the commit linked in the task response. Open each file on GitHub, select Raw, and copy its complete contents.

| Repository file | AppSheet Intake editor file | Operation |
| --- | --- | --- |
| [identity-review-core.js](../integrations/identity-review-core.js) | history-match-core | Replace this file only |
| [identity-review-adapter.gs](../integrations/identity-review-adapter.gs) | history-match-adapter | Replace this file only |
| [eligible-cases-install.gs](../integrations/eligible-cases-install.gs) | eligible-cases-install | Add this single combined file to AppSheet Intake if absent |

The four uploaded files establish the reconciliation baseline for AppSheet Intake. If any editor file has changed since those uploads, compare it before replacement. The generator was not among the uploads; if AppSheet Intake now already has that file, compare it first. Do not replace the generator in Tap In Workflow, delete it, change its triggers, or paste the two generator components separately.

Do not replace appsheet-intake-forms or voice-communications: maintained copies now preserve those uploads and this task needs no new installation of them. Save the three changed files. Saving can affect existing consumers immediately; it is not a staging barrier. Do not run any importer or generator yet.

### 2. Bind the generator bot

Open the existing **Tap In Center** AppSheet app, ID `4f5da70c-4818-4b2d-82cf-3a668bd8276e`. In its automation configuration, finish the existing generator draft, or create a bot named **Generate Cases for Client** only if no equivalent bot exists.

- Event table: `Clients`; updates only.
- Event condition:

```appsheet
AND(
  ISNOTBLANK([_THISROW_AFTER].[CaseGenerationRequestedAt]),
  [_THISROW_BEFORE].[CaseGenerationRequestedAt] <> [_THISROW_AFTER].[CaseGenerationRequestedAt]
)
```

- Process task type: Call a script.
- Script project: **AppSheet Intake**, not **Tap In Workflow**.
- Function: `createEligibleCasesForClient`.
- Parameter `clientRowId`:

```appsheet
[ClientRowID]
```

- Existing **Generate Cases** action: keep its Clients row action setting CASEGENERATIONREQUESTEDAT to `NOW()`; do not change CLIENTSTATUS, CLIENTPHASE, CASESTATUS, or CASEPHASE in that action.
- Complete Google's actual runtime consent in your own browser if required. This project also contains Gmail code, so its permission request may include Gmail. No deployment token or custom OAuth setup is needed.
- Save the AppSheet app. Inspect for a second saved generator bot using the same event; only one generator bot should respond to this timestamp. No other bot/trigger changes are part of this task.

### 3. Provide the manual Add Case path

A background bot cannot navigate the staff browser when its parser returns a fallback. The implementable fallback is an explicit **Add Case** action on the Client row, available whether generation succeeds or not. With no supported number, the script creates no Case and returns `manualCaseRequired: true` plus an instruction to open Add Case. Do not create a draft Case or submit an empty Case.

If an existing Case form is already suitable, use its exact view name in LINKTOFORM. Otherwise create a reference-position Form view on the existing `Cases` table named **Add Case for Client**. This is a new form, not a replacement of any existing view or layout. Keep the existing Case field defaults and validation; CASEID must retain its unique initial value. Verify CLIENTROWID is the reference to Clients and CLIENTID is the parent identity.

Configure a Clients action named **Add Case**, type **App: go to another view within this app**, target:

```appsheet
LINKTOFORM(
  "Add Case for Client",
  "ClientRowID", [ClientRowID],
  "ClientID", [ClientID]
)
```

If reusing an existing form, replace only the first literal string above with its observed exact view name. Show the action on the Client detail. Leave it available without a history/eligibility condition. Open it on a fictional Client, confirm the correct parent is prefilled, then cancel without saving. The user fills a manual Case through the existing validation; no fabricated case number or special work-row type is used.

### 4. Show warnings and repeat-check results

Do not overwrite existing staff RESEARCHNOTES or use history results as submission gates. The generator writes warnings only on newly created Cases.

On Cases, retain RESEARCHNOTES in the existing detail/edit form. A virtual LongText column named **GenerationWarnings** can show its generated warning block without hiding the editable notes field:

```appsheet
IF(
  STARTSWITH([ResearchNotes], "Review before submission:"),
  [ResearchNotes],
  ""
)
```

Display name: **Generation warnings**. Show_If:

```appsheet
ISNOTBLANK([GenerationWarnings])
```

Add it beside the existing RESEARCHNOTES in the Case detail, leaving unrelated field order unchanged. Warnings name the exact missing/uncertain field. Correct the actual field during staff review; notes are a snapshot of the parsing issues and do not automatically clear when staff edit other fields.

For the existing virtual `Cases[RepeatCaseCheck]`, display name **Repeat Case Check**, use a current-input check before trusting the summary:

```appsheet
IF(
  AND(
    ISNOTBLANK(
      LOOKUP(CONCATENATE("CASE-CHECK-", [CaseID]), "CaseMatchCandidates", "CandidateID", "SubmissionStatus")
    ),
    LOOKUP(CONCATENATE("CASE-CHECK-", [CaseID]), "CaseMatchCandidates", "CandidateID", "SourceFingerprint")
      = CONCATENATE([CaseNumber], "|", [Jurisdiction])
  ),
  LOOKUP(CONCATENATE("CASE-CHECK-", [CaseID]), "CaseMatchCandidates", "CandidateID", "SubmissionStatus"),
  "Pending"
)
```

Case values remain Pending; No Case Match; Match Found - Awaiting Confirmation; Duplicate AppSheet Entry; Error. Keep existing equivalent expressions if they also reject stale summaries. Show Repeat Case Check beside Generation warnings in the existing Case detail. For the existing `RepeatCaseMatches` related list, list element Ref to CaseMatchCandidates, filter current non-summary evidence:

```appsheet
SELECT(
  CaseMatchCandidates[CandidateID],
  AND(
    [CaseID] = [_THISROW].[CaseID],
    [SourceTab] <> "Check summary",
    [SourceFingerprint] = CONCATENATE([_THISROW].[CaseNumber], "|", [_THISROW].[Jurisdiction]),
    [Decision] <> "Dismissed"
  )
)
```

Current `Clients[PriorTICClient]` values in the Sheet already use **Match - Awaiting Confirmation**. Retain that spelling for the Client Enum and related display conditions. Client and Case status texts intentionally differ; do not change the Case Enum to the shorter Client wording. Keep Client options Pending; No Client Match; Match - Awaiting Confirmation; Repeat Client Confirmed; Error.

Manual Case adds and CaseNumber/Jurisdiction updates also need the existing advisory Case bot bound to `checkCaseHistory([CaseID])` in AppSheet Intake. Its event is Adds and Updates on Cases, condition:

```appsheet
OR(
  ISBLANK([_THISROW_BEFORE].[CaseID]),
  [_THISROW_BEFORE].[CaseNumber] <> [_THISROW_AFTER].[CaseNumber],
  [_THISROW_BEFORE].[Jurisdiction] <> [_THISROW_AFTER].[Jurisdiction]
)
```

Reuse an existing equivalent bot. Generated rows use the explicit script history call because direct Sheet writes do not fire this AppSheet event. No new matching timer is needed.

### 5. Request and Graveyard: Client rows

In the existing slices/views, inspect rather than reset the view type, grouping, column order, or widths. Create the proposed `Phase3_Clients` slice only if no equivalent Request Client slice exists; source `Clients`, row filter:

```appsheet
OR(
  [ClientPhase] = "Request",
  COUNT(
    SELECT(
      Cases[CaseID],
      AND([ClientRowID] = [_THISROW].[ClientRowID], [CasePhase] = "Request")
    )
  ) > 0
)
```

Set only the existing **Request** view's data source to that Client slice. Do not replace its view or reset column order; if the view currently uses a Cases-specific column/group, select the corresponding existing Client field rather than regenerating its layout.

For existing `Phase5_Clients`, source `Clients`, row filter:

```appsheet
OR(
  [ClientPhase] = "Graveyard",
  COUNT(
    SELECT(
      Cases[CaseID],
      AND([ClientRowID] = [_THISROW].[ClientRowID], [CasePhase] = "Graveyard")
    )
  ) > 0
)
```

Set only the existing **Graveyard** view's data source to `Phase5_Clients` if it still points to `Phase5_Cases`. Preserve its existing Client-column order. These filters allow a Client row in multiple phases when its linked Cases occupy multiple phases. They use CLIENTROWID, not CLIENTID across weeks.

Keep **Cases for this TIC Week** and **Prior Cases** sections. Current-week Cases belong to the selected CLIENTROWID; prior Cases share CLIENTID but have a different CLIENTROWID. Do not merge Client rows or restore global one-phase-only routing.

## Live verification: not yet performed

No operational records are fixtures. Identify an explicitly fictional Client row approved for this test before any live generation. The user, not Codex, runs the following through AppSheet after installation:

1. Record its CLIENTROWID and initial linked Case count privately. Use its existing approved synthetic eligible-case text. If it has no such text, agree the exact fixture content first rather than altering operational notes.
2. Select Generate Cases once; wait for automation completion and sync. Verify linked keys, CHARGECLASS O or A–E, canonical court, CASEPHASE Request, visible warnings, and a non-Pending history result or explicit Error. A match is advisory, not an eligibility decision.
3. Select Generate Cases again after the timestamp advances, wait, and sync. The linked Case count and CASEIDs must stay unchanged. The bot may refresh history but must create zero additional Cases.
4. On a separate approved no-number synthetic fixture, Generate Cases creates no row; Add Case opens the parent-prefilled manual form. Cancel it without saving.
5. With approved fictional split-phase Cases, verify that one Client appears in Request and Graveyard as appropriate without modifying siblings. Inspect the current views first; do not create live test Cases merely to fill a queue.
6. Report the saved AppSheet version and those results. Do not run a Gmail importer as part of this test. Do not delete fixture Cases or reset source data without a separately agreed cleanup scope.

## Remaining boundaries

- Current AppSheet form/view configuration has not been inspected through an editor tool. The expressions above are prepared, not saved or UI-verified.
- The uploaded Voice importer's 500-thread cap is preserved. A capped scan leaves its checkpoint unchanged and reports incomplete; repeated capped windows can remain backlogged. Tests do not claim progress beyond that limit. This task does not install or run the Voice importer.
- The generator still follows the existing requested behavior of parsing the Client's ELIGIBLECASES/ELIGIBLENOTES and creating Request Cases; it does not decide eligibility, merge identities, send messages, or submit court requests.
