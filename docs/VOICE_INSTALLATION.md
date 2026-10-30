# Install Google Voice polling — one minute

Prepared 2026-10-30. The user selected **one-minute Apps Script polling** in this chat, replacing the earlier 15-second request. This installs one changed file in an existing project. Code is tested in the repository; no live installation or activation has been performed by Codex.

## Read before starting

The starting application is **Google Apps Script in a web browser**, not the AppSheet app builder or the Google Sheet. The destination is the existing **AppSheet Intake** script project, owned/run by the mailbox account that receives the Google Voice notifications. Its project URL is recorded in config/project-registry.json.

The four uploaded script files are preserved in [the dated snapshot](../integrations/source-snapshots/2026-10-30/README.md). Confirm that **voice-communications** has not acquired newer edits since that upload before replacing it. If there are newer edits, reconcile that exact file first. The new source replaces the prior Voice scan/checkpoint logic and preserves its parsing/matching behavior. No other runtime file, manifest, ownership, or existing trigger is to be changed.

Saving code can affect an existing timer immediately. The user reported Voice inactive. If the read-only diagnostic below discovers an existing Voice timer, stop before initialization or activation; its interval is not inferred or silently replaced.

### Evidence for the controls used here

| Control/location | Verified source |
| --- | --- |
| Editor on the left; Services beside Add a service | [Google advanced-service guide](https://developers.google.com/apps-script/guides/services/advanced) |
| Gmail API service choice, Add, Run, Review permissions, account choice, Allow; execution log at the bottom | [Google Gmail Apps Script quickstart](https://developers.google.com/workspace/gmail/api/quickstart/apps-script) |
| Files list and function-selection dropdown in the top toolbar | [Official Google Codelab, reauthorization instructions](https://codelabs.developers.google.com/workspace-studio-custom-extensions#4) — use only this UI evidence, not that tutorial's unrelated deployment instructions |
| Function dropdown followed by Run | [Google library quickstart](https://developers.google.com/apps-script/quickstart/library) |
| Save project at the top | [Google V8 guide](https://developers.google.com/apps-script/guides/v8-runtime) — no runtime/manifest changes are part of this installation |
| Execution log at the top of the editor | [Google logging guide](https://developers.google.com/apps-script/guides/logging) |
| Triggers on the left | [Google installable-trigger guide](https://developers.google.com/apps-script/guides/triggers/installable#manage_triggers_manually) |

These sources establish controls and documented locations. Codex has not inspected the user's authenticated screen. If a required control is absent, report that screen instead of substituting a guessed menu or creating a new project.

## Stage 1 — open the exact existing project

1. Open a web browser.
2. Enter this complete URL in its address bar and open it:
   https://script.google.com/home/projects/12e-XiMzRPQvbJEZ9Xr24wwnvOPoKcqgO8hyRPCi45iiCoZyfnRvmJYkz/edit
3. If Google asks for an account, choose the existing Google Voice mailbox-owning account. Complete sign-in in your browser; do not put credentials in chat.
4. Confirm the destination project is **AppSheet Intake**. If access is denied or a different project appears, stop; do not create a replacement project.
5. In Google Apps Script's left navigation, select **Editor**. Its code editor and project file list should be visible.
6. Under **Files**, select the existing **voice-communications** script file. Do not select any other file. If it is absent, stop and identify the current file list rather than adding duplicate source blindly.
7. Confirm whether this file has been edited since the supplied upload. Keep any newer edits for reconciliation before continuing.

## Stage 2 — copy the one complete replacement

Use these source links only after the Voice PR is merged into main. The final handoff also provides a commit-specific source link.

8. In another browser tab, open the plain-text repository file directly:
   https://raw.githubusercontent.com/mscott1000/tap-in-workflow/main/integrations/voice-communications.gs
9. This is source text on GitHub's raw-content host. Confirm it contains **initializeTICVoiceSync**, **runTICVoiceIngest**, **inspectTICVoiceSetup**, and **enableTICVoiceMinuteTrigger**. If not, you are viewing the old version; stop.
10. Select the whole plain-text page and copy it: Ctrl+A, Ctrl+C on Windows/Linux; Command+A, Command+C on macOS. No download or desktop tool is needed.
11. Return to the browser tab for **Google Apps Script → AppSheet Intake → Editor → voice-communications**.
12. Click inside that file's code pane so the keyboard commands affect the code, not the page.
13. Select all code in that pane with Ctrl+A or Command+A and paste the complete copied source with Ctrl+V or Command+V.
14. Confirm the file still starts with the Google Voice → Communications comment and contains the four function names from step 9. The replacement is one entire file, not a snippet to append.
15. At the top of the Apps Script editor, use **Save project**. This saves source but does not initialize a baseline or create the new timer.
16. Leave all other source files and appsscript.json unchanged. Do not use Deploy or create publishing credentials.

## Stage 3 — enable the built-in Gmail API service

17. Stay in the same **Google Apps Script → AppSheet Intake** browser tab and **Editor** view.
18. Locate **Services** on the left. If Gmail is already listed there, do not add it again; continue with the diagnostic.
19. Otherwise use **Add a service** beside **Services**.
20. In the service selection, choose **Gmail API**.
21. Click **Add**. The advanced service makes the global **Gmail** API available to the script.

For an Apps Script default Cloud project, Google's documentation says the corresponding API is enabled automatically when its service is added. A standard Cloud project requires separate API enablement. The current project type/Cloud project number has not been observed. If the diagnostic reports API-disabled access after this step, stop with the exact error; do not invent a Cloud project, edit the manifest, or configure OAuth to bypass it.

## Stage 4 — read-only installation check

22. Stay in **Google Apps Script → AppSheet Intake → Editor**.
23. In the top toolbar's function dropdown, choose **inspectTICVoiceSetup**. Check the exact function name before running; do not select the importer or timer helper yet.
24. Click **Run**.
25. If Google requests authorization, the documented flow uses **Review permissions**, an account choice, and **Allow**. Use the mailbox owner account. Review the actual access request: permissions apply to the whole existing project. If another warning/screen appears, stop and identify it rather than following an invented bypass.
26. Open **Execution log** at the top of the editor if the log is not visible. Google documents the streamed output at the bottom of the window.
27. The diagnostic should log JSON with **gmailServiceReady: true**, **destinationReady: true**, **initialized: false**, and **voiceTimersVisibleToThisAccount: 0** on the first setup.
28. If initialized is already true, do not reset it: the saved cursor is intentionally preserved. If the timer count is above zero, stop and inspect that existing Voice timer before changing anything. The helper sees only this account's triggers; use the established original owner account.
29. If any diagnostic error appears, stop before activation and provide its text. Do not include notification bodies, transcripts, or client records.

This diagnostic reads Gmail profile metadata, destination headers/key IDs, progress state, and the current account's Voice-trigger count. It does not scan message bodies, append rows, create a baseline, or create/delete a trigger.

**Checkpoint:** report this diagnostic before proceeding. The next stages start processing real new-arrival notifications and require the agreed activation/test scope. Codex does not execute these functions remotely.

## Stage 5 — establish a new-arrival baseline (after activation scope is agreed)

30. Agree the activation time and one controlled staff-generated Voice notification for verification. Messages already present at initialization are excluded by design. Other legitimate notifications arriving after this baseline are part of the new-arrival queue; the importer is not restricted to the staff test message.
31. In the same Apps Script editor's top function dropdown, choose **initializeTICVoiceSync**.
32. Click **Run**. This writes the mailbox-bound history baseline to Script Properties; it creates no Communications row and no timer.
33. In **Execution log**, expect **Voice sync initialized for new notifications; no historical mail imported.** If it instead says existing progress was preserved, do not clear that state. Initialization is deliberately idempotent.
34. Generate the specifically agreed staff test notification after initialization, using the real Google Voice service. Do not create fake Google-sender emails or use client records as fixtures. Keep the test phone/message identifiers out of GitHub.

## Stage 6 — scoped manual check, then one-minute activation

35. After the controlled notification reaches the mailbox, return to **Google Apps Script → AppSheet Intake → Editor**.
36. Select **runTICVoiceIngest** in the top function dropdown, then click **Run**. This processes a bounded batch of up to 50 new message IDs and may append Communications rows. It is not a harmless parser-only test.
37. Inspect the execution log's created/examined/more counts. No message bodies or caller identifiers are logged. If more is true, further batches are pending; a saved position prevents returning endlessly to the first batch.
38. In another browser tab, open the working Google Sheet directly:
   https://docs.google.com/spreadsheets/d/1Yhol_3USiPmUNNhz6Mmyou2ArJ93WAlCdEKzNfi5TD8/edit#gid=29001001
39. That verified tab ID belongs to **Communications**. Confirm the agreed test notification has one row, the expected ContactType/receipt date/time, blank initial STATUS, and its SOURCEMESSAGEID. Do not edit or delete unrelated records. If the link does not resolve to that tab, stop and report the screen.
40. Return to the Apps Script editor and run **runTICVoiceIngest** a second time. Confirm the same test SOURCEMESSAGEID still has only one row. Other newly arrived notifications can legitimately add different rows between runs.
41. Once the scoped checks succeed and automatic processing is approved, choose **enableTICVoiceMinuteTrigger** in the same function dropdown and click **Run**.
42. The helper should log **Voice one-minute timer created.** It creates a timer only for runTICVoiceIngest and leaves other triggers untouched.
43. If it logs that a Voice timer already exists, it did not change or verify its interval. Stop rather than creating another timer.
44. In the same Google Apps Script project's left navigation, open **Triggers**. Confirm one visible trigger names **runTICVoiceIngest**. The interval is set by the reviewed `.everyMinutes(1)` code; no guessed trigger-dialog field is required.
45. Record that the user completed source save, service setup, baseline, scoped check, and timer creation. Scheduled live success is established only after an actual timed execution and its expected result are observed. One-minute polling is not a guarantee of a row appearing in the app within exactly 60 seconds.

## Recovery and preservation

Normal runs fetch only added-message history. Each execution handles one API page and at most 50 IDs, with no Gmail thread search or whole-conversation replay. Read/unread status is irrelevant and unchanged.

An expired Gmail history cursor triggers message-ID recovery in fixed windows of at most 15 minutes, starting no earlier than activation and overlapping the last completed boundary. This recovery-window size is not the polling interval. Recovery never starts an all-mail scan or silently resets to the latest cursor. Deleted source messages are explicitly counted; other read/write failures remain blocking and retryable.

Progress contains cursor/page/window metadata and a mailbox hash, not bodies or transcripts. Source message IDs in Communications prevent duplicates if a Sheet write succeeds but its progress save fails. A different signed-in mailbox cannot reuse or reset the initialized owner account's progress.

No source replacement, live script run, baseline creation, timer creation, Gmail change, or Sheet row append has been performed by Codex for this handoff. Do not reset progress or delete test rows as cleanup without a separately agreed scope.
