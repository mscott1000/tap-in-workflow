# Tap In Center — Workflow Application

Private project workspace for a **Google AppSheet-centered proof of concept** supporting the Tap In Center's existing warrant-assistance workflow.

## Start here

**[AppSheet project handoff and technical context](docs/APPSHEET_WORK_HANDOFF.md)** — mission and phases, live prototype data schema, current state, AppSheet changes to implement in a Work browser session, existing scripts, and security requirements.

**[Prototype Google Sheet](https://docs.google.com/spreadsheets/d/1Yhol_3USiPmUNNhz6Mmyou2ArJ93WAlCdEKzNfi5TD8/edit)** — synthetic/test-only data; six worksheets (`Clients`, `ServiceEpisodes`, `Cases`, `Interactions`, `HistoricalCaseIndex`, `ExportSelections`).

## Immediate feature

Make each court case move **independently** through AppSheet phases while remaining linked to a **single client identity**. Configure existing Request and Follow Up views using Cases slices and group by client. See the handoff for exact editor steps and test criteria.

## Safety

- **No real client personal/legal data, credentials, API tokens, or unreviewed production script dumps in GitHub.**
- This repository does **not** deploy or configure the AppSheet interface by itself; AppSheet UI changes require authenticated editor access.
- The existing website Jotform intake, historical Google Sheets “graveyard”, and court-research automations should remain intact during the prototype.

**Latest approved changes (2026-10-20):** [Phase Two grouped case entry, case/client ID migration, Add to Export, status formatting, and Interactions contact log](docs/PHASE_TWO_IDENTITY_EXPORT_INTERACTIONS_2026-10-20.md). These are implementation directives **pending changes in the authenticated AppSheet editor**, not live app changes.
