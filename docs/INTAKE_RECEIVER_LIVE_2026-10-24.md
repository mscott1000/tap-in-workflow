# AppSheet intake receiver — 2026-10-24

Implemented in the existing app `4f5da70c-4818-4b2d-82cf-3a668bd8276e`, signed in as mason.scott1000@gmail.com. Receiving-side configuration was tested through app version 1.000399. Gmail was not connected; no mailbox permissions or changes to other accounts/scripts were made.

## Receiving contract

The receiver accepts extracted intake fields in the existing `Clients` table. Reuse the original Jotform email parser and its name, phone, DOB and address normalization rules; `integrations/gmail-phase-two-importer.gs` contains that parser. Its existing direct-sheet transport is NOT the native AppSheet receiver and has not been installed by this work.

Map parsed name to FirstName/MiddleName/LastName; dob to DOB; phone to Phone; email to Email; address to Address; race to Race; gender to Gender; heardHow to ReferralSource. Preserve warrant location, missed court circumstances and other questions in Notes. Set OnlineForm to `Yes`, supply received dates in FirstContactDate/DateFormSubmitted, and use the upcoming Tuesday for TICWeek. The existing Clients defaults also supply dates/week where appropriate. Reuse one ClientRowID for retries of the same intake, such as a key derived from its message ID. Leave ClientID blank unless the existing identity is already known.

## Saved native behavior

Bot: `Intake Receiver - Phase 2` (ID `9a53ebeb-9d51-445c-a59c-3fe827cc51e2`).

Event: `Receive formatted intake`, App event, Clients table, Adds only. Condition:

```appsheet
AND([OnlineForm] = "Yes", ISNOTBLANK([FirstName]), OR(ISNOTBLANK([Phone]), ISNOTBLANK([Email])))
```

Process executes two existing-data actions in order:

1. `Intake - Create Client Identity`: adds to ClientIdentities only when the resolved ID is absent. Resolves the ID with `IF(ISBLANK([ClientID]), CONCATENATE("intake_", [ClientRowID]), [ClientID])`. Copies names, DOB, phone, email, address and current weekly row link, plus legacy fields needed by that table. Copies submission date explicitly. If Log is blank, uses `Intake form received.`. No person matching or automatic merging by name is performed.
2. `Intake - Place Client in Research`: sets ClientID to the same resolved ID, ClientPhase to Research and ClientStatus to Check Cases. Preserves existing TICWeek and received dates, supplying defaults if blank.

Both actions are hidden. Clients.ClientID remains hidden, is editable by the receiving action, and has Required_If `[OnlineForm] <> "Yes"` so online intake can be linked after its initial save.

Legacy ClientIdentities fields ClientStage, PriorTICClient, PhoneNumber, EmailAddress and Notes use Required_If `NOT(STARTSWITH([ClientID], "intake_"))`. This avoids requiring a legacy phase, a researched prior-client decision, duplicate contact aliases, or optional notes before an incoming identity can exist. The canonical Phone/Email fields receive the source contact values. Other identities retain their prior requirement behavior.

Clients.Address is Text so incoming street-address text is preserved instead of being replaced by geocoding.

## Verification

- Original importer synthetic unit tests passed for HTML/plain-text parsing, Phase 2 payload mapping, message retry behavior, Tuesday defaults, unrelated mail exclusion and literal-text handling. These are local simulated tests, not proof of a Gmail connection.
- A fictional intake was accepted by the app; after correcting the legacy required-field dependencies, the process linked its generated ClientID and persisted Research / Check Cases.
- A fresh minimal fictional intake with phone but no email, DOB, Log or Notes triggered the native bot automatically. Automation Monitor reported Complete. Persisted data showed a linked intake-prefixed ClientID, Research / Check Cases, and the full street address unchanged.
- Test data is fictional. The `Intake_Receiver_Form` reference view was used to submit samples. It remains in the app; automated approval review rejected its deletion as not explicitly authorized. It has no primary/menu navigation entry.

## Remaining boundary

This completes the receiving-side processing of extracted intake fields. Gmail acquisition and the transport from email parsing into the app remain disconnected and untested. Writes directly to Google Sheets do not, by themselves, constitute App events. Any eventual sender must invoke a supported AppSheet path that triggers this receiver (or explicitly invoke equivalent processing), rather than assuming a direct-sheet append triggers it. Do not enable the old script's Gmail read/mark-read/trigger functions or modify another account as part of this receiving-side work.
