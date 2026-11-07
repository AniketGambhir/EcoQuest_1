# EcoQuest — Play Green, Live Clean

A responsive carbon-footprint estimate tracker and eco-habit game. Log everyday activities, see estimated CO₂e totals, complete missions, and earn Eco Points.

## Features

- Daily, weekly and monthly carbon-estimate summaries
- Activity logging for transport, electricity, food, waste and shopping
- Transparent approximate emission factors
- Green Score, Eco Points, levels and daily missions
- Emissions charts and category breakdowns
- Browser localStorage persistence (no account or backend required)
- Responsive dashboard, insights and leaderboard views

## Run locally

Requirements: Node.js 20 or newer and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (normally http://localhost:5173).

To create a production build:

```bash
npm run build
npm run preview
```

## Notes

- Carbon figures are indicative estimates, not exact measurements. Real emissions vary by location, supplier, vehicle, season and methodology.
- Activity logs and progress are stored in the current browser using localStorage. They do not sync between devices.
- The app uses example activity entries for the first-run demo. Use **Reset demo data** to restore them.
- No live AI service or external API key is configured; advisor-style guidance is presented as in-app suggestions.

## Deploy

This is a standard Vite static site. Build with `npm run build` and publish the generated `dist` folder using GitHub Pages, Netlify, Vercel or another static host.
