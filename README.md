# LINK — Expo MVP 0.1.1

**Meet IRL. Stay connected.**

LINK is a light-first social app concept for people you meet in real life. It supports Expo on iOS/Android and an Expo Web build that can be deployed automatically to GitHub Pages.

## Included
- Light mode by default
- Appearance switch: System / Light / Dark
- Local profile editing and persistence
- Shareable QR LINK Card
- Real QR scanning with `expo-camera`
- People list + search
- Auto-created conversation after linking
- Local chat persistence
- Demo nearby-link button for testing on one device
- Privacy / safety UI foundations
- Expo Web support
- GitHub Pages deployment workflow

## Entry files
- `index.js` — Expo app entrypoint
- `App.js` — complete LINK application
- `index.html` — repository/root fallback page; the production Expo web build generates `dist/index.html`
- `app.json` — Expo config
- `app.config.js` — automatically configures the GitHub Pages repository subpath during Actions builds

## Run in Expo
```bash
npm install
npx expo start
```

## Run on web
```bash
npm install
npm run web
```

## Production web build
```bash
npm run build:web
```

Expo writes the website to `dist/`, including the production `dist/index.html`.

## GitHub Pages
1. Create a GitHub repository and upload the files from this project root.
2. Make sure your default branch is `main`.
3. In **Settings → Pages**, set **Source** to **GitHub Actions**.
4. Push to `main` or run the **Deploy LINK to GitHub Pages** workflow manually.

The workflow installs dependencies, runs `expo export --platform web`, and deploys `dist/`. `app.config.js` automatically applies the repository subpath during the GitHub Actions build, so project Pages URLs such as `username.github.io/repository-name/` resolve Expo assets correctly.

## MVP limitation
Data currently lives locally on the device/browser. The QR handshake works, but messages are not yet transmitted between two users. Cross-device real-time chat will require authentication plus a backend such as Supabase or Firebase.
