# Create the Tap In Codex environment

No Google deployment tokens, API setup, GitHub publishing secrets, terminal, or desktop installation are needed.
The old automated-publishing instructions have been replaced.

## Create and publish

1. In ChatGPT on the web, open **Settings → Codex Cloud → Environments → Create environment**.
2. Select **mscott1000/tap-in-workflow** and name the environment **Tap In**. Complete GitHub's normal connection screen only if prompted.
3. Click **Get started**.
4. Paste the setup message below into the setup conversation.
5. Review the report. Keep the environment private. Click **Publish** after its repository checks pass.
6. Click **Start a new task** and send the test request below.

If these controls are not present on your account, report the missing control; do not substitute a desktop installation.
The environment is not created merely by committing these files.

## Setup message to paste

> Prepare this repository as the Tap In environment. Read AGENTS.md, docs/CURRENT_PROJECT.md, and docs/NEXT_STEPS.md. Use Node 22 or later and run npm run setup. No packages or Google secrets are needed. For approved tasks, complete supported Google Sheet edits through the connected Google Drive tools; test and commit complete Apps Script source here for me to paste into the named Apps Script project. Leave only exact AppSheet/Apps Script editor steps to me. Do not automate Google logins, create deployment credentials, or change live app settings, records, or triggers during environment setup. Check whether Google Drive tools are available and can read the working sheet's metadata; do not assume repository access grants this connection. If they are missing, finish repository setup and report that one missing connection.

## First task to test the environment

> Read the Tap In working rules and summarize the current unfinished work. Run the repository checks. Verify read-only access to the working spreadsheet through the connected Google Drive tools, without reading client records or changing anything. Report repository readiness and Google Drive access separately.

A GitHub repository connection and a Google Drive connection are separate. The current chat can reach the Sheet, but a new task must verify its own tools.
If Google Drive is absent, enable/reconnect the normal Google Drive app for that task/account if offered. If it is not offered there, use a Google Drive-connected ChatGPT work chat for the Sheet portion and record the result in the same repository handoff. No token workaround.

## Normal use

Start a task in **Work in → Cloud → Tap In**, then describe the change.
Codex should inspect, propose once, complete supported Sheet edits and repository code after approval, and leave the short editor checklist.
Only you sign in to Apps Script/AppSheet, paste/save the prepared work, and complete Google's actual runtime consent if requested.
Follow NEXT_STEPS.md for unfinished work; creating the environment does not install the existing candidate scripts.

Official setup reference: https://learn.chatgpt.com/docs/environments/cloud-environments
