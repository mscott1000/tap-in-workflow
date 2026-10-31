# Google Voice scheduling and installation evidence

Verified 2026-10-30 by fetching the official Google documentation over HTTPS. Documentation evidence establishes supported controls; the user's authenticated editor was not inspected. The user subsequently completed installation and activation; see [live verification](VOICE_LIVE_VERIFICATION.md). This page records documentation evidence rather than authenticated-screen inspection.

## Selected cadence

The user explicitly selected **one-minute Apps Script polling** on 2026-10-30. The prior 15-second request is superseded. Source and synthetic tests now implement the incremental importer and explicit one-minute timer helper. Live installation and activation are now complete, user-confirmed; preserve the working state and timer. VOICE_INSTALLATION.md remains a reference.

## Earlier requested cadence (historical)

The user requested **every 15 seconds**, replacing the earlier five-minute proposal. This is the desired cadence, not an installed or supported native Apps Script recurring interval. Do not silently substitute one minute or fifteen minutes.

Google's ClockTriggerBuilder documentation lists 1, 5, 10, 15, or 30 as the allowed `everyMinutes(n)` values. Installable triggers documentation describes the fastest recurring clock trigger as every minute. `after(milliseconds)` is a one-shot minimum delay whose actual timing may vary; chaining it does not establish a dependable 15-second recurring schedule.

Sources:
- https://developers.google.com/apps-script/reference/script/clock-trigger-builder
- https://developers.google.com/apps-script/guides/triggers/installable

A continuous sleep loop is not an acceptable stand-in for an installed 15-second service. Apps Script executions and daily trigger runtime are quota-limited. Official quota documentation lists 90 minutes/day for consumer accounts and six hours/day for Workspace trigger runtime, and six minutes per script execution. This does not provide a continuous worker.

Source: https://developers.google.com/apps-script/guides/services/quotas

## Architecture decision — one-minute polling selected

1. **Apps Script polling every minute:** closest native recurring timer; uses the documented message-history design. No 15-second or hard end-to-end latency promise.
2. **Gmail push notifications:** Gmail notifies a backend through Google Cloud Pub/Sub. Google describes typical delivery as within a few seconds but warns about delayed/dropped notifications. Requires a topic, subscription, receiving backend, identity/access setup, watch renewal, and recovery synchronization. This is a separate architecture, not a toggle in the existing script editor. It does not guarantee a 15-second maximum.

Push source: https://developers.google.com/workspace/gmail/api/guides/push

No external backend, custom Cloud project, publishing credentials, or subscription was introduced. The tested message-history source was installed by the user, who created the one-minute recurring timer and confirmed live scheduled operation. See [live verification](VOICE_LIVE_VERIFICATION.md); this evidence is user-reported.

## Verified Apps Script controls

These are the only controls/locations verified for possible future instructions in this task. They are preparatory facts, not instructions to activate the old importer.

| Action | Officially documented control/location | Evidence |
| --- | --- | --- |
| Open the existing script project directly | The project URL recorded in config/project-registry.json: https://script.google.com/home/projects/12e-XiMzRPQvbJEZ9Xr24wwnvOPoKcqgO8hyRPCi45iiCoZyfnRvmJYkz/edit | Repository resource registry; not independently authenticated in this task |
| Enter code editor | **Editor**, at the left | https://developers.google.com/apps-script/guides/services/advanced |
| Open service selection | **Add a service**, at the left beside **Services** | Same advanced-services guide |
| Enable chosen advanced service | Select a service, then **Add** | Same advanced-services guide; the Gmail quickstart now independently verifies the Gmail API row and Add control: https://developers.google.com/workspace/gmail/api/quickstart/apps-script |
| Open trigger management | **Triggers**, at the left | https://developers.google.com/apps-script/guides/triggers/installable#manage_triggers_manually |
| Open trigger creation | **Add Trigger**, bottom right | Same installable-triggers guide |
| Save a configured trigger | **Save** | Same installable-triggers guide; field labels and selected cadence values inside the dialog have not been verified in the authenticated editor |

The advanced-services guide states that a default Apps Script Cloud project automatically enables the corresponding API when a service is added; a standard Cloud project requires enabling the API separately. The user's project type is unverified. Do not prescribe a guessed Cloud-console path or assume that additional API activation is necessary.

## Instruction standard requested by the user

Future installation instructions must start from a direct verified URL, without assuming an open tab, bookmark, account selection, or prior knowledge. For every suggested control/field include its verified exact label, location, desired value, expected visible result, and a supporting official reference or authenticated-screen observation. Separate verified facts from unknown account-specific states. If a required control or state lacks evidence, do not invent its name or a substitute click path.

Verified additional controls and staged instructions for the implemented version are recorded in VOICE_INSTALLATION.md. No fake 15-second timer or unobserved authenticated-screen claim is used.
