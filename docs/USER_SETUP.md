# User-completed access and setup

The repository structure and synthetic tests are ready without these steps. None of these authentication or live-publication steps was performed by the setup task.
Use your own browser. Never paste passwords, tokens, or client records into chat, issues, pull requests, or source files.

## 1. Verify the repository workflow without Google access

1. Open the private **mscott1000/tap-in-workflow** repository in GitHub.
2. Click **Actions**, then **Verify Tap In**. Confirm the most recent completed run is green.
3. Click **Apps Script release**, then **Run workflow**.
4. Keep **Branch** set to **main**, **mode** set to **plan**, and **target** set to **appsheet-intake**. Click **Run workflow**.
5. Open the completed run. Its offline plan must say no Google authentication was attempted and live publication is disabled.

This plan requires no Google credential and makes no live change.

## 2. Configure deployment access yourself

This connection is for reading/updating script code, not for reading Gmail or running importers.
Use the Tap In-controlled account or a separately approved deployment identity with editor access to the intended script project. Do not use a service-account shortcut without verifying Google support for the exact operation.

1. In Google Apps Script, open **Settings** and enable **Google Apps Script API** only when you approve code-management access.
2. In a Google Cloud project you control, enable **Google Apps Script API** and create an OAuth client for your chosen supported browser-based authorization flow.
3. Authorize only the code-management scope: 
   
   `https://www.googleapis.com/auth/script.projects`
   
   Do not use the pending AppSheet Intake runtime-consent window as the deployment credential. Do not grant Gmail to this connection.
4. Complete Google's own consent/verification process in your browser. A custom OAuth client can be authorized through Google's OAuth 2.0 Playground using **Settings → Use your own OAuth credentials**; its authorized redirect URI must match the Playground. This is a user-managed credential flow, not code to paste into the repository.
5. Keep the OAuth client ID, client secret, and refresh token private. Check publishing/audience settings: external OAuth clients left in Testing can have refresh tokens expire after seven days. Production status does not guarantee tokens will never be revoked or expire.

Google may require several sign-in/consent screens. One project approval cannot remove those provider requirements.

## 3. Store the three credentials in GitHub, not in code

1. In the repository click **Settings → Environments → New environment**.
2. Name it **tap-in-publishing**. Limit deployment branches to **main**. A required reviewer is optional; enabling one adds a separate GitHub approval to each protected run.
3. Under that environment's secrets, click **Add environment secret** for each:
   
   - **GOOGLE_OAUTH_CLIENT_ID**
   - **GOOGLE_OAUTH_CLIENT_SECRET**
   - **GOOGLE_OAUTH_REFRESH_TOKEN**
   
4. Do not use the general Gmail credentials, browser cookies, or tokens copied from browser requests.

## 4. Inspect first; do not publish yet

1. Open **Actions → Apps Script release → Run workflow**.
2. Choose **main**, **inspect**, **appsheet-intake**, then **Run workflow**.
3. This reads live script code and outputs only file names and fingerprints, not source or credentials. Confirm the script project is **AppSheet Intake**.
4. Use the reported live fingerprint when reconciling code. A fingerprint is not the code itself: compare every mapped source file and the full live inventory/manifest through the Apps Script editor or an approved private development workspace.
5. Resolve the blockers in **CURRENT_PROJECT.md**. Preserve unlisted files, runtime authorizations, triggers, and the live manifest. Do not mark the target reconciled merely to make the guard pass.
6. Only after source review and an exact change approval, update **config/deployment-targets.json** in GitHub: record the verified **baselineSha256**, remove resolved blockers, set **reconciliationComplete**, **enabled**, and **allowApply** to true. These are permission gates, not routine installation toggles.
7. Re-run **inspect** against the final approved source. For a later explicitly approved **apply** run, supply the exact **bundleSha256**. Freeze other script editing during publication; the Google API has no atomic compare-and-swap.

The release tool creates a prior source version, preserves unknown remote files/manifest, checks drift immediately before publishing, and reads the complete source back. It does not execute any function. If readback fails, stop; never auto-retry or force a rollback over someone else's changes.

## 5. Keep runtime permissions separate

Existing mailbox import triggers must stay owned/authorized by the Tap In mailbox account. Deploying code does not prove those triggers work and does not recreate them.
AppSheet's **Call a script** authorization is a separate runtime setup, completed by the user in the AppSheet editor after the correct project/function is selected.
AppSheet reads HEAD source, so a source publication can affect existing bots immediately. A saved Apps Script version is a recovery reference, not an automatic runtime version pin.

## 6. Create the saved Tap In environment through the web

1. In ChatGPT web open **Settings → Codex Cloud → Environments → Create environment**, if available on your account.
2. Select **mscott1000/tap-in-workflow**. Name the environment **Tap In**.
3. Have setup run the repository's synthetic tests and checks. No Google credentials are needed for those checks. No desktop installation is needed.
4. Set the start guidance to read **AGENTS.md** and **docs/CURRENT_PROJECT.md**. Keep access private unless separately approved.
5. Complete **Save/Publish**. Test a fresh task: it should identify the current project and disabled publishing state without opening a login window.

Until that saved environment exists, start a new chat task with: **Tap In: [your request]. Use mscott1000/tap-in-workflow; read AGENTS.md and docs/CURRENT_PROJECT.md first.** Repository guidance is durable, but an unrelated chat is not guaranteed to load it automatically.

Environment availability and exact controls depend on the account/workspace. If a control is absent, stop and report that specific limitation; do not substitute a desktop install or repeated cloud-browser handoff.

## Completion evidence

Update CURRENT_PROJECT.md and project-registry.json with the date, account role (never credentials), verified script inventory, baseline fingerprint, successful read-only inspection, environment readiness, and the exact live test actually run.
Until then, leave authentication and live publication marked deferred.

## Official references

- Apps Script source update API: https://developers.google.com/apps-script/api/reference/rest/v1/projects/updateContent
- Apps Script API setup: https://developers.google.com/apps-script/api/how-tos/enable
- Google OAuth 2.0: https://developers.google.com/identity/protocols/oauth2/
- OAuth Playground: https://developers.google.com/oauthplayground/
- Cloud environments: https://learn.chatgpt.com/docs/environments/cloud-environments
- AppSheet script-call behavior: https://support.google.com/appsheet/answer/11997142
