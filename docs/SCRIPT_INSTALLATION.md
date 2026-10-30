> **Current installation handoff (2026-10-30):** [Generator and AppSheet steps](GENERATOR_HANDOFF_2026-10-30.md). Install only the two changed history files and the combined generator in AppSheet Intake. The original four user uploads are permanently preserved under integrations/source-snapshots/2026-10-30/.

# Script source and user installation

GitHub is the source of truth for maintained code. Copy only the approved changed files from the exact commit linked in the task handoff.
Creating this Codex environment requires no script installation.
The existing copies are not claimed identical to current live code; confirm newer live edits before replacing a file.

## Exact copy map

The machine-readable map is ../config/script-installation.json.

| Repository source | Apps Script project | Editor file name | Current state |
| --- | --- | --- | --- |
| integrations/gmail-phase-two-importer.gs | AppSheet Intake | appsheet-intake-forms | Reconciled with user upload; no importer replacement needed |
| integrations/identity-review-core.js | AppSheet Intake | history-match-core | Tested history update; compare post-upload edits, then replace |
| integrations/identity-review-adapter.gs | AppSheet Intake | history-match-adapter | Tested history update; compare post-upload edits, then replace |
| integrations/voice-communications.gs | AppSheet Intake | voice-communications | Reconciled with user upload; no Voice replacement needed |
| integrations/eligible-cases-install.gs | AppSheet Intake | eligible-cases-install | Tested generator update; add to AppSheet Intake per dated handoff |

AppSheet Intake: https://script.google.com/home/projects/12e-XiMzRPQvbJEZ9Xr24wwnvOPoKcqgO8hyRPCi45iiCoZyfnRvmJYkz/edit

The generator's intended destination is AppSheet Intake so the history functions can be available together.
Its last observed location was the different Tap In Workflow project. Do not move, delete, or duplicate it merely to set up this environment.
The generator install file combines eligible-cases-core.js and eligible-cases-adapter.gs. Do not also paste those components into the same project: that would duplicate definitions.

## Steps after a task explicitly marks a file ready

1. Open the commit-specific GitHub link supplied in the handoff. Open the named file, click **Raw**, and copy its complete contents.
2. Open **AppSheet Intake** using the link above. Sign in with the account that can edit that project if prompted.
3. Select the exact existing file named in the handoff. Confirm it has no newer edits that the task did not include.
4. Replace only that file's code with the supplied complete contents. If the handoff explicitly calls for a new file, click **+ → Script** and enter its specified name.
5. Click **Save project**. Do not change unrelated files, appsscript.json, scheduled triggers, or the original archive importer.
6. Perform only the specific test named in the handoff. Saving code is not permission to run a live importer or create records.
7. Complete any listed AppSheet steps separately and report the result.

Saving script code can affect existing triggers and bots immediately. Repository tests do not prove live execution.
If Google requires sign-in or runtime consent, complete that in your own browser. Never paste passwords or tokens into chat.
