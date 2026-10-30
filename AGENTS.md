# Tap In working rules

1. Start with docs/CURRENT_PROJECT.md, config/project-registry.json, the dated header snapshot, and affected code/tests.
2. Latest explicit user instructions control. Separate requested behavior, repository code, and verified live state. Older handoffs are historical, not today's installation directions.
3. Use Client rows and Case rows. Phase titles: Intake, Research, Request, Follow Up, Graveyard. Preserve the original terminology agreement in docs/reference/TERMINOLOGY_V1_2026-10-23.md; do not silently amend it.
4. Use literal table/view/action names and ALL CAPS data-point references in user instructions. Preserve exact spelling/case in executable code.
5. Follow docs/CHANGE_PROCESS.md. Inspect first; gather changes, exclusions, questions, known permissions, and tests into one proposal before writes.
6. Read-only work needs no change approval. An explicit, clearly scoped implementation request can authorize an ordinary edit. Do not add redundant proceed questions.
7. One project approval never waives mandatory security/authentication/destructive-action confirmation. Stop for a new permission, protected workflow, conflict, risk, or material scope expansion.
8. Authentication and live publication are user-deferred in this setup. Do not start logins, fetch browser tokens/cookies, expand access, or enable deployment without a new explicit request.
9. Preserve the existing app, sheet, Jotform, archives, account ownership, and links. No schema regeneration, physical rename, record deletion, layout reset, or replacement app without specific approval.
10. Do not change unrelated column order, grouping, widths, forms, colors, or views for a backend task. Cases belong to Clients through CLIENTROWID.
11. History matching is advisory. No automatic merges, eligibility decisions, case submissions, messages, or submission gates. Uncertain parsing must not create a new work-row type.
12. Keep code in GitHub. Use the browser for AppSheet-only settings and user-completed auth, not routine code transfer.
13. Run npm test and npm run check; both must work without network or credentials. Synthetic tests do not establish live behavior.
14. Never commit client records, email bodies, voicemail transcripts, secrets, or unreviewed live-source/documentation dumps.
15. Publishing is disabled until live code is reconciled, user credentials configured, and an exact bundle approved. Never bypass baseline checks or blindly force-push script files.
16. Preserve remote files not listed for replacement and the remote manifest. Apps Script updates replace a whole project; do not upload a partial inventory.
17. AppSheet calls Apps Script HEAD, so publishing production code may affect bots immediately. A version number is not a staging barrier.
18. Do not run live importers/generators as tests without explicit test scope. No operational records as fixtures.
19. Distinguish prepared, saved, deployed, and verified. Unsaved browser drafts are not durable completion.
20. Finish with completed, verified, failed, deferred, and live data changed yes/no. Update CURRENT_PROJECT.md with evidence and saved app version where relevant.
21. Give browser-first user instructions. Do not require terminal commands, downloads, or desktop software when a web route exists.
