# Current Tap In project

Updated: 2026-10-30, America/Chicago. Current work: case generator repairs and script reconciliation. Start with [NEXT_STEPS.md](NEXT_STEPS.md) for remaining work and [the dated handoff](GENERATOR_HANDOFF_2026-10-30.md) for complete expressions and installation steps.

## Scope and authority

Improve the existing AppSheet app and Google Sheet. Preserve Jotform, staff layouts, archives, keys, record links, ownership, existing scripts, and triggers. Latest explicit user instructions control. GitHub maintains complete source; user installs changed files through Apps Script. No automated login/publishing or operational script runs.

Exact resources are in `config/project-registry.json`; dated physical headers and validation evidence are in `config/live-schema.snapshot.json`. Historical **Intake 2026** remains read-only. It contains operational personal/legal information; never commit records, message bodies, transcripts, credentials, or live dumps.

## Current directions

- A Client row (`Clients`) is a person's work record for a TIC week. Cases belong to it through CLIENTROWID. CLIENTID links identity across weeks; CASEID identifies a Case.
- Phase titles: Intake, Research, Request, Follow Up, Graveyard. Cases move independently. Need to Text, Need to Call, Confirmation Pending preserve CASEPHASE.
- Request and Graveyard should show Client rows, as Research and Follow Up do. A Client can appear in multiple phases when its child Cases occupy them. Column order remains user-managed; no global one-phase-only routing.
- Detail sections: **Cases for this TIC Week**, **Prior Cases**. Returning people receive a new Client row for a different TIC week. No automatic identity merges/confirmation.
- ClientIdentities is hidden support, not another staff queue. Outreach normally has no Cases, but do not hide typo/error records through restrictions.
- History matching is advisory only: no eligibility decisions, submission gates, automatic submissions/messages, or identity merges. No draft-row work type.
- Preserve `reference/TERMINOLOGY_V1_2026-10-23.md` unchanged. Later decisions live here.

## Completed this task

| Area | Verified state |
| --- | --- |
| Environment | Running with tap-in-workflow checkout; environment-creation checklist is no longer a next step. UI publication controls not inspected. |
| Google Drive | Connected tools can read/edit the exact working Sheet. Headers of Clients and Cases match the snapshot; Sheet timezone is Etc/GMT. |
| Sheet repair | All 978 validation rules at Cases!K2:K979 changed from Phase 1–5 to Intake, Research, Request, Follow Up, Graveyard and read back. No record values or layouts changed. |
| Uploads | Four exact user-supplied scripts are preserved with SHA-256 hashes in integrations/source-snapshots/2026-10-30/. User identifies them as current connected Drive scripts; independent installed-source equality is not claimed. Consult them before requesting scripts again. |
| Reconciliation | Maintained intake/voice copies preserve the uploads; history copies preserve Client wording/status and GMT-equivalent workbook date handling, correcting a false same-TICWeek reason. Client pending-match wording is Match - Awaiting Confirmation; Case wording remains Match Found - Awaiting Confirmation. |
| Generator code | CHARGECLASS mappings and nine live Sheet court titles implemented. Unsupported values remain blank with source warnings. Missing dependencies/headers fail before writes. History is co-located in intended AppSheet Intake project, called after lock release, and retried without duplicates on a repeat request. Source-read failures report Error and reject the bot task for a safe retry. |
| Manual fallback | No supported case number creates no Case; result requests manual Add Case. Parent-prefilled action/form and warning/repeat-check expressions are fully prepared in the handoff. Background scripts cannot navigate a staff browser. |
| Verification | Six synthetic suites and source/configuration checks required. Adapter tests cover repeated generation, failure recovery, missing dependency/header, mappings, warnings, and literal values. Mock success does not establish installed or live behavior. |

Live Sheet configuration changed: **yes**, validation only. Live record values changed: **no**. Apps Script installed/run: **no**. AppSheet saved/verified: **no**.

## Last independently observed AppSheet/editor state — October 29

- Saved version 1.000584. Saved bots: Intake Receiver - Phase 2; Update CLIENTPHASE when CLIENTSTATUS changes.
- Generate Cases on Clients updates CASEGENERATIONREQUESTEDAT. Generator bot was an unsaved draft; no saved generator bot verified.
- AppSheet Intake had appsheet-intake-forms, history-match-core, history-match-adapter, voice-communications, and no generator. Tap In Workflow contained eligible-cases-install but lacked co-located history checks. This task prepares a new combined generator in AppSheet Intake and leaves the legacy project untouched.
- CHARGECLASS AppSheet Enum: A, B, C, D, E, O, other values disabled. Current Sheet additionally allows Unclassified; generator does not output that unsupported AppSheet value.
- Graveyard was observed pointing to Phase5_Cases; Phase5_Clients already had Client-or-child-case routing. Current Request/Graveyard editor state requires inspection.
- Broad Gmail/Sheets/background runtime consent was not completed. User completes actual required consent; no deployment credentials.

## Unfinished and user-only work

Install the three changed files, save/bind the generator and manual-Case history bots, configure manual Add Case and display expressions, inspect Client-row Request/Graveyard sources, and run an explicitly agreed fictional live fixture twice. Exact steps are in the dated handoff; no further code development is deferred to the user.

Current editor access is unavailable through connected tools. No fixture was agreed or live script run authorized. The uploaded Voice 500-thread cap is preserved and can remain backlogged on repeated full windows; this task tests and documents the limit, not a new Voice design.

Repository code is prepared, not installed. The generator's manual fallback is an explicit staff action, not an automatic browser redirect. No live end-to-end success is claimed.
