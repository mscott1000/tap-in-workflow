# User-confirmed scope — 2026-10-30

This explicit user direction supersedes older uncertainty/checklists about these areas.

The user confirmed the following work and explicitly instructed Codex not to mention them again unless the user brings them up:

- Intake.
- Client phase updates.
- Case phase routing.
- Previous Client Check.

Treat these as user-confirmed working. Do not reopen them, request verification, include them in unsolicited status tables, propose replacements, or edit their code/settings as collateral work. User confirmation is the evidence; do not mislabel it as an independent inspection by Codex. Historical handoffs may contain obsolete pending items.

**Google Voice → Communications is complete and user-confirmed working.** The user installed the incremental importer, connected the correct receiving mailbox, verified a new call and a duplicate-free repeat, enabled one-minute polling, and confirmed scheduled operation. See [Voice live verification](VOICE_LIVE_VERIFICATION.md). Preserve its state and timer; do not repeat setup or reopen it without a new user request. No historical backfill was requested or performed.

The user ran the live functions and created a Communications row. Codex did not run live scripts or create triggers through tools. Remaining application work is listed in NEXT_STEPS.md; the current task is the Client-attached Cases model below.

## Communication requirement

The user explicitly requested durable retention of [INSTRUCTION_CLARITY.md](INSTRUCTION_CLARITY.md). Before giving any UI instruction, establish the application, format, verified starting URL, project, and expected screen. Then provide the exact evidenced control/location, action/value, and expected result. Never assume an open window, bookmark, or innate knowledge of the interface. This requirement is also enforced by AGENTS.md rule 23.

## Current authorized change — Client-attached Cases

The user explicitly superseded the previous Case-phase model: all five phase views should present Client rows, and each Client detail should show all Cases attached to that CLIENTROWID for its TICWEEK regardless of Case Status. Case Status remains editable; Case Phase no longer determines placement. Keep the physical CASEPHASE column during transition; do not bulk clear existing records.

The generator button is **Create Cases**, ideally near **Eligible Cases** in Client_Detail; **Add Case** remains manual entry. Generate every supported case and skip already-linked case numbers. Existing CASESTATUS default is retained pending a separate instruction.

The user handles AppSheet column organization, sorting, grouping, and backend configuration unless explicitly delegated. The working Sheet **Tap In Center — AppSheet System** is live data/schema truth; GitHub remains maintained script truth. The user reports no changes since the prior handoff and AppSheet schema is current. See [CLIENT_ATTACHED_CASES.md](CLIENT_ATTACHED_CASES.md) for evidence and remaining configuration gaps.
