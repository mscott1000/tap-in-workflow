> **Latest work:** [2026-10-30 generator handoff](../docs/GENERATOR_HANDOFF_2026-10-30.md). Script uploads are archived with hashes; code is prepared and tested, not newly installed.

> **Current workflow:** Read [Current project](../docs/CURRENT_PROJECT.md) and [Script installation](../docs/SCRIPT_INSTALLATION.md) first. GitHub holds maintained code; the user copies only approved changed files into Apps Script. Dated live-installation notes below are historical checkpoints, not proof of today's installed code. The 2026-10-30 handoff records reconciled uploads and tested generator changes.

# Tap In Center integrations

## History-check requirements (approved 2026-10-26; Client wording reconciled 2026-10-30)

These checks are ADVISORY ONLY. They do not merge people, change eligibility,
block submission, filter exports, or carry over the old cell-based whitelist.
Staff decide what to do after inspecting a match.

### Historical sources (read only)

Workbook: Intake 2026, ID 1TPCAM7rJ9e_YDLrgI4YfjOq_QXZFfo6Sj6c9g9qPth4.

- TIC Graveyard: B First Name, C Last Name, E DOB, H Phone Number.
- TIC Graveyard F is the only historical case-number source. Its cases WERE
  submitted previously. G and all other case-number columns are excluded.
- Completed Call Log: search each cell C:S for phone numbers, including row 1.
  This tab starts with data, not a header.
- Compare names/DOBs and phone digits without changing any source formatting.
  US country code 1, separators and bidirectional marks are ignored for phones.
  Multiple phones in one cell are extracted individually.
- Punctuation/capitalization/spacing/accent changes and alternate names are
  normalized for candidate review. Exact name/DOB and phone-only hits can be
  presented, but identity is never automatically confirmed or merged.
- Case matching retains the original uploaded script's complete identifier
  patterns and case-sensitive comparison. A base case is not its -01 suffix.
  Missing or unsupported current numbers produce Error, never a clean result.
- Other rows in Cases are also checked for an AppSheet duplicate, excluding the
  current CaseID. Court/identity still require staff review.

### Exact displayed titles and states

Clients: existing PriorTICClient column, displayed as **Previous Client Check**:

- Pending (default)
- No Client Match
- Match - Awaiting Confirmation
- Repeat Client Confirmed
- Error

Dismissed person candidates result in No Client Match when all current matches
have been dismissed. Confirmations/dismissals are per candidate, with reviewer
and time. Changed identifying inputs get fresh review candidates; old audit rows
remain intact and are filtered out of current-match lists.

Cases: virtual RepeatCaseCheck, displayed as **Repeat Case Check**:

- Pending
- No Case Match
- Match Found - Awaiting Confirmation
- Duplicate AppSheet Entry
- Error

Historical matches take display precedence over AppSheet duplicates; both stay
in the evidence list. No automatic exclusion or gated submission is permitted.

### Code and storage

- identity-review-core.js: pure normalization, candidate and advisory-state rules.
- identity-review-adapter.gs: shared row checks and once-daily refresh.
- gmail-phase-two-importer.gs: independent Gmail importer plus history hook.
- identity-review-core.test.js and gmail-phase-two-importer.test.cjs: synthetic
  tests. No operational client records or historical values are stored here.

The adapter uses Clients, Cases, ClientRowID and CaseID only. Existing
IdentityCandidates and CaseMatchCandidates tabs hold candidate rows and hidden
check-summary rows. SourceFingerprint records the checked input signature;
stable candidate IDs also incorporate the historical record content so a source
row move does not discard an existing review decision. SourceRow is updated on
the next check to keep historical links current. Staff must still verify the
linked record if the source has been rearranged since the last check.

AppSheet virtual HistoryCheckInput helpers and filtered PreviousClientMatches /
RepeatCaseMatches lists require no Clients/Cases sheet-schema regeneration.
Case results are derived from current evidence and the check-summary row.
The adapter writes only PriorTICClient and PriorTICClientReason on Clients, plus
the two review tabs. It never modifies Cases or either historical source tab.

### When checks run

