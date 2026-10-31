# Voice call log — working, user-confirmed

Google Voice → Communications is installed and active with **one-minute Apps Script polling**. The user confirmed scheduled operation and explicitly declared the task complete. This supersedes earlier pending/inactive status. Preserve the working baseline and timer; do not rerun installation or reset state.

## Installed source

- PR #30, commit `10258ea42e994ca5d63f1073a7c1703aa55a74f7`.
- File: `integrations/voice-communications.gs`, saved by the user in the existing `voice-communications` file of the registered AppSheet Intake project.
- User pasted the saved source back; its 19,765 bytes matched the approved source exactly.
- SHA-256: `f82a6307a7775de861f5e375804d998f484dc4cdbf8adc02c9e81ff912afbba0`.
- All seven synthetic suites and source/configuration checks passed before the implementation merged. Synthetic checks are separate from the live evidence below.

## User-provided live evidence

| Step | Evidence |
| --- | --- |
| Service/destination readiness | Diagnostic: `gmailServiceReady=true`, `destinationReady=true`, `initialized=false`, `mode=not-initialized`, `voiceTimersVisibleToThisAccount=0`. |
| Account correction | Initial zero-result runs watched the wrong Google account. User confirmed the correct mailbox account could edit the same project, removed only `TIC_VOICE_SYNC_V2`, and confirmed fresh initialization under the correct receiving account. This was a one-time correction, not a routine reset procedure. |
| New call import | User-provided execution at 7:06:22–7:06:37 PM: `Voice sync: created=1, examined=1, more=false`. |
| Repeat run | User confirmed “no duplicate.” Exact second-run counts were not supplied. |
| Timer | User-provided execution at 7:23:50–7:23:51 PM: `Voice one-minute timer created.` |
| Scheduled operation | After instructions to verify a later completed Time-driven execution, user replied “works, good job” and then “task complete.” Exact scheduled-run timestamp/log was not supplied. |

Times above are the user's reported evening times; no calendar date is inferred from the execution host's UTC rollover. Codex did not independently inspect authenticated execution details or run any live function through tools. The user performed source saving, Google authorization, initialization, import and trigger creation. A live Communications row was created by the user-run importer. No historical backfill was requested or performed; notifications before the corrected baseline were excluded.

## Operational constraints

Use the receiving mailbox account for future authorized maintenance. Script state is bound to that mailbox, and triggers run as their creator. Do not create a second trigger or delete `TIC_VOICE_SYNC_V2` to troubleshoot without an explicitly agreed scope. Do not delete the test row as cleanup without approval. No mailbox address, caller number, message ID, notification body or transcript is included here.

Normal processing uses incremental message history, metadata-first filtering and at most 50 message IDs per run. Recovery uses bounded receipt-time windows. Existing message keys prevent repeat rows; read/unread state is unchanged. The selected one-minute polling schedule supersedes the earlier 15-second request and does not guarantee exact end-to-end delivery within 60 seconds.
