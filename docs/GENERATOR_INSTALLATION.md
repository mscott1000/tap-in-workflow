# Generator-only update

Prepared 2026-10-30. This task changes only the generator source, its tests, and its installation metadata/documentation. Other working runtime files are preserved byte-for-byte.

See [Client-attached Cases handoff](CLIENT_ATTACHED_CASES.md) for the current phase-free Case model and user-owned AppSheet configuration.

## Behavior prepared and tested

- CHARGECLASS Ordinance maps to O. Recognized class A–E values map to their letters; unknown/unclassified values stay blank with the raw value recorded in RESEARCHNOTES. CHARGETYPE is kept separate and is not inferred from a class letter alone.
- Known court aliases map to the nine observed allowed Sheet court titles. Unknown or conflicting courts get explicit warnings; unsupported titles are not written into the dropdown.
- New Cases have blank CASEPHASE and retain the existing CASESTATUS default **Ready to Refer**. This status does not determine parent Client phase in the intended model. Existing Cases are never reset.
- Every new Case links to the selected CLIENTROWID and its CLIENTID. Repeating generation skips already-linked case numbers and retries the advisory check without duplicating Cases.
- The history function must exist in the same Apps Script project before any Case is appended. The shared script lock is released before calling it. A failed source read reports an error and allows a deduplicated retry. No working dependency file is replaced.
- Missing required headers fail before writes. Literal source text cannot become an appended formula. Warnings are recorded on new Case rows only.
- No supported case number means no draft/placeholder Case is created; the return value directs staff to manual Add Case. A background function cannot navigate the staff browser.

## Single script copy destination

Application: **Google Apps Script**, in a web browser.

Project: **AppSheet Intake**.

Direct project URL, verified from config/project-registry.json:
https://script.google.com/home/projects/12e-XiMzRPQvbJEZ9Xr24wwnvOPoKcqgO8hyRPCi45iiCoZyfnRvmJYkz/edit

Complete repository source: [eligible-cases-install.gs](../integrations/eligible-cases-install.gs).

Target editor file name: **eligible-cases-install**. Add this single combined file in AppSheet Intake if absent. If the file now already exists there, establish whether it has newer source before replacement. No live equality to the legacy Tap In Workflow copy is claimed. Do not replace/delete the legacy file or change its triggers. Do not also paste the separate core/adapter components; that would duplicate definitions.

The user's uploaded source establishes the existing dependency baseline. Leave the other editor files unchanged. This file depends on the existing checkCaseHistory function in AppSheet Intake; the generator checks for it at runtime before writing.

Source is prepared, not installed. Installing and saving source is a user-completed browser action and can immediately affect existing consumers. A final click-by-click walkthrough requires verified editor controls and must follow INSTRUCTION_CLARITY.md; this document identifies exact source/destination and expressions without inventing unobserved control locations.

## AppSheet binding and manual fallback

Existing AppSheet app ID: `4f5da70c-4818-4b2d-82cf-3a668bd8276e`. Partial editor configuration was observed in user-provided recordings; full generator action/bot configuration remains unverified. The following are prepared configuration values, not claims about saved configuration.

For the existing generator bot draft, use updates on Clients with condition:

```appsheet
AND(
  ISNOTBLANK([_THISROW_AFTER].[CaseGenerationRequestedAt]),
  [_THISROW_BEFORE].[CaseGenerationRequestedAt] <> [_THISROW_AFTER].[CaseGenerationRequestedAt]
)
```

Script project: AppSheet Intake. Function: `createEligibleCasesForClient`. Parameter `clientRowId`: `[ClientRowID]`. The existing generator action, to be displayed as **Create Cases**, sets CASEGENERATIONREQUESTEDAT to `NOW()`. Reuse the existing equivalent bot rather than creating a duplicate.

The user confirmed the existing form view is **Case_Form**. A Clients action named **Add Case** can open it with:

```appsheet
LINKTOFORM(
  "Case_Form",
  "ClientRowID", [ClientRowID],
  "ClientID", [ClientID]
)
```

This is a manual fallback available to staff, not an automatic redirect after the asynchronous bot. No new form or work-row type is needed. Show generated RESEARCHNOTES warnings in the existing Case detail without hiding the editable field or resetting unrelated field order.

## Verification still pending outside the repo

No live generator was installed or run. No AppSheet configuration was saved. An explicitly fictional live fixture must be identified before the user runs generation; a repeated run must preserve linked Case count and CASEIDs. Operational records are not test fixtures. Current Request/Graveyard presentation remains an editor verification task, with existing layouts preserved.