- runIngest calls runTICIntakeChecks after releasing the import lock.
- New imports and interrupted Pending imports request their own checks.
- The existing import schedule supplies at most one full refresh per Chicago
  calendar day, including one failed-source attempt. No extra minute polling or
  separate high-frequency matching trigger is created.
- AppSheet client add/update events should call checkClientHistory(ClientRowID)
  only when first name, last name, DOB or phone changes.
- AppSheet case add/update events should call checkCaseHistory(CaseID) when case
  number or jurisdiction changes. Counterpart cases are rechecked as well so an
  old duplicate warning clears when the duplicate is corrected.
- IdentityCandidates review-decision updates should call checkClientHistory.
- A completed background check is shown in a user's app after sync.

### Live status at the authorization checkpoint

The shared standalone Apps Script project **AppSheet Intake** is:
https://script.google.com/home/projects/12e-XiMzRPQvbJEZ9Xr24wwnvOPoKcqgO8hyRPCi45iiCoZyfnRvmJYkz/edit

The three tested code files are saved there as appsheet-intake-forms.gs,
history-match-core.gs and history-match-adapter.gs. Readback matched the tested
local code. The importer is still owned/authorized by the intake mailbox account;
its existing trigger has not been changed or recreated by the editing account.

The AppSheet title/options for Previous Client Check and the new virtual helpers,
case check and evidence-link columns have been saved without schema regeneration.
A Clients event/script task is staged as an UNSAVED draft at the Authorize step.
It is not active. AppSheet requires authorization of this script project before
the function/parameter binding and event bots can be completed. Do not authorize
a broader Gmail permission silently: this shared project also contains Gmail code.
The case/review event bots, staff confirmation/dismissal actions, final view
placement, warning format rules and end-to-end live verification are unfinished.
No claim is made that scheduled matching is operational until an actual owner-
trigger execution and its results have been verified.

## Independent Gmail intake importer

The AppSheet importer runs alongside google-intake-form-auto-add in a SEPARATE
Apps Script project. Never paste it into the original project's global scope,
replace the old importer, or change the old trigger.

It searches subject:"Intake Form -" newer_than:3d whether read or unread. It does
not mark emails read/unread, label, archive, delete or send them. Message ID
supplies ClientRowID and a retry-safe new ClientID. It creates a ClientIdentities
row and a linked Clients row with ClientPhase Research and ClientStatus Check
Cases; it does not create Cases or merge returning people.

Default paging is 50 threads, with at most 50 new Client rows per run. A first
run can include matching already-read notifications from the previous three days.
A Gmail thread returned by the query can contain older messages; uniqueness is
per message, not per person or TIC week.

### Intake mapping

| Email question | Clients destination |
| --- | --- |
| Your Name | FirstName, MiddleName, LastName |
| Current Address | Address |
| Phone Number | Phone |
| Email Address | Email |
| Date of Birth | DOB |
| What gender do you identify as? | Gender |
| What is your race? | Race |
| What county or city was the warrant issued in? | Location |
| Please explain the circumstance for the missed court date | ReasonMissingCourtCategory |
| How did you hear about the Tap In Center | ReferralSource |
| Do you have any other questions for the Tap In Center? | Notes, combined with Location |

First token is FirstName; last token is LastName. A final Jr/Jr./Sr/Sr. is
excluded when a separate last-name token remains. Intervening tokens are
MiddleName. Full first/last name and a valid four-digit DOB are required for a new
import; incomplete notifications remain untouched for correction and are counted
as skipped in the execution log. Existing contact requirements remain unchanged.

Notes is exactly Location + " | " + the other-questions answer, including the
separator when an answer is blank. Existing phone/address/date normalization is
preserved. PriorTICClient begins as Pending.

## Synthetic verification

Run the two repository test scripts in a development runtime. They cover all
intake mappings in HTML and plain text; suffix names; exact Notes formatting;
required identity data; independent importer order/read state; retry safety;
pagination; message deduplication; historical phone/name/DOB matching; row-1
call-log data; F-only submitted cases; exact suffixes; source permission errors;
staff review persistence; edited inputs; duplicate counterpart refresh; and one
daily refresh. These tests do not establish live Gmail authorization, owner
trigger operation, AppSheet licensing or app-bot authorization.

