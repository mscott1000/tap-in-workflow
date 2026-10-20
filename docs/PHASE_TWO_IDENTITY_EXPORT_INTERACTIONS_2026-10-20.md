# Phase Two case entry, identity, export, and interaction log — approved change specification
_Approved user directives: 2026-10-20. Implementation status: **specified in GitHub, not yet applied to the live AppSheet editor or source spreadsheet**._

## Priority and architectural decisions
This document supersedes conflicting historical handoff instructions, especially the directives to keep `UNIQUEID()`-based ClientID and CaseID indefinitely, to keep Phase Two exclusively as a client-only row view, and to use a freeform editable Contact Log as the source of interaction history. Preserve the existing five phases, status mappings, independent case transitions, court grouping in Request, and historical one-submission-per-case safeguard.

The *client* enters Phase Two from staff entry or the existing/future Jotform-to-Gmail ingestion. Phase Two staff research the client, then add zero or more **Cases rows**, each automatically referencing the existing client and current episode. Each case is separately editable and independently routed to later phases. Do not synthesize cases from multiline client notes, and do not build automatic case-row ingestion at this stage.

## 1. Full Name in Phase Two
- Continue deriving one recognizable name from `Clients.FirstName`, optional `Clients.MiddleName`, and `Clients.LastName`.
- Reuse `Clients._ComputedName`, currently the label, instead of storing a duplicate editable name field. Prefer a whitespace-safe expression:
  ```appsheet
  TRIM(CONCATENATE(
    TRIM([FirstName]), " ",
    IF(ISNOTBLANK([MiddleName]), CONCATENATE(TRIM([MiddleName]), " "), ""),
    TRIM([LastName])
  ))
  ```
- Surface this computed label in Phase Two as **Name** (one column). Keep separate name components editable in the client form.

## 2. Phase Two grouped, independently editable cases
**UI requirement:** show a recognizable client heading, then *one row per case* under that heading. A client with no cases must still appear in Phase Two so staff can add the first case. A case must not become a separate client.

AppSheet standard table views display one row per underlying source row. Therefore merely setting `Group by: Name` on the current client-based Research view **will not** create child case rows. A Cases-based grouped view can show case rows, but by itself **omits clients with zero cases**.

