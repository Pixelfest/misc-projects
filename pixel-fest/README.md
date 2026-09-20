# Pixel Fest

Draw low-resolution pixel art and animations (up to 128×128) and export them as animated WebP.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173. In VS Code, press F5 and pick "Pixel Fest (Chrome)" or "(Edge)".
The app must be served by Vite: opening `index.html` with a plain static server (e.g. Live Server) fails
because the browser is sent raw `.ts` files. To use a static server, serve the built `dist/` folder instead.

## Deploy with Docker

Only Docker is needed on the server (Node and .NET are not): the images build the app and the API themselves.
Create a `.env` file next to `docker-compose.yml` first (see `.env.example`) with a database password:

```bash
cp .env.example .env   # then edit POSTGRES_PASSWORD
docker compose up -d --build
```

This builds and (re)starts three containers in the background, on http://localhost:8088. They restart
automatically after a reboot. Stop and remove them with `docker compose down` (the database volume stays).

| Container | Role |
| --- | --- |
| `pixel-website` | nginx serving the app and proxying `/api/` to the API |
| `pixel-api` | ASP.NET Core API for cloud storage |
| `pixel-db` | PostgreSQL, data in the `pixel-db-data` volume, no published port. Not backed up. |

## Cloud storage

Choose "Save to cloud…" in the menu to create a **Library**. You get a private link
(`https://<host>/#/l/<uuid>`) and that link is the only credential: there are no accounts and no email, and a lost
link cannot be recovered. The open project saves automatically every 10 seconds while it has changes. A Library holds up
to 250 projects of up to 1 MB each and is deleted after 12 months without being opened. See `docs/adr/0002` and `0003`.

For `npm run dev`, the API must also be reachable on `localhost:8080` (Vite proxies `/api` there); the simplest way is
`docker compose up -d` and running the site from port 8088 instead.

On a machine with Node, `npm run deploy` and `npm run undeploy` do the same.

The container speaks plain HTTP only (port 80 inside, 8088 on the host). TLS, hostname and routing are left to
whatever reverse proxy runs on the server: point it at `http://<host>:8088`. The app uses relative paths, so it
also works under a subpath such as `/pixel/`.
