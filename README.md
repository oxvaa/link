# LINK 0.3 — Gestures & Identity

LINK is an Expo/React Native social prototype built around meeting people IRL, mutually LINKing, and continuing the conversation privately.

## What is new in 0.3

- iOS-style edge swipe back: swipe right from the left edge in chat, scanner and full-screen Moments.
- Swipe a chat message right to reply instantly.
- Profile photos from the photo library or camera, including crop and remove controls.
- Real image selection when sending a photo in chat.
- Close LINK favorites: star important people and keep them prioritized in People, Chats and Home.
- Waves: send a lightweight `👋` notification to another local account.
- Editable Instagram and Spotify fields.
- Existing LINK 0.2 local accounts, mutual requests, notifications, Moments and chat data are migrated instead of being wiped.
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
5. The launcher verifies the latest `App.js` and opens Expo Snack with the required dependencies, including `expo-image-picker`.
6. Save the Snack to your Expo account if you want a persistent Snack URL.

The launcher detects `OWNER/REPO` from a normal `https://OWNER.github.io/REPO/` Pages URL. For manual testing it also supports `?owner=OWNER&repo=REPO&branch=main`.

## Local Accounts Lab

The local account system is deliberately device-local so the complete social flow can be tested before adding a backend. Send a LINK request from one account, switch identity, accept it, chat from both sides, send Waves, and mark people as Close LINKs.
