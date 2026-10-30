# Automatic merging of project PRs

The user authorized installation of this policy on 2026-10-30.

`.github/workflows/auto-merge.yml` automatically enables squash auto-merge for every open, non-draft PR from this repository into main. No per-PR enrollment click or personal token is needed. GitHub's required checks and reviews still apply; this workflow never uses admin bypass.

- Immediate enrollment: opening, reopening, marking ready, updating commits, or editing a PR.
- Catch-up: a five-minute scheduled sweep covers existing ready PRs and missed events. GitHub scheduled runs can be delayed; this is not a timing guarantee.
- Manual recovery: workflow_dispatch can request the same sweep.
- Drafts and external-fork PRs are skipped. Future project PRs should be created ready for review when their work is complete.
- The workflow verifies that main requires synthetic-checks before requesting any merge. It stops if that requirement is absent or unreadable.
- It uses GitHub's built-in token with contents/pull-request write permissions. The privileged job never checks out or runs proposed code. Every PR is re-read and its current head SHA matched when enabling auto-merge.
- Already enrolled, closed, wrong-base, or draft PRs are left unchanged. Individual API/merge failures are reported without preventing inspection of the other candidates; a failed sweep is visible in Actions and retried at the next scheduled run.
- A successful merge places repository code/docs in main. It does not install operational scripts or edit external applications.

Installation verification is recorded in CURRENT_PROJECT.md. GitHub must have Allow auto-merge enabled and squash merging allowed. If repository/organization policy blocks the built-in token from merging, the workflow reports that failure; do not weaken branch protection or add credentials to work around it silently.

## Verified installation and current blocker

PR #26 merged on 2026-10-30 at 20:08:30 UTC; the workflow is on main. GitHub permits auto-merge and squash merging. At the subsequent assessment, main had no required status-check contexts. The workflow fails closed in that configuration. Restoring required synthetic-checks through the connected integration returned HTTP 403: Resource not accessible by integration. Runtime enrollment has not been demonstrated successfully. Require synthetic-checks without restoring a mandatory independent-review gate for this sole-owner repository.
