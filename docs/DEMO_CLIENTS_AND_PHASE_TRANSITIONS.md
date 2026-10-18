# Demo clients and phase transitions
Updated and verified 2026-10-18. All records are fictional. The existing app, client identities and prior examples remain.

See [Workflow fields and automatic phases](WORKFLOW_FIELDS_AND_AUTOMATIC_PHASES.md) for the full source-document field mapping, exact formulas, validation and remaining work.

## Restored examples
| Client | ClientID | Current queue(s) | Practice scenario |
| --- | --- | --- | --- |
| Casey Rivera | DEMO-C101 | Intake | Sent Form; incomplete intake; no cases |
| Riley Chen | DEMO-C102 | Research | Kiddie Pool; newly added DEMO-CS106 is Deep Dive; consent/address Pending |
| Quinn Patel | DEMO-C103 | Request | DEMO-CS101 Ready to Refer; request draft not sent |
| Sam Ellis | DEMO-C104 | Follow Up | DEMO-CS102 Follow Up - Approved; warrant recalled/new date recorded; client notification pending |
| Robin Hayes | DEMO-C105 | Graveyard | DEMO-CS103 Complete - Approved; fictional client notified |
| Alex Parker | DEMO-C106 | Request and Follow Up | DEMO-CS104 Ready to Refer, not sent; DEMO-CS105 Follow Up - Denied, notification pending |
| Avery Morgan | DEMO-C001 | Request | DEMO-CS001 ready; ineligible sibling completed; old episode's completed case retained in history |
| Jordan Lee | DEMO-C002 | Research | Deep Dive; DEMO-CS006 needs verification. Ready DEMO-CS003 remains attached but is withheld from Request while client research remains unfinished |
| Taylor Brooks | DEMO-C003 | Follow Up | DEMO-CS004 Decision in Progress; fictional request sent, court response pending |

There are nine clients and twelve cases. DEMO-CS106 was created through Related Cases > Add and retained as a research example. Its saved ClientID/episode link is DEMO-C102/DEMO-E102. Original example ranges remain, with new workflow columns in Clients!J:AC and Cases!L:AG, and the extra case at Cases!A13:AG13.

The old Alex description “awaiting response in Request” is superseded: a sent request belongs in Follow Up. Alex's Request example is now explicitly an unsent draft.

## How a staff member triggers movement
Open a client or case, select **Edit**, enter the facts/status below, then **Save**. The app calculates phases; staff no longer choose CasePhase or ClientStage.

| From → to | Staff action |
| --- | --- |
| Intake → Research | Complete/manual-enter intake, record DateFormSubmitted, choose client status Kiddie Pool, Save |
| Within Research | Use client Pool Rules / Deep Dive and update linked cases through Related Cases |
| Research → Request | Mark each researched request case Ready to Refer; finish other current dispositions; record consent Yes/address confirmed Yes; choose client Ready to Refer and Save |
| Request → Follow Up | After an actual external request is sent, set that case Decision in Progress, enter RequestSentDate, Save |
| Court response, still Follow Up | Set Follow Up - Approved or Follow Up - Denied; record PA/recall/new-date information and log the response |
| Case completed | After informing the client, enter ClientNotifiedDate, method and notes; choose the appropriate Complete status and Save |
| Last current case → Graveyard | Completing the final current case automatically changes the client queue; no additional client phase edit required |
| No eligible cases / no cases found → Graveyard | Explain/referral outcome, record client Log and choose the appropriate client Complete status; no fake request or court decision required |

Completion choices on the client are withheld if current cases remain unfinished. Ready to Refer is withheld until intake date, consent, address confirmation and case research prerequisites are present. Case notification date and sent-request date requirements are enforced. Notification method/notes should be completed but are not yet required automatically.

To find the client from a case, use View Ref (ClientID). To add a case from Research, open the client and use Related Cases > Add.

## Verified in-app exercises
- Casey could not advance without intake completion date; supplying it moved the same client from Intake to Research.
- Jordan left Research and both ready cases appeared in Request after client-level readiness was saved. Original uncertain case/status restored afterward.
- Quinn could not save Decision in Progress without request date. With the date, the case moved to Follow Up and CasePhase became Phase 4.
- Alex could not complete the denied case without client notification date. Completing that one case left the other request unchanged and did not put Alex in Graveyard. Client Complete choices were absent.
- Completing Alex's last case moved the client to Graveyard. Both cases then restored to the split practice scenario.
- Riley's explicit zero-case completion plus explanation log moved to Graveyard; no Ready to Refer choice was available. Restored to Research, then added a fictional research case via the app.
- Intake Add defaults Sent Form / Phase 1 with blank DOB/intake date; Research Add defaults Kiddie Pool / Phase 2. Both unsaved test forms canceled.
- Final sync and inspection confirmed every queue in the table above.

## Limits
Saving a status records a staff assertion; it does not send a court report/message, verify a legal outcome, enforce the one-request rule, or prove notification delivery. Required dates are basic validation rather than an immutable event audit. Do not use direct Sheet writes to bypass form requirements. The future mailbox/history account, import receipts, court submission ledger, structured interactions and guided returning-client episode workflow remain unconnected/unimplemented.
