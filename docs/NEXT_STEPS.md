# Next steps

Read [USER_SCOPE.md](USER_SCOPE.md) first. Navigation/install instructions must follow [INSTRUCTION_CLARITY.md](INSTRUCTION_CLARITY.md).

Required synthetic checks and automatic merging are verified. PRs #27 and #28 put the recovered project context, exact uploads, and generator-only fixes on main. The environment already exists. These are completed tasks, not setup steps to repeat.

## Task 4: Google Voice — not started

1. Resolve the architecture choice: the requested 15-second recurring timer is unavailable in native Apps Script. Choose event-driven Gmail notifications or one-minute native polling; see [VOICE_INSTALLATION_EVIDENCE.md](VOICE_INSTALLATION_EVIDENCE.md). Do not substitute an interval without the user's decision.
2. Implement the selected architecture using [VOICE_IMPORT_PROCESS.md](VOICE_IMPORT_PROCESS.md): new-arrival baseline, bounded message batches, persisted progress, write-before-checkpoint ordering, deduplication, and bounded recovery.
3. Complete the specified synthetic failure/pagination/retry checks and repository checks. Preserve the original uploaded snapshots and user-confirmed working components.
4. Prepare complete changed source and verified, browser-first installation steps. Any live activation requires its specific agreed scope. No historical backfill by default.

The user is working through tasks one at a time. Do not move from the status-documentation task into implementation without their direction.

## Remaining user-completed app work

The generator-only source is ready in [GENERATOR_INSTALLATION.md](GENERATOR_INSTALLATION.md). Its AppSheet Intake copy destination, generator-bot values, and existing Case_Form manual fallback are prepared. Live installation/configuration and Request/Graveyard presentation remain unverified; no other working script needs replacement for this generator update.

Complete the remaining editor work and explicitly scoped fictional live tests separately from GitHub merges. Repository test success does not establish installed behavior.
