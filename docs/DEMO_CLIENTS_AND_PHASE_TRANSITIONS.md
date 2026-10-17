# Demo clients and phase transitions
Updated 2026-10-17.

## Added and verified in the existing app
Six fictional clients were appended to Clients!A5:I10, six matching service episodes to ServiceEpisodes!A6:G11, and five fictional cases to Cases!A8:K12. Original records were preserved. IDs use DEMO prefixes; case numbers use DEMO-ONLY prefixes; case notes explicitly identify fictional scenarios. Contact details are fictional and emails use example.org.

| Client | ClientID | Current view(s) | Scenario |
| --- | --- | --- | --- |
| Casey Rivera | DEMO-C101 | Intake | First contact, intake outstanding, no cases, DOB/email/address blank |
| Riley Chen | DEMO-C102 | Research | Completed intake, research outstanding, no cases yet |
| Quinn Patel | DEMO-C103 | Request | One researched/confirmed case; request draft ready, not yet submitted |
| Sam Ellis | DEMO-C104 | Follow Up | Example court response received; client notification outstanding |
| Robin Hayes | DEMO-C105 | Graveyard | Example decision communicated, current service complete |
| Alex Parker | DEMO-C106 | Request and Follow Up | Florissant case awaiting response; Webster Groves case has response and needs notification |

Case IDs DEMO-CS101 through DEMO-CS105 link respectively to Quinn, Sam, Robin, Alex, Alex. Phases are 3, 4, 5, 3, 4. App preview was synced and each view inspected: Casey in Intake; Riley in Research; Quinn and Alex in Request; Sam and Alex in Follow Up; Robin in Graveyard. Existing Request examples remain.

## How staff move records today
These are the currently installed controls, not automatic event-driven transitions.
- From Intake, Research, or Graveyard: open the client, select Edit, change ClientStage, Save.
- From Request/Follow Up: open the linked client using the client group/ref control, then Edit ClientStage and Save.
- For an individual case: open its row, Edit, change CasePhase, Save.
- Phase 1 to Phase 2: change client stage when intake is completed/manually entered.
- Phase 2 to active: set up researched current cases and set each appropriate CasePhase, then ClientStage = Phase 3/4.
- Phase 3 to Phase 4: change only the responding case to Phase 4.
- After notifying the client of a particular case's outcome: that case may be marked Phase 5, while unfinished sibling cases remain in Request/Follow Up.
- Only when all current matters and required client communications are complete: ClientStage = Phase 5.
Changing a case phase does not currently update ClientStage. Editing ResearchStatus or notes does not currently trigger a phase transition. The ServiceEpisodes tab is not yet an app table and is not a live stage controller.

## Target behavior: staff record events, app derives the phase
This section is a proposed next implementation. Its event fields, completion validation, guided actions, and automatic phase computation are NOT yet installed.

| Staff records | Preconditions | Automatic result |
| --- | --- | --- |
| Intake Completed, with date and source (form or staff entry) | Completed intake attached to confirmed client; ambiguous identity requires review | Client leaves Intake and enters Research |
| Research Complete and Client Confirmation Complete | All current cases reviewed; required consent/court information captured; no unresolved identity/history issue for cases moving toward a request | Client enters active Phase 3/4; ready current cases appear in Request |
| Actual request sent | Successful controlled submission with audit record | Case stays in Request as submitted/awaiting response; do not equate draft readiness with submission |
| Court Decision/Response Received, with received date and outcome | Response verified and attached to that case | Only that case enters Follow Up; sibling cases remain in their own phases |
| Client Notified, with notification date, method, and interaction record | Outcome recorded and required information actually communicated; attempted call/voicemail is not automatically successful notification | This case is completed; client remains active while another current matter is unfinished |
| Final outstanding current matter completed | Every current case has a terminal disposition and required explanation/notification; no other service task remains | Whole client appears only in Graveyard |

### Required details and edge paths
- Use explicit event fields with timestamps, staff identity, and linked interactions. Avoid interpreting arbitrary note text as an event.
- Marking Research Complete should confirm the whole current research scope, including no-case results and ineligible matters, not just one convenient case.
- Clients with no eligible cases or no cases found need a supported closure path: record research outcome, explanation/referrals communicated, and service completion. They should not acquire a fake court request or wait for a nonexistent court decision.
- If a court denies a request, it still counts as a prior submission. Record the denial and client notification; never route that case for another submission.
- Ineligible/researched-only cases have terminal dispositions distinct from submitted cases; notification can mean explaining the ineligibility and referral.
- Historical cases and old service episodes must not block or prematurely close the current service episode. Link events/cases to a current episode before building all-cases-complete logic.
- Require explicit completion for zero-case episodes; an empty case list must not automatically mean service is finished.
- Do not regress an active client to Research merely because another intake arrives. Reopening service requires an explicit current episode while retaining stable ClientID and prior history.
- Prefer computed stage values from structured events, so one saved event consistently changes queue membership. Account for child-case updates when deriving client completion; if bots are used instead, make them replay-safe and reconcile partial updates.
- Review closure confirmation and audit behavior before making phase fields read-only. Keep current manual controls until the replacement is tested end-to-end.
- Phase advancement does not itself transmit a report, send a message, or change a court record. Actual submissions/notifications require their own controlled actions and audit records.

## Next implementation
1. Add structured intake/research/confirmation and per-case response/notification fields, and a current-service-episode relationship.
2. Provide clearly labeled staff actions/forms for those events.
3. Implement automatic stage derivation with tests for mixed case states, no eligible cases, ambiguous history, denied requests, partial notification, returning clients, and duplicate intake.
4. Replace manual phase selection only after those tests pass.
5. Connect the future operational mailbox/graveyard separately, as documented in INTAKE_AND_GRAVEYARD_INTEGRATION.md.
