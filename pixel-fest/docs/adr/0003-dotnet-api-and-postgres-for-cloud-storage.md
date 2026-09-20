# A .NET API and Postgres store the Libraries

Cloud storage is a small ASP.NET Core API in front of PostgreSQL, added as two more services in `docker-compose.yml` beside the existing nginx frontend. Nginx proxies `/api` to the API, so the browser sees one origin and needs no CORS. We chose a custom API over PostgREST/Supabase because access is by a secret link rather than a database role, which fits row-level security poorly, and over SQLite because Postgres was the stated preference.

Each **Project** is one row holding the versioned JSON string from ADR 0001 as an opaque blob, plus real columns for name, Canvas size, thumbnail, `updated_at` and a `revision` number. The server never parses the blob, so format migrations stay in the client. A save must present the revision it started from; a stale revision is rejected so the client can ask the user whether to keep their version or load the other one.

## Consequences

- The repo now has two languages (TypeScript frontend, C# backend) and two build stages in the Dockerfiles.
- Postgres data lives in a named Docker volume with no published port. There are no backups for now; a nightly `pg_dump` container can be added later.
- The same compose file runs on Docker Desktop on Windows and on the Ubuntu server.
