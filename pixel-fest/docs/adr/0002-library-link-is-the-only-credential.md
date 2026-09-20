# The Library link is the only credential

Cloud storage has no accounts, logins or personal data. A **Library** is opened by its **Library link**, which contains a random UUID (v4, 122 bits of entropy). Anyone with the link has full access, and a lost link cannot be recovered. We chose this over email/password or magic-link accounts because the goal is to store nothing about people: there is nothing to leak, nothing to comply with, and no sign-up friction.

The UUID lives in the URL fragment (`/#/l/<uuid>`), so browsers never send it to the server, nginx or the outer reverse proxy, and it stays out of access logs and Referer headers. The app sends it to the API in an `Authorization` header. The database stores only a SHA-256 hash of it, so a leaked backup contains no working links.

## Consequences

- Anyone who obtains the link owns the **Library**, including deleting it. The UI must warn about this when the link is first shown and when a Project is shared.
- Sharing a single **Project** is not possible; people share a `.pixelfest.json` file instead.
- Because creating a **Library** needs no identity, abuse is limited by per-IP rate limits, a 250-**Project** cap per **Library**, a 1 MB cap per **Project**, and purging **Libraries** unused for 12 months.
- The browser remembers the last-used link in `localStorage`, with a "forget on this device" action.
