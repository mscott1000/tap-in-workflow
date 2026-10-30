# Tap In Center workflow

This private repository supports the existing AppSheet app and Google Sheets. It is not a replacement app.

**Standard workflow:** inspect → one proposal/approval → complete supported Sheet edits and tested repository code → user finishes Apps Script/AppSheet editor steps.

- [Create the Codex environment](docs/USER_SETUP.md)
- [Current project and decisions](docs/CURRENT_PROJECT.md)
- [Working rules](AGENTS.md) and [change process](docs/CHANGE_PROCESS.md)
- [Exact resources](config/project-registry.json) and [dated sheet headers](config/live-schema.snapshot.json)
- [Script files and copy destinations](docs/SCRIPT_INSTALLATION.md)
- [Remaining user steps](docs/NEXT_STEPS.md)
- [Change handoff template](docs/CHANGE_HANDOFF_TEMPLATE.md)

## Who does what

| Area | Codex | User |
| --- | --- | --- |
| Google Sheets | Inspect and complete approved edits through the connected Google Drive tools; read back results | Reconnect/share only if actual file access is missing |
| Apps Script | Maintain/test complete code here and provide exact file replacements | Copy the approved changed files into the named project, save, and complete any runtime consent |
| AppSheet | Prepare exact expressions and editor steps | Sign in, apply the listed settings, save, and perform the named checks |

A repository connection does not automatically supply Google Drive tools. Verify that connection in a fresh environment task; no custom Google deployment connection is needed.

The automated Apps Script publisher and its token setup have been removed. No Google secrets, desktop software, or terminal work is required from the user.
Merging this repository never installs scripts or changes AppSheet settings.

## Verification and preservation

Node 22 or later is sufficient. Codex runs `npm run setup`; it runs seven synthetic suites and source/configuration checks, without installing packages or contacting Google.
GitHub Actions runs the same checks for pull requests and main.

The live sheet may contain operational personal/legal information. Keep records and credentials out of GitHub.
Preserve Jotform, archives, custom layouts, and ownership. No routine schema regeneration or renaming.
Historical docs remain available but are not current setup directions.
