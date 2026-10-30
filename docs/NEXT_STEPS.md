# Remaining steps

The environment is running and repository checks pass. Do not repeat environment creation.

The approved code work and Sheet CASEPHASE validation repair are complete as of 2026-10-30. Follow [the exact installation and AppSheet handoff](GENERATOR_HANDOFF_2026-10-30.md).

1. In **AppSheet Intake**, replace only **history-match-core** and **history-match-adapter**, then add the combined **eligible-cases-install** file. The four uploaded scripts are preserved in the dated source snapshot; do not ask for them again. Compare any edits made since those uploads before replacement. Leave Tap In Workflow and all existing triggers untouched.
2. In AppSheet, bind the timestamp-change generator bot to **AppSheet Intake → createEligibleCasesForClient([ClientRowID])** and save. Complete any actual Google runtime consent in your browser.
3. Configure the parent-prefilled **Add Case** action/form, generation warnings, current-input Repeat Case Check/evidence display, and the manual-Case history event from the complete expressions in the handoff.
4. Inspect the existing **Request** and **Graveyard** views and use their Client-row slices without resetting custom layouts. Current editor settings have not been verified.
5. Identify an explicitly fictional Client fixture and perform the generation/repeat-run checks in the handoff. No live generation or deduplication test has occurred; no operational record is authorized as a fixture.

Codex completed and read back the validation change at `Cases!K2:K979`; there is no remaining user Sheet repair for that range. No record values changed. Script installation and AppSheet saves remain user-only steps under AGENTS.md rules 9–10.
