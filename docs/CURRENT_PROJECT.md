# Current Tap In project

Updated: 2026-10-30, America/Chicago.

Required communication standard: read [INSTRUCTION_CLARITY.md](INSTRUCTION_CLARITY.md) before navigation/setup instructions. AGENTS.md rule 23 records the user's request to retain this standard durably.

## Active work

**Google Voice → Communications** is not active, as confirmed by the user. The immediate goal is an efficient import process that does not repeatedly search or import thousands of historical threads.

The user requests every 15 seconds and installation instructions with verified UI evidence. Official Google documentation establishes that native Apps Script recurring timers stop at one-minute frequency. No schedule was silently substituted. See [VOICE_INSTALLATION_EVIDENCE.md](VOICE_INSTALLATION_EVIDENCE.md); choosing a supported architecture is pending.

The established process is [VOICE_IMPORT_PROCESS.md](VOICE_IMPORT_PROCESS.md): Gmail incremental message history, a new-arrival baseline at activation, bounded batches with persisted progress, write-before-checkpoint ordering, message-ID deduplication, and bounded recovery for expired history. The process is documented; the existing importer has not yet been changed to implement it or activated.

Read [USER_SCOPE.md](USER_SCOPE.md) before any status report or edit. It records the user's explicit closed-topic boundaries and supersedes obsolete pending items in older handoffs. Do not repeat broad automation inventories or reopen those areas.

## Preserved project context

Exact resource IDs are in config/project-registry.json. Physical headers and dated validation evidence are in config/live-schema.snapshot.json. Four exact user-supplied script files are permanently preserved with hashes under integrations/source-snapshots/2026-10-30/. Do not request those uploads again. Existing maintained Voice code matches the supplied baseline; the Gmail-history design is not implemented in it yet.

Use Client rows and linked Case rows; CLIENTROWID is the parent link. Phase titles and canonical record terminology remain governed by reference/TERMINOLOGY_V1_2026-10-23.md and later explicit user decisions. Preserve that reference unchanged. Preserve the existing app, custom layouts, archives, Jotform, ownership, keys, scripts, and triggers. No operational records, message bodies, transcripts, or credentials in GitHub.

Earlier prepared generator code and its installation details remain in GENERATOR_HANDOFF_2026-10-30.md and draft PR #25. The user confirmed the existing Case form is Case_Form. Do not let older installation instructions override USER_SCOPE.md; those handoffs are not a current instruction to replace working components.

## Evidence and live changes

The previous code revision passed all six synthetic suites and source/configuration checks. The current process/scope update changes documentation only; it does not establish runtime operation. Earlier work repaired Cases!K2:K979 validation and read back all 978 rules without changing record values. This process update makes no live changes and installs/runs no scripts.
