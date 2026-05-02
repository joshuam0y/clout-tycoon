# Clout Tycoon

Neon idle / clicker-style **influencer agency** game: earn **Clout**, hire talent, drop structures that buff nearby creators, take **brand deals**, and **prestige** for permanent multipliers. Built with **React** and **Vite**.

**Last updated:** May 2, 2026

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Build

```bash
npm run build
npm run preview   # optional: serve production build locally
```

Output is in `dist/`.

## Deploy on Vercel

- Connect the GitHub repo and import the project.
- Framework: **Vite** (see `vercel.json`).
- Build command: `npm run build` — output directory: **`dist`**.
- If you see **403** on the live URL, check **Deployment Protection** in project settings and ensure the app’s **root directory** matches where this `package.json` lives.

## How to play (short)

1. **Post Content** for Clout.
2. Use the **Agency Shop** to hire **influencers** or **build** structures; click the **infinite grid** to place (drag to pan).
3. Accept or decline **brand deals**; they move **reputation**, which scales income.
4. **Prestige** when your **this-run** Clout bar is full (lifetime Clout and gems are kept in logic; persistence may be disabled in dev — see `src/utils/persistence.js`).
5. **How to play** in the UI opens a full guide; **Premium Shop** uses optional gem boosts.

## Project layout

| Path | Role |
|------|------|
| `src/App.jsx` | Shell, panels, modals |
| `src/hooks/useGameState.js` | Game loop, economy, saves |
| `src/data/gameData.js` | Influencers, buildings, deals, achievements |
| `src/components/GameWorld.jsx` | Grid, panning, blueprint starter |
| `src/utils/persistence.js` | Save/load (can be toggled off for fresh sessions) |

## License

Private / as specified by the repository owner.
