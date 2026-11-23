# GAMEVERSE

**Your universe. Your games.**

An independent game storefront for browser-playable and downloadable games.

## Project structure

- `index.html` — responsive storefront (HTML, CSS and JavaScript)
- `games/` — game builds and release files (add folders per game)
- `assets/` — logos, screenshots, covers and other media
- `backend/` — future API and server-side services
- `docs/` — publishing and development guides

## Run locally

Open `index.html` in a browser, or serve the repository root with a local static web server.

## Add a game

Edit the `GAMES` array near the bottom of `index.html`. Each game uses this metadata shape:

```js
{
  id: "my-game",
  name: "MY GAME",
  genre: "Arcade · Platformer",
  type: "Free", // Free, Premium, or Coming Soon
  cover: "MY GAME",
  description: "A short description of the game.",
  playUrl: "games/my-game/index.html", // optional HTML5 build
  downloadUrl: "games/my-game/my-game-windows.zip", // optional download
  featured: true
}
```

For GDevelop browser games, export as HTML5 and place the exported files in `games/my-game/`. Set `playUrl` to that folder's `index.html`. For desktop releases, upload a packaged build and set `downloadUrl` to its path.

## Languages and runtimes

- HTML/CSS/JavaScript: storefront and browser games.
- GDevelop: export games to HTML5 for browser play, or desktop builds for download.
- Python and Java: appropriate for future backend services, APIs, tools, or standalone apps. They are not directly executable as ordinary browser games; run them on a server or package them appropriately.

## Deployment with GitHub Pages

1. Open repository **Settings → Pages**.
2. Under **Build and deployment**, select **Deploy from a branch**.
3. Select branch `main` and folder `/ (root)`, then Save.
4. Wait for the Pages deployment. The site URL will appear in the Pages settings.

## Current status

Initial storefront scaffold. Game entries are placeholders; actual playable builds, downloadable releases, user accounts, payments, advertising, and a production backend are not yet connected.

## Security

Never commit passwords, API keys, signing keys, private customer data, or payment information to this public repository.