Implement both entry and review without fake cases:
1. Retain a Phase Two **Research Clients** view/slice on `Clients` that displays every client in Research, including those with no Cases.
2. Provide a **Research Cases** table/slice on `Cases`, filtered to current-episode cases belonging to clients still in Research. Group by the client's computed name, e.g. virtual/dereference `[ClientID].[_ComputedName]` labeled **Name**, sort by Name, and put each CaseNumber on its own row. Use a client-reference group heading; when the interface supports inline related cases in a client detail, put that list directly beneath the client's heading.
3. Place a prominent **Add Case** action on each Phase Two client (and/or inline related Cases). Use `LINKTOFORM("Cases_Form", "ClientID", [ClientID], "EpisodeID", [CurrentEpisodeID])` (replace `Cases_Form` with the editor's actual saved form-view name). Prefill and lock the linked ClientID/EpisodeID in the case form; keep CaseNumber, Court, research fields, and initial CaseStatus editable.
4. For a unified visual list that *also* contains zero-case client headers, use a supported client-detail + inline related case layout, or a separate view backed by a purpose-built combined read-only display model. Do **not** rely on native Cases grouping alone to render empty client groups. Do not create placeholder cases to force headers.
5. Keep Request grouped by jurisdiction/court as currently verified, and do not change the existing independent per-case phase formulas.

Acceptance: zero-case client remains visible and Add Case works; a client with three cases shows three separate case rows under the same Name; editing one case does not modify sibling cases; each row opens its own case detail.

## 3. Case # as identifier
- The user requests `Cases.CaseNumber` (visible **Case #**) as the case identifier, rather than a distinct user-visible `CaseID`.
- **Collision preflight is mandatory before changing a physical AppSheet key.** Court systems may reuse the same docket number across jurisdictions; repeated episodes may include the same number again. Check uniqueness, nonblankness, text preservation (including leading zeros), and historical relationships in all existing rows.
- If `CaseNumber` is genuinely unique and always populated, migrate the Cases table key to CaseNumber, update every Ref and any automation that consumes CaseID, and retire CaseID. Do not change the key until references are migrated and validated.
- If docket numbers collide, record the exact CaseNumber as the staff-visible **identifier**, but keep an opaque hidden technical row key (e.g. existing CaseID) *only as required for AppSheet referential integrity*. Never present that technical key to staff or export it as a legal case number. Do **not** silently change, prefix, or invent a docket number to make it unique; seek an explicit business decision before removing the technical key.

## 4. Deterministic ClientID from name + DOB
User-defined business ID: first name, last name, optional middle name/initial, and DOB. Standardize text before joining to prevent superficial duplicate identities:
- Trim surrounding whitespace, collapse repeated interior spaces, and case-fold name components.
- Use all available middle-name text, not just its first character, so distinct available names do not intentionally collapse. Where only an initial is supplied, flag a potential alias to a fuller middle name for human review.
- Serialize DOB unambiguously in ISO `YYYY-MM-DD`, not a locale-dependent date string.
- Proposed readable structure: `FIRST|LAST|MIDDLE|YYYY-MM-DD`. Example (fictional): `TAYLOR|EXAMPLE|Q|1990-01-02`. When middle is blank, preserve the empty separator: `TAYLOR|EXAMPLE||1990-01-02`. The identifier is **sensitive personal data** because it exposes identity and birth date; keep it hidden from staff-facing lists and external exports, restrict access, and never publish it to GitHub.
- In AppSheet, a basic display/key expression can be `UPPER(CONCATENATE(TRIM([FirstName]), "|", TRIM([LastName]), "|", TRIM([MiddleName]), "|", TEXT([DOB], "YYYY-MM-DD")))`. Real canonicalization across Gmail, AppSheet, Sheets and imports must implement the same space-collapsing/normalization rules.
- **Identity migration:** the existing AppSheet client key is an immutable `UNIQUEID()`. Changing the key in-place or using a recalculated App formula can orphan Cases, ServiceEpisodes and Interactions when names are corrected. Build a one-time mapping of old IDs to canonical new IDs, check collisions and missing DOB/name, migrate all dependent Ref values in one controlled cutover, regenerate/verify schemas, and only then change the AppSheet Key property. Back up the fictional prototype first.
- Subsequent name/DOB corrections must use an **explicit transactional rename/rekey procedure** that updates every reference and past-index lookup, or use a persisted immutable ClientID assigned at first complete identity and a separately recalculated name/DOB matching fingerprint. Do not use an App formula that silently changes the key each sync.
- This ID is a **candidate identity match**, not proof two people are the same. Different people can share exact names and DOB; one person can have aliases or data-entry variants. The historical lookup must display reviewable matches rather than automatically suppressing/refusing service solely from this key.

## 5. Add to Export
- Create a staff-facing, case-level **Add to Export** action visible in the eligible case workflow. It marks the selected *case*, never every case attached to its client.
- Add explicit export-membership fields/records (e.g. `ExportSelected`, `ExportSelectedAt`, `ExportSelectedBy`, plus an export-batch/ledger table when a report is actually generated).
- Selecting the action must **not** mean that a court request was sent. Maintain separate `RequestSentDate`, actual submission receipt and immutable one-request-ever history. Never add cases automatically solely because `CaseStatus=Ready to Refer`.
- Action should be idempotent, allow a deliberate removal before submission, and reject already-submitted cases using the authoritative historical case ledger, with appropriate review for ambiguous matches.
- Export uses the existing jurisdiction-specific court workflow. Verify exports contain the required case fields and do not expose technical identifiers.

## 6. Status formatting
- Prioritize text/background colors on the *visible actual* `ClientStatus` and `CaseStatus` cells in each table, for all valid statuses; dropdown-option color is optional.
- Remove format-rule pictograms where AppSheet allows none. The native rendered color swatch/dot is not the format-rule icon. If AppSheet has no setting to replace the native dot with a smaller dot/hyphen, do not claim that it has been changed or use brittle browser-only CSS as an app-wide fix.
- Test all visible status values in Intake, Research, Request, Follow Up, and Graveyard after sync, including cases with no matching format rule. If inconsistent coloring cannot be made reliable, switch all visible statuses to uncolored text consistently.

## 7. Structured contact log using Interactions
Existing sheet: `Interactions(InteractionID, ClientID, EpisodeID, ContactDate, ContactMethod, StaffEmail, Notes, NextSteps)`.
- Treat Interactions as the **source of truth** for contact history; stop using the editable freeform Client/Case Contact Log field as the authoritative store for new entries.
- Staff-facing New Contact form contains exactly **Method, Staff member, Notes**, and **Contact date/time only if it is not captured/displayed automatically**. Prefer automatic timestamp `NOW()` on save; surface that timestamp in every saved contact entry. Hide InteractionID, ClientID, EpisodeID and NextSteps from the form.
- Contact Method should use existing approved methods (e.g. call, text, voicemail, in person, email) rather than inventing a new list. Staff member should use the existing TIC Staff roster; map the visible staff name to `StaffEmail` only if an authoritative mapping is configured. Otherwise create a dedicated StaffName field and retain optional StaffEmail separately.
- New Contact action from a client or case uses `LINKTOFORM` with prefilled `ClientID` and `EpisodeID`. A case-detail contact is still **client-level**, optionally recording CaseNumber only if a future requirement calls for case-specific tagging.
- Order saved contacts chronologically with date/time, method, staff, notes, newest first. Show them on client and case detail, ideally inline. Prevent accidental overwrites/deletions; preserve an audit trail and restrict edits to authorized staff.
- Never remove historical freeform Log/Contact Log data until preserved or explicitly migrated. A temporary read-only legacy history section is acceptable.

## 8. Verification checklist and deployment guardrails
- [ ] Backup source workbook; test exclusively with fictional records.
- [ ] Check old and new client keys and every Cases/ServiceEpisodes/Interactions reference; duplicate names/DOB, omitted middle, changed name, missing DOB.
- [ ] Check uniqueness of CaseNumber across courts and old episodes before changing Cases key.
- [ ] AppSheet shows a zero-case client in Phase Two; staff can create its first case.
- [ ] One client with three cases has one Name heading and three individually clickable rows; no fake case records.
- [ ] Status of one case changes independently; Request remains grouped by Court; all remaining phase transitions still work.
- [ ] Add to Export is case-scoped, idempotent, reversible before submission, and never sends a request by itself.
- [ ] All visible Status values are colored (or uniformly uncolored); native dot limitation documented.
- [ ] Saving a contact creates one Interactions row with date/time, method, staff and notes; detail displays date/time without an unnecessary second picker.
- [ ] Old freeform notes and legacy links remain intact after cutover.
- [ ] Validate court-request date, notification evidence, and one-submission-ever on every write path, including Google Sheets/API writes.
- [ ] No production client data, credentials, or sensitive identifiers committed to GitHub.

## What can and cannot be completed via this repository
GitHub updates can capture the authoritative change specification, tests and code artifacts. The actual AppSheet view grouping, keys, Ref columns, forms, format rules and actions live in the authenticated AppSheet editor. They **are not defined as executable configuration files in this repository**. Updating GitHub alone must never be reported as having changed the live app. Production Gmail intake, graveyard matching, account permissions and the physical spreadsheet migration remain separate access-dependent tasks.
