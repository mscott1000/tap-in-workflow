# Tap In Center workflow

Start with [AGENTS.md](AGENTS.md) and [Current project](docs/CURRENT_PROJECT.md).

This private repository supports the existing AppSheet app and Google Sheets. It is not a replacement app.

- [Current project and outstanding work](docs/CURRENT_PROJECT.md)
- [Resource registry](config/project-registry.json)
- [Last observed sheet headers](config/live-schema.snapshot.json)
- [One-proposal process](docs/CHANGE_PROCESS.md)
- [User-completed setup](docs/USER_SETUP.md)
- [Integration code and tests](integrations/README.md)

## Active versus deferred

Repository tests use synthetic data and mocked Google services. Live publishing is disabled. The manual release workflow defaults to an offline plan and contains no credentials.
Merging this repository does not update the live app, run importers, or create Client or Case rows.
Authentication, secure credentials, live-source reconciliation, and the saved cloud environment are user-completed steps in USER_SETUP.md.
AppSheet views, column settings, actions, and bots still require its editor; the repository does not publish those settings through an API.

## Preservation and privacy

The live sheet may contain operational personal/legal information. It is not a fictional test database.
Do not commit client records, messages, transcripts, credentials, or unreviewed app-documentation exports.
Preserve Jotform, archives, custom layouts, and ownership. No routine schema regeneration or physical renaming.
Older docs are historical evidence, not current installation instructions.
