# Current Tap In project

Updated: 2026-10-30, America/Chicago. Read USER_SCOPE.md before status reports or edits and INSTRUCTION_CLARITY.md before any navigation/install instructions. They record explicit user requirements and supersede conflicting historical checklists.

## Current verified state

- The cloud environment is running. Do not repeat environment creation.
- Main at assessment commit 5d5ad71 passes all six current synthetic suites and source/configuration checks. This is repository evidence, not live application verification.
- Auto-merge workflow is installed through PR #26. GitHub currently enables auto-merge and squash merging, but main has no required check contexts. The workflow deliberately refuses to merge without required synthetic-checks. Restoring that requirement through this connection failed with GitHub HTTP 403: Resource not accessible by integration. No independent-review requirement should be added for this sole-owner workflow.
- PR #25 was closed without merging. Its uploaded source snapshots and instruction/scope rules are being recovered in a documentation/source-evidence PR; runtime source files are unchanged in that recovery.
- The exact four user uploads are preserved under integrations/source-snapshots/2026-10-30/, with project/editor mappings and hashes. Consult these before asking the user to supply those files again. Archival evidence is distinct from maintained source and independently verified installed equality.
- The user confirmed the existing Case form view is Case_Form. No replacement form is needed.
- The earlier Sheet validation repair was completed and read back without record-value changes. That evidence does not install repository scripts or AppSheet settings.

## Work still pending

1. Restore required synthetic-checks on main, leaving independent approval optional. The connected integration cannot change branch-protection settings; see AUTO_MERGE.md for the workflow policy.
2. Recover only the relevant generator mapping/dependency/retry fixes and meaningful adapter tests. Do not restore changes to user-confirmed working components from the closed PR.
3. Prepare a generator-only installation handoff using the existing scripts as dependencies. No new live source equality, AppSheet bot/view configuration, or end-to-end generation test is established by Git merges.
4. Google Voice remains inactive. Its incremental-message design is in VOICE_IMPORT_PROCESS.md, not implemented source. The requested 15-second native timer is unsupported. Architecture selection between event-driven Gmail notifications and one-minute native polling remains pending; see VOICE_INSTALLATION_EVIDENCE.md.
5. Complete remaining AppSheet setup and an explicitly scoped fictional live test through the user-completed browser workflow. Never use operational records as fixtures.

## Stable project rules

Preserve the existing app, Jotform, custom layouts, archives, keys, ownership, scripts, and triggers. Use Client rows and child Case rows linked by CLIENTROWID. Exact resources are in config/project-registry.json and physical headers in config/live-schema.snapshot.json. Preserve reference/TERMINOLOGY_V1_2026-10-23.md unchanged; latest explicit user instructions control. History advice never makes eligibility decisions, merges identities, or submits messages/requests automatically.

No operational records or secrets are included in this recovery. GitHub merges do not install Apps Script or save AppSheet settings.
