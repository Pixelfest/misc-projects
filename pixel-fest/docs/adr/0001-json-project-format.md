# Projects are saved as versioned JSON with palette-indexed pixels

A **Project** is saved as a `.pixelfest.json` file with a `version` field, a shared color array, and per-**Frame** pixel data stored as compressed indices into that array, base64-encoded. We chose this over a custom binary format, a zip of PNGs, or reusing the exported WebP because at most 128×128 pixels the files stay small (typically under 20 KB), diff cleanly in git, and are easy to migrate by version. A binary format can be added later if file size ever matters.

## Consequences

- Undo history is not stored in the file.
- Cloud storage (ADR 0003) stores the same JSON string per **Project**. The earlier IndexedDB autosave was removed when cloud storage was added.
- Exported WebP is one-way: it cannot be loaded back as a **Project**.
