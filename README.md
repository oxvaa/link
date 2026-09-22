# LINK 0.4 — Notes, Presence & Liquid Glass

LINK is an Expo/React Native social prototype built around meeting people IRL, mutually LINKing, and continuing the conversation privately.

## What is new in 0.4

- Apple-style floating Liquid Glass bottom navigation powered by `expo-blur`.
- Instagram-style Notes on the Home screen. Notes expire after 24 hours.
- Notes can be shared with all LINKs or only Close LINKs.
- Tap a LINK's Note to reply privately in chat, or use a quick emoji reaction.
- Custom status editor: choose your own status text, icon and color.
- Custom status now appears across People, profiles, chat headers, LINK cards and your own QR card.
- Existing swipe-back gestures, swipe-to-reply, profile photos, Moments, Waves, Close LINK favorites and local accounts remain available.
- Existing local LINK data migrates forward instead of being wiped.
- Light mode remains the default, with System / Light / Dark controls.

## GitHub → Expo Snack workflow

This repository is intentionally set up as a Snack launcher.

- `App.js` contains the complete single-file Expo app.
- `index.html` is the GitHub Pages launcher. It reads the current `App.js` from this repository and opens it as a new Expo Snack.
- `.github/workflows/pages.yml` publishes only the launcher to GitHub Pages.

### Use

1. Upload all repository files to GitHub with `App.js` and `index.html` in the repository root.
2. In **Settings → Pages**, choose **GitHub Actions** as the source.
3. Open the generated GitHub Pages URL.
4. Tap **Vytvořit nový Snack**.
5. The launcher verifies the latest `App.js` and opens Expo Snack with the required dependencies, including `expo-image-picker` and `expo-blur`.
6. Save the Snack to your Expo account if you want a persistent Snack URL.

The launcher detects `OWNER/REPO` from a normal `https://OWNER.github.io/REPO/` Pages URL. For manual testing it also supports `?owner=OWNER&repo=REPO&branch=main`.

## Local Accounts Lab

The local account system is deliberately device-local so the complete social flow can be tested before adding a backend. Send a LINK request from one account, switch identity, accept it, chat from both sides, post Notes, reply to Notes, send Waves, and mark people as Close LINKs.
