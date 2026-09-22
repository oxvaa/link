# LINK 0.2 — Social Core

LINK is an Expo/React Native social prototype built around meeting people IRL, mutually LINKing, and continuing the conversation privately.

## What is new in 0.2

- Local Accounts Lab: switch between multiple accounts stored on one device.
- Create additional local test accounts.
- Send LINK requests between local accounts and accept/decline them from the other side.
- Shared local conversations: send a message as one account, switch identity, and reply as the other account.
- Per-account notifications and unread states.
- Chat 2.0: replies, reactions, read receipts, mock photo/voice attachments, delete-own-message flow and typing UI.
- People profiles, status, socials and privacy controls.
- Moments with camera capture, captions and a 24-hour-style feed.
- Light mode by default with System / Light / Dark controls.

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
5. The launcher verifies the latest `App.js` and opens Expo Snack with the required dependencies.
6. Save the Snack to your Expo account if you want a persistent Snack URL.

The launcher detects `OWNER/REPO` from a normal `https://OWNER.github.io/REPO/` Pages URL. For manual testing it also supports `?owner=OWNER&repo=REPO&branch=main`.

## Local Accounts Lab

The local account system is deliberately device-local so the complete social flow can be tested before adding a backend. For example: send a LINK request from Šimi to Alex, switch to Alex, accept it, open chat, send a message, switch back to Šimi and reply.
