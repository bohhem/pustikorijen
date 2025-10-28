## Generation management improvements (2025-02-14)

- Backend now accepts an optional `generationNumber` when creating or updating a person. Only branch Gurus or SuperGurus can set or change it.
- Creating a person or adjusting parents/generation triggers a full branch generation recalculation to keep the tree consistent.
- Frontend expose a “Generation” panel for Gurus on the add/edit forms, with validation hints and helper copy.
- Non-guru users continue to rely on auto-generated values and the UI hides the manual override.
