# LINK 0.1.1

LINK is an Expo/React Native social MVP focused on meeting people IRL, exchanging a LINK card/QR, saving people and continuing in chat.

## GitHub → Expo Snack workflow

This repository is intentionally set up like the previous Snack launcher projects.

- `App.js` contains the LINK Expo app.
- `index.html` is **not the app website**. It is a GitHub Pages launcher that generates/opens a new Expo Snack from the latest `App.js` in this repository.
- `.github/workflows/pages.yml` publishes only that launcher to GitHub Pages.

### Use

1. Upload this repository to GitHub with `App.js` and `index.html` in the repository root.
2. In **Settings → Pages**, choose **GitHub Actions** as the source.
3. Open the generated GitHub Pages URL.
4. Tap **Vytvořit nový Snack**.
5. The launcher verifies `App.js`, then opens Expo Snack with LINK and its required dependencies.
6. Save the Snack in Expo if you want a persistent Snack URL.

The launcher automatically detects `OWNER/REPO` from a normal `https://OWNER.github.io/REPO/` GitHub Pages URL. For testing elsewhere, it also supports:

`?owner=OWNER&repo=REPO&branch=main`

## App appearance

LINK starts in Light mode. The app includes System / Light / Dark appearance controls.
