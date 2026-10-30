# Tap In App Schema and Terminology — Source of Truth

**Status:** Authoritative  
**Version:** 1.0  
**Effective date:** 2026-10-23  
**Owner:** Mason Scott / Tap In Center

## Authority and change control

This document supersedes every earlier Tap In App naming proposal, including proposals in prior chats, handoff notes, formulas, screenshots, and prototype instructions.

Future work must use this document as the terminology and relationship source of truth. It may be changed only when Mason explicitly says to **amend the Tap In App source of truth**. A change must increase the version number and record the amendment in the changelog. Ordinary brainstorming, legacy names found in AppSheet, or an assistant's suggestion does not amend it.

## Canonical language

Only these staff-facing record terms are valid:

- **Client** or **Client row**: the parent work record for one person during one TIC week.
- **Case** or **Case row**: one court case belonging to one Client row.
- **Add Case**: creates a Case row already linked to the Client row from which the action was opened.
- **Edit Client**: edits the selected Client row and therefore the shared client information displayed with its linked Case rows.
- **Cases for this TIC Week**: Case rows linked directly to the selected Client row.
- **Prior Cases**: Case rows connected through the same hidden `CLIENTID` but linked to a different Client row.

The terms **ClientInstance**, **Client Instance**, **ServiceEpisode**, **Service Episode**, and **Episode** are retired. They must not appear in staff-facing labels, view names, actions, instructions, or newly created technical objects.

## Identity model

Three identifiers have separate purposes:

| Data point | Meaning | Staff visibility |
|---|---|---|
| `CLIENTID` | Stable identity shared by records believed to represent the same person across TIC weeks. | Hidden |
| `CLIENTROWID` | Unique key for one Client row in one TIC week. | Hidden |
| `CASEID` | Unique key for one Case row. | Hidden |

Rules:

1. One person may have multiple Client rows over time.
2. A Client row represents one `CLIENTID` during one `TICWEEK`.
3. There may be no more than one Client row for the same combination of `CLIENTID` and `TICWEEK`.
4. A near identity match never merges automatically. It creates a match candidate for staff verification.
5. Confirming a match assigns the established `CLIENTID`. Rejecting a match creates a new `CLIENTID`.
6. Editing one Client row does not silently overwrite a different TIC week's Client row.

## Canonical tables

### `ClientIdentities` — hidden identity registry

One row per stable person identity.

Required core data points:

- `CLIENTID` — key
- normalized identity/search values derived from name, DOB, phone, email, and other contact information
- match-review metadata as needed

This table is technical and is not a staff work queue.

### `Clients` — visible parent work records

One row per person per TIC week. This is the only table whose records are called Client rows.

Required core data points:

- `CLIENTROWID` — key
- `CLIENTID` — Ref to `ClientIdentities`
- `TICWEEK`
- `FIRSTNAME`
- `MIDDLENAME`
- `LASTNAME`
- `DOB`
- `PHONE`
- `EMAIL`
- address/contact data
- shared staff notes
- assignment data
- `CLIENTSTATUS`
- `CLIENTPHASE`

### `Cases` — child work records

One row per court case.

Required core data points:

- `CASEID` — key
- `CLIENTROWID` — required Ref to `Clients`
- `CLIENTID` — hidden derived value: `[CLIENTROWID].[CLIENTID]`
- `JURISDICTION`
- `CASENUMBER`
- `CASEKEY` — normalized duplicate-checking key
- `CASESTATUS`
- `CASEPHASE`
- research, eligibility, request, decision, notification, and court-date data

Rules:

1. Every Case row belongs to exactly one Client row through `CLIENTROWID`.
2. A Case row inherits the displayed name, DOB, contact information, and shared notes from its parent Client row; those values are not maintained as competing copies on each Case row.
3. A Case may be submitted to Tap In only once, regardless of outcome.
4. `CASEKEY` must be checked against active Case rows and the TIC Graveyard before a new Case is accepted as unique.

### `Interactions` — contact history

One row per recorded interaction.

Required core data points:

- `INTERACTIONID` — key
- `CLIENTROWID` — Ref to `Clients`
- `CASEID` — optional Ref to `Cases` when the contact concerns one specific case
- interaction date/time
- contact method
- staff member
- summary
- recommendation or next step

### `StatusPhaseMap` — status routing

One row per routable `CASESTATUS`.

Required data points:

- `CASESTATUS` — key
- `DISPLAYPHASE` — the destination phase

Canonical status routing:

