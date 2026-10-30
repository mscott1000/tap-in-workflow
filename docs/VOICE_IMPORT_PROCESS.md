# Google Voice import process

Status: process established 2026-10-30; implementation and activation pending. The current checkpoint/thread-search implementation has not been replaced or enabled. Read USER_SCOPE.md before further work.

## Decision

Use Gmail's incremental change history and message IDs. Start with new arrivals from activation onward. Do not import historical notifications by default. Do not use broad unread searches, repeated three-day windows, or the existing repeated 500-thread search as the normal import path.

Unread search was a useful small work queue, but a staff member reading a notification can remove it from that queue before import; marking a whole conversation read also affects other notifications. A Gmail history cursor gives an independent processing position while leaving read state untouched. No processed labels, archiving, deletion, or other mailbox writes are required.

Use Apps Script's built-in advanced Gmail service for `Users.getProfile`, `Users.History.list`, `Users.Messages.get`, and bounded `Users.Messages.list` recovery. This requires enabling the Gmail service in the existing Apps Script project once and completing actual Google consent if requested. It does not require deployment tokens, a custom OAuth client, automated login, or new owner accounts. Reuse the existing mailbox-owning account. Do not change other project files or existing triggers.

## Activation and normal run

| Stage | Concrete behavior |
| --- | --- |
| Initialize | Capture current Gmail historyId and activation time as a baseline. Do not query old threads, import existing mail, or infer a backfill from old unread notifications. Activation explicitly means new notifications from this point forward. |
| Poll | Proposed schedule: every five minutes. Request messageAdded history since the saved historyId. Ordinary idle runs inspect only changes, not a date-window replay. No new timer is installed until activation. |
| Filter | Inspect message headers first. Accept only the supported Google Voice sender and missed-call/voicemail subject patterns. Only accepted notifications need body retrieval. Use Gmail internalDate for receipt-time boundaries, not the sender's Date header. |
| Batch | Process at most 50 candidate message IDs per execution. Persist page position and message offset; continue the unfinished batch next run rather than returning to the first 50. Small Gmail history pages also bound the header work for unrelated new mail. |
| Save | Use existing message-ID-based COMMUNICATIONID and SOURCEMESSAGEID deduplication. Append the batch to Communications and flush successfully before committing progress for that batch. Preserve current classification, blank initial STATUS, and no transcript storage. |
| Checkpoint | Only advance the completed history cursor after all covered pages/messages have been handled. While a page is partly processed, retain its original history anchor plus page token/offset. Progress metadata contains no message bodies or personal data. Treat Gmail history IDs as opaque decimal strings, not JavaScript Numbers. |
| Retry | A crash before a Sheet write leaves the batch pending. A crash after the write but before checkpointing retries the same IDs; existing IDs prevent duplicate rows. An individual failed fetch stays pending or produces an explicit blocking error; it must not silently disappear behind an advanced cursor. |

The implementation must establish one safe ordering: **read changes → filter → deduplicate → save/flush rows → save progress**. Do not advance to a fetched page's current mailbox historyId while earlier pages or messages remain unfinished. Do not equate a full 50-item batch with a completed scan.

## Recovery after a long interruption

Gmail history cursors can expire; retention is not a guaranteed fixed number of days. A stale cursor must not trigger an all-mail scan or a fresh baseline that silently discards the gap.

1. Preserve the old progress and last completed receipt-time boundary. Capture a new recovery endpoint and current Gmail historyId once.
2. Search message IDs only for the Google Voice sender/subject patterns in fixed, small receipt-time windows, starting at the last safely covered boundary, with a small overlap. On an initial activation, never search before activation time.
3. Use message-level `Messages.list`, page size 50. Persist the fixed window bounds, next-page token, and unfinished batch position so subsequent runs drain the window. Do not use thread-level `getMessages()`.
4. Verify message internalDate against the intended interval; Gmail search boundaries must overlap sufficiently to avoid strict after/before second-boundary omissions. Deduplicate every retry.
5. Finish each window before moving forward. After recovering to the captured endpoint, resume change-history processing from the captured replacement historyId. Message-ID deduplication absorbs overlap between recovery and the resumed history stream.
6. If a page token becomes invalid, restart only its fixed bounded window or unfinished history segment, retaining deduplication. Never skip to the latest mailbox cursor to suppress an error.

This can legitimately process a large *new* backlog after a long outage, but each run is bounded and makes forward progress. It never imports the pre-activation mailbox history by default. An explicitly requested historical backfill is a separate bounded task.

## Required tests before installation

- First activation establishes a cursor and imports no older mail, including unread mail.
- A new notification imports once whether read or unread; later replies do not replay an entire thread.
- More than 50 new notifications drain across runs; new arrivals during draining remain eligible.
- Unrelated mail is rejected using headers without retrieving bodies.
- Write failure, partial progress, fetch failure, and crash-after-write retries cause no loss or duplicates.
- A new message added during pagination is covered by the current sequence or next cursor run.
- History expiry triggers only bounded recovery after the last safe boundary; no global scan or silent reset.
- Second-boundary messages, invalid page tokens, and large decimal history IDs preserve correct progress.
- Read state, labels, ownership, other scripts, existing triggers, and transcript-storage behavior are unchanged.

## Implementation boundary

Only the Voice importer, its tests, and its installation documentation are in scope. No live mail or Sheet record is used as a test fixture. No source is installed, importer run, or trigger created by this process document. The current source remains the previously uploaded candidate until this design is implemented and tested.
