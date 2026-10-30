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

## Verified installation and operation

- [PR #26](https://github.com/mscott1000/tap-in-workflow/pull/26) installed the workflow on main.
- The user restored required `synthetic-checks` and Codex verified the context is bound to GitHub Actions app 15368. The earlier missing-check/HTTP-403 setting problem is resolved by that user-completed change, not a pending installation blocker.
- [PR #28](https://github.com/mscott1000/tap-in-workflow/pull/28) demonstrated end-to-end operation: `app/github-actions` enabled auto-merge and performed its squash merge into main at `77542212e659f79e0e50bcef448d57deb096e328`.
- The PR's [enrollment run](https://github.com/mscott1000/tap-in-workflow/actions/runs/41124337996) and [required verification run](https://github.com/mscott1000/tap-in-workflow/actions/runs/41124337950) both succeeded.
- There is no mandatory independent-review gate blocking the sole-owner workflow. GitHub currently reports required-check enforcement as `non_admins`; this workflow never uses admin bypass.

Older failed enrollment runs predate the restored requirement and are historical evidence, not current failures. Future failures should be diagnosed from the affected run and current settings. The workflow still stops if the required check is removed or unreadable.
