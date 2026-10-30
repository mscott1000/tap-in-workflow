# One-proposal change process

## 1. Inspect

Read AGENTS.md, CURRENT_PROJECT.md, NEXT_STEPS.md, the resource registry, affected code/tests, and accessible live evidence.
Check whether connected Google Drive tools exist in this task and can reach the exact spreadsheet.
Use bounded live reads; a dated header snapshot is a starting point, not current proof.
AppSheet configuration is not stored in Sheet cells. Record unknown settings instead of guessing them.

## 2. Propose once

Present the concrete change, exact targets, what stays untouched, necessary questions/access, tests, and user-only editor steps.
A clearly scoped instruction to implement can authorize ordinary edits. Do not ask another generic proceed question.
Read-only requests do not authorize writes. Mandatory security/destructive-action confirmations still apply.

## 3. Complete the accessible work

For an approved task, carry out all relevant edits supported by connected Google Drive/Sheets.
Re-read affected cells, formulas, and validation before writing; preserve unrelated content; verify by readback.
Do not defer supported Sheet edits just because the user must finish an AppSheet step later.
Keep Intake 2026 read-only. Setup itself does not authorize unrelated fixes or changes to operational records.

Edit and test Apps Script source in GitHub. Keep complete changed files ready to copy, with exact project/file destinations and a specific commit link.
Before a replacement, establish whether a newer live copy needs reconciliation. Unknown installed state is not proof of equality.
Do not set up Google deployment tokens or automated logins. Do not run live scripts or alter triggers.

Commit focused changes and preserve unrelated user work. Finish safe independent work when another part is blocked.

## 4. Leave only the user-only steps

Use CHANGE_HANDOFF_TEMPLATE.md and update NEXT_STEPS.md.
For each remaining step, give the exact destination, buttons, complete content to paste, save step, and success check.
Use verified AppSheet names; label anything that requires a screenshot/current editor inspection.
Installing Apps Script and configuring AppSheet are separate user steps when both are needed.
New source can affect existing bots/triggers on save; do not equate a repository commit with an installation.

## 5. Verify and report

Report completed Sheet edits, tested/committed code, failed steps, and the short remaining editor checklist.
State live data changed yes/no and distinguish prepared, user-reported installed, and live-verified.
Update CURRENT_PROJECT.md with evidence and an AppSheet saved version only if actually observed.
No client records or secrets in commits, test fixtures, screenshots, or handoff evidence.
