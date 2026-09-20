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

```bash
npm run deploy
```

This builds the image and (re)starts a single container named `pixel` in the background, replacing the
previous one, on http://localhost:8088. It restarts automatically after a reboot. Stop and remove it with
`npm run undeploy`.

Without npm: `docker compose up -d --build`.
