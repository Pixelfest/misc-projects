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

## Docker

```bash
docker build -t pixel-fest .
docker run -p 8080:80 pixel-fest
```

or `docker compose up --build`, then open http://localhost:8080.
