# User-supplied Apps Script source — 2026-10-30

These four exact uploads are preserved here so future tasks do not need to retrieve another chat. Read manifest.json for file mappings and SHA-256 hashes. The user supplied these as scripts in connected Google Drive; this is user-supplied source evidence, not an independent readback from Apps Script.

- appsheet-intake-forms.gs: matches the maintained importer except its first comment.
- history-match-core.gs: different match-reason text and Client status `Match - Awaiting Confirmation` instead of `Match Found - Awaiting Confirmation`.
- history-match-adapter.gs: uses GMT for current Client/Case date reads; different result/error text.
- voice-communications.gs: adds last-success checkpoint with six-hour overlap, a 500-thread scan limit, lazy history/body reads, and complete-scan checkpoint advancement. Removes the Node export used by the maintained copy.

These snapshots are immutable source evidence. Reconcile into maintained integrations files in a subsequent implementation task; do not silently overwrite either version. The existing tests cover the maintained files, not runtime correctness of these uploads. No generator source was included in this upload. No scripts were installed or run and no live data was changed.
