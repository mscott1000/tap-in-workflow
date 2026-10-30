# Next steps

Current focus: **Google Voice → Communications**. Read USER_SCOPE.md first; it supersedes older broad task lists.

1. Resolve the requested 15-second cadence: native Apps Script supports recurring polling no faster than one minute; event-driven Gmail push requires a backend. See VOICE_INSTALLATION_EVIDENCE.md for official evidence. Do not silently substitute a schedule.
2. Implement the bounded Gmail message-history process in [VOICE_IMPORT_PROCESS.md](VOICE_IMPORT_PROCESS.md), replacing the repeated thread-search path in voice-communications.gs.
3. Run the specified synthetic failure/retry/pagination tests and repository checks. Keep the four original source uploads unchanged.
4. Provide the single complete changed Voice file and exact user-only Gmail-service/installation/activation steps. Do not modify other scripts or existing triggers.
5. Validate a specifically scoped new-arrival test before enabling the selected supported schedule. No historical backfill by default.

The process is established; implementation and activation remain pending. No live data changed for this process/scope update.
