# Current Tap In project

Updated: 2026-10-29, America/Chicago. Recheck dated observations before new writes.

## Scope and authority

Improve the existing AppSheet app and sheet. Preserve Jotform, staff layouts, archives, record links, and ownership.
The latest explicit user request controls. This record separates desired behavior from verified state. Older docs are historical.
GitHub becomes the code-release authority only after reconciliation with live source. Until then, publication is blocked.

## Terms and current directions

- Client row: parent work record for a person during a TIC week; table `Clients`.
- Case row: court case linked to its parent by CLIENTROWID; table `Cases`.
- CLIENTID connects identity across weeks; CLIENTROWID identifies a Client row; CASEID identifies a Case.
- `ClientIdentities` is hidden identity support, not a second staff queue.
- Detail sections: **Cases for this TIC Week**, **Prior Cases**.
- Returning people get a new Client row for a different TIC week. No automatic identity confirmation/merging.
- Preserve reference/TERMINOLOGY_V1_2026-10-23.md unchanged. Later decisions are recorded here, not silently written into that agreement.
- Phase titles: Intake, Research, Request, Follow Up, Graveyard. Do not route using numbered aliases.
- Client rows may appear in multiple phases when linked Cases occupy those phases. Do not restore the older global one-phase-only design.
- Latest direction makes Request Client-row-based like Research, Follow Up, Graveyard. Column order is user-managed. Requested does not mean installed.
- Cases move independently. Need to Text, Need to Call, Confirmation Pending preserve CASEPHASE.
- Outreach normally has no Cases; do not enforce restrictions that hide typo/error records.

## Resources and account boundaries

Exact IDs: ../config/project-registry.json. Physical headers: ../config/live-schema.snapshot.json.
The working sheet **Tap In Center — AppSheet System** may contain operational personal/legal data. It is not a fictional test database.
Historical workbook **Intake 2026** stays read-only. Relevant submitted cases: **TIC Graveyard**, F only. Phone sources: H there and C:S in **Completed Call Log**, including row 1.
Keep mailbox operation under the Tap In account. Never recreate its scheduled importer under a personal account during deployment.

## Last observed live state: 2026-10-29

| Area | Observation | Remaining work |
| --- | --- | --- |
| AppSheet | Saved version 1.000584. Saved bots: Intake Receiver - Phase 2; Update CLIENTPHASE when CLIENTSTATUS changes | Reinspect before edits |
| Generate Cases action | On Clients; updates CASEGENERATIONREQUESTEDAT | Inspect full Add Case fallback |
| Generator bot | Unsaved draft only; no saved live generator bot verified | Bind, save, and test after user auth |
| AppSheet Intake project | Four files: appsheet-intake-forms, history-match-core, history-match-adapter, voice-communications. No generator | Reconcile exact live source |
| Tap In Workflow project | eligible-cases-install contains createEligibleCasesForClient(clientRowId) | Its history-check dependency is in the other project |
| CHARGECLASS | AppSheet Enum A, B, C, D, E, O; other values disabled | Generator returns raw class text; resolve mapping |
| Source CASEPHASE validation | Numbered names remain while routing map uses phase titles | Narrow repair after inspection; no schema reset |
| Graveyard | Earlier view observation: Phase5_Cases; Phase5_Clients already has Client-or-child-case filter | User wants Client rows; recheck current view |
| Consent | Email sharing approved; broad Gmail/Sheets/background consent not completed | Runtime and deployment auth unverified |

## Candidate code and tests

This setup preserves available workspace copies of the communication importer and case parser/adapter/tests. They are **reconciliation candidates**, not newly deployed code.
The combined generator has the structure inspected in Tap In Workflow; byte-for-byte equality to current live source is not claimed.
Known generator gaps: CHARGECLASS mapping, court-name normalization, missing co-located history checker, and fallback that cannot navigate the staff browser to a manual form.
Adding release tooling does not repair these functional defects.
Synthetic tests prove behavior under mocks, not live permissions, scheduled execution, valid AppSheet rows, or end-to-end operation.

## Release state

Publication is disabled in ../config/deployment-targets.json. No verified live baseline or deployment credential is configured.
Manual workflow: plan is offline; inspect is read-only and requires user-configured auth; apply requires enabled/reconciled target, matching live baseline, and exact approved bundle.
Publishing never runs importers, creates Cases, changes triggers, edits AppSheet settings, or submits records.

## Remaining work

1. User completes USER_SETUP.md: auth, secure credentials, full live-source reconciliation, and saved cloud environment. No login step is part of this setup task.
2. Resolve generator mappings, history integration, manual Add Case fallback, and specific field warnings/repeat-check display. No draft-row type.
3. Save the AppSheet timestamp-change bot passing CLIENTROWID to the correct function.
4. Verify Client-row presentation in Request/Graveyard without resetting custom columns.
5. Run an explicitly approved synthetic live test and repeat it to prove deduplication. Do not test on operational records.

## Repository-control setup

Prepared: current context, resource registry, preserved candidate code/tests, credential-free CI, guarded manual release tooling, and user setup checklist.
Deliberately deferred: login, new permissions, live deployment, app saves, trigger changes, database writes, and published cloud-environment configuration.

Local verification: all five synthetic suites passed; project/source checks passed; both workflow YAML files parsed; offline plan made no Google request; an apply attempt was refused by the disabled-publication gate. These are not live-runtime verification results.
