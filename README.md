# eTeach KPI Tracker

Offline-capable KPI tracker built with Vite, React, Tailwind CSS, local fonts, and bundled Font Awesome icons.

## Local Development

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
```

The built web app is written to `dist/`.

## GitHub Pages

This repo includes `.github/workflows/deploy.yml`.

When pushed to the `main` branch, GitHub Actions will:

1. Install dependencies with `npm ci`
2. Build the app with `VITE_BASE_PATH=/eteach-kpi-tracker/`
3. Publish `dist/` to GitHub Pages

If the GitHub repository name changes, update `VITE_BASE_PATH` in `.github/workflows/deploy.yml`.

## Windows App

The Electron portable build remains available:

```bash
npm run dist:win
```

Only run that after the source web app is ready to package.