| `CASESTATUS` | `DISPLAYPHASE` |
|---|---|
| Sent Form | Intake |
| Just Browsing | Intake |
| Check Cases | Research |
| Researched - Ready to Contact | Research |
| Ready to Refer | Request |
| Decision in Progress | Follow Up |
| Follow Up - Approved | Follow Up |
| Follow Up - Denied | Follow Up |
| Complete - Approved | Graveyard |
| Complete - Denied | Graveyard |
| Complete - Ineligible | Graveyard |
| Complete - NPC | Graveyard |
| Complete - Referred to City TIC | Graveyard |
| Need to Text | Preserve existing `CASEPHASE` |
| Need to Call | Preserve existing `CASEPHASE` |
| Confirmation Pending | Preserve existing `CASEPHASE` |

`DISPLAYPHASE` must use the actual phase titles above, not parallel values such as “Phase 1” through “Phase 5.”

### `HistoricalCaseIndex` — TIC Graveyard search index

Read-only or automation-managed reference data used to detect prior Case submissions and display historical matches. It is not a second editable Cases table.

### Technical support tables

The following may exist but must remain hidden from staff navigation:

- `IdentityCandidates`
- `CaseMatchCandidates`
- `PhaseBoardRows`
- `ExportSelections`

`PhaseBoardRows` is a display projection only. It does not own Client or Case information. Its canonical references are `CLIENTROWID` and `CASEID`; it must not introduce a third kind of client record.

## Parent/child relationship

The authoritative relationship is:

`ClientIdentities[CLIENTID]` → `Clients[CLIENTID]` → `Cases[CLIENTROWID]`

In plain language:

- `CLIENTID` connects the same person across weeks.
- `CLIENTROWID` identifies the current week's Client row.
- `CASEID` identifies one Case belonging to that Client row.

## Phase behavior

The five phase titles are exactly:

1. **Intake**
2. **Research**
3. **Request**
4. **Follow Up**
5. **Graveyard**

Rules:

1. Client rows may appear in all five phases.
2. Case rows may technically appear in all five phases so an error does not make a Case disappear.
3. In the normal workflow, Case rows are first created during Research, not Intake.
4. Wherever a Case row appears, its interactable parent Client row must appear directly with it.
5. One Client row may appear as a parent in more than one phase when its Case rows occupy different phases.
6. Changing `CASESTATUS` updates `CASEPHASE` according to `StatusPhaseMap`.
7. `Need to Text`, `Need to Call`, and `Confirmation Pending` do not move a Case; they preserve its existing `CASEPHASE`.
8. Nonlinear movement is allowed and must never delete or hide a record from diagnostic access.

## Canonical views and actions

Staff-facing view names:

- `Client_Detail` — displayed as **Client**
- `Client_Form` — displayed as **Add Client** or **Edit Client**, depending on context
- `Case_Detail` — displayed as **Case**
- `Case_Form` — displayed as **Add Case** or **Edit Case**, depending on context
- **Intake**
- **Research**
- **Request**
- **Follow Up**
- **Graveyard**

Required Client detail sections:

1. **Cases for this TIC Week** — Case rows where `CLIENTROWID` equals the selected Client row's `CLIENTROWID`.
2. **Prior Cases** — Case rows or historical indexed cases with the same `CLIENTID` and a different `CLIENTROWID`.

Required actions:

- **Add Case**
- **Edit Client**
- **Open selected phase row**
- **Add to Export**

System-generated or legacy views containing retired vocabulary must not be used as staff-facing destinations. They may remain temporarily during migration only when hidden and clearly documented for removal.

## Legacy-to-canonical migration map

The following names may be mentioned only while identifying existing objects that must be migrated:

| Legacy object | Canonical replacement |
|---|---|
| AppSheet table `ClientInstances` | `Clients` |
| Google Sheet tab `ServiceEpisodes` | `Clients` |
| `EPISODEID` | `CLIENTROWID` |
| Existing identity-master table `Clients` | `ClientIdentities` |
| System view `ClientInstances_Detail` | `Client_Detail` |
| System view `ClientInstances_Form` | `Client_Form` |
| “ClientInstance” | Client or Client row |
| “Service episode” | Client or Client row |

Migration must be controlled: formulas, references, actions, slices, bots, and views must be inventoried before any physical rename. Until migration is completed, instructions may identify a legacy object once in the form **legacy object → canonical replacement**, but must use the canonical term thereafter.

## Instruction-writing rules

All future implementation instructions must:

1. Use the literal title of every table, slice, view, or action being clicked.
2. Write every data-point reference in ALL CAPS.
3. Use Client and Case in explanatory prose.
4. Never reintroduce retired terminology as a proposed concept.
5. Distinguish clearly between a current legacy title and the canonical target title.
6. State whether a step changes staff-visible wording, backend structure, or both.

## Changelog

- **1.0 — 2026-10-23:** Established Client/Case terminology, hidden identity model, canonical identifiers, phase behavior, status routing, staff-facing views, migration map, and change-control rule. Supersedes all earlier naming proposals.
