# Tap In working rules

1. Start with docs/CURRENT_PROJECT.md, config/project-registry.json, config/live-schema.snapshot.json, and affected code/tests. Follow docs/CHANGE_PROCESS.md.
2. Latest explicit user instructions control. Separate requested behavior, repository code, and verified installed state. Older handoffs are historical.
3. Use Client rows and Case rows. Phase titles: Intake, Research, Request, Follow Up, Graveyard. Preserve docs/reference/TERMINOLOGY_V1_2026-10-23.md unchanged.
4. Use literal table/view/action titles and ALL CAPS data-point references in user instructions. Preserve exact spelling/case in executable code.
5. Inspect first. Give one complete proposal with changes, exclusions, necessary questions, tests, and user-only steps. A clearly scoped implementation request can authorize ordinary edits; do not ask repeated proceed questions.
6. For an approved task, complete all relevant edits supported by the connected Google Drive/Sheets tools. Do not hand supported Sheet edits back to the user merely because AppSheet also needs changes.
7. Direct Sheet edits are part of the standard workflow, not permission for arbitrary cleanup or unrelated data changes. Read exact tabs/ranges/headers/validation before writes, preserve unrelated cells, and read back results.
8. A GitHub-connected Codex environment does not prove Google Drive tools are available. Check tools and exact-file access at task start. If unavailable, finish repository work, document precise unperformed Sheet edits, and identify the missing connection once. Do not fabricate a live verification.
9. GitHub is the source of truth for maintained script code. Edit/test/commit complete changed script files here; the user copies approved files into Apps Script. Use config/script-installation.json and docs/SCRIPT_INSTALLATION.md for exact destinations and readiness.
10. No automated Google login, browser handoff, custom OAuth client, token setup, clasp deployment, or Google publishing secrets. Do not install or run live scripts. User completes Apps Script/AppSheet sign-in, saves, and any actual runtime consent in their own browser.
11. Preserve the existing app, sheet, Jotform, archives, ownership, record IDs, and links. No schema regeneration, physical rename, record deletion, layout reset, or replacement app without specific approval.
12. Do not change unrelated column order, grouping, widths, forms, colors, or views for a backend task. Cases belong to Clients through CLIENTROWID.
13. History matching is advisory: no automatic identity merges, eligibility decisions, submissions, messages, or submission gates. Uncertain parsing must not create a new work-row type.
14. Run npm test and npm run check. npm run setup runs both without dependencies, network, or credentials. Synthetic tests do not establish live behavior.
15. Never commit client records, email bodies, voicemail transcripts, credentials, or unreviewed live documentation dumps. Historical Intake 2026 is read-only.
16. Prepare exact remaining AppSheet clicks and complete copy/paste expressions; never defer code development or supported Sheet edits just because the user must sign in later. Do not invent unobserved editor labels.
17. Before replacing any script file, establish whether the user has newer live edits. Keep unverified copies marked as candidates. Preserve unrelated script files, appsscript.json, and existing triggers; do not tell the user to replace an entire project.
18. Apps Script source saves can affect existing triggers/bots immediately. A saved source version is not a runtime staging barrier. Do not ask the user to run an importer/generator as a test without explicit test scope.
19. One task approval does not waive mandatory security, protected workflow, conflict, destructive-action, or new-scope confirmation. Never obtain passwords/tokens through chat.
20. Finish with completed Sheet changes, tested/committed code, user-only steps, failures, and live data changed yes/no. Update CURRENT_PROJECT.md and NEXT_STEPS.md with evidence. Prepared, copied/saved, and live-verified are different states.
21. Give concise, browser-first instructions. Do not require the user's terminal, downloads, or desktop software when a web route exists.

22. Read docs/USER_SCOPE.md before status reports or edits. Respect user-confirmed working areas and explicit instructions not to mention/reopen them unless the user does so. Current active work is Google Voice import; use docs/VOICE_IMPORT_PROCESS.md.
23. Before giving navigation, setup, or installation instructions, follow docs/INSTRUCTION_CLARITY.md. Establish the application and format (for example, Google Apps Script in a web browser), verified starting URL, exact project, and expected screen before naming a control. Give the exact evidenced control label/location, action/value, and expected result. Never assume an open window, bookmark, account selection, or prior UI knowledge. Distinguish official documentation, repository evidence, user confirmation, and authenticated-screen observation; never invent controls or claim an unobserved screen was verified.
